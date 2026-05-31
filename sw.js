const CACHE = "ru-en-v7";
const ASSETS = [
  "./index.html",
  "./css/style.css",
  "./js/grammar.js",
  "./js/data.js",
  "./js/srs.js",
  "./js/storage.js",
  "./js/crypto_backup.js",
  "./js/export.js",
  "./js/kb.js",
  "./js/ai_lesson.js",
  "./js/sentences.js",
  "./js/speech.js",
  "./js/app.js",
  "./js/onboarding.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
