import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [command, envFile] = process.argv.slice(2);
if (envFile) process.loadEnvFile(path.resolve(envFile));
const env = process.env;
const stage = env.IDENTITY_ENVIRONMENT ?? 'development';
if (!['development', 'staging', 'production'].includes(stage)) throw new Error('Invalid IDENTITY_ENVIRONMENT.');
const realm = `inventory-${stage}`;
const origin = env.APP_ORIGIN ?? (stage === 'development' ? 'http://localhost:3000' : '');
const identityUrl = (env.KEYCLOAK_URL ?? (stage === 'development' ? 'http://localhost:8088' : '')).replace(/\/$/, '');
function validateUrl(value) {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(stage === 'development' && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) throw new Error('Use HTTPS outside localhost development.');
}
validateUrl(origin); validateUrl(identityUrl);
if (new URL(origin).origin !== origin) throw new Error("APP_ORIGIN must contain only scheme, host and optional port; no path or trailing slash.");
if (stage !== "development" && new URL(identityUrl).pathname !== "/identity") throw new Error("Server identity deployments require KEYCLOAK_URL to end in /identity.");
async function adminHeaders() {
  for (const key of ['KEYCLOAK_ADMIN_USERNAME', 'KEYCLOAK_ADMIN_PASSWORD']) if (!env[key]) throw new Error(`Missing ${key}. Set it in the untracked environment file.`);
  const tokenResponse = await fetch(identityUrl + '/realms/master/protocol/openid-connect/token', {method:'POST', body:new URLSearchParams({client_id:'admin-cli', grant_type:'password', username:env.KEYCLOAK_ADMIN_USERNAME, password:env.KEYCLOAK_ADMIN_PASSWORD})});
  if (!tokenResponse.ok) throw new Error(`Administrator authentication failed (${tokenResponse.status}).`);
  const {access_token} = await tokenResponse.json();
  return {'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json'};
}


// Keycloak 25+ emits the access-token subject through the default basic scope.
// Preserve all other client scopes and identity-provider settings.
async function ensureBasicClientScope(headers, realmUrl, clientId) {
  const scopesResponse = await fetch(`${realmUrl}/client-scopes`, {headers});
  if (!scopesResponse.ok) throw new Error(`Client scope lookup failed (${scopesResponse.status}).`);
  const scopes = await scopesResponse.json();
  const basic = scopes.find(scope => scope.name === 'basic' && scope.protocol === 'openid-connect');
  if (!basic) throw new Error('The realm is missing the built-in basic client scope.');
  const endpoint = `${realmUrl}/clients/${clientId}/default-client-scopes`;
  const currentResponse = await fetch(endpoint, {headers});
  if (!currentResponse.ok) throw new Error(`Default scope lookup failed (${currentResponse.status}).`);
  const current = await currentResponse.json();
  if (!current.some(scope => scope.id === basic.id)) {
    const update = await fetch(`${endpoint}/${basic.id}`, {method: 'PUT', headers});
    if (!update.ok) throw new Error(`Basic scope assignment failed (${update.status}).`);
  }
  const verification = await fetch(endpoint, {headers});
  if (!verification.ok || !(await verification.json()).some(scope => scope.id === basic.id)) {
    throw new Error('Basic client scope verification failed.');
  }
}

if (command === 'realm') {
  const definition = JSON.parse(fs.readFileSync(path.join(root, 'deploy/keycloak/development-realm.json'), 'utf8'));
  definition.realm = realm;
  definition.displayName = `Inventory Management — ${stage}`;
  definition.sslRequired = stage === 'development' ? 'external' : 'all';
  definition.verifyEmail = stage !== 'development';
  const web = definition.clients.find(c => c.clientId === 'inventory-web');
  web.redirectUris = [origin + '/auth/callback']; web.webOrigins = [origin];
  web.attributes['post.logout.redirect.uris'] = origin + '/auth/login';
  const output = path.join(root, '.local', 'identity', 'realms');
  fs.mkdirSync(output, {recursive: true});
  fs.writeFileSync(path.join(output, realm + '-realm.json'), JSON.stringify(definition, null, 2));
  console.log(`Realm definition: .local/identity/realms/${realm}-realm.json. Import into the matching Keycloak environment.`);
} else if (command === 'token-scopes') {
  const headers = await adminHeaders();
  const realmUrl = `${identityUrl}/admin/realms/${realm}`;
  const response = await fetch(`${realmUrl}/clients?clientId=inventory-web`, {headers});
  if (!response.ok) throw new Error(`Client lookup failed (${response.status}).`);
  const clients = await response.json();
  if (clients.length !== 1) throw new Error('Expected exactly one inventory-web client.');
  await ensureBasicClientScope(headers, realmUrl, clients[0].id);
  console.log(`Required access-token scope verified for ${realm}/inventory-web.`);
} else if (command === 'sync') {
  const headers = await adminHeaders();
  const realmUrl = `${identityUrl}/admin/realms/${realm}`;
  const realmResponse = await fetch(realmUrl, {headers});
  if (!realmResponse.ok) throw new Error(`Realm lookup failed (${realmResponse.status}).`);
  const realmDefinition = await realmResponse.json();
  Object.assign(realmDefinition, {
    registrationAllowed: true,
    registrationEmailAsUsername: true,
    loginWithEmailAllowed: true,
    duplicateEmailsAllowed: false,
    resetPasswordAllowed: true,
    editUsernameAllowed: false,
    rememberMe: true,
    bruteForceProtected: true,
    verifyEmail: stage !== 'development',
    internationalizationEnabled: true,
    supportedLocales: ['en', 'tr'],
    defaultLocale: 'en'
  });
  const managed = JSON.parse(fs.readFileSync(path.join(root, 'deploy/keycloak/development-realm.json'), 'utf8'));
  for (const key of ['loginTheme', 'passwordPolicy', 'ssoSessionIdleTimeoutRememberMe', 'ssoSessionMaxLifespanRememberMe']) {
    realmDefinition[key] = managed[key];
  }
  const realmUpdate = await fetch(realmUrl, {method: 'PUT', headers, body: JSON.stringify(realmDefinition)});
  if (!realmUpdate.ok) throw new Error(`Realm update failed (${realmUpdate.status}).`);

  const clientsResponse = await fetch(`${realmUrl}/clients?clientId=inventory-web`, {headers});
  if (!clientsResponse.ok) throw new Error(`Client lookup failed (${clientsResponse.status}).`);
  const clients = await clientsResponse.json();
  if (clients.length !== 1) throw new Error(`Expected exactly one inventory-web client, found ${clients.length}.`);
  const clientResponse = await fetch(`${realmUrl}/clients/${clients[0].id}`, {headers});
  if (!clientResponse.ok) throw new Error(`Full client lookup failed (${clientResponse.status}).`);
  const web = await clientResponse.json();
  Object.assign(web, {
    publicClient: true,
    standardFlowEnabled: true,
    implicitFlowEnabled: false,
    directAccessGrantsEnabled: false,
    serviceAccountsEnabled: false,
    redirectUris: [origin + '/auth/callback'],
    webOrigins: [origin],
    attributes: {
      ...(web.attributes ?? {}),
      'pkce.code.challenge.method': 'S256',
      'post.logout.redirect.uris': origin + '/auth/login'
    }
  });
  const clientUpdate = await fetch(`${realmUrl}/clients/${web.id}`, {method: 'PUT', headers, body: JSON.stringify(web)});
  if (!clientUpdate.ok) throw new Error(`Client update failed (${clientUpdate.status}).`);
  const clientVerification = await fetch(`${realmUrl}/clients/${web.id}`, {headers});
  if (!clientVerification.ok) throw new Error(`Client verification failed (${clientVerification.status}).`);
  const verifiedWeb = await clientVerification.json();
  if (verifiedWeb.attributes?.['pkce.code.challenge.method'] !== 'S256' || verifiedWeb.attributes?.['post.logout.redirect.uris'] !== origin + '/auth/login') {
    throw new Error('Client attributes were not persisted by Keycloak.');
  }
  await ensureBasicClientScope(headers, realmUrl, web.id);
  console.log(`Realm ${realm} and inventory-web synchronized with ${origin}.`);
} else if (command === 'smtp') {
  for (const key of ['SMTP_FROM', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD']) if (!env[key]) throw new Error(`Missing ${key}. Set it in the untracked environment file.`);
  const port = Number.parseInt(env.SMTP_PORT, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT must be a valid TCP port.');
  const starttls = env.SMTP_STARTTLS !== 'false';
  const ssl = env.SMTP_SSL === 'true';
  if (stage !== 'development' && !starttls && !ssl) throw new Error('SMTP transport encryption is required outside development.');
  if (starttls && ssl) throw new Error('Enable either SMTP_STARTTLS or SMTP_SSL, not both.');
  const headers = await adminHeaders();
  const realmUrl = `${identityUrl}/admin/realms/${realm}`;
  const realmResponse = await fetch(realmUrl, {headers});
  if (!realmResponse.ok) throw new Error(`Realm lookup failed (${realmResponse.status}).`);
  const realmDefinition = await realmResponse.json();
  realmDefinition.smtpServer = {
    from: env.SMTP_FROM,
    fromDisplayName: 'Inventory Management',
    host: env.SMTP_HOST,
    port: String(port),
    auth: 'true',
    user: env.SMTP_USERNAME,
    password: env.SMTP_PASSWORD,
    starttls: String(starttls),
    ssl: String(ssl)
  };
  const update = await fetch(realmUrl, {method: 'PUT', headers, body: JSON.stringify(realmDefinition)});
  if (!update.ok) throw new Error(`SMTP configuration failed (${update.status}).`);
  const verification = await fetch(realmUrl, {headers});
  if (!verification.ok) throw new Error(`SMTP verification failed (${verification.status}).`);
  const verified = (await verification.json()).smtpServer ?? {};
  if (verified.from !== env.SMTP_FROM || verified.host !== env.SMTP_HOST || verified.port !== String(port) || verified.starttls !== String(starttls) || verified.ssl !== String(ssl) || verified.auth !== 'true') {
    throw new Error('SMTP verification returned unexpected settings.');
  }
  console.log(`SMTP configured for ${realm} using ${env.SMTP_HOST}:${port}.`);
} else if (command === 'smtp-test') {
  const targetEmail = env.SMTP_TEST_EMAIL ?? env.SMTP_FROM;
  if (!targetEmail || !targetEmail.includes('@')) throw new Error('Set SMTP_TEST_EMAIL or SMTP_FROM to an existing realm user email.');
  const headers = await adminHeaders();
  const realmUrl = `${identityUrl}/admin/realms/${realm}`;
  const lookup = await fetch(`${realmUrl}/users?email=${encodeURIComponent(targetEmail)}&exact=true`, {headers});
  if (!lookup.ok) throw new Error(`SMTP test user lookup failed (${lookup.status}).`);
  const users = await lookup.json();
  if (users.length !== 1) throw new Error(`SMTP test requires exactly one existing realm user for SMTP_TEST_EMAIL or SMTP_FROM; found ${users.length}.`);
  const query = new URLSearchParams({client_id: 'inventory-web', redirect_uri: origin + '/auth/callback'});
  const result = await fetch(`${realmUrl}/users/${users[0].id}/send-verify-email?${query}`, {method: 'PUT', headers});
  if (!result.ok) throw new Error(`Verification email test failed (${result.status}). Verify the stored SMTP credentials.`);
  console.log(`Verification email sent successfully for ${realm}.`);
} else if (command === 'google') {
  for (const key of ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET']) if (!env[key]) throw new Error(`Missing ${key}. Set it in the untracked environment file.`);
  const headers = await adminHeaders();
  const base = `${identityUrl}/admin/realms/${realm}/identity-provider/instances`;
  const existing = await fetch(base + '/google', {headers});
  if (!existing.ok && existing.status !== 404) throw new Error(`Provider lookup failed (${existing.status}).`);
  const provider = JSON.parse(fs.readFileSync(path.join(root, 'deploy/keycloak/google-provider.template.json'), 'utf8'));
  provider.config.clientId = env.GOOGLE_CLIENT_ID; provider.config.clientSecret = env.GOOGLE_CLIENT_SECRET;
  const result = await fetch(base + (existing.ok ? '/google' : ''), {method:existing.ok?'PUT':'POST', headers, body:JSON.stringify(provider)});
  if (!result.ok) throw new Error(`Provider configuration failed (${result.status}).`);
  const verification = await fetch(base + '/google', {headers});
  if (!verification.ok) throw new Error(`Provider verification failed (${verification.status}).`);
  const verifiedProvider = await verification.json();
  if (!verifiedProvider.enabled || verifiedProvider.trustEmail || verifiedProvider.storeToken || verifiedProvider.config?.clientId !== env.GOOGLE_CLIENT_ID) {
    throw new Error('Google provider verification returned unsafe or unexpected settings.');
  }
  console.log(`Google provider configured for ${realm}. Google authorized redirect URI: ${identityUrl}/realms/${realm}/broker/google/endpoint`);
  console.log('Set GOOGLE_LOGIN_ENABLED=true on the frontend and restart it.');
} else throw new Error('Usage: node scripts/configure-identity.mjs realm|sync|token-scopes|smtp|smtp-test|google [untracked-env-file]');
