# OK Music Downloader

> Расширение для Chrome, которое позволяет массово скачивать музыку с Одноклассников прямо на страницах сайта.

[🇷🇺 Читать на русском](#русский) | [🇬🇧 Read in English](#english)

---

## Русский

### Что умеет расширение

- Показывает галочки рядом с каждым треком прямо на странице
- Автоматически перехватывает аудио-ссылки при воспроизведении
- Скачивает треки в формате `Исполнитель - Название.mp3`
- Работает на страницах профиля и страницах поиска (`ok.ru/music/search/...`)
- Поддерживает пакетное скачивание с настраиваемой очерёдностью
- Показывает счётчик треков на иконке расширения
- Гибкие настройки: шаблон имени файла, подпапка, кол-во одновременных загрузок

---

### Установка (вручную, без Chrome Web Store)

> Расширение ещё не опубликовано в магазине, поэтому устанавливается в режиме разработчика — это безопасно и просто.

1. **Скачайте расширение**

   Нажмите зелёную кнопку **Code → Download ZIP** на этой странице и распакуйте архив в любую папку на компьютере (например, `Документы/ok-music-downloader`).

2. **Откройте страницу расширений Chrome**

   В адресной строке браузера введите:
   ```
   chrome://extensions
   ```

3. **Включите режим разработчика**

   В правом верхнем углу страницы переключите тумблер **«Режим разработчика»**.

4. **Загрузите расширение**

   Нажмите кнопку **«Загрузить распакованное»** и выберите папку, в которую вы распаковали архив.

5. **Готово!**

   В панели Chrome появится иконка 🎵. Перейдите на сайт ok.ru — рядом с треками должны появиться галочки.

---

### Как пользоваться

#### Скачивание треков

1. Откройте страницу с музыкой на ok.ru:
   - Страница профиля: `ok.ru/dk?st.cmd=userMain&...` → вкладка «Музыка»
   - Поиск: `ok.ru/music/search/tracks/Название`

2. Рядом с каждым треком появится **галочка**. Отметьте нужные треки.

3. В плавающей панели внизу страницы нажмите **«⬇ Скачать выбранные»**.

4. Расширение автоматически:
   - Запустит каждый трек на долю секунды, чтобы перехватить ссылку
   - Поставит его в очередь на скачивание
   - Покажет прогресс в панели

5. Файлы появятся в папке загрузок Chrome в формате `Исполнитель - Название.mp3`.

#### Кнопки панели на странице

| Кнопка | Действие |
|--------|----------|
| Все | Отметить все треки |
| Снять | Снять все галочки |
| ⬇ Скачать выбранные | Начать скачивание отмеченных |

#### Попап расширения (иконка в панели Chrome)

Нажмите на иконку 🎵 в панели — откроется окошко со списком перехваченных треков и кнопками управления.

Нажмите **⚙** в шапке окошка, чтобы открыть настройки.

---

### Настройки

Нажмите иконку расширения → кнопку **⚙** в правом верхнем углу.

| Параметр | По умолчанию | Описание |
|----------|--------------|----------|
| Шаблон имени файла | `{artist} - {title}` | Переменные: `{artist}` — исполнитель, `{title}` — название |
| Подпапка в загрузках | *(пусто)* | Если указать, файлы сохранятся в подпапку внутри папки загрузок |
| Одновременных загрузок | `3` | Сколько файлов качать параллельно (от 1 до 10) |

---

### Часто задаваемые вопросы

**Галочки не появляются**
Попробуйте обновить страницу (F5). Если не помогает — проверьте, что расширение включено на странице `chrome://extensions`.

**Трек скачался без имени исполнителя**
Такое может быть, если ok.ru не передаёт информацию об исполнителе для этого трека. Имя файла будет содержать только название.

**Скачивание не начинается**
ok.ru может временно заблокировать быстрые запросы. Попробуйте уменьшить число одновременных загрузок в настройках до 1–2.

---

## English

### What it does

- Shows checkboxes next to every track directly on the page
- Automatically intercepts audio URLs when a track plays
- Downloads tracks as `Artist - Title.mp3`
- Works on profile music pages and search pages (`ok.ru/music/search/...`)
- Supports batch downloading with a configurable queue
- Shows a track counter badge on the extension icon
- Flexible settings: filename template, subfolder, concurrent downloads limit

---

### Installation (manual, without Chrome Web Store)

> The extension is not yet published in the store, so it's installed in Developer Mode — this is safe and straightforward.

1. **Download the extension**

   Click the green **Code → Download ZIP** button on this page and extract the archive to any folder on your computer (e.g., `Documents/ok-music-downloader`).

2. **Open Chrome Extensions page**

   Type this in the Chrome address bar:
   ```
   chrome://extensions
   ```

3. **Enable Developer Mode**

   Toggle the **"Developer mode"** switch in the top-right corner of the page.

4. **Load the extension**

   Click **"Load unpacked"** and select the folder where you extracted the archive.

5. **Done!**

   A 🎵 icon will appear in the Chrome toolbar. Go to ok.ru — checkboxes should appear next to the tracks.

---

### How to use

#### Downloading tracks

1. Open a music page on ok.ru:
   - Profile page: `ok.ru/...` → Music tab
   - Search: `ok.ru/music/search/tracks/Song+Name`

2. **Checkboxes** will appear next to each track. Check the ones you want.

3. In the floating panel at the bottom of the page, click **"⬇ Download selected"**.

4. The extension will automatically:
   - Play each track briefly to capture its audio URL
   - Queue it for download
   - Show progress in the panel

5. Files will appear in your Chrome downloads folder as `Artist - Title.mp3`.

#### Page panel buttons

| Button | Action |
|--------|--------|
| Все (All) | Select all tracks |
| Снять (None) | Deselect all |
| ⬇ Скачать выбранные | Start downloading selected tracks |

#### Extension popup (toolbar icon)

Click the 🎵 icon in the Chrome toolbar to open a popup with the list of captured tracks and download controls.

Click **⚙** in the popup header to open settings.

---

### Settings

Click the extension icon → **⚙** button in the top-right corner of the popup.

| Setting | Default | Description |
|---------|---------|-------------|
| Filename template | `{artist} - {title}` | Variables: `{artist}` — artist name, `{title}` — track title |
| Subfolder | *(empty)* | If set, files will be saved to a subfolder inside your downloads folder |
| Concurrent downloads | `3` | How many files to download in parallel (1–10) |

---

### Troubleshooting

**Checkboxes don't appear**
Try refreshing the page (F5). If that doesn't help, make sure the extension is enabled at `chrome://extensions`.

**Track downloaded without artist name**
This can happen if ok.ru doesn't provide artist info for that particular track. The filename will contain only the title.

**Downloads don't start**
ok.ru may temporarily throttle rapid requests. Try reducing the concurrent downloads setting to 1–2.

---

### License

MIT — free to use, modify, and distribute.
