# 审核报告：受控缺陷恢复后 AUTH-LOGIN-001 重测

- Run：`01M3NPXC9XV8C16MR3SEHD8VEQ`（`trigger = manual`，`scenarioMode = review-all`，`initialization = false`，`scenarioChanges = null`）
- target：`ada2734792184525eb967629ad7958939bc87df3`；base：`d0e3542de268e5552fa15bbd23c58fa9876353bd`
- 执行集合（plan `## execution_scenarios` 唯一来源）：`AUTH-LOGIN-001`（approved）
- `browserRequired = true`，`blockingReasons = []`；无 `scenario-changes.patch`（与 `scenarioChanges = null` 一致）
- 计划引用校验：`read_run_artifact(plan.md)` 头部 Harness 元数据 `planHash = aa7a759208c0f07aca3aadba7924d10688636c466fe4f1d60c6d2b708d0111ca`，与 `query_source_reads(scope="plan")` 返回值一致；来源引用范围与计划叙述相符。

## 审核方法

- 先读 `plan.md` 与动态上下文冻结的 `selectedScenarioSnapshot`（`AUTH-LOGIN-001` 正文未被 redact，全文可读），确认执行集合与适用期望，再按 `list_evidence_files` 独立打开原始证据（`read_command_evidence` 读 operation/command 捕获，`read_evidence_image` 读 5 张截图，`read_browser_evidence` 读页面快照与控制台日志），形成判断后才读 `execution.md` 对照。
- 本报告中的「观察」均为 Reviewer 依据上述原始证据形成；Runner 的结论另行转述并标明。
- operation 文件编号与其内部 `sequence` 字段相差 1（`operation-1.json` 的 `sequence = 1` 为辅助探测，`operation-2.json` 起为场景进度/操作）。经逐条比对，`execution.md` 正文引用的 `operation-N` 与文件 `operation-N.json` 一一对应，引用可核对。

## 场景结果

### AUTH-LOGIN-001 登录状态恢复 — **passed**

场景 4 条适用期望均有充分实际观察支持，未发现失败项。

| # | 期望 | 判定 | 依据（原始证据） |
| --- | --- | --- | --- |
| 1 | 刷新后显示同一用户 | passed | `operation-14`（导航同 URL 重载 `/`）→ `operation-15` 快照仍为同一用户（昵称首字母 `L`、邮箱 `luowang-01m3npxc9xv8c16mr3sehd8veq-runner@example.test`）；截图 `auth-login-001-02-refresh-same-user.png` 与登录态截图 `auth-login-001-01-registered-logged-in.png` 画面一致 |
| 2 | 退出后页面回到登录状态 | passed | `operation-17` 点击「退出登录」→ `operation-18` 快照回到登录表单并显示「已安全退出。」；截图 `auth-login-001-03-logged-out.png` 目视确认同一文案与登录表单 |
| 3 | 退出后的 Session 访问受保护接口返回 401 | passed | 见下方「期望 3 证据链」 |
| 4 | 删除测试账号后旧 Session 和原凭据均不可用 | passed | 见下方「期望 4 证据链」 |

**期望 3 证据链（退出前固化 → 退出 → 携带原 Cookie 重放）**

1. 退出前 `operation-12`/`operation-13`（`browser_cookie_list` / `browser_cookie_get`）记录 `cynos_session` 为 `observed-browser` 引用 `credential-22dc0c90e48edf47d9a9fe2f1c8415d3`，属性 `httpOnly: true, secure: false, sameSite: Strict, path: /`。
2. 退出（`operation-17`）后 `operation-19`（`browser_cookie_list`）无任何 `credentialReferences`，即浏览器端 Cookie 已被清理（客户端量）。
3. `operation-21`（`browser_cookie_set`）以 `restore-input` 引用 `credential-22dc…` 将退出前的原值写回浏览器；`operation-22`（`browser_cookie_get`）仍为 `observed-browser` 引用 `credential-22dc…`（同 Run 内值相同）。
4. `operation-23` 导航 `GET /api/me` → `operation-24` 网络列表 `#1 [GET] /api/me => [401]`；`operation-25` 请求详情显示 `cookie: [REDACTED]`，其 `credentialReferences` 为 `observed-request-header` 引用 **同一** `credential-22dc…`；`operation-26` 响应体 `{"error":{"code":"UNAUTHORIZED","message":"请先登录",…}}`；对应控制台 `console-2026-09-29T04-33-26-147Z.log` 记录 `/api/me` 401。

关键点：这里不是「无 Cookie 的未认证请求返回 401」，而是**退出前的同一 Cookie 值被实际请求头携带后仍返回 401**（`observed-request-header` 与退出前 `observed-browser` 指向同一凭据引用）。因此可区分「服务端按 token 摘要撤销 Session」与「仅客户端丢弃 Cookie」，满足场景步骤 5 与期望 3 的方法要求。

**期望 4 证据链（删除账号 → 旧 Session / 原凭据）**

- 重新登录：`operation-29`/`operation-30` 用原邮箱+原密码成功登录 → `operation-31` 快照回到已登录态；`operation-32`（`browser_cookie_get`）得到**新**会话引用 `credential-ab1be09fefcf39c3f3b2a4c126e3d051`（与退出前 `credential-22dc…` 不同），说明确为重新登录的新 Session（场景步骤 6 前置正常发生，无前次 Run 的「未重新登录即删除」偏差）。
- 删除：`operation-33` 点击「删除测试账号」→ `operation-34` 快照显示「测试账号及其会话已删除。」并回到登录表单；截图 `auth-login-001-04-account-deleted.png` 目视确认该提示与预填邮箱。
- 旧 Session：删除后 `operation-36` 无 Cookie；`operation-37` 以 `restore-input` 引用 `credential-ab1be…` 写回删除前会话值 → `operation-38` 导航 `/api/me` → `operation-39` 网络 `#1 [GET] /api/me => [401]`；`operation-40` 请求详情 `cookie: [REDACTED]` 的 `observed-request-header` 引用同一 `credential-ab1be…`；控制台 `console-2026-09-29T04-33-44-483Z.log` 记 401。
- 原凭据：`operation-43`/`operation-44` 用**原邮箱+原密码**提交 → `operation-45` 快照出现 `role="alert"`「邮箱或密码不正确」；`operation-46` 网络 `#5 [POST] /api/auth/login => [401]`；`operation-47` 请求详情确认该 401 来自登录接口；截图 `auth-login-001-05-original-credentials-rejected.png` 目视确认告警与已填邮箱/密码。控制台 `console-2026-09-29T04-33-47-553Z.log` 记 `/api/auth/login` 401。

删除后旧 Session 与原凭据两条分别取证，均支持期望 4。计划 §8 曾指出「删除后旧 Session 服务端失效」可能存在直接证据缺口，本 Run 已用「删除前会话 Cookie 重放 → 401」闭合该缺口。

**需要记录项核对**：登录/刷新后用户资料（截图 01/02 + 快照）、退出后 HTTP 状态（`/api/me` 401）、Cookie `HttpOnly`/`SameSite`（`operation-12`/`operation-13`：`true`/`Strict`；`secure=false` 属 http 非生产环境正常）、退出前固化 Cookie 的重放结果与「请求确携带原 Cookie」的受控记录（`operation-21`/`operation-25`）、删除后提示与旧 Session、原凭据结果（截图 04/05 + `operation-39`/`operation-46`）均已具备。所有凭据值在记录中均为 `[REDACTED]`，未见 Cookie 或口令原文落盘。

## 与 execution.md 的对照

- Runner 主张 `AUTH-LOGIN-001 = passed`，4 条期望均通过。Reviewer 依据原始证据独立复核后**同意**该结论。
- Runner 报告的事实性引用（`operation-N` 编号、截图文件名、401 状态、Cookie 属性）经逐条核对与原始证据一致；未发现夸大、遗漏或错位陈述。
- Runner 标注的范围限制（仅执行 `AUTH-LOGIN-001`，不代表认证模块整体覆盖；未判断 Issue #4）与计划一致。

## 已确认产品问题

- 无。本次为缺陷修复后重测，4 条适用期望均通过，未发现期望与实际行为冲突；退出后服务端撤销 Session（历史 Issue #3 对应行为）在本 Run 表现为已修复。仅记录**本轮实际观察**，不据此推断历史状态。

## 覆盖缺口与未闭合项（均不影响本场景结论）

1. 退出登录接口自身（`POST /api/auth/logout`）的 HTTP 状态未被单独捕获；「退出后 HTTP 状态」由页面「已安全退出。」文案与后续 `/api/me` 401 间接支持。属记录完整性的小缺口，不影响期望 2/3 已由可用证据支持。
2. 计划 §5 曾建议优先用受控 `request_test_http` 显式携带原 Cookie；实际执行改用受控 `browser_cookie_set`（写回退出前原值）+ `browser_navigate`，并以 `observed-request-header` 记录实际请求头携带该值。操作方式与计划建议不同但等价且可核对，期望 3 的契约未被降低。
3. 计划 §8 提出的「数据库用户/Session 行」直接观察未进行（Runner 亦如实声明）；期望 4 以受控请求（旧 Cookie 401、原凭据 401）作为可观察证据，属同类可用证据，不改变结论。
4. 范围限制：`AUTH-REGISTRATION-001` 及其余 approved/draft 场景本轮未执行，**本 Run 结论不代表认证模块整体覆盖完整**，亦未对注册昵称缺陷（Issue #4）是否修复下结论。
5. 测试数据收尾：场景步骤 6 已通过业务接口删除账号；清理 claim 已登记，账号最终清理由 Harness 在最终 Main 后独立核验，其失败与否不改变本场景功能结论。

## 结论

- `AUTH-LOGIN-001`（approved）：**passed**——4 条适用期望均有充分实际观察支持，含退出后携带原 Cookie 重放返回 401 的服务端撤销证据，以及删除账号后旧 Session 与原凭据均不可用的证据。
- 整体：本次选定场景无 blocked / failed；无已确认产品 Bug。覆盖缺口与范围限制如上，供最终 Main 保留来源与限定结论边界。
