# Story 11.27: Akt 2 abstimmen und abschließen

Status: review

## Story

Als Produktinhaber
möchte ich Akt 2 über alle Reihenfolgen abgestimmt und abgeschlossen sehen,
damit Spieler aus Akt 1 ohne Brüche und im Korridor weiterspielen.

Der PO hat die Story am 2026-11-10 vorgezogen. Der Release-Schritt (`released: true`, `content:lock`) ist nicht Teil dieser Umsetzung, Akt 2 bleibt unveröffentlicht.

## Acceptance Criteria

Siehe `concept/26-epics/epics/epic-11.md`, Story 11.27.

## Umsetzung (Pull Requests)

- **#191, Teil 1 (2-4 „Brandschneise“):** Brann trägt Stahlhelm, Lederweste und Heiltrank, die Häuser geben 150 statt 300 Gold. Schwer steigt von 0 auf 71 %, Normal von 54 auf 100 %.
- **#192, Teil 2 (2-1, 2-4, 2-6, N4, N6):**
  - Gegner je Stufe neu verteilt.
  - Die Clanälteste in N4 steht auf Stufe 12 und trägt Platte und Helm. Das Gold von N4 steigt von 1 400 auf 2 000.
  - Die Schwer-Zusätze in N6 greifen nur die Truppe an.
  - Alle Missionen liegen ohne Nebenziele in der Goldkurve von 2 000 bis 3 000.
- **#193, Teil 3 (Regel):** Im Finale 2-8 stehen die Leutnants fest auf P+1 (Kartenfeld `lieutenantLevel: position`). Groll-Waffenstufen und Groll-Fähigkeiten gelten weiter.
- **#194:** Playtest-Plan für Akt 2 in `concept/21-gdd/playtest-akt2.md`.
- **#195, Teil 4 (2-8 auf Schwer):** 30 statt 46 Gegner. Im Lab mit voller Truppe gewinnt Schwer 42,5 % statt 0 %, Leicht und Normal bleiben unverändert.
- **Akt 1:** verschiebt sich in allen Teilen um ±0,00.
- Alle Entscheidungen stehen in `concept/21-gdd/decision-log.md` (Antworten 1–9 vom 2026-11-10).

## Abweichungen vom Korridor, vom PO bestätigt (2026-11-10)

- **2-8:** Gemessen wird im Lab mit voller Truppe (Antwort 6 A). Dort liegt Normal bei 85 % und Schwer bei 42,5 %. Verkettet liegt Normal bei 5 %, weil die Sim-KI kaum anwirbt.
- **Survive-Karten auf Schwer:** 2-1 liegt bei 81 %, N4 bei 90–100 %. Für sie gilt der Korridor 30–70 % nicht (Antwort 3 A).
- **Kleine Abweichungen werden hingenommen (Antwort 5 A):** Auf Normal liegen 2-5 (0,26) und N5 (0,11) unter 0,4 Niedergestreckten, auf Leicht liegen 2-7, 2-2 und 2-4 über 0,5.
- **2-8 auf Schwer:** hat weniger Gegner als auf Leicht, 30 gegen 36. Das bleibt so (Antwort 9 A).

## Offen

- **Handytest nach `playtest-akt2.md`:**
  - **N4:** Bestätigt der Test, dass die Clanälteste fällt, wird d2 auf Normal gestrichen (Antwort 4 A). Auf Normal liegen noch 1,57 Niedergestreckte vor.
  - **2-8:** mit einer echten Truppe auf Normal und Schwer prüfen.
  - **Spielzeit:** Ziel 10–12 h.
- **Folge-Story „Die Simulation wirbt an“ (Antwort 6 B):** Der Vorschlag liegt bei der orchestrierenden Session, der PO legt die Story an. Danach Akt 2 verkettet neu messen.
- **Release-Schritt von Akt 2 (vom PO auszulösen):** `pnpm content:lock`, Fixtures der Live-Schritte, Rabatt- und Glutfunken-Prüfung.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (lenkende Session und Subagenten)

### Completion Notes List

- Die Simulationstabellen vorher/nachher stehen in den PRs #191, #192, #193 und #195.
- Ausgangswerte: `main` b197ed82, `pnpm sim --campaign act2 --runs 50` je Stufe.
