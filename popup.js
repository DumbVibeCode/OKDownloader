// popup.js

const DEFAULTS = {
  filenameFormat: "{artist} - {title}",
  subfolder:      "",
  maxConcurrent:  3
};
const EXAMPLE = { artist: "Земфира", title: "Искры" };

// ─── Переключение видов ───────────────────────────────────────────────────────

const viewTracks   = document.getElementById("view-tracks");
const viewSettings = document.getElementById("view-settings");
const btnSettings  = document.getElementById("btn-settings");
let settingsOpen = false;

btnSettings.addEventListener("click", () => {
  settingsOpen = !settingsOpen;
  viewTracks.style.display   = settingsOpen ? "none"  : "block";
  viewSettings.style.display = settingsOpen ? "block" : "none";
  btnSettings.classList.toggle("active", settingsOpen);
  if (settingsOpen) loadSettings();
});

// ─── Список треков ────────────────────────────────────────────────────────────

const list    = document.getElementById("track-list");
const status  = document.getElementById("status");
const footer  = document.getElementById("footer");
let tracks = [];

function renderTracks() {
  list.innerHTML = "";
  if (!tracks.length) {
    status.textContent = "Треков не найдено. Воспроизведите музыку на ok.ru.";
    footer.style.display = "none";
    return;
  }
  status.textContent = "";
  footer.style.display = "flex";

  tracks.forEach(t => {
    const item = document.createElement("div");
    item.className = "track-item";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cb.addEventListener("change", () => { t._checked = cb.checked; });

    const info = document.createElement("div");
    info.className = "track-info";

    const titleEl = document.createElement("div");
    titleEl.className = "track-title";
    titleEl.textContent = t.title || "(без названия)";

    const artistEl = document.createElement("div");
    artistEl.className = "track-artist";
    artistEl.textContent = t.artist || "";

    info.appendChild(titleEl);
    if (t.artist) info.appendChild(artistEl);

    const dlBtn = document.createElement("button");
    dlBtn.className = "track-dl";
    dlBtn.title = "Скачать";
    dlBtn.textContent = "⬇";
    dlBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "DOWNLOAD_TRACKS", tracks: [t] });
    });

    item.appendChild(cb);
    item.appendChild(info);
    item.appendChild(dlBtn);
    list.appendChild(item);

    t._checked = true;
    t._cb = cb;
  });
}

document.getElementById("btn-select-all").addEventListener("click", () => {
  tracks.forEach(t => { t._checked = true; if (t._cb) t._cb.checked = true; });
});
document.getElementById("btn-deselect").addEventListener("click", () => {
  tracks.forEach(t => { t._checked = false; if (t._cb) t._cb.checked = false; });
});
document.getElementById("btn-dl-all").addEventListener("click", () => {
  const selected = tracks.filter(t => t._checked);
  if (!selected.length) { alert("Ничего не выбрано"); return; }
  chrome.runtime.sendMessage({ type: "DOWNLOAD_TRACKS", tracks: selected });
});
document.getElementById("btn-clear").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "CLEAR_TRACKS" }, () => { tracks = []; renderTracks(); });
});

function loadTracks() {
  chrome.runtime.sendMessage({ type: "GET_TRACKS" }, resp => {
    if (chrome.runtime.lastError) { status.textContent = "Ошибка связи."; return; }
    tracks = (resp?.tracks || []);
    renderTracks();
  });
}

// ─── Настройки ───────────────────────────────────────────────────────────────

const fmtInput   = document.getElementById("filenameFormat");
const subInput   = document.getElementById("subfolder");
const concInput  = document.getElementById("maxConcurrent");
const previewEl  = document.getElementById("preview");
const saveStatus = document.getElementById("save-status");

function renderPreview() {
  const fmt = fmtInput.value.trim() || DEFAULTS.filenameFormat;
  let name = fmt
    .replace("{artist}", EXAMPLE.artist)
    .replace("{title}",  EXAMPLE.title)
    .replace(/^[\s\-–]+|[\s\-–]+$/g, "").trim() || "track";
  const sub = subInput.value.trim();
  previewEl.textContent = "→ " + (sub ? `${sub}/${name}.mp3` : `${name}.mp3`);
}

fmtInput.addEventListener("input", renderPreview);
subInput.addEventListener("input", renderPreview);

document.getElementById("btn-save").addEventListener("click", () => {
  const s = {
    filenameFormat: fmtInput.value.trim() || DEFAULTS.filenameFormat,
    subfolder:      subInput.value.trim(),
    maxConcurrent:  Math.min(10, Math.max(1, parseInt(concInput.value) || 3))
  };
  chrome.storage.sync.set(s, () => {
    saveStatus.classList.add("visible");
    setTimeout(() => saveStatus.classList.remove("visible"), 2000);
  });
});

document.getElementById("btn-reset-settings").addEventListener("click", () => {
  fmtInput.value  = DEFAULTS.filenameFormat;
  subInput.value  = DEFAULTS.subfolder;
  concInput.value = DEFAULTS.maxConcurrent;
  renderPreview();
});

function loadSettings() {
  chrome.storage.sync.get(DEFAULTS, s => {
    fmtInput.value  = s.filenameFormat;
    subInput.value  = s.subfolder;
    concInput.value = s.maxConcurrent;
    renderPreview();
  });
}

// ─── Инициализация ────────────────────────────────────────────────────────────

loadTracks();
