/** The goal sentence of a mission ("Bring Liora to the exit.") for the round pill, the goals sheet and the mission preview. */
import { chestProgress, mapUnitNameKey, type BattleState, type MapDef, type ObjectiveDef, type SideObjectiveDef, type WeaponType } from '../core';
import { t } from '../i18n';

/** Fills the blanks of `ui.world.goal.<type>`: the round limit and, for an escort or a defence, the name of the NPC. */
export function goalLine(v: ObjectiveDef, map: MapDef): string {
  const unit = v.type === 'escort' || v.type === 'defend' ? t(mapUnitNameKey(map, v.unit)) : '';
  return t(`ui.world.goal.${v.type}`, { turns: 'turns' in v ? v.turns : 0, name: unit });
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

/** The state of the goal for the pill and the sheet ("2/5 chests · turn 3 of 8"); empty when the goal has none to show. */
export function goalStand(v: ObjectiveDef, s: BattleState): string {
  if (v.type === 'treasure') {
    const { have, total } = chestProgress(s, v.chests);
    return `${t('ui.obj.chestsOf', { have, total })} · ${t('ui.obj.turnOf', { turn: Math.min(s.turn, v.turns), turns: v.turns })}`;
  }
  return '';
}
