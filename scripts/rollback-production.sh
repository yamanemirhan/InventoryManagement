#!/usr/bin/env bash

set -Eeuo pipefail

readonly app_directory="/opt/inventory-management"
readonly compose_file="/opt/inventory-runtime/production/compose.production.yml"
readonly environment_file=".env.production"

: "${TARGET_IMAGE_TAG:?TARGET_IMAGE_TAG must be provided}"
: "${API_IMAGE_REPOSITORY:?API_IMAGE_REPOSITORY must be provided}"
: "${FRONTEND_IMAGE_REPOSITORY:?FRONTEND_IMAGE_REPOSITORY must be provided}"

if [[ ! "${TARGET_IMAGE_TAG}" =~ ^[0-9a-f]{40}$ ]] \
  && [[ ! "${TARGET_IMAGE_TAG}" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
  echo "Rollback target must be an exact X.Y.Z version or a full 40-character Git SHA." >&2
  exit 1
fi

readonly target_api_image="${API_IMAGE_REPOSITORY}:${TARGET_IMAGE_TAG}"
readonly target_frontend_image="${FRONTEND_IMAGE_REPOSITORY}:${TARGET_IMAGE_TAG}"

cd "${app_directory}"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Rollback stopped because the server checkout has local changes." >&2
  git status --short
  exit 1
fi

if [[ ! -f "${environment_file}" ]]; then
  echo "Rollback stopped because ${environment_file} is missing." >&2
  exit 1
fi

readonly api_container="$(docker compose --project-directory "${app_directory}" --env-file "${environment_file}" -f "${compose_file}" ps -q api)"
readonly frontend_container="$(docker compose --project-directory "${app_directory}" --env-file "${environment_file}" -f "${compose_file}" ps -q frontend)"

if [[ -z "${api_container}" || -z "${frontend_container}" ]]; then
  echo "Rollback stopped because the current application containers could not be found." >&2
  exit 1
fi

readonly previous_api_image="$(docker inspect --format '{{.Config.Image}}' "${api_container}")"
readonly previous_frontend_image="$(docker inspect --format '{{.Config.Image}}' "${frontend_container}")"
readonly previous_api_repository="${previous_api_image%:*}"
readonly previous_frontend_repository="${previous_frontend_image%:*}"
readonly previous_api_tag="${previous_api_image##*:}"
readonly previous_frontend_tag="${previous_frontend_image##*:}"

export API_IMAGE_REPOSITORY
export FRONTEND_IMAGE_REPOSITORY
export IMAGE_TAG="${TARGET_IMAGE_TAG}"

echo "Current API image:      ${previous_api_image}"
echo "Current frontend image: ${previous_frontend_image}"
echo "Target API image:       ${target_api_image}"
echo "Target frontend image:  ${target_frontend_image}"

docker compose --project-directory "${app_directory}" --env-file "${environment_file}" -f "${compose_file}" pull api frontend

for image in "${target_api_image}" "${target_frontend_image}"; do
  if ! docker image inspect "${image}" > /dev/null 2>&1; then
    echo "Rollback stopped because the target image is missing: ${image}" >&2
    exit 1
  fi
  if [[ "$(docker image inspect --format '{{.Architecture}}' "$image")" != arm64 ]]; then
    echo "Rollback target must have an ARM64 image." >&2
    exit 1
  fi
done

if ! docker compose --project-directory "${app_directory}" --env-file "${environment_file}" -f "${compose_file}" up -d --no-build --remove-orphans --wait --wait-timeout 120 api frontend; then
  echo "Target version failed its health check. Attempting to restore the previous images." >&2

  if [[ "${previous_api_repository}" == "${API_IMAGE_REPOSITORY}" \
    && "${previous_frontend_repository}" == "${FRONTEND_IMAGE_REPOSITORY}" \
    && "${previous_api_tag}" == "${previous_frontend_tag}" ]]; then
    export IMAGE_TAG="${previous_api_tag}"
    docker compose --project-directory "${app_directory}" --env-file "${environment_file}" -f "${compose_file}" up -d --no-build --remove-orphans --wait --wait-timeout 120 api frontend || true
  else
    echo "Automatic restore was skipped because the previous image references did not share one known tag." >&2
  fi

  exit 1
fi

printf 'IMAGE_TAG=%s\nAPI_IMAGE_REPOSITORY=%s\nFRONTEND_IMAGE_REPOSITORY=%s\n' \
  "$IMAGE_TAG" "$API_IMAGE_REPOSITORY" "$FRONTEND_IMAGE_REPOSITORY" > /opt/inventory-runtime/production/images.env.tmp
chmod 600 /opt/inventory-runtime/production/images.env.tmp
mv /opt/inventory-runtime/production/images.env.tmp /opt/inventory-runtime/production/images.env
docker compose --project-directory "${app_directory}" --env-file "${environment_file}" -f "${compose_file}" ps
