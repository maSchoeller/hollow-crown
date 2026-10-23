---
title: "Hollow Crown – Development Epics (Staffel 1)"
status: final
created: 2026-10-23
updated: 2026-10-23
source: concept/21-gdd/gdd.md
---

# Development Epics – Staffel 1

> **Abgelöst** durch `concept/26-epics/epics.md` (12 Epics, 99 Stories, Etappe 5). Diese Grobfassung bleibt als Herleitung stehen.

Grobe Epics mit High-Level-Stories aus dem GDD. Die Feinplanung (Akzeptanzkriterien, Story-Dateien) macht später `gds-create-epics-and-stories` nach der Architektur-Etappe. Jedes Epic endet mit grünen Prüfungen (`pnpm lint`, `test`, `content:check`, `build`).

## E1 – Rollenklassen

Ziel: Klassen als Rollen statt Waffen; Säule „Ausrüstung ist der Charakter“.

- Klassenmodell auf Rolle umstellen: Bewegungstyp, Waffengruppen, Klassen-Aktion, Wachstum; Waffengruppen begrenzen das Ausrüsten.
- PoC-Klassen auf die 7 Rollen + Taktiker/Hauptmann ummappen; Spielstände migrieren.
- Klassen-Aktionen umsetzen: Halten, Nachsetzen, Zielen, Wirken, Fernbergen, Öffnen/Stehlen, Anfeuern; jede mit Vorschau.
- Profi-Wege A/B je Rolle (14 Profiklassen + 2 Unikate) mit Unterschieden laut GDD.
- KI berücksichtigt Halten (Pfadplanung) und Klassen-Aktionen der Gegner, soweit Gegner sie haben.

## E2 – Leutnants

Ziel: wiederkehrende, nie sterbende Feinde.

- Gegner als Leutnant markieren; bei 0 TP Flucht statt Tod; Ziel `boss` zählt Flucht als Sieg.
- Kampfvorschau zeigt „flieht“; Fluchtanimation und Sprechblase.
- Groll 0–3, Groll-Ziel (letzter Vertreiber) mit KI-Gewichtung +20; Groll-Zeilen.
- Stärke: Durchschnitt der 6 stärksten Einheiten + Groll; je Groll-Stufe +1 Ausrüstungs-Tier und eine der 3 Groll-Fähigkeiten.
- Groll-Ziel stirbt: Groll bleibt, Ziel richtet sich nach der nächsten Vertreibung neu aus.
- Kopfgeld und Signatur-Item-Drop; Steckbrief-Ansicht (Groll, Vertreiber, Begegnungen).

## E3 – Weltkarte und Heimsuchungen

Ziel: 3D-Weltkarte als Navigationsebene und täglicher Wiederkehr-Anlass.

- 3D-Weltkarte von Valmora mit Regionen, Nebel pro Akt, Miniatur-Dioramen gespielter Karten, Knoten-Typen.
- Knoten wählen → Missionsvorbereitung; Heimat als Knoten.
- Tageswechsel: 1–3 Heimsuchungen pro Kalendertag aus Datum-Seed; Stau bis 3 Tagespakete; max. 6 offen.
- Ziel-Varianten auf vorhandenen Karten (Leutnant vertreiben, Dorf verteidigen, Banditennest, Eskorte, Truhenjagd) inklusive Gegner-Generierung auf Armee-Durchschnitt.
- Belohnungen: 40 % Gold, 60 % EP, Kopfgeld, Material; keine Glutfunken.
- Deckel: 50 % EP über der erwarteten Armee-Stufe; Gold und Kopfgeld halbiert ab der 4. Heimsuchung seit der letzten Story-Mission; Uhr zählt nur vorwärts.
- Heimsuchungen erst nach der ersten Leutnant-Begegnung; neue Ziel-IDs `escort` und `treasure`.

## E4 – Kampagne, Entscheidungen, Supports

Ziel: Akt-Struktur mit teils freier Reihenfolge, gestaffelten Regeln, Entscheidungen und festen Support-Paaren.

- Kampagnen-Graph: feste erste Mission je Akt, 2–3 parallel wählbare Story-Missionen, Akt-Finale nach allen anderen.
- Gestaffelte Regeln nach Zahl abgeschlossener Story-Missionen (ersetzt Knotenbindung aus U14).
- Missionszustände: Story nicht wiederholbar; Nebenquests über Akte offen, Gedenk-Variante wenn der Auslöser stirbt oder geht.
- Supports auf 25 feste Paare umstellen, S-Rang nur für 6 Kernpaare; Lagerfeuer-Stufen C/B → A → S.
- Entscheidungspunkte außerhalb des Kampfs mit Flags; Wirkungen auf Rekrutierung, Nebenquests, Groll, Händler.
- Epilog-Mosaik: Kacheln je Gefährte und Region aus Flags und Überleben; Flags im Spielstand für Staffel 2.

## E5 – Fortschritt und Wirtschaft

Ziel: Kurven über die ganze Staffel.

- Stufendeckel 10 in Akt 1 (EP darüber verfallen), danach 20; EP-Regeln inkl. 60 % in Heimsuchungen.
- Verbluten im Modus Standard nach 3 eigenen Phasen; Speicher- und Neustartregeln je Tod-Modus (Klassik streng).
- Glutfunke als Item; Aufstieg in der Akademie mit Wahl Profi A/B; Quellen: Akt-1-Finale (2), Nebenquests (7), Händler rotierend.
- Gold- und Materialkurve pro Akt; Kopfgeld; Raumausbau-Kosten.
- Ausrüstungs-Tiers pro Akt im Händler-Sortiment.
- Simulation erweitern: verkettete Kampagne über Akte, Heimsuchungen, Reserve-EP; Korridore je Mission.

## E6 – Heimat (Lager und Burg)

Ziel: Heimat als zweite Fortschrittsachse.

- Akt 1: wanderndes Lager mit Konvoi, Händler, Schmied, Heiler, Lagerfeuer (Stufe 1).
- Burg ab Akt 2: 11 Räume mit je einer Funktion; Freischaltung und Ausbau Stufe 2/3 über Gefährten + Gold.
- Neue Funktionen: Akademie, Werkstatt (Herstellen aus Material), Gedächtnishalle (Gedenksteine, Lektionen vererben), Übungsplatz (Reserve-EP).
- Sichtbares Wachstum: Gefährten erscheinen in ihren Räumen; Gefallene hinterlassen einen leeren Platz und einen Gedenkstein.
- Jede Raum-Interaktion in höchstens 1–2 Taps.

## E7 – Chibi-Stil und Audio

Ziel: freundlicher Stil auf Karte, Porträts und Weltkarte, warmer Klang (Details aus der Art-Direction-Etappe).

- Figuren-Rig und Proportionen auf den Chibi-Stil umstellen; 7 Rollen in Basis + 2 Profi-Varianten, Unikate, Gegner; Fluchtanimation.
- Porträts im Chibi-Stil, Stimmungen für Kernfiguren.
- Weltkarte und Burg-Darstellung im selben Stil.
- Früher Tonbruch-Test: eine Gedenkszene im neuen Stil.
- Musik folk-lastig, Hub-Musik ohne Gesang; Teilvertonung (Barks, Groll-Zeilen, Boss-Zitate, 2 Schlüsselszenen).

## E8 – Content Akt 1 (MVP)

- Prolog + 6 Story-Missionen (bestehende Karten Prolog, Kap. 1, Kap. 2 angepasst), 2 Nebenquests, 4 Leutnants, 4 Entscheidungen.
- Akt-1-Finale mit Eroberung der Burgruine und 2 Glutfunken.
- Dialoge DE/EN, Supports der Akt-1-Paare, Balancing per Sim.
- Playtest der Kernhypothese.

## E9 – Content Akt 2

- 7 Story-Missionen, das Akt-Finale als große Schlacht, 2 Nebenquests, 4 Leutnants, 4 Entscheidungen; Region 2 auf der Weltkarte.
- Burg als Heimat, Eisenmark-Gegner, Pegasusritter, Ballisten.

## E10 – Content Akt 3

- 6 Story-Missionen, davon Vorbereitung aufs Finale und Finale als große Schlachten, 3 Nebenquests, 4 Leutnants, 4 Entscheidungen; Region 3.
- Drachen als Gegnertyp; Epilog-Mosaik; Übergabe der Flags an Staffel 2.
