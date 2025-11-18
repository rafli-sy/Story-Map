// src/scripts/pages/home.js
import Api from "../data/api.js";
import { createStoryCard, showLoading } from "../utils/index.js";

// IMPORT LEAFLET
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const Home = {
  render: async () => {
    const name = localStorage.getItem("name") || "User";

    return `
      <section class="home" aria-labelledby="home-title">
        <div class="greeting">
          <h1 id="home-title">Hello, ${name} 👋</h1>
          <p class="muted">Welcome back!</p>
        </div>

        <div class="map-section" aria-label="Peta cerita">
          <div class="map-title">Peta</div>

          <div id="map" class="map-container" style="height:350px; border-radius:12px; overflow:hidden;">
            <div id="map-placeholder" class="center">Memuat peta...</div>
          </div>
        </div>

        <section aria-labelledby="stories-title">
          <h2 id="stories-title" class="section-title">Story</h2>

          <div id="storyGrid" class="story-grid" role="list" aria-live="polite"></div>

          <div class="add-story-wrap">
            <button id="gotoAdd" class="btn-pill" aria-label="Add new story">
              + Add Story
            </button>
          </div>
        </section>
      </section>
    `;
  },

  afterRender: async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.hash = "#/";
      return;
    }

    /** ------------------------------------
     * 1. INIT MAP
     ------------------------------------*/
    const mapContainer = document.getElementById("map");
    if (!mapContainer) {
      console.warn("Map container tidak ditemukan.");
      return;
    }

    // Hapus placeholder tanpa menghancurkan container map
    const placeholder = document.getElementById("map-placeholder");
    if (placeholder) placeholder.remove();

    // Init Leaflet map
    const map = L.map("map", {
      zoomControl: true,
      attributionControl: true,
    }).setView([-2.5, 118], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    /** ------------------------------------
     * 2. LOAD STORIES + RENDER GRID
     ------------------------------------*/
    const grid = document.getElementById("storyGrid");
    if (!grid) return;

    showLoading(grid);

    try {
      const stories = await Api.getStories(token, { location: 1 });

      // Render cards
      grid.innerHTML = stories.map((s) => createStoryCard(s)).join("");

      // Add markers to map
      stories.forEach((s) => {
        if (s.lat && s.lon) {
          L.marker([s.lat, s.lon])
            .addTo(map)
            .bindPopup(`<strong>${s.name}</strong><br>${s.description}`);
        }
      });

      map.invalidateSize();

      // Attach click events to story cards
      const cards = grid.querySelectorAll(".story-card");
      cards.forEach((card) => {
        card.addEventListener("click", (e) => {
          const id =
            card.dataset.id ||
            e.target.closest(".story-card")?.dataset.id ||
            e.target.dataset.id;

          if (!id) return console.warn("ID card tidak ditemukan");

          window.location.hash = `#/detail/${id}`;
        });
      });
    } catch (err) {
      grid.innerHTML = `<p style="color:#b00;">Error memuat stories: ${err.message}</p>`;
    }

    /** ------------------------------------
     * 3. GOTO ADD STORY
     ------------------------------------*/
    const btnAdd = document.getElementById("gotoAdd");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => {
        window.location.hash = "#/add";
      });
    } else {
      console.warn("Button #gotoAdd tidak ditemukan.");
    }
  },
};

export default Home;
