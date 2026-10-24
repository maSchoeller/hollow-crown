import type { Area, Condition, Effect, FlagValue, GameData, ItemRef, MapDef, MapUnitDef, Pos, Reward } from '../core/defs';
import { flagEntry, UNSUPPORTED_EFFECTS } from '../core/campaign/effects';
import { soleKey, UNSUPPORTED_CONDITIONS } from '../core/campaign/conditions';
import { areaTiles } from '../core/util';
import type { ContentIssue, Locales } from './load';

/** Cross-reference checks that Zod cannot express (concept/11 §2 Validierung, §9). */
export function validateContent(
  data: GameData,
  locales: Locales,
  spriteIds?: Set<string>,
  /** ids of the painted images in art/items (content:check passes them); every item needs one */
  itemImages?: Set<string>,
): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const err = (file: string, message: string) => issues.push({ file, message });
  const item = (file: string, ref: ItemRef | undefined, ctx: string) => {
    if (ref && !data.items[ref.def]) err(file, `${ctx}: unknown item ${ref.def}`);
    for (const a of ref?.affixes ?? []) if (!data.affixes[a]) err(file, `${ctx}: unknown affix ${a}`);
    for (const r of ref?.runes ?? []) if (!data.runes[r]) err(file, `${ctx}: unknown rune ${r}`);
  };
  const dialogue = (file: string, id: string | undefined, ctx: string) => {
    if (id && !data.dialogues[id]) err(file, `${ctx}: unknown dialogue ${id}`);
  };
  const reward = (file: string, r: Reward | undefined, ctx: string) => {
    if (!r) return;
    item(file, r.item, ctx);
    dialogue(file, r.dialogue, ctx);
    if (r.recruit && !data.chars[r.recruit]) err(file, `${ctx}: unknown recruit ${r.recruit}`);
    for (const m of Object.keys(r.material ?? {})) if (!data.items[m]) err(file, `${ctx}: unknown material ${m}`);
  };
  // conditions and effects (architecture §5.3): every reference must exist, unfinished keys are refused
  const nodeKnown = (id: string) => !!data.campaign?.nodes.some((n) => n.id === id) || /^ch\d+$/.test(id);
  const flag = (file: string, ref: string | Record<string, FlagValue>, ctx: string) => {
    const [name, value] = flagEntry(ref);
    const def = data.flags[name];
    if (!def) return void err(file, `${ctx}: undeclared flag ${name} (acts/*/flags.yaml)`);
    if (def.values ? !def.values.includes(value as string | number) : value !== true)
      err(file, `${ctx}: flag ${name} cannot have the value ${String(value)}`);
  };
  const companion = (file: string, id: string, ctx: string) => {
    if (!data.chars[id]) err(file, `${ctx}: unknown companion ${id}`);
  };
  const condition = (file: string, cond: Condition, ctx: string): void => {
    const key = soleKey(cond);
    const v = (cond as unknown as Record<string, unknown>)[key];
    if (UNSUPPORTED_CONDITIONS.includes(key)) return void err(file, `${ctx}: condition ${key} is not yet supported`);
    switch (key) {
      case 'flag':
        return flag(file, v as string | Record<string, FlagValue>, ctx);
      case 'alive':
      case 'dead':
      case 'left':
        return companion(file, v as string, ctx);
      case 'completed':
        if (!nodeKnown(v as string)) err(file, `${ctx}: unknown node ${v as string}`);
        return;
      case 'support': {
        const [a, b] = (v as { pair: [string, string] }).pair;
        companion(file, a, ctx);
        companion(file, b, ctx);
        if (!data.campaign?.supportPairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) err(file, `${ctx}: unknown support pair ${a}|${b}`);
        return;
      }
      case 'any':
        for (const x of v as Condition[]) condition(file, x, ctx);
        return;
      case 'not':
        return condition(file, v as Condition, ctx);
    }
  };
  const conditions = (file: string, conds: Condition | Condition[] | undefined, ctx: string) => {
    if (conds) for (const x of Array.isArray(conds) ? conds : [conds]) condition(file, x, ctx);
  };
  const effects = (file: string, list: Effect[] | undefined, ctx: string) => {
    for (const e of list ?? []) {
      const key = soleKey(e);
      const v = (e as unknown as Record<string, unknown>)[key];
      if (UNSUPPORTED_EFFECTS.includes(key) || (key === 'recruit' && typeof v !== 'string'))
        err(file, `${ctx}: effect ${key} is not yet supported`);
      else if (key === 'setFlag') flag(file, v as string | Record<string, FlagValue>, ctx);
      else if (key === 'recruit' || key === 'leave') companion(file, v as string, ctx);
      else if (key === 'item') item(file, v as ItemRef, ctx);
      else if (key === 'material') for (const m of Object.keys(v as Record<string, number>)) if (!data.items[m]) err(file, `${ctx}: unknown material ${m}`);
    }
  };

  for (const c of Object.values(data.classes)) {
    if (c.skill && !data.skills[c.skill]) err('classes.yaml', `${c.id}: unknown skill ${c.skill}`);
  }
  for (const k of data.balance.economy.tavern.classes) {
    if (!data.classes[k.class]) err('balance.yaml', `tavern: unknown class ${k.class}`);
    for (const id of k.items) item('balance.yaml', { def: id }, `tavern ${k.class}`);
    conditions('balance.yaml', k.requires, `tavern ${k.class}.requires`);
  }
  for (const ch of Object.values(data.chars)) {
    if (!data.classes[ch.class]) err('units.yaml', `${ch.id}: unknown class ${ch.class}`);
    if (ch.personalSkill && !data.skills[ch.personalSkill]) err('units.yaml', `${ch.id}: unknown skill ${ch.personalSkill}`);
    ch.items.forEach((r) => item('units.yaml', r, ch.id));
  }
  for (const it of Object.values(data.items)) {
    if (it.grantsSkill && !data.skills[it.grantsSkill.skill]) err('items.yaml', `${it.id}: unknown skill ${it.grantsSkill.skill}`);
    if (it.setId && !data.sets[it.setId]) err('items.yaml', `${it.id}: unknown set ${it.setId}`);
    // every item (runes included) is shown as its painted image (concept/25-ux/DESIGN.md item-image, story 8.5)
    const image = it.image ?? it.id;
    if (itemImages && !itemImages.has(image)) err(it.kind === 'rune' ? 'runes.yaml' : 'items.yaml', `${it.id}: no image art/items/${image}.png`);
  }
  for (const s of Object.values(data.sets)) {
    for (const p of s.pieces) if (!data.items[p]) err('sets.yaml', `${s.id}: unknown piece ${p}`);
  }
  for (const map of Object.values(data.maps)) validateMap(data, map, err, item, dialogue, reward);
  const camp = data.campaign;
  if (camp) {
    for (const n of camp.nodes) {
      if (!data.maps[n.map]) err('campaign.yaml', `${n.id}: unknown map ${n.map}`);
      dialogue('campaign.yaml', n.pre, n.id);
      dialogue('campaign.yaml', n.post, n.id);
      for (const nx of n.next) if (!camp.nodes.some((x) => x.id === nx)) err('campaign.yaml', `${n.id}: unknown next ${nx}`);
      if (n.pos.some((v) => v < 0 || v > 100)) err('campaign.yaml', `${n.id}: pos must lie within 0-100 percent`);
    }
    if (camp.homePos.some((v) => v < 0 || v > 100)) err('campaign.yaml', 'homePos must lie within 0-100 percent');
    for (const m of camp.merchant) for (const id of m.items) if (!data.items[id]) err('campaign.yaml', `merchant: unknown item ${id}`);
    for (const [m, from] of Object.entries(camp.mechanics))
      if (!camp.nodes.some((n) => n.id === from) && !/^ch\d+$/.test(from)) err('campaign.yaml', `mechanics.${m}: unknown node ${from}`);
    for (const n of camp.nodes)
      for (const g of n.grants ?? []) {
        item('campaign.yaml', g.item, `${n.id} grants`);
        if (!data.chars[g.unit]) err('campaign.yaml', `${n.id} grants: unknown unit ${g.unit}`);
      }
    for (const r of Object.values(data.rooms)) conditions('rooms.yaml', r.requires, `${r.id}.requires`);
    // expectedLevel (GDD: army level per story mission) never falls within an act, neither in file order nor along `next`
    let top = 0;
    for (const n of camp.nodes) {
      if (n.expectedLevel < top) err('campaign.yaml', `${n.id}: expectedLevel ${n.expectedLevel} falls below ${top} of an earlier node`);
      top = Math.max(top, n.expectedLevel);
      for (const nx of n.next) {
        const to = camp.nodes.find((x) => x.id === nx);
        if (to && to.expectedLevel < n.expectedLevel) err('campaign.yaml', `${n.id}: next ${nx} has a lower expectedLevel (${to.expectedLevel} < ${n.expectedLevel})`);
      }
    }
    validateMechanics(data, err);
    for (const [k, v] of Object.entries(camp.supportDialogues))
      for (const d of Object.values(v)) dialogue('campaign.yaml', d, `support ${k}`);
  }
  // map triggers set flags of the register
  for (const map of Object.values(data.maps))
    for (const t of map.triggers)
      for (const a of t.then) if (a.action === 'set_flag') flag(`maps/${map.id}`, a.flag, `trigger ${t.id}`);
  // dialogue conditions, effects and keys
  for (const d of Object.values(data.dialogues)) {
    for (const l of d.lines) {
      if ('choice' in l) for (const ch of l.choice) effects(`dialogue/${d.id}`, ch.effects, ch.key);
      else conditions(`dialogue/${d.id}`, l.if, l.key);
      const keys = 'choice' in l ? l.choice.map((c) => c.key) : [l.key];
      for (const k of keys) for (const lang of ['de', 'en']) if (!locales[lang]?.[k]) err(`dialogue/${d.id}`, `missing ${lang} text ${k}`);
    }
  }
  // i18n: names of all content + parity between DE and EN
  const need: string[] = [];
  for (const c of Object.values(data.classes)) need.push(`class.${c.id}.name`);
  for (const i of Object.values(data.items)) need.push(`item.${i.id}.name`);
  for (const s of Object.values(data.skills)) need.push(`skill.${s.id}.name`, `skill.${s.id}.desc`);
  for (const a of Object.values(data.affixes)) need.push(`affix.${a.id}`);
  for (const t of Object.values(data.terrain)) need.push(`terrain.${t.id}`);
  for (const m of Object.values(data.maps)) need.push(m.nameKey);
  for (const ch of Object.values(data.chars)) need.push(`unit.${ch.id}.name`);
  need.push(...data.balance.economy.tavern.names);
  for (const r of Object.values(data.rooms)) need.push(`room.${r.id}.name`, `room.${r.id}.desc`);
  for (const n of camp?.nodes ?? []) need.push(n.titleKey);
  if (camp) need.push(`act.${camp.act}.name`, `act.${camp.act}.season`);
  for (const sc of camp?.scars ?? []) need.push(`scar.${sc.id}`);
  for (const k of need) for (const lang of ['de', 'en']) if (!locales[lang]?.[k]) err(`locales/${lang}`, `missing key ${k}`);
  const de = Object.keys(locales.de ?? {});
  const en = new Set(Object.keys(locales.en ?? {}));
  for (const k of de) if (!en.has(k)) err('locales/en', `missing key ${k} (present in de)`);
  for (const k of en) if (!(locales.de ?? {})[k]) err('locales/de', `missing key ${k} (present in en)`);
  if (spriteIds) {
    for (const m of Object.values(data.maps))
      for (const u of allUnits(m)) if (u.sprite && !spriteIds.has(u.sprite)) err(`maps/${m.id}`, `unknown sprite ${u.sprite}`);
  }
  return issues;
}

/**
 * Step-by-step introduction (concept/06 §10): before magic is introduced no map unit, starting character
 * or merchant tier may carry a tome, otherwise the player meets the mechanic before it is explained.
 */
function validateMechanics(data: GameData, err: (f: string, m: string) => void): void {
  const camp = data.campaign;
  const from = camp.mechanics.magic;
  if (!from) return;
  const order = camp.nodes.map((n) => n.id);
  const until = order.indexOf(from) < 0 ? order.length : order.indexOf(from);
  const magical = (r: ItemRef) => data.items[r.def]?.damageType === 'magical';
  for (const n of camp.nodes.slice(0, until)) {
    const map = data.maps[n.map];
    if (!map) continue;
    for (const u of allUnits(map))
      if (u.items.some(magical)) err(`maps/${map.id}`, `${u.id ?? u.class}: tome before magic is introduced (${from})`);
    for (const o of map.objects)
      for (const r of [o.reward?.item, o.contents?.item]) if (r && magical(r)) err(`maps/${map.id}`, `${o.id}: tome before ${from}`);
    for (const ch of Object.values(data.chars))
      if (ch.joins === n.id && ch.items.some(magical)) err('units.yaml', `${ch.id}: joins with a tome before ${from}`);
  }
  // the shop before node i sells the tiers of nodes < i
  const shopTier = Math.max(-1, ...camp.nodes.slice(0, Math.max(0, until - 1)).map((n) => n.merchantTier));
  for (const m of camp.merchant)
    if (m.tier <= shopTier)
      for (const id of m.items) if (data.items[id]?.damageType === 'magical') err('campaign.yaml', `merchant tier ${m.tier}: tome ${id} before ${from}`);
}

function allUnits(m: MapDef): MapUnitDef[] {
  return [
    ...m.units,
    ...m.reinforcements.flatMap((r) => r.units),
    ...m.triggers.flatMap((t) => t.then.flatMap((a) => (a.action === 'spawn' ? a.units : []))),
  ];
}

function validateMap(
  data: GameData,
  map: MapDef,
  err: (f: string, m: string) => void,
  item: (f: string, r: ItemRef | undefined, c: string) => void,
  dialogue: (f: string, id: string | undefined, c: string) => void,
  reward: (f: string, r: Reward | undefined, c: string) => void,
): void {
  const f = `maps/${map.id}`;
  const [w, h] = map.size;
  const rows = map.terrain.replace(/\r/g, '').split('\n').filter((r) => r.length > 0);
  if (rows.length !== h) err(f, `terrain has ${rows.length} rows, size says ${h}`);
  const grid: string[][] = [];
  rows.forEach((row, y) => {
    if (row.length !== w) err(f, `row ${y} has ${row.length} chars, size says ${w}`);
    const line: string[] = [];
    for (const ch of row) {
      const t = map.legend[ch];
      if (!t) err(f, `row ${y}: char '${ch}' not in legend`);
      else if (!data.terrain[t]) err(f, `legend '${ch}': unknown terrain ${t}`);
      line.push(t ?? 'plain');
    }
    grid.push(line);
  });
  const inside = (p: Pos) => p[0] >= 0 && p[1] >= 0 && p[0] < w && p[1] < h;
  const terr = (p: Pos) => data.terrain[grid[p[1]]?.[p[0]] ?? 'plain'];
  const checkUnit = (u: MapUnitDef, ctx: string) => {
    if (!data.classes[u.class]) err(f, `${ctx}: unknown class ${u.class}`);
    if (u.char && !data.chars[u.char]) err(f, `${ctx}: unknown char ${u.char}`);
    if (!inside(u.at)) err(f, `${ctx}: position ${u.at} out of bounds`);
    else {
      const mt = data.classes[u.class]?.moveType ?? 'foot';
      if (terr(u.at)?.cost[mt] === null) err(f, `${ctx}: placed on impassable ${terr(u.at)?.id}`);
    }
    u.items.forEach((r) => item(f, r, ctx));
    dialogue(f, u.quote, ctx);
    dialogue(f, u.recruit?.dialogue, ctx);
    for (const d of u.drops ?? []) if (d >= u.items.length) err(f, `${ctx}: drop index ${d} out of range`);
  };
  map.units.forEach((u, i) => checkUnit(u, u.id ?? `unit ${i}`));
  map.reinforcements.forEach((r, i) => r.units.forEach((u, j) => checkUnit(u, `reinforcement ${i}.${j}`)));
  if (map.deploy.slots.length < map.deploy.max) err(f, 'deploy.slots < deploy.max');
  for (const s of map.deploy.slots) if (!inside(s)) err(f, `deploy slot ${s} out of bounds`);
  for (const o of map.objects) {
    if (!inside(o.at)) err(f, `${o.id}: out of bounds`);
    reward(f, o.reward, o.id);
    reward(f, o.contents, o.id);
  }
  for (const t of map.triggers) for (const a of t.then) if (a.action === 'dialogue') dialogue(f, a.id, t.id);
  for (const s of map.objectives.side) reward(f, s.reward, s.id);
  // reachability of reach/seize/escape goals for a foot unit from the deploy area (ignoring units)
  const v = map.objectives.victory;
  const goalArea: Area | undefined = v.type === 'reach' || v.type === 'seize' || v.type === 'escape' ? v.area : undefined;
  if (goalArea && map.deploy.slots[0]) {
    const goals = new Set(areaTiles(goalArea).map((p) => `${p[0]},${p[1]}`));
    const seen = new Set<string>();
    const queue: Pos[] = [map.deploy.slots[0]];
    let found = false;
    while (queue.length && !found) {
      const p = queue.shift()!;
      const k = `${p[0]},${p[1]}`;
      if (seen.has(k) || !inside(p) || terr(p)?.cost.foot === null) continue;
      seen.add(k);
      if (goals.has(k)) found = true;
      queue.push([p[0] + 1, p[1]], [p[0] - 1, p[1]], [p[0], p[1] + 1], [p[0], p[1] - 1]);
    }
    if (!found) err(f, 'victory area not reachable on foot from the deploy area');
  }
}
