import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const css = readFileSync('src/widget.css', 'utf-8');
const js = readFileSync('src/widget.js', 'utf-8');

const bundle = js.replace('__CSS_PLACEHOLDER__', JSON.stringify(css));

mkdirSync('public', { recursive: true });
writeFileSync('public/widget.bundle.js', bundle);

const sizeKB = (bundle.length / 1024).toFixed(1);
console.log(`✓ public/widget.bundle.js — ${sizeKB} KB`);
