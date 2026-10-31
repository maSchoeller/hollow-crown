/** The battle screen: HUD, sheets and panels over the 3D board. State, board, overlays, presentation, commands and input live in the hooks next to it. */
import { type ActionOption, type BattleUnit, active, availableActions, castBlock, classActionId, classPreview, contextEntries, damageAtHit, forecast, longPressView, passivePreview, posKey, stealBlock, unitAt, wantedView, weaponRange } from '../../core';
import { BackPill, ClassPreviewCard, ContextBands, Dock, DockAction, ForecastCard, GoalPills, HintPill, MenuStone, PassiveRuleCard, PhasePill, RosterPanel, SpeedControl, TerrainCard, TurnPill, UnitCardB, roleIcon } from './BattleHud';
import { BattleMenu, ClassPick, ConvoySheet, ItemPick, LevelUpPopup, ObjectivesPanel, StealPick, TradeSheet, UnitInfo } from './BattlePanels';
import { CLASS_KINDS, type Mode } from './battleMode';
import { CutIn } from './CutIn';
import { EnemyStrip, RecapStone, TerrainChip, ThreatPill } from './BattleLegibility';
import { Icon } from '../../ui/icons';
import { ItemImage, Piece, PrimaryButton, SecondaryButton } from '../../ui/pieces';
import { Scene, SceneBand } from './Scene';
import { Toast } from '../../ui/components';
import { WantedDock } from './Wanted';
import { abandonBattle, canAbandon, canRestart, pendingEvents, restartBattle } from '../state/battle';
import { campaign, data } from '../state/session';
import { goalLine, goalStand } from '../../ui/goalText';
import { mapOf } from '../../core/battle/objectives';
import { markedGoal, toggleGoalMark } from '../state/goalMarks';
import { openHandbook } from '../state/handbook';
import { screen } from '../state/screen';
import { settings, updateSettings } from '../state/settings';
import { t } from '../../i18n';
import { useEffect, useState } from 'preact/hooks';
import { useBattleScreen } from './useBattleScreen';
import { useBattlePresentation } from './battlePresentation';
import { useBoardLifecycle } from './useBoardLifecycle';
import { useBoardOverlays } from './useBoardOverlays';
import { makeRun } from './battleCommands';
import { useBattleInput } from './useBattleInput';

export { pendingEvents };

export function Battle() {
  const b = useBattleScreen();
  const {
    banner, bark, boardRef, bottomRef, cancelRef, chipRef, classPick, confirmEnd, convoy, cutIn, danger, dialogue,
    floatRef, fogged, full, hp, info, items, levelUp, loading, menu, mode, objectives, phaseView, reason, recap, s,
    setClassPick, setConvoy, setCutIn, setDanger, setInfo, setItems, setMenu, setMode, setObjectives, setReason,
    setRecap, setToastState, setTrade, setWanted, stageRef, tileInfo, toast, topRef, trade, unit, wanted, wide,
  } = b;
  const show = useBattlePresentation(b);
  useBoardLifecycle(b, show);
  const opt = settings.value;
  const ov = useBoardOverlays(b);
  const { checkTile, checkFoes } = ov;
  const run = makeRun(b, ov.reachOf, show);
  const { playerTurn, selectable, readyCount, leavePursue, finishPursue, confirmPursue, confirmAttack, confirmClassAction, confirmCast, nextUnit, endPhase, doAction, useItem, ctxRef } = useBattleInput(b, ov, run);

  // --------------------------------------------------------------- render
  const selUnit = mode.k !== 'idle' ? unit(mode.uid) : null;
  const infoUnit = info ? s.units.find((u) => u.uid === info) : null;
  const wantedUnit = wanted ? s.units.find((u) => u.uid === wanted) : null;
  const wantedPoster = wantedUnit?.lieutenant && campaign.value ? wantedView(data, campaign.value, wantedUnit.lieutenant, wantedUnit) : null;
  const options = mode.k === 'moved' ? availableActions(data, s, unit(mode.uid), mode.to) : [];
  const aimPre =
    mode.k === 'forecast' && mode.aim
      ? classPreview(data, s, unit(mode.uid), mode.to, { kind: 'aim', target: mode.target, weapon: mode.weapon })
      : null;
  const fc =
    aimPre?.kind === 'aim' ? aimPre.forecast : mode.k === 'forecast' ? forecast(data, s, mode.uid, mode.target, mode.weapon, mode.to) : null;
  // the part of the target's HP bar the attack takes at hit (story 13.4), from the forecast
  const previewAfter = fc && mode.k === 'forecast' ? Math.max(0, fc.defender.hpBefore - damageAtHit(data, fc)) : null;
  const previewUid = mode.k === 'forecast' ? mode.target : null;
  useEffect(() => {
    boardRef.current?.setHpPreview(previewUid && previewAfter !== null ? { uid: previewUid, after: previewAfter } : null);
  }, [previewUid, previewAfter]);
  const weaponsForTarget =
    mode.k === 'forecast'
      ? (availableActions(data, s, unit(mode.uid), mode.to).find((o) => o.kind === (mode.aim ? 'aim' : 'attack'))?.weapons?.[mode.target] ?? [])
      : [];
  const cls = mode.k === 'classPreview' ? classPreview(data, s, unit(mode.uid), mode.to, { kind: mode.action, target: mode.target }) : null;
  const classPre = mode.k === 'steal' ? classPreview(data, s, unit(mode.uid), mode.to, { kind: 'steal', target: mode.target }) : null;
  const castPre = mode.k === 'cast' && mode.at ? classPreview(data, s, unit(mode.uid), mode.to, { kind: 'cast', at: mode.at }) : null;
  const passivePre = mode.k === 'passive' ? passivePreview(data, s, unit(mode.uid), mode.to) : null;

  const map = mapOf(data, s);
  const victory = map.objectives.victory;
  // how many foes are left is not known under fog
  const enemiesLeft = full.units.filter((u) => u.team === 'enemy' && active(u) && !u.ignoreForRout).length;
  // defend: the goal line already names the rounds ("Verwalter schützen · 10 Runden"), the round pill above counts them; a second count would not fit at 375 px
  const goalProgress =
    victory.type === 'rout'
      ? fogged
        ? ''
        : t('ui.hud.left', { n: enemiesLeft })
      : victory.type === 'survive'
        ? t('ui.obj.turnOf', { turn: s.turn, turns: victory.turns })
        : '';
  // a treasure hunt shows its stand instead of the long sentence: "2/5 chests · turn 3 of 8" (the sentence is on the goals sheet)
  const goalText = victory.type === 'treasure' ? goalStand(victory, s) : goalLine(victory, map).replace(/\.$/, '');

  const shownPhase = phaseView?.phase ?? s.phase;
  const shownTurn = phaseView?.turn ?? s.turn;
  const otherPhase = shownPhase !== 'player';

  const attackOpt = options.find((o) => o.kind === 'attack');
  const itemOpt = options.find((o) => o.kind === 'item');
  const classOpts = CLASS_KINDS.map((k) => options.find((o) => o.kind === k)).filter((o): o is ActionOption => !!o);
  const waitOpt = options.find((o) => o.kind === 'wait');
  // context bands (story 2.7): one per target, most urgent first; the front one runs on a tap or F, the others a swipe or arrow key away
  const ctxEntries = mode.k === 'moved' ? contextEntries(data, s, options) : [];
  const ctxSig = mode.k === 'moved' ? `${mode.uid}@${posKey(mode.to)}:${ctxEntries.map((e) => e.id).join(',')}` : '';
  const [ctxSel, setCtxSel] = useState({ sig: '', i: 0 });
  const ctxIdx = ctxSel.sig === ctxSig ? Math.min(ctxSel.i, Math.max(0, ctxEntries.length - 1)) : 0;
  const setCtxIdx = (i: number) => setCtxSel({ sig: ctxSig, i });
  ctxRef.current = {
    n: ctxEntries.length,
    go: () => void doAction(ctxEntries[ctxIdx]!.option),
    step: (d) => setCtxIdx((ctxIdx + d + ctxEntries.length) % ctxEntries.length),
  };

  /** Dock with its four fixed slots: Attack, Class action, Item, Wait. Impossible ones are dimmed; a tap says why. */
  const dock = (u: BattleUnit) => {
    const placed = mode.k === 'moved';
    // while the hint band above already says "pick a target tile", a tap on the disabled dock must not repeat it as a toast
    const ask = (msg: string) => () => {
      if (mode.k === 'selected' && msg === t('ui.hud.pickTile')) return;
      setReason(msg);
    };
    // Wirken dimmed: say why (no tome, light/dark, wind without fog, no valid field)
    const block = placed && !classOpts.length ? castBlock(data, s, u, (mode as Extract<Mode, { k: 'moved' }>).to) : null;
    const scoutBlock = placed && !classOpts.length ? stealBlock(data, s, u, (mode as Extract<Mode, { k: 'moved' }>).to) : null;
    const castReason = block ? t(`ui.cast.no.${block}`) : scoutBlock ? t(`ui.steal.no.${scoutBlock}`) : null;
    const classOne = classOpts.length === 1 ? classOpts[0]! : undefined;
    // passive role (Vorkämpfer: Halten, Plänkler: Nachsetzen): the role symbol shows a state; a tap explains the rule with a preview
    const passiveId = classOpts.length ? undefined : classActionId(data, u, s);
    const passive = passiveId && data.classes[u.classId]?.classAction?.kind === 'passive' ? passiveId : undefined;
    return (
      <Dock>
        <DockAction
          variant="primary"
          icon="attack"
          label={t('ui.action.attack')}
          sub={attackOpt ? t('ui.hud.targets', { n: attackOpt.targets?.length ?? 0 }) : undefined}
          dim={!attackOpt}
          onClick={attackOpt ? () => void doAction(attackOpt) : ask(t(placed ? 'ui.hud.noAttack' : 'ui.hud.pickTile'))}
        />
        <DockAction
          variant="class"
          icon={classOpts.length && classOpts[0]!.kind !== 'cast' ? classOpts[0]!.kind : roleIcon(data.classes[u.classId]!.role)}
          label={passive ? t(`ui.passive.${passive}.name`) : classOne ? t(`ui.action.${classOne.kind}`) : t('ui.hud.classSlot')}
          sub={passive ? t('ui.passive.ready') : undefined}
          state={passive ? 'ready' : undefined}
          dim={!classOpts.length && !passive}
          onClick={
            passive
              ? () => setMode({ k: 'passive', uid: u.uid, to: mode.k === 'moved' ? mode.to : u.pos! })
              : classOne
                ? () => void doAction(classOne)
                : classOpts.length
                  ? () => setClassPick(true)
                  : ask(castReason ?? t(placed ? 'ui.hud.noClass' : 'ui.hud.pickTile'))
          }
        />
        <DockAction
          icon="item"
          label={t('ui.action.item')}
          dim={!itemOpt}
          onClick={itemOpt ? () => void doAction(itemOpt) : ask(t(placed ? 'ui.hud.noItem' : 'ui.hud.pickTile'))}
        />
        <DockAction icon="wait" label={t('ui.action.wait')} dim={!waitOpt} onClick={waitOpt ? () => void doAction(waitOpt) : ask(t('ui.hud.pickTile'))} />
      </Dock>
    );
  };

  const idleDock = (
    <Dock three>
      <DockAction icon="danger" label={t('ui.danger')} on={danger} onClick={() => setDanger(!danger)} />
      <DockAction icon="next" label={t('ui.hud.nextUnit')} dim={!playerTurn || readyCount === 0} onClick={nextUnit} />
      <DockAction
        variant="primary"
        icon="end"
        label={confirmEnd ? t('ui.hud.endConfirm') : t('ui.endPhase')}
        sub={readyCount > 0 ? t('ui.hud.ready', { n: readyCount }) : undefined}
        dim={!playerTurn}
        onClick={endPhase}
      />
    </Dock>
  );

  /** a long press on a medallion of the enemy strip opens what a long press on the foe opens (story 13.8) */
  const foeInfo = (u: BattleUnit) => (longPressView(data, u) === 'wanted' ? setWanted(u.uid) : setInfo(u.uid));

  const card = selUnit && <UnitCardB data={data} state={s} u={selUnit} hp={hp[selUnit.uid] ?? selUnit.hp} onClick={() => setInfo(selUnit.uid)} />;
  const back = <BackPill onClick={() => cancelRef.current()} />;
  const tileUnit = tileInfo ? unitAt(s, tileInfo) : undefined;

  const sheet = otherPhase ? null : (
    <div class="hud-sheet">
      {reason && <HintPill reason>{reason}</HintPill>}
      {mode.k === 'idle' && (
        <>
          {recap && <RecapStone turn={recap.turn} rows={recap.rows} units={full.units} onShow={(at) => void boardRef.current?.centerOn(at)} onClose={() => setRecap(null)} />}
          {tileInfo &&
            (tileUnit ? (
              <UnitCardB data={data} state={s} u={tileUnit} hp={hp[tileUnit.uid] ?? tileUnit.hp} onClick={() => setInfo(tileUnit.uid)} />
            ) : (
              <TerrainCard data={data} s={s} p={tileInfo} />
            ))}
          {idleDock}
        </>
      )}
      {mode.k === 'selected' && selUnit && (
        <>
          <div class="hud-row">
            {back}
            <HintPill>{t('ui.hud.pickTile')}</HintPill>
          </div>
          {card}
          {dock(selUnit)}
        </>
      )}
      {mode.k === 'moved' && selUnit && (
        <>
          {back}
          <ContextBands entries={ctxEntries} index={ctxIdx} unitOf={(uid) => s.units.find((x) => x.uid === uid)} onIndex={setCtxIdx} onGo={(e) => void doAction(e.option)} />
          {card}
          {dock(selUnit)}
        </>
      )}
      {mode.k === 'target' && selUnit && (
        <>
          <div class="hud-row">
            {back}
            <HintPill>{t(`ui.pick.${mode.action}`)}</HintPill>
          </div>
          {card}
        </>
      )}
      {mode.k === 'pursue' && selUnit && (
        <>
          <HintPill>
            <Icon name="blade" size={16} /> {t('ui.pursue.hint', { n: s.pursue?.left ?? 0 })}
          </HintPill>
          {card}
          <div class="hud-confirm">
            <SecondaryButton onClick={finishPursue}>{t('ui.pursue.done')}</SecondaryButton>
            <PrimaryButton disabled={!mode.to} onClick={() => void confirmPursue()}>
              {t('ui.pursue.go')}
            </PrimaryButton>
          </div>
        </>
      )}
      {mode.k === 'passive' && selUnit && passivePre && (
        <>
          <PassiveRuleCard p={passivePre} />
          <div class="hud-confirm">
            <SecondaryButton onClick={() => cancelRef.current()}>{t('ui.back')}</SecondaryButton>
            <PrimaryButton onClick={() => cancelRef.current()}>{t('ui.passive.ok')}</PrimaryButton>
          </div>
        </>
      )}
      {mode.k === 'cast' && selUnit && (
        <>
          {!castPre && (
            <div class="hud-row">
              {back}
              <HintPill>{t('ui.pick.cast')}</HintPill>
            </div>
          )}
          {castPre ? <ClassPreviewCard data={data} state={s} p={castPre} caster={selUnit} /> : card}
          {castPre && (
            <div class="hud-confirm">
              <SecondaryButton onClick={() => cancelRef.current()}>{t('ui.cancel')}</SecondaryButton>
              <PrimaryButton onClick={() => void confirmCast()}>{t('ui.action.cast')}</PrimaryButton>
            </div>
          )}
        </>
      )}
      {mode.k === 'classPreview' && cls && (
        <>
          <ClassPreviewCard data={data} state={s} p={cls} />
          <div class="hud-confirm">
            <SecondaryButton onClick={() => cancelRef.current()}>{t('ui.cancel')}</SecondaryButton>
            <PrimaryButton onClick={() => void confirmClassAction()}>{t(`ui.action.${mode.action}`)}</PrimaryButton>
          </div>
        </>
      )}
      {mode.k === 'forecast' && fc && (
        <>
          <ForecastCard data={data} state={s} f={fc} aim={aimPre?.kind === 'aim' ? aimPre : undefined} />
          <div class={`hud-confirm ${weaponsForTarget.length > 1 ? 'has-swap' : ''}`}>
            <SecondaryButton onClick={() => cancelRef.current()}>{t('ui.cancel')}</SecondaryButton>
            {weaponsForTarget.length > 1 && (
              <SecondaryButton
                onClick={() => {
                  const i = weaponsForTarget.indexOf(mode.weapon ?? '');
                  setMode({ ...mode, weapon: weaponsForTarget[(i + 1) % weaponsForTarget.length] });
                }}
              >
                {t('ui.action.swapWeapon')}
              </SecondaryButton>
            )}
            <PrimaryButton onClick={() => void confirmAttack()}>
              {t('ui.action.confirmAttack')}
            </PrimaryButton>
          </div>
        </>
      )}
    </div>
  );

  const enemySpeed = settings.value.enemySpeed;
  const setEnemySpeed = (v: 1 | 2 | 3) => {
    updateSettings({ enemySpeed: v });
    const board = boardRef.current;
    if (board && otherPhase) {
      board.speed = v === 2 ? 2 : 1;
      board.skip = v === 3;
    }
  };

  return (
    <div class={`battle ${wide ? 'has-side' : ''} ${dialogue || levelUp ? 'in-scene' : ''}`}>
      {wide && (
        <div class="side side-left">
          <RosterPanel
            data={data}
            s={s}
            hp={hp}
            onPick={(u) => {
              if (selectable(u) && playerTurn) {
                leavePursue();
                setMode({ k: 'selected', uid: u.uid });
              }
              void boardRef.current?.centerOn(u.pos!);
            }}
          />
          {opt.enemyStrip && !otherPhase && <EnemyStrip data={data} s={s} hp={hp} side onCenter={(u) => void boardRef.current?.centerOn(u.pos!)} onInfo={foeInfo} />}
        </div>
      )}
      <div class="board-wrap">
        <div ref={stageRef} class="hc-stage-slot" />
        <div ref={floatRef} class="float-layer" />
        <div class="lg-pins">
          <div class="lg-pin" ref={chipRef} style={{ display: checkTile ? '' : 'none' }}>
            {checkTile && <TerrainChip data={data} s={s} p={checkTile} />}
          </div>
        </div>
        {dialogue?.band && <SceneBand id={dialogue.id} onDone={dialogue.done} />}
        {bark && <SceneBand id={bark.b.scene} key={bark.seq} only={[bark.b.line]} params={bark.b.params} speed={boardRef.current?.speed ?? 1} onDone={bark.done} />}
        <div class="hud-top" ref={topRef}>
          {otherPhase ? (
            <PhasePill turn={shownTurn} phase={shownPhase} />
          ) : (
            <>
              <div class="hud-topbar">
                <TurnPill turn={shownTurn} phase={shownPhase} goal={goalText} progress={goalProgress} onClick={() => setObjectives(true)} />
                <MenuStone onClick={() => setMenu(true)} />
              </div>
              <GoalPills
                data={data}
                s={s}
                side={map.objectives.side}
                marked={markedGoal.value}
                onMark={(o) => toggleGoalMark(o.id, data.render.board.markMs)}
                onClick={() => setObjectives(true)}
              />
              {checkTile && <ThreatPill n={checkFoes.length} />}
              {opt.enemyStrip && !wide && <EnemyStrip data={data} s={s} hp={hp} onCenter={(u) => void boardRef.current?.centerOn(u.pos!)} onInfo={foeInfo} />}
            </>
          )}
        </div>
        {!wide && (
          <div class="hud-bottom" ref={bottomRef}>
            {sheet}
          </div>
        )}
        {otherPhase && <SpeedControl value={enemySpeed} onChange={setEnemySpeed} />}
        {loading && (
          <div class="ld-cover">
            <Piece class="ld-stone" role="status" aria-live="polite">
              <b class="ld-stone__title">{t('ui.loading.board')}</b>
              <span class="ld-stone__sub">{t('ui.loading.boardSub')}</span>
              <div class="ld-bar ld-bar--busy" role="progressbar" aria-label={t('ui.loading.board')}>
                <i />
              </div>
            </Piece>
          </div>
        )}
        {cutIn && <CutIn cut={cutIn} onDone={() => setCutIn((c) => (c?.seq === cutIn.seq ? null : c))} />}
        {banner && <div class={`banner ${banner.cls}`}>{banner.text}</div>}
        {toast && <Toast text={toast.text} lead={toast.item && <ItemImage data={data} item={toast.item} size={32} />} onDone={() => setToastState(null)} />}
      </div>
      {wide && <div class="side">{sheet}</div>}

      {classPick && (
        <ClassPick
          options={classOpts}
          onClose={() => setClassPick(false)}
          onPick={(o) => {
            setClassPick(false);
            void doAction(o);
          }}
        />
      )}
      {infoUnit && <UnitInfo u={infoUnit} s={s} onClose={() => setInfo(null)} onEquip={(item, slot) => void run({ type: 'equip', unit: infoUnit.uid, item, slot })} canEdit={playerTurn && infoUnit.team === 'player' && !infoUnit.acted} />}
      {wantedUnit && wantedPoster && <WantedDock v={wantedPoster} onClose={() => setWanted(null)} />}
      {objectives && <ObjectivesPanel s={s} onClose={() => setObjectives(false)} />}
      {menu && (
        <BattleMenu
          onClose={() => setMenu(false)}
          onOptions={() => {
            setMenu(false);
            screen.value = { name: 'options', back: { name: 'battle' } };
          }}
          onHandbook={() => {
            setMenu(false);
            openHandbook();
          }}
          onRestartRound={
            canRestart('turn')
              ? () => {
                  setMenu(false);
                  restartBattle('turn');
                  remount();
                }
              : undefined
          }
          onRestartMission={
            canRestart('mission')
              ? () => {
                  setMenu(false);
                  restartBattle('mission');
                  remount();
                }
              : undefined
          }
          onLeaveMission={
            canAbandon()
              ? () => {
                  setMenu(false);
                  abandonBattle();
                }
              : undefined
          }
          onTitle={() => (screen.value = { name: 'title' })}
        />
      )}
      {items && <ItemPick u={unit(items.uid)} list={items.list} onPick={useItem} onClose={() => setItems(null)} />}
      {mode.k === 'steal' && classPre?.kind === 'steal' && (
        <StealPick
          p={classPre}
          victim={unit(mode.target)}
          onPick={(item) => void run({ type: 'act', unit: mode.uid, to: mode.to, action: { kind: 'steal', target: mode.target, item } })}
          onClose={() => cancelRef.current()}
        />
      )}
      {trade && <TradeSheet s={s} a={trade.a} b={trade.b} onClose={() => setTrade(null)} onCommit={(cmd) => { setTrade(null); void run(cmd); }} />}
      {convoy && <ConvoySheet s={s} uid={convoy} onClose={() => setConvoy(null)} onCommit={(cmd) => { setConvoy(null); void run(cmd); }} />}
      {levelUp && <LevelUpPopup u={unit(levelUp.uid)} gains={levelUp.gains} level={levelUp.level} onDone={levelUp.done} />}
      {dialogue && !dialogue.band && (
        <Scene id={dialogue.id} overlay onDone={dialogue.done} />
      )}
    </div>
  );
}

/** Re-mounts the battle screen after a restart (fresh board). */
function remount(): void {
  screen.value = { name: 'camp' };
  queueMicrotask(() => (screen.value = { name: 'battle' }));
}

export { weaponRange };
