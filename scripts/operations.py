#!/usr/bin/env python3
"""Inventory operations. Root-only config, encrypted backups and isolated restore drills."""
import argparse
import datetime as dt
import fcntl
import hashlib
import json
import os
import pathlib
import secrets
import shutil
import smtplib
import ssl
import subprocess
import sys
import tempfile
import time
import urllib.request
from email.message import EmailMessage

APP = pathlib.Path("/opt/inventory-management")
CONFIG = pathlib.Path("/etc/inventory-ops")
STATE = pathlib.Path("/var/lib/inventory-ops")
BACKUPS = pathlib.Path("/var/backups/inventory")
UTC = dt.timezone.utc

def run(args, *, data=None, env=None, stdout=None):
    result = subprocess.run(args, input=data, stdout=stdout or subprocess.PIPE,
                            stderr=subprocess.PIPE, env=env, timeout=600)
    if result.returncode:
        # stderr may contain connection strings or SQL row data: never emit it.
        raise RuntimeError(f"{pathlib.Path(args[0]).name} failed (exit {result.returncode})")
    return result.stdout

def env_file(path):
    values = {}
    for line in path.read_text().splitlines():
        if not line.strip() or line.lstrip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip("\"'")
    return values

def prepare():
    for path in (CONFIG, STATE, BACKUPS):
        path.mkdir(mode=0o700, parents=True, exist_ok=True)
        path.chmod(0o700)

def settings():
    return json.loads((CONFIG / "config.json").read_text()) if (CONFIG / "config.json").exists() else {}

def save(path, value):
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(value, indent=2))
    temporary.chmod(0o600)
    temporary.replace(path)

def stages():
    return [s for s in ("staging", "production") if (APP / f".env.{s}").exists()]

def app_env(stage):
    source = env_file(APP / f".env.{stage}")
    values = {}
    for part in source["DATABASE_CONNECTION_STRING"].split(";"):
        if "=" in part:
            key, value = part.split("=", 1)
            values[key.strip().lower()] = value.strip()
    result = dict(os.environ)
    result.update(PGHOST=values["host"], PGPORT=values.get("port", "5432"),
                  PGDATABASE=values["database"], PGUSER=values.get("username", values.get("user id", "")),
                  PGPASSWORD=values["password"], PGSSLMODE="require")
    return result

def pg_command(env):
    return ["docker", "run", "--rm", "--network", "host"] + [
        item for key in ("PGHOST", "PGPORT", "PGDATABASE", "PGUSER", "PGPASSWORD", "PGSSLMODE")
        for item in ("--env", key)
    ] + ["postgres:17-alpine"]

def identity_container(stage):
    ids = run(["docker", "ps", "-q", "--filter", f"label=com.docker.compose.project=inventory-identity-{stage}",
               "--filter", "label=com.docker.compose.service=identity-db"]).decode().split()
    if len(ids) > 1:
        raise RuntimeError("Multiple identity database containers")
    return ids[0] if ids else None

def inspect():
    result = {"environments": stages(), "tools": {p: bool(shutil.which(p)) for p in ("docker", "gpg", "systemctl")},
              "identity": {s: bool(identity_container(s)) for s in stages()}}
    result["containers"] = [json.loads(line) for line in run(
        ["docker", "ps", "--format", '{"name":"{{.Names}}","status":"{{.Status}}","image":"{{.Image}}"}']).decode().splitlines()]
    result["disk"] = {"freeBytes": shutil.disk_usage("/var").free}
    result["loadAverage"] = os.getloadavg()
    memory = dict(line.split(":", 1) for line in pathlib.Path("/proc/meminfo").read_text().splitlines())
    result["memoryKiB"] = {key: int(memory[key].split()[0]) for key in
                           ("MemTotal", "MemAvailable", "SwapTotal", "SwapFree")}
    result["containerResources"] = [json.loads(line) for line in run(
        ["docker", "stats", "--no-stream", "--format",
         '{"name":"{{.Name}}","cpu":"{{.CPUPerc}}","memory":"{{.MemUsage}}","pids":"{{.PIDs}}"}']).decode().splitlines()]
    result["operationsInstalled"] = (CONFIG / "config.json").exists()
    print(json.dumps(result, indent=2))

def backup():
    if not (CONFIG / "backup-passphrase").exists():
        raise RuntimeError("Backup encryption passphrase is not configured")
    stamp = dt.datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    entries = []
    with tempfile.TemporaryDirectory(prefix="inventory-backup-") as scratch:
        scratch = pathlib.Path(scratch)
        for stage in stages():
            env = app_env(stage)
            sources = [(f"{stage}-application", pg_command(env) + ["pg_dump", "--format=custom", "--no-owner", "--no-acl"], env)]
            identity = identity_container(stage)
            if identity:
                sources.append((f"{stage}-identity", ["docker", "exec", identity, "pg_dump", "-U", "keycloak", "-d", "keycloak", "--format=custom", "--no-owner", "--no-acl"], None))
            for name, command, environment in sources:
                dump = scratch / (name + ".dump")
                with dump.open("wb") as stream:
                    run(command, env=environment, stdout=stream)
                target = BACKUPS / (stamp + "-" + name + ".dump.gpg")
                partial = target.with_suffix(".partial")
                run(["gpg", "--batch", "--yes", "--pinentry-mode", "loopback", "--passphrase-file",
                     str(CONFIG / "backup-passphrase"), "--symmetric", "--cipher-algo", "AES256",
                     "--output", str(partial), str(dump)])
                partial.chmod(0o600)
                partial.replace(target)
                entries.append({"name": target.name, "source": name, "bytes": target.stat().st_size,
                                "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
    if not entries:
        raise RuntimeError("No configured databases found")
    manifest = {"createdAtUtc": dt.datetime.now(UTC).isoformat(), "files": entries}
    save(BACKUPS / (stamp + "-manifest.json"), manifest)
    save(STATE / "latest-backup.json", manifest)
    # Only completed files in the dedicated backup directory are eligible for retention.
    cutoff = time.time() - 14 * 86400
    for item in BACKUPS.iterdir():
        if item.is_file() and item.suffix in (".gpg", ".json") and item.stat().st_mtime < cutoff:
            item.unlink()
    print(json.dumps({"backup": "completed", "sources": [e["source"] for e in entries], "encrypted": True}))

def restore_drill():
    manifest = json.loads((STATE / "latest-backup.json").read_text())
    name = "inventory-restore-" + secrets.token_hex(8)
    env = dict(os.environ, POSTGRES_PASSWORD=secrets.token_urlsafe(32))
    restored = []
    try:
        run(["docker", "run", "-d", "--name", name, "--label", "inventory.restore-drill=true",
             "--network", "none", "--memory", "768m", "--cpus", "1", "--env", "POSTGRES_PASSWORD",
             "--tmpfs", "/var/lib/postgresql/data:rw,size=512m", "postgres:17-alpine"], env=env)
        for attempt in range(30):
            ready = subprocess.run(["docker", "exec", name, "pg_isready", "-U", "postgres"], capture_output=True)
            if ready.returncode == 0:
                break
            time.sleep(1)
        else:
            raise RuntimeError("Isolated restore database did not become ready")
        with tempfile.TemporaryDirectory(prefix="inventory-restore-") as scratch:
            for number, entry in enumerate(manifest["files"]):
                archive = (BACKUPS / entry["name"]).resolve()
                if archive.parent != BACKUPS or archive.suffix != ".gpg":
                    raise RuntimeError("Invalid backup path")
                if hashlib.sha256(archive.read_bytes()).hexdigest() != entry["sha256"]:
                    raise RuntimeError("Backup checksum mismatch")
                dump = pathlib.Path(scratch) / "restore.dump"
                run(["gpg", "--batch", "--yes", "--pinentry-mode", "loopback", "--passphrase-file",
                     str(CONFIG / "backup-passphrase"), "--decrypt", "--output", str(dump), str(archive)])
                database = f"drill_{number}"
                run(["docker", "exec", name, "createdb", "-U", "postgres", database])
                with dump.open("rb") as stream:
                    result = subprocess.run(["docker", "exec", "-i", name, "pg_restore", "-U", "postgres",
                                             "-d", database, "--exit-on-error", "--no-owner", "--no-acl"],
                                            stdin=stream, capture_output=True, timeout=600)
                if result.returncode:
                    raise RuntimeError("Restore failed; live databases were not modified")
                table = "realm" if entry["source"].endswith("identity") else '"Products"'
                count = run(["docker", "exec", name, "psql", "-U", "postgres", "-d", database, "-At",
                             "-c", f"SELECT count(*) FROM {table}"]).decode().strip()
                restored.append({"source": entry["source"], "referenceRows": int(count)})
                dump.unlink()
        save(STATE / "latest-restore.json", {"completedAtUtc": dt.datetime.now(UTC).isoformat(), "restored": restored})
        print(json.dumps({"restoreDrill": "passed", "isolated": True, "restored": restored}))
    finally:
        exists = subprocess.run(["docker", "inspect", "--format", '{{index .Config.Labels "inventory.restore-drill"}}', name], capture_output=True)
        if exists.returncode == 0 and exists.stdout.strip() == b"true":
            run(["docker", "rm", "-f", name])

def smtp_settings():
    source = env_file(pathlib.Path("/opt/inventory-identity/staging/.env.identity"))
    if source.get("SMTP_USERNAME") and source.get("SMTP_PASSWORD"):
        return source
    # SMTP was configured in Keycloak rather than the compose environment.
    # Read it locally as root; never send credentials or recipient details to the CI runner.
    container = identity_container("staging")
    if not container:
        raise RuntimeError("Staging identity database is unavailable")
    query = "SELECT json_object_agg(s.name,s.value) FROM realm_smtp_config s JOIN realm r ON r.id=s.realm_id WHERE r.name='inventory-staging'"
    raw = run(["docker", "exec", container, "psql", "-U", "keycloak", "-d", "keycloak", "-At", "-c", query])
    values = json.loads(raw) or {}
    mapping = {"from": "FROM", "host": "HOST", "port": "PORT", "user": "USERNAME",
               "password": "PASSWORD", "starttls": "STARTTLS", "ssl": "SSL"}
    result = {"SMTP_" + target: values[key] for key, target in mapping.items() if key in values}
    if not result.get("SMTP_USERNAME") or not result.get("SMTP_PASSWORD"):
        raise RuntimeError("SMTP credentials are not configured")
    return result

def notify(subject, message):
    config = settings()
    recipient = config.get("alertRecipient")
    if not recipient:
        raise RuntimeError("Alert recipient is not configured")
    smtp = smtp_settings()
    mail = EmailMessage()
    mail["Subject"] = "[Inventory] " + subject
    mail["From"] = smtp["SMTP_FROM"]
    mail["To"] = recipient
    mail.set_content(message)
    context = ssl.create_default_context()
    port = int(smtp.get("SMTP_PORT", "587"))
    client = smtplib.SMTP_SSL(smtp["SMTP_HOST"], port, timeout=20, context=context) if smtp.get("SMTP_SSL", "").lower() == "true" else smtplib.SMTP(smtp["SMTP_HOST"], port, timeout=20)
    with client:
        if smtp.get("SMTP_SSL", "").lower() != "true":
            client.starttls(context=context)
        client.login(smtp["SMTP_USERNAME"], smtp["SMTP_PASSWORD"])
        client.send_message(mail)

def monitor():
    previous = json.loads((STATE / "monitor.json").read_text()) if (STATE / "monitor.json").exists() else {}
    failures = []
    # Only staging is onboarded to the identity-enabled application today.
    # Production liveness can be enabled explicitly during its release.
    for stage in settings().get("monitorStages", ["staging"]):
        values = env_file(APP / f".env.{stage}")
        origin = values.get("KEYCLOAK_URL", "").split("/identity")[0]
        for route in ("/", "/api/health", "/api/health/ready", f"/identity/realms/inventory-{stage}/.well-known/openid-configuration"):
            try:
                with urllib.request.urlopen(origin + route, timeout=15) as response:
                    if response.status != 200:
                        raise RuntimeError("Non-success response")
            except Exception:
                failures.append(stage + ":" + route)
    latest = STATE / "latest-backup.json"
    if not latest.exists() or time.time() - latest.stat().st_mtime > 26 * 3600:
        failures.append("backup:missing-or-stale")
    if shutil.disk_usage("/var").free < 2 * 1024**3:
        failures.append("disk:less-than-2GiB")
    current = {"failures": sorted(failures), "checkedAtUtc": dt.datetime.now(UTC).isoformat()}
    # Require two consecutive failed probes and only send transitions/reminders.
    count = previous.get("consecutiveFailures", 0) + 1 if failures else 0
    current["consecutiveFailures"] = count
    last_sent = previous.get("lastAlertEpoch", 0)
    current["lastAlertEpoch"] = last_sent
    if failures and count >= 2 and (sorted(failures) != previous.get("alertedFailures") or time.time() - last_sent > 6 * 3600):
        notify("Service or backup failure", "\n".join(sorted(failures)))
        current["lastAlertEpoch"] = time.time()
        current["alertedFailures"] = sorted(failures)
    elif not failures and previous.get("alertedFailures"):
        notify("Services recovered", "All monitored endpoints, backup freshness and disk checks are healthy.")
    elif failures:
        current["alertedFailures"] = previous.get("alertedFailures", [])
    save(STATE / "monitor.json", current)
    print(json.dumps(current))

def install(recipient):
    if not shutil.which("gpg"):
        raise RuntimeError("Install the distribution gnupg package first")
    passphrase = sys.stdin.buffer.read().strip()
    key = CONFIG / "backup-passphrase"
    if len(passphrase) < 32:
        raise RuntimeError("A backup passphrase of at least 32 bytes is required on stdin")
    if key.exists() and key.read_bytes() != passphrase:
        raise RuntimeError("Existing backup passphrase differs; refusing to invalidate recovery")
    key.write_bytes(passphrase)
    key.chmod(0o600)
    config = settings()
    config.setdefault("monitorStages", ["staging"])
    if recipient:
        if recipient == "self":
            recipient = smtp_settings()["SMTP_USERNAME"]
        config.update(alertRecipient=recipient, smtpEnvFile="/opt/inventory-identity/staging/.env.identity")
    save(CONFIG / "config.json", config)
    destination = pathlib.Path("/opt/inventory-ops/operations.py")
    destination.parent.mkdir(mode=0o755, parents=True, exist_ok=True)
    if pathlib.Path(__file__).resolve() != destination:
        shutil.copy2(__file__, destination)
    destination.chmod(0o700)
    for action, calendar in (("backup", "*-*-* 02:30:00"), ("monitor", None)):
        service = "[Unit]\nDescription=Inventory " + action + "\nAfter=docker.service network-online.target\n[Service]\nType=oneshot\nUser=root\nUMask=0077\nExecStart=/usr/bin/python3 /opt/inventory-ops/operations.py " + action + "\n"
        timer = "[Unit]\nDescription=Inventory " + action + " schedule\n[Timer]\n" + ("OnCalendar=" + calendar + "\nPersistent=true\n" if calendar else "OnBootSec=2min\nOnUnitActiveSec=2min\n") + "[Install]\nWantedBy=timers.target\n"
        pathlib.Path(f"/etc/systemd/system/inventory-{action}.service").write_text(service)
        pathlib.Path(f"/etc/systemd/system/inventory-{action}.timer").write_text(timer)
    run(["systemctl", "daemon-reload"])
    run(["systemctl", "enable", "--now", "inventory-backup.timer"])
    if config.get("alertRecipient"):
        run(["systemctl", "enable", "--now", "inventory-monitor.timer"])
    print(json.dumps({"installed": True, "alertsConfigured": bool(config.get("alertRecipient"))}))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["inspect", "install", "backup", "restore-drill", "monitor", "alert-check", "status"])
    parser.add_argument("--recipient", default="")
    args = parser.parse_args()
    if os.geteuid() != 0:
        raise RuntimeError("Run through sudo")
    prepare()
    with (STATE / "operations.lock").open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if args.action == "inspect": inspect()
        elif args.action == "install": install(args.recipient)
        elif args.action == "backup": backup()
        elif args.action == "restore-drill": restore_drill()
        elif args.action == "monitor": monitor()
        elif args.action == "alert-check": notify("Alert channel verification", "Inventory operational alerts are configured."); print('{"alertCheck":"sent"}')
        else:
            for path in STATE.glob("*.json"):
                print(path.name + ": " + path.read_text())

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"operationFailed": type(error).__name__, "message": str(error)}), file=sys.stderr)
        sys.exit(1)
