---
title: 'Implementation Readiness Report – Hollow Crown, Staffel 1'
date: 2026-10-23
project: 'Hollow Crown'
source: 'BMAD-Workflow gds-check-implementation-readiness (nicht interaktiv)'
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: final
verdict: 'NEEDS WORK → READY nach Klärung (Abschnitt 9)'
includedFiles:
  - concept/20-game-brief/brief.md
  - concept/21-gdd/gdd.md
  - concept/24-architecture/architecture.md
  - concept/10-tech-architecture.md
  - concept/25-ux/DESIGN.md
  - concept/25-ux/EXPERIENCE.md
  - concept/26-epics/epics.md
  - concept/26-epics/decision-log.md
  - concept/01-decisions.md
  - concept/22-narrative/narrative.md (nur Missionsfolge, Entscheidungen, Nebenquests, Support-Paare)
  - concept/23-art-direction/art-direction.md (nur §4.6 und §13 Offene Punkte)
  - src/persistence/save.ts, src/app/store.ts, src/core/state.ts (Ist-Stand für Story 1.2)
---

# Implementation Readiness Assessment Report

**Datum:** 2026-10-23
**Projekt:** Hollow Crown, Staffel 1
**Prüfgegenstand:** GDD, Architektur (Delta), UX (DESIGN/EXPERIENCE), Epics und Stories (12 Epics, 99 Stories)
**Gesamturteil:** **NEEDS WORK** – Epic 1–9 (MVP) sind weitgehend umsetzbar; vor dem Start von Story 1.2 und vor 1.5/1.6 müssen einige Punkte geklärt werden (siehe „Zusammenfassung und Empfehlungen“).

## 1. Dokumentinventar (Schritt 1, vorgegeben)

| Art | Datei | Status |
|---|---|---|
| Game Brief | `concept/20-game-brief/brief.md` | final |
| GDD | `concept/21-gdd/gdd.md` | final (ganzes Dokument, nicht gesplittet) |
| Architektur | `concept/24-architecture/architecture.md` (Delta zu `concept/10-tech-architecture.md`) | complete |
| UX | `concept/25-ux/DESIGN.md`, `concept/25-ux/EXPERIENCE.md`, Mockups `concept/25-ux/mockups/` | final |
| Epics und Stories | `concept/26-epics/epics.md` | final |
| Altes Entscheidungsprotokoll | `concept/01-decisions.md` (eingefroren; offene Punkte O1–O5, GA26) | eingefroren |

Keine Duplikate (Ganz- und Teilfassung) gefunden. Veraltete Verweise siehe 5.4.

## 2. GDD-Analyse

Das GDD nummeriert keine Anforderungen. `epics.md` enthält ein vollständiges Inventar (FR1–FR63, NFR1–NFR16, AR2–AR23, UX-DR1–UX-DR25), das das GDD, die Narrative, die Architektur und die UX abbildet. Diese Prüfung übernimmt die Nummerierung aus `epics.md` und hat das GDD Abschnitt für Abschnitt dagegen gelesen, um fehlende Anforderungen zu finden.

### 2.1 Functional Requirements

Die vollständigen Texte von FR1–FR63 stehen in `concept/26-epics/epics.md`, Abschnitt „Requirements Inventory“. Sie decken diese GDD-Abschnitte ab:

| Bereich | FRs | GDD-Abschnitt |
|---|---|---|
| Kampf und Regeln | FR1–FR10 | Game Mechanics, Tactics Specific Design, Sieg und Niederlage |
| Rollenklassen | FR11–FR17 | Rollenklassen, Gegner-KI, Einheitentypen |
| Leutnants | FR18–FR25 | Leutnants |
| Kampagne, Weltkarte, Heimsuchungen | FR26–FR33 | Kampagnenstruktur, Missionszustände, Welt und Erkundung, Quest-System |
| Story, Entscheidungen, Supports | FR34–FR42 | Quest-System, NPC und Dialog, Art and Audio |
| Fortschritt und Wirtschaft | FR43–FR48 | Figurensystem, Inventar, Progression and Balance |
| Heimat | FR49–FR55 | Heimat: Lager und Burg |
| Spielstände und Auslieferung | FR56–FR59 | Reproduzierbarkeit und Speichern, Sieg und Niederlage (Tod-Modus-Tabelle) |
| Inhalte | FR60–FR63 | Kampagnenstruktur, Narrative |

**Total FRs:** 63.

### 2.2 Non-Functional Requirements

NFR1–NFR16 laut `epics.md` (Leistung 60 FPS, Kaltstart < 5 s, < 15 MB, KI < 300 ms, Qualitätsstufen, Reproduzierbarkeit, Kern-Reinheit, Coverage, Offline, Daumenfreundlichkeit, Lesbarkeit, Daten statt Code, Sim-Korridore, kein Täglich-Druck, Nemesis-Leitplanken, Lizenz-Sperre, Spielzeit). **Total NFRs:** 16.

### 2.3 GDD-Anforderungen, die im Inventar fehlen oder nur unscharf stehen

| # | GDD-Anforderung | Befund |
|---|---|---|
| G1 | **Erwartete effektive Armee-Stufe je Story-Mission** (Tabelle „Erwartete effektive Armee-Stufe“, Schwierigkeitskurve „Gegnerstufe = erwartete Armee-Stufe + Akt-Zuschlag“, Heimsuchungs-Deckel „über der erwarteten Armee-Stufe der nächsten Story-Mission“) | Kein FR, kein Datenfeld. Architektur §5.4 (`campaign.yaml`) und §5.6 nutzen den Wert, definieren aber nicht, wo er steht (z. B. `expectedLevel` je Knoten). Fehlender Vertrag für Story 5.5, 5.6, 6.8 und alle Content-Stories. |
| G2 | Heimsuchungs-Gold „40 % **einer** Story-Mission des aktuellen Akts“ | Bezugswert unklar (Mittelwert, Minimum, letzte Mission?). Story 5.6 übernimmt die Unschärfe. |
| G3 | Raumstufen-Effekte (Konvoi: Vorlagen, „Bestes anlegen“; Händler: größeres Sortiment, Angebot des Tages, Rabatt, Glutfunke rotierend; Schmied +4/+5 und Neu würfeln; Heiler-Preise und Trauer 2; Taverne 4 Angebote, Wunschrolle) | In FR50 nur als „je 3 Stufen“ zusammengefasst; keine Story setzt die Effekte um (siehe 3.2). |
| G4 | Content-Regeln: jede Story-Karte 1–3 Nebenziele und ein Rollen-Element; kein Ziel mehr als zweimal hintereinander im Akt; jeder Leutnant in ≥ 2 Story-Missionen inkl. Finale | Nicht als FR und nicht als `content:check`-Regel. Die Narrative prüft es für die heutige Missionsfolge von Hand. |
| G5 | Armee-Limit 20 + 6 bei Beitritt über Entscheidung oder Ansprechen | Verhalten bei vollem Limit nicht beschrieben (FR41, Story 6.4 prüfen nur die Taverne). |
| G6 | Schwierigkeit „nur absenkbar“ | FR10 ist als „bestehend“ markiert; keine Story prüft, wo im neuen UI abgesenkt wird (Optionen sind spine-only). |

### 2.4 Zusätzliche Anforderungen und Randbedingungen

- Architektur AR1–AR23 (in `epics.md` als „Additional Requirements“ übernommen).
- Brownfield: Das Projekt existiert (PoC). Kein Starter-Template; Epic 1 beginnt richtigerweise nicht mit einem Projekt-Setup.
- Policy aus `AGENTS.md`: offene Punkte nicht stillschweigend entscheiden, nichts kommerziell veröffentlichen (GA26), Spielwerte nur in YAML.

### 2.5 Bewertung der GDD-Vollständigkeit

Das GDD ist für Staffel 1 vollständig und präzise; alle Zahlen sind als Startwerte markiert, 13 Annahmen stehen im Annahmen-Index. Schwächen: G1 (fehlender Datenvertrag), der veraltete Abschnitt „Development Epics“ (E1–E10, abweichend von den 12 Epics in `epics.md`) und der Hinweis „O1 und O2 sind hier entschieden“, der dem eingefrorenen Protokoll und `AGENTS.md` widerspricht (siehe Abschnitt 7).

## 3. Epic Coverage Validation

### 3.1 Coverage-Matrix

✓ = abgedeckt · ◐ = teilweise · ✗ = fehlt

| FR | Kurzfassung | Stories | Status |
|---|---|---|---|
| FR1 | Rundenablauf, freie Aktionen | 2.1 (bestehend übernommen) | ✓ |
| FR2 | Formeln, Vorschau = Auflösung | 2.1 | ✓ |
| FR3 | Supports, Tandem, Schutz, Trauer | 2.1, 4.9 | ✓ |
| FR4 | Tod-Modi, Verbluten 3 Phasen, Zwei-Narben-Regel | 1.6 | ✓ (O2-Status klären, Abschnitt 7) |
| FR5 | Neustart Runde/Mission je Tod-Modus | 1.5 | ✓ (O1-Status klären, Abschnitt 7) |
| FR6 | Missions- und Nebenziele, Verstärkungen | 2.1 | ✓ (bestehend) |
| FR7 | Ziele escort und treasure | 4.8 | ✓ |
| FR8 | Nebel des Krieges | 2.6 | ✓ |
| FR9 | KI-Profile und Zielwertung | 2.1, 2.4, 2.5, 3.3 | ✓ |
| FR10 | Schwierigkeit, nur absenkbar | 2.1 (nur Verweis) | ◐ (G6) |
| FR11 | Klasse als Rolle, Waffengruppen | 2.2 | ✓ |
| FR12 | 7 Kernrollen + Unikate | 2.2 | ✓ |
| FR13 | Klassen-Aktionen mit Vorschau | 2.3, 2.4, 2.5, 2.6 | ✓ |
| FR14 | Profi-Wege | 10.4 (grob) | ✓ |
| FR15 | Fallensteller, Schatten | 10.5 (grob) | ✓ |
| FR16 | KI kennt Haltezonen, nutzt Wirken | 2.4, 2.5 | ✓ |
| FR17 | Gegnertypen je Akt | 2.9, 11.1, 12.1 | ◐ (Tempelwache des Prologs fehlt in 2.9, steht nur in 8.3/9.1) |
| FR18 | 12 Leutnants als Content | 3.1 | ✓ |
| FR19 | Flucht bei 0 TP | 3.2 | ✓ |
| FR20 | Groll 0–3, Tier, Fähigkeiten, Senkung | 3.3, 3.4 | ✓ (Senkung hängt an 4.2) |
| FR21 | Groll-Ziel, Gedenk-Spott | 3.3 | ✓ (Zeilen hängen an 4.2/4.4) |
| FR22 | Stufe = Top-6-Durchschnitt + Groll | 3.4 | ✓ |
| FR23 | Kopfgeld, Signatur-Item | 3.5 | ✓ |
| FR24 | Steckbriefe, erste Begegnung 1-2 | 3.6, 9.3 | ✓ |
| FR25 | Seitenwechsel Grosk/Sable/Mael | 9.6, 9.7, 11.6, 12.4 (nur Inhalt), 5.5 („nicht gewechselt“) | ◐ **Keine Story in Epic 3** baut die Mechanik (Leutnant wird Gefährte: Rolle, Werte, Ausrüstung, Flag `joined`, Ausschluss aus Heimsuchungen) |
| FR26 | Akt-Struktur, freie Reihenfolge | 4.3 | ✓ |
| FR27 | Missionszustände | 4.3, 5.5 | ✓ |
| FR28 | Gestaffelte Regeln nach storyCount | 4.3, 9.1 | ✓ |
| FR29 | 3D-Weltkarte | 5.2, 5.3 | ✓ |
| FR30 | Tageswechsel | 5.4 | ✓ |
| FR31 | Heimsuchungs-Varianten | 5.5 | ✓ |
| FR32 | Heimsuchungs-Belohnung und Deckel | 5.6 | ◐ (G1, G2: Bezugswerte fehlen) |
| FR33 | 7 Nebenquests | 4.2, 4.3, 9.8, 9.9, 11.9, 12.9 | ✓ |
| FR34 | VN-Szenen, Sprechblasen, Log, Auto | 4.5 | ✓ |
| FR35 | Ersatzsprecher, Gedenkzeilen | 4.4 | ✓ |
| FR36 | 12 Entscheidungen | 4.6 + Content-Stories | ✓ |
| FR37 | Haltungsprofil | 4.6, 4.2, 12.8 | ✓ |
| FR38 | Chronik, Bonus-Ende | 4.7, 9.9, 12.7 | ✓ |
| FR39 | Epilog-Mosaik | 12.8 (grob) | ✓ |
| FR40 | 25 feste Paare | 4.9, 9.10, 10.8, 11.10 | ✓ |
| FR41 | Rekrutierung, Taverne, Armee-Limit | 6.4 | ◐ (G5) |
| FR42 | Teilvertonung | 8.9, 11.10 | ✓ |
| FR43 | Stufen, Deckel, EP-Regeln | 6.5 | ✓ |
| FR44 | Glutfunke, Aufstieg | 9.7, 9.8, 9.9, 10.3 | ◐ **3 rotierende Glutfunken beim Händler** (ab Händler-Stufe 3, 3 000 Gold, max. einer im Angebot) in keiner Story |
| FR45 | Items, Meisterung, Paperdoll … | 6.2 (bestehend) | ✓ |
| FR46 | Ausrüstungs-Tier je Akt | 6.4, 3.5 | ✓ |
| FR47 | Goldkurve, Kosten | 6.4, 6.8 | ✓ |
| FR48 | Verkettete Simulation | 6.8 | ✓ |
| FR49 | Lager Akt 1 | 6.3 | ✓ |
| FR50 | Burg, 11 Räume, 3 Stufen | 10.1, 10.2 | ◐ (G3: Stufeneffekte von Konvoi, Händler, Schmied, Heiler, Taverne ohne Story) |
| FR51 | Werkstatt | 10.6 | ✓ |
| FR52 | Gedächtnishalle, Lektionen | 6.7, 10.7 | ✓ |
| FR53 | Übungsplatz | 10.8 | ✓ |
| FR54 | Sichtbares Wachstum der Burg | 10.8 | ✓ |
| FR55 | Eroberung der Burgruine | 9.7 | ◐ (Heimat-Zustand nach dem MVP-Finale unklar, siehe 4.2 Nr. 1) |
| FR56 | Auto-Save, 3 Kampagnen, Plätze, Export/Import | 1.2, 1.3, 1.5 | ◐ **Export/Import in Standard/Casual** steht in keinem Akzeptanzkriterium (1.5 regelt nur Klassik) |
| FR57 | Spielstand über Releases und Staffel 2 | 1.2, 7.4, 11.11, 12.7, 12.10 | ✓ |
| FR58 | Akt-Pakete, offline | 7.1, 7.2, 7.3 | ✓ |
| FR59 | PoC-Stände erkannt, exportierbar | 1.2, 1.3 | ✓ |
| FR60 | Inhalte Akt 1 | 9.1–9.10 | ✓ |
| FR61 | Inhalte Akt 2 | 11.1–11.10 (grob) | ✓ |
| FR62 | Inhalte Akt 3 | 12.1–12.10 (grob) | ✓ |
| FR63 | DE und EN | 4.4, 9.x, 11.x, 12.x | ✓ |

### 3.2 Fehlende bzw. teilweise Abdeckung

**Hoch (vor dem betroffenen Epic ergänzen)**

- **FR25 Seitenwechsel:** Mechanik ohne Story. Empfehlung: Story 3.7 „Seitenwechsel“ (Wirkung `recruit` für Leutnants, Umwandlung in einen Gefährten mit Rolle und Startausrüstung, Flag `joined`, Ausschluss aus Heimsuchungen und Finale-Aufstellungen), spätestens vor 9.6/9.7.
- **G1 Erwartete Armee-Stufe:** Datenfeld und Ort festlegen (z. B. je Story-Knoten in `campaign.yaml`), bevor Epic 5 beginnt.
- **FR56 Export/Import Standard/Casual:** Kriterium in 1.5 (oder 1.3) ergänzen; EXPERIENCE nennt Import/Export ausdrücklich in der Kampagnen-Ansicht.

**Mittel (vor Epic 10 ergänzen, nicht MVP-blockierend)**

- **FR50/G3 Raumstufen-Effekte** und **FR44 Händler-Glutfunken:** eigene Stories in Epic 10 (z. B. „Händler, Schmied, Heiler, Taverne, Konvoi auf Stufe 2 und 3“).

**Niedrig**

- FR17 Tempelwache in 2.9 aufnehmen; G4 als `content:check`-Regeln; G5 Verhalten bei vollem Armee-Limit; G6 Schwierigkeit absenken im neuen UI.

### 3.3 Coverage-Statistik

- GDD-FRs (Inventar): 63
- Vollständig abgedeckt: 54
- Teilweise abgedeckt: 9 (FR10, FR17, FR25, FR32, FR41, FR44, FR50, FR55, FR56; FR55 und FR56 nur wegen Unklarheiten)
- Nicht abgedeckt: 0
- Abdeckung (mindestens eine Story): **100 %**; vollständig: **≈ 86 %**

**NFR-Abdeckung:** NFR3 (2.8), NFR5 (1.4, 2.4, 2.8, 5.5), NFR8 (7.2), NFR10 (1.6, 2.7, 3.2), NFR12 (6.8, 9.x), NFR14 (Epic 3), NFR15 (8.8) sind belegt. **Lücken:** NFR1 (60 FPS) und NFR2 (Kaltstart < 5 s) haben keine Story, die die Messung baut (Architektur §10 nennt einen Playwright-Lauf über die Gegnerphase; 9.11 verlangt nur „auf einem Referenzgerät gemessen“, 7.1 prüft nur die Größe). NFR4 ist Bestand (`render/board.ts` kennt `Quality`), „automatisch vorgewählt“ prüft keine Story. NFR9 (Tippziele ≥ 44 pt) steht in keinem Kriterium. NFR16 steht nur unmessbar in 9.11.

## 4. UX Alignment Assessment

### 4.1 Status der UX-Dokumente

Gefunden: `DESIGN.md`, `EXPERIENCE.md`, 8 Mockups. UX-DR1–UX-DR25 sind Epics zugeordnet. Spine-only (ohne Mockup): Chronik, Aufstellung, Optionen, Steckbrief-Liste.

### 4.2 Abweichungen zwischen UX, GDD, Architektur und Stories

| # | Befund | Betroffen | Schwere |
|---|---|---|---|
| 1 | **Heimat nach dem Akt-1-Finale:** EXPERIENCE-Flow „Mara“ zeigt nach Akt 1, vor dem Akt-2-Release, eine Burg mit ausbaubarem Schmied. Laut GDD ist die Burg Heimat „ab Akt 2“, laut `epics.md` kommt sie erst in Epic 10 nach dem MVP; Story 9.7 setzt `c.home` beim Finale auf `castle`, ohne dass es eine Burg-Szene gibt. Was MVP-Spieler nach dem Finale als Heimat sehen (Lager weiter? Burg-Platzhalter?), ist nicht festgelegt. | 6.3, 9.7, 7.3, 10.1, UX-Flow Mara | Hoch |
| 2 | **Klassen-Aktions-Platz für passive Rollen:** Das Dock hat vier feste Plätze inklusive „Klassen-Aktion“ mit Zähler. Halten (Vorkämpfer) und Nachsetzen (Plänkler) sind passiv bzw. ein Folge-Command; was der Platz für diese Rollen zeigt, beschreiben weder DESIGN noch EXPERIENCE noch 2.1/2.3/2.4. | 2.1, 2.3, 2.4 | Mittel |
| 3 | **Angebot des Tages:** Story 6.4 zeigt es im Händler des Lagers (Stufe 1); laut GDD gibt es das erst auf Händler-Stufe 3. | 6.4, 10.x | Mittel |
| 4 | **Langdruck-Konflikt:** Langdruck auf einen Gegner zeigt seine Gefahrenzone, Langdruck auf einen Leutnant öffnet den Steckbrief; Leutnants sind Gegner. Vorrang nicht festgelegt. | 2.1, 3.6 | Niedrig |
| 5 | **Import/Export-Ort:** EXPERIENCE legt Import/Export in die Kampagnen-Ansicht; 1.3 enthält ihn nicht, 1.5 nur für Klassik (siehe FR56). | 1.3, 1.5 | Mittel |
| 6 | **Veralteter Verweis:** EXPERIENCE „Offene Punkte“ sagt, `styles.css` werde „in Epic E7“ umgestellt; laut `epics.md` passiert das in Story 1.1. | 1.1 | Niedrig |
| 7 | **Schriften:** Story 1.1 nennt Fraunces als „einzige neue Abhängigkeit“; AR1 sagt „keine neuen Laufzeitabhängigkeiten“. Barlow und Barlow Condensed sind schon da, dazu vier PoC-Schriften (Cinzel, Grenze Gotisch, Nunito Sans, Silkscreen), deren Verbleib nicht geregelt ist (Bundle-Budget). | 1.1 | Niedrig |
| 8 | **Titel vor Kampagnen-Meta:** 1.1 baut „Fortsetzen“ mit Avatar, Akt und Stand, bevor 1.2 die Kampagnen-Metadaten liefert (der heutige `CampaignState` hat kein Feld `act`). | 1.1, 1.2 | Niedrig |
| 9 | **Architektur trägt die UX:** Szenen-Host (5.1), Worker (2.8), Pakete mit Fortschritt (7.2), `resolveScene` (4.4) und `previewAction` (2.3) decken die UX-Anforderungen ab. Kein UX-Element ohne Architekturbaustein gefunden. | – | ✓ |

### 4.3 Warnungen

- Die Burg in 3D (10.1) erzwingt laut EXPERIENCE eine neue Prüfung des oberen Heimat-Bereichs; Epic 10 ist deshalb vor der Umsetzung erneut mit UX abzugleichen.
- Art Direction §4.6 führt „Reittiere und Vierbeiner“ als offen. Der **Wolfsreiter** ist ein Akt-1-Gegner (2.9, 8.3); für den MVP fehlt damit die Pipeline-Entscheidung für Reittier-Figuren.

## 5. Epic Quality Review

### 5.1 Epic-Struktur

| Epic | Spielerwert | Unabhängig (nur Rückgriffe) | Bewertung |
|---|---|---|---|
| 1 Kampagnen und Spielstände | ja (mehrere Kampagnen, Neustart, Verbluten); enthält viel Fundament | ja | ✓ mit Mängeln in 1.2 (Abschnitt 6) |
| 2 Rollenklassen und Kampf-HUD | ja | ja | ✓ |
| 3 Leutnants | ja | **nein**: 3.2/3.3 brauchen Bedingungen, Wirkungen und Szenen aus Epic 4 | ◐ |
| 4 Akt-Struktur, Szenen, Entscheidungen | ja; 4.1 ist technisch | ja (4.8 verweist auf die Knoten-Karte aus 5.3) | ✓ |
| 5 Weltkarte und Heimsuchungen | ja; 5.1 ist technisch | ja (Leiste verweist auf Truppe/Heimat aus Epic 6, nutzt bis dahin Bestand) | ✓ |
| 6 Truppe, Fortschritt, Lager | ja; 6.8 ist Entwickler-Story | ja | ✓ |
| 7 Akt-Pakete und Offline | grenzwertig (technisch, aber mit Spielerwert formuliert) | ja | ✓ |
| 8 Chibi-Stil und Audio | ja | **nein**: 8.1 braucht 6.7, obwohl Epic 8 „ab Epic 2 parallel“ laufen soll | ◐ |
| 9 Akt 1 (MVP) | ja | ja | ✓ |
| 10–12 (grob) | ja | ja | ✗ noch nicht umsetzungsreif (bewusst, siehe 5.3) |

### 5.2 Befunde nach Schwere

#### 🔴 Kritisch

1. **Story 1.2 ist in der jetzigen Form nicht eindeutig umsetzbar** (Vorwärtsabhängigkeiten auf 1.3 und 1.4, fehlende Verträge für `contentVersion`, Kampagnen-ID und Metadaten, keine Regel für die Stabilität von `CampaignState` im Format 2). Details in Abschnitt 6.
2. **Status von O1/O2 widersprüchlich:** Das GDD erklärt O1 (Runde neu) und O2 (Verbluten-Countdown) für entschieden; `01-decisions.md` führt beide offen (O2-Empfehlung: „erst ohne Countdown testen“, U11: „O1 bleibt offen (Playtest)“), und `AGENTS.md` verlangt, O1–O5 nicht stillschweigend zu entscheiden. Stories 1.5 und 1.6 setzen die GDD-Fassung um. Vor deren Start braucht es eine ausdrückliche Bestätigung des Produktinhabers (Abschnitt 7).

#### 🟠 Major

3. **Vorwärtsabhängigkeiten Epic 3 → Epic 4:** 3.3 verlangt die Wirkung `grudge: { lt, delta: -1 }` (entsteht in 4.2) und Groll- bzw. Gedenk-Spottzeilen über `{ dead: <target> }` (4.2) und Szenen (4.4); 3.2 verlangt eine Fluchtzeile als Sprechblase, deren Content laut Architektur Szenen-IDs sind (4.4). Empfehlung: in 3.2/3.3 nur den Zustand (`routs`, `grudge`, `target`) und ein Event liefern; Zeilen und Wirkung als Kriterien nach 4.2/4.4 verschieben oder Epic 4 vor Epic 3 ziehen.
4. **FR25 Seitenwechsel ohne Mechanik-Story** (siehe 3.2).
5. **Datenvertrag „erwartete Armee-Stufe“ fehlt** (G1) – blockiert 5.5, 5.6, 6.8 und die Gegnerstufen der Content-Stories.
6. **Heimat nach dem MVP-Finale undefiniert** (4.2 Nr. 1).
7. **Tonbruch-Test zu spät:** Brief und GDD verlangen, die Gedenkszene im neuen Stil **früh** zu testen. 8.1 hängt an der Abschieds-Karte aus 6.7 und damit faktisch hinter Epic 6. Empfehlung: 8.1 mit einem Prototyp der Abschieds-Karte vorziehen oder 6.7 früher einplanen.
8. **Export/Import Standard/Casual ohne Kriterium** (FR56).
9. **Messung von NFR1/NFR2 ohne Story:** Playwright-Lauf mit Frame-Zeiten und Kaltstart-Messung (Architektur §10) braucht eine eigene Story vor 9.11.
10. **Nummern-Kollision und veraltete Verweise:** „E1–E12“ bezeichnet im GDD-Abschnitt „Development Epics“ und in der Architektur (§4 Spalte „Epics“, §9, §13.3 „neu, E0“) die alten Epics, in der Narrative und in Epic 9–12 die **Entscheidungen** E1–E12; `epics.md` nutzt „Epic 1–12“ mit anderer Bedeutung. Architektur-Frontmatter verweist noch auf `concept/21-gdd/epics.md`. Für Agenten, die AR-Zeilen lesen, führt das zu falschen Epics (z. B. AR16 „E0, E5“ = Epic 1).
11. **Klassen-Aktions-Platz für passive Rollen** unklar (4.2 Nr. 2).

#### 🟡 Minor

12. Technische Stories mit Entwickler-Rolle: 4.1, 6.8, 8.2 (sowie 5.1 und 7.1 als Spieler formuliert, aber rein technisch). Im Brownfield-Kontext vertretbar.
13. Zwischenlösungen mit absehbarem Umbau: `classes.yaml` (2.2) und `lieutenants.yaml` (3.1, „vorläufig“) entstehen vor dem Content-Layout aus 4.1.
14. Kleinere Vorwärtsverweise: 4.8 (Knoten-Karte aus 5.3), 4.9 (Marke in Truppe/Lager aus 6.1/6.3), 3.5 (Ergebnis-Mockup 08, gebaut in 6.6), 6.7 (Glockenschlag, Audio aus 8.8), 1.1 (Kampagnen-Meta aus 1.2).
15. Fehlende Fehlerfälle: 6.4 (zu wenig Gold, Armee-Limit voll), 1.3 (leerer Name), 1.5 (Import einer fremden Kampagne bei 3 belegten Plätzen).
16. Unmessbares Kriterium in 9.11: „Spielzeit von Akt 1 passt zu 25–30 Stunden für die Staffel“ – Zielwert für Akt 1 fehlt.
17. 6.4 „Dorfhilfe wirkt sichtbar“ im Händler, obwohl `villageAid` eine Heiltrank-Ladung ist.
18. GDD „Standard: 3 Slots“ gegenüber AR16 „Auto-Save + 3 Plätze“ – Lesart klarstellen.

### 5.3 Epics 10–12

30 Stories ohne volle Akzeptanzkriterien; 11.2–11.11 und 12.1–12.11 haben keine Story-Aussage („Als … möchte ich …“), meist ein einziges Kriterium und keine Fehlerfälle. Das ist im Decision-Log bewusst so entschieden („vor dem jeweiligen Akt verfeinern“) und blockiert den MVP nicht. Für `gds-sprint-planning` sollten diese Stories als „nicht bereit“ markiert werden.

### 5.4 Brownfield-Prüfung

Migrationspfade sind vorhanden: PoC-Spielstände → `legacy` (1.2/1.3), `camp.ts` → Kampagnen-Commands (1.4), PoC-Klassen → Rollen (2.2), PoC-Dialoge → Szenen-Schema 2 (4.4), Content-Layout (4.1), U20-Freischaltung → `requires` (6.3), Kriegslager-Hub entfällt (5.3). Bestehende Objekte (Balliste, Hebel, Qualitätsstufen) existieren im Code. Es fehlt eine Regel, wie Entwicklungs-Spielstände die Umbauten von `CampaignState` in Epic 3–6 überstehen (Abschnitt 6, Punkt 10).

### 5.5 Checkliste je Epic (MVP)

| Kriterium | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Spielerwert | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ◐ | ✓ | ✓ |
| Unabhängig | ◐ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ◐ | ✓ |
| Story-Größe | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Keine Vorwärtsabhängigkeit | ✗ (1.2) | ✓ | ✗ | ◐ | ◐ | ◐ | ✓ | ✗ (8.1) | ✓ |
| Daten bei Bedarf | ✓ | ✓ | ◐ | ✓ | ◐ (G1) | ✓ | ✓ | ✓ | ✓ |
| Klare Kriterien | ◐ | ✓ | ✓ | ✓ | ◐ | ◐ | ✓ | ✓ | ◐ |
| FR-Rückverfolgung | ✓ | ✓ | ◐ (FR25) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## 6. Story 1.2 „Speicherformat 2 mit Kampagnen“ – Unklarheiten vor der Umsetzung

Ist-Stand: `src/persistence/save.ts` öffnet `hollow-crown` Version 1 mit einem Store `saves` (keyPath `slot`), Records mit `version: 1` (nicht `format`), `appVersion` aus `VITE_APP_VERSION`, Export als `{ format: 'hollow-crown-save', checksum, body }`. `src/app/store.ts` schreibt den Auto-Save über `autosave(screen)` und erzeugt den Seed in `startNewGame`. `CampaignState` hat `version`, `flags: string[]`, `available`, aber kein `act`, keine Spielzeit und keine ID.

| # | Unklarheit | Warum relevant | Vorschlag zur Klärung (keine Produktentscheidung) |
|---|---|---|---|
| 1 | **Store-Name `saves` in V1 und V2 mit anderem Schlüssel** | IndexedDB kann den keyPath eines Stores nicht ändern. Im Upgrade müssen die V1-Records gelesen, der Store gelöscht, neu angelegt und die alten Records nach `legacy` geschrieben werden – alles in der Upgrade-Transaktion. | Ablauf im Kriterium festhalten; Test mit V1-Fixture → V2. |
| 2 | **`contentVersion` hat keine Quelle** | Der Paket-Hash (`packs.json`) entsteht erst in Epic 7; AR16/AR19 und das Journal-Checkpointing (1.4) hängen an diesem Wert. | Übergangsdefinition festlegen (z. B. Build-Hash des Content-Bundles) und in 7.1 ersetzen. |
| 3 | **Kampagnen-ID** | Import „überschreibt die Kampagne gleicher ID“ (AR18, 1.5) setzt eine stabile ID voraus. Erzeugung ist nicht beschrieben; `src/core` darf weder `Math.random` noch `Date.now` nutzen. | ID in `persistence`/`app` erzeugen und in `CampaignState` oder nur im Meta-Record führen – festlegen, wo. |
| 4 | **Felder des Stores `campaigns`** | Architektur nennt Name, Avatar, Tod-Modus, Schwierigkeit, Akt, Story-Fortschritt, Spielzeit. `act` existiert im State erst mit Epic 4; Spielzeit wird nirgends gemessen; „Name“ ist mehrdeutig (Kampagnenname oder Avatarname, 1.3 „Name“). Wer aktualisiert die Meta (bei jedem Auto-Save?). | Herleitung je Feld festlegen; Spielzeit-Messung (nur `app`) als Teil von 1.2 oder ausdrücklich verschoben. |
| 5 | **Vorwärtsabhängigkeit auf 1.4** | Kriterium „Wenn ein Command (Kampf **oder Kampagne**) angewendet wird“ – Kampagnen-Commands gibt es erst nach 1.4. | Formulieren als „nach jeder Zustandsänderung (Kampf-Command bzw. heutige Lager-Aktion)“. |
| 6 | **Vorwärtsabhängigkeit auf 1.3** | „Vierte Kampagne verlangt Löschen mit Rückfrage“ ist UI aus 1.3 (Langdruck → Löschen). | 1.2 liefert die Persistenz-Regel (Fehler `campaign_limit`, Löschen kaskadiert), 1.3 die UI. |
| 7 | **Zwischenzustand der App zwischen 1.2 und 1.3** | `Menus.tsx` und `Camp.tsx` listen heute Format-1-Slots und importieren Format 1. Nach 1.2 gibt es keine Kampagnenwahl, bis 1.3 fertig ist. | Minimalverhalten festlegen (z. B. „Fortsetzen“ = zuletzt geänderte Kampagne, „Neues Spiel“ legt eine Kampagne an; alter Import deaktiviert oder nach `legacy`). |
| 8 | **Löschen einer Kampagne** | Muss `saves` und `journal` der Kampagne mitlöschen; steht nirgends. | Kriterium ergänzen. |
| 9 | **Payload-Form** | Architektur: `battle: { start, commands, turnStartIndex }`; heute fehlt `turnStartIndex`, den 1.5 braucht. `screen` kennt heute `worldmap | camp | battle`; Architektur nennt Screens World, Home, Scene … | `turnStartIndex` schon in 1.2 aufnehmen; `screen`-Werte für Format 2 festlegen bzw. erweiterbar machen. |
| 10 | **Stabilität von `CampaignState` im Format 2** | Epic 3 (`lieutenants`), Epic 4 (`flags` als Record, `available` entfällt), Epic 5 (`day`), Epic 6 (`home`) ändern den State. Laut §5.15 gibt es Migrationen nur für Spielstände aus veröffentlichten Akten; §8.7 verlangt Defaults beim Laden. Ohne Regel brechen Fixtures und Entwicklungsstände bei jedem Epic. | Ausdrücklich festhalten: Format 2 gilt bis zum Akt-1-Release als instabil; neue Felder per Default, inkompatible Stände werden erkannt und abgewiesen (mit Export). Verhältnis von `CampaignState.version` zu `SaveRecord.format` klären. |
| 11 | **Reihenfolge der asynchronen Auto-Saves** | „Nach jedem Command asynchron“ kann zu überholenden Schreibvorgängen führen (älterer Stand landet zuletzt). | Schreibwarteschlange je Kampagne (letzter Stand gewinnt) als Kriterium. |
| 12 | **Upgrade blockiert** | Ist die App in einem zweiten Tab mit V1 offen, blockiert das Upgrade (`blocked`/`versionchange`). | Fehlerfall und Hinweis ergänzen. |
| 13 | **Tests für IndexedDB** | Vitest hat keine IndexedDB; `fake-indexeddb` fehlt in `package.json` (neue Dev-Abhängigkeit, AR1 regelt nur Laufzeit). Ein echter Format-1-Fixture-Spielstand muss aus dem PoC erzeugt werden. | Dev-Abhängigkeit freigeben; Fixture-Erzeugung beschreiben. |
| 14 | **Plätze je Modus** | GDD „Standard: 3 Slots“ vs. AR16 „Auto-Save + 3 Plätze“. Die Klassik-Sperre der Plätze liegt laut Epics in 1.5. | Lesart AR16 bestätigen; 1.2 speichert `auto`, `1`–`3` modusunabhängig. |
| 15 | **O1-Abhängigkeit** | Die Platz-Regeln je Tod-Modus folgen der GDD-Tabelle, deren Neustart-Teil (O1) laut Protokoll offen ist. Für 1.2 selbst nicht blockierend, solange die Plätze modusunabhängig gespeichert werden. | – |

**Fazit für 1.2:** Punkte 2, 3, 4, 5, 6, 7 und 10 sollten vor dem Start in der Story-Datei (`gds-create-story`) geklärt werden; die übrigen sind Ergänzungen der Kriterien. Keiner der Punkte erfordert eine Entscheidung zu O1–O5 oder GA26.

## 7. Offene Punkte (nicht entschieden) und betroffene Stories

| Punkt | Stand | Betroffene Stories |
|---|---|---|
| **O1** Runde neu starten in Standard/Casual | GDD (Tod-Modus-Tabelle) und Story 1.5 setzen „ja“ voraus; `01-decisions.md` O1 und U11: „bleibt offen (Playtest)“; `AGENTS.md`: nachfragen. **Status bestätigen lassen.** | 1.5, 6.6 (Niederlage bietet Neustarts), 9.11 (Playtest), UX-Flow Lena |
| **O2** Verbluten mit Countdown | GDD: 3 eigene Phasen; `01-decisions.md` O2: „erst ohne Countdown testen“. **Status bestätigen lassen.** | 1.6, 2.7 (Text „Verblutet nach n Phasen“), 6.8 und alle Sim-Korridore (NFR12), UX-DR5 |
| **O3** Kosmetik-Katalog, Preise | nach V1 | keine (Monetarisierung ist Out of Scope) |
| **O4** Store-Name, Markenrecherche | vor Store-Release | 8.7 (Logo, Titel), 9.11 (Release), spätere Capacitor-Stories |
| **O5 / GA26** Lizenzen ChatGPT-Bilder und ElevenLabs | offen; nichts kommerziell veröffentlichen | ganz Epic 8 (8.1–8.9), 9.11, 11.10, 11.11, 12.11, NFR15; jede öffentliche Veröffentlichung |
| **Brief, offene Frage Narrative 1:** Entscheidungen und Datenmodell `campaign.flags` | durch Narrative (12 Entscheidungen) und AR10 (Flag-Register) inhaltlich beantwortet, im Brief aber weiter als offen geführt | 4.2, 4.6, 12.7, 12.8 – Schließung bestätigen lassen |
| **Brief, offene Frage Narrative 2:** Was übernimmt Staffel 2 (Spielstand, Truppe, Ausrüstung)? | AR20: derselbe Spielstand plus Zusammenfassung; Umfang Truppe/Ausrüstung nicht entschieden | 1.2 (Langzeit-Stabilität des Formats), 7.4, 12.7, 12.10 |
| **Nemesis-Patent** rechtlich prüfen | vor Veröffentlichung (GDD-Annahme 13) | Epic 3, 5.5, 9.11 |
| **Kamerawinkel D2** | Playtest | 5.1, 8.6 |
| **Reittiere und Vierbeiner** (Art Direction §4.6) | offen | 2.9, 8.2, 8.3 (Wolfsreiter in Akt 1) |
| **Paket-Budgets, Animationsgröße der Tripo-Figuren** | Startwerte | 7.1, 8.2 |
| **Burg in 3D, UX-Neuprüfung** | offen bis 3D-Burg steht | 10.1 |
| **13 GDD-Annahmen** (Kopfgeld, Signatur-Chance, Armee-Limit, Raumkosten …) | Startwerte für Balancing, als Daten umsetzbar | 3.5, 6.4, 10.2, 10.3 u. a. – nicht blockierend |

## 8. Zusammenfassung und Empfehlungen

### Gesamtstatus

**NEEDS WORK.** Die Planung ist ungewöhnlich vollständig: alle 63 FRs haben mindestens eine Story, die Architektur deckt jedes UX-Element ab, die MVP-Stories haben Gherkin-Kriterien. Der Befund ist nicht „NOT READY“, weil keine Lücke ein ganzes Epic in Frage stellt. Er ist nicht „READY“, weil die erste anstehende Story (1.2) Vorwärtsabhängigkeiten und fehlende Verträge hat und zwei Stories desselben Epics (1.5, 1.6) auf Punkten beruhen, deren Status zwischen GDD und Protokoll widersprüchlich ist.

### Kritische Punkte (sofort)

1. **Story 1.2 schärfen** – Abschnitt 6, vor allem `contentVersion`, Kampagnen-ID, Meta-Felder, Zwischenzustand der App bis 1.3, Stabilitätsregel für `CampaignState`, Entkopplung von 1.3/1.4.
2. **O1/O2 vom Produktinhaber bestätigen lassen**, bevor 1.5 und 1.6 beginnen (GDD sagt entschieden, Protokoll und `AGENTS.md` sagen offen).

### Empfohlene nächste Schritte

1. Story-Datei 1.2 mit `gds-create-story` anlegen und die Punkte aus Abschnitt 6 dort als Kriterien bzw. Klärungen aufnehmen.
2. Produktinhaber fragen: Status von O1 und O2; Heimat nach dem MVP-Finale (Lager bleibt oder Burg-Platzhalter); Schließung der Brief-Frage „Entscheidungen/`campaign.flags`“.
3. `epics.md` ergänzen: Story 3.7 Seitenwechsel; Epic 3 von Epic 4 entkoppeln (oder Reihenfolge 4 vor 3); Export/Import für Standard/Casual in 1.5; Mess-Story für NFR1/NFR2 vor 9.11; 8.1 vorziehen; Datenfeld „erwartete Armee-Stufe“ vor Epic 5; Raumstufen-Effekte und Händler-Glutfunken in Epic 10.
4. Verweise bereinigen: GDD „Development Epics“, Architektur §4/§9/§13.3 und Frontmatter auf die Epic-Nummern aus `epics.md` umstellen; Entscheidungen durchgängig als „Entscheidung E1“ oder Epics als „Epic 1“ schreiben. (Neue Einträge ins jeweilige `decision-log.md`, nicht in `01-decisions.md`.)
5. Danach `gds-sprint-planning`; Epics 10–12 als „nicht bereit“ führen.

### Schlussbemerkung

Diese Prüfung fand **2 kritische, 9 große und 7 kleine Befunde** in den Kategorien Abdeckung, UX-Abgleich, Story-Qualität und Abhängigkeiten, dazu 15 Klärungspunkte zu Story 1.2 und 13 offene Punkte mit betroffenen Stories. Die kritischen Punkte sollten vor der Umsetzung von 1.2 bzw. 1.5/1.6 geklärt werden; die übrigen lassen sich vor dem jeweils betroffenen Epic nachziehen. Offene Punkte (O1–O5, GA26, offene Fragen des Briefs) wurden nicht entschieden, nur aufgelistet.

*Prüfer: Claude (gds-check-implementation-readiness, nicht interaktiv), 2026-10-23.*
## 9. Auflösung (2026-10-23, Produktinhaber)

Alle Befunde wurden mit dem Produktinhaber per Fragetool geklärt; Einträge im `decision-log.md` dieses Ordners.

| Befund | Auflösung | Wo umgesetzt |
|---|---|---|
| Story 1.2 unklar | umgesetzt; Kampagnen-ID in Meta und `SaveRecord`, `contentVersion` als Content-Prüfsumme bis Epic 7, Lösch-Dialog als Zwischenlösung, Journal-Store angelegt | Story-Datei 1.2 |
| O1, O2 widersprüchlich | beide geschlossen wie GDD (Runde neu Standard/Casual; Verbluten 3 Phasen) | Decision-Log |
| Epic 3 → Epic 4 | Epic 4 vor bzw. mit Epic 3 | `epics.md` Reihenfolge, 3.2, 3.3 |
| FR25 ohne Story | Story 3.7 Seitenwechsel | `epics.md` |
| Erwartete Armee-Stufe | `expectedLevel` je Story-Knoten | Story 4.1 |
| Heimat nach dem Finale | erst „Lager bis Akt 2“, dann abgelöst durch die Course Correction 8/8/8: Burg ab 1-6 Heimat, Ausbau ab Akt 2 | Story 6.9, 9.7, Epic 10, EXPERIENCE (Mara) |
| Tonbruch-Test spät | bleibt nach 6.7 | – |
| Export/Import Standard/Casual | Kampagnen-Ansicht, alle Modi | Story 1.3 |
| NFR1/NFR2 ohne Story | Story 7.5 Leistung messen | `epics.md`, 9.14 |
| Nummern-Kollision | Entscheidungen E1–E12, Epics „Epic N“ | Architektur §4, §9, §13.3 |
| Klassen-Aktion passiv | Zustand mit Info | 2.1, EXPERIENCE |
| Langdruck Leutnant | Steckbrief plus Gefahrenzone | 3.6, EXPERIENCE |
| Angebot des Tages | erst Händler-Stufe 3 | 6.4 |
| Staffel 2 | alles trägt weiter | Decision-Log (AR20 bleibt gültig) |
| Wolfsreiter | zu Fuß, Vierbeiner nach dem MVP | 2.9 |
| Kleinkram G2, G5, G6, Schriften, Slots, Spielzeit, Epics 10–12, D2 | Vorschläge übernommen; Spielzeit folgt 8/8/8 (Staffel 30–35 Stunden) | Decision-Log, 1.1, 3.7, 9.14, Sprint-Status |
| O4, O5/GA26, Nemesis-Patent | laut Produktinhaber geklärt (`licensing.md`) | – |

**Neues Urteil: READY** für Epic 1 und die MVP-Epics. Offen sind nur Nachträge in GDD und Art Direction, die die dort arbeitenden Sessions übernehmen.
