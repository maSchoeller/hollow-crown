/** Story 10.9: Händler der Stufen 2 und 3 – lists `roomLevel: 2`, deal of the day, discount cap and the ember spark rotation. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  clone,
  dailyOffersOpen,
  emberSparkOffered,
  merchantLevel,
  newCampaign,
  newItem,
  normalizeCampaign,
  offerPrice,
  priceChangePct,
  replayCampaign,
  shopPrice,
  shopStock,
  storiesDone,
  validateCampaign,
  type CampaignCommand,
  type CampaignState,
  type GameData,
} from '../../src/core';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

/** Act 2 in the castle with the given merchant level and gold; `act: 1` gives the camp of act 1. */
function castle(opts: { merchant?: number; gold?: number; act?: number; priceMods?: number[] } = {}): CampaignState {
  const c = clone(base);
  c.act = opts.act ?? 2;
  c.home = c.act >= 2 ? { kind: 'castle', rooms: opts.merchant ? { merchant: opts.merchant } : {} } : { kind: 'camp', rooms: {} };
  c.gold = opts.gold ?? 20000;
  c.priceMods = (opts.priceMods ?? []).map((pct) => ({ pct, act: c.act }));
  return c;
}

/** Validates, applies twice from the same state (determinism) and returns the result. */
function run(c: CampaignState, cmd: CampaignCommand) {
  expect(validateCampaign(data, c, cmd)).toBeNull();
  const a = applyCampaign(data, c, cmd);
  expect(applyCampaign(data, clone(c), cmd)).toEqual(a);
  return a;
}

/** Marks the first `n` story missions of act 1 as completed (the clock of the ember spark counts every act). */
function withStories(c: CampaignState, n: number): CampaignState {
  const ids = data.acts[1]!.nodes.filter((x) => x.kind === 'story').map((x) => x.id);
  return { ...c, completed: ids.slice(0, n) };
}

describe('larger range (roomLevel)', () => {
  it('a list with roomLevel 2 is on sale only once the merchant is built to level 2', () => {
    const list = data.acts[2]!.merchant.find((m) => m.roomLevel === 2)!;
    expect(list.items.length).toBeGreaterThan(0);
    const c = castle();
    expect(merchantLevel(data, c)).toBe(1);
    for (const id of list.items) expect(shopStock(data, c)).not.toContain(id);
    expect(validateCampaign(data, c, { type: 'buy', item: list.items[0]! })).toBe('not_for_sale');
    const built = run(c, { type: 'buildRoom', room: 'merchant' }).campaign;
    expect(merchantLevel(data, built)).toBe(2);
    for (const id of list.items) expect(shopStock(data, built)).toContain(id);
    expect(validateCampaign(data, built, { type: 'buy', item: list.items[0]! })).toBeNull();
  });

  it('a fixture list with roomLevel 2 keeps its tier and leaves the act-progress tiers unchanged', () => {
    const d: GameData = { ...data, acts: { ...data.acts, 2: { ...data.acts[2]!, merchant: [{ tier: 0, items: ['vulnerary'] }, { tier: 1, roomLevel: 2, items: ['torch'] }] } } };
    expect(shopStock(d, castle({ merchant: 2 }))).toEqual(['vulnerary']); // tier 1 not reached yet
    expect(shopStock(d, castle({ merchant: 3 }))).toEqual(['vulnerary']);
    const later = { ...castle({ merchant: 2 }), completed: d.acts[2]!.nodes.filter((n) => n.merchantTier >= 1).map((n) => n.id) };
    expect(shopStock(d, later)).toEqual(['vulnerary', 'torch']);
    expect(shopStock(d, { ...later, home: { kind: 'castle', rooms: {} } })).toEqual(['vulnerary']);
  });

  it('act 1 is untouched: the camp merchant is level 1 and has no roomLevel lists', () => {
    const c = castle({ act: 1 });
    expect(merchantLevel(data, c)).toBe(1);
    expect(data.acts[1]!.merchant.every((m) => (m.roomLevel ?? 1) === 1)).toBe(true);
    expect(priceChangePct(data, c)).toBe(0);
  });
});

describe('deal of the day', () => {
  it('opens from merchant level 3 and is bought with buyOffer', () => {
    expect(data.balance.economy.dailyOfferFromMerchantLevel).toBe(3);
    for (const level of [1, 2]) {
      const c = castle({ merchant: level });
      c.offers = [newItem(c, 'iron_sword', data)];
      expect(dailyOffersOpen(data, c)).toBe(false);
      expect(validateCampaign(data, c, { type: 'buyOffer', uid: c.offers[0]!.uid })).toBe('not_for_sale');
    }
    const c = castle({ merchant: 3 });
    c.offers = [newItem(c, 'iron_sword', data)];
    const uid = c.offers[0]!.uid;
    expect(dailyOffersOpen(data, c)).toBe(true);
    const r = run(c, { type: 'buyOffer', uid });
    expect(r.campaign.gold).toBe(c.gold - offerPrice(data, c.offers[0]!, c));
    expect(r.campaign.convoy.some((i) => i.uid === uid)).toBe(true);
    expect(r.campaign.offers).toEqual([]);
    expect(validateCampaign(data, { ...c, gold: 0 }, { type: 'buyOffer', uid })).toBe('not_enough_gold');
  });
});

describe('discount', () => {
  it('the merchant gives 0/0/10 % by level', () => {
    expect(priceChangePct(data, castle({ merchant: 1 }))).toBe(0);
    expect(priceChangePct(data, castle({ merchant: 2 }))).toBe(0);
    expect(priceChangePct(data, castle({ merchant: 3 }))).toBe(-10);
  });

  it('sums priceMods and the merchant: −10, −20, −30 and a capped sum over 30', () => {
    expect(shopPrice(data, castle({ priceMods: [-10] }), 1000)).toBe(900);
    expect(shopPrice(data, castle({ merchant: 3, priceMods: [-10] }), 1000)).toBe(800);
    expect(shopPrice(data, castle({ merchant: 3, priceMods: [-10, -10] }), 1000)).toBe(700);
    const over = castle({ merchant: 3, priceMods: [-10, -10, -10] });
    expect(priceChangePct(data, over)).toBe(-data.balance.economy.maxDiscountPct);
    expect(shopPrice(data, over, 1000)).toBe(700);
    // a priceMod of another act does not count
    expect(shopPrice(data, { ...castle({ merchant: 1 }), priceMods: [{ pct: -10, act: 1 }] }, 1000)).toBe(1000);
  });

  it('the purchase charges the discounted price, selling stays at half the base price', () => {
    const c = castle({ merchant: 3, priceMods: [-10] });
    const bought = run(c, { type: 'buy', item: 'vulnerary' }).campaign;
    expect(bought.gold).toBe(c.gold - shopPrice(data, c, data.items.vulnerary!.price));
    const uid = bought.convoy.at(-1)!.uid;
    const sold = run(bought, { type: 'sell', uid }).campaign;
    expect(sold.gold - bought.gold).toBe(Math.floor(data.items.vulnerary!.price * data.balance.economy.sellRatio));
  });
});

describe('ember spark', () => {
  const price = () => data.items.ember_spark!.price;

  it('is not offered below level 3', () => {
    for (const level of [1, 2]) {
      const c = castle({ merchant: level });
      expect(emberSparkOffered(data, c)).toBe(false);
      expect(validateCampaign(data, c, { type: 'buyEmberSpark' })).toBe('not_available');
    }
  });

  it('first at once from level 3, the next only after another story mission, three in all, never discounted', () => {
    let c = withStories(castle({ merchant: 3, priceMods: [-10, -10], gold: 50000 }), 2);
    expect(price()).toBe(3000);
    const cmds: CampaignCommand[] = [];
    const buy = () => {
      const r = run(c, { type: 'buyEmberSpark' });
      cmds.push({ type: 'buyEmberSpark' });
      expect(r.campaign.gold).toBe(c.gold - price());
      expect(r.events).toEqual([
        { t: 'goldChanged', delta: -price(), gold: c.gold - price() },
        { t: 'itemGained', uid: r.campaign.convoy.at(-1)!.uid, def: 'ember_spark' },
      ]);
      c = r.campaign;
    };
    const start = c;
    buy();
    expect(c.emberShop).toEqual({ sold: 1, lastSoldAtStory: 2 });
    expect(validateCampaign(data, c, { type: 'buyEmberSpark' })).toBe('not_available');
    c = withStories(c, 3);
    buy();
    c = withStories(c, 4);
    buy();
    expect(c.emberShop).toEqual({ sold: 3, lastSoldAtStory: 4 });
    c = withStories(c, 6);
    expect(emberSparkOffered(data, c)).toBe(false);
    expect(validateCampaign(data, c, { type: 'buyEmberSpark' })).toBe('not_available');
    expect(c.convoy.filter((i) => i.def === 'ember_spark')).toHaveLength(3);
    // replay: the first purchase from the same start gives the same campaign
    expect(replayCampaign(data, start, cmds.slice(0, 1))).toEqual(applyCampaign(data, start, cmds[0]!).campaign);
  });

  it('counts story missions over all acts, side quests do not count', () => {
    const c = withStories(castle(), 3);
    expect(storiesDone(data, c)).toBe(3);
    const side = data.acts[1]!.nodes.find((n) => n.kind !== 'story');
    if (side) expect(storiesDone(data, { ...c, completed: [...c.completed, side.id] })).toBe(3);
  });

  it('errors without a change: not_enough_gold, convoy_full', () => {
    const poor = castle({ merchant: 3, gold: 2999 });
    expect(validateCampaign(data, poor, { type: 'buyEmberSpark' })).toBe('not_enough_gold');
    const full = castle({ merchant: 3 });
    while (full.convoy.length < data.balance.economy.convoySize) full.convoy.push(newItem(full, 'vulnerary', data));
    expect(validateCampaign(data, full, { type: 'buyEmberSpark' })).toBe('convoy_full');
  });

  it('old saves get the default state', () => {
    const old = clone(base) as Partial<CampaignState>;
    delete old.emberShop;
    expect(normalizeCampaign(data, old as CampaignState).emberShop).toEqual({ sold: 0, lastSoldAtStory: null });
  });
});
