// plugins/quartz-slide/src/marp/emitter.ts
import fs from "fs";
import path from "path";
import { Marp } from "@marp-team/marp-core";

// plugins/quartz-slide/src/types.ts
var defaultOptions = {
  outputDir: "presentation",
  tag: "presentation",
  frontmatterKey: "presentation",
  theme: "",
  themeCss: "",
  class: ""
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

  var notes = [];
  try {
    var notesEl = document.getElementById("marp-notes");
    notes = JSON.parse((notesEl && notesEl.textContent) || "[]");
  } catch (e) { notes = []; }

  var isPresenter = new URLSearchParams(window.location.search).get("presenter") === "1";
  var current = 0;
  var scrollLock = 0;
  var presenterWindow = null;
  var channel = null;
  try {
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel("quartz-slide:" + window.location.pathname);
    }
  } catch (e) { channel = null; }

  function clamp(n) { return n < 0 ? 0 : n > total - 1 ? total - 1 : n; }

  function send(message) {
    if (channel) { channel.postMessage(message); return; }
    var target = isPresenter ? window.opener : presenterWindow;
    if (target && !target.closed) target.postMessage(message, window.location.origin);
  }

  function handle(message) {
    if (!message || typeof message !== "object") return;
    if (message.type === "goto" || message.type === "sync") {
      go(message.index, false);
    } else if (message.type === "hello" && !isPresenter) {
      send({ type: "sync", index: current });
    }
  }

  var updateAudience = function () {};
  var updatePresenter = function () {};

  function go(n, broadcast) {
    current = clamp(n);
    if (isPresenter) {
      updatePresenter();
    } else {
      scrollLock = Date.now() + 700;
      slides[current].scrollIntoView({ behavior: "smooth", block: "start" });
      updateAudience();
    }
    if (broadcast !== false) {
      send({ type: isPresenter ? "goto" : "sync", index: current });
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  }

  function setupAudience() {
    var counter = document.getElementById("marp-counter");

    updateAudience = function () {
      if (counter) counter.textContent = (current + 1) + " / " + total;
    };

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        if (Date.now() < scrollLock) return;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var index = slides.indexOf(entry.target);
          if (index !== current) {
            current = index;
            updateAudience();
            send({ type: "sync", index: index });
          }
        });
      }, { threshold: 0.51 });
      slides.forEach(function (slide) { observer.observe(slide); });
    }

    function openPresenter() {
      if (presenterWindow && !presenterWindow.closed) {
        presenterWindow.focus();
        return;
      }
      presenterWindow = window.open(
        window.location.pathname + "?presenter=1",
        "quartz-slide-presenter",
        "popup=yes,width=1280,height=800"
      );
      if (presenterWindow) presenterWindow.focus();
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
      } else if (key === "p" || key === "P") {
        event.preventDefault();
        openPresenter();
      } else if (key === "f" || key === "F") {
        toggleFullscreen();
      }
    });

    document.addEventListener("click", function (event) {
      if (event.target && event.target.closest && event.target.closest("a")) return;
      if (event.clientX > window.innerWidth / 2) { go(current + 1); }
      else { go(current - 1); }
    });

    updateAudience();
  }

  function setupPresenter() {
    document.body.classList.add("marp-presenter-mode");
    document.title = "Presenter: " + document.title;

    var marpit = document.querySelector(".marpit");
    var counter = document.getElementById("marp-counter");
    var hint = document.getElementById("marp-hint");
    if (marpit) marpit.style.display = "none";
    if (counter) counter.style.display = "none";
    if (hint) hint.style.display = "none";

    var root = document.createElement("div");
    root.id = "marp-presenter";
    root.innerHTML = [
      '<div id="p-current-wrap">',
      '  <div id="p-current-label">Current</div>',
      '  <div id="p-current"></div>',
      '</div>',
      '<div id="p-side">',
      '  <div id="p-next-wrap">',
      '    <div id="p-next-label">Next</div>',
      '    <div id="p-next"></div>',
      '  </div>',
      '  <div id="p-notes-wrap">',
      '    <div id="p-notes-head">Notes</div>',
      '    <div id="p-notes"></div>',
      '    <div id="p-info">',
      '      <span id="p-counter"></span>',
      '      <span id="p-timer">00:00</span>',
      '      <button id="p-toggle" type="button">Pause</button>',
      '      <button id="p-reset" type="button">Reset</button>',
      '      <span id="p-close-hint">P / Esc closes</span>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join("");
    document.body.appendChild(root);

    var currentBox = document.getElementById("p-current");
    var currentWrap = document.getElementById("p-current-wrap");
    var nextBox = document.getElementById("p-next");
    var nextWrap = document.getElementById("p-next-wrap");
    var notesBox = document.getElementById("p-notes");
    var counterEl = document.getElementById("p-counter");

    function notesFor(index) {
      var entry = notes[index];
      if (Array.isArray(entry)) return entry.join("\\n\\n");
      if (typeof entry === "string") return entry;
      return "";
    }

    updatePresenter = function () {
      currentBox.textContent = "";
      nextBox.textContent = "";
      if (slides[current]) currentBox.appendChild(slides[current].cloneNode(true));
      if (slides[current + 1]) {
        nextBox.appendChild(slides[current + 1].cloneNode(true));
        if (nextWrap) nextWrap.style.visibility = "visible";
      } else if (nextWrap) {
        nextWrap.style.visibility = "hidden";
      }
      notesBox.textContent = notesFor(current) || "No notes for this slide.";
      if (counterEl) counterEl.textContent = (current + 1) + " / " + total;
    };

    var started = Date.now();
    var elapsed = 0;
    var running = true;
    var timerEl = document.getElementById("p-timer");
    var toggleBtn = document.getElementById("p-toggle");
    var resetBtn = document.getElementById("p-reset");

    function formatTime(ms) {
      var secs = Math.max(0, Math.floor(ms / 1000));
      var h = Math.floor(secs / 3600);
      var m = Math.floor((secs % 3600) / 60);
      var s = secs % 60;
      var mm = (m < 10 ? "0" : "") + m;
      var ss = (s < 10 ? "0" : "") + s;
      return h > 0 ? h + ":" + mm + ":" + ss : mm + ":" + ss;
    }

    function tick() {
      if (running) elapsed = Date.now() - started;
      if (timerEl) timerEl.textContent = formatTime(elapsed);
    }

    setInterval(tick, 250);
    tick();

    if (toggleBtn) {
      toggleBtn.addEventListener("click", function () {
        if (running) {
          elapsed = Date.now() - started;
          running = false;
          toggleBtn.textContent = "Resume";
        } else {
          started = Date.now() - elapsed;
          running = true;
          toggleBtn.textContent = "Pause";
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        started = Date.now();
        elapsed = 0;
        running = true;
        if (toggleBtn) toggleBtn.textContent = "Pause";
        tick();
      });
    }

    if (currentWrap) {
      currentWrap.addEventListener("click", function (event) {
        var rect = currentWrap.getBoundingClientRect();
        if (event.clientX - rect.left > rect.width / 2) { go(current + 1); }
        else { go(current - 1); }
      });
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
      } else if (key === "p" || key === "P" || key === "Escape") {
        window.close();
      } else if (key === "f" || key === "F") {
        toggleFullscreen();
      }
    });

    send({ type: "hello" });
    updatePresenter();
  }

  if (channel) channel.onmessage = function (event) { handle(event.data); };
  window.addEventListener("message", function (event) {
    if (event.origin === window.location.origin) handle(event.data);
  });

  if (isPresenter) { setupPresenter(); } else { setupAudience(); }
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
body.marp-presenter-mode {
  overflow: hidden;
  scroll-snap-type: none;
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

#marp-presenter {
  position: fixed;
  inset: 0;
  box-sizing: border-box;
  padding: 14px;
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px;
  background: #111;
  color: #eee;
  font: 14px/1.4 system-ui, -apple-system, sans-serif;
}
#p-current-wrap { grid-row: 1 / span 2; display: flex; flex-direction: column; min-height: 0; }
#p-next-wrap, #p-notes-wrap { grid-column: 2; display: flex; flex-direction: column; min-height: 0; }
#p-current, #p-next {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}
#p-current svg[data-marpit-svg], #p-next svg[data-marpit-svg] {
  width: 100%;
  height: 100%;
  display: block;
}
#p-current-label, #p-next-label, #p-notes-head {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9aa0a6;
  margin-bottom: 6px;
}
#p-notes-wrap {
  background: #1b1b1b;
  border-radius: 8px;
  padding: 12px;
}
#p-notes {
  flex: 1;
  min-height: 0;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 16px;
  line-height: 1.5;
}
#p-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #2c2c2c;
  font-variant-numeric: tabular-nums;
}
#p-counter { color: #9aa0a6; }
#p-timer { font-weight: 600; }
#p-info button {
  font: inherit;
  color: #eee;
  background: #2c2c2c;
  border: 1px solid #3c3c3c;
  border-radius: 6px;
  padding: 3px 10px;
  cursor: pointer;
}
#p-info button:hover { background: #3a3a3a; }
#p-close-hint { margin-left: auto; color: #6b7075; font-size: 12px; }

@media print {
  body { overflow: visible; background: #fff; }
  #marp-counter, #marp-hint { display: none; }
  svg[data-marpit-svg] { scroll-snap-align: none; page-break-after: always; }
}
`;
function renderDeck({ title, marpHtml, marpCss, notes = [] }) {
  const notesJson = JSON.stringify(notes).replace(/</g, "\\u003c");
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
<div id="marp-hint">\u2190 \u2192 &middot; P presenter &middot; F fullscreen</div>
<script type="application/json" id="marp-notes">${notesJson}</script>
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
      let defaultTheme = opts.theme || "default";
      if (opts.themeCss) {
        const cssPath = path.resolve(process.cwd(), opts.themeCss);
        const themeCss = await fs.promises.readFile(cssPath, "utf8");
        marp.themeSet.add(themeCss);
        const themeName = themeCss.match(/@theme\s+([\w-]+)/)?.[1];
        if (themeName && !opts.theme) {
          defaultTheme = themeName;
        }
      }
      if (!marp.themeSet.has(defaultTheme)) {
        console.warn(
          `[quartz-slide] unknown Marp theme "${defaultTheme}", falling back to "default"`
        );
        defaultTheme = "default";
      }
      for (const [_tree, vfile] of content) {
        const data = vfile.data;
        const frontmatter = data.frontmatter;
        if (!isPresentation(frontmatter, opts)) continue;
        const slug = data.slug;
        if (!slug) continue;
        const markdown = stripFrontmatter(String(vfile.value));
        if (markdown.trim().length === 0) continue;
        const perNoteTheme = frontmatter?.presentationTheme ?? frontmatter?.presentation_theme;
        const requestedTheme = typeof perNoteTheme === "string" ? perNoteTheme : defaultTheme;
        const theme = marp.themeSet.has(requestedTheme) ? requestedTheme : defaultTheme;
        const perNoteClass = frontmatter?.presentationClass ?? frontmatter?.presentation_class;
        const themeClass = typeof perNoteClass === "string" ? perNoteClass.trim() : String(opts.class ?? "").trim();
        const directives = [`theme: ${theme}`];
        if (themeClass.length > 0) {
          directives.push(`class: ${themeClass}`);
        }
        const source = `---
${directives.join("\n")}
---

${markdown}`;
        const { html, css, comments } = marp.render(source);
        const title = typeof frontmatter?.title === "string" && frontmatter.title.length > 0 ? frontmatter.title : slug;
        const page = renderDeck({ title, marpHtml: html, marpCss: css, notes: comments });
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
