---
id: AUTH-ACCESS-001
name: 未登录访客无法访问受保护资料
description: 验证没有会话的访客不能读取用户资料，页面停留在登录态
status: approved
tags:
  - core
  - module:认证
  - flow:访问控制
---

## 目的

确认规格行为 4、5：没有有效 Session 时 `GET /api/auth/status` 返回未登录空用户、`GET /api/me` 拒绝访问，用户中心不向未登录访客暴露资料。

## 依据

- 规格 `docs/changes/cynos-website-auth/spec.md` 行为 4、5 与验收条件「退出后同一 Session 不能访问受保护 API」。
- 实现 `src/server/app.ts`（`/api/auth/status`、`/api/me`）与 `src/web/App.tsx`（未登录渲染登录表单）。
- 初始化侦察（execution.md）：未登录 `GET /api/auth/status` 返回 `{"authenticated":false,"user":null}`，页面显示登录表单。

## 前置条件

- 隔离的非生产测试环境；
- 浏览器处于无会话的未登录状态。

## 步骤

1. 在未登录状态打开 Cynos 用户中心。
2. 观察页面呈现（登录表单，而非 Welcome）。
3. 读取 `GET /api/auth/status`。
4. 读取 `GET /api/me`。

## 期望

- 页面显示登录表单，未展示任何用户资料；
- `GET /api/auth/status` 返回未登录（`authenticated:false`、`user:null`）；
- `GET /api/me` 被拒绝（4xx），未返回用户资料。

## 需要记录

- 页面呈现状态；
- 两个接口的状态与响应。
