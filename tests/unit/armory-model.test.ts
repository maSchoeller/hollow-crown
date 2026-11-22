/** Story 16.18: the stand specs, ring and banner colours, and the weapon view's own models for signature pieces (no scene, no GLB). */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { clone, newCampaign, newItem, type CampaignState, type GameData } from '../../src/core';
import { armorySpecs, bannerColours } from '../../src/app/screens/armoryModel';
import { stageRunes, weaponStageModel } from '../../src/app/screens/weaponViewModel';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  base = { ...c, home: { kind: 'castle', rooms: {} } };
});

const image = (d: { id: string }) => `img/${d.id}.webp`;

describe('armoury stand specs (story 16.18)', () => {
  it('a signature piece shows its own model in the weapon view, the group model otherwise', () => {
    const c = clone(base);
    expect(weaponStageModel(data, newItem(c, 'tinder', data))).toBe('models/weapons-v2/sig/tinder.glb');
    expect(weaponStageModel(data, newItem(c, 'iron_axe', data))).toBe('models/weapons-v2/axe.glb');
  });

  it('shows the fixed rune in an empty main setting only when a stage is asked for', () => {
    const c = clone(base);
    const tinder = newItem(c, 'tinder', data);
    expect(stageRunes(data, tinder).main).toBeNull();
    expect(stageRunes(data, tinder, 1).main?.id).toBe('fire_rune_2');
    const set = { ...tinder, runes: ['wind_rune_1', ...tinder.runes.slice(1)] };
    expect(stageRunes(data, set, 1).main?.id).toBe('wind_rune_1');
  });

  it('colours the ring by the main rune, gold without one, grey for an empty stand', () => {
    const c = clone(base);
    const plain = newItem(c, 'heirloom', data);
    const carried = newItem(c, 'dragon_ember', data);
    c.convoy.push(plain, carried);
    c.roster[0]!.bag.push({ ...newItem(c, 'wolf_fang', data), runes: ['wind_rune_1'] });
    const specs = armorySpecs(data, c, image);
    const by = (def: string) => specs.find((s) => s.key === c.convoy.concat(c.roster[0]!.bag).find((i) => i.def === def)?.uid);
    const g = data.render.gear.rune.colors;
    expect(by('dragon_ember')!.ring).toBe(g.fire);
    expect(by('wolf_fang')!.ring).toBe(g.wind);
    expect(by('wolf_fang')!.worn).toBe(true);
    expect(by('heirloom')!.ring).toBe(g.light);
    expect(by('heirloom')!.model).toBe('models/weapons-v2/sig/heirloom.glb');
    expect(by('heirloom')!.image).toBe('img/heirloom.webp');
    const empties = specs.filter((s) => s.empty);
    expect(empties.length).toBeGreaterThan(0);
    expect(empties.every((s) => s.ring === data.render.armory.colors.ringEmpty && !s.model && !s.image)).toBe(true);
  });

  it('hangs one banner per owned piece, in the armoury order', () => {
    const c = clone(base);
    expect(bannerColours(data, c)).toEqual([]);
    c.convoy.push(newItem(c, 'dragon_ember', data), newItem(c, 'iron_sword', data));
    expect(bannerColours(data, c)).toEqual([data.render.gear.rune.colors.fire]);
  });
});
