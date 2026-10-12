// 修复后逻辑复算：与 windtunnel.html 修复版代码逐行一致（SEED=42, N=10000）
const HT = require('./model.js');
const SEED = 42, N = 10000;
const effects = {delay:[0,40,90,180],invest:[0,50,110,170],export:[0,30,70,120],shen:[0,15,30,45],dragon:[0,50],commute:[0,60,120,190]};
const state = {delay:2,invest:1,export:1,shen:1,dragon:1,commute:1};
const names = {delay:'投产延期',invest:'招商不及预期',export:'外需走弱',shen:'融深变慢',dragon:'龙头扩产落空',commute:'通勤压力'};
function applyDrop(p,key,drop){
  if(drop<=0)return;
  if(key==='delay')p[0].mu=Math.max(0,p[0].mu-drop);
  else if(key==='invest')p[1].mu=Math.max(0,p[1].mu-drop);
  else if(key==='dragon')p[1].mu=Math.max(0,p[1].mu-drop);
  else if(key==='export')p[4].mu=Math.max(0,p[4].mu-drop);
  else if(key==='shen')p[4].mu=Math.max(0,p[4].mu-drop);
  else if(key==='commute'){p[3].mu=Math.max(0,p[3].mu-drop);p[0].mu=Math.max(0,p[0].mu-drop*0.3);}
}
function runTunnel(onlyKey){
  const p=JSON.parse(JSON.stringify(HT.DEFAULT_PATHS));
  if(onlyKey)applyDrop(p,onlyKey,effects[onlyKey][state[onlyKey]]);
  else Object.keys(state).forEach(k=>applyDrop(p,k,effects[k][state[k]]));
  return HT.run(SEED,N,p);
}
// —— 与修复版 HTML 一致 ——
const NO_SHOCK=HT.run(SEED,N,HT.DEFAULT_PATHS);
const BASE_HIT=NO_SHOCK.hit;
const BASE_P50=NO_SHOCK.p50;
console.log('无冲击基准 hit =', BASE_HIT.toFixed(2)+'%', ' P50 =', Math.round(BASE_P50)+'亿');
console.log('--- 修复后杀伤力排行（单项压力达标率下降）---');
const rows=Object.keys(state).map(k=>({k,drop:BASE_HIT-runTunnel(k).hit})).sort((a,b)=>b.drop-a.drop);
rows.forEach(r=>console.log('  '+names[r.k].padEnd(6),'-'+r.drop.toFixed(2)+'%'));
console.log('--- 修复后瀑布（六项全纳入，相邻边际）---');
const order=['delay','invest','export','shen','dragon','commute'];
const p=JSON.parse(JSON.stringify(HT.DEFAULT_PATHS));
let prev=BASE_HIT;
order.forEach(k=>{
  applyDrop(p,k,effects[k][state[k]]);
  const cur=HT.run(SEED,N,p).hit;
  console.log('  +'+names[k].padEnd(6),'边际 -'+(prev-cur).toFixed(2)+'%','累计',cur.toFixed(2)+'%');
  prev=cur;
});
console.log('--- future 次数文案 ---');
console.log('  达标约', Math.round(N*BASE_HIT/100).toLocaleString(), '次 /', N.toLocaleString(), '次，达标率', BASE_HIT.toFixed(1)+'%');
