---
baseline_commit: 2d075ba
---
# Story 11.10: Format-Reste für die Akt-2-Entwürfe

Status: review

## Story

Als Leveldesigner
möchte ich alles im Spielformat ausdrücken können, was die abgenommenen Akt-2-Entwürfe verlangen,
damit keine Karte einen Sonderfall im Code braucht.

## Acceptance Criteria

1. **Entwürfe in `content:check`:** `pnpm content:check` prüft jeden Entwurf `concept/27-ueberarbeitung/levels/s<akt>_*.yaml` eines noch nicht veröffentlichten Akts (Paket `act<akt>` mit `released: false`, heute Akt 2) gegen Kartenschema und alle Kartenregeln von `validateContent`, als läge er im Akt-Paket. Inhalte, die erst die Missions-Stories und 11.5 schreiben (Szene, Figur, Leutnant, Chronik-Seite, Gegenstand, Locale-Schlüssel), zählen als „offen“ und werden gezählt, nicht als Fehler gemeldet; jede andere Meldung bricht ab. Keine Ausnahmeliste je Entwurf. **[ASSUMPTION]**
2. **Bedingte Pflichtfigur:** `deploy.forced` gilt nur für Figuren, die in der Truppe sind (gefallen oder gegangen = entfällt). Regel `deployInfo`/`deployUnits` (besteht), die Vorbereitung zeigt das Schloss nur für Anwesende (Prep liest die gefilterte Liste), `content:check` prüft, dass jede Pflicht-Id der Avatar, ein Gefährte (`chars`) oder eine eigene Figur der Karte ist. Test: N4 ohne Ilka.
3. **Leutnant mit `requires`:** Ein Leutnant der Startaufstellung darf `requires` tragen (Sable nur nach E7 `e7_order`); fehlt die Bedingung, erscheint er nicht, sein Plan bleibt folgenlos. Der Hauptmann ist kein Leutnant (Entwurf korrigiert). Flags `e7_order`, `e7_warned`, `m2_2_seal` minimal in `content/acts/act2/flags.yaml`. **[ASSUMPTION]**
4. **Gast-Einheit:** `guest: true` an einer Einheit mit `team: other`: von der KI geführt (nicht steuerbar), schließt sich nach der Mission nicht an, außer sie wurde im Kampf angesprochen; mit `ignoreForRout` und `defend`/`unit_dies` Schutzziel. Darstellung: Chip „Gast“ auf der Einheitenkarte. `content:check`: `guest` nur an `team: other`.
5. **Warnung vor `set_terrain`:** Aktion `set_terrain` kennt `warn: true | <Locale-Schlüssel>`. Ab Beginn der Runde vor dem Auslöser (nur `turn_start`, Runde ≥ 2) bis zum Wechsel liefert die reine Kernfunktion `terrainWarnings(data, s)` die Felder; das Brett markiert sie (Overlay `warn`), der HUD zeigt eine Zeile („Geländewechsel in Runde n: Gelände“ bzw. der eigene Text). `content:check`: `warn` nur an `turn_start`-Triggern ab Runde 2, ein Schlüssel muss existieren (im Entwurf: offen).
6. **Mechaniken der Entwürfe je mit Test:** Steinschlag (2-2), Feuer und Schneise (2-4), gekappte Brücke (2-5), Ebbe und Flut (2-6, N6), Kran-Steg (2-7, Hebel), Brückentor (2-8) laufen über `set_terrain`, Hebel und Trigger auf dem Entwurf selbst.
7. **Level-Blatt:** `terrace`, `crag`, `ramp`, `stairs`, `ladder`, `vault`, `footbridge`, `gate_closed` (und jedes andere Gelände aus `terrain.yaml`) haben eine Farbe, kein „?“ (Test); Abnahme-Ansichten `levels/abnahme/s2_*.png` neu erzeugt.
8. **Akt 1 unverändert:** `pnpm sim --campaign act1 --runs 50 --seed 1` identisch zur Baseline; kein neues Speicherformat (`guest` am `BattleUnit` optional); `pnpm check` grün; Coverage `src/core` sinkt nicht; Bild 375 × 812 (Warnung und Gast).

## Tasks / Subtasks

- [x] Entwurfsprüfung (AC 1): `src/content/drafts.ts` (rein: Entwurf + Daten → harte/offene Meldungen), Aufruf in `tools/content-check.ts`, Test `tests/unit/act2-drafts.test.ts`.
- [x] Entwürfe korrigieren und in den Abnahmen vermerken: Ballisten-Gelände (2-1, 2-7, 2-8), gepanzerte Lanzen der Rabenweide (2-3), Hauptmann ohne Leutnant (2-5, 2-6, 2-8), N6 `join: false`, `guest` (2-1, 2-4, 2-5, 2-6, N5), `warn` (2-2, 2-5, 2-6, N6).
- [x] Flags Akt 2 (AC 3), Asche-Wetter auch in Akt 2 (`render.yaml`, für 2-4).
- [x] Schema, Typ und Regel `guest` (AC 4), Chip.
- [x] `warn` (AC 5): Schema, Typ, `terrainWarnings`, Prüfung, Overlay, HUD-Zeile, Locales, Fixture `tests/fixtures/maps/dev_terrain_warn.yaml`.
- [x] Pflichtfigur (AC 2): Prüfung, Prep, Test.
- [x] Leutnant mit `requires` (AC 3): Prüfung lockern, Test.
- [x] Level-Blatt (AC 7): fehlende Gelände, Test, Abnahme-PNGs.
- [x] Doku: Architektur §5.3a „Stand (Story 11.10)“, Decision-Log, Sim-Vergleich, Coverage, Bild.

### Review Follow-ups (AI)

- [x] [AI-Review][High] ID-Sperre: `content:lock` sperrt nur IDs veröffentlichter Pakete, auch Flags, Leutnants und Figuren aus Listendateien (`tools/build/lockIds.ts`, `collectIds` mit Filter je Art); Test: Akt 2 trägt nichts bei.
- [x] [AI-Review][High] `drafts.ts`: „offen“ nur für die Meldungen aus AC 1 (Szene, Figur, Leutnant, Chronik-Seite, Item, Name der Karte bzw. der Eskorte); Datei ohne Akt und doppelte Karten-ID zwischen Entwürfen sind Fehler; Asset-Prüfungen laufen mit, Warnfilter in `content-check.ts` greift; Test prüft die erwarteten IDs statt einer Zahl. Eskorte mit `char: <id>` meldet nur noch die fehlende Figur.
- [x] [AI-Review][Med] Doppelte Flag-ID über zwei Akt-Register ist ein Fehler; Dateiname einheitlich `acts/act<n>/flags.yaml`.
- [x] [AI-Review][Med] `forced`: Prüfung und `presentForced` gleich (Avatar oder Gefährte aus `units.yaml`, keine Kartenfigur).
- [x] [AI-Review][Med] Gast: angesprochener Gast tritt bei (Test), ein Gast mit `char`, der schon in der Truppe ist, erscheint nicht doppelt (`placeMapUnits`, Test), ein gefallener Gast ist kein gefallener Gefährte (Test, [ASSUMPTION]).
- [x] [AI-Review][Med] E7: genau einer hält die Stelle (Sable `not e7_warned`, Hauptmann `e7_warned`), auch ohne E7 und mit beiden Flags (Test); `planLieutenants` bekommt nur die Aufstellung mit erfüllten `requires` (Test mit Ulvric auf einer Kopie von m1_4).
- [x] [AI-Review][Med] `terrainWarnings`: ein schon gefeuerter Trigger warnt nicht mehr, auch mit `once: false` (Test); einzige Bedingung eines `turn_start`-Triggers ist der Zeitpunkt.
- [x] [AI-Review][Low] Overlay `terrainWarn` auf eigenem Layer 19; Farbe aus `render.yaml legibility.terrainWarn` für Streifen und HUD-Kante (`--lg-warn`).
- [x] [AI-Review][Low] Mojibake im Kommentar von `BattleLegibility.tsx` behoben, Key `${trigger}:${i}`.
- [x] [AI-Review][Low] Text nach AC: „Geländewechsel in Runde {n}: {terrain}“ / „Ground change in round {n}: {terrain}“, Schlüssel neben `ui.threat.reach.*`.
- [x] [AI-Review][Low] Fixture mit eigenem Namen `map.dev_terrain_warn.name`.
- [x] [AI-Review][Low] Abnahme-PNGs neu erzeugt; `s2_2_3_rabenweide.png` ist bitgleich (das Blatt zeigt die geänderten KI-Profile nicht).
- [ ] [AI-Review][Defer] UI-Verdrahtung (Warnzeile, Overlay, Gast-Chip und Infoblatt) hat keinen automatischen Test; belegt durch das Bild bei 375 × 812.

## Dev Notes

- Heute prüft nur `pnpm levels` die Entwürfe, und nur gegen `mapSchema` (`tools/levels/atlas.ts` `readDraft`); `content:check` kennt sie nicht. Ausgangsliste (validateContent mit dem Entwurf in `data.maps`, `act` aus dem Dateinamen): 2-1 Balliste ohne Gelände ×2, 2-2 Flag `m2_2_seal`, 2-3 fünf Gegner „cannot walk to the deploy area“ (gepanzert, Furten `armored: null`), 2-4 Wetter `ash` nicht in Akt 2, 2-5/2-6/2-8 Leutnant mit `requires`, Hauptmann als zweiter `sable`, Flags E7, 2-7/2-8 Balliste ohne Gelände; N4–N6 nur offene Inhalte.
- `forced` wird schon nach `c.roster` gefiltert (`setup.ts` `deployInfo`, `deployUnits`; `flow.ts`); Gefallene verlassen `c.roster` (`campaign.ts`). Prep (`Prep.tsx`) nutzt die ungefilterte Liste.
- Nach der Mission tritt jede benannte `other`-Figur mit Charakter bei (`campaign.ts` `playerUnits`, so Liora in 1-3). Brann (2-4) darf das nicht: `guest`.
- `set_terrain` läuft in `runTriggers` (`objectives.ts`) über `eventTerrain` (`rules/effects.ts`); Vorbild der Vorwarnung ist die Ankündigung der Verstärkung (`useBoardOverlays.ts`, Overlay `reinforce`), rein aus State und Karte, kein neues Feld im State.
- Der Leutnant-Plan (`planLieutenants`) läuft über alle Definitionen; ein ausgelassener Leutnant hat keinen `BattleUnit`, `applyLieutenantOutcome` liest nur `s.units` → folgenlos.
- Keine Akt-1-Karte nutzt `warn`, `guest` oder Leutnant-`requires`: Akt 1 bleibt gleich.

### References

- `concept/26-epics/epics/epic-11.md` Story 11.10; `concept/24-architecture/architecture.md` §5.3a, §5.7, §8.3; `concept/27-ueberarbeitung/levels/s2_*.yaml`, `abnahme/s2_*.md`; Vorbild `11-8-ziel-phasen-kern.md`.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Debug Log References

- Ausgangsliste: harte Meldungen der Entwürfe (Ballisten-Gelände, gepanzerte Lanzen 2-3, Leutnant mit `requires`, Hauptmann als zweiter `sable`, Flags E7 und `m2_2_seal`, Asche in Akt 2); sonst nur offene Inhalte. `content:check` kannte die Entwürfe vorher gar nicht.
- Das Flag-Register lud nur `acts/act1/flags.yaml`; jetzt jedes `acts/act<n>/flags.yaml`, das geladen ist (Akt 2 unveröffentlicht, nur Node/Dev).

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- `content:check` prüft die 11 Entwürfe (`src/content/drafts.ts`): 0 Formatfehler, 78 offene Verweise (Szenen, Figuren, Leutnants, Chronik-Seiten, Namen), gezählt in der Ausgabe (`drafts`, `draftOpen`). [ASSUMPTION] Klassifizierung „offen“ nach Meldungsart, keine Liste je Entwurf.
- `set_terrain.warn` mit `terrainWarnings` (rein, kein State), Overlay `terrainWarn` (amberfarbene Schraffur), HUD-Zeile `TerrainWarnPills` (`ui.terrainWarn.line`).
- `guest` (Schema, `BattleUnit.guest`, `finishBattle` lässt Gäste zurück, Chip „Gast“ auf der Karte, „Gast“ statt „Andere“ im Infoblatt).
- `presentForced` als eine Regel für Prep, Standardaufstellung und `createBattle`; `content:check` prüft Pflicht-Ids.
- Leutnant mit `requires` erlaubt; der Hauptmann in 2-5/2-6/2-8 ist kein Leutnant mehr.
- Entwürfe korrigiert und in den Abnahmen vermerkt; Abnahme-PNGs aus `pnpm levels --png` neu zugeschnitten.
- Flags `e7_order`, `e7_warned`, `m2_2_seal` in `content/acts/act2/flags.yaml` [ASSUMPTION]; Wetter `ash` in Akt 2 [ASSUMPTION] (Art-Direction-Log).
- 2-3: Rowena und r1/r3/r5 `then: guard`, Ausfall R7 Plänkler statt Vorkämpfer [ASSUMPTION], Grund: `shallows` ist für `armored` gesperrt.
- Tests: `tests/unit/act2-drafts.test.ts` (13), `level-sheet.test.ts` (+1), `unit-requires.test.ts` und `look.test.ts` angepasst.

### File List

- _bmad-output/implementation-artifacts/11-10-format-reste-fuer-die-akt-2-entwuerfe.md (neu)
- _bmad-output/implementation-artifacts/sprint-status.yaml
- concept/23-art-direction/art-direction.md, concept/23-art-direction/decision-log.md
- concept/24-architecture/architecture.md, concept/24-architecture/decision-log.md
- concept/27-ueberarbeitung/levels/s2_2_1_windscharte.yaml, s2_2_2_salzpass.yaml, s2_2_3_rabenweide.yaml, s2_2_4_brandschneise.yaml, s2_2_5_silberquell.yaml, s2_2_6_kraehenholm.yaml, s2_2_7_kontor.yaml, s2_2_8_kronfeld.yaml, s2_n5_mine.yaml, s2_n6_gaukler.yaml
- concept/27-ueberarbeitung/levels/abnahme/s2_*.md (11), abnahme/s2_*.png (10)
- content/acts/act2/flags.yaml (neu), content/core/locales/de.yaml, content/core/locales/en.yaml, content/core/render.yaml
- src/content/drafts.ts (neu), src/content/validateFormat.ts (neu), src/content/load.ts, src/content/schemas.ts, src/content/validate.ts
- src/core/battle/terrainWarn.ts (neu), src/core/battle/create.ts, src/core/battle/objectives.ts, src/core/battle/setup.ts, src/core/campaign/campaign.ts, src/core/index.ts, src/core/mapDefs.ts, src/core/state.ts
- src/app/screens/Battle.tsx, BattleHud.tsx, BattleLegibility.tsx, BattleLegibility.css, BattlePanels.tsx, Prep.tsx, useBoardOverlays.ts, src/app/state/flow.ts
- src/render/board/overlays.ts, src/ui/hud.css
- tests/fixtures/maps/dev_terrain_warn.yaml (neu), tests/unit/act2-drafts.test.ts (neu), tests/unit/level-sheet.test.ts, tests/unit/look.test.ts, tests/unit/unit-requires.test.ts
- tools/content-check.ts, tools/levels/sheet.ts
- Review: src/content/ids.ts, tools/content-lock.ts, tools/build/lockIds.ts (neu), src/core/renderDefs.ts

### Senior Developer Review (AI)

- 2026-11-07, 4 Reviewer: Changes Requested, 12 Punkte zum Beheben, 1 zurückgestellt (siehe Review Follow-ups). Alle 12 behoben, Tests ergänzt.

### Change Log

- 2026-11-07: Story 11.10 umgesetzt (Format-Reste der Akt-2-Entwürfe), Status review.
- 2026-11-07: Review-Befunde behoben (12 Punkte, 1 zurückgestellt).
