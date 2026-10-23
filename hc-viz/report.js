(function(){
const $=id=>document.getElementById(id);let key=initialScene();
const bs=$('buildings');for(let i=0;i<26;i++){let b=document.createElement('i');b.className='b';b.style.setProperty('--h',(37+(i*53+i*i*7)%126)+'px');bs.appendChild(b)}
$('kpis').innerHTML=HC_OFFICIAL.metrics.map((m,i)=>`<button class="kpi ${m.status}" data-index="${i}" type="button"><div class="k">${m.k}</div><div class="v">${m.v}</div><div class="note">${m.detail}</div></button>`).join('');
// Do not display invented historical sparklines; cards show verified values only.
$('kpis').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{let m=HC_OFFICIAL.metrics[+b.dataset.index];$('detail').innerHTML=`<b>${m.k} · ${m.v}</b> — ${m.note} <a target="_blank" rel="noopener" href="${HC_SOURCE}">核对官方原文 ↗</a>`}));
$('detail').innerHTML='已核对惠城区2025年官方数据。规上工业总产值与增加值是两种不同口径；点击指标查看。';
$('sceneChips').innerHTML=Object.keys(SCENES).map(k=>`<button type="button" class="chip ${k===key?'active':''}" data-key="${k}">${SCENES[k].name}</button>`).join('');
const row=$('scenarioCards');
row.innerHTML=Object.keys(SCENES).map(k=>{let d=stateLabels(k);return `<button class="scenario-tile ${k==='base'?'baseline':''}" data-key="${k}"><div class="scenario-caption">${SCENES[k].name}</div><div class="scenario-metrics"><strong>${d.hit}</strong><b>${d.p50}<small>亿元</small></b></div><div class="scenario-sub">P10—P90　${d.p10}—${d.p90}亿</div></button>`}).join('');
row.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{key=b.dataset.key;saveScene(key);redraw()}));

const base=getScene('base');const redraw=()=>{let r=getScene(key),d=stateLabels(key);row.querySelectorAll('button').forEach(c=>c.classList.toggle('selected',c.dataset.key===key));$('sceneChips').querySelectorAll('.chip').forEach(c=>c.classList.toggle('active',c.dataset.key===key));$('hit').textContent=d.hit;$('p50').textContent=d.p50;$('interval').textContent=d.p10+' — '+d.p90;
let dh=r.hit-base.hit,dp=r.p50-base.p50;$('hitChange').textContent=key==='base'?'模型基准':`${dh<0?'下降':'上升'} ${Math.abs(dh).toFixed(1)} 个百分点`;
$('deltaHit').textContent=key==='base'?'基准':`${dh>0?'+':''}${dh.toFixed(1)} pp`;$('deltaP50').textContent=key==='base'?'基准':`${dp>0?'+':''}${fmt(dp)} 亿`;
$('toEnding').href=makeUrl('ending.html',key);$('bottomLink').href=makeUrl('ending.html',key);drawTrajectory($('trajectory'),r);drawDists($('dist'),base,r)};
$('sceneChips').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{key=b.dataset.key;saveScene(key);$('sceneChips').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));redraw()}));
$('copyText').onclick=()=>{let r=getScene(key);let str=`惠城产业风洞【${SCENES[key].name}】｜2030模型达标比例 ${r.hit.toFixed(1)}%，中位产值 ${fmt(r.p50)}亿元，P10-P90 ${fmt(r.p10)}—${fmt(r.p90)}亿元；与基准变化 ${(r.hit-base.hit).toFixed(1)} 个百分点。模型情景，非现实预测。`;if(navigator.clipboard)navigator.clipboard.writeText(str).then(()=>toast('实验摘要已复制')).catch(()=>window.prompt('复制实验摘要',str));else window.prompt('复制实验摘要',str)};
$('downloadCSV').onclick=()=>{let body='情景,scene,达标比例%,P10亿元,P50亿元,P90亿元\n'+perfCSV();let blob=new Blob(['\uFEFF'+body],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='惠城V1_四情景运行结果.csv';a.click();URL.revokeObjectURL(url)};
function toast(msg){let el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),1800)}
$('sensitivity').addEventListener('toggle',function(){if(!this.open)return;let names=HT.DEFAULT_PATHS.map(p=>p.name);let items=names.map((name,i)=>{let diff=[];for(let m of [.8,1.2]){let paths=JSON.parse(JSON.stringify(HT.DEFAULT_PATHS));paths[i].mu*=m;let v=HT.run(SEED,N,paths).hit-base.hit;diff.push(v)}return{name,lo:diff[0],hi:diff[1]}});drawSensitivity($('sensChart'),items)});
window.addEventListener('resize',redraw);redraw();
})();
