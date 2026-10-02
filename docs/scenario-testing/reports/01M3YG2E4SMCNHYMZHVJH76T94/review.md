# 审核报告：AUTH-LOGIN-001 与 AUTH-REGISTRATION-001

- Run：`01M3YG2E4SMCNHYMZHVJH76T94`（trigger = manual，scenarioMode = autonomous，initialization = false，scenarioChanges = null，blockingReasons = []）
- 固定 target：`085ca4429557ba36c808808c9efeaac73f18b9a0`（`baseCommit = null`，无 diff，不作逐提交归因）
- 审核对象：`plan.md`（planHash `2aed9ecf…40f9`，与计划开头 Harness 元数据及 `query_source_reads(scope=plan)` 返回一致）、`selectedScenarioSnapshot` 冻结的两个场景正文、本次全部原始 evidence（107 条 command/MCP 记录、24 个浏览器快照/日志、13 张截图）、最后对照 `execution.md`。
- `scenario-changes.patch` 不存在，与计划 §4「本轮不新增/修改/废弃场景」及 `scenarioChanges = null` 一致，无「已维护场景」声明可核对。
- `browserRequired = true` 与真实执行一致：本次确有 Playwright MCP 导航、填表、点击、截图、Cookie 读取/恢复操作（如 `operation-3/5/6/39/52/54/84/86`），并非仅有预置快照。

## 总体结论

| 场景 | Reviewer 独立判定 | 依据摘要 |
| --- | --- | --- |
| AUTH-LOGIN-001 | **passed** | 刷新同一用户、退出回登录态、退出后携带退出前原 Cookie 重放 `/api/me` 得 401、删除后旧 Session 401 且原凭据登录失败，均有原始记录 |
| AUTH-REGISTRATION-001 | **blocked** | 欢迎页、`/api/auth/status`、删除后原凭据失败已确认；「数据库不保存明文密码」无可用持久层观察，无法确认 |

两场景的适用期望均按 `selectedScenarioSnapshot` 原文核对（快照未脱敏，`redacted: false`）。整体为 **blocked（部分通过）**：AUTH-LOGIN-001 的结论可独立成立，AUTH-REGISTRATION-001 因一条明列期望未验证而不能通过。

---

## AUTH-LOGIN-001 登录状态恢复 — passed（审核同意）

场景原文适用期望（全部为通过条件）：①刷新后显示同一用户；②退出后页面回到登录状态；③退出后的 Session 访问受保护接口返回 401；④删除测试账号后旧 Session 和原凭据均不可用。

逐项核对（Reviewer 观察，非转述 Runner）：

1. **① 刷新仍显示同一用户 — 符合。**
   - 登录成功：`operation-38` 页面进入欢迎态，正文「当前登录邮箱是 luowang-01m3yg2e4smcnhymzhvjh76t94-uiacct@example.test」；同会话网络记录 `operation-41` 含 `POST /api/auth/login => [200]`。
   - 重新导航（等价刷新）后 `operation-44` 仍为同一用户、同一邮箱；截图 `auth-login-001-after-refresh.png` 目视确认为同一 `…uiacc。` 欢迎态（截图内正文邮箱 `…uiacct@example.test`）。
2. **② 退出后回到登录状态 — 符合。**
   - 点击「退出登录」后 `operation-49` 页面回到「登录 Cynos」并显示「已安全退出。」；`operation-50` 网络记录 `POST /api/auth/logout => [200]`；`operation-48` Cookie 列表为空；截图 `auth-login-001-after-logout.png` 目视确认登录表单 +「已安全退出。」。
3. **③ 退出后原 Session 访问受保护接口返回 401 — 符合，且满足「证明携带原 Cookie」的判定口径。**
   - 退出前已固化原 Session Cookie（`operation-39`/`operation-42`/`operation-45` 均为同一 `observed-browser` 引用 `credential-aed0a8708fbd7f1c9145b9b049ea78cc`，`httpOnly=true, sameSite=Strict, domain=luowang-pc-node-app, path=/`）。
   - 退出后以该固化值 `browser_cookie_set`（`operation-52`，`source: restore-input`，同一引用）恢复至本机，回显一致（`operation-53`）。
   - 导航 `GET /api/me` → `operation-55` `[401] Unauthorized`；`operation-56` 的请求详情显示请求头 `cookie: [REDACTED]`，其 `observed-request-header` 引用与该次 `restore-input` 引用**为同一 `credential-aed0a870…`**（Run 内按值一致），响应体 `page-2026-10-02T14-33-05-204Z.yml` 为 `{"error":{"code":"UNAUTHORIZED","message":"请先登录","requestId":"req-4i"}}`。
   - 因此该 401 是「请求确实携带退出前原 Cookie 值」的 401，而非浏览器无 Cookie 的普通未认证 401，符合场景对步骤 5 的核心要求。
4. **④ 删除测试账号后旧 Session 与原凭据均不可用 — 符合。**
   - 重新登录（`operation-62/63`，`Ui` 欢迎态）→ 固化删除前 Session Cookie（`operation-64`，引用 `credential-ec249eddc6a48bc06100ad9f353dd0a4`）→ 点击「删除测试账号」，`operation-66` 显示「测试账号及其会话已删除。」，`operation-67` Cookie 为空；截图 `auth-login-001-after-delete.png` 目视确认提示与登录态。
   - 旧 Session 重放：`operation-69` 以同一 `restore-input` 引用 `credential-ec249…` 恢复 → `operation-70` 导航 `/api/me` 401 → `operation-71` 请求头 `cookie: [REDACTED]`，其 `observed-request-header` 引用同为 `credential-ec249…`；响应体 `page-…14-33-24-424Z.yml` 为 `UNAUTHORIZED 请先登录`。
   - 原凭据登录：`operation-77` 以原邮箱+原密码点击登录 → `operation-78` 页面提示「邮箱或密码不正确」；截图 `auth-login-001-deleted-creds-rejected.png` 目视确认。
5. **需记录项（Cookie 属性）**：`operation-42` 记录 `httpOnly: true`、`sameSite: Strict`、`secure: false`、`domain: luowang-pc-node-app`、`path: /`。审核同意 Runner 的判断：`secure=false` 与非生产 HTTP 访问一致，不影响场景要求的 HttpOnly / SameSite=Strict 记录项。

**执行方式偏差（不影响判定，记录备查）**：场景前置为「已存在一个非生产测试账户」，本轮实际由浏览器注册表单创建了 Run 前缀账号并在登出后用登录表单重新登录（`operation-26…38`、`operation-61/62`），未使用预置账号。审核确认该偏差未改变测试对象或断言含义（流程仍为 登录→刷新→退出→重放→删除），属可接受的等价做法。其理由（预置账号在该非生产环境无可用口令）为环境/前置缺口：`operation-8` 用预置账号登录得 401、`operation-12` 用「预置邮箱」注册首次返回 201（说明该邮箱原先不存在）、`operation-23` 再次注册返回 409；审核观察到注册 201→409 的模式与「该邮箱此前未注册」一致，但 `operation-12` 的邮箱在证据中已脱敏，Reviewer 无法独立确认它就是预置账号邮箱，故「预置账号未播种」只能作为**环境缺口**接受，不作为产品结论。

## AUTH-REGISTRATION-001 新用户注册 — blocked（审核同意）

场景原文适用期望：①页面显示欢迎信息；②`GET /api/auth/status` 返回已登录用户；③数据库不保存明文密码；④验证完成后可从欢迎页删除当前测试账号，原邮箱密码随后不能再登录。

1. **① 页面显示欢迎信息 — 符合。** `operation-84/85` 填昵称/邮箱/密码，`operation-86/87` 提交后页面进入欢迎态，正文邮箱 `luowang-01m3yg2e4smcnhymzhvjh76t94-regacct@example.test`，`operation-88` 网络记录 `POST /api/auth/register => [201]`。截图 `auth-registration-001-first-welcome.png` 目视确认欢迎标题与正文（显示的身份为 Run 前缀昵称 `luowang-01M3YG2E4SMCNHYMZHVJH76T94-regnick`）。
   - 审核说明：场景字面期望仅要求「显示欢迎信息」，已满足；计划 §6 额外要求核对「首次欢迎身份 = 本次输入昵称」，此项**不能从原始证据独立复核**——输入昵称与注册响应体 `displayName`（`operation-89`）在证据中均为 `[REDACTED]`，只能凭可见截图确认展示名是 Run 前缀昵称。此点不影响场景已 blocked 的判定，但作为记录缺口保留（见下「覆盖缺口」）。
2. **② `GET /api/auth/status` 返回已登录用户 — 符合。** `operation-93/94` 同会话导航 `/api/auth/status` 返回 `{"authenticated":true,"user":{id/email/createdAt 与注册响应一致}}`（`page-…14-33-56-143Z.yml`）。
3. **④ 删除后原凭据不能登录 — 符合。** `operation-99/100` 从欢迎页点击「删除测试账号」，显示「测试账号及其会话已删除。」并回登录态（截图 `auth-registration-001-deleted.png`）；`operation-101/103/104` 用原邮箱原密码登录 → 「邮箱或密码不正确」（截图 `auth-registration-001-deleted-creds-rejected.png`）。
4. **③ 数据库不保存明文密码 — 未验证（阻塞项）。** 证据中无任何持久层/存储观察记录：`request_test_http` 只返回脱敏响应、浏览器仅见页面，`execution.md` 记载只读存储观察工具返回「不可用，不能确认持久层结果」（该工具返回无 evidenceId，Reviewer 无法回读原始回执）。响应体不含明文不能证明服务端未存明文。该明列期望按场景原文与计划 §8 属通过条件，不能移入「限制」豁免，故本场景 **blocked**，已确认的成功项保留。

---

## 已确认产品问题

本 Run **未发现**可判定的产品缺陷（failed 项为 0）。

- 历史 open Issue #3（退出未撤销服务端 Session）之对应行为在本 target 上**未被观察到**：退出后携带退出前原 Cookie 重放 `/api/me` 得 401（`operation-55/56`）。
- 历史 open Issue #4（注册首次欢迎未保留输入昵称）之对应行为在本 target 上**未见复现**：首次欢迎页（不刷新）显示 Run 前缀昵称（`operation-87`、截图 `auth-registration-001-first-welcome.png`）。
- 以上仅为本次观察，**不表述为「已修复」或归因于任何提交**（`baseCommit = null`、无 diff）；且第 2 点受昵称脱敏限制，不能独立确认展示名与输入昵称逐字相等。

## 执行与记录问题（不影响产品结论）

1. **会话 Cookie 片段落盘（记录规范偏差，低影响）。** `execution.md` 在叙述步骤 4/5 时写出了会话 Cookie 的前缀片段（本报告不复述其值），与场景「Cookie 原文不落盘」的记录要求不一致。虽仅为局部片段、未影响判定，仍构成对会话令牌的部分暴露，建议后续同类记录只保留受控引用标识与结果。
2. **注册首次 Welcome 身份无法独立复核（证据缺口）。** 见上 AUTH-REGISTRATION-001 第 1 点：输入昵称与响应 `displayName` 均脱敏，Reviewer 只能从可见截图与 Run 前缀/邮箱一致性推断，不能逐字确认「欢迎昵称 = 输入昵称」。该缺口不改变 AUTH-LOGIN-001 的通过，也不改变 AUTH-REGISTRATION-001 的 blocked（后者已因存储期望阻塞）。
3. **预置账号前置未满足（环境缺口）。** 场景 AUTH-LOGIN-001 的前置「已存在一个非生产测试账户」未被实际使用，改用 Run 自建账号；判断依据部分依赖已脱敏的预置邮箱，Reviewer 不能完全独立确认，故保留为环境/验证能力缺口而非产品结论。
4. 控制台日志：6 个日志均为预期内的 `401` 资源加载错误（`/api/auth/login`、`/api/me`），与失败登录尝试及 401 重放一致，未见非预期前端错误。

## 覆盖缺口与未完成项

- 本轮仅执行 `## execution_scenarios` 列出的 `AUTH-LOGIN-001`、`AUTH-REGISTRATION-001`；其余 approved（`AUTH-ACCESS-001`、`AUTH-ACCOUNT-001`、`AUTH-LOGIN-002`、`AUTH-REGISTRATION-002/003`）与 draft（`AUTH-SECURITY-001/002`）未执行，结论不代表认证模块整体覆盖。计划 §1/§4 已声明此边界，审核认可，且非 core 场景的未执行不构成本次遗漏（请求限定为该批）。
- **AUTH-REGISTRATION-001「数据库不保存明文密码」**：需提供受控的数据库/存储只读检查能力后复测；在此之前该场景保持 blocked。
- 无 base commit / 无 diff：不作逐提交归因，不写「已修复」。
- 时序：证据文件名与 `at`/`startedAt` 均来自 Harness 记录时钟（如 `operation-2` 14:31:55、`operation-107` 14:34:11）；场景不要求精确时长，未跨来源拼接绝对事件时间。

## 数据收尾

本轮临时账号（`…-uiacct`、`…-uiacc`、`…-regacct`、`…-login`、`…-probe`、`…-watermark` 等，均带 `luowang-01M3YG2E4SMCNHYMZHVJH76T94-` 前缀或 Run 前缀 displayName）由 Runner 登记、`execution.md` 声明未自行核验清理完成。测试后数据清理由 Harness 在最终 Main 后处理，不属本次审核或测试结论的阻塞项；审核不声明清理已完成。

## 审核方法与独立性说明

- 先读 `plan.md`、冻结场景正文与存在的 patch（无），再逐条列读原始 command/MCP 记录（`operation-1…107`）与浏览器快照/日志，自行核对操作前后状态与响应，最后才打开 `execution.md` 对照，避免被 Runner 结论带偏。
- 图片经 `read_evidence_image` 逐一实际读取（13 张全部读取成功），并据画面实况描述；本报告对「passed/blocked」的判断均为 Reviewer 依据原始证据独立得出，未把 Runner 的完成声明当作证据；凡与 Runner 记录相符者如实说明其归属。
