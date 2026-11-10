/**
 * Story 11.23, Beat 10 „Die Chronik“: `scn.castle.chronicle` plays once in the castle on the return after 2-4 (campaign.yaml
 * homeScenes), whichever order the first pair (2-2, 2-3) was played in. Liora deciphers, else Ysolde, else Rhen; the scene sets
 * `chronicle_read`, and the sealed entry of the chronicle shows as deciphered.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  chronicleView,
  conditionContext,
  newCampaign,
  pendingHomeScene,
  readTitleKey,
  resolveScene,
  type CampaignState,
  type GameData,
} from '../../src/core';

let data: GameData;
const SCENE = 'scn.castle.chronicle';

beforeAll(() => {
  data = loadContentFromDisk().data;
});

const act1Story = () => data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
/** A campaign in act 2 in the castle that found the sealed chronicle in 1-7; `done` = act-2 nodes played in this order. */
function inAct2(done: string[], kind: 'castle' | 'camp' = 'castle'): CampaignState {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const base: CampaignState = { ...c, act: 2, home: { kind, rooms: {} }, completed: [...act1Story(), ...done], flags: { ...c.flags, wardens_chronicle: true } };
  return applyCampaign(data, base, { type: 'effects', effects: [{ recruit: 'liora' }, { recruit: 'ysolde' }] }).campaign;
}
/** What the scene ends with: its effects, then the seen record (the app: Scene onSeen, then onDone). */
function play(c: CampaignState): CampaignState {
  const h = pendingHomeScene(data, c)!;
  const after = applyCampaign(data, c, { type: 'effects', effects: h.effects }).campaign;
  return applyCampaign(data, after, { type: 'markSceneSeen', scene: h.scene }).campaign;
}
const readers = (c: CampaignState) => [
  ...new Set(
    resolveScene(data, conditionContext(data, c), SCENE)
      .filter((l) => l.kind === 'line' && /^l(0[3-9]|1[0-2])$/.test(l.line))
      .map((l) => (l.kind === 'line' ? l.speaker : undefined)),
  ),
];

describe('Beat 10 „Die Chronik“', () => {
  for (const pair of [
    ['m2_2', 'm2_3'],
    ['m2_3', 'm2_2'],
  ])
    it(`plays once in the castle after 2-4, the first pair played ${pair.join(' → ')}`, () => {
      expect(pendingHomeScene(data, inAct2(['m2_1']))).toBeNull();
      expect(pendingHomeScene(data, inAct2(['m2_1', pair[0]!]))).toBeNull();
      expect(pendingHomeScene(data, inAct2(['m2_1', ...pair]))).toBeNull();
      const back = inAct2(['m2_1', ...pair, 'm2_4']);
      expect(pendingHomeScene(data, back)?.scene).toBe(SCENE);
      expect(chronicleView(data, back).acts.find((a) => a.act === 1)!.deciphered).toEqual([]);
      const done = play(back);
      expect(done.flags.chronicle_read).toBe(true);
      expect(pendingHomeScene(data, done)).toBeNull(); // once
      const act1 = chronicleView(data, done).acts.find((a) => a.act === 1)!;
      expect(act1.sealed).toEqual(['wardens_chronicle']);
      expect(act1.deciphered).toEqual(['wardens_chronicle']);
      expect(readTitleKey('wardens_chronicle')).toBe('chronicle.sealed.wardens_chronicle.read.title');
    });

  it('waits for the castle and for the chronicle found in 1-7', () => {
    expect(pendingHomeScene(data, inAct2(['m2_1', 'm2_2', 'm2_3', 'm2_4'], 'camp'))).toBeNull();
    const unfound = inAct2(['m2_1', 'm2_2', 'm2_3', 'm2_4']);
    delete unfound.flags.wardens_chronicle;
    expect(pendingHomeScene(data, unfound)).toBeNull();
  });

  it('Liora deciphers, else Ysolde, else Rhen', () => {
    const c = inAct2(['m2_1', 'm2_2', 'm2_3', 'm2_4']);
    expect(readers(c)).toEqual(['liora', 'ysolde']); // Ysolde only adds a remark
    const noLiora = { ...c, roster: c.roster.filter((r) => r.id !== 'liora'), fallen: [...c.fallen, { id: 'liora', nameKey: 'unit.liora.name', node: 'm1_8' }] };
    expect(readers(noLiora)).toEqual(['ysolde']);
    const neither = { ...noLiora, roster: noLiora.roster.filter((r) => r.id !== 'ysolde') }; // Ysolde never joined
    expect(readers(neither)).toEqual(['avatar']);
  });
});
