import App from "./app";
import "../styles/styles.css";

// Inisiasi App
document.addEventListener("DOMContentLoaded", () => {
  const app = new App({
    navToggleBtn: document.querySelector("#navToggle"),
    content: document.querySelector("#app"),
  });

  // Router untuk SPA (hash change)
  window.addEventListener("hashchange", () => {
    app.renderPage();
  });

  // Router saat pertama load
  window.addEventListener("load", () => {
    app.renderPage();
  });
});
