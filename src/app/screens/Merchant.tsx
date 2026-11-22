/**
 * Merchant (story 16.17, EXPERIENCE "Händler (zuerst die Person)"): first the person, then the list. The person bar on top says
 * for whom the player shops (the convoy last); the list shows what that figure can wear grouped by place, each row with the one
 * or two most important changes as chips; a tap opens the whole change list and the buttons "Buy and equip" (one campaign
 * command: `buy` / `buyOffer` with `for`) and "To the convoy". What the figure cannot wear sits collapsed at the bottom with the
 * reason. With the convoy medallion the rows show who can hold the item and buy into the convoy only. Selling stays as it was.
 * From level 2 a larger range, from level 3 the deal of the day and the ember spark (story 10.9). All prices come from the
 * functions the commands charge with (`shopPrice`, `offerPrice`, `emberSparkPrice`), the list from `merchantList`.
 */
import { Fragment } from 'preact';
import { useState } from 'preact/hooks';
import {
  CONVOY_SHOPPER,
  emberSparkOffered,
  emberSparkPrice,
  merchantList,
  priceChangePct,
  sellPrice,
  type CampaignCommand,
  type ItemInstance,
  type MerchantRow,
  type RoomDef,
} from '../../core';
import { t } from '../../i18n';
import { ChangeChips, ChangeList } from '../../ui/ChangeList';
import { ItemLine, unitName } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { itemName } from '../../ui/itemInfo';
import { Amount, PrimaryButton, SecondaryButton, Tabs } from '../../ui/pieces';
import { Sparks } from '../../ui/Sparks';
import { campaign, data } from '../state/session';
import { shopper } from '../state/shopper';
import { reason } from './Equip';
import { PersonBar } from './PersonBar';
import { ConvoyList, RoomPanel, type Apply } from './Rooms';
import { UnitHead } from './unitArt';
import './Merchant.css';

const probe = (id: string): ItemInstance => ({ uid: `shop-${id}`, def: id, upgrade: 0, affixes: [], runes: [] });

/** What the open row buys: a row of the list or the ember spark. */
type Open = { kind: 'row'; key: string } | { kind: 'spark' };

export function MerchantRoom({ room, apply, onClose }: { room: RoomDef; apply: Apply; onClose: () => void }) {
  const c = campaign.value!;
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [open, setOpen] = useState<Open | null>(null);
  const [sel, setSel] = useState<string | null>(null); // sell tab
  const [offOpen, setOffOpen] = useState(false);
  const [moment, setMoment] = useState(0);
  const who = shopper.value === CONVOY_SHOPPER ? CONVOY_SHOPPER : (c.roster.find((u) => u.id === shopper.value)?.id ?? c.roster[0]!.id);
  const list = merchantList(data, c, who);
  const spark = emberSparkOffered(data, c);
  const pct = priceChangePct(data, c);
  const owned = tab === 'sell' && sel ? c.convoy.find((i) => i.uid === sel) : undefined;
  const sellFor = owned ? sellPrice(data, owned) : 0;
  const convoyFull = c.convoy.length >= data.balance.economy.convoySize;
  const name = list.unit ? unitName(list.unit) : '';

  const choose = (id: string) => {
    shopper.value = id;
    setOpen(null);
    setOffOpen(false);
  };
  const buy = (cmd: CampaignCommand) => {
    if (apply(cmd, t('ui.camp.bought'))) setOpen(null);
  };
  const buyRow = (row: MerchantRow, toConvoy: boolean) => {
    const target = !toConvoy && row.plan?.slot ? { unit: list.unit!.id, slot: row.plan.slot } : undefined;
    buy(row.pick.kind === 'stock' ? { type: 'buy', item: row.pick.id, for: target } : { type: 'buyOffer', uid: row.pick.uid, for: target });
  };
  const priceSide = (value: number) => <Amount resource="gold" value={value} short={c.gold < value} />;

  const renderRow = (row: MerchantRow, dim?: string) => {
    const isOpen = open?.kind === 'row' && open.key === row.key;
    const heads = row.users;
    const sub = dim ? (
      <span class="mc-why">
        <Icon name="lock" size={12} /> {dim}
      </span>
    ) : list.mode === 'convoy' ? (
      <span class="mc-heads" aria-label={heads.map(unitName).join(', ')}>
        {heads.slice(0, 6).map((u) => (
          <UnitHead key={u.id} portrait={u.portrait} classId={u.classId} name={unitName(u)} size={22} />
        ))}
        {heads.length > 6 && <span class="mc-more">+{heads.length - 6}</span>}
      </span>
    ) : row.change && row.change.lines.length > 0 ? (
      <ChangeChips result={row.change} />
    ) : row.same ? (
      <span class="mc-same">{t('ui.change.alreadyWorn')}</span>
    ) : undefined;
    const plan = row.plan;
    const short = c.gold < row.price;
    const why = plan?.error === 'bag_full' ? t('ui.equip.why.bag_full') : plan?.error === 'convoy_full' || (list.mode === 'convoy' && convoyFull) ? t('ui.camp.err.convoy_full') : '';
    return (
      <Fragment key={row.key}>
        <ItemLine
          data={data}
          inst={row.inst}
          sub={sub}
          tag={row.offer ? t('ui.room.merchant.dealTag') : undefined}
          dim={!!dim}
          selected={isOpen}
          onClick={() => setOpen(isOpen ? null : { kind: 'row', key: row.key })}
          side={priceSide(row.price)}
        />
        {isOpen && !dim && (
          <div class="mc-open">
            {list.unit && row.change && <ChangeList result={row.change} empty={row.same ? 'ui.change.alreadyWorn' : undefined} />}
            {plan && plan.displaced.length > 0 && !plan.error && (
              <p class="mc-note">{t('ui.room.merchant.toConvoy', { item: plan.displaced.map((i) => itemName(data, i)).join(', ') })}</p>
            )}
            {why && <p class="mc-note is-warn">{why}</p>}
            <div class="mc-btns">
              {list.unit && plan && !row.same && (
                <PrimaryButton disabled={short || !!plan.error} onClick={() => buyRow(row, false)}>
                  {plan.slot === 'bag' ? t('ui.room.merchant.buyBag') : t('ui.room.merchant.buyEquip')} · {priceSide(row.price)}
                </PrimaryButton>
              )}
              {list.mode === 'convoy' ? (
                <PrimaryButton disabled={short || convoyFull} onClick={() => buyRow(row, true)}>
                  {t('ui.room.merchant.buyConvoy')} · {priceSide(row.price)}
                </PrimaryButton>
              ) : (
                <SecondaryButton
                  class={row.same ? undefined : 'mc-convoy'}
                  aria-label={t('ui.room.merchant.buyConvoy')}
                  title={t('ui.room.merchant.buyConvoy')}
                  disabled={short || convoyFull}
                  onClick={() => buyRow(row, true)}
                >
                  {row.same ? t('ui.room.merchant.buyConvoy') : <Icon name="convoy" size={22} />}
                </SecondaryButton>
              )}
            </div>
          </div>
        )}
      </Fragment>
    );
  };

  const sparkOpen = open?.kind === 'spark';
  const sparkPrice = emberSparkPrice(data);
  const cannotRows = list.cannot;
  return (
    <RoomPanel
      room={room}
      onClose={onClose}
      actions={
        tab === 'sell' ? (
          <PrimaryButton disabled={!owned || sellFor <= 0} onClick={() => owned && apply({ type: 'sell', uid: owned.uid }, t('ui.camp.sold')) && setSel(null)}>
            {owned && sellFor > 0 ? (
              <>
                {t('ui.sell')} · <Amount resource="gold" value={sellFor} />
              </>
            ) : (
              t('ui.sell')
            )}
          </PrimaryButton>
        ) : undefined
      }
    >
      <div class="hm-merchant">
        {moment > 0 && <Sparks key={moment} />}
        <div class="hm-merchant__head">
          <Tabs
            value={tab}
            onChange={(v) => {
              setTab(v);
              setOpen(null);
              setSel(null);
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
        {tab === 'buy' ? (
          <>
            <PersonBar units={c.roster} value={who} onChange={choose} convoy={{ count: c.convoy.length, max: data.balance.economy.convoySize }} />
            {list.groups.map((g) => (
              <section key={g.group} class="mc-group">
                <div class="hm-subhead">{t(`ui.room.merchant.group.${g.group}`)}</div>
                {g.rows.map((row) => renderRow(row))}
              </section>
            ))}
            {list.groups.length === 0 && list.unit && <p class="hm-none">{t('ui.room.merchant.nothingFor', { name })}</p>}
            {spark && (
              <section class="mc-group">
                <div class="hm-subhead">{t('ui.room.merchant.spark')}</div>
                <ItemLine
                  data={data}
                  inst={probe(data.balance.economy.emberShop.item)}
                  sub={t('ui.room.merchant.sparkNote', { left: data.balance.economy.emberShop.total - c.emberShop.sold })}
                  selected={sparkOpen}
                  onClick={() => setOpen(sparkOpen ? null : { kind: 'spark' })}
                  side={priceSide(sparkPrice)}
                />
                {sparkOpen && (
                  <div class="mc-open">
                    <p class="mc-note">{t('ui.room.merchant.sparkConvoyOnly')}</p>
                    <div class="mc-btns">
                      <PrimaryButton
                        disabled={c.gold < sparkPrice || convoyFull}
                        onClick={() => {
                          if (apply({ type: 'buyEmberSpark' }, t('ui.camp.bought'))) {
                            setOpen(null);
                            setMoment((n) => n + 1);
                          }
                        }}
                      >
                        {t('ui.room.merchant.buyConvoy')} · {priceSide(sparkPrice)}
                      </PrimaryButton>
                    </div>
                  </div>
                )}
              </section>
            )}
            {cannotRows.length > 0 && (
              <section class="mc-group mc-cannot">
                <button type="button" class="mc-offhead" aria-expanded={offOpen} onClick={() => setOffOpen(!offOpen)}>
                  <Icon name="lock" size={14} />
                  <span>{t('ui.room.merchant.cannot', { name, n: cannotRows.length })}</span>
                  <Icon name="forward" size={14} class="mc-chev" />
                </button>
                {offOpen && cannotRows.map((x) => renderRow(x.row, reason(list.unit!, x.row.inst, x.error)))}
              </section>
            )}
          </>
        ) : (
          <ConvoyList items={c.convoy} sel={sel} onSel={setSel} />
        )}
      </div>
    </RoomPanel>
  );
}
