#!/usr/bin/env bash
set -euo pipefail

# Prefer globally installed CLI; otherwise use npx (no Homebrew required).
run_supabase() {
  if command -v supabase >/dev/null 2>&1; then
    supabase "$@"
  elif command -v npx >/dev/null 2>&1; then
    npx --yes supabase "$@"
  else
    echo "Error: Need Supabase CLI or npx. Either:" >&2
    echo "  - brew install supabase/tap/supabase   # or another official install" >&2
    echo "  - ensure Node/npm is installed and retry (script will use npx supabase)" >&2
    exit 1
  fi
}

if ! command -v supabase >/dev/null 2>&1 && command -v npx >/dev/null 2>&1; then
  echo "Using npx supabase (first run may download the CLI)..."
fi

if [ -n "${SUPABASE_DB_URL:-}" ]; then
  echo "Deploying migrations using SUPABASE_DB_URL..."
  run_supabase db push --db-url "${SUPABASE_DB_URL}"
else
  echo "Deploying migrations using linked Supabase project..."
  echo "Tip: run 'npx supabase link --project-ref <ref>' first if not linked."
  run_supabase db push
fi

echo "Migration deploy finished."
