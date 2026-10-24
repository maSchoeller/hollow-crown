/** Building blocks of style B (concept/25-ux/DESIGN.md): stone, buttons with a pressable bottom edge, amounts, item images. */
import type { ComponentChildren, JSX } from 'preact';
import { instanceRarity, itemDef, type GameData, type ItemDef, type ItemInstance, type Rarity } from '../core';
import { asset } from './asset';
import { lang, t } from '../i18n';
import { Icon } from './icons';
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

/** Header of a full-screen view: round back stone and a title pill with an optional note at its right edge (mockup 07). */
export function ScreenHead({ title, aside, onBack }: { title: ComponentChildren; aside?: ComponentChildren; onBack: () => void }) {
  return (
    <header class="hc-head">
      <button type="button" class="hc-head__back" onClick={onBack} aria-label={t('ui.back')}>
        <Icon name="back" size={22} />
      </button>
      <h1 class="hc-head__title">
        <b>{title}</b>
        {aside !== undefined && <span>{aside}</span>}
      </h1>
    </header>
  );
}

export type Resource = 'gold' | 'exp' | 'emberSpark';

/** Vector symbols where no painted image exists (DESIGN.md: Gold = coin, EXP = green star). */
const VECTOR: Record<'gold' | 'exp', { path: string; color: string }> = {
  gold: { path: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18Z', color: 'var(--hc-gold)' },
  exp: { path: 'M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6 6.6 19.5l1.1-6.1L3.2 9.2l6.1-.8Z', color: 'var(--hc-positive)' },
};

/** Painted images (art/items) for ember sparks and every material. */
const IMAGE: Record<'emberSpark', string> = { emberSpark: 'ember_spark' };

function Symbol({ resource, image }: { resource?: 'gold' | 'exp'; image?: string }) {
  if (image) return <img src={itemImageSrc(image)} alt="" aria-hidden="true" draggable={false} />;
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
      {resource === 'emberSpark' ? <Symbol image={IMAGE.emberSpark} /> : resource ? <Symbol resource={resource} /> : <Symbol image={material.image ?? material.id} />}
      <span aria-hidden="true">{text}</span>
    </span>
  );
}

/** URL of a painted item image (art/items/<image>.png, built to 132 px WebP by pnpm art:build). */
export function itemImageSrc(d: ItemDef | string): string {
  return asset(`items/${typeof d === 'string' ? d : (d.image ?? d.id)}.webp`);
}

/** Diamonds per rarity (DESIGN.md: common 0, rare 1, epic 2, legendary 3; relic: hollow crown). */
const GEMS: Record<Rarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };

type ItemImageProps = {
  data: GameData;
  /** an owned instance (rarity from its affixes, upgrade and charges) or a definition id (merchant stock, rewards) */
  item: ItemInstance | string;
  /** edge length in px; DESIGN.md item-image is 44 */
  size?: number;
  /** overrides the computed rarity, e.g. relics */
  rarity?: Rarity | 'relic';
  /** accessible name when no item name stands beside the image */
  label?: string;
  /** no frame, diamonds or number: only the picture, for use inside an ItemChip (one frame per item, DESIGN.md) */
  bare?: boolean;
  class?: string;
};

function rarityOfItem(data: GameData, item: ItemInstance | string, rarity?: Rarity | 'relic'): Rarity | 'relic' {
  return rarity ?? instanceRarity(data, itemDef(data, item).id, typeof item === 'string' ? 0 : item.affixes.length);
}

function Gems({ r }: { r: Rarity | 'relic' }) {
  if (r === 'relic')
    return (
      <span class="hc-item-image__gems">
        <svg viewBox="0 0 24 24" class="hc-item-image__crown">
          <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />
        </svg>
      </span>
    );
  return GEMS[r] > 0 ? (
    <span class="hc-item-image__gems">
      {Array.from({ length: GEMS[r] }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  ) : null;
}

/**
 * Painted item image (DESIGN.md item-image): frame and diamonds in the rarity colour, number at the bottom
 * (upgrade +n, else charges n/m for multi-use items, else the rune tier). Rarity as in loot: instanceRarity.
 */
export function ItemImage({ data, item, size = 44, rarity, label, bare, class: cls }: ItemImageProps) {
  const d = itemDef(data, item);
  const inst = typeof item === 'string' ? undefined : item;
  const r = rarityOfItem(data, item, rarity);
  const tier = data.runes[d.id]?.tier;
  const num =
    inst && inst.upgrade > 0
      ? `+${inst.upgrade}`
      : d.charges && d.charges > 1
        ? `${inst?.charges ?? d.charges}/${d.charges}`
        : tier !== undefined
          ? String(tier)
          : undefined;
  const small = size < 36;
  return (
    <span
      class={`hc-item-image is-${r} ${small ? 'is-small' : ''} ${bare ? 'is-bare' : ''} ${cls ?? ''}`}
      style={{ '--hc-item-size': `${size}px` }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
    >
      <img src={itemImageSrc(d)} alt="" draggable={false} />
      {!bare && <Gems r={r} />}
      {num && !small && !bare && <span class="hc-item-image__num">{num}</span>}
    </span>
  );
}

/**
 * Pill with image and name (DESIGN.md Item-Chip): the rarity colour sits on the pill's border and the diamonds on its
 * corner; the image inside has no frame of its own, so an item never shows two frames.
 */
export function ItemChip({ data, item, name, size = 22, rarity, class: cls }: { data: GameData; item: ItemInstance | string; name: string; size?: number; rarity?: Rarity | 'relic'; class?: string }) {
  const r = rarityOfItem(data, item, rarity);
  return (
    <span class={`hc-item-chip is-${r} ${cls ?? ''}`}>
      <ItemImage data={data} item={item} size={size} rarity={r} bare />
      <span class="hc-item-chip__name">{name}</span>
      <Gems r={r} />
    </span>
  );
}
