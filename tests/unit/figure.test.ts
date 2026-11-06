import { describe, expect, it } from 'vitest';
import { unitFigureId, modelId } from '../../src/core';

const classes = { skirmisher: { art: 'mercenary' }, vanguard: { sprite: 'fighter', art: 'soldier' }, brigand: {} };
const models = ['lucan', 'avatar_a', 'avatar_b', 'brigand', 'mercenary'];

describe('unitFigureId', () => {
  it('prefers the unit own sprite, then its character', () => {
    expect(unitFigureId({ sprite: 'brigand', charId: 'lucan', classId: 'skirmisher' }, classes)).toBe('brigand');
    expect(unitFigureId({ charId: 'lucan', classId: 'skirmisher' }, classes)).toBe('lucan');
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

describe('class figures of the real content (story 15.9)', () => {
  it('every class figure a hired unit falls back to is a model in art/models/units, apart from the known cleric gap', async () => {
    const { readdirSync } = await import('node:fs');
    const { loadContentFromDisk } = await import('../../src/content/node');
    const { validateContent } = await import('../../src/content/validate');
    const { data, locales } = loadContentFromDisk();
    const models = new Set(readdirSync('art/models/units').filter((f) => f.endsWith('.glb')).map((f) => f.slice(0, -4)));
    expect(models.has('archer')).toBe(false);
    const unknown = validateContent(data, locales, models).filter((i) => i.file === 'classes.yaml' && i.message.startsWith('unknown sprite'));
    // the healer roles have no figure yet (art-direction decision log 2026-10-24: the cleric stays without a model)
    expect(unknown.map((i) => i.message).filter((m) => !m.startsWith('unknown sprite cleric '))).toEqual([]);
    expect(validateContent(data, locales, new Set(['lucan'])).some((i) => i.message === 'unknown sprite bandit_archer (class marksman)')).toBe(true);
  }, 30000);
});
