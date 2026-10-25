/**
 * The wanted posters (story 3.6): everything the profile of a lieutenant shows, as a pure view of the campaign.
 * The surface only lays it out; bounty and material come from the same sources as the payout (story 3.5).
 */
import type { BattleUnit, CampaignState } from '../state';
import type { GameData } from '../defs';
import { bountyGold, clampGrudge, isJoined, lieutenantSkills, lieutenantState } from './lieutenants';

/** Where the grudge points: nowhere, at a unit of the company, at one who has fallen, or at one who left. */
export type WantedTarget =
  | { kind: 'none' }
  | { kind: 'alive' | 'fallen' | 'gone'; id: string; nameKey: string; name?: string; portrait?: string; classId?: string };

/** One of the three grudge skills: `free` once the grudge has reached `grudge`. */
export interface WantedSkill {
  id: string;
  /** grudge needed: 1, 2 or 3 */
  grudge: number;
  free: boolean;
}

export interface WantedView {
  id: string;
  nameKey: string;
  portrait: string;
  classId: string;
  titleKey: string;
  /** the level of the unit on the board; absent outside a battle */
  level?: number;
  /** 0-3 */
  grudge: number;
  target: WantedTarget;
  /** missions won with him on the map (the state before the running battle) */
  encounters: number;
  routs: number;
  /** the company has won a mission against him */
  met: boolean;
  /** gold for the next rout (`bountyGold`) */
  bounty: number;
  /** material of the act and the amount range per rout; absent when the act pays none */
  material?: { id: string; min: number; max: number };
  skills: WantedSkill[];
  /** text key of what he does at 0 HP */
  fleeRuleKey: string;
  /** he has joined the company (story 3.7): no grudge, no bounty, and his profile leads to his figure in the troop */
  joined: boolean;
}

/** What the board knows of a lieutenant: his level and, in a battle, the grudge and target the unit carries. */
export type WantedUnit = Pick<BattleUnit, 'level' | 'grudge' | 'grudgeTarget'>;

/** Text key of the flee rule, the same for every lieutenant (GDD: he flees at 0 HP and comes back). */
export const FLEE_RULE_KEY = 'ui.wanted.rule.flee';

const portraitOf = (p: string | undefined) => (p ? { portrait: p } : {});

function targetOf(data: GameData, c: Pick<CampaignState, 'roster' | 'fallen'>, id: string | undefined): WantedTarget {
  if (!id) return { kind: 'none' };
  const art = data.chars[id]?.portrait ?? (data.chars[id] ? id : undefined);
  const r = c.roster.find((x) => x.id === id);
  if (r) return { kind: 'alive', id, nameKey: r.nameKey, ...(r.name ? { name: r.name } : {}), ...portraitOf(r.portrait ?? art), classId: r.classId };
  const f = c.fallen.find((x) => x.id === id);
  if (f) return { kind: 'fallen', id, nameKey: f.nameKey, ...(f.name ? { name: f.name } : {}), ...portraitOf(f.portrait ?? art), ...(f.classId ? { classId: f.classId } : {}) };
  const ch = data.chars[id];
  return { kind: 'gone', id, nameKey: `unit.${id}.name`, ...portraitOf(art), ...(ch ? { classId: ch.class } : {}) };
}

/**
 * The profile of lieutenant `ltId`, or `null` for an unknown id. Counts (`encounters`, `routs`, `met`) always come from
 * the campaign, which changes only after a won mission. With `unit` (on the board) the level, the grudge and the target
 * are those of the unit; without it they come from the campaign. The bounty is for the next rout.
 */
export function wantedView(data: GameData, c: Pick<CampaignState, 'lieutenants' | 'roster' | 'fallen' | 'flags'>, ltId: string, unit?: WantedUnit): WantedView | null {
  const def = data.lieutenants?.[ltId];
  if (!def) return null;
  const st = lieutenantState(c, ltId);
  const joined = isJoined(c, ltId);
  const grudge = joined ? 0 : clampGrudge(unit ? (unit.grudge ?? st.grudge) : st.grudge);
  const targetId = unit ? (unit.grudgeTarget ?? st.target) : st.target;
  const cfg = data.balance.lieutenant.bounty;
  const materialId = cfg.materialByAct[String(data.campaign.act)];
  return {
    id: ltId,
    nameKey: def.nameKey,
    portrait: def.portrait,
    classId: def.class,
    titleKey: def.titleKey,
    ...(unit ? { level: unit.level } : {}),
    grudge,
    target: grudge > 0 ? targetOf(data, c, targetId) : { kind: 'none' },
    encounters: st.encounters,
    routs: st.routs,
    met: st.met,
    bounty: bountyGold(data, grudge),
    ...(materialId && cfg.materials.max > 0 ? { material: { id: materialId, min: cfg.materials.min, max: cfg.materials.max } } : {}),
    skills: def.grudgeSkills.map((id, i) => ({ id, grudge: i + 1, free: lieutenantSkills(def, grudge).includes(id) })),
    fleeRuleKey: FLEE_RULE_KEY,
    joined,
  };
}

/** The lieutenants the company has met, in the order of the content (the list of the wanted posters). One who joined stays in it, marked, without grudge. */
export function wantedList(data: GameData, c: Pick<CampaignState, 'lieutenants' | 'roster' | 'fallen' | 'flags'>): WantedView[] {
  return Object.keys(data.lieutenants ?? {})
    .filter((id) => lieutenantState(c, id).met || isJoined(c, id))
    .map((id) => wantedView(data, c, id)!);
}

/** What a long press on a unit opens: the profile of a lieutenant who is not of the player's side, else the unit card. */
export function longPressView(data: GameData, u: Pick<BattleUnit, 'lieutenant' | 'team'>): 'wanted' | 'info' {
  return u.lieutenant && u.team !== 'player' && data.lieutenants?.[u.lieutenant] ? 'wanted' : 'info';
}
