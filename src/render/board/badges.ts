/**
 * Badges over the figures (stories 13.3, 13.4, 13.6, 13.9): the HP bar in team colour with ticks, a lieutenant's gold outline,
 * the ember edge below the critical share, the flashing part a previewed attack takes; at its left the kill marker (full or
 * half skull, a lieutenant's flee mark) or the grey warning skull, at its right the done check. DOM in the board's float layer
 * like the bleed counters (architecture §5.12): one element per unit, placed from the unit's screen position each frame, written
 * only when the position or the content changed (story 7.8 frame budget).
 */
import type { LegibilityDef, Team } from '../../core';
import './badges.css';

export type HpBarMode = 'always' | 'hurt' | 'off';
export type KillKind = 'hit' | 'crit' | 'flee' | 'fleeCrit' | 'warn';

export interface BadgeUnit {
  team: Team;
  hp: number;
  maxHp: number;
  lieutenant: boolean;
}

interface Badge {
  el: HTMLDivElement;
  fill: HTMLElement;
  loss: HTMLElement;
  bar: HTMLElement;
  mark: HTMLElement;
  check: HTMLElement;
  unit: BadgeUnit;
  /** content written last: re-rendered only on a change */
  sig: string;
  x: number;
  y: number;
  shown: boolean;
}

/** Which HP a bar fills, which tick step it shows and whether it is critical (pure, tested). */
export function barLook(look: LegibilityDef['hpBar'], hp: number, maxHp: number): { share: number; tick: number; critical: boolean } {
  const max = Math.max(1, maxHp);
  const share = Math.max(0, Math.min(1, hp / max));
  const step = maxHp >= look.wideFrom ? look.tickWide : look.tick;
  return { share, tick: step / max, critical: hp > 0 && hp < max * look.critical };
}

/** Does the bar of this unit show under the option `mode`? Lieutenants always show theirs under "only hurt" (story 13.3). */
export function barShown(mode: HpBarMode, u: BadgeUnit): boolean {
  if (mode === 'off') return false;
  if (mode === 'hurt') return u.lieutenant || u.hp < u.maxHp;
  return true;
}

const SKULL =
  '<svg viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="10" class="b-bg"/><path class="b-half" d="M11 2a9 9 0 0 1 0 18z"/>' +
  '<path class="b-skull" d="M6 10.5a5 5 0 0 1 10 0v2.5h-2v2h-6v-2h-2z"/><circle cx="9" cy="11" r="1.3" class="b-eye"/><circle cx="13" cy="11" r="1.3" class="b-eye"/>' +
  '<text x="17.5" y="8" class="b-bang">!</text></svg>';
const FLEE =
  '<svg viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="10" class="b-bg"/><path class="b-half" d="M11 2a9 9 0 0 1 0 18z"/>' +
  '<path class="b-skull" d="M5 12h8m-3-4 4 4-4 4M15 6v10" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.5l2.6 2.6L12 5.6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export class Badges {
  private badges = new Map<string, Badge>();
  private mode: HpBarMode = 'always';
  private marks = new Map<string, KillKind>();
  private done = new Set<string>();
  private preview: { uid: string; after: number } | null = null;
  private widthPx = 0;

  constructor(
    private layer: HTMLElement,
    private look: LegibilityDef['hpBar'],
  ) {}

  setMode(mode: HpBarMode): void {
    if (mode === this.mode) return;
    this.mode = mode;
    for (const uid of this.badges.keys()) this.render(uid);
  }

  /** Bar width for the current zoom (pixels per tile), bounded by render.yaml. */
  setScale(ppt: number): void {
    const w = Math.round(Math.max(this.look.minPx, Math.min(this.look.maxPx, ppt * this.look.widthTiles)));
    if (w === this.widthPx) return;
    this.widthPx = w;
    this.layer.style.setProperty('--hc-hpbar-w', `${w}px`);
    this.layer.style.setProperty('--hc-hpbar-h', `${this.look.heightPx}px`);
  }

  /** A unit on the board, or `null` when it left it (downed, fled, dead units have no bar). */
  set(uid: string, u: BadgeUnit | null): void {
    let b = this.badges.get(uid);
    if (!u) {
      b?.el.remove();
      this.badges.delete(uid);
      return;
    }
    if (!b) {
      const el = document.createElement('div');
      el.className = 'hc-badge';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<span class="hc-badge__mark"></span><span class="hc-hpbar"><i class="hc-hpbar__fill"></i><i class="hc-hpbar__loss"></i></span><span class="hc-badge__check"></span>';
      this.layer.appendChild(el);
      b = {
        el,
        bar: el.querySelector('.hc-hpbar')!,
        fill: el.querySelector('.hc-hpbar__fill')!,
        loss: el.querySelector('.hc-hpbar__loss')!,
        mark: el.querySelector('.hc-badge__mark')!,
        check: el.querySelector('.hc-badge__check')!,
        unit: u,
        sig: '',
        x: NaN,
        y: NaN,
        shown: true,
      };
      this.badges.set(uid, b);
    }
    b.unit = u;
    this.render(uid);
  }

  /** HP changed while the events play (the bar follows each hit). */
  setHp(uid: string, hp: number): void {
    const b = this.badges.get(uid);
    if (!b || b.unit.hp === hp) return;
    b.unit = { ...b.unit, hp };
    this.render(uid);
  }

  /** Kill markers over foes and warning skulls over own units (stories 13.4, 13.6). */
  setMarks(marks: ReadonlyMap<string, KillKind>): void {
    const touched = new Set([...this.marks.keys(), ...marks.keys()]);
    this.marks = new Map(marks);
    for (const uid of touched) this.render(uid);
  }

  /** Units that have acted this phase (story 13.9). */
  setDone(uids: Iterable<string>): void {
    const next = new Set(uids);
    const touched = new Set([...this.done, ...next]);
    this.done = next;
    for (const uid of touched) this.render(uid);
  }

  /** The part of the bar a previewed attack takes (story 13.4): HP after the attack. */
  setPreview(p: { uid: string; after: number } | null): void {
    const old = this.preview?.uid;
    this.preview = p;
    if (old) this.render(old);
    if (p && p.uid !== old) this.render(p.uid);
  }

  private render(uid: string): void {
    const b = this.badges.get(uid);
    if (!b) return;
    const u = b.unit;
    const bar = barShown(this.mode, u);
    const look = barLook(this.look, u.hp, u.maxHp);
    const mark = this.marks.get(uid);
    const done = this.done.has(uid);
    const pre = this.preview?.uid === uid ? Math.max(0, Math.min(u.hp, this.preview.after)) : null;
    const sig = `${bar}|${u.team}|${u.hp}|${u.maxHp}|${u.lieutenant}|${mark ?? ''}|${done}|${pre ?? ''}`;
    if (sig === b.sig) return;
    b.sig = sig;
    b.el.className = `hc-badge is-${u.team}${u.lieutenant ? ' is-lt' : ''}${look.critical ? ' is-critical' : ''}${bar ? '' : ' no-bar'}`;
    b.el.style.setProperty('--hc-hp', String(look.share));
    b.el.style.setProperty('--hc-tick', String(look.tick));
    if (pre !== null) {
      const after = pre / Math.max(1, u.maxHp);
      b.loss.style.left = `${after * 100}%`;
      b.loss.style.width = `${(look.share - after) * 100}%`;
      b.loss.style.display = '';
      b.fill.style.width = `${after * 100}%`;
    } else {
      b.loss.style.display = 'none';
      b.fill.style.width = `${look.share * 100}%`;
    }
    b.mark.className = `hc-badge__mark${mark ? ` is-${mark}` : ''}`;
    b.mark.innerHTML = !mark ? '' : mark === 'flee' || mark === 'fleeCrit' ? FLEE : SKULL;
    b.check.innerHTML = done ? CHECK : '';
    b.check.classList.toggle('is-done', done);
  }

  /** Places the badge of `uid` with its bottom centre at screen point (x, y) in CSS px; `shown` false hides it (off screen, hidden, faded). */
  place(uid: string, x: number, y: number, shown: boolean): void {
    const b = this.badges.get(uid);
    if (!b) return;
    if (shown !== b.shown) {
      b.shown = shown;
      b.el.style.display = shown ? '' : 'none';
    }
    if (!shown) return;
    const rx = Math.round(x);
    const ry = Math.round(y);
    if (rx === b.x && ry === b.y) return;
    b.x = rx;
    b.y = ry;
    b.el.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -100%)`;
  }

  /** Height in CSS px the badge takes above the head, so pennant and status icons sit above it. */
  heightOf(uid: string): number {
    const b = this.badges.get(uid);
    return b && b.shown && barShown(this.mode, b.unit) ? this.look.heightPx + 6 : 0;
  }

  uids(): IterableIterator<string> {
    return this.badges.keys();
  }

  dispose(): void {
    for (const b of this.badges.values()) b.el.remove();
    this.badges.clear();
  }
}
