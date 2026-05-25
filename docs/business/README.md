# 业务文档

本文档目录聚焦 FFP 的**业务视角**——用户是谁、他们如何与产品交互、他们的目标是什么。

与 `docs/backlog/`（产品 Backlog，按 Epic/Feature 组织）不同，本目录按**用户旅程**组织，回答的问题是：

> 用户在什么场景下使用 FFP？他们经历了哪些阶段？痛点在哪里？

## 目录结构

```text
docs/business/
├── README.md                    # 本文件
├── user-personas.md             # 用户画像（待补充）
└── user-journeys/               # 用户旅程
    ├── README.md                # 旅程索引
    ├── UJ-01-first-time-setup.md
    ├── UJ-02-daily-record.md
    ├── UJ-03-monthly-review.md
    ├── UJ-04-family-collaboration.md
    └── UJ-05-goal-planning.md
```

## 与 Backlog 的关系

| 文档 | 视角 | 组织方式 | 读者 |
|------|------|----------|------|
| **User Journey** (本目录) | 用户视角，端到端场景 | 按用户使用时间线 | Designer、产品经理 |
| **Product Backlog** (`docs/backlog/`) | 产品视角，可交付单元 | 按 Theme → Epic → Feature | 全员 |
| **Feature 文档** (`docs/backlog/{epic}/{feature}/`) | 技术视角，实现细节 | 按 Feature | Developer、Tester |

**单向依赖**：Journey 是 Backlog 的输入。Designer 在起草 feature.md 前，应先阅读相关 Journey 理解用户场景。Journey 不引用具体 Feature ID（Feature 尚未设计），只关联 Theme 和 Epic。

## 维护原则

- **新增 Journey**：当发现新的用户场景未被现有 Journey 覆盖时
- **修改 Journey**：用户行为模式变化、产品定位调整时
- **不重复 feature 级细节**：Basic Flow、API 契约、测试用例等不在此维护
