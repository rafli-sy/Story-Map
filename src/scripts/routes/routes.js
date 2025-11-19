import LoginPage from "../pages/login.js";
import RegisterPage from "../pages/register.js";
import HomePage from "../pages/home.js";
import AddPage from "../pages/add-story.js";
import DetailPage from "../pages/detail.js";
import AboutPage from "../pages/about-page.js";
import FavoritePage from "../pages/favorite.js";

const routes = {
  "/": LoginPage,
  "/login": LoginPage,
  "/register": RegisterPage,
  "/home": HomePage,
  "/add": AddPage,
  "/detail/:id": DetailPage,
  "/about": new AboutPage(),
  "/favorite" : FavoritePage,
  "/404":{
    render: async () =>
      `<h1 class="center" style="padding:20px;">404 Halaman Tidak Ditemukan</h1>`,
    afterRender: async () => {},
  },
};

export default routes;
