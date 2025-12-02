import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import {
  StaleWhileRevalidate,
  CacheFirst,
  NetworkFirst,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { skipWaiting, clientsClaim } from "workbox-core";
import StoryIdb from "./data/story-db";

skipWaiting();
clientsClaim();

// 1. Precache App Shell
precacheAndRoute(self.__WB_MANIFEST);

// 2. Navigation Fallback
const handler = createHandlerBoundToURL("./index.html");
const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute);

// 3. Caching API Stories
registerRoute(
  ({ url }) => url.href.includes("/stories"),
  new NetworkFirst({
    cacheName: "stories-api-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24,
      }),
    ],
  })
);

// 4. Caching Images
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

// 5. Caching Static Resources
registerRoute(
  ({ url }) =>
    url.origin.includes("fonts.googleapis.com") ||
    url.origin.includes("fonts.gstatic.com") ||
    url.href.endsWith(".css") ||
    url.href.endsWith(".js"),
  new StaleWhileRevalidate({
    cacheName: "static-resources",
  })
);

// 6. Caching Map Tiles
registerRoute(
  ({ url }) => url.origin.includes("tile.openstreetmap.org"),
  new CacheFirst({
    cacheName: "map-tiles-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  })
);

// ==========================================
// PERBAIKAN: PUSH NOTIFICATION EVENT
// ==========================================
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received.");

  let data = {};
  try {
    // Coba parsing JSON
    data = event.data.json();
  } catch (e) {
    // Fallback jika data berupa text string biasa
    data = {
      title: "StoryApp",
      body: event.data ? event.data.text() : "Ada update baru!",
    };
  }

  const title = data.title || "StoryApp Notification";
  const options = {
    body: data.body || "Cek cerita terbaru di StoryApp.",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    image: data.image || null, // Menampilkan gambar jika ada
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Event Click pada Notifikasi
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Membuka aplikasi saat notifikasi diklik
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow("/");
    })
  );
});

// --- Background Sync Logic ---
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-new-stories") {
    console.log("Service Worker: Syncing new stories...");
    event.waitUntil(syncNewStories());
  }
});

const syncNewStories = async () => {
  try {
    const stories = await StoryIdb.getAllOfflineStories();
    for (const story of stories) {
      // Pastikan token tersedia (jika disimpan di object store offline)
      // atau logika pengambilan token disesuaikan
      if (!story.token && !localStorage.getItem("token")) continue;

      const userToken = story.token || localStorage.getItem("token");

      const formData = new FormData();
      formData.append("photo", story.photo);
      formData.append("description", story.description);
      if (story.lat) formData.append("lat", story.lat);
      if (story.lon) formData.append("lon", story.lon);

      const response = await fetch(
        "https://story-api.dicoding.dev/v1/stories",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${userToken}` },
          body: formData,
        }
      );

      if (response.ok) {
        await StoryIdb.deleteOfflineStory(story.id);
        console.log(`Background Sync: Story ${story.id} uploaded.`);

        self.registration.showNotification("Story Terkirim (Background Sync)", {
          body: "Koneksi kembali! Ceritamu yang tertunda sudah dikirim.",
          icon: "./icons/icon-192.png",
          vibrate: [100, 50, 100],
        });
      }
    }
  } catch (error) {
    console.error("Background Sync failed:", error);
  }
};
