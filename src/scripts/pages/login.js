import Api from "../data/api.js";

const LoginPage = {
  async render() {
    return `
      <section class="auth-wrapper" aria-labelledby="auth-title">
        <div class="auth-card">
          <div class="auth-brand">
            <h1 id="auth-title">Masuk StoryApp</h1>
            <p class="muted">Silakan masuk untuk melanjutkan</p>
          </div>

          <form id="loginForm" class="form-wrapper">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" required autocomplete="username" />
            
            <label for="password">Password</label>
            <input id="password" name="password" type="password" required minlength="8" autocomplete="current-password" />
            
            <div style="display:flex;gap:8px;align-items:center;margin-top:12px">
              <button class="btn-pill" type="submit">Login</button>
              <div id="loginMsg" aria-live="polite" class="muted"></div>
            </div>
          </form>

          <div style="margin-top: 16px; text-align: center;">
            <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
          </div>
        </div>
      </section>
    `;
  },

  async afterRender() {
    const form = document.getElementById("loginForm");
    const msg = document.getElementById("loginMsg");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.textContent = "Memproses...";
      try {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const res = await Api.login(email, password);

        const { token, name } = res.loginResult;
        localStorage.setItem("token", token);
        localStorage.setItem("name", name);

        msg.textContent = "Login berhasil...";
        // Redirect ke home setelah login sukses
        setTimeout(() => {
          location.hash = "#/home";
        }, 700);
      } catch (err) {
        msg.textContent = `Login gagal: ${err.message}`;
      }
    });
  },
};

export default LoginPage;
