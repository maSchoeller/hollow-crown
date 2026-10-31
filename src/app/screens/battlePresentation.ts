/** Presentation of played events on the battle screen (Battle.tsx). */
import { type Bark, barkFor } from '../battle/barks';
import type { GameEvent } from '../../core';
import { artId } from './unitArt';
import { audio } from '../audio';
import { battle } from '../state/battle';
import { campaign, data } from '../state/session';
import { cutInLineColour, cutInName, cutInPortrait } from '../battle/cutIn';
import { fleeBark, ltBarks } from '../battle/ltLines';
import { halfFigures } from '../state/halves';
import { itemName, unitName } from '../../ui/components';
import { settings } from '../state/settings';
import { t } from '../../i18n';
import type { BattleScreen } from './useBattleScreen';

/** Banner, cut-in, event presentation and barks of the battle screen; sets the board's event and cut-in handlers. */
export function useBattlePresentation(b: BattleScreen) {
  const {
    bandScene, barkSeq, boardRef, cutInRef, cutSeq, eventRef, fleeSpoken, ltReady, ltSpoken, openingBark, s,
    setBanner, setBark, setCutIn, setDialogue, setLevelUp, setPhaseView, setToast, unit,
  } = b;
  const showBanner = (text: string, cls: string, ms = 1000) =>
    new Promise<void>((resolve) => {
      if (boardRef.current?.skip) return resolve();
      setBanner({ text, cls });
      setTimeout(() => {
        setBanner(null);
        resolve();
      }, ms / (boardRef.current?.speed ?? 1));
    });

  /** Builds the band of a critical hit from the attacker: portrait `angry` (letter medallion without one), name of the skill or weapon, speed line colour. */
  cutInRef.current = (c) => {
    const u = battle.value!.state.units.find((x) => x.uid === c.unit);
    if (!u) return;
    const name = unitName(u);
    setCutIn({
      seq: ++cutSeq.current,
      team: u.team,
      name: cutInName(c.skill, u.equip.mainHand, { skill: (id) => t(`skill.${id}.name`), item: (i) => itemName(data, i) }),
      portrait: cutInPortrait(artId(u.portrait, u.classId), halfFigures.value, name),
      line: cutInLineColour(data, c.element, u.team),
      inMs: c.inMs,
      holdMs: c.holdMs,
      outMs: c.outMs,
    });
  };

  eventRef.current = async (e: GameEvent) => {
    switch (e.t) {
      case 'phase':
        audio.music(e.phase === 'player' ? 'battle_player' : 'battle_enemy');
        audio.sfx('phase');
        setPhaseView({ phase: e.phase, turn: e.turn });
        if (!boardRef.current?.skip) await new Promise((resolve) => setTimeout(resolve, 700 / (boardRef.current?.speed ?? 1)));
        break;
      case 'dialogue':
      case 'quote':
        if (!data.scenes[e.id]) break;
        {
          // a scene of spoken lines without answers plays as a speech band fixed to the screen: no camera move, no figure needed
          await new Promise<void>((resolve) => setDialogue({ id: e.id, done: resolve, band: bandScene(e.id) }));
          setDialogue(null);
        }
        break;
      case 'levelUp':
        audio.sfx('levelup');
        if (boardRef.current?.skip || unit(e.unit)?.team !== 'player') break;
        await new Promise<void>((resolve) => setLevelUp({ uid: e.unit, gains: e.gains, level: e.level, done: resolve }));
        setLevelUp(null);
        break;
      case 'strike':
        audio.sfx(!e.hit ? 'miss' : e.crit ? 'crit' : e.magic ? `magic_${e.element ?? 'light'}` : 'hit');
        break;
      case 'ambush':
        audio.sfx('downed');
        setToast(t('ui.toast.ambush', { name: unitName(unit(e.by) ?? { nameKey: 'class.brigand.name' }) }));
        break;
      case 'mastered':
        setToast(t('ui.toast.mastered', { skill: t(`skill.${e.skill}.name`) }));
        break;
      case 'recruited':
        audio.sfx('recruit');
        setToast(t('ui.toast.recruited', { name: unitName(unit(e.unit) ?? { nameKey: `unit.${e.unit}.name` }) }));
        break;
      case 'loot':
        audio.sfx('loot');
        setToast(t(e.toConvoy ? 'ui.toast.lootConvoy' : 'ui.toast.loot', { item: itemName(data, e.item) }), e.item);
        break;
      case 'gold':
        audio.sfx('gold');
        setToast(t('ui.toast.gold', { n: e.amount }));
        break;
      case 'razed':
        setToast(t('ui.toast.razed'));
        break;
      case 'downed':
        audio.sfx('downed');
        break;
      case 'died':
        audio.sfx('death');
        break;
      case 'fled': {
        audio.sfx('downed');
        // the flee line after the jump (story 3.2); skip mode leaves it out
        const st = battle.value!.state;
        const play = !boardRef.current?.skip && settings.value.speed !== 3;
        const line = fleeBark(data, campaign.value, st, e.unit, e.by, fleeSpoken.current, play);
        if (line) await playBark(line);
        break;
      }
      case 'heal':
        audio.sfx('heal');
        break;
      default:
        break;
    }
    // combat bark (story 9.13): presentation only, skipped in skip mode; the opening bark waits until the start events
    // (intro and tutorial dialogues) have played
    const b = boardRef.current?.skip ? null : barkFor(data, s, e);
    if (b?.line === 'battle_start') openingBark.current = b;
    else if (b) await playBark(b);
    if (ltReady.current && ((e.t === 'phase' && e.phase === 'player') || e.t === 'spawned')) await playLieutenantLines(true);
  };
  const playLieutenantLines = async (play: boolean) => {
    const st = battle.value!.state;
    const skip = !play || boardRef.current?.skip || settings.value.speed === 3;
    for (const b of ltBarks(data, campaign.value, st, ltSpoken.current, !skip)) await playBark(b);
  };
  const playBark = async (b: Bark) => {
    await new Promise<void>((resolve) => setBark({ b, seq: ++barkSeq.current, done: resolve }));
    setBark(null);
  };
  return { showBanner, playBark, playLieutenantLines };
}

export type BattlePresentation = ReturnType<typeof useBattlePresentation>;
