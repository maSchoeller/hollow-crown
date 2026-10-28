/**
 * Item detail sheet: picture, type and rarity, a short description, every value spelled out with what it does,
 * effects, the skill it teaches, its set, rune slots and price. Opens from the info stone of an item line or a
 * long press on an item (EXPERIENCE.md: long press = info).
 */
import { useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import type { ComponentChildren } from 'preact';
import type { GameData, ItemInstance } from '../core';
import { t } from '../i18n';
import { Icon } from './icons';
import { asInstance, itemInfo, itemName, rarityOf } from './itemInfo';
import { Amount, ItemImage } from './pieces';
import { Sheet } from './Sheet';
import './item-sheet.css';

/** Hold time of a long press (EXPERIENCE.md Interaction Primitives). */
export const LONG_PRESS_MS = 400;

export function ItemSheet({
  data,
  item,
  onClose,
}: {
  data: GameData;
  item: ItemInstance | string;
  onClose: () => void;
}) {
  const inst = asInstance(item);
  const info = itemInfo(data, inst);
  const rarity = rarityOf(data, inst);
  return (
    <Sheet title={itemName(data, inst)} onClose={onClose} class="its">
      <div class="its__top">
        <ItemImage data={data} item={inst} size={72} />
        <div class="its__id">
          <span class={`its__rarity r-${rarity}`}>{t(`ui.itemInfo.rarity.${rarity}`)}</span>
          <span class="its__type">{info.type}</span>
        </div>
      </div>
      <p class="its__desc">{info.desc}</p>

      {info.facts.length > 0 && (
        <dl class="its__facts">
          {info.facts.map((f) => (
            <div key={f.key} class="its__fact">
              <dt>{f.label}</dt>
              <dd class={f.tone === 'up' ? 'hc-up' : f.tone === 'down' ? 'hc-down' : ''}>{f.value}</dd>
              {f.hint && <small>{f.hint}</small>}
            </div>
          ))}
        </dl>
      )}

      {info.effects.length > 0 && (
        <Section title={t('ui.itemInfo.effects')}>
          <ul class="its__list">
            {info.effects.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Section>
      )}

      {info.affixes.length > 0 && (
        <Section title={t('ui.itemInfo.affixes')}>
          <p class="its__line">{info.affixes.join(', ')}</p>
        </Section>
      )}

      {info.skill && (
        <Section title={t('ui.itemInfo.skill')}>
          <p class="its__line">
            <b>{info.skill.name}</b> – {info.skill.desc}
          </p>
          <p class="its__note">{t('ui.itemInfo.skillMastery', { n: info.skill.cost })}</p>
        </Section>
      )}

      {info.set && (
        <Section title={t('ui.itemInfo.setTitle', { name: info.set.name })}>
          <p class="its__note">{info.set.pieces.join(' · ')}</p>
          <ul class="its__list">
            {info.set.bonuses.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Section>
      )}

      {info.runes.length > 0 && (
        <Section title={t('ui.runes')}>
          <p class="its__line">
            {info.runes.map((r) => (r ? t(`item.${r}.name`) : t('ui.itemInfo.freeSlot'))).join(' · ')}
          </p>
        </Section>
      )}

      {(info.notes.length > 0 || info.buy > 0 || info.sell > 0) && (
        <div class="its__foot">
          {info.notes.map((n) => (
            <span key={n} class="its__chip">
              {n}
            </span>
          ))}
          {info.buy > 0 && (
            <span class="its__price">
              {t('ui.itemInfo.price')} <Amount resource="gold" value={info.buy} />
            </span>
          )}
          {info.sell > 0 && (
            <span class="its__price">
              {t('ui.itemInfo.sellPrice')} <Amount resource="gold" value={info.sell} />
            </span>
          )}
        </div>
      )}
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <section class="its__sec">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

/** The sheet placed over the whole screen (outside lines, panels and scrolling pieces). */
export function ItemSheetPortal({
  data,
  item,
  onClose,
}: {
  data: GameData;
  item: ItemInstance | string | null;
  onClose: () => void;
}) {
  if (!item) return null;
  return createPortal(
    <ItemSheet data={data} item={item} onClose={onClose} />,
    document.getElementById('app') ?? document.body,
  );
}

/** Round info stone next to an item line; a tap opens the detail sheet. */
export function ItemInfoButton({
  data,
  item,
  class: cls = '',
}: {
  data: GameData;
  item: ItemInstance | string;
  class?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        class={`its-info ${cls}`}
        aria-label={t('ui.itemInfo.show', {
          name: typeof item === 'string' ? t(`item.${item}.name`) : itemName(data, item),
        })}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Icon name="info" size={18} />
      </button>
      <ItemSheetPortal data={data} item={open ? item : null} onClose={() => setOpen(false)} />
    </>
  );
}

/**
 * Long press (≥ 400 ms) on an element: calls `onLong` and swallows the click that follows, so a held item opens its
 * details instead of being chosen. Spread the returned handlers onto the element.
 */
export function useLongPress(onLong: (() => void) | undefined) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  if (!onLong) return {};
  return {
    onPointerDown: (e: PointerEvent) => {
      fired.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      cancel();
      timer.current = setTimeout(() => {
        fired.current = true;
        onLong();
      }, LONG_PRESS_MS);
    },
    onPointerMove: (e: PointerEvent) => {
      const s = start.current;
      if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 10) cancel();
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e: Event) => e.preventDefault(),
    onClickCapture: (e: Event) => {
      if (!fired.current) return;
      fired.current = false;
      e.stopPropagation();
      e.preventDefault();
    },
  };
}
