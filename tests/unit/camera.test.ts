import { describe, expect, it } from 'vitest';
import { centreOn, clampAxis, framePlan, inFreeArea } from '../../src/render/shared/camera';

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

describe('framePlan (goal marking)', () => {
  const base = { steps: [7, 10, 15], viewW: 400, viewH: 800, hud: { top: 100, right: 0, bottom: 200, left: 0 }, cosTilt: Math.cos((35 * Math.PI) / 180), margin: 1 };

  it('keeps the zoom step when the marked fields fit, and centres on their box', () => {
    const p = framePlan({ ...base, step: 1, tiles: [[2, 3], [4, 5]] });
    expect(p).toEqual({ step: 1, cx: 3.5, cy: 4.5 });
  });

  it('goes out as many steps as needed, never closer than now', () => {
    // free width at step 0 = 7 columns; a box 8 wide with margin does not fit there, 10 columns (step 1) take it
    const wide = framePlan({ ...base, step: 0, tiles: [[0, 0], [7, 0]] });
    expect(wide.step).toBe(1);
    expect(framePlan({ ...base, step: 2, tiles: [[1, 1]] }).step).toBe(2);
  });

  it('takes the last step when nothing fits', () => {
    expect(framePlan({ ...base, step: 0, tiles: [[0, 0], [40, 40]] }).step).toBe(2);
  });
});
