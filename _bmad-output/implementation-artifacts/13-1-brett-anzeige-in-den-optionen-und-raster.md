# Story 13.1: Brett-Anzeige in den Optionen und Raster

Status: done

## Story

Als Spieler
möchte ich die Felder des Bretts zählen können und selbst bestimmen, wie viel Hilfe das Brett zeigt,
damit ich Reichweiten sicher einschätze, ohne dass das Diorama zum Schachbrett wird.

## Acceptance Criteria

**Angenommen** die Optionen (Titel und Menü)
**Wenn** der Spieler sie öffnet
**Dann** gibt es einen Block „Brett-Anzeige“ mit Raster (aus / dezent / stark), Lebensleisten (Immer / Nur verletzte / Aus), Gegner-Leiste (an/aus) und dem bisherigen Schalter „Gefahrenzone standardmäßig“
**Und** die Standardwerte sind Raster dezent, Lebensleisten Immer, Gegner-Leiste aus; die Werte liegen in `src/app/state/settings.ts`, nicht im Spielstand, und alte Einstellungen laden ohne Fehler.

**Angenommen** ein Kampf mit Raster „dezent“
**Wenn** das Brett steht
**Dann** liegen kleine Creme-Kreuze an allen Feldecken auf Feldhöhe, nie vom Szenenlicht gefärbt (Art Direction §2.5)
**Und** „stark“ zeichnet feine durchgehende Linien, „aus“ nichts; Deckkraft und Größe je Stufe stehen in `render.yaml`
**Und** die Bildrate bleibt über den Zielen aus Story 7.8.

## Tasks / Subtasks

- [x] T1 Einstellungen `grid`, `hpBars`, `enemyStrip` (`threatNumbers` nach dem Playtest 2026-10-30 entfernt) in `src/app/state/settings.ts` (Standard dezent / Immer / an / aus; alte Einstellungen laden über den Merge mit den Standardwerten)
- [x] T2 Options-Block „Brett-Anzeige“ in `Menus.tsx` (`Options`), Überschrift `.options__head` in `options.css`; „Gefahrenzone standardmäßig“ wandert in den Block
- [x] T3 Abschnitt `legibility` in `content/core/render.yaml` mit Zod-Schema (`schemas.ts`) und Typ `LegibilityDef` (`defs.ts`)
- [x] T4 Raster: `gridTile` (`render/board/shapes.ts`), ein Mesh je Karte (`buildGridMesh` in `overlays.ts`), ungelit, ohne Nebel, je Feld auf seiner Höhe; `BoardView.grid` baut es bei Wechsel und nach jedem Terrain-Aufbau neu
- [x] T5 Tests: `tests/unit/legibility-board.test.ts` (Raster-Striche bleiben im eigenen Feld, Zahl der Teile je Stufe)

## Dev Notes

- Quelle: `concept/26-epics/epics.md` Epic 13, Verhalten `concept/25-ux/EXPERIENCE.md`, Aussehen `concept/25-ux/DESIGN.md` (Tokens `hp-bar`, `grid-mark`, `range-tile`, `threat`, `kill-marker`), Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`, Architektur §5.12.
- Zahlen kommen aus reinen Kernfunktionen in `src/core/rules/legibility.ts` über `threatTiles` und `forecast` (Vorschau = Auflösung); Darstellungswerte in `content/core/render.yaml` unter `legibility`.
- Jedes Feld zeichnet nur die Hälfte des Strichs, die auf ihm liegt; Nachbarn ergänzen sich zu ganzen Kreuzen auf ihrer eigenen Höhe, ohne dass sich durchscheinende Flächen doppelt überlagern.
- Ein Mesh für die ganze Karte (24×32: 6 144 Vierecke), ein Draw Call.

## Dev Agent Record

- Umgesetzt zusammen mit allen Stories von Epic 13 auf dem Branch `claude/affectionate-fermat-tb1pzv`.
- Prüfungen: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Sichtprüfung per Screenshots (iPhone-13-Profil, Mission 1-1, ohne LFS-Grafik).

## Abnahme (2026-10-31)

Abgenommen im Spiel (375×812, Prolog und Mission 1-1, Screenshots in der Abnahme-Session) und gegen den Code geprüft; Stand nach dem Playtest 2026-10-30 (keine Feldzahlen, rot gefärbte Gegner statt Linien, kein Zurück-Stein). Bei der Abnahme behoben: Schadensvorschau zeigt die Leiste des Ziels auch bei Lebensleisten „Nur verletzte“/„Aus“; Marker und Häkchen schieben Groll-Wimpel und Zustands-Symbole hoch, auch wenn die Leiste verborgen ist; Tests für Doppelangriff, Element und alte Einstellungen verschärft; Standardwert „Zahlen an“ aus 13.1 gestrichen. Status: done.
