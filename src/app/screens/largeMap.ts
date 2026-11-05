/** Decisions of the battle screen for large maps (story 15.11), pure so they are tested without a board. */

/**
 * A tap while the camera shows the whole map: it always jumps there (`zoom`), since fields of about 12 px are no target; a tap on a
 * figure also goes on as a normal tap (`tap`), so a figure can still be chosen or looked at from the overview.
 */
export function overviewTap(whole: boolean, onFigure: boolean): { zoom: boolean; tap: boolean } {
  if (!whole) return { zoom: false, tap: true };
  return { zoom: true, tap: onFigure };
}

/** Whether the board plays foes that only walk together: only in the foes' phases, and only with the option „Gemeinsam“. */
export function marchTogether(enemyPhase: boolean, setting: 'together' | 'each'): boolean {
  return enemyPhase && setting === 'together';
}
