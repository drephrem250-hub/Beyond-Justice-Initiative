const CACHE_NAME = 'beyond-justice-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './rwanda_locations.json',
  // Normally we would cache fonts and images here
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  // If it's a request to an external API (like Firebase), don't cache it
  if (event.request.url.includes('firestore') || event.request.url.includes('identitytoolkit') || event.request.url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if found, else fetch from network
        return response || fetch(event.request);
      })
  );
});
