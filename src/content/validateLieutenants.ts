/** Cross-reference checks of the lieutenants (story 3.1): references, scene lines in both languages, map units that name one. */
import type { GameData, MapDef, MapUnitDef } from '../core/defs';
import { lineKey } from '../core/campaign/scene';
import { fillTarget, lieutenantLineIds, LIEUTENANT_LINES, TARGET_PLACEHOLDER } from './lieutenantLines';
import type { Locales } from './load';

/** At most this many lieutenants per act (GDD: four lieutenants, one camp each). */
export const MAX_LIEUTENANTS_PER_ACT = 4;

/** Files the checks look for; an unset list skips that check. A missing file is only a warning (message starts with `missing`). */
export interface LieutenantFiles {
  /** ids of the character images (art/mockups/characters-s1) */
  portraits?: Set<string>;
  /** ids of the figure models (art/models/units) */
  models?: Set<string>;
}

type Err = (file: string, message: string) => void;

/** Names of the company members a grudge line can name: every character that is not an enemy, plus the avatar's default name. */
export function companionNames(data: GameData, locales: Locales, lang: 'de' | 'en'): string[] {
  const names: string[] = [];
  for (const ch of Object.values(data.chars)) {
    if (ch.flags.includes('enemy')) continue;
    const raw = locales[lang]?.[`unit.${ch.id}.name`];
    if (raw) names.push(raw.replace('{avatar}', 'Rhen'));
  }
  return names;
}

/** The longest companion name: the worst case for `{target}` in a bubble. */
export const longestName = (names: readonly string[]): string => names.reduce((a, b) => (b.length > a.length ? b : a), '');

function allMapUnits(m: MapDef): MapUnitDef[] {
  return [
    ...m.units,
    ...m.reinforcements.flatMap((r) => r.units),
    ...m.triggers.flatMap((t) => t.then.flatMap((a) => (a.action === 'spawn' ? a.units : []))),
  ];
}

export function validateLieutenants(data: GameData, locales: Locales, err: Err, files: LieutenantFiles = {}): void {
  const f = 'lieutenants.yaml';
  const all = Object.values(data.lieutenants ?? {});
  const perAct = new Map<number, number>();
  const maxChars = data.balance.scene.bubbleMaxChars;
  // bounty material of the acts (story 3.5): must be a material item, and every act with lieutenants needs one
  const byAct = data.balance.lieutenant.bounty.materialByAct;
  for (const [act, id] of Object.entries(byAct)) {
    const it = data.items[id];
    if (!it) err('balance.yaml', `lieutenant.bounty.materialByAct ${act}: unknown item ${id}`);
    else if (it.kind !== 'material') err('balance.yaml', `lieutenant.bounty.materialByAct ${act}: ${id} is no material`);
  }
  // weapon tier chain (story 3.4): both items exist, the same weapon group, no step onto itself
  for (const [from, to] of Object.entries(data.balance.lieutenant.scaling.tierUp)) {
    const a = data.items[from];
    const b = data.items[to];
    if (!a) err('balance.yaml', `lieutenant.scaling.tierUp: unknown item ${from}`);
    if (!b) err('balance.yaml', `lieutenant.scaling.tierUp: unknown item ${to}`);
    if (!a || !b) continue;
    if (from === to) err('balance.yaml', `lieutenant.scaling.tierUp: ${from} points at itself`);
    if (!a.group || a.group !== b.group) err('balance.yaml', `lieutenant.scaling.tierUp: ${from} -> ${to} must stay in one weapon group (${a.group ?? 'none'} / ${b.group ?? 'none'})`);
  }
  // the grudge goes 0..max: one grudge skill and one `grudge_<n>` line per step (review R9)
  const gmax = data.balance.lieutenant.grudge.max;
  const grudgeLines = LIEUTENANT_LINES.filter((l) => /^grudge_\d+$/.test(l)).length;
  if (grudgeLines !== gmax) err('balance.yaml', `lieutenant.grudge.max is ${gmax}, but there are ${grudgeLines} grudge_<n> lines (lieutenantLines.ts)`);
  for (const lt of all) if (lt.grudgeSkills.length !== gmax) err('lieutenants.yaml', `${lt.id}: ${lt.grudgeSkills.length} grudge skills, lieutenant.grudge.max is ${gmax}`);
  for (const lt of all) if (!byAct[String(lt.act)]) err('balance.yaml', `lieutenant.bounty.materialByAct: no material for act ${lt.act} (${lt.id})`);
  for (const lt of all) {
    perAct.set(lt.act, (perAct.get(lt.act) ?? 0) + 1);
    if (!data.classes[lt.class]) err(f, `${lt.id}: unknown class ${lt.class}`);
    if (!data.items[lt.signatureItem]) err(f, `${lt.id}: unknown signature item ${lt.signatureItem}`);
    lt.grudgeSkills.forEach((s, i) => {
      const sk = data.skills[s];
      if (!sk) err(f, `${lt.id}: unknown grudge skill ${s} (step ${i + 1})`);
      else if (sk.source !== 'grudge') err(f, `${lt.id}: skill ${s} must have the source grudge`);
    });
    if (new Set(lt.grudgeSkills).size !== lt.grudgeSkills.length) err(f, `${lt.id}: the grudge skills must differ`);
    if (!locales.de?.[lt.nameKey] || !locales.en?.[lt.nameKey]) err(f, `${lt.id}: missing name key ${lt.nameKey}`);
    for (const lang of ['de', 'en']) {
      if (!locales[lang]?.[lt.titleKey]) err(`locales/${lang}`, `missing key ${lt.titleKey}`);
      if (!locales[lang]?.[`faction.${lt.faction}.name`]) err(`locales/${lang}`, `missing key faction.${lt.faction}.name`);
    }
    if (files.portraits && !files.portraits.has(lt.portrait)) err(f, `missing portrait ${lt.portrait} (art/mockups/characters-s1/${lt.portrait}.png)`);
    if (files.models && !files.models.has(lt.model)) err(f, `missing model ${lt.model} (art/models/units/${lt.model}.glb)`);

    // the scene: fixed line ids, one speaker, no answers, length with the longest companion name put in
    if (lt.scene !== `scn.lt.${lt.id}`) err(f, `${lt.id}: scene must be scn.lt.${lt.id}`);
    const sc = data.scenes[lt.scene];
    if (!sc) {
      err(f, `${lt.id}: unknown scene ${lt.scene}`);
      continue;
    }
    const sf = `scenes/${sc.id}`;
    const want = lieutenantLineIds(lt);
    const have = sc.lines.map((l) => l.id);
    for (const id of want) if (!have.includes(id)) err(sf, `${id}: line missing`);
    for (const l of sc.lines) {
      if ('choice' in l) {
        err(sf, `${l.id}: a lieutenant scene has no answers`);
        continue;
      }
      if (!want.includes(l.id)) err(sf, `${l.id}: line id must be one of ${want.join(', ')}`);
      if (l.speaker?.length !== 1 || l.speaker[0] !== lt.id) err(sf, `${l.id}: speaker chain must be exactly [${lt.id}]`);
      const de = fillTarget(l.text, longestName(companionNames(data, locales, 'de')));
      if (de.length > maxChars) err(sf, `${l.id}: de line longer than ${maxChars} characters with {target} put in (${de.length})`);
      const enRaw = locales.en?.[lineKey(sc.id, l.id)];
      if (enRaw !== undefined) {
        if (l.text.includes(TARGET_PLACEHOLDER) !== enRaw.includes(TARGET_PLACEHOLDER)) err(sf, `${l.id}: {target} must appear in both languages or in neither`);
        const en = fillTarget(enRaw, longestName(companionNames(data, locales, 'en')));
        if (en.length > maxChars) err(sf, `${l.id}: en line longer than ${maxChars} characters with {target} put in (${en.length})`);
      }
    }
  }
  for (const [act, n] of perAct) if (n > MAX_LIEUTENANTS_PER_ACT) err(f, `act ${act}: ${n} lieutenants, at most ${MAX_LIEUTENANTS_PER_ACT}`);

  // a lieutenant stands on a map once per difficulty: line-up, reinforcements and trigger spawns together (review R8)
  for (const m of Object.values(data.maps))
    for (const d of ['easy', 'normal', 'hard'] as const) {
      const count = new Map<string, number>();
      for (const u of allMapUnits(m)) if (u.lieutenant && (!u.difficulty || u.difficulty.includes(d))) count.set(u.lieutenant, (count.get(u.lieutenant) ?? 0) + 1);
      for (const [id, n] of count) if (n > 1) err(`maps/${m.id}`, `${id}: ${n} units on difficulty ${d}, a lieutenant appears at most once per map and difficulty`);
    }

  // a map unit that names a lieutenant needs him in the content
  for (const m of Object.values(data.maps))
    for (const u of allMapUnits(m)) {
      if (!u.lieutenant) continue;
      const lt = data.lieutenants?.[u.lieutenant];
      if (!lt) err(`maps/${m.id}`, `${u.id ?? u.class}: unknown lieutenant ${u.lieutenant}`);
      else if (u.items.some((r) => r.def === lt.signatureItem)) err(`maps/${m.id}`, `${u.id ?? u.class}: ${lt.id} never carries his signature item ${lt.signatureItem} (loot only)`);
    }
}
