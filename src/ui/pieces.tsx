/** Building blocks of style B (concept/25-ux/DESIGN.md): stone, buttons with a pressable bottom edge, amounts. */
import type { ComponentChildren, JSX } from 'preact';
import type { ItemDef } from '../core';
import { asset } from './asset';
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

/** Vector symbols where no painted image exists (DESIGN.md: Gold = coin, EXP = green star). */
const VECTOR: Record<'gold' | 'exp', { path: string; color: string }> = {
  gold: { path: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18Z', color: 'var(--hc-gold)' },
  exp: { path: 'M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6 6.6 19.5l1.1-6.1L3.2 9.2l6.1-.8Z', color: 'var(--hc-positive)' },
};

/** Painted images (art/items) for ember sparks and every material. */
const IMAGE: Record<'emberSpark', string> = { emberSpark: 'ember_spark' };

function Symbol({ resource, image }: { resource?: 'gold' | 'exp'; image?: string }) {
  if (image) return <img src={asset(`items/${image}.webp`)} alt="" aria-hidden="true" draggable={false} />;
  const v = VECTOR[resource!];
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={v.path} fill={v.color} stroke="var(--hc-line)" stroke-width="2" stroke-linejoin="round" />
      {resource === 'gold' && <circle cx="12" cy="12" r="4.5" fill="none" stroke="var(--hc-line)" stroke-width="1.6" />}
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
 * Materials show their painted image (art/items/<id>.png, required by content:check).
 */
export function Amount({ value, signed, short, class: cls, resource, material }: AmountProps) {
  const name = resource ? t(`ui.resource.${resource}`) : t(`item.${material.id}.name`);
  const text = `${signed && value > 0 ? '+' : ''}${fmt(value)}`;
  return (
    <span class={`hc-amount ${short ? 'is-short' : ''} ${cls ?? ''}`} aria-label={`${text} ${name}`} title={name}>
      {resource === 'emberSpark' ? <Symbol image={IMAGE.emberSpark} /> : resource ? <Symbol resource={resource} /> : <Symbol image={material.id} />}
      <span aria-hidden="true">{text}</span>
    </span>
  );
}