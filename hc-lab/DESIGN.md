# 惠城决策模拟实验室（内部版）· 冻结设计规格 v1

> 本文件是所有构建代理的共同契约。构建代理必须**先完整 Read 本文件**，再动手；不得偏离本规格的 API 与视觉令牌。
> 蓝本（只读参考，禁止改动）：`/home/user/Doubao/chats/38445304647341314/boluo-simulator/lab-2032/`
> 数据真源（只读，禁止硬编码指标数字）：`/home/user/Doubao/chats/38426950824531714/huicheng-live/hc-viz/data.js`

---

## 0. 一句话定位

为**惠城区**仿制「博罗内部版（决策版）」，做成**惠城决策模拟实验室（内部版）**，交付为惠城风洞站点的**新增页面**。这是给决策者用的内部工具，不是公众演示页。

**三条不可动摇的边界（用户本轮定稿）：**
1. **先不定目标**：不做博罗 1:5:4 式目标结构，不发明 2032 结构假设。页面**只做三件事**——现状推演（按当前动能外推）、压力测试（什么条件下会怎样）、触发信号监测（if-then）。**目标条件留白**，等待用户日后给。
2. **新增页面，不得删除/修改惠城区原有任何页面**（现有 21 页 + briefing/spotlight/poster 全部保留不动）。
3. **数据真源 = data.js**：页面所有指标数字来自 data.js 注入，禁止硬编码指标数字。无数据来源的数字必须标注 C 级估算/合成/Demo。

---

## 1. 交付文件清单（本规格产出的全部新文件）

根目录：`/home/user/Doubao/chats/38426950824531714/huicheng-live/`

| 文件 | 角色 | 由谁产出 |
|---|---|---|
| `decision-lab.html` | 入口页（根目录，唯一 basename，供导航引用） | UI 代理 |
| `hc-lab/studio.css` | 全部样式（唯一 CSS 所有者，杜绝多风格） | UI 代理 |
| `hc-lab/studio.js` | 工作台壳 + 12 工作区渲染 + 接线 | UI 代理 |
| `hc-lab/engine.js` | 计算引擎（现状推演/压力/敏感性/触发信号） | 引擎代理 |
| `hc-lab/core.js` | 数据接入层（读 data.js、证据/核验、导入、影响清单、版本审计、反馈） | 数据层代理 |
| `hc-lab/DESIGN.md` | 本规格 | 已由编排者写好 |

**禁止新建任何其它文件到 hc-lab/ 根之外**（实验产物写入 `artifacts/<exp>-<timestamp>/`，见 §8）。

---

## 2. 视觉语言（冻结设计令牌，唯一 CSS）

沿用惠城风洞深色风洞风格，但更克制、更“决策版”（少花哨、重信息密度与可溯源）。

```css
:root{
  --bg:#070D18;            /* 页底 */
  --bg2:#0A1322;           /* 面板底 */
  --panel:rgba(13,24,41,.72);
  --ink:#E8F1FB;           /* 主文字 */
  --ink2:#A9C0D8;          /* 次文字 */
  --ink3:#6E88A3;          /* 弱文字 */
  --ink4:#465E77;          /* 最弱文字 */
  --line:rgba(150,190,235,.16);
  --line-soft:rgba(150,190,235,.08);
  --cyan:#4FC3FF;          /* 数据/信息强调 */
  --blue:#2E7DEB;          /* 主色/按钮 */
  --amber:#F0B35E;         /* 警告/触发阈值 */
  --red:#FF6B60;           /* 风险/压力/下滑 */
  --green:#54D6A0;         /* 向好/已核验 */
  --violet:#8b5cf6;        /* 仅用于“模型对照”点缀，不做主色 */
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,"Roboto Mono",monospace;
  --font:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
}
```

**证据等级色（独立于核验状态，见 §4）：**
- A 级（官方统计/已定稿）= `--green`
- B 级（公开快报/待复核）= `--cyan`
- C 级（模型假设/合成/Demo）= `--amber`（半透明底）

**核验状态徽标（独立维度，颜色不混用）：**
- 待核验 = 灰 `--ink3`；核验中 = `--blue`；已核验 = `--green`；存在冲突 = `--red`；已被新版本替代 = 灰斜体

**组件约定（studio.css 必须提供）：**
`.hc-lab`（工作台根）、`.hl-masthead`（顶栏）、`.hl-sidebar`（左工作区导航）、`.hl-work`（主区）、`.hl-ws`（工作区 section）、`.hl-card`、`.hl-kpi`、`.hl-badge`（证据徽标）、`.hl-vbadge`（核验徽标）、`.hl-table`、`.hl-svg`（图表容器）、`.hl-trigger`（触发信号卡）、`.hl-feedback`（反馈卡）、`.hl-note`（口径说明）、`.hl-caveat`（边界警示条）、`.hl-pedigree`（参数血统表）。

**响应式**：桌面侧栏 + 主区；`≤ 860px` 侧栏折叠为顶部横向滚动/抽屉，表格横向滚动，移动端可完整使用。

---

## 3. 入口页 `decision-lab.html`（UI 代理产出）

- `<html lang="zh-CN">`，`<meta name="theme-color" content="#070D18">`，title=`惠城决策模拟实验室｜内部版`。
- 加载顺序（必须精确）：
```html
<link rel="stylesheet" href="ui/ui.css">
<link rel="stylesheet" href="ui/ui-pages.css">
<link rel="stylesheet" href="hc-lab/studio.css">
<script src="hc-viz/data.js"></script>          <!-- 真源，挂 window.HC_OFFICIAL 等 -->
<script src="hc-lab/core.js"></script>          <!-- 挂 globalThis.HCLabCore -->
<script src="hc-lab/engine.js"></script>        <!-- 挂 globalThis.HCLabEngine -->
<script src="hc-lab/studio.js" defer></script>  <!-- 挂载与渲染 -->
<script src="ui/ui.js" defer></script>          <!-- 惠城统一顶栏（上一页/下一页/章节） -->
<!-- body 末尾 --><script src="ui/site-nav.js"></script>
```
- HTML 只含静态壳：`<div class="hc-lab">` 内 `<header class="hl-masthead">` + `<div class="hl-body">`（`<aside class="hl-sidebar"><nav id="hlNav"></nav></aside>` + `<main class="hl-work" id="hlWork"></main>`）+ `<footer>`。**工作区 DOM 由 studio.js 动态渲染**，HTML 内不放大量静态工作区，内联 `<script>` 尽量为零（便于 `tests/check_html_syntax.js` 通过）。
- 顶栏（masthead）内容：品牌「惠城决策模拟实验室 / HUI CHENG · DECISION LAB」+ 数据模式徽标（`DEMO/已接入`）+「数据校准中心」快捷入口 + 移动端菜单按钮。
- **本页必须在窗口顶部固定展示一条全局边界警示**：`现状推演与压力测试均为条件推演，不是预测，不替代官方统计；本页不设定任何目标值。`

---

## 4. 证据等级与核验状态（双维度，core.js 实现，全站统一）

- 证据等级（`EVIDENCE`）：`A`（官方统计公报/部门定稿）、`B`（官方快报/公开转录，待复核）、`C`（模型假设/合成/Demo）。
- 核验状态（`VERIFY`，独立维度）：`pending`（待核验）、`verifying`（核验中）、`verified`（已核验）、`conflict`（存在冲突）、`superseded`（已被新版本替代）。
- **两者永不混为一谈**：一个数据点同时拥有 `evidence` 与 `verify` 两个字段。口头纠错/反馈**只能触发核验（verify → verifying/conflict），不能直接升 A 级**。
- data.js 数据的默认标注（core.js 内置，不改 data.js）：
  - `HC_OFFICIAL.metrics` → `evidence:A`（2025 统计公报）+ `verify:verified`（核验 2026-11-13，注：初步核算数）。
  - `HC_CURRENT.metrics` → `evidence:B`（2026 年 1-9 月快报，2026-11-03 发布）+ `verify:verified`（来源已核验，注：快报口径不可与全年直接比较）。
  - 引擎所有噪声/耦合系数 → `evidence:C`（模型假设）+ `verify:pending`。
- 每页每个数字旁必须能看出其 `evidence` + `verify`（至少以徽标 `[A·已核验]` 形式；小字口径说明可折叠）。

---

## 5. 五层数据管理 / 三不可妥协 / 三层验证 / 十条红线

core.js 的「数据校准中心」（workspace `calibrate`）必须显式呈现并实现：

**五层：**
1. Demo 数据底座（真实公开数据与合成数据**分别标记**；本实验默认底座 = data.js 真实数据 + 引擎 C 级假设）。
2. 数据接入层（Excel/CSV/JSON，识别**指标、单位、年份、地区、行业、口径**六要素）。
3. 核验与冲突管理（`verify` 状态机 + 冲突记录）。
4. 模型影响管理（数据改变 → 影响清单）。
5. 版本与审计（新数据建新版本，历史版本可查，审计日志）。

**三不可妥协：**
1. 绝不覆盖原始数据（新数据建新版本）。
2. 不允许跨客户自动共享数据（本地处理、不上传）。
3. 数据改变后必须有**影响清单**（列明受影响指标/模型/情景，不全部重算、不只改一张表）。

**三层验证（分开记录，互不混用）：** 数据验证（口径/单位/范围/来源）、模型验证（参数血统/假设合理性）、结果验证（复现一致性）。Demo 结果漂亮 ≠ 模型有效。

**十条红线（页面「研究边界」须列出）：** ①不要求首次就提供数据；②不把口头纠错自动升 A 级；③不把 Demo 与真实数据混在未标记库；④不因一数据变化改所有模型参数；⑤不跨客户共享；⑥不强制问卷；⑦不因客户认可就宣布模型通过验证；⑧不要求先学专业软件；⑨不把核验任务全转嫁客户；⑩不删除 Demo 基准。

---

## 6. 数据层 `hc-lab/core.js` 冻结 API

IIFE，同时支持浏览器与 Node（`const root = (typeof globalThis!=='undefined')?globalThis:window;`；末尾 `if (typeof module!=='undefined') module.exports = root.HCLabCore;`）。挂 `globalThis.HCLabCore`。

```js
HCLabCore = {
  SEED: 42, N: 20000,                 // 固定种子/次数，与 data.js 一致（仅作 PRNG 种子，非高新区模型）
  EVIDENCE: {A:'A级·官方', B:'B级·快报', C:'C级·模型假设'},
  VERIFY: {pending:'待核验', verifying:'核验中', verified:'已核验', conflict:'存在冲突', superseded:'已被替代'},

  readSource(),          // 读 window.HC_OFFICIAL/HC_CURRENT/HC_ASOF/HC_POP → 归一化 dataset
                         // dataset = { official:[{id,k,v,unit,yoy,sub,detail,note,evidence,verify}],
                         //             current:[{id,k,v,unit,yoy,note,evidence,verify}],
                         //             asof, pop, source }
  indicators(dataset),   // 决策指标统一视图（含每个指标的 evidence/verify/来源/口径）

  // 数据接入（5 层之 2）
  importData(type, rows),// 校验+字段映射+识别六要素 → 返回新版本（绝不改原数据）
  // 影响清单（三不可妥协之 3）
  impactList(changes),   // changes = [{indicatorId, old, new, reason}] → {affectedIndicators, affectedModels, affectedScenarios}
  // 核验与冲突（5 层之 3）
  setVerify(id, status, note), listConflicts(),
  // 版本与审计（5 层之 5）
  versions(), auditLog(),
  // 反馈（校准中心，四选项+可跳过+不强制）
  feedback: { submit(topicId, option, note), list(), export(), clear() },
  // 触发信号规则（用户指定监测规则，非指标数据）
  TRIGGERS,             // 见 §7
  // 常量：口径四情形 + 十条红线 + 三层验证文案（供 UI 展示）
  DIFF_CASES, REDLINES, VALIDATION_LAYERS
};
```

**导入要求**：支持 CSV/XLSX/JSON；中文列名别名映射；识别「指标/单位/年份/地区/行业/口径」；导入后证据 = `B`（待核验），**绝不自动升 A**；新数据建新版本，保留 Demo 基准可恢复。数据仅在浏览器本地处理，不上传。

---

## 7. 计算引擎 `hc-lab/engine.js` 冻结 API

IIFE，双环境（同上），挂 `globalThis.HCLabEngine`。**所有随机过程固定种子，可复现**；所有噪声/耦合系数为 C 级假设，快照如实标注血统。

```js
HCLabEngine = {
  // PRNG：mulberry32(seed) + Box-Muller 正态；quantile（线性插值）
  rng, randn, quantile, clamp, sum, mean, round,

  // ① 现状推演：按当前动能外推（无目标）
  // 对每个指标当前增速 m（来自 dataset，A/B级）：g = m + ε, ε~N(0,σ), σ 为 C 级外推波动
  // 输出 {indicators:[{id,name,m,sigma,p10,p50,p90,mean,pedigree}], seed, N, sigmaNote}
  extrapolate(dataset, opts),

  // ② 压力测试：什么条件下会怎样（if-then 条件 + 耦合）
  // 条件维度：fai(固投)/industry(工业)/projects(项目)/retail(社零)/fiscal(财政)
  // 耦合(全 C 级，见下表)：固投→工业接续、工业→二产/GDP、项目→工业接续、社零→三产韧性
  stress(dataset, conditions),          // conditions = {fai:δpp, industry:δpp, projects:δpp, retail:δpp, fiscal:δpp}
  sensitivity(dataset),                 // 单变量 ±3pp 敏感性排名

  // ③ 触发信号监测（if-then 阈值，阈值来自 core.TRIGGERS）
  evaluateTriggers(dataset),            // 返回三条约法信号 {id,name,rule,current,threshold,status,action,evidence}

  snapshot(dataset),                    // 一次性全量结果快照 JSON（复现用，与页面显示一致）
};
```

**压力耦合系数（全部 C 级模型假设，engine.js 内以常量声明并写入 pedigree）：**
| 条件 | 影响目标 | 方向 |
|---|---|---|
| 固投增速 δ | 工业接续承压（未来投产减少） | 固投越差 → 工业承压越大 |
| 规上工业增速 δ | 二产/GDP 增速 | 工业越弱 → 二产/GDP 越弱 |
| 产业类项目进度 δ | 工业接续缺口 | 进度越低 → 缺口越大 |
| 社零/外贸 δ | 三产韧性 | 消费/外需越弱 → 三产支撑越弱 |
| 区本级财政 δ | 财政空间 | 收入越差 → 空间越小 |

系数一律有界（如 ±3~5pp），**不得声称因果**，说明文字统一为「条件耦合为模型假设(C级)，非因果推断」。

---

## 8. 触发信号（core.js `TRIGGERS`，用户指定监测规则）

三条约法（阈值是**用户指定监测规则**，标注来源「本任务指令」，非指标数据；当前值优先从 data.js 读）：

1. `econ-briefing` 「规上工业运行监测」：规则——若 **1-10 月经济运行简况（预计 11 月下旬发布）**发布时，规上工业增加值增速仍 **< +2%**，建议**逐月调度**。当前值 = data.js `HC_CURRENT` 规上工业 `+0.8%`（1-9 月，B 级）。状态 = 「简况待发布；1-9 月已低于阈值」。
2. `project-industrial` 「重点项目产业类进度监测」：规则——若重点项目月度进度中**产业类进度 < 70%**，建议**挂牌督办**。当前值 = data.js 重点项目产业类 `60.83%`（B 级）。状态 = 已触发。
3. `jinlan-start` 「金澜新材料动工监测」：规则——若**金澜新材料（高新区 115.2 亩、总投资≥10.5 亿）年底前未动工**，建议**重评节奏**。当前值 = 动工状态「待观测」（暂无公开动工信息）。状态 = 待观测（截止期：年底）。

`evaluateTriggers` 返回每条的 `status ∈ {armed, watching, pending}` + `action`（建议动作）+ 当前值来源与证据。

---

## 9. 十二个工作区（studio.js 渲染，全部读 core/engine，禁止硬编码数字）

| id | code | 标题 | 内容要点（三件事 + 五维度） |
|---|---|---|---|
| overview | 00 | 决策总览 | 现状快照（读 data.js）、三件事入口、目标留白声明、证据/核验总览、全局边界 |
| extrapolate | 01 | 现状推演 | `engine.extrapolate`：各指标当前动能外推 P10/P50/P90，动能变化表，明确「外推≠预测」 |
| stress | 02 | 压力测试 | `engine.stress`：五维条件滑杆 + if-then 结果 + `engine.sensitivity` 排名 + 压力雷达 |
| triggers | 03 | 触发信号 | `engine.evaluateTriggers`：三条 if-then 监测卡（规则/当前值/阈值/状态/建议动作） |
| fai | 04 | 固投断崖 | 固投 -40.7%/-46.1%（工业投资）、2025 房地产 -47.3%，断崖传导与 what-if |
| industry | 05 | 工业接续 | 规上工业 +10.8%→+0.8%、工业利润 +49.7%（42.51 亿）、二产 -1.6%，接续缺口 |
| projects | 06 | 重点项目 | 整体 71.27%/产业类 60.83%、138 宗/144.59 亿、金澜新材料，进度漏斗 |
| resilience | 07 | 三产韧性 | 三产近七成、社零 +2.0%、外贸 +11.4%、居民收入，消费与外需支撑 |
| fiscal | 08 | 财政与财力 | 区本级财政 -4.1%、税收 +1.7%，财政空间 |
| calibrate | 09 | 数据校准中心 | 四选项反馈+可跳过+不强制上传、五层管理、证据/核验双维度、影响清单、版本审计 |
| import | 10 | 数据接入 | CSV/XLSX/JSON 导入、字段映射、六要素识别、新版本不覆盖原数据 |
| report | 11 | 研究报告 | 复现快照 JSON、Markdown 导出、参数血统表、数据/模型/结果三层验证记录、外部软件结果导入对照（SPSS/SmartPLS，可选，数值对照不做等价认证） |

**禁止在页面出现**：任何「惠城目标值」（如 2032 目标、增长目标数）、`HC_CURRENT.targets` 的 goal/gap、`HC_OFFICIAL` 的「超目标/低于目标」标签、2032 结构假设。

---

## 10. 参数血统（每页可见，report 页全量列出）

| 参数/数据 | 血统 | 核验 |
|---|---|---|
| 2025 全年指标（HC_OFFICIAL） | A 级（统计公报，初步核算数） | 已核验 2026-11-13 |
| 2026 1-9 月指标（HC_CURRENT） | B 级（官方快报 2026-11-03） | 来源已核验（口径不可与全年比较） |
| 外推噪声 σ | C 级（模型假设） | 待核验 |
| 压力耦合系数 | C 级（模型假设，非因果） | 待核验 |
| 触发阈值（<+2% / <70% / 金澜动工） | 用户指定监测规则（本任务指令） | 规则输入 |
| 随机种子 / 次数 | SEED=42, N=20000 | 可复现 |

---

## 11. 验收与产物包（见编排者分派的「实验/验证」代理）

- `tests/check_html_syntax.js` 现有 7 页检查不得破坏；可新增 `decision-lab.html`（其内联脚本应尽量少）。
- 导航 `ui/site-nav.js` + `ui/ui.js` 两处 PAGES 由**编排者**只增 1 条（不委托、不改删）。新增项：
  `{ url:'decision-lab.html', n:'18', group:'决策实验室', label:'决策模拟实验室', desc:'现状推演 · 压力测试 · 触发信号' }`
- 产物包写入 `artifacts/<exp>-<timestamp>/`：完整 HTML/CSS/JS 源 + `manifest.json`（逐文件真实 sha256）+ 实验说明（数据来源清单/模型设定/参数血统/固定种子/运行结果快照 JSON）+ `snapshot.json` + 复现脚本。禁止 git/commit/push；禁止杜撰数字；不做预测（只做「如果这样走会怎样」）；不批评任何主体。

---

## 12. 构建代理之间的接口约定（防漂移）

- engine.js / core.js 的公开对象名、函数名、返回字段名**必须与 §6/§7 逐字一致**；否则 UI 代理无法接线。
- studio.js 只依赖 `HCLabCore`、`HCLabEngine`、`window.HC_*`（data.js）、以及本规格 §2 的 CSS 类名；不得绕过 core/engine 直接硬编码指标数字。
- 三个代理产出后，由「实验/验证」代理做集成校验；任何字段不匹配将被打回对应代理修复。
