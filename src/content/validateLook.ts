/** Checks of the board look (story 8.6): weather against the act of the map, status icons. Pure, called by validateContent. */
import type { GameData } from '../core/defs';
import type { ContentIssue } from './load';

/** A map's weather must be one that `render.yaml look.weather[..].acts` allows in the map's act (art-direction §2.5): an error. */
export function validateWeather(data: GameData): ContentIssue[] {
  const out: ContentIssue[] = [];
  for (const map of Object.values(data.maps)) {
    if (!map.weather) continue;
    const acts = data.render.look.weather[map.weather]?.acts;
    if (!acts) out.push({ file: `maps/${map.id}`, message: `unknown weather ${map.weather}` });
    else if (!acts.includes(map.act)) out.push({ file: `maps/${map.id}`, message: `weather ${map.weather} does not occur in act ${map.act} (allowed: act ${acts.join(', ')}; render.yaml look.weather)` });
  }
  return out;
}

/** The statuses a unit can carry for a while and that therefore need an icon (knockback is never stored). */
export function iconStatuses(data: GameData): string[] {
  return [...new Set(Object.values(data.balance.element.statusOf))].filter((s) => s !== 'knockback').sort();
}

/** Every stored status needs `art/status/source/<id>.png`; `images` are the ids found there (undefined: not checked). */
export function validateStatusIcons(data: GameData, images?: Set<string>): ContentIssue[] {
  if (!images) return [];
  return iconStatuses(data)
    .filter((id) => !images.has(id))
    .map((id) => ({ file: 'balance.yaml', message: `status ${id}: no icon art/status/source/${id}.png` }));
}
