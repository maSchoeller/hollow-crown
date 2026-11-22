/**
 * Story 16.6: the pure rules of the rune weapons' look (no Babylon, no DOM): which rune sits in which setting, how far the
 * channel is filled per tier, the glow state of a figure from the board's overlays, the pulse and the tint of the metals.
 * The numbers come from `render.yaml` `gear.rune` (`RuneGlowDef`); `runeGlow.ts` turns them into materials.
 */
import type { GearRunes, MetalId, RuneDef, RuneLook } from '../../core';
import type { RuneGlowDef } from '../../core/renderDefs';

export type GlowState = 'dim' | 'full';
export type Rgb = readonly [number, number, number];

export const DEFAULT_METAL: MetalId = 'steel';

/** `#rrggbb` as 0-1 components. */
export function hexRgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** The look of a rune id (element or auxiliary, tier 1-3); null for an unknown id. */
export function runeLookOf(runes: Readonly<Record<string, RuneDef>>, id: string | null | undefined): RuneLook | null {
  const d = id ? runes[id] : undefined;
  if (!d) return null;
  const tier = Math.min(3, Math.max(1, d.tier ?? 1)) as 1 | 2 | 3;
  return { id: d.id, element: d.utility || !d.element ? 'utility' : d.element, tier };
}

/**
 * Where the runes of an item sit: an element rune in the main setting (it lights the channel), the next rune (usually an
 * auxiliary rune) in the small one. An item without the small setting (one slot) puts its single rune in the main setting.
 */
export function gearRunesOf(runes: Readonly<Record<string, RuneDef>>, ids: ReadonlyArray<string | null | undefined>, slots: number, metal: MetalId | undefined): GearRunes {
  const looks = ids.map((id) => runeLookOf(runes, id)).filter((l): l is RuneLook => !!l);
  const smallSlot = slots >= 2;
  const mainAt = smallSlot ? looks.findIndex((l) => l.element !== 'utility') : looks.length ? 0 : -1;
  const main = mainAt >= 0 ? looks[mainAt]! : null;
  const small = smallSlot ? (looks.find((_, i) => i !== mainAt) ?? null) : null;
  return { metal: metal ?? DEFAULT_METAL, main, small, smallSlot };
}

/** The part of a rune weapon that is part of the figure's rebuild key: a changed metal, rune or setting builds the figure anew. */
export function runeKey(r: GearRunes | undefined): string {
  return r ? `${r.metal}:${r.main?.id ?? '-'}:${r.small?.id ?? '-'}:${r.smallSlot ? 2 : 1}` : '';
}

/** `fill` of the channel (0 at the socket, 1 at the far end) up to which it glows, for a tier 1-3. */
export function fillThreshold(def: RuneGlowDef, tier: number): number {
  return def.fillThresholds[Math.min(3, Math.max(1, tier)) - 1]!;
}

/** The glow state of a figure: full if the board's `Overlays.glow` names it (chosen figure, attacker and target of the forecast), else dim. */
export function glowState(glow: ReadonlySet<string> | undefined, uid: string): GlowState {
  return glow?.has(uid) ? 'full' : 'dim';
}

/** Strength of the glow (0-1) in a state. */
export function glowStrength(def: RuneGlowDef, state: GlowState): number {
  return def.state[state];
}

/** The pulse of a tier III glow at time `ms`: 1 at its peak, `1 - amplitude` at its lowest. */
export function pulseFactor(def: RuneGlowDef, ms: number): number {
  const wave = 0.5 + 0.5 * Math.cos((ms / def.pulse.periodMs) * Math.PI * 2);
  return 1 - def.pulse.amplitude * (1 - wave);
}

/** The glow colour of a rune (element colour, auxiliary runes silver-white). */
export function runeColour(def: RuneGlowDef, rune: RuneLook): Rgb {
  return hexRgb(def.colors[rune.element]);
}

/** A colour lifted towards white by `lift` 0-1. */
export function lighten(c: Rgb, lift: number): Rgb {
  return [c[0] + (1 - c[0]) * lift, c[1] + (1 - c[1]) * lift, c[2] + (1 - c[2]) * lift];
}

/**
 * Tints one vertex colour (0-1, as drawn) by the metal: grey surfaces (low saturation, the metal) take the metal's tint and sheen,
 * saturated ones (wood, leather, cloth) stay. Same form, other material.
 */
export function tintMetal(rgb: Rgb, metal: MetalId, def: RuneGlowDef): [number, number, number] {
  const max = Math.max(rgb[0], rgb[1], rgb[2]);
  const min = Math.min(rgb[0], rgb[1], rgb[2]);
  const sat = max > 0 ? (max - min) / max : 0;
  const w = clamp01(1 - sat / def.metals.satLimit);
  if (w === 0) return [rgb[0], rgb[1], rgb[2]];
  const m = def.metals[metal];
  const tint = hexRgb(m.tint);
  const out: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const v = rgb[i]! * (1 + (tint[i]! - 1) * w);
    out[i] = clamp01(v + (1 - v) * m.sheen * w);
  }
  return out;
}

/** Which kind of glowing part a mesh of a rune weapon or stone is, by the name of its node; undefined for the rest. */
export type GlowPart = 'channel' | 'stone' | 'symbol' | 'gold' | 'core';

export function glowPartOf(name: string): GlowPart | undefined {
  if (/(^|:)rune_channel\b/.test(name)) return 'channel';
  const m = /(^|[:_])rune_(stone|symbol|gold|core)\b/.exec(name);
  return m ? (m[2] as GlowPart) : undefined;
}
