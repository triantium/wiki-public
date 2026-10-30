# AGENTS.md

## Repo layout

- This is a Quartz v5 site fork. `content/` is the published German wiki; `docs/` is inherited Quartz documentation, not site content.
- `quartz.config.yaml` is the live config; `quartz.config.default.yaml` is the upstream template. `quartz/` is the generator; `.quartz/` and `public/` are generated/ignored.
- `plugins/quartz-slide/` is the local Marp slide plugin. It is symlinked into `.quartz/plugins/quartz-slide`; read `plugins/quartz-slide/README.md` before changing it.
- Keep frontmatter intact. The `created-modified-date` plugin reads `created`, `modified`, and `published` from frontmatter before falling back to git/filesystem dates.

## Commands

- Install: `npm ci` (Node 24; `.npmrc` enables `engine-strict`).
- Preview site: `npx quartz build --serve` (defaults: `-d content -o public`, port 8080).
- Build site: `npx quartz build`.
- After changing `plugins/quartz-slide/src`: `npm run build:slide && npx quartz build`.
- After changing plugins in `quartz.config.yaml`: `npx quartz plugin install` (or `npm run install-plugins`).
- Full tests: `npm test` (Node's built-in test runner via `tsx`). Single test: `npx tsx --test quartz/util/path.test.ts`.
- Format only touched files: `npx prettier <files> --write`.

## Local plugin gotchas

- `npm run install-plugins` only refreshes/symlinks plugins; it does not build local plugin source. Site builds load `dist/` through the symlink, so a stale `dist` silently wins.
- `plugins/quartz-slide/dist/` is gitignored but explicitly re-included; rebuild and commit it with source changes.
- `plugins/quartz-slide/build.mjs` hand-writes the `.d.ts` files. If options in `src/types.ts` change, update the template there too.
- Presentation decks are selected by `presentation: true` or the `presentation` tag and written to `public/presentation/<slug>.html`.

## Verification gotchas

- `npm run check` currently fails before checking code: TypeScript 7.0.2 rejects `moduleResolution: "node"` with `TS5108`. Do not treat this as a regression from your change.
- Repo-wide `npx prettier . --check` has pre-existing failures in `content/**` and `renovate.json`; check only files you touched.
- `.github/workflows/ci.yaml` is inherited from upstream and guarded to `jackyzha0/quartz`; in this fork use local commands rather than assuming CI runs. `deploy.yml` builds on pushes to `v5`.
