/** Input handling of the battle screen (Battle.tsx). */
import { type Action, type ActionOption, type BattleUnit, type Command, type Pos, active, availableActions, destinations, itemDef, itemTargets, killMarks, longPressView, perilWarnings, posKey, pursueReach, samePos, unitAt } from '../../core';
import type { KillKind } from '../../render/board/badges';
import { audio } from '../audio';
import { battle } from '../state/battle';
import { data } from '../state/session';
import { handbookSheet } from '../state/handbook';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import type { BattleScreen } from './useBattleScreen';
import type { BoardOverlays } from './useBoardOverlays';

/** Taps, long presses, cancel, keyboard, Nachsetzen and the action bar of the battle screen. */
export function useBattleInput(b: BattleScreen, ov: BoardOverlays, run: (cmd: Command) => Promise<void>) {
  const {
    bark, boardRef, busy, cancelRef, classPick, confirmEnd, convoy, dialogue, info, items, levelUp, longRef, menu,
    mode, objectives, pursueDone, reason, recap, s, setClassPick, setConfirmEnd, setConvoy, setDanger, setInfo,
    setItems, setMenu, setMode, setObjectives, setPursueDone, setReason, setRecap, setTileInfo, setTrade, setWanted,
    setWatch, tapRef, trade, unit, wanted,
  } = b;
  const { reachOf, selUid } = ov;
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
  const readyCount = s.units.filter(selectable).length;

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

  longRef.current = (p: Pos) => {
    const at = unitAt(s, p);
    if (at) {
      if (longPressView(data, at) === 'wanted') return setWanted(at.uid);
      setInfo(at.uid);
      if (at.team === 'enemy') setWatch((w) => (w.includes(at.uid) ? w.filter((x) => x !== at.uid) : [...w, at.uid]));
    } else setTileInfo(p);
  };

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

  return { playerTurn, selectable, readyCount, leavePursue, finishPursue, confirmPursue, confirmAttack, confirmClassAction, confirmCast, nextUnit, endPhase, doAction, useItem, ctxRef };
}
