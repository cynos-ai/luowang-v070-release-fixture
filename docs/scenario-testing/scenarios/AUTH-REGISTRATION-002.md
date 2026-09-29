---
id: AUTH-REGISTRATION-002
name: 注册拒绝：重复邮箱
description: 验证使用已注册邮箱再次注册被明确拒绝且不建立新会话
status: approved
tags:
  - core
  - module:认证
  - flow:注册
  - flow:拒绝路径
---

## 目的

确认规格验收「重复邮箱……有明确失败响应」：在浏览器用户中心用已注册邮箱再次提交注册时，服务端明确拒绝，且不创建新用户或 Session，UI 保持未登录。

## 依据

- 规格 `docs/changes/cynos-website-auth/spec.md` 行为 1 与验收条件「重复邮箱、弱密码、无效邮箱和错误密码有明确失败响应」。
- 实现 `src/server/security/auth.ts`（邮箱唯一约束冲突映射为注册失败）与 `src/server/app.ts` 错误处理。
- 初始化侦察（execution.md）：重复邮箱在浏览器 UI 稳定可达并被明确拒绝。

## 前置条件

- 隔离的非生产测试环境（可删除测试账号）；
- 一个仅在本次 Run 使用的测试邮箱。

## 步骤

1. 打开 Cynos 用户中心，切换到注册表单，用测试邮箱 A、昵称与至少 12 个字符的密码注册并进入 Welcome。
2. 退出登录，确认回到未登录状态。
3. 用同一邮箱 A 再次提交注册。
4. 观察拒绝提示，并读取 `GET /api/auth/status`。

## 期望

- 用已注册邮箱再次注册被明确拒绝（注册请求返回 4xx），页面显示失败提示且不进入 Welcome；
- 拒绝后 `GET /api/auth/status` 仍为未登录，未创建新账号或 Session。

## 需要记录

- 重复注册请求的实际状态码与错误信息；
- 拒绝后的未登录状态；
- 测试账号删除结果与清理核验。
