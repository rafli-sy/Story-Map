// src/scripts/pages/favorite.js
import StoryIdb from "../data/story-db.js";
import { createStoryCard } from "../utils/index.js";

const Favorite = {
  async render() {
    return `
      <main role="main" id="main-content">
        <section class="container" style="margin-top: 32px;">
          <h1 class="section-title">Favorite Stories 💖</h1>
          <p class="muted">Cerita yang Anda simpan akan muncul di sini secara offline.</p>
          
          <div id="favGrid" class="story-grid"></div>
          <div id="emptyMsg" class="center muted" style="display:none; margin-top:40px;">
            Belum ada cerita yang disukai.
          </div>
        </section>
      </main>
    `;
  },

  async afterRender() {
    const container = document.getElementById("favGrid");
    const emptyMsg = document.getElementById("emptyMsg");

    // 1. Ambil data dari IndexedDB
    const stories = await StoryIdb.getAllFavorites();

    if (stories.length === 0) {
      emptyMsg.style.display = "block";
      return;
    }

    // 2. Render Card
    container.innerHTML = stories.map(createStoryCard).join("");

    // 3. Logic Tombol Hapus/Unlike
    const cards = container.querySelectorAll(".story-card");

    // Ubah icon menjadi 'saved' (merah/penuh) karena ini halaman favorite
    const btns = container.querySelectorAll(".btn-fav");
    btns.forEach((btn) => (btn.textContent = "❤️"));

    cards.forEach((card) => {
      const id = card.dataset.id;
      const favBtn = card.querySelector(".btn-fav");

      // Klik tombol hati untuk HAPUS dari favorite
      favBtn.addEventListener("click", async (e) => {
        e.stopPropagation(); // Supaya tidak masuk ke detail

        await StoryIdb.deleteFavorite(id);
        card.remove(); // Hapus dari tampilan langsung

        // Cek jika kosong
        const sisa = await StoryIdb.getAllFavorites();
        if (sisa.length === 0) emptyMsg.style.display = "block";
      });

      // Klik card untuk ke detail
      card.addEventListener("click", (e) => {
        if (!e.target.classList.contains("btn-fav")) {
          // Cek bukan tombol fav yg diklik
          window.location.hash = `#/detail/${id}`;
        }
      });
    });
  },
};

export default Favorite;
