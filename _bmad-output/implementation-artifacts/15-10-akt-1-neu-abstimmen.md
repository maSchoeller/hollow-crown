# Story 15.10: Akt 1 neu abstimmen

Status: done

## Story

Als Produktinhaber
möchte ich Akt 1 auf den neuen Karten abgestimmt haben,
damit Schwierigkeit und Spielzeit zum neuen Gegnerbild passen.

## Akzeptanzkriterien

1. **Angenommen** die Stories 15.1–15.6, **wenn** `pnpm sim --campaign act1` auf allen Schwierigkeiten läuft, **dann** liegen alle Story-Missionen in den Korridoren (NFR12), und EP- und Goldkurve tragen über den Akt.
2. **Und** die Spielzeit von Akt 1 passt zu 30–35 Stunden für die Staffel; die Dauer der Gegnerphase auf großen Karten ist gemessen.

## Ergebnis kurz

- **Leicht:** alle Story-Missionen im Korridor (vorher 1-7 mit 88 % Siegen und 1-8 mit 1,02 Niedergestreckten draußen).
- **Normal:** 1-1, 1-7 und 1-8 jetzt im Korridor, N3 auch (Nebenquest, einzeln gemessen). 1-8 liegt über 96 Läufe bei 1,21 Niedergestreckten, Seed 1 allein bei 1,36: knapp, die Streuung zwischen zwei 50er-Läufen ist ±0,2. **Prolog bleibt draußen** (0,12–0,20 Niedergestreckte bei 80–88 % Siegen), Grund und Vorschlag unter „Offen“.
- **Schwer:** Die verkettete Kampagne verliert früh die meisten Läufe (Prolog und 1-1 je 36 % Siege, im Korridor); ab 1-4 kommen nur 12–18 Läufe an, und das sind die starken. Gemessen mit Normal-Kette (Mission auf Schwer, Weg dorthin auf Normal): 1-6 48 %, 1-7 60 %, 1-8 76–84 % (knapp zu leicht, war vorher genauso), N3 13–21 % (zu schwer).
- **Goldkurve:** Gold ohne Nebenziele überall im GDD-Band (Prolog 300, Akt 1 800–1 500). Markiert ist nur der Nebenziel-Anteil von 1-1, 1-3 und 1-5: Deren Nebenziele zahlen in Gegenständen, nicht in Gold (unverändert, kein Teil dieser Story).
- **EP-Kurve:** trägt bis 1-6 (`expectedLevel` 1-6 auf 6 gesetzt, technischer Startwert). Vor 1-7 und 1-8 liegt die Truppe auf Normal 0,8–1,2 Stufen unter 8/9, auf Leicht 1,7–2,3. Entscheidung Produktinhaber.
- **Spielzeit:** Akt 1 ≈ 3,5–5 Stunden, die Staffel bräuchte anteilig ≈ 10–12. Siehe unten.
- **Gegnerphase:** 1-6 Ø 2,3 s, längste 13 s; 1-8 Ø 9 s, längste 34–55 s (Gemeinsam, Tempo 1×).

## Korridore vorher und nachher

`pnpm sim --campaign act1 --runs 50`, Standard-Tod, Seed 1 (Normal zusätzlich Seed 51). Sieg = erster Versuch, Niedergestreckte = jeder Fall auf 0 TP im ersten Versuch je Lauf. Korridor Leicht ≥ 95 % / ≤ 0,5; Normal 75–100 % / 0,4–1,3; Schwer 30–70 %. **Fett** = außerhalb.

| Mission | Leicht vorher | Leicht nachher | Normal vorher | Normal nachher (Seed 1 / 51) | Schwer vorher | Schwer nachher | Schwer, Normal-Kette nachher |
|---|---|---|---|---|---|---|---|
| Prolog | 100 % · 0,00 | 100 % · 0,00 | 88 % · **0,12** | 88 % · **0,12** / 80 % · **0,20** | 36 % | 36 % | – |
| 1-1 | 100 % · 0,00 | 100 % · 0,00 | 98 % · **0,22** | 98 % · 0,44 / 88 % · 0,58 | 36 % | 36 % | – |
| 1-2 | 100 % · 0,06 | 100 % · 0,06 | 98 % · 0,48 | 100 % · 0,58 / 98 % · 0,42 | 56 % | 56 % | – |
| 1-3 | 100 % · 0,28 | 100 % · 0,28 | 98 % · 0,84 | 100 % · 0,84 / 100 % · 0,56 | 30 % | 30 % | – |
| 1-4 | 100 % · 0,28 | 100 % · 0,28 | 100 % · 0,88 | 100 % · 1,12 / 100 % · 1,12 | **89 %** (n 18) | **89 %** (n 18) | – |
| 1-5 | 100 % · 0,40 | 100 % · 0,40 | 100 % · 1,14 | 98 % · 1,10 / 100 % · 1,10 | **72 %** (n 18) | **72 %** (n 18) | – |
| 1-6 | 100 % · 0,42 | 100 % · 0,42 | 98 % · 1,20 | 98 % · 0,90 / 100 % · 0,86 | **71 %** (n 17) | **71 %** (n 17) | 48 % |
| 1-7 | **88 %** · 0,06 | 100 % · 0,06 | 76 % · **0,32** | 84 % · 0,50 / 84 % · 0,56 | 56 % (n 16) | 44 % (n 16) | 60 % |
| 1-8 | 100 % · **1,02** | 100 % · 0,36 | 96 % · **1,88** | 98 % · **1,36** / 94 % · 1,06 (zusammen 1,21) | **82 %** (n 11) | **75 %** (n 12) | **76–84 %** |
| N3 (einzeln) | 100 % · 0,17 | 100 % · 0,10 | **72 %** · **0,28** | 81 % · 0,41 | – | – | **13–21 %** |

Schwer verkettet: Ab 1-4 kommen nur noch 12–18 von 50 Läufen an, das sind die starken; 1-4 und 1-5 auf Schwer sind deshalb nicht fair gemessen (mit Normal-Kette nur ab 1-6 gespielt) und in dieser Story unverändert.

N3 ist eine Nebenquest und läuft in `--campaign` nicht mit. Vorher: `pnpm sim n3_erbe --runs 50` (25 von 50 Läufen kamen an); nachher auf 40 Kampagnenständen nach 1-6, je dreimal gespielt (120 Läufe). Die Spalte „Normal-Kette“ spielt die Mission auf Schwer mit Normal-Ständen (wie `--chain normal`), 40–80 Läufe.

**Nach dem Merge mit `main`** (Hasks sichtbare Flucht in 1-6, `noHaunts`, Schlüssel der neuen Plünderer), Seed 1: Leicht unverändert im Korridor (1-6 0,44, 1-8 0,36). Normal 1-7 94 % · **0,36**, 1-8 98 % · 1,06, sonst wie oben. Über drei Normal-Läufe liegt 1-7 bei 0,36–0,56 und 1-8 bei 1,06–1,36: Beide sitzen an der Streugrenze eines 50er-Laufs (±0,2); für einen festen Abstand bräuchte es mehr Läufe je Messung oder einen schmaleren Hebel.

Armee-Stufe vor der Mission (Normal, nachher): Prolog 1,5 · 1-1 1,7 · 1-2 2,9 · 1-3 3,4 · 1-4 4,0 · 1-5 5,1 · 1-6 5,9 · 1-7 7,2 · 1-8 7,8–7,9 (erwartet 1/2/3/3/4/5/6/8/9).

## Nachtrag 2026-11-07: Antworten des Produktinhabers

Eingetragen im GDD-Log (2026-11-07).

1. **Prolog:** Es zählt nur die Siegquote. Neu `simulation.winOnly: [prologue]` in `balance.yaml`; `missionFlags` (`tools/simCampaign.ts`) markiert dort keine Niedergestreckten mehr (Test in `sim-campaign.test.ts`). Prolog Normal 78–88 % Siege: im Korridor.
2. **EP-Kurve:** mehr EP, erwartete Stufen bleiben. `balance.yaml` `experience`: `combatBase` 10 → 11, `killBase` 30 → 34, `killPerLevelDiff` 3 → 0 (Besiegen zählt unabhängig vom Stufenunterschied). Grund: Ab 1-6 stehen die Gegner 2–5 Stufen unter der Truppe, der Abschlag kostete dort die meisten EP. Reine Anhebung der Grund-EP (bis 45/15) hob 1-3 bis 1-6 über die Toleranz von 1 Stufe, bevor 1-8 Stufe 9 erreichte. Die höhere Stufe machte 1-1 und 1-2 auf Normal zu leicht (0,30 Niedergestreckte), deshalb: 1-1 `h3` und die Welle in Runde 4 Stufe 2 statt 1; 1-2 `r11` und `r12` ab Normal statt nur Schwer. GDD „EP“ nachgezogen.
3. **Spielzeit:** Messpunkt im Playtest-Plan von Story 9.14 (`concept/21-gdd/playtest-akt1.md`).
4. **Schwer:** Story 9.15 nach dem Release (N3, 1-4, 1-5, 1-8).
5. **Annahmen abgenommen:** Morra wartet in 1-8 bis Runde 9, Hask bis Runde 6, Frist 1-7 zehn Runden.

**Ergebnis** (`pnpm sim --campaign act1 --runs 50`, Seed 1 / 51; Rohdaten `xp3-*.txt` im Notizordner):

| Mission | Normal vorher (Seed 1) | Normal nachher Seed 1 | Normal nachher Seed 51 | Leicht nachher | Stufe Normal vorher → nachher (erwartet) | Stufe Leicht vorher → nachher |
|---|---|---|---|---|---|---|
| Prolog | 88 % · 0,12 (zählt nicht) | 88 % · 0,12 | 78 % · 0,22 | 100 % · 0,00 | 1,5 → 1,5 (1) | 1,5 → 1,5 |
| 1-1 | 98 % · 0,44 | 98 % · 0,48 | 90 % · **0,34** | 100 % · 0,02 | 1,7 → 1,8 (2) | 1,5 → 1,6 |
| 1-2 | 100 % · 0,58 | 90 % · 0,44 | 88 % · 0,40 | 100 % · 0,06 | 2,9 → 3,2 (3) | 2,4 → 2,6 |
| 1-3 | 100 % · 0,84 | 96 % · 1,09 | 98 % · 0,78 | 100 % · 0,12 | 3,4 → 3,8 (3) | 3,1 → 3,4 |
| 1-4 | 100 % · 1,12 | 100 % · 1,06 | 100 % · 0,88 | 100 % · 0,14 | 4,0 → 4,6 (4) | 3,7 → 4,0 |
| 1-5 | 98 % · 1,10 | 100 % · 0,94 | 100 % · 0,70 | 100 % · 0,40 | 5,1 → 5,9–6,0 (5) | 4,4 → 5,0 |
| 1-6 | 98 % · 0,90 | 100 % · 1,13 | 100 % · **1,34** | 100 % · 0,36 | 5,9 → 6,9–7,0 (6) | 5,2 → 6,2 |
| 1-7 | 94 % · 0,36 | 89 % · 0,49 | 94 % · 0,74 | 100 % · 0,06 | 7,2 → **8,1–8,2** (8) | 6,3 → 7,6 |
| 1-8 | 98 % · 1,06 | 96 % · 0,98 | 96 % · 1,00 | 100 % · 0,36 | 7,9 → **8,6** (9) | 6,7 → 7,9 |

Vorher Normal 1-7/1-8 aus dem Lauf nach dem Merge mit `main` (oben). Fett = außerhalb. 1-1 (Seed 51) und 1-6 (Seed 51) liegen knapp draußen, über beide Seeds im Korridor (1-1 0,41, 1-6 1,24); Streuung eines 50er-Laufs ±0,2. Leicht bleibt überall im Korridor.

**Stand EP-Ziel:** Vor 1-7 erreicht Normal Stufe 8 (8,1–8,2). **Vor 1-8 bleibt Normal bei 8,6 statt 9** (innerhalb der Toleranz von 1, nicht markiert). 1-7 bringt in jeder Variante nur ≈ 0,5 Stufen, weil der Kampf mit der Chronik endet, bevor die meisten Gegner fallen; zwei zusätzliche Wellen in 1-7 brachten keine EP, nur mehr Niedergestreckte (verworfen). Höhere Grund-EP schieben 1-3 bis 1-6 über die Toleranz. Echte Spieler liegen höher: Mit Heimsuchungen (`--haunts`, 20 Läufe) steht die Truppe vor 1-7 auf 9,2 und vor 1-8 auf 9,5, dann allerdings 1-3 bis 1-7 über der Toleranz; N3 (zwischen 1-6 und 1-8) spielt die Simulation nicht mit. **Entscheidung Produktinhaber:** so lassen (8,6 mit Simulation ohne Heimsuchungen und Nebenquests) oder 1-7 eine eigene EP-Quelle geben (z. B. EP für die geborgene Chronik; braucht eine Regel, kein Wert).

## Was geändert wurde (nur YAML)

- **1-7 Gewölbe:** Frist 10 statt 8 Runden (alle Niederlagen lagen an der Frist; die Einstürze in Runde 5–7 bleiben). Drei Plünderer mehr aus den Seitenhallen (`p12`–`p14`) und einer in der Welle von Runde 3, nur Normal und Schwer; `p1`, `p9`, `p10` eine Stufe tiefer. Nur Schwer: zwei Wächter in der Königskammer (`p15`, `p16`), weil die längere Frist Schwer sonst auf 88 % hob; `p15` steht auf [8,3], einem der zwei Felder, die den Weg zur Chronik offen halten, ist aber schlagbar (Schwer 60 % Siege). Die neuen Plünderer tragen wie alle einen Schlüssel.
- **1-8 Die Paktwacht halten:** Fußvolk eine Stufe tiefer (4 → 3, 5 → 4); die Schützen [18,34], [11,34], [16,39] nur noch auf Schwer; auf Leicht ohne Späher und Schützen in Morras Trupp und ohne die Lanze in Runde 9. Morra kommt weiter in Runde 4 über den Pass, wartet dort auf Leicht und Normal bis Runde 9 (oder bis jemand herankommt), Rückzug in Runde 10 unverändert; Hask wartet auf Leicht und Normal in den Feldern, bis jemand herankommt, spätestens bis Runde 6 (`ai.sleeperWakePercent` auf Verteidigungskarten). Schwer wie bisher. Test `m1-8.test.ts` prüft die Profile je Schwierigkeit. Dafür je Schwierigkeit eine eigene Leutnant-Zeile (vorgesehen, `content:check` erlaubt einen je Schwierigkeit).
- **N3 Das Erbe:** Fußvolk Stufe 5 statt 6, ein Plünderer mehr in der Welle von Runde 4 (Normal, Schwer).
- **1-1 Steckbriefe:** die Schwer-Gegner `h10`, `h11` schon ab Normal.
- **Kampagne:** `expectedLevel` von 1-6 auf 6 (Kommentar sagte „technischer Startwert, final per Simulation“).
- Kein Karten-Layout geändert. Ein Versuch, den Prolog über Gegner zu verschieben, wurde zurückgenommen (siehe Offen).

Begründung, warum 1-8 über die Leutnants läuft: Auf Leicht stellten Hask, Morra, Grosk und Ulvric 50 von 55 Niedergestreckten. Ihre Stufe ist Truppenstufe + Groll (≈ 9–10), unabhängig vom Kartenwert; das Fußvolk eine Stufe tiefer zu setzen senkte Normal nur um 0,1.

## Spielzeit

Die Kampagnen-Simulation zählt jetzt je Mission Runden, Einheiten-Aktionen (Ziehen, Handeln, Nachsetzen) und die Dauer der Gegnerphasen. `battle min` = Aktionen × Sekunden je Aktion + Gegnerphasen bei „Gemeinsam“, Tempo 1×.

| Annahme | Story-Kämpfe (9) | + N1–N3 | + Szenen, Aufstellung, Heimat (≈ 5 min je Knoten) | + Neustarts (≈ 5 %) | Akt 1 |
|---|---|---|---|---|---|
| 12 s je Aktion (`--action-s 12`) | 1,9 h | 0,5 h | 1,0 h | 0,1 h | **≈ 3,5 h** |
| 20 s je Aktion | 3,1 h | 0,8 h | 1,0 h | 0,2 h | **≈ 5 h** |

Normal: ≈ 520 Aktionen und 9–10 Minuten Gegnerphasen über die neun Story-Missionen. Mission einzeln (12 s): Prolog 9, 1-1 15, 1-2 bis 1-5 und 1-7 je 9–12, 1-6 23, 1-8 14–15 Minuten.

**Bewertung:** Die Staffel hat laut GDD 25 Story-Missionen (15–30 Min., große Schlachten 30–45), 10 Nebenquests und Heimsuchungen. Gewichtet nach diesen Missionsdauern trägt Akt 1 ≈ 35 % der Staffel, also ≈ 10–12 von 30–35 Stunden. Gemessen sind es 3,5–5 Stunden: Die Kämpfe dauern im Simulator etwa halb so lange wie die GDD-Werte (1-6 23 statt 30–45 Minuten). Heimsuchungen kommen hinzu (optional, 10–20 Min. je Stück), schließen die Lücke aber nicht. **Entscheidung Produktinhaber** (siehe Offen).

## Gegnerphase auf großen Karten

Geschätzt aus dem Ereignisprotokoll der Kämpfe (`tools/enemyPhase.ts`) mit den Brett-Zeiten aus `render.yaml aiPace` und `board.ts`, Tempo 1×, ohne Kameraschwenks: eine Untergrenze. „Einzeln“ = jeder Zug nacheinander, „Gemeinsam“ = Option aus Story 15.11.

| Karte (Normal) | Ø je Gegnerphase einzeln / gemeinsam | längste einzeln / gemeinsam |
|---|---|---|
| 1-6 Paktwacht erobern | 2,6 s / 2,3 s | 11,6–13,2 s / 11,6–13,2 s |
| 1-8 Paktwacht halten | 43,6 s / 9,0 s | 68–81 s / 34–55 s |

Auf Schwer 1-8: Ø 57 s / 10 s, längste 87 s / 58 s. Das Zeitziel aus Story 15.11 (≤ 15 s mit „Gemeinsam“) hält 1-8 im Schnitt, die längsten Phasen (Runden mit vielen Schlägen nach den Wellen) nicht. 15.11 maß im Browser 9,4 s (1-6) und 2,5 s (1-8) mit allen Gegnern auf `aggressive` in Runde 1, also fast nur Wege ohne Schläge; hier zählen alle Runden eines Kampfs, und die langen Phasen sind die nach den Wellen, in denen viele Gegner zuschlagen (je Schlag ≈ 0,9 s, einzeln abgespielt). Die Schlagzeit ist aus `board.ts` übernommen (`STRIKE_MS` in `tools/enemyPhase.ts`) und muss bei Änderungen dort mitgezogen werden.

## Stand der Akzeptanzkriterien

- AK 1 teilweise: Leicht erfüllt; Normal erfüllt bis auf den Prolog (Offen 1), 1-7 und 1-8 im Mittel im Korridor, einzelne Läufe knapp draußen; Schwer nur bis 1-3 und für 1-6/1-7 erfüllt (Offen 2, 5); Goldkurve trägt; EP-Kurve trägt bis 1-6 (Offen 3).
- AK 2 teilweise: Gegnerphase gemessen; die Spielzeit passt nicht zu 30–35 Stunden (Offen 4).
- Die offenen Punkte brauchen Entscheidungen des Produktinhabers, keine weiteren Werte in dieser Story.

## Offen (Produktinhaber)

1. **Prolog-Korridor:** Auf Normal fällt im Prolog fast nur Rhen, und Rhens Fall ist die Niederlage. Mehr Druck senkt nur die Siegquote: zwei Wachen mehr ergaben 54 % Siege bei 0,47 Niedergestreckten, alle von Rhen. Vorschlag: Im Prolog nur die Siegquote als Korridor (`simulation.corridors` je Knoten), oder Rhen dort weniger angreifbar machen (Regel, nicht Wert).
2. **N3 auf Schwer:** 13–21 % Siege, fast immer fällt Tobins Vater (Zivilist, Stufe 1). Kartenwerte reichen nicht: Stufe bringt einem Zivilisten kaum TP (44 → 46), schwere Rüstung wirkt bei ihm nicht, Nahkämpfer statt Schützen brachten 21 %. Möglich: Frist kürzer, Vater mit eigener Wache, oder Schwer-Korridor für Schutzmissionen anders.
3. **Erfahrungskurve:** Vor 1-7/1-8 liegt die Truppe auf Normal 7,2/7,8 statt 8/9, auf Leicht 6,3/6,7. Entweder mehr EP in der zweiten Akthälfte (`balance.yaml`, wirkt auf alles) oder `expectedLevel` von 1-7/1-8 senken (vom Produktinhaber am 2026-10-26 gesetzt).
4. **Spielzeit:** Akt 1 ≈ 3,5–5 statt ≈ 10–12 Stunden. Entweder die Missionsdauern im GDD (15–30 Min.) und das Staffelziel sind zu hoch angesetzt, oder die Karten brauchen mehr Inhalt (Ziele, Wellen, Nebenziele). Die Zahl hängt stark an der Zeit je Aktion; eine Messung mit echten Spielern fehlt.
5. **1-8 Schwer** liegt mit Normal-Kette bei 76–84 % (vorher genauso). Zwei Schwer-Zusätze am Pass oder im Süden änderten nichts: Die Niederlagen sind Verwalter-Tode, und Verstärkungen aus dem Süden erreichen die Burg vor Runde 12 kaum.

## Status anderer Stories

- **15.2** done: Varek wird von `lucan` angesprochen (`n2_wachturm.yaml:71`, Test `act1-side-maps.test.ts:140`).
- **15.3** bleibt review: 1-1, N1, N2, N3 und 1-7 liegen auf Leicht und Normal im Korridor, der Prolog auf Normal nicht (Offen 1); N3 auf Schwer offen (Offen 2).
- **15.5** done: 1-6 und 1-8 im Korridor auf Leicht und Normal; 1-8 auf Schwer knapp darüber (Offen 5).

## Werkzeug

- `pnpm sim --campaign act1` zeigt zusätzlich je Mission Runden, eingesetzte Figuren, Aktionen, Gegnerphase (Ø und längste, einzeln/gemeinsam) und die geschätzte Kampfzeit; `--action-s` setzt die Sekunden je Aktion (Standard 12).
- `simulateCampaign` hat den Haken `onMission` (Kampagnenstand vor jeder Story-Mission), z. B. um eine Karte auf echten Ständen nachzuspielen, ohne den ganzen Akt zu rechnen.
- Tests: `tests/unit/enemy-phase.test.ts` (neue Schätzung, Zählung in der Simulation), angepasst `m1-7.test.ts` (Frist), `m1-8.test.ts` (Gegnerzahl 26/36/44, Leutnant-Zeilen je Schwierigkeit), `lieutenants-review.test.ts`, `sim-campaign.test.ts`.

## Dev Agent Record

### File List

- `content/acts/act1/maps/m1_1_steckbriefe.yaml`, `m1_7_gewoelbe.yaml`, `m1_8_paktwacht_halten.yaml`, `n3_erbe.yaml`, `content/acts/act1/campaign.yaml`, `content/acts/act1/scenes/scn.m1_7.quake.yaml` (Kommentar)
- `tools/enemyPhase.ts` (neu), `tools/simCampaign.ts`, `tools/simulate.ts`
- `tests/unit/enemy-phase.test.ts` (neu), `tests/unit/m1-7.test.ts`, `tests/unit/m1-8.test.ts`, `tests/unit/lieutenants-review.test.ts`, `tests/unit/sim-campaign.test.ts`
- `concept/21-gdd/decision-log.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Rohdaten

Simulator-Ausgaben vorher und nachher liegen im Notizordner der Sitzungsgruppe (`base-*.txt` vorher, `end-*.txt` nachher). Die Kampagnen-Tabellen sind mit `pnpm sim --campaign act1 --runs 50 --difficulty <d> [--seed 51]` nachzurechnen. Die N3- und Normal-Ketten-Werte kamen aus einem Wegwerf-Skript: `simulateCampaign` mit `onMission` speichert die Stände vor 1-7/1-8 (40 Läufe), danach wird die Karte auf jedem Stand mit `beginBattle` + `autoplay` gespielt (bei Normal-Kette mit `settings.difficulty = 'hard'`); das Skript ist nicht eingecheckt.

### Code-Review (bmad-code-review, 2026-11-06)

Vier Prüfer (Blind Hunter, Edge Case Hunter, Verification Gap, Acceptance Auditor). Behoben: Test für die KI-Profile von Hask und Morra je Schwierigkeit; Hasks Aufwachen spätestens in Runde 6 in Kommentar, Story und Log; Spielzeit nur aus im ersten Versuch gewonnenen Kämpfen (vorher Aktionen je Sieg, Gegnerphasen je Lauf), „eingesetzt“ zum Kampfbeginn, Missionen ohne Sieg ohne Zahl; `--action-s` geprüft; Schlagzeit im Test exakt; Schlüssel für die neuen Plünderer in 1-7; veraltete Kommentare (1-7 Hauptgang, N3 `expectedLevel`); Zahlen im Entscheidungslog. Zurückgestellt: Brett-Zeiten mit `board.ts` teilen statt kopieren (nur Werkzeug). Die offenen Kriterien stehen oben unter „Stand der Akzeptanzkriterien“.
