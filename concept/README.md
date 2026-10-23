# Hollow Crown – Konzeptordner

Anforderungsdefinition für **V1 (Vertical Slice)**. Ergebnis einer Grilling-Session am 2026-10-21. Hier wird nichts implementiert. Dieser Ordner ist die Grundlage für die Umsetzungs-Sessions.

## Lesereihenfolge

| Datei | Inhalt | Für wen |
|---|---|---|
| [20-game-brief/brief.md](20-game-brief/brief.md) | **Game Brief Staffel 1** (V1 = vollständige erste Staffel): Vision, Säulen, Umfang, Akte, Risiken. Löst `00-vision.md` und den V1-Umfang aus `13` ab | alle, zuerst lesen |
| [00-vision.md](00-vision.md) | ~~Pitch, Säulen, Zielgruppe, Marktanalyse~~ → abgelöst durch den Game Brief | Archiv |
| [01-decisions.md](01-decisions.md) | **Verbindliches Entscheidungsprotokoll**, offene Punkte | alle, zuerst lesen |
| [02-core-loop.md](02-core-loop.md) | Spielschleife Mission ↔ Lager | Design |
| [03-combat.md](03-combat.md) | Phasen, Formeln, Dreieck, Elemente, Status, Supports/Tandem, Tod | Kern-Implementierung |
| [04-units-progression.md](04-units-progression.md) | Werte, Bewegung, Wachstum, Klassen, Skills, Söldner | Kern-Implementierung |
| [05-inventory-items.md](05-inventory-items.md) | Paperdoll, Gewicht, Loot, Affixe, Runen, Sets, Verbrauch | Kern + UI |
| [06-maps-missions.md](06-maps-missions.md) | Gelände, Objekte, Nebel, Ziele, Trigger, KI-Profile, Scharmützel | Kern + Content |
| [07-camp-economy.md](07-camp-economy.md) | Lager-Funktionen, Ressourcen, Kosten | Kern + UI |
| [08-story-world.md](08-story-world.md) | Welt, Fraktionen, Figuren, Akt-1-Kapitel, Supports | Content |
| [09-ux-mobile.md](09-ux-mobile.md) | Bedienung, Breakpoints, Wireframes, Screens | UI |
| [10-tech-architecture.md](10-tech-architecture.md) | Stack, Module, Command/Event, Determinismus, Save, Tools, Tests | Technik |
| [11-content-format.md](11-content-format.md) | YAML-Formate (Karten, Klassen, Items, Skills, Dialoge, Kampagne) | Content + Technik |
| [12-monetization.md](12-monetization.md) | F2P-Leitplanken (nach V1) | Produkt |
| [13-v1-scope.md](13-v1-scope.md) | V1-Checkliste, Meilensteine, DoD, Abnahmeszenarien | Umsetzung |
| [14-glossary.md](14-glossary.md) | Glossar DE ↔ EN | alle |
| [15-art-direction.md](15-art-direction.md) | Stil, Farbwelt, Kapitel-Farbskript, Figuren-Briefings, Effekte, UI | Art + Render + UI |
| [16-asset-pipeline.md](16-asset-pipeline.md) | ChatGPT/Blender → Pixel → Babylon, Formate, Budgets, Qualitätsstufen, Art-Track A0–A5 | Art + Technik |
| [17-audio.md](17-audio.md) | Stimmen, Barks, SFX, Musik-Leitmotive, Mischung | Audio + Technik |
| [art/](art/) | Beispiele: Palette, Blender-Pixel-Beweis, Charakter-Sheets, Audio-Proben, Styleguide | alle |
| [data-samples/](data-samples/) | Beispieldaten: Balancing, Klassen, Charaktere, Skills, Items, Affixe/Runen/Sets, Supports, Karte Kap. 1, Dialog | Umsetzung |

## Konventionen

- **[A]** = abgestimmt, **[C]** = von Claude gesetzter Default bzw. Startwert (änderbar, aber Änderung in `01-decisions.md` dokumentieren).
- Alle Zahlen sind Startwerte fürs Balancing und gehören in `content/balance.yaml`.
- Konzept auf Deutsch, Code und Datenschlüssel auf Englisch (siehe Glossar).
