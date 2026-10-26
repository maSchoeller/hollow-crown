import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContentFromDisk } from '../../src/content/node';
import { critTimeline } from '../../src/render/board/critTimeline';
import { FLEE_FADE_MS, FLEE_JUMP_MS } from '../../src/render/board/lieutenant';
import { UNIT_ROWS } from '../../src/render/shared/assets';

const { data } = loadContentFromDisk();
const fx = data.render.look.fx;
/** real time until the hit of an attack at 1x, as the board works it out (hit frame / frame rate of the attack row) */
const row = UNIT_ROWS.find((r) => r.name === 'attack_s')!;
const HIT_MS = ((row.hitFrame ?? 3) / (row.fps ?? 12)) * 1000;

describe('critical hit time line (story 8.6)', () => {
  it('takes 550 ms at 1x, at most 600', () => {
    const t = critTimeline(fx.crit, HIT_MS, 1, false);
    expect(t.totalMs).toBe(550);
    expect(t.totalMs).toBeLessThanOrEqual(600);
  });

  it('freezes for exactly 80 ms at 1x', () => {
    expect(critTimeline(fx.crit, HIT_MS, 1, false).freezeMs).toBe(80);
  });

  it('is shorter at 2x', () => {
    const one = critTimeline(fx.crit, HIT_MS, 1, false);
    const two = critTimeline(fx.crit, HIT_MS / 2, 2, false);
    expect(two.totalMs).toBeLessThan(one.totalMs);
    expect(two.freezeMs).toBe(40);
    expect(two.cutIn!.outMs).toBe(30);
  });

  it('slides the band in and holds it until the hit, then out', () => {
    const t = critTimeline(fx.crit, HIT_MS, 1, false);
    expect(t.cutIn).toEqual({ inMs: 120, holdMs: 130, outMs: 60 });
    expect(t.cutIn!.inMs + t.cutIn!.holdMs).toBe(HIT_MS);
  });

  it('has no band, freeze or shake when skipping', () => {
    const t = critTimeline(fx.crit, HIT_MS, 1, true);
    expect(t.cutIn).toBeNull();
    expect(t.freezeMs).toBe(0);
    expect(t.shakeMs).toBe(0);
    expect(t.totalMs).toBe(0);
  });

  it('doubles the damage number', () => {
    expect(critTimeline(fx.crit, HIT_MS, 1, false).numberScale).toBe(2);
  });
});

describe('effect durations (story 8.6, art-direction §8: every effect at most 600 ms at 1x)', () => {
  const sheet = JSON.parse(readFileSync(join(process.cwd(), 'art', 'fx', 'fx.json'), 'utf8')) as { anims: Record<string, { frames: number; fps: number }> };
  const ms = (name: string) => (sheet.anims[name]!.frames / sheet.anims[name]!.fps) * 1000;
  // the sprite effects the board plays once: hits, elements, healing, level up, smoke (flight, fire), the status feet effects
  const played = ['hit_spark', 'hit_star_crit', 'fire_bolt', 'wind_slash', 'water_burst', 'earth_spikes', 'light_pillar', 'dark_tendrils', 'heal', 'levelup', 'smoke', 'flame'];

  it.each(played)('%s plays within 600 ms', (name) => {
    expect(sheet.anims[name], `${name} in fx.json`).toBeDefined();
    expect(ms(name)).toBeLessThanOrEqual(600);
  });

  it('keeps the big star short enough for the crit sequence', () => {
    expect(ms('hit_star_crit')).toBeLessThanOrEqual(critTimeline(fx.crit, HIT_MS, 1, false).totalMs - HIT_MS);
  });

  it('keeps the lieutenant flight, the death in ash and the status icon inside 600 ms', () => {
    expect(FLEE_JUMP_MS + FLEE_FADE_MS).toBeLessThanOrEqual(600);
    expect(Math.max(fx.death.ashMs, fx.death.fadeMs)).toBeLessThanOrEqual(600);
    expect(fx.death.shakeMs).toBeLessThanOrEqual(600);
    expect(fx.status.fadeMs).toBeLessThanOrEqual(600);
  });
});
