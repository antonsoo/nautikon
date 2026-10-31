#!/usr/bin/env bash
# Publish an already reviewed static build, extending the current branch history.
# Refuse a concurrent remote change through the normal non-force push check.
set -euo pipefail
site_dir=$(realpath "${SITE_DIR:-dist}")
source_commit=$(git rev-parse HEAD)
for file in index.html testimony.html sw.js; do
  test -f "$site_dir/$file" || { echo "Missing production file: $file" >&2; exit 1; }
done
pages_dir=$(mktemp -d "${TMPDIR:-/tmp}/nautikon-pages.XXXXXX")
cleanup() { git worktree remove --force "$pages_dir" >/dev/null 2>&1 || rmdir "$pages_dir" 2>/dev/null || true; }
trap cleanup EXIT
remote_head=$(git ls-remote origin refs/heads/gh-pages)
if test -n "$remote_head"; then
  git fetch --no-tags origin refs/heads/gh-pages
  git worktree add --detach "$pages_dir" FETCH_HEAD
else
  git worktree add --detach "$pages_dir" HEAD
  git -C "$pages_dir" switch --orphan "pages-publish-$$"
fi
rsync -a --delete --exclude=.git "$site_dir/" "$pages_dir/"
touch "$pages_dir/.nojekyll"
git -C "$pages_dir" add -A
if git -C "$pages_dir" diff --cached --quiet; then
  echo "The published branch already contains these files."
  exit 0
fi
git -C "$pages_dir" commit -m "Publish reviewed source $source_commit"
git -C "$pages_dir" push origin HEAD:refs/heads/gh-pages
