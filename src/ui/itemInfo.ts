/**
 * Everything the item detail sheet says about one item, worked out from its definition, its instance (affixes,
 * runes, upgrade, charges) and the balance values. Numbers come from the same rule code as the battle
 * (weaponProfile, itemStatMods), never from a copy.
 */
import {
  itemDef,
  itemStatMods,
  itemWeight,
  runeSlotCount,
  sellPrice,
  weaponProfile,
  type GameData,
  type ItemDef,
  type ItemInstance,
  type StatusId,
} from '../core';
import { t } from '../i18n';
import { instanceRarity } from '../core/loot';

export interface ItemFact {
  key: string;
  label: string;
  value: string;
  /** one short sentence what the value does */
  hint?: string;
  /** a bonus (up) or a malus (down) */
  tone?: 'up' | 'down';
}

export interface ItemInfo {
  def: ItemDef;
  /** "Weapon · Sword · Main hand · two-handed" */
  type: string;
  desc: string;
  facts: ItemFact[];
  /** what the item does beyond the numbers, one sentence each */
  effects: string[];
  skill?: { name: string; desc: string; cost: number };
  set?: { name: string; pieces: string[]; bonuses: string[] };
  /** rune slots in order, `null` = free */
  runes: Array<string | null>;
  affixes: string[];
  /** limits like "cannot be sold" */
  notes: string[];
  buy: number;
  sell: number;
}

export function itemName(data: GameData, inst: ItemInstance): string {
  let name = t(`item.${inst.def}.name`);
  const pre = inst.affixes.filter((a) => data.affixes[a]?.position === 'prefix').map((a) => t(`affix.${a}`));
  const suf = inst.affixes.filter((a) => data.affixes[a]?.position === 'suffix').map((a) => t(`affix.${a}`));
  if (pre.length) name = t('ui.item.prefixed', { name, affix: pre.join(' ') });
  if (suf.length) name = `${name} ${suf.join(' ')}`;
  if (inst.upgrade > 0) name += ` +${inst.upgrade}`;
  return name;
}

export function rarityOf(data: GameData, inst: ItemInstance): string {
  return instanceRarity(data, inst.def, inst.affixes.length);
}

/** An item named only by its id (runes and materials in the convoy) as a plain instance. */
export function asInstance(item: ItemInstance | string): ItemInstance {
  return typeof item === 'string' ? { uid: '', def: item, upgrade: 0, affixes: [], runes: [] } : item;
}

const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}`;
const range = (r: [number, number]) => (r[0] === r[1] ? `${r[0]}` : `${r[0]}–${r[1]}`);

/** Name of a stat or combat value in full ("Strength", "Hit"). */
function statLabel(k: string): string {
  return t(`ui.itemInfo.stat.${k}`);
}

function statusLine(data: GameData, status: StatusId, chance: number): string {
  const b = data.balance.status;
  const what = t(`ui.itemInfo.status.${status}`, {
    pct: b.burnPercentMaxHp,
    rounds: b.durationRounds,
    spd: b.wetSpdPenalty,
    mov: b.slowMovPenalty,
    dmg: b.knockbackBlockedDamage,
  });
  return t('ui.itemInfo.onHit', { status: t(`ui.status.${status}`), chance, what });
}

function effectiveLine(data: GameData, tags: string[]): string {
  return t('ui.itemInfo.effective', {
    tags: tags.map((x) => t(`ui.tag.${x}`)).join(', '),
    n: data.balance.combat.effectiveMightMultiplier,
  });
}

function terrainLine(terrain: 'ignite' | 'extinguish'): string {
  return t(`ui.itemInfo.terrain.${terrain}`);
}

function statFacts(mods: Record<string, number | undefined>): ItemFact[] {
  return Object.entries(mods)
    .filter(([, v]) => !!v)
    .map(([k, v]) => ({ key: k, label: statLabel(k), value: signed(v!), tone: v! > 0 ? 'up' : 'down' }));
}

function weaponFacts(data: GameData, inst: ItemInstance, d: ItemDef): { facts: ItemFact[]; effects: string[] } {
  const w = weaponProfile(data, inst);
  const c = data.balance.combat;
  const magic = w.damageType === 'magical';
  const facts: ItemFact[] = [
    {
      key: 'mt',
      label: statLabel('mt'),
      value: `${w.might}`,
      hint: t(magic ? 'ui.itemInfo.hint.mtMagic' : 'ui.itemInfo.hint.mtPhysical'),
    },
    {
      key: 'hit',
      label: statLabel('hit'),
      value: `${w.hit}`,
      hint: t('ui.itemInfo.hint.hit', { skl: c.hitPerSkl, lck: c.hitPerLckDivisor }),
    },
    {
      key: 'crit',
      label: statLabel('crit'),
      value: `${w.crit}`,
      hint: t('ui.itemInfo.hint.crit', { skl: c.critPerSklDivisor, n: c.critMultiplier }),
    },
    { key: 'rng', label: statLabel('rng'), value: range(w.range), hint: t('ui.itemInfo.hint.rng') },
    { key: 'wt', label: statLabel('wt'), value: `${w.weight}`, hint: t('ui.itemInfo.hint.wt') },
    { key: 'damageType', label: t('ui.itemInfo.damageType'), value: t(`ui.itemInfo.damage.${w.damageType}`) },
  ];
  if (w.element)
    facts.push({
      key: 'element',
      label: t('ui.element'),
      value: t(`ui.element.${w.element}`),
      hint: t('ui.itemInfo.hint.element'),
    });
  const effects: string[] = [];
  if (w.effectiveVs.length) effects.push(effectiveLine(data, [...new Set(w.effectiveVs)]));
  for (const s of w.statusOnHit) effects.push(statusLine(data, s.status, s.chance));
  if (w.terrainOnHit) effects.push(terrainLine(w.terrainOnHit));
  if (d.twoHanded) effects.push(t('ui.itemInfo.twoHandedNote'));
  return { facts, effects };
}

function useEffects(data: GameData, d: ItemDef): string[] {
  const u = d.use;
  if (!u) return [];
  const out: string[] = [];
  if (u.heal) out.push(t('ui.itemInfo.use.heal', { n: u.heal }));
  if (u.cureStatus) out.push(t('ui.itemInfo.use.cure'));
  if (u.open?.length)
    out.push(t('ui.itemInfo.use.open', { what: u.open.map((x) => t(`ui.itemInfo.open.${x}`)).join(', ') }));
  if (u.damage) {
    out.push(
      t(u.element ? 'ui.itemInfo.use.damageElement' : 'ui.itemInfo.use.damage', {
        n: u.damage,
        rng: range(u.rng ?? [1, 1]),
        element: u.element ? t(`ui.element.${u.element}`) : '',
      }),
    );
    if (u.status) out.push(statusLine(data, u.status, 100));
    if (u.terrain) out.push(terrainLine(u.terrain));
  }
  if (u.statMods) {
    const mods = Object.entries(u.statMods)
      .map(([k, v]) => `${t(`ui.stat.${k}`)} ${signed(v!)}`)
      .join(', ');
    const who = t(`ui.itemInfo.target.${u.target ?? 'self'}`, { rng: range(u.rng ?? [0, 0]) });
    const until =
      u.duration === 'round' ? t('ui.itemInfo.until.round') : t('ui.itemInfo.until.rounds', { n: u.duration ?? 1 });
    out.push(t('ui.itemInfo.use.buff', { who, mods, until }));
  }
  if (u.vision) out.push(t('ui.itemInfo.use.vision', { n: u.vision, rounds: u.duration ?? 1 }));
  if (u.promote) out.push(t('ui.itemInfo.use.promote', { level: u.minLevel ?? 1 }));
  if (u.removeScar) out.push(t('ui.itemInfo.use.removeScar'));
  if (!d.tags?.includes('campOnly')) out.push(t('ui.itemInfo.use.action'));
  return out;
}

function runeEffects(data: GameData, d: ItemDef): { facts: ItemFact[]; effects: string[] } {
  const r = data.runes[d.id];
  if (!r) return { facts: [], effects: [] };
  if (r.utility) {
    const m = r.mods ?? {};
    return {
      facts: statFacts({ mt: m.might, hit: m.hit, crit: m.crit, wt: m.weight }).map((f) =>
        f.key === 'wt' ? { ...f, tone: f.tone === 'up' ? 'down' : 'up' } : f,
      ),
      effects: [t('ui.itemInfo.rune.utility')],
    };
  }
  const effects: string[] = [];
  const b = data.balance;
  const tier = r.tier ?? 1;
  if (r.element) {
    effects.push(t('ui.itemInfo.rune.element', { element: t(`ui.element.${r.element}`) }));
    const status = b.element.statusOf[r.element];
    if (status && tier >= 2)
      effects.push(statusLine(data, status, tier >= 3 ? b.status.rune3StatusChance : b.status.rune2StatusChance));
    if (tier >= 3 && r.terrainOnHit) effects.push(terrainLine(r.terrainOnHit));
    if (tier >= 3 && r.effectiveVs?.length) effects.push(effectiveLine(data, r.effectiveVs));
    effects.push(t('ui.itemInfo.rune.armor', { element: t(`ui.element.${r.element}`) }));
  }
  const facts: ItemFact[] = [{ key: 'tier', label: t('ui.itemInfo.tier'), value: 'I'.repeat(Math.min(3, tier)) }];
  return { facts, effects };
}

export function itemInfo(data: GameData, item: ItemInstance | string): ItemInfo {
  const inst = asInstance(item);
  const d = itemDef(data, inst);
  const type = [t(`ui.itemInfo.kind.${d.kind}`)];
  if (d.group && d.kind !== 'shield') type.push(t(`ui.weapon.${d.group}`));
  if (d.armorClass) type.push(t(`ui.itemInfo.armor.${d.armorClass}`));
  if (d.slot !== 'bag') type.push(t(d.slot === 'accessory' ? 'ui.slot.accessory1' : `ui.slot.${d.slot}`));
  if (d.twoHanded) type.push(t('ui.itemInfo.twoHanded'));

  let facts: ItemFact[] = [];
  let effects: string[] = [];
  if (d.mt !== undefined) ({ facts, effects } = weaponFacts(data, inst, d));
  else if (d.kind === 'rune') ({ facts, effects } = runeEffects(data, d));
  else {
    if (d.heal)
      facts.push({ key: 'heal', label: t('ui.heal'), value: `${d.heal}`, hint: t('ui.itemInfo.hint.staffHeal') });
    if (d.rng && d.kind === 'staff')
      facts.push({ key: 'rng', label: statLabel('rng'), value: range(d.rng), hint: t('ui.itemInfo.hint.rng') });
    if (d.cureStatus) effects.push(t('ui.itemInfo.use.cure'));
    if (d.utility) {
      effects.push(
        t('ui.itemInfo.utility', {
          terrain: t(`terrain.${d.utility.createTerrain}`),
          rng: range(d.utility.rng),
          rounds: data.balance.terrainEffects.rockwallDuration,
        }),
      );
    }
    if (d.element && d.slot === 'body')
      effects.push(t('ui.itemInfo.affinity', { element: t(`ui.element.${d.element}`) }));
    else if (d.element) facts.push({ key: 'element', label: t('ui.element'), value: t(`ui.element.${d.element}`) });
    facts.push(...statFacts(itemStatMods(data, inst)));
    const wt = itemWeight(data, inst);
    if (wt || d.slot !== 'bag')
      facts.push({ key: 'wt', label: statLabel('wt'), value: `${wt}`, hint: t('ui.itemInfo.hint.wt') });
    effects.push(...useEffects(data, d));
  }
  if (d.charges) {
    const now = inst.charges ?? d.charges;
    facts.push({ key: 'charges', label: t('ui.charges'), value: `${now}/${Math.max(d.charges, now)}` });
    effects.push(t(d.refillAfterMission ? 'ui.itemInfo.refill' : 'ui.itemInfo.usedUp'));
  }

  const set = d.setId ? data.sets[d.setId] : undefined;
  const notes = (d.tags ?? [])
    .filter((x) => ['unsellable', 'convoyOnly', 'campOnly', 'monsterOnly'].includes(x))
    .map((x) => t(`ui.itemInfo.tag.${x}`));
  const slots = d.kind === 'rune' ? 0 : runeSlotCount(data, inst);
  return {
    def: d,
    type: type.join(' · '),
    desc: t(`item.${d.id}.desc`),
    facts,
    effects,
    skill: d.grantsSkill && {
      name: t(`skill.${d.grantsSkill.skill}.name`),
      desc: t(`skill.${d.grantsSkill.skill}.desc`),
      cost: d.grantsSkill.masteryCost,
    },
    set: set && {
      name: t(`set.${set.id}.name`),
      pieces: set.pieces.map((p) => t(`item.${p}.name`)),
      bonuses: set.bonuses.map((x) => {
        const m = x.mods;
        const parts = [
          ...Object.entries(m.stats ?? {}).map(([k, v]) => `${t(`ui.stat.${k}`)} ${signed(v!)}`),
          ...(m.grantSkill ? [t('ui.itemInfo.set.skill', { skill: t(`skill.${m.grantSkill}.name`) })] : []),
          ...(m.statusChanceBonus
            ? [
                t('ui.itemInfo.set.status', {
                  element: t(`ui.element.${m.statusChanceBonus.element}`),
                  n: m.statusChanceBonus.value,
                }),
              ]
            : []),
        ];
        return t('ui.itemInfo.set.bonus', { n: x.count, what: parts.join(', ') });
      }),
    },
    runes: Array.from({ length: slots }, (_, i) => inst.runes[i] ?? null),
    affixes: inst.affixes.map((a) => t(`affix.${a}`)),
    notes,
    buy: d.price,
    sell: sellPrice(data, inst),
  };
}
