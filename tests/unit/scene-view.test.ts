/** Scenes in the new style (story 4.5): seen record, speech-bubble pages, half-figure choice, timing values. */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { applyCampaign, bubblePages, newCampaign, normalizeCampaign, replayCampaign, sceneSeen, validateCampaign, type CampaignState, type GameData } from '../../src/core';
import { figureId, pickHalf } from '../../src/ui/halfFigure';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 3, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

describe('markSceneSeen', () => {
  it('records a known scene once and refuses an unknown one', () => {
    const id = Object.keys(data.scenes)[0]!;
    expect(sceneSeen(base.scenesSeen, id)).toBe(false);
    const r = applyCampaign(data, base, { type: 'markSceneSeen', scene: id });
    expect(r.campaign.scenesSeen).toEqual([id]);
    expect(r.events).toEqual([{ t: 'sceneSeen', scene: id }]);
    const again = applyCampaign(data, r.campaign, { type: 'markSceneSeen', scene: id });
    expect(again.campaign.scenesSeen).toEqual([id]);
    expect(again.events).toEqual([]);
    expect(validateCampaign(data, base, { type: 'markSceneSeen', scene: 'scn.nope' })).toBe('not_available');
  });

  it('survives the journal replay and old saves without the field', () => {
    const id = Object.keys(data.scenes)[0]!;
    const replayed = replayCampaign(data, base, [{ type: 'markSceneSeen', scene: id }]);
    expect(replayed.scenesSeen).toEqual([id]);
    const { scenesSeen: _gone, ...old } = base;
    expect(normalizeCampaign(old as unknown as CampaignState).scenesSeen).toEqual([]);
  });
});

describe('bubblePages', () => {
  it('keeps short text whole and cuts long text at spaces, each page within the limit', () => {
    expect(bubblePages('Kurz.', 64)).toEqual(['Kurz.']);
    const text = 'Brennt schön, nicht wahr? Bald brennt ihr mit, und niemand in Varnhold wird euch dann noch retten können.';
    const pages = bubblePages(text, 40);
    expect(pages.length).toBeGreaterThan(1);
    for (const p of pages) expect(p.length).toBeLessThanOrEqual(40);
    expect(pages.join(' ')).toBe(text);
  });

  it('keeps every battle-scene line of the content within two bubble pages of the configured size', () => {
    const max = data.balance.scene.bubbleMaxChars;
    for (const scene of Object.values(data.scenes))
      for (const l of scene.lines) if ('text' in l) expect(bubblePages(l.text, max).length, `${scene.id}.${l.id}`).toBeLessThanOrEqual(2);
  });
});

describe('half figures', () => {
  const built = new Set(['kael', 'kael_sad', 'mira', 'rhen_a']);
  it('uses the mood variant when built, else the neutral figure, else nothing', () => {
    expect(pickHalf('kael', 'sad', built)).toBe('kael_sad');
    expect(pickHalf('kael', 'angry', built)).toBe('kael');
    expect(pickHalf('kael', 'neutral', built)).toBe('kael');
    expect(pickHalf('grosk', 'neutral', built)).toBeNull();
    expect(pickHalf('grosk', 'neutral', null)).toBe('grosk');
  });
  it('maps the avatar to its look', () => {
    expect(figureId('avatar', 'avatar_a')).toBe('rhen_a');
    expect(figureId('kael', 'avatar_b')).toBe('kael');
  });
  it('has a picture for every speaker of the scenes, so no dialogue shows an empty stage', () => {
    const dir = fileURLToPath(new URL('../../art/mockups/characters-s1/', import.meta.url));
    const has = (stem: string) => existsSync(`${dir}${stem}.png`);
    const speakers = new Set<string>();
    for (const scene of Object.values(data.scenes))
      for (const l of scene.lines) if ('speaker' in l) for (const sp of l.speaker ?? []) speakers.add(sp === 'avatar' ? figureId(sp, 'avatar_a') : sp);
    expect(speakers.size).toBeGreaterThan(0);
    expect(figureId('avatar', 'avatar_b')).toBe('rhen_b');
    for (const stem of ['rhen_a', 'rhen_b', ...speakers]) expect(has(stem), `art/mockups/characters-s1/${stem}.png`).toBe(true);
  });
});

describe('timing values', () => {
  it('come from balance.yaml (bubble: 2.5 s in auto mode)', () => {
    expect(data.balance.scene.bubbleAutoMs).toBe(2500);
  });
});
