/**
 * Opening lines of the enemy lieutenants (story 3.3): at first sight a lieutenant speaks one line as a speech bubble,
 * once per battle. The choice is made in the core (`ltLinesDue`); this module turns it into barks for the board and
 * puts the target's name in. Pure presentation, like `barks.ts`; the scene `scn.lt.<id>` holds the texts.
 */
import { ltLinesDue, type BattleState, type CampaignState, type GameData } from '../../core';
import { t } from '../../i18n';
import type { Bark } from './barks';

/**
 * The barks due now, in the order of the units in the state. Every lieutenant that comes up is entered in `spoken`
 * (unit uids), also when `play` is false (skip mode: the line is left out, not postponed).
 */
export function ltBarks(data: GameData, c: CampaignState | null, s: BattleState, spoken: Set<string>, play: boolean): Bark[] {
  if (!c) return [];
  const out: Bark[] = [];
  for (const due of ltLinesDue(c, s, spoken)) {
    spoken.add(due.unit);
    const scene = data.lieutenants[due.lieutenant]?.scene;
    if (!play || !scene) continue;
    const who = due.target ? (c.roster.find((r) => r.id === due.target) ?? c.fallen.find((f) => f.id === due.target)) : undefined;
    out.push({ unit: due.unit, anchor: due.unit, scene, line: due.line, ...(who ? { params: { target: who.name ?? t(who.nameKey) } } : {}) });
  }
  return out;
}
