#!/usr/bin/env bash
set -euo pipefail

# AI_GATEWAY_API_KEY is only needed for hosted Jev; server.mjs checks it unless kevUrl is set.
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "$repo_root/src/server.mjs"
