// Execute fifth-page JavaScript against a minimal DOM to verify actual state transitions.
// No external dependencies; intentionally avoids calling simulator model or changing data.
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const script=fs.readFileSync(path.join(root,"choices-kg.js"),"utf8");
const html=fs.readFileSync(path.join(root,"choices.html"),"utf8");
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),"utf8"));
const fixtures=[read("data/relationship-evidence-v1.json"),read("data/relationship-sources-v1.json"),read("data/relationship-changes-v1.json")];
class Element{
 constructor(id="",dataset={}){
  this.id=id;this.dataset=dataset;this.listeners={};this.attributes={};this.children=[];
  this.style={};this.classList={add(){},remove(){}};this._html="";
  this.firstChild={textContent:""};this._span={textContent:""};this.textContent="";
  this.value="4";this.hidden=false;this.disabled=false;this.clientWidth=480;this.clientHeight=530;
 }
 addEventListener(type,callback){(this.listeners[type]??=[]).push(callback)}
 click(){for(const f of this.listeners.click||[])f({target:this,preventDefault(){}})}
 change(v){this.value=v;for(const f of this.listeners.input||[])f({target:this,preventDefault(){}})}
 setAttribute(name,value){this.attributes[name]=String(value)}
 getAttribute(name){return this.attributes[name]}
 querySelector(selector){if(selector==="span")return this._span;return new Element()}
 querySelectorAll(selector){
  if(selector==="[data-open]")return [...this._html.matchAll(/data-open="([^"]+)"/g)].map(m=>new Element("",{open:m[1]}));
  return [];
 }
 get innerHTML(){return this._html}
 set innerHTML(value){this._html=String(value)}
 appendChild(element){this.children.push(element);return element}
 replaceChildren(){this.children=[]}
 getContext(){return {setTransform(){},fillRect(){},beginPath(){},moveTo(){},bezierCurveTo(){},stroke(){},
  createLinearGradient(){return {addColorStop(){}}}}}
 getScreenCTM(){return {inverse(){return {}}}}
 createSVGPoint(){return {x:0,y:0,matrixTransform(){return {x:this.x,y:this.y}}}}
 setPointerCapture(){}hasPointerCapture(){return true}releasePointerCapture(){}
 scrollIntoView(){}
}
function makeDOM(mobile,hash="",shared=[]){
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 const elements=new Map(ids.map(id=>[id,new Element(id)]));
 const group=key=>[...html.matchAll(new RegExp("data-"+key+'="([^"]+)"',"g"))].map(m=>new Element("",{[key]:m[1]}));
 const personas=group("persona"),grades=group("grade"),tabs=group("tab");
 const document={
  getElementById(id){if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id)},
  createElement(){return new Element()},
  createElementNS(){return new Element()},
  querySelectorAll(sel){return sel==="[data-persona]"?personas:sel==="[data-grade]"?grades:sel==="[data-tab]"||sel===".kg-aside-tabs button"?tabs:[]},
  body:new Element("body")
 };
 const window={devicePixelRatio:1,addEventListener(){},matchMedia(){return {matches:mobile}}};
 const fetch=async(url)=>({ok:true,json:async()=>fixtures[url.includes("evidence-v1")?0:url.includes("sources-v1")?1:2]});
 const navigator={clipboard:{writeText:async(text)=>shared.push(text)}};
 const location={href:"https://example.test/choices.html",hash};
 const fn=new Function("document","window","fetch","navigator","location","setTimeout","clearTimeout","URL","URLSearchParams",script);
 fn(document,window,fetch,navigator,location,()=>1,()=>{},URL,URLSearchParams);
 return {elements,personas,grades,tabs,get:id=>document.getElementById(id)};
}
async function settle(){for(let i=0;i<12;i++)await Promise.resolve();}
(async()=>{
 const saved=[];
 const app=makeDOM(true,"",saved),g=app.get;
 await settle();
 assert.equal(g("kgEmpty").hidden,true,"Data loaded without fallback");
 assert.equal(g("kgSvg").getAttribute("viewBox"),"0 0 360 350","Phone does not shrink 1000px graph");
 assert.equal(g("kgMobileNodes").children.length,4,"Mobile entry rail present");
 assert.equal(g("kgEventList").children.length,7,"All seven sourced changes shown");
 assert.ok(g("kgNodes").children.length<=3,"Only focus and two neighbors drawn on phone");
 g("kgMobileNodes").children.find(b=>b.textContent==="新投产项目").click();
 assert.equal(g("kgNodeCount").textContent,"1","Path click shows ONE entity");
 assert.equal(g("kgDetailTitle").textContent,"新投产项目","Inspector follows clicked path");
 g("kgExpand").click();
 assert.equal(g("kgNodeCount").textContent,"2","Next expansion adds ONE further entity");
 assert.ok(g("kgNodes").children.length<=3,"Mobile focus still limited after expansion");
 g("kgBack").click();
 assert.equal(g("kgNodeCount").textContent,"1","Undo restores one-entity state");
 app.grades[1].click();
 assert.equal(app.grades[1].attributes["aria-pressed"],"true","AB grade updates state");
 const eventCard=g("kgEventList").children.find(b=>b.innerHTML.includes("金澜"));
 assert.ok(eventCard,"Source-backed event appears in list");
 eventCard.click();
 assert.ok(g("kgEventStory").innerHTML.includes("仍有不确定性"),"Evidence event displays uncertainty");
 assert.ok(g("kgEventStory").innerHTML.includes("变化之前"),"Evidence event displays before/after");
 assert.ok(g("kgDetailTitle").textContent,"Event focuses an inspector item");
 g("kgShare").click();await settle();
 assert.ok(saved.length&&saved[0].includes("event="),"Share includes chosen event");
 const hash=new URL(saved[0].split("\n")[1]).hash;
 const restored=makeDOM(true,hash);
 await settle();
 assert.ok(restored.get("kgEventStory").innerHTML.includes("金澜"),"Event restored from shared link");
 restored.get("kgDate").change("0");
 assert.ok(restored.get("kgEventList").children.some(x=>x.disabled),"Future events disabled by source date");
 const desktop=makeDOM(false);await settle();
 assert.equal(desktop.get("kgSvg").getAttribute("viewBox"),"0 0 1000 650","Desktop remains broad graph");
 desktop.get("kgMobileNodes").children.find(b=>b.textContent==="新投产项目").click();
 assert.equal(desktop.get("kgNodeCount").textContent,"1","Desktop also reveals one entity");
 console.log("✓ Runtime knowledge graph V4.1: mobile/desktop, progressive reveal, undo, grade, seven events, share restoration and time gating");
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
