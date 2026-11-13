import { HOME_KINDS } from '../core/defs';
import type { GameData } from '../core/gameData';
import { pageTextKey, pageTitleKey, readTextKey, readTitleKey, sealedTextKey, sealedTitleKey } from '../core/campaign/chronicle';
import { memorialTexts } from '../core/campaign/memorial';
import type { Locales } from './load';
import type { Err } from './validateRefs';
import { allUnits } from './validateWalk';

/** i18n: names of all content and parity between DE and EN; chronicle limits; sprites of map units and classes. */
export function validateLocales(data: GameData, locales: Locales, err: Err, spriteIds?: Set<string>): void {
  const need: string[] = [];
  for (const c of Object.values(data.classes)) need.push(`class.${c.id}.name`);
  // the detail sheet shows a description of every item and the name of its set
  for (const i of Object.values(data.items)) need.push(`item.${i.id}.name`, `item.${i.id}.desc`);
  for (const st of Object.values(data.sets)) need.push(`set.${st.id}.name`);
  for (const s of Object.values(data.skills)) need.push(`skill.${s.id}.name`, `skill.${s.id}.desc`);
  for (const a of Object.values(data.affixes)) need.push(`affix.${a.id}`);
  for (const t of Object.values(data.terrain)) need.push(`terrain.${t.id}`);
  for (const m of Object.values(data.maps)) need.push(m.nameKey);
  for (const ch of Object.values(data.chars)) need.push(`unit.${ch.id}.name`);
  need.push(...data.balance.economy.tavern.names);
  for (const r of Object.values(data.rooms)) need.push(`room.${r.id}.name`, `room.${r.id}.desc`, ...r.unlocks.map((u) => `room.${r.id}.unlock.${u.id}`), ...r.levels.map((_, i) => `room.${r.id}.level.${i + 2}`));
  for (const m of Object.values(data.memorials)) need.push(...Object.keys(memorialTexts(m)));
  for (const k of HOME_KINDS) need.push(`home.${k}.name`, `home.${k}.title`);
  // every loaded act (story 11.1)
  for (const camp of Object.values(data.acts)) {
    for (const n of camp.nodes) need.push(n.titleKey);
    need.push(`act.${camp.act}.name`, `act.${camp.act}.season`);
    for (const sc of camp.scars) need.push(`scar.${sc.id}`);
  }
  // chronicle pages: English texts, and no more pages than the season has (narrative: 12)
  for (const p of Object.values(data.chronicle)) need.push(pageTitleKey(p.id), pageTextKey(p.id));
  for (const e of data.balance.chronicle.sealed) {
    need.push(sealedTitleKey(e.flag), sealedTextKey(e.flag));
    if (!data.flags[e.flag]) err('balance.yaml', `chronicle.sealed: undeclared flag ${e.flag} (acts/*/flags.yaml)`);
    if (e.readFlag) {
      need.push(readTitleKey(e.flag), readTextKey(e.flag));
      if (!data.flags[e.readFlag]) err('balance.yaml', `chronicle.sealed: undeclared readFlag ${e.readFlag} (acts/*/flags.yaml)`);
    }
  }
  if (Object.keys(data.chronicle).length > data.balance.chronicle.seasonPages)
    err('chronicle.yaml', `${Object.keys(data.chronicle).length} chronicle pages, the season has ${data.balance.chronicle.seasonPages}`);
  for (const k of need) for (const lang of ['de', 'en']) if (!locales[lang]?.[k]) err(`locales/${lang}`, `missing key ${k}`);
  const de = Object.keys(locales.de ?? {});
  const en = new Set(Object.keys(locales.en ?? {}));
  for (const k of de) if (!en.has(k)) err('locales/en', `missing key ${k} (present in de)`);
  for (const k of en) if (!(locales.de ?? {})[k]) err('locales/de', `missing key ${k} (present in en)`);
  if (spriteIds) {
    for (const m of Object.values(data.maps))
      for (const u of allUnits(m)) if (u.sprite && !spriteIds.has(u.sprite)) err(`maps/${m.id}`, `unknown sprite ${u.sprite}`);
    // the figure of a unit without its own sprite (tavern hires, src/core/figure.ts unitFigureId)
    for (const c of Object.values(data.classes)) {
      const fig = c.sprite ?? c.art;
      if (fig && !spriteIds.has(fig)) err('classes.yaml', `unknown sprite ${fig} (class ${c.id})`);
    }
  }
}
