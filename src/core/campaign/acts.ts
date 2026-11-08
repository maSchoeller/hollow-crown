import type { GameData } from '../gameData';
import type { CampaignDef, CampaignNodeDef } from '../storyDefs';

/**
 * The acts of the campaign (story 11.1, architecture §5.4): `GameData.acts` holds one `campaign.yaml` per act folder that is
 * loaded, the campaign state names the act it is in (`c.act`). Pure.
 */

/** The act a campaign is in; saves from before story 11.1 hold none and are in act 1. */
export const actOf = (c: { act?: number } | null | undefined): number => c?.act ?? 1;

/**
 * The campaign of act `act`. When its pack is not loaded yet (the browser fetches it once the act is reached) it stands in with the
 * last loaded act before it and no nodes of its own, so level cap, merchant and scars keep working until the pack is there.
 */
export function campaignOfAct(data: GameData, act: number): CampaignDef {
  const own = data.acts[act];
  if (own) return own;
  const before = Object.keys(data.acts)
    .map(Number)
    .filter((a) => a < act)
    .sort((a, b) => b - a)[0];
  const base = data.acts[before ?? 1] ?? Object.values(data.acts)[0];
  if (!base) throw new Error('no campaign.yaml loaded');
  return { ...base, act, nodes: [] };
}

/** The campaign of the act the campaign is in. */
export const actCampaign = (data: GameData, c: { act?: number } | null | undefined): CampaignDef => campaignOfAct(data, actOf(c));

/** Loaded acts in ascending order. */
export const loadedActs = (data: GameData): number[] =>
  Object.keys(data.acts)
    .map(Number)
    .sort((a, b) => a - b);

/** A node of any act (node ids are unique across the acts, `content:check` makes sure). */
export function findNode(data: GameData, id: string): CampaignNodeDef | undefined {
  for (const act of loadedActs(data)) {
    const n = data.acts[act]!.nodes.find((x) => x.id === id);
    if (n) return n;
  }
  return undefined;
}

/** The act whose `campaign.yaml` holds node `id`. */
export function nodeAct(data: GameData, id: string): number | undefined {
  return loadedActs(data).find((act) => data.acts[act]!.nodes.some((n) => n.id === id));
}

/** Nodes of every loaded act up to and including `act`, in act and file order. */
export function nodesUpTo(data: GameData, act: number): CampaignNodeDef[] {
  return loadedActs(data)
    .filter((a) => a <= act)
    .flatMap((a) => data.acts[a]!.nodes);
}

/**
 * Whether act `act` is open to players: its pack is released in this build (`GameData.releasedActs`, from `content/packs.yaml` or the
 * pack list of the build). Data without the list (hand-built tests) knows act 1 only.
 */
export const actUnlocked = (data: GameData, act: number): boolean => (data.releasedActs ?? [1]).includes(act);

/** A scar of any loaded act (the acts list the same scars, `scars` in `campaign.yaml`). */
export function scarDef(data: GameData, id: string): CampaignDef['scars'][number] | undefined {
  for (const act of loadedActs(data)) {
    const s = data.acts[act]!.scars.find((x) => x.id === id);
    if (s) return s;
  }
  return undefined;
}
