export interface MarpSlideOptions {
  /** Directory (relative to the output root) that generated decks are written to. */
  outputDir: string
  /** Frontmatter tag that marks a note as a presentation. */
  tag: string
  /** Frontmatter boolean key that marks a note as a presentation. */
  frontmatterKey: string
  /**
   * Marp theme name. Built-in themes: "default", "gaia", "uncover".
   * Leave empty to use "default" (or the theme declared by `themeCss`).
   */
  theme: string
  /**
   * Optional path (relative to the project root) to a custom Marp theme CSS
   * file. The file must declare a name, e.g. `/* @theme my-theme *\/`.
   */
  themeCss: string
  /**
   * Global Marp class directive, e.g. "invert" or "lead" (space-separated for
   * multiple classes). Applied to every slide in the deck.
   */
  class: string
}

export const defaultOptions: MarpSlideOptions = {
  outputDir: "presentation",
  tag: "presentation",
  frontmatterKey: "presentation",
  theme: "",
  themeCss: "",
  class: "",
}
