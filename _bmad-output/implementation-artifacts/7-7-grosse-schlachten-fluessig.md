# Story 7.7: Große Schlachten flüssig

Status: done

## Story

Als Spieler
möchte ich, dass auch die größte Schlacht auf meinem Handy flüssig läuft,
damit die Gegnerphase nicht ruckelt.

## Acceptance Criteria

Grundlage ist `concept/26-epics/epics.md` Story 7.7 (NFR1). Die Punkte 1 bis 3 präzisieren sie nach den Entscheidungen des Produktinhabers vom 2026-10-24.

1. **Zielmaß (Präzisierung zu „60 FPS“):** Im GPU-Lauf (`PERF_GPU=1 pnpm perf`, Desktop-Chromium, Referenzschlacht 24×32 mit 40 Einheiten, Qualität `mid`, 3D-Figuren) erreicht die Gegnerphase **bei 2× CPU-Drosselung mindestens 60 FPS und bei 4× mindestens 30 FPS** (Ø FPS über die Phase). Der SwiftShader-Lauf (CI) wird nur berichtet, ohne Zielverfehlung. Beide Zielwerte entsprechen demselben Rechenbudget von rund 8,3 ms Thread-CPU je Frame ohne Drosselung.
2. **Bericht Vorher/Nachher:** `pnpm perf` misst die Gegnerphase bei **beiden** Drosselstufen (2× und 4×; Kaltstart/Erstbesuch bleiben bei 4×, NFR2) und der Bericht (`test-results/perf/report.md`, Job-Summary) zeigt je Gerät und Stufe Ø FPS, p95, max, Frames > 25 ms, Draw Calls sowie die **Thread-CPU-Zeit je Frame** (CDP `Performance.getMetrics` → `ThreadTime`), jeweils als Mittel mehrerer Läufe, und daneben die Werte vor der Story (Vorher/Nachher).
3. **Ursachen benannt und behoben:** Die größten Kosten (Abschnitt „Befund“) sind behoben, soweit die Entscheidungen es zulassen; was danach noch fehlt, steht mit Messwerten im Bericht und in den Completion Notes (siehe Offene Frage 1).
4. **Schatten:** Gelände und Requisiten werfen einen **einmal gerenderten** Schatten (statischer Schattenpass, neu bei Kartenwechsel bzw. wenn sich Gelände/Requisiten ändern). **Einheiten werfen keinen Echtzeitschatten mehr**; sie zeigen ihre vorhandenen Ringe (siehe Offene Frage 2). Die Qualitätsstufen (`shadowMap` 2048/1024/aus) bleiben.
5. **Animation:** Idle-Schleifen nicht handelnder Einheiten werden angehalten bzw. gedrosselt, und für sie entfällt die Skelett-Vorbereitung je Frame. Vertex-Animation-Texturen sind **nicht** Teil dieser Story (Folge-Story, Grafik-Pipeline). Die handelnde Einheit animiert wie bisher.
6. **Weitere Posten aus der Analyse:** Shader/Materialien werden beim Laden vorkompiliert (keine Spitzen beim Start der Gegnerphase); Ringe sind Thin Instances mit geteiltem Material; Figuren-Materialien und Waffen werden je Team und Tönung geteilt; statische Meshes sind `alwaysSelectAsActiveMesh` mit `doNotSyncBoundingInfo`.
7. **Unverändert:** Spielregeln, KI, Command-/Event-Folge und Replay-Ergebnisse; die Optik außer dem Schattenwurf der Einheiten (Figuren, Tönung, Ringe, Verblassen aus Story 8.10, Licht).
8. **Werte in YAML:** Neue Stellgrößen (z. B. Drosselung der Idle-Schleifen, ggf. Schatten-Aktualisierung) stehen in `content/core/render.yaml` mit Zod-Schema und `RenderDef`, nie im Code.
9. **Prüfungen:** `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Zeichenaufrufe der Referenzschlacht liegen nicht über dem Wert vor der Story.

## Tasks / Subtasks

Reihenfolge nach Gewinn pro Aufwand; nach jedem Block `PERF_GPU=1 pnpm perf` (mehrere Läufe) und Zwischenstand in die Dev Agent Record schreiben. Fällt ein Block nicht messbar ins Gewicht, nicht stillschweigend behalten oder verwerfen, sondern berichten.

- [x] T1 Messung erweitern und Ausgangswerte neu erheben (AC 1, 2)
  - [x] `tests/perf/profile.ts`: `cpuSlowdown: 4` wird zu einer Liste der Drosselstufen (2×, 4×) mit Zielwert je Stufe (2× → 60, 4× → 30 FPS); Kaltstart bleibt bei 4×
  - [x] `tests/perf/perf.spec.ts`: Gegnerphase je Stufe messen, jede Stufe in `N` Läufen (Zahl: Frage 6), Drosselung per CDP vor jedem Lauf setzen und danach auf 1× zurück; `Performance.getMetrics` (`ThreadTime`) vor und nach der Phase, daraus ms Thread-CPU je gerendertem Frame
  - [x] `tests/perf/report.ts` (`DeviceReport`, `exceedances`, `markdown`): Stufen und Mittelwerte, Thread-CPU je Frame, Vorher-Spalten (Quelle: Frage 7); FPS-Überschreitung nur melden, wenn der Renderer eine GPU ist (SwiftShader nur berichten); `tests/unit/perf-report.test.ts` anpassen und ergänzen
  - [x] `tests/perf/bench.ts` unverändert lassen, außer es braucht Messpunkte (z. B. Zahl der gerenderten Frames)
  - [x] Ausgangswerte auf dem **heutigen Code** (nach PR #33 und Story 8.10) mit dem neuen Bericht erheben und als „Vorher“ festhalten; die Zahlen aus der Analyse (Abschnitt „Befund“) stammen vom Stand davor
- [x] T2 Shader/Materialien beim Laden vorkompilieren (AC 6)
  - [x] In `BoardView.load` nach `syncUnits` alle Varianten vorkompilieren (`Material.forceCompilationAsync` je Material/Mesh, `ShadowGenerator.forceCompilationAsync` falls der Schattengenerator bleibt, bzw. `scene.whenReadyAsync()`), einmal `spawnFx` je Effekttextur anspielen und wieder entfernen; es erscheint nichts im Bild
  - [x] Beleg: Zahl neuer Effects (`engine.getCaps`/`scene.getEngine()._compiledEffects` oder ein Zähler im Bench) und max-Frame der Gegnerphase vorher/nachher
- [x] T3 Idle-Schleifen nicht handelnder Einheiten anhalten/drosseln (AC 5)
  - [x] `ModelFigure.play/tick` (`src/render/shared/figures.ts`) und `BoardView.setAnim`/`placeUnit` (`src/render/board/board.ts`): „handelnd“ = die Einheit, die gerade bewegt, angreift, getroffen wird oder in der Szene ein Ziel ist; alle anderen halten die Idle-Pose bzw. laufen mit gedrosselter Rate (Verfahren: Frage 3)
  - [x] Für angehaltene Einheiten entfällt die Skelett-Vorbereitung (`_prepareSkeleton`, Knochen-Textur-Upload) und die Weltmatrix der Knochenknoten; geprüft per Profil (`computeWorldMatrix`, `updateRawTexture`)
  - [x] Aufwachen ohne sichtbaren Sprung, wenn eine Einheit handelt; Stellgrößen in `render.yaml`
- [x] T4 Schatten: statisch statt Echtzeit (AC 4)
  - [x] `applyQuality`/`castShadows` (`board.ts`): nur `terrain.casters`, Requisiten-Vorlagen (`propTemplate`, `boxProp`) und deren Verblassen-Zwillinge (`fadeTwin`, Story 8.10) bleiben Werfer; `syncUnits` fügt `figure.casters` nicht mehr hinzu; Waffenmeshes sind Teil von `model.meshes` und fallen mit weg
  - [x] Schattenkarte mit `refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE`, ein erneuter Pass nach `buildTerrain`, `buildProps` (auch wenn Requisiten-Vorlagen asynchron fertig werden), Kartenwechsel und Qualitätswechsel; Rücksicht auf `autoUpdateExtends` des Sonnenlichts, damit die Karte einmal die ganze Karte abdeckt
  - [x] Einheiten bleiben Empfänger (`receiveShadows`), damit Requisiten weiter Schatten auf sie werfen, außer die Messung zeigt, dass das die Kosten treibt (dann berichten, nicht still ändern)
  - [x] Ringe unverändert; Sprite-Figuren (`SpriteFigure.casters`) werfen ebenfalls keinen Schatten mehr
- [x] T5 Ringe als Thin Instances (AC 6)
  - [x] `makeRing`/`placeUnit`/`removeUnit`: je Team eine Scheibe mit Thin Instances und Instanz-Farbpuffer (Alpha 0,5 bzw. 0,25 bei `desat > 0.3`), ein Material, `zOffset` wie bisher; ausgeblendete Ringe (gefallen, `alpha ≤ 0.5`, unsichtbar) über Nullskalierung; Puffer nur bei Änderung aktualisieren (`thinInstanceBufferUpdated`)
  - [x] Nicht pickbar wie bisher; Optik pixelgleich
- [x] T6 Materialien und Waffen teilen (AC 6)
  - [x] `figureMaterial`, `loadUnitModel`, `attachGear` (`src/render/shared/models.ts`) und `tintMaterial`/`ModelFigure.tint` (`figures.ts`): ein Material je (Modell, Team, Tönungsstufe) statt je Einheit und Hand; Waffenmaterial je Team teilen; kurzlebige Tönung (Blitz, Alpha) darf ein eigenes Material nur für die Dauer bekommen
  - [x] `tint` schreibt nur bei Änderung (heute jeden Frame in `placeUnit`)
  - [x] `makeGeometryUnique` nur, wo Vertexfarben (Teamtuch) es verlangen; Wirkung auf Draw Calls und `bindForSubMesh` messen
- [x] T7 Aktive Meshes (AC 6)
  - [x] Gelände-, Wasser- und weitere statische Meshes (`src/render/shared/terrain3d.ts`, `Geo.mesh` hat schon `freezeWorldMatrix`) auf `alwaysSelectAsActiveMesh = true` und `doNotSyncBoundingInfo = true`; Requisiten-Vorlagen, Landschafts-Klone und Zwillinge haben `alwaysSelectAsActiveMesh` schon (`board.ts`, `shared/props.ts`)
  - [x] Prüfen, ob `updateCamera` die Projektionsmatrix nur bei Änderung neu setzt
- [x] T8 Abschlussmessung und Bericht (AC 1 bis 3, 9)
  - [x] `PERF_GPU=1 pnpm perf` in mehreren Läufen, Vorher/Nachher in Dev Agent Record und in `report.md`; Zielerreichung je Stufe benennen; verbleibender Abstand (falls vorhanden) mit Kostenaufstellung
  - [x] Eintrag in `concept/24-architecture/decision-log.md` (Schatten, Idle-Drosselung, Messverfahren); Story 7.5 nennt die NFR1-Aussage dort als offen: Verweis ergänzen
  - [x] `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Screenshots der Gegnerphase (Ringe statt Einheitenschatten) an den Produktinhaber

## Dev Notes

### Quellen

- `concept/26-epics/epics.md` Story 7.7, NFR1; Story 7.5 (Messung, `_bmad-output/implementation-artifacts/7-5-leistung-messen.md`); Architektur §10 Leistung; `concept/24-architecture/decision-log.md` (Einträge 2026-10-24: Szenen-Host 5.1, Leistung messen 7.5, NFR1 → Story 7.7, Gegnerphase im Worker 2.8, Fade 8.10).
- `concept/01-decisions.md` D7 (echte weiche Schatten von Sonne/Mond), D8 (Qualitätsstufen, Schattenkarte 2048/1024/aus), D17 (Leistung der Figuren: ein Mesh mit Skelett, `fpsActive` 60 / `fpsIdle` 30); `concept/23-art-direction/art-direction.md` (Licht: weiche Schatten der Sonne, Toon-Abstufung bei Figuren/Requisiten). **Die Einheitenschatten entfallen gegen D7/Art-Direction**: das ist eine Produktentscheidung vom 2026-10-24 und gehört mit dem Eintrag in `decision-log.md` festgehalten (nicht in `01-decisions.md`, eingefroren).
- Profil-Analyse vom 2026-10-24 (Kostenstellen K1 bis K5, A/B-Läufe); Zahlen unten, Stand **vor** PR #33 und Story 8.10.

### Messgrundlage und Befund (Analyse 2026-10-24)

Ausgangsbericht (`PERF_GPU=1 pnpm perf`, 4×, Intel UHD 630, ANGLE/D3D11, Stand vor PR #33/8.10):

| Gerät | Ø FPS | p95 ms | max ms | Frames > 25 ms | Gegnerphase s | Draw Calls Ø/max | Kaltstart ms | Erstbesuch ms |
|---|---|---|---|---|---|---|---|---|
| pixel6a | 7,6 | 216,7 | 1 899,9 | 100 % | 31,6 | 118/136 | 3 127 | 8 833 |
| iphone12 | 6,8 | 249,9 | 2 516,6 | 98,7 % | 33,0 | 117/130 | 6 713 | 10 214 |

Der Rechner war durch parallele Sitzungen ausgelastet; Wanduhr-Werte schwanken stark (derselbe Aufbau 98, 298 oder 455 ms je Frame). Die Story 7.5 nennt 10–13 FPS (ruhigerer Lauf), gleiche Ursachen.

**Die Last ist CPU-gebunden:** ohne Drosselung 58 FPS (Frame 17 ms), Auflösung gedrittelt ändert nichts (8,9 statt 7,7 FPS), Schatten aus 12,6 FPS, 78 % der Profilzeit in `BoardView.frame` → `scene.render`, JS außerhalb des Renderns unter 2 %. GPU-Zeit wurde nicht per Timer-Query gemessen (Einschränkung: auf einem echten Pixel 6a mit Tile-GPU können Füllrate/Vertexlast mitspielen).

Aufschlüsselung eines Frames bei 4× (87 ms je `scene.render`, 331 Frames):

| Posten | ms | Anteil |
|---|---|---|
| Animationen ticken (`scene.animate`, 1 355 Animatables, 30 von 218 Gruppen laufen) | 12,7 | 15 % |
| `_evaluateActiveMeshes` (davon `_prepareSkeleton` 10,1, `computeWorldMatrix` der Knochenknoten 7,7, Frustum/Bounding 2,7) | 26,3 | 30 % |
| Hauptpass (opak 18,3, transparent 4,0, Alphatest 2,4; `bindForSubMesh` 8,9) | 24,8 | 28 % |
| Schattenpass (62 Werfer, 1024², jeden Frame) | 19,1 | 22 % |

Szene: 139 Meshes (87 `unit:*` = 40 Körper + 47 Waffen/Gear, 40 Ringe), 124 Materialien, 30 Skelette mit 1 373 Knochen, 1 584 TransformNodes, 218 AnimationGroups, 177 k Vertices, Instancing nur bei Requisiten.

Kostenstellen und gemessene Gewinne (Thread-CPU je Frame bei 1×, Ausgang 18,5–19,7 ms):

| # | Posten | Gewinn (1×) | Task |
|---|---|---|---|
| K1 | Skelett- und Knochenanimation in JS; Idle läuft für alle 40, obwohl 1–2 Einheiten handeln | Idle pausiert −3 ms (nur Schleifen), Animationen+Skelette aus −7 ms; **VAT ausgenommen** | T3 |
| K2 | Schattenpass jeden Frame | −4 bis −6 ms; `refreshRate` 2/4 nur ≈ −1 ms (Rauschen) | T4 |
| K3 | Pro-Mesh-Aufwand: je Einheit/Hand eigenes Material, 40 Ring-Meshes | Ringe aus −2 bis −3 ms, Waffen aus −3,3 ms, alle Einheiten aus −11 ms; `freeze()` der Materialien brachte nichts | T5, T6 |
| K4 | aktive Meshes/Weltmatrizen statischer Teile | ≈ −1 bis −2 ms | T7 |
| K5 | Shader-Kompilierung beim Phasenstart: 24 neue Effects in den ersten ~250 ms, einzelne Frames 368/441 ms (1×) | beseitigt Spitzen (max-Frame), Dauer-FPS unverändert | T2 |

Untergrenzen (1×, Thread-CPU je Frame): Ist 18,5–19,7 · Idle pausiert + Schatten aus 12,0 · plus Ringe aus + Materialien eingefroren 11,3 · keine Einheiten (Gelände, Props, Wasser; Animationen an) 7,4 · keine Einheiten, keine Animation, keine Schatten **3,9** (davon `scene.render` 1,7, rund 2 ms nativer Overhead `(program)`, Ursache ungeklärt) · 2D-Sprites statt 3D 6,4.

**Rechenbudget:** 60 FPS bei 2× = 16,7 ms ≙ 8,3 ms bei 1×; 30 FPS bei 4× = 33,3 ms ≙ 8,3 ms bei 1×. Die entschiedenen Maßnahmen (Idle pausiert, Einheitenschatten weg, Ringe/Materialien) brachten im A/B 11,3 bis 12,0 ms; es fehlen also noch ca. 3 ms bis zum Ziel. Siehe Offene Frage 1.

### Ist-Zustand des Codes (heutige Orte, gelesen am 2026-10-24)

Die Analyse nennt `src/render/board.ts`, `figures.ts`, `models.ts`. Seit PR #33 (Story 5.1) liegt es so:

- `src/render/host.ts`: ein `RenderHost` hält Engine (`new Engine(canvas, true, { …, antialias: true, adaptToDeviceRatio: false })`, Z. 63), Canvas und **eine** Babylon-`Scene`; `frame` (Z. 157) begrenzt die Bildrate (`fpsActive` 60, wenn `view.busy(now)`, sonst `fpsIdle` 30, 2 ms Spiel) und ruft `view.frame(now)`. `clearStage` räumt beim Szenenwechsel Meshes, Materialien, Skelette ab. `setQuality` setzt die Render-Auflösung.
- `src/render/board/board.ts` (1 485 Z.): `applyQuality` (Z. 250, ein `ShadowGenerator` mit `shadowMap` der Stufe, PCF, `darkness 0.35`), `castShadows` (Z. 266, `addShadowCaster(m, true)`), `load` (Z. 280), `buildTerrain` (Z. 315, `castShadows(terrain.casters)` dann `buildProps`), `propTemplate`/`boxProp`/`sceneryTemplate` (Vorlagen; Vorlagen werfen Schatten, Landschaftsklone nicht, alle `alwaysSelectAsActiveMesh`), **Story 8.10:** `fadeTwin` (Z. 509, Zwilling mit Alpha-Material, eigener Geometrie, wirft Schatten wenn `set.shadow`), `updateFade` im `frame`; `makeRing` (Z. 698, `CreateDisc`, eigenes `StandardMaterial`, Alpha 0,5, `zOffset -1`), `syncUnits` (Z. 711, `castShadows(figure.casters)` Z. 735, Ring je Einheit), `setAnim` (Z. 813, `figure.play`), `frame` (Z. 1119), `placeUnit` (Z. 1135: Knotenposition, `figure.tint(...)` **jeden Frame**, `figure.tick`, Ringposition und -alpha je Frame). Das Brett ruft `renderHost(data)`, `host.activate(this)`; Qualität über `host.setQuality`.
- `src/render/shared/figures.ts` (195 Z.): `ModelFigure` (`play` startet/stoppt die `AnimationGroup`s des Modells, Idle und Walk als Schleife, `tint` schreibt Diffuse/Emissive/Alpha auf alle Materialien, `casters = model.meshes`), `SpriteFigure` (`casters = [plane]`).
- `src/render/shared/models.ts` (249 Z.): `loadUnitModel` (Z. 160; `makeGeometryUnique` je Mesh, `figureMaterial` je Einheit und je Hand, `receiveShadows = true`, Animationsgruppen per Namen), `attachGear` (Z. 122, `makeGeometryUnique` je Waffenmesh), `figureMaterial` (Z. 111).
- `src/render/shared/terrain3d.ts`: `buildTerrain` (Z. 263) liefert `casters` und `tick`; Gelände-Meshes mit `freezeWorldMatrix` (Z. 151), noch ohne `alwaysSelectAsActiveMesh`/`doNotSyncBoundingInfo`. `shared/props.ts` setzt `alwaysSelectAsActiveMesh` an Landschafts-Requisiten.
- Qualität: `content/core/render.yaml` `quality.{high,mid,low}`; `board.fpsActive`/`fpsIdle`; `board.fade` (Story 8.10).
- Messung: `tests/perf/profile.ts` (`PROFILE.cpuSlowdown: 4`, `TARGETS.fps: 60`), `perf.spec.ts` (`throttle`, ein Lauf je Gerät, `board.engine`/`SceneInstrumentation` über `bench.ts`), `report.ts` (`DeviceReport` ohne Drosselstufe, `exceedances` prüft `avgFps < 59,5`), `report-summary.ts`.
- Story 2.8 (Gegnerphase im Web Worker) ist gemergt: die KI-Rechnung blockiert den Hauptthread nicht mehr. Der „Start-Freeze“ aus der Analyse ist damit nicht Teil von 7.7. `bench.ts` ruft `applyCommand` weiter direkt.

Zu erhalten: Replay-Gleichheit, Event-Folge (`board.play`), Verblassen aus 8.10 (Zwillinge, Thin Instances), Host-Lebenszyklus (Szene wechseln ohne Neuladen aus dem Cache), Bildraten-Deckel des Hosts.

### Messverfahren (Vorgabe)

- Der Entwicklungsrechner ist oft durch andere Sitzungen belastet. Ø FPS aus **mehreren Läufen** mitteln (Median und Streuung ausweisen) und die **Thread-CPU-Zeit je Frame** (`Performance.getMetrics` → `ThreadTime`, bei 1× unabhängig von Konkurrenz) mitführen. Die Analyse belegt, dass sie für A/B-Vergleiche stabil ist.
- Draw Calls pro Frame (`SceneInstrumentation`, wie 7.5) mitführen: nicht höher als vorher.
- SwiftShader (`softwareGl()` wählt `low`, ohne Schatten, halbe Auflösung) liefert eine andere Last als die GPU; Werte nur berichten.
- Desktop-Chromium mit Drosselung ahmt ein Handy nur nach; die Messung auf echten Geräten bleibt Teil des Release-Checks (Architektur §10, Story 9.14).

### Grenzen

- Spielregeln, KI und `src/core` nicht ändern; Spielwerte nur in YAML.
- Optik außer dem Wegfall der Einheitenschatten nicht ändern (Figuren, Tönung, Ringe, Verblassen, Licht, Wasser).
- Keine Vertex-Animation-Texturen, keine Änderung der Figuren-Pipeline (`tools/art/export_models.py`).
- Nicht anfassen: `dist*`, `test-results` (Ausgaben laufender Prüfungen).

### Project Context Rules (AGENTS.md)

Branch statt `main`, Merge per PR; Code/Bezeichner/Commits Englisch, Konzept Deutsch; Spielwerte nur in `content/core/render.yaml` bzw. YAML mit Zod-Schema; kein sichtbarer Text im Code; Entscheidungen ins zuständige BMAD-Artefakt unter `concept/` (hier `concept/24-architecture/decision-log.md`), nicht in `01-decisions.md`; Offene Punkte nicht still entscheiden; fertig bei grünem `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`; PNGs unter `art/` per `git lfs pull`; bei „Cannot find package“ `pnpm install --frozen-lockfile`.

## Offene Fragen für den Produktinhaber

1. **Das Ziel liegt nach der Analyse außer Reichweite der entschiedenen Maßnahmen.** Budget 8,3 ms Thread-CPU je Frame (bei 2× 60 FPS und bei 4× 30 FPS); die Kombination aus Idle pausiert, Einheitenschatten weg, Ringe/Materialien liegt gemessen bei 11,3 bis 12,0 ms (≈ 45 FPS bei 2×, ≈ 22 FPS bei 4×). Optionen: (a) Story wie beschrieben umsetzen, danach messen und den Rest als Folge-Story (Vertex-Animation-Texturen, Rig abspecken) führen; (b) zusätzliche Hebel in 7.7 aufnehmen, die nicht unter die Entscheidungen fallen (Rigs im Export abspecken, `antialias: false`/kleinere Backbuffer klären, den ungeklärten nativen Overhead von ~2 ms untersuchen); (c) Ziel anpassen (z. B. 30 FPS bei 2× und 60 bei 1×). Empfehlung: (a) mit Messung nach jedem Block; Zielverfehlung dann im Bericht benennen.
   **Geklärt 2026-10-24 (Produktinhaber):** weitere Hebel gehören in 7.7: Antialiasing aus bzw. kleinerer Backbuffer (`hardwareScalingLevel`) auf dem Handy und der ungeklärte ~2-ms-Overhead werden untersucht; Rigs abspecken und Vertex-Animation-Texturen nicht (Folge-Story Grafik). Wie Antialiasing/Auflösung je Qualitätsstufe gesetzt werden, kommt als Wert nach `content/core/render.yaml`; Optikänderungen per Screenshot vorher/nachher belegen. Ergebnis der Untersuchung: Completion Notes.
2. **Ring als Ersatz für den Einheitenschatten.** Die Entscheidung spricht von „Ringe/Blob“. Es gibt nur den Teamring (Alpha 0,5/0,25, bei gefallenen und beim Verblassen aus), aber keinen Blob-Schatten. Gefallene Einheiten haben keinen Ring und stünden ohne Bodenkontakt. Optionen: (a) nur die vorhandenen Ringe, Optik sonst unverändert; (b) zusätzlich eine weiche dunkle Scheibe unter jeder Einheit (als Thin Instances, kaum Kosten, aber neue Optik: braucht Art-Abnahme); (c) Ring auch für gefallene Einheiten in gedämpfter Farbe. Empfehlung: (a), danach Screenshot an den Produktinhaber und (b) falls Bodenkontakt fehlt.
   **Geklärt 2026-10-24:** nur die vorhandenen Teamringe, keine neue Blob-Scheibe; Screenshots vorher/nachher gehen an den Produktinhaber.
3. **Idle „anhalten oder drosseln“.** Eine angehaltene Pose wirkt starr, besonders bei den Gegnern in der Gegnerphase. Optionen: (a) pausieren in der aktuellen Idle-Pose; (b) mit niedriger Rate weiterschalten (z. B. 10 Hz, Wert in `render.yaml`), das spart die Skelett-Vorbereitung nur in den Zwischenframes; (c) pausieren, aber alle paar Sekunden einen Idle-Zyklus abspielen. Und: gilt das in jeder Phase (auch bei der Spielerphase mit Auswahl) oder nur in der Gegnerphase? Empfehlung: (a) in der Gegnerphase und während der Spieler eine Aktion ausführt, (b) in Ruhe.
   **Geklärt 2026-10-24:** drosseln, nicht anhalten. Idle läuft weiter, Skelette nicht handelnder Einheiten werden mit niedriger Rate aktualisiert (Start 10 Hz, `board.idleHz` in `render.yaml`); handelnde Einheiten (Bewegung, Angriff, Treffer) immer mit voller Rate. Die Regel gilt in allen Phasen.
4. **Verblasste Requisiten und der statische Schatten.** Wirft eine halbdurchsichtige Requisite (Story 8.10) weiter ihren vollen Schatten? Im Code werfen Vorlage und Zwilling zusammen genau die Instanzen der Vorlage, der Schatten bliebe also unverändert und ein Neuaufbau beim Verblassen entfiele. Die Entscheidung nennt „bei Prop-Ausblenden neu“. Optionen: (a) Schatten bleibt voll, kein Neuaufbau beim Verblassen (Empfehlung); (b) verblasste Requisiten werfen keinen Schatten, Neuaufbau bei jeder Änderung der Verdeckungsmenge (selten, aber sichtbar springend).
   **Geklärt 2026-10-24:** Option (a); die nach 8.10 ausgeblendeten Requisiten behalten den einmal gerenderten Schatten, kein Neuaufbau beim Ausblenden.
5. **Einheiten empfangen weiter Schatten von Requisiten?** Sonst bräuchten Einheiten unter einem Baum keinen Schattenempfang mehr (weniger Shadervarianten, weniger `BindLights`), verlören aber das Dunkeln im Baumschatten. Empfehlung: Empfang behalten, Kosten messen und berichten.
   **Geklärt 2026-10-24:** Empfang bleibt, Kosten werden gemessen und berichtet.
6. **Anzahl Läufe je Stufe.** Eine Stufe dauert rund 30 s; bei 3 Läufen × 2 Stufen × 2 Geräte etwa 6 Minuten zusätzlich. Optionen: (a) 3 Läufe, Median (Empfehlung); (b) Anzahl per Umgebungsvariable (`PERF_RUNS`), Standard 3 lokal, 1 in CI.
   **Geklärt 2026-10-24:** Umgebungsvariable `PERF_RUNS`, Standard 3, Median.
7. **Wo stehen die Vorher-Werte?** Optionen: (a) feste Datei `tests/perf/baseline.json` (im Repo, aus dem Lauf vor T2 erzeugt), die der Bericht als Spalten „Vorher“ einliest (Empfehlung: reproduzierbar, auch für Story 9.14); (b) nur in dieser Story und den Completion Notes, der Bericht zeigt dann nur „Nachher“ plus Zielwerte.
   **Geklärt 2026-10-24:** Option (a), `tests/perf/baseline.json`, vom Bericht eingelesen und als Vorher/Nachher gezeigt.
8. **FPS-Überschreitung in CI.** Der SwiftShader-Lauf läuft in CI immer und soll nur berichtet werden. Soll er überhaupt Warnungen erzeugen (`::warning::`) oder nur die Tabelle? Und `PERF_STRICT=1` (Release-Check 9.14): nur mit `PERF_GPU=1` strikt prüfen? Empfehlung: keine FPS-Warnungen für SwiftShader, `PERF_STRICT` prüft FPS nur im GPU-Lauf, Kaltstart immer.
   **Geklärt 2026-10-24:** SwiftShader erzeugt keine FPS-Warnungen; `PERF_STRICT` prüft FPS nur im GPU-Lauf, Kaltstart immer.
9. **Wert der Qualitätsstufe `high`.** Mit statischem Schatten wird die Schattenkarte der Stufe `high` (2048) einmal gerendert und ist damit fast kostenfrei. Soll `high` dann 4096 oder weichere Filter bekommen, oder bleibt alles bei den Werten aus D8? Empfehlung: unverändert lassen (Optikänderung nicht beauftragt).
   **Geklärt 2026-10-24:** die Werte aus D8 bleiben, außer dem entschiedenen Wegfall der Einheitenschatten.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5 (Entwickler-Agent), 2026-10-24/25

### Debug Log References

Messbedingungen: Der Rechner war durch parallele Sitzungen (Simulationen, Vite-Server, andere Agenten) zeitweise zu 95 % ausgelastet; Wanduhr-Werte schwanken stark, die Thread-CPU je Frame bei 1× ist das robustere Maß. GPU: Intel UHD 630 über ANGLE/D3D11, Desktop-Chromium. Werte = Median von 3 Läufen, pixel6a (iphone12 in Klammern, wo abweichend).

| Stand | CPU | Ø FPS | p95 ms | max ms | Thread-CPU ms/Frame | Draw Calls |
|---|---|---|---|---|---|---|
| Vorher (heutiger Code, ausgelasteter Rechner) | 1× | 52,4 | 33,3 | – | 17,0 | 118 |
| | 2× | 10,8 (12,2) | 149,9 (133,3) | 1 050 (1 150) | 26,5 (23,1) | 117 |
| | 4× | 4,3 (2,7) | 366,7 (683,2) | 4 067 (2 767) | 39,0 (37,5) | 117 |
| Zwischenstand 1 (T2–T7 ohne Sichtabschaltung, ausgelasteter Rechner) | 1× | 55,2 | 33,3 | 500 | 10,9 | 45 |
| | 2× | 11,6 | 200 | 1 817 | 19,5 | 45 |
| | 4× | 9,7 | 233 | 2 117 | 22,7 | 45 |
| Zwischenstand 2 (+ Figuren außerhalb der Sicht abgeschaltet, ausgelasteter Rechner) | 1× | 59,6 | 16,7 | 167 | 5,0 | 36 |
| | 2× | 57,0 | 16,8 | 533 | 7,1 | 36 |
| | 4× | 23,0 | 66,7 | 1 367 | 10,4 | 35 |
| **Nachher (Endlauf, ruhigerer Rechner)** | 1× | 59,7 (59,6) | 16,7 | 150 | 3,4 (2,9) | 36 |
| | 2× | 58,8 (58,8) | 16,7 (16,8) | 350 (333) | 5,3 (5,3) | 36 |
| | 4× | 34,8 (28,9) | 49,9 (50,1) | 1 083 (1 366) | 6,9 (8,0) | 35 |

Kaltstart nach den Änderungen 2,3–2,6 s (vorher 5,5–5,8 s unter Last), Brett laden 12,2 s. Neu kompilierte Effects in der Gegnerphase: 0 in allen Läufen nach den Änderungen (die Analyse nannte 24 vorher; der Vorher-Lauf zählte sie noch nicht).

Gewinn je Block (Thread-CPU je Frame bei 1×, pixel6a, Rauschen ±1 ms):
- T2 Vorkompilieren: neue Effects in der Gegnerphase 0; beseitigt die Spitzen beim Start (max-Frame bei 2× 1 050 → 350 ms).
- T3 Idle drosseln, T4 statischer Schatten, T5 Ringe (3 Draw Calls statt 40), T6 geteilte Materialien, T7 aktive Meshes und Kamera nur bei Änderung: zusammen 17,0 → 10,9 ms und 118 → 45 Draw Calls. Einzeln nicht getrennt gemessen, weil die Blöcke ohne Schalter eingebaut wurden (die Analyse nannte Schatten −4 bis −6, Ringe −2 bis −3, Idle −3 ms).
- Zusätzlicher Hebel (nicht in der Story): Figuren außerhalb der Sicht (1,5 Felder Rand) werden abgeschaltet, 10,9 → 5,0 ms, Draw Calls 45 → 36. Die Referenzschlacht zeigt bei der mittleren Zoomstufe rund 10 × 27 von 24 × 32 Feldern.
- Einheiten empfangen weiter Schatten (Entscheidung 5): Kosten nicht messbar (A/B bei 2×, 3 Paare: 5,3–5,9 ms mit, 4,4–6,0 ms ohne Empfang, innerhalb des Rauschens).
- Antialiasing aus und kleinerer Backbuffer (Entscheidung 1): `antialias: false`, `hardwareScalingLevel` 1,5 und 3 brachten auf dem Desktop keinen messbaren Gewinn an Thread-CPU (8,3–10,6 ms in allen Varianten, das Rauschen war größer als jeder Unterschied); wie in der Analyse (Auflösung gedrittelt änderte nichts) ist die Last CPU-gebunden. Auf der Tile-GPU eines echten Pixel 6a kann es anders sein (nur dort messbar, Release-Check 9.14); es wurde deshalb nichts geändert und kein Qualitätswert angelegt. Der Block `(program)` (~2 ms in der Analyse) ist im Endstand 0,8 ms je Frame; seine Ursache blieb ungeklärt (nativer Code zwischen den JS-Aufrufen).
- Profil im Endstand (1×, 18,6 ms Frame, davon 81 % Leerlauf): `frame` 2,4 ms, davon `_evaluateActiveMeshes` 0,8 und Hauptpass 1,0; `(program)` 0,8.

Zielverfehlung: 2× liegt bei 58,8 FPS statt 60 (beide Profile), 4× bei 34,8 (pixel6a, Ziel erreicht) bzw. 28,9 (iphone12, Streuung 26,5–37,7, Ziel knapp verfehlt). Die letzten ~1,2 FPS bei 2× gehen auf seltene Spitzen zurück (max-Frame 300–470 ms bei 2×): Kamerafahrt auf einen neuen Bereich, in dem mehrere Figuren gleichzeitig eingeschaltet und zum ersten Mal gezeichnet werden (55–110 ms im Profil), und ein GC-Lauf (65 ms). Weitere Hebel (Rigs abspecken, Vertex-Animation-Texturen, die Spitzen beim Einschalten glätten) wurden nicht begonnen.

### Completion Notes List

- Messung (T1): `tests/perf/profile.ts` (`PROFILE.stages` 2× → 60, 4× → 30 FPS; Kaltstart 4×), `perf.spec.ts` (je Stufe `PERF_RUNS` Läufe, jeder auf frisch geladener Seite, Drosselung per CDP vor dem Lauf und danach wieder 1×, ThreadTime aus `Performance.getMetrics` vor und nach der Phase, `PERF_STAGES=1,2,4` für Zusatzstufen), `bench.ts` (`prepare` und `enemyPhase` getrennt, zählt neu kompilierte Effects), `report.ts` (Stufen, Median, Streuung, Thread-CPU, Vorher-Spalten, FPS-Überschreitung nur mit GPU), `report-summary.ts` (liest `tests/perf/baseline.json`; `PERF_WRITE_BASELINE=1` schreibt sie neu), Ausgangswerte `tests/perf/baseline.json` (2× und 4×; der 1×-Wert steht oben).
- Schatten (T4): Einheiten werfen keinen Schatten (`Figure.casters` entfällt). Die Schattenkarte hat `RENDER_ONCE`; `refreshShadows()` nach `buildProps` (also nach jedem Kartenaufbau und jeder Requisitenänderung) schaltet die Sonne für genau diesen Pass auf automatische Ausdehnung und friert sie danach ein. Sichtbare Folge: Bäume und Felsen zeigen jetzt gut sichtbare weiche Schatten auf dem Boden; auf den Vorher-Screenshots der Referenzkarte sind keine zu sehen (vermutlich war die Ausdehnung durch die Hüllkörper der animierten Figuren so groß, dass die Schattenkarte kaum Auflösung hatte). Das entspricht D7, fällt aber anders aus als vorher; zur Abnahme durch den Produktinhaber.
- Idle (T3): `ModelFigure` pausiert die Idle-Gruppe und springt mit `goToFrame` im Takt `board.idleHz` (10 Hz, je Figur versetzt) auf den Schleifenstand; `Skeleton.prepare` der Figur wird in den Zwischenframes übersprungen (Überschreibung der Methode an der Instanz in `figures.ts`, Babylon bietet keinen Schalter je Skelett). Gefallene Figuren: drei Frames bis zur Pose, danach keine Skelettarbeit. Gehen, Angriff, Treffer: volle Rate.
- Sichtabschaltung: `placeUnit` schaltet eine Figur ab, wenn sie mehr als 1,5 Felder außerhalb der Sicht steht (`BoardView.onScreen`); beim Wiedereintritt wird sofort die aktuelle Pose gesetzt.
- Ringe (T5): `src/render/board/rings.ts`, ein Mesh je Team (Thin Instances, Instanz-Farbpuffer für die Deckkraft 0,5/0,25, Nullskalierung für ausgeblendete Ringe), `alphaIndex -1`; Optik auf den Screenshots unverändert.
- Materialien (T6): ein Figurenmaterial je Basistextur und Entsättigung in der Szene (`AssetStore.materials`), eigene Materialien nur während Blitz, Verblassen und Geist; Waffen teilen das Material des Körpers ohne Textur; `makeGeometryUnique` nur bei Vertexfarben; Figuren geben beim Entfernen auch ihre Skelette frei, und `root.dispose(false, false)` ersetzt `(false, true)` (das hätte geteilte Materialien zerstört); `tint` schreibt nur bei Änderung.
- Aktive Meshes (T7): Gelände-Meshes (`Geo.mesh`) `alwaysSelectAsActiveMesh` und `doNotSyncBoundingInfo`; `updateCamera` setzt die Kamera nur bei geänderten Werten.
- Vorkompilieren (T2): `BoardView.precompile` nach `syncUnits` (`scene.whenReadyAsync()` und `forceCompilationAsync` des Effekt-Quads, begrenzt durch `board.precompileMs` = 8000).
- Neue Werte in `content/core/render.yaml` mit Schema und `RenderDef`: `board.idleHz` (10), `board.precompileMs` (8000).
- Nicht angefasst: Spielregeln, KI, `src/core` (nur der Typ `RenderDef` in `defs.ts`), `src/worker`, Weltkarte; `host.ts` bekam nur `AssetStore.materials` (die Weltkarte nutzt es nicht).
- Prüfungen grün: `pnpm lint`, `pnpm test` (427), `pnpm content:check`, `pnpm build`, `pnpm test:e2e` (12 grün, 4 übersprungen wie vorher: Worker-Spec), `pnpm bench:ai`, `pnpm perf` (SwiftShader, `PERF_RUNS=1`, keine FPS-Warnung) und der GPU-Lauf mit `PERF_GPU=1 PERF_STAGES=1,2,4`.
- **Abnahme Produktinhaber 2026-10-25:** 7.7 wird mit dem erreichten Stand abgenommen (2× 58,8 FPS, 4× 34,8/28,9 FPS gegenüber vorher 10,8–12,2 bzw. 2,7–4,3 FPS). Der Rest bis zum Zielmaß (Spitzen beim Einschalten von Figuren, GC, Rigs abspecken, Vertex-Animation-Texturen) kommt in eine Folge-Story. Die Sichtabschaltung von Figuren außerhalb des Bildes bleibt. Die neue Schatten-Optik (Bäume und Felsen mit weichem Schatten, Einheiten ohne) ist nach Screenshots abgenommen.
- E2E unter Volllast der Maschine (100 % CPU durch andere Sessions): einzelne Smoke-Tests scheiterten wechselnd an Klick-Timeouts (2 von 24 bei `--repeat-each 2`), wie schon vor dieser Story bei 2.8 beobachtet; die CI auf ruhigem Läufer ist maßgeblich.
- Offen: Zielmaß 2× um 1,2 FPS verfehlt, 4× auf iphone12 knapp (siehe Debug Log); Messung von Antialiasing/Auflösung auf echtem Gerät (Tile-GPU); der CI-Job `perf` läuft mit dem Standard von 3 Läufen (einige Minuten länger), falls gewünscht `PERF_RUNS=1` in `ci.yml`.

### File List

`src/render/board/board.ts`, `src/render/board/rings.ts` (neu), `src/render/shared/figures.ts`, `src/render/shared/models.ts`, `src/render/shared/terrain3d.ts`, `src/render/host.ts`, `content/core/render.yaml`, `src/content/schemas.ts`, `src/core/defs.ts` (nur Typ `RenderDef`), `tests/perf/profile.ts`, `tests/perf/perf.spec.ts`, `tests/perf/bench.ts`, `tests/perf/report.ts`, `tests/perf/report-summary.ts`, `tests/perf/baseline.json` (neu), `tests/unit/perf-report.test.ts`, `concept/24-architecture/decision-log.md`, `concept/23-art-direction/decision-log.md`, `_bmad-output/implementation-artifacts/7-5-leistung-messen.md` (Verweis), `_bmad-output/implementation-artifacts/sprint-status.yaml` (7-7 auf review).

## Abnahme 2026-10-27

Abgenommen (Status done). Mit der Abweichung vom 2026-10-25 abgenommen; Rest in 7.8. Gesamtbefund: `acceptance-2026-10-27.md`.
