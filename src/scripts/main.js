import App from "./app"; // Sesuaikan path import app.js jika perlu, atau biarkan kode di bawah ini jalan sendiri karena app.js diimport sebagai module di index.html
import "../styles/styles.css";

document.addEventListener("DOMContentLoaded", () => {
  // --- FIX UTAMA: Skip Link Logic ---
  // Mencegah browser menganggap #main sebagai route baru
  const skipLink = document.querySelector(".skip-link");
  const mainContent = document.querySelector("#main");

  if (skipLink && mainContent) {
    skipLink.addEventListener("click", (event) => {
      event.preventDefault(); // Stop default anchor behavior
      mainContent.focus(); // Pindahkan fokus keyboard
      mainContent.scrollIntoView({ behavior: "smooth" }); // Scroll visual
    });
  }
  // ----------------------------
});
