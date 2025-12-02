import Api from "../data/api.js";
import { createStoryCard } from "../utils/index.js";
import StoryIdb from "../data/story-db.js";
import NotificationHelper from "../utils/notification.js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const Home = {
  async render() {
    const name = localStorage.getItem("name") || "User";

    return `
      <section class="home-page">
        <div class="home-header">
          <div>
            <h1 style="margin:0; font-size:1.8rem; color:var(--primary-dark);">Halo, ${name} 👋</h1>
            <p style="color:var(--muted); margin-top:4px;">Selamat datang kembali!</p>
          </div>
          
          <div class="search-wrapper">
            <span class="search-icon"><i data-feather="search"></i></span>
            <input type="text" id="searchStory" placeholder="Cari cerita atau nama teman..." autocomplete="off">
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; margin-bottom:20px;">
          <button id="notifBtn" class="btn-pill" style="min-width:180px; padding:10px 20px; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:8px;">
            <i data-feather="loader" class="spin"></i> <span>Memuat Status...</span>
          </button>
        </div>

        <div class="map-section">
          <h3 style="margin-bottom:12px;">📍 Peta Sebaran Cerita</h3>
          <div id="map" class="map-container"></div>
        </div>

        <h3 style="margin-bottom:16px; border-left: 4px solid var(--primary); padding-left:12px;">Daftar Cerita Terbaru</h3>
        <div id="loadingMsg" style="text-align:center; padding:20px;"></div>
        <div id="storyGrid" class="story-grid"></div>

        <div class="add-story-wrap">
          <button id="gotoAdd" class="btn-pill" style="border-radius:50px; padding:16px 24px; box-shadow: 0 10px 25px rgba(77, 166, 255, 0.5);">
            <i data-feather="plus" style="margin-right:4px;"></i> Buat Cerita
          </button>
        </div>
      </section>
    `;
  },

  async afterRender() {
    if (window.feather) window.feather.replace();

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.hash = "#/login";
      return;
    }

    const btnAdd = document.getElementById("gotoAdd");
    if (btnAdd) btnAdd.onclick = () => (window.location.hash = "#/add");

    // Load Data
    this._loadDashboardData(token);

    // Init Notifikasi Center
    this._initNotificationLogic();
  },

  async _loadDashboardData(token) {
    const grid = document.getElementById("storyGrid");
    const loadingMsg = document.getElementById("loadingMsg");
    const searchInput = document.getElementById("searchStory");

    loadingMsg.innerHTML = "Sedang memuat data...";

    // Init Map (dengan error handling)
    let map = null;
    const mapContainer = document.getElementById("map");
    if (mapContainer) {
      try {
        map = L.map("map").setView([-2.5489, 118.0149], 5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
        }).addTo(map);
        setTimeout(() => map.invalidateSize(), 500);
      } catch (e) {
        console.error("Map init error:", e);
        mapContainer.innerHTML = "Gagal memuat peta.";
      }
    }

    try {
      const stories = await Api.getStories(token, { location: 1 });
      loadingMsg.innerHTML = "";
      this._allStories = stories;

      if (stories.length === 0) {
        grid.innerHTML = "<p class='text-center'>Belum ada cerita.</p>";
      } else {
        await this._renderStories(stories, grid);
        this._populateMap(stories, map);
      }

      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        if (!this._allStories) return;

        const filtered = this._allStories.filter((story) => {
          const nameMatch = (story.name || "").toLowerCase().includes(query);
          const descMatch = (story.description || "")
            .toLowerCase()
            .includes(query);
          return nameMatch || descMatch;
        });
        this._renderStories(filtered, grid);
      });

      await StoryIdb.clearStories();
      stories.forEach((s) => StoryIdb.putStory(s));
    } catch (err) {
      console.error(err);
      loadingMsg.innerHTML = "⚠️ Mode Offline";
      const cached = await StoryIdb.getAllStories();
      this._allStories = cached;

      if (cached.length > 0) {
        await this._renderStories(cached, grid);
      } else {
        grid.innerHTML = `<p style="text-align:center;">Gagal memuat data.</p>`;
      }
    }
  },

  _populateMap(stories, map) {
    if (!map) return;
    stories.forEach((s) => {
      if (s.lat && s.lon) {
        L.marker([s.lat, s.lon])
          .addTo(map)
          .bindPopup(
            `<b>${s.name}</b><br>${s.description.substring(0, 30)}...`
          );
      }
    });
  },

  async _renderStories(stories, container) {
    if (!stories || stories.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:#666; margin-top:20px;">Tidak ditemukan cerita yang cocok.</div>`;
      return;
    }

    let favIds = new Set();
    try {
      const favs = await StoryIdb.getAllFavorites();
      favIds = new Set(favs.map((f) => f.id));
    } catch (e) {}

    container.innerHTML = stories.map(createStoryCard).join("");
    if (window.feather) window.feather.replace();

    container.querySelectorAll(".story-card").forEach((card) => {
      const id = card.dataset.id;
      const favBtn = card.querySelector(".btn-fav");

      if (favBtn) {
        favBtn.textContent = favIds.has(id) ? "❤️" : "🤍";
        favBtn.onclick = async (e) => {
          e.stopPropagation();
          const story = this._allStories.find((s) => s.id === id);
          if (favBtn.textContent === "🤍") {
            await StoryIdb.putFavorite(story);
            favBtn.textContent = "❤️";
          } else {
            await StoryIdb.deleteFavorite(id);
            favBtn.textContent = "🤍";
          }
        };
      }

      card.onclick = (e) => {
        if (!e.target.closest(".btn-fav")) {
          window.location.hash = `#/detail/${id}`;
        }
      };
    });
  },

  // === TAMPILAN NOTIFIKASI CENTER (CUSTOM) ===
  async _initNotificationLogic() {
    const btn = document.getElementById("notifBtn");
    if (!btn) return;

    if (!("Notification" in window)) {
      btn.style.display = "none";
      return;
    }

    // 1. Definisikan Gaya Modal Kustom
    const showCustomModal = (type) => {
      let titleText, bodyText, iconType;

      if (type === "subscribed") {
        titleText = "Notifikasi Aktif!";
        bodyText =
          "Asik! Kamu bakal dapet update cerita terbaru langsung di layar kamu.";
        iconType = "success";
      } else {
        titleText = "Notifikasi Nonaktif";
        bodyText = "Yah... Kamu nggak bakal dapet update terbaru lagi deh.";
        iconType = "info"; // atau warning
      }

      Swal.fire({
        title: titleText,
        text: bodyText,
        icon: iconType,
        position: "center", // Posisi Tengah
        showConfirmButton: true, // Munculkan tombol
        confirmButtonText: "Siap, Mengerti!",

        // CLASS CSS KITA DIPANGGIL DI SINI
        customClass: {
          popup: "custom-center-modal",
        },

        // Animasi Masuk/Keluar (Zoom)
        showClass: {
          popup: "animate__animated animate__zoomIn",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut",
        },

        backdrop: `rgba(0,0,0,0.4)`, // Gelapkan latar belakang
      });
    };

    // 2. Fungsi Update Tampilan Tombol
    const setButtonState = (state) => {
      if (state === "loading") {
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Memproses...`;
        btn.disabled = true;
        btn.style.background = "#ccc";
        btn.style.color = "#666";
      } else if (state === "subscribed") {
        btn.innerHTML = `<i data-feather="bell-off"></i> Matikan Notifikasi`;
        btn.disabled = false;
        btn.style.background = "#ffe3e3";
        btn.style.color = "#c92a2a";
        btn.style.border = "1px solid #ffa8a8";
        btn.dataset.status = "on";
      } else {
        btn.innerHTML = `<i data-feather="bell"></i> Aktifkan Notifikasi`;
        btn.disabled = false;
        btn.style.background = "#e7f5ff";
        btn.style.color = "#1971c2";
        btn.style.border = "1px solid #a5d8ff";
        btn.dataset.status = "off";
      }
      if (window.feather) window.feather.replace();
    };

    // 3. Event Listener Tombol
    btn.onclick = async () => {
      setButtonState("loading");

      try {
        if (btn.dataset.status === "on") {
          // PROSES UNSUBSCRIBE
          const sub = await NotificationHelper.checkSubscription();
          if (sub) {
            await Api.unsubscribeFromNotify(sub.endpoint);
            await NotificationHelper.unsubscribePushNotification();

            // Tampilkan Modal Custom
            showCustomModal("unsubscribed");
            setButtonState("unsubscribed");
          } else {
            setButtonState("unsubscribed");
          }
        } else {
          // PROSES SUBSCRIBE
          const sub = await NotificationHelper.subscribePushNotification();
          if (sub) {
            const p256dh = btoa(
              String.fromCharCode.apply(
                null,
                new Uint8Array(sub.getKey("p256dh"))
              )
            );
            const auth = btoa(
              String.fromCharCode.apply(
                null,
                new Uint8Array(sub.getKey("auth"))
              )
            );
            await Api.subscribeToNotify({
              endpoint: sub.endpoint,
              keys: { p256dh, auth },
            });

            // Tampilkan Modal Custom
            showCustomModal("subscribed");
            setButtonState("subscribed");
          } else {
            setButtonState("unsubscribed");
          }
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Gagal terhubung. Coba periksa koneksi internetmu.",
          customClass: { popup: "custom-center-modal" },
        });
        const sub = await NotificationHelper.checkSubscription();
        setButtonState(sub ? "subscribed" : "unsubscribed");
      }
    };

    // 4. Cek Status Awal (Timeout 2 Detik agar tidak loading terus)
    try {
      const checkPromise = NotificationHelper.checkSubscription();
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve("timeout"), 2000)
      );

      const result = await Promise.race([checkPromise, timeoutPromise]);

      if (result === "timeout") {
        console.warn("Timeout cek status notifikasi.");
        setButtonState("unsubscribed");
      } else {
        setButtonState(result ? "subscribed" : "unsubscribed");
      }
    } catch (e) {
      console.error("Error cek status:", e);
      setButtonState("unsubscribed");
    }
  },
};

export default Home;
