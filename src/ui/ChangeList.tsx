/**
 * Change list (story 16.13, DESIGN `change-list`): per line a round symbol (18 px), the name, the new value and the
 * difference on the right (green better, red worse); no arrow, no "before" column. "new" is ember with one sentence of
 * explanation, "falls away" is struck through. Without a probe (mode `state`) the same area shows what the item gives.
 * `ChangeChips` is the compact form for the merchant line: up to two chips of symbol, new value and difference.
 */
import type { ChangeLine, ChangeResult, ChangeStatKey } from '../core';
import { lang, t } from '../i18n';
import { ElementDot, Icon } from './icons';
import './change-list.css';

/** Icon of each stat line (all of them exist in the line icon set; a unit test checks it). */
export const STAT_ICON: Record<ChangeStatKey, string> = {
  attack: 'attack',
  hit: 'target',
  crit: 'crit',
  range: 'range',
  weight: 'weight',
  hp: 'hp',
  strength: 'strength',
  magic: 'magic',
  skill: 'skill',
  speed: 'speed',
  luck: 'luck',
  defense: 'shield',
  resistance: 'resist',
  move: 'move',
  avoid: 'avoid',
  load: 'load',
};

const STATUS_ICON: Record<string, string> = { burning: 'fire', wet: 'water', slowed: 'earth', knockback: 'wind' };

/** Icon name of a line (element lines use the ElementDot with this element icon). */
export function changeIcon(line: ChangeLine): string {
  switch (line.kind) {
    case 'stat':
      return STAT_ICON[line.key];
    case 'element':
      return line.to ?? line.from ?? 'star';
    case 'elementDamage':
    case 'armorElement':
      return line.against;
    case 'effect':
      if (line.effect === 'status') return STATUS_ICON[line.id] ?? 'danger';
      return line.effect === 'terrain' ? 'campfire' : 'attack';
  }
}

const signed = (n: number): string => `${n > 0 ? '+' : '−'}${Math.abs(n)}`;
const factorText = (f: number): string => `×${new Intl.NumberFormat(lang.value).format(f)}`;

interface Parts {
  label: string;
  value?: string;
  delta?: number;
  sub?: string;
  isNew?: boolean;
  gone?: boolean;
}

function effectName(line: Extract<ChangeLine, { kind: 'effect' }>): string {
  const name =
    line.effect === 'status' ? t(`ui.status.${line.id}`) : line.effect === 'terrain' ? t(`ui.change.terrain.${line.id}`) : t(`ui.tag.${line.id}`);
  return t(`ui.change.effect.${line.effect}`, { name });
}

/** The text parts of one line: label, new value, difference, "new"/"falls away" marker and an explanation. */
function parts(line: ChangeLine, mode: ChangeResult['mode']): Parts {
  const diff = mode === 'diff';
  switch (line.kind) {
    case 'stat':
      return { label: t(`ui.change.stat.${line.key}`), value: String(line.value), delta: diff ? line.delta : 0 };
    case 'element': {
      const label = t('ui.change.element');
      if (!line.to) return { label, value: t(`ui.element.${line.from!}`), gone: true };
      const sub = line.from ? t('ui.change.instead', { element: t(`ui.element.${line.from}`) }) : undefined;
      return { label, value: t(`ui.element.${line.to}`), sub, isNew: diff && !line.from };
    }
    case 'elementDamage':
      return { label: t('ui.change.damageVs', { element: t(`ui.element.${line.against}`) }), value: String(line.value), delta: diff ? line.delta : 0 };
    case 'armorElement':
      return { label: t('ui.change.armorVs', { element: t(`ui.element.${line.against}`) }), value: factorText(line.factor) };
    case 'effect': {
      const explain = line.effect === 'terrain' ? `ui.change.explain.terrain.${line.id}` : `ui.change.explain.${line.effect}`;
      return { label: effectName(line), isNew: diff && line.appears, gone: !line.appears, sub: line.appears ? t(explain) : undefined };
    }
  }
}

function Symbol({ line, size }: { line: ChangeLine; size: number }) {
  if (line.kind === 'stat' || line.kind === 'effect') {
    return (
      <span class="chg-sym" style={{ width: size, height: size }}>
        <Icon name={changeIcon(line)} size={Math.round(size * 0.72)} />
      </span>
    );
  }
  const el = line.kind === 'element' ? (line.to ?? line.from!) : line.against;
  return <ElementDot el={el} size={size} />;
}

/** Colour class of the difference: green when better, red when worse. */
const tone = (better: boolean): string => (better ? 'chg-up' : 'chg-down');

/**
 * The list. `empty` is the key of the text shown when nothing changes (default "no change"; the equip list passes
 * `ui.change.alreadyWorn` when the item is the worn one).
 */
export function ChangeList({ result, empty = 'ui.change.none', class: cls = '' }: { result: ChangeResult; empty?: string; class?: string }) {
  if (result.lines.length === 0) return <div class={`chg-empty ${cls}`}>{t(empty)}</div>;
  return (
    <ul class={`chg ${cls}`} aria-label={t('ui.change.list')}>
      {result.lines.map((line) => {
        const p = parts(line, result.mode);
        return (
          <li key={line.key} class={`chg-row ${p.gone ? 'is-gone' : ''}`}>
            <Symbol line={line} size={18} />
            <span class="chg-text">
              <span class="chg-label">{p.label}</span>
              {p.sub && <span class="chg-sub">{p.sub}</span>}
            </span>
            {p.isNew && <span class="chg-new">{t('ui.change.new')}</span>}
            {p.gone && <span class="chg-gone">{t('ui.change.gone')}</span>}
            {p.value !== undefined && !(p.gone && line.kind === 'effect') && <span class="chg-value">{p.value}</span>}
            {!!p.delta && <span class={`chg-delta ${tone(line.better)}`}>{signed(p.delta)}</span>}
          </li>
        );
      })}
    </ul>
  );
}

/** Compact form for the merchant line: up to `max` (default two) chips of symbol, new value and difference; "new" in ember. */
export function ChangeChips({ result, max = 2 }: { result: ChangeResult; max?: number }) {
  const chips = result.lines.filter((l) => l.kind !== 'armorElement').slice(0, max);
  if (chips.length === 0) return null;
  return (
    <span class="chg-chips">
      {chips.map((line) => {
        const p = parts(line, result.mode);
        return (
          <span key={line.key} class={`chg-chip ${p.gone ? 'is-gone' : ''}`} title={p.label}>
            <Symbol line={line} size={15} />
            {p.isNew ? (
              <span class="chg-new">{t('ui.change.new')}</span>
            ) : p.gone ? (
              <span class="chg-gone">{t('ui.change.gone')}</span>
            ) : (
              <>
                <span class="chg-value">{p.value}</span>
                {!!p.delta && <span class={`chg-delta ${tone(line.better)}`}>{signed(p.delta)}</span>}
              </>
            )}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Compact state of an item (story 16.14, "values as symbol + number"): the stat lines as small tiles of symbol and value, the name
 * only for screen readers and as a tooltip; other lines (element, damage per element, effects) stay with the change list.
 */
export function ChangeStats({ result }: { result: ChangeResult }) {
  const stats = result.lines.filter((l): l is Extract<ChangeLine, { kind: 'stat' }> => l.kind === 'stat');
  if (stats.length === 0) return null;
  return (
    <ul class="chg-stats" aria-label={t('ui.change.list')}>
      {stats.map((line) => {
        const label = t(`ui.change.stat.${line.key}`);
        return (
          <li key={line.key} class="chg-stat" title={label} aria-label={`${label} ${fmtNum(line.value)}`}>
            <Symbol line={line} size={18} />
            <span class="chg-stat__v">{fmtNum(line.value)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** A number with a real minus sign. */
const fmtNum = (n: number): string => (n < 0 ? `−${Math.abs(n)}` : String(n));
