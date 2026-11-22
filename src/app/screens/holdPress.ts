/**
 * Hold a button (story 16.11, "Gefahr" gedrückt halten: Gelände): after `ms` the hold fires once and the click that follows the release is swallowed,
 * so a tap still works as a tap. `holding` drives the fill ring on the button while the finger is down.
 */
import { useEffect, useRef, useState } from 'preact/hooks';

export interface HoldPress {
  holding: boolean;
  bind: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
    onPointerCancel: () => void;
    onContextMenu: (e: Event) => void;
  };
  /** true once after a hold fired: the click after the release must do nothing */
  swallowClick: () => boolean;
}

/** `onHold` absent: nothing is bound (a plain button). */
export function useHoldPress(ms: number, onHold?: () => void): HoldPress | null {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const fired = useRef(false);
  const hold = useRef(onHold);
  hold.current = onHold;
  const [holding, setHolding] = useState(false);
  const stop = () => {
    clearTimeout(timer.current);
    setHolding(false);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  if (!onHold) return null;
  return {
    holding,
    bind: {
      onPointerDown: (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        fired.current = false;
        setHolding(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          fired.current = true;
          setHolding(false);
          hold.current?.();
        }, ms);
      },
      onPointerUp: stop,
      onPointerLeave: stop,
      onPointerCancel: stop,
      // a long press on touch opens the browser's context menu: not on this button
      onContextMenu: (e) => e.preventDefault(),
    },
    swallowClick: () => {
      const was = fired.current;
      fired.current = false;
      return was;
    },
  };
}
