---
run_id: 01M3YG2E4SMCNHYMZHVJH76T94
trigger: manual
base_commit: null
target_commit: 085ca4429557ba36c808808c9efeaac73f18b9a0
included_commits: []
result: blocked
started_at: 2026-10-02T14:30:32.916Z
finished_at: 2026-10-02T14:36:15.386Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: passed
  - id: AUTH-REGISTRATION-001
    result: blocked
confirmed_bugs: []
---

# 最终测试报告：固定 scenario-testing 提交上的核心认证场景

- Run：`01M3YG2E4SMCNHYMZHVJH76T94`（trigger = manual，scenarioMode = autonomous，initialization = false，scenarioChanges = null，blockingReasons = []）
- 固定 target：`085ca4429557ba36c808808c9efeaac73f18b9a0`；`baseCommit = null`、`includedCommits = []`
- 执行清单（`## execution_scenarios`，逐行有序）：`AUTH-LOGIN-001`、`AUTH-REGISTRATION-001`
- 场景 patch：不存在（`scenario-changes.patch` 未提供），与计划「本轮不新增/修改/废弃场景」一致；审核确认无可核对的「已维护场景」声明。
- 整体结果：**blocked（部分通过）**

## 结果摘要

| 场景 | 结果 | 判定来源 |
| --- | --- | --- |
| AUTH-LOGIN-001 登录状态恢复 | passed | Reviewer 独立审核 |
| AUTH-REGISTRATION-001 新用户注册 | blocked | Reviewer 独立审核 |

逐项与明细一致：2 个执行场景，0 个 failed，0 个 confirmed Bug；1 个场景通过、1 个场景因一条明列期望未验证而阻塞。整体按聚合规则 `blocked > failed > passed` 记为 blocked。

## 逐场景结果

### AUTH-LOGIN-001 — passed

审核以其独立观察核对场景原文的四条适用期望（全部为通过条件），并同意通过：

1. **刷新后显示同一用户 — 符合**：登录后在欢迎态（正文显示当前登录邮箱 `…uiacct@example.test`），重新导航（等价刷新）后仍为同一用户、同一邮箱；截图 `auth-login-001-after-refresh.png` 目视确认为同一欢迎态。
2. **退出后页面回到登录状态 — 符合**：点击「退出登录」后回到登录表单并显示「已安全退出。」，`POST /api/auth/logout => [200]`，Cookie 列表为空；截图 `auth-login-001-after-logout.png` 目视确认。
3. **退出后该 Session 访问受保护接口返回 401 — 符合，并满足「须证明携带原 Cookie」的判定口径**：退出前已固化原 Session Cookie（引用标识一致，`httpOnly=true`、`sameSite=Strict`），退出后以该固化值恢复并导航 `GET /api/me` 得 `[401] Unauthorized`；请求详情中请求头 `cookie: [REDACTED]` 的引用与该次恢复输入引用为同一值，响应体为 `UNAUTHORIZED / 请先登录`。审核认定该 401 是携带退出前原 Cookie 的 401，而非浏览器无 Cookie 的普通未认证 401。
4. **删除测试账号后旧 Session 与原凭据均不可用 — 符合**：重新登录 → 固化删除前 Session Cookie → 删除账号显示「测试账号及其会话已删除。」且 Cookie 为空；旧 Session 重放 `/api/me` 得 401（请求头引用同为该删除前 Cookie 值）；原邮箱+原密码登录提示「邮箱或密码不正确」；截图 `auth-login-001-after-delete.png`、`auth-login-001-deleted-creds-rejected.png` 目视确认。

需记录项（Cookie 属性）已记录 `httpOnly: true`、`sameSite: Strict`（`secure=false` 与非生产 HTTP 访问一致，审核认为不影响该记录项要求）。

审核记录的执行方式偏差（不影响判定）：场景前置「已存在一个非生产测试账户」本轮未使用，改由浏览器注册表单创建 Run 前缀账号并用登录表单重新登录；审核确认该偏差未改变测试对象与断言含义。

### AUTH-REGISTRATION-001 — blocked

审核逐条核对场景原文的适用期望：

1. **页面显示欢迎信息 — 符合**：提交注册后页面进入欢迎态（`POST /api/auth/register => [201]`），截图 `auth-registration-001-first-welcome.png` 目视确认欢迎标题与正文展示 Run 前缀昵称。
2. **`GET /api/auth/status` 返回已登录用户 — 符合**：同会话导航返回 `authenticated: true` 且 user 的 id/email/createdAt 与注册响应一致。
3. **可从欢迎页删除当前测试账号、原邮箱密码随后不能再登录 — 符合**：从欢迎页点击「删除测试账号」显示「测试账号及其会话已删除。」并回登录态，随后用原邮箱原密码登录提示「邮箱或密码不正确」；截图 `auth-registration-001-deleted.png`、`auth-registration-001-deleted-creds-rejected.png` 目视确认。
4. **数据库不保存明文密码 — 未验证（阻塞项）**：证据中无任何持久层/存储观察记录；`request_test_http` 只返回脱敏响应，浏览器仅见页面，只读存储观察工具在本 Run 报告不可用。响应体不含明文不能证明服务端未存明文。该明列期望按场景原文与计划 §8 属通过条件，不能移入「限制」豁免，故场景为 **blocked**，已确认的成功项保留。

计划 §6 额外要求的「首次 Welcome 身份 = 本次输入昵称」记录项无法从原始证据独立复核：输入昵称与注册响应体 `displayName` 在证据中均被脱敏，Reviewer 只能凭可见截图确认展示名为 Run 前缀昵称。审核明确该缺口不改变 AUTH-REGISTRATION-001 已因存储期望阻塞的判定（保留为记录缺口）。

## Reviewer 的疑问与限制（原样保留）

- 「数据库不保存明文密码」需提供受控的数据库/存储只读检查能力后复测；在此之前该场景保持 blocked。
- 「首次 Welcome 昵称是否逐字等于输入昵称」受昵称脱敏限制，不能独立确认；仅为记录缺口，不升级为产品结论。
- 预置测试账号前置未实际使用，判断依据部分依赖已脱敏的预置邮箱，Reviewer 不能完全独立确认该缺口，故保留为环境/验证能力缺口，不作为产品结论。
- 执行与记录问题（不影响产品结论）：`execution.md` 在叙述步骤 4/5 时写出了会话 Cookie 的前缀片段（本报告不复述其值），与会话令牌原文不落盘的要求不一致，属低影响的记录规范偏差。
- 控制台日志：6 个日志均为预期内的 `401` 资源加载错误，与失败登录尝试及 401 重放一致，未见非预期前端错误。

## 已确认产品问题

本 Run **未发现**可判定的产品缺陷（failed 项为 0），因此无 confirmed Bug，`confirmed_bugs` 为空，无 Issue create/link 决策需要作出。

审核记录的两项历史事项均为「本次未观察到」，未判定为产品缺陷，本报告不据此声明修复或归因：

- 历史 open Issue #3（退出未撤销服务端 Session）：退出后携带退出前原 Cookie 重放 `/api/me` 得 401，对应行为本次未被观察到。
- 历史 open Issue #4（注册首次欢迎未保留输入昵称）：首次欢迎页显示 Run 前缀昵称，对应行为本次未见复现；但受昵称脱敏限制，不能独立确认展示名与输入昵称逐字相等。

以上仅为本次观察，因 `baseCommit = null`、无 diff，**不表述为「已修复」，不归因于任何提交或改动**。

## 覆盖缺口与未完成项

- 本轮仅执行 `## execution_scenarios` 内的两个 approved core 场景。其余 approved（`AUTH-ACCESS-001`、`AUTH-ACCOUNT-001`、`AUTH-LOGIN-002`、`AUTH-REGISTRATION-002/003`）与 draft（`AUTH-SECURITY-001/002`）未执行，本结论不代表认证模块整体覆盖完整，也不代表项目整体无问题。
- `AUTH-REGISTRATION-001` 的存储期望未验证，需补齐受控持久层检查能力后复测。
- 无 base commit / 无 diff：不作逐提交归因，不写「已修复」。
- 时序：证据文件名与 `at`/`startedAt` 均来自 Harness 记录时钟；场景不要求精确时长，本报告未跨来源拼接绝对事件时间。
- 环境阻塞：只读存储观察工具在本 Run 报告不可用；`blockingReasons` 为空，但 AUTH-REGISTRATION-001 因该条期望无法确认而阻塞，整体结果为 blocked。

## 数据收尾

本轮临时账号（均带 `luowang-01M3YG2E4SMCNHYMZHVJH76T94-` 前缀或 Run 前缀 displayName）由 Runner 登记；`execution.md` 声明未自行核验清理完成。测试后数据清理由 Harness 在本 Session 结束后统一处理，本报告不声明清理已完成。

## 必要下一步

- 在受控环境中补充数据库/存储只读检查能力后复测 `AUTH-REGISTRATION-001`，闭合「数据库不保存明文密码」明列期望；此能力需另行确认授权后方可使用。
- 如需核对「首次欢迎昵称 = 输入昵称」及预置账号前置，需在允许落盘记录昵称、并具备可确认预置账号来源的环境下重跑；这些均属当前授权范围外的能力缺口。

## 来源与独立性说明

本报告依据 `plan.md` 与 `review.md` 汇总，不重新执行测试、不回读运行记录重做证据审核。逐场景 passed/blocked 判定为 Reviewer 依据原始证据独立得出；本报告如实区分 Reviewer 的观察/结论与本汇总的聚合处理，未改写审核已交付的期望适用性、范围解释与依据。审核明确「原因未确认」的项目均按未确认保留，未整理为已确认事实。证据文件清单与审核正文所述一致（13 张截图、24 个浏览器快照/日志、107 条 command/MCP 记录）；Manifest 中无 command/MCP 操作归属记录，仅有截图与日志文件，两类事实已分别说明。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkU0U01DTkhZTVpIVkpINzZUOTQvYXV0aC1sb2dpbi0wMDEtYWZ0ZXItZGVsZXRlLnBuZw>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkU0U01DTkhZTVpIVkpINzZUOTQvYXV0aC1sb2dpbi0wMDEtYWZ0ZXItbG9nb3V0LnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkU0U01DTkhZTVpIVkpINzZUOTQvYXV0aC1sb2dpbi0wMDEtYWZ0ZXItcmVmcmVzaC5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 4](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkU0U01DTkhZTVpIVkpINzZUOTQvYXV0aC1sb2dpbi0wMDEtZGVsZXRlZC1jcmVkcy1yZWplY3RlZC5wbmc>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 5](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkU0U01DTkhZTVpIVkpINzZUOTQvYXV0aC1sb2dpbi0wMDEtZGVsZXRlZC1zZXNzaW9uLTQwMS5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 6](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkU0U01DTkhZTVpIVkpINzZUOTQvYXV0aC1sb2dpbi0wMDEtbG9nZ2VkLWluLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 7](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkU0U01DTkhZTVpIVkpINzZUOTQvYXV0aC1sb2dpbi0wMDEtbG9naW4tcGFnZS5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 8](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkU0U01DTkhZTVpIVkpINzZUOTQvYXV0aC1sb2dpbi0wMDEtbWUtNDAxLXdpdGgtb3JpZ2luYWwtY29va2llLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 9](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkU0U01DTkhZTVpIVkpINzZUOTQvYXV0aC1sb2dpbi0wMDEtd2VsY29tZS1iZWZvcmUtbG9naW4ucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 10](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkU0U01DTkhZTVpIVkpINzZUOTQvYXV0aC1yZWdpc3RyYXRpb24tMDAxLWFmdGVyLXJlZnJlc2gucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 11](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkU0U01DTkhZTVpIVkpINzZUOTQvYXV0aC1yZWdpc3RyYXRpb24tMDAxLWRlbGV0ZWQtY3JlZHMtcmVqZWN0ZWQucG5n>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 12](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkU0U01DTkhZTVpIVkpINzZUOTQvYXV0aC1yZWdpc3RyYXRpb24tMDAxLWRlbGV0ZWQucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 13](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkU0U01DTkhZTVpIVkpINzZUOTQvYXV0aC1yZWdpc3RyYXRpb24tMDAxLWZpcnN0LXdlbGNvbWUucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 5 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3YG2E4SMCNHYMZHVJH76T94-probe · run-scoped-http-cleanup · 2026-10-02T14:36:31.239Z · absent=true · sha256 30d7abfb886b4ab4e48f6dfe78ffdc4451cffc8fd77a470fcdb0054095537e2b

独立核验：luowang-01M3YG2E4SMCNHYMZHVJH76T94-watermark · run-scoped-http-cleanup · 2026-10-02T14:36:31.240Z · absent=true · sha256 30d7abfb886b4ab4e48f6dfe78ffdc4451cffc8fd77a470fcdb0054095537e2b

独立核验：luowang-01M3YG2E4SMCNHYMZHVJH76T94-login · run-scoped-http-cleanup · 2026-10-02T14:36:31.241Z · absent=true · sha256 30d7abfb886b4ab4e48f6dfe78ffdc4451cffc8fd77a470fcdb0054095537e2b

独立核验：luowang-01M3YG2E4SMCNHYMZHVJH76T94-uiacct · run-scoped-http-cleanup · 2026-10-02T14:36:31.243Z · absent=true · sha256 30d7abfb886b4ab4e48f6dfe78ffdc4451cffc8fd77a470fcdb0054095537e2b

独立核验：luowang-01M3YG2E4SMCNHYMZHVJH76T94-regacct · run-scoped-http-cleanup · 2026-10-02T14:36:31.244Z · absent=true · sha256 30d7abfb886b4ab4e48f6dfe78ffdc4451cffc8fd77a470fcdb0054095537e2b
