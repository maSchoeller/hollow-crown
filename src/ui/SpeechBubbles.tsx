import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { bubblePages, resolveScene, speakerTeam, type ConditionContext, type GameData } from '../core';
import { t } from '../i18n';
import { SceneTools } from './SceneTools';
import './Dialogue.css';

export interface SpeechBubblesProps {
  data: GameData;
  id: string;
  ctx: ConditionContext;
  /** screen point (px, relative to this layer) above the head of `speaker`'s figure; `null` when it is not on the board */
  anchorOf: (speaker: string) => Promise<{ x: number; y: number } | null>;
  seen?: boolean;
  /** play only these lines of the scene (a bark); the scene is not marked seen, has no skip/auto pills and advances on its own */
  only?: string[];
  /** board speed (barks only): the auto-advance time is divided by it */
  speed?: number;
  onSeen?: (id: string) => void;
  auto: boolean;
  onAuto: () => void;
  onDone: () => void;
}

/** One speaker's page of text: at most two lines (`balance.scene.bubbleMaxChars`). */
interface Page {
  uid: string;
  speaker: string;
  text: string;
}

/**
 * Battle scene as speech bubbles at the speakers' heads (trigger, lieutenant quote). Blocks the board until a tap, or
 * `balance.scene.bubbleAutoMs` in auto mode. Only for scenes without choices where every speaker stands on the board.
 */
export function SpeechBubbles({ data, id, ctx, anchorOf, seen = false, only, speed = 1, auto, onAuto, onSeen, onDone }: SpeechBubblesProps) {
  const cfg = data.balance.scene;
  const pages = useMemo<Page[]>(
    () =>
      resolveScene(data, ctx, id).flatMap((l) =>
        l.kind === 'line' && l.speaker && (!only || only.includes(l.line)) ? bubblePages(t(l.key), cfg.bubbleMaxChars).map((text, i) => ({ uid: `${l.uid}.${i}`, speaker: l.speaker!, text })) : [],
      ),
    [data, id, only?.join()],
  );
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [shift, setShift] = useState(0);
  const [wasSeen] = useState(seen);
  const layer = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const page = pages[idx];

  const finish = () => {
    if (!only) onSeen?.(id);
    onDone();
  };
  useEffect(() => {
    if (!page) finish();
  }, [idx]);

  // the camera moves to the speaker first, then the bubble appears at the head
  useEffect(() => {
    if (!page) return;
    let live = true;
    setPos(null);
    void anchorOf(page.speaker).then((p) => {
      if (!live) return;
      if (p) setPos(p);
      else setIdx((i) => i + 1); // not on the board any more: this page is dropped
    });
    return () => {
      live = false;
    };
  }, [idx]);

  // a bark never waits for a tap: it blocks only briefly, also outside auto mode (story 9.13, UX "Sprechblase blockiert kurz")
  useEffect(() => {
    if ((!auto && !only) || !pos) return;
    const timer = setTimeout(() => setIdx((i) => i + 1), only ? cfg.bubbleAutoMs / speed : cfg.bubbleAutoMs);
    return () => clearTimeout(timer);
  }, [auto, pos, idx]);

  // keep the bubble inside the layer; the tail keeps pointing at the head
  useLayoutEffect(() => {
    if (!pos || !box.current || !layer.current) return setShift(0);
    const half = box.current.offsetWidth / 2;
    const w = layer.current.clientWidth;
    const x = Math.min(Math.max(pos.x, half + 8), w - half - 8);
    setShift(x - pos.x);
  }, [pos, idx]);

  if (!page) return null;
  const next = () => setIdx(idx + 1);
  return (
    <div class="bubble-layer" ref={layer} onClick={next}>
      {!only && <SceneTools seen={wasSeen} auto={auto} onAuto={onAuto} onSkip={finish} />}
      {pos && (
        <div
          key={page.uid}
          ref={box}
          class="bubble"
          role="status"
          style={{ left: `${pos.x + shift}px`, top: `${pos.y}px`, '--bubble-tail': `calc(50% - ${shift}px)` }}
        >
          <span class={`bubble__name bubble__name--${speakerTeam(data, page.speaker)}`}>{page.speaker === 'avatar' ? t('unit.avatar.name') : t(`unit.${page.speaker}.name`)}</span>
          <span class="bubble__text">{page.text}</span>
        </div>
      )}
    </div>
  );
}
