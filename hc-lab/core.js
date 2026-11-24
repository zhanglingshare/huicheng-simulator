/* 惠城决策模拟实验室（内部版）· 数据接入层 core.js
 * 职责：读取 data.js 真源；证据等级 / 核验状态双维度管理；Excel/CSV/JSON 接入；
 *       影响清单；版本审计；数据反馈（四选项）；触发信号规则常量。
 * 边界：本地处理、不上传；新数据建新版本，绝不覆盖原始数据；
 *       反馈/口头纠错只能触发核验（verify），绝不自动升 A 级。
 * 双环境 IIFE：浏览器挂 window.HCLabCore；Node 下 module.exports。
 */
(function () {
  "use strict";

  const root = (typeof globalThis !== "undefined") ? globalThis : window;

  /* ---------- 基础常量（种子/次数与 data.js 一致，仅作 PRNG 种子） ---------- */
  const SEED = (root.SEED != null) ? root.SEED : 42;
  const N = (root.N != null) ? root.N : 20000;

  /* ---------- 证据等级 / 核验状态（两个独立维度，永不混用） ---------- */
  const EVIDENCE = {
    A: "A级·官方",
    B: "B级·快报",
    C: "C级·模型假设"
  };
  const VERIFY = {
    pending: "待核验",
    verifying: "核验中",
    verified: "已核验",
    conflict: "存在冲突",
    superseded: "已被新版本替代"
  };
  const EVIDENCE_KEYS = Object.keys(EVIDENCE);
  const VERIFY_KEYS = Object.keys(VERIFY);

  /* ---------- 反馈四选项（可跳过；不强制填数、不强制上传；本地处理） ---------- */
  const FEEDBACK_OPTIONS = [
    "基本符合实际",
    "与实际有明显差异",
    "统计口径可能不同",
    "暂时无法判断"
  ];
  // 这两类反馈只触发核验流程，不改变证据等级，更不自动升 A 级
  const DISCREPANCY_OPTIONS = ["与实际有明显差异", "统计口径可能不同"];

  /* ---------- 口径差异四情形（口径对齐先于数值替换） ---------- */
  const DIFF_CASES = [
    {
      id: "value_error",
      label: "数值错误",
      desc: "来源、计算或转录环节出现数值差错；先回原始出处核对口径与计算过程，再谈数值替换。",
      first: "核对来源与计算"
    },
    {
      id: "scope",
      label: "统计范围不同",
      desc: "纳入统计的主体/地域/行业范围不一致（如全区与区本级、规上与全口径）。",
      first: "先对齐统计范围"
    },
    {
      id: "definition",
      label: "指标定义不同",
      desc: "指标名称相同但内涵、计算公式或分类标准不同（如增加值与总产值）。",
      first: "先对齐指标定义"
    },
    {
      id: "time",
      label: "时间口径不同",
      desc: "年度终值、当期累计快报、月度数据的时间跨度不同，增速不可直接相加或比较。",
      first: "先对齐时间口径"
    }
  ];
  DIFF_CASES.principle = "口径对齐先于数值替换：范围/定义/时间口径未对齐之前，不做数值替换。";

  /* ---------- 十条红线 ---------- */
  const REDLINES = [
    "不要求首次就提供数据",
    "不把口头纠错自动升 A 级",
    "不把 Demo 与真实数据混在未标记库",
    "不因一数据变化改所有模型参数",
    "不跨客户共享数据",
    "不强制问卷",
    "不因客户认可就宣布模型通过验证",
    "不要求先学专业软件",
    "不把核验任务全转嫁客户",
    "不删除 Demo 基准"
  ];

  /* ---------- 三层验证（分开记录，互不混用） ---------- */
  const VALIDATION_LAYERS = [
    {
      id: "data",
      name: "数据验证",
      items: ["口径核对", "单位核对", "范围核对", "来源核对"],
      note: "确认接入数据的统计口径、计量单位、覆盖范围与出处可靠。"
    },
    {
      id: "model",
      name: "模型验证",
      items: ["参数血统", "假设合理性", "耦合方向有界", "非因果声明"],
      note: "噪声、耦合系数等 C 级假设须可追溯；条件耦合为模型假设，非因果推断。"
    },
    {
      id: "result",
      name: "结果验证",
      items: ["复现一致性", "快照可回溯", "分层标注"],
      note: "固定种子可复现；Demo 结果漂亮 ≠ 模型有效。"
    }
  ];

  /* ---------- 内部状态（本地闭包，不上传） ---------- */
  let sourceDataset = null;          // readSource() 归一化后的真源数据集（深拷贝返回）
  let importedRecords = [];          // 历次导入记录（新版本追加，不覆盖真源）
  let verifyStore = {};              // id → {status, note, updatedAt, updatedBy}
  let versionList = [];              // 版本记录
  let auditEntries = [];             // 审计日志
  let feedbackEntries = [];          // 反馈记录
  let versionSeq = 0;

  function now() { return new Date().toISOString(); }
  function clone(x) { return JSON.parse(JSON.stringify(x == null ? null : x)); }
  function normalizeAlias(txt) {
    return String(txt == null ? "" : txt).replace(/[\s（）()_\-·:：]/g, "").toLowerCase();
  }
  function parsePct(str) {
    if (str == null) return null;
    const m = String(str).match(/[-+]?[\d.]+/);
    return m ? Number(m[0]) : null;
  }
  function audit(action, detail, extra) {
    auditEntries.push(Object.assign({ ts: now(), action, detail: detail || "" }, extra || {}));
  }

  /* ---------- 触发信号规则常量（阈值 = 用户指定监测规则，来源「本任务指令」） ----------
   * 当前值尽量从 data.js 读取；规则参数（<+2% / <70% / 115.2 亩 / ≥10.5 亿）
   * 属用户指定监测规则，不视为指标数据。
   */
  function readCurrentMetric(id) {
    const cur = root.HC_CURRENT;
    if (!cur || !Array.isArray(cur.metrics)) return null;
    return cur.metrics.find(m => m.id === id) || null;
  }
  function buildTriggers() {
    const indVa = readCurrentMetric("ind_va");
    const proj = readCurrentMetric("proj");

    // 触发 1：规上工业运行监测
    const indVaYoy = indVa ? indVa.yoy : null;
    const indVaNum = parsePct(indVaYoy);
    const t1 = {
      id: "econ-briefing",
      name: "规上工业运行监测",
      rule: "若 1-10 月经济运行简况（预计 11 月下旬发布）发布时，规上工业增加值增速仍 < +2%，建议逐月调度。",
      current: {
        value: indVaYoy,
        numeric: indVaNum,
        unit: "%",
        period: indVa && root.HC_CURRENT ? root.HC_CURRENT.period : null,
        source: indVa ? indVa.note : null,
        evidence: "B",
        verify: "verified"
      },
      threshold: { metric: "规上工业增加值增速", op: "<", value: 2, unit: "%", source: "本任务指令" },
      status: "watching",
      statusLabel: "简况待发布；1-9 月已低于阈值",
      action: "逐月调度",
      evidence: "B",
      thresholdSource: "本任务指令",
      caliber: "1-9 月为当期累计快报，与全年口径不可直接比较；触发判断以 1-10 月简况发布时口径为准。"
    };

    // 触发 2：重点项目产业类进度监测
    let industrialNum = null;
    if (proj && proj.note) {
      const mm = proj.note.match(/产业类[^\d]*([\d.]+)%/);
      if (mm) industrialNum = Number(mm[1]);
    }
    const t2 = {
      id: "project-industrial",
      name: "重点项目产业类进度监测",
      rule: "若重点项目月度进度中产业类进度 < 70%，建议挂牌督办。",
      current: {
        value: industrialNum != null ? industrialNum + "%" : null,
        numeric: industrialNum,
        unit: "%",
        overall: proj ? proj.yoy : null,
        period: proj && root.HC_CURRENT ? root.HC_CURRENT.period : null,
        source: proj ? proj.note : null,
        evidence: "B",
        verify: "verified"
      },
      threshold: { metric: "产业类项目进度", op: "<", value: 70, unit: "%", source: "本任务指令" },
      status: "armed",
      statusLabel: "已触发",
      action: "挂牌督办",
      evidence: "B",
      thresholdSource: "本任务指令",
      caliber: "进度为当期累计完成比例；产业类口径见项目台账备注。"
    };

    // 触发 3：金澜新材料动工监测
    const t3 = {
      id: "jinlan-start",
      name: "金澜新材料动工监测",
      rule: "若金澜新材料（高新区 115.2 亩、总投资 ≥10.5 亿）年底前未动工，建议重评节奏。",
      current: {
        value: "待观测",
        numeric: null,
        note: "暂无公开动工信息",
        evidence: "C",
        verify: "pending"
      },
      threshold: {
        event: "年底前动工",
        params: { land: "115.2 亩", investment: "≥10.5 亿", area: "高新区" },
        deadline: "2026-12-31",
        source: "本任务指令"
      },
      status: "pending",
      statusLabel: "待观测（截止期：年底）",
      action: "重评节奏",
      evidence: "C",
      thresholdSource: "本任务指令",
      caliber: "动工状态暂无公开信息；面积与投资额为监测规则参数，来源为本任务指令。"
    };

    return [t1, t2, t3];
  }
  const TRIGGERS = buildTriggers();

  /* ================= 数据真源读取 ================= */

  /**
   * readSource() —— 读 root.HC_OFFICIAL / HC_CURRENT / HC_ASOF / HC_POP，归一化 dataset。
   * 禁止硬编码指标数字；一切数值从 HC_* 读取。
   * dataset = { official:[{id,k,v,unit,yoy,sub,detail,note,evidence,verify,...}],
   *             current:[{id,k,v,unit,yoy,note,evidence,verify,...}],
   *             asof, pop, source }
   */
  function readSource() {
    const off = root.HC_OFFICIAL;
    const cur = root.HC_CURRENT;
    if (!off || !Array.isArray(off.metrics)) throw Error("data.js 未加载：缺少 HC_OFFICIAL.metrics");
    if (!cur || !Array.isArray(cur.metrics)) throw Error("data.js 未加载：缺少 HC_CURRENT.metrics");

    // 2025 全年（统计公报，初步核算数）：evidence A + verify verified
    const official = off.metrics.map(m => ({
      id: m.id,
      k: m.k,
      v: m.v,
      unit: m.unit,
      yoy: null,
      sub: m.sub || null,
      detail: m.detail || null,
      note: m.note || null,
      evidence: "A",
      verify: "verified",
      verifyNote: "初步核算数；核验 2026-11-13",
      source: off.source || root.HC_SOURCE || null,
      period: off.period || null,
      year: off.year || null
    }));

    // 2026 1-9 月快报：evidence B + verify verified（快报口径不可与全年比较）
    const current = cur.metrics.map(m => ({
      id: m.id,
      k: m.k,
      v: m.v != null ? m.v : null,
      unit: m.unit || null,
      yoy: m.yoy || null,
      note: m.note || null,
      evidence: "B",
      verify: "verified",
      verifyNote: "快报口径不可与全年直接比较；来源已核验（2026-11-03 发布）",
      source: cur.source || null,
      period: cur.period || null,
      released_at: cur.released_at || null
    }));

    sourceDataset = {
      official,
      current,
      asof: root.HC_ASOF || null,
      pop: root.HC_POP || null,
      source: {
        shared: root.HC_SOURCE || null,
        official: off.source || null,
        current: cur.source || null
      }
    };

    // 建立基线版本（Demo/真源基准，可恢复，不被导入覆盖）
    if (versionList.length === 0) {
      versionSeq += 1;
      versionList.push({
        version: versionSeq,
        kind: "baseline",
        at: now(),
        type: "source",
        records: { official: official.length, current: current.length },
        evidence: "A/B",
        verify: "verified",
        note: "data.js 真实数据底座：2025 全年 A 级（初步核算数）+ 2026 1-9 月 B 级快报；引擎 C 级假设另列。"
      });
      audit("source.load", "读取 data.js 真源，建立基线版本 v" + versionSeq, {
        counts: { official: official.length, current: current.length }
      });
    }

    return clone(sourceDataset);
  }

  /**
   * indicators(dataset) —— 决策指标统一视图；每个指标携带 evidence/verify/来源/口径。
   * 未传 dataset 时内部读取真源。
   */
  function indicators(dataset) {
    const ds = dataset || readSource();
    const offMap = new Map((ds.official || []).map(x => [x.id, x]));
    const curMap = new Map((ds.current || []).map(x => [x.id, x]));
    const ids = Array.from(new Set([...offMap.keys(), ...curMap.keys()]));
    return ids.map(id => {
      const o = offMap.get(id) || null;
      const c = curMap.get(id) || null;
      const base = o || c;
      const v = verifyStore[id];
      // 统一视图的双维度标注：优先保留年度 A 级标注；当期快报单独嵌套，不互相覆盖。
      // verifyStore 仅覆盖核验状态，证据等级（evidence）不被反馈/纠错改动。
      return {
        id,
        name: base.k,
        official: o,
        current: c,
        evidence: o ? o.evidence : c.evidence,
        verify: v ? v.status : (o ? o.verify : c.verify),
        verifyNote: v ? (v.note || base.verifyNote) : (base.verifyNote || null),
        source: base.source || null,
        caliber: base.note || null
      };
    });
  }

  /* ================= 数据接入（CSV / XLSX / JSON） ================= */

  // 六要素 + 数值/同比/备注 的中文列名别名映射
  const ALIASES = {
    k: ["指标", "指标名称", "指标名", "名称", "项目", "指标项", "指标类别", "k"],
    unit: ["单位", "计量单位", "口径单位", "unit"],
    year: ["年份", "年度", "统计年度", "年", "时期", "year"],
    region: ["地区", "区域", "所在地区", "镇街", "街道", "区县", "region"],
    industry: ["行业", "产业", "行业门类", "细分行业", "industry"],
    caliber: ["口径", "统计口径", "口径说明", "统计范围", "definition"],
    v: ["数值", "值", "本期值", "当期值", "总量", "金额", "规模", "v"],
    yoy: ["同比", "增速", "同比增速", "增长率", "增长", "yoy"],
    note: ["备注", "说明", "注释", "note"]
  };
  const ELEMENT_KEYS = ["k", "unit", "year", "region", "industry", "caliber"];

  function suggestMapping(cols) {
    return Object.fromEntries(Object.keys(ALIASES).map(key => {
      const variants = [key, ...(ALIASES[key] || [])].map(normalizeAlias);
      return [key, cols.find(col => variants.includes(normalizeAlias(col))) || ""];
    }));
  }

  function parseCSV(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    text = String(text == null ? "" : text).replace(/^\uFEFF/, "");
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\r" || ch === "\n") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); cell = "";
        if (row.some(v => String(v).trim())) rows.push(row);
        row = [];
      } else cell += ch;
    }
    if (quoted) throw Error("CSV 引号不闭合");
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    if (rows.length < 2 || rows.length > 20001) throw Error("CSV 必须包含 1—20000 条记录（含表头）");
    const cols = rows.shift().map(x => String(x).trim());
    if (new Set(cols).size !== cols.length) throw Error("字段名称有重复");
    return rows.map((cells, i) => {
      if (cells.length !== cols.length) throw Error("第 " + (i + 2) + " 行列数不一致");
      return Object.fromEntries(cols.map((name, j) => [name, String(cells[j] == null ? "" : cells[j]).trim()]));
    });
  }

  // XLSX 解析（浏览器本地；Node 无 DOMParser/DecompressionStream 时给出降级提示）
  function parseXlsx(arrayBuffer) {
    if (typeof DOMParser === "undefined") {
      throw Error("当前环境不支持本地解析 XLSX，请先另存为 CSV 或 JSON 后导入");
    }
    const bytes = new Uint8Array(arrayBuffer);
    const dv = new DataView(arrayBuffer);
    const text = new TextDecoder("utf-8");
    let eocd = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw Error("Excel ZIP 文件缺少目录");
    const count = dv.getUint16(eocd + 10, true);
    const start = dv.getUint32(eocd + 16, true);
    if (count > 200) throw Error("Excel 文件结构过大");
    const out = {};
    let p = start;
    for (let idx = 0; idx < count; idx++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw Error("Excel 文件目录损坏");
      const method = dv.getUint16(p + 10, true);
      const comp = dv.getUint32(p + 20, true);
      const rawlen = dv.getUint32(p + 24, true);
      const nlen = dv.getUint16(p + 28, true);
      const elen = dv.getUint16(p + 30, true);
      const clen = dv.getUint32(p + 32, true);
      const local = dv.getUint32(p + 42, true);
      const name = text.decode(bytes.slice(p + 46, p + 46 + nlen));
      if ((name === "xl/sharedStrings.xml" || name === "xl/worksheets/sheet1.xml") && rawlen < 12000000) {
        if (dv.getUint32(local, true) !== 0x04034b50) throw Error("Excel 数据段异常");
        const offset = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
        const packed = bytes.slice(offset, offset + comp);
        let result;
        if (method === 0) result = packed;
        else if (method === 8) {
          if (typeof DecompressionStream === "undefined") throw Error("当前浏览器暂不支持本地 Excel 解压，请先转为 CSV");
          throw Error("XLSX 压缩流需浏览器环境解压，请先另存为 CSV");
        } else throw Error("无法处理 Excel 压缩方式");
        out[name] = text.decode(result);
      }
      p += 46 + nlen + elen + clen;
    }
    if (!out["xl/worksheets/sheet1.xml"]) throw Error("只支持 Excel 第一工作表；请另存为 CSV");
    const xml = new DOMParser();
    const parse = s => {
      const d = xml.parseFromString(s, "application/xml");
      if (d.querySelector("parsererror")) throw Error("Excel XML 解析失败");
      return d;
    };
    let shared = [];
    if (out["xl/sharedStrings.xml"]) {
      const doc = parse(out["xl/sharedStrings.xml"]);
      shared = Array.from(doc.getElementsByTagName("si")).map(item =>
        Array.from(item.getElementsByTagName("t")).map(n => n.textContent).join(""));
    }
    const sheet = parse(out["xl/worksheets/sheet1.xml"]);
    const rows = [];
    for (const rowEl of sheet.getElementsByTagName("row")) {
      const obj = {};
      for (const cell of rowEl.getElementsByTagName("c")) {
        const ref = cell.getAttribute("r") || "";
        const col = ref.match(/^[A-Z]+/);
        if (!col) continue;
        let index = 0;
        for (const ch of col[0]) index = index * 26 + ch.charCodeAt(0) - 64;
        index--;
        const kind = cell.getAttribute("t");
        const v = cell.getElementsByTagName("v")[0]?.textContent ?? cell.getElementsByTagName("t")[0]?.textContent ?? "";
        obj[index] = kind === "s" ? shared[Number(v)] ?? "" : v;
      }
      if (Object.keys(obj).length) rows.push(obj);
    }
    if (rows.length < 2 || rows.length > 20001) throw Error("Excel 必须包含 1—20000 条记录");
    const header = rows.shift();
    const head = Object.keys(header).map(Number).sort((a, b) => a - b);
    return rows.map(r => Object.fromEntries(head.map(i => [String(header[i]), r[i] ?? ""])));
  }

  function parseInput(type, rows) {
    const t = String(type || "").toLowerCase();
    if (t === "json") {
      let data = rows;
      if (typeof rows === "string") {
        try { data = JSON.parse(rows); } catch (e) { throw Error("JSON 解析失败：" + e.message); }
      }
      if (data && !Array.isArray(data) && Array.isArray(data.rows)) data = data.rows;
      if (!Array.isArray(data)) throw Error("JSON 需要是数据行数组（或含 rows 数组的对象）");
      return data;
    }
    if (t === "csv") return parseCSV(rows);
    if (t === "xlsx") return parseXlsx(rows);
    throw Error("目前支持 CSV、XLSX、JSON 三类接入");
  }

  /**
   * importData(type, rows) —— 校验 + 字段映射 + 识别六要素 → 返回新版本。
   * 新数据建新版本，绝不覆盖原数据；导入后 evidence = B + verify = pending（不自动升 A）。
   * @param type 'csv'|'xlsx'|'json'
   * @param rows CSV 文本 / XLSX ArrayBuffer / JSON 数组或 JSON 字符串
   */
  function importData(type, rows) {
    const raw = parseInput(type, rows);
    if (!Array.isArray(raw) || raw.length < 1) throw Error("导入数据不能为空");
    if (raw.length > 20000) throw Error("数据行数必须是 1—20000");

    const cols = Object.keys(raw[0]);
    const mapping = suggestMapping(cols);
    const mappedCols = Object.values(mapping).filter(Boolean);
    if (!mapping.k) throw Error("缺少「指标」列（别名：指标/指标名称/名称/项目）");

    const warnings = [];
    const records = raw.map((rawRow, i) => {
      const entry = {};
      for (const key of Object.keys(mapping)) {
        const src = mapping[key];
        if (!src) continue;
        let val = rawRow[src];
        if (val == null || val === "") continue;
        entry[key] = typeof val === "string" ? val.trim().slice(0, 240) : val;
      }
      if (!entry.k) warnings.push("第 " + (i + 1) + " 行缺少指标名称，已跳过");
      return entry;
    }).filter(e => e.k);

    if (!records.length) throw Error("没有可导入的有效记录（至少需要一行含指标名称）");

    const stamp = now();
    const versionId = ++versionSeq;
    const stamped = records.map((r, i) => ({
      id: "imp_" + versionId + "_" + String(i + 1).padStart(3, "0"),
      k: r.k,
      unit: r.unit || null,
      year: r.year || null,
      region: r.region || null,
      industry: r.industry || null,
      caliber: r.caliber || null,
      v: r.v != null ? r.v : null,
      yoy: r.yoy || null,
      note: r.note || null,
      evidence: "B",            // 导入数据 = 公开转录/待复核，B 级；绝不自动升 A
      verify: "pending",        // 待核验
      source: "本地导入（未上传）",
      importedAt: stamp,
      version: versionId
    }));

    importedRecords = importedRecords.concat(stamped);

    versionList.push({
      version: versionId,
      kind: "import",
      at: stamp,
      type: String(type || "").toLowerCase(),
      mapping,
      records: stamped.length,
      evidence: "B",
      verify: "pending",
      note: "本地导入数据，待来源/口径/单位复核；未覆盖基线真源。",
      warnings
    });

    audit("data.import", "导入 " + stamped.length + " 条记录（版本 v" + versionId + "，evidence B / verify pending）", {
      type: String(type || "").toLowerCase(),
      count: stamped.length,
      warnings
    });

    return {
      version: versionId,
      kind: "import",
      type: String(type || "").toLowerCase(),
      mapping,
      fields: ELEMENT_KEYS.concat(["v", "yoy", "note"]),
      records: stamped,
      warnings,
      evidence: "B",
      verify: "pending"
    };
  }

  /* ================= 核验与冲突管理 ================= */

  /**
   * setVerify(id, status, note) —— 只改核验状态（verify），不改证据等级（evidence）。
   * 反馈/口头纠错只能走到 verifying/conflict，不能借此升 A 级。
   */
  function setVerify(id, status, note) {
    if (!id) throw Error("缺少指标 id");
    if (!VERIFY_KEYS.includes(status)) throw Error("未知核验状态：" + status);
    verifyStore[id] = { status, note: note || null, updatedAt: now(), updatedBy: "local" };
    audit("verify.set", "核验状态更新：" + id + " → " + VERIFY[status], {
      id, status, note: note || null
    });
    return { id, status, verify: VERIFY[status], note: note || null, updatedAt: verifyStore[id].updatedAt };
  }

  /** listConflicts() —— 返回 verify = conflict 的数据点（真源 + 导入 + 反馈标记） */
  function listConflicts() {
    const ds = sourceDataset || readSource();
    const out = [];
    const push = (rec, origin) => {
      const v = verifyStore[rec.id];
      const status = v ? v.status : rec.verify;
      if (status === "conflict") {
        out.push({
          id: rec.id,
          name: rec.k,
          origin,
          status,
          note: v ? v.note : rec.note,
          evidence: rec.evidence,
          updatedAt: v ? v.updatedAt : null
        });
      }
    };
    (ds.official || []).forEach(r => push(r, "official"));
    (ds.current || []).forEach(r => push(r, "current"));
    importedRecords.forEach(r => push(r, "import"));
    return out;
  }

  /* ================= 版本与审计 ================= */

  /** versions() —— 历史版本可查；基线版本保留可恢复 */
  function versions() { return clone(versionList); }

  /** auditLog() —— 审计日志（source.load / data.import / verify.set / feedback.* 等） */
  function auditLog() { return clone(auditEntries); }

  /* ================= 影响清单 ================= */

  // 指标关联网络：受影响指标 / 模型 / 情景（条件耦合为模型假设，非因果推断）
  const RELATIONS = {
    gdp:        { related: ["gdp2", "ind_va", "retail", "trade", "rev"], models: ["extrapolate", "stress"], scenarios: ["base"] },
    gdp2:       { related: ["ind_va", "gdp"], models: ["extrapolate", "stress"], scenarios: ["base"] },
    ind_va:     { related: ["ind_profit", "gdp2", "gdp", "fai"], models: ["extrapolate", "stress", "triggers"], scenarios: ["base"] },
    ind_profit: { related: ["ind_va"], models: ["extrapolate"], scenarios: ["base"] },
    trade:      { related: ["retail"], models: ["extrapolate", "stress"], scenarios: ["base", "commute"] },
    income:     { related: ["retail"], models: ["extrapolate"], scenarios: ["commute"] },
    retail:     { related: ["gdp", "trade"], models: ["extrapolate", "stress"], scenarios: ["base"] },
    rev:        { related: ["gdp"], models: ["extrapolate", "stress"], scenarios: ["base"] },
    fai:        { related: ["ind_va", "gdp2"], models: ["extrapolate", "stress"], scenarios: ["delay"] },
    proj:       { related: ["ind_va"], models: ["stress", "triggers"], scenarios: ["delay", "both"] }
  };
  const MODEL_REGISTRY = {
    extrapolate: "现状推演（按当前动能外推）",
    stress: "压力测试（if-then 条件耦合）",
    sensitivity: "单变量敏感性排名",
    triggers: "触发信号监测"
  };
  const SCENARIO_REGISTRY = (root.SCENES && typeof root.SCENES === "object")
    ? Object.fromEntries(Object.entries(root.SCENES).map(([k, v]) => [k, v.name || k]))
    : { base: "基准情景", delay: "项目延期", commute: "通勤压力", both: "两者叠加" };

  /**
   * impactList(changes) —— 数据改变后返回影响清单。
   * changes = [{indicatorId, old, new, reason}]
   * → { changed, affectedIndicators, affectedModels, affectedScenarios, summary }
   * 不全部重算、不只改一张表；列明受影响指标/模型/情景。
   */
  function impactList(changes) {
    const list = Array.isArray(changes) ? changes : [];
    const indicatorMap = new Map();
    const modelSet = new Map();
    const scenarioSet = new Map();

    const addIndicator = (id, level, via) => {
      if (!indicatorMap.has(id)) indicatorMap.set(id, { id, level, via: via || null });
      else if (level === "related" && indicatorMap.get(id).level === "related") {
        indicatorMap.get(id).via = via || indicatorMap.get(id).via;
      }
    };
    const addModel = (id, reason) => { if (!modelSet.has(id)) modelSet.set(id, reason); };
    const addScenario = (key, reason) => { if (!scenarioSet.has(key)) scenarioSet.set(key, reason); };

    list.forEach(ch => {
      const id = ch.indicatorId;
      if (!id) return;
      addIndicator(id, "direct", ch.reason || "数据直接改变");
      const rel = RELATIONS[id];
      if (rel) {
        (rel.related || []).forEach(rid => addIndicator(rid, "related", "与 " + id + " 条件关联"));
        (rel.models || []).forEach(m => addModel(m, id + " 变化传导至 " + MODEL_REGISTRY[m]));
        (rel.scenarios || []).forEach(s => addScenario(s, id + " 变化影响情景 " + (SCENARIO_REGISTRY[s] || s)));
      } else {
        // 未登记指标：保守纳入现状推演与基准情景，避免静默漏算
        addModel("extrapolate", id + " 变化需复核现状推演");
        addScenario("base", id + " 变化影响基准情景");
      }
    });

    const affectedIndicators = Array.from(indicatorMap.values()).map(x => {
      const ds = sourceDataset;
      const name = ds
        ? (ds.official.find(o => o.id === x.id) || ds.current.find(c => c.id === x.id) || {}).k
        : x.id;
      return { id: x.id, name: name || x.id, level: x.level, via: x.via };
    });
    const affectedModels = Array.from(modelSet.entries()).map(([id, reason]) => ({
      id, name: MODEL_REGISTRY[id] || id, reason
    }));
    const affectedScenarios = Array.from(scenarioSet.entries()).map(([key, reason]) => ({
      key, name: SCENARIO_REGISTRY[key] || key, reason
    }));

    return {
      changed: list.map(c => ({ indicatorId: c.indicatorId, old: c.old, new: c.new, reason: c.reason || null })),
      affectedIndicators,
      affectedModels,
      affectedScenarios,
      summary: {
        indicators: affectedIndicators.length,
        models: affectedModels.length,
        scenarios: affectedScenarios.length
      },
      note: "条件耦合为模型假设(C级)，非因果推断；影响清单不触发全量重算。"
    };
  }

  /* ================= 反馈（四选项，可跳过，本地处理不上传） ================= */

  function submitFeedback(topicId, option, note) {
    if (option != null && option !== "" && !FEEDBACK_OPTIONS.includes(option)) {
      throw Error("反馈选项必须是：" + FEEDBACK_OPTIONS.join(" / ") + "，或留空跳过");
    }
    const entry = {
      id: "fb_" + String(feedbackEntries.length + 1).padStart(4, "0"),
      ts: now(),
      topicId: topicId || null,
      option: option || null,          // null = 跳过选项
      note: note || null,
      uploaded: false                  // 本地处理，不上传
    };
    feedbackEntries.push(entry);

    // 差异类反馈：仅触发核验流程（verify → verifying），证据等级保持不变，绝不升 A
    if (entry.topicId && option && DISCREPANCY_OPTIONS.includes(option)) {
      const cur = verifyStore[entry.topicId];
      if (!cur || cur.status !== "conflict") {
        setVerify(entry.topicId, "verifying", "反馈：" + option + (note ? "；" + note : ""));
      }
      audit("feedback.verify", "反馈触发核验：" + entry.topicId + "（" + option + "），证据等级未变", {
        topicId: entry.topicId, option: entry.option
      });
    } else {
      audit("feedback.submit", "反馈提交：" + (entry.topicId || "未关联指标") + "（" + (entry.option || "跳过") + "）", {
        topicId: entry.topicId, option: entry.option
      });
    }
    return entry;
  }

  function listFeedback() { return clone(feedbackEntries); }

  function exportFeedback() {
    return JSON.stringify({
      exportedAt: now(),
      note: "本地处理，未上传；反馈仅触发核验流程，不改变证据等级。",
      options: FEEDBACK_OPTIONS,
      entries: feedbackEntries
    }, null, 2);
  }

  function clearFeedback() {
    feedbackEntries = [];
    audit("feedback.clear", "本地反馈记录已清空");
    return { cleared: true, at: now() };
  }

  /* ================= 对外冻结 API ================= */
  root.HCLabCore = {
    SEED,
    N,
    EVIDENCE,
    VERIFY,
    FEEDBACK_OPTIONS,
    readSource,
    indicators,
    importData,
    impactList,
    setVerify,
    listConflicts,
    versions,
    auditLog,
    feedback: {
      submit: submitFeedback,
      list: listFeedback,
      export: exportFeedback,
      clear: clearFeedback
    },
    TRIGGERS,
    DIFF_CASES,
    REDLINES,
    VALIDATION_LAYERS
  };

  if (typeof module !== "undefined") module.exports = root.HCLabCore;
})();
