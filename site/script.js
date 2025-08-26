document.addEventListener("DOMContentLoaded", () => {
  const playButton = document.getElementById("playButton")

  const translations = {
    ru: {
      "demo-video-alert": "Демо-видео скоро будет доступно!",
      "coming-soon": "Скоро будет доступно!"
    },
    en: {
      "demo-video-alert": "The demo video will be available soon!",
      "coming-soon": "Coming soon!"
    }
  }

  // Обработка кнопок загрузки (только для Edge, так как Chrome и Firefox имеют реальные ссылки)
  const edgeButton = document.querySelector('.coming-soon-btn')
  if (edgeButton) {
    edgeButton.addEventListener('click', function(e) {
      e.preventDefault()
      const currentLang = getCurrentLanguage()
      alert(`${translations[currentLang]["coming-soon"]} Edge версия будет доступна в ближайшее время.`)
    })
  }

  if (playButton) {
    playButton.addEventListener("click", () => {
      const currentLang = getCurrentLanguage()
      alert(translations[currentLang]["demo-video-alert"])
    })
  }

  const featureCards = document.querySelectorAll(".feature-card")
  featureCards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-8px) scale(1.02)"
    })

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0) scale(1)"
    })
  })

  const browserNames = {
    ru: {
      Chrome: "Chrome",
      Firefox: "Firefox",
      Edge: "Edge"
    },
    en: {
      Chrome: "Chrome",
      Firefox: "Firefox",
      Edge: "Edge"
    }
  }

  const browserIcons = document.querySelectorAll(".browser-icon")
  browserIcons.forEach((icon) => {
    icon.addEventListener("click", function () {
      const currentLang = getCurrentLanguage()
      let browserKey = "Chrome"
      if (this.classList.contains("firefox")) browserKey = "Firefox"
      if (this.classList.contains("edge")) browserKey = "Edge"
      const browserName = browserNames[currentLang] && browserNames[currentLang][browserKey] ? browserNames[currentLang][browserKey] : browserKey
      
      if (browserKey === "Edge") {
        const message = translations[currentLang]["coming-soon"] + " " + browserName + " версия будет доступна в ближайшее время."
        alert(message)
      } else {
        // Для Chrome и Firefox открываем соответствующие ссылки
        const urls = {
          Chrome: "https://chromewebstore.google.com/detail/phpikmllcahonchladgmhcphhhebncmp?utm_source=item-share-cb",
          Firefox: "https://addons.mozilla.org/addon/tabskin"
        }
        window.open(urls[browserKey], '_blank')
      }
    })
  })

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    link.setAttribute('rel', 'noopener noreferrer')
  })

  let ticking = false
  function updateParallax() {
    const scrolled = window.pageYOffset
    const parallax = document.body
    const speed = scrolled * 0.5
    parallax.style.backgroundPosition = "center " + speed + "px"
    ticking = false
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax)
      ticking = true
    }
  })

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1"
        entry.target.style.transform = "translateY(0)"
      }
    })
  }, observerOptions)

  document.querySelectorAll(".feature-card, .screenshot-item, .download-card").forEach((el) => {
    el.style.opacity = "0"
    el.style.transform = "translateY(30px)"
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease"
    observer.observe(el)
  })

  const screenshots = document.querySelectorAll(".screenshot-item")
  screenshots.forEach((screenshot) => {
    screenshot.addEventListener("click", () => {
      console.log("Screenshot clicked")
    })
  })
})
