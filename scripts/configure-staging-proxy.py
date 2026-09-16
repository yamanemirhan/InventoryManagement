"""Apply staging-only Keycloak response buffers to the active Nginx file.

Run with sudo from deploy-staging.sh. Preserve all other proxy/TLS settings;
validate before reload and restore the original file on any failure.
"""
import pathlib
import re
import shutil
import subprocess
import tempfile

DOMAIN = "staging-inventory-yamanemirhan.duckdns.org"

# Report only the error category/count, never authentication URLs or cookies.
for log in pathlib.Path("/var/log/nginx").glob("*error*.log"):
    with log.open("rb") as stream:
        stream.seek(max(0, log.stat().st_size - 1024 * 1024))
        lines = stream.read().decode(errors="replace").splitlines()
    count = sum(DOMAIN in line and "upstream sent too big header" in line for line in lines)
    if count:
        print(f"Staging upstream response-header overflow: {count} recent errors", flush=True)

config = subprocess.run(["nginx", "-T"], check=True, capture_output=True, text=True).stdout
sections = re.split(r"^# configuration file (.+):\n", config, flags=re.M)
candidates = set()
for i in range(1, len(sections), 2):
    text = sections[i + 1]
    if re.search(r"server_name\s+" + re.escape(DOMAIN) + r"\s*;", text) and re.search(r"location\s+(?:\^~\s+)?/identity/\s*\{", text):
        candidates.add(pathlib.Path(sections[i]).resolve())
if len(candidates) != 1:
    raise RuntimeError("Expected exactly one active staging identity proxy file")
path = candidates.pop()
if not path.is_relative_to("/etc/nginx"):
    raise RuntimeError("Staging configuration must be inside /etc/nginx")
original = path.read_text()
# Refuse mixed-host files so a staging change cannot affect production.
hosts = re.findall(r"server_name\s+([^;]+);", original)
if any(host.strip() != DOMAIN for host in hosts):
    raise RuntimeError("Refusing to modify a configuration shared with another hostname")
pattern = r"(location\s+(?:\^~\s+)?/identity/\s*\{)([^{}]*)(\})"
settings = {"proxy_buffer_size": "32k", "proxy_buffers": "8 32k", "proxy_busy_buffers_size": "64k"}
def update(match):
    body = match[2]
    for directive, value in settings.items():
        body = re.sub(r"(?m)^\s*" + directive + r"\s+[^;]+;", "", body)
    additions = "".join(f"\n        {key} {value};" for key, value in settings.items())
    return match[1] + additions + body + match[3]
updated, count = re.subn(pattern, update, original)
if count != 1:
    raise RuntimeError("Expected exactly one staging /identity/ location")
if updated == original:
    print("Staging identity proxy buffers already configured", flush=True)
else:
    backup_dir = pathlib.Path("/var/backups/inventory-nginx")
    backup_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=backup_dir, prefix="staging-", suffix=".conf", delete=False) as backup:
        backup_path = pathlib.Path(backup.name)
    shutil.copy2(path, backup_path)
    try:
        path.write_text(updated)
        subprocess.run(["nginx", "-t"], check=True)
        subprocess.run(["systemctl", "reload", "nginx"], check=True)
    except BaseException:
        shutil.copy2(backup_path, path)
        subprocess.run(["nginx", "-t"], check=True)
        subprocess.run(["systemctl", "reload", "nginx"], check=True)
        raise
    print("Staging identity proxy buffers updated; Nginx validated and reloaded", flush=True)
