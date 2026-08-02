#!/usr/bin/env bash
# Build for linux/amd64 (EC2) and push to Amazon ECR.
# Run on your dev machine before deploying to x86 servers.
#
# Usage:
#   ./scripts/push-ecr.sh
#   ./scripts/push-ecr.sh --tag v1.0.0
#   AWS_PROFILE=manu ./scripts/push-ecr.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

AWS_PROFILE="${AWS_PROFILE:-manu}"
AWS_REGION="${AWS_REGION:-ap-south-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-313448432124}"
ECR_REPOSITORY="${ECR_REPOSITORY:-rachel}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
PLATFORM="${PLATFORM:-linux/amd64}"
NO_CACHE=0
GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag) IMAGE_TAG="$2"; shift 2 ;;
    --profile) AWS_PROFILE="$2"; shift 2 ;;
    --region) AWS_REGION="$2"; shift 2 ;;
    --no-cache) NO_CACHE=1; shift ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_IMAGE="${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
ECR_IMAGE_SHA="${ECR_REGISTRY}/${ECR_REPOSITORY}:${GIT_SHA}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Error: '$1' required." >&2; exit 1; }
}

require_cmd docker
require_cmd aws

echo "==> Ensuring ECR repository exists..."
aws ecr describe-repositories \
  --repository-names "$ECR_REPOSITORY" \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" >/dev/null 2>&1 \
  || aws ecr create-repository \
    --repository-name "$ECR_REPOSITORY" \
    --profile "$AWS_PROFILE" \
    --region "$AWS_REGION" \
    --image-scanning-configuration scanOnPush=true >/dev/null

echo "==> Logging in to ECR..."
aws ecr get-login-password \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"

if ! docker buildx version >/dev/null 2>&1; then
  echo "Error: docker buildx is required for cross-platform builds." >&2
  exit 1
fi

BUILDER_NAME="vk-ecr-builder"
if ! docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
  echo "==> Creating buildx builder..."
  docker buildx create --name "$BUILDER_NAME" --use
else
  docker buildx use "$BUILDER_NAME"
fi

echo "==> Building and pushing ${PLATFORM} image..."
echo "    ${ECR_IMAGE}"
echo "    ${ECR_IMAGE_SHA}"

BUILD_ARGS=(--platform "$PLATFORM" --tag "$ECR_IMAGE" --tag "$ECR_IMAGE_SHA" --push)
if [[ "$NO_CACHE" -eq 1 ]]; then
  BUILD_ARGS+=(--no-cache)
  echo "==> Building with --no-cache"
fi

docker buildx build "${BUILD_ARGS[@]}" .

echo ""
echo "Pushed:"
echo "  ${ECR_IMAGE}"
echo "  ${ECR_IMAGE_SHA}"
echo ""
echo "On EC2 (recommended if Mac image was arm64), build natively then deploy:"
echo "  ./scripts/deploy-server.sh --build --base-url http://YOUR_IP:3000"
echo ""
echo "Optional: push this amd64 build to ECR from EC2:"
echo "  aws ecr get-login-password --region ${AWS_REGION} --profile ${AWS_PROFILE} | docker login --username AWS --password-stdin ${ECR_REGISTRY}"
echo "  docker push ${ECR_IMAGE}"
