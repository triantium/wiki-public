// plugins/quartz-slide/src/marp/emitter.ts
import fs from "fs";
import path2 from "path";
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

// plugins/quartz-slide/src/util/embeds.ts
import path from "path";
import { slugifyFilePath } from "@quartz-community/utils";

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
function stripSlashes(s, onlyStripPrefix = false) {
  if (s.startsWith("/")) s = s.substring(1);
  if (!onlyStripPrefix && s.endsWith("/")) s = s.slice(0, -1);
  return s;
}
function endsWith(s, suffix) {
  return s === suffix || s.endsWith("/" + suffix);
}
function trimSuffix(s, suffix) {
  return endsWith(s, suffix) ? s.slice(0, -suffix.length) : s;
}
function simplifySlug(fp) {
  const res = stripSlashes(trimSuffix(fp, "index"), true);
  return res.length === 0 ? "/" : res;
}
function pathToRoot(slug) {
  let rootPath = slug.split("/").filter((x) => x !== "").slice(0, -1).map(() => "..").join("/");
  if (rootPath.length === 0) rootPath = ".";
  return rootPath;
}
function joinSegments(...segments) {
  if (segments.length === 0) return "";
  let joined = segments.filter((segment) => segment !== "" && segment !== "/").map((segment) => stripSlashes(segment)).join("/");
  if (segments[0]?.startsWith("/")) joined = "/" + joined;
  if (segments[segments.length - 1]?.endsWith("/")) joined = joined + "/";
  return joined;
}
function resolveRelative(current, target) {
  return joinSegments(pathToRoot(current), simplifySlug(target));
}

// plugins/quartz-slide/src/util/embeds.ts
var IMAGE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".svg",
  ".bmp",
  ".ico",
  ".tif",
  ".tiff"
]);
var SIZE_RE = /^(?:(\d+(?:\.\d+)?)(%?)(?:x(\d+(?:\.\d+)?)(%?))?|x(\d+(?:\.\d+)?)(%?))$/;
var normalizePath = (filePath) => path.posix.normalize(filePath.replace(/\\/g, "/"));
var safeDecode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
var isExternalTarget = (target) => /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("//");
var isImageTarget = (target) => IMAGE_EXTENSIONS.has(path.posix.extname(target).toLowerCase());
var isEscaped = (text, index) => {
  let backslashes = 0;
  for (let i = index - 1; i >= 0 && text[i] === "\\"; i--) {
    backslashes++;
  }
  return backslashes % 2 === 1;
};
var parseSize = (value) => {
  const match = SIZE_RE.exec(value.trim());
  if (!match) return void 0;
  const [, width, widthUnit, height, heightUnit, onlyHeight, heightOnlyUnit] = match;
  if (onlyHeight) {
    return { height: `${onlyHeight}${heightOnlyUnit ?? ""}` };
  }
  const size = { width: `${width}${widthUnit ?? ""}` };
  if (height) {
    size.height = `${height}${heightUnit ?? ""}`;
  }
  return size;
};
var parseEmbed = (raw, fallbackAlt) => {
  const [targetPart, ...aliasParts] = raw.split("|");
  const target = targetPart.trim();
  let size;
  const altParts = [];
  for (const part of aliasParts) {
    const trimmed = part.trim();
    const parsedSize = parseSize(trimmed);
    if (parsedSize) {
      size = parsedSize;
    } else if (trimmed.length > 0) {
      altParts.push(trimmed);
    }
  }
  return {
    target,
    alt: altParts.join("|") || fallbackAlt,
    size
  };
};
var escapeMarkdownAlt = (value) => value.replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/\]/g, "\\]");
var escapeHtmlAttribute = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var encodeUrl = (value) => encodeURI(value).replace(/\(/g, "%28").replace(/\)/g, "%29");
var commonPrefixLength = (a, b) => {
  let length = 0;
  while (length < a.length && length < b.length && a[length] === b[length]) {
    length++;
  }
  return length;
};
var chooseClosest = (candidates, noteDir, target) => {
  if (candidates.length === 0) return void 0;
  const noteDirSegments = noteDir.toLowerCase().split("/").filter(Boolean);
  const targetSegments = target.toLowerCase().split("/").filter(Boolean);
  return [...candidates].sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const aSegments = aLower.split("/").filter(Boolean);
    const bSegments = bLower.split("/").filter(Boolean);
    const aTargetSuffix = aSegments.slice(-targetSegments.length).join("/") === targetSegments.join("/");
    const bTargetSuffix = bSegments.slice(-targetSegments.length).join("/") === targetSegments.join("/");
    if (aTargetSuffix !== bTargetSuffix) return aTargetSuffix ? -1 : 1;
    const aPrefix = commonPrefixLength(
      noteDirSegments,
      aSegments.slice(0, Math.max(1, aSegments.length - 1))
    );
    const bPrefix = commonPrefixLength(
      noteDirSegments,
      bSegments.slice(0, Math.max(1, bSegments.length - 1))
    );
    if (aPrefix !== bPrefix) return bPrefix - aPrefix;
    if (aSegments.length !== bSegments.length) return aSegments.length - bSegments.length;
    if (a !== b) return a < b ? -1 : 1;
    return 0;
  })[0];
};
var findAsset = (target, allFiles, noteDir) => {
  const cleanTarget = normalizePath(safeDecode(target).replace(/^\/+/, ""));
  const lowerTarget = cleanTarget.toLowerCase();
  const baseName = path.posix.basename(lowerTarget);
  const files = allFiles.map((filePath) => normalizePath(filePath)).filter((filePath) => isImageTarget(filePath));
  const exact = files.filter((filePath) => filePath.toLowerCase() === lowerTarget);
  if (exact.length > 0) {
    return { filePath: chooseClosest(exact, noteDir, cleanTarget) ?? exact[0], resolved: true };
  }
  const suffix = files.filter((filePath) => filePath.toLowerCase().endsWith(`/${lowerTarget}`));
  if (suffix.length > 0) {
    return { filePath: chooseClosest(suffix, noteDir, cleanTarget) ?? suffix[0], resolved: true };
  }
  const byName = files.filter(
    (filePath) => path.posix.basename(filePath).toLowerCase() === baseName
  );
  if (byName.length > 0) {
    return { filePath: chooseClosest(byName, noteDir, cleanTarget) ?? byName[0], resolved: true };
  }
  const absolute = /^[\\/]/.test(target);
  return {
    filePath: absolute ? cleanTarget : normalizePath(path.posix.join(noteDir, cleanTarget)),
    resolved: false
  };
};
var formatImage = (src, alt, size) => {
  const url = encodeUrl(src);
  if (!size) {
    return `![${escapeMarkdownAlt(alt)}](${url})`;
  }
  const attributes = [`src="${escapeHtmlAttribute(url)}"`, `alt="${escapeHtmlAttribute(alt)}"`];
  if (size.width) attributes.push(`width="${escapeHtmlAttribute(size.width)}"`);
  if (size.height) attributes.push(`height="${escapeHtmlAttribute(size.height)}"`);
  return `<img ${attributes.join(" ")}>`;
};
var resolveEmbed = (raw, options, noteDir) => {
  const fallbackAlt = path.posix.basename(raw.split("|")[0]).replace(/\.[^.]+$/, "");
  const embed = parseEmbed(raw, fallbackAlt);
  if (embed.target.length === 0 || isExternalTarget(embed.target)) return void 0;
  if (!isImageTarget(embed.target)) return void 0;
  const { filePath, resolved } = findAsset(embed.target, options.allFiles, noteDir);
  if (!resolved) {
    options.warn?.(`unresolved image embed "${embed.target}" in "${options.notePath}"`);
  }
  const src = resolveRelative(options.deckPath, slugifyFilePath(filePath));
  return formatImage(src, embed.alt, embed.size);
};
var FENCE_RE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
var CLOSING_FENCE_RE = /^ {0,3}(`{3,}|~{3,})\s*$/;
var isClosingFence = (line, marker) => {
  const match = CLOSING_FENCE_RE.exec(line);
  return !!match && match[1][0] === marker[0] && match[1].length >= marker.length;
};
var transformLine = (line, inComment, resolve) => {
  let output = "";
  let index = 0;
  while (index < line.length) {
    if (inComment.value) {
      const end = line.indexOf("-->", index);
      if (end === -1) {
        output += line.slice(index);
        return output;
      }
      output += line.slice(index, end + 3);
      inComment.value = false;
      index = end + 3;
      continue;
    }
    if (line.startsWith("<!--", index)) {
      const end = line.indexOf("-->", index + 4);
      if (end === -1) {
        output += line.slice(index);
        inComment.value = true;
        return output;
      }
      output += line.slice(index, end + 3);
      index = end + 3;
      continue;
    }
    if (line[index] === "`") {
      const marker = /^`+/.exec(line.slice(index))?.[0];
      if (marker) {
        const end = line.indexOf(marker, index + marker.length);
        if (end === -1) {
          output += line.slice(index);
          return output;
        }
        output += line.slice(index, end + marker.length);
        index = end + marker.length;
        continue;
      }
    }
    if (line.startsWith("![[", index) && !isEscaped(line, index)) {
      const end = line.indexOf("]]", index + 3);
      if (end === -1) {
        output += line.slice(index);
        return output;
      }
      const raw = line.slice(index + 3, end);
      output += resolve(raw) ?? line.slice(index, end + 2);
      index = end + 2;
      continue;
    }
    output += line[index];
    index++;
  }
  return output;
};
function resolveEmbeddedImages(markdown, options) {
  const noteDir = path.posix.dirname(options.notePath);
  const newline = markdown.includes("\r\n") ? "\r\n" : "\n";
  const lines = markdown.split(/\r?\n/);
  const inComment = { value: false };
  let fence;
  const resolve = (raw) => resolveEmbed(raw, options, noteDir);
  return lines.map((line) => {
    if (fence) {
      if (isClosingFence(line, fence)) fence = void 0;
      return line;
    }
    const openingFence = FENCE_RE.exec(line);
    if (openingFence) {
      fence = openingFence[1];
      return line;
    }
    return transformLine(line, inComment, resolve);
  }).join(newline);
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
      ? "\u2190 \u2192 \xB7 P presenter \xB7 C colorblind on \xB7 F fullscreen"
      : "\u2190 \u2192 \xB7 P presenter \xB7 C colorblind \xB7 F fullscreen";
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
<div id="marp-hint">\u2190 \u2192 &middot; P presenter &middot; C colorblind &middot; F fullscreen</div>
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
        const cssPath = path2.resolve(process.cwd(), opts.themeCss);
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
        let markdown = stripFrontmatter(String(vfile.value));
        if (markdown.trim().length === 0) continue;
        const notePath = typeof data.relativePath === "string" ? data.relativePath : `${slug}.md`;
        markdown = resolveEmbeddedImages(markdown, {
          notePath,
          deckPath: path2.posix.join(opts.outputDir, slug),
          allFiles: ctx.allFiles,
          warn: (message) => console.warn(`[quartz-slide] ${message}`)
        });
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
        const outPath = path2.join(ctx.argv.output, opts.outputDir, `${slug}.html`);
        await fs.promises.mkdir(path2.dirname(outPath), { recursive: true });
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
