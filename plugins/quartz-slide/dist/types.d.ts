export interface MarpSlideOptions {
  /** Directory (relative to the output root) that generated decks are written to. */
  outputDir: string;
  /** Frontmatter tag that marks a note as a presentation. */
  tag: string;
  /** Frontmatter boolean key that marks a note as a presentation. */
  frontmatterKey: string;
}
export declare const defaultOptions: MarpSlideOptions;
