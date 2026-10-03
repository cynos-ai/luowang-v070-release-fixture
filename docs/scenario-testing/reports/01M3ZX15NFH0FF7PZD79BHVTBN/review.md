# 审核记录：认证核心场景回归（AUTH-LOGIN-001、AUTH-REGISTRATION-001）

审核对象：Run `01M3ZX15NFH0FF7PZD79BHVTBN`，targetCommit `909d467f1ad5cecf7b42e97788e461fa99f086d6`（`baseCommit=null`、`includedCommits=[]`）。
审核依据：`plan.md`（planHash `dceb0968f413c427bd9f93c03eeb0325bd2a1e2d283cadf12024eea26cc45438`，与计划头部 Harness 元数据一致）、动态上下文 `selectedScenarioSnapshot`（两份场景正文，`redacted:false`）、`list_evidence_files` + 85 份 operation 回执、浏览器快照/console 日志、8 张截图。`scenario-changes.patch` 不存在，与计划 `scenarioChanges=null`、`execution_scenarios` 仅两条主线一致。

## 1. 执行集与执行真实性

- 正式执行集只有计划唯一 `## execution_scenarios` 的两行，顺序即 `AUTH-LOGIN-001` → `AUTH-REGISTRATION-001`。
- 场景进度回执证明确实按此顺序执行：`begin_scenario_execution`（operation-3）→ `start_scenario AUTH-LOGIN-001`（operation-4）→ … → `finish_scenario`（operation-63，completed=[AUTH-LOGIN-001]）→ `start_scenario AUTH-REGISTRATION-001`（operation-64）→ … → `finish_scenario`（operation-85，completed=[AUTH-LOGIN-001,AUTH-REGISTRATION-001]）。无场景交叉。
- `browserRequired=true` 且确有浏览器执行：85 份回执均为 `source=playwright-mcp-tool-result` 的实际工具调用（`browser_navigate`/`browser_click`/`browser_fill_form`/`browser_cookie_*`/截图），并产出 MCP 命名快照与截图，非仅快照/日志的预置材料。声明与执行相符。
- 运行地址与应用：`http://luowang-rr-live-r2-node-app:3100`，非生产域，符合请求约束。

## 2. 逐场景结果

### AUTH-LOGIN-001 登录状态恢复 — passed

场景四条明列期望逐条核对（原文见 frozen snapshot）：

1. **刷新后显示同一用户 — 通过。**
   注册后进入欢迎态（`page-2026-10-03T03-32-03-143Z.yml`，operation-17；截图 `login-01-created-welcome.png`）。整页加载 `/` 后快照仍为同一用户（`page-2026-10-03T03-32-11-478Z.yml`，operation-24；截图 `login-02-after-reload-same-user.png`），且 `GET /api/auth/status` 返回 `authenticated:true` 且 user 与之一致（`page-2026-10-03T03-32-09-298Z.yml`，operation-22）。两张截图独立确认为同一 Run 前缀昵称/邮箱。
2. **退出后页面回到登录状态 — 通过。**
   点击「退出登录」后快照回到登录表单并提示「已安全退出。」（`page-2026-10-03T03-32-14-993Z.yml`，operation-28）；截图 `login-03-after-logout-login-view.png`（operation-41）为登录视图。
3. **退出后原 Session 访问受保护接口返回 401，且确实携带原 Cookie — 通过。**
   退出前固化 `cynos_session`（operation-19/20，observed-browser 引用 `credential-78b19f…`）；退出后经 `browser_cookie_set` 写回同引用（operation-30，restore-input `credential-78b19f…`），`browser_cookie_get` 确认存在（operation-31，observed-browser 同引用）；随后 `GET /api/me` 返回 401，响应体 `{"error":{"code":"UNAUTHORIZED",...,"requestId":"req-1i"}}`（`page-2026-10-03T03-32-20-204Z.yml`，operation-33/34）。**关键点**：operation-35 的请求详情显示请求头 `cookie: [REDACTED]` 且 `credentialReferences` 为 `observed-request-header` 引用 `credential-78b19f…`，与退出前固化引用一致——排除「无 Cookie 的 401」这一弱解释。该期望未降级。
4. **删除测试账号后旧 Session 与原凭据均不可用 — 通过。**
   重新登录获得新会话（operation-44，引用 `credential-d475726a…`；欢迎态 operation-45）。从欢迎页删除账号后页面回登录态并提示「测试账号及其会话已删除。」（`page-2026-10-03T03-32-32-440Z.yml`，operation-47；截图 `login-04-account-deleted.png`）。删除后写回该会话 Cookie（operation-50/51，引用 `credential-d475726a…`）并请求 `GET /api/me` → 401（operation-53），请求详情请求头含该 Cookie（operation-54，`observed-request-header` 引用 `credential-d475726a…`）。原凭据再登录被拒：页面「邮箱或密码不正确」（operation-61），`/api/auth/login` 记录 401（`console-2026-10-03T03-32-41-037Z.log`，operation-60），截图 `login-05-original-credentials-rejected.png`。

辅助记录（非通过条件）亦可见：`cynos_session` 属性 `httpOnly:true`、`sameSite:Strict`、`secure:false`（operation-20/31/51），满足场景「需要记录」。四条适用期望均有充分实际观察支持，**判 passed**。

### AUTH-REGISTRATION-001 新用户注册 — blocked（已确认成功项保留）

1. **页面显示欢迎信息 — 通过。** 提交后进入欢迎态（`page-2026-10-03T03-32-55-691Z.yml`，operation-71；截图 `reg-01-welcome.png`）。
2. **`GET /api/auth/status` 返回已登录用户 — 通过。** `authenticated:true`，user（`ee1379de-…`、`…-register@example.test`）与欢迎态同一（`page-2026-10-03T03-32-59-563Z.yml`，operation-74）。
3. **数据库不保存明文密码 — 未验证。** Run 上下文 `accountStorage.status=unavailable`（`reason=unsupported_endpoint`，观测 `2026-10-03T03:30:59.220Z`），本轮无持久层读回能力；页面文案与响应体不含明文均不能替代持久层观察。该明列期望无运行时证据，属验证能力不足而非期望不适用，**该场景整体 blocked**，期望 1/2/4 的成功项保留。
4. **删除账号后原邮箱密码不能再登录 — 通过。** 删除后回登录态并提示「测试账号及其会话已删除。」（`page-2026-10-03T03-33-04-122Z.yml`，operation-78；截图 `reg-02-account-deleted.png`）；原邮箱+密码登录被拒「邮箱或密码不正确」（operation-83），`/api/auth/login` 记录 401（`console-2026-10-03T03-33-01-570Z.log`，operation-82），截图 `reg-03-original-credentials-rejected.png`。

## 3. 已确认产品问题

本批未发现产品缺陷：两条场景中所有取得运行时证据的明列期望均与产品期望一致，无 failed 期望。历史 Issue #3/#4 在本轮未复现（退出后原 Cookie 重放 401；注册欢迎态标题显示 Run 前缀昵称）——**此为本 Run 的观察，不构成「已修复」声明**（无 base/diff，不作逐提交归因）。

## 4. 对 Runner 报告的核对

- Runner 的逐场景结论（LOGIN-001 passed、REGISTRATION-001 blocked）与本人独立证据判断一致；通过/阻断项、证据引用均可对上原始回执。
- 两处叙述需限定（不影响产品结果）：
  - 报告 §3 步骤 6 称「浏览器 Cookie 列表返回 `No cookies found`（证据 operation-27）」。operation-27 回执的 `output` 为「Output omitted」，本人无法从可读证据看到该字面输出；仅能确认该次 `browser_cookie_list` 未返回任何 `credentialReferences`（与退出清 Cookie 一致）。该细节属对期望 2 的辅助说明，不影响期望 2 由 operation-28 快照与 `login-03` 截图成立。
  - 报告称注册欢迎态「显示所输入 Run 前缀昵称」。操作回执中 displayName 为 `[REDACTED]`；`reg-01-welcome.png` 画面显示用户名 `luowang-01M3ZX15NFH0FF7PZD79BHVTBN-register`，可确认带 Run 前缀，但被脱敏部分无法逐字符比对等于输入昵称。此为历史 Issue 观察的支撑力度限制，非场景期望。
- 报告 §7「未完成项/缺口」「§8 清理状态」表述与本人核对一致；清理交由 Harness 收尾，未在本审核判定。

## 5. 执行方式偏差说明（不影响适用期望成立）

- 计划前置授权的合成账号建立方式为新建带 Run 前缀账号。Runner 在 `AUTH-LOGIN-001` 中先以预置凭据尝试登录失败（`page-2026-10-03T03-31-56-263Z.yml`，operation-12；`console-2026-10-03T03-31-50-114Z.log`，operation-11，均为 setup 观察，非场景期望），改为注册建立会话（operation-15/16/17），随后在「重新登录」与「删除后原凭据登录」两处均走了真实登录表单（operation-42/43、operation-58/59/61）。场景步骤「使用测试账户登录」的意图（会话建立与会话持久化）有覆盖，登录路径亦被实际执行，判为可接受的等价方式。
- 「刷新」以受控整页导航到同源 `/` 实现（计划 §4 明确允许），未改变测试对象或断言含义。
- 工具参数被拒（operation-9/29/36 因 `ref`/整对象 `cookie` 传参不符 schema 报错）属操作方式调整，被拒回执未被用作业务结论。

## 6. 覆盖缺口与无法确认项

- `AUTH-REGISTRATION-001` 期望 3「数据库不保存明文密码」缺持久层运行时证据（`accountStorage` 不可用），为 `AUTH-REGISTRATION-001` 判 blocked 的直接原因；可行下一步：由具备持久层/受控存储观察能力的角色读回该测试账号行确认密码列为哈希。REST 响应与代码阅读不能替代。
- 本批仅执行计划选定的两个场景；`AUTH-ACCESS-001`、`AUTH-ACCOUNT-001`、`AUTH-LOGIN-002`、`AUTH-REGISTRATION-002/003` 与 draft 场景未执行，结论不代表认证模块整体覆盖完整或项目整体无问题。
- 无 base/diff，不作逐提交归因，不写「已修复」。
- 截图均为页面级可视范围；画面未完整展示即不据此声称控件全部可见或不可见（`login-01/02/03`、`reg-01/02` 标注「范围内未检测到可见表单值」，`login-04/05`、`reg-03` 含可见表单值）。
- 未在本审核中判定测试数据收尾清理结果（Harness 于最终 Main 后处理）；两条合成账号已在场景业务步骤内删除并有页面提示佐证。

## 7. 审核结论汇总

| 场景 | 结果 | 关键依据 |
| --- | --- | --- |
| AUTH-LOGIN-001 | passed | operation-22/24（刷新同一用户）、operation-28/41（退出回登录态）、operation-30/31/33/34/35（原 Cookie 重放 401 且请求头携带原 Cookie）、operation-50/51/53/54 与 operation-60/61（删除后旧会话 401、原凭据被拒） |
| AUTH-REGISTRATION-001 | blocked | operation-71（欢迎态）、operation-74（auth/status 已登录）、operation-78/82/83（删除后原凭据被拒）通过；期望 3「数据库不保存明文密码」无运行时证据 |

本批 2 个场景：1 passed、1 blocked、0 failed；已确认产品 Bug：无。
