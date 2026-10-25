import { CORE_ROLES, type CampaignNodeDef, type GameData, type Mechanic } from '../defs';
import type { CampaignState } from '../state';
import { conditionContext, evalCondition, evalConditions } from './conditions';

/**
 * The campaign graph of an act (architecture §5.4): which nodes are open is worked out from the campaign every
 * time, nothing is stored. Pure.
 */

/** Completed story missions of the act (side quests do not count). */
export function storyCount(data: GameData, completed: readonly string[]): number {
  return data.campaign.nodes.filter((n) => n.kind === 'story' && completed.includes(n.id)).length;
}

/**
 * The act is over: its `fixed: finale` node is completed (story 7.3). An act without a finale node is never over. The
 * act number stays as it is; moving on to the next act is a matter of the build having its pack (architecture §5.4).
 */
export function actFinished(data: GameData, c: Pick<CampaignState, 'completed'>): boolean {
  return data.campaign.nodes.some((n) => n.fixed === 'finale' && c.completed.includes(n.id));
}

/** Whether node `n` is open right now; see `availableNodes`. */
function open(data: GameData, c: CampaignState, n: CampaignNodeDef, done: number): boolean {
  if (c.completed.includes(n.id)) return false;
  if (done === 0) return n.fixed === 'first';
  if (n.fixed === 'first') return false;
  const ctx = conditionContext(data, c);
  if (n.kind === 'side') return c.quests.includes(n.id) || (!!n.requires?.length && evalConditions(ctx, n.requires));
  if (n.fixed === 'finale' && data.campaign.nodes.some((o) => o.kind === 'story' && o.id !== n.id && !c.completed.includes(o.id))) return false;
  return evalConditions(ctx, n.requires);
}

/**
 * Nodes the player can start, in file order: first only the act's fixed opening mission, then every node whose
 * conditions hold, the finale once all other story nodes are done. A side quest opens through `openQuest` or its own
 * (non-empty) `requires`. Completed nodes never come back. Empty = the act is over.
 */
export function availableNodes(data: GameData, c: CampaignState): CampaignNodeDef[] {
  const done = storyCount(data, c.completed);
  return data.campaign.nodes.filter((n) => open(data, c, n, done));
}

export function isAvailable(data: GameData, c: CampaignState, nodeId: string): boolean {
  const n = data.campaign.nodes.find((x) => x.id === nodeId);
  return !!n && open(data, c, n, storyCount(data, c.completed));
}

/** The node's scenes before and after the mission; the memorial variant when `memorialIf` holds (a fallen trigger). */
export function nodeScenes(data: GameData, c: CampaignState | null, nodeId: string): { pre?: string; post?: string } {
  const n = data.campaign.nodes.find((x) => x.id === nodeId);
  if (!n) return {};
  if (n.memorialIf && n.memorial && evalCondition(conditionContext(data, c), n.memorialIf)) return { pre: n.memorial.pre ?? n.pre, post: n.memorial.post ?? n.post };
  return { pre: n.pre, post: n.post };
}

/**
 * Mechanics not introduced yet when a mission starts (GDD gestaffelte Regeln): a mechanic applies once the act has
 * as many completed story missions as `mechanics` names; unlisted mechanics are always on.
 */
export function lockedMechanics(data: GameData, c: CampaignState): Mechanic[] {
  const done = storyCount(data, c.completed);
  return (Object.entries(data.campaign.mechanics) as Array<[Mechanic, number]>).filter(([, from]) => done < from).map(([m]) => m);
}

/** Role of a class (a pro class names the role it promotes from). */
const roleOf = (data: GameData, classId: string): string | undefined => data.classes[classId]?.role;

/** Adds the roles of the company to `c.rolesSeen` (never removes one: a role stays introduced when its bearer falls). */
export function noteRoles(data: GameData, c: CampaignState): void {
  for (const u of c.roster) {
    const r = roleOf(data, u.classId);
    if (r && !c.rolesSeen.includes(r)) c.rolesSeen.push(r);
  }
}

/** Core roles whose class action is not introduced yet: no company member of that role has joined (`c.rolesSeen`). */
export function lockedRoles(data: GameData, c: Pick<CampaignState, 'rolesSeen' | 'roster'>): string[] {
  const here = c.roster.map((u) => roleOf(data, u.classId));
  return CORE_ROLES.filter((r) => !c.rolesSeen.includes(r) && !here.includes(r));
}

/** Paths for the world map: `[from, to]` for every top-level `completed` requirement of a node. */
export function nodeLinks(data: GameData): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const n of data.campaign.nodes)
    for (const r of n.requires ?? []) if ('completed' in r) out.push([r.completed, n.id]);
  return out;
}

/** The act's fixed opening mission. */
export function firstNode(data: GameData): CampaignNodeDef {
  const n = data.campaign.nodes.find((x) => x.fixed === 'first');
  if (!n) throw new Error('campaign has no fixed: first node');
  return n;
}
