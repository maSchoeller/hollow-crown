/**
 * Story 16.14: the one way into the weapon view. The troop's figure sheet calls it today (16.15 and the armoury, 16.18, later):
 * `back` is where the close stone leads. A leaf next to `screen.ts`, no barrel.
 */
import { screen, type Screen } from './screen';

/** Opens the weapon view for the piece `uid`; `unit` is the figure whose stats the changes are worked out for (default: its owner). */
export function openWeapon(uid: string, opts: { unit?: string; back?: Screen } = {}): void {
  const cur = screen.value;
  // the troop reopens on the figure it was left on
  const back = opts.back ?? (cur.name === 'troop' && opts.unit ? { ...cur, unit: opts.unit } : cur);
  screen.value = { name: 'weapon', item: uid, ...(opts.unit ? { unit: opts.unit } : {}), back };
}
