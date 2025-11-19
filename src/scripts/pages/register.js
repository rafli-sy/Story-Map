import Api from "../data/api.js";

const RegisterPage = {
  async render() {
    return `
      <section class="auth-wrapper" aria-labelledby="auth-title">
        <div class="auth-card">
          <div class="auth-brand">
            <h1 id="auth-title">Daftar StoryApp</h1>
            <p class="muted">Buat akun baru untuk berbagi cerita</p>
          </div>

          <form id="regForm" class="form-wrapper">
            <label for="rname">Nama</label>
            <input id="rname" name="name" type="text" required autocomplete="name" />
            
            <label for="remail">Email</label>
            <input id="remail" name="email" type="email" required autocomplete="email" />
            
            <label for="rpassword">Password</label>
            <input id="rpassword" name="password" type="password" required minlength="8" autocomplete="new-password" />
            
            <div style="display:flex;gap:8px;align-items:center;margin-top:12px">
              <button class="btn-pill" type="submit">Daftar</button>
              <div id="regMsg" aria-live="polite" class="muted"></div>
            </div>
          </form>

          <div style="margin-top: 16px; text-align: center;">
            <p>Sudah punya akun? <a href="#/login">Masuk di sini</a></p>
          </div>
        </div>
      </section>
    `;
  },

  async afterRender() {
    const form = document.getElementById("regForm");
    const msg = document.getElementById("regMsg");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.textContent = "Membuat akun...";
      try {
        const payload = {
          name: document.getElementById("rname").value.trim(),
          email: document.getElementById("remail").value.trim(),
          password: document.getElementById("rpassword").value,
        };

        await Api.register(payload);
        msg.textContent = "Akun berhasil dibuat. Silakan login.";

        // Redirect ke login setelah register sukses
        setTimeout(() => {
          window.location.hash = "#/login";
        }, 1000);
      } catch (err) {
        msg.textContent = `Gagal: ${err.message}`;
      }
    });
  },
};

export default RegisterPage;
