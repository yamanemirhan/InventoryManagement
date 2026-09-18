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

Guest startup performs bounded silent SSO through the existing `/auth/callback` URI; it does not redirect the top-level page automatically when identity is unavailable. Explicit login/registration first checks identity availability. Tokens stay in memory. The small staging host has severe memory/I/O pressure; `tune-staging-identity` bounds its JVM heap and pools but does not guarantee sufficient capacity. Production settings are unchanged.

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

The existing GitHub Actions workflow builds and checks the application, publishes container images, deploys `develop` to staging and `main` to production. Deployments use environment files on the server and GitHub Actions secrets for infrastructure access. Deploying Keycloak is a separate, persistent operation. `scripts/configure-identity.mjs` reads credentials from an untracked environment file; generated realm exports stay under `.local/`.

Configure repository variables `AZURE_RESOURCE_GROUP`, `AZURE_NSG_NAME`, `STAGING_HEALTH_URL` and `PRODUCTION_HEALTH_URL` for the existing workflows. Authentication and SSH values remain GitHub Actions secrets. The staging proxy helper reads the hostname from the server's untracked `.env.staging` (`KEYCLOAK_URL`); active Nginx files stay on the server.

Production deployments fill missing `KEYCLOAK_URL` and `KEYCLOAK_AUTHORITY` in the server's `.env.production` before Compose validation. Existing settings take precedence, followed by `/opt/inventory-identity/production/.env.identity`; otherwise the public origin comes from `PRODUCTION_HEALTH_URL`, with `/identity` and realm `inventory-production`. The helper preserves database credentials and writes atomically with mode 0600. It does not create a Keycloak server, realm or Google provider: provision those separately before enabling production sign-in. Staging credentials and realms are never substituted for production. Application deployment runs once; configuration or migration failures are reported immediately instead of retrying the entire deployment as an SSH error.

Only README Markdown files are tracked. Environment-specific `deploy/` files stay local; the development Keycloak realm and blank templates are explicitly allowed. Reusable scripts required by CI and local identity setup are allowlisted; new scripts and infrastructure files are ignored until reviewed.

Commit example configuration files with placeholders. Keep populated `.env` files, private keys, database dumps and generated identity exports out of Git and Docker build contexts. Changing a file today does not remove an earlier copy from Git history; any exposed credential must be revoked at its provider.

See the [frontend guide](InventoryManagement.Web/README.md) for state ownership, API contracts, themes and localization.
