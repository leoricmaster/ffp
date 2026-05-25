---
name: issue-template
description: 开 GitHub Issue 时的 body 模板
---

# Issue Body 模板

## Bug

```bash
gh issue create --title "[bug] 标题" --body "$(cat <<'EOF'
Bug: bg-xxx-slug
Feature: ft-xxx-slug（或 —）
severity: critical/high/medium/low
area: frontend/backend/api/infra

复现步骤：
1. ...

预期行为：
实际行为：

环境：dev / staging / prod
EOF
)"
```

## Tech Debt

```bash
gh issue create --title "[tech-debt] 标题" --body "$(cat <<'EOF'
TechDebt: td-xxx-slug

背景：...
影响：...
建议方案：...
EOF
)"
```

## 跨 feature / 流程级

```bash
Feature: —
（或 Bug: —）
```

> 脚本认 `—` 占位，不会误命中其他编号。
