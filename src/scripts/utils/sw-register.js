import { Workbox } from "workbox-window";
import CONFIG from "../config";
import Api from "../data/api";

const swRegister = async () => {
  if (!("serviceWorker" in navigator)) {
    console.log("Service Worker not supported in the browser");
    return;
  }

  const wb = new Workbox("./sw.bundle.js");

  try {
    const registration = await wb.register(); // Simpan registration
    console.log("Service worker registered");

    await requestNotificationPermission();
    await subscribePushManager(wb);

    // --- TAMBAHAN: REGISTER BACKGROUND SYNC ---
    // Kita panggil fungsi register sync di sini jika didukung
    if ("SyncManager" in window) {
      // Biasanya trigger sync dilakukan saat user klik tombol submit (di add-story.js)
      // Tapi kita bisa pastikan registernya siap.
    }
  } catch (error) {
    console.log("Failed to register service worker", error);
  }
};

// ... (Fungsi notifikasi biarkan sama) ...

// === TAMBAHAN FUNCTION UNTUK DIPANGGIL DI PAGE ADD STORY ===
export const registerBackgroundSync = async () => {
  if (!("SyncManager" in window)) {
    console.log("Background Sync not supported");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register("sync-new-stories");
    console.log("Background sync registered");
  } catch (error) {
    console.error("Failed to register background sync", error);
  }
};

export default swRegister;
