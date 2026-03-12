// background.js

const capturedTracks = {};    // url → { url, title, artist, tabId, ts }
const pendingFilenames = {};  // downloadId → желаемое имя файла

// ─── Настройки по умолчанию ──────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  filenameFormat: "{artist} - {title}", // шаблон имени файла
  subfolder:      "",                   // подпапка (пусто = прямо в Downloads)
  maxConcurrent:  3                     // одновременных загрузок
};

async function getSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, resolve);
  });
}

// ─── Очередь загрузок ────────────────────────────────────────────────────────

const downloadQueue = [];   // ожидающие треки
let activeDownloads = 0;    // текущие активные загрузки

function enqueue(track, settings) {
  downloadQueue.push({ track, settings });
  processQueue();
}

function processQueue() {
  const limit = downloadQueue[0]?.settings?.maxConcurrent ?? DEFAULT_SETTINGS.maxConcurrent;
  while (activeDownloads < limit && downloadQueue.length > 0) {
    const { track, settings } = downloadQueue.shift();
    activeDownloads++;
    updateBadge();
    startDownload(track, settings);
  }
}

function startDownload(track, settings) {
  const name = buildFilename(track, settings);
  chrome.downloads.download(
    { url: track.url, saveAs: false },
    downloadId => {
      if (downloadId !== undefined) {
        pendingFilenames[downloadId] = name;
      } else {
        // Не удалось запустить (например истёк signed URL) — считаем завершённым
        activeDownloads = Math.max(0, activeDownloads - 1);
        updateBadge();
        processQueue();
      }
    }
  );
}

// Когда загрузка завершилась (успешно или нет) — запускаем следующую
chrome.downloads.onChanged.addListener(delta => {
  if (delta.state &&
      (delta.state.current === "complete" || delta.state.current === "interrupted")) {
    activeDownloads = Math.max(0, activeDownloads - 1);
    updateBadge();
    processQueue();
  }
});

// ─── Badge ───────────────────────────────────────────────────────────────────

function updateBadge() {
  const total = activeDownloads + downloadQueue.length;
  if (total > 0) {
    chrome.action.setBadgeText({ text: String(total) });
    chrome.action.setBadgeBackgroundColor({ color: "#e8323c" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// ─── Перехват аудио-запросов ─────────────────────────────────────────────────

chrome.webRequest.onBeforeRequest.addListener(
  details => {
    const { url, tabId, type } = details;
    const isAudio = /\.(mp3|m4a|aac|ogg|flac|opus)(\?|$)/i.test(url);
    const isCDN   = /okcdn\.ru|mycdn\.me|audio\.ok\.ru/i.test(url);
    if (!isAudio && !(type === "media" && isCDN)) return;
    if (capturedTracks[url]) return;

    capturedTracks[url] = { url, title: null, artist: null, tabId, ts: Date.now() };
    if (tabId > 0) {
      chrome.tabs.sendMessage(tabId, { type: "AUDIO_CAPTURED", url }).catch(() => {});
    }
  },
  { urls: ["<all_urls>"], types: ["media", "xmlhttprequest", "other"] }
);

// ─── Переопределение имени файла (обходит Content-Disposition CDN) ────────────

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  const desired = pendingFilenames[item.id];
  if (desired) {
    delete pendingFilenames[item.id];
    suggest({ filename: desired, conflictAction: "uniquify" });
  } else {
    suggest();
  }
});

// ─── Сообщения от content-script и popup ─────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {

  if (msg.type === "SET_TRACK_META") {
    if (capturedTracks[msg.url]) {
      capturedTracks[msg.url].title  = msg.title  || capturedTracks[msg.url].title;
      capturedTracks[msg.url].artist = msg.artist || capturedTracks[msg.url].artist;
    }
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === "GET_TRACKS") {
    sendResponse({ tracks: Object.values(capturedTracks) });
    return true;
  }

  if (msg.type === "CLEAR_TRACKS") {
    Object.keys(capturedTracks).forEach(k => delete capturedTracks[k]);
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === "DOWNLOAD_TRACKS") {
    getSettings().then(settings => {
      for (const track of msg.tracks) {
        enqueue(track, settings);
      }
    });
    sendResponse({ ok: true });
    return true;
  }
});

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function buildFilename(track, settings = DEFAULT_SETTINGS) {
  const fmt    = settings.filenameFormat || DEFAULT_SETTINGS.filenameFormat;
  const folder = (settings.subfolder || "").trim();
  const ext    = getExt(track.url);

  let base = fmt
    .replace("{artist}", track.artist || "")
    .replace("{title}",  track.title  || "")
    .trim();

  // Убираем ведущий/завершающий дефис если одно поле пустое ("- Название" → "Название")
  base = base.replace(/^[\s\-–]+|[\s\-–]+$/g, "").trim();

  if (!base) base = `track_${Date.now()}`;

  const name = sanitize(base).slice(0, 120) + ext;
  return folder ? `${sanitize(folder)}/${name}` : name;
}

function sanitize(name) {
  return name.replace(/[\\/:*?"<>|«»]/g, "_").replace(/\s+/g, " ").trim();
}

function getExt(url) {
  const m = url.match(/\.(mp3|m4a|aac|ogg|flac|opus)/i);
  return m ? `.${m[1].toLowerCase()}` : ".mp3";
}
