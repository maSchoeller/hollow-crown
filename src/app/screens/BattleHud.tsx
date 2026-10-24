/** Battle HUD in style B (concept/25-ux/DESIGN.md, mockup 02): phase pills, unit card with medallion, dock, context band, forecast. */
import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  computeStats,
  ruleOn,
  type ActionOption,
  type BattleState,
  type BattleUnit,
  type ClassPreview,
  type Forecast,
  type PassivePreview,
  type GameData,
  type ItemInstance,
  type SideObjectiveDef,
  type Team,
} from '../../core';
import { sideObjectiveDone, sideObjectiveProgress } from '../../core/battle/objectives';
import { t } from '../../i18n';
import { ElementIcon, Icon, TriMark } from '../../ui/icons';
import { itemName, unitName } from '../../ui/components';
import { asset } from '../../ui/asset';
import { ItemChip } from '../../ui/pieces';
import { artId } from './unitArt';
import '../../ui/hud.css';

const teamClass = (team: Team) => (team === 'enemy' ? 'is-enemy' : team === 'other' ? 'is-other' : 'is-player');

// ------------------------------------------------------------------ medallion

/** Starts loading the heads of a battle's units so medallions do not pop in when a unit is selected. */
export function preloadHeads(units: Array<{ portrait?: string; classId?: string }>): void {
  for (const id of new Set(units.map((u) => artId(u.portrait, u.classId)))) if (id) new Image().src = asset(`avatars/${id}.webp`);
}

/** Round head image; falls back to the initial when a character has no head yet. */
export function Head({ portrait, classId, name, class: cls = '' }: { portrait?: string; classId?: string; name: string; class?: string }) {
  const id = artId(portrait, classId);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [id]);
  if (!id || failed) return <span class={`hud-head hud-head--initial ${cls}`}>{name.slice(0, 1)}</span>;
  return <img class={`hud-head ${cls}`} src={asset(`avatars/${id}.webp`)} alt="" draggable={false} onError={() => setFailed(true)} />;
}

/** Medallion (DESIGN.md): round head, HP ring in the team colour, level pill below; downed units grey, spent units dashed. */
export function Medallion({ u, hp, max, size = 78, level = true }: { u: BattleUnit; hp: number; max: number; size?: number; level?: boolean }) {
  const pct = u.downed ? 0 : Math.max(0, Math.min(100, (hp / Math.max(1, max)) * 100));
  return (
    <span
      class={`hud-medal ${teamClass(u.team)} ${u.downed ? 'is-down' : ''} ${u.acted && u.team === 'player' ? 'is-spent' : ''}`}
      style={{ '--hud-size': `${size}px`, '--hud-hp': `${pct}%` }}
    >
      <span class="hud-medal__face">
        <Head portrait={u.portrait} classId={u.classId} name={unitName(u)} />
      </span>
      {level && (
        <span class="hud-medal__lv">
          {t('ui.lv')} {u.level}
        </span>
      )}
    </span>
  );
}

// ------------------------------------------------------------------ top

export function PhasePill({ turn, phase }: { turn: number; phase: Team }) {
  return (
    <div class={`hc-piece hud-phase ${teamClass(phase)}`}>
      <span class="hud-badge">{turn}</span>
      <span class="hud-phase__title">{t(`ui.phase.${phase}`)}</span>
    </div>
  );
}

export function TurnPill({ turn, phase, goal, progress, onClick }: { turn: number; phase: Team; goal: string; progress: string; onClick: () => void }) {
  return (
    <button type="button" class="hc-piece hud-turn" onClick={onClick} aria-label={t('ui.obj.title')}>
      <span class="hud-badge">{turn}</span>
      <span class="hud-turn__text">
        <span class={`hud-l1 ${teamClass(phase)}`}>
          {t('ui.hud.round', { n: turn })} · {t(`ui.phase.${phase}`)}
        </span>
        <b class="hud-l2">
          {goal}
          {progress && <span class="hud-l2__more"> · {progress}</span>}
        </b>
      </span>
    </button>
  );
}

export function MenuStone({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" class="hc-piece hud-round" onClick={onClick} aria-label={t('ui.menu')}>
      <Icon name="menu" size={22} />
    </button>
  );
}

const SIDE_ICON: Record<SideObjectiveDef['type'], string> = {
  visit_villages: 'visit',
  open_chests: 'chest',
  no_downs: 'rescue',
  turn_limit: 'seize',
  kill_with: 'attack',
  recruit: 'talk',
  protect_npc: 'shield',
};

/** Side objectives as pills under the round pill: icon, text, count where something is counted; done ones turn green, broken ones red. */
export function GoalPills({ data, s, side, onClick }: { data: GameData; s: BattleState; side: SideObjectiveDef[]; onClick: () => void }) {
  if (!side.length) return null;
  return (
    <div class="hud-goals">
      {side.map((o) => {
        const done = sideObjectiveDone(data, s, o);
        const p = sideObjectiveProgress(data, s, o);
        // "keep it so" objectives are done until they break; the rest counts up
        const failed = !done && (o.type === 'no_downs' || o.type === 'turn_limit');
        return (
          <button key={o.id} type="button" class={`hud-goal ${done ? 'is-done' : failed ? 'is-failed' : ''}`} onClick={onClick}>
            <Icon name={done ? 'check' : failed ? 'cross' : (SIDE_ICON[o.type] ?? 'target')} size={15} />
            <span>{t(`ui.side.${o.type}`, { turns: o.turns ?? 0 })}</span>
            {p && (
              <span class="hud-goal__count">
                {p.have}/{p.total}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Enemy phase: speed 1×, 2× and skip, bottom right. */
export function SpeedControl({ value, onChange }: { value: 1 | 2 | 3; onChange: (v: 1 | 2 | 3) => void }) {
  return (
    <div class="hc-piece hud-speed" role="group" aria-label={t('ui.hud.speed')}>
      {([1, 2, 3] as const).map((v) => (
        <button
          key={v}
          type="button"
          class={value === v ? 'is-on' : ''}
          aria-pressed={value === v}
          aria-label={v === 3 ? t('ui.hud.skipAria') : undefined}
          onClick={() => onChange(v)}
        >
          {v === 3 ? t('ui.hud.skip') : `${v}×`}
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ unit card

/** Unit card: medallion, name, class, HP as a number, weapon chip (DESIGN.md unit card). */
export function UnitCardB({ data, state, u, hp, onClick }: { data: GameData; state: BattleState; u: BattleUnit; hp: number; onClick?: () => void }) {
  const st = computeStats(data, u, { state });
  const w = u.equip.mainHand;
  const affinity = st.affinity && ruleOn(state, 'elements') ? st.affinity : undefined;
  return (
    <div class={`hc-piece hud-unit ${onClick ? 'is-click' : ''}`} onClick={onClick}>
      <Medallion u={u} hp={hp} max={st.maxHp} />
      <div class="hud-unit__body">
        <div class="hud-unit__head">
          <span class="hud-name">{unitName(u)}</span>
          <span class="hud-hp">{t('ui.hud.hp', { hp, max: st.maxHp })}</span>
        </div>
        <div class="hud-sub">{t(`class.${u.classId}.name`)}</div>
        <div class="hud-chips">
          <WeaponChip data={data} item={w} />
          {affinity && (
            <span class="hud-chip">
              <ElementIcon el={affinity} size={15} />
            </span>
          )}
          {u.downed && !u.gone && (
            <span class="hud-chip hud-chip--bleed">
              <PulseMark />
              {t('ui.hud.bleed', { n: Math.max(0, data.balance.death.bleedOutTurns - (u.bleed ?? 0)) })}
            </span>
          )}
          {u.status.map((x) => (
            <span class="hud-chip" key={x.id}>
              {t(`ui.status.${x.id}`)} {x.turns}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Pulse line of a downed unit (DESIGN.md `downed`). */
function PulseMark() {
  return (
    <svg class="hud-pulse" viewBox="0 0 24 12" width="16" height="8" aria-hidden="true">
      <path d="M1 7h5l2-5 3 9 3-7 2 3h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}

function WeaponChip({ data, item }: { data: GameData; item?: ItemInstance }) {
  return item ? (
    <ItemChip data={data} item={item} name={itemName(data, item)} />
  ) : (
    <span class="hud-chip">{t('ui.unarmed')}</span>
  );
}

/** Terrain of an empty tile as a small stone. */
export function TerrainCard({ data, s, p }: { data: GameData; s: BattleState; p: [number, number] }) {
  const terr = data.terrain[s.terrain[p[1] * s.width + p[0]]!];
  if (!terr) return null;
  return (
    <div class="hc-piece hud-terrain">
      <b class="hud-name hud-name--small">{t(`terrain.${terr.id}`)}</b>
      <span class="hud-chips">
        <span class="hud-chip">
          {t('ui.stat.def')} {terr.def}
        </span>
        <span class="hud-chip">
          {t('ui.avoid')} {terr.avoid}
        </span>
        {terr.heal ? (
          <span class="hud-chip">
            {t('ui.heal')} {terr.heal}%
          </span>
        ) : null}
      </span>
    </div>
  );
}

// ------------------------------------------------------------------ context band

export type ContextKind = 'rescue' | 'talk' | 'visit' | 'chest' | 'door' | 'seize' | 'escape' | 'trade' | 'convoy';
/** Order of the context bands above the unit card. */
export const CONTEXT_ORDER: ContextKind[] = ['rescue', 'talk', 'visit', 'chest', 'door', 'seize', 'escape', 'trade', 'convoy'];

/** Green band above the unit card for what the target tile allows besides fighting; one tap runs it (DESIGN.md context-band). */
export function ContextBand({ opt, target, onGo }: { opt: ActionOption; target?: BattleUnit; onGo: () => void }) {
  const kind = opt.kind as ContextKind;
  const name = target ? unitName(target) : '';
  const person = kind === 'rescue' || kind === 'talk' || kind === 'trade';
  // with several possible partners the band names the action only; the target is picked on the board
  const title = person ? (target ? t(`ui.ctx.${kind}`, { name }) : t(`ui.action.${kind}`)) : t(`ui.ctx.${kind}`);
  return (
    <button type="button" class="hc-piece hud-ctx" onClick={onGo}>
      <span class="hud-ctx__mini">{target ? <Head portrait={target.portrait} classId={target.classId} name={name} /> : <Icon name={kind} size={22} />}</span>
      <span class="hud-ctx__text">
        <b>{title}</b>
        {kind === 'rescue' && <small>{t('ui.ctx.rescueSub')}</small>}
      </span>
      <span class="hud-ctx__go">{t(`ui.action.${kind}`)}</span>
    </button>
  );
}

// ------------------------------------------------------------------ dock

/** Role symbol of a class for the dimmed class slot until the role model brings real class actions (story 2.2/2.3). */
const ROLE_ICON: Record<string, string> = {
  vanguard: 'shield',
  skirmisher: 'blade',
  captain: 'rally',
  marksman: 'bow',
  elementalist: 'fire',
  healer: 'healer',
  tactician: 'target',
};
/** Role symbol by the class's role, so pro classes show the icon of their base role. */
export const roleIcon = (role: string): string => ROLE_ICON[role] ?? 'star';

export function DockAction({
  icon,
  label,
  sub,
  variant,
  dim,
  on,
  state,
  onClick,
}: {
  icon: string;
  label: string;
  sub?: ComponentChildren;
  variant?: 'primary' | 'class' | 'ink';
  /** impossible right now: dimmed, never hidden; a tap still answers with the reason */
  dim?: boolean;
  on?: boolean;
  /** passive role: the symbol shows a state (`ready` / `active`) instead of a button; a tap explains the rule */
  state?: 'ready' | 'active';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      class={`hud-act ${variant ? `is-${variant}` : ''} ${dim ? 'is-dim' : ''} ${on ? 'is-on' : ''} ${state ? `is-state ${state === 'active' ? 'is-active' : ''}` : ''}`}
      aria-disabled={dim || undefined}
      aria-pressed={on}
      onClick={onClick}
    >
      <Icon name={icon} size={26} />
      <span>{label}</span>
      {sub !== undefined && <small>{sub}</small>}
    </button>
  );
}

export function Dock({ three, children }: { three?: boolean; children: ComponentChildren }) {
  return <div class={`hud-dock ${three ? 'is-three' : ''}`}>{children}</div>;
}

export function BackPill({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" class="hc-piece hud-back" onClick={onClick}>
      <Icon name="back" size={18} />
      {t('ui.back')}
    </button>
  );
}

export function HintPill({ children, reason }: { children: ComponentChildren; reason?: boolean }) {
  return <div class={`hc-piece hud-hint ${reason ? 'is-reason' : ''}`}>{children}</div>;
}

// ------------------------------------------------------------------ forecast

/**
 * Combat forecast in style B: both sides with medallion, weapon and chips (triangle, element, effective), the numbers
 * of the resolution (core `forecast`, never a copy), HP after, and tandem/guard/status as chips.
 */
export function ForecastCard({
  data,
  state,
  f,
  aim,
}: {
  data: GameData;
  state: BattleState;
  f: Forecast;
  /** class action Zielen: its bonuses are shown as a chip, the numbers in `f` already contain them */
  aim?: { hit: number; rangeBonus: number };
}) {
  const a = state.units.find((u) => u.uid === f.attacker.uid)!;
  const d = state.units.find((u) => u.uid === f.defender.uid)!;
  const aw = f.attacker.weaponUid ? [a.equip.mainHand, ...a.bag].find((i) => i?.uid === f.attacker.weaponUid) : undefined;
  const dw = d.equip.mainHand;
  const elements = ruleOn(state, 'elements');
  const who = (s: Forecast['attacker'], u: BattleUnit, w: ItemInstance | undefined, right: boolean) => (
    <div class={`hud-fc__who ${right ? 'is-right' : ''}`}>
      <Medallion u={u} hp={s.hpBefore} max={s.maxHp} size={52} level={false} />
      <div class="hud-fc__id">
        <span class="hud-name hud-name--small">{unitName(u)}</span>
        <span class="hud-chips">
          <WeaponChip data={data} item={w} />
          {s.triangle !== 0 && (
            <span class={`hud-chip ${s.triangle > 0 ? 'is-adv' : 'is-dis'}`}>
              <TriMark v={s.triangle} />
              {t(s.triangle > 0 ? 'ui.fc.advantage' : 'ui.fc.disadvantage')}
            </span>
          )}
          {s.effective && <span class="hud-chip is-gold">{t('ui.effective')}</span>}
          {elements && s.element && s.elementMult !== 1 && (
            <span class={`hud-chip ${s.elementMult > 1 ? 'is-adv' : 'is-dis'}`}>
              <ElementIcon el={s.element} size={14} />
              {s.elementMult > 1 ? '+' : ''}
              {Math.round((s.elementMult - 1) * 100)}%
            </span>
          )}
        </span>
      </div>
    </div>
  );
  const val = (s: Forecast['attacker'], k: 'dmg' | 'hit' | 'crit') => {
    if (!s.canStrike) return <span class="hud-fc__val is-none">–</span>;
    if (k === 'dmg')
      return (
        <span class="hud-fc__val">
          {s.damage}
          {s.strikes > 1 && <small class="hud-fc__mult">×{s.strikes}</small>}
        </span>
      );
    return (
      <span class="hud-fc__val">
        {k === 'hit' ? s.hit : s.crit}
        <small>%</small>
      </span>
    );
  };
  const hpCell = (s: Forecast['attacker'], u: BattleUnit, after: number) => (
    <span class="hud-fc__hp">
      <span class="hud-hp">
        {s.hpBefore} → {after}
      </span>
      <span class={`hud-bar ${teamClass(u.team)}`}>
        <i class="hud-bar__keep" style={{ width: `${Math.max(0, Math.min(100, (after / Math.max(1, s.maxHp)) * 100))}%` }} />
        <i class="hud-bar__loss" style={{ width: `${Math.max(0, Math.min(100, (s.hpBefore / Math.max(1, s.maxHp)) * 100))}%` }} />
      </span>
    </span>
  );
  const tandem = f.tandem ? state.units.find((u) => u.uid === f.tandem!.uid) : undefined;
  const guard = f.guard ? state.units.find((u) => u.uid === f.guard!.uid) : undefined;
  return (
    <div class="hc-piece hud-fc">
      <div class="hud-fc__head">
        {who(f.attacker, a, aw, false)}
        <span class="hud-l1">{t('ui.fc.vs')}</span>
        {who(f.defender, d, dw, true)}
      </div>
      <div class="hud-fc__table">
        <div class="hud-fc__row">
          {val(f.attacker, 'dmg')}
          <span class="hud-l1">{t('ui.dmg')}</span>
          {val(f.defender, 'dmg')}
        </div>
        <div class="hud-fc__row">
          {val(f.attacker, 'hit')}
          <span class="hud-l1">{t('ui.hit')}</span>
          {val(f.defender, 'hit')}
        </div>
        <div class="hud-fc__row">
          {val(f.attacker, 'crit')}
          <span class="hud-l1">{t('ui.crit')}</span>
          {val(f.defender, 'crit')}
        </div>
        <div class="hud-fc__row">
          {hpCell(f.attacker, a, f.attackerHpAfter)}
          <span class="hud-l1">{t('ui.fc.hpAfter')}</span>
          {hpCell(f.defender, d, f.defenderHpAfter)}
        </div>
      </div>
      <div class="hud-chips hud-fc__notes">
        {aim && (
          <span class="hud-chip is-gold">
            <Icon name="aim" size={14} />
            {t('ui.action.aim')}: {t('ui.fc.aim', { range: aim.rangeBonus, hit: aim.hit })}
          </span>
        )}
        {f.attacker.status
          .filter((x) => x.chance > 0)
          .map((x) => (
            <span class="hud-chip" key={x.status}>
              {t(`ui.status.${x.status}`)} {x.chance}%
            </span>
          ))}
        {tandem && (
          <span class="hud-chip is-gold">
            {t('ui.tandem')}: {unitName(tandem)} ({f.tandem!.damage} · {f.tandem!.hit}%)
          </span>
        )}
        {guard && (
          <span class="hud-chip">
            {t('ui.guard')}: {unitName(guard)} {f.guard!.chance}%
          </span>
        )}
      </div>
    </div>
  );
}

/** Preview of Fernbergen and Anfeuern: who is affected and what changes, from the numbers of the resolution. */
export function ClassPreviewCard({ data, state, p }: { data: GameData; state: BattleState; p: ClassPreview }) {
  if (p.kind === 'aim') return null;
  const target = state.units.find((u) => u.uid === p.target)!;
  const base = computeStats(data, target);
  return (
    <div class="hc-piece hud-fc">
      <div class="hud-fc__head">
        <Medallion u={target} hp={target.hp} max={base.maxHp} size={52} level={false} />
        <div class="hud-fc__id">
          <span class="hud-name hud-name--small">{unitName(target)}</span>
          <span class="hud-chips">
            {p.kind === 'cheer' ? (
              <>
                <span class="hud-chip is-adv">
                  +{p.mov} {t('ui.stat.mov')}
                </span>
                <span class="hud-chip is-adv">
                  +{p.hit} {t('ui.hit')}
                </span>
              </>
            ) : (
              <span class="hud-chip is-adv">{t('ui.preview.farRescue', { n: p.distance })}</span>
            )}
          </span>
        </div>
      </div>
      <p class="hud-sub">{p.kind === 'cheer' ? t('ui.preview.cheer') : t('ui.preview.farRescueText')}</p>
    </div>
  );
}

/** Rule card of a passive role (Halten, Nachsetzen): the rule in words and what it means on the tile the unit would stand on. */
export function PassiveRuleCard({ p }: { p: PassivePreview }) {
  return (
    <div class="hc-piece hud-fc">
      <div class="hud-fc__head">
        <Icon name={p.kind === 'hold' ? 'shield' : 'blade'} size={34} />
        <span class="hud-name hud-name--small">{t(`ui.passive.${p.kind}.name`)}</span>
        <span class="hud-chips">
          <span class="hud-chip is-adv">{p.kind === 'hold' ? t('ui.passive.hold.zone', { n: p.tiles.length }) : t('ui.passive.pursue.left', { n: p.left })}</span>
        </span>
      </div>
      <p class="hud-sub">{t(`ui.passive.${p.kind}.rule`)}</p>
    </div>
  );
}

// ------------------------------------------------------------------ roster (left panel, from 1024 px)

export function RosterPanel({
  data,
  s,
  hp,
  onPick,
}: {
  data: GameData;
  s: BattleState;
  hp: Record<string, number>;
  onPick: (u: BattleUnit) => void;
}) {
  return (
    <div class="hud-roster">
      <h3 class="hud-l1">{t('ui.battle.company')}</h3>
      {s.units
        .filter((u) => u.team === 'player' && u.pos && !u.gone)
        .map((u) => (
          <button key={u.uid} type="button" class="hc-piece hud-roster__row" onClick={() => onPick(u)}>
            <Medallion u={u} hp={hp[u.uid] ?? u.hp} max={computeStats(data, u).maxHp} size={48} level={false} />
            <span class="hud-roster__text">
              <span class="hud-name hud-name--small">{unitName(u)}</span>
              <span class="hud-sub">
                {t('ui.lv')} {u.level} · {t('ui.hud.hp', { hp: hp[u.uid] ?? u.hp, max: computeStats(data, u).maxHp })}
              </span>
            </span>
          </button>
        ))}
    </div>
  );
}
