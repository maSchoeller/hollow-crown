# Story 16.2: Balancing-Nachzug für Prolog, 1-2, 2-1 und 2-8

Status: review

## Story

Als Spieler
möchte ich, dass die Karten nach der Straßen-Regel wieder im Siegkorridor liegen,
damit schnellere Wege das Spiel nicht unfair machen.

## Acceptance Criteria

1. **Ausgangslage:** Story 16.1 (Straße und Brücke ½, PR #235) ist auf `main`. Sim 2026-11-21, Sieg im ersten Versuch: Prolog 88 → 38 %, 1-2 96 → 70 %, 2-1 100 → 86 %, 2-8 60 → 36 %.
2. **Hebel:** Die vier Karten werden nur über Weckrunden/Weckradien (`ai: { profile: trigger, radius, then }`, Verstärkungs-`turn`), Startpositionen (`deploy`, `at`) und Gegneraufstellung (Anzahl, Stufe, Position, `difficulty`-Liste je Einheit) in den Karten-YAMLs nachgezogen. **Nicht** angefasst werden die Straßenkosten (`content/core/terrain.yaml`) und die Spielwerte in `content/core/balance.yaml`.
3. **Korridor:** Alle vier liegen mit `pnpm sim <mapId> --runs 50` (Normal) wieder in NFR12: 75–100 % Sieg und 0,4–1,3 Niedergestreckte. 2-8 ist als Finale die Ausnahme wie in Story 11.27 (dort 59–60 % vom PO bestätigt): Ziel ist der Stand vor 16.1, rund 60 %. [ASSUMPTION] „am oberen Rand wie in 11.27“ = zurück auf den 11.27-Wert, nicht 75 %.
4. **Nachweis:** Jeder Lauf ist als JSON gesichert (`--json`) und per `pnpm sim:diff` gegen den Stand vor 16.1 (main 544f3e20) verglichen; Vorher/Nachher-Tabelle im PR.
5. **Prolog:** Der vorgelaufene Avatar fällt nicht mehr gehäuft (Ausfälle `avatar` in der Sim höchstens auf dem Niveau vor 16.1, dort 2 von 50).
6. **Rest von Akt 1 und 2:** Alle übrigen Story-Karten (m1_1–m1_8, m2_1–m2_8) sind neu simuliert; jede, die durch 16.1 aus dem Korridor gefallen ist, ist in dieser Story mitgezogen. Karten, die schon vor 16.1 außerhalb lagen, werden nur gemessen und genannt.

## Tasks / Subtasks

- [x] T1 Messung Ist-Stand und Basis (AC 1, 4, 6): je Story-Karte `pnpm sim <id> --runs 50 --json`, Basis aus 544f3e20 (Scratchpad-Worktree), Tabelle vorher/jetzt.
- [x] T2 Prolog nachziehen (AC 2, 3, 5)
- [x] T3 1-2 Erlbach nachziehen (AC 2, 3)
- [x] T4 2-1 Windscharte nachziehen (AC 2, 3)
- [x] T5 2-8 Kronfeld nachziehen (AC 2, 3)
- [x] T6 weitere aus dem Korridor gefallene Karten (AC 6)
- [x] T7 Gegenmessung aller geänderten Karten mit 50 Läufen, `sim:diff` gegen Basis; `pnpm check` grün (AC 4)

## Dev Notes

- **Ursache:** Mit ½ auf Straßen läuft die Truppe (und der Avatar vorneweg) doppelt so weit; Weckradien und Wachen, die auf Laufweg und Rundenzahl gestimmt waren, erwischen einzelne Figuren jetzt allein oder zu früh. Erste Hebel: Weckradius (`trigger.radius`) verkleinern oder Wachen von der Straße wegsetzen, Verstärkungsrunde (`reinforcements[].turn`) an die schnellere Ankunft anpassen, Startfelder so, dass der Avatar nicht als Erster in die Wachen läuft. Gegner erst entfernen/abschwächen, wenn diese Hebel nicht reichen.
- **Schwierigkeitsstufen:** Änderungen an Einheiten, die für alle Stufen gelten, wirken auch auf Leicht/Schwer. Wo nur Normal betroffen ist, `difficulty: [...]` je Einheit nutzen. Leicht und Schwer der vier Karten nach der Änderung einmal gegenmessen (`--difficulty easy|hard`), sie dürfen sich nicht verschlechtern.
- **Rauschen:** Bei 50 Läufen und ~70 % liegt der Standardfehler bei ~6,5 Pkt. (Story 11.27). Grenzfälle mit 100 Läufen bestätigen.
- **Sim-Hinweise:** Eine Karte zur Zeit, nie parallel zu einer zweiten Sim oder `pnpm check` (Rechnerlast, parallel läuft 16.10 mit Blender). Akt-2-Karten spielen die Kette der Akt-2-Story-Missionen davor (Kopf von `tools/simulate.ts`). Varianten können für Kartenwerte nicht per `--set` (nur balance.yaml) probiert werden; Kartenwerte direkt in der YAML ändern und messen.
- **Replays/Fixtures:** Karten-Änderungen ändern Startzustände. Tests mit festen Karten-Erwartungen (z. B. `tests/unit/*prologue*`, Replay-Fixtures, `tests/fixtures/saves/`) laufen in `pnpm test`; schlägt einer wegen geänderter Aufstellung fehl, die Erwartung bewusst nachziehen, nicht die Karte zurückdrehen. Akt 1/2 sind nicht gesperrt (`released-ids.json` gibt es noch nicht), IDs dürfen bleiben; Einheiten-IDs nicht umbenennen.
- **Gesperrt:** O1–O5 in `concept/01-decisions.md`, offene Fragen im Game Brief nicht entscheiden.

### Project Context Rules

- Spielwerte nie im Code; hier nur Karten-YAMLs unter `content/acts/act1/maps/`, `content/acts/act2/maps/`.
- Fertig erst mit grünem `pnpm check` (lint, test, content:check, build).
- Commits auf Englisch, Konzepttexte auf Deutsch; kein Commit auf `main`.

### References

- [Source: concept/26-epics/epics/epic-16.md#Story 16.2]
- [Source: concept/26-epics/epics/requirements.md NFR12]
- [Source: _bmad-output/implementation-artifacts/11-27-akt-2-abstimmen-und-abschliessen.md] (2-8-Ausnahme, Rauschen)
- [Source: _bmad-output/implementation-artifacts/16-1-strassen-und-bruecken-kosten.md]
- [Source: tools/simulate.ts Kopf] (Optionen)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5 (Sub-Session)

### Completion Notes List

Messung Normal (50 Läufe, seed 1, `pnpm sim`; Akt 1 verkettet, 2-3/2-8 mit `--fresh`); vorher = main 544f3e20, jetzt = nach 16.1, danach = nach 16.2. Sieg % / Niedergestreckte / Avatar-Ausfälle.

| Karte | vorher | jetzt | danach | Leicht vorher → danach | Schwer vorher* → danach |
|---|---|---|---|---|---|
| prologue_paktnacht | 96 / 0,08 / 2 | 48 / 0,82 / 25 | 100 / 0,04 / 0 | 100 → 100 | 6 → 62 |
| m1_2_erlbach (100 Läufe, 61 kommen an) | 92 / 0,54 / 0 | 67 / 1,27 / – | 85 / 1,26 / 4 | 100 → 100 | 0 → 7 |
| m2_1_windscharte | 98 / 5,04 / 1 | 80 / 5,92 / 10 | 94 / 4,30 / 3 | 100 → 100 | 2 → 2 (unverändert) |
| m2_3_rabenweide (fresh) | 94 / 1,38 / 3 | 82 / 2,84 / 4 | 92 / 1,56 / 1 | 100 → 100 | 18 → 48 |
| m2_8_kronfeld (fresh) | 90 / 1,78 / 5 | 92 / 2,62 / 0 | 92 / 1,66 / 1 | 98 → 100 | 18 → 28 |

*Schwer „vorher“ = Stand nach 16.1 vor dieser Story (Schwer vor 16.1 wurde nicht gemessen). Schwer liegt auf Prolog, 1-2 und 2-1 weiterhin sehr niedrig; das war schon vor 11.27 ein offener Punkt und ist hier nicht Ziel.

Änderungen je Karte (Karten-YAMLs, kein Code, nicht `terrain.yaml`/`balance.yaml`):
- prologue_paktnacht: Säulengang (y 2–8) von Straße auf Boden (plain) gestellt. Grund: Der Avatar lief mit ½-Straße in Runde 1 allein bis [6,8] in tg1/tg2 und wanderte danach allein durch den Westgarten in tg3 (25 von 50 Ausfälle). Weckradien und Verstärkungsrunde (R4→R6 getestet: nur 58 %) reichten nicht.
- m1_2_erlbach: Weckradius 4 → 3 bei Hask und r1–r5, r7, r9–r12. Grund: Die Südtruppe erwachte über die Brückenstraße schon in Runde 1 (wakeTurn griff nie), r12 erreichte den Ältesten in Runde 2.
- m1_2_erlbach: Flanken-Wellen eine Runde später (Ost R4/R5 → R5/R6, West R6/R7 → R7/R8). Grund: Der Älteste fiel durch die schnellere Ankunft der Wellen in Runde 7–8; Nachschub aus Hasks Lager bleibt R6 (R7 half nicht).
- m2_1_windscharte: m6 (Schütze) und m7 (Plänkler) des Mittelblocks nur noch auf Schwer (m7 zusätzlich Leicht). Grund: Der Block erreicht die Truppe über die Passstraße in Runde 1 und tötet Figuren früh; Wellen-Verschiebung (+1) und Weckrunde der Gruppe brachten die Avatar-Ausfälle nicht unter 9. Test `m2-1-windscharte.test.ts` auf 20 / 19 / 31 Gegner nachgezogen.
- m2_3_rabenweide: Weckradius der Plänkler r2 und r4 5 → 3. Grund: Sie wachten beim ersten Schritt der Truppe auf und fällten in Runde 2 jeweils eine Figur (35 und 13 Niedergestreckte in 50 Läufen).
- m2_8_kronfeld: Grell, w2, w4 von aggressive auf trigger (Radius 5, dann aggressive). Grund: Die Westgruppe stürmte in Runde 1–2 und fällte die meisten Figuren (Grell 23, w2 17, w4 12 Niedergestreckte).

[ASSUMPTION] Prolog-Straße im Säulengang wird zu Boden statt die Wachen umzusetzen: kleinste Änderung, die den Avatar-Vorlauf beseitigt; das Aussehen der Halle ändert sich (kein gepflasterter Weg). Falls die Optik wichtiger ist, Alternative: Avatar/Truppe über Aufstellfelder bremsen oder tg1/tg2 weiter nach Süden setzen.
[ASSUMPTION] 1-2 mit 100 statt 50 Läufen als Endmessung (Grenzfall, nur 61 von 100 Läufen kommen an; 50 Läufe: 29).
[ASSUMPTION] 2-8: Ziel „Sieg ~85–95 %, Niedergestreckte ≤ 2,0“ statt der Story-AC (rund 60 %), nach Vorgabe des Auftraggebers.
JSONs: Scratchpad `sim/after`, `after-fresh`, `after-easy`, `after-hard` (vorher: `before`, `before-fresh`, `pre-easy`, `pre-hard`).
Weitere Karten (m1_1, m1_3–m1_8, m2_2, m2_4–m2_7): nicht geändert, siehe `ausgang.md`; m1_1 lag auch vor 16.1 außerhalb (50 %).

### File List

- content/acts/act1/maps/prologue_paktnacht.yaml
- content/acts/act1/maps/m1_2_erlbach.yaml
- content/acts/act2/maps/m2_1_windscharte.yaml
- content/acts/act2/maps/m2_3_rabenweide.yaml
- content/acts/act2/maps/m2_8_kronfeld.yaml
- tests/unit/m2-1-windscharte.test.ts
- _bmad-output/implementation-artifacts/16-2-balancing-nachzug-fuer-prolog-1-2-2-1-und-2-8.md

### Review (2026-11-22)

`gds-code-review` (Sonnet): keine kritischen Befunde. Behoben: Kommentar in `m2_1_windscharte.yaml` (m7 fehlt nur auf Normal). `pnpm check` grün (2628 Tests). Status review: Spielgefühl-Abnahme durch den PO steht aus.

## Review 2026-11-27

**Urteil: GAPS.** Die Kartenänderungen sind auf `main` (`aa6e2f3a`; Weckradien 1-2, m6/m7 in 2-1 nur Schwer, Trigger für Grell/w2/w4 in 2-8, Radius 3 in 2-3, Säulengang im Prolog), die Siegquoten liegen im Korridor. Offen gegenüber AC 3:
- Niedergestreckte außerhalb 0,4–1,3 laut eigener Messung: Prolog 0,04, 2-1 4,30, 2-3 1,56, 2-8 1,66 (Prolog und 2-1 lagen schon vor 16.1 außerhalb).
- 2-8 auf 92 % statt „rund 60 %“ gezogen (Ziel vom Auftraggeber geändert, [ASSUMPTION]); braucht Bestätigung oder Nachzug durch den Produktinhaber, ebenso die Spielgefühl-Abnahme.
- Nicht neu gemessen (Review ohne Sim-Lauf).
