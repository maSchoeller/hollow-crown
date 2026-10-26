/** Shared fixture of the rule tests: an empty open field built from the prologue, and units the tests place themselves. */
import {
  beginBattle,
  computeStats,
  newCampaign,
  newItem,
  type BattleState,
  type BattleUnit,
  type GameData,
  type Pos,
} from '../../src/core';

/** Prologue state with every unit removed from the map except the ones a test places itself, on open plain ground. */
export function arena(data: GameData): BattleState {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
  for (const u of s.units) u.pos = null;
  s.units.forEach((u) => (u.gone = 'retreated'));
  s.outcome = null;
  s.lockedRoles = [];
  s.terrain = s.terrain.map(() => 'plain');
  s.objects = [];
  s.loot = [];
  s.timers = {};
  return s;
}

/** Puts a spare unit of the team on `at` as `classId`, bare, with `weapon` in the main hand when given. */
export function place(data: GameData, s: BattleState, team: BattleUnit['team'], classId: string, at: Pos, weapon?: string): BattleUnit {
  const u = s.units.find((x) => x.gone === 'retreated' && x.pos === null && (team === 'player' ? x.team === 'player' : x.team === 'enemy'));
  if (!u) throw new Error('out of units');
  u.gone = undefined;
  u.pos = at;
  u.classId = classId;
  u.equip = {};
  u.bag = [];
  u.acted = false;
  u.moved = false;
  u.downed = false;
  u.status = [];
  u.buffs = [];
  u.usedPerMap = {};
  u.personalSkill = undefined;
  u.flags = [];
  u.dropUids = [];
  u.mastered = [];
  u.loadout = [];
  u.ai = u.team === 'enemy' ? { profile: 'hold' } : undefined;
  u.hp = computeStats(data, u).maxHp;
  if (weapon) u.equip.mainHand = newItem(s, weapon, data);
  return u;
}
