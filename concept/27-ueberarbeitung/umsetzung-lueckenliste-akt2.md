# Lückenliste Akt 2: Planung gegen die Überarbeitung

> Stand 2026-11-06, Abgleich mit main (`d848b6c`). Gegenstück zu `umsetzung-lueckenliste.md` (Akt 1). Quellen: `roadmap.md`, `concept/22-narrative/missionsliste-s1.md` (Akt 2), die 11 Entwürfe `levels/s2_*.yaml` mit Abnahmen in `levels/abnahme/s2_*.md`, `concept/23-art-direction/figuren-bestand.md`, `map-assets/matrix.md`, Logs von GDD, Narrative und Epics. Ergebnis: `concept/26-epics/epics/epic-11.md` neu geschnitten (2026-11-06).

## Stand der Entwürfe

- Alle 11 Entwürfe (2-1 bis 2-8, N4 bis N6) sind vom Produktinhaber einzeln mit Bild abgenommen (PR #107, „Entwurf 1“), `pnpm levels` ist grün.
- **Nach der Abnahme geändert, ohne neue Sichtung:** 2-1, 2-3 und 2-8 (Fußtruppen statt Reiter, Commit `e6e12a6`) und die Gegnerstufen aller Karten (P−3 bis P−1, Commit `49ea7b8`). Beides folgt Beschlüssen des Produktinhabers; die Sichtung im Spiel holt die jeweilige Missions-Story nach.
- **Noch nicht im Spiel.** Anders als Akt 1 (`levels/abnahme/akt1-hoehen.md`) gibt es für Akt 2 keine Abnahme im Spiel mit Höhenstufen, Toren und Hebeln.

## Lücken

| Bereich | Lücke | Wo im neuen Epic 11 |
|---|---|---|
| Format-Reste | `levelOffset` −3 bis +2 (Schema kennt es nicht), Leutnants P+1, Boss P+2 | 11.2 |
| | Bedingte Pflichtfigur (Ilka in N4, Jory in N6 nur, wenn sie leben) | 11.10 |
| | Einheiten mit `requires` auf Flags (Sable oder Hauptmann nach E7, `e7_order`/`e7_warned` sind Platzhalter) | 11.10, Flags in 11.5 |
| | Gast-Einheit `team: other` als Schutzziel (Brann in 2-4), nicht steuerbar | 11.10 |
| | Veränderliche Karten: Steinschlag (2-2), Feuer und Schneise (2-4), Brücke gekappt (2-5), Ebbe und Flut (2-6, N6), Kran-Steg (2-7), Brückentor (2-8) über `set_terrain` und Hebel | 11.10 |
| | Level-Blatt kennt terrace, crag, ramp, stairs, ladder, vault, footbridge, gate_closed nicht (zeigt „?“) | 11.10 |
| Regeln | Balliste steht in Schema, Zustand und Brett, die Regel (Schuss, KI, Vorschau) fehlt in `src/core`; Zusammenspiel mit Höhe folgt der Fernkampf-Regel | 11.6 |
| | Flieger, Pegasus- und Wyvern-Teile, Reittier-Grafik und Lektion entfallen; `pegasus_knight` bleibt ungenutzt im Code | 11.5, 11.7 |
| Folge | `2-1 → (2-2 ∥ 2-3) → 2-4 → (2-5 ∥ 2-6) → 2-7 → 2-8`, N4 nach 2-3 (Ilka), N5 nach 2-4, N6 mit 2-7 (Jory); alte Stränge und Beitritte sind überholt | 11.11, Missionen 11.12–11.22 |
| Gefährten | Beitritte neu: Jory 2-1, Ilka 2-3, Odile und Amos 2-5, Nell 2-6, Brann nur über N5 (Ansprechen), Sable bei E7 „warnen“ in 2-4 | 11.5 |
| Leutnants | Rowena Lanzenritterin zu Fuß (`knight`), Brakka Ballistenmeisterin (`marksman`), Sable `duelist`; Signaturen und Groll-Fähigkeiten mit Flieger-Bezug (`wing_lance`, `dive`, `wyvern_cleaver`, `over_the_lines` …) neu | 11.5 |
| Entscheidungen | E5 nach 2-5, E6 nach 2-6 (nur mit Varek), E7 in 2-4, E8 nach 2-7; Beat 9 „Dorf brennt“ hat keinen offenen Fall mehr, weil 2-4 immer vor 2-6 liegt | Missionen |
| Szenen | Alle Szenen von Akt 2 fehlen; Chronik-Szene „nach der 3. Mission“ heißt bei fester Folge „nach 2-4“ | Missionen, 11.23 |
| Galerie-Modelle | Laut Matrix fehlen für Akt 2 u. a. Boden Herbst, Koppel, Stall, Gestüt, Getreideterrasse, Bergdorf, Hängebrücke, Wasserfall, Kai, Lagerhaus, Kran, Gaukelbühne, Stollen, Lore, Drachenknochen, Fackel; Deko-Pferd für 2-3 | 11.24 |
| Figuren (Schritt 3) | Figuren-Bestand: Rowena ❌ (Helm, Pegasus-Figurenblatt), Brann 🟡, Brakka 🟡; neu nötig Ritter der Lanze und Kaperer (Schritt 3: 4 Modelle, 560 Credits). Guthaben 205 Credits. Figuren-Bibel (Schritt 0) fehlt | 11.25, **Frage F2 offen** |
| Ortsbilder | Fehlen für 2-1, 2-4, 2-6, 2-7, N4–N6 (vorhanden: grauwacht, salzpass, brandhang, kronfeld) | Missionen |
| Weltkarte | Akt-2-Knoten auf Weltkarte v5 (Story 15.7/15.12), Nebel je Akt, Stadtbilder der Akt-2-Orte, Brandhang als Zustandsvariante nach E7 „gehorchen“ | 11.3 |
| Burg (Epic 10) | Einleitung und 10.1 überholt (gemaltes Bild, Anker), 10.14 nennt noch Ausgang „Bild“ und `home.yaml`; Verweise auf alte Epic-11-Nummern; Varek und Brann optional; Vorwerk am Passfuß ohne Story | Epic 10 nachgezogen, F3 und F4 entschieden |
| Leistung | 2-4 und 2-8 sind 30 × 40; 2-8 hat bis 15 eigene, 40 Gegner und 4 Leutnants (rund 60 Figuren, über dem Ziel von 15.11), dazu Feuer und Ballisten | 11.26 |
| Release | Beschluss 2026-11-05: Akt 2 erst nach dem Release von Akt 1 live; alte 11.1/11.3 schalten den Übergang „sofort ab Merge“ | 11.1, 11.3, 11.27, F1 entschieden |
| Quer | `gdd.md` (Missionsfolge „Flieger und Balliste“, Gegner pro Akt), `narrative.md` (Leutnant-Tabelle Pegasus/Wyvern), Art Direction §4.3 (Signaturteile) noch auf altem Stand; FR17 nennt Pegasusritter | Requirements nachgezogen; GDD, Narrative, Art Direction bleiben Folgearbeit |

## Fragen an den Produktinhaber

Gesammelt und beantwortet am 2026-11-06. Offen ist nur F2; Story 11.25 trägt weiter **⚠ F2**.

| # | Antwort (2026-11-06) |
|---|---|
| F1 | **Früh und Stück für Stück live**, nicht erst mit 11.27: erster Live-Schritt 11.1 und 11.3 nach dem Release von Akt 1, danach jede Mission mit ihrem Merge. Ab dann `content:lock` nach jedem Schritt, Migration und Fixture bei jeder Formatänderung (Epic 11, „Stückweise live“) |
| F2 | **Später entscheiden.** 11.25 bleibt offen, Platzhalter gelten, auch live |
| F3 | **Empfehlung A:** Die Akademie behält ihre Stufe, die Folgen-Karte nennt den Wegfall von Stufe 3 |
| F4 | **Empfehlung A:** Burgstufe 3 zeigt ein Vorwerk am Passfuß, nur als Bild, ohne Regel (10.14) |

Die ursprüngliche Fragestellung:

| # | Frage | Empfehlung | Betrifft |
|---|---|---|---|
| F1 | Wie geht Akt 2 nach dem Release von Akt 1 live? A als Ganzes mit 11.27; B Mission für Mission; C erst bis 2-4, dann der Rest | A | 11.1, 11.3, 11.27 |
| F2 | Brettfiguren für Akt 2 (Schritt 3)? A Credits nachkaufen, Rowena, Brann, Ritter der Lanze, Kaperer neu (560 Credits); B nur Rowena mit dem Rest-Guthaben, sonst Platzhalter; C alles Platzhalter bis nach dem Release von Akt 2 | A | 11.7, 11.25 |
| F3 | Akademie Stufe 3, wenn Varek fehlt (N2 ausgelassen) und Odile bei E5 geht? A wie geplant, Hinweis auf der Folgen-Karte; B dritter Raum-Gefährte (z. B. Ysolde); C Odile darf vor dem Gehen Stufe 3 freischalten | A | 11.16, 11.17, 10.1 |
| F4 | Vorwerk am Passfuß (Narrative-Log 2026-11-04 „zu planen“)? A nur Ausbauteil der Burgstufe 3 in 10.14, ohne Regel; B eigener Raum mit Wirkung (neue Story 10.15); C Staffel 2 | A | 10.14 |

Weiter ohne Eile zu bestätigen (aus der Akt-1-Liste): „10–15 Charaktere“ meint eigene Einheiten; 2-8 setzt 15 ein.
