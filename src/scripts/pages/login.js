import Api from "../data/api.js";

const LoginPage = {
  async render() {
    return `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <img src="./images/logo.png" alt="Logo" width="50" style="margin-bottom:8px;">
            <h1>Masuk StoryApp</h1>
            <p class="text-muted" style="color:#666;">Silakan masuk untuk melanjutkan</p>
          </div>

          <form id="loginForm">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" required placeholder="nama@email.com" />
            
            <label for="password">Password</label>
            <input id="password" name="password" type="password" required minlength="8" placeholder="••••••••" />
            
            <button class="btn-pill btn-full" type="submit" style="margin-top:10px;">Masuk</button>
          </form>

          <div style="margin-top: 24px; text-align: center; font-size: 0.9rem;">
            Belum punya akun? <a href="#/register" style="color:var(--primary); font-weight:700; text-decoration:none;">Daftar sekarang</a>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    const form = document.getElementById("loginForm");
    const btn = form.querySelector("button");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      btn.textContent = "Memproses...";
      btn.disabled = true;

      try {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const res = await Api.login(email, password);
        const { token, name } = res.loginResult;

        localStorage.setItem("token", token);
        localStorage.setItem("name", name);

        // Optional: Toast Welcome
        Swal.fire({
          icon: "success",
          title: `Selamat Datang, ${name}!`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
        });

        setTimeout(() => (window.location.hash = "#/home"), 1000);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Login Gagal",
          text: err.message,
        });
        btn.textContent = "Masuk";
        btn.disabled = false;
      }
    });
  },
};

export default LoginPage;
