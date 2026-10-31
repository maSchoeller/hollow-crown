# Story 13.2: Bereiche als Kacheln und Weg-Pfeil

Status: done

## Story

Als Spieler
möchte ich Bewegungs- und Angriffsbereich als einzelne Felder mit klarer Kante sehen und meinen Weg als Pfeil,
damit ich nicht raten muss, wie weit eine Figur kommt.

## Acceptance Criteria

**Angenommen** eine gewählte eigene Einheit
**Wenn** ihr Bereich erscheint
**Dann** ist jedes erreichbare Feld eine Einzelkachel mit kleiner Lücke und runden Ecken in Teamblau, Angriffsfelder ebenso in Rot, und der Bewegungsbereich hat eine gemeinsame Außenkante (Creme unter Blau)
**Und** Haltezonen, Wirken-Felder und Ziele behalten ihre bisherige Darstellung (Story 2.4, 2.5).

**Angenommen** ein gesetztes Zielfeld
**Wenn** die Geist-Figur dort steht
**Dann** zeigt ein dicker, runder Pfeil mit Creme-Rand den Weg vom Start bis zum Ziel, mit Spitze am Ziel; er ersetzt die bisherige Weg-Markierung.

## Tasks / Subtasks

- [x] T1 Einzelkacheln mit Lücke und runden Ecken (`roundedTile`), Bewegung in Teamblau, Angriff in Rot, Heilen in Grün (`legibility.range`)
- [x] T2 Gemeinsame Außenkante des Bewegungsbereichs (`outerEdges` + `edgeRibbons`): Creme unter Blau
- [x] T3 Weg-Pfeil (`arrow`): runde Linie durch die Feldmitten, Spitze kurz hinter der Mitte des Zielfelds, Creme-Rand; ersetzt die alte Weg-Markierung
- [x] T4 Feste Zeichenreihenfolge der Markierungen über `alphaIndex` (`LAYER` in `overlays.ts`), damit Creme nie über der Linie liegt
- [x] T5 Tests: Außenkante (Einzelfeld, Nachbarn, Loch), Kachel mit Lücke, Pfeilspitze

## Dev Notes

- Quelle: `concept/26-epics/epics.md` Epic 13, Verhalten `concept/25-ux/EXPERIENCE.md`, Aussehen `concept/25-ux/DESIGN.md` (Tokens `hp-bar`, `grid-mark`, `range-tile`, `threat`, `kill-marker`), Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`, Architektur §5.12.
- Zahlen kommen aus reinen Kernfunktionen in `src/core/rules/legibility.ts` über `threatTiles` und `forecast` (Vorschau = Auflösung); Darstellungswerte in `content/core/render.yaml` unter `legibility`.
- Haltezonen (Schraffur), Wirken-Felder und Ziele behalten ihre bisherige Darstellung.
- Am PC zeigt der Pfeil beim Hover über ein erreichbares Feld schon den Weg (Story 13.6).

## Dev Agent Record

- Umgesetzt zusammen mit allen Stories von Epic 13 auf dem Branch `claude/affectionate-fermat-tb1pzv`.
- Prüfungen: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Sichtprüfung per Screenshots (iPhone-13-Profil, Mission 1-1, ohne LFS-Grafik).

## Abnahme (2026-10-31)

Abgenommen im Spiel (375×812, Prolog und Mission 1-1, Screenshots in der Abnahme-Session) und gegen den Code geprüft; Stand nach dem Playtest 2026-10-30 (keine Feldzahlen, rot gefärbte Gegner statt Linien, kein Zurück-Stein). Bei der Abnahme behoben: Schadensvorschau zeigt die Leiste des Ziels auch bei Lebensleisten „Nur verletzte“/„Aus“; Marker und Häkchen schieben Groll-Wimpel und Zustands-Symbole hoch, auch wenn die Leiste verborgen ist; Tests für Doppelangriff, Element und alte Einstellungen verschärft; Standardwert „Zahlen an“ aus 13.1 gestrichen. Status: done.
