# Story 15.13: Figuren auf Treppen (Fehlerbehebung zu 15.3–15.5)

Status: done

## Story

Als Spieler
möchte ich meine Figuren auf Treppen, Rampen und Leitern sichtbar auf den Stufen stehen sehen,
damit ich Höhenwechsel auf dem Brett lesen kann.

## Acceptance Criteria

Grundlage: `concept/26-epics/epics/epic-15.md` Story 15.13, Meldung des Produktinhabers vom 2026-11-06 („Läuft eine Figur Treppen hoch, steht sie nicht auf der Treppe, und die Treppen werden durchsichtig“). Höhenstufen kamen mit PR #104 (1-4 drei Stufen, 1-6/1-8 Terrassen und Wehrgänge, N1 Dächer und Leitern).

1. **Höhe auf der Verbindung:** Eine Figur auf einem Feld `ramp`, `stairs` oder `ladder` steht auf der Oberfläche des Modells an ihrer Position: Rampe als gerade Schräge, Treppe auf der Trittfläche der Stufe unter ihr (fünf Stufen), Leiter entlang der Sprossen. Sie schwebt nicht und steckt nicht im Modell.
2. **Lauf über die Stufen:** Während der Bewegung folgt die Höhe der Oberfläche stetig (Rampe, Leiter) bzw. Stufe für Stufe (Treppe), ohne Sprung in der Feldmitte; an der hohen Kante trifft sie die Höhe des oberen Felds.
3. **Nie durchsichtig:** Treppen, Rampen und Leitern blenden bei Verdeckung nie aus. Häuser, Dächer, Mauerteile und andere Gebäude blenden weiter aus wie bisher (Story 8.10).
4. **Verdeckte Figur:** Ist eine Figur hinter einer Treppe verdeckt, bleibt sie erkennbar mit dem Mittel, das das Projekt schon hat; gibt es keins, wird das gemeldet statt etwas Neues zu erfinden.
5. **Werte in YAML:** Die Form der Verbindungen (Stufenzahl, Anfang und Ende der Steigung im Feld) und die Liste der nie ausgeblendeten Modelle stehen in `content/core/render.yaml`, nicht im Code.
6. **Tests:** Höhe je Feld und Position auf der Verbindung; Liste der Modelle, die ausblenden dürfen.
7. **Belege:** Bilder bei 375 × 812, vorher und nachher: Figur auf einer Treppe in 1-4 und auf dem Wehrgang in 1-6. `pnpm check` grün.

## Tasks / Subtasks

- [x] T1 Ursache belegen (AC 1–3): Höhe in `placeUnit`, Ausblendregel `hidesFigure` für das eigene Feld.
- [x] T2 Reine Funktion für die Oberflächenhöhe einer Verbindung (AC 1, 2, 5) mit Test.
- [x] T3 `placeUnit` und `groundOf` nutzen sie (AC 1, 2).
- [x] T4 Ausblenden: Liste `fade.solid` in `render.yaml`, Regel in `fade.ts`, Test (AC 3, 5, 6).
- [x] T5 Bilder vorher/nachher, `pnpm check` (AC 7).

## Dev Notes

- **Höhe heute:** `BoardFrame.placeUnit` (`src/render/board/boardFrame.ts`) setzt die Figur auf `terrain.standOn(round(x), round(y))`; für Verbindungen ist das `height + stand` (`content/core/terrain.yaml`: ramp/stairs 0,42, ladder 0,3), also ein fester Wert je Feld. Beim Lauf springt die Höhe in der Mitte zwischen zwei Feldern. `groundOf` (`boardUnits.ts`, nur Grudge-Linie) interpoliert linear zwischen Feldmitten.
- **Modelle:** `tools/art/props/interior.py` `ramp_idle`, `stairs_idle`, `ladder_idle`; Höhe `WALL_H` = 0,85 = `render.board.levelHeight`. Rampe: Fläche `(y + 0,5) · h` über die ganze Feldtiefe. Treppe: fünf Stufen, Stufe i deckt `[i/5, (i+1)/5]` der Tiefe, Trittfläche `(i+1) · h/5` – in der Feldmitte also 0,51, nicht 0,42. Leiter: Fuß bei y = −0,26, oben bei y = 0,47 (Anteil 0,24 … 0,97 der Feldtiefe). Richtung: `connectorRot` in `wallKit.ts` (zum einen höheren Nachbarn).
- **Ausblenden heute:** `BoardProps.updateFade` mit `hidesFigure` (`fade.ts`): Jede Requisite auf dem eigenen Feld der Figur, deren Oberkante mehr als `cover` über den Füßen liegt, gilt als verdeckend – darum blendet eine Treppe immer aus, sobald eine Figur auf ihr steht.
- **Verdeckung, vorhandene Mittel:** Ausblenden der Requisite (Story 8.10), Bodenring, HP-Abzeichen und Wimpel als DOM-Ebene über dem Brett (`badges.ts`, immer sichtbar). Einen Umriss oder Röntgenblick für Figuren gibt es nicht.
- Kein Regelcode (`src/core`) betroffen; Replays unverändert.

### References

- `concept/24-architecture/architecture.md` §5.3a (Darstellung der Höhenstufen)
- `concept/23-art-direction/art-direction.md` §5 (begehbar: Feldmitte frei, Boden sichtbar)
- Story 8.10 (Ausblenden), PR #104 (Höhenstufen)

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Completion Notes List

- **Ursache Höhe:** `placeUnit` setzte die Füße auf den festen Wert `height + stand` des gerundeten Felds. Auf der Treppe liegt der Tritt in der Feldmitte bei 0,51 (Stufe 3 von 5), `stand` war 0,42: die Figur steckte in den Stufen. Im Lauf sprang die Höhe an der Feldgrenze (schwebte an der unteren Kante 0,42 über dem Boden, steckte an der oberen Kante 0,43 im Modell).
- **Ursache Durchsichtigkeit:** `hidesFigure` zählt jede Requisite auf dem eigenen Feld der Figur als verdeckend, sobald ihre Oberkante mehr als `cover` über den Füßen liegt. Die Treppe (Oberkante ~1,0 über ihrem Fuß) erfüllte das immer, also verblasste sie unter jeder Figur.
- **Fix:** `floorOf`/`surfaceAt` (`terrain3d.ts`) mit der reinen Funktion `connectorSurface` (`src/render/shared/connectors.ts`): Fläche je Punkt entlang des Anstiegs zum höheren Nachbarn, Treppe Tritt für Tritt, Rampe und Leiter glatt, Ende auf der Oberkante des höheren Felds (Dach, nächste Verbindung). `placeUnit`, `groundOf`, `standOn` und `topOf` nutzen sie; `stand` der drei Verbindungen in `terrain.yaml` entfällt. Ausblenden: `render.board.fade.solid` = ramp, stairs, ladder, `mayFade` in `fade.ts`, `updateFade` überspringt diese Sätze; Häuser, Dächer, Mauerteile verblassen wie bisher.
- **AC 4:** Ein Umriss oder Röntgenblick für Figuren existiert im Projekt nicht. Eine hinter einer Treppe verdeckte Figur bleibt über HP-Abzeichen und Wimpel (DOM über dem Brett, immer sichtbar) und den Bodenring erkennbar. Neu erfunden wurde nichts (an die auftraggebende Session gemeldet). Praktisch kommt die Lage kaum vor: Treppen sind höchstens eine Stufe hoch, und der Nachbar hinter ihnen ist das höhere Feld.
- **Review (bmad-code-review, 4 Ebenen):** behoben: Hochpunkt der Steigung auf die Oberkante des höheren Felds (Dach mit `stand` 0,37, Treppe auf Treppe), flacher Vorlauf bei `from > 0`, `topOf` für Picking und Kamera, Richtung je Feld zwischengespeichert, Test gegen `connectorRot` in allen vier Richtungen, Verweis in `interior.py`. Zurückgestellt: Verdrahtung in `BoardProps` ohne Unit-Test (Babylon-Klassen, keine Testumgebung; Bilder belegen sie), `fade.solid` als freie Zeichenkette (Test prüft die YAML-Liste), Ausblend-Prüfung nutzt die Feldmitte statt der Position im Lauf.
- Nummer 15.12 bleibt frei (Vorgabe der auftraggebenden Session).
- **Belege** bei 375 × 812 (Playwright, Dev-Build): `15-13-belege/1-4-treppe-{vorher,nachher,vergleich}.jpg`, `1-6-wehrgang-{vorher,nachher,vergleich}.jpg`; Vergleich oben vorher, unten nachher, links stehend, rechts im Lauf zur oberen Stufe.

### File List

- `src/render/shared/connectors.ts` (neu), `src/render/shared/terrain3d.ts`, `src/render/board/fade.ts`, `boardBase.ts`, `boardFrame.ts`, `boardProps.ts`, `boardUnits.ts`
- `src/core/renderDefs.ts`, `src/content/schemas.ts`, `content/core/render.yaml`, `content/core/terrain.yaml`, `tools/art/props/interior.py`
- `tests/unit/connectors.test.ts` (neu)
- `concept/24-architecture/architecture.md`, `decision-log.md`, `concept/26-epics/epics/epic-15.md`, `index.md`, `sprint-status.yaml`, `15-13-belege/`
