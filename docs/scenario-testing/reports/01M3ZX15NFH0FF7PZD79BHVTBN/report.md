---
run_id: 01M3ZX15NFH0FF7PZD79BHVTBN
trigger: manual
base_commit: null
target_commit: 909d467f1ad5cecf7b42e97788e461fa99f086d6
included_commits: []
result: blocked
started_at: 2026-10-03T03:30:57.038Z
finished_at: 2026-10-03T03:34:43.017Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: passed
  - id: AUTH-REGISTRATION-001
    result: blocked
confirmed_bugs: []
---

# 最终报告：认证核心场景回归（登录后会话状态 + 独立合成数据路径）

Run `01M3ZX15NFH0FF7PZD79BHVTBN`（`trigger = manual`），targetCommit `909d467f1ad5cecf7b42e97788e461fa99f086d6`，`baseCommit = null`、`includedCommits = []`。

**总体结果：blocked**（`blockingReasons` 为空；blocked 来自场景 `AUTH-REGISTRATION-001` 的未验证适用期望）。执行集 2 个场景：1 passed、1 blocked、0 failed。本批无已确认产品 Bug（`confirmed_bugs = []`）。

## 1. 请求与范围

请求要求对当前固定 `scenario-testing` 提交执行已有 approved 核心场景，覆盖两条主线：登录后的会话状态，以及一条独立合成数据路径；使用受控测试账号，新增数据登记并带本 Run ID 前缀，截图保留真实页面状态，遵守场景既定期望。

- 冻结为回归复用：`baseCommit = null`、无 diff、无 included commits，本轮不产生新业务期望，不作逐提交归因，不写「已修复」。
- `scenarioChanges = null`，不存在 `scenario-changes.patch`（初始化 `scenarioChanges` 为 null），本批未新增/修改/废弃任何场景。
- 运行地址为非生产域 `http://luowang-rr-live-r2-node-app:3100`（据审核记录）。
- 执行集只来自计划唯一的 `## execution_scenarios`，顺序即执行顺序：`AUTH-LOGIN-001` → `AUTH-REGISTRATION-001`。

## 2. 逐场景结果

### AUTH-LOGIN-001 登录状态恢复 — passed

审核（Reviewer 独立证据判断）逐条核对该场景四条明列期望，均判通过：

1. 刷新后显示同一用户 — 注册进入欢迎态（operation-17，`page-2026-10-03T03-32-03-143Z.yml`，截图 `login-01-created-welcome.png`）；整页加载 `/` 后仍为同一用户（operation-24，`page-2026-10-03T03-32-11-478Z.yml`，截图 `login-02-after-reload-same-user.png`）；`GET /api/auth/status` 返回 `authenticated:true` 且 user 一致（operation-22）。
2. 退出后页面回到登录状态 — 点击退出后回到登录表单并提示已安全退出（operation-28，`page-2026-10-03T03-32-14-993Z.yml`）；截图 `login-03-after-logout-login-view.png`（operation-41）。
3. 退出后原 Session 访问受保护接口返回 401，且确实携带退出前固化的原 Cookie — 退出前固化 `cynos_session`（operation-19/20），退出后写回同一引用（operation-30）并经 `browser_cookie_get` 确认存在（operation-31）；`GET /api/me` 返回 401（operation-33/34，`page-2026-10-03T03-32-20-204Z.yml`）；紧邻的请求详情（operation-35）显示请求头携带 Cookie 且 `credentialReferences` 与该固化引用一致，排除了「无 Cookie 的 401」这一弱解释。该期望未降级。
4. 删除测试账号后旧 Session 与原凭据均不可用 — 重新登录获得新会话（operation-44/45），删除账号后页面回登录态并提示测试账号及其会话已删除（operation-47，截图 `login-04-account-deleted.png`）；写回该会话 Cookie 后 `GET /api/me` → 401（operation-50/51/53/54）；原凭据再登录被拒（operation-60/61，`console-2026-10-03T03-32-41-037Z.log`，截图 `login-05-original-credentials-rejected.png`）。

辅助记录（非通过条件）：`cynos_session` 属性 `httpOnly:true`、`sameSite:Strict`、`secure:false`（operation-20/31/51），满足场景「需要记录」项。

### AUTH-REGISTRATION-001 新用户注册 — blocked（已确认成功项保留）

审核结论：期望 1、2、4 有运行时证据支持通过；期望 3 无运行时证据，整体 blocked。

1. 页面显示欢迎信息 — 通过。提交后进入欢迎态（operation-71，`page-2026-10-03T03-32-55-691Z.yml`，截图 `reg-01-welcome.png`）。
2. `GET /api/auth/status` 返回已登录用户 — 通过。`authenticated:true`，user 与欢迎态同一（operation-74，`page-2026-10-03T03-32-59-563Z.yml`）。
3. 数据库不保存明文密码 — **未验证**。Run 上下文 `accountStorage.status = unavailable`（`reason = unsupported_endpoint`，观测时间 `2026-10-03T03:30:59.220Z`），本轮无持久层读回能力；页面文案与 API 响应体不含明文、代码阅读均不能替代持久层观察。属验证能力不足而非期望不适用，该明列期望无运行时证据 → 场景整体 blocked。
4. 删除账号后原邮箱密码不能再登录 — 通过。删除后回登录态并提示测试账号及其会话已删除（operation-78，截图 `reg-02-account-deleted.png`）；原凭据登录被拒（operation-82/83，`console-2026-10-03T03-33-01-570Z.log`，截图 `reg-03-original-credentials-rejected.png`）。

## 3. 已确认产品问题

本批无 failed 期望，无已确认产品 Bug，`confirmed_bugs` 为空。

- 历史 open Issue #3（退出未撤销服务端 Session）与 #4（注册首次欢迎未保留输入昵称）在本轮未复现（退出后原 Cookie 重放 401；注册欢迎态标题显示带 Run 前缀昵称）。**此为 Reviewer 与本 Run 的观察，不构成「已修复」声明**——无 base/diff，不作逐提交归因。
- 由于本批无已确认 Bug，未发起受限候选查询，也未产生 create/link 决策需求；`query_issue_candidates` 未被调用不表示「已查无重复」，仅表示本批无候选需要查询。

## 4. Issue 查询覆盖缺口

无。本批 `confirmed_bugs` 为空，没有需要去重查询的 Bug key，因此不存在 `unavailable` 或 `empty` 的查询状态需要记录。历史 Issue #3/#4 的存在只用于「本轮是否复现」的观察，不作为本轮新增 Bug 候选。

## 5. 范围限定与未完成项（保留 Reviewer 的疑问与限制）

- **结果限定**：本批仅执行计划选定的两个场景。`AUTH-ACCESS-001`、`AUTH-ACCOUNT-001`、`AUTH-LOGIN-002`、`AUTH-REGISTRATION-002/003` 与 draft 场景（`AUTH-SECURITY-001/002`）本轮均未执行，本报告结论不代表认证模块整体覆盖完整，也不代表项目整体无问题。
- **持久层缺口（blocked 的直接原因）**：`AUTH-REGISTRATION-001` 期望 3「数据库不保存明文密码」缺持久层运行时证据，可行下一步为由具备持久层/受控存储观察能力的角色读回该测试账号行确认密码列为哈希；REST 响应与代码阅读不能替代。该行动需另行确认访问能力。
- **无 base/diff**：不作逐提交归因，不写「已修复」。
- **审核内部保留的限定（归 Reviewer）**：
  - Reviewer 指出 Runner 报告称 `browser_cookie_list` 返回「No cookies found」（operation-27）无法从可读证据核实（该回执 `output` 为「Output omitted」），仅能确认该次未返回 `credentialReferences`；此为对期望 2 的辅助说明，不影响期望 2 由 operation-28 快照与 `login-03` 截图成立。
  - Reviewer 指出注册欢迎态被脱敏部分无法逐字符比对等于输入昵称；`reg-01-welcome.png` 画面显示用户名带 Run 前缀可确认，逐字符相等无法确认。此为历史 Issue 观察的支撑力度限制，非场景期望。
  - Reviewer 记录了执行方式偏差（先知预置凭据尝试登录失败后改为注册建立会话、以受控整页导航到同源 `/` 实现「刷新」、三次工具 schema 拒绝回执），判定不影响适用期望成立；被拒回执未被用作业务结论。
- **截图限制**：截图均为页面级可视范围；画面未完整展示即不据此声称控件全部可见或不可见（`login-01/02/03`、`reg-01/02` 范围内未检测到可见表单值；`login-04/05`、`reg-03` 含可见表单值）。
- **时间来源**：本报告时间仅来自 Run 上下文的 `startedAt`/`finishedAt` 与各证据文件时间戳；未做跨来源绝对事件时间换算。

## 6. 清理状态

测试数据清理由 Harness 在本 Session 结束后统一处理（`cleanup` 配置为 `after_final_main`），本报告不预先声明清理已完成，也不判定其收尾结果。两条合成账号已在各自场景业务步骤内由页面删除并有提示佐证，清理的独立核验不在本报告结论范围内，其成败不改已成立的测试结论。

## 7. 结论

- 总体 **blocked**：`AUTH-LOGIN-001` passed；`AUTH-REGISTRATION-001` blocked（期望 3 因 `accountStorage` 不可用而无运行时证据，期望 1/2/4 的成功项保留）。
- 0 failed、0 已确认产品 Bug。
- 下一步：在另行确认访问能力后，由具备持久层观察能力的角色补验注册账号密码列的持久化形态，以闭合 `AUTH-REGISTRATION-001` 期望 3；补验前该关键问题保持未闭合。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1jb3JyZWN0aW9uLTIwMjYxMDAzL3Byb2plY3RzL2I2MmE3MTUzLWVlZjAtNDk0OC05ODMyLWE5YzBlZjJhNWRjMi9ydW5zLzAxTTNaWDE1TkZIMEZGN1BaRDc5QkhWVEJOL2xvZ2luLTAxLWNyZWF0ZWQtd2VsY29tZS5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1jb3JyZWN0aW9uLTIwMjYxMDAzL3Byb2plY3RzL2I2MmE3MTUzLWVlZjAtNDk0OC05ODMyLWE5YzBlZjJhNWRjMi9ydW5zLzAxTTNaWDE1TkZIMEZGN1BaRDc5QkhWVEJOL2xvZ2luLTAyLWFmdGVyLXJlbG9hZC1zYW1lLXVzZXIucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1jb3JyZWN0aW9uLTIwMjYxMDAzL3Byb2plY3RzL2I2MmE3MTUzLWVlZjAtNDk0OC05ODMyLWE5YzBlZjJhNWRjMi9ydW5zLzAxTTNaWDE1TkZIMEZGN1BaRDc5QkhWVEJOL2xvZ2luLTAzLWFmdGVyLWxvZ291dC1sb2dpbi12aWV3LnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 4](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1jb3JyZWN0aW9uLTIwMjYxMDAzL3Byb2plY3RzL2I2MmE3MTUzLWVlZjAtNDk0OC05ODMyLWE5YzBlZjJhNWRjMi9ydW5zLzAxTTNaWDE1TkZIMEZGN1BaRDc5QkhWVEJOL2xvZ2luLTA0LWFjY291bnQtZGVsZXRlZC5wbmc>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 5](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1jb3JyZWN0aW9uLTIwMjYxMDAzL3Byb2plY3RzL2I2MmE3MTUzLWVlZjAtNDk0OC05ODMyLWE5YzBlZjJhNWRjMi9ydW5zLzAxTTNaWDE1TkZIMEZGN1BaRDc5QkhWVEJOL2xvZ2luLTA1LW9yaWdpbmFsLWNyZWRlbnRpYWxzLXJlamVjdGVkLnBuZw>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 6](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1jb3JyZWN0aW9uLTIwMjYxMDAzL3Byb2plY3RzL2I2MmE3MTUzLWVlZjAtNDk0OC05ODMyLWE5YzBlZjJhNWRjMi9ydW5zLzAxTTNaWDE1TkZIMEZGN1BaRDc5QkhWVEJOL3JlZy0wMS13ZWxjb21lLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 7](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1jb3JyZWN0aW9uLTIwMjYxMDAzL3Byb2plY3RzL2I2MmE3MTUzLWVlZjAtNDk0OC05ODMyLWE5YzBlZjJhNWRjMi9ydW5zLzAxTTNaWDE1TkZIMEZGN1BaRDc5QkhWVEJOL3JlZy0wMi1hY2NvdW50LWRlbGV0ZWQucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 8](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1yZWxpYWJpbGl0eS1jb3JyZWN0aW9uLTIwMjYxMDAzL3Byb2plY3RzL2I2MmE3MTUzLWVlZjAtNDk0OC05ODMyLWE5YzBlZjJhNWRjMi9ydW5zLzAxTTNaWDE1TkZIMEZGN1BaRDc5QkhWVEJOL3JlZy0wMy1vcmlnaW5hbC1jcmVkZW50aWFscy1yZWplY3RlZC5wbmc>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 2 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3ZX15NFH0FF7PZD79BHVTBN-login-account · run-scoped-http-cleanup · 2026-10-03T03:34:55.773Z · absent=true · sha256 7ca8abc932a705b88b139b5e3b1dbc7fc05e75dccc831221b3b853cba88875ed

独立核验：luowang-01M3ZX15NFH0FF7PZD79BHVTBN-register-account · run-scoped-http-cleanup · 2026-10-03T03:34:55.775Z · absent=true · sha256 7ca8abc932a705b88b139b5e3b1dbc7fc05e75dccc831221b3b853cba88875ed
