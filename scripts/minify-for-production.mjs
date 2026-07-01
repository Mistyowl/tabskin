export function minifyHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim()
}

export function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>+~])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim()
}

function minifyTemplateLiteralText(text) {
  const trimmed = text.trim()
  if (!trimmed) return ""

  if (/^<[a-z!/]/i.test(trimmed)) {
    return minifyHtml(text)
  }

  if (/[{}:;]/.test(trimmed) && /(body|opacity|background|::|@media)/.test(trimmed)) {
    return minifyCss(text)
  }

  return text.replace(/\s+/g, " ").trim()
}

function minifyTemplateLiteralBody(body) {
  const parts = []
  let index = 0

  while (index < body.length) {
    if (body[index] === "$" && body[index + 1] === "{") {
      let depth = 1
      let end = index + 2

      while (end < body.length && depth > 0) {
        if (body[end] === "{") depth += 1
        else if (body[end] === "}") depth -= 1
        end += 1
      }

      parts.push(body.slice(index, end))
      index = end
      continue
    }

    let end = index
    while (end < body.length && !(body[end] === "$" && body[end + 1] === "{")) {
      if (body[end] === "\\") {
        end += 2
        continue
      }
      end += 1
    }

    parts.push(minifyTemplateLiteralText(body.slice(index, end)))
    index = end
  }

  return parts.join("")
}

export function minifyJavaScriptSource(source) {
  let output = ""
  let index = 0

  while (index < source.length) {
    const char = source[index]

    if (char === '"' || char === "'") {
      const quote = char
      let end = index + 1

      while (end < source.length) {
        if (source[end] === "\\") {
          end += 2
          continue
        }
        if (source[end] === quote) break
        end += 1
      }

      output += source.slice(index, end + 1)
      index = end + 1
      continue
    }

    if (char === "`") {
      let end = index + 1

      while (end < source.length) {
        if (source[end] === "\\") {
          end += 2
          continue
        }
        if (source[end] === "`") break
        end += 1
      }

      const body = source.slice(index + 1, end)
      output += "`" + minifyTemplateLiteralBody(body) + "`"
      index = end + 1
      continue
    }

    output += char
    index += 1
  }

  return output
}
