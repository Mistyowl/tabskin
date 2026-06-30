// Константы настроек (должны быть объявлены первыми)
const SETTINGS_STORAGE_KEY = "userSettings";
const DEFAULT_SETTINGS = {
  language: "en", // По умолчанию английский
  timeFormat: "24", // По умолчанию 24-часовой формат
  theme: "wallpapers",
  autoSwitchEnabled: false,
  autoSwitchIntervalMinutes: 60,
  transitionEnabled: true,
  performanceModeEnabled: true
};

const isDemoEmbed =
  new URLSearchParams(location.search).has("embed") ||
  location.pathname.includes("/demo/embed");

function storageKey(key) {
  return isDemoEmbed ? `demo_${key}` : key;
}

function imageMetaKey(suffix) {
  return storageKey(`${LOCAL_STORAGE_PREFIX}${suffix}`);
}

function getDemoDefaultLanguage() {
  const langParam = new URLSearchParams(location.search).get("lang");
  if (langParam === "ru" || langParam === "en") return langParam;
  const docLang = document.documentElement.lang?.slice(0, 2);
  if (docLang === "ru" || docLang === "en") return docLang;
  return DEFAULT_SETTINGS.language;
}

// DOM-элементы
const backgroundAuthorLink   = document.querySelector("#creator");
const backgroundImageLink    = document.querySelector("#imageLink");
const refreshButtonElement   = document.querySelector("#changeButton");
const pinButtonElement = document.querySelector("#pinButton");
const timeDisplayElement     = document.querySelector("#time");
const initialLoaderElement   = document.querySelector("#initialLoader");

// Глобальная переменная для менеджера настроек
let settingsManager = null;

// Константы приложения
const IMAGE_API_ENDPOINT   = "https://tabskin.ru/photos";

// Кэш для настроек и языка (для избежания повторных вызовов)
let cachedSettings = null;
let cachedLanguage = null;

const MIN_AUTO_SWITCH_INTERVAL_MINUTES = 15;
let currentImageQuery      = loadUserSettings().theme;
const CACHE_NAME           = isDemoEmbed ? "demo-background-image-cache" : "background-image-cache";
const LOCAL_STORAGE_PREFIX = "lastImage";
const CACHE_INDEX_STORAGE_KEY = "backgroundImageCacheIndex";
const PINNED_IMAGE_STORAGE_KEY = "pinnedImage";
const CACHE_TTL_MS         = 12 * 60 * 60 * 1000; // 12 часов
const FADE_DURATION_MS     = 800;
const DYNAMIC_STYLE_ID     = "dynamic-fade-style";

// Константы для очистки кэша
const CACHE_SIZE_LIMIT_MB = 50; // Лимит размера кэша в МБ

// Константы для обработки ошибок
const REQUEST_TIMEOUT_MS = 10000; // 10 секунд
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 секунда

let isServerAvailable = true; // Флаг доступности сервера
let clockIntervalId = null;
let latestImageRequestId = 0;
let activeBackgroundObjectUrl = null;
let currentTimeFormat = loadUserSettings().timeFormat || DEFAULT_SETTINGS.timeFormat;
let clockFormatter = createClockFormatter(currentTimeFormat);

// UTM параметры для Unsplash ссылок
const UNSPLASH_UTM = '?utm_source=tabskin&utm_medium=referral';

// Ключ для хранения согласия пользователя
const USER_CONSENT_KEY = "userConsentDownloadLocation";
let consentPreviouslyFocusedElement = null;
let consentModalKeydownHandler = null;

// Тексты для модального окна согласия
const CONSENT_TEXTS = {
  en: {
    title: "User Consent Required",
    message: "To comply with Unsplash API requirements, Tabskin sends technical information about the installation of a background image (download location) to the server. This information does not contain personal data and is used only for statistics. By clicking 'Agree', you consent to this data being sent.",
    agree: "Agree",
    more: "Learn more in the privacy policy",
    moreLink: "https://tabskin.ru/privacy.html"
  },
  ru: {
    title: "Требуется согласие пользователя",
    message: "Для корректной работы и соблюдения условий Unsplash API расширение Tabskin отправляет на сервер техническую информацию о факте установки фонового изображения (download location). Эта информация не содержит персональных данных и используется только для статистики. Нажимая 'Согласен', вы даёте согласие на отправку этих данных.",
    agree: "Согласен",
    more: "Подробнее в политике конфиденциальности",
    moreLink: "https://tabskin.ru/privacy.html"
  }
};

function getConsentTexts() {
  const lang = getCurrentLanguage();
  const base = CONSENT_TEXTS[lang] || CONSENT_TEXTS.en;
  if (!isDemoEmbed) return base;
  const demoNote = lang === "ru"
    ? " Это демо на сайте — настройки сохраняются только в браузере для этой страницы."
    : " This is a website demo — settings are stored only in your browser for this page.";
  return { ...base, message: base.message + demoNote };
}

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  )).filter((element) => element.offsetParent !== null || element === document.activeElement);
}

function trapFocusInContainer(event, container) {
  if (event.key !== "Tab") return;
  const focusableElements = getFocusableElements(container);
  if (!focusableElements.length) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function showConsentModalIfNeeded() {
  if (localStorage.getItem(storageKey(USER_CONSENT_KEY)) === "true") return;
  const texts = getConsentTexts();
  const modal = document.createElement("div");
  modal.id = "consentModal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "consentModalTitle");
  modal.setAttribute("tabindex", "-1");
  modal.innerHTML = `
    <div class="consent-modal-content">
      <h2 id="consentModalTitle">${texts.title}</h2>
      <p>${texts.message}</p>
      <a href="${texts.moreLink}" target="_blank" rel="noopener noreferrer">${texts.more}</a>
      <button id="consentAgreeBtn" type="button">${texts.agree}</button>
    </div>
  `;
  consentPreviouslyFocusedElement = document.activeElement;
  consentModalKeydownHandler = (event) => trapFocusInContainer(event, modal);
  modal.addEventListener("keydown", consentModalKeydownHandler);
  document.body.appendChild(modal);
  document.body.classList.add("modal-open");
  document.getElementById("consentAgreeBtn").onclick = function() {
    localStorage.setItem(storageKey(USER_CONSENT_KEY), "true");
    modal.removeEventListener("keydown", consentModalKeydownHandler);
    document.body.removeChild(modal);
    document.body.classList.remove("modal-open");
    if (consentPreviouslyFocusedElement && typeof consentPreviouslyFocusedElement.focus === "function") {
      consentPreviouslyFocusedElement.focus();
    }
  };
  document.getElementById("consentAgreeBtn").focus();
}

document.addEventListener("DOMContentLoaded", showConsentModalIfNeeded);

// Функции для работы с настройками (должны быть объявлены перед использованием)
function loadUserSettings() {
  if (cachedSettings) {
    return { ...cachedSettings };
  }

  const savedSettings = readJsonStorage(SETTINGS_STORAGE_KEY, {});
  let normalizedSettings = normalizeSettings(savedSettings);
  if (isDemoEmbed && !Object.keys(savedSettings).length) {
    normalizedSettings = { ...normalizedSettings, language: getDemoDefaultLanguage() };
  }
  cachedSettings = normalizedSettings;
  cachedLanguage = cachedSettings.language || DEFAULT_SETTINGS.language;
  return { ...cachedSettings };
}

function saveUserSettings(settingsObject) {
  const normalizedSettings = normalizeSettings(settingsObject);
  localStorage.setItem(storageKey(SETTINGS_STORAGE_KEY), JSON.stringify(normalizedSettings));
  cachedSettings = normalizedSettings;
  cachedLanguage = normalizedSettings.language || DEFAULT_SETTINGS.language;
  currentTimeFormat = normalizedSettings.timeFormat || DEFAULT_SETTINGS.timeFormat;
  clockFormatter = createClockFormatter(currentTimeFormat);
  // Держим горячие настройки в памяти, чтобы новая вкладка не читала localStorage каждую секунду.
  console.log("💾 Settings saved");
}

function readJsonStorage(key, fallbackValue) {
  const savedValue = localStorage.getItem(storageKey(key));
  if (!savedValue) return fallbackValue;

  try {
    return JSON.parse(savedValue);
  } catch (error) {
    console.warn(`⚠️ Invalid JSON in localStorage key "${key}", using fallback:`, error);
    return fallbackValue;
  }
}

function writeJsonStorage(key, value) {
  localStorage.setItem(storageKey(key), JSON.stringify(value));
}

function normalizeSettings(settingsObject = {}) {
  const source = settingsObject && typeof settingsObject === "object" ? settingsObject : {};
  const autoSwitchIntervalMinutes = Math.max(
    Number(source.autoSwitchIntervalMinutes) || DEFAULT_SETTINGS.autoSwitchIntervalMinutes,
    MIN_AUTO_SWITCH_INTERVAL_MINUTES
  );

  return {
    ...DEFAULT_SETTINGS,
    ...source,
    autoSwitchIntervalMinutes,
    transitionEnabled: source.transitionEnabled !== false,
    performanceModeEnabled: source.performanceModeEnabled !== false
  };
}

// Собственные переводы для динамической смены языка
const TRANSLATIONS = {
  en: {
    extensionDescription: "Tabskin replaces the standard tab with a minimalistic page with a changing background, current time and information about the author of the image.",
    tabTitle: "New tab",
    settingsTitle: "Settings",
    settingsSubtitle: "Tune the new tab without slowing it down.",
    settingsGroupInterface: "Interface",
    settingsGroupBackground: "Background",
    settingsGroupPerformance: "Performance",
    language: "Language",
    english: "English",
    russian: "Русский",
    timeFormat: "Time format",
    time24Hour: "24 hour",
    time12Hour: "12 hour",
    wallpaperTheme: "Wallpaper theme",
    wallpapers: "Wallpapers",
    nature: "Nature",
    render3d: "3D Render",
    textures: "Texture",
    space: "Space",
    travel: "Travel",
    film: "Film",
    people: "People",
    architecture: "Architecture",
    streetPhotography: "Street Photography",
    autoSwitch: "Automatic background change",
    changeFrequency: "Change frequency",
    every15Minutes: "Every 15 minutes",
    everyHour: "Every hour",
    every6Hours: "Every 6 hours",
    smoothTransition: "Smooth transition animation",
    performanceMode: "Optimized image size",
    clearCacheNow: "Clear cache",
    cacheCleared: "Cache cleared successfully",
    cacheSize: "Cache size",
    done: "Done",
    save: "Save",
    close: "Close",
    loading: "Loading…",
    photo: "Photo",
    by: "by",
    on: "on",
    settings: "Settings",
    settingsSaved: "Settings saved successfully",
    // Error
    errorFailedToLoadImage: "Failed to load new image",
    errorNetworkError: "Network error: Unable to connect to image server",
    errorServerError: "Server error: Image service temporarily unavailable",
    errorServiceError: "Service error: Invalid response from image server",
    errorFailedToLoadInitialImage: "Failed to load initial image. Please try refreshing.",
    errorFailedToClearCache: "Failed to clear cache",
    errorOfflineKeepCurrent: "Unable to load a new image. Keeping the current background.",
    errorNoCachedPinnedImage: "This pinned image is not available offline.",
    pin: "Pin background",
    unpin: "Unpin background",
    pinnedBackground: "Pinned background is active"
  },
  ru: {
    extensionDescription: "Tabskin заменяет стандартную вкладку на минималистичную страницу с меняющимся фоном, текущим временем и информацией об авторе изображения.",
    tabTitle: "Новая вкладка",
    settingsTitle: "Настройки",
    settingsSubtitle: "Настройте новую вкладку без потери скорости.",
    settingsGroupInterface: "Интерфейс",
    settingsGroupBackground: "Фон",
    settingsGroupPerformance: "Производительность",
    language: "Язык",
    english: "English",
    russian: "Русский",
    timeFormat: "Формат времени",
    time24Hour: "24 часа",
    time12Hour: "12 часов",
    wallpaperTheme: "Тема обоев",
    wallpapers: "Обои",
    nature: "Природа",
    render3d: "3D Рендер",
    textures: "Текстуры",
    space: "Космос",
    travel: "Путешествия",
    film: "Фильм",
    people: "Люди",
    architecture: "Архитектура",
    streetPhotography: "Уличная фотография",
    autoSwitch: "Автоматическая смена фона",
    changeFrequency: "Частота смены",
    every15Minutes: "Каждые 15 минут",
    everyHour: "Каждый час",
    every6Hours: "Каждые 6 часов",
    smoothTransition: "Плавная анимация перехода",
    performanceMode: "Оптимальный размер изображения",
    clearCacheNow: "Очистить кэш",
    cacheCleared: "Кэш успешно очищен",
    cacheSize: "Размер кэша",
    done: "Готово",
    save: "Сохранить",
    close: "Закрыть",
    loading: "Загрузка…",
    photo: "Фото",
    by: "от",
    on: "на",
    settings: "Настройки",
    settingsSaved: "Настройки успешно сохранены",
    // Ошибки
    errorFailedToLoadImage: "Не удалось загрузить новое изображение",
    errorNetworkError: "Ошибка сети: Не удается подключиться к серверу изображений",
    errorServerError: "Ошибка сервера: Служба изображений временно недоступна",
    errorServiceError: "Ошибка службы: Некорректный ответ от сервера изображений",
    errorFailedToLoadInitialImage: "Не удалось загрузить начальное изображение. Попробуйте обновить страницу.",
    errorFailedToClearCache: "Не удалось очистить кэш",
    errorOfflineKeepCurrent: "Не удалось загрузить новое изображение. Оставил текущий фон.",
    errorNoCachedPinnedImage: "Закреплённое изображение недоступно офлайн.",
    pin: "Закрепить фон",
    unpin: "Открепить фон",
    pinnedBackground: "Закреплённый фон активен"
  }
};

// Делаем TRANSLATIONS доступным глобально для модуля настроек
window.TRANSLATIONS = TRANSLATIONS;

// Получение перевода с учетом выбранного языка
function getMessage(key) {
  const settings = loadUserSettings();
  const currentLanguage = settings.language || "en";
  const translations = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  return translations[key] || TRANSLATIONS.en[key] || `[Missing: ${key}]`;
}

// Локализация заголовка
function applyLocalizedPageTitle() {
  const localizedTitle = getMessage("tabTitle");
  document.title = localizedTitle;
  console.log("🏷 Page title set to:", document.title);
}

// Применение локализации
function applyLocalization() {
  // Используем новую централизованную функцию
  localizeContainer(document);
  
  // Локализация title атрибутов (оставляем как есть, так как это специфичная логика)
  const currentLanguage = getCurrentLanguage();
  document.querySelectorAll("[data-i18n-title]").forEach(element => {
    const key = element.getAttribute("data-i18n-title");
    const translation = TRANSLATIONS[currentLanguage]?.[key];
    if (translation) {
      element.title = translation;
    }
  });

  console.log("🌐 Interface localized");
}

// Применение пользовательских настроек
function applyUserSettings() {
  const settings = loadUserSettings();
  currentImageQuery = settings.theme;
  applyLocalizedPageTitle();
  applyLocalization();
  applyTimeFormat();
  applyAutoSwitchSettings();
  applyTransitionSettings();
}

// Применение формата времени
function applyTimeFormat() {
  restartClock();
}

// Применение настроек автопереключения
function applyAutoSwitchSettings() {
  const settings = loadUserSettings();
  
  if (window.autoSwitchInterval) {
    clearInterval(window.autoSwitchInterval);
  }
  
  if (settings.autoSwitchEnabled) {
    const intervalMinutes = Math.max(settings.autoSwitchIntervalMinutes || 60, MIN_AUTO_SWITCH_INTERVAL_MINUTES);
    const intervalMs = intervalMinutes * 60 * 1000;
    window.autoSwitchInterval = setInterval(() => {
      console.log("🔄 Auto-switching background image");
      fetchAndUpdateImage({ forceRefresh: true, silent: true, source: "auto" }).catch(() => {});
    }, intervalMs);
    console.log("⏰ Auto-switch enabled with interval:", intervalMs / 1000 / 60, "minutes");
  } else {
    console.log("⏰ Auto-switch disabled");
  }
}

// Применение настроек переходов
function applyTransitionSettings() {
  const settings = loadUserSettings();
  const transitionEnabled = settings.transitionEnabled !== false; // По умолчанию включено
  
  if (transitionEnabled) {
    document.body.classList.add("transition-enabled");
  } else {
    document.body.classList.remove("transition-enabled");
  }
}

// Добавляем CSS для плавного fade через ::after
function injectFadeStyles() {
  document.documentElement.style.setProperty("--fade-duration", `${FADE_DURATION_MS}ms`);
  applyTransitionSettings();
  console.log("🎨 Fade duration configured");
}

// Отображение часов
function startClock() {
  restartClock();
}

function restartClock() {
  updateClockDisplay();
  if (clockIntervalId) {
    clearInterval(clockIntervalId);
  }
  clockIntervalId = setInterval(updateClockDisplay, 1000);
  window.timeUpdateInterval = clockIntervalId;
}

function createClockFormatter(timeFormat) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: timeFormat === "12"
  });
}

function updateClockDisplay() {
  if (!timeDisplayElement) return;
  const now = new Date();
  timeDisplayElement.textContent = clockFormatter.format(now);
}

// Восстановление последнего изображения из кэша
async function displayLastCachedImage() {
  const pinnedImage = getPinnedImage();
  const storedMetadata = pinnedImage || getStoredImageMetadata();
  if (!storedMetadata?.url) {
    console.log("⚠️ No cached image in localStorage");
    return false;
  }

  const displayed = await applyImageFromCachedMetadata(storedMetadata, {
    updateStoredMetadata: Boolean(pinnedImage),
    showError: false,
    animate: false
  });

  if (!displayed && storedMetadata.url) {
    setBodyBackgroundImage(storedMetadata.url);
    applyMetadataToDom(storedMetadata);
    console.log("⚠️ Cached response missing, applied stored URL as best-effort fallback");
  }

  updateLocalImageControls();
  return displayed;
}

// Инициализация на старте
window.addEventListener("load", async () => {
  try {
    // Минимальная инициализация для быстрого отображения
  injectFadeStyles();
  startClock();

    // Инициализируем z-index toast-уведомлений
    updateToastZIndex();

    // Инициализация модуля настроек (неблокирующая)
    initializeSettingsModule().catch(error => {
      console.error("❌ Settings module initialization failed:", error);
    });

    // Загружаем изображение ПАРАЛЛЕЛЬНО с остальной инициализацией
    const imageLoadPromise = (async () => {
      try {
    const hadImage = await displayLastCachedImage();
    initialLoaderElement?.classList.add("hidden");
    const lastLoadTime = Number(localStorage.getItem(imageMetaKey("LoadTime"))) || 0;
    const isTtlExpired = Date.now() - lastLoadTime > CACHE_TTL_MS;
    const hasPinnedImage = Boolean(getPinnedImage());

    if (hasPinnedImage) {
      console.log("📌 Pinned image active, skipping startup refresh");
    } else if (!hadImage || isTtlExpired) {
      console.log(isTtlExpired ? "⌛ TTL expired" : "🔎 No cache on load", "- fetching new image");
          await fetchAndUpdateImage({ forceRefresh: false, silent: hadImage, source: "startup", animate: false });
    } else {
      console.log("✅ Cached image is fresh, no immediate fetch required");
        }
      } catch (error) {
        console.error("❌ Initial image loading failed:", error);
        initialLoaderElement?.classList.add("hidden");
        // Показываем ошибку пользователю только если нет кэшированного изображения
        if (!localStorage.getItem(imageMetaKey("Url"))) {
          showToastError(getMessage("errorFailedToLoadInitialImage"), 'error');
        }
    }
  })();

    // Применяем настройки ПОСЛЕ загрузки изображения
    imageLoadPromise.then(() => {
      applyLocalizedPageTitle();
      applyLocalization();
  applyUserSettings();
      updateLocalImageControls();
    });

  } catch (error) {
    console.error("❌ Initialization failed:", error);
    // Убираем loader в любом случае
    if (initialLoaderElement) {
      initialLoaderElement.classList.add("hidden");
    }
  }
});

// Обработчик кнопки обновления
refreshButtonElement?.addEventListener("click", async () => {
  console.log("👆 Manual refresh requested");
  refreshButtonElement.disabled = true;
  refreshButtonElement.classList.add("spin-animation");
  try {
    await fetchAndUpdateImage({ forceRefresh: true, source: "manual" });
  } catch (error) {
    console.error("❌ Manual refresh failed:", error);
  } finally {
    refreshButtonElement.disabled = false;
    setTimeout(() => refreshButtonElement.classList.remove("spin-animation"), FADE_DURATION_MS);
  }
});

pinButtonElement?.addEventListener("click", togglePinnedCurrentImage);

window.addEventListener("online", () => {
  setServerAvailable(true);
  console.log("🌐 Browser is online again");
});

window.addEventListener("offline", () => {
  setServerAvailable(false);
  console.log("📴 Browser is offline");
});

// Получение и отображение нового изображения
async function fetchAndUpdateImage({ forceRefresh, silent = false, source = "startup", animate = source !== "startup" }) {
  const requestId = ++latestImageRequestId;
  console.log(`🌐 fetchAndUpdateImage(forceRefresh=${forceRefresh}, source=${source})`);

  if (getPinnedImage() && source !== "manual") {
    console.log("📌 Pinned image active, skipping automatic image update");
    return false;
  }

  if (navigator.onLine === false) {
    console.log("📴 Browser reports offline, skipping image update");
    if (!silent) showToastError(getMessage("errorOfflineKeepCurrent"), "error");
    return false;
  }

  if (!isServerAvailable && !forceRefresh) {
    console.log("🔄 Server unavailable, skipping image update");
    return false;
  }

  try {
    const queryParameters = new URLSearchParams({ query: currentImageQuery });
    if (forceRefresh) queryParameters.set("refresh", Date.now().toString());

    const response = await fetchWithRetry(`${IMAGE_API_ENDPOINT}?${queryParameters}`);
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const jsonData = await response.json();
    const imageUrl = selectBestImageUrl(jsonData);
    if (!imageUrl) {
      throw new Error("Invalid API response: missing image URL");
    }

    ensureLatestImageRequest(requestId);
    console.log("📥 Received new image URL:", imageUrl);

    const preparedImage = await prepareImageForDisplay(imageUrl);
    ensureLatestImageRequest(requestId);

    const metadata = createImageMetadata(jsonData, imageUrl);
    if (source === "manual") {
      clearPinnedImage();
    }
    await commitPreparedImage(metadata, preparedImage, { animate });
    setServerAvailable(true);

    trackDownloadLocation(jsonData.links?.download_location);
    console.log("🎨 New image applied with metadata");
    return true;
  } catch (error) {
    if (error.name === "AbortError" || error.message === "Stale image request") {
      console.log("⏭ Ignored stale image request");
      return false;
    }

    console.error("❌ fetchAndUpdateImage failed:", error);
    setServerAvailable(false);
    if (!silent) showToastError(getMessage("errorOfflineKeepCurrent"), "error");
    return false;
  }
}

function ensureLatestImageRequest(requestId) {
  if (requestId !== latestImageRequestId) {
    throw new Error("Stale image request");
  }
}

function selectBestImageUrl(jsonData) {
  const urls = jsonData.urls || {};
  const settings = loadUserSettings();

  if (settings.performanceModeEnabled && urls.raw) {
    return buildResponsiveUnsplashUrl(urls.raw);
  }

  return urls.regular || urls.small || urls.full || urls.raw || null;
}

function buildResponsiveUnsplashUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.min(Math.max(Math.ceil(window.innerWidth * pixelRatio), 1280), 2560);
    const height = Math.min(Math.max(Math.ceil(window.innerHeight * pixelRatio), 720), 1600);

    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("crop", "entropy");
    url.searchParams.set("w", String(width));
    url.searchParams.set("h", String(height));
    url.searchParams.set("q", "82");
    return url.toString();
  } catch (error) {
    console.warn("⚠️ Failed to build responsive image URL:", error);
    return rawUrl;
  }
}

function createImageMetadata(jsonData, imageUrl) {
  return {
    url: imageUrl,
    authorName: jsonData.user?.name || "Unknown",
    photoPageLink: jsonData.links?.html || "#",
    authorProfileLink: jsonData.user?.links?.html || "#",
    timestamp: Date.now()
  };
}

async function prepareImageForDisplay(imageUrl) {
  let objectUrl = null;

  try {
    const response = await fetchWithRetry(imageUrl, { cache: "reload" });
    if (!response.ok) {
      throw new Error(`Image returned status ${response.status}`);
    }

    const responseForCache = response.clone();
    const blob = await response.blob();
    objectUrl = URL.createObjectURL(blob);

    await decodeImage(objectUrl);
    await cachePreparedImage(imageUrl, responseForCache, blob.size);

    return {
      displayUrl: objectUrl,
      objectUrl,
      size: blob.size
    };
  } catch (error) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function decodeImage(imageUrl) {
  const image = new Image();
  image.decoding = "async";
  image.src = imageUrl;

  if (typeof image.decode === "function") {
    return image.decode();
  }

  return new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("Image failed to load"));
  });
}

async function commitPreparedImage(metadata, preparedImage, { animate = true } = {}) {
  saveImageMetadata(metadata);
  applyMetadataToDom(metadata);
  applyBackgroundImage(preparedImage.displayUrl, { animate });
  updateLocalImageControls();
  scheduleCacheCleanup();
}

function trackDownloadLocation(downloadLocation) {
  if (!downloadLocation) return;
  if (localStorage.getItem(storageKey(USER_CONSENT_KEY)) !== "true") {
    console.warn("⚠️ User consent not granted for download location tracking.");
    return;
  }

  fetch("https://tabskin.ru/download", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ downloadLocation })
  })
    .then(() => console.log("📊 Download endpoint called for tracking"))
    .catch((error) => console.warn("⚠️ Failed to call download endpoint:", error));
}

function setServerAvailable(value) {
  isServerAvailable = value;
  window.isServerAvailable = isServerAvailable;
}

// Улучшенная функция fetch с retry логикой и timeout
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      if (response.ok) {
        return response;
      }
      
      // Если это последняя попытка, возвращаем ответ
      if (i === retries - 1) {
        return response;
      }

      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (i + 1)));
    } catch (error) {
      console.warn(`⚠️ Fetch attempt ${i + 1} failed:`, error.message);
      
      // Если это последняя попытка, выбрасываем ошибку
      if (i === retries - 1) {
        throw error;
      }
      
      // Ждем перед следующей попыткой
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (i + 1)));
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// Кэширование изображения
async function cachePreparedImage(imageUrl, response, size) {
  const cacheStorage = await caches.open(CACHE_NAME);
  await cacheStorage.put(imageUrl, response);
  upsertCacheIndexItem({
    url: imageUrl,
    size: Number(size) || 0,
    cachedAt: Date.now(),
    lastUsed: Date.now()
  });
  console.log("🗄 Image added to cache:", imageUrl);
}

function getCacheIndex() {
  const index = readJsonStorage(CACHE_INDEX_STORAGE_KEY, []);
  return Array.isArray(index) ? index.filter((item) => item?.url) : [];
}

function saveCacheIndex(index) {
  writeJsonStorage(CACHE_INDEX_STORAGE_KEY, index);
}

function upsertCacheIndexItem(nextItem) {
  const index = getCacheIndex().filter((item) => item.url !== nextItem.url);
  index.unshift(nextItem);
  saveCacheIndex(index);
}

function markCacheItemUsed(url) {
  const index = getCacheIndex();
  const item = index.find((entry) => entry.url === url);
  if (!item) return;
  item.lastUsed = Date.now();
  saveCacheIndex(index);
}

function scheduleCacheCleanup() {
  const runCleanup = () => cleanupCacheBySize().catch((error) => {
    console.error("❌ Error during deferred cache cleanup:", error);
  });

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(runCleanup, { timeout: 5000 });
  } else {
    setTimeout(runCleanup, 1500);
  }
}

// Сохранение метаданных изображения
function saveImageMetadata({ url, authorName, photoPageLink, authorProfileLink, timestamp }) {
  // Добавляем utm-метки к ссылкам на Unsplash
  const photoLinkWithUtm = addUnsplashUtm(photoPageLink);
  const authorLinkWithUtm = addUnsplashUtm(authorProfileLink);

  localStorage.setItem(imageMetaKey("Url"), url);
  localStorage.setItem(imageMetaKey("Creator"), authorName);
  localStorage.setItem(imageMetaKey("PhotoLink"), photoLinkWithUtm);
  localStorage.setItem(imageMetaKey("CreatorLink"), authorLinkWithUtm);
  localStorage.setItem(imageMetaKey("LoadTime"), timestamp.toString());
  console.log("💾 Image metadata saved");
}

function addUnsplashUtm(link) {
  if (!link || link === "#") return link;
  return link.includes("utm_source=") ? link : `${link}${UNSPLASH_UTM}`;
}

function getStoredImageMetadata() {
  const url = localStorage.getItem(imageMetaKey("Url"));
  if (!url) return null;

  return {
    url,
    authorName: localStorage.getItem(imageMetaKey("Creator")) || "",
    photoPageLink: localStorage.getItem(imageMetaKey("PhotoLink")) || "#",
    authorProfileLink: localStorage.getItem(imageMetaKey("CreatorLink")) || "#",
    timestamp: Number(localStorage.getItem(imageMetaKey("LoadTime"))) || Date.now()
  };
}

// Отображение сохранённых метаданных
function applyStoredImageMetadata() {
  const metadata = getStoredImageMetadata();
  if (!metadata) return;
  applyMetadataToDom(metadata);
}

function applyMetadataToDom({ authorName, photoPageLink, authorProfileLink }) {
  if (backgroundAuthorLink) {
    backgroundAuthorLink.textContent = authorName || "";
    backgroundAuthorLink.href = authorProfileLink || "#";
  }

  if (backgroundImageLink) {
    backgroundImageLink.href = photoPageLink || "#";
  }

  console.log("🔗 Applied image metadata:", { authorName, photoPageLink, authorProfileLink });
}

async function applyImageFromCachedMetadata(metadata, options = {}) {
  const {
    updateStoredMetadata = true,
    showError = true,
    animate = true
  } = options;

  if (!metadata?.url) return false;
  let objectUrl = null;

  try {
    const cacheStorage = await caches.open(CACHE_NAME);
    const cachedResponse = await cacheStorage.match(metadata.url);
    if (!cachedResponse) {
      if (showError) showToastError(getMessage("errorNoCachedPinnedImage"), "error");
      return false;
    }

    const blob = await cachedResponse.blob();
    objectUrl = URL.createObjectURL(blob);
    await decodeImage(objectUrl);

    if (updateStoredMetadata) saveImageMetadata(metadata);
    applyMetadataToDom(metadata);
    markCacheItemUsed(metadata.url);
    applyBackgroundImage(objectUrl, { animate });
    updateLocalImageControls();
    return true;
  } catch (error) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    console.warn("⚠️ Failed to apply cached image:", error);
    if (showError) showToastError(getMessage("errorNoCachedPinnedImage"), "error");
    return false;
  }
}

function getPinnedImage() {
  const pinnedImage = readJsonStorage(PINNED_IMAGE_STORAGE_KEY, null);
  return pinnedImage?.url ? pinnedImage : null;
}

function togglePinnedCurrentImage() {
  const metadata = getStoredImageMetadata();
  if (!metadata?.url) return;

  const pinnedImage = getPinnedImage();
  if (pinnedImage?.url === metadata.url) {
    clearPinnedImage();
  } else {
    writeJsonStorage(PINNED_IMAGE_STORAGE_KEY, { ...metadata, timestamp: Date.now() });
  }

  updateLocalImageControls();
}

function clearPinnedImage() {
  localStorage.removeItem(storageKey(PINNED_IMAGE_STORAGE_KEY));
}

function updateLocalImageControls() {
  const metadata = getStoredImageMetadata();
  const pinnedImage = getPinnedImage();
  const isPinned = Boolean(metadata?.url && pinnedImage?.url === metadata.url);

  if (pinButtonElement) {
    pinButtonElement.disabled = !metadata?.url;
    pinButtonElement.classList.toggle("active", isPinned);
    pinButtonElement.setAttribute("aria-pressed", String(isPinned));
    pinButtonElement.title = getMessage(isPinned ? "unpin" : "pin");
    pinButtonElement.setAttribute("aria-label", getMessage(isPinned ? "unpin" : "pin"));
  }
}

function applyBackgroundImage(newImageUrl, { animate = true } = {}) {
  if (animate) {
    triggerFadeTransition(newImageUrl);
  } else {
    setBodyBackgroundImage(newImageUrl);
    document.getElementById(DYNAMIC_STYLE_ID)?.remove();
  }
}

// Плавный переход только при смене изображения
function triggerFadeTransition(newImageUrl) {
  const settings = loadUserSettings();
  if (settings.transitionEnabled === false) {
    setBodyBackgroundImage(newImageUrl);
    return;
  }

  document.getElementById(DYNAMIC_STYLE_ID)?.remove();

  const dynamicCss = `
    body::after {
      background-image: ${toCssUrl(newImageUrl)};
      opacity: 1;
    }
  `;
  const styleTag = document.createElement("style");
  styleTag.id = DYNAMIC_STYLE_ID;
  styleTag.textContent = dynamicCss;
  document.head.appendChild(styleTag);

  setTimeout(() => {
    setBodyBackgroundImage(newImageUrl);
    document.getElementById(DYNAMIC_STYLE_ID)?.remove();
    console.log("✨ Fade transition completed");
  }, FADE_DURATION_MS);
}

function setBodyBackgroundImage(imageUrl) {
  document.body.style.backgroundImage = toCssUrl(imageUrl);

  if (activeBackgroundObjectUrl && activeBackgroundObjectUrl !== imageUrl) {
    URL.revokeObjectURL(activeBackgroundObjectUrl);
  }

  activeBackgroundObjectUrl = imageUrl.startsWith("blob:") ? imageUrl : null;
}

function toCssUrl(imageUrl) {
  const safeUrl = String(imageUrl).replace(/["\\\n\r]/g, "\\$&");
  return `url("${safeUrl}")`;
}

// Показ toast-сообщений
function showToastError(messageText, type = 'error') {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) return;

  const toastElement = document.createElement("div");
  toastElement.className = `toast toast-${type}`;
  toastElement.textContent = messageText;
  toastContainer.append(toastElement);

  requestAnimationFrame(() => toastElement.classList.add("show"));

  setTimeout(() => {
    toastElement.classList.replace("show", "hide");
    toastElement.addEventListener("animationend", () => toastElement.remove(), { once: true });
  }, 4000);

  console.log(`🚨 Toast ${type} displayed:`, messageText);
}

// Управление z-index toast-уведомлений
function updateToastZIndex() {
  const toastContainer = document.getElementById("toastContainer");
  const settingsModal = document.getElementById("settingsModal");
  
  if (toastContainer && settingsModal) {
    const isModalOpen = !settingsModal.classList.contains("hidden");
    if (isModalOpen) {
      toastContainer.style.zIndex = "10020";
    } else {
      toastContainer.style.zIndex = "10001";
    }
  }
}

// Очистка кэша по кнопке
async function clearCache() {
  const cacheStorage = await caches.open(CACHE_NAME);
  const keys = await cacheStorage.keys();
  await Promise.all(keys.map(request => cacheStorage.delete(request)));
  localStorage.removeItem(storageKey(CACHE_INDEX_STORAGE_KEY));
  console.log("🗑 Cache cleared");
}

// Очистка локального хранилища по кнопке
function clearLocalStorage() {
  localStorage.removeItem(imageMetaKey("Url"));
  localStorage.removeItem(imageMetaKey("Creator"));
  localStorage.removeItem(imageMetaKey("PhotoLink"));
  localStorage.removeItem(imageMetaKey("CreatorLink"));
  localStorage.removeItem(imageMetaKey("LoadTime"));
  localStorage.removeItem(storageKey(PINNED_IMAGE_STORAGE_KEY));
  updateLocalImageControls();
  console.log("🗑 Local storage cleared");
}

// Получение размера кэша
async function getCacheSize() {
  try {
    const indexedSize = getCacheIndex().reduce((total, item) => total + (Number(item.size) || 0), 0);
    if (indexedSize > 0) return indexedSize;

    const cacheStorage = await caches.open(CACHE_NAME);
    const keys = await cacheStorage.keys();
    let totalSize = 0;
    const rebuiltIndex = [];
    
    for (const request of keys) {
      try {
        const response = await cacheStorage.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
          rebuiltIndex.push({
            url: request.url,
            size: blob.size,
            cachedAt: Date.now(),
            lastUsed: Date.now()
          });
        }
      } catch (error) {
        console.warn("⚠️ Error calculating size for cached item:", error);
      }
    }

    if (rebuiltIndex.length) saveCacheIndex(rebuiltIndex);
    
    return totalSize;
  } catch (error) {
    console.error("❌ Error getting cache size:", error);
    return 0;
  }
}

// Форматирование размера кэша
function formatCacheSize(bytes) {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Очистка кэша по размеру (упрощенная версия)
async function cleanupCacheBySize() {
  try {
    const cacheStorage = await caches.open(CACHE_NAME);
    const sizeLimit = CACHE_SIZE_LIMIT_MB * 1024 * 1024; // Конвертируем в байты

    let items = getCacheIndex();
    if (!items.length) {
      await getCacheSize();
      items = getCacheIndex();
    }

    const protectedUrls = getProtectedCacheUrls();
    let totalSize = items.reduce((total, item) => total + (Number(item.size) || 0), 0);

    if (totalSize > sizeLimit) {
      // Сортируем по дате (старые сначала)
      items.sort((a, b) => (a.lastUsed || a.cachedAt || 0) - (b.lastUsed || b.cachedAt || 0));
      
      let removedSize = 0;
      let removedCount = 0;
      const keptItems = [];
      
      for (const item of items) {
        if (totalSize - removedSize <= sizeLimit || protectedUrls.has(item.url)) {
          keptItems.push(item);
          continue;
        }

        await cacheStorage.delete(item.url);
        removedSize += Number(item.size) || 0;
        removedCount++;
      }

      saveCacheIndex([
        ...keptItems,
        ...items.filter((item) => protectedUrls.has(item.url) && !keptItems.includes(item))
      ]);
      
      if (removedCount > 0) {
        console.log(`🗑 Cache size limit exceeded, removed ${removedCount} items (${formatCacheSize(removedSize)})`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error during cache size cleanup:", error);
  }
}

function getProtectedCacheUrls() {
  const urls = new Set();
  const storedMetadata = getStoredImageMetadata();
  const pinnedImage = getPinnedImage();

  if (storedMetadata?.url) urls.add(storedMetadata.url);
  if (pinnedImage?.url) urls.add(pinnedImage.url);
  return urls;
}

// Инициализация модуля настроек (неблокирующая)
async function initializeSettingsModule() {
  try {
    settingsManager = new SettingsManager();
    console.log("⚙️ Settings manager created (lazy initialization)");
  } catch (error) {
    console.error("❌ Failed to create settings manager:", error);
  }
}

// Экспорт функций для модуля настроек
window.loadUserSettings = loadUserSettings;
window.saveUserSettings = saveUserSettings;
window.applyUserSettings = applyUserSettings;
window.applyLocalizedPageTitle = applyLocalizedPageTitle;
window.applyLocalization = applyLocalization;
window.clearCache = clearCache;
window.clearLocalStorage = clearLocalStorage;
window.getCacheSize = getCacheSize;
window.formatCacheSize = formatCacheSize;
window.getMessage = getMessage;
window.showToastError = showToastError;

// Экспорт функций для использования в модуле настроек
window.getCurrentLanguage = getCurrentLanguage;
window.localizeElement = localizeElement;
window.localizeContainer = localizeContainer;
window.resetLocalizationCache = resetLocalizationCache;

// Экспорт переменных для тестирования
window.isServerAvailable = isServerAvailable;

// Централизованная функция получения текущего языка (с кэшированием)
function getCurrentLanguage() {
  if (!cachedLanguage) {
    const settings = loadUserSettings();
    cachedLanguage = settings.language || "en";
  }
  return cachedLanguage;
}

// Централизованная функция локализации элемента (самая быстрая)
function localizeElement(element, language = getCurrentLanguage()) {
  const key = element.getAttribute("data-i18n");
  const translation = TRANSLATIONS[language]?.[key];
  if (translation) {
    if (element.tagName === "INPUT" && element.type === "placeholder") {
      element.placeholder = translation;
    } else {
      element.textContent = translation;
    }
  }
}

// Централизованная функция локализации контейнера
function localizeContainer(container, language = getCurrentLanguage()) {
  container.querySelectorAll("[data-i18n]").forEach(element => {
    localizeElement(element, language);
  });
}

// Функция сброса кэша (вызывается при изменении настроек)
function resetLocalizationCache() {
  cachedSettings = null;
  cachedLanguage = null;
}

