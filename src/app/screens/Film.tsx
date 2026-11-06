/**
 * Film scene (epic 16): the story scene's lines over a 3D stage (FilmView) instead of the visual-novel background. Each line
 * the box shows cuts to its shot; the text, speakers, answers, log and skip are the scene's own (Dialogue).
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentProps } from 'preact';
import { filmCuts, filmStage, type FilmDef } from '../../core';
import { FilmView } from '../../render/film/filmView';
import { Dialogue } from '../../ui/Dialogue';
import { campaign, data } from '../state/session';
import { settings } from '../state/settings';
import './Film.css';

type DialogueProps = ComponentProps<typeof Dialogue>;

export function Film({ film, dialogue }: { film: FilmDef; dialogue: Omit<DialogueProps, 'film' | 'onIndex'> }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<FilmView | null>(null);
  // the stage stays black until the first shot stands (else the tilted board shows while the film loads)
  const [shown, setShown] = useState(false);
  const ready = useRef<Promise<void> | null>(null);
  // the box reports its first line before this effect has built the view (child effects run first): that cut waits here
  const pending = useRef<{ ids: readonly string[]; idx: number } | null>(null);
  useEffect(() => {
    const c = campaign.value;
    const state = c ? filmStage(data, c, film) : null;
    if (!state) return;
    const view = new FilmView(stageRef.current!, floatRef.current!, data, {});
    view.quality = settings.value.quality;
    view.calmMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    viewRef.current = view;
    ready.current = view.loadFilm(film, state);
    void ready.current
      .then(() => view.whenDrawn())
      .then(() => {
        if (viewRef.current === view) setShown(true);
      });
    if (pending.current) onIndex(pending.current.ids, pending.current.idx);
    return () => {
      viewRef.current = null;
      view.dispose();
    };
  }, [film.id]);
  const onIndex = (ids: readonly string[], idx: number) => {
    pending.current = { ids, idx };
    const cut = filmCuts(film, ids)[idx];
    if (!cut) return;
    void ready.current?.then(() => viewRef.current?.cut(cut.shot, cut.fresh));
  };
  return (
    <div class={`film ${film.letterbox ? 'film--letterbox' : ''}`}>
      <div class={`film-stage ${shown ? 'is-shown' : ''}`} ref={stageRef} />
      <div class="film-float" ref={floatRef} />
      <Dialogue {...dialogue} film onIndex={onIndex} />
    </div>
  );
}
