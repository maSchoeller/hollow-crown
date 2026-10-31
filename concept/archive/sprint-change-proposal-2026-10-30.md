---
title: "Sprint Change Proposal: Kampf lesbar machen und Handbuch"
status: freigegeben und umgesetzt (2026-10-30)
created: 2026-10-30
source: BMAD-Workflow gds-correct-course (Batch-Modus) nach einer UX-Werkstatt (Grilling) mit dem Produktinhaber
mockup: concept/25-ux/mockups/10-lesbarkeit-handbuch.html
scope: Moderat (zwei neue Epics, keine Neuplanung)
---

# Sprint Change Proposal: Kampf lesbar machen und Handbuch

## 1. Problem

**Auslöser:** UX-Werkstatt am 2026-10-30. Der Produktinhaber wollte das Spielgefühl deutlich verbessern und nannte als Ideen ein besser sichtbares Raster, Lebensleisten über den Figuren und ein Wiki im Menü. Der Assistent hat die App gebaut, den Prolog-Kampf auf einem iPhone-13-Profil fotografiert und Varianten auf dem Brett-Bild des Kampf-Mockups gezeichnet. Art der Änderung: neue Anforderung des Produktinhabers.

**Problem:** Das Brett ist schwer zu lesen, und die Regeln stehen nirgends im Spiel. Das schwächt die Säule „Lesbare Taktik“ (GDD) gerade für Erstspieler im MVP-Playtest.

**Belege (Screenshots im Mockup, Abschnitt 1):**

1. Kein Raster: Auf Wiese und Pflaster verschwimmen die Feldgrenzen.
2. Bewegungs- und Angriffsbereich sind durchgehende Flächen ohne Kanten.
3. TP stehen nur in der Einheitenkarte der gewählten Figur.
4. Die Gefahrenzone färbt fast das ganze Brett in einem Rot, ohne Abstufung.
5. Waffendreieck, Elemente, Zustände, Groll und Verbluten kann man nicht nachlesen; die Prolog-Lektionen sind nach einmaligem Lesen weg.

## 2. Auswirkungen

### Epics und Stories

| Epic | Auswirkung |
|---|---|
| 1–8, 10–12 | keine Änderung an bestehenden Stories |
| 9 Akt 1 (MVP) | Story 9.14 (Abstimmen und Veröffentlichen) wartet auf Epic 13 |
| **13 Kampf lesbar machen** (neu) | 9 Stories: Optionen und Raster, Bereiche und Weg-Pfeil, Lebensleisten, Schadensvorschau und Kill-Marker, Gefahrenzone mit Stufen, Zielfeld-Check und Warnung, Gegnerphase-Rückblick, Gegner-Leiste, Häkchen/Kamera/Zurück |
| **14 Handbuch** (neu) | 7 Stories: Content und Schema, Screen und Einstieg, vier Inhaltsstories (Grundlagen/Kampf, Gelände/Zustände/Leutnants/Tod, Klassen, Heimat/Items), Lektionen und Kontext-„?“ |

### Artefakte

| Artefakt | Änderung |
|---|---|
| GDD, Brief, Narrative | keine; die Epics stellen bestehende Regeln dar und erklären sie |
| `concept/25-ux/EXPERIENCE.md` | Informationsarchitektur (Handbuch, Options-Block), Navigation (Menü mit Handbuch), 13 neue Komponenten-Muster, Zustände, Interaktionen (Doppeltipp, vierte Zoomstufe, Hover, M), Diegetik, Barrierefreiheit |
| `concept/25-ux/DESIGN.md` | Tokens `hp-bar`, `grid-mark`, `range-tile`, `threat`, `kill-marker`, `help-stone`; 14 neue Komponenten-Zeilen; Glut-Ausnahme für den Rand der kritischen Lebensleiste |
| `concept/25-ux/mockups/10-lesbarkeit-handbuch.html` | neu: Ist-Zustand, Varianten, Entscheidungen |
| `concept/24-architecture` | Absatz in §5.12 und §8.3, Decision-Log: reine Kernfunktionen über `dangerZone`/`threatTiles` und `forecast`, Overlays und DOM-Ebene, Einstellungen, `content/core/handbook.yaml` |
| `concept/26-epics/epics.md` | UX-DR26–UX-DR31, Epic-Liste, Reihenfolge, Epics 13 und 14, Validierung; HTML neu erzeugt |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Epics 13 und 14 mit Stories als `backlog` |

### Technik

- Kein neues Speicherformat, keine Migration: Einstellungen liegen in `settings`, das Handbuch ist Content. Entdecken und Bestiarium würden das ändern und sind deshalb verschoben.
- Neue reine Funktionen im Kern mit Unit-Tests (Coverage von `src/core` steigt).
- Bildrate: Lebensleisten, Marker und Raster dürfen die Ziele aus Story 7.8 nicht unterschreiten.
- Bundle: `handbook.yaml` und die Locales liegen im Paket `core`; Budget prüft `pnpm build`.

## 3. Empfohlener Weg

**Direkte Anpassung:** zwei neue Epics im bestehenden Plan, kein Rollback, kein MVP-Schnitt. Epic 13 kommt vor dem MVP-Release, weil Erstspieler genau an der Lesbarkeit scheitern; Epic 14 folgt direkt nach dem Release und vor Akt 2.

- Aufwand: Epic 13 mittel (Overlays und Kernfunktionen, viel Wiederverwendung von `dangerZone`, `forecast`, `floatLayer`); Epic 14 mittel bis hoch (Schema, Screen, Texte DE + EN).
- Risiko: niedrig; größtes Risiko ist die Bildrate auf schwachen Handys durch viele DOM-Elemente über dem Brett.
- Zeit: verschiebt Story 9.14 um Epic 13.

## 4. Entscheidungen im Detail

Alle Punkte vom Produktinhaber bestätigt; die Empfehlung des Assistenten wurde jeweils gewählt, Zusätze stehen dabei.

| Thema | Entscheidung |
|---|---|
| Reihenfolge | Brett lesen + Züge absichern zuerst (Epic 13), dann Handbuch (Epic 14) |
| Raster | Eckpunkte immer dezent; gewählter Bereich als Einzelkacheln mit Außenkante; Option aus/dezent/stark |
| Lebensleiste | über dem Kopf, Teamfarbe, Teilstrich je 5 TP (ab 40 max. TP je 10), Leutnant Goldkontur, unter 25 % Glutrand, Schadensvorschau |
| Sichtbarkeit | Option Immer/Nur verletzte/Aus, Standard Immer, auch in der Gegnerphase |
| Gefahrenzone | Kante + drei Stufen + Zahl ab 2; **Zusatz:** Zahlen in den Optionen abschaltbar |
| Wer zählt | hold/guard wie heute, Schlafende nicht (gestrichelte Kante), Verstärkung mit Ankunftsmarke |
| Zielfeld-Check | Linien, Pille, Gelände-Chip; PC beim Hover |
| Kill-Marker | voll = fällt bei Treffer, halb = nur mit Krit; dazu Warn-Totenkopf über gefährdeten eigenen Figuren |
| Rückblick | Niedergestreckte/Gefallene, Treffer, Verstärkungen und geweckte Gegner |
| Gegner-Leiste | **Zusatz:** als Option, Standard aus |
| Kleineres | Weg-Pfeil, Fertig-Häkchen, **Zusatz:** Kamera-Griffe (Doppeltipp, Herauspinchen bzw. M) und Zurück an der Figur |
| Optionen | Block „Brett-Anzeige“ |
| Handbuch | Nachschlagen + Kontext-„?“, Name „Handbuch“, Einstieg aus Kampfmenü, Weltkarte und Titel; Entdecken/Bestiarium später |
| Kategorien | alle angebotenen plus **Zusatz:** Klassen mit Vor- und Nachteilen (Steckbrief mit Werte-Netz), dazu Lektionen |
| Texte | Entwurf DE + EN durch den Assistenten, Abnahme im Pull Request |
| Epics | zwei Epics, Epic 13 vor dem MVP-Release, Epic 14 danach und vor Akt 2 |

**Abgleich mit DESIGN.md** (keine neue Entscheidung): Kill-Marker als dunkler Stein statt Glutorange, Kontext-„?“ als Creme-Stein statt blau, weil Glut nicht für Markierungen auf dem Brett und Blau nur für Teams gilt. Einzige Glut-Ausnahme auf dem Brett ist der Rand der kritischen Lebensleiste, wie gewählt.

## 5. Übergabe

- **Umfang:** moderat (neue Epics, Backlog-Umbau).
- **Nächster Schritt:** Story 13.1 mit `gds-create-story` anlegen und mit `gds-dev-story` umsetzen, danach Epic 13 der Reihe nach; Story 9.14 erst nach Epic 13.
- **Erfolgskriterien:** Ein Erstspieler zählt im Prolog Felder ohne Nachfrage, erkennt angeschlagene Gegner ohne Antippen und zieht nicht unbemerkt in ein Feld, das drei Gegner erreichen; jede Regel aus der Kampfvorschau lässt sich mit einem Tipp nachlesen. Alle Prüfungen (`pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`) grün, Bildrate über den Zielen aus Story 7.8.
