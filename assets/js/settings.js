// Settings Management Module
// Отдельный модуль для управления настройками расширения

class SettingsManager {
  constructor() {
    this.settingsModal = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.isToggling = false; // Защита от множественных вызовов
    this.previouslyFocusedElement = null;
    this.handleModalKeydown = (event) => this.onModalKeydown(event);
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
          <div class="settings-content" role="dialog" aria-modal="true" aria-labelledby="settingsModalTitle" tabindex="-1">
            <div class="settings-header">
              <h2 id="settingsModalTitle" data-i18n="settingsTitle">Settings</h2>
            </div>
            <div class="settings-groups">
              <section class="settings-group" aria-label="Interface settings">
                <h3 class="settings-group-title" data-i18n="settingsGroupInterface">Interface</h3>
                <div class="settings-row">
                  <span class="settings-row-label" data-i18n="language">Language:</span>
                  <div class="settings-control">
                    <div class="segmented-control" role="radiogroup" aria-label="Language">
                      <label class="segmented-option">
                        <input type="radio" name="language" value="en" />
                        <span data-i18n="english">English</span>
                      </label>
                      <label class="segmented-option">
                        <input type="radio" name="language" value="ru" />
                        <span data-i18n="russian">Русский</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div class="settings-row">
                  <span class="settings-row-label" data-i18n="timeFormat">Time format:</span>
                  <div class="settings-control">
                    <div class="segmented-control" role="radiogroup" aria-label="Time format">
                      <label class="segmented-option">
                        <input type="radio" name="timeFormat" value="24" />
                        <span data-i18n="time24Hour">24-hour format</span>
                      </label>
                      <label class="segmented-option">
                        <input type="radio" name="timeFormat" value="12" />
                        <span data-i18n="time12Hour">12-hour format (AM/PM)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              <section class="settings-group" aria-label="Background settings">
                <h3 class="settings-group-title" data-i18n="settingsGroupBackground">Background</h3>
                <label class="settings-row" for="themeSelect">
                  <span class="settings-row-label" data-i18n="wallpaperTheme">Wallpaper theme:</span>
                  <span class="settings-control">
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
                  </span>
                </label>
                <label class="settings-row settings-row-switch">
                  <span class="settings-row-label" data-i18n="autoSwitch">Automatic background change</span>
                  <span class="settings-control">
                    <input class="switch-input" type="checkbox" id="autoSwitchToggle" />
                    <span class="switch-track" aria-hidden="true"></span>
                  </span>
                </label>
                <label class="settings-row" for="autoSwitchInterval">
                  <span class="settings-row-label" data-i18n="changeFrequency">Change frequency:</span>
                  <span class="settings-control">
                    <select id="autoSwitchInterval">
                      <option value="15" data-i18n="every15Minutes">Every 15 minutes</option>
                      <option value="60" data-i18n="everyHour">Every hour</option>
                      <option value="360" data-i18n="every6Hours">Every 6 hours</option>
                    </select>
                  </span>
                </label>
              </section>

              <section class="settings-group" aria-label="Performance and storage settings">
                <h3 class="settings-group-title" data-i18n="settingsGroupPerformance">Performance</h3>
                <label class="settings-row settings-row-switch">
                  <span class="settings-row-label" data-i18n="smoothTransition">Smooth transition animation</span>
                  <span class="settings-control">
                    <input class="switch-input" type="checkbox" id="transitionToggle" />
                    <span class="switch-track" aria-hidden="true"></span>
                  </span>
                </label>
                <label class="settings-row settings-row-switch">
                  <span class="settings-row-label" data-i18n="performanceMode">Performance mode (optimized image size)</span>
                  <span class="settings-control">
                    <input class="switch-input" type="checkbox" id="performanceModeToggle" />
                    <span class="switch-track" aria-hidden="true"></span>
                  </span>
                </label>
                <div class="settings-row cache-row">
                  <div class="settings-row-label">
                    <span data-i18n="cacheSize">Cache size:</span>
                    <span id="cacheSizeDisplay">Calculating...</span>
                  </div>
                  <div class="settings-control">
                    <button id="clearCacheButton" class="clear-cache-btn" type="button" data-i18n="clearCacheNow">Clear cache now</button>
                  </div>
                </div>
              </section>
            </div>
            <div class="button-group">
              <button id="saveSettings" type="button" data-i18n="save">Save</button>
              <button id="closeSettings" type="button" data-i18n="close">Close</button>
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
      this.settingsModal.addEventListener("keydown", this.handleModalKeydown);
      
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
    this.settingsModal.querySelectorAll('input[name="language"]').forEach((input) => {
      input.addEventListener("change", (event) => {
        if (!event.target.checked) return;
        const selectedLanguage = event.target.value;
        console.log("🌐 Language changed to:", selectedLanguage);
        this.applyLanguage(selectedLanguage);
      });
    });
  }

  getFocusableElements() {
    if (!this.settingsModal) return [];
    return Array.from(this.settingsModal.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )).filter((element) => element.offsetParent !== null || element === document.activeElement);
  }

  onModalKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      this.closeSettings();
      return;
    }

    if (event.key !== "Tab") return;
    const focusableElements = this.getFocusableElements();
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
    
    this.previouslyFocusedElement = document.activeElement;
    this.loadCurrentSettings();
    this.updateCacheSizeDisplay();
    
    // Убираем класс hidden
    this.settingsModal.classList.remove("hidden");
    const firstFocusableElement = this.getFocusableElements()[0] || this.settingsModal.querySelector(".settings-content");
    firstFocusableElement?.focus();
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
    if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === "function") {
      this.previouslyFocusedElement.focus();
    }
    console.log("🔒 settingsModal.classList after:", this.settingsModal?.classList);
    
    this.updateToastZIndex();
    console.log("🔒 Settings modal closed");
  }

  // Загрузка текущих настроек в форму
  loadCurrentSettings() {
    const settings = window.loadUserSettings();
    
    const elements = {
      themeSelect: settings.theme,
      autoSwitchToggle: settings.autoSwitchEnabled,
      autoSwitchInterval: settings.autoSwitchIntervalMinutes,
      transitionToggle: settings.transitionEnabled,
      performanceModeToggle: settings.performanceModeEnabled
    };

    this.setRadioValue("language", settings.language || "en");
    this.setRadioValue("timeFormat", settings.timeFormat || "24");

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
      language: this.getRadioValue("language", "en"),
      timeFormat: this.getRadioValue("timeFormat", "24"),
      theme: this.settingsModal.querySelector("#themeSelect").value,
      autoSwitchEnabled: this.settingsModal.querySelector("#autoSwitchToggle").checked,
      autoSwitchIntervalMinutes: Number(this.settingsModal.querySelector("#autoSwitchInterval").value),
      transitionEnabled: this.settingsModal.querySelector("#transitionToggle").checked,
      performanceModeEnabled: this.settingsModal.querySelector("#performanceModeToggle").checked
    };

    window.saveUserSettings(newSettings);
    window.applyUserSettings();
    
    // Показываем уведомление об успешном сохранении
    const successMessage = window.getMessage("settingsSaved");
    window.showToastError(successMessage, 'success');
    
    this.closeSettings();
  }

  getRadioValue(name, fallbackValue) {
    return this.settingsModal.querySelector(`input[name="${name}"]:checked`)?.value || fallbackValue;
  }

  setRadioValue(name, value) {
    const input = this.settingsModal.querySelector(`input[name="${name}"][value="${value}"]`);
    if (input) input.checked = true;
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