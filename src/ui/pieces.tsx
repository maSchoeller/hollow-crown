/** Building blocks of style B (concept/25-ux/DESIGN.md): stone, buttons with a pressable bottom edge, amounts. */
import type { ComponentChildren, JSX } from 'preact';
import type { ItemDef, MaterialShape } from '../core';
import { lang, t } from '../i18n';
import './pieces.css';

type Div = JSX.HTMLAttributes<HTMLDivElement>;

/** A stone: cream, outline, hard bottom edge. Base of every panel. */
export function Piece({ class: cls, children, ...rest }: Div & { children?: ComponentChildren }) {
  return (
    <div class={`hc-piece ${cls ?? ''}`} {...rest}>
      {children}
    </div>
  );
}

type ButtonProps = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'class'> & {
  class?: string;
  disabled?: boolean;
  /** second line in body type, e.g. where "Continue" resumes */
  sub?: ComponentChildren;
  children?: ComponentChildren;
};

function StoneButton({ variant, class: cls, sub, children, type, ...rest }: ButtonProps & { variant: string }) {
  return (
    <button type={type ?? 'button'} class={`hc-btn ${variant} ${cls ?? ''}`} {...rest}>
      <span>{children}</span>
      {sub !== undefined && <small>{sub}</small>}
    </button>
  );
}

/** Ember pill; at most one per view. */
export const PrimaryButton = (p: ButtonProps) => <StoneButton variant="hc-btn--primary" {...p} />;
/** Cream pill: back, cancel, secondary choices. */
export const SecondaryButton = (p: ButtonProps) => <StoneButton variant="hc-btn--secondary" {...p} />;
/** Grey pill without ember; only for farewell and remembrance. */
export const QuietButton = (p: ButtonProps) => <StoneButton variant="hc-btn--quiet" {...p} />;

export type Resource = 'gold' | 'exp' | 'emberSpark';

/** Fixed resource symbols (DESIGN.md: Gold = coin, EXP = green star, ember spark = spark). */
const RESOURCE_SYMBOL: Record<Resource, { shape: SymbolShape; color: string }> = {
  gold: { shape: 'coin', color: 'var(--hc-gold)' },
  exp: { shape: 'star', color: 'var(--hc-positive)' },
  emberSpark: { shape: 'spark', color: 'var(--hc-ember)' },
};

type SymbolShape = MaterialShape | 'coin' | 'star' | 'spark';

const PATHS: Record<SymbolShape, string> = {
  coin: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18Z',
  diamond: 'M12 2.5 20 12 12 21.5 4 12Z',
  star: 'M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6 6.6 19.5l1.1-6.1L3.2 9.2l6.1-.8Z',
  spark: 'M12 2c.9 4.6 2.4 6.6 7 8-4.6 1.4-6.1 3.4-7 12-.9-8.6-2.4-10.6-7-12 4.6-1.4 6.1-3.4 7-8Z',
  crescent: 'M15.5 3.2A9 9 0 1 0 20.8 15 7.2 7.2 0 0 1 15.5 3.2Z',
  hexagon: 'M12 2.5 20.2 7.2v9.6L12 21.5 3.8 16.8V7.2Z',
  drop: 'M12 2.5c4 5 6.5 8.6 6.5 12a6.5 6.5 0 0 1-13 0c0-3.4 2.5-7 6.5-12Z',
};

function Symbol({ shape, color }: { shape: SymbolShape; color: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[shape]} fill={color} stroke="var(--hc-line)" stroke-width="2" stroke-linejoin="round" />
      {shape === 'coin' && <circle cx="12" cy="12" r="4.5" fill="none" stroke="var(--hc-line)" stroke-width="1.6" />}
    </svg>
  );
}

const fmt = (n: number) => n.toLocaleString(lang.value === 'de' ? 'de-DE' : 'en-US');

type AmountProps = {
  value: number;
  /** show "+" for gains */
  signed?: boolean;
  /** marks an amount the player cannot pay */
  short?: boolean;
  class?: string;
} & ({ resource: Resource; material?: never } | { material: ItemDef; resource?: never });

/**
 * Every amount is symbol + number with tabular digits, never a word or a bare number (DESIGN.md §Währung).
 * Materials bring their symbol from items.yaml (`symbol`, required by content:check).
 */
export function Amount({ value, signed, short, class: cls, resource, material }: AmountProps) {
  const sym = resource ? RESOURCE_SYMBOL[resource] : material.symbol!;
  const name = resource ? t(`ui.resource.${resource}`) : t(`item.${material.id}.name`);
  const text = `${signed && value > 0 ? '+' : ''}${fmt(value)}`;
  return (
    <span class={`hc-amount ${short ? 'is-short' : ''} ${cls ?? ''}`} aria-label={`${text} ${name}`} title={name}>
      <Symbol shape={sym.shape} color={sym.color} />
      <span aria-hidden="true">{text}</span>
    </span>
  );
}
