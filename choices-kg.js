/* 惠城第⑤页 V4：逐层知识图谱，只读已有公开证据数据。不修改未来、风洞和报告。 */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const SVG="http://www.w3.org/2000/svg";
const h=(s)=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const PATHS=[
 {name:"新投产项目",color:"#f0c66d",icon:"▥",members:["gxq","jl","th","sh","rz","wr"],sources:["S004","S006"],lead:"从项目落地、开工到投产，看看公开记录走到了哪一步。"},
 {name:"三大产业集群",color:"#7db7fa",icon:"✦",members:["dz","xcl","sh","rz","wr","th"],sources:["S001","S010"],lead:"观察电子信息、新材料等产业集群与企业、项目的联系。"},
 {name:"AI与机器人",color:"#bfa0ff",icon:"⌘",members:["ai","lyh","gxq","sh","wr"],sources:["S014","S015","S017"],lead:"追踪AI、机器人产业方向及公开披露的主体和方案。"},
 {name:"生产性服务业",color:"#70e3c8",icon:"▤",members:["fw","hc","gxq","rj"],sources:["S001","S013"],lead:"了解企业服务、城市支撑与产业发展的公开记录。"},
 {name:"融深融湾",color:"#eda7c2",icon:"∞",members:["sz","dg","jt","hc","gxq","dz"],sources:["S001","S005","S010"],lead:"从深莞关联和交通配套理解区域协同，不虚构增量贡献。"}
];
const PEOPLE={
 job:{title:"我想找一份好工作",sub:"从项目、产业集群和AI相关规划进入",routes:[0,1,2],intro:"这些公开信息提示哪些产业受到关注，但不能直接预测岗位数量。",icon:"▣"},
 shop:{title:"我想做生意",sub:"从项目、制造集群和企业服务进入",routes:[0,1,3],intro:"产业活动可能关联经营机会，但不能据此保证客户或收入增加。",icon:"▤"},
 commute:{title:"我每天要通勤",sub:"从交通、项目和城市服务的联系进入",routes:[0,3,4],intro:"产业和交通互有关联，不能用这张图证明通勤改善造成经济增长。",icon:"↝"},
 city:{title:"惠城未来要怎样发展？",sub:"同时观察五条规划方向",routes:[0,1,2,3,4],intro:"从规划工作方向开始，再按来源追踪实际公开主体与关系。",icon:"◎"}
};
const DATES=["2026-03-31","2026-06-30","2026-08-31","2026-10-15","2026-10-30"];
const NAMES={investment:"项目投资",supply_chain:"产业与配套",transport:"交通",regional:"区域联系",tourism_consumption:"文旅消费",commute:"通勤",eco_constraint:"生态约束"};
let raw=null,nodes=new Map(),sources=new Map();
let persona="job",selected="q:job",tab="what",grade="A",date=DATES[4],expanded=new Set(),paths=new Set(),history=[];
let visible=[],links=[],points=new Map(),scale=1,shift={x:0,y:0},drag=null,seenNodes=new Set(),seenEdges=new Set();
let mobileDraw=false,drawPoints=points,activeEvent=null,eventRecords=[];
function isMobile(){return !!(window.matchMedia&&window.matchMedia("(max-width:620px)").matches);}
function focusDiagram(){
 // The mobile viewport uses its own 360×350 coordinate system, never scales a 1000px-wide map.
 const edge=links.find(x=>x.id===selected);
 const root=edge?edge.to:selected;
 const center=visible.find(x=>x.id===root)||visible[0];
 const neighbors=links.filter(x=>x.from===center.id||x.to===center.id)
  .sort((a,b)=>Number(b.type==="fact")-Number(a.type==="fact"))
  .map(e=>visible.find(n=>n.id===(e.from===center.id?e.to:e.from))).filter(Boolean);
 const chosen=[];for(const n of neighbors){if(!chosen.some(x=>x.id===n.id))chosen.push(n);if(chosen.length===2)break;}
 if(edge&&center.id!==edge.from&&!chosen.some(x=>x.id===edge.from)){
   const opposite=visible.find(n=>n.id===edge.from);if(opposite)chosen.splice(0,chosen.length===2?1:0,opposite);
 }
 const out=[center,...chosen.slice(0,2)],ids=new Set(out.map(n=>n.id)),local=new Map();
 local.set(center.id,{x:180,y:99});
 out.slice(1).forEach((n,i)=>local.set(n.id,{x:out.length===2?180:i===0?96:264,y:239}));
 return {nodes:out,edges:links.filter(e=>ids.has(e.from)&&ids.has(e.to)),positions:local};
}
function say(msg){$("kgToast").textContent=msg;$("kgToast").hidden=false;clearTimeout(say.timer);say.timer=setTimeout(()=>$("kgToast").hidden=true,2300);}
function hint(msg){$("kgHint").textContent=msg;$("kgHint").classList.add("show");clearTimeout(hint.timer);hint.timer=setTimeout(()=>$("kgHint").classList.remove("show"),3200);}
function record(){history.push({persona,selected,tab,grade,date,expanded:[...expanded],paths:[...paths]});if(history.length>30)history.shift();}
function hasSource(ids){return (ids||[]).some(id=>{const s=sources.get(id);return s&&String(s.published_at).slice(0,10)<=date;});}
function permitted(n){return n&&n.evidence_grade!=="C"&&(grade==="AB"||n.evidence_grade!=="B")&&hasSource(n.source_ids);}
function permittedEdge(e){return e&&e.evidence_grade!=="C"&&(grade==="AB"||e.evidence_grade==="A")&&hasSource(e.source_ids);}
function entityColor(n){return {enterprise:"#8bcff2",cluster:"#77dddb",anchor:"#92cfea",core:"#86dedc",infrastructure:"#f1d097",external:"#e9b2d4"}[n.node_type]||"#9bd3eb";}
function getNode(id){
 if(id.indexOf("q:")===0){const q=PEOPLE[id.slice(2)];return q?{id,name:q.title,type:"question",sub:"生活问题",icon:q.icon,color:"#83e6df"}:null;}
 if(id.indexOf("p:")===0){const p=PATHS[Number(id.slice(2))];return p?{id,name:p.name,type:"path",sub:"发展规划",icon:p.icon,color:p.color}:null;}
 if(id.indexOf("e:")===0){const n=nodes.get(id.slice(2));return n?Object.assign({},n,{id,type:"entity",sub:n.layer||"公开主体",icon:{enterprise:"▣",core:"◎",cluster:"✺",external:"↗",infrastructure:"⌁"}[n.node_type]||"◇",color:entityColor(n)}):null;}
 return null;
}
function makeGraph(){
 const shown=new Map(),edge=[];
 shown.set("q:"+persona,getNode("q:"+persona));
 const choices=[...new Set(PEOPLE[persona].routes.concat([...paths]))];
 choices.forEach(i=>{
  shown.set("p:"+i,getNode("p:"+i));
  if(PEOPLE[persona].routes.includes(i))edge.push({id:"guide:"+i,from:"q:"+persona,to:"p:"+i,type:"guide",title:"生活问题与规划方向",desc:"解释性探索入口，不是有独立证据证明的事实关系。",color:PATHS[i].color});
 });
 expanded.forEach(id=>{if(permitted(nodes.get(id)))shown.set("e:"+id,getNode("e:"+id));});
 paths.forEach(i=>PATHS[i].members.forEach(id=>{
  if(shown.has("e:"+id))edge.push({id:"member:"+i+":"+id,from:"p:"+i,to:"e:"+id,type:"guide",title:"方向归类",desc:"依据公开发展方向整理的路径关联，不代表政府核实的供应链或因果。",color:PATHS[i].color});
 }));
 raw.edges.forEach(e=>{
  if(permittedEdge(e)&&shown.has("e:"+e.source_node_id)&&shown.has("e:"+e.target_node_id))
   edge.push({id:"fact:"+e.edge_id,from:"e:"+e.source_node_id,to:"e:"+e.target_node_id,type:"fact",title:NAMES[e.relation_type]||e.relation_type,desc:e.relation_description,color:e.evidence_grade==="A"?"#76e5df":"#d8b77e",raw:e});
 });
 visible=[...shown.values()];links=edge;
}
function layout(){
 const pp=visible.filter(n=>n.type==="path"),en=visible.filter(n=>n.type==="entity");
 const q="q:"+persona;if(!points.has(q))points.set(q,{x:125,y:319});
 pp.forEach((n,i)=>{if(!points.has(n.id))points.set(n.id,{x:405,y:35+(i+1)*575/(pp.length+1)});});
 en.forEach((n,i)=>{
  if(points.has(n.id))return;
  const columns=en.length>8?2:1,rows=Math.ceil(en.length/columns),col=i%columns,row=Math.floor(i/columns);
  points.set(n.id,{x:columns===1?780:col?905:712,y:35+(row+1)*575/(rows+1)});
 });
}
function elem(tag,attrs,parent,text){
 const e=document.createElementNS(SVG,tag);
 Object.entries(attrs||{}).forEach(([k,v])=>e.setAttribute(k,String(v)));
 if(text!=null)e.textContent=text;
 if(parent)parent.appendChild(e);
 return e;
}
function geometry(a,b){
 const d=Math.hypot(b.x-a.x,b.y-a.y)||1,bend=Math.min(d*.1,35),m={x:(a.x+b.x)/2-(b.y-a.y)/d*bend,y:(a.y+b.y)/2+(b.x-a.x)/d*bend};
 return "M"+a.x+" "+a.y+" Q"+m.x+" "+m.y+" "+b.x+" "+b.y;
}
function paint(){
 makeGraph();layout();
 mobileDraw=isMobile();
 const focusGraph=mobileDraw?focusDiagram():null;
 const shownNodes=focusGraph?focusGraph.nodes:visible;
 const shownEdges=focusGraph?focusGraph.edges:links;
 drawPoints=focusGraph?focusGraph.positions:points;
 $("kgSvg").setAttribute("viewBox",mobileDraw?"0 0 360 350":"0 0 1000 650");
 if(mobileDraw){scale=1;shift={x:0,y:0};}
 $("kgEdges").replaceChildren();$("kgNodes").replaceChildren();
 shownEdges.forEach(e=>{
  const a=drawPoints.get(e.from),b=drawPoints.get(e.to),path=geometry(a,b),focus=selected===e.id||selected===e.from||selected===e.to;
  const isNew=!seenEdges.has(e.id);seenEdges.add(e.id);
  const g=elem("g",{"data-edge":e.id,"class":"kg-edge-group"+(isNew?" new-edge":"")+(e.raw&&activeEvent?.involved_edge_ids?.includes(e.raw.edge_id)?" event-touch":""),tabindex:0,role:"button","aria-label":"查看关系："+e.title},$("kgEdges"));
  elem("path",{d:path,"class":"kg-edge "+(e.type==="guide"?"illustrative ":"")+(focus?"active":""),stroke:e.color,"stroke-opacity":focus?.94:e.type==="guide"?.32:.54},g);
  elem("path",{d:path,"class":"kg-edge flow",stroke:e.color,"stroke-opacity":focus?.68:.25},g);
  elem("path",{d:path,"class":"kg-edge hit"},g);
 });
 shownNodes.forEach(n=>{
  const p=drawPoints.get(n.id),r=n.type==="question"?43:n.type==="path"?35:26,focus=n.id===selected;
  const isNew=!seenNodes.has(n.id);seenNodes.add(n.id);
  const g=elem("g",{"data-node":n.id,"class":"kg-node "+(focus?"active ":"")+(isNew?"new-node":"")+(n.type==="entity"&&activeEvent?.involved_node_ids?.includes(n.id.slice(2))?" event-touch":""),tabindex:0,role:"button","aria-label":"查看："+n.name,transform:"translate("+p.x+" "+p.y+")"},$("kgNodes"));
  elem("circle",{r:r+17,fill:n.color,"class":"kg-node-halo"},g);
  elem("circle",{r,stroke:n.color,"class":"kg-node-circle"},g);
  elem("text",{x:0,y:5,fill:n.color,"class":"kg-node-icon"},g,n.icon);
  elem("rect",{x:-73,y:r+7,width:146,height:42,rx:9,fill:"#081d31ed",stroke:n.color,"stroke-opacity":.65},g);
  elem("text",{x:0,y:r+23,"class":"kg-node-label"},g,n.name.length>11?n.name.slice(0,10)+"…":n.name);
  elem("text",{x:0,y:r+38,"class":"kg-node-sub"},g,n.sub);
  if(n.type==="entity"&&n.evidence_grade){
   elem("circle",{cx:r,cy:-r,r:10,fill:n.evidence_grade==="A"?"#197e78":"#926f47","class":"kg-pin"},g);
   elem("text",{x:r,y:-r+3,"font-size":10,"text-anchor":"middle",fill:"#fff"},g,n.evidence_grade);
  }
 });
 $("kgNodeCount").textContent=String(visible.filter(n=>n.type==="entity").length);
 $("kgEdgeCount").textContent=String(links.filter(e=>e.type==="fact").length);
 const rail=$("kgMobileNodes");
 rail.replaceChildren();
 visible.forEach(n=>{
  const b=document.createElement("button");
  b.type="button";
  b.textContent=n.name;
  b.className=n.type==="entity"?"fact":"";
  b.setAttribute("aria-pressed",String(selected===n.id));
  b.addEventListener("click",()=>focus(n.id));
  rail.appendChild(b);
 });
 const target=links.find(e=>e.id===selected)?.to||selected;
 $("kgFocusMeta").textContent=(mobileDraw?"手机聚焦 · ":"正在观察 · ")+(visible.find(n=>n.id===target)?.name||"惠城")+(mobileDraw?" · 其他节点在上方切换":"");
 transform();
}
function sourceCards(ids){
 const src=[...new Set(ids||[])].map(id=>sources.get(id)).filter(s=>s&&String(s.published_at).slice(0,10)<=date);
 if(!src.length)return '<div class="warning">当前日期之前没有对应的来源记录。可调整时间范围或查阅原始公告。</div>';
 return src.map(s=>{
  let url="";try{const parsed=new URL(s.url);if(["http:","https:"].includes(parsed.protocol))url=parsed.href}catch(e){}
  return '<div class="fact"><b>'+h(s.title)+'</b><small>'+h(s.publisher)+' · '+h(s.published_at)+' · '+h(s.source_type)+'</small>'+
    (url?'<a href="'+h(url)+'" target="_blank" rel="noopener noreferrer">打开原文 ↗</a>':"")+'</div>';
 }).join("");
}

function eventDate(c){let d=String(c.event_date||"");return /^\d{4}-\d{2}$/.test(d)?d+"-30":d.slice(0,10);}
function eventType(t){return ({new_entity:"主体出现",new_edge:"关系出现",strengthen:"关系增强",weaken:"关系减弱",exit:"退出",break:"关系断裂",alternative:"替代关系"})[t]||"结构变化";}
function eventAnchor(c){
 const edge=(c.involved_edge_ids||[]).map(id=>links.find(x=>x.id==="fact:"+id)).find(Boolean);
 if(edge)return edge.id;
 return (c.involved_node_ids||[]).map(x=>"e:"+x).find(id=>visible.some(n=>n.id===id))||"q:"+persona;
}
function renderEvents(){
 $("kgEventTotal").textContent=String(eventRecords.length);
 const rail=$("kgEventList");rail.replaceChildren();
 for(const c of eventRecords.slice().sort((a,b)=>eventDate(b).localeCompare(eventDate(a)))){
  const b=document.createElement("button");b.type="button";b.className="kg-event-card";
  b.disabled=eventDate(c)>date;b.setAttribute("aria-pressed",String(activeEvent?.change_id===c.change_id));
  b.innerHTML='<span class="kg-event-date">'+h(c.event_date)+' · '+h(eventType(c.change_type))+'</span>'+
    '<strong>'+h(c.title)+'</strong><span class="kg-event-foot"><span>公开变化记录</span><em>'+(b.disabled?"超出当前日期":"查看变化 ↗")+'</em></span>';
  b.addEventListener("click",()=>playEvent(c));rail.appendChild(b);
 }
 const panel=$("kgEventStory");
 if(!activeEvent||eventDate(activeEvent)>date){panel.hidden=true;panel.replaceChildren();return;}
 panel.hidden=false;
 const c=activeEvent,parts=String(c.before_after||"").split(/[；;]/),before=parts.find(p=>p.includes("此前"))||parts[0]||"原记录未注明",after=parts.find(p=>p.includes("此后"))||parts[1]||"查看原报道";
 const filtered=(c.involved_edge_ids||[]).map(id=>raw.edges.find(e=>e.edge_id===id)).filter(x=>x&&!permittedEdge(x)).length;
 const source=(c.source_ids||[]).map(id=>sources.get(id)).find(s=>s?.url);
 let link="";if(source){try{let u=new URL(source.url);if(["https:","http:"].includes(u.protocol))link='<a target="_blank" rel="noopener noreferrer" href="'+h(u.href)+'">查看原文 ↗</a>'}catch(e){}}
 panel.innerHTML='<div><h4>'+h(c.title)+'</h4><div class="kg-event-story-grid">'+
  '<div class="kg-event-step"><b>变化之前</b><p>'+h(before.replace(/^此前[:：]?/,""))+'</p></div>'+
  '<div class="kg-event-step"><b>公开记录的新状态</b><p>'+h(after.replace(/^此后[:：]?/,""))+'</p></div>'+
  '<div class="kg-event-step"><b>仍有不确定性</b><p>'+h(c.uncertainty||"后续进展需核实")+(filtered?"；"+filtered+" 条关联不符合当前证据等级。":"")+'</p></div></div></div>'+
  '<div class="kg-event-story-actions">'+link+'<button type="button" id="kgInspectEvent">追踪图中关系 ↗</button></div>';
 $("kgInspectEvent").addEventListener("click",()=>{
  tab="proof";inspect();
  if(window.matchMedia?.("(max-width:875px)").matches&&$("kgDetailTitle").scrollIntoView)$("kgDetailTitle").scrollIntoView({behavior:"smooth",block:"center"});
 });
}
function playEvent(c){
 if(eventDate(c)>date)return say("该事件超出当前日期");
 record();activeEvent=c;
 // Reveal only already recorded entities. Do not create new edges from event descriptions.
 let added=0;
 for(const id of c.involved_node_ids||[]){if(added>=2)break;if(!expanded.has(id)&&permitted(nodes.get(id))){expanded.add(id);added++;}}
 const edge=(c.involved_edge_ids||[]).map(id=>raw.edges.find(e=>e.edge_id===id)).find(e=>permittedEdge(e));
 if(edge){for(const id of [edge.source_node_id,edge.target_node_id])if(permitted(nodes.get(id)))expanded.add(id);}
 selected="q:"+persona;tab="what";render();
 selected=eventAnchor(c);render();
 hint("定位事件："+c.title+"。亮起的关系仅代表公开记录，不代表因果推断。");
}

function selectedItem(){
 return {edge:links.find(e=>e.id===selected),node:getNode(selected)};
}
function related(){
 const item=selectedItem(),e=item.edge,n=item.node;
 if(e)return [e.from,e.to].map(id=>{const t=getNode(id);return t?'<button class="link-btn" data-open="'+h(id)+'">'+h(t.name)+' <span>查看 ↗</span></button>':""}).join("");
 if(!n)return "";
 const arr=links.filter(l=>l.from===n.id||l.to===n.id);
 return arr.length?arr.map(l=>{const t=getNode(l.from===n.id?l.to:l.from);return t?'<button class="link-btn" data-open="'+h(t.id)+'">'+h(t.name)+' <span>'+(l.type==="fact"?"有来源":"示意")+' ↗</span></button>':""}).join(""):'<div class="muted">尚无已展开的邻居，点击下方按钮继续。</div>';
}
function explanation(){
 const o=selectedItem(),e=o.edge,n=o.node;
 if(e){
  if(e.type==="guide")return '<div class="section">这条虚线的含义</div><div class="bullet">'+h(e.desc)+'</div><div class="warning">这是体验用的方向关联，不是经济因果或已核实的企业交易关系。</div>';
  const r=e.raw;
  return '<div class="section">公开记录中的关系</div><div class="bullet">'+h(r.relation_description)+'</div>'+
   (r.metric?'<div class="fact"><b>'+h(r.metric.metric_name)+"："+h(r.metric.metric_value)+h(r.metric.metric_unit)+'</b><small>数字为原有公开证据字段，应核对原文口径。</small></div>':"")+
   (r.counter_evidence?'<div class="warning">待核实：'+h(r.counter_evidence)+'</div>':"");
 }
 if(n.type==="question")return '<div class="section">从你关心的事情开始</div><div class="bullet">'+h(PEOPLE[persona].intro)+'</div><div class="muted">点规划路径，真实主体会逐步出现；再点实体或连线，就能查看证据。</div>';
 if(n.type==="path")return '<div class="section">政府发展方向</div><div class="bullet">'+h(PATHS[+n.id.slice(2)].lead)+'</div><div class="warning">路径和主体的归类是理解性示意，不是官方主体名录。</div>';
 return '<div class="section">公开资料怎么描述它</div><div class="bullet">'+h(n.description||"资料中未提供描述")+'</div>'+
  (n.stat?'<div class="fact"><b>'+h(n.stat)+'</b><small>原证据库字段；请到来源核对日期和口径。</small></div>':"")+
  '<div class="muted">'+h(n.layer)+' · '+h(n.node_type)+' · '+h(n.town||"位置未注明")+'</div>';
}
function provenance(){
 const o=selectedItem(),n=o.node,e=o.edge;
 if(e){
  if(e.type==="guide")return '<div class="warning">解释性虚线没有独立的事实关系来源。不能把它当成政府认可的供应链或真实因果。</div>';
  return '<div class="section">关系记录 · 证据'+h(e.raw.evidence_grade)+'级</div><div class="muted">'+h(e.raw.edge_id)+' · '+h(e.raw.evidence_type)+'</div>'+sourceCards(e.raw.source_ids)+
   (e.raw.strength_basis?'<div class="warning">资料依据：'+h(e.raw.strength_basis)+'</div>':"");
 }
 if(n.type==="question")return '<div class="warning">生活问题仅用于进入规划图谱，不是政府规划的正式因果关系。</div>';
 if(n.type==="path")return '<div class="section">规划方向的相关公开来源</div>'+sourceCards(PATHS[+n.id.slice(2)].sources)+'<div class="muted">只作为公开资料入口，不代表规划文件的完整内容。</div>';
 return '<div class="section">主体的公开来源</div>'+sourceCards(n.source_ids)+'<div class="muted">主体A级并不代表它的每条关系都是A级。</div>';
}
function neighbors(id){
 const n=getNode(id);if(!n)return [];
 if(n.type==="path")return PATHS[+id.slice(2)].members.filter(x=>!expanded.has(x)&&permitted(nodes.get(x)));
 if(n.type!=="entity")return [];
 const found=new Set();
 raw.edges.forEach(e=>{
  if(!permittedEdge(e))return;
  if(e.source_node_id===id.slice(2))found.add(e.target_node_id);
  if(e.target_node_id===id.slice(2))found.add(e.source_node_id);
 });
 return [...found].filter(x=>!expanded.has(x)&&permitted(nodes.get(x)));
}
function inspect(){
 let {edge,node}=selectedItem();
 if(!edge&&!node){selected="q:"+persona;node=getNode(selected)}
 $("kgSelectedType").textContent=edge?(edge.type==="fact"?"有来源关系":"示意关系"):node.type==="question"?"生活问题":node.type==="path"?"规划方向":"公开主体";
 $("kgHeroIcon").textContent=edge?"↝":node.icon;
 $("kgHeroIcon").style.color=edge?edge.color:node.color;
 $("kgDetailTitle").textContent=edge?edge.title:node.name;
 $("kgDetailLead").textContent=edge?edge.desc:node.type==="question"?PEOPLE[persona].intro:node.type==="path"?PATHS[+node.id.slice(2)].lead:node.description||"点击关系线了解来源。";
 const labels=edge?[edge.type==="fact"?"证据 "+edge.raw.evidence_grade+" 级":"解释性示意"]:node.type==="path"?["政府规划方向","不是模拟参数"]:node.type==="entity"?[node.layer,node.evidence_grade+"级主体"]:["生活问题"];
 $("kgMeta").innerHTML=labels.filter(Boolean).map(x=>'<span>'+h(x)+'</span>').join("");
 document.querySelectorAll(".kg-aside-tabs button").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tab===tab)));
 $("kgDetailBody").innerHTML=tab==="what"?explanation():tab==="links"?related():provenance();
 $("kgDetailBody").querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>focus(b.dataset.open)));
 const extra=edge?[]:neighbors(node.id),button=$("kgExpand");
 button.disabled=!!edge||node.type!=="question"&&!extra.length;
 button.firstChild.textContent=edge?"查看证据来源":node.type==="question"?"请选择一个规划路径":extra.length?"发现下一条关系 · 还有 "+extra.length+" 个":"当前无更多邻居";
 button.querySelector("span").textContent=button.disabled?"✓":"↗";
}
function controls(){
 document.querySelectorAll("[data-persona]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.persona===persona)));
 document.querySelectorAll("[data-grade]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.grade===grade)));
 $("kgSceneTitle").textContent=PEOPLE[persona].title;$("kgSceneSub").textContent=PEOPLE[persona].sub;
 $("kgDate").value=String(DATES.indexOf(date));$("kgDateLabel").textContent="截至 "+date;
 $("kgBack").disabled=!history.length;
}
function render(){
 paint();
 // The selected edge/entity may disappear when evidence tier or source cutoff changes.
 // Never render an inspector for a filtered-out relation.
 if(!visible.some(n=>n.id===selected)&&!links.some(e=>e.id===selected)){
  selected="q:"+persona;tab="what";paint();
 }
 inspect();controls();renderEvents();
}
function expand(id){
 const n=getNode(id);if(!n||n.type==="question"){hint("请点一条发光的规划路径");return}
 if(n.type==="path")paths.add(+id.slice(2));
 const extra=neighbors(id);if(extra.length)expanded.add(extra[0]);
 render();hint(extra.length?"新发现："+(nodes.get(extra[0])?.name||"公开主体")+"；继续点击探索下一条关系":"当前条件下没有更多可展开的主体");
}
function focus(id){
 if(id.indexOf("e:")===0&&!expanded.has(id.slice(2))){
  if(!permitted(nodes.get(id.slice(2))))return say("不符合当前证据或时间筛选");
  record();expanded.add(id.slice(2));
 }
 if(id!==selected)record();activeEvent=null;selected=id;tab="what";
 const n=getNode(id);
 if(n&&n.type==="path"&&!paths.has(+id.slice(2)))expand(id);
 else render();
}
function focusEdge(id){if(!links.some(l=>l.id===id))return;record();activeEvent=null;selected=id;tab="what";render();}
function changePersona(key){
 if(!PEOPLE[key]||key===persona)return;
 persona=key;selected="q:"+key;tab="what";expanded.clear();paths.clear();points.clear();seenNodes.clear();seenEdges.clear();history=[];activeEvent=null;scale=1;shift={x:0,y:0};render();hint("点规划路径，每次发现一个有来源的主体");
}
function undo(){
 if(!history.length)return;const prev=history.pop();
 persona=prev.persona;selected=prev.selected;tab=prev.tab;grade=prev.grade;date=prev.date;expanded=new Set(prev.expanded);paths=new Set(prev.paths);render();
}
function transform(){$("kgViewport").setAttribute("transform","translate("+shift.x+" "+shift.y+") scale("+scale+")");$("kgZoomLabel").textContent=Math.round(scale*100)+"%";}
function point(event){const m=$("kgSvg").getScreenCTM();if(!m)return null;const p=$("kgSvg").createSVGPoint();p.x=event.clientX;p.y=event.clientY;return p.matrixTransform(m.inverse());}
function zoomTo(next,at){if(mobileDraw)return say("手机已自动聚焦，可点击上方节点切换");const old=scale;scale=Math.max(.62,Math.min(1.9,next));at=at||{x:500,y:320};shift.x+=at.x*(old-scale);shift.y+=at.y*(old-scale);transform();}
const svg=$("kgSvg");
svg.addEventListener("pointerdown",e=>{
 if(e.button!=null&&e.button!==0)return;
 const target=e.target.closest("[data-node],[data-edge]"),p=point(e);if(!p)return;
 drag={id:e.pointerId,type:target?.dataset.node?"node":target?.dataset.edge?"edge":"pan",key:target?.dataset.node||target?.dataset.edge||"",first:p,last:p,moved:false};
 svg.setPointerCapture(e.pointerId);
});
svg.addEventListener("pointermove",e=>{
 if(!drag||drag.id!==e.pointerId)return;const p=point(e);if(!p)return;
 if(Math.hypot(p.x-drag.first.x,p.y-drag.first.y)>6)drag.moved=true;
 if(!drag.moved)return;
 if(drag.type==="node"&&!mobileDraw){
  const n=drawPoints.get(drag.key);if(!n)return;n.x=Math.max(80,Math.min(920,n.x+(p.x-drag.last.x)/scale));n.y=Math.max(55,Math.min(555,n.y+(p.y-drag.last.y)/scale));paint();
 }else if(drag.type==="pan"&&!mobileDraw){shift.x+=p.x-drag.last.x;shift.y+=p.y-drag.last.y;transform();}
 drag.last=p;
});
svg.addEventListener("pointerup",e=>{
 if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;
 if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);
 if(!d.moved){if(d.type==="node")focus(d.key);else if(d.type==="edge")focusEdge(d.key)}
});
svg.addEventListener("pointercancel",()=>drag=null);
svg.addEventListener("wheel",e=>{if(mobileDraw)return;e.preventDefault();zoomTo(scale*(e.deltaY>0?.9:1.1),point(e))},{passive:false});
svg.addEventListener("keydown",e=>{if(!["Enter"," "].includes(e.key))return;const target=e.target.closest("[data-node],[data-edge]");if(!target)return;e.preventDefault();if(target.dataset.node)focus(target.dataset.node);else focusEdge(target.dataset.edge);});
document.querySelectorAll("[data-persona]").forEach(b=>b.addEventListener("click",()=>changePersona(b.dataset.persona)));
document.querySelectorAll("[data-grade]").forEach(b=>b.addEventListener("click",()=>{if(grade===b.dataset.grade)return;record();grade=b.dataset.grade;render();hint(grade==="AB"?"B级关系为推断，并不等于已证实":"只显示A级事实边");}));
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{tab=b.dataset.tab;inspect();}));
$("kgDate").addEventListener("input",e=>{const value=DATES[+e.target.value];if(value===date)return;record();date=value;render();hint("此处按来源发布日期筛选，不等于历史快照");});
$("kgExpand").addEventListener("click",()=>{record();expand(selected);});
$("kgBack").addEventListener("click",undo);
$("kgHome").addEventListener("click",()=>{expanded.clear();paths.clear();history=[];points.clear();seenNodes.clear();seenEdges.clear();selected="q:"+persona;tab="what";activeEvent=null;scale=1;shift={x:0,y:0};render();hint("已重新开始探索");});
$("kgFit").addEventListener("click",()=>{scale=1;shift={x:0,y:0};transform();say("视图已居中");});
$("kgPlus").addEventListener("click",()=>zoomTo(scale*1.2));
$("kgMinus").addEventListener("click",()=>zoomTo(scale/1.2));
function copied(text){
 if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text).then(()=>say("已复制分享链接")).catch(()=>fallback(text));
 fallback(text);
}
function fallback(text){const t=document.createElement("textarea");t.value=text;t.style.position="fixed";t.style.left="-9999px";document.body.appendChild(t);t.select();let ok=false;try{ok=document.execCommand("copy")}catch(e){}t.remove();say(ok?"已复制链接":"请使用浏览器自带分享功能");}
$("kgShare").addEventListener("click",()=>{
 const url=new URL(location.href);url.hash=new URLSearchParams({persona,selected,grade,date,paths:[...paths].join(","),entities:[...expanded].join(",")}).toString();
 copied("惠城规划知识图谱 · 当前探索\n"+url.href+"\n虚线为解释性示意，并非已证明的因果。");
});
function shareState(){
 const p=new URLSearchParams(location.hash.slice(1));
 if(PEOPLE[p.get("persona")])persona=p.get("persona");
 if(["A","AB"].includes(p.get("grade")))grade=p.get("grade");
 if(DATES.includes(p.get("date")))date=p.get("date");
 paths=new Set(String(p.get("paths")||"").split(",").filter(s=>/^[0-4]$/.test(s)).map(Number));
 expanded=new Set(String(p.get("entities")||"").split(",").filter(id=>nodes.has(id)));
 const wanted=p.get("selected");
 if(wanted==="q:"+persona||/^p:[0-4]$/.test(wanted)||wanted?.startsWith("e:")&&expanded.has(wanted.slice(2)))selected=wanted;
 else selected="q:"+persona;
}
function background(){
 const c=$("kgCity"),w=Math.max(1,c.clientWidth),hh=Math.max(1,c.clientHeight),dpr=Math.min(window.devicePixelRatio||1,2),ctx=c.getContext("2d");c.width=w*dpr;c.height=hh*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 const gradient=ctx.createLinearGradient(0,0,w,hh);gradient.addColorStop(0,"#07192e");gradient.addColorStop(.52,"#11405a");gradient.addColorStop(1,"#071729");ctx.fillStyle=gradient;ctx.fillRect(0,0,w,hh);
 let seed=82921;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<1000;i++){const x=rand()*w,y=rand()*hh;if(rand()>.4)continue;ctx.fillStyle=rand()<.7?"#e5b36b2a":"#7bd2f02a";ctx.fillRect(x,y,2+rand()*8,1+rand()*6);}
 for(let i=0;i<22;i++){const x=i*w/20;ctx.beginPath();ctx.moveTo(x-50,0);ctx.bezierCurveTo(x+35,hh*.3,x-25,hh*.7,x+50,hh);ctx.strokeStyle=i%4===0?"#5cbccb3c":"#9b9b8530";ctx.lineWidth=i%4===0?2:1;ctx.stroke();}
 ctx.beginPath();ctx.moveTo(-20,hh*.7);ctx.bezierCurveTo(w*.24,hh*.5,w*.48,hh*.79,w*.75,hh*.44);ctx.bezierCurveTo(w*.89,hh*.29,w*.97,hh*.43,w+20,hh*.3);ctx.strokeStyle="#20afd437";ctx.lineWidth=30;ctx.stroke();ctx.strokeStyle="#88e6e681";ctx.lineWidth=2;ctx.stroke();
}
let timer;window.addEventListener("resize",()=>{clearTimeout(timer);timer=setTimeout(()=>{background();if(raw)render()},150);});
async function load(){
 $("kgEmpty").hidden=true;$("kgExpand").disabled=true;
 try{
  const filenames=["data/relationship-evidence-v1.json","data/relationship-sources-v1.json","data/relationship-changes-v1.json"];
  const requests=await Promise.all(filenames.map(f=>fetch(f+"?kg=v41",{cache:"no-store"})));
  if(requests.some(r=>!r.ok))throw Error("证据文件读取失败");
  const [e,s,c]=await Promise.all(requests.map(r=>r.json()));
  if(!Array.isArray(e.nodes)||!Array.isArray(e.edges)||!Array.isArray(s.sources)||!Array.isArray(c.changes))throw Error("证据结构不符合预期");
  raw=e;eventRecords=c.changes;nodes=new Map(e.nodes.map(n=>[n.node_id,n]));sources=new Map(s.sources.map(x=>[x.source_id,x]));
  shareState();render();hint("点击发光的规划路径，让已有证据主体逐层出现");
 }catch(err){
  $("kgEmpty").hidden=false;$("kgDetailTitle").textContent="证据暂不可用";$("kgDetailLead").textContent="无法读取公开数据，请检查网络后重试。";$("kgDetailBody").textContent=String(err.message||err);$("kgExpand").disabled=true;
 }
}
$("kgRetry").addEventListener("click",load);
background();load();
})();
