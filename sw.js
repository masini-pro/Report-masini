const CACHE_NAME = 'report-generator-v1';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/comuni.json',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Installazione del Service Worker e caching dei file
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aperta');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

// Intercettazione delle richieste di rete
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Se la risorsa è in cache, la restituisce
                if (response) {
                    return response;
                }
                // Altrimenti, la richiede dalla rete
                return fetch(event.request);
            })
    );
});