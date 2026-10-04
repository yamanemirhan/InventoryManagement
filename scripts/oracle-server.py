#!/usr/bin/env python3
"""Oracle bootstrap and identity configuration. Never print environment secrets."""
import argparse
import base64
import datetime as dt
import hashlib
import json
import os
import pathlib
import re
import secrets
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request

APP = pathlib.Path("/opt/inventory-management")
IDENTITY = pathlib.Path("/opt/inventory-identity")
RUNTIME = pathlib.Path("/opt/inventory-runtime")
PORTS = {"production": (3000, 8080, 8180, 55432, 55435),
         "staging": (3001, 8081, 8181, 55434, 55433)}
DOMAINS = {"production": "inventory-yamanemirhan.duckdns.org",
           "staging": "staging-inventory-yamanemirhan.duckdns.org"}
PROVIDER_KEYS = ("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "SMTP_FROM", "SMTP_HOST",
                 "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_STARTTLS", "SMTP_SSL")


def env_file(path):
    values = {}
    for line in path.read_text().splitlines():
        if not line.strip() or line.lstrip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key.strip()] = value
    return values


def write_env(path, values):
    # Single quotes prevent Compose from expanding $ in provider secrets.
    if any("'" in str(v) or "\n" in str(v) or "\r" in str(v) for v in values.values()):
        raise RuntimeError("Environment values must be single-line and contain no single quote")
    owner = APP.stat()
    with tempfile.NamedTemporaryFile(mode="w", dir=path.parent, delete=False) as stream:
        stream.write("".join(f"{key}='{value}'\n" for key, value in values.items()))
        temporary = pathlib.Path(stream.name)
    try:
        temporary.chmod(0o600)
        os.chown(temporary, owner.st_uid, owner.st_gid)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def render_template(path, values):
    # Substitute decoded JSON values, so quotes and backslashes in secrets remain data.
    def render(value):
        if isinstance(value, dict):
            return {key: render(item) for key, item in value.items()}
        if isinstance(value, list):
            return [render(item) for item in value]
        if isinstance(value, str):
            def replace(match):
                key = match[1]
                if key not in values:
                    raise RuntimeError("Missing template variable: " + key)
                return values[key]
            return re.sub(r"\$\{([A-Z_]+)\}", replace, value)
        return value
    return render(json.loads(path.read_text()))


def managed_matches(saved, desired):
    # Keycloak may add optional defaults to config/attributes maps.
    if isinstance(desired, dict):
        return isinstance(saved, dict) and all(managed_matches(saved.get(key), value)
                                              for key, value in desired.items())
    return saved == desired


def theme_digest(directory):
    digest = hashlib.sha256()
    if directory.exists():
        for path in sorted(directory.rglob("*")):
            if path.is_file():
                digest.update(path.relative_to(directory).as_posix().encode())
                digest.update(b"\0")
                digest.update(path.read_bytes())
    return digest.hexdigest()


def prepare(stage, source, providers):
    origin = "https://" + DOMAINS[stage]
    _, _, identity_port, _, identity_db_port = PORTS[stage]
    directory = IDENTITY / stage
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    owner = APP.stat()
    os.chown(directory, owner.st_uid, owner.st_gid)
    directory.chmod(0o700)
    (directory / "realms").mkdir(exist_ok=True, mode=0o755)
    identity_path = directory / ".env.identity"
    values = env_file(identity_path) if identity_path.exists() else {
        "IDENTITY_ENVIRONMENT": stage, "APP_ORIGIN": origin,
        "KEYCLOAK_URL": origin + "/identity",
        "KEYCLOAK_AUTHORITY": origin + f"/identity/realms/inventory-{stage}",
        "IDENTITY_HTTP_PORT": str(identity_port), "IDENTITY_DB_PORT": str(identity_db_port),
        "KEYCLOAK_ADMIN_USERNAME": "identity-admin-" + stage,
        "KEYCLOAK_ADMIN_PASSWORD": secrets.token_hex(32),
        "KEYCLOAK_DB_PASSWORD": secrets.token_hex(32),
        **{key: "" for key in PROVIDER_KEYS}}
    values.update({key: value for key, value in providers.items() if key in PROVIDER_KEYS})
    write_env(identity_path, values)
    definition = render_template(source / "deploy/keycloak/server-realm.template.json",
                                 {"IDENTITY_ENVIRONMENT": stage, "APP_ORIGIN": origin})
    # Import stays secret-free; provider secrets are rendered only in memory after startup.
    config = directory / "config"
    config.mkdir(exist_ok=True, mode=0o700)
    for name in ("google-provider.template.json", "smtp.template.json"):
        shutil.copyfile(source / "deploy/keycloak" / name, config / name)
    themes = source / "deploy/keycloak/themes"
    source_digest = theme_digest(themes)
    theme_stamp = directory / ".theme-source.sha256"
    theme_changed = not theme_stamp.exists() or theme_stamp.read_text() != source_digest
    shutil.copytree(themes, directory / "themes", dirs_exist_ok=True)
    theme_properties = directory / "themes/inventory/login/theme.properties"
    with theme_properties.open("a") as stream:
        stream.write("\ninventoryVersion=" + source_digest + "\n")
    theme_stamp.write_text(source_digest)
    if theme_changed:
        (directory / ".themes-updated").write_text(source_digest)
    realm_path = directory / "realms" / f"inventory-{stage}-realm.json"
    realm_path.write_text(json.dumps(definition, indent=2))
    realm_path.chmod(0o644)
    shutil.copyfile(source / "compose.identity.server.yml", directory / "compose.identity.server.yml")
    app_path = APP / f".env.{stage}"
    app = env_file(app_path) if app_path.exists() else {"APP_DB_PASSWORD": secrets.token_hex(32)}
    if not app.get("APP_DB_PASSWORD"):
        raise RuntimeError("Existing application environment has no APP_DB_PASSWORD; refusing silent credential replacement")
    app.update(APP_ORIGIN=origin, KEYCLOAK_URL=values["KEYCLOAK_URL"],
               KEYCLOAK_AUTHORITY=values["KEYCLOAK_AUTHORITY"],
               GOOGLE_LOGIN_ENABLED=str(bool(values.get("GOOGLE_CLIENT_ID") and values.get("GOOGLE_CLIENT_SECRET"))).lower(),
               DATABASE_CONNECTION_STRING=f"Host=app-db;Port=5432;Database=inventory_{stage};Username=inventory_{stage};Password={app['APP_DB_PASSWORD']};SSL Mode=Disable")
    for target, key in {"HOST": "SMTP_HOST", "PORT": "SMTP_PORT", "USERNAME": "SMTP_USERNAME",
                        "PASSWORD": "SMTP_PASSWORD", "FROM": "SMTP_FROM", "IMPLICITTLS": "SMTP_SSL"}.items():
        app[f"MAIL_{target}_BASE64"] = base64.b64encode(values.get(key, "").encode()).decode()
    write_env(app_path, app)
    runtime = RUNTIME / stage
    runtime.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chown(runtime, owner.st_uid, owner.st_gid)
    runtime.chmod(0o700)
    shutil.copyfile(source / f"compose.{stage}.yml", runtime / f"compose.{stage}.yml")
    verify(stage)
    print(json.dumps({"environment": stage, "prepared": True,
                      "themeRestartRequired": (directory / ".themes-updated").exists(),
                      "googleConfigured": bool(values.get("GOOGLE_CLIENT_ID") and values.get("GOOGLE_CLIENT_SECRET")),
                      "smtpConfigured": all(values.get(k) for k in ("SMTP_HOST", "SMTP_FROM", "SMTP_USERNAME", "SMTP_PASSWORD"))}))


def verify(stage):
    app = env_file(APP / f".env.{stage}")
    identity = env_file(IDENTITY / stage / ".env.identity")
    origin = "https://" + DOMAINS[stage]
    expected = origin + f"/identity/realms/inventory-{stage}"
    if any(v.get("KEYCLOAK_AUTHORITY") != expected or v.get("KEYCLOAK_URL") != origin + "/identity"
           or v.get("APP_ORIGIN") != origin for v in (app, identity)):
        raise RuntimeError("Environment origin or issuer does not match its deployment stage")
    if identity.get("IDENTITY_ENVIRONMENT") != stage or (
            identity.get("IDENTITY_HTTP_PORT"), identity.get("IDENTITY_DB_PORT")) != tuple(map(str, PORTS[stage][2::2])):
        raise RuntimeError("Identity ports or environment do not match its deployment stage")
    expected_db = f"Host=app-db;Port=5432;Database=inventory_{stage};Username=inventory_{stage};Password={app.get('APP_DB_PASSWORD', '')};SSL Mode=Disable"
    if not app.get("APP_DB_PASSWORD") or app.get("DATABASE_CONNECTION_STRING") != expected_db:
        raise RuntimeError("Application DB must use this stage's local app-db service and credentials")
    if not identity.get("KEYCLOAK_DB_PASSWORD") or not identity.get("KEYCLOAK_ADMIN_PASSWORD"):
        raise RuntimeError("Identity credentials are incomplete")
    passwords = [app["APP_DB_PASSWORD"], identity["KEYCLOAK_DB_PASSWORD"], identity["KEYCLOAK_ADMIN_PASSWORD"]]
    other = "staging" if stage == "production" else "production"
    if (APP / f".env.{other}").exists() and (IDENTITY / other / ".env.identity").exists():
        other_app = env_file(APP / f".env.{other}")
        other_identity = env_file(IDENTITY / other / ".env.identity")
        passwords += [other_app["APP_DB_PASSWORD"], other_identity["KEYCLOAK_DB_PASSWORD"], other_identity["KEYCLOAK_ADMIN_PASSWORD"]]
    if len(set(passwords)) != len(passwords):
        raise RuntimeError("Application DB, identity DB and administrator passwords must all be distinct")


def request(url, method="GET", data=None, token=None, form=False):
    headers = {"Content-Type": "application/x-www-form-urlencoded" if form else "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    body = urllib.parse.urlencode(data).encode() if form else json.dumps(data).encode() if data is not None else None
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=body, headers=headers, method=method), timeout=25) as response:
            payload = response.read()
            return json.loads(payload) if payload else None
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Identity request failed (HTTP {error.code}); response body withheld") from None


def configure_identity(stage):
    verify(stage)
    values = env_file(IDENTITY / stage / ".env.identity")
    base = values["KEYCLOAK_URL"]
    token = request(base + "/realms/master/protocol/openid-connect/token", "POST", {
        "client_id": "admin-cli", "grant_type": "password", "username": values["KEYCLOAK_ADMIN_USERNAME"],
        "password": values["KEYCLOAK_ADMIN_PASSWORD"]}, form=True)["access_token"]
    realm_url = base + "/admin/realms/inventory-" + stage
    directory = IDENTITY / stage
    desired = json.loads((directory / "realms" / f"inventory-{stage}-realm.json").read_text())
    if desired.get("realm") != "inventory-" + stage:
        raise RuntimeError("Managed realm file does not match its deployment stage")
    # Apply only file-owned settings. Users, sessions, credentials and assignments stay in Keycloak.
    realm_settings = {key: value for key, value in desired.items()
                      if key not in ("realm", "clients", "roles", "defaultRoles")}
    if all(values.get(k) for k in ("SMTP_HOST", "SMTP_FROM", "SMTP_USERNAME", "SMTP_PASSWORD")):
        if (values.get("SMTP_STARTTLS", "true") == "true") == (values.get("SMTP_SSL", "false") == "true"):
            raise RuntimeError("Enable exactly one SMTP encryption mode: STARTTLS or SSL")
        realm_settings["smtpServer"] = render_template(directory / "config/smtp.template.json", {
            **values, "SMTP_PORT": values.get("SMTP_PORT") or "587",
            "SMTP_STARTTLS": values.get("SMTP_STARTTLS", "true"), "SMTP_SSL": values.get("SMTP_SSL", "false")})
    request(realm_url, "PUT", realm_settings, token)
    role_list = request(realm_url + "/roles", token=token)
    for role in desired.get("roles", {}).get("realm", []):
        existing = next((item for item in role_list if item["name"] == role["name"]), None)
        suffix = "/" + urllib.parse.quote(role["name"], safe="") if existing else ""
        request(realm_url + "/roles" + suffix, "PUT" if existing else "POST", role, token)
    defaults = request(realm_url, token=token)["defaultRole"]
    composites = [request(realm_url + "/roles/" + urllib.parse.quote(name, safe=""), token=token)
                  for name in desired.get("defaultRoles", [])]
    if composites:
        request(realm_url + "/roles-by-id/" + defaults["id"] + "/composites", "POST", composites, token)
    available_scopes = request(realm_url + "/client-scopes", token=token)
    for client in desired["clients"]:
        clients = request(realm_url + "/clients?" + urllib.parse.urlencode({"clientId": client["clientId"]}), token=token)
        if len(clients) != 1:
            raise RuntimeError("Expected exactly one managed client: " + client["clientId"])
        client_url = realm_url + "/clients/" + clients[0]["id"]
        settings = {key: value for key, value in client.items()
                    if key not in ("defaultClientScopes", "protocolMappers")}
        current = request(client_url, token=token)
        if "attributes" in settings:
            settings["attributes"] = {**current.get("attributes", {}), **settings["attributes"]}
        request(client_url, "PUT", settings, token)
        for name in client.get("defaultClientScopes", []):
            scope = next((item for item in available_scopes if item["name"] == name), None)
            if scope is None:
                raise RuntimeError("Required client scope is missing: " + name)
            request(client_url + "/default-client-scopes/" + scope["id"], "PUT", token=token)
        mappers_url = client_url + "/protocol-mappers/models"
        mappers = request(mappers_url, token=token)
        for mapper in client.get("protocolMappers", []):
            existing = next((item for item in mappers if item["name"] == mapper["name"]), None)
            payload = {**mapper, **({"id": existing["id"]} if existing else {})}
            request(mappers_url + ("/" + existing["id"] if existing else ""),
                    "PUT" if existing else "POST", payload, token)
        saved = request(client_url, token=token)
        if not managed_matches(saved, settings):
            raise RuntimeError("Managed client settings did not persist: " + client["clientId"])
        assigned = request(client_url + "/default-client-scopes", token=token)
        if not set(client.get("defaultClientScopes", [])).issubset({scope["name"] for scope in assigned}):
            raise RuntimeError("Managed client scopes did not persist: " + client["clientId"])
        saved_mappers = request(mappers_url, token=token)
        if any(not any(managed_matches(saved_mapper, mapper)
                       for saved_mapper in saved_mappers) for mapper in client.get("protocolMappers", [])):
            raise RuntimeError("Managed audience mapper did not persist")
    if values.get("GOOGLE_CLIENT_ID") and values.get("GOOGLE_CLIENT_SECRET"):
        providers = request(realm_url + "/identity-provider/instances", token=token)
        provider = render_template(directory / "config/google-provider.template.json", values)
        exists = any(p["alias"] == "google" for p in providers)
        request(realm_url + "/identity-provider/instances" + ("/google" if exists else ""),
                "PUT" if exists else "POST", provider, token)
        saved = request(realm_url + "/identity-provider/instances/google", token=token)
        if any(saved.get(key) != value for key, value in provider.items() if key != "config") or any(
                saved.get("config", {}).get(key) != value for key, value in provider["config"].items()
                if key != "clientSecret"):
            raise RuntimeError("Managed Google provider settings did not persist")
    saved = request(realm_url, token=token)
    if any(saved.get(key) != value for key, value in realm_settings.items() if key != "smtpServer"):
        raise RuntimeError("Managed realm settings did not persist")
    if "smtpServer" in realm_settings and any(
            saved.get("smtpServer", {}).get(key) != value for key, value in realm_settings["smtpServer"].items()
            if key != "password"):
        raise RuntimeError("Managed SMTP settings did not persist")
    web = request(realm_url + "/clients?clientId=inventory-web", token=token)
    if len(web) != 1:
        raise RuntimeError("Expected exactly one inventory-web client")
    scopes = request(realm_url + "/clients/" + web[0]["id"] + "/default-client-scopes", token=token)
    if not any(s["name"] == "basic" for s in scopes):
        raise RuntimeError("inventory-web must retain the basic client scope for its subject claim")
    discovery = request(values["KEYCLOAK_AUTHORITY"] + "/.well-known/openid-configuration")
    if discovery["issuer"] != values["KEYCLOAK_AUTHORITY"]:
        raise RuntimeError("Identity discovery issuer mismatch")
    print(json.dumps({"environment": stage, "identityConfigured": True, "issuerVerified": True,
                      "googleAuthorizedRedirectUri": base + "/realms/inventory-" + stage + "/broker/google/endpoint"}))


def nginx():
    path = pathlib.Path("/etc/nginx/sites-available/inventory")
    original = path.read_text()
    # Retain Certbot's certificate, key, options include and DH parameters verbatim.
    ssl_lines = [line.strip() for line in original.splitlines() if re.match(
        r"\s*(ssl_certificate(?:_key)?|ssl_dhparam)\s|\s*include\s+/etc/letsencrypt/", line)]
    ssl_lines = list(dict.fromkeys(ssl_lines))
    if not any(line.startswith("ssl_certificate ") for line in ssl_lines) or not any(
            line.startswith("ssl_certificate_key ") for line in ssl_lines):
        raise RuntimeError("Existing Certbot certificate directives were not found")
    config = '''# Oracle inventory: TLS assets remain managed by Certbot.
map $http_upgrade $inventory_connection_upgrade {
    default upgrade;
    '' close;
}
'''
    for stage, domain in DOMAINS.items():
        front, api, identity, _, _ = PORTS[stage]
        config += f"\nserver {{\n    listen 443 ssl;\n    server_name {domain};\n"
        config += "\n".join("    " + line for line in ssl_lines) + "\n"
        config += '''    client_max_body_size 2m;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    proxy_set_header X-Forwarded-Prefix "";
    proxy_set_header Forwarded "";
    proxy_connect_timeout 5s;
    proxy_read_timeout 120s;
    proxy_buffer_size 32k;
    proxy_buffers 8 32k;
    proxy_busy_buffers_size 64k;
    location = /identity { return 308 /identity/; }
'''
        config += f"    location ^~ /identity/ {{\n        proxy_pass http://127.0.0.1:{identity};\n        access_log off;\n    }}\n"
        config += f"    location ^~ /api/realtime/ {{\n        proxy_pass http://127.0.0.1:{api};\n"
        # Defining any proxy_set_header in a location replaces inherited headers.
        config += '''        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $inventory_connection_upgrade;
        proxy_buffering off;
        access_log off;
    }
'''
        config += f"    location /api/ {{ proxy_pass http://127.0.0.1:{api}; }}\n"
        config += f"    location = /auth/callback {{ proxy_pass http://127.0.0.1:{front}; access_log off; }}\n"
        config += f"    location / {{ proxy_pass http://127.0.0.1:{front}; }}\n}}\n"
        config += f"\nserver {{\n    listen 80;\n    server_name {domain};\n    return 301 https://$host$request_uri;\n}}\n"
    if original == config:
        print("Oracle Nginx proxy already configured")
        return
    backups = pathlib.Path("/var/backups/inventory-nginx")
    backups.mkdir(parents=True, exist_ok=True, mode=0o700)
    backup = backups / ("oracle-before-" + dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%S%fZ") + ".conf")
    shutil.copy2(path, backup)
    try:
        path.write_text(config)
        subprocess.run(["nginx", "-t"], check=True)
        subprocess.run(["systemctl", "reload", "nginx"], check=True)
    except BaseException:
        shutil.copy2(backup, path)
        subprocess.run(["nginx", "-t"], check=True)
        subprocess.run(["systemctl", "reload", "nginx"], check=True)
        raise
    print("Oracle production/staging Nginx proxy configured; Certbot TLS directives preserved")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["prepare", "verify", "identity", "nginx"])
    parser.add_argument("stage", nargs="?", choices=list(PORTS))
    parser.add_argument("--source", type=pathlib.Path, default=APP)
    parser.add_argument("--provider-env-stdin", action="store_true")
    args = parser.parse_args()
    if os.geteuid() != 0:
        raise RuntimeError("Run through sudo")
    if args.action == "nginx":
        nginx()
        return
    if not args.stage:
        raise RuntimeError("Select production or staging")
    if args.action == "prepare":
        providers = json.load(sys.stdin) if args.provider_env_stdin else {}
        prepare(args.stage, args.source.resolve(), providers)
    elif args.action == "verify":
        verify(args.stage)
        print("Oracle environment isolation verified: " + args.stage)
    else:
        configure_identity(args.stage)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Network exceptions may include full URLs, but never request bodies.
        print(f"Oracle setup failed: {type(error).__name__}: {error}", file=sys.stderr)
        sys.exit(1)
