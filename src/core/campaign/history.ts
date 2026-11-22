/**
 * The play history (concept/24-architecture §6.2b): what the player did, kept in the campaign so a save shows it afterwards.
 * One record per battle attempt the campaign sees (`finishMission`, `restartMission`, `abandonMission`) with levels, gold,
 * EP, losses and the battle's start + command log (replayable), and the camp actions between battles as compact records.
 * `applyCampaign` writes it after every command; pure and deterministic, so journal replays build the same history.
 */
import type { Command } from '../battle/commands';
import { applyCommand } from '../battle/apply';
import type { DeathMode, Difficulty } from '../defs';
import type { GameData } from '../gameData';
import { effectiveLevel } from '../rules/skills';
import type { BattleState, CampaignState, UnitRecord } from '../state';
import { stateHash } from '../util';
import { actOf, findNode } from './acts';
import { roomLevel } from './castle';
import type { BattleResult } from './campaign';
import type { CampaignCommand } from './commands';
import { nodeLevel } from './position';

/** A deployed company member: class and level when the battle began, level after it, EP earned. */
export interface HistoryUnit {
  id: string;
  classId: string;
  level: number;
  /** effective level (`effectiveLevel`: a pro class counts `advancedLevelOffset` more) */
  eff: number;
  levelAfter: number;
  effAfter: number;
  ep: number;
  fell?: true;
}

/** A camp action: command type, its main argument (item def, unit, room …) and the gold it cost (negative) or brought. */
export interface CampRecord {
  cmd: string;
  arg?: string;
  gold: number;
}

/** `unfinished`: a `finishMission` whose battle had no outcome yet (the core accepts it; the app never sends one) */
export type HistoryOutcome = 'victory' | 'defeat' | 'unfinished' | 'restarted' | 'abandoned';

/** One battle attempt. Fields the command does not carry (Standard's `restartMission` has no log) are `null` or empty. */
export interface BattleRecord {
  /** running number in the history, from 1 */
  n: number;
  node: string;
  haunt?: string;
  map: string;
  act: number;
  /** attempt at this node (or haunt) since its last victory, from 1 */
  attempt: number;
  outcome: HistoryOutcome;
  rounds: number | null;
  difficulty: Difficulty;
  deathMode: DeathMode;
  /** company army level before the battle: mean effective level of the `simulation.armySize` strongest (2 decimals) */
  army: number;
  /** the level the node expects (`nodeLevel`; a haunt: its `hauntLevel`) */
  expected: number | null;
  goldBefore: number;
  goldAfter: number;
  ep: number;
  downs: number | null;
  fallen: string[];
  /** side objectives done */
  side: string[];
  units: HistoryUnit[];
  /** camp actions since the previous record (before this battle) */
  camp: CampRecord[];
  /** round restarts (`restartTurn`) during this attempt */
  turnRestarts: number;
  /** battle commands played (also where the log itself is not kept) */
  actions: number;
  startHash: string | null;
  /** start snapshot and full command log: `start` + `commands` replay the battle (absent where the command had none) */
  start?: BattleState;
  commands?: Command[];
}

export interface PlayHistory {
  /** `start`: recorded since the campaign began; `migrated`: the save is older than the history (format < 4), earlier play is missing */
  since: 'start' | 'migrated';
  battles: BattleRecord[];
  /** camp actions since the last battle record (they move into the next one) */
  camp: CampRecord[];
  /** round restarts since the last battle record */
  turnRestarts: number;
}

export const emptyHistory = (since: PlayHistory['since']): PlayHistory => ({ since, battles: [], camp: [], turnRestarts: 0 });

const round2 = (x: number): number => Math.round(x * 100) / 100;

/** Army level of the company: mean effective level of its `simulation.armySize` strongest members (as tools/simCampaign.ts). */
export function companyLevel(data: GameData, c: Pick<CampaignState, 'roster'>): number {
  const top = c.roster
    .map((u) => effectiveLevel(data, u))
    .sort((a, b) => b - a)
    .slice(0, data.balance.simulation.armySize);
  return top.length ? top.reduce((a, b) => a + b, 0) / top.length : 0;
}

/** Commands that are camp actions (the rest is bookkeeping, story choices or battle flow). */
const CAMP = new Set<CampaignCommand['type']>([
  'buy', 'buyOffer', 'buyEmberSpark', 'sell', 'equip', 'unequip', 'saveGearTemplate', 'applyGearTemplate', 'equipBest', 'upgrade',
  'upgradePotion', 'reroll', 'insertRune', 'removeRune', 'mergeRunes', 'craft', 'inheritHeritage', 'healScar', 'unlockSupport',
  'setLoadout', 'promote', 'changeProPath', 'learnSecondPath', 'buildRoom', 'hire', 'setTavernWish', 'dismiss',
]);

function itemDefOf(c: CampaignState, uid: string): string {
  const all = [...c.convoy, ...c.offers, ...c.roster.flatMap((u) => [...Object.values(u.equip), ...u.bag])];
  return all.find((i) => i?.uid === uid)?.def ?? uid;
}

function campArg(c: CampaignState, after: CampaignState, cmd: CampaignCommand): string | undefined {
  switch (cmd.type) {
    case 'buy':
      return cmd.for ? `${cmd.for.unit}:${cmd.item}` : cmd.item;
    case 'buyOffer':
      return cmd.for ? `${cmd.for.unit}:${itemDefOf(c, cmd.uid)}` : itemDefOf(c, cmd.uid);
    case 'sell':
    case 'upgrade':
    case 'unequip':
      return itemDefOf(c, cmd.uid);
    case 'reroll':
      return `${itemDefOf(c, cmd.uid)}#${cmd.index}`;
    case 'equip':
      return `${cmd.unit}:${itemDefOf(c, cmd.uid)}`;
    case 'insertRune':
      return `${itemDefOf(c, cmd.item)}:${cmd.rune}`;
    case 'removeRune':
      return itemDefOf(c, cmd.item);
    case 'upgradePotion':
      return cmd.item;
    case 'mergeRunes':
      return cmd.rune;
    case 'craft':
      return cmd.recipe;
    case 'inheritHeritage':
      return `${cmd.from}>${cmd.to}:${cmd.skill}`;
    case 'healScar':
    case 'setLoadout':
    case 'learnSecondPath':
    case 'dismiss':
    case 'saveGearTemplate':
    case 'applyGearTemplate':
    case 'equipBest':
      return cmd.unit;
    case 'promote':
    case 'changeProPath':
      return `${cmd.unit}:${cmd.classId}`;
    case 'unlockSupport':
      return cmd.pair;
    case 'buildRoom':
      return `${cmd.room}:${roomLevel(after, cmd.room)}`;
    case 'hire': {
      const m = c.tavern.find((u) => u.id === cmd.offer);
      return m ? `${m.classId}:${m.level}` : cmd.offer;
    }
    case 'setTavernWish':
      return cmd.role ?? undefined;
    default:
      return undefined;
  }
}

function unitBefore(data: GameData, u: UnitRecord): Pick<HistoryUnit, 'id' | 'classId' | 'level' | 'eff'> {
  return { id: u.id, classId: u.classId, level: u.level, eff: effectiveLevel(data, u) };
}

/** The company members a battle started with (guests and enemies are not in the roster). */
function deployed(c: CampaignState, start: BattleState): UnitRecord[] {
  const ids = new Set(start.units.filter((u) => u.team === 'player').map((u) => u.id));
  return c.roster.filter((u) => ids.has(u.id));
}

function attemptOf(h: PlayHistory, node: string, haunt: string | undefined): number {
  let n = 1;
  for (let i = h.battles.length - 1; i >= 0; i--) {
    const b = h.battles[i]!;
    if (b.node !== node || b.haunt !== haunt) continue;
    if (b.outcome === 'victory') break;
    n++;
  }
  return n;
}

interface BattleFacts {
  node: string;
  haunt?: string;
  outcome: HistoryOutcome;
  start?: BattleState;
  /** the battle's state at its end (replayed) */
  end?: BattleState;
  commands?: Command[];
  actions: number;
  result?: BattleResult;
}

function battleRecord(data: GameData, h: PlayHistory, before: CampaignState, after: CampaignState, f: BattleFacts): BattleRecord {
  const nodeDef = findNode(data, f.node);
  const story = !f.haunt && nodeDef;
  const expected = story ? nodeLevel(data, before, nodeDef) : (f.start?.hauntLevel ?? null);
  const results = new Map((f.result?.units ?? []).map((u) => [u.id, u]));
  const fell = new Set((f.result?.fallen ?? []).map((u) => u.id));
  const units: HistoryUnit[] = f.start
    ? deployed(before, f.start).map((u) => {
        const now = after.roster.find((x) => x.id === u.id);
        const r = results.get(u.id);
        return {
          ...unitBefore(data, u),
          levelAfter: now?.level ?? u.level,
          effAfter: now ? effectiveLevel(data, now) : effectiveLevel(data, u),
          ep: r?.exp ?? 0,
          ...(fell.has(u.id) ? { fell: true as const } : {}),
        };
      })
    : [];
  return {
    n: h.battles.length + 1,
    node: f.node,
    ...(f.haunt ? { haunt: f.haunt } : {}),
    map: f.start?.mapId ?? nodeDef?.map ?? '',
    act: f.start?.act ?? actOf(before),
    attempt: attemptOf(h, f.node, f.haunt),
    outcome: f.outcome,
    rounds: f.end?.turn ?? null,
    difficulty: before.settings.difficulty,
    deathMode: before.settings.deathMode,
    army: round2(companyLevel(data, before)),
    expected,
    goldBefore: before.gold,
    goldAfter: after.gold,
    ep: units.reduce((n, u) => n + u.ep, 0),
    downs: f.end?.stats.downs ?? null,
    fallen: [...fell],
    side: (f.result?.side ?? []).filter((s) => s.done).map((s) => s.id),
    units,
    camp: h.camp,
    turnRestarts: h.turnRestarts,
    actions: f.actions,
    startHash: f.start ? stateHash(f.start) : null,
    ...(f.start && f.commands ? { start: f.start, commands: f.commands } : {}),
  };
}

function replayEnd(data: GameData, start: BattleState, commands: readonly Command[]): BattleState {
  let s = start;
  for (const c of commands) s = applyCommand(data, s, c).state;
  return s;
}

/**
 * The history after `cmd` turned `before` into `after` (both without their history). `end` and `result` are the finished
 * battle of a `finishMission`. Returns the same object when nothing is recorded. The old records are shared, never copied.
 */
export function recordHistory(
  data: GameData,
  h: PlayHistory | undefined,
  before: CampaignState,
  after: CampaignState,
  cmd: CampaignCommand,
  end?: BattleState,
  result?: BattleResult,
): PlayHistory | undefined {
  const cur = (): PlayHistory => h ?? emptyHistory('migrated');
  const add = (f: BattleFacts): PlayHistory => {
    const base = cur();
    return { ...base, battles: [...base.battles, battleRecord(data, base, before, after, f)], camp: [], turnRestarts: 0 };
  };
  switch (cmd.type) {
    case 'finishMission':
      return add({
        node: cmd.start.nodeId,
        haunt: cmd.start.hauntId,
        outcome: end?.outcome ?? 'unfinished',
        start: cmd.start,
        end,
        commands: cmd.commands,
        actions: cmd.commands.length,
        result,
      });
    case 'restartMission':
      return cmd.lost
        ? add({ node: cmd.node, haunt: cmd.haunt, outcome: 'defeat', start: cmd.lost.start, end: replayEnd(data, cmd.lost.start, cmd.lost.commands), commands: cmd.lost.commands, actions: cmd.lost.commands.length })
        : add({ node: cmd.node, haunt: cmd.haunt, outcome: 'restarted', actions: 0 });
    case 'abandonMission':
      return add({ node: cmd.node, haunt: cmd.haunt, outcome: 'abandoned', actions: cmd.commands.length });
    case 'restartTurn': {
      const base = cur();
      return { ...base, turnRestarts: base.turnRestarts + 1 };
    }
    default: {
      const gold = after.gold - before.gold;
      if (!CAMP.has(cmd.type) && !(cmd.type === 'effects' && gold !== 0)) return h;
      // a command that changed nothing (e.g. `equipBest` on a unit that wears the best) is no action
      if (JSON.stringify(before) === JSON.stringify(after)) return h;
      const base = cur();
      const arg = campArg(before, after, cmd);
      return { ...base, camp: [...base.camp, { cmd: cmd.type, ...(arg !== undefined ? { arg } : {}), gold }] };
    }
  }
}
