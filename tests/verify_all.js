#!/usr/bin/env node
/* verify_all.js — 发布前质量门（语法 + 口径 + 数据 + 证据 四类断言）
   全过 exit 0，任一失败 exit 1。供 GitHub Actions 与本地 `node tests/verify_all.js` 使用。 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
let fails = 0;
const ok = m => console.log('  ✓ ' + m);
const bad = m => { fails++; console.log('  ✗ ' + m); };

console.log('── 1) HTML 内联 script 语法 ──');
const htmlFiles = ['index.html','future.html','windtunnel.html','fun.html','choices.html','network.html','report.html','blindspot.html','ending.html','who.html'];
for (const f of htmlFiles) {
  const fp = path.join(root, f);
  if (!fs.existsSync(fp)) { bad('缺少页面文件 ' + f); continue; }
  const html = fs.readFileSync(fp, 'utf8');
  const blocks = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  blocks.forEach((code, i) => { try { new Function(code); } catch (e) { bad(f + ' 第' + (i + 1) + '个script块语法错误: ' + e.message); } });
  ok(f + '（' + blocks.length + ' 块）');
}

console.log('── 2) 模型口径断言（model.js 同源，SEED=42 N=10000）──');
const HT = require(path.join(root, 'model.js'));
const SEED = 42, N = 10000;
const effects = { delay:[0,40,90,180], invest:[0,50,110,170], export:[0,30,70,120], shen:[0,15,30,45], dragon:[0,50], commute:[0,60,120,190] };
const state = { delay:2, invest:1, export:1, shen:1, dragon:1, commute:1 };
const order = ['delay','invest','export','shen','dragon','commute'];
const applyDrop = (p,key,drop) => {
  if (drop <= 0) return;
  if (key === 'delay') p[0].mu = Math.max(0, p[0].mu - drop);
  else if (key === 'invest' || key === 'dragon') p[1].mu = Math.max(0, p[1].mu - drop);
  else if (key === 'export' || key === 'shen') p[4].mu = Math.max(0, p[4].mu - drop);
  else if (key === 'commute') { p[3].mu = Math.max(0, p[3].mu - drop); p[0].mu = Math.max(0, p[0].mu - drop * 0.3); }
};
const near = (a, b, t = 0.06) => Math.abs(a - b) <= t;
const base = HT.run(SEED, N, HT.DEFAULT_PATHS);
if (!near(base.hit, 66.24, 0.05)) bad('无冲击基准 hit 应≈66.24%，实际 ' + base.hit.toFixed(2) + '%');
else ok('无冲击基准 hit = ' + base.hit.toFixed(2) + '%');
if (!near(base.p50, 1577, 3)) bad('无冲击基准 P50 应≈1577亿，实际 ' + Math.round(base.p50));
else ok('无冲击基准 P50 = ' + Math.round(base.p50) + '亿');
const rows = Object.keys(state).map(k => ({ k, drop: base.hit - HT.run(SEED, N, (() => { const p = JSON.parse(JSON.stringify(HT.DEFAULT_PATHS)); applyDrop(p, k, effects[k][state[k]]); return p; })()).hit })).sort((a, b) => b.drop - a.drop);
if (rows[0].k !== 'delay' || rows[1].k !== 'commute' || rows[rows.length - 1].k !== 'shen')
  bad('压力排行顺序错误: ' + rows.map(r => r.k).join(' > '));
else ok('压力排行：' + rows.map(r => r.k + ' -' + r.drop.toFixed(1) + '%').join(' | '));
const marginExp = [19.06, 10.68, 5.19, 1.95, 8.85, 10.17];
let prev = base.hit, margOK = true;
const p = JSON.parse(JSON.stringify(HT.DEFAULT_PATHS));
order.forEach((k, i) => {
  applyDrop(p, k, effects[k][state[k]]);
  const cur = HT.run(SEED, N, p).hit;
  if (!near(prev - cur, marginExp[i])) margOK = false;
  prev = cur;
});
if (!margOK) bad('瀑布相邻边际与基准不一致（累计终值 ' + prev.toFixed(2) + '%）');
else ok('瀑布六档相邻边际通过，累计终值 ' + prev.toFixed(2) + '%（旧错误基准 10.34 恰为全叠加）');
if (!near(prev, 10.34, 0.05)) bad('累计终值应≈10.34%，实际 ' + prev.toFixed(2));
const hitCount = Math.round(N * base.hit / 100);
if (hitCount !== 6624) bad('future 达标次数应 6624，实际 ' + hitCount);
else ok('future 达标次数 ' + hitCount.toLocaleString() + ' / ' + N.toLocaleString());

console.log('── 3) 每日数据文件 ──');
for (const f of ['hot.json', 'life.json']) {
  const fp = path.join(root, f);
  if (!fs.existsSync(fp)) { bad('缺少 ' + f); continue; }
  try {
    const d = JSON.parse(fs.readFileSync(fp, 'utf8'));
    if (!d.updated) bad(f + ' 缺 updated');
    if (!Array.isArray(d.items) && !Array.isArray(d.spots)) bad(f + ' 缺主体数组');
    if (f === 'hot.json' && d.items.some(x => !x.url || !x.source)) bad('hot.json 存在缺 url/source 条目');
    ok(f + ' 可解析（updated=' + d.updated + '）');
  } catch (e) { bad(f + ' JSON 解析失败: ' + e.message); }
}

console.log('── 4) 事件证据库（evidence/events/*.json）──');
const evDir = path.join(root, 'evidence', 'events');
const evFiles = fs.existsSync(evDir) ? fs.readdirSync(evDir).filter(f => f.endsWith('.json')) : [];
const reqFields = ['event_id','region','event_type','subject','source_url','evidence_level','status','related_paths','parameter_change','requires_review'];
const evIds = new Set();
if (!evFiles.length) ok('暂无候选事件（目录存在即可，不视为失败）');
for (const f of evFiles) {
  try {
    const ev = JSON.parse(fs.readFileSync(path.join(evDir, f), 'utf8'));
    for (const k of reqFields) if (!(k in ev)) bad(f + ' 缺字段 ' + k);
    if (evIds.has(ev.event_id)) bad(f + ' event_id 重复: ' + ev.event_id);
    evIds.add(ev.event_id);
    if (ev.status === 'approved' && ev.parameter_change == null) bad(f + ' approved 但 parameter_change 为 null（禁止无凭据入库）');
    if (ev.status !== 'rejected' && ev.parameter_change != null && ev.requires_review !== true) bad(f + ' parameter_change 非空但未标 requires_review');
    ok(f + '（' + ev.event_id + ' · ' + ev.status + '）');
  } catch (e) { bad(f + ' 解析失败: ' + e.message); }
}

console.log(fails ? `\n✗ 共 ${fails} 项失败` : '\n✓ 全部通过');
process.exit(fails ? 1 : 0);
