// Service Worker for PWA support
const CACHE_NAME = "ጥናት ቤት-v1"
const urlsToCache = ["/", "/dashboard/student", "/dashboard/tutor", "/dashboard/parent", "/auth/login", "/auth/signup"]

self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
})

self.addEventListener("fetch", (event: any) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    }),
  )
})
