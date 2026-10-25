/**
 * The world map, the hub of the campaign (concept/25-ux/mockups/03-weltkarte.html, stories 5.2 and 5.3): Valmora as a flat
 * painted picture you pan and zoom, the stones of the nodes on it (places from `content/world/valmora.yaml`), the act pill,
 * the purse, the round menu, the bar of four stones, and the node card with "Aufstellung" and "Aufbrechen".
 * The picture moves by CSS transform; stones, paths and region names are HTML over it that follow their places.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../i18n';
import { availableNodes, nodeLinks } from '../../core';
import { assetUrl } from '../../render/shared/assets';
import { Toast } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { Amount, Piece, PrimaryButton, SecondaryButton, Wallet } from '../../ui/pieces';
import { audio } from '../audio';
import { nodeShort } from '../campaignInfo';
import { advanceToToday, playNode } from '../state/flow';
import { packNeededFor } from '../state/packs';
import { PackRing, PackWait } from './PackStatus';
import { screen } from '../state/screen';
import { campaign, data } from '../state/session';
import { SaveSheet } from './SaveSheet';
import { clampView, focusView, fogTop, placeOf, screenOf, stepScale, zoomAround, type MapView, type Screen } from './worldMapView';
import './WorldMap.css';

/** Where on the screen (share of the height) a chosen node comes to rest above the card, and the first view's node. */
const REST_Y = 0.3;
const START_Y = 0.42;
/** The picture may be pushed this far past its top and bottom edge (px): out from under the HUD pills and the bar of stones. */
const PAD = { top: 80, bottom: 64 };
/** While a node card is open the picture may come up to the card's top edge, so places at the south edge can rise above it. */
const CARD_PAD = { top: 80, bottom: 200 };
/** Spread of two fingers (ratio) that switches the zoom step. */
const PINCH_STEP = 1.3;
/** Pointer travel (px) after which a press counts as a drag and not as a tap. */
const DRAG_THRESHOLD = 6;
/** how long the click after a drag is swallowed at most (ms) */
const SWALLOW_MS = 350;
/** Fastest glide (px per frame) after a drag. */
const MAX_GLIDE = 24;
/** Share of the release speed that is kept per frame while the map glides on after a drag. */
const INERTIA_DECAY = 0.92;

/** Icon of the goal chip per victory type. */
const GOAL_ICON: Record<string, string> = { rout: 'attack', boss: 'attack', reach: 'target', seize: 'seize', defend: 'shield', survive: 'wait', escape: 'escape' };

type Loaded = 'loading' | 'ready' | 'failed';

export function WorldMap() {
  const c = campaign.value!;
  const nodes = data.campaign.nodes;
  const open = availableNodes(data, c).map((n) => n.id);
  const shown = nodes.filter((n) => c.completed.includes(n.id) || open.includes(n.id));
  const [sel, setSel] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Loaded>('loading');
  const pan = useRef<HTMLDivElement>(null);
  const picture = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => audio.music('worldmap'), []);

  // a new day (story 5.4): on opening the map and when the app comes back to it; new day packets show a short hint
  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      const e = advanceToToday();
      if (e && e.packets.length) setToast(t('ui.map.newDay', { n: e.haunts, time: `${data.balance.day.resetHour}:00` }));
    };
    check();
    document.addEventListener('visibilitychange', check);
    return () => document.removeEventListener('visibilitychange', check);
  }, []);

  const world = data.world;
  const conf = data.render.worldMap;
  const size = world.size;
  const home = placeOf(world, { home: true }) ?? world.places[0]!;
  const placeById = (id: string) => placeOf(world, { node: id });
  const fog = fogTop(world, data.campaign.act);

  // the view: where the picture lies (offset and scale) and the zoom step; every change puts the HTML pieces over their places
  const view = useRef<MapView>({ x: 0, y: 0, s: 1 });
  const step = useRef(0);
  const tween = useRef(0);
  const chosen = useRef<string | null>(null);
  const pad = () => (chosen.current ? CARD_PAD : PAD);
  const screenSize = (): Screen => ({ w: pan.current?.clientWidth ?? 1, h: pan.current?.clientHeight ?? 1 });
  const apply = () => {
    const v = view.current;
    if (picture.current) picture.current.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.s})`;
    const root = layer.current;
    if (!root) return;
    for (const el of root.querySelectorAll<HTMLElement>('[data-x]')) {
      const [x, y] = screenOf(v, size, [Number(el.dataset.x), Number(el.dataset.y)]);
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }
    for (const line of root.querySelectorAll<SVGLineElement>('line[data-a]')) {
      const [ax, ay] = screenOf(v, size, line.dataset.a!.split(',').map(Number) as [number, number]);
      const [bx, by] = screenOf(v, size, line.dataset.b!.split(',').map(Number) as [number, number]);
      line.setAttribute('x1', String(ax));
      line.setAttribute('y1', String(ay));
      line.setAttribute('x2', String(bx));
      line.setAttribute('y2', String(by));
    }
  };
  const stopTween = () => {
    cancelAnimationFrame(tween.current);
    tween.current = 0;
  };
  const set = (v: MapView) => {
    stopTween();
    view.current = clampView(v, screenSize(), size, pad());
    apply();
  };
  /** glide to a view in `zoomMs` (ease out) */
  const glide = (to: MapView) => {
    stopTween();
    const from = view.current;
    const start = performance.now();
    const tick = (now: number) => {
      const k = conf.zoomMs <= 0 ? 1 : Math.min(1, (now - start) / conf.zoomMs);
      const e = 1 - (1 - k) ** 3;
      view.current = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, s: from.s + (to.s - from.s) * e };
      apply();
      tween.current = k < 1 ? requestAnimationFrame(tick) : 0;
    };
    tween.current = requestAnimationFrame(tick);
  };
  const scaleOfStep = (i: number, focus = 1) => stepScale(screenSize(), size, conf.zoomSteps, i, focus);
  /** switches the zoom step around the middle of the screen */
  const zoom = (dir: 1 | -1) => {
    const next = Math.min(conf.zoomSteps.length - 1, Math.max(0, step.current + dir));
    if (next === step.current) return;
    step.current = next;
    const scr = screenSize();
    glide(zoomAround(view.current, scr, size, scaleOfStep(next), [scr.w / 2, scr.h / 2], pad()));
  };

  // first view: the next mission (or the home) in the middle; the picture follows the screen when it is resized
  useEffect(() => {
    const first = shown.find((n) => open.includes(n.id));
    const p = (first && placeById(first.id)) ?? home;
    set(focusView(screenSize(), size, scaleOfStep(0), p.at, [0.5, START_Y], pad()));
    const ro = new ResizeObserver(() => set({ ...view.current, s: scaleOfStep(step.current) }));
    ro.observe(pan.current!);
    return () => {
      ro.disconnect();
      stopTween();
    };
  }, []);

  // drag panning (mouse, touch, pen): a press only becomes a drag after DRAG_THRESHOLD, so taps on nodes still click;
  // two fingers switch the zoom step (pinch), the wheel does the same
  const drag = useRef({ id: -1, x: 0, y: 0, sx: 0, sy: 0, active: false, vx: 0, vy: 0, t: 0, swallow: false, swallowTimer: 0, raf: 0 });
  const fingers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);
  const panBy = (dx: number, dy: number) => set({ ...view.current, x: view.current.x + dx, y: view.current.y + dy });
  const stopGlide = () => {
    cancelAnimationFrame(drag.current.raf);
    drag.current.raf = 0;
  };
  useEffect(() => () => {
    stopGlide();
    clearTimeout(drag.current.swallowTimer);
  }, []);
  const spread = () => {
    const [a, b] = [...fingers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (fingers.current.size === 2) pinch.current = spread();
    if (drag.current.id !== -1) return;
    stopGlide();
    stopTween();
    clearTimeout(drag.current.swallowTimer); // a new touch ends the swallowing of the last drag's click
    Object.assign(drag.current, { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, active: false, vx: 0, vy: 0, t: e.timeStamp, swallow: false });
  };
  const onMove = (e: PointerEvent) => {
    const p = pan.current;
    const d = drag.current;
    const f = fingers.current.get(e.pointerId);
    if (f) Object.assign(f, { x: e.clientX, y: e.clientY });
    if (fingers.current.size === 2 && pinch.current > 0) {
      const k = spread() / pinch.current;
      if (k > PINCH_STEP || k < 1 / PINCH_STEP) {
        zoom(k > 1 ? 1 : -1);
        pinch.current = spread();
      }
    }
    if (!p || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.active) {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < DRAG_THRESHOLD) return;
      d.active = true;
      p.setPointerCapture(e.pointerId);
      p.classList.add('is-dragging');
    }
    d.x = e.clientX;
    d.y = e.clientY;
    panBy(dx, dy);
    const dt = Math.max(8, e.timeStamp - d.t);
    d.vx = Math.max(-MAX_GLIDE, Math.min(MAX_GLIDE, 0.8 * d.vx + 0.2 * (dx / dt) * 16));
    d.vy = Math.max(-MAX_GLIDE, Math.min(MAX_GLIDE, 0.8 * d.vy + 0.2 * (dy / dt) * 16));
    d.t = e.timeStamp;
  };
  const onUp = (e: PointerEvent) => {
    fingers.current.delete(e.pointerId);
    if (fingers.current.size < 2) pinch.current = 0;
    const p = pan.current;
    const d = drag.current;
    if (!p || e.pointerId !== d.id) return;
    d.id = -1;
    p.classList.remove('is-dragging');
    if (!d.active) return;
    d.active = false;
    if (e.type === 'pointerup') {
      // the click that follows a real drag is not a tap; touch browsers may send it late, so it stays
      // swallowed until the next pointerdown or 350 ms, whichever comes first
      d.swallow = true;
      clearTimeout(d.swallowTimer);
      d.swallowTimer = window.setTimeout(() => (d.swallow = false), SWALLOW_MS);
    }
    if (e.timeStamp - d.t > 80) return; // held still before release: no glide
    const stepGlide = () => {
      d.vx *= INERTIA_DECAY;
      d.vy *= INERTIA_DECAY;
      if (Math.abs(d.vx) < 0.3 && Math.abs(d.vy) < 0.3) return void (d.raf = 0);
      panBy(d.vx, d.vy);
      d.raf = requestAnimationFrame(stepGlide);
    };
    d.raf = requestAnimationFrame(stepGlide);
  };

  /** A chosen node comes a little closer and rests above the card; choosing nothing lets the view go back to its zoom step. */
  const choose = (id: string | null) => {
    setMenu(false);
    setSel(id);
    chosen.current = id;
    const scr = screenSize();
    const p = id ? placeById(id) : null;
    if (p) glide(focusView(scr, size, scaleOfStep(step.current, conf.focusZoom), p.at, [0.5, REST_Y], pad()));
    else glide(zoomAround(view.current, scr, size, scaleOfStep(step.current), [scr.w / 2, scr.h * REST_Y], pad()));
  };
  const node = sel ? nodes.find((n) => n.id === sel)! : null;
  const ended = open.length === 0;
  /** data attributes that pin an element over a place (percent of the picture) */
  const over = (at: readonly [number, number]) => ({ 'data-x': at[0], 'data-y': at[1] });
  const ends = (at: readonly [number, number]) => `${at[0]},${at[1]}`;

  return (
    <div class="wm">
      <div
        class="wm__pan"
        ref={pan}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={(e) => {
          e.preventDefault();
          zoom(e.deltaY < 0 ? 1 : -1);
        }}
        onClickCapture={(e) => {
          if (!drag.current.swallow) return;
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={() => choose(null)}
      >
        <div class="wm__picture" ref={picture} style={{ width: `${size[0]}px`, height: `${size[1]}px` }}>
          <img
            class="wm__img"
            src={assetUrl(`world/${world.image}.webp`)}
            width={size[0]}
            height={size[1]}
            alt=""
            draggable={false}
            onLoad={() => setLoaded('ready')}
            onError={() => setLoaded('failed')}
          />
          {fog !== null && <div class="wm__fog" style={{ height: `${fog}%` }} />}
        </div>
        <div class="wm__world" ref={layer}>
          <svg class="wm__paths" aria-hidden="true">
            {nodeLinks(data).flatMap(([from, to]) => {
              const a = shown.some((x) => x.id === from) && placeById(from);
              const b = shown.some((x) => x.id === to) && placeById(to);
              if (!a || !b) return [];
              return [
                <g key={from + to}>
                  <line data-a={ends(a.at)} data-b={ends(b.at)} class="wm__path wm__path--edge" />
                  <line data-a={ends(a.at)} data-b={ends(b.at)} class="wm__path" />
                </g>,
              ];
            })}
          </svg>
          {fog !== null &&
            world.regions
              .filter((r) => r.act > data.campaign.act)
              .map((r) => (
                <div key={r.id} class="wm-region" {...over(r.at)} aria-hidden="true">
                  {t(`world.region.${r.id}`)}
                </div>
              ))}
          {/* the home is a place on the map as well (a tent in the camp, a castle later) */}
          <button
            type="button"
            class="wm-node wm-node--home"
            {...over(home.at)}
            aria-label={t(`home.${data.campaign.home}.title`)}
            onClick={(e) => (e.stopPropagation(), (screen.value = { name: 'camp' }))}
          >
            <span class="wm-node__head">
              <Icon name="camp" size={22} />
            </span>
            <i class="wm-node__tail" />
            <span class="wm-node__label">{t(`home.${data.campaign.home}.title`)}</span>
          </button>
          {shown.map((n) => {
            const done = c.completed.includes(n.id);
            const p = placeById(n.id);
            if (!p) return null;
            return (
              <button
                key={n.id}
                type="button"
                class={`wm-node ${done ? 'wm-node--done' : 'wm-node--story'} ${n.kind === 'side' ? 'wm-node--side' : ''} ${sel === n.id ? 'is-sel' : ''}`}
                {...over(p.at)}
                aria-label={t(n.titleKey)}
                aria-pressed={sel === n.id}
                onClick={(e) => (e.stopPropagation(), choose(n.id))}
              >
                <span class="wm-node__head">
                  <b>{p.label}</b>
                </span>
                <i class="wm-node__tail" />
                {!done && <span class="wm-node__label">{t(`map.${n.map}.name`)}</span>}
              </button>
            );
          })}
        </div>
      </div>
      {loaded !== 'ready' && (
        <Piece class="wm__loading" role="status">
          {t(loaded === 'failed' ? 'ui.map.mapMissing' : 'ui.map.loading')}
        </Piece>
      )}
      <div class="wm__hud">
        <div class="wm__top">
          <Piece class="wm-act">
            <span class="wm-act__badge">{data.campaign.act}</span>
            <span>
              <small>{t('ui.map.act', { act: data.campaign.act, season: t(`act.${data.campaign.act}.season`) })}</small>
              <b>{t(`act.${data.campaign.act}.name`)}</b>
            </span>
          </Piece>
          <button type="button" class="wm__round" aria-label={t('ui.menu')} aria-expanded={menu} onClick={() => setMenu(!menu)}>
            <Icon name={menu ? 'close' : 'menu'} size={22} />
          </button>
        </div>
        <Wallet data={data} gold={c.gold} materials={c.materials} />
        <PackRing />
        {menu && (
          <Piece class="wm-menu">
            <SecondaryButton
              onClick={() => {
                setMenu(false);
                setSaving(true);
              }}
            >
              {t('ui.save.title')}
            </SecondaryButton>
            <SecondaryButton onClick={() => (screen.value = { name: 'chronicle', from: 'worldmap' })}>{t('ui.chronicle.title')}</SecondaryButton>
            <SecondaryButton onClick={() => (screen.value = { name: 'options', back: { name: 'worldmap' } })}>{t('ui.options')}</SecondaryButton>
            <SecondaryButton onClick={() => (screen.value = { name: 'title' })}>{t('ui.end.toTitle')}</SecondaryButton>
          </Piece>
        )}
      </div>
      <div class="wm__bottom">
        {node ? (
          <NodeCard id={node.id} />
        ) : (
          <>
            {ended && (
              <Piece class="wm-end">
                <span class="wm-end__crown" aria-hidden="true">
                  ♛
                </span>
                <b>{t('ui.end.title')}</b>
                <p>{t('ui.end.text')}</p>
                <PrimaryButton onClick={() => (screen.value = { name: 'camp' })}>{t('ui.map.home')}</PrimaryButton>
              </Piece>
            )}
            <nav class="wm-nav">
              <button type="button" onClick={() => (screen.value = { name: 'camp' })}>
                <Icon name="camp" size={26} />
                {t('ui.map.home')}
              </button>
              <button type="button" onClick={() => (screen.value = { name: 'troop', from: 'worldmap' })}>
                <Icon name="company" size={26} />
                {t('ui.troop.title')}
              </button>
              <button type="button" class="is-dim" aria-disabled="true" onClick={() => setToast(t('ui.map.soon.wanted'))}>
                <Icon name="wanted" size={26} />
                {t('ui.map.wanted')}
              </button>
              <button type="button" onClick={() => (screen.value = { name: 'chronicle', from: 'worldmap' })}>
                <Icon name="log" size={26} />
                {t('ui.map.chronicle')}
              </button>
            </nav>
          </>
        )}
      </div>
      {saving && <SaveSheet onClose={() => setSaving(false)} onToast={setToast} />}
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

/** The card of a chosen node: kicker, title, goal / places / level chips, reward, "Aufstellung" and "Aufbrechen". */
function NodeCard({ id }: { id: string }) {
  const c = campaign.value!;
  const n = data.campaign.nodes.find((x) => x.id === id)!;
  // a mission of an act pack that is still loading is visible, but starts only afterwards (story 7.2)
  const pack = packNeededFor(n);
  const map = data.maps[n.map];
  if (pack || !map) {
    return (
      <Piece class="wm-card" onClick={(e) => e.stopPropagation()}>
        <div class="wm-card__kicker">{t('ui.map.kicker', { node: nodeShort(id) })}</div>
        <h2 class="wm-card__title">{t(`map.${n.map}.name`)}</h2>
        <PackWait pack={pack ?? ''} />
      </Piece>
    );
  }
  const done = c.completed.includes(id);
  const goal = map.objectives.victory.type;
  return (
    <Piece class="wm-card" onClick={(e) => e.stopPropagation()}>
      <div class="wm-card__kicker">{t('ui.map.kicker', { node: nodeShort(id) })}</div>
      <h2 class="wm-card__title">{t(`map.${n.map}.name`)}</h2>
      <div class="wm-card__tags">
        <span class="wm-tag">
          <Icon name={GOAL_ICON[goal] ?? 'target'} size={15} />
          {t(`ui.map.tag.${goal}`)}
        </span>
        <span class="wm-tag">
          <Icon name="company" size={15} />
          {t('ui.map.places', { n: map.deploy.max })}
        </span>
        <span class="wm-tag">{t('ui.map.level', { n: n.expectedLevel })}</span>
      </div>
      {done ? (
        <p class="wm-card__done">{t('ui.map.done')}</p>
      ) : (
        <>
          <div class="wm-card__reward">
            <Amount resource="gold" value={map.goldReward} />
            {map.objectives.side.length > 0 && <span>{t('ui.map.side', { n: map.objectives.side.length })}</span>}
          </div>
          <div class="wm-card__buttons">
            <SecondaryButton onClick={() => playNode(id, { prep: true, from: 'worldmap' })}>{t('ui.hub.prep')}</SecondaryButton>
            <PrimaryButton onClick={() => playNode(id)}>{t('ui.hub.setOut')}</PrimaryButton>
          </div>
        </>
      )}
    </Piece>
  );
}
