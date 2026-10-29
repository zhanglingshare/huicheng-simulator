/* 惠城第五页：五条公开规划发展路径的关系体验
 * 本文件仅驱动可视化与交互，不调用/修改 model.js 或第六至第十页的计算。
 * 路径联系均为解读性示意。事件、数字按发布日期标注，随政府公开更新须核对。
 */
(()=>{
"use strict";
const PATHS=[
 {key:"projects",number:"01",name:"新投产项目",short:"项目带动",tag:"项目建设 / 投产达效",icon:"🏭",symbol:"▥",color:"#f6c35a",
  lead:"让重大产业项目从建设走向投产，形成实实在在的产出能力。",
  points:["加快重大产业项目建设与投产达效","推动项目建设、用地保障与产业配套衔接","持续关注项目进度与实际形成产出的时间差"],
  evidence:[{label:"2025 年部署",text:"惠城区提出新投产产业项目100宗以上等年度工作目标。",source:"惠州新闻网 · 2025-03-28"},{label:"2026 年部署",text:"当地公开报道提出全年摘牌落地项目不少于30宗等招商目标。",source:"南方+ · 2026-02-25"}],
  related:[{id:1,why:"新项目需要本地集群配套"},{id:3,why:"项目落地依赖研发、物流等服务"},{id:4,why:"跨区域协作可能支持项目导入"}],
  tags:["项目建设","产出形成","用地配套"],
  links:[{label:"2025年政府工作安排相关报道",url:"https://www.hznews.com/xqrm/hcq/202503/t20250328_1612092.shtml"},{label:"2026年招商部署公开报道",url:"https://pc.nfnews.com/9483/12190988.html"}]},
 {key:"clusters",number:"02",name:"三大产业集群",short:"集群扩能",tag:"电子信息 / 先进装备 / 新能源新材料",icon:"⚙️",symbol:"⚙",color:"#6aaeff",
  lead:"强化既有产业集群，向更完整的配套和更高的价值链环节延伸。",
  points:["以电子信息、先进装备、新能源新材料为重点方向","围绕企业成长、数字化转型和产业链配套提升集聚水平","推动集群规模与创新能力共同提升"],
  evidence:[{label:"产业方向",text:"2025年惠城有关会议公开报道明确提出电子信息、先进装备、新能源新材料为主攻方向。",source:"惠州新闻网 · 2025-03-28"},{label:"2026 年部署",text:"公开报道指出，惠城将推动三大产业集群向中高端发展，推进企业数字化转型。",source:"南方+ · 2026-02-25"}],
  related:[{id:0,why:"项目投产是集群扩能的重要载体"},{id:2,why:"AI应用与制造升级可以相互促进"},{id:3,why:"工业设计、物流与金融服务支持集群发展"}],
  tags:["电子信息","先进装备","新能源新材料"],
  links:[{label:"惠城2025年发展部署",url:"https://www.hznews.com/xqrm/hcq/202503/t20250328_1612092.shtml"},{label:"三大产业集群最新部署报道",url:"https://pc.nfnews.com/9483/12190988.html"}]},
 {key:"ai",number:"03",name:"AI与机器人",short:"技术赋能",tag:"新赛道 / AI+制造",icon:"🤖",symbol:"▣",color:"#b591ff",
  lead:"把人工智能应用与机器人产业作为新赛道，链接制造基础和应用场景。",
  points:["推进人工智能与机器人产业发展","推广AI+应用场景与人工智能赋能制造","加强新技术、新产品、新场景的协同培育"],
  evidence:[{label:"公开报道",text:"惠城区负责人于2026年2月公开介绍，2025年AI与机器人产业产值约120亿元。",source:"南方+ · 2026-02-25"},{label:"政策安排",text:"惠城提出打造一批AI+应用示范场景，深入推进人工智能+制造。",source:"南方+ · 2026-02-25"}],
  related:[{id:1,why:"技术应用需要制造业场景与配套"},{id:3,why:"软件信息、研发服务与AI产业互相联系"},{id:0,why:"创新项目可形成新的产业落地需求"}],
  tags:["AI+制造","机器人","应用场景"],
  links:[{label:"惠城AI与机器人产业发展报道",url:"https://pc.nfnews.com/9483/12190988.html"}]},
 {key:"services",number:"04",name:"生产性服务业",short:"服务支撑",tag:"金融 / 软件信息 / 物流 / 设计",icon:"🏢",symbol:"▤",color:"#5ee2c5",
  lead:"让金融、软件、现代物流、工业设计等生产性服务更好支持制造业。",
  points:["推动生产性服务业倍增与产业融合","发展金融服务、软件信息、现代物流和工业设计等领域","支持制造企业的技术、供应链与市场能力"],
  evidence:[{label:"公开披露",text:"2026年2月报道提及全区规上生产性服务业企业846家，上一年增加值337亿元。",source:"南方+ · 2026-02-25"},{label:"2026 年部署",text:"惠城将实施生产性服务业倍增计划，把这一领域作为发展的主攻方向之一。",source:"南方+ · 2026-02-25"}],
  related:[{id:0,why:"项目落地需要融资、设计及物流配套"},{id:1,why:"产业集群发展离不开服务网络"},{id:2,why:"软件与技术服务可以支撑AI应用"},{id:4,why:"跨区域经营离不开专业服务与要素流动"}],
  tags:["金融服务","软件信息","现代物流","工业设计"],
  links:[{label:"惠城生产性服务业公开报道",url:"https://pc.nfnews.com/9483/12190988.html"}]},
 {key:"regional",number:"05",name:"融深融湾",short:"区域协同",tag:"湾区联系 / 要素流动 / 交通支撑",icon:"🔗",symbol:"∞",color:"#f39dbd",
  lead:"连接深圳及大湾区产业、技术和市场资源，强化跨区域协作。",
  points:["推动惠城与周边城市的产业协同和要素联动","关注交通通达、产业对接和公共服务等配套条件","跨江交通属于支撑条件，不单独记为第六条产值增长路径"],
  evidence:[{label:"2025 年部署",text:"惠城2025年工作安排提出推进“惠城+仲恺”等城市空间与产业融合发展。",source:"惠州新闻网 · 2025-03-28"},{label:"区域协作背景",text:"惠州市2026年发展工作继续把主动融深融湾和交通互联作为重点安排。",source:"惠州市政府工作报告公开信息"}],
  related:[{id:0,why:"跨区域招商与项目导入可能相互关联"},{id:1,why:"供应链协同可支持优势产业集群"},{id:3,why:"物流与专业服务支撑区域要素流动"}],
  tags:["区域协作","产业协同","交通配套"],
  links:[{label:"惠城区2025年发展部署报道",url:"https://www.hznews.com/xqrm/hcq/202503/t20250328_1612092.shtml"},{label:"惠城区政府门户 · 规划文件检索",url:"https://www.hcq.gov.cn/"}]}
];
const RELATIONS=[[0,1],[0,3],[0,4],[1,2],[1,3],[1,4],[2,3],[3,4]];
const LAYOUTS={
 network:[{x:296,y:182},{x:716,y:190},{x:170,y:442},{x:805,y:446},{x:506,y:561}],
 all:[{x:285,y:178},{x:730,y:188},{x:210,y:459},{x:790,y:459},{x:506,y:567}],
 space:[{x:335,y:210},{x:697,y:179},{x:269,y:450},{x:747,y:449},{x:510,y:567}]
};
const center={x:501,y:341};
const NODE_NAME=["新投产项目","三大产业集群","AI与机器人","生产性服务业","融深融湾"];
let selected=0,view="network",tab="planning",drag=null,raf=0;
const el=id=>document.getElementById(id);
const escapeHtml=str=>String(str==null?"":str).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const reduceMotion=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function toast(msg){const node=el("toast");node.textContent=msg;node.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.hidden=true,2100);}
function artSvg(id){
 const p=PATHS[id],c=p.color;
 const intro='<svg viewBox="0 0 260 115" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="g'+id+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#183e65"/><stop offset=".5" stop-color="#0d2b47"/><stop offset="1" stop-color="#061728"/></linearGradient><linearGradient id="h'+id+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+c+'" stop-opacity=".65"/><stop offset="1" stop-color="'+c+'" stop-opacity=".06"/></linearGradient></defs><rect width="260" height="115" fill="url(#g'+id+')"/><circle cx="194" cy="31" r="76" fill="'+c+'" opacity=".09"/>';
 const grid='<path d="M0 96H260M0 68H260M24 0V115M84 0V115M155 0V115M228 0V115" stroke="'+c+'" opacity=".12" fill="none"/>';
 let obj="";
 if(id===0)obj='<path d="M0 100H260" stroke="'+c+'" stroke-width="2"/><path d="M23 92V57L48 70V57L73 72V46L98 61V92Z" fill="url(#h0)" stroke="'+c+'" stroke-width="1.5"/><rect x="110" y="43" width="89" height="49" rx="3" fill="#21435d" stroke="'+c+'" stroke-opacity=".6"/><path d="M115 55H192M115 70H192M133 43V91M154 43V91M175 43V91" stroke="'+c+'" opacity=".55"/><path d="M206 18V91M176 20H241M212 18L239 35M203 29H238" stroke="'+c+'" stroke-width="2" fill="none"/><rect x="56" y="81" width="8" height="11" fill="'+c+'" opacity=".8"/>';
 if(id===1)obj='<g fill="url(#h1)" stroke="'+c+'" stroke-width="1.3"><rect x="28" y="34" width="61" height="65"/><rect x="96" y="21" width="70" height="78"/><rect x="175" y="46" width="63" height="53"/></g><g fill="'+c+'" opacity=".55">'+Array.from({length:36},(_,i)=>'<rect x="'+(36+(i%6)*9+(Math.floor(i/18)*76))+'" y="'+(44+(Math.floor(i%18)/6|0)*15)+'" width="3" height="6"/>').join("")+'</g><path d="M4 103H256" stroke="'+c+'" stroke-width="2"/>';
 if(id===2)obj='<g fill="none" stroke="'+c+'" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M54 98H140M99 95V72L123 48L160 58L184 30"/><path d="M181 27L202 17M181 27L192 43"/></g><g fill="#0d2c47" stroke="'+c+'" stroke-width="3"><circle cx="100" cy="72" r="10"/><circle cx="123" cy="48" r="10"/><circle cx="160" cy="58" r="8"/></g><path d="M17 16h54M17 28h29M205 78h45M205 88h24" stroke="'+c+'" opacity=".5"/>';
 if(id===3)obj='<g fill="url(#h3)" stroke="'+c+'" stroke-width="1.3"><rect x="17" y="49" width="48" height="49"/><rect x="72" y="27" width="57" height="71"/><rect x="137" y="42" width="51" height="56"/><rect x="196" y="18" width="47" height="80"/></g>'+Array.from({length:38},(_,i)=>'<rect x="'+(25+(i%8)*27.5)+'" y="'+(53+Math.floor(i/8)*9)+'" width="11" height="2.5" fill="'+c+'" opacity=".3"/>').join("")+'<path d="M0 100H260" stroke="'+c+'" stroke-width="2"/>';
 if(id===4)obj='<path d="M0 82Q110 70 260 83V115H0Z" fill="#0b4560" opacity=".52"/><path d="M17 67Q127 10 244 67" fill="none" stroke="'+c+'" stroke-width="4"/><path d="M16 70H246" stroke="'+c+'" stroke-width="4"/><path d="M57 42V94M107 26V96M158 29V97M210 46V91" stroke="'+c+'" stroke-width="2" opacity=".6"/><path d="M12 101Q70 94 132 102T260 103" stroke="'+c+'" stroke-width="1" opacity=".55" fill="none"/>';
 return intro+grid+obj+'</svg>';
}
function renderCards(){
 el("pathCards").innerHTML=PATHS.map((p,i)=>'<button type="button" class="path-card '+(i===selected?"active":"")+'" data-path="'+i+'" style="--path-color:'+p.color+';--path-glow:'+p.color+'44" aria-pressed="'+String(i===selected)+'"><span class="art">'+artSvg(i)+'</span><span class="card-body"><span class="card-num">'+p.number+' / 05</span><span class="card-name">'+escapeHtml(p.name)+'<span class="arr">↗</span></span><span class="card-tag">'+escapeHtml(p.tag)+'</span></span></button>').join("");
 el("pathCards").querySelectorAll("[data-path]").forEach(b=>b.addEventListener("click",()=>selectPath(+b.dataset.path,"card")));
}
function renderInspector(){
 const p=PATHS[selected];
 el("pathIndex").textContent=p.number+" / 05";
 el("inspectorArt").innerHTML=artSvg(selected);
 el("detailIcon").textContent=p.icon;el("detailIcon").style.background=p.color+"29";el("detailIcon").style.borderColor=p.color+"88";
 el("detailName").textContent=p.name;el("detailLead").textContent=p.lead;
 el("sourceLink").href=p.links[0].url;
 el("inspectContent").innerHTML="";
 let content="";
 if(tab==="planning"){
  content='<div class="section-cap">规划与部署 · 重点方向</div><ul>'+p.points.map(x=>'<li>'+escapeHtml(x)+'</li>').join("")+'</ul><span class="proof">以上为对公开规划、工作部署与报道的概括；不等同于逐字政府文件。</span>';
 }else if(tab==="evidence"){
  content='<div class="section-cap">已公布的线索 · 标明时间</div>'+p.evidence.map(x=>'<div class="evidence"><b>'+escapeHtml(x.label)+'</b> · '+escapeHtml(x.text)+'<small>'+escapeHtml(x.source)+'</small></div>').join("")+'<span class="proof">报道中“计划、力争、推动”等为当时部署，不能视为已经完成。请点击下方原文查证。</span><div class="link-item" style="border:0"><span style="color:#79e4cf">↗</span><span>'+p.links.map(x=>'<a href="'+x.url+'" target="_blank" rel="noopener noreferrer" style="color:#8cd6e4">'+escapeHtml(x.label)+'</a>').join(" · ")+'</span></div>';
 }else{
  content='<div class="section-cap">可观察的协同联系</div>'+p.related.map(r=>'<div class="link-item"><span class="dot" style="--line-color:'+PATHS[r.id].color+'"></span><span><b>'+escapeHtml(PATHS[r.id].name)+'</b><small>'+escapeHtml(r.why)+'</small></span></div>').join("")+'<p class="connection-disclaimer">这些连线是依据公开发展方向做的<strong>理解性关系示意</strong>，不是已核实的真实企业供应链、投资流或因果网络。</p>';
 }
 el("inspectContent").innerHTML=content;
 document.querySelectorAll(".inspect-tabs [data-tab]").forEach(b=>{const active=b.dataset.tab===tab;b.setAttribute("aria-selected",String(active));b.tabIndex=active?0:-1});
}
function pathShape(a,b,curve=0){
 const dx=b.x-a.x,dy=b.y-a.y,midX=(a.x+b.x)/2,midY=(a.y+b.y)/2;
 const len=Math.hypot(dx,dy)||1;
 return 'M'+a.x.toFixed(1)+','+a.y.toFixed(1)+' Q'+(midX-dy/len*curve).toFixed(1)+','+(midY+dx/len*curve).toFixed(1)+' '+b.x.toFixed(1)+','+b.y.toFixed(1);
}
function graphLink(a,b,color,active,kind,offset=0){
 const d=pathShape(a,b,offset),dim=view==="network"&&!active;
 const style='style="--edge-color:'+color+'"';
 return '<path d="'+d+'" class="net-link '+(active?'active':'')+(dim?' dim':'')+'" stroke="'+color+'" '+style+'/>'+
        '<path d="'+d+'" class="net-flow '+(dim?'dim':'')+'" stroke="'+color+'" style="animation-delay:-'+((offset+5)*.12).toFixed(1)+'s"/>';
}
function renderGraph(){
 const xy=LAYOUTS[view],markup=[];
 const focus=view!=="all";
 markup.push('<circle cx="'+center.x+'" cy="'+center.y+'" r="205" class="center-aura"/><circle cx="'+center.x+'" cy="'+center.y+'" r="104" class="center-orbit"/>');
 for(let i=0;i<PATHS.length;i++){
  let p=PATHS[i],active=!focus||i===selected||PATHS[selected].related.some(r=>r.id===i);
  markup.push(graphLink(center,xy[i],p.color,active,"radial",i*3));
 }
 for(const [i,j] of RELATIONS){
   const active=!focus||i===selected||j===selected;
   markup.push(graphLink(xy[i],xy[j],PATHS[i].color,active,"synergy",14+(i+j)*4));
 }
 markup.push('<circle cx="'+center.x+'" cy="'+center.y+'" r="67" class="central-main"/>'+
  '<circle cx="'+center.x+'" cy="'+center.y+'" r="77" fill="none" stroke="#83d6e7" opacity=".42" stroke-width="1.3"/>'+
  '<text x="'+center.x+'" y="'+(center.y-5)+'" class="central-text">惠城</text>'+
  '<text x="'+center.x+'" y="'+(center.y+25)+'" class="central-year">2030</text>');
 PATHS.forEach((p,i)=>{
  const x=xy[i].x,y=xy[i].y,active=!focus||i===selected,dim=focus&&!active;
  let r=i===selected?39:34;
  markup.push('<g class="net-node '+(active?'active':'')+(dim?' dim':'')+'" data-index="'+i+'" tabindex="0" role="button" aria-label="查看'+escapeHtml(p.name)+'发展路径" aria-pressed="'+String(i===selected)+'" transform="translate('+x+' '+y+')">'+
  '<circle class="halo" cx="0" cy="0" r="'+(r+25)+'" fill="'+p.color+'"/>'+
  '<circle class="rim" cx="0" cy="0" r="'+r+'" stroke="'+p.color+'" style="filter:drop-shadow(0 0 11px '+p.color+'8a)"/>'+
  '<text class="node-symbol" x="0" y="3" fill="'+p.color+'">'+p.symbol+'</text>'+
  '<rect x="-72" y="'+(r+9)+'" width="144" height="51" rx="12" fill="#08223cd9" stroke="'+p.color+'" stroke-opacity=".68"/>'+
  '<text class="node-label" x="0" y="'+(r+30)+'">'+escapeHtml(p.name)+'</text>'+
  '<text class="node-sub" x="0" y="'+(r+47)+'">'+escapeHtml(p.short)+'</text></g>');
 });
 if(view!=="all"){
  const p=PATHS[selected],x=xy[selected].x,y=xy[selected].y;
  const offsets=[{x:-96,y:-52},{x:101,y:-40},{x:-45,y:119}];
  p.tags.slice(0,3).forEach((tag,i)=>{
    const n=offsets[i],nx=Math.max(45,Math.min(946,x+n.x)),ny=Math.max(33,Math.min(646,y+n.y));
    const ax=x+(nx-x)*.5,ay=y+(ny-y)*.5;
    markup.push('<g class="minor-node"><path d="M'+x+' '+y+' Q'+(ax+9)+' '+(ay-15)+' '+nx+' '+ny+'" fill="none" stroke="'+p.color+'" stroke-opacity=".5" stroke-dasharray="3 5"/><circle cx="'+nx+'" cy="'+ny+'" r="3.5" stroke="'+p.color+'"/><text x="'+nx+'" y="'+(ny-9)+'">'+escapeHtml(tag)+'</text></g>');
  });
 }
 el("graphRoot").innerHTML=markup.join("");
 el("sceneCaption").textContent=view==="space"?"区域布局为概念示意，不代表真实坐标或规划红线。":view==="all"?"五条发展路径共同组成一张可观察的协同关系图。":PATHS[selected].name+"：关注这条路与其他发展方向的联系。";
 document.querySelectorAll("[data-view]").forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.view===view)));
}
function selectPath(id,origin){
 if(!Number.isInteger(id)||id<0||id>=PATHS.length)return;
 selected=id;tab="planning";
 renderGraph();renderInspector();renderCards();
 if(origin==="card"&&window.innerWidth<650)el("inspectorArt").scrollIntoView({behavior:reduceMotion()?"auto":"smooth",block:"center"});
}
function setView(value){if(!Object.hasOwn(LAYOUTS,value))return;view=value;renderGraph();}
function canvasScene(){
 const canvas=el("cityCanvas");if(!canvas)return;
 const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight),dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);
 const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
 let seed=28461;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const background=ctx.createLinearGradient(0,0,w,h);background.addColorStop(0,"#06182c");background.addColorStop(.52,"#0c2b43");background.addColorStop(1,"#061529");
 ctx.fillStyle=background;ctx.fillRect(0,0,w,h);
 const spot=ctx.createRadialGradient(w*.47,h*.54,5,w*.47,h*.54,w*.62);
 spot.addColorStop(0,"#2a6a83aa");spot.addColorStop(.5,"#15405c35");spot.addColorStop(1,"#08172a00");
 ctx.fillStyle=spot;ctx.fillRect(0,0,w,h);
 // Night-time urban blocks and light windows; symbolic city texture, not map coordinates.
 const step=Math.max(18,w/57);
 for(let i=0;i<860;i++){
  const gx=Math.floor(rand()*w/step)*step+(rand()-.5)*4,gy=Math.floor(rand()*h/step)*step+(rand()-.5)*4;
  const near=Math.exp(-(((gx-w*.5)/w)**2*2+((gy-h*.55)/h)**2*2)*2);
  if(rand()>.18+near*.62)continue;
  const width=3+rand()*Math.min(12,step*.7),height=2+rand()*Math.min(9,step*.57);
  ctx.fillStyle=rand()<.68?"rgba(243,178,101,"+(.06+rand()*.15)+")":"rgba(102,208,243,"+(.04+rand()*.11)+")";
  ctx.fillRect(gx,gy,width,height);
 }
 // Arterial city corridors
 ctx.lineCap="round";
 for(let i=0;i<17;i++){
  const x=(i+1)*w/18;
  ctx.beginPath();ctx.moveTo(x-58,0);ctx.bezierCurveTo(x+14,h*.27,x-8,h*.74,x+44,h);
  ctx.strokeStyle=i%4===0?"#5dc9e83f":"#bf854c20";ctx.lineWidth=i%4===0?2.5:.8;ctx.stroke();
 }
 for(let i=0;i<13;i++){
  const y=(i+1)*h/14;ctx.beginPath();ctx.moveTo(0,y+18);ctx.bezierCurveTo(w*.31,y-35,w*.68,y+27,w,y-24);
  ctx.strokeStyle=i%3===0?"#6cbedb2e":"#d99b5827";ctx.lineWidth=i%3===0?2.2:.9;ctx.stroke();
 }
 // East River-inspired luminous ribbon (conceptual—not geographically accurate).
 const river=()=>{ctx.beginPath();ctx.moveTo(-w*.1,h*.68);ctx.bezierCurveTo(w*.22,h*.50,w*.48,h*.74,w*.72,h*.45);ctx.bezierCurveTo(w*.85,h*.32,w*.94,h*.34,w*1.08,h*.28)};
 river();ctx.strokeStyle="#21b4d62d";ctx.lineWidth=Math.max(24,w*.045);ctx.shadowBlur=25;ctx.shadowColor="#48cfeb";ctx.stroke();ctx.shadowBlur=0;
 river();ctx.strokeStyle="#278ca9a8";ctx.lineWidth=Math.max(11,w*.017);ctx.stroke();
 river();ctx.strokeStyle="#8af5f1c4";ctx.lineWidth=1.8;ctx.setLineDash([4,18]);ctx.stroke();ctx.setLineDash([]);
 for(let i=0;i<175;i++){
  const x=rand()*w,y=rand()*h;ctx.fillStyle=rand()<.82?"#c9f7ff26":"#f7d99b4d";ctx.fillRect(x,y,.6+rand(),.6+rand());
 }
}
const svg=el("network");
function pointOfEvent(event){
 const pt=svg.createSVGPoint();pt.x=event.clientX;pt.y=event.clientY;const ctm=svg.getScreenCTM();return ctm?pt.matrixTransform(ctm.inverse()):null;
}
svg.addEventListener("pointerdown",e=>{
 const g=e.target.closest(".net-node");if(!g)return;
 const index=Number(g.dataset.index),point=pointOfEvent(e);if(!point)return;
 drag={id:index,x:point.x,y:point.y,moved:false};
 if(e.pointerType==="mouse"){svg.setPointerCapture(e.pointerId);}
});
svg.addEventListener("pointermove",e=>{
 if(!drag||e.pointerType!=="mouse")return;
 const p=pointOfEvent(e);if(!p)return;
 if(Math.hypot(p.x-drag.x,p.y-drag.y)>5)drag.moved=true;
 if(!drag.moved)return;
 const pos=LAYOUTS[view][drag.id];pos.x=Math.max(90,Math.min(900,p.x));pos.y=Math.max(100,Math.min(570,p.y));
 cancelAnimationFrame(raf);raf=requestAnimationFrame(renderGraph);
});
svg.addEventListener("pointerup",e=>{
 if(!drag)return;const d=drag;drag=null;
 if(e.pointerType==="mouse"&&svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);
 if(!d.moved)selectPath(d.id,"node");
});
svg.addEventListener("pointercancel",()=>drag=null);
svg.addEventListener("click",e=>{
 if(e.detail===0||e.pointerType==="touch"){const g=e.target.closest(".net-node");if(g)selectPath(Number(g.dataset.index),"node");}
});
svg.addEventListener("keydown",e=>{
 if(e.key==="Enter"||e.key===" "){const g=e.target.closest(".net-node");if(g){e.preventDefault();selectPath(Number(g.dataset.index),"node");}}
});
document.querySelectorAll(".inspect-tabs [data-tab]").forEach(btn=>btn.addEventListener("click",()=>{tab=btn.dataset.tab;renderInspector();}));
document.querySelectorAll("[data-view]").forEach(btn=>btn.addEventListener("click",()=>setView(btn.dataset.view)));
el("resetScene").addEventListener("click",()=>{LAYOUTS.network=[{x:296,y:182},{x:716,y:190},{x:170,y:442},{x:805,y:446},{x:506,y:561}];selected=0;tab="planning";view="network";renderGraph();renderInspector();renderCards();toast("已恢复完整路径关系视角");});
function copyText(t){
 if(navigator.clipboard&&navigator.clipboard.writeText){return navigator.clipboard.writeText(t).then(()=>toast("分享链接已复制")).catch(()=>fallbackCopy(t));}
 return fallbackCopy(t);
}
function fallbackCopy(value){
 const input=document.createElement("textarea");input.value=value;input.style.position="fixed";input.style.left="-9999px";document.body.appendChild(input);input.select();
 let ok=false;try{ok=document.execCommand("copy")}catch(e){}input.remove();toast(ok?"已复制":"复制不可用，请使用浏览器分享功能");
}
el("shareFocus").addEventListener("click",()=>{
 const url=new URL(location.href);url.hash=new URLSearchParams({path:String(selected),view}).toString();
 copyText("我在惠城产业风洞第五页关注「"+PATHS[selected].name+"」：\n"+url.href+"\n规划公开依据可在页面查看；路径联系为示意，不是模型预测。");
});
let urlParams=new URLSearchParams(location.hash.slice(1));
const fromUrl=Number(urlParams.get("path"));if(urlParams.has("path")&&Number.isInteger(fromUrl)&&fromUrl>=0&&fromUrl<5)selected=fromUrl;
if(Object.hasOwn(LAYOUTS,urlParams.get("view")))view=urlParams.get("view");
renderCards();renderInspector();renderGraph();
canvasScene();let resizeTimer;window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(canvasScene,140)});
})();
