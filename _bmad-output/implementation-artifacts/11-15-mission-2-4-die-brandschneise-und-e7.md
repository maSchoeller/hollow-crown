---
baseline_commit: 8583e98e
---
# Story 11.15: Mission 2-4 „Die Brandschneise“ und Entscheidung E7

Status: review

<!-- Erstellt 2026-11-09 mit gds-create-story. Offene Fragen F1–F6 an den PO stehen am Ende; bis zur Antwort gelten die Vorschläge nur als [ASSUMPTION]. Baseline erst nach dem Merge von 11.14 (2-3) setzen: beide Stories ändern campaign.yaml, sim-acts.test.ts und act2-campaign-order.test.ts. -->

## Story

Als Spieler
möchte ich ein Bergdorf gegen Feuer und Plünderer halten, während Brann die Schneise reißt,
damit Dravns Lüge platzt und die Lage der Truppe kippt.

## Acceptance Criteria

1. **Karte übernommen:** `content/acts/act2/maps/m2_4_brandschneise.yaml` übernimmt den Entwurf `concept/27-ueberarbeitung/levels/s2_2_4_brandschneise.yaml` (G 30 × 40, `defend` Brann 12 Runden, 12 eigene gegen 38 auf Normal, L 33 / S 44, Leutnant Grell, `weather: ash`, `timeOfDay: evening`) mit Feld `design:` auf den Entwurf, `map.act = 2`, drei Höhenstufen (`levels:` Stufe 2 für y 0–16, Stufe 1 für y 17–26, Rampen und Treppen wie im Entwurf). Alle Gegner nur mit `levelOffset` (−3…−1, Grell über die Leutnant-Regel), keine Flieger, keine Reiter (content:check aus 11.2/11.7 grün).
2. **Feuer:** Der Wald brennt ab Runde 1 im Norden (`initialEffects`) und frisst sich nach Süden; wie schnell und wie weit, regelt F1. Asche, Straße, Terrasse und Rampen brennen nicht.
3. **Schneise:** Zu Beginn der Spielerphase von Runde 3 (West, y 17, x 3–5 und 7–13) und Runde 6 (Ost, y 17, x 16–22 und 24–26) werden die Felder `ash`; Rampen (x 6, 14, 15, 23) bleiben. Ein brennendes Feld der Schneise erlischt dabei (`eventTerrain` löscht den Timer). Die Szenen `scn.m2_4.brann_break_west`/`_east` spielen nur, solange Brann auf dem Brett steht.
4. **Brann:** Gast (`char: brann`, `team: other`, `guest: true`, `ai: hold`, `ignoreForRout`) auf dem Schrein `[15,22]`; nicht steuerbar, tritt nach der Mission nicht bei (Beitritt erst in N5). Fällt er, ist die Mission verloren.
5. **Plünderer und Häuser:** Die Flanken-Plünderer (`ai: raider`) gehen auf die vier Besuchshäuser und brennen sie nieder (`razed`, Gelände `ruins`); Nebenziel „alle Häuser besuchen“ wie im Entwurf.
6. **Wellen:** angekündigte Wellen R3 (Nord, über das Verbrannte), R5 (West), R6 (Grell mit drei Leuten, Nord), R8 (Süd), R9 (Nord), R10 (Ost) wie im Entwurf.
7. **Sable:** steht als Dravns Offizierin auf der Lichtung `[21,7]`, ist nicht angreifbar und **greift nicht ein** (auch nicht gegen Grells Leute) und nimmt keinen Schaden durch das Feuer (siehe Befund 4); in Runde 7 spielt `scn.m2_4.sable_watches`.
8. **Chronik-Seite:** Die Truhe `c_page` in der Köhlerruine `[10,4]` trägt eine Chronik-Seite von Akt 2 (`contents.chronicle`, Seite in `content/acts/act2/chronicle.yaml` DE und EN, Id nach F6); Nebenziel „Truhe öffnen“ wie im Entwurf.
9. **Szenen:** `scn.m2_4.intro`, `scn.m2_4.outro`, `scn.m2_4.brann_break_west`, `scn.m2_4.brann_break_east`, `scn.m2_4.sable_watches`, `scn.m2_4.grell_battle` (R6) und die Chronik-Szene der Truhe in DE und EN, jede Box ≤ 110 Zeichen, Gefährtenzeilen mit `requires: alive` und Ersatzsprecher-Kette, Hintergrund `brandschneise`. Inhalt: Dravns Lüge platzt (er opfert seine eigenen Dörfer, Grells Leute plündern hinter dem Feuer, Dravn lässt sie gewähren), Brann rettet das Dorf, das ihn „Hexenkind“ nannte, und flieht in die Minen von Kupferhall, als sie ihn wieder so nennen. Saat Dravn („Drachen hält nur Feuer auf“) und die erste Spur Dravn–Maelis sind gesetzt.
10. **Entscheidung E7** in der Nachszene (Rahmen nach F2): zwei Antworten mit Haltung und Folgen-Karte (`summary`).
    - `warn` (Haltung `warm` [ASSUMPTION]): `setFlag: { e07: warn }`, `meet: { lt: sable }`, `recruit: { lt: sable }` (Sable bindet sich das glutorange Tuch um, Groll erlischt über `joinLieutenant`, `joined_sable` gesetzt).
    - `obey` (Haltung `sober` [ASSUMPTION]): `setFlag: { e07: obey }`, `meet: { lt: sable }`, `priceMod: { pct: -10, act: 2 }`; Brandhang brennt (Weltkarten-Variante `burnt_slope_burnt`, `valmora.yaml:51`), Sable bleibt Leutnantin. Summe und Deckel der Rabatte baut 10.9, nicht diese Story.
    - Danach in beiden Fällen: Das Grenzheer jagt die Truppe, Maelis bietet als Dritte an (Form nach F3).
11. **Knoten:** `m2_4` in `content/acts/act2/campaign.yaml:28` bekommt `pre`/`post`; `map: m2_4_brandschneise` und `place: brandschneise` bleiben; N5 öffnet nach dem Sieg (steht schon in `campaign.yaml:35`). Die Weltkarte bietet 2-4 nach 2-2 und 2-3 an (`mapInBuild`).
12. **Niederlage:** Avatar, Lucan oder Brann fallen.
13. **Gewinnbar und im Korridor:** `pnpm sim` mit Optionen aus 11.4 zeigt die Karte gewinnbar und im Korridor (NFR12); 2-4 hat nur **eine** Position (P = 15, siehe Ausgangslage), Ergebnis mit Zahlen im Kopfkommentar der Karte und in der Abnahme-Datei; Act-1-Basislauf bleibt identisch.
14. **Heimsuchungen:** zwei Heimsuchungs-Anker wie bei 2-1/2-2 (Vorschlag in den Dev Notes), keiner im Startbereich der Mission.
15. **Unveröffentlicht und Bilder:** `act2` bleibt `released: false`; kein `pnpm content:lock`, keine Änderung an `content/released-ids.json`. Das Weltkarten-Bild `burnt_slope_burnt` ist erzeugt (Protokoll `art/prompts/burnt_slope_burnt_site.md`) oder als offen gemeldet.
16. **Abnahme:** Bild der Karte bei 375 × 812 im Spiel (Feuer im Norden, Schneise nach R3, Sable auf der Lichtung) und der Folgen-Karte von E7; Abweichungen vom Entwurf stehen in `concept/27-ueberarbeitung/levels/abnahme/s2_2_4_brandschneise.md` (neuer Abschnitt „Übernahme Story 11.15“); `pnpm check` grün.

## Tasks / Subtasks

- [x] T1 Karte anlegen (AC 1–8, 12, 14)
  - [x] `content/acts/act2/maps/m2_4_brandschneise.yaml` aus dem Entwurf: `id: m2_4_brandschneise`, `nameKey: map.m2_4_brandschneise.name`, `weather: ash`, `timeOfDay: evening`, `design:` = Entwurfsblock plus Verweis auf `s2_2_4_brandschneise`; Kopfkommentar nach Muster `m2_2_salzpass.yaml:1-11` (Entwurf, Abweichungen, Sim-Zahlen [C], Szenen).
  - [x] Gelände: `forest`, `grass`, `field`, `road`, `mountain`, `building`, `village`, `shrine`, `ruins`, `ramp`, `stairs`, `plain` gibt es alle (`content/core/terrain.yaml`). `levels:` wie Entwurf; prüfen, dass die Rampen y 17 → Stufe 2 und y 27 → Stufe 1 als Verbinder greifen und content:check (`validateLevels.ts`, `validateWalk.ts`) grün ist.
  - [x] Gegner: `level` streichen, nur `levelOffset` (11.2). Name `unit.looter.name` („Plünderer“, `content/core/locales/de.names.yaml`) bleibt; Figur (`sprite`) nach Pool `silver_sea` (`haunts.yaml:19-23`: brigand → `brigand`, skirmisher → `mercenary`, marksman → `bandit_archer`, vanguard → `soldier`), Muster `m2_2_salzpass.yaml:78`. Eisenwaffen wie Entwurf; Stahl nur, wenn die Sim es verlangt [ASSUMPTION].
  - [x] Grell: `lieutenant: grell`, **Klasse `skirmisher`, Waffe `steel_sword`** laut `lieutenants.yaml` (Entwurf: `brigand`/`steel_axe`, wie schon in 2-2 korrigiert), `levelOffset: 1` nur fürs Schema; `id: grell` in der Welle R6.
  - [x] Brann: `char: brann` ohne `level` (die Stufe kommt aus `units.yaml:73-83`, Stufe 10; Kartenstufe 8 des Entwurfs fällt weg, Befund 5), `items: [{ def: rockfall }]`, `guest: true`, `ai: { profile: hold }`, `ignoreForRout: true`.
  - [x] Sable: generische Einheit (`nameKey: unit.sable.name`, **ohne** `char`/`lieutenant`, damit sie nach der Mission nicht über `campaign.ts:298` mitkommt), `team: other`, `untargetable: true`, `ignoreForRout: true`, **`items: []`** (sonst schlägt sie mit `hold` zu, Befund 4), Lichtung `[19..23, 6..8]` als `plain` statt `grass` oder Feuer-Abstand nach F1; Halbfigur `sable` vorhanden.
  - [x] Objekte: vier Häuser (`v_nw`, `v_ne`, `v_sw`, `v_se`) wie Entwurf; `c_page` mit `chronicle: <Id nach F6>` und `dialogue: scn.m2_4.page` (Muster `n2_wachturm.yaml:62`), Gold 300.
  - [x] Feuer nach F1 (Vorschlag: deterministische Feuerfront über Trigger, siehe Befund 1).
  - [x] Trigger: `t_break_west` R3 player, `t_break_east` R6 player (`dialogue` mit `onBoard: brann`, dann `set_terrain … ash`), `t_grell` R6 enemy nach der Welle (`scn.m2_4.grell_battle`, `onBoard: grell`), `t_sable` R7 player (`scn.m2_4.sable_watches`). Szenen-Ids `scn.m2_4.*`.
  - [x] Wellen R3, R5, R6, R8, R9, R10 wie Entwurf (`announce: true`).
  - [x] Heimsuchungs-Anker `haunts:` (Vorschlag unten, Gründe als Kommentar darüber).
  - [x] `goldReward` nach F5; `map.m2_4_brandschneise.name` in `content/acts/act2/locales/{de,en}.names.yaml`.
- [x] T2 Feuer-Regel nach F1 (AC 2), nur falls F1 = A oder B (F1 = A vorläufig)
  - [x] F1 = A: Trigger-Aktion `ignite` (Area) in `src/core/mapDefs.ts:166-176` und `schemaMap.ts`, Auflösung über `igniteTile` (`src/core/rules/effects.ts:60`), optional `warn` wie `set_terrain` (`terrainWarn.ts`); Test in `tests/unit/` mit Seed-Wiederholbarkeit; Content-Prüfung. Formel nicht kopieren.
  - [ ] F1 = B (entfällt, F1 = A): Karten-Feld für Ausbreitungschance und Brenndauer, Standard aus `balance.terrainEffects`.
- [x] T3 Szenen DE/EN (AC 3, 7, 9, 10)
  - [x] `scn.m2_4.intro` (Ankunft am Brandhang, Wald brennt, Brann auf dem Schrein, Dravns Befehl wird spürbar), `brann_break_west`, `brann_break_east`, `grell_battle`, `sable_watches`, `page`, `scn.m2_4.outro` mit E7 (`c01`, zwei Antworten, `stance`, `summary`, `effects` wie AC 10) und Nachklang je Zweig (`requires: [{ flag: { e07: … } }]`, Muster `scn.m1_5.outro.yaml:60-125`), danach Jagd des Grenzheers und Maelis' Angebot (F3), Branns Flucht (Hexenkind, Ziel Kupferhall). Text **entwerfen und als Vorschlag markieren** (Schreib-Pipeline der Narrative).
  - [x] Sprecher nur mit Halbfigur (`art/mockups/characters-s1/`): vorhanden `brann`, `sable`, `grell`, `dravn`, `dravn_envoy`, `maelis`, `villager_elder`, `villager_child`, `lucan`, Gefährten von Akt 1/2. Fehlt eine (z. B. ein Bote Silbermeers), als Erzähltext oder neue Halbfigur per ChatGPT mit Protokoll `art/prompts/<id>.md` (eigener Task).
  - [x] EN in `content/locales/en/act2.dialogue.yaml`; Box ≤ 110 Zeichen; Ersatzsprecher-Prüfung grün.
- [x] T4 Chronik-Seite (AC 8)
  - [x] Seite in `content/acts/act2/chronicle.yaml` (dort bisher nur `a2_salzpass`), EN in `content/locales/en/act2.chronicle.yaml`; höchstens 12 Seiten in der Staffel (`validateLocales.ts:37`).
- [x] T5 Knoten verdrahten (AC 11)
  - [x] `m2_4` in `campaign.yaml:28`: `pre: scn.m2_4.intro`, `post: scn.m2_4.outro`; Kommentar Z. 21 um m2_4 ergänzen.
- [x] T6 Weltkarten-Bild `burnt_slope_burnt` (AC 15)
  - [x] Bild per ChatGPT über Claude in Chrome nach `art/prompts/burnt_slope_burnt_site.md` erzeugen (Original `art/world/v5/burnt_slope_burnt_chatgpt.png`, abgeleitet `art/world/sites/burnt_slope_burnt.png`, Laufzeit `world/sites/burnt_slope_burnt.webp`, schon in `packs.yaml:81`), Lizenzauflagen `licensing.md` §6; im Protokoll das veraltete Flag `e7_order` auf `e07: obey` korrigieren. Ist Chrome nicht verbunden: offen melden, der Rückfall aus 15.7 zeigt das gemalte Dorf.
- [x] T7 Simulation und Abstimmung (AC 13)
  - [x] `pnpm sim m2_4_brandschneise --campaign act2 --start expected --node m2_4 --runs 50`, alle drei Schwierigkeiten, mit und ohne `--haunts`; Varianten per `--map-file`/`--set`, `--json` + `pnpm sim:diff`. Optionen im Kopf von `tools/simulate.ts`.
  - [x] Prüfen und melden (nicht die KI umbauen): Hält die Sieg-KI Brann am Leben? Besucht sie Häuser vor den Plünderern? Holt sie die Truhe `c_page` vor dem Feuer? Wie viele Häuser fallen? Wie oft stirbt Brann?
  - [x] Act-1-Basislauf `pnpm sim --campaign act1 --runs 50 --seed 1` unverändert.
- [x] T8 Tests (AC 2–12, 14)
  - [x] `tests/unit/m2-4-brandschneise.test.ts` nach Muster `tests/unit/m2-2-salzpass.test.ts`: Knoten/Ziel `defend brann 12`, 33/38/44 Gegner mit Wellen, Stufen auf P = 15, Grell als Leutnant; Schneise R3/R6 wird `ash`, Rampen bleiben, ein brennendes Feld erlischt; Feuer nach F1 (z. B. Front erreicht y 16 bis Runde X, nie südlich der Schneise); Brann Gast, nicht steuerbar, sein Tod verliert, er tritt nicht bei; Sable nicht angreifbar, greift nie an, bleibt nach der Mission weg; Plünderer brennen ein Haus nieder; E7 `warn` → `joined_sable`, Sable im Kader, Groll 0; E7 `obey` → `priceMods` −10 % Akt 2, Weltkarten-Variante aktiv, Sable nicht im Kader; Chronik-Seite; Gold; zwei Anker.
  - [x] Szenen-Tests: E7 hat zwei Antworten mit Haltung und `summary`; Gefährtenzeilen fallen auf Rhen zurück; Brann-Szenen nur mit `onBoard`.
  - [x] Lab-Szenario `tests/fixtures/lab/brandschneise-2-4.yaml` (Muster `salzpass-2-2.yaml`, `company: expected`).
  - [x] Bestehende Tests nachziehen: `tests/unit/sim-acts.test.ts:46` (`skipped` ohne m2_4), `tests/unit/act2-campaign-order.test.ts:21` (Ersatzkarte für m2_4 in `sessionMaps`), ggf. `act-title`, `act-transition`, `chronicle`. `act2-drafts.test.ts:173-186` nutzt den Entwurf und bleibt (Entwurf nicht ändern).
- [x] T9 Ansicht, Abnahme, Abschluss (AC 15, 16)
  - [x] `pnpm levels` (Atlas); [ ] Spielbild bei 375 × 812 (offen, Nachtbetrieb) über `pnpm dev:act2`, Lautstärken auf 0; Ortsbild `brandschneise` ist in `ACT2_LOCATIONS` (`tools/art/build.py:49`) und `packs.yaml:75`, vor `pnpm art:build` `git lfs pull`.
  - [x] Abschnitt „Übernahme Story 11.15“ in `levels/abnahme/s2_2_4_brandschneise.md` mit allen Abweichungen und Sim-Zahlen.
  - [x] Neue Entscheidungen (F1–F6) ins Decision-Log von `concept/22-narrative/` bzw. `concept/21-gdd/` eintragen, nie in `01-decisions.md`.
  - [x] `pnpm check` grün; **kein** `released: true`, **kein** `content:lock`.

## Dev Notes

### Ausgangslage (Stand 2026-11-09, nach `301be35`)

- Knoten `m2_4` (`campaign.yaml:28`): `map: m2_4_brandschneise, place: brandschneise, merchantTier: 1, requires: [{ completed: m2_2 }, { completed: m2_3 }]`, noch ohne `pre`/`post`. N5 (`campaign.yaml:35`) verlangt `completed: m2_4`.
- **Position:** `positionLevel.base: 12` + erledigte Story-Knoten; 2-4 kommt immer nach 2-1, 2-2 und 2-3 → **P = 15**, nur eine Position (Entwurf rechnet mit P = 14). Gegner Start P−3 = 12, Wellen P−2 = 13, Grell P+1 = 16.
- Flag `e07` (`flags.yaml:9`, `values: [warn, obey]`, `kind: decision`), `joined_sable` (`flags.yaml:13`, gesetzt von `joinLieutenant`, `lieutenants.ts:37,150`). Der Flag `brandhang_burned` entfällt (GDD-Log 2026-11-09 (4)).
- Leutnantin `sable` (`lieutenants.yaml:44-54`, `joins: true`, Signatur `dravns_oath`) und Figur `sable` (`units.yaml:87-97`, `duelist`, `joins: lieutenant`); Leutnant `grell` (`lieutenants.yaml`, `skirmisher`, Signatur `gold_hook`, Zeilen `scn.lt.grell`). Brann (`units.yaml:73-83`, `elementalist`, Stufe 10, `joins: n5`).
- Ortsbild `brandschneise` (LFS, `art/mockups/locations-s1/brandschneise.png`, Protokoll `art/prompts/loc_brandschneise.md`), Weltkarten-Slot `burnt_slope` mit Variante `burnt_slope_burnt` bei `e07: obey` (`content/world/valmora.yaml:51`), Bild **fehlt** (nur `art/prompts/burnt_slope_burnt_site.md`, Status offen).
- 2-1 und 2-2 sind fertig (Karten, Szenen, Tests, Lab, Gold je 2 000, zwei Anker, Chronik `a2_salzpass`); 2-3 entsteht parallel (11.14), nicht darauf bauen.

### Code-Befunde

1. **Feuer erreicht die Schneise nie (wichtigster Befund):** Ausbreitung `tickTerrain` (`src/core/rules/effects.ts:239-262`): Jedes brennende Feld zündet zu Rundenbeginn mit `burningSpreadChance` 25 % **ein** zufälliges brennbares Nachbarfeld, brennt `burningDuration` 2 Runden (Startfeuer `initialEffects` 3 Runden, `src/core/battle/setup.ts:140-146`) und wird dann `ash` (`balance.yaml:34-37`). Brennbar sind nur `grass`, `forest`, `field` (`terrain.yaml:9,11,43`). Das ist ein unterkritischer Verzweigungsprozess: Eine Nachrechnung mit dem Gelände des Entwurfs (2 000 Läufe, Skript im Scratchpad, Seed-RNG nicht exakt nachgebildet, [C] im Lab bestätigen) gibt als südlichste Brandreihe im Median y 5, p90 y 7, Maximum y 9; **y 12 (Getreide) und y 17 (Schneise) wird in keinem Lauf erreicht**, im Median brennen 47 Felder. Die Schneise ist damit nur Kulisse, AC 2 und der Entwurfsgedanke „das Dorf retten“ greifen nicht → F1. Eine Trigger-Aktion zum Anzünden gibt es nicht (`TriggerAction`, `src/core/mapDefs.ts:166-176`); `set_terrain … burning` setzt Gelände ohne Timer (`eventTerrain` löscht ihn, `effects.ts:49`), das Feld brennt dann nie ab und breitet sich nicht aus.
2. **Schneise:** `set_terrain` mit `ash` funktioniert (`effects.ts:43-57`, Probe `act2-drafts.test.ts:173-186`); auf einem brennenden Feld löscht sie den Timer, das Feuer ist dort aus. `ash` ist für alle begehbar (`terrain.yaml:26`), es gibt also keinen Konflikt mit besetzten Feldern. `warn` (11.10) ginge, ist aber nicht nötig [ASSUMPTION]: Asche sperrt nichts.
3. **Brann als Gast:** `guest` (11.10, `schemaMap.ts:68-69`, `create.ts:206`, `state.ts:100`); nach der Mission bleibt er zurück (`campaign.ts:297-298`). `hold` greift ohne Ziehen an (`ai.ts:474-479`); Elementaristen dürfen bei `hold` wirken (`ai.ts:222`). `rockfall` (`items.yaml:34`, Erde, Reichweite 1–2). Schrein heilt 20 % (`terrain.yaml:32`). Gegner greifen `team: other` an (`isHostile`, `src/core/util.ts:59`), Plünderer mit `raider` schlagen zu, wenn ein Angriff über 40 Punkte wert ist (`ai.ts:484-489`). `defend` endet mit Sieg nach Runde 12 oder früher, wenn keine Gegner und Wellen mehr kommen (`objectives.ts:68-77,115`).
4. **Sable „greift nicht ein“ geht so nicht:** `team: other` ist feindlich zu `enemy` (`util.ts:59`), mit `hold` und `steel_sword` schlägt sie jeden Plünderer neben sich (`ai.ts:474-476`). Ein Profil „passiv“ gibt es nicht (`mapDefs.ts:92`). `untargetable` schützt nur vor Angriffen (`ai.ts:61`, `actions.ts:53,277`), **nicht vor Feuer** (`burningTileHit`, `effects.ts:229-235,291-296`); die Lichtung `[19..23, 6..8]` ist Gras im Wald, die Nachrechnung aus Befund 1 erreicht sie in ~15 % der Läufe. Lösung ohne Code: `items: []` und Lichtung als `plain` [ASSUMPTION]; eine generische Sable (ohne `char`) tritt nicht über `campaign.ts:298` bei, der Beitritt kommt allein über E7.
5. **Stufe von Brann:** Eine Karteneinheit mit `char` nimmt Werte und Stufe der Figur (`create.ts:150-156`, `recordFromChar`), `level: 8` des Entwurfs wirkt nicht; `validateLevels.ts:28-30` verlangt bei `char` weder `level` noch `levelOffset`. Brann ist also Stufe 10 (HP 22) gegen Gegner der Stufe 12–13; ob er 12 Runden hält, zeigt erst die Sim (Befund melden, Werte nicht im Code).
6. **Plünderer:** `raider` sucht das nächste geschlossene `village`, brennt es nieder (`state: razed`, Gelände `ruins`, Event `razed`, `ai.ts:484-500`). Das Nebenziel `visit_villages` (`schemaMap.ts:213`) ist dann verloren.
7. **Höhe:** `elevation.rangedBonus: 1` (`balance.yaml:198-203`): Schützen auf Stufe 2 schießen weiter; Nahkampf über Stufen nur an `ramp`/`stairs`. Feuer kennt keine Stufen (`neighbors` in `tickTerrain`).
8. **E7:** Muster `scn.m1_5.outro.yaml:64-125` (E3: `choice` mit `stance`, `summary`, `effects`, Nachklang über `requires: [{ flag: … }]`) und `scn.m1_6.outro.yaml:108` (`priceMod: { pct: -10, act: 2 }`). `recruit: { lt: sable }` → `joinLieutenant` (`lieutenants.ts:152-180`): Stufe `max(def.level, lieutenantLevel)`, Signatur aus dem Besitz der Truppe oder neu, **Groll auf 0** auf beiden Seiten, `joined_sable` gesetzt; Prüfung `effects.ts:60-75` verlangt `joins: true` und eine Figur. `priceMod` wirkt in `shopPrice` (`src/core/campaign/aid.ts:10-13`, Summe je Akt; der Deckel −30 % kommt mit 10.9, GDD-Log 2026-10-31). `meet: { lt: sable }` in beiden Zweigen, damit Sable ab 2-5 als getroffen gilt (Narrative-Log 2026-10-31).
9. **Wetter Asche:** `render.yaml:171-176` erlaubt `ash` in Akt 1–3 (`validateLook.ts:10-16`); die Ausnahme „nur 2-4“ (GDD-Log 2026-11-05) prüft niemand – nichts zu tun.
10. **Gold:** Entwurf 1 600 + 900 Gold aus Häusern + 300 Truhe + 500 Nebenziel; Akt-2-Kurve 2 000–3 000 je Story-Mission (`gdd.md:352`), 2-1/2-2 je 2 000 → F5.
11. **Heimsuchungs-Anker (Vorschlag, [ASSUMPTION]):** Schema `hauntAnchorSchema` (`schemaMap.ts:130-152`). Startbereich ist der Dorfplatz `[11..18, 20..24]`.
    - `rout` – Grund: Grells Nachzügler plündern die unteren Felder. `target: { at: [14, 30] }`, `enemySpawn: { rect: [8, 28, 20, 31] }` (Ziel nicht im Spawn: ggf. Ziel nach `[14, 33]`), `deploy: { rect: [4, 36, 12, 38] }`.
    - `treasure` – Grund: das Lager der Köhler im Nordwald. `target: { at: [9, 4] }`, `enemySpawn: { rect: [16, 4, 22, 8] }`, `deploy: { rect: [12, 12, 17, 15] }`, `turns: 10`, `chests: [[10, 4], [20, 7]]`.
    Ob `initialEffects` auch in einer Heimsuchung brennen, prüfen; Felder vor dem Anlegen auf Begehbarkeit prüfen (content:check meldet unerreichbare Anker).
12. **Truppe und Sprecher:** Sicher sind nur Rhen und Lucan. Möglich: Brenna, Tobin, Mira, Fenn, Liora, Varek (Grenzheer, kennt Sable und Dravn), Ysolde, Grosk, Jory, Ilka (2-3). Vorschlag Ketten: Sable/Grenzheer-Zeilen `[varek, lucan]` (Varek diente unter Sable, Lucan kennt Dravn aus dem Grenzkrieg); Brann/Hexenkind `[liora, ysolde, avatar]` (Liora und Ysolde als Magiekundige, `narrative.md:321`); Plünderer/Grell `[brenna, tobin, avatar]`; Jory/Ilka mit `requires: [{ alive: … }]`, `fallback: skip`. Dorfstimmen über `villager_elder`.

### Abweichungen Entwurf ↔ Spielformat (alle in die Abnahme-Datei)

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_2_4_brandschneise` | `m2_4_brandschneise` | Karten-Id des Knotens (11.3/11.11) |
| `scn.s2_4.*` | `scn.m2_4.*` | Szenen-Schema `scn.<knoten>.*` |
| `level` + `levelOffset` | nur `levelOffset` | 11.2, content:check |
| Stufen-Kommentar P = 14 | P = 15 | 2-4 kommt immer nach drei Story-Missionen |
| Grell `brigand`, `steel_axe`, Stufe 15 | `skirmisher`, `steel_sword`, `lieutenantLevel` | `lieutenants.yaml` (11.5); wie 2-2 |
| Brann `level: 8` | Stufe aus `units.yaml` (10) | Einheit mit `char` (Befund 5) |
| Sable mit `steel_sword`, `hold` | `items: []`, Lichtung `plain` | sie soll nicht eingreifen und nicht brennen (Befund 4) |
| Feuer nach „vorhandener Regel“ | nach F1 | die Regel erreicht die Schneise nie (Befund 1) |
| `chron_a2_brandhang` | Id nach F6 (Vorschlag `a2_brandhang`) | Id-Schema `a2_salzpass` |
| keine Anker | zwei Anker | PO 2026-11-09 zu 2-1 |
| `goldReward: 1600` | nach F5 | Akt-2-Kurve |
| Formatwunsch „Leutnant grell fehlt“, Modelle Getreideterrasse/Stützmauer | grell da (11.5); Modelle bleiben offen (11.24/Matrix) | 11.5 |

### Szenen-Inhalt: Quellenlage

- Missionsliste `concept/22-narrative/missionsliste-s1.md:75`: Dravns Lüge platzt, er opfert seine eigenen Dörfer; Grells Leute plündern hinter dem Feuer, Dravn lässt sie gewähren; Brann (Gast) hält das Feuer auf, rettet das Dorf, das ihn „Hexenkind“ nannte, flieht, als sie ihn wieder so nennen, in die Minen von Kupferhall (N5). Lagewechsel: Grenzheer jagt die Truppe, Maelis bietet als Dritte an. Saat Dravn: Drachen nur mit Feuer aufzuhalten; erste Spur Dravn–Maelis. `:66` Maelis kommt erst dazu, als Dravns Lüge in 2-4 platzt. `:76` Sable jagt die Truppe in 2-5 für das Grenzheer.
- `narrative.md:201` Dravn will Grenzdörfer als Brandschneise gegen die Drachen opfern; `:229` Sables Wechsel: Dravns Lüge aufdecken und **ihr Heimatdorf** vor der Brandschneise warnen; `:385` „Sables Dorf am Brandhang soll als Brandschneise geopfert werden“; `:482` Seitenwechsler binden sich das glutorange Tuch um; `:694` E7 „Brandhang warnen oder den Befehl ausführen“; `:701` nennt noch „E7 nach 2-5“ (überholt durch Missionsliste und `flags.yaml:8`).
- Narrative-Log: 2026-10-31 (`decision-log.md:82`) „Befehl ausführen“ → Brandhang brennt (Szene, Weltkarten-Variante), „warnen“ → in 2-6 ein von Drachenschatten verbranntes Dorf; `:83` Chronik-Truhe in 2-4; `:98` Brann aus Brandhang; `:99` Grells Plünderung = erste Spur Dravn–Maelis; `:103` Brandhang nördlich der Grauwacht zum Drachengebirge; `:108` Hat Sable gewechselt, übernimmt in 2-5/2-6/2-8 ein Hauptmann des Grenzheers (nicht diese Story).
- `geografie-valmora.md:84`: Brandhang nördlich der Grauwacht.
- 2-1-Nachszene: Dravns Bote bietet „Freispruch gegen einen Auftrag“ (`scn.m2_1.outro.yaml:44-47`); Lucan: „Bei dem ist Freispruch nie umsonst“. Das Intro von 2-4 kann diesen Auftrag einlösen.
- **Widerspruch, den die Quellen offenlassen:** Die Mission rettet das Dorf am Brandhang vor dem Feuer, E7 „gehorchen“ lässt danach Brandhang brennen. Welches Dorf E7 meint und wer den Befehl ausführt, sagt keine Quelle → F2.

### Was nicht angefasst wird

- `content/packs.yaml` (`released` bleibt false), `content/released-ids.json`, `src/persistence/save.ts` (kein neues persistiertes Feld; `priceMods` und Leutnant-Stand gibt es).
- Rabatt-Summe und -Deckel (10.9), Hauptmann-Ersatz für Sable in 2-5/2-6/2-8 (11.16/11.17/11.19), Branns Beitritt (N5, 11.21), Chronik-Szene von Akt 2 (11.23, „nach 2-4“).
- Kein Umbau der Sim-KI; Code nur, wenn F1 = A oder B.
- `concept/01-decisions.md` (eingefroren), Dateien von Akt 1, Entwurf `s2_2_4_brandschneise.yaml` (Probe in `act2-drafts.test.ts`).
- Sprint-Status: nur die eigene Zeile `11-15-…` (`sprint-status.yaml:211`), falls die orchestrierende Session es nicht selbst tut.

### Testing

- `pnpm check` (lint inkl. Typecheck, test, content:check, build mit Bundle-Budget).
- Lab-Szenario für Feuer, Schneise, Sable und Häuser (`pnpm lab brandschneise-2-4`, Format in `tools/lab.ts`, `src/lab/scenario.ts`).
- G-Karte 30 × 40 mit 44 Gegnern auf Schwer: Karten-Tests mit ganzen Kämpfen brauchen ggf. ein eigenes Timeout mit Begründung (Muster `sim-acts.test.ts:37-39`); bei Timeout Datei allein laufen lassen, nicht Worker reduzieren (AGENTS.md). Leistung der großen Karten misst 11.26.

### Previous Story Intelligence (11.13, 11.12 und davor)

- 11.13: Abweichungen im Kopfkommentar und in der Abnahme-Datei; vorläufige PO-Antworten im Content mit `[PO offen F<n>]` markieren. Heimsuchungs-Anker mussten verschoben werden (Ziel nicht im Spawn, nicht neben dem Startbereich). Sim-KI erfüllt Truhen-Nebenziele nicht (0 %) – hier nur berichten. Nachgezogen wurden `sim-acts`, `act-title`, `act-transition`, `chronicle`.
- 11.12: `pnpm sim <karte>` ohne `--campaign` kennt nur Akt-1-Knoten → `--campaign act2 --start expected --node m2_4`. Neben-Sprecher brauchen eine eigene Halbfigur (`scene-view.test.ts`). Szenentexte per Haiku-Entwurf, danach von Hand überarbeitet. PO hob Gold auf 2 000 und verlangte zwei Anker; Niedergestreckte über dem Korridor bis 11.27 hingenommen, Zahlen trotzdem melden.
- 11.10: Gast `team: other` (Brann), `set_terrain` mit `warn`, Wetter `ash` in Akt 2, Platzhalter-Flags `e7_order`/`e7_warned` auf `e07` umgestellt (Protokoll `burnt_slope_burnt_site.md` nennt noch `e7_order`).
- 11.5: Flags deklariert, Leutnant-Stufe überschreibt `levelOffset`, `recruit: { lt }` für Sable.
- Akt-1-Vorbilder: `scn.m1_5.outro.yaml` (E3 mit `recruit: { lt }`), `scn.m1_6.outro.yaml:108` (`priceMod`), `n2_wachturm.yaml:62` (Chronik in Truhe), Karten mit `initialEffects` (z. B. `m1_2_erlbach.yaml`, brennendes Dorf).

### Project Context Rules

- Keine Spielwerte im Code, kein sichtbarer Text im Code (Locales), Code/IDs Englisch, Konzepttexte Deutsch.
- Zufall nur aus dem Seed-RNG; Vorschau und Auflösung nutzen denselben Formelcode (eine neue `ignite`-Aktion ruft `igniteTile`, keine Kopie).
- Nie auf `main`, PR nach grüner CI.

### References

- [Source: concept/26-epics/epics/epic-11.md:1-49, 329-346]
- [Source: concept/27-ueberarbeitung/levels/s2_2_4_brandschneise.yaml; levels/abnahme/s2_2_4_brandschneise.md]
- [Source: concept/22-narrative/missionsliste-s1.md:12,24,66,75,76,86,120]
- [Source: concept/22-narrative/narrative.md:201,226,229,321,385,482,694]
- [Source: concept/22-narrative/geografie-valmora.md:84]
- [Source: concept/22-narrative/decision-log.md:77,82,83,90,98,99,103,108; concept/21-gdd/decision-log.md:100,138,162]
- [Source: content/acts/act2/{campaign,flags,units,lieutenants,haunts,chronicle}.yaml; content/world/valmora.yaml:27-32,51]
- [Source: src/core/rules/effects.ts:36-57,60-75,229-262; src/core/battle/setup.ts:140-146; src/core/ai/ai.ts:61,222,474-500; src/core/util.ts:59]
- [Source: src/core/battle/create.ts:150-206; src/core/campaign/campaign.ts:297-298; src/core/campaign/lieutenants.ts:37,150-180; src/core/campaign/aid.ts:10-13; src/core/campaign/effects.ts:60-75,105,204]
- [Source: src/content/schemaMap.ts:66-69,94,130-152,193,213; src/content/validateLevels.ts:26-35; content/core/balance.yaml:34-37,198-203; content/core/terrain.yaml]

## Offene Fragen an den Produktinhaber

- **F1 Wie gefährlich ist das Feuer?** Mit der vorhandenen Regel (25 % Ausbreitung, 2 Runden Brenndauer) erlischt der Waldbrand nach wenigen Reihen und erreicht die Schneise nie; sie wäre nur Kulisse.
  A) neue Trigger-Aktion `ignite`: eine feste Feuerfront rückt angekündigt etwa zwei Reihen je Runde vor und steht ab Runde 3 an der Westkante, ab Runde 6 an der Ostkante (planbar, kleiner Code); B) Ausbreitung und Brenndauer je Karte höher (z. B. 60 % und 3 Runden), bleibt zufällig; C) Regel bleibt, das Feuer ist Stimmung, Brann und die Schneise wirken nur in der Szene; D) A und B zusammen.
  **Vorschlag A**: das Feuer wird zur lesbaren Uhr, die Schneise rettet sichtbar das Dorf, keine zufälligen Niederlagen.
  **Bestätigt (PO 2026-11-10) umgesetzt: Vorschlag A** (Trigger-Aktion `ignite` mit `warn`; Front West R2–R4, Ost R2–R7 [ASSUMPTION], Runden nur in den `t_fire_*`-Triggern der Karte).
- **F2 Was entscheidet E7?** Die Mission rettet das Dorf am Brandhang; trotzdem soll bei „gehorchen“ Brandhang brennen, und keine Quelle sagt, wer den Befehl gibt und ausführt.
  A) Nach dem Sieg bringt Sable Dravns eigentlichen Befehl: Ihr Heimatdorf weiter oben am Hang wird zur zweiten Schneise gegen die Drachen; „warnen“ = die Truppe holt die Leute heraus, Sable geht mit; „gehorchen“ = die Truppe sieht zu, Sables Soldaten zünden, Dravns Quartiermeister geben −10 %; B) dasselbe Dorf: Dravn will das gerettete Dorf trotzdem brennen lassen; C) die Truppe soll selbst zünden; D) A, aber Dravn erscheint selbst (Halbfigur `dravn` vorhanden).
  **Vorschlag A**: passt zu `narrative.md:229,385` (Sables Heimatdorf), die Truppe macht sich bei „gehorchen“ nicht selbst die Hände schmutzig.
  **Bestätigt (PO 2026-11-10) umgesetzt: Vorschlag A** (`scn.m2_4.outro`).
- **F3 Jagd und Maelis' Angebot:** Das Grenzheer jagt die Truppe in beiden Zweigen (2-5), obwohl „gehorchen“ Dravns Gunst bringt; Maelis' Angebot ist noch ohne Form.
  A) Jagd in beiden Zweigen, weil die Truppe Grells Plünderung unter Dravns Augen gesehen hat (Zeugen); Maelis schickt einen Brief, gelesen in ihrer Stimme (Sprecher `maelis`), Rhen antwortet mit Haltung und Folgen-Karte wie in 2-1, kein neues Flag; B) wie A, aber Grell überbringt das Angebot bei seiner Flucht (Spur Dravn–Maelis wird sichtbar); C) Jagd nur bei „warnen“, bei „gehorchen“ erst nach 2-5; D) A ohne Antwort Rhens.
  **Vorschlag A**: hält die Missionsliste in beiden Zweigen ein und folgt dem Muster der Angebote aus 2-1.
  **Bestätigt (PO 2026-11-10) umgesetzt: Vorschlag A** (Brief mit Sprecher `maelis`, Entscheidung `c02` mit drei Haltungen, kein Flag).
- **F4 Sables Rolle auf dem Brett:** Sie soll zusehen, wäre aber mit Schwert und Profil `hold` sofort im Kampf und kann im Feuer stehen.
  A) ohne Waffe auf einer nicht brennbaren Lichtung, sieht nur zu; B) sie verlässt in Runde 7 nach ihrer Szene das Brett (wie eine fliehende Figur); C) sie steht außerhalb des Feuers am Nordostrand und hält Grells Leute von sich fern (darf sich wehren); D) A plus B.
  **Vorschlag D**: sie sieht zu, solange es brennt, und ist weg, bevor die Wellen der Runden 8–10 kommen; die Nachszene holt sie wieder.
  **Bestätigt (PO 2026-11-10) umgesetzt: Vorschlag D** (`items: []`, Lichtung `plain`, `t_sable` setzt `flee`).
- **F5 Gold:** Entwurf 1 600 + 900 aus Häusern + 300 Truhe + 500 Nebenziel; Akt-2-Kurve 2 000–3 000, 2-1/2-2 je 2 000.
  A) 2 000 wie 2-1/2-2; B) 2 500 (Mitte der Kurve, erste G-Karte des Akts); C) 1 600 wie Entwurf; D) 2 500 und Häuser-Gold auf je 200 senken.
  **Vorschlag B**, 11.27 stimmt am Ende ab.
  **Vorläufig umgesetzt: Vorschlag B** [ASSUMPTION] (`goldReward: 2500`).
- **F6 Chronik-Seite in der Köhlerruine:** Akt 2 erzählt, „dass die Könige beim Paktfest etwas gaben“; `a2_salzpass` erzählt schon eine Paktnacht.
  A) Id `a2_brandhang`, die Köhler hüteten eine Seite über ein Paktfest, bei dem ein König Glut aus dem Berg „zurückgab“ (Brücke zu N5, Glut unter dem Berg); B) wie A, aber die Seite erzählt, wer nach dem Fest das Feuer hütete (Vorgriff auf Brann und die Erdmagie); C) Seite erst in 11.23 schreiben, hier Platzhaltertext; D) keine Seite in 2-4, Akt-2-Seiten anders verteilen.
  **Vorschlag A**, Text per Schreib-Pipeline als Vorschlag zur Abnahme.
  **Bestätigt (PO 2026-11-10) umgesetzt: Vorschlag A** (`a2_brandhang` „Was der König zurückgab“: ein König bringt dem Berg Glut zurück, kein Verlust wie in `a2_salzpass`/`a2_mine`).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (Nachtbetrieb, Subagent der orchestrierenden Session)

### Debug Log References

### Completion Notes List

- PO-Fragen F1–F6 nicht abgewartet (Nachtbetrieb): jeweils der Vorschlag umgesetzt (F1 A, F2 A, F3 A, F4 D, F5 B, F6 A); F1–F4 und F6 bestätigt (PO 2026-11-10), F5 und das Feuertempo aus F1 bleiben `[ASSUMPTION]`; Einträge in `concept/21-gdd/decision-log.md` und `concept/22-narrative/decision-log.md`.
- Neuer Regelcode: Trigger-Aktion `ignite` (Fläche, optional `warn`), löst über `igniteTile` auf, keine eigene Zufallsquelle; Warnung über `terrainWarnings`, Schema in `schemaMap.ts`, Prüfung `validateFormat.ts`. Act-1-Basislauf unverändert (`sim:diff` ohne Wert über 0,02), Coverage-Sperrklinken grün.
- Neue Annahmen: Schwer-Zusätze h0–h5 warten (`trigger`, Radius 4), weil Brann auf Schwer sonst immer in Runde 3 fiel; a0 trägt den Truhenschlüssel; Sprecher `maelis` mit Namen „Herzogin Maelis“.
- Sim (Start expected, P = 15): Leicht 100 %, Normal 92 % (Niedergestreckte 2,27 ↑), Schwer 21 % (↓). Verkettet: Leicht 100 %, Normal 54 % (↓), Schwer 0 % – verkettet Schwer nicht gewinnbar, für 11.27 gemeldet (PO 2026-11-10: 11.27 vorgezogen). Sieg-KI öffnet die Köhlertruhe nie.
- Weltkarten-Bild `burnt_slope_burnt` vom Bild-Agenten geliefert; `valmora.yaml`, `map_places_v5.json` und `packs.yaml` waren schon verdrahtet (Breite 43 / bottom 406 = `width 3.4`, `foot [76.5, 32.4]`, passt). `pnpm art:build` nicht ausgeführt (LFS, Laufzeitbild entsteht beim Build).
- Offen: Spielbild bei 375 × 812 und Bild der Folgen-Karte (T9), Sim mit `--haunts`.
- `sim-acts.test.ts` lässt die 2-4-Karte weg (eine Schlacht dauert mehrere Sekunden), die Karte prüft `m2-4-brandschneise.test.ts`.

### File List

- `src/core/mapDefs.ts`, `src/core/battle/objectives.ts`, `src/core/battle/terrainWarn.ts` (Trigger-Aktion `ignite`)
- `src/content/schemaMap.ts`, `src/content/validateFormat.ts`, `tools/levels/sheet.ts`
- `content/acts/act2/maps/m2_4_brandschneise.yaml` (neu)
- `content/acts/act2/scenes/scn.m2_4.{intro,brann_break_west,brann_break_east,grell_battle,sable_watches,page,outro}.yaml` (neu)
- `content/acts/act2/campaign.yaml`, `content/acts/act2/chronicle.yaml`, `content/acts/act2/locales/{de,en}.names.yaml`
- `content/locales/en/act2.dialogue.yaml`, `content/locales/en/act2.chronicle.yaml`
- `tests/unit/m2-4-brandschneise.test.ts` (neu), `tests/fixtures/lab/brandschneise-2-4.yaml` (neu)
- `tests/unit/sim-acts.test.ts`, `tests/unit/act-title.test.ts`, `tests/unit/act-transition.test.ts`, `tests/unit/chronicle.test.ts`
- `concept/21-gdd/decision-log.md`, `concept/22-narrative/decision-log.md`, `concept/27-ueberarbeitung/levels/abnahme/s2_2_4_brandschneise.md`
- Weltkarten-Bild (vom Bild-Agenten geliefert, hier nur geprüft): `art/world/sites/burnt_slope_burnt.png`, `art/world/v5/burnt_slope_burnt_chatgpt.png`, `art/prompts/burnt_slope_burnt_site.md`

### Change Log

- 2026-11-10: Story umgesetzt (Karte, Szenen, E7, Chronik, Trigger-Aktion `ignite`, Tests, Lab, Abnahme); Status review.
