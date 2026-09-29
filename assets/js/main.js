// v3: reveal on scroll
(function(){
  var els = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){ els.forEach(function(e){e.classList.add('in')}); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, {threshold:.12, rootMargin:'0px 0px -6% 0px'});
  els.forEach(function(e){ io.observe(e); });
})();
