# System monitoring

OpenTelemetry exports sanitized API logs, request/MediatR/database spans and metrics.
Prometheus stores metrics for **15 days / 3 GB**, Loki stores logs for **7 days**, and
Tempo stores traces for **3 days**. Grafana is the visual query interface. All storage
uses persistent local Docker volumes; this is a single-server installation.

## Access

- `/admin`: existing company/user administration.
- `/admin/monitoring`: platform Admin only; live CPU/RAM/disk/network, containers,
  API rate/5xx/p95, pending realtime/email jobs, email retries and low-stock counts.
- `/admin/monitoring/guide`: reading logs, traces, metrics and diagnosing incidents.
- Production `/observability/`: Grafana uses Keycloak OIDC + PKCE. A signed Admin
  realm role is required by both role mapping and an explicit allowed-role filter;
  OIDC token signatures are verified. Anonymous/basic authentication and local signup are off.
  A normal account cannot gain Grafana access just by knowing the URL.

Raw Prometheus/Loki/Tempo/OTLP endpoints bind only to loopback or a Docker network.
No Docker socket is mounted into a monitoring container. A bounded host systemd
collector exports Docker CPU/memory/health to node-exporter's textfile directory.
There is no SQL, token, password, request-body, company-name or user-email capture.
API logs are allowlisted by application category; infrastructure journal logs stay
local. Route templates and command type names keep metric labels bounded.

## Install on the existing Oracle host

```sh
sudo python3 scripts/observability.py install
cd /opt/inventory-runtime/observability
docker compose --env-file .env -f compose.observability.yml config --quiet
docker compose --env-file .env -f compose.observability.yml up -d
sudo python3 /opt/inventory-management/scripts/oracle-server.py nginx
```

The installer generates secrets in mode-600 runtime env files, configures the
confidential Grafana client from JSON, installs the collection timer and enables
application telemetry env settings. Deploy/recreate the API using its updated
Compose definition. Installation does not grant application Admin automatically:
`sudo python3 scripts/observability.py grant-admin --email <existing-email>`.
Log out and sign back in to obtain the new signed role.

## Queries to learn

In Grafana Explore select the data source and a short time window:

| Question | Data source / query |
| --- | --- |
| Recent API errors | Loki: `{service_name="inventory-api",deployment_environment_name="staging"} \| severity_text =~ "(?i)error\|critical"` |
| One request's events | Loki: add `\| trace_id="<32-hex-trace-id>"` |
| Locate its failing step | Tempo: search by that Trace ID; expand the ERROR span |
| API traffic | Prometheus: `sum(rate(inventory_http_requests_total{environment="staging"}[5m]))` |
| Oldest waiting notification | Prometheus: `inventory_outbox_oldest_seconds{environment="staging"}` |

Docker service logs can also be read on the host using
`docker logs --since 15m <container>` or the existing journald configuration.
Keep time zones consistent, correlate the same environment and request, and check
data freshness before interpreting a zero. A metric label must not contain a
user/company ID or arbitrary URL; high label cardinality consumes memory/disk.

The stack uses pinned ARM64-capable images and memory/CPU limits. Export failures
use bounded queues; observability is not a dependency of stock mutations. Disk
retention is time-based for Loki/Tempo: watch disk usage and adjust retention if
traffic grows. No cross-host replication or off-host archive is configured.

## Drill

Staging enables safe admin diagnostics; production disables them. `dependency_failure`
marks an isolated simulated dependency span as failed, writes a correlated ERROR
log, then verifies recovery against the actual database without changing data.
`slow_dependency` adds ~750 ms to this diagnostic request only. At most one drill
runs per minute per API instance. Copy its Trace ID, refresh logs after export, and
inspect the failed/slow span followed by the healthy check. Do not stop production
containers or modify credentials to practice troubleshooting.

Prometheus rules cover CPU/RAM/disk, sustained API errors/latency, stalled realtime
events, email retries, unhealthy containers and stale collectors. Active rules
appear in the admin UI. External availability monitoring is still needed when
the entire host is unavailable. WhatsApp/SMS and external alert delivery belong
to the later messaging step; no provider or paid service is enabled here.
