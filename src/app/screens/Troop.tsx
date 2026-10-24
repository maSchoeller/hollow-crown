/** Troop (medallion grid) and figure view (concept/25-ux/EXPERIENCE.md "Truppe", mockup 06). */
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  availableSupportTalks,
  canPromote,
  computeStats,
  EQUIP_SLOTS,
  expProgress,
  isMercenary,
  itemDef,
  loadoutSlots,
  promotionTargets,
  ROLE_GROUPS,
  supportTalksOf,
  type CampaignCommand,
  type EquipSlot,
  type RoleGroup,
  type UnitRecord,
} from '../../core';
import { activeSkillIds } from '../../core/rules/skills';
import { t } from '../../i18n';
import { Toast, unitName } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { Amount, Backdrop, ItemImage, Piece, PrimaryButton, ScreenHead, SecondaryButton, Tabs } from '../../ui/pieces';
import { audio } from '../audio';
import { campaign, campaignCommand, data } from '../state/session';
import { screen, type From } from '../state/screen';
import { EquipView } from './Equip';
import { UnitBust, UnitHead } from './unitArt';
import '../../ui/troop.css';

type Filter = 'all' | RoleGroup;

const ROLE_ICON: Record<RoleGroup, string> = { melee: 'blade', ranged: 'bow', support: 'healer' };
const roleOf = (u: UnitRecord): RoleGroup => data.classes[u.classId]?.roleGroup ?? 'melee';

/** The troop: every companion and mercenary (the fallen rest in the hall of memory, not here). */
export function Troop({ from = 'worldmap' }: { from?: From }) {
  const c = campaign.value!;
  const sc = screen.value;
  const [filter, setFilter] = useState<Filter>('all');
  const [sel, setSel] = useState<string | null>(sc.name === 'troop' ? (sc.unit ?? null) : null);
  useEffect(() => audio.music('camp'), []);
  const back = () => (screen.value = { name: from });
  const shown = c.roster.filter((u) => filter === 'all' || roleOf(u) === filter);
  const unit = sel ? c.roster.find((u) => u.id === sel) : undefined;
  if (unit) return <FigureFlow unit={unit} units={shown.some((u) => u.id === unit.id) ? shown.map((u) => u.id) : c.roster.map((u) => u.id)} onSelect={setSel} onBack={() => setSel(null)} />;
  const mercs = c.roster.filter(isMercenary).length;
  return (
    <div class="hc-view">
      <Backdrop />
      <div class="col" style={{ gap: 8 }}>
        <ScreenHead title={t('ui.troop.title')} aside={t('ui.troop.count', { n: c.roster.length - mercs, m: mercs })} onBack={back} />
        <Tabs
          value={filter}
          label={t('ui.troop.filter')}
          onChange={setFilter}
          options={[{ id: 'all', label: t('ui.troop.filter.all') }, ...ROLE_GROUPS.map((g) => ({ id: g, label: t(`ui.troop.filter.${g}`) }))]}
        />
      </div>
      <Piece class="hc-view__scroll">
        <div class="trp-grid">
          {shown.map((u) => (
            <Mate key={u.id} unit={u} onOpen={() => setSel(u.id)} />
          ))}
          {shown.length === 0 && <div class="trp-empty">{t('ui.troop.empty')}</div>}
        </div>
      </Piece>
      <Piece class="trp-legend">
        <span>
          <span class="trp-flag trp-flag--promote">✦</span>
          {t('ui.troop.legend.promote')}
        </span>
        <span>
          <span class="trp-flag trp-flag--talk">2</span>
          {t('ui.troop.legend.talk')}
        </span>
        <span>
          <span class="trp-flag trp-flag--scar">!</span>
          {t('ui.troop.legend.scar')}
        </span>
      </Piece>
    </div>
  );
}

function Mate({ unit, onOpen }: { unit: UnitRecord; onOpen: () => void }) {
  const c = campaign.value!;
  const talks = supportTalksOf(data, c, unit.id);
  const promote = canPromote(data, unit);
  return (
    <button type="button" class="trp-mate" onClick={onOpen} aria-label={t('ui.troop.open', { name: unitName(unit) })}>
      {(promote || talks > 0 || unit.scars.length > 0) && (
        <span class="trp-flags">
          {promote && (
            <span class="trp-flag trp-flag--promote" title={t('ui.troop.legend.promote')}>
              ✦
            </span>
          )}
          {talks > 0 && (
            <span class="trp-flag trp-flag--talk" title={t('ui.troop.legend.talk')}>
              {talks}
            </span>
          )}
          {unit.scars.length > 0 && (
            <span class="trp-flag trp-flag--scar" title={t('ui.troop.legend.scar')}>
              !
            </span>
          )}
        </span>
      )}
      <UnitHead portrait={unit.portrait} classId={unit.classId} name={unitName(unit)} size={70} />
      <b>{unitName(unit)}</b>
      <small>
        {t(`class.${unit.classId}.name`)} · {unit.level}
      </small>
    </button>
  );
}

/** The figure view with its equip list: a tap on a place opens the list for it (not in `readOnly`). */
export function FigureFlow({ unit, units, onSelect, onBack, readOnly }: { unit: UnitRecord; units: string[]; onSelect: (id: string) => void; onBack: () => void; readOnly?: boolean }) {
  const [eq, setEq] = useState<{ slot: EquipSlot | 'bag'; index: number; key: string } | null>(null);
  if (eq && !readOnly) return <EquipView unit={unit} slot={eq.slot} index={eq.index} onBack={() => setEq(null)} />;
  return <Figure unit={unit} units={units} onSelect={onSelect} onBack={onBack} readOnly={readOnly} onSlot={(slot, index) => setEq({ slot, index, key: slot === 'bag' ? `bag${index}` : slot })} />;
}

const SWIPE_PX = 56;

/**
 * Figure view: half figure, role, level, EXP, ten values, the equipment places, load and mastery. Swiping (or the
 * arrows) moves to the next figure of `units`; `readOnly` shows the same without changing anything (battle).
 */
export function Figure({
  unit,
  units,
  onSelect,
  onBack,
  readOnly,
  onSlot,
  selectedSlot,
}: {
  unit: UnitRecord;
  units: string[];
  onSelect: (id: string) => void;
  onBack: () => void;
  readOnly?: boolean;
  /** an equipment place was tapped (the equip list opens); without it the places are not tappable */
  onSlot?: (slot: EquipSlot | 'bag', index: number) => void;
  selectedSlot?: string | null;
}) {
  const c = campaign.value!;
  const [toast, setToast] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const pos = units.indexOf(unit.id);
  const step = (d: number) => {
    if (units.length < 2) return;
    onSelect(units[(pos + d + units.length) % units.length]!);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const st = computeStats(data, unit);
  const exp = expProgress(data, unit);
  const promotable = canPromote(data, unit);
  const apply = (cmd: CampaignCommand) => {
    const r = campaignCommand(cmd);
    if (r.ok) audio.sfx('confirm');
    else {
      audio.sfx('error');
      setToast(t(`ui.camp.err.${r.error}`));
    }
    return r.ok;
  };
  const name = unitName(unit);
  const group = roleOf(unit);
  const loadCap = Math.max(1, st.carry);
  const slots: Array<{ key: string; slot: EquipSlot | 'bag'; index: number; label: string; item?: (typeof unit.bag)[number] }> = [
    ...EQUIP_SLOTS.map((s, i) => ({ key: s, slot: s as EquipSlot | 'bag', index: i, label: t(`ui.slot.${s}`), item: unit.equip[s] })),
    ...Array.from({ length: data.balance.bag.size }, (_, i) => ({ key: `bag${i}`, slot: 'bag' as const, index: i, label: t('ui.slot.bag'), item: unit.bag[i] })),
  ];
  const statCells: Array<[string, number]> = [
    ['hp', st.maxHp],
    ['str', st.stats.str],
    ['mag', st.stats.mag],
    ['skl', st.stats.skl],
    ['spd', st.stats.spd],
    ['lck', st.stats.lck],
    ['def', st.stats.def],
    ['res', st.stats.res],
    ['mov', st.mov],
    ['carry', st.carry],
  ];
  const sp = Object.entries(unit.sp);
  return (
    <div class="hc-view">
      <Backdrop />
      <ScreenHead
        title={name}
        onBack={onBack}
        aside={
          units.length > 1 ? (
            <span class="row" style={{ gap: 4 }}>
              <button type="button" class="hc-head__back" style={{ width: 32, height: 32, boxShadow: 'none' }} onClick={() => step(-1)} aria-label={t('ui.figure.prev')}>
                <Icon name="back" size={16} />
              </button>
              {pos + 1} / {units.length}
              <button type="button" class="hc-head__back" style={{ width: 32, height: 32, boxShadow: 'none' }} onClick={() => step(1)} aria-label={t('ui.figure.next')}>
                <Icon name="forward" size={16} />
              </button>
            </span>
          ) : undefined
        }
      />
      <Piece
        class="trp-fig hc-view__scroll"
        onPointerDown={(e: PointerEvent) => (start.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={(e: PointerEvent) => {
          const s = start.current;
          start.current = null;
          if (s && Math.abs(e.clientX - s.x) > SWIPE_PX && Math.abs(e.clientY - s.y) < 40) step(e.clientX < s.x ? 1 : -1);
        }}
        onPointerCancel={() => (start.current = null)}
      >
        <div class="trp-fig__top">
          <UnitBust portrait={unit.portrait} classId={unit.classId} name={name} />
          <div>
            <h2 class="trp-fig__name">{name}</h2>
            <span class="trp-role">
              <Icon name={ROLE_ICON[group]} size={15} />
              {t(`class.${unit.classId}.name`)} · {t('ui.lv')} {unit.level}
            </span>
            <div class="trp-exp">
              <div class="trp-exp__row">
                <span>{exp.full ? t('ui.figure.maxLevel') : promotable ? t('ui.figure.promoteReady') : t('ui.figure.exp')}</span>
                {!exp.full && (
                  <span>
                    <Amount resource="exp" value={exp.exp} /> / {exp.need}
                  </span>
                )}
              </div>
              <div class="trp-bar" role="progressbar" aria-valuemin={0} aria-valuemax={exp.need} aria-valuenow={exp.exp}>
                <i style={{ width: `${exp.full ? 100 : Math.min(100, (exp.exp / exp.need) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
        <div class="trp-stats">
          {statCells.map(([k, v]) => (
            <div key={k} class="trp-stat">
              <small>{t(`ui.stat.${k}`)}</small>
              <span>{v}</span>
            </div>
          ))}
        </div>
        <div class="trp-slots">
          {slots.map((s) => (
            <button
              key={s.key}
              type="button"
              class={`trp-slot ${selectedSlot === s.key ? 'is-sel' : ''}`}
              disabled={!onSlot || readOnly}
              onClick={() => onSlot?.(s.slot, s.index)}
              aria-label={s.item ? `${s.label}: ${t(`item.${s.item.def}.name`)}` : `${s.label}: ${t('ui.figure.empty')}`}
            >
              {s.item ? <ItemImage data={data} item={s.item} size={52} /> : <span class="hc-item-image is-empty" style={{ '--hc-item-size': '52px' }} aria-hidden="true" />}
              {s.label}
            </button>
          ))}
        </div>
        <div class="trp-load">
          <span>{t('ui.stat.load')}</span>
          <div class={`trp-bar trp-bar--load ${st.overload > 0 ? 'is-over' : ''}`}>
            <i style={{ width: `${Math.min(100, (st.load / loadCap) * 100)}%` }} />
          </div>
          <span class={st.overload > 0 ? 'is-over' : ''}>
            {st.load} / {st.carry}
          </span>
        </div>
        {unit.scars.length > 0 && (
          <div class="trp-chips">
            {unit.scars.map((sc) => (
              <span key={sc} class="trp-scar">
                <Icon name="scar" size={13} />
                {t(`scar.${sc}`)}
              </span>
            ))}
          </div>
        )}
        {sp.map(([sk, points]) => {
          const cost = Object.values(data.items).find((d) => d.grantsSkill?.skill === sk)?.grantsSkill?.masteryCost ?? 0;
          const done = unit.mastered.includes(sk);
          return (
            <div key={sk} class="trp-skill">
              <b>{t(`skill.${sk}.name`)}</b>
              <div class="trp-bar trp-bar--skill">
                <i style={{ width: `${done || !cost ? 100 : Math.min(100, (points / cost) * 100)}%` }} />
              </div>
              <span>{done ? t('ui.mastered') : `${points} / ${cost} ${t('ui.sp')}`}</span>
            </div>
          );
        })}
        {unit.mastered.length > 0 && (
          <div class="trp-chips">
            <span>
              {t('ui.loadout')} {unit.loadout.length}/{loadoutSlots(data, unit)}
            </span>
            {unit.mastered.map((sk) => {
              const on = unit.loadout.includes(sk);
              return (
                <button
                  key={sk}
                  type="button"
                  class={`hc-tab ${on ? 'is-on' : ''}`}
                  disabled={readOnly}
                  onClick={() => apply({ type: 'setLoadout', unit: unit.id, skills: on ? unit.loadout.filter((x) => x !== sk) : [...unit.loadout, sk] })}
                >
                  {t(`skill.${sk}.name`)}
                </button>
              );
            })}
          </div>
        )}
        <span class="trp-chips" style={{ color: 'var(--hc-soft)' }}>
          {activeSkillIds(data, unit)
            .map((id) => t(`skill.${id}.name`))
            .join(' · ')}
        </span>
        {promoting && (
          <div class="trp-pick">
            {promotionTargets(data, unit.classId).map((cl) => (
              <SecondaryButton
                key={cl}
                onClick={() => {
                  setPromoting(false);
                  apply({ type: 'promote', unit: unit.id, classId: cl });
                }}
              >
                {t(`class.${cl}.name`)}
              </SecondaryButton>
            ))}
          </div>
        )}
      </Piece>
      {promotable && !readOnly && c.roster.some((u) => u.id === unit.id) && (
        <div class="hc-btns">
          <PrimaryButton onClick={() => setPromoting(!promoting)}>{t('ui.figure.promote')}</PrimaryButton>
        </div>
      )}
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

export { availableSupportTalks, itemDef };
