/* ============================================================
   lens · 惠城结构透镜 专用数据
   指标口径引用 hc-viz/data.js（只读）；本文件只承载结构透镜的
   定性内容与项目清单。数字均来自官方公开来源，缺失用 null，
   页面统一显示「暂未公开」，不估算、不补全。
   ============================================================ */
(function(g){
'use strict';

const LENS_META={
  name:'惠城结构透镜',
  asof:'2026 年 1-9 月',
  released:'2026-11-03',
  checked:'2026-11-09',
  note:'结构透镜只呈现可向公开来源回指的事实与项目状态；数据只到行业大类，不做精确关联计算，算不出的部分留白。'
};

/* ---------- 能力分块（状态灯：grow/flat/shrink） ---------- */
const CAPABILITIES=[
 {id:'cap-invest',name:'工业投资与产能',state:'shrink',stateLabel:'在缩',
  anchor:[{k:'第二产业',v:'-1.6%'},{k:'固定资产投资',v:'-40.7%'},{k:'工业投资',v:'-46.1%'}],
  note:'二产是全市唯一负增长的产业（全市二产 +4.9%）；投资跌幅比上半年收窄 7.7 个百分点，但仍处深跌，新增产能扩张明显放缓。',
  adjacent:[]},
 {id:'cap-dz',name:'电子信息',state:'flat',stateLabel:'微增',
  anchor:[{k:'规上工业增加值',v:'+0.8%'},{k:'全市同期',v:'+7.1%'}],
  note:'增速较 1-8 月的 +1.4% 回落，显著低于全市；胜宏、润众、沃尔核材等企业在区内集聚，多个项目仍在建。',
  adjacent:['智能终端','AI 硬件','精密电子组件']},
 {id:'cap-xcl',name:'新材料',state:'flat',stateLabel:'在建待投产',
  anchor:[{k:'金澜新材料',v:'10.5 亿在建'},{k:'天濠新材料',v:'4.84 亿在建'}],
  note:'两个龙头项目均处建设阶段、尚未投产，达产产值还未进入当期统计；投产后的实际贡献需以官方数据为准。',
  adjacent:['高分子材料','轻合金','电池材料']},
 {id:'cap-ai',name:'AI 与机器人',state:'flat',stateLabel:'培育中',
  anchor:[{k:'市级方案',v:'已印发'},{k:'区级方案',v:'制定中'}],
  note:'利元亨为链主企业；市级产业方案已印发，区级方案仍在制定，产业规模尚未在当期指标中单独体现。',
  adjacent:['智能装备','工业软件','机器人核心部件']},
 {id:'cap-fw',name:'生产性服务业',state:'grow',stateLabel:'在长',
  anchor:[{k:'三产占比',v:'69%'},{k:'2025 三产增加值',v:'+5.2%'}],
  note:'江北 CBD 企业会客厅已服务约 300 家企业；服务业是经济体量的主体，2025 年三产增加值增速高于 GDP 整体。',
  adjacent:['研发服务','现代物流','金融与结算']},
 {id:'cap-wh',name:'文旅生态',state:'flat',stateLabel:'温和',
  anchor:[{k:'社会消费品零售',v:'+2.0%'},{k:'全市同期',v:'+0.3%'}],
  note:'西湖 5A、水东街夜经济持续引流，消费增速高于全市；文旅对消费的单独贡献未公开，客流与消费额不做换算。',
  adjacent:['夜间经济','文旅文创','滨水休闲']}
];

/* ---------- 产业链环节：原料→加工→配套→出货 ---------- */
const CHAIN=[
 {name:'原料',state:'ok',stateLabel:'在修复',detail:'进口 +22.6%、进出口 +11.4%'},
 {name:'加工制造',state:'bad',stateLabel:'扩产卡住',detail:'工业投资 -46.1%'},
 {name:'配套',state:'warn',stateLabel:'放缓',detail:'基建投资 -28.3%'},
 {name:'出货',state:'ok',stateLabel:'相对稳',detail:'出口 +4.4%'}
];
const CHAIN_NOTE='出货端相对稳、扩产端深跌：需求在修复，产能扩张与项目接续是当前主要卡点。';

/* ---------- 基础盘项目（基础经济） ---------- */
const FOUNDATIONS=[
 {id:'f-house',ico:'house',name:'住房保障',place:'江北 / 水口等',state:'build',stateLabel:'多项目推进',
  rows:[
   {k:'下良人才社区',v:'300 套 · 已投用'},
   {k:'荔枝城',v:'890 套 · 已封顶'},
   {k:'金龙大道 / 水口西区两宗配售房',v:null}]},
 {id:'f-med',ico:'med',name:'医疗',place:'江北街道',state:'plan',stateLabel:'用地预审',
  rows:[
   {k:'市一院三期规划床位',v:'325 床'},
   {k:'总建筑面积',v:'50900 ㎡'},
   {k:'现状开放床位',v:null}]},
 {id:'f-edu',ico:'edu',name:'教育',place:'惠城',state:'plan',stateLabel:'规划公示',
  rows:[
   {k:'实验中学附属学校',v:'规划许可批前公示'},
   {k:'办学规模 / 学位数',v:null}]},
 {id:'f-util',ico:'util',name:'公用基础设施',place:'马安',state:'plan',stateLabel:'受理阶段',
  rows:[
   {k:'中韩产业园马安南园基础设施一期',v:'规划许可受理'},
   {k:'投资规模',v:null}]},
 {id:'f-job',ico:'job',name:'本地就业与消费',place:'全区',state:'live',stateLabel:'基本盘',
  rows:[
   {k:'常住人口',v:'159.78 万 · 城镇化 85.74%'},
   {k:'社会消费品零售',v:'622.07 亿 · +2.0%'},
   {k:'区本级一般公共预算收入',v:'46.05 亿 · -4.1%'}]}
];

/* ---------- 公开来源 ---------- */
const SOURCES=[
 {id:'L1',label:'惠城区 2026 年 1-9 月经济运行情况（区统计局，2026-11-03）',
  url:'http://www.hcq.gov.cn/zfxxgkml/hcqtjj/ywgz/content/post_5886184.html'},
 {id:'L2',label:'惠州市第一人民医院三期用地预审（选址意见书）批前公示（区自然资源局，2026-11-09）',
  url:'http://www.hcq.gov.cn/hzhczrzyj/gkmlpt/content/5/5890/post_5890084.html'},
 {id:'L3',label:'南方+：惠州市第一人民医院将扩建（2026-11-08）',
  url:'https://www.nfnews.com/content/A6EB5mq7oK.html'},
 {id:'L4',label:'4 家惠企拟认定跨国公司地区总部（惠州日报，2026-11-08）',
  url:'https://www.huizhou.gov.cn/zwgk/hzsz/zwyw/content/post_5889316.html'},
 {id:'L5',label:'惠城区自然资源局公示列表（项目受理与批前公示集散地）',
  url:'http://www.hcq.gov.cn/hzhczrzyj/gkmlpt/mindex'}
];

g.LENS_META=LENS_META; g.CAPABILITIES=CAPABILITIES; g.CHAIN=CHAIN; g.CHAIN_NOTE=CHAIN_NOTE;
g.FOUNDATIONS=FOUNDATIONS; g.LENS_SOURCES=SOURCES;
})(window);
