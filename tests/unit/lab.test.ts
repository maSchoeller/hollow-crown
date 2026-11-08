/** Testlabor M1: the scenario loader and the questions of `pnpm lab`, on the example scenarios of tests/fixtures/lab/. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { computeStats, terrainAt, type GameData } from '../../src/core';
import { buildLab, LabError } from '../../src/lab/scenario';
import { labAttack, labEnemyPhase, labPath, labPlay, labState, labUnit } from '../fixtures/lab';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('lab scenario loader', () => {
  it('builds the situation the file describes', () => {
    const { state: s } = labState(data, 'handy-ansicht');
    expect(s.mapId).toBe('m1_4_wolfslager');
    expect(s.turn).toBe(5);
    expect(s.phase).toBe('player');
    const liora = labUnit(s, 'liora');
    expect(liora.pos).toEqual([9, 7]);
    expect(liora.hp).toBe(9);
    expect(liora.status).toEqual([{ id: 'burning', turns: data.balance.terrainEffects.burningDuration }]);
    expect(labUnit(s, 'lucan').acted).toBe(true);
    expect(terrainAt(s, [10, 6])).toBe('burning');
    expect(s.timers['10,6']).toMatchObject({ kind: 'burning' });
    // the company is raised to the node's expectedLevel
    const node = data.acts[1]!.nodes.find((n) => n.id === 'm1_4')!;
    expect(labUnit(s, 'avatar').level).toBeGreaterThanOrEqual(node.expectedLevel);
  });

  it('is deterministic: the same file gives the same battle', () => {
    expect(labState(data, 'boss-gegenschlag').state).toEqual(labState(data, 'boss-gegenschlag').state);
  });

  it('adds units in the map format, changes items, stats and level, removes by pattern', () => {
    const { state: s } = buildLab(data, {
      map: 'm1_4_wolfslager',
      company: ['liora'],
      remove: ['enemy:w*'],
      add: [{ id: 'lab_wolf', team: 'enemy', class: 'brigand', level: 3, at: [5, 21], items: [{ def: 'iron_axe' }] }],
      units: { liora: { at: [10, 21], level: 6, stats: { spd: 15 }, items: ['shine'] } },
    });
    expect(s.units.some((u) => u.team === 'enemy' && u.uid.startsWith('w'))).toBe(false);
    expect(labUnit(s, 'lab_wolf').classId).toBe('brigand');
    const liora = labUnit(s, 'liora');
    expect(liora.level).toBe(6);
    expect(liora.stats.spd).toBe(15);
    expect(liora.equip.mainHand?.def).toBe('shine');
    expect(liora.hp).toBe(computeStats(data, liora).maxHp);
    // a list deploys those and the avatar; the map's forced units (Lucan in 1-4) come along as in the game
    const deployed = s.units.filter((u) => u.fromRoster && u.pos).map((u) => u.id);
    expect(deployed).toEqual(expect.arrayContaining(['avatar', 'liora']));
    expect(deployed).not.toContain('brenna');
  });

  it('names the valid ids when a reference is wrong', () => {
    expect(() => buildLab(data, { map: 'nowhere' })).toThrow(/no map "nowhere"; valid: .*m1_4_wolfslager/);
    expect(() => buildLab(data, { map: 'm1_4_wolfslager', units: { nobody: { hp: 1 } } })).toThrow(/no unit "nobody".*valid: .*osric/);
    expect(() => buildLab(data, { map: 'm1_4_wolfslager', units: { liora: { at: [99, 0] } } })).toThrow(/outside the 22×26 map/);
    expect(() => buildLab(data, { map: 'm1_4_wolfslager', units: { liora: { at: [10, 2] } } })).toThrow(/two units on tile 10,2/);
    expect(() => buildLab(data, { map: 'm1_4_wolfslager', speed: 3 })).toThrow(LabError);
  });
});

describe('lab questions', () => {
  it('„Stirbt der Boss am Gegenschlag von Liora?“ – yes, almost always', () => {
    const { state: s } = labState(data, 'boss-gegenschlag');
    const r = labAttack(data, s, 'osric', 'liora', { seeds: 50 });
    expect(r.forecast.defender.canStrike).toBe(true);
    expect(r.forecast.attackerHpAfter).toBe(0);
    expect(r.attackerFalls).toBeGreaterThan(0.9);
    expect(r.targetFalls).toBe(0);
    // the same answer twice: the seeds make it reproducible
    expect(labAttack(data, s, 'osric', 'liora', { seeds: 50 })).toEqual(r);
  });

  it('„Wählt die Wegsuche den Weg ums Feuer?“ – only when it costs the same', () => {
    const { state: s } = labState(data, 'feuer-weg');
    const around = labPath(data, s, 'dev_marksman', [6, 8]);
    expect(around.cost).toBe(5);
    expect(around.hazards).toEqual([]);
    expect(around.path.map((p) => p.terrain)).toContain('forest');
    const through = labPath(data, s, 'dev_marksman', [7, 9]);
    expect(through.cost).toBe(5);
    expect(through.hazards).toEqual([[5, 9]]);
    expect(through.thisTurn).toBe(true);
  });

  it('plays the enemy phase and the rest of the battle from the situation', () => {
    const { state: s, scenario } = labState(data, 'boss-gegenschlag');
    const e = labEnemyPhase(data, s);
    expect(e.turn).toBe(5);
    expect(e.changes.length).toBeGreaterThan(0);
    const runs = labPlay(data, s, 2, scenario.seed);
    expect(runs.map((r) => r.outcome)).toEqual(['victory', 'victory']);
    expect(runs[0]!.side).toHaveProperty('s_chests');
  });
});
