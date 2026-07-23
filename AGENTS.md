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

## Deployment

- Cloudflare Pages via GitHub Actions (`.github/workflows/deploy.yml`)
- Deploys on push to `main` branch
- Requires secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## Workflow

- Open `index.html` first — it's the entire site
- Make small, surgical edits; keep lines short
- Prefer sections within `index.html`; avoid external files unless necessary
- Subtle motion, Tailwind utility classes, compact top-right nav
- Single GitHub link (currently placeholder)

## Style Rules

- **No inline styles in HTML** — always use Tailwind utility classes
- The only exception is dynamic JS-driven styles (e.g., animation transforms, calculated values)
- If a Tailwind class doesn't exist for a value, use arbitrary values like `text-[var(--muted)]` or `w-[60vw]`
- Never use `style=""` attributes on HTML elements
