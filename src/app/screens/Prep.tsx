/**
 * Deploy on the board before every mission and haunt (story 6.11, replaces the list of story 6.10): the board of the map with
 * its deploy slots, the company standing on them in the default deploy, a bench strip with everyone else, and "Start mission".
 * Tap a unit, then a slot: it moves or swaps; a unit from the bench takes a free slot or the place of the one standing there.
 * The rules are the core's (`placeUnit`, `benchUnit`); the board shows the battle the core would start with this placement.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  armyOverLimit,
  benchUnit,
  createBattle,
  createHauntBattle,
  defaultPlacement,
  deployRules,
  findNode,
  fogBands,
  fogOn,
  hauntMap,
  placeUnit,
  placedAt,
  presentForced,
  threatMap,
  unitAt,
  visibleState,
  visibleTiles,
  type DeployBlock,
  type Placement,
  type Pos,
} from '../../core';
import { BoardView } from '../../render/board/board';
import { boardKey, parkBoard } from '../state/boardKeep';
import { t } from '../../i18n';
import { Toast, unitName } from '../../ui/components';
import { goalLine } from '../../ui/goalText';
import { Icon } from '../../ui/icons';
import { Piece, PrimaryButton, SecondaryButton } from '../../ui/pieces';
import { audio } from '../audio';
import { beginHaunt, beginMission, defaultDeploy, defaultHauntDeploy } from '../state/flow';
import { screen, type From } from '../state/screen';
import { campaign, data } from '../state/session';
import { settings } from '../state/settings';
import { UnitInfo } from './BattlePanels';
import { FigureFlow } from './Troop';
import { UnitHead } from './unitArt';
import './Prep.css';

/** Who is picked: a unit on the board or on the bench (by its roster id). */
type Pick = { id: string } | null;

export function Prep({ node, from, haunt }: { node: string; from: From; haunt?: string }) {
  const c = campaign.value!;
  const nd = findNode(data, node)!;
  // a haunt (story 5.6) deploys on its own map: the deploy fields and places of its anchor
  const h = haunt ? c.haunts.find((x) => x.id === haunt) : undefined;
  const map = h ? hauntMap(data, h.map, h.variant, h.lt) : data.maps[nd.map]!;
  const rules = useMemo(() => deployRules(map, presentForced(map, c)), [map, c.roster]);
  const [placement, setPlacement] = useState<Placement>(() => defaultPlacement(rules, h ? defaultHauntDeploy(h.id) : defaultDeploy(node)));
  const [pick, setPick] = useState<Pick>(null);
  const [inv, setInv] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [danger, setDanger] = useState(settings.value.dangerDefault);
  const [loading, setLoading] = useState(true);
  const over = armyOverLimit(data, c);

  // the battle the core would start with this placement: what the board shows (foes as at the start of round 1, fog after the placed units)
  const full = useMemo(() => (h ? createHauntBattle(data, c, h.id, placement) : createBattle(data, c, node, placement)), [c, placement]);
  const s = useMemo(() => visibleState(data, full, 'player'), [full]);
  const fogged = fogOn(data, full);
  const back = () => (screen.value = { name: from });
  const start = () => {
    if (over || !placement.length) return;
    void (h ? beginHaunt(h.id, placement, screen.value) : beginMission(node, placement, screen.value));
  };

  const say = (b: DeployBlock | null, id: string) => {
    if (!b || b === 'slot') return false;
    audio.sfx('error');
    setToast(b === 'full' ? t('ui.prep.full') : t('ui.prep.locked', { name: nameOf(id) }));
    return true;
  };
  const nameOf = (id: string) => {
    const r = c.roster.find((x) => x.id === id);
    return r ? unitName(r) : id;
  };

  // ------------------------------------------------------------------ board
  const stageRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<BoardView | null>(null);
  const tapRef = useRef<(p: Pos) => void>(() => undefined);
  const cancelRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const board = new BoardView(stageRef.current!, floatRef.current!, data, {
      onTap: (p) => tapRef.current(p),
      onLongPress: (p) => tapRef.current(p),
      onCancel: () => cancelRef.current(),
      insets: () => {
        const box = stageRef.current?.getBoundingClientRect();
        if (!box) return { top: 0, right: 0, bottom: 0, left: 0 };
        const top = topRef.current?.getBoundingClientRect();
        const bottom = bottomRef.current?.getBoundingClientRect();
        return { top: top ? Math.max(0, top.bottom - box.top) : 0, right: 0, bottom: bottom ? Math.max(0, box.bottom - bottom.top) : 0, left: 0 };
      },
    });
    boardRef.current = board;
    board.quality = settings.value.quality;
    board.figures = settings.value.figures;
    board.grid = settings.value.grid;
    board.hpBars = settings.value.hpBars;
    board.calmMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let alive = true;
    void board.load(s).finally(() => {
      if (!alive) return;
      setLoading(false);
      void board.frameTiles([...rules.slots]);
    });
    const hud = new ResizeObserver(() => board.relayout());
    for (const el of [topRef.current, bottomRef.current]) if (el) hud.observe(el);
    return () => {
      alive = false;
      hud.disconnect();
      // "Mission starten": the battle takes the built board over (only its state changes); any other way out drops it
      parkBoard(board, boardKey(s.mapId));
      boardRef.current = null;
    };
  }, []);

  // a new placement (or new equipment from the bag): the figures go to their fields
  useEffect(() => {
    if (!loading) void boardRef.current?.setState(s);
  }, [s, loading]);

  const threat = useMemo(() => {
    if (!danger) return null;
    const m = threatMap(data, s, 'player');
    const toPos = (k: string) => k.split(',').map(Number) as Pos;
    return { tiles: [...m.byTile].map(([k, l]) => [toPos(k), l.length] as [Pos, number]), sleeping: [...m.sleeping].map(toPos) };
  }, [s, danger]);
  const fog = useMemo(() => (fogged ? fogBands(full, visibleTiles(data, full, 'player')) : { fog: [], edge: [] }), [full]);
  const picked = pick ? placement.find((p) => p.id === pick.id) : undefined;
  useEffect(() => {
    if (loading) return;
    // the picked unit's field carries the target ring as well: the cursor alone is too faint over a figure
    boardRef.current?.setOverlays({ move: [...rules.slots], threat, fog: fog.fog, fogEdge: fog.edge, cursor: picked?.at ?? null, targets: picked ? [picked.at] : [] });
  }, [loading, threat, fog, picked?.at[0], picked?.at[1]]);

  tapRef.current = (p: Pos) => {
    const here = placedAt(placement, p);
    if (pick) {
      if (here?.id === pick.id) return setPick(null);
      const r = placeUnit(rules, placement, pick.id, p);
      if (r.blocked === 'slot') {
        // off the deploy fields: a foe shows its card, anything else lets go
        const u = unitAt(s, p);
        if (u && u.team !== 'player') setInfo(u.uid);
        return setPick(null);
      }
      if (say(r.blocked, here?.id ?? pick.id)) return;
      setPlacement(r.placement);
      return setPick(null);
    }
    if (here) return setPick({ id: here.id });
    const u = unitAt(s, p);
    if (u && u.team !== 'player') setInfo(u.uid);
  };
  cancelRef.current = () => setPick(null);

  // desktop: Escape lets go, Enter starts (story 6.11)
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => undefined);
  keyRef.current = (e) => {
    if (inv || info) return;
    if (e.key === 'Escape') setPick(null);
    else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) start();
  };
  useEffect(() => {
    const on = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);

  const bench = c.roster.filter((r) => !placement.some((p) => p.id === r.id));
  const onBoard = !!picked;
  const pickedForced = pick ? rules.forced.includes(pick.id) : false;
  const tapBench = (id: string) => {
    if (pick?.id === id) return setPick(null);
    if (pick && onBoard) {
      // a unit on the board, then the bench: it goes to the bench and the tapped one takes its field
      const off = benchUnit(rules, placement, pick.id);
      if (say(off.blocked, pick.id)) return;
      const r = placeUnit(rules, off.placement, id, picked!.at);
      setPlacement(r.placement);
      return setPick(null);
    }
    setPick({ id });
  };
  const toBench = () => {
    if (!pick) return;
    const r = benchUnit(rules, placement, pick.id);
    if (say(r.blocked, pick.id)) return;
    setPlacement(r.placement);
    setPick(null);
  };
  const reset = () => {
    setPlacement(defaultPlacement(rules, h ? defaultHauntDeploy(h.id) : defaultDeploy(node)));
    setPick(null);
  };

  const infoUnit = info ? s.units.find((u) => u.uid === info) : null;
  const invUnit = inv ? c.roster.find((r) => r.id === inv) : null;
  const hint = pick ? t(onBoard ? 'ui.prep.hintUnit' : 'ui.prep.benchPick', { name: nameOf(pick.id) }) : t('ui.prep.hint');

  return (
    <div class="battle prp">
      <div class="board-wrap">
        <div ref={stageRef} class="hc-stage-slot" />
        <div ref={floatRef} class="float-layer" />
        <div class="hud-top prp-top" ref={topRef}>
          <div class="prp-bar">
            <button type="button" class="hc-piece hud-round" onClick={back} aria-label={t('ui.back')}>
              <Icon name="back" size={20} />
            </button>
            <Piece class="prp-info">
              <b class="prp-info__title">{t(`map.${nd.map}.name`)}</b>
              <span class="prp-info__goal">{goalLine(map.objectives.victory, map)}</span>
            </Piece>
            <button type="button" class={`hc-piece hud-round ${danger ? 'is-on' : ''}`} aria-pressed={danger} aria-label={t('ui.danger')} onClick={() => setDanger(!danger)}>
              <Icon name="danger" size={20} />
            </button>
          </div>
          <div class="prp-pills">
            <span class={`hc-piece prp-tag ${placement.length >= rules.max ? 'is-full' : ''}`} role="status">
              <Icon name="company" size={15} />
              {t('ui.prep.places', { n: placement.length, max: rules.max })}
            </span>
            <span class="hc-piece prp-hint">{hint}</span>
          </div>
        </div>
        <div class="hud-bottom prp-bottom" ref={bottomRef}>
          <Piece class="prp-bench" aria-label={t('ui.prep.bench')}>
            <span class="prp-bench__head">{t('ui.prep.bench')}</span>
            <div class="prp-bench__list">
              {bench.length ? (
                bench.map((r) => (
                  <button type="button" key={r.id} class={`prp-seat ${pick?.id === r.id ? 'is-picked' : ''}`} aria-pressed={pick?.id === r.id} onClick={() => tapBench(r.id)}>
                    <UnitHead portrait={r.portrait} classId={r.classId} name={unitName(r)} size={34} />
                    <span class="prp-seat__name">{unitName(r)}</span>
                    <span class="prp-seat__lv">
                      {t('ui.lv')} {r.level}
                    </span>
                  </button>
                ))
              ) : (
                <span class="prp-bench__empty">{t('ui.prep.benchEmpty')}</span>
              )}
            </div>
          </Piece>
          {/* always there, dimmed without a pick: the bottom keeps its height, so the board does not shift under a tap */}
          <div class="prp-row">
            {pick && (
              <span class="hc-piece prp-picked">
                {nameOf(pick.id)}
                {pickedForced && <Icon name="lock" size={14} />}
              </span>
            )}
            <SecondaryButton disabled={!pick} onClick={() => pick && setInv(pick.id)} aria-label={pick ? t('ui.prep.bag', { name: nameOf(pick.id) }) : undefined}>
              <Icon name="bag" size={18} />
              {t('ui.prep.bagShort')}
            </SecondaryButton>
            <SecondaryButton disabled={!onBoard || pickedForced} onClick={toBench} title={pickedForced ? t('ui.prep.forced') : undefined}>
              {t('ui.prep.toBench')}
            </SecondaryButton>
          </div>
          <div class="prp-row">
            <SecondaryButton onClick={reset}>{t('ui.prep.default')}</SecondaryButton>
            {/* a haunt has no required units: at least one has to go (Produktinhaber 2026-11-08) */}
            <PrimaryButton class="prp-start" disabled={!!over || !placement.length} onClick={start}>
              {t('ui.prep.start')}
            </PrimaryButton>
          </div>
          {over && (
            <p class="prp-over" role="alert">
              {t('ui.army.over', { n: over.dismiss })}
            </p>
          )}
        </div>
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
        {toast && <Toast text={toast} onDone={() => setToast(null)} />}
      </div>
      {infoUnit && <UnitInfo u={infoUnit} s={s} onClose={() => setInfo(null)} onEquip={() => undefined} canEdit={false} />}
      {invUnit && (
        <div class="prp-sheet">
          <FigureFlow unit={invUnit} units={c.roster.map((r) => r.id)} onSelect={setInv} onBack={() => setInv(null)} />
        </div>
      )}
    </div>
  );
}
