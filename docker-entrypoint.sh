#!/bin/sh
# Make sure the data folder (usually a bind mount created by Docker as root)
# is writable by the unprivileged `node` user, then drop privileges and start.
set -e
DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR"
if [ "$(id -u)" = "0" ]; then
  chown -R node:node "$DATA_DIR"
  exec setpriv --reuid=node --regid=node --init-groups "$@"
fi
exec "$@"
