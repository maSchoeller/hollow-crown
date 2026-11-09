---
baseline_commit: 3aa069b
---
# Story 11.17: Mission 2-6 „Gold für Banditen“ und Entscheidung E6

Status: ready-for-dev

<!-- Erstellt 2026-11-09 mit gds-create-story (Nachtbetrieb, PO schläft): offene Punkte als [ASSUMPTION] mit der empfohlenen Option, gesammelt unter „Offene Fragen an den Produktinhaber“. Gestapelt auf Story 11.16 (Branch claude/story-11-16-mission-2-5, noch nicht gemergt). -->

## Story

Als Spieler
möchte ich auf Krähenholm beweisen, dass das Gold der Banden aus Dravns Kasse über Maelis floss,
damit beide Spuren zusammenlaufen.

## Acceptance Criteria

1. **Karte übernommen:** `content/acts/act2/maps/m2_6_kraehenholm.yaml` übernimmt den Entwurf `concept/27-ueberarbeitung/levels/s2_2_6_kraehenholm.yaml` (M 22 × 26, Abend, `rout`, 10 eigene gegen 28 auf Normal, L 24 / S 32) mit Feld `design:` auf den Entwurf, `map.act = 2`, Plateau (`terrace`, Stufe 1) und Felsnase (`crag`, Stufe 2) aus dem Gelände, Treppen/Rampe wie im Entwurf. Gegner nur mit `levelOffset` (−3…−2, Leutnants über die Leutnant-Regel), keine Flieger, keine Reiter (content:check grün).
2. **Gezeiten:** Zu Beginn der Spielerphase von Runde 4 spielt `scn.m2_6.ebb` und der Kanal `rect [16,8,18,15]` wird `sand` (Sandbank); in Runde 8 spielt `scn.m2_6.flood_warn` und die Felder sind als bedroht markiert (`warn: true`); zu Beginn von Runde 9 sind sie wieder `river`. Besetzte Felder bleiben nach der bestehenden `set_terrain`-Regel (niemand ertrinkt).
3. **Klippenpfad:** Vorhut (`guard`) an der Rampe `[8,15]`, Schützen (`hold`) auf dem Plateau.
4. **Sable oder Hauptmann:** Auf der Felsnase `[8,12]` steht genau eine Figur: ohne `e07: warn` Sable (`lieutenant: sable`), mit `e07: warn` der Hauptmann des Grenzheers (`unit.border_captain.name`, duelist, `steel_sword`, P + 1, kein Leutnant), wie 2-5. Auch ohne gesetztes `e07` steht Sable. Beide tragen den Truhenschlüssel (`door_key`, `drops`).
5. **Grell:** Leutnant `grell` am Schiff in der Nordbucht (`[13,5]`, `guard`); zwei Leutnants bei `rout`, beide fliehen bei 0 KP (Leutnant-Regel).
6. **Wellen:** angekündigt R3 (Boote West, 2), R6 (vom Schiff, 2), R8 (Boote Ost, 2), Stufen P−2.
7. **Nell:** steht als Gast (`team: other`, `guest: true`) im Nordwesten `[3,5]` und tritt nur bei, wenn eine eigene Figur sie anspricht (`scn.m2_6.nell_talk`); Nebenziel „Nell gewinnen“. Werte nach `units.yaml` (`nell`, P − 1).
8. **Gold als Beweis:** Truhe `c_gold` auf der Felsnase `[9,11]`; betritt eine eigene Figur die Felsnase, spielt `scn.m2_6.gold_proof` (Dravns Eisenmark-Prägung). **Nach E7 `warn` belastet Sable Dravn** in dieser Szene (aus der Truppe); sonst erkennt Lucan die Prägung.
9. **Niederlage:** Avatar oder Lucan fallen (keine Schutzfigur laut Entwurf).
10. **Szenen:** `scn.m2_6.intro`, `scn.m2_6.outro`, `scn.m2_6.nell_talk`, `scn.m2_6.ebb`, `scn.m2_6.flood_warn`, `scn.m2_6.gold_proof`, `scn.m2_6.burnt_village` in DE und EN, jede Box ≤ 110 Zeichen, Gefährtenzeilen mit `requires: alive` und Ersatzsprecher-Kette, Sprecher ohne Halbfigur nur als Erzähltext, Hintergrund `kraehenholm`. **Lagewechsel:** Maelis lässt die Truppe fallen (Brief aus Grells Kajüte in ihrer Stimme, Halbfigur `maelis`).
11. **Beat 9:** Nur bei `e07: warn` spielt `scn.m2_6.burnt_village` auf dem Rückweg (nach der Nachszene): ein von Drachenschatten verbranntes Dorf. Bei `obey` (Brandhang brannte) oder ungesetztem `e07` nicht – nie zwei brennende Dörfer. Mechanik siehe F1.
12. **E6 in der Nachszene (nur mit Varek):** Dravns Bote (`dravn_envoy`) bietet Varek die Begnadigung im Heer an. Wahlzeile mit Titel, jede Antwort mit Haltung und `summary`. `pardon` → `setFlag { e06: pardon }`, `leave: varek`; `stay` → `setFlag { e06: stay }`, `grudge { lt: sable, delta: -1 }`. Ohne Varek in der Truppe entfällt E6 ohne Szene (keine Boten-/Varek-Zeile, keine Wahl).
13. **Akademie-Hinweis (F3, wie 11.16):** Fällt E6 als zweite der beiden Entscheidungen (2-5 ist erledigt), steht die Akademie unter Stufe 3 und ist Odile nicht (mehr) in der Truppe, nennt die Folgen-Karte von `pardon` den Wegfall von Stufe 3 (`c01_capped`, Bedingung `roomLevel` aus 11.16); hat die Akademie Stufe 3, ist Odile da oder ist 2-5 noch offen, entfällt der Hinweis (`c01`).
14. **Knoten:** `m2_6` in `content/acts/act2/campaign.yaml` bekommt `pre: scn.m2_6.intro`, `post: scn.m2_6.outro` und das Nachspiel `scn.m2_6.burnt_village` (F1); `place: kraehenholm` steht schon. Die Weltkarte bietet 2-6 an, sobald `m2_4` erledigt ist (`mapInBuild`).
15. **Gewinnbar und im Korridor:** `pnpm sim m2_6_kraehenholm --campaign act2 --start expected --runs 50` (Normal) zeigt die Karte gewinnbar, Zahlen im Kopfkommentar und in der Abnahme-Datei, Variante `e07=warn` per `--flags`; Gold der Mission im Korridor 2 000–3 000. Abweichungen nur berichten (11.27). Act-1-Basislauf unverändert.
16. **Unveröffentlicht:** `act2` bleibt `released: false`; kein `pnpm content:lock`, keine Änderung an `content/released-ids.json`. Live-Schritt (Fixture-Spielstände, Sperre) **entfällt bis 9.14/Release**.
17. **Ortsbild:** `kraehenholm` liegt vor und steht schon in `ACT2_LOCATIONS` und `content/packs.yaml` (11.3/11.12) – nur prüfen. `scn.m2_6.burnt_village` nutzt das vorhandene Ortsbild `brandhang` (kein eigenes Bild, siehe F4).
18. **Abnahme:** Abschnitt „Übernahme Story 11.17“ in `concept/27-ueberarbeitung/levels/abnahme/s2_2_6_kraehenholm.md`; `pnpm check` grün. Spielbild 375 × 812 übernimmt die lenkende Session.

## Tasks / Subtasks

- [ ] T1 Nachspiel-Szenen am Knoten (AC 11, 14; F1 = A)
  - [ ] Knotenfeld `epilogues: [{ scene, requires? }]` in `src/core/storyDefs.ts` (`CampaignNodeDef`) und `src/content/schemaCampaign.ts`; Prüfung der Szene und Bedingungen in `src/content/validateCampaign.ts`; `nodeEpilogues(data, c, nodeId)` in `src/core/campaign/graph.ts` (Bedingungen zum Zeitpunkt nach der Nachszene); `concludeBattle` in `src/app/state/flow.ts` spielt sie nach `post` vor dem Ergebnis (nicht in Heimsuchungen); `packNeededFor` kennt sie.
  - [ ] Tests (graph-nah in `tests/unit/`), Architektur und Decision-Log.
- [ ] T2 Karte (AC 1–9)
  - [ ] `m2_6_kraehenholm.yaml` aus dem Entwurf, Kopfkommentar nach Muster `m2_5_silberquell.yaml`; `nameKey: map.m2_6_kraehenholm.name`, `unit.smuggler.name` neu (DE/EN `content/acts/act2/locales/*.names.yaml`).
  - [ ] Gegner ohne `level`, Sprites wie 2-5 (brigand→brigand, skirmisher→mercenary, marksman→bandit_archer, vanguard→soldier, healer→cleric).
  - [ ] Grell `class: skirmisher`, `steel_sword` (Klasse der Leutnant-Definition, Signatur `gold_hook` ist Schwert) statt brigand/steel_axe des Entwurfs [ASSUMPTION].
  - [ ] Sable/Hauptmann wie 2-5, plus `door_key` + `drops`.
  - [ ] Nell `char: nell`, `team: other`, `guest: true`, `recruit: { by: any, dialogue: scn.m2_6.nell_talk }`, ohne eigene Stufe/Waffe.
  - [ ] Trigger `t_ebb` (R4 player), `t_flood_warn` (R8 player, Szene), `t_flood` (R9 player, `river`, `warn: true`), `t_proof` (`unit_enters` player auf `rect [7,11,10,12]`, once → `scn.m2_6.gold_proof`).
  - [ ] `goldReward: 2000` statt 1 400 [ASSUMPTION], Truhe 800 wie Entwurf; zwei Heimsuchungs-Anker [ASSUMPTION].
- [ ] T3 Szenen DE/EN (AC 8, 10–13)
  - [ ] intro, nell_talk, ebb, flood_warn, gold_proof, outro (Maelis' Brief, Nell, E6 c01/c01_capped), burnt_village (`background: brandhang`, Erzähltext, Sable unter `e07: warn`).
  - [ ] EN in `content/locales/en/act2.dialogue.yaml`.
- [ ] T4 Knoten verdrahten (AC 14, 17)
- [ ] T5 Tests und Lab (AC 2–14): `tests/unit/m2-6-kraehenholm.test.ts`, Lab `kraehenholm-2-6` und `kraehenholm-2-6-warn`, nachziehen `act-title`, `act-transition`, `sim-acts`.
- [ ] T6 Sim Normal (AC 15), beide `e07`-Varianten.
- [ ] T7 Abnahme, Decision-Logs, `pnpm check`, Status review (AC 16, 18).

## Dev Notes

### Ausgangslage (Stand 2026-11-09, Branch auf 11.16 `3aa069b`)

- Knoten `m2_6` (`campaign.yaml`): `map: m2_6_kraehenholm, requires: [{ completed: m2_4 }], place: kraehenholm, merchantTier: 1`, ohne `pre`/`post`.
- `kraehenholm` steht schon in `tools/art/build.py:49` (`ACT2_LOCATIONS`) und `content/packs.yaml:76`; Bild `art/mockups/locations-s1/kraehenholm.png` vorhanden. `brandhang.png` ebenfalls (für burnt_village).
- Flags: `e06` (pardon|stay), `e07` (warn|obey) deklariert; `e07` setzt erst 11.15 (nicht auf main), `joinLieutenant` für Sable fehlt → beide Zweige über Test-Flags und Lab.
- Gefährten: `nell` (`units.yaml`, scout, `joins: m2_6`, `door_key` im Gepäck), Varek (Akt 1, N2, optional), Odile (2-5).
- Leutnants: `grell` (skirmisher, `gold_hook`), `sable` (duelist, `dravns_oath`, `joins: true`).
- Halbfiguren vorhanden: nell, grell, sable, varek, maelis, dravn_envoy, odile, lucan.
- Nur ein `post` je Knoten (`schemaCampaign.ts` Knotenschema, `flow.ts concludeBattle`): für das Nachspiel auf dem Rückweg braucht es eine Erweiterung (F1).
- Effekt `grudge` vorhanden (`effects.ts`), klemmt bei 0; die Narrative-Regel „bei Groll 0 entfällt die nächste Steigerung“ gibt es nicht (F3).
- Trigger haben keine `requires`; Szenenzeilen schon. Truhen lösen beim Öffnen keine Trigger sofort aus → Beweisszene über `unit_enters` auf der Felsnase.

### Abweichungen Entwurf ↔ Spielformat (alle in die Abnahme-Datei)

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_2_6_kraehenholm` | `m2_6_kraehenholm` | Karten-Id des Knotens |
| `scn.s2_6.*` | `scn.m2_6.*` | Szenen-Schema |
| `level` + `levelOffset` | nur `levelOffset` | 11.2 |
| Nell Stufe 8, `iron_dagger` | Werte aus `units.yaml` (P − 1) | 11.5 |
| Grell brigand, `steel_axe` | skirmisher, `steel_sword` [ASSUMPTION] | Klasse der Leutnant-Definition (auch Heimsuchungen nutzen sie) |
| `goldReward: 1400` | 2 000 [ASSUMPTION] | Korridor Akt 2 |
| keine Anker | zwei Anker [ASSUMPTION] | Lehre 11.12 |
| — | `t_proof` / `scn.m2_6.gold_proof` | Sable belastet Dravn „in einer Szene“ |

### Testing

- `pnpm check`; Einzeltest `pnpm vitest run tests/unit/m2-6-kraehenholm.test.ts --reporter=verbose`.
- Lab: `pnpm lab kraehenholm-2-6 --play`; Sim `pnpm sim m2_6_kraehenholm --campaign act2 --start expected --runs 50` und `--flags e07=warn`.

### Previous Story Intelligence (11.16)

- Muster Sable/Hauptmann per `requires` auf `e07`, Hauptmann `levelOffset: 1`, `sprite: mercenary`, kein Leutnant.
- E5 als zwei Wahlzeilen `c01`/`c01_capped` mit `roomLevel`; nur die Folgen-Karte der gehenden Antwort nennt Stufe 3.
- Haunt-`rout`-Anker: `enemySpawn` getrennt vom Ziel; content:check prüft Erreichbarkeit.
- `sim-acts.test.ts`: `maxMissions: 1`, damit die echten Karten das 30-s-Timeout nicht reißen.
- Sable-Zeilen an `e07: warn` (nicht `joined_sable`, das 11.15 noch nicht setzt).

### Project Context Rules

- Keine Spielwerte, kein sichtbarer Text im Code; Code/IDs Englisch, Konzepttexte Deutsch.
- `src/core` rein, replay-fest; Coverage nicht senken; neue Knotenlogik mit Tests.
- Nie auf `main`, nie rebasen/force-pushen; Akt 2 nie veröffentlichen.

### References

- [Source: concept/26-epics/epics/epic-11.md:1-49, 365-381]
- [Source: concept/27-ueberarbeitung/levels/s2_2_6_kraehenholm.yaml; levels/abnahme/s2_2_6_kraehenholm.md]
- [Source: concept/22-narrative/missionsliste-s1.md:25,77; narrative.md:82,98,202,220,225,693,728; decision-log.md:82]
- [Source: _bmad-output/implementation-artifacts/11-16-mission-2-5-die-verstossene-leibwache-und-e5.md]

## Offene Fragen an den Produktinhaber

- **F1 [ASSUMPTION A] Wie spielt `scn.m2_6.burnt_village` „auf dem Rückweg“?** Ein Knoten hat nur eine Nachszene. A) neues Knotenfeld `epilogues` (Szenen mit Bedingung, nach der Nachszene vor dem Ergebnis); B) Zeilen mit `panel: brandhang` am Ende der Nachszene, ohne eigene Szenen-Id; C) Szene beim nächsten Besuch der Burg. **Angenommen A.**
- **F2 [ASSUMPTION A] Wie verteilen sich die Haltungen auf E6?** A) warm → stay, nüchtern → pardon, trotzig → stay (wie E5); B) warm → pardon („ich lasse dich gehen“); C) nur zwei Antworten. **Angenommen A.**
- **F3 [ASSUMPTION A] „Hat Sable Groll 0, entfällt ihre nächste Steigerung“ (narrative.md:693):** A) vorerst nur `grudge −1` (bei 0 ohne Wirkung), die Regel kommt mit der Groll-Abstimmung (11.27); B) jetzt ein Merker „nächste Steigerung entfällt“ (neues persistiertes Feld). **Angenommen A.**
- **F4 [ASSUMPTION A] Bild des verbrannten Dorfs:** A) vorhandenes Ortsbild `brandhang`; B) eigenes Ortsbild per ChatGPT nachziehen. **Angenommen A.**
- **F5 [ASSUMPTION A] Wie lässt Maelis die Truppe fallen?** A) ein Brief mit Möwensiegel in Grells Kajüte, in ihrer Stimme (Halbfigur `maelis`); B) Grell sagt es im Kampf; C) Nell überbringt es. **Angenommen A.**

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created (gds-create-story, 2026-11-09).

### File List

### Change Log

- 2026-11-09: Story 11.17 angelegt (ready-for-dev), fünf PO-Fragen als [ASSUMPTION] markiert.
