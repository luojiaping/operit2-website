/* DeviceSpaceGraph —— 按 Operit2 Flutter 原代码 1:1 重写的前端实现
 * 逻辑来源: apps/flutter/app/lib/ui/features/settings/runtime/DeviceSpaceGraph*.dart
 * 轨道/球体/光晕/拓扑/粒子/入场/呼吸/交互,全部照原公式;图标为矢量代码绘制,不依赖任何图片。 */
(function () {
  'use strict';
  var TAU = Math.PI * 2;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  function hx(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a.toFixed(3) + ')'; }
  function css(c) { return rgba(c, 1); }
  function lerpC(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function blend(fg, a, bg) { return [lerp(bg[0], fg[0], a), lerp(bg[1], fg[1], a), lerp(bg[2], fg[2], a)]; }
  var WHITE = [255, 255, 255], BLACK = [0, 0, 0];
  var easeInOutCubic = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };

  /* ---------- 深色主题色板(对 _GraphPalette dark) ---------- */
  var P = {
    primary: hx('#2F7FC4'), onSurface: hx('#E9EDF2'), onSurfaceVariant: hx('#9AA3B2'),
    outline: hx('#6B7482'), outlineVariant: hx('#3A414C'), surface: hx('#0B0D10'),
    surfaceContainerLow: hx('#0F1319'), surfaceContainerHigh: hx('#161B23'),
    surfaceContainerHighest: hx('#1B212B'), primaryContainer: hx('#14324A'),
    onPrimaryContainer: hx('#CFE4F7'), tertiary: hx('#5EA3E0'), error: hx('#E06E6E'),
    shadow: BLACK
  };
  function sphereBase(current, online) {
    var wash = current ? 0.38 : (online ? 0.20 : 0.12);
    var ground = current ? P.primaryContainer : P.surfaceContainerHigh;
    return blend(P.primary, wash, ground);
  }

  /* ---------- 演示数据(同 RuntimeDeviceSpaceTopology 结构) ---------- */
  var DATA = {
    currentDeviceId: 'd-win',
    devices: [
      { id: 'd-win', name: 'ThinkPad X1', platform: 'Windows', online: true, core: 'Core 0.9.2' },
      { id: 'd-pixel', name: 'Pixel 9', platform: 'Android', online: true, core: 'Core 0.9.2' },
      { id: 'd-mac', name: 'MacBook Pro', platform: 'macOS', online: true, core: 'Core 0.9.1' },
      { id: 'd-ipad', name: 'iPad Air', platform: 'iOS', online: false, core: 'Core 0.9.2' },
      { id: 'd-watch', name: 'Watch S9', platform: 'watchOS', online: true, core: 'Core 0.9.2' }
    ],
    connections: [
      { a: 'd-win', b: 'd-pixel', status: 'online', reason: '直连 · 局域网' },
      { a: 'd-win', b: 'd-mac', status: 'online', reason: '直连 · 局域网' },
      { a: 'd-win', b: 'd-ipad', status: 'offline', reason: '上次在线 2 小时前' },
      { a: 'd-pixel', b: 'd-watch', status: 'online', reason: '随身连接' },
      { a: 'd-mac', b: 'd-ipad', status: 'versionMismatch', reason: 'Core 版本不一致，升级后可重连' }
    ]
  };
  var STATUS_ZH = { online: '在线', offline: '离线', versionMismatch: 'Core 版本不匹配', unknown: '状态未知' };
  function statusColor(s) {
    return s === 'online' ? P.primary : s === 'offline' ? P.outline : s === 'versionMismatch' ? P.error : P.tertiary;
  }
  function iconKind(platform) {
    var n = (platform || '').toLowerCase();
    if (n.indexOf('android') >= 0) return 'android';
    if (n.indexOf('windows') >= 0) return 'laptop';
    if (n.indexOf('mac') >= 0 || n.indexOf('darwin') >= 0) return 'laptop';
    if (n.indexOf('linux') >= 0) return 'server';
    if (n.indexOf('ios') >= 0) return 'phone';
    return 'devices';
  }
  function rr(p, x, y, w, h, r) {
    p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r);
    p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath();
  }
  var ICONS = {
    android: function () { var p = new Path2D();
      p.moveTo(-24, -4); p.arc(0, -4, 24, Math.PI, 0); p.closePath();
      rr(p, -19, 0, 38, 28, 7); rr(p, -31, 2, 8, 22, 4); rr(p, 23, 2, 8, 22, 4);
      rr(p, -16, 30, 10, 14, 5); rr(p, 6, 30, 10, 14, 5); return p; },
    laptop: function () { var p = new Path2D();
      rr(p, -30, -26, 60, 40, 5);
      p.moveTo(-38, 20); p.lineTo(38, 20); p.lineTo(31, 30); p.lineTo(-31, 30); p.closePath(); return p; },
    phone: function () { var p = new Path2D(); rr(p, -19, -33, 38, 66, 9); return p; },
    server: function () { var p = new Path2D();
      rr(p, -28, -30, 56, 60, 6);
      p.moveTo(-18, -14); p.arc(-14, -14, 4, 0, TAU); p.closePath();
      p.moveTo(-18, 10); p.arc(-14, 10, 4, 0, TAU); p.closePath();
      p.moveTo(-2, -16); p.lineTo(20, -16); p.lineTo(20, -12); p.lineTo(-2, -12); p.closePath();
      p.moveTo(-2, 8); p.lineTo(20, 8); p.lineTo(20, 12); p.lineTo(-2, 12); p.closePath(); return p; },
    devices: function () { var p = new Path2D(); rr(p, -28, -22, 36, 44, 6); rr(p, -8, -12, 36, 44, 6); return p; }
  };

  /* ================= 主类 ================= */
  function DeviceGraph(root) {
    this.root = root;
    this.canvas = root.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.nodesEl = root.querySelector('.graph-nodes');
    this.titleEl = root.querySelector('.graph-title-txt');
    this.countEl = root.querySelector('.graph-count');
    this.onlineEl = root.querySelector('.graph-online-n');
    this.hintEl = root.querySelector('.graph-hint');
    this.dotsEl = root.querySelector('.mode-dots').children;
    this.footEl = root.querySelector('.graph-foot');
    this.detailsEl = root.querySelector('.graph-details');
    this.data = JSON.parse(JSON.stringify(DATA));
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.topologyMode = false;
    this.mode = 0; this.modeFrom = 0; this.modeT0 = -1;
    this.turns = 0; this.clock = 0.25;
    this.t0 = performance.now() / 1000; this.arrivalT0 = this.t0;
    this.selectedId = null; this.hoveredId = null; this.focusedId = null;
    this.elev = {}; this.leaving = {}; this.buttons = {};
    this.last = this.t0;
    var self = this;
    window.addEventListener('resize', function () { self.resize(); });
    this.resize();
    this.buildButtons();
    this.refreshChrome();
    requestAnimationFrame(function (t) { self.loop(t); });
  }

  DeviceGraph.prototype.resize = function () {
    var stage = this.root.querySelector('.graph-stage');
    var W = stage.clientWidth;
    var compact = W < 540;
    var pageH = window.innerHeight || 800;
    var H = clamp(W * (compact ? 0.78 : 0.58), pageH * 0.26, pageH * 0.46);
    H = clamp(H, 300, 560);
    this.vw = W; this.vh = H;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(W * dpr); this.canvas.height = Math.round(H * dpr);
    this.canvas.style.height = H + 'px'; this.dpr = dpr;
    this.computeLayout();
    this.layoutButtons();
  };

  /* ---------- 对 _GraphLayout.create ---------- */
  DeviceGraph.prototype.computeLayout = function () {
    var W = this.vw, H = this.vh, compact = W < 540;
    var shortest = Math.min(W, H);
    var currentD = shortest * 0.205, remoteD = currentD * 0.71;
    var extent = currentD * 1.22, scale = currentD / 82;
    var margin = (compact ? 24 : 32) * scale;
    var padding = extent * 1.16 + margin;
    var radius = { x: Math.max(extent * 1.2, (W - padding) / 2.2), y: Math.max(currentD * 0.66, (H - padding) / 2.85) };
    var cur = null, remotes = [];
    this.data.devices.forEach(function (d) { (d.id === this.data.currentDeviceId ? (cur = d) : remotes.push(d)); }, this);
    remotes.sort(function (a, b) { return a.id < b.id ? -1 : 1; });
    this.order = [cur].concat(remotes);
    var neighbors = {}; this.order.forEach(function (d) { neighbors[d.id] = {}; });
    this.data.connections.forEach(function (e) { neighbors[e.a][e.b] = 1; neighbors[e.b][e.a] = 1; });
    var depths = {}, q = [cur.id]; depths[cur.id] = 0;
    for (var i = 0; i < q.length; i++) for (var n in neighbors[q[i]])
      if (!(n in depths)) { depths[n] = depths[q[i]] + 1; q.push(n); }
    var maxD = 0; for (var k in depths) maxD = Math.max(maxD, depths[k]);
    var layers = {};
    this.order.forEach(function (d) {
      var dep = (d.id in depths) ? depths[d.id] : maxD + 1;
      (layers[dep] = layers[dep] || []).push(d.id);
    });
    var layerStep = extent + (compact ? 30 : 80) * scale;
    var crossStep = extent + (compact ? 16 : 30) * scale;
    var pts = {};
    Object.keys(layers).forEach(function (layer) {
      var ids = layers[layer];
      ids.forEach(function (id, idx) {
        var cross = idx - (ids.length - 1) / 2;
        pts[id] = compact ? { x: cross * crossStep, y: layer * layerStep } : { x: layer * layerStep, y: cross * crossStep };
      });
    });
    var l = 1e9, t = 1e9, r = -1e9, b = -1e9;
    Object.keys(pts).forEach(function (id) { var p = pts[id]; l = Math.min(l, p.x); t = Math.min(t, p.y); r = Math.max(r, p.x); b = Math.max(b, p.y); });
    var ringCount = Math.max(1, Math.ceil(remotes.length / 8));
    var outerScale = 1 + (ringCount - 1) * 0.46;
    var cT = Math.cos(-0.16), sT = Math.sin(-0.16);
    var ohw = Math.hypot(radius.x * cT, radius.y * sT) * 1.14 * outerScale;
    var ohh = Math.hypot(radius.x * sT, radius.y * cT) * 1.14 * outerScale;
    var lw = Math.max(W, Math.max(ohw * 2, r - l) + padding);
    var lh = Math.max(H, Math.max(ohh * 2, b - t) + padding);
    this.lw = lw; this.lh = lh;
    this.center = { x: lw / 2, y: lh / 2 };
    var bcx = (l + r) / 2, bcy = (t + b) / 2, self = this;
    this.topoPts = {};
    Object.keys(pts).forEach(function (id) { self.topoPts[id] = { x: pts[id].x - bcx + lw / 2, y: pts[id].y - bcy + lh / 2 }; });
    this.radius = radius; this.ringCount = ringCount;
    this.m = { compact: compact, currentD: currentD, remoteD: remoteD, extent: extent, scale: scale };
    var s = Math.min(W / lw, H / lh);
    this.fit = { s: s, ox: (W - lw * s) / 2, oy: (H - lh * s) / 2 };
  };

  DeviceGraph.prototype.orbitPoint = function (a, ring) {
    var depth = Math.sin(a), ps = 1 + depth * 0.14;
    var x = Math.cos(a) * this.radius.x * ring * ps, y = depth * this.radius.y * ring * ps;
    var c = Math.cos(-0.16), s = Math.sin(-0.16);
    return { x: this.center.x + x * c - y * s, y: this.center.y + x * s + y * c };
  };
  DeviceGraph.prototype.ringScale = function (ring) { return 1 + ring * 0.46; };

  DeviceGraph.prototype.frameAt = function (index, progress, turns) {
    var dev = this.order[index], isCur = index === 0;
    var ri = index - 1, ring = isCur ? 0 : Math.floor(ri / 8);
    var count = Math.min(8, this.order.length - 1 - ring * 8);
    var angle = isCur ? 0 : (-Math.PI / 4 + (ri % 8) * TAU / Math.max(1, count) + turns * TAU + ring * 0.37);
    var depth = isCur ? 0 : Math.sin(angle);
    var orbit = isCur ? this.center : this.orbitPoint(angle, this.ringScale(ring));
    var tp = this.topoPts[dev.id];
    var sc = isCur ? 1 : 0.9 + 0.17 * depth;
    var op = isCur ? 1 : 0.76 + 0.24 * (depth + 1) / 2;
    return {
      x: lerp(orbit.x, tp.x, progress), y: lerp(orbit.y, tp.y, progress),
      depth: depth * (1 - progress), lateral: isCur ? 0 : Math.cos(angle) * (1 - progress),
      scale: sc + (1 - sc) * progress, opacity: op + (1 - op) * progress
    };
  };

  /* ---------- DOM:节点按钮 ---------- */
  DeviceGraph.prototype.buildButtons = function () {
    var self = this, m = this.m;
    this.order.forEach(function (dev, index) {
      if (self.buttons[dev.id]) return;
      var b = document.createElement('button');
      b.className = 'gnode'; b.type = 'button';
      var isCur = dev.id === self.data.currentDeviceId;
      b.setAttribute('aria-label', (isCur ? '本机 · ' : '') + dev.name + ', ' + (dev.online ? '在线' : '离线') + ', ' + (isCur ? '点击展开拓扑' : '查看设备与连接详情'));
      b.addEventListener('mouseenter', function () { self.hoveredId = dev.id; });
      b.addEventListener('mouseleave', function () { if (self.hoveredId === dev.id) self.hoveredId = null; });
      b.addEventListener('focus', function () { self.focusedId = dev.id; });
      b.addEventListener('blur', function () { if (self.focusedId === dev.id) self.focusedId = null; });
      b.addEventListener('click', function () {
        if (isCur) self.toggleMode();
        else self.select(dev.id === self.selectedId ? null : dev.id);
      });
      self.nodesEl.appendChild(b);
      self.buttons[dev.id] = b;
      if (!(dev.id in self.elev)) self.elev[dev.id] = 0.35;
    });
    this.nodesEl.addEventListener('click', function (e) {
      if (e.target === self.nodesEl) self.select(null);
    });
  };
  DeviceGraph.prototype.layoutButtons = function () {
    var m = this.m, f = this.fit, self = this;
    this.order.forEach(function (dev) {
      var b = self.buttons[dev.id]; if (!b) return;
      var fr = self.frameAt(self.order.indexOf(dev), self.mode, self.turns);
      var sz = m.extent * f.s;
      b.style.width = sz + 'px'; b.style.height = sz + 'px';
      b.style.transform = 'translate(' + (f.ox + (fr.x - m.extent / 2) * f.s) + 'px,' + (f.oy + (fr.y - m.extent / 2) * f.s) + 'px)';
    });
  };

  /* ---------- 交互 ---------- */
  DeviceGraph.prototype.toggleMode = function () {
    this.topologyMode = !this.topologyMode;
    this.select(this.data.currentDeviceId);
    this.modeFrom = this.mode; this.modeT0 = performance.now() / 1000;
    if (this.reduceMotion) { this.mode = this.topologyMode ? 1 : 0; this.modeT0 = -1; }
    this.refreshChrome();
  };
  DeviceGraph.prototype.select = function (id) {
    this.selectedId = id;
    if (id) this.showDetails(id); else this.hideDetails();
  };
  DeviceGraph.prototype.paused = function () {
    var inspecting = this.selectedId && this.selectedId !== this.data.currentDeviceId;
    return this.reduceMotion || this.topologyMode || this.modeT0 >= 0 ||
      this.hoveredId || this.focusedId || inspecting || this.order.length < 2;
  };

  /* ---------- 顶栏/底栏 ---------- */
  DeviceGraph.prototype.refreshChrome = function () {
    var n = this.data.devices.length;
    var online = this.data.devices.filter(function (d) { return d.online; }).length;
    this.titleEl.textContent = this.topologyMode ? '连接拓扑' : '设备关系';
    this.countEl.textContent = n + ' 台设备';
    this.onlineEl.textContent = online + ' 在线';
    this.root.classList.toggle('topo', this.topologyMode);
    var empty = n === 1;
    this.hintEl.textContent = empty ? '空间已就绪，连接另一台设备，让协作从这里开始'
      : this.topologyMode ? '实线在线 · 虚线未连通 · 点击当前设备返回'
      : '悬停或点击查看设备 · 点击中心展开拓扑';
    this.dotsEl[0].className = this.topologyMode ? '' : 'on';
    this.dotsEl[1].className = this.topologyMode ? 'on' : '';
  };

  DeviceGraph.prototype.showDetails = function (id) {
    var self = this;
    var dev = this.data.devices.filter(function (d) { return d.id === id; })[0];
    if (!dev) { this.hideDetails(); return; }
    var isCur = id === this.data.currentDeviceId;
    var peers = {}; this.data.devices.forEach(function (d) { peers[d.id] = d; });
    var edges = this.data.connections.filter(function (e) { return e.a === id || e.b === id; });
    var direct = !isCur && edges.some(function (e) { return e.a === self.data.currentDeviceId || e.b === self.data.currentDeviceId; });
    var html = '<div class="gd-row"><span class="gd-ic">' + platformGlyph(iconKind(dev.platform)) + '</span>' +
      '<div class="gd-main"><b>' + (isCur ? '本机 · ' : '') + esc(dev.name) + '</b>' +
      '<small>' + (dev.online ? '在线' : '离线') + ' · ' + esc(dev.platform) + (dev.core ? ' · ' + esc(dev.core) : '') + '</small></div>' +
      (direct ? '<button class="gd-iconbtn gd-danger" data-act="dis" title="断开连接">' + svgLinkOff() + '</button>' : '') +
      '<button class="gd-iconbtn" data-act="close" title="关闭">' + svgClose() + '</button></div>';
    if (!edges.length) html += '<p class="gd-empty">尚无连接记录</p>';
    edges.forEach(function (e) {
      var peer = peers[e.a === id ? e.b : e.a];
      html += '<div class="gd-edge"><p><b>' + esc(peer.name) + '</b> · <span style="color:' + css(statusColor(e.status)) + '">' + STATUS_ZH[e.status] + '</span></p>' +
        (e.reason ? '<small>' + esc(e.reason) + '</small>' : '') + '</div>';
    });
    this.detailsEl.innerHTML = html;
    this.detailsEl.hidden = false; this.footEl.hidden = true;
    var disBtn = this.detailsEl.querySelector('[data-act="dis"]');
    if (disBtn) disBtn.addEventListener('click', function () { self.armDisconnect(disBtn, id); });
    this.detailsEl.querySelector('[data-act="close"]').addEventListener('click', function () { self.select(null); });
  };
  DeviceGraph.prototype.hideDetails = function () {
    this.detailsEl.hidden = true; this.detailsEl.innerHTML = ''; this.footEl.hidden = false;
  };
  DeviceGraph.prototype.armDisconnect = function (btn, id) {
    var self = this;
    if (btn.dataset.armed) { this.disconnect(id); return; }
    btn.dataset.armed = '1'; btn.classList.add('armed'); btn.title = '再次点击确认断开';
    setTimeout(function () { delete btn.dataset.armed; btn.classList.remove('armed'); }, 3000);
  };
  DeviceGraph.prototype.disconnect = function (id) {
    this.leaving[id] = performance.now() / 1000;
  };
  DeviceGraph.prototype.finishDisconnect = function (id) {
    delete this.leaving[id];
    this.data.devices = this.data.devices.filter(function (d) { return d.id !== id; });
    this.data.connections = this.data.connections.filter(function (e) { return e.a !== id && e.b !== id; });
    var b = this.buttons[id]; if (b) { b.remove(); delete this.buttons[id]; }
    delete this.elev[id];
    if (this.selectedId === id) this.select(null);
    this.computeLayout(); this.buildButtons(); this.refreshChrome();
  };

  /* ---------- 主循环 ---------- */
  DeviceGraph.prototype.loop = function (tms) {
    var self = this;
    var now = tms / 1000, dt = Math.min(0.05, now - this.last); this.last = now;
    if (!this.reduceMotion) this.clock = (now % 12) / 12;
    var arrival = this.reduceMotion ? 1 : clamp((now - this.arrivalT0) / 1.1, 0, 1);
    if (this.modeT0 >= 0) {
      var p = clamp((now - this.modeT0) / 0.86, 0, 1);
      this.mode = lerp(this.modeFrom, this.topologyMode ? 1 : 0, easeInOutCubic(p));
      if (p >= 1) this.modeT0 = -1;
    }
    if (!this.paused()) this.turns += dt / 28;
    var k = 1 - Math.exp(-dt * 14);
    this.order.forEach(function (dev) {
      var target = (self.hoveredId === dev.id || self.focusedId === dev.id || self.selectedId === dev.id) ? 1 : 0.35;
      self.elev[dev.id] = lerp(self.elev[dev.id] || 0.35, target, k);
    });
    var done = [];
    Object.keys(this.leaving).forEach(function (id) { if (now - self.leaving[id] > 0.35) done.push(id); });
    done.forEach(function (id) { self.finishDisconnect(id); });
    this.draw(now, arrival);
    this.layoutButtons();
    requestAnimationFrame(function (t) { self.loop(t); });
  };

  /* ---------- 绘制 ---------- */
  DeviceGraph.prototype.draw = function (now, arrival) {
    var ctx = this.ctx, m = this.m, f = this.fit;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.dpr * f.s, 0, 0, this.dpr * f.s, this.dpr * f.ox, this.dpr * f.oy);
    var mode = this.mode, clock = this.clock, s = m.scale;
    var curFr = this.frameAt(0, mode, this.turns);
    var breath = (Math.sin(clock * Math.PI * 4) + 1) / 2;
    /* 中心光晕 */
    var gr = m.currentD * (1.95 + breath * 0.1);
    var g = ctx.createRadialGradient(curFr.x, curFr.y, 0, curFr.x, curFr.y, gr);
    g.addColorStop(0, rgba(P.primary, (0.13 + breath * 0.045) * arrival)); g.addColorStop(1, rgba(P.primary, 0));
    ctx.fillStyle = g; ctx.fillRect(curFr.x - gr, curFr.y - gr, gr * 2, gr * 2);
    /* 星尘 */
    for (var i = 0; i < 34; i++) {
      var px = ((i * 0.61803398875 + 0.13) % 1) * this.lw;
      var py = ((i * 0.38196601125 + i * i * 0.017) % 1) * this.lh;
      var tw = (Math.sin(clock * TAU + i * 1.7) + 1) / 2;
      ctx.fillStyle = rgba(lerpC(P.onSurface, P.primary, 0.72), (0.07 + tw * 0.15) * arrival);
      ctx.beginPath(); ctx.arc(px, py, (i % 5 === 0 ? 1.3 : 0.75) * s, 0, TAU); ctx.fill();
    }
    if (mode < 1) this.drawOrbits(ctx, 1 - mode, arrival, clock, s);
    if (mode > 0) this.drawGrid(ctx, mode, arrival, s);
    /* 成员引导线 */
    var mOp = (1 - mode) * arrival;
    if (mOp > 0.001) for (var di = 1; di < this.order.length; di++) {
      var dev = this.order[di], fr = this.frameAt(di, mode, this.turns);
      var dx = fr.x - curFr.x, dy = fr.y - curFr.y;
      var bx = -dy * 0.13, by = dx * 0.13;
      ctx.strokeStyle = rgba(dev.online ? P.primary : P.outline, 0.2 * mOp * fr.opacity);
      ctx.lineWidth = 1 * s; ctx.beginPath();
      ctx.moveTo(curFr.x, curFr.y);
      ctx.quadraticCurveTo((curFr.x + fr.x) / 2 + bx, (curFr.y + fr.y) / 2 + by, fr.x, fr.y);
      ctx.stroke();
      if (dev.id === this.selectedId) {
        ctx.strokeStyle = rgba(dev.online ? P.primary : P.outline, 0.55 * mOp);
        ctx.lineWidth = 1.4 * s; ctx.stroke();
      }
    }
    if (mode > 0) this.drawConnections(ctx, mode, arrival, clock, s);
    /* 呼吸环 + 扫过弧 */
    for (var h = 0; h < 2; h++) {
      var prog = (clock * 2 + h * 0.5) % 1;
      ctx.strokeStyle = rgba(P.primary, (1 - prog) * 0.19 * arrival);
      ctx.lineWidth = 1 * s;
      ctx.beginPath(); ctx.arc(curFr.x, curFr.y, m.currentD * (0.63 + prog * 0.37), 0, TAU); ctx.stroke();
    }
    ctx.strokeStyle = rgba(P.primary, 0.55 * arrival); ctx.lineWidth = 1.6 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(curFr.x, curFr.y, m.currentD * 0.62, -Math.PI / 2 + clock * TAU, -Math.PI / 2 + clock * TAU + Math.PI * 0.75); ctx.stroke();
    /* 球体(按深度由远及近) */
    var self = this;
    var order = this.order.map(function (d, idx) { return idx; }).sort(function (a, b) {
      var fa = self.frameAt(a, mode, self.turns), fb = self.frameAt(b, mode, self.turns);
      return fa.depth - fb.depth || (self.order[a].id < self.order[b].id ? -1 : 1);
    });
    order.forEach(function (idx) { self.drawNode(ctx, idx, mode, arrival, now); });
  };

  DeviceGraph.prototype.drawOrbits = function (ctx, opacity, arrival, clock, s) {
    var rings = [0.68];
    for (var rg = 0; rg < this.ringCount; rg++) rings.push(this.ringScale(rg));
    for (var ri = 0; ri < rings.length; ri++) {
      var ring = rings[ri];
      for (var half = 0; half < 2; half++) {
        ctx.strokeStyle = rgba(P.primary, (half === 0 ? 0.24 : 0.08) * (ri === 0 ? 0.5 : 1) * opacity * arrival);
        ctx.lineWidth = (half === 0 ? 1.1 : 0.7) * s;
        ctx.beginPath();
        for (var st = 0; st <= 48; st++) {
          var pt = this.orbitPoint(half * Math.PI + st / 48 * Math.PI, ring);
          st === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }
      var ang = clock * TAU + ri * 2.1;
      ctx.lineCap = 'round';
      for (var tr = 0; tr < 12; tr++) {
        var p1 = this.orbitPoint(ang + tr * 0.028, ring), p2 = this.orbitPoint(ang + (tr + 1) * 0.028, ring);
        ctx.strokeStyle = rgba(P.primary, tr / 12 * 0.5 * opacity * arrival);
        ctx.lineWidth = 1.6 * s;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
      var hp = this.orbitPoint(ang + 12 * 0.028, ring), so = opacity * arrival * 0.7;
      [[5, 0.08], [2.5, 0.22], [1.35, 0.95]].forEach(function (sp) {
        ctx.fillStyle = rgba(P.primary, sp[1] * so);
        ctx.beginPath(); ctx.arc(hp.x, hp.y, sp[0] * s, 0, TAU); ctx.fill();
      });
    }
  };

  DeviceGraph.prototype.drawGrid = function (ctx, mode, arrival, s) {
    ctx.fillStyle = rgba(P.primary, 0.09 * mode * arrival);
    for (var x = 16 * s; x < this.lw; x += 28 * s)
      for (var y = 16 * s; y < this.lh; y += 28 * s) {
        ctx.beginPath(); ctx.arc(x, y, 0.8 * s, 0, TAU); ctx.fill();
      }
  };

  DeviceGraph.prototype.drawConnections = function (ctx, mode, arrival, clock, s) {
    var self = this, opacity0 = mode * arrival;
    this.data.connections.forEach(function (e, ei) {
      var ia = self.order.findIndex(function (d) { return d.id === e.a; });
      var ib = self.order.findIndex(function (d) { return d.id === e.b; });
      if (ia < 0 || ib < 0) return;
      var fa = self.frameAt(ia, mode, self.turns), fb = self.frameAt(ib, mode, self.turns);
      var dx = fb.x - fa.x, dy = fb.y - fa.y, dist = Math.hypot(dx, dy);
      if (dist < 1) return;
      var ux = dx / dist, uy = dy / dist;
      var da = (ia === 0 ? self.m.currentD : self.m.remoteD) * fa.scale / 2 + 6 * s;
      var db = (ib === 0 ? self.m.currentD : self.m.remoteD) * fb.scale / 2 + 6 * s;
      var sx = fa.x + ux * da, sy = fa.y + uy * da, ex = fb.x - ux * db, ey = fb.y - uy * db;
      var path = new Path2D();
      path.moveTo(sx, sy);
      if (Math.abs(dx) > Math.abs(dy)) { var mx = (sx + ex) / 2; path.bezierCurveTo(mx, sy, mx, ey, ex, ey); }
      else { var my = (sy + ey) / 2; path.bezierCurveTo(sx, my, ex, my, ex, ey); }
      var online = e.status === 'online';
      var relevant = !self.selectedId || self.selectedId === self.data.currentDeviceId || e.a === self.selectedId || e.b === self.selectedId;
      var op = opacity0 * (relevant ? 1 : 0.2);
      var col = statusColor(e.status);
      if (online) {
        ctx.strokeStyle = rgba(col, 0.07 * op); ctx.lineWidth = 7 * s; ctx.lineCap = 'round'; ctx.stroke(path);
      }
      ctx.strokeStyle = rgba(col, (online ? 0.7 : 0.5) * op);
      ctx.lineWidth = (online ? 1.5 : 1.1) * s; ctx.lineCap = 'round';
      if (online) ctx.stroke(path);
      else { ctx.setLineDash([11 * s, 7 * s]); ctx.stroke(path); ctx.setLineDash([]); }
      if (online) for (var pc = 0; pc < 2; pc++) {
        var pr = (clock * 3 + ei * 0.19 + pc * 0.5) % 1;
        var tx = lerp(sx, ex, pr), ty = lerp(sy, ey, pr);
        var bx0 = lerp(sx, ex, Math.max(0, pr - 22 * s / dist)), by0 = lerp(sy, ey, Math.max(0, pr - 22 * s / dist));
        ctx.strokeStyle = rgba(col, 0.6 * op); ctx.lineWidth = 2.2 * s;
        ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.lineTo(tx, ty); ctx.stroke();
        [[5, 0.08], [2.5, 0.22], [1.35, 0.95]].forEach(function (sp) {
          ctx.fillStyle = rgba(col, sp[1] * op);
          ctx.beginPath(); ctx.arc(tx, ty, sp[0] * s, 0, TAU); ctx.fill();
        });
      }
      [[sx, sy], [ex, ey]].forEach(function (pt) {
        ctx.fillStyle = rgba(col, 0.7 * op);
        ctx.beginPath(); ctx.arc(pt[0], pt[1], 3 * s, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(P.surface, op);
        ctx.beginPath(); ctx.arc(pt[0], pt[1], 1.25 * s, 0, TAU); ctx.fill();
      });
    });
  };

  DeviceGraph.prototype.drawNode = function (ctx, index, mode, arrival, now) {
    var dev = this.order[index], m = this.m, isCur = index === 0;
    var fr = this.frameAt(index, mode, this.turns);
    var start = Math.min(index * 0.065, 0.4);
    var entry = easeOutCubic(clamp((arrival - start) / (1 - start), 0, 1));
    if (entry <= 0) return;
    var leave = 1;
    if (this.leaving[dev.id] != null) leave = clamp(1 - (now - this.leaving[dev.id]) / 0.35, 0, 1);
    var alpha = entry * fr.opacity * leave;
    if (alpha <= 0.001) return;
    var diam = (isCur ? m.currentD : m.remoteD) * fr.scale * (0.8 + 0.2 * entry);
    var cx = fr.x, cy = fr.y + (1 - entry) * 18 * m.scale;
    var lift = this.elev[dev.id] || 0.35;
    ctx.save(); ctx.globalAlpha = alpha;
    this.sphere(ctx, cx, cy, diam, fr.depth, fr.lateral, lift, isCur, dev.online, iconKind(dev.platform));
    this.badge(ctx, fr, isCur, dev.online, mode);
    ctx.restore();
  };

  /* 对 _GraphSpherePainter.paint */
  DeviceGraph.prototype.sphere = function (ctx, x, y, diam, depth, lateral, lift, current, online, icon) {
    var u = diam / 100;
    var accent = (current || online) ? P.primary : P.outline;
    var ls = 0.84 + depth * 0.12 + lift * 0.08;
    ctx.save(); ctx.translate(x - 50 * u, y - 50 * u); ctx.scale(u, u);
    var shx = 54 - lateral * 2, shy = 92 + lift * 2, shw = 77 - lift * 5;
    var shg = ctx.createRadialGradient(shx, shy, 0, shx, shy, shw / 2);
    shg.addColorStop(0, rgba(BLACK, 0.45)); shg.addColorStop(1, rgba(BLACK, 0));
    ctx.fillStyle = shg; ctx.beginPath(); ctx.ellipse(shx, shy, shw / 2, 10, 0, 0, TAU); ctx.fill();
    var ag = ctx.createRadialGradient(50, 50, 0, 50, 50, 54);
    ag.addColorStop(0.66, rgba(accent, 0));
    ag.addColorStop(0.87, rgba(accent, (current ? 0.14 : 0.05) + lift * 0.09));
    ag.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(50, 50, 54, 0, TAU); ctx.fill();
    var base = sphereBase(current, online);
    var lit = lerpC(base, WHITE, current ? 0.56 : 0.40), shade = lerpC(base, BLACK, 0.72);
    var lx = 50 + (-0.42 + lateral * 0.18) * 48.5, ly = 50 + (-0.52 + depth * 0.09) * 48.5;
    var bg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 1.08 * 97);
    bg.addColorStop(0, css(lit));
    bg.addColorStop(0.24, css(lerpC(base, accent, current ? 0.35 : 0.16)));
    bg.addColorStop(0.56, css(base)); bg.addColorStop(1, css(shade));
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(50, 50, 48.5, 0, TAU); ctx.fill();
    var bx = 50 + (0.28 - lateral * 0.12) * 48.5, by = 50 + 0.85 * 48.5;
    var bgr = ctx.createRadialGradient(bx, by, 0, bx, by, 0.8 * 97);
    bgr.addColorStop(0, rgba(accent, current ? 0.24 : 0.16)); bgr.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = bgr; ctx.beginPath(); ctx.arc(50, 50, 48.5, 0, TAU); ctx.fill();
    ctx.save();
    ctx.translate(33 + lateral * 7, 22 + depth * 3 - lift * 1.5);
    ctx.rotate(-0.45 + lateral * 0.12); ctx.scale(1, 0.56);
    var gg = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
    gg.addColorStop(0, rgba(WHITE, 0.62 * ls)); gg.addColorStop(0.35, rgba(WHITE, 0.17 * ls)); gg.addColorStop(1, rgba(WHITE, 0));
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fill();
    ctx.restore();
    var rim = ctx.createConicGradient(0, 50, 50);
    rim.addColorStop(0, rgba(shade, 0.85)); rim.addColorStop(0.2, rgba(accent, 0.6));
    rim.addColorStop(0.46, rgba(shade, 0.48)); rim.addColorStop(0.64, rgba(WHITE, 0.68 * ls));
    rim.addColorStop(0.84, rgba(accent, 0.62)); rim.addColorStop(1, rgba(shade, 0.85));
    ctx.strokeStyle = rim; ctx.lineWidth = 1.6 + lift * 0.5;
    ctx.beginPath(); ctx.arc(50, 50, 48.5, 0, TAU); ctx.stroke();
    ctx.strokeStyle = rgba(WHITE, 0.32 * ls); ctx.lineWidth = 0.85; ctx.lineCap = 'round';
    var a0 = Math.PI * 1.05 + lateral * 0.08;
    ctx.beginPath(); ctx.arc(50, 50, 45.5, a0, a0 + Math.PI * 0.44); ctx.stroke();
    ctx.restore();
    /* 浮雕字形(对 _GraphRaisedGlyph) */
    var m = this.m, s = m.scale;
    var size = (current ? m.currentD * 0.415 : m.remoteD * 0.431) * (diam / ((current ? m.currentD : m.remoteD)));
    var th = size * 0.075;
    var gcol = current ? lerpC(P.primary, WHITE, 0.86) : lerpC(P.onSurface, P.primary, online ? 0.20 : 0.08);
    var edge = lerpC(accent, BLACK, 0.62);
    var path = ICONS[icon]();
    ctx.save();
    ctx.translate(x + (-0.012 + lateral * 0.024) * diam, y + (-0.022 - lift * 0.021 + depth * 0.008) * diam);
    ctx.rotate(-0.035 + lateral * 0.025);
    var sc = size / 76; ctx.scale(sc, sc);
    var layers = [
      { dx: th * 1.2 / sc, dy: th * 1.9 / sc, fill: rgba(P.shadow, 0.18), blur: th * 1.8 / sc, blurA: 0.48 },
      { dx: th * 3 * 0.23 / sc, dy: th * 3 / 3 / sc, fill: css(lerpC(edge, accent, 0)) },
      { dx: th * 2 * 0.23 / sc, dy: th * 2 / 3 / sc, fill: css(lerpC(edge, accent, 0.16)) },
      { dx: th * 1 * 0.23 / sc, dy: th * 1 / 3 / sc, fill: css(lerpC(edge, accent, 0.32)) },
      { dx: -0.45 / sc, dy: -0.65 / sc, fill: css(lerpC(gcol, WHITE, 0.70)) }
    ];
    layers.forEach(function (L) {
      ctx.save(); ctx.translate(L.dx, L.dy);
      if (L.blur) { ctx.shadowColor = rgba(P.shadow, L.blurA); ctx.shadowBlur = L.blur; }
      ctx.fillStyle = L.fill; ctx.fill(path); ctx.restore();
    });
    var fg = ctx.createLinearGradient(-38, -38, 38, 38);
    fg.addColorStop(0, css(lerpC(gcol, WHITE, 0.8))); fg.addColorStop(0.5, css(gcol)); fg.addColorStop(1, css(lerpC(gcol, accent, 0.38)));
    ctx.fillStyle = fg; ctx.fill(path);
    ctx.restore();
  };

  DeviceGraph.prototype.badge = function (ctx, fr, isCur, online, mode) {
    var s = this.m.scale, ext = this.m.extent;
    if (isCur) {
      var r = 11 * s, bx = fr.x + ext / 2 - 8 * s, by = fr.y + ext / 2 - 8 * s;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.PI * mode);
      ctx.fillStyle = css(P.primary); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = css(P.surface); ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = css(WHITE); ctx.lineWidth = 2 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-5 * s, -2.5 * s); ctx.lineTo(5 * s, -2.5 * s); ctx.moveTo(1.5 * s, -6 * s); ctx.lineTo(5 * s, -2.5 * s); ctx.lineTo(1.5 * s, 1 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5 * s, 2.5 * s); ctx.lineTo(-5 * s, 2.5 * s); ctx.moveTo(-1.5 * s, 6 * s); ctx.lineTo(-5 * s, 2.5 * s); ctx.lineTo(-1.5 * s, -1 * s); ctx.stroke();
      ctx.restore();
    } else {
      var r2 = 5.5 * s, dx = fr.x + ext / 2 - 6.5 * s, dy = fr.y + ext / 2 - 6.5 * s;
      ctx.fillStyle = css(online ? P.primary : P.outline);
      ctx.beginPath(); ctx.arc(dx, dy, r2, 0, TAU); ctx.fill();
      ctx.strokeStyle = css(P.surface); ctx.lineWidth = 2.5 * s;
      ctx.beginPath(); ctx.arc(dx, dy, r2, 0, TAU); ctx.stroke();
    }
  };

  /* ---------- 小 SVG ---------- */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function platformGlyph(kind) {
    var paths = {
      android: '<path d="M12 8c-3.9 0-7 1.2-8.6 2.6L2 9.2 3.4 8l1.2 1.5C6.4 8.6 9 8 12 8s5.6.6 7.4 1.5L20.6 8l1.4 1.2-1.4 1.4C19 9.2 15.9 8 12 8zM7 13h10a1 1 0 0 1 1 1v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4a1 1 0 0 1 1-1z"/>',
      laptop: '<path d="M4 5h16a1 1 0 0 1 1 1v9H3V6a1 1 0 0 1 1-1zm-2 13h20l-1.5 2h-17L2 18z"/>',
      phone: '<path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 2h2v1.5h-2V5z"/>',
      server: '<path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm2 3v2h4V7H6zm0 7v2h4v-2H6zm8-7v2h4V7h-4zm0 7v2h4v-2h-4z"/>',
      devices: '<path d="M3 5h11a1 1 0 0 1 1 1v8H2V6a1 1 0 0 1 1-1zm9 5h9a1 1 0 0 1 1 1v8h-13v-8a1 1 0 0 1 1-1z"/>'
    };
    return '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">' + paths[kind] + '</svg>';
  }
  function svgLinkOff() {
    return '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 15l6-6M7.5 10.5l-2 2a4.5 4.5 0 0 0 6.4 6.4l2-2M16.5 13.5l2-2a4.5 4.5 0 0 0-6.4-6.4l-2 2M4 4l16 16"/></svg>';
  }
  function svgClose() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  }

  /* ---------- 启动 ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('deviceGraph');
    if (root) new DeviceGraph(root);
  });
})();
