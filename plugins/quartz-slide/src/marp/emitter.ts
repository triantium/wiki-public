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

      for (const [_tree, vfile] of content) {
        const data = vfile.data as Record<string, unknown>
        const frontmatter = data.frontmatter as Record<string, unknown> | undefined
        if (!isPresentation(frontmatter, opts)) continue

        const slug = data.slug as string | undefined
        if (!slug) continue

        const markdown = stripFrontmatter(String(vfile.value))
        if (markdown.trim().length === 0) continue

        const { html, css } = marp.render(markdown)
        const title =
          typeof frontmatter?.title === "string" && frontmatter.title.length > 0
            ? frontmatter.title
            : slug

        const page = renderDeck({ title, marpHtml: html, marpCss: css })
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
