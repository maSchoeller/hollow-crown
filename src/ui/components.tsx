/** Presentational UI pieces (no app state, no renderer). */
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import {
  computeStats,
  itemDef,
  ruleOn,
  runeSlotCount,
  STAT_KEYS,
  weaponProfile,
  type BattleState,
  type BattleUnit,
  type Forecast,
  type GameData,
  type ItemInstance,
  type Team,
  type UnitRecord,
} from '../core';
import { t } from '../i18n';
import { instanceRarity } from '../core/loot';
import { ElementIcon, Icon, TriMark } from './icons';
import { Amount } from './pieces';

export const asset = (p: string): string => `${import.meta.env.BASE_URL}assets/${p}`;

export function unitName(u: { name?: string; nameKey: string }): string {
  return u.name ?? t(u.nameKey);
}

const KIND_ICON: Record<string, string> = {
  sword: 'sword', lance: 'lance', axe: 'axe', bow: 'bow', anima: 'tome', light: 'tome', dark: 'tome', staff: 'staff', breath: 'fire',
  shield: 'shield', armor: 'armor', accessory: 'ring', consumable: 'potion', key: 'key', seal: 'seal', material: 'ore', rune: 'rune', tome: 'tome',
};
/** Icon name for an item (weapon type first, then kind). */
export function itemIcon(data: GameData, inst: ItemInstance | string): string {
  const d = itemDef(data, inst);
  if (d.weaponType) return KIND_ICON[d.weaponType] ?? 'star';
  if (d.slot === 'head') return 'helm';
  return KIND_ICON[d.kind] ?? 'star';
}

export function itemName(data: GameData, inst: ItemInstance): string {
  let name = t(`item.${inst.def}.name`);
  const pre = inst.affixes.filter((a) => data.affixes[a]?.position === 'prefix').map((a) => t(`affix.${a}`));
  const suf = inst.affixes.filter((a) => data.affixes[a]?.position === 'suffix').map((a) => t(`affix.${a}`));
  if (pre.length) name = t('ui.item.prefixed', { name, affix: pre.join(' ') });
  if (suf.length) name = `${name} ${suf.join(' ')}`;
  if (inst.upgrade > 0) name += ` +${inst.upgrade}`;
  return name;
}

export function rarityOf(data: GameData, inst: ItemInstance): string {
  return instanceRarity(data, inst.def, inst.affixes.length);
}

export function Portrait({ id, name, size = 56, full = false, mood = 'neutral', class: cls = '', w, h }: { id?: string; name: string; size?: number; full?: boolean; mood?: string; class?: string; w?: number; h?: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [id]);
  return (
    <div class={`portrait ${full ? 'full' : ''} ${cls}`} style={full ? undefined : { width: w ?? size, height: h ?? size }}>
      {id && !failed ? (
        <img src={asset(`portraits/${id}/${mood}.webp`)} alt="" draggable={false} onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          if (mood !== 'neutral' && !img.src.endsWith('neutral.webp')) img.src = asset(`portraits/${id}/neutral.webp`);
          else setFailed(true);
        }} />
      ) : (
        <div class="initial">{name.slice(0, 1)}</div>
      )}
    </div>
  );
}

/** Portrait in a coat-of-arms shield with the team colour as its rim (U21). */
export function Crest({ id, name, w = 54, h = 64, team = 'player' }: { id?: string; name: string; w?: number; h?: number; team?: Team }) {
  return (
    <div class={`crest ${team === 'enemy' ? 'enemy' : team === 'other' ? 'other' : ''}`} style={{ width: w, height: h }}>
      <Portrait id={id} name={name} w={w - 4} h={h - 4} />
    </div>
  );
}

export function HpBar({ hp, max, preview, enemy, team }: { hp: number; max: number; preview?: number; enemy?: boolean; team?: Team }) {
  const pct = Math.max(0, Math.min(100, (hp / Math.max(1, max)) * 100));
  const pv = preview !== undefined ? Math.max(0, Math.min(100, (preview / Math.max(1, max)) * 100)) : undefined;
  const cls = enemy || team === 'enemy' ? 'enemy' : team === 'other' ? 'other' : '';
  return (
    <div class={`hpbar ${cls}`}>
      {pv !== undefined && pv < pct && <b style={{ width: `${pct}%` }} />}
      <i style={{ width: `${pv !== undefined ? Math.min(pv, pct) : pct}%` }} />
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title?: ComponentChildren; onClose?: () => void; children: ComponentChildren; wide?: boolean }) {
  return (
    <div class="modal-back" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div class="modal edge" style={wide ? { width: 'min(760px, 100%)' } : undefined} role="dialog">
        {(title || onClose) && (
          <div class="modal-head">
            <h2 class="grow">{title}</h2>
            {onClose && (
              <button class="btn small ghost icon-only" onClick={onClose} aria-label={t('ui.close')}>
                <Icon name="close" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function UnitCard({ data, unit, state, right }: { data: GameData; unit: BattleUnit | UnitRecord; state?: BattleState; right?: ComponentChildren }) {
  const st = computeStats(data, unit, state ? { state } : {});
  const bu = 'hp' in unit ? (unit as BattleUnit) : undefined;
  const hp = bu ? bu.hp : st.maxHp;
  const w = unit.equip.mainHand;
  return (
    <div class="unit-card">
      <Crest id={unit.portrait} name={unitName(unit)} team={bu?.team} />
      <div class="col" style={{ gap: 6, minWidth: 0 }}>
        <div class="row" style={{ gap: 10, alignItems: 'baseline' }}>
          <span class="unit-name">{unitName(unit)}</span>
          <span class="lbl">
            {t(`class.${unit.classId}.name`)} · {t('ui.lv')} {unit.level}
          </span>
        </div>
        <div class="row" style={{ gap: 10 }}>
          <div class="grow">
            <HpBar hp={hp} max={st.maxHp} team={bu?.team} />
          </div>
          <span class="hp-num">
            {hp}
            <small>/{st.maxHp}</small>
          </span>
        </div>
        <div class="unit-sub">
          {w ? (
            <>
              <Icon name={itemIcon(data, w)} size={16} />
              {itemName(data, w)}
            </>
          ) : (
            <span>{t('ui.unarmed')}</span>
          )}
          {st.affinity && state && ruleOn(state, 'elements') && <ElementIcon el={st.affinity} />}
          {bu?.status.map((s) => (
            <span class="tag" key={s.id}>
              {t(`ui.status.${s.id}`)} {s.turns}
            </span>
          ))}
        </div>
      </div>
      {right}
    </div>
  );
}

export function StatsGrid({ data, unit, state }: { data: GameData; unit: BattleUnit | UnitRecord; state?: BattleState }) {
  const st = computeStats(data, unit, state ? { state } : {});
  const keys = [...STAT_KEYS];
  return (
    <div class="stats-grid">
      {keys.map((k) => (
        <div class="stat" key={k}>
          <span class="muted">{t(`ui.stat.${k}`)}</span>
          <b>{k === 'hp' ? st.maxHp : st.stats[k]}</b>
        </div>
      ))}
      <div class="stat">
        <span class="muted">{t('ui.stat.mov')}</span>
        <b>{st.mov}</b>
      </div>
      <div class="stat">
        <span class="muted">{t('ui.stat.as')}</span>
        <b>{st.as}</b>
      </div>
      <div class="stat">
        <span class="muted">{t('ui.stat.load')}</span>
        <b>
          {st.load}/{st.carry}
        </b>
      </div>
      <div class="stat">
        <span class="muted">{t('ui.stat.exp')}</span>
        <b>
          <Amount resource="exp" value={unit.exp} />
        </b>
      </div>
    </div>
  );
}

export function ItemDetails({ data, inst }: { data: GameData; inst: ItemInstance }) {
  const d = itemDef(data, inst);
  const parts: string[] = [];
  if (d.mt !== undefined) {
    const w = weaponProfile(data, inst);
    parts.push(`${t('ui.mt')} ${w.might}`, `${t('ui.hit')} ${w.hit}`, `${t('ui.crit')} ${w.crit}`, `${t('ui.rng')} ${w.range[0]}–${w.range[1]}`, `${t('ui.wt')} ${w.weight}`);
    if (w.element) parts.push(t(`ui.element.${w.element}`));
    if (w.effectiveVs.length) parts.push(`${t('ui.effective')}: ${w.effectiveVs.map((x) => t(`ui.tag.${x}`)).join(', ')}`);
    for (const s of w.statusOnHit) parts.push(`${t(`ui.status.${s.status}`)} ${s.chance}%`);
  } else {
    if (d.heal) parts.push(`${t('ui.heal')} ${d.heal}`);
    for (const [k, v] of Object.entries(d.statMods ?? {})) parts.push(`${t(`ui.stat.${k}`)} ${v! > 0 ? '+' : ''}${v}`);
    if (d.wt) parts.push(`${t('ui.wt')} ${d.wt}`);
    if (d.use?.heal) parts.push(`${t('ui.heal')} ${d.use.heal}`);
    if (d.charges) parts.push(`${t('ui.charges')} ${inst.charges ?? d.charges}/${d.charges}`);
    if (d.element) parts.push(t(`ui.element.${d.element}`));
  }
  const slots = runeSlotCount(data, inst);
  return (
    <div class="col" style={{ gap: 4, fontSize: 14 }}>
      <div class="muted">{parts.join(' · ')}</div>
      {inst.affixes.length > 0 && <div>{inst.affixes.map((a) => t(`affix.${a}`)).join(', ')}</div>}
      {slots > 0 && (
        <div class="muted">
          {t('ui.runes')}: {Array.from({ length: slots }, (_, i) => (inst.runes[i] ? t(`item.${inst.runes[i]}.name`) : '–')).join(' · ')}
        </div>
      )}
      {d.grantsSkill && (
        <div>
          <b>{t(`skill.${d.grantsSkill.skill}.name`)}</b> – <span class="muted">{t(`skill.${d.grantsSkill.skill}.desc`)}</span>
        </div>
      )}
    </div>
  );
}

export function ItemRow({ data, inst, sub, right, selected, onClick }: { data: GameData; inst: ItemInstance; sub?: ComponentChildren; right?: ComponentChildren; selected?: boolean; onClick?: () => void }) {
  return (
    <div class={`item-row ${selected ? 'sel' : ''}`} onClick={onClick}>
      <span class={`ico r-${rarityOf(data, inst)}`}>
        <Icon name={itemIcon(data, inst)} />
      </span>
      <div style={{ minWidth: 0 }}>
        <span class={`r-${rarityOf(data, inst)}`}>{itemName(data, inst)}</span>
        {sub && <small>{sub}</small>}
      </div>
      <div>{right}</div>
    </div>
  );
}

/** Combat forecast as a duel card (U20/U21): names with crests, big numbers, HP after. Same numbers as the resolution. */
export function ForecastView({ data, state, f }: { data: GameData; state: BattleState; f: Forecast }) {
  const a = state.units.find((u) => u.uid === f.attacker.uid)!;
  const d = state.units.find((u) => u.uid === f.defender.uid)!;
  const aw = f.attacker.weaponUid ? [a.equip.mainHand, ...a.bag].find((i) => i?.uid === f.attacker.weaponUid) : undefined;
  const dw = d.equip.mainHand;
  const who = (s: Forecast['attacker'], u: BattleUnit, w: ItemInstance | undefined, right: boolean) => (
    <div class={`fc-who ${right ? 'right' : ''}`}>
      <Crest id={u.portrait} name={unitName(u)} w={48} h={56} team={u.team} />
      <div style={{ minWidth: 0 }}>
        <div class="fc-name">{unitName(u)}</div>
        <div class="unit-sub">
          {w ? itemName(data, w) : '–'}
          <TriMark v={s.triangle} label={t(s.triangle > 0 ? 'ui.fc.advantage' : 'ui.fc.disadvantage')} />
          {s.effective && <span class="gold">{t('ui.effective')}</span>}
        </div>
      </div>
    </div>
  );
  const val = (s: Forecast['attacker'], k: 'dmg' | 'hit' | 'crit') => {
    if (!s.canStrike) return <span class="fc-val muted">–</span>;
    if (k === 'dmg')
      return (
        <span class="fc-val">
          {s.damage}
          {s.strikes > 1 && <small class="mult">×{s.strikes}</small>}
        </span>
      );
    return (
      <span class="fc-val">
        {k === 'hit' ? s.hit : s.crit}
        <small>%</small>
      </span>
    );
  };
  const elem = (s: Forecast['attacker']) =>
    s.element ? (
      <span class={`fc-val ${s.elementMult > 1 ? 'adv' : s.elementMult < 1 ? 'dis' : ''}`} style={{ fontSize: 18 }}>
        <ElementIcon el={s.element} /> {s.elementMult !== 1 ? `${s.elementMult > 1 ? '+' : ''}${Math.round((s.elementMult - 1) * 100)}%` : ''}
      </span>
    ) : (
      <span />
    );
  const hpCell = (s: Forecast['attacker'], u: BattleUnit, after: number) => (
    <div class="fc-hp">
      <span class="hp-num">
        {s.hpBefore} → {after}
      </span>
      <HpBar hp={s.hpBefore} max={s.maxHp} preview={after} team={u.team} />
    </div>
  );
  const tandem = f.tandem ? state.units.find((u) => u.uid === f.tandem!.uid) : undefined;
  const guard = f.guard ? state.units.find((u) => u.uid === f.guard!.uid) : undefined;
  return (
    <div class="forecast">
      <div class="fc-head">
        {who(f.attacker, a, aw, false)}
        <span class="lbl" style={{ color: 'var(--ink)' }}>{t('ui.fc.vs')}</span>
        {who(f.defender, d, dw, true)}
      </div>
      <div class="fc-table">
        <div class="fc-row">
          {val(f.attacker, 'dmg')}
          <span class="lbl">{t('ui.dmg')}</span>
          {val(f.defender, 'dmg')}
        </div>
        <div class="fc-row">
          {val(f.attacker, 'hit')}
          <span class="lbl">{t('ui.hit')}</span>
          {val(f.defender, 'hit')}
        </div>
        <div class="fc-row">
          {val(f.attacker, 'crit')}
          <span class="lbl">{t('ui.crit')}</span>
          {val(f.defender, 'crit')}
        </div>
        {ruleOn(state, 'elements') && (f.attacker.element || f.defender.element) && (
          <div class="fc-row">
            {elem(f.attacker)}
            <span class="lbl">{t('ui.element')}</span>
            {elem(f.defender)}
          </div>
        )}
        <div class="fc-row">
          {hpCell(f.attacker, a, f.attackerHpAfter)}
          <span class="lbl">{t('ui.fc.hpAfter')}</span>
          {hpCell(f.defender, d, f.defenderHpAfter)}
        </div>
      </div>
      {f.attacker.status.filter((x) => x.chance > 0).map((x) => (
        <div class="fc-note" key={x.status}>
          {t(`ui.status.${x.status}`)}: {x.chance}%
        </div>
      ))}
      {tandem && (
        <div class="fc-note">
          {t('ui.tandem')}: {unitName(tandem)} ({f.tandem!.damage} · {f.tandem!.hit}%)
        </div>
      )}
      {guard && (
        <div class="fc-note">
          {t('ui.guard')}: {unitName(guard)} {f.guard!.chance}%
        </div>
      )}
    </div>
  );
}

export function useNow(intervalMs: number): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((x) => x + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return n;
}

export function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2200);
    return () => clearTimeout(id);
  }, [text]);
  return <div class="toast">{text}</div>;
}

export function useMemoOnce<T>(fn: () => T): T {
  return useMemo(fn, []);
}
