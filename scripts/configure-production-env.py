"""Fill legacy production identity settings without exposing server secrets."""
import base64
import json
import os
import pathlib
import re
import sys
import tempfile
import urllib.error
import urllib.request
from urllib.parse import urlsplit


def read_values(path):
    if not path.exists():
        return {}
    values = {}
    for line in path.read_text().splitlines():
        match = re.match(r"^([A-Z_]+)=(.*)$", line)
        if match:
            values[match[1]] = match[2].strip().strip("\"'")
    return values


def https_url(value):
    parsed = urlsplit(value)
    if (parsed.scheme != "https" or not parsed.hostname or parsed.username
            or parsed.password or parsed.query or parsed.fragment
            or any(character.isspace() for character in value)
            or any(character in value for character in "'\"$\\#")):
        raise RuntimeError("Production identity URLs must be literal HTTPS URLs without credentials")
    return parsed


def main():
    if os.geteuid() != 0:
        raise RuntimeError("Run through sudo")
    path = pathlib.Path("/opt/inventory-management/.env.production")
    original = path.read_text()
    values = read_values(path)
    identity = read_values(pathlib.Path("/opt/inventory-identity/production/.env.identity"))
    # Use an explicit server setting first. Otherwise derive the public origin
    # from the same repository variable used to verify production health.
    url = values.get("KEYCLOAK_URL") or identity.get("KEYCLOAK_URL")
    authority = values.get("KEYCLOAK_AUTHORITY") or identity.get("KEYCLOAK_AUTHORITY")
    suffix = "/realms/inventory-production"
    if not url and authority and authority.endswith(suffix):
        url = authority[:-len(suffix)]
    if not url:
        encoded = sys.argv[1] if len(sys.argv) == 2 else ""
        if not encoded:
            raise RuntimeError("Set PRODUCTION_HEALTH_URL in GitHub variables or KEYCLOAK_URL in .env.production")
        health = https_url(base64.b64decode(encoded, validate=True).decode())
        url = f"https://{health.netloc}/identity"
    url = url.rstrip("/")
    if https_url(url).path != "/identity":
        raise RuntimeError("Production KEYCLOAK_URL must end in /identity")
    expected = url + suffix
    if authority and authority.rstrip("/") != expected:
        raise RuntimeError("KEYCLOAK_AUTHORITY must match KEYCLOAK_URL and the inventory-production realm")
    updates = {"KEYCLOAK_URL": url, "KEYCLOAK_AUTHORITY": expected}
    # Keep the guest application deployable during an identity outage, but do
    # not silently accept another realm's issuer when discovery responds.
    try:
        with urllib.request.urlopen(expected + "/.well-known/openid-configuration", timeout=8) as response:
            discovery = json.load(response)
    except (urllib.error.URLError, TimeoutError, OSError, ValueError):
        print("WARNING: Production identity discovery is unavailable. Guest pages can deploy; "
              "sign-in requires the inventory-production realm and /identity proxy to be ready.", file=sys.stderr)
    else:
        if discovery.get("issuer") != expected:
            raise RuntimeError("Production discovery issuer does not match KEYCLOAK_AUTHORITY")
        print("Production identity discovery issuer verified")
    if all(values.get(key) == value for key, value in updates.items()):
        print("Production identity environment already configured")
        return
    # Preserve every unrelated line, including database and SMTP credentials.
    lines = [line for line in original.splitlines()
             if not any(re.match(r"^" + key + r"=", line) for key in updates)]
    lines.extend(key + "=" + value for key, value in updates.items())
    metadata = path.stat()
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent,
                                     prefix=".env.production.identity-", delete=False) as temporary:
        temporary.write("\n".join(lines) + "\n")
    replacement = pathlib.Path(temporary.name)
    try:
        os.chown(replacement, metadata.st_uid, metadata.st_gid)
        replacement.chmod(0o600)
        replacement.replace(path)
    finally:
        replacement.unlink(missing_ok=True)
    print("Production identity environment configured; existing credentials preserved")


if __name__ == "__main__":
    main()
