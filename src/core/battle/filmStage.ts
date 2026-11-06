/** The board a film scene plays on (epic 16): the film's map with only its actors, where the film places them. */
import type { FilmDef } from '../filmDefs';
import { tileOf } from '../filmDefs';
import type { GameData } from '../gameData';
import type { BattleState, BattleUnit, CampaignState } from '../state';
import { battleUnitFromRecord } from './create';
import { createBattle } from './setup';
import { clone } from '../util';

/**
 * Builds the stage of `film` from the campaign: company actors come from the roster (members not in it stay off), extras are
 * the map's own units of the same id, or a copy of the first map unit dressed as the extra's model. Null if no node uses the map.
 */
export function filmStage(data: GameData, c: CampaignState, film: FilmDef): BattleState | null {
  const node = data.campaign.nodes.find((n) => n.map === film.map);
  if (!node) return null;
  const s = createBattle(data, c, node.id, []);
  const mapUnits = s.units.filter((u) => u.team !== 'player');
  const units: BattleUnit[] = [];
  for (const a of film.actors) {
    const pos = tileOf(a.at);
    let u: BattleUnit | undefined;
    if (!a.model) {
      const rec = c.roster.find((r) => r.id === a.id);
      if (rec) u = battleUnitFromRecord(data, rec, 'player', pos);
    } else {
      const own = mapUnits.find((m) => m.uid === a.id);
      const base = own ?? mapUnits[0];
      if (base) {
        u = { ...clone(base), uid: a.id, sprite: own?.sprite ?? a.model };
        delete u.lieutenant;
      }
      if (u && a.team) u.team = a.team;
    }
    if (!u) continue;
    u.pos = pos;
    units.push(u);
  }
  s.units = units;
  return s;
}
