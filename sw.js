// Sprouted Grace service worker. It keeps the app and the Bible on the phone so they open fast and work offline.
// Change VERSION whenever you change index.html, so phones get the update.
const VERSION = 'sproutedgrace-v13';
const BIBLE = 'sproutedgrace-bible-v1';   // Bible files never change, so they keep their own cache
const SHELL = ['/', '/index.html', '/manifest.json', '/logo.png', '/hero.jpg', '/favicon.png', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/qrcode.js',
  '/fonts/EBGaramond-Regular.woff', '/fonts/EBGaramond-SemiBold.woff', '/fonts/EBGaramond-Italic.woff',
  '/bible/kjv/43.json', '/bible/web/43.json'];
self.addEventListener('install', e => {
  // Add each file on its own, so one missing file does not stop the update.
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== BIBLE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // never cache Supabase, payments, or other sites
  if (e.request.mode === 'navigate') {
    // Pages: try the network first so updates show up, fall back to the saved copy offline.
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('/index.html', copy)); return r; })
      .catch(() => caches.match('/index.html')));
    return;
  }
  // Everything else: use the saved copy if there is one, otherwise get it and save it.
  const bucket = url.pathname.startsWith('/bible/') ? BIBLE : VERSION;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(bucket).then(c => c.put(e.request, copy)); }
    return r;
  })));
});
