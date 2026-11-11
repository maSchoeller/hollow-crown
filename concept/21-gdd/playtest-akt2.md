# Playtest Akt 2 (Story 11.27)

Prüft, ob Akt 2 „Glut“ auf dem Handy trägt: die freie Folge mit zwei Paaren, der Verrat in Kronfeld, die Balliste als neue Regel und die Höhen auf großen Karten. Dazu kommen die offenen Befunde der Abstimmung (Story 11.27, Teil 1–3), die die Simulation nicht klären kann. Läuft nach dem Abschluss von Akt 2 auf dem veröffentlichten Build. Angelegt am 2026-11-11; vor dem Start bestätigt der Produktinhaber Termin und Tester. Vorbild ist `playtest-akt1.md`.

## Kurzfassung

- **Wer:** 5–8 Tester, bevorzugt die aus dem Playtest von Akt 1, dazu der Produktinhaber. Mindestens 2 spielen selten Taktikspiele. [ASSUMPTION]
- **Was:** Akt 2 von 2-1 bis 2-8 mit N4–N6 auf Normal, Tod „Standard“, auf dem eigenen Handy im Hochformat, über mehrere Tage im eigenen Tempo. Der Produktinhaber spielt zusätzlich 2-8 auf Schwer.
- **Start:** der eigene Spielstand nach 1-8 aus dem Playtest von Akt 1. Wer keinen hat, bekommt einen Fixture-Spielstand nach 1-8 auf Normal. [ASSUMPTION]
- **Bestanden**, wenn die drei Kriterien unten gelten. Die übrigen Fragen sind Hinweise für die Abstimmung, B1–B6 die Messpunkte aus der Simulation.
- **Gemessen wird außerdem die Spielzeit:** Akt 2 soll rund ein Drittel von 30–35 Stunden dauern, also etwa 10–12 Stunden.

## Gruppen

Jede Reihenfolge soll mindestens zweimal vorkommen. Der Produktinhaber teilt die Tester vor dem Start ein und schreibt die Gruppe in den Bogen. Innerhalb der Vorgabe spielen alle frei. [ASSUMPTION]

| Gruppe | Paar 1 | Paar 2 | Nebenquests |
|---|---|---|---|
| A | 2-2 vor 2-3 | 2-5 vor 2-6 | früh: N4 direkt nach 2-3, N5 direkt nach 2-4, N6 direkt nach 2-7 |
| B | 2-3 vor 2-2 | 2-6 vor 2-5 | spät: alle offenen Nebenquests erst kurz vor 2-8 |

E7 in 2-4 (`warn` oder `obey`) wählt jeder frei, ohne Hinweis. Wählen am Ende alle dasselbe, spielt der Produktinhaber den anderen Zweig bis 2-8 nach. [ASSUMPTION]

## Ablauf

1. **Einladen:** Link auf den veröffentlichten Build (`https://maschoeller.github.io/hollow-crown/`), Gruppe und ein Satz: „Akt 2 geht weiter, wo Akt 1 aufgehört hat. Halte dich an die Reihenfolge deiner Gruppe.“
2. **Spielen:** Spielstand laden, Normal, Standard. Keine Hilfe außer bei Absturz oder Hänger; besonders nicht bei der Balliste und bei Höhen, dort zählt, ob die Lektion allein reicht. Fehler über Optionen → „Fehler melden“ exportieren und schicken (`pnpm report <datei>`).
3. **Nach 2-1, nach 2-4 und nach 2-7** je eine Zwischenfrage per Nachricht: „Was war bisher am besten, was hat genervt?“ Nach 2-4 zusätzlich: „Wie hast du dich in der Brandschneise entschieden, und warum?“
4. **Nach 2-8:** Spielzeit ablesen (Kampagnen-Bildschirm, Zeile des Spielstands), Truppe zählen (Gefährtenliste) und den Bogen ausfüllen.
5. **Auswerten:** Produktinhaber trägt alle Bögen in die Tabelle unten ein, schreibt das Ergebnis mit Datum in `concept/21-gdd/decision-log.md` und setzt die Folgen aus B1–B6 um (neue Story oder Nachtrag zu 11.27).

## Bogen

Kürzel: ______ · Gerät: ______ · Gruppe: A / B · E7: warnen / gehorchen · Spielzeit Akt 2: ___ h ___ min · Tage gespielt: ___ · Heimsuchungen gespielt: ja / nein · Truppe vor 2-8: ___ Figuren · Gefallene Gefährten (Namen): ______

| # | Frage | Antwort |
|---|---|---|
| K1 | Willst du Akt 3 spielen? | ja / vielleicht / nein |
| K2 | Kronfeld: Hast du den Verrat kommen sehen? Wer hat dich verraten, und was hast du gefühlt? | ______ |
| K3 | Balliste: Hast du sie in 2-1 selbst bedient und gewusst, wie weit sie trifft? (1 = gar nicht … 5 = sicher) | 1 2 3 4 5 |
| H1 | Höhen und Rampen (2-1 Felsnasen, 2-4 Hang, 2-7 Kai): war klar, wer wen von oben trifft und wo man hochkommt? (1–5) | 1 2 3 4 5 |
| H2 | Große Karten (2-4, 2-8): übersichtlich auf dem Handy? (1–5) | 1 2 3 4 5 |
| H3 | Hat sich die Wahl zwischen 2-2/2-3 und 2-5/2-6 wie eine echte Wahl angefühlt? Warum hast du so gewählt? | ______ |
| H4 | E7: Hast du die Folgen deiner Entscheidung später wiedererkannt (Sable, Brandhang, Preise)? | ja / teils / nein |
| H5 | Wie oft hast du eine Mission neu gestartet? Welche, und warum? | ______ |
| H6 | War eine Mission zu schwer oder zu leicht? Welche? | ______ |
| H7 | Wie lange hat eine Mission gefühlt gedauert: zu kurz, passend, zu lang? | ______ |
| B1 | 2-8: Versuche bis zum Sieg (oder aufgegeben nach ___ Versuchen); Figuren am Nordufer | ___ / ___ |
| B2 | N4: Hat die Clanälteste überlebt? Wenn nein: in welcher Runde, von wo kam der Angreifer? | ja / nein, R__ |
| B3 | 2-4 und 2-6: wie viele Figuren niedergestreckt (nicht gefallen)? | 2-4: ___ · 2-6: ___ |
| B4 | 2-4: Hat Brann überlebt, und wie viele Treffer hat er abbekommen? | ja / nein, ___ |
| B5 | Wen hast du im Kampf angesprochen und angeworben? (Jory, Ilka, Sable, Odile, Amos, Nell, Brann) | ______ |
| B6 | Gab es eine Nebenquest, die du ausgelassen hast? Warum? | ______ |

## Kriterien

1. **K1:** mindestens 70 % antworten „ja“ (wie Akt 1).
2. **K2:** mindestens die Hälfte beschreibt den Verrat als Wendung mit Gefühl („wütend“, „hab's geahnt“, „traurig“), nicht als bloße schwere Karte. [ASSUMPTION]
3. **K3:** im Mittel ≥ 3,5 und kein Tester unter 2. [ASSUMPTION]

## Befunde aus der Abstimmung (Hinweise, keine Kriterien)

Zahlen aus `pnpm sim --campaign act2` (verkettet, 50 Läufe) nach Story 11.27 Teil 1–3. Die Sim-KI spielt anders als Menschen; diese Punkte klärt nur der Test.

| # | Befund in der Simulation | Frage an den Test | Folge |
|---|---|---|---|
| B1 | 2-8 Normal verkettet 5 % Siege (`warn` 14 %, `obey` 5 %), mit voller Truppe 85 %, mit 10 Figuren auf Stufe 21 noch 40 %. Schwer 0 %, auch mit voller Truppe; Leutnants auf P−3 halfen nicht. | Gewinnen echte Spieler 2-8 auf Normal mit ihrer Truppe in ≤ 3 Versuchen? Ist es auf Schwer (Produktinhaber) überhaupt gewinnbar? | Normal: Unterscheidet sich die Quote stark nach Truppengröße (B5), liegt es an den Anwerbungen, nicht an der Karte. Schwer: bleibt es unschaffbar, eigene Story für Schwer 2-8. [ASSUMPTION] |
| B2 | N4: Die Älteste überlebt früh in 0 %, spät in 19 % – die Sim-KI schützt Dritte nur bei Siegziel `defend`. | Schützen echte Spieler sie? | Entscheidung Produktinhaber: bestätigt der Handytest das Problem, entfällt Gegner `d2` auf Normal. Bestätigt gilt es, wenn die Älteste bei mindestens der Hälfte der Tester fällt. [ASSUMPTION] |
| B3 | Normal 2-4 1,22 Niedergestreckte (Streuung 1,00–1,72), 2-6 1,17 (1,13–1,57). Ursache in 2-4 sind die Schützen a0–a3 am Hang, nicht das Feuer. | Wie viele werden bei Menschen niedergestreckt, und wer? | Mehr als 2 im Mittel: Schützen in 2-4 auf Normal ausdünnen. [ASSUMPTION] |
| B4 | Brann ist in 2-4 Gast (nicht steuerbar, `hold`) und trägt seit 11.27 Stahlhelm und Lederweste. Der Sieg auf Normal liegt bei 98 %. | Reicht die Rüstung, ohne dass Brann sich wie unverwundbar anfühlt? Merken Spieler, dass sie ihn decken müssen? | Fällt Brann bei mehr als einem Tester: Rüstung erhöhen. Merkt keiner eine Gefahr: ok, kein Handlungsbedarf. |
| B5 | Die Sim wirbt kaum an (Jory auf Schwer in 8 %), deshalb ziehen die Läufe mit 8–11 Figuren in 2-8, die volle Truppe hat 15. | Kommen echte Spieler mit einer vollen Truppe nach Kronfeld? | Liegt die Truppe meist unter 12, Beitritte deutlicher zeigen (Bark, Marker) statt Werte zu senken. [ASSUMPTION] |
| B6 | Nebenquests Normal früh und spät 91–100 % Siege; N6 auf Schwer nicht messbar. | Werden die Nebenquests gespielt, und an welcher Stelle? | Nur Hinweis. |

## Spielzeit (Hinweis, kein Kriterium)

Mittel und Spanne der Spielzeit von Akt 2 über alle Tester, getrennt nach Gruppe und nach „mit Heimsuchungen“ und „ohne“. Ziel: rund ein Drittel von 30–35 Stunden, also 10–12 Stunden. Liegt Akt 2 deutlich darunter, gilt dieselbe Abwägung wie in Akt 1 (Story 15.10): Staffelziel und Missionsdauern im GDD senken oder Akt 3 länger anlegen. Die Simulation rechnet mit 12–20 Sekunden je Aktion (`pnpm sim --campaign act2 --action-s <s>`); die gemessene Zeit je Tester zeigt, welcher Wert stimmt, zusammen mit dem Ergebnis aus dem Playtest von Akt 1.

## Auswertung

| Tester | Gruppe | E7 | K1 | K2 | K3 | H1 | H2 | Spielzeit | 2-8 Versuche (B1) | Älteste (B2) | Truppe (B5) | Bemerkung |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Produktinhaber | | | | | | | | | Normal / Schwer | | | |
| Tester 1 | | | | | | | | | | | | |
| Tester 2 | | | | | | | | | | | | |
| Tester 3 | | | | | | | | | | | | |
| Tester 4 | | | | | | | | | | | | |
| Tester 5 | | | | | | | | | | | | |
| **Ergebnis** | A: __ · B: __ | warn __ · obey __ | % ja | % mit Gefühl | Mittel | Mittel | Mittel | Mittel (Spanne) | Mittel | % überlebt | Mittel | |
