/** Lieutenants as content and on the board (story 3.1): loading, checks, map units, pennant notches. */
import { beforeAll, describe, expect, it } from 'vitest';
import { buildContent } from '../../src/content/load';
import type { Locales } from '../../src/content/load';
import { loadContentFromDisk, readContentFiles } from '../../src/content/node';
import { collectIds } from '../../src/content/ids';
import { validateContent } from '../../src/content/validate';
import { fillTarget, lieutenantLineIds } from '../../src/content/lieutenantLines';
import { companionNames, longestName } from '../../src/content/validateLieutenants';
import { pennantNotches } from '../../src/render/board/lieutenant';
import { addTexts, t } from '../../src/i18n';
import { beginBattle, battleUnitFromMap, firstNode, newCampaign, type BattleState, type GameData, type MapUnitDef } from '../../src/core';

let data: GameData;
let locales: Locales;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});

/** Problems the lieutenant checks report after `change` was applied to a copy of the content. */
function problems(change: (d: GameData, l: Locales) => void): string[] {
  const d = clone(data);
  const l = clone(locales);
  // the controller adds the titles; the checks of this file do not depend on them
  for (const lt of Object.values(d.lieutenants)) for (const lang of ['de', 'en']) l[lang]![lt.titleKey] ??= 'Title';
  change(d, l);
  return validateContent(d, l).map((i) => `${i.file}: ${i.message}`);
}

describe('lieutenants.yaml', () => {
  it('holds the four lieutenants of act 1 with the values of the product owner', () => {
    expect(Object.keys(data.lieutenants).sort()).toEqual(['grosk', 'hask', 'morra', 'ulvric']);
    const hask = data.lieutenants.hask!;
    expect(hask).toMatchObject({ act: 1, class: 'brigand', faction: 'border_bands', signatureItem: 'tinder', scene: 'scn.lt.hask', titleKey: 'lt.hask.title' });
    expect(data.lieutenants.morra!.class).toBe('marksman');
    expect(data.lieutenants.ulvric!.grudgeSkills).toEqual(['wolf_run', 'pack', 'breakthrough']);
    expect(data.lieutenants.grosk!.signatureItem).toBe('little_hands');
  });

  it('names twelve grudge skills (source grudge), three per lieutenant in order, and legendary signature items', () => {
    const skills = Object.values(data.lieutenants).flatMap((lt) => lt.grudgeSkills);
    expect(new Set(skills).size).toBe(12);
    for (const id of skills) expect(data.skills[id]!.source, id).toBe('grudge');
    for (const lt of Object.values(data.lieutenants)) expect(data.items[lt.signatureItem]!.rarity).toBe('legendary');
    expect(data.lieutenants.grosk!.grudgeSkills.map((s) => data.skills[s]!.trigger)).toEqual(['passive', 'passive', 'on_turn_start']);
  });

  it('shares the Wolfslauf skill between Ulvric and the Wolfszahn, and lets Kinderhand grant Erneuerung', () => {
    expect(data.items.wolf_fang!.grantsSkill).toEqual({ skill: 'wolf_run', masteryCost: 40 });
    expect(data.items.little_hands!.grantsSkill!.skill).toBe('renewal');
    expect(data.items.little_hands!.price).toBe(1200);
    expect(data.items.tinder!.statusOnHit).toEqual({ status: 'burning', chance: 30 });
    expect(data.items.bounty!.crit).toBe(15);
  });

  it('is a stable ID kind', () => {
    expect(collectIds(data).lieutenants).toEqual(['grosk', 'hask', 'morra', 'ulvric']);
  });

  it('passes the checks (titles aside)', () => {
    expect(problems(() => {})).toEqual([]);
  });
});

describe('lieutenant checks', () => {
  it('refuses unknown references', () => {
    expect(problems((d) => (d.lieutenants.hask!.class = 'nobody'))).toContain('lieutenants.yaml: hask: unknown class nobody');
    expect(problems((d) => (d.lieutenants.hask!.signatureItem = 'nothing'))).toContain('lieutenants.yaml: hask: unknown signature item nothing');
    expect(problems((d) => (d.lieutenants.hask!.grudgeSkills[1] = 'nothing'))).toContain('lieutenants.yaml: hask: unknown grudge skill nothing (step 2)');
    expect(problems((d) => (d.lieutenants.hask!.grudgeSkills[0] = 'momentum'))).toContain('lieutenants.yaml: hask: skill momentum must have the source grudge');
    expect(problems((d) => (d.lieutenants.hask!.scene = 'scn.lt.nope'))).toContain('lieutenants.yaml: hask: unknown scene scn.lt.nope');
    expect(problems((d) => delete d.scenes['scn.lt.morra'])).toContain('lieutenants.yaml: morra: unknown scene scn.lt.morra');
  });

  it('wants the title and the faction name in both languages', () => {
    expect(problems((_, l) => delete l.en!['lt.hask.title'])).toContain('locales/en: missing key lt.hask.title');
    expect(problems((_, l) => delete l.de!['faction.border_bands.name'])).toContain('locales/de: missing key faction.border_bands.name');
  });

  it('allows at most four lieutenants per act', () => {
    const msgs = problems((d) => {
      d.lieutenants.fifth = { ...d.lieutenants.hask!, id: 'fifth' };
    });
    expect(msgs).toContain('lieutenants.yaml: act 1: 5 lieutenants, at most 4');
  });

  it('wants the fixed line ids, and join only for the lieutenant who can change sides', () => {
    expect(lieutenantLineIds({})).toEqual(['first', 'grudge_1', 'grudge_2', 'grudge_3', 'flee_1', 'flee_2', 'flee_3', 'mock']);
    expect(lieutenantLineIds({ joins: true })).toContain('join');
    expect(problems((d) => (d.scenes['scn.lt.hask']!.lines = d.scenes['scn.lt.hask']!.lines.filter((l) => l.id !== 'flee_2')))).toContain('scenes/scn.lt.hask: flee_2: line missing');
    expect(problems((d) => (d.scenes['scn.lt.grosk']!.lines = d.scenes['scn.lt.grosk']!.lines.filter((l) => l.id !== 'join')))).toContain('scenes/scn.lt.grosk: join: line missing');
    const extra = problems((d) => {
      const lines = d.scenes['scn.lt.hask']!.lines;
      lines.push({ ...lines[0]!, id: 'join' });
    });
    expect(extra.some((m) => m.includes('line id must be one of'))).toBe(true);
  });

  it('checks the speaker of every line', () => {
    const msgs = problems((d) => {
      const l = d.scenes['scn.lt.hask']!.lines[0]!;
      if (!('choice' in l)) l.speaker = ['kael'];
    });
    expect(msgs).toContain('scenes/scn.lt.hask: first: speaker chain must be exactly [hask]');
  });

  it('measures a line with the longest companion name put in for {target}, in German and English', () => {
    const names = companionNames(data, locales, 'de');
    const longest = longestName(names);
    expect(longest.length).toBeGreaterThanOrEqual(5);
    expect(fillTarget('{target}, {target}!', 'Ysolde')).toBe('Ysolde, Ysolde!');
    const max = data.balance.scene.bubbleMaxChars;
    // a German line that fits only without the name
    const room = max - longest.length;
    const fits = 'x'.repeat(room) + '{target}';
    const tooLong = 'x'.repeat(room + 1) + '{target}';
    const first = (d: GameData) => d.scenes['scn.lt.hask']!.lines[0]!;
    const setDe = (text: string) => (d: GameData, l: Locales) => {
      const line = first(d);
      if (!('choice' in line)) line.text = text;
      l.de![`dlg.scn.lt.hask.first`] = text;
    };
    expect(problems(setDe(fits)).filter((m) => m.includes('longer than 56'))).toEqual([]);
    expect(problems(setDe(tooLong)).some((m) => m.startsWith('scenes/scn.lt.hask: first: de line longer than 56'))).toBe(true);
    const longEn = (l: Locales) => (l.en!['dlg.scn.lt.hask.first'] = 'y'.repeat(max) + '{target}');
    expect(problems((_, l) => longEn(l)).some((m) => m.startsWith('scenes/scn.lt.hask: first: en line longer than 56'))).toBe(true);
  });

  it('wants {target} in both languages or in neither', () => {
    const msgs = problems((_, l) => (l.en!['dlg.scn.lt.hask.grudge_1'] = 'I remember you.'));
    expect(msgs).toContain('scenes/scn.lt.hask: grudge_1: {target} must appear in both languages or in neither');
  });

  it('reports a missing portrait or model as a warning-style message only when the file list lacks it', () => {
    const d = clone(data);
    const l = clone(locales);
    for (const lt of Object.values(d.lieutenants)) for (const lang of ['de', 'en']) l[lang]![lt.titleKey] = 'Title';
    const out = validateContent(d, l, undefined, undefined, undefined, { portraits: new Set(['hask']), models: new Set(['hask']) }).map((i) => i.message);
    expect(out).toContain('missing portrait morra (art/mockups/characters-s1/morra.png)');
    expect(out).toContain('missing model grosk (art/models/units/grosk.glb)');
    expect(out.some((m) => m.includes('hask') && m.startsWith('missing'))).toBe(false);
  });

  it('wants a known lieutenant on a map unit that names one', () => {
    const msgs = problems((d) => {
      const map = d.maps.prologue_caravan!;
      map.units.push({ ...map.units[1]!, id: 'ghost', lieutenant: 'nobody' });
    });
    expect(msgs).toContain('maps/prologue_caravan: ghost: unknown lieutenant nobody');
  });
});

describe('map units with lieutenant:', () => {
  const unit = (over: Record<string, unknown> = {}) => ({ id: 'lt_unit', team: 'enemy', lieutenant: 'hask', level: 3, at: [1, 1], items: [], ...over });
  const withUnit = (u: Record<string, unknown>) => {
    const files = readContentFiles();
    const key = Object.keys(files).find((k) => k.endsWith('prologue_caravan.yaml'))!;
    const map = files[key] as { units: unknown[] };
    map.units.push(u);
    return buildContent(files);
  };

  it('takes the class of the lieutenant when the map names none, and keeps the map class when it does', () => {
    const a = withUnit(unit());
    expect(a.issues).toEqual([]);
    expect(a.data.maps.prologue_caravan!.units.find((u) => u.id === 'lt_unit')!.class).toBe('brigand');
    const b = withUnit(unit({ class: 'vanguard' }));
    expect(b.data.maps.prologue_caravan!.units.find((u) => u.id === 'lt_unit')!.class).toBe('vanguard');
  });

  it('reports a unit without class and without a known lieutenant', () => {
    expect(withUnit(unit({ lieutenant: 'nobody' })).issues.map((i) => i.message)).toContain('lt_unit: class is required unless the unit names a known lieutenant');
    expect(withUnit(unit({ lieutenant: undefined })).issues.map((i) => i.message)).toContain('lt_unit: class is required unless the unit names a known lieutenant');
  });

  describe('on the board', () => {
    let s: BattleState;
    beforeAll(() => {
      const c = newCampaign(data, 3, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
      s = beginBattle(data, c, firstNode(data).id, c.roster.map((r) => r.id)).state;
    });
    const def = (over: Partial<MapUnitDef> = {}): MapUnitDef => ({ team: 'enemy', class: 'brigand', level: 3, at: [2, 2], items: [], lieutenant: 'hask', ...over });

    it('takes name, figure and portrait from the lieutenant, leaves the grudge unset', () => {
      const u = battleUnitFromMap(data, def(), s, 100, 'u1');
      expect(u).toMatchObject({ lieutenant: 'hask', nameKey: 'unit.hask.name', sprite: 'hask', portrait: 'hask' });
      expect(u.grudge).toBeUndefined();
      expect(u.grudgeTarget).toBeUndefined();
    });

    it('lets the values of the map win', () => {
      const u = battleUnitFromMap(data, def({ nameKey: 'unit.morra.name', sprite: 'soldier', portrait: 'morra' }), s, 100, 'u2');
      expect(u).toMatchObject({ nameKey: 'unit.morra.name', sprite: 'soldier', portrait: 'morra' });
    });

    it('is a plain unit without lieutenant: or with one the content does not know', () => {
      const plain = battleUnitFromMap(data, def({ lieutenant: undefined }), s, 100, 'u3');
      expect(plain.nameKey).toBe('class.brigand.name');
      const unknown = battleUnitFromMap(data, def({ lieutenant: 'nobody' }), s, 100, 'u4');
      expect(unknown.nameKey).toBe('class.brigand.name');
    });
  });
});

describe('pennant notches', () => {
  it('shows 0 to 3 notches for the grudge, none for a lieutenant without one', () => {
    expect([undefined, 0, 1, 2, 3].map(pennantNotches)).toEqual([0, 0, 1, 2, 3]);
    expect([-1, 4, 9, 2.7, NaN].map(pennantNotches)).toEqual([0, 3, 3, 2, 0]);
  });
});

describe('{target} in a line', () => {
  it('is filled from the parameters of t()', () => {
    addTexts('de', { 'test.target': '{target}. Ich erinnere mich.' });
    expect(t('test.target', { target: 'Brenna' })).toBe('Brenna. Ich erinnere mich.');
  });
});
