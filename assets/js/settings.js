// Settings Management Module
// Отдельный модуль для управления настройками расширения

class SettingsManager {
  constructor() {
    this.settingsModal = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.isToggling = false; // Защита от множественных вызовов
    this.previouslyFocusedElement = null;
    this.handleDocumentPointerDown = (event) => this.onDocumentPointerDown(event);
    this.openPicker = null;
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
      this.initPickers();
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
                <div class="settings-group-card">
                  <div class="settings-row">
                    <span class="settings-row-label" data-i18n="language">Language</span>
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
                    <span class="settings-row-label" data-i18n="timeFormat">Time format</span>
                    <div class="settings-control">
                      <div class="segmented-control" role="radiogroup" aria-label="Time format">
                        <label class="segmented-option">
                          <input type="radio" name="timeFormat" value="24" />
                          <span data-i18n="time24Hour">24 hour</span>
                        </label>
                        <label class="segmented-option">
                          <input type="radio" name="timeFormat" value="12" />
                          <span data-i18n="time12Hour">12 hour</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section class="settings-group" aria-label="Background settings">
                <h3 class="settings-group-title" data-i18n="settingsGroupBackground">Background</h3>
                <div class="settings-group-card">
                  <div class="settings-row">
                    <span class="settings-row-label" data-i18n="wallpaperTheme">Wallpaper theme</span>
                    <span class="settings-control">
                      <div class="settings-picker">
                        <select id="themeSelect" class="settings-picker-native" tabindex="-1" aria-hidden="true">
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
                      </div>
                    </span>
                  </div>
                  <label class="settings-row settings-row-switch">
                    <span class="settings-row-label" data-i18n="autoSwitch">Automatic background change</span>
                    <span class="settings-control">
                      <input class="switch-input" type="checkbox" id="autoSwitchToggle" />
                      <span class="switch-track" aria-hidden="true"></span>
                    </span>
                  </label>
                  <div class="settings-row">
                    <span class="settings-row-label" data-i18n="changeFrequency">Change frequency</span>
                    <span class="settings-control">
                      <div class="settings-picker">
                        <select id="autoSwitchInterval" class="settings-picker-native" tabindex="-1" aria-hidden="true">
                          <option value="15" data-i18n="every15Minutes">Every 15 minutes</option>
                          <option value="60" data-i18n="everyHour">Every hour</option>
                          <option value="360" data-i18n="every6Hours">Every 6 hours</option>
                        </select>
                      </div>
                    </span>
                  </div>
                </div>
              </section>

              <section class="settings-group" aria-label="Performance and storage settings">
                <h3 class="settings-group-title" data-i18n="settingsGroupPerformance">Performance</h3>
                <div class="settings-group-card">
                  <label class="settings-row settings-row-switch">
                    <span class="settings-row-label" data-i18n="smoothTransition">Smooth transition animation</span>
                    <span class="settings-control">
                      <input class="switch-input" type="checkbox" id="transitionToggle" />
                      <span class="switch-track" aria-hidden="true"></span>
                    </span>
                  </label>
                  <label class="settings-row settings-row-switch">
                    <span class="settings-row-label" data-i18n="performanceMode">Optimized image size</span>
                    <span class="settings-control">
                      <input class="switch-input" type="checkbox" id="performanceModeToggle" />
                      <span class="switch-track" aria-hidden="true"></span>
                    </span>
                  </label>
                </div>
                <div class="settings-group-card">
                  <div class="settings-row settings-row-static">
                    <span class="settings-row-label" data-i18n="cacheSize">Cache size</span>
                    <span class="settings-control settings-control-value">
                      <span id="cacheSizeDisplay">Calculating...</span>
                    </span>
                  </div>
                </div>
                <div class="settings-group-card">
                  <button id="clearCacheButton" class="settings-destructive-btn" type="button" data-i18n="clearCacheNow">Clear cache</button>
                </div>
              </section>
            </div>
            <div class="button-group">
              <button id="saveSettings" type="button" data-i18n="done">Done</button>
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
    this.syncAllPickers();
    
    console.log("🌐 Settings modal localized");
  }

  initPickers() {
    if (!this.settingsModal) return;

    this.settingsModal.querySelectorAll(".settings-picker").forEach((picker) => {
      if (picker.dataset.pickerReady === "true") return;

      const select = picker.querySelector("select.settings-picker-native");
      if (!select) return;

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "settings-picker-trigger";
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");

      const valueLabel = document.createElement("span");
      valueLabel.className = "settings-picker-value";

      const chevron = document.createElement("span");
      chevron.className = "settings-chevron";
      chevron.setAttribute("aria-hidden", "true");
      chevron.textContent = "›";

      trigger.append(valueLabel, chevron);

      const menu = document.createElement("div");
      menu.className = "settings-picker-menu";
      menu.setAttribute("role", "listbox");
      menu.hidden = true;

      Array.from(select.options).forEach((option) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "settings-picker-option";
        item.setAttribute("role", "option");
        item.dataset.value = option.value;
        item.textContent = option.textContent;

        item.addEventListener("click", (event) => {
          event.stopPropagation();
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          this.syncPicker(picker);
          this.closePicker(picker);
        });

        menu.appendChild(item);
      });

      trigger.addEventListener("click", (event) => {
        event.stopPropagation();
        if (this.openPicker === picker) {
          this.closePicker(picker);
        } else {
          this.openPickerMenu(picker);
        }
      });

      picker.pickerMenu = menu;
      picker.append(trigger, menu);
      picker.dataset.pickerReady = "true";
      this.syncPicker(picker);
    });
  }

  getPickerMenu(picker) {
    return picker?.pickerMenu || null;
  }

  syncPicker(picker) {
    const select = picker.querySelector("select.settings-picker-native");
    const valueLabel = picker.querySelector(".settings-picker-value");
    const menu = this.getPickerMenu(picker);
    const options = menu ? menu.querySelectorAll(".settings-picker-option") : [];
    if (!select || !valueLabel) return;

    const selectedOption = select.options[select.selectedIndex];
    valueLabel.textContent = selectedOption ? selectedOption.textContent : "";

    options.forEach((item) => {
      const isSelected = item.dataset.value === select.value;
      item.classList.toggle("is-selected", isSelected);
      item.setAttribute("aria-selected", isSelected ? "true" : "false");
    });

    const trigger = picker.querySelector(".settings-picker-trigger");
    if (trigger && select.id) {
      trigger.setAttribute("aria-labelledby", select.id);
    }
  }

  syncAllPickers() {
    if (!this.settingsModal) return;
    this.settingsModal.querySelectorAll(".settings-picker").forEach((picker) => {
      const select = picker.querySelector("select.settings-picker-native");
      const menu = this.getPickerMenu(picker);
      if (!select || !menu) return;

      const optionButtons = Array.from(menu.querySelectorAll(".settings-picker-option"));
      Array.from(select.options).forEach((option, index) => {
        if (optionButtons[index]) {
          optionButtons[index].textContent = option.textContent;
        }
      });

      this.syncPicker(picker);
    });
  }

  openPickerMenu(picker) {
    if (this.openPicker && this.openPicker !== picker) {
      this.closePicker(this.openPicker);
    }

    const menu = this.getPickerMenu(picker);
    const trigger = picker.querySelector(".settings-picker-trigger");
    if (!menu || !trigger) return;

    document.body.appendChild(menu);
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    picker.classList.add("is-open");
    this.openPicker = picker;
    this.positionPickerMenu(picker);

    if (!this.documentPickerListenerAttached) {
      document.addEventListener("pointerdown", this.handleDocumentPointerDown, true);
      this.documentPickerListenerAttached = true;
    }
  }

  closePicker(picker) {
    if (!picker) return;

    const menu = this.getPickerMenu(picker);
    const trigger = picker.querySelector(".settings-picker-trigger");
    if (menu) {
      menu.hidden = true;
      menu.style.top = "";
      menu.style.left = "";
      menu.style.width = "";
      menu.classList.remove("settings-picker-menu--above");
      picker.appendChild(menu);
    }
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    picker.classList.remove("is-open");

    if (this.openPicker === picker) {
      this.openPicker = null;
    }

    if (!this.openPicker && this.documentPickerListenerAttached) {
      document.removeEventListener("pointerdown", this.handleDocumentPointerDown, true);
      this.documentPickerListenerAttached = false;
    }
  }

  closeAllPickers() {
    if (!this.settingsModal) return;
    this.settingsModal.querySelectorAll(".settings-picker.is-open").forEach((picker) => {
      this.closePicker(picker);
    });
  }

  positionPickerMenu(picker) {
    const menu = this.getPickerMenu(picker);
    const trigger = picker.querySelector(".settings-picker-trigger");
    if (!menu || !trigger) return;

    menu.classList.remove("settings-picker-menu--above");
    const triggerRect = trigger.getBoundingClientRect();
    const menuWidth = Math.min(Math.max(triggerRect.width, 200), window.innerWidth - 16);
    const menuHeight = Math.min(menu.scrollHeight, 240);
    const gap = 6;

    let left = Math.min(
      Math.max(8, triggerRect.right - menuWidth),
      window.innerWidth - menuWidth - 8
    );

    let top = triggerRect.bottom + gap;
    let openAbove = false;

    if (top + menuHeight > window.innerHeight - 8 && triggerRect.top - gap - menuHeight > 8) {
      top = triggerRect.top - gap - menuHeight;
      openAbove = true;
    }

    menu.style.width = `${menuWidth}px`;
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.classList.toggle("settings-picker-menu--above", openAbove);
  }

  onDocumentPointerDown(event) {
    if (!this.openPicker) return;
    const menu = this.getPickerMenu(this.openPicker);
    if (this.openPicker.contains(event.target)) return;
    if (menu && menu.contains(event.target)) return;
    this.closePicker(this.openPicker);
  }

  // Настройка обработчиков событий
  setupEventListeners() {
    // Обработчики внутри модального окна
    const saveButton = this.settingsModal.querySelector("#saveSettings");
    const clearCacheButton = this.settingsModal.querySelector("#clearCacheButton");

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
      if (this.openPicker) {
        event.preventDefault();
        event.stopPropagation();
        this.closePicker(this.openPicker);
        return;
      }
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
    
    this.closeAllPickers();
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

    this.syncAllPickers();
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