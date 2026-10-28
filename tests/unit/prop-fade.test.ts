import { describe, expect, it } from 'vitest';
import { fadeRule, hidesFigure } from '../../src/render/board/fade';
import { isStaticMaterial } from '../../src/render/board/staticMaterial';

// 35° tilt (render.yaml camera.tiltDeg): each tile south of a figure costs ~1.43 tiles of prop height
const rule = fadeRule(35, 0.2, 0.3);
const figure = { x: 3.5, y: 3.5, h: 0 };
const prop = (dx: number, dy: number, top: number, r = 0.45) => ({ x: figure.x + dx, y: figure.y + dy, r, top });

describe('prop fade (story 8.10)', () => {
  it('fades a prop on the figure tile', () => {
    expect(hidesFigure(prop(0, 0, 1.2), figure, rule)).toBe(true);
  });

  it('fades a tall prop one tile south, not a low one', () => {
    expect(hidesFigure(prop(0, 1, 1.6), figure, rule)).toBe(true);
    expect(hidesFigure(prop(0, 1, 0.6), figure, rule)).toBe(false);
  });

  it('needs a tower to reach two tiles north', () => {
    expect(hidesFigure(prop(0, 2, 1.6), figure, rule)).toBe(false);
    expect(hidesFigure(prop(0, 2, 2.8), figure, rule)).toBe(true);
  });

  it('never fades props behind the figure or beside it', () => {
    expect(hidesFigure(prop(0, -1, 3), figure, rule)).toBe(false);
    expect(hidesFigure(prop(1, 0, 3), figure, rule)).toBe(false);
  });

  it('counts the height the figure stands on', () => {
    expect(hidesFigure(prop(0, 1, 1.2), figure, rule)).toBe(true);
    expect(hidesFigure(prop(0, 1, 1.2), { ...figure, h: 0.5 }, rule)).toBe(false);
  });

  it('a steeper camera sees over more', () => {
    expect(hidesFigure(prop(0, 1, 1.6), figure, fadeRule(10, 0.2, 0.3))).toBe(false);
  });
});

describe('frozen board materials (story 8.11)', () => {
  it('freezes the props and the opaque terrain layers', () => {
    for (const name of ['props', 'prop:field_idle:mat', 'prop:lodge_intact:mat', 'terrain-earth', 'terrain-caps']) expect(isStaticMaterial(name)).toBe(true);
  });

  it('keeps the see-through twins of props thawed: frozen they would keep the black depth pre-pass shader', () => {
    for (const name of ['prop:field_idle:mat:fade', 'prop:tree_a:mat:fade']) expect(isStaticMaterial(name)).toBe(false);
  });

  it('leaves water, veil, rings and figures alone', () => {
    for (const name of ['terrain-water', 'terrain-veil', 'rings:enemy', 'figure:0|0']) expect(isStaticMaterial(name)).toBe(false);
  });
});
