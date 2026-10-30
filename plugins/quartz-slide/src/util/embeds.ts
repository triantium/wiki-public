import path from "path"
import { slugifyFilePath } from "@quartz-community/utils"
import { resolveRelative } from "./slides"

const IMAGE_EXTENSIONS = new Set([
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
  ".tiff",
])

const SIZE_RE = /^(?:(\d+(?:\.\d+)?)(%?)(?:x(\d+(?:\.\d+)?)(%?))?|x(\d+(?:\.\d+)?)(%?))$/

export interface EmbeddedImageOptions {
  /** Content-relative path of the Markdown note. */
  notePath: string
  /** Output-relative path of the generated deck (without `.html`). */
  deckPath: string
  /** All content-relative files known to Quartz, including assets. */
  allFiles: readonly string[]
  /** Called when an embed cannot be matched to a known file. */
  warn?: (message: string) => void
}

interface EmbedSize {
  width?: string
  height?: string
}

interface ParsedEmbed {
  target: string
  alt: string
  size?: EmbedSize
}

const normalizePath = (filePath: string): string =>
  path.posix.normalize(filePath.replace(/\\/g, "/"))

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const isExternalTarget = (target: string): boolean =>
  /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("//")

const isImageTarget = (target: string): boolean =>
  IMAGE_EXTENSIONS.has(path.posix.extname(target).toLowerCase())

const isEscaped = (text: string, index: number): boolean => {
  let backslashes = 0
  for (let i = index - 1; i >= 0 && text[i] === "\\"; i--) {
    backslashes++
  }
  return backslashes % 2 === 1
}

const parseSize = (value: string): EmbedSize | undefined => {
  const match = SIZE_RE.exec(value.trim())
  if (!match) return undefined

  const [, width, widthUnit, height, heightUnit, onlyHeight, heightOnlyUnit] = match
  if (onlyHeight) {
    return { height: `${onlyHeight}${heightOnlyUnit ?? ""}` }
  }

  const size: EmbedSize = { width: `${width}${widthUnit ?? ""}` }
  if (height) {
    size.height = `${height}${heightUnit ?? ""}`
  }
  return size
}

const parseEmbed = (raw: string, fallbackAlt: string): ParsedEmbed => {
  const [targetPart, ...aliasParts] = raw.split("|")
  const target = targetPart.trim()

  let size: EmbedSize | undefined
  const altParts: string[] = []
  for (const part of aliasParts) {
    const trimmed = part.trim()
    const parsedSize = parseSize(trimmed)
    if (parsedSize) {
      size = parsedSize
    } else if (trimmed.length > 0) {
      altParts.push(trimmed)
    }
  }

  return {
    target,
    alt: altParts.join("|") || fallbackAlt,
    size,
  }
}

const escapeMarkdownAlt = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/\]/g, "\\]")

const escapeHtmlAttribute = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const encodeUrl = (value: string): string =>
  encodeURI(value).replace(/\(/g, "%28").replace(/\)/g, "%29")

const commonPrefixLength = (a: string[], b: string[]): number => {
  let length = 0
  while (length < a.length && length < b.length && a[length] === b[length]) {
    length++
  }
  return length
}

const chooseClosest = (
  candidates: readonly string[],
  noteDir: string,
  target: string,
): string | undefined => {
  if (candidates.length === 0) return undefined

  const noteDirSegments = noteDir.toLowerCase().split("/").filter(Boolean)
  const targetSegments = target.toLowerCase().split("/").filter(Boolean)

  return [...candidates].sort((a, b) => {
    const aLower = a.toLowerCase()
    const bLower = b.toLowerCase()
    const aSegments = aLower.split("/").filter(Boolean)
    const bSegments = bLower.split("/").filter(Boolean)

    const aTargetSuffix =
      aSegments.slice(-targetSegments.length).join("/") === targetSegments.join("/")
    const bTargetSuffix =
      bSegments.slice(-targetSegments.length).join("/") === targetSegments.join("/")
    if (aTargetSuffix !== bTargetSuffix) return aTargetSuffix ? -1 : 1

    const aPrefix = commonPrefixLength(
      noteDirSegments,
      aSegments.slice(0, Math.max(1, aSegments.length - 1)),
    )
    const bPrefix = commonPrefixLength(
      noteDirSegments,
      bSegments.slice(0, Math.max(1, bSegments.length - 1)),
    )
    if (aPrefix !== bPrefix) return bPrefix - aPrefix

    if (aSegments.length !== bSegments.length) return aSegments.length - bSegments.length
    if (a !== b) return a < b ? -1 : 1
    return 0
  })[0]
}

const findAsset = (
  target: string,
  allFiles: readonly string[],
  noteDir: string,
): { filePath: string; resolved: boolean } => {
  const cleanTarget = normalizePath(safeDecode(target).replace(/^\/+/, ""))
  const lowerTarget = cleanTarget.toLowerCase()
  const baseName = path.posix.basename(lowerTarget)

  const files = allFiles
    .map((filePath) => normalizePath(filePath))
    .filter((filePath) => isImageTarget(filePath))

  const exact = files.filter((filePath) => filePath.toLowerCase() === lowerTarget)
  if (exact.length > 0) {
    return { filePath: chooseClosest(exact, noteDir, cleanTarget) ?? exact[0], resolved: true }
  }

  const suffix = files.filter((filePath) => filePath.toLowerCase().endsWith(`/${lowerTarget}`))
  if (suffix.length > 0) {
    return { filePath: chooseClosest(suffix, noteDir, cleanTarget) ?? suffix[0], resolved: true }
  }

  const byName = files.filter(
    (filePath) => path.posix.basename(filePath).toLowerCase() === baseName,
  )
  if (byName.length > 0) {
    return { filePath: chooseClosest(byName, noteDir, cleanTarget) ?? byName[0], resolved: true }
  }

  const absolute = /^[\\/]/.test(target)
  return {
    filePath: absolute ? cleanTarget : normalizePath(path.posix.join(noteDir, cleanTarget)),
    resolved: false,
  }
}

const formatImage = (src: string, alt: string, size?: EmbedSize): string => {
  const url = encodeUrl(src)
  if (!size) {
    return `![${escapeMarkdownAlt(alt)}](${url})`
  }

  const attributes = [`src="${escapeHtmlAttribute(url)}"`, `alt="${escapeHtmlAttribute(alt)}"`]
  if (size.width) attributes.push(`width="${escapeHtmlAttribute(size.width)}"`)
  if (size.height) attributes.push(`height="${escapeHtmlAttribute(size.height)}"`)

  return `<img ${attributes.join(" ")}>`
}

const resolveEmbed = (
  raw: string,
  options: EmbeddedImageOptions,
  noteDir: string,
): string | undefined => {
  const fallbackAlt = path.posix.basename(raw.split("|")[0]).replace(/\.[^.]+$/, "")
  const embed = parseEmbed(raw, fallbackAlt)
  if (embed.target.length === 0 || isExternalTarget(embed.target)) return undefined
  if (!isImageTarget(embed.target)) return undefined

  const { filePath, resolved } = findAsset(embed.target, options.allFiles, noteDir)
  if (!resolved) {
    options.warn?.(`unresolved image embed "${embed.target}" in "${options.notePath}"`)
  }

  const src = resolveRelative(options.deckPath, slugifyFilePath(filePath))
  return formatImage(src, embed.alt, embed.size)
}

const FENCE_RE = /^ {0,3}(`{3,}|~{3,})(.*)$/
const CLOSING_FENCE_RE = /^ {0,3}(`{3,}|~{3,})\s*$/

const isClosingFence = (line: string, marker: string): boolean => {
  const match = CLOSING_FENCE_RE.exec(line)
  return !!match && match[1][0] === marker[0] && match[1].length >= marker.length
}

const transformLine = (
  line: string,
  inComment: { value: boolean },
  resolve: (raw: string) => string | undefined,
): string => {
  let output = ""
  let index = 0

  while (index < line.length) {
    if (inComment.value) {
      const end = line.indexOf("-->", index)
      if (end === -1) {
        output += line.slice(index)
        return output
      }
      output += line.slice(index, end + 3)
      inComment.value = false
      index = end + 3
      continue
    }

    if (line.startsWith("<!--", index)) {
      const end = line.indexOf("-->", index + 4)
      if (end === -1) {
        output += line.slice(index)
        inComment.value = true
        return output
      }
      output += line.slice(index, end + 3)
      index = end + 3
      continue
    }

    if (line[index] === "`") {
      const marker = /^`+/.exec(line.slice(index))?.[0]
      if (marker) {
        const end = line.indexOf(marker, index + marker.length)
        if (end === -1) {
          output += line.slice(index)
          return output
        }
        output += line.slice(index, end + marker.length)
        index = end + marker.length
        continue
      }
    }

    if (line.startsWith("![[", index) && !isEscaped(line, index)) {
      const end = line.indexOf("]]", index + 3)
      if (end === -1) {
        output += line.slice(index)
        return output
      }

      const raw = line.slice(index + 3, end)
      output += resolve(raw) ?? line.slice(index, end + 2)
      index = end + 2
      continue
    }

    output += line[index]
    index++
  }

  return output
}

/**
 * Convert Obsidian image embeds (`![[image.png]]`) into Markdown/HTML images
 * that Marp can render, using the same asset URLs that Quartz emits.
 */
export function resolveEmbeddedImages(markdown: string, options: EmbeddedImageOptions): string {
  const noteDir = path.posix.dirname(options.notePath)
  const newline = markdown.includes("\r\n") ? "\r\n" : "\n"
  const lines = markdown.split(/\r?\n/)
  const inComment = { value: false }
  let fence: string | undefined

  const resolve = (raw: string) => resolveEmbed(raw, options, noteDir)

  return lines
    .map((line) => {
      if (fence) {
        if (isClosingFence(line, fence)) fence = undefined
        return line
      }

      const openingFence = FENCE_RE.exec(line)
      if (openingFence) {
        fence = openingFence[1]
        return line
      }

      return transformLine(line, inComment, resolve)
    })
    .join(newline)
}
