---
title: "Hollow Crown – Game Design Document (Staffel 1)"
game_type: turn-based-tactics (sekundär: rpg)
platforms: Handy-Browser im Hochformat (PWA), PC-Browser, später Capacitor
status: final
created: 2026-10-23
updated: 2026-10-23
source: concept/20-game-brief/brief.md
decisions: concept/21-gdd/decision-log.md
supersedes: Spielmechanik in concept/01-decisions.md (G*, U*, O1, O2, D3/D11/D18) sowie concept/02-core-loop.md, 04 §4, 07
---

# Hollow Crown – Game Design Document (Staffel 1)

> Das GDD ist die Quelle der Wahrheit für die Spielmechanik von Staffel 1. Herleitungen stehen in `decision-log.md`, übernommene Proof-of-Concept-Regeln mit Herkunft in `extract-01-decisions.md`, die Epic-Aufteilung in `epics.md`. Alle Zahlen sind Startwerte für das Balancing per Simulation. Kürzel wie G4 oder U14 verweisen auf `concept/01-decisions.md`.

## Executive Summary

### Kernkonzept

Hollow Crown ist ein rundenbasiertes Taktik-RPG fürs Handy im Hochformat. Der Spieler führt die Söldnertruppe **Aschenbanner** durch Staffel 1: drei Akte, 25 Story-Missionen, 10 Nebenquests und täglich wechselnde **Heimsuchungen**, in denen benannte Leutnants auf bekannte Karten zurückkehren. Zwischen den Missionen ist die **Heimat-Burg** das Zuhause der Truppe. Jede Figur kann dauerhaft fallen.

- **Kernfantasie:** *Führe eine Truppe liebenswerter Außenseiter durch einen Krieg, der nicht ihrer ist, und bring so viele wie möglich heim.*
- **Gefühl danach:** Stolz auf die eigene Familie, Wehmut über die Gefallenen, Neugier, was hinter der hohlen Krone steckt.
- **Ton:** warm-ernst, ähnlich wie bei Ghibli. Freundliche Bilder, ernste Themen (Opfer, Macht, Schuld), viel Herz und Humor in der Truppe.
- **Welt:** Valmora, der gebrochene Drachenpakt, die hohle Krone und die Frage, wer König Aldric IV. getötet hat. Die Ausarbeitung liefert die Narrative-Etappe.

### Zielgruppe

Primär Fans von Fire Emblem, Advance Wars und Triangle Strategy (20–45 Jahre), die auf dem Handy 10–30 Minuten am Stück spielen und Gacha-Mechaniken leid sind. Sekundär Spieler von Battle Brothers, Wartales und Darkest Dungeon, denen der grimmige Stil zu schwer ist. Taktikspiele im Hochformat sind kaum besetzt.

### Alleinstellungsmerkmale

1. Story-Taktik mit echter Ausrüstungstiefe, gebaut fürs Hochformat.
2. **Rollenklassen:** Die Klasse bestimmt, wie sich eine Figur auf der Karte verhält; Waffe, Element und die meisten Skills bestimmt die Ausrüstung.
3. **Leutnants, die nie sterben:** Sie fliehen bei 0 TP, tragen Groll gegen ihren Vertreiber und suchen täglich bekannte Karten heim.
4. Eine Heimat-Burg, die mit der Truppe wächst, und eine Gedächtnishalle für die Gefallenen.

## Goals and Context

### Projektziele

- Eine runde erste Staffel (30–35 Stunden auf Normal), Akt für Akt veröffentlicht; Akt 1 ist der MVP.
- MVP-Kernhypothese: *Found Family, Permadeath und wiederkehrende Feinde erzeugen Bindung, und die freundliche Optik trägt den ernsten Ton.*
- Leidenschaftsprojekt eines Solo-Entwicklers mit KI-Unterstützung; keine Monetarisierung in V1.

### Hintergrund

Der Proof of Concept (Prolog, Kap. 1–2) hat Kampfgefühl und Bedienung bestätigt. Seine Regeln bleiben die Basis (`extract-01-decisions.md`). Neu sind Kampagnenstruktur, Leutnants, Weltkarte, Burg, Rollenklassen und Entscheidungen. Siegel (→ Glutfunke) und Scharmützel (→ Heimsuchungen) sind abgelöst.

## Core Gameplay

### Säulen

| Säule | Was sie im Design entscheidet |
|---|---|
| **Jeder zählt** | Jeder Story-Gefährte hat Stimme, feste Support-Partner, Narben und eine Epilog-Kachel. Ein Tod hinterlässt sichtbare Spuren: Gedenkstein, leerer Platz in der Burg, Trauer beim Partner. Wiederbelebung gibt es nicht. Auch Söldner aus der Taverne bekommen einen Gedenkstein. |
| **Ausrüstung ist der Charakter** | Waffe, Element, Statuschance und die meisten Skills kommen aus der Ausrüstung. Die Klasse legt die Rolle fest: Bewegung, erlaubte Waffengruppen, eine Klassen-Aktion und das Wachstum. |
| **Lesbare Taktik** | Volle Information: exakte Kampfvorschau, Gefahrenzonen, fester Schaden, geglätteter Zufall. Flucht, Groll, Verbluten und Verstärkungen werden vorher angezeigt; einzige Ausnahme sind Hinterhalte auf Schwer. Eine Niederlage soll sich wie ein eigener Fehler anfühlen. |

**Randbedingung:** daumenfreundlich. Ein Zug ist mit einer Hand in höchstens 3 Taps je Einheit spielbar (wählen, Ziel, bestätigen); nach jeder Aktion wird gespeichert.

### Kernloop

1. **Mission** (10–45 Min.): Truppe aufstellen, auf der Diorama-Karte bewegen und angreifen, Ziele erfüllen, Leutnants vertreiben.
2. **Ergebnis:** EP, Beute, Kopfgeld; Gefallene und Narben werden sichtbar.
3. **Heimat** (Lager zu Beginn von Akt 1, Burg ab Mission 1-6): ausrüsten, aufwerten, Räume ausbauen, Gespräche führen, Gefallene ehren.
4. **Weltkarte:** nächste Story-Mission, Nebenquest oder Heimsuchung wählen.

### Rückverfolgung: Mechanik → Säule → Epic

| Mechanik | Dient | Epic |
|---|---|---|
| Rollenklassen, Klassen-Aktionen | Ausrüstung ist der Charakter, Lesbare Taktik | E1 |
| Leutnants (Flucht, Groll) | Lesbare Taktik (sichtbare Regel); Kernhypothese „wiederkehrende Feinde“; Jeder zählt (Groll trifft eine bestimmte Figur) | E2 |
| Weltkarte, Heimsuchungen | Kernloop (Rückkehr, Material und Beute für die Ausrüstung) | E3 |
| Entscheidungen, Epilog-Mosaik, Supports | Jeder zählt | E4 |
| Stufen, Glutfunke, Wirtschaft | Ausrüstung ist der Charakter; Jeder zählt (Wahl, wer aufsteigt) | E5 |
| Burg, Gedächtnishalle, Übungsplatz | Jeder zählt | E6 |
| Chibi-Stil, Audio, Teilvertonung | Ton der Kernfantasie | E7 |
| Story-, Nebenquest- und Leutnant-Inhalte | alle | E8–E10 |

### Sieg und Niederlage

- **Mission gewonnen:** Hauptziel erfüllt (siehe Missionsziele). Leutnants und Bosse mit Fluchtregel gelten als besiegt, sobald sie geflohen sind.
- **Mission verloren:** Avatar oder Kael fällt auf 0 TP; ein Schutzziel fällt (`defend`, `escort`, `protect_npc` als Pflicht); bei `defend` erreicht ein Gegner das Verteidigungsfeld; bei `treasure` läuft das Rundenlimit ab. `survive` gewinnt man durch Erreichen des Rundenlimits. **`defend` und `survive` enden vorzeitig mit dem Sieg**, sobald kein Gegner mehr auf dem Feld steht und keine Verstärkungswelle oder kein Spawn-Trigger mehr aussteht (leere Runden müssen nicht übersprungen werden); ein gefallenes Schutzziel verliert weiterhin zuerst.
- **Neustart:** setzt alles auf den Missionsbeginn bzw. Rundenbeginn zurück, auch Tode.

| Tod-Modus | Runde neu starten | Mission neu starten | Spielstände |
|---|---|---|---|
| Klassik | nein | nur nach Niederlage | 1 pro Kampagne; Export nur als Backup, Import überschreibt |
| Standard | ja | jederzeit | Auto-Save + 3 Plätze, Export/Import |
| Casual | ja | jederzeit | Auto-Save + 3 Plätze, Export/Import |

- **Mission verlassen** (Rückkehr zur Weltkarte, Kampf verworfen, Kampagne unverändert): in Standard und Casual jederzeit, in Klassik nur vor der ersten Aktion (Story 1.9).

- **Staffel:** endet mit dem Finale von Akt 3 und dem Epilog-Mosaik.

## Game Mechanics

### Primäre Mechaniken (übernommen)

Die Kampfregeln des Proof of Concept gelten unverändert; Formeln und alle Werte in `extract-01-decisions.md`:

- **Zug:** Phasen Spieler → Gegner → Dritte Partei; je Einheit Bewegung + 1 Aktion; Bewegung bis zur Aktion zurücknehmbar.
- **Treffer/Schaden/Krit:** Treffer = Hit + 2×SKL + ⌊LCK/2⌋ ± 15; Ausweichen = 2×AS + LCK + Gelände; die Trefferchance ist der Mittelwert aus 2 Würfen. Schaden = ⌊(Angriff × Eff + Dreieck ± 1 − DEF/RES) × Element⌋. Krit = Crit + ⌊SKL/2⌋ − LCK, ×3. Doppelangriff ab 4 AS Vorsprung.
- **Waffendreieck** Schwert > Axt > Lanze > Schwert (±15 Treffer, ±1 Schaden); **Effektivität** ×3 Mt.
- **Elemente** Feuer > Wind > Erde > Wasser > Feuer, Licht ↔ Dunkel (×1,2 / ×0,8), Element + Dreieck max. +40 %.
- **Status** (2 Runden): Brennen 10 % max. TP, Nass −3 SPD, Verlangsamt −1 MOV, Rückstoß 1 Feld.
- **Supports** C/B/A/S mit Nachbarbonus, Tandem ab B (50 %), Schutz ab A (20 %/30 %), Trauer −10 Treffer für 3 Missionen.
- **Tod-Modi:** Klassik sofort tot; Standard niedergestreckt → Bergen (Narbe) → sonst Tod; Casual Rückzug ohne Narbe. Avatar oder Kael bei 0 TP = Niederlage.
- **Verbluten (Standard):** Niedergestreckte sterben nach **3 eigenen Phasen** ohne Bergen; jeder weitere Treffer tötet sofort; der Zähler ist sichtbar. Nach 2 Narben ist der nächste 0-TP-Fall tödlich.
- **Befehl** (Avatar) und **Sammelruf** (Kael), je 1×/Karte.

### Leutnants

12 benannte, handgeschriebene Unterführer (4 pro Akt), jeder mit Porträt, Signaturwaffe, 3 Groll-Fähigkeiten und Groll-Zeilen.

| Regel | Wert |
|---|---|
| Kampf | wie normale Gegner |
| Bei 0 TP | **Flucht** statt Tod; verlässt die Karte; zählt für Ziele als besiegt; die Vorschau zeigt „flieht“ |
| Tod | nie; Leutnants kehren unbegrenzt wieder |
| Stufe | Durchschnitt der 6 stärksten Einheiten der Armee + Groll |
| Groll | 0–3; +1 je Vertreibung. Jede Groll-Stufe gibt +1 Ausrüstungs-Tier und schaltet eine der 3 Groll-Fähigkeiten frei. Entscheidungen können Groll um 1 senken |
| Groll-Ziel | die Einheit, die ihn zuletzt vertrieben hat; die KI gewichtet sie mit +20; beim Wiedersehen spricht er eine Groll-Zeile. Stirbt das Ziel, bleibt der Groll und richtet sich nach der nächsten Vertreibung neu aus; bis dahin eine Gedenk-Spottzeile |
| Kopfgeld | 200 × (Groll + 1) Gold + 1–2 Material des Akts `[ASSUMPTION]` |
| Signatur-Item | 10 % je Vertreibung, garantiert bei der 4. Vertreibung desselben Leutnants `[ASSUMPTION]` |
| Erste Begegnung | Akt 1, Story-Mission 2 |

Bosse der Story können dieselbe Fluchtregel haben; Wendungen wie ein Seitenwechsel sind Sache der Narrative.

### Rollenklassen

Die **Klasse ist eine Rolle**: Bewegungstyp, erlaubte Waffengruppen, eine Klassen-Aktion, Wachstumsprofil. Waffe, Element und Item-Skills kommen aus der Ausrüstung. Jede Klassen-Aktion ersetzt die Aktion des Zugs, außer Nachsetzen.

| Rolle | Bewegung (MOV) | Waffengruppen | Klassen-Aktion | Profi A / Profi B |
|---|---|---|---|---|
| **Vorkämpfer** | Gepanzert (4) | Lanze, Axt, Schild | **Halten** (passiv): Gegner, die ein Nachbarfeld betreten, beenden dort ihre Bewegung | Bollwerk (Schutz für Nachbarn +10 %) / Sturmbrecher (jeder Treffer mit Rückstoß 1 Feld) |
| **Plänkler** | Fuß (6) | Schwert, Dolch | **Nachsetzen** (passiv): nach dem Angriff Restbewegung nutzen | Klingentänzer (+15 Ausweichen, +10 Krit) / Duellant (Konter schlagen zuerst) |
| **Schütze** | Fuß (5) | Bogen | **Zielen:** ohne Bewegung angreifen → +1 Reichweite, +15 Treffer | Scharfschütze (Reichweite bis 4) / Waldläufer (Bogen + Schwert, Wald kostet 1) |
| **Elementarist** | Fuß (5) | Zauber | **Wirken:** Elementfeld der eigenen Zauberwaffe auf ein Feld in Reichweite, 2 Runden (Feuer → Brand, Wasser → löscht und macht Nass, Erde → Felswall, Wind → lichtet Nebel Radius 2) | Weiser (Wirken im Radius 1) / Hexer (Dunkel, Statuschance +20 %) |
| **Heiler** | Fuß (5) | Stab, Licht | **Fernbergen:** Niedergestreckte auf bis zu 2 Feldern Distanz bergen | Bischof (Heilen im Radius 1) / Kampfpriester (Stab + Hammer) |
| **Späher** | Fuß (6), Kletterer | Dolch, leichter Bogen | **Öffnen/Stehlen:** Türen und Truhen ohne Schlüssel; ein nicht ausgerüstetes Item eines Nachbarn stehlen; +2 Sicht im Nebel | Schatten (im Nebel für Gegner unsichtbar, bis er angreift) / Fallensteller (max. 2 Fallen gleichzeitig, für Gegner unsichtbar, bis Missionsende: 8 Schaden + Verlangsamt; Fallen entschärfen) |
| **Spielmann** | Fuß (5) | Dolch, Laute | **Anfeuern:** ein Nachbar erhält bis Zugende +1 MOV und +10 Treffer | Barde (Radius 2, max. 2 Ziele) / Bannerträger (Nachbarn ignorieren Trauer, +5 Ausweichen) |
| **Taktiker** (nur Avatar) | Fuß (5) | Schwert, Zauber | **Befehl** 1×/Karte | Großstratege (Befehl 2×/Karte) |
| **Hauptmann** (nur Kael) | Fuß (5) | Schwert, Lanze | **Sammelruf** 1×/Karte | Bannerherr (Sammelruf Radius 3) |

- 20 Story-Gefährten, 2–3 je Rolle; sie unterscheiden sich über Wachstum, persönlichen Skill und Startausrüstung.
- PoC-Klassen werden umgemappt: Söldner/Held → Plänkler, Soldat/Ritter → Vorkämpfer, Kämpfer → Vorkämpfer oder Plänkler, Schütze → Schütze, Magier → Elementarist, Kleriker → Heiler. `[ASSUMPTION: Basiswerte und Wachstum je Rolle aus den PoC-Klassen abgeleitet]`
- Gegnerklassen (Bandit, Wolfsreiter, Pegasusritter, Ritter, Glut-Fanatiker, Drache, Monster) dürfen eigene Regeln haben.
- Eine Kontrollzone hat nur der Vorkämpfer.

### Steuerung und Eingabe

Tippen zum Wählen mit Geistervorschau, Aktionsleiste unten; Bewegung bis zur Aktion zurücknehmbar; Pinch bzw. Mausrad wechseln 3 Zoomstufen; Langdruck zeigt Infos; Tippen auf einen Gegner bei gewählter Einheit öffnet die Vorschau. Maus am PC ist Pflicht. Details in der UX-Spezifikation (U5, U6, U20, D9, D10).

## Turn-Based Tactics Specific Design

### Raster und Bewegung

- Quadratisches Raster, 4 Richtungen, keine Diagonalen. Reichweiten werden in Feldschritten gezählt (Manhattan). Höhe ist nur optisch.
- Durch Verbündete darf man hindurchziehen, aber nicht auf ihnen stehen bleiben. Gegner blockieren, auch niedergestreckte.
- Angriffe brauchen keine Sichtlinie. Im Nebel blockieren Mauern und geschlossene Türen die Sicht `[ASSUMPTION]`.

| Gelände | Fuß | Gepanzert | Beritten | Flieger | Monster |
|---|---|---|---|---|---|
| Ebene, Straße, Brücke, Asche, Gras | 1 | 1 | 1 | 1 | 1 |
| Wald, Sand | 2 | 3 | 3 | 1 | 2 |
| Seichtes Wasser | 3 | – | 4 | 1 | 2 |
| Berg | – (Kletterer 3) | – | – | 1 | 3 |
| Fluss, tiefes Wasser | – | – | – | 1 | – |
| Festung, Thron, Dorf, Tor | 1 | 1 | 1 | 1 | 1 |
| Mauer, geschlossene Tür, Felswall | – | – | – | – | – |
| Brennendes Feld | 2 | 2 | 2 | 1 | 2 |

### Einheitentypen und Klassen

Siehe **Rollenklassen**. Gegner pro Akt `[ASSUMPTION]`: Akt 1 Banditen, Wolfsreiter (zu Fuß mit Wolfsfell; Reittiere und Vierbeiner erst nach dem MVP), Söldner; Akt 2 Eisenmark-Truppen, Ritter, Pegasusritter, Ballisten; Akt 3 Glut-Orden, Untote in Ruinen, Drachen. Rund 10 Gegnertypen.

### Aktionsökonomie

- Je Einheit pro Spielerphase: Bewegung + 1 Aktion (Angriff, aktive Klassen-Aktion, Item, Ansprechen, Bergen, Interagieren, Warten).
- Freie Aktionen ohne Zugende: Tauschen 1×, Konvoi 1× (neben Kael), Waffenwechsel unbegrenzt.
- Keine Gelegenheitsangriffe; einzige Bewegungssperre ist Halten des Vorkämpfers.
- Feste Phasenreihenfolge; kein Zeitlimit pro Zug. Haben alle Einheiten gehandelt, endet die Spielerphase automatisch.

### Gegner-KI

- Profile: aggressive, hold, guard, trigger, hunt, raider, flee, support. Ziel-Wertung: Schaden + 50 × Kill-Chance − 0,5 × Konter, Heiler +10, niedrigste TP +5, Missionsziel +30, Groll-Ziel +20; auf Schwer −5 je bereits angreifendem Gegner (Verteilung).
- Zugreihenfolge zu Phasenbeginn: erst Kill-Chance, dann Distanz.
- Halten: Die Pfadsuche der KI kennt die Haltezonen und umgeht sie, wenn der Umweg höchstens 2 Felder länger ist; sonst läuft sie hinein.
- Gegnerische Elementaristen nutzen Wirken, wenn mindestens 2 Spieler-Einheiten im Brand-Ausbreitungsbereich stehen oder ein Felswall einen Spieler-Pfad zum Ziel sperrt.
- Niedergestreckte angreifen: Leicht nie, Normal nur wenn kein anderes Ziel, Schwer bevorzugt.
- Verstärkungen werden eine Runde vorher angekündigt; Hinterhalte nur auf Schwer.

### Positionierung und Taktik

- Supports belohnen Paare in Formation (Nachbarbonus, Tandem, Schutz).
- Gelände: Wald +1 DEF/+20 Ausweichen, Berg +2/+30, Festung +2–3/+20–30 und 20 % Heilung pro Runde; Flieger ohne Geländebonus.
- Engstellen: Halten, Felswall, Türen, Hebel.
- Nebel des Krieges auf einzelnen Karten: Sicht 3, Schütze/Späher +2, Flieger +1.

### Gelände und Umwelteffekte

- Interaktive Objekte: Tür, Truhe, Hebel, Balliste (Reichweite 3–10, Mt 12), Dorf (Gegner können es zerstören).
- Elementeffekte: Brand 2 Runden, 5 Schaden beim Betreten, Ausbreitung 25 % pro Runde auf brennbare Nachbarfelder; Löschen; Felswall 2 Runden; Wind lichtet Nebel (Radius 2). Die Ausbreitung ist reproduzierbar.
- Jahreszeit pro Akt verändert nur die Optik.

### Kampagnenstruktur

| | Akt 1 „Asche“ | Akt 2 „Glut“ | Akt 3 „Krone“ |
|---|---|---|---|
| Story-Missionen | Prolog + 8 | 8 | 8 (inkl. Finale) |
| Große Schlachten (~15 Einheiten) | – | 1 (Akt-Finale) | 2 (Vorbereitung aufs Finale, Finale) |
| Nebenquests | 3 | 3 | 4 |
| Leutnants | 4 | 4 | 4 |
| Entscheidungen | 4 | 4 | 4 |
| Heimat | Lager; ab 1-6 Burg auf Stufe 1 mit Gedächtnishalle | Burg mit Ausbau | Burg mit Ausbau |
| Einsatzplätze | 5–7 | 7–9 | 9–12 (große Schlachten 15) |
| Stufendeckel | 10 | 20 | 20 |
| Release | MVP | 2. Release | 3. Release |

- **Reihenfolge:** Die erste Mission jedes Akts ist fest. Danach sind 2–3 Story-Missionen gleichzeitig wählbar; das Akt-Finale öffnet sich, wenn alle anderen Story-Missionen des Akts gespielt sind. Ausnahmen: In Akt 1 folgen nach der freien Mitte (1-2 bis 1-5) Eroberung der Paktwacht, das Gewölbe und das Finale fest aufeinander (1-6 → 1-7 → 1-8); in Akt 3 folgen nach den drei frei wählbaren Missionen Krönung, Drachenangriff, der Weg ins Gebirge und das Finale (3-5 bis 3-8, siehe `concept/22-narrative/narrative.md`).
- **Missionsgrößen:** 19 der 25 Story-Missionen mittel bis mittelgroß (12×12 bis 16×24); 3 kompakt (Prolog, Einstiege); 3 große Schlachten bis 24×32 mit 30–45 Min. Spielzeit.
- **Missionsziele:** rout, boss (Leutnant oder Boss vertreiben), reach, seize (nur Kael), defend, survive, escape, **escort** (NPC zum Ausgang bringen), **treasure** (Truhen vor Rundenlimit bergen); 1–3 Nebenziele (visit_villages, no_downs, turn_limit, kill_with, recruit, open_chests, protect_npc).

### Missionszustände

| Knoten | Gesperrt | Verfügbar | Abgeschlossen | Verfällt |
|---|---|---|---|---|
| Story-Mission | bis Akt erreicht bzw. Vorgänger gespielt | wählbar auf der Weltkarte | nicht wiederholbar; Karte kehrt als Heimsuchung zurück | nie |
| Nebenquest | bis Auslöser (Entscheidung, Gefährte, Story-Fortschritt) | offen über alle Akte | nicht wiederholbar | nie; stirbt oder geht der Auslöser, Gedenk-Variante der Szene |
| Heimsuchung | bis zur ersten Leutnant-Begegnung | bis zu 6 offen | verschwindet | älteste wird verdrängt, wenn eine 7. entsteht |

## RPG Specific Design

### Figurensystem

- **Werte:** TP, STR, MAG, SKL, SPD, LCK, DEF, RES, MOV, Tragkraft.
- **Stufen:** 1–20 je Klassenstufe, 100 EP pro Stufe. In Akt 1 Deckel bei Stufe 10; EP darüber verfallen. Nach Akt 1 offen bis 20.
- **EP:** Kampf 10 + Δ (1–30), Besiegen/Vertreiben 30 + 3Δ (10–100), Boss oder Leutnant +20, Heilen 12 + 3 je Zusatzziel, Bergen/Ansprechen 10; Profiklasse zählt 15 Stufen höher (effektive Stufe).
- **Erwartete effektive Armee-Stufe** (Durchschnitt der 6 stärksten) `[ASSUMPTION, per Simulation]`:

| Akt | Story-Mission 1 → letzte |
|---|---|
| Akt 1 | 1 → 9 (Finale 10) |
| Akt 2 | 11 → 20 (erste Aufstiege ab Mission 2) |
| Akt 3 | 21 → 28 |

Die Kurve verteilt sich auf 9 / 8 / 8 Story-Missionen; die Feinkalibrierung übernimmt die verkettete Simulation (Story 6.8).

- **Wachstum:** Wachstumsraten mit Glättung (Ist ≤ Erwartung − 1,0 → garantiert +1; Ist ≥ Erwartung + 1,5 → 0; mindestens 1 Wert pro Level-up).
- **Aufstieg:** ab Stufe 10 mit einem **Glutfunken** in der Akademie (ab Akt 2); Wahl Profi A oder B; Stufe wird 1, Loadout 4 → 5.
- **Skills:** persönlicher Skill + Klassen-Skills + Item-Skills. Item-Skills werden durch Tragen gemeistert: FP +1 je Kampfsequenz, +5 bei Missionsende; Meisterung nach Seltenheit 20/30/40/60 FP (Gewöhnlich/Selten/Episch/Legendär) `[ASSUMPTION]`.
- **Narben:** sechs Narben mit dauerhaftem Malus (`extract-01-decisions.md`); der Heiler entfernt sie.

### Inventar und Ausrüstung

- Paperdoll: Haupthand, Nebenhand, Kopf, Körper, 2 Accessoires, Beutel 3 (ohne Gewicht); kein Verschleiß. Die Waffengruppen der Rolle begrenzen, was eine Figur führen darf.
- Gewicht: Tragkraft = STR + Bewegungstyp-Bonus (Fuß 4, Gepanzert 8, Beritten 6, Flieger 2, Monster 10); Überlast senkt AS 1:1, ab 5 −1 MOV, ab 10 −2 MOV.
- Seltenheit Gewöhnlich/Selten/Episch/Legendär/Relikt mit 0/1/2/fest/fest Affixen und 1/2/2/2/1 Rune-Slots; Sets mit Bonus ab 2 bzw. 4 Teilen. Signaturen sind legendäre Unikate mit Besitzer-Effekt; drei Relikte (eins je Akt) erwachen mit der Story. Katalog, Waffengruppen und Unikate in `items.md`.
- Runen I–III (Element, Status 30 %/50 %, Geländeeffekt); 1 Element-Rune je Waffe, zweiter Slot für Hilfs-Runen; Körperrüstung setzt die Affinität.
- Aufwerten +1…+5 (Waffe je +1 Mt/+3 Treffer, Rüstung je +1 DEF oder RES).
- Ausrüstungs-Tier pro Akt: Akt 1 Eisen, Akt 2 Stahl, Akt 3 Silber und Mondstahl.
- Verbrauchsgüter: Heiltrank (3 Ladungen) und Gegengift (2) füllen sich nach jeder Mission auf; Schlüssel, Feuerbombe, Hast und Glutfunke werden verbraucht.
- Konvoi 200 Plätze; die Ausrüstung Gefallener geht in den Konvoi.

### Quest-System

- **Story-Missionen** (25): tragen die Handlung und den Akt-Fortschritt.
- **Nebenquests** (10): optional, dauerhaft offen; 7 geben einen Glutfunken plus besondere Ausrüstung, einen besonderen Gefährten oder einen Vorteil für die Hauptstory, die 3 persönlichen Quests von Tobin, Jory sowie Kit und Pell eine Signaturwaffe statt des Glutfunkens.
- **Heimsuchungen:** wiederholbar, ohne Story (siehe Welt und Erkundung).
- **Gestaffelte Regeln** nach Zahl abgeschlossener Story-Missionen: Bewegung und Angriff (Prolog) → Waffendreieck (nach 1) → Magie (nach 2) → Elemente, Status, Runen, Supports (nach 3); Klassen-Aktionen einer Rolle, sobald der erste Gefährte dieser Rolle beitritt. Höchstens eine Lektion pro Runde, maximal 3 Zeilen.
- **Entscheidungen:** 12 Wahlpunkte (4 pro Akt), je 2–3 Antworten, nur außerhalb des Kampfs. Wirkungen: Ein Gefährte kommt oder geht, eine Nebenquest öffnet sich, Groll eines Leutnants −1, Händlerpreise ±10 % oder Dorfhilfe (Heiltrank +1 Ladung für einen Akt). Avatar und Kael verlassen die Truppe nie. Jede Wahl wird im Spielstand vermerkt und trägt in Staffel 2.
- **Epilog-Mosaik:** eine Kachel je Story-Gefährte (lebt, gefallen, gegangen, und eine Wendung aus seinen Entscheidungen und Supports) und je Region (3).

### Welt und Erkundung

- **3D-Weltkarte von Valmora** ab Akt 1: Region 1 sichtbar, Regionen 2 und 3 im Nebel und pro Akt aufgedeckt; gespielte Karten als Miniatur-Dioramen; die Heimat ist ein eigener Ort.
- **Knoten:** Story-Mission, Nebenquest, Heimsuchung, Heimat. Jede Aktion ist ein Tap auf einen Knoten.
- **Heimsuchungen:**
  - Takt: einmal pro Kalendertag 1–3 bereits gespielte Karten, reproduzierbar aus dem Datum. Verpasste Tage stauen sich bis maximal 3 Tagespakete; höchstens 6 offen. Der Tageswechsel zählt nur vorwärts; eine zurückgestellte Uhr erzeugt nichts Neues, eine vorgestellte höchstens den Stau von 3 Paketen.
  - Inhalt: eine Ziel-Variante (boss, defend, rout als Banditennest, escort, treasure), mindestens ein Leutnant aus einem bereits erreichten Akt, Gegner auf Armee-Stufe.
  - Belohnung: Gold 40 % des Mittelwerts der Story-Missionen des aktuellen Akts, Kopfgeld, Material, 60 % EP. Ab der 4. Heimsuchung seit der letzten Story-Mission halbieren sich Gold und Kopfgeld. Keine Glutfunken.
  - Deckel „aufholen, nicht überholen“: Liegt eine Einheit über der erwarteten Armee-Stufe der nächsten Story-Mission, erhält sie 50 % der Heimsuchungs-EP.

### NPC und Dialog

- Visual-Novel-Dialoge vor und nach Missionen, Sprechblasen auf der Karte (Leutnants, Bosse, Ansprechen).
- Auswahlantworten nur außerhalb des Kampfs, damit Kämpfe reproduzierbar bleiben.
- **Supports:** 25 feste Paare (jeder Gefährte 2–3 Partner), Gespräche C/B/A am Lagerfeuer (75 Gespräche), S-Rang nur für 6 Kernpaare. Punkte: +1 bei benachbartem Zugende, +2 bei Tandem, Heilen oder Bergen; Schwellen C 10, B 25, A 45, S 70.
- **Rekrutierung:** Story-Gefährten über Handlung, Ansprechen im Kampf, Entscheidungen und Nebenquests; Taverne für Söldner (Ersatzbank, vor allem im Modus Klassik). Armee-Limit 20 Story-Gefährten + 6 Söldner `[ASSUMPTION]`. Ist das Limit voll, findet ein Beitritt über Handlung, Entscheidung oder Ansprechen trotzdem statt; vor der nächsten Mission muss ein Söldner gehen.

### Kampfsystem

Rundenbasiert-taktisch auf dem Raster, Kampfauflösung direkt auf der Karte mit Kurzanimation (Tempo 1×/2×/Überspringen). Klassen-Aktionen und Item-Skills sind das Fähigkeitensystem; Magie läuft über Zauberwaffen mit Element.

## Progression and Balance

### Fortschritt des Spielers

- **Stufen:** siehe Figurensystem; Deckel 20/20 lässt Luft für Staffel 2.
- **Glutfunke:** kostbares Aufstiegs-Item, 12 Stück in Staffel 1: 2 aus dem Finale von Akt 1, je 1 aus 7 der 10 Nebenquests, 3 rotierend beim Händler (ab Händler-Stufe 3, 3 000 Gold, höchstens einer gleichzeitig im Angebot). Nicht alle Gefährten können aufsteigen; die Wahl, wer und wohin, ist Absicht. Der Erhalt wird als Moment inszeniert.
- **Ausrüstung:** Tier pro Akt; Legendäre und Signatur-Items über Nebenquests und Leutnants.
- **Burg:** Raumausbau als zweite Fortschrittsachse.

### Heimat: Lager und Burg

Zu Beginn von Akt 1 hat das wandernde Lager Konvoi, Händler, Schmied, Heiler, Taverne und Lagerfeuer auf Stufe 1. Ab Mission 1-6 übernimmt die Burg diese Funktionen auf Stufe 1, dazu die Gedächtnishalle mit Gedenksteinen. Ab Akt 2 kommen Ausbau und die übrigen Räume dazu. Jeder Raum steht für genau eine Funktion und hat drei Stufen. Für Stufe 2 und 3 braucht es den passenden Gefährten in der Truppe und Gold (Stufe 2 = 1 500, Stufe 3 = 4 000 Gold `[ASSUMPTION]`).

| Raum | Funktion | Stufe 1 → 2 → 3 |
|---|---|---|
| Konvoi | Items lagern (200 Plätze) | Sortieren → Ausrüstungs-Vorlagen je Figur → „Bestes anlegen“ |
| Händler | Kaufen, Verkaufen (50 %) | Sortiment des Akts → größeres Sortiment → Angebot des Tages, Rabatt 10 %, Glutfunke rotierend |
| Schmied | Aufwerten, Affix neu würfeln, Trank verstärken | max. +3 → +4 → +5 und Neu würfeln |
| Verzauberer (ab Akt 2) | Runen ein-/ausbauen, verschmelzen | Rune I → II → III |
| Heiler | Narben entfernen | 2 500 → 1 800 → 1 200 Gold, Trauer 2 statt 3 Missionen |
| Taverne | Söldner anheuern | 3 Angebote → 4 Angebote + bessere Traits → Wunschrolle |
| Lagerfeuer | Support-Gespräche | Ränge C und B → A → S (Kernpaare) |
| Akademie (ab Akt 2) | Aufstieg per Glutfunke, Skill-Loadout | Aufstieg → Profi-Weg innerhalb der Rolle wechseln → zweiter Profi-Weg für Aufgestiegene `[ASSUMPTION]` |
| Werkstatt (ab Akt 2) | Verbrauchsgüter aus Material herstellen | Feuerbombe, Schlüssel → Hast, verstärktes Gegengift → Fallen-Set, Rune I |
| Gedächtnishalle (Gedenksteine ab 1-6, Lektionen ab Akt 2) | Gedenksteine; einmal pro Akt vererbt ein Gefallener eine Lektion (passiver Skill seiner Rolle, z. B. +5 Treffer, +1 MOV im Wald) an einen Gefährten | 1 Lektion → 2 Lektionen → freie Wahl der Lektion |
| Übungsplatz (ab Akt 2) | Reserve erhält EP | 20 % → 35 % → 50 % der Durchschnitts-EP der Mission |

Jede Interaktion braucht höchstens 2 Taps; kein Raum ist Pflicht.

### Schwierigkeitskurve

- Leicht/Normal/Schwer: Gegnerwerte −15/0/+15 %; Schwer mit 1 Gegner-Affix je Elite und Hinterhalten; Aufstellung je Schwierigkeit; nur absenkbar, in den Optionen der Kampagne. Tod-Modus unabhängig wählbar.
- Zielkorridore je Story-Mission (Simulation über die verkettete Kampagne): Leicht ≥ 95 % Sieg und ≤ 0,5 Niedergestreckte; Normal 75–100 % und 0,4–1,3; Schwer 30–70 %.
- Gegnerstufe = erwartete effektive Armee-Stufe der Mission + Akt-Zuschlag (+0/+1/+2) `[ASSUMPTION]`; große Schlachten am oberen Rand des Korridors.

### Wirtschaft und Ressourcen

- **Grundsatz:** Pro Story-Mission reicht das Gold für eine von drei großen Investitionen (Aufwertung, Raumausbau, Narbe heilen bzw. Anwerben).
- **Gold pro Story-Mission:** Prolog 300; Akt 1 800–1 500; Akt 2 2 000–3 000; Akt 3 3 000–4 500; Nebenziele +30–50 %. Nebenquest wie Story + Sonderbeute. Heimsuchung siehe oben. Startgold 500.
- **Material:** Eisenerz (Akt 1), Mondstahl (Akt 2), Drachenschuppe (Akt 3), Arkanstaub; vor allem aus Heimsuchungen und Kopfgeld.
- **Kosten:** Aufwerten 300/600/1 000/1 600/2 500 + Material; Affix neu 500 + 2 Arkanstaub (Episch 800 + 3); Rune I 400, Verschmelzen 3× Stufe N + 200 × N; Trank verstärken 400/900; Söldner 600 + 150 × Stufe; Raumausbau siehe Heimat; Verkauf 50 %.

## Level Design Framework

### Kartentypen

| Typ | Anzahl | Größe | Dauer |
|---|---|---|---|
| Story-Mission | 22 | kompakt bis mittelgroß, eher quadratisch | 15–30 Min. |
| Große Schlacht | 3 (Teil der 25 Story-Missionen) | bis 24×32, 15 eigene Einheiten | 30–45 Min. |
| Nebenquest | 10 (2 als Variante einer Story-Karte) | kompakt bis mittel | 10–25 Min. |
| Heimsuchung | Varianten auf gespielten Karten | Größe der Vorlage | 10–20 Min. |

Jede Story-Karte hat 1–3 Nebenziele und mindestens ein Element, das eine Rolle besonders belohnt (Engstelle für Vorkämpfer, Nebel für Späher, Brennbares für Elementaristen).

### Missionsfolge

- Pro Akt steht eine neue Regel oder Rolle im Fokus.
- Jeder Leutnant eines Akts tritt in mindestens 2 Story-Missionen auf, einer davon auch im Akt-Finale.
- Kein Missionsziel kommt im selben Akt mehr als zweimal hintereinander vor.
- Jeder Beitritt hat in seinem Akt mindestens eine weitere Story-Mission; Gefährten aus Akt 3 treten spätestens in dessen vierter Mission bei.

## Art and Audio Direction

- **Stil:** runder Chibi-Cartoon für Porträts und Figuren (Referenz `art/mockups/style-2026-10/round_chibi_kael.png`); helles 3D-Diorama für Karten und Weltkarte; UI im Studio-Look (U21). Ob die Diorama-Karte (D1–D16) bleibt und wie sich Licht und Farbe anpassen, klärt die Art-Direction-Etappe.
- **Lesbarkeit:** Teamfarben Blau/Rot über Tuch und Bodenring; Leutnants mit eigenem Rahmen und Groll-Symbol; Rollen an Silhouette und Klassen-Icon erkennbar; Verblutungs-Zähler an Niedergestreckten.
- **Audio:** warm und folk-lastig, Orchester nur bei Bossen und Drama; Leitmotive pro Figur und Truppe; Musik in Burg, Lager, Weltkarte und Menüs dezent und ohne Gesang; Teilvertonung (Barks, Groll-Zeilen der Leutnants, Boss-Zitate, 2 Schlüsselszenen).

## Technical Specifications

### Leistungsanforderungen

- 60 FPS auf dem Referenzgerät Pixel 6a bzw. iPhone 12 `[ASSUMPTION]`, gemessen über eine komplette Gegnerphase einer großen Schlacht.
- Ladezeit unter 5 s; initialer Download (Shell + Prolog) unter 15 MB; jeder Akt als nachladbares, offline verfügbares Paket.
- Qualitätsstufen Hoch/Mittel/Niedrig, automatisch vorgewählt.

### Plattformen

1. Handy-Browser im Hochformat (PWA, offline spielbar); 2. Tablet und PC-Browser mit Maus; 3. später Apps über Capacitor.

### Reproduzierbarkeit und Speichern

- Jeder Kampf ist aus Startzustand und Eingaben exakt reproduzierbar, auch Affixe, Brandausbreitung und Heimsuchungen.
- Automatisches Speichern nach jeder Aktion; Spielstände je Tod-Modus laut Sieg und Niederlage. Ein Spielstand trägt über Akt-Releases hinweg; Entscheidungen tragen in Staffel 2.

### Asset-Bedarf

20 Story-Gefährten, 12 Leutnants, 10 Gegnertypen, 7 Rollen in Basis + 2 Profi-Varianten plus Unikate als 3D-Figuren mit Animationen für Idle, Laufen, Angriff je Waffenart, Treffer, Niedergestreckt, Flucht; 36 Karten (25 Story, 8 Nebenquest, 3 Reserve; 2 Nebenquests als Variante einer Story-Karte); 1 Weltkarte mit 3 Regionen; 11 Burg-Räume mit je 3 Ausbaustufen (optisch); Porträts mit Stimmungen für Kernfiguren.

## Development Epics

Die Epics und Stories stehen in `concept/26-epics/epics.md` (Epic 1–12; Sprint-Status in `_bmad-output/implementation-artifacts/sprint-status.yaml`). Die frühere Zählung E1–E10 dieses Abschnitts ist abgelöst; „E1–E12“ bezeichnet in GDD und Narrative die Entscheidungen.

## Success Metrics

### Technisch

- Performance-Ziele erfüllt; ein aufgezeichneter Kampf ergibt beim Abspielen exakt dasselbe Ergebnis.

### Spielerlebnis

- Simulations-Korridore je Story-Mission erfüllt.
- Playtest MVP (Akt 1, 5–10 Tester): mindestens 70 % wollen Akt 2 spielen; mindestens die Hälfte nennt einen Gefährten beim Namen, den sie vermissen würden; der Chibi-Stil verharmlost laut Testern den Tod nicht (Gedenkszene).
- Spielzeit Staffel 1: 30–35 Stunden auf Normal.

## Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| **Nemesis-Patent:** Warner Bros. hält in den USA ein Patent auf das Nemesis-System (bis ca. 2036). Unbegrenzt wiederkehrende, mitwachsende Leutnants liegen näher daran als die Brief-Fassung | feste, handgeschriebene Leutnant-Liste; keine prozedurale Erzeugung von Gegnern oder Persönlichkeiten; keine Rangordnung oder Machtkämpfe unter Gegnern; keine Beförderung durch Spielerniederlagen. Vor einer Veröffentlichung rechtlich prüfen `[ASSUMPTION: Prüfung nötig]` |
| **Täglich-Druck:** Heimsuchungen erzeugen das Gefühl, täglich spielen zu müssen | Stau bis 3 Tagespakete; Heimsuchungen sind optional; Story und Nebenquests brauchen sie nicht |
| **Fortschritt läuft davon** zwischen Akt-Releases | Deckel „aufholen, nicht überholen“, halbiertes Gold ab der 4. Heimsuchung, Leutnant-Stufe nach den 6 stärksten |
| **Nemesis-Frust:** Ein Feind, der immer wiederkommt, nervt | Groll gedeckelt bei 3; Kopfgeld und Signatur-Item belohnen jede Vertreibung; Entscheidungen können Groll senken |
| **Umfang:** 20 Gefährten mit Porträts, Supports und Burg-Räumen | Lieferung in Akten; 25 feste Paare; Stimmungsporträts nur für Kernfiguren; Inhalte als Daten |
| **Stil-Konsistenz:** Chibi-Figuren wirken gleichförmig, ChatGPT driftet | Model Sheets, feste Farbpalette je Figur, Silhouetten-Regeln, Prompt-Bibliothek in `art/prompts/` |
| **Tonbruch:** Chibi verharmlost Permadeath | Gedenkszene früh im neuen Stil testen |
| **Burg als Menüfriedhof** | höchstens 2 Taps je Interaktion, kein Raum Pflicht |

## Out of Scope

- Fraktionsrouten (ersetzt durch Entscheidungen).
- Rollen Reiter, Pionier, Greifenreiter; Pegasus- und Wyvernreiter als Spielerklassen.
- Räume Kartenraum, Küche, Stall & Voliere.
- Siegel (→ Glutfunke), Scharmützel (→ Heimsuchungen), Mahlzeiten.
- Status Geblendet und Verflucht.
- S-Rang außerhalb der 6 Kernpaare.
- Monetarisierung, Cloud-Save, Konto; Vollvertonung.
- Staffel 2 (nur das Übertragen der Entscheidungen ist vorbereitet).
- Barrierefreiheit (Farbenblind-Modus, Schriftgröße, Linkshänder) bleibt nach V1.

## Assumptions and Dependencies

- Die Narrative-Etappe liefert Figuren, Leutnants, Entscheidungen, Nebenquest-Inhalte und Epilog-Kacheln.
- Die Art-Direction-Etappe liefert den Chibi-Stil und klärt D1–D16 (Diorama, Licht, Farbe).
- Die Architektur-Etappe regelt Tageswechsel, Akt-Pakete, Spielstand-Übertrag und Klassik-Speicherregeln technisch.
- O5/GA26 (Lizenzen) ist geklärt (`concept/23-art-direction/licensing.md`, Produktinhaber 2026-10-24). O1 und O2 sind hier entschieden.

### Annahmen-Index

1. Kopfgeld 200 × (Groll + 1) Gold + 1–2 Material.
2. Signatur-Item 10 % je Vertreibung, garantiert bei der 4.
3. Basiswerte und Wachstum der Rollen aus den PoC-Klassen.
4. Mauern und Türen blockieren im Nebel die Sicht.
5. Gegnertypen je Akt inkl. Untote.
6. Erwartete effektive Armee-Stufe je Akt.
7. Meisterung 20/30/40/60 FP nach Seltenheit.
8. Armee-Limit 20 Gefährten + 6 Söldner.
9. Raumausbau Stufe 2 = 1 500, Stufe 3 = 4 000 Gold.
10. Akademie Stufe 3: zweiter Profi-Weg.
11. Gegner-Akt-Zuschlag +0/+1/+2 Stufen.
12. Referenzgerät Pixel 6a / iPhone 12.
13. Rechtliche Prüfung zum Nemesis-Patent vor Veröffentlichung.
