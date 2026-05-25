# architecture

本文档维护FFP系统的整体架构，包括上下文、容器、组件和数据模型。

## 文档结构

```text
docs/
├── README.md                  # 本文件
├── c4/                        # C4 模型视图
│   ├── context.md             # L1 系统上下文
│   ├── container.md          # L2 容器
│   └── component.md          # L3 组件
├── scenarios/                # 跨 Feature 场景视图（Dynamic View）
│   ├── README.md             # 业务能力全景图 + scenario 注册表
│   └── scn-*.md              # 单条场景（mermaid 驱动，≤ 150 行/条）
└── quality-pipeline.md       # 测试策略与 CI/CD 设计
```

## C4模型

### Level 1: 系统上下文 (System Context)

见 [c4/context.md](./c4/context.md)

### Level 2: 容器 (Container)

见 [c4/container.md](./c4/container.md)

### Level 3: 组件 (Component)

见 [c4/component.md](./c4/component.md)

## 数据模型

见 [../data/data-model.md](../data/data-model.md)

## 跨 Feature 场景（Dynamic View）

见 [scenarios/](./scenarios/)。跨 Feature 的系统交互场景，与 C4 结构视图正交。

## 测试策略

见 [quality-pipeline.md](./quality-pipeline.md)

## API规范

见 [../api/openapi.yaml](../api/openapi.yaml)

## 架构决策

见 [../decisions/](../decisions/)

## 阅读指引

1. 新成员入门: 先读 [c4/context.md](./c4/context.md) 了解系统全貌
2. 开发Feature: 参考 [../data/data-model.md](../data/data-model.md) 和 [../decisions/](../decisions/)
3. API对接: 查看 [../api/openapi.yaml](../api/openapi.yaml)
4. 测试与 CI/CD: 查看 [quality-pipeline.md](./quality-pipeline.md) 了解质量管道体系
5. 技术决策: 查看 [../decisions/](../decisions/) 了解决策背景
