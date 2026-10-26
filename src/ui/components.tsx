/** Presentational UI pieces (no app state, no renderer). */
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import './notices.css';
import {
  itemDef,
  runeSlotCount,
  weaponProfile,
  type GameData,
  type ItemInstance,
} from '../core';
import { t } from '../i18n';
import { instanceRarity } from '../core/loot';
import { Icon } from './icons';
import { ItemImage } from './pieces';
import { asset } from './asset';

export { asset };

export function unitName(u: { name?: string; nameKey: string }): string {
  return u.name ?? t(u.nameKey);
}

export function itemName(data: GameData, inst: ItemInstance): string {
  let name = t(`item.${inst.def}.name`);
  const pre = inst.affixes.filter((a) => data.affixes[a]?.position === 'prefix').map((a) => t(`affix.${a}`));
  const suf = inst.affixes.filter((a) => data.affixes[a]?.position === 'suffix').map((a) => t(`affix.${a}`));
  if (pre.length) name = t('ui.item.prefixed', { name, affix: pre.join(' ') });
  if (suf.length) name = `${name} ${suf.join(' ')}`;
  if (inst.upgrade > 0) name += ` +${inst.upgrade}`;
  return name;
}

export function rarityOf(data: GameData, inst: ItemInstance): string {
  return instanceRarity(data, inst.def, inst.affixes.length);
}

export function Modal({ title, onClose, children, wide }: { title?: ComponentChildren; onClose?: () => void; children: ComponentChildren; wide?: boolean }) {
  return (
    <div class="modal-back" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div class="modal edge" style={wide ? { width: 'min(760px, 100%)' } : undefined} role="dialog">
        {(title || onClose) && (
          <div class="modal-head">
            <h2 class="grow">{title}</h2>
            {onClose && (
              <button class="btn small ghost icon-only" onClick={onClose} aria-label={t('ui.close')}>
                <Icon name="close" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/** Value line of an item as short parts ("Mt 9", "Tr 70" ...), shared by details and item lines. */
export function itemParts(data: GameData, inst: ItemInstance): string[] {
  const d = itemDef(data, inst);
  const parts: string[] = [];
  if (d.mt !== undefined) {
    const w = weaponProfile(data, inst);
    parts.push(`${t('ui.mt')} ${w.might}`, `${t('ui.hit')} ${w.hit}`, `${t('ui.crit')} ${w.crit}`, `${t('ui.rng')} ${w.range[0]}–${w.range[1]}`, `${t('ui.wt')} ${w.weight}`);
    if (w.element) parts.push(t(`ui.element.${w.element}`));
    if (w.effectiveVs.length) parts.push(`${t('ui.effective')}: ${w.effectiveVs.map((x) => t(`ui.tag.${x}`)).join(', ')}`);
    for (const s of w.statusOnHit) parts.push(`${t(`ui.status.${s.status}`)} ${s.chance}%`);
  } else {
    if (d.heal) parts.push(`${t('ui.heal')} ${d.heal}`);
    for (const [k, v] of Object.entries(d.statMods ?? {})) parts.push(`${t(`ui.stat.${k}`)} ${v! > 0 ? '+' : ''}${v}`);
    if (d.wt) parts.push(`${t('ui.wt')} ${d.wt}`);
    if (d.use?.heal) parts.push(`${t('ui.heal')} ${d.use.heal}`);
    if (d.charges) parts.push(`${t('ui.charges')} ${inst.charges ?? d.charges}/${d.charges}`);
    if (d.element) parts.push(t(`ui.element.${d.element}`));
  }
  return parts;
}

export function ItemDetails({ data, inst }: { data: GameData; inst: ItemInstance }) {
  const d = itemDef(data, inst);
  const parts = itemParts(data, inst);
  const slots = runeSlotCount(data, inst);
  return (
    <div class="col" style={{ gap: 4, fontSize: 14 }}>
      <div class="muted">{parts.join(' · ')}</div>
      {inst.affixes.length > 0 && <div>{inst.affixes.map((a) => t(`affix.${a}`)).join(', ')}</div>}
      {slots > 0 && (
        <div class="muted">
          {t('ui.runes')}: {Array.from({ length: slots }, (_, i) => (inst.runes[i] ? t(`item.${inst.runes[i]}.name`) : '–')).join(' · ')}
        </div>
      )}
      {d.grantsSkill && (
        <div>
          <b>{t(`skill.${d.grantsSkill.skill}.name`)}</b> – <span class="muted">{t(`skill.${d.grantsSkill.skill}.desc`)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * One line of a list in style B (equipment list, convoy, merchant, smith): image, name with values, the right
 * side for the comparison or the price. A tap selects; `dim` greys it out (the reason stands in `sub`).
 */
export function ItemLine({
  data,
  inst,
  sub,
  side,
  tag,
  selected,
  current,
  dim,
  onClick,
}: {
  data: GameData;
  inst: ItemInstance;
  /** replaces the value line (e.g. the reason an item cannot be used) */
  sub?: ComponentChildren;
  side?: ComponentChildren;
  /** small black pill behind the name ("equipped") */
  tag?: string;
  selected?: boolean;
  current?: boolean;
  dim?: boolean;
  onClick?: () => void;
}) {
  const d = itemDef(data, inst);
  const values = [...itemParts(data, inst), ...(d.grantsSkill ? [t('ui.item.teaches', { skill: t(`skill.${d.grantsSkill.skill}.name`) })] : [])];
  return (
    <button
      type="button"
      class={`hc-line-item ${selected ? 'is-sel' : ''} ${current ? 'is-current' : ''} ${dim ? 'is-dim' : ''}`}
      aria-pressed={selected}
      aria-disabled={dim}
      onClick={dim ? undefined : onClick}
    >
      <ItemImage data={data} item={inst} />
      <span style={{ minWidth: 0 }}>
        <span class="hc-line-item__name">
          {itemName(data, inst)}
          {tag && <span class="hc-tag">{tag}</span>}
        </span>
        <span class="hc-line-item__sub">{sub ?? values.join(' · ')}</span>
      </span>
      <span class="hc-line-item__side">{side}</span>
    </button>
  );
}

export function useNow(intervalMs: number): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((x) => x + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return n;
}

/** Short notice; `lead` puts e.g. the looted item's image before the text. */
export function Toast({ text, lead, onDone }: { text: string; lead?: ComponentChildren; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2200);
    return () => clearTimeout(id);
  }, [text]);
  return (
    <div class={`toast ${lead ? 'has-lead' : ''}`}>
      {lead}
      {lead ? <span>{text}</span> : text}
    </div>
  );
}

export function useMemoOnce<T>(fn: () => T): T {
  return useMemo(fn, []);
}
