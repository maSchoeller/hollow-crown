import type { GameData, MemorialDef } from '../defs';
import type { CampaignState } from '../state';
import { conditionContext, evalConditions } from './conditions';
import { farewellScene, hasLine } from './farewellView';
import { lineKey } from './scene';

/** Text keys of a fixed memorial stone. */
export const stoneKey = (id: string, part: 'name' | 'place' | 'role' | 'quote'): string => `memorial.${id}.${part}`;

/** The German texts of a fixed memorial stone (the stone's file holds them, like a chronicle page). */
export function memorialTexts(m: MemorialDef): Record<string, string> {
  return {
    [stoneKey(m.id, 'name')]: m.name,
    [stoneKey(m.id, 'place')]: m.place,
    [stoneKey(m.id, 'role')]: m.role,
    ...(m.quote ? { [stoneKey(m.id, 'quote')]: m.quote } : {}),
  };
}

/**
 * One memorial stone of the memorial hall (story 6.9); the screen only lays it out. A fixed stone carries its own
 * texts (`placeKey`, `roleKey`), a fallen one the node it fell in and its class: the screen words "fell in <node>".
 */
export interface MemorialStone {
  /** `fixed:<id>` or `fallen:<unit id>` */
  key: string;
  kind: 'fixed' | 'fallen';
  nameKey: string;
  /** a name the unit was given in play (mercenaries, the avatar) */
  name?: string;
  portrait?: string;
  classId?: string;
  /** hired in the tavern: no picture of their own, no quote */
  mercenary: boolean;
  /** fixed stone: where it happened */
  placeKey?: string;
  /** fixed stone: the role */
  roleKey?: string;
  /** fallen: the node they fell in */
  node?: string;
  /** the quote below the stones: the `last` line of the farewell scene, or the line of the fixed stone */
  quoteKey?: string;
}

/**
 * The stones of the memorial hall: first the fixed stones of the acts whose `requires` hold (in the order of the files),
 * then everyone in `c.fallen` in the order they fell, mercenaries included. Nothing is stored: the list is computed
 * from the content and the campaign.
 */
export function memorialStones(data: GameData, c: CampaignState): MemorialStone[] {
  const ctx = conditionContext(data, c);
  const fixed: MemorialStone[] = Object.values(data.memorials)
    .filter((m) => evalConditions(ctx, m.requires))
    .map((m) => ({
      key: `fixed:${m.id}`,
      kind: 'fixed',
      nameKey: stoneKey(m.id, 'name'),
      portrait: m.portrait,
      mercenary: false,
      placeKey: stoneKey(m.id, 'place'),
      roleKey: stoneKey(m.id, 'role'),
      quoteKey: m.quote ? stoneKey(m.id, 'quote') : undefined,
    }));
  const fallen: MemorialStone[] = c.fallen.map((f) => {
    const mercenary = !!f.mercenary;
    const scene = farewellScene(f.id);
    return {
      key: `fallen:${f.id}`,
      kind: 'fallen',
      nameKey: f.nameKey,
      name: f.name,
      portrait: f.portrait,
      classId: f.classId,
      mercenary,
      node: f.node,
      quoteKey: !mercenary && hasLine(data, scene, 'last') ? lineKey(scene, 'last') : undefined,
    };
  });
  return [...fixed, ...fallen];
}
