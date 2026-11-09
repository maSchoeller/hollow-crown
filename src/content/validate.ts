import type { GameData } from '../core/gameData';
import { validateCampaign, validateSideQuests } from './validateCampaign';
import { validateHandbook } from './validateHandbook';
import { validateHauntPools } from './validateHaunts';
import { validateLieutenants, type LieutenantFiles } from './validateLieutenants';
import { validateLocales } from './validateLocales';
import { validatePropVariants, validateSeasons, validateStatusIcons, validateWeather } from './validateLook';
import { validateMap, validateMapFlags } from './validateMap';
import { contentRefs } from './validateRefs';
import { validateRelics } from './validateRelics';
import { validateScenes, validateSupports } from './validateScenes';
import { validateUnits } from './validateUnits';
import type { ContentIssue, Locales } from './load';


/** Cross-reference checks that Zod cannot express (concept/11 §2 Validierung, §9). */
export function validateContent(
  data: GameData,
  locales: Locales,
  spriteIds?: Set<string>,
  /** ids of the painted images in art/items (content:check passes them); every item needs one */
  itemImages?: Set<string>,
  /** ids of the place images (art/mockups/locations-s1, source files; content:check passes them): every `place` and scene `background` must have one */
  placeImages?: Set<string>,
  /** portraits and figure models of the lieutenants (content:check passes them; a missing file is a warning) */
  lieutenantFiles?: LieutenantFiles,
  /** ids of the status icons in art/status/source (content:check passes them) */
  statusImages?: Set<string>,
): ContentIssue[] {
  // the maps of haunts (`haunt~…`) are made at play time from a story map and are no content of their own
  if (Object.keys(data.maps).some((id) => id.startsWith('haunt~'))) data = { ...data, maps: Object.fromEntries(Object.entries(data.maps).filter(([id]) => !id.startsWith('haunt~'))) };
  const issues: ContentIssue[] = [];
  const err = (file: string, message: string) => issues.push({ file, message });
  const refs = contentRefs(data, err);
  validateUnits(data, err, refs, itemImages);
  validateRelics(data, err, refs, itemImages);
  for (const map of Object.values(data.maps)) validateMap(data, map, err, refs.item, refs.battleDialogue, refs.reward, locales, refs.conditions);
  issues.push(...validateWeather(data), ...validateSeasons(data), ...validatePropVariants(data), ...validateStatusIcons(data, statusImages));
  validateCampaign(data, locales, err, refs, placeImages);
  validateSupports(data, err, refs);
  validateLieutenants(data, locales, err, lieutenantFiles);
  validateHauntPools(data, locales, err, spriteIds);
  validateHandbook(data, locales, err);
  validateMapFlags(data, refs);
  validateScenes(data, locales, err, refs, placeImages);
  validateSideQuests(data, err, refs.openedQuests);
  validateLocales(data, locales, err, spriteIds);
  return issues;
}
