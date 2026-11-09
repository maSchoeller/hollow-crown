---
baseline_commit: f8cd986
---
# Story 11.5: Gefährten, Leutnants und Flags von Akt 2

Status: review

## Story

Als Spieler
möchte ich in Akt 2 neue Gefährten und vier Leutnants mit eigenem Charakter treffen,
damit der Akt neue Gesichter, Rivalen und Beute bringt.

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-11.md` § Story 11.5 (Z. 147–182). Werte, die die Überarbeitung nicht berührt, aus der Fassung vom 2026-10-31 (`git show 06797a6^:concept/26-epics/epics/epic-11.md`, Story 11.5), angepasst an die Überarbeitung (keine Flieger, keine Reittiere; Produktinhaber 2026-11-05/-06).

1. **Gefährten** (`content/acts/act2/units.yaml`): `jory`, `odile`, `nell`, `brann`, `amos`, `ilka`, `sable` haben `level: 10`, Basiswerte auf Stufe 10, Wachstum, Affinität, persönliche Fähigkeit, Ausrüstung und Support-Partner nach der Fassung vom 2026-10-31 `[ASSUMPTION]`:

   | ID | Klasse | Affinität | Basis (TP/STR/MAG/GES/SCH/GLK/VER/RES) | Wachstum % | persönliche Fähigkeit | Ausrüstung | Supports |
   |---|---|---|---|---|---|---|---|
   | `jory` | minstrel | wind | 23/6/6/10/11/10/4/7 | 60/30/35/45/50/55/20/40 | `stage_presence`: passiv, 1 Verbündeter daneben → Ausweichen +15 | `steel_dagger`, `travel_lute`, `vulnerary` | nell |
   | `odile` | skirmisher | water | 26/9/1/12/12/5/7/3 | 70/45/5/50/50/40/35/35 | `sworn_guard`: passiv, 1 Verbündeter daneben → VER +2, RES +2 | `steel_sword`, `iron_helm`, `vulnerary` | varek, sable |
   | `nell` | scout | water | 24/8/0/12/12/7/5/3 | 70/40/5/55/55/50/25/30 | `smugglers_stash`: passiv, 30 % keine Ladung verbraucht | `steel_dagger`, `door_key`, `vulnerary` | jory, varek |
   | `brann` | elementalist | earth | 22/2/10/7/7/4/6/7 | 70/15/55/35/35/35/45/40 | `buried_glow`: passiv, unter 50 % TP → MAG +3 | `stone_fist`, `rockfall`, `vulnerary` | ilka |
   | `amos` | healer | earth | 22/2/9/6/6/9/5/10 | 70/20/45/35/30/45/30/55 | `field_surgeon`: passiv, Heilung +5 | `mend_staff`, `heal_staff`, `vulnerary` | liora, grosk |
   | `ilka` | marksman | wind | 24/9/0/13/10/5/5/3 | 65/45/5/60/50/45/25/35 | `still_hunter`: passiv, nicht bewegt → Treffer +10, Krit +5 | `steel_bow`, `vulnerary` | sable, brann |
   | `sable` | duelist | fire | 30/12/1/13/12/6/9/4 | 75/50/5/50/45/35/40/30 | `old_orders`: beim Angriff unter 50 % TP → Schaden +2 | `steel_sword`, `dravns_oath`, `vulnerary` | odile, ilka |

   Sable bleibt `duelist` (Epic 2026-11-06; Fassung 10-31 hatte `skirmisher`) `[ASSUMPTION]`.
2. **Beitritte** nach der Missionsliste: `joins` Jory `m2_1`, Ilka `m2_3`, Odile und Amos `m2_5`, Nell `m2_6`, Brann `n5` (nicht mehr `m2_4`), Sable `lieutenant` (Seitenwechsel nur bei E7 `warn`). Die Beitrittsstufe rechnet 11.2 (max(10, P − 1)); Sable tritt nach der Leutnant-Regel bei (`joinLieutenant`, Produktinhaber 2026-11-09). Szenen und Entscheidungen ohne Varek/Brann entfallen ohne Lücke (Sache der Missions-Stories, `requires: alive`).
3. **Leutnants** (`content/acts/act2/lieutenants.yaml`), alle zu Fuß, `portrait`/`model` = vorhandene Dateien (Platzhalter bis 11.25), Titel `lt.<id>.title`, Fraktion `faction.<id>.name`, Szene `scn.lt.<id>` `[ASSUMPTION]`:

   | ID | Klasse | Fraktion | Signatur | Groll 1 / 2 / 3 | Titel (DE) |
   |---|---|---|---|---|---|
   | `rowena` | knight | silver_lance | `rowenas_lance` (= `steel_lance`, Bild vorläufig `wing_lance`; **bestätigt** PO 2026-11-09 + Fähigkeit `stud_ward`) | `lance_charge` (eigener Angriff: Schaden +3) / `silver_resolve` (passiv: Treffer +15) / `stud_ward` (verteidigt mit Verbündetem daneben: Schaden −20 %) | Ritterin der Silbernen Lanze |
   | `brakka` | marksman | free_blades | `wasp_sting` (Armbrust = `steel_bow` + effektiv gegen Gepanzerte; Bild vorläufig Stahlbogen, **bestätigt** PO 2026-11-09) | `ballista_reach` (Ballistenschuss +1 Reichweite) / `steady_crew` (neben einer Balliste: VER/RES +3) / `paid_in_full` (Angriff aus Abstand ≥ 2: Schaden +3) | Ballistenmeisterin der Freien Klingen |
   | `grell` | skirmisher | silver_sea | `gold_hook` (= `steel_sword`, Krit +20) | `boarding_party` (2 Verbündete am Ziel: Treffer +10, Schaden +2) / `dirty_hook` (Angriff: Krit +10) / `sea_legs` (Rundenbeginn: 10 % Heilung) | Kaperkapitän des Hauses Silbermeer |
   | `sable` | duelist | iron_march | `dravns_oath` (= `steel_sword` + Fähigkeit `last_order`) | `oath_guard` (nicht bewegt: VER/RES +3) / `last_order` (verteidigt unter 50 % TP: schlägt zuerst) / `iron_discipline` (Aura Radius 1: Verbündete VER +2) | Hauptfrau des Grenzheers; `joins: true` |

   Keine Groll-Fähigkeit mit Flieger- oder Reittier-Bezug (`dive`, `wing_retreat`, `wyvern_dive`, `scale_hide`, `over_the_lines` gibt es nicht), keine Klasse `brakka_wyvern`. Brakkas Ballisten-Bezug braucht zwei neue Effekt-Formen (Effekt `siegeRangeBonus`, Bedingung `besideBallista`) in `src/core` mit Zod-Schema und Test `[ASSUMPTION]`.
4. **Leutnant-Szenen** `content/acts/act2/scenes/scn.lt.{rowena,brakka,grell,sable}.yaml` mit `first`, `grudge_1..3` (mit `{target}`), `flee_1..3`, `mock` (mit `{target}`), Sable zusätzlich `join`; Englisch in `content/locales/en/act2.dialogue.yaml`; jede Box ≤ 110 Zeichen. Die erste Begegnung spielt `first`, egal in welcher Mission (vorhandene Regel `ltOpeningLine`, Test).
5. **Stahl-Tier** (Block `# --- Akt 2: Stahl-Tier (Story 11.5)` in `content/core/items.yaml`) nach der Ableitungsregel der Fassung vom 2026-10-31 `[ASSUMPTION]`: `steel_dagger`, `armorpiercer`, `stiletto`, `blaze`, `gale_blade`, `stone_fist`, `whirlpool`, `light_lance`, `shade` (Dunkel, nicht `shadow`), `physic_staff`, `round_shield`, `crystal_focus`, `steel_helm`, `scale_mail`; Waffen gegenüber Eisen Mt +3, Treffer −10 bis −15, Gewicht ×1,5–2, Preis 900–1 200; Zauber mit Element und Zustand wie das Eisen-Pendant; Rüstung VER +1–2 über Eisen. Vier Signaturen `rarity: legendary`, Preis 1 500. Namen und Beschreibungen DE/EN; Bilder Platzhalter (`image:` auf das Eisen-Pendant) bis Story 8.5.
6. **Balance/Kampagne:** `lieutenant.bounty.materialByAct: { 1: iron_ore, 2: moonsteel }`, `tierUp` zusätzlich `iron_dagger: steel_dagger`; Händler von Akt 2 Stufe 1 (über `merchantTier: 1` der Knoten ab 2-2) und Stufe 2 (`storyCount: 4`: `stiletto`, `shade`, `tower_shield`) `[ASSUMPTION]`; Stufe 3 und `roomLevel: 2` gehören 10.9.
7. **Flags** (`content/acts/act2/flags.yaml`): `e05`, `e06` (`pardon|stay`), `e07` (`warn|obey`), `e08` (`seraphine|sell`), `joined_sable`, `maelis_ledgers` (`season2: true`), `chronicle_read` (`season2: true`), `m2_2_seal` bleibt. `e7_order`/`e7_warned` sind entfernt und überall auf `e07` umgestellt: Entwürfe `concept/27-ueberarbeitung/levels/s2_2_5/6/8*.yaml` (`not: { flag: { e07: warn } }` bzw. `flag: { e07: warn }`), Brandhang-Variante in `content/world/valmora.yaml` (`flag: { e07: obey }`; Brandhang brennt allein darüber, kein `brandhang_burned`, **bestätigt** PO 2026-11-09), Tests (`act-title`, `act-transition`, `act2-drafts`, `sim-acts`) und die Doku zu `--flags` in `tools/simulate.ts`. Werte von `e05` `[ASSUMPTION]` (Narrative E5 nachlesen).
8. **dev_eisenmark:** Die Probekarte trägt Leutnants (Brakka, Grell), sodass Steckbrief, Groll, Flucht und Kopfgeld (Mondstahl) die neuen Daten zeigen; Bild 375 × 812 als JPG.
9. **Tests:** Beitrittsstufe eines Akt-2-Gefährten (Stufe 10 → max(10, P − 1)), Sable über `joinLieutenant`, Groll-Fähigkeiten je Stufe (`lieutenantSkills`), Ballisten-Bezug (Reichweite, Bediener), Flag-Register. Akt 1 unverändert: `pnpm sim --campaign act1 --runs 50` vorher/nachher gleich; keine Akt-1-ID ändert sich.
10. Akt 2 bleibt unveröffentlicht (kein `released: true`, kein `content:lock`). `pnpm check` grün.

## Tasks / Subtasks

- [x] Story-Datei, Ableitungen (AC alle)
- [x] `src/core`: Effekt `siegeRangeBonus`, Bedingung `besideBallista` + Zod (AC 3)
- [x] `skills.yaml`: 7 persönliche, 12 Groll-Fähigkeiten; Locales core (AC 1, 3)
- [x] `items.yaml`: Stahl-Tier + 4 Signaturen; Locales core (AC 5)
- [x] `balance.yaml`, `acts/act2/campaign.yaml` Händler (AC 6)
- [x] `acts/act2/units.yaml`, `lieutenants.yaml`, Szenen, Locales act2 (AC 1–4)
- [x] `flags.yaml`, Entwürfe, `valmora.yaml`, Tests, `tools/simulate.ts` (AC 7)
- [x] `dev_eisenmark` + Tests (AC 8, 9)
- [x] Sim Akt 1 vorher/nachher, `pnpm check`, Sichtprüfung (AC 9, 10)

## Dev Notes

- **Leutnant-Stufe** (Produktinhaber 2026-11-09): Leutnants behalten `lieutenantLevel` (Schnitt der stärksten `armySize` + Groll); `levelOffset` auf der Karte ist nur Format (content:check verlangt ihn), `lieutenantUnit` überschreibt die Stufe.
- **Klasse auf der Karte:** `resolveLieutenantClasses` (load.ts) setzt die Klasse des Leutnants für Karteneinheiten ohne `class`; die Entwürfe nennen Platzhalter-Klassen (`brigand` für Grell, `marksman` für Brakka). Wo `content:check` bei Entwürfen über Klasse/Waffe stolpert, den Entwurf angleichen und in den Notizen vermerken.
- **Groll-Fähigkeiten** laufen über `skillTotals` (Quelle `grudge`); Auren (`iron_discipline`) wirken über `addAuras` auf Verbündete des Trägers.
- **Ballista** (11.6): `ballistaTargets` misst Reichweite `ballistaRange(data)` vom Ballistenfeld; der Bonus kommt als `skillTotals(...).siegeRange` des Bedieners hinzu, die Prüfung in `apply.ts` liest dieselben Optionen (Vorschau = Auflösung).
- **Akt 1 darf sich nicht ändern:** Items/Skills kommen nur hinzu; Akt-1-Händler und -Pools nennen Items explizit; `tierUp` `iron_dagger` betrifft nur Leutnants mit Dolch (Akt 1 keiner). Haunts filtern Leutnants nach `met` und Akt.
- Gefährtenzeilen unter `requires: alive` mit Ersatzsprecher-Kette gehören den Missions-Stories.

### References

- `concept/26-epics/epics/epic-11.md` § 11.5; Fassung 2026-10-31 (`06797a6^`)
- `concept/21-gdd/items.md` §3, §6.1, §6.3, §6.6; `concept/22-narrative/narrative.md` Z. 229, 243, 693–695; `missionsliste-s1.md` Akt 2
- `src/core/campaign/lieutenants.ts`, `position.ts`, `src/core/rules/skills.ts`, `ballista.ts`; `src/content/validateLieutenants.ts`, `load.ts`
- `_bmad-output/implementation-artifacts/11-10-*.md` (Flags-Platzhalter), `11-3-*.md` (Brandhang), `11-4-*.md` (`--flags`)

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm check` grün (149 Dateien, 1766 Tests; `content OK`; Build im Budget).
- Akt 1: `pnpm sim --campaign act1 --runs 50 --json` vor und nach der Story, `pnpm sim:diff`: „no value moved by more than 0.02“.
- Sichtprüfung `dev-act2`, `__hc.devActStart(true)`, `__hc.devLieutenant([['brakka',2],['grell',1]])`, `__hc.devMap('dev_eisenmark', 2)`, Langdruck auf Brakka: Steckbrief mit Titel, Groll gegen Lucan, Kopfgeld 600 Gold + 1–2 Mondstahl, Groll-Fähigkeiten; Einheitenblatt Stufe 14 (Leutnant-Regel), Stahlbogen (Groll 2 → `tierUp`), Zeile `grudge_2`. Bild: `side-session-notes/…/11-5-steckbrief-brakka.jpg`.

### Completion Notes List

- `[ASSUMPTION]` Werte der Gefährten, Groll-Fähigkeiten, Stahl-Tier, Signaturen, Händler-Stufen und Flag-Werte wie in den AC; Entscheidungen im GDD- und Architektur-Log (2026-11-09).
- `[ASSUMPTION]` Brakkas Ballisten-Bezug über zwei neue Bausteine (`siegeRangeBonus`, `besideBallista`); `crewRange` ist die eine Reichweitenrechnung für Ziele, Gefahrenzone, Prüfung und KI.
- **Bestätigt (PO 2026-11-09):** Rowenas Signatur heißt `rowenas_lance` (Bild vorläufig `wing_lance`); `silver_lance` bleibt die Silberlanze von Akt 3.
- **Bestätigt (PO 2026-11-09):** `shade` nur Beute, nie beim Händler (items.md §4). Brakka mit `wasp_sting`, Bild vorläufig Stahlbogen.
- **Bestätigt (PO 2026-11-09):** Brandhang brennt allein über `e07: obey`; `brandhang_burned` gestrichen.
- Vorläufige Heimsuchungs-Pools `content/acts/act2/haunts.yaml` (content:check verlangt je Leutnant-Fraktion einen Pool); 11.7 legt sie fest.
- `validateReach`: `joined_<lt>` gilt als gesetzt und gelesen (der Code liest es über `isJoined`).
- Entwürfe nennen für die Leutnants noch Platzhalter-Klassen und Stahlwaffen (Grell `brigand` + `steel_axe`); die Missions-Stories gleichen Klasse und Eisenwaffe (für `tierUp`) an.

### File List

- `content/acts/act2/units.yaml`, `lieutenants.yaml` (neu), `flags.yaml`, `haunts.yaml` (neu), `campaign.yaml`, `scenes/scn.lt.{rowena,brakka,grell,sable}.yaml` (neu), `locales/{de,en}.names.yaml`
- `content/core/items.yaml`, `skills.yaml`, `balance.yaml`, `locales/{de,en}.{names,items}.yaml`; `content/locales/en/act2.dialogue.yaml`; `content/world/valmora.yaml`
- `concept/27-ueberarbeitung/levels/s2_2_5_silberquell.yaml`, `s2_2_6_kraehenholm.yaml`, `s2_2_8_kronfeld.yaml`; `concept/21-gdd/decision-log.md`, `concept/24-architecture/decision-log.md`
- `src/core/defs.ts`, `src/core/rules/skills.ts`, `ballistaBase.ts`, `ballista.ts`, `movement.ts`; `src/content/schemaUnits.ts`, `validateReach.ts`
- `tests/unit/act2-companions.test.ts` (neu), `act-title`, `act-transition`, `act2-drafts`, `sim-acts`, `lieutenants`, `lieutenants-join` (`.test.ts`); `tests/fixtures/maps/dev_eisenmark.yaml`; `tools/simulate.ts`
