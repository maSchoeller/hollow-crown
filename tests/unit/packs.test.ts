import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { checkPackProps, checkPacks, globToRegExp, groupByPack, matchesGlob, packOf, parsePacks, type PackDef } from '../../src/content/packs';
import { contentFiles, loadContentFromDisk } from '../../src/content/node';
import { builtPack, contentByPack } from '../../tools/build/packs-plugin';

const realPacks = parsePacks(parse(readFileSync(join(process.cwd(), 'content', 'packs.yaml'), 'utf8')));

const pack = (id: string, over: Partial<PackDef> = {}): PackDef => ({
  id,
  released: true,
  load: id === 'core' ? 'precache' : 'background',
  act: 1,
  budgetMb: 10,
  content: [],
  assets: [],
  props: [],
  ...over,
});

describe('globToRegExp', () => {
  it('matches ** across folders, also none', () => {
    expect(matchesGlob('core/balance.yaml', 'core/**')).toBe(true);
    expect(matchesGlob('core/locales/de.yaml', 'core/**')).toBe(true);
    expect(matchesGlob('models/units/a.glb', 'models/**/*.glb')).toBe(true);
    expect(matchesGlob('models/a.glb', 'models/**/*.glb')).toBe(true);
    expect(matchesGlob('coreX/a.yaml', 'core/**')).toBe(false);
  });
  it('keeps * and ? within one segment and dots literal', () => {
    expect(matchesGlob('acts/act1/maps/prologue_paktnacht.yaml', 'acts/act1/maps/prologue_*.yaml')).toBe(true);
    expect(matchesGlob('acts/act1/maps/sub/prologue_x.yaml', 'acts/act1/maps/prologue_*.yaml')).toBe(false);
    expect(matchesGlob('audio/camp.mp3', 'audio/camp.*')).toBe(true);
    expect(matchesGlob('audio/campXmp3', 'audio/camp.mp?')).toBe(false);
    expect(matchesGlob('a1.yaml', 'a?.yaml')).toBe(true);
    expect(globToRegExp('a/**')).toBe(globToRegExp('a/**'));
  });
});

describe('packOf', () => {
  const packs = [pack('core', { content: ['core/**', 'acts/act1/maps/prologue_*.yaml'] }), pack('act1', { content: ['acts/act1/**'], assets: ['models/**'] })];
  it('takes the first pack whose globs match', () => {
    expect(packOf(packs, 'acts/act1/maps/prologue_paktnacht.yaml', 'content').id).toBe('core');
    expect(packOf(packs, 'acts/act1/maps/m1_2_erlbach.yaml', 'content').id).toBe('act1');
  });
  it('gives everything unnamed to core', () => {
    expect(packOf(packs, 'avatars/kael.webp', 'assets').id).toBe('core');
    expect(packOf(packs, 'models/units/kael.glb', 'assets').id).toBe('act1');
    expect([...groupByPack(packs, ['a', 'models/x'], 'assets')]).toEqual([
      ['core', ['a']],
      ['act1', ['models/x']],
    ]);
  });
});

describe('parsePacks', () => {
  it('reads content/packs.yaml with core first', () => {
    expect(realPacks.map((p) => p.id)).toEqual(['core', 'act1', 'voice.act1.de', 'voice.act1.en']);
    expect(realPacks.filter((p) => p.released).map((p) => p.id)).toEqual(['core', 'act1']);
  });
  it('rejects a file without core first or with duplicate ids', () => {
    expect(() => parsePacks({ packs: [{ id: 'act1', released: true, load: 'background', act: 1, budgetMb: 1 }] })).toThrow();
    const core = { id: 'core', released: true, load: 'precache', act: 1, budgetMb: 1 };
    expect(() => parsePacks({ packs: [core, core] })).toThrow();
    expect(parsePacks({ packs: [core] })[0]!.content).toEqual([]);
  });
});

describe('prop lists of packs', () => {
  it('parses props (default empty) and the real act1 lists existing files only once', () => {
    expect(pack('x').props).toEqual([]);
    const act1 = realPacks.find((p) => p.id === 'act1')!;
    expect(act1.props.length).toBeGreaterThan(0);
    const files = new Set(readdirSync(join(process.cwd(), 'art', 'models', 'props')).filter((f) => f.endsWith('.glb')).map((f) => f.slice(0, -4)));
    expect(checkPackProps(realPacks, files)).toEqual([]);
  });
  it('reports a missing file and a prop in two packs', () => {
    const packs = [pack('core'), pack('a', { props: ['x_idle', 'gone_idle'] }), pack('b', { props: ['x_idle'] })];
    const msgs = checkPackProps(packs, new Set(['x_idle'])).map((i) => i.message);
    expect(msgs).toHaveLength(2);
    expect(msgs[0]).toContain('gone_idle');
    expect(msgs[1]).toContain('packs a and b');
  });
});

describe('checkPacks', () => {
  const campaign = { nodes: [{ id: 'prologue', map: 'prologue_paktnacht', pre: 'scn.prologue.intro', fixed: 'first' }] };
  it('accepts the real content', () => {
    const { data } = loadContentFromDisk();
    expect(checkPacks(realPacks, contentFiles(), data.campaign)).toEqual([]);
  });
  it('reports files in no pack and a first node outside core', () => {
    const packs = [pack('core', { content: ['core/**'] }), pack('act1', { content: ['acts/act1/**'] }), pack('voice.x', { load: 'voice' })];
    const files = ['core/a.yaml', 'acts/act1/maps/prologue_paktnacht.yaml', 'acts/act1/scenes/scn.prologue.intro.yaml', 'acts/act2/x.yaml'];
    expect(checkPacks(packs, files, campaign).map((i) => i.message)).toEqual([
      'acts/act2/x.yaml is in no pack',
      'map prologue_paktnacht of the first node must be in core',
      'scene scn.prologue.intro of the first node must be in core',
      'voice pack voice.x needs a lang',
    ]);
  });
});

describe('packs plugin helpers', () => {
  it('puts the prologue into core and the rest of act 1 into act1', () => {
    const byPack = contentByPack(process.cwd(), realPacks);
    expect(byPack.get('core')).toContain('acts/act1/maps/prologue_paktnacht.yaml');
    expect(byPack.get('core')).toContain('core/balance.yaml');
    expect(byPack.get('act1')).toContain('acts/act1/maps/m1_2_erlbach.yaml');
    expect(byPack.get('act1')).not.toContain('acts/act1/maps/prologue_paktnacht.yaml');
    expect([...byPack.values()].flat()).not.toContain('packs.yaml');
  });
  it('hashes a pack over its sorted files', () => {
    const a = builtPack(pack('act1'), [
      { path: 'b', hash: '2', size: 5 },
      { path: 'a', hash: '1', size: 3 },
    ]);
    const b = builtPack(pack('act1'), [
      { path: 'a', hash: '1', size: 3 },
      { path: 'b', hash: '2', size: 5 },
    ]);
    expect(a.hash).toBe(b.hash);
    expect(a.bytes).toBe(8);
    expect(a.files.map((f) => f.path)).toEqual(['a', 'b']);
    expect(builtPack(pack('act1'), [{ path: 'a', hash: 'x', size: 3 }]).hash).not.toBe(a.hash);
  });
});
