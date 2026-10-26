import { describe, expect, it } from 'vitest';
import { deployOrder, toggleDeploy } from '../../src/app/prepDeploy';

describe('deployment rules (story 6.10, src/app/prepDeploy.ts)', () => {
  const forced = ['avatar', 'kael'];

  it('takes a unit along while a place is free', () => {
    expect(toggleDeploy(['avatar', 'kael'], 'brenna', forced, 4)).toEqual({ chosen: ['avatar', 'kael', 'brenna'], blocked: null });
  });

  it('leaves a unit behind and keeps the order of the others', () => {
    expect(toggleDeploy(['avatar', 'kael', 'brenna', 'tobin'], 'brenna', forced, 4)).toEqual({ chosen: ['avatar', 'kael', 'tobin'], blocked: null });
  });

  it('does not take a unit when all places are taken', () => {
    const chosen = ['avatar', 'kael', 'brenna', 'tobin'];
    expect(toggleDeploy(chosen, 'fenn', forced, 4)).toEqual({ chosen, blocked: 'full' });
  });

  it('never lets a required unit go', () => {
    const chosen = ['avatar', 'kael', 'brenna'];
    expect(toggleDeploy(chosen, 'kael', forced, 4)).toEqual({ chosen, blocked: 'locked' });
  });

  it('does not change the list it was given', () => {
    const chosen = ['avatar', 'kael'];
    toggleDeploy(chosen, 'brenna', forced, 4);
    expect(chosen).toEqual(['avatar', 'kael']);
  });

  it('lists required units first, then the company in its own order', () => {
    const roster = ['brenna', 'kael', 'tobin', 'avatar'].map((id) => ({ id }));
    expect(deployOrder(roster, forced).map((r) => r.id)).toEqual(['kael', 'avatar', 'brenna', 'tobin']);
  });
});
