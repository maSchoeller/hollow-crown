# Story 11.26: Leistung von Akt 2

Status: review

## Story

Als Spieler
möchte ich auch in der Brandschneise und in Kronfeld flüssig spielen,
damit die großen Schlachten von Akt 2 auf dem Handy funktionieren.

## Acceptance Criteria

Grundlage ist `concept/26-epics/epics/epic-11.md` Story 11.26. Der Produktinhaber war bei der Umsetzung nicht erreichbar; alles mit **[ASSUMPTION]** ist eine vorläufige Entscheidung des Entwicklers (Fragen in `morgen-fragen-11-26.md` der Sitzungsnotizen).

1. **Messung 2-4 und 2-8:** Gemessen werden 2-4 „Die Brandschneise“ (`m2_4_brandschneise`, 30 × 40, Feuer, `set_terrain` je Runde) und 2-8 „Kronfeld“ (`m2_8_kronfeld`, 30 × 40, rund 60 Figuren, Ballisten) mit dem Messwerkzeug von Story 15.11: Ø FPS, p95, max, Draw Calls, Dauer der Gegnerphase (einzeln und gemeinsam), Ladezeit des Bretts, JS-Heap; dazu die längste Gegnerphase je Mission aus der Simulation (`PERF_PHASE`). Desktop mit CPU-Drosselung 2× / 4× steht für das Handy (NFR1 in der Fassung von 15.11: 60 FPS bei 2×, 30 FPS bei 4×, kein Frame über 100 ms, Gegnerphase ≤ 15 s bei 1× und „Gemeinsam“).
2. **Paketgröße:** Größe des Pakets `act2` und des ersten Downloads gegen die Budgets aus `content/packs.yaml` (act2: 40 MB, Startwert „11.26 misst nach“).
3. **Optimieren, wo das Budget reißt:** gezielte, risikoarme Änderungen an der Darstellung (keine Regeln, keine Karten, keine Gegnerzahl). Die Gegnerzahl zu senken entscheidet die Abstimmung (Story 11.27) mit dem Produktinhaber; hier nur als Empfehlung **[ASSUMPTION]**.
4. **Automatische Prüfung:** `PERF_LARGE=1 pnpm perf` misst 2-4 und 2-8 mit (Akt-2-Paket im Perf-Build, Figuren der Truppe am eigenen Knoten); `tools/phase-state.ts` erzeugt die längste Phase auch für Knoten von Akt 2.
5. **Gegnerphase und Kamera auf 30 × 40 wie in Akt 1:** „Gemeinsam“ mit Zeitgrenze, Schnelldurchlauf (2×, Überspringen) und Kamera (Gleiten, Übersicht) funktionieren auf den Akt-2-Karten; die Messung steht in dieser Story.
6. **Offen bleibt das Gerät:** Die Messung auf dem Referenzgerät (Pixel 6a / iPhone 12) bleibt Release-Check (Story 9.14) und ist hier und im PR als offen benannt.
7. **Prüfungen:** `pnpm check` grün.

## Tasks / Subtasks

- [x] T1 Messwerkzeug für Akt 2: Perf-Build mit act2 (`.env.perf`, `packs-plugin.ts`), Bench spielt Inhaltskarten am eigenen Knoten (`actMapBattle`), Zeilen 2-4/2-8 im Large-Test, Spalten Laden/Heap, Ursachen der langen Frames und Zeit der Neubau-Schritte im Log; `phase-state.ts` für Akt 2 (`prepareActData`, `--lost`).
- [x] T2 Messung vorher (2×/4×, einzeln/gemeinsam, gespeicherte Phasen).
- [x] T3 Optimierung dessen, was das Budget reißt: Gelände-Neubau bei Feuer.
- [x] T4 Messung nachher, Tabelle hier und im PR.
- [x] T5 `pnpm check`, Status `review`, PR.

## Dev Notes

- Messverfahren und Kennzahlen: `_bmad-output/implementation-artifacts/15-11-leistung-grosser-karten.md` (Dev Agent Record), Architektur §10 „Große Karten“.
- Grenzen: `src/core` nicht ändern, keine Karten-YAMLs, Spielwerte in YAML; nie `released: true`, nie `content:lock`.

### References

- [Source: concept/26-epics/epics/epic-11.md#Story 11.26]
- [Source: concept/26-epics/epics/requirements.md NFR1]
- [Source: concept/24-architecture/architecture.md §5.14, §10]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Debug Log References

- Vorbereitung: `git lfs pull`, `pnpm art:build` (frischer Worktree), `pnpm tsx tools/phase-state.ts m2_4 --runs 3`, `pnpm tsx tools/phase-state.ts m2_8 --runs 3 --lost`.
- Läufe: `PERF_GPU=1 PERF_LARGE=1 PERF_STAGES=2,4 PERF_RUNS=2 PERF_LARGE_MAPS=reference,m2_4_brandschneise,m2_8_kronfeld pnpm perf --project pixel6a` und `PERF_GPU=1 PERF_PHASE=.phase/m2_4.json,.phase/m2_8.json PERF_STAGES=2,4 PERF_RUNS=2 pnpm perf --project pixel6a --grep "saved battle"`.
- Rechner: Intel UHD 630 (ANGLE/D3D11). Profil pixel6a (412 × 915, DPR 2,625). Die Läufe „nachher“ liefen, während eine andere Sitzung einen Dev-Server mit Akt 2 betrieb (CPU gesamt 45–60 %); die Referenzschlacht, an der 11.26 nichts ändert, fiel dabei bei 2× von 59,9 auf 35–37,5 FPS. FPS-Werte von vorher und nachher sind deshalb nicht direkt vergleichbar. Belastbar sind die Stillstände (max ms), die Zeit der Neubau-Schritte und die Dauer der Gegnerphase.
- Szenario „Eröffnung“ (Large-Test): die Inhaltskarte an ihrem Knoten (2-4: `m2_4`, 2-8: `m2_8`), alle bis dahin beigetretenen Gefährten auf der Positionsstufe des Knotens, alle Gegner `aggressive`, erste Gegnerphase bei Tempo 1×. 2-4 = 33 Figuren, 2-8 = 42 Figuren zu Beginn; die Verstärkungen von 2-8 (bis rund 60) kommen später, sie stecken in der gespeicherten Phase (Runde 3).
- Szenario „längste Phase“ (`PERF_PHASE`): die Phase mit dem längsten Plan aus der Simulation (3 Läufe, Normal, Start `expected`), 2-4 Runde 2 (Feuer, `set_terrain`), 2-8 Runde 3 (Ballisten, Verstärkungen, Tor).

### Ursache (gemessen)

Jeder Geländewechsel baute das ganze 30 × 40-Gelände samt Rand neu (50 × 60 Felder, Splat-Karte 400 × 480 Texel mit 25-fachem Weichzeichner). In 2-4 Runde 2 waren das drei Neubauten zu je ~1,5 s bei 2× (Summe 4,5–5,2 s, `buildTerrain` im Log) und ~4 s Stillstand bei 4×; in 2-8 ein Neubau (Tor) mit ~1,5 s. Requisiten (40–200 ms), Raster (25–80 ms) und Flammen (10–80 ms) fielen kaum ins Gewicht. Neue Shader während der Phase: 0–2.

### Änderung (reine Darstellung; Kern, Karten, Balance und KI unverändert, Replays gleich)

- `terrain3d.ts`: `sameBlocks(a, b)` erkennt Wechsel, die keinen Block ändern (Höhe samt Ebene, Standhöhe, Klippe, Wasser, Verbindung, Steg). Für sie malt `TerrainView.repaint(grid)` nur die Splat-Karte neu (`RawTexture.update`). Meshes, Boden und Wasser bleiben.
- `splatData` (neu, rein): die Splat-Karte je Feld statt je Texel nachgeschlagen, das Rauschen der Ränder je Größe und Seed zwischengespeichert, der Weichzeichner als zwei Durchläufe mit laufender Summe, die Mischfaktoren ohne Arrays je Texel. Das Ergebnis ist bytegleich, ein Test vergleicht es mit dem alten Verfahren. Ein voller Neubau dauert ungedrosselt 150–180 ms statt 450–550 ms (Bench `terrainRebuild`, 2-4).
- `boardProps.ts`: Bleibt jedes Feld gleich (ein Wald fängt Feuer und zeigt, was brennt), bleiben Boden und Requisiten stehen. Sonst wird die Splat-Karte neu gemalt und die Requisiten werden neu gesetzt (Bäume verschwinden in der Asche, Bench: 2 166 Requisiten nach Repaint wie nach vollem Neubau). Flammen und Lichter bleiben, solange dieselben Felder brennen. Der volle Neubau bleibt für Höhenwechsel (2-4: Asche auf erhöhten Feldern in Zeile 17).

### Messwerte – längste Gegnerphase (Pixel-6a-Profil, „Gemeinsam“, Tempo 1×, Median aus 2 Läufen)

| Phase | Drossel | Zeitgrenze | Brett s vorher | Brett s nachher | Ø FPS vorher | Ø FPS nachher | max ms vorher | max ms nachher | Draw Calls |
|---|---|---|---|---|---|---|---|---|---|
| 2-4 Runde 2 | 2× | mit | **18,5** | **14,6** | 27,4 | 32,6 | 1 833 | **783** | 72 |
| 2-4 Runde 2 | 4× | mit | 27,4 | 18,0 | 11,6 | 17,9 | 4 200 | 1 800 | 72 |
| 2-4 Runde 2 | 2× | ohne | 44,2 | 42,4 | 34,6 | 21,9* | 2 117 | 2 667* | 72 |
| 2-8 Runde 3 | 2× | mit | **16,1** | **14,9** | 42,6 | 42,1 | 1 817 | **850** | 77 |
| 2-8 Runde 3 | 4× | mit | 22,7 | 24,3* | 15,6 | 13,5* | 4 217 | 3 467* | 77 |
| 2-8 Runde 3 | 2× | ohne | 46,7 | 45,8 | 49,5 | 48,9 | 1 850 | 900 | 77 |

Plan (Simulation, Tempo 1×): 2-4 39,2 s ohne, 13,0 s mit Zeitgrenze; 2-8 44,3 s / 13,0 s. KI-Rechenzeit vor der Wiedergabe: 0,6–0,7 s bei 2×, 1,4–2,0 s bei 4×. Mit * markierte Zeilen sind Läufe unter Fremdlast: Die KI-Zeit stieg bei gleicher Arbeit um 22–44 %. Neubau-Schritte in 2-4 Runde 2: vorher 3 volle Neubauten mit 4,5–5,2 s, nachher 1 voller Neubau und 2 ohne Änderung mit 0,7–2,2 s (unter Last). In 2-8 Runde 3 war das Tor vorher ein voller Neubau mit 1,5 s, nachher ein Repaint mit 0,5 s.

### Messwerte – Eröffnung (Large-Test), vorher (unbelastet)

| Szenario | Drossel | Figuren | Ø FPS | p95 ms | max ms | Draw Calls | Thread ms/Frame | Gegnerphase s | Brett laden s | JS-Heap MB |
|---|---|---|---|---|---|---|---|---|---|---|
| Referenz 24×32, einzeln | 2× | 40 | 59,9 | 16,8 | 67 | 48 | 5,6 | 61,5 | 16,1 | 103 |
| Referenz 24×32, gemeinsam | 2× | 40 | 58,0 | 16,8 | 33 | 58 | 7,5 | 2,2 | 13,7 | 110 |
| 2-4 Brandschneise, einzeln | 2× | 33 | 36,8 | 33,4 | 1 950 | 81 | 11,1 | 53,1 | 19,8 | 168 |
| 2-4 Brandschneise, gemeinsam | 2× | 33 | 21,5 | 41,7 | 2 150 | 100 | 22,3 | 11,4 | 17,9 | 252 |
| 2-8 Kronfeld, einzeln | 2× | 42 | 55,2 | 25,1 | 167 | 65 | 8,0 | 65,5 | 18,4 | 258 |
| 2-8 Kronfeld, gemeinsam | 2× | 42 | 51,6 | 33,3 | 117 | 75 | 9,1 | 12,3 | 17,1 | 172 |
| Referenz 24×32, einzeln | 4× | 40 | 35,6 | 41,7 | 117 | 48 | 6,9 | 63,1 | 19,2 | 99 |
| Referenz 24×32, gemeinsam | 4× | 40 | 27,3 | 50,1 | 67 | 58 | 9,1 | 2,3 | 19,1 | 132 |
| 2-4 Brandschneise, einzeln | 4× | 33 | 17,8 | 66,7 | 4 150 | 80 | 13,1 | 60,0 | 27,1 | 234 |
| 2-4 Brandschneise, gemeinsam | 4× | 33 | 8,0 | 83,4 | 4 333 | 100 | 29,3 | 16,7 | 27,6 | 243 |
| 2-8 Kronfeld, einzeln | 4× | 42 | 27,4 | 50,1 | 217 | 64 | 8,7 | 68,4 | 28,3 | 281 |
| 2-8 Kronfeld, gemeinsam | 4× | 42 | 22,4 | 66,7 | 117 | 74 | 10,6 | 12,6 | 27,3 | 201 |

### Messwerte – Eröffnung, nachher

Gemessen unter Fremdlast (CPU gesamt 30–60 %, andere Sitzungen). Die Spalte „Ref.“ ist die Referenzschlacht desselben Laufs; sie hängt nicht von 11.26 ab und zeigt, wie stark die Last drückt. „Gemeinsam“, Median aus 2 Läufen.

| Szenario | Drossel | Ø FPS vorher (Ref. 58,0 / 27,3) | Ø FPS nachher (Ref. 29,6 / 14,0) | Anteil an Ref. vorher → nachher | max ms vorher → nachher | Gegnerphase s vorher → nachher | Draw Calls |
|---|---|---|---|---|---|---|---|
| 2-4 Brandschneise | 2× | 21,5 | 15,2 | 0,37 → **0,51** | 2 150 → **650** | 11,4 → **9,0** | 100 |
| 2-8 Kronfeld | 2× | 51,6 | 23,6 | 0,89 → 0,80 | 117 → 483* | 12,3 → 12,5 | 75 |
| 2-4 Brandschneise | 4× | 8,0 | 8,2 | 0,29 → **0,58** | 4 333 → **967** | 16,7 → **11,0** | 100 |
| 2-8 Kronfeld | 4× | 22,4 | 11,0 | 0,82 → 0,78 | 117 → 350* | 12,6 → 13,8 | 75 |

\* 2-8 hat in der Eröffnung keinen Geländewechsel, 11.26 ändert dort nichts. Die längeren Frames sind „other“ (keine Shader, kein Rendering): die Fremdlast. Neue Shader während der Phase: 2-4 1, 2-8 0 (vorher ebenso). Geländeschritte in der 2-4-Eröffnung nachher: 2 Wechsel ohne Neubau, zusammen 29–54 ms.

### Paketgrößen

| Paket | Dateien | Transfer | Budget |
|---|---|---|---|
| core (erster Download, `pnpm build`) | 366 | 13,34 MB | 30 MB (Richtwert 12 MB: Warnung wie vor 11.26) |
| act1 (`pnpm build`) | 477 | 34,75 MB | 40 MB |
| act2 (Perf-Build, unveröffentlicht) | 15 | 2,29 MB (Content-Chunk 0,34 MB + Ortsbilder) | 40 MB |

Akt 2 bringt bisher keine eigenen Figuren oder Requisiten mit, das Brett lädt die aus core/act1. Bleibt act2 bei 40 MB stehen, ist Platz für die Brettfiguren von Akt 2.

### Bewertung gegen NFR1 (Fassung 15.11)

- **Gegnerphase ≤ 15 s** (Tempo 1×, „Gemeinsam“): bei 2× jetzt eingehalten (2-4 14,6 s, 2-8 14,9 s; vorher 18,5 / 16,1 s). Bei 4× nicht (2-4 18,0 s, vorher 27,4 s; 2-8 ~23 s): Tweens enden erst im nächsten Frame, und bei 13–18 FPS wird die Phase länger als geplant (wie 1-6 in Story 15.11).
- **Kein Frame über 100 ms:** Die Stillstände durch den Gelände-Neubau sind kürzer: 2-4 2× von 1,8–2,1 s auf 0,57–0,78 s, 2-8 2× von 1,8 s auf 0,85 s. Unter 100 ms sind sie noch nicht. Was bleibt: ein voller Neubau bei Höhenwechsel und Repaint mit Requisiten-Neusatz (~0,15 s ungedrosselt).
- **60 / 30 FPS:** Wie bei den 30 × 40-Entwürfen von Akt 1 (15.11) nicht erreicht: 2-8 lag vorher bei 52–55 FPS bei 2× und 22–27 FPS bei 4×, 2-4 bei 2× unter 40 FPS (Feuer: 12 Partikelsysteme, 5 Punktlichter, 100 Draw Calls bei „Gemeinsam“). Das ist dieselbe Folgearbeit an den Zeichenkosten großer Karten wie in 15.11. Laut Story sinkt erst die Gegnerzahl; das entscheidet die Abstimmung (11.27) **[ASSUMPTION]**, hier ist nichts an den Karten geändert.
- **Gegnerphase, Schnelldurchlauf, Kamera auf 30 × 40 wie in Akt 1:** Beide Karten laufen mit „Gemeinsam“, Zeitgrenze und Kamera-Gleiten derselben Brett-Wiedergabe. Gemessen sind die Läufe einzeln und gemeinsam bei Tempo 1×, alle Phasen spielten ohne Fehler zu Ende.
- **Speicher:** JS-Heap nach dem Laden 170–280 MB auf 30 × 40 (Referenz ~100–130 MB). Die GPU-Texturen misst das Werkzeug nicht.
- **Offen:** Messung auf dem Referenzgerät (Pixel 6a / iPhone 12), Release-Check 9.14. Eine Messung „nachher“ auf einem unbelasteten Rechner. Ein Neubau nur der geänderten Felder für Höhenwechsel. Das Feuer-Budget (Partikel, Lichter) auf „Mittel“.

### Completion Notes List

- Fragen an den Produktinhaber mit gewählter Empfehlung stehen in `morgen-fragen-11-26.md` der Sitzungsnotizen: NFR1-Fassung als Maßstab, keine Kartenänderung, act2 im Perf-Build, act2-Budget, Kronfeld verliert auf Normal in der Simulation (`--lost`).
- Simulation: `phase-state.ts m2_8` fand auf Normal mit Start `expected` keinen gewonnenen ersten Versuch (alle bis Runde 5 verloren). Das ist ein Hinweis für 11.27, für die Leistung unerheblich.

### File List

- `.env.perf` (neu)
- `tools/build/packs-plugin.ts`
- `tools/phase-state.ts`
- `tests/perf/bench.ts`
- `tests/perf/perf.spec.ts`
- `src/render/shared/terrain3d.ts`
- `src/render/board/boardProps.ts`
- `tests/unit/terrain3d.test.ts`
- `concept/24-architecture/architecture.md` (§10)
- `concept/24-architecture/decision-log.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/11-26-leistung-von-akt-2.md` (neu)
