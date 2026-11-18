#!/usr/bin/env bash
# Content hash of an image's build inputs at a git ref: sha256 over the
# "<mode> <type> <blob>\t<path>" lines of every tracked file the Dockerfile can
# COPY. Same hash => same image, so CI skips the build and reuses the GHCR
# tag `content.<hash>`. Unlike a commit SHA it survives squash merges, so the
# image a PR built is the one main and every deploy reuse.
#
# Keep each path list in sync with the Dockerfile's COPY lines. Listing too
# much only costs a rebuild; listing too little ships a stale image. The base
# image is pinned in the Dockerfile, so bumping it changes the hash.
set -euo pipefail

usage() {
  echo "usage: $(basename "$0") <image> [git-ref]" >&2
  exit 2
}

IMAGE="${1:-}"
REF="${2:-HEAD}"
# Optional ERE matched against each path; matching files are left out.
exclude=""

case "$IMAGE" in
  frontend)
    paths=(Dockerfile .dockerignore package.json yarn.lock turbo.json packages apps)
    ;;
  *) usage ;;
esac

cd "$(git rev-parse --show-toplevel)"
git rev-parse --verify --quiet "${REF}^{tree}" >/dev/null || {
  echo "unknown git ref: $REF" >&2
  exit 3
}

entries=$(git ls-tree -r "$REF" -- "${paths[@]}" | awk -F'\t' -v re="$exclude" 're == "" || $2 !~ re')
[ -n "$entries" ] || {
  echo "no files matched for $IMAGE at $REF" >&2
  exit 4
}

printf '%s\n' "$entries" | sha256sum | cut -c1-12
