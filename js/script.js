/* ===== NASA Space Explorer App Logic ===== */

// Hook date inputs & set defaults via dateRange.js
const startInput = document.getElementById("startDate");
const endInput   = document.getElementById("endDate");
setupDateInputs(startInput, endInput);

// Stable classroom APOD mirror feed (works on GitHub Pages)
const FEED_URL = "https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json";

// DOM
const statusEl   = document.getElementById("status");
const galleryEl  = document.getElementById("gallery");
const factEl     = document.getElementById("randomFact");
const fetchBtn   = document.getElementById("fetchBtn");
const modalEl    = document.getElementById("modal");
const modalMedia = document.getElementById("modalMedia");
const modalTitle = document.getElementById("modalTitle");
const modalDate  = document.getElementById("modalDate");
const modalExp   = document.getElementById("modalExplanation");

// Random fact (LevelUp)
const FACTS = [
  "A day on Venus is longer than a year on Venus.",
  "Neutron stars can spin over 600 times per second.",
  "Saturn could float in water due to its low density.",
  "There may be more trees on Earth than stars in the Milky Way.",
  "Astronauts grow taller in space due to spinal decompression."
];
factEl.textContent = FACTS[Math.floor(Math.random()*FACTS.length)];

// Helpers
const fmt = d => new Date(d).toLocaleDateString(undefined,
  {year:"numeric", month:"long", day:"numeric"});

const isYT = url => url && (url.includes("youtube.com") || url.includes("youtu.be"));
const ytId  = url => {
  try{
    if(url.includes("watch?v=")) return new URL(url).searchParams.get("v");
    if(url.includes("youtu.be/")) return url.split("youtu.be/")[1].split(/[?&]/)[0];
  }catch{}
  return null;
};

// Data
async function getFeed(){
  const res = await fetch(FEED_URL, {cache:"no-store"});
  if(!res.ok) throw new Error("Feed request failed");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results ?? []);
}

// Modal
function openModal(entry){
  modalTitle.textContent = entry.title ?? "Untitled";
  modalDate.textContent  = entry.date ? fmt(entry.date) : "";
  modalExp.textContent   = entry.explanation ?? "";
  modalMedia.innerHTML   = "";

  if(entry.media_type === "video"){
    if(isYT(entry.url)){
      const id = ytId(entry.url);
      const iframe = document.createElement("iframe");
      iframe.src = id ? `https://www.youtube.com/embed/${id}` : entry.url;
      iframe.setAttribute("allowfullscreen","");
      modalMedia.appendChild(iframe);
    }else{
      const a = document.createElement("a");
      a.href = entry.url; a.target="_blank"; a.rel="noopener";
      a.textContent = "Open video";
      modalMedia.appendChild(a);
    }
  }else{
    const img = document.createElement("img");
    img.src = entry.url;
    img.alt = entry.title || "APOD image";
    modalMedia.appendChild(img);
  }

  modalEl.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}
function closeModal(){ modalEl.setAttribute("aria-hidden","true"); document.body.style.overflow = ""; }
modalEl.addEventListener("click", e=>{
  if(e.target.dataset.close !== undefined || e.target.classList.contains("modal__backdrop")) closeModal();
});
window.addEventListener("keydown", e=>{
  if(e.key === "Escape" && modalEl.getAttribute("aria-hidden")==="false") closeModal();
});

// Render gallery
function renderGallery(items){
  galleryEl.innerHTML = "";
  if(!items.length){
    galleryEl.innerHTML = `<div class="placeholder glass"><div class="placeholder-icon">🛰️</div><p>No results for that date range.</p></div>`;
    return;
  }

  const frag = document.createDocumentFragment();
  for(const entry of items){
    const card  = document.createElement("article");
    card.className = "card glass";

    const media = document.createElement("div");
    media.className = "card__media";

    if(entry.media_type === "video"){
      // LevelUp: show YouTube thumbnail + badge
      let thumb = null;
      if(isYT(entry.url)){
        const id = ytId(entry.url);
        if(id) thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      }
      if(thumb){
        const img = document.createElement("img");
        img.src = thumb; img.alt = `${entry.title || "APOD video"} (video)`;
        media.appendChild(img);
      }
      const badge = document.createElement("span");
      badge.className = "badge"; badge.textContent = "Video";
      media.appendChild(badge);
    }else{
      const img = document.createElement("img");
      img.loading = "lazy"; img.src = entry.url; img.alt = entry.title || "APOD image";
      media.appendChild(img);
    }

    const body = document.createElement("div");
    body.className = "card__body";
    body.innerHTML = `<h3 class="card__title">${entry.title || "Untitled"}</h3>
                      <p class="card__date">${entry.date ? fmt(entry.date) : ""}</p>`;

    card.appendChild(media);
    card.appendChild(body);
    card.addEventListener("click", ()=>openModal(entry));
    frag.appendChild(card);
  }
  galleryEl.appendChild(frag);
}

// Click → fetch → filter → render
fetchBtn.addEventListener("click", async ()=>{
  const sVal = startInput.value, eVal = endInput.value;
  if(!sVal || !eVal){ statusEl.textContent = "Please select both dates."; return; }

  statusEl.textContent = "🔄 Loading space photos…";
  galleryEl.innerHTML = "";

  try{
    const all = await getFeed();
    const s = new Date(sVal), e = new Date(eVal);
    const list = all
      .filter(x => { const d = new Date(x.date); return d >= s && d <= e; })
      .sort((a,b) => new Date(b.date) - new Date(a.date));
    renderGallery(list);
    statusEl.textContent = `Loaded ${list.length} ${list.length===1?"item":"items"}.`;
  }catch(err){
    console.error(err);
    statusEl.textContent = "Could not load images. Check FEED_URL or your connection.";
  }
});
