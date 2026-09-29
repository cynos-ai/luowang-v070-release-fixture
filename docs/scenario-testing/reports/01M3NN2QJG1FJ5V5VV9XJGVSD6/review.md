# Review：聚焦验收 AUTH-LOGIN-002 → AUTH-REGISTRATION-002 → AUTH-LOGIN-001

- Run ID：`01M3NN2QJG1FJ5V5VV9XJGVSD6`；target：`7bb8b1b9f63be01414198703e715b005b7964d00`（baseCommit=null、includedCommits=[]）
- 场景模式 `review-all`；`browserRequired=true`；`initialization=false`；`scenarioChanges=null`
- 正式执行集合（plan.md 唯一 `## execution_scenarios`，顺序即执行顺序）：AUTH-LOGIN-002 → AUTH-REGISTRATION-002 → AUTH-LOGIN-001。与 execution.md 声明及 scenario-progress 实际顺序一致。
- 审核仅使用本次受控工件（plan.md、selectedScenarioSnapshot、本 Run command/浏览器证据），未执行命令、未读取账号或任意路径、未自行补测。
- **总体结论：3 个场景全部 passed，0 failed，0 blocked；未发现已确认产品 Bug。**（结论仅对 target 整体成立，因无 base commit/变化清单，不能归因到具体改动。）

## 0. 依据与来源核对

- `scope:"plan"` 返回 `planHash=b6da0e4e11258f83ba7db84e8c1de18300409c5b50bdaa26198a8ec99218248f`，与 plan.md 元数据 `planHash` 一致。
- 规划期读取回执中，三个场景文件的 `contentHash`（AUTH-LOGIN-002=`12b1ac99…`、AUTH-REGISTRATION-002=`07dbb957…`、AUTH-LOGIN-001=`02a6ec45…`）与 `selectedScenarioSnapshot` 冻结正文的 `sourceSha256` 完全一致，均为 `full-file` 未脱敏；正文未被 redacted，可作为期望判定依据。
- `scenario-changes.patch` 不存在（Run 工件不存在），与 `scenarioChanges=null`、计划“不修改/不新增场景”一致；本次无场景维护动作，因此也无“维护已应用”之声明需要核对。
- execution.md 与 plan.md 的 execution_scenarios 顺序、账户前缀（`luowang-01M3NN2QJG1FJ5V5VV9XJGVSD6-`）、清理口径一致。
- `browserRequired` 为真实执行：证据中出现大量 `playwright-mcp-tool-result`（browser_navigate/snapshot/fill_form/click/cookie_get/cookie_set/network_request 等），并有页面快照与截图；非仅读取既有浏览器格式材料。浏览器执行与声明相符。

## 1. AUTH-LOGIN-002 登录拒绝与统一凭据错误 — **passed**（Reviewer 独立判断）

**适用期望与证据比对（均为我方依据原始证据的判断）**

1. 注册测试邮箱 A 并退出：`POST /api/auth/register => 201`（operation-52），Welcome 页显示本 Run 前缀 `…-l002@example.test`（operation-14，截图 `AUTH-LOGIN-002-registered-welcome.png`）；随后退出，快照显示“已安全退出。”并回到注册/登录表单（operation-17）。前置成立。
2. 错误密码登录：页面 `alert`“邮箱或密码不正确”（operation-26，截图 `AUTH-LOGIN-002-wrong-password-error.png`），`POST /api/auth/login => 401`（operation-28），响应体 `{"code":"INVALID_CREDENTIALS","message":"邮箱或密码不正确"}`（operation-30）。
3. 不存在邮箱登录：同表单提交（operation-34），页面同样 `alert`“邮箱或密码不正确”（operation-35，截图 `AUTH-LOGIN-002-nonexistent-email-error.png`），`POST /api/auth/login => 401`（operation-36，请求 #8），响应体同为 `INVALID_CREDENTIALS`/“邮箱或密码不正确”（operation-38）。两次状态码与 code/message 完全一致，未区分邮箱是否存在。
4. 失败后会话状态：`GET /api/auth/status => 200 {"authenticated":false,"user":null}`（browser operation-40/41；另受控 HTTP 复核 operation-42，无 Cookie）。

- 结论：**passed**。三项适用期望（4xx 明确拒绝、错误信息一致、失败后未建立 Session）均有充分实际观察支持；未发现产品缺陷。
- 覆盖说明：不存在邮箱未被 UI 原生校验拦截，直接走页面路径提交（operation-34/35），故未改用受控 HTTP 替代，符合场景步骤③的可选分支。
- 我核对图片：两张失败截图均显示同一提示文案“邮箱或密码不正确”，与快照文本一致。

## 2. AUTH-REGISTRATION-002 注册拒绝：重复邮箱 — **passed**（Reviewer 独立判断）

1. 首次注册：`POST /api/auth/register => 201`（operation-52，属本场景前置步骤①），Welcome 显示 `…-reg002@example.test`（operation-51，截图 `AUTH-REGISTRATION-002-first-register-welcome.png`）。
2. 退出并确认未登录：点击“退出登录”，快照显示“已安全退出。”回未登录表单（operation-55）。
3. 重复注册：退出后口令字段被清空，首次点击被原生 required 校验拦截、未发请求（operation-56/57，无 register 请求），补填同一口令后提交（operation-58/59）；页面 `alert`“该邮箱已经注册”且仍在注册表单、未进入 Welcome（operation-60，截图 `AUTH-REGISTRATION-002-duplicate-email-error.png`）；`POST /api/auth/register => 409 Conflict`（operation-61），响应体 `{"code":"EMAIL_ALREADY_REGISTERED","message":"该邮箱已经注册"}`（operation-63）。
4. 拒绝后会话状态：`GET /api/auth/status => 200 {"authenticated":false,"user":null}`（operation-65/66）。

- 结论：**passed**。重复邮箱被明确拒绝（409，属 4xx）、页面显示失败提示且不进入 Welcome、拒绝后未登录/未新建账号或 Session，均有充分证据。
- 偏差如实记录：退出后口令字段清空导致需重新输入同一口令，属 UI 原生行为，不改变“以同一邮箱 A 重复提交注册”的验证对象；不构成阻塞。

## 3. AUTH-LOGIN-001 登录状态恢复 — **passed**（Reviewer 独立判断；本轮最高风险点）

1. 登录：填入本 Run 前缀账号 A `…-reg002@example.test`（operation-70，credential 引用与场景 2 邮箱一致）+ 正确口令，提交（operation-72）进入 Welcome（operation-73，截图 `AUTH-LOGIN-001-logged-in-welcome.png`）。
2. 刷新后同一用户：重新导航 `http://172.17.0.3:3100/`（operation-77），页面仍显示 Welcome 且同一邮箱/昵称（operation-78）。截图 `AUTH-LOGIN-001-refreshed-same-user.png` 与登录态截图为同一 sha256（`6b621fe8…`），可佐证为同一渲染。
3. Cookie 属性记录：`cynos_session`，`domain=172.17.0.3`、`path=/`、`httpOnly: true`、`secure: false`、`sameSite: Strict`（operation-75/76）。
4. 退出前固化原 Cookie → 退出 → 重放：
   - 退出前读取原 `cynos_session`（operation-80，`observed-browser`）。
   - 点击退出（operation-81），快照“已安全退出。”回登录态（operation-82，截图 `AUTH-LOGIN-001-logged-out-state.png`），`POST /api/auth/logout => 200`（operation-83）。
   - 退出后 Cookie 列表为空（operation-85）——客户端已丢弃 Cookie。
   - 用 `cookie_set` 写回退出前固化的原值（operation-86，`restore-input`），写回后列表可见该 Cookie（operation-87，`observed-browser`）；随后导航 `/api/me`，`GET /api/me => 401`（operation-88 导航、operation-89 请求列表），响应体 `{"code":"UNAUTHORIZED","message":"请先登录"}`（operation-91，截图 `AUTH-LOGIN-001-replayed-cookie-me-401.png`）。
   - **携带原 Cookie 的受控记录**：`browser_network_request` 请求头含 `cookie: [REDACTED]` 且其 `observed-request-header` 引用（`credential-2d8beb38…`）与退出前 `observed-browser` 及 `restore-input` 引用**完全相同**（operation-90）。即请求头确实携带退出前固化的同一 `cynos_session` 值，区别于“客户端无 Cookie 的普通未认证 401”。判定口径满足计划第 5 节。
5. 删除账号并用原凭据登录：原凭据重新登录成功（operation-95/96/97），点击“删除测试账号”提示“测试账号及其会话已删除。”回登录态（operation-99，截图 `AUTH-LOGIN-001-account-deleted.png`），`DELETE /api/me => 200`（operation-100）；再用原邮箱+原口令登录被拒：`alert`“邮箱或密码不正确”（operation-108，截图 `AUTH-LOGIN-001-deleted-account-login-rejected.png`），`POST /api/auth/login => 401`（operation-109，请求 #7），响应体 `INVALID_CREDENTIALS`（operation-111）。

- 结论：**passed**。四条适用期望（刷新同一用户、退出回登录态、退出后原 Session 访问 `/api/me`=401 且有携带原 Cookie 的请求头证据、删除后旧 Session 与原凭据不可用）均有实际观察支持；Cookie `HttpOnly`/`SameSite=Strict` 已记录。未发现产品缺陷。
- 残余覆盖说明（不影响本场景通过判定，但如实保留）：
  - “删除测试账号后旧 Session 不可用”一项，证据为删除后页面回到登录态 + 应用提示“测试账号及其会话已删除。”+ `DELETE /api/me=200`，**未**在删除后再用该（重登录）会话单独请求 `/api/me` 做隔离观察；原凭据不可用则由 401 直接确认。会话被服务端撤销的最强证据来自步骤④/⑤的退出后原 Cookie 重放 401。
  - execution.md 在步骤 4 后写“佐证：重新加载首页 GET /api/auth/status 结果为未登录（快照 operation-94）”，但该处捕获的是页面快照（回登录表单），**未见**当时 `/api/auth/status` 的响应体；此处“结果为未登录”是由页面渲染得出的推断，非直接捕获的接口响应。该佐证非必需，主证据（operation-89/90/91）不受影响。
  - execution.md 将 `GET /api/me => 401` 标注为 operation-88，实为 operation-89 的请求列表返回 401（operation-88 是导航）；属编号归属的小偏差，不影响结论。

## 4. 已确认产品问题

- 本次未发现任何已确认产品 Bug（无 failed、无期望被违反的实际观察）。所有告警（401/409）均为被测拒绝路径的预期响应，控制台错误日志与之一致（console-2026-09-29T04-00-47-134Z/04-01-35-238Z/04-02-34-938Z/04-02-40-331Z.log）。

## 5. 覆盖缺口与无法确认事项

- **范围外未执行**：AUTH-ACCESS-001、AUTH-REGISTRATION-001、AUTH-ACCOUNT-001 及全部 draft 场景未在本 Run 执行，其通过性/缺陷状态不得由本轮推断；本 Run 结论不代表认证模块整体覆盖完整。
- **清理未闭环（非本审核阻塞项）**：execution.md §6 声明已为 `…-l002`、`…-reg002` 登记清理 claim（`cleanupScope="website-accounts"`），但本 Run 可读证据中**未捕获** `register_test_data`/清理登记的原始记录，该声明无法由现有证据独立核实；Harness 收尾清理与“核验不存在”尚未执行（execution.md 亦如实说明未声明清理完成）。按协议，测试后数据清理由 Harness 在最终 Main 后处理，不属本次审核阻塞；但场景“需要记录”的“测试账号删除与清理核验”在 Run 内未完成，记录缺口保留。
- **时间基准**：证据时间戳来自 Harness 捕获（如 operation.startedAt/finishedAt、console 日志相对毫秒），各来源是否共用同一时钟基准无法由本审核确认，本报告不据此给出跨来源的精确事件时间结论。
- **无归因依据**：无 base commit/变化清单/included commits，结论只能对 target 整体验收，不能表述为某缺陷“已修复”或归因到具体提交。
- **人工复核**：本流程 Agent 为模型；模型看图/审核不等于人工复核，本 Run 无人工复核记录，不声称人工已确认。

## 6. 证据引用（稳定标识）

- 场景进度/顺序：operation-3（begin）、4/43/44/67/68/112（start/finish_scenario），顺序为 AUTH-LOGIN-002 → AUTH-REGISTRATION-002 → AUTH-LOGIN-001，无越序。
- AUTH-LOGIN-002：operation-14、26、28、30、35、36、38、41、42；截图 `AUTH-LOGIN-002-registered-welcome.png`、`AUTH-LOGIN-002-wrong-password-error.png`、`AUTH-LOGIN-002-nonexistent-email-error.png`。
- AUTH-REGISTRATION-002：operation-51、52、55、57、60、61、63、66；截图 `AUTH-REGISTRATION-002-first-register-welcome.png`、`AUTH-REGISTRATION-002-duplicate-email-error.png`。
- AUTH-LOGIN-001：operation-73、75、76、78、80、82、83、85、86、87、89、90、91、97、99、100、108、109、111；截图 `AUTH-LOGIN-001-logged-in-welcome.png`、`AUTH-LOGIN-001-refreshed-same-user.png`、`AUTH-LOGIN-001-logged-out-state.png`、`AUTH-LOGIN-001-replayed-cookie-me-401.png`、`AUTH-LOGIN-001-account-deleted.png`、`AUTH-LOGIN-001-deleted-account-login-rejected.png`。
- 控制台日志：`console-2026-09-29T04-00-47-134Z.log`（两次 login 401）、`console-2026-09-29T04-01-35-238Z.log`（register 409）、`console-2026-09-29T04-02-34-938Z.log`（/api/me 401）、`console-2026-09-29T04-02-40-331Z.log`（删除后 login 401）。
- 脱敏：全部操作记录中表单值/口令均为 `[REDACTED]`，Cookie 以引用标识表示、原文未落盘；本报告未复述任何口令或真实凭据值。截图中的本 Run 前缀测试邮箱为测试标识，非真实受控凭据。

## 7. 结论

- AUTH-LOGIN-002：**passed**；AUTH-REGISTRATION-002：**passed**；AUTH-LOGIN-001：**passed**。
- 已确认产品 Bug：无。
- 阻塞：无。剩余项为范围外未执行场景、Harness 收尾清理未闭环、以及 AUTH-LOGIN-001“删除后旧 Session 隔离观察”的记录缺口，均已如实说明，不影响上述已成立的产品结果。
- 同意 execution.md 对三个场景 passed 的总结；本报告已就其中两处表述精度（operation 编号归属、`/api/auth/status` 佐证来源）作出修正说明，供最终 Main 保留来源时采用。
