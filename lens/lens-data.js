/* ============================================================
   lens · 惠城结构透镜 数据
   数字均来自官方公开来源（hc-viz/data.js 同口径）；缺失用 null，
   不估算、不补全。本文件同时承载图表数据与精简清单。
   ============================================================ */
(function(g){
'use strict';

const LENS_META={
  name:'惠城结构透镜', asof:'2026 年 1-9 月', released:'2026-11-03', checked:'2026-11-09',
  note:'只呈现可向公开来源回指的事实；数据只到行业大类，算不出的部分留白。'
};

/* ===== 能力底盘 · 图表数据 ===== */

/* 1) 当期同比发散条形（%，按值排序：负→正） */
const YOY_BARS=[
 {name:'工业投资',v:-46.1},
 {name:'固定资产投资',v:-40.7},
 {name:'区财政收入',v:-4.1},
 {name:'第二产业',v:-1.6},
 {name:'规上工业增加值',v:0.8},
 {name:'税收',v:1.7},
 {name:'社会消费品零售',v:2.0},
 {name:'出口',v:4.4},
 {name:'外贸进出口',v:11.4}
];

/* 2) 惠城 vs 全市（同比 %） */
const CITY_COMPARE=[
 {name:'GDP',hc:1.1,city:3.7},
 {name:'第二产业',hc:-1.6,city:4.9},
 {name:'规上工业',hc:0.8,city:7.1},
 {name:'社会消费品零售',hc:2.0,city:0.3}
];

/* 3) 年初目标 vs 实际（%） */
const TARGET_GAP=[
 {name:'GDP',goal:6,actual:1.1},
 {name:'规上工业',goal:9,actual:0.8},
 {name:'固定资产投资',goal:1,actual:-40.7},
 {name:'社会消费品零售',goal:6,actual:2.0},
 {name:'区财政收入',goal:3,actual:-4.1}
];

/* 4) 产业链环节状态（ok/warn/bad） */
const CHAIN=[
 {name:'原料',state:'ok',detail:'进口 +22.6%'},
 {name:'加工制造',state:'bad',detail:'工业投资 -46.1%'},
 {name:'配套',state:'warn',detail:'基建投资 -28.3%'},
 {name:'出货',state:'ok',detail:'出口 +4.4%'}
];

/* 5) 能力块状态灯（精简，相邻可能保留） */
const CAP_LIGHTS=[
 {name:'工业投资与产能',state:'shrink',adj:[]},
 {name:'电子信息',state:'flat',adj:['智能终端','AI 硬件','精密组件']},
 {name:'新材料',state:'flat',adj:['高分子','轻合金','电池材料']},
 {name:'AI 与机器人',state:'flat',adj:['智能装备','工业软件','机器人部件']},
 {name:'生产性服务业',state:'grow',adj:['研发服务','现代物流','金融结算']},
 {name:'文旅生态',state:'flat',adj:['夜间经济','文旅文创','滨水休闲']}
];

/* ===== 基础盘 · 图表数据 ===== */

/* 保障房套数（已公开的两宗；公示中套数未公开的不画） */
const HOUSE_BARS=[
 {name:'下良人才社区',v:300,stage:'已投用'},
 {name:'荔枝城',v:890,stage:'已封顶'}
];
const HOUSE_PENDING='金龙大道 / 水口西区两宗配售房：公示中，套数暂未公开';

/* 人口与城镇化 */
const POP={total:'159.78',urban:85.74,unit:'万'};

/* 医疗（市一院三期规划） */
const MED={beds:325,area:50900,curBeds:null};

/* 主要 KPI（大数字卡） */
const KPI=[
 {k:'社会消费品零售',v:'622.07',unit:'亿元',yoy:'+2.0%',state:'grow'},
 {k:'区本级财政收入',v:'46.05',unit:'亿元',yoy:'-4.1%',state:'shrink'},
 {k:'外贸进出口',v:'337.0',unit:'亿元',yoy:'+11.4%',state:'grow'},
 {k:'重点项目进度',v:'71.27',unit:'%',yoy:'产业类 60.83%',state:'flat'}
];

/* 项目阶段（流程可视化） */
const STAGES=[
 {name:'下良人才社区',stage:'投用',code:'live'},
 {name:'荔枝城',stage:'封顶',code:'build'},
 {name:'市一院三期',stage:'用地预审',code:'plan'},
 {name:'实验中学附属学校',stage:'规划公示',code:'plan'},
 {name:'马安南园基础设施',stage:'受理',code:'plan'}
];

/* 留白清单（基础盘未公开项） */
const BLANKS=[
 '两宗配售房套数',
 '市一院现状开放床位',
 '附属学校学位数',
 '马安南园投资规模'
];

/* ===== 公开来源 ===== */
const SOURCES=[
 {id:'L1',label:'惠城区 2026 年 1-9 月经济运行情况（区统计局，2026-11-03）',
  url:'http://www.hcq.gov.cn/zfxxgkml/hcqtjj/ywgz/content/post_5886184.html'},
 {id:'L2',label:'惠州市第一人民医院三期用地预审批前公示（区自然资源局，2026-11-09）',
  url:'http://www.hcq.gov.cn/hzhczrzyj/gkmlpt/content/5/5890/post_5890084.html'},
 {id:'L3',label:'南方+：惠州市第一人民医院将扩建（2026-11-08）',
  url:'https://www.nfnews.com/content/A6EB5mq7oK.html'},
 {id:'L4',label:'4 家惠企拟认定跨国公司地区总部（惠州日报，2026-11-08）',
  url:'https://www.huizhou.gov.cn/zwgk/hzsz/zwyw/content/post_5889316.html'},
 {id:'L5',label:'惠城区自然资源局公示列表',
  url:'http://www.hcq.gov.cn/hzhczrzyj/gkmlpt/mindex'}
];

g.LENS_META=LENS_META;
g.YOY_BARS=YOY_BARS; g.CITY_COMPARE=CITY_COMPARE; g.TARGET_GAP=TARGET_GAP;
g.CHAIN=CHAIN; g.CAP_LIGHTS=CAP_LIGHTS;
g.HOUSE_BARS=HOUSE_BARS; g.HOUSE_PENDING=HOUSE_PENDING; g.POP=POP; g.MED=MED;
g.KPI=KPI; g.STAGES=STAGES; g.BLANKS=BLANKS; g.LENS_SOURCES=SOURCES;
})(window);
