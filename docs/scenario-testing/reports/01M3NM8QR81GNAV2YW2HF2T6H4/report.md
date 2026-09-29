---
run_id: 01M3NM8QR81GNAV2YW2HF2T6H4
trigger: manual
base_commit: null
target_commit: a977ef3cb95e06c43ac59c073f81948034f47948
included_commits: []
result: blocked
started_at: 2026-09-29T03:45:29.903Z
finished_at: 2026-09-29T03:56:43.108Z
scenario_results:
  - id: AUTH-ACCESS-001
    result: passed
  - id: AUTH-REGISTRATION-001
    result: blocked
  - id: AUTH-LOGIN-002
    result: passed
  - id: AUTH-REGISTRATION-002
    result: passed
  - id: AUTH-LOGIN-001
    result: passed
  - id: AUTH-ACCOUNT-001
    result: blocked
confirmed_bugs: []
---

# 测试报告：人工审核后的 scenario-testing HEAD 重测（核心认证场景）

## 1. 范围与固定版本

- 请求要点：对人工审核后的当前 scenario-testing HEAD 重测，严格按已批准的核心认证场景执行（注册成功、退出与登录、退出后原 Session Cookie 重放被 401 拒绝、错误凭据统一拒绝、未登录访问控制、重复注册、删除测试账号），必须用真实浏览器完成 UI 操作并采集可审查截图，不执行 draft 场景，不修改场景文件。
- 固定版本：`target = a977ef3cb95e06c43ac59c073f81948034f47948`；`base_commit = null`、`included_commits = []`，无变化清单。因此本轮结论只能对 target 整体验收，**不能归因到具体改动或提交**，也不能表述为某缺陷「已修复」。
- 场景资产：`scenario-changes.patch` 不存在（动态上下文 `scenarioChanges = null`，审核核对一致），与计划「本轮不新增/修改/废弃场景、不写 patch」相符。场景索引 `a34297b` 为 stale、与 target 不一致，本轮以 target 正文场景为准（依据：审核经 `query_source_reads` 核对 6 个场景正文 `sourceSha256` 与动态上下文 `selectedScenarioSnapshot` 一致，正文非 redacted）。
- 场景全文与版本的核对依据来自 `plan.md`（planHash `24673eb7bd35ef291fd3973908df8e6fe805bee2362b96f821abadc62796e7f4`）与 `review.md`；本报告不重做证据审核，也不重新决定期望适用性。

## 2. 逐场景结果

执行顺序与计划唯一 `## execution_scenarios` 一致，共 6 个场景；审核亦确认 `begin/start/finish_scenario` 顺序完全一致，且未执行任何 draft 场景、未改动 `docs/scenario-testing/scenarios/**`。

### AUTH-ACCESS-001 未登录访客无法访问受保护资料 — passed
审核自行读取原始记录后的观察：页面为登录表单、无任何用户资料（快照与截图 `access-001-logged-out.png`）；`GET /api/auth/status` 返回 `{"authenticated":false,"user":null}`；`GET /api/me` 被拒绝 401，未返回资料。三条适用期望均有实际观察支持。
留痕保留：审核指出该场景的接口观察落在 `start_scenario` 之前的 `scope: "auxiliary"`、`scenarioId: null` 记录中，属执行记录归属问题，不改产品结论。此为其对记录归属的说明，不改变 passed 判定。

### AUTH-REGISTRATION-001 新用户注册 — blocked
已确认成立（审核观察）：注册 `POST /api/auth/register` 201，响应体 `authenticated:true` 且含该用户；页面为 Welcome 并显示注册昵称与当前邮箱（截图 `reg-001-welcome.png`）；可从欢迎页删除，`DELETE /api/me` 200、`{"deleted":true,...}`，页面提示「测试账号及其会话已删除。」（截图 `reg-001-deleted.png`）；随后用原邮箱原口令登录被拒 401 `INVALID_CREDENTIALS`。
未确认的适用期望：场景明列的「数据库不保存明文密码」无任何实际观察支持。审核核对本 Run 的 5 条命令记录全部失败（`command-1.json` exit 127 `vitest: not found`；`command-2.json` 仅安装提示、exitCode null；`command-3/4/5.json` 配置解析失败或源码树只读 `EACCES`），并指出 Runner 自述的存储检查调用在受控记录中无回执、其无法独立复核。审核明确说明：响应体不含明文不能推断持久层行为。
判定：适用期望中一项未确认 → blocked，已确认的成功项保留。审核与 Runner 的 blocked 判定一致，计划已预先说明该口径。

### AUTH-LOGIN-002 登录拒绝与统一凭据错误 — passed
审核观察：错误密码提交得到 401，错误体 `INVALID_CREDENTIALS`／「邮箱或密码不正确」，页面 alert 同文案（截图 `login2-wrong-password.png`）；不存在邮箱未被 UI 原生校验拦截、真实发出请求亦得 401 与完全相同的错误体与文案（截图 `login2-nonexistent-email.png`）；两次状态码与错误体一致，未区分邮箱是否存在；失败后 `GET /api/auth/status` 为未登录、浏览器无 Cookie。场景内清理已执行（`DELETE /api/me` 200 与删除提示）。全部适用期望均有实际观察支持。

### AUTH-REGISTRATION-002 注册拒绝：重复邮箱 — passed
审核观察：重复注册 `POST /api/auth/register` 返回 409，错误体 `EMAIL_ALREADY_REGISTERED`／「该邮箱已经注册」；页面仍停留「创建账户」表单并显示该提示，未进入 Welcome（截图 `reg2-duplicate-rejected.png`）；拒绝后 `GET /api/auth/status` 为 `authenticated:false`、浏览器无 Cookie；场景内清理已执行。全部适用期望均有实际观察支持。

### AUTH-LOGIN-001 登录状态恢复 — passed（本轮最高风险点已闭合）
审核观察：
- 刷新后仍显示同一用户（重载后快照与 `GET /api/auth/status` 200、`authenticated:true` 且为同一用户；截图 `login1-refresh-same-user.png`）。
- 退出后回到登录状态（`POST /api/auth/logout` 200，页面「已安全退出。」+ 登录表单；截图 `login1-after-logout.png`）。
- **退出后原 Session Cookie 重放被 401 拒绝**：退出前固化 `cynos_session`（受控引用，`httpOnly=true`、`SameSite=Strict`）；退出后浏览器已无 Cookie；随后以 `cookie_set` 恢复同一受控引用，导航触发 `GET /api/me` 得到 **401**，请求详情中存在 `observed-request-header` 携带同名受控引用且请求头含 `cookie: [REDACTED]`，响应体为 `UNAUTHORIZED/请先登录`（截图 `login1-replay-original-cookie-401.png`，URL `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk04UVI4MUdOQVYyWVcySEYyVDZINC9sb2dpbjEtcmVwbGF5LW9yaWdpbmFsLWNvb2tpZS00MDEucG5n`；请求详情记录 `operation-121.json`，URL `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk04UVI4MUdOQVYyWVcySEYyVDZINC9vcGVyYXRpb24tMTIxLmpzb24`）。
  审核明确依计划判定口径认定：该 401 由明确携带退出前原 Cookie 的请求触发，区别于「客户端已无 Cookie 的普通未认证 401」，满足计划 §6 与历史 blocked 案例所要求的口径。
- 删除测试账号后旧 Session 与原凭据均不可用：重登后固化当前会话，删除成功并显示删除提示；用原邮箱原口令登录被拒 401 `INVALID_CREDENTIALS`；恢复删除前会话引用后 `GET /api/me` 为 401 且请求详情携带该引用（截图 `login1-deleted-old-session-401.png`，URL `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk04UVI4MUdOQVYyWVcySEYyVDZINC9sb2dpbjEtZGVsZXRlZC1vbGQtc2Vzc2lvbi00MDEucG5n`）。
- 记录项齐备：Cookie `httpOnly`/`SameSite=Strict` 属性、退出状态码、登录与刷新后的用户资料。
四条适用期望均有实际观察支持。
附带的、限定范围的产品层面观察（属审核结论，非缺陷确认）：历史 Run `01M27X2RS07BRA6CBAW1TSKCKY` 在旧 target `e980181` 记录的「退出未撤销服务端会话」在本 target 上**未复现**；因无 base commit 与变化清单，仅表述为「本 target 未复现」，不作「已修复」归因。

### AUTH-ACCOUNT-001 删除测试账号使账号与全部会话失效 — blocked
已确认成立（审核观察）：删除请求成功（`DELETE /api/me` 200、`{"deleted":true,...}`）且页面提示「测试账号及其会话已删除。」（截图 `acct1-deleted-notice.png`，URL `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk04UVI4MUdOQVYyWVcySEYyVDZINC9hY2N0MS1kZWxldGVkLW5vdGljZS5wbmc`）；原邮箱原密码登录被拒 401；一个独立客户端会话（`acct-sessionB`）删除后的 `GET /api/me` 为 401，且该请求 `cookieNames:["cynos_session"]`，即请求确实携带了会话 Cookie。
未确认／偏差（审核据此判 blocked，本报告原样保留其事实与限定）：
1. 「会话 1」的 Cookie 重放未真正执行：删除后 `acct-sessionA` 的 `GET /api/me` 虽为 401，但 `cookieNames: []`（该客户端 Cookie 已被删除响应的 `setCookieNames` 清除）。按计划 §6 判定口径，「未携带 Cookie 的普通未认证 401」不构成会话被撤销的证据，故场景明列「会话 1 与会话 2 的 Cookie 访问受保护接口均被拒绝」中会话 1 一侧未获验证。
2. 步骤对象被替换：场景要求「浏览器注册账号 A 形成会话 1 → 受控客户端登录同一账号形成会话 2 → 在浏览器会话 1 触发删除 → 删除后分别用两会话 Cookie 读 `/api/me`」。实际由受控客户端注册的独立 `…-probe` 账号并由 `acct-sessionA`（受控客户端）触发删除；浏览器注册的 `…-acct1` 只单独验证了 UI 删除提示，其会话 Cookie 删除后从未重放。因此「浏览器 UI 删除 → 使另一独立客户端会话失效」及「同一账号的浏览器会话 + 客户端会话」组合均未覆盖。
3. 浏览器改口令与受控客户端口令不一致导致 `acct1` 无法用受控客户端登录（两次 401，反向亦 401）。Runner 解释为「口令占位符两域不同值」；审核说明其只能确认现象（同账号跨手段登录 401），**不能独立确认成因**（请求体未落盘，无原始记录展示两次提交的口令差异），并标注为推断。
审核结论：核心契约（删除账号使账号与全部会话失效、旧凭据不可用）得到部分证实，但场景明列的两会话 Cookie 重放有一半未获支持、执行对象与触发方偏离场景步骤 → blocked，保留已确认成功项。
与 Runner 判定的差异：审核明确记录 Runner 判为 passed（含偏差），并说明其不一致之处在于 Runner 将「会话 1 的 401」计入通过，而该请求未携带 Cookie，依计划自身口径不足以支持该期望。本报告采用审核按原文期望得出的 blocked。

## 3. 已确认产品问题

**未发现**本 target 上已确认的产品行为违反。审核说明：各场景所有被实际观察到的适用期望均符合规格；失败路径（401/409）与统一错误文案均与规格一致；本轮无 confirmed Bug，因此无 Bug 关联候选查询，也没有 Issue create/link 决策可提交（`confirmed_bugs` 为空）。
不得由本轮结果推断未执行场景（`AUTH-REGISTRATION-003`、`AUTH-SECURITY-001/002`）通过；也不得将「本 target 未复现历史缺陷」等同于缺陷已修复。

## 4. 结果聚合与整体结论

- 逐场景：passed 4（AUTH-ACCESS-001、AUTH-LOGIN-002、AUTH-REGISTRATION-002、AUTH-LOGIN-001）；blocked 2（AUTH-REGISTRATION-001、AUTH-ACCOUNT-001）；failed 0。计数口径为场景数，未与发现数混计。
- 整体结果：**blocked**（按 `blocked > failed > passed` 聚合，两个场景的适用期望未闭合）。本次 `blockingReasons` 为空，整体 blocked 来自场景级未闭合，而非 Harness 环境阻塞。
- 本轮正面价值：最高风险项——退出/删除后原会话被服务端撤销——在本 target 上得到带请求头关联的可复核证据支持（AUTH-LOGIN-001）；错误凭据统一拒绝、重复注册拒绝、未登录访问控制均获实际观察支持。
- 无 failed，无确认产品缺陷；本轮通过结论不扩大为「整个项目没有问题」。

## 5. 依据、缺口与无法确认事项（保留审核来源与限定）

- 未决覆盖缺口：`AUTH-REGISTRATION-003`（approved 非 core）与 `AUTH-SECURITY-001/002`（draft）本轮不执行；无 base commit/included commits，结论不能归因到具体改动；场景索引 stale 未影响执行集合。
- 无法确认项（据审核）：① AUTH-REGISTRATION-001 的「数据库不保存明文密码」（命令证据全部失败；Runner 自述的存储检查不可用无回执可复核）；② AUTH-ACCOUNT-001 会话 1 的 Cookie 重放、浏览器会话与客户端会话的异构组合；③ 跨手段口令不一致的确切成因（仅有现象记录，成因属推断）。
- 附带记录项：Cookie `HttpOnly`/`SameSite=Strict` 与退出/删除精确状态码属「需要记录」项，本轮已有记录（`operation-107/129` 等），由审核核对。
- 证据清单与观察口径：审核称其实际读取了全部 11 张截图，并逐个读取原始命令与浏览器证据（`operation-*.json`、`command-*.json`、`page-*.yml`、`console-*.log`）；本报告未回读运行记录，所述执行事实均为「审核读取原始记录后的观察」，属审核交付内容。动态上下文本 Run 证据清单包含页面截图、命令记录、操作记录、页面快照与控制台日志等类别，其中部分页面截图的自动检查状态为 `detected`、部分为 `not_detected`；该自动检查只描述其声明范围，不代表本报告对内容作独立判定。
- 执行与审核主体：本流程 Agent 为模型；本 Run 无任何人工复核记录，模型审核不等于人工已确认。`browserRequired = true` 的真实浏览器操作相符性由审核核对（存在浏览器导航/填表/点击/快照/Cookie/网络记录与页面快照、控制台日志）。
- 脱敏与扫描结论限定：审核说明在 `command-*.json` 与 `operation-*.json` 中表单值均为 `[REDACTED]`/受控引用，HTTP 证据只含测试邮箱；该结论限于其已读到的本 Run 捕获内容，受控 Secret 零命中不等于不存在任何密码文本。本报告不复述测试账号字段或凭据值。
- 执行记录质量（不影响产品结论）：AUTH-ACCESS-001 接口观察落在 `start_scenario` 之前的 auxiliary 记录；`execution.md` 证据索引有个别标号不准（由审核直接核对原始记录纠正）。
- 清理：测试数据清理由 Harness 在本 Session 结束后统一处理，尚未完成，本报告不声称已清理；场景内删除的业务结果有其自身的运行证据支持，与 Harness 收尾清理分别表述。

## 6. 后续建议（不构成产品 Bug，也不修改场景资产）

- AUTH-ACCOUNT-001 建议在后续人工审核时明确「会话 1/会话 2」的记录口径，使两会话的 Cookie 重放与触发方在运行记录中可独立复核；该建议属场景／执行口径完善方向，不是本次确认的产品缺陷。
- `AUTH-SECURITY-002`（限流）与 `AUTH-SECURITY-001`（Origin 校验）建议在触发条件与来源构造手段确认后再考虑从 draft 提升；本轮未执行、未修改。
- 若需重新闭合本次两个 blocked 场景，需按计划口径补足相应受控观察手段（白盒存储核验、会话 1 原 Cookie 重放）；更换环境、账号或操作范围的方案须另行确认，不属当前授权。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk04UVI4MUdOQVYyWVcySEYyVDZINC9hY2Nlc3MtMDAxLWxvZ2dlZC1vdXQucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk04UVI4MUdOQVYyWVcySEYyVDZINC9hY2N0MS1kZWxldGVkLW5vdGljZS5wbmc>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk04UVI4MUdOQVYyWVcySEYyVDZINC9sb2dpbjEtYWZ0ZXItbG9nb3V0LnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 4](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk04UVI4MUdOQVYyWVcySEYyVDZINC9sb2dpbjEtZGVsZXRlZC1vbGQtc2Vzc2lvbi00MDEucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 5](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk04UVI4MUdOQVYyWVcySEYyVDZINC9sb2dpbjEtcmVmcmVzaC1zYW1lLXVzZXIucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 6](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk04UVI4MUdOQVYyWVcySEYyVDZINC9sb2dpbjEtcmVwbGF5LW9yaWdpbmFsLWNvb2tpZS00MDEucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 7](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk04UVI4MUdOQVYyWVcySEYyVDZINC9sb2dpbjItbm9uZXhpc3RlbnQtZW1haWwucG5n>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 8](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk04UVI4MUdOQVYyWVcySEYyVDZINC9sb2dpbjItd3JvbmctcGFzc3dvcmQucG5n>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 9](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk04UVI4MUdOQVYyWVcySEYyVDZINC9yZWctMDAxLWRlbGV0ZWQucG5n>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 10](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk04UVI4MUdOQVYyWVcySEYyVDZINC9yZWctMDAxLXdlbGNvbWUucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 11](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk04UVI4MUdOQVYyWVcySEYyVDZINC9yZWcyLWR1cGxpY2F0ZS1yZWplY3RlZC5wbmc>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 6 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3NM8QR81GNAV2YW2HF2T6H4-reg1 · run-scoped-http-cleanup · 2026-09-29T03:57:10.704Z · absent=true · sha256 780d139321820a861cf3dd564cca05bc72f653d0cc0812e32dea368491bcc714

独立核验：luowang-01M3NM8QR81GNAV2YW2HF2T6H4-login2 · run-scoped-http-cleanup · 2026-09-29T03:57:10.705Z · absent=true · sha256 780d139321820a861cf3dd564cca05bc72f653d0cc0812e32dea368491bcc714

独立核验：luowang-01M3NM8QR81GNAV2YW2HF2T6H4-reg2 · run-scoped-http-cleanup · 2026-09-29T03:57:10.706Z · absent=true · sha256 780d139321820a861cf3dd564cca05bc72f653d0cc0812e32dea368491bcc714

独立核验：luowang-01M3NM8QR81GNAV2YW2HF2T6H4-login1 · run-scoped-http-cleanup · 2026-09-29T03:57:10.707Z · absent=true · sha256 780d139321820a861cf3dd564cca05bc72f653d0cc0812e32dea368491bcc714

独立核验：luowang-01M3NM8QR81GNAV2YW2HF2T6H4-acct1 · run-scoped-http-cleanup · 2026-09-29T03:57:10.708Z · absent=true · sha256 780d139321820a861cf3dd564cca05bc72f653d0cc0812e32dea368491bcc714

独立核验：luowang-01M3NM8QR81GNAV2YW2HF2T6H4-probe · run-scoped-http-cleanup · 2026-09-29T03:57:10.709Z · absent=true · sha256 780d139321820a861cf3dd564cca05bc72f653d0cc0812e32dea368491bcc714
