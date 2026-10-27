/**
 * Goal marking: a tap on a side objective in the HUD marks the places it points at on the board (`sideObjectiveSpots`). A second tap
 * on the same objective, a tap on another one or `render.board.markMs` without a tap takes the marking away. No part of the battle
 * state: nothing is saved.
 */
import { signal } from '@preact/signals';
import { sideObjectiveSpots, type BattleState, type GameData, type Pos, type SideObjectiveDef } from '../../core';

/** id of the side objective whose places are marked, or null */
export const markedGoal = signal<string | null>(null);

let timer: ReturnType<typeof setTimeout> | undefined;

export function clearGoalMark(): void {
  clearTimeout(timer);
  timer = undefined;
  markedGoal.value = null;
}

/** Marks the objective `id` for `ms` ms (a second tap on it, or a tap on another one, ends or moves the marking); returns whether it is marked now. */
export function toggleGoalMark(id: string, ms: number): boolean {
  if (markedGoal.value === id) {
    clearGoalMark();
    return false;
  }
  clearTimeout(timer);
  markedGoal.value = id;
  timer = setTimeout(clearGoalMark, ms);
  return true;
}

/** The fields to mark for the objective `id` of the map's side objectives: its open places in the (visible) state `s`. */
export function goalMarkTiles(data: GameData, s: BattleState, side: readonly SideObjectiveDef[], id: string | null): Pos[] {
  const o = id ? side.find((x) => x.id === id) : undefined;
  return o ? sideObjectiveSpots(data, s, o) : [];
}
