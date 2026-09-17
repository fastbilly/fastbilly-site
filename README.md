# FastBilly

Public hub for [fastbilly.com](https://fastbilly.com) — Bill Hudak's operator persona.

The repo now hosts two things behind one Vercel deploy:

1. **Root marketing hub** — the original static HTML/CSS/JS at the repo root (`index.html`, `styles.css`, `app.js`). Still no framework, still hand-authored.
2. **`/career`** — the FastBilly Career SPA (Vite + React + TypeScript) that lives in [`career/`](./career). Built once and served as a subpath of fastbilly.com.

## Sections

- Hero + terminal strip
- Apps I've built as a company of one
- The 10-hour engagement (fixed-scope retention diagnostic)
- Where I'll be (upcoming events)
- Bona fides
- Writing & notes
- Contact

## Brand system

Reuses the FastBilly tokens from Company of One:

- Magenta `#FF6BD8` · Teal `#4FD1C5` · Warm dark `#211E24`
- Inter (body) · Instrument Serif (display) · JetBrains Mono (accents)
- Five-peak crown mark

## Local

Static root only (fast iteration on the marketing hub):

```bash
python3 -m http.server 8000
```

Career SPA in isolation:

```bash
npm run dev:career
```

Full production build (root + Career, matches what Vercel runs):

```bash
npm run build
npx serve dist          # or any static file server pointed at dist/
```

## Deploy

Single Vercel project (`fastbilly-site`, aliased to `fastbilly.com`).

- Framework preset: **Other**
- Build command: `npm run build`
- Output directory: `dist`
- Install command: default (`npm install`)

The build orchestrator in `scripts/assemble.mjs` copies the static root files into
`dist/` and drops the Career Vite build into `dist/career/`. `vercel.json` adds a
SPA rewrite so any `/career/*` deep-link falls through to `career/index.html`.

## Career env vars (set on the `fastbilly-site` Vercel project)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Both are baked into the Career bundle at build time — set them in the same
Vercel project that deploys fastbilly.com.
