import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import type { GameData, GameEvent, Pos } from '../../src/core';
import { aiPhaseTimes } from '../../tools/enemyPhase';
import { pausedFor, phaseBoost, phaseClock, timerLook } from '../../src/render/board/aiPacing';
import { simulateCampaign } from '../../tools/simCampaign';

let data: GameData;

beforeAll(() => {
  data = loadContentFromDisk().data;
});

const way = (n: number): Pos[] => Array.from({ length: n + 1 }, (_, i) => [i, 0] as Pos);
const walk = (unit: string, tiles: number): GameEvent[] => [
  { t: 'aiTurn', unit },
  { t: 'moved', unit, path: way(tiles) },
  { t: 'exhausted', unit },
];
const strike = (attacker: string, defender: string): GameEvent => ({
  t: 'strike',
  attacker,
  defender,
  hit: true,
  crit: false,
  dmg: 3,
  hpAfter: 5,
  ranged: false,
  magic: false,
});

describe('AI phase time (stories 15.10, 15.11)', () => {
  it('counts only AI phases, one figure per phase', () => {
    const events: GameEvent[] = [
      { t: 'phase', phase: 'player', turn: 1 },
      { t: 'moved', unit: 'me', path: way(5) },
      { t: 'phase', phase: 'enemy', turn: 1 },
      ...walk('a', 3),
      { t: 'phase', phase: 'other', turn: 1 },
      ...walk('o', 1),
      { t: 'phase', phase: 'player', turn: 2 },
    ];
    const p = aiPhaseTimes(data, events);
    const pace = data.render.aiPace;
    expect(p).toHaveLength(1); // enemy and third party together: the wait between two player phases
    const one = (tiles: number) => data.render.aiPace.play.glide + pace.focusMs + tiles * pace.stepMs + pace.afterMoveMs;
    expect(p[0]!.single).toBe(2 * pace.phaseBannerMs + one(3) + one(1));
  });

  it('walkers of a march go together, a strike stays on its own; a counter of the player pauses shorter', () => {
    const pace = data.render.aiPace;
    const events: GameEvent[] = [
      { t: 'phase', phase: 'enemy', turn: 1 },
      ...walk('a', 4),
      ...walk('b', 2),
      ...walk('c', 3),
      { t: 'aiTurn', unit: 'd' },
      strike('d', 'me'),
      strike('me', 'd'),
      { t: 'phase', phase: 'player', turn: 2 },
    ];
    const [p] = aiPhaseTimes(data, events, (uid) => (uid === 'me' ? 'player' : 'enemy'));
    const walkMs = (tiles: number) => tiles * pace.stepMs + pace.afterMoveMs;
    const blow = data.render.aiPace.play.hit + data.render.aiPace.play.recoil + data.render.aiPace.play.lungeBack;
    const turnD = data.render.aiPace.play.glide + pace.focusMs + blow + pace.afterStrikeMs + blow + data.render.aiPace.play.playerStrikePause;
    expect(p!.single).toBe(
      pace.phaseBannerMs + 3 * (data.render.aiPace.play.glide + pace.focusMs) + walkMs(4) + walkMs(2) + walkMs(3) + turnD,
    );
    expect(p!.march).toBe(pace.phaseBannerMs + data.render.aiPace.play.glide + walkMs(4) + turnD);
    expect(p!.shown).toBe(p!.march); // short: no boost
  });

  it('a phase over the time budget plays faster, at most by maxBoost', () => {
    const { phaseBudgetMs: budget, maxBoost } = data.render.aiPace;
    expect(phaseBoost(data, budget, 1)).toBe(1);
    expect(phaseBoost(data, 2 * budget, 1)).toBeCloseTo(2);
    expect(phaseBoost(data, 2 * budget, 2)).toBe(1); // the chosen tempo 2× already fits it
    expect(phaseBoost(data, 100 * budget, 1)).toBe(maxBoost);
    // behind the plan: half the budget gone with the whole plan left plays twice as fast; past the budget as fast as allowed
    expect(phaseBoost(data, budget, 1, budget / 2)).toBeCloseTo(2);
    expect(phaseBoost(data, budget, 1, -5000)).toBe(maxBoost);
    const many: GameEvent[] = [{ t: 'phase', phase: 'enemy', turn: 3 }];
    for (let i = 0; i < 30; i++) many.push({ t: 'aiTurn', unit: `f${i}` }, strike(`f${i}`, 'me'));
    many.push({ t: 'phase', phase: 'player', turn: 4 });
    const [p] = aiPhaseTimes(data, many);
    expect(p!.march).toBeGreaterThan(budget);
    expect(p!.shown).toBeCloseTo(Math.max(budget, p!.march / maxBoost));
  });

  it('the clock of a phase starts with „Gemeinsam“ only, follows the plan and stops at the player phase', () => {
    const events: GameEvent[] = [
      { t: 'phase', phase: 'player', turn: 1 },
      { t: 'phase', phase: 'enemy', turn: 1 },
      { t: 'aiTurn', unit: 'a' },
      strike('a', 'me'),
      { t: 'phase', phase: 'other', turn: 1 },
      { t: 'aiTurn', unit: 'o' },
      strike('o', 'me'),
      { t: 'phase', phase: 'player', turn: 2 },
    ];
    const team = () => undefined;
    expect(phaseClock(data, events, 0, true, null, 0, team)).toBeNull(); // the player's phase has none
    expect(phaseClock(data, events, 1, false, null, 0, team)).toBeNull(); // „Einzeln“ keeps the chosen tempo
    const c1 = phaseClock(data, events, 1, true, null, 1000, team)!;
    expect(c1).toMatchObject({ start: 1000, end: 7 });
    expect(c1.leftMs).toBe(aiPhaseTimes(data, events)[0]!.march);
    // the third party's phase goes on with the same clock; what is left shrinks as the events are played
    const c4 = phaseClock(data, events, 4, true, phaseClock(data, events, 3, true, c1, 1500, team), 2000, team)!;
    expect(c4.start).toBe(1000);
    expect(c4.leftMs).toBeLessThan(c1.leftMs);
    expect(phaseClock(data, events, 7, true, c4, 3000, team)).toBeNull();
    // waiting for the player does not use up the budget
    expect(pausedFor(c4, 800)!.start).toBe(1800);
    expect(pausedFor(null, 800)).toBeNull();
  });

  it('the terrain is rebuilt for what a timer shows, not for its turns left', () => {
    const fire = (turns: number, revertTo = 'grass') => ({ '3,4': { kind: 'burning' as const, turns, revertTo } });
    expect(timerLook(fire(2))).toBe(timerLook(fire(1)));
    expect(timerLook(fire(2))).not.toBe(timerLook(fire(2, 'ash')));
    expect(timerLook(fire(2))).not.toBe(timerLook({}));
    expect(timerLook({ a: { kind: 'rockwall', revertTo: 'x' }, b: { kind: 'burning', revertTo: 'y' } })).toBe(
      timerLook({ b: { kind: 'burning', revertTo: 'y' }, a: { kind: 'rockwall', revertTo: 'x' } }),
    );
  });

  it(
    'the chained simulation records rounds, actions and AI phases of the first attempts won',
    { timeout: 60000 },
    () => {
      const [m] = simulateCampaign(data, {
        runs: 1,
        seed: 3,
        difficulty: 'normal',
        deathMode: 'standard',
        maxMissions: 1,
      }).missions;
      expect(m!.wins).toBe(1);
      expect(m!.turns).toBeGreaterThan(0);
      expect(m!.actions).toBeGreaterThan(0);
      expect(m!.deployed).toBeGreaterThan(0);
      expect(m!.phases).toBeGreaterThanOrEqual(m!.turns - 1);
      expect(m!.phaseMarch).toBeLessThanOrEqual(m!.phaseSingle);
      expect(m!.phaseShown).toBeLessThanOrEqual(m!.phaseMarch);
      expect(m!.phaseSingleMax).toBeGreaterThan(0);
    },
  );
});
