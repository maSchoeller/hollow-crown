/** Presentational UI pieces (no app state, no renderer). */
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import {
  computeStats,
  itemDef,
  runeSlotCount,
  STAT_KEYS,
  weaponProfile,
  type BattleState,
  type BattleUnit,
  type Element,
  type Forecast,
  type GameData,
  type ItemInstance,
  type UnitRecord,
} from '../core';
import { t } from '../i18n';
import { instanceRarity } from '../core/loot';

export const asset = (p: string): string => `${import.meta.env.BASE_URL}assets/${p}`;

export function unitName(u: { name?: string; nameKey: string }): string {
  return u.name ?? t(u.nameKey);
}

export const ELEMENT_ICON: Record<Element, string> = { fire: '🔥', wind: '🌀', earth: '⛰', water: '💧', light: '✦', dark: '☾' };
const KIND_ICON: Record<string, string> = {
  sword: '🗡', lance: '🔱', axe: '🪓', bow: '🏹', anima: '📕', light: '📒', dark: '📓', staff: '🪄', breath: '🔥',
  shield: '🛡', armor: '🥋', accessory: '💍', consumable: '🧪', key: '🗝', seal: '🔰', material: '⛏', rune: '◈',
};
export function itemIcon(data: GameData, inst: ItemInstance | string): string {
  const d = itemDef(data, inst);
  if (d.weaponType) return KIND_ICON[d.weaponType] ?? '•';
  if (d.slot === 'head') return '⛑';
  return KIND_ICON[d.kind] ?? '•';
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

export function Portrait({ id, name, size = 56, full = false, mood = 'neutral', class: cls = '' }: { id?: string; name: string; size?: number; full?: boolean; mood?: string; class?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [id]);
  return (
    <div class={`portrait ${full ? 'full' : ''} ${cls}`} style={full ? undefined : { width: size, height: size }}>
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

export function HpBar({ hp, max, preview, enemy }: { hp: number; max: number; preview?: number; enemy?: boolean }) {
  const pct = Math.max(0, Math.min(100, (hp / Math.max(1, max)) * 100));
  const pv = preview !== undefined ? Math.max(0, Math.min(100, (preview / Math.max(1, max)) * 100)) : undefined;
  return (
    <div class={`hpbar ${enemy ? 'enemy' : ''}`}>
      {pv !== undefined && pv < pct && <b style={{ width: `${pct}%` }} />}
      <i style={{ width: `${pv !== undefined ? Math.min(pv, pct) : pct}%` }} />
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title?: ComponentChildren; onClose?: () => void; children: ComponentChildren; wide?: boolean }) {
  return (
    <div class="modal-back" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div class="panel modal" style={wide ? { width: 'min(760px, 100%)' } : undefined} role="dialog">
        {(title || onClose) && (
          <div class="modal-head">
            <h2 class="grow">{title}</h2>
            {onClose && (
              <button class="btn small ghost" onClick={onClose} aria-label={t('ui.close')}>
                ✕
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
      <Portrait id={unit.portrait} name={unitName(unit)} />
      <div class="col" style={{ gap: 4, minWidth: 0 }}>
        <div class="row" style={{ gap: 6 }}>
          <span class="unit-name">{unitName(unit)}</span>
          <span class="unit-sub">
            {t(`class.${unit.classId}.name`)} · {t('ui.lv')} <span class="num">{unit.level}</span>
          </span>
        </div>
        <div class="row" style={{ gap: 6 }}>
          <span class="num" style={{ fontSize: 13, minWidth: 54 }}>
            {hp}/{st.maxHp}
          </span>
          <div class="grow">
            <HpBar hp={hp} max={st.maxHp} enemy={bu?.team === 'enemy'} />
          </div>
        </div>
        <div class="unit-sub row" style={{ gap: 8 }}>
          {w ? (
            <span>
              {itemIcon(data, w)} {itemName(data, w)}
            </span>
          ) : (
            <span>{t('ui.unarmed')}</span>
          )}
          {st.affinity && <span class={`el-${st.affinity}`}>{ELEMENT_ICON[st.affinity]}</span>}
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
        <b>{unit.exp}</b>
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
    if (w.element) parts.push(`${ELEMENT_ICON[w.element]} ${t(`ui.element.${w.element}`)}`);
    if (w.effectiveVs.length) parts.push(`${t('ui.effective')}: ${w.effectiveVs.map((x) => t(`ui.tag.${x}`)).join(', ')}`);
    for (const s of w.statusOnHit) parts.push(`${t(`ui.status.${s.status}`)} ${s.chance}%`);
  } else {
    if (d.heal) parts.push(`${t('ui.heal')} ${d.heal}`);
    for (const [k, v] of Object.entries(d.statMods ?? {})) parts.push(`${t(`ui.stat.${k}`)} ${v! > 0 ? '+' : ''}${v}`);
    if (d.wt) parts.push(`${t('ui.wt')} ${d.wt}`);
    if (d.use?.heal) parts.push(`${t('ui.heal')} ${d.use.heal}`);
    if (d.charges) parts.push(`${t('ui.charges')} ${inst.charges ?? d.charges}/${d.charges}`);
    if (d.element) parts.push(`${ELEMENT_ICON[d.element]} ${t(`ui.element.${d.element}`)}`);
  }
  const slots = runeSlotCount(data, inst);
  return (
    <div class="col" style={{ gap: 4, fontSize: 14 }}>
      <div class="muted">{parts.join(' · ')}</div>
      {inst.affixes.length > 0 && <div>{inst.affixes.map((a) => t(`affix.${a}`)).join(', ')}</div>}
      {slots > 0 && (
        <div class="muted">
          {t('ui.runes')}: {Array.from({ length: slots }, (_, i) => (inst.runes[i] ? t(`item.${inst.runes[i]}.name`) : '○')).join(' · ')}
        </div>
      )}
      {d.grantsSkill && (
        <div>
          ★ {t(`skill.${d.grantsSkill.skill}.name`)} – <span class="muted">{t(`skill.${d.grantsSkill.skill}.desc`)}</span>
        </div>
      )}
    </div>
  );
}

export function ItemRow({ data, inst, sub, right, selected, onClick }: { data: GameData; inst: ItemInstance; sub?: ComponentChildren; right?: ComponentChildren; selected?: boolean; onClick?: () => void }) {
  return (
    <div class={`item-row ${selected ? 'sel' : ''}`} onClick={onClick}>
      <span class="ico">{itemIcon(data, inst)}</span>
      <div style={{ minWidth: 0 }}>
        <span class={`r-${rarityOf(data, inst)}`}>{itemName(data, inst)}</span>
        {sub && <small>{sub}</small>}
      </div>
      <div>{right}</div>
    </div>
  );
}

export function ForecastView({ data, state, f }: { data: GameData; state: BattleState; f: Forecast }) {
  const a = state.units.find((u) => u.uid === f.attacker.uid)!;
  const d = state.units.find((u) => u.uid === f.defender.uid)!;
  const aw = f.attacker.weaponUid ? [a.equip.mainHand, ...a.bag].find((i) => i?.uid === f.attacker.weaponUid) : undefined;
  const dw = d.equip.mainHand;
  const tri = (v: number) => (v > 0 ? <span class="adv">▲</span> : v < 0 ? <span class="dis">▼</span> : null);
  const side = (s: Forecast['attacker'], u: BattleUnit, w: ItemInstance | undefined, after: number, right: boolean) => (
    <div class={`fc-side ${right ? 'right' : ''}`}>
      <div class="row" style={{ flexDirection: right ? 'row-reverse' : 'row' }}>
        <Portrait id={u.portrait} name={unitName(u)} size={44} class="fc-face" />
        <div>
          <div class="fc-name">{unitName(u)}</div>
          <div class="unit-sub">
            {w ? `${itemIcon(data, w)} ${itemName(data, w)}` : '—'} {tri(s.triangle)}
            {s.effective && <span class="gold"> ✦</span>}
          </div>
        </div>
      </div>
      <HpBar hp={s.hpBefore} max={s.maxHp} preview={after} enemy={u.team === 'enemy'} />
    </div>
  );
  const val = (s: Forecast['attacker'], k: 'hp' | 'dmg' | 'hit' | 'crit') => {
    if (k === 'hp') return null;
    if (!s.canStrike) return <span class="fc-val muted">–</span>;
    if (k === 'dmg')
      return (
        <span class="fc-val">
          {s.damage}
          {s.strikes > 1 && <small class="gold"> ×{s.strikes}</small>}
        </span>
      );
    return <span class="fc-val">{k === 'hit' ? s.hit : s.crit}</span>;
  };
  const elem = (s: Forecast['attacker']) =>
    s.element ? (
      <span class={s.elementMult > 1 ? 'adv' : s.elementMult < 1 ? 'dis' : ''}>
        {ELEMENT_ICON[s.element]} {s.elementMult !== 1 ? `${s.elementMult > 1 ? '+' : ''}${Math.round((s.elementMult - 1) * 100)}%` : ''}
      </span>
    ) : null;
  const tandem = f.tandem ? state.units.find((u) => u.uid === f.tandem!.uid) : undefined;
  const guard = f.guard ? state.units.find((u) => u.uid === f.guard!.uid) : undefined;
  return (
    <div class="forecast">
      <div class="fc-grid">
        {side(f.attacker, a, aw, f.attackerHpAfter, false)}
        <span />
        {side(f.defender, d, dw, f.defenderHpAfter, true)}
        <span class="fc-val" style={{ textAlign: 'left' }}>
          {f.attacker.hpBefore}→{f.attackerHpAfter}
        </span>
        <span class="fc-label">{t('ui.hp')}</span>
        <span class="fc-val" style={{ textAlign: 'right' }}>
          {f.defender.hpBefore}→{f.defenderHpAfter}
        </span>
        <span>{val(f.attacker, 'dmg')}</span>
        <span class="fc-label">{t('ui.dmg')}</span>
        <span style={{ textAlign: 'right' }}>{val(f.defender, 'dmg')}</span>
        <span>{val(f.attacker, 'hit')}</span>
        <span class="fc-label">{t('ui.hit')}</span>
        <span style={{ textAlign: 'right' }}>{val(f.defender, 'hit')}</span>
        <span>{val(f.attacker, 'crit')}</span>
        <span class="fc-label">{t('ui.crit')}</span>
        <span style={{ textAlign: 'right' }}>{val(f.defender, 'crit')}</span>
        {(f.attacker.element || f.defender.element) && (
          <>
            <span>{elem(f.attacker)}</span>
            <span class="fc-label">{t('ui.element')}</span>
            <span style={{ textAlign: 'right' }}>{elem(f.defender)}</span>
          </>
        )}
      </div>
      {f.attacker.status.filter((x) => x.chance > 0).map((x) => (
        <div class="fc-note" key={x.status}>
          {t(`ui.status.${x.status}`)}: {x.chance}%
        </div>
      ))}
      {tandem && (
        <div class="fc-note">
          🤝 {t('ui.tandem')}: {unitName(tandem)} ({f.tandem!.damage} · {f.tandem!.hit}%)
        </div>
      )}
      {guard && (
        <div class="fc-note">
          🛡 {t('ui.guard')}: {unitName(guard)} {f.guard!.chance}%
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
