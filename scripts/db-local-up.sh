#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-industry-ai-news-db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-postgres}"
DB_PORT="${DB_PORT:-54322}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-supabase/migrations}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker daemon is not running. Please start Docker Desktop first." >&2
  exit 1
fi

if [ ! -d "${MIGRATIONS_DIR}" ]; then
  echo "Error: migrations directory not found: ${MIGRATIONS_DIR}" >&2
  exit 1
fi

if docker container inspect "${CONTAINER_NAME}" >/dev/null 2>&1; then
  docker start "${CONTAINER_NAME}" >/dev/null
else
  docker run \
    --name "${CONTAINER_NAME}" \
    -e POSTGRES_USER="${DB_USER}" \
    -e POSTGRES_PASSWORD="${DB_PASSWORD}" \
    -e POSTGRES_DB="${DB_NAME}" \
    -p "${DB_PORT}:5432" \
    -d postgres:16 >/dev/null
fi

echo "Waiting for postgres to become ready..."
until docker exec "${CONTAINER_NAME}" pg_isready -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; do
  sleep 1
done

echo "Applying migrations from ${MIGRATIONS_DIR}..."
for sql in "${MIGRATIONS_DIR}"/*.sql; do
  [ -e "${sql}" ] || continue
  docker cp "${sql}" "${CONTAINER_NAME}:/tmp/migration.sql"
  docker exec "${CONTAINER_NAME}" psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${DB_NAME}" -f /tmp/migration.sql >/dev/null
  echo "Applied: ${sql}"
done

echo
echo "Postgres is ready."
echo "Container: ${CONTAINER_NAME}"
echo "Local DSN: postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${DB_PORT}/${DB_NAME}"
