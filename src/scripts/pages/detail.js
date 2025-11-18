import Api from "../data/api.js";
import UrlParser from "../utils/url-parser.js";

const DetailPage = {
  render: async () => `
    <section aria-labelledby="detail-title">
      <h2 id="detail-title" class="section-title">Detail Story</h2>
      <div id="detailContainer" class="form-wrapper">Loading...</div>
    </section>
  `,

  afterRender: async () => {
    const token = localStorage.getItem("token");
    const id = UrlParser.getResourceId();
    const container = document.getElementById("detailContainer");

    // Validasi ID wajib ada
    if (!id) {
      container.innerHTML = `
        <p style="color:#b00">ID story tidak ditemukan.</p>
        <button class="btn-pill" id="backBtn">Kembali</button>
      `;
      document.getElementById("backBtn").addEventListener("click", () => {
        window.location.hash = "#/home";
      });
      return;
    }

    try {
      const res = await Api.getDetail(id, token);

      // struktur API: { story: {...} }
      const s = res.story;

      container.innerHTML = `
        <article class="story-card" style="flex-direction:column">
          <img src="${s.photoUrl}" alt="${s.name}"
            style="width:100%;height:360px;object-fit:cover;border-radius:12px" />

          <div style="padding:12px">
            <h3>${s.name}</h3>
            <p>${s.description}</p>
            <p class="muted">Created at: ${new Date(
              s.createdAt
            ).toLocaleString()}</p>
            <p class="muted">Lat: ${s.lat ?? "-"} Lon: ${s.lon ?? "-"}</p>
            <button class="btn-pill" id="backBtn">Kembali</button>
          </div>
        </article>
      `;

      document.getElementById("backBtn").addEventListener("click", () => {
        window.location.hash = "#/home";
      });
    } catch (err) {
      container.innerHTML = `
        <p style="color:#b00">Error mengambil detail: ${err.message}</p>
        <button class="btn-pill" id="backBtn">Kembali</button>
      `;
      document.getElementById("backBtn").addEventListener("click", () => {
        window.location.hash = "#/home";
      });
    }
  },
};

export default DetailPage;
