// Fifth-page V3 visual/structure regression checks. No model algorithm is evaluated here.
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("choices.html"),js=read("choices-v3.js"),css=read("choices-v3.css"),nav=read("hc-journey-nav.js");
const assert=(ok,msg)=>{if(!ok){console.error("✗ "+msg);process.exitCode=1}else console.log("✓ "+msg)};
try{new Function(js);assert(true,"choices-v3.js syntax")}catch(e){assert(false,"JS syntax: "+e.message)}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert(ids.length===new Set(ids).size,"HTML IDs are unique");
const refs=[...new Set([...js.matchAll(/el\("([^"]+)"\)/g)].map(m=>m[1]))];
assert(refs.every(id=>ids.includes(id)),"All direct DOM ID references are present");
assert(html.includes('src="choices-v3.js"')&&html.includes('href="choices-v3.css"'),"V3 UI assets linked");
assert(html.includes('hc-journey-nav.js')&&html.includes('hc-journey-nav.css'),"10-page navigation preserved");
assert(!html.includes('src="model.js"')&&!/HT\.run|DEFAULT_PATHS|localStorage|hcChoices/.test(js),"No future-model manipulation or fake parameter transfer");
assert(html.includes('future.html')&&html.includes('fun.html'),"Previous and next chapter links present");
assert(css.includes("@media(max-width:650px)")&&css.includes("prefers-reduced-motion"),"Phone layout and reduced-motion support");
const start=js.indexOf("const PATHS="),end=js.indexOf("const LAYOUTS=");
assert(start!==-1&&end>start,"Structured path and relationship data present");
if(start!==-1&&end>start){
 let data;
 try{data=Function(js.slice(start,end)+"\nreturn {PATHS,RELATIONS};")()}catch(e){assert(false,"Structured data parse: "+e.message);}
 if(data){
  const {PATHS,RELATIONS}=data;
  assert(PATHS.length===5,"Exactly five principal policy directions");
  assert(PATHS.every((p,i)=>p.number===String(i+1).padStart(2,"0")&&p.name&&p.points?.length>=2&&p.evidence?.length&&p.links?.length),"All paths have planning/evidence/source sections");
  assert(PATHS.flatMap(p=>p.links).every(l=>l.url.startsWith("https://")),"Policy evidence links are HTTPS");
  assert(PATHS.every(p=>p.related.every(r=>r.id>=0&&r.id<5&&Number.isInteger(r.id))),"Path relationships stay within five primary routes");
  assert(RELATIONS.every(([i,j])=>Number.isInteger(i)&&Number.isInteger(j)&&i!==j&&i>=0&&i<5&&j>=0&&j<5),"Relation graph contains valid paths");
  assert(!PATHS.some(p=>/第六条|额外30亿/.test(p.name)),"No fabricated sixth industrial growth path");
 }
}
const pages=[...nav.matchAll(/\{url:'([^']+)'/g)].map(m=>m[1]);
assert(pages.slice(3,7).join(",")==="fun.html,choices.html,future.html,windtunnel.html","Chapter order 04→05→06→07");
if(process.exitCode)process.exit(process.exitCode);
