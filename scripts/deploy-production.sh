#!/usr/bin/env bash

set -Eeuo pipefail

readonly app_directory="/opt/inventory-management"
readonly compose_file="compose.production.yml"
readonly environment_file=".env.production"

: "${DEPLOY_SHA:?DEPLOY_SHA must be provided}"

if [[ ! "${DEPLOY_SHA}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "DEPLOY_SHA must be a full Git commit SHA." >&2
  exit 1
fi

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

git fetch --prune origin "+refs/heads/main:refs/remotes/origin/main"

readonly remote_sha="$(git rev-parse refs/remotes/origin/main)"
if [[ "${remote_sha}" != "${DEPLOY_SHA}" ]]; then
  echo "Deployment stopped because origin/main no longer matches this workflow commit." >&2
  echo "Expected: ${DEPLOY_SHA}" >&2
  echo "Current:  ${remote_sha}" >&2
  exit 1
fi

git checkout main
git merge --ff-only "${DEPLOY_SHA}"

export IMAGE_TAG="${DEPLOY_SHA}"

docker compose --env-file "${environment_file}" -f "${compose_file}" build api frontend
docker compose --env-file "${environment_file}" -f "${compose_file}" --profile migration run --rm --no-tty migrate < /dev/null
docker compose --env-file "${environment_file}" -f "${compose_file}" up -d --no-build --remove-orphans --wait --wait-timeout 120 postgres api frontend
docker compose --env-file "${environment_file}" -f "${compose_file}" ps
