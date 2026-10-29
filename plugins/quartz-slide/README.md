# quartz-slide

Render notes marked as presentations into standalone [Marp](https://marp.app/)
decks at build time. Each deck is written to its own HTML file and linked from
the note with a toolbar button that opens in a new tab.

The plugin is both an **emitter** (writes the decks) and a **component** (adds
the toolbar link). Rendering uses `@marp-team/marp-core`.

## Setup

The plugin is a local Quartz plugin. Enable it in `quartz.config.yaml`:

```yaml
plugins:
  - source: ./plugins/quartz-slide
    enabled: true
    options:
      theme: gaia
      class: invert
    layout:
      position: left
      priority: 37
      group: toolbar
```

`@marp-team/marp-core` must be installed as a root dependency.

## Marking a note as a presentation

A note is rendered as a deck when **either** is true:

- its frontmatter contains `presentation: true` (or `"true"`), or
- its frontmatter `tags` contains the configured tag (`presentation` by default,
  including sub-tags such as `presentation/internal`).

```yaml
---
title: Feuerwehr im Winter
presentation: true
tags:
  - presentation
---
```

Only these notes get a deck and a toolbar link. The note itself is still rendered
as a normal Quartz page.

## Slides

Slides are separated by a horizontal rule (`---` on its own line):

```markdown
# Title slide

---

## Second slide

Content
```

The note's Quartz frontmatter is stripped before rendering, so Marp global
directives placed in the note frontmatter are not used. Configure the deck with
plugin options or the per-note keys below instead.

Marp local directives still work per slide, for example:

```markdown
<!-- _class: invert -->

## This slide is inverted

<!-- _paginate: false -->
```

Speaker notes are HTML comments inside a slide. They are not shown on the slide
but appear in the presenter view:

```markdown
## Second slide

Content

<!--
Remember to mention the winter tyres.
Numbers are on the handout.
-->
```

## Options

| Option           | Default        | Description                                                                  |
| ---------------- | -------------- | ---------------------------------------------------------------------------- |
| `outputDir`      | `presentation` | Output directory (under `public/`) for generated decks.                      |
| `tag`            | `presentation` | Frontmatter tag that marks a note as a presentation.                         |
| `frontmatterKey` | `presentation` | Frontmatter boolean key that marks a note as a presentation.                 |
| `theme`          | `""`           | Marp theme name: `default`, `gaia`, or `uncover`. Empty means `default`.     |
| `themeCss`       | `""`           | Path (relative to the project root) to a custom Marp theme CSS file.         |
| `class`          | `""`           | Global Marp class directive applied to every slide, e.g. `invert` or `lead`. |

### Themes

Built-in themes are `default`, `gaia`, and `uncover`. Some themes provide extra
classes, for example gaia supports `invert` and `lead`:

```yaml
options:
  theme: gaia
  class: invert
```

For multiple classes, space-separate them (`class: invert lead`).

Per-note overrides take precedence over the plugin options:

```yaml
---
presentation: true
presentationTheme: uncover
presentationClass: invert lead
---
```

`presentation_theme` / `presentation_class` also work.

### Custom themes

Point `themeCss` at a stylesheet that declares a theme name:

```css
/* @theme my-theme */

section {
  background: #101820;
  color: #f2f2f2;
}
```

```yaml
options:
  themeCss: plugins/quartz-slide/themes/my-theme.css
```

If `theme` is left empty, the name declared in the CSS is used automatically.
Otherwise set `theme` to that name explicitly.

A custom theme can inherit Marp's default theme with `@import "default";`, which
keeps headings, tables, code blocks, pagination, and auto-scaling intact. The
bundled Solarized theme does exactly that.

### Bundled: Solarized

`themes/solarized.css` is a Solarized theme (dark by default) with a monospace
type stack. Enable it with:

```yaml
options:
  theme: solarized
  themeCss: plugins/quartz-slide/themes/solarized.css
```

Add `class: invert` for the light variant (Solarized Light), or use the
per-note `presentationClass: invert`. The usual Solarized accents are used for
headings (yellow, blue, cyan, green, violet), links, inline code, tables, and
syntax highlighting.

## Output and URL

A note with slug `10-19-feuerwehr/16-praesentationen/feuerwehr-im-winter` produces:

```
public/presentation/10-19-feuerwehr/16-praesentationen/feuerwehr-im-winter.html
```

and is served at the extensionless URL
`/presentation/10-19-feuerwehr/16-praesentationen/feuerwehr-im-winter`.

The toolbar button on the note links to that URL and opens it in a new tab.

## Viewer controls

The generated deck is a single self-contained HTML file with a small viewer:

- `ArrowRight` / `ArrowDown` / `Space` / `Enter` / `PageDown`: next slide
- `ArrowLeft` / `ArrowUp` / `PageUp`: previous slide
- `Home` / `End`: first / last slide
- `p`: open the presenter view in a new window
- `f`: toggle fullscreen
- Click the right or left half of the screen to move forward or back
- Printing outputs one slide per page

### Presenter view

Press `p` while presenting. A second window opens with the current slide, the
next slide, the speaker notes, a slide counter, and a timer. Navigation in the
presenter window controls the audience window (and vice versa), so you can put
the audience window on the projector and keep the presenter window on your
laptop. On a single screen it works as a rehearsal view.

The presenter window reads the notes embedded from the Markdown, so keep the
deck tab open. Press `p` or `Esc` in the presenter window to close it. It syncs
through `BroadcastChannel` (falling back to `postMessage` between the two
windows).

## Development

Build the plugin bundle and type declarations:

```sh
npm run build:slide
# or
node plugins/quartz-slide/build.mjs
```

This writes `dist/index.js` (emitter), `dist/components/index.js` (component),
and the matching `.d.ts` files.

Local plugins are symlinked and are **not** built during `install-plugins`, so
the generated `dist/` must be committed together with the source.
