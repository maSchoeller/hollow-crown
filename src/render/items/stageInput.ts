/**
 * Story 16.15: the pointer input of a turntable stage, shared by the item stage and the unit stage: a drag turns the model
 * (`StageMotion`), a quick second tap resets it. Listeners go with the signal.
 */
import type { StageMotion } from './stageMath';

export interface TurntableInput {
  tapSlopPx: number;
  doubleTapMs: number;
}

/**
 * `motion()` is read at each event (a stage may swap its motion when it poses a new model); `yawOnly` ignores the vertical drag
 * (the dress-up doll turns about the vertical axis only).
 */
export function listenTurntable(slot: HTMLElement, def: TurntableInput, motion: () => StageMotion, signal: AbortSignal, yawOnly = false): void {
  const sig = { signal };
  let down: { id: number; x: number; y: number; t: number; moved: number } | null = null;
  let lastTap = -Infinity;
  slot.addEventListener(
    'pointerdown',
    (e) => {
      if (down || e.button > 0) return;
      down = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
      slot.setPointerCapture?.(e.pointerId);
      motion().press();
    },
    sig,
  );
  slot.addEventListener(
    'pointermove',
    (e) => {
      if (!down || e.pointerId !== down.id) return;
      const now = performance.now();
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      down.moved += Math.abs(dx) + Math.abs(dy);
      motion().drag(dx, yawOnly ? 0 : dy, now - down.t);
      down.x = e.clientX;
      down.y = e.clientY;
      down.t = now;
    },
    sig,
  );
  const up = (e: PointerEvent): void => {
    if (!down || e.pointerId !== down.id) return;
    const tap = down.moved <= def.tapSlopPx;
    down = null;
    motion().release();
    if (!tap) return;
    const now = performance.now();
    if (now - lastTap <= def.doubleTapMs) {
      lastTap = -Infinity;
      motion().reset();
    } else lastTap = now;
  };
  slot.addEventListener('pointerup', up, sig);
  slot.addEventListener('pointercancel', up, sig);
}
