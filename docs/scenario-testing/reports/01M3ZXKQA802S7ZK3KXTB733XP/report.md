---
run_id: 01M3ZXKQA802S7ZK3KXTB733XP
trigger: manual
base_commit: null
target_commit: 737ad8db8b34abc618bf7d80bc30b05ccc22b7a3
included_commits: []
result: passed
started_at: 2026-10-03T03:41:04.990Z
finished_at: 2026-10-03T03:47:41.043Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: passed
confirmed_bugs: []
---

# 测试报告：AUTH-LOGIN-001 登录状态恢复（退出/删除的服务端会话撤销核对）

- Run: `01M3ZXKQA802S7ZK3KXTB733XP`（`trigger = manual`，`scenarioMode = autonomous`，`initialization = false`）
- 固定 `targetCommit = 737ad8db8b34abc618bf7d80bc30b05ccc22b7a3`；`baseCommit = null`，`includedCommits = []`。
- 本批**不是变更驱动**：无 base/diff，属对既有 approved 核心场景的手工回归，不作逐提交归因，**不声称任何「已修复」**。
- 计划哈希（plan.md 内嵌元数据）`35684a643b9014f1053729ad6e679d05222e1960951609c6006e64ea9780c4c1`；`browserRequired = true`。
- 结果来源：本报告整理本次 `plan.md`、`review.md` 与动态 Run 上下文。逐场景结论引自 Reviewer 的独立审核；本角色不重新分析原始证据、不重做测试规划。

## 范围与执行集合

计划正式执行集合（`## execution_scenarios`）只有一项，顺序即执行顺序：

1. `AUTH-LOGIN-001`

执行与审核一致：`scenario-progress` 的 `start_scenario` / `finish_scenario`（`completed: ["AUTH-LOGIN-001"]`）与该清单一致（Reviewer 核对结论）。本次未执行 `AUTH-ACCOUNT-001`、`AUTH-ACCESS-001`、`AUTH-LOGIN-002`、`AUTH-REGISTRATION-001/002/003` 及 draft `AUTH-SECURITY-001/002`；**本次结论不构成上述场景或整个模块的覆盖完整性声明**。

场景资产：本次为既有 approved 场景 `AUTH-LOGIN-001` 的方法澄清（modify，路径 `docs/scenario-testing/scenarios/AUTH-LOGIN-001.md`），场景 ID 与四条原期望保持不变。初始化 patch 在本角色不可读（`scenario-changes.patch` 读取被拒绝），其内容与一致性由 Reviewer 依据 `query_source_reads` 与 `scenario-changes.patch` 核对并交付，见「场景资产核对」。

## 逐场景结果

| 场景 | 结果 | 依据（Reviewer 独立审核） |
| --- | --- | --- |
| AUTH-LOGIN-001 | passed（附限制，见「保留的限制与未闭合项」） | 四条原期望均有实际观察支持 |

`result = passed` 依据 Reviewer 交付的逐条判定；优先级 `blocked > failed > passed` 下无更高优先级情形（`blockingReasons` 为空）。本批**未确认任何产品 Bug**，故 `confirmed_bugs` 为空，**无 Issue create/link 决策**；同时本批无 Issue 候选查询需求，故不存在 Issue 查询覆盖缺口声明（未做任何查询不等于「查无重复 Issue」，也不作跨 Run 无重复的保证）。

## 期望核对（引自 Reviewer 的逐条判断）

以下四项判定均归 Reviewer；本角色仅整理，未重新判定期望适用性。

1. **刷新后显示同一用户——确认通过。** 浏览器注册合成账号后进入登录态，整页导航/刷新后仍显示同一用户（operation-13/15、operation-52→54；`auth-login-001-01-registered.png`、`auth-login-001-02-refreshed.png`、`auth-login-001-03-browser-logged-in-refreshed.png`）。Reviewer 指出 02 与 03 两张截图 sha256 相同（`ea3e5deb…`），为同一状态的不同取证，**不是两次独立刷新**，已按此口径理解。
2. **退出后页面回到登录状态——确认通过。** 浏览器点击退出后回到登录表单并提示已安全退出（operation-30→32、40→41、56→57；`auth-login-001-04-browser-after-logout.png`）；退出后再整页刷新仍停留在登录页（operation-69→72）。
3. **退出后的 Session 访问受保护接口返回 401——确认通过（证据来自受控 HTTP 单账号链路）。** 同一 clientId（`align-a`，合成账号昵称以 `…XP-align` 结尾）：注册即登录成功（operation-44）→ 固化会话 `sessionSnapshotId=c65984729f6f61946fbf72ffc3506d9a`，`cookieNames:["cynos_session"]`（operation-59）→ **正对照** `GET /api/me` **200**，`sentCookieNames:["cynos_session"]`，`savedSessionEvidenceId=operation-59.json`（operation-60）→ `POST /api/auth/logout` 200 `{authenticated:false}`（operation-61）→ **同一快照重放** `GET /api/me` **401**，同样携带 `cynos_session` 并绑定保存证据（operation-62）。Reviewer 判定：正对照 200 与重放 401 取自同一 `sessionSnapshotId` 且回传携带 Cookie 名并与保存证据绑定，因此「无 Cookie 客户端导致的 401」这一弱解释被排除，401 可归因于服务端撤销该会话，满足计划判定口径与「禁止用无 Cookie 客户端/重新登录替代原会话重放」的约束。
4. **删除测试账号后旧 Session 和原凭据均不可用——确认通过。** 同一 clientId `align-del`：退出后以原凭据重新登录 200（operation-63）→ 固化新会话 `63a9fa35c5c6df8b830238f3514902cb`（operation-64）→ 正对照 `GET /api/me` 200（operation-65）→ `DELETE /api/me` 200 `{deleted:true}`（operation-66）→ 同一快照重放 401（operation-67）→ 原凭据再登录 401 `INVALID_CREDENTIALS`（operation-68）。浏览器侧：点击删除后回到登录页并提示测试账号及其会话已删除（operation-76→77；`auth-login-001-05-browser-after-delete.png`）。Reviewer 的归因核对：删除前后使用同一凭据（操作前 200、操作后 401），返回 `INVALID_CREDENTIALS` 而非 `RATE_LIMITED`，可排除限流误判。

「需要记录」项由 Reviewer 逐项核对为齐全：登录/刷新用户资料、退出前后 HTTP 状态、Cookie 属性（`cynos_session` `httpOnly:true`、`sameSite:Strict`、`path:/`、`secure:false`；Cookie 原文未落盘）、固化会话破坏前后两段结果与携带绑定证据、删除后提示/旧会话重放/原凭据结果、合成账号登记标识与清理核验。Reviewer 说明：场景只要求 HttpOnly 与 SameSite=Strict，二者成立；`secure:false` 与计划所引 `cookieOptions` 一致，不构成本场景期望缺口。

## 保留的限制与未闭合项（Reviewer 交付，逐项保留）

1. **浏览器点击退出与受控 HTTP 重放分属不同账号。** 依 Reviewer 观察：受控 HTTP 以浏览器注册账号登录两次均 401 `INVALID_CREDENTIALS`（operation-17、27），而同账号在浏览器内以注册时同一口令引用登录成功（operation-33→38、49→50、71→74），HTTP 注册的 probe/align 账号在 HTTP 路径登录正常（operation-22、63）。Runner 给出的成因解释（浏览器表单按字面量填入占位符、`request_test_http` 替换为真实口令）**属其推断，非已确证事实**；证据只支持「两条路径使用的口令值确实不同」。影响：计划 §7 步骤 4 期望的「同一 clientId、与合成账号同账号」跨路径贯通未能达成。Reviewer 判定：破坏操作撤销服务端会话这一断言含义未变，且在同一账号内闭合（正对照 200 → 破坏 → 同一快照 401），故不构成 blocked；但**「浏览器点击退出」这一具体事件的服务端会话撤销，未通过重放浏览器自身 Cookie 直接取证，属未直接闭合的关联**。下游不得表述为「浏览器退出后的原会话已重放验证」。
2. **浏览器自身会话（浏览器侧账号的 `cynos_session`）退出后的重放未取证。** 期望 3 的 401 证据来自受控 HTTP 账号。若需回答「浏览器点击退出是否也撤销了浏览器原会话」，需另行授权执行。
3. **浏览器侧删除后未再尝试其原凭据登录**；该情形由同一受控 HTTP 账号在同一端点上的证据覆盖。
4. **浏览器登录存在多次失败与重复登出，执行噪声较大**（Reviewer 记录：operation-33→36、48 出现凭据不正确；op 30/40/56 三次登出、op 38/50/74 三次登录）。Reviewer 判定这些未改变最终保留的观察，且失败后均以正确凭据成功登录；控制台 401 与失败尝试一致；删除后截图中浏览器登录框保留大写 RunID 邮箱而登录成功，说明登录对邮箱大小写不敏感，故**未发现「注册归一化/登录大小写不一致」类产品缺陷**。Reviewer 结论：本次**未确认任何产品 Bug**。
5. **数据 footprint 超出场景前置的「一个独立合成账号」**：本 Run 共注册 3 个带 `luowang-<RunID>-` 前缀的合成账号（浏览器侧、probe、align），均已在本次执行内删除（operation-66、76、79），不影响期望判定，但扩大了清理依赖面。账号字段与凭据值不在本报告复述。
6. **时间口径（Reviewer）**：各 operation 与页面快照文件名时间同源于本 Run 的 Harness 时钟（如 operation-13 `03:43:26.491Z` 对应 `page-2026-10-03T03-43-26-524Z.yml`），足以支撑操作前后顺序判断，**不用于推断真实服务器时钟**；本报告中的 `started_at`/`finished_at` 逐字取自动态 Run 上下文。
7. **`accountStorage.status = unavailable`（`unsupported_endpoint`）**：未做持久层读回；本场景期望不依赖该能力，未重复探测。
8. **清理**：测试数据清理由 Harness 在本 Session 结束后统一处理，本次执行记录与审核均**未提前声明清理完成**；清理成败不属于本报告测试结论。
9. **人工复核**：本报告与本次审核均为模型产出，**无人工复核记录**；本流程中模型看图或触发 Run 不代表人工已复核。

## 场景资产核对

- Reviewer 核对成立：`scenario-changes.patch` 确为 `docs/scenario-testing/scenarios/AUTH-LOGIN-001.md` 的 modify；patch 后版本与场景快照逐条一致（前置改为本 Run 独立合成账号、步骤 4/7 加入破坏前 200 正对照、步骤 6/8 改为同一固化会话重放、需要记录补两段结果与绑定证据）；场景 ID 与四条原期望未被改动，与计划声明相符。
- 该 patch 在本角色不可读，上述内容依据 Reviewer 交付，不属本角色独立核对。
- 场景资产维护需求本身不冒充产品 Bug：本批无 confirmed Bug，`confirmed_bugs` 为空。

## 证据与观察归属

- Reviewer 判定所引操作记录（`operation-*`）、页面快照（`page-*.yml`）、控制台日志与截图文件，均来自其独立审核交付。
- 本次动态上下文列出的证据文件包含 5 张页面截图（其中 `auth-login-001-05-browser-after-delete.png` 的自动 `screenshotInspection.status = detected`，其余 4 张为 `not_detected`）、1 份控制台日志、81 份 `operation-*.json` 与 15 份 `page-*.yml`；证据文件的存在或可读不单独证明某执行者在本 Run 做过对应操作，本条不超出 Reviewer 清单作额外认定。
- 浏览器的实际操作归属（`browserRequired=true` 与实际 Playwright MCP 操作记录，operation-3～78 中的 browser_* 项）由 Reviewer 核对为「声明与实际一致」。
- 本报告不引用任何测试账号字段、口令值、Secret、短期签名 URL 或绝对路径；Reviewer 亦说明其未复述任何真实凭据值。

## 未完成项与下一步

- 本次范围内无未闭合的**期望**：四条原期望均有实际观察支持，故场景判 `passed`。上述「保留的限制与未闭合项」是对**关联范围**的限定，不改变已成立的逐条结论。
- 若要闭合「浏览器点击退出/浏览器侧删除是否也撤销浏览器自身会话」，需另行授权执行（使用同一浏览器会话的崩溃/重放取证）。该执行需要新的授权与操作范围确认，**不属于本次现有权限**。
- 若要扩展删除路径覆盖（如两条独立会话同时失效），计划中已指明 `AUTH-ACCOUNT-001` 可作后续独立回归，同样需另行安排。
- 本批未复现历史 Issue（退出未撤销服务端 Session）相关现象：Reviewer 记录 operation-62/67 的 401 结果与其一致；因无 base/diff，**不作「已修复」归因**。
- 发布状态与测试结果分别表达：本次仅说明 `AUTH-LOGIN-001` 在固定 target 上通过，**不构成可发布或整个项目无问题的结论**。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1jb3JyZWN0aW9uLTIwMjYxMDAzL3Byb2plY3RzL2I2MmE3MTUzLWVlZjAtNDk0OC05ODMyLWE5YzBlZjJhNWRjMi9ydW5zLzAxTTNaWEtRQTgwMlM3WkszS1hUQjczM1hQL2F1dGgtbG9naW4tMDAxLTAxLXJlZ2lzdGVyZWQucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1jb3JyZWN0aW9uLTIwMjYxMDAzL3Byb2plY3RzL2I2MmE3MTUzLWVlZjAtNDk0OC05ODMyLWE5YzBlZjJhNWRjMi9ydW5zLzAxTTNaWEtRQTgwMlM3WkszS1hUQjczM1hQL2F1dGgtbG9naW4tMDAxLTAyLXJlZnJlc2hlZC5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1jb3JyZWN0aW9uLTIwMjYxMDAzL3Byb2plY3RzL2I2MmE3MTUzLWVlZjAtNDk0OC05ODMyLWE5YzBlZjJhNWRjMi9ydW5zLzAxTTNaWEtRQTgwMlM3WkszS1hUQjczM1hQL2F1dGgtbG9naW4tMDAxLTAzLWJyb3dzZXItbG9nZ2VkLWluLXJlZnJlc2hlZC5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 4](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1jb3JyZWN0aW9uLTIwMjYxMDAzL3Byb2plY3RzL2I2MmE3MTUzLWVlZjAtNDk0OC05ODMyLWE5YzBlZjJhNWRjMi9ydW5zLzAxTTNaWEtRQTgwMlM3WkszS1hUQjczM1hQL2F1dGgtbG9naW4tMDAxLTA0LWJyb3dzZXItYWZ0ZXItbG9nb3V0LnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 5](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1jb3JyZWN0aW9uLTIwMjYxMDAzL3Byb2plY3RzL2I2MmE3MTUzLWVlZjAtNDk0OC05ODMyLWE5YzBlZjJhNWRjMi9ydW5zLzAxTTNaWEtRQTgwMlM3WkszS1hUQjczM1hQL2F1dGgtbG9naW4tMDAxLTA1LWJyb3dzZXItYWZ0ZXItZGVsZXRlLnBuZw>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 3 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3ZXKQA802S7ZK3KXTB733XP-account · run-scoped-http-cleanup · 2026-10-03T03:48:01.679Z · absent=true · sha256 03c2309daf8cc8a8c2b5dd038a5ba30f326429a84b52b4f15ade43c64c0f4be1

独立核验：luowang-01M3ZXKQA802S7ZK3KXTB733XP-probe · run-scoped-http-cleanup · 2026-10-03T03:48:01.680Z · absent=true · sha256 03c2309daf8cc8a8c2b5dd038a5ba30f326429a84b52b4f15ade43c64c0f4be1

独立核验：luowang-01M3ZXKQA802S7ZK3KXTB733XP-align · run-scoped-http-cleanup · 2026-10-03T03:48:01.682Z · absent=true · sha256 03c2309daf8cc8a8c2b5dd038a5ba30f326429a84b52b4f15ade43c64c0f4be1
