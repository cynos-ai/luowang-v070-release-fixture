---
run_id: 01M3YG2E11VYV5REGDP80R20NG
trigger: manual
base_commit: null
target_commit: 085ca4429557ba36c808808c9efeaac73f18b9a0
included_commits: []
result: blocked
started_at: 2026-10-02T14:25:13.773Z
finished_at: 2026-10-02T14:29:38.441Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: passed
  - id: AUTH-REGISTRATION-001
    result: blocked
confirmed_bugs: []
---

# 最终报告：认证核心场景回归（登录会话状态 + 独立合成数据路径）

- Run：`01M3YG2E11VYV5REGDP80R20NG`，`trigger = manual`，`scenarioMode = autonomous`，`initialization = false`。
- 固定版本：`baseCommit = null`（无可比对 base，本轮无 diff 分析），`targetCommit = 085ca4429557ba36c808808c9efeaac73f18b9a0`，`includedCommits = []`。
- 本轮无 `scenario-changes.patch`（`scenarioChanges = null`）；计划 planHash `7773a626f433d168ae9a540a30a31e726759f7592db3f9760da44730e65bce28`，审核已核对与冻结正文一致，无维护变更可核。
- 执行集合（计划 `## execution_scenarios`，顺序即执行顺序）：`AUTH-LOGIN-001` → `AUTH-REGISTRATION-001`。执行场景 2 / passed 1 / blocked 1 / failed 0。
- 汇总口径：本报告只整理 `plan.md` 与 `review.md` 已交付的事实与判定，不回读运行记录、不重做证据审核、不替 Reviewer 补做独立判断。

## 1. 总体结论

- 请求限定的两个覆盖目标均有实际执行，但**整体判定 blocked**（`review.md` 对 `AUTH-REGISTRATION-001` 的判定为 blocked；`blockingReasons` 为空，`result` 取逐场景结果最高优先级 blocked）。
- 登录后的会话状态方向：`AUTH-LOGIN-001` 的 4 条明列期望均由实际观察支持，审核判定 **passed**；历史 Issue #3 对应的「退出未撤销服务端 Session」在本 target 上**未复现**。
- 独立合成数据路径方向：`AUTH-REGISTRATION-001` 判定 **blocked**——明列期望「数据库不保存明文密码」在本环境未取得任何运行时证据（受控存储观察工具返回「账号存储观察不可用」，属验证能力不足，而非期望不适用）；其余 3 条期望已由实际观察确认成功，这些已确认成功项如实保留。
- 本批**无已确认产品缺陷**，因此 `confirmed_bugs` 为空，无 create/link 决策。
- 本批结论**仅覆盖上述两个场景**，不代表认证模块整体覆盖完整，也不代表项目整体没有问题（计划第 7 节与审核第 5 节列明的未执行场景见下文第 5 节）。

## 2. 逐场景结果

### 2.1 AUTH-LOGIN-001 登录状态恢复 — passed（含一项前置偏差，已记录）

审核依据原始记录独立核对后判定的 4 条明列期望及证据：

| 期望 | 实际观察 | 稳定证据引用 |
|---|---|---|
| 刷新后显示同一用户 | 登录后进入已登录视图（显示名与登录前一致），受控导航到同源首页触发整页重新加载后仍显示同一已登录用户 | 快照 `operation-8.json`、`operation-12.json`；截图 `login-001-logged-in.png`、`login-001-after-refresh.png` |
| 退出后页面回到登录状态 | 点击「退出登录」后页面回到登录表单并提示「已安全退出。」，cookie 列表为空，网络序列含 `POST /api/auth/logout` → 200 | 快照 `operation-17.json`；`operation-18.json`；网络 `operation-21.json`；截图 `login-001-after-logout.png` |
| 退出后携带原 Session 访问受保护接口返回 401 | 退出前以受控方式读取原 `cynos_session`（observed-browser，引用标识 `credential-2c11cbd2…`），退出后写回同一引用值（restore-input，同引用），请求 `GET /api/me` → **401**（响应体 `UNAUTHORIZED/请先登录`）；请求头 `cookie: [REDACTED]` 的引用与写回值相同（observed-request-header，同引用），证明请求确实携带原 Cookie | `operation-14.json`/`operation-15.json`（读取）、`operation-20.json`（写回）、`operation-27.json`、`operation-26.json`/`operation-28.json`（请求头 + 401）、`operation-29.json`；`page-2026-10-02T14-26-42-718Z.yml`；`console-2026-10-02T14-26-42-685Z.log` |
| 删除测试账号后旧 Session 与原凭据均不可用 | 重新登录成功 → 点击「删除测试账号」→「测试账号及其会话已删除。」；网络序列 `POST /api/auth/login` 200 → `DELETE /api/me` 200 → `POST /api/auth/login` **401**，页面提示「邮箱或密码不正确」（响应体 `INVALID_CREDENTIALS`） | `operation-35.json`、`operation-36.json`/`operation-37.json`、`operation-42.json`、`operation-43.json`、`operation-45.json`；截图 `login-001-after-account-delete.png`、`login-001-deleted-relogin-fails.png` |
| 需要记录：Cookie 属性 | `cynos_session` 为 `httpOnly: true`、`sameSite: Strict`、`secure: false`；Cookie 原文未落盘 | `operation-15.json` |

- 历史 Issue #3 在本 target 上未复现（审核观察）：携带退出前原 Cookie 的 `GET /api/me` 返回 401，且请求头确有该原 Cookie，支持「服务端撤销」而非「仅客户端丢弃 Cookie」。该结论归本次审核，不推断历史状态。
- **前置偏差（审核记录，未改判场景结果）**：计划 §5/§8 要求本场景使用带 `luowang-<完整RunID>-` 前缀的新建并登记合成账号，实际使用的是受控环境**预置账号**，并在场景步骤 6 中被业务删除（Runner 亦在 `execution.md` §7 自述使用预置专用账号，属审核引述）。
  - 影响：① 与计划前置不符；② 该账号不属 Run 前缀清理范围，Harness 收尾无法按前缀回收，为一个非本 Run 可再生资产被永久删除，可能影响后续依赖同一预置账号的场景/Run。
  - 审核判断：场景自身原文前置为「已存在一个非生产测试账户」，预置账号满足该原文前置，偏差不影响 4 条期望的观察有效性，故不据此改判；作为计划一致性偏差与数据资产风险保留，供后续 Run 关注。
- **等价操作偏差（审核认可）**：`browser_reload` 被工具拒绝后改用 `browser_navigate` 到同源首页实现「刷新」，触发整页重新加载，对「会话是否保持」的观察等价；`browser_fill_form`/`browser_cookie_list` 旧 schema 被拒后调整参数，未改变观察含义。

### 2.2 AUTH-REGISTRATION-001 新用户注册 — blocked

| 期望 | 实际观察 | 稳定证据引用 | 审核判定 |
|---|---|---|---|
| 页面显示欢迎信息 | 切到「创建账户」表单填写昵称/邮箱/密码并提交后，页面显示欢迎视图与当前登录邮箱 | 快照 `operation-52.json`/`operation-54.json`、`operation-57.json`/`operation-64.json`；网络 `operation-56.json`（`POST /api/auth/register` → 201）；截图 `reg-001-welcome.png` | 已确认 |
| `GET /api/auth/status` 返回已登录用户 | 应用发起的 `GET /api/auth/status` → 200，响应体 `authenticated:true` 且 user 与注册返回同一用户 | 网络 `operation-63.json`；响应体 `operation-65.json`；注册响应体 `operation-59.json` | 已确认 |
| **数据库不保存明文密码** | **无运行时观察**：受控只读存储观察工具返回「账号存储观察不可用」，现有证据仅注册请求/响应与页面行为，无任何持久层/数据库读回记录（代码阅读属实现依据，非运行时观察） | 无 | **未验证** |
| 删除后原邮箱密码不能再登录 | 欢迎页删除测试账号 →「测试账号及其会话已删除。」；网络 `DELETE /api/me` → 200，随后 `POST /api/auth/login` → **401**，页面「邮箱或密码不正确」 | `operation-69.json`、`operation-70.json`、`operation-75.json`/`operation-76.json`/`operation-78.json`；截图 `reg-001-after-account-delete.png`、`reg-001-deleted-relogin-fails.png` | 已确认 |

- 阻塞原因：一条明列且适用的期望本身未取得任何运行时证据，属验证能力不足（工具不可用、无替代运行时途径），不是「不适用」。按共同规则「任一适用期望尚不能确认，场景为 blocked」，审核判 blocked，已确认的 3 条成功项保留。
- **Runner 与 Reviewer 的判定分歧（保留）**：Runner 在 `execution.md` §4/§6 将该场景判为「passed（含一项运行时缺口）」，审核不采信该口径，认为明列期望未验证不能作为「通过 + 备注」交付（分歧仅在最终判定口径；Runner 对缺口的描述如实）。本报告按审核交付的未验证事实记为 blocked，不照抄 Runner 的通过标签。
- 审核另记录：`execution.md` 在同处未点明登录侧被删除账号为预置非前缀账号（其 §7 有述），不构成实质矛盾。

## 3. 已确认产品问题与 Issue 决策

- 本批**未发现**已确认产品缺陷，`confirmed_bugs` 为空，**无 create / link 决策**，不产生归档动作。
- 历史 Issue #3（退出未撤销服务端 Session，open）：本 target 上未复现（见 2.1）。
- 历史 Issue #4（注册成功响应与首次 Welcome 未保留输入昵称，open）：本批**未复现**（审核观察）。`reg-001-welcome.png` 显示欢迎标题为 Run 前缀昵称「你好，luowang-01M3YG2E11VYV5REGDP80R20NG-reg001。」，注册/`status` 响应体的 `displayName` 为同一脱敏值，三处一致；输入昵称原文被脱敏，审核不能逐字符比对，只能确认「展示值与返回/输入同源且为 Run 前缀、非硬编码错误昵称」。该观察归本次审核。
- 场景原文未将「欢迎昵称等于注册输入」列为通过条件（仅在「需要记录」中要求记录展示昵称），故不影响本场景判定；计划第 7 节亦明确本轮不据此新增或修改场景，并指出如需正式覆盖「昵称与输入一致」应另行确认契约来源后以 draft 候选处理。

## Issue 查询覆盖缺口

- 本轮无本次 confirmed Bug，因此不存在需要为已确认 Bug 做 create/link 的候选查询。
- 为便于判断历史 Issue #3/#4 与本次结果的关系，本轮仍对相关关键词执行了受限候选查询：查询 `退出登录`（命中 open 候选 #3）、`注册`（命中 open 候选 #4）状态为 ok，与计划提供的历史 Issue 一致；其余若干关键词/标题/bug_key 查询返回 empty（`AUTH-LOGIN-001`、`AUTH-REGISTRATION-001`、`明文密码存储未验证`、`欢迎昵称`、「会话」等），表明这些查询键未匹配到候选。
- 最后两次查询返回 `unavailable`（本次最终汇总的 Issue 查询预算已耗尽）：对已 `unavailable` 的键 `密码`（对应 2.2 的「数据库不保存明文密码」相关方向），按规则最多原样重试一次后仍为 `unavailable`。本次最终汇总的 Issue 查询预算耗尽，**无法确证相关主题不存在同名/同源 Issue**；`unavailable` 是查询状态而非「查无匹配」，本报告不据此宣称没有重复 Issue。
- 上述缺口不改变本批测试结果：本批无已确认 Bug，无待归档事项，且预算耗尽发生在补充性去重查询阶段，未影响任何已判定的场景结果。

## 4. 执行记录问题（与产品结果分开）

以下均由审核从原始记录核对并交付，归本次审核：

1. **场景进度事件标签异常**：`operation-47.json` 为 `finish_scenario`，其 `scenarioId = "AUTH-REGISTRATION-001"`，而 `completed = ["AUTH-LOGIN-001"]`；紧接 `operation-48.json` 才 `start_scenario = AUTH-REGISTRATION-001`，即结束第一个场景的事件被标成了第二个场景的 id。各操作自身的 `execution.scenarioId` 归属自洽，不影响业务观察；`execution.md` §2「无跨场景错报」的表述与原始进度记录不完全一致，属记录准确性小问题。
2. **准备阶段预置扫描**：`operation-1.json`（navigate）、`operation-2.json`（snapshot）标记 `scope = auxiliary`、`declared = false`，位于 `begin_scenario_execution`（`operation-3.json`）之前，属正常准备行为，不计入场景。
3. **等价操作偏差**：见 2.1 末条（工具层拒绝后的等价替代）。
4. **口令/Cookie 处理**：记录中未见口令原文，`credentialReferences` 仅以引用标识出现，符合「Cookie 原文不落盘」；审核复核同样未复述任何口令值。

## 5. 未完成项、覆盖缺口与后续动作

- **关键未闭合项（阻塞）**：`AUTH-REGISTRATION-001` 的「数据库不保存明文密码」缺运行时证据；需在后续获得可用且授权的受控存储观察工具或路径后补验，方可改判该场景。
- **数据资产风险（审核提示）**：`AUTH-LOGIN-001` 使用了非 Run 前缀的受控预置测试账号并已通过业务步骤删除；审核建议后续 Run 另行确认该预置账号的可用性。本报告不假定其仍可用。
- **清理状态**：本批测试数据清理由 Harness 在本 Session 结束后统一处理。注册合成账号在场景步骤内已被业务删除（`DELETE /api/me` 200）；预置账号的删除不属 Run 前缀回收范围（见 2.1）。本报告的 Issue 查询覆盖缺口也不主张已无重复 Issue。
- **未执行范围（计划与审核一致声明）**：本轮未选择 `AUTH-LOGIN-002`、`AUTH-ACCESS-001`、`AUTH-ACCOUNT-001`、`AUTH-REGISTRATION-002`（非请求范围）；`AUTH-SECURITY-001`、`AUTH-SECURITY-002` 为 draft，未进入执行集。本批结论不代表认证模块整体覆盖，也不代表项目整体没有问题。
- **需另行确认才能推进的事项**：上述补验所需工具/授权路径、预置账号可用性、以及为「欢迎昵称等于注册输入」建立正式期望所需的契约来源，均需另行确认，不在本次授权范围内。
- **无 base 与无 included commits**：本轮无累计变化清单可分析，对「受影响入口」的判断因此不受 diff 支持（本轮为既有场景回归，不依赖 diff 选择）。

## 6. 证据引用（稳定文件名，供复核定位）

- 命令/HTTP/网络：`operation-1…79.json`（关键：`operation-8/12/15/17/18/20/21/26/27/28/29`（AUTH-LOGIN-001）；`operation-52/54/56/57/59/63/65/69/70/75/76/78`（AUTH-REGISTRATION-001）；进度标签异常：`operation-47/48`）。
- 浏览器快照：`page-2026-10-02T14-26-24-425Z.yml`、`page-2026-10-02T14-26-31-332Z.yml`、`page-2026-10-02T14-26-42-718Z.yml`、`page-2026-10-02T14-27-16-794Z.yml`、`page-2026-10-02T14-27-41-594Z.yml`。
- 截图：`login-001-logged-in.png`、`login-001-after-refresh.png`、`login-001-after-logout.png`、`login-001-after-account-delete.png`、`login-001-deleted-relogin-fails.png`、`reg-001-welcome.png`、`reg-001-after-account-delete.png`、`reg-001-deleted-relogin-fails.png`。
- 控制台：`console-2026-10-02T14-26-42-685Z.log`（`/api/me` 401）、`console-2026-10-02T14-26-46-823Z.log` 与 `console-2026-10-02T14-27-38-795Z.log`（`/api/auth/login` 401）。
- 来源限定：证据文件与上述观察的归属以 `review.md` 的清单为准；本轮 Main 只整理计划与审核已交付内容，未自行读取运行记录，也未将证据文件的存在等同于本 Run 的浏览器/接口操作，相关操作归属均来自审核的记录核对。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkUxMVZZVjVSRUdEUDgwUjIwTkcvbG9naW4tMDAxLWFmdGVyLWFjY291bnQtZGVsZXRlLnBuZw>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkUxMVZZVjVSRUdEUDgwUjIwTkcvbG9naW4tMDAxLWFmdGVyLWxvZ291dC5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkUxMVZZVjVSRUdEUDgwUjIwTkcvbG9naW4tMDAxLWFmdGVyLXJlZnJlc2gucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 4](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkUxMVZZVjVSRUdEUDgwUjIwTkcvbG9naW4tMDAxLWRlbGV0ZWQtcmVsb2dpbi1mYWlscy5wbmc>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 5](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkUxMVZZVjVSRUdEUDgwUjIwTkcvbG9naW4tMDAxLWxvZ2dlZC1pbi5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 6](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkUxMVZZVjVSRUdEUDgwUjIwTkcvcmVnLTAwMS1hZnRlci1hY2NvdW50LWRlbGV0ZS5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 7](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkUxMVZZVjVSRUdEUDgwUjIwTkcvcmVnLTAwMS1kZWxldGVkLXJlbG9naW4tZmFpbHMucG5n>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 8](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHMkUxMVZZVjVSRUdEUDgwUjIwTkcvcmVnLTAwMS13ZWxjb21lLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 1 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3YG2E11VYV5REGDP80R20NG-reg001 · run-scoped-http-cleanup · 2026-10-02T14:30:21.565Z · absent=true · sha256 c9b2653a6427ff4fba381bc6d1b111eb972a802941e5237652ca9d5c0242e8d2
