// Пользовательские настройки
const SETTINGS_STORAGE_KEY = "userSettings";
const DEFAULT_SETTINGS = {
  theme: "wallpapers",
  autoSwitchEnabled: false,
  autoSwitchIntervalMinutes: 60,
  transitionEnabled: true
};
let autoSwitchTimerId = null;

function loadUserSettings() {
  const savedSettingsJson = localStorage.getItem(SETTINGS_STORAGE_KEY);
  return savedSettingsJson
    ? JSON.parse(savedSettingsJson)
    : { ...DEFAULT_SETTINGS };
}

function saveUserSettings(settingsObject) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsObject));
  console.log("💾 Settings saved:", settingsObject);
}

// Локализация заголовка
function applyLocalizedPageTitle() {
  const localizedTitle = typeof chrome?.i18n?.getMessage === "function"
    ? chrome.i18n.getMessage("tabTitle")
    : null;
  document.title = localizedTitle || "New Tab";
  console.log("🏷 Page title set to:", document.title);
}

// Константы приложения
// const IMAGE_API_ENDPOINT   = "http://192.168.0.106:3000/photos";
const IMAGE_API_ENDPOINT   = "http://it-cube32.ru:8000/photos";
let currentImageQuery      = loadUserSettings().theme;
const CACHE_NAME           = "background-image-cache";
const LOCAL_STORAGE_PREFIX = "lastImage";
const CACHE_TTL_MS         = 12 * 60 * 60 * 1000; // 12 часов
const FADE_DURATION_MS     = 800;
const BASE_STYLE_ID        = "base-fade-style";
const DYNAMIC_STYLE_ID     = "dynamic-fade-style";

// DOM-элементы
const backgroundAuthorLink   = document.querySelector("#creator");
const backgroundImageLink    = document.querySelector("#imageLink");
const refreshButtonElement   = document.querySelector("#changeButton");
const timeDisplayElement     = document.querySelector("#time");
const initialLoaderElement   = document.querySelector("#initialLoader");
const settingsToggleButton   = document.querySelector("#settingsToggle");
const settingsModalElement   = document.querySelector("#settingsModal");
const settingsCloseButton    = document.querySelector("#closeSettings");
const settingsSaveButton     = document.querySelector("#saveSettings");

// Панель настроек: открытие / закрытие
settingsToggleButton.addEventListener("click", () => {
  const isModalOpen = !settingsModalElement.classList.contains("hidden");
  if (isModalOpen) {
    settingsModalElement.classList.add("hidden");
    console.log("🔒 Settings modal closed");
  } else {
    const currentSettings = loadUserSettings();
    document.querySelector("#themeSelect").value          = currentSettings.theme;
    document.querySelector("#autoSwitchToggle").checked   = currentSettings.autoSwitchEnabled;
    document.querySelector("#autoSwitchInterval").value   = currentSettings.autoSwitchIntervalMinutes;
    document.querySelector("#transitionToggle").checked   = currentSettings.transitionEnabled;
    settingsModalElement.classList.remove("hidden");
    console.log("🔓 Settings modal opened");
  }
});

settingsCloseButton.addEventListener("click", () => {
  settingsModalElement.classList.add("hidden");
  console.log("🔒 Settings modal closed");
});

settingsSaveButton.addEventListener("click", () => {
  const newSettings = {
    theme: document.querySelector("#themeSelect").value,
    autoSwitchEnabled: document.querySelector("#autoSwitchToggle").checked,
    autoSwitchIntervalMinutes: Number(document.querySelector("#autoSwitchInterval").value),
    transitionEnabled: document.querySelector("#transitionToggle").checked
  };
  saveUserSettings(newSettings);
  applyUserSettings();
  settingsModalElement.classList.add("hidden");
});

// Применение пользовательских настроек
function applyUserSettings() {
  const settings = loadUserSettings();
  console.log("🛠 Applying user settings:", settings);
  currentImageQuery = settings.theme;

  if (autoSwitchTimerId !== null) {
    clearInterval(autoSwitchTimerId);
    console.log("⏹ Cleared previous auto-switch timer");
  }
  if (settings.autoSwitchEnabled) {
    autoSwitchTimerId = setInterval(() => {
      console.log("🔄 Auto-refresh triggered");
      fetchAndUpdateImage({ forceRefresh: true }).catch(console.warn);
    }, settings.autoSwitchIntervalMinutes * 60 * 1000);
    console.log(`⏱ Auto-switch interval set to ${settings.autoSwitchIntervalMinutes} minutes`);
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
  updateClockDisplay();
  setInterval(updateClockDisplay, 1000);
}

function updateClockDisplay() {
  const now = new Date();
  timeDisplayElement.textContent = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
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
window.addEventListener("load", () => {
  injectFadeStyles();
  applyLocalizedPageTitle();
  startClock();

  (async () => {
    const hadImage = await displayLastCachedImage();
    initialLoaderElement.classList.add("hidden");
    const lastLoadTime = Number(localStorage.getItem(`${LOCAL_STORAGE_PREFIX}LoadTime`)) || 0;
    const isTtlExpired = Date.now() - lastLoadTime > CACHE_TTL_MS;

    if (!hadImage || isTtlExpired) {
      console.log(isTtlExpired ? "⌛ TTL expired" : "🔎 No cache on load", "- fetching new image");
      fetchAndUpdateImage({ forceRefresh: false }).catch(console.warn);
    } else {
      console.log("✅ Cached image is fresh, no immediate fetch required");
    }
  })();

  applyUserSettings();
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
  const queryParameters = new URLSearchParams({ query: currentImageQuery });
  if (forceRefresh) queryParameters.set("refresh", Date.now().toString());

  const response = await fetch(`${IMAGE_API_ENDPOINT}?${queryParameters}`);
  if (!response.ok) throw new Error(`Server returned status ${response.status}`);

  const jsonData = await response.json();
  const imageUrl = jsonData.urls?.full;
  if (!imageUrl) throw new Error("Invalid API response: missing image URL");

  console.log("📥 Received new image URL:", imageUrl);
  await cacheImageUrl(imageUrl);

  const metadata = {
    url: imageUrl,
    authorName: jsonData.user?.name || "Unknown",
    photoPageLink: jsonData.links?.html || "#",
    authorPortfolioLink: jsonData.user?.portfolio_url || "#",
    timestamp: Date.now()
  };

  saveImageMetadata(metadata);
  triggerFadeTransition(imageUrl);

  applyStoredImageMetadata();
  console.log("🎨 New image applied with metadata");
}

// Кэширование изображения
async function cacheImageUrl(imageUrl) {
  const cacheStorage = await caches.open(CACHE_NAME);
  if (!(await cacheStorage.match(imageUrl))) {
    try {
      await cacheStorage.add(imageUrl);
      console.log("🗄 Image added to cache:", imageUrl);
    } catch (error) {
      console.warn("⚠️ Failed to cache image:", error);
    }
  }
}

// Сохранение метаданных изображения
function saveImageMetadata({ url, authorName, photoPageLink, authorPortfolioLink, timestamp }) {
  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}Url`, url);
  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}Creator`, authorName);
  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}PhotoLink`, photoPageLink);
  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}CreatorLink`, authorPortfolioLink);
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

// Показ toast-ошибки
function showToastError(messageText) {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) return;

  const toastElement = document.createElement("div");
  toastElement.className = "toast";
  toastElement.textContent = messageText;
  toastContainer.append(toastElement);

  requestAnimationFrame(() => toastElement.classList.add("show"));

  setTimeout(() => {
    toastElement.classList.replace("show", "hide");
    toastElement.addEventListener("animationend", () => toastElement.remove(), { once: true });
  }, 4000);

  console.log("🚨 Toast error displayed:", messageText);
}
