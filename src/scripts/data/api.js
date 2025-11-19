// src/scripts/data/api.js
const BASE = "https://story-api.dicoding.dev/v1";

const Api = {
  async register({ name, email, password }) {
    const res = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const j = await res.json();
    if (j.error) throw new Error(j.message || "Register gagal");
    return j;
  },

  async login(email, password) {
    const res = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await res.json();
    if (j.error) throw new Error(j.message || "Login gagal");
    return j;
  },

  async getStories(token, opts = {}) {
    const params = new URLSearchParams();
    if (opts.page) params.append("page", opts.page);
    if (opts.size) params.append("size", opts.size);
    if (opts.location !== undefined) params.append("location", opts.location);
    const url = `${BASE}/stories${
      params.toString() ? "?" + params.toString() : ""
    }`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await res.json();
    if (j.error) throw new Error(j.message || "Gagal memuat stories");
    return j.listStory;
  },

  async addStory(formData, token) {
    const res = await fetch(`${BASE}/stories`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const j = await res.json();
    if (j.error) throw new Error(j.message || "Gagal mengirim story");
    return j;
  },

  async getDetail(id, token) {
    const res = await fetch(`${BASE}/stories/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await res.json();
    if (j.error) throw new Error(j.message || "Gagal memuat detail");
    return j;
  },

  // --- PERBAIKAN: TAMBAHKAN METHOD INI ---
  async subscribeToNotify(subscription) {
    // Pastikan user sudah login dan token tersedia
    const token = localStorage.getItem("token");
    if (!token) return; // Atau throw error jika wajib login

    // Format body sesuai kebutuhan server (biasanya JSON string dari subscription object)
    const body = JSON.stringify(subscription);

    const res = await fetch(`${BASE}/notifications/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Sertakan token!
      },
      body: body,
    });

    const j = await res.json();
    if (j.error)
      throw new Error(j.message || "Gagal subscribe push notification");
    return j;
  },
};

export default Api;
