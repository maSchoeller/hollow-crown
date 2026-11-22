/**
 * Element band of the combat forecast (story 16.12, DESIGN.md `element-band`): rune stone at the weapon chip, the band above the table,
 * the factor mark at the damage number and the status line below. Everything is read from the forecast (`SideForecast`): the factor,
 * rune tier, guard and status rounds come from the core and are never calculated here.
 */
import type { Element, GameData, SideForecast } from '../../core';
import { t } from '../../i18n';
import { Icon } from '../../ui/icons';
import { HelpStone } from './HelpStone';
import './ElementBand.css';

/** Rune stone: circle in the element colour with the tier as roman numeral. */
export function RuneStone({ element, tier }: { element: Element; tier: number }) {
  return (
    <span class={`hc-rune el-bg-${element}`} role="img" aria-label={`${t(`ui.element.${element}`)}, ${t('ui.fc.runeTier', { n: tier })}`}>
      {t(`ui.fc.roman.${Math.min(3, Math.max(1, tier))}`)}
    </span>
  );
}

/** Element as a circle with its line icon. */
function ElementDisc({ element, size }: { element: Element; size: number }) {
  return (
    <span class={`hc-eldisc el-bg-${element}`} style={{ width: `${size}px`, height: `${size}px` }} aria-hidden="true">
      <Icon name={element} size={size - 6} />
    </span>
  );
}

/** Small factor mark at a damage number (green above 1, red below). */
export function ElementFactor({ mult }: { mult: number }) {
  if (mult === 1) return null;
  return <small class={`hc-factor ${mult > 1 ? 'is-pos' : 'is-neg'}`}>{t('ui.fc.factor', { n: mult })}</small>;
}

/** Chip of the protection a target carries (armor or shield rune). */
export function GuardChip({ guard }: { guard: NonNullable<SideForecast['guard']> }) {
  return (
    <span class="hud-chip hc-guard">
      <Icon name={guard.source === 'shield' ? 'shield' : 'armored'} size={14} />
      {t(`ui.fc.guard.${guard.source}`)}
      <RuneStone element={guard.element} tier={guard.tier} />
    </span>
  );
}

/** Band between head and table: who beats whom and the damage factor. Nothing without a weapon element or without the elements mechanic. */
export function ElementBand({ side, enabled }: { side: SideForecast; enabled: boolean }) {
  const el = side.element;
  if (!enabled || !el || !side.canStrike) return null;
  const mult = side.elementMult;
  const g = side.guard?.element;
  const a = t(`ui.element.${el}`);
  const d = g ? t(`ui.element.${g}`) : '';
  let tone: 'pos' | 'neg' | 'neutral' = 'neutral';
  let text: string;
  if (mult === 1) text = t('ui.fc.band.neutral', { a });
  else if (mult > 1) {
    tone = 'pos';
    text = g ? t('ui.fc.band.beats', { a, d }) : t('ui.fc.band.alone', { a });
  } else {
    tone = 'neg';
    text = !g ? t('ui.fc.band.alone', { a }) : g === el ? t('ui.fc.band.same', { a, d }) : t('ui.fc.band.resists', { a, d });
  }
  return (
    <div class={`hc-band is-${tone}`}>
      <ElementDisc element={el} size={18} />
      {tone !== 'neutral' && g && g !== el && <ElementDisc element={g} size={18} />}
      <span class="hc-band__text">
        {text}
        {mult !== 1 && (
          <>
            {' · '}
            <b class="hc-band__mult">{t('ui.fc.band.damage', { n: mult })}</b>
          </>
        )}
      </span>
      <HelpStone anchor="elements" />
    </div>
  );
}

/** Status line below the table: chance, status, rounds and (burning) damage per round, from `statusTurns` of the forecast. */
export function StatusLine({ data, side, knockbackBlocked }: { data: GameData; side: SideForecast; knockbackBlocked?: boolean }) {
  if (!side.canStrike) return null;
  const rows = side.status.filter((x) => x.chance > 0);
  if (!rows.length) return null;
  return (
    <>
      {rows.map((x) => {
        const el = Object.entries(data.balance.element.statusOf).find(([, st]) => st === x.status)?.[0] as Element | undefined;
        const turns = side.statusTurns?.find((y) => y.status === x.status);
        return (
          <div class="hc-statusline" key={x.status}>
            {el && <ElementDisc element={el} size={18} />}
            <span class="hc-statusline__text">
              <b>{t('ui.fc.status', { chance: x.chance, status: t(`ui.status.${x.status}`) })}</b>
              {turns && (
                <>
                  <span class="hc-statusline__amount" role="img" aria-label={t('ui.fc.statusRounds', { n: turns.rounds })}>
                    <Icon name="turns" size={13} />
                    {turns.rounds}
                  </span>
                  {turns.perRound !== undefined && (
                    <span class="hc-statusline__amount" role="img" aria-label={t('ui.fc.statusHp', { n: turns.perRound })}>
                      <Icon name="hp" size={13} />
                      {turns.perRound}
                    </span>
                  )}
                </>
              )}
              {x.status === 'knockback' && (
                <span class="hc-statusline__note">
                  {knockbackBlocked ? t('ui.fc.knockbackBlocked', { n: data.balance.status.knockbackBlockedDamage }) : t('ui.fc.knockback')}
                </span>
              )}
            </span>
            <HelpStone anchor={`status.${x.status}`} />
          </div>
        );
      })}
    </>
  );
}
