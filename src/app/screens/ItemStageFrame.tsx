/**
 * Story 16.14: the frame of the item stage (DESIGN `workbench-stage`, `rune-gem`): a stone with a dark warm ground, the 3D stage
 * inside, the settings as round rune stones at the top right and the hint "drag turns" at the bottom left. The Babylon part
 * (`render/items/itemStage.ts`) loads on demand, so the first download does not grow; a piece without a model, a model that cannot be
 * loaded and the time until it is there show the item image instead. The weapon view and (16.16) the enchanter use this frame.
 */
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { GameData, GearRunes, ItemInstance, RuneLook } from '../../core';
import { t } from '../../i18n';
import type { ItemStage } from '../../render/items/itemStage';
import type { Quality } from '../../render/host';
import { runeKey } from '../../render/shared/runeLook';
import { ElementDot, Icon } from '../../ui/icons';
import { ItemImage } from '../../ui/pieces';
import './ItemStageFrame.css';

const ROMAN = ['', 'I', 'II', 'III'];

/** One setting of the piece as a round stone: the rune in it (element colour, tier), or an empty dashed place. */
export interface GemSetting {
  key: 'main' | 'small';
  look: RuneLook | null;
  /** "Large setting" / "Small setting" */
  label: string;
  /** the rune's name, for the screen reader */
  runeName?: string;
}

export function RuneGem({ setting, selected, onSelect }: { setting: GemSetting; selected: boolean; onSelect: (key: 'main' | 'small') => void }) {
  const { look } = setting;
  const name = look
    ? `${setting.label}: ${setting.runeName ?? t(`ui.element.${look.element}`)}, ${t('ui.weaponView.tier', { n: ROMAN[look.tier]! })}`
    : `${setting.label}: ${t('ui.weaponView.emptySetting')}`;
  return (
    <button type="button" class={`is-gemwrap ${selected ? 'is-sel' : ''}`} aria-pressed={selected} aria-label={name} onClick={() => onSelect(setting.key)}>
      <span class={`is-gem ${look ? `is-el-${look.element} is-t${look.tier}` : 'is-empty'}`} aria-hidden="true">
        {look && (look.element === 'utility' ? <Icon name="star" size={18} /> : <ElementDot el={look.element} size={30} />)}
        {look && <span class="is-gem__tier">{ROMAN[look.tier]}</span>}
      </span>
      <small>{setting.label}</small>
    </button>
  );
}

export interface ItemStageFrameProps {
  data: GameData;
  quality: Quality;
  item: ItemInstance;
  /** the model file (`models/....glb`); null: no model, the item image shows and no stage is made */
  model: string | null;
  runes: GearRunes;
  /** the stage's description for the screen reader */
  label: string;
  settings?: GemSetting[];
  selected?: 'main' | 'small';
  onSelect?: (key: 'main' | 'small') => void;
  /** reports when the stage shows the model (`true`) or the image shows (`false`) */
  onReady?: (ready: boolean) => void;
  children?: ComponentChildren;
}

export function ItemStageFrame({ data, quality, item, model, runes, label, settings = [], selected, onSelect, onReady, children }: ItemStageFrameProps) {
  /** the host's canvas goes in here; Preact never renders into it */
  const slot = useRef<HTMLDivElement>(null);
  const stage = useRef<ItemStage | null>(null);
  const [ready, setReady] = useState(false);
  const latest = useRef({ runes, onReady });
  latest.current = { runes, onReady };
  const shownKey = useRef('');

  useEffect(() => {
    if (!model) return;
    let gone = false;
    let st: ItemStage | null = null;
    void import('../../render/items/itemStage').then(async ({ ItemStageView }) => {
      if (gone || !slot.current) return;
      st = new ItemStageView(slot.current, data, quality);
      stage.current = st;
      shownKey.current = runeKey(latest.current.runes);
      const ok = await st.show(model, latest.current.runes);
      if (gone) return;
      if (!ok) {
        st.dispose();
        stage.current = null;
      }
      setReady(ok);
      latest.current.onReady?.(ok);
    });
    return () => {
      gone = true;
      st?.dispose();
      stage.current = null;
      setReady(false);
    };
  }, [model]);

  // a changed rune builds the setting anew and lets the new stone grow
  const key = runeKey(runes);
  useEffect(() => {
    if (!ready || !stage.current || shownKey.current === key) return;
    shownKey.current = key;
    void stage.current.setRunes(latest.current.runes, { grow: true });
  }, [key, ready]);

  return (
    <div class="is-frame">
      {!ready && (
        <div class="is-fallback">
          <ItemImage data={data} item={item} size={168} />
        </div>
      )}
      <div class="hc-stage-slot is-slot" ref={slot} role="img" aria-label={label} />
      {settings.length > 0 && (
        <div class="is-gems" role="group" aria-label={t('ui.weaponView.settings')}>
          {settings.map((s) => (
            <RuneGem key={s.key} setting={s} selected={selected === s.key} onSelect={(k) => onSelect?.(k)} />
          ))}
        </div>
      )}
      {ready && <small class="is-hint">{t('ui.weaponView.dragHint')}</small>}
      {children}
    </div>
  );
}
