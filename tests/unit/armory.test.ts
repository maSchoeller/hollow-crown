/** Story 16.18: the armoury mirrors relics and signature weapons; pure logic only, no scene, no models. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { armoryCount, armoryOf, armoryOpen, clone, newCampaign, newItem, type CampaignState, type GameData } from '../../src/core';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  base = { ...c, home: { kind: 'castle', rooms: {} } };
});

const owned = (c: CampaignState) => armoryOf(data, c).pieces.filter((p) => p.kind === 'owned');

describe('armoury (story 16.18)', () => {
  it('every lieutenant signature carries the signature tag', () => {
    for (const lt of Object.values(data.lieutenants)) expect(data.items[lt.signatureItem]?.tags, lt.id).toContain('signature');
  });

  it('is closed without a piece and in the camp', () => {
    expect(armoryCount(data, base)).toBe(0);
    expect(armoryOpen(data, base)).toBe(false);
    const c = clone(base);
    c.convoy.push(newItem(c, 'dragon_ember', data));
    expect(armoryOpen(data, c)).toBe(true);
    expect(armoryOpen(data, { ...c, home: { kind: 'camp', rooms: {} } })).toBe(false);
  });

  it('lists owned pieces (relics first), the worn one with its wearer, then empty stands', () => {
    const c = clone(base);
    const sig = newItem(c, 'tinder', data);
    c.roster[0]!.bag.push(sig);
    c.convoy.push(newItem(c, 'dragon_ember', data));
    c.convoy.push(newItem(c, 'iron_sword', data));
    const { pieces } = armoryOf(data, c);
    expect(armoryCount(data, c)).toBe(2);
    expect(pieces[0]).toMatchObject({ kind: 'owned', def: 'dragon_ember', relic: true });
    expect(pieces[0]).not.toHaveProperty('wearer');
    expect(pieces[1]).toMatchObject({ kind: 'owned', def: 'tinder', wearer: c.roster[0]!.id });
    expect(pieces.slice(2).every((p) => p.kind !== 'owned')).toBe(true);
    // the relic not held stays hidden, the held one is not listed twice
    expect(pieces.some((p) => p.kind === 'hidden' && p.def === 'pact_warden_shield')).toBe(true);
    expect(pieces.some((p) => p.kind === 'hidden' && p.def === 'dragon_ember')).toBe(false);
  });

  it('shows a met lieutenant signature within reach, not before, not once fallen or joined', () => {
    const c = clone(base);
    const lt = Object.values(data.lieutenants)[0]!;
    const reach = (x: CampaignState) => armoryOf(data, x).pieces.filter((p) => p.kind === 'reach');
    expect(reach(c)).toHaveLength(0);
    c.lieutenants = { [lt.id]: { met: true, encounters: 1, grudge: 0, routs: 2, signatureDropped: false } };
    expect(reach(c)).toEqual([{ kind: 'reach', def: lt.signatureItem, lieutenant: lt.id, routs: 2, max: data.balance.lieutenant.signature.guaranteedRout }]);
    const dropped = clone(c);
    dropped.lieutenants![lt.id]!.signatureDropped = true;
    expect(reach(dropped)).toHaveLength(0);
    const joined = clone(c);
    joined.flags[`joined_${lt.id}`] = true;
    expect(reach(joined)).toHaveLength(0);
  });

  it('forgets the gear of the fallen: only roster and convoy count', () => {
    const c = clone(base);
    const lost = c.roster.pop()!;
    lost.bag.push(newItem(c, 'tinder', data));
    expect(owned(c)).toHaveLength(0);
  });
});
