#!/usr/bin/env node
/**
 * 惠城全站数据健康自检
 * 用法: node tests/data_health.js [仓库目录]
 * 退出码 0=通过, 1=有数据过期或结构异常
 *
 * 职责边界：本脚本只管「数据是否新鲜、页面是否还在用旧数字」。
 * 它不改任何文件——数据更新由 huicheng-intel / huicheng-relations / huicheng-data-audit 负责，
 * 页面与逻辑 js 的重构由重构线负责，本脚本只把两边的偏差摆出来。
 */
const fs = require('fs');
const path = require('path');

const repo = process.argv[2] || '.';
const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const fails = [];
const warns = [];
const notes = [];
const fail = m => fails.push(m);
const warn = m => warns.push(m);

function daysBetween(dateStr) {
  if (!dateStr) return Infinity;
  const d = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return Infinity;
  return Math.round((new Date(todayStr + 'T00:00:00') - d) / 86400000);
}

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { fail(`无法解析 ${p}: ${e.message}`); return null; }
}

console.log('='.repeat(64));
console.log(`数据健康自检 · ${todayStr}`);
console.log('='.repeat(64));

/* ---------- 1. 三类数据源的时效 ---------- */

const hot = readJSON(path.join(repo, 'hot.json'));
const life = readJSON(path.join(repo, 'life.json'));
if (hot) {
  const age = daysBetween(hot.updated);
  const line = `hot.json   updated ${hot.updated}  (${age} 天前)  ${hot.count} 条`;
  if (age > 1) fail(line + '  ← 情报应每日更新，已过期');
  else console.log('  ' + line);
}
if (life) {
  const age = daysBetween(life.updated);
  const line = `life.json  updated ${life.updated}  (${age} 天前)  ${life.spots?.length || 0} 去处 / pulse ${life.pulse?.length || 0}`;
  if (age > 1) fail(line + '  ← 情报应每日更新，已过期');
  else console.log('  ' + line);
}
if (life && life.pulse && life.pulse.length !== 3) fail('life.json pulse 应为 3 条');
if (life && life.spots && life.spots.length !== 14) fail('life.json spots 应固定 14 个');

const ev = readJSON(path.join(repo, 'data', 'relationship-evidence-v1.json'));
if (ev) {
  const age = daysBetween(ev.generated_at);
  const line = `关系底座   generated_at ${ev.generated_at}  (${age} 天前)  ${ev.nodes?.length || 0} 节点 / ${ev.edges?.length || 0} 边`;
  if (age > 8) fail(line + '  ← 关系底座应每周更新，已过期');
  else console.log('  ' + line);
}

let hc = null;
try {
  const src = fs.readFileSync(path.join(repo, 'hc-viz', 'data.js'), 'utf8');
  const w = {};
  new Function('window', src)(w);
  hc = w;
} catch (e) {
  fail(`hc-viz/data.js 读取或执行失败: ${e.message}`);
}
if (hc && hc.HC_ASOF) {
  const age = daysBetween(hc.HC_ASOF.checked);
  const line = `指标真源   checked ${hc.HC_ASOF.checked}  (${age} 天前)  官方 ${hc.HC_ASOF.official} / 当期 ${hc.HC_ASOF.current}`;
  if (age > 1) fail(line + '  ← 指标应每日核查，已过期');
  else console.log('  ' + line);
  if (hc.HC_CURRENT && daysBetween(hc.HC_CURRENT.released_at) > 60)
    warn(`当期数据发布已 ${daysBetween(hc.HC_CURRENT.released_at)} 天，确认是否有更新期次（如 1-10 月）未接入`);
}

/* ---------- 2. 页面是否还在自持受控数字 ---------- */
// 受控数字：一旦官方数据更新，这些值必然要跟着变。页面出现即代表"数据会变但页面不会自己变"。
const CONTROLLED = ['1203.33', '937.92', '805.68', '383.6', '159.78', '-37.1%', '10.8%', '+4.3%', '800亿'];
const ALLOWED = {
  'today.html': '有意保留的 2025 全年社零基数（情景拆分基于全年口径）',
  'who.html': '问答论据句（叙事文案，阶段5待动态化）',
  'blindspot.html': 'SVG 标签 + 一句文案（不参与计算）',
  'windtunnel.html': '模型假设依据文案（不参与计算）',
};

console.log('\n' + '-'.repeat(64));
console.log('页面自持数字扫描（数据更新后会不会自动跟随）');
console.log('-'.repeat(64));

const files = fs.readdirSync(repo).filter(f => f.endsWith('.html')).map(f => ({ f, p: path.join(repo, f) }));
const uiDir = path.join(repo, 'ui');
if (fs.existsSync(uiDir))
  fs.readdirSync(uiDir).filter(f => f.endsWith('.js')).forEach(f => files.push({ f: 'ui/' + f, p: path.join(uiDir, f) }));

let hits = 0;
for (const { f, p } of files) {
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  const found = [];
  lines.forEach((ln, i) => {
    const m = CONTROLLED.filter(c => ln.includes(c));
    if (m.length) found.push(`L${i + 1} [${m.join(',')}]`);
  });
  if (found.length) {
    hits += found.length;
    const tag = ALLOWED[f] ? '已登记：' + ALLOWED[f] : '未登记 ← 需重构线处理';
    console.log(`  ${f}: ${found.length} 处 · ${tag}`);
    found.slice(0, 6).forEach(x => console.log(`      ${x}`));
  }
}
if (!hits) console.log('  页面内无受控数字，全部走真源。');
else notes.push(`共 ${hits} 处页面自持数字；数据更新时这些位置不会自动跟随，需重构线按其自身节奏处理。`);

/* ---------- 3. 数据 → 消费者 矩阵 ---------- */
console.log('\n' + '-'.repeat(64));
console.log('数据源与消费者');
console.log('-'.repeat(64));
const consumers = {
  'hot.json / life.json（huicheng-intel，每日）': [],
  'data/relationship-*.json（huicheng-relations，每周）': [],
  'hc-viz/data.js（huicheng-data-audit，每日）': [],
};
for (const { f, p } of files) {
  if (!f.endsWith('.html')) continue;
  const s = fs.readFileSync(p, 'utf8');
  if (/hot\.json|life\.json|HCData\.intel/.test(s)) consumers['hot.json / life.json（huicheng-intel，每日）'].push(f);
  if (/relationship-|HCData\.relations|dataset\.js/.test(s)) consumers['data/relationship-*.json（huicheng-relations，每周）'].push(f);
  if (/hc-viz\/data\.js/.test(s)) consumers['hc-viz/data.js（huicheng-data-audit，每日）'].push(f);
}
for (const [k, v] of Object.entries(consumers))
  console.log(`  ${k}\n     → ${v.length ? v.join('、') : '（暂无页面读取）'}`);

/* ---------- 输出 ---------- */
console.log('\n' + '='.repeat(64));
warns.forEach(w => console.log('  [提示] ' + w));
notes.forEach(n => console.log('  [记录] ' + n));
if (fails.length) {
  console.log('\n数据过期或异常:');
  fails.forEach(f => console.log('  - ' + f));
  console.log('\n处置：intel / relations / audit 三个 Skill 各自补齐自己的数据源，不合并、不互相代写。');
  process.exit(1);
}
console.log('✅ 数据健康：三类数据均在时效内，结构合规');
