#!/usr/bin/env bash

set -Eeuo pipefail

readonly app_directory="/opt/inventory-management"
readonly compose_file="compose.staging.yml"
readonly environment_file=".env.staging"

: "${DEPLOY_SHA:?DEPLOY_SHA must be provided}"
: "${API_IMAGE_REPOSITORY:?API_IMAGE_REPOSITORY must be provided}"
: "${FRONTEND_IMAGE_REPOSITORY:?FRONTEND_IMAGE_REPOSITORY must be provided}"

if [[ ! "${DEPLOY_SHA}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "DEPLOY_SHA must be a full Git commit SHA." >&2
  exit 1
fi

readonly api_image="${API_IMAGE_REPOSITORY}:${DEPLOY_SHA}"
readonly frontend_image="${FRONTEND_IMAGE_REPOSITORY}:${DEPLOY_SHA}"

cd "${app_directory}"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Deployment stopped because the server checkout has local changes." >&2
  git status --short
  exit 1
fi

if [[ ! -f "${environment_file}" ]]; then
  echo "Deployment stopped because ${environment_file} is missing." >&2
  exit 1
fi

git fetch --prune origin "+refs/heads/develop:refs/remotes/origin/develop"

readonly remote_sha="$(git rev-parse refs/remotes/origin/develop)"
if [[ "${remote_sha}" != "${DEPLOY_SHA}" ]]; then
  echo "Deployment stopped because origin/develop no longer matches this workflow commit." >&2
  echo "Expected: ${DEPLOY_SHA}" >&2
  echo "Current:  ${remote_sha}" >&2
  exit 1
fi

if git show-ref --verify --quiet refs/heads/develop; then
  git checkout develop
else
  git checkout --track -b develop refs/remotes/origin/develop
fi
git merge --ff-only "${DEPLOY_SHA}"

sudo -n python3 scripts/configure-staging-proxy.py

export IMAGE_TAG="${DEPLOY_SHA}"
export API_IMAGE_REPOSITORY
export FRONTEND_IMAGE_REPOSITORY

docker compose --env-file "${environment_file}" -f "${compose_file}" pull api frontend

for image in "${api_image}" "${frontend_image}"; do
  if ! docker image inspect "${image}" > /dev/null 2>&1; then
    echo "Deployment stopped because the CI-built image is missing: ${image}" >&2
    exit 1
  fi
done

docker compose --env-file "${environment_file}" -f "${compose_file}" --profile migration run --rm --no-tty migrate < /dev/null
docker compose --env-file "${environment_file}" -f "${compose_file}" up -d --no-build --remove-orphans --wait --wait-timeout 120 api frontend
docker compose --env-file "${environment_file}" -f "${compose_file}" ps
