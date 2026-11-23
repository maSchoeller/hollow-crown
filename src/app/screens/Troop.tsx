/** Troop (medallion grid) and the figure sheet's flow (concept/25-ux/EXPERIENCE.md "Truppe", mockup 06; the sheet itself is `Doll.tsx`). */
import { useEffect, useState } from 'preact/hooks';
import { availableSupportTalks, canPromote, isMercenary, itemDef, ROLE_GROUPS, supportTalksOf, type EquipSlot, type RoleGroup, type UnitRecord } from '../../core';
import { t } from '../../i18n';
import { unitName } from '../../ui/components';
import { Backdrop, Piece, ScreenHead, Tabs } from '../../ui/pieces';
import { audio } from '../audio';
import { campaign, data } from '../state/session';
import { homeBackdrop } from '../campaignInfo';
import { screen, type From } from '../state/screen';
import { Doll } from './Doll';
import type { DollPick } from './dollViewModel';
import { EquipView } from './Equip';
import { UnitHead } from './unitArt';
import '../../ui/troop.css';

type Filter = 'all' | RoleGroup;

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
  if (unit) return <FigureFlow stage3d unit={unit} units={shown.some((u) => u.id === unit.id) ? shown.map((u) => u.id) : c.roster.map((u) => u.id)} onSelect={setSel} onBack={() => setSel(null)} />;
  const mercs = c.roster.filter(isMercenary).length;
  return (
    <div class="hc-view">
      <Backdrop image={homeBackdrop()} />
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
  const promote = canPromote(data, c, unit);
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

/**
 * The figure sheet (the dress-up doll, story 16.15) with its equip list: "Change" / "Equip" on a chosen place opens the list for it
 * (not in `readOnly`). `stage3d`: the 3D figure, only where the doll is a screen of its own (the preparation keeps the picture).
 */
export function FigureFlow({
  unit,
  units,
  onSelect,
  onBack,
  readOnly,
  stage3d,
}: {
  unit: UnitRecord;
  units: string[];
  onSelect: (id: string) => void;
  onBack: () => void;
  readOnly?: boolean;
  stage3d?: boolean;
}) {
  const [eq, setEq] = useState<{ slot: EquipSlot | 'bag'; index: number } | null>(null);
  const [pick, setPick] = useState<DollPick | null>(null);
  if (eq && !readOnly) return <EquipView unit={unit} slot={eq.slot} index={eq.index} onBack={() => setEq(null)} />;
  return (
    <Doll
      unit={unit}
      units={units}
      onSelect={(id) => {
        setPick(null);
        onSelect(id);
      }}
      onBack={onBack}
      readOnly={readOnly}
      stage3d={stage3d}
      pick={pick}
      onPick={setPick}
      onSwap={(slot, index) => setEq({ slot, index })}
    />
  );
}

export { availableSupportTalks, itemDef };
