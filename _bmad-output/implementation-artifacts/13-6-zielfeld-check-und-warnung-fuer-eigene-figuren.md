# Story 13.6: Zielfeld-Check und Warnung für eigene Figuren

Status: review

## Story

Als Spieler
möchte ich vor dem Bestätigen sehen, welche Gegner mein Zielfeld erreichen und welche meiner Figuren fallen könnten,
damit ich nicht aus Versehen in eine Falle ziehe.

## Acceptance Criteria

**Angenommen** eine gesetzte Geist-Figur auf einem Zielfeld (Handy) bzw. die Maus über einem erreichbaren Feld (PC, Hover)
**Wenn** das Feld feststeht
**Dann** führen gestrichelte rote Linien von jedem Gegner, der das Feld in seiner nächsten Phase erreicht (Regeln wie Story 13.5), zum Feld
**Und** eine Pille unter den Ziel-Pillen sagt „n Gegner erreichen dieses Feld“ (ab 2 auf Rot-hell, bei 1 auf Creme, bei 0 keine Pille)
**Und** am Feld steht der Gelände-Chip mit Name, Verteidigung, Ausweichen und Heilung als Symbol + Zahl aus `terrain.yaml`.

**Angenommen** die Spielerphase
**Wenn** die Summe des Schadens bei Treffer aller Gegner, die eine eigene Figur erreichen, ihre aktuellen TP erreicht (ohne Krit und Trefferchance, mit Doppelangriff)
**Dann** steht über dieser Figur ein grauer Warn-Totenkopf mit „!“ (DESIGN.md `kill-marker.warn`)
**Und** er verschwindet, sobald die Bedingung nicht mehr gilt; die Rechnung ist eine getestete reine Funktion.

## Tasks / Subtasks

- [x] T1 `tileThreats(data, s, unit, at)`: Gegner, die das Feld in ihrer nächsten Phase erreichen (Regeln wie 13.5; die Figur steht dabei schon auf dem Feld)
- [x] T2 Gestrichelte rote Linien (Creme darunter) von jedem dieser Gegner zum Feld (`lines`)
- [x] T3 Pille „n Gegner erreichen dieses Feld“ unter den Ziel-Pillen (`ThreatPill`, ab 2 auf Rot-hell, bei 1 Creme, bei 0 keine)
- [x] T4 Gelände-Chip am Feld (`TerrainChip`, Symbol + Zahl, Bonus grün), mit der Kamera mitgeführt (`BoardView.pin`)
- [x] T5 PC: Hover über ein erreichbares Feld bei gewählter Einheit zeigt denselben Check und den Weg (`onHover`, entprellt je Feld)
- [x] T6 `perilWarnings`: Summe des Schadens bei Treffer (mit Doppelangriff, ohne Krit) aller Gegner, die eine eigene Figur erreichen, gegen ihre TP; grauer Warn-Totenkopf mit „!“
- [x] T7 Tests: `tileThreats`, `perilWarnings` (Grenze, Schlafende)

## Dev Notes

- Quelle: `concept/26-epics/epics.md` Epic 13, Verhalten `concept/25-ux/EXPERIENCE.md`, Aussehen `concept/25-ux/DESIGN.md` (Tokens `hp-bar`, `grid-mark`, `range-tile`, `threat`, `kill-marker`), Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`, Architektur §5.12.
- Zahlen kommen aus reinen Kernfunktionen in `src/core/rules/legibility.ts` über `threatTiles` und `forecast` (Vorschau = Auflösung); Darstellungswerte in `content/core/render.yaml` unter `legibility`.
- Rechenzeit `perilWarnings` auf der Referenzschlacht ca. 18 ms (Desktop), einmal je Zustand in der Spielerphase.

## Dev Agent Record

- Umgesetzt zusammen mit allen Stories von Epic 13 auf dem Branch `claude/affectionate-fermat-tb1pzv`.
- Prüfungen: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Sichtprüfung per Screenshots (iPhone-13-Profil, Mission 1-1, ohne LFS-Grafik).
