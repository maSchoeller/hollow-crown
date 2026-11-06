/**
 * Tone test of story 8.1 (brief risk "Tonbruch"): what the memorial run shows, without app state so tests can read it.
 * Part 1 is Gerrit's grave after the prologue (story death, whole company grieves), part 2 a permadeath: Fenn's farewell
 * card with his last line and Mira's grief, then the memorial variant of N1 that is played when he has fallen.
 */
import { addToRoster, newCampaign, type BattleResult, type CampaignState, type GameData } from '../core';

/** URL parameter that opens the run: `…/hollow-crown/?tonbruch`. */
export const TONE_TEST_PARAM = 'tonbruch';

export const TONE_TEST = {
  /** node whose company (everyone who joined before it) speaks at the grave */
  companyAfter: 'prologue',
  grave: 'scn.prologue.outro',
  fallen: 'fenn',
  /** where Fenn falls (the farewell card names its title) */
  fellAt: 'm1_4',
  grief: ['mira'],
  memorial: 'scn.n1.memorial_intro',
} as const;

export const wantsToneTest = (search: string): boolean => new URLSearchParams(search).has(TONE_TEST_PARAM);

/** The scenes and the pack they need: part 2 comes with the act pack, part 1 is in core. */
export const toneTestScenes = (): string[] => [TONE_TEST.grave, `scn.farewell.${TONE_TEST.fallen}`, TONE_TEST.memorial];

/**
 * Throwaway campaign with the company as it stands after the prologue (the grave's speakers), plus the grieving partners for
 * part 2 (Mira speaks first in the memorial variant of N1). Fenn is not in it: he has fallen.
 */
export function toneTestCampaign(data: GameData): CampaignState {
  const c = newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const order = data.campaign.nodes.map((n) => n.id);
  const upto = order.indexOf(TONE_TEST.companyAfter);
  for (const ch of Object.values(data.chars)) {
    const j = order.indexOf(ch.joins);
    if (j >= 0 && j <= upto) addToRoster(data, c, ch.id);
  }
  for (const id of TONE_TEST.grief) addToRoster(data, c, id);
  c.completed = order.slice(0, upto + 1);
  return c;
}

/** A won battle in which Fenn fell and Mira grieves: the input of the farewell card (story 6.7), nothing else. */
export function toneTestResult(data: GameData): BattleResult {
  const ch = data.chars[TONE_TEST.fallen];
  return {
    outcome: 'victory',
    nodeId: TONE_TEST.fellAt,
    turns: 0,
    side: [],
    gold: 0,
    materials: {},
    items: [],
    units: [],
    fallen: [
      {
        id: TONE_TEST.fallen,
        nameKey: `unit.${TONE_TEST.fallen}.name`,
        portrait: ch?.portrait ?? TONE_TEST.fallen,
        classId: ch?.class,
        grief: TONE_TEST.grief.map((id) => ({ id, missions: data.balance.supports.griefMissions })),
      },
    ],
    bounty: [],
    scars: [],
    recruited: [],
    supportsReady: [],
    granted: [],
  };
}
