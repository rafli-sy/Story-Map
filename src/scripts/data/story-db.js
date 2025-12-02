import { openDB } from "idb";
import CONFIG from "../config";

const { DATABASE_NAME, DATABASE_VERSION, OBJECT_STORE_NAME } = CONFIG;

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database) {
    // Store cache (sudah ada)
    if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      database.createObjectStore(OBJECT_STORE_NAME, { keyPath: "id" });
    }
    // Store offline sync (sudah ada)
    if (!database.objectStoreNames.contains("offline-stories")) {
      database.createObjectStore("offline-stories", {
        keyPath: "id",
        autoIncrement: true,
      });
    }
    // === TAMBAHAN: Store Favorites (Fitur Simpan/Hapus) ===
    if (!database.objectStoreNames.contains("favorites")) {
      database.createObjectStore("favorites", { keyPath: "id" });
    }
  },
});

const StoryIdb = {
  async getStory(id) {
    return (await dbPromise).get(OBJECT_STORE_NAME, id);
  },
  async getAllStories() {
    return (await dbPromise).getAll(OBJECT_STORE_NAME);
  },
  async putStory(story) {
    return (await dbPromise).put(OBJECT_STORE_NAME, story);
  },
  async deleteStory(id) {
    return (await dbPromise).delete(OBJECT_STORE_NAME, id);
  },
  async clearStories() {
    return (await dbPromise).clear(OBJECT_STORE_NAME);
  },
  async saveOfflineStory(data) {
    return (await dbPromise).add("offline-stories", data);
  },
  async getAllOfflineStories() {
    return (await dbPromise).getAll("offline-stories");
  },
  async deleteOfflineStory(id) {
    return (await dbPromise).delete("offline-stories", id);
  },

  // === METODE BARU UNTUK FAVORITE (CRUD) ===
  async getFavorite(id) {
    if (!id) return;
    return (await dbPromise).get("favorites", id);
  },
  async getAllFavorites() {
    return (await dbPromise).getAll("favorites");
  },
  async putFavorite(story) {
    // eslint-disable-next-line no-prototype-builtins
    if (!story.hasOwnProperty("id")) return;
    return (await dbPromise).put("favorites", story);
  },
  async deleteFavorite(id) {
    return (await dbPromise).delete("favorites", id);
  },
};

export default StoryIdb;
