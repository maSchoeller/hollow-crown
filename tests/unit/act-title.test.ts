/**
 * Story 11.3: the title card of a new act (`c.actTitleSeen`, command `markActTitleSeen`), the world map of act 2 (fog patches,
 * Brandhang without a base picture), act 2's placeholder nodes and the save "act 2 without missions".
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { applyCampaign, availableNodes, conditionContext, newCampaign, normalizeCampaign, validateCampaign, type CampaignState, type GameData } from '../../src/core';
import { fogAreas, siteImage, veilAreas } from '../../src/app/screens/worldMapView';
import { migrate, type SaveRecord } from '../../src/persistence/save';

let data: GameData;
let open: GameData;
const avatar = { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' } as const;
const fresh = (): CampaignState => newCampaign(data, 5, { difficulty: 'normal', deathMode: 'standard' }, avatar);
const finaleDone = (): CampaignState => ({ ...fresh(), completed: data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id) });

beforeAll(() => {
  data = loadContentFromDisk().data;
  open = { ...structuredClone(data), releasedActs: [1, 2] };
});

describe('c.actTitleSeen', () => {
  it('a new campaign has seen the title of act 1 (the prologue opens it), so no card shows in act 1', () => {
    expect(fresh().actTitleSeen).toBe(1);
  });

  it('a save from before the field has seen act 1 only; one that moves on to act 2 gets the card once', () => {
    const { actTitleSeen: _s, act: _a, ...old } = finaleDone();
    expect(normalizeCampaign(data, structuredClone(old) as CampaignState).actTitleSeen).toBe(1);
    const moved = normalizeCampaign(open, structuredClone(old) as CampaignState);
    expect(moved.act).toBe(2);
    expect(moved.actTitleSeen).toBe(1);
  });

  it('markActTitleSeen notes the running act once; a later or earlier act is refused', () => {
    const c = { ...finaleDone(), act: 2 };
    expect(validateCampaign(open, c, { type: 'markActTitleSeen', act: 3 })).toBe('not_available');
    expect(validateCampaign(open, c, { type: 'markActTitleSeen', act: 1 })).toBe('not_available');
    const r = applyCampaign(open, c, { type: 'markActTitleSeen', act: 2 });
    expect(r.campaign.actTitleSeen).toBe(2);
    expect(r.events).toContainEqual({ t: 'actTitleSeen', act: 2 });
    const again = applyCampaign(open, r.campaign, { type: 'markActTitleSeen', act: 2 });
    expect(again.campaign.actTitleSeen).toBe(2);
    expect(again.events).toEqual([]);
  });
});

describe('act 2 on the world map', () => {
  it('every node of act 2 has a slot at its place from geografie-valmora.md', () => {
    const where = Object.fromEntries(data.world.places.flatMap((p) => p.slots.flatMap((s) => (s.node ? [[s.node, p.id]] : []))));
    expect(Object.fromEntries(data.acts[2]!.nodes.map((n) => [n.id, where[n.id]]))).toEqual({
      m2_1: 'wind_gap',
      m2_2: 'salt_pass',
      m2_3: 'raven_meadow',
      m2_4: 'burnt_slope',
      m2_5: 'silverspring',
      m2_6: 'crow_holm',
      m2_7: 'kontor',
      m2_8: 'kronfeld',
      n4: 'clan_grounds',
      n5: 'copperhall',
      n6: 'aue_island',
    });
  });

  it('in act 2 the nodes stand open in the graph (m2_1 first); only m2_1–m2_5, n4, n5 and n6 have their maps so far (stories 11.12–11.16, 11.20–11.22)', () => {
    const c = normalizeCampaign(open, finaleDone());
    const ids = availableNodes(open, c).map((n) => n.id);
    expect(ids).toContain('m2_1');
    expect(ids).not.toContain('m2_2');
    for (const n of open.acts[2]!.nodes) expect(!!open.maps[n.map], n.id).toBe(['m2_1', 'm2_2', 'm2_3', 'm2_4', 'm2_5', 'n4', 'n5', 'n6'].includes(n.id));
  });

  it('places of act 2 without a stone lie under a fog patch; none in act 1', () => {
    const veil = data.render.worldMap.veil;
    expect(veilAreas(data.world, 1, new Set(), veil)).toEqual([]);
    const all = veilAreas(data.world, 2, new Set(), veil);
    const act2WithSlots = data.world.places.filter((p) => p.act === 2 && p.slots.length > 0);
    expect(all).toHaveLength(act2WithSlots.length);
    expect(all[0]).toHaveLength(veil.corners);
    expect(veilAreas(data.world, 2, new Set(['wind_gap']), veil)).toHaveLength(act2WithSlots.length - 1);
    // the regions of later acts stay fogged as before
    expect(fogAreas(data.world, 2)).toEqual(data.world.regions.filter((r) => r.act === 3).flatMap((r) => r.areas));
  });

  it('Brandhang draws nothing of its own until E7 "obey", then its burnt picture', () => {
    const slope = data.world.places.find((p) => p.id === 'burnt_slope')!;
    const c = { ...finaleDone(), act: 2 };
    expect(siteImage(slope, conditionContext(open, c))).toBe('none');
    const obeyed = { ...c, flags: { ...c.flags, e07: 'obey' } };
    expect(siteImage(slope, conditionContext(open, { ...c, flags: { ...c.flags, e07: 'warn' } }))).toBe('none');
    expect(siteImage(slope, conditionContext(open, obeyed))).toBe('burnt_slope_burnt');
    // the picture not delivered: the fallback of story 15.7 without a base picture is to draw nothing
    expect(siteImage(slope, conditionContext(open, obeyed), ['burnt_slope_burnt'])).toBe('none');
  });
});

describe('the save "act 2 without missions"', () => {
  it('loads in act 2 with the title seen and no mission of act 2 done', () => {
    const rec = JSON.parse(readFileSync(join(process.cwd(), 'tests/fixtures/saves/format3-act2-no-missions.json'), 'utf8')) as SaveRecord;
    const c = normalizeCampaign(open, migrate(rec).payload.campaign);
    expect(c.act).toBe(2);
    expect(c.actTitleSeen).toBe(2);
    expect(c.completed.filter((id) => open.acts[2]!.nodes.some((n) => n.id === id))).toEqual([]);
    expect(c.completed).toContain('m1_8');
  });
});
