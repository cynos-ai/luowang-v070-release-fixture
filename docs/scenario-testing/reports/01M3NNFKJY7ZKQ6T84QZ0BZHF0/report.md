---
run_id: 01M3NNFKJY7ZKQ6T84QZ0BZHF0
trigger: manual
base_commit: 7bb8b1b9f63be01414198703e715b005b7964d00
target_commit: 501db1bdd91a5337bb5994d2c704559a8d0740b9
included_commits: []
result: blocked
started_at: 2026-09-29T04:06:40.192Z
finished_at: 2026-09-29T04:08:00.012Z
scenario_results:
  - id: AUTH-ACCESS-001
    result: blocked
confirmed_bugs: []
---

# 最终报告：受控 blocked 验收（AUTH-ACCESS-001）

## 1. 本次范围与固定版本

- 请求：受控 blocked 验收。非生产测试环境已由操作者暂时停止；仅尝试既有 approved 场景 `AUTH-ACCESS-001`；不得修改场景文件、不得把环境不可达判为产品 failed、不得推进 target；应如实记录依赖不可达并以 blocked 结束；不创建测试数据。
- 固定版本：`baseCommit = 7bb8b1b9f63be01414198703e715b005b7964d00`，`targetCommit = 501db1bdd91a5337bb5994d2c704559a8d0740b9`，`includedCommits = []`。
- `scenarioMode = review-all`，`initialization = false`，`scenarioChanges = null`（本次无场景维护，无 `scenario-changes.patch`）。
- 本次为**验收尝试**而非变更验证：target 相对 base 仅新增上一 Run（`01M3NN2QJG1FJ5V5VV9XJGVSD6`）的报告/审核文档，无产品源码、配置或场景正文变化（依据 plan.md 第 2 节）。结论只对 target 整体，**不能归因到具体提交**。
- 正式执行集合来自 plan.md 唯一的 `## execution_scenarios`，仅一项：`AUTH-ACCESS-001`，顺序即执行顺序。

## 2. 逐场景结果

### AUTH-ACCESS-001 — 未登录访客无法访问受保护资料：**blocked**

场景三个适用期望（均为通过条件）：

1. 页面显示登录表单，未展示任何用户资料；
2. `GET /api/auth/status` 返回 `authenticated:false`、`user:null`；
3. `GET /api/me` 被拒绝（4xx），未返回用户资料。

依据（来自 review.md 的独立审核，Reviewer 观察口径）：

- 步骤 1（未登录打开用户中心）：`operation-3.json`（sequence 3，`browser_navigate`，`2026-09-29T04:07:20.876Z`）与 `operation-4.json`（sequence 4，`browser_navigate`，`04:07:22.078Z`）均 `isError: true`；两条回执 `arguments: {}`、`output` 被省略，无法从回执本身确认各自导航目标 URL。
- 页面呈现：`operation-5.json`（sequence 6，`browser_snapshot`，`04:07:23.776Z`）返回脱敏快照为 Chrome 错误页 heading “This site can’t be reached”、`172.17.0.3 refused to connect.`、`ERR_CONNECTION_REFUSED`，未见任何登录表单或用户资料控件。截图 `auth-access-001-connection-refused.png`（`operation-6.json`，sequence 7，sha256 `c43bfce56a3057c8906a9df8fb53c3e3eb71c444095c7a0fbe41fdf17e2d5af9`）经 Reviewer 用 `read_evidence_image` 实际读取，画面与快照一致。期望 1 中“显示登录表单”**未获得实际观察**；仅能观察到“未展示用户资料”（在错误页上）。
- 步骤 3/4（两个接口）：本 Run 9 个证据中没有任何一条记录 `GET /api/auth/status` 或 `GET /api/me` 的响应状态或正文。期望 2、3 **完全未验证**。
- 依赖可达性：浏览器导航报错并停在 `ERR_CONNECTION_REFUSED`（主机 `172.17.0.3` 拒绝连接），说明被测应用在本次执行时未在该地址监听。该现象与被计划所载的“非生产测试环境已暂时停止”运营前提一致；**该前提为操作者声明，非本 Run 工具验证**。
- 辅助命令：`command-1.json`（sequence 5，字段标注 `scenarioId: AUTH-ACCESS-001`，`startedAt/finishedAt` 同为 `04:07:23.777Z`）内容为一次 curl 调用尝试，结果为 `COMMAND_NOT_ALLOWED: 不允许运行命令：curl`。该拒绝**不构成可达性观察**；Runner 与 Reviewer 均如此定性。

判定：三个适用期望均无充分实际观察支持 → 场景 **blocked**（非 failed，也非 passed）。依赖不可达属外部环境状态，不是产品缺陷。

## 3. 冲突与聚合

- 动态上下文 `blockingReasons = []`，与场景未闭合（依赖不可达）的实质并不冲突：`blockingReasons` 为空描述的是 Run 级阻塞声明字段，本 Run 的阻塞来自被测依赖不可达导致期望无法确认，按聚合规则 `blocked > failed > passed` 及“任一适用期望尚不能确认即 blocked”，最终结果为 **blocked**。
- 场景进度登记（`operation-1` `begin_scenario_execution` 04:07:17.096Z → `operation-7` `finish_scenario` 04:07:26.278Z，`completed:["AUTH-ACCESS-001"]`）仅表示进度登记完成，**不代表期望通过**；Reviewer 亦明确此点。
- 步骤叙述排序与时间线不一致：execution.md 步骤表格把“页面呈现/截图”排在“读取 `/api/auth/status`”之前，但按回执 sequence 实际是两次 `browser_navigate`（seq 3、4）先发生，`browser_snapshot`（seq 6）、截图（seq 7）在后，curl 尝试（seq 5）夹在中间。属叙述排序问题，不改变“连接被拒绝、无应用层响应”的实质结论（review.md 第 2 节）。

## 4. 已确认产品问题与 Issue 决策

- **本次 confirmed Bugs：无。** 本 Run 未获得任何应用层响应，无法判定任何规格行为被违反，也无证据支持产品缺陷。
- 因 `confirmed_bugs` 为空，无需调用 `query_issue_candidates`；**本次无 Issue 查询覆盖缺口**，也未产生任何 create/link 决策。本报告不表示已创建或关联任何 Issue。

## 5. 覆盖缺口与无法确认的事项（保留 Reviewer 的限制与疑问）

1. **Runner 声称的两次受控 HTTP 尝试缺失证据。** execution.md 第 2 节称步骤 3、4 除浏览器导航外还调用了受控 `request_test_http`（`/api/auth/status`、`/api/me`）并失败，但本 Run 的 9 个证据文件中没有对应命令回执，逐条读取的 operation/command 中也无任何 `request_test_http` 记录。该主张**无本 Run 原始记录支持**，属未获证据支持的主张，下游不应据此声称接口已探过。不影响本场景 blocked 结论（浏览器侧已独立证明连接被拒绝）。
2. **导航目标 URL 不可核验。** 两条 `browser_navigate` 回执的 `arguments` 为空、`output` 被省略，无法确认其中一条确实是 `/api/auth/status`；快照只能证明主机 `172.17.0.3` 拒绝连接，不能区分路径。
3. **环境不可达的前提来自操作者声明。** 本 Run 实际观察到的是“该地址拒绝连接”；“环境已被暂时停止”本身无本 Run 工具证据，属运营前提。不可达≠产品缺陷的定性不受影响。
4. **执行阶段来源回执为空。** Runner 关于“场景正文实读”“`get_test_environment` 返回环境地址”等陈述，在 `query_source_reads(stage:"runner-execution")` 中无回执（该阶段 receipts 为空），无本 Run 来源可核。场景正文可用性已由规划期回执与动态场景快照独立覆盖，故不影响审核判断；环境地址仅作运营信息，未被用于任何功能结论。
5. **未测试范围。** 本 Run 仅 `AUTH-ACCESS-001`；`AUTH-REGISTRATION-001/002/003`、`AUTH-LOGIN-001/002`、`AUTH-ACCOUNT-001`、`AUTH-SECURITY-001/002` 均不在执行范围，本次结论**不代表认证模块整体覆盖**，也不得由本 Run 推断其通过性/缺陷状态。
6. **历史结论不可替代本 Run 观察。** 计划所载历史 Run（`01M3NM8QR81GNAV2YW2HF2T6H4`，target `a977ef3c…`）曾在不同环境判 `AUTH-ACCESS-001` passed，属历史结论，不能替代本 Run 在环境不可达下的实际观察。
7. **时间与证据归属。** 本 Run 各回执时间为执行期 Harness 记录时间（同一时间基准内的先后关系可确认）；场景内未见服务器侧时钟记录，故不作真实服务器时钟结论。Reviewer 的独立观察（读图、读 command 证据）与 Runner 的陈述已分别标注来源；本流程 Agent 为模型，无人工复核记录，不声称人工已确认。
8. **测试数据与清理。** 无证据显示本 Run 调用过写端点或创建测试数据，execution.md 亦声明未登记清理项；场景本身只需未登录访客观察，无需账号。测试数据清理由 Harness 在本 Session 结束后统一处理，本报告不提前声称已完成。

## 6. 结论与下一步

- 整体结果：**blocked**——唯一执行场景 `AUTH-ACCESS-001` 的三个适用期望均因被测环境不可达（`172.17.0.3` 拒绝连接，`ERR_CONNECTION_REFUSED`）而无法获得实际观察；已获得的观察仅为浏览器错误页。
- 未确认任何产品 Bug；未推进 target；未修改场景文件；未创建测试数据；无场景维护声明需要核销（本次无 patch）。
- 最小复现条件：target `501db1bdd91a5337bb5994d2c704559a8d0740b9`，在被测地址无监听时访问页面与两个接口均以连接被拒绝结束。
- 建议下一步：在操作者恢复非生产测试环境监听后，重跑 `AUTH-ACCESS-001` 以闭合验证（页面呈现 + `/api/auth/status` + `/api/me`）。环境恢复属运营动作，需由有权操作者确认后再触发，不属本 Run 现有授权范围。

## 7. 证据引用（稳定 URL）

- `operation-3.json`：`/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk5GS0pZN1pLUTZUODRRWjBCWkhGMC9vcGVyYXRpb24tMy5qc29u`
- `operation-4.json`：`/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk5GS0pZN1pLUTZUODRRWjBCWkhGMC9vcGVyYXRpb24tNC5qc29u`
- `operation-5.json`：`/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk5GS0pZN1pLUTZUODRRWjBCWkhGMC9vcGVyYXRpb24tNS5qc29u`
- `operation-6.json`：`/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk5GS0pZN1pLUTZUODRRWjBCWkhGMC9vcGVyYXRpb24tNi5qc29u`
- `auth-access-001-connection-refused.png`：`/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk5GS0pZN1pLUTZUODRRWjBCWkhGMC9hdXRoLWFjY2Vzcy0wMDEtY29ubmVjdGlvbi1yZWZ1c2VkLnBuZw`（sha256 `c43bfce56a3057c8906a9df8fb53c3e3eb71c444095c7a0fbe41fdf17e2d5af9`）
- `command-1.json`：`/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk5GS0pZN1pLUTZUODRRWjBCWkhGMC9jb21tYW5kLTEuanNvbg`

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9ldmlkZW5jZS9wcm9qZWN0cy83MzdiNjhhZS1lZDQ3LTQ5Y2MtYWU1NC0zZDYxZWU1M2RhYmYvcnVucy8wMU0zTk5GS0pZN1pLUTZUODRRWjBCWkhGMC9hdXRoLWFjY2Vzcy0wMDEtY29ubmVjdGlvbi1yZWZ1c2VkLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

没有待清理的测试数据

全部登记测试数据均已独立核验清理
