// Nome e versione della cache. Cambiare la versione forza l'aggiornamento.
const CACHE_NAME = 'report-generator-v2';

// Lista dei file principali dell'applicazione
const APP_FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/comuni.json',
    '/agenti.json',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Lista completa delle mappe da salvare per l'uso offline
const MAP_FILES_TO_CACHE = [
    // Mappe per Belgio e Lussemburgo
    '/FR_maps/belgium.jpeg',
    '/FR_maps/luxembourg.jpeg',
    // Mappe dipartimenti francesi (inclusa quella per Monaco, la 06)
    '/FR_maps/01.jpeg', '/FR_maps/02.jpeg', '/FR_maps/03.jpeg', '/FR_maps/04.jpeg', '/FR_maps/05.jpeg', 
    '/FR_maps/06.jpeg', '/FR_maps/07.jpeg', '/FR_maps/08.jpeg', '/FR_maps/09.jpeg', '/FR_maps/10.jpeg', 
    '/FR_maps/11.jpeg', '/FR_maps/12.jpeg', '/FR_maps/13.jpeg', '/FR_maps/14.jpeg', '/FR_maps/15.jpeg', 
    '/FR_maps/16.jpeg', '/FR_maps/17.jpeg', '/FR_maps/18.jpeg', '/FR_maps/19.jpeg', '/FR_maps/2A.jpeg', 
    '/FR_maps/2B.jpeg', '/FR_maps/21.jpeg', '/FR_maps/22.jpeg', '/FR_maps/23.jpeg', '/FR_maps/24.jpeg', 
    '/FR_maps/25.jpeg', '/FR_maps/26.jpeg', '/FR_maps/27.jpeg', '/FR_maps/28.jpeg', '/FR_maps/29.jpeg', 
    '/FR_maps/30.jpeg', '/FR_maps/31.jpeg', '/FR_maps/32.jpeg', '/FR_maps/33.jpeg', '/FR_maps/34.jpeg', 
    '/FR_maps/35.jpeg', '/FR_maps/36.jpeg', '/FR_maps/37.jpeg', '/FR_maps/38.jpeg', '/FR_maps/39.jpeg', 
    '/FR_maps/40.jpeg', '/FR_maps/41.jpeg', '/FR_maps/42.jpeg', '/FR_maps/43.jpeg', '/FR_maps/44.jpeg', 
    '/FR_maps/45.jpeg', '/FR_maps/46.jpeg', '/FR_maps/47.jpeg', '/FR_maps/48.jpeg', '/FR_maps/49.jpeg', 
    '/FR_maps/50.jpeg', '/FR_maps/51.jpeg', '/FR_maps/52.jpeg', '/FR_maps/53.jpeg', '/FR_maps/54.jpeg', 
    '/FR_maps/55.jpeg', '/FR_maps/56.jpeg', '/FR_maps/57.jpeg', '/FR_maps/58.jpeg', '/FR_maps/59.jpeg', 
    '/FR_maps/60.jpeg', '/FR_maps/61.jpeg', '/FR_maps/62.jpeg', '/FR_maps/63.jpeg', '/FR_maps/64.jpeg', 
    '/FR_maps/65.jpeg', '/FR_maps/66.jpeg', '/FR_maps/67.jpeg', '/FR_maps/68.jpeg', '/FR_maps/69.jpeg', 
    '/FR_maps/70.jpeg', '/FR_maps/71.jpeg', '/FR_maps/72.jpeg', '/FR_maps/73.jpeg', '/FR_maps/74.jpeg', 
    '/FR_maps/75.jpeg', '/FR_maps/76.jpeg', '/FR_maps/77.jpeg', '/FR_maps/78.jpeg', '/FR_maps/79.jpeg', 
    '/FR_maps/80.jpeg', '/FR_maps/81.jpeg', '/FR_maps/82.jpeg', '/FR_maps/83.jpeg', '/FR_maps/84.jpeg', 
    '/FR_maps/85.jpeg', '/FR_maps/86.jpeg', '/FR_maps/87.jpeg', '/FR_maps/88.jpeg', '/FR_maps/89.jpeg', 
    '/FR_maps/90.jpeg', '/FR_maps/91.jpeg', '/FR_maps/92.jpeg', '/FR_maps/93.jpeg', '/FR_maps/94.jpeg', 
    '/FR_maps/95.jpeg'
];

const URLS_TO_CACHE = [...APP_FILES_TO_CACHE, ...MAP_FILES_TO_CACHE];

// Evento di installazione: salva tutti i file nella cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aperta, aggiungo i file principali e le mappe...');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

// Evento di attivazione: pulisce le vecchie cache
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Rimuovo la vecchia cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Evento fetch: intercetta le richieste e risponde con i file in cache se disponibili
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
