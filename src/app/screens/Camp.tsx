import { useEffect, useState } from 'preact/hooks';
import {
  availableSupportTalks,
  buy,
  buyOffer,
  canEquip,
  computeStats,
  currentTier,
  equipItem,
  insertRune,
  itemDef,
  loadoutSlots,
  locateItem,
  merchantStock,
  mergeRunes,
  offerPrice,
  removeRune,
  removeScar,
  rerollAffix,
  rerollCost,
  runeSlotCount,
  sell,
  sellPrice,
  setLoadout,
  STAT_KEYS,
  unequip,
  unlockSupport,
  upgrade,
  upgradeCost,
  type CampResult,
  type EquipSlot,
  type ItemInstance,
  type UnitRecord,
} from '../../core';
import { activeSkillIds } from '../../core/rules/skills';
import { t } from '../../i18n';
import { asset, Crest, ItemDetails, ItemRow, itemName, Modal, StatsGrid, Toast, UnitCard, unitName } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { Dialogue } from '../../ui/Dialogue';
import { listSaves, type SaveRecord } from '../../persistence/save';
import { campaign, campaignId, data, nodeDef, pendingEvents, playNode, saveSlot, screen, setCampaign, setFlag, startBattle } from '../store';
import { downloadSave, SlotPicker } from './Menus';
import { audio } from '../audio';

const TABS = ['company', 'convoy', 'merchant', 'smith', 'healer', 'campfire', 'enchanter', 'save'] as const;
type Tab = (typeof TABS)[number];
const FACILITIES = TABS.filter((k) => k !== 'save');
const FAC_ICON: Record<Tab, string> = {
  company: 'company', convoy: 'convoy', merchant: 'merchant', smith: 'smith', enchanter: 'enchanter', healer: 'healer', campfire: 'campfire', save: 'save',
};

/** Node after which a camp facility opens (campaign.yaml `facilities`; 'start' or missing = always). */
function unlockNode(tab: Tab): string | undefined {
  const at = data.campaign.facilities[tab];
  return at && at !== 'start' ? at : undefined;
}
const isOpen = (tab: Tab, done: string[]) => {
  const at = unlockNode(tab);
  return !at || done.includes(at);
};
const shortTitle = (nodeId: string) => {
  const n = data.campaign.nodes.find((x) => x.id === nodeId);
  return n ? t(n.titleKey).split('–')[0]!.trim() : t('ui.hub.later');
};

/** The war camp (U20): one hub with the next mission as the main button and facilities that open over time. */
export function Camp({ tab: initial }: { tab?: string }) {
  const c = campaign.value!;
  const [tab, setTab] = useState<Tab | null>((initial as Tab) ?? null);
  const [toast, setToast] = useState<string | null>(null);
  const talks = availableSupportTalks(data, c);
  useEffect(() => audio.music('camp'), []);
  const apply = (r: CampResult, okText?: string) => {
    if (r.ok) {
      setCampaign(r.campaign);
      audio.sfx('confirm');
      if (okText) setToast(okText);
    } else {
      audio.sfx('error');
      setToast(t(`ui.camp.err.${r.error}`));
    }
  };
  const gold = (
    <div class="panel hub-gold">
      <Icon name="gold" size={18} />
      {c.gold}
    </div>
  );

  if (tab) {
    return (
      <div class="screen" style={{ gap: 12 }}>
        <div class="screen-narrow col" style={{ gap: 12, flex: 1, minHeight: 0 }}>
          <div class="page-head">
            <button class="btn small ghost icon-only" onClick={() => setTab(null)} aria-label={t('ui.back')}>
              <Icon name="back" />
            </button>
            <div class="titles">
              <span class="lbl">{t('ui.camp.title')}</span>
              <h2>{t(`ui.camp.${tab}`)}</h2>
            </div>
            <span class="hub-gold" style={{ padding: 0 }}>
              <Icon name="gold" size={18} />
              {c.gold}
            </span>
          </div>
          {Object.values(c.materials).some((n) => n > 0) && (
            <div class="muted" style={{ fontSize: 13 }}>
              {Object.entries(c.materials)
                .filter(([, n]) => n > 0)
                .map(([m, n]) => `${t(`item.${m}.name`)} ${n}`)
                .join(' · ')}
            </div>
          )}
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {tab === 'company' && <Company apply={apply} />}
            {tab === 'convoy' && <Convoy apply={apply} />}
            {tab === 'merchant' && <Merchant apply={apply} />}
            {tab === 'smith' && <Smith apply={apply} />}
            {tab === 'enchanter' && <Enchanter apply={apply} />}
            {tab === 'healer' && <Healer apply={apply} />}
            {tab === 'campfire' && <Campfire apply={apply} />}
            {tab === 'save' && <SavePanel onToast={setToast} />}
          </div>
        </div>
        {toast && <Toast text={toast} onDone={() => setToast(null)} />}
      </div>
    );
  }

  const last = c.completed[c.completed.length - 1];
  const next = c.available[0] ? nodeDef(c.available[0]) : null;
  const nextMap = next ? data.maps[next.map]! : null;
  const v = nextMap?.objectives.victory;
  const fresh = (k: Tab) => !!last && unlockNode(k) === last;
  return (
    <div class="screen" style={{ gap: 12, background: '#15141a' }}>
      <div class="screen-bg" style={{ backgroundImage: `url(${asset('backgrounds/bg_camp_night.webp')})` }} />
      <div class="screen-narrow col" style={{ gap: 0, flex: 1 }}>
        <div class="hub-head">
          <div class="panel hub-title">
            <span class="display">{t('ui.camp.title')}</span>
            <span class="lbl gold">{last ? t('ui.hub.after', { node: shortTitle(last) }) : t('ui.hub.start')}</span>
          </div>
          <div class="row" style={{ gap: 8 }}>
            {gold}
            <button class="hud-btn" onClick={() => (screen.value = { name: 'options', back: { name: 'camp' } })} aria-label={t('ui.options')}>
              <Icon name="gear" />
            </button>
          </div>
        </div>
        <div class="hub-body edge">
          {next && nextMap && v ? (
            <div class="col" style={{ gap: 12 }}>
              <div class="mission">
                <span class="lbl gold">
                  {t('ui.hub.next')} · {shortTitle(next.id)}
                </span>
                <span class="display">{t(nextMap.nameKey)}</span>
                <span class="muted">{t(`ui.world.goal.${v.type}`, { turns: 'turns' in v ? v.turns : 0 })}</span>
              </div>
              <div class="mission-actions">
                <button class="btn primary big" onClick={() => playNode(next.id)}>
                  {t('ui.hub.setOut')}
                </button>
                <button class="btn" onClick={() => playNode(next.id, { prep: true })}>
                  {t('ui.hub.prep')}
                </button>
              </div>
            </div>
          ) : (
            <div class="mission">
              <span class="display">{t('ui.world.endTitle')}</span>
              <span class="muted">{t('ui.world.endText')}</span>
            </div>
          )}
          <div class="col" style={{ gap: 0 }}>
            {FACILITIES.map((k) => {
              const open = isOpen(k, c.completed);
              const at = unlockNode(k);
              return (
                <button key={k} class="fac" disabled={!open} onClick={() => setTab(k)}>
                  <span class="ico">
                    <Icon name={open ? FAC_ICON[k] : 'lock'} size={19} />
                  </span>
                  {t(`ui.camp.${k}`)}
                  <span class="meta">
                    {!open && at ? (
                      t('ui.hub.unlockAfter', { node: shortTitle(at) })
                    ) : k === 'campfire' && talks.length > 0 ? (
                      <span class="badge">{talks.length}</span>
                    ) : fresh(k) ? (
                      <span class="badge new">{t('ui.hub.new')}</span>
                    ) : (
                      t(`ui.camp.${k}.desc`)
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div class="hub-foot">
            <Icon name="check" size={14} />
            <span class="grow">{t('ui.battle.autosaved')}</span>
            <button class="linkish" onClick={() => setTab('save')}>
              {t('ui.save.title')}
            </button>
            <span aria-hidden="true">·</span>
            <button class="linkish" onClick={() => (screen.value = { name: 'worldmap' })}>
              {t('ui.world.title')}
            </button>
          </div>
        </div>
      </div>
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

type Apply = (r: CampResult, okText?: string) => void;

function Company({ apply }: { apply: Apply }) {
  const c = campaign.value!;
  const [sel, setSel] = useState<string | null>(null);
  const u = sel ? c.roster.find((r) => r.id === sel) : null;
  if (u) return <Inventory unit={u} apply={apply} onBack={() => setSel(null)} />;
  return (
    <div class="list">
      {c.roster.map((r) => (
        <div key={r.id} class="panel sheet" onClick={() => setSel(r.id)} style={{ cursor: 'pointer' }}>
          <UnitCard data={data} unit={r} right={r.scars.length ? <span class="dis">✚{r.scars.length}</span> : null} />
        </div>
      ))}
      {c.fallen.map((f) => (
        <div key={f.id} class="muted">
          ✝ {unitName(f)}
        </div>
      ))}
    </div>
  );
}

const SLOTS: EquipSlot[] = ['mainHand', 'offHand', 'head', 'body', 'accessory1', 'accessory2'];

export function Inventory({ unit, apply, onBack }: { unit: UnitRecord; apply: Apply; onBack: () => void }) {
  const c = campaign.value!;
  const [pick, setPick] = useState<string | null>(null);
  const skills = activeSkillIds(data, unit);
  const before = computeStats(data, unit);
  const pickInst = pick ? c.convoy.find((i) => i.uid === pick) : undefined;
  const target = pickInst ? fitSlot(unit, pickInst) : null;
  const after = pickInst && target ? computeStats(data, { ...unit, equip: { ...unit.equip, [target]: pickInst } }) : null;
  const delta = (k: (typeof STAT_KEYS)[number] | 'mov' | 'as') => {
    if (!after) return null;
    const a = k === 'mov' ? after.mov : k === 'as' ? after.as : k === 'hp' ? after.maxHp : after.stats[k];
    const b = k === 'mov' ? before.mov : k === 'as' ? before.as : k === 'hp' ? before.maxHp : before.stats[k];
    if (a === b) return null;
    return <span class={a > b ? 'adv' : 'dis'}> {a - b > 0 ? `+${a - b}` : a - b}</span>;
  };
  return (
    <div class="col" style={{ gap: 10 }}>
      <div class="row">
        <button class="btn small ghost icon-only" onClick={onBack} aria-label={t('ui.back')}>
          <Icon name="back" />
        </button>
        <Crest id={unit.portrait} name={unitName(unit)} w={48} h={56} />
        <div class="grow col" style={{ gap: 4 }}>
          <div class="unit-name">{unitName(unit)}</div>
          <span class="lbl">
            {t(`class.${unit.classId}.name`)} · {t('ui.lv')} {unit.level}
          </span>
        </div>
      </div>
      <div class="panel sheet">
        <StatsGrid data={data} unit={unit} />
        {after && (
          <div class="row wrap" style={{ marginTop: 6, fontSize: 13 }}>
            {(['hp', 'str', 'mag', 'skl', 'spd', 'lck', 'def', 'res'] as const).map((k) => (
              <span key={k}>
                {delta(k) && (
                  <>
                    {t(`ui.stat.${k}`)}
                    {delta(k)}
                  </>
                )}
              </span>
            ))}
            {delta('as') && (
              <span>
                {t('ui.stat.as')}
                {delta('as')}
              </span>
            )}
            {delta('mov') && (
              <span>
                {t('ui.stat.mov')}
                {delta('mov')}
              </span>
            )}
          </div>
        )}
        <div class="hpbar" style={{ marginTop: 8, height: 8 }}>
          <i style={{ width: `${Math.min(100, (before.load / Math.max(1, before.carry)) * 100)}%`, background: before.overload ? 'linear-gradient(180deg,#f59a8a,#d9413a)' : undefined }} />
        </div>
        <div class="muted" style={{ fontSize: 12 }}>
          {t('ui.stat.load')} {before.load}/{before.carry}
          {before.overload > 0 && <span class="dis"> · {t('ui.overload', { n: before.overload })}</span>}
        </div>
      </div>
      <div>
        <h3>{t('ui.equipment')}</h3>
        <div class="list">
          {SLOTS.map((sl) => {
            const inst = unit.equip[sl];
            return inst ? (
              <ItemRow key={sl} data={data} inst={inst} sub={<><span class="slot-label">{t(`ui.slot.${sl}`)}</span> <ItemDetails data={data} inst={inst} /></>} right={<button class="btn small" onClick={() => apply(unequip(c, inst.uid))}>{t('ui.unequip')}</button>} />
            ) : (
              <div key={sl} class="item-row" style={{ opacity: 0.5 }}>
                <span class="ico">·</span>
                <span class="slot-label">{t(`ui.slot.${sl}`)}</span>
                <span />
              </div>
            );
          })}
          {unit.bag.map((inst) => (
            <ItemRow key={inst.uid} data={data} inst={inst} sub={<><span class="slot-label">{t('ui.slot.bag')}</span> <ItemDetails data={data} inst={inst} /></>} right={<button class="btn small" onClick={() => apply(unequip(c, inst.uid))}>{t('ui.unequip')}</button>} />
          ))}
        </div>
      </div>
      <div>
        <h3>{t('ui.skills')}</h3>
        {skills.map((id) => (
          <div key={id}>
            <b>{t(`skill.${id}.name`)}</b> <span class="muted">– {t(`skill.${id}.desc`)}</span>
          </div>
        ))}
        {Object.entries(unit.sp).map(([sk, sp]) => {
          const cost = Object.values(data.items).find((d) => d.grantsSkill?.skill === sk)?.grantsSkill?.masteryCost ?? 0;
          return (
            <div key={sk} class="muted" style={{ fontSize: 13 }}>
              {t(`skill.${sk}.name`)}: {unit.mastered.includes(sk) ? t('ui.mastered') : `${sp}/${cost} ${t('ui.sp')}`}
            </div>
          );
        })}
        {unit.mastered.length > 0 && (
          <div class="row wrap" style={{ marginTop: 6 }}>
            <span class="muted">
              {t('ui.loadout')} ({unit.loadout.length}/{loadoutSlots(data, unit)}):
            </span>
            {unit.mastered.map((sk) => {
              const on = unit.loadout.includes(sk);
              return (
                <button key={sk} class={`btn small ${on ? 'primary' : ''}`} onClick={() => apply(setLoadout(data, c, unit.id, on ? unit.loadout.filter((x) => x !== sk) : [...unit.loadout, sk]))}>
                  {t(`skill.${sk}.name`)}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div>
        <h3>{t('ui.convoy')}</h3>
        <div class="list">
          {c.convoy
            .filter((i) => !itemDef(data, i).tags?.includes('convoyOnly'))
            .map((inst) => {
              const slot = fitSlot(unit, inst);
              return (
                <ItemRow
                  key={inst.uid}
                  data={data}
                  inst={inst}
                  selected={pick === inst.uid}
                  onClick={() => setPick(pick === inst.uid ? null : inst.uid)}
                  sub={pick === inst.uid ? <ItemDetails data={data} inst={inst} /> : undefined}
                  right={
                    pick === inst.uid ? (
                      <div class="col" style={{ gap: 4 }}>
                        {slot && (
                          <button class="btn small primary" onClick={(e) => { e.stopPropagation(); setPick(null); apply(equipItem(data, c, unit.id, inst.uid, slot)); }}>
                            {t('ui.equip')}
                          </button>
                        )}
                        <button class="btn small" disabled={unit.bag.length >= data.balance.bag.size} onClick={(e) => { e.stopPropagation(); setPick(null); apply(equipItem(data, c, unit.id, inst.uid, 'bag')); }}>
                          {t('ui.toBag')}
                        </button>
                      </div>
                    ) : null
                  }
                />
              );
            })}
        </div>
      </div>
    </div>
  );
}

function fitSlot(unit: UnitRecord, inst: ItemInstance): EquipSlot | null {
  const d = itemDef(data, inst);
  const cands: EquipSlot[] = d.slot === 'accessory' ? (unit.equip.accessory1 ? ['accessory2', 'accessory1'] : ['accessory1', 'accessory2']) : d.slot === 'bag' ? [] : [d.slot as EquipSlot];
  const skills = activeSkillIds(data, unit);
  return cands.find((sl) => {
    const err = canEquip(data, unit, inst, sl, skills);
    return !err || err === 'two_handed';
  }) ?? null;
}

function Convoy({ apply }: { apply: Apply }) {
  const c = campaign.value!;
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div class="list">
      <div class="muted">{t('ui.convoy.count', { n: c.convoy.length, max: data.balance.economy.convoySize })}</div>
      {c.convoy.map((inst) => (
        <ItemRow
          key={inst.uid}
          data={data}
          inst={inst}
          selected={sel === inst.uid}
          onClick={() => setSel(sel === inst.uid ? null : inst.uid)}
          sub={sel === inst.uid ? <ItemDetails data={data} inst={inst} /> : undefined}
          right={
            sellPrice(data, inst) > 0 ? (
              <button class="btn small" onClick={(e) => { e.stopPropagation(); apply(sell(data, c, inst.uid), t('ui.camp.sold')); }}>
                {t('ui.sell')} <span class="num gold">{sellPrice(data, inst)}</span>
              </button>
            ) : null
          }
        />
      ))}
    </div>
  );
}

function Merchant({ apply }: { apply: Apply }) {
  const c = campaign.value!;
  const stock = merchantStock(data, currentTier(data, c));
  return (
    <div class="col">
      {c.offers.length > 0 && (
        <>
          <h3>{t('ui.camp.offers')}</h3>
          <div class="list">
            {c.offers.map((o) => (
              <ItemRow key={o.uid} data={data} inst={o} sub={<ItemDetails data={data} inst={o} />} right={<button class="btn small primary" onClick={() => apply(buyOffer(data, c, o.uid), t('ui.camp.bought'))}>{offerPrice(data, o)}</button>} />
            ))}
          </div>
        </>
      )}
      <h3>{t('ui.camp.stock')}</h3>
      <div class="list">
        {stock.map((id) => {
          const inst: ItemInstance = { uid: `shop-${id}`, def: id, upgrade: 0, affixes: [], runes: [] };
          return <ItemRow key={id} data={data} inst={inst} sub={<ItemDetails data={data} inst={inst} />} right={<button class="btn small" disabled={c.gold < itemDef(data, id).price} onClick={() => apply(buy(data, c, id), t('ui.camp.bought'))}>{itemDef(data, id).price}</button>} />;
        })}
      </div>
    </div>
  );
}

function allGear(): Array<{ inst: ItemInstance; owner?: UnitRecord }> {
  const c = campaign.value!;
  const out: Array<{ inst: ItemInstance; owner?: UnitRecord }> = [];
  for (const u of c.roster) for (const inst of [...Object.values(u.equip), ...u.bag]) if (inst) out.push({ inst, owner: u });
  for (const inst of c.convoy) out.push({ inst });
  return out;
}

function Smith({ apply }: { apply: Apply }) {
  const c = campaign.value!;
  const gear = allGear().filter(({ inst }) => ['weapon', 'tome', 'armor', 'shield'].includes(itemDef(data, inst).kind));
  return (
    <div class="list">
      <div class="muted">{t('ui.camp.smith.hint')}</div>
      {gear.map(({ inst, owner }) => {
        const cost = upgradeCost(data, inst);
        const rr = rerollCost(data, inst);
        return (
          <ItemRow
            key={inst.uid}
            data={data}
            inst={inst}
            sub={
              <>
                {owner ? unitName(owner) : t('ui.convoy')} · {cost ? `${t('ui.camp.upgradeCost')}: ${cost.gold} + ${Object.entries(cost.materials).map(([m, n]) => `${t(`item.${m}.name`)} ${n}`).join(', ')}` : t('ui.camp.maxed')}
              </>
            }
            right={
              <div class="col" style={{ gap: 4 }}>
                <button class="btn small" disabled={!cost} onClick={() => apply(upgrade(data, c, inst.uid), t('ui.camp.upgraded'))}>
                  <Icon name="smith" size={16} />+{inst.upgrade + 1}
                </button>
                {inst.affixes.map((a, i) => (
                  <button key={a} class="btn small ghost" onClick={() => apply(rerollAffix(data, c, inst.uid, i), t('ui.camp.rerolled'))}>
                    <Icon name="restart" size={16} />
                    {t(`affix.${a}`)} ({rr.gold})
                  </button>
                ))}
              </div>
            }
          />
        );
      })}
    </div>
  );
}

function Enchanter({ apply }: { apply: Apply }) {
  const c = campaign.value!;
  const [sel, setSel] = useState<string | null>(null);
  const runes = c.convoy.filter((i) => data.runes[i.def]);
  const gear = allGear().filter(({ inst }) => runeSlotCount(data, inst) > 0);
  const selInst = sel ? locateItem(c, sel)?.inst : undefined;
  const buyable = Object.values(data.runes).filter((r) => r.price && (r.tier ?? 1) === 1 || (r.utility && r.price));
  return (
    <div class="col">
      <div class="muted">{t('ui.camp.enchanter.hint')}</div>
      <h3>{t('ui.camp.gear')}</h3>
      <div class="list">
        {gear.map(({ inst, owner }) => (
          <ItemRow key={inst.uid} data={data} inst={inst} selected={sel === inst.uid} onClick={() => setSel(sel === inst.uid ? null : inst.uid)} sub={<>{owner ? unitName(owner) : t('ui.convoy')} · <ItemDetails data={data} inst={inst} /></>} />
        ))}
      </div>
      {selInst && (
        <div class="panel sheet col">
          <b>{itemName(data, selInst)}</b>
          {selInst.runes.map((r, i) =>
            r ? (
              <button key={i} class="btn small" onClick={() => apply(removeRune(data, c, selInst.uid, i))}>
                <Icon name="close" size={16} />
                {t(`item.${r}.name`)}
              </button>
            ) : null,
          )}
          {runes.map((r) => (
            <button key={r.uid} class="btn small" onClick={() => apply(insertRune(data, c, selInst.uid, r.uid), t('ui.camp.enchanted'))}>
              <Icon name="rune" size={16} />
              {t(`item.${r.def}.name`)}
            </button>
          ))}
        </div>
      )}
      <h3>{t('ui.camp.runes')}</h3>
      <div class="list">
        {[...new Set(runes.map((r) => r.def))].map((id) => (
          <div key={id} class="item-row">
            <span class="ico"><Icon name="rune" /></span>
            <span>
              {t(`item.${id}.name`)} ×{runes.filter((r) => r.def === id).length}
            </span>
            <button class="btn small ghost" disabled={runes.filter((r) => r.def === id).length < data.balance.economy.runeMerge.count} onClick={() => apply(mergeRunes(data, c, id), t('ui.camp.merged'))}>
              {t('ui.camp.merge')}
            </button>
          </div>
        ))}
      </div>
      <h3>{t('ui.camp.buyRunes')}</h3>
      <div class="list">
        {buyable.map((r) => (
          <div key={r.id} class="item-row">
            <span class="ico"><Icon name="rune" /></span>
            <span>{t(`item.${r.id}.name`)}</span>
            <button class="btn small" disabled={c.gold < (r.price ?? 0)} onClick={() => apply(buy(data, c, r.id), t('ui.camp.bought'))}>
              {r.price}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Healer({ apply }: { apply: Apply }) {
  const c = campaign.value!;
  const scarred = c.roster.filter((u) => u.scars.length);
  const herb = c.convoy.some((i) => i.def === data.balance.economy.scarRemoval.altItem);
  if (!scarred.length) return <div class="muted">{t('ui.camp.healer.none')}</div>;
  return (
    <div class="list">
      {scarred.map((u) =>
        u.scars.map((sc, i) => (
          <div key={u.id + sc} class="item-row">
            <span class="ico"><Icon name="healer" /></span>
            <span>
              {unitName(u)}: {t(`scar.${sc}`)}
            </span>
            <div class="col" style={{ gap: 4 }}>
              <button class="btn small" onClick={() => apply(removeScar(data, c, u.id, i), t('ui.camp.healed'))}>
                {data.balance.economy.scarRemoval.gold}
              </button>
              {herb && (
                <button class="btn small ghost" onClick={() => apply(removeScar(data, c, u.id, i, true), t('ui.camp.healed'))}>
                  {t('item.seers_herb.name')}
                </button>
              )}
            </div>
          </div>
        )),
      )}
    </div>
  );
}

function Campfire({ apply }: { apply: Apply }) {
  const c = campaign.value!;
  const [talk, setTalk] = useState<{ key: string; dialogue: string } | null>(null);
  const talks = availableSupportTalks(data, c);
  return (
    <div class="col">
      <div class="muted">{t('ui.camp.campfire.hint')}</div>
      {talks.length === 0 && <div class="muted">{t('ui.camp.campfire.none')}</div>}
      {talks.map((x) => {
        const [a, b] = x.key.split('|') as [string, string];
        return (
          <button key={x.key} class="btn" style={{ justifyContent: 'space-between' }} onClick={() => setTalk(x)}>
            <span>
              {t(`unit.${a}.name`)} × {t(`unit.${b}.name`)}
            </span>
            <span class="gold">{x.rank}</span>
          </button>
        );
      })}
      <h3>{t('ui.camp.bonds')}</h3>
      {Object.entries(c.supports)
        .filter(([k]) => k.split('|').every((id) => c.roster.some((r) => r.id === id)))
        .map(([k, st]) => (
          <div key={k} class="row">
            <span class="grow">
              {k.split('|').map((id) => t(`unit.${id}.name`)).join(' × ')}
            </span>
            <span class="num gold">{st.rank ?? '–'}</span>
            <span class="muted num">{st.points}</span>
          </div>
        ))}
      {talk && (
        <Dialogue
          data={data}
          id={talk.dialogue}
          flags={c.flags}
          avatarPortrait={c.avatar.portrait}
          onFlag={setFlag}
          onDone={() => {
            apply(unlockSupport(data, campaign.value!, talk.key), t('ui.camp.bond'));
            setTalk(null);
          }}
        />
      )}
    </div>
  );
}

function SavePanel({ onToast }: { onToast: (s: string) => void }) {
  const [saves, setSaves] = useState<SaveRecord[]>([]);
  const [picker, setPicker] = useState(false);
  const refresh = () => void (campaignId.value ? listSaves(campaignId.value).then(setSaves) : setSaves([]));
  useEffect(refresh, []);
  return (
    <div class="col">
      <button class="btn" onClick={() => setPicker(true)}>
        <Icon name="save" />
        {t('ui.save.title')}
      </button>
      {saves.filter((s) => s.slot !== 'auto').map((s) => (
        <button key={s.slot} class="btn ghost" onClick={() => downloadSave(s)}>
          <Icon name="download" />
          {t('ui.save.export')} {t('ui.save.slot')} {s.slot}
        </button>
      ))}
      {saves.find((s) => s.slot === 'auto') && (
        <button class="btn ghost" onClick={() => downloadSave(saves.find((s) => s.slot === 'auto')!)}>
          <Icon name="download" />
          {t('ui.save.export')} ({t('ui.save.auto')})
        </button>
      )}
      {picker && (
        <SlotPicker
          save
          saves={saves}
          onClose={() => setPicker(false)}
          onPick={(slot) => {
            void saveSlot(slot).then(() => {
              setPicker(false);
              refresh();
              onToast(t('ui.save.done'));
            });
          }}
        />
      )}
    </div>
  );
}

/** Preparation before a mission: choose units (forced ones fixed), check equipment, start. */
export function Prep({ node }: { node: string }) {
  const c = campaign.value!;
  const nd = data.campaign.nodes.find((n) => n.id === node)!;
  const map = data.maps[nd.map]!;
  const forced = map.deploy.forced;
  const [chosen, setChosen] = useState<string[]>(() => {
    const list = [...forced.filter((id) => c.roster.some((r) => r.id === id))];
    for (const r of c.roster) if (list.length < map.deploy.max && !list.includes(r.id)) list.push(r.id);
    return list;
  });
  const [inv, setInv] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const apply: Apply = (r) => (r.ok ? setCampaign(r.campaign) : setToast(t(`ui.camp.err.${r.error}`)));
  const invUnit = inv ? c.roster.find((r) => r.id === inv) : null;
  return (
    <div class="screen" style={{ gap: 10 }}>
      <div class="screen-narrow col" style={{ gap: 10 }}>
        <div class="row">
          <button class="btn small ghost icon-only" onClick={() => (screen.value = { name: 'camp' })} aria-label={t('ui.back')}>
            <Icon name="back" />
          </button>
          <h2 class="grow">{t('ui.prep.title')}</h2>
        </div>
        <div class="panel sheet">
          <h3>{t(nd.titleKey)}</h3>
          <div class="muted">{t(`ui.world.goal.${map.objectives.victory.type}`, { turns: 'turns' in map.objectives.victory ? map.objectives.victory.turns : 0 })}</div>
          <div class="muted">{t('ui.prep.count', { n: chosen.length, max: map.deploy.max })}</div>
        </div>
        {invUnit ? (
          <Inventory unit={invUnit} apply={apply} onBack={() => setInv(null)} />
        ) : (
          <div class="list">
            {c.roster.map((r) => {
              const on = chosen.includes(r.id);
              const locked = forced.includes(r.id);
              return (
                <div key={r.id} class="panel sheet" style={{ opacity: on ? 1 : 0.6 }}>
                  <UnitCard
                    data={data}
                    unit={r}
                    right={
                      <div class="col" style={{ gap: 4 }}>
                        <button
                          class={`btn small ${on ? 'primary' : ''}`}
                          disabled={locked || (!on && chosen.length >= map.deploy.max)}
                          onClick={() => setChosen(on ? chosen.filter((x) => x !== r.id) : [...chosen, r.id])}
                        >
                          <Icon name={locked ? 'lock' : on ? 'check' : 'plus'} size={18} />
                        </button>
                        <button class="btn small ghost icon-only" onClick={() => setInv(r.id)} aria-label={t('ui.inventory')}>
                          <Icon name="bag" size={18} />
                        </button>
                      </div>
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
        {!invUnit && (
          <button
            class="btn primary"
            onClick={() => {
              pendingEvents.value = startBattle(node, chosen);
            }}
          >
            {t('ui.prep.start')}
          </button>
        )}
      </div>
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

export { Modal };
