# 惠城区资产交接清单：Skills 与 JS

**交接对象**：火山引擎（接管"数据供给 Skills"与"逻辑 JS + 页面"两类功能）
**交接方**：豆包 / 原维护者
**生效**：2026-11-06 当日晚间起
**仓库**：`github.com/zhanglingshare/huicheng-simulator`（branch `main`），线上 `https://zhanglingshare.github.io/huicheng-simulator/`
**当前 HEAD**：`6eff498`（关系底座 19 节点 / 21 边 / 23 来源 / 9 变化，generated_at 2026-11-06 17:20）

---

## 0. 一句话说明这套东西的形状

惠城站不是一个"页面 + 一个数据库"的常规站，而是**四个数据真源 + 一个读取层 + 十九个页面**的结构：

```
Skills（三类采集/核查任务）        真源文件                      读取路径              页面
─────────────────────────  →  ──────────────────  →  ──────────────────  →  ──────────
huicheng-intel               hot.json / life.json      ┐
huicheng-data-audit          hc-viz/data.js            ├→ hc-viz/dataset.js（3 页走这条）
huicheng-relations           data/relationship-*.json  ┘   页面直接 <script src="hc-viz/data.js">（13 页走这条）
                                                                  ↓
                                                            model.js（概率引擎，5 页共用）
```

**核心纪律**：页面永远不内嵌指标数字，只读真源；真源只由对应 Skill 写；读不到就报错，不返回旧数兜底。

---

## 1. 三个 Skill（数据供给侧）

三个 Skill 都在 `/home/user/.doubao/agent_mode/workspace/.user_skills/` 下，**不在仓库内**（这是已知技术债，见 §5.7）。

### 1.1 huicheng-intel —— 话题流与生活脉搏

| 项 | 内容 |
|---|---|
| 目录 | `.user_skills/huicheng-intel/` |
| 职责 | 每日采集惠城政务/媒体/抖音/小红书/点评公开信息，估算关注档与去处人气 |
| 产出 | 仓库根 `hot.json`（10 条话题）、`life.json`（14 个去处 + 3 条 pulse） |
| 触发 | 每日 07:27（定时任务「情报每日刷新」） |
| 执行脚本 | `scripts/validate_json.py`（结构校验）、`scripts/check_staleness.py`（断更自检，**同时覆盖 hot/life 与关系三件套**） |
| 参考文档 | `references/schema.md`（v2 字段规范）、`references/estimation.md`（热度折算规则）、`references/sources.md`（采集源优先级 + 地域边界） |
| 硬红线 | 只改这两个 json；`spots` 固定 14 不增删、`pulse` 固定 3 条、`hot` 40–100；无真实事件不调人气（±3 内），不许为了"看起来更新"改数字；不写平台后台阅读/点赞数 |
| 坑 | `stats` 是数组不是对象；`life.json` 无 `region` 字段；`fate` 无 `shocks` 字段；枚举 `srcLevel` 是 `媒体报道` 不是"权威媒体" |

### 1.2 huicheng-data-audit —— 指标真源

| 项 | 内容 |
|---|---|
| 目录 | `.user_skills/huicheng-data-audit/` |
| 职责 | 每日核查惠城核心经济指标、重点项目、政策变化，并把核查结果**写进真源** |
| 产出 | `hc-viz/data.js`（`HC_OFFICIAL` 2025 全年 / `HC_CURRENT` 当期 / `HC_ASOF` / `HC_POP`）+ `audit/YYYY-MM-DD.md` 报告 |
| 触发 | 每日 09:00（定时任务「数据每日核查」） |
| 执行脚本 | `scripts/validate_data.js`（结构 + 枚举 + 期次先后）、`scripts/compare_baseline.py`（双基线对照） |
| 参考文档 | `references/sources.md`（官方入口：区统计局 / 发改局 / 重点办 / 自然资源局 / 高新区） |
| 硬红线 | **`hc-viz/data.js` 的唯一维护者**；只改值不改结构；`status` 按"与目标的差距"判而不是按正负号（GDP +1.1% 属 `b`）；每期必改 `HC_ASOF.checked`，只写报告不写真源视为没完成 |
| 坑 | `validate_data.js` 的 `checked` 允许 `YYYY-MM-DD HH:MM`（`DATETIME_RE`），`official`/`current` 仍只能纯日期（它们是期次边界不是快照时刻） |

### 1.3 huicheng-relations —— 关系证据底座

| 项 | 内容 |
|---|---|
| 目录 | `.user_skills/huicheng-relations/` |
| 职责 | 采集六类关系公开证据（产业企业 / 投资建设 / 人口交通 / 消费文旅 / 生态约束 / 区域协作），按 A/B/C 分级建节点与边 |
| 产出 | `data/relationship-evidence-v1.json`（节点+边）、`-sources-v1.json`（来源登记）、`-changes-v1.json`（变化事件） |
| 触发 | 每日 17:10（定时任务「关系底座周更」，实际按日增量跑） |
| 执行脚本 | `scripts/validate_relations.py`（悬空引用 / 重复 / 字段 / 枚举 / 自洽） |
| 参考文档 | `references/schema.md`（逐字段规范）、`references/estimation.md`、`references/sources.md` |
| 硬红线 | 只改这三个 json；`last_verified_at` 只给**真正复核过**的边，未复核保留原值（不得批量改成今天冒充已核）；`change_type` 枚举只有 `new_entity/new_edge/strengthen/weaken/exit/break/alternative`，**没有"无变化"**，不许为留痕造条目；签约≠投产、车辆≠人数、过境≠通勤、同镇≠供应链、游客人次≠消费额 |
| 坑 | 校验脚本在技能目录不在仓库；节点 `change_status` 与边 `change_status` 同枚举但语义不同（节点说主体状态，边说关系状态） |

### 1.4 三者共同约束

- **地域边界**：只覆盖惠城区 + 惠州市区主城区。排除仲恺、大亚湾、博罗、龙门、惠阳 —— 除非"全市级且直接作用于惠城"（跨东江通道、融深融湾等）。
- **证据分级**：A 官方文件/统计直接证实（带 URL）→ 实线+数字；B 多源推断（只给区间）→ 虚线；C 签约/在建/规划 → 点线+"待验证"。
- **时间戳口径**（用户强制统一过，务必延续）：
  - `hot.json` / `life.json` 的 `updated` = `fetched_at` = **本次采集完成时刻**
  - `data.js` 的 `HC_ASOF.checked` = **本次核验完成时刻**，精确到分，是**全站唯一快照时刻**（`ui/ui.js` 的期次条、`holo.html` 的悬停提示都直接读它）
  - 关系三件套的 `generated_at` = **本次核验完成时刻**
  - 三个任务分别在 07:27 / 09:00 / 17:10 跑，**文件层面不必同分钟，也不许为对齐而回写** —— 把 17:20 的真实核验写成 14:20 属于伪造核验时刻。

---

## 2. JS 资产（逻辑与页面侧）

### 2.1 分层总表

| 层 | 文件 | 行数 | 职责 | 被谁用 | 谁可写 |
|---|---|---|---|---|---|
| **L1 真源** | `hc-viz/data.js` | 85 | `HC_OFFICIAL`(2025 全年 8 指标) / `HC_CURRENT`(2026 1-9 月 8 指标 + 5 目标) / `HC_ASOF` / `HC_POP`；IIFE 挂 `window` | **13 页直接引用**：blindspot / choices / commute / ending / fun / future / future-lab / holo / holo-workspace / index / report / today / windtunnel | 仅 huicheng-data-audit |
| **L2 读取层** | `hc-viz/dataset.js` | 86 | 全站唯一数据读取入口：`HCData.relations()` / `HCData.intel()` / `HCData.asOf()`；按天 `?v=YYYYMMDD` 缓存，跨天自动取新；**读不到就明确报错，不返回旧数字兜底** | 3 页：fun / holo / holo-workspace | 火山可改（读取逻辑改造归你们） |
| **L3 模型内核** | `model.js` | 99 | `HT.BASE` 632.7（2025 高新区规上工业产值实测）/ `HT.TARGET` 1500（外延参考刻度，非官方目标）/ `DEFAULT_PATHS` 五条路径 μ·σ / `SEED` 42 / `N` 20000 / 蒙特卡洛 + 分位数插值 | 5 页：ending / future / future-lab / report / windtunnel | **人工审核门**：只有出现官方新实测锚点才可改 `BASE`，且 commit 必须写依据 |
| **L3.5 绘图片段** | `hc-viz/charts.js` | 20 | `canvasCtx` / `strokeLine` / `label` / `drawTrajectory` / `drawDists` / `binsFor` 等 canvas 绘图函数 | **无任何页面引用（孤儿）** | 建议核对后归档或删除 |
| **L4 页面渲染** | `hc-viz/report.js` | 23 | report 页 KPI 卡 / 情景卡 / 详情交互渲染 | **无引用（孤儿，逻辑已内联进 report.html）** | 同上 |
| **L4 页面渲染** | `hc-viz/ending.js` | 14 | ending 页情景对比 / 分享卡 Canvas 生成 | **无引用（孤儿，已内联进 ending.html）** | 同上 |
| **L4 页面渲染** | `choices-kg.js` | 411 | 第⑤页 V4 逐层知识图谱，只读既有公开证据数据（`PATHS` 五条路径 + `PEOPLE`） | choices.html | 火山 |
| **L4 导航** | `ui/ui.js` | 223 | 全站顶栏 + 章节目录 + 上一页/下一页 + 页面标识（`PAGES` 表 18 页）；**不读模型数据** | 12 页 | 火山 |
| **L4 导航（旧）** | `hc-journey-nav.js` + `.css` | 59 | 旧版章节导航，另一套 `pages` 表 | **无引用（已被 `ui/ui.js` 取代，孤儿）** | 建议删除 |
| **L5 第三方** | `echarts.min.js` | 45（压缩） | ECharts 本地化副本 | 部分页 | 火山 |
| **L6 测试** | `tests/` 9 个脚本 | 共 578 | 见 §4 | CI / 人工 | 火山 |

### 2.2 页面体量

18 个 HTML：`index` `holo-workspace` `today` `fun` `choices` `future` `future-lab` `windtunnel` `commute` `blindspot` `report` `ending` `holo` `who` `money` `role` `network` `home`。

其中 **4 页尚未接入导航、也未接真源**：`money.html` `role.html` `network.html` `home.html` —— 属存量包袱，不在一级导航里。

---

## 3. 数据契约（写→读矩阵，接管后最重要的一张表）

| 真源 | 唯一写者 | 消费者 | 刷新节奏 | 校验 |
|---|---|---|---|---|
| `hot.json` | huicheng-intel | `ending` `fun`（经 dataset.js / 直读） | 每日 07:27 | `validate_json.py` |
| `life.json` | huicheng-intel | `fun` | 每日 07:27 | `validate_json.py` |
| `hc-viz/data.js` | huicheng-data-audit | 13 页 | 每日 09:00 | `validate_data.js` |
| `data/relationship-*.json` | huicheng-relations | `fun` `holo` `holo-workspace` | 每日 17:10 | `validate_relations.py` |
| `model.js` | 人工审核 | 5 页 | 仅官方新锚点 | `tests/release_params.js` |

**不可跨越的两条**：

1. **一个文件只能有一个写者**。火山接管页面后，`hc-viz/data.js`、`hot.json`、`life.json`、`data/relationship-*.json` 仍由对应 Skill 写；页面侧只读。若页面需要新字段，走"先改 schema → 同步改校验器 → 同步改 SKILL.md → 再改页面"的顺序，不能先改页面等数据。
2. **改字段名 / 枚举 = 断站**。`hot.json` 的 `spots`（`n`/`c`/`tag`/`d`/`why`/`watch`/`hot`/`level`）、关系三件套的 `relation_type` 七枚举、`change_status` 七枚举，页面是硬编码读取的，改一个页面就读不到。

---

## 4. 验收命令（接管后每次改动都要跑）

```bash
node tests/data_health.js .                    # 三类数据时效 + 14 处页面自持数字 + 消费者矩阵，过期退出码 1
node tests/check_html_syntax.js                # 扫 18 页 HTML 语法
node tests/verify_all.js                       # 全站回归
python3 .user_skills/huicheng-relations/scripts/validate_relations.py .
node .user_skills/huicheng-data-audit/scripts/validate_data.js .
python3 .user_skills/huicheng-intel/scripts/validate_json.py .
```

`tests/data_health.js` 是本轮新建的自检门，它同时做三件事：三类数据超期判定（hot/life >1 天 fail、关系 >8 天 fail、`HC_ASOF.checked` >1 天 fail）、`life` 结构（pulse 3 / spots 14）、以及**页面受控数字扫描**（`CONTROLLED` 九串：1203.33 / 937.92 / 805.68 / 383.6 / 159.78 / -37.1% / 10.8% / +4.3% / 800亿），白名单四页 `today` `who` `blindspot` `windtunnel`。

---

## 5. 已知技术债（交接必须带走，不要当新问题查）

1. **14 处页面自持数字未动态化**：`who` 6 处、`today` 5 处、`blindspot` 2 处、`windtunnel` 1 处。这些数字直接写在 HTML 里，改真源不会自动跟随。已登记白名单，属重构线任务。
2. **4 页未接导航未接真源**：`money` `role` `network` `home`。
3. **`report.html` 结论函数写死文案**：第 1090 行 `conclBody` 里的 "BASE 632.7 亿 / TARGET 1500 亿" 是字符串，数值来自 `_SIM` 但文案硬编码；改参数不会跟着改字。
4. **两套导航并存**：`ui/ui.js`（在用，12 页）与 `hc-journey-nav.js`（0 引用）。
5. **四个孤儿脚本**：`hc-viz/charts.js`、`hc-viz/report.js`、`hc-viz/ending.js`、`hc-journey-nav.js`(+css)。它们的逻辑已内联进对应 HTML，**不要拿它们当改造依据**，否则改完不生效。
6. **`hc-viz/data.js` 混装两类东西**：指标真源（`HC_*`）与场景模型编排（`SCENES` / `runScene` / `getScene` / `stateLabels`，内部调 `HT.run`）。真源与模型同文件，职责边界未拆，改真源时容易误碰模型。
7. **校验脚本在技能目录不在仓库**：CI 拉不到，只能本机跑。若要进 CI，需把三个脚本复制进 `tests/`（注意保留技能侧同步）。
8. **Pages 部署延迟 30–100 秒**：首轮核验常拿到旧值，必须重试；`ui/ui.css`、`model.js` 有 CDN 缓存且偶发 503（重试即 200），`?t=` 只对 HTML 有效，json 用 `?t=` 或等缓存过期。
9. **两个每日定时任务 11-02 至 11-06 连续 5 天未触发**（09:00 与 07:27 两条），`last_run` 停在 11-01，但状态显示"运行中/上次成功"、`next_trigger` 正常。原因未定位（调度侧还是配置侧未知），期间数据全靠会话手动补。**接管方接手后第一件要查的就是这个**。

---

## 6. 接管边界与协作规则

### 6.1 建议的责任矩阵

| 范围 | 接管后归属 | 说明 |
|---|---|---|
| `.html` / `.css` / `ui/ui.js` / `hc-viz/dataset.js` / `choices-kg.js` | 火山引擎 | 逻辑 JS、交互、视觉、响应式 |
| `hot.json` / `life.json` | huicheng-intel（Skills 侧） | 火山只读 |
| `hc-viz/data.js` 的 `HC_*` 四段 | huicheng-data-audit | 火山只读；`SCENES/runScene` 段属模型侧，改需与模型审核门一起 |
| `data/relationship-*.json` | huicheng-relations | 火山只读 |
| `model.js` | 人工审核门 | 双方都不可单方面改参数 |

### 6.2 冲突处理

- 同一 commit 不要同时含"真源 json"与"页面 html"。Skill 侧提交只带自己那几件文件，页面改动单独提交 —— 现有纪律是 `git status` 只允许出现本 Skill 负责的文件。
- 页面显示旧数字，先查三件事再动手：① 真源是否真更新了（对比 `generated_at` / `updated` / `checked`）；② CDN 缓存（加 `?t=`）；③ 那串数字是不是页面自持（对照 §5.1 的 14 处清单）。
- 数据看起来"没更新"但真源时间是新的，八成命中 §5.1 或 §5.3。

### 6.3 今晚接管后的第一步（建议顺序）

1. 先跑一遍 §4 全部命令，确认基线全绿（当前状态应该是：hot 14:20 / life 14:20 / 关系 17:20 · 19 节点 21 边 / data.js checked 14:20）。
2. 打开 `https://zhanglingshare.github.io/huicheng-simulator/holo-workspace.html`，确认三件套渲染出的数字是 19/21，而不是缓存里的 18/20。
3. 查 §5.9 的定时任务未触发问题（这是当前唯一"数据会静默停更"的结构性风险）。
4. 再动 §5.1 的 14 处自持数字 —— 这件事做完，"改真源页面会跟着变"才算真的成立。

---

## 7. 一张速查卡

```
改话题/去处        → huicheng-intel      → hot.json, life.json
改经济指标数值      → huicheng-data-audit → hc-viz/data.js (HC_OFFICIAL/HC_CURRENT/HC_ASOF)
改关系/节点/边      → huicheng-relations  → data/relationship-*-v1.json
改模型参数          → 人工审核门          → model.js (BASE/TARGET/PATHS)
改读取逻辑/缓存     → 火山               → hc-viz/dataset.js
改页面/交互/视觉    → 火山               → *.html, ui/ui.js, choices-kg.js
改导航条目          → 火山               → ui/ui.js 的 PAGES 表（18 页）
跑自检             → node tests/data_health.js .
```

**一句话红线**：真源只由对应 Skill 写，页面只读不内嵌，读不到就报错不兜底；时间戳写"本次核验/采集完成时刻"，不为对齐回写。
