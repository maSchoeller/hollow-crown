import { STAT_KEYS, type CharDef, type EquipSlot, type GameData, type ItemRef, type MapUnitDef, type Pos, type Stats } from '../defs';
import { addToBag, bagIsFull, canEquip, itemDef } from '../rules/items';
import { computeStats } from '../rules/stats';
import type { AvatarSettings, BattleUnit, ItemInstance, LieutenantPlan, UnitRecord } from '../state';
import { clone } from '../util';

export interface UidSource {
  nextUid: number;
}

export function newItem(src: UidSource, ref: ItemRef | string, data?: GameData): ItemInstance {
  const r = typeof ref === 'string' ? { def: ref } : ref;
  const inst: ItemInstance = {
    uid: `i${src.nextUid++}`,
    def: r.def,
    upgrade: r.upgrade ?? 0,
    affixes: [...(r.affixes ?? [])],
    runes: [...(r.runes ?? [])],
  };
  if (data) {
    const d = data.items[r.def];
    if (d?.charges) inst.charges = d.charges;
  }
  return inst;
}

const zeroStats = (): Stats => ({ hp: 0, str: 0, mag: 0, skl: 0, spd: 0, lck: 0, def: 0, res: 0 });

/** Puts items into the best fitting slots; the rest goes into the bag (overflow is returned). */
export function autoEquip(data: GameData, u: UnitRecord, items: ItemInstance[]): ItemInstance[] {
  const overflow: ItemInstance[] = [];
  for (const inst of items) {
    const d = itemDef(data, inst);
    const slots: EquipSlot[] =
      d.slot === 'accessory' ? ['accessory1', 'accessory2'] : d.slot === 'bag' ? [] : [d.slot as EquipSlot];
    const free = slots.find((sl) => !u.equip[sl] && canEquip(data, u, inst, sl) === null);
    if (free) u.equip[free] = inst;
    else if (!bagIsFull(data, u.bag, inst) && !d.tags?.includes('convoyOnly')) addToBag(data, u.bag, inst);
    else overflow.push(inst);
  }
  return overflow;
}

/** Creates a company member from a character definition (concept/11 §4). */
export function recordFromChar(data: GameData, def: CharDef, src: UidSource, avatar?: AvatarSettings): UnitRecord {
  const u: UnitRecord = {
    id: def.id,
    charId: def.id,
    nameKey: `unit.${def.id}.name`,
    classId: def.class,
    level: def.level,
    exp: 0,
    stats: clone(def.base),
    growth: clone(def.growth),
    gained: zeroStats(),
    expected: zeroStats(),
    affinity: def.affinity === 'chosen' ? avatar?.affinity : def.affinity,
    personalSkill: def.personalSkill,
    flags: [...def.flags],
    equip: {},
    bag: [],
    scars: [],
    mastered: [],
    loadout: [],
    sp: {},
    portrait: def.portrait ?? def.id,
    sprite: def.sprite ?? def.id,
  };
  if (def.flags.includes('avatar') && avatar) {
    u.name = avatar.name;
    u.portrait = avatar.portrait;
  }
  autoEquip(data, u, def.items.map((r) => newItem(src, r, data)));
  return u;
}

/** `n / d` rounded to the nearest whole number, halves up (commercial rounding); for `n >= 0`, `d > 0`. */
export const roundDiv = (n: number, d: number): number => Math.floor((2 * n + d) / (2 * d));

/**
 * Stats of a generic unit of a class at a level (class base + growth % x levels above 1, no dice), scaled by the
 * difficulty percent, capped by the class. 'floor' (default) rounds down as generic foes and mercenaries always did;
 * 'nearest' is the expected value rounded commercially (halves up) that lieutenants get (story 3.4). One function for both,
 * so they cannot drift apart.
 */
export function genericStats(data: GameData, classId: string, level: number, statPercent: number, rounding: 'floor' | 'nearest' = 'floor'): Stats {
  const div = rounding === 'nearest' ? roundDiv : (n: number, d: number) => Math.floor(n / d);
  const cls = data.classes[classId]!;
  const out = zeroStats();
  for (const k of STAT_KEYS) {
    const raw = cls.base[k] + div(cls.growth[k] * Math.max(0, level - 1), 100);
    out[k] = Math.min(cls.caps[k], Math.max(0, div(raw * (100 + statPercent), 100)));
  }
  return out;
}

export function battleUnitFromRecord(data: GameData, rec: UnitRecord, team: BattleUnit['team'], pos: Pos): BattleUnit {
  const u: BattleUnit = {
    ...clone(rec),
    uid: rec.id,
    team,
    pos: [pos[0], pos[1]],
    startPos: [pos[0], pos[1]],
    hp: 0,
    acted: false,
    moved: false,
    downed: false,
    bleed: 0,
    status: [],
    buffs: [],
    usedPerMap: {},
    freeUsed: {},
    dropUids: [],
    generic: false,
    fromRoster: true,
  };
  u.hp = computeStats(data, u).maxHp;
  return u;
}

/**
 * A map unit as the battle builds it from the plan of its lieutenant (review R1): the scaled level, tiered items, grudge skills,
 * grudge and target. Without a plan the unit is built as the map says.
 */
export function battleUnitFromPlan(data: GameData, def: MapUnitDef, src: UidSource, statPercent: number, uid: string, plan?: LieutenantPlan): BattleUnit {
  if (!plan) return battleUnitFromMap(data, def, src, statPercent, uid);
  const scaled: MapUnitDef = { ...def, level: plan.level, items: plan.items.map((r) => ({ ...r })) };
  if (plan.drops) scaled.drops = [...plan.drops];
  else delete scaled.drops;
  const unit = battleUnitFromMap(data, scaled, src, statPercent, uid, plan.skills);
  if (plan.grudge !== undefined) unit.grudge = plan.grudge;
  if (plan.target) unit.grudgeTarget = plan.target;
  return unit;
}

/** Creates a map-defined unit (enemy, NPC, story character on the enemy side). */
export function battleUnitFromMap(
  data: GameData,
  def: MapUnitDef,
  src: UidSource,
  statPercent: number,
  uid: string,
  /** skills the unit masters from the start and has equipped (a lieutenant's grudge skills, story 3.4) */
  grantSkills: readonly string[] = [],
): BattleUnit {
  const char = def.char ? data.chars[def.char] : undefined;
  const refs = def.items.length || !char ? def.items : char.items;
  const insts = refs.map((r) => newItem(src, r, data));
  let rec: UnitRecord;
  if (char) {
    rec = recordFromChar(data, { ...char, items: [] }, src);
  } else {
    rec = {
      id: def.id ?? uid,
      nameKey: def.nameKey ?? `class.${def.class}.name`,
      classId: def.class,
      level: def.level,
      exp: 0,
      stats: genericStats(data, def.class, def.level, statPercent, def.lieutenant && data.lieutenants?.[def.lieutenant] ? 'nearest' : 'floor'),
      growth: clone(data.classes[def.class]!.growth),
      gained: zeroStats(),
      expected: zeroStats(),
      flags: [],
      equip: {},
      bag: [],
      scars: [],
      mastered: [],
      loadout: [],
      sp: {},
      sprite: def.sprite,
      portrait: def.portrait,
    };
  }
  autoEquip(data, rec, insts);
  for (const sk of grantSkills) {
    if (!rec.mastered.includes(sk)) rec.mastered.push(sk);
    if (!rec.loadout.includes(sk)) rec.loadout.push(sk);
  }
  if (def.nameKey) rec.nameKey = def.nameKey;
  if (def.sprite) rec.sprite = def.sprite;
  if (def.portrait) rec.portrait = def.portrait;
  // a lieutenant gives name, figure and portrait where the map sets none (story 3.1; the class is resolved by the loader)
  const lt = def.lieutenant ? data.lieutenants?.[def.lieutenant] : undefined;
  if (lt) {
    if (!def.nameKey) rec.nameKey = lt.nameKey;
    if (!def.sprite) rec.sprite = lt.model;
    if (!def.portrait) rec.portrait = lt.portrait;
  }
  const u = battleUnitFromRecord(data, rec, def.team, def.at);
  u.uid = def.id ?? uid;
  u.id = def.char ?? def.id ?? uid;
  u.generic = !char;
  u.fromRoster = false;
  u.boss = def.boss;
  if (def.lieutenant) u.lieutenant = def.lieutenant;
  u.quote = def.quote;
  u.recruit = def.recruit ?? (char?.recruit ? { by: char.recruit.by, dialogue: char.recruit.dialogue } : undefined);
  u.ignoreForRout = def.ignoreForRout;
  if (def.untargetable) u.untargetable = true;
  if (def.ai) u.ai = { ...def.ai };
  u.dropUids = (def.drops ?? []).map((idx) => insts[idx]?.uid).filter((x): x is string => !!x);
  return u;
}
