/**
 * The academy (story 10.2, UX-DR21): promote a companion of level 10 or more to a pro path for an ember spark; at level 2
 * change the path for gold, at level 3 learn the other path as well. Choosing the figure and the path is a selection,
 * only the main button acts (one campaign command each). Gains come from `promotionPreview`, the function `promote` uses.
 */
import { useState } from 'preact/hooks';
import {
  academyLevel,
  changePathError,
  lineKey,
  otherProPath,
  promoteBlock,
  promoteError,
  promotionPreview,
  promotionTargets,
  proPathPreview,
  secondPathError,
  sparkCount,
  STAT_KEYS,
  type RoomDef,
  type Stats,
  type UnitRecord,
} from '../../core';
import { t } from '../../i18n';
import { Toast, unitName } from '../../ui/components';
import { Amount, ItemImage, PrimaryButton, QuietButton, SecondaryButton } from '../../ui/pieces';
import { Sparks } from '../../ui/Sparks';
import { barkChar, barkScene, hasBark } from '../battle/barks';
import { screen } from '../state/screen';
import { campaign, data } from '../state/session';
import { RoomPanel, type Apply } from './Rooms';
import { UnitHead } from './unitArt';
import './Academy.css';

/** "TP +4 · DEF +3": the stat gain of a path, in the order of the stats. */
function gainText(gain: Partial<Stats>): string {
  const parts = STAT_KEYS.filter((k) => (gain[k] ?? 0) !== 0).map((k) => `${t(`ui.stat.${k}`)} ${gain[k]! > 0 ? '+' : ''}${gain[k]}`);
  return parts.length ? parts.join(' · ') : t('ui.academy.noGain');
}

/** A path card: name, effect in one sentence, gain, signature piece; tapping selects it. */
function PathCard({ classId, gain, selected, current, locked, onSelect }: { classId: string; gain: Partial<Stats>; selected: boolean; current?: boolean; locked?: boolean; onSelect?: () => void }) {
  return (
    <button type="button" class={`ac-path ${current ? 'is-current' : ''} ${locked ? 'is-locked' : ''}`} aria-pressed={selected} disabled={!onSelect} onClick={onSelect}>
      <b>{t(`class.${classId}.name`)}</b>
      {current && <small class="ac-path__tag">{t('ui.academy.current')}</small>}
      {locked && <small class="ac-path__tag">{t('ui.academy.comingSoon')}</small>}
      <span>{t(`class.${classId}.effect`)}</span>
      <span class="hm-stat-line">{gainText(gain)}</span>
      <small>{t('ui.academy.part', { name: t(`part.${classId}.name`) })}</small>
    </button>
  );
}

/** Why a figure is dimmed in the list, or null when it can be chosen (a pro can be chosen for a change or the second path). */
function dimReason(u: UnitRecord, level: number): string | null {
  const block = promoteBlock(data, u);
  if (block === 'level') return t('ui.academy.fromLevel', { n: data.balance.levels.promoteFrom });
  if (block === 'pro') {
    const isPro = data.classes[u.classId]?.tier === 'pro';
    if (isPro && otherProPath(data, u.classId) && level >= data.balance.academy.changePathFromLevel) return null;
    // a role whose pro paths are not in the content yet (stories 10.3–10.5)
    return isPro ? t('ui.academy.promoted') : t('ui.academy.noPath');
  }
  return null;
}

export function AcademyRoom({ room, apply, onClose, unit: initial }: { room: RoomDef; apply: Apply; onClose: () => void; unit?: string }) {
  const c = campaign.value!;
  const level = academyLevel(data, c);
  const sparks = sparkCount(data, c);
  const [sel, setSel] = useState<string | null>(initial ?? null);
  const [path, setPath] = useState<string | null>(null);
  const [moment, setMoment] = useState(0);
  const [ember, setEmber] = useState<{ text: string; portrait?: string; name: string } | null>(null);
  const units = [...c.roster].sort((a, b) => Number(dimReason(a, level) !== null) - Number(dimReason(b, level) !== null) || b.level - a.level);
  const u = sel ? c.roster.find((r) => r.id === sel) : undefined;
  const isPro = !!u && data.classes[u.classId]?.tier === 'pro';
  const targets = u && !isPro ? promotionTargets(data, u.classId) : [];
  const chosen = path && targets.includes(path) ? path : targets.length === 1 ? targets[0]! : null;
  const other = u && isPro ? otherProPath(data, u.classId) : null;
  const cfg = data.balance.academy;

  const celebrate = (x: UnitRecord) => {
    setMoment((n) => n + 1);
    if (hasBark(data, barkChar(x), 'ember')) setEmber({ text: lineKey(barkScene(barkChar(x)), 'ember'), portrait: x.portrait, name: unitName(x) });
  };
  const promote = () => {
    if (!u || !chosen) return;
    const name = unitName(u);
    if (apply({ type: 'promote', unit: u.id, classId: chosen }, t('ui.academy.done', { name, cls: t(`class.${chosen}.name`) }))) {
      setPath(null);
      celebrate(u);
    }
  };
  const promoteErr = u && chosen ? promoteError(data, c, u.id, chosen) : null;

  return (
    <RoomPanel
      room={room}
      onClose={onClose}
      actions={
        u && !isPro ? (
          <PrimaryButton disabled={!chosen || !!promoteErr} onClick={promote}>
            {t('ui.academy.promote')} · <Amount resource="emberSpark" value={1} short={sparks < 1} />
          </PrimaryButton>
        ) : undefined
      }
    >
      <div class="ac">
        {moment > 0 && <Sparks key={moment} />}
        <div class="ac-stock">
          <ItemImage data={data} item="ember_spark" size={36} />
          <span>{t('ui.academy.sparks')}</span>
          <b>{sparks}</b>
        </div>
        <div class="hm-subhead">{t('ui.academy.pick')}</div>
        <div class="ac-units" role="group" aria-label={t('ui.academy.pick')}>
          {units.map((x) => {
            const why = dimReason(x, level);
            return (
              <button
                key={x.id}
                type="button"
                class={`ac-unit ${why ? 'is-dim' : ''}`}
                aria-pressed={sel === x.id}
                disabled={!!why}
                onClick={() => {
                  setSel(sel === x.id ? null : x.id);
                  setPath(null);
                }}
              >
                <UnitHead portrait={x.portrait} classId={x.classId} name={unitName(x)} size={36} />
                <span class="ac-unit__name">
                  <b>{unitName(x)}</b>
                  <small>
                    {t(`class.${x.classId}.name`)} · {t('ui.lv')} {x.level}
                  </small>
                </span>
                {why && <small class="ac-unit__why">{why}</small>}
              </button>
            );
          })}
        </div>
        {u && !isPro && (
          <>
            <div class="hm-subhead">{t('ui.academy.paths')}</div>
            <div class="ac-paths">
              {targets.map((id) => (
                <PathCard key={id} classId={id} gain={promotionPreview(data, u, id)} selected={chosen === id} onSelect={targets.length > 1 ? () => setPath(id) : undefined} />
              ))}
              {/* paths of the role that are in the content but not playable yet (stories 10.4, 10.5): shown locked */}
              {(data.classes[u.classId]?.proPaths ?? [])
                .filter((id) => data.classes[id] && !targets.includes(id))
                .map((id) => (
                  <PathCard key={id} classId={id} gain={promotionPreview(data, u, id)} selected={false} locked />
                ))}
            </div>
            {sparks < 1 ? <p class="hm-hint">{t('ui.academy.noSpark')}</p> : !chosen && <p class="hm-hint">{t('ui.academy.pickPath')}</p>}
          </>
        )}
        {u && isPro && (
          <>
            <div class="hm-subhead">{t('ui.academy.paths')}</div>
            <div class="ac-paths">
              <PathCard classId={u.classId} gain={u.promotionGain ?? {}} selected={false} current />
              {other && <PathCard classId={other} gain={proPathPreview(data, u, other).gain} selected={false} />}
            </div>
            {other && (
              <div class="hc-btns">
                {level < cfg.changePathFromLevel ? (
                  <p class="hm-hint">{t('ui.academy.changeFrom', { n: cfg.changePathFromLevel })}</p>
                ) : (
                  !u.secondPath && (
                    <SecondaryButton disabled={!!changePathError(data, c, u.id, other)} onClick={() => apply({ type: 'changeProPath', unit: u.id, classId: other }, t('ui.academy.changed'))}>
                      {t('ui.academy.change')} · <Amount resource="gold" value={cfg.changePathGold} short={c.gold < cfg.changePathGold} />
                    </SecondaryButton>
                  )
                )}
                {u.secondPath ? (
                  <p class="hm-hint">{t('ui.academy.secondDone')}</p>
                ) : level < cfg.secondPathFromLevel ? (
                  <p class="hm-hint">{t('ui.academy.secondFrom', { n: cfg.secondPathFromLevel })}</p>
                ) : (
                  <SecondaryButton
                    disabled={!!secondPathError(data, c, u.id)}
                    onClick={() => {
                      if (apply({ type: 'learnSecondPath', unit: u.id }, t('ui.academy.learned'))) celebrate(u);
                    }}
                  >
                    {t('ui.academy.second')} · <Amount resource="emberSpark" value={cfg.secondPathSparks} short={sparks < cfg.secondPathSparks} />
                  </SecondaryButton>
                )}
              </div>
            )}
          </>
        )}
        {u && (
          <QuietButton onClick={() => (screen.value = { name: 'troop', unit: u.id, from: 'camp' })}>{t('ui.academy.skills')}</QuietButton>
        )}
      </div>
      {ember && <Toast text={t('ui.farewell.quote', { text: t(ember.text) })} lead={<UnitHead portrait={ember.portrait} name={ember.name} size={32} />} onDone={() => setEmber(null)} />}
    </RoomPanel>
  );
}
