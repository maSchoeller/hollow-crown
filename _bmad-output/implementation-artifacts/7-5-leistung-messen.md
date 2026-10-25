# Story 7.5: Leistung messen

Status: done

## Story

Als Spieler
möchte ich, dass das Spiel auf meinem Handy flüssig läuft und schnell startet,
damit große Schlachten Spaß machen.

## Acceptance Criteria

1. Ein Playwright-Lauf mit Referenzprofil (Pixel 6a / iPhone 12, gedrosselte CPU und Netz) misst eine komplette Gegnerphase einer großen Schlacht (24×32, ~40 Einheiten) und einen Kaltstart.
2. Er schreibt Frame-Zeiten (Ziel 60 FPS, NFR1) und Kaltstartzeit (< 5 s, NFR2) als Bericht.
3. Die Messung läuft in CI und meldet Überschreitungen; Story 9.14 nutzt sie für die Freigabe.

## Tasks / Subtasks

- [x] T1 Referenzschlacht `tests/perf/benchMap.ts` (24×32, 12 Spieler, 28 angreifende Gegner, per `mapSchema` geprüft, nicht im Content und nie im Spiel-Build), Test `tests/unit/perf-bench.test.ts` (AC 1)
- [x] T2 Bench-Seite `tests/perf/bench.html` + `bench.ts`: echtes Brett (`BoardView`), eine komplette Gegnerphase (`endPhase` → `board.play`), Frame-Zeiten per `requestAnimationFrame`, Draw Calls per `SceneInstrumentation`, WebGL-Renderer (AC 1, 2)
- [x] T3 `vite build --mode perf` → `dist-perf` mit zusätzlicher Bench-Seite; der normale Build bleibt unverändert (AC 1)
- [x] T4 `playwright.perf.config.ts` (Projekte `pixel6a` 412×915 @2,625, `iphone12`), `tests/perf/perf.spec.ts`: CPU 4× und Netz 9 Mbit/s/60 ms per CDP; Erstbesuch, Kaltstart der installierten App, Gegnerphase (AC 1, 2)
- [x] T5 Bericht: `tests/perf/report.ts` (Statistik, Überschreitungen, Markdown) mit Test, `report-summary.ts` schreibt `test-results/perf/report.md` und das CI-Job-Summary (AC 2)
- [x] T6 Skript `pnpm perf`, CI-Job `perf` (meldet Überschreitungen als Warnung, Bericht als Artefakt); `PERF_STRICT=1` lässt den Lauf bei Überschreitung scheitern (für 9.14), `PERF_GPU=1` zeichnet lokal mit der GPU statt SwiftShader (AC 3)

## Dev Notes

- **Kaltstart** = installierte App (Service Worker und Caches da) bis der Titel antwortet; zusätzlich steht der **Erstbesuch** ohne Cache bis zum Titel (inklusive erstem Download, Stein aus 7.6) im Bericht. NFR2 prüft den Kaltstart.
- **Referenzprofil** in `tests/perf/profile.ts`: CPU-Drosselung 4× (übliche Mobil-Einstellung), Netz 9 Mbit/s, 60 ms. Desktop-Chromium ahmt die Geräte nur nach; echte Geräte misst der Release-Check von Hand (architecture §10).
- **Renderer:** Headless-Chromium zeichnet ohne Weiteres mit SwiftShader (Software-WebGL), in CI immer. Der Bericht nennt den Renderer je Gerät; lokal liefert `PERF_GPU=1` die GPU des Rechners.
- **Draw Calls:** Babylons Zähler setzt nur `SceneInstrumentation` pro Frame zurück; ohne sie wuchs er über die ganze Messung (gefunden beim ersten Lauf, 6 000 bis 11 000 „pro Frame“).

### Messung 2026-10-24 (dieser Rechner, Build mit Assets)

| Lauf | Gerät | Ø FPS | p95 ms | Draw Calls Ø/max | Gegnerphase s | Kaltstart ms | Erstbesuch ms |
|---|---|---|---|---|---|---|---|
| SwiftShader | pixel6a | 5,6 | 217 | – | 27,3 | 2 207 | 5 425 |
| SwiftShader | iphone12 | 6,3 | 200 | – | 28,6 | 2 711 | 5 998 |
| GPU (Intel UHD 630) | pixel6a | 12,9 | 117 | 117/136 | 27,4 | 2 272 | 5 368 |
| GPU (Intel UHD 630) | iphone12 | 10,2 | 183 | 117/129 | 29,4 | 2 582 | 5 575 |

- **NFR2 gehalten:** Kaltstart 2,2–2,7 s (< 5 s).
- **NFR1 deutlich verfehlt** unter 4× gedrosselter CPU: 10–13 FPS mit GPU. Ursache ist nicht untersucht (Brett und Figuren gehören zu Epic 2/8); der Lauf macht es jetzt messbar. Gemeldet als offener Punkt.

### References

- [Source: concept/26-epics/epics.md#Story 7.5, NFR1, NFR2]
- [Source: concept/24-architecture/architecture.md#10 Leistung]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm perf` (SwiftShader) und `PERF_GPU=1` (GPU) je zweimal gelaufen, Tabelle oben.

### Completion Notes List

- Entschieden 2026-10-24 (Produktinhaber): NFR1 bekommt eine eigene Story 7.7 „Große Schlachten flüssig“.
- Umgesetzt in Story 7.7 (Messung bei CPU 2× und 4×, Thread-CPU je Frame, Vorher/Nachher aus `tests/perf/baseline.json`); Ergebnis und Entscheidungen: `concept/24-architecture/decision-log.md`, Eintrag „Große Schlachten flüssig (Story 7.7)“.

### File List

- tests/perf/benchMap.ts, bench.html, bench.ts, profile.ts, report.ts, report-summary.ts, perf.spec.ts (neu)
- tests/unit/perf-bench.test.ts, perf-report.test.ts (neu)
- playwright.perf.config.ts (neu), vite.config.ts, package.json, tsconfig.json, eslint.config.js, .gitignore
- .github/workflows/ci.yml
- concept/24-architecture/decision-log.md
