# Copilot instructions for singhamarbir.com

Purpose: guidance for future Copilot CLI/assistant sessions working on this repository.

## Build / test / lint
- No build system, package manager, or test framework present.
- Quick local preview:
  - Python: python3 -m http.server 8000 (then open http://localhost:8000)
  - Node (if installed): npx serve .

## High-level architecture
- Single-page static site: index.html is the canonical entry and contains all content sections (hero, about, projects).
- Styling uses Tailwind via CDN (@tailwindcss/browser) and a few inline styles — no build step or PostCSS by default.
- Minimal client JS for UX: a tiny, local script handles a subtle fade-in on load and smooth in-page scroll; keep scripts small and dependency-free.
- No bundler, server/API, or routing — internal navigation uses anchor links (#about, #projects).

## Key conventions / repo-specific patterns
- Single-page: prefer sections within index.html over separate pages. Use anchors for navigation (no routing).
- Tagline placement: keep the tagline close to the hero and responsive (small -> larger screens). Prefer brief phrasing (one short sentence).
- Motion: keep motion subtle and minimal (fade-in on load, smooth scrolling). Avoid heavy animations or external animation libraries.
- Styling: edit Tailwind utility classes in the HTML. Do not introduce a build pipeline unless intentionally adding tooling.
- Navigation: keep the top-right compact nav with anchors; preserve simple separator pipes ("|").
- Contact: use a single GitHub link/icon (placeholder: https://github.com/) unless an explicit profile URL is provided.

## Files to inspect first in a Copilot session
- index.html (single-page entry point)
- Any static assets (images, fonts) in logical subfolders
- New manifests/workflows if added later (package.json, .github/workflows/*)

## Assistant workflow suggestions
- Open index.html first and inspect the hero, about, and projects sections.
- For edits: prefer small, surgical changes to index.html; keep lines short and phrasing concise.
- If adding UX motion, keep it minimal and recorded here so future sessions preserve the intent.
