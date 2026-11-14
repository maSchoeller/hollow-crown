/**
 * The castle home in 3D (art direction §7). The scene module (`src/render/home/castle.ts`) and its model file are loaded on
 * demand, so the first download does not grow; until they are there, or if the model cannot be loaded, the painted picture
 * shows. The room stones sit over their buildings. What the scene shows comes from `castleScene` (story 10.14): the level of
 * every room, the castle tier and every companion's keepsake. With `?castle3d=1` (dev server, or any build with `?debug`) a
 * dev bar sets every room's level and the castle tier, and shows the keepsakes as mourned or gone, to look at each stage.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { CastleScene, RoomStatus } from '../../core';
import { t } from '../../i18n';
import { Icon } from '../../ui/icons';
import { Pips, UpArrow } from './roomStone';
import { settings } from '../state/settings';
import { data } from '../state/session';
import type { CastleView } from '../../render/home/castle';
import './Castle3d.css';

/** Is the dev bar switched on (URL flag, dev build or `?debug`)? */
export function castle3dFlag(): boolean {
  if (typeof location === 'undefined') return false;
  const q = new URLSearchParams(location.search);
  return (import.meta.env.DEV || q.has('debug')) && q.get('castle3d') === '1';
}

/** What the dev bar does to the keepsakes: show every companion's keepsake, mourn them all, or take them all away. */
export type DevKeepsakes = 'present' | 'mourned' | 'gone';

/** The dev bar: one stage for all rooms and walls (null = the campaign's own), and the state of all keepsakes. */
export function CastleDevBar({ tier, setTier, keepsakes, setKeepsakes }: { tier: number | null; setTier: (n: number | null) => void; keepsakes: DevKeepsakes | null; setKeepsakes: (k: DevKeepsakes | null) => void }) {
  return (
    <div class="c3d-bar" role="toolbar" aria-label={t('ui.dev.castle3d.title')}>
      <span>{t('ui.dev.castle3d.level')}</span>
      {[0, 1, 2, 3].map((n) => (
        <button key={n} type="button" class={tier === n ? 'is-on' : ''} onClick={() => setTier(tier === n ? null : n)}>
          {n}
        </button>
      ))}
      <span>{t('ui.dev.castle3d.keepsakes')}</span>
      {(['present', 'mourned', 'gone'] as const).map((k) => (
        <button key={k} type="button" class={keepsakes === k ? 'is-on' : ''} onClick={() => setKeepsakes(keepsakes === k ? null : k)}>
          {t(`ui.dev.castle3d.keepsake.${k}`)}
        </button>
      ))}
    </div>
  );
}

/**
 * The scene in the picture's place. `scene` says what it shows (`castleScene`, with the dev bar's overrides applied),
 * `onRoom` is a tap on a building or stone (status null: a room the content does not have yet). `fallback` is the picture.
 */
export function Castle3d({ rooms, scene, canBuild, onRoom, fallback, stats: showStats }: { rooms: RoomStatus[]; scene: CastleScene; canBuild: (id: string) => boolean; onRoom: (id: string, status: RoomStatus | null) => void; fallback: string; stats: boolean }) {
  /** the host's canvas goes in here; Preact never renders into it */
  const stage = useRef<HTMLDivElement>(null);
  const view = useRef<CastleView | null>(null);
  const ids = useRef<string[]>([]);
  const levelOf = (id: string) => scene.rooms[id] ?? 0;
  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState<{ fps: number; drawCalls: number } | null>(null);
  const latest = useRef({ rooms, onRoom });
  latest.current = { rooms, onRoom };

  useEffect(() => {
    let gone = false;
    let v: CastleView | null = null;
    void import('../../render/home/castle').then(async ({ CastleView, CASTLE_ROOMS }) => {
      if (gone || !stage.current) return;
      v = new CastleView(
        stage.current,
        data,
        {
          onRoom: (id) => {
            const { rooms: list, onRoom: tap } = latest.current;
            tap(id, list.find((s) => s.room.id === id) ?? null);
          },
        },
        settings.value.quality,
      );
      view.current = v;
      ids.current = CASTLE_ROOMS;
      if ((await v.build()) && !gone) setReady(true);
    });
    const timer = showStats
      ? window.setInterval(() => {
          if (view.current) setStats(view.current.stats());
        }, 1000)
      : 0;
    return () => {
      gone = true;
      clearInterval(timer);
      v?.dispose();
      view.current = null;
    };
  }, []);

  // levels, tier and keepsakes follow the campaign (and the dev bar)
  useEffect(() => {
    const v = view.current;
    if (!v || !ready) return;
    for (const id of ids.current) v.setLevel(id, levelOf(id));
    v.setTier(scene.tier);
    for (const k of scene.keepsakes) v.setKeepsake(k.id, k.state);
  });

  return (
    <div class="hm__scene c3d">
      {!ready && <img class="c3d-fallback" src={fallback} alt="" draggable={false} />}
      <div class="hc-stage-slot" ref={stage} />
      {ready &&
        rooms.map((st) => (
          <button
            key={st.room.id}
            ref={(el) => view.current?.setPin(st.room.id, el)}
            type="button"
            class={`hm-anchor c3d-pin ${st.open ? '' : 'is-locked'}`}
            aria-label={t(`room.${st.room.id}.name`)}
            onClick={() => onRoom(st.room.id, st)}
          >
            <span class="hm-room__stone">
              <Icon name={st.open ? st.room.icon : 'lock'} size={18} />
              {st.open && canBuild(st.room.id) && <UpArrow />}
            </span>
            {/* story 10.1: the same dots and arrow as the list (UX log 2026-11-04) */}
            {st.room.levels.length > 0 && st.open && <Pips level={levelOf(st.room.id)} max={st.room.levels.length + 1} />}
          </button>
        ))}
      {stats && <small class="c3d-stats">{t('ui.dev.castle3d.stats', { fps: stats.fps, calls: stats.drawCalls })}</small>}
    </div>
  );
}
