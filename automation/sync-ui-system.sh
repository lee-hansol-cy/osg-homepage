#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${OSG_UI_SYSTEM_REPO_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
UI_SYSTEM_DIR="$REPO_ROOT/UI System"
LOCK_DIR="$REPO_ROOT/.git/ui-system-sync.lock"

if [[ ! -d "$UI_SYSTEM_DIR" ]]; then
  exit 0
fi

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  exit 0
fi
trap 'rmdir "$LOCK_DIR"' EXIT

cd "$REPO_ROOT"

if [[ -z "$(git status --porcelain -- 'UI System')" ]]; then
  exit 0
fi

git add -- 'UI System'
git commit -m "sync UI System assets"
git push origin HEAD
