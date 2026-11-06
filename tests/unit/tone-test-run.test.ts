/** Tone test of story 8.1: the run itself, grave → farewell card → N1 memorial → title, never with a campaign id (no save). */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/app/state/packs', () => ({ afterPrepare: () => Promise.resolve(), ensurePack: () => Promise.resolve() }));
vi.mock('../../src/app/state/loading', () => ({ ensureMissionPack: () => Promise.resolve(true) }));

const { startToneTest } = await import('../../src/app/state/toneTest');
const { screen } = await import('../../src/app/state/screen');
const { campaign, campaignId } = await import('../../src/app/state/session');
const { TONE_TEST } = await import('../../src/app/toneTestPlan');

describe('startToneTest', () => {
  it('walks grave, farewell and memorial, then ends on the title without a campaign', async () => {
    campaignId.value = 'real-slot';
    await startToneTest();
    expect(campaignId.value).toBeNull();
    expect(campaign.value?.roster.some((u) => u.id === TONE_TEST.fallen)).toBe(false);
    const grave = screen.value;
    expect(grave).toMatchObject({ name: 'dialogue', id: TONE_TEST.grave });
    if (grave.name !== 'dialogue') throw new Error('no grave');
    grave.next();
    await vi.waitFor(() => expect(screen.value.name).toBe('farewell'));
    const card = screen.value;
    if (card.name !== 'farewell') throw new Error('no farewell');
    expect(card.result.fallen.map((f) => f.id)).toEqual([TONE_TEST.fallen]);
    expect(card.then).toMatchObject({ name: 'dialogue', id: TONE_TEST.memorial });
    if (card.then?.name !== 'dialogue') throw new Error('no memorial');
    card.then.next();
    expect(screen.value).toEqual({ name: 'title' });
    expect(campaign.value).toBeNull();
    expect(campaignId.value).toBeNull();
  });
});
