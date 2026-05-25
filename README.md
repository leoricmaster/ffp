# FFP - 多智能体研发流程框架

基于多智能体（Multi-Agent）协作的产品研发流程框架，用于单人+AI辅助的产品开发。

## 1 框架定位

本仓库是**研发流程框架**，而非产品代码库。历史产品源码已剥离，保留：

- 多智能体协作规范（Agent / Skill / Hook）
- 研发流程文档（process / architecture / decisions）
- 需求与设计文档模板（backlog / data / api）

## 2 核心组件

### 多智能体系统

| 组件 | 位置 | 说明 |
|------|------|------|
| **Orchestrator** | `.claude/agents/prompts/orchestrator.md` | 主编排器，工作流调度 |
| **Designer** | `.claude/agents/prompts/designer.md` | 需求分析 + 方案设计 |
| **Developer** | `.claude/agents/prompts/developer.md` | 编码实现 |
| **Tester** | `.claude/agents/prompts/tester.md` | 测试设计与执行 |
| **Reviewer** | `.claude/agents/prompts/reviewer.md` | 代码/架构评审 |
| **共享规范** | `.claude/agents/prompts/_fragments/` | state-schema、orchestration-interface 等 |
| **10 个 Skill** | `.claude/skills/` | 可复用的专项能力 |

### 研发流程文档

| 工件 | 位置 |
|------|------|
| **研发流程** | `docs/process/README.md` |
| **质量管道** | `docs/architecture/quality-pipeline.md` |
| **架构决策** | `docs/decisions/` |
| **C4 架构图** | `docs/architecture/c4/` |
| **数据模型** | `docs/data/data-model.md` |
| **API 规范** | `docs/api/openapi.yaml` |
| **产品 Backlog** | `docs/backlog/` |
| **测试资产注册表** | `docs/quality/test-registry.md` |

## 3 快速开始

### 创建工作项

```bash
# Feature
git checkout -b feature/ft-xxx-name

# Tech Debt
git checkout -b tech/td-xxx-name

# Defect
git checkout -b fix/df-xxx-name
```

### 研发流程

1. **Designer** 分析需求，输出 `feature.md` + `design.md`
2. **Reviewer** 架构评审
3. **Developer** 编码实现 + 单元测试
4. **Tester** 验收测试 + 集成测试
5. **Reviewer** 代码评审
6. **PR 合并** → `main`

详细流程见 `docs/process/README.md`。

## 4 文档导航

- **研发流程**: `docs/process/README.md`
- **PR 流程**: `docs/process/PR-workflow.md`
- **质量管道**: `docs/architecture/quality-pipeline.md`
- **架构总览**: `docs/architecture/README.md`
- **Backlog 入口**: `docs/backlog/README.md`

## 5 使用说明

本框架假设：

- 你使用 **Claude Code** 作为 AI 辅助开发工具
- 项目已配置 `.claude/settings.json` 和 hooks
- 各 Agent 按 `orchestrator.md` 定义的流程协作

如需在新项目中使用本框架：

1. 复制 `.claude/` 目录到你的项目
2. 复制 `docs/process/` 和 `docs/architecture/` 
3. 调整 `CLAUDE.md` 中的项目特定配置
4. 按需启用 `docs/backlog/` 中的 epic/feature 模板
