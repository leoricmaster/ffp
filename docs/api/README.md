# API

本目录是 FFP API 契约的**单一事实来源**，仅保留规范本身：

- **[openapi.yaml](./openapi.yaml)** — OpenAPI 3.x 规范文件

## 配套工具链

代码生成、文档构建、Mock 服务器等工具链待实现阶段配置。

## 何时改这里 vs 改那里

| 你想做的事 | 去哪里 |
|---|---|
| 修改 API 设计、新增端点、调整 schema | **本目录** 改 `openapi.yaml` |
| 调整代码生成方式、升级 generator、改 mock 行为 | 待实现阶段配置 |
