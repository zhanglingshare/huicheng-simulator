# 惠城区全站数据审计与重构方案

日期：2026-11-06　审计对象：`huicheng-simulator` 全部 19 个页面（18 个根页面 + `v1031/index.html`）
审计方式：脚本全量扫描（数据引用、内嵌副本、基线数字出现次数、时点词、JS 依赖），非抽样。

---

## 0. 一句话结论

全站有 **6 套数据来源**，Skill 只维护其中 **2 套**。
所以「Skills 重构」的真正问题不是 Skill 写得不够好，而是**页面在别处藏了 4 套自己的数据副本**——Skill 更新得再准，主入口页面也看不见。

重构方向不是重写页面，而是建立三层契约：**唯一真源（Skill 写）→ 唯一适配层（JS 读）→ 页面只呈现（不存数）**。

---

## 1. 页面 × 数据来源矩阵

| # | 页面 | 行数 | 实际数据来源 | 内嵌副本 | 时点标注 | 判定 |
|---|---|---|---|---|---|---|
| 01 | index.html | 340 | 无（ui.js 导航） | — | — | 需加全局数据期次角标 |
| 02 | holo-workspace.html | 3081 | **纯内嵌整套关系数据** | 3 处 schema、72 处 node_id、46 处 10-29 | 内嵌 10-29 | **P0 双源分叉** |
| 03 | today.html | 460 | 页面硬编码 | 社消零 2025 ×5 | 2025 | P1 页面名"钱去哪了"却无 2026 数据 |
| 04 | fun.html | 435 | life.json + 内嵌 BASE_SNAPSHOT | 整套 life 快照 | fallback 文案"10/29 示例快照" | P0 文案过期 / 双源 |
| 05 | choices.html | 101 | 关系三件套（`choices-kg.js`，`?kg=v41` 防缓存） | 无 | 动态 | **健康范式，可作模板** |
| 06 | future.html | 1030 | model.js + 硬编码 | TARGET ×13 | 2025 基线 | 模型页，缺期次 |
| 07 | windtunnel.html | 357 | model.js + 硬编码 | 固投/高新/TARGET | 2025 | 同上 |
| 08 | commute.html | 715 | 无外部数据（纯叙述） | — | — | 待确认是否有意为之 |
| 09 | blindspot.html | 420 | 无 fetch，硬编码 | 632.7 / TARGET ×4 | — | 基线散落 |
| 10 | report.html | 1250 | **纯硬编码 8 项官方指标** | GDP ×5、工业 ×4、固投 ×3、社消 ×3、外贸 ×3、收入 ×3、高新 ×6 | 2025 | **P1 与 hc-viz/data.js 双写** |
| 11 | future-lab.html | 763 | model.js + 硬编码 | TARGET ×7 | 2025 | 同上 |
| 12 | ending.html | 735 | model.js + 硬编码 | 820 ×6 | — | 结论页依赖硬编码 |
| — | home.html | 299 | 无 | — | — | 入口壳 |
| — | money.html | 60 | 无 | — | — | 空壳，未接入导航 |
| — | role.html | 120 | 无 | — | — | 空壳，未接入导航 |
| — | network.html | 716 | 无 fetch（旧版关系页） | 820 ×1 | — | 已被 holo 取代，未接入导航 |
| — | who.html | 670 | **纯硬编码 2026 上半年** | "上半年" ×9 | 2026 H1 | **P0 结论已反转** |
| — | v1031/index.html | 143 | hot.json + life.json + model.js | 无 | 动态 | 健康 |

导航真源已存在（`ui/ui.js` 的 PAGES 列表，12 页 01–12），这是全站唯一做得对的地方：页面顺序有单一定义，不靠各页各写一遍。

---

## 2. 六套数据源与它们的分叉事实

| 编号 | 数据源 | 谁在写 | 最新期次 | 谁在读 |
|---|---|---|---|---|
| D1 | `data/relationship-*.json` | huicheng-relations（周更） | **2026-11-06**，18 节点/20 边 | holo.html、choices-kg.js |
| D2 | `hot.json` / `life.json` | huicheng-intel（日更） | **2026-11-06 13:10** | fun.html、v1031 |
| D3 | `hc-viz/data.js`（HC_OFFICIAL 八项） | 人工维护 | 2025 全年 | report / future / ending / windtunnel（经 model.js 链路） |
| D4 | `holo-workspace.html` 内嵌副本 | 无人维护 | **2026-10-29** | 页面自己 |
| D5 | `holo.html` FALLBACK（13.8KB） | 无人维护 | **2026-10-29** | 仅 fetch 失败时 |
| D6 | 各页硬编码数字 | 无人维护 | 混杂 2025/2026H1 | report / who / today / ending / blindspot |

**可验证的后果**：本轮 D1 已更新到 11-06（新增环西湖丰渚园节点、三条主干边补放缓反证），但 02 全息工作区读的是 D4，页面上一个字节都没变。这就是"Skill 天天更新、用户看不到"的机制。

---

## 3. 页面级问题清单（按严重度）

### P0-1　holo-workspace 是"影子真源"
3081 行里塞了整份 evidence / changes / sources，`node_id` 出现 72 次。它同时是全站第 2 页（02 全息工作区）。任何关系更新都不会到达这一页。
**这不是数据问题，是结构问题**：一个页面不应该同时是"展示者"和"数据持有者"。

### P0-2　who.html 的结论已被 1-9 月数据推翻
页面建在 2026 上半年口径上，三处关键判断已反转：

| 页面现写（2026 H1） | 官方 1-9 月 | 性质 |
|---|---|---|
| 出口 +15.2%（标"好"） | 出口 **+4.4%**，比 1-8 月回落 10.8pct | 反转 |
| 工业增加值 +0.2% | **+0.8%** | 回升 |
| 第二产业 -4.1% | **-1.6%** | 收窄 |
| 工业用电 +19.7% vs 增加值 +0.2%（"暗火"） | 用电高增仍在，增加值只到 +0.8% | 判断仍需重估 |

页面自己的注脚写着"带 2026 上半年字样的为当期快报，与 2025 全年口径分层"——口径纪律是对的，**缺的是把 1-9 月接上去**。

### P0-3　fun.html 的 fallback 在对用户说话时说错了日期
`"暂未读取到最新数据，正在显示 10/29 示例快照"` 是硬编码字符串。10-29 早已不是"最新"。

### P1-1　report.html 与 hc-viz/data.js 双写同一组 8 项指标
同一份官方数据，一处结构化（data.js），一处手写（report 1250 行内散落 27 次）。改一处必然漏一处。

### P1-2　节点 stat 不带时点
holo.html 里 `hc` 节点写"GDP 1203.33 亿/+4.3%·常住 159.78 万"，没有"2025 全年"。同屏又出现 2026 年前三季度 +1.1%，读者会当成同期对比。

### P2　空壳页与旧页仍占位
`money.html`（60 行）、`role.html`（120 行）、`network.html`（716 行，旧版关系页）都不在 `ui.js` 的 12 页导航里，但仍可被外部链接访问，内容停留在旧口径。

---

## 4. 重构方案：三层契约

### L1 真源层（只有 Skill 能写）

| 真源 | 维护者 | 频次 | 需补的能力 |
|---|---|---|---|
| `hot.json` / `life.json` | huicheng-intel | 每日 | note 里标注数据期次；断更自检（已加） |
| `data/relationship-*.json` | huicheng-relations | 每周 | 无新增也更新 `generated_at`（已加）；`as_of` 字段 |
| **`hc-viz/data.js` 升级为双期官方指标真源** | huicheng-data-audit | 月度/季度 | **新增 2026 期数组**：`HC_OFFICIAL_2026Q3`（GDP/工业/固投/社消/外贸/财政/项目进度），2025 期保留为 `HC_OFFICIAL_2025` |
| `audit/YYYY-MM-DD.md` | huicheng-data-audit | 每日 | 无变化也落一行（已加） |

关键改动：**audit 从"只出信号、不碰页面"升级为"维护唯一指标真源"**。现在它输出信号给人看，人手工抄进 report.html 和 data.js——这条手工链路就是分裂的源头。

### L2 适配层（唯一读取入口，新建 `hc-viz/dataset.js`）

```
window.HCData = {
  meta:    { asOf, auditedAt, period },        // 页面角标数据
  official:{ p2025:[...], p2026:[...] },       // 来自 data.js
  relations:{ evidence, sources, changes },    // fetch data/*.json
  intel:   { hot, life },                      // fetch hot/life
  freshness(threshold)                          // 内置断更判定
}
```

- 一处 fetch、一处缓存、一处降级。降级时**只返回"数据不可用"占位，不返回任何旧数字**（D5 那种 13.8KB 旧副本必须删掉，这是"假装有数据"）。
- `choices-kg.js` 已经证明这个模式可行：`fetch` + `cache:no-store` + 结构校验 + 失败明示，无内嵌兜底。

### L3 页面层（只呈现，不存数）

- 页面不得出现 2025/2026 官方指标字面量；需要数字就读 `HCData.official`。
- 每个 stat、每个指标卡必须带期次徽章（`2025 全年` / `2026 前三季度`）。
- `report.html`、`who.html`、`today.html` 改为渲染 `HCData.official`，把硬编码清零。
- 02 全息工作区删除内嵌副本，改读 `HCData.relations`。

---

## 5. Skill 侧要改什么（对应 L1）

**huicheng-data-audit**
1. 输出从"信号清单"改成"真源补丁"：每条更新写明 `data.js` 里哪个 metric key、旧值、新值、期次。
2. 新增"指标真源同步"一步：核查完直接改 `hc-viz/data.js`（只改数据，不改页面），提交说明写清依据。
3. 报告头固定写 `数据期次` 与 `巡检连续性`（已加）。

**huicheng-intel**
1. `note` 文本里写入期次与覆盖窗口（结构不动，避免破坏 v2 渲染）。
2. 断更自检 + 新鲜度脚本（已加）。

**huicheng-relations**
1. 三件套增加 `as_of`（人类可读的"截至 2026 前三季度"），供 L2 角标直接取。
2. `stat` / `metric` 必须带时点（已加）。

---

## 6. JS 侧要改什么（对应 L2/L3）

| 改动 | 文件 | 风险 | 说明 |
|---|---|---|---|
| 新建统一 loader | `hc-viz/dataset.js`（新） | 低 | 只读、无副作用 |
| 删内嵌副本改读 loader | `holo-workspace.html` | **高**，3081 行 | 必须保证 `file://` 下仍可渲染 |
| 删 FALLBACK 旧数字 | `holo.html` | 中 | 保留"数据不可用"占位 |
| 指标区改渲染 | `report.html` / `who.html` / `today.html` | 中 | 视觉不动，只换数据入口 |
| 全局期次角标 | `ui/ui.js` | 低 | 右下角"数据截至 2026 前三季度·核验 11-06" |
| fallback 文案去日期 | `fun.html` | 低 | 改为"正在显示最近一次已核验快照" |

---

## 7. 执行顺序与验收

**阶段 0（已完成，本轮）**
- 两页过时"800 亿"→"820 亿"（6 处字符串，纯事实纠错）
- D1 更新至 11-06 并上线；巡检轨迹补齐

**阶段 1（已完成，提交 7403e81）**：`hc-viz/dataset.js` + 02 页去内嵌副本
- 新建 `hc-viz/dataset.js`（L2 唯一读取入口）：`relations()` / `relationsObject()` / `intel()` / `asOf()`；按天 `?v=YYYYMMDD` 切版本、`cache:'no-store'`、8s 超时 + AbortController、失败清缓存并抛错，**不返回任何旧数字**；根路径由 `document.currentScript.src` 推导，兼容子目录。
- `holo-workspace.html` 删除 `EVIDENCE_DATA` / `CHANGES_DATA` / `SOURCES_DATA` 三段内嵌常量共 568 行、24377 字节（文件 3081→1885 行），唯一使用点改为 `const payload=await HCData.relations();`（`boot()` 本就是 async，catch 已有"公开数据读取失败"降级）。残留引用计数为 0。
- 双端实测：改造前 17 节点 / 19 边 / 7 变化 / 2026-10-29；改造后 **18 / 20 / 8 / 2026-11-06**，桌面 1440×900 与手机 390×844 一致，console/page error 为空。截图对比无布局塌陷，新增节点"环西湖丰渚园商区综合体"正常并入网络。
- 回归：`verify_all.js`、`check_html_syntax.js`、`choices_kg_runtime_check.js`、`choices_kg_check.js` 全绿。其中两处测试原先把数量写死（`7`、`17/19/17/7`），已改为从 `data/` 实际长度推导——**测试也不许自持数据副本**。
- 线上核验（`holo-workspace.html`）：18 / 20 / 8 / 2026-11-06，与真源一致。
- 遗留（阶段 2 处理）：`holo.html` 的 13.8KB FALLBACK、`fun.html` 的 "10/29 示例快照" 文案仍在，属"失败才出现"的低频兜底。

**阶段 2（待启动）**：report / who / today 接真源，硬编码清零；`holo.html` FALLBACK 删除
**阶段 3（待启动）**：audit Skill 升级为真源维护者，`as_of` 贯通

**验收标准（三条，缺一不算完）**
1. 改一次真源，19 页全部同步可见——不需要改任何 `.html`。
2. 全站搜索 `1203.33`、`937.92`、`-37.1%`、`800亿`，只允许出现在 `hc-viz/data.js` 与 `audit/`，页面内为 0。
3. 每屏出现的每个官方数字，都能在同一屏看到它的期次。

---

## 8. 风险与不做的事

- 不动视觉、不删页面、不合并页面（此前已否决，本方案也不主张）。`money.html` / `role.html` / `network.html` 只标注为"未接入导航的旧页"，不删。
- `holo-workspace.html` 是最大风险点：3081 行、交互密集。改它必须先跑 Playwright 桌面+手机双端截图对比，逐屏确认无回归才能合并。
- `model.js` 的 `BASE=632.7` / `TARGET=1500` 属模型假设，**数据刷新不触碰**，仍走人工审核。
