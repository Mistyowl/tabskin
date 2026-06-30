<div align="center">

<img src="assets/icons/icon_128x128.png" alt="Логотип Tabskin" width="88" height="88">

# Tabskin

**Спокойная минималистичная новая вкладка с обоями Unsplash**

[![Сайт](https://img.shields.io/badge/сайт-tabskin.ru-181825?style=for-the-badge)](https://tabskin.ru)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/phpikmllcahonchladgmhcphhhebncmp)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox-Add--ons-FF7139?style=for-the-badge&logo=firefox&logoColor=white)](https://addons.mozilla.org/addon/tabskin)
[![GitHub](https://img.shields.io/badge/GitHub-Mistyowl%2Ftabskin-181717?style=for-the-badge&logo=github)](https://github.com/Mistyowl/tabskin)

[![Версия](https://img.shields.io/badge/версия-1.1.0-5c6bc0?style=flat-square)](manifest.json)
[![Manifest](https://img.shields.io/badge/Manifest-V3-34a853?style=flat-square)](manifest.json)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white)](package.json)
[![Звёзды GitHub](https://img.shields.io/github/stars/Mistyowl/tabskin?style=flat-square&logo=github)](https://github.com/Mistyowl/tabskin/stargazers)
[![Языки](https://img.shields.io/badge/языки-RU%20%7C%20EN-5c6bc0?style=flat-square)](_locales/)

**[English version](README.md)** · [История обновлений](Update.ru.md)

</div>

---

Tabskin — браузерное расширение, которое заменяет стандартную новую вкладку на спокойную минималистичную страницу с curated Unsplash-обоями, текущим временем, указанием автора изображения, локальными настройками, кэшированием и опциональной автоматической сменой фона.

Репозиторий содержит три связанных компонента:

1. **Расширение** — исходники в корне проекта, production-сборки в `dist/` и `artifacts/`
2. **Сайт** — маркетинговый сайт [tabskin.ru](https://tabskin.ru) в папке `site/`
3. **API-сервер** — прокси к Unsplash в `server.js`

## Возможности

- Минималистичная новая вкладка для Chromium-браузеров и Firefox
- Темы Unsplash-обоев: wallpapers, nature, 3D render, texture, space, travel, film, people, architecture, street photography
- Отображение текущего времени в 12-часовом и 24-часовом форматах
- Закрепление фона (pin) для сохранения любимого изображения между сессиями
- Режим производительности (performance mode) с оптимизированным размером изображений
- Ссылки на фотографа и страницу изображения для корректной атрибуции Unsplash
- Локальные настройки языка, формата времени, темы, автосмены фона и плавных переходов
- Кэширование изображений через Cache API для уменьшения сетевых запросов
- Consent flow для Unsplash download location tracking (доступное модальное окно с focus trap)
- Локализация на русском и английском языках
- Production-сборки с минифицированными JS/CSS и zip-архивами для магазинов
- Двуязычный маркетинговый сайт с блогом, FAQ, инструкциями по установке и SEO pipeline

## Быстрый старт

```bash
npm install
npm run build          # расширение → dist/ и artifacts/
npm run build:site     # вставка SEO head-разметки в site/*.html
npm run validate:extension
npm run validate:site
```

## Структура проекта

```text
.
├── assets/
│   ├── icons/              # PNG-иконки + SVG-спрайты UI
│   ├── js/settings.js      # модуль SettingsManager
│   └── sprite.svg
├── _locales/
│   ├── en/messages.json
│   └── ru/messages.json
├── docs/                   # подробная документация (см. ссылки ниже)
├── scripts/
│   ├── build-extension.mjs
│   ├── build-site.mjs
│   ├── generate-icons.mjs
│   ├── migrate-site-head.mjs
│   ├── validate-extension-assets.mjs
│   ├── validate-site-seo.mjs
│   └── lib/                # хелперы SEO-сборки сайта
├── site/
│   ├── blog/               # статьи блога RU + feed.xml
│   ├── en/                 # английское зеркало (/, /blog/, /faq/, …)
│   ├── install/            # инструкции для Chrome и Firefox
│   ├── seo/
│   │   ├── pages.json      # мета, schema, конфиг sitemap
│   │   ├── audit.md
│   │   └── post-deploy.md
│   ├── templates/
│   ├── index.html
│   ├── styles.css
│   └── sitemap.xml
├── index.html              # страница новой вкладки расширения
├── manifest.json
├── script.js
├── style.css
├── server.js               # прокси Unsplash API (не входит в пакеты расширения)
├── package.json
└── package-lock.json
```

Генерируемые директории (в `.gitignore`):

- `dist/chrome/` — распакованная сборка расширения для Chrome
- `dist/firefox/` — распакованная сборка расширения для Firefox
- `artifacts/` — zip-архивы для публикации в магазинах

## Документация

| Тема | English | Русский |
|------|---------|---------|
| Архитектура расширения и сборка | [docs/EXTENSION.md](docs/EXTENSION.md) | [docs/EXTENSION.ru.md](docs/EXTENSION.ru.md) |
| Сайт и SEO pipeline | [docs/SITE.md](docs/SITE.md) | [docs/SITE.ru.md](docs/SITE.ru.md) |
| API-сервер и деплой | [docs/SERVER.md](docs/SERVER.md) | [docs/SERVER.ru.md](docs/SERVER.ru.md) |
| История изменений | [Update.md](Update.md) | [Update.ru.md](Update.ru.md) |

## Требования

- Node.js 20 или новее
- npm

## Расширение

Собрать production-пакеты для Chrome и Firefox:

```bash
npm run build
npm run build:chrome
npm run build:firefox
```

Development watch-сборки:

```bash
npm run dev:chrome
npm run dev:firefox
```

Проверить исходники и сгенерированные пакеты:

```bash
npm run validate:extension
```

Перегенерировать PNG-иконки расширения:

```bash
npm run icons:generate
```

После `npm run build` артефакты используют версию из `manifest.json` (сейчас `1.1.0`):

```text
dist/chrome/
dist/firefox/
artifacts/tabskin-chrome-v1.1.0.zip
artifacts/tabskin-firefox-v1.1.0.zip
```

Production-сборка объединяет `script.js` и `assets/js/settings.js` в `app.js`, минифицирует через esbuild, удаляет `console.*` и `debugger`, генерирует отдельные manifest-файлы и исключает `site/`, `server.js` и build scripts из release zip.

Сборки Firefox добавляют `browser_specific_settings.gecko.id: tabskin@tabskin.ru`.

Подробнее: [docs/EXTENSION.ru.md](docs/EXTENSION.ru.md)

### Загрузка распакованной сборки

**Chrome:** `chrome://extensions/` → режим разработчика → Загрузить распакованное → `dist/chrome`

**Firefox:** `about:debugging#/runtime/this-firefox` → Загрузить временное дополнение → `dist/firefox/manifest.json`

## Сайт

Папка `site/` относится к маркетинговому сайту и **не попадает** в пакеты расширения.

```bash
npm run build:demo-embed # UI расширения → site/demo/embed/ (также в build:site)
npm run build:site      # demo embed + вставка head из site/seo/pages.json
npm run validate:site   # проверка SEO-тегов, hreflang, sitemap
npm run migrate:site-head   # сброс head в HTML к маркеру <!-- @head -->
```

Чеклист после деплоя: [site/seo/post-deploy.md](site/seo/post-deploy.md)

Подробнее: [docs/SITE.ru.md](docs/SITE.ru.md)

## API-сервер

Расширение запрашивает обои по адресам:

- `https://tabskin.ru/photos`
- `https://tabskin.ru/download`

Эти origin указаны в `manifest.json` через `host_permissions` и CSP.

Локальный запуск (нужен `.env` — скопируйте из `.env.example`):

```bash
node server.js
```

Подробнее: [docs/SERVER.ru.md](docs/SERVER.ru.md)

## Версионирование

В репозитории используются две схемы версий:

| Схема | Пример | Назначение |
|-------|--------|------------|
| Версия в `manifest.json` | `1.1.0` | Chrome Web Store / Firefox Add-ons, zip-артефакты |
| Метки коммитов | `Update 1.6.1` | Внутренние milestone-метки в git-истории |

Store-версия сброшена на `1.1.0` в **Update 1.5.8** для публикации; последующие коммиты `Update 1.5.x` / `1.6.x` — это метки разработки, а не версии магазина.

Полная история: [Update.ru.md](Update.ru.md)

## Release-пакеты

Для загрузки в магазины:

- Chrome Web Store: `artifacts/tabskin-chrome-v1.1.0.zip`
- Firefox Add-ons: `artifacts/tabskin-firefox-v1.1.0.zip`

Перед публикацией:

```bash
npm run validate:extension
npm run build
```

После этого вручную проверьте обе распакованные сборки.

## Чеклист ручной проверки

- Новая вкладка открывает Tabskin
- Начальное изображение загружается или восстанавливается из кэша
- Кнопка refresh загружает новое изображение
- Кнопка pin закрепляет и открепляет текущий фон
- Consent modal появляется при необходимости, доступен с клавиатуры и сохраняет согласие локально
- Ссылки на автора и фото Unsplash открываются корректно (с UTM-метками)
- Settings modal открывается и закрывается с focus trap
- Настройки сохраняются (язык, формат времени, тема, автосмена, переходы, performance mode)
- Переключение языка работает
- 12-часовой и 24-часовой форматы времени работают
- Auto-switch timer работает (минимум 15 минут)
- Clear cache работает
- В production console нет debug-логов, кроме реальных browser/network ошибок

## Настройки расширения

Настройки сохраняются локально в браузере через `localStorage`. Ключи сохранены для обратной совместимости:

- `userSettings`
- `lastImageUrl`, `lastImageCreator`, `lastImagePhotoLink`, `lastImageCreatorLink`, `lastImageLoadTime`
- `userConsentDownloadLocation`
- `pinnedImage`
- `backgroundImageCacheIndex`

## Заметки для разработки

- Не редактируйте файлы в `dist/` вручную — они генерируются
- Не добавляйте файлы сайта из `site/` в пакеты расширения
- Различия Chrome и Firefox держите в генерации manifest в `scripts/build-extension.mjs`
- Если локальный asset указан в `manifest.json`, `index.html` или `style.css`, `npm run validate:extension` должен его находить
- SEO страниц редактируйте в `site/seo/pages.json`, затем запускайте `npm run build:site`
- Production-сборки должны оставаться лёгкими: без лишних runtime-зависимостей и debug-логов

## Лицензия

Tabskin поддерживается проектом Tabskin.
