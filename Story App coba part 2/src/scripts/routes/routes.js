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
      `<main role="main"><section style="padding:20px"><h1>About</h1><p style="color:#555">Aplikasi berbagi cerita - Dicoding submission.</p></section></main>`,
  },
  "/404": {
    render: async () =>
      `<main role="main"><section style="padding:20px"><h1>404 — Halaman tidak ditemukan</h1><p>Kembali ke <a href="#/">auth</a></p></section></main>`,
  },
};

export default routes;
