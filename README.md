# FastBilly

Public hub for [fastbilly.com](https://fastbilly.com) — Bill Hudak's operator persona.
Static site (HTML/CSS/JS), no build step. Deploy directly to Vercel.

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

Any static server works, e.g.:

```bash
python3 -m http.server 8000
```

## Deploy

- Framework preset: Other
- Output directory: `.` (root)
- Build command: none
