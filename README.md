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

Local addresses: frontend `http://localhost:3000`, API `http://localhost:5138`, Keycloak `http://localhost:8088`.
The local business database uses documented development-only credentials and binds to loopback. Server environments require explicit credentials and HTTPS identity configuration.

## Companies and authorization

Users can belong to multiple companies with separate Owner, Manager, Operator or Viewer roles. Inventory data is isolated by company in API queries, writes and database relationships. The workspace selector switches the active company; `/companies` manages company creation and membership.

Keycloak `Admin` is the platform administrator and can manage companies, memberships and the application user directory through `/admin`. New registration does not grant access to existing inventory. Company owners manage membership; Owners and Managers manage inventory; Operators can transfer stock; Viewers have read-only access.

Company endpoints follow `Controller → MediatR command/query → handler → repository → EF Core`. Application handlers enforce authorization and business rules; FluentValidation checks commands, repository interfaces separate persistence, and `ICurrentUser` supplies the authenticated identity. Membership changes acquire a company row lock before checking permissions and preserving the last owner.

The company migration groups existing inventory under a legacy company. Platform Admin assigns its first owner; new accounts do not receive automatic access. Deploy the API and frontend together after migration. Reverting this migration requires restoring the matching database backup and application version; automatic downgrade is disabled.

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

Only README Markdown files are tracked. Environment-specific `deploy/` files stay local; the development Keycloak realm and blank templates are explicitly allowed. Reusable scripts required by CI and local identity setup are allowlisted; new scripts and infrastructure files are ignored until reviewed.

Commit example configuration files with placeholders. Keep populated `.env` files, private keys, database dumps and generated identity exports out of Git and Docker build contexts. Changing a file today does not remove an earlier copy from Git history; any exposed credential must be revoked at its provider.

See the [frontend guide](InventoryManagement.Web/README.md) for state ownership, API contracts, themes and localization.
