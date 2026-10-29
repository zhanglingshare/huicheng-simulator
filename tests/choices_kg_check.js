// Fifth-page Knowledge Graph V4. Tests structure/provenance without changing simulator internals.
"use strict";
const fs=require("node:fs"),path=require("node:path");
const dir=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(dir,f),"utf8"),json=f=>JSON.parse(read(f));
let fail=0;const check=(ok,msg)=>{if(ok)console.log("✓ "+msg);else{console.error("✗ "+msg);fail++}};
const html=read("choices.html"),js=read("choices-kg.js"),css=read("choices-kg.css");
const evidence=json("data/relationship-evidence-v1.json"),source=json("data/relationship-sources-v1.json"),changes=json("data/relationship-changes-v1.json");
const nav=read("hc-journey-nav.js");
try{new Function(js);check(true,"Knowledge graph JS parses")}catch(e){check(false,"JS syntax: "+e.message)}
check(html.includes('src="choices-kg.js"')&&html.includes('href="choices-kg.css"'),"Page imports new graph assets");
check(html.includes("hc-journey-nav.js")&&html.includes("hc-journey-nav.css"),"Ten-page journey remains");
check(!html.includes('src="model.js"')&&!/HT\.run|DEFAULT_PATHS/.test(js),"Page does not alter simulator model");
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
check(new Set(ids).size===ids.length,"No duplicate HTML IDs");
const refs=[...new Set([...js.matchAll(/\$\("([^"]+)"\)/g)].map(m=>m[1]))];
check(refs.every(id=>ids.includes(id)||id==="kgInspectEvent"&&js.includes('id="kgInspectEvent"')),"All referenced static and intentionally created dynamic controls exist");
const personas=[...html.matchAll(/data-persona="([^"]+)"/g)].map(m=>m[1]);
check(["job","shop","commute","city"].every(s=>personas.includes(s)),"Four ordinary-life entry points");
check(html.includes('id="kgSvg"')&&html.includes('id="kgViewport"')&&html.includes('id="kgEdges"')&&html.includes('id="kgNodes"'),"Graph is real SVG with edge/node layers");
check(html.includes('id="kgDate"')&&html.includes('data-grade="AB"'),"Evidence and time controls exist");
check(js.includes("e.source_node_id")&&js.includes("e.target_node_id")&&js.includes("sourceCards"),"Actual typed evidence edges and per-relation sources");
check(js.includes("pointermove")&&js.includes("kgSvg")&&js.includes("kgShare"),"Drag and share implementations present");
check(css.includes("@media(max-width:620px)")&&css.includes("prefers-reduced-motion"),"Mobile and reduced-motion styles");
check(evidence.nodes.length===17&&evidence.edges.length===19&&source.sources.length===17&&changes.changes.length===7,"Uses existing 17/19/17/7 evidence base");
const nids=new Set(evidence.nodes.map(n=>n.node_id)),sids=new Set(source.sources.map(s=>s.source_id));
check(evidence.edges.every(e=>nids.has(e.source_node_id)&&nids.has(e.target_node_id)&&e.source_ids?.every(s=>sids.has(s))),"All real edges have valid endpoints and source IDs");
check(evidence.nodes.every(n=>n.source_ids?.every(s=>sids.has(s))),"All evidence nodes reference valid sources");
let paths=[];try{
 const a=js.indexOf("const PATHS="),b=js.indexOf("const PEOPLE=");
 paths=Function(js.slice(a,b)+";return PATHS")();
}catch(e){check(false,"Policy path mapping parse: "+e.message)}
check(paths.length===5,"Exactly five public policy paths");
check(paths.every(p=>p.members.every(x=>nids.has(x))&&p.sources.every(x=>sids.has(x))),"Path-to-entity and policy sources are grounded");
check(js.includes('type:"guide"')&&js.includes('type:"fact"'),"Illustrative associations distinguishable from sourced facts");
check(js.includes('e.evidence_grade==="A"')&&js.includes('grade==="AB"'),"A and B evidence remain distinguishable");
check(!js.includes("localStorage.setItem")&&!js.includes("hcChoices"),"No fake scenario transfer to future page");
const order=[...nav.matchAll(/\{url:'([^']+)'/g)].map(x=>x[1]);
check(order.slice(3,7).join("|")==="fun.html|choices.html|future.html|windtunnel.html","Chapter sequence preserved");
// V4.1: verify event record integrity, mobile focus, and limited progressive reveal.
check(html.includes('id="kgEventList"')&&html.includes('id="kgEventStory"')&&html.includes('id="kgFocusMeta"'),"V4.1 events, story and focus HUD are present");
check(js.includes('function focusDiagram()')&&js.includes('"0 0 360 350"')&&js.includes('nodes:out'),"Mobile uses focused, readable coordinate system");
check(js.includes('expanded.add(extra[0])')&&!js.includes('extra.forEach(rawId=>expanded.add(rawId))'),"At most one entity revealed per ordinary expansion");
check(js.includes('function playEvent(c)')&&js.includes('function renderEvents()'),"Change log has interactive graph and story controls");
check(js.includes('eventRecords=c.changes')&&js.includes('activeEvent?.involved_edge_ids'),"Change events and graph highlights share the real evidence dataset");
check(js.includes('event:activeEvent?.change_id')&&js.includes('startsWith("fact:")'),"Share supports event/selected fact-edge restoration");
check(evidence.nodes.length===17&&evidence.edges.length===19,"Evidence base is unchanged, with no invented entity");
check(changes.changes.every(c=>(c.involved_node_ids||[]).every(id=>nids.has(id))&&(c.involved_edge_ids||[]).every(id=>evidence.edges.some(e=>e.edge_id===id))&&c.source_ids.every(id=>sids.has(id))),"Every animated event has existing entity, edge and source IDs");
check(changes.changes.every(c=>c.event_date&&c.uncertainty),"Every event declares a date and remaining uncertainty");
check(css.includes('kg-event-card')&&css.includes('kg-event-story-grid')&&css.includes('kg-focus-meta'),"Event cards, evidence story and focus HUD are styled");
if(fail)process.exit(1);console.log("Knowledge Graph V4.1 checks passed.");
