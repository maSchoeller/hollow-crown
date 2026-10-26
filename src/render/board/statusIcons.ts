/**
 * Status icons over the figures (story 8.6, art-direction §8): painted round-chibi symbols (burning, wet, slowed;
 * `art/status/source`, built to `core/status/<id>.webp`) in a small row at the right of a unit's head. DOM overlay in the
 * board's float layer like the bleed counters and pennants: the row is rebuilt only when a unit's statuses change, placed
 * from the unit's screen position each frame, icons fade in and out. A status without a built image shows nothing.
 */
import type { StatusId } from '../../core/defs';
import { assetUrl } from '../shared/assets';
import './statusIcons.css';

/** Statuses a unit can carry that have an icon (`knockback` is never stored). */
export const ICON_STATUSES: readonly StatusId[] = ['burning', 'wet', 'slowed'];

/** The statuses of a unit that get an icon, in the fixed order of `ICON_STATUSES` (a row never reshuffles by the order they came in). */
export function iconsOf(status: ReadonlyArray<{ id: StatusId }>): StatusId[] {
  return ICON_STATUSES.filter((id) => status.some((s) => s.id === id));
}

interface Row {
  el: HTMLDivElement;
  ids: StatusId[];
}

export class StatusIcons {
  private rows = new Map<string, Row>();

  constructor(
    private layer: HTMLElement,
    private fadeMs: number,
    sizePx: number,
  ) {
    layer.style.setProperty('--hc-status-size', `${sizePx}px`);
    layer.style.setProperty('--hc-status-fade', `${fadeMs}ms`);
  }

  /** Shows `ids` over unit `uid`; icons that stay are left alone, new ones fade in, gone ones fade out. */
  set(uid: string, ids: readonly StatusId[]): void {
    let row = this.rows.get(uid);
    if (!ids.length && !row) return;
    if (!row) {
      const el = document.createElement('div');
      el.className = 'hc-status';
      el.setAttribute('aria-hidden', 'true');
      this.layer.appendChild(el);
      row = { el, ids: [] };
      this.rows.set(uid, row);
    }
    const same = row.ids.length === ids.length && row.ids.every((id, i) => id === ids[i]);
    if (same) return;
    for (const old of row.ids) if (!ids.includes(old)) this.fadeOut(row.el.querySelector<HTMLElement>(`[data-status="${old}"]`));
    ids.forEach((id, i) => {
      if (row!.el.querySelector(`[data-status="${id}"]:not(.is-leaving)`)) return;
      const img = document.createElement('img');
      img.className = 'hc-status__icon';
      img.dataset.status = id;
      img.alt = '';
      img.draggable = false;
      img.src = assetUrl(`core/status/${id}.webp`);
      img.style.order = String(i);
      img.addEventListener('error', () => img.remove(), { once: true });
      row!.el.appendChild(img);
      // the next frame, so the transition runs from transparent
      requestAnimationFrame(() => img.classList.add('is-shown'));
    });
    ids.forEach((id, i) => {
      const icon = row!.el.querySelector<HTMLElement>(`[data-status="${id}"]:not(.is-leaving)`);
      if (icon) icon.style.order = String(i);
    });
    row.ids = [...ids];
    if (!ids.length) {
      // the whole row goes once the last icon has faded
      setTimeout(() => {
        if (this.rows.get(uid)?.ids.length === 0) this.drop(uid);
      }, this.fadeMs + 50);
    }
  }

  private fadeOut(icon: HTMLElement | null): void {
    if (!icon) return;
    icon.classList.add('is-leaving');
    icon.classList.remove('is-shown');
    setTimeout(() => icon.remove(), this.fadeMs + 30);
  }

  /**
   * The row of `uid` at screen point (x, y) in CSS px, shown or not (a unit that is hidden, downed or off screen shows no icons).
   * `centred`: over the head; otherwise the row starts at the point and runs to the right (beside a lieutenant's pennant).
   */
  place(uid: string, x: number, y: number, shown: boolean, centred = true): void {
    const row = this.rows.get(uid);
    if (!row) return;
    row.el.style.transform = `translate(${x}px, ${y}px) translate(${centred ? '-50%' : '0'}, -100%)`;
    row.el.style.display = shown ? '' : 'none';
  }

  /** Does unit `uid` have a row (icons or fading ones)? */
  has(uid: string): boolean {
    return this.rows.has(uid);
  }

  uids(): IterableIterator<string> {
    return this.rows.keys();
  }

  drop(uid: string): void {
    this.rows.get(uid)?.el.remove();
    this.rows.delete(uid);
  }

  dispose(): void {
    for (const r of this.rows.values()) r.el.remove();
    this.rows.clear();
  }
}
