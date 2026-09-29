---
run_id: 01M3NPXC9XV8C16MR3SEHD8VEQ
trigger: manual
base_commit: d0e3542de268e5552fa15bbd23c58fa9876353bd
target_commit: ada2734792184525eb967629ad7958939bc87df3
included_commits:
  - ee652747a1407d3c62137434ce4c45038a17c226
  - ada2734792184525eb967629ad7958939bc87df3
result: passed
started_at: 2026-09-29T04:31:56.389Z
finished_at: 2026-09-29T04:35:21.466Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: passed
confirmed_bugs: []
---

# 最终报告：受控缺陷恢复后 AUTH-LOGIN-001 重测

## 1. 本次范围

- Run `01M3NPXC9XV8C16MR3SEHD8VEQ`，`trigger = manual`，`scenarioMode = review-all`，`initialization = false`，`scenarioChanges = null`，`blockingReasons = []`。
- 固定版本：`base = d0e3542de268e5552fa15bbd23c58fa9876353bd`，`target = ada2734792184525eb967629ad7958939bc87df3`，`includedCommits = [ee652747a1407d3c62137434ce4c45038a17c226, ada2734792184525eb967629ad7958939bc87df3]`。
- 人工请求：受控缺陷恢复后的当前 HEAD 重测；仅执行既有 approved 场景 `AUTH-LOGIN-001`，不修改场景文件；用真实浏览器完成注册、刷新、退出与重新登录；退出前固化原 Session Cookie，退出后由受控请求明确携带该原 Cookie 请求 `GET /api/me` 并确认 401，且 Cookie 原文不得落盘；使用本 Run 前缀合成账号，删除账号并登记清理 claim，由 Harness 独立核验账号不存在。
- 执行集合唯一来源 `plan.md` 的 `## execution_scenarios`：仅一项 `AUTH-LOGIN-001`（approved）。本轮无 `scenario-changes.patch`，与 `scenarioChanges = null` 一致；不新增、修改或废弃任何场景，最终汇总未修改场景 patch。
- 计划读取的累计变化（据 plan.md 转述，本报告未重新分析 diff）：`src/server/app.ts`（modified）及两份前次 Run 报告工件（added），其中仅 `src/server/app.ts` 为产品代码变化，与 `POST /api/auth/logout` 撤销服务端 Session 的修复相关。
- 范围边界：本轮不执行 `AUTH-REGISTRATION-001` 及其余场景；本报告结论**不代表认证模块整体覆盖完整**，也未对注册昵称缺陷（计划/审核中所述 Issue #4 对应项）是否修复下结论。

## 2. 逐场景结果

| 场景 | 结果 | 结果来源 |
| --- | --- | --- |
| AUTH-LOGIN-001 登录状态恢复 | passed | Reviewer 独立审核（review.md） |

`AUTH-LOGIN-001` 的 4 条适用期望均被审核判定为有充分实际观察支持：

1. **刷新后显示同一用户 — passed**（依据：`operation-14` 同 URL 重载 → `operation-15` 快照仍为同一用户，用户 id/昵称一致；截图 `auth-login-001-02-refresh-same-user.png` 与登录态截图 `auth-login-001-01-registered-logged-in.png` 画面一致）。
2. **退出后页面回到登录状态 — passed**（依据：`operation-17` 点击「退出登录」→ `operation-18` 快照回到登录表单并显示「已安全退出。」；截图 `auth-login-001-03-logged-out.png` 目视确认）。
3. **退出后的 Session 访问受保护接口返回 401 — passed**（依据：退出前 `browser_cookie_list`/`browser_cookie_get` 固化会话值引用；退出后客户端 Cookie 被清理；将退出前的**同一** Cookie 值写回并以导航发起 `GET /api/me`，网络记录为 `401`，请求详情的请求头凭据引用与退出前指向同一引用，响应体为 `UNAUTHORIZED`；对应控制台日志记录 `/api/me` 401。因此该 401 来自「请求确实携带退出前的原 Cookie 值」，而非无 Cookie 的未认证请求，可区分服务端撤销与仅客户端丢弃 Cookie）。
4. **删除测试账号后旧 Session 和原凭据均不可用 — passed**（依据：重新登录后获得新会话引用，与退出前不同，说明重登录确实发生；`DELETE` 账号后页面显示「测试账号及其会话已删除。」；将删除前的会话值写回并请求 `/api/me` 得 `401`；随后以原邮箱+原密码登录得 `401`，页面出现「邮箱或密码不正确」；后台网络记录与截图 `auth-login-001-04-account-deleted.png`、`auth-login-001-05-original-credentials-rejected.png` 支持；控制台日志记录 `/api/auth/login` 401）。

结果与审核一致：审核对 Runner 的 passed 主张作了独立证据复核并表示同意；上述依据、编号与截图文件名均引自 review.md。

## 3. 证据

本次 Run 的证据工件由动态上下文提供（截图、页面快照、控制台日志、operation/command 捕获），对应地址：

- 截图：`auth-login-001-01-registered-logged-in.png`、`auth-login-001-02-refresh-same-user.png`、`auth-login-001-03-logged-out.png`、`auth-login-001-04-account-deleted.png`、`auth-login-001-05-original-credentials-rejected.png`（URL 见 `/api/evidence/...`，如 `.../01M3NPXC9XV8C16MR3SEHD8VEQ/auth-login-001-03-logged-out.png`）。
- 页面快照：`page-2026-09-29T04-33-*.yml`（多个时间点）。
- 控制台日志：`console-2026-09-29T04-33-26-147Z.log`、`console-2026-09-29T04-33-44-483Z.log`、`console-2026-09-29T04-33-47-553Z.log`。
- 操作/命令记录：`operation-1.json` … `operation-49.json`、`command-1.json`。

证据说明（来源归属）：上述证据文件的存在与内容观察来自本次 Run 的动态上下文与 review.md 的独立复核；Reviewer 已打开并逐条核对这些原始证据。本报告不新增证据判断，也不把审核的独立发现改写为 Runner 交付。

## 4. 已确认产品问题与 Issue 决策

- 本 Run **无已确认产品 Bug**（`confirmed_bugs` 为空）。审核在「已确认产品问题」段落记「无」，并说明退出后服务端撤销 Session（历史 Issue #3 对应行为）在本轮表现为已修复，但仅记录本轮实际观察、不据此推断历史状态。
- 因无本次 confirmed Bug，未产生 Issue 候选查询需求，故无需 `create`/`link` 决策，也无 Issue 查询覆盖缺口。本报告不代表后续归档不会产生其他 Issue，也不对历史 Issue 状态作结论。

## 5. 未完成项、覆盖缺口与限制（保留审核来源与限定）

以下均为 review.md 中 Reviewer 交付的限制，按其原意保留：

1. 退出登录接口自身（`POST /api/auth/logout`）的 HTTP 状态未被单独捕获；「退出后 HTTP 状态」由页面文案与后续 `/api/me` 401 间接支持。审核将其记为记录完整性的小缺口，不影响期望 2/3。
2. 计划曾建议优先用受控 `request_test_http` 显式携带原 Cookie；实际执行改用受控 `browser_cookie_set`（写回退出前原值）+ `browser_navigate`，并以 `observed-request-header` 记录请求头实际携带该值。审核认为操作方式与计划建议不同但等价且可核对，期望 3 的契约未被降低。
3. 计划提出的「数据库用户/Session 行」直接观察未进行；期望 4 以受控请求（旧 Cookie 401、原凭据 401）作为可观察证据。
4. 范围限制：`AUTH-REGISTRATION-001` 及其余 approved/draft 场景本轮未执行，本 Run 结论不代表认证模块整体覆盖完整；未对注册昵称缺陷是否修复下结论。
5. 测试数据收尾：场景步骤 6 已通过业务接口删除账号，清理 claim 已登记；账号最终清理由 Harness 在最终 Main 后独立核验，其失败与否不改变本场景功能结论。本报告不声明清理已完成，也不填写系统收尾区。

## 6. 结论

- `AUTH-LOGIN-001`（approved）：**passed** —— 4 条适用期望均有充分实际观察支持，含退出后携带原 Cookie 重放返回 401 的服务端撤销证据，以及删除账号后旧 Session 与原凭据均不可用的证据。
- 整体结果：**passed**（无 blocked、无 failed，`blockingReasons` 为空）。
- 必要的下一步：本 Run 已闭合退出后服务端撤销 Session 的关键验证；如需恢复对认证模块整体的覆盖，需另行确认并授权执行 `AUTH-REGISTRATION-001` 等其余场景，本轮不构成对其结论。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTlBYQzlYVjhDMTZNUjNTRUhEOFZFUS9hdXRoLWxvZ2luLTAwMS0wMS1yZWdpc3RlcmVkLWxvZ2dlZC1pbi5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTlBYQzlYVjhDMTZNUjNTRUhEOFZFUS9hdXRoLWxvZ2luLTAwMS0wMi1yZWZyZXNoLXNhbWUtdXNlci5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTlBYQzlYVjhDMTZNUjNTRUhEOFZFUS9hdXRoLWxvZ2luLTAwMS0wMy1sb2dnZWQtb3V0LnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 4](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTlBYQzlYVjhDMTZNUjNTRUhEOFZFUS9hdXRoLWxvZ2luLTAwMS0wNC1hY2NvdW50LWRlbGV0ZWQucG5n>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 5](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTlBYQzlYVjhDMTZNUjNTRUhEOFZFUS9hdXRoLWxvZ2luLTAwMS0wNS1vcmlnaW5hbC1jcmVkZW50aWFscy1yZWplY3RlZC5wbmc>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 1 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3NPXC9XV8C16MR3SEHD8VEQ-runner · run-scoped-http-cleanup · 2026-09-29T04:35:33.981Z · absent=true · sha256 22e53e9a400fa1270ff56d93f389de2b0c2ce84a8a9cb87de3e1e709be1dd253
