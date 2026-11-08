/**
 * pnpm levels [mapId|file.yaml ...] [--out dir] [--moods dir] [--png]
 * Draws a level sheet (SVG, with --png also PNG) per map and the level atlas (one HTML page, phone-friendly) with all sheets and
 * a slot for the mood picture of each level (concept/27-ueberarbeitung/level-werkzeug.md).
 * Without arguments: all maps of content/ in campaign order, then the drafts in concept/27-ueberarbeitung/levels/*.yaml.
 * Drafts are checked against the map schema of the game; a draft that fails stops the run with the issues.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { parse } from 'yaml';
import { loadContentFromDisk } from '../../src/content/node';
import { mapSchema } from '../../src/content/schemaMap';
import { renderSheet, type LevelMap, type Sheet, type SheetContext } from './sheet';

const args = process.argv.slice(2);
const opt = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1]! : def;
};
const root = process.cwd();
const draftDir = join(root, 'concept', '27-ueberarbeitung', 'levels');
const outDir = join(root, opt('out', join('concept', '27-ueberarbeitung', 'levels', 'out')));
const moodDir = join(root, opt('moods', join('concept', '27-ueberarbeitung', 'levels', 'stimmung')));
const valueArgs = new Set(['--out', '--moods']);
const targets = args.filter((a, i) => !a.startsWith('--') && !valueArgs.has(args[i - 1] ?? ''));

const { data, locales, issues } = loadContentFromDisk(root);
if (issues.length) console.warn(`! content has ${issues.length} issues (pnpm content:check), sheets are drawn anyway`);
const de = locales.de ?? {};
const ctx: SheetContext = {
  text: (key) => (key ? de[key] : undefined),
  className: (id) => de[`class.${id}.name`] ?? id,
  lieutenantClass: (id) => data.lieutenants[id]?.class,
};

interface Entry {
  map: LevelMap;
  title: string;
  source: string;
}

function readDraft(file: string): Entry {
  const parsed = mapSchema.safeParse(parse(readFileSync(file, 'utf8')));
  if (!parsed.success) {
    console.error(`✗ ${file}`);
    for (const i of parsed.error.issues) console.error(`  ${i.path.join('.')}: ${i.message}`);
    process.exit(1);
  }
  const map = parsed.data;
  const unknown = [...new Set(Object.values(map.legend))].filter((t) => !data.terrain[t]);
  const classes = [...map.units, ...map.reinforcements.flatMap((r) => r.units)].map((u) => u.class).filter((c): c is string => !!c && !data.classes[c]);
  if (unknown.length) console.warn(`! ${basename(file)}: unknown terrain ${unknown.join(', ')}`);
  if (classes.length) console.warn(`! ${basename(file)}: unknown class ${[...new Set(classes)].join(', ')}`);
  return { map, title: 'Entwurf', source: file.slice(root.length + 1).split('\\').join('/') };
}

const contentEntry = (id: string): Entry | undefined => {
  const map = data.maps[id] as unknown as LevelMap | undefined;
  if (!map) return undefined;
  const node = data.acts[1]!.nodes.find((n) => n.map === id);
  return { map, title: (node && de[node.titleKey]) ?? (node ? node.id : 'Nebenquest / ohne Knoten'), source: `content/acts/act${data.maps[id]!.act}/maps/${id}.yaml` };
};

let entries: Entry[];
if (targets.length) {
  entries = targets.map((t) => {
    if (extname(t) === '.yaml' || extname(t) === '.yml') return readDraft(join(root, t));
    const e = contentEntry(t);
    if (!e) throw new Error(`no map ${t} (content id or path to a .yaml)`);
    return e;
  });
} else {
  const ordered = [...data.acts[1]!.nodes.map((n) => n.map).filter((m): m is string => !!m), ...Object.keys(data.maps).sort()];
  entries = [...new Set(ordered)].map(contentEntry).filter((e): e is Entry => !!e);
  if (existsSync(draftDir)) for (const f of readdirSync(draftDir).filter((f) => /\.ya?ml$/.test(f)).sort()) entries.push(readDraft(join(draftDir, f)));
}

mkdirSync(outDir, { recursive: true });
const sheets: { entry: Entry; sheet: Sheet; mood?: string }[] = [];
for (const entry of entries) {
  const sheet = renderSheet(entry.map, { ...ctx, title: entry.title });
  writeFileSync(join(outDir, `${entry.map.id}.svg`), sheet.svg);
  const moodFile = ['.png', '.jpg', '.jpeg', '.webp'].map((x) => join(moodDir, entry.map.id + x)).find(existsSync);
  const mood = moodFile ? `data:image/${extname(moodFile).slice(1).replace('jpg', 'jpeg')};base64,${readFileSync(moodFile).toString('base64')}` : undefined;
  sheets.push({ entry, sheet, ...(mood ? { mood } : {}) });
}
writeFileSync(join(outDir, 'atlas.html'), atlasHtml(sheets));
if (args.includes('--png')) await writePngs(sheets.map((s) => ({ id: s.entry.map.id, sheet: s.sheet })));
console.log(`✓ ${sheets.length} Level-Blätter und atlas.html in ${outDir.slice(root.length + 1)}`);

async function writePngs(list: { id: string; sheet: Sheet }[]) {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  for (const { id, sheet } of list) {
    await page.setViewportSize({ width: sheet.width, height: sheet.height });
    await page.setContent(`<body style="margin:0">${sheet.svg}</body>`);
    await page.locator('svg').screenshot({ path: join(outDir, `${id}.png`) });
  }
  await browser.close();
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function atlasHtml(list: typeof sheets): string {
  const toc = list
    .map(
      ({ entry, sheet }) =>
        `<a class="card" href="#${entry.map.id}"><span class="eyebrow">${esc(entry.title)}</span><strong>${esc(sheet.summary.name)}</strong><span class="facts"><span>${sheet.summary.size}</span><span class="pill pill-${sheet.summary.sizeClass}">${sheet.summary.sizeClass}</span><span>${sheet.summary.deploy} eigene</span><span>N ${esc(sheet.summary.ratio)}</span></span></a>`,
    )
    .join('');
  const levels = list
    .map(({ entry, sheet, mood }) => {
      const id = entry.map.id;
      const moodBlock = mood
        ? `<img src="${mood}" alt="Stimmungsbild ${esc(sheet.summary.name)}">`
        : `<div class="mood-empty"><p><strong>Stimmungsbild offen.</strong> Blatt als PNG (<code>pnpm levels ${id} --png</code>) mit dieser Vorlage an ChatGPT geben, Ergebnis als <code>levels/stimmung/${id}.png</code> ablegen.</p></div>`;
      return `<section class="level" id="${id}">
  <header><span class="eyebrow">${esc(entry.title)}</span><h2>${esc(sheet.summary.name)}</h2><p class="meta">${esc(sheet.summary.victory)} · <code>${esc(entry.source)}</code></p></header>
  <div class="pair">
    <figure class="sheet"><div class="scroll">${sheet.svg}</div><figcaption>Level-Blatt, verbindlich</figcaption></figure>
    <figure class="mood">${moodBlock}<figcaption>Stimmungsbild, nur Atmosphäre</figcaption></figure>
  </div>
  <details><summary>ChatGPT-Vorlage für das Stimmungsbild</summary><pre id="prompt-${id}">${esc(sheet.moodPrompt)}</pre><button type="button" data-copy="prompt-${id}">Vorlage kopieren</button></details>
</section>`;
    })
    .join('\n');
  return `<title>Hollow Crown Level-Atlas</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Fraunces:opsz,wght@9..144,700&display=swap">
<style>
/* layout: a table of contents of level cards, then per level the binding sheet beside its mood picture (stacked on phones) */
:root { --bg: #fff8ec; --panel: #f4e9d6; --ink: #3b2a20; --soft: #7a6553; --ember: #b44c18; --line: rgba(59,42,32,.18);
  --display: Fraunces, Georgia, serif; --body: Barlow, "Segoe UI", system-ui, sans-serif; --mono: ui-monospace, Consolas, monospace; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #1f1915; --panel: #2c241e; --ink: #f4e9d6; --soft: #c2ad97; --ember: #f0925f; --line: rgba(244,233,214,.18); color-scheme: dark } }
:root[data-theme="dark"] { --bg: #1f1915; --panel: #2c241e; --ink: #f4e9d6; --soft: #c2ad97; --ember: #f0925f; --line: rgba(244,233,214,.18); color-scheme: dark }
body { background: var(--bg); color: var(--ink); font-family: var(--body); font-size: 15px; line-height: 1.5;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 24px 48px; }
main { max-width: 1240px; margin: 0 auto; display: grid; gap: 40px; }
h1, h2 { font-family: var(--display); text-wrap: balance; margin: 0; line-height: 1.1; }
h1 { font-size: clamp(28px, 6vw, 44px); }
h2 { font-size: 26px; }
.intro p { max-width: 65ch; margin: 8px 0 0; color: var(--soft); }
.eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--soft); }
.toc { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.card { display: grid; gap: 2px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px; color: inherit; text-decoration: none; background: var(--panel); }
.card:hover, .card:focus-visible { border-color: var(--ember); outline: none; }
.card strong { font-family: var(--display); font-size: 17px; }
.facts { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 13px; color: var(--soft); font-variant-numeric: tabular-nums; }
.pill { padding: 0 8px; border-radius: 99px; border: 1px solid currentColor; font-weight: 600; }
.pill-mittel { color: var(--ember); }
.pill-groß { color: var(--ember); background: color-mix(in srgb, var(--ember) 14%, transparent); }
.level { display: grid; gap: 12px; padding-top: 24px; border-top: 1px solid var(--line); scroll-margin-top: 16px; }
.meta { margin: 4px 0 0; color: var(--soft); font-size: 14px; }
code { font-family: var(--mono); font-size: .9em; overflow-wrap: anywhere; }
.pair { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 16px; align-items: start; }
@media (max-width: 820px) { .pair { grid-template-columns: minmax(0, 1fr); } }
figure { margin: 0; display: grid; gap: 6px; min-width: 0; }
figcaption { font-size: 12px; color: var(--soft); }
.scroll { overflow-x: auto; border-radius: 8px; border: 1px solid var(--line); }
.scroll svg { display: block; width: 100%; height: auto; min-width: min(100%, 520px); }
.mood img { width: 100%; border-radius: 8px; display: block; }
.mood-empty { aspect-ratio: 2 / 3; max-width: 100%; border: 2px dashed var(--line); border-radius: 8px; display: grid; place-items: center; padding: 20px; text-align: center; color: var(--soft); }
.mood-empty p { margin: 0; max-width: 30ch; }
details { background: var(--panel); border-radius: 8px; padding: 10px 14px; }
summary { cursor: pointer; font-weight: 600; }
pre { white-space: pre-wrap; font-family: var(--mono); font-size: 13px; margin: 10px 0; max-width: 90ch; }
button { font: inherit; font-weight: 600; padding: 6px 14px; border-radius: 6px; border: 1px solid var(--ember); background: transparent; color: var(--ember); cursor: pointer; }
button:focus-visible, summary:focus-visible { outline: 2px solid var(--ember); outline-offset: 2px; }
</style>
<main>
  <header class="intro">
    <span class="eyebrow">Konzept-Überarbeitung · Etappe 5</span>
    <h1>Level-Atlas</h1>
    <p>Ein Blatt je Level, gezeichnet aus dem Karten-YAML im Spielformat. Verbindlich ist das Raster; das Stimmungsbild daneben zeigt nur die Atmosphäre. Norden ist oben, Koordinaten stehen am Rand (x oben, y links), jede fünfte Rasterlinie ist kräftiger. ${list.length} Level, Stand ${new Date().toISOString().slice(0, 10)}.</p>
  </header>
  <nav class="toc" aria-label="Level">${toc}</nav>
  ${levels}
</main>
<script>
document.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-copy]');
  if (!b) return;
  const pre = document.getElementById(b.dataset.copy);
  const done = () => { b.textContent = 'Kopiert'; setTimeout(() => (b.textContent = 'Vorlage kopieren'), 1500); };
  const select = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Markiert, bitte kopieren'; };
  try { navigator.clipboard.writeText(pre.textContent).then(done, select); } catch { select(); }
});
</script>
`;
}
