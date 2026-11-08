import { CORE_ROLES, type Mechanic } from '../defs';
import type { GameData } from '../gameData';
import type { CampaignNodeDef } from '../storyDefs';
import type { CampaignState } from '../state';
import type { CampaignEvent } from './commands';
import { actCampaign, actOf, actUnlocked, findNode, nodesUpTo } from './acts';
import { conditionContext, evalCondition, evalConditions } from './conditions';

/**
 * The campaign graph of an act (architecture §5.4): which nodes are open is worked out from the campaign every
 * time, nothing is stored. Pure.
 */

/** Completed story missions of the act the campaign is in (side quests do not count). */
export function storyCount(data: GameData, c: Pick<CampaignState, 'completed'> & { act?: number }): number {
  return actCampaign(data, c).nodes.filter((n) => n.kind === 'story' && c.completed.includes(n.id)).length;
}

/**
 * The act is over: its `fixed: finale` node is completed (story 7.3). An act without a finale node is never over. The
 * act moves on only where the build has the next act's pack (`enterNextAct`, story 11.1).
 */
export function actFinished(data: GameData, c: Pick<CampaignState, 'completed'> & { act?: number }): boolean {
  return actCampaign(data, c).nodes.some((n) => n.fixed === 'finale' && c.completed.includes(n.id));
}

/**
 * The move to the next act (story 11.1, architecture §5.4): once the finale of the act is done and the next act is released in this
 * build, `c.act` goes up by one and `actReached` is reported. Otherwise nothing changes (story 7.3, "coming soon"). Changes `c` in
 * place; returns whether it moved. Called by `finishMission` after a victory and by `normalizeCampaign` for saves of an older build.
 */
export function enterNextAct(data: GameData, c: CampaignState, events?: CampaignEvent[]): boolean {
  const act = actOf(c);
  if (!actFinished(data, c) || !actUnlocked(data, act + 1)) return false;
  c.act = act + 1;
  events?.push({ t: 'actReached', act: c.act });
  return true;
}

/** Whether node `n` is open right now; see `availableNodes`. */
function open(data: GameData, c: CampaignState, n: CampaignNodeDef, done: number): boolean {
  if (c.completed.includes(n.id)) return false;
  const own = actCampaign(data, c).nodes;
  const here = own.includes(n);
  // story nodes of another act are never open; side quests of earlier acts stay open over the acts (architecture §5.4)
  if (!here && n.kind === 'story') return false;
  if (here && done === 0) return n.fixed === 'first';
  if (n.fixed === 'first') return false;
  const ctx = conditionContext(data, c);
  if (n.kind === 'side') return c.quests.includes(n.id) || (!!n.requires?.length && evalConditions(ctx, n.requires));
  if (n.fixed === 'finale' && own.some((o) => o.kind === 'story' && o.id !== n.id && !c.completed.includes(o.id))) return false;
  return evalConditions(ctx, n.requires);
}

/**
 * Nodes the player can start, in file order: first only the act's fixed opening mission, then every node whose
 * conditions hold, the finale once all other story nodes are done. A side quest opens through `openQuest` or its own
 * (non-empty) `requires`. Completed nodes never come back. Empty = the act is over.
 */
export function availableNodes(data: GameData, c: CampaignState): CampaignNodeDef[] {
  const done = storyCount(data, c);
  // the story nodes of the running act and the side quests of every act up to it (story 11.1)
  const own = actCampaign(data, c).nodes;
  const nodes = [...nodesUpTo(data, actOf(c) - 1).filter((n) => n.kind === 'side'), ...own];
  return nodes.filter((n) => open(data, c, n, done));
}

export function isAvailable(data: GameData, c: CampaignState, nodeId: string): boolean {
  return availableNodes(data, c).some((n) => n.id === nodeId);
}

/** The node's scenes before and after the mission; the memorial variant when `memorialIf` holds (a fallen trigger). */
export function nodeScenes(data: GameData, c: CampaignState | null, nodeId: string): { pre?: string; post?: string } {
  const n = findNode(data, nodeId);
  if (!n) return {};
  if (n.memorialIf && n.memorial && evalCondition(conditionContext(data, c), n.memorialIf)) return { pre: n.memorial.pre ?? n.pre, post: n.memorial.post ?? n.post };
  return { pre: n.pre, post: n.post };
}

/**
 * Mechanics not introduced yet when a mission starts (GDD gestaffelte Regeln): a mechanic applies once the act has
 * as many completed story missions as `mechanics` names; unlisted mechanics are always on.
 */
export function lockedMechanics(data: GameData, c: CampaignState): Mechanic[] {
  const done = storyCount(data, c);
  return (Object.entries(actCampaign(data, c).mechanics) as Array<[Mechanic, number]>).filter(([, from]) => done < from).map(([m]) => m);
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

/** Paths for the world map: `[from, to]` for every top-level `completed` requirement of a node (every loaded act). */
export function nodeLinks(data: GameData): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const n of nodesUpTo(data, Infinity))
    for (const r of n.requires ?? []) if ('completed' in r) out.push([r.completed, n.id]);
  return out;
}

/** The fixed opening mission of an act (act 1 unless given). */
export function firstNode(data: GameData, act = 1): CampaignNodeDef {
  const n = data.acts[act]?.nodes.find((x) => x.fixed === 'first');
  if (!n) throw new Error('campaign has no fixed: first node');
  return n;
}
