/**
 * Tile card of the battle HUD (story 16.11, DESIGN.md tile-card): what a field does (effect chips), and what it costs a figure to walk there.
 * The cost comes from `unitTileCost` (core `moveCost` with the figure's skills), the other move types from `otherMoveCosts`; never read from terrain.yaml here.
 */
import { type BattleState, type BattleUnit, type GameData, type MoveType, type Pos, costLabel, levelAt, lensKinds, otherMoveCosts, terrainAt, tileEffects, unitTileCost } from '../../core';
import type { TileEffect } from '../../core';
import { t } from '../../i18n';
import { Icon } from '../../ui/icons';
import { unitName } from '../../ui/components';
import { HelpStone } from './HelpStone';
import { LensSwatch, lensVars } from './TerrainLens';
import './TileCard.css';

/** Line icon of a move type (the boot for walking). */
export const MOVE_ICON: Record<MoveType, string> = { foot: 'boot', armored: 'armored', mounted: 'mounted', flier: 'flier', monster: 'danger' };

const EFFECT_ICON: Record<TileEffect['kind'], string> = { def: 'shield', avoid: 'avoid', heal: 'healer', enterDamage: 'danger', flammable: 'fire' };

/** "+2", "-10", "20 %": the number of an effect chip. */
function effectValue(e: TileEffect): string {
  if (e.value === undefined) return '';
  if (e.kind === 'heal') return `${e.value} %`;
  if (e.kind === 'enterDamage') return String(e.value);
  return e.value > 0 ? `+${e.value}` : String(e.value);
}

function EffectChip({ e }: { e: TileEffect }) {
  const label = t(`ui.tile.${e.kind}`);
  const value = effectValue(e);
  return (
    <span class={`tile-chip ${e.good ? 'is-good' : 'is-bad'}`}>
      <Icon name={EFFECT_ICON[e.kind]} size={13} />
      {label}
      {value && <b>{value}</b>}
    </span>
  );
}

/** Stone above the dock: the field, its effects and the cost for `unit` (the chosen figure, else the next ready one; none = no cost line). */
export function TileCard({ data, s, p, unit }: { data: GameData; s: BattleState; p: Pos; unit?: BattleUnit }) {
  const id = terrainAt(s, p);
  if (!data.terrain[id]) return null;
  const kinds = lensKinds(data, id);
  const level = levelAt(data, s, p);
  const effects = tileEffects(data, s, p);
  const own = unit ? data.classes[unit.classId]!.moveType : null;
  const cost = unit ? unitTileCost(data, s, unit, p) : null;
  return (
    <div class="hc-piece tile-card" style={lensVars(data)}>
      <div class="tile-card__head">
        <span class="tile-card__img" aria-hidden="true">
          <LensSwatch kind={kinds[0] ?? 'neutral'} size={34} />
        </span>
        <div class="tile-card__body">
          <b class="hud-name hud-name--small">{t(`terrain.${id}`)}</b>
          <span class="tile-card__chips">
            {level > 0 && <span class="tile-chip">{t('ui.heightLevel', { n: level })}</span>}
            {effects.map((e) => (
              <EffectChip key={e.kind} e={e} />
            ))}
          </span>
        </div>
        <HelpStone anchor={`terrain.${id}`} />
      </div>
      {unit && own && (
        <div class="tile-card__move">
          {cost === null ? (
            <span class="tile-card__cost is-blocked">
              <Icon name="lock" size={14} />
              {t('ui.tile.blocked', { name: unitName(unit) })}
            </span>
          ) : (
            <span class="tile-card__cost">
              <Icon name={MOVE_ICON[own]} size={14} />
              {t('ui.tile.cost', { name: unitName(unit), n: costLabel(cost) })}
            </span>
          )}
          <span class="tile-card__others" role="group" aria-label={t('ui.tile.otherTypes')}>
            {otherMoveCosts(data, s, p, own).map((o) => (
              <span key={o.moveType} class={o.cost === null ? 'is-blocked' : ''}>
                <Icon name={MOVE_ICON[o.moveType]} size={11} />
                {t(`ui.moveType.${o.moveType}`)} {o.cost === null ? '–' : costLabel(o.cost)}
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}
