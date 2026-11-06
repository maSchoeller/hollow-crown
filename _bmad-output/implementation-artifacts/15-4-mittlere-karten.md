# Story 15.4: Mittlere Karten (1-2, 1-3, 1-4, 1-5)

Status: done

## Story

Als Spieler
möchte ich die mittleren Karten von Akt 1 in der neuen Fassung spielen,
damit die Kernmissionen Raum für mehr Gegner und Wege haben.

Umgesetzt ohne Story-Prozess mit PR #104, abgeglichen am 2026-11-06 gegen `main` (a7f4d59). Simulation: `pnpm sim <map> --runs 50`, Normal, verkettete Kampagne.

## Abgleich

| Kriterium | Nachweis | Status |
| --- | --- | --- |
| Übernommen wie in 15.3 (Entwurf, `design:`, Anker) | `m1_2_erlbach.yaml:166`, `m1_3_silberbach.yaml:143`, `m1_4_wolfslager.yaml:175`, `m1_5_hungerlager.yaml:171` (`design:`); Anker je drei (`:73`, `:67`, `:73`, `:75`), `content:check` grün | erfüllt |
| Gegner 2–3× so viele, schwächer | Gegner (Normal) zu Plätzen: 1-2 22/6, 1-3 19/7, 1-4 24/8, 1-5 27/8, je wie im Entwurf | erfüllt (Feinabstimmung 15.10) |
| Jede Karte gewinnbar, vorläufig im Korridor | 1-2 91 % / 0,57; 1-3 100 % / 1,03; 1-4 100 % / 1,06; 1-5 100 % / 1,10 (Sieg / Niedergestreckte je Lauf; Korridor 75–100 %, 0,4–1,3) | erfüllt |
| 1-3 hat das Ziel `reach` | `m1_3_silberbach.yaml:126`; Test `tests/unit/early-maps.test.ts:227` | erfüllt |
| In 1-4 löst ein Hebel den Felsrutsch aus | Hebel `m1_4_wolfslager.yaml:65`, Trigger `:168–172` (`set_terrain` → `rockwall`); Tests `tests/unit/m1-4-wolfshuegel.test.ts` („the rockfall“, 4 Fälle) | erfüllt |
| In 1-2 steht das Haus ab Runde 2, die Plünderer kommen ab Runde 4 | `m1_2_erlbach.yaml:5–6`, `:67`, `:103–119`; Tests `tests/unit/early-maps.test.ts:171` (Haus in Runde 2 erreichbar), `:187` (kein Plünderer vor Runde 4) | erfüllt |
| Verschlossene Truhen und Schlüsselträger laut GDD-Log (2026-11-01, 2026-11-05) | 1-4: Kerkermeister mit zwei Schlüsseln für zwei Truhen `m1_4_wolfslager.yaml:104`, **neuer Test** `m1-4-wolfshuegel.test.ts:59` (auch ohne Fenn nach E2 „ausliefern“); 1-5: Vorratsmeister `m1_5_hungerlager.yaml:99`, Test `tests/unit/act1-side-maps.test.ts:98`; Regel Späher/Schlüssel `src/core/battle/actions.ts:199–206`, `src/core/rules/scout.ts:23`. 1-3 hat wie im Entwurf zwei Truhen ohne Träger (Fenn oder ein gekaufter `door_key`) | erfüllt |

## Änderungen in diesem Abgleich

- `tests/unit/m1-4-wolfshuegel.test.ts`: Test für den Schlüsselträger in 1-4.

## Rest

Keiner.
