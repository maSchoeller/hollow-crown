---
baseline_commit: fdb901f41e15cae411cb14ec8b27d0a93da827ef
---
# Story 11.13: Mission 2-2 „Das Siegel im Salzpass“

Status: review

<!-- Erstellt 2026-11-09 mit gds-create-story. Offene Fragen F1–F5 an den PO stehen am Ende; bis zur Antwort gelten die Vorschläge nur als [ASSUMPTION]. -->

## Story

Als Spieler
möchte ich im Nebel des Salzpasses das Siegel der Prinzessin bergen,
damit der erste Zweifel an Seraphine wächst.

## Acceptance Criteria

1. **Karte übernommen:** `content/acts/act2/maps/m2_2_salzpass.yaml` übernimmt den Entwurf `concept/27-ueberarbeitung/levels/s2_2_2_salzpass.yaml` (K 16 × 20, `fog: true`, `weather: fog`, `treasure` auf `c_seal` in 11 Runden, 7 eigene gegen 16 auf Normal, L 13 / S 19, Leutnant Grell) mit Feld `design:` auf den Entwurf, `map.act = 2`, Felsleiste auf Stufe 1 (`terrace`), Rampe `[14,15]`, Treppe `[13,5]`, Wagen als `wagon`. Alle Gegner nur mit `levelOffset` (−3…−1, Grell über die Leutnant-Regel), keine Flieger, keine Reiter (content:check aus 11.2/11.7 grün).
2. **Steinschlag:** In Runde 3 (Südenge `[4,14]`, `[7,14]`), 5 (Nordenge `[12,6]`, `[12,7]`, mit `warn: true`, Warnung ab Runde 4 auf Brett und HUD, Korrektur 11.10) und 8 (Leiste `[14,7]`, `[14,8]`) werden die Felder `rockwall`; ein besetztes Feld bleibt, wie es ist (Regel `eventTerrain`); die Straße bleibt in jeder Runde von Süd nach Nord begehbar.
3. **Siegeltruhe:** Fenn (Klasse `scout`, Klassenaktion `open_steal`) öffnet `c_seal` ohne Schlüssel; ohne Späher in der Truppe trägt Grells Zahlmeister `purser` einen `door_key`, den er fallen lässt (`drops: [1]`). Das Öffnen spielt `scn.m2_2.seal_found` und setzt `m2_2_seal`; damit ist die Mission gewonnen (`treasure`).
4. **Nachhut:** Grells Nachhut erscheint angekündigt in Runde 6 (Gegnerphase) vom Südrand, 2 Figuren auf Leicht/Normal, 3 auf Schwer.
5. **Kundschafter aus Kharesh:** zwei Kundschafter warten im Westwinkel (`trigger`, Radius 3); ihre Truhe `c_scouts` trägt die Saat (Inhalt nach F4). Niemand tritt bei.
6. **Chronik-Seite:** Die Truhe `c_page` trägt eine Chronik-Seite von Akt 2 (Wirkung `contents.chronicle`, Seite in `content/acts/act2/chronicle.yaml` DE und EN; Id und Inhalt nach F3). Nebenziel „alle Truhen öffnen“ wie im Entwurf.
7. **Szenen:** `scn.m2_2.intro`, `scn.m2_2.outro`, `scn.m2_2.rockfall_south`, `scn.m2_2.rockfall_warn`, `scn.m2_2.rockfall_ledge`, `scn.m2_2.seal_found` und die Szene der Saat-Truhe (F4) in DE und EN, jede Box ≤ 110 Zeichen, Gefährtenzeilen mit `requires: alive` und Ersatzsprecher-Kette, Hintergrund `salzpass`. Grell bringt Maelis' Schmuggelware über den Pass; der Zweifel „Wer schreibt der Prinzessin?“ wächst (Inhalt nach F2). Keine Entscheidung im Sinn von E1–E8; gibt es eine Antwort Rhens, trägt sie eine Haltung und eine Folgen-Karte.
8. **Knoten:** `m2_2` in `content/acts/act2/campaign.yaml` bekommt `pre`/`post`; `map: m2_2_salzpass` und `place: salzpass` bleiben; die Weltkarte bietet 2-2 nach 2-1 an (`mapInBuild`, Slot `salt_pass` in `content/world/valmora.yaml:46`).
9. **Niederlage:** Avatar oder Lucan fallen, oder Runde 11 endet ohne offene Siegeltruhe (`treasure`); keine Schutzfigur.
10. **Gewinnbar und im Korridor:** `pnpm sim` mit Optionen aus 11.4 zeigt die Karte gewinnbar und im Korridor (NFR12) an der frühesten (nach 2-1) und spätesten Position (nach 2-1 und 2-3), Ergebnis mit Zahlen im Kopfkommentar der Karte und in der Abnahme-Datei; Act-1-Basislauf bleibt identisch.
11. **Heimsuchungen:** zwei Heimsuchungs-Anker wie bei 2-1 (Vorschlag in den Dev Notes), keiner im Startbereich der Mission.
12. **Unveröffentlicht:** `act2` bleibt in `content/packs.yaml` auf `released: false`; kein `pnpm content:lock`, keine Änderung an `content/released-ids.json`. Sichtprüfung im Dev-Build über `pnpm dev:act2`.
13. **Abnahme:** Bild der Karte bei 375 × 812 im Spiel (Nebel sichtbar, Warnung R4); Abweichungen vom Entwurf stehen in `concept/27-ueberarbeitung/levels/abnahme/s2_2_2_salzpass.md` (neuer Abschnitt „Übernahme Story 11.13“); `pnpm check` grün.

## Tasks / Subtasks

- [x] T1 Karte anlegen (AC 1–5, 9, 11)
  - [x] `content/acts/act2/maps/m2_2_salzpass.yaml` aus dem Entwurf: `id: m2_2_salzpass`, `nameKey: map.m2_2_salzpass.name`, `fog: true`, `weather: fog`, `timeOfDay: morning`, `design:` = Entwurfsblock plus Verweis auf `s2_2_2_salzpass`; Kopfkommentar nach Muster `content/acts/act2/maps/m2_1_windscharte.yaml:1-10` (Entwurf, Abweichungen, Sim-Zahlen [C], Szenen).
  - [x] Gelände: `terrace` (Stufe 1 aus `terrain.yaml:51`), `ramp`, `stairs`, `wagon`, `road`, `mountain` gibt es alle; ein `levels:`-Block ist für die Leiste nicht nötig (anders als die Felsnasen in 2-1). Prüfen, dass Rampe `[14,15]` → `[14,14]` und Treppe `[13,5]` → `[14,5]` als Verbinder greifen (`connector`, `terrain.yaml:5`) und content:check (`validateLevels.ts`, `validateWalk.ts`) grün ist.
  - [x] Gegner: `level` streichen, nur `levelOffset` (11.2). Name `unit.smuggler.name` neu in `content/acts/act2/locales/{de,en}.names.yaml` („Schmuggler“/„Smuggler“) [ASSUMPTION], Figuren nach Pool `silver_sea` (`haunts.yaml:19-23`: brigand → `brigand`, skirmisher → `mercenary`, marksman → `bandit_archer`, vanguard → `soldier`). Eisenwaffen wie Entwurf und wie 2-1; Stahl nur, wenn die Sim es verlangt [ASSUMPTION].
  - [x] Kundschafter: `unit.kharesh_scout.name` neu („Kundschafter aus Kharesh“/„Kharesh scout“) [ASSUMPTION]; Klasse `scout` (Figur `mercenary` wie die Plünderer in Akt 1) und `marksman` sind Fuß-Klassen und in Akt 2 erlaubt (`validateHaunts.ts:122-134`). Der Kommentar „fliehen nach Westen“ im Entwurf widerspricht ihrem Profil `trigger → aggressive` und dem Westwinkel (Sackgasse); Profil des Entwurfs gilt, Kommentar als Abweichung notieren.
  - [x] Grell: `lieutenant: grell`, **Klasse `skirmisher`** laut `lieutenants.yaml:32-41` (Entwurf: `brigand` „Platzhalter“), Waffe `steel_sword` statt `steel_axe` (Muster Brakka in 2-1: Signatur `gold_hook` ist Beute, nicht Kartenwaffe); `levelOffset: 1` nur fürs Schema; Profil `guard`.
  - [x] Zahlmeister `purser`: `door_key` mit `drops: [1]` wie Entwurf. `c_seal` ohne `vulnerary` (Platzhalter des Entwurfs), Inhalt nach F1.
  - [x] Truhen `c_page` (300 Gold + Chronik, F3) und `c_scouts` (200 Gold + Saat, F4); Nebenziel `s_chests` (open_chests, vulnerary).
  - [x] Trigger: `t_rock1` R3 enemy, `t_rock2_warn` R4 player (Szene), `t_rock2` R5 enemy mit `warn: true`, `t_rock3` R8 enemy, `t_seal` auf `object_activated c_seal` (Szene + `set_flag m2_2_seal`) wie Entwurf, Szenen-Ids `scn.m2_2.*`.
  - [x] Nachhut R6 (`reinforcements`, `announce: true`) wie Entwurf.
  - [x] Heimsuchungs-Anker `haunts:` (Vorschlag unten, Gründe als Kommentar darüber wie in 2-1).
  - [x] `goldReward` nach F5; `nameKey` in `content/acts/act2/locales/{de,en}.names.yaml`.
- [x] T2 Szenen DE/EN (AC 3, 5–7)
  - [x] `scn.m2_2.intro` (Seraphines Auftrag: das Siegel aus Grells Karawane holen; Ankunft im Nebel), `scn.m2_2.rockfall_south`, `scn.m2_2.rockfall_warn`, `scn.m2_2.rockfall_ledge`, `scn.m2_2.seal_found` (Zweifel nach F2), Saat-Szene (F4), `scn.m2_2.outro` (Grells Karawane zieht ab, Spur Maelis–Kharesh leise, `background: salzpass`). Text **entwerfen und als Vorschlag markieren** (Schreib-Pipeline der Narrative), nicht still endgültig.
  - [x] Ersatzsprecher-Ketten (siehe Dev Notes „Sprecher“); keine neuen Sprecher ohne eigene Halbfigur (Lehre aus 11.12, `scene-view.test.ts`).
  - [x] EN in `content/locales/en/act2.dialogue.yaml`; Box ≤ 110 Zeichen; Ersatzsprecher-Prüfung grün.
- [x] T3 Chronik-Seite (AC 6)
  - [x] `content/acts/act2/chronicle.yaml` neu (Format `content/acts/act1/chronicle.yaml`, wird über `load.ts:163` erkannt, Paket act2 über `acts/act2/**`), EN in `content/locales/en/act2.chronicle.yaml` unter `chronicle.<id>.title|text` (über `locales/*/act2.*` im Paket). Höchstens 12 Seiten in der Staffel (`validateLocales.ts:37`).
- [x] T4 Knoten verdrahten (AC 8)
  - [x] `m2_2` in `content/acts/act2/campaign.yaml:27`: `pre: scn.m2_2.intro`, `post: scn.m2_2.outro`; Kommentar Z. 21 („Karten-Ids vorläufig, außer m2_1“) um m2_2 ergänzen.
- [x] T5 Simulation und Abstimmung (AC 10)
  - [x] `pnpm sim --campaign act2 --start expected --runs 50` mit `--node m2_2` und `--position` für früheste (P = 13) und späteste Position (P = 14) bzw. `--order m2_2,m2_3` / `--order m2_3,m2_2`, alle drei Schwierigkeiten; Varianten per `--map-file`/`--set`, `--json` + `pnpm sim:diff`; mit und ohne `--haunts`. Optionen im Kopf von `tools/simulate.ts:6-27`.
  - [x] Prüfen, ob die Sieg-KI die Siegeltruhe im Nebel findet (`treasurePlan`, `src/core/ai/autoplay.ts:208-236`, rechnet Späher und Schlüssel ein) und ob sie die Truhen `c_page`/`c_scouts` vor `c_seal` öffnet; sonst ist das Nebenziel in der Sim nie erfüllt (Befund festhalten, nicht die KI umbauen).
  - [x] Act-1-Basislauf `pnpm sim --campaign act1 --runs 50 --seed 1` unverändert (keine Datei von Akt 1 anfassen).
- [x] T6 Tests (AC 2–9, 11)
  - [x] `tests/unit/m2-2-salzpass.test.ts` nach Muster `tests/unit/m2-1-windscharte.test.ts`: Knoten/Ziel `treasure` 11, 13/16/19 Gegner mit Nachhut, Stufen auf P, Grell als Leutnant; Steinschlag R3/R5/R8 macht die Felder zu `rockwall`, Warnung ab R4 (`terrainWarnings`), besetztes Feld bleibt, Straße bleibt offen (Weg Süd → `c_seal` nach R8 vorhanden); ein Späher öffnet `c_seal` ohne Schlüssel, eine andere Figur nur mit dem Schlüssel des Zahlmeisters; `m2_2_seal` gesetzt, Szene gespielt, Sieg; ohne Siegeltruhe nach R11 Niederlage; Nachhut R6 Süd; Sicht des Spähers 5, sonst 3 (`visionRadius`); Gold; zwei Anker.
  - [x] Lab-Szenario `tests/fixtures/lab/salzpass-2-2.yaml` (Muster `windscharte-2-1.yaml`, `company: expected`) für die Sichtprüfung.
  - [x] Bestehende Tests nachziehen, die „m2_2 ohne Karte“ annehmen: `tests/unit/sim-acts.test.ts:45` (`skipped` enthält m2_2), `tests/unit/act2-campaign-order.test.ts:244-259` (legt für m2_2 eine Ersatzkarte in `sessionMaps`; mit echter Karte prüfen, ob „kein Knoten im Build“ und der Paar-Test noch stimmen), `act2-drafts.test.ts` (nutzt den Entwurf, bleibt), ggf. `act-title`/`scenery`.
- [x] T7 Ansicht, Abnahme, Abschluss (AC 12, 13)
  - [ ] `pnpm levels` (Atlas) erledigt; Spielbild bei 375 × 812 über `pnpm dev:act2`, Lautstärken auf 0; Ortsbild `salzpass` ist in `ACT2_LOCATIONS` (`tools/art/build.py:49`) und `packs.yaml:71`, vor `pnpm art:build` `git lfs pull`.
  - [x] Abschnitt „Übernahme Story 11.13“ in `levels/abnahme/s2_2_2_salzpass.md` mit allen Abweichungen und Sim-Zahlen.
  - [ ] Neue Entscheidungen (F1–F5) ins Decision-Log von `concept/22-narrative/` bzw. `concept/21-gdd/` eintragen, nie in `01-decisions.md`.
  - [x] `pnpm check` grün; **kein** `released: true`, **kein** `content:lock`.

## Dev Notes

### Ausgangslage (Stand 2026-11-09, `fdb901f`)

- Knoten `m2_2` (`campaign.yaml:27`): `map: m2_2_salzpass, place: salzpass, merchantTier: 1, requires: [{ completed: m2_1 }]`, noch ohne `pre`/`post`. `positionLevel.base: 12`, P = 12 + erledigte Story-Knoten von Akt 2 → 2-2 spielt auf P = 13 (nach 2-1) oder 14 (nach 2-1 und 2-3). Der Entwurf rechnet mit P = 12; `levelOffset` gleicht das aus.
- Flag `m2_2_seal` (`flags.yaml`, `kind: battle`, `season2: false`) ist deklariert. Leutnant `grell` (`lieutenants.yaml:32-41`): `skirmisher`, Fraktion `silver_sea`, Signatur `gold_hook` (Schwert, `items.yaml:171`), Zeilen `scn.lt.grell` (first, grudge 1–3, flee 1–3, mock). Porträt `art/mockups/characters-s1/grell.png` vorhanden.
- Ortsbild `salzpass` vorhanden (LFS), Weltkarten-Slot `salt_pass` (`valmora.yaml:46`), Knotentitel `node.m2_2.title` vorhanden.
- 2-1 (Story 11.12) ist gemergt: Karte, Szenen, Test, Lab, Gold 2 000, zwei Anker.

### Code-Befunde

1. **Nebel:** `fog: true` auf der Karte schaltet `fogOn` (`src/core/rules/vision.ts:19`). Sicht je Figur = `balance.fog.baseVision` 3 + höchster Bonus aus Klassenrolle oder Bewegungsart (`balance.yaml:209-213`: `marksman` +2, `scout` +2, `flier` +1, nicht kumuliert); Sicht endet hinter `wall`, `door`, `gate_closed`, **`rockwall`** (der Steinschlag nimmt also auch Sicht), Berge (`mountain`) blockieren nicht. Nebel gilt nur für die Seite des Spielers, die KI sieht alles. Fenn (`scout`, `act1/units.yaml:66-79`) sieht damit 5 Felder statt 3 – **die Regel „Fenn sieht weiter im Nebel“ ist schon da**, keine neue Regel nötig; gleich weit sehen alle Schützen (`marksman`, z. B. Mira) und die Profi-Wege `shadow`/`trapper`. `weather: fog` ist nur Darstellung (`WEATHERS`, `src/core/defs.ts:30`). Heimsuchungen zeigen auf Nebelkarten das ganze Brett (`balance.yaml:130` `fog: false`).
2. **Truhe ohne Schlüssel:** Regel vorhanden (Story 2.6, `src/core/rules/scout.ts:1-30`): Jede Spielerfigur mit Klassenaktion `open_steal` (Klasse `scout` und Profi-Wege `shadow`, `trapper`) öffnet Türen nebenan und Truhen auf oder neben ihrem Feld ohne Schlüssel und ohne Ladung; alle anderen brauchen `door_key` (`items.yaml:113`, `use.open: [door, chest]`, 1 Ladung, Händlerpreis 250). Gegnerische Späher öffnen nichts (`isScout` verlangt `team: player`). Muster schon in 2-1 (`c_pay`, Kommentar `m2_1_windscharte.yaml:66`). **Fenn ist nicht sicher in der Truppe:** E2 „ausliefern“ in 1-4 (`scn.m1_4.intro.yaml:53`, `leave: fenn`) oder Tod. Vor 2-2 gibt es keinen anderen Späher (Nell erst 2-6). Ersatz: Schlüssel des Zahlmeisters (`drops: [1]`) oder ein gekaufter `door_key`. Die Sim-KI rechnet Späher und Schlüssel ein (`autoplay.ts:212,236`).
3. **Siegel als Gegenstand:** Kein Item-Kind für Story-Gegenstände (`ItemDef.kind`, `src/core/defs.ts:79`: weapon … key, `seal`, material, rune; `seal` ist das Aufstiegs-Kind des Glutfunkens `ember_spark` mit `use.promote`, nicht verwenden). Vorbild ohne Item: die Chronik in 1-7 („Die Chronik ist kein Gegenstand“, `m1_7_gewoelbe.yaml:8`, Truhe leer, Szene auf `object_activated`, Flag). Weil `treasure` nur `c_seal` verlangt, ist `m2_2_seal` gleichbedeutend mit „2-2 gewonnen“ – das Flag dient nur späteren Szenen (2-8, Erlass). **Chronik in Truhen** gibt es: `contents.chronicle` (`schemaMap.ts:75-84`, Wirkung `act.ts:95`, beim Sieg `campaign/apply.ts:213-214`; Muster `n2_wachturm.yaml:62`: `{ chronicle: a1_watchtower, dialogue: scn.n2.page, gold: 100 }`). Seiten in `content/acts/<akt>/chronicle.yaml`, Id-Schema ohne Präfix (`a1_watchtower`) → Vorschlag `a2_salzpass` statt Platzhalter `chron_a2_salzpass`. Akt 2 hat noch keine `chronicle.yaml`.
4. **Steinschlag:** `set_terrain` mit `warn` (11.10, `schemaMap.ts:119-125`; Warnung `src/core/battle/terrainWarn.ts`, nur für `turn_start`-Trigger, ab der Runde davor; HUD-Zeile `ui.terrainWarn.line`). „Besetztes Feld bleibt“: `eventTerrain` (`src/core/rules/effects.ts:38-56`) lässt ein Feld, wenn die Figur darauf auf dem neuen Gelände nicht stehen könnte (rockwall: für alle unbegehbar). `rockwall` (`terrain.yaml:27`, Stufe 0) existiert, Vorbild `m1_4_wolfslager.yaml:175-181`. `terrace` ist von sich aus Stufe 1, `ramp`/`stairs` sind Verbinder zur Stufe darüber, `wagon` nur für Flieger begehbar (`terrain.yaml:31,51,56,57`). In 2-1 brauchte es `levels:` nur für die Ballisten auf `crag`; hier keiner.
5. **Gegner-Namen:** `unit.smuggler.name` und `unit.kharesh_scout.name` gibt es **nicht**; vorhanden sind für Grells Fraktion `unit.privateer.name` („Kaperfahrer“) und `unit.counting_guard.name` (`act2/locales/de.names.yaml:41,44`). Vorschlag: neuer Schlüssel „Schmuggler“ (der Pass ist eine Schmuggelroute, „Kaperfahrer“ passt aufs Schiff) [ASSUMPTION]; Kharesh hat keine Fraktion und keinen Pool (nur Saat, offstage) – neuer Schlüssel genügt, kein Pool. `brigand`, `skirmisher`, `vanguard`, `marksman`, `scout` sind Fußklassen und in Akt 2 erlaubt.
6. **Heimsuchungs-Anker (Vorschlag, [ASSUMPTION]):** Schema `hauntAnchorSchema` (`schemaMap.ts:130-152`: `treasure` braucht `turns` und `chests`). Wie 2-1 zwei Anker, Gründe als Kommentar:
   - `rout` – Grund: die Mittelkammer, in der Grells Leute im Nebel warten. `target: { at: [8, 10] }`, `enemySpawn: { rect: [6, 8, 10, 12] }`, `deploy: { rect: [3, 1, 10, 3] }` (die Truppe kommt von der Karawane herab, nicht aus dem Startbereich `[4..8, 17..19]`).
   - `treasure` – Grund: Schmuggelgut, das Grells Leute in der Südkammer zurückgelassen haben. `target: { at: [9, 16] }`, `enemySpawn: { rect: [8, 15, 13, 18] }`, `deploy: { rect: [7, 9, 10, 11] }`, `turns: 10`, `chests: [[3, 16], [12, 17]]`.
   Felder vor dem Anlegen auf Begehbarkeit prüfen (content:check meldet unerreichbare Anker).
7. **Gold:** Entwurf 900 + 500 Gold in Truhen; GDD-Kurve Akt 2 2 000–3 000 je Story-Mission (`gdd.md:352`), 2-1 auf 2 000 gesetzt (PO 2026-11-09). Vorschlag F5.
8. **Truppe und Sprecher nach 2-1:** Sicher sind nur Rhen (`avatar`) und Lucan. Möglich: Brenna, Tobin, Mira (geht bei E1 `release`), Fenn (geht bei E2 `hand_over`), Liora, Varek, Ysolde, Grosk (nur über E3), Jory (2-1, nur wenn angesprochen). Vorschlag Ketten: Späher-/Nebelzeilen `[fenn, tobin, avatar]`; Zeile zum Siegel und Brief `[liora, ysolde, avatar]` (Liora ist Halvards Ziehtochter, siehe F2); Kharesh-Zeile `[lucan]` (Kriegsveteran, Narbe, Rückgriff auf `scn.m1_1.kharesh_rumor`); Jory `[jory]` mit `requires: [{ alive: jory }]`, `fallback: skip`; Grell `[grell]`, `fallback: skip`. Muster `scn.m2_1.intro.yaml` (`[fenn, avatar]`, `[brenna, tobin, avatar]`). Niemand tritt bei (Narrative-Log 2026-11-01).

### Abweichungen Entwurf ↔ Spielformat (alle in die Abnahme-Datei)

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_2_2_salzpass` | `m2_2_salzpass` | Karten-Id des Knotens (11.3/11.11) |
| `scn.s2_2.*` | `scn.m2_2.*` | Szenen-Schema `scn.<knoten>.*` |
| `level` + `levelOffset` | nur `levelOffset` | 11.2, content:check |
| Grell `brigand`, `steel_axe`, Stufe 13 | `skirmisher`, `steel_sword`, `lieutenantLevel` | `lieutenants.yaml` (11.5); Muster Brakka 11.12 |
| `unit.smuggler.name`, `unit.kharesh_scout.name` | neue Schlüssel in `act2/locales` | existieren nicht [ASSUMPTION] |
| `c_seal` mit `vulnerary` | Inhalt nach F1 | Platzhalter des Entwurfs |
| `chron_a2_salzpass` | `a2_salzpass` (F3) | Id-Schema `a1_watchtower` |
| `c_scouts` nur 200 Gold | 200 Gold + Saat (F4) | Mark K des Entwurfs, Epic 11.13 |
| Kundschafter „fliehen nach Westen“ (Kommentar) | Profil `trigger → aggressive` | Westwinkel ist Sackgasse; Profil des Entwurfs |
| keine Anker | zwei Anker | PO 2026-11-09 zu 2-1 |
| `goldReward: 900` | nach F5 | Akt-2-Kurve |
| Formatwunsch „Leutnant grell fehlt“, „Chronik-Seite“, „Siegel“ | grell da (11.5), Chronik über `contents.chronicle`, Siegel nach F1 | 11.5, Schema |

### Szenen-Inhalt: Quellenlage

- Missionsliste `concept/22-narrative/missionsliste-s1.md:73`: Prinzessin-Strang, das Siegel ist für den Freispruch-Erlass bestimmt; erster Zweifel; Grell bringt Maelis' Schmuggelware über den Pass; Saat Kharesh (Kundschafter im Pass); Zweifel „Wer schreibt der Prinzessin?“. `:31` Kharesh-Saat in 1-1, N2, 2-2, 3-1.
- `narrative.md:203` und Narrative-Log 2026-10-31: Seraphines Strang deckt keinen eigenen Betrug auf, sät Zweifel (Odile weiß von Halvards Briefen an die Prinzessin – das ist 2-5); Lüge platzt erst in 2-8. `:63` Freispruch gegen einen Auftrag. `:386` Salzpass = Schmuggelroute der Herzogin, Nell kennt sie (Nell tritt erst 2-6 bei). `:202,364` Maelis finanzierte die Banden über Grell. `:551-557,565` Chronik-Seiten: Wächter erzählt die Paktnacht eines Königs; Akt 2: „dass sie beim Paktfest etwas gaben“; Quellen Akt 2: N5 und je eine Truhe in 2-2, 2-4, 2-7 (Narrative-Log 2026-10-31).
- `geografie-valmora.md:19,83`: Schmuggel über den Salzpass wegen Silbermeers Zoll an der Auremündung; die Kundschafter kamen per Schiff, Silbermeer verkaufte die Überfahrt (neue leise Spur Maelis–Kharesh).
- Narrative-Log 2026-10-26 (1-3): Halvards heimlicher Kontakt kam über einen Zettel mit **grauem Wachssiegel** – möglicher Rückgriff für F2.
- 2-1-Nachszene: Seraphines Lanzenreiter „Das Nähere folgt, wenn Ihr annehmt“; Brenna/Tobin „Ich glaub es erst, wenn ein Siegel drauf ist“ (`scn.m2_1.outro.yaml:42,58`) – das Intro von 2-2 nennt den Auftrag.
- Keine Quelle sagt, warum das Siegel in Grells Karawane liegt. Vorschlag für das Intro [ASSUMPTION]: Seraphines Siegel wurde auf dem Weg zur Kanzlei abgefangen und soll über den Pass zu Maelis; die Prinzessin will es zurück, bevor jemand damit siegelt.

### Was nicht angefasst wird

- `content/packs.yaml` (`released` bleibt false), `content/released-ids.json`, `src/persistence/save.ts`: keine Migration, solange das Speicherformat gleich bleibt.
- Keine neue Regel für Fenn (Befund 1–2), kein Umbau der Sim-KI.
- `concept/01-decisions.md` (eingefroren), Dateien von Akt 1.
- Sprint-Status: nur die eigene Zeile `11-13-…` (`sprint-status.yaml:209`) setzen, falls die orchestrierende Session es nicht selbst tut.

### Testing

- `pnpm check` (lint inkl. Typecheck, test, content:check, build mit Bundle-Budget).
- Lab-Szenario für Steinschlag, Nebel und Truhe (`pnpm lab salzpass-2-2`, Format in `tools/lab.ts`, `src/lab/scenario.ts`; Akt-2-Karten spielen seit 11.12 in Akt 2).
- Vitest-Timeouts: bei Timeout Datei allein laufen lassen, nicht Worker reduzieren (AGENTS.md); Karten-Tests mit ganzen Kämpfen brauchen ggf. ein eigenes Timeout mit Begründung (Muster `sim-acts.test.ts:37-39`).

### Previous Story Intelligence (11.12 und davor)

- 11.12: `pnpm sim <karte>` ohne `--campaign` kennt nur Akt-1-Knoten → `--campaign act2 --start expected` (+ `--node`/`--position`/`--order`). Neben-Sprecher brauchen eine eigene Halbfigur (`scene-view.test.ts`), sonst als Erzähltext; Kundschafter und Schmuggler deshalb nicht sprechen lassen oder als Erzähltext. Tests, die „Akt 2 hat keine Karte“ annahmen, mussten nachgezogen werden (hier `sim-acts`, `act2-campaign-order`). PO hob Gold auf 2 000 und verlangte zwei Heimsuchungs-Anker; Niedergestreckte über dem Korridor wurden bis 11.27 hingenommen – Zahlen trotzdem melden, nicht still ändern. Szenentexte per Haiku-Entwurf, danach von Hand überarbeitet (Floskeln weg, sprecherneutrale Kettenzeilen). Lab spielt Akt-2-Karten im Herbst.
- 11.10: `warn: true` am R5-Steinschlag gehört schon in den Entwurf; Entwürfe werden von content:check geprüft (`src/content/drafts.ts`, `act2-drafts.test.ts:110` nutzt `s2_2_2_salzpass.yaml` als Probe – Entwurf nicht ändern).
- 11.8: Ziel-Phasen; hier nicht nötig (ein Ziel `treasure`).
- 11.7: keine Flieger/Reiter ab Akt 2, Stahl-Tier, Pools.
- 11.5: Leutnant-Stufe überschreibt `levelOffset`; Flags deklariert.
- Akt-1-Vorbilder: `m1_7_gewoelbe.yaml` (`treasure` + Szene auf `object_activated`, Flag am Knoten), `n2_wachturm.yaml` (Chronik in Truhe), `m1_4_wolfslager.yaml` (Steinschlag `rockwall`), `m1_3_silberbach.yaml`/`m1_5_hungerlager.yaml` (`fog: true`).

### Project Context Rules

- Keine Spielwerte im Code, kein sichtbarer Text im Code (Locales), Code/IDs Englisch, Konzepttexte Deutsch.
- Zufall nur aus dem Seed-RNG; Vorschau und Auflösung nutzen denselben Formelcode.
- Nie auf `main`, PR nach grüner CI.

### References

- [Source: concept/26-epics/epics/epic-11.md:1-49, 303-314]
- [Source: concept/27-ueberarbeitung/levels/s2_2_2_salzpass.yaml; levels/abnahme/s2_2_2_salzpass.md]
- [Source: concept/22-narrative/missionsliste-s1.md:25,31,73,120]
- [Source: concept/22-narrative/narrative.md:63,202,203,386,551-565]
- [Source: concept/22-narrative/geografie-valmora.md:19,83]
- [Source: concept/22-narrative/decision-log.md:69,78,83,99,103]
- [Source: content/acts/act2/{campaign,flags,units,lieutenants,haunts}.yaml; scenes/scn.lt.grell.yaml; maps/m2_1_windscharte.yaml]
- [Source: src/core/rules/vision.ts; src/core/rules/scout.ts; src/core/rules/effects.ts:38-56; src/core/battle/terrainWarn.ts; src/core/battle/objectives.ts:98-103,282-284]
- [Source: src/content/schemaMap.ts:75-84,95-152; content/core/balance.yaml:130,138-144,209-213; content/core/terrain.yaml]

## Offene Fragen an den Produktinhaber

- **F1 Siegel: Gegenstand oder Flag?** Es gibt kein Item-Kind für Story-Gegenstände; das Flag `m2_2_seal` ist deklariert und fällt mit dem Sieg zusammen.
  A) nur Flag + Szene, die Truhe ist sonst leer (Vorbild Chronik 1-7); B) neuer Gegenstand „Siegel der Prinzessin“ im Konvoi (`convoyOnly`, unverkäuflich), braucht Item, Bild und Konvoi-Prüfung; C) A, und das Siegel erscheint nur als Zeile in der Chronik/Folgen-Karte; D) B mit Abgabe in 2-8.
  **Vorschlag A**: billig, kein neues Format, 2-8 kann das Flag lesen.
  **Vorläufig umgesetzt: Vorschlag A** (Truhe `c_seal` leer, `t_seal` spielt `scn.m2_2.seal_found` und setzt `m2_2_seal`; markiert `[PO offen F1]`).
- **F2 Der Zweifel „Wer schreibt der Prinzessin?“** Keine Quelle sagt, was die Truppe beim Siegel findet; Odiles Wissen um Halvards Briefe kommt erst in 2-5.
  A) beim Siegel liegt ein Begleitbrief mit grauem Wachs (Halvards Zeichen aus 1-3), Liora erkennt es und schweigt; B) nur Grells Spott („Eure Prinzessin zahlt gut für ihr eigenes Siegel“), kein Brief; C) Begleitbrief mit grauem Wachs, niemand benennt es (wer 1-3 kennt, merkt es); D) kein Brief, nur Rhens Frage, wozu ein Erlass ein gestohlenes Siegel braucht.
  **Vorschlag C**: sät den Zweifel, ohne 2-5 und Halvards Enttarnung vorwegzunehmen.
  **Vorläufig umgesetzt: Vorschlag C** (Zeilen l02/l03 in `scn.m2_2.seal_found`, Nachklang l04 in `scn.m2_2.outro`; markiert `[PO offen F2]`).
- **F3 Chronik-Seite in `c_page`:** Akt 2 erzählt, „dass die Könige beim Paktfest etwas gaben“; Id und Herkunft sind offen.
  A) Id `a2_salzpass`, eine Seite aus dem Tempelarchiv, die Grell für Maelis schmuggelt, Wächter erzählt eine Paktnacht, in der der König „gab“ (ohne zu sagen, was); B) wie A, aber die Seite liegt in der Truhe der Kundschafter (Kharesh sucht dasselbe Wissen); C) Seite erst in 11.23 schreiben, hier nur Platzhaltertext; D) keine Seite in 2-2, die Akt-2-Seiten anders verteilen.
  **Vorschlag A**, Text per Schreib-Pipeline als Vorschlag zur Abnahme.
  **Vorläufig umgesetzt: Vorschlag A** (`a2_salzpass` in `content/acts/act2/chronicle.yaml`, EN in `content/locales/en/act2.chronicle.yaml`; markiert `[PO offen F3]`).
- **F4 Saat-Truhe der Kundschafter (`c_scouts`):** Der Entwurf hat nur 200 Gold, die Mark nennt eine Seekarte aus Silbermeer.
  A) 200 Gold + Szene `scn.m2_2.scouts_chart` (Seekarte mit Silbermeers Zeichen, Lucan erkennt Kharesh), kein Gegenstand; B) Seekarte als Gegenstand im Konvoi (wie F1 B); C) Szene erst, wenn die Kundschafter fallen, Truhe nur Gold; D) A plus Merk-Flag für Staffel 2.
  **Vorschlag A**: Saat ohne neues Format, wie die Gerücht-Szene in 1-1.
  **Vorläufig umgesetzt: Vorschlag A** (`c_scouts`: 200 Gold + `dialogue: scn.m2_2.scouts_chart`; markiert `[PO offen F4]`).
- **F5 Gold:** Entwurf 900 + 500 in Truhen; Akt-2-Kurve 2 000–3 000, 2-1 hat 2 000.
  A) 2 000 (Kurvenboden wie 2-1, kleine K-Karte); B) 2 300 (steigt mit der Position); C) 900 wie Entwurf; D) 2 000 und Truhengold auf je 100 senken.
  **Vorschlag A**, 11.27 stimmt am Ende ab.
  **Vorläufig umgesetzt: Vorschlag A** (`goldReward: 2000`; markiert `[PO offen F5]`).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (Subagent der orchestrierenden Session)

### Debug Log References

- `pnpm sim m2_2_salzpass --campaign act2 --start expected --runs 50 --difficulty {easy,normal,hard}`, dazu `--node m2_2 --position 14`; `pnpm sim --campaign act2 --runs 50 --difficulty {easy,normal,hard}` (Zahlen in der Abnahme-Datei).

### Completion Notes List

- Karte aus dem Entwurf übernommen, Gelände unverändert; Abweichungen im Kopfkommentar und in `levels/abnahme/s2_2_2_salzpass.md`.
- F1–F5 vorläufig mit dem Vorschlag umgesetzt, jede Stelle mit `[PO offen F<n>]` markiert (Karte, Szenen, Chronik); ein Wechsel betrifft nur Karte/Szene/Chronik-YAML.
- Kein Code und kein Akt-1-Content geändert; nachgezogen wurden Tests, die „m2_2 ohne Karte“ annahmen (`sim-acts`, `act-title`, `act-transition`, `chronicle`). `act2-campaign-order` blieb grün.
- Heimsuchungs-Anker abweichend vom Vorschlag der Dev Notes: `treasure` in der Nordkammer (Ziel [7,2]) statt Südkammer [9,16], weil [9,16] zwei Felder neben dem Startbereich liegt; `rout` mit Spawn [7,11]–[11,12], weil das Ziel nicht im Spawn liegen darf.
- Befund Sim-KI: Nebenziel `s_chests` 0 % auf allen Stufen (die KI öffnet nur die Siegeltruhe). Schwer unter dem Korridor (Zeitlimit), Normal-Niedergestreckte am unteren Rand – nur berichtet, Abstimmung in 11.27.
- Offen für die orchestrierende Session: Spielbild 375 × 812 (Lab `salzpass-2-2`), Decision-Log-Einträge nach den PO-Antworten.

### File List

- content/acts/act2/maps/m2_2_salzpass.yaml (neu)
- content/acts/act2/scenes/scn.m2_2.{intro,outro,rockfall_south,rockfall_warn,rockfall_ledge,seal_found,scouts_chart}.yaml (neu)
- content/acts/act2/chronicle.yaml (neu)
- content/locales/en/act2.chronicle.yaml (neu)
- content/locales/en/act2.dialogue.yaml
- content/acts/act2/locales/de.names.yaml, en.names.yaml
- content/acts/act2/campaign.yaml
- tests/unit/m2-2-salzpass.test.ts (neu)
- tests/fixtures/lab/salzpass-2-2.yaml (neu)
- tests/unit/sim-acts.test.ts, act-title.test.ts, act-transition.test.ts, chronicle.test.ts
- concept/27-ueberarbeitung/levels/abnahme/s2_2_2_salzpass.md
- Atlas aus `pnpm levels`

### Change Log

- 2026-11-09: Mission 2-2 umgesetzt (Karte, Szenen, Chronik-Seite, Knoten, Test, Lab); F1–F5 vorläufig nach Vorschlag.
