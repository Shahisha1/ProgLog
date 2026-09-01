(function(){
  'use strict';
  var user=typeof getLastUser==='function'?getLastUser():null;
  if(!user||typeof getCabinetData!=='function') return;
  var cabinet=getCabinetData(user)||{profile:{username:user},games:[]};
  cabinet.friends=Array.isArray(cabinet.friends)?cabinet.friends:[];
  function save(){setCabinetData(user,cabinet)}
  function render(){
    var gamesCount=document.getElementById('friend-games-count'), trophyCount=document.getElementById('friend-trophies-count');
    var gamesCountValue=(cabinet.games||[]).length, trophyCountValue=(cabinet.games||[]).reduce(function(n,g){return n+(g.achievements||[]).filter(function(a){return a.unlocked;}).length;},0);
    if(gamesCount) gamesCount.textContent=gamesCountValue; if(trophyCount) trophyCount.textContent=trophyCountValue;
    var list=document.getElementById('friends-list'),empty=document.getElementById('friends-empty'); if(!list)return;
    if(empty)empty.classList.toggle('hidden',cabinet.friends.length>0);
    list.innerHTML=cabinet.friends.map(function(f){return '<div class="friend-card"><div class="friend-avatar">'+esc((f.name||'F').slice(0,1).toUpperCase())+'</div><div class="friend-copy"><strong>'+esc(f.name)+'</strong><span>'+esc(f.status||'Gaming')+'</span></div><button class="btn btn-ghost btn-sm" data-remove="'+esc(f.id)+'">Remove</button></div>';}).join('');
    list.querySelectorAll('[data-remove]').forEach(function(b){b.onclick=function(){cabinet.friends=cabinet.friends.filter(function(f){return f.id!==b.dataset.remove});save();render();}});
  }
  function add(){
    var name=prompt('Player name'); if(!name||!name.trim())return; var clean=name.trim().slice(0,32);
    if(cabinet.friends.some(function(f){return f.name.toLowerCase()===clean.toLowerCase()})){if(window.toast)window.toast('That player is already in your list.');return;}
    cabinet.friends.push({id:'f_'+Date.now(),name:clean,status:'Recently active'});save();render();if(window.toast)window.toast(clean+' added.');
  }
  render(); var b=document.getElementById('btn-find-players'); if(b)b.onclick=add;
})();
