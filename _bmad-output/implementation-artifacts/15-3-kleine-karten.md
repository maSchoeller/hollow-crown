# Story 15.3: Kleine Karten (P, 1-1, N1, N2, N3, 1-7)

Status: done

## Story

Als Spieler
möchte ich die kleinen Karten von Akt 1 in der neuen Fassung spielen,
damit Einstieg und Nebenquests zum neuen Maßstab passen.

Umgesetzt ohne Story-Prozess mit PR #104, abgeglichen am 2026-11-06 gegen `main` (a7f4d59). Simulation: `pnpm sim <map> --runs 50`, Normal, verkettete Kampagne.

## Abgleich

| Kriterium | Nachweis | Status |
| --- | --- | --- |
| Entwürfe ersetzen die alten Karten, Feld `design:` bleibt | `content/acts/act1/maps/prologue_paktnacht.yaml:139`, `m1_1_steckbriefe.yaml:140`, `n1_ring.yaml:107`, `n2_wachturm.yaml:122`, `n3_erbe.yaml:113`, `m1_7_gewoelbe.yaml:181` (je `design:`); Diff von PR #104 (`ab4feb6`) | erfüllt |
| Gegner 2–3× so viele, schwächer | Gegner (Normal) zu Plätzen: P 11/4, 1-1 14/4, N1 15/6, N2 18/6, N3 17/6, 1-7 15/6, je wie im Entwurf (`concept/27-ueberarbeitung/levels/s1_*.yaml`); Stufen 1–5 | erfüllt (Feinabstimmung 15.10) |
| Heimsuchungs-Anker neu gesetzt | 1-1 `m1_1_steckbriefe.yaml:66` (defend, boss, escort), 1-7 `m1_7_gewoelbe.yaml:69` (rout, defend, treasure); `content:check` prüft Felder und Wege (`src/content/validate.ts`, `validateHaunts`), Test `tests/unit/haunts.test.ts` („shipped anchors and pools pass content:check“). N1–N3 sind Nebenquests ohne Anker (der Würfel nimmt nur Story-Karten). **Neu:** Prolog ohne Anker, siehe unten | erfüllt |
| Jede Karte gewinnbar | Sieg-Anteil: P 88 %, 1-1 80 %, N1 91 %, N2 86 %, N3 72 %, 1-7 89 % | erfüllt |
| Vorläufig im Korridor (Normal: Sieg 75–100 %, 0,4–1,3 Niedergestreckte je Lauf) | 1-1 (0,93), N1 (0,97), N2 (0,45) im Korridor. **Außerhalb:** P 0,12 Niedergestreckte (zu leicht), 1-7 0,17 (zu leicht), N3 72 % Sieg und 0,28 | erfüllt nach 15.10 (2026-11-07): 1-1, 1-7, N1–N3 im Korridor; im Prolog zählt laut Produktinhaber nur die Siegquote (80–88 %) |
| Im Prolog öffnet das Beben die Pforte | Trigger `t_quake` `prologue_paktnacht.yaml:124–130` (`set_terrain` → `door_open`); Test `tests/unit/early-maps.test.ts:102` | erfüllt |
| In 1-7 setzt der Einsturz Zeitdruck (`set_terrain`) | Trigger `t_collapse_*` `m1_7_gewoelbe.yaml:141–160`; Tests `tests/unit/m1-7.test.ts:97` (Runde 4–7), `:115`, `:136` | erfüllt |
| Alte Karten und ihre IDs entfernt | Unter `content/acts/act1/maps/` liegen nur die 12 Karten; keine Verweise mehr auf `ch01_varnhold`, `ch02_silverbrook`, `prologue_caravan` oder die mit PR #104 gelöschten Szenen (`scn.m1_5.varek_*`, `scn.m1_7.collapse`, `scn.m1_3.house_*`); Test `tests/unit/act1-side-maps.test.ts:78`. Die Karten-IDs selbst (z. B. `m1_3_silberbach`) sind geblieben, weil Spielstände sie tragen | erfüllt |

## Zusatzauftrag Produktinhaber 2026-11-06: keine Heimsuchung im Prolog

- Kennzeichen `noHaunts: true` im Kartenschema (zuerst `abandoned`, umbenannt am selben Tag, weil es auch für 1-6 und 1-7 gilt) (`src/content/schemas.ts`, `src/core/mapDefs.ts`), gesetzt im Prolog (`prologue_paktnacht.yaml`), dessen drei Anker entfernt sind.
- `content:check` lehnt Anker auf solchen Karten ab (`validateHaunts`), der Generator überspringt sie (`src/core/campaign/haunts.ts`, `spawnHaunts`).
- Alte Spielstände: eine offene Prolog-Heimsuchung verfällt beim Laden (`normalizeCampaign`, `hauntAnchorGone`; auch `hauntLast` des Prologs), ein laufender Kampf darin endet auf der Weltkarte (`adoptRecord` über `withoutStaleHauntBattle`, Eintrag im Log), der Titel zeigt ihn nicht mehr als „im Kampf“ (`campaignInfo.ts`). Keine Migration und kein neues Speicherformat nötig. Allgemein gilt: Verschwindet ein Anker aus einer Karte, verfällt eine offene Heimsuchung darauf ebenso.
- Tests `tests/unit/haunts.test.ts` („maps with noHaunts“): mit den alten Ankern trifft der Würfel den Prolog an mehreren Tagen, mit dem neuen Stand an keinem; `content:check` lehnt Anker ab; alte Spielstände verfallen sauber. Die übrigen Heimsuchungs-Tests und der E2E-Test laufen jetzt auf 1-1 und 1-2.
- GDD-Decision-Log 2026-11-06, Art-Decision-Log (offene Frage „Heimsuchungen unter Nebel“ erledigt), Architektur §5.6.

## Rest

- Bekannte Grenze: `pnpm report` auf einem Fehlerbericht aus einer älteren Version, dessen Protokoll eine Prolog-Heimsuchung spielt, bricht beim Nachspielen an diesem Befehl ab (die Heimsuchung verfällt beim Normalisieren). Betrifft nur das Werkzeug, nicht Spieler.

- P, 1-7 und N3 liegen außerhalb des Korridors → Story 15.10 (keine Abstimmung in diesem Abgleich). Stand nach 15.10 (2026-11-06): 1-7 und N3 auf Leicht und Normal im Korridor; der Prolog bleibt auf Normal bei 0,12–0,20 Niedergestreckten (Entscheidung Produktinhaber, siehe 15.10 „Offen“); N3 auf Schwer 13–21 %.
- ~~Weitere Karten ohne Heimsuchung~~: entschieden am 2026-11-06, 1-6 und 1-7 tragen ebenfalls `noHaunts: true` (PR nach #115). Folge für den Produktinhaber: Mit 1-7 fiel der einzige `treasure`-Anker von Akt 1 weg; die Truhen-Heimsuchung kommt in Akt 1 nicht mehr vor (übrig: boss, defend, rout, escort).

## Abschluss 2026-11-07

Produktinhaber: Für den Prolog gilt nur die Siegquote, nicht die Zahl der Niedergestreckten (`simulation.winOnly: [prologue]` in `content/core/balance.yaml`, GDD-Log 2026-11-07). Damit liegen alle Karten dieser Story auf Leicht und Normal im Korridor. N3 auf Schwer (13–21 % Siege) geht in Story 9.15 (nach dem Release). Status done.

