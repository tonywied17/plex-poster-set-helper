#!/usr/bin/env bash
# Plex Poster Helper - one-command GUI launcher (Linux / macOS / unraid).
#
#   ./docker/run.sh            build (if needed) + start the GUI on :3939
#   ./docker/run.sh --build    force a rebuild first
#   ./docker/run.sh --stop     stop & remove the container (config is kept)
#   PORT=8095 ./docker/run.sh  use a different host port
#
set -euo pipefail

NAME=plex-poster-helper
IMAGE=plex-poster-helper:gui
PORT="${PORT:-3939}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ "${1:-}" == "--stop" ]]; then
  docker rm -f "$NAME" 2>/dev/null || true
  echo "Stopped and removed '$NAME'. Config volume 'ppsh-config' is preserved."
  exit 0
fi

if [[ "${1:-}" == "--build" || -z "$(docker images -q "$IMAGE")" ]]; then
  echo "Building $IMAGE (first build takes a few minutes)…"
  docker build -f "$ROOT/docker/Dockerfile" -t "$IMAGE" "$ROOT"
fi

docker volume create ppsh-config >/dev/null
docker rm -f "$NAME" 2>/dev/null || true

docker run -d --name "$NAME" \
  -p "${PORT}:3000" \
  -e PUID=1000 -e PGID=1000 -e "TZ=$(cat /etc/timezone 2>/dev/null || echo UTC)" \
  -v ppsh-config:/config \
  --shm-size=1g \
  --restart unless-stopped \
  "$IMAGE" >/dev/null

echo ""
echo "✓ Plex Poster Helper is running."
echo "  Open: http://localhost:${PORT}"
echo "  Logs: docker logs -f $NAME"
echo "  Stop: ./docker/run.sh --stop"
