/**
 * What the critical-hit cut-in shows (story 8.6, art-direction §5.4, §8). Pure: the portrait in the mood `angry` (the half
 * figure of the speaker scenes, `pickHalf`), the neutral one where there is no `angry` variant, a letter medallion where there
 * is no half figure at all (generic enemies, or the act pack is not loaded yet in the prologue); the colour of the speed lines
 * (the element's colour, else the light step of the team's ramp) and the name (the skill that fired, else the weapon).
 */
import type { Element, GameData, ItemInstance, Team } from '../../core';
import { pickHalf } from '../../ui/halfFigure';

export type CutInPortrait = { kind: 'half'; stem: string } | { kind: 'medallion'; initial: string };

/**
 * `id`: the unit's character image id (`artId`), `built`: the half figures that exist (manifest), `name`: the unit's name for the
 * medallion's letter.
 */
export function cutInPortrait(id: string | undefined, built: ReadonlySet<string> | null | undefined, name: string): CutInPortrait {
  const stem = id ? pickHalf(id, 'angry', built) : null;
  return stem ? { kind: 'half', stem } : { kind: 'medallion', initial: name.trim().slice(0, 1).toUpperCase() || '?' };
}

/** CSS colour of the speed lines: the element's colour token, without an element the light step (K3) of the team's ramp. */
export function cutInLineColour(data: GameData, element: Element | undefined, team: Team): string {
  return element ? `var(--hc-element-${element})` : data.render.look.teams[team].ramp[3];
}

/** Display name of the attack: the skill if one fired, else the equipped weapon (an item instance), else nothing. */
export function cutInName(skill: string | undefined, weapon: ItemInstance | undefined, text: { skill(id: string): string; item(i: ItemInstance): string }): string {
  if (skill) return text.skill(skill);
  return weapon ? text.item(weapon) : '';
}
