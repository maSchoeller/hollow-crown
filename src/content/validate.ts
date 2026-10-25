import { HOME_KINDS, PERMANENT_COMPANIONS, type Area, type CampaignNodeDef, type Condition, type Effect, type FlagValue, type GameData, type ItemRef, type MapDef, type MapUnitDef, type Pos, type Reward } from '../core/defs';
import { flagEntry, UNSUPPORTED_EFFECTS } from '../core/campaign/effects';
import { decisionTitleKey, lineKey, memorialKey, optionKey, speakerTeam, summaryKey } from '../core/campaign/scene';
import { soleKey, UNSUPPORTED_CONDITIONS } from '../core/campaign/conditions';
import { nodeLinks } from '../core/campaign/graph';
import { pageTextKey, pageTitleKey } from '../core/campaign/chronicle';
import { memorialTexts } from '../core/campaign/memorial';
import { CORE_ROLES } from '../core/defs';
import { groupAllowed } from '../core/rules/items';
import { areaTiles, pairKey } from '../core/util';
import { BARK_LINES } from './barkLines';
import { validateLieutenants, type LieutenantFiles } from './validateLieutenants';
import type { ContentIssue, Locales } from './load';

/** Cross-reference checks that Zod cannot express (concept/11 §2 Validierung, §9). */
export function validateContent(
  data: GameData,
  locales: Locales,
  spriteIds?: Set<string>,
  /** ids of the painted images in art/items (content:check passes them); every item needs one */
  itemImages?: Set<string>,
  /** ids of the place images (art/mockups/locations-s1, source files; content:check passes them): every `place` and scene `background` must have one */
  placeImages?: Set<string>,
  /** portraits and figure models of the lieutenants (content:check passes them; a missing file is a warning) */
  lieutenantFiles?: LieutenantFiles,
): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const err = (file: string, message: string) => issues.push({ file, message });
  const item = (file: string, ref: ItemRef | undefined, ctx: string) => {
    if (ref && !data.items[ref.def]) err(file, `${ctx}: unknown item ${ref.def}`);
    for (const a of ref?.affixes ?? []) if (!data.affixes[a]) err(file, `${ctx}: unknown affix ${a}`);
    for (const r of ref?.runes ?? []) if (!data.runes[r]) err(file, `${ctx}: unknown rune ${r}`);
  };
  /** scenes that play during a battle (triggers, quotes, talks, rewards): they must not ask for answers */
  const battleScenes = new Set<string>();
  const dialogue = (file: string, id: string | undefined, ctx: string) => {
    if (id && !data.scenes[id]) err(file, `${ctx}: unknown scene ${id}`);
  };
  const battleDialogue = (file: string, id: string | undefined, ctx: string) => {
    if (id) battleScenes.add(id);
    dialogue(file, id, ctx);
  };
  const reward = (file: string, r: Reward | undefined, ctx: string) => {
    if (!r) return;
    item(file, r.item, ctx);
    battleDialogue(file, r.dialogue, ctx);
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
  const page = (file: string, id: string, ctx: string) => {
    if (!data.chronicle[id]) err(file, `${ctx}: unknown chronicle page ${id} (acts/*/chronicle.yaml)`);
  };
  const companion = (file: string, id: string, ctx: string) => {
    if (!data.chars[id]) err(file, `${ctx}: unknown companion ${id}`);
  };
  /** The flat world map (story 5.2): regions with their names, every node and the home placed once, spacing of the places. */
  const worldChecks = (camp: GameData['campaign']): void => {
    const w = data.world;
    const f = 'world/valmora.yaml';
    if (!w) return;
    const acts = new Set(w.regions.map((r) => r.act));
    for (const r of w.regions) for (const lang of ['de', 'en']) if (!locales[lang]?.[`world.region.${r.id}`]) err(`locales/${lang}`, `missing key world.region.${r.id}`);
    for (const e of w.fog) if (!acts.has(e.act)) err(f, `fog: no region for act ${e.act}`);
    const seen = new Set<string>();
    const bound = new Set<string>();
    let homes = 0;
    for (const p of w.places) {
      if (seen.has(p.id)) err(f, `${p.id}: placed twice`);
      seen.add(p.id);
      if (!acts.has(p.act)) err(f, `${p.id}: no region for act ${p.act}`);
      if (p.kind === 'home') homes++;
      if (p.node) {
        if (!camp.nodes.some((n) => n.id === p.node)) err(f, `${p.id}: unknown node ${p.node}`);
        if (bound.has(p.node)) err(f, `node ${p.node} is placed twice`);
        bound.add(p.node);
        if (p.kind === 'home') err(f, `${p.id}: the home has no node`);
      }
    }
    for (const n of camp.nodes) if (!bound.has(n.id)) err(f, `node ${n.id} has no place on the world map`);
    if (homes !== 1) err(f, `${homes} home places, expected 1`);
    // stones must not touch: at least 90 px apart in the picture
    const [pw, ph] = w.size;
    for (const [i, a] of w.places.entries())
      for (const b of w.places.slice(i + 1))
        if (Math.hypot(((a.at[0] - b.at[0]) * pw) / 100, ((a.at[1] - b.at[1]) * ph) / 100) < 90) err(f, `${a.id} and ${b.id} are less than 90 px apart`);
  };
  /** Picture and room anchors of the homes (story 6.9): the image exists, every anchor names a room of that home, once. */
  const homeChecks = (): void => {
    const f = 'home/home.yaml';
    for (const kind of HOME_KINDS) {
      const view = data.home?.[kind];
      if (!view) continue;
      if (placeImages && !placeImages.has(view.image)) err(f, `${kind}: no place image art/mockups/locations-s1/${view.image}.png`);
      const seen = new Set<string>();
      for (const a of view.anchors) {
        const room = data.rooms[a.room];
        if (!room) err(f, `${kind}: anchor for unknown room ${a.room}`);
        else if (!room.homes.includes(kind)) err(f, `${kind}: room ${a.room} does not belong to this home`);
        if (seen.has(a.room)) err(f, `${kind}: room ${a.room} is anchored twice`);
        seen.add(a.room);
      }
    }
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
        if (!data.supports[pairKey(a, b)]) err(file, `${ctx}: unknown support pair ${a}|${b}`);
        return;
      }
      case 'met':
        if (!data.lieutenants[v as string]) err(file, `${ctx}: unknown lieutenant ${v as string}`);
        return;
      case 'chronicle':
        if (Array.isArray(v)) for (const id of v as string[]) page(file, id, ctx);
        return;
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
  /** an effect that only colours the story: stance points and flags of kind `story` */
  const mereFlavour = (e: Effect) => {
    const key = soleKey(e);
    if (key === 'stance') return true;
    if (key !== 'setFlag') return false;
    return data.flags[flagEntry((e as { setFlag: string | Record<string, FlagValue> }).setFlag)[0]]?.kind === 'story';
  };
  /** side quests some effect opens (`openQuest`) */
  const openedQuests: string[] = [];
  const effects = (file: string, list: Effect[] | undefined, ctx: string) => {
    for (const e of list ?? []) {
      const key = soleKey(e);
      const v = (e as unknown as Record<string, unknown>)[key];
      if (UNSUPPORTED_EFFECTS.includes(key) || (key === 'recruit' && typeof v !== 'string'))
        err(file, `${ctx}: effect ${key} is not yet supported`);
      else if (key === 'setFlag') flag(file, v as string | Record<string, FlagValue>, ctx);
      else if (key === 'recruit' || key === 'leave') companion(file, v as string, ctx);
      else if (key === 'grudge') {
        if (!data.lieutenants[(v as { lt: string }).lt]) err(file, `${ctx}: unknown lieutenant ${(v as { lt: string }).lt}`);
      } else if (key === 'item') item(file, v as ItemRef, ctx);
      else if (key === 'chronicle') page(file, v as string, ctx);
      else if (key === 'openQuest') {
        openedQuests.push(v as string);
        if (data.campaign?.nodes.find((n) => n.id === v)?.kind !== 'side') err(file, `${ctx}: openQuest ${v as string} is not a side quest`);
      }
      else if (key === 'material') for (const m of Object.keys(v as Record<string, number>)) if (!data.items[m]) err(file, `${ctx}: unknown material ${m}`);
    }
  };

  for (const c of Object.values(data.classes)) {
    if (c.skill && !data.skills[c.skill]) err('classes.yaml', `${c.id}: unknown skill ${c.skill}`);
    if (c.tier === 'pro') {
      const base = data.classes[c.role];
      if (!base || base.tier !== 'base' || !base.proPaths.includes(c.id)) err('classes.yaml', `${c.id}: pro class must be a proPath of its base role ${c.role}`);
    }
    if (c.tier !== 'pro') {
      for (const p of c.proPaths) {
        const target = data.classes[p];
        if (target && (target.tier !== 'pro' || target.role !== c.role)) err('classes.yaml', `${c.id}: proPath ${p} is not a pro class of this role`);
      }
    }
    if (c.playable && !c.classAction) err('classes.yaml', `${c.id}: a playable class needs a classAction`);
  }
  for (const r of CORE_ROLES) {
    const c = data.classes[r];
    if (!c || c.role !== r || c.tier === 'pro') err('classes.yaml', `missing role ${r}`);
  }
  for (const it of Object.values(data.items)) {
    // weapons, tomes, staves and shields carry a weapon group (items.md section 4)
    if (['weapon', 'tome', 'staff', 'shield'].includes(it.kind) && !it.group) err('items.yaml', `${it.id}: no weapon group`);
  }
  for (const k of data.balance.economy.tavern.classes) {
    if (!data.classes[k.class]) err('balance.yaml', `tavern: unknown class ${k.class}`);
    for (const id of k.items) item('balance.yaml', { def: id }, `tavern ${k.class}`);
    conditions('balance.yaml', k.requires, `tavern ${k.class}.requires`);
  }
  for (const ch of Object.values(data.chars)) {
    if (!data.classes[ch.class]) err('units.yaml', `${ch.id}: unknown class ${ch.class}`);
    // chapters that are not built yet (ch03 ff.) may name scenes that are still to be written
    if (ch.recruit && data.campaign?.nodes.some((n) => n.id === ch.recruit!.chapter)) battleDialogue('units.yaml', ch.recruit.dialogue, `${ch.id} recruit.dialogue`);
    if (ch.personalSkill && !data.skills[ch.personalSkill]) err('units.yaml', `${ch.id}: unknown skill ${ch.personalSkill}`);
    ch.items.forEach((r) => {
      item('units.yaml', r, ch.id);
      const d = data.items[r.def];
      const cls = data.classes[ch.class];
      if (d && cls && !groupAllowed(cls, d)) err('units.yaml', `${ch.id}: ${cls.id} cannot carry ${d.id} (group ${d.group})`);
    });
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
  for (const map of Object.values(data.maps)) validateMap(data, map, err, item, battleDialogue, reward);
  const camp = data.campaign;
  if (camp) {
    const place = (id: string, ctx: string) => {
      if (placeImages && !placeImages.has(id)) err('campaign.yaml', `${ctx}: no place image art/mockups/locations-s1/${id}.png`);
    };
    place(camp.defaultPlace, 'defaultPlace');
    for (const n of camp.nodes) {
      if (n.place) place(n.place, `${n.id} place`);
      if (!data.maps[n.map]) err('campaign.yaml', `${n.id}: unknown map ${n.map}`);
      dialogue('campaign.yaml', n.pre, n.id);
      dialogue('campaign.yaml', n.post, n.id);
      conditions('campaign.yaml', n.requires, `${n.id}.requires`);
      if (n.memorialIf) {
        conditions('campaign.yaml', n.memorialIf, `${n.id}.memorialIf`);
        if (n.kind !== 'side') err('campaign.yaml', `${n.id}: memorialIf belongs to side quests`);
        if (!n.memorial?.pre && !n.memorial?.post) err('campaign.yaml', `${n.id}: memorialIf needs a memorial scene (memorial.pre or memorial.post)`);
      } else if (n.memorial) err('campaign.yaml', `${n.id}: memorial scenes need memorialIf`);
      dialogue('campaign.yaml', n.memorial?.pre, `${n.id} memorial`);
      dialogue('campaign.yaml', n.memorial?.post, `${n.id} memorial`);
      if (n.fixed && n.kind !== 'story') err('campaign.yaml', `${n.id}: only story nodes can be fixed`);
      if (n.fixed === 'first' && n.requires?.length) err('campaign.yaml', `${n.id}: the fixed first node has no requires`);
      if (n.pos.some((v) => v < 0 || v > 100)) err('campaign.yaml', `${n.id}: pos must lie within 0-100 percent`);
    }
    if (camp.homePos.some((v) => v < 0 || v > 100)) err('campaign.yaml', 'homePos must lie within 0-100 percent');
    for (const m of camp.merchant) for (const id of m.items) if (!data.items[id]) err('campaign.yaml', `merchant: unknown item ${id}`);
    const firsts = camp.nodes.filter((n) => n.fixed === 'first');
    if (firsts.length !== 1) err('campaign.yaml', `exactly one node must be fixed: first (found ${firsts.length})`);
    if (camp.nodes.filter((n) => n.fixed === 'finale').length > 1) err('campaign.yaml', 'at most one node can be fixed: finale');
    for (const n of camp.nodes)
      for (const g of n.grants ?? []) {
        item('campaign.yaml', g.item, `${n.id} grants`);
        if (!data.chars[g.unit]) err('campaign.yaml', `${n.id} grants: unknown unit ${g.unit}`);
      }
    for (const n of camp.nodes) effects('campaign.yaml', n.effects, `${n.id} effects`);
    for (const r of Object.values(data.rooms)) {
      conditions('rooms.yaml', r.requires, `${r.id}.requires`);
      r.levels.forEach((l, i) => conditions('rooms.yaml', l.requires, `${r.id}.levels[${i}].requires`));
      for (const u of r.unlocks) conditions('rooms.yaml', u.requires, `${r.id}.unlocks.${u.id}.requires`);
    }
    homeChecks();
    for (const m of Object.values(data.memorials)) conditions('memorials.yaml', m.requires, `${m.id}.requires`);
    worldChecks(camp);
    // expectedLevel (GDD: army level per story mission) never falls within an act, neither in file order of the story
    // nodes nor along a `completed` requirement
    let top = 0;
    for (const n of camp.nodes) {
      if (n.kind !== 'story') continue;
      if (n.expectedLevel < top) err('campaign.yaml', `${n.id}: expectedLevel ${n.expectedLevel} falls below ${top} of an earlier node`);
      top = Math.max(top, n.expectedLevel);
    }
    for (const [from, to] of nodeLinks(data)) {
      const a = camp.nodes.find((x) => x.id === from);
      const b = camp.nodes.find((x) => x.id === to);
      if (a && b && a.kind === 'story' && b.expectedLevel < a.expectedLevel) err('campaign.yaml', `${to}: lower expectedLevel than ${from} it requires (${b.expectedLevel} < ${a.expectedLevel})`);
    }
    validateMechanics(data, err);
  }
  // fixed support pairs (story 4.9): known companions, S only for core pairs, as many as the season has
  {
    const pairs = Object.values(data.supports);
    for (const p of pairs) {
      for (const id of p.pair) companion('supports.yaml', id, `pair ${p.key}`);
      if (p.pair[0] === p.pair[1]) err('supports.yaml', `pair ${p.key}: a companion cannot be its own partner`);
      if (p.talks.S && !p.core) err('supports.yaml', `pair ${p.key}: only core pairs reach S`);
      for (const [rank, id] of Object.entries(p.talks)) dialogue('supports.yaml', id, `pair ${p.key} talk ${rank}`);
    }
    const s = data.balance.supports;
    if (pairs.length > s.seasonPairs) err('supports.yaml', `${pairs.length} support pairs, the season has ${s.seasonPairs}`);
    if (pairs.filter((p) => p.core).length > s.corePairs) err('supports.yaml', `${pairs.filter((p) => p.core).length} core pairs, the season has ${s.corePairs}`);
  }
  validateLieutenants(data, locales, err, lieutenantFiles);
  // map triggers set flags of the register
  for (const map of Object.values(data.maps))
    for (const t of map.triggers)
      for (const a of t.then) if (a.action === 'set_flag') flag(`maps/${map.id}`, a.flag, `trigger ${t.id}`);
  // scenes (architecture §5.8): speaker chains, conditions, effects, texts in both languages, box length
  const MAX_BOX = 110;
  // enemies and lieutenants cannot die for good in the story sense, so their chains need no fallback (decision 2026-10-24)
  const isEnemy = (id: string) => speakerTeam(data, id) === 'enemy' || !!data.chars[id]?.flags.includes('enemy');
  const chain = (f: string, c: readonly string[], ctx: string, mustEnd: boolean) => {
    for (const id of c) if (!data.chars[id] && !locales.de?.[`unit.${id}.name`]) err(f, `${ctx}: unknown speaker ${id}`);
    if (mustEnd && !c.every(isEnemy) && !PERMANENT_COMPANIONS.includes(c[c.length - 1]!)) err(f, `${ctx}: speaker chain must end with avatar or kael (or the line needs fallback: skip)`);
  };
  const text = (f: string, key: string, de: string, ctx: string) => {
    if (de.length > MAX_BOX) err(f, `${ctx}: de text longer than ${MAX_BOX} characters (${de.length})`);
    const en = locales.en?.[key];
    if (!en) err(f, `${ctx}: missing en text ${key}`);
    else if (en.length > MAX_BOX) err(f, `${ctx}: en text longer than ${MAX_BOX} characters (${en.length})`);
  };
  for (const sc of Object.values(data.scenes)) {
    const f = `scenes/${sc.id}`;
    // the dialogue backdrop is a place image (story 8.7)
    if (sc.background && placeImages && !placeImages.has(sc.background)) err(f, `background: no place image art/mockups/locations-s1/${sc.background}.png`);
    const seen = new Set<string>();
    // barks (story 9.13): only the six moments, one bubble page each in both languages
    const bark = sc.id.startsWith('scn.bark.');
    for (const l of sc.lines) {
      const ctx = `${l.id}`;
      if (seen.has(l.id)) err(f, `${ctx}: duplicate line id`);
      seen.add(l.id);
      conditions(f, l.requires, ctx);
      if ('choice' in l) {
        if (battleScenes.has(sc.id)) err(f, `${ctx}: scenes shown in a battle cannot have answers`);
        if (bark) err(f, `${ctx}: a bark scene has no answers`);
        const ids = new Set<string>();
        for (const o of l.choice) {
          if (ids.has(o.id)) err(f, `${ctx}: duplicate answer id ${o.id}`);
          if (o.id === 'title') err(f, `${ctx}: answer id title is reserved for the decision title`);
          ids.add(o.id);
          effects(f, o.effects, `${ctx}.${o.id}`);
          text(f, optionKey(sc.id, l.id, o.id), o.text, `${ctx}.${o.id}`);
          // only the decisions have mechanical consequences (narrative): anything beyond stance and story flags needs a title
          if (!l.title && (o.effects ?? []).some((e) => !mereFlavour(e))) err(f, `${ctx}.${o.id}: an answer with consequences belongs to a decision (title)`);
          if (o.summary && !l.title) err(f, `${ctx}.${o.id}: summary belongs to a decision (title)`);
          if (l.title) {
            if (!o.summary) err(f, `${ctx}.${o.id}: a decision answer needs a summary (consequence card title)`);
            else text(f, summaryKey(sc.id, l.id, o.id), o.summary, `${ctx}.${o.id}.summary`);
          }
        }
        if (l.title) text(f, decisionTitleKey(sc.id, l.id), l.title, `${ctx}.title`);
        continue;
      }
      if (l.speaker) chain(f, l.speaker, ctx, l.fallback !== 'skip');
      else if (l.memorial) err(f, `${ctx}: a memorial line needs a speaker chain`);
      if (bark) {
        const who = sc.id.slice('scn.bark.'.length);
        if (!data.chars[who] && !locales.de?.[`unit.${who}.name`]) err(f, `${ctx}: bark scene for unknown character ${who}`);
        if (l.speaker?.length !== 1 || l.speaker[0] !== who) err(f, `${ctx}: bark speaker chain must be exactly [${who}]`);
        if (!(BARK_LINES as readonly string[]).includes(l.id)) err(f, `${ctx}: bark line id must be one of ${BARK_LINES.join(', ')}`);
        const max = data.balance.scene.bubbleMaxChars;
        const en = locales.en?.[lineKey(sc.id, l.id)];
        if (l.text.length > max) err(f, `${ctx}: de bark longer than ${max} characters (${l.text.length})`);
        if (en && en.length > max) err(f, `${ctx}: en bark longer than ${max} characters (${en.length})`);
      }
      text(f, lineKey(sc.id, l.id), l.text, ctx);
      if (l.memorial) {
        chain(f, l.memorial.speaker, `${ctx}.memorial`, true);
        text(f, memorialKey(sc.id, l.id), l.memorial.text, `${ctx}.memorial`);
      }
    }
  }
  // a side quest opens through its own requires or an openQuest somewhere in the content
  for (const n of camp?.nodes ?? [])
    if (n.kind === 'side' && !n.requires?.length && !openedQuests.includes(n.id)) err('campaign.yaml', `${n.id}: side quest without requires that no openQuest opens`);
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
  for (const r of Object.values(data.rooms)) need.push(`room.${r.id}.name`, `room.${r.id}.desc`, ...r.unlocks.map((u) => `room.${r.id}.unlock.${u.id}`));
  for (const m of Object.values(data.memorials)) need.push(...Object.keys(memorialTexts(m)));
  for (const k of HOME_KINDS) need.push(`home.${k}.name`, `home.${k}.title`);
  for (const n of camp?.nodes ?? []) need.push(n.titleKey);
  if (camp) need.push(`act.${camp.act}.name`, `act.${camp.act}.season`);
  for (const sc of camp?.scars ?? []) need.push(`scar.${sc.id}`);
  // chronicle pages: English texts, and no more pages than the season has (narrative: 12)
  for (const p of Object.values(data.chronicle)) need.push(pageTitleKey(p.id), pageTextKey(p.id));
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
  if (from === undefined) return;
  const magical = (r: ItemRef) => data.items[r.def]?.damageType === 'magical';
  const early = camp.nodes.filter((n) => minStoryCount(data, n) < from);
  for (const n of early) {
    const map = data.maps[n.map];
    if (!map) continue;
    for (const u of allUnits(map))
      if (u.items.some(magical)) err(`maps/${map.id}`, `${u.id ?? u.class}: tome before magic is introduced (${from} story missions)`);
    for (const o of map.objects)
      for (const r of [o.reward?.item, o.contents?.item]) if (r && magical(r)) err(`maps/${map.id}`, `${o.id}: tome before magic (${from} story missions)`);
    for (const ch of Object.values(data.chars))
      if (ch.joins === n.id && ch.items.some(magical)) err('units.yaml', `${ch.id}: joins with a tome before magic (${from} story missions)`);
  }
  // the shop sells the tiers of completed nodes: those that can be done while a magic-less mission still lies ahead
  const shopTier = Math.max(-1, ...early.filter((n) => n.kind === 'story' && minStoryCount(data, n) + 1 < from).map((n) => n.merchantTier));
  for (const m of camp.merchant)
    if (m.tier <= shopTier)
      for (const id of m.items) if (data.items[id]?.damageType === 'magical') err('campaign.yaml', `merchant tier ${m.tier}: tome ${id} before magic (${from} story missions)`);
}

/**
 * The fewest completed story missions of the act a node can start with: 0 for the fixed first node, all others for the
 * finale, else the story nodes its `completed` requirements need (transitively).
 */
export function minStoryCount(data: GameData, node: CampaignNodeDef): number {
  const nodes = data.campaign.nodes;
  if (node.fixed === 'first') return 0;
  if (node.fixed === 'finale') return nodes.filter((n) => n.kind === 'story' && n.id !== node.id).length;
  const need = new Set<string>();
  const walk = (n: CampaignNodeDef) => {
    for (const r of n.requires ?? []) {
      if (!('completed' in r) || need.has(r.completed)) continue;
      need.add(r.completed);
      const dep = nodes.find((x) => x.id === r.completed);
      if (dep) walk(dep);
    }
  };
  walk(node);
  return nodes.filter((n) => n.kind === 'story' && need.has(n.id)).length;
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
