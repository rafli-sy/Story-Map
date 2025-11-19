import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  StaleWhileRevalidate,
  CacheFirst,
  NetworkFirst,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { skipWaiting, clientsClaim } from "workbox-core";
import StoryIdb from "./data/story-db"; 
import CONFIG from "./config"; 

skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

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

// --- Push Notification ---
self.addEventListener("push", (event) => {
  let body;
  if (event.data) {
    body = event.data.text();
  } else {
    body = "Push message no payload";
  }
  const options = {
    body: body,
    icon: "./icons/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };
  event.waitUntil(self.registration.showNotification("Story App", options));
});

// ============================================
// FITUR TAMBAHAN: BACKGROUND SYNC (Agar sama dengan temanmu)
// ============================================

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
      if (!story.token) continue;
      const formData = new FormData();
      formData.append("photo", story.photo);
      formData.append("description", story.description);
      if (story.lat) formData.append("lat", story.lat);
      if (story.lon) formData.append("lon", story.lon);

      const response = await fetch(
        "https://story-api.dicoding.dev/v1/stories",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${story.token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        await StoryIdb.deleteOfflineStory(story.id);
        console.log(`Background Sync: Story ${story.id} uploaded.`);
      }
    }
  } catch (error) {
    console.error("Background Sync failed:", error);
  }
};
