import { HOME_KINDS } from '../core/defs';
import type { ItemRef } from '../core/defs';
import type { GameData } from '../core/gameData';
import type { CampaignDef, CampaignNodeDef } from '../core/storyDefs';
import { loadedActs, nodeAct, nodesUpTo } from '../core/campaign/acts';
import { nodeLinks } from '../core/campaign/graph';
import type { Locales } from './load';
import type { ContentRefs, Err } from './validateRefs';
import { allUnits } from './validateWalk';

/** Least distance of two stones on the world map in percent of its width (story 15.7: 55 px of the 1254 px plan, about 36 px at the overview of a 375 × 812 phone). */
const WORLD_STONE_GAP = 4.4;

/** Campaign nodes, merchant, rooms, homes, memorials, the world map, expected levels and the introduction of magic. */
export function validateCampaign(data: GameData, locales: Locales, err: Err, { conditions, dialogue, effects, item }: ContentRefs, placeImages?: Set<string>): void {
  /**
   * The world map (stories 5.2 and 15.7): regions with their names and areas, every node bound to one slot of one place, slot
   * labels unique, conditions of the town picture variants, and the stones far enough apart to be tapped at the overview.
   */
  const worldChecks = (camp: Pick<CampaignDef, 'nodes'>): void => {
    const w = data.world;
    const f = 'world/valmora.yaml';
    if (!w) return;
    const acts = new Set(w.regions.map((r) => r.act));
    for (const r of w.regions) for (const lang of ['de', 'en']) if (!locales[lang]?.[`world.region.${r.id}`]) err(`locales/${lang}`, `missing key world.region.${r.id}`);
    const seen = new Set<string>();
    const labels = new Set<string>();
    const bound = new Set<string>();
    for (const p of w.places) {
      if (seen.has(p.id)) err(f, `${p.id}: placed twice`);
      seen.add(p.id);
      if (!acts.has(p.act)) err(f, `${p.id}: no region for act ${p.act}`);
      for (const s of p.slots) {
        if (labels.has(s.label)) err(f, `${p.id}: slot ${s.label} is planned twice`);
        labels.add(s.label);
        if (!s.node) continue;
        if (!camp.nodes.some((n) => n.id === s.node)) err(f, `${p.id}: unknown node ${s.node}`);
        if (bound.has(s.node)) err(f, `node ${s.node} is placed twice`);
        bound.add(s.node);
      }
      for (const [i, v] of (p.site?.variants ?? []).entries()) conditions(f, v.requires, `${p.id}: site variant ${i + 1}`);
    }
    for (const n of camp.nodes) if (!bound.has(n.id)) err(f, `node ${n.id} has no place on the world map`);
    // roads (story 15.12): between two known, different places, each pair once
    const pairs = new Set<string>();
    for (const [a, b, kind = 'road'] of w.roads) {
      for (const id of [a, b]) if (!seen.has(id)) err(f, `road ${a}-${b}: unknown place ${id}`);
      const key = `${kind}:${[a, b].sort().join('|')}`;
      if (a === b || pairs.has(key)) err(f, `road ${a}-${b}: ${a === b ? 'leads nowhere' : 'drawn twice'}`);
      pairs.add(key);
    }
    // the flight of the prologue (kind escape) is one line: each piece starts where the last one ended
    const flight = w.roads.filter((r) => r[2] === 'escape');
    for (const [i, [a]] of flight.entries()) if (i > 0 && flight[i - 1]![1] !== a) err(f, `escape route breaks before ${a}`);
    // stones must not touch at the overview of a phone: places with a slot and the homes at least WORLD_STONE_GAP of the width apart
    const [pw, ph] = w.size;
    const stones: Array<[string, readonly [number, number]]> = [
      ...w.places.filter((p) => p.slots.length > 0).map((p): [string, readonly [number, number]] => [p.id, p.at]),
      ...Object.entries(w.home).map(([k, at]): [string, readonly [number, number]] => [`home ${k}`, at]),
    ];
    for (const [i, [a, pa]] of stones.entries())
      for (const [b, pb] of stones.slice(i + 1))
        if (Math.hypot(((pa[0] - pb[0]) * pw) / 100, ((pa[1] - pb[1]) * ph) / 100) < (WORLD_STONE_GAP / 100) * pw) err(f, `${a} and ${b} are less than ${WORLD_STONE_GAP} % of the width apart`);
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
  // story 11.1: one node id lives in one act
  const nodeSeen = new Map<string, number>();
  for (const act of loadedActs(data))
    for (const n of data.acts[act]!.nodes) {
      const was = nodeSeen.get(n.id);
      if (was !== undefined) err(`acts/act${act}/campaign.yaml`, `node ${n.id} is declared twice (act ${was} and act ${act})`);
      else nodeSeen.set(n.id, act);
    }
  for (const r of Object.values(data.rooms)) {
    conditions('rooms.yaml', r.requires, `${r.id}.requires`);
    r.levels.forEach((l, i) => conditions('rooms.yaml', l.requires, `${r.id}.levels[${i}].requires`));
    for (const u of r.unlocks) conditions('rooms.yaml', u.requires, `${r.id}.unlocks.${u.id}.requires`);
  }
  homeChecks();
  // one world map for all acts: its slots name the nodes of every act
  worldChecks({ nodes: nodesUpTo(data, Infinity) });
  for (const m of Object.values(data.memorials)) conditions('memorials.yaml', m.requires, `${m.id}.requires`);
  for (const act of loadedActs(data)) {
    const camp = data.acts[act]!;
    const place = (id: string, ctx: string) => {
      if (placeImages && !placeImages.has(id)) err('campaign.yaml', `${ctx}: no place image art/mockups/locations-s1/${id}.png`);
    };
    place(camp.defaultPlace, 'defaultPlace');
    for (const n of camp.nodes) {
      if (n.place) place(n.place, `${n.id} place`);
      // a later act may hold nodes whose map is not built yet (placeholders, story 11.1/11.11): the world map does not offer them
      if (!data.maps[n.map] && act === 1) err('campaign.yaml', `${n.id}: unknown map ${n.map}`);
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
    // an act without nodes yet (act 2 before story 11.11) has no opening mission either
    if (firsts.length !== 1 && camp.nodes.length) err('campaign.yaml', `exactly one node must be fixed: first (found ${firsts.length})`);
    if (camp.nodes.filter((n) => n.fixed === 'finale').length > 1) err('campaign.yaml', 'at most one node can be fixed: finale');
    for (const n of camp.nodes)
      for (const g of n.grants ?? []) {
        item('campaign.yaml', g.item, `${n.id} grants`);
        if (!data.chars[g.unit]) err('campaign.yaml', `${n.id} grants: unknown unit ${g.unit}`);
      }
    for (const n of camp.nodes) effects('campaign.yaml', n.effects, `${n.id} effects`);
    for (const n of camp.nodes)
      (n.effectsIf ?? []).forEach((g, i) => {
        conditions('campaign.yaml', g.requires, `${n.id} effectsIf[${i}].requires`);
        effects('campaign.yaml', g.effects, `${n.id} effectsIf[${i}]`);
      });
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
    validateMechanics(data, camp, err);
  }
}

/** A side quest opens through its own requires or an openQuest somewhere in the content (run after the scenes). */
export function validateSideQuests(data: GameData, err: Err, openedQuests: readonly string[]): void {
  for (const n of nodesUpTo(data, Infinity))
    if (n.kind === 'side' && !n.requires?.length && !openedQuests.includes(n.id)) err('campaign.yaml', `${n.id}: side quest without requires that no openQuest opens`);
}

/**
 * Step-by-step introduction (concept/06 §10): before magic is introduced no map unit, starting character
 * or merchant tier may carry a tome, otherwise the player meets the mechanic before it is explained.
 */
function validateMechanics(data: GameData, camp: CampaignDef, err: (f: string, m: string) => void): void {
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
    if (m.tier <= shopTier || (m.storyCount !== undefined && m.storyCount < from))
      for (const id of m.items) if (data.items[id]?.damageType === 'magical') err('campaign.yaml', `merchant tier ${m.tier}: tome ${id} before magic (${from} story missions)`);
}

/**
 * The fewest completed story missions of the act a node can start with: 0 for the fixed first node, all others for the
 * finale, else the story nodes its `completed` requirements need (transitively).
 */
export function minStoryCount(data: GameData, node: CampaignNodeDef): number {
  const nodes = data.acts[nodeAct(data, node.id) ?? 1]?.nodes ?? [];
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
