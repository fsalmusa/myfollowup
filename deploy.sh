#!/usr/bin/env bash
#
# deploy.sh — build & deploy Follow-Up CRM ke GitHub Pages (manual, tanpa Actions)
#
# Usage:
#   ./deploy.sh              # build + push ke gh-pages
#   ./deploy.sh --no-build   # push dist/ sedia ada (skip build)
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

# --- 1. Build (kalau tak skip) ---
if [[ "${1:-}" != "--no-build" ]]; then
  echo "🔨 Building client..."
  npm --prefix client run build
else
  echo "⏭️  Skip build — guna dist/ sedia ada"
fi

# Pastikan dist wujud
if [[ ! -d client/dist ]]; then
  echo "❌ client/dist tak jumpa. Build dulu." >&2
  exit 1
fi

# --- 2. Deploy ke gh-pages ---
echo "🚀 Deploying ke gh-pages..."

# Guna git worktree (clean, tak ganggu working tree)
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# Clone/checkout gh-pages branch ke tmp
if git show-ref --verify --quiet refs/heads/gh-pages; then
  git worktree add -f "$TMP_DIR" gh-pages
else
  # gh-pages belum wujud — cipta orphan branch
  git worktree add -f "$TMP_DIR" -b gh-pages
fi

cd "$TMP_DIR"

# Kosongkan content lama (kecuali .git)
find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +

# Salin build baru
cp -r "$REPO_ROOT/client/dist/." .

# Commit & push
if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')" --no-verify
  git push origin gh-pages --force
  echo "✅ Deployed!"
else
  echo "⚠️  Tiada perubahan — skip push"
fi

# Bersihkan worktree
cd "$REPO_ROOT"
git worktree remove "$TMP_DIR" --force 2>/dev/null || true

echo "🎉 Siap. Live di: https://fsalmusa.github.io/myfollowup/"
