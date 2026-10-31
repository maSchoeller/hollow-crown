/** State of the battle screen (Battle.tsx): its useState and useRef values and the visible battle state. */
import type { Bark } from '../battle/barks';
import { BoardView } from '../../render/board/board';
import type { CutInEvent } from '../../render/board/boardTypes';
import type { CutInShown } from './CutIn';
import { type GameEvent, type ItemInstance, type Pos, type RecapRow, type Stats, type Team, fogOn, resolveScene, visibleState } from '../../core';
import type { Mode } from './battleMode';
import { battle } from '../state/battle';
import { data } from '../state/session';
import { settings } from '../state/settings';
import { storyContext } from '../state/flow';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { wantedUid } from '../state/wanted';

export function useBattleScreen() {
  const session = battle.value!;
  /** the state as the player's side sees it: on a fog map foes on unseen tiles are missing (story 2.6); `full` only for what the player may know anyway */
  const full = session.state;
  const fogged = fogOn(data, full);
  const s = useMemo(() => visibleState(data, full, 'player'), [full]);
  const stageRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<BoardView | null>(null);
  const [mode, setMode] = useState<Mode>({ k: 'idle' });
  const [busy, setBusy] = useState(true);
  /** the board is still being built: a cover says so, because nothing on the map reacts yet */
  const [loading, setLoading] = useState(true);
  const [danger, setDanger] = useState(settings.value.dangerDefault);
  const [watch, setWatch] = useState<string[]>([]);
  const [info, setInfo] = useState<string | null>(null);
  /** the wanted poster of a lieutenant is open (story 3.6); it shows his danger zone, too */
  const wanted = wantedUid.value;
  const setWanted = (uid: string | null) => (wantedUid.value = uid);
  const watchRef = useRef<string[]>(watch);
  watchRef.current = watch;
  // the zone goes on with the poster and off with it again, unless the player had switched it on for this unit before (review R4)
  useEffect(() => {
    if (!wanted || watchRef.current.includes(wanted)) return;
    setWatch((w) => (w.includes(wanted) ? w : [...w, wanted]));
    return () => setWatch((w) => w.filter((x) => x !== wanted));
  }, [wanted]);
  useEffect(() => () => setWanted(null), []);
  const [tileInfo, setTileInfo] = useState<Pos | null>(null);
  const [banner, setBanner] = useState<{ text: string; cls: string } | null>(null);
  /** the cut-in band of a critical hit (story 8.6) */
  const [cutIn, setCutIn] = useState<CutInShown | null>(null);
  const cutSeq = useRef(0);
  const [dialogue, setDialogue] = useState<{ id: string; done: () => void; band?: boolean } | null>(null);
  const [bark, setBark] = useState<{ b: Bark; seq: number; done: () => void } | null>(null);
  const [levelUp, setLevelUp] = useState<{ uid: string; gains: Partial<Stats>; level: number; done: () => void } | null>(null);
  const [toast, setToastState] = useState<{ text: string; item?: ItemInstance } | null>(null);
  const setToast = (text: string, item?: ItemInstance) => setToastState({ text, item });
  const [menu, setMenu] = useState(false);
  const [classPick, setClassPick] = useState(false);
  /** why a dimmed dock slot does nothing (shown as a pill, gone on the next move) */
  const [reason, setReason] = useState<string | null>(null);
  /** phase being played (the state already holds the result of the whole phase while the board animates) */
  const [phaseView, setPhaseView] = useState<{ phase: Team; turn: number } | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [objectives, setObjectives] = useState(false);
  const [trade, setTrade] = useState<{ a: string; b: string } | null>(null);
  const [convoy, setConvoy] = useState<string | null>(null);
  const [items, setItems] = useState<{ uid: string; to: Pos; list: string[] } | null>(null);
  const [hp, setHp] = useState<Record<string, number>>({});
  /** what the last foe phase did (story 13.7); closed by the first tap on the board or a selection */
  const [recap, setRecap] = useState<{ turn: number; rows: RecapRow[] } | null>(null);
  /** the field under the mouse while a unit is selected (PC hover, story 13.6) */
  const [hover, setHover] = useState<Pos | null>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  /** the Nachsetzen chance the player let go (key of `s.pursue` and the turn); the core keeps it until the next command */
  const [pursueDone, setPursueDone] = useState<string | null>(null);
  const wide = useWide();

  const unit = (uid: string) => s.units.find((u) => u.uid === uid)!;

  /** Whether scene `id` can play as a speech band: only spoken lines, no answers. Where the speakers stand does not matter. */
  const bandScene = (id: string): boolean => {
    const lines = resolveScene(data, storyContext(), id);
    return lines.length > 0 && lines.every((l) => l.kind === 'line' && !!l.speaker);
  };

  // handlers the board calls; set each render by the input and presentation hooks
  const tapRef = useRef<(p: Pos) => void>(() => undefined);
  const longRef = useRef<(p: Pos) => void>(() => undefined);
  const cancelRef = useRef<() => void>(() => undefined);
  const cutInRef = useRef<(c: CutInEvent) => void>(() => undefined);
  const eventRef = useRef<(e: GameEvent) => Promise<void> | void>(() => undefined);
  const openingBark = useRef<Bark | null>(null);
  /** opening lines of the enemy lieutenants (story 3.3): who has spoken, and whether the start events are through */
  const ltSpoken = useRef(new Set<string>());
  const ltReady = useRef(false);
  /** lieutenants that have spoken their flee line (story 3.2) */
  const fleeSpoken = useRef(new Set<string>());
  const barkSeq = useRef(0);

  return {
    session, full, fogged, s, stageRef, floatRef, topRef, bottomRef, boardRef, mode, setMode, busy, setBusy, loading, setLoading, danger, setDanger, watch, setWatch, info, setInfo, wanted, setWanted, watchRef, tileInfo, setTileInfo, banner, setBanner, cutIn, setCutIn, cutSeq, dialogue, setDialogue, bark, setBark, levelUp, setLevelUp, toast, setToastState, setToast, menu, setMenu, classPick, setClassPick, reason, setReason, phaseView, setPhaseView, confirmEnd, setConfirmEnd, objectives, setObjectives, trade, setTrade, convoy, setConvoy, items, setItems, hp, setHp, recap, setRecap, hover, setHover, chipRef, pursueDone, setPursueDone, wide, unit, bandScene, tapRef, longRef, cancelRef, cutInRef, eventRef, openingBark, ltSpoken, ltReady, fleeSpoken, barkSeq,
  };
}

/** Everything the parts of the battle screen share: state, refs and the visible state. */
export type BattleScreen = ReturnType<typeof useBattleScreen>;

function useWide(): boolean {
  const q = '(min-width: 600px)';
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}
