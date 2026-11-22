import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';

/** The JSON chunk of a .glb. */
function glbJson(file: string): { nodes: { name?: string }[] } {
  const b = readFileSync(file);
  return JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8'));
}

describe('grip points (story 16.9)', () => {
  const dir = 'art/models/weapons-v2';
  const files = [...readdirSync(dir).filter((f) => f.endsWith('.glb')).map((f) => `${dir}/${f}`), ...readdirSync(`${dir}/sig`).map((f) => `${dir}/sig/${f}`)];

  it('every weapon model carries a grip node', () => {
    expect(files.length).toBeGreaterThan(20);
    for (const f of files) expect(glbJson(f).nodes.some((n) => n.name === 'grip'), f).toBe(true);
  });

  it('every weapon group names its grip kind and none keeps a hold angle', () => {
    const gear = loadContentFromDisk().data.render.gear;
    for (const p of [...Object.values(gear.weapons), ...Object.values(gear.offHand)]) {
      expect(['fist', 'flat', 'bow', 'lute']).toContain(p.grip);
      expect('hold' in p).toBe(false);
    }
  });
});
