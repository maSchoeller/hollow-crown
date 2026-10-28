# Story 9.5: Mission 1-4 „Die Spur des Maklers“ und Entscheidung E2

Status: done

## Story

Als Spieler
möchte ich den Makler Osric Dunn stellen und Ysolde befreien,
damit Akt 1 seinen Wendepunkt bekommt.

## Acceptance Criteria

1. **Karte:** `m1_4_wolfslager` (16 × 18, Ziel `boss` Osric Dunn, Leutnant Ulvric als `wolf_rider` mit Eisenlanze und Käfigschlüssel, Gefangene Ysolde hinter der Tür `cage`). Gegner Leicht 9 / Normal 11 / Schwer 13 plus 2 Wolfsreiter in Runde 4 (Schwer); Gelände unverändert; Nacht, klar, Kriegsnebel.
2. **E2 vor der Mission:** Szene `scn.m1_4.intro` (Knoten-`pre`): Der Diebesring von Varnhold will Fenn zurück und nennt das Versteck des Maklers (das Wolfslager) gleich zu Beginn; der Tausch betrifft nur Wachwechsel und Hintereingang. „Schützen“ setzt `e02: protect`; „Ausliefern“ setzt `e02: hand_over` und Fenn geht (`leave`), bevor die Truppe aufgestellt wird. Ohne Fenn in der Truppe entfällt E2.
3. **„Ausliefern“ macht die Mission leichter:** `wr3`, `wr4`, `g3`, `g4` entfallen (Leicht 7 / Normal 7 / Schwer 9 plus 2). Kernfähigkeit: Karteneinheiten mit `requires: [Bedingungen]`.
4. **Dunns Tod im Outro:** Im Kampf ist Dunn nur besiegt (Ziel erfüllt). In `scn.m1_4.outro` will er den Auftraggeber nennen, ein Armbrustbolzen aus dem Wald trifft ihn, der Schütze entkommt ungesehen (doppeldeutig, der Hüter bleibt ungenannt).
5. **Rhens Geständnis:** direkt danach im selben Outro, Tafel `rhen_confession` vier Textboxen lang, danach `panel: none`; Kaels Reaktion je eine Zeile für warm, sober, defiant (Bedingung `stance`).
6. **Ysolde:** Käfigtür öffnen (Schlüssel von Ulvric, Brenna trägt einen, ein Späher knackt sie), dann spricht {avatar} sie an (`recruit: { by: [avatar], dialogue: scn.m1_4.ysolde_talk }`); Nebenziel `recruit`.
7. **Knoten:** `m1_4` (`requires: completed m1_1`, `place wolfslager`, `merchantTier 1`, `expectedLevel 4`), Weltkarte 1-4 zeigt ihn.
8. **Halvard-Variante in 1-3:** `scn.m1_3.outro` l22d/l23d gelten, wenn `m1_4` abgeschlossen ist; l22/l23 sonst.
9. **Heimsuchungs-Anker:** `haunts:` mit drei Ankern (rout, boss, defend).
10. **Prüfungen:** `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Simulation siehe Dev Agent Record.

## Tasks / Subtasks

- [x] T1 Kern: `MapUnitDef.requires` (Schema, `onConditions`, `placeMapUnits`), Validierung in `content:check`, Tests `unit-requires.test.ts`
- [x] T2 Simulation: `tools/simulate.ts` mit `--flag name=wert` und `--leave id[,id]`
- [x] T3 Karte: Wolfsreiter `wolf_rider`, Ulvric `wolf_rider` mit `iron_lance`, Dunn `osric`, Ysolde mit Ansprechen, `requires` auf vier Einheiten, Stufen/Profile per Simulation, `haunts`
- [x] T4 Szenen `scn.m1_4.{intro,dunn_battle,ysolde_talk,outro}` und Englisch
- [x] T5 Knoten `m1_4`, Weltkarte, Ortsbilder `wolfslager` und `rhen_confession` (`tools/art/build.py`: `ACT1_LOCATIONS`)
- [x] T6 Halvard-Variante in `scn.m1_3.outro`, Ysolde in `units.yaml` bereinigt
- [x] T7 Simulation abgestimmt, Decision-Logs, Architektur-Stand

## Dev Notes

- **Entscheidungen des Produktinhabers (bindend, 2026-10-27):** E2 vor der Mission; „ausliefern“ macht die Mission leichter (vier Einheiten entfallen, Kernfähigkeit `requires`); Osric Dunn als Boss mit Söldnerfigur; Dunns Tod im Outro; Rhens Geständnis direkt danach; Ysolde im Käfig, {avatar} spricht sie an; Ulvric `wolf_rider` mit Eisenlanze; Halvard-Variante in 1-3.
- **Technische Entscheidungen:**
  - `requires` an Karteneinheiten: nur in `units` (Startaufstellung), ausgewertet in `placeMapUnits` gegen `conditionContext(data, c)`; nicht für Verstärkungen, Trigger-Spawns, Leutnants, Heimsuchungen (`content:check` lehnt es dort ab, ebenso am Boss des Siegziels, an Nebenziel-Einheiten und als `ai.target`). Replay sicher: der Startzustand trägt die gefilterte Liste.
  - E2 ist eine Antwortzeile mit `title` in der `pre`-Szene; `choose` läuft sofort durch das Journal, danach baut `defaultDeploy` die Aufstellung, Fenn ist also nicht mehr aufstellbar. Haltung: schützen = warm, ausliefern = sober. Bedingung der Entscheidungszeile `alive: fenn` (= in der Truppe, nicht gefallen, nicht gegangen). Ohne Fenn: der Bote behält die Auskunft, nennt das Lager aber („das kennt ihr ja“).
  - N1: an der Antwort `protect` steht ein YAML-Kommentar, dass `{ openQuest: n1 }` die Session der Nebenquests nachträgt; jetzt kein `openQuest`.
  - Der Bote des Rings ist erzählt („Der Bote: …“), kein Sprecher: `scene-view.test.ts` verlangt für jeden Sprecher ein Bild in `art/mockups/characters-s1`.
  - Dunn: Unit-Id und Sprecher `osric` (Halbfigur `osric`, Name `unit.osric.name`, vorher `unit.osric_dunn.name`), Klasse `skirmisher`, `steel_sword`, Figur `mercenary` als Platzhalter (Büste fehlt, Klassenbild). Im Kern fällt er bei 0 TP wie jeder Gegner, Ziel erfüllt; nichts im Kern widerspricht der Outro-Szene (kein Gedenkstein, keine Flucht, nur Leutnants fliehen).
  - Ysolde: Team `enemy` + `hold` + keine Waffe + `ignoreForRout` (Muster Varek in 1-5); Gegner greifen sie nicht an, Rout zählt sie nicht. `by: [avatar]` heißt: nur Rhen spricht sie an. Veraltetes `recruit.chapter/condition` in `units.yaml` entfernt, `joins: m1_4`.
  - Wolfsreiter und Verstärkungen: Klasse `wolf_rider`, Figur `wolf_rider` (Klasse `art: mercenary` bleibt Platzhalter für Bilder/Porträts); `tests/unit/enemy-types.test.ts` lässt nun `trigger` (dann aggressiv) und Schlüssel im Gepäck zu.
  - Rhens Geständnis im selben Outro (kein eigenes Szenen-Muster nötig). Die drei Haltungszeilen nennen die Tafel je neu (gleiches Bild), weil `content:check` alle Zeilen zählt; sichtbar sind genau vier Boxen.
  - Gold: `goldReward` 1300, Nebenziele `recruit` Ysolde 300 Gold, `no_downs` Heiltrank, `turn_limit` 10 Runden 200 Gold (unverändert [C]).
  - Ortsbilder `wolfslager` und `rhen_confession` in `ACT1_LOCATIONS`; `pnpm art:build` neu gelaufen.
  - Tests: `core.test.ts`, `migrations.test.ts` um Knoten/Orte ergänzt.
- **Offen / aufgefallen:** `scn.m1_3.outro` l32 („Wir suchen einen Makler“) passt nicht mehr, wenn 1-4 vor 1-3 gespielt wurde; nicht angefasst (nicht Teil der Entscheidung).

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm sim m1_4 --runs 50` (Siegrate / niedergestreckte Spielerfiguren je Lauf / Median-Runden). „schützen“ = ohne Flag, „ausliefern“ = `--flag e02=hand_over --leave fenn`. Schwer verkettet: nur 11 von 50 Ketten kommen bis 1-4 (1-1 bis 1-3 scheitern auf Schwer oft), in Klammern `--runs 200` (31 Ketten).

| | Leicht | Normal | Schwer |
|---|---|---|---|
| schützen verkettet | 100 % / 0,46 / 4 | 98 % / 0,95 / 6 | 55 % / 1,09 / 9 (200 Läufe: 65 % / 1,23 / 9) |
| schützen `--fresh` | 90 % / 0,82 / 5 | 60 % / 1,16 / 9 | 2 % / 1,62 / 16 |
| ausliefern verkettet | 100 % / 0,52 / 3 | 100 % / 0,97 / 5 | 64 % / 1,27 / 7 (200 Läufe: 74 % / 1,29 / 7) |
| ausliefern `--fresh` | 100 % / 0,84 / 5 | 80 % / 1,68 / 7 | 0 % / 1,16 / – |

- Korridor: verkettet erfüllt Leicht (≥ 95 %, ≤ 0,5), Normal (75–100 %, 0,4–1,3) und Schwer „schützen“ (65 % bei 31 Ketten); „ausliefern“ ist wie gewollt leichter (Schwer 74 %, knapp über 70 %). `--fresh` (Rhen und Kael Stufe 1, Begleiter auf Beitrittsstufe) liegt darunter: Normal 60 %, Schwer 2 %; die Wolfsreiter und Ulvric treffen die Stufe-1-Figuren hart (Rhen fällt, Niederlage). Gegnerstufen als Kompromiss: Wolfsreiter und Wachen 2, Schwer-Wachen 3, Dunn 3, Ulvric skaliert mit der Truppe. Stufe 3 machte verkettet Schwer zu hart ohne Gewinn bei fresh, Stufe 1 für die Wachen änderte fresh kaum (die Wolfsreiter machen den Schaden). `wr3`/`wr4`/`g6` auf Auslöseradius umzustellen verschlechterte `--fresh` (Normal 34 %) und blieb draußen.
- `expectedLevel 4`: die verkettete Truppe vor 1-4 liegt etwa bei Stufe 4, die Gegner bei 2–3 (Ulvric auf Truppenstufe), wie bei 1-3 (Gegner 2, expectedLevel 3).
- Der Autoplay wirbt Ysolde nicht an (`recruited: {}`); das Nebenziel ist nur per Hand erreichbar (Tür `cage` bei [13,3], Wache g5 bei [12,3]).

### Completion Notes List

- Gegnerzahlen unverändert, Gelände unverändert. Gate: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün.

### File List

- Neu: `content/acts/act1/scenes/scn.m1_4.{intro,dunn_battle,ysolde_talk,outro}.yaml`, `tests/unit/unit-requires.test.ts`, diese Datei
- Geändert: `content/acts/act1/{campaign,units}.yaml`, `content/acts/act1/maps/m1_4_wolfslager.yaml`, `content/acts/act1/scenes/scn.m1_3.outro.yaml`, `content/core/locales/{de,en}.names.yaml`, `content/locales/en/act1.dialogue.yaml`, `content/world/valmora.yaml`, `tools/art/build.py`, `tools/simulate.ts`
- Code: `src/core/defs.ts`, `src/core/campaign/conditions.ts`, `src/core/battle/setup.ts`, `src/content/{schemas,validate}.ts`
- Tests: `tests/unit/{enemy-types,core,migrations}.test.ts`
- Doku: `concept/22-narrative/decision-log.md`, `concept/24-architecture/{architecture.md,decision-log.md}`, `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-10-27: Story 9.5 umgesetzt (Mission 1-4, E2 mit Karteneinheiten-`requires`, Dunns Tod, Rhens Geständnis, Ysolde, Halvard-Variante in 1-3).

## Abnahme 2026-10-27

Abgenommen (Status done). Gespielt; E2 „schützen“ öffnet N1. Balancing PR #72 (Leicht entschärft), Leicht 100 %/0,40. Gesamtbefund: `acceptance-2026-10-27.md`.
