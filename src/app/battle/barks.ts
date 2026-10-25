/**
 * Combat barks (story 9.13): one short speech-bubble line of a companion at six moments. Pure presentation; the
 * core knows nothing about them (17-audio §1), the variant pick is not part of the replay. The texts live in the
 * scene `scn.bark.<charId>` (one line per moment), English under `dlg.scn.bark.<charId>.<line>`.
 */
import { BARK_LINES, type BarkLine } from '../../content/barkLines';
import type { LieutenantLine } from '../../content/lieutenantLines';
import type { BattleState, BattleUnit, GameData, GameEvent } from '../../core';

export { BARK_LINES, type BarkLine };

export const barkScene = (charId: string): string => `scn.bark.${charId}`;

export interface Bark {
  /** unit that speaks (its name is shown) */
  unit: string;
  /** unit whose head the bubble sits above: the speaker, or the rescuer when the rescued unit has left the board */
  anchor: string;
  scene: string;
  /** a companion bark, or an opening line of a lieutenant (`ltLines.ts`, story 3.3) */
  line: BarkLine | LieutenantLine;
  /** values for placeholders of the line, e.g. `{ target }` */
  params?: Record<string, string>;
}

/** The character a unit speaks as (companions carry their id, story characters a `charId`). */
export const barkChar = (u: Pick<BattleUnit, 'id' | 'charId'>): string => u.charId ?? u.id;

/** Whether `charId` has a bark scene with a text for `line`. */
export const hasBark = (data: GameData, charId: string, line: BarkLine): boolean =>
  !!data.scenes[barkScene(charId)]?.lines.some((l) => l.id === line && 'text' in l);

/**
 * The bark an event triggers, or `null`. `pick` chooses among candidates (default: random). Only player units with a
 * bark scene speak; the first player phase of a battle (turn 1) lets one deployed, active companion open.
 */
export function barkFor(data: GameData, s: BattleState, e: GameEvent, pick: (n: number) => number = (n) => Math.floor(Math.random() * n)): Bark | null {
  const unit = (uid: string) => s.units.find((u) => u.uid === uid);
  const mk = (u: BattleUnit | undefined, line: BarkLine, anchor?: BattleUnit): Bark | null =>
    u && u.team === 'player' && hasBark(data, barkChar(u), line) ? { unit: u.uid, anchor: (anchor ?? u).uid, scene: barkScene(barkChar(u)), line } : null;
  switch (e.t) {
    case 'phase': {
      if (e.phase !== 'player' || e.turn !== 1) return null;
      const able = s.units.filter((u) => u.team === 'player' && u.pos && !u.gone && !u.downed && hasBark(data, barkChar(u), 'battle_start'));
      return able.length ? mk(able[pick(able.length)], 'battle_start') : null;
    }
    case 'strike':
      return e.hit && e.crit ? mk(unit(e.attacker), 'crit') : null;
    case 'downed':
      return mk(unit(e.unit), 'downed');
    case 'rescued':
      // the rescued unit has left the board (`gone: 'rescued'`, its figure fades out): its line sits above the rescuer
      return mk(unit(e.unit), 'rescued', unit(e.by));
    case 'levelUp':
      return mk(unit(e.unit), 'level_up');
    default:
      return null;
  }
}
