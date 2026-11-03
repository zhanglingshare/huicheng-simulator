/* Functional smoke test of chapter 05 progressive graph in an isolated DOM harness.
 * Uses actual data files; no external dependencies, no server, no model mutation.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
class FakeElement{
 constructor(tag='div'){this.tagName=tag;this.listeners={};this.children=[];this.attrs={};this.dataset={};this.style={};this.hidden=false;this.clientWidth=850;this.clientHeight=630;this.value='';this._innerHTML='';this.textContent='';this.firstChild={textContent:''};this.classList={add(){},remove(){},toggle(){}};}
 setAttribute(key,val){this.attrs[key]=String(val);if(key.startsWith('data-'))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(val)}
 getAttribute(key){return this.attrs[key]??null}
 addEventListener(name,cb){(this.listeners[name]??=[]).push(cb)}
 fire(name,event={}){for(const f of(this.listeners[name]||[]))f({target:this,preventDefault(){},...event})}
 replaceChildren(...nodes){this.children=[...nodes]}
 appendChild(node){this.children.push(node);return node}
 closest(selector){
  if(selector.includes('[data-node]')&&this.dataset.node)return this;
  if(selector.includes('[data-edge]')&&this.dataset.edge)return this;
  return null;
 }
 querySelector(sel){if(sel==='span'){const x=new FakeElement('span');return x}return null}
 querySelectorAll(sel){
  if(sel==='[data-open]'||sel==='[data-focus]')return [];
  return [];
 }
 set innerHTML(value){this._innerHTML=String(value);this.children=[]}
 get innerHTML(){return this._innerHTML}
 getContext(){const grad={addColorStop(){}};
  return{setTransform(){},createLinearGradient(){return grad},createRadialGradient(){return grad},fillRect(){},beginPath(){},moveTo(){},bezierCurveTo(){},stroke(){},setLineDash(){},shadowBlur:0,shadowColor:'',fillStyle:'',strokeStyle:''};
 }
 createSVGPoint(){return{x:0,y:0,matrixTransform(){return{x:this.x,y:this.y}}}}
 getScreenCTM(){return{inverse(){return{}}}}
 setPointerCapture(id){this.capture=id}
 hasPointerCapture(id){return this.capture===id}
 releasePointerCapture(){this.capture=undefined}
}
const html=fs.readFileSync(path.join(root,'choices.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const elements=Object.fromEntries(ids.map(id=>[id,new FakeElement(id)]));
elements.kgCity.clientWidth=850;elements.kgCity.clientHeight=630;
const createControl=(name,value)=>{
 const x=new FakeElement('button');x.dataset[name]=value;x.setAttribute('data-'+name,value);return x;
};
const controls={
 '[data-persona]':['job','shop','commute','city'].map(v=>createControl('persona',v)),
 '[data-grade]':['A','AB'].map(v=>createControl('grade',v)),
 '[data-tab]':['what','links','proof'].map(v=>createControl('tab',v))
};
elements.kgDetailBody.querySelectorAll=()=>[];
const doc={
 getElementById(id){return elements[id]??null},
 querySelectorAll(q){return controls[q]||[]},
 createElementNS(ns,tag){return new FakeElement(tag)},
 createElement(tag){return new FakeElement(tag)},
 body:{appendChild(){}}
};
const eventBase=()=>({preventDefault(){},clientX:100,clientY:100,pointerId:11,button:0});
const uri='https://example.org/huicheng/choices.html';
const fetch=async resource=>{
 const rel=String(resource).split('?')[0];
 assert(rel.startsWith('data/'),'Unexpected file request');
 return{ok:fs.existsSync(path.join(root,rel)),json:async()=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'))};
};
const sandbox={
 document:doc,window:{devicePixelRatio:1,addEventListener(){},location:{href:uri,hash:''}},
 location:{href:uri,hash:''},
 fetch,URL,URLSearchParams,Map,Set,Number,Math,Promise,
 navigator:{clipboard:{writeText:async()=>{}}},
 setTimeout:()=>0,clearTimeout:()=>{},requestAnimationFrame:cb=>{cb();return 1},
 console
};
vm.runInNewContext(fs.readFileSync(path.join(root,'choices-kg.js'),'utf8'),sandbox,{filename:'choices-kg.js',timeout:1500});
const sleep=()=>new Promise(resolve=>setImmediate(resolve));
const clickNode=id=>{
 const node=elements.kgNodes.children.find(n=>n.dataset.node===id);
 assert(node,'Missing graph node '+id);
 const ev=eventBase();ev.target=node;
 elements.kgSvg.fire('pointerdown',ev);elements.kgSvg.fire('pointerup',ev);
};
const clickEdge=id=>{
 const edge=elements.kgEdges.children.find(n=>n.dataset.edge===id);
 assert(edge,'Missing graph edge '+id);
 const ev=eventBase();ev.target=edge;
 elements.kgSvg.fire('pointerdown',ev);elements.kgSvg.fire('pointerup',ev);
};
async function run(){
 await sleep();await sleep();
 assert.equal(elements.kgNodes.children.length,4,'Initial graph contains 1 citizen question + 3 relevant policy paths');
 assert.equal(elements.kgEdges.children.length,3,'Initial links are only explanatory guides');
 assert.equal(elements.kgNodeCount.textContent,'0','No fabricated subjects appear initially');
 assert.equal(elements.kgMobileNodes.children.length,4,'Mobile node buttons match graph');
 clickNode('p:0');
 assert.equal(elements.kgNodes.children.length,5,'First path click reveals just one subject');
 assert.equal(elements.kgNodeCount.textContent,'1','Single-step first expansion');
 elements.kgExpand.fire('click');
 assert.equal(elements.kgNodeCount.textContent,'2','One more subject appears on next expansion');
 assert(elements.kgEdges.children.some(e=>e.dataset.edge.startsWith('fact:')),'Real fact edges appear when both endpoints are visible');
 assert(elements.kgMobileNodes.children.length===elements.kgNodes.children.length,'Mobile rail updates as nodes grow');
 const fact=elements.kgEdges.children.find(e=>e.dataset.edge.startsWith('fact:'));
 clickEdge(fact.dataset.edge);
 assert(elements.kgDetailTitle.textContent!=='', 'Selecting a real relationship shows details');
 controls['[data-tab]'][2].fire('click');
 assert(elements.kgDetailBody.innerHTML.includes('href='),'Evidence tab links back to original public source');
 elements.kgDate.value='0';
 elements.kgDate.fire('input',{target:elements.kgDate});
 assert.equal(elements.kgNodeCount.textContent,'1','Earlier date keeps only already-published high-tech-zone evidence');
 assert.equal(elements.kgDetailTitle.textContent,'我想找一份好工作','Hidden selected fact safely resets to starting question');
 controls['[data-persona]'][3].fire('click');
 assert.equal(elements.kgNodes.children.length,6,'Whole-city view starts with one question + five directions');
 controls['[data-grade]'][1].fire('click');
 assert.equal(controls['[data-grade]'][1].attrs['aria-pressed'],'true','Grade filter changes');
 elements.kgHome.fire('click');
 assert.equal(elements.kgNodeCount.textContent,'0','Reset clears explored entities');
 console.log('✓ Functional graph runtime smoke: initial state, path expansion, factual edges, citations, time cutoff, mobile rail, grade switch, reset');
}
run().catch(e=>{console.error(e);process.exit(1)});
