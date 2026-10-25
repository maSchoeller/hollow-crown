/** Illustration panels of scenes (`panel`, architecture 5.8): schema, resolution, at most four text boxes, content:check. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import type { Locales } from '../../src/content/load';
import { sceneSchema } from '../../src/content/schemas';
import { validateContent } from '../../src/content/validate';
import { conditionContext, MAX_PANEL_LINES, newCampaign, panelAt, resolveScene, type GameData } from '../../src/core';

let data: GameData;
let locales: Locales;

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});

const ctx = () => conditionContext(data, newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' }));
const line = (id: string, panel?: string) => ({ id, mood: 'neutral', text: `t ${id}`, ...(panel ? { panel } : {}) });

describe('scene panel schema', () => {
  it('accepts an id or none on a text line and refuses anything else', () => {
    expect(sceneSchema.safeParse({ id: 's', lines: [line('l01', 'bg_x'), line('l02', 'none')] }).success).toBe(true);
    expect(sceneSchema.safeParse({ id: 's', lines: [line('l01', 'Not An Id')] }).success).toBe(false);
    const choice = { id: 'c01', panel: 'bg_x', choice: [{ id: 'a', stance: 'warm', text: 'A' }, { id: 'b', stance: 'sober', text: 'B' }] };
    expect(sceneSchema.safeParse({ id: 's', lines: [choice] }).success).toBe(false);
  });
});

describe('panelAt', () => {
  it('follows the latest panel up to the line and ends at none', () => {
    const d = structuredClone(data);
    d.scenes['scn.test.panel'] = { id: 'scn.test.panel', lines: [line('a'), line('b', 'bg_x'), line('c'), line('d', 'bg_y'), line('e', 'none'), line('f')] } as never;
    const lines = resolveScene(d, ctx(), 'scn.test.panel');
    expect(lines.map((_, i) => panelAt(lines, i))).toEqual([undefined, 'bg_x', 'bg_x', 'bg_y', undefined, undefined]);
    expect(panelAt([], 0)).toBeUndefined();
  });

  it('the prologue scenes show their panel on the alarm (the grave scene has none), at most four boxes', () => {
    for (const [id, bg] of [['scn.prologue.intro', 'paktnacht_glutdom']] as const) {
      const lines = resolveScene(data, ctx(), id);
      const shown = lines.map((_, i) => panelAt(lines, i));
      const n = shown.filter((p) => p === bg).length;
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(MAX_PANEL_LINES);
      expect(shown[shown.length - 1]).toBeUndefined();
    }
  });
});

describe('content:check for panels', () => {
  const problems = (d: GameData) => validateContent(d, locales).map((i) => i.message);
  const prepared = () => {
    const d = structuredClone(data);
    const src = d.scenes['scn.prologue.outro']!;
    for (const l of src.lines) delete (l as { panel?: string }).panel;
    return { d, texts: src.lines.filter((l) => 'text' in l) as Array<{ panel?: string }> };
  };
  it('accepts a panel of four text lines and refuses a fifth', () => {
    const { d, texts } = prepared();
    texts[0]!.panel = 'lager_unterwegs';
    texts[MAX_PANEL_LINES]!.panel = 'none';
    expect(problems(d)).toEqual([]);
    delete texts[MAX_PANEL_LINES]!.panel;
    texts[MAX_PANEL_LINES + 1]!.panel = 'none';
    expect(problems(d)).toContainEqual(expect.stringContaining(`lasts longer than ${MAX_PANEL_LINES} text lines`));
  });

  it('counts to the end of the scene when a panel is never closed', () => {
    const { d, texts } = prepared();
    texts[0]!.panel = 'lager_unterwegs';
    expect(texts.length).toBeGreaterThan(MAX_PANEL_LINES);
    expect(problems(d)).toContainEqual(expect.stringContaining('lasts longer'));
  });
});
