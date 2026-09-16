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

1. Follow the [identity environments guide (Turkish)](IDENTITY_ENVIRONMENTS.md) for Keycloak, Google and SMTP configuration.
2. Start local business PostgreSQL with `docker compose up -d postgres`.
3. Apply migrations with `dotnet ef database update --project InventoryManagement.Infrastructure --startup-project InventoryManagement.Api` using the Development environment.
4. Start the API with `dotnet run --project InventoryManagement.Api --launch-profile http`.
5. In `InventoryManagement.Web`, copy `.env.example` to `.env.local` on first setup, then run `npm ci` and `npm run dev`.

Local addresses: frontend `http://localhost:3000`, API `http://localhost:5138`, Keycloak `http://localhost:8088`.
The local business database uses documented development-only credentials and binds to loopback. Server environments require explicit credentials and HTTPS identity configuration.

## Companies and authorization

Users can belong to multiple companies with separate Owner, Manager, Operator or Viewer roles. Inventory data is isolated by company in API queries, writes and database relationships. The workspace selector switches the active company; `/companies` manages company creation and membership.

Keycloak `Admin` is the platform administrator and can manage companies, memberships and the application user directory through `/admin`. New registration does not grant access to existing inventory. Company owners manage membership; Owners and Managers manage inventory; Operators can transfer stock; Viewers have read-only access.

See the [company architecture and phased rollout plan (Turkish)](docs/company-workspaces.md) for permissions, migration, legacy data access and rollback requirements. Deploy the API and frontend together after applying the migration.
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

The existing GitHub Actions workflow builds and checks the application, publishes container images, deploys `develop` to staging and `main` to production. Deployments use environment files on the server and GitHub Actions secrets for infrastructure access. Deploying Keycloak is a separate, persistent operation; see the [identity environments guide](IDENTITY_ENVIRONMENTS.md).

Commit example configuration files with placeholders. Keep populated `.env` files, private keys, database dumps and generated identity exports out of Git and Docker build contexts. Changing a file today does not remove an earlier copy from Git history; any exposed credential must be revoked at its provider.

See the [frontend guide](InventoryManagement.Web/README.md) for state ownership, API contracts, themes and localization.
