/**
 * Model budget of the board figures (art-direction §4.6): triangles, base-colour texture and transfer size per unit
 * model. The limits come from `figureBudget` in content/packs.yaml; units listed in `large` (mounts, dragons) get
 * `largeFactor` times as much. Reports outliers as a warning table, never fails (the build calls it from
 * check-bundle-size.mjs, tools/art/tripo_units.py after packing a figure).
 *
 *   node tools/figure-budget.mjs [<dir or .glb> ...]        default: every dist/assets/<pack>/models/units
 *
 * A figure's transfer is its model plus the baked animation file beside it (`<id>.vat`, story 7.8, tools/art/bake_vat.py), which is
 * a gzip stream already and counts as it is.
 *
 * Everything is read from the glTF JSON chunk: accessor counts are there even with meshopt compression, and gltfpack
 * leaves the images (PNG/JPEG/WebP in a bufferView) untouched, so their headers give the texture size.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** `figureBudget` of content/packs.yaml */
export function readFigureBudget(rootDir = root) {
  const b = parse(readFileSync(join(rootDir, 'content', 'packs.yaml'), 'utf8')).figureBudget;
  if (!b) throw new Error('content/packs.yaml has no figureBudget');
  return b;
}

/** The glTF JSON and the binary chunk of a .glb */
export function readGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a glb');
  let json;
  let bin;
  for (let o = 12; o + 8 <= buf.length; ) {
    const len = buf.readUInt32LE(o);
    const type = buf.readUInt32LE(o + 4);
    const data = buf.subarray(o + 8, o + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(data.toString('utf8'));
    else if (type === 0x004e4942) bin = data;
    o += 8 + len;
  }
  return { json, bin };
}

/** Width and height from the header of a PNG, JPEG or WebP; null for anything else (e.g. KTX2) */
export function imageSize(b) {
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    for (let o = 2; o + 9 < b.length; ) {
      if (b[o] !== 0xff) return null;
      const m = b[o + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [b.readUInt16BE(o + 7), b.readUInt16BE(o + 5)];
      o += 2 + b.readUInt16BE(o + 2);
    }
    return null;
  }
  if (b.length > 30 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
    const k = b.toString('latin1', 12, 16);
    if (k === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (k === 'VP8L') {
      const v = b.readUInt32LE(21);
      return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1];
    }
    if (k === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  }
  return null;
}

/** Triangles of the rendered meshes (a mesh counts once per node that uses it), largest base-colour texture [w, h] or null */
export function measureGlb(buf) {
  const { json, bin } = readGlb(buf);
  const trisOf = (mesh) =>
    mesh.primitives.reduce((n, p) => {
      if ((p.mode ?? 4) !== 4) return n;
      return n + (p.indices !== undefined ? json.accessors[p.indices].count : json.accessors[p.attributes.POSITION].count) / 3;
    }, 0);
  const uses = (json.nodes ?? []).filter((n) => n.mesh !== undefined).map((n) => n.mesh);
  const triangles = (uses.length ? uses : (json.meshes ?? []).map((_, i) => i)).reduce((n, i) => n + trisOf(json.meshes[i]), 0);
  let texture = null;
  for (const m of json.materials ?? []) {
    const t = m.pbrMetallicRoughness?.baseColorTexture;
    const tex = t && json.textures?.[t.index];
    const img = tex && json.images?.[tex.source ?? Object.values(tex.extensions ?? {})[0]?.source];
    const view = img?.bufferView !== undefined && json.bufferViews[img.bufferView];
    if (!view || !bin) continue;
    const size = imageSize(bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength));
    if (size && (!texture || size[0] * size[1] > texture[0] * texture[1])) texture = size;
  }
  return { triangles, texture };
}

/** Measures `files` and returns { rows, outliers }; a row is { id, triangles, texture, bytes (model gzip + .vat), vatBytes, large, why[] } */
export function checkFigures(files, budget = readFigureBudget()) {
  const rows = files.map((f) => {
    const buf = readFileSync(f);
    const id = basename(f, '.glb');
    const large = budget.large.includes(id);
    const k = large ? budget.largeFactor : 1;
    const { triangles, texture } = measureGlb(buf);
    const vat = f.replace(/\.glb$/, '.vat');
    const vatBytes = existsSync(vat) ? statSync(vat).size : 0;
    const bytes = gzipSync(buf).length + vatBytes;
    const why = [];
    if (triangles > budget.triangles * k) why.push(`triangles > ${budget.triangles * k}`);
    if (texture && (texture[0] > budget.texture * k || texture[1] > budget.texture * k)) why.push(`texture > ${budget.texture * k}`);
    if (bytes > budget.transferMb * k * 1024 * 1024) why.push(`transfer > ${budget.transferMb * k} MB`);
    return { id, triangles, texture, bytes, vatBytes, large, why };
  });
  return { rows, outliers: rows.filter((r) => r.why.length) };
}

const fmt = (r) =>
  `${r.id.padEnd(16)} ${String(r.triangles).padStart(6)} tris  ${(r.texture ? `${r.texture[0]}x${r.texture[1]}` : 'n/a').padStart(9)}  ${(r.bytes / 1024 / 1024).toFixed(2).padStart(5)} MB gz${r.large ? '  (large)' : ''}`;

/** Prints the outliers of `files` as warnings; `all` also prints the rows that are within budget */
export function reportFigures(files, { all = false, budget } = {}) {
  const b = budget ?? readFigureBudget();
  const { rows, outliers } = checkFigures(files, b);
  if (all) for (const r of rows.filter((x) => !x.why.length)) console.log(`  ${fmt(r)}`);
  console.log(`figure models: ${rows.length} checked, ${outliers.length} over budget (${b.triangles} tris, ${b.texture}x${b.texture}, ${b.transferMb} MB gz; large x${b.largeFactor}: ${b.large.join(', ') || 'none'})`);
  for (const r of outliers) console.warn(`warning: figure ${fmt(r)}  -> ${r.why.join(', ')}`);
  return outliers;
}

const glbs = (p) => (statSync(p).isDirectory() ? readdirSync(p).filter((f) => f.endsWith('.glb')).sort().map((f) => join(p, f)) : [p]);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  // unit models lie under assets/<pack>/models/units (tools/art/model_packs.py), older builds under assets/models/units
  const assets = join(process.cwd(), 'dist', 'assets');
  const packed = existsSync(assets) ? readdirSync(assets).map((d) => join(assets, d, 'models', 'units')) : [];
  const dirs = args.length ? args : [join(assets, 'models', 'units'), ...packed];
  const files = dirs.filter((d) => existsSync(d)).flatMap(glbs);
  reportFigures(files, { all: true });
}
