#!/usr/bin/env bash
# Deploy Rachel/VK site on a server (EC2).
#
# Default: pull linux/amd64 image from ECR.
# Use --build on EC2 if the ECR image was built on Apple Silicon (arm64).
#
# Prerequisites:
#   - Docker + docker-compose (or docker compose plugin)
#   - .env in project root
#   - AWS CLI (only when pulling from ECR, not for --build)
#
# Usage:
#   ./scripts/deploy-server.sh --build --base-url http://YOUR_IP:3000
#   ./scripts/deploy-server.sh --base-url http://YOUR_IP:3000
#   ./scripts/deploy-server.sh --sync-catalog --build

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

AWS_PROFILE="${AWS_PROFILE:-manu}"
AWS_REGION="${AWS_REGION:-ap-south-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-313448432124}"
ECR_REPOSITORY="${ECR_REPOSITORY:-rachel}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
APP_PORT="${APP_PORT:-3000}"
APP_BASE_URL="${APP_BASE_URL:-http://localhost:${APP_PORT}}"
SYNC_CATALOG=0
BUILD_ON_SERVER=0

usage() {
  cat <<'EOF'
Deploy the app + MySQL on this server.

Options:
  --build             Build the Docker image on this server (recommended on EC2)
  --tag TAG           Image tag (default: latest)
  --profile PROFILE   AWS CLI profile for ECR pull (default: manu)
  --region REGION     AWS region (default: ap-south-1)
  --port PORT         Host port (default: 3000)
  --base-url URL      APP_BASE_URL (default: http://localhost:PORT)
  --sync-catalog      Seed/sync products after deploy
  -h, --help          Show help

Examples:
  # First deploy on EC2 (build native amd64 image + MySQL):
  ./scripts/deploy-server.sh --build --base-url http://3.110.x.x:3000 --sync-catalog

  # Later deploys (pull from ECR after amd64 image is pushed):
  ./scripts/deploy-server.sh --base-url http://3.110.x.x:3000
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --build) BUILD_ON_SERVER=1; shift ;;
    --tag) IMAGE_TAG="$2"; shift 2 ;;
    --profile) AWS_PROFILE="$2"; shift 2 ;;
    --region) AWS_REGION="$2"; shift 2 ;;
    --port) APP_PORT="$2"; shift 2 ;;
    --base-url) APP_BASE_URL="$2"; shift 2 ;;
    --sync-catalog) SYNC_CATALOG=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 1 ;;
  esac
done

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_IMAGE="${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
COMPOSE_FILE="docker-compose.prod.yml"

compose() {
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$COMPOSE_FILE" "$@"
  elif docker compose version >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" "$@"
  else
    echo "Error: docker-compose or docker compose is required." >&2
    exit 1
  fi
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Error: '$1' is required." >&2; exit 1; }
}

require_cmd docker

if [[ ! -f .env ]]; then
  echo "Error: .env not found. Copy .env.example to .env and fill in secrets." >&2
  exit 1
fi

echo "==> Deploying Rachel app"
echo "    Mode:      $([[ "$BUILD_ON_SERVER" -eq 1 ]] && echo 'build on server' || echo 'pull from ECR')"
echo "    Image:     ${ECR_IMAGE}"
echo "    App URL:   ${APP_BASE_URL}"
echo ""

if [[ "$BUILD_ON_SERVER" -eq 1 ]]; then
  echo "==> Building image on this server (linux/$(uname -m))..."
  docker build -t "$ECR_IMAGE" .
else
  require_cmd aws
  echo "==> Logging in to ECR..."
  aws ecr get-login-password \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE" \
    | docker login --username AWS --password-stdin "$ECR_REGISTRY"

  echo "==> Pulling image from ECR..."
  if ! docker pull "$ECR_IMAGE"; then
    echo "Error: pull failed. If you see a platform warning, rebuild on EC2:" >&2
    echo "  ./scripts/deploy-server.sh --build" >&2
    exit 1
  fi
fi

export ECR_IMAGE APP_PORT APP_BASE_URL

echo "==> Starting app + MySQL..."
docker rm -f vk-app 2>/dev/null || true
compose down --remove-orphans 2>/dev/null || true
compose up -d --no-build

echo "==> Waiting for app..."
ready=0
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${APP_PORT}/" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

if [[ "$ready" -ne 1 ]]; then
  echo "Error: app not responding on port ${APP_PORT}." >&2
  compose ps
  compose logs --tail=50 app
  exit 1
fi

echo "==> Health check passed (HTTP 200)"

if [[ "$SYNC_CATALOG" -eq 1 ]]; then
  echo "==> Syncing catalog..."
  if command -v npm >/dev/null 2>&1 && [[ -f package.json ]]; then
    [[ -d node_modules ]] || npm ci --omit=dev
    DATABASE_HOST=127.0.0.1 DATABASE_PORT=3306 npm run db:sync-catalog
  else
    echo "Install Node.js, then run: DATABASE_HOST=127.0.0.1 npm run db:sync-catalog" >&2
  fi
fi

echo ""
echo "Deployment complete."
echo "  App:   ${APP_BASE_URL}"
echo "  Logs:  docker-compose -f ${COMPOSE_FILE} logs -f app"
