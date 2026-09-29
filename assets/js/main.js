/* Operit2 宣传站交互 */
(function(){
"use strict";
var $=function(s,c){return (c||document).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};

/* 导航滚动态 */
var nav=$(".nav");
addEventListener("scroll",function(){nav.classList.toggle("scrolled",scrollY>24)},{passive:true});

/* 滚动显现 */
var io=new IntersectionObserver(function(es){
  es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}});
},{threshold:.12});
$$(".reveal").forEach(function(el){io.observe(el)});

/* ---------- 星座画布：设备之间的光流 ---------- */
var stage=$("#constellation"),canvas=$("#constCanvas");
if(stage&&canvas){
  var ctx=canvas.getContext("2d"),W=0,H=0,DPR=Math.min(devicePixelRatio||1,2);
  var nodes=$$(".device[data-node]",stage);
  function resize(){
    var r=stage.getBoundingClientRect();W=r.width;H=r.height;
    canvas.width=W*DPR;canvas.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  resize();addEventListener("resize",resize);
  var links=[["laptop","phone"],["laptop","watch"],["phone","watch"],["laptop","phone"]];
  var pulses=[];
  links.forEach(function(l,i){for(var k=0;k<2;k++)pulses.push({a:l[0],b:l[1],t:(i*.37+k*.5)%1,speed:.0035+ (i%2)*.0012});});
  function center(el){var s=stage.getBoundingClientRect(),r=el.getBoundingClientRect();
    return {x:r.left-s.left+r.width/2,y:r.top-s.top+r.height/2};}
  function qpoint(p0,p1,p2,t){var u=1-t;return{x:u*u*p0.x+2*u*t*p1.x+t*t*p2.x,y:u*u*p0.y+2*u*t*p1.y+t*t*p2.y};}
  var cols=["#45e8ff","#a78bfa","#ffc44d","#45e8ff"];
  function frame(){
    ctx.clearRect(0,0,W,H);
    var pts={};nodes.forEach(function(n){pts[n.dataset.node]=center(n)});
    links.forEach(function(l,i){
      var p0=pts[l[0]],p1=pts[l[1]];if(!p0||!p1)return;
      var mx=(p0.x+p1.x)/2,my=(p0.y+p1.y)/2;
      var dx=p1.x-p0.x,dy=p1.y-p0.y,len=Math.hypot(dx,dy)||1;
      var cxp=mx-dy/len*46,cyp=my+dx/len*46; /* 控制点：弧线 */
      var g=ctx.createLinearGradient(p0.x,p0.y,p1.x,p1.y);
      g.addColorStop(0,"rgba(69,232,255,.06)");g.addColorStop(.5,"rgba(167,139,250,.5)");g.addColorStop(1,"rgba(69,232,255,.06)");
      ctx.strokeStyle=g;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p0.x,p0.y);
      ctx.quadraticCurveTo(cxp,cyp,p1.x,p1.y);ctx.stroke();
      [p0,p1].forEach(function(p){ctx.fillStyle="rgba(69,232,255,.5)";ctx.beginPath();ctx.arc(p.x,p.y,2.4,0,7);ctx.fill();});
      pulses.forEach(function(pl,pi){
        if(pl.a!==l[0]||pl.b!==l[1])return;
        pl.t+=pl.speed;if(pl.t>1)pl.t-=1;
        var q=qpoint(p0,{x:cxp,y:cyp},p1,pl.t),c=cols[pi%4];
        ctx.save();ctx.shadowColor=c;ctx.shadowBlur=14;ctx.fillStyle=c;
        ctx.beginPath();ctx.arc(q.x,q.y,3.4,0,7);ctx.fill();ctx.restore();
        ctx.fillStyle="rgba(255,255,255,.10)";
        ctx.beginPath();ctx.arc(q.x,q.y,8,0,7);ctx.fill();
      });
    });
    requestAnimationFrame(frame);
  }
  frame();
}

/* ---------- 架构 SVG 动画 ---------- */
function svgIn(id,fn){
  var el=document.getElementById(id);if(!el)return;
  new IntersectionObserver(function(es,ob){es.forEach(function(e){
    if(e.isIntersecting){fn(el);ob.disconnect()}})},{threshold:.35}).observe(el);
}
/* 01 CoreNode：节点依次点亮 */
svgIn("diag-node",function(svg){
  var ns=$$(".dnode",svg);
  if(window.gsap){gsap.from(ns,{y:26,opacity:0,duration:.9,stagger:.22,ease:"power3.out"});
    gsap.from($$(".eq-link",svg),{drawSVG:0,duration:.01});}
  else{ns.forEach(function(n,i){n.style.transition="opacity .8s "+(i*.2)+"s";n.style.opacity=1});}
});
/* 02 Space：卫星就位 + 呼吸 */
svgIn("diag-space",function(svg){
  var cx=210,cy=150,r=118;
  $$(".sat",svg).forEach(function(g){
    var a=(+g.dataset.a)*Math.PI/180;
    g.setAttribute("transform","translate("+(cx+r*Math.cos(a)).toFixed(1)+","+(cy-r*Math.sin(a)).toFixed(1)+")");
  });
  if(window.gsap){gsap.from($$(".sat",svg),{scale:0,opacity:0,transformOrigin:"center",duration:.8,stagger:.18,ease:"back.out(1.6)"});
    gsap.to(".orbit",{rotation:360,transformOrigin:"210px 150px",duration:40,repeat:-1,ease:"none"});}
});
/* 03 Binding：token 来回穿梭 */
svgIn("diag-bind",function(svg){
  var tok=$(".bind-token",svg);if(!tok)return;
  if(window.gsap){gsap.fromTo(tok,{attr:{cx:150}},{attr:{cx:270},duration:1.6,ease:"power2.inOut",repeat:-1,yoyo:true,repeatDelay:.5});}
});

/* ---------- 设备流转进度条 ---------- */
var bar=$("#flowBar");
if(bar){
  var items=$$(".flow-item");var step=0;
  function dim(i){items.forEach(function(it,k){it.style.opacity=k===i?1:.45;it.style.transition="opacity .6s";it.style.filter=k===i?"none":"saturate(.4)"});}
  function cycle(){
    dim(step);
    bar.style.transition="none";bar.style.width="0%";
    requestAnimationFrame(function(){requestAnimationFrame(function(){
      bar.style.transition="width 2.4s linear";bar.style.width="100%";});});
    step=(step+1)%items.length;
  }
  var fio=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){cycle();setInterval(cycle,2600);fio.disconnect()}})},{threshold:.3});
  fio.observe(bar);
}
})();
