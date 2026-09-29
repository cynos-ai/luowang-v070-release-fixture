# Review：受控双缺陷验收（AUTH-REGISTRATION-001、AUTH-LOGIN-001）

## 0. 审核依据与方法

- Run：`01M3NP2Y9YYCK7122EJMWT39XA`，`targetCommit = d0e3542de268e5552fa15bbd23c58fa9876353bd`，`scenarioMode = review-all`，`scenarioChanges = null`，`blockingReasons = []`，`browserRequired = true`。
- 已读取：`plan.md`（含唯一 `## execution_scenarios` 两行清单；planHash `765cb3d2…f926e`，与 Harness 元数据一致）；动态上下文 `selectedScenarioSnapshot` 中两个场景正文（均 `redacted: false`，正文已于执行前冻结）；`scenario-changes.patch` **不存在**（与计划「本轮不写 patch」一致）。
- 审核顺序：先读计划与 patch 状态、再核对 69 条 command/操作记录 + 16 份 page 快照 + 2 份 console + 3 张截图，形成判断后才打开 `execution.md`（已按要求成功读取）。
- 证据清单自洽性：`list_evidence_files` 共 90 件 = 3 图 + 2 console + 69 operation + 16 page，与 execution.md「已上传 90 个 evidence 文件」一致。
- 本报告中的观察分三类：**Reviewer 独立观察**（我直接读证据得到的）、**Runner 陈述**（execution.md 原文）、**依据引用**（场景/spec 原文）。未读到的内容不补写。

## 1. 逐场景结论

### 1.1 AUTH-REGISTRATION-001（新用户注册）— **failed**

已执行的适用期望与实际观察：

| 期望（场景正文） | 实际观察 | 判定 |
| --- | --- | --- |
| 页面显示欢迎信息 | 提交注册后页面立即渲染 Welcome 卡（`operation-11` 快照、`reg001-first-welcome.png`） | 字面满足 |
| 欢迎信息反映本次注册的账号身份（见下「判定依据」） | 首次 Welcome 标题为 `你好，Controlled Wrong Name。`、头像首字母 `C`；刷新后同一账号显示为输入昵称（首字母 `L`，值受脱敏保护） | **违反** |
| `GET /api/auth/status` 返回已登录用户 | 刷新后 200，`authenticated:true`，`user.id` 与注册返回一致，`displayName` 为库值（`operation-19`/`operation-21`） | 符合 |
| 数据库不保存明文密码 | 无可用持久层观察 | **未确认（缺口）** |
| 可从欢迎页删除当前测试账号，原邮箱密码随后不能再登录 | `DELETE /api/me` 200 → 页面「测试账号及其会话已删除。」并回登录卡 → 原凭据登录 `401`（`operation-22`/`23`/`25`/`26`/`27`） | 符合 |

**判定依据（含我的独立核对）**：

- 注册成功响应体（同源、受控网络记录，`operation-15`）：`POST /api/auth/register => 201 Created`，`user.email` 为本次输入的 Run 前缀邮箱，但 `user.displayName` 为 `Controlled Wrong Name`；响应头 `content-type: application/json`、`content-length: 217`（`operation-14`）。请求头 `origin/referer/host` 均指向被测站点 `172.17.0.3:3100`，可确认该响应来自被测应用（`operation-16`）。
- 首次 Welcome 页面（`operation-11` 快照与 `operation-12` 截图 `reg001-first-welcome.png`）独立显示同一字符串 `Controlled Wrong Name`，头像首字母 `C`——与响应体互相印证，属两个来源的同源观察，非单一断言。
- 对照组：同一账号刷新后（`operation-18`/`operation-20`）头像首字母变为 `L`、标题昵称被脱敏保护，`GET /api/auth/status` 200 返回库值昵称（`operation-21`）。输入昵称在 Harness 脱敏规则下被识别为受控值（`operation-8`/`operation-32` 中该值带 `valueReference`），而 `Controlled Wrong Name` 未被脱敏——这两点独立支持「首次 Welcome 显示的不是用户输入昵称」。
- 判定说明（Reviewer 观察，如实标注解释成分）：「页面显示欢迎信息」这一条**字面上是满足的**（Welcome 确实渲染了）。将其判为违反，依赖三条依据合并：场景目的「使用邮箱、**昵称**和符合要求的密码创建账户」；「需要记录：**页面展示的用户昵称**」；以及独立契约 `docs/changes/cynos-website-auth/spec.md` 行为 2「注册成功返回用户公开资料」（plan §2/§3 引用）。首次 Welcome 展示的是一个与提交昵称无关的硬编码名字，即注册接口没有返回该账号的公开资料，构成对场景目的与上述记录项的功能违反。该解释已在计划中明示，我认可其在场景语义内成立，但请最终 Main 在成文时保留「字面措辞与解释依据」的区分，不要写成场景原文直接断言「昵称等于输入值」。

**未闭合项**：`数据库不保存明文密码` 无任何受控持久层观察。Runner 称 `inspect_test_account_storage` 返回不可用，但**证据清单中不存在该调用的受控回执**（69 条 operation 全部为 `playwright-mcp-tool-result` 或 `scenario-progress`），故该陈述在我可核对的范围内无法验证；我只能确认「现有已捕获证据未包含持久层观察」。按规则，该期望保持未确认，且**不因缺陷 A 已成立而豁免记录**。它不改变 failed 结论（违反已被独立证实）。

### 1.2 AUTH-LOGIN-001（登录状态恢复）— **failed**

| 期望（场景正文/步骤 5） | 实际观察 | 判定 |
| --- | --- | --- |
| 刷新后显示同一用户 | 重新导航到 `/` 后页面显示同一用户、`user.id` 一致、`GET /api/auth/status` 200（`operation-40`/`41`/`42`/`43`） | 符合 |
| 退出后页面回到登录状态 | `POST /api/auth/logout` 200，页面「已安全退出。」并回登录卡（`operation-45`/`46`/`47`） | 符合 |
| 退出后的 Session 访问受保护接口返回 401 | 携带**退出前原 Session Cookie** 的 `GET /api/me` 返回 **200**，并渲染出该用户 JSON（`operation-55`/`56`/`57`/`51`/`53`） | **违反** |
| 删除测试账号后旧 Session 和原凭据均不可用 | 原凭据登录 401 已确证；旧 Session 仅间接观察 | 部分确认（见下） |

**缺陷 B 证据链（我逐条核对，来源与顺序一致）**：

1. 退出前固化 Cookie：`browser_cookie_get` 返回 `cynos_session`，属性 `domain: 172.17.0.3, path: /, httpOnly: true, secure: false, sameSite: Strict`（`operation-44`，`source: observed-browser`）。
2. 点击退出：`POST /api/auth/logout => 200`（`operation-46`），UI 回登录态（`operation-47`）。
3. 退出后再读同一 Cookie：**reference 与步骤 1 完全相同**（`operation-48`）→ 服务端未清理/轮换该 Cookie。
4. 退出后访问 `/api/me`：`GET /api/me => 200`（`operation-55` 以 `static:true` 取得文档导航请求），请求头 `cookie: [REDACTED]` 且其 `credentialReferences` 的 reference **与步骤 1/3 相同**（`operation-57`，`source: observed-request-header`）；响应头 `content-length: 220`、`date: Tue, 29 Sep 2026 04:20:26 GMT`（`operation-56`）；页面直接渲染该用户 JSON（`operation-51` 快照、`operation-53` 截图 `api-me-after-logout-replay.png`，我已在受控工具中实际读取，确认为 `/api/me` 的用户 JSON）。
5. 追加印证（用户可见层面）：退出后再访问 `/`，页面**仍显示已登录欢迎页**（`operation-59`）。

结论：这个 reference 在 Run 内表示同一值，因此可确认请求携带的是退出前的原 Cookie，而服务端以 200 响应——即 logout 未撤销服务端会话。**违反场景步骤 5「确认返回 401，以证明是服务端撤销了该会话」与期望「退出后的 Session 访问受保护接口返回 401」**，同时违反 spec 行为 6 与验收条件「退出后同一 Session 不能访问受保护 API」。该期望必须判未通过，不能以「关联较弱但足够」或「其他回归正常」降级。

方法备注（Reviewer 观察）：计划的严格要求是「用受控手段恢复/携带该原 Cookie 重放」。实际做法是先固化原 Cookie 的值引用，退出后不依赖任何恢复动作，直接由浏览器自身 Cookie 罐发出请求；由于 Cookie 读值在退出前后一致、且请求头 reference 与之一致，本场景要回答的问题（退出后原 Session 是否仍可用）已被直接观察到，判定不受方法差异影响。反之，若只依据「浏览器已无 Cookie 的普通未认证请求返回 401」则不能作为判定依据——本次并非该情形。

**未闭合/受限项**：

- `删除测试账号后旧 Session 不可用`：`DELETE /api/me` 200、页面提示「测试账号及其会话已删除。」（`operation-61`/`62`）**足以确证账号删除**；此后 `browser_cookie_list` 未返回任何 Cookie 引用（`operation-63`）——我按受控元数据判读为「浏览器侧已无该 Cookie」，但该回执 `output` 为省略态，Harness 明确提示「省略/截断输出不能证明缺失」，因此「旧 Session 服务端失效」**没有直接重放证据**（Runner 使用的「No cookies found」字样在受控回执中并不存在，属其解读）。原凭据登录 `401` 已由 `operation-66`/`67` 与截图 `login001-deleted-relogin-401.png`（我已读取，页面显示「邮箱或密码不正确」并回填原邮箱）确证。整体该项记为**部分确认**，不改变 failed 结论。
- Cookie 属性记录项已满足：`httpOnly: true`、`sameSite: Strict`（`secure: false`，http 环境可解释）；该项是「需要记录」项，不单独构成期望。
- 步骤偏差（如实记录）：场景步骤 6 为「重新登录后删除当前测试账号」。由于 logout 未真正生效（缺陷 B），账号在「仍登录」状态下被删除，未发生重新登录。这改变了操作序列，但被检查的期望（删除后原凭据不可用）已用真实证据确认，不构成 blocked。

## 2. 已确认产品缺陷（两个独立 bug key）

### 缺陷 A（注册应用层）：注册成功响应/首次 Welcome 不保留输入昵称

- 期望（依据）：注册成功返回该用户的公开资料，首次 Welcome 展示本次注册账号的昵称（场景目的 + 需要记录项 + spec 行为 2）。
- 实际：`POST /api/auth/register` 201 响应体 `user.displayName = "Controlled Wrong Name"`（`operation-15`），首次 Welcome 渲染同名字符串与首字母 `C`（`operation-11`、截图 `reg001-first-welcome.png`）；刷新后自愈为库值昵称（`operation-20`/`21`）。
- 复现条件：全新账号注册 → 提交 → 不刷新即读取响应体与 Welcome 卡片。跨两个场景账号均可复现（reg001 见 `operation-15`；login001 注册后同样显示 `Controlled Wrong Name`，`operation-39`）。
- 影响：新用户首次进入时看到错误身份，注册响应契约被违反；仅在刷新后自愈，属用户可见缺陷。
- 归属：只对 target `d0e3542` 整体验收成立；无逐提交 diff，不作「某提交引入」归因。

### 缺陷 B（会话层）：logout 未撤销服务端会话

- 期望（依据）：`POST /api/auth/logout` 撤销当前 Session 并清理 Cookie；退出后同一 Session 访问受保护 API 返回 401（场景步骤 5/期望 + spec 行为 6 + 验收条件）。
- 实际：logout 返回 200 且前端显示「已安全退出」，但会话 Cookie 值在退出前后一致（`operation-44` vs `operation-48`），携带该原 Cookie 的 `GET /api/me` 返回 **200**（`operation-55`/`57`），再次访问站点仍显示已登录（`operation-59`）。
- 复现条件：登录 → 固化 `cynos_session` → 点击退出 → 携带该 Cookie（或直接重载站点）访问 `/api/me`。
- 影响：安全会话撤销失效，页面「已退出」为假象；账号删除前旧会话一直有效。

两个 bug key 依入口与行为不同而独立成立（注册响应/Welcome vs 退出会话撤销），未合并。

## 3. 与 `execution.md` 的一致性核对

一致项（我逐条核对通过）：两场景结果均为 failed；缺陷 A/B 的证据引用与状态码（201/200/401）与受控回执一致；`operation-44`/`48`/`57` 的引用同一性判断正确；「刷新自愈」「删除后原凭据 401」「`static:true` 才能列出文档导航」等描述与证据相符；`operation-5` 首次 click 因参数名被拒已如实记为偏差；场景 2 建号时昵称字段被 `fill_form` + 两次 `type` 触碰，最终 `displayName` 为完整 Run 前缀昵称（截图可见一次拼接结果），不影响任何期望判定。

需要修正/补强的表述（均不改变结论）：

1. Runner 关于 `register_test_data`、`inspect_test_account_storage` 的陈述缺少受控回执（证据清单无对应条目），不宜表述为已核实事实；「数据库不保存明文密码」只能写「未确认」。
2. `operation-63` 应描述为「`browser_cookie_list` 未返回 Cookie 引用（输出省略）」，而非引用不存在的「No cookies found」原文；相应地「删除后旧 Session 不可用」应标为部分确认。
3. 时间基准确有不确定性：两份 console 日志（`console-2026-09-29T04-19-41-615Z.log`、`console-2026-09-29T04-20-38-415Z.log`）各含一条 `/api/auth/login` 401 记录，但其文件时间戳（04:19:41 / 04:20:38）早于对应登录 401 操作（`operation-25`/`operation-65`，约 04:19:52 / 04:20:48），文件名时间与事件时间的关系无法从现有记录确定；二者内容与「登录失败 401」结果一致，不改变判定，不应据此写精确跨来源事件时间。Runner 已声明不做跨来源精确时间结论，此处仅补充说明日志本身的对齐疑点。
4. 记账细节：`operation-3`、`operation-30` 的 `execution.scenarioId` 为 `null`（后者发生在 AUTH-LOGIN-001 开始之后），属执行记录归属的小瑕疵，不影响证据内容判断。

## 4. 覆盖与流程缺口

- **场景选择与维护**：两个 approved 场景覆盖两个 bug key，无需新增/改写；本轮未写 `scenario-changes.patch`，与「不得修改场景文件」一致——execution.md 也未声明已维护场景，无「已维护」虚述问题。
- **未执行的场景**：其余 approved/draft 场景本轮不执行，属计划与请求明确范围；本轮结论不代表认证模块整体覆盖完整，最终 Main 不得外推。
- **Issue 处理缺口**：原请求要求「若运行时违反期望，执行 Issue 候选查询并按各自 bug key 创建或关联测试 Issue」。Runner 声明其 Session 未提供相应工具，故未执行；`blockingReasons` 为空，说明 Harness 未将其列为阻断。两个 bug key 的候选查询与 Issue 创建/关联仍是**未完成事项**，需要具备受控工具的角色补做；本审核不声称「无重复 Issue」。
- **清理**：两个 Run 前缀账号均已在场景内经业务接口删除（两处 `DELETE /api/me` 200 + 原凭据 401）。Rrunner 登记声明缺少受控回执（见 §3.1）；收尾清理与核验由 Harness 在最终 Main 后处理，本审核不声明清理完成，也不因清理状态改变场景结论。
- **人工复核**：本流程 Agent 为模型；截图由我在受控工具中实际读取并核对内容，但**不构成人工复核**，本 Run 无人工复核记录。

## 5. 总体结论

- `AUTH-REGISTRATION-001`：**failed**（缺陷 A 已由注册响应体 + 首次 Welcome 两个同源观察独立证实）；同场景「数据库不保存明文密码」**未确认**，保持未闭合。
- `AUTH-LOGIN-001`：**failed**（缺陷 B 已由退出前后 Cookie 值一致 + 携带原 Cookie 的 `GET /api/me` 200 的请求头证据证实）；「删除后旧 Session 不可用」为部分确认，「原凭据不可用」已确证。
- 两处缺陷分属独立 bug key，预期与计划一致；未发现必须新增的场景、被执行者降低的期望，也未发现 Runner 把源码分析冒充实际执行（两个 bug 均可由浏览器/网络证据支撑）。

## 6. 稳定证据引用（供最终 Main 直接使用）

- 缺陷 A：注册响应体 `operation-15`；响应头 `operation-14`；请求头 `operation-16`；首次 Welcome 快照 `operation-11`；截图 `reg001-first-welcome.png`（文件级引用：`/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTlAyWTlYY...` 见 execution.md 收尾段原样地址）；刷新对照 `operation-18`/`20`/`21`；login001 侧复现 `operation-39`。
- 删除后禁用（场景 1）：`operation-22`/`23`/`25`/`26`/`27`。
- 缺陷 B：固化原 Cookie `operation-44`；退出 `operation-45`/`46`/`47`；退出后 Cookie 未变 `operation-48`；`GET /api/me => 200` `operation-55`；响应头 `operation-56`；请求头含原 Cookie `operation-57`；页面渲染用户体 `operation-51`；截图 `api-me-after-logout-replay.png`；退出后仍显示登录态 `operation-59`。
- 删除与凭据复查（场景 2）：`operation-61`/`62`；Cookie 列表无引用 `operation-63`；填表 `operation-64`；`POST /api/auth/login => 401` `operation-66`；快照 `operation-67`；截图 `login001-deleted-relogin-401.png`。
- 场景进度/顺序：`operation-1`（begin）、`operation-2`（start 注册）、`operation-28`（finish 注册）、`operation-29`（start 登录）、`operation-69`（finish 登录，completed=2/2，仅作收尾记录，不代表实时进度或业务判定）。
