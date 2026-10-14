import type { MarpSlideOptions } from "../types"
import { defaultOptions } from "../types"

type Frontmatter = Record<string, unknown> | undefined

const asTags = (tags: unknown): string[] => {
  if (Array.isArray(tags)) {
    return tags.filter((tag): tag is string => typeof tag === "string")
  }
  if (typeof tags === "string") {
    return tags.split(/[,\s]+/).filter(Boolean)
  }
  return []
}

/**
 * A note is a presentation when its frontmatter has `presentation: true` (boolean
 * or string) or when it carries the configured presentation tag.
 */
export function isPresentation(
  frontmatter: Frontmatter,
  opts: MarpSlideOptions = defaultOptions,
): boolean {
  if (!frontmatter) return false

  const flag = frontmatter[opts.frontmatterKey]
  if (flag === true || flag === "true") return true

  const tags = asTags(frontmatter.tags)
  return tags.some((tag) => tag === opts.tag || tag.startsWith(`${opts.tag}/`))
}

/** Remove a leading YAML frontmatter block so Marp does not parse it as directives. */
export function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").replace(/^\s+/, "")
}

// --- Minimal re-implementation of Quartz's relative path helpers -------------
// Kept local so the browser component bundle stays self-contained.

function stripSlashes(s: string, onlyStripPrefix = false): string {
  if (s.startsWith("/")) s = s.substring(1)
  if (!onlyStripPrefix && s.endsWith("/")) s = s.slice(0, -1)
  return s
}

function endsWith(s: string, suffix: string): boolean {
  return s === suffix || s.endsWith("/" + suffix)
}

function trimSuffix(s: string, suffix: string): string {
  return endsWith(s, suffix) ? s.slice(0, -suffix.length) : s
}

function simplifySlug(fp: string): string {
  const res = stripSlashes(trimSuffix(fp, "index"), true)
  return res.length === 0 ? "/" : res
}

function pathToRoot(slug: string): string {
  let rootPath = slug
    .split("/")
    .filter((x) => x !== "")
    .slice(0, -1)
    .map(() => "..")
    .join("/")
  if (rootPath.length === 0) rootPath = "."
  return rootPath
}

function joinSegments(...segments: string[]): string {
  if (segments.length === 0) return ""
  let joined = segments
    .filter((segment) => segment !== "" && segment !== "/")
    .map((segment) => stripSlashes(segment))
    .join("/")
  if (segments[0]?.startsWith("/")) joined = "/" + joined
  if (segments[segments.length - 1]?.endsWith("/")) joined = joined + "/"
  return joined
}

/** Resolve a slug relative to the page identified by `current`. */
export function resolveRelative(current: string, target: string): string {
  return joinSegments(pathToRoot(current), simplifySlug(target))
}
