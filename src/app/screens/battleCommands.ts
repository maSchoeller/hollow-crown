/** Command execution of the battle screen (Battle.tsx). */
import { type Command, type GameEvent, active, filterEvents, pathTo, phaseRecap, pursueReach, samePos, visibleState } from '../../core';
import { audio } from '../audio';
import { battle, command, commandOffThread } from '../state/battle';
import { concludeBattle } from '../state/flow';
import { data } from '../state/session';
import { settings } from '../state/settings';
import { t } from '../../i18n';
import type { BattleScreen } from './useBattleScreen';
import type { BattlePresentation } from './battlePresentation';
import type { BoardOverlays } from './useBoardOverlays';

/** The command runner of the battle screen: runs a command, plays its events, ends the phase or the battle. */
export function makeRun(b: BattleScreen, reachOf: BoardOverlays['reachOf'], show: BattlePresentation) {
  const {
    boardRef, fogged, ltReady, s, setBusy, setHp, setInfo, setMode, setPhaseView, setRecap, setTileInfo, unit,
  } = b;
  const { showBanner, playLieutenantLines } = show;
  const run = async (cmd: Command) => {
    const board = boardRef.current!;
    // on a fog map the plan may lead through a foe the player does not see: the command carries the planned way, and the core
    // stops the unit in front of the foe (Hinterhalt)
    if (fogged && (cmd.type === 'move' || cmd.type === 'act' || cmd.type === 'pursue') && !cmd.path) {
      const u = unit(cmd.unit);
      const reach = cmd.type === 'pursue' ? pursueReach(data, s, u) : reachOf(u);
      const path = reach && !samePos(u.pos, cmd.to) ? pathTo(reach, cmd.to) : [];
      if (path.length > 1) cmd = { ...cmd, path };
    }
    setBusy(true);
    setMode({ k: 'idle' });
    setInfo(null);
    setTileInfo(null);
    setRecap(null);
    const enemy = cmd.type === 'endPhase';
    const before = battle.value!.state;
    if (enemy) setPhaseView({ phase: 'enemy', turn: s.turn });
    const sp = enemy ? settings.value.enemySpeed : settings.value.speed;
    board.speed = sp === 2 ? 2 : 1;
    board.skip = sp === 3;
    let events: GameEvent[] | null;
    try {
      // the enemy phase is computed in the core worker, player commands directly (architecture §5.13)
      events = enemy ? await commandOffThread(cmd) : command(cmd);
    } catch (e) {
      console.error(e);
      setPhaseView(null);
      setBusy(false);
      return;
    }
    if (!events) {
      // the battle was left or restarted while the worker computed; the answer was dropped
      setPhaseView(null);
      setBusy(false);
      return;
    }
    const after = battle.value!.state;
    const shown = filterEvents(data, after, events, 'player', before);
    await board.play(shown, visibleState(data, after, 'player'), after.units);
    // a lieutenant who came into sight by this command speaks his opening line (story 3.2: under fog it waits for the sight)
    if (ltReady.current && !battle.value!.state.outcome) await playLieutenantLines(true);
    board.skip = false;
    setHp({});
    setPhaseView(null);
    setBusy(false);
    const st = battle.value!.state;
    // what the foe phase did, as the player saw it (story 13.7); nothing when nothing happened
    if (enemy && !st.outcome) {
      const rows = phaseRecap(data, visibleState(data, before, 'player'), visibleState(data, st, 'player'), shown);
      if (rows.length) setRecap({ turn: before.turn, rows });
    }
    if (st.outcome) {
      await showBanner(t(st.outcome === 'victory' ? 'ui.battle.victory' : 'ui.battle.defeat'), st.outcome === 'victory' ? 'victory' : 'enemy', 1600);
      audio.sfx(st.outcome === 'victory' ? 'victory' : 'defeat');
      concludeBattle();
      return;
    }
    // auto end of phase when every unit has acted – not while a skirmisher may still pursue
    if (st.phase === 'player' && !st.pursue && !st.units.some((u) => u.team === 'player' && active(u) && !u.acted)) {
      setTimeout(() => void run({ type: 'endPhase' }), 350);
    }
  };
  return run;
}
