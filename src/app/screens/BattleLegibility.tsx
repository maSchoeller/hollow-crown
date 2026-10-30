/**
 * HUD pieces of epic 13 "Kampf lesbar machen" (EXPERIENCE.md, DESIGN.md): the target-tile pill, the terrain chip at the chosen
 * field, the foe-phase recap stone and the enemy strip. Numbers come from core functions (`tileThreats`, `phaseRecap`); these
 * components only show them.
 */
import { useRef } from 'preact/hooks';
import type { BattleState, BattleUnit, GameData, Pos, RecapRow } from '../../core';
import { maxHpOf, onMap, active } from '../../core';
import { t } from '../../i18n';
import { unitName } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { SecondaryButton } from '../../ui/pieces';
import { Head } from './BattleHud';
import './BattleLegibility.css';

/** "⚠ n Gegner erreichen dieses Feld" under the goal pills (story 13.6); nothing at 0, cream at 1, light red from 2. */
export function ThreatPill({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <div class={`hc-piece lg-threat ${n >= 2 ? 'is-many' : ''}`} role="status">
      <Icon name="danger" size={16} />
      <span>{t('ui.threat.reach', { count: n })}</span>
    </div>
  );
}

/** Terrain chip at the chosen field (story 13.6): terrain name, defence, avoid and healing as symbol + number from terrain.yaml. */
export function TerrainChip({ data, s, p }: { data: GameData; s: BattleState; p: Pos }) {
  const terr = data.terrain[s.terrain[p[1] * s.width + p[0]]!];
  if (!terr) return null;
  const val = (icon: string, label: string, v: number, unit = '') => (
    <span class={`lg-chip__val ${v > 0 ? 'is-plus' : ''}`} title={label}>
      <Icon name={icon} size={13} label={label} />
      {v}
      {unit}
    </span>
  );
  return (
    <span class="hc-piece lg-chip">
      <b>{t(`terrain.${terr.id}`)}</b>
      {val('shield', t('ui.stat.def'), terr.def)}
      {val('avoid', t('ui.avoid'), terr.avoid)}
      {terr.heal ? val('healer', t('ui.heal'), terr.heal, '%') : null}
    </span>
  );
}

/** One line of the recap: who, what happened, and the number at the right. */
function recapText(row: RecapRow, name: string): { line: string; sub?: string; num?: string; cls?: string } {
  switch (row.kind) {
    case 'downed':
      return { line: t('ui.recap.downed', { name }), sub: row.left === null ? undefined : t('ui.recap.bleeds', { count: row.left }), cls: 'is-down' };
    case 'died':
      return { line: t('ui.recap.died', { name }), cls: 'is-down' };
    case 'hit':
      return row.dodged
        ? { line: t('ui.recap.dodged', { name }), num: '0', cls: 'is-plus' }
        : { line: t('ui.recap.hit', { name }), sub: t('ui.recap.hp', { before: row.before, after: row.after }), num: `−${row.before - row.after}`, cls: 'is-minus' };
    case 'reinforce':
      return { line: t('ui.recap.reinforce', { name }) };
    case 'woke':
      return { line: t('ui.recap.woke', { name }) };
  }
}

/**
 * Stone over the unit card right after a foe phase (story 13.7): "Gegnerphase n" and one line per event; a tap on a line or on
 * "Figur zeigen" glides the camera there. Never blocks: the first tap on the board closes it.
 */
export function RecapStone({ turn, rows, units, onShow, onClose }: { turn: number; rows: RecapRow[]; units: BattleUnit[]; onShow: (at: Pos) => void; onClose: () => void }) {
  const unitOf = (uid: string) => units.find((u) => u.uid === uid);
  const where = (row: RecapRow): Pos | null => (row.kind === 'reinforce' || row.kind === 'woke' ? row.at : null) ?? unitOf(row.unit)?.pos ?? null;
  const first = rows.map(where).find((p): p is Pos => !!p);
  return (
    <div class="hc-piece lg-recap" role="status" aria-live="polite">
      <div class="lg-recap__head">
        <b class="lg-recap__title">{t('ui.recap.title', { n: turn })}</b>
        <button type="button" class="lg-recap__close" onClick={onClose} aria-label={t('ui.close')}>
          <Icon name="close" size={16} />
        </button>
      </div>
      <div class="lg-recap__rows">
        {rows.map((row, i) => {
          const u = unitOf(row.unit);
          const name = u ? unitName(u) : '';
          const txt = recapText(row, name);
          const at = where(row);
          return (
            <button key={i} type="button" class={`lg-recap__row ${txt.cls ?? ''}`} disabled={!at} onClick={() => at && onShow(at)}>
              <span class={`lg-recap__face ${u ? `is-${u.team}` : ''}`}>{u && <Head portrait={u.portrait} classId={u.classId} name={name} />}</span>
              <span class="lg-recap__text">
                <b>{txt.line}</b>
                {txt.sub && <small>{txt.sub}</small>}
              </span>
              {txt.num && <span class="lg-recap__num">{txt.num}</span>}
            </button>
          );
        })}
      </div>
      {first && (
        <div class="lg-recap__foot">
          <SecondaryButton onClick={() => onShow(first)}>{t('ui.recap.show')}</SecondaryButton>
        </div>
      )}
    </div>
  );
}

/** The foes the enemy strip shows (story 13.8): every visible active foe, lieutenants first. */
export function stripFoes(s: BattleState): BattleUnit[] {
  const foes = s.units.filter((u) => u.team === 'enemy' && onMap(u) && active(u));
  return [...foes.filter((u) => u.lieutenant), ...foes.filter((u) => !u.lieutenant)];
}

/**
 * Enemy strip (story 13.8, option, default off): small medallions of all visible foes with HP ring and HP number, lieutenants with
 * a gold ring first. A tap glides the camera to the foe, a long press opens its info; the row scrolls sideways when it is long.
 */
export function EnemyStrip({ data, s, hp, onCenter, onInfo, side }: { data: GameData; s: BattleState; hp: Record<string, number>; onCenter: (u: BattleUnit) => void; onInfo: (u: BattleUnit) => void; side?: boolean }) {
  const press = useRef<{ uid: string; timer: number; long: boolean } | null>(null);
  const foes = stripFoes(s);
  if (!foes.length) return null;
  const down = (u: BattleUnit) => {
    if (press.current) clearTimeout(press.current.timer);
    const p = { uid: u.uid, long: false, timer: 0 };
    p.timer = window.setTimeout(() => {
      p.long = true;
      onInfo(u);
    }, 400);
    press.current = p;
  };
  const up = (u: BattleUnit) => {
    const p = press.current;
    press.current = null;
    if (!p || p.uid !== u.uid) return;
    clearTimeout(p.timer);
    if (!p.long) onCenter(u);
  };
  const leave = () => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  };
  return (
    <div class={`lg-strip ${side ? 'is-side' : ''}`} aria-label={t('ui.strip.label')}>
      {foes.map((u) => {
        const max = maxHpOf(data, s, u);
        const now = hp[u.uid] ?? u.hp;
        return (
          <button
            key={u.uid}
            type="button"
            class={`lg-strip__foe ${u.lieutenant ? 'is-lt' : ''}`}
            style={{ '--lg-hp': `${Math.max(0, Math.min(100, (now / Math.max(1, max)) * 100))}%` }}
            aria-label={`${unitName(u)} ${t('ui.hud.hp', { hp: now, max })}`}
            onPointerDown={() => down(u)}
            onPointerUp={() => up(u)}
            onPointerLeave={leave}
            onPointerCancel={leave}
            onContextMenu={(e) => e.preventDefault()}
          >
            <span class="lg-strip__face">
              <Head portrait={u.portrait} classId={u.classId} name={unitName(u)} />
            </span>
            <i class="lg-strip__hp">{now}</i>
          </button>
        );
      })}
    </div>
  );
}
