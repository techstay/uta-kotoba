# Uta-Kotoba · 歌言葉

A static Japanese lyric study reader. Browse a library of songs, read the lyrics line by
line, hover annotated words for multilingual glosses, toggle furigana, and play a song
through an external embed.

Built with Vue 3, TypeScript, Vite and Tailwind CSS. Everything is static: no backend, no
database, no media files in the repository.

## Getting started

```bash
pnpm install
pnpm dev        # local dev server
pnpm test       # matcher unit tests
pnpm build      # typecheck + production build into dist/
pnpm preview    # preview the production build
```

## Project layout

```
data/songs/<slug>/        # one directory per song
  song.yaml               # metadata (title, artist, tags, audio)
  lyrics.txt              # raw Japanese lyrics, one line per line, blank line = stanza break
  annotations.zh.yaml     # Chinese glosses
  annotations.en.yaml     # English glosses
  translations.zh.yaml    # Chinese line-by-line translations
  translations.en.yaml    # English line-by-line translations

src/core/                 # types, loader, matcher, search normalization
src/components/           # song card, lyric line, word token, tooltip, player, settings
src/views/                # home, song, not found
src/composables/          # persisted display settings
tests/                    # matcher unit tests
```

## Adding a song

1. Create `data/songs/<slug>/` (use a URL-friendly slug).
2. Add `song.yaml`:

```yaml
title: 夏の終わり
title_zh: 夏日终章
title_en: The End of Summer
artist: ヨルシカ
tags: [J-POP, N3]
difficulty: N3

# optional external audio (no media files in the repo)
audio:
  provider: youtube # bilibili | youtube | netease | audio
  id: VIDEO_ID
  start: 0
```

3. Add `lyrics.txt` with the raw Japanese lyrics. Blank lines separate stanzas.
4. Add `annotations.<lang>.yaml`:

```yaml
- word: 夏
  reading: なつ
  romaji: natsu
  pos: 名词
  meaning: 夏天
  note: Optional extra context.
```

`word` is the matching key and must be the exact surface form as it appears in the lyrics.
`reading` must be kana: it is also rendered as furigana above the word. Use the optional
`romaji` field for learners who prefer the Latin reading.
The matcher always prefers the longest annotation at each position, so annotating both
`夏` and `夏休み` still highlights `夏休み` correctly. Every occurrence of an annotated
word is highlighted. Duplicate `word` entries in one file are ignored after the first one.

5. Optionally add `translations.<lang>.yaml`. It is a plain list with **one entry per
   non-empty lyric line, in order** (use `""` to skip a line). A mismatch is reported as a
   dev-time console warning.

Supported content languages are defined in `src/core/types.ts` (`CONTENT_LANGS`). Adding a
new language means adding the code there plus `annotations.<code>.yaml` /
`translations.<code>.yaml` files and UI strings in `src/core/i18n.ts`.

## Audio

Audio is never bundled. The player starts as a click-to-load facade and then injects an
iframe (or a native `<audio>` element for direct media URLs). Supported providers:

| provider   | field           | embed                    |
| ---------- | --------------- | ------------------------ |
| `bilibili` | `id` (BVID)     | Bilibili player iframe   |
| `youtube`  | `id` (video id) | YouTube iframe           |
| `netease`  | `id` (song id)  | NetEase outchain player  |
| `audio`    | `url`           | native `<audio>` element |

## Deployment

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `main`.
Set **Settings → Pages → Source** to **GitHub Actions**. `BASE_PATH` is derived from the
repository name; the app uses hash routing, so no 404 fallback is needed.

The build is a plain static bundle, so `dist/` also works on Cloudflare Pages, Netlify, or
any static host.

## Notes

Lyrics and glosses are stored for personal language study. Audio stays on the original
platform.
