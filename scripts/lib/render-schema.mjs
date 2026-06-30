import {
  BASE_URL,
  GA_ID,
  LOGO_URL,
  OG_IMAGE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  THEME_COLOR,
  YM_ID,
} from "./site-constants.mjs"

const PUBLISHER = {
  "@type": "Organization",
  name: "Tabskin",
  logo: { "@type": "ImageObject", url: `${BASE_URL}${LOGO_URL}` },
}

function articleSchema({ headline, description, url, datePublished, dateModified, lang }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: `${BASE_URL}${OG_IMAGE}`,
    author: { "@type": "Organization", name: "Tabskin" },
    publisher: PUBLISHER,
    inLanguage: lang,
    datePublished,
    dateModified,
  }
}

function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

const SCHEMA_BUILDERS = {
  softwareApplicationRu: () => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Tabskin",
    applicationCategory: "BrowserApplication",
    operatingSystem: "Chrome, Firefox, Edge",
    description:
      "Tabskin — бесплатное расширение для браузера, которое превращает новую вкладку в минималистичную страницу с обоями Unsplash, часами и локальными настройками без рекламы.",
    url: `${BASE_URL}/`,
    image: `${BASE_URL}${OG_IMAGE}`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "Tabskin" },
  }),
  softwareApplicationEn: () => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Tabskin",
    applicationCategory: "BrowserApplication",
    operatingSystem: "Chrome, Firefox, Edge",
    description:
      "Tabskin is a free browser extension that turns the new tab into a minimalist page with Unsplash wallpapers, a clock, and local settings without ads.",
    url: `${BASE_URL}/en/`,
    image: `${BASE_URL}${OG_IMAGE}`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "Tabskin" },
  }),
  webSiteRu: () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Tabskin",
    url: `${BASE_URL}/`,
    inLanguage: "ru",
    publisher: PUBLISHER,
  }),
  webSiteEn: () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Tabskin",
    url: `${BASE_URL}/en/`,
    inLanguage: "en",
    publisher: PUBLISHER,
  }),
  faqHomeRu: () => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Что такое Tabskin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tabskin — бесплатное расширение для Chrome и Firefox, которое заменяет стандартную новую вкладку на минималистичную страницу с обоями Unsplash, часами и локальными настройками.",
        },
      },
      {
        "@type": "Question",
        name: "Безопасно ли расширение Tabskin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tabskin не собирает персональные данные. Настройки хранятся локально в браузере. Расширение не показывает рекламу и не добавляет сторонние трекеры.",
        },
      },
      {
        "@type": "Question",
        name: "Как установить Tabskin в Chrome или Firefox?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Нажмите «Установить для Chrome» или «Установить для Firefox» на этой странице, подтвердите установку в магазине расширений и откройте новую вкладку.",
        },
      },
      {
        "@type": "Question",
        name: "Tabskin бесплатный?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Да, Tabskin полностью бесплатен. Нет подписок, скрытых платежей и рекламы на новой вкладке.",
        },
      },
    ],
  }),
  faqHomeEn: () => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Tabskin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tabskin is a free Chrome and Firefox extension that replaces the default new tab with a minimalist page featuring Unsplash wallpapers and a clock.",
        },
      },
      {
        "@type": "Question",
        name: "Is Tabskin safe?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tabskin does not collect personal data. Settings stay local in your browser. There are no ads or third-party trackers.",
        },
      },
      {
        "@type": "Question",
        name: "How do I install Tabskin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Click Install for Chrome or Firefox on this page, confirm in the store, then open a new tab.",
        },
      },
      {
        "@type": "Question",
        name: "Is Tabskin free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Tabskin is completely free with no subscriptions or ads on the new tab page.",
        },
      },
    ],
  }),
  faqPageRu: () => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Что такое Tabskin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tabskin — бесплатное расширение для Chrome и Firefox, которое заменяет стандартную новую вкладку на минималистичную страницу с обоями Unsplash и часами.",
        },
      },
      {
        "@type": "Question",
        name: "Собирает ли Tabskin персональные данные?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Нет. Настройки сохраняются локально в браузере. Tabskin не собирает и не передаёт персональные данные.",
        },
      },
      {
        "@type": "Question",
        name: "Есть ли реклама в Tabskin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Нет. Новая вкладка остаётся чистой — без рекламы, баннеров и навязанных новостей.",
        },
      },
      {
        "@type": "Question",
        name: "Какие браузеры поддерживаются?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Сейчас Tabskin доступен для Google Chrome и Mozilla Firefox. Версия для Microsoft Edge готовится.",
        },
      },
      {
        "@type": "Question",
        name: "Откуда берутся обои?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Фотографии загружаются через Unsplash API. Tabskin показывает авторов и соблюдает условия атрибуции Unsplash.",
        },
      },
      {
        "@type": "Question",
        name: "Как удалить Tabskin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Удалите расширение через меню расширений браузера. Настройки, сохранённые локально, будут удалены вместе с расширением.",
        },
      },
    ],
  }),
  faqPageEn: () => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Tabskin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tabskin is a free Chrome and Firefox extension that replaces the default new tab with a minimalist page featuring Unsplash wallpapers and a clock.",
        },
      },
      {
        "@type": "Question",
        name: "Does Tabskin collect personal data?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Settings are stored locally in your browser. Tabskin does not collect or transmit personal data.",
        },
      },
      {
        "@type": "Question",
        name: "Are there ads in Tabskin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. The new tab stays clean — no ads, banners, or forced news.",
        },
      },
      {
        "@type": "Question",
        name: "Which browsers are supported?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tabskin is available for Google Chrome and Mozilla Firefox. A Microsoft Edge version is in progress.",
        },
      },
      {
        "@type": "Question",
        name: "Where do wallpapers come from?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Photos are loaded via the Unsplash API. Tabskin shows authors and follows Unsplash attribution requirements.",
        },
      },
      {
        "@type": "Question",
        name: "How do I uninstall Tabskin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Remove the extension from your browser's extensions menu. Locally stored settings are deleted with the extension.",
        },
      },
    ],
  }),
  howToChromeRu: () => ({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Как установить Tabskin в Google Chrome",
    description:
      "Установите расширение Tabskin из Chrome Web Store и откройте новую вкладку с обоями Unsplash.",
    image: `${BASE_URL}${OG_IMAGE}`,
    totalTime: "PT2M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Откройте Chrome Web Store",
        text: "Перейдите на страницу Tabskin в Chrome Web Store по ссылке с сайта tabskin.ru.",
        image: `${BASE_URL}${OG_IMAGE}`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Нажмите «Установить»",
        text: "Нажмите кнопку «Установить» и подтвердите добавление расширения в браузер.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Откройте новую вкладку",
        text: "Нажмите Ctrl+T (или Cmd+T на Mac), чтобы увидеть Tabskin с обоями и часами.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Настройте тему обоев",
        text: "Откройте настройки Tabskin и выберите тему обоев Unsplash по вкусу.",
      },
    ],
  }),
  howToChromeEn: () => ({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Install Tabskin in Google Chrome",
    description: "Install Tabskin from the Chrome Web Store and open a new tab with Unsplash wallpapers.",
    image: `${BASE_URL}${OG_IMAGE}`,
    totalTime: "PT2M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Open Chrome Web Store",
        text: "Go to the Tabskin page in the Chrome Web Store via tabskin.ru.",
        image: `${BASE_URL}${OG_IMAGE}`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Click Install",
        text: "Click Install and confirm adding the extension to your browser.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Open a new tab",
        text: "Press Ctrl+T (or Cmd+T on Mac) to see Tabskin with wallpapers and a clock.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Choose a wallpaper theme",
        text: "Open Tabskin settings and pick an Unsplash wallpaper theme.",
      },
    ],
  }),
  howToFirefoxRu: () => ({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Как установить Tabskin в Mozilla Firefox",
    description: "Установите расширение Tabskin из Firefox Add-ons и замените новую вкладку.",
    image: `${BASE_URL}${OG_IMAGE}`,
    totalTime: "PT2M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Откройте Firefox Add-ons",
        text: "Перейдите на страницу Tabskin в каталоге дополнений Firefox.",
        image: `${BASE_URL}${OG_IMAGE}`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Нажмите «Добавить в Firefox»",
        text: "Подтвердите установку расширения.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Откройте новую вкладку",
        text: "Нажмите Ctrl+T, чтобы увидеть Tabskin.",
      },
    ],
  }),
  howToFirefoxEn: () => ({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Install Tabskin in Mozilla Firefox",
    description: "Install Tabskin from Firefox Add-ons and replace your new tab page.",
    image: `${BASE_URL}${OG_IMAGE}`,
    totalTime: "PT2M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Open Firefox Add-ons",
        text: "Go to the Tabskin page in the Firefox Add-ons catalog.",
        image: `${BASE_URL}${OG_IMAGE}`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Click Add to Firefox",
        text: "Confirm the extension installation.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Open a new tab",
        text: "Press Ctrl+T to see Tabskin.",
      },
    ],
  }),
}

export function buildSchemas(page) {
  const blocks = []
  for (const key of page.schema || []) {
    if (key === "breadcrumb" && page.breadcrumb) {
      blocks.push(breadcrumbSchema(page.breadcrumb))
    } else if (key === "article" && page.article) {
      blocks.push(
        articleSchema({
          ...page.article,
          url: `${BASE_URL}${page.path}`,
          lang: page.lang,
        })
      )
    } else if (SCHEMA_BUILDERS[key]) {
      blocks.push(SCHEMA_BUILDERS[key]())
    }
  }
  return blocks
}

export function renderSchemaScripts(page) {
  return buildSchemas(page)
    .map((schema) => `    <script type="application/ld+json">\n    ${JSON.stringify(schema, null, 2).split("\n").join("\n    ")}\n    </script>`)
    .join("\n")
}

export function absUrl(path) {
  return `${BASE_URL}${path}`
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export { BASE_URL, GA_ID, OG_IMAGE, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, THEME_COLOR, YM_ID }
