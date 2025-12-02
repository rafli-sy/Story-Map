import Api from "../data/api.js";
import StoryIdb from "../data/story-db.js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const AddPage = {
  render: async () => `
    <section class="auth-container" style="align-items:flex-start; padding-top:40px;">
      <div class="auth-card" style="max-width:720px;">
        <div class="auth-header">
          <h1 style="margin-bottom:8px;">Tambah Cerita Baru</h1>
          <p class="text-muted">Bagikan momen terbaikmu hari ini</p>
        </div>

        <form id="addForm">
          <div style="display:flex; gap:20px; flex-wrap:wrap;">
            <div style="flex:1; min-width:280px;">
              <div class="camera-wrapper" style="margin-bottom:16px; position:relative;">
                <video id="cameraPreview" autoplay playsinline style="width:100%; border-radius:12px; display:none; background:#000;"></video>
                <canvas id="cameraCanvas" style="display:none"></canvas>
                <img id="imagePreview" alt="Preview" style="width:100%; border-radius:12px; display:none; box-shadow:var(--shadow);" />
                
                <div id="placeholderImg" style="width:100%; height:200px; background:#f0f2f5; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#aaa; border:2px dashed #ccc;">
                  <span style="text-align:center;">📷<br>Belum ada foto</span>
                </div>
              </div>

              <div style="display:flex; gap:10px; margin-bottom:16px;">
                <button type="button" id="openCameraBtn" class="btn-pill" style="flex:1; font-size:0.9rem; padding:10px;">
                  <i data-feather="camera"></i> Buka Kamera
                </button>
                <button type="button" id="takePhotoBtn" class="btn-pill" style="flex:1; display:none; background:#e74c3c;">
                  Ambil Foto
                </button>
              </div>
              
              <label for="photo" style="font-size:0.9rem;">Atau upload file:</label>
              <input id="photo" name="photo" type="file" accept="image/*" />
            </div>

            <div style="flex:1; min-width:280px;">
              <label for="description">Deskripsi</label>
              <textarea id="description" name="description" required placeholder="Tulis cerita kamu..." style="height:120px;"></textarea>

              <label for="latlng">Lokasi (Opsional)</label>
              <input id="latlng" name="latlng" readonly placeholder="Klik peta di bawah untuk pin lokasi" style="background:#f9f9f9; cursor:not-allowed;" />
              
              <div class="map-section" style="padding:0; box-shadow:none; border:1px solid #ddd; margin-bottom:20px;">
                <div id="addMap" style="height:200px; border-radius:12px;"></div>
              </div>

              <div style="display:flex; gap:10px; margin-top:20px;">
                <button class="btn-pill btn-full" type="submit">Kirim Cerita</button>
                <button type="button" id="cancelBtn" class="btn-pill" style="background:#fff; color:#333; border:1px solid #ccc;">Batal</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  `,

  afterRender: async () => {
    // Re-init Icons
    if (window.feather) window.feather.replace();

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.hash = "#/";
      return;
    }

    const form = document.getElementById("addForm");
    const latlngInput = document.getElementById("latlng");
    const descriptionInput = document.getElementById("description");
    const imagePreview = document.getElementById("imagePreview");
    const placeholderImg = document.getElementById("placeholderImg");

    // === MAP LOGIC ===
    const map = L.map("addMap").setView([-6.2, 106.8], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);
    let marker = null;

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      if (marker) marker.setLatLng([lat, lng]);
      else marker = L.marker([lat, lng]).addTo(map);

      latlngInput.value = `${lat},${lng}`;

      // NOTIFIKASI LOKASI
      Swal.fire({
        title: "Lokasi Dipilih",
        text: "Lokasi berhasil dipilih di peta ✅",
        icon: "success",
        confirmButtonText: "OK",
      });
    });

    // === CAMERA LOGIC ===
    const openBtn = document.getElementById("openCameraBtn");
    const takeBtn = document.getElementById("takePhotoBtn");
    const video = document.getElementById("cameraPreview");
    const canvas = document.getElementById("cameraCanvas");
    const fileInput = document.getElementById("photo");

    let cameraStream = null;
    let capturedBlob = null;

    // Handle File Input Change
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.style.display = "block";
        placeholderImg.style.display = "none";
        video.style.display = "none";
      }
    });

    openBtn.addEventListener("click", async () => {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        video.srcObject = cameraStream;
        video.style.display = "block";
        placeholderImg.style.display = "none";
        imagePreview.style.display = "none";
        takeBtn.style.display = "inline-block";
        openBtn.style.display = "none";

        // NOTIFIKASI KAMERA AKTIF
        Swal.fire({
          title: "Kamera Aktif",
          text: "Kamera siap digunakan untuk mengambil foto.",
          icon: "info",
          confirmButtonText: "OK",
        });
      } catch (err) {
        Swal.fire(
          "Gagal",
          "Tidak bisa mengakses kamera: " + err.message,
          "error"
        );
      }
    });

    takeBtn.addEventListener("click", () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          capturedBlob = blob;
          imagePreview.src = URL.createObjectURL(blob);
          imagePreview.style.display = "block";
          video.style.display = "none";
          takeBtn.style.display = "none";
          openBtn.style.display = "inline-block";
          openBtn.innerHTML = `<i data-feather="camera"></i> Foto Ulang`;
          if (window.feather) window.feather.replace();

          // Stop stream
          if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());

          // NOTIFIKASI FOTO DIAMBIL
          Swal.fire({
            title: "Foto Diambil!",
            text: "📸 Foto berhasil diambil!",
            icon: "success",
            confirmButtonText: "OK",
          });
        },
        "image/jpeg",
        0.9
      );
    });

    document.getElementById("cancelBtn").addEventListener("click", () => {
      if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
      window.location.hash = "#/home";
    });

    // === SUBMIT LOGIC ===
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const description = descriptionInput.value.trim();
      let file = null;

      if (capturedBlob) {
        file = new File([capturedBlob], "camera.jpg", { type: "image/jpeg" });
      } else if (fileInput.files[0]) {
        file = fileInput.files[0];
      } else {
        Swal.fire(
          "Peringatan",
          "Silakan ambil foto atau pilih dari galeri.",
          "warning"
        );
        return;
      }

      // LOADING STATE
      Swal.fire({
        title: "Mengunggah Cerita...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const formData = new FormData();
      formData.append("photo", file);
      formData.append("description", description);
      if (latlngInput.value) {
        const [lat, lon] = latlngInput.value.split(",");
        formData.append("lat", lat);
        formData.append("lon", lon);
      }

      try {
        await Api.addStory(formData, token);

        // TOAST NOTIFICATION (Sesuai Video)
        Swal.fire({
          icon: "success",
          title: "Cerita Ditambahkan",
          text: `Cerita berhasil diunggah!`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: "#fff",
          iconColor: "#27ae60",
        });

        setTimeout(() => (window.location.hash = "#/home"), 1500);
      } catch (err) {
        console.error(err);

        // OFFLINE HANDLING
        if (!navigator.onLine) {
          await StoryIdb.saveOfflineStory({
            description: description,
            photo: file,
            lat: latlngInput.value ? latlngInput.value.split(",")[0] : null,
            lon: latlngInput.value ? latlngInput.value.split(",")[1] : null,
            createdAt: new Date().toISOString(),
          });

          Swal.fire({
            icon: "warning",
            title: "Mode Offline",
            text: "Cerita disimpan dan akan dikirim saat online.",
          });
          setTimeout(() => (window.location.hash = "#/home"), 2000);
        } else {
          Swal.fire("Gagal", err.message, "error");
        }
      }
    });
  },
};

export default AddPage;
