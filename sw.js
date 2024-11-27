const CACHE_NAME = "timetable-cache";
const urlsToCache = ["/", "/styles.css", "/app.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  ); 
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "save-timetable") {
    event.waitUntil(
      new Promise((resolve) => {
        const timetable = JSON.parse(localStorage.getItem("timetable"));
        if (timetable) {
          // Save the timetable to server or perform any required sync operations
          console.log("Timetable data synced:", timetable);
        }
        resolve();
      })
    );
  }
});
