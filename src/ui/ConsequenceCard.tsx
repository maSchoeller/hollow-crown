/** Consequence card after a decision (concept/25-ux/DESIGN.md `consequence-card`, mockup 05): one line per effect. */
import type { ComponentChildren } from 'preact';
import type { ConsequenceLine, GameData } from '../core';
import { t } from '../i18n';
import { Icon } from './icons';
import { Amount, ItemImage, itemImageSrc, Piece, PrimaryButton } from './pieces';
import './consequence.css';

/** Symbol, bold sentence and explanation of one consequence; amounts as symbol + number. */
export function consequenceView(
  data: GameData,
  l: ConsequenceLine,
  head: (unit: string) => ComponentChildren,
): { icon: ComponentChildren; title: string; amount?: ComponentChildren; desc: string } {
  const unitName = (id: string) => t(id === 'avatar' ? 'unit.avatar.name' : `unit.${id}.name`);
  switch (l.kind) {
    case 'recruit':
    case 'leave':
      return { icon: head(l.unit), title: t(`ui.consequence.${l.kind}.title`, { name: unitName(l.unit) }), desc: t(`ui.consequence.${l.kind}.desc`) };
    case 'gold':
      return { icon: <img class="cq-line__img" src={itemImageSrc('gold')} alt="" draggable={false} />, title: t('ui.consequence.gold.title'), amount: <Amount resource="gold" value={l.amount} signed />, desc: t('ui.consequence.gold.desc') };
    case 'material': {
      const def = data.items[l.id];
      return {
        icon: <ItemImage data={data} item={l.id} size={40} bare />,
        title: t('ui.consequence.material.title', { name: t(`item.${l.id}.name`) }),
        amount: def ? <Amount material={def} value={l.amount} signed /> : undefined,
        desc: t('ui.consequence.material.desc'),
      };
    }
    case 'item':
      return { icon: <ItemImage data={data} item={l.def} size={40} bare />, title: t('ui.consequence.item.title', { name: t(`item.${l.def}.name`) }), desc: t('ui.consequence.item.desc') };
    case 'chronicle':
      return { icon: <Icon name="log" size={22} />, title: t('ui.consequence.chronicle.title'), desc: t('ui.consequence.chronicle.desc') };
    case 'quest': {
      const node = data.campaign.nodes.find((n) => n.id === l.node);
      return { icon: <Icon name="map" size={22} />, title: t('ui.consequence.quest.title', { name: node ? t(node.titleKey) : l.node }), desc: t('ui.consequence.quest.desc') };
    }
    case 'grudge': {
      // the lieutenant by name (no pronoun), the change as symbol + signed number, and which way he comes back (review R33)
      const name = t(data.lieutenants?.[l.lt]?.nameKey ?? `unit.${l.lt}.name`);
      const text = `${l.delta > 0 ? '+' : l.delta < 0 ? '−' : ''}${Math.abs(l.delta)}`;
      return {
        icon: <Icon name="wanted" size={22} />,
        title: t('ui.consequence.grudge.title', { name }),
        amount: (
          <span class="cq-grudge" role="img" aria-label={t('ui.consequence.grudge.amount', { delta: text })} title={t('ui.consequence.grudge.amount', { delta: text })}>
            <Icon name="wanted" size={16} />
            <span aria-hidden="true">{text}</span>
          </span>
        ),
        desc: l.delta === 0 ? '' : t(l.delta > 0 ? 'ui.consequence.grudge.up' : 'ui.consequence.grudge.down', { name }),
      };
    }
    case 'priceMod':
      return { icon: <Icon name="merchant" size={22} />, title: t('ui.consequence.priceMod.title', { pct: `${l.pct > 0 ? '+' : ''}${l.pct}` }), desc: t('ui.consequence.priceMod.desc', { act: l.act }) };
    case 'villageAid':
      return { icon: <Icon name="healer" size={22} />, title: t('ui.consequence.villageAid.title'), desc: t('ui.consequence.villageAid.desc') };
    case 'home':
      return { icon: <Icon name={l.home === 'castle' ? 'castle' : 'camp'} size={22} />, title: t('ui.consequence.home.title'), desc: t('ui.consequence.home.desc') };
    case 'noted':
      return { icon: <Icon name="log" size={22} />, title: t('ui.consequence.noted.title'), desc: t('ui.consequence.noted.desc') };
  }
}

/** The card over a veil; "Weiter" (or a tap on the veil) closes it. */
export function ConsequenceCard({
  data,
  title,
  lines,
  head,
  onClose,
}: {
  data: GameData;
  title: string;
  lines: ConsequenceLine[];
  head: (unit: string) => ComponentChildren;
  onClose: () => void;
}) {
  return (
    <div class="cq-veil" onClick={(e) => (e.stopPropagation(), e.target === e.currentTarget && onClose())}>
      <Piece class="cq-card" role="dialog" aria-modal="true" aria-labelledby="cq-title">
        <span class="hc-kick cq-card__kick">
          <i />
          {t('ui.consequence.mark')}
        </span>
        <h3 id="cq-title" class="cq-card__title">
          {title}
        </h3>
        <ul class="cq-card__lines">
          {lines.map((l, i) => {
            const v = consequenceView(data, l, head);
            return (
              <li key={i} class={`cq-line cq-line--${l.kind}`}>
                <span class="cq-line__icon">{v.icon}</span>
                <span class="cq-line__text">
                  <b>{v.title}</b>
                  {v.amount}
                  {v.amount ? ' ' : ''}
                  {v.desc}
                </span>
              </li>
            );
          })}
        </ul>
        <PrimaryButton onClick={onClose}>{t('ui.consequence.continue')}</PrimaryButton>
      </Piece>
    </div>
  );
}
