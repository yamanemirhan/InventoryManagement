# InventoryManagement

A multi-company inventory and purchasing application built with ASP.NET Core and Next.js.

[Live demo](https://inventory-yamanemirhan.duckdns.org/) · [Frontend guide](InventoryManagement.Web/README.md) · [Identity and deployment configuration](deploy/keycloak/README.md)

## Features

- Multiple company memberships, company switching, Owner/Manager/Operator/Viewer roles and platform administration.
- Products, warehouses, suppliers, stock transfers, physical counts and minimum-stock warnings.
- Purchase orders with partial receipts, supplier returns and concurrent-update protection.
- Filtered reports, CSV/XLSX import/export, activity history and company knowledge resources.
- Bulk products, warehouses, suppliers, opening stock and draft purchases: templates, row previews, downloadable errors and atomic, company-scoped imports with duplicate-upload protection.
- QR/barcode product lookup by camera, USB reader or image; stock-form selection and printable/downloadable product labels.
- Email/password and optional Google sign-in, verified email invitations, custom account screens and SignalR updates.
- Turkish/English UI, responsive layouts and light/dark themes.
- First-visit guided tour: animated highlights, up to 10 role-aware steps, keyboard controls, skip and menu restart.
- Admin-only server/container dashboard, OpenTelemetry logs/traces/metrics and safe staging diagnostics.
- Invo: a floating Turkish/English AI assistant with optional Gemini integration, explicit data-sharing consent and bounded free-tier usage.

## Technology

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| State and forms | TanStack Query, Redux Toolkit, React Hook Form, Zod |
| API and architecture | ASP.NET Core 10, C#, REST/OpenAPI, MediatR/CQRS, FluentValidation |
| Persistence | PostgreSQL 17, EF Core 10, Npgsql, migrations |
| Identity | Keycloak 26, OpenID Connect, Authorization Code + PKCE, JWT, Google OAuth |
| Background work | SignalR, .NET hosted services, PostgreSQL outbox, MailKit/SMTP, ExcelJS |
| Hosting and delivery | Oracle Cloud Ubuntu ARM64, Docker Compose, Nginx, HTTPS/Certbot, DuckDNS, GitHub Actions, GHCR |
| Operations | OpenTelemetry, Prometheus, Grafana, Loki, Tempo, health checks, request IDs, rate limits, Gitleaks and GitGuardian |

Oracle Cloud hosts the services; PostgreSQL stores the data. Redis and RabbitMQ are not required by the current implementation.

## Application flow

```mermaid
flowchart TD
    Browser[Browser] --> Proxy[Nginx / HTTPS]
    Proxy -->|Pages| Web[Next.js / React]
    Proxy -->|Sign-in| Identity[Keycloak]
    Identity <-->|Optional federation| Google[Google OAuth]
    Identity --> IdentityDb[(Identity PostgreSQL)]
    Proxy -->|JWT + company ID| Api[ASP.NET Core API]
    Api --> Access[Token, company membership and role checks]
    Access --> Handlers[MediatR handlers / business rules]
    Handlers --> Persistence[Repositories / EF Core]
    Persistence --> AppDb[(Application PostgreSQL)]
    AppDb --> Workers[Background workers]
    Workers -->|SignalR notification via Nginx| Browser
    Workers --> Mail[SMTP invitations]
```

`Domain` contains business entities; `Application` contains commands, queries and validation; `Infrastructure` implements persistence; `Api` exposes endpoints; `Web` owns the UI.

Companies share the application database. Membership checks, company-scoped queries, write guards and company-aware foreign keys enforce separation. Platform administrators have explicit cross-company access. Business changes and audit/outbox entries commit together; row versions prevent stale stock and purchase-order writes. SignalR sends change notices and the client refetches authorized data.

## Run locally

Requires **.NET 10 SDK**, **Node.js 24**, **Docker Compose** and a matching **dotnet-ef 10** tool.

1. Copy `deploy/keycloak/.env.example` to `.env.identity`. Fill both Keycloak password fields with distinct random values. Google and SMTP are optional for local startup.
2. Copy `InventoryManagement.Web/.env.example` to `InventoryManagement.Web/.env.local`.
3. From the repository root, start the databases/identity service and apply migrations:

```sh
docker compose up -d postgres
docker compose --env-file .env.identity -f compose.identity.yml up -d
dotnet restore InventoryManagement.slnx
dotnet ef database update --project InventoryManagement.Infrastructure --startup-project InventoryManagement.Api -- --environment Development
```

4. In one terminal, run the API:

```sh
dotnet run --project InventoryManagement.Api --launch-profile http
```

5. In another terminal, run the frontend:

```sh
cd InventoryManagement.Web
npm ci
npm run dev
```

Open [the app](http://localhost:3000). The API is at `http://localhost:5138`; [local Keycloak](http://localhost:8088/admin/) uses the administrator credentials from `.env.identity`. Register an application account and create a company to start. Keycloak administrator credentials are separate from application users.

The local business database uses `postgres` / `postgres` on loopback only. These development defaults must never be reused on a server. Production and staging require explicit credentials and HTTPS; their blank env templates are separate from local setup.

## Delivery flow

```mermaid
flowchart LR
    Push[Push to develop or main] --> Checks[Build / lint / typecheck / existing tests]
    Checks --> Images[Build ARM64 images]
    Images --> Registry[GHCR / commit SHA tags]
    Registry --> Deploy[SSH to Oracle / Docker Compose]
    Deploy --> Configure[Identity config / EF migration bundle]
    Configure --> Ready[Start application / readiness checks]
    Ready --> Staging[develop: staging]
    Ready --> Production[main: production]
```

Each environment has separate application and identity services, PostgreSQL volumes and credentials. Nginx exposes HTTPS; service/database ports bind to loopback. Deployment selects the exact commit, serializes server changes and records the healthy image version after readiness checks. Rollback changes application images; it does not downgrade the database.

Server/Google/SMTP values stay in protected env files and GitHub Actions Secrets. Only blank env files, secret-free templates and reusable deployment scripts are tracked. See the [configuration guide](deploy/keycloak/README.md) before deploying your own instance; the supplied server helper targets this project's domains and layout.

See [system monitoring](deploy/observability/README.md) for admin access, retention and diagnostics.

## Bulk import

Owners/Managers use **Bulk data import** (`/imports`). Download a CSV/XLSX template, replace the example row and upload up to 1000 rows / 1 MB. Preview checks all rows before saving; any error rejects the whole batch. Download the full row/column error report to correct the file.

Import products, warehouses and suppliers first. Stock and purchase templates reference company SKUs, unique warehouse names and supplier emails; a reference workbook is available. Opening stock imports never overwrite existing stock. Purchase rows sharing `OrderKey` create one draft (up to 100 items); this key only groups the current file. Prices use a dot and at most two decimals. Stock changes, history and import receipts commit together; repeat uploads of identical contents do not create duplicates.

## QR and barcode workflow

Use **Scan QR / barcode** (`/scan`), the product list, or stock receipt/transfer and purchase-order forms. Focus the code field before using a USB keyboard reader (Enter suffix). Camera scanning requires HTTPS or localhost and explicit browser permission; PNG/JPG/WebP images are decoded locally (up to 5 MB / 12 MP). No image is uploaded and no stock changes happen merely by scanning.

Owners/Managers can add a manufacturer barcode when creating or editing a product, or import the optional text-formatted `Barcode` column. Leading zeros are significant; UPC-A and zero-prefixed EAN-13 codes are treated as equivalent. Download/print QR and Code 128 labels from product details. QR labels contain a versioned company/product ID and survive SKU changes; foreign-company labels are rejected. Raw barcode/SKU lookup uses the selected company. Ambiguous codes are rejected rather than choosing a product. Scanned URLs are never opened automatically.

Supported readers: QR, EAN-8/13, UPC-A/E, Code 128/39, ITF and Data Matrix. Camera accuracy depends on lighting, focus and code size. The reader and lookup API can be reused for a future mobile app.

## First-visit guide

New users receive a short company-setup hint, followed by a workspace tour after selecting a company (up to 10 steps; import guidance is for Owners/Managers). The tour highlights existing controls without navigating, submitting forms or changing data. Skip/finish is remembered per account and tour version in this browser's local storage; another browser or cleared storage shows it again. Restart from **App tour** in the desktop/mobile menu. Keyboard focus stays in the tour, Escape skips, and reduced-motion preferences disable animations. Automatic tours avoid edit/detail pages and active forms.

## Invo assistant

Invo appears at the bottom right after sign-in and company selection. It explains inventory workflows and provides quick navigation. Conversation text stays in this tab's memory; new chat, reload, company switch and sign-out clear it. No conversation database or browser storage is used. The assistant cannot read live company records or execute stock/business actions. This is workflow assistance, not RAG.

AI replies are **disabled by default**. Set `AI_CHAT_ENABLED=true`, `AI_CHAT_FREE_TIER_CONFIRMED=true` and `AI_CHAT_API_KEY` in the selected environment's protected server env file; Compose forwards these only to the API. Default model: `gemini-3.8-flash` (also allows `gemini-3.7-flash`). For local API execution, use equivalent `AiChat__Enabled`, `AiChat__FreeTierConfirmed`, `AiChat__ApiKey` environment variables. A private `.local/ai-chat.env` helper is not loaded automatically or uploaded by deployment. Never put keys in `NEXT_PUBLIC_*`, frontend code or Git.

Create a separate, **billing-disabled** project/key in [Google AI Studio](https://aistudio.google.com/apikey). Confirm its current [free-tier pricing](https://ai.google.dev/gemini-api/docs/pricing) and project quota before enabling. The application cannot inspect/enforce a key's Google billing plan; `FreeTierConfirmed` is an operator acknowledgement. Free service has limits and no production availability guarantee. There is no automatic retry, paid model fallback, grounding, agent or tool usage. Do not enable Google billing to bypass quota errors.

Messages are sent to Google only after explicit consent. Google's free tier may use them to improve its products; do not send sensitive/personal/business data. Provider retention is governed by Google's terms, separately from this application's lack of storage. Responses are displayed as escaped plain text. API access requires a current company membership; client history accepts only alternating user/assistant messages and cannot supply system instructions. Request/response sizes and inference duration are bounded; prompts, replies and API keys are excluded from application logs/traces.

Initial limits per API instance/environment: 4 requests/user/minute, 20/user/UTC day, 40 total/UTC day and 2 concurrent calls. Failed/cancelled provider attempts count; daily in-memory counters reset on restart. Provider limits remain authoritative and separate staging/production keys/projects are recommended. Metrics: `inventory.assistant.requests` (outcome), `inventory.assistant.duration` and `inventory.assistant.tokens` (input/output/thinking); no message text, user/company labels or secrets are attached.

## Scope and limitations

- Realtime and invitation dispatch currently assume one API instance per environment. Scaling requires coordinated workers and a shared SignalR transport; delivery is not exactly-once.
- Knowledge resources prepare data for future RAG. Invo currently provides workflow help; no live-data retrieval, embedding pipeline or vector database is included.
- WhatsApp/SMS automation is deferred: production delivery requires provider setup and potentially paid messages. No paid provider is activated.
- Backup/restore tooling is included, but installation, off-host storage and recovery drills must be configured and verified by the operator. Deployment alone does not enable them.
- Secrets and dependency checks reduce risk; they are not a penetration-test or compliance certification.

## Validation

```sh
dotnet build InventoryManagement.slnx --configuration Release
dotnet test InventoryManagement.UnitTests --configuration Release
dotnet test InventoryManagement.IntegrationTests --configuration Release
```

Integration tests require Docker. Frontend checks: `npm run lint`, `npm run typecheck`, `npm run build`. CI also scans Git history for secrets.
