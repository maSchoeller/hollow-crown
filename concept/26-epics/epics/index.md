---
title: 'Hollow Crown – Epics und Stories (Staffel 1)'
stepsCompleted: [1, 2, 3, 4]
status: final
created: 2026-10-23
updated: 2026-10-30
readiness: concept/26-epics/implementation-readiness-report-2026-10-23.md (Auflösung der Befunde in Abschnitt 9)
source: BMAD-Workflow gds-create-epics-and-stories
decisions: concept/26-epics/decision-log.md
inputDocuments:
  - concept/21-gdd/gdd.md
  - concept/21-gdd/epics.md
  - concept/21-gdd/extract-01-decisions.md
  - concept/20-game-brief/brief.md
  - concept/22-narrative/narrative.md
  - concept/23-art-direction/art-direction.md
  - concept/24-architecture/architecture.md
  - concept/25-ux/DESIGN.md
  - concept/25-ux/EXPERIENCE.md
supersedes: concept/21-gdd/epics.md (Grobfassung)
---

# Hollow Crown – Epics und Stories (Staffel 1)

## Overview

Dieses Dokument zerlegt GDD, Narrative, Architektur und UX von Hollow Crown, Staffel 1, in umsetzbare Epics und Stories. Es löst die Grobfassung `concept/21-gdd/epics.md` ab. Bis einschließlich Burg-Ausbau und Akt 2 (Epic 10 und 11, verfeinert am 2026-10-31) sind die Stories mit vollen Akzeptanzkriterien ausgearbeitet; Akt 3 steht als Story-Liste mit Kurz-Kriterien und wird vor dem Akt verfeinert. Jede Story ist erst fertig, wenn `pnpm lint`, `pnpm test`, `pnpm content:check` und `pnpm build` grün sind (AGENTS.md).

Kennzeichnung: **(neu)** gibt es im PoC nicht, **(geändert)** ersetzt PoC-Verhalten, **(bestehend)** ist im PoC umgesetzt und wird nur übernommen bzw. geprüft.

## Dateien

Je Epic eine Datei; nur die Datei des Epics lesen, an dem gearbeitet wird.

| Datei | Inhalt |
|---|---|
| [requirements.md](requirements.md) | Requirements Inventory: FR, NFR, AR, UX-DR und Coverage Map |
| [epic-01.md](epic-01.md) | Epic 1: Kampagnen und Spielstände |
| [epic-02.md](epic-02.md) | Epic 2: Rollenklassen und neues Kampf-HUD |
| [epic-03.md](epic-03.md) | Epic 3: Leutnants |
| [epic-04.md](epic-04.md) | Epic 4: Akt-Struktur, Szenen und Entscheidungen |
| [epic-05.md](epic-05.md) | Epic 5: Weltkarte und Heimsuchungen |
| [epic-06.md](epic-06.md) | Epic 6: Truppe, Fortschritt und Lager |
| [epic-07.md](epic-07.md) | Epic 7: Akt-Pakete und Offline |
| [epic-08.md](epic-08.md) | Epic 8: Chibi-Stil, Item-Bilder und Audio |
| [epic-09.md](epic-09.md) | Epic 9: Akt 1 „Asche“ (MVP) |
| [epic-10.md](epic-10.md) | Epic 10: Die Burg ausbauen (ab Akt 2) |
| [epic-11.md](epic-11.md) | Epic 11: Akt 2 „Glut“ |
| [epic-12.md](epic-12.md) | Epic 12: Akt 3 „Krone“ und Staffelende – grob |
| [epic-13.md](epic-13.md) | Epic 13: Kampf lesbar machen |
| [epic-14.md](epic-14.md) | Epic 14: Handbuch |

## Epic List

### Epic 1: Kampagnen und Spielstände
Spieler führen bis zu drei Kampagnen auf einem Gerät, sehen eine neue, spielzeughafte Oberfläche, speichern nach jeder Aktion sicher und starten Runde oder Mission nach den Regeln ihres Tod-Modus neu; Standard bekommt das Verbluten. Baut die UI-Grundlage (Stil B), Speicherformat 2, Kampagnen-Commands mit Journal und den Fehlerbericht.
**FRs covered:** FR4, FR5, FR56, FR57 (Format), FR59 · AR2, AR16–AR18, AR21, AR22 · UX-DR1–3, UX-DR17, UX-DR25

### Epic 2: Rollenklassen und neues Kampf-HUD
Spieler kämpfen mit Rollen statt Waffenklassen: Die Ausrüstung bestimmt Waffe und Element, jede Rolle hat eine eigene Klassen-Aktion auf festem Platz im neuen HUD; die Gegnerphase rechnet im Hintergrund und bleibt flüssig.
**FRs covered:** FR1–FR3, FR6, FR8–FR13, FR16, FR17 · AR8, AR14 · UX-DR4–6, UX-DR8, UX-DR24

### Epic 3: Leutnants
Spieler treffen auf benannte Leutnants, die bei 0 TP vorhersehbar fliehen, Groll gegen ihren Vertreiber tragen, mit der Truppe mitwachsen und Kopfgeld bringen.
**FRs covered:** FR18–FR25 · AR5 · UX-DR7, UX-DR23 (Steckbriefe)

### Epic 4: Akt-Struktur, Szenen und Entscheidungen
Spieler erleben einen Akt mit teils freier Missionsreihenfolge, Szenen mit Halbfiguren und Ersatzsprechern, Entscheidungen mit sichtbaren Folgen, eine Chronik und feste Support-Paare.
**FRs covered:** FR7, FR26–FR28, FR33 (Mechanik), FR34–FR38, FR40 · AR3, AR4, AR9, AR10, AR15 (Content-Layout) · UX-DR12, UX-DR13, UX-DR23 (Chronik)

### Epic 5: Weltkarte und Heimsuchungen
Spieler wählen ihre nächste Mission auf einer Weltkarte, die nach jeder Mission der Startpunkt ist, und finden jeden Tag neue Heimsuchungen von Leutnants auf bekannten Karten.
**FRs covered:** FR29–FR32 · AR6, AR7, AR12, AR13 · UX-DR9, UX-DR18 (Teil)

### Epic 6: Truppe, Fortschritt und Lager
Spieler verwalten ihre Truppe, rüsten aus, handeln und versorgen im Lager und ab 1-6 in der Paktwacht, sehen ein klares Ergebnis nach jeder Mission und nehmen Abschied von Gefallenen; die Kurven tragen über Akt 1 hinweg.
**FRs covered:** FR41, FR43, FR45–FR49, FR50 (Akt 1) · AR11 · UX-DR10 (Lager, Burg Stufe 1), UX-DR11 (Gedenksteine), UX-DR14, UX-DR15, UX-DR19, UX-DR20

### Epic 7: Akt-Pakete und Offline
Spieler laden das Spiel schnell, bekommen den Rest eines Akts im Hintergrund und spielen danach offline; neue Akte kommen per Update, ohne dass Spielstände brechen.
**FRs covered:** FR57 (Release-Ablauf), FR58 · AR15, AR19, AR23 · NFR1, NFR2, NFR8 · UX-DR18

### Epic 8: Chibi-Stil, Item-Bilder und Audio
Spieler sehen die Welt im Round-Chibi-Stil der Art Direction: Tripo-Figuren, Porträts mit Stimmungen, gemalte Item-Bilder, warmes Licht und Effekte, folk-lastige Musik und vertonte Schlüsselzeilen.
**FRs covered:** FR42, FR63 (Teil) · UX-DR16

### Epic 9: Akt 1 „Asche“ (MVP)
Spieler spielen Prolog und Akt 1 komplett: 9 Story-Missionen (Prolog + 8), 3 Nebenquests, 4 Leutnants, 4 Entscheidungen, Akt-1-Supports, Eroberung und Verteidigung der Paktwacht. Eine Story je Mission; endet mit dem MVP-Release und Playtest.
**FRs covered:** FR55, FR60, FR63

### Epic 10: Die Burg ausbauen (ab Akt 2)
Spieler bauen die eroberte Paktwacht auf 11 Räume in drei Stufen aus, steigen per Glutfunke auf Profi-Wege auf und ehren Gefallene in der Gedächtnishalle. Verfeinert am 2026-10-31 und nach der Readiness-Prüfung neu geschnitten: 14 Stories (10.1 Räume, 10.2 Akademie, 10.3/10.4 Profi-Klassen und ihre Wirkungen, 10.5 Fallensteller und Schatten, 10.6 Verzauberer und Werkstatt, 10.7 Lektionen, 10.8 Übungsplatz und Lagerfeuer, 10.9–10.11 Raumfunktionen der Stufen 2 und 3 je Raumgruppe, 10.12 Söldner-Traits, 10.13 Anhängeteile, 10.14 Burg-Grafik nach der 3D-Entscheidung).
**FRs covered:** FR14, FR15, FR44, FR50 (ab Akt 2)–FR54 · UX-DR10 (Burg-Ausbau), UX-DR11 (Lektionen), UX-DR21

### Epic 11: Akt 2 „Glut“
Spieler spielen Akt 2 mit 8 Story-Missionen inklusive der großen Schlacht Kronfeld, 3 Nebenquests, 4 Leutnants und 4 Entscheidungen in der Eisenmark. Verfeinert am 2026-10-31 und nach der Readiness-Prüfung neu geschnitten: 22 Stories (11.1–11.4 Akt-Übergang, Positionsstufe, Paket und Simulation; 11.5 Gefährten und Leutnants; 11.6 Balliste; 11.7 Flieger, Gegner und Herbst; 11.8 Ziel-Phasen; 11.9 Relikt-Stufen; 11.10–11.17 je eine Mission mit Kurzspezifikation; 11.18–11.20 Nebenquests; 11.21 Supports und Chronik-Szene; 11.22 Abstimmung).
**FRs covered:** FR17 (Akt 2), FR61, FR63

### Epic 12: Akt 3 „Krone“ und Staffelende – grob
Spieler spielen Akt 3 bis zum Staffelfinale, sehen das Epilog-Mosaik und nehmen ihre Entscheidungen als Staffel-Zusammenfassung mit in Staffel 2.
**FRs covered:** FR17 (Akt 3), FR39, FR57 (Staffel 2), FR62, FR63 · AR20 · UX-DR22

### Epic 13: Kampf lesbar machen
Spieler lesen das Brett auf einen Blick: Raster, Lebensleisten, Bereiche mit Kanten, eine abgestufte Gefahrenzone, Zielfeld-Check und Kill-Marker vor dem Zug, ein Rückblick nach der Gegnerphase. Neu seit der Course Correction 2026-10-30, vor dem MVP-Release.
**FRs covered:** – (Darstellung bestehender Regeln FR1, FR2, FR6, FR9) · UX-DR26–UX-DR29

### Epic 14: Handbuch
Spieler schlagen jede Regel im Spiel nach, aus dem Menü oder über ein „?“ an der Stelle, an der sie wirkt; Werte kommen aus den Content-Daten. Neu seit der Course Correction 2026-10-30, nach dem MVP-Release und vor Akt 2.
**FRs covered:** – · UX-DR30, UX-DR31

**Reihenfolge:** 1 → 2 → 4 → 3 → 5 → 6 → 7 → 8 → 9 bis 9.13 → 13 → 9.14 (MVP-Release) → 14, danach 10 → 11 → 12 (Course Correction 2026-10-30: Epic 13 vor dem MVP-Release, Epic 14 direkt danach und vor Akt 2). Epic 4 läuft vor Epic 3 (oder beide zusammen), weil Groll-Wirkung, Bedingungen und Szenen der Leutnants aus Epic 4 kommen. Gebaut wird Epic für Epic auf die Endfassung hin; ein Epic darf intern unfertig sein, solange das nächste darauf aufbaut. Epic 8 kann ab Epic 2 parallel laufen (Asset-Arbeit), seine Einbindung setzt die jeweiligen Szenen voraus. Die Burg ist ab 1-6 Heimat (Story 6.9); ihr Ausbau (Epic 10) ist spätestens mit Akt 2 fertig. Epic 10 und 11 laufen verschränkt (Verfeinerung und Readiness-Fixes 2026-10-31): 11.1 (Akt-Übergang) zuerst, dann 10.2, 10.3 und 10.4 parallel zu 11.2–11.7, danach die übrigen Stories von Epic 10 und die Missionen ab 11.10; 11.8 (Ziel-Phasen) vor 11.17 (Kronfeld); 11.22 (Abstimmung Akt 2) zuletzt, nach allen Epic-10-Stories bis 10.12. Details in den Absätzen „Reihenfolge“ beider Epics.

<!-- Stories: Format „Als … möchte ich …, damit …“; Akzeptanzkriterien in deutscher Gherkin-Form (Angenommen / Wenn / Dann / Und). -->

## Validierung

- **FR-Abdeckung:** FR1–FR63 sind in der Coverage Map einem Epic zugeordnet und in mindestens einer Story mit Kriterien hinterlegt; bestehende Regeln (FR1–FR3, FR6, FR9, FR10, FR45) werden in Story 2.1/2.2 bzw. 6.2 übernommen und nicht neu gebaut.
- **UX-Abdeckung:** UX-DR1–UX-DR31 sind Epics zugeordnet (Epic List) und in Stories mit Mockup-Verweis abgedeckt; UX-DR26–UX-DR31 kamen mit der Course Correction 2026-10-30 (Epics 13 und 14, 16 Stories).
- **Architektur:** Kein Starter-Template (Projekt existiert). Bausteine entstehen beim ersten Bedarf: Speicherformat 2 und Kampagnen-Commands (1.2, 1.4), Worker (2.8), Content-Layout, Bedingungen, Szenen-Schema (4.1, 4.2, 4.4), Szenen-Host (5.1), Pakete und ID-Sperre (7.1, 7.4).
- **Abhängigkeiten:** Jede Story baut nur auf früheren Stories auf; Verweise auf spätere Epics nennen nur, wo eine Ansicht später zusätzlich erreichbar wird (z. B. Steckbriefe über die Leiste ab Epic 5). Epic 8 kann ab Epic 2 parallel laufen.
- **Dateiwechsel:** Rollenmodell und Kampf-HUD liegen in einem Epic (2), Heimat-Räume in Epic 6 (Lager, Burg auf Stufe 1 ab 1-6) und Epic 10 (Burg-Ausbau ab Akt 2) mit demselben Raum-Muster; keine Mehrfach-Umbauten derselben Dateien über Epics ohne Grund.
- **Offen:** Epic 12 ist grob und wird vor Akt 3 verfeinert; Epic 10 und 11 sind seit 2026-10-31 verfeinert. Lizenzfrage GA26: siehe `concept/23-art-direction/licensing.md`.
- **Readiness (2026-10-23):** Befunde des Readiness-Checks mit dem Produktinhaber geklärt (Decision-Log); neu sind Story 3.7 und 7.5, mit der Course Correction 8/8/8 damit 108 Stories.
- **Nächster Schritt:** Umsetzung nach `_bmad-output/implementation-artifacts/sprint-status.yaml`, Story für Story mit `gds-create-story` und `gds-dev-story`.
