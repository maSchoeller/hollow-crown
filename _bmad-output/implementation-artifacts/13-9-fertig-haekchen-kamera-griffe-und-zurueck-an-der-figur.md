# Story 13.9: Fertig-Häkchen, Kamera-Griffe und Zurück an der Figur

Status: review

## Story

Als Spieler
möchte ich sehen, wer schon gehandelt hat, schnell zu einer Figur oder zur ganzen Karte springen und eine Bewegung direkt an der Figur zurücknehmen,
damit sich lange Runden flüssig spielen.

## Acceptance Criteria

**Angenommen** eine Figur hat in dieser Phase gehandelt
**Wenn** sie auf dem Brett steht
**Dann** trägt sie zusätzlich zur Entsättigung ein kleines grünes Häkchen am Kopf (DESIGN.md Fertig-Häkchen).

**Angenommen** das Brett
**Wenn** der Spieler doppelt auf eine Figur tippt
**Dann** gleitet die Kamera auf sie, ohne sie zu wählen oder eine Aktion auszulösen
**Und** Herauspinchen über die weiteste Zoomstufe hinaus bzw. am PC Taste M oder Mausrad zeigt die ganze Karte (vierte Zoomstufe, aus der Kartengröße berechnet; Rand in `render.yaml`); erneutes Hineinzoomen kehrt zur weitesten Stufe zurück.

**Angenommen** eine gesetzte Geist-Figur vor der Aktion
**Wenn** der Spieler am PC rechts klickt
**Dann** steht die Figur wieder auf dem Startfeld wie mit dem bisherigen Zurück (FR1); die Leisten-Taste „Zurück“ bleibt; einen eigenen Zurück-Stein an der Figur gibt es nicht (Playtest 2026-10-30: überfüllte Bedienung).

## Tasks / Subtasks

- [x] T1 Fertig-Häkchen in den Abzeichen (grüner Stein, weißer Haken), aus `acted` in der eigenen Phase und den Events `exhausted`/`refreshed`/`phase`
- [x] T2 Doppeltipp auf eine Figur (`onDoubleTap`, `legibility.doubleTapMs`): Kamera gleitet hin, ohne Auswahl oder Aktion
- [x] T3 Vierte Zoomstufe „ganze Karte“: Herauspinchen bzw. Mausrad über die weiteste Stufe, am PC Taste M (`wholeMap`); Größe aus Kartengröße und freier Fläche mit Rand `view.wholeMapMargin`
- [x] T4 Rechtsklick nimmt die Bewegung zurück (wie bisher `onCancel`); die Leisten-Taste „Zurück“ bleibt; der Zurück-Stein neben der Geist-Figur ist nach dem Playtest 2026-10-30 entfernt

## Dev Notes

- Quelle: `concept/26-epics/epics.md` Epic 13, Verhalten `concept/25-ux/EXPERIENCE.md`, Aussehen `concept/25-ux/DESIGN.md` (Tokens `hp-bar`, `grid-mark`, `range-tile`, `threat`, `kill-marker`), Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`, Architektur §5.12.
- Zahlen kommen aus reinen Kernfunktionen in `src/core/rules/legibility.ts` über `threatTiles` und `forecast` (Vorschau = Auflösung); Darstellungswerte in `content/core/render.yaml` unter `legibility`.
- Damit ein Doppeltipp keine Aktion auslöst, wartet ein Tipp auf eine Figur `doubleTapMs` (300 ms) auf den zweiten; Tipps auf leere Felder gehen sofort durch. Im Playtest prüfen, ob sich die Auswahl damit träge anfühlt (Wert in `render.yaml`).

## Dev Agent Record

- Umgesetzt zusammen mit allen Stories von Epic 13 auf dem Branch `claude/affectionate-fermat-tb1pzv`.
- Prüfungen: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Sichtprüfung per Screenshots (iPhone-13-Profil, Mission 1-1, ohne LFS-Grafik).
