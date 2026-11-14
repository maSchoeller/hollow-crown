/**
 * The room panels of the home (camp stations, story 6.3 and 6.4): convoy, merchant, smith, healer, tavern, campfire
 * and the enchanter. Every action is one campaign command and needs at most two taps: choose, then the main button.
 */
import { useContext, useState } from 'preact/hooks';
import { createContext } from 'preact';
import { createPortal } from 'preact/compat';
import type { ComponentChildren } from 'preact';
import {
  armyCount,
  armyOverLimit,
  isMercenary,
  mercenaryRoom,
  availableSupportTalks,
  campfireLock,
  reservePct,
  dailyOffersOpen,
  emberSparkOffered,
  equipBestOpen,
  gearTemplatesOpen,
  emberSparkPrice,
  hireCost,
  hireError,
  itemDef,
  locateItem,
  offerPrice,
  priceChangePct,
  shopPrice,
  shopStock,
  roomBuild,
  scarCost,
  rerollAllowed,
  rerollCost,
  mergeError,
  mergeLevelFor,
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
  type Condition,
  type ItemInstance,
  type RoomDef,
  type UnitRecord,
} from '../../core';
import { t } from '../../i18n';
import { Icon } from '../../ui/icons';
import { ItemLine, itemName, unitName } from '../../ui/components';
import { ItemInfoButton } from '../../ui/ItemSheet';
import { Amount, ItemImage, Piece, PrimaryButton, SecondaryButton, Tabs } from '../../ui/pieces';
import { nodeShort } from '../campaignInfo';
import { Scene } from './Scene';
import { AcademyRoom } from './Academy';
import { WorkshopRoom } from './Workshop';
import { MemorialRoom } from './Memorial';
import { TrainingRoom } from './Training';
import { Sparks } from '../../ui/Sparks';
import { campaign, data } from '../state/session';
import { UnitHead } from './unitArt';
import '../../ui/camp.css';

export type Apply = (cmd: CampaignCommand, okText?: string) => boolean;

/** Companions a condition asks to be in the company (`alive`, or `any` of them: the room companions of story 10.1), else null. */
function companionsOf(cond: Condition): string[] | null {
  if ('alive' in cond) return [cond.alive];
  if (!('any' in cond)) return null;
  const ids = cond.any.map((x) => ('alive' in x ? x.alive : null));
  return ids.every((x): x is string => x !== null) ? ids : null;
}

const nameList = (ids: string[]) => ids.map((id) => t(`unit.${id}.name`)).join(t('ui.room.or'));

/** Why a station is locked: the first condition that fails, in the player's words. */
export function lockReason(unmet?: Condition): string {
  if (unmet && 'completed' in unmet) return t('ui.room.after', { node: nodeShort(unmet.completed) });
  if (unmet && 'act' in unmet) return t('ui.room.fromAct', { n: unmet.act });
  const mates = unmet ? companionsOf(unmet) : null;
  if (mates) return t('ui.room.needs', { names: nameList(mates) });
  return t('ui.room.locked');
}

/** The apply of the open room, for the build-up band in its panel head (provided by `Room`). */
const RoomApply = createContext<Apply | null>(null);

/**
 * The build-up band at the top of a castle room's panel (stories 6.9 and 10.1, mockup 04): green with the next level's effect
 * and the build button when it can be built now (one tap), dashed with the first open condition (or the gold in red when only
 * gold is missing) otherwise, "highest level" at the top. Reads `roomBuild`, the function `buildRoom` checks with.
 */
function UpgradeBand({ room }: { room: RoomDef }) {
  const c = campaign.value!;
  const apply = useContext(RoomApply);
  if (c.home.kind !== 'castle' || !room.levels.length) return null;
  const b = roomBuild(data, c, room.id);
  if (b.error === 'unknown_room') return null;
  if (b.error === 'max_level')
    return (
      <div class="hm-upband is-top">
        <b>{t('ui.room.maxLevel')}</b>
      </div>
    );
  if (b.error !== null)
    return (
      <div class="hm-upband is-locked">
        <Icon name="lock" size={16} />
        <b>{t('ui.room.upgradeTo', { n: b.level })}</b>
        <span>{b.error === 'not_enough_gold' ? <Amount resource="gold" value={b.gold} short /> : lockReason(b.unmet)}</span>
      </div>
    );
  // the companion that opens level 3: the first of the room's two who is in the company
  const step = room.levels[b.level - 2]!;
  const mates = step.requires.map(companionsOf).find((x) => x !== null) ?? [];
  const mate = mates.find((id) => c.roster.some((u) => u.id === id));
  const name = t(`room.${room.id}.name`);
  return (
    <div class="hm-upband is-ready">
      <div class="hm-upband__text">
        <b>{t('ui.room.upgradeTo', { n: b.level })}</b>
        <small>{t(`room.${room.id}.level.${b.level}`, { pct: reservePct(data, c, b.level) })}</small>
        {mate && <small class="hm-upband__mate">{t('ui.room.mateReady', { name: t(`unit.${mate}.name`) })}</small>}
      </div>
      <PrimaryButton onClick={() => apply?.({ type: 'buildRoom', room: room.id }, t('ui.room.built', { room: name, n: b.level }))}>
        {t('ui.room.build')} · <Amount resource="gold" value={b.gold} />
      </PrimaryButton>
    </div>
  );
}

/** Panel of a room: head with icon, name and short text, the list, the buttons (the close stone replaces "Back"). */
export function RoomPanel({ room, title, desc, tone, onClose, actions, children }: { room?: RoomDef; title?: string; desc?: string; tone?: 'mourn'; onClose: () => void; actions?: ComponentChildren; children: ComponentChildren }) {
  const id = room?.id ?? '';
  return (
    <Piece class={`hm-panel ${tone === 'mourn' ? 'hm-panel--mourn' : ''}`} role="dialog" aria-label={title ?? t(`room.${id}.name`)}>
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
      {room && <UpgradeBand room={room} />}
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
      {/* story 10.10: what the built convoy does; the figure itself carries the buttons (troop) */}
      {gearTemplatesOpen(data, c) && <div class="hm-hint">{t('ui.room.convoy.template')}</div>}
      {equipBestOpen(data, c) && <div class="hm-hint">{t('ui.room.convoy.best')}</div>}
      <ConvoyList items={items} sel={sel} onSel={setSel} />
    </RoomPanel>
  );
}

// ---------------------------------------------------------------- merchant

const probe = (id: string): ItemInstance => ({ uid: `shop-${id}`, def: id, upgrade: 0, affixes: [], runes: [] });

/** What the buy tab has chosen: an item of the stock (def id), a deal of the day (uid, story 10.9) or the ember spark. */
type MerchantPick = { kind: 'stock'; id: string } | { kind: 'offer'; uid: string } | { kind: 'spark' };

/**
 * Merchant: tier of the act's gear, purse in the HUD, "For whom?" names who can hold the item. From level 2 a larger range
 * (`roomLevel` lists), from level 3 the deal of the day and the ember spark; the total discount stands as a mark (story 10.9).
 * Prices come from the same functions the commands use (`shopPrice`, `offerPrice`, `emberSparkPrice`).
 */
export function MerchantRoom({ room, apply, onClose }: { room: RoomDef; apply: Apply; onClose: () => void }) {
  const c = campaign.value!;
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [sel, setSel] = useState<string | null>(null);
  const [who, setWho] = useState(false);
  const [moment, setMoment] = useState(0);
  const stock = shopStock(data, c);
  const offers = dailyOffersOpen(data, c) ? c.offers : [];
  const spark = emberSparkOffered(data, c);
  const sparkItem = data.balance.economy.emberShop.item;
  const pct = priceChangePct(data, c);
  const chosen: MerchantPick | null =
    tab !== 'buy' || !sel
      ? null
      : sel === 'spark'
        ? spark ? { kind: 'spark' } : null
        : sel.startsWith('offer:')
          ? offers.some((o) => `offer:${o.uid}` === sel) ? { kind: 'offer', uid: sel.slice(6) } : null
          : { kind: 'stock', id: sel };
  const chosenOffer = chosen?.kind === 'offer' ? offers.find((o) => o.uid === chosen.uid) : undefined;
  const chosenDef = chosen?.kind === 'stock' ? chosen.id : chosenOffer?.def ?? null;
  const price =
    chosen?.kind === 'spark' ? emberSparkPrice(data) : chosenOffer ? offerPrice(data, chosenOffer, c) : chosen?.kind === 'stock' ? shopPrice(data, c, itemDef(data, chosen.id).price) : 0;
  const owned = tab === 'sell' && sel ? c.convoy.find((i) => i.uid === sel) : undefined;
  const sellFor = owned ? sellPrice(data, owned) : 0;
  const pick = (id: string | null) => {
    setSel(id);
    setWho(false);
  };
  const buy = () => {
    if (!chosen) return;
    if (chosen.kind === 'stock') apply({ type: 'buy', item: chosen.id }, t('ui.camp.bought'));
    else if (chosen.kind === 'offer') {
      if (apply({ type: 'buyOffer', uid: chosen.uid }, t('ui.camp.bought'))) pick(null);
    }
    else if (apply({ type: 'buyEmberSpark' }, t('ui.camp.bought'))) {
      pick(null);
      setMoment((n) => n + 1);
    }
  };
  const priceSide = (value: number) => <Amount resource="gold" value={value} short={c.gold < value} />;
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
            <PrimaryButton disabled={!chosen || c.gold < price} onClick={buy}>
              {chosen ? (
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
      <div class="hm-merchant">
        {moment > 0 && <Sparks key={moment} />}
        <div class="hm-merchant__head">
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
          {pct < 0 && tab === 'buy' && (
            <span class="hm-discount" title={t('ui.room.merchant.discountHint', { max: data.balance.economy.maxDiscountPct })}>
              {t('ui.room.merchant.discount', { pct: -pct })}
            </span>
          )}
        </div>
        {who && chosenDef && <Who defId={chosenDef} />}
        {tab === 'buy' ? (
          <>
            {offers.length > 0 && (
              <>
                <div class="hm-subhead">{t('ui.room.merchant.daily')}</div>
                {offers.map((o) => (
                  <ItemLine
                    key={o.uid}
                    data={data}
                    inst={o}
                    selected={sel === `offer:${o.uid}`}
                    onClick={() => pick(sel === `offer:${o.uid}` ? null : `offer:${o.uid}`)}
                    side={priceSide(offerPrice(data, o, c))}
                  />
                ))}
              </>
            )}
            {spark && (
              <>
                <div class="hm-subhead">{t('ui.room.merchant.spark')}</div>
                <ItemLine
                  data={data}
                  inst={probe(sparkItem)}
                  sub={t('ui.room.merchant.sparkNote', { left: data.balance.economy.emberShop.total - c.emberShop.sold })}
                  selected={sel === 'spark'}
                  onClick={() => pick(sel === 'spark' ? null : 'spark')}
                  side={priceSide(emberSparkPrice(data))}
                />
              </>
            )}
            {(offers.length > 0 || spark) && <div class="hm-subhead">{t('ui.room.merchant.range')}</div>}
            {stock.map((id) => (
              <ItemLine
                key={id}
                data={data}
                inst={probe(id)}
                selected={sel === id}
                onClick={() => pick(sel === id ? null : id)}
                side={priceSide(shopPrice(data, c, itemDef(data, id).price))}
              />
            ))}
          </>
        ) : (
          <ConvoyList items={c.convoy} sel={sel} onSel={pick} />
        )}
      </div>
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
      <span class="hc-line-item__in">
        {extra ?? <UnitHead portrait={unit?.portrait} classId={unit?.classId} name={unit ? unitName(unit) : name} size={40} />}
        <span style={{ minWidth: 0 }}>
          <span class="hc-line-item__name">{name}</span>
          <span class="hc-line-item__sub">{sub}</span>
        </span>
        <span class="hc-line-item__side">{side}</span>
      </span>
    </button>
  );
}

export function HealerRoom({ room, apply, onClose }: { room: RoomDef; apply: Apply; onClose: () => void }) {
  const c = campaign.value!;
  const cfg = data.balance.economy.scarRemoval;
  const cost = scarCost(data, c);
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
          <PrimaryButton disabled={!chosen || c.gold < cost} onClick={() => chosen && apply({ type: 'healScar', unit: chosen.u.id, index: chosen.i }, t('ui.camp.healed')) && setSel(null)}>
            {t('ui.room.healer.heal')} · <Amount resource="gold" value={cost} short={c.gold < cost} />
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
  const room_ = mercenaryRoom(data, c);
  const full = army.mercenaries >= room_;
  // a mercenary of the company chosen to let go (the way out of an over-full company, story 3.7)
  const hired = c.roster.filter(isMercenary);
  const letGo = hired.find((u) => u.id === sel);
  const over = armyOverLimit(data, c);
  return (
    <RoomPanel
      room={room}
      desc={t('ui.room.tavern.limit', { n: army.mercenaries, max: room_, c: army.companions, cmax: data.balance.economy.armyLimit })}
      onClose={onClose}
      actions={
        letGo ? (
          <PrimaryButton onClick={() => apply({ type: 'dismiss', unit: letGo.id }, t('ui.room.tavern.dismissed')) && setSel(null)}>{t('ui.room.tavern.dismiss')}</PrimaryButton>
        ) : (
          <PrimaryButton disabled={!chosen || !!err} onClick={() => chosen && apply({ type: 'hire', offer: chosen.id }, t('ui.room.tavern.hired')) && setSel(null)}>
            {chosen ? (
              <>
                {t('ui.room.tavern.hire')} · <Amount resource="gold" value={cost} short={c.gold < cost} />
              </>
            ) : (
              t('ui.room.tavern.hire')
            )}
          </PrimaryButton>
        )
      }
    >
      {over && <div class="hm-hint is-warn" role="alert">{t('ui.army.over', { n: over.dismiss })}</div>}
      {full && !over && <div class="hm-hint">{t('ui.room.tavern.full')}</div>}
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
      {hired.length > 0 && <div class="hm-subhead">{t('ui.room.tavern.mine')}</div>}
      {hired.map((u) => (
        <PersonLine
          key={u.id}
          unit={u}
          name={`${unitName(u)} · ${t(`class.${u.classId}.name`)}`}
          sub={`${t('ui.lv')} ${u.level}`}
          selected={sel === u.id}
          onClick={() => setSel(sel === u.id ? null : u.id)}
        />
      ))}
    </RoomPanel>
  );
}

// ---------------------------------------------------------------- campfire

export function CampfireRoom({ room, apply, onClose }: { room: RoomDef; apply: Apply; onClose: () => void }) {
  const c = campaign.value!;
  const [talk, setTalk] = useState<{ key: string; dialogue: string } | null>(null);
  const talks = availableSupportTalks(data, c);
  const unit = (id: string) => c.roster.find((u) => u.id === id);
  // talks above the campfire's cap (story 10.8), with the reason: the campfire level that opens them, or S only for core pairs
  const locks = Object.keys(c.supports)
    .filter((k) => k.split('|').every((id) => c.roster.some((r) => r.id === id)))
    .flatMap((key) => {
      const lock = campfireLock(data, c, key);
      return lock ? [{ key, lock }] : [];
    });
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
      {locks.length > 0 && <div class="hm-subhead">{t('ui.room.campfire.locked')}</div>}
      {locks.map(({ key, lock }) => (
        <div key={key} class="hm-bond is-locked">
          <span>{key.split('|').map((id) => t(`unit.${id}.name`)).join(' × ')}</span>
          <small>
            <Icon name="lock" size={14} /> {lock.reason === 'core' ? t('ui.room.campfire.lockCore') : t('ui.room.campfire.lockLevel', { rank: lock.rank, n: lock.level })}
          </small>
        </div>
      ))}
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
      {/* the talk plays full screen like the scenes between missions, not inside the panel (story 9.13);
          into #app, not the body: only #app is as tall as the display in the installed app, so a body portal ends above the home indicator and the room panel shows below it */}
      {talk &&
        createPortal(
          <Scene
            id={talk.dialogue}
            onDone={() => {
              apply({ type: 'unlockSupport', pair: talk.key }, t('ui.camp.bond'));
              setTalk(null);
            }}
          />,
          document.getElementById('app') ?? document.body,
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
        // story 10.6: the enchanter's level caps the tier merged into; the button names the cost from runeMerge
        const m = runeMerge(data, id);
        const err = mergeError(data, c, id);
        const from = m && err === 'room_locked' ? mergeLevelFor(data, m.next.tier ?? 0) : null;
        return (
          <div key={id} class="hm-offer hm-offer--merge">
            <ItemImage data={data} item={id} />
            <span class="hm-offer__name">
              {t(`item.${id}.name`)} ×{n}
              <ItemInfoButton data={data} item={id} />
              {from !== null && <span class="hm-offer__note">{t('ui.room.enchanter.mergeFrom', { n: from })}</span>}
            </span>
            {m && (
              <SecondaryButton disabled={err !== null} onClick={() => apply({ type: 'mergeRunes', rune: id }, t('ui.camp.merged'))}>
                {t('ui.room.enchanter.merge')} · {m.count} × <ItemImage data={data} item={id} size={20} bare /> <Amount resource="gold" value={m.gold} short={c.gold < m.gold} />
              </SecondaryButton>
            )}
          </div>
        );
      })}
      <div class="hm-subhead">{t('ui.camp.buyRunes')}</div>
      {buyable.map((r) => (
        <div key={r.id} class="hm-offer">
          <ItemImage data={data} item={r.id} />
          <span class="hm-offer__name">
            {t(`item.${r.id}.name`)}
            <ItemInfoButton data={data} item={r.id} />
          </span>
          <SecondaryButton disabled={c.gold < shopPrice(data, c, r.price ?? 0)} onClick={() => apply({ type: 'buy', item: r.id }, t('ui.camp.bought'))}>
            <Amount resource="gold" value={shopPrice(data, c, r.price ?? 0)} short={c.gold < shopPrice(data, c, r.price ?? 0)} />
          </SecondaryButton>
        </div>
      ))}
    </RoomPanel>
  );
}

/** Dispatch by room function. */
export function Room({ room, apply, onClose, unit }: { room: RoomDef; apply: Apply; onClose: () => void; unit?: string }) {
  return (
    <RoomApply.Provider value={apply}>
      <RoomBody room={room} apply={apply} onClose={onClose} unit={unit} />
    </RoomApply.Provider>
  );
}

function RoomBody({ room, apply, onClose, unit }: { room: RoomDef; apply: Apply; onClose: () => void; unit?: string }) {
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
    case 'memorial':
      return <MemorialRoom room={room} apply={apply} onClose={onClose} />;
    case 'enchanter':
      return <EnchanterRoom room={room} apply={apply} onClose={onClose} />;
    case 'academy':
      return <AcademyRoom room={room} apply={apply} onClose={onClose} unit={unit} />;
    case 'workshop':
      return <WorkshopRoom room={room} apply={apply} onClose={onClose} />;
    case 'training':
      return <TrainingRoom room={room} onClose={onClose} />;
  }
}

