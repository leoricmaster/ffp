---
name: branch-lock
description: 多 actor 分支竞争防护协议
---

# 分支锁协议（TD-030）

**问题**：用户在 IDE 里可能随时切到其他分支并 commit；agent session 不会感知，直到下一次 `git status` 才发现已在错分支。

**协议**：开始一个 PR-scoped 任务（`git checkout -b` 起新分支）时：

1. **写锁**：`echo "<expected-branch>" > .git/claude-agent-branch`
2. **每次关键 git 操作前** 重新 `git rev-parse --abbrev-ref HEAD` 校验分支
3. **任务结束后**（push + PR 开完）：`rm -f .git/claude-agent-branch` 清锁

`.claude/hooks/pre-commit` 会在 commit 前自动校验锁与当前分支一致，不一致就阻断——这是兜底保护，agent 不应依赖它而省略主动 check。

**用户侧**：本机需 `git config core.hooksPath .claude/hooks` 一次（首次 clone 后）。
