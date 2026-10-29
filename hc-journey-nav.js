/* 惠城产业风洞 · 10 页统一章节导航。仅处理导航 DOM，不调用模型或读取数据。 */
(function(){
  'use strict';
  var pages=[
    {url:'index.html',label:'序章',desc:'从这里开始'},
    {url:'holo-workspace.html',label:'全息工作区',desc:'看见关系变化'},
    {url:'today.html',label:'钱去哪了',desc:'追问资金去向'},
    {url:'fun.html',label:'风向标 · 去哪玩',desc:'城市生活线索'},
    {url:'choices.html',label:'路径',desc:'先确定发展路径'},
    {url:'future.html',label:'未来',desc:'再观察可能区间'},
    {url:'windtunnel.html',label:'风洞测试',desc:'情景压力测试'},
    {url:'blindspot.html',label:'忽略了什么',desc:'留意城市盲点'},
    {url:'report.html',label:'报告',desc:'整理观察结果'},
    {url:'ending.html',label:'结语',desc:'回到人和城市'}
  ];
  function mount(){
    if(document.getElementById('hcjn-root'))return;
    var path=location.pathname.split('/').pop()||'index.html';
    var current=pages.findIndex(function(p){return p.url===path;});
    if(current<0)return;
    var root=document.createElement('nav');
    root.id='hcjn-root';root.className='hcjn-root';root.setAttribute('aria-label','惠城产业风洞 · 十页导航');
    var menu=document.createElement('div');menu.id='hcjn-menu';menu.className='hcjn-menu';menu.hidden=true;
    var head=document.createElement('div');head.className='hcjn-menuhead';head.textContent='惠城产业风洞 · 十页体验路线';menu.appendChild(head);
    pages.forEach(function(p,i){
      var a=document.createElement('a');a.href=p.url;
      if(i===current)a.setAttribute('aria-current','page');
      var num=document.createElement('span');num.className='hcjn-num';num.textContent=String(i+1).padStart(2,'0');
      var label=document.createElement('span');label.textContent=p.label;
      a.appendChild(num);a.appendChild(label);menu.appendChild(a);
    });
    var foot=document.createElement('div');foot.className='hcjn-menufoot';foot.textContent='浏览顺序可自由跳转 · 全站仅保留十个正式入口';menu.appendChild(foot);
    var bar=document.createElement('div');bar.className='hcjn-bar';
    function step(i,word,symbol){
      var x=document.createElement('a');x.className='hcjn-step';
      if(i<0||i>=pages.length){x.href='#';x.setAttribute('aria-disabled','true');x.tabIndex=-1;}
      else{x.href=pages[i].url;x.setAttribute('aria-label',word+'：'+pages[i].label);x.title=word+' · '+pages[i].label;}
      var ico=document.createElement('span');ico.className='hcjn-icon';ico.setAttribute('aria-hidden','true');ico.textContent=symbol;
      var long=document.createElement('span');long.className='hcjn-long';long.textContent=word;
      var short=document.createElement('span');short.className='hcjn-short';short.textContent=word==='上一页'?'上页':'下页';
      x.appendChild(ico);x.appendChild(long);x.appendChild(short);return x;
    }
    bar.appendChild(step(current-1,'上一页','‹'));
    var button=document.createElement('button');button.type='button';button.className='hcjn-toc';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','hcjn-menu');button.setAttribute('aria-label','打开十页目录，当前第'+(current+1)+'页：'+pages[current].label);
    var count=document.createElement('span');count.className='hcjn-count';count.textContent=String(current+1).padStart(2,'0')+'/10';
    var name=document.createElement('span');name.textContent=pages[current].label;
    var arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='⌃';
    button.appendChild(count);button.appendChild(name);button.appendChild(arrow);
    bar.appendChild(button);bar.appendChild(step(current+1,'下一页','›'));
    root.appendChild(menu);root.appendChild(bar);document.body.appendChild(root);
    function toggle(open){menu.hidden=!open;button.setAttribute('aria-expanded',String(open));arrow.textContent=open?'⌄':'⌃';}
    button.addEventListener('click',function(){toggle(menu.hidden);});
    document.addEventListener('pointerdown',function(e){if(!root.contains(e.target))toggle(false);});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!menu.hidden){toggle(false);button.focus();}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
  else mount();
})();