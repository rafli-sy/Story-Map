// src/scripts/pages/detail.js
import Api from "../data/api.js";
import { escapeHtml } from "../utils/index.js";
import UrlParser from "../utils/url-parser.js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// =========================================
// FIX: Ikon Marker Leaflet untuk bundler
// =========================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const DetailPage = {
  render: async () => `
    <main role="main" id="main-content">
      <section aria-labelledby="detail-title">
        <h1 id="detail-title" class="section-title">Detail Story</h1>
        <div id="detailContainer" class="form-wrapper" aria-live="polite">Loading...</div>
      </section>
    </main>
  `,

  afterRender: async () => {
    // Fokus ke main agar screen reader langsung diarahakan
    const mainEl = document.getElementById("main-content");
    if (mainEl && !mainEl.hasAttribute("tabindex"))
      mainEl.setAttribute("tabindex", "-1");
    if (mainEl) mainEl.focus();

    const token = localStorage.getItem("token");
    const container = document.getElementById("detailContainer");

    const url = window.location.hash.slice(1); // ambil string setelah tanda #
    const parts = url.split("/");
    // asumsi format url: /detail/:id
    const id = parts[2];

    // Validasi ID
    if (!id) {
      container.innerHTML = `
        <div role="status" style="color:#b00; padding:12px;">
          <h2 style="margin:0 0 8px 0">ID story tidak ditemukan</h2>
          <p>Pastikan URL berformat <code>#/detail/:id</code></p>
          <div style="margin-top:12px">
            <button class="btn-pill" id="backBtn" aria-label="Kembali ke beranda">Kembali</button>
          </div>
        </div>
      `;
      document.getElementById("backBtn").addEventListener("click", () => {
        window.location.hash = "#/home";
      });
      return;
    }

    try {
      const res = await Api.getDetail(id, token);
      const s = res.story || {};

      const photoUrl = s.photoUrl
        ? escapeHtml(s.photoUrl)
        : "https://via.placeholder.com/1200x720?text=No+Image";

      const hasPhoto = Boolean(s.photoUrl);
      const altText = hasPhoto
        ? escapeHtml(s.description || "Foto story")
        : "Tidak ada foto tersedia";

      const createdAtString = s.createdAt
        ? new Date(s.createdAt).toLocaleString()
        : "-";

      // Render HTML Detail + Container Peta
      container.innerHTML = `
        <article class="story-card detail-card" style="flex-direction:column; cursor:default;">
          <img 
            src="${photoUrl}" 
            alt="${altText}"
            style="width:100%;height:360px;object-fit:cover;border-radius:12px 12px 0 0;"
            loading="lazy"
          />

          <div style="padding:20px;">
            <h2 style="margin:0 0 8px 0; font-size:1.5rem;">${escapeHtml(
              s.name || "Tanpa Judul"
            )}</h2>

            <p style="white-space: pre-wrap; margin:8px 0 12px 0;">${escapeHtml(
              s.description || "Tidak ada deskripsi."
            )}</p>
            
            <div style="margin: 16px 0; font-size: 0.95rem; color: var(--muted);">
              <p style="margin:4px 0">📅 ${escapeHtml(createdAtString)}</p>
              <p style="margin:4px 0">📍 Lat: ${s.lat ?? "-"} | Lon: ${
        s.lon ?? "-"
      }</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="margin:0 0 8px 0">Lokasi Story</h3>
              <div id="storyMap" role="region" aria-label="Peta lokasi story" style="height: 300px; width: 100%; border-radius: 12px; z-index: 1;"></div>
            </div>

            <div style="display:flex;gap:8px;align-items:center">
              <button class="btn-pill" id="backBtn" aria-label="Kembali ke halaman utama">Kembali ke Home</button>
              <div id="detailMessage" aria-live="polite" style="margin-left:12px;color:var(--muted)"></div>
            </div>
          </div>
        </article>
      `;

      // Event Listener Tombol Kembali
      document.getElementById("backBtn").addEventListener("click", () => {
        window.location.hash = "#/home";
      });

      // -----------------------------------------------------------
      // Tampilkan Peta Sesuai Lokasi (Leaflet) atau pesan jika tidak ada
      // -----------------------------------------------------------
      const mapEl = document.getElementById("storyMap");

      if (
        s.lat !== undefined &&
        s.lon !== undefined &&
        s.lat !== null &&
        s.lon !== null
      ) {
        try {
          const map = L.map("storyMap").setView(
            [Number(s.lat), Number(s.lon)],
            15
          );

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
          }).addTo(map);

          L.marker([Number(s.lat), Number(s.lon)])
            .addTo(map)
            .bindPopup(
              `<strong>${escapeHtml(
                s.name || "Lokasi"
              )}</strong><br>${escapeHtml(s.description || "")}`
            )
            .openPopup();

          // Pastikan ukuran tile benar ketika container muncul
          setTimeout(() => {
            try {
              map.invalidateSize();
            } catch (e) {
              /* ignore */
            }
          }, 200);
        } catch (mapErr) {
          // Jika ada error peta, tampilkan fallback
          mapEl.innerHTML = `
            <div style="height:100%; display:flex; align-items:center; justify-content:center; background:#f0f0f0; border-radius:12px; color:#666;">
              Gagal memuat peta untuk lokasi ini.
            </div>
          `;
          console.error("Error initing map:", mapErr);
        }
      } else {
        // Jika tidak ada koordinat
        mapEl.innerHTML = `
          <div style="height:100%; display:flex; align-items:center; justify-content:center; background:#f0f0f0; border-radius:12px; color:#666;">
            Lokasi tidak tersedia untuk story ini.
          </div>
        `;
        mapEl.setAttribute("aria-hidden", "true");
      }
    } catch (err) {
      // Tampilkan pesan error yang aksesibel
      container.innerHTML = `
        <div role="alert" style="color:#b00; padding:10px; text-align:center;">
          <h2 style="margin:0 0 8px 0">Gagal Memuat Story</h2>
          <p style="margin:0 0 8px 0">${escapeHtml(
            err.message || "Terjadi kesalahan."
          )}</p>
          <p style="font-size:0.8em; color:#666; margin:0 0 12px 0;">ID Requested: ${escapeHtml(
            id
          )}</p>
          <button class="btn-pill" id="backBtn">Kembali</button>
        </div>
      `;
      const btn = document.getElementById("backBtn");
      if (btn) {
        btn.addEventListener("click", () => {
          window.location.hash = "#/home";
        });
      }
    }
  },
};

export default DetailPage;
