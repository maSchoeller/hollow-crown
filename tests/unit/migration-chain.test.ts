/**
 * The whole way of an old save (review 2026-11-07, M3): every fixture in tests/fixtures/saves/ (format 2 on; format 1
 * goes to the `legacy` store untouched) runs through the full migration chain, the import shape check and the load
 * steps of the app (`adoptRecord` in src/app/state/session.ts, `restore` in flow.ts), replays its running battle and
 * plays one more command. The golden values hold what a migration must keep: who is in the company, which units fight,
 * how far the battle got. A rules change that moves them on purpose updates the table; a migration that loses
 * them fails here.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  autoCommand,
  normalizeCampaign,
  renameLegacyBattleClasses,
  renameLegacyClasses,
  withoutStaleHauntBattle,
  type BattleState,
  type CampaignState,
} from '../../src/core';
import { exportSave, importSave, migrate, SAVE_FORMAT, type SaveRecord } from '../../src/persistence/save';
import { saveRecordSchema } from '../../src/persistence/schema';

const dir = join(process.cwd(), 'tests/fixtures/saves');
const fixtures = readdirSync(dir).filter((f) => /^format\d+-.+\.json$/.test(f) && Number(/^format(\d+)-/.exec(f)![1]) >= 2);
const { data } = loadContentFromDisk();

interface Golden {
  roster: string[];
  units: string[];
  commands: number;
  turn: number;
}

const company = ['avatar', 'lucan', 'brenna', 'tobin'];
const prologueUnits = [...company, ...Array.from({ length: 10 }, (_, i) => `tg${i + 1}`)];
const golden: Record<string, Golden> = {
  // the running prologue battle, saved in the second player round (generate.ts)
  'format2-auto.json': { roster: company, units: prologueUnits, commands: 11, turn: 3 },
  // the same battle with the IDs before story 15.6 (kael): after the rename migration it is the same company
  'format2-kael.json': { roster: company, units: prologueUnits, commands: 11, turn: 3 },
  // act 1 played to its finale on main before story 11.1 (generate-act1-finale.ts), on the world map without a battle
  'format3-act1-finale-done.json': { roster: ['avatar', 'lucan', 'brenna', 'tobin', 'mira', 'liora'], units: [], commands: 0, turn: 0 },
};

/** The core side of loading a save, as the app does it. */
function load(rec: SaveRecord): { campaign: CampaignState; start?: BattleState; state?: BattleState } {
  const campaign = renameLegacyClasses(data, normalizeCampaign(data, rec.payload.campaign));
  let p = { ...rec.payload, campaign };
  if (p.battle) p = withoutStaleHauntBattle(data, { ...p, battle: { ...p.battle, start: renameLegacyBattleClasses(data, p.battle.start) } });
  if (!p.battle) return { campaign };
  let s = p.battle.start;
  for (const cmd of p.battle.commands) s = applyCommand(data, s, cmd).state;
  return { campaign, start: p.battle.start, state: s };
}

describe('migration chain (review 2026-11-07, M3)', () => {
  it('has a golden value for every fixture', () => {
    expect(Object.keys(golden).sort()).toEqual([...fixtures].sort());
  });

  for (const f of fixtures) {
    it(`${f}: migrates, passes the import check, loads, replays and plays on`, () => {
      const rec = JSON.parse(readFileSync(join(dir, f), 'utf8')) as SaveRecord;
      const out = migrate(rec);
      expect(out.format).toBe(SAVE_FORMAT);
      expect(saveRecordSchema.safeParse(out).error).toBeUndefined();
      // the import way (export text → shape check → migration) ends in the same record
      expect(importSave(exportSave(rec))).toEqual(out);
      expect(migrate(out)).toEqual(out); // the chain is idempotent at its end

      const { campaign, start, state } = load(out);
      const got: Golden = {
        roster: campaign.roster.map((u) => u.id),
        units: start ? start.units.map((u) => u.id) : [],
        commands: out.payload.battle?.commands.length ?? 0,
        turn: state?.turn ?? 0,
      };
      expect(got).toEqual(golden[f]);
      // every ID a migration may have touched exists in this build (classes and items; characters: migrations.test.ts)
      const items = [...campaign.convoy, ...campaign.roster.flatMap((u) => [...Object.values(u.equip), ...u.bag])];
      for (const u of campaign.roster) expect(data.classes[u.classId], `${f}: class ${u.classId}`).toBeDefined();
      for (const i of items) expect(data.items[i!.def], `${f}: item ${i!.def}`).toBeDefined();
      if (state && !state.outcome) {
        // one more command on the loaded battle: the migrated state is playable, not only readable
        const next = applyCommand(data, state, autoCommand(data, state));
        expect(next.state.units.length).toBe(state.units.length);
      }
    });
  }
});

describe('import shape check (review 2026-11-07, M7 first step)', () => {
  const rec = migrate(JSON.parse(readFileSync(join(dir, 'format2-auto.json'), 'utf8')) as SaveRecord);
  const withCampaign = (patch: Record<string, unknown>) => ({ ...rec, payload: { ...rec.payload, campaign: { ...rec.payload.campaign, ...patch } } });
  const ok = (r: unknown) => saveRecordSchema.safeParse(r).success;

  it('accepts the exported world map save of the e2e tests and the flag list of old saves', () => {
    expect(ok(importSave(readFileSync(join(dir, 'prep-worldmap-export.json'), 'utf8')))).toBe(true);
    expect(ok(withCampaign({ flags: ['prologue_done'] }))).toBe(true);
    expect(ok(withCampaign({ flags: undefined }))).toBe(true);
  });

  it('refuses broken units, items and flags before a migration or the rules see them', () => {
    expect(ok(withCampaign({ flags: { a: { nested: true } } }))).toBe(false);
    expect(ok(withCampaign({ flags: { a: false } }))).toBe(false);
    expect(ok(withCampaign({ convoy: [{ uid: 'i1' }] }))).toBe(false);
    const [first, ...rest] = rec.payload.campaign.roster;
    expect(ok(withCampaign({ roster: [{ ...first, classId: undefined }, ...rest] }))).toBe(false);
    expect(ok(withCampaign({ roster: [{ ...first, bag: [{ def: 'iron_sword' }] }, ...rest] }))).toBe(false);
  });
});
