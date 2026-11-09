/* 惠城指标真源（L1）· 由 huicheng-data-audit 维护
   页面只读本文件，不得内嵌指标数字。
   以 IIFE 挂到 window，允许同页多次引用而不触发重复声明。 */
(function(g){
'use strict';
const HC_SOURCE='https://www.hcq.gov.cn/ecgk/jjfz/content/post_5705666.html';
const HC_OFFICIAL={year:2025,period:'2025 全年',source:HC_SOURCE,metrics:[
 {id:'ind_va',output:'937.92',output_v:'+9.6%',k:'规上工业增加值',v:'+10.8%',unit:'同比',sub:'总产值 937.9 亿',tag:'超目标 9%',status:'good',spark:'M2,21 L15,18 L27,20 L39,13 L51,15 L63,8 L76,10 L88,4',
  detail:'规上工业<b>增加值</b>增速 10.8%，高于年初约 9% 的目标；规上工业<b>总产值</b>937.92 亿元（现价，+9.6%）、销售产值 899.44 亿元（+7.8%）。注意：<b>增加值与总产值是两个口径</b>。来源：惠城区2025年统计公报（区统计局，初步核算数）。',
  note:'2025年规上工业增加值增长10.8%。此值不等于工业总产值增长率。'},
 {id:'ind_profit',k:'规上工业利润',v:'+49.7%',unit:'同比',sub:'42.51 亿元',tag:'盈利高增长',status:'good',spark:'M2,22 L15,20 L27,17 L39,15 L51,11 L63,10 L76,6 L88,3',
  detail:'规上工业企业实现利润总额 <b>42.51 亿元、+49.7%</b>；高技术制造业增加值 +15.6%（占比 37%）、先进制造业 +13.9%（占比 50.3%）。盈利大幅改善，是工业这条腿的亮点。来源：2025年统计公报。',
  note:'利润总额42.51亿元，同比增长49.7%。'},
 {id:'trade',total:'383.6',k:'外贸进出口',v:'+7.1%',unit:'同比',sub:'383.6 亿 · 出口+17.6%',tag:'出口拉动',status:'good',spark:'M2,21 L15,18 L27,19 L39,15 L51,13 L63,10 L76,7 L88,4',
  detail:'货物进出口 383.6 亿元、+7.1%；其中<b>出口 239.0 亿元、+17.6%</b>，进口 144.6 亿元、-6.8%。实际利用外资 13.84 亿元、+27.3%。外需增长但受全球环境影响，钥匙不完全在本地。来源：2025年统计公报。',
  note:'外贸进出口383.6亿元，同比增长7.1%。'},
 {id:'income',per:'63776',k:'居民人均可支配收入',v:'+4.5%',unit:'同比',sub:'63776 元',tag:'平稳增长',status:'flat',spark:'M2,18 L15,17 L27,18 L39,16 L51,16 L63,14 L76,14 L88,12',
  detail:'全体居民人均可支配收入 63776 元、+4.5%；城镇 68547 元（+4.2%）、农村 35998 元（+6.5%）。常住人口 159.78 万、城镇化率 85.74%。来源：2025年统计公报。',
  note:'全体居民人均可支配收入63776元。'},
 {id:'gdp',total:'1203.33',k:'GDP 增速',v:'+4.3%',unit:'同比',sub:'1203.33 亿 · 三产69%',tag:'低于目标 6%',status:'warn',spark:'M2,19 L15,17 L27,18 L39,16 L51,15 L63,14 L76,13 L88,11',
  detail:'地区生产总值 1203.33 亿元、+4.3%，年初增长目标约 6%，<b>差约 1.7 个百分点</b>。三产结构 3.4:27.6:69.0（一产 +2.9%、二产 +2.3%、三产 +5.2%）；人均 GDP 75309 元（+3.0%）。来源：2025年统计公报（初步核算数）。',
  note:'2025年地区生产总值1203.33亿元，按不变价格计算同比增长4.3%。'},
 {id:'retail',total:'805.68',k:'社会消费品零售',v:'+3.7%',unit:'同比',sub:'805.68 亿 · 限上+4.2%',tag:'低于目标 6%',status:'warn',spark:'M2,19 L15,18 L27,18 L39,16 L51,16 L63,14 L76,13 L88,12',
  detail:'社会消费品零售总额 805.68 亿元、+3.7%，年初目标约 6%，<b>差约 2.3 个百分点</b>；限上消费品零售额 525.26 亿元、+4.2%（统计公报正文未列限上总额，该数出自经济运行简况/政府公报）。消费偏温，与人口、人气直接相关。来源：2025年统计公报、2025年经济运行简况。',
  note:'社会消费品零售总额805.68亿元，同比增长3.7%。'},
 {id:'rev',total:'64.60',k:'一般公共预算收入',v:'+3.5%',unit:'同比',sub:'区本级 64.60 亿',tag:'基本平稳',status:'flat',spark:'M2,18 L15,17 L27,17 L39,16 L51,15 L63,15 L76,13 L88,13',
  detail:'区本级一般公共预算收入 <b>64.60 亿元、+3.5%</b>；全区（含市直）一般公共预算收入 195.86 亿元、+5.1%。政府可支配财力平稳，为公共服务与配套投入提供空间。来源：2025年统计公报。',
  note:'区本级一般公共预算收入64.60亿元，同比增长3.5%。'},
 {id:'fai',k:'固定资产投资',v:'-37.1%',unit:'同比',sub:'房地产开发 -47.3%',tag:'明显下滑',status:'bad',spark:'M2,7 L15,9 L27,8 L39,12 L51,11 L63,17 L76,16 L88,22',
  detail:'8 项指标中<b>唯一明显下滑</b>：工业投资 -34.4%、基建投资 -20.0%、房地产开发投资 -47.3%；商品房销售面积 -47%、销售金额 -54%。年初目标约 1%，投资这条腿明显收缩，对后续投产节点形成压力。来源：2025年统计公报。',
  note:'2025年全区固定资产投资同比下降37.1%。'}
]};

// 2026 年 1-9 月当期快报（2026-11-03 发布）——与 2025 全年口径分层，增速不可直接相加或比较
const HC_CURRENT={period:'2026年1-9月',periodShort:'1-9月',released_at:'2026-11-03',
 source:'http://www.hcq.gov.cn/zfxxgkml/hcqtjj/ywgz/content/post_5886184.html',
 metrics:[
  {id:'gdp',k:'地区生产总值',v:'883.46',unit:'亿元',yoy:'+1.1%',status:'b',note:'全市 4712.55 亿、+3.7%'},
  {id:'gdp2',k:'第二产业',v:'237.92',unit:'亿元',yoy:'-1.6%',status:'b',note:'上半年 -4.1%，降幅收窄 2.5pct'},
  {id:'ind_va',k:'规上工业增加值',yoy:'+0.8%',status:'b',note:'全市 +7.1%；1-8 月曾 +1.4%'},
  {id:'fai',k:'固定资产投资',yoy:'-40.7%',status:'b',note:'比上半年收窄 7.7pct；工业投资 -46.1%'},
  {id:'retail',k:'社会消费品零售',v:'622.07',unit:'亿元',yoy:'+2.0%',status:'n',note:'全市 +0.3%'},
  {id:'trade',k:'外贸进出口',v:'337.0',unit:'亿元',yoy:'+11.4%',status:'n',note:'出口 167.4 亿、+4.4%（比 1-8 月回落 10.8pct）'},
  {id:'rev',k:'区本级一般公共预算收入',v:'46.05',unit:'亿元',yoy:'-4.1%',status:'b',note:'税收 26.30 亿、+1.7%'},
  {id:'proj',k:'重点项目进度',yoy:'71.27%',status:'n',note:'138 宗 · 年度计划 144.59 亿 · 完成 103.05 亿 · 产业类仅 60.83%'}
],
 targets:[
  {k:'GDP 增长',goal:'+6%',actual:'+1.1%',gap:'-4.9pct'},
  {k:'规上工业增加值',goal:'+9%',actual:'+0.8%',gap:'-8.2pct'},
  {k:'固定资产投资',goal:'+1%',actual:'-40.7%',gap:'-41.7pct'},
  {k:'社会消费品零售',goal:'+6%',actual:'+2.0%',gap:'-4.0pct'},
  {k:'区本级财政收入',goal:'+3%',actual:'-4.1%',gap:'-7.1pct'}
]};
// 2025 人口背景（统计公报口径），供报告页说明使用
// 全站期次汇总：官方口径截止 / 当期快报截止 / 最近核验
const HC_ASOF={official:'2025-12-31',officialLabel:'2025 全年',current:'2026-09-30',
 currentLabel:'2026 年 1-9 月',checked:'2026-11-09 09:11',
 note:'官方年度口径为 2025 全年终值；2026 年 1-9 月为当期累计快报，两类增速不可直接比较。'};

const HC_POP={year:2025,pop:'159.78',urban:'85.74%',per_gdp:'75309',per_gdp_wan:'7.53',per_gdp_yoy:'+3.0%'};

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
g.HC_SOURCE=HC_SOURCE; g.HC_OFFICIAL=HC_OFFICIAL; g.HC_CURRENT=HC_CURRENT;
g.HC_POP=HC_POP; g.HC_ASOF=HC_ASOF;
g.SCENES=SCENES; g.SEED=SEED; g.N=N;
g.runScene=runScene; g.getScene=getScene; g.initialScene=initialScene;
g.saveScene=saveScene; g.makeUrl=makeUrl; g.fmt=fmt;
g.stateLabels=stateLabels; g.perfCSV=perfCSV;
})(window);
