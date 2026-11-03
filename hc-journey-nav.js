/* 惠城产业风洞 · 全站统一章节导航。仅处理导航 DOM，不调用模型或读取数据。 */
(function(){
  'use strict';
  var groups=[
    {name:'开篇',items:[
      {url:'index.html',label:'序章',desc:'从这里开始'}
    ]},
    {name:'看见世界',items:[
      {url:'holo-workspace.html',label:'全息工作区',desc:'看见关系如何变化'},
      {url:'today.html',label:'钱去哪了',desc:'追问资金去向'},
      {url:'fun.html',label:'风向标',desc:'城市生活线索'}
    ]},
    {name:'推演未来',items:[
      {url:'choices.html',label:'路径',desc:'先确定发展路径'},
      {url:'future.html',label:'未来',desc:'观察可能区间'},
      {url:'windtunnel.html',label:'风洞测试',desc:'情景压力测试'},
      {url:'commute.html',label:'通勤案例',desc:'通勤可能的影响'},
      {url:'blindspot.html',label:'忽略了什么',desc:'留意城市盲点'}
    ]},
    {name:'汇总与实验',items:[
      {url:'report.html',label:'报告',desc:'整理观察结果'},
      {url:'future-lab.html',label:'未来实验室',desc:'动手调参做实验'}
    ]},
    {name:'收尾',items:[
      {url:'ending.html',label:'结语',desc:'回到人和城市'}
    ]}
  ];
  var pages=[];
  groups.forEach(function(g){g.items.forEach(function(it){it.group=g.name;pages.push(it);});});
  function mount(){
    if(document.getElementById('hcjn-root'))return;
    var path=location.pathname.split('/').pop()||'index.html';
    var current=pages.findIndex(function(p){return p.url===path;});
    if(current<0)return;
    var root=document.createElement('nav');
    root.id='hcjn-root';root.className='hcjn-root';root.setAttribute('aria-label','惠城产业风洞 · 全站导航');
    var menu=document.createElement('div');menu.id='hcjn-menu';menu.className='hcjn-menu';menu.hidden=true;
    var head=document.createElement('div');head.className='hcjn-menuhead';head.textContent='惠城产业风洞 · 体验路线';menu.appendChild(head);
    var idx=0;
    groups.forEach(function(g){
      var gh=document.createElement('div');gh.className='hcjn-group';gh.textContent=g.name;menu.appendChild(gh);
      g.items.forEach(function(p){
        var i=idx++;
        var a=document.createElement('a');a.href=p.url;
        if(i===current)a.setAttribute('aria-current','page');
        var num=document.createElement('span');num.className='hcjn-num';num.textContent=String(i+1).padStart(2,'0');
        var mid=document.createElement('span');mid.className='hcjn-mid';
        var label=document.createElement('span');label.className='hcjn-label';label.textContent=p.label;
        var desc=document.createElement('span');desc.className='hcjn-desc';desc.textContent=p.desc;
        mid.appendChild(label);mid.appendChild(desc);
        a.appendChild(num);a.appendChild(mid);menu.appendChild(a);
      });
    });
    var foot=document.createElement('div');foot.className='hcjn-menufoot';foot.textContent='浏览顺序可自由跳转 · 各页之间自由切换';menu.appendChild(foot);
    var bar=document.createElement('div');bar.className='hcjn-bar';
    function step(i,word,symbol){
      var x=document.createElement('a');x.className='hcjn-step';
      if(i<0||i>=pages.length){x.href='#';x.setAttribute('aria-disabled','true');x.tabIndex=-1;x.onclick=function(e){e.preventDefault();};}
      else{x.href=pages[i].url;x.setAttribute('aria-label',word+'：'+pages[i].label);x.title=word+' · '+pages[i].label;}
      var ico=document.createElement('span');ico.className='hcjn-icon';ico.setAttribute('aria-hidden','true');ico.textContent=symbol;
      var long=document.createElement('span');long.className='hcjn-long';long.textContent=word;
      var short=document.createElement('span');short.className='hcjn-short';short.textContent=word==='上一页'?'上页':'下页';
      x.appendChild(ico);x.appendChild(long);x.appendChild(short);return x;
    }
    bar.appendChild(step(current-1,'上一页','‹'));
    var button=document.createElement('button');button.type='button';button.className='hcjn-toc';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','hcjn-menu');button.setAttribute('aria-label','打开目录，当前第'+(current+1)+'页：'+pages[current].label);
    var count=document.createElement('span');count.className='hcjn-count';count.textContent=String(current+1).padStart(2,'0')+'/'+String(pages.length).padStart(2,'0');
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