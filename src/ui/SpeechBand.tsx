import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { bubblePages, resolveScene, speakerTeam, type ConditionContext, type GameData } from '../core';
import { t } from '../i18n';
import { SceneTools } from './SceneTools';
import './Dialogue.css';

export interface SpeechBandProps {
  data: GameData;
  id: string;
  ctx: ConditionContext;
  /** round head of a speaker: the band is fixed to the screen, so the portrait (not a figure on the board) says who speaks */
  head: (speaker: string) => ComponentChildren;
  seen?: boolean;
  /** play only these lines of the scene (a bark); the scene is not marked seen, has no skip/auto pills and advances on its own */
  only?: string[];
  /** values for placeholders in the lines (`{target}`) */
  params?: Record<string, string>;
  /** board speed (barks only): the auto-advance time is divided by it */
  speed?: number;
  onSeen?: (id: string) => void;
  auto: boolean;
  onAuto: () => void;
  onDone: () => void;
  /** element at the right end of the band, e.g. the context "?" of a lesson (story 14.7); a tap on it does not advance */
  aside?: ComponentChildren;
}

/** One speaker's page of text: at most two lines (`balance.scene.bubbleMaxChars`). */
interface Page {
  uid: string;
  speaker: string;
  text: string;
}

/**
 * Battle scene as a band fixed to the top of the screen (trigger, lieutenant quote, bark): round head, name tag and at most two
 * lines. It does not hang at a figure, so the camera stays put and a speaker who is not on the board (or not drawn yet) is
 * heard all the same. Blocks the board until a tap, or `balance.scene.bubbleAutoMs` in auto mode. Only for scenes without
 * choices where every line has a speaker.
 */
export function SpeechBand({ data, id, ctx, head, seen = false, only, params, speed = 1, auto, onAuto, onSeen, onDone, aside }: SpeechBandProps) {
  const cfg = data.balance.scene;
  const pages = useMemo<Page[]>(
    () =>
      resolveScene(data, ctx, id).flatMap((l) =>
        l.kind === 'line' && l.speaker && (!only || only.includes(l.line)) ? bubblePages(t(l.key, params), cfg.bubbleMaxChars).map((text, i) => ({ uid: `${l.uid}.${i}`, speaker: l.speaker!, text })) : [],
      ),
    [data, id, only?.join(), JSON.stringify(params ?? {})],
  );
  const [idx, setIdx] = useState(0);
  const [wasSeen] = useState(seen);
  const page = pages[idx];

  const finish = () => {
    if (!only) onSeen?.(id);
    onDone();
  };
  useEffect(() => {
    if (!page) finish();
  }, [idx]);

  // a bark never waits for a tap: it blocks only briefly, also outside auto mode (story 9.13, UX "Sprechband blockiert kurz")
  useEffect(() => {
    if ((!auto && !only) || !page) return;
    const timer = setTimeout(() => setIdx((i) => i + 1), only ? cfg.bubbleAutoMs / speed : cfg.bubbleAutoMs);
    return () => clearTimeout(timer);
  }, [auto, idx]);

  if (!page) return null;
  const team = speakerTeam(data, page.speaker);
  return (
    <div class="band-layer" onClick={() => setIdx(idx + 1)}>
      {!only && <SceneTools seen={wasSeen} auto={auto} onAuto={onAuto} onSkip={finish} />}
      <div class="band" role="status">
        <span key={page.speaker} class={`band__head band__head--${team}`}>
          {head(page.speaker)}
        </span>
        <div class="band__body">
          <span class={`band__name band__name--${team}`}>{page.speaker === 'avatar' ? t('unit.avatar.name') : t(`unit.${page.speaker}.name`)}</span>
          <span class="band__text">{page.text}</span>
        </div>
        {aside}
      </div>
    </div>
  );
}
