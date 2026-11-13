# Story 10.9: Händler der Stufen 2 und 3

Status: review

## Story

Als Spieler
möchte ich, dass ein ausgebauter Händler mehr Ware, ein Angebot des Tages, Rabatt und Glutfunken bietet,
damit sich der Ausbau des Händlers lohnt.

## Acceptance Criteria

1. `merchant[].roomLevel` (optional, Default 1) im Schema; eine Liste mit `roomLevel: 2` erscheint erst ab Händler-Stufe 2, das Sortiment nach `merchantTier` bleibt; Test mit Fixture-Liste und der echten Akt-2-Liste erst nach `buildRoom merchant`.
2. Ab `economy.dailyOfferFromMerchantLevel: 3` zeigt das Panel „Angebot des Tages“ (`c.offers`, Item, Affix, Preis), Kauf über `buyOffer`; darunter erscheint der Abschnitt nicht.
3. `economy.merchantDiscountByLevel: [0, 0, 10]`, `maxDiscountPct: 30`: `shopPrice` = Summe aller `priceMod` des Akts plus Händler-Rabatt, höchstens −30 %; Verkaufen bleibt 50 %; Marke „−20 %“ im Panel; Tests −10, −20, −30, gedeckelte Summe.
4. `c.emberShop = { sold, lastSoldAtStory }` (Default); ab Stufe 3 genau ein Glutfunke für ● 3 000 ohne Rabatt, solange < 3 verkauft und seit dem letzten Kauf eine weitere Story-Mission (alle Akte) abgeschlossen ist; `buyEmberSpark` mit `goldChanged`, `itemGained`, Funken-Moment; Fehler `not_available`, `not_enough_gold`.
5. `tests/unit/merchant-levels.test.ts`; Kettensimulation kauft Glutfunken, sobald ● 3 000 frei sind, und meldet sie; Handbuch `rooms_upgrade` nennt die Händler-Stufen als Verweise.
6. Zusatz (Epic-Kopf, 11.5 ist gemergt): Inhalt der Akt-2-Liste `roomLevel: 2` eintragen.

## Tasks / Subtasks

- [x] Inhalt: `balance.economy` (Rabatt, Deckel, Angebot, `emberShop`), Schemas, Akt-2-Liste `roomLevel: 2`, Locales DE/EN, Handbuch `rooms_upgrade` (AC 1–6)
- [x] Kern: `merchantLevel`, `merchantDiscount`, `priceChangePct`, `shopPrice`, `dailyOffersOpen`, `storiesDone`, `emberSparkOffered`, `emberSparkPrice` in `core/campaign/aid.ts`; `merchantStock(…, level)`, `shopStock`; `buyOffer`-Sperre, Command `buyEmberSpark`; `CampaignState.emberShop` mit Default (AC 1–4)
- [x] UI: Händler-Panel mit Angebot des Tages, Glutfunke, Rabatt-Marke, Funken-Moment (AC 2–4)
- [x] Simulation: Glutfunken kaufen, Ausgabe „ember sparks … (n bought)“ (AC 5)
- [x] Tests, Architektur §5.11, Decision-Logs (Architektur, GDD, UX), `pnpm check`

## Dev Notes

- Kein Speicherformat-Wechsel: `c.emberShop` bekommt `{ sold: 0, lastSoldAtStory: null }` in `normalizeCampaign`. `content/released-ids.json` gibt es nicht; keine gesperrte ID berührt.
- `refreshOffers` erzeugt die Angebote unverändert auf jeder Stufe (RNG-Strom von Akt 1 bleibt gleich); nur Anzeige und `buyOffer` sind an Stufe 3 gebunden. Die Angebote ziehen ab Stufe 2 auch aus der `roomLevel`-Liste.
- Akt 1 ändert sich nicht: Lager-Händler = Stufe 1, kein Rabatt, keine `roomLevel`-Listen; `c.offers` wurde bisher nirgends angezeigt.
- Der Rabatt aus E7 (11.15) setzt nur einen `priceMod`; Summe und Deckel stehen hier.

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.9]
- [Source: concept/24-architecture/architecture.md §5.11, §8.1, §8.7]
- [Source: concept/21-gdd/items.md §2]
- [Source: _bmad-output/implementation-artifacts/11-5-gefaehrten-leutnants-und-flags-von-akt-2.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (Subagent)

### Completion Notes List

- [ASSUMPTION] Inhalt der Akt-2-Liste `tier: 0, roomLevel: 2`: horseslayer, stone_wall, remedy_staff, plate_armor, ember_robe, power_ring, earth_amulet, wind_feather (seltene Teile ohne anderen Händler; `haste_scroll` bleibt Werkstatt, `shade` Beute).
- [ASSUMPTION] `buyOffer` unter Stufe 3 liefert `not_for_sale` (UI und Command dieselbe Regel `dailyOffersOpen`); Angebote werden weiter erzeugt.
- [ASSUMPTION] `buyEmberSpark` prüft als dritten Fehler `convoy_full` (wie `buy`).
- [ASSUMPTION] `emberShop.item: ember_spark` als Datenschlüssel statt der Id im Code; `maxOffered: 1` steht nur als Wert (es gibt nur ein Angebot zur Zeit).
- [ASSUMPTION] Panel-Gestalt (Zwischentitel, Glutfunke-Zeile, Marke neben den Reitern) im UX-Decision-Log.
- [ASSUMPTION] Sim kauft Glutfunken vor dem Aufsteigen in der Heimat-Heuristik.

### File List

- content/core/balance.yaml, handbook.yaml, locales/de.yaml, en.yaml, de.handbook.yaml, en.handbook.yaml, content/acts/act2/campaign.yaml
- src/core/campaign/aid.ts, campaign.ts, apply.ts, commands.ts, state.ts, balanceDefs.ts, storyDefs.ts
- src/content/schemaBalance.ts, schemaCampaign.ts
- src/app/screens/Rooms.tsx, src/ui/camp.css, src/app/state/devHooks.ts (`__hc.devMerchant(level, discounts)`)
- tools/simCampaign.ts, tools/simulate.ts
- tests/unit/merchant-levels.test.ts (neu), sim-campaign.test.ts, rooms-build.test.ts, tests/fixtures/saves/generate-act1-finale.ts
- concept/24-architecture/architecture.md, decision-log.md, concept/21-gdd/decision-log.md, concept/25-ux/.decision-log.md

### Change Log

- 2026-11-13: Story umgesetzt (Sortiment ab Stufe 2, Angebot des Tages, Rabatt mit Deckel, Glutfunke beim Händler, Sim, Handbuch).
