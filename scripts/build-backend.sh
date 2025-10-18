#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${1:-swkoo-backend:dev}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Building backend image: ${IMAGE_TAG}"
docker build \
  -f "${ROOT_DIR}/apps/backend/Dockerfile" \
  -t "${IMAGE_TAG}" \
  "${ROOT_DIR}/apps/backend"
