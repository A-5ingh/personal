# AGENTS.md

## Architecture

- Single-page static site: `index.html` is the only code file
- No build system, bundler, or package manager
- Tailwind CSS v4 via CDN (`@tailwindcss/browser@4`) — no local build pipeline
- All JS is inline in `index.html` (no external scripts)
- Font: Inter via Google Fonts
- Blog posts in `blogs/` directory (simple HTML format)

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
- `_headers` file sets cache lifetimes (1 year for assets, no cache for HTML)
- CI runs `node scripts/gen-blog-index.js` to generate `blogs/index.json` and `sitemap.xml`

## Blogging

- Posts live in `blogs/` as plain HTML files
- Name new posts: `blogs/YYYY-MM-DD-slug.html`
- Copy from `blogs/template.html` and fill in title, date, excerpt, tags, and GitHub issue number
- Create a GitHub issue for each post and set `<meta name="github-issue" content="NUMBER">`
- Push to `main` — CI regenerates the blog index, sitemap, and deploys
- No manual updates to `blogs/index.json` or `sitemap.xml` — both are generated
- Run `node scripts/gen-blog-index.js` locally to preview new posts in listings

## Comments & Likes

- Powered by GitHub Issues via Cloudflare Pages Functions
- Each post maps to one GitHub issue (`<meta name="github-issue">`)
- Readers sign in with GitHub to leave likes (heart reactions) and comments inline
- One-click likes and inline comments are handled by `/api/like` and `/api/comment`
- Setup required:
  1. Register a GitHub OAuth App at https://github.com/settings/developers
  2. Set Authorization callback URL to `https://singhamarbir.com/api/auth`
  3. Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` as Cloudflare Pages environment variables
  4. Redeploy so Functions can read them

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
