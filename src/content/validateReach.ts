/**
 * Reachability of scenes and flags (architecture review 2026-11-07, M6): scenes nothing plays, flags set but never read
 * and flags read but never set. Content plays a scene when any other content names its id; the game code plays the
 * scenes it builds from ids (`scn.bark.<char>`, `scn.farewell.<char>`, `scn.lt.<lieutenant>`) and sets `joined_<lieutenant>`.
 */
import type { FlagValue } from '../core/defs';
import type { GameData } from '../core/gameData';
import type { MapDef } from '../core/mapDefs';
import { flagEntry } from '../core/campaign/effects';
import { joinedFlag } from '../core/campaign/lieutenants';
import type { ContentIssue } from './load';

/** Scene ids the game code builds for a character or lieutenant id (src/app/battle/barks.ts, src/core/campaign/farewellView.ts, lieutenants). */
const CODE_SCENES = ['scn.bark.', 'scn.farewell.', 'scn.lt.'] as const;

/** Every string and object of `value`, depth first. */
function walk(value: unknown, onString: (s: string) => void, onObject: (o: Record<string, unknown>) => void): void {
  if (typeof value === 'string') return onString(value);
  if (Array.isArray(value)) return value.forEach((v) => walk(v, onString, onObject));
  if (value && typeof value === 'object') {
    onObject(value as Record<string, unknown>);
    for (const v of Object.values(value)) walk(v, onString, onObject);
  }
}

const flagName = (ref: unknown): string => flagEntry(ref as string | Record<string, FlagValue>)[0];

/**
 * Findings for content:check (warnings): `drafts` are the level drafts of acts still in planning (src/content/drafts.ts), which
 * already set and read flags of their act.
 */
export function checkReachability(data: GameData, drafts: readonly MapDef[] = []): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const named = new Set<string>();
  const set = new Set<string>();
  const read = new Set<string>();
  const onObject = (o: Record<string, unknown>) => {
    const keys = Object.keys(o);
    // effect `setFlag`, trigger action `set_flag`
    if (keys.length === 1 && keys[0] === 'setFlag') set.add(flagName(o.setFlag));
    if (o.action === 'set_flag' && typeof o.flag === 'string') set.add(o.flag);
    // condition `flag`, waves `unlessFlag`
    if (keys.length === 1 && keys[0] === 'flag') read.add(flagName(o.flag));
    if (typeof o.unlessFlag === 'string') read.add(o.unlessFlag);
  };
  const { scenes, flags, ...rest } = data;
  walk(rest, (s) => named.add(s), onObject);
  walk(drafts, (s) => named.add(s), onObject);
  // scene lines carry conditions and the answers effects; a scene naming itself does not play it
  for (const sc of Object.values(scenes)) walk(sc.lines, () => {}, onObject);
  // sealed chronicle pages read their flag in the code (src/core/campaign/chronicle.ts)
  for (const e of data.balance.chronicle.sealed) read.add(e.flag);
  for (const lt of Object.keys(data.lieutenants)) set.add(joinedFlag(lt));

  for (const id of Object.keys(scenes)) {
    if (named.has(id)) continue;
    const owner = CODE_SCENES.find((p) => id.startsWith(p));
    if (owner) {
      const who = id.slice(owner.length);
      if (owner === 'scn.lt.' ? data.lieutenants[who] : data.chars[who] || named.has(who)) continue;
    }
    issues.push({ file: `scenes/${id}`, message: 'scene is never played (no content names it)' });
  }
  for (const id of Object.keys(flags).sort()) {
    if (set.has(id) && !read.has(id)) issues.push({ file: 'flags.yaml', message: `flag ${id} is set but never read` });
    if (read.has(id) && !set.has(id)) issues.push({ file: 'flags.yaml', message: `flag ${id} is read but never set` });
    if (!set.has(id) && !read.has(id)) issues.push({ file: 'flags.yaml', message: `flag ${id} is neither set nor read` });
  }
  return issues;
}
