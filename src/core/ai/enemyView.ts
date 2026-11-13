/**
 * Gegner-Sicht (story 10.5): the board as the AI unit `viewerUid` knows it. Shadows hidden from it (`shadowHidden`) and the traps
 * of its foes are left out; everything else is the real state (the AI keeps seeing through the player's fog). The AI phase, the
 * danger zone and the player-side autoplay read the board only through this function, so the worker, which gets the full state,
 * applies the same filter as the synchronous fallback. A shallow copy: units, objects and terrain are the real ones, only the
 * lists of units and traps are new; with nothing to hide the state itself comes back.
 */
import type { GameData } from '../gameData';
import type { BattleState } from '../state';
import { isHostile } from '../util';
import { shadowHidden } from '../rules/stealth';
import { trapsOf, trapTeam } from '../rules/traps';

export function enemyView(data: GameData, s: BattleState, viewerUid: string): BattleState {
  const viewer = s.units.find((u) => u.uid === viewerUid);
  if (!viewer) return s;
  const hidden = s.units.filter((o) => isHostile(o.team, viewer.team) && shadowHidden(data, s, o));
  const traps = trapsOf(s);
  const seen = traps.filter((t) => !isHostile(trapTeam(s, t), viewer.team));
  if (!hidden.length && seen.length === traps.length) return s;
  return { ...s, units: hidden.length ? s.units.filter((o) => !hidden.includes(o)) : s.units, traps: seen };
}
