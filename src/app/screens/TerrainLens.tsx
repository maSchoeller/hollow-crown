/** Terrain lens of the battle board (story 16.11): the legend under the top bar, the one-time hint and the swatch colours shared with the tile card. */
import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { type GameData, type LensKind, costLabel } from '../../core';
import { t } from '../../i18n';
import { Icon } from '../../ui/icons';
import { coachSeen, markCoachSeen } from '../state/coachHints';
import { HelpStone } from './HelpStone';
import './TerrainLens.css';

/** Colour of a lens tint as the board draws it (colour at its opacity), from render.yaml `legibility.terrainLens`. */
const tint = (c: { color: string; alpha: number }) => `color-mix(in srgb, ${c.color} ${Math.round(c.alpha * 100)}%, transparent)`;

/** Custom properties of the lens colours for the swatches of the legend and the tile card; one source with the board. */
export function lensVars(data: GameData): JSX.CSSProperties {
  const l = data.render.legibility.terrainLens;
  return {
    '--lens-cover': tint(l.cover),
    '--lens-slow': tint(l.slow),
    '--lens-harm': tint(l.harm),
    '--lens-fast': tint(l.fast),
    '--lens-blocked': tint(l.blocked),
    '--lens-neutral': tint(l.neutral),
  } as JSX.CSSProperties;
}

/** The small pattern of a lens effect (13 px), as on the board. */
export function LensSwatch({ kind, size }: { kind: LensKind | 'neutral'; size?: number }) {
  return <i class={`lens-sw is-${kind}`} style={size ? { width: `${size}px`, height: `${size}px` } : undefined} aria-hidden="true" />;
}

/** Cream pill under the top bar: names the effects that occur on this map, with their pattern. */
export function LensLegend({ data, kinds }: { data: GameData; kinds: readonly LensKind[] }) {
  if (!kinds.length) return null;
  return (
    <div class="hc-piece lens-legend" role="group" aria-label={t('ui.lens.legend')} style={lensVars(data)}>
      {kinds.map((k) => (
        <span key={k} class="lens-legend__item">
          <LensSwatch kind={k} />
          {t(`ui.lens.kind.${k}`)}
        </span>
      ))}
      <HelpStone anchor="terrainLens" class="lens-legend__help" />
    </div>
  );
}

/**
 * A hint that shows once, ever (`coachHints`): true for `ms` after `ready` first holds while the hint was not seen before.
 * It is marked seen at the moment it shows, so a reload does not bring it back.
 */
export function useCoachHint(id: string, ready: boolean, ms: number): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ready || coachSeen(id)) return;
    // seen only once it stood its full time: a dialogue or a tap that ends it early lets it come back
    setShown(true);
    const timer = setTimeout(() => {
      markCoachSeen(id);
      setShown(false);
    }, ms);
    return () => {
      clearTimeout(timer);
      setShown(false);
    };
  }, [ready]);
  return shown;
}

/** "noch n": the movement left at the end of the planned path, an ember pill with the boot (n in whole points, halves as "½"). */
export function RestPill({ rest }: { rest: number }) {
  return (
    <span class="lens-rest">
      <Icon name="boot" size={12} />
      {t('ui.pathRest', { n: costLabel(rest) })}
    </span>
  );
}
