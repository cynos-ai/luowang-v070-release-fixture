# 审核报告（Reviewer）

- Run ID：`01M3NM8QR81GNAV2YW2HF2T6H4`；触发：`manual`
- 固定 target：`a977ef3cb95e06c43ac59c073f81948034f47948`（`baseCommit=null`、`includedCommits=[]`，无变化清单）
- 计划：`plan.md`，planHash `24673eb7bd35ef291fd3973908df8e6fe805bee2362b96f821abadc62796e7f4`；已用 `query_source_reads(scope=plan)` 核对，回执中的 planHash 与计划开头 Harness 元数据一致；6 个场景正文的 `sourceSha256` 与动态上下文 `selectedScenarioSnapshot` 一致（正文非 redacted）。`scenario-changes.patch` **不存在**，与计划「本轮不写 patch、不维护场景」一致。
- `browserRequired = true`：本轮确有真实浏览器操作证据（`browser_navigate/fill_form/click/snapshot/cookie_*/network_request(s)`、headless Chrome UA、页面快照与控制台日志），该声明与执行相符。
- 审核方法：先读计划与场景快照正文 → 逐个读取原始命令/浏览器证据（`operation-*.json`、`command-*.json`、`page-*.yml`、`console-*.log`）→ 实际读取全部 11 张截图 → 最后才读 `execution.md` 对照。以下所有观察均来自我自己读到的原始记录；与 Runner 结论一致处注明一致，不一致处单独说明。**本 Run 无任何人工复核记录，本报告为模型审核。**

## 1. 执行范围合规性

- `plan.md` 唯一 `## execution_scenarios` 为 6 项，本次实际 `begin_scenario_execution` + 逐场景 `start_scenario`/`finish_scenario` 的顺序完全一致：ACCESS-001 → REGISTRATION-001 → LOGIN-002 → REGISTRATION-002 → LOGIN-001 → ACCOUNT-001（证据：`operation-9/10/16/17/43/44/74/75/98/99/141/142/197`）。
- 未执行任何 draft 场景（无 `AUTH-SECURITY-*` 操作记录），未修改 `docs/scenario-testing/scenarios/**`，未提交 patch。
- 账号命名使用 Run 前缀（`luowang-01m3nm8qr81gnav2yw2hf2t6h4-{reg1,login2,reg2,login1,acct1,probe}@example.test`；probe 的 displayName 为 `luowang-01M3NM8QR81GNAV2YW2HF2T6H4-probe`）。email 本地部分为 Run ID 的小写形式，与计划要求的「`luowang-<Run ID>-` 开头」在 email 大小写不敏感语义下满足；此点仅作记录，不影响结论。

## 2. 逐场景结果

### AUTH-ACCESS-001 未登录访客无法访问受保护资料 — **passed**
观察（我自己读取）：
- 页面为登录表单、无任何用户资料：`operation-2.json` 快照（heading「登录 Cynos」、邮箱/密码输入、登录按钮，无用户区），截图 `access-001-logged-out.png`（我已实际查看：登录表单，无用户数据）。
- `GET /api/auth/status` 未登录：浏览器网络 `operation-4.json`（200）、`operation-7.json`（请求详情，无 cookie 头）、`operation-8.json`（响应体 `{"authenticated":false,"user":null}`）；受控客户端 `operation-6.json` 同响应。
- `GET /api/me` 被拒绝：`operation-5.json` 受控客户端 GET `/api/me` → **401**，体 `{"error":{"code":"UNAUTHORIZED","message":"请先登录",...}}`，未返回资料。

三条适用期望均有实际观察支持。
**记录缺陷（不影响结论）**：`operation-4/5/6/7/8` 的 `execution.scenarioId` 为 `null`、`scope: "auxiliary"`、`declared: false`，发生在 `start_scenario(AUTH-ACCESS-001)`（`operation-10`）之前约 3 秒。因此本场景的接口断言在运行记录中被归为「辅助」而非场景内步骤，`start` 之后场景内仅剩 `browser_find`/`cookie_list`（`operation-11~15`）。事实与页面状态一致（同一无会话冷态、注册之前），故仅记为执行记录归属问题，不改产品结论。

### AUTH-REGISTRATION-001 新用户注册 — **blocked**
已确认成立的期望（证据充分）：
- 页面显示欢迎信息：注册后 `POST /api/auth/register` **201**（`operation-25.json` 请求、`operation-26.json` 响应体 `{"authenticated":true,"user":{...reg1...}}`）；`operation-24.json` 快照为 Welcome「你好，…」+ 当前登录邮箱；截图 `reg-001-welcome.png`（我已查看：Welcome 页 + 邮箱 + 退出/删除按钮）。
- 可从欢迎页删除且原凭据不能再登录：`operation-32.json` 网络含 `DELETE /api/me => 200`、`operation-34.json` 响应体 `{"deleted":true,...}`、`operation-33.json` 快照提示「测试账号及其会话已删除。」、截图 `reg-001-deleted.png`（已查看）；`operation-37.json` 受控客户端用原邮箱+原口令 `POST /api/auth/login` → **401 INVALID_CREDENTIALS**。
- 会话已建立（以注册响应体 `authenticated:true` + Welcome 页 + Cookie 观察为据）。

**未确认的适用期望**：场景明列「数据库不保存明文密码」。本 Run 的 5 条命令证据全部失败：`command-1.json`（`npm test`，exit 127，`vitest: not found`）、`command-2.json`（`npm exec -- vitest run tests/auth.test.ts`，exitCode null，仅安装提示）、`command-3/4/5.json`（`vitest.config.ts` 解析失败 / `EACCES` 只读源码树）。Runner 另称 `inspect_test_account_storage` 不可用（该调用在受控记录中无回执，属其自述，我无法独立复核）。因此白盒期望**无任何实际观察支持**（响应体不含明文不能推断持久层行为）。
判定：适用期望中有一项未确认 → 场景 **blocked**（已确认的成功项保留）。与 Runner 的 `blocked` 判定一致。计划 §6 已预先说明该口径，处理正确。

### AUTH-LOGIN-002 登录拒绝与统一凭据错误 — **passed**
- 错误密码：浏览器填入 login2 邮箱 + 错误口令提交 → 网络 #9 `POST /api/auth/login` **401**（`operation-51.json`），响应体 `INVALID_CREDENTIALS`/「邮箱或密码不正确」（`operation-53.json`），页面 alert 同文案（`operation-52.json`）；截图 `login2-wrong-password.png`（已查看：alert「邮箱或密码不正确」，邮箱为 login2）。
- 不存在邮箱：UI 未被原生校验拦截，真实发出请求 → 网络 #10 **401**（`operation-57.json`），响应体同为 `INVALID_CREDENTIALS`/「邮箱或密码不正确」（`operation-59.json`），页面 alert 同文案（`operation-58.json`）；截图 `login2-nonexistent-email.png`（已查看：同日文 alert，邮箱为 `...nobody@...`）。
- 一致性：两次状态码（401）与错误体（code/message）一致，未区分邮箱是否存在。
- 失败后未登录：`operation-61.json` 受控客户端 `GET /api/auth/status` → `{"authenticated":false,"user":null}`；`operation-62.json` 浏览器无 Cookie。
- 场景内清理已做：`operation-67.json`（网络含 `DELETE /api/me 200`）、`operation-68.json`（提示「测试账号及其会话已删除。」）。
全部适用期望有实际观察支持。

### AUTH-REGISTRATION-002 注册拒绝：重复邮箱 — **passed**
- `operation-80.json` 网络 #15 `POST /api/auth/register` → **409 Conflict**；`operation-83.json` 响应体 `{"error":{"code":"EMAIL_ALREADY_REGISTERED","message":"该邮箱已经注册",...}}`。
- 页面仍停在「创建账户」表单，alert「该邮箱已经注册」，未进入 Welcome：`operation-81.json` 快照；截图 `reg2-duplicate-rejected.png`（已查看：创建账户表单 + 该提示）。
- 拒绝后未登录：`operation-85.json` 受控客户端 `GET /api/auth/status` → `authenticated:false`；`operation-82.json` 浏览器无 Cookie。
- 场景内清理已做：`operation-91/92`（登录后 `DELETE /api/me` 200、提示已删除；网络 #13/#14 显示先 register 201、logout 200 再 register 409，与步骤一致）。
全部适用期望有实际观察支持。

### AUTH-LOGIN-001 登录状态恢复 — **passed（本轮最高风险点已闭合）**
- 刷新后显示同一用户：`browser_navigate` 重载后 `operation-106.json` 快照仍为同一用户/邮箱；网络 #4（`operation-109/110.json`）`GET /api/auth/status` → 200，体 `{"authenticated":true,"user":{...login1...}}`；截图 `login1-refresh-same-user.png`（已查看：Welcome login1）。
- 退出后回到登录状态：`operation-114.json` 网络含 `POST /api/auth/logout => 200`；`operation-113.json` 快照「已安全退出。」+ 登录表单；截图 `login1-after-logout.png`（已查看）。
- **退出后原 Session Cookie 重放 → 401（关键期望）**：退出前 `operation-107.json` 固化 `cynos_session`（受控引用 `credential-b7ff…`，属性 httpOnly=true / SameSite=Strict）；退出后 `operation-112.json` 显示浏览器已无 Cookie；`operation-116.json` 用 `cookie_set` **恢复同一受控引用**（`restore-input`）；`operation-117.json` 再次确认浏览器持有该引用；随后 `operation-119.json` 导航触发 `GET /api/me`，`operation-120.json` 网络记录为 **401**，`operation-121.json` 请求详情 `credentialReferences` 中 `observed-request-header` 携带同名引用 `credential-b7ff…` 且请求头含 `cookie: [REDACTED]`，`operation-122.json` 响应体为 `UNAUTHORIZED/请先登录`；截图 `login1-replay-original-cookie-401.png`（已查看：JSON 401 体，requestId 与 `operation-121` 同一次请求）。
  → 该 401 由**明确携带退出前原 Cookie 的请求**触发，满足计划 §6 与历史 blocked 案例所要求的判定口径，区别于「无 Cookie 的普通未认证 401」。
- 删除测试账号后旧 Session 与原凭据均不可用：重登后 `operation-129.json` 固化当前会话 Cookie（引用 `credential-dd07…`）；`operation-130/132.json` 触发删除成功 + 页面提示「测试账号及其会话已删除。」；`operation-133.json` 受控客户端用**原邮箱+原口令**登录 → **401 INVALID_CREDENTIALS**；`operation-134.json` 恢复删除前会话引用，`operation-135/136/137.json` `GET /api/me` → **401** 且请求详情 `observed-request-header` 携带该引用；`operation-138.json` 响应体 401；截图 `login1-deleted-old-session-401.png`（已查看：JSON 401 体）。
- 记录项齐备：Cookie 属性 `httpOnly: true`、`sameSite: Strict`（`operation-107/129.json`）；退出状态 `POST /api/auth/logout 200`；登录/刷新后的用户资料。
四条适用期望均有实际观察支持。附带产品结论：历史 Run `01M27X2RS07BRA6CBAW1TSKCKY` 在旧 target（`e980181`）记录的「退出未撤销服务端会话」缺陷，在**本 target 上未复现**（本 Run 直接观察到原 Cookie 重放被 401 拒绝）；因无 base commit/diff，只表述为「本 target 未复现」，不作「已修复」归因。

### AUTH-ACCOUNT-001 删除测试账号使账号与全部会话失效 — **blocked**
已确认成立的项：
- 删除请求成功且页面提示删除：`operation-184.json` 受控客户端 `DELETE /api/me` → 200，体 `{"deleted":true,"authenticated":false,"user":null}`；浏览器侧 `operation-193/194.json` 点击删除后快照提示「测试账号及其会话已删除。」，截图 `acct1-deleted-notice.png`（已查看：该提示 + acct1 邮箱）。
- 原邮箱原密码登录被拒：`operation-187.json` `POST /api/auth/login` → **401 INVALID_CREDENTIALS**。
- 一个会话（`acct-sessionB`）的 Cookie 被撤销：`operation-183.json` 该客户端登录 200 建立会话；删除后 `operation-186.json` `GET /api/me` → **401**，且该请求 `cookieNames:["cynos_session"]` 说明请求**携带了会话 Cookie**。

**未确认 / 偏差（据其判 blocked）**：
1. **「会话 1」的 Cookie 重放未真正执行**：`operation-185.json` 中 `acct-sessionA` 删除后的 `GET /api/me` → 401，但 `cookieNames: []`（该客户端 Cookie 已被删除响应的 `setCookieNames:["cynos_session"]` 清除）。按计划 §6 明确的判定口径，「未携带 Cookie 的普通未认证 401」不构成「会话被撤销」的证据，因此场景明列的「**会话 1** 与会话 2 的 Cookie 访问受保护接口均被拒绝」中，会话 1 一侧未获验证。
2. **步骤对象被替换**：场景要求「浏览器注册账号 A 形成会话 1 → 受控客户端登录同一账号形成会话 2 → 在浏览器会话 1 触发删除 → 删除后分别用会话 1、会话 2 的 Cookie 读 `/api/me`」。实际用受控客户端单独注册的 `…-probe` 账号，并由 `acct-sessionA`（受控客户端）触发删除（`operation-169/181/183/184`）；浏览器注册的 `…-acct1` 只单独验证了 UI 删除提示（`operation-193/194`），其会话 Cookie 在删除后**从未重放**。因此「浏览器 UI 删除 → 使另一独立客户端会话失效」这一具体组合、以及「同一账号的浏览器会话 + 客户端会话」组合均未覆盖。
3. 浏览器改口令与受控客户端口令不一致导致 `acct1` 无法用受控客户端登录（`operation-153/155.json` 两次 401；另 `operation-179.json` 反向也 401）。Runner 解释为「口令占位符两域不同值」，该解释与其自述一致，但**无原始记录直接展示两次提交的口令值差异**（请求体未落盘），我只能确认现象（同账号跨手段登录 401），不能独立确认成因；可排除的产品缺陷方向有限——同一运行内其它账号的浏览器注册+浏览器登录均成功，故更像凭据映射问题而非登录功能故障，但此点属推断，已如实标注。

结论：核心契约（删除账号使账号与**全部**会话失效、旧凭据不可用）得到部分证实（一个带 Cookie 的会话被撤销、旧凭据被拒、UI 提示正确），但场景明列的两会话 Cookie 重放有一半未获支持且执行对象/触发方偏离场景步骤 → **blocked**，保留已确认成功项。与 Runner 的 `passed（含偏差）` 判定**不一致**：Runner 将「会话 1 的 401」计入通过，而该请求未携带 Cookie，依计划自身口径不足以支持该期望。

## 3. 已确认产品问题

**未发现**本 target 上的产品行为违反。各场景所有被实际观察到的适用期望均符合规格；`AUTH-LOGIN-002/REGISTRATION-002/LOGIN-001/ACCESS-001` 的失败路径（401/409）与统一错误文案均与规格一致。不得由本轮结果推断未执行场景（`AUTH-REGISTRATION-003`、`AUTH-SECURITY-001/002`）通过。

## 4. 依据、缺口与无法确认事项

- **计划维护声明**：计划称本轮不新增/修改/废弃场景、不写 patch；`scenario-changes.patch` 不存在，核对成立。计划中对 target 实现的描述基于 `redacted=true` 的源码读取（`query_source_reads` 回执显示 `src/server/security/auth.ts`、`src/server/app.ts`、`src/web/App.tsx`、`tests/auth.test.ts` 均 `redacted: true`，`fullSafeText` 仅指受控文本覆盖），属实现线索，未被当作测试证据；本轮结论完全建立在运行观察上。
- **未决覆盖缺口（按计划已登记，我同意其不在本轮范围）**：`AUTH-REGISTRATION-003`（approved 非 core）、`AUTH-SECURITY-001/002`（draft）；无 base commit/included commits，结论不能归因到具体改动；场景索引 stale（`a34297b` ≠ target）未影响执行集合。
- **无法确认项**：① `AUTH-REGISTRATION-001` 的「数据库不保存明文密码」（命令工具全部失败：`command-1..5`；`inspect_test_account_storage` 不可用仅见 Runner 自述，无回执可复核）；② `AUTH-ACCOUNT-001` 会话 1 的 Cookie 重放、浏览器会话与客户端会话的异构组合；③ 跨手段口令不一致的确切成因（仅有现象记录）。
- **执行记录质量**：① `AUTH-ACCESS-001` 的接口观察落在 `start_scenario` 之前的 auxiliary 记录（见 §2）；② `execution.md` §7 证据索引有少量标号不准（例：把 `GET /api/me` 的 401 记在 `operation-114`，而 `operation-114` 实为触发该请求的导航，401 请求详情在 `operation-120/121`），不影响实质，因我已直接核对原始记录；③ 未发现口令明文落盘：`command-*.json` 与 `operation-*.json` 中表单值均为 `[REDACTED]`/受控引用，HTTP 证据只含测试邮箱；**该结论限于我已读到的本 Run 捕获内容**，受控 Secret 零命中不等于不存在任何密码文本。
- **清理**：`execution.md` §5 列出的 6 个合成账号均登记为 `registered`（Runner 自述，我无法独立核验其登记接口），场景内删除的业务结果已被独立证据支持（删除响应 + 提示 + 旧凭据/旧会话被拒）。测试后收尾清理由 Harness 在最终 Main 后处理，不属于本次审核或阻塞项。

## 5. 总体结论

- 逐场景：`AUTH-ACCESS-001` passed；`AUTH-REGISTRATION-001` **blocked**（白盒密码存储期望未验证）；`AUTH-LOGIN-002` passed；`AUTH-REGISTRATION-002` passed；`AUTH-LOGIN-001` passed（关键原 Cookie 重放 401 已由带请求头关联的可复核证据闭合）；`AUTH-ACCOUNT-001` **blocked**（会话 1 的 Cookie 重放未执行、执行对象/触发方偏离场景步骤）。
- 整体：**部分通过**。2 passed、2 blocked、2 passed-but-independent；无 failed，未发现产品缺陷。最高风险项（退出/删除后原会话被服务端撤销）在本 target 上得到正面验证。
- 与 Runner 汇总的差异仅有 1 处：`AUTH-ACCOUNT-001` 我判 blocked 而非 passed（理由见 §2 该场景）。其余 5 项判定与 Runner 一致。
