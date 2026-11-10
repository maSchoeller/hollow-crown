/** The goal sentence of a mission ("Bring Liora to the exit.") for the round pill, the goals sheet and the mission preview. */
import { chestProgress, escapeProgress, leftAlive, mapUnitNameKey, mustUnits, type BattleState, type MapDef, type ObjectiveDef, type SideObjectiveDef, type WeaponType } from '../core';
import { t } from '../i18n';
import { unitName } from './components';

/** The text key of a goal (`ui.world.goal.<key>`, `ui.map.tag.<key>`): its type, `survive_escape` for a survive with a second phase (story 11.8). */
export function goalKey(v: ObjectiveDef): string {
  return v.type === 'survive' && v.then ? 'survive_escape' : v.type;
}

/**
 * Fills the blanks of `ui.world.goal.<type>` (`treasure_target` for a treasure goal with further chests on the map): the round limit and, for an escort or a defence, the name of the NPC. A `survive`
 * goal with a second phase (story 11.8) says both parts ("Survive 5 turns, then escape.").
 */
export function goalLine(v: ObjectiveDef, map: MapDef): string {
  const unit = v.type === 'escort' || v.type === 'defend' ? t(mapUnitNameKey(map, v.unit)) : '';
  // T6-13F6: a treasure hunt with more chests on the map than its goal names only asks for the target chest
  const more = v.type === 'treasure' && map.objects.filter((o) => o.type === 'chest').length > v.chests.length;
  return t(`ui.world.goal.${more ? 'treasure_target' : goalKey(v)}`, { turns: 'turns' in v ? v.turns : 0, name: unit });
}

/** What a side objective names: the unit as name key and the weapon group (see `sideSubject`). */
export interface SideLineInput {
  type: SideObjectiveDef['type'];
  turns?: number;
  nameKey?: string;
  weaponType?: WeaponType;
}

/** The sentence of a side objective ("Recruit Varek"), with the unit and the weapon group filled in. */
export function sideLine(o: SideLineInput): string {
  return t(`ui.side.${o.type}`, { turns: o.turns ?? 0, name: o.nameKey ? t(o.nameKey) : '', weapon: o.weaponType ? t(`ui.weapon.${o.weaponType}`) : '' });
}

/** An escape that counts (story 11.8): it has a `min` or a `must`; a plain escape (prologue) only wants everyone out. */
export function escapeCounts(v: ObjectiveDef): v is Extract<ObjectiveDef, { type: 'escape' }> {
  return v.type === 'escape' && (v.min !== undefined || !!v.must?.length);
}

/**
 * The state of the goal for the pill and the sheet ("2/5 chests · turn 3 of 8", for an escape that counts "2/6 out", story
 * 11.8); empty when the goal has none to show.
 */
export function goalStand(v: ObjectiveDef, s: BattleState): string {
  if (escapeCounts(v)) return t('ui.obj.escapedOf', escapeProgress(s, v));
  if (v.type === 'treasure') {
    const { have, total } = chestProgress(s, v.chests);
    return `${t('ui.obj.chestsOf', { have, total })} · ${t('ui.obj.turnOf', { turn: Math.min(s.turn, v.turns), turns: v.turns })}`;
  }
  return '';
}

/** Who of an escape's `must` still has to get out, by name ("Must get out: Rhen, Lucan"); empty when nobody (story 11.8). */
export function mustLine(v: ObjectiveDef, s: BattleState): string {
  const missing = mustUnits(s, v).filter((u) => !leftAlive(u));
  return missing.length ? t('ui.obj.mustLeft', { names: missing.map(unitName).join(', ') }) : '';
}
