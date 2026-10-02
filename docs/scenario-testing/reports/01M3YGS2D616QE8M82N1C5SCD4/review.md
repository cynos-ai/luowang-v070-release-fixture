# 审核报告：AUTH-LOGIN-001 登录状态恢复

- Run：`01M3YGS2D616QE8M82N1C5SCD4`，`trigger = manual`，`scenarioMode = autonomous`，`initialization = false`，`browserRequired = true`。
- 固定 target：`c985f1c7e6d9f3979756e374f2c1be443774f3f5`（`baseCommit = null`，`includedCommits = []`，无 diff 可比）。
- 计划执行集合（`## execution_scenarios`）：唯一项 `AUTH-LOGIN-001`，非空，故不存在零执行场景需核的理由。
- 场景快照：Harness 冻结正文与索引一致（`approved`，`tags: core/module:认证/flow:登录`，`redacted: false`，`patchSha256: null`）。计划未声明维护，`scenario-changes.patch` 不存在，与“回归已有场景、无 patch”一致；未发现“已维护”类不成立声明。
- 本报告基于我独立读取的原始证据形成：`operation-1`–`operation-62`、13 个 `page-*.yml` 快照、2 个 console 日志、7 张截图。判断先于阅读 `execution.md`，再行对照。

## 1. 逐场景审核结果

### AUTH-LOGIN-001 → **blocked**

原文 4 条期望逐条核对（快照/截图/HTTP 记录）：

| 期望 | 结果 | 关键依据 |
| --- | --- | --- |
| 刷新后显示同一用户 | 已确认符合 | `operation-25/26`（整页导航后仍为已登录欢迎视图，标题/邮箱与刷新前一致）、`operation-27`（重载后 `GET /api/auth/status => 200`）、截图 `AUTH-LOGIN-001-step2-after-reload.png` |
| 退出后页面回到登录状态 | 已确认符合 | `operation-30/32`（回到登录表单并显示“已安全退出。”）、`operation-33`（`POST /api/auth/logout => 200`）、截图 `AUTH-LOGIN-001-step3-after-logout.png` |
| 退出后的 Session 访问受保护接口返回 401 | 已确认符合 | `operation-35`（写回退出前固化的同值 Cookie，引用 `credential-cbce26…`，`source=restore-input`）、`operation-37/38`（导航 `/api/me`，网络 `[GET] /api/me => 401`）、`operation-40`（请求头观察 `cookie`，同一引用 `credential-cbce26…`，`source=observed-request-header`）、`operation-41/42`（响应头无 set-cookie；body `UNAUTHORIZED 请先登录`）、`page-2026-10-02T14-39-25-847Z.yml`、截图 `AUTH-LOGIN-001-step5-oldcookie-401.png` |
| 删除测试账号后旧 Session 和原凭据均不可用 | **未完全确认** | 原凭据不可用已确认：`operation-56/57/58/59/60`（`POST /api/auth/login => 401`，body `INVALID_CREDENTIALS`，页面“邮箱或密码不正确”）；账号删除已确认：`operation-51/52/53`（`DELETE /api/me => 200`，页面“测试账号及其会话已删除。”）。**但“旧 Session 不可用”缺删除后的服务端侧观察**，见下 |

**期望 3 的关联链完整（不含“原 Session”命名或状态顺序的推断）**：退出前读取的会话 Cookie（`operation-22`/`operation-24`，`observed-browser`，引用 `credential-cbce26…`）＝写回输入（`operation-35`，`restore-input`，同引用）＝该 401 请求实际请求头中的 cookie（`operation-40`，`observed-request-header`，同引用）。三者同一受控引用，"请求确已携带原 Cookie" 有独立受控记录，故可区分“服务端撤销”与“客户端仅丢弃 Cookie”。历史 Issue #3 描述的现象（退出后旧 Cookie 返回 200）在本 target 未复现，回归角度的核心点成立。

**阻断原因——期望 4 的“旧 Session 不可用”缺少直接观察。**
删除账号后，记录到的与“旧 Session”相关的现象只有客户端侧：`operation-54` 的受控 Cookie 列表为空、页面回到登录表单。这只能说明 Cookie 已被清理/页面已登出，**不能证明删除时该账号的会话在服务端已不可用**；删除后也**没有**用该账号的会话 Cookie 重放受保护接口（如 `GET /api/me`）的观察。Runner 在 `execution.md` 中对该点的论证是“删除前后 Cookie 列表均为空 + 删除前步骤⑤已确认服务端会撤销会话”，其中前半句是客户端命题，后半句对应的是**退出**（步骤⑤）而非**删除**，二者不能替代对“删除后旧 Session 服务端不可用”的实际观察。按共同规则，明列期望的证据只支持较弱命题时该期望仍未验证，故场景整体为 blocked，而非 passed 加备注。

原期望文字对会话可用性的证据标准是明确的（步骤⑤特意要求区分服务端撤销与客户端丢 Cookie）；期望 4 使用同一“旧 Session 不可用”表述却无对应的服务端侧复核，属适用期望未闭合。补足方式（供后续授权流程）：删除账号后，用删除前该账号在用的会话 Cookie（`operation-49`，引用 `credential-e93b4004…`）重放 `GET /api/me` 并保留“请求确已携带该 Cookie”的受控请求头记录，确认返回 401。

**其他未阻塞项（不影响上述结论，但如实记录）：**
- 期望 1/2/3 与删除账号、原凭据失效均已由充分实际观察支持；场景步骤、真实登录/退出/Jenkins 无跳过，未使用或删除预置账号（全程为 Run 前缀合成账号），未降低期望。
- Cookie 属性（“需要记录”）：登录后 `httpOnly=true, sameSite=Strict, secure=false`（`operation-24`/`operation-29`/`operation-49`），符合记录要求；写回工具的 `Lax/非HttpOnly` 属性差异只影响写回后属性显示，不影响基于 `name=value` 的 401 判定，Runner 已如实说明。
- 记录的“退出前固化 Cookie 重放结果”“请求携带原 Cookie 的受控记录”“删除后提示”“原凭据登录结果”均存在对应证据。
- 注册仅作前置：注册流程、Run 前缀登记属辅助范围；本轮未宣称验证注册场景。

## 2. 已确认产品问题

本次审核**未确认任何产品缺陷**：历史 Issue #3 现象未复现（见期望 3 依据）。不因 Issue #3 历史存在而补写通过说明，也不因本次未复现而扩大结论到未测试范围。

## 3. 证据引用汇总（稳定 ID）

- 场景边界：`operation-17`（begin_scenario_execution）、`operation-18`（start_scenario AUTH-LOGIN-001）、`operation-62`（finish_scenario）。
- 登录/刷新：`operation-19`、`operation-20`、`operation-21`、`operation-25`、`operation-26`、`operation-27`。
- 退出：`operation-30`、`operation-31`、`operation-32`、`operation-33`。
- 旧会话重放：`operation-22`、`operation-24`、`operation-29`、`operation-35`、`operation-36`、`operation-37`、`operation-38`、`operation-40`、`operation-41`、`operation-42`。
- 删除与复登：`operation-44`、`operation-46`、`operation-47`、`operation-48`、`operation-49`、`operation-51`、`operation-52`、`operation-53`、`operation-54`、`operation-56`、`operation-57`、`operation-58`、`operation-59`、`operation-60`。
- 截图：`AUTH-LOGIN-001-step1-logged-in.png`、`…step2-after-reload.png`、`…step3-after-logout.png`、`…step5-oldcookie-401.png`、`…step6-relogin.png`、`…step6-deleted.png`、`…step6-original-creds-rejected.png`（均经 `read_evidence_image` 实际查看；step6-deleted/original-creds-rejected 标注为“含可见表单值”，为被删账号登录表单保留值，属真实业务现场）。
- 快照/日志：`page-2026-10-02T14-39-25-847Z.yml`（`/api/me` 401 JSON 体）、`page-2026-10-02T14-39-31-387Z.yml`、`page-2026-10-02T14-39-44-453Z.yml`、`page-2026-10-02T14-39-38-765Z.yml`；`console-…14-39-25-814Z.log`（`/api/me` 401）、`console-…14-39-31-355Z.log`（`/api/auth/login` 401）。

## 4. 覆盖缺口与无法确认事项

1. **（阻塞，同上）期望 4 “旧 Session 不可用”**：缺少删除后用该账号会话 Cookie 访问受保护接口的服务端侧观察；仅有客户端 Cookie 被清理。删除后旧会话在服务端的可用状态**未能确认**。计划 §5.2 步骤⑥虽写有“记录删除后的提示、旧 Session 不可用与原凭据登录失败结果”，但未操作化为一次删除后的会话重放，计划侧亦存在该可操作化缺口。
2. **Runner 记录的审计偏差无法复核**：`execution.md` 称 `operation-10.json` 的参数被 Harness 记录为 `request_test_http/clientId=reg-precheck`，但我实际读取的 `operation-10.json` 显示 `tool: browser_snapshot`、`arguments: {}`，未见该参数。该说法我无法从证据确认；因其称属准备阶段冗余快照、不参与任何期望判定，对产品结论无影响，但该归属陈述本身待核实。
3. **非期望观察（超范围，仅记录）**：Runner 称注册后 Welcome 视图“未保留输入昵称”，但 `AUTH-LOGIN-001-step1-logged-in.png` 中欢迎视图标题实际渲染出所填昵称（Run 前缀 + `-runner`）。该项属注册/Issue #4 语义，超出本轮范围，不影响本场景结论；此处只说明其与本场景截图不一致。
4. **无 base**：`baseCommit = null`，无法判断“相对 base 的变化影响面”，本轮只能按固定 target 现行契约回归，该限制如实保留。
5. 未发现计划与固定场景正文的期望冲突；`exit scenario` / 场景维护声明无异常。

## 5. 结论

- 逐场景独立判断：`AUTH-LOGIN-001 = blocked`。其中期望 1、2、3 及期望 4 的“原凭据不可用”“账号确被删除”均获充分实际观察支持；期望 4 的“删除后旧 Session 不可用”未闭合，故不能判 passed。无已确认产品缺陷。
- 测试后临时数据清理（Run 前缀合成账号收尾核验）由 Harness 在最终 Main 后处理，不属于本审核范围；场景内的 `DELETE /api/me` 属期望验证，不作收尾结论。
