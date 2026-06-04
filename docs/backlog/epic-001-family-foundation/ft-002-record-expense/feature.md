---
type: feature
id: ft-002
epic: epic-001
title: 记录支出
priority: P0
owner: TBD
created: 2026-06-04
---

# ft-002：记录支出

## 目标

让家庭成员能够记录支出并查看列表，验证 FFP 的核心价值假设。

## 背景

支出记录是家庭财务管理最高频的操作。本 Feature 是用户感知产品价值的第一触点，需要在交互上做到极简、快速。

## 范围（包含 / 不包含）

### 包含

- 支出记录的创建（金额、分类、日期、描述）
- 支出记录列表查看（按日期倒序）
- 系统预设支出分类

### 不包含

- 支出记录的编辑和删除
- 支出筛选和搜索
- 支出统计与图表
- 收入记录
- 分类体系的自定义配置
- 附件/图片上传
- 批量导入

## User Stories

### US-001 记录一笔支出

**As** 家庭成员, **I want** 快速记录一笔支出, **so that** 我能追踪家庭的花费

**AC**:

- [ ] AC1：用户选择支出分类（二级分类，叶子节点），输入金额（>0）、日期（默认今天）、描述（可选），提交后保存（YYYY-MM-DD）
- [ ] AC2：金额必须大于 0，日期不能是未来（YYYY-MM-DD）
- [ ] AC3：分类必须属于当前家庭（系统预设）（YYYY-MM-DD）
- [ ] AC4：记录保存成功后显示确认提示（YYYY-MM-DD）

### US-002 查看支出列表

**As** 家庭成员, **I want** 查看家庭的支出记录列表, **so that** 我能了解家庭的花费情况

**AC**:

- [ ] AC1：列表按日期倒序展示，每条显示金额、分类、日期（YYYY-MM-DD）
- [ ] AC2：列表仅展示当前家庭的数据（YYYY-MM-DD）
- [ ] AC3：空状态显示引导文案（YYYY-MM-DD）

## 设计概要

本 Feature 涉及：

- 后端：Transaction / TransactionCategory 表的新增
- 后端：POST /transactions、GET /transactions 两个端点
- 前端：支出记录页（表单+列表）

预计需要拆 design.md。

## 关联 Scenario

—

## 与现有功能的关系

依赖 ft-001（用户注册与家庭创建）提供身份和租户上下文。在 ft-001 完成后才能开始实现。

## Storybook 声明

has_storybook: yes
stories:

- Default       # 初始空状态
- WithValue     # 填充数据
- Loading       # 提交中
- WithErrors    # 表单验证错误
- Empty         # 列表无数据

## 需求变更记录（设计审批通过后追加）
