import Api from "../data/api.js";

const RegisterPage = {
  async render() {
    return `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <img src="./images/logo.png" alt="Logo" width="50" style="margin-bottom:8px;">
            <h1>Daftar Akun</h1>
            <p class="text-muted" style="color:#666;">Bergabung untuk berbagi cerita menarik</p>
          </div>

          <form id="regForm">
            <label for="rname">Nama Lengkap</label>
            <input id="rname" name="name" type="text" required placeholder="Nama Anda" autocomplete="name" />
            
            <label for="remail">Email</label>
            <input id="remail" name="email" type="email" required placeholder="nama@email.com" autocomplete="email" />
            
            <label for="rpassword">Password</label>
            <input id="rpassword" name="password" type="password" required minlength="8" placeholder="••••••••" autocomplete="new-password" />
            
            <button class="btn-pill btn-full" type="submit" style="margin-top:10px;">Daftar</button>
          </form>

          <div style="margin-top: 24px; text-align: center; font-size: 0.9rem;">
            Sudah punya akun? <a href="#/login" style="color:var(--primary); font-weight:700; text-decoration:none;">Masuk di sini</a>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    const form = document.getElementById("regForm");
    const btn = form.querySelector("button");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      btn.textContent = "Membuat Akun...";
      btn.disabled = true;

      try {
        const payload = {
          name: document.getElementById("rname").value.trim(),
          email: document.getElementById("remail").value.trim(),
          password: document.getElementById("rpassword").value,
        };

        await Api.register(payload);

        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Akun berhasil dibuat. Silakan login.",
          confirmButtonText: "Ke Halaman Login",
        }).then(() => {
          window.location.hash = "#/login";
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Gagal Daftar",
          text: err.message,
        });
        btn.textContent = "Daftar";
        btn.disabled = false;
      }
    });
  },
};

export default RegisterPage;
