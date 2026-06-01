# Backlog 目录

本目录是项目的**产品入口**——包含产品定位、用户画像、成功指标，以及所有 Feature backlog 的索引。

---

## 1 产品价值

> 待补充：产品的核心价值主张、目标用户群体、解决的核心问题。

---

## 2 用户画像

> 待补充：关键用户角色、职责、痛点、使用场景。

---

## 3 产品成功指标

| 指标 | 目标 | 说明 |
|------|------|------|

---

## 4 Backlog 目录结构

### 重要文件

- **[Product-Backlog.md](./Product-Backlog.md)** —— 全局产品 Backlog 索引（Themes / Epics / Features 三级索引）

### 目录结构

```text
docs/backlog/
├── README.md             # 本文件（产品定位 + Backlog 入口）
├── Product-Backlog.md    # 全局 Backlog 索引
└── epic-*/               # Epic 目录（业务领域）
    ├── epic.md           # Epic 描述
    └── ft-*-<slug>/      # Feature 目录（命名见 ADR-003）
        ├── feature.md, state.md                                  # 恒必备
        ├── test-cases/test-report.md                             # 状态门控
        └── us-*.md, design.md, architecture-review.md,           # 可选
            process-log.md, knowledge-summary.md,
            test-cases/acceptance-tests.md
```

文件契约与 frontmatter schema 见 [docs/process/state-schema.md](../process/state-schema.md)。

---

## 5 相关文档

- **架构**：[docs/architecture/c4/context.md](../architecture/c4/context.md)（C4 L1 系统上下文）、[c4/container.md](../architecture/c4/container.md)、[c4/component.md](../architecture/c4/component.md)
- **数据模型**：[docs/data/data-model.md](../data/data-model.md)
- **架构决策**：[docs/decisions/](../decisions/)
- **研发流程**：[docs/process/README.md](../process/README.md)
