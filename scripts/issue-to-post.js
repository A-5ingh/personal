#!/usr/bin/env node
// Convert GitHub issues with label "blog" to HTML blog posts
// Usage: GITHUB_TOKEN=ghp_xxx node scripts/issue-to-post.js

const fs = require('fs');
const path = require('path');

const BLOGS_DIR = path.join(__dirname, '..', 'blogs');
const TEMPLATE_PATH = path.join(BLOGS_DIR, 'template.html');
const SITE_URL = 'https://singhamarbir.com';
const REPO = 'a-5ingh/personal';
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.warn('GITHUB_TOKEN not set — skipping issue-to-post generation.');
  process.exit(0);
}

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'User-Agent': 'singhamarbir.com-issue-to-post'
};

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

function parseFrontmatter(body) {
  const m = body.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { frontmatter: {}, content: body.trim() };
  const fm = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  return { frontmatter: fm, content: m[2].trim() };
}

async function fetchIssues() {
  // If triggered by a specific issue event, process only that one
  if (process.env.ISSUE_NUMBER) {
    const url = `https://api.github.com/repos/${REPO}/issues/${process.env.ISSUE_NUMBER}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Failed to fetch issue #${process.env.ISSUE_NUMBER}: ${res.status}`);
    const issue = await res.json();
    if (issue.labels && issue.labels.some(l => l.name === 'blog')) {
      return [issue];
    }
    console.log(`Issue #${issue.number} does not have 'blog' label, skipping.`);
    return [];
  }

  // Full scan: all open issues with blog label (paginated)
  const allIssues = [];
  for (let page = 1; ; page++) {
    const url = `https://api.github.com/repos/${REPO}/issues?labels=blog&state=open&per_page=100&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to fetch issues (page ${page}): ${res.status} ${txt.slice(0, 200)}`);
    }
    const issues = await res.json();
    if (!issues.length) break;
    allIssues.push(...issues);
    if (issues.length < 100) break;
  }
  return allIssues;
}

async function ensurePublishedLabel() {
  const url = `https://api.github.com/repos/${REPO}/labels`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'published',
      color: '2ea043',
      description: 'Blog post has been published as HTML'
    })
  });
  if (!res.ok && res.status !== 422) {
    const txt = await res.text();
    console.warn('Warning: could not create published label:', txt.slice(0, 200));
  }
}

async function addLabel(issueNumber) {
  const url = `https://api.github.com/repos/${REPO}/issues/${issueNumber}`;
  const res = await fetch(url, {
    method: 'GET',
    headers
  });
  if (!res.ok) return;
  const issue = await res.json();
  const currentLabels = (issue.labels || []).map(l => l.name);
  if (currentLabels.includes('published')) return;

  await fetch(url, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ labels: [...currentLabels, 'published'] })
  });
}

async function processIssue(issue, template) {
  const hasPublishedLabel = (issue.labels || []).some(l => l.name === 'published');
  const slug = slugify(issue.title);
  const date = (issue.created_at || '').slice(0, 10);
  if (!date || !slug) {
    console.warn(`  Skipping issue #${issue.number}: missing date or slug`);
    return;
  }

  const filename = `${date}-${slug}.html`;
  const filePath = path.join(BLOGS_DIR, filename);
  const publicUrl = `/blogs/${filename}`;

  // Skip if file already reflects the latest issue content
  const issueUpdated = new Date(issue.updated_at).getTime();
  try {
    const stat = fs.statSync(filePath);
    if (stat.mtimeMs >= issueUpdated) {
      console.log(`  Skipping issue #${issue.number} (up to date)`);
      return;
    }
  } catch (e) {
    // File doesn't exist — will be created
  }

  const { frontmatter, content } = parseFrontmatter(issue.body || '');
  const excerpt = frontmatter.excerpt || '';
  const tags = frontmatter.tags || '';

  // Convert Markdown to HTML
  const { marked } = await import('marked');
  const bodyHtml = await marked.parse(content);

  const postUrl = `${SITE_URL}${publicUrl}`;

  // Fill template (replaceAll for placeholders that appear multiple times)
  let html = template;
  html = html.replaceAll('{{TITLE}}', issue.title);
  html = html.replaceAll('{{URL}}', postUrl);
  html = html.replaceAll('{{DATE}}', date);
  html = html.replaceAll('{{EXCERPT}}', excerpt);
  html = html.replaceAll('{{TAGS}}', tags);
  html = html.replaceAll('{{ISSUE}}', String(issue.number));
  html = html.replaceAll('{{CONTENT}}', bodyHtml);

  // Write file
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  Wrote ${filename}`);

  // Add published label if first time
  if (!hasPublishedLabel) {
    await addLabel(issue.number);
    console.log(`  Added published label to issue #${issue.number}`);
  }
}

async function main() {
  console.log('Fetching blog issues...');
  let issues;
  try {
    issues = await fetchIssues();
  } catch (e) {
    console.error('Error fetching issues:', e.message);
    process.exit(1);
  }

  if (!issues.length) {
    console.log('No blog issues found.');
    return;
  }

  console.log(`Found ${issues.length} issue(s) with blog label.`);

  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  await ensurePublishedLabel();

  for (const issue of issues) {
    console.log(`Processing issue #${issue.number}: ${issue.title}`);
    try {
      await processIssue(issue, template);
    } catch (e) {
      console.error(`  Error processing issue #${issue.number}:`, e.message);
    }
  }

  console.log('Done.');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
