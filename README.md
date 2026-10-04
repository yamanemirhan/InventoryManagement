# Inventory Management

Inventory and purchasing application with warehouse-level stock, transfers, suppliers and purchase orders.

## Features

- Product, warehouse and supplier catalogs.
- All-warehouse and per-warehouse stock quantities, search and movement history.
- Purchase order lifecycle with atomic receipt and concurrency protection.
- Keycloak email/password authentication and optional Google identity brokering.
- Company memberships, company-scoped authorization and a platform administration panel.
- English and Turkish interfaces; dark/light modes with shared forest/indigo color tokens.
- Responsive forms, loading skeletons and accessible confirmation dialogs.

## Architecture

| Project | Responsibility |
| --- | --- |
| InventoryManagement.Domain | Entities and business rules |
| InventoryManagement.Application | Commands, queries, validation and interfaces |
| InventoryManagement.Infrastructure | PostgreSQL persistence and EF Core migrations |
| InventoryManagement.Api | ASP.NET Core 10 HTTP API and JWT policies |
| InventoryManagement.Web | Next.js App Router, React and TypeScript frontend |
| InventoryManagement.UnitTests / IntegrationTests | Domain and PostgreSQL integration checks |

Identity data belongs to Keycloak's separate database. The business database does not store passwords or refresh tokens. The frontend uses Authorization Code with PKCE and keeps access/refresh tokens in memory.

## Getting started

Prerequisites: .NET 10 SDK, Node.js 24, Docker Compose and EF Core 10 CLI tools.

1. Copy `deploy/keycloak/.env.example` to `.env.identity`, set distinct Keycloak admin/database passwords, and start identity with `docker compose --env-file .env.identity -f compose.identity.yml up -d`. The development realm is imported automatically.
2. Start local business PostgreSQL with `docker compose up -d postgres`.
3. Apply migrations with `dotnet ef database update --project InventoryManagement.Infrastructure --startup-project InventoryManagement.Api` using the Development environment.
4. Start the API with `dotnet run --project InventoryManagement.Api --launch-profile http`.
5. In `InventoryManagement.Web`, copy `.env.example` to `.env.local` on first setup, then run `npm ci` and `npm run dev`.

Existing Keycloak realms must assign the `basic` default client scope to `inventory-web` so access tokens include the required `sub` claim. To repair only that assignment without changing Google/SMTP settings, run `node scripts/configure-identity.mjs token-scopes <private-environment-file>`, then sign in again to obtain a new token. The `sync` command also ensures this scope is assigned.

Local addresses: frontend `http://localhost:3000`, API `http://localhost:5138`, Keycloak `http://localhost:8088`.
The local business database uses documented development-only credentials and binds to loopback. Server environments require explicit credentials and HTTPS identity configuration.

## Companies and authorization

Users can belong to multiple companies with separate Owner, Manager, Operator or Viewer roles. Inventory data is isolated by company in API queries, writes and database relationships. The workspace selector switches the active company; `/companies` manages company creation and membership.

Keycloak `Admin` is the platform administrator and can manage companies, memberships and the application user directory through `/admin`. New registration does not grant access to existing inventory. Company owners manage membership; Owners and Managers manage inventory; Operators can transfer stock; Viewers have read-only access.

Company endpoints follow `Controller → MediatR command/query → handler → repository → EF Core`. Application handlers enforce authorization and business rules; FluentValidation checks commands, repository interfaces separate persistence, and `ICurrentUser` supplies the authenticated identity. Membership changes acquire a company row lock before checking permissions and preserving the last owner.

The company migration groups existing inventory under a legacy company. Platform Admin assigns its first owner; new accounts do not receive automatic access. Deploy the API and frontend together after migration. Reverting this migration requires restoring the matching database backup and application version; automatic downgrade is disabled.

## Inventory operations

- Owners invite teammates by email from `/companies`. Invitations expire after seven days, can be revoked or reissued, and are accepted only by the same verified email. Existing members retain their role when accepting an invitation. SMTP delivery is queued in PostgreSQL, retries up to eight times with backoff, and displays delivery status; reissuing creates a fresh invitation. Delivery is at-least-once, so an ambiguous SMTP acknowledgement can produce a duplicate email.
- `/reports` filters stock by warehouse/product/SKU and minimum threshold. Selecting a warehouse includes products with no stock record. Owners/Managers record physical counts with a reason or set minimum quantities. Saved counts retain previous/count quantities and the actor; unchanged counts are still audited. Stale stock versions produce a conflict instead of overwriting concurrent work.
- Minimum quantity zero disables the alert. Below-minimum rows appear on the dashboard and report page, update through SignalR, and are periodically refreshed. These are persistent, computed in-app warnings, not email or push alerts.
- Purchase orders support line-level partial receipts and supplier returns with reasons. Stock, order progress and movements commit atomically, and expected order versions protect against repeated or concurrent submissions. Returns cannot exceed received-minus-returned quantities or available stock. Returns preserve receipt totals; replacements use a new purchase order.
- Product CSV/XLSX import supports up to 1000 rows in a 1 MB file with `Name` and `Sku` headers. Preview validates every row and duplicate SKU before an atomic insert; existing products are never overwritten. Excel cells must be plain text/numbers, not formulas. Exports support CSV and XLSX; report exports use the selected filters and are capped at 5000 rows. Export pages are live reads, not an accounting snapshot. CSV text is protected against spreadsheet formula interpretation.
- Stock movement and count reports support warehouse, product/SKU and UTC date filters. Movement reports include receipt/return references and reasons. Quantities retain the existing movement convention; adjustment direction is available as the signed delta.

Deploy API and frontend together after `InventoryOperations`. The migration backfills received quantities for already-received purchase orders. It does not recount stock or resend historical transactions.

Staging deployment reads SMTP settings locally from the existing Keycloak database into its untracked environment file; mail credentials are never copied into CI logs. Other environments configure `Mail:Host`, `Port`, `Username`, `Password`, `From`, `ImplicitTls` and HTTPS `AppOrigin`. SMTP requires TLS. Base64 configuration variants are encoding for safe environment-file transport, not encryption. Mail dispatch, like realtime dispatch, currently assumes one API instance per environment.

Guest startup performs bounded silent SSO through the existing `/auth/callback` URI; it does not redirect the top-level page automatically when identity is unavailable. Explicit login/registration first checks identity availability. Tokens stay in memory. Production and staging use separate identity services on the Oracle host, with bounded JVM heaps, database pools and container resources.

## Workspace and knowledge resources

The home dashboard shows company inventory totals, open purchase orders, out-of-stock products and setup links. Owners and Managers can edit product, warehouse and supplier details from their detail pages.

`/activity` lists company changes for Owners and Managers. Audit metadata is saved in the same transaction as each change: entity type, record ID, action, actor ID and UTC timestamp. Logging starts with this release; historical changes and previous field values are not reconstructed.

`/knowledge` stores plain-text operating guides and reference material within each company. Owners and Managers create and edit Draft, Published and Archived resources. Other members can read only Published resources. Each update increments a revision; concurrent edits are rejected so stale content cannot overwrite a newer version. A revision number does not retain historical document bodies.

This is data preparation for future RAG, not an AI integration. Future indexing should use `(companyId, documentId)` as the source identity, revision and update time for freshness, and `/knowledge/{id}` for citations. Only Published content may enter retrieval. Status changes must remove archived/draft content from the index, and retrieval must recheck company membership and current publication status. Inventory facts should come from current relational data. No chatbot, embedding provider, vector index or indexing pipeline is included.

Apply the `WorkspaceResourcesAndActivity` migration before starting this release. It adds knowledge and activity tables without rewriting existing inventory.

## Live updates and notifications

SignalR connects authenticated browsers to `/api/realtime/workspace?companyId=...`. Company membership is checked on connection and again before delivery. Token expiry closes the connection; the client obtains a fresh token on reconnect. Company changes invalidate the current screen's queries, with a full data refresh after reconnect. The header bell shows a bounded, in-memory list of the current session's last 50 update notifications and an unread count. It is not a persistent personal inbox; offline changes are reconciled by fetching current data.

Committed activity rows also serve as a small PostgreSQL outbox. A background dispatcher processes up to 200 rows every two seconds, publishing generic update signals and marking them processed. Rolled-back transactions produce no signals. Failed dispatches are retried, and clients deduplicate repeated signals. Notifications carry no record contents or actor identities. Existing historical activity is marked processed by the `RealtimeActivityDispatch` migration.

The current deployment has one API instance per environment. Redis caching is deferred until measurements identify expensive repeat reads; RabbitMQ is deferred until independent workers or services need durable work queues. Before running multiple API replicas, introduce a SignalR backplane or managed SignalR service and coordinated outbox delivery. This single-instance dispatcher must not be treated as a multi-instance message bus.

Staging deployment configures a dedicated Nginx realtime location with WebSocket upgrade headers, disabled buffering, a 120-second read timeout and disabled access logging (WebSocket/SSE URLs may contain bearer tokens). Apply equivalent settings to the production proxy before enabling this release there. Do not enable query-string logging for the hub in reverse proxies or request telemetry.

Implementation references: [SignalR authentication](https://learn.microsoft.com/en-us/aspnet/core/signalr/authn-and-authz?view=aspnetcore-10.0) and [JavaScript reconnect behavior](https://learn.microsoft.com/en-us/aspnet/core/signalr/javascript-client?view=aspnetcore-10.0).

## Operational reliability

The API returns a correlation ID in `X-Request-Id` and error responses. JSON request logs contain route templates, status and elapsed time; they omit request bodies, headers and query strings. Server Compose files send API/frontend logs to the host's central system journal with `inventory-<environment>-api` and `inventory-<environment>-web` tags. For example, `journalctl CONTAINER_TAG=inventory-staging-api --since "1 hour ago"` reads staging API logs.

`/api/health` is a lightweight liveness probe. `/api/health/ready` checks PostgreSQL and Keycloak with a five-second timeout and exposes only health status. Per-instance API limits allow 300 reads and 60 writes per minute per authenticated subject; anonymous requests share a 300-per-minute budget and readiness allows 30 probes per minute. Rejections return HTTP 429 and `Retry-After`. These limits do not replace Keycloak login protection or an edge firewall.

The CI workflow has manually selected operational actions: `inspect`, `install`, `backup`, `restore-drill`, `monitor`, `alert-check` and `status`. They use the existing SSH credentials without exporting them. Installation requires an explicitly configured `INVENTORY_BACKUP_PASSPHRASE` Actions secret. Keep a separate recovery copy of that passphrase; losing it makes encrypted archives unusable.

The root-owned operations script encrypts PostgreSQL custom-format dumps for each configured application database and running Keycloak database. Local archives are retained for 14 days. A restore drill checks archive hashes, decrypts into a temporary private directory and restores into an isolated, disposable PostgreSQL container with no network or published ports. It never restores over a live database. A successful backup alone is not proof of recoverability; inspect the recorded restore result.

After installation, a daily backup timer runs at 02:30 server time. A monitoring timer is enabled only when an alert recipient is configured. Staging is currently onboarded for endpoint monitoring; the older production release is not implicitly promoted. The monitor checks public service endpoints, backup age and free disk, sending failure/recovery emails through the existing SMTP configuration. SMTP configuration is read locally from Keycloak when it is absent from the server environment file; credentials and recipient addresses are not exported to CI.

The independent `availability.yml` workflow checks public staging/production liveness hourly and maintains a GitHub issue assigned to the repository owner during an outage. GitHub schedules require this file on the default branch and may be delayed; it is not a real-time paging SLA. Enable that workflow on the default branch before relying on host-outage detection. Backups currently remain encrypted on the server; an off-host destination is a separate required production-readiness decision.

Secret scanning covers the complete Git history locally and in the dedicated GitHub workflow. A clean scanner result is not a guarantee that no credential was ever exposed; known exposed credentials must still be rotated.

## Validation

```sh
dotnet build InventoryManagement.slnx --configuration Release
dotnet test InventoryManagement.UnitTests --configuration Release
dotnet test InventoryManagement.IntegrationTests --configuration Release
```

Integration tests require Docker. Frontend checks run from `InventoryManagement.Web`:

```sh
npm run lint
npm run typecheck
npm run build
```

## Deployment and configuration

Production and staging run on an Oracle Ubuntu ARM64 VM. `develop` deploys staging;
`main` deploys production. The existing CI still validates the application and
publishes SHA-tagged GHCR images. Image publishing uses a native
`ubuntu-24.04-arm` runner and `linux/arm64`, avoiding .NET/QEMU emulation. Dockerfiles
also support native AMD64 builds; the EF bundle selects `linux-arm64` or `linux-x64`
from Docker's `TARGETARCH`. This workflow intentionally publishes ARM64 images only.
See [GitHub runner architectures](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).

Each environment has three application services (`app-db`, `api`, `frontend`) and
an independent identity stack (`identity-db`, `keycloak`). Application and identity
networks and named PostgreSQL volumes are project-scoped. No database is published
on a public interface. Application containers reach their own issuer over HTTPS via
Docker's host gateway, retaining TLS certificate and issuer validation.

| Environment | Frontend | API | Keycloak | Application DB | Identity DB |
| --- | ---: | ---: | ---: | ---: | ---: |
| Production | 3000 | 8080 | 8180 | 55432 | 55435 |
| Staging | 3001 | 8081 | 8181 | 55434 | 55433 |

All ports bind to `127.0.0.1`. Database/user names are `inventory_production` and
`inventory_staging` for application PostgreSQL; both isolated Keycloak databases
use database/user `keycloak`. PostgreSQL 17 has a 512 MiB container limit, 128 MiB
shared buffers and at most 60 connections. Each Keycloak has a 1536 MiB container
limit and 768 MiB maximum JVM heap; API/frontend limits are 768/512 MiB. These are
limits, not reserved memory, and leave room for the OS on a 12 GiB host.

### Runtime configuration and initial setup

The server repository is `/opt/inventory-management`. Runtime secrets never live
in Git. Bootstrap creates distinct application DB, identity DB and administrator
passwords for each environment, writes env files atomically with mode 0600 and
preserves existing credentials on subsequent deployments. Do not replace passwords
in an initialized PostgreSQL volume without changing the database role password.

| File | Purpose |
| --- | --- |
| `/opt/inventory-management/.env.production` | Production application DB connection and invitation mail settings |
| `/opt/inventory-management/.env.staging` | Staging application DB connection and invitation mail settings |
| `/opt/inventory-identity/production/.env.identity` | Production Keycloak admin/DB, Google and SMTP settings |
| `/opt/inventory-identity/staging/.env.identity` | Staging Keycloak admin/DB, Google and SMTP settings |
| `/opt/inventory-runtime/<stage>/compose.<stage>.yml` | Last configured application service definition |
| `/opt/inventory-runtime/<stage>/images.env` | Last healthy image repositories and exact tag |

Blank templates are `.env.production.example`, `.env.staging.example` and
`deploy/keycloak/{production,staging}.env.example`. Local development retains its
own `compose.identity.yml`, localhost endpoints and realm, using the shared theme.

On a new host with Docker, host Nginx, a valid Certbot certificate and the repository:

```sh
cd /opt/inventory-management
sudo python3 scripts/oracle-server.py prepare staging
sudo python3 scripts/oracle-server.py prepare production
# Securely edit the two identity env files to fill Google and SMTP settings.
sudo python3 scripts/oracle-server.py prepare staging
sudo python3 scripts/oracle-server.py prepare production
sudo python3 scripts/oracle-server.py nginx
```

### File-managed Keycloak configuration

Production and staging are configured from these tracked, secret-free JSON files:

- `deploy/keycloak/server-realm.template.json`: realm settings, roles, clients,
  exact web redirects, PKCE, default token scopes and API audience mapper.
- `deploy/keycloak/google-provider.template.json`: Google broker settings.
- `deploy/keycloak/smtp.template.json`: verification/password recovery email settings.

`${IDENTITY_ENVIRONMENT}` and `${APP_ORIGIN}` select the environment. Google and
SMTP placeholders are read from that environment's protected `.env.identity`.
Development uses `development-realm.json` with the same theme/password/session
settings, retaining its localhost endpoints and optional email verification.

`prepare` renders a secret-free realm import into the matching identity directory
and copies provider templates into its `config/` directory. Startup import creates
only missing realms: restarting alone does not update an existing realm.
`identity` applies the file-managed realm/client settings, roles, scopes, audience
mapper, SMTP and Google provider through the admin API and verifies the result.
Provider secrets are substituted only in memory. Users, credentials, sessions,
unmanaged clients and existing role assignments are retained; roles/default scopes
are added without removing existing ones. No Keycloak admin UI changes are needed.
CI performs both steps for its deployment environment automatically.

To apply edited JSON files to an already running environment without rebuilding
application images or restarting Keycloak:

```sh
cd /opt/inventory-management
sudo python3 scripts/oracle-server.py prepare staging
sudo python3 scripts/oracle-server.py identity staging
# Use production instead of staging for production settings.
```

The app-owned theme in `deploy/keycloak/themes/inventory/login` renders every
authentication flow: login, registration, email verification, password recovery,
profile/password updates, and error/consent pages. Forms submit directly to the
identity service with its original authentication session, CSRF protections and
PKCE callback. Identity URLs remain under `/identity/`; default Keycloak styling
and branding are replaced. The application `/account` page shows profile details
and launches profile/password changes through the same custom design.

Theme assets are copied to each environment's `themes/` directory and mounted
read-only. CI recreates only Keycloak when theme content changes, to invalidate
template caches. Custom resource URLs include a content-derived version to avoid
stale browser CSS/scripts after deployment; development disables theme caching.
For manual theme edits, run `prepare`, recreate Keycloak using
the stage's Compose definition, then run `identity`. Realm/client/provider-only
changes require no restart. Themes and app UI share Turkish/English messages and
the selected light/dark and forest/indigo preferences.

Passwords require 12–128 characters, an uppercase letter, a lowercase letter and
a digit; email/username cannot be used as the password. Keycloak enforces these
rules on the server. Production/staging registration verifies email first, then
sets the password and returns to the original authenticated application callback.
Duplicate/invalid emails are rejected. Password recovery keeps responses generic
and uses Keycloak's expiring email action tokens. Remember-me uses secure identity
cookies with a 7-day idle limit and 30-day maximum; ordinary sessions retain their
30-minute idle / 10-hour maximum. Tokens/passwords are never stored in localStorage.

Keep `verifyEmail=true`; SMTP must work for verified registration, password
recovery and invitations. Configure either STARTTLS or SSL. The separate
`configure-identity.mjs` tool remains available for local development.

Google values are `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in each identity env.
Separate OAuth clients are recommended; one client may explicitly authorize both:

- Production redirect: `https://inventory-yamanemirhan.duckdns.org/identity/realms/inventory-production/broker/google/endpoint`
- Staging redirect: `https://staging-inventory-yamanemirhan.duckdns.org/identity/realms/inventory-staging/broker/google/endpoint`
- Authorized origins: `https://inventory-yamanemirhan.duckdns.org` and `https://staging-inventory-yamanemirhan.duckdns.org`

These broker redirects are different from the web client's exact
`/auth/callback` redirect. Add both broker URLs to **Authorized redirect URIs** of
the exact Google Web application client selected by `GOOGLE_CLIENT_ID`, with no
trailing slash. Google maintains this allowlist separately; Keycloak files cannot
update it. Adding an address only to Authorized JavaScript origins is insufficient.
A Google `400 redirect_uri_mismatch` means the requested URI is not authorized on
that Google client. After saving in Google, start a fresh application login.
Passwords remain exclusively in Keycloak. The browser
uses Authorization Code + PKCE and sends Keycloak access tokens to the API.
Registration continues within the original authentication session. Assign realm
`Admin` to the intended operator account in each realm after registration; new
users receive `User`, never platform administrator rights.

SMTP keys in each identity env are `SMTP_FROM`, `SMTP_HOST`, `SMTP_PORT`,
`SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_STARTTLS`, `SMTP_SSL`. `prepare` maps them to
the application's existing base64 mail settings in the matching application env.
After editing provider settings, run `prepare <stage>` and `identity <stage>`, then
recreate that stage's API/frontend so they receive updated invitation mail settings.

### GitHub Actions access

Update these **repository secrets**, shared by both deployment jobs:

| Secret | Oracle value |
| --- | --- |
| `SERVER_HOST` | `152.70.178.81` |
| `SERVER_USER` | `ubuntu` |
| `SSH_PRIVATE_KEY` | Contents of the local Oracle SSH private key, never a Git-tracked file |
| `SSH_KNOWN_HOSTS` | Verified Oracle server host-key entry for `152.70.178.81` |

`GITHUB_TOKEN` is automatically provided for GHCR access. Existing optional
operational installation still uses `INVENTORY_BACKUP_PASSPHRASE`; it is not needed
for application deployment. Repository variables `STAGING_HEALTH_URL` and
`PRODUCTION_HEALTH_URL` remain the corresponding `https://<domain>/api/health`
URLs. Azure login, NSG changes, Azure variables and Azure OIDC secrets are no longer
used by CI, rollback or operations. OCI ingress must permit SSH/HTTP/HTTPS; retain
the host's existing persistent iptables rules rather than adding another firewall.

`deploy-environment.sh` serializes remote deployment, fetches the intended branch,
checks the exact SHA, checks out that revision detached and verifies stage-specific
DB/issuer settings. It pulls ARM64 images, waits for the stage's databases and
Keycloak, applies file-managed identity settings, runs the EF migration bundle once, and starts
API/frontend. Public readiness is checked before recording the healthy image tag.
No volume is removed and no automatic migration downgrade is performed.
Rollback only accepts ARM64 application images and preserves databases and Keycloak.

For maintenance, use both the application env and the last healthy image env:

```sh
stage=staging
cd /opt/inventory-management
docker compose --project-directory /opt/inventory-management \
  --env-file ".env.$stage" --env-file "/opt/inventory-runtime/$stage/images.env" \
  -f "/opt/inventory-runtime/$stage/compose.$stage.yml" ps
docker compose --project-directory "/opt/inventory-identity/$stage" \
  --env-file "/opt/inventory-identity/$stage/.env.identity" \
  -f "/opt/inventory-identity/$stage/compose.identity.server.yml" ps
```

The initial no-push validation uses locally built `oracle-preview` images; its
source snapshot is separate from the clean server Git checkout. The next user push
replaces preview images with immutable CI SHA tags.

### Nginx and DBeaver

Host Nginx uses `/etc/nginx/sites-available/inventory` and the existing enabled
symlink. The helper preserves Certbot certificate/key/options/DH directives, backs
up the previous site outside Git, validates `nginx -t`, reloads, and restores on
failure. Each HTTPS hostname has its own upstream ports. `/api/` and `/identity/`
are forwarded without stripping the path. `/api/realtime/` supports WebSocket/SSE;
forwarded host/protocol/IP headers are overwritten at the trusted proxy. Callback,
identity and realtime access logs are disabled to avoid recording authentication
query parameters. Certbot retains ownership of certificate renewal.

DBeaver uses SSH host `152.70.178.81`, port `22`, user `ubuntu` and the local
Oracle private key. The DB endpoint is always `127.0.0.1`; use the port table above.
Application passwords are `APP_DB_PASSWORD` in the matching application env;
Keycloak passwords are `KEYCLOAK_DB_PASSWORD` in the matching identity env. SSH
forwarding is required; do not open database ports in OCI or host firewall rules.

Only README Markdown files are tracked. Secret-free Keycloak realm/provider/SMTP templates and blank environment templates are explicitly allowed. Environment-specific exports and populated files stay local. Reusable scripts required by CI and local identity setup are allowlisted; new scripts and infrastructure files are ignored until reviewed.

Commit example configuration files with placeholders. Keep populated `.env` files, private keys, database dumps and generated identity exports out of Git and Docker build contexts. Changing a file today does not remove an earlier copy from Git history; any exposed credential must be revoked at its provider.

See the [frontend guide](InventoryManagement.Web/README.md) for state ownership, API contracts, themes and localization.
