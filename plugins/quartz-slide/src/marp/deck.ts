const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/**
 * Tiny standalone viewer for Marp's rendered output. Marp already makes every
 * `<svg data-marpit-svg>` fill the viewport, so navigation is implemented with
 * CSS scroll snapping plus a handful of keyboard shortcuts.
 */
const CLIENT_SCRIPT = `
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll("svg[data-marpit-svg]"));
  var total = slides.length;
  if (total === 0) return;
  var counter = document.getElementById("marp-counter");
  var current = 0;

  function clamp(n) { return n < 0 ? 0 : n > total - 1 ? total - 1 : n; }
  function render() { if (counter) counter.textContent = (current + 1) + " / " + total; }
  function go(n) {
    current = clamp(n);
    slides[current].scrollIntoView({ behavior: "smooth", block: "start" });
    render();
  }

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          current = slides.indexOf(entry.target);
          render();
        }
      });
    }, { threshold: 0.51 });
    slides.forEach(function (slide) { observer.observe(slide); });
  }

  document.addEventListener("keydown", function (event) {
    var key = event.key;
    if (key === "ArrowRight" || key === "ArrowDown" || key === "PageDown" || key === " " || key === "Enter") {
      event.preventDefault();
      go(current + 1);
    } else if (key === "ArrowLeft" || key === "ArrowUp" || key === "PageUp") {
      event.preventDefault();
      go(current - 1);
    } else if (key === "Home") {
      event.preventDefault();
      go(0);
    } else if (key === "End") {
      event.preventDefault();
      go(total - 1);
    } else if (key === "f" || key === "F") {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    }
  });

  document.addEventListener("click", function (event) {
    if (event.target && event.target.closest && event.target.closest("a")) return;
    if (event.clientX > window.innerWidth / 2) { go(current + 1); }
    else { go(current - 1); }
  });

  render();
})();
`

const VIEWER_CSS = `
html, body { margin: 0; padding: 0; height: 100%; }
body {
  background: #000;
  overflow-x: hidden;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}
svg[data-marpit-svg] { scroll-snap-align: start; scroll-snap-stop: always; }
#marp-counter, #marp-hint {
  position: fixed;
  bottom: 10px;
  z-index: 10;
  font: 13px/1.4 system-ui, -apple-system, sans-serif;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  padding: 4px 10px;
  border-radius: 999px;
  user-select: none;
  pointer-events: none;
}
#marp-counter { right: 12px; font-variant-numeric: tabular-nums; }
#marp-hint { left: 12px; opacity: 0.75; }
@media print {
  body { overflow: visible; background: #fff; }
  #marp-counter, #marp-hint { display: none; }
  svg[data-marpit-svg] { scroll-snap-align: none; page-break-after: always; }
}
`

export interface DeckInput {
  title: string
  marpHtml: string
  marpCss: string
}

export function renderDeck({ title, marpHtml, marpCss }: DeckInput): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>${marpCss}</style>
<style>${VIEWER_CSS}</style>
</head>
<body>
${marpHtml}
<div id="marp-counter">1 / 1</div>
<div id="marp-hint">\u2190 \u2192 &middot; F &middot; Esc</div>
<script>${CLIENT_SCRIPT}</script>
</body>
</html>
`
}
