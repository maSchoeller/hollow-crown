/** Elster (story 9.10, items.md §6.2): with the signature dagger Fenn's Stehlen also takes what the foe holds in hand. Plus N1 as a node: opening, memorial scenes, rewards. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  addToRoster,
  applyCommand,
  availableActions,
  availableNodes,
  classPreview,
  conditionContext,
  newCampaign,
  newItem,
  nodeScenes,
  resolveScene,
  stealableItems,
  stealTargets,
  validate,
  type BattleState,
  type BattleUnit,
  type CampaignState,
  type Command,
  type GameData,
  type Pos,
} from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

const act = (s: BattleState, u: BattleUnit, action: Extract<Command, { type: 'act' }>['action'], to?: Pos) =>
  applyCommand(data, s, { type: 'act', unit: u.uid, to: to ?? u.pos!, action });

/** Fenn (scout) with the Elster next to a brigand who holds an axe and a shield and carries a potion. */
function duel(elster = true) {
  const s = arena(data);
  const fenn = place(data, s, 'player', 'scout', [3, 3], elster ? 'magpie' : 'iron_dagger');
  const foe = place(data, s, 'enemy', 'brigand', [4, 3], 'iron_axe');
  foe.equip.offHand = newItem(s, 'wooden_shield', data);
  foe.bag = [newItem(s, 'vulnerary', data)];
  return { s, fenn, foe };
}

describe('Elster: Stehlen auch von Ausgerüstetem', () => {
  it('is a legendary dagger like the iron dagger with the skill that does it', () => {
    const m = data.items.magpie!;
    const base = data.items.iron_dagger!;
    expect([m.weaponType, m.mt, m.hit, m.crit, m.rng, m.wt]).toEqual([base.weaponType, base.mt, base.hit, base.crit, base.rng, base.wt]);
    expect([m.rarity, m.price]).toEqual(['legendary', 1000]);
    expect(data.skills[m.grantsSkill!.skill]!.effect.stealEquipped).toBe(true);
  });

  it('offers the equipped items after the bag, marked as taken from the hand', () => {
    const { s, fenn, foe } = duel();
    const items = stealableItems(data, foe, fenn);
    expect(items.map((i) => i.def)).toEqual(['vulnerary', 'iron_axe', 'wooden_shield']);
    const prev = classPreview(data, s, fenn, fenn.pos!, { kind: 'steal', target: foe.uid });
    expect(prev).toMatchObject({ kind: 'steal', takesEquipped: true });
    expect(prev && prev.kind === 'steal' && prev.items.map((x) => [x.item.def, x.equipped])).toEqual([
      ['vulnerary', false],
      ['iron_axe', true],
      ['wooden_shield', true],
    ]);
    const opt = availableActions(data, s, fenn, fenn.pos!).find((o) => o.kind === 'steal')!;
    expect(opt.stealable![foe.uid]).toEqual(items.map((i) => i.uid));
  });

  it("takes the weapon out of the foe's hand: it lands in the thief's bag, the foe stands unarmed, no roll", () => {
    const { s, fenn, foe } = duel();
    const axe = foe.equip.mainHand!;
    const r = act(s, fenn, { kind: 'steal', target: foe.uid, item: axe.uid });
    const him = r.state.units.find((u) => u.uid === foe.uid)!;
    const me = r.state.units.find((u) => u.uid === fenn.uid)!;
    expect(him.equip.mainHand).toBeUndefined();
    expect(him.equip.offHand?.def).toBe('wooden_shield');
    expect(me.bag.map((i) => i.uid)).toContain(axe.uid);
    expect(me.acted).toBe(true);
    expect(r.events.find((e) => e.t === 'stolen')).toMatchObject({ unit: fenn.uid, target: foe.uid, item: { def: 'iron_axe' } });
    expect(r.state.rng).toEqual(s.rng);
    const again = classPreview(data, r.state, me, me.pos!, { kind: 'steal', target: foe.uid });
    expect(again && again.kind === 'steal' && again.items.map((x) => x.item.def)).toEqual(['vulnerary', 'wooden_shield']);
  });

  it('puts the stolen item into the convoy when the bag is full, as with any steal', () => {
    const { s, fenn, foe } = duel();
    fenn.bag = [newItem(s, 'vulnerary', data), newItem(s, 'vulnerary', data), newItem(s, 'vulnerary', data)];
    const shield = foe.equip.offHand!;
    const r = act(s, fenn, { kind: 'steal', target: foe.uid, item: shield.uid });
    expect(r.state.convoy.map((i) => i.uid)).toContain(shield.uid);
    expect(r.state.units.find((u) => u.uid === foe.uid)!.equip.offHand).toBeUndefined();
  });

  it('does not forget the drop: a stolen drop item does not drop again when the foe dies', () => {
    const { s, fenn, foe } = duel();
    foe.dropUids = [foe.equip.mainHand!.uid];
    const r = act(s, fenn, { kind: 'steal', target: foe.uid, item: foe.equip.mainHand!.uid });
    expect(r.state.units.find((u) => u.uid === foe.uid)!.dropUids).toEqual([]);
  });

  it('works under the same conditions as the bag steal: next to a living foe, scouts only', () => {
    const { s, fenn, foe } = duel();
    const shield = foe.equip.offHand!.uid;
    const walked = act(s, fenn, { kind: 'steal', target: foe.uid, item: shield }, [4, 4]);
    expect(walked.state.units.find((u) => u.uid === fenn.uid)!.pos).toEqual([4, 4]);
    foe.pos = [6, 3];
    expect(validate(data, s, { type: 'act', unit: fenn.uid, to: fenn.pos!, action: { kind: 'steal', target: foe.uid, item: shield } })).toBe('not_allowed');
    foe.pos = [4, 3];
    foe.downed = true;
    expect(stealTargets(data, s, fenn, fenn.pos!)).toEqual({});
    foe.downed = false;
    const van = place(data, s, 'player', 'vanguard', [4, 4], 'magpie');
    expect(availableActions(data, s, van, [5, 3]).map((o) => o.kind)).not.toContain('steal');
  });

  it('is only for the Elster: a scout with an iron dagger still leaves the equipped gear alone', () => {
    const { s, fenn, foe } = duel(false);
    expect(stealableItems(data, foe, fenn).map((i) => i.def)).toEqual(['vulnerary']);
    expect(validate(data, s, { type: 'act', unit: fenn.uid, to: fenn.pos!, action: { kind: 'steal', target: foe.uid, item: foe.equip.mainHand!.uid } })).toBe('invalid_target');
  });

  it('also works with the skill mastered and in the loadout, and not before', () => {
    const { foe, fenn } = duel(false);
    fenn.mastered = ['long_fingers'];
    expect(stealableItems(data, foe, fenn).map((i) => i.def)).toEqual(['vulnerary']);
    fenn.loadout = ['long_fingers'];
    expect(stealableItems(data, foe, fenn).map((i) => i.def)).toEqual(['vulnerary', 'iron_axe', 'wooden_shield']);
  });

  it('leaves the signature items of lieutenants and convoy-only goods with the foe', () => {
    const { s, fenn, foe } = duel();
    foe.equip.accessory1 = newItem(s, 'iron_ore', data);
    foe.bag = [];
    expect(Object.keys(data.lieutenants).length).toBeGreaterThan(0);
    for (const lt of Object.values(data.lieutenants)) {
      foe.equip.mainHand = newItem(s, lt.signatureItem, data);
      expect(stealableItems(data, foe, fenn).map((i) => i.def)).toEqual(['wooden_shield']);
    }
  });

  it('is deterministic: the same command replays to the same state', () => {
    const { s, fenn, foe } = duel();
    const cmd: Command = { type: 'act', unit: fenn.uid, to: fenn.pos!, action: { kind: 'steal', target: foe.uid, item: foe.equip.mainHand!.uid } };
    expect(applyCommand(data, s, cmd).state).toEqual(applyCommand(data, s, cmd).state);
  });
});

describe('Nebenquest N1 als Knoten', () => {
  const fresh = (): CampaignState => {
    const c = newCampaign(data, 3, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    c.completed = ['prologue', 'm1_1'];
    return c;
  };
  const ids = (c: CampaignState) => availableNodes(data, c).map((n) => n.id);

  it('opens with E2 "schützen" and not otherwise (synthetic state: the flag comes with another session)', () => {
    const c = fresh();
    expect(ids(c)).not.toContain('n1');
    c.flags.e02 = 'deliver';
    expect(ids(c)).not.toContain('n1');
    c.flags.e02 = 'protect';
    expect(ids(c)).toContain('n1');
  });

  it('is a side quest that never lapses: it stays open over further missions until it is played', () => {
    const c = fresh();
    c.flags.e02 = 'protect';
    for (const done of ['ch01', 'ch02', 'n2', 'zzz_later_story']) {
      c.completed.push(done);
      expect(ids(c)).toContain('n1');
    }
    c.completed.push('n1');
    expect(ids(c)).not.toContain('n1');
  });

  it('plays the normal scenes with Fenn in the company and the memorial scenes when he has fallen', () => {
    const c = fresh();
    expect(nodeScenes(data, c, 'n1')).toEqual({ pre: 'scn.n1.intro', post: 'scn.n1.outro' });
    c.fallen.push({ id: 'fenn', nameKey: 'unit.fenn.name', node: 'ch01', classId: 'scout' });
    expect(nodeScenes(data, c, 'n1')).toEqual({ pre: 'scn.n1.memorial_intro', post: 'scn.n1.memorial_outro' });
  });

  it('gives the full reward in both variants: Elster and ember spark as the effects of the node', () => {
    const n = data.campaign.nodes.find((x) => x.id === 'n1')!;
    expect(n.effects).toEqual([{ item: { def: 'magpie' } }, { item: { def: 'ember_spark' } }]);
    expect(n.kind).toBe('side');
  });

  it("lets the scene at the ring master's fall speak for both cases, without humour for the fallen", () => {
    const c = fresh();
    addToRoster(data, c, 'fenn');
    const alive = resolveScene(data, conditionContext(data, c), 'scn.n1.ring').map((l) => l.uid);
    expect(alive).toEqual(['l01', 'l02', 'l03', 'l04']);
    c.roster = c.roster.filter((u) => u.id !== 'fenn');
    c.fallen.push({ id: 'fenn', nameKey: 'unit.fenn.name', node: 'ch01', classId: 'scout' });
    const lines = resolveScene(data, conditionContext(data, c), 'scn.n1.ring');
    expect(lines.map((l) => l.uid)).toEqual(['m01', 'm02']);
    expect(lines.every((l) => l.kind === 'line' && l.mood !== 'happy')).toBe(true);
    for (const id of ['scn.n1.memorial_intro', 'scn.n1.memorial_outro']) {
      for (const l of resolveScene(data, conditionContext(data, c), id)) {
        expect(l.kind === 'line' && l.mood).not.toBe('happy');
        expect(l.kind === 'line' && l.speaker).not.toBe('fenn');
      }
    }
  });
});
