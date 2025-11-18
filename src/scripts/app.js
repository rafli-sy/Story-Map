// src/scripts/app.js
import routes from "./routes/routes.js";
import UrlParser from "./utils/url-parser.js";

const viewEl = document.getElementById("view");

async function renderRoute() {
  const parsed = UrlParser.parseActiveUrlWithCombiner();
  const page = routes[parsed] || routes["/404"];

  // ==========================================
  // LOGIK NAVBAR (Sembunyikan di Login/Register)
  // ==========================================
  const navbar = document.querySelector(".navbar");
  if (parsed === "/" || parsed === "/auth") {
    if (navbar) navbar.style.display = "none";
  } else {
    if (navbar) navbar.style.display = "block";
  }

  // Transition keluar
  viewEl.style.opacity = 0;
  viewEl.style.transform = "translateY(6px)";
  await new Promise((r) => setTimeout(r, 120));

  // Render halaman
  viewEl.innerHTML = await page.render();

  // After render
  if (page.afterRender) {
    await page.afterRender();
  }

  // Transition masuk
  await new Promise((r) => setTimeout(r, 10));
  viewEl.style.opacity = 1;
  viewEl.style.transform = "none";

  // Fokus ke main
  const main = document.querySelector("main");
  if (main) main.focus();
}

/** ==========================
 * SETUP AWAL
 * ==========================*/
function init() {
  // Bind event logout SESUDAH halaman dirender
  const bindLogout = () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("name");
        window.location.hash = "#/";
      };
    }
  };

  // Jalankan render pertama
  renderRoute().then(bindLogout);

  // Jalankan render ketika hash berubah
  window.addEventListener("hashchange", () => {
    renderRoute().then(bindLogout);
  });
}

window.addEventListener("load", init);

export default renderRoute;
