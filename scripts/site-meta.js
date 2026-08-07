#!/usr/bin/env node
/**
 * Minimal site-meta for Flareform (SEO landings optional).
 * Reads site.config.json and prints a ready check.
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
console.log('Flareform site-meta OK:', cfg.brandName, cfg.siteUrl);
console.log('Theme:', cfg.themeColor);
