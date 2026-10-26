/** Erbstück (story 9.12, items.md §6.2): +Mt while an ally within range 2 is downed, through the shared fight formula. Plus N3 as a node. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  addToRoster,
  applyCommand,
  availableNodes,
  beginBattle,
  conditionContext,
  forecast,
  newCampaign,
  nodeScenes,
  resolveScene,
  type BattleState,
  type CampaignState,
  type GameData,
} from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

/** Tobin (vanguard) with the given lance at (5,5) against a brigand at (5,4); an ally archer 2 tiles away. */
function setup(lance = 'heirloom') {
  const s = arena(data);
  const tobin = place(data, s, 'player', 'vanguard', [5, 5], lance);
  const foe = place(data, s, 'enemy', 'brigand', [5, 4], 'iron_axe');
  const ally = place(data, s, 'player', 'marksman', [5, 7], 'iron_bow');
  return { s, tobin, foe, ally };
}
const dmg = (s: BattleState, a: string, d: string) => forecast(data, s, a, d).attacker.damage;
const counter = (s: BattleState, a: string, d: string) => forecast(data, s, a, d).defender.damage;

describe('Erbstück', () => {
  it('is a legendary lance like the iron lance whose skill adds damage next to a downed ally', () => {
    const h = data.items.heirloom!;
    const base = data.items.iron_lance!;
    expect([h.weaponType, h.mt, h.hit, h.crit, h.rng, h.wt]).toEqual([base.weaponType, base.mt, base.hit, base.crit, base.rng, base.wt]);
    expect([h.rarity, h.price]).toEqual(['legendary', 1000]);
    const sk = data.skills[h.grantsSkill!.skill]!;
    expect(sk.condition).toEqual({ allyDownedWithin: 2 });
    expect(sk.effect).toEqual({ damageBonus: 3 });
  });

  it('adds the bonus to the forecast only while an ally is downed within range 2', () => {
    const { s, tobin, foe, ally } = setup();
    const plain = setup('iron_lance');
    const base = dmg(plain.s, plain.tobin.uid, plain.foe.uid);
    expect(dmg(s, tobin.uid, foe.uid)).toBe(base); // nobody downed: no bonus
    ally.downed = true; // distance 2
    expect(dmg(s, tobin.uid, foe.uid)).toBe(base + 3);
    ally.pos = [5, 8]; // distance 3: too far
    expect(dmg(s, tobin.uid, foe.uid)).toBe(base);
    ally.pos = [6, 6]; // distance 2 (diagonal)
    expect(dmg(s, tobin.uid, foe.uid)).toBe(base + 3);
  });

  it('counts allies only: a downed foe or a fallen ally who left the map gives nothing', () => {
    const { s, tobin, foe, ally } = setup();
    const base = dmg(s, tobin.uid, foe.uid);
    const downedFoe = place(data, s, 'enemy', 'brigand', [4, 5], 'iron_axe');
    downedFoe.downed = true;
    expect(dmg(s, tobin.uid, foe.uid)).toBe(base);
    ally.downed = true;
    ally.gone = 'rescued';
    expect(dmg(s, tobin.uid, foe.uid)).toBe(base);
    ally.gone = undefined;
    expect(dmg(s, tobin.uid, foe.uid)).toBe(base + 3);
  });

  it('also strengthens the counter when Tobin is attacked, and not another unit with an ordinary lance', () => {
    const { s, tobin, foe, ally } = setup();
    ally.downed = true;
    const withLance = counter(s, foe.uid, tobin.uid);
    tobin.equip.mainHand!.def = 'iron_lance';
    const without = counter(s, foe.uid, tobin.uid);
    expect(withLance).toBe(without + 3);
  });

  it('resolves exactly as it previews: the strike event deals the forecast damage', () => {
    const { s, tobin, foe, ally } = setup();
    ally.downed = true;
    const f = forecast(data, s, tobin.uid, foe.uid);
    const r = applyCommand(data, s, { type: 'act', unit: tobin.uid, to: tobin.pos!, action: { kind: 'attack', target: foe.uid } });
    const strikes = r.events.filter((e) => e.t === 'strike' && e.attacker === tobin.uid && e.hit && !('crit' in e && e.crit));
    expect(f.attacker.damage).toBeGreaterThan(0);
    for (const e of strikes) expect(e.t === 'strike' && e.dmg).toBe(f.attacker.damage);
  });
});

describe('Nebenquest N3 als Knoten', () => {
  const fresh = (): CampaignState => {
    const c = newCampaign(data, 5, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    c.completed = ['prologue', 'm1_1'];
    return c;
  };
  /** the real content plus a made-up story node m1_6 (it comes with another session) */
  const withM16 = (): GameData => {
    const d = structuredClone(data);
    d.campaign.nodes.push({ id: 'm1_6', map: 'prologue_paktnacht', titleKey: 'node.prologue.title', kind: 'story', merchantTier: 0, expectedLevel: 6 });
    return d;
  };
  const ids = (d: GameData, c: CampaignState) => availableNodes(d, c).map((n) => n.id);

  it('opens after 1-6 with Tobin in the company or fallen, and not when he left or never was there', () => {
    const d = withM16();
    const c = fresh();
    c.completed.push('m1_6');
    expect(ids(d, c)).toContain('n3'); // Tobin belongs to the starting company
    c.roster = c.roster.filter((u) => u.id !== 'tobin');
    expect(ids(d, c)).not.toContain('n3');
    addToRoster(d, c, 'tobin');
    expect(ids(d, c)).toContain('n3');
    c.roster = c.roster.filter((u) => u.id !== 'tobin');
    c.fallen.push({ id: 'tobin', nameKey: 'unit.tobin.name', node: 'ch01', classId: 'vanguard' });
    expect(ids(d, c)).toContain('n3');
    c.fallen = [];
    c.left.push('tobin');
    expect(ids(d, c)).not.toContain('n3');
  });

  it('needs mission 1-6 and never lapses afterwards', () => {
    const d = withM16();
    const c = fresh();
    addToRoster(d, c, 'tobin');
    expect(ids(d, c)).not.toContain('n3');
    c.completed.push('m1_6', 'n1', 'n2', 'later');
    expect(ids(d, c)).toContain('n3');
    c.completed.push('n3');
    expect(ids(d, c)).not.toContain('n3');
  });

  it('plays the memorial scenes with Brenna as foster mother when Tobin has fallen', () => {
    const c = fresh();
    expect(nodeScenes(data, c, 'n3')).toEqual({ pre: 'scn.n3.intro', post: 'scn.n3.outro' });
    c.fallen.push({ id: 'tobin', nameKey: 'unit.tobin.name', node: 'ch01', classId: 'vanguard' });
    expect(nodeScenes(data, c, 'n3')).toEqual({ pre: 'scn.n3.memorial_intro', post: 'scn.n3.memorial_outro' });
    addToRoster(data, c, 'brenna');
    for (const id of ['scn.n3.memorial_intro', 'scn.n3.memorial_outro', 'scn.n3.home']) {
      const lines = resolveScene(data, conditionContext(data, c), id);
      expect(lines.length).toBeGreaterThan(0);
      for (const l of lines) {
        expect(l.kind === 'line' && l.mood).not.toBe('happy');
        expect(l.kind === 'line' && l.speaker).not.toBe('tobin');
      }
    }
  });

  it('gives the heirloom and no ember spark, in both variants', () => {
    const n = data.campaign.nodes.find((x) => x.id === 'n3')!;
    expect(n.effects).toEqual([{ item: { def: 'heirloom' } }]);
  });

  it('forces Tobin into the deployment, and a fallen Tobin is filtered like any absent forced unit', () => {
    const m = data.maps.n3_erbe!;
    expect(m.deploy.forced).toEqual(['avatar', 'kael', 'tobin']);
    const d = structuredClone(data);
    d.campaign.nodes.push({ id: 'm1_6', map: 'prologue_paktnacht', titleKey: 'node.prologue.title', kind: 'story', merchantTier: 0, expectedLevel: 6 });
    const c = fresh();
    addToRoster(d, c, 'tobin');
    const on = beginBattle(d, c, 'n3', c.roster.map((u) => u.id)).state;
    expect(on.units.some((u) => u.id === 'tobin' && u.team === 'player' && u.pos)).toBe(true);
    c.roster = c.roster.filter((u) => u.id !== 'tobin');
    const off = beginBattle(d, c, 'n3', c.roster.map((u) => u.id)).state;
    expect(off.units.some((u) => u.id === 'tobin')).toBe(false);
  });
});
