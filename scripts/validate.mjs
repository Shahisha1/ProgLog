import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const jsFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) jsFiles.push(full);
  }
}
walk(root);

let failed = false;
for (const file of jsFiles) {
  // Syntax validation without executing browser-specific code.
  const src = fs.readFileSync(file, 'utf8');
  try {
    // eslint-disable-next-line no-new-func
    new Function(src);
  } catch (error) {
    failed = true;
    console.error(`JS syntax error: ${path.relative(root, file)}\n${error.message}`);
  }
}

const htmlFiles = [];
function collectHtml(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    if (entry.isDirectory()) collectHtml(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
collectHtml(root);

for (const file of htmlFiles) {
  const src = fs.readFileSync(file, 'utf8');
  const ids = [...src.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) {
      failed = true;
      console.error(`Duplicate id: ${path.relative(root, file)} -> ${id}`);
    }
    seen.add(id);
  }
  const references = [...src.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m => m[1]);
  for (const ref of references) {
    if (/^(https?:|data:|#|mailto:|tel:|javascript:)/i.test(ref)) continue;
    const clean = ref.split('#')[0].split('?')[0];
    if (!clean) continue;
    const resolved = path.resolve(path.dirname(file), clean);
    if (!fs.existsSync(resolved)) {
      failed = true;
      console.error(`Missing local asset: ${path.relative(root, file)} -> ${clean}`);
    }
  }
}

if (failed) process.exit(1);
console.log(`Validated ${jsFiles.length} JS files and ${htmlFiles.length} HTML files.`);
