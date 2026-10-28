/**
 * Opening lines of the enemy lieutenants (story 3.3): at first sight a lieutenant speaks one line in the speech band,
 * once per battle. The choice is made in the core (`ltLinesDue`); this module turns it into barks for the board and
 * puts the target's name in. Pure presentation, like `barks.ts`; the scene `scn.lt.<id>` holds the texts.
 */
import { ltFleeLine, ltLinesDue, type BattleState, type CampaignState, type GameData } from '../../core';
import { t } from '../../i18n';
import type { Bark } from './barks';

/**
 * The barks due now, in the order of the units in the state. Every lieutenant that comes up is entered in `spoken`
 * (unit uids), also when `play` is false (skip mode: the line is left out, not postponed).
 */
export function ltBarks(data: GameData, c: CampaignState | null, s: BattleState, spoken: Set<string>, play: boolean): Bark[] {
  if (!c) return [];
  const out: Bark[] = [];
  for (const due of ltLinesDue(data, c, s, spoken)) {
    spoken.add(due.unit);
    const scene = data.lieutenants[due.lieutenant]?.scene;
    if (!play || !scene) continue;
    const who = due.target ? (c.roster.find((r) => r.id === due.target) ?? c.fallen.find((f) => f.id === due.target)) : undefined;
    out.push({ unit: due.unit, scene, line: due.line, ...(who ? { params: { target: who.name ?? t(who.nameKey) } } : {}) });
  }
  return out;
}

/**
 * The flee line of a lieutenant who has just been driven off (story 3.2), or `null` when it is left out: skip mode, no scene,
 * no campaign, not a lieutenant, or he has spoken it already (`spoken`, unit uids; each lieutenant once per battle). The
 * line follows from his earlier routs (`ltFleeLine`); `by`, the unit that drove him off, fills a {target} in the text.
 */
export function fleeBark(data: GameData, c: CampaignState | null, s: BattleState, unitUid: string, by: string | undefined, spoken: Set<string>, play: boolean): Bark | null {
  const u = s.units.find((x) => x.uid === unitUid);
  if (!c || !play || !u?.lieutenant || spoken.has(u.uid)) return null;
  const scene = data.lieutenants[u.lieutenant]?.scene;
  if (!scene) return null;
  spoken.add(u.uid);
  const driver = by ? s.units.find((x) => x.uid === by) : undefined;
  return {
    unit: u.uid,
    scene,
    line: ltFleeLine(c, u.lieutenant),
    ...(driver ? { params: { target: driver.name ?? t(driver.nameKey) } } : {}),
  };
}
