/** The goal sentence of a mission ("Bring Liora to the exit.") for the round pill, the goals sheet and the mission preview. */
import { chestProgress, type BattleState, type ObjectiveDef } from '../core';
import { t } from '../i18n';

/**
 * Fills the blanks of `ui.world.goal.<type>`: the round limit and, for an escort or a defence, the name of the NPC. `units` (map or battle
 * units) give the name key of that NPC, e.g. the steward of 1-8 is `unit.paktwacht_steward.name`; without them it is `unit.<id>.name`.
 */
export function goalLine(v: ObjectiveDef, units: readonly { id?: string; nameKey?: string }[] = []): string {
  const who = v.type === 'escort' || v.type === 'defend' ? t(units.find((u) => u.id === v.unit)?.nameKey ?? `unit.${v.unit}.name`) : '';
  return t(`ui.world.goal.${v.type}`, { turns: 'turns' in v ? v.turns : 0, name: who });
}

/** The state of the goal for the pill and the sheet ("2/5 chests · turn 3 of 8"); empty when the goal has none to show. */
export function goalStand(v: ObjectiveDef, s: BattleState): string {
  if (v.type === 'treasure') {
    const { have, total } = chestProgress(s, v.chests);
    return `${t('ui.obj.chestsOf', { have, total })} · ${t('ui.obj.turnOf', { turn: Math.min(s.turn, v.turns), turns: v.turns })}`;
  }
  return '';
}
