---
run_id: 01M3NP2Y9YYCK7122EJMWT39XA
trigger: manual
base_commit: 7bb8b1b9f63be01414198703e715b005b7964d00
target_commit: d0e3542de268e5552fa15bbd23c58fa9876353bd
included_commits:
  - 1b6baef04032fae31934ac8a70724f6d43448685
  - d0e3542de268e5552fa15bbd23c58fa9876353bd
result: failed
started_at: 2026-09-29T04:17:19.624Z
finished_at: 2026-09-29T04:22:56.247Z
scenario_results:
  - id: AUTH-REGISTRATION-001
    result: failed
  - id: AUTH-LOGIN-001
    result: failed
confirmed_bugs:
  - key: register-response-displayname-not-input-nickname
    title: 注册成功响应与首次 Welcome 未保留输入昵称（显示硬编码错误昵称）
    scenario_ids:
      - AUTH-REGISTRATION-001
    issue_action: create
  - key: logout-does-not-revoke-server-session
    title: 退出登录未撤销服务端 Session：携带退出前 Cookie 请求 /api/me 仍返回 200
    scenario_ids:
      - AUTH-LOGIN-001
    issue_action: create
---

# 最终报告：受控双缺陷验收（AUTH-REGISTRATION-001、AUTH-LOGIN-001）

## 0. 汇总依据与范围

- Run `01M3NP2Y9YYCK7122EJMWT39XA`，`trigger = manual`，`scenarioMode = review-all`，`initialization = false`，`scenarioChanges = null`，`blockingReasons = []`。
- 固定版本：`base = 7bb8b1b9f63be01414198703e715b005b7964d00`，`target = d0e3542de268e5552fa15bbd23c58fa9876353bd`，`includedCommits = [1b6baef04032fae31934ac8a70724f6d43448685, d0e3542de268e5552fa15bbd23c58fa9876353bd]`。
- 本报告只整理 `plan.md` 与 `review.md` 已交付的内容，不重做执行或证据审核。`scenario-changes.patch` 不存在（计划声明本轮不写 patch）；该事实与审核 §0「patch 不存在」一致。
- 执行集合唯一来源为计划的 `## execution_scenarios`：`AUTH-REGISTRATION-001`、`AUTH-LOGIN-001`，报告 `scenario_results` 与之一致且同序。
- 结果聚合规则：blocked > failed > passed。两个场景的适用期望中均存在已被独立证实的功能违反，故二者均为 `failed`，Run 整体 `result = failed`；`blockingReasons` 为空，不触发 blocked 聚合。
- 请求限定：本轮只执行上述两个既有 approved 场景，未修改任何场景文件；其余 approved（AUTH-ACCESS-001、AUTH-ACCOUNT-001、AUTH-REGISTRATION-002/003、AUTH-LOGIN-002）与全部 draft 场景本轮不执行，**本轮结论不代表认证模块整体覆盖完整**。

## 1. 测试范围与执行情况

- 被测对象：被测试的非生产站点（计划声明 `requiresBrowser = true`，由 Runner 以真实浏览器完成导航、填表、Cookie 读取与请求发起）。
- 计划 §7 的证据优先级：真实浏览器操作记录 > 页面快照/截图 > 受控 HTTP 观察；两项缺陷分别要求「注册响应体 + 首次 Welcome 的同源观察」与「携带退出前原 Cookie 的受控请求证据」。
- 证据清单：动态 Run 上下文与审核 §0 一致，共 90 件——3 张截图、2 份 console 日志、69 条 operation 记录、16 份 page 快照。**本报告不单独核实证据内容**，以下引用取自审核 §6 的稳定引用；其中 `operation-*`/`page-*` 为审核列出的证据 ID，执行归属与内容观察分别见审核第 1 节。
- 计划与审核共同记载：`confirm 两个 bug key 的运行时违反` 均已在被违反期望上取得证据；两个 Run 前缀账号在场景内经业务接口删除。

## 2. 逐场景结果

### 2.1 AUTH-REGISTRATION-001（新用户注册）— failed

审核交付的适用期望与实际观察（审核 §1.1）：

| 期望 | 实际观察（审核记载） | 依据其中的判定 |
| --- | --- | --- |
| 页面显示欢迎信息 | 提交注册后页面立即渲染 Welcome 卡（快照 `operation-11`、截图 `reg001-first-welcome.png`） | 字面满足 |
| 欢迎信息反映本次注册账号身份 | 首次 Welcome 显示 `你好，Controlled Wrong Name。`、头像首字母 `C`；刷新后同一账号显示为输入昵称（首字母 `L`，值受脱敏保护） | **违反** |
| `GET /api/auth/status` 返回已登录用户 | 刷新后 200，`authenticated:true`，`user.id` 与注册返回一致，`displayName` 为库值（`operation-19`/`operation-21`） | 符合 |
| 数据库不保存明文密码 | 无可用持久层观察 | **未确认（缺口）** |
| 可从欢迎页删除当前测试账号，原邮箱密码随后不能再登录 | `DELETE /api/me` 200 → 页面「测试账号及其会话已删除。」并回登录卡 → 原凭据登录 401（`operation-22`/`23`/`25`/`26`/`27`） | 符合 |

判定依据（审核交付，含其独立核对）：

- 注册成功响应体（同源受控网络记录，`operation-15`）：`POST /api/auth/register => 201 Created`，`user.email` 为本次输入的 Run 前缀邮箱，但 `user.displayName` 为 `Controlled Wrong Name`；响应头 `content-type: application/json`、`content-length: 217`（`operation-14`）。请求头 `origin/referer/host` 均指向被测站点，可确认响应来自被测应用（`operation-16`）。
- 首次 Welcome 页面（`operation-11` 快照与 `operation-12` 截图 `reg001-first-welcome.png`）独立显示同一字符串 `Controlled Wrong Name`、头像首字母 `C`，与响应体互相印证。
- 对照组：同一账号刷新后（`operation-18`/`20`）头像首字母变为 `L`、标题昵称被脱敏保护，`GET /api/auth/status` 200 返回库值昵称（`operation-21`）。审核指出：输入昵称在 Harness 脱敏规则下被识别为受控值，而 `Controlled Wrong Name` 未被脱敏，独立支持「首次 Welcome 显示的不是用户输入昵称」。
- 审核对措辞的限定（必须保留）：场景原文只有「页面显示欢迎信息」，该条**字面是满足的**；将其判为违反，依赖场景目的「使用邮箱、**昵称**和符合要求的密码创建账户」、需要记录项「**页面展示的用户昵称**」以及独立契约 `docs/changes/cynos-website-auth/spec.md` 行为 2「注册成功返回用户公开资料」三条依据合并成立。审核明确「我认可其在场景语义内成立，但请最终 Main 在成文时保留『字面措辞与解释依据』的区分，不要写成场景原文直接断言昵称等于输入值」。本报告照此保留该区分。
- 未闭合项：`数据库不保存明文密码` 无任何受控持久层观察，本报告记为**未确认**。审核说明 Runner 称 `inspect_test_account_storage` 返回不可用，但证据清单中不存在该调用的受控回执（69 条 operation 全部为 `playwright-mcp-tool-result` 或 `scenario-progress`），故该陈述在可核对范围内无法验证，只能确认「现有已捕获证据未包含持久层观察」。该未确认项**不因缺陷 A 已成立而豁免**，也不改变 failed 结论。

### 2.2 AUTH-LOGIN-001（登录状态恢复）— failed

| 期望 | 实际观察（审核记载） | 依据其中的判定 |
| --- | --- | --- |
| 刷新后显示同一用户 | 重新导航到 `/` 后页面显示同一用户、`user.id` 一致、`GET /api/auth/status` 200（`operation-40`/`41`/`42`/`43`） | 符合 |
| 退出后页面回到登录状态 | `POST /api/auth/logout` 200，页面「已安全退出。」并回登录卡（`operation-45`/`46`/`47`） | 符合 |
| 退出后的 Session 访问受保护接口返回 401 | 携带退出前原 Session Cookie 的 `GET /api/me` 返回 **200**，并渲染出该用户 JSON（`operation-55`/`56`/`57`/`51`/`53`） | **违反** |
| 删除测试账号后旧 Session 和原凭据均不可用 | 原凭据登录 401 已确证；旧 Session 仅间接观察 | **部分确认**（见下） |

缺陷 B 证据链（审核逐条核对，来源与顺序一致）：

1. 退出前固化 Cookie：`browser_cookie_get` 返回 `cynos_session`，属性 `domain` 指向被测主机、`path: /`、`httpOnly: true`、`secure: false`、`sameSite: Strict`（`operation-44`，`source: observed-browser`）。
2. 点击退出：`POST /api/auth/logout => 200`（`operation-46`），UI 回登录态（`operation-47`）。
3. 退出后再读同一 Cookie：reference 与步骤 1 完全相同（`operation-48`）→ 服务端未清理/轮换该 Cookie。
4. 退出后访问 `/api/me`：`GET /api/me => 200`（`operation-55` 以 `static:true` 取得文档导航请求），请求头 `cookie: [REDACTED]`，其 `credentialReferences` 的 reference 与步骤 1/3 相同（`operation-57`，`source: observed-request-header`）；响应头 `content-length: 220`、`date: Tue, 29 Sep 2026 04:20:26 GMT`（`operation-56`）；页面直接渲染该用户 JSON（`operation-51` 快照、`operation-53` 截图 `api-me-after-logout-replay.png`，审核已在受控工具中实际读取）。
5. 追加印证：退出后再访问 `/`，页面仍显示已登录欢迎页（`operation-59`）。

- 结论（审核）：该 reference 在 Run 内表示同一值，可确认请求携带的是退出前的原 Cookie，而服务端以 200 响应，即 logout 未撤销服务端会话；违反场景步骤 5「确认返回 401，以证明是服务端撤销了该会话」与期望「退出后的 Session 访问受保护接口返回 401」，同时违反 spec 行为 6 与验收条件「退出后同一 Session 不能访问受保护 API」。审核明确该期望**不能被降级**。
- 方法备注（审核观察，方法差异不影响判定）：计划要求「以受控手段恢复/携带原 Cookie 重放」，实际做法是先固化原 Cookie 的值引用，退出后不依赖恢复动作、由浏览器自身 Cookie 罐发出请求；因 Cookie 读值在退出前后一致且请求头 reference 与之一致，本场景要回答的问题已被直接观察到。审核另外强调：若仅依据「浏览器已无 Cookie 的普通未认证请求返回 401」则不能作为判定依据，而本次并非该情形。
- 部分确认与限制：
  - 「删除后旧 Session 不可用」：`DELETE /api/me` 200、页面提示「测试账号及其会话已删除。」（`operation-61`/`62`）足以确证账号删除；此后 `browser_cookie_list` 未返回任何 Cookie 引用（`operation-63`），审核按受控元数据判读为「浏览器侧已无该 Cookie」，但该回执 `output` 为省略态，Harness 明确提示省略/截断输出不能证明缺失，因此「旧 Session 服务端失效」**没有直接重放证据**（审核指出 Runner 引用的「No cookies found」字样在受控回执中并不存在，属其解读）。原凭据登录 401 已由 `operation-66`/`67` 与截图 `login001-deleted-relogin-401.png` 确证。整体记为**部分确认**，不改变 failed 结论。
  - Cookie 属性记录项已满足（`httpOnly: true`、`sameSite: Strict`、`secure: false` 在 http 环境可解释）；审核说明该项是「需要记录」项，不单独构成期望。
  - 步骤偏差（审核如实记录）：场景步骤 6 为「重新登录后删除当前测试账号」；由于缺陷 B 使 logout 未真正生效，账号在「仍登录」状态下被删除，未发生重新登录。审核判定该偏差改变了操作序列，但被检查的期望（删除后原凭据不可用）已用真实证据确认，不构成 blocked。

## 3. 已确认产品缺陷（两个独立 bug key）

两个 bug key 依入口与行为不同独立成立（注册响应/首次 Welcome vs 退出会话撤销），未合并；审核明确两个缺陷均有浏览器/网络证据支撑，未将源码分析冒充实际执行。

### 3.1 缺陷 A：注册成功响应与首次 Welcome 未保留输入昵称（硬编码错误昵称）

- key：`register-response-displayname-not-input-nickname`；场景：`AUTH-REGISTRATION-001`。
- 期望依据：注册成功返回该用户公开资料，首次 Welcome 展示本次注册账号的昵称（场景目的 + 需要记录项 + spec 行为 2）。审核要求保留「场景原文措辞与解释依据」的区分（见 §2.1）。
- 实际：`POST /api/auth/register` 201 响应体 `user.displayName = "Controlled Wrong Name"`（`operation-15`），首次 Welcome 渲染同名字符串与首字母 `C`（`operation-11`、截图 `reg001-first-welcome.png`）；刷新后自愈为库值昵称（`operation-20`/`21`）。
- 复现条件：全新账号注册 → 提交 → 不刷新即读取响应体与 Welcome 卡片。审核记载在两个场景账号上均可复现（reg001 见 `operation-15`；login001 注册后同样显示该值，`operation-39`）。
- 影响：新用户首次进入看到错误身份，注册响应契约被违反；仅刷新后自愈，属用户可见缺陷。
- 归属：只对 target 整体验收成立；无逐提交 diff，不作「某提交引入」归因。
- Issue 决策：`create`（依据见 §4）。

### 3.2 缺陷 B：logout 未撤销服务端 Session

- key：`logout-does-not-revoke-server-session`；场景：`AUTH-LOGIN-001`。
- 期望依据：`POST /api/auth/logout` 撤销当前 Session 并清理 Cookie；退出后同一 Session 访问受保护 API 返回 401（场景步骤 5/期望 + spec 行为 6 + 验收条件）。
- 实际：logout 返回 200 且前端显示「已安全退出」，但会话 Cookie 值在退出前后一致（`operation-44` vs `operation-48`），携带该原 Cookie 的 `GET /api/me` 返回 **200**（`operation-55`/`57`），再次访问站点仍显示已登录（`operation-59`）。
- 复现条件：登录 → 固化 `cynos_session` → 点击退出 → 携带该 Cookie（或直接重载站点）访问 `/api/me`。
- 影响：安全会话撤销失效，页面「已退出」为假象；账号删除前旧会话一直有效。
- 归属：同上，仅对 target 整体验收成立，不作逐提交归因。
- Issue 决策：`create`（依据见 §4）。

## 4. Issue 处理决策与查询覆盖

- 本 Session 已按 bug key 对每个本次 confirmed Bug 执行受控候选查询（`query_issue_candidates`）：
  - 缺陷 A（`register-response-displayname-not-input-nickname`）以 bug_key 及「注册成功响应 displayName 硬编码 / 首次 Welcome 昵称错误 / 注册昵称未保留」等关键词查询，返回 `status: empty`（无候选）；以补充关键词组合复核，同样 `empty`。
  - 缺陷 B（`logout-does-not-revoke-server-session`）以 bug_key 及「logout 未撤销服务端会话 / 退出后原 Cookie 访问 /api/me 返回 200」等关键词查询，返回 `status: empty`（无候选）；以参数名 `logout`、`session` 与标题复核，同样 `empty`。
  - 两次查询均为 `empty`（查询成功、无匹配候选），**未出现 `unavailable`**；无重试或预算耗尽情形。
- 因未取得可关联的 Issue 地址，两个 bug key 的 `issue_action` 均取 `create`。`create` 为交给后续受控归档 owner 的决策，**本报告不代表 Issue 已创建或关联**；后续归档仍可能产生新 Issue，不声称跨 Run 保证无重复。
- 计划 §6 提到历史上下文提示存在同类历史条目（注册昵称硬编码、logout 未撤销旧会话），但 `historyIssues` 为空，且本次候选查询未返回匹配；按规则，查询结果 `empty` 只表示本次查询未命中，**不等于也不声明「不存在重复 Issue」**。
- 审核 §4 记载：原请求要求的 Issue 候选查询与创建/关联在 Runner Session 中未执行（Runner 声明其 Session 未提供相应工具；`blockingReasons` 为空，Harness 未将其列为阻断）。该未完成项已由本次 finalization 的候选查询部分补做；创建/关联动作仍待归档 owner 执行。

## 5. 未完成项与限制

- **未确认（不因缺陷成立而豁免）**：AUTH-REGISTRATION-001 的期望「数据库不保存明文密码」无受控持久层观察，记为未确认；本报告不以响应体不含明文替代持久层结论。
- **部分确认**：AUTH-LOGIN-001 的期望「删除测试账号后旧 Session 不可用」仅有间接观察（`browser_cookie_list` 输出省略，不能证明缺失），无直接重放证据；同项的「原凭据不可用」已确证。
- **方法差异**：缺陷 B 判定使用浏览器自身 Cookie 罐发出携带原 Cookie 的请求，而非先恢复 Cookie 再重放；审核判定该差异不影响本场景所问问题，并明确排除以「普通未认证请求返回 401」作为依据。
- **步骤偏差**：AUTH-LOGIN-001 因缺陷 B 未发生「退出后重新登录再删除」，账号在仍登录状态下被删除；审核判定不构成 blocked。
- **归属限制**：仅有 base/target 与变化清单、无逐提交 diff，结论对 target 整体验收成立，不作「某提交引入/修复」归因，也不表述为历史缺陷「已修复」。
- **会计口径**：`operation-3`、`operation-30` 的 `execution.scenarioId` 为 `null`（后者发生在 AUTH-LOGIN-001 开始之后），审核列为执行记录归属的小瑕疵，不影响证据内容判断。
- **时间基准**：两份 console 日志（`console-2026-09-29T04-19-41-615Z.log`、`console-2026-09-29T04-20-38-415Z.log`）各含一条 `/api/auth/login` 401 记录，但其文件名时间（04:19:41 / 04:20:38）早于对应登录 401 操作（`operation-25`/`operation-65`，审核估算约 04:19:52 / 04:20:48）；审核指出文件名时间与事件时间的关系无法从现有记录确定，二者内容与「登录失败 401」结果一致、不改变判定，且**不应据此写精确跨来源事件时间**。本报告不给出跨来源绝对事件时间结论；`operation-56` 的响应头 `date` 仅为该响应自报时间。
- **证据类别与执行归属**：现有证据文件包含 3 张截图、2 份 console 日志、69 条 operation 记录、16 份 page 快照（与审核清单一致），其中截图 `api-me-after-logout-replay.png` 与 `login001-deleted-relogin-401.png` 的 `screenshotInspection.status` 在上下文元数据中分别为 `not_detected` 与 `detected`；审核另述其已在受控工具中实际读取 `api-me-after-logout-replay.png`、`login001-deleted-relogin-401.png`、`reg001-first-welcome.png` 并核对内容。内容观察与执行归属分别依据：内容观察来自审核读取；执行归属来自 `operation-*` 工具回执的 `source` 标注（如 `observed-browser`、`observed-request-header`）。`reg001-first-welcome.png` 在上下文元数据中为 `not_detected`（自动页面检测未识别出待验证内容），不据此否定审核的读取结论，也不改写判定。
- **范围外**：其余 approved/draft 场景未执行，本轮结论不代表认证模块整体覆盖完整；本轮未新增、未修改、未废弃任何场景文件。
- **人工复核**：本流程 Agent 为模型。审核明确「截图由我在受控工具中实际读取并核对内容，但不构成人工复核，本 Run 无人工复核记录」；本报告据此不声称人工已确认。
- **清理状态**：两个 Run 前缀账号已在场景内经业务接口删除（两处 `DELETE /api/me` 200 + 原凭据 401）；审核指出 Runner 的清理登记声明缺少受控回执，且收尾清理与核验由 Harness 在本 Session 结束后处理。本报告**不声明 Harness 清理已完成**，清理结果不改变场景结论。

## 6. 总体结论

- `AUTH-REGISTRATION-001`：**failed**——缺陷 A 由注册响应体与首次 Welcome 两个同源观察独立证实；同场景「数据库不保存明文密码」未确认，保持未闭合。
- `AUTH-LOGIN-001`：**failed**——缺陷 B 由退出前后 Cookie 值一致与携带原 Cookie 的 `GET /api/me` 200 的请求头证据证实；「删除后旧 Session 不可用」为部分确认，「原凭据不可用」已确证。
- Run 整体 `result = failed`（`blockingReasons` 为空，无 blocked 聚合）。
- 两个独立 bug key 的 Issue 决策均为 `create`，待后续受控归档 owner 执行；本次候选查询均为 `empty`，不声明无重复 Issue。
- 当前授权范围内的必要下一步：由具备受控工具的角色按上述两个 bug key 创建测试 Issue。更换环境、账号或操作范围的验证建议须另行确认，不属现有权限。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTlAyWTlZWUNLNzEyMkVKTVdUMzlYQS9hcGktbWUtYWZ0ZXItbG9nb3V0LXJlcGxheS5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTlAyWTlZWUNLNzEyMkVKTVdUMzlYQS9sb2dpbjAwMS1kZWxldGVkLXJlbG9naW4tNDAxLnBuZw>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTlAyWTlZWUNLNzEyMkVKTVdUMzlYQS9yZWcwMDEtZmlyc3Qtd2VsY29tZS5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 2 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3NP2Y9YYCK7122EJMWT39XA-reg001 · run-scoped-http-cleanup · 2026-09-29T04:23:28.869Z · absent=true · sha256 34facaaecfd2082ea6f6c2b73d8b6dae68d1c9cb6c1288ddcce3c8e8ee078535

独立核验：luowang-01M3NP2Y9YYCK7122EJMWT39XA-login001 · run-scoped-http-cleanup · 2026-09-29T04:23:28.871Z · absent=true · sha256 34facaaecfd2082ea6f6c2b73d8b6dae68d1c9cb6c1288ddcce3c8e8ee078535
