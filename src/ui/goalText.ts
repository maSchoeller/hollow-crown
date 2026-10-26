/** The goal sentence of a mission ("Bring Liora to the exit.") for the round pill, the goals sheet and the mission preview. */
import { chestProgress, type BattleState, type ObjectiveDef } from '../core';
import { has, t } from '../i18n';

/**
 * Fills the blanks of `ui.world.goal.<type>`: the round limit and, for an escort or a defence, the name of the NPC (`unit.<id>.name`;
 * a unit without that key, e.g. a village elder named by his own key, is "the ward").
 */
export function goalLine(v: ObjectiveDef): string {
  const key = v.type === 'escort' || v.type === 'defend' ? `unit.${v.unit}.name` : '';
  return t(`ui.world.goal.${v.type}`, { turns: 'turns' in v ? v.turns : 0, name: key ? (has(key) ? t(key) : t('ui.world.goal.ward')) : '' });
}

/** The state of the goal for the pill and the sheet ("2/5 chests · turn 3 of 8"); empty when the goal has none to show. */
export function goalStand(v: ObjectiveDef, s: BattleState): string {
  if (v.type === 'treasure') {
    const { have, total } = chestProgress(s, v.chests);
    return `${t('ui.obj.chestsOf', { have, total })} · ${t('ui.obj.turnOf', { turn: Math.min(s.turn, v.turns), turns: v.turns })}`;
  }
  return '';
}
