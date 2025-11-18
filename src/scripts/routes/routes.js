// src/scripts/routes/routes.js
import AuthPage from "../pages/auth.js";
import HomePage from "../pages/home.js";
import AddPage from "../pages/add-story.js";
import DetailPage from "../pages/detail.js";

const routes = {
  "/": AuthPage,
  "/auth": AuthPage,
  "/home": HomePage,
  "/add": AddPage,
  "/detail/:id": DetailPage,
  "/about": {
    render: async () =>
      `<section style="padding:20px"><h2>About</h2><p style="color:#555">Aplikasi berbagi cerita - Dicoding submission.</p></section>`,
  },
  "/404": {
    render: async () =>
      '<section style="padding:20px"><h2>404 — Halaman tidak ditemukan</h2><p>Kembali ke <a href="#/">auth</a></p></section>',
  },
};

export default routes;
