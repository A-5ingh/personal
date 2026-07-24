plan.md — Maintenance-Free Blog System
Goal
Publishing a blog post requires one action: add an HTML file to blogs/ (locally or via GitHub web UI) and push/commit. Zero manual steps beyond that — no index updates, no sitemap edits, no pushes of generated files. CI generates everything at deploy time.
Core Principles
1. Generated files are deploy-only artifacts — blogs/index.json and sitemap.xml are built in CI, deployed, never committed, never touched by humans
2. Zero-build authoring — posts are plain HTML with meta tags; no markdown pipeline
3. Local preview is zero-step — client JS falls back to parsing the dev server's directory listing when index.json is absent
4. No new dependencies — generator is plain Node (no npm install); site stays single-file + CDN Tailwind
File Layout
blogs/
  index.html                              ← NEW: listing page (URL: /blogs/)
  template.html                           ← NEW: authoring template (excluded from index)
  2026-07-23-using-opencode-for-free.html ← RENAMED from using-opencode-for-free.html
  index.json                              ← CI-GENERATED, gitignored
scripts/
  gen-blog-index.js                       ← NEW: plain Node, no deps
sitemap.xml                               ← CI-GENERATED, gitignored (remove from repo)
Step 1 — Post convention
Filename: blogs/YYYY-MM-DD-slug.html. Required in <head>:
- <title>Post Title — Amarbir Singh</title> (suffix stripped by generator)
- <meta name="date" content="YYYY-MM-DD"> (fallback: filename prefix)
- <meta name="excerpt" content="..."> (fallback: first <p>, 160 chars)
- <meta name="tags" content="ai, tools"> (optional, comma-separated)
Action: rename existing post, add the three meta tags, keep content.
Step 2 — blogs/template.html
Copy of the renamed post with {{TITLE}}/{{DATE}}/{{EXCERPT}}/{{TAGS}} placeholders, explanatory header comment, back-link to /blogs/, shared theme script (Step 5).
Step 3 — scripts/gen-blog-index.js
1. Read blogs/*.html, exclude index.html + template.html
2. Extract title/date/excerpt/tags per file (with fallbacks above)
3. Sort: date desc, then slug desc
4. Write blogs/index.json:
{
  "generated": "<ISO>",
  "posts": [{ "slug": "...", "title": "...", "date": "...", "excerpt": "...", "tags": ["..."], "url": "/blogs/<file>.html" }]
}
5. Regenerate sitemap.xml: / (1.0), /blogs/ (0.9), each post (0.8); lastmod = post date (home = today)
Step 4 — blogs/index.html (listing page)
Site-matching aesthetic (same head pattern, CSS vars, Inter, Tailwind CDN). Contains:
- Back link to /, <h1>Writing</h1>
- Search input (live-filters title/excerpt/tags) + sort toggle (Newest ⇄ Oldest)
- List: date (small muted) · title (link) · excerpt · tag chips
- Data loading with fallback: try /blogs/index.json; on failure fetch /blogs/, parse directory listing for YYYY-MM-DD-*.html, fetch each file, extract meta via DOMParser; both paths feed one render function; total failure → "No posts yet."
- Shared theme script; no pagination
Step 5 — Shared theme snippet (all blog pages)
var t = localStorage.getItem('site-theme') || 'system';
var dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
if (dark) document.documentElement.setAttribute('data-theme', 'dark');
No toggle on blog pages — homepage owns theme switching.
Step 6 — Homepage (index.html)
1. Nav: Blog link next to Resume → /blogs/
2. "Writing" section between About and skill-area: fetch posts (same fallback logic), render 3 newest (date + linked title + one-line excerpt), "All posts →" link; hide entire section on failure or zero posts
3. llms.txt: update blog URL, add /blogs/ to Key Pages
Step 7 — CI (deploy.yml)
Insert between Checkout and Deploy:
      - name: Generate blog index
        run: node scripts/gen-blog-index.js
Deploy command unchanged (pages deploy . picks up generated files).
Step 8 — Repo hygiene & docs
- .gitignore: add blogs/index.json, sitemap.xml; remove committed sitemap.xml from repo
- AGENTS.md: new "Blogging" section — workflow (template → YYYY-MM-DD-slug.html → push, local or web UI), note generated artifacts, note fallback handles local preview
- robots.txt: unchanged (sitemap URL same)
Acceptance Criteria
1. node scripts/gen-blog-index.js → valid index.json + sitemap.xml per schema; template/listing excluded
2. python3 -m http.server 8000 without running the generator → /blogs/ still lists posts via fallback; homepage Writing section works; no console errors
3. Search filters live; sort flips order
4. Post pages respect stored light/dark theme
5. New post file → appears everywhere after push, zero other edits
6. Homepage behavior otherwise unchanged (intro, hero, skills, Konami, cursor coords)
7. git status after CI-style generation → clean (artifacts ignored)
Out of Scope
RSS feed, pagination, tag pages, markdown authoring, llms.txt auto-generation.