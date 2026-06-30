import {
  BASE_URL,
  GA_ID,
  OG_IMAGE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  THEME_COLOR,
  YM_ID,
  escapeHtml,
  renderSchemaScripts,
} from "./render-schema.mjs"

function analyticsBlock(page) {
  const parts = []
  if (page.analytics?.ga) {
    parts.push(`\t<!-- Google tag (gtag.js) -->
\t<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
\t<script>
\t  window.dataLayer = window.dataLayer || [];
\t  function gtag(){dataLayer.push(arguments);}
\t  gtag('js', new Date());
\t  gtag('config', '${GA_ID}');
\t</script>`)
  }
  if (page.analytics?.ym) {
    parts.push(`\t<!-- Yandex.Metrika counter -->
\t<script type="text/javascript">
\t   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
\t   m[i].l=1*new Date();
\t   for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
\t   k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
\t   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
\t   ym(${YM_ID}, "init", {
\t\t\tclickmap:true,
\t\t\ttrackLinks:true,
\t\t\taccurateTrackBounce:true,
\t\t\twebvisor:true
\t   });
\t</script>
\t<noscript><div><img src="https://mc.yandex.ru/watch/${YM_ID}" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
\t<!-- /Yandex.Metrika counter -->`)
  }
  return parts.join("\n")
}

function hreflangBlock(page) {
  if (!page.alternates) return ""
  const lines = []
  if (page.alternates.ru) {
    lines.push(`    <link rel="alternate" hreflang="ru" href="${BASE_URL}${page.alternates.ru}">`)
  }
  if (page.alternates.en) {
    lines.push(`    <link rel="alternate" hreflang="en" href="${BASE_URL}${page.alternates.en}">`)
  }
  if (page.alternates.xDefault) {
    lines.push(`    <link rel="alternate" hreflang="x-default" href="${BASE_URL}${page.alternates.xDefault}">`)
  }
  return lines.join("\n")
}

function ogLocale(lang) {
  return lang === "ru" ? "ru_RU" : "en_US"
}

function ogLocaleAlternate(lang) {
  return lang === "ru" ? "en_US" : "ru_RU"
}

export function renderHead(page) {
  const canonical = `${BASE_URL}${page.path}`
  const ogImage = `${BASE_URL}${page.og?.image || OG_IMAGE}`
  const ogType = page.og?.type || "website"
  const ogTitle = escapeHtml(page.ogTitle || page.title)
  const ogDescription = escapeHtml(page.ogDescription || page.description)
  const title = escapeHtml(page.title)
  const description = escapeHtml(page.description)
  const stylesheet = page.stylesheet || "/styles.css"
  const preload = page.preloadImage
    ? `    <link rel="preload" as="image" href="${page.preloadImage.startsWith("/") ? page.preloadImage : page.preloadImage}" type="image/webp" fetchpriority="high">\n`
    : ""

  const keywords = page.keywords
    ? `    <meta name="keywords" content="${escapeHtml(page.keywords)}">\n`
    : ""
  const author = page.author !== false ? `    <meta name="author" content="Tabskin Team">\n` : ""

  const schemaScripts = page.schema?.length ? `\n${renderSchemaScripts(page)}` : ""

  return `<head>
${analyticsBlock(page)}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
${keywords}${author}    <meta name="robots" content="${page.robots || "index, follow"}">
    <meta name="theme-color" content="${THEME_COLOR}">
    <link rel="canonical" href="${canonical}">
${hreflangBlock(page)}
    <meta property="og:site_name" content="Tabskin">
    <meta property="og:locale" content="${ogLocale(page.lang)}">
    <meta property="og:locale:alternate" content="${ogLocaleAlternate(page.lang)}">
    <meta property="og:title" content="${ogTitle}">
    <meta property="og:description" content="${ogDescription}">
    <meta property="og:type" content="${ogType}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:width" content="${OG_IMAGE_WIDTH}">
    <meta property="og:image:height" content="${OG_IMAGE_HEIGHT}">
    <meta property="og:image:alt" content="${ogTitle}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${ogTitle}">
    <meta name="twitter:description" content="${ogDescription}">
    <meta name="twitter:image" content="${ogImage}">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${preload}    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${stylesheet}">${schemaScripts}
</head>`
}
