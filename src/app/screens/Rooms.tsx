/**
 * The room panels of the home (camp stations, story 6.3 and 6.4): convoy, merchant, smith, healer, tavern, campfire
 * and the enchanter. Every action is one campaign command and needs at most two taps: choose, then the main button.
 */
import { useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import type { ComponentChildren } from 'preact';
import {
  armyCount,
  availableSupportTalks,
  currentTier,
  hireCost,
  hireError,
  itemDef,
  locateItem,
  merchantStock,
  rerollAllowed,
  rerollCost,
  runeMerge,
  runeSlotCount,
  sellPrice,
  upgradable,
  upgradeCost,
  upgradeLimit,
  upgradePreview,
  usableBy,
  STAT_KEYS,
  type CampaignCommand,
  type ItemInstance,
  type RoomDef,
  type UnitRecord,
} from '../../core';
import { t } from '../../i18n';
import { Icon } from '../../ui/icons';
import { ItemLine, itemName, unitName } from '../../ui/components';
import { Amount, ItemImage, Piece, PrimaryButton, SecondaryButton, Tabs } from '../../ui/pieces';
import { Scene } from './Scene';
import { campaign, data } from '../state/session';
import { UnitHead } from './unitArt';
import '../../ui/camp.css';

export type Apply = (cmd: CampaignCommand, okText?: string) => boolean;

/** Panel of a room: head with icon, name and short text, the list, the buttons (the close stone replaces "Back"). */
export function RoomPanel({ room, title, desc, onClose, actions, children }: { room?: RoomDef; title?: string; desc?: string; onClose: () => void; actions?: ComponentChildren; children: ComponentChildren }) {
  const id = room?.id ?? '';
  return (
    <Piece class="hm-panel" role="dialog" aria-label={title ?? t(`room.${id}.name`)}>
      <div class="hm-panel__head">
        <span class="hm-room__stone">
          <Icon name={room?.icon ?? 'save'} size={26} />
        </span>
        <div>
          <h2>{title ?? t(`room.${id}.name`)}</h2>
          <p>{desc ?? t(`room.${id}.desc`)}</p>
        </div>
        <button type="button" class="hm-panel__close" onClick={onClose} aria-label={t('ui.back')}>
          <Icon name="close" size={18} />
        </button>
      </div>
      <div class="hm-panel__body">{children}</div>
      {actions && <div class="hc-btns">{actions}</div>}
    </Piece>
  );
}


// ---------------------------------------------------------------- convoy

type Kind = 'all' | 'weapon' | 'armor' | 'accessory' | 'supply';
const KIND_OF: Record<string, Kind> = { weapon: 'weapon', tome: 'weapon', staff: 'weapon', armor: 'armor', shield: 'armor', accessory: 'accessory' };
const kindOf = (inst: ItemInstance): Kind => KIND_OF[itemDef(data, inst).kind] ?? 'supply';

/** Items by kind with the sell price; shares the list pattern of the equip view. */
function ConvoyList({ items, sel, onSel }: { items: ItemInstance[]; sel: string | null; onSel: (uid: string | null) => void }) {
  return (
    <>
      {items.map((inst) => (
        <ItemLine key={inst.uid} data={data} inst={inst} selected={sel === inst.uid} onClick={() => onSel(sel === inst.uid ? null : inst.uid)} side={sellPrice(data, inst) > 0 ? <Amount resource="gold" value={sellPrice(data, inst)} /> : undefined} />
      ))}
      {items.length === 0 && <div class="hm-none">{t('ui.room.convoy.none')}</div>}
    </>
  );
}

export function ConvoyRoom({ room, apply, onClose }: { room: RoomDef; apply: Apply; onClose: () => void }) {
  const c = campaign.value!;
  const [kind, setKind] = useState<Kind>('all');
  const [sel, setSel] = useState<string | null>(null);
  const items = c.convoy.filter((i) => !data.runes[i.def] || kind === 'all' || kind === 'supply').filter((i) => kind === 'all' || kindOf(i) === kind);
  const chosen = sel ? c.convoy.find((i) => i.uid === sel) : undefined;
  const price = chosen ? sellPrice(data, chosen) : 0;
  return (
    <RoomPanel
      room={room}
      desc={t('ui.convoy.count', { n: c.convoy.length, max: data.balance.economy.convoySize })}
      onClose={onClose}
      actions={
        <PrimaryButton
          disabled={!chosen || price <= 0}
          onClick={() => chosen && apply({ type: 'sell', uid: chosen.uid }, t('ui.camp.sold')) && setSel(null)}
        >
          {chosen && price > 0 ? (
            <>
              {t('ui.sell')} · <Amount resource="gold" value={price} />
            </>
          ) : (
            t('ui.sell')
          )}
        </PrimaryButton>
      }
    >
      <Tabs
        value={kind}
        label={t('ui.room.convoy.filter')}
        onChange={(k) => {
          setKind(k);
          setSel(null);
        }}
        options={(['all', 'weapon', 'armor', 'accessory', 'supply'] as Kind[]).map((k) => ({ id: k, label: t(`ui.room.kind.${k}`) }))}
      />
      <ConvoyList items={items} sel={sel} onSel={setSel} />
    </RoomPanel>
  );
}

// ---------------------------------------------------------------- merchant

const probe = (id: string): ItemInstance => ({ uid: `shop-${id}`, def: id, upgrade: 0, affixes: [], runes: [] });

/** Merchant: tier of the act's gear, purse in the HUD, "For whom?" names who can hold the item. */
export function MerchantRoom({ room, apply, onClose }: { room: RoomDef; apply: Apply; onClose: () => void }) {
  const c = campaign.value!;
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [sel, setSel] = useState<string | null>(null);
  const [who, setWho] = useState(false);
  const stock = merchantStock(data, currentTier(data, c));
  const chosenDef = tab === 'buy' && sel ? sel : null;
  const price = chosenDef ? itemDef(data, chosenDef).price : 0;
  const owned = tab === 'sell' && sel ? c.convoy.find((i) => i.uid === sel) : undefined;
  const sellFor = owned ? sellPrice(data, owned) : 0;
  const pick = (id: string | null) => {
    setSel(id);
    setWho(false);
  };
  return (
    <RoomPanel
      room={room}
      onClose={onClose}
      actions={
        tab === 'buy' ? (
          <>
            <SecondaryButton disabled={!chosenDef} onClick={() => setWho(!who)}>
              {t('ui.room.merchant.who')}
            </SecondaryButton>
            <PrimaryButton
              disabled={!chosenDef || c.gold < price}
              onClick={() => chosenDef && apply({ type: 'buy', item: chosenDef }, t('ui.camp.bought'))}
            >
              {chosenDef ? (
                <>
                  {t('ui.room.merchant.buy')} · <Amount resource="gold" value={price} short={c.gold < price} />
                </>
              ) : (
                t('ui.room.merchant.buy')
              )}
            </PrimaryButton>
          </>
        ) : (
          <PrimaryButton disabled={!owned || sellFor <= 0} onClick={() => owned && apply({ type: 'sell', uid: owned.uid }, t('ui.camp.sold')) && pick(null)}>
            {owned && sellFor > 0 ? (
              <>
                {t('ui.sell')} · <Amount resource="gold" value={sellFor} />
              </>
            ) : (
              t('ui.sell')
            )}
          </PrimaryButton>
        )
      }
    >
      <Tabs
        value={tab}
        onChange={(v) => {
          setTab(v);
          pick(null);
        }}
        options={[
          { id: 'buy', label: t('ui.room.merchant.buy') },
          { id: 'sell', label: t('ui.sell') },
        ]}
      />
      {who && chosenDef && <Who defId={chosenDef} />}
      {tab === 'buy' ? (
        stock.map((id) => (
          <ItemLine
            key={id}
            data={data}
            inst={probe(id)}
            selected={sel === id}
            onClick={() => pick(sel === id ? null : id)}
            side={<Amount resource="gold" value={itemDef(data, id).price} short={c.gold < itemDef(data, id).price} />}
          />
        ))
      ) : (
        <ConvoyList items={c.convoy} sel={sel} onSel={pick} />
      )}
    </RoomPanel>
  );
}

/** "For whom?": the company members who can hold the item. */
function Who({ defId }: { defId: string }) {
  const c = campaign.value!;
  const list = usableBy(data, c, defId);
  return (
    <div class="hm-who" aria-label={t('ui.room.merchant.who')}>
      {list.map((u) => (
        <span key={u.id} class="hm-who__one">
          <UnitHead portrait={u.portrait} classId={u.classId} name={unitName(u)} size={40} />
          {unitName(u)}
        </span>
      ))}
      {list.length === 0 && <span style={{ color: 'var(--hc-soft)' }}>{t('ui.room.merchant.nobody')}</span>}
    </div>
  );
}

// ---------------------------------------------------------------- smith

const GEAR_STAT_LABEL: Record<string, string> = { mt: 'ui.mt', hit: 'ui.hit', def: 'ui.stat.def', res: 'ui.stat.res' };

function ownerOf(uid: string): UnitRecord | undefined {
  return locateItem(campaign.value!, uid)?.owner;
}

/** Smith: upgrade up to the limit of the smith's level; reroll only from the level `rerollFromSmithLevel`. */
export function SmithRoom({ room, apply, onClose }: { room: RoomDef; apply: Apply; onClose: () => void }) {
  const c = campaign.value!;
  const [sel, setSel] = useState<string | null>(null);
  const limit = upgradeLimit(data, c);
  const gear: ItemInstance[] = [...c.roster.flatMap((u) => [...Object.values(u.equip), ...u.bag]).filter((i): i is ItemInstance => !!i), ...c.convoy].filter(upgradable.bind(null, data));
  const inst = sel ? gear.find((i) => i.uid === sel) : undefined;
  const cost = inst ? upgradeCost(data, inst) : undefined;
  const atLimit = !!inst && inst.upgrade >= limit;
  const afford = !!cost && c.gold >= cost.gold && Object.entries(cost.materials).every(([m, n]) => (c.materials[m] ?? 0) >= n);
  const rr = inst ? rerollCost(data, inst) : undefined;
  return (
    <RoomPanel
      room={room}
      desc={t('ui.room.smith.limit', { n: limit })}
      onClose={onClose}
      actions={
        <PrimaryButton disabled={!inst || !cost || atLimit || !afford} onClick={() => inst && apply({ type: 'upgrade', uid: inst.uid }, t('ui.camp.upgraded'))}>
          {inst && cost && !atLimit ? (
            <>
              {t('ui.room.smith.upgradeTo', { n: inst.upgrade + 1 })} · <Amount resource="gold" value={cost.gold} short={c.gold < cost.gold} />
              {Object.entries(cost.materials).map(([m, n]) => (
                <Amount key={m} material={itemDef(data, m)} value={n} short={(c.materials[m] ?? 0) < n} />
              ))}
            </>
          ) : inst ? (
            t('ui.camp.maxed')
          ) : (
            t('ui.room.smith.upgrade')
          )}
        </PrimaryButton>
      }
    >
      {gear.map((i) => {
        const owner = ownerOf(i.uid);
        const pv = upgradePreview(data, i);
        const maxed = i.upgrade >= limit;
        return (
          <ItemLine
            key={i.uid}
            data={data}
            inst={i}
            selected={sel === i.uid}
            onClick={() => setSel(sel === i.uid ? null : i.uid)}
            sub={`${owner ? unitName(owner) : t('ui.convoy')}`}
            side={
              maxed ? (
                <span style={{ color: 'var(--hc-soft)' }}>{t('ui.camp.maxed')}</span>
              ) : (
                pv.map((d) => (
                  <span key={d.key} class="hc-up" style={{ display: 'block' }}>
                    {t(GEAR_STAT_LABEL[d.key]!)} +{d.delta}
                  </span>
                ))
              )
            }
          />
        );
      })}
      {gear.length === 0 && <div class="hm-none">{t('ui.room.smith.none')}</div>}
      {inst && atLimit && cost && <div class="hm-hint">{t('ui.room.smith.nextLevel')}</div>}
      {inst && rerollAllowed(data, c) &&
        inst.affixes.map((a, i) => (
          <SecondaryButton key={a} onClick={() => apply({ type: 'reroll', uid: inst.uid, index: i }, t('ui.camp.rerolled'))}>
            {t(`affix.${a}`)} · <Amount resource="gold" value={rr!.gold} /> <Amount material={itemDef(data, 'arcane_dust')} value={rr!.dust} />
          </SecondaryButton>
        ))}
    </RoomPanel>
  );
}

// ---------------------------------------------------------------- healer

/** A list line with a head (company member) instead of an item image. */
function PersonLine({ unit, name, sub, side, selected, onClick, extra }: { unit?: UnitRecord; name: string; sub?: ComponentChildren; side?: ComponentChildren; selected?: boolean; onClick?: () => void; extra?: ComponentChildren }) {
  return (
    <button type="button" class={`hc-line-item ${selected ? 'is-sel' : ''}`} aria-pressed={selected} onClick={onClick}>
      {extra ?? <UnitHead portrait={unit?.portrait} classId={unit?.classId} name={unit ? unitName(unit) : name} size={40} />}
      <span style={{ minWidth: 0 }}>
        <span class="hc-line-item__name">{name}</span>
        <span class="hc-line-item__sub">{sub}</span>
      </span>
      <span class="hc-line-item__side">{side}</span>
    </button>
  );
}

export function HealerRoom({ room, apply, onClose }: { room: RoomDef; apply: Apply; onClose: () => void }) {
  const c = campaign.value!;
  const cfg = data.balance.economy.scarRemoval;
  const [sel, setSel] = useState<string | null>(null);
  const scars = c.roster.flatMap((u) => u.scars.map((s, i) => ({ u, s, i, key: `${u.id}:${i}` })));
  const chosen = scars.find((x) => x.key === sel);
  const herb = c.convoy.some((i) => i.def === cfg.altItem);
  return (
    <RoomPanel
      room={room}
      onClose={onClose}
      actions={
        <>
          {herb && (
            <SecondaryButton disabled={!chosen} onClick={() => chosen && apply({ type: 'healScar', unit: chosen.u.id, index: chosen.i, herb: true }, t('ui.camp.healed')) && setSel(null)}>
              <ItemImage data={data} item={cfg.altItem} size={24} />
            </SecondaryButton>
          )}
          <PrimaryButton disabled={!chosen || c.gold < cfg.gold} onClick={() => chosen && apply({ type: 'healScar', unit: chosen.u.id, index: chosen.i }, t('ui.camp.healed')) && setSel(null)}>
            {t('ui.room.healer.heal')} · <Amount resource="gold" value={cfg.gold} short={c.gold < cfg.gold} />
          </PrimaryButton>
        </>
      }
    >
      {scars.map(({ u, s, key }) => (
        <PersonLine key={key} unit={u} name={`${unitName(u)}: ${t(`scar.${s}`)}`} selected={sel === key} onClick={() => setSel(sel === key ? null : key)} />
      ))}
      {scars.length === 0 && <div class="hm-none">{t('ui.camp.healer.none')}</div>}
    </RoomPanel>
  );
}

// ---------------------------------------------------------------- tavern

/** Tavern: three mercenaries per chapter; price 600 + 150 × level; the limit is companions + mercenaries. */
export function TavernRoom({ room, apply, onClose }: { room: RoomDef; apply: Apply; onClose: () => void }) {
  const c = campaign.value!;
  const [sel, setSel] = useState<string | null>(null);
  const army = armyCount(c);
  const chosen = c.tavern.find((u) => u.id === sel);
  const cost = chosen ? hireCost(data, chosen.level) : 0;
  const err = chosen ? hireError(data, c, chosen.id) : null;
  const full = army.mercenaries >= data.balance.economy.mercenaryLimit;
  return (
    <RoomPanel
      room={room}
      desc={t('ui.room.tavern.limit', { n: army.mercenaries, max: data.balance.economy.mercenaryLimit, c: army.companions, cmax: data.balance.economy.armyLimit })}
      onClose={onClose}
      actions={
        <PrimaryButton disabled={!chosen || !!err} onClick={() => chosen && apply({ type: 'hire', offer: chosen.id }, t('ui.room.tavern.hired')) && setSel(null)}>
          {chosen ? (
            <>
              {t('ui.room.tavern.hire')} · <Amount resource="gold" value={cost} short={c.gold < cost} />
            </>
          ) : (
            t('ui.room.tavern.hire')
          )}
        </PrimaryButton>
      }
    >
      {full && <div class="hm-hint">{t('ui.room.tavern.full')}</div>}
      {c.tavern.map((u) => {
        const st = u.stats;
        return (
          <PersonLine
            key={u.id}
            unit={u}
            name={`${unitName(u)} · ${t(`class.${u.classId}.name`)}`}
            sub={
              <>
                {t('ui.lv')} {u.level} · {STAT_KEYS.filter((k) => k === 'hp' || k === 'str' || k === 'mag' || k === 'def').map((k) => `${t(`ui.stat.${k}`)} ${st[k]}`).join(' · ')}
                <br />
                {Object.values(u.equip).map((i) => itemName(data, i!)).join(', ')}
              </>
            }
            side={<Amount resource="gold" value={hireCost(data, u.level)} short={c.gold < hireCost(data, u.level)} />}
            selected={sel === u.id}
            onClick={() => setSel(sel === u.id ? null : u.id)}
          />
        );
      })}
      {c.tavern.length === 0 && <div class="hm-none">{t('ui.room.tavern.none')}</div>}
    </RoomPanel>
  );
}

// ---------------------------------------------------------------- campfire

export function CampfireRoom({ room, apply, onClose }: { room: RoomDef; apply: Apply; onClose: () => void }) {
  const c = campaign.value!;
  const [talk, setTalk] = useState<{ key: string; dialogue: string } | null>(null);
  const talks = availableSupportTalks(data, c);
  const unit = (id: string) => c.roster.find((u) => u.id === id);
  return (
    <RoomPanel room={room} onClose={onClose}>
      <p class="hm-hint">{t('ui.camp.campfire.hint')}</p>
      {talks.length === 0 && <div class="hm-none">{t('ui.camp.campfire.none')}</div>}
      {talks.map((x) => {
        const [a, b] = x.key.split('|') as [string, string];
        return (
          <PersonLine
            key={x.key}
            name={`${t(`unit.${a}.name`)} × ${t(`unit.${b}.name`)}`}
            sub={t('ui.room.campfire.talk')}
            side={<b style={{ color: 'var(--hc-ember-dark)' }}>{x.rank}</b>}
            extra={
              <span class="hm-pair">
                <UnitHead portrait={unit(a)?.portrait} name={t(`unit.${a}.name`)} size={34} />
                <UnitHead portrait={unit(b)?.portrait} name={t(`unit.${b}.name`)} size={34} />
              </span>
            }
            onClick={() => setTalk(x)}
          />
        );
      })}
      <div class="hm-subhead">{t('ui.camp.bonds')}</div>
      {Object.entries(c.supports)
        .filter(([k]) => k.split('|').every((id) => c.roster.some((r) => r.id === id)))
        .map(([k, st]) => (
          <div key={k} class="hm-bond">
            <span>{k.split('|').map((id) => t(`unit.${id}.name`)).join(' × ')}</span>
            <b>
              {st.rank ?? '–'} · {st.points}
            </b>
          </div>
        ))}
      {/* the talk plays full screen like the scenes between missions, not inside the panel (story 9.13) */}
      {talk &&
        createPortal(
          <Scene
            id={talk.dialogue}
            onDone={() => {
              apply({ type: 'unlockSupport', pair: talk.key }, t('ui.camp.bond'));
              setTalk(null);
            }}
          />,
          document.body,
        )}
    </RoomPanel>
  );
}

// ---------------------------------------------------------------- enchanter

/** Enchanter (runes): choose a piece of gear, then a rune; kept working although its story is Epic 10. */
export function EnchanterRoom({ room, apply, onClose }: { room: RoomDef; apply: Apply; onClose: () => void }) {
  const c = campaign.value!;
  const [sel, setSel] = useState<string | null>(null);
  const runes = c.convoy.filter((i) => data.runes[i.def]);
  const gear: ItemInstance[] = [...c.roster.flatMap((u) => [...Object.values(u.equip), ...u.bag]).filter((i): i is ItemInstance => !!i), ...c.convoy].filter((i) => runeSlotCount(data, i) > 0);
  const selInst = sel ? locateItem(c, sel)?.inst : undefined;
  const buyable = Object.values(data.runes).filter((r) => r.price && ((r.tier ?? 1) === 1 || r.utility));
  return (
    <RoomPanel room={room} onClose={onClose}>
      <p class="hm-hint">{t('ui.camp.enchanter.hint')}</p>
      {gear.map((inst) => (
        <ItemLine key={inst.uid} data={data} inst={inst} selected={sel === inst.uid} sub={ownerOf(inst.uid) ? unitName(ownerOf(inst.uid)!) : t('ui.convoy')} onClick={() => setSel(sel === inst.uid ? null : inst.uid)} />
      ))}
      {selInst && (
        <div class="hm-chips">
          {selInst.runes.map((r, i) =>
            r ? (
              <SecondaryButton key={i} onClick={() => apply({ type: 'removeRune', item: selInst.uid, index: i })}>
                <Icon name="close" size={14} /> <ItemImage data={data} item={r} size={24} /> {t(`item.${r}.name`)}
              </SecondaryButton>
            ) : null,
          )}
          {runes.map((r) => (
            <SecondaryButton key={r.uid} onClick={() => apply({ type: 'insertRune', item: selInst.uid, rune: r.uid }, t('ui.camp.enchanted'))}>
              <ItemImage data={data} item={r} size={24} /> {t(`item.${r.def}.name`)}
            </SecondaryButton>
          ))}
        </div>
      )}
      <div class="hm-subhead">{t('ui.camp.runes')}</div>
      {[...new Set(runes.map((r) => r.def))].map((id) => {
        const n = runes.filter((r) => r.def === id).length;
        const m = runeMerge(data, id);
        return (
          <div key={id} class="hm-offer">
            <ItemImage data={data} item={id} />
            <span>
              {t(`item.${id}.name`)} ×{n}
            </span>
            <SecondaryButton disabled={!m || n < data.balance.economy.runeMerge.count} onClick={() => apply({ type: 'mergeRunes', rune: id }, t('ui.camp.merged'))}>
              {t('ui.camp.merge')}
            </SecondaryButton>
          </div>
        );
      })}
      <div class="hm-subhead">{t('ui.camp.buyRunes')}</div>
      {buyable.map((r) => (
        <div key={r.id} class="hm-offer">
          <ItemImage data={data} item={r.id} />
          <span>{t(`item.${r.id}.name`)}</span>
          <SecondaryButton disabled={c.gold < (r.price ?? 0)} onClick={() => apply({ type: 'buy', item: r.id }, t('ui.camp.bought'))}>
            <Amount resource="gold" value={r.price ?? 0} short={c.gold < (r.price ?? 0)} />
          </SecondaryButton>
        </div>
      ))}
    </RoomPanel>
  );
}

/** Dispatch by room function. */
export function Room({ room, apply, onClose }: { room: RoomDef; apply: Apply; onClose: () => void }) {
  switch (room.function) {
    case 'convoy':
      return <ConvoyRoom room={room} apply={apply} onClose={onClose} />;
    case 'merchant':
      return <MerchantRoom room={room} apply={apply} onClose={onClose} />;
    case 'smith':
      return <SmithRoom room={room} apply={apply} onClose={onClose} />;
    case 'healer':
      return <HealerRoom room={room} apply={apply} onClose={onClose} />;
    case 'tavern':
      return <TavernRoom room={room} apply={apply} onClose={onClose} />;
    case 'campfire':
      return <CampfireRoom room={room} apply={apply} onClose={onClose} />;
    case 'enchanter':
      return <EnchanterRoom room={room} apply={apply} onClose={onClose} />;
  }
}

