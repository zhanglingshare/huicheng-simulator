/* 惠城产业风洞 · 全站目录入口（自包含，无外部依赖）
   用途：给未接入 ui/ui.css 的整体设计页（风洞首页、浅色全息页等）提供统一目录。
   只创建自己的 DOM 与样式（全部选择器带 #sn- 前缀），不改动页面其余任何样式。
   页目与 ui/ui.js 的 PAGES 保持一致（17 页）。
*/
(function () {
  'use strict';

  var PAGES = [
    { url: 'index.html',          n: '01', group: '开篇',       label: '风洞',       desc: '产业决策，先过风洞' },
    { url: 'holo.html',           n: '02', group: '看见世界',   label: '全息关系',   desc: '钱和关系连在谁身上' },
    { url: 'holo-workspace.html', n: '03', group: '看见世界',   label: '全息工作区', desc: '关系网络、情报流与变化详情' },
    { url: 'today.html',          n: '04', group: '看见世界',   label: '钱去哪了',   desc: '追问资金去向与消费路径' },
    { url: 'fun.html',            n: '05', group: '看见世界',   label: '风向标',     desc: '今晚，谁能把你留在惠城' },
    { url: 'choices.html',        n: '06', group: '推演未来',   label: '路径',       desc: '先选方向，再看可能' },
    { url: 'future.html',         n: '07', group: '推演未来',   label: '未来',       desc: '把未来反复扔进模型' },
    { url: 'windtunnel.html',     n: '08', group: '推演未来',   label: '风洞测试',   desc: '给假设持续加压' },
    { url: 'commute.html',        n: '09', group: '推演未来',   label: '通勤案例',   desc: '通勤可能带来的影响' },
    { url: 'blindspot.html',      n: '10', group: '推演未来',   label: '忽略了什么', desc: '城市承载与居民生活的盲点' },
    { url: 'network.html',        n: '11', group: '关系视角',   label: '建构世界',   desc: '把关系一层层搭起来' },
    { url: 'role.html',           n: '12', group: '关系视角',   label: '你在哪',     desc: '你在网里哪个位置' },
    { url: 'who.html',            n: '13', group: '关系视角',   label: '掂量',       desc: '换几个角度再掂一掂' },
    { url: 'report.html',         n: '14', group: '汇总与实验', label: '报告',       desc: '把观察整理成可讨论的材料' },
    { url: 'future-lab.html',     n: '15', group: '汇总与实验', label: '未来实验室', desc: '动手调参，做多实验舱挑战' },
    { url: 'ending.html',         n: '16', group: '收尾',       label: '结语',       desc: '回到人、城市与决策责任' },
    { url: 'home.html',           n: '17', group: '收尾',       label: '关于',       desc: '这个项目是什么' }
  ];

  var CSS = '' +
  '#sn-btn{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(16px,env(safe-area-inset-bottom));z-index:2147482000;' +
    'display:inline-flex;align-items:center;gap:7px;height:40px;padding:0 14px 0 6px;border-radius:999px;' +
    'border:1px solid var(--sn-line,rgba(0,0,0,.12));background:var(--sn-chip,rgba(255,255,255,.86));' +
    'color:var(--sn-ink,#16233a);font:600 13px/1 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;' +
    'cursor:pointer;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);box-shadow:0 8px 24px -12px rgba(0,0,0,.4)}' +
  '#sn-btn .sn-dot{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--sn-accent,#0a84ff);color:#fff;font-weight:700;font-size:13px}' +
  '#sn-sheet{position:fixed;inset:0;z-index:2147483000;display:none}' +
  '#sn-sheet[data-open="true"]{display:block}' +
  '#sn-sheet .sn-scrim{position:absolute;inset:0;background:rgba(8,10,14,.42);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}' +
  '#sn-panel{position:absolute;left:0;right:0;bottom:0;max-height:82%;overflow:auto;padding:14px 16px calc(22px + env(safe-area-inset-bottom));' +
    'border-radius:20px 20px 0 0;background:var(--sn-panel,#fff);color:var(--sn-ink,#16233a);box-shadow:0 -20px 50px -20px rgba(0,0,0,.45)}' +
  '#sn-panel .sn-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:6px}' +
  '#sn-panel .sn-title{font:700 15px/1.3 inherit}' +
  '#sn-panel .sn-sub{font:500 12px/1.5 inherit;opacity:.55;margin-top:3px}' +
  '#sn-panel .sn-close{flex:0 0 auto;width:32px;height:32px;border-radius:50%;border:1px solid var(--sn-line,rgba(0,0,0,.12));background:transparent;color:inherit;font-size:16px;cursor:pointer}' +
  '#sn-panel .sn-group{font:700 11px/1 inherit;letter-spacing:.08em;opacity:.42;margin:14px 0 6px;text-transform:uppercase}' +
  '#sn-panel a.sn-item{display:flex;align-items:baseline;gap:9px;padding:10px 2px;text-decoration:none;color:inherit;border-bottom:1px solid var(--sn-hair,rgba(0,0,0,.06))}' +
  '#sn-panel a.sn-item:last-child{border-bottom:0}' +
  '#sn-panel a.sn-item .sn-n{font:700 12px/1 inherit;opacity:.45;min-width:20px}' +
  '#sn-panel a.sn-item .sn-l{font:700 14px/1.3 inherit}' +
  '#sn-panel a.sn-item .sn-d{font:500 12px/1.3 inherit;opacity:.5;margin-left:auto;text-align:right;max-width:52%}' +
  '#sn-panel a.sn-item[aria-current="page"]{color:var(--sn-accent,#0a84ff)}' +
  '#sn-panel a.sn-item[aria-current="page"] .sn-l::after{content:" · 当前";font-weight:600;font-size:11px;opacity:.7}' +
  'body[data-sn-theme="dark"]{--sn-chip:rgba(20,22,26,.82);--sn-panel:#141619;--sn-ink:#f5f5f7;--sn-line:rgba(255,255,255,.16);--sn-hair:rgba(255,255,255,.09);--sn-accent:#4da3ff;--sn-dot-bg:rgba(10,132,255,.18)}';

  function file() {
    var p = location.pathname.split('/').pop();
    return p || 'index.html';
  }

  function theme() {
    var t = document.body.getAttribute('data-sn-theme');
    if (t) return t;
    var bg = getComputedStyle(document.body).backgroundColor || '';
    var m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
      var lum = (0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]);
      return lum < 96 ? 'dark' : 'light';
    }
    return 'light';
  }

  function mount() {
    if (document.getElementById('sn-btn')) return;
    var cur = file();
    var idx = PAGES.map(function (p) { return p.url; }).indexOf(cur);
    if (idx < 0) return;
    document.body.setAttribute('data-sn-theme', theme());

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var ext = document.querySelector('[data-sn-trigger]');
    var btn = ext || document.createElement('button');
    if (!ext) {
    btn.id = 'sn-btn';
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', '打开全站目录，当前第 ' + (idx + 1) + ' 页：' + PAGES[idx].label);
    btn.innerHTML = '<span class="sn-dot" aria-hidden="true">目</span><span>' + PAGES[idx].n + '/' + PAGES.length + ' · 目录</span>';
    }

    var sheet = document.createElement('div');
    sheet.id = 'sn-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', '全站目录');

    var panel = document.createElement('div');
    panel.id = 'sn-panel';

    var head = document.createElement('div');
    head.className = 'sn-head';
    head.innerHTML = '<div><div class="sn-title">惠城产业风洞 · 全站目录</div>' +
      '<div class="sn-sub">' + PAGES.length + ' 页，可自由跳转 · 当前 ' + PAGES[idx].n + ' ' + PAGES[idx].label + '</div></div>';
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'sn-close';
    close.setAttribute('aria-label', '关闭目录');
    close.textContent = '✕';
    head.appendChild(close);
    panel.appendChild(head);

    var last = '';
    PAGES.forEach(function (p, i) {
      if (p.group !== last) {
        var g = document.createElement('div');
        g.className = 'sn-group';
        g.textContent = p.group;
        panel.appendChild(g);
        last = p.group;
      }
      var a = document.createElement('a');
      a.className = 'sn-item';
      a.href = p.url;
      if (i === idx) a.setAttribute('aria-current', 'page');
      a.innerHTML = '<span class="sn-n">' + p.n + '</span><span class="sn-l">' + p.label + '</span><span class="sn-d">' + p.desc + '</span>';
      panel.appendChild(a);
    });

    var scrim = document.createElement('div');
    scrim.className = 'sn-scrim';
    sheet.appendChild(scrim);
    sheet.appendChild(panel);

    if (!ext) document.body.appendChild(btn);
    document.body.appendChild(sheet);

    function open() {
      sheet.setAttribute('data-open', 'true');
      btn.setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';
      var cur = panel.querySelector('a[aria-current="page"]');
      if (cur) panel.scrollTop = Math.max(0, cur.offsetTop - panel.clientHeight / 2);
    }
    function shut() {
      sheet.removeAttribute('data-open');
      btn.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
    }
    btn.addEventListener('click', open);
    close.addEventListener('click', shut);
    scrim.addEventListener('click', shut);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
