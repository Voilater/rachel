#!/usr/bin/env bash
# Deploy Rachel/VK site on a server (EC2).
#
# Default: pull linux/amd64 image from ECR.
# Use --build on EC2 if the ECR image was built on Apple Silicon (arm64).
#
# Prerequisites:
#   - Docker + Docker Compose v2 (docker compose)
#   - .env in project root
#   - AWS CLI or IAM role (only when pulling from ECR, not for --build)
#
# Usage:
#   ./scripts/deploy-server.sh --base-url http://YOUR_IP:3000
#   ./scripts/deploy-server.sh --build --base-url http://YOUR_IP:3000 --sync-catalog

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

AWS_REGION="${AWS_REGION:-ap-south-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-313448432124}"
ECR_REPOSITORY="${ECR_REPOSITORY:-rachel}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
APP_PORT="${APP_PORT:-3000}"
APP_BASE_URL="${APP_BASE_URL:-http://localhost:${APP_PORT}}"
SYNC_CATALOG=0
BUILD_ON_SERVER=0
NETWORK_NAME="vk-net"

usage() {
  cat <<'EOF'
Deploy the app + MySQL on this server.

Options:
  --build             Build the Docker image on this server
  --tag TAG           Image tag (default: latest)
  --region REGION     AWS region (default: ap-south-1)
  --port PORT         Host port (default: 3000)
  --base-url URL      APP_BASE_URL (default: http://localhost:PORT)
  --sync-catalog      Seed/sync products after deploy
  -h, --help          Show help

Install Compose on Ubuntu if missing:
  sudo apt update
  sudo apt install -y docker.io docker-compose-plugin
  sudo usermod -aG docker $USER && newgrp docker
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --build) BUILD_ON_SERVER=1; shift ;;
    --tag) IMAGE_TAG="$2"; shift 2 ;;
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

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Error: '$1' is required." >&2; exit 1; }
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" "$@"
    return
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$COMPOSE_FILE" "$@"
    return
  fi

  echo "Error: Docker Compose is not installed." >&2
  echo "Run: sudo apt install -y docker-compose-plugin" >&2
  exit 1
}

wait_for_mysql() {
  echo "==> Waiting for MySQL..."
  for _ in $(seq 1 40); do
    if docker exec vk-mysql mysqladmin ping -h localhost -uroot -pvk_root --silent >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "Error: MySQL did not become healthy in time." >&2
  docker logs --tail=50 vk-mysql || true
  return 1
}

start_with_plain_docker() {
  echo "==> Starting with plain docker (compose fallback)..."

  docker network create "$NETWORK_NAME" 2>/dev/null || true
  docker rm -f vk-app vk-mysql 2>/dev/null || true

  docker run -d \
    --name vk-mysql \
    --network "$NETWORK_NAME" \
    --restart unless-stopped \
    -e MYSQL_ROOT_PASSWORD=vk_root \
    -e MYSQL_DATABASE=vk_studio \
    -e MYSQL_USER=vk_app \
    -e MYSQL_PASSWORD=vk_app_pass \
    -p 3306:3306 \
    -v vk_mysql_data:/var/lib/mysql \
    mysql:8.4

  wait_for_mysql

  docker run -d \
    --name vk-app \
    --network "$NETWORK_NAME" \
    --restart unless-stopped \
    --env-file .env \
    -e NODE_ENV=production \
    -e PORT=3000 \
    -e HOST=0.0.0.0 \
    -e DATABASE_HOST=vk-mysql \
    -e DATABASE_PORT=3306 \
    -e DATABASE_USER=vk_app \
    -e DATABASE_PASSWORD=vk_app_pass \
    -e DATABASE_NAME=vk_studio \
    -e APP_BASE_URL="$APP_BASE_URL" \
    -e AUTH_TRUST_HOST=true \
    -p "${APP_PORT}:3000" \
    "$ECR_IMAGE"
}

start_stack() {
  export ECR_IMAGE APP_PORT APP_BASE_URL

  echo "==> Starting app + MySQL (compose)..."
  docker rm -f vk-app vk-mysql 2>/dev/null || true
  compose down --remove-orphans 2>/dev/null || true

  if ! compose up -d --no-build --pull missing; then
    echo "Warning: compose up failed; trying plain docker..." >&2
    start_with_plain_docker
    return
  fi

  if ! docker ps --format '{{.Names}}' | grep -qx 'vk-mysql'; then
    echo "Warning: compose did not start containers; trying plain docker..." >&2
    compose down --remove-orphans 2>/dev/null || true
    start_with_plain_docker
    return
  fi

  wait_for_mysql

  if ! docker ps --format '{{.Names}}' | grep -qx 'vk-app'; then
    echo "Warning: app container missing after compose up; trying plain docker..." >&2
    compose down --remove-orphans 2>/dev/null || true
    start_with_plain_docker
  fi
}

require_cmd docker

if [[ ! -f .env ]]; then
  echo "Error: .env not found. Copy .env.example to .env and fill in secrets." >&2
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Error: $COMPOSE_FILE not found in $(pwd)" >&2
  exit 1
fi

echo "==> Deploying Rachel app"
echo "    Mode:      $([[ "$BUILD_ON_SERVER" -eq 1 ]] && echo 'build on server' || echo 'pull from ECR')"
echo "    Image:     ${ECR_IMAGE}"
echo "    App URL:   ${APP_BASE_URL}"
if docker compose version >/dev/null 2>&1; then
  echo "    Compose:   $(docker compose version)"
elif command -v docker-compose >/dev/null 2>&1; then
  echo "    Compose:   $(docker-compose --version)"
else
  echo "    Compose:   NOT INSTALLED"
fi
echo ""

if [[ "$BUILD_ON_SERVER" -eq 1 ]]; then
  echo "==> Building image on this server (linux/$(uname -m))..."
  docker build -t "$ECR_IMAGE" .
else
  require_cmd aws
  echo "==> Logging in to ECR..."
  aws ecr get-login-password \
    --region "$AWS_REGION" \
    | docker login --username AWS --password-stdin "$ECR_REGISTRY"

  echo "==> Pulling image from ECR..."
  if ! docker pull "$ECR_IMAGE"; then
    echo "Error: pull failed. Try: ./scripts/deploy-server.sh --build" >&2
    exit 1
  fi
fi

start_stack

echo "==> Waiting for app HTTP..."
ready=0
for _ in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:${APP_PORT}/" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

if [[ "$ready" -ne 1 ]]; then
  echo "Error: app not responding on port ${APP_PORT}." >&2
  docker ps -a
  docker logs --tail=80 vk-app 2>/dev/null || true
  docker logs --tail=80 vk-mysql 2>/dev/null || true
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
echo "  Logs:  docker logs -f vk-app"
echo "  Stop:  docker rm -f vk-app vk-mysql"
