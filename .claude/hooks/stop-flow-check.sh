#!/usr/bin/env bash
# Stop hook — run flow-conformance check after the agent finishes a turn.
#
# This is a non-blocking heads-up. CI runs the same script on every PR, so the
# point here is to surface drift to the agent BEFORE it pushes — not to block.
#
# Output: JSON. additionalContext appears in the agent's next turn so it can
# self-correct if the local check failed.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"

if [[ -z "$REPO_ROOT" ]] || [[ ! -f "$REPO_ROOT/scripts/check-feature-flow.js" ]]; then
  printf '{"continue": true}\n'
  exit 0
fi

# Capture script output; never let a transient failure block the stop event.
OUTPUT="$(cd "$REPO_ROOT" && node scripts/check-feature-flow.js 2>&1 || true)"
EXIT_CODE=$?

if printf '%s' "$OUTPUT" | grep -q '^\[flow-check\] all'; then
  # Green — no need to inject context.
  printf '{"continue": true}\n'
  exit 0
fi

# Drift detected — inject the script output so the agent sees it next turn.
ESCAPED="$(printf '%s' "$OUTPUT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' 2>/dev/null || echo '"flow-check failed but output could not be serialized"')"

cat <<EOF
{
  "continue": true,
  "hookSpecificOutput": {
    "hookEventName": "Stop",
    "additionalContext": "⚠️  Local flow-conformance check is RED. Same script runs on PR CI. Output:\n\n$ESCAPED\n\nFix before opening a PR. See docs/process/README.md §8.2 for the file/state contract."
  }
}
EOF
