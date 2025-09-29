#!/bin/sh
set -e

NEXT_DIR="/app/apps/web/.next"

mkdir -p "$NEXT_DIR"
chown -R node:node "$NEXT_DIR"

exec su-exec node "$@"
