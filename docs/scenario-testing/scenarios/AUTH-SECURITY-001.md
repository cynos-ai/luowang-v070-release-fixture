---
id: AUTH-SECURITY-001
name: 认证写请求校验来源
description: 验证来源不被允许的认证写请求被拒绝（draft，来源构造手段待确认）
status: draft
tags:
  - module:认证
  - flow:安全
---

## 目的

确认规格行为 8 中「认证写请求校验 Origin」：来源不被允许的写请求被拒绝，不执行注册或登录。

## 依据

- 规格 `docs/changes/cynos-website-auth/spec.md` 行为 8。
- 实现 `src/server/app.ts`（preHandler 对写方法校验 Origin，未通过返回错误）。

## 前置条件

- 隔离的非生产测试环境；
- 能以与部署允许来源不同的来源发送认证写请求的手段（待确认）。

## 步骤

1. 构造来源与部署允许来源不一致的 `POST /api/auth/login` 或 `POST /api/auth/register` 写请求。
2. 观察响应。

## 期望

- 写请求被拒绝（4xx），不执行注册或登录，不建立会话。

## 需要记录

- 请求来源与被拒绝的状态码、错误信息。

## 状态说明

候选为 draft：期望依据明确（规格行为 8），但浏览器自身发出的写请求来源即页面来源，构造异源写请求的可执行手段在受控工具范围内尚未确认；确认可构造来源的手段后再执行。
