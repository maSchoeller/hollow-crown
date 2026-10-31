import type { Team, Stance } from '../defs';
import type { GameData } from '../gameData';
import type { Effect, Mood, SceneChoice, SceneDef, SceneLine, SceneOption, SceneSpeech } from '../storyDefs';
import { PERMANENT_COMPANIONS } from '../defs';
import { evalConditions, type ConditionContext } from './conditions';

/** Text key of a scene line (architecture §5.8): `dlg.<scene>.<line>`. */
export const lineKey = (scene: string, line: string): string => `dlg.${scene}.${line}`;
export const memorialKey = (scene: string, line: string): string => `${lineKey(scene, line)}.memorial`;
export const optionKey = (scene: string, line: string, option: string): string => `${lineKey(scene, line)}.${option}`;
/** name of a decision (the choice line's `title`) */
export const decisionTitleKey = (scene: string, line: string): string => `${lineKey(scene, line)}.title`;
/** title of the consequence card of an answer (`summary`) */
export const summaryKey = (scene: string, line: string, option: string): string => `${optionKey(scene, line, option)}.summary`;
/** key of a choice in `CampaignState.choices` */
export const choiceKey = (scene: string, line: string): string => `${scene}#${line}`;

export interface ResolvedOption {
  id: string;
  key: string;
  stance: Stance;
  effects: Effect[];
  /** consequence card title (decisions only) */
  summaryKey?: string;
}

/** A line the player gets to see, or the choice that follows. `uid` is unique within the scene. */
export type ResolvedLine =
  | { kind: 'line'; uid: string; line: string; key: string; speaker?: string; mood: Mood; memorial: boolean; panel?: string; moment?: 'reward' }
  | { kind: 'choice'; uid: string; line: string; options: ResolvedOption[]; decision: boolean; titleKey?: string };

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
    out.push({ kind: 'line', uid: l.id, line: l.id, key: lineKey(scene.id, l.id), mood: l.mood, memorial: false, ...(l.panel ? { panel: l.panel } : {}), ...(l.moment ? { moment: l.moment } : {}) });
    return;
  }
  const speaker = pickSpeaker(ctx, l.speaker);
  if (speaker) out.push({ kind: 'line', uid: l.id, line: l.id, key: lineKey(scene.id, l.id), speaker, mood: l.mood, memorial: false, ...(l.panel ? { panel: l.panel } : {}), ...(l.moment ? { moment: l.moment } : {}) });
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
        decision: !!l.title,
        titleKey: l.title ? decisionTitleKey(scene.id, l.id) : undefined,
        options: l.choice.map((o) => ({
          id: o.id,
          key: optionKey(scene.id, l.id, o.id),
          stance: o.stance,
          effects: o.effects ?? [],
          summaryKey: o.summary ? summaryKey(scene.id, l.id, o.id) : undefined,
        })),
      });
    else resolveSpeech(scene, l, ctx, out);
  }
  return out;
}

/** Every text key a scene needs, with its German text (the scene holds it). */
export function sceneTexts(scene: SceneDef): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of scene.lines) {
    if ('choice' in l) {
      if (l.title) out[decisionTitleKey(scene.id, l.id)] = l.title;
      for (const o of l.choice) {
        out[optionKey(scene.id, l.id, o.id)] = o.text;
        if (o.summary) out[summaryKey(scene.id, l.id, o.id)] = o.summary;
      }
    }
    else {
      out[lineKey(scene.id, l.id)] = l.text;
      if (l.memorial) out[memorialKey(scene.id, l.id)] = l.memorial.text;
    }
  }
  return out;
}

/**
 * The illustration panel shown at line `idx`: the `panel` of the latest line up to there that sets one, `undefined` after
 * `none` or before any panel (the scene background shows). Pure; the UI decides whether the picture exists.
 */
export function panelAt(lines: readonly ResolvedLine[], idx: number): string | undefined {
  for (let i = Math.min(idx, lines.length - 1); i >= 0; i--) {
    const l = lines[i]!;
    if (l.kind === 'line' && l.panel !== undefined) return l.panel === 'none' ? undefined : l.panel;
  }
  return undefined;
}

/** Whether the player has seen scene `id` to the end (or skipped it). */
export const sceneSeen = (seen: readonly string[], id: string): boolean => seen.includes(id);

/**
 * Where Skip goes from line `from`: the index of the first open choice at or after it (its effects must always run), or
 * `-1` when no choice follows and the scene may end at once. A choice answered before (`answered`: its line ids) is
 * not asked again, so Skip runs past it. Pure.
 */
export function skipTarget(lines: readonly ResolvedLine[], from: number, answered: readonly string[] = []): number {
  for (let i = Math.max(0, from); i < lines.length; i++) if (lines[i]!.kind === 'choice' && !answered.includes(lines[i]!.line)) return i;
  return -1;
}

/** The choice line `line` of scene `scene` and its answer `option`, or `null` when one of them does not exist. */
export function findChoice(data: GameData, scene: string, line: string, option: string): { choice: SceneChoice; option: SceneOption } | null {
  const l = data.scenes[scene]?.lines.find((x) => x.id === line);
  if (!l || !('choice' in l)) return null;
  const o = l.choice.find((x) => x.id === option);
  return o ? { choice: l, option: o } : null;
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
