import type { Effect, GameData, Mood, Team, SceneDef, SceneLine, SceneSpeech, Stance } from '../defs';
import { PERMANENT_COMPANIONS } from '../defs';
import { evalConditions, type ConditionContext } from './conditions';

/** Text key of a scene line (architecture §5.8): `dlg.<scene>.<line>`. */
export const lineKey = (scene: string, line: string): string => `dlg.${scene}.${line}`;
export const memorialKey = (scene: string, line: string): string => `${lineKey(scene, line)}.memorial`;
export const optionKey = (scene: string, line: string, option: string): string => `${lineKey(scene, line)}.${option}`;

export interface ResolvedOption {
  id: string;
  key: string;
  stance: Stance;
  effects: Effect[];
}

/** A line the player gets to see, or the choice that follows. `uid` is unique within the scene. */
export type ResolvedLine =
  | { kind: 'line'; uid: string; line: string; key: string; speaker?: string; mood: Mood; memorial: boolean }
  | { kind: 'choice'; uid: string; line: string; options: ResolvedOption[] };

/** Whether a companion can speak: avatar and kael always, everyone else unless fallen or gone (an NPC who never joined can). */
export function canSpeak(ctx: ConditionContext, id: string): boolean {
  return PERMANENT_COMPANIONS.includes(id) || !(ctx.fallen.includes(id) || ctx.left.includes(id));
}

const speakerTeams = new WeakMap<GameData, Map<string, Team>>();

/**
 * Team a scene speaker stands on: the team of the first map unit that carries the id (or is the character), so enemy
 * lieutenants and neutral figures are marked in the dialogue from the map data. Everyone else is on the player's side.
 */
export function speakerTeam(data: GameData, speaker: string): Team {
  let teams = speakerTeams.get(data);
  if (!teams) {
    teams = new Map();
    for (const map of Object.values(data.maps)) {
      const spawned = map.triggers.flatMap((t) => t.then.flatMap((a) => (a.action === 'spawn' ? a.units : [])));
      const all = [...map.units, ...map.reinforcements.flatMap((r) => r.units), ...spawned];
      for (const u of all) for (const key of [u.id, u.char]) if (key && !teams.has(key)) teams.set(key, u.team);
    }
    speakerTeams.set(data, teams);
  }
  return teams.get(speaker) ?? 'player';
}

/** The first figure of the chain who can speak, `undefined` when nobody can. */
export function pickSpeaker(ctx: ConditionContext, chain: readonly string[]): string | undefined {
  return chain.find((id) => canSpeak(ctx, id));
}

function resolveSpeech(scene: SceneDef, l: SceneSpeech, ctx: ConditionContext, out: ResolvedLine[]): void {
  if (!l.speaker) {
    out.push({ kind: 'line', uid: l.id, line: l.id, key: lineKey(scene.id, l.id), mood: l.mood, memorial: false });
    return;
  }
  const speaker = pickSpeaker(ctx, l.speaker);
  if (speaker) out.push({ kind: 'line', uid: l.id, line: l.id, key: lineKey(scene.id, l.id), speaker, mood: l.mood, memorial: false });
  // the first figure of the chain has fallen (gone for good is not a death): a memorial line follows
  if (l.memorial && ctx.fallen.includes(l.speaker[0]!)) {
    const m = pickSpeaker(ctx, l.memorial.speaker);
    if (m) out.push({ kind: 'line', uid: `${l.id}.memorial`, line: l.id, key: memorialKey(scene.id, l.id), speaker: m, mood: l.memorial.mood, memorial: true });
  }
}

/**
 * The lines of a scene as the player sees them (architecture §5.8): the first speaker of each chain who can speak,
 * lines with unmet `requires` dropped, memorial lines inserted. Pure; the UI localises by `key`.
 */
export function resolveScene(data: GameData, ctx: ConditionContext, sceneId: string): ResolvedLine[] {
  const scene = data.scenes[sceneId];
  if (!scene) throw new Error(`unknown scene ${sceneId}`);
  const out: ResolvedLine[] = [];
  for (const l of scene.lines as SceneLine[]) {
    if (!evalConditions(ctx, l.requires)) continue;
    if ('choice' in l)
      out.push({
        kind: 'choice',
        uid: l.id,
        line: l.id,
        options: l.choice.map((o) => ({ id: o.id, key: optionKey(scene.id, l.id, o.id), stance: o.stance, effects: o.effects ?? [] })),
      });
    else resolveSpeech(scene, l, ctx, out);
  }
  return out;
}

/** Every text key a scene needs, with its German text (the scene holds it). */
export function sceneTexts(scene: SceneDef): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of scene.lines) {
    if ('choice' in l) for (const o of l.choice) out[optionKey(scene.id, l.id, o.id)] = o.text;
    else {
      out[lineKey(scene.id, l.id)] = l.text;
      if (l.memorial) out[memorialKey(scene.id, l.id)] = l.memorial.text;
    }
  }
  return out;
}

/** Whether the player has seen scene `id` to the end (or skipped it). */
export const sceneSeen = (seen: readonly string[], id: string): boolean => seen.includes(id);

/**
 * Where Skip goes from line `from`: the index of the first choice at or after it (its effects must always run), or
 * `-1` when no choice follows and the scene may end at once. Pure.
 */
export function skipTarget(lines: readonly ResolvedLine[], from: number): number {
  for (let i = Math.max(0, from); i < lines.length; i++) if (lines[i]!.kind === 'choice') return i;
  return -1;
}

/**
 * Splits a text into speech-bubble pages of at most `maxChars` characters, cut at spaces (a bubble holds two lines).
 * A word longer than the limit stays whole. Pure.
 */
export function bubblePages(text: string, maxChars: number): string[] {
  const pages: string[] = [];
  let cur = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (cur && cur.length + 1 + word.length > maxChars) {
      pages.push(cur);
      cur = word;
    } else cur = cur ? `${cur} ${word}` : word;
  }
  if (cur) pages.push(cur);
  return pages.length ? pages : [text];
}
