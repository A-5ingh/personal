#!/usr/bin/env node
// Generate blogs/index.json and sitemap.xml from posts in blogs/
// Usage: node scripts/gen-blog-index.js

const fs = require('fs');
const path = require('path');

const BLOGS_DIR = path.join(__dirname, '..', 'blogs');
const SITE_URL = 'https://singhamarbir.com';

function extractMeta(content, name) {
  const m = content.match(new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, 'i'));
  return m ? m[1].trim() : '';
}

function extractTitle(content) {
  const m = content.match(/<title>([^<]*)<\/title>/i);
  if (!m) return '';
  return m[1].replace(/\s*[—–-]\s*Amarbir Singh\s*$/i, '').trim();
}

function extractFirstParagraph(content) {
  const m = content.match(/<article[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!m) return '';
  return m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);
}

function parseDateFromFilename(filename) {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

function slugFromFilename(filename) {
  return filename.replace(/\.html$/i, '');
}

function parseTags(raw) {
  return raw.split(',').map(t => t.trim()).filter(Boolean);
}

const files = fs.readdirSync(BLOGS_DIR)
  .filter(f => f.endsWith('.html'))
  .filter(f => f !== 'index.html' && f !== 'template.html')
  .sort();

const posts = files.map(f => {
  const content = fs.readFileSync(path.join(BLOGS_DIR, f), 'utf8');
  const slug = slugFromFilename(f);
  const date = extractMeta(content, 'date') || parseDateFromFilename(f);
  const title = extractTitle(content) || slug;
  let excerpt = extractMeta(content, 'excerpt');
  if (!excerpt) excerpt = extractFirstParagraph(content);
  const tags = parseTags(extractMeta(content, 'tags'));

  return { slug, title, date, excerpt, tags, url: `/blogs/${f}` };
});

posts.sort((a, b) => {
  if (a.date !== b.date) return b.date.localeCompare(a.date);
  return b.slug.localeCompare(a.slug);
});

// Write blogs/index.json
const index = {
  generated: new Date().toISOString(),
  posts
};
fs.writeFileSync(path.join(BLOGS_DIR, 'index.json'), JSON.stringify(index, null, 2));

// Write sitemap.xml
const today = new Date().toISOString().split('T')[0];
let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
sitemap += `  <url>\n    <loc>${SITE_URL}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
sitemap += `  <url>\n    <loc>${SITE_URL}/blogs/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
posts.forEach(p => {
  sitemap += `  <url>\n    <loc>${SITE_URL}${p.url}</loc>\n    <lastmod>${p.date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
});
sitemap += `</urlset>\n`;

fs.writeFileSync(path.join(__dirname, '..', 'sitemap.xml'), sitemap);

console.log(`Generated ${posts.length} blog post(s).`);
console.log('  - blogs/index.json');
console.log('  - sitemap.xml');
