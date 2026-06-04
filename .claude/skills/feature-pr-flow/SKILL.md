---
name: feature-pr-flow
description: Feature 开发与 PR 工作流——分支命名、Conventional Commits、PR description 模板、CI 门禁、合并规则。Hard rule：所有 commit 必须走 PR，不准直接推 main。
---

# Feature / PR 工作流

> 完整流程见 `docs/process/feature-flow.md`。

---

## 1. Hard Rule

**所有 commit 必须走 PR，不准直接推 main。**

`main` 分支 protected：必须走 PR；至少 1 个 approve；不能 force push。

## 2. 分支命名

| 类型 | 格式 | 示例 |
|------|------|------|
| Feature | `feature/ft-XXX-<slug>` | `feature/ft-004-user-profile` |
| Defect | `fix/de-XXX-<slug>` | `fix/de-001-login-error` |
| Tech Debt | `refactor/td-XXX-<slug>` | `refactor/td-001-openapi-categories` |
| Hotfix | `hotfix/hf-XXX-<slug>` | `hotfix/hf-001-critical-security` |
| Docs | `docs/<slug>` | `docs/update-readme` |

## 3. 完整流程（典型 feature）

```bash
# 1. 同步 main
git checkout main
git pull origin main

# 2. 切分支
git checkout -b feature/ft-004-<slug>

# 3. 开发 + 提交
# ... edits ...
# 检查：Tester 的 E2E 代码已提交到本分支（如有新 feature 核心路径）
# git log --oneline --grep="test(e2e)" 或确认 e2e/ 目录有变更
git add <specific files>     # 不用 git add -A，避免误提交敏感文件
git commit -m "feat(<scope>): <subject>

<body>"

# 4. push + 开 PR
git push -u origin feature/ft-004-<slug>
gh pr create --base main --title "..." --body "$(cat <<'EOF'
...
EOF
)"

# 5. review 循环
# 收到 Changes Requested → 修 → commit → push（分支自动同步 PR）
# main 有更新时：git fetch origin && git rebase origin/main（保持线性历史）

# 6. 等待 CI 全绿
gh run list --branch $(git branch --show-current)
# CI 红 → 本地完整检查 → 一次性修复所有问题 → push → 回到步骤 5
# CI 全绿后，通知用户验收（NOT 立即合并）

# 7. 合并（用户 approve 后）
# 查询当前分支对应的 PR number，然后合并
PR_NUMBER=$(gh pr list --head $(git branch --show-current) --json number --jq '.[0].number')
gh pr merge "$PR_NUMBER" --squash

## Draft PR 使用场景

- 代码尚未完成但需跑 CI 验证
- 需先收集早期反馈再正式请求 review
- 从 Draft 转为 Ready：在 PR 页面点击 "Ready for review" 或 `gh pr ready <N>`

# 8. 合并后等待 main CI 全绿
gh run list
# 如有自动部署：等待部署完成并验证
# 如无自动部署：通知用户已合并，手动部署

# 9. 清理
git checkout main && git pull origin main
git branch -d feature/ft-004-<slug>
git push origin --delete feature/ft-004-<slug>

# 10. 通知用户可以使用
```

> **轻量 PR（Tech Debt / Bug）同理**：push 后必须等待 CI 全绿，禁止 push 后立即说"完成了"。
> **CI 失败正确姿势**：本地跑完整检查，一次性修复所有问题再 push，不要逐个问题单独修复。

## 4. Conventional Commits

```text
<type>(<scope>): <subject>

<body>

<footer>
```

| Type | Scope 示例 | 说明 |
|------|-----------|------|
| `feat` | `feat(auth)` | 新功能（Feature PR） |
| `fix` | `fix(de-001)` | Bug 修复 |
| `refactor` | `refactor(td-001)` | 重构 / 偿还技术债 |
| `perf` | `perf(api)` | 性能 |
| `docs` | `docs(readme)` | 文档 |
| `test` | `test(e2e)` | 测试 |
| `chore` | `chore(ci)` | 构建 / 工具 |
| `style` | `style(lint)` | 格式（不影响行为） |

**示例**：

```text
feat(auth): 添加注册验证码功能

- 添加短信验证码发送
- 添加验证码验证接口
- 更新注册表单

Closes #123
```

## 5. PR Title / Description

**Title**：与 commit message 格式一致（`feat(scope): 主题`，< 70 字符）。

**Body 模板**：

```markdown
## Summary

<1-3 句话说这个 PR 做了什么>

## Why

<为什么现在做 / 关联的 issue 或 feature>

## Test plan

- [x] 单元测试通过
- [x] Contract / Acceptance / Integration 测试通过
- [x] CI 全绿（`gh pr checks <N>` 或 `gh run list --branch <branch>`）
- [ ] 手测的用户流程

> **Developer 提交后必做**：PR push 后等待 CI 全绿再汇报完成；CI 红 → 修 → push → 回到检查。禁止 push 后立即说"完成了"。

## Scenario impact（必选二选一）

- [ ] 本 PR 触及 `docs/architecture/scenarios/` 中某 scenario 的步骤 / 契约 / Actor → scenarios/ 已同步更新，feature.md `## 关联 Scenario` 已对齐
- [ ] 本 PR 不触及任何 scenario 的维护触发器

## Non-goals（可选）

<明确这个 PR 不做什么，避免 review 跑题>

## Related

Closes #xxx
Feature: ft-xxx-<slug>
```

**PR size 指导原则**：

| 级别 | 行数限制 | 处理方式 |
|------|---------|----------|
| **目标** | < 500 行变更 | 理想大小，reviewer 可快速理解 |
| **警告** | 500–800 行 | 须在 PR description 中说明未拆分的原因 |
| **上限** | > 800 行 | **必须拆分**为多个 PR；Reviewer 可拒绝 review |

> 统计方式：`git diff --stat origin/main...HEAD -- ':!*.md' ':!*.yaml' ':!*.json' ':!docs/' ':!.claude/'` 的插入+删除行数之和。文档/配置变更不计入。

## 6. CI 门禁

PR 自动跑：

| 检查 | 说明 |
|------|------|
| Flow Conformance | `.claude/hooks/` 流程合规检查 |
| Lint | 前 / 后端 |
| Typecheck | TypeScript |
| Unit | 后端 Jest / 前端 Vitest |
| Contract | API 契约 |
| Integration | 集成 |
| E2E（如适用） | Playwright |

**所有检查必须过**。CI 红不合并——fix 再 push。

## 7. Review 循环

- Reviewer 先自动 review（架构 / 代码 / 契约）
- 用户是最终 gate（PR review = 合并前的唯一用户 gate）
- Changes Requested → fix → push（不用 reopen PR，已有分支 push 自动更新）
- `gh pr view <N>` 查看当前 review 状态

## 8. 提交消息的 Co-Author 惯例

如果 Claude 协助写的 commit：

```text
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 9. 禁止项

❌ **不要**：

- 直接 commit 到 main
- `--no-verify` 跳 husky hook
- `--force` push 到 main
- `git add -A` 或 `git add .`（容易带进敏感文件 / 大 binary）
- 把 commit 合成 `git amend` 修改已推送的 commit（应新建 commit）
- push 到远程后再用 `--amend` 修改已推送的 commit（会改写公开历史，应新建 commit 再 push）
- **push PR 后立即说"完成了"，不等 CI 结果**

✅ **要做**：

- 每 feature 一个分支
- 按具体文件名 `git add`
- Conventional Commits
- PR body 含完整 test plan
- Review 反馈修完用 push（不要 squash 本地历史）
- **PR push 后等待 CI 全绿再汇报完成**（`gh run list --branch $(git branch --show-current)`）

## 10. 快速参考

```bash
# 当前 PR 状态
gh pr status

# 查看 PR（当前分支）
gh pr view

# 合并（当前分支）
gh pr merge --squash

# 查 CI（当前分支）
gh pr checks
```

## 相关

- `docs/process/feature-flow.md` §1.6 — PR 规范
- `.claude/agents/prompts/developer.md` §PR 通知模板
- `memory/feedback_delete-branch.md`（在 ~/.claude/projects/.../memory/） — PR 合并后删除分支
