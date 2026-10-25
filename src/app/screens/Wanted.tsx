/**
 * Wanted posters (story 3.6, DESIGN.md "Steckbrief", mockup 02-kampf.html): the profile of one lieutenant as a stone,
 * the list of the lieutenants the company has met, and the dock that shows a profile over the board in a battle.
 * What to show comes from the core (`wantedView`, `wantedList`); this file only lays it out.
 */
import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { itemDef, wantedList, type WantedTarget, type WantedView } from '../../core';
import { t } from '../../i18n';
import { asset } from '../../ui/asset';
import { unitName } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { Amount, Backdrop, Piece, ScreenHead, SecondaryButton } from '../../ui/pieces';
import { screen, type From } from '../state/screen';
import { campaign, data } from '../state/session';
import { artId } from './unitArt';
import './wanted.css';

/** Round face: the portrait, then the picture of the class (a lieutenant without an own picture), then the first letter. */
function Face({ portrait, classId, name }: { portrait?: string; classId?: string; name: string }) {
  const classArt = classId ? `class_${data.classes[classId]?.art ?? classId}` : undefined;
  const ids = [artId(portrait), classArt].filter((x): x is string => !!x);
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [portrait, classId]);
  const id = ids[i];
  if (!id) return <span class="wt-face wt-face--initial">{name.slice(0, 1)}</span>;
  return <img class="wt-face" src={asset(`avatars/${id}.webp`)} alt="" draggable={false} onError={() => setI(i + 1)} />;
}

/** Golden ring medallion; the level pill only when the lieutenant stands on a board. */
function Medal({ v, size }: { v: WantedView; size: number }) {
  return (
    <span class="wt-medal" style={{ '--wt-size': `${size}px` }}>
      <span class="wt-medal__face">
        <Face portrait={v.portrait} classId={v.classId} name={t(v.nameKey)} />
      </span>
      {v.level !== undefined && (
        <span class="wt-medal__lv">
          {t('ui.lv')} {v.level}
        </span>
      )}
    </span>
  );
}

/** Grudge as gold dots, filled up to the level (the shape and the label carry it, not the colour). */
function Notches({ value }: { value: number }) {
  const label = value > 0 ? t('ui.wanted.grudge', { n: value }) : t('ui.wanted.grudgeNone');
  return (
    <span class="wt-notches" role="img" aria-label={label} title={label}>
      {[1, 2, 3].map((n) => (
        <i key={n} class={n <= value ? 'is-on' : ''} />
      ))}
    </span>
  );
}

type Named = Exclude<WantedTarget, { kind: 'none' }>;
const targetName = (tg: Named) => unitName(tg);

function TargetLine({ v }: { v: WantedView }) {
  const tg = v.target;
  if (tg.kind === 'none') {
    return (
      <div class="wt-target is-none">
        <span>{t('ui.wanted.target.none')}</span>
      </div>
    );
  }
  return (
    <div class={`wt-target is-${tg.kind}`}>
      <span class="wt-target__mini">
        <Face portrait={tg.portrait} classId={tg.classId} name={targetName(tg)} />
      </span>
      <span>
        {t('ui.wanted.target.pre')} <b>{targetName(tg)}</b> · {t(`ui.wanted.target.${tg.kind}`)}
      </span>
    </div>
  );
}

/** The profile stone; `children` come last (the Back button in the dock). */
export function WantedCard({ v, children }: { v: WantedView; children?: ComponentChildren }) {
  const mat = v.material ? itemDef(data, v.material.id) : null;
  return (
    <Piece class="wt-card">
      <div class="wt-head">
        <Medal v={v} size={84} />
        <div class="wt-head__text">
          <div class="wt-tag">
            {t('ui.wanted.lieutenant')} · {t(`class.${v.classId}.name`)}
            <Notches value={v.grudge} />
          </div>
          <h2 class="wt-name">{t(v.nameKey)}</h2>
          <div class="wt-title">{t(v.titleKey)}</div>
        </div>
      </div>
      <TargetLine v={v} />
      <dl class="wt-facts">
        <dt>{t('ui.wanted.fact.rule')}</dt>
        <dd>{t(v.fleeRuleKey)}</dd>
        <dt>{t('ui.wanted.fact.bounty')}</dt>
        <dd class="wt-facts__pay">
          <Amount resource="gold" value={v.bounty} />
          {mat && v.material && <Amount material={mat} value={v.material.min} max={v.material.max} />}
        </dd>
        <dt>{t('ui.wanted.fact.met')}</dt>
        <dd>{v.encounters > 0 ? t('ui.wanted.met', { n: v.encounters, routs: v.routs }) : t('ui.wanted.metNever')}</dd>
      </dl>
      <ul class="wt-skills" aria-label={t('ui.wanted.skills')}>
        {v.skills.map((s) => (
          <li key={s.id} class={`wt-skill ${s.free ? '' : 'is-locked'}`}>
            {s.free ? t(`skill.${s.id}.name`) : t('ui.wanted.skillLocked', { n: s.grudge, name: t(`skill.${s.id}.name`) })}
          </li>
        ))}
      </ul>
      {children}
    </Piece>
  );
}

/**
 * The profile over the board (long press on a lieutenant in a battle): no veil, so his danger zone stays readable.
 * Closes with Back, a tap beside the stone or Escape.
 */
export function WantedDock({ v, onClose }: { v: WantedView; onClose: () => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <div class="wt-dock" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="wt-dock__col" role="dialog" aria-label={t(v.nameKey)}>
        <WantedCard v={v}>
          <SecondaryButton class="wt-back" onClick={onClose}>
            <Icon name="back" size={18} /> {t('ui.back')}
          </SecondaryButton>
        </WantedCard>
      </div>
    </div>
  );
}

/** The list of the lieutenants met; a tap opens the profile, Back leads to the list and from there to where it was opened. */
export function Wanted({ unit, from = 'worldmap' }: { unit?: string; from?: From }) {
  const c = campaign.value!;
  const list = wantedList(data, c);
  const open = unit ? list.find((v) => v.id === unit) : undefined;
  return (
    <div class="hc-view">
      <Backdrop />
      <ScreenHead
        title={t('ui.wanted.title')}
        aside={t('ui.wanted.known', { n: list.length })}
        onBack={() => (screen.value = open ? { name: 'wanted', from } : { name: from })}
      />
      {open ? (
        <div class="hc-view__scroll">
          <WantedCard v={open} />
        </div>
      ) : (
        <Piece class="hc-view__scroll wt-list">
          {list.length === 0 && <p class="wt-empty">{t('ui.wanted.empty')}</p>}
          {list.map((v) => (
            <button key={v.id} type="button" class="wt-row" aria-label={t('ui.wanted.open', { name: t(v.nameKey) })} onClick={() => (screen.value = { name: 'wanted', unit: v.id, from })}>
              <Medal v={v} size={56} />
              <span class="wt-row__text">
                <b class="wt-name">{t(v.nameKey)}</b>
                <span class="wt-title">{t(v.titleKey)}</span>
                {v.target.kind !== 'none' && (
                  <span class="wt-row__target">
                    {t('ui.wanted.target.pre')} {targetName(v.target)} · {t(`ui.wanted.target.${v.target.kind}`)}
                  </span>
                )}
              </span>
              <Notches value={v.grudge} />
            </button>
          ))}
        </Piece>
      )}
    </div>
  );
}
