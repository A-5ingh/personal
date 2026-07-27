# AGENTS.md

## Architecture

- Single-page static site: `index.html` is the only code file
- Tailwind CSS v4 via CDN (`@tailwindcss/browser@4`) — no local build pipeline
- All JS is inline in `index.html` (no external scripts)
- Font: Inter via Google Fonts
- Blog posts in `blogs/` directory (simple HTML format)
- `marked` dependency in `package.json` for issue-to-post conversion

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
- CI runs `node scripts/issue-to-post.js` then `node scripts/gen-blog-index.js` to generate `blogs/index.json` and `sitemap.xml`

## Blogging

- Posts live in `blogs/` as plain HTML files
- Name new posts: `blogs/YYYY-MM-DD-slug.html`
- Copy from `blogs/template.html` and fill in `{{TITLE}}`, `{{DATE}}`, `{{EXCERPT}}`, `{{TAGS}}`, `{{ISSUE}}`, `{{CONTENT}}`
- Create a GitHub issue for each post and set `<meta name="github-issue" content="NUMBER">`
- Push to `main` — CI regenerates the blog index, sitemap, and deploys
- No manual updates to `blogs/index.json` or `sitemap.xml` — both are generated
- Run `node scripts/gen-blog-index.js` locally to preview new posts in listings
- Run `GITHUB_TOKEN=ghp_xxx node scripts/issue-to-post.js` locally to test issue-to-post conversion

### Auto-publish from GitHub Issues

- Create a GitHub issue with label `blog` to auto-publish as a blog post
- Issue body format:
  ```markdown
  ---
  excerpt: "Short summary for listing"
  tags: tag1, tag2
  ---

  ## Section title

  Content in Markdown...
  ```
- The `scripts/issue-to-post.js` script (run in CI) fetches open issues with `blog` label
- Converts Markdown → HTML via `marked`, renders into `blogs/YYYY-MM-DD-slug.html`
- Adds `published` label and a comment with the published URL to the issue
- Edit an issue → next push or instant trigger regenerates the post
- Remove `blog` label → post stays (does not delete)

### Images in blog posts

- Add images to issue body using `![alt text](image-url)` Markdown syntax
- Drag-and-drop an image into a GitHub issue to auto-upload it — the URL will be embedded in the post
- Images render as responsive (`max-width: 100%`), lazy-loaded, with rounded corners
- GitHub image URLs are cleaned of JWT/auth tokens during conversion

### Instant publishing on issue create/edit

- The deploy workflow triggers on `issues: [opened, edited, labeled]` in addition to `push`
- When you create or edit a `blog`-labeled issue, the workflow runs immediately
- The post is generated and deployed within ~1 minute
- Only the specific changed issue is processed (via `ISSUE_NUMBER` env var)
- On `push` to `main`, all `blog`-labeled issues are processed as a full rebuild
- The `GITHUB_TOKEN` auto-token does not trigger recursive workflow runs

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
  5. The OAuth flow requests `repo` scope; if your repo is public and you prefer narrower scope, change `scope` in `functions/api/login.js` to `public_repo`
  6. `GITHUB_CLIENT_SECRET` is also used to sign the short-lived token exchanged between `/api/auth` and `/api/finish-auth`
- Security:
  - API endpoints reject cross-origin POSTs
  - All redirects are validated to same-origin paths
  - Issue numbers and comment text are sanitized
  - Comments are rendered with escaped HTML and only http/https links
  - Rate limit: 10 likes/comments per minute per IP
  - OAuth callback sets cookie directly in a 302 redirect (skips Safari ITP)

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
