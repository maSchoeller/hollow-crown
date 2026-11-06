import { describe, expect, it } from 'vitest';
import { withoutLeavers, type BattleResult, type CampaignState } from '../../src/core';

describe('result screen after a scene with `leave`', () => {
  const result = { recruited: ['mira', 'fenn'], units: [{ id: 'mira' }, { id: 'lucan' }] } as unknown as BattleResult;
  const camp = (ids: string[]) => ({ roster: ids.map((id) => ({ id })) }) as unknown as CampaignState;
  it('drops a companion who left from the joined list and the level lines', () => {
    const r = withoutLeavers(result, camp(['lucan', 'fenn']));
    expect(r.recruited).toEqual(['fenn']);
    expect(r.units.map((u) => u.id)).toEqual(['lucan']);
  });
  it('keeps everything when nobody left', () => {
    expect(withoutLeavers(result, camp(['mira', 'fenn', 'lucan']))).toBe(result);
  });
});
