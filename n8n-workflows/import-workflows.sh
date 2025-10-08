#!/usr/bin/env bash
# Import workflows into a running local n8n instance (http://localhost:5678)
# Usage:
#   N8N_BASIC_AUTH_USER=admin N8N_BASIC_AUTH_PASSWORD=secret ./import-workflows.sh

N8N_URL="${N8N_URL:-http://localhost:5678}"
WORKDIR="$(cd "$(dirname "$0")" && pwd)"

AUTH_ARGS=()
if [ -n "${N8N_BASIC_AUTH_USER}" ] && [ -n "${N8N_BASIC_AUTH_PASSWORD}" ]; then
  AUTH_ARGS=(-u "${N8N_BASIC_AUTH_USER}:${N8N_BASIC_AUTH_PASSWORD}")
fi

echo "Waiting for n8n to be ready at ${N8N_URL}..."
until curl -s "${N8N_URL}" >/dev/null; do
  sleep 1
done

for f in "${WORKDIR}"/workflow-*.json; do
  echo "Importing ${f}..."
  curl -s -X POST "${AUTH_ARGS[@]}" -H "Content-Type: application/json" --data @"${f}" "${N8N_URL}/rest/workflows" || echo "Import failed for ${f}"
done

echo "Import complete."