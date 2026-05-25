---
name: adr-writing
agent: Designer + Tester
triggers:
  - 需要做架构决策时
  - 知识沉淀阶段转 ADR 时
description: ADR（架构决策记录）写作规范——frontmatter schema、status 生命周期、何时写/不写、supersedes 链接方式。
depends_on: []
human_doc: docs/architecture/decisions/
---

# ADR 写作

> Wave 5-5 起作为 Skill。ADR 模板仍在 `docs/process/templates/adr-template.md`。

---

## 1. 何时写 ADR

**写**：

- 引入新技术（DB / 框架 / 认证方案）
- 改现有架构（路由结构 / API 契约范式 / 数据模型重构）
- 选项对比后的决策（方案 A vs B vs C，留痕 why）
- 废弃 / 替代既有决策（要 superseded 老 ADR）

**不写**：

- 小修改 / 命名调整 / 代码重构
- 已有文档涵盖（如已经在 `data-model.md`）
- 单次实现细节（应留在 PR description 或 feature.md）

## 2. 命名 & 位置

```
docs/architecture/decisions/ADR-XXX-<slug>.md
```

编号连续递增。查下一个编号：

```bash
ls docs/architecture/decisions/ | grep -oE 'ADR-[0-9]+' | sort -u | tail -1
```

## 3. Frontmatter Schema（CI 强制，check-adr-schema.js）

```yaml
---
type: adr                                    # 必须是 adr
id: ADR-XXX                                  # 匹配文件名前缀
title: <简短标题>                             # 非空
status: accepted                             # proposed | accepted | superseded | deprecated
date: YYYY-MM-DD                             # ISO
author: <作者名>                              # 非空
# supersededBy: ADR-YYY | path/to/successor  # 仅 superseded 时必填
# relatedFeature: ft-xxx-slug                # 可选
tags: [adr]
---
```

`status` 生命周期：

```
proposed → accepted → (superseded | deprecated)
```

- `proposed`：讨论中，未定
- `accepted`：生效中；`_home.md` 的 "近期 ADR" 面板只显示这个
- `superseded`：被新 ADR 或文档取代；**必须**填 `supersededBy`
- `deprecated`：方向性废弃，没有替代

## 4. 结构（参见 `docs/process/templates/adr-template.md`）

```markdown
# ADR-XXX: <标题>

## 状态
- [x] accepted

## 背景
<为什么要做这项决策？上下文 / 约束>

## 决策
<我们决定做什么？>

## 选项对比
| 选项 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| A | ... | ... | ❌ |
| B | ... | ... | ✅ |

## 理由
<为什么选 B？>

## 影响
### 积极
### 消极
### 需要更新的文档
- [ ] ...

## 相关决策
- 依赖：ADR-YYY
- 被依赖：ADR-ZZZ

**决策日期**: YYYY-MM-DD
**决策影响**: ft-xxx
**决策记录者**: <name>
```

## 5. Superseded 正确写法

ADR-005 取代 ADR-003：

```yaml
# ADR-003 更新为
---
status: superseded
supersededBy: ADR-005
---
```

文件顶部加醒目横幅：

```markdown
> ⚠️ **已被 ADR-005 取代**（YYYY-MM-DD）。本文档保留作为历史参考，当前有效方案见 [ADR-005](./ADR-005-<slug>.md)。
```

示例：ADR-003 被 data-model.md 取代的范式见当前仓库（Wave 4-3 偿还 TD-005）。

## 6. 与 feature 的关系

- ADR **不是** feature 产出——它是**横切**的架构记录
- 一个 ADR 可能源于某个 feature（`relatedFeature: ft-xxx`），但生命周期独立于 feature
- Tester 在 Done 收尾仪式评估：这次 feature 有没有值得单独写 ADR 的决策？有则写；无则在 `knowledge-summary.md` 一句话带过

## 7. 不要做

- 把 feature.md 的设计讨论塞到 ADR（那是 feature 快照的事）
- ADR 只写"做了什么"不写"为什么"（缺 rationale 的 ADR 没价值）
- Superseded 不填 `supersededBy`（CI 会拦）
- 编号重用 / 跳号

## 相关

- `docs/process/templates/adr-template.md` — 完整可复制模板
- `scripts/check-adr-schema.js` — CI 校验
- `docs/architecture/decisions/` — 既有 ADR（ADR-001..ADR-004）
