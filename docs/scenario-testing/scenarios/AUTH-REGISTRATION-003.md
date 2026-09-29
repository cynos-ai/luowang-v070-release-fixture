---
id: AUTH-REGISTRATION-003
name: 注册输入校验拒绝
description: 验证非法邮箱与弱密码在服务端被明确拒绝且不创建账号或会话
status: approved
tags:
  - module:认证
  - flow:注册
  - flow:拒绝路径
---

## 目的

确认规格验收「弱密码、无效邮箱……有明确失败响应」：服务端对不符合要求的邮箱或密码拒绝注册，且不创建用户或会话。

## 依据

- 规格 `docs/changes/cynos-website-auth/spec.md` 行为 1 与验收条件「重复邮箱、弱密码、无效邮箱和错误密码有明确失败响应」。
- 实现 `src/server/security/auth.ts`（`normalizeEmail`、`validatePassword`）与 `src/server/app.ts` 错误映射。
- 初始化侦察（execution.md）：浏览器注册表单的 `type=email` 与 `minLength=12` 原生校验在提交前拦截非法输入，使服务端拒绝在 UI 层不可稳定触达，故本场景在 API 层验证服务端校验。

## 前置条件

- 隔离的非生产测试环境（可删除测试账号）；
- 可对该应用同源路径发起写请求的受控 HTTP 客户端。

## 步骤

1. 以非法邮箱（缺域名或含空格）与合法昵称、至少 12 个字符的密码调用 `POST /api/auth/register`。
2. 以合法邮箱、合法昵称、少于 12 个字符的密码调用 `POST /api/auth/register`。
3. 读取两次响应状态与错误信息，并读取 `GET /api/auth/status`。

## 期望

- 非法邮箱注册被明确拒绝（4xx），不创建账号或 Session；
- 弱密码注册被明确拒绝（4xx），不创建账号或 Session；
- 拒绝后 `GET /api/auth/status` 为未登录。

## 需要记录

- 两次拒绝请求的实际状态码与错误信息；
- 拒绝后的会话状态。
