// Builds the public page for Cloudflare Pages: dist/public/index.html. Run `npm run build` first (or `npm run
// build:public`, which does both).
//
// It is dist/index.html with the claude.ai preview's own code left out (the parts between /* preview-only */ and
// /* end preview-only */), the script minified with esbuild (no comments survive) and the CSS stripped of comments
// and whitespace only, so colour values stay exactly as written. The build stops if the result names a person, a
// tool, another site or a private file.

import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ESBUILD = 'esbuild@0.25.10';

const html = readFileSync(resolve(root, 'dist/index.html'), 'utf8');

// The one <style> and the one <script> the page has (the bundle escapes "</script" inside it).
function only(open, close) {
  const a = html.indexOf(open);
  const b = html.indexOf(close, a);
  if (a < 0 || b < 0 || html.indexOf(open, a + 1) >= 0 || html.indexOf(close, b + 1) >= 0) throw new Error(`expected one ${open}…${close}`);
  return [a + open.length, b];
}
const [cssStart, cssEnd] = only('<style>', '</style>');
const [jsStart, jsEnd] = only('<script>', '</script>');
if (!(cssEnd < jsStart)) throw new Error('expected the <style> before the <script>');

// Script: drop the preview-only parts, then minify.
const START = '/* preview-only */';
const END = '/* end preview-only */';
let js = html.slice(jsStart, jsEnd);
const starts = js.split(START).length - 1;
const ends = js.split(END).length - 1;
if (!starts || starts !== ends) throw new Error(`preview-only markers don't pair up (${starts} starts, ${ends} ends)`);
js = js.replace(/\/\* preview-only \*\/[\s\S]*?\/\* end preview-only \*\//g, '');
if (js.includes(START) || js.includes(END)) throw new Error('a preview-only marker is left over');

const tmp = mkdtempSync(join(tmpdir(), 'gacha-public-'));
try {
  writeFileSync(join(tmp, 'in.js'), js);
  execFileSync('npx', ['-y', ESBUILD, join(tmp, 'in.js'), '--minify', '--legal-comments=none', '--log-level=warning', `--outfile=${join(tmp, 'out.js')}`], { stdio: 'inherit' });
  js = readFileSync(join(tmp, 'out.js'), 'utf8').trim().replace(/<\/script/gi, '<\\/script');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// Styles: comments and whitespace out, nothing rewritten.
const css = html
  .slice(cssStart, cssEnd)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();

const out = `${html.slice(0, cssStart)}${css}${html.slice(cssEnd, jsStart)}${js}${html.slice(jsEnd)}`;

// Nothing in the page may point to a person, a tool, another site or a private file. Names that must never appear
// live outside this repo, one regular expression per line, in ~/.config/gacha-lab/forbidden.txt; the build stops
// without that file.
const FORBIDDEN = [/claude/i, /anthropic/i, /ex-aaa/i, /economy designer/i, /\/Users\//, /docs\/(research|review)/, /scratchpad/i, /localhost/i, /127\.0\.0\.1/, /\bher (call|ask|pick|words)\b/i, /preview-only/, /downloads capability/i];
const NAMES = join(homedir(), '.config/gacha-lab/forbidden.txt');
if (!existsSync(NAMES)) throw new Error(`missing ${NAMES}: the names the page must never contain`);
const names = readFileSync(NAMES, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
if (!names.length) throw new Error(`${NAMES} lists no names`);
FORBIDDEN.push(...names.map((l) => new RegExp(l, 'i')));
const found = FORBIDDEN.filter((re) => re.test(out));
if (found.length) throw new Error(`the public page still contains ${found.join(', ')}`);
if (css.includes('/*')) throw new Error('a CSS comment is left over');

mkdirSync(resolve(root, 'dist/public'), { recursive: true });
writeFileSync(resolve(root, 'dist/public/index.html'), out);
console.log(`public page: dist/public/index.html, ${(out.length / 1024).toFixed(1)} KB (was ${(html.length / 1024).toFixed(1)} KB), ${starts} preview-only parts left out`);
