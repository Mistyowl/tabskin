// Константы настроек (должны быть объявлены первыми)
const SETTINGS_STORAGE_KEY = "userSettings";
const DEFAULT_SETTINGS = {
  language: "en", // По умолчанию английский
  timeFormat: "24", // По умолчанию 24-часовой формат
  theme: "wallpapers",
  autoSwitchEnabled: false,
  autoSwitchIntervalMinutes: 60,
  transitionEnabled: true
};

// DOM-элементы
const backgroundAuthorLink   = document.querySelector("#creator");
const backgroundImageLink    = document.querySelector("#imageLink");
const refreshButtonElement   = document.querySelector("#changeButton");
const timeDisplayElement     = document.querySelector("#time");
const initialLoaderElement   = document.querySelector("#initialLoader");

// Глобальная переменная для менеджера настроек
let settingsManager = null;

// Константы приложения
const IMAGE_API_ENDPOINT   = "https://tabskin.ru/photos";

let currentImageQuery      = loadUserSettings().theme;
const CACHE_NAME           = "background-image-cache";
const LOCAL_STORAGE_PREFIX = "lastImage";
const CACHE_TTL_MS         = 12 * 60 * 60 * 1000; // 12 часов
const FADE_DURATION_MS     = 800;
const BASE_STYLE_ID        = "base-fade-style";
const DYNAMIC_STYLE_ID     = "dynamic-fade-style";

// Константы для очистки кэша
const CACHE_SIZE_LIMIT_MB = 50; // Лимит размера кэша в МБ

// Константы для обработки ошибок
const REQUEST_TIMEOUT_MS = 10000; // 10 секунд
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 секунда

let autoSwitchTimerId = null;
let isServerAvailable = true; // Флаг доступности сервера
let clockIntervalId = null;

// Кэш для настроек и языка (для избежания повторных вызовов)
let cachedSettings = null;
let cachedLanguage = null;

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
  return CONSENT_TEXTS[lang] || CONSENT_TEXTS.en;
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
  if (localStorage.getItem(USER_CONSENT_KEY) === "true") return;
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
    localStorage.setItem(USER_CONSENT_KEY, "true");
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
  const savedSettingsJson = localStorage.getItem(SETTINGS_STORAGE_KEY);
  return savedSettingsJson
    ? JSON.parse(savedSettingsJson)
    : { ...DEFAULT_SETTINGS };
}

function saveUserSettings(settingsObject) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsObject));
  // Сбрасываем кэш локализации при изменении настроек
  resetLocalizationCache();
  console.log("💾 Settings saved");
}

// Собственные переводы для динамической смены языка
const TRANSLATIONS = {
  en: {
    extensionDescription: "Tabskin replaces the standard tab with a minimalistic page with a changing background, current time and information about the author of the image.",
    tabTitle: "New tab",
    settingsTitle: "Settings",
    language: "Language:",
    english: "English",
    russian: "Русский",
    timeFormat: "Time format:",
    time24Hour: "24-hour format",
    time12Hour: "12-hour format (AM/PM)",
    wallpaperTheme: "Wallpaper theme:",
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
    changeFrequency: "Change frequency:",
    everyMinute: "Every minute",
    every15Minutes: "Every 15 minutes",
    everyHour: "Every hour",
    every6Hours: "Every 6 hours",
    smoothTransition: "Smooth transition animation",
    clearCacheNow: "Clear cache",
    cacheCleared: "Cache cleared successfully",
    cacheSize: "Cache size:",
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
    errorFailedToClearCache: "Failed to clear cache"
  },
  ru: {
    extensionDescription: "Tabskin заменяет стандартную вкладку на минималистичную страницу с меняющимся фоном, текущим временем и информацией об авторе изображения.",
    tabTitle: "Новая вкладка",
    settingsTitle: "Настройки",
    language: "Язык:",
    english: "English",
    russian: "Русский",
    timeFormat: "Формат времени:",
    time24Hour: "24-часовой формат",
    time12Hour: "12-часовой формат (AM/PM)",
    wallpaperTheme: "Тема обоев:",
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
    changeFrequency: "Частота смены:",
    everyMinute: "Каждую минуту",
    every15Minutes: "Каждые 15 минут",
    everyHour: "Каждый час",
    every6Hours: "Каждые 6 часов",
    smoothTransition: "Плавная анимация перехода",
    clearCacheNow: "Очистить кэш",
    cacheCleared: "Кэш успешно очищен",
    cacheSize: "Размер кэша:",
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
    errorFailedToClearCache: "Не удалось очистить кэш"
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
    const intervalMs = (settings.autoSwitchIntervalMinutes || 60) * 60 * 1000;
    window.autoSwitchInterval = setInterval(() => {
      console.log("🔄 Auto-switching background image");
      fetchAndUpdateImage({ forceRefresh: true }).catch(() => {});
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
  if (document.getElementById(BASE_STYLE_ID)) return;
  const cssRules = `
    body { position: relative; overflow: hidden; }
    body::after {
      content: "";
      position: absolute;
      inset: 0;
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center;
      opacity: 0;
      transition: opacity ${FADE_DURATION_MS}ms ease-in-out;
      pointer-events: none;
      z-index: -1;
    }
  `;
  const styleTag = document.createElement("style");
  styleTag.id = BASE_STYLE_ID;
  styleTag.textContent = cssRules;
  document.head.appendChild(styleTag);
  console.log("🎨 Fade styles injected");
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

function updateClockDisplay() {
  const now = new Date();
  const settings = loadUserSettings();
  const timeFormat = settings.timeFormat || "24";
  
  let timeOptions = {
    hour: "2-digit",
    minute: "2-digit"
  };
  
  // Если выбран 12-часовой формат, добавляем hour12: true
  if (timeFormat === "12") {
    timeOptions.hour12 = true;
  } else {
    timeOptions.hour12 = false;
  }
  
  timeDisplayElement.textContent = now.toLocaleTimeString(undefined, timeOptions);
}

// Восстановление последнего изображения из кэша
async function displayLastCachedImage() {
  const cachedUrl = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}Url`);
  const cachedTimestamp = Number(localStorage.getItem(`${LOCAL_STORAGE_PREFIX}LoadTime`)) || 0;
  if (!cachedUrl) {
    console.log("⚠️ No cached image in localStorage");
    return false;
  }

  try {
    const cacheStorage = await caches.open(CACHE_NAME);
    const cachedResponse = await cacheStorage.match(cachedUrl);
    const displayUrl = cachedResponse
      ? URL.createObjectURL(await cachedResponse.blob())
      : cachedUrl;
    document.body.style.backgroundImage = `url("${displayUrl}")`;
    console.log("🗄 Displayed image from cache:", displayUrl);
  } catch (error) {
    console.warn("⚠️ Cache API error, falling back to direct URL:", error);
    document.body.style.backgroundImage = `url("${cachedUrl}")`;
  }

  applyStoredImageMetadata();
  return true;
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
    initialLoaderElement.classList.add("hidden");
    const lastLoadTime = Number(localStorage.getItem(`${LOCAL_STORAGE_PREFIX}LoadTime`)) || 0;
    const isTtlExpired = Date.now() - lastLoadTime > CACHE_TTL_MS;

    if (!hadImage || isTtlExpired) {
      console.log(isTtlExpired ? "⌛ TTL expired" : "🔎 No cache on load", "- fetching new image");
          await fetchAndUpdateImage({ forceRefresh: false });
    } else {
      console.log("✅ Cached image is fresh, no immediate fetch required");
        }
      } catch (error) {
        console.error("❌ Initial image loading failed:", error);
        initialLoaderElement.classList.add("hidden");
        // Показываем ошибку пользователю только если нет кэшированного изображения
        if (!localStorage.getItem(`${LOCAL_STORAGE_PREFIX}Url`)) {
          showToastError(getMessage("errorFailedToLoadInitialImage"), 'error');
        }
    }
  })();

    // Применяем настройки ПОСЛЕ загрузки изображения
    imageLoadPromise.then(() => {
      applyLocalizedPageTitle();
      applyLocalization();
  applyUserSettings();
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
refreshButtonElement.addEventListener("click", async () => {
  console.log("👆 Manual refresh requested");
  refreshButtonElement.disabled = true;
  refreshButtonElement.classList.add("spin-animation");
  try {
    await fetchAndUpdateImage({ forceRefresh: true });
  } catch (error) {
    console.error("❌ Manual refresh failed:", error);
  } finally {
    refreshButtonElement.disabled = false;
    setTimeout(() => refreshButtonElement.classList.remove("spin-animation"), FADE_DURATION_MS);
  }
});

// Получение и отображение нового изображения
async function fetchAndUpdateImage({ forceRefresh }) {
  console.log(`🌐 fetchAndUpdateImage(forceRefresh=${forceRefresh})`);
  
  // Если сервер недоступен и это не принудительное обновление, просто выходим
  if (!isServerAvailable && !forceRefresh) {
    console.log("🔄 Server unavailable, skipping image update");
    return;
  }
  
  try {
  const queryParameters = new URLSearchParams({ query: currentImageQuery });
  if (forceRefresh) queryParameters.set("refresh", Date.now().toString());

    const response = await fetchWithRetry(`${IMAGE_API_ENDPOINT}?${queryParameters}`);
    if (!response.ok) {
      const errorMessage = `Server returned status ${response.status}`;
      console.error("❌ API Error:", errorMessage);
      showToastError(getMessage("errorFailedToLoadImage"), 'error');
      throw new Error(errorMessage);
    }

  const jsonData = await response.json();
  const imageUrl = jsonData.urls?.full;
    if (!imageUrl) {
      const errorMessage = "Invalid API response: missing image URL";
      console.error("❌ API Error:", errorMessage);
      showToastError(getMessage("errorFailedToLoadImage"), 'error');
      throw new Error(errorMessage);
    }

  console.log("📥 Received new image URL:", imageUrl);
  await cacheImageUrl(imageUrl);

  // Вызываем download endpoint для отслеживания "установки" изображения
  if (jsonData.links?.download_location) {
    if (localStorage.getItem(USER_CONSENT_KEY) === "true") {
      try {
              await fetch('https://tabskin.ru/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          downloadLocation: jsonData.links.download_location
        })
      });
      console.log("📊 Download endpoint called for tracking");
    } catch (error) {
      console.warn("⚠️ Failed to call download endpoint:", error);
    }
    } else {
      console.warn("⚠️ User consent not granted for download location tracking.");
    }
  }

  const metadata = {
    url: imageUrl,
    authorName: jsonData.user?.name || "Unknown",
    photoPageLink: jsonData.links?.html || "#",
    authorProfileLink: jsonData.user?.links?.html || "#", // Используем Unsplash профиль вместо портфолио
    timestamp: Date.now()
  };

  saveImageMetadata(metadata);
  triggerFadeTransition(imageUrl);
    applyStoredImageMetadata();
    console.log("🎨 New image applied with metadata");
    
    // Сервер доступен, сбрасываем флаг
    isServerAvailable = true;
    
  } catch (error) {
    console.error("❌ fetchAndUpdateImage failed:", error);
    isServerAvailable = false;
    showToastError(getMessage("errorFailedToLoadImage"), 'error');
  }
}

// Улучшенная функция fetch с retry логикой и timeout
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      // Если это последняя попытка, возвращаем ответ
      if (i === retries - 1) {
        return response;
      }
      
    } catch (error) {
      console.warn(`⚠️ Fetch attempt ${i + 1} failed:`, error.message);
      
      // Если это последняя попытка, выбрасываем ошибку
      if (i === retries - 1) {
        throw error;
      }
      
      // Ждем перед следующей попыткой
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (i + 1)));
    }
  }
}

// Кэширование изображения
async function cacheImageUrl(imageUrl) {
  const cacheStorage = await caches.open(CACHE_NAME);
  if (!(await cacheStorage.match(imageUrl))) {
    try {
      await cacheStorage.add(imageUrl);
      console.log("🗄 Image added to cache:", imageUrl);
      
      // Проверяем размер кэша после добавления нового изображения
      await cleanupCacheBySize();
    } catch (error) {
      console.warn("⚠️ Failed to cache image:", error);
    }
  }
}

// Сохранение метаданных изображения
function saveImageMetadata({ url, authorName, photoPageLink, authorProfileLink, timestamp }) {
  // Добавляем utm-метки к ссылкам на Unsplash
  const photoLinkWithUtm = photoPageLink && photoPageLink !== '#' ? photoPageLink + UNSPLASH_UTM : photoPageLink;
  const authorLinkWithUtm = authorProfileLink && authorProfileLink !== '#' ? authorProfileLink + UNSPLASH_UTM : authorProfileLink;

  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}Url`, url);
  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}Creator`, authorName);
  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}PhotoLink`, photoLinkWithUtm);
  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}CreatorLink`, authorLinkWithUtm);
  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}LoadTime`, timestamp.toString());
  console.log("💾 Image metadata saved");
}

// Отображение сохранённых метаданных
function applyStoredImageMetadata() {
  const storedAuthor = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}Creator`) || "";
  const storedPhotoLink = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}PhotoLink`) || "#";
  const storedAuthorLink = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}CreatorLink`) || "#";

  backgroundAuthorLink.textContent = storedAuthor;
  backgroundAuthorLink.href = storedAuthorLink;
  backgroundImageLink.href = storedPhotoLink;

  console.log("🔗 Restored image metadata:", { storedAuthor, storedPhotoLink, storedAuthorLink });
}

// Плавный переход нового изображения
function triggerFadeTransition(newImageUrl) {
  document.getElementById(DYNAMIC_STYLE_ID)?.remove();

  const dynamicCss = `
    body::after {
      background-image: url("${newImageUrl}");
      opacity: 1;
    }
  `;
  const styleTag = document.createElement("style");
  styleTag.id = DYNAMIC_STYLE_ID;
  styleTag.textContent = dynamicCss;
  document.head.appendChild(styleTag);

  setTimeout(() => {
    document.body.style.backgroundImage = `url("${newImageUrl}")`;
    document.getElementById(DYNAMIC_STYLE_ID)?.remove();
    console.log("✨ Fade transition completed");
  }, FADE_DURATION_MS);
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
  await cacheStorage.keys().then(keys => {
    keys.forEach(request => cacheStorage.delete(request));
  });
  console.log("🗑 Cache cleared");
}

// Очистка локального хранилища по кнопке
function clearLocalStorage() {
  localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}Url`);
  localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}Creator`);
  localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}PhotoLink`);
  localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}CreatorLink`);
  localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}LoadTime`);
  console.log("🗑 Local storage cleared");
}

// Получение размера кэша
async function getCacheSize() {
  try {
    const cacheStorage = await caches.open(CACHE_NAME);
    const keys = await cacheStorage.keys();
    let totalSize = 0;
    
    for (const request of keys) {
      try {
        const response = await cacheStorage.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      } catch (error) {
        console.warn("⚠️ Error calculating size for cached item:", error);
      }
    }
    
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
    const keys = await cacheStorage.keys();
    const sizeLimit = CACHE_SIZE_LIMIT_MB * 1024 * 1024; // Конвертируем в байты
    
    let totalSize = 0;
    const items = [];
    
    // Собираем информацию о всех кэшированных элементах
    for (const request of keys) {
      try {
        const response = await cacheStorage.match(request);
        if (response) {
          const blob = await response.blob();
          const size = blob.size;
          totalSize += size;
          
          items.push({
            request,
            size,
            date: new Date(response.headers.get('date') || Date.now()).getTime()
          });
        }
      } catch (error) {
        console.warn("⚠️ Error processing cached item:", error);
      }
    }
    
    // Если размер превышает лимит, удаляем старые элементы
    if (totalSize > sizeLimit) {
      // Сортируем по дате (старые сначала)
      items.sort((a, b) => a.date - b.date);
      
      let removedSize = 0;
      let removedCount = 0;
      
      for (const item of items) {
        if (totalSize - removedSize <= sizeLimit) break;
        
        await cacheStorage.delete(item.request);
        removedSize += item.size;
        removedCount++;
      }
      
      if (removedCount > 0) {
        console.log(`🗑 Cache size limit exceeded, removed ${removedCount} items (${formatCacheSize(removedSize)})`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error during cache size cleanup:", error);
  }
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
  if (!cachedSettings) {
    cachedSettings = loadUserSettings();
    cachedLanguage = cachedSettings.language || "en";
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

