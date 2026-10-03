# 审核报告：认证核心场景回归（AUTH-LOGIN-001、AUTH-REGISTRATION-001）

- Run ID：`01M3ZYPQ49KV3FDF03FMRVK1NA`
- targetCommit：`5d50f66532c535e2500d3b0a67e4e888f80b0272`；baseCommit：`null`；includedCommits：`[]`；`scenarioMode = autonomous`，`initialization = false`
- 审核者：Reviewer（模型，只读本次受控证据；未执行命令、未补测、未读取目标仓库）
- 审核对象：`plan.md`（planHash `4506ccf69d5bf57a2289879e406510ccea32f19240b9a27be42b839f506142c4`，与计划头 Harness 元数据一致，经 `query_source_reads(scope=plan)` 核对成立）、`scenario-changes.patch`、`selectedScenarioSnapshot` 冻结场景正文、本 Run 原始 command/browser 证据、`execution.md`
- `browserRequired = true`（Main 声明的执行意图）；本 Run 确有浏览器实际操作记录（browser_navigate / snapshot / click / fill_form / cookie / network 等），声明与实际执行一致。

## 1. 计划与 patch 核对

- 计划 `## execution_scenarios` 仅两行：`AUTH-LOGIN-001`、`AUTH-REGISTRATION-001`，顺序即执行顺序。Runner 声明的 `begin_scenario_execution([...])` 与该清单逐行一致（`execution.md` 声明；progress 事件顺序见 operation-1/2、operation-55/56、operation-80）。
- `scenario-changes.patch` 只对 `docs/scenario-testing/scenarios/AUTH-REGISTRATION-001.md` 做一处 `modify`：前置条件补入「邮箱或昵称以 `luowang-<RunID>-` 开头，以便登记与清理」，并在「需要记录」补入「合成测试账号的登记标识与清理核验」。冻结快照中 `AUTH-REGISTRATION-001` 的 `content` 已包含该新增文字，`contentSha256 == sourceSha256 == 0291ff62…`，与 patch 结果一致 → 计划「最小 modify、ID 与期望不变」的维护声明成立。（规划期 `read_target_file` 回执 `22e08230` 的内容哈希 `4a339eb…` 与冻结快照哈希不同，与「规划时为 patch 前正文、执行集为 patch 后正文」相符，属预期，非矛盾。）
- 计划把 `AUTH-REGISTRATION-001` 期望 3「数据库不保存明文密码」列为因 `accountStorage` 不可用而保留的未验证项，未降级为可选，符合原地期望。

## 2. 逐场景独立判断

### AUTH-LOGIN-001 登录状态恢复 — **passed**

我按冻结正文的四条期望逐条核对原始记录：

1. **刷新后显示同一用户**：注册建立会话后（operation-11/12，页面「你好，…」当前邮箱 `luowang-01m3zypq49kv3fdf03fmrvk1na-login@example.test`）导航重载（operation-14，快照 `page-2026-10-03T04-01-44-214Z.yml`），重载后用户与邮箱不变（operation-15）。截图 `AUTH-LOGIN-001-02-logged-in.png`、`AUTH-LOGIN-001-03-after-reload.png` 经我实际读取，两幅均显示同一已登录用户。→ 观察到通过。
2. **退出后页面回到登录状态**：退出点击后页面回到登录表单并显示「已安全退出。」（operation-27，快照 `page-2026-10-03T04-02-02-454Z.yml`），截图 `AUTH-LOGIN-001-04-after-logout.png` 我实际读取确认。同场景 `browser_cookie_list`（operation-26）无 Cookie 引用。→ 观察到通过。
3. **退出后的 Session 访问受保护接口返回 401（且证明服务端撤销、请求确实携带原 Cookie）**：
   - 受控 HTTP 客户端 `auth-login-001` 于 operation-32 登录成功（200，Set-Cookie `cynos_session`）；
   - `save_test_http_session`（operation-33）返回 `sessionSnapshotId = 6f7aeedadd43f21f18d6a97c07433177`；
   - 正对照：以该固化会话 `GET /api/me` → **200**，`sentCookieNames=["cynos_session"]`，`savedSessionEvidenceId=operation-33.json`（operation-34）；
   - 破坏：同一客户端 `POST /api/auth/logout` → 200（operation-35）；
   - 重放：**同一**固化会话 `GET /api/me` → **401**，`sentCookieNames=["cynos_session"]`、`sessionSnapshotId` 与正对照相同（operation-36）。
   该链排除「无 Cookie 的 401」（对照组 operation-19：无 Cookie 时 401）。→ 观察到通过。
4. **删除测试账号后旧 Session 和原凭据均不可用**：同一客户端再次登录 200（operation-37）→ 固化 `d0b75bd66ed37ddd8d2c74da15ac419e`（operation-38）→ 正对照 `GET /api/me` 200（operation-39）→ `DELETE /api/me` 200 `{deleted:true}`（operation-40）→ 同一固化会话 `GET /api/me` **401**（operation-41）→ 原凭据换客户端 `auth-login-002` 登录 **401 INVALID_CREDENTIALS**（operation-42）。浏览器侧同账号闭环：重新登录成功（operation-44/45/46）、点击「删除测试账号」后页面提示「测试账号及其会话已删除。」并回到登录态（operation-46/47，截图 `AUTH-LOGIN-001-05-after-delete.png`，我实际读取确认提示与回登录态），再用原邮箱+原密码提交 → 页面提示「邮箱或密码不正确」（operation-51/52/53，快照 `page-2026-10-03T04-03-05-348.yml`）。→ 观察到通过。

附带要求：`cynos_session` 的 `httpOnly: true`、`sameSite: Strict`、`path: /`、`secure: false`（operation-18）已记录。

**判定说明（重要）**：正文步骤 4 的「同一实际登录的客户端」在本 Run 未取浏览器会话，而是取了受控 HTTP 客户端 `auth-login-001`（其账号为受控 HTTP 注册的 `…-httpprobe`）。Runner 在 `execution.md`「执行偏差与说明」中已如实披露跨路径凭据不一致（浏览器与受控 HTTP 各持不同口令值，operation-20 与 operation-29~31 两向 401），并把撤销断言改为在同一受控 HTTP 客户端内闭合。我认为该处理满足该期望的实质：正对照 200 与退出后 401 落在**同一账号、同一固化会话**，并附 `sentCookieNames` 与 `sessionSnapshotId` 绑定证据，未以「无 Cookie 的 401」或「重新登录」冒充原会话重放。故四条第 3 条期望成立，场景判 passed；但此偏差应随结论保留（见 §4）。

### AUTH-REGISTRATION-001 新用户注册 — **blocked**

1. **页面显示欢迎信息**：注册提交后进入欢迎态，显示「你好，…」与当前邮箱 `luowang-01m3zypq49kv3fdf03fmrvk1na-reg@example.test`（operation-60，截图 `AUTH-REGISTRATION-001-01-welcome.png`，我实际读取确认）。→ 观察到通过。
2. **`GET /api/auth/status` 返回已登录用户**：重载后网络日志含 `GET /api/auth/status => 200`（operation-63/64），请求头 `cookie: [REDACTED]` 带 Cookie 绑定引用 `credential-12f87cc5c334fedbd48cbd1ec44554d4`（operation-65，source=observed-request-header），响应体 `{"authenticated":true,"user":{"email":"…-reg@example.test",…}}`（operation-66）。→ 观察到通过。
3. **数据库不保存明文密码**：**未验证**。`accountStorage` 不可用；本 Run 只读存储探针 `GET <cleanup>/storage` → **404 NOT_FOUND**（operation-68），`GET <cleanup>/account-count` 仅返回 `deleted/remaining` 计数（operation-69/77），不含密码列。页面文案与代码阅读不能替代持久层观察。→ 未闭合。
4. **删除账号后原凭据不能再登录**：点击「删除测试账号」→ 页面提示「测试账号及其会话已删除。」并回到登录态（operation-72/73，快照 `page-2026-10-03T04-03-01-881.yml`），再用原邮箱+原密码提交 → 提示「邮箱或密码不正确」（operation-74/75/76/77，截图 `AUTH-REGISTRATION-001-03-deleted-relogin-failed.png`，我实际读取确认邮箱与报错提示）。→ 观察到通过。

因期望 3 尚不能确认，场景整体 **blocked**，同时保留期望 1/2/4 的已确认成功项。此与计划预告一致。

## 3. 已确认产品 Bug

本批**未发现**可由现有证据支持的产品缺陷。所有被触达的受保护接口断言（刷新恢复、退出撤销、删除后会话与原凭据失效、注册后 status 已登录）均与场景期望方向一致；`execution.md` 亦未声明任何产品 Bug。浏览器侧两次「邮箱或密码不正确」提示均可由跨路径凭据差异或删除后失效解释，非产品异常。

## 4. 执行偏差、问题与影响

1. **（偏差，已披露，不阻塞）浏览器会话未作为固化重放对象**：见 §2 AUTH-LOGIN-001 判定说明。影响仅限「撤销断言落在哪个客户端」；该期望已由受控 HTTP 客户端内闭合满足。结论中应保留该执行方式说明，避免下游误读为「浏览器 Cookie 已实测服务端撤销」。
2. **（记录问题，不影响结论）控制台日志时间归属不可完全确定**：`console-2026-10-03T04-01-58-293Z.log` 含 2 条 `/api/auth/login` 401，`console-2026-10-03T04-02-50-724Z.log` 含 1 条；日志文件名与事件相对偏移（`[13629ms]`）缺少共同基准，无法据此把每条 401 精确归到某个 seq/操作。Runner 在注册场景称「控制台仅 1 条 401 错误，即该登录尝试（operation-79）」——该断言的对象（operation-79 为 `browser_console_messages`，其 `output` 被省略）不能单独支撑，但第 4 条期望的核心依据是页面提示与截图，非该控制台行；故此记录问题不改变期望结论。
3. **（格式小瑕）`execution.md` 注册场景第 4 点句子在 `cookie: [REDACTED]` 处中断未闭合**，不影响判断。
4. **（凭据卫生）** 我通读 `execution.md` 未发现复述密码口令值；报告对合成账号邮箱使用明文标识（`…-login@example.test`、`…-reg@example.test`、`…-httpprobe`），属登记所需的合成账号标识而非受控凭据，可接受。Runner 未声称做过任何密码/明文扫描，也未作「无泄漏」类绝对结论，符合边界。

## 5. 场景选择与覆盖

- 本批只执行请求点名的两条路径，与计划一致；未执行 `AUTH-ACCESS-001`、`AUTH-ACCOUNT-001`、`AUTH-LOGIN-002`、`AUTH-REGISTRATION-002/003` 及 draft 场景，结论不代表认证模块整体覆盖完整。
- 未发现重复、错误合并或影响判断的重要遗漏。`AUTH-REGISTRATION-001` 的 modify 为最小澄清（补 `luowang-<RunID>-` 前缀与登记记录），不改变 ID 与四条期望，符合请求与清理契约。
- 合成数据：本 Run 实际创建/删除了 3 个带前缀账号（`…-login`、`…-httpprobe`、`…-reg`），与「一条独立合成数据路径」+ 会话场景要求相容；`account-count` 结束时 `remaining: 0`（operation-77）。测试后清理仍由 Harness 在最终 Main 后统一核验，非本次审核范围。

## 6. 未完成项与无法确认事项

- `AUTH-REGISTRATION-001` 期望 3「数据库不保存明文密码」未验证，原因：`accountStorage.status = unavailable`（`unsupported_endpoint`，观测 `2026-10-03T04:00:15.441Z`），本 Run 无持久层读回路径。补足条件：由具备持久层/受控存储观察能力的角色读回该测试账号行，确认密码列为 Argon2id 哈希。
- 浏览器会话（`credential-0a0f8611…`）未经 `GET /api/me` 直接观察服务端撤销；其失效仅由页面回登录态、Cookie 列表为空及删除后原凭据被拒间接支持（见 §4.1）。
- 控制台 401 与具体操作的对应关系无法精确确定（见 §4.2）。
- 无 base/diff，本批不作逐提交归因，不声称任何「已修复」。

## 7. 总体结论

| 场景 | 审核结果 | 依据 |
| --- | --- | --- |
| AUTH-LOGIN-001 | **passed** | 四条期望均有本 Run 原始观察支持（页面刷新保持同一用户；退出回登录态；同一固化会话 200→401 且携带原 Cookie；删除后旧会话与原凭据均被拒）。附执行方式偏差说明（§4.1）。 |
| AUTH-REGISTRATION-001 | **blocked** | 期望 1/2/4 已观察到通过；期望 3 因无持久层观察能力未闭合。 |

本批执行与证据整体与 `execution.md` 的逐场景结论一致（我在先独立核对原始记录后才对照执行报告），未发现被低估的产品缺陷；唯一强制未闭合项为 `AUTH-REGISTRATION-001` 期望 3 的持久层缺口。计划引用、patch 维护声明与执行顺序均成立。
