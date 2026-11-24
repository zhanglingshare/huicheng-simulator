/* 惠城决策模拟实验室（内部版）· 计算引擎（蒙特卡洛内核）
 * ---------------------------------------------------------------------------
 * 只负责三类条件推演：①现状推演（按当前动能外推）②压力测试（if-then 条件 + 耦合）
 * ③触发信号监测（if-then 阈值）。本引擎不设定任何目标值，不做预测，不替代官方统计，
 * 不批评任何主体。所有外推噪声 σ、压力耦合系数均为 C 级模型假设，非因果推断。
 *
 * 双环境：浏览器挂 globalThis.HCLabEngine；Node 经 module.exports 导出。
 * 数据真源：优先 HCLabCore.readSource()，否则读 root.HC_OFFICIAL / HC_CURRENT /
 * HC_ASOF / HC_POP；指标数字一律运行时读取，本文件不硬编码任何指标值。
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  const root = (typeof globalThis !== 'undefined') ? globalThis : window;

  // ---------- 固定设定（可复现：同一输入两次运行结果完全一致） ----------
  const SEED = 42;
  const N = 20000;
  const DEFAULT_SIGMA = 1.5;   // C 级：外推波动 σ（百分点）
  const STRESS_BOUND = 8;      // 条件扰动 δpp 有界 [-8, +8]
  const SENS_DELTA = 3;        // 敏感性单变量 ±3pp
  const TARGET_BOUND = 5;      // 每个受影响目标的耦合调整量有界 ±5pp

  /* 压力耦合系数（全部 C 级模型假设，非因果推断）。
   * 方向（DESIGN.md §7 表）：
   *  固投 → 工业接续；工业 → 二产/GDP；项目 → 工业接续；社零 → 三产韧性；财政 → 财政空间。
   */
  const COUPLING = {
    fai:      { label: '固定资产投资',   targets: { ind_continuity: 0.35 } },
    industry: { label: '规上工业增加值', targets: { secondary: 0.80, gdp: 0.40 } },
    projects: { label: '产业类项目进度', targets: { ind_continuity: 0.30 } },
    retail:   { label: '社会消费品零售', targets: { tertiary_resilience: 0.35 } },
    fiscal:   { label: '区本级财政收入', targets: { fiscal_space: 0.60 } }
  };

  // 受影响目标 → 代理基线指标（从 dataset 取当前增速）
  const TARGET_META = {
    ind_continuity:     { name: '工业接续（未来投产）', proxy: 'ind_va' },
    secondary:          { name: '第二产业增速',         proxy: 'gdp2' },
    gdp:                { name: 'GDP 增速',            proxy: 'gdp' },
    tertiary_resilience:{ name: '三产韧性',             proxy: 'retail' },
    fiscal_space:       { name: '财政空间',             proxy: 'rev' }
  };

  /* 决策指标统一视图：优先 HC_CURRENT（B 级快报），缺失时回退 HC_OFFICIAL（A 级公报）。
   * 进度类指标（proj）不参与增速外推，仅在触发信号中读取。
   */
  const INDICATOR_REGISTRY = [
    { id: 'gdp',        name: 'GDP 增速',               currentKey: 'gdp' },
    { id: 'gdp2',       name: '第二产业增速',           currentKey: 'gdp2' },
    { id: 'ind_va',     name: '规上工业增加值增速',    currentKey: 'ind_va' },
    { id: 'fai',        name: '固定资产投资增速',      currentKey: 'fai' },
    { id: 'retail',     name: '社会消费品零售增速',    currentKey: 'retail' },
    { id: 'trade',      name: '外贸进出口增速',        currentKey: 'trade' },
    { id: 'rev',        name: '区本级财政收入增速',    currentKey: 'rev' },
    { id: 'ind_profit', name: '规上工业利润增速',      currentKey: null, officialKey: 'ind_profit' },
    { id: 'income',     name: '居民人均可支配收入增速', currentKey: null, officialKey: 'income' }
  ];

  // ---------- 基础工具（公开） ----------

  // mulberry32 PRNG：返回一个 () => [0,1) 的确定性生成器
  function rng(seed) {
    let a = (Number(seed) >>> 0) || 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Box-Muller 标准正态；传入 rng 生成器以保证可复现
  function randn(gen) {
    let u = 0, v = 0;
    while (u === 0) u = gen();
    while (v === 0) v = gen();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // 分位数（线性插值）
  function quantile(values, q) {
    const s = values.slice().sort((a, b) => a - b);
    if (!s.length) return null;
    const i = (s.length - 1) * q;
    const lo = Math.floor(i), hi = Math.ceil(i);
    return s[lo] * (1 - (i - lo)) + s[hi] * (i - lo);
  }

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }

  function sum(arr) { return arr.reduce((acc, b) => acc + (+b || 0), 0); }

  function mean(arr) { return arr.length ? sum(arr) / arr.length : null; }

  function round(x, digits) {
    if (x == null || !Number.isFinite(x)) return x;
    const p = Math.pow(10, digits == null ? 2 : digits);
    return Math.round(x * p) / p;
  }

  // ---------- 数据接入（只读，不修改真源） ----------

  function parsePct(str) {
    if (str == null) return null;
    const m = String(str).replace(/,/g, '').match(/-?[0-9]+(?:\.[0-9]+)?/);
    return m ? Number(m[0]) : null;
  }

  function findRow(rows, id) {
    return rows.find(r => String(r.id) === id) || null;
  }

  function normalizeDataset(ds) {
    if (ds && Array.isArray(ds.official) && Array.isArray(ds.current)) return ds;
    let official = [], current = [];
    let asof = root.HC_ASOF || null, pop = root.HC_POP || null, source = null;

    // 若 core.js 已就绪，优先走其 readSource() 归一化结果
    if (root.HCLabCore && typeof root.HCLabCore.readSource === 'function') {
      try {
        const d = root.HCLabCore.readSource();
        if (d) {
          official = d.official || [];
          current = d.current || [];
          asof = d.asof || asof; pop = d.pop || pop; source = d.source;
        }
      } catch (e) { /* 回退到直接读 HC_* */ }
    }
    if (!official.length && root.HC_OFFICIAL && Array.isArray(root.HC_OFFICIAL.metrics)) {
      official = root.HC_OFFICIAL.metrics.map(x => ({ ...x, evidence: 'A', verify: 'verified' }));
    }
    if (!current.length && root.HC_CURRENT && Array.isArray(root.HC_CURRENT.metrics)) {
      current = root.HC_CURRENT.metrics.map(x => ({ ...x, evidence: 'B', verify: 'verified' }));
    }
    return { official, current, asof, pop, source };
  }

  // 取某指标当前增速 m：current.yoy 优先，official.v 兜底；返回血统
  function growthOf(reg, id) {
    const c = findRow(reg.current, id);
    if (c && c.yoy != null) {
      return {
        m: parsePct(c.yoy), evidence: c.evidence || 'B', verify: c.verify,
        source: 'HC_CURRENT（' + (root.HC_CURRENT && root.HC_CURRENT.period || '当期快报') + '）',
        raw: c.yoy
      };
    }
    const o = findRow(reg.official, id);
    if (o && o.v != null) {
      return {
        m: parsePct(o.v), evidence: o.evidence || 'A', verify: o.verify,
        source: 'HC_OFFICIAL（2025 全年公报）', raw: o.v
      };
    }
    return null;
  }

  // ---------- ① 现状推演：按当前动能外推（无目标） ----------

  function extrapolate(dataset, opts) {
    opts = opts || {};
    const reg = normalizeDataset(dataset);
    const seed = Number.isInteger(opts.seed) ? opts.seed : SEED;
    const trials = Number.isInteger(opts.N) ? opts.N : N;
    const sigma = Number.isFinite(opts.sigma) ? opts.sigma : DEFAULT_SIGMA;
    const gen = rng(seed);

    const indicators = INDICATOR_REGISTRY.map(item => {
      const g = growthOf(reg, item.id);
      const m = g ? g.m : null;

      if (m == null || !Number.isFinite(m)) {
        return {
          id: item.id, name: item.name, m: null, sigma,
          p10: null, p50: null, p90: null, mean: null,
          pedigree: {
            dataEvidence: '缺数', basis: '无当前增速，未参与外推',
            noise: { sigma, unit: '百分点', evidence: 'C级·模型假设', verify: 'pending' }
          }
        };
      }

      const draws = new Array(trials);
      for (let i = 0; i < trials; i++) draws[i] = m + sigma * randn(gen);

      return {
        id: item.id, name: item.name,
        m: round(m), sigma,
        p10: round(quantile(draws, 0.1)),
        p50: round(quantile(draws, 0.5)),
        p90: round(quantile(draws, 0.9)),
        mean: round(mean(draws)),
        pedigree: {
          dataEvidence: g.evidence, dataSource: g.source, verify: g.verify,
          basis: '按当前动能描述性外推：g = m + ε，ε ~ N(0, σ)',
          noise: { sigma, unit: '百分点', evidence: 'C级·模型假设', verify: 'pending' },
          caveat: '条件推演，非预测；不替代官方统计；快报口径不可与全年直接比较。'
        }
      };
    });

    return {
      indicators, seed, N: trials,
      sigmaNote: 'σ = ' + sigma + ' 个百分点为 C 级外推波动（模型假设，待核验）；外推仅为条件情景，不是预测。'
    };
  }

  // ---------- ② 压力测试：if-then 条件 + 耦合（全 C 级） ----------

  function stress(dataset, conditions) {
    conditions = conditions || {};
    const reg = normalizeDataset(dataset);
    const seed = SEED, trials = N, sigma = DEFAULT_SIGMA;

    const cond = {};
    for (const key of Object.keys(COUPLING)) {
      const raw = Number(conditions[key] || 0);
      cond[key] = Number.isFinite(raw) ? clamp(raw, -STRESS_BOUND, STRESS_BOUND) : 0;
    }

    const targets = Object.entries(TARGET_META).map(([tid, meta], idx) => {
      const base = growthOf(reg, meta.proxy);
      const baseline = base ? base.m : null;

      const coupling = [];
      let adj = 0;
      for (const [ckey, cmeta] of Object.entries(COUPLING)) {
        const coef = cmeta.targets[tid];
        if (!coef) continue;
        const coupled = coef * cond[ckey];
        adj += coupled;
        coupling.push({
          condition: ckey, label: cmeta.label, coefficient: coef,
          conditionDelta: round(cond[ckey]), coupledDelta: round(coupled, 3),
          evidence: 'C级·模型假设'
        });
      }
      adj = clamp(adj, -TARGET_BOUND, TARGET_BOUND);

      let interval = null, median = null;
      if (baseline != null && Number.isFinite(baseline)) {
        const gen = rng(seed + idx + 1);
        const draws = new Array(trials);
        for (let i = 0; i < trials; i++) draws[i] = baseline + adj + sigma * randn(gen);
        median = round(quantile(draws, 0.5));
        interval = {
          p10: round(quantile(draws, 0.1)), p50: median, p90: round(quantile(draws, 0.9)),
          low: round(quantile(draws, 0.1)), high: round(quantile(draws, 0.9))
        };
      }

      let signal = 'calm';
      if (baseline != null && median != null) {
        const drop = median - baseline;
        if (drop <= -1) signal = 'pressure';
        else if (drop <= -0.3) signal = 'watch';
      }

      return {
        id: tid, name: meta.name,
        baseline: baseline != null ? round(baseline) : null,
        adjustedDelta: round(adj, 3),
        interval, signal, coupling,
        pedigree: {
          dataEvidence: base ? base.evidence : '缺数',
          couplingEvidence: 'C级·模型假设，非因果推断',
          bound: '目标调整量有界 ±' + TARGET_BOUND + 'pp',
          caveat: '条件耦合为模型假设(C级)，非因果推断；什么条件下会怎样的 if-then 情景，不是预测。'
        }
      };
    });

    return {
      conditions: cond,
      conditionBound: [-STRESS_BOUND, STRESS_BOUND],
      coefficients: Object.fromEntries(
        Object.entries(COUPLING).map(([k, v]) => [k, { label: v.label, targets: v.targets, evidence: 'C级·模型假设' }])
      ),
      targets, seed, N: trials,
      note: '条件耦合为模型假设(C级)，非因果推断；压力测试仅为 if-then 条件情景，不构成政策效果评价。'
    };
  }

  // ---------- ②b 敏感性：单变量 ±3pp 扰动，按影响幅度排名 ----------

  function sensitivity(dataset) {
    const rows = Object.entries(COUPLING).map(([ckey, cmeta]) => {
      const aggregate = dir => {
        let total = 0;
        for (const coef of Object.values(cmeta.targets)) total += coef * dir * SENS_DELTA;
        return round(total, 3);
      };
      const low = aggregate(-1), high = aggregate(1);
      return {
        condition: ckey, label: cmeta.label,
        down: -SENS_DELTA, low, up: SENS_DELTA, high,
        range: round(high - low, 3),
        evidence: 'C级·模型假设'
      };
    });
    rows.sort((a, b) => Math.abs(b.range) - Math.abs(a.range));
    rows.forEach((r, i) => { r.rank = i + 1; });

    return {
      sensDelta: SENS_DELTA, unit: 'pp', ranked: rows,
      note: '单变量 ±3pp 扰动下的模型内影响幅度排名；耦合为 C 级模型假设，非因果推断。'
    };
  }

  // ---------- ③ 触发信号监测（if-then；阈值为用户指定监测规则） ----------

  function evaluateTriggers(dataset) {
    const reg = normalizeDataset(dataset);

    const indVa = findRow(reg.current, 'ind_va');
    const proj = findRow(reg.current, 'proj');
    const indVaVal = indVa ? parsePct(indVa.yoy) : null;

    let projIndustrial = null;
    if (proj && proj.note) {
      const m = proj.note.match(/产业类仅\s*([0-9.]+)%/);
      if (m) projIndustrial = Number(m[1]);
    }
    const projOverall = proj ? parsePct(proj.yoy) : null;

    const rules = [
      {
        id: 'econ-briefing',
        name: '规上工业运行监测',
        rule: '若 1-10 月经济运行简况（预计 11 月下旬发布）发布时，规上工业增加值增速仍 < +2%，建议逐月调度。',
        current: {
          value: indVaVal, unit: '%',
          label: indVaVal != null ? String(indVa.yoy) + '（1-9 月）' : '待发布',
          source: indVa ? indVa.note : '',
          evidence: 'B级·快报（2026 年 1-9 月，2026-11-03 发布）'
        },
        threshold: { operator: '<', value: 2.0, unit: '%', source: '本任务指令（用户指定监测规则）' },
        status: 'watching',
        statusNote: '简况待发布；1-9 月已低于阈值，持续观察。',
        action: '逐月调度（待 1-10 月简况发布后复核）',
        evidence: '当前值来自 HC_CURRENT 规上工业快报（B级）；规则阈值来自本任务指令；1-10 月简况待发布。'
      },
      {
        id: 'project-industrial',
        name: '重点项目产业类进度监测',
        rule: '若重点项目月度进度中产业类进度 < 70%，建议挂牌督办。',
        current: {
          value: projIndustrial, unit: '%',
          label: projIndustrial != null
            ? projIndustrial + '%（整体 ' + (projOverall != null ? projOverall + '%' : '—') + '）'
            : '待更新',
          source: proj ? proj.note : '',
          evidence: 'B级·快报'
        },
        threshold: { operator: '<', value: 70, unit: '%', source: '本任务指令（用户指定监测规则）' },
        status: projIndustrial != null && projIndustrial < 70 ? 'armed' : 'watching',
        statusNote: projIndustrial != null && projIndustrial < 70 ? '产业类进度已低于阈值，已触发。' : '待更新月度进度。',
        action: '挂牌督办',
        evidence: '产业类进度从 HC_CURRENT 重点项目备注中解析（B级快报）；阈值来自本任务指令。'
      },
      {
        id: 'jinlan-start',
        name: '金澜新材料动工监测',
        rule: '若金澜新材料（高新区 115.2 亩、总投资≥10.5 亿）年底前未动工，建议重评节奏。',
        current: {
          value: null, unit: '—',
          label: '待观测（暂无公开动工信息）',
          source: 'data.js 无公开动工字段',
          evidence: 'C级·待观测'
        },
        threshold: { operator: '年底前动工', value: null, unit: '—', source: '本任务指令（用户指定监测规则）' },
        status: 'pending',
        statusNote: '截止期：年底；到期未动工再触发重评。',
        action: '重评节奏（截止期：年底；到期未动工再触发）',
        evidence: '当前无公开动工信息，状态待观测；项目规模口径来自本任务指令规则描述。'
      }
    ];

    return {
      rules,
      statusLegend: {
        armed: '已触发：当前值越过阈值',
        watching: '临界/待复核：持续观察',
        pending: '待观测：数据或截止期未到'
      },
      note: '阈值为用户指定监测规则（本任务指令），非指标数据；当前值从 data.js 读取，未硬编码。'
    };
  }

  // ---------- 全量快照（复现用，与页面显示一致；不含时间戳） ----------

  function snapshot(dataset) {
    const reg = normalizeDataset(dataset);
    const ext = extrapolate(reg);
    const str = stress(reg);
    const sens = sensitivity(reg);
    const trig = evaluateTriggers(reg);

    return {
      meta: {
        engine: 'HCLabEngine',
        seed: SEED, N,
        boundary: '现状推演与压力测试均为条件推演，不是预测，不替代官方统计；本页不设定任何目标值。',
        asof: reg.asof || null
      },
      extrapolate: ext,
      stress: str,
      sensitivity: sens,
      triggers: trig,
      pedigree: [
        { param: '2025 全年指标（HC_OFFICIAL）', level: 'A级（统计公报，初步核算数）', verify: '已核验 2026-11-13' },
        { param: '2026 1-9 月指标（HC_CURRENT）', level: 'B级（官方快报 2026-11-03）', verify: '来源已核验（口径不可与全年比较）' },
        { param: '外推噪声 σ', level: 'C级（模型假设）', verify: '待核验' },
        { param: '压力耦合系数', level: 'C级（模型假设，非因果）', verify: '待核验' },
        { param: '触发阈值（<+2% / <70% / 金澜动工）', level: '用户指定监测规则（本任务指令）', verify: '规则输入' },
        { param: '随机种子 / 次数', level: 'SEED=42, N=20000', verify: '可复现' }
      ],
      reproduction: {
        seed: SEED, N,
        note: '同一输入两次运行结果必须完全一致；本快照不含时间戳，便于逐字节复现比对。'
      }
    };
  }

  // ---------- 导出（§7 公开 API，名称逐字一致） ----------

  root.HCLabEngine = {
    rng, randn, quantile, clamp, sum, mean, round,
    extrapolate, stress, sensitivity, evaluateTriggers, snapshot,
    // 常量与血统（供 UI / 报告页引用）
    SEED, N, DEFAULT_SIGMA, STRESS_BOUND, SENS_DELTA, TARGET_BOUND, COUPLING
  };

  if (typeof module !== 'undefined') module.exports = root.HCLabEngine;
})();
