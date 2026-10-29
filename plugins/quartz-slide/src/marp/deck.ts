const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/**
 * Standalone viewer for Marp's rendered output. Marp already makes every
 * `<svg data-marpit-svg>` fill the viewport, so navigation is implemented with
 * CSS scroll snapping plus a handful of keyboard shortcuts. Pressing `P` opens
 * a presenter window (current slide, next slide, notes and a timer) that stays
 * in sync with the audience window.
 */
const CLIENT_SCRIPT = `
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
  var wongKey = "quartz-slide:wong:" + window.location.pathname;
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
      if (typeof message.wong === "boolean") setWong(message.wong, false);
    } else if (message.type === "wong") {
      setWong(!!message.enabled, false);
    } else if (message.type === "hello" && !isPresenter) {
      send({
        type: "sync",
        index: current,
        wong: document.body.classList.contains("wong")
      });
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

  function updateHint() {
    var hint = document.getElementById("marp-hint");
    if (!hint) return;
    hint.textContent = document.body.classList.contains("wong")
      ? "\u2190 \u2192 \u00b7 P presenter \u00b7 C colorblind on \u00b7 F fullscreen"
      : "\u2190 \u2192 \u00b7 P presenter \u00b7 C colorblind \u00b7 F fullscreen";
  }

  function setWong(enabled, broadcast) {
    document.body.classList.toggle("wong", enabled);
    try { localStorage.setItem(wongKey, enabled ? "1" : "0"); } catch (e) {}
    updateHint();
    if (broadcast !== false) send({ type: "wong", enabled: !!enabled });
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
      } else if (key === "c" || key === "C" || key === "w" || key === "W") {
        event.preventDefault();
        setWong(!document.body.classList.contains("wong"));
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
    updateHint();
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

    function wrapSlide(slide) {
      var wrap = document.createElement("div");
      wrap.className = "marpit";
      wrap.appendChild(slide.cloneNode(true));
      return wrap;
    }

    updatePresenter = function () {
      currentBox.textContent = "";
      nextBox.textContent = "";
      if (slides[current]) currentBox.appendChild(wrapSlide(slides[current]));
      if (slides[current + 1]) {
        nextBox.appendChild(wrapSlide(slides[current + 1]));
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
      } else if (key === "c" || key === "C" || key === "w" || key === "W") {
        event.preventDefault();
        setWong(!document.body.classList.contains("wong"));
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

  try {
    if (localStorage.getItem(wongKey) === "1") document.body.classList.add("wong");
  } catch (e) {}

  if (isPresenter) { setupPresenter(); } else { setupAudience(); }
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
#p-current > .marpit, #p-next > .marpit {
  width: 100%;
  height: 100%;
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

body.wong {
  background: #fff;
}
body.wong .marpit > svg > foreignObject > section {
  color-scheme: light;

  --wong-orange: #e69f00;
  --wong-sky: #56b4e9;
  --wong-green: #009e73;
  --wong-yellow: #f0e442;
  --wong-blue: #0072b2;
  --wong-vermillion: #d55e00;
  --wong-purple: #cc79a7;

  --bgColor-default: #fff;
  --fgColor-default: #000;
  --fgColor-muted: #444;
  --fgColor-accent: var(--wong-blue);
  --fgColor-attention: var(--wong-vermillion);
  --fgColor-success: var(--wong-green);
  --fgColor-danger: var(--wong-vermillion);
  --fgColor-done: var(--wong-purple);

  --bgColor-muted: #f2f2f2;
  --bgColor-attention-muted: #f0e44255;
  --bgColor-neutral-muted: #f2f2f2;

  --borderColor-default: #bbb;
  --borderColor-muted: #ddd;
  --borderColor-neutral-muted: #bbb;
  --borderColor-accent-emphasis: var(--wong-blue);
  --borderColor-attention-emphasis: var(--wong-vermillion);
  --borderColor-danger-emphasis: var(--wong-vermillion);
  --borderColor-done-emphasis: var(--wong-purple);
  --borderColor-success-emphasis: var(--wong-green);

  --h1-color: var(--wong-vermillion);
  --heading-strong-color: #000;
  --header-footer-color: #444;
  --paginate-color: #444;
  --focus-outlineColor: var(--wong-blue);

  --color-prettylights-syntax-comment: #555;
  --color-prettylights-syntax-constant: var(--wong-blue);
  --color-prettylights-syntax-constant-other-reference-link: var(--wong-blue);
  --color-prettylights-syntax-entity: var(--wong-purple);
  --color-prettylights-syntax-entity-tag: var(--wong-green);
  --color-prettylights-syntax-keyword: var(--wong-green);
  --color-prettylights-syntax-string: var(--wong-blue);
  --color-prettylights-syntax-string-regexp: var(--wong-green);
  --color-prettylights-syntax-variable: var(--wong-vermillion);
  --color-prettylights-syntax-markup-heading: var(--wong-vermillion);
  --color-prettylights-syntax-markup-bold: #000;
  --color-prettylights-syntax-markup-italic: #000;
  --color-prettylights-syntax-storage-modifier-import: #000;
  --color-prettylights-syntax-brackethighlighter-angle: #555;
  --color-prettylights-syntax-brackethighlighter-unmatched: var(--wong-vermillion);
  --color-prettylights-syntax-invalid-illegal-text: #fff;
  --color-prettylights-syntax-invalid-illegal-bg: var(--wong-vermillion);
  --color-prettylights-syntax-markup-deleted-text: var(--wong-vermillion);
  --color-prettylights-syntax-markup-deleted-bg: #d55e0022;
  --color-prettylights-syntax-markup-inserted-text: var(--wong-green);
  --color-prettylights-syntax-markup-inserted-bg: #009e7322;
  --color-prettylights-syntax-markup-changed-text: var(--wong-orange);
  --color-prettylights-syntax-markup-changed-bg: #e69f0022;
  --color-prettylights-syntax-markup-ignored-text: #555;
  --color-prettylights-syntax-markup-ignored-bg: #00000011;
  --color-prettylights-syntax-markup-list: var(--wong-vermillion);
  --color-prettylights-syntax-meta-diff-range: var(--wong-purple);
  --color-prettylights-syntax-sublimelinter-gutter-mark: #555;
  --color-prettylights-syntax-carriage-return-bg: var(--wong-vermillion);
  --color-prettylights-syntax-carriage-return-text: #fff;

  background-color: #fff;
  color: #000;
}
body.wong .marpit > svg > foreignObject > section h1 {
  color: var(--wong-vermillion);
}
body.wong .marpit > svg > foreignObject > section h2 {
  color: var(--wong-blue);
}
body.wong .marpit > svg > foreignObject > section h3 {
  color: var(--wong-green);
}
body.wong .marpit > svg > foreignObject > section h4 {
  color: var(--wong-purple);
}
body.wong .marpit > svg > foreignObject > section h5 {
  color: var(--wong-orange);
}
body.wong .marpit > svg > foreignObject > section h6 {
  color: #000;
}
body.wong .marpit > svg > foreignObject > section a {
  color: var(--wong-blue);
}
body.wong .marpit > svg > foreignObject > section a:hover {
  color: var(--wong-vermillion);
}
body.wong .marpit > svg > foreignObject > section strong,
body.wong .marpit > svg > foreignObject > section em {
  color: #000;
}
body.wong .marpit > svg > foreignObject > section code,
body.wong .marpit > svg > foreignObject > section tt {
  color: var(--wong-blue);
  background-color: #f2f2f2;
}
body.wong .marpit > svg > foreignObject > section :is(pre, marp-pre) {
  background-color: #f2f2f2;
}
body.wong .marpit > svg > foreignObject > section :is(pre, marp-pre) code,
body.wong .marpit > svg > foreignObject > section :is(pre, marp-pre) tt {
  color: #000;
  background-color: transparent;
}
body.wong .marpit > svg > foreignObject > section blockquote {
  color: #444;
  border-left-color: var(--wong-blue);
}
body.wong .marpit > svg > foreignObject > section mark {
  background-color: var(--wong-yellow);
  color: #000;
}
body.wong .marpit > svg > foreignObject > section table td,
body.wong .marpit > svg > foreignObject > section table th {
  border-color: #bbb;
}
body.wong .marpit > svg > foreignObject > section table tr:nth-child(2n) {
  background-color: #f2f2f2;
}
body.wong .marpit > svg > foreignObject > section hr {
  background-color: #bbb;
}
body.wong .marpit > svg > foreignObject > section header,
body.wong .marpit > svg > foreignObject > section footer,
body.wong .marpit > svg > foreignObject > section::after {
  color: #444;
}
body.wong #marp-counter,
body.wong #marp-hint {
  background: rgba(255, 255, 255, 0.9);
  color: #000;
  border: 1px solid #ddd;
}

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
  notes?: string[][]
}

export function renderDeck({ title, marpHtml, marpCss, notes = [] }: DeckInput): string {
  const notesJson = JSON.stringify(notes).replace(/</g, "\\u003c")

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
<div id="marp-hint">\u2190 \u2192 &middot; P presenter &middot; C colorblind &middot; F fullscreen</div>
<script type="application/json" id="marp-notes">${notesJson}</script>
<script>${CLIENT_SCRIPT}</script>
</body>
</html>
`
}
