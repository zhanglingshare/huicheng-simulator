#!/usr/bin/env node
/**
 * check_contracts.js — 校验三类契约文件，判据见 docs/change-rubric.md
 *   1) 关系三件套：changes / evidence / sources
 *   2) 模型验算：model-verify-v1.json
 * 用法：node tests/check_contracts.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let bad = 0;
const ok = (m) => console.log('  ✓ ' + m);
const ng = (m) => { console.log('  ✗ ' + m); bad++; };

function load(p) {
  const full = path.join(ROOT, p);
  if (!fs.existsSync(full)) { ng(p + ' 不存在'); return null; }
  try { return JSON.parse(fs.readFileSync(full, 'utf8')); }
  catch (e) { ng(p + ' JSON 解析失败: ' + e.message); return null; }
}

console.log('1) 关系三件套');
const chg = load('data/relationship-changes-v1.json');
const evi = load('data/relationship-evidence-v1.json');
const src = load('data/relationship-sources-v1.json');
const CHANGE_TYPES = ['new_entity', 'new_edge', 'strengthen', 'weaken', 'exit', 'break', 'alternative'];

if (chg) {
  ['schema_version', 'region', 'generated_at', 'count'].forEach((k) =>
    chg[k] === undefined ? ng('changes 缺字段 ' + k) : null);
  const items = chg.changes || chg.items || [];
  if (!Array.isArray(items) || items.length === 0) ng('changes 无变更条目');
  else {
    if (items.length !== chg.count) ng('changes.count 与条目数不一致');
    items.forEach((it, i) => {
      if (!it.change_id) ng(`changes[${i}] 缺 change_id`);
      if (!CHANGE_TYPES.includes(it.change_type)) ng(`changes[${i}] change_type 非法: ${it.change_type}`);
      if (!(it.involved_node_ids || []).length && !(it.involved_edge_ids || []).length) ng(`changes[${i}] 未挂节点或边`);
      if (!it.event_date) ng(`changes[${i}] 缺 event_date`);
    });
    ok(`changes ${items.length} 条，类型与挂载齐`);
  }
}
if (evi) {
  const nodes = evi.nodes || [];
  const edges = evi.edges || [];
  if (!nodes.length) ng('evidence 无节点');
  else ok(`evidence 节点 ${nodes.length} 个、边 ${edges.length} 条`);
  edges.forEach((e, i) => {
    if (!e.edge_id) ng(`edges[${i}] 缺 edge_id`);
    if (!e.source_node_id || !e.target_node_id) ng(`edges[${i}] 缺 source/target_node_id`);
    if (!e.relation_type) ng(`edges[${i}] 缺 relation_type`);
    if (!e.evidence_type) ng(`edges[${i}] 缺 evidence_type`);
  });
  const nodeIds = new Set(nodes.map((n) => n.node_id));
  edges.forEach((e, i) => {
    if (!nodeIds.has(e.source_node_id)) ng(`edges[${i}] 起点未在节点表: ${e.source_node_id}`);
    if (!nodeIds.has(e.target_node_id)) ng(`edges[${i}] 终点未在节点表: ${e.target_node_id}`);
  });
}
if (src && (!src.sources || !src.sources.length)) ng('sources 为空');

console.log('2) 模型验算');
const mv = load('data/model-verify-v1.json');
if (mv) {
  ['schema_version', 'region', 'generated_at', 'model', 'inputs', 'backtest'].forEach((k) =>
    mv[k] === undefined ? ng('model-verify 缺字段 ' + k) : null);
  if (mv.model && !mv.model.version) ng('model 缺 version');
  (mv.inputs || []).forEach((it, i) => {
    if (!it.k || it.v === undefined || !it.src) ng(`inputs[${i}] 缺 k/v/src`);
  });
  const KINDS = ['sim', 'dist', 'struct'];
  (mv.outputs || []).forEach((o, i) => {
    if (!KINDS.includes(o.kind)) ng(`outputs[${i}] kind 非法`);
    if (o.not_forecast !== true) ng(`outputs[${i}] 缺 not_forecast:true`);
    if (!o.assump) ng(`outputs[${i}] 缺假设`);
  });
  (mv.backtest || []).forEach((b, i) => {
    if (b.actual === undefined) ng(`backtest[${i}] 缺实际值`);
    if (!b.threshold_pct) ng(`backtest[${i}] 缺阈值`);
    if (!['ok', 'watch', 'recalibrate', '待接入'].includes(b.status)) ng(`backtest[${i}] status 非法`);
    if (b.status === '待接入' && b.modeled !== null) ng(`backtest[${i}] 待接入却给了 modeled`);
  });
  ok(`model-verify：输入 ${(mv.inputs || []).length} 项、输出 ${(mv.outputs || []).length} 项、回测 ${(mv.backtest || []).length} 项`);
}

console.log(bad === 0 ? '\n全部通过' : `\n${bad} 项不通过`);
process.exit(bad === 0 ? 0 : 1);
