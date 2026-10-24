/** The six moments a companion barks (story 9.13); the scene `scn.bark.<charId>` holds one line per id. */
export const BARK_LINES = ['battle_start', 'crit', 'downed', 'rescued', 'level_up', 'ember'] as const;
export type BarkLine = (typeof BARK_LINES)[number];
