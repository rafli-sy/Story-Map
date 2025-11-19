import CONFIG from "../config";

const NotificationHelper = {
  async subscribePushNotification() {
    if (!("serviceWorker" in navigator)) {
      console.log("Service Worker not supported in the browser");
      return null;
    }

    if (!("PushManager" in window)) {
      console.log("Push Manager not supported in the browser");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Cek apakah user sudah subscribe sebelumnya
      let subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        console.log("User is already subscribed.");
        return subscription;
      }

      // Jika belum, minta izin notifikasi
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Notification permission denied");
        return null;
      }

      // Lakukan subscription ke Push Manager
      const applicationServerKey = this._urlBase64ToUint8Array(
        CONFIG.PUSH_MSG_VAPID_PUBLIC_KEY
      );
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      console.log("User subscribed successfully.");
      return subscription;
    } catch (error) {
      console.error("Failed to subscribe to push notification", error);
      return null;
    }
  },

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
};

export default NotificationHelper;
