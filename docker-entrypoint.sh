#!/bin/sh
set -e

# Fix permissions of the data directory
# This runs as root before switching users
if [ -d "/app/data" ]; then
  chown -R nextjs:nodejs /app/data
fi

# Execute the command passed to docker run (CMD) as the nextjs user
# using su-exec to drop privileges from root
exec su-exec nextjs:nodejs "$@"
