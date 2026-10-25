/** Equip list of one place of a figure, with the green/red comparison (concept/25-ux mockup 06, story 6.2). */
import { useState } from 'preact/hooks';
import { equipCandidates, equipPreview, itemDef, type EquipDelta, type EquipSlot, type ItemInstance, type UnitRecord } from '../../core';
import { t } from '../../i18n';
import { ItemLine, itemName, Toast, unitName } from '../../ui/components';
import { Backdrop, Piece, PrimaryButton, ScreenHead, SecondaryButton } from '../../ui/pieces';
import { audio } from '../audio';
import { campaign, campaignCommand, data } from '../state/session';
import { homeBackdrop } from '../campaignInfo';

/** Label of a changed value in the comparison. */
const DELTA_LABEL: Record<EquipDelta['key'], string> = {
  mt: 'ui.mt',
  hit: 'ui.hit',
  crit: 'ui.crit',
  rng: 'ui.rng',
  wt: 'ui.wt',
  hp: 'ui.stat.hp',
  str: 'ui.stat.str',
  mag: 'ui.stat.mag',
  skl: 'ui.stat.skl',
  spd: 'ui.stat.spd',
  lck: 'ui.stat.lck',
  def: 'ui.stat.def',
  res: 'ui.stat.res',
  mov: 'ui.stat.mov',
  avoid: 'ui.avoid',
  load: 'ui.stat.load',
};

/** Right side of a line: up to three changed values, green when better and red when worse than what is worn. */
export function Deltas({ list, max = 3 }: { list: EquipDelta[]; max?: number }) {
  return (
    <>
      {list.slice(0, max).map((d) => (
        <span key={d.key} class={d.better ? 'hc-up' : 'hc-down'} style={{ display: 'block' }}>
          {t(DELTA_LABEL[d.key])} {d.delta > 0 ? '+' : '−'}
          {Math.abs(d.delta)}
        </span>
      ))}
    </>
  );
}

/** Why an item cannot go to this place; the text names the role or weapon so the player knows what to change. */
function reason(unit: UnitRecord, inst: ItemInstance, error: string): string {
  const d = itemDef(data, inst);
  switch (error) {
    case 'weapon_group':
      return t('ui.equip.why.weapon_group', { weapon: t(`ui.weapon.${d.group}`), role: t(`class.${unit.classId}.name`) });
    case 'heavy_armor':
      return t('ui.equip.why.heavy_armor', { role: t(`class.${unit.classId}.name`) });
    default:
      return t(`ui.equip.why.${error}`);
  }
}

/**
 * The list for one place: what is worn (marked), then what fits from bag and convoy. The first tap chooses, the main
 * button runs the campaign command ("Javelin equip"); "Unequip" puts the worn item back into the convoy.
 */
export function EquipView({ unit, slot, onBack }: { unit: UnitRecord; slot: EquipSlot | 'bag'; index: number; onBack: () => void }) {
  const c = campaign.value!;
  const [pick, setPick] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const worn = slot === 'bag' ? undefined : unit.equip[slot];
  const cands = equipCandidates(data, c, unit, slot).sort((a, b) => Number(!!a.error) - Number(!!b.error));
  const chosen = cands.find((x) => x.inst.uid === pick && !x.error);
  const run = (cmd: Parameters<typeof campaignCommand>[0], after?: () => void) => {
    const r = campaignCommand(cmd);
    if (r.ok) {
      audio.sfx('confirm');
      after?.();
    } else {
      audio.sfx('error');
      setToast(t(`ui.camp.err.${r.error}`));
    }
  };
  const groups =
    slot === 'mainHand' || slot === 'offHand' ? data.classes[unit.classId]!.weaponGroups.map((w) => t(`ui.weapon.${w}`)).join(', ') : '';
  const fits = cands.filter((x) => !x.error).length;
  return (
    <div class="hc-view">
      <Backdrop image={homeBackdrop()} />
      <ScreenHead title={t(`ui.slot.${slot}`)} aside={unitName(unit)} onBack={onBack} />
      <Piece class="hc-view__scroll col" style={{ gap: 4 }}>
        <div class="hc-title-row">
          {groups || t(`ui.slot.${slot}`)}
          <span>{t('ui.equip.fit', { n: fits })}</span>
        </div>
        {worn && <ItemLine data={data} inst={worn} current tag={t('ui.equip.worn')} />}
        {cands.map(({ inst, error }) => (
          <ItemLine
            key={inst.uid}
            data={data}
            inst={inst}
            selected={pick === inst.uid}
            dim={!!error}
            sub={error ? reason(unit, inst, error) : undefined}
            side={!error && slot !== 'bag' ? <Deltas list={equipPreview(data, unit, inst, slot)} /> : undefined}
            onClick={() => setPick(pick === inst.uid ? null : inst.uid)}
          />
        ))}
        {cands.length === 0 && !worn && <div style={{ color: 'var(--hc-soft)', padding: 12 }}>{t('ui.equip.none')}</div>}
      </Piece>
      <div class="hc-btns">
        {worn ? (
          <SecondaryButton onClick={() => run({ type: 'unequip', uid: worn.uid }, onBack)}>{t('ui.unequip')}</SecondaryButton>
        ) : (
          <SecondaryButton onClick={onBack}>{t('ui.back')}</SecondaryButton>
        )}
        <PrimaryButton
          disabled={!chosen}
          onClick={() => chosen && run({ type: 'equip', unit: unit.id, uid: chosen.inst.uid, slot }, onBack)}
        >
          {chosen ? t(slot === 'bag' ? 'ui.equip.toBagNamed' : 'ui.equip.named', { item: itemName(data, chosen.inst) }) : t('ui.equip.choose')}
        </PrimaryButton>
      </div>
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
