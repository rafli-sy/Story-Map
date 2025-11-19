import App from "./app";
import "../styles/styles.css";
import swRegister from "./utils/sw-register";
import StoryIdb from "./data/story-db";
import Api from "./data/api";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Init App (Logic Navbar & Routing)
  // Kita simpan di variabel agar bisa dipanggil ulang nanti
  await App();

  // 2. Skip Link Logic
  const skipLink = document.querySelector(".skip-link");
  const mainContent = document.querySelector("#main");

  if (skipLink && mainContent) {
    skipLink.addEventListener("click", (event) => {
      event.preventDefault();
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: "smooth" });
    });
  }

  // 3. Panggil Register Service Worker
  await swRegister();

  // 4. Monitor Status Online/Offline
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;

    if (isOnline) {
      document.body.style.filter = "none";
      // Trigger sync saat kembali online
      syncOfflineStories();
    } else {
      document.body.style.filter = "grayscale(100%)";
      // Opsional: Beri tahu user
      console.log("Anda sedang offline.");
    }
  };

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
});

// === FITUR BACKGROUND SYNC (Kriteria 4 Advanced) ===
async function syncOfflineStories() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Ambil data antrean dari IDB
    const offlineStories = await StoryIdb.getAllOfflineStories();
    if (offlineStories.length === 0) return;

    console.log(`Mengirim ${offlineStories.length} story offline...`);

    // Buat indikator loading sederhana (Toast)
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; 
      background: #333; color: #fff; padding: 12px 24px; 
      border-radius: 8px; z-index: 9999;
    `;
    toast.innerText = "Sedang mengunggah data offline...";
    document.body.appendChild(toast);

    // Loop dan kirim satu per satu
    for (const story of offlineStories) {
      try {
        const formData = new FormData();
        formData.append("description", story.description);
        formData.append("photo", story.photo);

        if (story.lat) formData.append("lat", story.lat);
        if (story.lon) formData.append("lon", story.lon);

        // Kirim ke API
        await Api.addStory(formData, token);

        // Hapus dari IDB jika sukses
        await StoryIdb.deleteOfflineStory(story.id);
        console.log(`Story ID ${story.id} berhasil disinkronisasi.`);
      } catch (error) {
        console.error(`Gagal menyinkronkan story ID ${story.id}:`, error);
      }
    }

    // Cek ulang apakah sudah bersih
    const remaining = await StoryIdb.getAllOfflineStories();
    if (remaining.length === 0) {
      toast.remove();
      alert("Semua story offline berhasil diunggah!");

      // PERBAIKAN UTAMA: Panggil App() lagi untuk refresh tampilan TANPA reload halaman
      await App();
    } else {
      toast.innerText = "Beberapa story gagal dikirim.";
      setTimeout(() => toast.remove(), 3000);
    }
  } catch (err) {
    console.error("Terjadi kesalahan saat sinkronisasi:", err);
  }
}
