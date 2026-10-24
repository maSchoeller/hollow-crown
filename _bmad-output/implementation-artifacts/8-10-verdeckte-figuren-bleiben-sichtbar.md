# Story 8.10: Verdeckte Figuren bleiben sichtbar

Status: review

## Story

Als Spieler
möchte ich jede Figur sehen, auch wenn sie hinter oder in einem Haus, Turm, einer Ruine oder einem Baum steht,
damit ich keine Einheit übersehe.

## Acceptance Criteria

1. **Regel aus der Kamera:** Eine Requisite gilt als verdeckend, wenn sie eine Figur auf demselben Feld oder auf Feldern nördlich davon um mindestens `board.fade.cover` Felder ihrer Höhe verdeckt und seitlich überlappt. Die Reichweite folgt aus `camera.tiltDeg` und den Maßen des Modells (Höhe, Grundfläche), nicht aus einer festen Felderzahl.
2. **Schleier:** Verdeckende Requisiten werden halbdurchsichtig (Deckkraft `board.fade.alpha`), die Figur bleibt erkennbar; gilt für Spieler und Gegner, Karten- und Landschaftsrequisiten.
3. **Zurück:** Verlässt die Einheit das Feld, ist die Requisite sofort wieder deckend.
4. **Leistung:** Neu berechnet wird nur, wenn sich das Feld einer Einheit ändert (Zug, Gegnerphase, Aufstellung, Auftauchen/Verschwinden), nie jedes Bild; Thin Instances bleiben.
5. Werte in `content/core/render.yaml` (`board.fade`) mit Zod-Schema.

## Tasks / Subtasks

- [x] T1 `src/render/board/fade.ts`: reine Verdeckungsregel + Unit-Tests `tests/unit/prop-fade.test.ts` (AC 1)
- [x] T2 `board.ts`: Instanzen je Vorlage merken (`PropSet`), verblasster Zwilling je Vorlage mit Alpha-Material (Tiefen-Vorpass), `updateFade()` im Frame mit Schlüssel aus den Einheitenfeldern (AC 2–4)
- [x] T3 `render.yaml`/Schema/`RenderDef`: `board.fade { alpha, cover, figureWidth }` (AC 5)
- [x] T4 Prüfung im Browser bei 375×812 (Kap. 2: Haus, Kiefer, Laubbaum, Fort), Screenshots an den Produktinhaber

## Dev Notes

- Babylon legt die Thin-Instance-Puffer (`world0..3`, `instanceColor`) auf der **Geometrie** ab. Klone mit geteilter Geometrie überschreiben sich gegenseitig die Instanzen; deshalb bekommen der Landschafts-Klon (`sceneryTemplate`) und der Zwilling eigene Geometrie (`makeGeometryUnique`). Das behebt nebenbei einen Fehler aus PR #33, bei dem Karten- und Landschaftsbäume denselben Puffer teilten.
- Vertex-Alpha bleibt unangetastet (Teamtuch), der Schleier kommt nur aus der Material-Deckkraft.
- Gemessene Modellhöhen: Bäume 1,0–1,2, Haus 0,89, Fort 1,4, Ruine 0,69 (Felder). Bei 35° Neigung kostet ein Feld nach Süden ~1,43 Felder Höhe: Häuser verschleiern nur auf dem eigenen Feld, hohe Bäume und das Fort auch eine Figur ein Feld nördlich.
