// Bundles the page into one self-contained HTML file. No dependencies: the modules are small and
// use only named imports and exports, so each one becomes a function scope that registers its
// exports, in dependency order.
//
//   dist/gacha-lab.html  page content on its own, for a host that supplies <html>/<head>/<body>
//   dist/index.html     the same page as a full document, ready for any static host
//   dist/app.js         the bundled script on its own, for `node --check`

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMPORT_RE = /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?/g;

const order = [];
const seen = new Set();
function visit(file) {
  if (seen.has(file)) return;
  seen.add(file);
  const code = readFileSync(file, 'utf8');
  for (const m of code.matchAll(IMPORT_RE)) visit(resolve(dirname(file), m[2]));
  order.push(file);
}

function transform(file) {
  const id = relative(root, file);
  let code = readFileSync(file, 'utf8');
  const names = [];
  code = code.replace(IMPORT_RE, (_, spec, from) => {
    const target = relative(root, resolve(dirname(file), from));
    const parts = spec
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const [a, b] = s.split(/\s+as\s+/);
        return b ? `${a.trim()}: ${b.trim()}` : a.trim();
      });
    return `const { ${parts.join(', ')} } = __m[${JSON.stringify(target)}];`;
  });
  code = code.replace(/^export\s+((?:async\s+)?function\s*\*?\s*)(\w+)/gm, (_, kw, name) => {
    names.push(name);
    return `${kw}${name}`;
  });
  code = code.replace(/^export\s+(const|let|var|class)\s+(\w+)/gm, (_, kw, name) => {
    names.push(name);
    return `${kw} ${name}`;
  });
  code = code.replace(/^export\s*\{([^}]*)\};?/gm, (_, list) => {
    names.push(...list.split(',').map((s) => s.trim()).filter(Boolean));
    return '';
  });
  if (/^\s*(export|import)\s/m.test(code)) throw new Error(`${id}: an import or export the bundler does not handle`);
  return `// ${id}\n(() => {\n${code}\n__m[${JSON.stringify(id)}] = { ${names.join(', ')} };\n})();\n`;
}

visit(resolve(root, 'src/ui/app.js'));
const js = `(() => {\n'use strict';\nconst __m = {};\n${order.map(transform).join('\n')}})();\n`.replace(/<\/script/gi, '<\\/script');
const cssText = readFileSync(resolve(root, 'src/ui/styles.css'), 'utf8');
const page = readFileSync(resolve(root, 'src/ui/page.html'), 'utf8');
const { logoSvg } = await import('../src/ui/logo.js');
const favicon = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(logoSvg())}">\n`;
const content = page
  .replace('</title>\n', () => `</title>\n${favicon}`)
  .replace('/*__CSS__*/', () => cssText)
  .replace('/*__JS__*/', () => js);
if (!content.includes(favicon)) throw new Error('page.html must start with its <title> line');

mkdirSync(resolve(root, 'dist'), { recursive: true });
writeFileSync(resolve(root, 'dist/app.js'), js);
writeFileSync(resolve(root, 'dist/gacha-lab.html'), content);

const split = content.indexOf('<div class="app">');
const head = content.slice(0, split);
const body = content.slice(split);
writeFileSync(
  resolve(root, 'dist/index.html'),
  `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="description" content="Test a gacha economy on pretend players before real ones.">\n${head}</head>\n<body>\n${body}</body>\n</html>\n`,
);
console.log(`built ${order.length} modules, ${(content.length / 1024).toFixed(1)} KB`);
