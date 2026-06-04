---
type: feature
id: ft-001
epic: epic-001
title: 用户注册与家庭创建
priority: P0
owner: TBD
created: 2026-06-04
---

# ft-001：用户注册与家庭创建

## 目标

为用户提供最简注册和登录能力，注册后自动创建首个家庭，为后续财务记录功能建立身份与租户基础。

## 背景

FFP 以家庭为数据隔离单元（`family_id`）。用户必须拥有账户并被关联到家庭后，才能进行任何财务操作。本 Feature 是后续所有功能的前置条件。

## 范围（包含 / 不包含）

### 包含

- 用户注册（邮箱、密码、昵称）
- 注册后自动创建默认家庭
- 注册时初始化系统预设分类（TransactionCategory）和账户类型（AccountType）
- 用户登录（邮箱+密码）
- JWT 会话管理

### 不包含

- 邮箱验证流程（注册后状态直接为 ACTIVE）
- 密码找回/重置
- 第三方登录（OAuth）
- 用户资料编辑（头像、手机号等）
- 多家庭切换
- 家庭成员邀请

## User Stories

### US-001 用户注册并创建家庭

**As** 新用户, **I want** 通过邮箱和密码注册账户, **so that** 我能开始使用家庭财务应用

**AC**:

- [ ] AC1：用户填写邮箱、密码（≥8位）、昵称，提交后创建账户（YYYY-MM-DD）
- [ ] AC2：邮箱全局唯一，重复邮箱返回明确错误（YYYY-MM-DD）
- [ ] AC3：注册成功后系统自动创建一个以用户昵称为名称的默认家庭（YYYY-MM-DD）
- [ ] AC4：系统自动为新家庭初始化预设支出分类（如餐饮、交通、购物等）和预设账户类型（如现金、储蓄卡等）（YYYY-MM-DD）
- [ ] AC5：注册成功后自动登录，返回 JWT Token（YYYY-MM-DD）

### US-002 用户登录

**As** 已注册用户, **I want** 通过邮箱和密码登录, **so that** 我能访问我的家庭财务数据

**AC**:

- [ ] AC1：用户填写邮箱和密码，验证通过后返回 JWT Token（YYYY-MM-DD）
- [ ] AC2：密码错误返回通用错误信息（不暴露邮箱是否存在）（YYYY-MM-DD）
- [ ] AC3：JWT Token 包含用户 ID 和当前家庭 ID（YYYY-MM-DD）

## 设计概要

本 Feature 涉及：

- 后端：User / Family / FamilyMember / TransactionCategory / AccountType 五张表的新增
- 后端：POST /auth/register（含原子事务：User + Family + FamilyMember + 预设分类/类型初始化）
- 后端：POST /auth/login 两个端点
- 前端：注册页、登录页

预计需要拆 design.md。

## 关联 Scenario

—

## 与现有功能的关系

本 Feature 是系统的第一个 Feature，无前置依赖，为所有后续 Feature 提供身份与租户上下文。

## Storybook 声明

has_storybook: no

本 Feature 仅包含标准表单页面，复用基础组件，无新增可复用组件。

## 需求变更记录（设计审批通过后追加）
