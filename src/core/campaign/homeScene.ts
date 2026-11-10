/**
 * Scenes that play once at home (story 11.23, Beat 10 „Die Chronik“): `homeScenes` of the act's campaign file, in file order.
 * A scene is due in its home kind once its conditions hold and the player has not seen it (`scenesSeen`); its effects run
 * through the `effects` command when it ends. Pure.
 */
import type { GameData } from '../gameData';
import type { CampaignState } from '../state';
import type { HomeSceneDef } from '../storyDefs';
import { actCampaign } from './acts';
import { conditionContext, evalConditions } from './conditions';

/** The first home scene of the current act due now in the company's home, or null. */
export function pendingHomeScene(data: GameData, c: CampaignState): HomeSceneDef | null {
  const ctx = conditionContext(data, c);
  for (const h of actCampaign(data, c).homeScenes ?? []) {
    if (h.home && h.home !== c.home.kind) continue;
    if (c.scenesSeen.includes(h.scene) || !data.scenes[h.scene]) continue;
    if (evalConditions(ctx, h.requires)) return h;
  }
  return null;
}
