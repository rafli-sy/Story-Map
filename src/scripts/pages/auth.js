// src/scripts/pages/auth.js
import Api from "../data/api.js";


const AuthPage = {
  render: async () => `
    <section class="auth-wrapper" aria-labelledby="auth-title">
      <div class="auth-card">
        <div class="auth-brand">
          <h1 id="auth-title">StoryApp</h1>
          <p class="muted">Berbagi cerita singkat — masuk atau buat akun</p>
        </div>

        <div class="auth-toggle" role="tablist" aria-label="Authentication">
          <button id="tabLogin" role="tab" aria-selected="true">Login</button>
          <button id="tabRegister" role="tab" aria-selected="false">Register</button>
        </div>

        <div id="authContent" class="auth-content">
          <!-- login form will be injected here by afterRender -->
        </div>
      </div>
    </section>
  `,

  afterRender: async () => {
    const authContent = document.getElementById("authContent");
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");

    function renderLogin() {
      authContent.innerHTML = `
        <form id="loginForm" class="form-wrapper" aria-labelledby="auth-title">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" required autocomplete="username" />
          <label for="password">Password</label>
          <input id="password" name="password" type="password" required minlength="8" autocomplete="current-password" />
          <div style="display:flex;gap:8px;align-items:center;margin-top:12px">
            <button class="btn-pill" type="submit">Login</button>
            <div id="loginMsg" aria-live="polite" class="muted"></div>
          </div>
        </form>
      `;
      tabLogin.setAttribute("aria-selected", "true");
      tabRegister.setAttribute("aria-selected", "false");
      attachLogin();
    }

    function renderRegister() {
      authContent.innerHTML = `
        <form id="regForm" class="form-wrapper" aria-labelledby="auth-title">
          <label for="rname">Nama</label>
          <input id="rname" name="name" type="text" required />
          <label for="remail">Email</label>
          <input id="remail" name="email" type="email" required />
          <label for="rpassword">Password</label>
          <input id="rpassword" name="password" type="password" required minlength="8" />
          <div style="display:flex;gap:8px;align-items:center;margin-top:12px">
            <button class="btn-pill" type="submit">Daftar</button>
            <div id="regMsg" aria-live="polite" class="muted"></div>
          </div>
        </form>
      `;
      tabLogin.setAttribute("aria-selected", "false");
      tabRegister.setAttribute("aria-selected", "true");
      attachRegister();
    }

    function attachLogin() {
      const form = document.getElementById("loginForm");
      const msg = document.getElementById("loginMsg");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        msg.textContent = "Memproses...";
        try {
          const email = form.email.value.trim();
          const password = form.password.value;
          const res = await Api.login(email, password);
          const { token, name } = res.loginResult;
          localStorage.setItem("token", token);
          localStorage.setItem("name", name);
          msg.textContent = "Login berhasil — mengarahkan...";
          setTimeout(() => (location.hash = "#/home"), 700);
        } catch (err) {
          msg.textContent = `Login gagal: ${err.message}`;
        }
      });
    }

    function attachRegister() {
      const form = document.getElementById("regForm");
      const msg = document.getElementById("regMsg");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        msg.textContent = "Membuat akun...";
        try {
          const payload = {
            name: form.name.value.trim(), // note: input id rname but name attr is 'name'
            email: form.email.value.trim(),
            password: form.password.value,
          };
          // Because we used different IDs, adjust:
          payload.name = document.getElementById("rname").value.trim();
          payload.email = document.getElementById("remail").value.trim();
          payload.password = document.getElementById("rpassword").value;
          await Api.register(payload);
          msg.textContent = "Akun dibuat. Silakan login.";
          setTimeout(() => renderLogin(), 900);
        } catch (err) {
          msg.textContent = `Gagal: ${err.message}`;
        }
      });
    }

    // initial render: login
    renderLogin();

    tabLogin.addEventListener("click", renderLogin);
    tabRegister.addEventListener("click", renderRegister);
  },
};

export default AuthPage;
