#!/usr/bin/env python3
"""Install the private monitoring stack or collect bounded host/container metrics.

Run through sudo on the Oracle host. Provider secrets are generated and stored only
in the protected runtime directory, never in Git or command output.
"""
import argparse
import importlib.util
import json
import os
import pathlib
import re
import secrets
import shutil
import subprocess
import tempfile
import time
import urllib.parse

DIRECTORY = pathlib.Path('/opt/inventory-runtime/observability')
SOURCE = pathlib.Path('/opt/inventory-management')


def oracle_module():
    spec = importlib.util.spec_from_file_location('oracle', SOURCE / 'scripts/oracle-server.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(arguments):
    return subprocess.run(arguments, check=True, text=True, capture_output=True, timeout=30).stdout


def bytes_value(value):
    match = re.fullmatch(r'([0-9.]+)\s*([KMGT]?i?B)', value.strip())
    if not match:
        raise RuntimeError('Unrecognized Docker memory unit')
    unit = match[2]
    power = {'B': 0, 'kB': 1, 'KB': 1, 'KiB': 1, 'MB': 2, 'MiB': 2, 'GB': 3, 'GiB': 3, 'TB': 4, 'TiB': 4}[unit]
    return float(match[1]) * (1024 if 'i' in unit else 1000) ** power


def collect():
    target = DIRECTORY / 'textfile'
    target.mkdir(parents=True, exist_ok=True, mode=0o755)
    names = [name for name in run(['docker', 'ps', '-a', '--format', '{{.Names}}']).splitlines()
             if re.fullmatch(r'inventory-[a-z0-9_-]{1,120}', name)]
    stats = {}
    if names:
        for line in run(['docker', 'stats', '--no-stream', '--format', '{{json .}}', *names]).splitlines():
            record = json.loads(line)
            stats[record['Name']] = record
    lines = [f'inventory_host_collection_timestamp_seconds {time.time():.3f}']
    expected = {f'inventory-management-{stage}-{service}-1' for stage in ('production', 'staging') for service in ('api', 'frontend', 'app-db')}
    expected.update(f'inventory-identity-{stage}-{service}-1' for stage in ('production', 'staging') for service in ('keycloak', 'identity-db'))
    expected.update(f'inventory-observability-{service}-1' for service in ('collector', 'prometheus', 'loki', 'tempo', 'grafana', 'node-exporter'))
    for name in sorted(expected - set(names)):
        lines.append(f'inventory_container_healthy{{container="{name}"}} 0')
    if names:
        for line in run(['docker', 'inspect', '--format', '{{.Name}} {{.State.Running}} {{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}', *names]).splitlines():
            name, running, health = line.split(); name = name.lstrip('/')
            label = '{container="' + name + '"}'
            lines.append(f'inventory_container_healthy{label} {int(running == "true" and health in ("healthy", "none"))}')
            if name in stats:
                record = stats[name]
                used, limit = record['MemUsage'].split('/')
                lines.extend([f'inventory_container_memory_bytes{label} {bytes_value(used):.0f}',
                              f'inventory_container_memory_limit_bytes{label} {bytes_value(limit):.0f}',
                              f'inventory_container_cpu_percent{label} {float(record["CPUPerc"].rstrip("%")):.3f}'])
    # Host counters, as the node exporter container has its own network namespace.
    for line in pathlib.Path('/proc/net/dev').read_text().splitlines()[2:]:
        interface, counters = line.split(':', 1); interface = interface.strip()
        if not re.fullmatch(r'[a-zA-Z0-9_-]{1,20}', interface) or interface == 'lo' or interface.startswith(('veth', 'docker', 'br-')):
            continue
        values = counters.split()
        lines.extend([f'inventory_host_network_receive_bytes_total{{device="{interface}"}} {int(values[0])}',
                      f'inventory_host_network_transmit_bytes_total{{device="{interface}"}} {int(values[8])}'])
    with tempfile.NamedTemporaryFile(mode='w', dir=target, suffix='.tmp', delete=False) as stream:
        stream.write('\n'.join(lines) + '\n'); temporary = pathlib.Path(stream.name)
    temporary.chmod(0o644)
    temporary.replace(target / 'inventory.prom')


def configure_grafana(oracle, values):
    identity = oracle.env_file(oracle.IDENTITY / 'production' / '.env.identity')
    base = identity['KEYCLOAK_URL']
    token = oracle.request(base + '/realms/master/protocol/openid-connect/token', 'POST', {
        'client_id': 'admin-cli', 'grant_type': 'password', 'username': identity['KEYCLOAK_ADMIN_USERNAME'],
        'password': identity['KEYCLOAK_ADMIN_PASSWORD']}, form=True)['access_token']
    realm = base + '/admin/realms/inventory-production'
    client = oracle.render_template(DIRECTORY / 'deploy/observability/grafana-client.template.json', values)
    existing = oracle.request(realm + '/clients?clientId=inventory-observability', token=token)
    if len(existing) > 1:
        raise RuntimeError('Ambiguous Grafana client')
    suffix = '/' + existing[0]['id'] if existing else ''
    oracle.request(realm + '/clients' + suffix, 'PUT' if existing else 'POST', client, token)
    saved = oracle.request(realm + '/clients?clientId=inventory-observability', token=token)
    if len(saved) != 1 or saved[0].get('redirectUris') != client['redirectUris'] or saved[0].get('publicClient'):
        raise RuntimeError('Grafana OIDC configuration did not persist')


def grant_admin(email):
    oracle = oracle_module()
    for stage in ('production', 'staging'):
        identity = oracle.env_file(oracle.IDENTITY / stage / '.env.identity')
        base = identity['KEYCLOAK_URL']
        token = oracle.request(base + '/realms/master/protocol/openid-connect/token', 'POST', {
            'client_id': 'admin-cli', 'grant_type': 'password', 'username': identity['KEYCLOAK_ADMIN_USERNAME'],
            'password': identity['KEYCLOAK_ADMIN_PASSWORD']}, form=True)['access_token']
        realm = base + '/admin/realms/inventory-' + stage
        users = oracle.request(realm + '/users?' + urllib.parse.urlencode({'email': email, 'exact': 'true'}), token=token)
        users = [user for user in users if user.get('email', '').lower() == email.lower() and user.get('enabled')]
        if len(users) != 1:
            print(json.dumps({'environment': stage, 'adminGranted': False, 'reason': 'Exactly one existing enabled account is required'}))
            continue
        role = oracle.request(realm + '/roles/Admin', token=token)
        route = realm + '/users/' + users[0]['id'] + '/role-mappings/realm'
        oracle.request(route, 'POST', [role], token)
        assigned = oracle.request(route + '/composite', token=token)
        if not any(item['name'] == 'Admin' for item in assigned):
            raise RuntimeError('Admin role did not persist')
        print(json.dumps({'environment': stage, 'adminGranted': True, 'newLoginRequired': True, 'emailVerificationPending': not users[0].get('emailVerified', False)}))


def install(source):
    oracle = oracle_module()
    network = subprocess.run(['docker', 'network', 'inspect', 'inventory-observability'], capture_output=True, timeout=15)
    if network.returncode != 0:
        run(['docker', 'network', 'create', 'inventory-observability'])
    DIRECTORY.mkdir(parents=True, exist_ok=True, mode=0o700)
    owner = SOURCE.stat()
    os.chown(DIRECTORY, owner.st_uid, owner.st_gid)
    DIRECTORY.chmod(0o700)
    shutil.copytree(source / 'deploy/observability', DIRECTORY / 'deploy/observability', dirs_exist_ok=True)
    shutil.copyfile(source / 'compose.observability.yml', DIRECTORY / 'compose.observability.yml')
    env_path = DIRECTORY / '.env'
    values = oracle.env_file(env_path) if env_path.exists() else {
        'GRAFANA_ORIGIN': 'https://' + oracle.DOMAINS['production'],
        'GRAFANA_AUTHORITY': 'https://' + oracle.DOMAINS['production'] + '/identity/realms/inventory-production',
        'GRAFANA_ADMIN_USER': 'observability-' + secrets.token_hex(8),
        'GRAFANA_ADMIN_PASSWORD': secrets.token_hex(32),
        'GRAFANA_SECRET_KEY': secrets.token_hex(32), 'GRAFANA_OAUTH_SECRET': secrets.token_hex(32)}
    oracle.write_env(env_path, values)
    configure_grafana(oracle, values)
    collect()
    shutil.copyfile(source / 'scripts/observability.py', DIRECTORY / 'collect.py')
    pathlib.Path('/etc/systemd/system/inventory-metrics.service').write_text('''[Unit]
Description=Inventory bounded host/container metric collection
After=docker.service
[Service]
Type=oneshot
ExecStart=/usr/bin/python3 /opt/inventory-runtime/observability/collect.py collect
TimeoutStartSec=45
NoNewPrivileges=true
''')
    pathlib.Path('/etc/systemd/system/inventory-metrics.timer').write_text('''[Unit]
Description=Collect Inventory host metrics every 30 seconds
[Timer]
OnBootSec=30
OnUnitActiveSec=30
AccuracySec=1
[Install]
WantedBy=timers.target
''')
    run(['systemctl', 'daemon-reload'])
    run(['systemctl', 'enable', '--now', 'inventory-metrics.timer'])
    for stage in ('production', 'staging'):
        path = SOURCE / ('.env.' + stage)
        app = oracle.env_file(path)
        app.update(OBSERVABILITY_OTLP_ENDPOINT='http://collector:4317', OBSERVABILITY_ENVIRONMENT=stage,
                   OBSERVABILITY_PROMETHEUS_URL='http://prometheus:9090', OBSERVABILITY_LOKI_URL='http://loki:3100',
                   OBSERVABILITY_TEMPO_URL='http://tempo:3200', OBSERVABILITY_DIAGNOSTICS_ENABLED=str(stage == 'staging').lower())
        oracle.write_env(path, app)
    print('Monitoring configuration installed; credentials withheld. Start with docker compose in the protected runtime directory.')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['install', 'collect', 'grant-admin'])
    parser.add_argument('--source', type=pathlib.Path, default=SOURCE)
    parser.add_argument('--email')
    args = parser.parse_args()
    if os.geteuid() != 0:
        raise RuntimeError('Run through sudo')
    if args.action == 'collect': collect()
    elif args.action == 'grant-admin':
        if not args.email: raise RuntimeError('An existing verified account email is required')
        grant_admin(args.email)
    else: install(args.source.resolve())


if __name__ == '__main__':
    try: main()
    except Exception as error:
        print('Monitoring operation failed: ' + type(error).__name__, file=__import__('sys').stderr)
        __import__('sys').exit(1)
