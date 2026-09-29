// Operit2 v2 —— 滚动显现 / 导航状态
(function () {
  var nav = document.getElementById('nav');
  var onScroll = function () {
    nav.classList.toggle('scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 分组 stagger：同一父级内的 .reveal 依次延迟
  var groups = {};
  var els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  els.forEach(function (el) {
    var p = el.parentNode;
    var k = groups._n || (groups._n = 0);
    if (!el.dataset.g) {
      var sibs = Array.prototype.filter.call(p.children, function (c) {
        return c.classList && c.classList.contains('reveal');
      });
      sibs.forEach(function (s, i) { s.dataset.g = i; });
    }
    el.style.transitionDelay = (parseInt(el.dataset.g || '0', 10) * 80) + 'ms';
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }
})();
