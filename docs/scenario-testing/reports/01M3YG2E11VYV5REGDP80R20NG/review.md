# 审核报告：认证核心场景回归（登录会话状态 + 独立合成数据路径）

- Run：`01M3YG2E11VYV5REGDP80R20NG`，`trigger = manual`，`scenarioMode = autonomous`，`initialization = false`，`targetCommit = 085ca4429557ba36c808808c9efeaac73f18b9a0`。
- 计划：`plan.md`，planHash `7773a626f433d168ae9a540a30a31e726759f7592db3f9760da44730e65bce28`（与计划开头 Harness 元数据一致，`query_source_reads(scope=plan)` 返回同一 planHash，引用回执有效）。
- 唯一执行集合（`## execution_scenarios`）：`AUTH-LOGIN-001`、`AUTH-REGISTRATION-001`（顺序即执行顺序）。本轮无 `scenario-changes.patch`（`scenarioChanges = null`），无维护变更可核。
- 审核方式：先读计划与冻结的 `selectedScenarioSnapshot` 正文（两场景 `redacted:false`，已获全文），再通过 `list_evidence_files` + `read_command_evidence` / `read_browser_evidence` / `read_evidence_image` 独立核对原始记录，最后对照 `execution.md`。
- 最终结论：**AUTH-LOGIN-001 = passed（含一项前置偏差，已记录）；AUTH-REGISTRATION-001 = blocked**（存在明列期望未取得运行时证据）。执行场景 2，passed 1，blocked 1，failed 0。未发现已确认产品缺陷。

> 说明：以下结论为本 Reviewer 依据原始证据独立形成，与 `execution.md` 一致处不另作归属；不一致处已明确标出。

---

## 1. 需求契约与场景期望（判定依据）

- 规格 `docs/changes/cynos-website-auth/spec.md`（已确认契约，读取回执 `fb8fc76f…`，`full-file`）：注册创建 7 天 HttpOnly/SameSite=Strict 会话、`/api/auth/status` 返回登录态与公开资料、`/api/me` 失效返回 401、`/api/auth/logout` 撤销会话、删号时用户行与全部会话原子删除。
- 场景正文（`selectedScenarioSnapshot`，非运行证据）：
  - `AUTH-LOGIN-001` 明列期望 4 项：刷新后显示同一用户；退出后页面回到登录状态；退出后的 Session 访问受保护接口返回 401；删除测试账号后旧 Session 和原凭据均不可用。
  - `AUTH-REGISTRATION-001` 明列期望 4 项：页面显示欢迎信息；`GET /api/auth/status` 返回已登录用户；**数据库不保存明文密码**；验证完成后可从欢迎页删除当前测试账号，原邮箱密码随后不能再登录。

---

## 2. 逐场景结果

### 2.1 AUTH-LOGIN-001 登录状态恢复 — 判定：passed（含前置偏差）

| 期望 | 实际观察（本 Reviewer 核对） | 证据引用 |
|---|---|---|
| 登录 | 登录表单填邮箱/密码后点击“登录”，页面切为已登录视图：“YOU ARE IN / 你好，Dedicated concurrency acceptance。”，含“退出登录”“删除测试账号” | 快照 `operation-8.json`；截图 `login-001-logged-in.png`（画面显示已登录卡片与显示名） |
| 刷新后显示同一用户 | 受控导航到同源首页后页面重新加载，仍显示同一已登录用户（前后同为该显示名） | 快照 `operation-12.json`；截图 `login-001-after-refresh.png`（与登录态一致） |
| 退出后回到登录状态 | 点击“退出登录”后页面回到登录表单并提示“已安全退出。”；随后 cookie 列表为空；网络序列含 `POST /api/auth/logout` → 200 | 快照 `operation-17.json`；`browser_cookie_list` `operation-18.json`（无 cookie 引用）；网络 `operation-21.json`；截图 `login-001-after-logout.png`（显示“已安全退出。”） |
| 退出后的 Session 访问受保护接口返回 401 | 退出前以 `browser_cookie_get` 读取原 `cynos_session`（observed-browser，`credential-2c11cbd2…`），退出后用 `cookie_set` 写回**同一引用值**（restore-input，同引用），再请求 `GET /api/me` → **401**，响应体 `UNAUTHORIZED/请先登录`；请求头 `cookie: [REDACTED]` 的引用与写回值相同（observed-request-header，同引用），证明该请求确实携带了原 Cookie | `operation-14.json`/`operation-15.json`（读取）、`operation-20.json`（写回）、`operation-27.json`（写回后 cookie 仍在）、`operation-26.json`/`operation-28.json`（请求头 + 401）、`operation-29.json`（响应体）；`page-…14-26-42-718Z.yml`（/api/me 401 页面）；console `…14-26-42-685Z.log`（/api/me 401） |
| 删除测试账号后旧 Session 与原凭据均不可用 | 重新登录成功（仍为同一用户）→ 点击“删除测试账号”→“测试账号及其会话已删除。”；网络序列 `POST /api/auth/login` 200 → `DELETE /api/me` 200 → `POST /api/auth/login` **401**；页面显示“邮箱或密码不正确”（提示 + 401 响应体 `INVALID_CREDENTIALS`） | 重登 `operation-35.json`；删除 `operation-36.json`/`operation-37.json`；截图 `login-001-after-account-delete.png`；网络 `operation-42.json`；复登失败 `operation-43.json`、`operation-45.json`、截图 `login-001-deleted-relogin-fails.png`（原邮箱填入 + “邮箱或密码不正确”） |
| 需要记录：Cookie 属性 | `cynos_session` 为 `httpOnly: true`、`sameSite: Strict`、`secure: false`（domain `luowang-pc-node-app`）；Cookie 原文未落盘 | `operation-15.json` |

结论：4 项明列期望均有充分实际观察支持，判定 **passed**。历史 Issue #3（退出未撤销服务端 Session）在本 target 上**未复现**——携带退出前原 Cookie 的 `GET /api/me` 返回 401，且请求头确有该原 Cookie（写回值与请求头引用一致），支持“服务端撤销”而非“仅客户端丢弃 Cookie”。

#### 前置偏差（记录，不改变本场景期望结论）

- 计划 §5/§8 要求 AUTH-LOGIN-001 使用带 `luowang-<完整RunID>-` 前缀的**新建并登记**合成账号，用于清理范围。但实际使用的是受控环境**预置账号**（截图 `login-001-logged-in.png` / `login-001-after-account-delete.png` 显示邮箱为 `pc-node@example.test`，显示名“Dedicated concurrency acceptance”），并在场景步骤 6 中被业务删除。`execution.md` §7 亦自述“使用的是受控环境预置专用账号（非 Run 前缀合成账号）”。
- 影响：① 与计划前置不符；② 该删除不属于 Run 前缀清理范围，是一个非本 Run 可再生资产被永久删除，可能影响后续依赖同一预置账号的场景/Run（`execution.md` 备注亦提示需另行确认可用性）。
- 本 Reviewer 判断：`AUTH-LOGIN-001` 场景自身的原文前置为“已存在一个非生产测试账户”，使用预置账号满足该原文前置；上述偏差不影响四条期望的观察有效性，故不据此改判场景结果，但作为计划一致性偏差与数据资产风险如实保留，供最终 Main 提示后续 Run。
- 另一等价操作说明：`browser_reload` 被工具拒绝，改用 `browser_navigate` 到同源首页实现“刷新”（`operation.md`/`execution.md` 自述）。导航触发整页重新加载，对“会话是否保持”的观察等价，认可为等价实现。

### 2.2 AUTH-REGISTRATION-001 新用户注册 — 判定：blocked

| 期望 | 实际观察 | 证据引用 | 判定 |
|---|---|---|---|
| 页面显示欢迎信息 | 切到“创建账户”表单填写昵称/邮箱/密码并提交后，页面显示“YOU ARE IN / 你好，…。”，并显示“当前登录邮箱是 luowang-…-reg001@example.test。” | 表单快照 `operation-52.json`/`operation-54.json`；提交网络 `operation-56.json`（`POST /api/auth/register` → 201）；欢迎快照 `operation-57.json`/`operation-64.json`；截图 `reg-001-welcome.png` | 已确认 |
| `GET /api/auth/status` 返回已登录用户 | 应用发起的 `GET /api/auth/status` → 200，响应体 `{"authenticated":true,"user":{email=luowang-…-reg001@…, displayName=…}}`；注册响应亦返回 `authenticated:true` 同一用户 | 网络 `operation-63.json`；响应体 `operation-65.json`（status）；注册响应体 `operation-59.json` | 已确认 |
| **数据库不保存明文密码** | **无运行时观察**。`execution.md` §4.3 自述受控只读工具 `inspect_test_account_storage` 返回“账号存储观察不可用”。现有证据仅注册请求/响应与页面行为，无任何持久层/数据库读回记录。 | 无（代码阅读 `schema.ts`/`auth.ts` 属实现依据，非运行时观察） | **未验证** |
| 删除后原邮箱密码不能再登录 | 欢迎页点击“删除测试账号”→“测试账号及其会话已删除。”；网络 `DELETE /api/me` → 200，随后 `POST /api/auth/login` → **401**，页面“邮箱或密码不正确”（响应体 `INVALID_CREDENTIALS`） | 删除网络 `operation-69.json`；提示快照 `operation-70.json`；截图 `reg-001-after-account-delete.png`；复登失败 `operation-75.json`/`operation-76.json`/`operation-78.json`、截图 `reg-001-deleted-relogin-fails.png`（邮箱 `luowang-…-reg001@example.test` + “邮箱或密码不正确”） | 已确认 |

结论：3/4 条明列期望已由实际观察确认，但**“数据库不保存明文密码”这一明列且适用的期望在本环境未取得任何运行时证据**（工具能力不足，非“不适用”）。按共同规则“任一适用期望尚不能确认，场景为 blocked”，本场景判定 **blocked**，已确认的成功项保留。

#### 与 `execution.md` 的分歧（明确标出）

- `execution.md` §4 与 §6 将 `AUTH-REGISTRATION-001` 判为 **passed（含一项运行时缺口）**。本 Reviewer 不采信该判定：该缺口正是一条**明列期望**本身未验证，不能作为“通过 + 备注”交付。按规则应为 **blocked**。Runner 对缺口的描述（工具不可用、未以源码替代运行时结论）如实，分歧仅在最终判定口径。
- 另：`execution.md` 将“登录账号被删除”标注为“非 Run 收尾动作、属场景步骤”，与证据一致；但未在同处点明该账号为**预置非前缀账号**（其 §7 有述），此处不构成实质矛盾。

---

## 3. 已确认产品问题

- 本批**未发现**已确认产品缺陷。
- 历史 Issue #3（退出未撤销服务端 Session）：本 target 上**未复现**，原 Cookie 重放 `GET /api/me` = 401（见 2.1）。
- 历史 Issue #4（欢迎页未保留输入昵称）：本批**未复现**。`reg-001-welcome.png` 画面显示欢迎标题为“你好，luowang-01M3YG2E11VYV5REGDP80R20NG-reg001。”，与注册所填的 Run 前缀昵称一致；快照中该文本被脱敏，注册/`status` 响应体的 `displayName` 亦为同一脱敏值，三处一致。需说明：输入昵称原文被脱敏，本 Reviewer 不能逐字符比对，只能确认“展示值与返回/输入同源且为 Run 前缀、非硬编码错误昵称”。场景原文不将“昵称=输入”列为通过条件（仅“需要记录”），故不影响本场景判定；该观察归本 Reviewer。

---

## 4. 执行记录问题（与产品结果分开）

1. **场景进度事件标签异常**：`operation-47.json`（14:27:07）为 `finish_scenario`，其 `scenarioId = "AUTH-REGISTRATION-001"`，而 `completed = ["AUTH-LOGIN-001"]`；紧接 `operation-48.json` 才 `start_scenario = AUTH-REGISTRATION-001`。即结束 AUTH-LOGIN-001 的事件被标成了第二个场景的 id。各操作自身的 `execution.scenarioId` 归属（op 1–46 属 LOGIN-001、op 49–71 属 REG-001）自洽，故不影响业务观察。`execution.md` §2 “无跨场景错报”的表述与原始进度记录不完全一致，属记录准确性小问题，不影响结论。
2. **准备阶段预置扫描**：`operation-1.json`（navigate）、`operation-2.json`（snapshot）`scope = auxiliary`、`declared = false`，在 `begin_scenario_execution`（op 3）之前，属正常准备行为，不计入场景。
3. **等价操作偏差**：`browser_reload` 被拒后改用 `browser_navigate`（见 2.1），以及 `browser_fill_form`/`browser_cookie_list` 旧 schema 被拒后调整参数，均为工具层偏差，未改变观察含义。
4. 口令/Cookie 处理：未在记录中看到口令原文；`credentialReferences` 仅以引用标识方式出现，符合“Cookie 原文不落盘”。本 Reviewer 复核中同样不复述任何口令值。

---

## 5. 覆盖缺口与未完成项

- **AUTH-REGISTRATION-001“数据库不保存明文密码”缺运行时证据**（阻塞原因）：受控存储观察工具不可用，无替代运行时途径。需后续获得可用工具或授权路径后补验，方可改判。
- **AUTH-LOGIN-001 使用了非 Run 前缀预置账号并被删除**：与计划前置不符；该账号不属 Run 清理范围，Harness 收尾无法按前缀回收。建议最终 Main 提示后续 Run 确认 `pc-node@example.test` 预置账号可用性。
- 本批**未执行**的计划已声明场景：`AUTH-LOGIN-002`、`AUTH-ACCESS-001`、`AUTH-ACCOUNT-001`、`AUTH-REGISTRATION-002`（非请求范围），draft 的 `AUTH-SECURITY-001/002`。本批结论不代表认证模块整体覆盖。
- 注册合成账号在场景步骤内被业务删除（`DELETE /api/me` 200）；`AUTH-LOGIN-001` 预置账号亦被删除。**测试收尾清理由 Harness 在最终 Main 后处理，不属本审核或测试阻塞**。

---

## 6. 证据引用汇总（稳定文件名）

- 命令/HTTP/网络：`operation-1…79.json`（关键：`operation-8/12/15/17/18/20/21/26/27/28/29`（LOGIN-001）；`operation-52/54/56/57/59/63/65/69/70/75/76/78`（REG-001）；标记异常：`operation-47/48`）。
- 浏览器快照：`page-2026-10-02T14-26-24-425Z.yml`、`page-2026-10-02T14-26-31-332Z.yml`、`page-2026-10-02T14-26-42-718Z.yml`、`page-2026-10-02T14-27-16-794Z.yml`、`page-2026-10-02T14-27-41-594Z.yml`。
- 截图：`login-001-logged-in.png`、`login-001-after-refresh.png`、`login-001-after-logout.png`、`login-001-after-account-delete.png`、`login-001-deleted-relogin-fails.png`、`reg-001-welcome.png`、`reg-001-after-account-delete.png`、`reg-001-deleted-relogin-fails.png`。
- 控制台：`console-2026-10-02T14-26-42-685Z.log`（/api/me 401）、`console-2026-10-02T14-26-46-823Z.log` 与 `console-2026-10-02T14-27-38-795Z.log`（/api/auth/login 401）。
- 计划来源：`query_source_reads(scope=plan)` 已核对 `AUTH-LOGIN-001.md`（`02a6ec45…`）、`AUTH-REGISTRATION-001.md`（`4a339eb5…`）`full-file`，与冻结正文哈希一致。

---

## 7. 结果汇总

- `AUTH-LOGIN-001` = **passed**（含“非 Run 前缀预置账号被使用并删除”的前置偏差，已记录）。
- `AUTH-REGISTRATION-001` = **blocked**（明列期望“数据库不保存明文密码”无运行时证据；其余 3 条期望已确认成功）。
- 已确认产品缺陷：无。历史 Issue #3、#4 在本 target 均未复现（见第 3 节）。
- 执行场景 2 / passed 1 / blocked 1 / failed 0；本批结论不覆盖未执行场景。
