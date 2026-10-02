---
run_id: 01M3YGS2D616QE8M82N1C5SCD4
trigger: manual
base_commit: null
target_commit: c985f1c7e6d9f3979756e374f2c1be443774f3f5
included_commits: []
result: blocked
started_at: 2026-10-02T14:37:35.176Z
finished_at: 2026-10-02T14:41:36.751Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: blocked
confirmed_bugs: []
---

# 最终报告：AUTH-LOGIN-001 登录状态恢复 回归

## 1. 本轮范围与固定版本

- Run `01M3YGS2D616QE8M82N1C5SCD4`，`trigger = manual`，`scenarioMode = autonomous`，`initialization = false`。
- 固定 target：`c985f1c7e6d9f3979756e374f2c1be443774f3f5`；`baseCommit = null`，`includedCommits = []`。
- 人工请求要点：仅回归已有 approved 场景 `AUTH-LOGIN-001`，完整核验其全部既定期望，不扩大到注册或存储观察场景；因场景含删除账号，要求通过非生产注册流程创建带本 Run ID 的专用合成账号并登记，不得使用或删除预置账号；注册仅作该登录场景的前置准备，不宣称验证注册场景；按场景原文核验刷新、退出及旧 Session 失效。
- 计划唯一执行集合（`## execution_scenarios`）：`AUTH-LOGIN-001`，非空。本轮未产生场景 patch（请求明确不修改场景），场景 `AUTH-LOGIN-001.md` 保持原 ID、`approved` 状态与原期望。

## 2. 逐场景结果

### AUTH-LOGIN-001 → blocked

审核（review.md）独立读取原始证据后给出该结果：原文 4 条期望中 3 条获充分实际观察支持，第 4 条的一个组成命题未闭合，故不能判 passed。以下按期望逐条转录审核的判定与其依据：

| 期望 | 审核判定 | 关键依据（审核引用） |
| --- | --- | --- |
| 刷新后显示同一用户 | 已确认符合 | `operation-25/26/27`、`page-2026-10-02T14-39-25-847Z.yml` 系列、截图 `AUTH-LOGIN-001-step2-after-reload.png` |
| 退出后页面回到登录状态 | 已确认符合 | `operation-30/32/33`、截图 `AUTH-LOGIN-001-step3-after-logout.png` |
| 退出后的 Session 访问受保护接口返回 401 | 已确认符合 | `operation-35`（写回退出前固化 Cookie，引用 `credential-cbce26…`）、`operation-37/38`（`GET /api/me => 401`）、`operation-40`（请求头观察同一引用）、`operation-41/42`、截图 `AUTH-LOGIN-001-step5-oldcookie-401.png` |
| 删除测试账号后旧 Session 和原凭据均不可用 | **未完全确认** | 原凭据不可用已确认（`operation-56`–`operation-60`，`POST /api/auth/login => 401`）、账号删除已确认（`operation-51`–`operation-53`，`DELETE /api/me => 200`）；**“旧 Session 不可用”缺删除后的服务端侧观察** |

审核明确说明的期望 3 关联链：退出前读取的会话 Cookie（`operation-22`/`operation-24`，`observed-browser`）＝写回输入（`operation-35`，`restore-input`）＝该 401 请求实际请求头中的 cookie（`operation-40`，`observed-request-header`），三者同一受控引用 `credential-cbce26…`，因此“请求确已携带原 Cookie”有独立受控记录，可区分“服务端撤销会话”与“客户端仅丢弃 Cookie”。审核并记录：历史 Issue #3 描述的现象（退出后旧 Cookie 请求 `/api/me` 返回 200）在本 target **未复现**。

**阻塞原因（归审核，非本次重新分析）**：期望 4 的“旧 Session 不可用”缺少直接观察。审核指出，删除账号后记录到的相关现象只有客户端侧（`operation-54` 受控 Cookie 列表为空、页面回到登录表单），只能说明 Cookie 已被清理/页面已登出，**不能证明删除时该账号的会话在服务端已不可用**，且删除后没有用该账号会话 Cookie 重放受保护接口的观察。审核进一步指出，Runner 在 `execution.md` 中以“删除前后 Cookie 列表均为空 + 步骤⑤已确认服务端会撤销会话”论证该点，但前半句是客户端命题、后半句对应的是**退出**（步骤⑤）而非**删除**，二者不能替代对“删除后旧 Session 服务端不可用”的实际观察，故场景整体为 blocked，而非 passed 加备注。

审核给出的补足方式（供后续授权流程，本轮未执行）：删除账号后，用删除前该账号在用的会话 Cookie（审核引用 `operation-49`，引用名 `credential-e93b4004…`）重放 `GET /api/me`，并保留“请求确已携带该 Cookie”的受控请求头记录，确认返回 401。

## 3. 已确认产品问题与 Issue 决策

审核在第 2 节明确记录：本次**未确认任何产品缺陷**，历史 Issue #3 现象未复现，且不因 Issue #3 历史存在而补写通过说明，也不因本次未复现而扩大结论到未测试范围。

因此本报告 `confirmed_bugs` 为空，本轮不产生任何 `create`/`link` 决策，也未调用受限候选查询（无已确认 Bug key 可查）。这不代表对更广范围（如注册语义、Issue #4 相关现象）作出任何结论。

## 4. 覆盖缺口、限制与未决事项

1. **（阻塞项）期望 4 “删除后旧 Session 不可用”未闭合**：缺少删除后以该账号会话 Cookie 访问受保护接口的服务端侧观察；删除后旧会话在服务端的可用状态未能确认。审核指出计划 §5.2 步骤⑥虽写有“记录删除后的提示、旧 Session 不可用与原凭据登录失败结果”，但未操作化为一次删除后的会话重放，计划侧同样存在该可操作化缺口。本轮结果为 blocked；补足需另行确认授权后在受控环境执行上述重放。
2. **无 base 基线**：`baseCommit = null`，无法判断“相对 base 的变化影响面”，本轮仅按固定 target 现行契约回归。审核与计划均如实保留该限制。
3. **注册仅作前置，未验证**：本轮不验证任何注册场景期望（含存储/明文密码观察），也不宣称验证注册场景。
4. **审核记录的 Runner 审计偏差无法复核**：审核称 `execution.md` 描述 `operation-10.json` 的参数为 `request_test_http/clientId=reg-precheck`，但审核实际读取的 `operation-10.json` 显示 `tool: browser_snapshot`、`arguments: {}`，未见该参数。审核说明该归属陈述本身待核实；因其被称属准备阶段冗余快照、不参与任何期望判定，对产品结论无影响。本报告原文保留该未决矛盾，不作单方面采信。
5. **审核记录的非期望观察（超范围）**：Runner 称注册后 Welcome 视图未保留输入昵称；审核指出 `AUTH-LOGIN-001-step1-logged-in.png` 中欢迎视图实际渲染出了所填昵称。该差异属注册/Issue #4 语义，超出本轮范围，**不影响本场景结论**，仅如实记录两方表述不一致。
6. **收尾清理未在本报告内完成**：测试数据清理（Run 前缀合成账号的收尾核验）由 Harness 在本 Session 结束后统一处理，本轮不提前声称已完成。场景步骤⑥内的 `DELETE /api/me` 属期望验证，不作收尾结论。
7. **Cookie 属性记录差异（审核已说明，不影响结论）**：登录后 `cynos_session` 属性为 `httpOnly=true, sameSite=Strict, secure=false`（审核引用 `operation-24`/`operation-29`/`operation-49`），符合场景“需要记录”要求；写回工具的 `Lax`/非 HttpOnly 属性差异只影响写回后属性显示，不影响基于 `name=value` 的 401 判定。

## 5. 证据清单（与 review.md 口径一致）

审核说明其证据判断基于独立读取的：`operation-1`–`operation-62`、13 个 `page-*.yml` 快照、2 个 console 日志、7 张截图。审核并说明截图均经图像读取工具实际查看；其中 `step6-deleted` 与 `step6-original-creds-rejected` 标注“含可见表单值”（为被删账号登录表单保留值），属真实业务现场。审核另记录 `page-2026-10-02T14-39-25-847Z.yml`（`/api/me` 401）、`console-…14-39-25-814Z.log`（`/api/me` 401）、`console-…14-39-31-355Z.log`（`/api/auth/login` 401）。

说明：以上为审核交付的证据清单与归属表述。本 Run 的证据目录中另有 7 张命名截图与 `operation-1`–`operation-62`、`page-*.yml`、`console-*.log` 等文件；证据文件的存在本身不证明某执行者在本 Run 做过对应操作，具体执行归属以审核引用的操作记录为准。

## 6. 结论与下一步

- 本轮结果：**blocked**（依据优先级 blocked > failed > passed；本次无 failed，也无已确认产品缺陷）。
- 已完成并获充分支持的部分：期望 1（刷新后显示同一用户）、期望 2（退出后回到登录状态）、期望 3（退出后旧 Session 访问受保护接口返回 401，且“请求确已携带原 Cookie”有独立受控记录）、期望 4 中的“账号确被删除”与“原凭据不可用”。
- 未闭合的关键问题：期望 4 的“删除后旧 Session 不可用”缺少服务端侧观察，故整体不能判 passed。该缺失使本轮无法回答“删除账号后旧会话是否在服务端失效”这一关键问题；其余已确认部分仍具回归价值。
- 建议的下一步（需另行确认授权与环境范围，不视为本轮已有权限）：在受控非生产环境按审核补足方式，于删除账号后以该账号会话 Cookie 重放 `GET /api/me` 并保留请求头受控记录，确认 401；此外可一并复核第 4 节的审计偏差与第 5 节的两方表述差异。
- 本轮通过不得扩大为整个项目无问题；本轮未复现历史 Issue #3 亦不等于该问题在更广范围内不存在。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHUzJENjE2UUU4TTgyTjFDNVNDRDQvQVVUSC1MT0dJTi0wMDEtc3RlcDEtbG9nZ2VkLWluLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHUzJENjE2UUU4TTgyTjFDNVNDRDQvQVVUSC1MT0dJTi0wMDEtc3RlcDItYWZ0ZXItcmVsb2FkLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHUzJENjE2UUU4TTgyTjFDNVNDRDQvQVVUSC1MT0dJTi0wMDEtc3RlcDMtYWZ0ZXItbG9nb3V0LnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 4](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHUzJENjE2UUU4TTgyTjFDNVNDRDQvQVVUSC1MT0dJTi0wMDEtc3RlcDUtb2xkY29va2llLTQwMS5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 5](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHUzJENjE2UUU4TTgyTjFDNVNDRDQvQVVUSC1MT0dJTi0wMDEtc3RlcDYtZGVsZXRlZC5wbmc>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 6](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHUzJENjE2UUU4TTgyTjFDNVNDRDQvQVVUSC1MT0dJTi0wMDEtc3RlcDYtb3JpZ2luYWwtY3JlZHMtcmVqZWN0ZWQucG5n>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 7](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3Byb2plY3QtY29uY3VycmVuY3ktMjAyNjEwMDIvcHJvamVjdHMvNDZjYmM1NjgtY2JiOS00ZGM4LWI1NDEtZWE4OWE5NGM5MGY4L3J1bnMvMDFNM1lHUzJENjE2UUU4TTgyTjFDNVNDRDQvQVVUSC1MT0dJTi0wMDEtc3RlcDYtcmVsb2dpbi5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 1 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3YGS2D616QE8M82N1C5SCD4-acc · run-scoped-http-cleanup · 2026-10-02T14:41:54.853Z · absent=true · sha256 3d8f10adf02ea25e2a90b8edfb3c836c2565747d0e29206d12f8f637e555b92d
