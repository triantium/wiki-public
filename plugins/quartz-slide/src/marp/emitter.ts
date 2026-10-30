import fs from "fs"
import path from "path"
import { Marp } from "@marp-team/marp-core"
import type {
  BuildCtx,
  FilePath,
  ProcessedContent,
  QuartzEmitterPlugin,
  StaticResources,
} from "@quartz-community/types"
import type { MarpSlideOptions } from "../types"
import { defaultOptions } from "../types"
import { resolveEmbeddedImages } from "../util/embeds"
import { isPresentation, stripFrontmatter } from "../util/slides"
import { renderDeck } from "./deck"

const MarpSlides: QuartzEmitterPlugin<Partial<MarpSlideOptions>> = (userOpts) => {
  const opts: MarpSlideOptions = { ...defaultOptions, ...userOpts }

  return {
    name: "MarpSlides",
    async emit(
      ctx: BuildCtx,
      content: ProcessedContent[],
      _resources: StaticResources,
    ): Promise<FilePath[]> {
      const marp = new Marp()
      const written: FilePath[] = []

      let defaultTheme = opts.theme || "default"

      if (opts.themeCss) {
        const cssPath = path.resolve(process.cwd(), opts.themeCss)
        const themeCss = await fs.promises.readFile(cssPath, "utf8")
        marp.themeSet.add(themeCss)
        const themeName = themeCss.match(/@theme\s+([\w-]+)/)?.[1]
        if (themeName && !opts.theme) {
          defaultTheme = themeName
        }
      }

      if (!marp.themeSet.has(defaultTheme)) {
        console.warn(
          `[quartz-slide] unknown Marp theme "${defaultTheme}", falling back to "default"`,
        )
        defaultTheme = "default"
      }

      for (const [_tree, vfile] of content) {
        const data = vfile.data as Record<string, unknown>
        const frontmatter = data.frontmatter as Record<string, unknown> | undefined
        if (!isPresentation(frontmatter, opts)) continue

        const slug = data.slug as string | undefined
        if (!slug) continue

        let markdown = stripFrontmatter(String(vfile.value))
        if (markdown.trim().length === 0) continue

        const notePath = typeof data.relativePath === "string" ? data.relativePath : `${slug}.md`
        markdown = resolveEmbeddedImages(markdown, {
          notePath,
          deckPath: path.posix.join(opts.outputDir, slug),
          allFiles: ctx.allFiles,
          warn: (message) => console.warn(`[quartz-slide] ${message}`),
        })

        const perNoteTheme = frontmatter?.presentationTheme ?? frontmatter?.presentation_theme
        const requestedTheme = typeof perNoteTheme === "string" ? perNoteTheme : defaultTheme
        const theme = marp.themeSet.has(requestedTheme) ? requestedTheme : defaultTheme

        const perNoteClass = frontmatter?.presentationClass ?? frontmatter?.presentation_class
        const themeClass =
          typeof perNoteClass === "string" ? perNoteClass.trim() : String(opts.class ?? "").trim()

        const directives = [`theme: ${theme}`]
        if (themeClass.length > 0) {
          directives.push(`class: ${themeClass}`)
        }
        const source = `---\n${directives.join("\n")}\n---\n\n${markdown}`

        const { html, css, comments } = marp.render(source)
        const title =
          typeof frontmatter?.title === "string" && frontmatter.title.length > 0
            ? frontmatter.title
            : slug

        const page = renderDeck({ title, marpHtml: html, marpCss: css, notes: comments })
        const outPath = path.join(ctx.argv.output, opts.outputDir, `${slug}.html`)
        await fs.promises.mkdir(path.dirname(outPath), { recursive: true })
        await fs.promises.writeFile(outPath, page)
        written.push(outPath as FilePath)
      }

      return written
    },
  }
}

export default MarpSlides
