# Hollow Crown – Konzeptordner

Planungsartefakte für Hollow Crown. V1 ist seit 2026-10-23 **Staffel 1** (siehe Game Brief); die Dokumente 00–17 stammen aus der Grilling-Session am 2026-10-21 und dem Proof of Concept. Hier wird nichts implementiert. Dieser Ordner ist die Grundlage für die Umsetzungs-Sessions.

## Lesereihenfolge

| Datei | Inhalt | Für wen |
|---|---|---|
| [20-game-brief/brief.md](20-game-brief/brief.md) | **Game Brief Staffel 1** (V1 = vollständige erste Staffel): Vision, Säulen, Umfang, Akte, Risiken. Löst `00-vision.md` und den V1-Umfang aus `13` ab | alle, zuerst lesen |
| [21-gdd/gdd.md](21-gdd/gdd.md) | **Game Design Document Staffel 1**: Quelle der Wahrheit für die Spielmechanik (Rollenklassen, Leutnants, Weltkarte, Heimsuchungen, Burg, Fortschritt, Wirtschaft); Epics grob in `21-gdd/epics.md`, fein in `26-epics/epics.md`. Löst die Mechanik aus `01`, `02`, `04` §4 und `07` ab | alle, nach dem Brief |
| [22-narrative/narrative.md](22-narrative/narrative.md) | **Narrative Design Staffel 1**: Prämisse, Story Beats, Figuren, Welt, Dialogstil, Missionsfolge, Entscheidungen, Nebenquests, Supports, Produktion; Moodboards in `art/mockups/characters-s1/` und `locations-s1/`. Löst `08-story-world.md` bis auf die Prämisse ab | Story, Content, Dialoge |
| [23-art-direction/art-direction.md](23-art-direction/art-direction.md) | **Art Direction Staffel 1**: Spielzeug-Diorama mit Detailgrad der bestehenden Karte, Round-Chibi-Figuren per Bild-zu-3D (Tripo), Farbwelt, Jahreszeit je Akt, Bildebene, Weltkarte und Burg in 3D, Effekte, Audio-Richtung, Asset-Budget. Löst `15-art-direction.md` ab; Probe in `art/mockups/tripo-test-2026-10/` (die abgelehnte Stilprobe `style-3d-2026-10/` ist entfernt, siehe Entscheidungslog) | Art, Render, Content |
| [24-architecture/architecture.md](24-architecture/architecture.md) | **Architektur Staffel 1 (Delta zu `10`)**: zwei Command-Ebenen (Kampf, Kampagne), Bedingungen/Wirkungen als Daten, Akt-Pakete mit Hintergrund-Download, Speicherformat 2, Tageswechsel 04:00, Heimsuchungs-Anker, Leutnants, Szenen-Schema, KI im Worker, drei 3D-Szenen; Epic-Zuordnung inkl. neuem Fundament-Epic E0 | Technik, alle Umsetzungs-Sessions |
| [25-ux/](25-ux/) | **UX Staffel 1**: `DESIGN.md` (Richtung B „Spielzeug-Diorama“, Tokens, Komponenten) und `EXPERIENCE.md` (Hub Weltkarte, Kampf, Heimat, Szenen, Truppe, Kampagnen, Abschied, Key Flows); freigegebene Mockups in `25-ux/mockups/`. Löst U21 für Spielflächen und `09-ux-mobile.md` §4–§5 ab | UI, alle Umsetzungs-Sessions |
| [26-epics/epics.md](26-epics/epics.md) | **Epics und Stories Staffel 1**: 12 Epics nach Spielerwert, 99 Stories; bis zum MVP (Akt 1) mit vollen Akzeptanzkriterien, Burg/Akt 2/Akt 3 grob. Lesbare Fassung in `26-epics/html/epics.html`. Löst `21-gdd/epics.md` ab | Umsetzung, Sprint-Planung |
| [00-vision.md](00-vision.md) | ~~Pitch, Säulen, Zielgruppe, Marktanalyse~~ → abgelöst durch den Game Brief | Archiv |
| [01-decisions.md](01-decisions.md) | Entscheidungsprotokoll des Proof of Concept, **eingefroren seit 2026-10-23**; gilt, wo der Game Brief und spätere BMAD-Artefakte schweigen. Offene Punkte O1–O5 | alle |
| [02-core-loop.md](02-core-loop.md) | Spielschleife Mission ↔ Lager | Design |
| [03-combat.md](03-combat.md) | Phasen, Formeln, Dreieck, Elemente, Status, Supports/Tandem, Tod | Kern-Implementierung |
| [04-units-progression.md](04-units-progression.md) | Werte, Bewegung, Wachstum, Klassen, Skills, Söldner | Kern-Implementierung |
| [05-inventory-items.md](05-inventory-items.md) | Paperdoll, Gewicht, Loot, Affixe, Runen, Sets, Verbrauch | Kern + UI |
| [06-maps-missions.md](06-maps-missions.md) | Gelände, Objekte, Nebel, Ziele, Trigger, KI-Profile, Scharmützel | Kern + Content |
| [07-camp-economy.md](07-camp-economy.md) | Lager-Funktionen, Ressourcen, Kosten | Kern + UI |
| [08-story-world.md](08-story-world.md) | Welt, Fraktionen, Figuren, Akt-1-Kapitel, Supports. **Abgelöst** durch `22-narrative/narrative.md` (nur die Prämisse gilt weiter) | Herleitung |
| [09-ux-mobile.md](09-ux-mobile.md) | Bedienung, Breakpoints, ~~Wireframes, Screens~~ (→ `25-ux/`) | UI |
| [10-tech-architecture.md](10-tech-architecture.md) | Stack, Module, Command/Event, Determinismus, Save, Tools, Tests. Gilt weiter, wo `24-architecture/` schweigt; Modulstruktur und Speichern sind dort neu gefasst | Technik |
| [11-content-format.md](11-content-format.md) | YAML-Formate (Karten, Klassen, Items, Skills, Dialoge, Kampagne) | Content + Technik |
| [12-monetization.md](12-monetization.md) | F2P-Leitplanken (nach V1) | Produkt |
| [13-v1-scope.md](13-v1-scope.md) | V1-Checkliste, Meilensteine, DoD, Abnahmeszenarien | Umsetzung |
| [14-glossary.md](14-glossary.md) | Glossar DE ↔ EN | alle |
| [15-art-direction.md](15-art-direction.md) | ~~Stil, Farbwelt, Kapitel-Farbskript, Figuren-Briefings, Effekte, UI~~ → abgelöst durch `23-art-direction/` | Herleitung |
| [16-asset-pipeline.md](16-asset-pipeline.md) | ChatGPT/Blender → Pixel → Babylon, Formate, Budgets, Qualitätsstufen, Art-Track A0–A5 | Art + Technik |
| [17-audio.md](17-audio.md) | Stimmen, Barks, SFX, Musik-Leitmotive, Mischung | Audio + Technik |
| [data-samples/](data-samples/) | Beispieldaten: Balancing, Klassen, Charaktere, Skills, Items, Affixe/Runen/Sets, Supports, Karte Kap. 1, Dialog | Umsetzung |

## Konventionen

- Planung läuft über BMAD (Modul gds). Neue Entscheidungen stehen im zuständigen Artefakt (Game Brief, GDD, Narrative, Art Direction, Architektur) und dessen `.decision-log.md`, nicht mehr in `01-decisions.md`.
- **[A]** = abgestimmt, **[C]** = von Claude gesetzter Default bzw. Startwert (in `01-decisions.md` aus dem Proof of Concept).
- Alle Zahlen sind Startwerte fürs Balancing und gehören in `content/balance.yaml`.
- Konzept auf Deutsch, Code und Datenschlüssel auf Englisch (siehe Glossar).
