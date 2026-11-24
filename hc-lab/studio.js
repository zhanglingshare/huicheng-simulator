/* =========================================================================
   惠城决策模拟实验室（内部版）· studio.js
   工作台壳 + 12 工作区渲染 + 接线。
   只依赖 HCLabCore / HCLabEngine / data.js 注入的 HC_*；指标数字一律运行时读取，
   本文件不硬编码指标值，不设定任何目标值，不做预测。
   ========================================================================= */
(function () {
  'use strict';

  const CORE = window.HCLabCore;
  const ENGINE = window.HCLabEngine;
  if (!CORE || !ENGINE) throw new Error('HCLabCore / HCLabEngine 未加载，请检查 core.js、engine.js 引入顺序');

  const DS = CORE.readSource();

  /* ---------------- 基础工具 ---------------- */
  const $ = s => document.querySelector(s);
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  function fmt(x, d) {
    if (x == null || !Number.isFinite(x)) return '—';
    return ENGINE.round(x, d == null ? 2 : d);
  }
  function signed(x) {
    if (x == null || !Number.isFinite(x)) return '—';
    return (x > 0 ? '+' : '') + ENGINE.round(x, 2);
  }
  function evLetter(ev) {
    if (!ev) return null;
    const m = String(ev).match(/^([ABC])/);
    return m ? m[1] : null;
  }

  /* ---------------- 真源索引（只读） ---------------- */
  const offMap = new Map((DS.official || []).map(r => [r.id, r]));
  const curMap = new Map((DS.current || []).map(r => [r.id, r]));
  const off = id => offMap.get(id) || null;
  const cur = id => curMap.get(id) || null;
  const IND = CORE.indicators(DS);
  const indMap = new Map(IND.map(x => [x.id, x]));
  const offPeriod = (DS.official && DS.official[0] && DS.official[0].period) || '年度口径';

  /* ---------------- 双维度徽标（证据 / 核验，不混用） ---------------- */
  function evBadge(ev) {
    const l = evLetter(ev);
    if (!l) return '<span class="hl-badge hl-ev-na">—</span>';
    return '<span class="hl-badge hl-ev-' + l + '" title="' + esc(CORE.EVIDENCE[l] || '') + '">' + l + '</span>';
  }
  function vBadge(v) {
    const k = v && CORE.VERIFY[v] ? v : 'pending';
    return '<span class="hl-vbadge hl-vb-' + k + '">' + esc(CORE.VERIFY[k]) + '</span>';
  }
  function badges(rec) {
    if (!rec) return evBadge(null) + vBadge('pending');
    return evBadge(rec.evidence) + vBadge(rec.verify);
  }
  function verifyFromEvidence(ev) {
    const l = evLetter(ev);
    return (l === 'A' || l === 'B') ? 'verified' : 'pending';
  }

  /* ---------------- 全局状态 ---------------- */
  const state = {
    active: 'overview',
    conditions: { fai: 0, industry: 0, projects: 0, retail: 0, fiscal: 0 },
    whatIf: { fai: 0, industry: 0, projects: 0, retail: 0, fiscal: 0 },
    lastImport: null,
    snap: null,
    modeLabel: 'DEMO 底座'
  };

  const COND_META = ENGINE.COUPLING;
  const SIG_LABEL = { calm: '平稳', watch: '观察', pressure: '承压' };

  /* =========================================================================
     工作区 00 · 决策总览
     ========================================================================= */
  function renderOverview() {
    const kpis = (DS.current || []).map(r => {
      const val = r.yoy != null ? r.yoy : (r.v != null ? r.v + (r.unit ? ' ' + r.unit : '') : '—');
      return '<article class="hl-kpi">' +
        '<div class="hl-kpi-head"><span class="hl-kpi-name">' + esc(r.k) + '</span>' + badges(r) + '</div>' +
        '<div class="hl-kpi-value">' + esc(val) + '</div>' +
        '<div class="hl-kpi-foot">' + esc(r.note || '') + '</div></article>';
    }).join('');

    const entries = [
      { id: 'extrapolate', code: '01', title: '现状推演', desc: '按当前动能做描述性外推，给出 P10/P50/P90 区间；外推不是预测。' },
      { id: 'stress', code: '02', title: '压力测试', desc: '五维条件 if-then 加压与单变量敏感性排名；耦合为 C 级模型假设，非因果。' },
      { id: 'triggers', code: '03', title: '触发信号', desc: '三条用户指定监测规则的当前状态、阈值与建议动作。' }
    ].map(e =>
      '<button type="button" class="hl-card hl-entry" data-go="' + e.id + '">' +
      '<div class="hl-card-head"><span class="hl-nav-code">' + e.code + '</span><h3>' + esc(e.title) + '</h3></div>' +
      '<p class="hl-note">' + esc(e.desc) + '</p></button>').join('');

    const evCount = { A: 0, B: 0, C: 0 };
    const vbCount = { pending: 0, verifying: 0, verified: 0, conflict: 0, superseded: 0 };
    IND.forEach(x => {
      evCount[x.evidence] = (evCount[x.evidence] || 0) + 1;
      vbCount[x.verify] = (vbCount[x.verify] || 0) + 1;
    });
    const evTags = ['A', 'B', 'C'].map(k => '<span class="hl-tag">' + esc(CORE.EVIDENCE[k]) + ' × ' + evCount[k] + '</span>').join('');
    const vbTags = Object.keys(CORE.VERIFY).map(k => '<span class="hl-tag">' + esc(CORE.VERIFY[k]) + ' × ' + (vbCount[k] || 0) + '</span>').join('');

    return '<div class="hl-ws">' +
      '<div class="hl-callout warn"><strong>目标留白声明：</strong>本页不设定任何目标值，不做结构假设；只呈现现状快照、条件推演区间与规则触发状态。</div>' +
      '<div class="hl-kpi-row">' + kpis + '</div>' +
      '<div class="hl-grid hl-grid-3">' + entries + '</div>' +
      '<div class="hl-grid hl-grid-2">' +
        '<div class="hl-card"><h3>证据等级分布</h3><div class="hl-tag-row">' + evTags + '</div>' +
          '<p class="hl-note" style="margin-top:10px">证据等级回答「数据从哪来、定稿到什么程度」，与核验状态是两个独立维度。</p></div>' +
        '<div class="hl-card"><h3>核验状态分布</h3><div class="hl-tag-row">' + vbTags + '</div>' +
          '<p class="hl-note" style="margin-top:10px">核验状态回答「这条数据目前核到哪一步」；口头纠错只触发核验，不改变证据等级。</p></div>' +
      '</div>' +
      '<div class="hl-card"><h3>数据期次与来源</h3><div class="hl-list">' +
        '<div class="hl-list-item"><span>年度口径</span><b>' + esc(DS.asof ? DS.asof.officialLabel : '—') + '</b></div>' +
        '<div class="hl-list-item"><span>当期快报</span><b>' + esc(DS.asof ? DS.asof.currentLabel : '—') + '</b></div>' +
        '<div class="hl-list-item"><span>最近核验</span><b>' + esc(DS.asof ? DS.asof.checked : '—') + '</b></div>' +
      '</div><p class="hl-note" style="margin-top:10px">' + esc(DS.asof ? DS.asof.note : '') + '</p></div>' +
    '</div>';
  }

  /* =========================================================================
     工作区 01 · 现状推演（ENGINE.extrapolate）
     ========================================================================= */
  function renderExtrapolate() {
    const ext = ENGINE.extrapolate(DS);

    const rows = ext.indicators.map(it => {
      if (it.m == null || !Number.isFinite(it.m)) {
        return '<tr><td><div class="hl-cell-name">' + esc(it.name) + '</div></td>' +
          '<td colspan="6" class="hl-empty">缺当前增速，未参与外推</td></tr>';
      }
      const ped = it.pedigree || {};
      return '<tr>' +
        '<td><div class="hl-cell-name">' + esc(it.name) + '</div><div class="hl-cell-sub">' + esc(ped.dataSource || '') + '</div></td>' +
        '<td class="hl-num">' + signed(it.m) + '%</td>' +
        '<td class="hl-num">' + fmt(it.sigma) + '</td>' +
        '<td class="hl-num">' + signed(it.p10) + '%</td>' +
        '<td class="hl-num hl-mid">' + signed(it.p50) + '%</td>' +
        '<td class="hl-num">' + signed(it.p90) + '%</td>' +
        '<td>' + evBadge(ped.dataEvidence) + vBadge(ped.verify) + '</td></tr>';
    }).join('');

    const mom = IND.filter(x => x.official && x.current).map(x =>
      '<tr><td>' + esc(x.name) + '</td><td class="hl-num">' + esc(x.official.v) + '</td>' +
      '<td class="hl-num">' + esc(x.current.yoy || '—') + '</td><td>' + evBadge(x.evidence) + vBadge(x.verify) + '</td></tr>').join('');

    const caveatRow = ext.indicators.find(i => i.pedigree && i.pedigree.caveat);

    return '<div class="hl-ws">' +
      '<div class="hl-callout"><strong>外推 ≠ 预测：</strong>' + esc(ext.sigmaNote) + '</div>' +
      '<div class="hl-card"><div class="hl-card-head"><h3>各指标当前动能外推区间</h3>' + evBadge('C') + vBadge('pending') + '</div>' +
        '<div class="hl-table-scroll"><table class="hl-table">' +
          '<thead><tr><th>指标</th><th>当前动能 m</th><th>σ(pp)</th><th>P10</th><th>P50</th><th>P90</th><th>标注</th></tr></thead>' +
          '<tbody>' + rows + '</tbody></table></div>' +
        (caveatRow ? '<p class="hl-note" style="margin-top:10px">' + esc(caveatRow.pedigree.caveat) + '</p>' : '') +
      '</div>' +
      '<div class="hl-card"><h3>动能对照（年度基准 → 当期快报）</h3>' +
        '<div class="hl-table-scroll"><table class="hl-table">' +
          '<thead><tr><th>指标</th><th>' + esc(offPeriod) + '</th><th>当期快报同比</th><th>标注</th></tr></thead>' +
          '<tbody>' + mom + '</tbody></table></div>' +
        '<p class="hl-note" style="margin-top:10px">年度终值与当期累计快报口径不同，增速不可直接相加或比较；此处仅作动能方向对照。</p>' +
      '</div>' +
    '</div>';
  }

  /* =========================================================================
     工作区 02 · 压力测试（ENGINE.stress / ENGINE.sensitivity）
     ========================================================================= */
  function renderStress() {
    const sens = ENGINE.sensitivity(DS);
    const str = ENGINE.stress(DS, state.conditions);

    const sliders = Object.keys(COND_META).map(k => {
      const meta = COND_META[k];
      const v = state.conditions[k];
      return '<div class="hl-slider-row" data-cond="' + k + '">' +
        '<div class="hl-slider-head"><span>' + esc(meta.label) + '</span>' +
        '<span class="hl-num hl-slider-val" id="hlSval-' + k + '">' + signed(v) + ' pp</span></div>' +
        '<input type="range" min="' + (-ENGINE.STRESS_BOUND) + '" max="' + ENGINE.STRESS_BOUND + '" step="1" value="' + v + '" data-cond="' + k + '" aria-label="' + esc(meta.label) + '条件扰动">' +
        '<div class="hl-slider-scale"><span>-' + ENGINE.STRESS_BOUND + 'pp</span><span>0</span><span>+' + ENGINE.STRESS_BOUND + 'pp</span></div></div>';
    }).join('');

    const targets = str.targets.map(t => {
      const iv = t.interval;
      return '<article class="hl-card hl-target-card sig-' + t.signal + '">' +
        '<div class="hl-card-head"><h3>' + esc(t.name) + '</h3>' +
        '<span class="hl-signal hl-sig-' + t.signal + '">' + esc(SIG_LABEL[t.signal] || t.signal) + '</span></div>' +
        '<div class="hl-badge-row">' + evBadge(t.pedigree.dataEvidence) + vBadge(verifyFromEvidence(t.pedigree.dataEvidence)) + evBadge('C') + vBadge('pending') + '</div>' +
        '<div class="hl-target-line"><span>基线增速</span><b>' + (t.baseline != null ? signed(t.baseline) + '%' : '—') + '</b>' +
        '<span>耦合调整</span><b>' + signed(t.adjustedDelta) + ' pp</b></div>' +
        (iv ? '<div class="hl-target-range">P10 ' + signed(iv.p10) + '% · P50 ' + signed(iv.p50) + '% · P90 ' + signed(iv.p90) + '%</div>' : '<div class="hl-empty">缺基线增速，未生成区间</div>') +
        '<div class="hl-coupling">' + (t.coupling || []).map(c =>
          '<span class="hl-coupling-item">' + esc(c.label) + ' × ' + c.coefficient + '（' + signed(c.conditionDelta) + 'pp → ' + signed(c.coupledDelta) + 'pp）</span>').join('') + '</div>' +
        '<div class="hl-note">' + esc(t.pedigree.caveat) + '</div></article>';
    }).join('');

    const sensRows = sens.ranked.map(r =>
      '<tr><td class="hl-num">' + r.rank + '</td><td>' + esc(r.label) + '</td>' +
      '<td class="hl-num">' + signed(r.low) + '</td><td class="hl-num">' + signed(r.high) + '</td>' +
      '<td class="hl-num hl-mid">' + signed(r.range) + '</td><td>' + evBadge('C') + '</td></tr>').join('');

    return '<div class="hl-ws">' +
      '<div class="hl-callout warn">' + esc(str.note) + '</div>' +
      '<div class="hl-card"><h3>五维条件设定（if-then）</h3>' + sliders + '</div>' +
      '<div class="hl-grid hl-grid-2">' + targets + '</div>' +
      '<div class="hl-card"><div class="hl-card-head"><h3>单变量敏感性排名</h3><span class="hl-note">±' + ENGINE.SENS_DELTA + 'pp</span></div>' +
        '<div class="hl-table-scroll"><table class="hl-table">' +
          '<thead><tr><th>排名</th><th>条件维度</th><th>向下扰动</th><th>向上扰动</th><th>影响幅度</th><th>标注</th></tr></thead>' +
          '<tbody>' + sensRows + '</tbody></table></div>' +
        '<p class="hl-note" style="margin-top:10px">' + esc(sens.note) + '</p>' +
      '</div>' +
    '</div>';
  }

  /* =========================================================================
     工作区 03 · 触发信号（ENGINE.evaluateTriggers）
     ========================================================================= */
  function renderTriggers() {
    const tr = ENGINE.evaluateTriggers(DS);
    const cards = tr.rules.map(r => {
      const ev = evLetter(r.current.evidence) || 'B';
      const vb = ev === 'C' ? 'pending' : 'verified';
      const thr = r.threshold;
      const thrText = thr.operator + (thr.value != null ? ' ' + fmt(thr.value) + ' ' + esc(thr.unit) : '');
      return '<article class="hl-trigger hl-trig-' + r.status + '">' +
        '<div class="hl-trigger-head"><h3>' + esc(r.name) + '</h3>' +
        '<span class="hl-trig-status hl-trig-' + r.status + '">' + esc(tr.statusLegend[r.status] || r.status) + '</span></div>' +
        '<p class="hl-trigger-rule">' + esc(r.rule) + '</p>' +
        '<div class="hl-trigger-grid">' +
          '<div><small>当前值</small><b>' + esc(r.current.label) + '</b> ' + evBadge(ev) + vBadge(vb) + '</div>' +
          '<div><small>阈值规则</small><b>' + esc(thrText) + '</b><div class="hl-cell-sub">来源：' + esc(thr.source) + '</div></div>' +
          '<div><small>状态说明</small><b>' + esc(r.statusNote) + '</b></div>' +
          '<div><small>建议动作</small><b>' + esc(r.action) + '</b></div>' +
        '</div>' +
        '<div class="hl-note">' + esc(r.evidence) + '</div></article>';
    }).join('');

    return '<div class="hl-ws">' +
      '<div class="hl-callout">阈值为用户指定监测规则（本任务指令），不是指标数据；当前值从 data.js 读取。' + esc(tr.note || '') + '</div>' +
      cards +
    '</div>';
  }

  /* =========================================================================
     工作区 04–08 · 五个决策维度深剖（读 DS 真实值 + 单维 what-if）
     ========================================================================= */
  function recordBlock(rec, originLabel) {
    if (!rec) return '<div class="hl-empty">暂无' + esc(originLabel) + '口径记录</div>';
    const val = rec.yoy != null ? rec.yoy : (rec.v != null ? rec.v + (rec.unit ? ' ' + rec.unit : '') : '—');
    return '<div class="hl-list-item"><div><div class="hl-cell-name">' + esc(rec.k) + '</div>' +
      '<div class="hl-cell-sub">' + esc(rec.note || rec.sub || '') + '</div></div>' +
      '<div><div class="hl-num">' + esc(val) + '</div>' + badges(rec) + '</div></div>';
  }

  function whatIfCard(condKey, aimId, title, desc) {
    const delta = state.whatIf[condKey] || 0;
    const str = ENGINE.stress(DS, { [condKey]: delta });
    const t = str.targets.find(x => x.id === aimId);
    const meta = COND_META[condKey];
    let result = '<div class="hl-empty">未匹配到受影响目标</div>';
    if (t) {
      const iv = t.interval;
      result = '<div class="hl-target-line"><span>基线</span><b>' + (t.baseline != null ? signed(t.baseline) + '%' : '—') + '</b>' +
        '<span>耦合调整</span><b>' + signed(t.adjustedDelta) + ' pp</b></div>' +
        (iv ? '<div class="hl-target-range">P10 ' + signed(iv.p10) + '% · P50 ' + signed(iv.p50) + '% · P90 ' + signed(iv.p90) + '%</div>' : '');
    }
    return '<div class="hl-card"><div class="hl-card-head"><h3>' + esc(title) + '</h3>' + evBadge('C') + vBadge('pending') + '</div>' +
      '<p class="hl-note">' + esc(desc) + '</p>' +
      '<div class="hl-slider-row" data-whatif="' + condKey + '">' +
        '<div class="hl-slider-head"><span>' + esc(meta.label) + '扰动</span>' +
        '<span class="hl-num hl-slider-val" id="hlWval-' + condKey + '">' + signed(delta) + ' pp</span></div>' +
        '<input type="range" min="' + (-ENGINE.STRESS_BOUND) + '" max="' + ENGINE.STRESS_BOUND + '" step="1" value="' + delta + '" data-whatif="' + condKey + '" aria-label="' + esc(title) + '条件扰动">' +
      '</div>' + result +
      '<div class="hl-note">条件耦合为模型假设(C级)，非因果推断；仅为 if-then 条件情景。</div></div>';
  }

  function renderFai() {
    return '<div class="hl-ws">' +
      '<div class="hl-card"><h3>固定资产投资 · 现状记录</h3><div class="hl-list">' +
        recordBlock(off('fai'), '年度') + recordBlock(cur('fai'), '当期') +
      '</div></div>' +
      whatIfCard('fai', 'ind_continuity', '固投收缩的接续传导', '若固投增速进一步下行，未来投产节点承压；耦合方向：固投 → 工业接续。') +
    '</div>';
  }

  function renderIndustry() {
    return '<div class="hl-ws">' +
      '<div class="hl-card"><h3>工业接续 · 现状记录</h3><div class="hl-list">' +
        recordBlock(off('ind_va'), '年度') + recordBlock(cur('ind_va'), '当期') +
        recordBlock(off('ind_profit'), '年度') + recordBlock(cur('gdp2'), '当期') +
      '</div></div>' +
      whatIfCard('industry', 'secondary', '工业走弱对二产 / GDP 的传导', '若规上工业增速进一步下行，二产与 GDP 增速随之承压；耦合为 C 级假设，非因果。') +
    '</div>';
  }

  function renderProjects() {
    return '<div class="hl-ws">' +
      '<div class="hl-card"><h3>重点项目 · 进度记录</h3><div class="hl-list">' + recordBlock(cur('proj'), '当期') + '</div>' +
        '<p class="hl-note" style="margin-top:10px">产业类进度的阈值监测见「03 触发信号」工作区。</p></div>' +
      whatIfCard('projects', 'ind_continuity', '项目进度对工业接续的影响', '若产业类项目进度偏低，未来工业接续缺口扩大；耦合为 C 级假设，非因果。') +
    '</div>';
  }

  function renderResilience() {
    return '<div class="hl-ws">' +
      '<div class="hl-card"><h3>三产韧性 · 现状记录</h3><div class="hl-list">' +
        recordBlock(off('retail'), '年度') + recordBlock(cur('retail'), '当期') +
        recordBlock(off('trade'), '年度') + recordBlock(cur('trade'), '当期') +
        recordBlock(off('income'), '年度') +
      '</div></div>' +
      whatIfCard('retail', 'tertiary_resilience', '消费走弱对三产支撑的影响', '若消费增速下行，三产韧性支撑减弱；耦合为 C 级假设，非因果。') +
    '</div>';
  }

  function renderFiscal() {
    return '<div class="hl-ws">' +
      '<div class="hl-card"><h3>财政与财力 · 现状记录</h3><div class="hl-list">' +
        recordBlock(off('rev'), '年度') + recordBlock(cur('rev'), '当期') +
      '</div></div>' +
      whatIfCard('fiscal', 'fiscal_space', '收入走弱对财政空间的影响', '若区本级收入下行，可支配投入空间收窄；耦合为 C 级假设，非因果。') +
    '</div>';
  }

  /* =========================================================================
     工作区 09 · 数据校准中心
     ========================================================================= */
  function renderCalibrate() {
    const topics = IND.map(x => '<option value="' + x.id + '">' + esc(x.name) + '</option>').join('');
    const opts = CORE.FEEDBACK_OPTIONS.map((o, i) =>
      '<label><input type="radio" name="hlFbOpt" value="' + esc(o) + '"' + (i === 0 ? ' checked' : '') + '>' + esc(o) + '</label>').join('');

    const fbList = CORE.feedback.list();
    const fbRows = fbList.length ? fbList.map(f => {
      const topic = indMap.get(f.topicId);
      return '<div class="hl-list-item"><div><div class="hl-cell-name">' + esc(topic ? topic.name : (f.topicId || '未关联指标')) + '</div>' +
        '<div class="hl-cell-sub">' + esc(f.ts || '') + '</div></div>' +
        '<div><b>' + esc(f.option || '跳过') + '</b><div class="hl-cell-sub">' + esc(f.note || '') + '</div></div></div>';
    }).join('') : '<div class="hl-empty">暂无反馈记录；可跳过，不强制填写。</div>';

    const layers = [
      { n: '1. Demo 数据底座', d: '真实公开数据与合成/假设数据分别标记；当前底座为 data.js 真实数据 + 引擎 C 级假设。' },
      { n: '2. 数据接入层', d: '支持 CSV / XLSX / JSON，识别指标、单位、年份、地区、行业、口径六要素。' },
      { n: '3. 核验与冲突管理', d: '核验状态机与冲突记录；反馈只触发核验，不改变证据等级。' },
      { n: '4. 模型影响管理', d: '数据改变后生成影响清单，列明受影响指标、模型与情景，不全部重算。' },
      { n: '5. 版本与审计', d: '新数据建新版本，历史版本可查；所有操作留审计日志。' }
    ].map(l => '<div class="hl-list-item"><div><div class="hl-cell-name">' + esc(l.n) + '</div>' +
      '<div class="hl-cell-sub">' + esc(l.d) + '</div></div></div>').join('');

    const diffs = CORE.DIFF_CASES.map(d =>
      '<div class="hl-list-item"><div><div class="hl-cell-name">' + esc(d.label) + '</div>' +
      '<div class="hl-cell-sub">' + esc(d.desc) + '</div></div><small>先：' + esc(d.first) + '</small></div>').join('');

    const conflicts = CORE.listConflicts();
    const conflictRows = conflicts.length ? conflicts.map(c =>
      '<tr><td>' + esc(c.name) + '</td><td>' + esc(c.origin) + '</td><td>' + evBadge(c.evidence) + vBadge(c.status) + '</td><td>' + esc(c.note || '') + '</td></tr>').join('') :
      '<tr><td colspan="4" class="hl-empty">当前无标记为「存在冲突」的数据点</td></tr>';

    const vers = CORE.versions();
    const verRows = vers.map(v => {
      const recCount = v.records != null
        ? (typeof v.records === 'object' ? '年度 ' + v.records.official + ' / 当期 ' + v.records.current : v.records)
        : '—';
      return '<tr><td class="hl-num">v' + v.version + '</td><td>' + esc(v.kind) + '</td><td>' + esc(v.type || '') + '</td>' +
        '<td class="hl-num">' + recCount + '</td><td>' + evBadge(v.evidence === 'A/B' ? 'A' : v.evidence) + vBadge(v.verify) + '</td>' +
        '<td>' + esc(v.note || '') + '</td></tr>';
    }).join('');

    const audit = CORE.auditLog();
    const auditRows = audit.slice().reverse().map(a =>
      '<tr><td class="hl-num">' + esc(a.ts || '') + '</td><td>' + esc(a.action) + '</td><td>' + esc(a.detail || '') + '</td></tr>').join('');

    const redlines = CORE.REDLINES.map(r => '<li>' + esc(r) + '</li>').join('');
    const valLayers = CORE.VALIDATION_LAYERS.map(l =>
      '<div class="hl-card"><h3>' + esc(l.name) + '</h3><div class="hl-tag-row">' + l.items.map(i => '<span class="hl-tag">' + esc(i) + '</span>').join('') + '</div>' +
      '<p class="hl-note" style="margin-top:8px">' + esc(l.note) + '</p></div>').join('');

    const indOpts = IND.map(x => '<option value="' + x.id + '">' + esc(x.name) + '</option>').join('');

    return '<div class="hl-ws">' +
      '<div class="hl-card hl-feedback"><div class="hl-card-head"><h3>数据反馈（四选项，可跳过）</h3>' + vBadge('pending') + '</div>' +
        '<div class="hl-form-row"><label>关联指标<select id="hlFbTopic">' + topics + '</select></label></div>' +
        '<div class="hl-feedback-options">' + opts + '</div>' +
        '<textarea id="hlFbNote" placeholder="补充口径/来源说明（可选；本地处理，不上传）"></textarea>' +
        '<div class="hl-btn-row"><button type="button" class="hl-btn" id="hlFbSubmit">提交反馈</button>' +
        '<button type="button" class="hl-btn ghost" id="hlFbSkip">跳过本次</button>' +
        '<button type="button" class="hl-btn ghost" id="hlFbExport">导出反馈 JSON</button>' +
        '<button type="button" class="hl-btn danger" id="hlFbClear">清空本地反馈</button></div>' +
        '<div class="hl-list">' + fbRows + '</div>' +
      '</div>' +
      '<div class="hl-grid hl-grid-2">' +
        '<div class="hl-card"><h3>五层数据管理</h3><div class="hl-list">' + layers + '</div></div>' +
        '<div class="hl-card"><h3>口径差异四情形</h3><p class="hl-note" style="margin-bottom:10px">' + esc(CORE.DIFF_CASES.principle) + '</p><div class="hl-list">' + diffs + '</div></div>' +
      '</div>' +
      '<div class="hl-card"><h3>影响清单（数据改变后）</h3>' +
        '<div class="hl-form-row"><label>变化指标<select id="hlImpInd">' + indOpts + '</select></label>' +
        '<label>原值<input type="text" id="hlImpOld" placeholder="可选"></label>' +
        '<label>新值<input type="text" id="hlImpNew" placeholder="可选"></label>' +
        '<label>原因<input type="text" id="hlImpReason" placeholder="可选"></label></div>' +
        '<div class="hl-btn-row"><button type="button" class="hl-btn" id="hlImpRun">生成影响清单</button></div>' +
        '<div id="hlImpOut" class="hl-list" style="margin-top:10px"></div>' +
      '</div>' +
      '<div class="hl-card"><h3>冲突记录</h3><div class="hl-table-scroll"><table class="hl-table"><thead><tr><th>指标</th><th>来源</th><th>标注</th><th>说明</th></tr></thead><tbody>' + conflictRows + '</tbody></table></div></div>' +
      '<div class="hl-grid hl-grid-2">' +
        '<div class="hl-card"><h3>版本记录</h3><div class="hl-table-scroll"><table class="hl-table"><thead><tr><th>版本</th><th>类型</th><th>格式</th><th>记录数</th><th>标注</th><th>说明</th></tr></thead><tbody>' + verRows + '</tbody></table></div></div>' +
        '<div class="hl-card"><h3>审计日志</h3><div class="hl-table-scroll"><table class="hl-table"><thead><tr><th>时间</th><th>动作</th><th>明细</th></tr></thead><tbody>' + auditRows + '</tbody></table></div></div>' +
      '</div>' +
      '<div class="hl-card"><h3>三层验证（分开记录，互不混用）</h3><div class="hl-grid hl-grid-3">' + valLayers + '</div></div>' +
      '<div class="hl-card"><h3>研究边界 · 十条红线</h3><ul class="hl-redlines">' + redlines + '</ul></div>' +
    '</div>';
  }

  /* =========================================================================
     工作区 10 · 数据接入（CORE.importData）
     ========================================================================= */
  function renderImport() {
    const imp = state.lastImport;
    let resBlock = '<div class="hl-empty">尚未导入；可先体验，不要求首次就提供数据。</div>';
    if (imp) {
      const mapRows = Object.entries(imp.mapping || {}).map(([k, v]) =>
        '<tr><td>' + esc(k) + '</td><td>' + (v ? esc(v) : '—') + '</td></tr>').join('');
      const warn = (imp.warnings || []).length
        ? '<div class="hl-callout warn">' + (imp.warnings || []).map(esc).join('<br>') + '</div>' : '';
      resBlock = '<div class="hl-list">' +
        '<div class="hl-list-item"><span>新版本</span><b>v' + imp.version + '</b></div>' +
        '<div class="hl-list-item"><span>格式</span><b>' + esc(imp.type) + '</b></div>' +
        '<div class="hl-list-item"><span>记录数</span><b>' + imp.records.length + '</b></div>' +
        '<div class="hl-list-item"><span>标注</span>' + evBadge(imp.evidence) + vBadge(imp.verify) + '</div>' +
      '</div>' +
      '<div class="hl-table-scroll" style="margin-top:10px"><table class="hl-table"><thead><tr><th>字段要素</th><th>匹配列</th></tr></thead><tbody>' + mapRows + '</tbody></table></div>' +
      warn;
    }
    return '<div class="hl-ws">' +
      '<div class="hl-callout">数据仅在浏览器本地处理，不上传；导入数据建新版本，绝不覆盖原始 Demo 底座；导入后证据为 B 级、待核验，不自动升 A。</div>' +
      '<div class="hl-card"><h3>接入文件（CSV / XLSX / JSON）</h3>' +
        '<input type="file" id="hlImportFile" accept=".csv,.xlsx,.json">' +
        '<p class="hl-note" style="margin-top:8px">识别六要素：指标、单位、年份、地区、行业、口径；中文列名自动别名映射。</p>' +
      '</div>' +
      '<div class="hl-card"><h3>导入结果</h3>' + resBlock + '</div>' +
    '</div>';
  }

  /* =========================================================================
     工作区 11 · 研究报告（ENGINE.snapshot + 血统 + 三层验证 + 外部对照）
     ========================================================================= */
  function renderReport() {
    const snap = ENGINE.snapshot(DS);
    state.snap = snap;

    const pedRows = snap.pedigree.map(p =>
      '<tr><td>' + esc(p.param) + '</td><td>' + esc(p.level) + '</td><td>' + esc(p.verify) + '</td></tr>').join('');

    const valLayers = CORE.VALIDATION_LAYERS.map(l =>
      '<div class="hl-card"><h3>' + esc(l.name) + '</h3><div class="hl-tag-row">' + l.items.map(i => '<span class="hl-tag">' + esc(i) + '</span>').join('') + '</div>' +
      '<p class="hl-note" style="margin-top:8px">' + esc(l.note) + '</p></div>').join('');

    const extRows = snap.extrapolate.indicators.filter(i => i.p50 != null).map(i =>
      '<tr><td><div class="hl-cell-name">' + esc(i.name) + '</div>' + evBadge(i.pedigree.dataEvidence) + vBadge(verifyFromEvidence(i.pedigree.dataEvidence)) + '</td><td class="hl-num">P50 ' + signed(i.p50) + '%</td>' +
      '<td><input type="text" data-ext="' + i.id + '" placeholder="粘贴 SPSS / SmartPLS 数值"></td>' +
      '<td class="hl-cell-sub">数值对照，不做等价认证</td></tr>').join('');

    return '<div class="hl-ws">' +
      '<div class="hl-callout warn">' + esc(snap.meta.boundary) + '</div>' +
      '<div class="hl-card"><div class="hl-card-head"><h3>复现快照</h3><span class="hl-note">种子 ' + snap.meta.seed + ' · 次数 ' + snap.meta.N + '</span></div>' +
        '<div class="hl-btn-row"><button type="button" class="hl-btn" id="hlSnapJson">下载快照 JSON</button>' +
        '<button type="button" class="hl-btn ghost" id="hlSnapMd">导出 Markdown</button></div>' +
        '<p class="hl-note" style="margin-top:10px">' + esc(snap.reproduction.note) + '</p>' +
      '</div>' +
      '<div class="hl-card"><h3>参数血统表</h3><div class="hl-table-scroll"><table class="hl-pedigree"><thead><tr><th>参数 / 数据</th><th>血统</th><th>核验</th></tr></thead><tbody>' + pedRows + '</tbody></table></div></div>' +
      '<div class="hl-grid hl-grid-3">' + valLayers + '</div>' +
      '<div class="hl-card"><h3>外部软件结果导入对照（可选）</h3>' +
        '<p class="hl-note" style="margin-bottom:10px">可粘贴 SPSS / SmartPLS 等软件输出的数值并排查看；本页仅做数值对照，不做模型等价认证。</p>' +
        '<div class="hl-table-scroll"><table class="hl-table"><thead><tr><th>指标</th><th>本实验室 P50</th><th>外部软件数值</th><th>说明</th></tr></thead><tbody>' + extRows + '</tbody></table></div>' +
      '</div>' +
    '</div>';
  }

  /* =========================================================================
     工作区注册表 / 导航 / 渲染
     ========================================================================= */
  const WS = [
    { id: 'overview',     code: '00', title: '决策总览',     group: '决策主线',     render: renderOverview },
    { id: 'extrapolate',  code: '01', title: '现状推演',     group: '决策主线',     render: renderExtrapolate },
    { id: 'stress',       code: '02', title: '压力测试',     group: '决策主线',     render: renderStress },
    { id: 'triggers',     code: '03', title: '触发信号',     group: '决策主线',     render: renderTriggers },
    { id: 'fai',          code: '04', title: '固投断崖',     group: '决策维度深剖', render: renderFai },
    { id: 'industry',     code: '05', title: '工业接续',     group: '决策维度深剖', render: renderIndustry },
    { id: 'projects',     code: '06', title: '重点项目',     group: '决策维度深剖', render: renderProjects },
    { id: 'resilience',   code: '07', title: '三产韧性',     group: '决策维度深剖', render: renderResilience },
    { id: 'fiscal',       code: '08', title: '财政与财力',   group: '决策维度深剖', render: renderFiscal },
    { id: 'calibrate',    code: '09', title: '数据校准中心', group: '数据与报告',   render: renderCalibrate },
    { id: 'import',       code: '10', title: '数据接入',     group: '数据与报告',   render: renderImport },
    { id: 'report',       code: '11', title: '研究报告',     group: '数据与报告',   render: renderReport }
  ];

  function renderNav() {
    const groups = [];
    WS.forEach(w => {
      let g = groups.find(x => x.label === w.group);
      if (!g) { g = { label: w.group, items: [] }; groups.push(g); }
      g.items.push(w);
    });
    $('#hlNav').innerHTML = groups.map(g =>
      '<div class="hl-nav-group">' + esc(g.label) + '</div>' +
      g.items.map(w =>
        '<button type="button" class="hl-nav-link' + (w.id === state.active ? ' selected' : '') + '" data-view="' + w.id + '">' +
        '<span class="hl-nav-code">' + w.code + '</span><span class="hl-nav-label">' + esc(w.title) + '</span></button>').join('')
    ).join('');
  }

  function renderWork() {
    const w = WS.find(x => x.id === state.active) || WS[0];
    $('#hlWork').innerHTML =
      '<div class="hl-contextbar"><div><span class="hl-context-code">' + w.code + ' / ' + esc(w.title.toUpperCase()) + '</span>' +
      '<div class="hl-context-title">' + esc(w.title) + '</div></div>' +
      '<div class="hl-context-side">' + esc(DS.asof ? DS.asof.currentLabel : '') + '</div></div>' +
      w.render();
  }

  function navigate(id) {
    const w = WS.find(x => x.id === id);
    if (!w) return;
    state.active = w.id;
    try { history.replaceState(null, '', '#' + w.id); } catch (e) { /* file:// 下降级 */ }
    renderNav();
    renderWork();
    $('#hlSidebar').classList.remove('open');
    $('#hlBackdrop').hidden = true;
    $('#hlMenuBtn').setAttribute('aria-expanded', 'false');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /* =========================================================================
     反馈 / 影响清单 / 导入 / 导出
     ========================================================================= */
  let toastTimer;
  function showToast(msg) {
    let t = $('#hlToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'hlToast';
      t.className = 'hl-toast';
      t.hidden = true;
      document.body.appendChild(t);
    }
    t.textContent = String(msg);
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 5000);
  }

  function submitFeedback(skip) {
    const topicEl = $('#hlFbTopic');
    const topic = topicEl ? topicEl.value : null;
    const checked = document.querySelector('input[name="hlFbOpt"]:checked');
    const opt = skip ? null : (checked ? checked.value : null);
    const noteEl = $('#hlFbNote');
    const note = noteEl ? noteEl.value.trim() : '';
    try {
      CORE.feedback.submit(topic, opt, note || null);
      renderWork();
    } catch (err) { showToast(err.message); }
  }

  function exportFeedback() {
    const text = CORE.feedback.export();
    download('hc-lab-feedback.json', text, 'application/json;charset=utf-8');
  }

  function clearFeedback() {
    CORE.feedback.clear();
    renderWork();
  }

  function runImpact() {
    const idEl = $('#hlImpInd');
    const oldEl = $('#hlImpOld');
    const newEl = $('#hlImpNew');
    const reasonEl = $('#hlImpReason');
    const res = CORE.impactList([{
      indicatorId: idEl ? idEl.value : null,
      old: oldEl ? oldEl.value.trim() || null : null,
      new: newEl ? newEl.value.trim() || null : null,
      reason: reasonEl ? reasonEl.value.trim() || null : null
    }]);
    const out = $('#hlImpOut');
    if (!out) return;
    const inds = res.affectedIndicators.map(x =>
      '<span class="hl-tag">' + esc(x.name) + (x.level === 'related' ? '（关联）' : '（直接）') + '</span>').join('');
    const mods = res.affectedModels.map(x => '<span class="hl-tag">' + esc(x.name) + '</span>').join('');
    const scs = res.affectedScenarios.map(x => '<span class="hl-tag">' + esc(x.name) + '</span>').join('');
    out.innerHTML =
      '<div class="hl-list-item"><span>受影响指标</span><div class="hl-tag-row">' + (inds || '—') + '</div></div>' +
      '<div class="hl-list-item"><span>受影响模型</span><div class="hl-tag-row">' + (mods || '—') + '</div></div>' +
      '<div class="hl-list-item"><span>受影响情景</span><div class="hl-tag-row">' + (scs || '—') + '</div></div>' +
      '<div class="hl-note">' + esc(res.note) + '</div>';
  }

  async function handleImport(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const type = ext === 'xlsx' ? 'xlsx' : ext === 'json' ? 'json' : 'csv';
    try {
      const rows = type === 'xlsx' ? await file.arrayBuffer() : await file.text();
      const res = CORE.importData(type, rows);
      state.lastImport = res;
      state.modeLabel = '已接入 v' + res.version;
      updateModePill();
      renderWork();
    } catch (err) {
      showToast(err.message);
    }
  }

  function download(name, text, mime) {
    const blob = new Blob([text], { type: mime || 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function downloadSnapshot() {
    if (!state.snap) state.snap = ENGINE.snapshot(DS);
    download('hc-lab-snapshot.json', JSON.stringify(state.snap, null, 2));
  }

  function snapshotMarkdown(snap) {
    const L = [];
    L.push('# 惠城决策模拟实验室 · 研究报告（内部版）');
    L.push('');
    L.push('> ' + snap.meta.boundary);
    L.push('');
    L.push('- 随机种子：' + snap.meta.seed + '；模拟次数：' + snap.meta.N);
    L.push('- 数据截止：' + (snap.meta.asof || '—'));
    L.push('');
    L.push('## 一、现状推演（按当前动能外推）');
    L.push('');
    L.push('| 指标 | 当前动能 m | P10 | P50 | P90 |');
    L.push('|---|---|---|---|---|');
    snap.extrapolate.indicators.forEach(i => {
      L.push('| ' + i.name + ' | ' + (i.m != null ? signed(i.m) + '%' : '—') + ' | ' +
        (i.p10 != null ? signed(i.p10) + '%' : '—') + ' | ' +
        (i.p50 != null ? signed(i.p50) + '%' : '—') + ' | ' +
        (i.p90 != null ? signed(i.p90) + '%' : '—') + ' |');
    });
    L.push('');
    L.push('## 二、压力测试（基准条件）');
    L.push('');
    snap.stress.targets.forEach(t => {
      L.push('- ' + t.name + '：基线 ' + (t.baseline != null ? signed(t.baseline) + '%' : '—') +
        '，调整 ' + signed(t.adjustedDelta) + 'pp' + (t.interval ? '，P50 ' + signed(t.interval.p50) + '%' : ''));
    });
    L.push('');
    L.push('## 三、触发信号');
    L.push('');
    snap.triggers.rules.forEach(r => {
      L.push('- ' + r.name + '：' + r.statusNote + '；建议：' + r.action);
    });
    L.push('');
    L.push('## 四、参数血统');
    L.push('');
    L.push('| 参数/数据 | 血统 | 核验 |');
    L.push('|---|---|---|');
    snap.pedigree.forEach(p => L.push('| ' + p.param + ' | ' + p.level + ' | ' + p.verify + ' |'));
    L.push('');
    L.push('## 五、三层验证');
    CORE.VALIDATION_LAYERS.forEach(l => L.push('- ' + l.name + '：' + l.items.join('、')));
    L.push('');
    L.push('> ' + snap.reproduction.note);
    return L.join('\n');
  }

  function downloadMarkdown() {
    const snap = state.snap || ENGINE.snapshot(DS);
    download('hc-lab-report.md', snapshotMarkdown(snap), 'text/markdown;charset=utf-8');
  }

  /* =========================================================================
     事件绑定
     ========================================================================= */
  function bindWorkEvents() {
    const work = $('#hlWork');

    work.addEventListener('click', e => {
      if (e.target.closest('[data-go]')) return navigate(e.target.closest('[data-go]').dataset.go);
      if (e.target.closest('#hlFbSubmit')) return submitFeedback(false);
      if (e.target.closest('#hlFbSkip')) return submitFeedback(true);
      if (e.target.closest('#hlFbExport')) return exportFeedback();
      if (e.target.closest('#hlFbClear')) return clearFeedback();
      if (e.target.closest('#hlImpRun')) return runImpact();
      if (e.target.closest('#hlSnapJson')) return downloadSnapshot();
      if (e.target.closest('#hlSnapMd')) return downloadMarkdown();
    });

    work.addEventListener('input', e => {
      const c = e.target.closest('[data-cond]');
      if (c) {
        state.conditions[c.dataset.cond] = Number(e.target.value);
        const lab = $('#hlSval-' + c.dataset.cond);
        if (lab) lab.textContent = signed(e.target.value) + ' pp';
        return;
      }
      const w = e.target.closest('[data-whatif]');
      if (w) {
        state.whatIf[w.dataset.whatif] = Number(e.target.value);
        const lab = $('#hlWval-' + w.dataset.whatif);
        if (lab) lab.textContent = signed(e.target.value) + ' pp';
      }
    });

    work.addEventListener('change', e => {
      const c = e.target.closest('[data-cond]');
      if (c) { state.conditions[c.dataset.cond] = Number(e.target.value); renderWork(); return; }
      const w = e.target.closest('[data-whatif]');
      if (w) { state.whatIf[w.dataset.whatif] = Number(e.target.value); renderWork(); return; }
      const f = e.target.closest('#hlImportFile');
      if (f) return handleImport(f);
    });
  }

  function updateModePill() {
    const pill = $('#hlMode');
    if (pill) pill.textContent = state.modeLabel;
  }

  function bindPersistent() {
    $('#hlCalibLink').addEventListener('click', () => navigate('calibrate'));
    $('#hlMenuBtn').addEventListener('click', () => {
      const sb = $('#hlSidebar');
      const open = sb.classList.toggle('open');
      $('#hlBackdrop').hidden = !open;
      $('#hlMenuBtn').setAttribute('aria-expanded', String(open));
    });
    $('#hlBackdrop').addEventListener('click', () => {
      $('#hlSidebar').classList.remove('open');
      $('#hlBackdrop').hidden = true;
      $('#hlMenuBtn').setAttribute('aria-expanded', 'false');
    });
    $('#hlNav').addEventListener('click', e => {
      const b = e.target.closest('[data-view]');
      if (b) navigate(b.dataset.view);
    });
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    renderNav();
    renderWork();
    bindWorkEvents();
    bindPersistent();
    updateModePill();
    const foot = $('#hlFootMeta');
    if (foot && DS.asof) foot.textContent = DS.asof.officialLabel + ' / ' + DS.asof.currentLabel + ' · 核验 ' + DS.asof.checked;
    const h = location.hash.replace('#', '');
    if (WS.some(w => w.id === h)) navigate(h);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
