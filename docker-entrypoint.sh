#!/bin/sh
set -e

echo "Running database migrations..."
node /app/migrations/migrate.mjs
echo "Migrations complete. Starting server..."
exec node server/index.mjs
