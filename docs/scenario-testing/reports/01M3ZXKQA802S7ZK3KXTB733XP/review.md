# 审核报告：AUTH-LOGIN-001 登录状态恢复

- Run: `01M3ZXKQA802S7ZK3KXTB733XP`
- targetCommit: `737ad8db8b34abc618bf7d80bc30b05ccc22b7a3`（baseCommit=null，`includedCommits=[]`）
- 计划哈希：plan.md 内嵌元数据 `planHash=35684a643b9014f1053729ad6e679d05222e1960951609c6006e64ea9780c4c1`，与 `query_source_reads(scope=plan)` 返回一致；计划读取回执覆盖 12 条来源、其中 7 条 `full-file`（含 `AUTH-LOGIN-001.md`、`docs/changes/cynos-website-auth/spec.md`、`src/server/app.ts`、`src/server/security/auth.ts` 等）。
- 正式执行集合（`## execution_scenarios`）：仅 `AUTH-LOGIN-001`，与 `scenario-progress` 的 `start_scenario`(operation-2)/`finish_scenario`(operation-81, `completed:["AUTH-LOGIN-001"]`) 一致。
- `browserRequired=true`，且存在实际 Playwright MCP 操作记录（operation-3～operation-78 中的 browser_* 项），声明与实际一致。
- 审核主体：本报告为模型独立审核，无人工复核记录。

## 结果汇总

| 场景 | 结果 | 说明 |
| --- | --- | --- |
| AUTH-LOGIN-001 | **passed**（附限制，见「审核发现」1、2） | 4 条原期望均有实际观察支持 |

## 逐条期望核对（Reviewer 判断）

### 期望 1「刷新后显示同一用户」——确认通过
- 浏览器注册合成账号后进入登录态（operation-11 快照显示 `YOU ARE IN`、昵称与登录邮箱；`auth-login-001-01-registered.png` 目视确认昵称 `luowang-…XP-nick`、邮箱 `luowang-01m3zxkqa802s7zk3kxtb733xp@example.test`）。
- 整页 `browser_navigate` 到 `/`（operation-13，03:43:26）后仍显示同一用户（operation-15；`auth-login-001-02-refreshed.png`）；另有一次登录态整页刷新仍为同一用户（operation-52→operation-54、`auth-login-001-03-browser-logged-in-refreshed.png`）。
- 02 与 03 两张截图 sha256 相同（`ea3e5deb…`），为同一状态的不同取证，非两次独立刷新，已按此理解。

### 期望 2「退出后页面回到登录状态」——确认通过
- 浏览器点击「退出登录」后回到「登录 Cynos」表单并提示「已安全退出」（operation-30→32、operation-40→41、operation-56→57；`auth-login-001-04-browser-after-logout.png` 目视确认）。
- 退出后再整页刷新仍停留在登录页（operation-69→72，快照无遗留会话）。

### 期望 3「退出后的 Session 访问受保护接口返回 401」——确认通过（证据来自受控 HTTP 单账号链路）
- 同一 clientId `align-a` / 合成账号 `…XP-align`：
  1. 注册即登录成功（operation-44，201 / `authenticated:true`）；
  2. 固化会话快照 `sessionSnapshotId=c65984729f6f61946fbf72ffc3506d9a`、`cookieNames:["cynos_session"]`（operation-59）；
  3. **正对照**：`GET /api/me` → **200**，`sentCookieNames:["cynos_session"]`，`savedSessionEvidenceId=operation-59.json`（operation-60）；
  4. `POST /api/auth/logout` → 200 `{authenticated:false}`（operation-61）；
  5. **同一快照重放**：`GET /api/me` → **401** `UNAUTHORIZED 请先登录`，`sentCookieNames:["cynos_session"]`，`savedSessionEvidenceId=operation-59.json`（operation-62）。
- 判定依据：正对照 200 与重放 401 取自同一 `sessionSnapshotId`，且重放请求回传携带 Cookie 名并与保存证据绑定；因此「无 Cookie 客户端导致的 401」这一弱解释被正对照排除，401 可归因于服务端撤销该会话。满足计划 §7 判定口径与「禁止用无 Cookie/重新登录替代原会话重放」的约束。
- 限制：该链路所属账号（align）并非浏览器侧执行注册/退出点击的账号（nick），详见「审核发现」1。

### 期望 4「删除测试账号后旧 Session 和原凭据均不可用」——确认通过
- 同一 clientId `align-del`：退出后以原凭据重新登录 **200**（operation-63）→ 固化新会话 `63a9fa35c5c6df8b830238f3514902cb`（operation-64）→ 正对照 `GET /api/me` **200**（operation-65）→ `DELETE /api/me` **200 `{deleted:true}`**（operation-66）→ 同一快照重放 **401**（operation-67）→ 原凭据再登录 **401 `INVALID_CREDENTIALS`**（operation-68）。
- 浏览器侧：nick 账号登录态点击「删除测试账号」后回到登录页并提示「测试账号及其会话已删除。」（operation-76→77；`auth-login-001-05-browser-after-delete.png` 目视确认）。
- 一致性旁证：另一合成账号 probe 经受控 HTTP 删除（operation-79）后原凭据登录 401（operation-80）。
- 401 归因核对：删除前后使用同一凭据（操作前 200、操作后 401），且返回码为 `INVALID_CREDENTIALS` 而非 `RATE_LIMITED`，可排除限流误判。

### 「需要记录」项核对
- 登录/刷新用户资料：operation-11/15/51/54 及 01/02/03 截图。✔
- 退出前后 HTTP 状态：operation-60（200）/62（401）。✔
- Cookie 属性：`cynos_session` `httpOnly:true`、`sameSite:Strict`、`path:/`、`secure:false`（operation-14、operation-53）；Cookie 原文未落盘。✔（场景只要求 HttpOnly 与 SameSite=Strict，二者成立；`secure:false` 与计划所引 `cookieOptions` 一致，不构成本场景期望的缺口。）
- 固化会话破坏前后两段结果 + 携带绑定证据：operation-59/60/61/62 与 operation-64/65/66/67。✔
- 删除后提示、旧会话重放、原凭据结果：operation-66/67/68、operation-77、operation-79/80。✔
- 合成账号登记标识与清理核验：execution.md 列出 3 个 `luowang-01M3ZXKQA802S7ZK3KXTB733XP-` 前缀账号及各自删除操作；最终清理核验明确留给 Harness，执行记录未抢先声明清理完成。✔（清理成败不属本次判定，按约定不计入结论。）

## 场景与计划核对

- **维护声明成立**：`scenario-changes.patch` 确为 `docs/scenario-testing/scenarios/AUTH-LOGIN-001.md` 的 modify；动态上下文的 `selectedScenarioSnapshot` 正文与 patch 后版本逐条一致（前置改为本 Run 合成账号、步骤 4/7 加入破坏前 200 正对照、步骤 6/8 改为同一固化会话重放、需要记录补两段结果与绑定证据）；场景 ID 与四条原期望未被改动，与计划 §5 声明相符。
- **计划与场景不冲突**：期望中「退出后的 Session 访问受保护接口返回 401」与计划 §7 步骤 5「用该 clientId `POST /api/auth/logout` 撤销该固化会话」不矛盾，Runner 据此执行不构成擅自放宽。
- **Runner 未越权**：未对使用 `GET /api/auth/status`（operation-19）等辅助探测作通过判据；`accountStorage` 不可用未影响本场景判定，未重复探测。

## 审核发现（问题 / 限制，均不影响上述四条期望成立，但需如实交接）

1. **浏览器侧与受控 HTTP 侧无法共用同一账号同口令，导致「浏览器退出点击」与其「原会话重放」分属不同账号。**
   - 可观察事实（Reviewer 观察）：受控 HTTP 以浏览器注册账号登录两次均 401 `INVALID_CREDENTIALS`（operation-17、operation-27），而同账号在浏览器内以注册时同一口令引用（`credential-b51203148a16bb68c7ca8e19d07e9124`）登录成功（operation-33→38、operation-49→50、operation-71→74）；HTTP 注册的 probe/align 账号在 HTTP 路径登录正常（operation-22、operation-63）。
   - Runner 的解释（属其推断，非直接可核）：Playwright MCP 表单按字面量填入占位符、`request_test_http` 会替换为真实口令，故同一口令无法跨两条路径使用。证据只能支持「两条路径使用的口令值确实不同」这一现象，不能直接证明其成因；该成因解释应作为 Runner 的推断引用，不作为已确证事实。
   - 影响：计划 §7 步骤 4 期望的「同一 clientId、与合成账号同账号」跨路径贯通未能达成；Runner 另建 HTTP 合成账号 align 闭合关键链路，并以浏览器侧承担页面级观察。破坏操作撤销服务端会话这一断言含义未变、且在同一账号内闭合（正对照 200 → 破坏 → 同一快照 401），故不构成 blocked；但「浏览器点击退出」这一具体事件的服务端会话撤销，未通过重放浏览器自身 Cookie 直接取证，属**未直接闭合的关联**，下游不应表述为「浏览器退出后的原会话已重放验证」。
2. **浏览器登录存在多次失败与重复登出，场景执行噪声较大。**
   - operation-33→36、operation-48 出现「邮箱或密码不正确」；浏览器在 op 30、40、56 三次登出、在 op 38/50/74 三次登录。这些是执行过程中的凭据/流程反复，未改变最终保留的观察；04/05 号截图与对应快照均取自成功路径后的状态。
   - 与产品缺陷的区分：失败登录的两次（op 36/48）随后均以正确凭据成功登录，且控制台 401（`console-2026-10-03T03-43-26-492Z.log`）与这些失败尝试一致；Post-delete 截图中浏览器登录框保留的邮箱为大写 RunID（`luowang-01M3ZXKQA802S7ZK3KXTB733XP@example.tes…`）而登录成功，说明登录对邮箱大小写不敏感，故未发现「注册归一化/登录大小写不一致」类产品缺陷。**本次未确认任何产品 Bug。**
3. **数据footprint 超出场景前置的「一个独立合成账号」。** 本 Run 共注册 3 个合成账号（nick 浏览器、probe、align 受控 HTTP），均带 `luowang-<RunID>-` 前缀并已登记、均已在本次执行内删除（operation-66、76、79）。不影响期望判定，但扩大了清理依赖面，由 Harness 收尾统一核验。
4. **execution.md 的口径核对**：其汇总表、结果顺序（期望 1→4）与我依据原始证据的判断一致；「未复现历史 Issue #3」与 operation-62/67 的 401 结果一致；「未见 429」与全部受控 HTTP 记录一致。其「关键执行偏差」段落对上述第 1 项的记录属实，但「口令字面量为占位符」的因果表述应降级为解释而非结论（见第 1 项）。执行记录中出现的 `[REDACTED]` 为占位符本身，未复述任何真实凭据值。

## 覆盖缺口与未验证项

- 浏览器自身会话（nick 的 `cynos_session`）退出后的重放未取证；expectation 3 的 401 证据来自 align 账号。该缺口已按第 1 项记录，不影响本批 API 行为结论，但若需回答「浏览器点击退出是否也撤销了浏览器原会话」，应另行授权执行。
- 浏览器侧删除（nick）后未再尝试其原凭据登录（该情形由 align 账号的同端点证据覆盖）。
- `accountStorage` 不可用，未做持久层读回；本场景期望不依赖该能力。
- 测试数据清理成败由 Harness 在最终 Main 后处理，不在本次审核范围；本报告不提交任何清理完成声明。
- 时间口径：各 operation 与页面快照文件名时间同源于本 Run 的 Harness 时钟（如 operation-13 `03:43:26.491Z` 对应 `page-2026-10-03T03-43-26-524Z.yml`），足以支撑操作前后顺序判断，但不用于推断真实服务器时钟。

## 结论

`AUTH-LOGIN-001` 判 **passed**：四条原期望均有直接实际观察支持，退出与删除的服务端会话撤销均在单账号内以「正对照 200 → 破坏操作 → 同一 `sessionSnapshotId` 重放 401」闭合，删除后原凭据登录亦被拒。同时保留上述限制：浏览器点击退出与受控 HTTP 重放分属不同账号、浏览器自身会话未经重放取证；本批**未确认任何产品缺陷**，无 base/diff，不作「已修复」归因。
