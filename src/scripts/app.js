import routes from "./routes/routes.js";
import UrlParser from "./utils/url-parser.js";

const viewEl = document.getElementById("view");

async function renderRoute() {
  const parsed = UrlParser.parseActiveUrlWithCombiner();

  // Routing logic
  let page = routes[parsed];
  if (!page) {
    page = routes["/404"];
  }

  // ============
  // LOGIK NAVBAR
  // ============
  const navbar = document.querySelector(".navbar");
  const hideNavRoutes = ["/", "/login", "/register"];

  if (navbar) {
    if (hideNavRoutes.includes(parsed)) {
      navbar.style.display = "none";
    } else {
      navbar.style.display = "block";
    }
  }

  const doRender = async () => {
    viewEl.innerHTML = await page.render();

    if (page.afterRender) {
      await page.afterRender();
    }

    // Replace Feather Icons setelah render selesai
    if (window.feather) {
      window.feather.replace();
    }

    // Fokus aksesibilitas
    const main = document.querySelector("#main");
    if (main) {
      main.focus();
    }
  };

  if (document.startViewTransition) {
    const transition = document.startViewTransition(doRender);
    transition.finished.catch(() => {});
  } else {
    await doRender();
  }
}

/** ==========================
 * INIT APP
 * ==========================*/
function init() {
  // Init Icons di Navbar (Static)
  if (window.feather) {
    window.feather.replace();
  }

  // 1. LOGIC LOGOUT (Desktop)
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("name");
      window.location.hash = "#/login";
    };
  }

  // 2. LOGIC SIDEBAR & HAMBURGER (Mobile)
  const hamburger = document.querySelector("#hamburger");
  const drawer = document.querySelector("#drawer");
  const navLinks = document.querySelectorAll(".main-nav a");

  if (hamburger && drawer) {
    hamburger.addEventListener("click", (event) => {
      event.stopPropagation();
      drawer.classList.toggle("open");
    });
  }

  document.addEventListener("click", (event) => {
    if (drawer && drawer.classList.contains("open")) {
      if (!drawer.contains(event.target) && !hamburger.contains(event.target)) {
        drawer.classList.remove("open");
      }
    }
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (drawer) drawer.classList.remove("open");
    });
  });

  // 3. LOGIC LOGOUT (Mobile)
  const logoutBtnMobile = document.getElementById("logoutBtnMobile");
  if (logoutBtnMobile) {
    logoutBtnMobile.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("name");
      window.location.hash = "#/login";
      if (drawer) drawer.classList.remove("open");
    });
  }

  // Render saat load
  renderRoute();

  // Render saat hash berubah
  window.addEventListener("hashchange", () => {
    renderRoute();
  });
}

window.addEventListener("load", init);

export default renderRoute;
