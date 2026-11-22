/**
 * Story 16.14: the weapon view. A full screen: the piece big and turnable on the item stage with its rune in the setting, the
 * values as symbol and number, what the rune changes against "no rune", the chronicle line and the keys to the enchanter and the smith.
 * Weapons and shields use the stage; a piece without a model (armour, accessories, groups without a v2 model) shows its image in
 * the same frame. Everything it says comes from the rule code (`weaponView.ts`), nothing is worked out here.
 */
import { useEffect, useState } from 'preact/hooks';
import { locateItem, runeSlotCount, type EquipSlot } from '../../core';
import { has, t } from '../../i18n';
import { runeLookOf } from '../../render/shared/runeLook';
import { ChangeList } from '../../ui/ChangeList';
import { itemName, rarityOf, unitName } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { ItemStageFrame, type GemSetting } from './ItemStageFrame';
import { PrimaryButton, SecondaryButton } from '../../ui/pieces';
import { campaign, data } from '../state/session';
import { screen, type Screen } from '../state/screen';
import { settings } from '../state/settings';
import { lockReason } from './Rooms';
import {
  chronicleLine,
  epithetOf,
  hasRune,
  placeOf,
  referenceUnit,
  roomAccess,
  runeChange,
  stageRunes,
  valuesOf,
  viewKeys,
  weaponStageModel,
  type RoomAccess,
} from './weaponViewModel';
import './WeaponView.css';

/** The weapon view of the piece `item` (uid); `unit` is the figure its changes are worked out for; `back` is where it closes to. */
export function WeaponView({ item, unit: unitHint, back }: { item: string; unit?: string; back: Screen }) {
  const c = campaign.value;
  const inst = c ? locateItem(c, item)?.inst : undefined;
  // the piece is gone (sold, dismantled): nothing to show
  useEffect(() => {
    if (!inst) screen.value = back;
  }, [inst]);
  if (!c || !inst) return null;
  return <WeaponViewBody item={inst.uid} unitHint={unitHint} back={back} />;
}

/** Why a key to a room is dimmed: this home has no such room, or the room's condition is not met yet. */
function roomReason(access: RoomAccess | null): string | undefined {
  if (!access) return t('ui.weaponView.noRoom');
  return access.open ? undefined : lockReason(access.unmet);
}

function WeaponViewBody({ item, unitHint, back }: { item: string; unitHint?: string; back: Screen }) {
  const c = campaign.value!;
  const inst = locateItem(c, item)!.inst;
  const [sel, setSel] = useState<'main' | 'small'>('main');
  const close = () => (screen.value = back);
  // the Escape key closes the view as the stone does
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const slot: EquipSlot | 'bag' = placeOf(data, c, inst);
  const unit = referenceUnit(c, inst, unitHint);
  const runes = stageRunes(data, inst);
  const model = weaponStageModel(data, inst);
  const slots = runeSlotCount(data, inst);
  const rarity = rarityOf(data, inst);
  const epithet = epithetOf(data, c, t, inst);
  const chronicle = chronicleLine(data, c, t, inst);
  const keys = viewKeys(data, inst);
  const values = unit ? valuesOf(data, unit, inst, slot) : null;
  const change = unit && slots > 0 && hasRune(inst) ? runeChange(data, unit, inst, slot) : null;
  const name = itemName(data, inst);

  const settingsList: GemSetting[] = [];
  if (slots > 0) {
    for (const [key, look] of [['main', runes.main], ['small', runes.small]] as const) {
      if (key === 'small' && !runes.smallSlot) continue;
      settingsList.push({ key, look, label: t(`ui.weaponView.setting.${key}`), runeName: look && has(`item.${look.id}.name`) ? t(`item.${look.id}.name`) : undefined });
    }
  }
  const shown = settingsList.find((s) => s.key === sel) ?? settingsList[0];
  const shownRune = shown?.look ? runeLookOf(data.runes, shown.look.id) : null;

  const enchanter = keys.enchant ? roomAccess(data, c, 'enchanter') : null;
  const smith = keys.upgrade ? roomAccess(data, c, 'smith') : null;
  const go = (access: RoomAccess | null) => {
    if (access?.open) screen.value = { name: 'camp', tab: access.id, ...(unit ? { unit: unit.id } : {}), item: inst.uid };
  };

  const stageLabel = shown?.look ? t('ui.weaponView.stageRune', { name, rune: shown.runeName ?? t(`ui.element.${shown.look.element}`), tier: shown.look.tier }) : t('ui.weaponView.stage', { name });

  return (
    <div class="hc-view wv">
      <header class="wv-head">
        <div class="wv-head__id">
          <h1 class="wv-head__name">
            {name}
            {epithet && <span class="wv-head__epithet">{t('ui.weaponView.epithet', { epithet })}</span>}
          </h1>
          <span class={`wv-rarity r-${rarity}`}>{t(`ui.itemInfo.rarity.${rarity}`)}</span>
        </div>
        <button type="button" class="hc-head__back wv-close" onClick={close} aria-label={t('ui.close')}>
          <Icon name="close" size={22} />
        </button>
      </header>
      <ItemStageFrame
        data={data}
        quality={settings.value.quality}
        item={inst}
        model={model}
        runes={runes}
        label={stageLabel}
        settings={settingsList}
        selected={shown?.key}
        onSelect={setSel}
      />
      <div class="hc-piece wv-body">
        {shown && (
          <p class="wv-setting">
            <b>{shown.label}</b>
            {shown.look && shownRune ? ` ${t('ui.weaponView.runeNamed', { rune: shown.runeName ?? t(`ui.element.${shown.look.element}`), tier: shown.look.tier })}` : ` ${t('ui.weaponView.emptySetting')}`}
          </p>
        )}
        <section aria-label={t('ui.weaponView.values')}>
          <h2 class="wv-h">
            {t('ui.weaponView.values')}
            {unit && <small>{t('ui.weaponView.forUnit', { name: unitName(unit) })}</small>}
          </h2>
          {values ? <ChangeList result={values} empty="ui.weaponView.noValues" /> : <div class="chg-empty">{t('ui.weaponView.noValues')}</div>}
        </section>
        {slots > 0 && (
          <section aria-label={t('ui.weaponView.runeChange')}>
            <h2 class="wv-h">{t('ui.weaponView.runeChange')}</h2>
            {change ? <ChangeList result={change} empty="ui.weaponView.noChange" /> : <div class="chg-empty">{t('ui.weaponView.noRune')}</div>}
          </section>
        )}
        {chronicle && (
          <p class="wv-chronicle">
            <Icon name="book" size={16} />
            <span>{chronicle}</span>
          </p>
        )}
      </div>
      {(keys.enchant || keys.upgrade) && (
        <div class="hc-btns wv-keys">
          {keys.upgrade && (
            <SecondaryButton disabled={!smith?.open} sub={roomReason(smith)} onClick={() => go(smith)}>
              {t('ui.weaponView.upgrade')}
            </SecondaryButton>
          )}
          {keys.enchant && (
            <PrimaryButton disabled={!enchanter?.open} sub={roomReason(enchanter)} onClick={() => go(enchanter)}>
              {t('ui.weaponView.enchant')}
            </PrimaryButton>
          )}
        </div>
      )}
    </div>
  );
}
