import { describe, expect, it } from 'vitest';
import { centreOn, clampAxis, inFreeArea } from '../../src/render/camera';

// Phone in portrait: 390 px wide view, 844 tall; top bar 60, bottom sheet 220 (world units = px here)
const VIEW_H = 844;
const TOP = 60;
const BOTTOM = 220;
const MAP = 1200;
const MARGIN = 0.25;

describe('camera clamp (D10)', () => {
  it('lets the last map row clear the bottom sheet with a margin', () => {
    const cam = clampAxis(1e9, VIEW_H, TOP, BOTTOM, MAP, MARGIN);
    const freeBottom = cam + VIEW_H / 2 - BOTTOM;
    const free = VIEW_H - TOP - BOTTOM;
    // the map's bottom edge sits a quarter of the free area above the sheet
    expect(freeBottom - MAP).toBeCloseTo(free * MARGIN);
  });

  it('lets the first map row clear the top bar with a margin', () => {
    const cam = clampAxis(-1e9, VIEW_H, TOP, BOTTOM, MAP, MARGIN);
    const freeTop = cam - VIEW_H / 2 + TOP;
    expect(0 - freeTop).toBeCloseTo((VIEW_H - TOP - BOTTOM) * MARGIN);
  });

  it('keeps positions inside the allowed range untouched', () => {
    expect(clampAxis(600, VIEW_H, TOP, BOTTOM, MAP, MARGIN)).toBe(600);
  });

  it('centres a small map in the free area', () => {
    const cam = clampAxis(0, VIEW_H, TOP, BOTTOM, 100, MARGIN);
    expect(cam + (TOP - BOTTOM) / 2).toBeCloseTo(50);
  });

  it('works without HUD and without margin like a plain edge clamp', () => {
    expect(clampAxis(-50, 400, 0, 0, 1000, 0)).toBe(200);
    expect(clampAxis(5000, 400, 0, 0, 1000, 0)).toBe(800);
  });
});

describe('free area', () => {
  it('centreOn puts a point in the middle of the free area', () => {
    const cam = centreOn(500, TOP, BOTTOM);
    const freeMid = (cam - VIEW_H / 2 + TOP + (cam + VIEW_H / 2 - BOTTOM)) / 2;
    expect(freeMid).toBeCloseTo(500);
  });

  it('inFreeArea treats HUD-covered parts as off screen', () => {
    const cam = 500;
    const sheetTop = cam + VIEW_H / 2 - BOTTOM;
    expect(inFreeArea(sheetTop - 10, cam, VIEW_H, TOP, BOTTOM, 0)).toBe(true);
    expect(inFreeArea(sheetTop + 10, cam, VIEW_H, TOP, BOTTOM, 0)).toBe(false);
    expect(inFreeArea(sheetTop - 10, cam, VIEW_H, TOP, BOTTOM, 48)).toBe(false);
  });
});
