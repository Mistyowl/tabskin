# Tabskin

**[English version](README.md)**

Tabskin — браузерное расширение, которое заменяет стандартную новую вкладку на спокойную минималистичную страницу с curated Unsplash-обоями, текущим временем, указанием автора изображения, локальными настройками, кэшированием и опциональной автоматической сменой фона.

В проект добавлен воспроизводимый build pipeline для расширения. Исходники остаются в корне проекта, а production-сборки генерируются отдельно для Chrome и Firefox.

## Возможности

- Минималистичная новая вкладка для Chromium-браузеров и Firefox.
- Темы Unsplash-обоев: wallpapers, nature, 3D render, texture, space, travel, film, people, architecture, street photography.
- Отображение текущего времени в 12-часовом и 24-часовом форматах.
- Ссылки на фотографа и страницу изображения для корректной атрибуции Unsplash.
- Локальные настройки языка, формата времени, темы, автосмены фона и плавных переходов.
- Кэширование изображений через Cache API для уменьшения сетевых запросов.
- Consent flow для Unsplash download location tracking.
- Локализация на русском и английском языках.
- Production-сборки с минифицированными JS/CSS и zip-архивами для магазинов.

## Структура проекта

```text
.
├── assets/
│   ├── icons/
│   ├── js/settings.js
│   └── sprite.svg
├── _locales/
│   ├── en/messages.json
│   └── ru/messages.json
├── scripts/
│   ├── build-extension.mjs
│   ├── generate-icons.mjs
│   └── validate-extension-assets.mjs
├── index.html
├── manifest.json
├── script.js
├── style.css
├── package.json
└── package-lock.json
```

Генерируемые директории:

- `dist/chrome/` — распакованная сборка расширения для Chrome.
- `dist/firefox/` — распакованная сборка расширения для Firefox.
- `artifacts/` — zip-архивы для публикации.

Папка `site/` относится к сайту проекта и не попадает в пакеты расширения. Файл `server.js` также исключён из пакетов расширения.

## Требования

- Node.js 20 или новее.
- npm.

## Установка зависимостей

```bash
npm install
```

## Команды сборки

Собрать production-пакеты для Chrome и Firefox:

```bash
npm run build
```

Собрать только Chrome:

```bash
npm run build:chrome
```

Собрать только Firefox:

```bash
npm run build:firefox
```

Проверить исходники расширения и сгенерированные пакеты:

```bash
npm run validate:extension
```

Перегенерировать PNG-иконки расширения:

```bash
npm run icons:generate
```

Development watch-сборки:

```bash
npm run dev:chrome
npm run dev:firefox
```

## Результат сборки

После `npm run build` создаются:

```text
dist/chrome/
dist/firefox/
artifacts/tabskin-chrome-v1.5.5.zip
artifacts/tabskin-firefox-v1.5.5.zip
```

Production-сборка:

- объединяет `script.js` и `assets/js/settings.js` в `app.js`;
- минифицирует JavaScript и CSS через esbuild;
- удаляет `console.*` и `debugger` из production JavaScript;
- генерирует отдельные manifest-файлы для Chrome и Firefox;
- копирует только нужные extension assets;
- исключает `site/`, `server.js`, build scripts, source-only файлы и локальные dev-файлы из release zip.

## Загрузка распакованной сборки

### Chrome

1. Выполните `npm run build:chrome`.
2. Откройте `chrome://extensions/`.
3. Включите режим разработчика.
4. Нажмите Load unpacked или Загрузить распакованное расширение.
5. Выберите `dist/chrome`.

### Firefox

1. Выполните `npm run build:firefox`.
2. Откройте `about:debugging#/runtime/this-firefox`.
3. Нажмите Load Temporary Add-on или Загрузить временное дополнение.
4. Выберите `dist/firefox/manifest.json`.

## Release-пакеты

Для загрузки в магазины используются:

- Chrome Web Store: `artifacts/tabskin-chrome-v1.5.5.zip`
- Firefox Add-ons: `artifacts/tabskin-firefox-v1.5.5.zip`

Перед публикацией выполните:

```bash
npm run validate:extension
npm run build
```

После этого вручную проверьте обе распакованные сборки.

## Чеклист ручной проверки

- Новая вкладка открывает Tabskin.
- Начальное изображение загружается или восстанавливается из кэша.
- Кнопка refresh загружает новое изображение.
- Consent modal появляется при необходимости и сохраняет согласие локально.
- Ссылки на автора и фото Unsplash открываются корректно.
- Settings modal открывается и закрывается.
- Настройки сохраняются.
- Переключение языка работает.
- 12-часовой и 24-часовой форматы времени работают.
- Auto-switch timer работает.
- Clear cache работает.
- В production console нет debug-логов, кроме реальных browser/network ошибок.

## Настройки расширения

Настройки сохраняются локально в браузере через `localStorage`.

Ключи хранилища сохранены для обратной совместимости:

- `userSettings`
- `lastImageUrl`
- `lastImageCreator`
- `lastImagePhotoLink`
- `lastImageCreatorLink`
- `lastImageLoadTime`
- `userConsentDownloadLocation`

## API endpoints

Расширение ожидает сервис изображений по адресам:

- `https://tabskin.ru/photos`
- `https://tabskin.ru/download`

Эти origin указаны в `manifest.json` через `host_permissions` и CSP.

## Заметки для разработки

- Не редактируйте файлы в `dist/` вручную. Они генерируются.
- Не добавляйте файлы сайта из `site/` в пакеты расширения.
- Различия Chrome и Firefox держите в генерации manifest, а не в двух ручных manifest-файлах.
- Если локальный asset указан в `manifest.json`, `index.html` или `style.css`, команда `npm run validate:extension` должна его находить.
- Production-сборки должны оставаться лёгкими: без лишних runtime-зависимостей и debug-логов.

## Лицензия

Tabskin поддерживается проектом Tabskin.
