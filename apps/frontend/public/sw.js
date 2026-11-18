// Retires the old next-pwa service worker. The site no longer registers one,
// but browsers that installed it from an older build keep it until a new
// sw.js replaces it: this version clears its caches and unregisters itself.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
    })(),
  );
});
