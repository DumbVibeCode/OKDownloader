// content.js — внедряется на страницы ok.ru
(function () {
  "use strict";

  const tracks = [];          // Все найденные треки
  const elToTrack = new WeakMap(); // DOM-карточка → объект трека
  let trackIdCounter = 0;
  let panel = null;
  let currentCapture = null;  // { track, resolve } — текущий захват URL

  // ─── СЕЛЕКТОРЫ ───────────────────────────────────────────────────────────

  // Карточки треков
  const CARD_SELECTORS = [
    ".track-with-cover",              // профиль/группа (подтверждён)
    "wm-track[data-tsid='track']",    // поиск: Web Component (подтверждён)
    "wm-track",
    "[data-l='t,track']",
    ".music-card",
    "[class*='music-card']"
  ];

  // Кнопки Play внутри карточки
  const PLAY_BTN_SELECTORS = [
    "[data-l='t,play']",              // профиль (подтверждён)
    ".music-play.js-play",
    ".js-play",
    "[class*='music-play']"
  ];

  // Элемент с названием трека (для старой разметки)
  const TITLE_SELECTORS = [
    ".track-with-cover_name",         // профиль (подтверждён)
    "[class*='_name']",
    "[class*='title']"
  ];

  // Элемент с исполнителем
  const ARTIST_SELECTORS = [
    "[data-l='t,artist']",            // поиск — Web Component (подтверждён)
    ".track-with-cover_artist",       // профиль/группа (подтверждён)
    "[class*='_artist']",
    "[class*='performer']"
  ];

  function findIn(container, selectors) {
    for (const sel of selectors) {
      try {
        const el = container.querySelector(sel);
        if (el && el.textContent.trim()) return el;
      } catch (_) {}
    }
    return null;
  }

  // ─── СОЗДАНИЕ ОБЪЕКТА ТРЕКА ──────────────────────────────────────────────

  function createTrack(cardEl) {
    if (elToTrack.has(cardEl)) return null; // уже обработан

    let title = null;
    let artist = null;

    // ── Новая разметка (поиск): <button data-l="t,title" data-payload='{"artistName":"..."}'>
    const titleBtn = cardEl.querySelector("[data-l='t,title'], [data-tsid='track_name']");
    if (titleBtn) {
      title = titleBtn.textContent.trim() || null;
      // data-payload может быть JSON {"artistName":"..."} или строкой "artistName=..."
      const raw = titleBtn.dataset.payload || "";
      if (raw) {
        try {
          artist = JSON.parse(raw).artistName || null;
        } catch (_) {
          const m = raw.match(/artistName=([^&]+)/);
          if (m) artist = decodeURIComponent(m[1]).trim() || null;
        }
      }
    }

    // ── Старая разметка (профиль/группа): отдельные элементы с классами
    if (!title) {
      const titleEl = findIn(cardEl, TITLE_SELECTORS);
      if (titleEl) title = titleEl.textContent.trim() || null;
    }
    if (!artist) {
      const artistEl = findIn(cardEl, ARTIST_SELECTORS);
      if (artistEl) artist = artistEl.textContent.trim() || null;
    }

    // Не создаём трек для пустых/нерелевантных элементов
    if (!title && !artist) return null;

    const track = {
      id:      `okdl_${trackIdCounter++}`,
      el:      cardEl,
      title,
      artist,
      url:     null,
      checked: false,
      cbEl:    null
    };

    elToTrack.set(cardEl, track);
    tracks.push(track);
    return track;
  }

  // ─── ЧЕКБОКСЫ ────────────────────────────────────────────────────────────

  function addCheckbox(track) {
    if (track.el.dataset.okdlDone) return;
    track.el.dataset.okdlDone = "1";

    const wrapper = document.createElement("label");
    wrapper.className = "okdl-cb-wrapper";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "okdl-cb";
    cb.checked = track.checked;
    cb.title = [track.artist, track.title].filter(Boolean).join(" — ") || "Выбрать";

    cb.addEventListener("change", () => {
      track.checked = cb.checked;
      updatePanel();
    });
    // Не открываем плеер при клике на чекбокс
    wrapper.addEventListener("click",  e => e.stopPropagation());
    wrapper.addEventListener("mousedown", e => e.stopPropagation());

    wrapper.appendChild(cb);
    track.cbEl = cb;

    track.el.insertBefore(wrapper, track.el.firstChild);
  }

  // ─── ПАНЕЛЬ УПРАВЛЕНИЯ ───────────────────────────────────────────────────

  function ensurePanel() {
    if (panel) return;
    panel = document.createElement("div");
    panel.id = "okdl-panel";
    panel.innerHTML = `
      <div id="okdl-top">
        <span id="okdl-count">0 / 0</span>
        <span id="okdl-progress" style="display:none"></span>
      </div>
      <div id="okdl-btns">
        <button id="okdl-btn-all">Все</button>
        <button id="okdl-btn-none">Снять</button>
        <button id="okdl-btn-dl">⬇ Скачать выбранные</button>
      </div>
    `;
    document.body.appendChild(panel);

    panel.querySelector("#okdl-btn-all").addEventListener("click", () => {
      tracks.forEach(t => { t.checked = true; if (t.cbEl) t.cbEl.checked = true; });
      updatePanel();
    });
    panel.querySelector("#okdl-btn-none").addEventListener("click", () => {
      tracks.forEach(t => { t.checked = false; if (t.cbEl) t.cbEl.checked = false; });
      updatePanel();
    });
    panel.querySelector("#okdl-btn-dl").addEventListener("click", startAutoDownload);
  }

  function updatePanel() {
    const countEl = document.getElementById("okdl-count");
    if (!countEl) return;
    const sel = tracks.filter(t => t.checked).length;
    countEl.textContent = `${sel} / ${tracks.length}`;
  }

  function setProgress(text) {
    const el = document.getElementById("okdl-progress");
    if (!el) return;
    el.style.display = text ? "" : "none";
    el.textContent = text;
  }

  function setDlBtn(enabled, text) {
    const btn = document.getElementById("okdl-btn-dl");
    if (!btn) return;
    btn.disabled = !enabled;
    btn.textContent = text;
  }

  // ─── СКАНИРОВАНИЕ СТРАНИЦЫ ───────────────────────────────────────────────

  function scanCards() {
    let anyAdded = false;
    for (const sel of CARD_SELECTORS) {
      try {
        document.querySelectorAll(sel).forEach(el => {
          if (el.dataset.okdlDone) return;
          const track = createTrack(el);
          if (track) { addCheckbox(track); anyAdded = true; }
        });
      } catch (_) {}
    }

    // ── Страница поиска: wm-card-details использует Shadow DOM, поэтому
    //    querySelector изнутри wm-track до кнопки не достаёт.
    //    Ищем кнопки глобально и идём вверх до wm-track через closest().
    document.querySelectorAll("[data-l='t,title']").forEach(btn => {
      const cardEl = btn.closest("wm-track") ||
                     btn.closest("[data-tsid='track']") ||
                     btn.closest("[data-l='t,track']");
      if (!cardEl || cardEl.dataset.okdlDone) return;

      let title = btn.textContent.trim() || null;
      let artist = null;
      const raw = btn.dataset.payload || "";
      if (raw) {
        try { artist = JSON.parse(raw).artistName || null; }
        catch (_) { const m = raw.match(/artistName=([^&]+)/); if (m) artist = decodeURIComponent(m[1]).trim() || null; }
      }

      if (!title && !artist) return;

      // Создаём трек напрямую (не через createTrack, т.к. metadata уже есть)
      if (elToTrack.has(cardEl)) {
        // Карточка уже есть, но без метаданных — обновляем
        const existing = elToTrack.get(cardEl);
        if (!existing.title)  existing.title  = title;
        if (!existing.artist) existing.artist = artist;
        if (existing.cbEl) existing.cbEl.title = [artist, title].filter(Boolean).join(" — ");
        return;
      }

      const track = {
        id: `okdl_${trackIdCounter++}`, el: cardEl,
        title, artist, url: null, checked: false, cbEl: null
      };
      elToTrack.set(cardEl, track);
      tracks.push(track);
      addCheckbox(track);
      anyAdded = true;
    });

    if (anyAdded) { ensurePanel(); updatePanel(); }
  }

  // ─── AUTO-PLAY → CAPTURE ─────────────────────────────────────────────────

  function findPlayBtn(cardEl) {
    for (const sel of PLAY_BTN_SELECTORS) {
      try {
        const btn = cardEl.querySelector(sel);
        if (btn) return btn;
      } catch (_) {}
    }
    return null;
  }

  function clickPlay(cardEl) {
    const btn = findPlayBtn(cardEl);
    (btn || cardEl).click();
  }

  function pauseAudio() {
    // Прямой доступ к audio-элементу (самый надёжный способ)
    const audio = document.querySelector("audio");
    if (audio && !audio.paused) { audio.pause(); return; }
    // Fallback — кнопка паузы в плеере
    const pauseBtn = document.querySelector(
      "[class*='pause'], [aria-label*='ause'], [data-l*='pause']"
    );
    if (pauseBtn) pauseBtn.click();
  }

  // Запускает трек, ждёт захвата URL (или таймаут 5 сек), потом ставит паузу
  function captureTrackUrl(track) {
    return new Promise(resolve => {
      if (track.url) { resolve(track.url); return; }

      let done = false;
      const finish = url => {
        if (done) return;
        done = true;
        currentCapture = null;
        // Небольшая задержка перед паузой, чтобы успел загрузиться запрос
        setTimeout(pauseAudio, 600);
        resolve(url);
      };

      const timeout = setTimeout(() => finish(null), 5000);

      currentCapture = {
        track,
        resolve(url) {
          clearTimeout(timeout);
          finish(url);
        }
      };

      clickPlay(track.el);
    });
  }

  async function startAutoDownload() {
    const selected = tracks.filter(t => t.checked);
    if (!selected.length) {
      alert("Не выбрано ни одного трека.");
      return;
    }

    setDlBtn(false, "⏳ Обработка...");

    const needCapture = selected.filter(t => !t.url);

    for (let i = 0; i < needCapture.length; i++) {
      const t = needCapture[i];
      const label = [t.artist, t.title].filter(Boolean).join(" — ") || `трек ${i + 1}`;
      setProgress(`${i + 1} / ${needCapture.length}: ${label}`);
      await captureTrackUrl(t);
      await sleep(400); // пауза между треками
    }

    setProgress("");

    // Отправляем только сериализуемые поля (el, cbEl — DOM-узлы, они не клонируются)
    const toDownload = selected
      .filter(t => t.url)
      .map(({ id, title, artist, url }) => ({ id, title, artist, url }));
    if (toDownload.length) {
      chrome.runtime.sendMessage({ type: "DOWNLOAD_TRACKS", tracks: toDownload });
    }

    const skipped = selected.length - toDownload.length;
    setDlBtn(true, "⬇ Скачать выбранные");

    if (skipped > 0) {
      alert(`Запущено: ${toDownload.length}\nПропущено (URL не захвачен): ${skipped}`);
    }
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ─── СООБЩЕНИЯ ОТ BACKGROUND ─────────────────────────────────────────────

  chrome.runtime.onMessage.addListener(msg => {
    if (msg.type !== "AUDIO_CAPTURED") return;
    const url = msg.url;

    if (currentCapture) {
      const track = currentCapture.track;
      track.url = url;

      // Передаём в background итоговые метаданные
      chrome.runtime.sendMessage({
        type: "SET_TRACK_META",
        url,
        title:  track.title,
        artist: track.artist
      }).catch(() => {});

      // Визуально помечаем чекбокс как «захвачен»
      if (track.cbEl) {
        track.cbEl.closest(".okdl-cb-wrapper")?.classList.add("okdl-captured");
      }

      currentCapture.resolve(url);
    }
  });

  // ─── MUTATION OBSERVER ───────────────────────────────────────────────────

  new MutationObserver(scanCards)
    .observe(document.body, { childList: true, subtree: true });

  // ─── INIT ────────────────────────────────────────────────────────────────

  function init() {
    scanCards();
    setInterval(scanCards, 2500); // SPA-навигация
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();
