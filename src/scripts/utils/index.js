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
      <div style="position:relative;">
        <img 
          class="story-thumb" 
          src="${photoSrc}" 
          alt="${altText}"
          loading="lazy"
        />
        <button class="btn-fav" aria-label="Simpan ke favorite" style="position:absolute; top:10px; right:10px; background:white; border:none; border-radius:50%; width:40px; height:40px; cursor:pointer; box-shadow:0 2px 5px rgba(0,0,0,0.2); display:flex; align-items:center; justify-content:center; font-size:1.2rem; z-index:10;">
          🤍
        </button>
      </div>

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
