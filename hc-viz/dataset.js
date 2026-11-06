/* 惠城数据适配层 · 全站唯一数据读取入口
   原则：只读不写；读不到就明确报错，绝不返回旧数字兜底。
   用法：
     HCData.relations()  -> Promise<[evidence, changes, sources]>  （顺序与旧内嵌结构一致）
     HCData.intel()      -> Promise<{hot, life}>
     HCData.asOf()       -> Promise<'2026-11-06'>
   版本：按天切换 ?v=YYYYMMDD，当天内可缓存，跨天自动取新。 */
(function (g) {
  'use strict';

  var script = document.currentScript;
  var root = '';
  if (script && script.src) root = script.src.replace(/hc-viz\/dataset\.js(?:\?.*)?$/, '');

  var now = new Date();
  var version = '' + now.getFullYear() + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2);
  var TIMEOUT = 8000;
  var cache = {};

  function getJSON(rel) {
    if (cache[rel]) return cache[rel];
    var p = new Promise(function (resolve, reject) {
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = setTimeout(function () {
        if (ctrl) ctrl.abort();
        delete cache[rel];
        reject(new Error(rel + ' 读取超时（' + TIMEOUT + 'ms）'));
      }, TIMEOUT);
      var opts = { cache: 'no-store' };
      if (ctrl) opts.signal = ctrl.signal;
      fetch(root + rel + '?v=' + version, opts)
        .then(function (r) {
          if (!r.ok) throw new Error(rel + ' HTTP ' + r.status);
          return r.json();
        })
        .then(function (j) { clearTimeout(timer); resolve(j); })
        .catch(function (e) {
          clearTimeout(timer);
          delete cache[rel];
          reject(new Error(e && e.message ? e.message : rel + ' 读取失败'));
        });
    });
    cache[rel] = p;
    return p;
  }

  var HCData = {
    root: root,
    version: version,
    getJSON: getJSON,

    relations: function () {
      return Promise.all([
        getJSON('data/relationship-evidence-v1.json'),
        getJSON('data/relationship-changes-v1.json'),
        getJSON('data/relationship-sources-v1.json')
      ]).then(function (a) {
        var ev = a[0], ch = a[1], sc = a[2];
        if (!ev || !Array.isArray(ev.nodes) || !Array.isArray(ev.edges)) throw new Error('relationship-evidence-v1.json 结构不符合预期');
        if (!ch || !Array.isArray(ch.changes)) throw new Error('relationship-changes-v1.json 结构不符合预期');
        if (!sc || !Array.isArray(sc.sources)) throw new Error('relationship-sources-v1.json 结构不符合预期');
        return [ev, ch, sc];
      });
    },

    relationsObject: function () {
      return this.relations().then(function (a) {
        return { evidence: a[0], changes: a[1], sources: a[2] };
      });
    },

    intel: function () {
      return Promise.all([getJSON('hot.json'), getJSON('life.json')]).then(function (a) {
        if (!a[0] || !Array.isArray(a[0].items)) throw new Error('hot.json 结构不符合预期');
        if (!a[1] || !Array.isArray(a[1].spots)) throw new Error('life.json 结构不符合预期');
        return { hot: a[0], life: a[1] };
      });
    },

    asOf: function () {
      return this.relations().then(function (a) { return a[0].generated_at || ''; });
    }
  };

  g.HCData = HCData;
})(window);
