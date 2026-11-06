/** Tone test of story 8.1: the direct link, the throwaway company at Gerrit's grave and Fenn's farewell card. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { farewellView, type GameData } from '../../src/core';
import { TONE_TEST, toneTestCampaign, toneTestResult, toneTestScenes, wantsToneTest } from '../../src/app/toneTestPlan';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('tone test (story 8.1)', () => {
  it('opens with ?tonbruch, also next to other parameters, and never without it', () => {
    expect(wantsToneTest('?tonbruch')).toBe(true);
    expect(wantsToneTest('?debug&tonbruch')).toBe(true);
    expect(wantsToneTest('')).toBe(false);
    expect(wantsToneTest('?scene=tonbruch')).toBe(false);
  });

  it('plays only scenes that exist', () => {
    for (const id of toneTestScenes()) expect(data.scenes[id], id).toBeDefined();
  });

  it('every speaking line at the grave and in the N1 memorial finds a speaker in the company; Fenn is not in it', () => {
    const c = toneTestCampaign(data, 'Rhen');
    const ids = new Set(c.roster.map((u) => u.id));
    expect(ids.has(TONE_TEST.fallen)).toBe(false);
    for (const id of [TONE_TEST.grave, TONE_TEST.memorial])
      for (const line of data.scenes[id]!.lines) if ('speaker' in line && line.speaker) expect(line.speaker.some((s: string) => s === 'avatar' || ids.has(s)), `${id} ${line.id}`).toBe(true);
    expect(c.completed).toContain(TONE_TEST.companyAfter);
  });

  it("Fenn's farewell card carries his last line and Mira's grief", () => {
    const [card, ...rest] = farewellView(data, toneTestResult(data));
    expect(rest).toHaveLength(0);
    expect(card!.id).toBe('fenn');
    expect(card!.lastKey).toBeDefined();
    expect(card!.grief.map((g) => [g.id, !!g.lineKey])).toEqual([['mira', true]]);
  });
});
