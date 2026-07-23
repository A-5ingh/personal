# AGENTS.md

## Architecture

- Single-page static site: `index.html` is the only code file
- No build system, bundler, or package manager
- Tailwind CSS v4 via CDN (`@tailwindcss/browser@4`) — no local build pipeline
- All JS is inline in `index.html` (no external scripts)
- Font: Inter via Google Fonts

## Preview

```bash
python3 -m http.server 8000
# or
npx serve .
```

## Workflow

- Open `index.html` first — it's the entire site
- Make small, surgical edits; keep lines short
- Prefer sections within `index.html`; avoid external files unless necessary
- Subtle motion, Tailwind utility classes, compact top-right nav
- Single GitHub link (currently placeholder)
