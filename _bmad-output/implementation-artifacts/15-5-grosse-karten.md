# Story 15.5: Große Karten (1-6, 1-8)

Status: review

## Story

Als Spieler
möchte ich die Paktwacht auf großen Karten erobern und halten,
damit die Wendepunkte des Akts als Schlachten wirken.

Umgesetzt ohne Story-Prozess mit PR #104, abgeglichen am 2026-11-06 gegen `main` (a7f4d59). Simulation: `pnpm sim <map> --runs 50`, Normal, verkettete Kampagne.

## Abgleich

| Kriterium | Nachweis | Status |
| --- | --- | --- |
| Entwürfe 1-6 und 1-8 übernommen (je 30 × 40, gespiegelt), `design:` bleibt | `m1_6_paktwacht.yaml:213`, `m1_8_paktwacht_halten.yaml:208` (`design:`); Test `tests/unit/m1-6-paktwacht.test.ts:36` (30 × 40, 12 Plätze), `tests/unit/m1-8.test.ts:166` (Gelände von 1-6, Ostpforte vermauert) | erfüllt |
| Gegner 2–3× so viele, schwächer | 1-6: 28 / 31 / 43 Gegner (Leicht / Normal / Schwer) bei 12 Plätzen, Test `m1-6-paktwacht.test.ts:36`; 1-8: 29 / 39 / 44 bei 14 Plätzen, Test `m1-8.test.ts:141` | erfüllt (Feinabstimmung 15.10) |
| Beide Karten gewinnbar | 1-6 100 %, 1-8 100 % Sieg; Test `m1-6-paktwacht.test.ts:131` (Simulator nimmt den Weg über den Hebel und erobert den Thron) | erfüllt |
| Vorläufig im Korridor (Normal: Sieg 75–100 %, 0,4–1,3 Niedergestreckte je Lauf) | 1-6: 1,28 (im Korridor). **1-8: 2,00 (zu schwer)** | offen → 15.10 |
| Morra kommt durchs Westtor | 1-8: Welle über den Wachpass ab Runde 4, Westtor offen; Tests `m1-8.test.ts:155`, `:185` (Weg zu Fuß über [6,5] in den Burghof) | erfüllt |
| Hask durch die Ostpforte | 1-6: Ostpforte [21,15] offen (Test `m1-6-paktwacht.test.ts:97`). Seine Flucht durch die Pforte über den Ziegenpfad steht nur als Kommentar und Planungs-Pfeil in der Karte (`m1_6_paktwacht.yaml:10`, `:222`); im Spiel verschwindet ein Leutnant bei 0 TP wie überall, ohne sichtbaren Weg und ohne eigene Zeile | offen, Entscheidung Produktinhaber |
| Söldner füllen freie Plätze auf | Über die Taverne: offen ab der 3. Story-Mission (`content/core/rooms.yaml:9`), bis zu 6 Söldner zusätzlich zu den Gefährten (`content/core/balance.yaml:195`), Command `hire` (`src/core/campaign/commands.ts:40`); 1-6 hat 12, 1-8 14 Plätze (`m1_6_paktwacht.yaml:106`, `m1_8_paktwacht_halten.yaml:104`). Ohne Mira, Varek und Grosk hat die Truppe 6–7 Gefährten, mit 6 Söldnern also 12–13. Ein automatisches Auffüllen gibt es nicht | erfüllt in dieser Lesart, Bestätigung Produktinhaber |

## Rest

- 1-8 liegt außerhalb des Korridors → Story 15.10.
- Hask durch die Ostpforte: Soll seine Flucht sichtbar werden (z. B. Profil `flee` zur Pforte bei niedrigen TP oder eine Kampfzeile), oder reicht die offene Pforte? Szenen gehören zu 15.6, ein Fluchtweg wäre eine neue Regel.
- Söldner: bestätigen, dass „füllen freie Plätze auf“ das Anheuern in der Taverne meint und kein automatisches Auffüllen der Aufstellung.
