# Story 15.2: Neue Kampagnenfolge von Akt 1

Status: review

## Story

Als Spieler
möchte ich Akt 1 in der Folge der abgenommenen Missionsliste spielen,
damit Weg und Geschichte zusammenpassen.

Umgesetzt ohne Story-Prozess mit PR #104, abgeglichen am 2026-11-06 gegen `main` (a7f4d59).

## Abgleich

| Kriterium | Nachweis | Status |
| --- | --- | --- |
| Folge `P → 1-1 → (1-2 ∥ 1-3) → 1-4 → 1-5 → 1-6 → 1-7 → 1-8` | `content/acts/act1/campaign.yaml` (Knoten `prologue` … `m1_8`, `requires`); neuer Test `tests/unit/act1-campaign-order.test.ts` („allows exactly P, 1-1, the pair … then 1-4 to 1-8“, zählt alle erlaubten Reihenfolgen auf: genau zwei) | erfüllt |
| Höchstens 2 offene Story-Missionen, Nebenquests zählen nicht | `src/core/campaign/graph.ts:13` (`storyCount` nur `kind: story`); Test `act1-campaign-order.test.ts` („never has more than 2 story missions open at once“) | erfüllt |
| N1 nach E2 „schützen“, N2 nach 1-5, N3 nach 1-6 | `campaign.yaml` (Knoten `m1_4` mit `openQuest: n1` bei `e02: protect`, `n1`, `n2`, `n3`); Tests `act1-campaign-order.test.ts` („opens the side quests where the list puts them“), `tests/unit/m1-4-wolfshuegel.test.ts:133` | erfüllt |
| Ein Test prüft jede erlaubte Reihenfolge, keine hat dasselbe Ziel zweimal hintereinander | Test `act1-campaign-order.test.ts` („no order has the same goal twice in a row, also across the pair“): escape → rout → defend/reach → reach/defend → boss → survive → seize → treasure → defend | erfüllt (neu) |
| Varek tritt nur noch über N2 bei | `content/acts/act1/units.yaml:105` (`joins: n2`), einzige Kartenfigur `content/acts/act1/maps/n2_wachturm.yaml:71`; Tests `tests/unit/act1-side-maps.test.ts:74` (1-5 ohne Varek), `:137` | erfüllt |
| … wenn **Lucan** ihn anspricht | `n2_wachturm.yaml:71` hat `recruit: { by: [kael] }`; die Umbenennung Kael → Lucan gehört zu Story 15.6 (läuft parallel) | offen, hängt an 15.6 |
| Der Weg ohne Varek läuft durch alle Szenen | Prüfung `src/content/validate.ts:354` (jede Sprecherkette endet bei Avatar/Kael oder hat `fallback: skip`), Test `tests/unit/scene.test.ts:121` (alle Szenen auch ohne Gefährten); neuer Test `act1-campaign-order.test.ts` („runs through every scene of every node without Varek“) für beide Reihenfolgen samt N1–N3 | erfüllt (neu) |

## Änderungen in diesem Abgleich

- Neuer Test `tests/unit/act1-campaign-order.test.ts` (Reihenfolgen, offene Missionen, Ziele, Nebenquests, Szenen ohne Varek).

## Rest

- Varek spricht an: `lucan` statt `kael` in `n2_wachturm.yaml:71` und im Test `act1-side-maps.test.ts:137`. Kommt mit Story 15.6; danach diese Zeile prüfen und die Story auf done setzen.
