(function(){
var $=function(s){return document.querySelector(s)};
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,root=document.documentElement;
/* simulation */
var cv=$('#cv'),ctx=cv.getContext('2d'),W=0,H=0,dpr=Math.min(devicePixelRatio||1,2);
var N=[[.12,.5],[.3,.2],[.3,.78],[.5,.5],[.52,.14],[.55,.86],[.74,.3],[.76,.72],[.9,.5]].map(function(p,i){return{x:p[0],y:p[1],ox:p[0],oy:p[1],down:false,id:i,nb:[],pulse:0}});
[[0,1],[0,2],[1,3],[2,3],[1,4],[2,5],[3,4],[3,5],[3,6],[3,7],[4,6],[5,7],[6,8],[7,8],[6,7]].forEach(function(e){N[e[0]].nb.push(N[e[1]]);N[e[1]].nb.push(N[e[0]])});
var P=[],served=0,dropped=0,mx=-1,my=-1,last=0,spawn=0;
function size(){var r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);if(reduce)draw()}
addEventListener('resize',size);size();
function pos(n){return[n.x*W,n.y*H]}
cv.addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top});
cv.addEventListener('pointerleave',function(){mx=my=-1});
cv.addEventListener('click',function(e){var r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,b=null,bd=1e9;N.forEach(function(n){var p=pos(n),d=Math.hypot(p[0]-x,p[1]-y);if(d<bd){bd=d;b=n}});if(b&&bd<36){b.down=!b.down;b.pulse=1;P=P.filter(function(k){return !(k.b.down||k.a.down)});stats();if(reduce)draw()}});
function stats(){var d=N.filter(function(n){return n.down}).length;$('#down').textContent=d;$('#served').textContent=served;$('#dropped').textContent=dropped}
function mk(){var alive=N.filter(function(n){return !n.down});if(alive.length<2)return;var a=alive[Math.floor(Math.random()*alive.length)];hop(a,null,0)}
function hop(a,prev,h){var o=a.nb.filter(function(n){return !n.down&&n!==prev});if(!o.length)o=a.nb.filter(function(n){return !n.down});if(!o.length||h>=5){if(h>=3)served++;else dropped++;stats();return}P.push({a:a,b:o[Math.floor(Math.random()*o.length)],t:0,h:h})}
function css(v){return getComputedStyle(root).getPropertyValue(v).trim()}
function draw(){var line=css('--line'),acc=css('--accent'),fail=css('--fail'),ink=css('--ink'),sf=css('--surface');ctx.clearRect(0,0,W,H);
ctx.lineWidth=1.5;N.forEach(function(a){a.nb.forEach(function(b){if(b.id>a.id){var p=pos(a),q=pos(b);ctx.strokeStyle=(a.down||b.down)?fail:line;ctx.globalAlpha=(a.down||b.down)?.35:1;ctx.setLineDash((a.down||b.down)?[4,5]:[]);ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke()}})});
ctx.setLineDash([]);ctx.globalAlpha=1;
P.forEach(function(k){var p=pos(k.a),q=pos(k.b),x=p[0]+(q[0]-p[0])*k.t,y=p[1]+(q[1]-p[1])*k.t;ctx.fillStyle=acc;ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill()});
N.forEach(function(n){var p=pos(n),r=16+(n.pulse>0?n.pulse*8:0);ctx.fillStyle=sf;ctx.strokeStyle=n.down?fail:acc;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(p[0],p[1],r,0,7);ctx.fill();ctx.stroke();ctx.fillStyle=n.down?fail:ink;ctx.font='600 12px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n.down?'✕':n.id+1,p[0],p[1]+.5)})}
function tick(t){var dt=Math.min((t-last)/1000,.05);last=t;
N.forEach(function(n){var tx=n.ox,ty=n.oy;if(mx>=0){var p=[n.ox*W,n.oy*H],dx=mx-p[0],dy=my-p[1],d=Math.hypot(dx,dy);if(d<140&&d>0){var f=(1-d/140)*14;tx+=dx/d*f/W;ty+=dy/d*f/H}}n.x+=(tx-n.x)*Math.min(dt*8,1);n.y+=(ty-n.y)*Math.min(dt*8,1);if(n.pulse>0)n.pulse=Math.max(0,n.pulse-dt*3)});
spawn-=dt;if(spawn<=0){mk();spawn=.28}
var nx=[];P.forEach(function(k){k.t+=dt*1.1;if(k.t>=1){if(!k.b.down)hop(k.b,k.a,k.h+1)}else nx.push(k)});P=P.filter(function(k){return k.t<1});
draw();if(Math.floor(t/400)!==tick.s){tick.s=Math.floor(t/400);stats()}
if(vis)requestAnimationFrame(tick)}
var vis=true;
new IntersectionObserver(function(es){var v=es[0].isIntersecting;if(v&&!vis&&!reduce){vis=true;last=performance.now();requestAnimationFrame(tick)}vis=v}).observe(cv);
if(!reduce)requestAnimationFrame(tick);else{for(var i=0;i<6;i++)mk();draw()}
})();
