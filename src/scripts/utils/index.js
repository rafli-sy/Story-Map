// src/scripts/utils/index.js
export function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );
}

export function createStoryCard(s) {
  return `
    <article class="story-card" role="listitem" data-id="${s.id}">
      <img class="story-thumb" src="${escapeHtml(
        s.photoUrl || "https://via.placeholder.com/600x360?text=No+Image"
      )}" alt="${escapeHtml(s.name || "Story image")}" />
      <div class="story-body">
        <div class="story-title">${escapeHtml(s.name || "Unknown")}</div>
        <div class="story-desc">${escapeHtml(
          (s.description || "").slice(0, 120)
        )}</div>
        <div class="story-meta">Lokasi: ${s.lat ?? "-"}, ${s.lon ?? "-"}</div>
      </div>
    </article>
  `;
}

export function showLoading(container) {
  container.innerHTML = `<div style="padding:18px" class="center">Memuat...</div>`;
}
