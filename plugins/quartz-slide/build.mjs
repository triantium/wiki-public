import esbuild from "esbuild"
import { writeFile, mkdir, rm } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const root = dirname(fileURLToPath(import.meta.url))
const dist = join(root, "dist")

async function buildEmitter() {
  await esbuild.build({
    entryPoints: [join(root, "src", "index.ts")],
    outfile: join(dist, "index.js"),
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    packages: "external",
    logLevel: "warning",
  })
}

async function buildComponent() {
  await esbuild.build({
    entryPoints: [join(root, "src", "components", "index.ts")],
    outfile: join(dist, "components", "index.js"),
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2020",
    jsx: "automatic",
    jsxImportSource: "preact",
    loader: { ".css": "text" },
    logLevel: "warning",
  })
}

async function writeTypes() {
  await mkdir(join(dist, "components"), { recursive: true })
  await writeFile(
    join(dist, "types.d.ts"),
    `export interface MarpSlideOptions {
  /** Directory (relative to the output root) that generated decks are written to. */
  outputDir: string;
  /** Frontmatter tag that marks a note as a presentation. */
  tag: string;
  /** Frontmatter boolean key that marks a note as a presentation. */
  frontmatterKey: string;
  /**
   * Marp theme name. Built-in themes: "default", "gaia", "uncover".
   * Leave empty to use "default" (or the theme declared by \`themeCss\`).
   */
  theme: string;
  /**
   * Optional path (relative to the project root) to a custom Marp theme CSS
   * file. The file must declare a name, e.g. \`/* @theme my-theme *\\/\`.
   */
  themeCss: string;
  /**
   * Global Marp class directive, e.g. "invert" or "lead" (space-separated for
   * multiple classes). Applied to every slide in the deck.
   */
  class: string;
}
export declare const defaultOptions: MarpSlideOptions;
`,
  )
  await writeFile(
    join(dist, "components", "index.d.ts"),
    `import type { QuartzComponentConstructor } from "@quartz-community/types";
import type { MarpSlideOptions } from "../types.js";
declare const Slide: QuartzComponentConstructor<Partial<MarpSlideOptions>>;
export { Slide };
export type { MarpSlideOptions };
`,
  )
  await writeFile(
    join(dist, "index.d.ts"),
    `import type { QuartzEmitterPlugin } from "@quartz-community/types";
import type { MarpSlideOptions } from "./types.js";
declare const MarpSlides: QuartzEmitterPlugin<Partial<MarpSlideOptions>>;
export default MarpSlides;
export { MarpSlides };
export type { MarpSlideOptions };
`,
  )
}

async function main() {
  await rm(dist, { recursive: true, force: true })
  await buildEmitter()
  await buildComponent()
  await writeTypes()
  console.log("quartz-slide: built dist")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
