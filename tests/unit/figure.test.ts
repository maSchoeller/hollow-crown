import { describe, expect, it } from 'vitest';
import { unitFigureId, modelId } from '../../src/core';

const classes = { skirmisher: { art: 'mercenary' }, vanguard: { sprite: 'fighter', art: 'soldier' }, brigand: {} };
const models = ['kael', 'avatar_a', 'avatar_b', 'brigand', 'mercenary'];

describe('unitFigureId', () => {
  it('prefers the unit own sprite, then its character', () => {
    expect(unitFigureId({ sprite: 'brigand', charId: 'kael', classId: 'skirmisher' }, classes)).toBe('brigand');
    expect(unitFigureId({ charId: 'kael', classId: 'skirmisher' }, classes)).toBe('kael');
  });
  it('falls back to the sprite or art of the class, then the class id (hired tavern mercenaries, renamed legacy classes)', () => {
    expect(unitFigureId({ classId: 'skirmisher' }, classes)).toBe('mercenary');
    expect(unitFigureId({ classId: 'vanguard' }, classes)).toBe('fighter');
    expect(unitFigureId({ classId: 'brigand' }, classes)).toBe('brigand');
    expect(unitFigureId({ classId: 'unknown' }, classes)).toBe('unknown');
  });
});

describe('modelId', () => {
  it('prefers the chosen portrait when it has a model', () => {
    expect(modelId({ portrait: 'avatar_b', charId: 'rhen', classId: 'tactician' }, models, classes)).toBe('avatar_b');
  });
  it('otherwise uses the unit figure', () => {
    expect(modelId({ portrait: 'nobody', classId: 'skirmisher' }, models, classes)).toBe('mercenary');
  });
});
