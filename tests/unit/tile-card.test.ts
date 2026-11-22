/** Tile card (story 16.11): effect chips, the cost pill for the chosen figure from `moveCost`, the other move types small, no abbreviations. Function components are expanded by hand (no DOM here). */
import type { ComponentChild, VNode } from 'preact';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { costLabel, moveCost, type BattleState, type GameData, type Pos } from '../../src/core';
import { TileCard } from '../../src/app/screens/TileCard';
import { lang, setLocales, t } from '../../src/i18n';
import { unitName } from '../../src/ui/components';
import { arena, place } from '../fixtures/arena';

vi.mock('../../src/app/screens/HelpStone', () => ({ HelpStone: () => null }));

let data: GameData;
beforeAll(() => {
  const c = loadContentFromDisk();
  data = c.data;
  setLocales(c.locales);
  lang.value = 'de';
});

/** text and class names of a vnode tree, function components called */
function dump(n: ComponentChild): { text: string; classes: string[] } {
  const out = { text: '', classes: [] as string[] };
  const walk = (x: ComponentChild): void => {
    if (x === null || x === undefined || typeof x === 'boolean') return;
    if (typeof x === 'string' || typeof x === 'number') {
      out.text += ` ${String(x)}`;
      return;
    }
    if (Array.isArray(x)) return x.forEach(walk);
    const v = x as VNode<Record<string, unknown>>;
    if (typeof v.type === 'function') return walk((v.type as (p: unknown) => ComponentChild)(v.props));
    const cls = v.props.class;
    if (typeof cls === 'string') out.classes.push(...cls.split(' '));
    walk(v.props.children as ComponentChild);
  };
  walk(n);
  return out;
}

const tile = (s: BattleState, at: Pos, id: string) => (s.terrain[at[1] * s.width + at[0]] = id);

describe('TileCard', () => {
  it('forest: name, chips in full words with a bonus and a malus, the cost for the chosen figure and the other move types', () => {
    const s = arena(data);
    tile(s, [2, 2], 'forest');
    const u = place(data, s, 'player', 'skirmisher', [0, 0], 'iron_sword');
    const d = dump(TileCard({ data, s, p: [2, 2], unit: u }));
    expect(d.text).toContain(t('terrain.forest'));
    expect(d.text).toContain(t('ui.tile.def'));
    expect(d.text).toContain(t('ui.tile.avoid'));
    expect(d.text).toContain(t('ui.tile.flammable'));
    expect(d.classes).toContain('is-good');
    expect(d.classes).toContain('is-bad');
    // the pill carries the cost of moveCost, not a copy
    const cost = moveCost(data, s, u, [2, 2])!;
    expect(d.text).toContain(t('ui.tile.cost', { name: unitName(u), n: costLabel(cost) }));
    expect(d.text).not.toContain('VER');
    expect(d.text).toContain(t('ui.moveType.armored'));
    expect(d.text).not.toContain(t('ui.moveType.monster'));
  });

  it('a closed field says the figure does not get there', () => {
    const s = arena(data);
    tile(s, [2, 2], 'mountain');
    const u = place(data, s, 'player', 'skirmisher', [0, 0], 'iron_sword');
    const d = dump(TileCard({ data, s, p: [2, 2], unit: u }));
    expect(d.classes).toContain('is-blocked');
    expect(d.text).toContain(t('ui.tile.blocked', { name: unitName(u) }));
  });

  it('without a figure there is no cost line; a plain field has no chips', () => {
    const s = arena(data);
    const d = dump(TileCard({ data, s, p: [1, 1] }));
    expect(d.classes).not.toContain('tile-card__move');
    expect(d.classes).not.toContain('is-good');
    expect(d.classes).not.toContain('is-bad');
  });
});
