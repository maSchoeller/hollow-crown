/** Role model and weapon groups (story 2.2, GDD Rollenklassen, architecture 5.7). */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { classSchema } from '../../src/content/schemas';
import { validateContent } from '../../src/content/validate';
import {
  applyCommand,
  beginBattle,
  canEquip,
  CoreInvariantError,
  type Command,
  unitFigureId,
  CORE_ROLES,
  equipCandidates,
  groupAllowed,
  newCampaign,
  newItem,
  promotionTargets,
  renameLegacyBattleClasses,
  renameLegacyClasses,
  usableStaves,
  usableWeapons,
  WEAPON_GROUPS,
  type CampaignState,
  type GameData,
  type UnitRecord,
  firstNode,
} from '../../src/core';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

/** A bare unit of `classId` holding nothing, to ask canEquip about single items. */
function unitOf(classId: string): UnitRecord {
  const u = structuredClone(base.roster.find((r) => r.id === 'brenna')!);
  u.classId = classId;
  u.equip = {};
  u.bag = [];
  return u;
}
const fits = (classId: string, item: string, slot: 'mainHand' | 'offHand' = 'mainHand') =>
  canEquip(data, unitOf(classId), newItem(base, item, data), slot);

describe('role model in classes.yaml', () => {
  it('has the seven core roles plus Taktiker and Hauptmann in the role schema', () => {
    expect([...CORE_ROLES]).toEqual(['vanguard', 'skirmisher', 'marksman', 'elementalist', 'healer', 'scout', 'minstrel', 'tactician', 'captain']);
    for (const r of CORE_ROLES) {
      const c = data.classes[r]!;
      expect(c, r).toBeDefined();
      expect(c.role).toBe(r);
      expect(['base', 'unique']).toContain(c.tier);
      expect(c.weaponGroups.length).toBeGreaterThan(0);
      expect(c.classAction, r).toBeDefined();
      expect(c.mov).toBeGreaterThan(0);
      expect(c.proPaths.length).toBeGreaterThan(0);
      expect(c.proPaths.length).toBeLessThanOrEqual(2);
    }
    expect(data.classes.tactician!.tier).toBe('unique');
    expect(data.classes.captain!.tier).toBe('unique');
  });

  it('gives each role the weapon groups and class action of the GDD table', () => {
    const groups = (id: string) => data.classes[id]!.weaponGroups;
    expect(groups('vanguard')).toEqual(expect.arrayContaining(['lance', 'axe', 'shield']));
    expect(groups('skirmisher')).toEqual(['sword', 'dagger']);
    expect(groups('marksman')).toEqual(['bow']);
    expect(groups('elementalist')).toContain('anima');
    expect(groups('healer')).toEqual(['staff', 'light']);
    expect(groups('scout')).toEqual(['dagger', 'light_bow']);
    expect(groups('minstrel')).toEqual(['dagger', 'lute']);
    expect(groups('tactician')).toEqual(['sword', 'anima']);
    expect(groups('captain')).toEqual(['sword', 'lance', 'shield']);
    const action = (id: string) => data.classes[id]!.classAction!;
    expect(action('vanguard')).toEqual({ id: 'hold', kind: 'passive' });
    expect(action('skirmisher')).toEqual({ id: 'pursue', kind: 'passive' });
    expect(action('marksman').id).toBe('aim');
    expect(action('tactician')).toEqual({ id: 'command', kind: 'active', perMap: 1 });
    expect(action('captain')).toEqual({ id: 'rally', kind: 'active', perMap: 1 });
    expect(data.classes.vanguard).toMatchObject({ moveType: 'armored', mov: 4 }); // GDD values (PO 2026-10-24)
    expect(data.classes.skirmisher).toMatchObject({ moveType: 'foot', mov: 6 });
    expect(data.classes.scout!.mov).toBe(6);
  });

  it('derives the stat blocks from the PoC classes (assumption 3): same shape, sane ranges', () => {
    for (const c of Object.values(data.classes)) {
      for (const k of Object.keys(c.base) as Array<keyof typeof c.base>) {
        expect(c.caps[k], `${c.id}.caps.${k}`).toBeGreaterThanOrEqual(c.base[k]);
        expect(c.growth[k]).toBeGreaterThanOrEqual(0);
      }
    }
    // the skirmisher keeps the mercenary's statline, the healer the cleric's
    expect(data.classes.skirmisher!.base).toMatchObject({ hp: 18, skl: 7, spd: 7 });
    expect(data.classes.healer!.base).toMatchObject({ mag: 4, res: 6 });
  });

  it('the schema rejects a class without weapon groups and unknown groups', () => {
    const ok = { ...data.classes.vanguard!, proPaths: ['a', 'b'] };
    expect(classSchema.safeParse(ok).success).toBe(true);
    expect(classSchema.safeParse({ ...ok, weaponGroups: [] }).success).toBe(false);
    expect(classSchema.safeParse({ ...ok, weaponGroups: ['spoon'] }).success).toBe(false);
    expect(classSchema.safeParse({ ...ok, tier: 'advanced' }).success).toBe(false);
    expect(classSchema.safeParse({ ...ok, proPaths: ['a', 'b', 'c'] }).success).toBe(false);
  });

  it('pro classes hang off their role; undefined pro paths are not selectable yet', () => {
    expect(promotionTargets(data, 'vanguard')).toEqual(['bulwark', 'breaker']);
    expect(promotionTargets(data, 'skirmisher')).toEqual(['duelist']);
    expect(promotionTargets(data, 'duelist')).toEqual([]);
    for (const c of Object.values(data.classes).filter((x) => x.tier === 'pro')) {
      expect(data.classes[c.role]!.proPaths).toContain(c.id);
    }
  });

  it('content validation flags a missing core role and a class without action', () => {
    const broken = structuredClone(data);
    delete broken.classes.scout;
    broken.classes.healer!.classAction = undefined;
    const issues = validateContent(broken, { de: {}, en: {} }).map((i) => i.message);
    expect(issues.some((m) => m.includes('missing role scout'))).toBe(true);
    expect(issues.some((m) => m.includes('healer: a playable class needs a classAction'))).toBe(true);
  });
});

describe('weapon groups on items and canEquip', () => {
  it('every weapon, tome, staff and shield has a group; every group is known', () => {
    for (const it of Object.values(data.items)) {
      if (['weapon', 'tome', 'staff', 'shield'].includes(it.kind)) expect(it.group, it.id).toBeDefined();
      if (it.group) expect(WEAPON_GROUPS).toContain(it.group);
    }
  });

  it('canEquip lets a role carry only its own groups', () => {
    expect(fits('skirmisher', 'iron_sword')).toBeNull();
    expect(fits('skirmisher', 'iron_axe')).toBe('weapon_group');
    expect(fits('skirmisher', 'iron_lance')).toBe('weapon_group');
    expect(fits('vanguard', 'iron_lance')).toBeNull();
    expect(fits('vanguard', 'iron_axe')).toBeNull();
    expect(fits('vanguard', 'iron_sword')).toBe('weapon_group');
    expect(fits('vanguard', 'iron_bow')).toBe('weapon_group');
    expect(fits('marksman', 'iron_bow')).toBeNull();
    expect(fits('marksman', 'ember')).toBe('weapon_group');
    expect(fits('elementalist', 'ember')).toBeNull();
    expect(fits('elementalist', 'heal_staff')).toBe('weapon_group');
    expect(fits('healer', 'heal_staff')).toBeNull();
    expect(fits('healer', 'shine')).toBeNull();
    expect(fits('healer', 'ember')).toBe('weapon_group');
    expect(fits('captain', 'iron_lance')).toBeNull();
    expect(fits('captain', 'iron_axe')).toBe('weapon_group');
  });

  it('shields and foci are groups of the off hand', () => {
    expect(fits('vanguard', 'wooden_shield', 'offHand')).toBeNull();
    expect(fits('skirmisher', 'wooden_shield', 'offHand')).toBe('weapon_group');
    expect(fits('captain', 'iron_shield', 'offHand')).toBeNull();
    expect(fits('tactician', 'iron_shield', 'offHand')).toBe('weapon_group');
    expect(fits('elementalist', 'ember_focus', 'offHand')).toBeNull();
    expect(fits('vanguard', 'ember_focus', 'offHand')).toBe('weapon_group');
  });

  it('armor, accessories and consumables carry no group and fit every role', () => {
    const u = unitOf('minstrel');
    expect(canEquip(data, u, newItem(base, 'leather_vest', data), 'body')).toBeNull();
    expect(canEquip(data, u, newItem(base, 'power_ring', data), 'accessory1')).toBeNull();
  });

  it('groupAllowed, usableWeapons and usableStaves follow the groups', () => {
    const brenna = unitOf('vanguard');
    brenna.bag = [newItem(base, 'iron_sword', data), newItem(base, 'iron_axe', data)];
    expect(usableWeapons(data, brenna).map((i) => i.def)).toEqual(['iron_axe']);
    const liora = unitOf('healer');
    liora.bag = [newItem(base, 'heal_staff', data), newItem(base, 'iron_sword', data)];
    expect(usableStaves(data, liora).map((i) => i.def)).toEqual(['heal_staff']);
    expect(groupAllowed(data.classes.vanguard!, data.items.iron_sword!)).toBe(false);
    expect(groupAllowed(data.classes.vanguard!, data.items.leather_vest!)).toBe(true);
  });

  it('the equip list dims what the role may not hold and names the reason', () => {
    const c = structuredClone(base);
    c.convoy.push(newItem(c, 'iron_sword', data), newItem(c, 'hand_axe', data), newItem(c, 'wooden_shield', data));
    const brenna = c.roster.find((u) => u.id === 'brenna')!;
    const main = equipCandidates(data, c, brenna, 'mainHand');
    expect(main.find((x) => x.inst.def === 'iron_sword')!.error).toBe('weapon_group');
    expect(main.find((x) => x.inst.def === 'hand_axe')!.error).toBeNull();
    const varek = { ...structuredClone(brenna), id: 'varek2', classId: 'skirmisher' } as UnitRecord;
    c.roster.push(varek);
    const off = equipCandidates(data, c, varek, 'offHand');
    expect(off.find((x) => x.inst.def === 'wooden_shield')!.error).toBe('weapon_group');
  });
});

describe('PoC figures and maps after the remap', () => {
  const remap: Record<string, string> = {
    avatar: 'tactician', kael: 'captain', brenna: 'vanguard', tobin: 'vanguard', mira: 'marksman', liora: 'healer', varek: 'skirmisher',
  };

  it('maps the PoC figures to their roles', () => {
    for (const [id, cls] of Object.entries(remap)) expect(data.chars[id]!.class, id).toBe(cls);
  });

  it('no content refers to a removed PoC class', () => {
    const removed = ['mercenary', 'soldier', 'fighter', 'archer', 'mage', 'cleric', 'hero', 'halberdier', 'warrior', 'sniper'];
    for (const r of removed) expect(data.classes[r], r).toBeUndefined();
    for (const m of Object.values(data.maps)) for (const u of m.units) expect(data.classes[u.class], `${m.id}:${u.id}`).toBeDefined();
    for (const k of data.balance.economy.tavern.classes) expect(data.classes[k.class]).toBeDefined();
  });

  it('every figure and every map unit carries the weapon it was written with in its hands', () => {
    for (const node of data.campaign.nodes) {
      const s = beginBattle(data, base, node.id, base.roster.map((u) => u.id)).state;
      for (const u of s.units) {
        const planned = u.team === 'player' ? undefined : data.maps[node.map]!.units.find((m) => (m.id ?? m.class) === u.id || m.id === u.id);
        const first = (planned?.items ?? []).map((r) => data.items[r.def]!).find((d) => d.slot === 'mainHand');
        if (first) expect(u.equip.mainHand?.def, `${node.id}:${u.id}`).toBe(first.id);
      }
    }
    for (const ch of Object.values(data.chars)) {
      const cls = data.classes[ch.class]!;
      for (const r of ch.items) expect(groupAllowed(cls, data.items[r.def]!), `${ch.id}:${r.def}`).toBe(true);
    }
  });
});

describe('saves from before the role model', () => {
  it('maps old class ids onto the roles that replaced them', () => {
    const old: CampaignState = {
      ...base,
      roster: base.roster.map((u, i) => (i === 0 ? { ...u, classId: 'mercenary' } : u)),
      tavern: [{ ...base.roster[0]!, id: 'merc1', classId: 'cleric' }],
    };
    const c = renameLegacyClasses(data, old);
    expect(c.roster[0]!.classId).toBe('skirmisher');
    expect(c.roster.slice(1)).toEqual(base.roster.slice(1));
    expect(c.tavern[0]!.classId).toBe('healer');
    // renamed tavern offers still draw the figure of their class (model and sprite files keep the old names)
    expect(unitFigureId({ classId: c.roster[0]!.classId }, data.classes)).toBe('mercenary');
    expect(unitFigureId({ classId: c.tavern[0]!.classId }, data.classes)).toBe('cleric');
  });

  it('a saved battle whose log no longer fits throws an invariant error instead of drifting on', () => {
    const s = beginBattle(data, base, firstNode(data).id, base.roster.map((u) => u.id)).state;
    const unit = s.units.find((u) => u.team === 'player')!;
    const stale: Command = { type: 'move', unit: unit.uid, to: [99, 99] };
    expect(() => applyCommand(data, renameLegacyBattleClasses(data, s), stale)).toThrow(CoreInvariantError);
  });

  it('maps them in a saved battle start too and leaves current ids alone', () => {
    const s = beginBattle(data, base, firstNode(data).id, base.roster.map((u) => u.id)).state;
    const old = { ...s, units: s.units.map((u, i) => (i === 0 ? { ...u, classId: 'soldier' } : u)) };
    const renamed = renameLegacyBattleClasses(data, old);
    expect(renamed.units[0]!.classId).toBe('vanguard');
    expect(renamed.units.slice(1)).toEqual(s.units.slice(1));
  });

  it('every legacy id is unused by a current class and names one replacement', () => {
    const all = Object.values(data.classes).flatMap((c) => c.legacyIds ?? []);
    expect(new Set(all).size).toBe(all.length);
    for (const id of all) expect(data.classes[id]).toBeUndefined();
  });
});
