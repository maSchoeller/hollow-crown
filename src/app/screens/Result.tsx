/**
 * Mission result (concept/25-ux/mockups/08-ergebnis-abschied.html, story 6.6): the victory pill, spoils, bounty of driven-off
 * lieutenants, side objectives and EP per figure with the fallen grey; and the defeat screen with its restarts.
 * What to show comes from the core (`missionResultView`, `defeatSentence`); this file only lays it out.
 */
import { defeatSentence, farewellView, itemDef, missionResultView, type BattleResult, type MissionResultView, type Reward } from '../../core';
import { t } from '../../i18n';
import { itemName, rarityOf, unitName } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { Amount, Backdrop, ItemImage, Piece, PrimaryButton, QuietButton, SecondaryButton } from '../../ui/pieces';
import { battle, canRestart, restartBattle } from '../state/battle';
import { nodeDef } from '../state/flow';
import { campaign, data } from '../state/session';
import { screen } from '../state/screen';
import { UnitHead } from './unitArt';
import './Result.css';

/** Reward of a side objective: amounts as symbol + number, items by image and name. */
function RewardAmounts({ reward: r }: { reward: Reward }) {
  return (
    <span class="res-reward">
      {r.gold ? <Amount resource="gold" value={r.gold} signed /> : null}
      {Object.entries(r.material ?? {}).map(([m, n]) => (
        <Amount key={m} material={itemDef(data, m)} value={n} signed />
      ))}
      {r.item && (
        <span class="res-reward__item">
          <ItemImage data={data} item={r.item.def} size={28} />
          {t(`item.${r.item.def}.name`)}
        </span>
      )}
    </span>
  );
}

function Spoils({ v }: { v: MissionResultView }) {
  return (
    <section class="res-sec">
      <h3 class="res-sec__title">{t('ui.result.loot')}</h3>
      <div class="res-loot">
        <Amount resource="gold" value={v.gold} signed />
        {v.materials.map((m) => (
          <Amount key={m.id} material={itemDef(data, m.id)} value={m.count} signed />
        ))}
      </div>
      {v.items.map((i) => (
        <div key={i.uid} class="res-item">
          <ItemImage data={data} item={i} />
          <span class={`res-item__name r-${rarityOf(data, i)}`}>{itemName(data, i)}</span>
        </div>
      ))}
    </section>
  );
}

function Bounty({ v }: { v: MissionResultView }) {
  if (!v.bounty.length) return null;
  return (
    <section class="res-sec">
      <h3 class="res-sec__title">{t('ui.result.bounty')}</h3>
      {v.bounty.map((b) => (
        <div key={b.id} class="res-lt">
          <UnitHead portrait={b.portrait} name={unitName(b)} size={40} />
          <span class="res-lt__text">
            <b>{unitName(b)}</b>
            {t('ui.result.bountyLine', { grudge: b.grudge })}
          </span>
          <Amount resource="gold" value={b.gold} signed />
        </div>
      ))}
    </section>
  );
}

function Sides({ v }: { v: MissionResultView }) {
  if (!v.side.length) return null;
  return (
    <section class="res-sec">
      <h3 class="res-sec__title">{t('ui.result.objectives')}</h3>
      {v.side.map((s) => (
        <div key={s.id} class={`res-side ${s.done ? 'is-done' : 'is-open'}`}>
          <span class="res-side__mark" role="img" aria-label={t(s.done ? 'ui.result.sideDone' : 'ui.result.sideOpen')}>
            {s.done ? '✓' : '–'}
          </span>
          <span class="res-side__text">{t(`ui.side.${s.type}`, { turns: s.turns ?? 0 })}</span>
          {s.done && <RewardAmounts reward={s.reward} />}
        </div>
      ))}
    </section>
  );
}

function Company({ v }: { v: MissionResultView }) {
  return (
    <section class="res-sec">
      <h3 class="res-sec__title">{t('ui.result.company')}</h3>
      <div class="res-units">
        {v.figures.map((f) => (
          <div key={f.id} class={`res-unit ${f.fallen ? 'is-fallen' : ''}`} aria-label={f.fallen ? t('ui.result.fallen', { name: unitName(f) }) : undefined}>
            {f.leveledUp && (
              <span class="res-unit__lv" title={t('ui.result.levelUp')}>
                {t('ui.lv')} {f.levelAfter}
              </span>
            )}
            <UnitHead portrait={f.portrait} classId={f.classId} name={unitName(f)} size={48} />
            <span class="res-unit__name">{unitName(f)}</span>
            {f.fallen ? <span class="res-unit__tag">{t('ui.result.fallenTag')}</span> : <Amount resource="exp" value={f.exp} signed />}
            {f.capped && (
              <span class="res-unit__tag res-unit__tag--cap" title={t('ui.result.cappedHint')}>
                {t('ui.result.capped')}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Notes({ v }: { v: MissionResultView }) {
  const c = campaign.value!;
  const lines: Array<{ key: string; icon: string; cls: string; text: string }> = [
    ...v.recruited.map((id) => ({ key: `r${id}`, icon: 'star', cls: 'is-good', text: t('ui.result.recruited', { name: t(`unit.${id}.name`) }) })),
    ...v.granted.map((g) => ({
      key: `g${g.item.uid}`,
      icon: 'star',
      cls: 'is-good',
      text: t('ui.result.granted', { name: g.id === 'avatar' ? (c.avatar.name ?? '') : t(`unit.${g.id}.name`), item: itemName(data, g.item) }),
    })),
    ...v.scars.map((s) => ({ key: `s${s.id}`, icon: 'scar', cls: 'is-bad', text: `${t(`unit.${s.id}.name`)}: ${t(`scar.${s.scar}`)}` })),
    ...(v.supportsReady ? [{ key: 'sup', icon: 'campfire', cls: 'is-gold', text: t('ui.result.supports') }] : []),
  ];
  if (!lines.length) return null;
  return (
    <section class="res-sec">
      {lines.map((l) => (
        <div key={l.key} class={`res-note ${l.cls}`}>
          <Icon name={l.icon} size={18} />
          <span>{l.text}</span>
        </div>
      ))}
    </section>
  );
}

export function Result({ result }: { result: BattleResult }) {
  const v = missionResultView(result);
  // the fallen are not left behind: "continue" leads into their farewell first (story 6.7)
  const farewell = farewellView(data, result).length > 0;
  return (
    <div class="hc-view res-view">
      <Backdrop />
      <Piece class="res-pill res-pill--win">
        <b>{t('ui.result.victory')}</b>
        <span>{t('ui.result.mission', { name: t(nodeDef(v.nodeId).titleKey), turns: t('ui.result.turns', { count: v.turns }) })}</span>
      </Piece>
      <Piece class="hc-view__fill res-body">
        <Spoils v={v} />
        <Bounty v={v} />
        <Sides v={v} />
        <Company v={v} />
        <Notes v={v} />
      </Piece>
      <PrimaryButton onClick={() => (screen.value = farewell ? { name: 'farewell', result, index: 0 } : { name: 'worldmap' })}>
        {t(farewell ? 'ui.result.toFarewell' : 'ui.result.continue')}
      </PrimaryButton>
    </div>
  );
}

/** Defeat: one sentence on why, then the restarts the death mode allows (story 1.5). */
export function Defeat() {
  const b = battle.value;
  const why = b ? defeatSentence(data, b.state) : ({ kind: 'generic' } as const);
  const text =
    why.kind === 'turns'
      ? t('ui.defeat.reason.turns', { turns: why.turns })
      : why.kind === 'unit'
        ? t('ui.defeat.reason.unit', { name: unitName(why) })
        : t('ui.defeat.reason.generic');
  const turn = !!b && canRestart('turn');
  const mission = !!b && canRestart('mission');
  const MissionButton = turn ? SecondaryButton : PrimaryButton;
  return (
    <div class="hc-view res-view res-view--defeat">
      <Backdrop image="backgrounds/bg_varnhold_burning" />
      <Piece class="res-pill res-pill--lost">
        <b>{t('ui.defeat.title')}</b>
      </Piece>
      <Piece class="res-why">
        <p class="res-why__reason">{text}</p>
        <p class="res-why__hint">{t('ui.defeat.text')}</p>
      </Piece>
      <div class="res-actions">
        {turn && <PrimaryButton onClick={() => restartBattle('turn')}>{t('ui.battle.restartRound')}</PrimaryButton>}
        {mission && (
          <MissionButton onClick={() => restartBattle('mission')}>
            <Icon name="restart" />
            {t('ui.battle.restartMission')}
          </MissionButton>
        )}
        <QuietButton onClick={() => (screen.value = { name: 'title' })}>
          <Icon name="home" />
          {t('ui.battle.toTitle')}
        </QuietButton>
      </div>
    </div>
  );
}
