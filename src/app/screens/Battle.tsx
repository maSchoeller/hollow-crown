import { barkFor, type Bark } from '../battle/barks';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  active,
  onDifficulty,
  availableActions,
  classActionId,
  combinedRange,
  damageAtHit,
  destinations,
  castBlock,
  classPreview,
  filterEvents,
  fogBands,
  contextEntries,
  fogOn,
  forecast,
  holdZone,
  itemDef,
  itemTargets,
  killMarks,
  longPressView,
  passivePreview,
  pathTo,
  perilWarnings,
  phaseRecap,
  posKey,
  pursueReach,
  reachNow,
  resolveScene,
  samePos,
  stealBlock,
  threatMap,
  tileThreats,
  tilesInRange,
  unitAt,
  wantedView,
  visibleState,
  visibleTiles,
  weaponRange,
  type Action,
  type ActionOption,
  type BattleState,
  type BattleUnit,
  type Command,
  type GameEvent,
  type ItemInstance,
  type Pos,
  type ReachNode,
  type RecapRow,
  type Stats,
  type Team,
} from '../../core';
import { mapOf } from '../../core/battle/objectives';
import { BoardView, type CutInEvent, type KillKind } from '../../render/board/board';
import { t } from '../../i18n';
import { Scene, SceneBand } from './Scene';
import { CutIn, type CutInShown } from './CutIn';
import { cutInLineColour, cutInName, cutInPortrait } from '../battle/cutIn';
import { halfFigures, loadHalfFigures } from '../state/halves';
import { artId } from './unitArt';
import { itemName, Toast, unitName } from '../../ui/components';
import { goalLine, goalStand } from '../../ui/goalText';
import { Icon } from '../../ui/icons';
import { ItemImage, Piece, PrimaryButton, SecondaryButton } from '../../ui/pieces';
import './Loading.css';
import { audio } from '../audio';
import { fleeBark, ltBarks } from '../battle/ltLines';
import { campaign, data } from '../state/session';
import { concludeBattle, storyContext } from '../state/flow';
import { abandonBattle, battle, canAbandon, canRestart, command, commandOffThread, pendingEvents, restartBattle } from '../state/battle';
import { screen } from '../state/screen';
import { wantedUid } from '../state/wanted';
import { clearGoalMark, goalMarkTiles, markedGoal, toggleGoalMark } from '../state/goalMarks';
import { WantedDock } from './Wanted';
import { settings, updateSettings } from '../state/settings';
import { handbookSheet, openHandbook } from '../state/handbook';
import {
  BackPill,
  ContextBands,
  Dock,
  DockAction,
  ClassPreviewCard,
  ForecastCard,
  GoalPills,
  HintPill,
  MenuStone,
  PassiveRuleCard,
  PhasePill,
  preloadHeads,
  RosterPanel,
  roleIcon,
  SpeedControl,
  TerrainCard,
  TurnPill,
  UnitCardB,
} from './BattleHud';
import { BattleMenu, ClassPick, ConvoySheet, ItemPick, LevelUpPopup, ObjectivesPanel, StealPick, TradeSheet, UnitInfo } from './BattlePanels';
import { BackStone, EnemyStrip, RecapStone, TerrainChip, ThreatPill } from './BattleLegibility';

export { pendingEvents };

type Mode =
  | { k: 'idle' }
  | { k: 'selected'; uid: string }
  | { k: 'moved'; uid: string; to: Pos }
  | { k: 'target'; uid: string; to: Pos; action: 'attack' | 'staff' | 'talk' | 'rescue' | 'command' | 'item' | 'steal' | ClassKind; targets: string[]; item?: string }
  | { k: 'forecast'; uid: string; to: Pos; target: string; weapon?: string; aim?: boolean }
  /** preview of Fernbergen / Anfeuern before it is confirmed */
  | { k: 'classPreview'; uid: string; to: Pos; action: 'farRescue' | 'cheer'; target: string }
  /** Nachsetzen right after an attack (story 2.4): `to` is the chosen tile, null until one is tapped */
  | { k: 'pursue'; uid: string; to: Pos | null }
  /** rule card of a passive role (Halten, Nachsetzen), reached by a tap on its dock slot */
  | { k: 'passive'; uid: string; to: Pos }
  /** Wirken (story 2.5): pick a field in range (`at` null), then the preview of the affected fields and the confirmation */
  | { k: 'cast'; uid: string; to: Pos; at: Pos | null }
  /** Stehlen (story 2.6): the bag of the chosen foe is shown, one tap on an item takes it */
  | { k: 'steal'; uid: string; to: Pos; target: string };

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


/** Class slot of the dock: role actions (Zielen, Fernbergen, Anfeuern, story 2.3) and the skill actions of the PoC classes. */
const CLASS_KINDS: ActionOption['kind'][] = ['aim', 'farRescue', 'cheer', 'cast', 'steal', 'staff', 'command', 'rally'];
/** Class actions with a preview and a confirmation before they run. */
type ClassKind = 'aim' | 'farRescue' | 'cheer';

export function Battle() {
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
  const backRef = useRef<HTMLDivElement>(null);
  /** the Nachsetzen chance the player let go (key of `s.pursue` and the turn); the core keeps it until the next command */
  const [pursueDone, setPursueDone] = useState<string | null>(null);
  const wide = useWide();

  const unit = (uid: string) => s.units.find((u) => u.uid === uid)!;

  /** Whether scene `id` can play as a speech band: only spoken lines, no answers. Where the speakers stand does not matter. */
  const bandScene = (id: string): boolean => {
    const lines = resolveScene(data, storyContext(), id);
    return lines.length > 0 && lines.every((l) => l.kind === 'line' && !!l.speaker);
  };

  // --------------------------------------------------------------- board lifecycle
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

  // --------------------------------------------------------------- overlays
  const reachCache = useMemo(() => new Map<string, Map<string, ReachNode>>(), [s]);
  const reachOf = (u: BattleUnit) => {
    let r = reachCache.get(u.uid);
    if (!r) reachCache.set(u.uid, (r = reachNow(data, s, u)));
    return r;
  };
  const toPos = (k: string) => k.split(',').map(Number) as Pos;
  /** the danger zone in tiers (story 13.5): attackers per field, the fields only sleeping foes reach */
  const threat = useMemo(() => {
    if (!danger) return null;
    const m = threatMap(data, s, 'player');
    return { tiles: [...m.byTile].map(([k, l]) => [toPos(k), l.length] as [Pos, number]), sleeping: [...m.sleeping].map(toPos) };
  }, [s, danger]);
  /** the zone of single foes (tap, long press, wanted poster) as their outer edge */
  const watchTiles = useMemo(() => {
    if (!watch.length) return [] as Pos[];
    const m = threatMap(data, s, 'player', watch);
    return [...m.byTile.keys(), ...m.sleeping].map(toPos);
  }, [s, watch]);

  // the target-tile check (story 13.6): the field of a set ghost (phone) or the reachable field under the mouse (PC)
  const selUid = mode.k === 'selected' || mode.k === 'moved' ? mode.uid : null;
  const checkTile: Pos | null = (() => {
    if (s.phase !== 'player' || busy || s.outcome) return null;
    if (mode.k === 'moved') return mode.to;
    if (mode.k !== 'selected' || !hover) return null;
    const u = unit(mode.uid);
    return destinations(s, u, reachOf(u)).some((d) => samePos(d, hover)) ? hover : null;
  })();
  const checkKey = checkTile && selUid ? `${selUid}@${posKey(checkTile)}` : '';
  const checkFoes = useMemo(() => (checkTile && selUid ? tileThreats(data, s, unit(selUid), checkTile) : []), [s, checkKey]);
  const checkLines = checkTile ? checkFoes.map((uid) => [unit(uid).pos!, checkTile] as [Pos, Pos]).filter(([a]) => !!a) : [];
  const ghostAt = mode.k === 'moved' && !samePos(mode.to, unit(mode.uid).pos) ? mode.to : null;
  // the terrain chip below the checked field and the back stone beside the ghost ride on the board (pinned, moved with the camera)
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    board.pin('chip', chipRef.current, checkTile, { south: 0.5 });
    board.pin('back', backRef.current, ghostAt, { east: 0.62, lift: 0.45 });
  }, [checkKey, ghostAt?.[0], ghostAt?.[1]]);

  /** the fields under fog (story 2.6) and the lighter fringe where the fog fades out over one field */
  const fogTiles = useMemo(() => (fogged ? fogBands(full, visibleTiles(data, full, 'player')) : { fog: [], edge: [] }), [full]);

  /** the places of the side objective the player tapped in the HUD (goal marking, `markedGoal`) */
  const markedId = markedGoal.value;
  const markTiles = useMemo(() => goalMarkTiles(data, s, mapOf(data, s).objectives.side, markedId), [s, markedId]);

  // a tap on an objective brings its places into view (once per tap; the view stays when the marking ends)
  const markTilesRef = useRef(markTiles);
  markTilesRef.current = markTiles;
  useEffect(() => {
    if (markedId) void boardRef.current?.frameTiles(markTilesRef.current);
  }, [markedId]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const goal = (() => {
      const v = mapOf(data, s).objectives.victory;
      if (v.type === 'reach' || v.type === 'seize' || v.type === 'escape' || v.type === 'escort') {
        return 'rect' in v.area ? tilesInRect(v.area.rect) : v.area.tiles;
      }
      return [];
    })();
    // the player does not know the reinforcements of a fog map
    const reinforce = fogged ? [] : mapOf(data, s)
      .reinforcements.filter((r, i) => r.announce && !s.reinforcementsDone.includes(i) && r.turn === s.turn + (r.phase === 'player' ? 1 : 0))
      .flatMap((r) => onDifficulty(r.units, s.settings.difficulty).map((u) => u.at));
    // hold zones of hostile vanguards in danger mode (hatched)
    const hold = danger || watch.length ? [...holdZone(data, s, 'player')].map((k) => k.split(',').map(Number) as Pos) : [];
    const base = {
      threat: threat && { ...threat, numbers: opt.threatNumbers },
      watch: watchTiles,
      goal,
      reinforce,
      hold,
      fog: fogTiles.fog,
      fogEdge: fogTiles.edge,
      mark: markTiles,
      lines: checkLines,
    };
    if (mode.k === 'idle') return board.setOverlays({ ...base, cursor: tileInfo });
    const u = unit(mode.uid);
    if (mode.k === 'pursue') {
      const rest = pursueReach(data, s, u);
      if (!rest) return board.setOverlays({ ...base, cursor: tileInfo });
      const to = mode.to;
      const tiles = destinations(s, u, rest).filter((d) => !samePos(d, u.pos));
      return board.setOverlays({ ...base, move: tiles, path: to ? pathTo(rest, to) : [], ghost: to ? { uid: u.uid, pos: to } : null, cursor: to ?? u.pos });
    }
    const reach = reachOf(u);
    const dests = destinations(s, u, reach);
    if (mode.k === 'selected') {
      const range = combinedRange(data, s, u) ?? combinedRange(data, s, u, true);
      const hoverPath = checkTile && !samePos(checkTile, u.pos) ? pathTo(reach, checkTile) : [];
      const atk = new Set<string>();
      if (range) for (const d of dests) for (const p of tilesInRange(s, d, range)) atk.add(posKey(p));
      for (const d of dests) atk.delete(posKey(d));
      for (const o of s.units) if (o.pos && o.team !== 'enemy' && !o.gone) atk.delete(posKey(o.pos));
      const attack = [...atk].map((k) => k.split(',').map(Number) as Pos);
      const staves = !!combinedRange(data, s, u, true) && !combinedRange(data, s, u);
      return board.setOverlays({ ...base, move: dests, attack: staves ? [] : attack, heal: staves ? attack : [], path: hoverPath, cursor: checkTile ?? u.pos });
    }
    const to = mode.to;
    const ghost = samePos(to, u.pos) ? null : { uid: u.uid, pos: to };
    const path = samePos(to, u.pos) ? [] : pathTo(reach, to);
    if (mode.k === 'moved') {
      const opts = availableActions(data, s, u, to);
      const atk = opts.find((o) => o.kind === 'attack');
      const targets = (atk?.targets ?? []).map((id) => unit(id).pos!).filter(Boolean);
      return board.setOverlays({ ...base, move: dests, path, ghost, targets, cursor: to });
    }
    if (mode.k === 'target') {
      return board.setOverlays({ ...base, path, ghost, targets: mode.targets.map((id) => unit(id).pos!).filter(Boolean), cursor: to });
    }
    if (mode.k === 'cast') {
      const tiles = availableActions(data, s, u, to).find((o) => o.kind === 'cast')?.tiles ?? [];
      const pre = mode.at ? classPreview(data, s, u, to, { kind: 'cast', at: mode.at }) : null;
      return board.setOverlays({ ...base, path, ghost, targets: tiles.filter((p) => !mode.at || !samePos(p, mode.at)), cast: pre?.kind === 'cast' ? pre.area.tiles : [], cursor: mode.at ?? to });
    }
    if (mode.k === 'passive') {
      const pre = passivePreview(data, s, u, to);
      const zone = pre?.kind === 'hold' ? pre.tiles : [];
      return board.setOverlays({ ...base, hold: [...base.hold, ...zone], path, ghost, cursor: to });
    }
    return board.setOverlays({ ...base, path, ghost, targets: [unit(mode.target).pos!], cursor: unit(mode.target).pos });
  }, [mode, s, threat, watchTiles, tileInfo, markTiles, checkKey, opt.threatNumbers]);

  // the HUD grows when a unit is selected; bring the unit (or the chosen tile) out from under it
  const focus = mode.k === 'idle' ? null : mode.k === 'selected' ? unit(mode.uid).pos : mode.k === 'pursue' ? (mode.to ?? unit(mode.uid).pos) : mode.to;
  const focusKey = focus ? `${mode.k === 'selected' ? mode.uid : ''}:${focus[0]},${focus[1]}` : '';
  useEffect(() => {
    const board = boardRef.current;
    if (!board || !focus) return;
    const id = setTimeout(() => {
      if (!board.isVisible(focus)) void board.centerOn(focus);
    }, 60);
    return () => clearTimeout(id);
  }, [focusKey]);

  // --------------------------------------------------------------- command execution
  const run = async (cmd: Command) => {
    const board = boardRef.current!;
    // on a fog map the plan may lead through a foe the player does not see: the command carries the planned way, and the core
    // stops the unit in front of the foe (Hinterhalt)
    if (fogged && (cmd.type === 'move' || cmd.type === 'act' || cmd.type === 'pursue') && !cmd.path) {
      const u = unit(cmd.unit);
      const reach = cmd.type === 'pursue' ? pursueReach(data, s, u) : reachOf(u);
      const path = reach && !samePos(u.pos, cmd.to) ? pathTo(reach, cmd.to) : [];
      if (path.length > 1) cmd = { ...cmd, path };
    }
    setBusy(true);
    setMode({ k: 'idle' });
    setInfo(null);
    setTileInfo(null);
    setRecap(null);
    const enemy = cmd.type === 'endPhase';
    const before = battle.value!.state;
    if (enemy) setPhaseView({ phase: 'enemy', turn: s.turn });
    const sp = enemy ? settings.value.enemySpeed : settings.value.speed;
    board.speed = sp === 2 ? 2 : 1;
    board.skip = sp === 3;
    let events: GameEvent[] | null;
    try {
      // the enemy phase is computed in the core worker, player commands directly (architecture §5.13)
      events = enemy ? await commandOffThread(cmd) : command(cmd);
    } catch (e) {
      console.error(e);
      setPhaseView(null);
      setBusy(false);
      return;
    }
    if (!events) {
      // the battle was left or restarted while the worker computed; the answer was dropped
      setPhaseView(null);
      setBusy(false);
      return;
    }
    const after = battle.value!.state;
    const shown = filterEvents(data, after, events, 'player', before);
    await board.play(shown, visibleState(data, after, 'player'), after.units);
    // a lieutenant who came into sight by this command speaks his opening line (story 3.2: under fog it waits for the sight)
    if (ltReady.current && !battle.value!.state.outcome) await playLieutenantLines(true);
    board.skip = false;
    setHp({});
    setPhaseView(null);
    setBusy(false);
    const st = battle.value!.state;
    // what the foe phase did, as the player saw it (story 13.7); nothing when nothing happened
    if (enemy && !st.outcome) {
      const rows = phaseRecap(data, visibleState(data, before, 'player'), visibleState(data, st, 'player'), shown);
      if (rows.length) setRecap({ turn: before.turn, rows });
    }
    if (st.outcome) {
      await showBanner(t(st.outcome === 'victory' ? 'ui.battle.victory' : 'ui.battle.defeat'), st.outcome === 'victory' ? 'victory' : 'enemy', 1600);
      audio.sfx(st.outcome === 'victory' ? 'victory' : 'defeat');
      concludeBattle();
      return;
    }
    // auto end of phase when every unit has acted – not while a skirmisher may still pursue
    if (st.phase === 'player' && !st.pursue && !st.units.some((u) => u.team === 'player' && active(u) && !u.acted)) {
      setTimeout(() => void run({ type: 'endPhase' }), 350);
    }
  };

  const showBanner = (text: string, cls: string, ms = 1000) =>
    new Promise<void>((resolve) => {
      if (boardRef.current?.skip) return resolve();
      setBanner({ text, cls });
      setTimeout(() => {
        setBanner(null);
        resolve();
      }, ms / (boardRef.current?.speed ?? 1));
    });

  /** Builds the band of a critical hit from the attacker: portrait `angry` (letter medallion without one), name of the skill or weapon, speed line colour. */
  const cutInRef = useRef<(c: CutInEvent) => void>(() => undefined);
  cutInRef.current = (c) => {
    const u = battle.value!.state.units.find((x) => x.uid === c.unit);
    if (!u) return;
    const name = unitName(u);
    setCutIn({
      seq: ++cutSeq.current,
      team: u.team,
      name: cutInName(c.skill, u.equip.mainHand, { skill: (id) => t(`skill.${id}.name`), item: (i) => itemName(data, i) }),
      portrait: cutInPortrait(artId(u.portrait, u.classId), halfFigures.value, name),
      line: cutInLineColour(data, c.element, u.team),
      inMs: c.inMs,
      holdMs: c.holdMs,
      outMs: c.outMs,
    });
  };

  const eventRef = useRef<(e: GameEvent) => Promise<void> | void>(() => undefined);
  eventRef.current = async (e: GameEvent) => {
    switch (e.t) {
      case 'phase':
        audio.music(e.phase === 'player' ? 'battle_player' : 'battle_enemy');
        audio.sfx('phase');
        setPhaseView({ phase: e.phase, turn: e.turn });
        if (!boardRef.current?.skip) await new Promise((resolve) => setTimeout(resolve, 700 / (boardRef.current?.speed ?? 1)));
        break;
      case 'dialogue':
      case 'quote':
        if (!data.scenes[e.id]) break;
        {
          // a scene of spoken lines without answers plays as a speech band fixed to the screen: no camera move, no figure needed
          await new Promise<void>((resolve) => setDialogue({ id: e.id, done: resolve, band: bandScene(e.id) }));
          setDialogue(null);
        }
        break;
      case 'levelUp':
        audio.sfx('levelup');
        if (boardRef.current?.skip || unit(e.unit)?.team !== 'player') break;
        await new Promise<void>((resolve) => setLevelUp({ uid: e.unit, gains: e.gains, level: e.level, done: resolve }));
        setLevelUp(null);
        break;
      case 'strike':
        audio.sfx(!e.hit ? 'miss' : e.crit ? 'crit' : e.magic ? `magic_${e.element ?? 'light'}` : 'hit');
        break;
      case 'ambush':
        audio.sfx('downed');
        setToast(t('ui.toast.ambush', { name: unitName(unit(e.by) ?? { nameKey: 'class.brigand.name' }) }));
        break;
      case 'mastered':
        setToast(t('ui.toast.mastered', { skill: t(`skill.${e.skill}.name`) }));
        break;
      case 'recruited':
        audio.sfx('recruit');
        setToast(t('ui.toast.recruited', { name: unitName(unit(e.unit) ?? { nameKey: `unit.${e.unit}.name` }) }));
        break;
      case 'loot':
        audio.sfx('loot');
        setToast(t(e.toConvoy ? 'ui.toast.lootConvoy' : 'ui.toast.loot', { item: itemName(data, e.item) }), e.item);
        break;
      case 'gold':
        audio.sfx('gold');
        setToast(t('ui.toast.gold', { n: e.amount }));
        break;
      case 'razed':
        setToast(t('ui.toast.razed'));
        break;
      case 'downed':
        audio.sfx('downed');
        break;
      case 'died':
        audio.sfx('death');
        break;
      case 'fled': {
        audio.sfx('downed');
        // the flee line after the jump (story 3.2); skip mode leaves it out
        const st = battle.value!.state;
        const play = !boardRef.current?.skip && settings.value.speed !== 3;
        const line = fleeBark(data, campaign.value, st, e.unit, e.by, fleeSpoken.current, play);
        if (line) await playBark(line);
        break;
      }
      case 'heal':
        audio.sfx('heal');
        break;
      default:
        break;
    }
    // combat bark (story 9.13): presentation only, skipped in skip mode; the opening bark waits until the start events
    // (intro and tutorial dialogues) have played
    const b = boardRef.current?.skip ? null : barkFor(data, s, e);
    if (b?.line === 'battle_start') openingBark.current = b;
    else if (b) await playBark(b);
    if (ltReady.current && ((e.t === 'phase' && e.phase === 'player') || e.t === 'spawned')) await playLieutenantLines(true);
  };
  const openingBark = useRef<Bark | null>(null);
  /** opening lines of the enemy lieutenants (story 3.3): who has spoken, and whether the start events are through */
  const ltSpoken = useRef(new Set<string>());
  const ltReady = useRef(false);
  /** lieutenants that have spoken their flee line (story 3.2) */
  const fleeSpoken = useRef(new Set<string>());
  const playLieutenantLines = async (play: boolean) => {
    const st = battle.value!.state;
    const skip = !play || boardRef.current?.skip || settings.value.speed === 3;
    for (const b of ltBarks(data, campaign.value, st, ltSpoken.current, !skip)) await playBark(b);
  };
  const barkSeq = useRef(0);
  const playBark = async (b: Bark) => {
    await new Promise<void>((resolve) => setBark({ b, seq: ++barkSeq.current, done: resolve }));
    setBark(null);
  };

  // --------------------------------------------------------------- input handling
  const playerTurn = s.phase === 'player' && !busy && !s.outcome;

  // kill markers of the selected unit (story 13.4) and warnings over own units in danger (story 13.6)
  const kills = useMemo(() => (selUid && playerTurn ? killMarks(data, s, unit(selUid)) : []), [s, selUid, playerTurn]);
  const perils = useMemo(() => (playerTurn ? perilWarnings(data, s) : []), [s, playerTurn]);
  useEffect(() => {
    const m = new Map<string, KillKind>();
    for (const k of kills) m.set(k.target, k.flees ? (k.kind === 'hit' ? 'flee' : 'fleeCrit') : k.kind);
    for (const uid of perils) m.set(uid, 'warn');
    boardRef.current?.setMarks(m);
  }, [kills, perils]);

  const selectable = (u?: BattleUnit) => !!u && u.team === 'player' && active(u) && !u.acted;

  const bestTileToAttack = (u: BattleUnit, target: BattleUnit, from: Pos | null): { to: Pos; weapon?: string } | null => {
    const reach = reachOf(u);
    const cands = from ? [from] : destinations(s, u, reach);
    let best: { to: Pos; weapon?: string; cost: number } | null = null;
    for (const p of cands) {
      const opts = availableActions(data, s, u, p).find((o) => o.kind === 'attack');
      const ws = opts?.weapons?.[target.uid];
      if (!ws?.length) continue;
      const cost = reach.get(posKey(p))?.cost ?? 0;
      if (!best || cost < best.cost) best = { to: p, weapon: ws[0], cost };
    }
    return best;
  };

  const tapRef = useRef<(p: Pos) => void>(() => undefined);
  tapRef.current = (p: Pos) => {
    if (!playerTurn) return;
    if (recap) setRecap(null);
    audio.sfx('tap');
    const at = unitAt(s, p);
    switch (mode.k) {
      case 'idle': {
        if (selectable(at)) {
          setMode({ k: 'selected', uid: at!.uid });
          setInfo(null);
          setTileInfo(null);
        } else if (at) {
          setInfo(at.uid);
          if (at.team === 'enemy') setWatch((w) => (w.includes(at.uid) ? w.filter((x) => x !== at.uid) : [...w, at.uid]));
          setTileInfo(p);
        } else {
          setInfo(null);
          setTileInfo(p);
        }
        return;
      }
      case 'selected':
      case 'moved': {
        const u = unit(mode.uid);
        const reach = reachOf(u);
        const dests = destinations(s, u, reach);
        if (at && at.uid === u.uid && mode.k === 'selected') return setMode({ k: 'moved', uid: u.uid, to: u.pos! });
        if (mode.k === 'moved' && samePos(p, mode.to)) return; // action bar is already shown
        if (at && at.team === 'enemy' && (active(at) || at.downed)) {
          const from = mode.k === 'moved' ? mode.to : null;
          const best = bestTileToAttack(u, at, from) ?? (from ? bestTileToAttack(u, at, null) : null);
          if (best) return setMode({ k: 'forecast', uid: u.uid, to: best.to, target: at.uid, weapon: best.weapon });
          setInfo(at.uid);
          return;
        }
        if (dests.some((d) => samePos(d, p))) return setMode({ k: 'moved', uid: u.uid, to: p });
        if (selectable(at)) return setMode({ k: 'selected', uid: at!.uid });
        setMode({ k: 'idle' });
        return;
      }
      case 'target': {
        if (!at || !mode.targets.includes(at.uid)) return;
        if (mode.action === 'attack' || mode.action === 'aim') {
          const ws = availableActions(data, s, unit(mode.uid), mode.to).find((o) => o.kind === mode.action)?.weapons?.[at.uid];
          return setMode({ k: 'forecast', uid: mode.uid, to: mode.to, target: at.uid, weapon: ws?.[0], aim: mode.action === 'aim' });
        }
        if (mode.action === 'farRescue' || mode.action === 'cheer')
          return setMode({ k: 'classPreview', uid: mode.uid, to: mode.to, action: mode.action, target: at.uid });
        if (mode.action === 'steal') return setMode({ k: 'steal', uid: mode.uid, to: mode.to, target: at.uid });
        const action: Action =
          mode.action === 'item' ? { kind: 'item', item: mode.item!, target: at.uid } : ({ kind: mode.action, target: at.uid } as Action);
        void run({ type: 'act', unit: mode.uid, to: mode.to, action });
        return;
      }
      case 'pursue': {
        const u = unit(mode.uid);
        const rest = pursueReach(data, s, u);
        if (mode.to && samePos(p, mode.to)) return void confirmPursue();
        if (rest && !samePos(p, u.pos) && destinations(s, u, rest).some((d) => samePos(d, p))) return setMode({ k: 'pursue', uid: u.uid, to: p });
        if (selectable(at)) {
          leavePursue();
          setMode({ k: 'selected', uid: at!.uid });
        }
        return;
      }
      case 'passive':
        return setMode({ k: 'moved', uid: mode.uid, to: mode.to });
      case 'cast': {
        if (mode.at && samePos(p, mode.at)) return void confirmCast();
        const tiles = availableActions(data, s, unit(mode.uid), mode.to).find((o) => o.kind === 'cast')?.tiles ?? [];
        if (tiles.some((c) => samePos(c, p))) return setMode({ ...mode, at: p });
        return setMode({ k: 'moved', uid: mode.uid, to: mode.to });
      }
      case 'classPreview': {
        if (at && at.uid === mode.target) return void confirmClassAction();
        setMode({ k: 'moved', uid: mode.uid, to: mode.to });
        return;
      }
      case 'forecast': {
        if (at && at.uid === mode.target) return void confirmAttack();
        if (at && at.team === 'enemy') {
          const best = bestTileToAttack(unit(mode.uid), at, mode.to);
          if (best) return setMode({ ...mode, target: at.uid, weapon: best.weapon });
        }
        setMode({ k: 'moved', uid: mode.uid, to: mode.to });
        return;
      }
    }
  };

  const longRef = useRef<(p: Pos) => void>(() => undefined);
  longRef.current = (p: Pos) => {
    const at = unitAt(s, p);
    if (at) {
      if (longPressView(data, at) === 'wanted') return setWanted(at.uid);
      setInfo(at.uid);
      if (at.team === 'enemy') setWatch((w) => (w.includes(at.uid) ? w.filter((x) => x !== at.uid) : [...w, at.uid]));
    } else setTileInfo(p);
  };

  const cancelRef = useRef<() => void>(() => undefined);
  cancelRef.current = () => {
    audio.sfx('cancel');
    if (wanted) return setWanted(null);
    if (info) return setInfo(null);
    switch (mode.k) {
      case 'cast':
        return setMode(mode.at ? { ...mode, at: null } : { k: 'moved', uid: mode.uid, to: mode.to });
      case 'forecast':
      case 'classPreview':
      case 'passive':
      case 'steal':
      case 'target':
        return setMode({ k: 'moved', uid: mode.uid, to: mode.to });
      case 'pursue':
        return finishPursue();
      case 'moved':
        return setMode({ k: 'selected', uid: mode.uid });
      case 'selected':
        return setMode({ k: 'idle' });
      default:
        setTileInfo(null);
    }
  };

  const confirmAttack = async () => {
    if (mode.k !== 'forecast') return;
    await run({ type: 'act', unit: mode.uid, to: mode.to, action: { kind: mode.aim ? 'aim' : 'attack', target: mode.target, weapon: mode.weapon } });
  };

  const confirmClassAction = async () => {
    if (mode.k !== 'classPreview') return;
    await run({ type: 'act', unit: mode.uid, to: mode.to, action: { kind: mode.action, target: mode.target } });
  };

  const confirmCast = async () => {
    if (mode.k !== 'cast' || !mode.at) return;
    await run({ type: 'act', unit: mode.uid, to: mode.to, action: { kind: 'cast', at: mode.at } });
  };

  // --------------------------------------------------------------- Nachsetzen
  const pursueKey = s.pursue ? `${s.turn}:${s.pursue.unit}:${s.pursue.left}` : null;
  const pursueOpen = !!s.pursue && s.phase === 'player' && !s.outcome && pursueDone !== pursueKey;
  /** Lets the open chance go without a command (the next command of any kind would end it anyway). */
  const leavePursue = () => {
    if (pursueOpen) setPursueDone(pursueKey);
  };
  /** "Fertig": the player does not pursue; when nothing else is ready the phase ends as it would after the last action. */
  const finishPursue = () => {
    leavePursue();
    setMode({ k: 'idle' });
    if (!s.units.some(selectable)) setTimeout(() => void run({ type: 'endPhase' }), 350);
  };
  const confirmPursue = async () => {
    if (mode.k !== 'pursue' || !mode.to) return;
    await run({ type: 'pursue', unit: mode.uid, to: mode.to });
  };
  // the chance opens by itself after the attack (and after a reload of a saved battle)
  useEffect(() => {
    if (pursueOpen && !busy && mode.k === 'idle') setMode({ k: 'pursue', uid: s.pursue!.unit, to: null });
  }, [pursueOpen, busy, mode.k]);

  /** Selects the next unit that has not acted yet and centres the camera on it. */
  const nextUnit = () => {
    const ready = s.units.filter(selectable);
    if (!ready.length) return;
    leavePursue();
    const cur = mode.k !== 'idle' ? ready.findIndex((u) => u.uid === mode.uid) : -1;
    const next = ready[(cur + 1) % ready.length]!;
    audio.sfx('tap');
    setMode({ k: 'selected', uid: next.uid });
    setTileInfo(null);
    void boardRef.current?.centerOn(next.pos!);
  };

  // "End phase" with units still ready asks once more; the question expires after a few seconds
  useEffect(() => {
    if (!confirmEnd) return;
    const id = setTimeout(() => setConfirmEnd(false), 3000);
    return () => clearTimeout(id);
  }, [confirmEnd]);
  useEffect(() => {
    setConfirmEnd(false);
    setReason(null);
    if (mode.k !== 'idle') setRecap(null);
  }, [mode]);
  useEffect(() => {
    if (!reason) return;
    const id = setTimeout(() => setReason(null), 3500);
    return () => clearTimeout(id);
  }, [reason]);

  const endPhase = () => {
    if (!playerTurn) return;
    if (readyCount > 0 && !confirmEnd) return setConfirmEnd(true);
    setConfirmEnd(false);
    void run({ type: 'endPhase' });
  };

  /** Esc closes the topmost overlay first, then steps back through the selection. */
  const escape = () => {
    if (dialogue || levelUp) return;
    if (trade) return setTrade(null);
    if (convoy) return setConvoy(null);
    if (items) return setItems(null);
    if (classPick) return setClassPick(false);
    if (objectives) return setObjectives(false);
    if (menu) return setMenu(false);
    cancelRef.current();
  };

  // keyboard (EXPERIENCE.md Interaction Primitives): Esc back, Space next unit, E end phase, D danger zone, F front band, arrows between bands
  const ctxRef = useRef({ n: 0, go: () => undefined as void, step: (_d: number) => undefined as void });
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => undefined);
  keyRef.current = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || dialogue || levelUp || bark || handbookSheet.value) return;
    const modal = menu || objectives || classPick || !!items || !!trade || !!convoy || !!info || mode.k === 'steal';
    if (e.key === 'Escape') escape();
    else if (modal) return;
    else if (e.key === 'd' || e.key === 'D') setDanger((d) => !d);
    else if (e.key === 'm' || e.key === 'M') boardRef.current?.wholeMap();
    else if (e.key === 'e' || e.key === 'E') endPhase();
    else if (mode.k === 'moved' && ctxRef.current.n > 0 && (e.key === 'f' || e.key === 'F')) ctxRef.current.go();
    else if (mode.k === 'moved' && ctxRef.current.n > 1 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      ctxRef.current.step(e.key === 'ArrowRight' ? 1 : -1);
    } else if (e.key === ' ' && playerTurn) {
      e.preventDefault();
      nextUnit();
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // --------------------------------------------------------------- action bar
  const doAction = async (opt: ActionOption) => {
    if (mode.k !== 'moved') return;
    const u = unit(mode.uid);
    audio.sfx('confirm');
    switch (opt.kind) {
      case 'wait':
      case 'visit':
      case 'chest':
      case 'rally':
      case 'seize':
      case 'escape':
        return run({ type: 'act', unit: u.uid, to: mode.to, action: { kind: opt.kind } as Action });
      case 'door':
        return run({ type: 'act', unit: u.uid, to: mode.to, action: { kind: 'door', object: opt.object! } });
      case 'open':
        return run({ type: 'act', unit: u.uid, to: mode.to, action: { kind: 'open', object: opt.object! } });
      case 'steal': {
        // the bag of the foe is the preview; with several foes next to the tile the player picks one on the board first
        const targets = opt.targets ?? [];
        if (targets.length === 1) return setMode({ k: 'steal', uid: u.uid, to: mode.to, target: targets[0]! });
        return setMode({ k: 'target', uid: u.uid, to: mode.to, action: 'steal', targets });
      }
      case 'cast':
        return setMode({ k: 'cast', uid: u.uid, to: mode.to, at: null });
      case 'aim':
      case 'farRescue':
      case 'cheer': {
        // class actions always show their preview first; a single target skips the target pick
        const targets = opt.targets ?? [];
        if (targets.length === 1 && opt.kind !== 'aim')
          return setMode({ k: 'classPreview', uid: u.uid, to: mode.to, action: opt.kind, target: targets[0]! });
        if (targets.length === 1)
          return setMode({ k: 'forecast', uid: u.uid, to: mode.to, target: targets[0]!, weapon: opt.weapons?.[targets[0]!]?.[0], aim: true });
        return setMode({ k: 'target', uid: u.uid, to: mode.to, action: opt.kind, targets });
      }
      case 'attack':
      case 'staff':
      case 'talk':
      case 'rescue':
      case 'command':
        if (opt.targets?.length === 1 && opt.kind !== 'attack') {
          return run({ type: 'act', unit: u.uid, to: mode.to, action: { kind: opt.kind, target: opt.targets[0]! } as Action });
        }
        return setMode({ k: 'target', uid: u.uid, to: mode.to, action: opt.kind, targets: opt.targets ?? [] });
      case 'item':
        return setItems({ uid: u.uid, to: mode.to, list: opt.items ?? [] });
      case 'trade':
      case 'convoy': {
        if (!samePos(mode.to, u.pos)) await run({ type: 'move', unit: u.uid, to: mode.to });
        const st = battle.value!.state;
        if (opt.kind === 'trade') {
          const partner = opt.targets!.length === 1 ? opt.targets![0]! : opt.targets![0]!;
          setTrade({ a: u.uid, b: partner });
        } else setConvoy(u.uid);
        setMode({ k: 'moved', uid: u.uid, to: st.units.find((x) => x.uid === u.uid)!.pos! });
        return;
      }
    }
  };

  const useItem = (itemUid: string) => {
    if (!items) return;
    const u = unit(items.uid);
    const targets = itemTargets(data, s, u, items.to, itemUid);
    const d = itemDef(data, u.bag.find((i) => i.uid === itemUid)!);
    setItems(null);
    if (d.use?.damage || (d.use?.target === 'ally' && targets.length > 1)) {
      setMode({ k: 'target', uid: u.uid, to: items.to, action: 'item', targets, item: itemUid });
      return;
    }
    void run({ type: 'act', unit: u.uid, to: items.to, action: { kind: 'item', item: itemUid, target: targets[0] } });
  };

  // --------------------------------------------------------------- render
  const selUnit = mode.k !== 'idle' ? unit(mode.uid) : null;
  const infoUnit = info ? s.units.find((u) => u.uid === info) : null;
  const wantedUnit = wanted ? s.units.find((u) => u.uid === wanted) : null;
  const wantedPoster = wantedUnit?.lieutenant && campaign.value ? wantedView(data, campaign.value, wantedUnit.lieutenant, wantedUnit) : null;
  const options = mode.k === 'moved' ? availableActions(data, s, unit(mode.uid), mode.to) : [];
  const aimPre =
    mode.k === 'forecast' && mode.aim
      ? classPreview(data, s, unit(mode.uid), mode.to, { kind: 'aim', target: mode.target, weapon: mode.weapon })
      : null;
  const fc =
    aimPre?.kind === 'aim' ? aimPre.forecast : mode.k === 'forecast' ? forecast(data, s, mode.uid, mode.target, mode.weapon, mode.to) : null;
  // the part of the target's HP bar the attack takes at hit (story 13.4), from the forecast
  const previewAfter = fc && mode.k === 'forecast' ? Math.max(0, fc.defender.hpBefore - damageAtHit(data, fc)) : null;
  const previewUid = mode.k === 'forecast' ? mode.target : null;
  useEffect(() => {
    boardRef.current?.setHpPreview(previewUid && previewAfter !== null ? { uid: previewUid, after: previewAfter } : null);
  }, [previewUid, previewAfter]);
  const weaponsForTarget =
    mode.k === 'forecast'
      ? (availableActions(data, s, unit(mode.uid), mode.to).find((o) => o.kind === (mode.aim ? 'aim' : 'attack'))?.weapons?.[mode.target] ?? [])
      : [];
  const cls = mode.k === 'classPreview' ? classPreview(data, s, unit(mode.uid), mode.to, { kind: mode.action, target: mode.target }) : null;
  const classPre = mode.k === 'steal' ? classPreview(data, s, unit(mode.uid), mode.to, { kind: 'steal', target: mode.target }) : null;
  const castPre = mode.k === 'cast' && mode.at ? classPreview(data, s, unit(mode.uid), mode.to, { kind: 'cast', at: mode.at }) : null;
  const passivePre = mode.k === 'passive' ? passivePreview(data, s, unit(mode.uid), mode.to) : null;
  const readyCount = s.units.filter(selectable).length;

  const map = mapOf(data, s);
  const victory = map.objectives.victory;
  // how many foes are left is not known under fog
  const enemiesLeft = full.units.filter((u) => u.team === 'enemy' && active(u) && !u.ignoreForRout).length;
  // defend: the goal line already names the rounds ("Verwalter schützen · 10 Runden"), the round pill above counts them; a second count would not fit at 375 px
  const goalProgress =
    victory.type === 'rout'
      ? fogged
        ? ''
        : t('ui.hud.left', { n: enemiesLeft })
      : victory.type === 'survive'
        ? t('ui.obj.turnOf', { turn: s.turn, turns: victory.turns })
        : '';
  // a treasure hunt shows its stand instead of the long sentence: "2/5 chests · turn 3 of 8" (the sentence is on the goals sheet)
  const goalText = victory.type === 'treasure' ? goalStand(victory, s) : goalLine(victory, map).replace(/\.$/, '');

  const shownPhase = phaseView?.phase ?? s.phase;
  const shownTurn = phaseView?.turn ?? s.turn;
  const otherPhase = shownPhase !== 'player';

  const attackOpt = options.find((o) => o.kind === 'attack');
  const itemOpt = options.find((o) => o.kind === 'item');
  const classOpts = CLASS_KINDS.map((k) => options.find((o) => o.kind === k)).filter((o): o is ActionOption => !!o);
  const waitOpt = options.find((o) => o.kind === 'wait');
  // context bands (story 2.7): one per target, most urgent first; the front one runs on a tap or F, the others a swipe or arrow key away
  const ctxEntries = mode.k === 'moved' ? contextEntries(data, s, options) : [];
  const ctxSig = mode.k === 'moved' ? `${mode.uid}@${posKey(mode.to)}:${ctxEntries.map((e) => e.id).join(',')}` : '';
  const [ctxSel, setCtxSel] = useState({ sig: '', i: 0 });
  const ctxIdx = ctxSel.sig === ctxSig ? Math.min(ctxSel.i, Math.max(0, ctxEntries.length - 1)) : 0;
  const setCtxIdx = (i: number) => setCtxSel({ sig: ctxSig, i });
  ctxRef.current = {
    n: ctxEntries.length,
    go: () => void doAction(ctxEntries[ctxIdx]!.option),
    step: (d) => setCtxIdx((ctxIdx + d + ctxEntries.length) % ctxEntries.length),
  };

  /** Dock with its four fixed slots: Attack, Class action, Item, Wait. Impossible ones are dimmed; a tap says why. */
  const dock = (u: BattleUnit) => {
    const placed = mode.k === 'moved';
    // while the hint band above already says "pick a target tile", a tap on the disabled dock must not repeat it as a toast
    const ask = (msg: string) => () => {
      if (mode.k === 'selected' && msg === t('ui.hud.pickTile')) return;
      setReason(msg);
    };
    // Wirken dimmed: say why (no tome, light/dark, wind without fog, no valid field)
    const block = placed && !classOpts.length ? castBlock(data, s, u, (mode as Extract<Mode, { k: 'moved' }>).to) : null;
    const scoutBlock = placed && !classOpts.length ? stealBlock(data, s, u, (mode as Extract<Mode, { k: 'moved' }>).to) : null;
    const castReason = block ? t(`ui.cast.no.${block}`) : scoutBlock ? t(`ui.steal.no.${scoutBlock}`) : null;
    const classOne = classOpts.length === 1 ? classOpts[0]! : undefined;
    // passive role (Vorkämpfer: Halten, Plänkler: Nachsetzen): the role symbol shows a state; a tap explains the rule with a preview
    const passiveId = classOpts.length ? undefined : classActionId(data, u, s);
    const passive = passiveId && data.classes[u.classId]?.classAction?.kind === 'passive' ? passiveId : undefined;
    return (
      <Dock>
        <DockAction
          variant="primary"
          icon="attack"
          label={t('ui.action.attack')}
          sub={attackOpt ? t('ui.hud.targets', { n: attackOpt.targets?.length ?? 0 }) : undefined}
          dim={!attackOpt}
          onClick={attackOpt ? () => void doAction(attackOpt) : ask(t(placed ? 'ui.hud.noAttack' : 'ui.hud.pickTile'))}
        />
        <DockAction
          variant="class"
          icon={classOpts.length && classOpts[0]!.kind !== 'cast' ? classOpts[0]!.kind : roleIcon(data.classes[u.classId]!.role)}
          label={passive ? t(`ui.passive.${passive}.name`) : classOne ? t(`ui.action.${classOne.kind}`) : t('ui.hud.classSlot')}
          sub={passive ? t('ui.passive.ready') : undefined}
          state={passive ? 'ready' : undefined}
          dim={!classOpts.length && !passive}
          onClick={
            passive
              ? () => setMode({ k: 'passive', uid: u.uid, to: mode.k === 'moved' ? mode.to : u.pos! })
              : classOne
                ? () => void doAction(classOne)
                : classOpts.length
                  ? () => setClassPick(true)
                  : ask(castReason ?? t(placed ? 'ui.hud.noClass' : 'ui.hud.pickTile'))
          }
        />
        <DockAction
          icon="item"
          label={t('ui.action.item')}
          dim={!itemOpt}
          onClick={itemOpt ? () => void doAction(itemOpt) : ask(t(placed ? 'ui.hud.noItem' : 'ui.hud.pickTile'))}
        />
        <DockAction icon="wait" label={t('ui.action.wait')} dim={!waitOpt} onClick={waitOpt ? () => void doAction(waitOpt) : ask(t('ui.hud.pickTile'))} />
      </Dock>
    );
  };

  const idleDock = (
    <Dock three>
      <DockAction icon="danger" label={t('ui.danger')} on={danger} onClick={() => setDanger(!danger)} />
      <DockAction icon="next" label={t('ui.hud.nextUnit')} dim={!playerTurn || readyCount === 0} onClick={nextUnit} />
      <DockAction
        variant="primary"
        icon="end"
        label={confirmEnd ? t('ui.hud.endConfirm') : t('ui.endPhase')}
        sub={readyCount > 0 ? t('ui.hud.ready', { n: readyCount }) : undefined}
        dim={!playerTurn}
        onClick={endPhase}
      />
    </Dock>
  );

  /** a long press on a medallion of the enemy strip opens what a long press on the foe opens (story 13.8) */
  const foeInfo = (u: BattleUnit) => (longPressView(data, u) === 'wanted' ? setWanted(u.uid) : setInfo(u.uid));

  const card = selUnit && <UnitCardB data={data} state={s} u={selUnit} hp={hp[selUnit.uid] ?? selUnit.hp} onClick={() => setInfo(selUnit.uid)} />;
  const back = <BackPill onClick={() => cancelRef.current()} />;
  const tileUnit = tileInfo ? unitAt(s, tileInfo) : undefined;

  const sheet = otherPhase ? null : (
    <div class="hud-sheet">
      {reason && <HintPill reason>{reason}</HintPill>}
      {mode.k === 'idle' && (
        <>
          {recap && <RecapStone turn={recap.turn} rows={recap.rows} units={full.units} onShow={(at) => void boardRef.current?.centerOn(at)} onClose={() => setRecap(null)} />}
          {tileInfo &&
            (tileUnit ? (
              <UnitCardB data={data} state={s} u={tileUnit} hp={hp[tileUnit.uid] ?? tileUnit.hp} onClick={() => setInfo(tileUnit.uid)} />
            ) : (
              <TerrainCard data={data} s={s} p={tileInfo} />
            ))}
          {idleDock}
        </>
      )}
      {mode.k === 'selected' && selUnit && (
        <>
          <div class="hud-row">
            {back}
            <HintPill>{t('ui.hud.pickTile')}</HintPill>
          </div>
          {card}
          {dock(selUnit)}
        </>
      )}
      {mode.k === 'moved' && selUnit && (
        <>
          {back}
          <ContextBands entries={ctxEntries} index={ctxIdx} unitOf={(uid) => s.units.find((x) => x.uid === uid)} onIndex={setCtxIdx} onGo={(e) => void doAction(e.option)} />
          {card}
          {dock(selUnit)}
        </>
      )}
      {mode.k === 'target' && selUnit && (
        <>
          <div class="hud-row">
            {back}
            <HintPill>{t(`ui.pick.${mode.action}`)}</HintPill>
          </div>
          {card}
        </>
      )}
      {mode.k === 'pursue' && selUnit && (
        <>
          <HintPill>
            <Icon name="blade" size={16} /> {t('ui.pursue.hint', { n: s.pursue?.left ?? 0 })}
          </HintPill>
          {card}
          <div class="hud-confirm">
            <SecondaryButton onClick={finishPursue}>{t('ui.pursue.done')}</SecondaryButton>
            <PrimaryButton disabled={!mode.to} onClick={() => void confirmPursue()}>
              {t('ui.pursue.go')}
            </PrimaryButton>
          </div>
        </>
      )}
      {mode.k === 'passive' && selUnit && passivePre && (
        <>
          <PassiveRuleCard p={passivePre} />
          <div class="hud-confirm">
            <SecondaryButton onClick={() => cancelRef.current()}>{t('ui.back')}</SecondaryButton>
            <PrimaryButton onClick={() => cancelRef.current()}>{t('ui.passive.ok')}</PrimaryButton>
          </div>
        </>
      )}
      {mode.k === 'cast' && selUnit && (
        <>
          {!castPre && (
            <div class="hud-row">
              {back}
              <HintPill>{t('ui.pick.cast')}</HintPill>
            </div>
          )}
          {castPre ? <ClassPreviewCard data={data} state={s} p={castPre} caster={selUnit} /> : card}
          {castPre && (
            <div class="hud-confirm">
              <SecondaryButton onClick={() => cancelRef.current()}>{t('ui.cancel')}</SecondaryButton>
              <PrimaryButton onClick={() => void confirmCast()}>{t('ui.action.cast')}</PrimaryButton>
            </div>
          )}
        </>
      )}
      {mode.k === 'classPreview' && cls && (
        <>
          <ClassPreviewCard data={data} state={s} p={cls} />
          <div class="hud-confirm">
            <SecondaryButton onClick={() => cancelRef.current()}>{t('ui.cancel')}</SecondaryButton>
            <PrimaryButton onClick={() => void confirmClassAction()}>{t(`ui.action.${mode.action}`)}</PrimaryButton>
          </div>
        </>
      )}
      {mode.k === 'forecast' && fc && (
        <>
          <ForecastCard data={data} state={s} f={fc} aim={aimPre?.kind === 'aim' ? aimPre : undefined} />
          <div class={`hud-confirm ${weaponsForTarget.length > 1 ? 'has-swap' : ''}`}>
            <SecondaryButton onClick={() => cancelRef.current()}>{t('ui.cancel')}</SecondaryButton>
            {weaponsForTarget.length > 1 && (
              <SecondaryButton
                onClick={() => {
                  const i = weaponsForTarget.indexOf(mode.weapon ?? '');
                  setMode({ ...mode, weapon: weaponsForTarget[(i + 1) % weaponsForTarget.length] });
                }}
              >
                {t('ui.action.swapWeapon')}
              </SecondaryButton>
            )}
            <PrimaryButton onClick={() => void confirmAttack()}>
              {t('ui.action.confirmAttack')}
            </PrimaryButton>
          </div>
        </>
      )}
    </div>
  );

  const enemySpeed = settings.value.enemySpeed;
  const setEnemySpeed = (v: 1 | 2 | 3) => {
    updateSettings({ enemySpeed: v });
    const board = boardRef.current;
    if (board && otherPhase) {
      board.speed = v === 2 ? 2 : 1;
      board.skip = v === 3;
    }
  };

  return (
    <div class={`battle ${wide ? 'has-side' : ''} ${dialogue || levelUp ? 'in-scene' : ''}`}>
      {wide && (
        <div class="side side-left">
          <RosterPanel
            data={data}
            s={s}
            hp={hp}
            onPick={(u) => {
              if (selectable(u) && playerTurn) {
                leavePursue();
                setMode({ k: 'selected', uid: u.uid });
              }
              void boardRef.current?.centerOn(u.pos!);
            }}
          />
          {opt.enemyStrip && !otherPhase && <EnemyStrip data={data} s={s} hp={hp} side onCenter={(u) => void boardRef.current?.centerOn(u.pos!)} onInfo={foeInfo} />}
        </div>
      )}
      <div class="board-wrap">
        <div ref={stageRef} class="hc-stage-slot" />
        <div ref={floatRef} class="float-layer" />
        <div class="lg-pins">
          <div class="lg-pin" ref={chipRef} style={{ display: checkTile ? '' : 'none' }}>
            {checkTile && <TerrainChip data={data} s={s} p={checkTile} />}
          </div>
          <div class="lg-pin" ref={backRef} style={{ display: ghostAt ? '' : 'none' }}>
            {ghostAt && <BackStone onClick={() => cancelRef.current()} />}
          </div>
        </div>
        {dialogue?.band && <SceneBand id={dialogue.id} onDone={dialogue.done} />}
        {bark && <SceneBand id={bark.b.scene} key={bark.seq} only={[bark.b.line]} params={bark.b.params} speed={boardRef.current?.speed ?? 1} onDone={bark.done} />}
        <div class="hud-top" ref={topRef}>
          {otherPhase ? (
            <PhasePill turn={shownTurn} phase={shownPhase} />
          ) : (
            <>
              <div class="hud-topbar">
                <TurnPill turn={shownTurn} phase={shownPhase} goal={goalText} progress={goalProgress} onClick={() => setObjectives(true)} />
                <MenuStone onClick={() => setMenu(true)} />
              </div>
              <GoalPills
                data={data}
                s={s}
                side={map.objectives.side}
                marked={markedGoal.value}
                onMark={(o) => toggleGoalMark(o.id, data.render.board.markMs)}
                onClick={() => setObjectives(true)}
              />
              {checkTile && <ThreatPill n={checkFoes.length} />}
              {opt.enemyStrip && !wide && <EnemyStrip data={data} s={s} hp={hp} onCenter={(u) => void boardRef.current?.centerOn(u.pos!)} onInfo={foeInfo} />}
            </>
          )}
        </div>
        {!wide && (
          <div class="hud-bottom" ref={bottomRef}>
            {sheet}
          </div>
        )}
        {otherPhase && <SpeedControl value={enemySpeed} onChange={setEnemySpeed} />}
        {loading && (
          <div class="ld-cover">
            <Piece class="ld-stone" role="status" aria-live="polite">
              <b class="ld-stone__title">{t('ui.loading.board')}</b>
              <span class="ld-stone__sub">{t('ui.loading.boardSub')}</span>
              <div class="ld-bar ld-bar--busy" role="progressbar" aria-label={t('ui.loading.board')}>
                <i />
              </div>
            </Piece>
          </div>
        )}
        {cutIn && <CutIn cut={cutIn} onDone={() => setCutIn((c) => (c?.seq === cutIn.seq ? null : c))} />}
        {banner && <div class={`banner ${banner.cls}`}>{banner.text}</div>}
        {toast && <Toast text={toast.text} lead={toast.item && <ItemImage data={data} item={toast.item} size={32} />} onDone={() => setToastState(null)} />}
      </div>
      {wide && <div class="side">{sheet}</div>}

      {classPick && (
        <ClassPick
          options={classOpts}
          onClose={() => setClassPick(false)}
          onPick={(o) => {
            setClassPick(false);
            void doAction(o);
          }}
        />
      )}
      {infoUnit && <UnitInfo u={infoUnit} s={s} onClose={() => setInfo(null)} onEquip={(item, slot) => void run({ type: 'equip', unit: infoUnit.uid, item, slot })} canEdit={playerTurn && infoUnit.team === 'player' && !infoUnit.acted} />}
      {wantedUnit && wantedPoster && <WantedDock v={wantedPoster} onClose={() => setWanted(null)} />}
      {objectives && <ObjectivesPanel s={s} onClose={() => setObjectives(false)} />}
      {menu && (
        <BattleMenu
          onClose={() => setMenu(false)}
          onOptions={() => {
            setMenu(false);
            screen.value = { name: 'options', back: { name: 'battle' } };
          }}
          onHandbook={() => {
            setMenu(false);
            openHandbook();
          }}
          onRestartRound={
            canRestart('turn')
              ? () => {
                  setMenu(false);
                  restartBattle('turn');
                  remount();
                }
              : undefined
          }
          onRestartMission={
            canRestart('mission')
              ? () => {
                  setMenu(false);
                  restartBattle('mission');
                  remount();
                }
              : undefined
          }
          onLeaveMission={
            canAbandon()
              ? () => {
                  setMenu(false);
                  abandonBattle();
                }
              : undefined
          }
          onTitle={() => (screen.value = { name: 'title' })}
        />
      )}
      {items && <ItemPick u={unit(items.uid)} list={items.list} onPick={useItem} onClose={() => setItems(null)} />}
      {mode.k === 'steal' && classPre?.kind === 'steal' && (
        <StealPick
          p={classPre}
          victim={unit(mode.target)}
          onPick={(item) => void run({ type: 'act', unit: mode.uid, to: mode.to, action: { kind: 'steal', target: mode.target, item } })}
          onClose={() => cancelRef.current()}
        />
      )}
      {trade && <TradeSheet s={s} a={trade.a} b={trade.b} onClose={() => setTrade(null)} onCommit={(cmd) => { setTrade(null); void run(cmd); }} />}
      {convoy && <ConvoySheet s={s} uid={convoy} onClose={() => setConvoy(null)} onCommit={(cmd) => { setConvoy(null); void run(cmd); }} />}
      {levelUp && <LevelUpPopup u={unit(levelUp.uid)} gains={levelUp.gains} level={levelUp.level} onDone={levelUp.done} />}
      {dialogue && !dialogue.band && (
        <Scene id={dialogue.id} overlay onDone={dialogue.done} />
      )}
    </div>
  );
}

/** Re-mounts the battle screen after a restart (fresh board). */
function remount(): void {
  screen.value = { name: 'camp' };
  queueMicrotask(() => (screen.value = { name: 'battle' }));
}

function phaseMusic(s: BattleState): string {
  return s.phase === 'player' ? 'battle_player' : 'battle_enemy';
}

function tilesInRect(r: [number, number, number, number]): Pos[] {
  const out: Pos[] = [];
  for (let y = Math.min(r[1], r[3]); y <= Math.max(r[1], r[3]); y++) for (let x = Math.min(r[0], r[2]); x <= Math.max(r[0], r[2]); x++) out.push([x, y]);
  return out;
}

export { weaponRange };
