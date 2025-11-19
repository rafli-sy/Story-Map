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

  const doRender = async () => {
    viewEl.innerHTML = await page.render();

    // After render
    if (page.afterRender) {
      await page.afterRender();
    }

    // Fokus ke main (aksesibilitas). Pastikan ada elemen <main>.
    const main = document.querySelector("main");
    if (main) {
      // tabindex agar fokus programatik bisa diarahkan
      if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
      main.focus();
    }
  };

  // Gunakan View Transition API bila tersedia (Dicoding mensyaratkan ini)
  if (document.startViewTransition) {
    try {
      await document.startViewTransition(doRender);
    } catch (e) {
      // Fallback apabila startViewTransition melempar error
      await doRender();
    }
  } else {
    await doRender();
  }
}

/** ==========================
 * INIT APP
 * ==========================*/
function init() {
  // bindLogout akan dipanggil setelah tiap render
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

  // Render pertama
  renderRoute().then(bindLogout);

  // Render saat hash berubah
  window.addEventListener("hashchange", () => {
    renderRoute().then(bindLogout);
  });

  // Pastikan navigasi keyboard dasar: Enter on links (bawaan), dsb.
}

window.addEventListener("load", init);

export default renderRoute;
