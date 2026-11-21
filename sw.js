/* PianoVerse service worker — offline support for the site and the piano app.
   Bump VERSION whenever you deploy changes to cached files. */
const VERSION = 'pv-v1';
const CORE = [
  './', './index.html', './features.html', './pricing.html', './lessons.html', './about.html',
  './contact.html', './faq.html', './privacy.html', './terms.html', './404.html',
  './blog/', './blog/learn-piano-online-free.html', './blog/sargam-vs-western-notation.html', './blog/easy-piano-songs-for-beginners.html',
  './app/', './assets/css/styles.css', './assets/js/main.js', './manifest.json',
  './assets/img/favicon.svg', './assets/img/icon-192.png', './assets/img/icon-512.png'
];
const RUNTIME_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'tonejs.github.io'];   // fonts + piano samples

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'pv-runtime').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Pages: network first (fresh content), fall back to cache, then the 404 page
  if (req.mode === 'navigate'){
    e.respondWith(fetch(req).then(res => {
      if (res.ok){ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./404.html'))));
    return;
  }
  // Same-origin assets: stale-while-revalidate
  if (url.origin === location.origin){
    e.respondWith(caches.match(req).then(cached => {
      const net = fetch(req).then(res => { if (res.ok){ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; }).catch(() => cached);
      return cached || net;
    }));
    return;
  }
  // Fonts & piano samples: cache first (they never change)
  if (RUNTIME_HOSTS.includes(url.hostname)){
    e.respondWith(caches.open('pv-runtime').then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());   // cloned before the page reads it
      return res;
    }))));
  }
});
