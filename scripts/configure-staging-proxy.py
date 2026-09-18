"""Apply staging-only Keycloak buffers and SignalR proxy settings.

Run with sudo from deploy-staging.sh. Preserve all other proxy/TLS settings;
validate before reload and restore the original file on any failure.
"""
import pathlib
import re
import shutil
import subprocess
import tempfile
from urllib.parse import urlsplit

# Read only the public identity URL from the server's untracked environment file.
# Do not source or print the file; it also contains database credentials.
environment = pathlib.Path(".env.staging").read_text()
match = re.search(r"(?m)^KEYCLOAK_URL=(.+)$", environment)
if not match:
    raise RuntimeError("KEYCLOAK_URL is missing from .env.staging")
identity_url = urlsplit(match[1].strip().strip("\"'"))
if identity_url.scheme != "https" or not identity_url.hostname or identity_url.username or identity_url.password:
    raise RuntimeError("KEYCLOAK_URL must be an HTTPS URL without credentials")
DOMAIN = identity_url.hostname

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

# Derive the SignalR upstream from the existing API route, preserving whether
# that route strips /api/. Never hard-code private hosts or ports.
api_pattern = r"(location\s+(?:\^~\s+)?/api/\s*\{)([^{}]*)(\})"
api_matches = list(re.finditer(api_pattern, updated))
if len(api_matches) != 1:
    raise RuntimeError("Expected exactly one staging /api/ location")
api_match = api_matches[0]
upstreams = re.findall(r"proxy_pass\s+([^;]+);", api_match[2])
if len(upstreams) != 1:
    raise RuntimeError("Expected one API upstream")
upstream = urlsplit(upstreams[0].strip())
if upstream.scheme not in ("http", "https") or not upstream.netloc or upstream.query or "$" in upstream.geturl():
    raise RuntimeError("Unsupported API upstream")
target_path = upstream.path + "realtime/" if upstream.path.endswith("/") else upstream.path
target = upstream._replace(path=target_path).geturl()
realtime = f'''location ^~ /api/realtime/ {{
        proxy_pass {target};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 120s;
        # WebSocket/SSE authentication uses a query token; do not log it.
        access_log off;
    }}'''
realtime_pattern = r"location\s+(?:\^~\s+)?/api/realtime/\s*\{[^{}]*\}"
existing_realtime = list(re.finditer(realtime_pattern, updated))
if len(existing_realtime) > 1:
    raise RuntimeError("Multiple realtime proxy locations")
if existing_realtime:
    updated = re.sub(realtime_pattern, lambda _: realtime, updated)
else:
    updated = updated[:api_match.start()] + realtime + "\n    " + updated[api_match.start():]

if updated == original:
    print("Staging identity and realtime proxy already configured", flush=True)
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
    print("Staging identity and realtime proxy updated; Nginx validated and reloaded", flush=True)
