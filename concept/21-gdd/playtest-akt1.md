# Playtest Akt 1 (Story 9.14)

Prüft die MVP-Kernhypothese (GDD „Success Metrics“): *Found Family, Permadeath und wiederkehrende Feinde erzeugen Bindung, und die freundliche Optik trägt den ernsten Ton.* Läuft nach dem Release von Akt 1 auf dem veröffentlichten Build. Angelegt am 2026-11-07; vor dem Start bestätigt der Produktinhaber Termin und Tester.

## Kurzfassung

- **Wer:** 5–10 Tester, die das Spiel nicht kennen, dazu der Produktinhaber. Mindestens 2 spielen selten Taktikspiele.
- **Was:** Akt 1 vom Prolog bis 1-8 auf Normal, Tod „Standard“, auf dem eigenen Handy im Hochformat, über mehrere Tage im eigenen Tempo.
- **Bestanden**, wenn die drei GDD-Kriterien gelten (unten). Die übrigen Fragen sind Hinweise für die Abstimmung.
- **Gemessen wird außerdem die Spielzeit** (Messpunkt aus Story 15.10, Produktinhaber 2026-11-07): Die Simulation schätzt Akt 1 auf 3,5–5 Stunden, anteilig an 30–35 Stunden für die Staffel wären es 10–12.

## Ablauf

1. **Einladen:** Link auf den veröffentlichten Build (`https://maschoeller.github.io/hollow-crown/`), Hinweis „zum Startbildschirm hinzufügen“. Nur ein Satz zum Spiel: „Ein Taktikspiel, in dem gefallene Figuren für immer weg sind.“
2. **Spielen:** Neue Kampagne, Normal, Standard. Keine Hilfe außer bei Absturz oder Hänger. Fehler über Optionen → „Fehler melden“ exportieren und schicken (`pnpm report <datei>`).
3. **Nach 1-1 und nach 1-6** je eine Zwischenfrage per Nachricht: „Was war bisher am besten, was hat genervt?“
4. **Nach 1-8:** Spielzeit ablesen (Kampagnen-Bildschirm, Zeile des Spielstands) und den Bogen ausfüllen.
5. **Auswerten:** Produktinhaber trägt alle Bögen in die Tabelle unten ein und schreibt das Ergebnis mit Datum in `concept/21-gdd/decision-log.md`.

## Bogen

Kürzel: ______ · Gerät: ______ · Spielzeit laut Kampagnen-Bildschirm: ___ h ___ min · Tage gespielt: ___ · Heimsuchungen gespielt: ja / nein · Gefallene Gefährten (Namen): ______

| # | Frage | Antwort |
|---|---|---|
| K1 | Willst du Akt 2 spielen? | ja / vielleicht / nein |
| K2 | Welchen Gefährten würdest du vermissen? (Name, ohne Liste) | ______ |
| K3 | Verharmlost der Stil den Tod? (1 = gar nicht … 5 = voll) | 1 2 3 4 5 |
| H1 | Wie oft hast du eine Mission neu gestartet, und warum? | ______ |
| H2 | Hast du einen Leutnant wiedererkannt, als er zurückkam? Wen? | ______ |
| H3 | Burg in 3D: Hast du dich in der Heimat zurechtgefunden? (1–5) | 1 2 3 4 5 |
| H4 | Große Karten (1-6, 1-8): übersichtlich auf dem Handy? (1–5) | 1 2 3 4 5 |
| H5 | Höhen (Treppen, Wehrgänge, Dächer): war klar, wer wen von oben trifft? (1–5) | 1 2 3 4 5 |
| H6 | War eine Mission zu schwer oder zu leicht? Welche? | ______ |
| H7 | Wie lange hat eine Mission gefühlt gedauert: zu kurz, passend, zu lang? | ______ |

## Kriterien (GDD)

1. **K1:** mindestens 70 % antworten „ja“.
2. **K2:** mindestens die Hälfte nennt einen Gefährten beim Namen.
3. **K3:** im Mittel ≤ 2,0 und bei keinem Tester 5 (wie Tonbruch-Test F1, `concept/23-art-direction/tonbruch-test.md`).

## Spielzeit (Hinweis, kein Kriterium)

Mittel und Spanne der Spielzeit über alle Tester, getrennt nach „mit Heimsuchungen“ und „ohne“. Daraus folgt die Entscheidung aus Story 15.10: Liegt Akt 1 deutlich unter 10 Stunden, entweder das Staffelziel (30–35 Stunden) und die Missionsdauern im GDD senken oder die Akte 2 und 3 länger anlegen. Die Simulation rechnet mit 12–20 Sekunden je Aktion (`pnpm sim --campaign act1 --action-s <s>`); die gemessene Zeit je Tester zeigt, welcher Wert stimmt.

## Auswertung

| Tester | K1 | K2 | K3 ↓ | Spielzeit | Heimsuchungen | H3 | H4 | H5 | Bemerkung |
|---|---|---|---|---|---|---|---|---|---|
| Produktinhaber | | | | | | | | | |
| Tester 1 | | | | | | | | | |
| Tester 2 | | | | | | | | | |
| Tester 3 | | | | | | | | | |
| Tester 4 | | | | | | | | | |
| Tester 5 | | | | | | | | | |
| **Ergebnis** | % ja | % mit Namen | Mittel | Mittel (Spanne) | | Mittel | Mittel | Mittel | |
