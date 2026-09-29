---
run_id: 01M3NN2QJG1FJ5V5VV9XJGVSD6
trigger: manual
base_commit: null
target_commit: 7bb8b1b9f63be01414198703e715b005b7964d00
included_commits: []
result: passed
started_at: 2026-09-29T03:59:38.710Z
finished_at: 2026-09-29T04:05:22.781Z
scenario_results:
  - id: AUTH-LOGIN-002
    result: passed
  - id: AUTH-REGISTRATION-002
    result: passed
  - id: AUTH-LOGIN-001
    result: passed
confirmed_bugs: []
---

# 最终报告：聚焦验收 AUTH-LOGIN-002 → AUTH-REGISTRATION-002 → AUTH-LOGIN-001

## 1. 范围与固定版本

- 请求（要点）：对当前 HEAD 做聚焦通过验收，**仅执行**既有 approved 场景 AUTH-LOGIN-002、AUTH-REGISTRATION-002、AUTH-LOGIN-001，按此顺序执行；不得修改场景文件或新增场景；必须使用真实浏览器完成 UI 操作并至少对关键 UI 结果采集可审核截图；AUTH-LOGIN-001 须在退出前固化原 Session Cookie，并由受控请求明确携带该原 Cookie 验证 `GET /api/me` 返回 401，Cookie 原文不得落盘；全部账号使用本 Run 前缀，结束时登记清理 claim，由 Harness 适配器独立清理并核验不存在。
- 固定版本：`target_commit = 7bb8b1b9f63be01414198703e715b005b7964d00`；`base_commit = null`、`included_commits = []`、`blockingReasons = []`。
- 场景模式 `review-all`；`initialization = false`；`scenarioChanges = null`（本次无场景 patch，未修改、未新增场景；plan 与 review 均确认）。
- 正式执行集合取自 plan.md 唯一的 `## execution_scenarios`，顺序即执行顺序：AUTH-LOGIN-002 → AUTH-REGISTRATION-002 → AUTH-LOGIN-001；review 确认 execution.md 声明与 scenario-progress 实际顺序一致、无越序。

## 2. 总体结果

- 逐场景结果：AUTH-LOGIN-002 = passed；AUTH-REGISTRATION-002 = passed；AUTH-LOGIN-001 = passed。
- 已确认产品 Bug：无。
- 阻塞：无。`blockingReasons` 为空，`result = passed`。
- 归因限定：本 Run 无 base commit、无变化清单、无 included commits，结论只能对 target `7bb8b1b9…` **整体验收**，不能归因到具体改动或提交，也不得表述为某缺陷「已修复」。

## 3. 逐场景结果（依据 review.md 独立审核）

结果与依据均取自 Reviewer 交付的 review.md；本汇总不重做证据判断。以下每条结论归 Reviewer，Main 按既定聚合规则整理。

### AUTH-LOGIN-002 登录拒绝与统一凭据错误 — passed

- Reviewer 依据：注册 `POST /api/auth/register => 201`（operation-52）并进入 Welcome（operation-14，截图 `AUTH-LOGIN-002-registered-welcome.png`），退出回未登录态（operation-17）；错误密码登录页面 `alert`「邮箱或密码不正确」（operation-26，截图 `AUTH-LOGIN-002-wrong-password-error.png`），`POST /api/auth/login => 401`（operation-28），响应体 `{"code":"INVALID_CREDENTIALS","message":"邮箱或密码不正确"}`（operation-30）；不存在邮箱同表单提交（operation-34），页面同样提示「邮箱或密码不正确」（operation-35，截图 `AUTH-LOGIN-002-nonexistent-email-error.png`），`POST /api/auth/login => 401`（operation-36），响应体同 `INVALID_CREDENTIALS`（operation-38）；失败后 `GET /api/auth/status => 200 {"authenticated":false,"user":null}`（operation-40/41，受控 HTTP 复核 operation-42）。
- Reviewer 结论：三项适用期望（4xx 明确拒绝、错误信息一致、失败后未建立 Session）均有充分实际观察支持；不存在邮箱未被 UI 原生校验拦截，直接走页面路径，符合场景步骤③的可选分支。Reviewer 表示其核对了两张失败截图的提示文案与快照文本一致。
- 范围限定：该场景无偏差记录。

### AUTH-REGISTRATION-002 注册拒绝：重复邮箱 — passed

- Reviewer 依据：首次注册 `POST /api/auth/register => 201`（operation-52），Welcome 显示本 Run 前缀邮箱（operation-51，截图 `AUTH-REGISTRATION-002-first-register-welcome.png`）；点击退出回未登录表单（operation-55）；重复注册时字段被原生 required 校验拦截（operation-56/57，无 register 请求），补填同一口令后提交（operation-58/59），页面 `alert`「该邮箱已经注册」且仍在注册表单、未进入 Welcome（operation-60，截图 `AUTH-REGISTRATION-002-duplicate-email-error.png`），`POST /api/auth/register => 409 Conflict`（operation-61），响应体 `{"code":"EMAIL_ALREADY_REGISTERED","message":"该邮箱已经注册"}`（operation-63）；拒绝后 `GET /api/auth/status => 200 {"authenticated":false,"user":null}`（operation-65/66）。
- Reviewer 结论：重复邮箱被明确拒绝（409，属 4xx）、页面显示失败提示且不进入 Welcome、拒绝后未登录/未新建账号或 Session，均有充分证据。
- 偏差（Reviewer 如实记录）：退出后口令字段清空，需重新输入同一口令，属 UI 原生行为，不改变「以同一邮箱 A 重复提交注册」的验证对象，不构成阻塞。

### AUTH-LOGIN-001 登录状态恢复 — passed（本轮最高风险点）

- Reviewer 依据：登录本 Run 前缀账号（operation-70/72）进入 Welcome（operation-73，截图 `AUTH-LOGIN-001-logged-in-welcome.png`）；重新导航后仍显示 Welcome 且同一邮箱/昵称（operation-77/78，截图 `AUTH-LOGIN-001-refreshed-same-user.png`，与登录态截图同为同一 sha256）；Cookie 属性记录 `cynos_session`、`httpOnly: true`、`sameSite: Strict`（operation-75/76）；退出前读取原 Cookie（operation-80）、点击退出（operation-81，快照「已安全退出。」，截图 `AUTH-LOGIN-001-logged-out-state.png`）、`POST /api/auth/logout => 200`（operation-83）、退出后 Cookie 列表为空（operation-85）；用 `cookie_set` 写回原值（operation-86/87）后导航 `/api/me`，`GET /api/me => 401`（operation-89），响应体 `{"code":"UNAUTHORIZED","message":"请先登录"}`（operation-91，截图 `AUTH-LOGIN-001-replayed-cookie-me-401.png`）。
- 携带原 Cookie 的受控记录（关键判定口径）：Reviewer 指出 `browser_network_request` 请求头含 `cookie: [REDACTED]`，其 `observed-request-header` 引用与退出前 `observed-browser` 及 `restore-input` 引用**完全相同**（operation-90），即请求头确实携带退出前固化的同一 `cynos_session` 值，区别于「客户端无 Cookie 的普通未认证 401」，满足计划第 5 节判定口径。
- 删除账号与原凭据：原凭据重登录成功（operation-95/96/97），点击删除提示「测试账号及其会话已删除。」回登录态（operation-99，截图 `AUTH-LOGIN-001-account-deleted.png`），`DELETE /api/me => 200`（operation-100）；再用原邮箱+原口令登录被拒，`alert`「邮箱或密码不正确」（operation-108，截图 `AUTH-LOGIN-001-deleted-account-login-rejected.png`），`POST /api/auth/login => 401`（operation-109），响应体 `INVALID_CREDENTIALS`（operation-111）。
- Reviewer 结论：四条适用期望（刷新同一用户、退出回登录态、退出后原 Session 访问 `/api/me` = 401 且有携带原 Cookie 的请求头证据、删除后旧 Session 与原凭据不可用）均有实际观察支持；Cookie 属性已记录；未发现产品缺陷。
- 残余覆盖说明（Reviewer 如实保留，不影响通过判定）：
  - 「删除测试账号后旧 Session 不可用」一项，证据为删除后页面回登录态 + 应用提示「测试账号及其会话已删除。」+ `DELETE /api/me = 200`，**未**在删除后再用该（重登录）会话单独请求 `/api/me` 做隔离观察；原凭据不可用由 401 直接确认。会话被服务端撤销的最强证据来自退出后原 Cookie 重放 401。
  - execution.md 在步骤 4 后以「重新加载首页 `GET /api/auth/status` 结果为未登录」作佐证，但 Reviewer 指出该处捕获的是页面快照（回登录表单），**未见**当时 `/api/auth/status` 的响应体；该「结果为未登录」是由页面渲染得出的推断，非直接捕获的接口响应。该佐证非必需，主证据（operation-89/90/91）不受影响。
  - execution.md 将 `GET /api/me => 401` 标注为 operation-88，实为 operation-89 的请求列表返回 401（operation-88 是导航）；属编号归属的小偏差，不影响结论。

## 4. 已确认产品问题

- 本次未发现任何已确认产品 Bug（无 failed、无期望被违反的实际观察；`confirmed_bugs` 为空）。所有告警（401/409）均为被测拒绝路径的预期响应，Reviewer 记录的控制台错误日志与其一致（`console-2026-09-29T04-00-47-134Z.log`、`console-2026-09-29T04-01-35-238Z.log`、`console-2026-09-29T04-02-34-938Z.log`、`console-2026-09-29T04-02-40-331Z.log`）。
- 无已确认 Bug，故本次不产生 Issue create/link 决策，未调用候选查询；不涉及「查询不可用」情形。

## 5. 证据与来源

- 证据 URL 原样复用动态 Run 返回值；截图、页面快照（`page-*.yml`）、控制台日志（`console-*.log`）与 operation 记录均在本次 Run 证据清单中。关键截图：
  - `AUTH-LOGIN-002-registered-welcome.png`、`AUTH-LOGIN-002-wrong-password-error.png`、`AUTH-LOGIN-002-nonexistent-email-error.png`
  - `AUTH-REGISTRATION-002-first-register-welcome.png`、`AUTH-REGISTRATION-002-duplicate-email-error.png`
  - `AUTH-LOGIN-001-logged-in-welcome.png`、`AUTH-LOGIN-001-refreshed-same-user.png`、`AUTH-LOGIN-001-logged-out-state.png`、`AUTH-LOGIN-001-replayed-cookie-me-401.png`、`AUTH-LOGIN-001-account-deleted.png`、`AUTH-LOGIN-001-deleted-account-login-rejected.png`
- 执行归属：浏览器执行有真实 operation 记录与 `playwright-mcp-tool-result` 证据支持，Reviewer 据此确认 `browserRequired` 为真实执行，非仅读取既有浏览器格式材料。证据文件的存在与类型本身不单独证明某一执行者的操作；本报告的关联基于 review.md 交付的操作记录归属。
- 脱敏：全部操作记录中表单值/口令均为 `[REDACTED]`，Cookie 以引用标识表示、原文未落盘；本报告未复述任何口令或真实凭据值。截图中的本 Run 前缀测试邮箱为测试标识，非真实受控凭据。本报告未执行任何扫描，故不作任何凭据泄漏与否的扫描结论。
- 独立契约依据：规范 `docs/changes/cynos-website-auth/spec.md`（行为 1–9 与验收条件）与清理契约 `docs/changes/run-scoped-test-cleanup/spec.md`；三个场景 frontmatter 均为 `status: approved`，正文期望依据充分。

## 6. 覆盖缺口与未完成事项（保留 Reviewer 的疑问与限制）

- **范围外未执行**：AUTH-ACCESS-001、AUTH-REGISTRATION-001、AUTH-ACCOUNT-001 及全部 draft 场景未在本 Run 执行，其通过性/缺陷状态不得由本轮推断；本 Run 结论**不代表认证模块整体覆盖完整**。
- **清理未闭环（Reviewer 非阻塞项，尚未由 Harness 核验）**：Reviewer 指出 execution.md §6 声明已为本 Run 前缀账号登记清理 claim（`cleanupScope="website-accounts"`），但本 Run 可读证据中**未捕获** `register_test_data`/清理登记的原始记录，该声明无法由现有证据独立核实；Harness 收尾清理与「核验不存在」**尚未执行**（execution.md 亦如实说明未声明清理完成）。按协议，测试后数据清理由 Harness 在本 Session 结束后统一处理，本报告**不声称清理已完成**，也不填写系统收尾区。场景「需记录」的「测试账号删除与清理核验」在 Run 内记录缺口如实保留。
- **时间基准**：Reviewer 指出证据时间戳来自 Harness 捕获（operation.startedAt/finishedAt、console 日志相对毫秒），各来源是否共用同一时钟基准无法确认，未据此给出跨来源的精确事件时间结论；本报告沿用该限定。
- **归因依据缺失**：无 base commit/变化清单/included commits，结论只能对 target 整体验收，不能归因到具体提交。
- **人工复核**：本流程 Agent 为模型；模型看图/审核不等于人工复核，本 Run 无人工复核记录，**不声称人工已确认**。

## 7. 覆盖缺口修正说明（Reviewer 表述精度）

按 Reviewer 要求保留来源：本报告采用其对 execution.md 两处表述精度的修正说明（operation 编号归属、`/api/auth/status` 佐证来源），上述第 3 节 AUTH-LOGIN-001 残余覆盖说明已如实列出，未改写为 Runner 的交付。

## 8. 当前授权范围内的下一步

- 本 Run 范围内无需补充执行；三个 approved 场景均已实际执行并判 passed，无失败与阻塞。
- 若需确认认证模块整体覆盖，须对范围外 approved 场景（AUTH-ACCESS-001、AUTH-REGISTRATION-001、AUTH-ACCOUNT-001）另行安排 Run——这需要明确授权与计划，不在当前请求授权范围内。
- 清理闭环由 Harness 适配器在本 Session 结束后处理；如需在 Run 内提前核验，须另行确认权限与操作范围。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk4yUUpHMUZKNVY1VlY5WEpHVlNENi9BVVRILUxPR0lOLTAwMS1hY2NvdW50LWRlbGV0ZWQucG5n>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk4yUUpHMUZKNVY1VlY5WEpHVlNENi9BVVRILUxPR0lOLTAwMS1kZWxldGVkLWFjY291bnQtbG9naW4tcmVqZWN0ZWQucG5n>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk4yUUpHMUZKNVY1VlY5WEpHVlNENi9BVVRILUxPR0lOLTAwMS1sb2dnZWQtaW4td2VsY29tZS5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 4](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk4yUUpHMUZKNVY1VlY5WEpHVlNENi9BVVRILUxPR0lOLTAwMS1sb2dnZWQtb3V0LXN0YXRlLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 5](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk4yUUpHMUZKNVY1VlY5WEpHVlNENi9BVVRILUxPR0lOLTAwMS1yZWZyZXNoZWQtc2FtZS11c2VyLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 6](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk4yUUpHMUZKNVY1VlY5WEpHVlNENi9BVVRILUxPR0lOLTAwMS1yZXBsYXllZC1jb29raWUtbWUtNDAxLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 7](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk4yUUpHMUZKNVY1VlY5WEpHVlNENi9BVVRILUxPR0lOLTAwMi1ub25leGlzdGVudC1lbWFpbC1lcnJvci5wbmc>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 8](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk4yUUpHMUZKNVY1VlY5WEpHVlNENi9BVVRILUxPR0lOLTAwMi1yZWdpc3RlcmVkLXdlbGNvbWUucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 9](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk4yUUpHMUZKNVY1VlY5WEpHVlNENi9BVVRILUxPR0lOLTAwMi13cm9uZy1wYXNzd29yZC1lcnJvci5wbmc>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 10](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk4yUUpHMUZKNVY1VlY5WEpHVlNENi9BVVRILVJFR0lTVFJBVElPTi0wMDItZHVwbGljYXRlLWVtYWlsLWVycm9yLnBuZw>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 11](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk4yUUpHMUZKNVY1VlY5WEpHVlNENi9BVVRILVJFR0lTVFJBVElPTi0wMDItZmlyc3QtcmVnaXN0ZXItd2VsY29tZS5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 2 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3NN2QJG1FJ5V5VV9XJGVSD6-l002 · run-scoped-http-cleanup · 2026-09-29T04:05:39.883Z · absent=true · sha256 0069661092f9695a938df07c7c8ebad33eb9737e6c489898c9472edc6f654704

独立核验：luowang-01M3NN2QJG1FJ5V5VV9XJGVSD6-reg002 · run-scoped-http-cleanup · 2026-09-29T04:05:39.885Z · absent=true · sha256 0069661092f9695a938df07c7c8ebad33eb9737e6c489898c9472edc6f654704
