// Settings Management Module
// Отдельный модуль для управления настройками расширения

class SettingsManager {
  constructor() {
    this.settingsModal = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.isToggling = false; // Защита от множественных вызовов
    // НЕ инициализируем сразу - только при первом использовании
    
    // Добавляем обработчик кнопки настроек сразу
    this.setupSettingsButton();
  }

  // Настройка кнопки настроек (вызывается сразу)
  setupSettingsButton() {
    const settingsToggleButton = document.querySelector("#settingsToggle");
    if (settingsToggleButton) {
      // Удаляем все существующие обработчики
      const newButton = settingsToggleButton.cloneNode(true);
      settingsToggleButton.parentNode.replaceChild(newButton, settingsToggleButton);
      
      // Добавляем новый обработчик
      newButton.addEventListener("click", () => this.toggleSettings());
      console.log("🔘 Settings button handler attached (clean)");
    } else {
      console.warn("⚠️ Settings button not found, retrying...");
      // Повторная попытка через небольшую задержку
      setTimeout(() => this.setupSettingsButton(), 100);
    }
  }

  // Ленивая инициализация модуля настроек
  async init() {
    if (this.isInitialized || this.isInitializing) return;
    
    this.isInitializing = true;
    
    try {
      await this.loadSettingsHTML();
      this.setupEventListeners();
      this.isInitialized = true;
      console.log("⚙️ Settings module initialized");
    } catch (error) {
      console.error("❌ Failed to initialize settings module:", error);
    } finally {
      this.isInitializing = false;
    }
  }

  // Загрузка HTML настроек (оптимизированная)
  async loadSettingsHTML() {
    // Проверяем, может HTML уже загружен
    if (this.settingsModal) return;
    
    try {
      // Встроенный HTML (как в Momentum) - убираем fetch запрос
      const html = `
        <div id="settingsModal" class="settings-modal hidden">
          <div class="settings-content">
            <h2 data-i18n="settingsTitle">Settings</h2>
            <label>
              <span data-i18n="language">Language:</span>
              <select id="languageSelect">
                <option value="en" data-i18n="english">English</option>
                <option value="ru" data-i18n="russian">Русский</option>
              </select>
            </label>
            <label>
              <span data-i18n="timeFormat">Time format:</span>
              <select id="timeFormatSelect">
                <option value="24" data-i18n="time24Hour">24-hour format</option>
                <option value="12" data-i18n="time12Hour">12-hour format (AM/PM)</option>
              </select>
            </label>
            <label>
              <span data-i18n="wallpaperTheme">Wallpaper theme:</span>
              <select id="themeSelect">
                <option value="wallpapers" data-i18n="wallpapers">Wallpapers</option>
                <option value="nature" data-i18n="nature">Nature</option>
                <option value="render" data-i18n="render3d">3D Render</option>
                <option value="textures" data-i18n="textures">Texture</option>
                <option value="space" data-i18n="space">Space</option>
                <option value="travel" data-i18n="travel">Travel</option>
                <option value="film" data-i18n="film">Film</option>
                <option value="people" data-i18n="people">People</option>
                <option value="architecture" data-i18n="architecture">Architecture</option>
                <option value="street" data-i18n="streetPhotography">Street Photography</option>
              </select>
            </label>
            <label>
              <input type="checkbox" id="autoSwitchToggle" />
              <span data-i18n="autoSwitch">Automatic background change</span>
            </label>
            <label>
              <span data-i18n="changeFrequency">Change frequency:</span>
              <select id="autoSwitchInterval">
                <option value="1" data-i18n="everyMinute">Every minute</option>
                <option value="15" data-i18n="every15Minutes">Every 15 minutes</option>
                <option value="60" data-i18n="everyHour">Every hour</option>
                <option value="360" data-i18n="every6Hours">Every 6 hours</option>
              </select>
            </label>
            <label>
              <input type="checkbox" id="transitionToggle" />
              <span data-i18n="smoothTransition">Smooth transition animation</span>
            </label>
            <div class="cache-info">
              <div class="cache-details">
                <span class="cache-label" data-i18n="cacheSize">Cache size:</span>
                <span id="cacheSizeDisplay">Calculating...</span>
              </div>
              <button id="clearCacheButton" class="clear-cache-btn" data-i18n="clearCacheNow">Clear cache now</button>
            </div>
            <div class="button-group">
              <button id="saveSettings" data-i18n="save">Save</button>
              <button id="closeSettings" data-i18n="close">Close</button>
            </div>
          </div>
        </div>
      `;
      
      // Создаем временный контейнер для парсинга HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Извлекаем модальное окно настроек
      this.settingsModal = tempDiv.querySelector('#settingsModal');
      if (!this.settingsModal) {
        throw new Error('Settings modal not found in HTML');
      }
      
      // Добавляем в DOM
      document.body.appendChild(this.settingsModal);
      
      // Применяем локализацию к модальному окну сразу после создания
      this.applyLocalizationToModal();
      
    } catch (error) {
      console.error("❌ Failed to load settings HTML:", error);
      throw error;
    }
  }

  // Применение локализации к модальному окну
  applyLocalizationToModal() {
    if (!this.settingsModal) return;
    
    // Используем новую централизованную функцию
    window.localizeContainer(this.settingsModal);
    
    console.log("🌐 Settings modal localized");
  }

  // Настройка обработчиков событий
  setupEventListeners() {
    // Обработчики внутри модального окна
    const closeButton = this.settingsModal.querySelector("#closeSettings");
    const saveButton = this.settingsModal.querySelector("#saveSettings");
    const clearCacheButton = this.settingsModal.querySelector("#clearCacheButton");

    if (closeButton) {
      closeButton.addEventListener("click", () => this.closeSettings());
    }

    if (saveButton) {
      saveButton.addEventListener("click", () => this.saveSettings());
    }

    if (clearCacheButton) {
      clearCacheButton.addEventListener("click", () => this.clearCache());
    }

    // Обработчик изменения языка
    const languageSelect = this.settingsModal.querySelector("#languageSelect");
    if (languageSelect) {
      languageSelect.addEventListener("change", (event) => {
        const selectedLanguage = event.target.value;
        console.log("🌐 Language changed to:", selectedLanguage);
        this.applyLanguage(selectedLanguage);
      });
    }
  }

  // Открытие/закрытие настроек (с ленивой инициализацией)
  async toggleSettings() {
    // Защита от множественных вызовов
    if (this.isToggling) {
      console.log("🔘 Toggle already in progress, ignoring...");
      return;
    }
    
    this.isToggling = true;
    
    try {
      console.log("🔘 toggleSettings called, isInitialized:", this.isInitialized);
      
      // Инициализируем при первом использовании
      if (!this.isInitialized) {
        console.log("⚙️ Initializing settings module...");
        await this.init();
        // Небольшая задержка для стабильности
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      if (!this.settingsModal) {
        console.error("❌ Settings modal not available");
        return;
      }
      
      const isModalOpen = !this.settingsModal.classList.contains("hidden");
      console.log("🔘 Modal is open:", isModalOpen);
      
      if (isModalOpen) {
        this.closeSettings();
      } else {
        this.openSettings();
      }
    } finally {
      // Сбрасываем флаг через небольшую задержку
      setTimeout(() => {
        this.isToggling = false;
      }, 100);
    }
  }

  // Открытие настроек
  openSettings() {
    console.log("🔓 Opening settings...");
    console.log("🔓 settingsModal:", this.settingsModal);
    console.log("🔓 settingsModal.classList:", this.settingsModal?.classList);
    
    this.loadCurrentSettings();
    this.updateCacheSizeDisplay();
    
    // Убираем класс hidden
    this.settingsModal.classList.remove("hidden");
    console.log("🔓 After removing hidden, classList:", this.settingsModal.classList);
    
    this.updateToastZIndex();
    console.log("🔓 Settings modal opened");
  }

  // Закрытие настроек
  closeSettings() {
    console.log("🔒 Closing settings...");
    console.log("🔒 settingsModal:", this.settingsModal);
    console.log("🔒 settingsModal.classList before:", this.settingsModal?.classList);
    
    this.settingsModal.classList.add("hidden");
    console.log("🔒 settingsModal.classList after:", this.settingsModal?.classList);
    
    this.updateToastZIndex();
    console.log("🔒 Settings modal closed");
  }

  // Загрузка текущих настроек в форму
  loadCurrentSettings() {
    const settings = window.loadUserSettings();
    
    const elements = {
      languageSelect: settings.language || "en",
      timeFormatSelect: settings.timeFormat || "24",
      themeSelect: settings.theme,
      autoSwitchToggle: settings.autoSwitchEnabled,
      autoSwitchInterval: settings.autoSwitchIntervalMinutes,
      transitionToggle: settings.transitionEnabled
    };

    // Применяем настройки к элементам формы
    Object.entries(elements).forEach(([selector, value]) => {
      const element = this.settingsModal.querySelector(`#${selector}`);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = value;
        } else {
          element.value = value;
        }
      }
    });
  }

  // Сохранение настроек
  saveSettings() {
    const newSettings = {
      language: this.settingsModal.querySelector("#languageSelect").value,
      timeFormat: this.settingsModal.querySelector("#timeFormatSelect").value,
      theme: this.settingsModal.querySelector("#themeSelect").value,
      autoSwitchEnabled: this.settingsModal.querySelector("#autoSwitchToggle").checked,
      autoSwitchIntervalMinutes: Number(this.settingsModal.querySelector("#autoSwitchInterval").value),
      transitionEnabled: this.settingsModal.querySelector("#transitionToggle").checked
    };

    window.saveUserSettings(newSettings);
    window.applyUserSettings();
    
    // Показываем уведомление об успешном сохранении
    const successMessage = window.getMessage("settingsSaved");
    window.showToastError(successMessage, 'success');
    
    this.closeSettings();
  }

  // Применение языка
  applyLanguage(languageCode) {
    const settings = window.loadUserSettings();
    settings.language = languageCode;
    window.saveUserSettings(settings);
    
    window.applyLocalizedPageTitle();
    window.applyLocalization();
    
    // Перелокализуем модальное окно настроек, если оно уже создано
    if (this.settingsModal) {
      this.applyLocalizationToModal();
    }
    
    console.log("🌐 Language applied:", languageCode);
  }

  // Очистка кэша
  async clearCache() {
    const clearCacheButton = this.settingsModal.querySelector("#clearCacheButton");
    
    try {
      clearCacheButton.disabled = true;
      clearCacheButton.textContent = "Clearing...";
      
      await window.clearCache();
      window.clearLocalStorage();
      
      const message = window.getMessage("cacheCleared");
      window.showToastError(message, 'success');
      
      this.updateCacheSizeDisplay();
      console.log("🗑 Cache cleared manually");
    } catch (error) {
      console.error("❌ Error clearing cache:", error);
      window.showToastError(window.getMessage("errorFailedToClearCache"), 'error');
    } finally {
      clearCacheButton.disabled = false;
      clearCacheButton.textContent = window.getMessage("clearCacheNow");
    }
  }

  // Обновление отображения размера кэша
  async updateCacheSizeDisplay() {
    const cacheSizeDisplay = this.settingsModal.querySelector('#cacheSizeDisplay');
    if (!cacheSizeDisplay) return;
    
    try {
      cacheSizeDisplay.textContent = "Calculating...";
      const size = await window.getCacheSize();
      cacheSizeDisplay.textContent = window.formatCacheSize(size);
    } catch (error) {
      console.error("❌ Error updating cache size display:", error);
      cacheSizeDisplay.textContent = "Error";
    }
  }

  // Управление z-index toast-уведомлений
  updateToastZIndex() {
    const toastContainer = document.getElementById("toastContainer");
    
    if (toastContainer && this.settingsModal) {
      const isModalOpen = !this.settingsModal.classList.contains("hidden");
      if (isModalOpen) {
        toastContainer.style.zIndex = "10020";
      } else {
        toastContainer.style.zIndex = "10001";
      }
    }
  }

  // Проверка инициализации
  isReady() {
    return this.isInitialized && this.settingsModal;
  }
}

// Экспорт для использования в основном файле
window.SettingsManager = SettingsManager; 