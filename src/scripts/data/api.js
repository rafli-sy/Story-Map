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
      headers: { Authorization: `Bearer ${token}` }, // don't set content-type for FormData
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
};

export default Api;
