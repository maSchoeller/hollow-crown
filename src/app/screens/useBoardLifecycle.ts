/** Lifecycle of the 3D board on the battle screen (Battle.tsx). */
import { type BattleState, filterEvents, visibleState } from '../../core';
import { BoardView } from '../../render/board/board';
import { audio } from '../audio';
import { battle, pendingEvents } from '../state/battle';
import { clearGoalMark } from '../state/goalMarks';
import { data } from '../state/session';
import { loadHalfFigures } from '../state/halves';
import { preloadHeads } from './BattleHud';
import { settings } from '../state/settings';
import { useEffect } from 'preact/hooks';
import type { BattleScreen } from './useBattleScreen';
import type { BattlePresentation } from './battlePresentation';

/** Builds the board, plays the opening, keeps its options and layout in step with the screen. */
export function useBoardLifecycle(b: BattleScreen, show: BattlePresentation): void {
  const {
    boardRef, bottomRef, cancelRef, cutInRef, dialogue, eventRef, floatRef, longRef, ltReady, ltSpoken, openingBark,
    setBusy, setHover, setHp, setLoading, setPhaseView, stageRef, tapRef, topRef, wide,
  } = b;
  const { playBark, playLieutenantLines } = show;
  useEffect(loadHalfFigures, []);
  useEffect(() => {
    const board = new BoardView(stageRef.current!, floatRef.current!, data, {
      onTap: (p) => tapRef.current(p),
      onLongPress: (p) => longRef.current(p),
      onDoubleTap: (p) => void boardRef.current?.centerOn(p),
      onHover: (p) => setHover(p),
      onCancel: () => cancelRef.current(),
      onEvent: (e) => eventRef.current(e),
      onUnitHp: (uid, v) => setHp((h) => ({ ...h, [uid]: v })),
      onCutIn: (c) => cutInRef.current(c),
      insets: () => {
        const c = stageRef.current?.getBoundingClientRect();
        if (!c) return { top: 0, right: 0, bottom: 0, left: 0 };
        const top = topRef.current?.getBoundingClientRect();
        const bottom = bottomRef.current?.getBoundingClientRect();
        return {
          top: top ? Math.max(0, top.bottom - c.top) : 0,
          right: 0,
          bottom: bottom ? Math.max(0, c.bottom - bottom.top) : 0,
          left: 0,
        };
      },
    });
    boardRef.current = board;
    preloadHeads(battle.value!.state.units);
    board.quality = settings.value.quality;
    board.figures = settings.value.figures;
    board.grid = settings.value.grid;
    board.hpBars = settings.value.hpBars;
    board.shakeEnabled = settings.value.shake && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    board.calmMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let alive = true;
    void (async () => {
      const st0 = battle.value!.state;
      try {
        await board.load(visibleState(data, st0, 'player'));
      } finally {
        if (alive) setLoading(false);
      }
      const ev = pendingEvents.value;
      pendingEvents.value = [];
      if (ev.length && alive) {
        await board.play(filterEvents(data, st0, ev, 'player'), visibleState(data, st0, 'player'), st0.units);
      }
      const opening = openingBark.current;
      openingBark.current = null;
      if (opening && alive && settings.value.speed !== 3) await playBark(opening);
      // a battle taken up again (later round, "restart round"): whoever the company had seen before has spoken his line already;
      // the others speak at first sight (review R6). A state without `ltSeen` (older) keeps the old rule: nothing is played
      const now = battle.value!.state;
      if (now.turn > 1 && now.ltSeen) for (const u of now.units) if (u.lieutenant && now.ltSeen.includes(u.lieutenant)) ltSpoken.current.add(u.uid);
      if (alive) await playLieutenantLines(now.turn === 1 || !!now.ltSeen);
      ltReady.current = true;
      if (alive) {
        setPhaseView(null);
        setBusy(false);
      }
      audio.music(phaseMusic(battle.value!.state));
    })();
    return () => {
      alive = false;
      clearGoalMark();
      board.dispose();
    };
  }, []);

  // the options "Raster" and "Lebensleisten" apply at once (story 13.1, 13.3)
  const opt = settings.value;
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    board.grid = opt.grid;
    board.hpBars = opt.hpBars;
  }, [opt.grid, opt.hpBars]);

  // a visual-novel dialogue covers the board: it only needs the idle frame rate (the speech band leaves the board in view)
  const overlayDialogue = !!dialogue && !dialogue.band;
  useEffect(() => boardRef.current?.hold(overlayDialogue ? 'idle' : 'run'), [overlayDialogue]);

  // the bottom sheet changes height with the selection (and leaves in landscape); keep the map clear of the HUD
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const hud = new ResizeObserver(() => board.relayout());
    for (const el of [topRef.current, bottomRef.current]) if (el) hud.observe(el);
    return () => hud.disconnect();
  }, [wide]);
}

function phaseMusic(s: BattleState): string {
  return s.phase === 'player' ? 'battle_player' : 'battle_enemy';
}
