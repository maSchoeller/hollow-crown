import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  active,
  onDifficulty,
  applyCommand,
  availableActions,
  combinedRange,
  computeStats,
  dangerZone,
  destinations,
  dist,
  forecast,
  itemDef,
  itemTargets,
  nearConvoy,
  pathTo,
  posKey,
  reachable,
  samePos,
  tilesInRange,
  unitAt,
  weaponRange,
  type Action,
  type ActionOption,
  type BattleState,
  type BattleUnit,
  type Command,
  type GameEvent,
  type Pos,
  type ReachNode,
  type Stats,
} from '../../core';
import { activeSkillIds } from '../../core/rules/skills';
import { mapOf, sideObjectiveDone } from '../../core/battle/objectives';
import { BoardView } from '../../render/board';
import { t } from '../../i18n';
import { Dialogue } from '../../ui/Dialogue';
import { Crest, ForecastView, HpBar, ItemDetails, ItemRow, itemName, Modal, StatsGrid, Toast, UnitCard, unitName } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { audio } from '../audio';
import { battle, campaign, command, concludeBattle, data, pendingEvents, restartBattle, screen, settings, setFlag } from '../store';

export { pendingEvents };

type Mode =
  | { k: 'idle' }
  | { k: 'selected'; uid: string }
  | { k: 'moved'; uid: string; to: Pos }
  | { k: 'target'; uid: string; to: Pos; action: 'attack' | 'staff' | 'talk' | 'rescue' | 'command' | 'item'; targets: string[]; item?: string }
  | { k: 'forecast'; uid: string; to: Pos; target: string; weapon?: string };

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

const AI_TEXT: Record<string, string> = {
  aggressive: 'ui.ai.aggressive', hold: 'ui.ai.hold', guard: 'ui.ai.guard', trigger: 'ui.ai.trigger', hunt: 'ui.ai.hunt', raider: 'ui.ai.raider', flee: 'ui.ai.flee', support: 'ui.ai.support',
};

/** Action bar (U20): the most important action gets the big button, the rest share four slots with "Back". */
const PRIMARY_ORDER: ActionOption['kind'][] = ['attack', 'seize', 'escape', 'visit', 'talk', 'staff', 'rescue', 'chest', 'door'];
const SECONDARY_ORDER: ActionOption['kind'][] = ['visit', 'talk', 'seize', 'escape', 'staff', 'rescue', 'chest', 'door', 'item', 'trade', 'convoy', 'rally', 'command', 'wait'];
const ACTION_ICON: Partial<Record<ActionOption['kind'], string>> = {
  attack: 'attack', staff: 'staff', item: 'item', trade: 'trade', convoy: 'convoy', wait: 'wait', visit: 'visit', chest: 'chest',
  door: 'door', talk: 'talk', rescue: 'rescue', seize: 'seize', escape: 'escape', rally: 'rally', command: 'command',
};

export function Battle() {
  const session = battle.value!;
  const s = session.state;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<BoardView | null>(null);
  const [mode, setMode] = useState<Mode>({ k: 'idle' });
  const [busy, setBusy] = useState(true);
  const [danger, setDanger] = useState(settings.value.dangerDefault);
  const [watch, setWatch] = useState<string[]>([]);
  const [info, setInfo] = useState<string | null>(null);
  const [tileInfo, setTileInfo] = useState<Pos | null>(null);
  const [banner, setBanner] = useState<{ text: string; cls: string } | null>(null);
  const [dialogue, setDialogue] = useState<{ id: string; done: () => void } | null>(null);
  const [levelUp, setLevelUp] = useState<{ uid: string; gains: Partial<Stats>; level: number; done: () => void } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [more, setMore] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [objectives, setObjectives] = useState(false);
  const [trade, setTrade] = useState<{ a: string; b: string } | null>(null);
  const [convoy, setConvoy] = useState<string | null>(null);
  const [items, setItems] = useState<{ uid: string; to: Pos; list: string[] } | null>(null);
  const [hp, setHp] = useState<Record<string, number>>({});
  const wide = useWide();

  const unit = (uid: string) => s.units.find((u) => u.uid === uid)!;

  // --------------------------------------------------------------- board lifecycle
  useEffect(() => {
    const board = new BoardView(canvasRef.current!, floatRef.current!, data, {
      onTap: (p) => tapRef.current(p),
      onLongPress: (p) => longRef.current(p),
      onCancel: () => cancelRef.current(),
      onEvent: (e) => eventRef.current(e),
      onUnitHp: (uid, v) => setHp((h) => ({ ...h, [uid]: v })),
    });
    boardRef.current = board;
    board.quality = settings.value.quality;
    let alive = true;
    void (async () => {
      await board.load(battle.value!.state);
      const ev = pendingEvents.value;
      pendingEvents.value = [];
      if (ev.length && alive) {
        await board.play(ev, battle.value!.state);
      }
      if (alive) setBusy(false);
      audio.music(phaseMusic(battle.value!.state));
    })();
    return () => {
      alive = false;
      board.dispose();
    };
  }, []);

  // --------------------------------------------------------------- overlays
  const reachCache = useMemo(() => new Map<string, Map<string, ReachNode>>(), [s]);
  const reachOf = (u: BattleUnit) => {
    let r = reachCache.get(u.uid);
    if (!r) reachCache.set(u.uid, (r = reachable(data, s, u)));
    return r;
  };
  const dangerTiles = useMemo(() => {
    if (!danger && !watch.length) return [] as Pos[];
    const set = dangerZone(data, s, 'player', danger ? undefined : watch);
    return [...set].map((k) => k.split(',').map(Number) as Pos);
  }, [s, danger, watch]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const goal = (() => {
      const v = mapOf(data, s).objectives.victory;
      if (v.type === 'reach' || v.type === 'seize' || v.type === 'escape') {
        return 'rect' in v.area ? tilesInRect(v.area.rect) : v.area.tiles;
      }
      return [];
    })();
    const reinforce = mapOf(data, s)
      .reinforcements.filter((r, i) => r.announce && !s.reinforcementsDone.includes(i) && r.turn === s.turn + (r.phase === 'player' ? 1 : 0))
      .flatMap((r) => onDifficulty(r.units, s.settings.difficulty).map((u) => u.at));
    const base = { danger: dangerTiles, goal, reinforce };
    if (mode.k === 'idle') return board.setOverlays({ ...base, cursor: tileInfo });
    const u = unit(mode.uid);
    const reach = reachOf(u);
    const dests = destinations(s, u, reach);
    if (mode.k === 'selected') {
      const range = combinedRange(data, s, u) ?? combinedRange(data, s, u, true);
      const atk = new Set<string>();
      if (range) for (const d of dests) for (const p of tilesInRange(s, d, range)) atk.add(posKey(p));
      for (const d of dests) atk.delete(posKey(d));
      for (const o of s.units) if (o.pos && o.team !== 'enemy' && !o.gone) atk.delete(posKey(o.pos));
      const attack = [...atk].map((k) => k.split(',').map(Number) as Pos);
      const staves = !!combinedRange(data, s, u, true) && !combinedRange(data, s, u);
      return board.setOverlays({ ...base, move: dests, attack: staves ? [] : attack, heal: staves ? attack : [], cursor: u.pos });
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
    return board.setOverlays({ ...base, path, ghost, targets: [unit(mode.target).pos!], cursor: unit(mode.target).pos });
  }, [mode, s, dangerTiles, tileInfo]);

  // --------------------------------------------------------------- command execution
  const run = async (cmd: Command) => {
    const board = boardRef.current!;
    setBusy(true);
    setMode({ k: 'idle' });
    setInfo(null);
    setTileInfo(null);
    const enemy = cmd.type === 'endPhase';
    const sp = enemy ? settings.value.enemySpeed : settings.value.speed;
    board.speed = sp === 2 ? 2 : 1;
    board.skip = sp === 3;
    let events: GameEvent[];
    try {
      events = command(cmd);
    } catch (e) {
      console.error(e);
      setBusy(false);
      return;
    }
    await board.play(events, battle.value!.state);
    board.skip = false;
    setHp({});
    setBusy(false);
    const st = battle.value!.state;
    if (st.outcome) {
      await showBanner(t(st.outcome === 'victory' ? 'ui.battle.victory' : 'ui.battle.defeat'), st.outcome === 'victory' ? 'victory' : 'enemy', 1600);
      audio.sfx(st.outcome === 'victory' ? 'victory' : 'defeat');
      concludeBattle();
      return;
    }
    // auto end of phase when every unit has acted
    if (st.phase === 'player' && !st.units.some((u) => u.team === 'player' && active(u) && !u.acted)) {
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

  const eventRef = useRef<(e: GameEvent) => Promise<void> | void>(() => undefined);
  eventRef.current = async (e: GameEvent) => {
    switch (e.t) {
      case 'phase':
        audio.music(e.phase === 'player' ? 'battle_player' : 'battle_enemy');
        audio.sfx('phase');
        await showBanner(t(`ui.phase.${e.phase}`), e.phase);
        break;
      case 'dialogue':
      case 'quote':
        if (!data.dialogues[e.id]) break;
        await new Promise<void>((resolve) => setDialogue({ id: e.id, done: resolve }));
        setDialogue(null);
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
      case 'mastered':
        setToast(t('ui.toast.mastered', { skill: t(`skill.${e.skill}.name`) }));
        break;
      case 'recruited':
        audio.sfx('recruit');
        setToast(t('ui.toast.recruited', { name: unitName(unit(e.unit) ?? { nameKey: `unit.${e.unit}.name` }) }));
        break;
      case 'loot':
        audio.sfx('loot');
        setToast(t(e.toConvoy ? 'ui.toast.lootConvoy' : 'ui.toast.loot', { item: itemName(data, e.item) }));
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
      case 'heal':
        audio.sfx('heal');
        break;
      default:
        break;
    }
  };

  // --------------------------------------------------------------- input handling
  const playerTurn = s.phase === 'player' && !busy && !s.outcome;

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
        if (mode.action === 'attack') {
          const ws = availableActions(data, s, unit(mode.uid), mode.to).find((o) => o.kind === 'attack')?.weapons?.[at.uid];
          return setMode({ k: 'forecast', uid: mode.uid, to: mode.to, target: at.uid, weapon: ws?.[0] });
        }
        const action: Action =
          mode.action === 'item' ? { kind: 'item', item: mode.item!, target: at.uid } : ({ kind: mode.action, target: at.uid } as Action);
        void run({ type: 'act', unit: mode.uid, to: mode.to, action });
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
      setInfo(at.uid);
      if (at.team === 'enemy') setWatch((w) => (w.includes(at.uid) ? w.filter((x) => x !== at.uid) : [...w, at.uid]));
    } else setTileInfo(p);
  };

  const cancelRef = useRef<() => void>(() => undefined);
  cancelRef.current = () => {
    audio.sfx('cancel');
    if (info) return setInfo(null);
    switch (mode.k) {
      case 'forecast':
      case 'target':
        return setMode({ k: 'moved', uid: mode.uid, to: mode.to });
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
    await run({ type: 'act', unit: mode.uid, to: mode.to, action: { kind: 'attack', target: mode.target, weapon: mode.weapon } });
  };

  /** Selects the next unit that has not acted yet and centres the camera on it. */
  const nextUnit = () => {
    const ready = s.units.filter(selectable);
    if (!ready.length) return;
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
  useEffect(() => setConfirmEnd(false), [mode]);

  // keyboard (concept/09 §3)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelRef.current();
      else if (e.key === 'd' || e.key === 'D') setDanger((d) => !d);
      else if ((e.key === 'e' || e.key === 'E') && playerTurn) void run({ type: 'endPhase' });
      else if (e.key === ' ' && playerTurn) {
        e.preventDefault();
        nextUnit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

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
  const options = mode.k === 'moved' ? availableActions(data, s, unit(mode.uid), mode.to) : [];
  const fc = mode.k === 'forecast' ? forecast(data, s, mode.uid, mode.target, mode.weapon, mode.to) : null;
  const weaponsForTarget =
    mode.k === 'forecast' ? (availableActions(data, s, unit(mode.uid), mode.to).find((o) => o.kind === 'attack')?.weapons?.[mode.target] ?? []) : [];
  const readyCount = s.units.filter(selectable).length;

  const map = mapOf(data, s);
  const victory = map.objectives.victory;
  const enemiesLeft = s.units.filter((u) => u.team === 'enemy' && active(u) && !u.ignoreForRout).length;
  const goalProgress =
    victory.type === 'rout'
      ? t('ui.hud.left', { n: enemiesLeft })
      : victory.type === 'defend' || victory.type === 'survive'
        ? t('ui.obj.turnOf', { turn: s.turn, turns: victory.turns })
        : '';

  const back = (
    <button class="act ghost" onClick={() => cancelRef.current()}>
      <Icon name="back" />
      {t('ui.back')}
    </button>
  );
  const dangerBtn = (
    <button class={`act ${danger ? 'on' : ''}`} aria-pressed={danger} onClick={() => setDanger(!danger)}>
      <Icon name="danger" />
      {t('ui.danger')}
    </button>
  );
  const actBtn = (o: ActionOption) => (
    <button key={o.kind} class="act" onClick={() => void doAction(o)}>
      <Icon name={ACTION_ICON[o.kind] ?? 'star'} />
      {t(`ui.action.${o.kind}`)}
    </button>
  );
  const primary = PRIMARY_ORDER.map((k) => options.find((o) => o.kind === k)).find(Boolean) ?? options.find((o) => o.kind === 'wait');
  const secondary = options
    .filter((o) => o !== primary)
    .sort((x, y) => SECONDARY_ORDER.indexOf(x.kind) - SECONDARY_ORDER.indexOf(y.kind));
  const overflow = secondary.length > 3;
  const shown = overflow ? secondary.slice(0, 2) : secondary;

  const sheet = (
    <div class={`dock ${wide ? '' : 'edge'}`}>
      {fc && <ForecastView data={data} state={s} f={fc} />}
      {!fc && selUnit && (
        <div onClick={() => setInfo(selUnit.uid)} style={{ cursor: 'pointer' }}>
          <UnitCard data={data} unit={{ ...selUnit, hp: hp[selUnit.uid] ?? selUnit.hp }} state={s} />
        </div>
      )}
      {!fc && !selUnit && tileInfo && <TileInfo s={s} p={tileInfo} hp={hp} onInfo={(uid) => setInfo(uid)} />}

      {mode.k === 'idle' && (
        <div class="dock-row three">
          {dangerBtn}
          <button class="act" disabled={!playerTurn || readyCount === 0} onClick={nextUnit}>
            <Icon name="next" />
            {t('ui.hud.nextUnit')}
          </button>
          <button
            class={`act ${confirmEnd ? 'on' : 'ink'}`}
            disabled={!playerTurn}
            onClick={() => {
              if (readyCount > 0 && !confirmEnd) return setConfirmEnd(true);
              setConfirmEnd(false);
              void run({ type: 'endPhase' });
            }}
          >
            <Icon name="forward" />
            {confirmEnd ? t('ui.hud.endConfirm') : t('ui.endPhase')}
            {readyCount > 0 && <span class="count">{t('ui.hud.ready', { n: readyCount })}</span>}
          </button>
        </div>
      )}
      {mode.k === 'selected' && (
        <>
          <div class="dock-hint">{t('ui.hud.pickTile')}</div>
          <div class="dock-row three">
            {dangerBtn}
            <span />
            {back}
          </div>
        </>
      )}
      {mode.k === 'moved' && primary && (
        <>
          <button class="primary-act" onClick={() => void doAction(primary)}>
            <span>
              <Icon name={ACTION_ICON[primary.kind] ?? 'star'} size={22} />
              {t(`ui.action.${primary.kind}`)}
            </span>
            {primary.kind === 'attack' && <small>{t('ui.hud.targets', { n: primary.targets?.length ?? 0 })}</small>}
          </button>
          <div class="dock-row">
            {shown.map(actBtn)}
            {overflow && (
              <button class="act" onClick={() => setMore(true)}>
                <Icon name="plus" />
                {t('ui.hud.more')}
              </button>
            )}
            {Array.from({ length: Math.max(0, 3 - (overflow ? 3 : shown.length)) }, (_, i) => (
              <span key={`pad${i}`} />
            ))}
            {back}
          </div>
        </>
      )}
      {mode.k === 'target' && (
        <>
          <div class="dock-hint">{t(`ui.pick.${mode.action}`)}</div>
          <div class="dock-row three">
            <span />
            <span />
            {back}
          </div>
        </>
      )}
      {mode.k === 'forecast' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: weaponsForTarget.length > 1 ? '1fr 1fr 1.6fr' : '1fr 1.7fr', gap: 8 }}>
            <button class="act ghost" onClick={() => cancelRef.current()}>
              <Icon name="back" />
              {t('ui.cancel')}
            </button>
            {weaponsForTarget.length > 1 && (
              <button
                class="act"
                onClick={() => {
                  const i = weaponsForTarget.indexOf(mode.weapon ?? '');
                  setMode({ ...mode, weapon: weaponsForTarget[(i + 1) % weaponsForTarget.length] });
                }}
              >
                <Icon name="swap" />
                {t('ui.action.swapWeapon')}
              </button>
            )}
            <button class="primary-act" style={{ justifyContent: 'center' }} onClick={() => void confirmAttack()}>
              {t('ui.action.confirmAttack')}
            </button>
          </div>
          <div class="dock-hint" style={{ fontSize: 13 }}>{t('ui.hud.tapAgain')}</div>
        </>
      )}
    </div>
  );

  return (
    <div class={`battle ${wide ? 'has-side' : ''}`}>
      {wide && (
        <div class="side side-left">
          <h3>{t('ui.battle.company')}</h3>
          <div class="roster-mini">
            {s.units
              .filter((u) => u.team === 'player' && u.pos && !u.gone)
              .map((u) => (
                <div key={u.uid} class="unit-card" style={{ opacity: u.acted ? 0.55 : 1 }} onClick={() => {
                  if (selectable(u) && playerTurn) setMode({ k: 'selected', uid: u.uid });
                  void boardRef.current?.centerOn(u.pos!);
                }}>
                  <Crest id={u.portrait} name={unitName(u)} w={40} h={48} />
                  <div class="col" style={{ gap: 6 }}>
                    <div class="unit-name">{unitName(u)}</div>
                    <HpBar hp={hp[u.uid] ?? u.hp} max={computeStats(data, u).maxHp} />
                  </div>
                  <span class="lbl">{t('ui.lv')} {u.level}</span>
                </div>
              ))}
          </div>
        </div>
      )}
      <div class="board-wrap">
        <canvas ref={canvasRef} class="board-canvas" />
        <div ref={floatRef} class="float-layer" />
        <div class="topbar">
          <button class="hud-bar" onClick={() => setObjectives(true)} aria-label={t('ui.obj.title')}>
            <span class={`hud-round ${s.phase !== 'player' ? s.phase : ''}`}>{s.turn}</span>
            <span class="hud-goal">
              <span class={`lbl phase-${s.phase}`}>
                {t('ui.hud.round', { n: s.turn })} · {t(`ui.phase.${s.phase}`)}
              </span>
              <b>
                {t(`ui.world.goal.${victory.type}`, { turns: 'turns' in victory ? victory.turns : 0 }).replace(/\.$/, '')}
                {goalProgress && <span class="muted"> · {goalProgress}</span>}
              </b>
            </span>
          </button>
          <button class="hud-btn" onClick={() => setMenu(true)} aria-label={t('ui.menu')}>
            <Icon name="menu" size={22} />
          </button>
        </div>
        {!wide && <div class="bottom">{sheet}</div>}
        {banner && <div class={`banner ${banner.cls}`}>{banner.text}</div>}
        {toast && <Toast text={toast} onDone={() => setToast(null)} />}
      </div>
      {wide && <div class="side">{sheet}</div>}

      {more && mode.k === 'moved' && (
        <Modal title={t('ui.hud.more')} onClose={() => setMore(false)}>
          <div class="col">
            {secondary.slice(2).map((o) => (
              <button key={o.kind} class="btn" style={{ justifyContent: 'flex-start' }} onClick={() => { setMore(false); void doAction(o); }}>
                <Icon name={ACTION_ICON[o.kind] ?? 'star'} />
                {t(`ui.action.${o.kind}`)}
              </button>
            ))}
          </div>
        </Modal>
      )}
      {infoUnit && <UnitInfo u={infoUnit} s={s} onClose={() => setInfo(null)} onEquip={(item, slot) => void run({ type: 'equip', unit: infoUnit.uid, item, slot })} canEdit={playerTurn && infoUnit.team === 'player' && !infoUnit.acted} />}
      {objectives && <ObjectivesPanel s={s} onClose={() => setObjectives(false)} />}
      {menu && (
        <Modal title={t('ui.menu')} onClose={() => setMenu(false)}>
          <div class="col">
            <button class="btn" onClick={() => { setMenu(false); screen.value = { name: 'options', back: { name: 'battle' } }; }}>
              <Icon name="gear" />
              {t('ui.options')}
            </button>
            {s.settings.deathMode !== 'classic' && (
              <button class="btn" onClick={() => { setMenu(false); restartBattle(true); remount(); }}>
                <Icon name="rewind" />
                {t('ui.battle.restartRound')}
              </button>
            )}
            <button class="btn" onClick={() => { setMenu(false); restartBattle(false); remount(); }}>
              <Icon name="restart" />
              {t('ui.battle.restartMission')}
            </button>
            <button class="btn ghost" onClick={() => (screen.value = { name: 'title' })}>
              <Icon name="home" />
              {t('ui.battle.toTitle')}
            </button>
            <div class="muted" style={{ fontSize: 13 }}>{t('ui.battle.autosaved')}</div>
          </div>
        </Modal>
      )}
      {items && (
        <Modal title={t('ui.action.item')} onClose={() => setItems(null)}>
          <div class="list">
            {items.list.map((uid) => {
              const inst = unit(items.uid).bag.find((i) => i.uid === uid)!;
              return <ItemRow key={uid} data={data} inst={inst} sub={<ItemDetails data={data} inst={inst} />} onClick={() => useItem(uid)} />;
            })}
          </div>
        </Modal>
      )}
      {trade && <TradeModal s={s} a={trade.a} b={trade.b} onClose={() => setTrade(null)} onCommit={(cmd) => { setTrade(null); void run(cmd); }} />}
      {convoy && <ConvoyModal s={s} uid={convoy} onClose={() => setConvoy(null)} onCommit={(cmd) => { setConvoy(null); void run(cmd); }} />}
      {levelUp && <LevelUpPopup u={unit(levelUp.uid)} gains={levelUp.gains} level={levelUp.level} onDone={levelUp.done} />}
      {dialogue && (
        <Dialogue
          data={data}
          id={dialogue.id}
          flags={campaign.value?.flags ?? []}
          avatarPortrait={campaign.value?.avatar.portrait ?? 'avatar_a'}
          overlay
          onFlag={setFlag}
          onDone={dialogue.done}
        />
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

function TileInfo({ s, p, hp, onInfo }: { s: BattleState; p: Pos; hp: Record<string, number>; onInfo: (uid: string) => void }) {
  const terr = data.terrain[s.terrain[p[1] * s.width + p[0]]!];
  const u = unitAt(s, p);
  return (
    <div class="panel sheet">
      {u ? (
        <div onClick={() => onInfo(u.uid)}>
          <UnitCard data={data} unit={{ ...u, hp: hp[u.uid] ?? u.hp }} state={s} />
        </div>
      ) : (
        terr && (
          <div class="row">
            <b class="grow">{t(`terrain.${terr.id}`)}</b>
            <span class="muted">
              {t('ui.stat.def')} {terr.def} · {t('ui.avoid')} {terr.avoid}
              {terr.heal ? ` · ${t('ui.heal')} ${terr.heal}%` : ''}
            </span>
          </div>
        )
      )}
    </div>
  );
}

function UnitInfo({ u, s, onClose, onEquip, canEdit }: { u: BattleUnit; s: BattleState; onClose: () => void; onEquip: (item: string, slot: 'mainHand' | 'bag') => void; canEdit: boolean }) {
  const skills = activeSkillIds(data, u);
  const all = [
    ...(['mainHand', 'offHand', 'head', 'body', 'accessory1', 'accessory2'] as const).flatMap((sl) => (u.equip[sl] ? [{ inst: u.equip[sl]!, slot: sl as string }] : [])),
    ...u.bag.map((i) => ({ inst: i, slot: 'bag' })),
  ];
  return (
    <Modal title={unitName(u)} onClose={onClose}>
      <div class="col" style={{ gap: 12 }}>
        <UnitCard data={data} unit={u} state={s} />
        <StatsGrid data={data} unit={u} state={s} />
        {u.ai && u.team !== 'player' && (
          <div class="row muted">
            <Icon name="ai" size={18} />
            {t(AI_TEXT[u.ai.profile] ?? 'ui.ai.aggressive')}
          </div>
        )}
        <div>
          <h3>{t('ui.inventory')}</h3>
          <div class="list">
            {all.map(({ inst, slot }) => {
              const d = itemDef(data, inst);
              const canSwap = canEdit && slot === 'bag' && d.slot === 'mainHand' && !!d.weaponType && data.classes[u.classId]!.weapons.includes(d.weaponType);
              return (
                <ItemRow
                  key={inst.uid}
                  data={data}
                  inst={inst}
                  sub={
                    <>
                      <span class="slot-label">{t(`ui.slot.${slot}`)}</span> <ItemDetails data={data} inst={inst} />
                    </>
                  }
                  right={canSwap ? <button class="btn small" onClick={() => onEquip(inst.uid, 'mainHand')}>{t('ui.equip')}</button> : null}
                />
              );
            })}
          </div>
        </div>
        <div>
          <h3>{t('ui.skills')}</h3>
          {skills.map((id) => (
            <div key={id}>
              <b>{t(`skill.${id}.name`)}</b> <span class="muted">– {t(`skill.${id}.desc`)}</span>
            </div>
          ))}
          {u.scars.map((sc) => (
            <div key={sc} class="row dis">
              <Icon name="scar" size={16} />
              {t(`scar.${sc}`)}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function ObjectivesPanel({ s, onClose }: { s: BattleState; onClose: () => void }) {
  const map = mapOf(data, s);
  const v = map.objectives.victory;
  return (
    <Modal title={t(map.nameKey)} onClose={onClose}>
      <div class="col">
        <div>
          <b class="gold">{t('ui.obj.victory')}:</b> {t(`ui.world.goal.${v.type}`, { turns: 'turns' in v ? v.turns : 0 })}
          {(v.type === 'defend' || v.type === 'survive') && <span class="muted"> ({t('ui.obj.turnOf', { turn: s.turn, turns: v.turns })})</span>}
        </div>
        <div>
          <b class="dis">{t('ui.obj.defeat')}:</b>{' '}
          {map.objectives.defeat
            .map((d) => (d.type === 'unit_dies' ? t('ui.obj.dies', { name: t(`unit.${d.unit}.name`) }) : t('ui.obj.turnLimit', { turns: d.turns })))
            .join(' · ')}
        </div>
        <h3>{t('ui.obj.side')}</h3>
        {map.objectives.side.map((o) => (
          <div key={o.id} class="row">
            <span class={sideObjectiveDone(data, s, o) ? 'adv' : 'muted'}>
              <Icon name={sideObjectiveDone(data, s, o) ? 'check' : 'target'} size={18} />
            </span>
            <span class="grow">{t(`ui.side.${o.type}`, { turns: o.turns ?? 0 })}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function LevelUpPopup({ u, gains, level, onDone }: { u: BattleUnit; gains: Partial<Stats>; level: number; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2400);
    return () => clearTimeout(id);
  }, []);
  return (
    <div class="modal-back" style={{ alignItems: 'center', background: 'rgba(8,10,20,0.35)' }} onClick={onDone}>
      <div class="panel levelup">
        <h2>{t('ui.levelUp')}</h2>
        <div>
          {unitName(u)} · {t('ui.lv')} <span class="num">{level}</span>
        </div>
        <div class="gains">
          {(['hp', 'str', 'mag', 'skl', 'spd', 'lck', 'def', 'res'] as const).map((k) => (
            <div key={k} class={gains[k] ? 'up' : 'muted'}>
              {t(`ui.stat.${k}`)} <span class="num">{u.stats[k]}</span> {gains[k] ? `+${gains[k]}` : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TradeModal({ s, a, b, onClose, onCommit }: { s: BattleState; a: string; b: string; onClose: () => void; onCommit: (cmd: Command) => void }) {
  const ua = s.units.find((u) => u.uid === a)!;
  const partners = s.units.filter((u) => u.team === 'player' && active(u) && u.uid !== a && u.pos && ua.pos && dist(u.pos, ua.pos) === 1);
  const [with_, setWith] = useState(b);
  const [ops, setOps] = useState<Array<{ item: string; to: string; slot: 'bag' }>>([]);
  const preview = useMemo(() => {
    try {
      return applyCommand(data, s, { type: 'trade', unit: a, with: with_, ops }).state;
    } catch {
      return s;
    }
  }, [ops, with_]);
  const pa = preview.units.find((u) => u.uid === a)!;
  const pb = preview.units.find((u) => u.uid === with_)!;
  const col = (u: BattleUnit, other: BattleUnit) => (
    <div class="col grow" style={{ minWidth: 0 }}>
      <b>{unitName(u)}</b>
      {[...Object.values(u.equip).filter((i): i is NonNullable<typeof i> => !!i), ...u.bag].map((inst) => (
        <ItemRow key={inst.uid} data={data} inst={inst} onClick={() => setOps((o) => [...o, { item: inst.uid, to: other.uid, slot: 'bag' }])} right={<span class="muted">⇄</span>} />
      ))}
      <div class="muted" style={{ fontSize: 12 }}>
        {t('ui.bag')} {u.bag.length}/{data.balance.bag.size}
      </div>
    </div>
  );
  return (
    <Modal title={t('ui.action.trade')} onClose={onClose} wide>
      {partners.length > 1 && (
        <div class="tabs" style={{ marginBottom: 8 }}>
          {partners.map((p) => (
            <div key={p.uid} class={`tab ${p.uid === with_ ? 'on' : ''}`} onClick={() => { setWith(p.uid); setOps([]); }}>
              {unitName(p)}
            </div>
          ))}
        </div>
      )}
      <div class="row" style={{ alignItems: 'flex-start' }}>
        {col(pa, pb)}
        {col(pb, pa)}
      </div>
      <div class="row" style={{ marginTop: 10 }}>
        <button class="btn grow" onClick={() => setOps([])}>
          {t('ui.reset')}
        </button>
        <button class="btn primary grow" disabled={!ops.length} onClick={() => onCommit({ type: 'trade', unit: a, with: with_, ops })}>
          {t('ui.done')}
        </button>
      </div>
    </Modal>
  );
}

function ConvoyModal({ s, uid, onClose, onCommit }: { s: BattleState; uid: string; onClose: () => void; onCommit: (cmd: Command) => void }) {
  const u = s.units.find((x) => x.uid === uid)!;
  const [take, setTake] = useState<string | undefined>();
  const [put, setPut] = useState<string | undefined>();
  if (!u.pos || !nearConvoy(s, u, u.pos)) return null;
  return (
    <Modal title={t('ui.action.convoy')} onClose={onClose} wide>
      <div class="muted" style={{ marginBottom: 8 }}>{t('ui.convoy.hint')}</div>
      <div class="row" style={{ alignItems: 'flex-start' }}>
        <div class="col grow" style={{ minWidth: 0 }}>
          <b>{unitName(u)}</b>
          {[...Object.values(u.equip).filter((i): i is NonNullable<typeof i> => !!i), ...u.bag].map((inst) => (
            <ItemRow key={inst.uid} data={data} inst={inst} selected={put === inst.uid} onClick={() => setPut(put === inst.uid ? undefined : inst.uid)} />
          ))}
        </div>
        <div class="col grow" style={{ minWidth: 0, maxHeight: 320, overflow: 'auto' }}>
          <b>{t('ui.convoy')}</b>
          {s.convoy.filter((i) => !itemDef(data, i).tags?.includes('convoyOnly')).map((inst) => (
            <ItemRow key={inst.uid} data={data} inst={inst} selected={take === inst.uid} onClick={() => setTake(take === inst.uid ? undefined : inst.uid)} />
          ))}
        </div>
      </div>
      <button class="btn primary" style={{ marginTop: 10, width: '100%' }} disabled={!take && !put} onClick={() => onCommit({ type: 'convoy', unit: uid, take, put })}>
        {t('ui.done')}
      </button>
    </Modal>
  );
}

export { weaponRange };
