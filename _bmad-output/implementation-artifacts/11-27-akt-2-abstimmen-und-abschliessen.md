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

## Runde 2 (2026-11-14, nach Epic 10 im Build)

Gemessen mit `pnpm sim <karte> --runs 100 --fresh` (Normal, Truppe auf der Positionsstufe) und `pnpm sim --campaign act2 --runs 50`.
Grenzfälle am Korridorrand mit 100 statt 50 Läufen: bei 50 Läufen und einer Quote um 70 % liegt der Standardfehler bei etwa
6,5 Prozentpunkten (2-8 las bei 50 Läufen 70 %, bei 100 Läufen 59 %).

### Geänderte Werte

- **Balliste `ballista_bolt`: Reichweite 3–10 → 3–6** (`content/core/items.yaml`, GDD §Gelände nachgezogen). Brakka bedient die
  Balliste auf 2-1, 2-7 **und** 2-8; genau diese drei Karten lagen bei den Niedergestreckten am schlechtesten (4,06 / 3,68 / 5,67),
  jede Karte ohne Balliste bei 0,29–0,90. Danach 2-1 **99 % / 1,77** (vorher 94 % / 4,06), 2-7 **100 % / 1,60** (vorher 84 % / 3,68);
  auf Schwer kommen beide mit 69 % in den Korridor. Die Siegquote von 2-8 bleibt bei 59 % – die Karte wird also nicht vorab leichter.
- **Ysolde trägt eine Lederweste** (`content/acts/act1/units.yaml`): sie war die einzige Figur mit leerem Körperplatz und fiel in
  Akt 2 am häufigsten (2-4 40/50, 2-7 41/50, 2-1 23/50). Akt 1 verschiebt sich dadurch nicht (Siegquoten gleich, Niedergestreckte ±0,2).
- **N6: das Ostboot landet in Runde 4 statt 3** (`n6_auemarkt.yaml`), weil es neben dem Einsatzfeld landet; Sieg 62 % → 67 %.

### Gemessen und zurückgenommen, weil wirkungslos

- `crew_west` auf 2-1 nur auf Schwer: 4,12 → 4,16 Niedergestreckte.
- Die ganze Boots-Welle auf N6 nur auf Schwer: 70 → 74 % bei 200 Läufen, also ein Standardfehler.
- Ein Wellen-Schütze auf 2-4 nur auf Schwer: 3,06 → 2,92 Niedergestreckte.

### Annahmen aus Epic 10

| Story | Ergebnis |
|---|---|
| 10.8 Übungsplatz | **bestätigt.** 14–45 Reserve-EP je Mission, Reserve-Stufen 7,4–15,1; die Reserve bleibt 5–8 Stufen hinter der Armee, auch weil die Heuristik den Übungsplatz zuletzt baut. |
| 10.9 Händler Stufe 2 | **bleibt offen – mit `pnpm sim` nicht prüfbar.** Die Heimat-Heuristik kauft nur Heilgegenstände, nie Rüstung oder Zubehör; die seltenen Teile werden in keinem Lauf gekauft. |
| 10.10 Konvoi | **bestätigt.** Reine Freischalt-Bedingungen, die Simulation ruft sie nie auf – genau das behauptet die Annahme. |
| 10.11 Taverne/Heiler/Schmied | **bestätigt.** Wunschrolle und Trankverstärkung sind Freischalt-Bedingungen; die Trauer-Tabelle wirkt echt, ist aber bei 50 Läufen nicht zu isolieren. |
| 10.12 Söldner-Traits | **bestätigt.** A/B mit gleichen Seeds: kleine Unterschiede mit wechselndem Vorzeichen, Siegquoten je innerhalb eines Standardfehlers. |

### Weiter außerhalb des Korridors (Entscheidung des Produktinhabers offen, [ASSUMPTION])

- **N6** Normal 67 % (ab 75 %) und Schwer 5 % (ab 30 %). Rhen fällt, und Rhens Fall ist die Niederlage: fast alle Eintreiber tragen
  `ai.prefer: player`, Rhen ist Pflicht-Einsatz. `prefer: player` wegzunehmen ist keine Option (ohne es fiel die Meisterin 20 von 20 Mal).
  Naheliegend wäre, die Stufen der Eintreiber zu senken oder Rhen vom Pflicht-Einsatz zu nehmen – beides Spieldesign.
- **2-4** Normal 2,92–3,06 Niedergestreckte und Schwer 80 % (zu leicht). Ysolde fällt auch mit Weste in 41 von 50 Läufen.
- Kleine Abweichungen: 2-1 1,77 und 2-7 1,60 auf Normal, 2-3 0,29, 2-1 auf Leicht 0,76.
- Auf Schwer unter 30 %: 2-8 (21 %), N4 (27 %), N6 (5 %).

### Nicht angetastet, nur gemessen

2-8 Normal 59 % / 6,60, Schwer 21 % / 9,19; N4 Normal 97 % / 1,75, Schwer 27 % / 5,42. Verkettet mit Nebenquests liegt 2-8 bei 71 %,
ohne sie bei 32–37 %. Die Niedergestreckten von 2-8 steigen durch die kürzere Ballisten-Reichweite leicht (5,67 → 6,60), weil auch die
Truppe die Hügelballiste schlechter nutzt.

## Runde 3 (2026-11-14, nur Schwer)

Der Produktinhaber hat N6 auf Normal und 2-4 bis zu seinem Handy-Durchlauf zurückgestellt und dafür Schwer freigegeben:
2-8, N4 und N6 sollen über 30 % kommen. Alle Eingriffe sind schwierigkeitsgebunden, je 100 Läufe `--fresh`.

| Karte | Schwer vorher | Schwer nachher | Änderung |
|---|---|---|---|
| 2-8 | 21 % | **39 %** | `n4` (zweiter Nordritter) und `n7` (Nordheiler) auf `[easy, normal]`; Schwer 28 statt 30 Gegner |
| N4 | 27 % | **34 %** | Schwer-Zusatzgegner `h1`, `h2`, `h3` gestrichen; `a4` und `b3` bleiben |
| N6 | 5 % | **53 %** | die fünf Bootsleute tragen auf Schwer `ai.prefer: player` wie die übrigen Eintreiber |

Ursachen, aus dem Ausfall-Protokoll der Basismessung: auf 2-8 fielen Rhen (57 von 100) und Lucan (22) – beides die
Niederlage – beim Durchbruch nach Norden, dem Fluchtweg; auf N4 fiel Rhen in 73 von 100 Läufen; auf N6 starb in
57 von 100 Läufen die **Gauklermeisterin**, nicht Rhen.

### N6: Ausdünnen hilft hier nicht

- `prefer: player` auf dem Schwer-Schützen `h2`: **wirkungslos**, Ergebnis bis auf die Ziffer gleich. Er hält auf
  [12,3], die Meisterin steht auf [10,5] – vier Felder bei Bogenreichweite 2, er kann sie nie treffen.
- `h1` und `h3` streichen: **schlechter** (5 % → 2 %, Tode der Meisterin 57 → 81). Mit weniger Gegnern zieht die
  Truppe schneller nach Norden, und die Meisterin folgt ihr (`profile: follow`) in die Boote hinein.
- Erst die Zielwahl der Boote löst es: die Meisterin stirbt in keinem Lauf mehr, übrig bleibt Rhens Fall (45 von 100).

### Leicht und Normal gegengemessen

Normal Ziffer für Ziffer wie in Runde 2: 2-8 59 % / 6,60, N4 97 % / 1,75, N6 67 % / 0,98. Leicht alle drei 100 %
(Niedergestreckte 0,75 / 0,00 / 0,05). 2-8 auf Leicht liegt mit 0,75 über dem Korridor von 0,5 – unverändert aus der
Zeit davor, kein Rückschritt dieser Runde.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (lenkende Session und Subagenten)

### Completion Notes List

- Die Simulationstabellen vorher/nachher stehen in den PRs #191, #192, #193 und #195.
- Ausgangswerte: `main` b197ed82, `pnpm sim --campaign act2 --runs 50` je Stufe.
