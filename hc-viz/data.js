const HC_SOURCE='https://www.hcq.gov.cn/ecgk/jjfz/content/post_5705666.html';
const HC_OFFICIAL={year:2025,source:HC_SOURCE,metrics:[
 {k:'GDP增长',v:'+4.3%',detail:'地区生产总值 1203.33 亿元',status:'warm',unit:'增长率',note:'2025年地区生产总值1203.33亿元，按不变价格计算同比增长4.3%。'},
 {k:'规上工业总产值增长',v:'+9.6%',detail:'937.92 亿元',status:'good',unit:'同比',note:'2025年规模以上工业总产值937.92亿元，同比增长9.6%。与工业增加值增速不是同一指标。'},
 {k:'规上工业增加值增长',v:'+10.8%',detail:'增加值增速（非总产值）',status:'good',unit:'同比',note:'2025年规上工业增加值增长10.8%。此值不等于工业总产值增长率。'},
 {k:'固定资产投资',v:'−37.1%',detail:'同比下降',status:'risk',unit:'同比',note:'2025年全区固定资产投资同比下降37.1%。'},
 {k:'社会消费品零售',v:'+3.7%',detail:'805.68 亿元',status:'warm',unit:'同比',note:'2025年社会消费品零售总额805.68亿元，同比增长3.7%。'},
 {k:'外贸进出口',v:'+7.1%',detail:'383.60 亿元',status:'good',unit:'同比',note:'2025年外贸进出口总额383.6亿元，同比增长7.1%。'},
 {k:'区本级预算收入',v:'+3.5%',detail:'64.60 亿元',status:'warm',unit:'同比',note:'2025年区本级一般公共预算收入64.60亿元，同比增长3.5%。勿与含市直的195.86亿元混用。'},
 {k:'常住人口',v:'159.78万',detail:'2025年末',status:'neutral',unit:'人口规模',note:'2025年末惠城区常住人口159.78万人，非增长率。'}
]};
const SCENES={base:{name:'基准情景',desc:'按原模型默认情景'},delay:{name:'项目延期',desc:'项目贡献承压'},commute:{name:'通勤压力',desc:'招工与本地服务业相关路径承压'},both:{name:'两者叠加',desc:'两项压力同时注入'}};
const SHARED_KEY='hc_v1_r89_preview_selected_scenario';
const SEED=42,N=20000;
function runScene(key){let paths=JSON.parse(JSON.stringify(HT.DEFAULT_PATHS));
 if(key==='delay'||key==='both')paths[0].mu=Math.max(0,paths[0].mu-90);
 if(key==='commute'||key==='both'){
 paths[3].mu=Math.max(0,paths[3].mu-60);paths[0].mu=Math.max(0,paths[0].mu-18);
 }
 return HT.run(SEED,N,paths);
}
const cache={};function getScene(key){if(!SCENES[key])key='base';return cache[key]||(cache[key]=runScene(key))}
function initialScene(){let fromUrl=new URLSearchParams(location.search).get('scene');if(SCENES[fromUrl])return fromUrl;try{let k=localStorage.getItem(SHARED_KEY);if(SCENES[k])return k}catch(e){}return 'base'}
function saveScene(key){try{localStorage.setItem(SHARED_KEY,key)}catch(e){}}
function makeUrl(page,key){try{const u=new URL(page,location.href);u.searchParams.set('scene',key);return u.toString()}catch(e){return page+'?scene='+encodeURIComponent(key)}}
const fmt=n=>Math.round(n).toLocaleString('zh-CN');
function stateLabels(key){let s=getScene(key),b=getScene('base');return {hit:s.hit.toFixed(1)+'%',p50:fmt(s.p50),p10:fmt(s.p10),p90:fmt(s.p90),gap:(s.hit-b.hit).toFixed(1),diff:fmt(s.p50-b.p50),name:SCENES[key].name}}
function perfCSV(){return Object.keys(SCENES).map(k=>{let r=getScene(k);return [SCENES[k].name,k,r.hit.toFixed(3),r.p10.toFixed(1),r.p50.toFixed(1),r.p90.toFixed(1)].join(',')}).join('\n')}
