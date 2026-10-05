# Identity and deployment configuration

Tracked configuration contains no provider credentials, user exports or live database passwords. Populated env files, generated realm exports, backups and local artifacts must stay outside Git and Docker build contexts.

## Environment files

| Template | Purpose |
| --- | --- |
| `.env.example` in this directory | Copy to repository-root `.env.identity` for local Keycloak |
| `../../InventoryManagement.Web/.env.example` | Copy to frontend `.env.local`; all `NEXT_PUBLIC_*` values are public |
| `../../.env.production.example`, `../../.env.staging.example` | Application runtime fields; server bootstrap generates DB credentials/connection strings |
| `production.env.example`, `staging.env.example` | Identity runtime fields, including optional Google and required server SMTP configuration |
| `../../.env.example` | Compatibility copy of the production application template, not a local-development requirement |

The Oracle helper creates protected application env files under `/opt/inventory-management` and identity env files under `/opt/inventory-identity/<stage>`. It generates distinct random credentials on first setup and preserves existing values thereafter. Templates are references: do not copy blank passwords over a configured environment or change a PostgreSQL env password without also changing the initialized database role.

The public hostnames and loopback ports in the templates are configuration, not credentials. Adapt `DOMAINS`, `PORTS` and directory constants in `scripts/oracle-server.py` for another installation. The helper expects an existing Ubuntu ARM64 host with Docker, Nginx, valid Certbot certificates and a clean repository checkout.

`MAIL_*_BASE64` values are transport encoding, not encryption. Bootstrap derives them from the identity SMTP settings; protect them exactly like plaintext passwords.

For the optional public demo button, set `DEMO_LOGIN_ENABLED=true`, `DEMO_LOGIN_EMAIL` and `DEMO_LOGIN_PASSWORD` in that environment's private application env. Provision the account first, with no platform administrator role and memberships only in synthetic demo companies. The frontend receives the credentials as server runtime variables; only an enabled flag reaches browser configuration. Each environment enables its own demo independently; an account in production does not exist automatically in staging.

## File-managed Keycloak

- `development-realm.json`: localhost realm; email verification is disabled for local development only.
- `server-realm.template.json`: HTTPS realms, exact callbacks, API audience, required token scopes, roles and session/password rules.
- `google-provider.template.json`, `smtp.template.json`: provider definitions; secrets are substituted in memory from the private env file.
- `themes/inventory`: custom login, registration, password recovery and account-action styling.

The server workflow runs `prepare <stage>` and `identity <stage>` through `scripts/oracle-server.py`. Startup import creates missing realms; the identity command updates managed settings in existing realms while preserving users and unmanaged configuration. Editing templates without applying them does not update a running realm. Theme changes require a Keycloak recreation; deployment handles this when the theme digest changes.

The browser uses `inventory-web` with Authorization Code + PKCE. API tokens must include `sub` and audience `inventory-api`; the default `basic` scope supplies `sub`. For an existing local realm, `node scripts/configure-identity.mjs sync .env.identity` synchronizes the managed client/realm settings. Sign in again after token-scope changes.

Realm `Admin` grants platform administration. Realm `User` does not grant access to existing company data: company membership determines Owner/Manager/Operator/Viewer permissions. Newly registered users are never platform administrators.

## Google and email

Google is optional. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the private identity env. In that same Google OAuth web client, authorize the exact broker callback:

```text
https://<app-host>/identity/realms/inventory-<stage>/broker/google/endpoint
```

For local Keycloak, the broker callback is `http://localhost:8088/realms/inventory-development/broker/google/endpoint`. These Google callbacks are different from the web client's `/auth/callback`. Keycloak configuration cannot update Google's allowlist. Use separate Google clients per environment, or explicitly authorize both server callbacks on the shared client.

Server registration verifies email. Configure `SMTP_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` and either STARTTLS or SSL in the identity env. SMTP is needed for verification, password recovery and invitations. Do not disable verification to work around missing SMTP. For optional local providers, the configuration CLI provides `google` and `smtp` commands using `.env.identity`.

## GitHub Actions

Deployment requires repository secrets `SERVER_HOST`, `SERVER_USER`, `SSH_PRIVATE_KEY` and `SSH_KNOWN_HOSTS` (the verified SSH host key). The workflow's scoped `GITHUB_TOKEN` handles GHCR access. Set repository variables `STAGING_HEALTH_URL` and `PRODUCTION_HEALTH_URL` to the respective HTTPS `/api/health` endpoints.

Pull requests run validation; deployment jobs run only on pushes to the configured branches. Fork contributors do not need deployment credentials to run the app locally. Do not change these workflows to run untrusted pull-request code with deployment secrets.

The hourly availability workflow reports endpoint failure/recovery through GitHub issues. Optional backup/restore operations require a separately configured `INVENTORY_BACKUP_PASSPHRASE`; retain a recovery copy and verify the restore result. Never expose generated archives, credentials or operational logs in a public issue.
