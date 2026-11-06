# Story 15.3: Kleine Karten (P, 1-1, N1, N2, N3, 1-7)

Status: review

## Story

Als Spieler
möchte ich die kleinen Karten von Akt 1 in der neuen Fassung spielen,
damit Einstieg und Nebenquests zum neuen Maßstab passen.

Umgesetzt ohne Story-Prozess mit PR #104, abgeglichen am 2026-11-06 gegen `main` (a7f4d59). Simulation: `pnpm sim <map> --runs 50`, Normal, verkettete Kampagne.

## Abgleich

| Kriterium | Nachweis | Status |
| --- | --- | --- |
| Entwürfe ersetzen die alten Karten, Feld `design:` bleibt | `content/acts/act1/maps/prologue_paktnacht.yaml:138`, `m1_1_steckbriefe.yaml:140`, `n1_ring.yaml:107`, `n2_wachturm.yaml:122`, `n3_erbe.yaml:113`, `m1_7_gewoelbe.yaml:181` (je `design:`); Diff von PR #104 (`ab4feb6`) | erfüllt |
| Gegner 2–3× so viele, schwächer | Gegner (Normal) zu Plätzen: P 11/4, 1-1 14/4, N1 15/6, N2 18/6, N3 17/6, 1-7 15/6, je wie im Entwurf (`concept/27-ueberarbeitung/levels/s1_*.yaml`); Stufen 1–5 | erfüllt (Feinabstimmung 15.10) |
| Heimsuchungs-Anker neu gesetzt | 1-1 `m1_1_steckbriefe.yaml:65` (defend, boss, escort), 1-7 `m1_7_gewoelbe.yaml:68` (rout, defend, treasure); `content:check` prüft Felder und Wege (`src/content/validate.ts`, `validateHaunts`), Test `tests/unit/haunts.test.ts` („shipped anchors and pools pass content:check“). N1–N3 sind Nebenquests ohne Anker (der Würfel nimmt nur Story-Karten). **Neu:** Prolog ohne Anker, siehe unten | erfüllt |
| Jede Karte gewinnbar | Sieg-Anteil: P 88 %, 1-1 80 %, N1 91 %, N2 86 %, N3 72 %, 1-7 89 % | erfüllt |
| Vorläufig im Korridor (Normal: Sieg 75–100 %, 0,4–1,3 Niedergestreckte je Lauf) | 1-1 (0,93), N1 (0,97), N2 (0,45) im Korridor. **Außerhalb:** P 0,12 Niedergestreckte (zu leicht), 1-7 0,17 (zu leicht), N3 72 % Sieg und 0,28 | offen → 15.10 |
| Im Prolog öffnet das Beben die Pforte | Trigger `t_quake` `prologue_paktnacht.yaml:123–129` (`set_terrain` → `door_open`); Test `tests/unit/early-maps.test.ts:102` | erfüllt |
| In 1-7 setzt der Einsturz Zeitdruck (`set_terrain`) | Trigger `t_collapse_*` `m1_7_gewoelbe.yaml:141–160`; Tests `tests/unit/m1-7.test.ts:97` (Runde 4–7), `:115`, `:136` | erfüllt |
| Alte Karten und ihre IDs entfernt | Unter `content/acts/act1/maps/` liegen nur die 12 Karten; keine Verweise mehr auf `ch01_varnhold`, `ch02_silverbrook`, `prologue_caravan` oder die mit PR #104 gelöschten Szenen (`scn.m1_5.varek_*`, `scn.m1_7.collapse`, `scn.m1_3.house_*`); Test `tests/unit/act1-side-maps.test.ts:78`. Die Karten-IDs selbst (z. B. `m1_3_silberbach`) sind geblieben, weil Spielstände sie tragen | erfüllt |

## Zusatzauftrag Produktinhaber 2026-11-06: keine Heimsuchung im Prolog

- Kennzeichen `abandoned: true` im Kartenschema (`src/content/schemas.ts`, `src/core/mapDefs.ts`), gesetzt im Prolog (`prologue_paktnacht.yaml`), dessen drei Anker entfernt sind.
- `content:check` lehnt Anker auf solchen Karten ab (`validateHaunts`), der Generator überspringt sie (`src/core/campaign/haunts.ts`, `spawnHaunts`).
- Alte Spielstände: eine offene Prolog-Heimsuchung verfällt beim Laden (`normalizeCampaign`, `hauntAnchorGone`), ein laufender Kampf darin endet auf der Weltkarte (`adoptRecord`, `staleHauntMap`). Keine Migration und kein neues Speicherformat nötig.
- Tests `tests/unit/haunts.test.ts` („abandoned maps“): mit den alten Ankern trifft der Würfel den Prolog an mehreren Tagen, mit dem neuen Stand an keinem; `content:check` lehnt Anker ab; alte Spielstände verfallen sauber. Die übrigen Heimsuchungs-Tests und der E2E-Test laufen jetzt auf 1-1 und 1-2.
- GDD-Decision-Log 2026-11-06, Art-Decision-Log (offene Frage „Heimsuchungen unter Nebel“ erledigt), Architektur §5.6.

## Rest

- P, 1-7 und N3 liegen außerhalb des Korridors → Story 15.10 (keine Abstimmung in diesem Abgleich).
- Für den Produktinhaber: weitere Akt-1-Karten, die die Truppe aus Story-Gründen nicht wieder betritt (Kandidaten, nicht entschieden): 1-7 Gewölbe (stürzt ein), 1-6 Paktwacht (wird Heimat; eine Heimsuchung in der eigenen Burg).
