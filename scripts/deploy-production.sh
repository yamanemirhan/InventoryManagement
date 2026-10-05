#!/usr/bin/env bash
set -Eeuo pipefail
export DEPLOY_STAGE=production
exec bash "$(dirname "${BASH_SOURCE[0]}")/deploy-environment.sh"
