import Api from "../data/api.js";
import { createStoryCard, showLoading } from "../utils/index.js";
import StoryIdb from "../data/story-db.js";
import NotificationHelper from "../utils/notification.js"; // Pastikan nama file sesuai
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const Home = {
  render: async () => {
    const name = localStorage.getItem("name") || "User";

    return `
      <main role="main" id="main-content">
        <section class="home" aria-labelledby="home-title">
          <div class="greeting" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h1 id="home-title">Hello, ${name} 👋</h1>
              <p class="muted">Welcome back!</p>
            </div>
            
            <button id="notifBtn" class="btn-pill" style="font-size:0.85rem; padding:8px 16px; display:flex; align-items:center; gap:6px;">
              🔔 Notifikasi
            </button>
          </div>

          <div class="map-section" aria-label="Peta cerita">
            <div class="map-title">Peta</div>

            <div id="map" class="map-container" style="height:350px; border-radius:12px; overflow:hidden;">
              <div id="map-placeholder" class="center">Memuat peta...</div>
            </div>
          </div>

          <section aria-labelledby="stories-title">
            <h2 id="stories-title" class="section-title">Story</h2>

            <div id="offlineMessage"></div>

            <div id="storyGrid" class="story-grid" role="list" aria-live="polite"></div>

            <div class="add-story-wrap">
              <button id="gotoAdd" class="btn-pill" aria-label="Tambah story baru">
                + Add Story
              </button>
            </div>
          </section>
        </section>
      </main>
    `;
  },

  afterRender: async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.hash = "#/";
      return;
    }

    /** ------------------------------------
     * 0. LOGIKA NOTIFIKASI
     ------------------------------------*/
    const notifBtn = document.getElementById("notifBtn");

    // Cek apakah browser mendukung notifikasi
    if (!("Notification" in window)) {
      if (notifBtn) notifBtn.style.display = "none";
    } else {
      if (notifBtn) {
        notifBtn.addEventListener("click", async () => {
          try {
            // 1. Minta izin ke Browser via Helper
            const subscription =
              await NotificationHelper.subscribePushNotification();

            if (subscription) {
              // 2. Format data sesuai kebutuhan server Dicoding
              const subscriptionJson = subscription.toJSON();

              // 3. Kirim ke Server via API
              await Api.subscribeNotification(subscriptionJson); // Pastikan nama method di api.js sesuai (subscribeNotification atau subscribeToNotify)

              alert("Berhasil subscribe notifikasi!");
              console.log("Subscription sent to server:", subscriptionJson);
            } else {
              alert("Gagal subscribe atau izin ditolak.");
            }
          } catch (err) {
            console.error("Error subscription:", err);
            alert("Terjadi kesalahan saat subscribe notifikasi.");
          }
        });
      }
    }

    /** ------------------------------------
     * 1. INIT MAP
     ------------------------------------*/
    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    const placeholder = document.getElementById("map-placeholder");
    if (placeholder) placeholder.remove();

    const map = L.map("map", {
      zoomControl: true,
      attributionControl: true,
    }).setView([-2.5, 118], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    /** ------------------------------------
     * 2. LOAD STORIES (NETWORK FIRST + FAVORITE LOGIC)
     ------------------------------------*/
    const grid = document.getElementById("storyGrid");
    const offlineMsgContainer = document.getElementById("offlineMessage");

    if (!grid) return;

    showLoading(grid);

    try {
      // --- LANGKAH 1: Coba Ambil dari Network (API) ---
      const response = await Api.getStories(token, { location: 1 });
      const stories = response;

      // --- LANGKAH 2: Jika Sukses, Update IndexedDB (Caching Data Umum) ---
      await StoryIdb.clearStories();
      const savePromises = stories.map((story) => StoryIdb.putStory(story));
      await Promise.all(savePromises);

      // Render data dari Network dengan Logika Favorite
      await renderStoriesWithFavoriteLogic(stories, grid, map);
    } catch (err) {
      console.warn("Gagal mengambil data dari network, mencoba cache...", err);

      // --- LANGKAH 3: Jika Gagal (Offline), Ambil dari IndexedDB ---
      try {
        const cachedStories = await StoryIdb.getAllStories();

        if (cachedStories.length > 0) {
          offlineMsgContainer.innerHTML = `
            <div style="background-color: #fff3cd; color: #856404; padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #ffeeba;">
              <strong>Mode Offline:</strong> Anda sedang melihat data yang tersimpan di cache.
            </div>
          `;
          // Render data dari Cache dengan Logika Favorite
          await renderStoriesWithFavoriteLogic(cachedStories, grid, map);
        } else {
          grid.innerHTML = `<p style="color:#b00;">Gagal memuat stories. Periksa koneksi internet Anda.</p>`;
        }
      } catch (dbErr) {
        console.error("Gagal mengambil data dari IndexedDB", dbErr);
        grid.innerHTML = `<p style="color:#b00;">Terjadi kesalahan sistem.</p>`;
      }
    }

    /** ------------------------------------
     * 3. GOTO ADD STORY
     ------------------------------------*/
    const btnAdd = document.getElementById("gotoAdd");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => {
        window.location.hash = "#/add";
      });
    }
  },
};

/**
 * Helper function custom: Render list + Map + Logic Favorite (Love Button)
 */
async function renderStoriesWithFavoriteLogic(
  stories,
  gridContainer,
  mapInstance
) {
  // 1. Ambil daftar ID yang sudah di-favorite user dari IndexedDB Store 'favorites'
  // Pastikan kamu sudah menaikkan versi DB di config.js ke 2 agar store ini terbentuk!
  let favoriteIds = new Set();
  try {
    const favorites = await StoryIdb.getAllFavorites();
    favoriteIds = new Set(favorites.map((f) => f.id));
  } catch (e) {
    console.warn(
      "Gagal mengambil data favorite (mungkin DB belum update version)",
      e
    );
  }

  // 2. Render Cards ke Grid
  // Pastikan createStoryCard di utils/index.js sudah memiliki elemen <button class="btn-fav">
  gridContainer.innerHTML = stories.map((s) => createStoryCard(s)).join("");

  // 3. Tambahkan Markers ke Peta
  stories.forEach((s) => {
    if (s.lat && s.lon) {
      L.marker([s.lat, s.lon])
        .addTo(mapInstance)
        .bindPopup(`<strong>${s.name}</strong><br>${s.description || ""}`);
    }
  });

  // Sesuaikan ukuran map
  setTimeout(() => {
    mapInstance.invalidateSize();
  }, 400);

  // 4. Pasang Event Listener (Klik Card & Klik Favorite)
  const cards = gridContainer.querySelectorAll(".story-card");
  cards.forEach((card) => {
    const id = card.dataset.id;
    const favBtn = card.querySelector(".btn-fav");

    // Cek apakah elemen tombol fav ada (penting jika utils/index.js belum diupdate)
    if (favBtn) {
      // Set status awal icon
      if (favoriteIds.has(id)) {
        favBtn.textContent = "❤️";
      } else {
        favBtn.textContent = "🤍";
      }

      // Klik Tombol Favorite
      favBtn.addEventListener("click", async (e) => {
        e.stopPropagation(); // Jangan trigger pindah halaman

        const storyData = stories.find((s) => s.id === id);

        if (favBtn.textContent === "🤍") {
          // Simpan ke Favorite
          await StoryIdb.putFavorite(storyData);
          favBtn.textContent = "❤️";
        } else {
          // Hapus dari Favorite
          await StoryIdb.deleteFavorite(id);
          favBtn.textContent = "🤍";
        }
      });
    }

    // Klik Card (Pindah ke Detail)
    card.addEventListener("click", (e) => {
      // Jika yang diklik adalah tombol fav, jangan pindah (sudah dihandle stopPropagation, tapi double check)
      if (e.target.classList.contains("btn-fav")) return;

      if (!id) return;
      window.location.hash = `#/detail/${id}`;
    });
  });
}

export default Home;
