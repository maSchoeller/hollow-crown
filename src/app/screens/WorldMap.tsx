/**
 * The world map, the hub of the campaign (concept/25-ux/mockups/03-weltkarte.html, story 5.3): the painted map of Valmora
 * with the nodes of the act on top (positions from `campaign.yaml`), the act pill, the purse, the round menu, the bar of
 * four stones, and the node card with "Aufstellung" and "Aufbrechen". Story 5.2 later swaps the painting for a 3D scene.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../i18n';
import { availableNodes, nodeLinks } from '../../core';
import { asset } from '../../ui/asset';
import { Toast } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { Amount, Piece, PrimaryButton, SecondaryButton, Wallet } from '../../ui/pieces';
import { audio } from '../audio';
import { nodeShort } from '../campaignInfo';
import { playNode } from '../state/flow';
import { packNeededFor } from '../state/packs';
import { PackRing, PackWait } from './PackStatus';
import { screen } from '../state/screen';
import { campaign, data } from '../state/session';
import { SaveSheet } from './SaveSheet';
import './WorldMap.css';

/** How far the map zooms in on a chosen node, and where on the screen (share of the height) it comes to rest above the card. */
const ZOOM = 1.12;
const REST_Y = 0.3;
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
  const world = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => audio.music('worldmap'), []);
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth > 0) setLoaded('ready');
  }, []);

  // drag panning (mouse, touch, pen): a press only becomes a drag after DRAG_THRESHOLD, so taps on nodes still click
  const drag = useRef({ id: -1, x: 0, y: 0, left: 0, top: 0, active: false, vx: 0, vy: 0, t: 0, swallow: false, swallowTimer: 0, raf: 0 });
  const stopGlide = () => {
    cancelAnimationFrame(drag.current.raf);
    drag.current.raf = 0;
  };
  useEffect(() => () => {
    stopGlide();
    clearTimeout(drag.current.swallowTimer);
  }, []);
  const onDown = (e: PointerEvent) => {
    const p = pan.current;
    if (!p || (e.pointerType === 'mouse' && e.button !== 0) || drag.current.id !== -1) return;
    stopGlide();
    clearTimeout(drag.current.swallowTimer); // a new touch ends the swallowing of the last drag's click
    Object.assign(drag.current, { id: e.pointerId, x: e.clientX, y: e.clientY, left: p.scrollLeft, top: p.scrollTop, active: false, vx: 0, vy: 0, t: e.timeStamp, swallow: false });
  };
  const onMove = (e: PointerEvent) => {
    const p = pan.current;
    const d = drag.current;
    if (!p || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      d.active = true;
      p.setPointerCapture(e.pointerId);
      p.classList.add('is-dragging');
    }
    const beforeX = p.scrollLeft;
    const beforeY = p.scrollTop;
    p.scrollLeft = d.left - dx; // the browser clamps to the map edges
    p.scrollTop = d.top - dy;
    const dt = Math.max(8, e.timeStamp - d.t);
    d.vx = Math.max(-MAX_GLIDE, Math.min(MAX_GLIDE, 0.8 * d.vx + 0.2 * ((p.scrollLeft - beforeX) / dt) * 16));
    d.vy = Math.max(-MAX_GLIDE, Math.min(MAX_GLIDE, 0.8 * d.vy + 0.2 * ((p.scrollTop - beforeY) / dt) * 16));
    d.t = e.timeStamp;
  };
  const onUp = (e: PointerEvent) => {
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
    const step = () => {
      d.vx *= INERTIA_DECAY;
      d.vy *= INERTIA_DECAY;
      if (Math.abs(d.vx) < 0.3 && Math.abs(d.vy) < 0.3) return void (d.raf = 0);
      p.scrollLeft += d.vx;
      p.scrollTop += d.vy;
      d.raf = requestAnimationFrame(step);
    };
    d.raf = requestAnimationFrame(step);
  };

  /** Scrolls the map so that a point (percent) sits in the middle horizontally and at `y` of the height. */
  const bring = (pos: [number, number], y: number, smooth: boolean) => {
    const p = pan.current;
    const w = world.current;
    if (!p || !w) return;
    p.scrollTo({ left: (pos[0] / 100) * w.offsetWidth - p.clientWidth / 2, top: (pos[1] / 100) * w.offsetHeight - p.clientHeight * y, behavior: smooth ? 'smooth' : 'auto' });
  };
  // first view: the next mission (or the home) in the middle
  useLayoutEffect(() => {
    const first = shown.find((n) => open.includes(n.id));
    bring(first ? first.pos : data.campaign.homePos, 0.42, false);
  }, []);

  const choose = (id: string | null) => {
    setMenu(false);
    setSel(id);
    const n = id ? nodes.find((x) => x.id === id) : undefined;
    if (n) bring(n.pos, REST_Y, true);
  };
  const node = sel ? nodes.find((n) => n.id === sel)! : null;
  const homeKind = data.campaign.home;
  const home = data.campaign.homePos;
  const ended = open.length === 0;

  return (
    <div class="wm">
      <div
        class="wm__pan"
        ref={pan}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClickCapture={(e) => {
          if (!drag.current.swallow) return;
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={() => choose(null)}
      >
        <div
          class={`wm__world ${node ? 'is-zoomed' : ''}`}
          ref={world}
          style={node ? { transformOrigin: `${node.pos[0]}% ${node.pos[1]}%`, '--wm-zoom': ZOOM } : undefined}
        >
          <img ref={img} class="wm__img" src={asset('world/valmora.webp')} alt="" draggable={false} onLoad={() => setLoaded('ready')} onError={() => setLoaded('failed')} />
          <svg class="wm__paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {nodeLinks(data).flatMap(([from, to]) => {
              const n = shown.find((x) => x.id === from);
              const m = shown.find((x) => x.id === to);
              if (!n || !m) return [];
              return [
                <g key={n.id + m.id}>
                  <line x1={n.pos[0]} y1={n.pos[1]} x2={m.pos[0]} y2={m.pos[1]} class="wm__path wm__path--edge" />
                  <line x1={n.pos[0]} y1={n.pos[1]} x2={m.pos[0]} y2={m.pos[1]} class="wm__path" />
                </g>,
              ];
            })}
          </svg>
          {/* the home is a place on the map as well (a tent in the camp, a castle later) */}
          <button
            type="button"
            class="wm-node wm-node--home"
            style={{ left: `${home[0]}%`, top: `${home[1]}%` }}
            aria-label={t(`home.${homeKind}.title`)}
            onClick={(e) => (e.stopPropagation(), (screen.value = { name: 'camp' }))}
          >
            <span class="wm-node__head">
              <Icon name="camp" size={22} />
            </span>
            <i class="wm-node__tail" />
            <span class="wm-node__label">{t(`home.${homeKind}.title`)}</span>
          </button>
          {shown.map((n) => {
            const done = c.completed.includes(n.id);
            const idx = nodes.indexOf(n);
            return (
              <button
                key={n.id}
                type="button"
                class={`wm-node ${done ? 'wm-node--done' : 'wm-node--story'} ${sel === n.id ? 'is-sel' : ''}`}
                style={{ left: `${n.pos[0]}%`, top: `${n.pos[1]}%` }}
                aria-label={t(n.titleKey)}
                aria-pressed={sel === n.id}
                onClick={(e) => (e.stopPropagation(), choose(n.id))}
              >
                <span class="wm-node__head">{idx === 0 ? 'P' : idx}</span>
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
