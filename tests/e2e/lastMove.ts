import { loadContentFromDisk } from '../../src/content/node';
import { addToRoster, applyCommand, autoCommand, beginBattle, levelUp, newCampaign, turnStartIndex, type BattleState, type Command } from '../../src/core';
import { APP_VERSION, contentVersionOf, exportSave } from '../../src/persistence/save';

/**
 * Shared by the late-act specs: an exported save whose battle stands one step before the win. The company of the node's expected level plays the
 * map with the simulator's player (`autoCommand`) up to the command that wins it. That command is not applied: its unit only `move`s to the field
 * (the move is a separate command and the unit has not acted yet) and everybody else waits, so the browser test gives the last command itself,
 * "Seize" or "Open", through the action bar.
 */
export interface LastMove {
  save: string;
  /** the unit that gives the winning command */
  unit: string;
  seed: number;
}

export function savedBeforeWin(nodeId: string, campaignId: string, seeds: number[]): LastMove {
  const { data } = loadContentFromDisk();
  const node = data.campaign.nodes.find((n) => n.id === nodeId)!;
  for (const seed of seeds) {
    const c = newCampaign(data, seed, { difficulty: 'easy', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    for (const id of ['kael', 'brenna', 'tobin', 'fenn', 'mira', 'liora', 'varek']) addToRoster(data, c, id);
    for (const u of c.roster) while (u.level < node.expectedLevel) levelUp(data, u, c.rng);
    // every story node before this one is done (side quests and the nodes after it are not)
    const order = data.campaign.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
    c.completed = order.slice(0, order.indexOf(nodeId));
    const start = beginBattle(data, c, nodeId, c.roster.map((u) => u.id)).state;
    let s: BattleState = start;
    const commands: Command[] = [];
    let before: BattleState | null = null;
    let last: Command | null = null;
    for (let i = 0; i < 4000 && !s.outcome; i++) {
      const cmd = autoCommand(data, s);
      const next = applyCommand(data, s, cmd).state;
      if (next.outcome) {
        before = s;
        last = cmd;
        s = next;
        break;
      }
      commands.push(cmd);
      s = next;
    }
    if (!before || !last || s.outcome !== 'victory' || last.type !== 'act') continue;
    // the winning act is replaced by a plain move of its unit; the others wait
    const log: Command[] = [...commands];
    let cur = before;
    const step = (cmd: Command) => {
      cur = applyCommand(data, cur, cmd).state;
      log.push(cmd);
    };
    step({ type: 'move', unit: last.unit, to: last.to });
    for (const u of cur.units) {
      if (u.team !== 'player' || !u.pos || u.gone || u.downed || u.acted || u.uid === last.unit) continue;
      step({ type: 'act', unit: u.uid, to: u.pos, action: { kind: 'wait' } });
    }
    const ready = cur.units.filter((u) => u.team === 'player' && u.pos && !u.gone && !u.downed && !u.acted);
    if (cur.outcome || ready.length !== 1) continue;
    return {
      save: exportSave({
        format: 2,
        campaignId,
        slot: 'auto',
        createdAt: new Date().toISOString(),
        appVersion: APP_VERSION,
        contentVersion: contentVersionOf(data),
        payload: { campaign: c, battle: { start, commands: log, turnStartIndex: turnStartIndex(log), effects: [] }, screen: 'battle' },
      }),
      unit: ready[0]!.id,
      seed,
    };
  }
  throw new Error(`no seed wins ${nodeId}`);
}
