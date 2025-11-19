// src/scripts/pages/add-story.js
import Api from "../data/api.js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const AddPage = {
  render: async () => `
    <main role="main" id="main-content">
      <section aria-labelledby="add-title">
        <h1 id="add-title" class="section-title">Tambah Story</h1>

        <h2 class="sr-only">Form Tambah Story</h2>

        <div class="form-wrapper" role="form" aria-describedby="add-instructions">
          <p id="add-instructions" class="muted">Isi form berikut untuk menambahkan story. Foto maksimal 1MB.</p>

          <form id="addForm" enctype="multipart/form-data">

            <label for="openCameraBtn">Ambil Foto dari Kamera</label>

            <div class="camera-wrapper" style="margin-bottom:16px">
              <video id="cameraPreview" autoplay playsinline style="width:100%;border-radius:8px;display:none"></video>
              <canvas id="cameraCanvas" style="display:none"></canvas>

              <div style="display:flex;gap:8px;margin:8px 0">
                <button type="button" id="openCameraBtn" class="btn-pill" aria-label="Buka kamera">Buka Kamera</button>
                <button type="button" id="takePhotoBtn" class="btn-pill" style="display:none" aria-label="Ambil foto">Ambil Foto</button>
              </div>

              <img id="cameraResult" alt="" style="max-width:100%;margin-top:8px;display:none;border-radius:8px" />
            </div>

            <label for="photo">Pilih Gambar (max 1MB)</label>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              capture="environment"
            />

            <label for="description">Deskripsi</label>
            <textarea id="description" name="description" required></textarea>

            <label for="latlng">Latitude,Longitude (klik peta)</label>
            <input id="latlng" name="latlng" readonly placeholder="Klik peta untuk memilih koordinat (opsional)" />

            <div style="display:flex;gap:8px;margin-top:12px;align-items:center">
              <button class="btn-pill" type="submit">Kirim</button>
              <button type="button" id="cancelBtn" class="btn-pill" style="background:#fff;border:1px solid var(--border)" aria-label="Batal">Batal</button>
              <div id="addMessage" aria-live="polite" style="margin-left:8px;color:var(--muted)"></div>
            </div>
          </form>
        </div>

        <div class="map-section" style="margin-top:16px">
          <div class="map-title">Pilih Lokasi</div>
          <div id="addMap" class="map-container" style="height:300px" aria-hidden="false"></div>
        </div>
      </section>
    </main>
  `,

  afterRender: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.hash = "#/";
      return;
    }

    const form = document.getElementById("addForm");
    const msg = document.getElementById("addMessage");
    const latlngInput = document.getElementById("latlng");
    const descriptionInput = document.getElementById("description");
    const cameraResult = document.getElementById("cameraResult");

    // =============================
    //  INISIALISASI MAP LEAFLET
    // =============================
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
      iconUrl: require("leaflet/dist/images/marker-icon.png"),
      shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    });

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
    });

    // =============================
    //  FITUR KAMERA
    // =============================
    const openBtn = document.getElementById("openCameraBtn");
    const takeBtn = document.getElementById("takePhotoBtn");
    const video = document.getElementById("cameraPreview");
    const canvas = document.getElementById("cameraCanvas");
    const imgResult = cameraResult;

    let cameraStream = null;
    let capturedBlob = null;

    openBtn.addEventListener("click", async () => {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        video.srcObject = cameraStream;
        video.style.display = "block";
        takeBtn.style.display = "inline-block";
      } catch (err) {
        alert("Tidak bisa mengakses kamera: " + err.message);
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

          imgResult.src = URL.createObjectURL(blob);
          imgResult.style.display = "block";
          // set alt deskriptif berdasarkan deskripsi input (jika ada)
          const desc = (descriptionInput.value || "").trim();
          imgResult.alt = desc ? `Foto: ${desc}` : "Hasil foto dari kamera";
        },
        "image/jpeg",
        0.9
      );

      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      video.style.display = "none";
      takeBtn.style.display = "none";
    });

    // =============================
    //  EVENT SUBMIT FORM
    // =============================
    document
      .getElementById("cancelBtn")
      .addEventListener("click", () => (window.location.hash = "#/home"));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.textContent = "Mengirim...";

      const fileInput = document.getElementById("photo");
      const description = document.getElementById("description").value.trim();
      const latlng = document.getElementById("latlng").value;

      // Prioritas: hasil kamera > file upload
      let file = null;

      if (capturedBlob) {
        file = new File([capturedBlob], "camera.jpg", { type: "image/jpeg" });
      } else if (fileInput.files[0]) {
        file = fileInput.files[0];
      } else {
        msg.textContent = "Silakan ambil foto atau pilih dari galeri.";
        return;
      }

      if (file.size > 1024 * 1024) {
        msg.textContent = "Ukuran gambar maksimal 1MB.";
        return;
      }

      const formData = new FormData();
      formData.append("photo", file);
      formData.append("description", description);

      if (latlng) {
        const [lat, lon] = latlng.split(",");
        formData.append("lat", lat);
        formData.append("lon", lon);
      }

      try {
        await Api.addStory(formData, token);
        msg.textContent = "Berhasil mengirim story.";
        setTimeout(() => (window.location.hash = "#/home"), 900);
      } catch (err) {
        msg.textContent = `Gagal: ${err.message}`;
      }
    });
  },
};

export default AddPage;
