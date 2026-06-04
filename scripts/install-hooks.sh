#!/bin/sh
# Install git hooks from .claude/hooks/ into .git/hooks/
#
# Usage:
#   ./scripts/install-hooks.sh
#
# Run after cloning the repo or when hooks are updated.

set -e

REPO_ROOT=$(git rev-parse --show-toplevel)
HOOKS_DIR="$REPO_ROOT/.claude/hooks"
GIT_HOOKS_DIR="$REPO_ROOT/.git/hooks"

if [ ! -d "$GIT_HOOKS_DIR" ]; then
  echo "❌ Not a git repository or .git/hooks/ missing."
  exit 1
fi

installed=0
for hook in pre-commit pre-push; do
  if [ -f "$HOOKS_DIR/$hook" ]; then
    cp "$HOOKS_DIR/$hook" "$GIT_HOOKS_DIR/$hook"
    chmod +x "$GIT_HOOKS_DIR/$hook"
    echo "✅ Installed: $hook"
    installed=$((installed + 1))
  fi
done

if [ "$installed" -eq 0 ]; then
  echo "⚠️  No hooks found in $HOOKS_DIR"
else
  echo ""
  echo "Done. $installed hook(s) installed."
fi
