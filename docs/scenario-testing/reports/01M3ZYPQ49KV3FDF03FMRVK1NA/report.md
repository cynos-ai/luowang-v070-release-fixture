---
run_id: 01M3ZYPQ49KV3FDF03FMRVK1NA
trigger: manual
base_commit: null
target_commit: 5d50f66532c535e2500d3b0a67e4e888f80b0272
included_commits: []
result: blocked
started_at: 2026-10-03T04:00:13.357Z
finished_at: 2026-10-03T04:05:32.631Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: passed
  - id: AUTH-REGISTRATION-001
    result: blocked
confirmed_bugs: []
---

# 最终测试报告：认证核心场景回归（登录后会话状态 + 一条独立合成数据路径）

- Run ID：`01M3ZYPQ49KV3FDF03FMRVK1NA`；trigger：`manual`
- targetCommit：`5d50f66532c535e2500d3b0a67e4e888f80b0272`；baseCommit：`null`；includedCommits：`[]`
- `scenarioMode = autonomous`；`initialization = false`
- Run 操作窗口（Harness 提供）：开始 `2026-10-03T04:00:13.357Z`，结束 `2026-10-03T04:05:32.631Z`
- 执行场景来源：计划 `## execution_scenarios` 仅两行，`AUTH-LOGIN-001`、`AUTH-REGISTRATION-001`，顺序即执行顺序；本报告 `scenario_results` 与之逐行一致，未用正文其他 ID 补齐。
- 数据来源与归属：以下事实转引自 `plan.md` 与 `review.md`。`review.md` 由 Reviewer（模型）只读本次受控证据独立审核，明确声明未执行命令、未补测、未读取目标仓库；其结论属 Reviewer，不等同于 Runner 交付。本报告不重做证据审核。

## 1. 测试范围与结果概览

| 场景 | 结果 | 依据（转引审核） |
| --- | --- | --- |
| AUTH-LOGIN-001 登录状态恢复 | **passed** | 四条期望均有本 Run 原始观察支持：刷新保持同一用户；退出回登录态；同一固化会话 200→401 且携带原 Cookie；删除后旧会话与原凭据均被拒。 |
| AUTH-REGISTRATION-001 新用户注册 | **blocked** | 期望 1/2/4 已观察到通过；期望 3「数据库不保存明文密码」无持久层观察路径，未闭合。 |

聚合结果：`blocked > failed > passed` → 整体 **blocked**。本 Run 上下文 `blockingReasons` 为空；整体 blocked 由 `AUTH-REGISTRATION-001` 的未闭合期望导致，不另有 Harness 层阻塞原因。本批**无已确认产品 Bug**，`confirmed_bugs` 为空。

## 2. 范围与维护

- 无 base、无 included commits、无 diff 可读；本批为对既有 approved 场景的**回归复用**，不作逐提交归因，不声称任何「已修复」。
- 计划维护动作为：复用 `AUTH-LOGIN-001`、`AUTH-REGISTRATION-001` 两个 approved 场景（ID 与四条既有期望不变）；对 `AUTH-REGISTRATION-001` 作一次最小 `modify`，在前置条件与「需要记录」中补入 `luowang-<RunID>-` 登记前缀与清理核验，使创建的合成数据落入自动清理范围；不新增场景；不弱化任何期望。
- 本 Run 上下文 `scenarioChanges` 显示 `docs/scenario-testing/scenarios/AUTH-REGISTRATION-001.md` 为 `modify`，且 `initialization = false`。审核经冻结场景快照核对，确认该 patch 内容与计划声明一致（`contentSha256 == sourceSha256 == 0291ff62…`），并解释规划期回执哈希不同属「patch 前正文 vs 执行集正文」差异，非矛盾。
- 本报告角色未读取 patch 文件本体（`read_run_artifact` 对该名称返回不可读），patch 的核对结论以 `review.md` 的声明为准，不由本角色独立复验。

## 3. 逐场景结果与依据（转引审核，保留来源）

### AUTH-LOGIN-001 登录状态恢复 — passed

审核者按冻结正文四条期望逐条核对原始记录后判 passed：

1. 刷新后显示同一用户：注册建立会话后导航重载，重载后用户与邮箱不变；截图 `AUTH-LOGIN-001-02-logged-in.png`、`AUTH-LOGIN-001-03-after-reload.png` 经审核者实际读取，两幅显示同一已登录用户。
2. 退出后页面回到登录状态：退出点击后页面回到登录表单并显示「已安全退出。」，截图 `AUTH-LOGIN-001-04-after-logout.png` 经审核者实际读取确认；同场景 Cookie 列表无 Cookie 引用。
3. 退出后受保护接口 401 且证明服务端撤销：受控 HTTP 客户端固化会话（`sessionSnapshotId = 6f7aeedadd43f21f18d6a97c07433177`）后，正对照 `GET /api/me` → 200（`sentCookieNames=["cynos_session"]`，`savedSessionEvidenceId=operation-33.json`）；同一客户端 `POST /api/auth/logout` → 200；**同一**固化会话重放 `GET /api/me` → 401 且 `sentCookieNames` 与 `sessionSnapshotId` 与正对照相同，排除「无 Cookie 的 401」。
4. 删除测试账号后旧 Session 与原凭据均不可用：受控 HTTP 侧固化 → 正对照 200 → `DELETE /api/me` 200 `{deleted:true}` → 同一固化会话 401 → 原凭据换客户端登录 401 `INVALID_CREDENTIALS`；浏览器侧同账号闭环，重新登录成功，点击「删除测试账号」后页面提示「测试账号及其会话已删除。」并回到登录态（截图 `AUTH-LOGIN-001-05-after-delete.png` 经审核者实际读取），再用原邮箱+原密码提交得到「邮箱或密码不正确」。

附带记录：`cynos_session` 的 `httpOnly: true`、`sameSite: Strict`、`path: /`、`secure: false` 已记录在案。

该场景证据的稳定引用地址（原样复用 Run 上下文值）：

- `AUTH-LOGIN-001-02-logged-in.png`：`/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1maW5hbC0yMDI2MTAwMy9wcm9qZWN0cy80ZjNlZjVlMC01Yjg1LTQwNDQtYTkzZS00NmFlYWQ5YTljNWEvcnVucy8wMU0zWllQUTQ5S1YzRkRGMDNGTVJWSzFOQS9BVVRILUxPR0lOLTAwMS0wMi1sb2dnZWQtaW4ucG5n`
- `AUTH-LOGIN-001-03-after-reload.png`：`/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1maW5hbC0yMDI2MTAwMy9wcm9qZWN0cy80ZjNlZjVlMC01Yjg1LTQwNDQtYTkzZS00NmFlYWQ5YTljNWEvcnVucy8wMU0zWllQUTQ5S1YzRkRGMDNGTVJWSzFOQS9BVVRILUxPR0lOLTAwMS0wMy1hZnRlci1yZWxvYWQucG5n`
- `AUTH-LOGIN-001-04-after-logout.png`：`/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1maW5hbC0yMDI2MTAwMy9wcm9qZWN0cy80ZjNlZjVlMC01Yjg1LTQwNDQtYTkzZS00NmFlYWQ5YTljNWEvcnVucy8wMU0zWllQUTQ5S1YzRkRGMDNGTVJWSzFOQS9BVVRILUxPR0lOLTAwMS0wNC1hZnRlci1sb2dvdXQucG5n`
- `AUTH-LOGIN-001-05-after-delete.png`：`/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1maW5hbC0yMDI2MTAwMy9wcm9qZWN0cy80ZjNlZjVlMC01Yjg1LTQwNDQtYTkzZS00NmFlYWQ5YTljNWEvcnVucy8wMU0zWllQUTQ5S1YzRkRGMDNGTVJWSzFOQS9BVVRILUxPR0lOLTAwMS0wNS1hZnRlci1kZWxldGUucG5n`
- 会话撤销链所引用的操作记录 ID：`operation-33.json`（固化会话）、`operation-34.json`（正对照 200）、`operation-35.json`（logout 200）、`operation-36.json`（同一固化会话 401）；删除链：`operation-38/39/40/41/42`。

### AUTH-REGISTRATION-001 新用户注册 — blocked

审核者逐条核对结论：

1. 页面显示欢迎信息：注册提交后进入欢迎态，显示「你好，…」与当前邮箱 `luowang-01m3zypq49kv3fdf03fmrvk1na-reg@example.test`（截图 `AUTH-REGISTRATION-001-01-welcome.png` 经审核者实际读取）→ 观察到通过。
2. `GET /api/auth/status` 返回已登录用户：重载后网络日志含 `GET /api/auth/status => 200`，请求头带 Cookie 绑定引用（`credential-12f87cc5c334fedbd48cbd1ec44554d4`，source=observed-request-header），响应体 `{"authenticated":true,"user":{"email":"…-reg@example.test",…}}` → 观察到通过。
3. 数据库不保存明文密码：**未验证**。只读存储探针 `GET <cleanup>/storage` → 404 `NOT_FOUND`；`GET <cleanup>/account-count` 仅返回 `deleted/remaining` 计数，不含密码列。页面文案与代码阅读不能替代持久层观察。
4. 删除账号后原凭据不能再登录：点击「删除测试账号」→ 页面提示「测试账号及其会话已删除。」并回到登录态；再用原邮箱+原密码提交 → 「邮箱或密码不正确」（截图 `AUTH-REGISTRATION-001-03-deleted-relogin-failed.png` 经审核者实际读取）→ 观察到通过。

因期望 3 尚不能确认，场景整体 blocked，同时保留期望 1/2/4 的已确认成功项；此与计划预告一致。审核同时明确：原文期望 3 未验证，且不存在「原文条件不适用」或「明确授权排除」的依据（`accountStorage` 不可用属验证能力不足，计划已声明保留原期望、不降级为可选），故本报告不照抄任何通过标签，记为 blocked。

证据引用：

- `AUTH-REGISTRATION-001-01-welcome.png`：`/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1maW5hbC0yMDI2MTAwMy9wcm9qZWN0cy80ZjNlZjVlMC01Yjg1LTQwNDQtYTkzZS00NmFlYWQ5YTljNWEvcnVucy8wMU0zWllQUTQ5S1YzRkRGMDNGTVJWSzFOQS9BVVRILVJFR0lTVFJBVElPTi0wMDEtMDEtd2VsY29tZS5wbmc`
- `AUTH-REGISTRATION-001-02-status-authenticated.png`：`/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1maW5hbC0yMDI2MTAwMy9wcm9qZWN0cy80ZjNlZjVlMC01Yjg1LTQwNDQtYTkzZS00NmFlYWQ5YTljNWEvcnVucy8wMU0zWllQUTQ5S1YzRkRGMDNGTVJWSzFOQS9BVVRILVJFR0lTVFJBVElPTi0wMDEtMDItc3RhdHVzLWF1dGhlbnRpY2F0ZWQucG5n`
- `AUTH-REGISTRATION-001-03-deleted-relogin-failed.png`：`/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1maW5hbC0yMDI2MTAwMy9wcm9qZWN0cy80ZjNlZjVlMC01Yjg1LTQwNDQtYTkzZS00NmFlYWQ5YTljNWEvcnVucy8wMU0zWllQUTQ5S1YzRkRGMDNGTVJWSzFOQS9BVVRILVJFR0lTVFJBVElPTi0wMDEtMDMtZGVsZXRlZC1yZWxvZ2luLWZhaWxlZC5wbmc`
- 存储探针与计数相关操作记录 ID：`operation-68.json`、`operation-69.json`、`operation-77.json`。

## 4. Reviewer 交付的偏差、记录问题与限制（原样保留，不升级、不消解）

1. **执行方式偏差（已由 Runner 在 `execution.md` 如实披露，审核判定不阻塞）**：`AUTH-LOGIN-001` 正文步骤 4 的「同一实际登录的客户端」在本 Run 未取浏览器会话，而取了受控 HTTP 客户端 `auth-login-001`（账号为受控 HTTP 注册的 `…-httpprobe`）；浏览器与受控 HTTP 两路径各持不同口令值（`operation-20` 与 `operation-29~31` 两向 401），Runner 把撤销断言改为在同一受控 HTTP 客户端内闭合。审核认为该处理满足该期望的实质（正对照 200 与退出后 401 落在同一账号、同一固化会话，并附 `sentCookieNames` 与 `sessionSnapshotId` 绑定证据，未以「无 Cookie 的 401」或「重新登录」冒充原会话重放），故期望成立并判 passed，但要求该偏差随结论保留。
   因此，以下说法不成立：不应把本次结论读作「浏览器 Cookie 已实测被服务端撤销」。浏览器会话（`credential-0a0f8611…`）未经 `GET /api/me` 直接观察服务端撤销，其失效仅由页面回登录态、Cookie 列表为空及删除后原凭据被拒间接支持。
2. **记录问题（不影响结论）**：控制台日志时间归属不可完全确定。`console-2026-10-03T04-01-58-293Z.log` 含 2 条 `/api/auth/login` 401，`console-2026-10-03T04-02-50-724Z.log` 含 1 条；日志文件名与事件相对偏移（`[13629ms]`）缺少共同基准，无法据此把每条 401 精确归到某个 seq/操作。Runner 在注册场景称「控制台仅 1 条 401 错误，即该登录尝试（operation-79）」，该断言的对象（`operation-79` 为 `browser_console_messages`，其 `output` 被省略）不能单独支撑；但第 4 条期望的核心依据是页面提示与截图，非该控制台行，故该记录问题不改变期望结论。本报告时间信息仅保留 Harness 给定的操作窗口与文件名中的各文件生成时刻，不把文件名时间加偏移换算为确证事件时间。
3. **格式小瑕**：`execution.md` 注册场景第 4 点句子在 `cookie: [REDACTED]` 处中断未闭合，不影响判断。
4. **凭据卫生（审核结论）**：审核者通读 `execution.md` 未发现复述密码口令值；报告对合成账号邮箱使用明文标识（`…-login@example.test`、`…-reg@example.test`、`…-httpprobe`），属登记所需的合成账号标识而非受控凭据，审核认为可接受。Runner 未声称做过任何密码/明文扫描，也未作「无泄漏」类绝对结论。本报告同样不作此类绝对声明，且不复述任何口令值、Token 或完整账号字段。

## 5. 覆盖缺口与未完成事项

- **`AUTH-REGISTRATION-001` 期望 3「数据库不保存明文密码」未验证**。原因：`accountStorage.status = unavailable`（`unsupported_endpoint`，观测 `2026-10-03T04:00:15.441Z`），本 Run 无持久层读回路径；本 Run 内的只读存储探针返回 404。该期望按要求保留、未弱化、未移入可选。补足条件：由具备持久层/受控存储观察能力的角色读回该测试账号行，确认密码列为 Argon2id 哈希。
- **场景 patch 的执行集与规划期正文差异**：审核说明规划期 `read_target_file` 回执内容与冻结快照哈希不同，属「规划时为 patch 前正文、执行集为 patch 后正文」，非矛盾；本角色未独立读取 patch 本体，该判断以审核声明为准。
- **本批未执行的场景**：`AUTH-ACCESS-001`、`AUTH-ACCOUNT-001`、`AUTH-LOGIN-002`、`AUTH-REGISTRATION-002/003` 及 draft `AUTH-SECURITY-001/002` 不在本批执行集。本批结论不代表认证模块整体覆盖完整，也不代表项目整体无问题。
- **不做逐提交归因**：无 base/diff，本批不声称任何「已修复」。
- 场景正文引用的初始化侦察 `execution.md` 未在固定 target 的文件清单中检索到，属前序 Run 工件；本轮未读取其正文。
- 测试数据清理：本 Run 审核记录称实际创建/删除 3 个带前缀合成账号，`account-count` 结束时 `remaining: 0`；该计数为执行期观察，非清理完成证明。按计划 `cleanup = after_final_main`，测试数据清理由 Harness 在本 Session 结束后统一处理，本报告不声称清理已完成，也不填写系统收尾区。

## 6. 已确认产品 Bug 与发布状态

- 本批**未发现**可由现有证据支持的产品缺陷。审核明确：所有被触达的受保护接口断言（刷新恢复、退出撤销、删除后会话与原凭据失效、注册后 status 已登录）均与场景期望方向一致；`execution.md` 亦未声明任何产品 Bug；浏览器侧两次「邮箱或密码不正确」提示可由跨路径凭据差异或删除后失效解释，非产品异常。
- 因此 `confirmed_bugs` 为空，本 Run **未发起任何 Issue 查询**（无 Bug 候选），也未产生 create/link 决策；本报告不代表已创建或关联任何 Issue。
- 发布状态与测试结果分别表达：本报告仅陈述测试结果（整体 blocked），未包含任何发布/放行结论。

## 7. Issue 查询覆盖缺口

本 Run 无已确认产品 Bug 候选，故未调用 `query_issue_candidates`，不存在 unavailable 或 empty 的查询状态需要区分。计划中 `historyIssuesAvailable = false` 的说明属计划判断，与本角色本次未执行查询无关；本报告不据此对「是否存在重复 Issue」作任何结论。因无 Bug 候选，本批不涉及后续受控归档 owner 的 create/link 动作。

## 8. 必要下一步

1. 取得持久层/受控存储读回能力后重跑或补充验证 `AUTH-REGISTRATION-001` 期望 3（读回带 Run 前缀测试账号行、确认密码列为哈希）；该期望未闭合前，该场景保持 blocked。
2. 如需断言浏览器侧会话被服务端撤销，应在同一真实浏览器会话内补做「固化→`GET /api/me` 200 正对照→退出→同一会话 401」的直接观察，而不是依赖本次受控 HTTP 客户端内闭合的替代证据。
3. 若希望把控制台 401 与具体操作对应，需要提供统一时钟基准或直接的操作-日志绑定记录。
4. 以上涉及更换/扩展环境能力或新增持久层访问的建议，均需另行确认授权范围，不代表本 Run 已具备该权限。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1maW5hbC0yMDI2MTAwMy9wcm9qZWN0cy80ZjNlZjVlMC01Yjg1LTQwNDQtYTkzZS00NmFlYWQ5YTljNWEvcnVucy8wMU0zWllQUTQ5S1YzRkRGMDNGTVJWSzFOQS9BVVRILUxPR0lOLTAwMS0wMS1pbml0aWFsLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1maW5hbC0yMDI2MTAwMy9wcm9qZWN0cy80ZjNlZjVlMC01Yjg1LTQwNDQtYTkzZS00NmFlYWQ5YTljNWEvcnVucy8wMU0zWllQUTQ5S1YzRkRGMDNGTVJWSzFOQS9BVVRILUxPR0lOLTAwMS0wMi1sb2dnZWQtaW4ucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1maW5hbC0yMDI2MTAwMy9wcm9qZWN0cy80ZjNlZjVlMC01Yjg1LTQwNDQtYTkzZS00NmFlYWQ5YTljNWEvcnVucy8wMU0zWllQUTQ5S1YzRkRGMDNGTVJWSzFOQS9BVVRILUxPR0lOLTAwMS0wMy1hZnRlci1yZWxvYWQucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 4](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1maW5hbC0yMDI2MTAwMy9wcm9qZWN0cy80ZjNlZjVlMC01Yjg1LTQwNDQtYTkzZS00NmFlYWQ5YTljNWEvcnVucy8wMU0zWllQUTQ5S1YzRkRGMDNGTVJWSzFOQS9BVVRILUxPR0lOLTAwMS0wNC1hZnRlci1sb2dvdXQucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 5](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1maW5hbC0yMDI2MTAwMy9wcm9qZWN0cy80ZjNlZjVlMC01Yjg1LTQwNDQtYTkzZS00NmFlYWQ5YTljNWEvcnVucy8wMU0zWllQUTQ5S1YzRkRGMDNGTVJWSzFOQS9BVVRILUxPR0lOLTAwMS0wNS1hZnRlci1kZWxldGUucG5n>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 6](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1maW5hbC0yMDI2MTAwMy9wcm9qZWN0cy80ZjNlZjVlMC01Yjg1LTQwNDQtYTkzZS00NmFlYWQ5YTljNWEvcnVucy8wMU0zWllQUTQ5S1YzRkRGMDNGTVJWSzFOQS9BVVRILVJFR0lTVFJBVElPTi0wMDEtMDEtd2VsY29tZS5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 7](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1maW5hbC0yMDI2MTAwMy9wcm9qZWN0cy80ZjNlZjVlMC01Yjg1LTQwNDQtYTkzZS00NmFlYWQ5YTljNWEvcnVucy8wMU0zWllQUTQ5S1YzRkRGMDNGTVJWSzFOQS9BVVRILVJFR0lTVFJBVElPTi0wMDEtMDItc3RhdHVzLWF1dGhlbnRpY2F0ZWQucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 8](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1maW5hbC0yMDI2MTAwMy9wcm9qZWN0cy80ZjNlZjVlMC01Yjg1LTQwNDQtYTkzZS00NmFlYWQ5YTljNWEvcnVucy8wMU0zWllQUTQ5S1YzRkRGMDNGTVJWSzFOQS9BVVRILVJFR0lTVFJBVElPTi0wMDEtMDMtZGVsZXRlZC1yZWxvZ2luLWZhaWxlZC5wbmc>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 3 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3ZYPQ49KV3FDF03FMRVK1NA-login · run-scoped-http-cleanup · 2026-10-03T04:05:57.729Z · absent=true · sha256 c6b6d4c85af68657cafc7829b466585d2a2b411971966a37203120551fe5b777

独立核验：luowang-01M3ZYPQ49KV3FDF03FMRVK1NA-httpprobe · run-scoped-http-cleanup · 2026-10-03T04:05:57.730Z · absent=true · sha256 c6b6d4c85af68657cafc7829b466585d2a2b411971966a37203120551fe5b777

独立核验：luowang-01M3ZYPQ49KV3FDF03FMRVK1NA-reg · run-scoped-http-cleanup · 2026-10-03T04:05:57.732Z · absent=true · sha256 c6b6d4c85af68657cafc7829b466585d2a2b411971966a37203120551fe5b777
