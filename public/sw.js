const CACHE = "tereto-v1";
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || e.request.url.includes("/api/") || e.request.url.includes("supabase")) return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
