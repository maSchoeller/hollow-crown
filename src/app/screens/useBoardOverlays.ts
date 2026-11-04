/** Board overlays of the battle screen (Battle.tsx). */
import { type BattleUnit, type Pos, type ReachNode, availableActions, classPreview, combinedRange, destinations, fogBands, holdZone, onDifficulty, passivePreview, pathTo, posKey, pursueReach, reachNow, samePos, threatMap, tileThreats, tilesInRange, visibleTiles } from '../../core';
import { data } from '../state/session';
import { goalMarkTiles, markedGoal } from '../state/goalMarks';
import { mapOf } from '../../core/battle/objectives';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import type { BattleScreen } from './useBattleScreen';

/** Overlays of the board (danger zone, reach, goals, fog, marks) and the target-tile check. */
export function useBoardOverlays(b: BattleScreen) {
  const { boardRef, busy, chipRef, danger, fogged, full, hover, mode, s, tileInfo, unit, watch } = b;
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
  // the foes that reach the field glow reddish; the terrain chip below the field rides on the board (pinned, moved with the camera)
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    board.setReach(checkTile ? checkFoes : []);
    board.pin('chip', chipRef.current, checkTile, { south: 0.5 });
  }, [checkKey, checkFoes]);

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
      threat,
      watch: watchTiles,
      goal,
      reinforce,
      hold,
      fog: fogTiles.fog,
      fogEdge: fogTiles.edge,
      mark: markTiles,
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
  }, [mode, s, threat, watchTiles, tileInfo, markTiles, checkKey]);

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
  return { reachOf, selUid, checkTile, checkFoes };
}

export type BoardOverlays = ReturnType<typeof useBoardOverlays>;

function tilesInRect(r: [number, number, number, number]): Pos[] {
  const out: Pos[] = [];
  for (let y = Math.min(r[1], r[3]); y <= Math.max(r[1], r[3]); y++) for (let x = Math.min(r[0], r[2]); x <= Math.max(r[0], r[2]); x++) out.push([x, y]);
  return out;
}
