import Api from "../data/api.js";
// Hapus atau jangan gunakan UrlParser untuk ID agar tidak terkena .toLowerCase()
// import UrlParser from "../utils/url-parser.js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// =========================================
// FIX: Ikon Marker Leaflet untuk Webpack
// =========================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const DetailPage = {
  render: async () => `
    <section aria-labelledby="detail-title">
      <h2 id="detail-title" class="section-title">Detail Story</h2>
      <div id="detailContainer" class="form-wrapper">Loading...</div>
    </section>
  `,

  afterRender: async () => {
    const token = localStorage.getItem("token");
    const container = document.getElementById("detailContainer");

    const url = window.location.hash.slice(1); // ambil string setelah tanda #
    const parts = url.split("/");
    // asumsi format url: /detail/:id
    const id = parts[2];

    // Validasi ID
    if (!id) {
      container.innerHTML = `
        <p style="color:#b00">ID story tidak ditemukan di URL.</p>
        <button class="btn-pill" id="backBtn">Kembali</button>
      `;
      document.getElementById("backBtn").addEventListener("click", () => {
        window.location.hash = "#/home";
      });
      return;
    }

    try {
      const res = await Api.getDetail(id, token);
      const s = res.story;

      // Render HTML Detail + Container Peta
      container.innerHTML = `
        <article class="story-card" style="flex-direction:column; cursor:default;">
          <img src="${s.photoUrl}" alt="${s.name}"
            style="width:100%;height:360px;object-fit:cover;border-radius:12px 12px 0 0;" />

          <div style="padding:20px;">
            <h3 style="margin-top:0; font-size:1.5rem;">${s.name}</h3>
            <p style="white-space: pre-wrap;">${s.description}</p>
            
            <div style="margin: 16px 0; font-size: 0.9rem; color: var(--muted);">
              <p>📅 ${new Date(s.createdAt).toLocaleString()}</p>
              <p>📍 Lat: ${s.lat ?? "-"} | Lon: ${s.lon ?? "-"}</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h4 style="margin-bottom:8px">Lokasi Story</h4>
              <div id="storyMap" style="height: 300px; width: 100%; border-radius: 12px; z-index: 1;"></div>
            </div>

            <button class="btn-pill" id="backBtn">Kembali ke Home</button>
          </div>
        </article>
      `;

      // Event Listener Tombol Kembali
      document.getElementById("backBtn").addEventListener("click", () => {
        window.location.hash = "#/home";
      });

      // -----------------------------------------------------------
      // FIX 2: Tampilkan Peta Sesuai Lokasi (Leaflet)
      // -----------------------------------------------------------
      if (s.lat !== undefined && s.lon !== undefined) {
        const map = L.map("storyMap").setView([s.lat, s.lon], 15);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://openstreetmap.org">OSM</a>',
        }).addTo(map);

        L.marker([s.lat, s.lon])
          .addTo(map)
          .bindPopup(`<strong>${s.name}</strong><br>Lokasi kejadian`)
          .openPopup();
      } else {
        // Jika tidak ada koordinat
        document.getElementById("storyMap").innerHTML = `
          <div style="height:100%; display:flex; align-items:center; justify-content:center; background:#f0f0f0; border-radius:12px; color:#666;">
            Lokasi tidak tersedia untuk story ini.
          </div>
        `;
      }
    } catch (err) {
      container.innerHTML = `
        <div style="color:#b00; padding:10px; text-align:center;">
          <h3>Gagal Memuat Story</h3>
          <p>${err.message}</p>
          <p style="font-size:0.8em; color:#666;">ID Requested: ${id}</p>
        </div>
        <button class="btn-pill" id="backBtn">Kembali</button>
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
