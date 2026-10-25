# AGENTS.md — Agent Guidelines

This file is for AI agents working in this repository. It records project conventions, the
content contract, and how to verify changes. Read it before modifying the project so the
"content is separate from code" design stays intact.

## Project overview

Uta-Kotoba (歌言葉) is a purely static Japanese lyric study reader: browse a song library,
read lyrics line by line, hover annotated words for glosses, toggle furigana / annotations /
translations, and preview a song through an external embed.

- **No backend, no database, and no media files in the repository.** Audio is only embedded
  as a Bilibili / YouTube / NetEase iframe or a direct `<audio>` URL.
- Lyrics and glosses are for personal Japanese study only; the source is recorded in the
  `source` field of `song.yaml`.
- Stack: Vue 3 + TypeScript + Vite 7 + Tailwind CSS 4 + vue-router (hash routing), tested with
  Vitest.

## Commands

```bash
pnpm install      # install dependencies (packageManager pins pnpm@12.15.0)
pnpm dev          # local dev server
pnpm test         # Vitest: matcher + content validation (run after content/core changes)
pnpm typecheck    # vue-tsc --noEmit
pnpm build        # vue-tsc typecheck + vite build into dist/
pnpm preview      # preview the production build

pnpm lint         # Biome: lint + format check (JS/TS/JSON)
pnpm lint:fix     # Biome: apply safe lint fixes, import sorting and formatting
pnpm format       # Prettier: format Vue/CSS/Markdown/HTML
pnpm format:check # Prettier: verify the above without writing
pnpm verify       # format:check + lint + test + build (the pre-commit gate)
```

## Layout

```
data/songs/<slug>/   # one directory per song; content is fully separate from code
src/core/            # types, loader (import.meta.glob), matcher, search normalization
src/components/      # song card, lyric line, word token, tooltip, player, settings bar
src/views/           # home, song, 404
src/composables/     # persisted display settings (localStorage)
tests/               # matcher.spec.ts + content.spec.ts
```

The `@` alias points to `src/`.

## Content contract (required reading when adding or editing a song)

Adding a song means dropping files into `data/songs/<slug>/` — **no code changes needed**
(`src/core/loader.ts` imports everything statically via `import.meta.glob`). The `slug` is the
segment in the `/song/<slug>` route; use a URL-friendly lowercase kebab-case name.

### song.yaml

`title` and `artist` are required (both must be non-empty strings; tests enforce this).
Optional fields: `title_zh`, `title_en`, `tags`, `difficulty`, `source`, `audio`.

```yaml
audio:
  provider: netease # bilibili | youtube | netease | audio
  id: '29816860' # bilibili=BVID, youtube=video id, netease=song id
  start: 0 # optional, start offset in seconds
```

For `provider: audio`, use the `url` field instead of `id`.

### lyrics.txt

Raw lyrics, one line per lyric. A blank line separates stanzas (consecutive line breaks inside
a stanza are collapsed when parsing). Lines are trimmed; blank lines do not count toward the
translation line count.

### annotations.<lang>.yaml

```yaml
- word: 夏 # matching key: must match the surface form in the lyrics exactly
  reading: なつ # must be kana only (tests enforce); also rendered as furigana
  romaji: natsu # optional, shown in the tooltip only
  pos: 名词 # optional part of speech
  meaning: 夏天 # required
  note: Extra context # optional
```

- `CONTENT_LANGS` is currently `zh` / `en`, mapping to `annotations.zh.yaml` and
  `annotations.en.yaml`.
- A `word` must not repeat within one file (tests fail; the loader also skips later duplicates).
- **Every annotation must occur at least once in the lyrics** (`content.spec.ts` enforces
  this); an annotation that never matches fails the tests.
- Matching rules: at each position the longest surface form wins (annotating both `夏` and
  `夏休み` still highlights `夏休み`), every occurrence is highlighted, and the vocabulary
  sidebar counts occurrences and jumps to the matching line.

### translations.<lang>.yaml

A plain string list where **each entry maps in order to one non-empty lyric line**. The count
must exactly match the number of non-empty lyric lines (tests enforce this); write `""` to skip
a line.

> In dev the loader only prints console warnings for content problems, but `content.spec.ts`
> in `pnpm test` is a hard gate — any inconsistency fails the suite. Always run the tests before
> committing.

## Tooling

- **Biome** owns JavaScript/TypeScript/JSON: linting, formatting and import sorting
  (`biome.json`). The shared style is 2-space indentation, single quotes, no semicolons,
  trailing commas, 100 columns, LF line endings.
- **Prettier** owns `.vue`, `.css`, `.md` and `.html` (`.prettierrc.json`). It deliberately
  ignores JS/TS/JSON and `data/` (see `.prettierignore`), so the two formatters never overlap
  or fight over the same file.
- Biome does not lint `.vue` files: its Vue parser treats template-only component usage as
  unused imports, which produces false positives in `<script setup>`.
- `.editorconfig` keeps all editors on the same 2-space / LF baseline.
- `pnpm verify` is the pre-commit gate: Prettier check, Biome check, Vitest and the production
  build. CI runs `pnpm lint`, `pnpm format:check` and `pnpm test` on every push to `main`.

## Code conventions

- **All UI strings go through `t()` from `src/core/i18n.ts`.** Never hardcode Chinese or English
  text in components. New message keys must be added to both `zh` and `en` (enforced by the
  `satisfies` constraint).
- To add a content language: update `CONTENT_LANGS` in `src/core/types.ts`, add the messages in
  `i18n.ts`, and add the corresponding `annotations.<code>.yaml` / `translations.<code>.yaml`
  files.
- Display settings (language, furigana, annotations, translations) go through
  `src/composables/useSettings.ts`; the persistence key is `uta-kotoba:settings`.
- Routing uses hash mode (`createWebHashHistory`), so static hosting needs no 404 fallback.
- `base` in `vite.config.ts` comes from the `BASE_PATH` environment variable (the GitHub Pages
  workflow injects `/<repo-name>/`) and falls back to `./` locally.
- GitHub Pages deployment is handled by `.github/workflows/deploy.yml` on every push to `main`
  (test first, then build).
- All code, comments, log messages, and project documentation (`README.md`, `AGENTS.md`) must
  be written in standard English.

## Version control and commits

This project uses **Jujutsu (`jj`) in co-located mode with Git** (`jj git init --colocate`), so
`jj` and `git` can be mixed freely.

- Commit messages are short and in English; Gitmoji + Conventional Commits is recommended
  (e.g. `✨ feat: add song ...`, `🐛 fix: ...`, `📝 docs: ...`).
- Use `jj describe -m "<message>"` to set the current working change's description, then
  `jj new` to finalize it and start a clean working copy.
- Prefer `jj absorb` for small follow-up fixes to existing commits; use `jj undo` / `jj op log`
  to experiment and roll back safely.
- **Never run `git push` / `jj git push` unless the user explicitly asks for it.**
- Commit policy: ask the user before committing small changes; commit large but single-purpose
  changes directly; ask first for large changes involving complex logic.
- Before committing, run `pnpm verify` so formatting, lint, tests and the build are all green;
  a commit should never contain unformatted or lint-erroring files.
