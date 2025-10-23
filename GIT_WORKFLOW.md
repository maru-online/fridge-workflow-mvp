# Git Workflow Checklist

This file contains a concise list of safe Git commands and small workflows for common tasks (inspect, pull, push, and recover). Use it as a quick reference.

## Inspect before you act
- git status --short
  - Shows uncommitted changes and untracked files.
- git branch --show-current
  - Verify you're on the intended branch.
- git fetch --all --prune
  - Update remote refs (safe, read-only).
- git rev-parse main && git rev-parse origin/main
  - Compare SHAs to see if local and remote match.
- git log --oneline --left-right origin/main...main
  - Show commits unique to either side.

## Typical safe workflows

1) Quick sync when remote is ahead (no local commits)
- git fetch --all --prune
- git pull --ff-only
  - Fast-forward only; safe and simple.

2) Publish local commits
- git fetch --all --prune
- git rev-parse main && git rev-parse origin/main
- git log --oneline --left-right origin/main...main
- git push origin main
  - If push is rejected because remote changed, review with the commands above.

3) Keep a linear history (when team agrees)
- git fetch --all --prune
- git pull --rebase
- resolve conflicts if any
- git push origin main
  - Rebase rewrites local commits — avoid if those commits are already shared.

## Recover / destructive operations (use with care)
- Create a backup branch before destructive actions:
  - git branch backup-main-$(date +%Y%m%d%H%M)
  - git push origin backup-main-$(date +%Y%m%d%H%M)
- Reset local branch to remote (discard local changes):
  - git fetch origin
  - git reset --hard origin/main
  - HIGH RISK: this deletes local commits and working changes.
- Force push safely (when intentional):
  - git push --force-with-lease origin main
  - Prefer --force-with-lease over --force to avoid overwriting unsuspecting remote updates.

## Helpful diffs and cleanups
- git diff origin/main..main
  - See code differences between local and remote.
- git diff --name-only origin/main..main
  - See only the paths that differ.
- git clean -n
  - Preview untracked files that would be removed.
- git clean -fd
  - Remove untracked files and directories (dangerous — use after -n preview).

## Recommended quick routine
1. git status --short
2. git fetch --all --prune
3. git rev-parse main && git rev-parse origin/main
4. git log --oneline --left-right origin/main...main
5. If remote ahead and no local commits: git pull --ff-only
6. If local ahead and you want to publish: git push origin main
7. If both have new commits and you prefer linear history: git pull --rebase, resolve conflicts, then git push origin main

---
Notes:
- Always run read-only commands first (status, fetch, rev-parse, log, diff). Only perform destructive commands after double-checking and creating a backup branch.
- Prefer `--force-with-lease` over `--force`.
