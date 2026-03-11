self.addEventListener('install', (event) => {
    // Basic service worker just to pass PWA installation requirements
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Important: A fetch handler is absolutely required by Chrome to show the installation prompt.
    // We just pass the request through.
    event.respondWith(fetch(event.request));
});
