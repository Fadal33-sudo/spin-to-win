
const CACHE_NAME = 'spin-win-v1';
const urlsToCache = [
  '/',
  '/style.css',
  '/script.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Push notification support
self.addEventListener('push', function(event) {
  const options = {
    body: 'Waqtigii spin-ka cusub ayaa la gaaray! 🎰',
    icon: 'https://cdn-icons-png.flaticon.com/512/3106/3106787.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3106/3106787.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Spin Now',
        icon: 'https://cdn-icons-png.flaticon.com/512/3106/3106787.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: 'https://cdn-icons-png.flaticon.com/512/3106/3106787.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Spin to Win', options)
  );
});
