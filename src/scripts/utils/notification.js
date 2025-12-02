import CONFIG from "../config";

const NotificationHelper = {
  // Cek apakah fitur notifikasi didukung browser
  _checkAvailability() {
    return "Notification" in window;
  },

  // Cek apakah izin sudah diberikan
  _checkPermission() {
    return Notification.permission === "granted";
  },

  // Fungsi helper konversi VAPID key
  _urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  // === 1. CEK STATUS SUBSCRIPTION ===
  async checkSubscription() {
    if (!this._checkAvailability()) return null;

    // Pastikan service worker ready sebelum akses pushManager
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  },

  // === 2. MELAKUKAN SUBSCRIBE ===
  async subscribePushNotification() {
    if (!this._checkAvailability()) {
      alert("Browser ini tidak mendukung notifikasi.");
      return null;
    }

    // Minta izin jika belum
    if (!this._checkPermission()) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Izin notifikasi ditolak.");
        return null;
      }
    }

    try {
      const applicationServerKey = this._urlBase64ToUint8Array(
        CONFIG.PUSH_MSG_VAPID_PUBLIC_KEY
      );

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      console.log("Berhasil subscribe lokal:", subscription);
      return subscription;
    } catch (error) {
      console.error("Gagal subscribe:", error);
      alert("Gagal melakukan subscribe: " + error.message);
      return null;
    }
  },

  // === 3. MELAKUKAN UNSUBSCRIBE ===
  async unsubscribePushNotification() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) return true; // Sudah tidak ada subscription

      const result = await subscription.unsubscribe();
      console.log("Berhasil unsubscribe lokal:", result);
      return result;
    } catch (error) {
      console.error("Gagal unsubscribe:", error);
      return false;
    }
  },
};

export default NotificationHelper;
