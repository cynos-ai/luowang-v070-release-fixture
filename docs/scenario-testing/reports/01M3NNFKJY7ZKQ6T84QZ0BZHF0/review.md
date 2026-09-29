# Review：受控 blocked 验收（AUTH-ACCESS-001）

## 0. 审核范围与方法

- Run：`01M3NNFKJY7ZKQ6T84QZ0BZHF0`；trigger `manual`；`scenarioMode = review-all`；`targetCommit = 501db1bdd91a5337bb5994d2c704559a8d0740b9`；`initialization = false`；`scenarioChanges = null`；`blockingReasons = []`；`browserRequired = true`。
- 计划 `plan.md` 的 `## execution_scenarios` 仅一项：`AUTH-ACCESS-001`，顺序即执行顺序。动态上下文 `selectedScenarioSnapshot` 已提供该场景正文（`redacted:false`，`contentSha256 = 669984…`），与规划期实读回执 `ab1472cb-4206-4d82-be1f-de1d440b0c61`（`docs/scenario-testing/scenarios/AUTH-ACCESS-001.md`，full-file，1435/1435 字节，hash 一致）相符。
- 计划元数据 `planHash = 27408f73e3448762f623222814465221c24b7a73767841e6b83d45d29bda9108`，与 `query_source_reads(scope:"plan")` 返回一致；plan 引用校验成立。
- `scenario-changes.patch` **不存在**（工具返回“工件不存在”），与 `scenarioChanges = null`、计划第 4 节“不做任何场景维护”一致。本次无 patch，任何“已维护/已应用变更”的叙述均不适用；execution.md 亦未作此声明。
- 审核只读：本 Session 未执行命令、未访问测试账号、未读取任意路径。所有依据来自 `plan.md`、动态场景正文、`list_evidence_files` 列出的 9 个证据与 `execution.md`。
- 审核者观察口径：下面凡标“Reviewer 观察”者，均由本人实际读取原始证据（`read_command_evidence` / `read_evidence_image`）形成；标“Runner 陈述”者为 execution.md 的原文主张，未必有本 Run 证据支持，已分别标注。

## 1. 逐场景结果

### AUTH-ACCESS-001 — 未登录访客无法访问受保护资料：**blocked**

场景三个适用期望（均为通过条件，不因“主流程”而豁免）：

1. 页面显示登录表单，未展示任何用户资料；
2. `GET /api/auth/status` 返回 `authenticated:false`、`user:null`；
3. `GET /api/me` 被拒绝（4xx），未返回用户资料。

依据与观察：

- 步骤 1（未登录打开用户中心）：Reviewer 观察 —— `operation-3.json`（sequence 3，`playwright-mcp-tool-result` / `browser_navigate`，`startedAt 2026-09-29T04:07:20.876Z`）`isError: true`；`operation-4.json`（sequence 4，`browser_navigate`，`04:07:22.078Z`）`isError: true`。两条回执 `arguments: {}`、`output` 被省略，**无法从回执本身确认各自导航的目标 URL**；但结合下一步快照可确认到达的是错误页。
- 页面呈现：Reviewer 观察 —— `operation-5.json`（sequence 6，`browser_snapshot`，`04:07:23.776Z`，`isError:false`）返回的脱敏快照正文为 heading “This site can’t be reached”、`172.17.0.3 refused to connect.`、`ERR_CONNECTION_REFUSED`，以及 “Reload/Details” 按钮。**未见任何登录表单或用户资料控件**。截图 `auth-access-001-connection-refused.png`（`operation-6.json`，sequence 7）经我用 `read_evidence_image` 实际读取，画面为 Chrome 错误页 “This site can’t be reached / 172.17.0.3 refused to connect. / ERR_CONNECTION_REFUSED”，与快照一致。期望 1 中“显示登录表单”部分**未获得实际观察**；仅能观察到“未展示用户资料”这一半（在错误页上）。
- 步骤 3/4（两个接口）：Reviewer 观察 —— 本 Run 9 个证据中，没有任何一条记录 `GET /api/auth/status` 或 `GET /api/me` 的响应状态或正文。导航类回执（`operation-3/4`）输出被省略，不能作为接口响应证据。因此期望 2、3 **完全未验证**。
- 依赖可达性：Reviewer 观察 —— 浏览器导航报错并停在 `ERR_CONNECTION_REFUSED`（主机 `172.17.0.3` 拒绝连接），说明被测应用在本次执行时未在该地址监听；这与计划所载“非生产测试环境已暂时停止”的运营前提一致（该前提为操作者声明，非本 Run 工具验证）。
- 辅助命令：Reviewer 观察 —— `command-1.json`（sequence 5，字段标注 `scenarioId: AUTH-ACCESS-001`，`startedAt/finishedAt` 同为 `04:07:23.777Z`）内容是 `curl … http://172.17.0.3:3100/`，结果为 `COMMAND_NOT_ALLOWED: 不允许运行命令：curl`。该拒绝**不构成可达性观察**，Runner 在 execution.md 中也如此定性，Reviewer 同意。

判定：三个适用期望均无充分实际观察支持 → 场景 **blocked**（非 failed，也非 passed）。依赖不可达属外部环境状态，不是产品缺陷，也未发现任何产品行为 Bug。

## 2. 与 execution.md 的对照

- Runner 结论为 `blocked`，与 Reviewer 独立判断一致；Runner 明确区分“环境不可达≠产品 failed”，未用工具失败替代产品拒绝结论，符合计划判定口径。
- 场景进度顺序：Reviewer 观察 —— `operation-1.json`（`begin_scenario_execution`, 04:07:17.096Z）→ `operation-2.json`（`start_scenario`, AUTH-ACCESS-001, 04:07:17.975Z）→ … → `operation-7.json`（`finish_scenario`, 04:07:26.278Z, `completed:["AUTH-ACCESS-001"]`）。声明与 evidence 顺序一致，未见跨场景操作或事后补报特征。最后 `completed` 记录仅表示进度登记完成，不代表期望通过。
- execution.md 的步骤表格把“页面呈现/截图”排在“步骤 3 读取 `/api/auth/status`”之前，但按回执 sequence 实际是两次 `browser_navigate`（seq 3、4）先发生，`browser_snapshot`（seq 6）、截图（seq 7）在后，`curl`（seq 5）夹在中间。这属叙述排序与时间线的表述不一致，不改变“连接被拒绝、无应用层响应”的实质结论，记录备查。

## 3. 已确认产品问题

- **无**。本 Run 未获得任何应用层响应，无法判定任何规格行为被违反，也没有任何证据支持产品缺陷。

## 4. 覆盖缺口与无法确认的事项

1. **Runner 声称的两次受控 HTTP 尝试在本 Run 证据中缺失。** execution.md 第 2 节称步骤 3、4 除浏览器导航外还调用了受控 `request_test_http`（`/api/auth/status`、`/api/me`）并失败。Reviewer 观察 —— `list_evidence_files` 的 9 个文件中没有对应命令回执，`read_command_evidence` 逐条读取的 `operation-1..7` + `command-1` 中也没有任何 `request_test_http` 记录。该主张无本 Run 原始记录支持，不能作为“接口侧已尝试”的证据。影响：不影响本场景 blocked 结论（浏览器侧已独立证明连接被拒绝），但 execution.md 中相应叙述应视为**未获证据支持的主张**，下游不应据此声称接口已探过。
2. **导航目标 URL 不可核验。** 两条 `browser_navigate` 回执的 `arguments` 为空、`output` 被省略，无法确认其中一条确实是 `/api/auth/status`；快照只能证明主机 `172.17.0.3` 拒绝连接，不能区分路径。
3. **环境不可达的前提来自操作者声明。** 本 Run 观察到的是“该地址拒绝连接”；“环境已被暂时停止”本身无本 Run 工具证据，属运营前提。不可达≠产品缺陷的定性不受影响。
4. **Runner 关于“场景正文实读”“`get_test_environment` 返回 `http://172.17.0.3:3100`”等陈述**在 `query_source_reads(stage:"runner-execution")` 中无回执（该阶段 receipts 为空），无本 Run 来源可核。场景正文的可用性已由 `main-planning` 回执与动态快照独立覆盖，故不影响审核判断；环境地址仅作为运营信息，未被我用于任何功能结论。
5. **未测试范围。** 本 Run 仅 `AUTH-ACCESS-001`；`AUTH-REGISTRATION-001/002/003`、`AUTH-LOGIN-001/002`、`AUTH-ACCOUNT-001`、`AUTH-SECURITY-001/002` 不在执行范围，本次结论不代表认证模块整体覆盖。计划第 7 节所列历史 Run（`01M3NM8QR81GNAV2YW2HF2T6H4`，target `a977ef3c…`）的 passed 结论属历史、环境不同，不能替代本 Run 观察。
6. **测试数据清理**：无证据显示本 Run 调用过写端点或创建数据，execution.md 亦声明未登记清理项。此项按计划属 Harness 最终收尾范畴，不构成本次审核的阻塞或结论变更。

## 5. 审核结论

- 依 `## execution_scenarios` 唯一场景：`AUTH-ACCESS-001` = **blocked**。三个适用期望（登录表单呈现、`/api/auth/status` 未登录、`/api/me` 4xx 拒绝）均因被测环境不可达而无法获得实际观察；已获得的观察仅为浏览器错误页（`ERR_CONNECTION_REFUSED`）。
- 整体：**blocked**（唯一场景未闭合），无已确认产品 Bug，无场景维护声明需要核销（本次无 patch），不推进 target、不归因到具体提交。
- 供最终 Main 使用的最小复现条件：target `501db1bdd91a5337bb5994d2c704559a8d0740b9`，在 `http://172.17.0.3:3100` 无监听时访问 `/`、`/api/auth/status`、`/api/me` 均以连接被拒绝结束；环境恢复监听后重跑本场景以闭合验证。
- 证据引用（本 Run 稳定文件名）：`operation-3.json`、`operation-4.json`、`operation-5.json`、`operation-6.json`、`auth-access-001-connection-refused.png`（sha256 `c43bfce56a3057c8906a9df8fb53c3e3eb71c444095c7a0fbe41fdf17e2d5af9`）、`command-1.json`、`operation-1.json`、`operation-2.json`、`operation-7.json`。
