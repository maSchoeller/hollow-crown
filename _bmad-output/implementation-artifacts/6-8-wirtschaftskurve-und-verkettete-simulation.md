# Story 6.8: Wirtschaftskurve und verkettete Simulation

Status: review

## Story

Als Entwickler
möchte ich den ganzen Akt am Stück simulieren,
damit Gold, EP und Schwierigkeit über alle Missionen zusammenpassen.

## Acceptance Criteria

1. **Aufruf:** `pnpm sim --campaign act1 [--runs 50] [--seed 1] [--difficulty normal] [--death standard] [--haunts]` spielt die Story-Missionen des Akts in gültiger Reihenfolge (Start, dann der jeweils erste verfügbare, noch nicht gespielte Knoten) mit KI auf beiden Seiten (`autoplay`). Der bisherige Aufruf `pnpm sim <mapId>` bleibt unverändert.
2. **Heimat-Heuristik zwischen den Missionen** über echte Kampagnen-Commands (`validateCampaign`/`applyCampaign`): bereite Supports freischalten, Narben heilen, je starker Einheit ein Heil-Item kaufen und in den Beutel legen, Hauptwaffen der Stärksten aufwerten, solange Gold und Material reichen.
3. **Niederlage:** Die Siegquote zählt den ersten Versuch; danach wird die Mission mit neuem Glück bis zu 3-mal wiederholt (wie ein Neustart), damit die Kette weiterläuft. Gelingt das nicht, endet der Lauf.
4. **Heimsuchungen:** gibt es noch nicht (Story 5.6); `--haunts` wird angenommen und meldet das, die Kette läuft ohne.
5. **Ausgabe je Story-Mission:** Siegquote, Niedergestreckte je Lauf, Gold (gesamt und davon Nebenziele), Armee-Stufe (Durchschnitt der 6 stärksten, effektive Stufe) vor der Mission und erwartete Stufe, Tote; dazu Endgold, End-Armee-Stufe und Ausgaben der Heuristik.
6. **Markierungen:** außerhalb der NFR12-Korridore der gewählten Schwierigkeit (Sieg, Niedergestreckte), Gold ohne Nebenziele außerhalb der GDD-Kurve (Prolog 300, Akt 1 800–1 500), Gold-Anteil der Nebenziele an der Kartenbelohnung außerhalb 30–50 %, Armee-Stufe weiter als die Toleranz von `expectedLevel` entfernt. Alle Zielwerte in `balance.yaml` `simulation`, nicht im Code; Korridore unverändert aus NFR12.
7. **Tests:** Reihenfolge und Determinismus je Seed, Armee-Stufe, Heuristik gibt nie mehr aus als vorhanden, Markierungen.
8. Prüfungen grün; Zahlen der Simulation (50 Läufe, Leicht/Normal/Schwer) im Story-Log.

## Tasks / Subtasks

- [x] T1 `balance.yaml` `simulation` + Schema + `BalanceDef`
- [x] T2 `tools/simCampaign.ts`: `simulateCampaign`, `homeHeuristic`, `armyLevel`, `missionFlags`
- [x] T3 `tools/simulate.ts`: Zweig `--campaign`, Tabelle
- [x] T4 Tests `tests/unit/sim-campaign.test.ts`
- [x] T5 Simulation 50 Läufe je Schwierigkeit, Zahlen ins Log, Entscheidungsprotokoll

## Dev Notes

- **Ist-Zustand:** `tools/simulate.ts` simuliert eine Karte, wahlweise mit vorher verkettet gespieltem Weg (`campaignChained`), ohne Heimat und ohne Gold-/Korridorprüfung. NFR12 stand bisher nur in `epics.md`.
- **Reihenfolge:** heute `c.available` (aus `next`). Bringt die Akt-Struktur-Session (4.3) `availableNodes()`, tauscht man nur `nextNode` in `simCampaign.ts`.
- **Grenzen:** keine Änderung an Kampfregeln, KI oder Karten. Die Simulation markiert nur; Werte anpassen ist Sache der Balance- bzw. Kampf-Session oder eine Produktentscheidung.
- **Szenen-Wirkungen** (Antworten, Beitritte über Szenen) spielt die Simulation nicht; Beitritte über Ansprechen auf der Karte laufen über `autoplay`.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Completion Notes List

- Umgesetzt wie in AC 1–7. Prüfweise Goldkurve (Basis ohne Nebenziele gegen 800–1 500, Nebenziel-Gold als Anteil der Kartenbelohnung gegen 30–50 %) und Stufen-Toleranz ±1 vom Produktinhaber bestätigt (2026-10-24).
- Neustart in der Simulation: Die Kampf-RNG leitet sich aus `c.seed` ab; ein Neustart nimmt einen anderen Seed für den Kampf und setzt danach den Kampagnen-Seed zurück.
- Szenen-Wirkungen (Antworten, Beitritte per Szene) spielt die Simulation nicht. Heimsuchungen: `--haunts` meldet „noch nicht im Spiel“ (Story 5.6).
- Ändern an Werten war nicht Teil der Story; die Markierungen gehen an Balance/Produktinhaber (siehe unten).

#### Simulation `pnpm sim --campaign act1 --runs 50` (Seed 1, Tod-Modus Standard), Stand dieses Branches

Normal (47,7 s):

| Mission | Sieg | Niedergestr. | Gold | davon Nebenziele | Armee-Stufe | erwartet | Tote | markiert |
|---|---|---|---|---|---|---|---|---|
| prologue | 100 % | 0,04 ↓ | 500 | 200 ↑ | 1,5 | 1 | 0,04 | downs, side |
| ch01 | 100 % | 0,44 | 1 582 | 360 | 1,7 | 2 | 0,44 | – |
| ch02 | 76 % | 0,78 | 1 690 | 490 | 2,7 | 3 | 0,80 | – |

50/50 Läufe beendet, Endgold 2 988, End-Armee-Stufe 3,6; Heimat je Lauf: Heilen 0, Kaufen 1 020, Aufwerten 264.

Leicht (15,0 s): prologue 100 % / 0,00 / 500 (side ↑); ch01 100 % / 0,00 / 1 000; ch02 100 % / 0,00 / 1 700. 50/50 beendet, Endgold 2 488, Armee 3,2.

Schwer (96,6 s): prologue 62 % / 0,54 / 344 (side ↑); ch01 78 % ↑ / 1,28 / 1 467; ch02 47 % / 0,13 / 1 634 (45 von 50 erreicht). 38/50 beendet, Endgold 3 250, Armee 3,6.

Auffälligkeiten (nur markiert, nicht geändert):
- Prolog Normal: 0,04 Niedergestreckte liegt unter dem Korridor 0,4–1,3 (zu leicht).
- Prolog: Nebenziel-Gold 200 auf 300 Kartenbelohnung = 67 % (GDD 30–50 %); Gesamtgold 500.
- Schwer ch01: 78 % Sieg über dem Korridor 30–70 %.
- Armee-Stufe liegt innerhalb ±1 der erwarteten Stufe; Gold von ch01/ch02 ohne Nebenziele (~1 200) in der Kurve.

### File List

- `tools/simCampaign.ts` (neu), `tools/simulate.ts`
- `content/core/balance.yaml` (`simulation`), `src/content/schemas.ts`, `src/core/defs.ts`
- `tests/unit/sim-campaign.test.ts` (neu)
- `concept/21-gdd/decision-log.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-10-24: Story-Datei angelegt (ready-for-dev).
- 2026-10-24: Umgesetzt, Simulation im Log, Status review.
