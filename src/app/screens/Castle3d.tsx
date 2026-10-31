/**
 * EVALUATION SPIKE (dev only): the castle home as a 3D diorama instead of the painted picture, opened with `?castle3d=1`
 * (dev server, or any build with `?debug`). The scene module (`src/render/home/castle.ts`) is loaded on demand, so the
 * first download does not grow. A dev bar switches between picture and 3D and sets every room to level 1, 2 or 3.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { RoomStatus } from '../../core';
import { t } from '../../i18n';
import { Icon } from '../../ui/icons';
import { settings } from '../state/settings';
import { data } from '../state/session';
import type { CastleView } from '../../render/home/castle';
import './Castle3d.css';

/** Is the 3D test switched on (URL flag, dev build or `?debug`)? */
export function castle3dFlag(): boolean {
  if (typeof location === 'undefined') return false;
  const q = new URLSearchParams(location.search);
  return (import.meta.env.DEV || q.has('debug')) && q.get('castle3d') === '1';
}

export type CastleMode = 'picture' | '3d';

/** The dev bar: picture or 3D, and one level for all rooms (null = the campaign's own levels). */
export function CastleDevBar({ mode, setMode, level, setLevel }: { mode: CastleMode; setMode: (m: CastleMode) => void; level: number | null; setLevel: (n: number | null) => void }) {
  return (
    <div class="c3d-bar" role="toolbar" aria-label={t('ui.dev.castle3d.title')}>
      <button type="button" class={mode === 'picture' ? 'is-on' : ''} onClick={() => setMode('picture')}>
        {t('ui.dev.castle3d.picture')}
      </button>
      <button type="button" class={mode === '3d' ? 'is-on' : ''} onClick={() => setMode('3d')}>
        {t('ui.dev.castle3d.model')}
      </button>
      {mode === '3d' && (
        <>
          <span>{t('ui.dev.castle3d.level')}</span>
          {[1, 2, 3].map((n) => (
            <button key={n} type="button" class={level === n ? 'is-on' : ''} onClick={() => setLevel(level === n ? null : n)}>
              {n}
            </button>
          ))}
        </>
      )}
    </div>
  );
}

/**
 * The diorama in the picture's place, with the room stones over their buildings. `levelOf` gives a room's level, `onRoom`
 * is a tap on a building or stone (status null: a room the content does not have yet).
 */
export function Castle3d({ rooms, levelOf, onRoom }: { rooms: RoomStatus[]; levelOf: (id: string) => number; onRoom: (id: string, status: RoomStatus | null) => void }) {
  const slot = useRef<HTMLDivElement>(null);
  /** the host's canvas goes in here; Preact never renders into it */
  const stage = useRef<HTMLDivElement>(null);
  const view = useRef<CastleView | null>(null);
  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState<{ fps: number; drawCalls: number } | null>(null);
  const latest = useRef({ rooms, onRoom, levelOf });
  latest.current = { rooms, onRoom, levelOf };

  useEffect(() => {
    let gone = false;
    let v: CastleView | null = null;
    void import('../../render/home/castle').then(async ({ CastleView, SPIKE_SPOTS }) => {
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
      const anchors = data.home.castle.anchors.map((a) => ({ id: a.room, at: a.at as [number, number] }));
      const extra = Object.entries(SPIKE_SPOTS)
        .filter(([id]) => !anchors.some((a) => a.id === id))
        .map(([id, at]) => ({ id, at }));
      await v.build([...anchors, ...extra].map((r) => ({ ...r, level: latest.current.levelOf(r.id) })));
      if (!gone) setReady(true);
    });
    const timer = window.setInterval(() => {
      if (view.current) setStats(view.current.stats());
    }, 1000);
    return () => {
      gone = true;
      clearInterval(timer);
      v?.dispose();
      view.current = null;
    };
  }, []);

  // levels follow the dev bar (or the campaign)
  useEffect(() => {
    const v = view.current;
    if (!v || !ready) return;
    for (const id of [...data.home.castle.anchors.map((a) => a.room), 'enchanter', 'academy', 'workshop', 'training']) v.setLevel(id, levelOf(id));
  });

  return (
    <div class="hm__scene c3d" ref={slot}>
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
            </span>
          </button>
        ))}
      {stats && <small class="c3d-stats">{t('ui.dev.castle3d.stats', { fps: stats.fps, calls: stats.drawCalls })}</small>}
    </div>
  );
}
