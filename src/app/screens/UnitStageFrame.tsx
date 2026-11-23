/**
 * Story 16.15: the frame of the unit stage (DESIGN `dress-doll`): the 3D figure over the whole screen, the hint "drag turns" and what
 * the owner hangs over it (places, pill). The Babylon part (`render/units/unitStage.ts`) loads on demand, so the first download does
 * not grow; until it is up, without a model (Blender figures without a rig, sprite figures), when it cannot load and when `enabled` is
 * off (the preparation, where the board lives: one scene at a time) the bust shows large instead, never an empty screen.
 */
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { GameData, UnitRecord } from '../../core';
import { t } from '../../i18n';
import type { Quality } from '../../render/host';
import type { UnitStage } from '../../render/units/unitStage';
import { UnitBust } from './unitArt';
import { dressKey } from './dollViewModel';
import { unitName } from '../../ui/components';

export interface UnitStageFrameProps {
  data: GameData;
  quality: Quality;
  unit: UnitRecord;
  /** false: no 3D scene is made, the bust shows (the preparation) */
  enabled: boolean;
  children?: ComponentChildren;
}

export function UnitStageFrame({ data, quality, unit, enabled, children }: UnitStageFrameProps) {
  /** the host's canvas goes in here; Preact never renders into it */
  const slot = useRef<HTMLDivElement>(null);
  const stage = useRef<UnitStage | null>(null);
  const [ready, setReady] = useState(false);
  const latest = useRef(unit);
  latest.current = unit;
  const key = dressKey(unit);
  const keyRef = useRef(key);
  keyRef.current = key;
  /** the key of what the stage shows (or loads), and the number of the newest load: older ones end without effect */
  const shownKey = useRef('');
  const run = useRef(0);

  const present = async (st: UnitStage): Promise<void> => {
    const id = ++run.current;
    shownKey.current = keyRef.current;
    const ok = await st.show(latest.current).catch(() => false);
    if (id === run.current) setReady(ok);
  };

  useEffect(() => {
    if (!enabled) return;
    let gone = false;
    let st: UnitStage | null = null;
    void import('../../render/units/unitStage')
      .then(async ({ UnitStageView }) => {
        if (gone || !slot.current) return;
        st = new UnitStageView(slot.current, data, quality);
        stage.current = st;
        await present(st);
      })
      .catch(() => {
        // the stage chunk did not load (offline, app update): the bust stays
      });
    return () => {
      gone = true;
      run.current++;
      st?.dispose();
      stage.current = null;
      shownKey.current = '';
      setReady(false);
    };
  }, [enabled]);

  // another figure, or another dressing (a changed rune): the stage builds the new model and gives the old one up
  useEffect(() => {
    if (stage.current && shownKey.current !== key) void present(stage.current);
  }, [key]);

  return (
    <div class="doll__stage">
      {!ready && (
        <div class="doll__bust">
          <UnitBust portrait={unit.portrait} classId={unit.classId} name={unitName(unit)} />
        </div>
      )}
      <div class="hc-stage-slot doll__slot3d" ref={slot} role="img" aria-label={t('ui.doll.stage', { name: unitName(unit) })} />
      {ready && <small class="doll__hint">{t('ui.doll.dragHint')}</small>}
      {children}
    </div>
  );
}
