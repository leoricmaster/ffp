#!/usr/bin/env python3
"""PreToolUse Bash hook — warn when `gh issue create` body lacks `Feature:` tag.

The vault mirror (scripts/sync-issues.sh) needs `Feature: ft-xxx-slug` (or
`Feature: —` for cross-feature/process-level issues) in every issue body so
issues can be linked to their feature in docs/issues/issue-<N>.md. Missing
this tag produces orphaned issues that break the _home.md "Open by feature"
panel.

Input  (stdin) : JSON Bash tool call payload from Claude Code.
Output (stdout): JSON. `{"continue": true}` lets the call proceed; setting
                 hookSpecificOutput.additionalContext injects a warning that
                 surfaces on the agent's next turn. Never blocks.

Match rule: use shlex to tokenize the command. Only warn when `gh`, `issue`,
`create` appear as three CONSECUTIVE tokens — i.e. as the actual command
invocation. Embedded `gh issue create` in a body string / markdown table /
PR description never appears as separate tokens after shlex splits the
quoted argument, so it won't false-positive.

If shlex parsing fails (e.g. very complex shell syntax with heredocs not
inside quotes), pass through silently — the hook is advisory, not a gate.
"""

import json
import re
import shlex
import sys


FEATURE_TAG = re.compile(r'Feature:\s*(ft-[a-z0-9-]+|—|-)\b')


def find_gh_issue_create(tokens: list[str]) -> int | None:
    """Return the index where 'gh issue create' begins, or None."""
    for i in range(len(tokens) - 2):
        if tokens[i] == "gh" and tokens[i + 1] == "issue" and tokens[i + 2] == "create":
            return i
    return None


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.stdout.write(json.dumps({"continue": True}))
        return

    command = payload.get("tool_input", {}).get("command", "") or ""
    if not command:
        sys.stdout.write(json.dumps({"continue": True}))
        return

    try:
        tokens = shlex.split(command, comments=False, posix=True)
    except ValueError:
        # Unbalanced quotes / heredoc not inside a quoted arg — fail-open.
        sys.stdout.write(json.dumps({"continue": True}))
        return

    idx = find_gh_issue_create(tokens)
    if idx is None:
        sys.stdout.write(json.dumps({"continue": True}))
        return

    # Search the remaining tokens (which include the --body argument value as
    # a single token, with heredoc / cmd-substitution contents preserved as
    # text) for the Feature: tag.
    body_search = " ".join(tokens[idx + 3:])
    if FEATURE_TAG.search(body_search):
        sys.stdout.write(json.dumps({"continue": True}))
        return

    warning = (
        "⚠️  `gh issue create` body is missing the `Feature:` tag. Per "
        ".claude/agents/prompts/_common.md §开 GitHub Issue 约定, every issue "
        "body MUST contain either `Feature: ft-xxx-slug` (to link to a feature) "
        "or `Feature: —` (for cross-feature/process-level issues). Without it, "
        "the vault mirror (scripts/sync-issues.sh) cannot categorize the issue."
    )

    sys.stdout.write(json.dumps({
        "continue": True,
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "additionalContext": warning,
        },
    }))


if __name__ == "__main__":
    main()
