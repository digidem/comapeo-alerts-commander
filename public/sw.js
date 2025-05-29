const CACHE_NAME = "comaeo-alert-v1";
const urlsToCache = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
});

self.addEventListener("fetch", (event) => {
  // Skip API requests entirely - let them go through normally without service worker interference
  if (
    event.request.url.includes("/projects") ||
    event.request.url.includes("/alerts") ||
    event.request.url.includes("comapeo.cloud") ||
    event.request.url.includes("api.")
  ) {
    return; // Don't intercept API requests
  }

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Cache-first strategy for app shell only
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch(() => {
        // Return a proper Response object for offline scenarios
        return new Response("Offline", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain" },
        });
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
