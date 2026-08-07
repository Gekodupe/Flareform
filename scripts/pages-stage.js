#!/usr/bin/env node
/**
 * Stage static assets for Cloudflare Pages (excludes worker/, node_modules, secrets).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, '.pages-dist');

const INCLUDE_DIRS = ['css', 'js', 'public', 'docs'];
const INCLUDE_FILES = [
  'index.html',
  '404.html',
  'robots.txt',
  'sitemap.xml',
  'site.webmanifest',
  '_headers',
  '_redirects',
  'LICENSE',
  'README.md',
  'site.config.json'
];

function rmrf(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (name === 'node_modules' || name === '.git' || name === '.wrangler') continue;
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const st = fs.statSync(from);
    if (st.isDirectory()) copyDir(from, to);
    else copyFile(from, to);
  }
}

rmrf(OUT);
fs.mkdirSync(OUT, { recursive: true });

INCLUDE_DIRS.forEach(function (dir) {
  copyDir(path.join(ROOT, dir), path.join(OUT, dir));
});

INCLUDE_FILES.forEach(function (file) {
  const src = path.join(ROOT, file);
  if (fs.existsSync(src)) copyFile(src, path.join(OUT, file));
});

process.stdout.write('pages-stage: ' + OUT + '\n');
