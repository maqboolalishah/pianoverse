/* =====================================================================
   PianoVerse — site script
   ---------------------------------------------------------------------
   ✏️  EDIT YOUR BUSINESS DETAILS IN CONFIG BELOW. Everything else is code.
   ===================================================================== */
const CONFIG = {
  brand: 'PianoVerse',
  tagline: 'Learn piano in your browser.',
  siteUrl: 'https://pianoverse-mu.vercel.app',        // ← your live domain (also update sitemap.xml, robots.txt, canonical tags)
  contactEmail: 'hello@yourdomain.com',             // ← PLACEHOLDER
  schoolsEmail: 'schools@yourdomain.com',           // ← PLACEHOLDER
  country: '[Your Country]',                         // ← shown in "Built in …"

  /* Pricing — PLACEHOLDER prices. Yearly = monthly × 12 × (1 − yearlyDiscount). */
  currency: { symbol: '$', code: 'USD' },
  yearlyDiscount: 0.20,
  prices: { free: 0, pro: 7.99, school: 29 },       // per month
  schoolUnit: 'per teacher / month',

  /* Pre-launch: true turns the Pro buttons into "Join the Pro waitlist" (no payments are live yet).
     Set to false once checkout is connected. */
  waitlistMode: true,

  /* Features not yet in the app show a "Coming soon" badge.
     Remove an id from this list when the feature ships. */
  comingSoon: ['memory-mode', 'lessons', 'ear-training', 'recording', 'song-creator', 'school-dashboard', 'accounts'],

  social: {                                          // ← PLACEHOLDERS: your profile URLs
    instagram: 'https://www.instagram.com/',
    youtube:   'https://www.youtube.com/',
    tiktok:    'https://www.tiktok.com/',
    x:         'https://x.com/',
    facebook:  'https://www.facebook.com/',
  },

  endpoints: {
    /* Formspree (or similar) — e.g. 'https://formspree.io/f/abcdwxyz' */
    contact: '',
    /* Newsletter:
       - ConvertKit / Brevo / any JSON API that accepts {email}:  { url:'…', mode:'json' }
       - Mailchimp or Brevo embedded-form action URL:             { url:'…', mode:'no-cors', field:'EMAIL' } */
    newsletter: { url: '', mode: 'json', field: 'email' },
  },

  analytics: {
    provider: '',              // 'ga4' | 'plausible' | ''  (loaded ONLY after cookie consent)
    ga4Id: '',                 // e.g. 'G-XXXXXXXXXX'
    plausibleDomain: '',       // e.g. 'pianoverse.com'
  },

  announcement: {
    enabled: true,
    id: 'launch-1',            // change the id to show a new message to people who dismissed the old one
    text: 'PianoVerse is live — learn your first song free, right in your browser.',
    linkText: 'Start playing →',
    link: 'app/',              // relative to the site root
  },
};
/* ===================================================================== */

(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ROOT = (document.querySelector('meta[name="pv-root"]') || {}).content || '';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch (e) {} },
};

/* ---------------- Analytics (consent-gated) ---------------- */
const Analytics = {
  loaded: false, queue: [],
  consent(){ try { return JSON.parse(store.get('pv-consent') || 'null'); } catch (e) { return null; } },
  load(){
    const c = this.consent(), a = CONFIG.analytics;
    if (this.loaded || !c || !c.analytics || !a.provider) return;
    if (a.provider === 'ga4' && a.ga4Id){
      const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(a.ga4Id);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(){ dataLayer.push(arguments); };
      gtag('js', new Date()); gtag('config', a.ga4Id, { anonymize_ip: true });
      this.loaded = true;
    } else if (a.provider === 'plausible' && a.plausibleDomain){
      const s = document.createElement('script'); s.defer = true; s.dataset.domain = a.plausibleDomain; s.src = 'https://plausible.io/js/script.js';
      document.head.appendChild(s);
      window.plausible = window.plausible || function(){ (window.plausible.q = window.plausible.q || []).push(arguments); };
      this.loaded = true;
    }
    if (this.loaded){ this.queue.forEach(([n, p]) => this.track(n, p)); this.queue = []; }
  },
  track(name, props = {}){
    if (!this.loaded){ const c = this.consent(); if (c && c.analytics) this.queue.push([name, props]); return; }
    try {
      if (window.gtag) gtag('event', name, props);
      else if (window.plausible) plausible(name, { props });
    } catch (e) {}
  },
};
window.pvTrack = (n, p) => Analytics.track(n, p);

/* ---------------- Config → page ---------------- */
function applyConfig(){
  $$('[data-cfg]').forEach(el => {
    const v = el.dataset.cfg.split('.').reduce((o, k) => o && o[k], CONFIG);
    if (v == null) return;
    el.textContent = v;
    if (el.tagName === 'A' && /Email$/.test(el.dataset.cfg)) el.href = 'mailto:' + v;
  });
  $$('[data-social]').forEach(a => { const u = CONFIG.social[a.dataset.social]; if (u) a.href = u; else a.remove(); });
  $$('[data-soon]').forEach(b => b.classList.toggle('hide', !CONFIG.comingSoon.includes(b.dataset.soon)));
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
}

/* ---------------- Theme ---------------- */
function initTheme(){
  $$('.theme-btn').forEach(b => b.addEventListener('click', () => {
    const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = t; store.set('pv-theme', t);
    const m = $('meta[name="theme-color"]'); if (m) m.content = t === 'light' ? '#f6f2ea' : '#0a0a0c';
  }));
}

/* ---------------- Announcement bar ---------------- */
function initAnnouncement(){
  const bar = $('#ann'); if (!bar) return;
  const a = CONFIG.announcement;
  if (!a.enabled || store.get('pv-ann') === a.id){ bar.classList.add('off'); document.documentElement.classList.add('ann-off'); return; }
  document.documentElement.classList.remove('ann-off');
  document.documentElement.classList.add('ann-on');
  $('#annText').innerHTML = '';
  const p = $('#annText');
  p.append(document.createTextNode(a.text + ' '));
  if (a.link){ const l = document.createElement('a'); l.href = ROOT + a.link; l.textContent = a.linkText || 'Learn more'; p.append(l); }
  bar.classList.remove('off');
  $('.ann-x', bar).addEventListener('click', () => {
    store.set('pv-ann', a.id); bar.classList.add('off');
    document.documentElement.classList.remove('ann-on');
  });
}

/* ---------------- Header & mobile nav ---------------- */
function initNav(){
  const h = $('.site-header'); if (!h) return;
  const onScroll = () => h.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('.burger'), body = document.body;
  if (!burger) return;
  const set = open => {
    body.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open){ const f = $('.mnav a'); f && f.focus(); }
  };
  burger.addEventListener('click', () => set(!body.classList.contains('nav-open')));
  $$('.mnav a').forEach(a => a.addEventListener('click', () => set(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && body.classList.contains('nav-open')){ set(false); burger.focus(); } });
  addEventListener('resize', () => { if (innerWidth > 960 && body.classList.contains('nav-open')) set(false); });
}

/* ---------------- UTM preservation + CTA tracking ---------------- */
function initLinks(){
  const params = new URLSearchParams(location.search);
  const utm = {};
  params.forEach((v, k) => { if (/^utm_/i.test(k)) utm[k] = v; });
  if (Object.keys(utm).length){ try { sessionStorage.setItem('pv-utm', JSON.stringify(utm)); } catch (e) {} }
  let saved = utm;
  if (!Object.keys(saved).length){ try { saved = JSON.parse(sessionStorage.getItem('pv-utm') || '{}'); } catch (e) { saved = {}; } }
  const isApp = a => /(^|\/)app\/(index\.html)?([?#].*)?$/.test((a.getAttribute('href') || '').split('?')[0]);
  initLinks.rewrite = () => $$('a[href]').forEach(a => {
    if (!isApp(a) || !Object.keys(saved).length) return;
    const u = new URL(a.href, location.href);
    Object.entries(saved).forEach(([k, v]) => { if (!u.searchParams.has(k)) u.searchParams.set(k, v); });
    a.href = u.toString();
  });
  initLinks.rewrite();
  if (initLinks.bound) return; initLinks.bound = true;
  document.addEventListener('click', e => {
    const a = e.target.closest('a,button'); if (!a) return;
    if (a.tagName === 'A' && isApp(a)) Analytics.track('start_playing', { location: a.dataset.loc || location.pathname });
    else if (a.dataset.track) Analytics.track(a.dataset.track, { location: location.pathname });
  });
}

/* ---------------- Scroll reveal & parallax ---------------- */
function initReveal(){
  const els = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)){ els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(ents => ents.forEach(en => { if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  els.forEach(e => io.observe(e));
  const px = $$('[data-parallax]'); if (!px.length) return;
  let ticking = false;
  const run = () => { px.forEach(el => { el.style.transform = `translate3d(0,${(scrollY * parseFloat(el.dataset.parallax)).toFixed(1)}px,0)`; }); ticking = false; };
  addEventListener('scroll', () => { if (!ticking){ ticking = true; requestAnimationFrame(run); } }, { passive: true });
}

/* =====================================================================
   AUDIO — tiny piano synth, unlocked on first gesture (works on iOS)
   ===================================================================== */
const Synth = (() => {
  let ctx = null, out = null;
  function init(){
    if (ctx){ if (ctx.state !== 'running') ctx.resume().catch(() => {}); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC({ latencyHint: 'interactive' });
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    out = ctx.createGain(); out.gain.value = .75; out.connect(comp); comp.connect(ctx.destination);
    // iOS unlock: play one silent sample inside the gesture
    const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0);
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    return ctx;
  }
  function play(midi, vel = .8){
    if (!init()) return () => {};
    const t = ctx.currentTime, f = 440 * Math.pow(2, (midi - 69) / 12);
    const g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(16000, f * (4 + vel * 8) + 900), t); lp.frequency.setTargetAtTime(f * 2.2 + 300, t + .02, .6);
    const peak = .05 + .2 * vel, decay = Math.max(1, 4.5 - (midi - 48) * .05);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .004);
    g.gain.setTargetAtTime(peak * .35, t + .005, .3); g.gain.setTargetAtTime(0, t + .5, decay / 3);
    const oscs = [[1, 1], [2, .45], [3, .22], [4, .1], [5, .05]].map(([n, a], i) => {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.frequency.value = f * n * Math.sqrt(1 + .0004 * n * n);
      og.gain.setValueAtTime(a, t); og.gain.setTargetAtTime(a * (i ? .1 : .6), t + .01, decay / (1 + i));
      o.connect(og); og.connect(lp); o.start(t); return o;
    });
    lp.connect(g); g.connect(out);
    let done = false;
    return () => {
      if (done) return; done = true;
      const n = ctx.currentTime;
      try { g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); } catch (e) {}
      g.gain.setTargetAtTime(0, n, .09);
      oscs.forEach(o => { try { o.stop(n + .7); } catch (e) {} });
    };
  }
  return { init, play };
})();

/* =====================================================================
   MINI PIANO — 1 octave (C4–C5), multi-touch, glissando, PC keys,
   optional looping falling-notes preview
   ===================================================================== */
const SHARP = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const SOLF = ['Do','Do♯','Re','Re♯','Mi','Fa','Fa♯','Sol','Sol♯','La','La♯','Ti'];
const SARGAM = [['Sa',''],['Re','k'],['Re',''],['Ga','k'],['Ga',''],['Ma',''],['Ma','t'],['Pa',''],['Dha','k'],['Dha',''],['Ni','k'],['Ni','']];
const PCKEYS = ['A','W','S','E','D','F','T','G','Y','H','U','J','K'];
const PCCODE = { KeyA:0, KeyW:1, KeyS:2, KeyE:3, KeyD:4, KeyF:5, KeyT:6, KeyG:7, KeyY:8, KeyH:9, KeyU:10, KeyJ:11, KeyK:12 };
const isBlack = m => [1,3,6,8,10].includes(m % 12);
function label(m, mode, i){
  const pc = m % 12, up = m >= 72;
  switch (mode){
    case 'western': return SHARP[pc] + (pc === 0 ? `<sub style="font-size:.7em;opacity:.7">${Math.floor(m / 12) - 1}</sub>` : '');
    case 'solfege': return SOLF[pc];
    case 'sargam': { const [n, k] = SARGAM[pc]; return `<span class="sg${k ? ' ' + k : ''}${up ? ' up' : ''}">${n}</span>`; }
    case 'pc': return PCKEYS[i] || '';
    default: return '';
  }
}
let activePianoForKeys = null;
class MiniPiano {
  constructor(root, opts = {}){
    this.root = root; this.start = opts.start || 60; this.mode = opts.labels || 'pc';
    this.keys = []; this.ptr = new Map(); this.stops = new Map(); this.onPlay = opts.onPlay;
    const whites = [];
    for (let i = 0; i <= 12; i++){ const m = this.start + i; if (!isBlack(m)) whites.push(m); }
    const ww = 100 / whites.length;
    root.innerHTML = ''; root.classList.add('mp');
    root.setAttribute('role', 'group'); root.setAttribute('aria-label', 'Playable piano keyboard, one octave');
    let wi = 0;
    for (let i = 0; i <= 12; i++){
      const m = this.start + i, el = document.createElement('div');
      el.className = isBlack(m) ? 'mp-b' : 'mp-w'; el.dataset.m = m; el.dataset.i = i;
      el.setAttribute('role', 'button'); el.setAttribute('aria-label', SHARP[m % 12].replace('♯', ' sharp') + ' ' + (Math.floor(m / 12) - 1));
      if (isBlack(m)){ const off = { 1:-.08, 3:.08, 6:-.1, 8:0, 10:.1 }[m % 12] || 0; el.style.left = `calc(${wi * ww}% - ${ww * .3}% + ${off * ww}%)`; el.style.width = (ww * .6) + '%'; }
      else wi++;
      el.innerHTML = '<span class="mp-l"></span>';
      root.appendChild(el); this.keys[i] = el;
    }
    this.setLabels(this.mode, true);
    this.bind();
    if (opts.keyboard) activePianoForKeys = this;
  }
  setLabels(mode, instant){
    this.mode = mode;
    const apply = () => this.keys.forEach((k, i) => k.firstChild.innerHTML = label(this.start + i, mode, i));
    if (instant || reduceMotion) return apply();
    this.root.classList.add('relabel');
    setTimeout(() => { apply(); this.root.classList.remove('relabel'); }, 160);
  }
  keyEl(m){ return this.keys[m - this.start]; }
  down(m, vel = .8, src = 'x'){
    const el = this.keyEl(m); if (!el || this.stops.has(src)) return;
    el.classList.add('down');
    this.stops.set(src, [m, Synth.play(m, vel)]);
    this.onPlay && this.onPlay(m, true);
    if (!this.played){ this.played = true; Analytics.track('mini_piano_play', { location: location.pathname }); }
  }
  up(src){
    const s = this.stops.get(src); if (!s) return;
    this.stops.delete(src);
    const [m, stop] = s; stop();
    if (![...this.stops.values()].some(([mm]) => mm === m)){ const el = this.keyEl(m); el && el.classList.remove('down'); }
    this.onPlay && this.onPlay(m, false);
  }
  bind(){
    const r = this.root;
    const at = (x, y) => { const el = document.elementFromPoint(x, y); const k = el && el.closest('.mp-w,.mp-b'); return k && r.contains(k) ? k : null; };
    const vel = (e, k) => { const b = k.getBoundingClientRect(); return .35 + .6 * Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)); };
    r.addEventListener('pointerdown', e => {
      e.preventDefault(); Synth.init();
      try { r.setPointerCapture(e.pointerId); } catch (err) {}
      const k = at(e.clientX, e.clientY); if (!k) return;
      this.ptr.set(e.pointerId, +k.dataset.m); this.down(+k.dataset.m, vel(e, k), 'p' + e.pointerId);
      activePianoForKeys = this.keyboardEnabled ? this : activePianoForKeys;
    });
    r.addEventListener('pointermove', e => {
      if (!this.ptr.has(e.pointerId)) return;
      const k = at(e.clientX, e.clientY), m = k ? +k.dataset.m : null;
      if (m === this.ptr.get(e.pointerId)) return;
      this.up('p' + e.pointerId); this.ptr.set(e.pointerId, m);
      if (m != null) this.down(m, vel(e, k) * .9, 'p' + e.pointerId);
    });
    const end = e => { if (this.ptr.has(e.pointerId)){ this.up('p' + e.pointerId); this.ptr.delete(e.pointerId); } };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => r.addEventListener(t, end));
    r.addEventListener('contextmenu', e => e.preventDefault());
  }
}
/* PC keyboard → the hero (or 404) piano */
function initPcKeys(){
  const held = {};
  addEventListener('keydown', e => {
    const p = activePianoForKeys; if (!p || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable) return;
    if (!(e.code in PCCODE)) return;
    const r = p.root.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;  // only when visible
    e.preventDefault(); Synth.init();
    held[e.code] = true; p.down(p.start + PCCODE[e.code], .78, 'k' + e.code);
  });
  addEventListener('keyup', e => { if (held[e.code] && activePianoForKeys){ activePianoForKeys.up('k' + e.code); delete held[e.code]; } });
  addEventListener('blur', () => { Object.keys(held).forEach(c => { activePianoForKeys && activePianoForKeys.up('k' + c); delete held[c]; }); });
}

/* Falling-notes preview above a mini piano (loops "Twinkle Twinkle") */
function initHighway(canvas, piano){
  const g = canvas.getContext('2d');
  const melody = [[60,1],[60,1],[67,1],[67,1],[69,1],[69,1],[67,2],[65,1],[65,1],[64,1],[64,1],[62,1],[62,1],[60,2]];
  const bpm = 96, spb = 60 / bpm, total = melody.reduce((a, n) => a + n[1], 0) + 2;
  let b = 0; const ev = melody.map(([m, d]) => { const e = { m, s: b, d }; b += d; return e; });
  const rising = []; let w = 0, h = 0, visible = true, t0 = performance.now(), lit = new Set();
  const resize = () => { const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); w = r.width; h = r.height; canvas.width = w * dpr; canvas.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize(); addEventListener('resize', resize);
  piano.onPlay = (m, on) => { if (on) rising.push({ m, t: performance.now(), end: null }); else { for (let i = rising.length - 1; i >= 0; i--) if (rising[i].m === m && !rising[i].end){ rising[i].end = performance.now(); break; } } };
  const geo = m => { const k = piano.keyEl(m), cr = canvas.getBoundingClientRect(), kr = k.getBoundingClientRect(); return { x: kr.left - cr.left, w: kr.width }; };
  function rr(x, y, ww, hh, r){ g.beginPath(); g.roundRect ? g.roundRect(x, y, ww, hh, r) : g.rect(x, y, ww, hh); }
  if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) requestAnimationFrame(draw); }).observe(canvas);
  const ppb = () => Math.max(34, h / 4.2);
  function draw(now){
    if (!visible) return;
    g.clearRect(0, 0, w, h);
    const beat = reduceMotion ? 3 : (((now - t0) / 1000) / spb) % total;
    const P = ppb(), newLit = new Set();
    for (const e of ev){
      const yb = h - (e.s - beat) * P, yt = yb - e.d * P + 3;
      if (yt > h || yb < 0) continue;
      const { x, w: kw } = geo(e.m);
      const grd = g.createLinearGradient(0, yt, 0, yb); grd.addColorStop(0, 'rgba(227,184,102,.55)'); grd.addColorStop(1, '#f6d999');
      g.globalAlpha = e.s + e.d < beat ? .25 : 1; g.fillStyle = grd; rr(x + 3, yt, kw - 6, Math.max(6, yb - yt), 6); g.fill(); g.globalAlpha = 1;
      if (e.s <= beat && beat < e.s + e.d - .08) newLit.add(e.m);
    }
    // keys lit by the preview
    lit.forEach(m => { if (!newLit.has(m)) piano.keyEl(m).classList.remove('lit'); });
    newLit.forEach(m => { if (!lit.has(m)) piano.keyEl(m).classList.add('lit'); });
    lit = newLit;
    // notes the visitor plays rise upward
    for (let i = rising.length - 1; i >= 0; i--){
      const r = rising[i], top = h - (now - r.t) * .16, bot = r.end ? h - (now - r.end) * .16 : h;
      if (bot < -10){ rising.splice(i, 1); continue; }
      const { x, w: kw } = geo(r.m);
      const grd = g.createLinearGradient(0, top, 0, bot); grd.addColorStop(0, 'rgba(122,174,255,0)'); grd.addColorStop(1, 'rgba(160,200,255,.95)');
      g.fillStyle = grd; rr(x + 3, Math.max(top, -10), kw - 6, Math.max(4, bot - Math.max(top, -10)), 6); g.fill();
    }
    g.fillStyle = 'rgba(227,184,102,.6)'; g.fillRect(0, h - 2, w, 2);
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

/* ---------------- Notation showcase ---------------- */
const NOTATION_INFO = {
  western: ['Western letters', 'C D E F G A B — the international standard used in sheet music, chord charts and most method books.', 'C  C  G  G  A  A  G — F  F  E  E  D  D  C'],
  sargam:  ['Indian Sargam', 'Sa Re Ga Ma Pa Dha Ni — the system of Hindustani and Carnatic music. Komal (flat) notes are underlined; tivra Ma carries a mark above.', 'Sa  Sa  Pa  Pa  Dha  Dha  Pa — Ma  Ma  Ga  Ga  Re  Re  Sa'],
  solfege: ['Solfège', 'Do Re Mi Fa Sol La Ti — the singing names taught in schools worldwide. Great if you already sing.', 'Do  Do  Sol  Sol  La  La  Sol — Fa  Fa  Mi  Mi  Re  Re  Do'],
  pc:      ['PC keyboard keys', 'No piano? Your computer keyboard becomes one: A S D F G H J K for the white keys, W E T Y U for the black keys.', 'A  A  G  G  H  H  G — F  F  D  D  S  S  A'],
};
function initNotation(){
  const box = $('#notationDemo'); if (!box) return;
  const piano = new MiniPiano($('.mp-host', box), { labels: 'western' });
  const btns = $$('[data-notation]', box);
  const set = mode => {
    btns.forEach(b => b.setAttribute('aria-pressed', b.dataset.notation === mode));
    piano.setLabels(mode);
    const [t, d, line] = NOTATION_INFO[mode];
    $('#ntTitle').textContent = t; $('#ntText').textContent = d; $('#ntLine').textContent = line;
  };
  btns.forEach(b => b.addEventListener('click', () => { set(b.dataset.notation); Analytics.track('notation_toggle', { notation: b.dataset.notation }); }));
  set('western');
}

/* ---------------- Song carousel (public-domain & traditional songs in the app) ---------------- */
const SONGS = [
  ['Twinkle Twinkle Little Star','beginner','Traditional · French melody, 1761','english'],
  ['Mary Had a Little Lamb','beginner','Traditional · American, 1830s','english'],
  ['Ode to Joy','easy','Beethoven · Symphony No. 9','english'],
  ['Jingle Bells','easy','James Lord Pierpont, 1857','english'],
  ['Happy Birthday','easy','Traditional melody','english'],
  ['Für Elise (opening)','intermediate','Beethoven, 1810','english'],
  ['Amazing Grace','easy','Traditional hymn tune','english'],
  ['Silent Night','easy','Franz Xaver Gruber, 1818','english'],
  ['Minuet in G','intermediate','Christian Petzold, 1725','english'],
  ['Greensleeves','intermediate','Traditional · English','english'],
  ['Canon in D (simplified)','intermediate','Johann Pachelbel','english'],
  ['Sargam Basics','beginner','Aaroh & Avroh · Sa is C','indian'],
  ['Raag Yaman','easy','Aaroh, Avroh & Pakad','indian'],
  ['Machli Jal Ki Rani Hai','beginner','Traditional rhyme','indian'],
  ['Aloo Kachaloo','beginner','Traditional rhyme','indian'],
  ['Raghupati Raghav Raja Ram','easy','Traditional bhajan','indian'],
  ['Vaishnav Jan To','intermediate','Narsinh Mehta · simplified','indian'],
  ['Om Jai Jagdish Hare','easy','Aarti · simplified','indian'],
  ['Jana Gana Mana (opening)','intermediate','Rabindranath Tagore · simplified','indian'],
];
const hue = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
function initCarousel(){
  const box = $('#songs'); if (!box) return;
  const track = $('.track', box), tabs = $$('[data-tab]', box);
  const render = lang => {
    track.innerHTML = SONGS.filter(s => s[3] === lang).map(([t, d, o]) => {
      const h = hue(t), dots = Array.from({ length: 9 }, (_, i) => `<circle cx="${8 + i * 10.5}" cy="${14 + ((h * (i + 3)) % 36)}" r="2.6"/>`).join('');
      return `<a class="song" href="${ROOT}app/" data-loc="song-carousel"><div class="song-art" style="--h:${h}"><span class="diff ${d}">${d}</span>
        <svg viewBox="0 0 100 64" preserveAspectRatio="none" aria-hidden="true"><path d="M0 14H100M0 23H100M0 32H100M0 41H100M0 50H100"/>${dots}</svg></div>
        <div class="song-body"><h3>${t}</h3><p>${o}</p></div></a>`;
    }).join('');
    track.scrollLeft = 0;
    initLinks.rewrite && initLinks.rewrite();
  };
  tabs.forEach(b => b.addEventListener('click', () => { tabs.forEach(x => x.setAttribute('aria-selected', x === b)); render(b.dataset.tab); }));
  $('[data-prev]', box).addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * .8 }));
  $('[data-next]', box).addEventListener('click', () => track.scrollBy({ left: track.clientWidth * .8 }));
  render('english');
}

/* ---------------- Pricing ---------------- */
function money(v){
  const s = CONFIG.currency.symbol;
  return v === 0 ? s + '0' : s + (Math.round(v * 100) / 100).toFixed(v % 1 === 0 ? 0 : 2);
}
function initPricing(){
  const toggles = $$('[data-billing]'); if (!$$('[data-price]').length) return;
  const d = CONFIG.yearlyDiscount;
  $$('[data-save]').forEach(el => el.textContent = `Save ${Math.round(d * 100)}%`);
  const render = mode => {
    toggles.forEach(b => b.setAttribute('aria-pressed', b.dataset.billing === mode));
    $$('[data-price]').forEach(el => {
      const m = CONFIG.prices[el.dataset.price];
      el.textContent = money(mode === 'yearly' ? m * (1 - d) : m);
    });
    $$('[data-pnote]').forEach(el => {
      const k = el.dataset.pnote, m = CONFIG.prices[k];
      if (m === 0){ el.textContent = 'Free forever'; return; }
      const unit = k === 'school' ? ' ' + CONFIG.schoolUnit.replace('/ month', '') : '';
      el.textContent = mode === 'yearly' ? `Billed ${money(m * 12 * (1 - d))} yearly${unit}` : `Billed monthly${unit}`;
    });
  };
  toggles.forEach(b => b.addEventListener('click', () => { render(b.dataset.billing); Analytics.track('pricing_toggle', { billing: b.dataset.billing }); }));
  render('monthly');
  if (CONFIG.waitlistMode) $$('[data-plan-cta]').forEach(a => {
    if (a.dataset.planCta !== 'pro') return;
    a.textContent = 'Join the Pro waitlist'; a.href = ROOT + 'index.html#newsletter'; a.dataset.track = 'waitlist_click';
  });
}

/* ---------------- Forms ---------------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function validate(form){
  let ok = true, first = null;
  $$('input,textarea,select', form).forEach(f => {
    if (f.type === 'hidden' || f.closest('.hp')) return;
    let msg = '';
    const v = (f.value || '').trim();
    if (f.required && !v) msg = f.dataset.req || 'This field is required.';
    else if (f.type === 'email' && v && !EMAIL_RE.test(v)) msg = 'Please enter a valid email address.';
    else if (f.minLength > 0 && v && v.length < f.minLength) msg = `Please write at least ${f.minLength} characters.`;
    const err = f.parentElement.querySelector('.err');
    if (err) err.textContent = msg;
    f.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg){ ok = false; first = first || f; }
  });
  if (first) first.focus();
  return ok;
}
const isLocal = () => /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) || location.protocol === 'file:';
function setMsg(form, text, kind){ const m = $('.form-msg', form); if (m){ m.textContent = text; m.className = 'form-msg ' + kind; } }
function initForms(){
  $$('form[data-form]').forEach(form => {
    $$('input,textarea,select', form).forEach(f => f.addEventListener('blur', () => { if (f.getAttribute('aria-invalid') === 'true') validate(form); }));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if ($('.hp input', form) && $('.hp input', form).value) return;      // honeypot → bot
      if (!validate(form)) { setMsg(form, 'Please fix the highlighted fields.', 'err'); return; }
      const kind = form.dataset.form, btn = $('button[type=submit]', form), label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending…'; setMsg(form, '', '');
      try {
        if (kind === 'contact') await sendContact(form); else await sendNewsletter(form);
        form.reset();
        setMsg(form, kind === 'contact' ? 'Thank you — your message is on its way. We reply within 2 business days.' : 'You’re in! Check your inbox to confirm your subscription.', 'ok');
        Analytics.track(kind === 'contact' ? 'contact_submit' : 'newsletter_signup', { location: location.pathname });
      } catch (err) {
        setMsg(form, err.message || 'Something went wrong. Please try again.', 'err');
      } finally { btn.disabled = false; btn.textContent = label; }
    });
  });
}
async function sendContact(form){
  const url = CONFIG.endpoints.contact;
  if (!url){
    if (isLocal()){ console.info('[PianoVerse] Contact form OK (demo). Set CONFIG.endpoints.contact to receive messages.'); return; }
    throw new Error(`Our form is being set up — please email us at ${CONFIG.contactEmail}.`);
  }
  const res = await fetch(url, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`We couldn’t send your message. Please email ${CONFIG.contactEmail}.`);
}
async function sendNewsletter(form){
  const cfg = CONFIG.endpoints.newsletter || {}, email = $('input[type=email]', form).value.trim();
  if (!cfg.url){
    if (isLocal()){ console.info('[PianoVerse] Newsletter OK (demo). Set CONFIG.endpoints.newsletter.url.'); return; }
    throw new Error('Signups open very soon — please check back shortly.');
  }
  const field = cfg.field || 'email';
  if (cfg.mode === 'no-cors'){
    const fd = new FormData(); fd.append(field, email);
    await fetch(cfg.url, { method: 'POST', mode: 'no-cors', body: fd });
    return;
  }
  const res = await fetch(cfg.url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ [field]: email, source: form.dataset.source || 'site' }) });
  if (!res.ok) throw new Error('We couldn’t sign you up. Please try again.');
}

/* ---------------- Cookie consent ---------------- */
function initConsent(){
  const bar = $('#cookie'), modal = $('#cookieModal'); if (!bar) return;
  const save = analytics => {
    store.set('pv-consent', JSON.stringify({ analytics, ts: Date.now() }));
    bar.classList.remove('show'); closeModal();
    if (analytics) Analytics.load();
  };
  const openModal = () => {
    const c = Analytics.consent(); $('#ckAnalytics').checked = !!(c && c.analytics);
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); setTimeout(() => $('#ckAnalytics').focus(), 50);
  };
  const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); };
  if (!Analytics.consent()) setTimeout(() => bar.classList.add('show'), 900);
  else Analytics.load();
  $('[data-ck="accept"]', bar).addEventListener('click', () => save(true));
  $('[data-ck="reject"]', bar).addEventListener('click', () => save(false));
  $('[data-ck="settings"]', bar).addEventListener('click', openModal);
  $$('[data-cookie-settings]').forEach(b => b.addEventListener('click', openModal));
  $('[data-ck="save"]', modal).addEventListener('click', () => save($('#ckAnalytics').checked));
  $('[data-ck="close"]', modal).addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
}

/* ---------------- Blog filters & sharing ---------------- */
function initBlog(){
  const f = $$('[data-filter]');
  f.forEach(b => b.addEventListener('click', () => {
    f.forEach(x => x.setAttribute('aria-pressed', x === b));
    $$('.post[data-cat]').forEach(p => p.classList.toggle('hide', b.dataset.filter !== 'all' && !p.dataset.cat.split(' ').includes(b.dataset.filter)));
  }));
  const share = $('[data-share]'); if (!share) return;
  const url = encodeURIComponent((document.querySelector('link[rel=canonical]') || {}).href || location.href);
  const title = encodeURIComponent(document.title);
  const links = { x: `https://x.com/intent/tweet?url=${url}&text=${title}`, facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, whatsapp: `https://wa.me/?text=${title}%20${url}` };
  $$('a[data-net]', share).forEach(a => { a.href = links[a.dataset.net]; a.target = '_blank'; a.rel = 'noopener'; a.addEventListener('click', () => Analytics.track('share', { network: a.dataset.net })); });
  const copy = $('[data-copy]', share);
  copy && copy.addEventListener('click', async () => {
    const u = decodeURIComponent(url);
    try { if (navigator.share && matchMedia('(pointer:coarse)').matches) await navigator.share({ title: document.title, url: u }); else { await navigator.clipboard.writeText(u); copy.setAttribute('aria-label', 'Link copied'); copy.title = 'Link copied'; } } catch (e) {}
  });
}

/* ---------------- PWA ---------------- */
function initSW(){
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  addEventListener('load', () => navigator.serviceWorker.register(ROOT + 'sw.js').catch(() => {}));
}

/* ---------------- Boot ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  applyConfig(); initTheme(); initAnnouncement(); initNav(); initReveal();
  initCarousel(); initLinks(); initPricing(); initForms(); initConsent(); initBlog(); initSW(); initPcKeys();
  const hero = $('#heroPiano');
  if (hero){ const p = new MiniPiano(hero, { labels: 'pc', keyboard: true }); p.keyboardEnabled = true; activePianoForKeys = p; const c = $('#heroHighway'); if (c) initHighway(c, p); }
  initNotation();
});
})();
