#!/usr/bin/env bash
set -Eeuo pipefail

: "${DEPLOY_STAGE:?Select staging or production}"
: "${DEPLOY_SHA:?DEPLOY_SHA must be provided}"
: "${API_IMAGE_REPOSITORY:?API_IMAGE_REPOSITORY must be provided}"
: "${FRONTEND_IMAGE_REPOSITORY:?FRONTEND_IMAGE_REPOSITORY must be provided}"
case "$DEPLOY_STAGE" in staging) branch=develop;; production) branch=main;; *) exit 1;; esac
[[ "$DEPLOY_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "Use a full Git SHA" >&2; exit 1; }
[[ "$(uname -m)" == aarch64 ]] || { echo "Oracle deployment requires ARM64" >&2; exit 1; }

readonly app_directory=/opt/inventory-management
readonly runtime_directory="/opt/inventory-runtime/${DEPLOY_STAGE}"
readonly identity_directory="/opt/inventory-identity/${DEPLOY_STAGE}"
cd "$app_directory"
mkdir -p .local
exec 9>.local/deploy.lock
flock -n 9 || { echo "Another server deployment is running" >&2; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo "Server checkout has local changes" >&2; exit 1; }
git fetch --prune origin "+refs/heads/${branch}:refs/remotes/origin/${branch}"
[[ "$(git rev-parse "refs/remotes/origin/${branch}")" == "$DEPLOY_SHA" ]] || {
  echo "Deployment superseded by a newer branch commit" >&2; exit 1;
}
# A detached exact revision avoids branch switching/merge drift on the shared VM.
git checkout --detach "$DEPLOY_SHA"
sudo -n python3 scripts/oracle-server.py prepare "$DEPLOY_STAGE"
sudo -n python3 scripts/oracle-server.py nginx

export IMAGE_TAG="$DEPLOY_SHA" API_IMAGE_REPOSITORY FRONTEND_IMAGE_REPOSITORY
application=(docker compose --project-directory "$app_directory" --env-file "$app_directory/.env.${DEPLOY_STAGE}" -f "$runtime_directory/compose.${DEPLOY_STAGE}.yml")
identity=(docker compose --project-directory "$identity_directory" --env-file "$identity_directory/.env.identity" -f "$identity_directory/compose.identity.server.yml")
"${application[@]}" --profile migration config --quiet
"${identity[@]}" config --quiet
"${application[@]}" pull api frontend app-db
"${identity[@]}" pull
for repository in "$API_IMAGE_REPOSITORY" "$FRONTEND_IMAGE_REPOSITORY"; do
  [[ "$(docker image inspect --format '{{.Architecture}}' "$repository:$IMAGE_TAG")" == arm64 ]] || {
    echo "CI image lacks ARM64 support" >&2; exit 1;
  }
done
"${application[@]}" up -d --no-build --wait --wait-timeout 180 app-db
"${identity[@]}" up -d --wait --wait-timeout 180 identity-db
identity_options=()
if [[ -f "$identity_directory/.themes-updated" ]]; then
  identity_options+=(--force-recreate)
fi
"${identity[@]}" up -d --no-deps --wait --wait-timeout 240 "${identity_options[@]}" keycloak
sudo -n python3 scripts/oracle-server.py identity "$DEPLOY_STAGE"
sudo -n rm -f -- "$identity_directory/.themes-updated"
"${application[@]}" --profile migration run --rm --no-tty migrate < /dev/null
"${application[@]}" up -d --no-build --wait --wait-timeout 180 api frontend

case "$DEPLOY_STAGE" in
  staging) origin=https://staging-inventory-yamanemirhan.duckdns.org;;
  production) origin=https://inventory-yamanemirhan.duckdns.org;;
esac
curl --fail --silent --show-error --max-time 15 "$origin/api/health/ready"
curl --fail --silent --show-error --max-time 15 --output /dev/null "$origin/auth/login"
curl --fail --silent --show-error --max-time 15 --output /dev/null "$origin/identity/realms/inventory-${DEPLOY_STAGE}/.well-known/openid-configuration"
# Persist the last healthy image tag for maintenance commands and VM restarts.
printf 'IMAGE_TAG=%s\nAPI_IMAGE_REPOSITORY=%s\nFRONTEND_IMAGE_REPOSITORY=%s\n' \
  "$IMAGE_TAG" "$API_IMAGE_REPOSITORY" "$FRONTEND_IMAGE_REPOSITORY" > "$runtime_directory/images.env.tmp"
chmod 600 "$runtime_directory/images.env.tmp"
mv "$runtime_directory/images.env.tmp" "$runtime_directory/images.env"
"${application[@]}" ps
"${identity[@]}" ps
