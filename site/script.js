document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    link.setAttribute("rel", "noopener noreferrer")
  })

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (event) {
      const target = document.querySelector(this.getAttribute("href"))
      if (!target) return

      event.preventDefault()
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      })
    })
  })

  if (prefersReducedMotion || !("IntersectionObserver" in window)) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible")
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px",
    }
  )

  document
    .querySelectorAll(".comparison-card, .screenshot-item, .feature-card, .differentiation-card, .trust-card, .download-card")
    .forEach((element) => {
      element.classList.add("reveal")
      observer.observe(element)
    })
})
