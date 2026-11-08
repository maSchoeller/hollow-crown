/** Runtime cache of the on-demand files (places, models); shared by the service worker config (vite.config.ts) and the loader. */
export const ON_DEMAND_CACHE = 'hc-on-demand';

/**
 * Music tracks that are not in the first download (decision 2026-10-24, "mehr nachladen statt Budget erhöhen"): the
 * battle pair comes with the mission's loading, camp and world map music is fetched in the background (`plan.ts`).
 * Sound effects and the title music stay in the precache. Read by `vite.config.ts`.
 */
export const ON_DEMAND_MUSIC = ['battle_player', 'battle_enemy', 'camp', 'worldmap'] as const;
