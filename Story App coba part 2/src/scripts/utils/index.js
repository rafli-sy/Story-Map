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
  const hasPhoto = Boolean(s.photoUrl);
  const photoSrc = escapeHtml(
    hasPhoto ? s.photoUrl : "https://via.placeholder.com/600x360?text=No+Image"
  );

  const altText = hasPhoto
    ? escapeHtml(s.description || "Foto story")
    : "Tidak ada foto tersedia";

  return `
    <article class="story-card" data-id="${escapeHtml(s.id)}">
      <img 
        class="story-thumb" 
        src="${photoSrc}" 
        alt="${altText}"
        loading="lazy"
      />

      <div class="story-body">
        <h3 class="story-title">${escapeHtml(s.name || "Tanpa Judul")}</h3>
        
        <p class="story-desc">
          ${escapeHtml((s.description || "").slice(0, 120))}
        </p>

        <p class="story-meta">
          Lokasi: ${s.lat ?? "-"}, ${s.lon ?? "-"}
        </p>
      </div>
    </article>
  `;
}

export function showLoading(container) {
  container.innerHTML = `<div style="padding:18px" class="center">Memuat...</div>`;
}
