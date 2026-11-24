/* 惠城产业风洞 · 统一导航与界面脚本
   只负责：全站顶栏、章节目录、上一页/下一页、页面标识。
   不读取、不修改任何模型数据，不改变各页原有交互。 */
(function () {
  'use strict';

  var PAGES = [
    { url: 'briefing.html',       n: '00', group: '决策简报', label: '决策简报',   desc: '3 分钟读完：三句话看清惠城当下' },
    { url: 'spotlight.html',      n: '00·2', group: '决策简报', label: '公众传播',   desc: '三个数字，没有一个是 GDP' },
    { url: 'poster.html',         n: '00·3', group: '决策简报', label: '冲击海报',   desc: '一句话一张图，转得出去' },
    { url: 'index.html',          n: '01', group: '开篇',     label: '风洞',       desc: '拍板之前，先在这里走一遍' },
    { url: 'holo.html',           n: '02', group: '看见世界', label: '全息关系',   desc: '一眼看全貌，细节在下一页' },
    { url: 'holo-workspace.html', n: '03', group: '看见世界', label: '全息工作区', desc: '关系网络、情报流与变化详情' },
    { url: 'today.html',          n: '04', group: '看见世界', label: '钱去哪了',   desc: '钱，可能花到哪里了' },
    { url: 'fun.html',            n: '05', group: '看见世界', label: '风向标',     desc: '今晚，谁能把你留在惠城' },
    { url: 'choices.html',        n: '06', group: '推演未来', label: '路径',       desc: '你关心的事，挂在哪条路上' },
    { url: 'future.html',         n: '07', group: '推演未来', label: '未来',       desc: '同一件事，扔一百次，看它落在哪' },
    { url: 'windtunnel.html',     n: '08', group: '推演未来', label: '风洞测试',   desc: '如果这件事真的发生，哪一段先撑不住' },
    { url: 'commute.html',        n: '09', group: '推演未来', label: '通勤案例',   desc: '你每天堵的 40 分钟，谁在替你付' },
    { url: 'blindspot.html',      n: '10', group: '推演未来', label: '忽略了什么', desc: '你以为最要紧的，可能排不到第一' },
    { url: 'network.html',        n: '11', group: '关系视角', label: '建构世界',   desc: '这张网是怎么搭起来的' },
    { url: 'evolution.html',      n: '11·2', group: '关系视角', label: '网络的演变', desc: '网络不是每天重画，是等它真变了' },
    { url: 'role.html',           n: '12', group: '关系视角', label: '你在哪',     desc: '同一件事，你在哪一段上' },
    { url: 'who.html',            n: '13', group: '关系视角', label: '掂量',       desc: '这一页给核对用，不是入门' },
    { url: 'report.html',         n: '14', group: '汇总与实验', label: '报告',     desc: '完整底稿，供逐条核对' },
    { url: 'future-lab.html',     n: '15', group: '汇总与实验', label: '未来实验室', desc: '把条件改一改，结论就变了' },
    { url: 'ending.html',         n: '16', group: '收尾',     label: '结语',       desc: '让每一个重大决策，先跑一遍' },
    { url: 'home.html',           n: '17', group: '收尾',     label: '关于',       desc: '这是什么、给谁用、边界在哪' },
    { url: 'decision-lab.html',   n: '18', group: '决策实验室', label: '决策模拟实验室', desc: '内部工作台，不对外' }
  ];

  var SVG = {
    prev: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M9.8 3.6 5.4 8l4.4 4.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6.2 3.6 10.6 8l-4.4 4.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    menu: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2.2" y="2.2" width="4.6" height="4.6" rx="1.3" stroke="currentColor" stroke-width="1.5"/><rect x="9.2" y="2.2" width="4.6" height="4.6" rx="1.3" stroke="currentColor" stroke-width="1.5"/><rect x="2.2" y="9.2" width="4.6" height="4.6" rx="1.3" stroke="currentColor" stroke-width="1.5"/><rect x="9.2" y="9.2" width="4.6" height="4.6" rx="1.3" stroke="currentColor" stroke-width="1.5"/></svg>',
    close: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    down: '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2.2 4 5 6.8 7.8 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function slug() {
    var p = location.pathname.split('/').pop() || 'index.html';
    if (p === '' || p === '/') return 'index.html';
    return p;
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function buildBar(current, entry) {
    var bar = el('header', 'ds-bar');
    bar.id = 'dsBar';

    var brand = el('a', 'ds-brand');
    brand.href = 'index.html';
    brand.setAttribute('aria-label', '惠城产业风洞 · 返回首页');
    brand.innerHTML =
      '<span class="ds-mark" aria-hidden="true">惠</span>' +
      '<span class="ds-brand-text"><span class="ds-brand-name">惠城产业风洞</span>' +
      '<span class="ds-brand-sub">HUI CHENG · WIND TUNNEL</span></span>';

    var mid = el('div', 'ds-bar-mid');
    var chapter = el('button', 'ds-chapter');
    chapter.type = 'button';
    chapter.id = 'dsChapterBtn';
    chapter.setAttribute('aria-haspopup', 'dialog');
    chapter.setAttribute('aria-expanded', 'false');
    chapter.setAttribute('aria-controls', 'dsSheet');
    chapter.setAttribute('aria-label', '打开章节目录，当前：' + entry.label);
    chapter.innerHTML =
      '<span class="ds-chapter-num">' + entry.n + '</span>' +
      '<span class="ds-chapter-name">' + entry.label + '</span>' + SVG.down;
    mid.appendChild(chapter);

    var actions = el('div', 'ds-bar-actions');
    var prev = current > 0 ? PAGES[current - 1] : null;
    var next = current >= 0 && current < PAGES.length - 1 ? PAGES[current + 1] : null;

    function navBtn(page, dir, label) {
      var a = el('a', 'ds-iconbtn');
      if (page) {
        a.href = page.url;
        a.title = label + ' · ' + page.label;
        a.setAttribute('aria-label', label + '：' + page.label);
      } else {
        a.href = '#';
        a.setAttribute('aria-disabled', 'true');
        a.setAttribute('aria-label', label + '：没有了');
        a.addEventListener('click', function (e) { e.preventDefault(); });
      }
      a.innerHTML = SVG[dir];
      return a;
    }
    actions.appendChild(navBtn(prev, 'prev', '上一页'));
    actions.appendChild(navBtn(next, 'next', '下一页'));
    var menuBtn = el('button', 'ds-iconbtn');
    menuBtn.type = 'button';
    menuBtn.id = 'dsMenuBtn';
    menuBtn.setAttribute('aria-label', '打开章节目录');
    menuBtn.setAttribute('aria-haspopup', 'dialog');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-controls', 'dsSheet');
    menuBtn.innerHTML = SVG.menu;
    actions.appendChild(menuBtn);

    bar.appendChild(brand);
    bar.appendChild(mid);
    bar.appendChild(actions);
    return bar;
  }

  function buildSheet(current) {
    var sheet = el('div', 'ds-sheet');
    sheet.id = 'dsSheet';
    sheet.hidden = true;
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', '章节目录');

    var scrim = el('div', 'ds-scrim');
    scrim.setAttribute('data-ds-close', '');

    var panel = el('div', 'ds-panel');
    panel.innerHTML =
      '<div class="ds-panel-head">' +
        '<div><div class="ds-panel-title">体验路线</div>' +
        '<div class="ds-panel-sub">'+PAGES.length+' 页，从看见关系开始 · 可自由跳转</div></div>' +
        '<button type="button" class="ds-panel-close" data-ds-close aria-label="关闭目录">' + SVG.close + '</button>' +
      '</div>';

    var steps = el('nav', 'ds-steps');
    steps.setAttribute('aria-label', PAGES.length+' 个章节');
    var lastGroup = '';
    PAGES.forEach(function (p, i) {
      if (p.group !== lastGroup) {
        var gh = el('div', 'ds-step-group');
        gh.textContent = p.group;
        steps.appendChild(gh);
        lastGroup = p.group;
      }
      var a = el('a', 'ds-step');
      a.href = p.url;
      if (i === current) a.setAttribute('aria-current', 'page');
      a.innerHTML =
        '<span class="ds-step-n">' + p.n + '</span>' +
        '<span class="ds-step-l">' + p.label + '</span>' +
        '<span class="ds-step-d">' + p.desc + '</span>';
      steps.appendChild(a);
    });
    panel.appendChild(steps);

    sheet.appendChild(scrim);
    sheet.appendChild(panel);
    return sheet;
  }

  function mount() {
    var file = slug();
    var idx = PAGES.map(function (p) { return p.url; }).indexOf(file);
    if (idx < 0) return;
    document.body.dataset.page = file.replace('.html', '');
    if (document.getElementById('dsBar')) return;
    var entry = PAGES[idx];

    var bar = buildBar(idx, entry);
    var sheet = buildSheet(idx);
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.appendChild(sheet);

    var triggers = [document.getElementById('dsChapterBtn'), document.getElementById('dsMenuBtn')];
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      sheet.hidden = false;
      triggers.forEach(function (t) { t.setAttribute('aria-expanded', 'true'); });
      var first = sheet.querySelector('.ds-step[aria-current="page"]') || sheet.querySelector('.ds-step');
      if (first) first.focus({ preventScroll: true });
      document.documentElement.style.overflow = 'hidden';
    }
    function close() {
      if (sheet.hidden) return;
      sheet.hidden = true;
      triggers.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
      document.documentElement.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    triggers.forEach(function (t) {
      t.addEventListener('click', function () { sheet.hidden ? open() : close(); });
    });
    sheet.addEventListener('click', function (e) {
      if (e.target.closest('[data-ds-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && !sheet.hidden) {
        var f = sheet.querySelectorAll('a[href],button:not([disabled])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        bar.setAttribute('data-scrolled', window.scrollY > 8 ? 'true' : 'false');
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
