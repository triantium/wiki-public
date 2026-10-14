import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import type { MarpSlideOptions } from "../types"
import { defaultOptions } from "../types"
import { isPresentation, resolveRelative } from "../util/slides"
// @ts-ignore - bundled as text by the build script
import style from "../styles/slide.css"

const Slide: QuartzComponentConstructor<Partial<MarpSlideOptions>> = (userOpts) => {
  const opts: MarpSlideOptions = { ...defaultOptions, ...userOpts }

  const Component: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const slug = fileData.slug
    if (!slug) return null

    const frontmatter = fileData.frontmatter as Record<string, unknown> | undefined
    if (!isPresentation(frontmatter, opts)) return null

    const href = resolveRelative(slug, `${opts.outputDir}/${slug}`)

    return (
      <a
        class={[displayClass, "slide-button"].filter(Boolean).join(" ")}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open slides"
        title="Open slides"
      >
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 -960 960 960"
          fill="currentColor"
          xmlSpace="preserve"
        >
          <path d="m380-300 280-180-280-180v360ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z" />
        </svg>
      </a>
    )
  }

  Component.css = style
  return Component
}

export default Slide
