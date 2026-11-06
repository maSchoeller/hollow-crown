# Story 15.5: Große Karten (1-6, 1-8)

Status: done

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
| Hask durch die Ostpforte | 1-6: Unter 40 % TP ruft Hask den Rückzug (Zeile `scn.m1_6.hask_flight`, DE und EN) und zieht mit Profil `flee` sichtbar zur Ostpforte [21,15]; dort verschwindet er und gilt als vertrieben (Groll, Kopfgeld). Trigger `t_hask_flight` in `m1_6_paktwacht.yaml` aus vorhandenen Bausteinen (`hp_below`, `set_ai`, neu nur `area` an `set_ai`); Tests `tests/unit/m1-6-paktwacht.test.ts` („Hask withdraws through the east postern“: Weg zur Pforte, nichts über der Schwelle, Replay mit gleichem `stateHash`); Szene nach 1-6 erzählt die Flucht (`scn.m1_6.outro.yaml:19`, Story 15.6). Beutefall und Vertreiber wie bei 0 TP, versperrter Weg → kämpft weiter (Tests ebd.); `content:check` prüft Einheit und Fluchtfelder von `set_ai`. 1-6 bleibt im Korridor (Normal 100 %, 1,28). Beleg `15-5-belege/hask-flucht-375x812.jpg` (aufgenommen bei 375 × 812, verkleinert gespeichert; Hask mit Leutnant-Ring im Durchgang der Ostpforte). Schwelle 40 % [C], Bestätigung Produktinhaber offen | erfüllt |
| Söldner füllen freie Plätze auf | Über die Taverne: offen ab der 3. Story-Mission (`content/core/rooms.yaml:9`), bis zu 6 Söldner zusätzlich zu den Gefährten (`content/core/balance.yaml:195`), Command `hire` (`src/core/campaign/commands.ts:40`); 1-6 hat 12, 1-8 14 Plätze (`m1_6_paktwacht.yaml:106`, `m1_8_paktwacht_halten.yaml:104`). Ohne Mira, Varek und Grosk hat die Truppe 6–7 Gefährten, mit 6 Söldnern also 12–13. Ein automatisches Auffüllen gibt es nicht | erfüllt (Produktinhaber 2026-11-06: nur über die Taverne) |

## Keine Heimsuchungen in 1-6 (Produktinhaber 2026-11-06)

`m1_6_paktwacht.yaml` trägt `noHaunts: true`, die drei Anker sind entfernt; Test `tests/unit/m1-6-paktwacht.test.ts:36` und `tests/unit/haunts.test.ts` („maps with noHaunts“).

## Rest

- 1-8 liegt außerhalb des Korridors → Story 15.10. Erledigt in 15.10 (2026-11-06): Leicht 0,36, Normal 1,21 Niedergestreckte je Lauf.
- Hasks Fluchtschwelle 40 % bestätigen (das GDD nennt nur 0 TP).
