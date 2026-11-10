---
baseline_commit: 301be35
---
# Story 11.14: Mission 2-3 „Die Rabenweide“

Status: review

<!-- Erstellt 2026-11-09 mit gds-create-story (Stand origin/main fdb901f, nach 11.12). Offene PO-Fragen F1–F8 unten; vor dem Bau beantworten lassen (Orchestrator bündelt). Läuft parallel zu 11.13 (2-2): gemeinsame Dateien nur blockweise anfassen, vor Beginn rebasen. -->

## Story

Als Spieler
möchte ich auf dem Gestüt der Silbernen Lanze gegen Rowena kämpfen,
damit Dravns erste kleine Lüge und Rowenas Ehre sichtbar werden.

## Acceptance Criteria

1. **Karte übernommen:** `content/acts/act2/maps/m2_3_rabenweide.yaml` übernimmt den Entwurf `concept/27-ueberarbeitung/levels/s2_2_3_rabenweide.yaml` (M 22 × 26, `boss` Rowena, 9 eigene gegen 24 auf Normal, L 20 / S 28, Mittag, klar) mit Feld `design:` auf den Entwurf, `map.act = 2` (aus dem Ordner), Gelände wie im Entwurf (Aure mit drei Furten `shallows`, keine Brücke; Koppelzäune `fence` mit Lücken; Gestütshof mit Festen `F`). Alle Gegner nur mit `levelOffset` (−3…−1), Rowena über die Leutnant-Regel; keine Flieger, keine Reiter (content:check aus 11.2/11.7 grün). Furten-Regel nach Antwort auf F5.
2. **Rowena:** steht zu Fuß (`knight`) mit ihren Rittern am Gestütshof (`lieutenant: rowena`, `boss: true`), wacht erst auf, wenn jemand nah kommt, und bleibt danach im Hof (`trigger` → `guard`, Korrektur 11.10). Fällt sie auf 0 KP, ist die Mission gewonnen und sie **gibt auf** statt zu sterben – Mechanik und Szene nach Antwort auf F1. Sie kehrt in 2-8 als Leutnantin zurück (Groll, Kopfgeld wie jeder vertriebene Leutnant).
3. **Flanken:** Lanzen kommen angekündigt in Runde 3 von Osten und in Runde 5 von Westen auf dem Südufer, in Runde 7 der Ausfall aus dem Hof (Nordrand), Stärke je Schwierigkeit wie im Entwurf. Die drei Furten sind die Engstellen.
4. **Ilka:** steht im Wald am Nordostufer (`[18,11]`) auf der Gegenseite, schießt sonst vom Waldrand, und tritt nur bei, wenn sie angesprochen wird (`scn.m2_3.ilka_talk`, Sprecher nach F3). Beitrittswerte aus `content/acts/act2/units.yaml:21-31` (Stufe max(10, P−1), `steel_bow`), nicht aus dem Entwurf. Nebenziel „Ilka gewinnen“. Mit dem Abschluss von m2_3 und Ilka in der Truppe (oder gefallen) ist N4 freigeschaltet (Bedingung steht schon in `campaign.yaml:34`; angeboten wird N4 erst mit seiner Karte aus 11.20).
5. **Pferde nur Kulisse:** Keine Pferde-Einheit, keine Reit-Regel. Koppeln und Ställe zeigen die Kulisse nach F6 (Deko-Pferd aus 11.24 oder Platzhalter).
6. **Saat Rowena:** In der Nachszene lässt Rowena einen verwundeten Gefährten der Truppe versorgen, statt ihn gefangen zu nehmen (wer: F2). Dravns erste kleine Lüge wird im Text sichtbar (Inhalt: F4).
7. **Szenen:** `scn.m2_3.intro`, `scn.m2_3.outro`, `scn.m2_3.ilka_talk`, `scn.m2_3.water_hint` (Runde 2, Furten), dazu je nach F1 `scn.m2_3.rowena_battle` (Boss-Zitat) – DE und EN, jede Box ≤ 110 Zeichen, Gefährtenzeilen mit `requires: alive` und Ersatzsprecher-Kette, jeder Sprecher hat eine Halbfigur (`tests/unit/scene-view.test.ts:79-87`), Hintergrund nach F7. Antworten (falls vorhanden) tragen eine Haltung und zeigen ihre Folgen-Karte, ohne neues Flag (Muster 11.12 F1 = B) [ASSUMPTION].
8. **Knoten:** `m2_3` in `content/acts/act2/campaign.yaml:28` bekommt `pre`/`post` und `place` (F7); die Weltkarte bietet 2-3 nach 2-1 an (`mapInBuild`), Slot `raven_meadow` (`content/world/valmora.yaml:42`) bleibt.
9. **Niederlage:** Avatar oder Lucan fallen (keine Schutzfigur im Entwurf).
10. **Gewinnbar und im Korridor:** `pnpm sim` mit Optionen aus 11.4 zeigt die Karte gewinnbar und im Korridor (NFR12) an frühester (direkt nach 2-1, P = 13) und spätester Position (nach 2-2, P = 14), Ergebnis mit Zahlen im Kopfkommentar der Karte und in der Abnahme; Act-1-Basislauf bleibt identisch.
11. **Heimsuchungen:** zwei Anker (Varianten nach F8), content:check grün.
12. **Unveröffentlicht:** `act2` bleibt `released: false`; kein `pnpm content:lock`, keine Änderung an `content/released-ids.json`. Sichtprüfung über `pnpm dev:act2`.
13. **Abnahme:** Bild der Karte bei 375 × 812 im Spiel (Lautstärken 0); Abweichungen vom Entwurf in `concept/27-ueberarbeitung/levels/abnahme/s2_2_3_rabenweide.md` (neuer Abschnitt „Übernahme Story 11.14“); `pnpm check` grün.

## Tasks / Subtasks

- [x] T1 Karte anlegen (AC 1–5, 9, 11)
  - [x] `content/acts/act2/maps/m2_3_rabenweide.yaml` aus dem Entwurf: `id: m2_3_rabenweide`, `nameKey: map.m2_3_rabenweide.name`, `design:` = Entwurfsblock (title, intent, mood, phases, paths, zones, marks, notes), Kopfkommentar nach Muster `content/acts/act2/maps/m2_1_windscharte.yaml:1-10` (Entwurf, Abweichungen, Sim-Zahlen [C], Szenen).
  - [x] Gegner: `level` streichen, nur `levelOffset`. `unit.silver_lance.name` gibt es nicht – Ritter (`knight`) als `unit.lance_knight.name`, übrige als `unit.lance_squire.name` (`content/acts/act2/locales/de.names.yaml:40,43`), Figuren wie Pool `silver_lance` (`content/acts/act2/haunts.yaml:14-17`: knight → `sprite: soldier`, skirmisher → `mercenary`, marksman → `bandit_archer`; vanguard → `soldier`, healer → `cleric` wie in 2-1). Waffen: Eisen für P−3/P−2 wie Entwurf, Stahl nur, wenn die Sim es verlangt [ASSUMPTION].
  - [x] Rowena: `lieutenant: rowena`, `boss: true`, Klasse `knight` (`lieutenants.yaml:9-19`), `levelOffset: 2` nur fürs Schema (Stufe kommt aus `lieutenantLevel`, `src/core/campaign/lieutenants.ts:57-64`). Waffe: `steel_lance` wie Entwurf behalten – die Signatur `rowenas_lance` (`content/core/items.yaml:169`) filtert `lieutenantItems` aus den Kartenwaffen und ist Beute (Lehre aus 11.12, Brakka). `ai: { profile: trigger, then: guard }` (Radius kommt aus `balance.yaml` `triggerRadius.lieutenant: 5`).
  - [x] Gestütshof: `k1`, `k2` (knight, guard), `heal` (healer, support) wie Entwurf; Koppelwachen `r1`/`r3`/`r5` `then: guard`, `r2`/`r4` `then: aggressive`; Nordufer `f1–f4`, Südufer `s1–s4`, nur Schwer `h1`, `h2` wie Entwurf.
  - [x] Ilka: `char: ilka`, `team: enemy`, Klasse `marksman`, `ai: { profile: hold }`, `ignoreForRout: true`, `recruit: { by: <F3>, dialogue: scn.m2_3.ilka_talk }`; **ohne** eigene Stufe/Waffen (Entwurf: Stufe 11, `hunting_bow`) – `raiseMapChar` hebt auf P − 1, Ausrüstung aus `units.yaml` (Muster Ysolde `content/acts/act1/maps/m1_4_wolfslager.yaml:112`, Varek `n2_wachturm.yaml:72`; Jory 2-1).
  - [x] Wellen R3 (Ost, `[21,15..19]`), R5 (West, `[0,17..19]`), R7 (Nord, `[10..11,0]`) mit `announce: true` wie Entwurf.
  - [x] Dörfer `v_west`/`v_east` (je 300 Gold) als „Ställe“; Nebenziele `s_ilka` (recruit, 300 Gold) und `s_stables` (`visit_villages`, vulnerary).
  - [x] Trigger: `t_water` (`turn_start 2 player` → `scn.m2_3.water_hint`). Der Entwurfs-Trigger `t_rowena` (`unit_dies rowena`) **feuert nie**: Leutnants fliehen bei 0 KP (`gone: 'fled'`, `src/core/rules/effects.ts:130,171-176`), `unit_dies` prüft nur `gone === 'dead'` (`src/core/battle/objectives.ts:276-278`). Ersatz nach F1.
  - [x] Furten nach F5 umsetzen; ggf. Kartenhinweis in `scn.m2_3.water_hint` auf „Gepanzerte kommen nicht durch die Furt“.
  - [x] Zwei `haunts`-Anker nach F8 (Muster `m2_1_windscharte.yaml:73-87`, mit Begründung im Kommentar).
  - [x] `goldReward` nach F8 [ASSUMPTION, 11.27 stimmt ab]; `map.m2_3_rabenweide.name` in `content/acts/act2/locales/{de,en}.names.yaml`.
- [x] T2 Szenen DE/EN (AC 6, 7)
  - [x] `scn.m2_3.intro`: Ankunft an der Aure, Auftrag Dravns (Überbringer `dravn_envoy`, Halbfigur existiert seit 11.12), die kleine Lüge nach F4. Text **entwerfen und als Vorschlag markieren** (Schreib-Pipeline der Narrative).
  - [x] `scn.m2_3.water_hint` (Runde 2): Furten als Engstellen, Gepanzerte (F5).
  - [x] `scn.m2_3.ilka_talk` (Ansprechen, Sprecher nach F3, Ilka `fallback: skip`, Ersatzsprecher-Kette für Gefährtenzeilen).
  - [x] `scn.m2_3.outro`: Rowena gibt auf (F1), lässt den Verwundeten versorgen (F2), Wahrheit hinter Dravns Lüge (F4); Rowena spricht (Halbfigur `rowena.png` vorhanden), Ritter optional als `lance_rider` (Halbfigur vorhanden). Ilka nur unter `requires: alive`.
  - [x] Optional nach F1: Boss-Zitat `scn.m2_3.rowena_battle` (Kartenfeld `quote`, Muster Osric `m1_4_wolfslager.yaml:108`). **Achtung** Rowenas Fluchtzeile `flee_2` in `content/acts/act2/scenes/scn.lt.rowena.yaml` sagt wörtlich „… Nicht, wann er aufgibt.“ – widerspricht „gibt auf“ (F1).
  - [x] EN in `content/locales/en/act2.dialogue.yaml` (Block 2-3; 11.13 schreibt parallel den Block 2-2 – rebasen); Box ≤ 110; Ersatzsprecher-Prüfung grün.
- [x] T3 Knoten verdrahten (AC 8)
  - [x] `campaign.yaml:28`: `pre: scn.m2_3.intro`, `post: scn.m2_3.outro`, `place: <F7>`; nur diese Zeile und den Kommentar „vorläufige Karten-Id“ anfassen (11.13 ändert die Zeile m2_2).
  - [x] Ortsbild nach F7: bei neuem Bild `rabenweide` in `ACT2_LOCATIONS` (`tools/art/build.py:49`) und `locations/rabenweide.webp` in `content/packs.yaml` (act2-Block, `:70-78`), Prompt und Prüfung `art/prompts/loc_rabenweide.md`, Bild per ChatGPT über Claude in Chrome nach `licensing.md` §6; Abnahme-Zeile in `concept/23-art-direction/abnahme/akt2-ortsbilder.md`.
- [x] T4 Simulation und Abstimmung (AC 10)
  - [x] `pnpm sim --campaign act2 --start expected --node m2_3 --order m2_3 --runs 50` (früheste Position) und ohne `--order` (nach 2-2, späteste), alle drei Schwierigkeiten, mit und ohne `--haunts`; Varianten (Furten, Ilka feindlich/still, R7 ohne Plänkler) per `--map-file` / `--set`, `--json` + `pnpm sim:diff`. Solange 2-2 keine Karte hat, überspringt die Sim m2_2 (`tests/unit/sim-acts.test.ts:45,62-65`) – späteste Position dann per `--position`.
  - [x] Prüfen, ob `autoplay` Rowena als Boss erreicht, wenn Gepanzerte nicht über die Furt kommen, und ob Niedergestreckte im Korridor 0,4–1,3 liegen; Abweichungen nicht still ändern, als PO-Frage melden (Muster 11.12).
  - [x] Act-1-Basislauf `pnpm sim --campaign act1 --runs 50 --seed 1` unverändert.
- [ ] T5 Ansicht und Abnahme (AC 13)
  - [ ] `git lfs pull`, `pnpm levels` (Atlas), Spielbild bei 375 × 812 über `pnpm dev:act2` (Lautstärken 0), Lab-Szenario `tests/fixtures/lab/rabenweide-2-3.yaml`. (Atlas und Lab erledigt; Spielbild offen: Browser-Ansicht verborgen)
  - [x] Abschnitt „Übernahme Story 11.14“ in `levels/abnahme/s2_2_3_rabenweide.md` mit allen Abweichungen (Tabelle unten, Sim-Zahlen, Antworten F1–F8).
- [x] T6 Tests (AC 2–8, 11)
  - [x] `tests/unit/m2-3-rabenweide.test.ts` nach Muster `tests/unit/m2-1-windscharte.test.ts`: Knoten/Ziel `boss`, 20/24/28 Gegner, Stufen auf P (Gegner −3…−1, Rowena Leutnant-Stufe), Wellen R3 Ost/R5 West/R7 Nord, Rowena bei 0 KP → Sieg ohne Tod (`gone: 'fled'`) und Aufgabe-Szene nach F1, Gepanzerte an der Furt nach F5, Ilka tritt nur bei Ansprechen bei (Stufe P − 1, `steel_bow`), Wasserhinweis R2 einmal, Nachszene mit Rowena und dem Verwundeten nach F2, Lüge-Zeile, Gold.
  - [x] Bestehende Tests nachziehen, die „m2_3 ist Platzhalter“ annehmen: `tests/unit/act2-campaign-order.test.ts:20` (m2_3 → Karte statt Entwurf), `:255-258` (Paar-Test arbeitet mit einer Probekarte für m2_2 und erwartet m2_3 als Platzhalter – umstellen, ohne die Aussage zu verlieren), `tests/unit/act-title.test.ts:68` („only m2_1 has its map so far“), `tests/unit/sim-acts.test.ts:45,62-65` (m2_3 nicht mehr übersprungen). Mit 11.13 abstimmen: wer zuerst merged, passt an, der andere rebased.
  - [x] `tests/unit/act2-drafts.test.ts:92` grün halten.
- [x] T7 Abschluss
  - [x] Neue Entscheidungen (F1–F8) in `concept/22-narrative/decision-log.md` (Szenen, Saat, Lüge), `concept/21-gdd/decision-log.md` (Aufgabe-Mechanik, Furten, Gold) bzw. Art-Log (Ortsbild, Pferd), nie in `01-decisions.md`.
  - [x] Figuren-Bestand nur, falls F6/F7 neue Bilder/Modelle bringen.
  - [x] `pnpm check` grün; **kein** `released: true`, **kein** `content:lock`.

## Dev Notes

### Ausgangslage (Stand 2026-11-09, origin/main fdb901f)

- Knoten `m2_3` (`content/acts/act2/campaign.yaml:28`): `map: m2_3_rabenweide, titleKey: node.m2_3.title, requires: [{ completed: m2_1 }], merchantTier: 1` – **ohne `place`**, ohne `pre`/`post`. `node.m2_3.title` = „Die Rabenweide“ existiert. N4 (`:34`) hängt schon an `completed: m2_3` + Ilka alive/dead.
- Positionsstufe: `positionLevel.base: 12`; m2_3 direkt nach 2-1 → P = 13, nach 2-2 → P = 14 (`tests/unit/position-level.test.ts:84-86`). Der Entwurf rechnet mit P = 12 (Stufen 9–11) – `levelOffset` gleicht das aus, `level` fällt weg.
- Rowena (`content/acts/act2/lieutenants.yaml:9-19`): `knight`, Fraktion `silver_lance`, Signatur `rowenas_lance` (Mt 9, legendär, Bild vorläufig `wing_lance`), Groll-Skills `lance_charge`/`silver_resolve`/`stud_ward` (`content/core/skills.yaml:82-84`), Zeilen `scn.lt.rowena`. Porträt `art/mockups/characters-s1/rowena.png` vorhanden (keine Stimmungsvarianten – nicht nötig). Modell `art/models/units/rowena.glb` ist das alte (Helm auf dem Kopf, `figuren-bestand.md:146` ❌); die neue Brettfigur kommt mit 11.25 (backlog), die Karte geht mit dem alten Modell live.
- **Aufgeben = Leutnant-Flucht:** Jeder gegnerische Leutnant flieht bei 0 KP statt zu sterben (`fleesAtZero`, `src/core/rules/effects.ts:130`; `knockOut` `:171-176`: Beute, `gone: 'fled'`, Ereignis `fled`). Das Boss-Ziel zählt `fled` als Sieg (`src/core/battle/objectives.ts:56-58`). Die Missionsliste sagt ausdrücklich „Rowena flieht als Leutnant“ (`missionsliste-s1.md:122`). Ein `unit_dies`-Trigger feuert für sie nie; es gibt keinen Trigger-Typ „Leutnant geflohen“ (`src/content/schemaMap.ts:102-111`). Muster Rückzug mitten im Kampf: Hask `m1_6_paktwacht.yaml:192-198` (`hp_below 40` → Zeile `onBoard` + `set_ai flee`), Morra `m1_8`.
- Ilka (`content/acts/act2/units.yaml:21-31`): `marksman`, Stufe 10, `still_hunter`, `steel_bow` + vulnerary, Supports Sable/Brann, `joins: m2_3`. Halbfigur `ilka.png` und Modell `ilka.glb` vorhanden. Feindliche Gefährtin per `recruit` ist Akt-1-Muster (Ysolde, Varek).
- **Furten und Gepanzerte:** `shallows` kostet foot 3, `armored: null` (`content/core/terrain.yaml:14`). `vanguard`, `bulwark`, `breaker` und `knight` sind `armored` (`classes.yaml:57-63` u. a.). Die Aure hat im Entwurf keine Brücke: Rowenas Ritter und die Koppel-Vorkämpfer bleiben im Norden (gewollt, Korrektur 11.10) – **aber auch die eigenen Vorkämpfer (Brenna, Tobin, Grosk und ihre Profi-Wege) kommen nie ans Nordufer.** Avatar (`tactician`) und Lucan (`captain`) sind `foot`. Die Entwurfsnotiz „Vorkämpfer an Furt und Zaunlücke“ ist damit nur am Südufer bzw. für Gegner wahr → F5.
- Silberne Lanze: Namen `unit.lance_knight.name` „Lanzenritter“, `unit.lance_squire.name` „Lanzenknecht“, `unit.lance_rider.name` „Lanzenreiter“ (Sprecher aus 2-1, Halbfigur `lance_rider.png`), Bote `dravn_envoy` (Halbfigur). Klasse `knight` hat keine eigene Figur → `sprite: soldier` wie im Pool (Platzhalter aus 11.7; Ritter der Lanze bleiben laut F2 vom 2026-11-06 Platzhalter).
- Kulisse: Galerie-Modelle `paddock_straight/_corner/_gate`, `stable_a`, `hay_a`, `barn_a` liegen als GLB unter `art/models/props/` (Gruppe `map-assets/groups/village.yaml:76-91`), sind aber nicht als Gelände/Prop verdrahtet; `fence` zeichnet das vorhandene Zaun-Modell. **Ein Pferde-Modell gibt es nicht** (11.24 backlog, Deko-Pferd „in Blender ohne Reittier-Pipeline“, `figuren-bestand.md:33`). `propVariants` (`schemaMap.ts:230`) ersetzt nur Modelle auf Feldern mit Prop (Haus, Fels, Baum, Lodge) → F6.
- Ortsbild: In `art/mockups/locations-s1/` gibt es **kein** `rabenweide.png`, `ACT2_LOCATIONS` (`tools/art/build.py:49`) kennt es nicht; die Vorzieh-Liste vom 2026-11-07 (Epic 11 Z. 13) hat 2-3 nicht erfasst → F7.
- Flags: `content/acts/act2/flags.yaml` hat nichts für 2-3 (e05–e08, `joined_sable`, `maelis_ledgers`, `chronicle_read`, `m2_2_seal`). In 2-3 liegt keine Entscheidung (E5 wandert nach 2-5; `narrative.md:701` ist veraltet). 2-8 lässt Rowena bedingungslos zögern (Epic 11.19) – die Saat braucht kein Flag.
- Bedingungen kennen kein „in diesem Kampf niedergestreckt“ (`src/content/schemaConditions.ts:18-38`); ein dynamischer Verwundeter wäre Code-Arbeit → F2.

### Abweichungen Entwurf ↔ Spielformat (alle in die Abnahme-Datei)

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_2_3_rabenweide` | `m2_3_rabenweide` | Karten-Id des Knotens (`campaign.yaml:28`) |
| `scn.s2_3.*` | `scn.m2_3.*` | Szenen-Schema `scn.<knoten>.*` |
| `unit.silver_lance.name` | `unit.lance_knight.name` / `unit.lance_squire.name` | Schlüssel existiert nicht; Pool `silver_lance` |
| `level` + `levelOffset` | nur `levelOffset` | 11.2, content:check; Entwurf rechnet mit P = 12 |
| Rowena Stufe 14, `levelOffset: 2` | Leutnant-Stufe (`lieutenantLevel`) | 11.5; Boss-Regel P+2 gilt für Leutnant-Bosse nicht |
| Rowena `steel_lance` | bleibt, `rowenas_lance` nur Beute | Signatur filtert sich aus den Kartenwaffen (11.12) |
| Trigger `t_rowena` `unit_dies` → `rowena_yields` | nach F1 (Nachszene / `hp_below` / neuer Trigger) | feuert nie: Leutnants fliehen bei 0 KP |
| Ilka Stufe 11, `hunting_bow` | Werte aus `units.yaml` (P − 1, `steel_bow`) | 11.5; PO 2026-11-09 bei Jory |
| Ilka `by: any` | nach F3 | |
| „Vorkämpfer an der Furt“ | Gepanzerte können nicht in `shallows` | Regel `terrain.yaml:14`; F5 |
| Notizen „Leutnant rowena fehlt“, „Modelle Koppel, Stall, Gestüt fehlen“ | Rowena erledigt (11.5); Modelle als GLB vorhanden, nicht verdrahtet (11.24) | |
| `goldReward: 1200` | nach F8 | Goldkurve Akt 2 2 000–3 000 |
| keine Heimsuchungs-Anker | zwei Anker nach F8 | Regel aus 2-1 (PO 2026-11-09) |

### Szenen-Inhalt: Quellenlage

- Missionsliste `concept/22-narrative/missionsliste-s1.md:74`: Gestüt der Silbernen Lanze an der Aure; **Dravn-Strang**: „Die Krone verweigert seinem Heer die Pferde, also holt er sie sich über die Truppe“; Rowena verteidigt ihr eigenes Gestüt; Ilka als Fährtenleserin für die Pferdezüge angeheuert, wechselt die Seite; **Saat Rowena**: versorgt einen verwundeten Gefährten, statt ihn gefangen zu nehmen; „Erste kleine Lüge Dravns“. `:122` Rowena flieht als Leutnant, drei Saat-Szenen (2-3, 2-8, Ende Kronfeld). `:85` N4 nach 2-3.
- Widerspruch: `narrative.md:203` ordnet 2-3 dem Seraphine-Strang zu („Ihr Strang (2-2, 2-3) … sät Zweifel“), Missionsliste und Epic dem Dravn-Strang. **Es gilt Epic/Missionsliste** (Artefakt-Regel, Abgrenzung in Epic 11 Z. 5). Die Lüge selbst ist nirgends ausformuliert → F4. Dravns große Lüge (Brandschneise) platzt erst in 2-4 – die kleine darf sie nicht vorwegnehmen.
- `narrative.md:156,339,362`: Lucan stammt aus einem Ritterhaus, das der Krone dient, und wurde von Dravn im Grenzkrieg verheizt – möglicher Bezug Rowena ↔ Lucan (F2), ohne den Staffel-2-Strang aufzulösen.
- `narrative.md:228`: Ilka (27), Schütze, Jägerclan der Eisenmark, wortkarg, liest Spuren. `scn.lt.rowena`: „Für Aldric und die Silberne Lanze! Das Gestüt hält.“
- `geografie-valmora.md:19` Aure als geteilte Lebensader; Rabenweide selbst steht nur in der Ortstabelle der Missionsliste (`:23`) und auf der Weltkarte (`valmora.yaml:42`, Kanten zu `aure_gorge`, `kronfeld`, `kontor`, `silverspring`).
- Entwurf `design.intent`: „Rowena verteidigt ihr eigenes Gestüt, das macht sie greifbar. Dravn holt sich hier die Pferde, die die Krone ihm verweigert.“ Stimmung: heller, kühler Herbstmittag, goldene Weiden, weiße Koppelzäune, Schieferdächer, Banner der Lanze.

### Was nicht angefasst wird

- `content/packs.yaml` `released` (bleibt false; nur der Ortsbild-Eintrag nach F7), `content/released-ids.json`, `src/persistence/save.ts`: kein Formatwechsel, keine Migration/Fixture.
- Zeile `m2_2`, Karte/Szenen von 2-2 und das Flag `m2_2_seal` (Story 11.13 parallel).
- `content/acts/act2/scenes/scn.lt.rowena.yaml` nur, wenn F1 die Fluchtzeile ändert (sie gilt auch für 2-8).
- Rowenas Brettfigur (11.25), Galerie-Modelle (11.24) außer nach F6, `concept/01-decisions.md` (eingefroren), `sprint-status.yaml` nur den eigenen Eintrag.

### Testing

- `pnpm check` (lint inkl. Typecheck, test, content:check, build mit Bundle-Budget).
- Kampflage mit `pnpm lab rabenweide-2-3` (`--forecast`, `--path ilka x,y`, `--enemy`), in Vitest `labState`; das Lab spielt Akt-2-Karten seit 11.12 in Akt 2 (`src/lab/scenario.ts`).
- Vitest-Timeouts: Datei allein laufen lassen, nicht Worker reduzieren (AGENTS.md).

### Previous Story Intelligence (11.12, gemergt als #175)

- `pnpm sim m2_x` ohne `--campaign act2` geht nicht – immer `--campaign act2 --start expected` (+ `--node`, `--order`).
- Leutnant-Signaturwaffe auf der Karte nicht angeben: sie filtert sich aus `lieutenantItems`; normale Stahlwaffe behalten.
- Gefährten auf der Karte nur mit `char:` ohne Stufe/Waffen; `raiseMapChar` hebt auf P − 1.
- Jeder Sprecher braucht eine Halbfigur (`scene-view.test.ts`); Erzähltext mit wörtlicher Rede war in der Abnahme zu wenig – neue Sprecher bekommen ein Bild per ChatGPT (Protokoll `art/prompts/<id>.md`). Für 2-3 reichen voraussichtlich `rowena`, `ilka`, `lance_rider`, `dravn_envoy`, Gefährten.
- PO setzte nach der Abnahme: Gold auf die Akt-2-Kurve (2-1: 2 000), zwei Heimsuchungs-Anker je Karte, Niedergestreckte über Korridor bleiben bis 11.27, aber gemeldet.
- Tests, die „Akt 2 hat nur Karte X“ annehmen, mussten nachgezogen werden (`act-title`, `act-transition`, `scenery`, `sim-acts`) – hier erneut, siehe T6.
- Szenen-Entwurf per Subagent, danach von Hand: Floskeln raus, Kettenzeilen sprecherneutral, Leutnant-Formel nicht doppelt zur Begegnungszeile (`scn.lt.rowena` `first`).
- Lektions-/Hinweis-Trigger lieber an `unit_enters` als an feste Runden, wenn es um einen Ort geht (F3 in 11.12) – für `water_hint` erwägen (Furtfelder statt R2) [ASSUMPTION].

### Project Context Rules

- Keine Spielwerte im Code, kein sichtbarer Text im Code (Locales), Code/IDs Englisch, Konzepttexte Deutsch.
- Zufall nur aus dem Seed-RNG; Vorschau und Auflösung nutzen denselben Formelcode.
- KI-Bilder nur nach `concept/23-art-direction/licensing.md` §6.
- Nie auf `main`, PR nach grüner CI.

### References

- [Source: concept/26-epics/epics/epic-11.md:1-49, 316-327, 405-410 (2-8 Saat Rowena), 470-498 (11.24, 11.25)]
- [Source: concept/27-ueberarbeitung/levels/s2_2_3_rabenweide.yaml; levels/abnahme/s2_2_3_rabenweide.md (Korrektur 11.10)]
- [Source: concept/22-narrative/missionsliste-s1.md:23,74,85,120,122]
- [Source: concept/22-narrative/narrative.md:63,156,199-205,228,243,339,362]
- [Source: concept/23-art-direction/figuren-bestand.md:10,33,57,142-150]
- [Source: content/acts/act2/{campaign,flags,units,lieutenants,haunts}.yaml; scenes/scn.lt.rowena.yaml; maps/m2_1_windscharte.yaml]
- [Source: src/core/rules/effects.ts:130,161-176; src/core/battle/objectives.ts:56-58,276-278; src/core/campaign/lieutenants.ts:57-64,86-110]
- [Source: content/core/terrain.yaml:14,44; content/core/classes.yaml:57-63,612-628; content/core/items.yaml:169; content/core/skills.yaml:46,82-84]
- [Source: tools/art/build.py:49; content/packs.yaml:70-78; content/world/valmora.yaml:42]
- [Source: _bmad-output/implementation-artifacts/11-12-mission-2-1-wind-ueber-der-eisenmark.md]

## Offene Fragen an den Produktinhaber

**Entschieden (Marvin, 2026-11-09, über die orchestrierende Session):** F1 = A (Leutnant-Flucht, die Nachszene erzählt die Aufgabe, `flee_2` umformulieren), F2 = A (Lucan wird versorgt), F3 = A (jede Figur spricht Ilka an), F4 = A („Die Krone hat die Pferde längst zugesprochen“, Rowena deckt es auf), **F5 = C** (ein Steg in der Mitte über die Aure, damit Gepanzerte ans Nordufer kommen; keine Regeländerung), **F6 = D** (nur die vorhandenen Koppel- und Stall-Modelle verdrahten, ohne Pferd), F7 = A (neues Ortsbild `rabenweide` per ChatGPT), F8 = A (2 000 Gold, Anker `rout` und `defend`). Die Optionen unten bleiben zur Herleitung stehen.

- **F1 Wie „gibt auf“ mechanisch geht.** Rowena flieht als Leutnantin bei 0 KP automatisch (Sieg, Groll, Kopfgeld, Fluchtzeile); ein „stirbt“-Trigger feuert nie, und ihre Fluchtzeile `flee_2` sagt „… Nicht, wann er aufgibt.“
  A) Leutnant-Flucht wie gebaut, die Aufgabe erzählt die Nachszene; `flee_2` umformulieren, sodass sie auch in 2-8 passt (kein Code). B) Wie Hask: unter X % KP ruft sie mitten im Kampf die Aufgabe (Zeile auf dem Brett), legt die Waffe nieder, Sieg sofort – braucht eine neue Wirkung „Boss gibt auf“ (Code). C) Neuer Trigger „Leutnant geflohen“, damit eine Szene noch auf dem Brett spielt, bevor der Sieg kommt (Code). D) A, dazu eine eigene einmalige Aufgabe-Zeile nur für 2-3 statt der Fluchtzeile (kleiner Code).
  **Vorschlag A**: deckt sich mit „Rowena flieht als Leutnant“ (Missionsliste) und braucht keinen Code; die Ehre zeigt sich in der Nachszene.
- **F2 Welcher verwundete Gefährte wird versorgt?** Bedingungen kennen kein „in diesem Kampf niedergestreckt“.
  A) Lucan (immer dabei; sein Ritterhaus dient der Krone, Rowena erkennt das Grün – ohne den Staffel-2-Strang aufzulösen). B) Erster lebender aus einer Kette (z. B. Brenna → Tobin → Mira → Fenn, Rest Lucan) mit `requires: alive`. C) Wer in diesem Kampf zuletzt niedergestreckt war (neue Bedingung, Code). D) Ein namenloser Söldner des Aschenbanners, nur erzählt.
  **Vorschlag A**: verlässlich, stärkster Bezug (Krone, Dravn, Lucans Haus), keine Ersatzlogik nötig.
- **F3 Wer kann Ilka ansprechen?** Akt-1-Muster nennt feste Sprecher (Ysolde: Avatar, Varek: Lucan), Jory in 2-1 `any`.
  A) jede eigene Figur (`by: any`, Entwurf). B) nur Rhen. C) Rhen oder Lucan. D) jede Figur, mit eigener Zeile, wenn Mira (Schützin) spricht.
  **Vorschlag A**: Entwurf, gleich wie Jory; Ilka steht weit draußen am Nordostufer, ein fester Sprecher macht den Weg zäh. Werte wie bei Jory aus `units.yaml` (P − 1, `steel_bow`).
- **F4 Was ist Dravns erste kleine Lüge?** Die Quellen nennen nur „Die Krone verweigert die Pferde“ und „erste kleine Lüge“.
  A) Dravn sagt, die Krone habe die Pferde dem Grenzheer längst zugesprochen, die Truppe hole sie nur ab; Rowena sagt in der Nachszene, dass die Krone sie verweigert hat. B) Dravn sagt, nur Knechte bewachen das Gestüt; dort steht Rowena mit ihren Rittern. C) Dravn nennt die Pferde Schutz gegen die Drachen; in Wahrheit braucht er sie für seinen Feldzug. D) A und B zusammen.
  **Vorschlag A**: die Lüge wird durch Rowenas Ehrlichkeit sichtbar (Ziel der Story) und nimmt die große Lüge (2-4) nicht vorweg.
- **F5 Furten und Gepanzerte.** `shallows` sperrt `armored`; ohne Brücke kommen auch die eigenen Vorkämpfer (Brenna, Tobin, Grosk) nie ans Nordufer zu Rowena.
  A) So lassen: Gepanzerte halten das Südufer gegen die Flanken R3/R5, der Hinweis in Runde 2 sagt es deutlich. B) Die mittlere Furt (Straße) wird für Gepanzerte begehbar (eigenes Gelände `ford`, teuer) – Regeländerung in `terrain.yaml`. C) Eine schmale Brücke/Steg an der Mitte, Furten West/Ost bleiben. D) A, aber den Aufstellungs-Hinweis „Gepanzerte kommen nicht über den Fluss“ schon vor dem Kampf zeigen (Briefing-Zeile).
  **Vorschlag D**: hält die Entscheidung aus 11.10 (Ritter bleiben im Hof), gibt der Aufstellung eine echte Wahl; per Sim prüfen.
- **F6 Pferde und Koppeln auf dem Brett.** Ein Pferde-Modell gibt es nicht (11.24 backlog); Koppel-/Stall-Modelle liegen nur als GLB vor.
  A) Live mit Zaun und Kulissenhäusern, Pferd und Koppeln kommen mit 11.24 (Epic erlaubt Platzhalter). B) Deko-Pferd in dieser Story in Blender bauen und als Requisite verdrahten (zieht einen Teil von 11.24 vor). C) Platzhalter-Requisite (Heu, Stall) auf einigen Koppelfeldern. D) Nur die Koppel-Modelle jetzt verdrahten, Pferd später.
  **Vorschlag A**: die Story bleibt bei Karte und Szenen, Pferde sind ohnehin nur Kulisse.
- **F7 Ort-Id und Ortsbild.** m2_3 hat kein `place`, ein Bild `rabenweide` fehlt (2-3 fehlte in der Vorzieh-Liste vom 2026-11-07).
  A) Neues Ortsbild `rabenweide` per ChatGPT (Protokoll `loc_rabenweide.md`, in `ACT2_LOCATIONS` und packs). B) Vorhandenes Bild leihen (z. B. `kronfeld`, Aure-Schwemmland) bis später. C) Ohne `place` (Fallback `defaultPlace: grauwacht`).
  **Vorschlag A**: die gemeinsame Regel verlangt ein eigenes Ortsbild ohne Platzhalter.
- **F8 Gold und Heimsuchungs-Anker.** Entwurf 1 200 Gold (+ 600 Dörfer, + 300 Ilka); 2-1 steht auf 2 000.
  A) 2 000 wie 2-1, Anker `rout` (Südweide) und `defend` (Gestütshof). B) 2 200 (zweite Mission, etwas mehr), Anker `rout` und `treasure` (Koppeln). C) 2 000, Anker `rout` und `boss` (Hof). D) Entwurf 1 200 lassen, Abstimmung in 11.27.
  **Vorschlag A** [ASSUMPTION]: Kurve 2 000–3 000, die Paare 2-2/2-3 dürfen in beliebiger Folge kommen und sollten gleich zahlen; zwei verschiedene Anker-Varianten als 2-1.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (Subagent der orchestrierenden Session, gds-dev-story), 2026-11-09/10

### Debug Log References

- `pnpm sim m2_3_rabenweide --campaign act2 --start expected --runs 50 --difficulty <d> [--order m2_3]` (Zahlen in `levels/abnahme/s2_2_3_rabenweide.md`, Abschnitt „Übernahme Story 11.14“)
- `pnpm sim --campaign act1 --runs 50 --seed 1 --json` auf 301be35 und jetzt, `pnpm sim:diff`: kein Wert über 0,02 bewegt (src/ geändert, nur Darstellung und Schema)

### Completion Notes List

- Karte `m2_3_rabenweide` aus dem Entwurf mit F1–F8; Rowena `trigger` braucht ein eigenes `radius: 5` (der Standard ist 3; `triggerRadius.lieutenant` gilt nur für Heimsuchungen – Dev-Notiz der Story war ungenau).
- F5 = C: Steg `footbridge` auf der Straße [10,12]–[10,13]; die mittlere Furt bleibt beidseits (x 9, 11).
- F6 = D: neue Gelände `paddock`, `paddock_gate` (Werte wie `fence`), Renderer wählt `paddock_straight/_corner/_gate` nach den Nachbarn (`wallKit.ts paddockPiece`); Hausvarianten `stable_a` (`wide: true`, zwei Felder, steht zwischen Feld und Ostnachbar), `barn_a`, `hay_a` mit Gewicht 0, per `propVariants` im Hof; Galerie `ships: true`, Modelle im Paket act1 wie die Herbstmodelle.
- F7 = A: `rabenweide` in `ACT2_LOCATIONS`, `locations/rabenweide.webp` im Paket act2, `place`/`background`; Abnahme-Zeile in `akt2-ortsbilder.md`.
- Szenen intro, water_hint, ilka_talk, outro (DE/EN), kein Boss-Zitat (F1 = A); `flee_2` DE/EN umformuliert.
- A1 Steg-Lage auf der Straße; A2 Koppeltore geschlossen in der Nordlinie, Lücken offen; A3 `defend`-Anker 5 Runden; A4 Lucan ist in der Nachszene immer verwundet.
- Tests: `m2-3-rabenweide.test.ts` (neu), `wall-kit` (Koppelstücke), `look` (Zwei-Feld-Modell), nachgezogen `act-title`, `act-transition`, `sim-acts` (Timeout 45 s mit Begründung), `act2-campaign-order` (Kommentar).
- Balancing: Schwer über dem Korridor (Sieg 82/92 %, Niedergestreckte 2,49/1,36), nicht weggetunt (11.27).
- Offen: Spielbild 375 × 812 (Browser-Ansicht während der Arbeit verborgen).

### File List

- content/acts/act2/maps/m2_3_rabenweide.yaml (neu)
- content/acts/act2/scenes/scn.m2_3.intro.yaml, scn.m2_3.water_hint.yaml, scn.m2_3.ilka_talk.yaml, scn.m2_3.outro.yaml (neu)
- content/acts/act2/scenes/scn.lt.rowena.yaml
- content/acts/act2/campaign.yaml, content/acts/act2/locales/de.names.yaml, en.names.yaml
- content/locales/en/act2.dialogue.yaml
- content/core/terrain.yaml, content/core/render.yaml, content/core/handbook.yaml, content/core/locales/de.names.yaml, en.names.yaml
- content/packs.yaml
- src/render/board/wallKit.ts, src/render/board/boardProps.ts, src/core/renderDefs.ts, src/content/schemaRender.ts, src/content/validateLook.ts
- tools/art/build.py, tools/levels/sheet.ts
- concept/23-art-direction/map-assets/groups/village.yaml, concept/23-art-direction/abnahme/akt2-ortsbilder.md, concept/23-art-direction/abnahme/akt2-orte-rabenweide.jpg (neu)
- concept/27-ueberarbeitung/levels/abnahme/s2_2_3_rabenweide.md
- tests/unit/m2-3-rabenweide.test.ts (neu), tests/fixtures/lab/rabenweide-2-3.yaml (neu)
- tests/unit/wall-kit.test.ts, look.test.ts, act-title.test.ts, act-transition.test.ts, sim-acts.test.ts, act2-campaign-order.test.ts

### Change Log

- 2026-11-10: Story 11.14 umgesetzt (Karte, Szenen, Koppel-/Stallmodelle, Ortsbild, Tests, Sim); Status review, Spielbild offen.
