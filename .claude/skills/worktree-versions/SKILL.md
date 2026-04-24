---
name: worktree-versions
description: Spawn external git worktrees in `~/worktrees/<repo>/<branch>-vN` to try multiple alternative versions of the current task in parallel. Each version gets a numbered branch (`-v1`, `-v2`, ...) forked from the current branch HEAD, so the user can `cd` into a worktree to test a variation without losing the current work. Use when the user asks to spawn a worktree, create a new version of the task, try an alternative approach in parallel, work in a worktree external to the repo, or test a variation quickly.
---

# Worktree Versions

Create external git worktrees so the user can explore multiple alternative implementations of the current task in parallel, each on its own numbered branch.

## Convention

- **Worktree root**: `~/worktrees/<repo-name>/`
- **Worktree path**: `~/worktrees/<repo-name>/<branch-flat>-v<N>/` (slashes in branch name replaced with `-`)
- **Branch name**: `<current-branch>-v<N>` (slashes preserved, git accepts them)
- **Numbering**: `v1`, `v2`, `v3`, ... auto-increment to next available

Example: on `feat/foo` in `b3tr-3`, the first version becomes path `~/worktrees/b3tr-3/feat-foo-v1/` with branch `feat/foo-v1`.

## Workflow

When the user asks to create a worktree version:

### 1. Gather context

Run from the current repo:

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
REPO_NAME=$(basename "$REPO_ROOT")
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
BRANCH_FLAT=${CURRENT_BRANCH//\//-}
```

If `CURRENT_BRANCH` is `HEAD` (detached) or `main`/`master`, warn the user and ask whether to proceed.

### 2. Find next available version

List existing worktrees + local branches matching the pattern, then pick the lowest unused integer:

```bash
git worktree list --porcelain | grep -E "branch refs/heads/${CURRENT_BRANCH}-v[0-9]+$"
git branch --list "${CURRENT_BRANCH}-v*"
```

Parse the `-vN` suffixes and compute `N = max(existing) + 1` (or `1` if none).

### 3. Create the worktree

```bash
mkdir -p ~/worktrees/"$REPO_NAME"
git worktree add ~/worktrees/"$REPO_NAME"/"${BRANCH_FLAT}-v${N}" -b "${CURRENT_BRANCH}-v${N}" "$CURRENT_BRANCH"
```

The new branch starts from the current branch's HEAD commit.

### 4. Report to the user

Print:

- The full worktree path
- The new branch name
- The exact `cd` command to enter it
- A note that uncommitted changes in the main repo are NOT carried over (commit or stash first if you want them in the new version)

Example output:

```
Worktree created:
  path:   ~/worktrees/b3tr-3/feat-foo-v2
  branch: feat/foo-v2 (forked from feat/foo @ <short-sha>)

Enter it with:
  cd ~/worktrees/b3tr-3/feat-foo-v2

Note: uncommitted changes stayed in the main repo. Stash + apply them in
the worktree if you want the same starting state.
```

## Repeating

Each invocation auto-increments. Running the skill three times on `feat/foo` produces `feat/foo-v1`, `feat/foo-v2`, `feat/foo-v3`, each in its own worktree directory.

## Testing a version in the main repo

Git branches are exclusive across worktrees: a branch checked out in one worktree cannot also be checked out elsewhere. To test a version's code from the main repo path, use one of:

- **Preferred — `cd` into the worktree** and run dev/test commands there. It's a full working copy.
- If the user really needs the main repo path: remove the worktree first (`git worktree remove <path>`), then `git checkout <branch>-vN` in the main repo.

State this trade-off when the user asks to "test in the main repo".

## Cleanup (only if requested)

```bash
git worktree remove ~/worktrees/"$REPO_NAME"/"${BRANCH_FLAT}-v${N}"
git branch -D "${CURRENT_BRANCH}-v${N}"
```

Never clean up versions without explicit user confirmation.

## Edge cases

- **Branch already exists**: should not happen with auto-increment, but if `git worktree add -b` fails because the branch exists, bump `N` and retry.
- **Path already exists**: same — bump `N`.
- **No commits yet on current branch**: `git worktree add` requires a commit; tell the user to commit at least once first.
- **Bare repo / submodule weirdness**: surface the git error verbatim and stop.
