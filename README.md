# FastBilly

Public hub for [fastbilly.com](https://fastbilly.com) — Bill Hudak's operator persona.
Static site (HTML/CSS/JS), no build step. Deploy directly to Vercel.

## Sections

- Hero with a Get in touch panel (form, LinkedIn, Instagram, QR card)
- Advise / Build / Show the stack
- Selected work: GOAT ILK feature, anonymized client work, Ouroboros (PIN-gated)
- Company of One stack, loop, costs and vibe-coding comparison (`#stack`)
- Bona fides, events, off the clock, contact form

## QR card (`/card/`)

Phone-first conference card with LinkedIn, Instagram and site QR codes, generated in the
browser by the vendored `assets/qrcode.js` (MIT, Kazuhiko Arase). The WhatsApp tab is
PIN-locked: `card/wa.enc.json` holds AES-GCM ciphertext; the 8-digit PIN derives the key (PBKDF2-SHA256, 600k iterations) on the device, and the unlocked link is remembered in a first-party cookie until Lock is tapped. No plaintext number is in this repo.
To change the number or PIN, regenerate `vault.enc.json` with the same format.

## Contact form

Posts to FormSubmit (`formsubmit.co/ajax/...`) and falls back to a mailto link if the relay fails.

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
