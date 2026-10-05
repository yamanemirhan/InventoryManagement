# InventoryManagement Web

Next.js 16 / React 19 / TypeScript frontend for the inventory API. See the [project README](../README.md) for features, architecture and complete local setup.

## Development

Use Node.js 24. Start the API and local Keycloak first, then copy `.env.example` to `.env.local`:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. `NEXT_PUBLIC_API_BASE_URL` defaults to the local API; production uses an empty value for same-origin `/api/` requests. Public Next.js variables are embedded at build time and must never contain credentials. Keycloak URL, realm and public client ID are runtime configuration, not client secrets.

## State ownership

| Concern | Implementation |
| --- | --- |
| Server data and cache invalidation | TanStack Query |
| Selected warehouse and navigation UI | Redux Toolkit |
| Forms and client validation | React Hook Form / Zod |
| Authentication | Keycloak JS; access/refresh tokens remain in memory |
| Company selection | Company provider; full navigation clears the previous company's state |
| Realtime changes | SignalR notifications trigger authorized data refetches |

The API client refreshes tokens, sends Bearer authentication, `X-Company-Id` and language headers, and handles ProblemDetails/validation errors. Writes are not automatically retried. Concurrency conflicts require reloading and reviewing the current data.

Authentication screens use the app's [Keycloak theme](../deploy/keycloak/themes/inventory). Guest pages remain usable during an identity outage; silent SSO and login availability checks are bounded. The `/account` page launches profile/password actions through the identity service.

## UI and files

- Feature modules live in `src/features`; App Router pages in `src/app` compose them.
- Shared UI uses semantic CSS tokens in `src/app/globals.css` with light/dark and forest/indigo themes.
- English/Turkish dictionaries live in `src/lib/i18n`; date filters and activity timestamps use UTC.
- ExcelJS handles CSV/XLSX import/export. Imports validate a preview before submission; backend validation remains authoritative.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
npm audit
```

As of 2026-10-05, the full audit reports [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) in `braces`, pulled in by the Next.js ESLint plugin. No patched upstream release is available. This is a development-only dependency; `npm audit --omit=dev` reports no vulnerabilities. CI checks production dependencies separately, and the full audit should still be reviewed when updating tooling. Do not use `npm audit fix --force`: its suggested Next.js ESLint downgrade is incompatible with this project's framework version.
