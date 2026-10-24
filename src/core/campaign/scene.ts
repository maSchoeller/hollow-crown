import type { Effect, GameData, Mood, SceneDef, SceneLine, SceneSpeech, Stance } from '../defs';
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
