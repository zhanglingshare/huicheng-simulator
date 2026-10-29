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
check(refs.every(id=>ids.includes(id)),"All referenced controls exist");
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
if(fail)process.exit(1);console.log("Knowledge Graph V4 checks passed.");
