/** Story 16.18: the pure turntable of the armoury (no Babylon). */
import { describe, expect, it } from 'vitest';
import { Carousel, frontIndex, plateVisible, ringDistance, rotFor, standPosition, wrapIndex } from '../../src/render/items/armoryMath';

const def = { dragDegPerPx: 0.5, flingSeconds: 0.2, snapMs: 400 };

describe('armoury turntable', () => {
  it('wraps and measures indices round the ring', () => {
    expect(wrapIndex(-1, 5)).toBe(4);
    expect(ringDistance(0, 4, 5)).toBe(1);
    expect(plateVisible(4, 0, 5, 1)).toBe(true);
    expect(plateVisible(2, 0, 5, 1)).toBe(false);
  });

  it('puts the front stand towards the camera and finds it again', () => {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const rot = rotFor(i, n, 0);
      expect(frontIndex(rot, n)).toBe(i);
      const p = standPosition(i, n, rot, 2);
      expect(p.x).toBeCloseTo(0, 6);
      expect(p.z).toBeCloseTo(-2, 6);
    }
    expect(standPosition(0, 1, 3, 2)).toEqual({ x: 0, z: -2 });
  });

  it('turns the short way round', () => {
    const n = 8;
    const from = rotFor(7, n, 0);
    // from stand 7 to stand 0 is one step, not seven
    expect(Math.abs(rotFor(0, n, from) - from)).toBeCloseTo((2 * Math.PI) / n, 6);
  });

  it('snaps onto a stand after a swipe and rests', () => {
    const c = new Carousel(def, 5, 0);
    c.press();
    c.drag(100, 200); // 50 degrees, slow (no fling): not yet a whole step of 72
    c.release();
    expect(c.busy()).toBe(true);
    for (let i = 0; i < 100; i++) c.step(0.02);
    expect(c.busy()).toBe(false);
    expect(c.front()).toBe(4); // turned right: the stand on the left comes to the front
    expect(c.rot).toBeCloseTo(rotFor(4, 5, 0), 6);
  });

  it('keeps one stand still and survives an empty wheel', () => {
    const one = new Carousel(def, 1);
    one.press();
    one.drag(300, 10);
    one.release();
    expect(one.rot).toBe(0);
    expect(one.busy()).toBe(false);
    expect(new Carousel(def, 0).front()).toBe(0);
  });

  it('snapTo and setCount keep the front where they can', () => {
    const c = new Carousel(def, 4, 2);
    expect(c.front()).toBe(2);
    c.snapTo(0);
    for (let i = 0; i < 100; i++) c.step(0.02);
    expect(c.front()).toBe(0);
    c.setCount(3, 2);
    expect(c.front()).toBe(2);
    c.setCount(2, 2);
    expect(c.front()).toBe(1);
  });
});
