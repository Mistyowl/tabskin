# История обновлений Tabskin

**[English version](Update.md)**

В этом файле задокументирована история проекта, восстановленная из git-коммитов. Основной источник — сообщения коммитов; подробные описания выведены из diff.

## Нумерация версий

В репозитории используются две схемы:

| Схема | Пример | Назначение |
|-------|--------|------------|
| Версия в `manifest.json` | `1.1.0` | Chrome Web Store / Firefox Add-ons, имена zip-артефактов |
| Метки git-коммитов | `Update 1.6.1` | Внутренние milestone-метки разработки |

Начиная с **Update 1.5.8**, store-версия в `manifest.json` сброшена на `1.1.0` для публикации. Последующие метки `Update 1.5.x` / `1.6.x` — это названия этапов, а не версии магазина.

Чтобы найти коммит по метке: `git log --oneline --grep="Update 1.6.4"`.

---

## Update 1.6.4 — 2026-07-01

**версия manifest:** `1.1.0` → `1.1.1`

### Расширение

- **Разметка модального окна настроек перенесена в `index.html`** — UI настроек в `<template id="settingsModalTemplate">`; `SettingsManager.loadSettingsHTML()` клонирует template вместо большой HTML-строки в `settings.js` (понятнее для AMO, единый источник разметки)
- **Сборка consent modal через DOM API** — `createConsentModal()` создаёт диалог через `createElement` / `textContent` вместо `innerHTML`
- **Соответствие Firefox data collection** — `hasDownloadTrackingConsent()` проверяет в Firefox 140+ `browser.permissions.getAll()` на optional `data_collection.technicalAndInteraction` в дополнение к флагу согласия в расширении; `trackDownloadLocation()` стал `async` и ждёт проверку перед `POST /download`
- **Исправление UTM для Unsplash** — `addUnsplashUtm()` добавляет `&utm_…`, если в URL уже есть query-параметры; новый хелпер `enrichImageMetadata()`; `saveImageMetadata()` возвращает обогащённые ссылки; `applyMetadataToDom()` всегда применяет UTM при отображении (исправляет старые сохранённые ссылки)

### Сборка / инфраструктура

- **Bump store-версии** — `manifest.json` и `package.json` → `1.1.1`
- **Обновления Firefox manifest** в `scripts/build-extension.mjs`:
  - `gecko.id`: `tabskin@tabskin.ru` → `tabskinapp@gmail.com`
  - `strict_min_version`: `109.0` → `140.0`
  - Добавлен `gecko_android.strict_min_version: 142.0`
  - Добавлен `data_collection_permissions`: required `none`, optional `technicalAndInteraction`
- Добавлен **`scripts/build-firefox-source.mjs`** и npm-скрипт **`build:firefox-source`** — zip читаемых исходников + `SOURCE_CODE_README.md` для проверки исходного кода на AMO (`artifacts/tabskin-firefox-source-v{version}.zip`)
- Добавлен **`scripts/minify-for-production.mjs`** — общие хелперы минификации HTML/CSS/template literal/JS
- **`build-demo-embed.mjs`** переведён на общий minify-модуль; предминификация JS перед esbuild; минификация итогового embed HTML

### Документация

- **README.md** / **README.ru.md** — обновлён Firefox `gecko.id`, описан `build:firefox-source` и загрузка source-архива в AMO
- **docs/EXTENSION.md** / **docs/EXTENSION.ru.md** — схема Firefox manifest и data collection permissions
- Добавлен **SOURCE_CODE_README.md** — пошаговая инструкция для ревьюеров AMO по воспроизведению Firefox production zip

---

## Update 1.6.3 — 2026-06-30

**версия manifest:** `1.1.0`

### Расширение

- **Редизайн модального окна настроек** — тёмный групповой layout в стиле iOS: заголовки секций, строки в `settings-group-card`, системный шрифт, зелёные переключатели
- **Кастомные выпадающие списки** — тема обоев и интервал автосмены через `settings-picker` (скрытый нативный `<select>` + кнопка-триггер + меню в portal с переворотом вверх, закрытие по клику снаружи и Escape)
- **Упрощённый футер настроек** — убрана кнопка «Закрыть»; одна кнопка **«Готово»** сохраняет и закрывает; очистка кэша — на всю ширину в отдельной карточке; размер кэша — статическая строка только для чтения
- **Полировка подписей** — убраны двоеточия, короче подписи формата времени (`24 часа` / `12 часов`), переключатель производительности переименован в «Оптимальный размер изображения»
- **Режим demo embed** в `script.js` — определяется по `?embed=1` или пути `/demo/embed/`; изолированные ключи `localStorage` (`demo_*`), отдельный namespace Cache API, язык по умолчанию из `?lang=ru|en`, дополнительная пометка в consent modal для демо на сайте

### Сайт

- Добавлены **интерактивные страницы демо** (`/demo/`, `/en/demo/`): iframe с живым UI, галерея скриншотов, CTA установки, двуязычный SEO head и breadcrumbs
- Ссылка **«Демо»** в шапке главной ведёт на `/demo/` вместо `#preview`; единая навигация на всех внутренних страницах (Демо + FAQ там, где не хватало)
- **Стили сайта** для демо: `.demo-live`, `.demo-frame`, ссылка на полный экран; `.content-page--gallery` для галереи; max-width на контейнере content-page; кнопки установки в статьях/CTA без подчёркивания ссылок
- Обновлены `site/seo/pages.json`, `sitemap.xml` и `site/seo/post-deploy.md` — URL демо и чеклист после деплоя

### Сборка / инфраструктура

- Добавлен **`scripts/build-demo-embed.mjs`** — сборка UI расширения в `site/demo/embed/` (esbuild minify, один `app.js`, копирование assets, патч `noindex` + `<base>` + `?lang=`)
- Новый npm-скрипт **`build:demo-embed`**; **`build:site`** сначала собирает demo embed, затем вставляет SEO head
- `site/demo/embed/` добавлен в **`.gitignore`** (генерируемый вывод)

### Документация

- **README.md** / **README.ru.md** — описан `build:demo-embed` и обновлено описание `build:site`
- **docs/SITE.md** / **docs/SITE.ru.md** и **docs/SERVER.md** / **docs/SERVER.ru.md** — шаги деплоя упоминают сборку demo embed

---

## Update 1.6.2 — 2026-06-30

**версия manifest:** `1.1.0`

### Документация

- Расширены **README.md** и **README.ru.md**: обзор трёх компонентов (расширение, сайт, сервер), полная структура репозитория, быстрый старт, версионирование, расширенный чеклист тестирования, ссылки на подробные гайды
- Добавлена центрированная шапка README с логотипом и шилдиками (сайт, Chrome Web Store, Firefox Add-ons, GitHub, версия, Manifest V3, Node.js, звёзды, языки)
- Создана папка **docs/** с двуязычными руководствами:
  - `docs/EXTENSION.md` / `docs/EXTENSION.ru.md` — архитектура расширения, ключи хранилища, build pipeline
  - `docs/SITE.md` / `docs/SITE.ru.md` — SEO pipeline, `pages.json`, команды сборки сайта
  - `docs/SERVER.md` / `docs/SERVER.ru.md` — API-маршруты, деплой, переменные окружения
- Созданы **Update.md** и **Update.ru.md** — полная история проекта по git-коммитам (Update и вехи)
- Добавлен **`.env.example`** — шаблон конфигурации сервера (`UNSPLASH_KEY`, прокси, TTL кэша)

### Сайт

- Убран **Microsoft Edge** из маркетинга: список браузеров на главной, карточка установки, тексты privacy и строки в `translations.js`
- Переведены assets и скрипты на **корневые пути** (`/assets/...`, `/translations.js`) — корректная загрузка на вложенных URL
- Относительные ссылки на главную (`index.html`) заменены на `/`
- Добавлен `rel="noopener noreferrer"` на ссылки Chrome Web Store и Firefox Add-ons
- Переработаны **страницы privacy** (RU/EN) под общий layout `content-page`: навигация в шапке, хлебные крошки, структура `content-article`
- Крупная полировка **styles.css** для контентных страниц: статьи, FAQ, карточки блога, CTA, pill-ссылки, `kbd`, мобильные отступы
- Добавлена недостающая заметка после блока установки на **английской главной**
- Доступность на внутренних страницах: `aria-label` у breadcrumbs и навигации (блог, FAQ, install, alternatives)
- Мелкие обновления timestamp в RSS-лентах

### Сервер / инфраструктура

- **Упрощена модель деплоя**: убран встроенный HTTPS-сервер (Let's Encrypt на порту 443) и HTTP→HTTPS редирект на порту 80; Node слушает `HOST` + `PORT` (по умолчанию `127.0.0.1:3000`) за nginx
- Добавлена поддержка **SOCKS5-прокси** для запросов к Unsplash (`USE_PROXY`, `PROXY_HOST`, `PROXY_PORT`, учётные данные)
- Таймауты fetch 30 с и `User-Agent: TabSkin/1.0` на `/photos` и `/download`
- Прокси на маршруте `/download`
- Убраны лишние комментарии и отладочное логирование статики
- Улучшена обработка ошибок `sendFile` (проверка `!res.headersSent`)

---

## Update 1.6.1 — 2026-06-30

**версия manifest:** `1.1.0`

### Сайт

- Добавлен SEO build pipeline: `npm run build:site`, `validate:site`, `migrate:site-head`
- Создан `site/seo/pages.json` — центральный реестр метаданных страниц
- Добавлены `scripts/lib/render-head.mjs`, `render-schema.mjs`, `build-site-lib.mjs`
- JSON-LD-схемы (SoftwareApplication, WebSite, FAQPage, HowTo, Article, BreadcrumbList) на всех страницах
- RSS-ленты: `site/blog/feed.xml`, `site/en/blog/feed.xml`
- Новые статьи блога: `minimalistichnaya-novaya-vkladka`, `best-new-tab-wallpapers`
- Расширена SEO head-разметка на всех существующих страницах
- Добавлены `site/seo/audit.md` и `site/seo/post-deploy.md`
- Обновлён sitemap с hreflang и новыми URL

### Сервер / инфраструктура

- Небольшая правка `server.js` (раздача статики)

---

## Update 1.6.0 — 2026-06-30

**версия manifest:** `1.1.0`

### Сайт

- Запущена многостраничная двуязычная структура (зеркала RU + EN)
- Добавлены страницы: FAQ, инструкции Chrome/Firefox, сравнение альтернатив, индекс блога и статьи
- Расширена главная: CTA установки и блоки возможностей
- Добавлен `site/seo-keywords.json` для отслеживания кластеров ключевых слов
- Пересобран `sitemap.xml` с hreflang alternates для всех новых URL
- Обновлён `robots.txt` под расширенную структуру сайта
- Расширены `site/styles.css` и `site/translations.js`

---

## Update 1.5.9 — 2026-05-27

**версия manifest:** `1.1.0`

### Расширение

- Мелкие UI/UX-правки в модуле настроек и stylesheet
- Небольшие изменения в основном скрипте

---

## Update 1.5.8 — 2026-05-13

**версия manifest:** `1.5.5` → `1.1.0`

### Расширение

- **Закрепление фона (pin)** — сохранение любимых обоев между сессиями (`pinnedImage`, кнопка pin)
- **Режим производительности (performance mode)** — настройка оптимизированного размера изображений
- Улучшенный кэш изображений с `backgroundImageCacheIndex` и расширенным управлением кэшем
- Улучшенный consent modal с focus trap и доступностью с клавиатуры
- Рефакторинг загрузки настроек: нормализация и кэширование чтений
- Крупный рефакторинг `script.js`: дедупликация запросов, форматтер часов, улучшенная обработка ошибок
- Восстановлены полноразмерные иконки расширения
- Обновлён `SettingsManager`: переключатель performance mode и улучшения UI
- Большое обновление `style.css`: кнопка pin, consent modal, полировка вёрстки

### Сборка / инфраструктура

- Правки build-скрипта под новые assets (`pin_icon.svg`)
- Обновление версии в `package.json`

---

## Update 1.5.7 — 2026-05-12

**версия manifest:** `1.5.5`

### Расширение

- Мелкие правки в `script.js` и `settings.js`
- Оптимизированы PNG-иконки расширения (меньший размер файлов)
- Небольшие обновления `index.html` и `style.css`

### Сборка / инфраструктура

- **Воспроизводимый build pipeline** с `package.json` и npm-скриптами
- Добавлен `scripts/build-extension.mjs` (esbuild bundle, minify, zip-артефакты)
- Добавлены `scripts/validate-extension-assets.mjs` и `scripts/generate-icons.mjs`
- Выходные данные: `dist/chrome/`, `dist/firefox/`, `artifacts/*.zip`
- Обновлены README.md и README.ru.md с документацией по сборке
- `dist/` и `artifacts/` добавлены в `.gitignore`

---

## Update 1.5.6 — 2026-05-12

**версия manifest:** `1.5.5`

### Сайт

- Крупный редизайн главной страницы и стилей сайта
- Добавлена `site/uninstall.html` — страница обратной связи при удалении (`noindex`)
- Рефакторинг `site/script.js` и `site/translations.js`
- Обновлена вёрстка страницы privacy
- Улучшения sitemap и структуры контента

---

## Released 1.0 — 2025-08-26

**версия manifest:** `1.5.5`

### Расширение

- **Публичный релиз** — API переведён на стандартные HTTPS-пути без порта:
  - `https://tabskin.ru/photos`
  - `https://tabskin.ru/download`
- Добавлено **модальное окно согласия** на Unsplash download location tracking
- Download tracking срабатывает только после согласия пользователя
- Удалён permission `storage` из manifest
- Рефакторинг stylesheet расширения

### Сайт

- **Первый публичный маркетинговый сайт** tabskin.ru
- Главная, политика конфиденциальности, robots.txt, sitemap.xml
- Assets сайта: скриншоты (PNG + WebP), логотипы браузеров, favicon, PWA-иконки
- `site/styles.css`, `site/script.js`, `site/translations.js` (клиентский i18n RU/EN)

### Сервер

- Рефакторинг сервера: раздача статики сайта вместе с API-маршрутами

---

## Update 1.5.5 — 2025-07-04

**версия manifest:** `1.5.5`

### Расширение

- Миграция API с `it-cube32.ru:8000` на `https://tabskin.ru:8000`
- Обновлены CSP и `host_permissions` под новый домен

### Сервер

- Крупный рефакторинг: раздача статики из `site/`, ETag, защита от path traversal
- Поддержка SOCKS5-прокси для Unsplash API (`USE_PROXY`, `PROXY_*` в `.env`)
- Включён `trust proxy` для rate limiting за reverse proxy
- Улучшенное логирование с метками времени
- Порт по умолчанию изменён с 8000 на 3000

---

## Update 1.5.4 — 2025-06-27

**версия manifest:** `1.5.3` → `1.5.4`

### Расширение

- **Download location tracking** Unsplash через `POST /download`
- Ссылка на автора переведена с portfolio URL на профиль Unsplash (`user.links.html`)
- UTM-метки на сохраняемых ссылках Unsplash
- Упрощён toast ошибки при сбое загрузки изображения
- Bump версии до 1.5.4 (второй коммит — только исправление версии)

### Сервер

- Новый маршрут `POST /download` — прокси Unsplash download endpoint с API-ключом
- Добавлен `host_permissions` для `/download`

---

## Update 1.5.3 — 2025-06-24

**версия manifest:** `1.5.3`

### Расширение

- UTM-метки (`utm_source=tabskin&utm_medium=referral`) на ссылках фото и автора Unsplash

---

## Update 1.5.2 — 2025-06-23

**версия manifest:** `1.5.2`

### Сервер

- Rate limiting на `/photos`: 20 запросов в час с IP
- Подключён middleware `express-rate-limit`

---

## Update 1.5.1 — 2025-06-22

**версия manifest:** `1.5.1`

### Расширение

- Полировка UI: вёрстка блока информации о кэше, текст кнопки («Очистить кэш» вместо «Очистить кэш сейчас»)
- Мелкие правки отступов в stylesheet
- Уборка комментариев в переводах

---

## Update 1.5.0 — 2025-06-22

**версия manifest:** `1.5.0`

### Расширение

- **Крупный рефакторинг** — самое большое одиночное обновление расширения
- Настройки вынесены в `assets/js/settings.js` (класс `SettingsManager`)
- Полный in-page i18n (EN/RU) с атрибутами `data-i18n`
- Настройки формата времени: 12 и 24 часа
- Расширенный список тем обоев (10 тем)
- Автосмена фона с настраиваемым интервалом
- Плавные анимации переходов (вкл/выкл)
- Кэширование изображений через Cache API с лимитом размера и TTL
- Retry-логика и понятные toast-сообщения об ошибках
- Модальное окно настроек на lazy-loaded встроенном HTML
- Улучшения доступности (ARIA labels)
- Полный редизайн stylesheet

---

## Update 1.4.2 — 2025-06-21

**версия manifest:** `1.4.2`

### Расширение

- Локальный шрифт Montserrat (`font/Montserrat.woff2`) вместо Google Fonts CDN
- Функции очистки кэша и localStorage (`clearCache`, `clearLocalStorage`, `clearAllData`)
- Доступность: `aria-label` на кнопках, английский по умолчанию в UI настроек
- Удалён вторичный API-хост из manifest

### Сервер / инфраструктура

- Улучшения логирования и обработки запросов сервера
- Добавлен `.gitignore`

---

## Add README.md — 2025-06-01

### Документация

- Первые `README.md` (English) и `README.ru.md` (Russian)
- Описаны возможности расширения, команды сборки и структура проекта

---

## Update RU and EN locales for version 1.4.1 — 2025-06-01

**версия manifest:** `1.4.1`

### Расширение

- Локализация имени и описания расширения через `_locales/en/messages.json` и `_locales/ru/messages.json`
- `name` в manifest заменён на `__MSG_extensionName__`
- Мелкие правки manifest

---

## Initial upload files — 2025-05-21

**версия manifest:** `1.4.0`

### Расширение

- **Старт проекта** — MVP расширения для новой вкладки
- Основные файлы: `index.html`, `script.js`, `style.css`, `manifest.json`
- Загрузка обоев Unsplash через кастомный API endpoint
- Базовые настройки: тема, автосмена, переходы
- Часы, кнопка refresh, атрибуция изображения
- SVG-спрайт иконок, PNG-иконки расширения
- Chrome i18n locale-файлы (EN/RU)
- `localStorage` для настроек и метаданных последнего изображения

### Сервер

- Первый `server.js` — Express-прокси к Unsplash `/photos/random` с in-memory кэшем
