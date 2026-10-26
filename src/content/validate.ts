import { HOME_KINDS, MAX_PANEL_LINES, PERMANENT_COMPANIONS, type Area, type CampaignNodeDef, type Condition, type Effect, type FlagValue, type GameData, type ItemRef, type MapDef, type MapUnitDef, type Pos, type Reward } from '../core/defs';
import { flagEntry, UNSUPPORTED_EFFECTS } from '../core/campaign/effects';
import { decisionTitleKey, lineKey, memorialKey, optionKey, speakerTeam, summaryKey } from '../core/campaign/scene';
import { soleKey, UNSUPPORTED_CONDITIONS } from '../core/campaign/conditions';
import { nodeLinks } from '../core/campaign/graph';
import { pageTextKey, pageTitleKey } from '../core/campaign/chronicle';
import { memorialTexts } from '../core/campaign/memorial';
import { CORE_ROLES } from '../core/defs';
import { groupAllowed } from '../core/rules/items';
import { areaTiles, pairKey, posKey } from '../core/util';
import { hauntEnemyCount, hauntPlaces } from '../core/campaign/haunts';
import { standableTiles } from '../core/battle/hauntMap';
import { BARK_LINES } from './barkLines';
import { validateLieutenants, type LieutenantFiles } from './validateLieutenants';
import { validateStatusIcons, validateWeather } from './validateLook';
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
  /** ids of the status icons in art/status/source (content:check passes them) */
  statusImages?: Set<string>,
): ContentIssue[] {
  // the maps of haunts (`haunt~…`) are made at play time from a story map and are no content of their own
  if (Object.keys(data.maps).some((id) => id.startsWith('haunt~'))) data = { ...data, maps: Object.fromEntries(Object.entries(data.maps).filter(([id]) => !id.startsWith('haunt~'))) };
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
      if (UNSUPPORTED_EFFECTS.includes(key)) err(file, `${ctx}: effect ${key} is not yet supported`);
      else if (key === 'setFlag') flag(file, v as string | Record<string, FlagValue>, ctx);
      else if (key === 'recruit' && typeof v !== 'string') {
        // a lieutenant who changes sides (story 3.7): he must be able to (`joins`) and have a companion definition of his id
        const lt = (v as { lt: string }).lt;
        const def = data.lieutenants[lt];
        if (!def) err(file, `${ctx}: unknown lieutenant ${lt}`);
        else if (!def.joins) err(file, `${ctx}: lieutenant ${lt} does not join (lieutenants.yaml joins is not set)`);
        else if (!data.chars[lt]) err(file, `${ctx}: lieutenant ${lt} has no companion definition in units.yaml`);
      } else if (key === 'recruit' || key === 'leave') {
        companion(file, v as string, ctx);
        if (key === 'recruit' && data.lieutenants[v as string]) err(file, `${ctx}: ${v as string} is a lieutenant, recruit him with recruit: { lt: ${v as string} }`);
      }
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
  // Nebel (story 2.6): bonuses name roles that exist, blockers name terrain that exists
  for (const r of Object.keys(data.balance.fog.roleBonus)) if (!(CORE_ROLES as readonly string[]).includes(r)) err('balance.yaml', `fog.roleBonus: unknown role ${r}`);
  for (const t of data.balance.fog.blockers) if (!data.terrain[t]) err('balance.yaml', `fog.blockers: unknown terrain ${t}`);
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
  for (const map of Object.values(data.maps)) validateMap(data, map, err, item, battleDialogue, reward, locales);
  issues.push(...validateWeather(data), ...validateStatusIcons(data, statusImages));
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
    }
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
  validateHauntPools(data, locales, err, spriteIds);
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
    // illustration panels: a panel lasts until `panel: none`, the next panel or the end of the scene, at most MAX_PANEL_LINES text lines
    {
      let open: string | null = null;
      let count = 0;
      for (const l of sc.lines) {
        if ('choice' in l) continue;
        if (l.panel !== undefined) {
          open = l.panel === 'none' ? null : l.id;
          count = 0;
        }
        if (open) {
          count++;
          if (count === MAX_PANEL_LINES + 1) err(f, `${l.id}: the panel of line ${open} lasts longer than ${MAX_PANEL_LINES} text lines (end it with panel: none)`);
        }
        if (l.panel !== undefined && l.panel !== 'none' && placeImages && !placeImages.has(l.panel)) err(f, `${l.id}: panel: no place image art/mockups/locations-s1/${l.panel}.png`);
        if (bark && l.panel !== undefined) err(f, `${l.id}: a bark scene has no panel`);
      }
    }
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
  locales: Locales,
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
    // a door is terrain and object at once (story 2.6): it blocks the path and sight as `door` until opened
    if (o.type === 'door' && inside(o.at) && terr(o.at)?.id !== 'door') err(f, `${o.id}: a door object needs the terrain "door" on its tile`);
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
  if (v.type === 'escort') validateEscort(data, map, v, err, { inside, terr }, locales);
  if (v.type === 'treasure') validateTreasure(data, map, v, err, { inside, terr });
  validateHaunts(data, map, err, { inside, terr });
}

type Terr = { inside: (p: Pos) => boolean; terr: (p: Pos) => { id: string; cost: Record<string, number | null> } | undefined };

/**
 * The tiles a unit of move type `mt` can reach from `from`, ignoring units (story 4.8). A closed door counts as passable
 * (a scout or a key opens it); every other tile follows the move cost of the terrain.
 */
function walkable(from: Pos, mt: string, { inside, terr }: Terr): Set<string> {
  const seen = new Set<string>();
  const queue: Pos[] = [from];
  while (queue.length) {
    const p = queue.shift()!;
    const k = `${p[0]},${p[1]}`;
    if (seen.has(k) || !inside(p)) continue;
    const t = terr(p);
    if (!t || (t.cost[mt] === null && t.id !== 'door')) continue;
    seen.add(k);
    queue.push([p[0] + 1, p[1]], [p[0] - 1, p[1]], [p[0], p[1] + 1], [p[0], p[1] - 1]);
  }
  return seen;
}

/**
 * `escort` (story 4.8): the NPC is a map unit of team `other` with profile `follow`, starts outside the exit, can walk to the
 * exit with its own move type, and (unless `join: false`) is a character whose id is the unit id, so it can join afterwards.
 * The deploy area must reach the NPC on foot, or the company never gets close enough to wake it.
 */
function validateEscort(
  data: GameData,
  map: MapDef,
  v: Extract<MapDef['objectives']['victory'], { type: 'escort' }>,
  err: (f: string, m: string) => void,
  g: Terr,
  locales: Locales,
): void {
  const f = `maps/${map.id}`;
  const npc = allUnits(map).find((u) => u.id === v.unit);
  if (!npc) return err(f, `escort: unit ${v.unit} not on the map`);
  if (npc.team !== 'other') err(f, `escort: ${v.unit} must be team other`);
  if (npc.ai?.profile !== 'follow') err(f, `escort: ${v.unit} needs the AI profile follow`);
  if (v.join !== false && !data.chars[v.unit]) err(f, `escort: ${v.unit} joins afterwards, so it needs a character of the same id (or join: false)`);
  // the goal sentence and the defeat line name the NPC (`unit.<id>.name`)
  for (const lang of ['de', 'en']) if (!locales[lang]?.[`unit.${v.unit}.name`]) err(f, `escort: missing locale key unit.${v.unit}.name in ${lang}`);
  const exit = areaTiles(v.area);
  if (!exit.length || exit.some((p) => !g.inside(p))) err(f, 'escort: exit area empty or out of bounds');
  if (exit.some((p) => p[0] === npc.at[0] && p[1] === npc.at[1])) err(f, `escort: ${v.unit} starts on the exit`);
  const reach = walkable(npc.at, data.classes[npc.class]?.moveType ?? 'foot', g);
  if (!exit.some((p) => reach.has(`${p[0]},${p[1]}`))) err(f, `escort: the exit is not reachable by ${v.unit} from its start`);
  for (const s of map.deploy.slots) {
    if (!walkable(s, 'foot', g).has(`${npc.at[0]},${npc.at[1]}`)) err(f, `escort: ${v.unit} not reachable on foot from deploy slot ${s}`);
  }
}

/**
 * `treasure` (story 4.8): the chests are distinct chest objects of the map, each reachable on foot from every deploy slot
 * (doors count as passable), and the company can open them: the map brings an opener along, that is a player unit of the
 * map, a forced deploy character, or an item a village hands out that is a scout (class action `open_steal`) or carries a
 * key (an item whose `use.open` lists `chest`). The roster of the company is not known here, so a map that relies on a
 * scout or key from the roster must still bring one itself.
 */
function validateTreasure(
  data: GameData,
  map: MapDef,
  v: Extract<MapDef['objectives']['victory'], { type: 'treasure' }>,
  err: (f: string, m: string) => void,
  g: Terr,
): void {
  const f = `maps/${map.id}`;
  if (new Set(v.chests).size !== v.chests.length) err(f, 'treasure: chest listed twice');
  const reach = map.deploy.slots.map((s) => walkable(s, 'foot', g));
  for (const id of v.chests) {
    const o = map.objects.find((x) => x.id === id);
    if (!o || o.type !== 'chest') {
      err(f, `treasure: ${id} is no chest of the map`);
      continue;
    }
    reach.forEach((r, i) => {
      if (!r.has(`${o.at[0]},${o.at[1]}`)) err(f, `treasure: chest ${id} not reachable on foot from deploy slot ${map.deploy.slots[i]}`);
    });
  }
  const key = (refs: ItemRef[]) => refs.some((r) => data.items[r.def]?.use?.open?.includes('chest'));
  const scout = (cls: string) => data.classes[cls]?.classAction?.id === 'open_steal';
  const opener =
    map.units.some((u) => u.team === 'player' && (scout(u.class) || key(u.items))) ||
    map.deploy.forced.some((id) => {
      const c = data.chars[id];
      return !!c && (scout(c.class) || key(c.items));
    }) ||
    map.objects.some((o) => o.type === 'village' && o.reward?.item && key([o.reward.item]));
  if (!opener) err(f, 'treasure: no scout or key available (a player unit, a forced character or a village reward must bring one)');
}

/**
 * Haunt anchors of a map (story 5.5, architecture §5.6): at most one per variant; the fields lie on the map and can be
 * stood on; target and chests are no deploy or spawn field; enough deploy fields for the places and enough spawn fields for the
 * foes of the hardest difficulty (places + extraEnemies + 1); and the company can walk from every deploy field to the target,
 * every chest, or an exit (a closed door counts as passable, as for `treasure`).
 */
function validateHaunts(data: GameData, map: MapDef, err: (f: string, m: string) => void, g: Terr): void {
  const f = `maps/${map.id}`;
  const seen = new Set<string>();
  const pool = data.hauntPools?.[map.act];
  for (const a of map.haunts ?? []) {
    const ctx = `haunts ${a.variant}`;
    if (seen.has(a.variant)) err(f, `${ctx}: listed twice (one anchor per variant)`);
    seen.add(a.variant);
    const places = hauntPlaces(map, a);
    const onMap = (area: Area, what: string): boolean => {
      const tiles = areaTiles(area);
      if (!tiles.length || tiles.some((p) => !g.inside(p))) {
        err(f, `${ctx}: ${what} empty or out of bounds`);
        return false;
      }
      return true;
    };
    const deployOk = onMap(a.deploy, 'deploy');
    const spawnOk = onMap(a.enemySpawn, 'enemySpawn');
    const deployTiles = deployOk ? standableTiles(data, map, a.deploy, 'foot') : [];
    if (deployOk && deployTiles.length < places) err(f, `${ctx}: ${deployTiles.length} deploy fields for ${places} places`);
    const spawnNeed = hauntEnemyCount(data, places, 'hard');
    if (spawnOk && standableTiles(data, map, a.enemySpawn, 'foot').length < spawnNeed)
      err(f, `${ctx}: ${standableTiles(data, map, a.enemySpawn, 'foot').length} spawn fields for ${spawnNeed} foes on hard`);
    const keys = (area: Area) => new Set(areaTiles(area).map(posKey));
    const dk = keys(a.deploy);
    const sk = keys(a.enemySpawn);
    if (deployOk && spawnOk && [...dk].some((k) => sk.has(k))) err(f, `${ctx}: deploy and enemySpawn overlap`);
    // goals: the target, every chest, and an exit tile (any one of them will do)
    const goals: Array<[string, Pos[]]> = [['target', [a.target.at]]];
    if (a.chests) {
      if (new Set(a.chests.map(posKey)).size !== a.chests.length) err(f, `${ctx}: a chest is listed twice`);
      a.chests.forEach((p, i) => goals.push([`chest ${i}`, [p]]));
    }
    const exitTiles = a.exit && onMap(a.exit, 'exit') ? areaTiles(a.exit) : [];
    if (exitTiles.length) {
      if (exitTiles.some((p) => p[0] === a.target.at[0] && p[1] === a.target.at[1])) err(f, `${ctx}: the civilian starts on the exit`);
      goals.push(['exit', exitTiles]);
    }
    for (const [what, tiles] of goals) {
      if (what === 'exit') continue;
      for (const p of tiles) {
        if (!g.inside(p)) err(f, `${ctx}: ${what} ${p} out of bounds`);
        else if (dk.has(posKey(p)) || sk.has(posKey(p))) err(f, `${ctx}: ${what} ${p} lies in deploy or enemySpawn`);
        else if (!standableTiles(data, map, { tiles: [p] }, 'foot').length) err(f, `${ctx}: ${what} ${p} is no tile to stand on (impassable or an object)`);
      }
    }
    // reachability on foot (ignoring units) from every deploy field
    for (const d of deployTiles) {
      const reach = walkable(d, 'foot', g);
      for (const [what, tiles] of goals) if (!tiles.some((p) => reach.has(posKey(p)))) err(f, `${ctx}: ${what} not reachable on foot from deploy field ${d}`);
    }
    // the civilian of an escort must reach the exit with its own move type
    if (a.variant === 'escort' && pool && exitTiles.length) {
      const reach = walkable(a.target.at, data.classes[pool.civilian.class]?.moveType ?? 'foot', g);
      if (!exitTiles.some((p) => reach.has(posKey(p)))) err(f, `${ctx}: the exit is not reachable by the civilian from its start`);
    }
  }
}

/** The haunt pools of the acts (story 5.5): classes, items, sprites, names; shares add up to 100; every faction of a lieutenant has a pool. */
function validateHauntPools(data: GameData, locales: Locales, err: (f: string, m: string) => void, spriteIds?: Set<string>): void {
  const f = 'haunts.yaml';
  const itemOk = (ctx: string, ref: ItemRef) => {
    if (!data.items[ref.def]) err(f, `${ctx}: unknown item ${ref.def}`);
  };
  const nameOk = (ctx: string, key: string) => {
    for (const lang of ['de', 'en']) if (!locales[lang]?.[key]) err(`locales/${lang}`, `${ctx}: missing key ${key}`);
  };
  const spriteOk = (ctx: string, id: string | undefined) => {
    if (spriteIds && id && !spriteIds.has(id)) err(f, `${ctx}: unknown sprite ${id}`);
  };
  for (const [act, pools] of Object.entries(data.hauntPools ?? {})) {
    for (const [faction, types] of Object.entries(pools.factions)) {
      const ctx = `act ${act} ${faction}`;
      const total = types.reduce((a, t) => a + t.share, 0);
      if (total !== 100) err(f, `${ctx}: shares add up to ${total}, expected 100`);
      for (const t of types) {
        if (!data.classes[t.class]) err(f, `${ctx}: unknown class ${t.class}`);
        t.items.forEach((r) => itemOk(`${ctx} ${t.class}`, r));
        spriteOk(`${ctx} ${t.class}`, t.sprite);
        nameOk(`${ctx} ${t.class}`, t.nameKey);
      }
    }
    const civ = pools.civilian;
    if (!data.classes[civ.class]) err(f, `act ${act} civilian: unknown class ${civ.class}`);
    spriteOk(`act ${act} civilian`, civ.sprite);
    nameOk(`act ${act} civilian`, civ.nameKey);
    // the goal text of defend and escort names the civilian by the unit id (`unit.civilian.name`)
    nameOk(`act ${act} civilian`, 'unit.civilian.name');
    for (const loot of pools.chestLoot) if (loot.item) itemOk(`act ${act} chestLoot`, loot.item);
  }
  // every faction of a lieutenant has a pool in the act of the lieutenant
  for (const lt of Object.values(data.lieutenants ?? {})) {
    if (!data.hauntPools?.[lt.act]?.factions[lt.faction]) err(f, `${lt.id}: no haunt pool for faction ${lt.faction} in act ${lt.act}`);
  }
  // a map with anchors belongs to an act that has pools (the civilian of defend and escort)
  for (const m of Object.values(data.maps)) if (m.haunts?.length && !data.hauntPools?.[m.act]) err(`maps/${m.id}`, `haunts: act ${m.act} has no haunts.yaml`);
  // the haunt material of an act is the bounty material of the act's lieutenants (checked by validateLieutenants)
}
