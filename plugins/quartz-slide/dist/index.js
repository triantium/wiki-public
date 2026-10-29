// plugins/quartz-slide/src/marp/emitter.ts
import fs from "fs";
import path from "path";
import { Marp } from "@marp-team/marp-core";

// plugins/quartz-slide/src/types.ts
var defaultOptions = {
  outputDir: "presentation",
  tag: "presentation",
  frontmatterKey: "presentation"
};

// plugins/quartz-slide/src/util/slides.ts
var asTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags.filter((tag) => typeof tag === "string");
  }
  if (typeof tags === "string") {
    return tags.split(/[,\s]+/).filter(Boolean);
  }
  return [];
};
function isPresentation(frontmatter, opts = defaultOptions) {
  if (!frontmatter) return false;
  const flag = frontmatter[opts.frontmatterKey];
  if (flag === true || flag === "true") return true;
  const tags = asTags(frontmatter.tags);
  return tags.some((tag) => tag === opts.tag || tag.startsWith(`${opts.tag}/`));
}
function stripFrontmatter(markdown) {
  return markdown.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").replace(/^\s+/, "");
}

// plugins/quartz-slide/src/marp/deck.ts
var escapeHtml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var CLIENT_SCRIPT = `
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
`;
var VIEWER_CSS = `
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
`;
function renderDeck({ title, marpHtml, marpCss }) {
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
`;
}

// plugins/quartz-slide/src/marp/emitter.ts
var MarpSlides = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts };
  return {
    name: "MarpSlides",
    async emit(ctx, content, _resources) {
      const marp = new Marp();
      const written = [];
      for (const [_tree, vfile] of content) {
        const data = vfile.data;
        const frontmatter = data.frontmatter;
        if (!isPresentation(frontmatter, opts)) continue;
        const slug = data.slug;
        if (!slug) continue;
        const markdown = stripFrontmatter(String(vfile.value));
        if (markdown.trim().length === 0) continue;
        const { html, css } = marp.render(markdown);
        const title = typeof frontmatter?.title === "string" && frontmatter.title.length > 0 ? frontmatter.title : slug;
        const page = renderDeck({ title, marpHtml: html, marpCss: css });
        const outPath = path.join(ctx.argv.output, opts.outputDir, `${slug}.html`);
        await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
        await fs.promises.writeFile(outPath, page);
        written.push(outPath);
      }
      return written;
    }
  };
};
var emitter_default = MarpSlides;

// plugins/quartz-slide/src/index.ts
var index_default = emitter_default;
export {
  emitter_default as MarpSlides,
  index_default as default
};
