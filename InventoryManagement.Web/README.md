# Inventory Management Web

Next.js App Router frontend for the Inventory Management API. The package name is `inventory-management-web`.

## Local development

Requires Node.js 20.9+, the .NET 10 API, PostgreSQL and Keycloak. First follow [identity setup](../IDENTITY_ENVIRONMENTS.md). From the repository root:

```powershell
docker compose up -d postgres
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet ef database update --project InventoryManagement.Infrastructure --startup-project InventoryManagement.Api
dotnet run --project InventoryManagement.Api --launch-profile http
```

In a separate terminal, from `InventoryManagement.Web`:

```powershell
npm ci
# On first setup only; preserve an existing .env.local.
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

The development API runs at `http://localhost:5138`; the frontend runs at `http://localhost:3000`. Configure `NEXT_PUBLIC_API_BASE_URL` in `.env.local`. An empty string uses the current origin for existing reverse-proxy deployments. Public Next.js environment variables are embedded at build time. The API must allow the frontend origin in `Cors:AllowedOrigins`.

Windows environments without Event Log write permissions can set `Logging__EventLog__LogLevel__Default=None` for the local terminal before EF commands. The installed EF CLI should match the EF Core 10 major version.

## Screens and behavior

- Product, warehouse, and supplier lists, creation forms, and details.
- Warehouse stock selection, stock receipts, transfers, and movement history.
- Purchase order list, paginated results, dynamic item rows, and lifecycle actions.
- Receive an ordered purchase to add all items to warehouse stock atomically.
- Client validation, field-level API validation, retryable read errors, empty states, and accessible loading skeletons.
- Responsive navigation, native keyboard-accessible confirmation dialogs, and reduced-motion support.

The workspace home links to inventory workflows. Stock overview displays quantities across all warehouses or a selected location.

## Themes

All palette values live in `src/app/globals.css`. Components use semantic tokens such as `brand`, `surface`, `ink`, `muted`, `line`, `success`, and `danger`.

The default forest palette and alternate `[data-theme="indigo"]` palette share the same components. The palette button in the header switches between them and persists the choice in a preference cookie. Dark mode is the default; light mode has its own semantic variables. To add a palette, add matching CSS overrides for both modes and extend `src/components/layout/preferences.tsx` and the server cookie resolver in `src/app/layout.tsx`. No feature component needs its colors rewritten.

## Language support

User-facing copy lives in `src/lib/i18n/en.ts`. `src/lib/i18n/index.ts` creates the typed dictionary and number/amount/date formatters with pluralized counts. Server components use `getI18n()`; client components use `useI18n()`. HTML language and page metadata use the same source.

English is the default; Turkish is available from the header. Locale cookies, HTML language, metadata and formatters stay consistent. To add a locale, provide a dictionary satisfying `Messages` and extend `resolveLocale`, the preference selector and the backend supported cultures/messages. The API reads Accept-Language and localizes authentication, business and validation responses. Dates are explicitly shown in UTC; amounts are currency-neutral because the current backend contract has no currency field.

## State and API contracts

- TanStack Query owns server data. Feature-specific query key factories drive cache invalidation.
- Redux Toolkit stores selected warehouse and mobile navigation state only.
- React Hook Form and Zod own form state and client validation.
- The shared API client refreshes the in-memory Keycloak token, adds Bearer authentication and Accept-Language, and supports JSON, empty/204 responses, AbortSignal, custom request headers, ProblemDetails, and field errors.
- Stock changes invalidate warehouse stock and movement history. Purchase lifecycle changes also refresh purchase orders.
- Writes are never automatically retried by the frontend. A concurrency conflict refreshes the affected data and asks the user to review it before retrying.
- Product, warehouse, and supplier lookup endpoints retain list-array contracts. Purchase orders and the new history page endpoint return paginated results.

## Quality checks

```powershell
npm run lint
npm run typecheck
npm run build
```


## Identity, themes, language and stock totals

Keycloak provides authentication and Admin/User authorization. See
[the identity environments guide](../IDENTITY_ENVIRONMENTS.md) before running the application.
The default appearance is dark with a forest accent; the default language is English.
Header preferences switch dark/light, forest/indigo and English/Turkish across all application pages.
The stock overview now includes all-warehouse totals and a warehouse selector.
Google login needs environment-specific OAuth credentials before it can be enabled.
