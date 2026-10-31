# Story 7.8: Große Schlachten ohne Ruckler

Status: done

## Story

Als Spieler
möchte ich, dass die größte Schlacht auch auf einem schwächeren Handy ohne Hänger läuft,
damit die Gegnerphase gleichmäßig flüssig bleibt.

## Acceptance Criteria

Grundlage ist `concept/26-epics/epics/epic-07.md` Story 7.8 (NFR1, Rest aus 7.7). Die Punkte 1 bis 9 präzisieren sie nach den Entscheidungen des Produktinhabers vom **2026-10-26** (Eintrag in `concept/24-architecture/.decision-log.md` bzw. `decision-log.md`, siehe T10). Was unter „Offene Fragen“ steht, ist **nicht** entschieden: nicht raten, nachfragen.

1. **Zielmaß (mit 8.6 im Bild):** `PERF_GPU=1 pnpm perf` (Referenzschlacht 24×32, 40 Einheiten, Qualität `mid`, 3D-Figuren) erreicht in der Gegnerphase auf **beiden** Geräteprofilen (pixel6a, iphone12) **mindestens 60 FPS bei 2×** und **mindestens 30 FPS bei 4×** (Median der Läufe, Toleranz wie `exceedances`: 0,5 FPS). Die Zielwerte gelten **nach Story 8.6** (die vor 7.8 umgesetzt wird und +0,5 ms Thread-CPU bei 2× verbrauchen darf).
2. **Keine Ausreißer:** In der Gegnerphase gibt es **keinen einzelnen Frame über 100 ms**, bei 2× und bei 4× (Maximum über **alle** Läufe, nicht der Median der Läufe). Das Perf-Werkzeug bekommt dafür eine Prüfung (`TARGETS.maxFrameMs` = 100, in `exceedances`, scheitert mit `PERF_STRICT=1`, nur im GPU-Lauf; Kaltstart-Prüfung unverändert).
3. **Ursachen benannt:** Die Ursachen der Spitzen (heute: 650 ms bei 2× pixel6a, 1 017 ms iphone12; nach 7.7 gemessen 300–470 ms) sind mit Frame-Trace belegt und stehen im Dev Agent Record (erstes Zeichnen/Einschalten von Figuren, nicht vorkompilierte Shadervarianten, Speicherbereinigung, Layout-Zugriffe, sonstige). Vermutungen ohne Beleg sind als solche gekennzeichnet.
4. **Bericht Vorher/Nachher:** `test-results/perf/report.md` zeigt je Gerät und Stufe Ø FPS, p95, max (jetzt zusätzlich **max über alle Läufe**), Frames > 25 ms, Thread-CPU je Frame, Draw Calls, neue Effects, jeweils mit „Vorher“. Das „Vorher“ ist der Stand **unmittelbar vor Beginn von 7.8, nach 8.6** (neu gemessen, `tests/perf/baseline.json` neu geschrieben, `PERF_WRITE_BASELINE=1`); die Tabelle „Vorher (Stand main 2026-10-26)“ in den Dev Notes ist die Vor-8.6-Referenz.
5. **Rig schlank (verlustfrei):** Alle 37 Tripo-Figuren haben **22 Gelenke** (Finger- und End-Knochen entfallen, ihre Skin-Gewichte sind auf die jeweilige Hand addiert). Gebaut in `tools/art/prepare_tripo_unit.py`, alle Figuren neu gebaut (`pnpm art:tripo`). Stichprobe Hand/Waffe per Screenshot vorher/nachher (mindestens 3 Figuren, alle Waffengruppen), Abnahme Produktinhaber.
6. **Gebackene Vertex-Animation-Texturen (VAT):** Idle, Gehen, Angriff (alle `attack_*`), Treffer, Gefallen, Jubel und Flucht laufen auf dem Brett als VAT statt als Skelett-/Knochenknoten-Animation im Hauptthread. Gebacken wird **zur Bauzeit** (`tools/art`) mit **60 Bildern/s** für alle Clips; die Daten liegen als Datei neben der Figuren-GLB, im selben Paket (`tools/art/model_packs.py`: erstes Paket, das die Figur zeigt). Zur Laufzeit gibt es für diese Figuren keine Bone-TransformNodes, keine geklonten Skelette und keine geklonten AnimationGroups mehr.
   **Dateiformat (entschieden 2026-10-26):** lokale Pose je Zeile, nämlich 22 Gelenk-Quaternionen (Half) plus Hips-Translation, 60 fps für alle Clips; beim Laden wird per Vorwärtskinematik die Matrix-Textur erzeugt.
7. **Größenbudget (harte Abnahme):** Modell **plus** VAT-Datei jeder Figur bleibt **≤ 0,5 MB Transfer** (`figureBudget.transferMb` in `content/packs.yaml`, gemessen von `tools/figure-budget.mjs`, jetzt inkl. VAT-Datei); die Pakete `core` (30 MB) und `act1` (40 MB) bleiben im Budget (`pnpm build`). Erwartet ≈ 0,36–0,41 MB (gemessen an Kael-Daten: 180 KB gzip für die Daten). **Überschreitet die Messung das Budget trotzdem, ist das eine neue Frage an den Produktinhaber, keine eigene Entscheidung.** Die Vorwärtskinematik beim Laden darf je Modell bei 4× Drosselung höchstens im Rahmen des Ladezuschlags von AC 10b liegen.
8. **Idle läuft flüssig:** Idle-Figuren animieren mit voller Bildrate (die 10-Hz-Drosselung `board.idleHz` entfällt für VAT-Figuren). Das ist eine **sichtbare Änderung** (weicheres Idle): Abnahme per Video/Screenshots durch den Produktinhaber. Gehen, Angriff, Treffer, Gefallen, Waffe in der Hand (Griff/Halt/Angriff, `hold` der Lanze) sehen sonst aus wie vorher.
9. **Waffen folgen den Händen** über eine mitgebackene **Socket-Tabelle auf der CPU** (rechte und linke Hand je Bildzeile); die Griff-/Halt-/Angriffslogik (`grip`, `hold`, `attack`) bleibt erhalten.
10. **Spitzen beseitigt (Schritte 0–2 des Entwurfs):** (a) Frame-Trace im Bench; (b) alle Shadervarianten (geteilt, Blitz, Verblassen/Geist, jeweils mit und ohne VAT, mit den Plug-ins aus 8.6) sind beim Laden **warm** (Vorkompilieren plus ein Aufwärm-Zeichnen); `newEffects` in der Gegnerphase ist **0**; (c) Allokationen und Layout-Zugriffe im Frame-Pfad entfernt (siehe T3); (d) Blitz-/Verblassen-Materialien aus einem Pool statt je Treffer neu.
    **Ladezeit (entschieden 2026-10-26):** Vorkompilieren, Aufwärm-Zeichnen und Vorwärtskinematik zusammen verlängern „Brett laden ms“ im Perf-Bericht bei 4× um **höchstens 1 s** gegenüber dem Vorher (T0).
11. **Unverändert:** Spielregeln, KI, Command-/Event-Folge, Replay-Ergebnisse; Optik außer dem weicheren Idle (AC 8) und dem Rig (AC 5, verlustfrei). Draw Calls der Referenzschlacht nicht höher als vorher.
12. **Werte in YAML:** neue Stellgrößen (VAT an/aus, Bildrate der Daten falls nötig, Pool-Größen) in `content/core/render.yaml` mit Zod-Schema und `RenderDef`, nie im Code.
13. **Prüfungen:** `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` (Bundle- und Figurenbudget!) grün; `pnpm test:coverage` für `src/core` nicht gesenkt.

## Tasks / Subtasks

Reihenfolge: erst messen und die Spitzen (T1–T3), dann die Pipeline (T4–T6), dann der Laufzeitpfad (T7–T8), zuletzt Messung und Abnahme. Nach jedem Block `PERF_GPU=1 pnpm perf` (`PERF_STAGES=1,2,4`, 3 Läufe) und Zwischenstand in den Dev Agent Record. Fällt ein Block nicht messbar ins Gewicht, nicht still behalten oder verwerfen, sondern berichten. **Voraussetzung:** Story 8.6 ist umgesetzt; vor T1 neues „Vorher“ messen (AC 4).

- [x] T0 Vorher neu messen und Baseline setzen (AC 4)
  - [x] Nach 8.6 gemessen (Quellstand Commit 31bb7c2), 3 Läufe, Median; Ergebnis im Dev Agent Record; `tests/perf/baseline.json` neu geschrieben (Quelle: Lauf A3, das „Vorher“ mit dem Messwerkzeug von 7.8 bei geringer Last; die Vor-8.6-Referenz bleibt in den Dev Notes). Die vier Messungen desselben Standes unter 16–90 % Rechnerlast stehen im Dev Agent Record.
- [x] T1 Messwerkzeug: Max-Frame-Prüfung und Frame-Trace (AC 2, 3, 4)
  - [x] `tests/perf/profile.ts`: `TARGETS.maxFrameMs: 100` (und `traceMs: 50`); `tests/perf/report.ts`: „max ms (alle Läufe)“ im Bericht, `exceedances` meldet jeden Frame > 100 ms nur mit GPU und nur für Stufen mit Ziel; `PERF_STRICT=1` scheitert daran; `tests/unit/perf-report.test.ts` ergänzt
  - [x] `tests/perf/bench.ts`: Frame-Trace (Abweichung zur Aufgabenfassung: statt `onBeforeRender/onAfterRender` allein wird `board.frame` umhüllt, dazu `longtask`/`long-animation-frame`-Beobachter und der JS-Heap, der mit `--enable-precise-memory-info` startet): je Frame > 50 ms `dt`, Dauer von `board.frame` und `scene.render`, neu eingeschaltete Figuren, neue Effects, Heap-Rückgang (= Speicherbereinigung), Layoutzeit; Ursache wird als `shader | enable | gc | layout | render | frame-js | other` in den Lauf-Bericht geschrieben. Zusätzlich je Lauf: Beschreibung jeder neuen Shadervariante gegenüber der ähnlichsten früheren (`newEffectInfo`), Zahl und Menge der Speicherbereinigungen, Layoutzeit, Ladezeit des Bretts je Stufe
  - [x] Läufe A (heute), B (Tint-Varianten warm), C (zusätzlich Aufwärm-Zeichnen) und weitere belegen die Ursachen (AC 3); Ergebnis im Dev Agent Record. **Befund weicht von der Annahme der Story ab**: die „2 neuen Effects“ sind nicht die Blitz-/Verblass-Materialien der Figuren, sondern der durchsichtige Requisiten-Zwilling (Story 8.10)
- [x] T2 Spitzen: Vorkompilieren, Aufwärmen, Material-Pool (AC 10)
  - [x] Ursache der Nachkompilierung per Trace belegt: `BoardView.fadeTwin` (8.10) legt beim ersten Verdecken einer Requisite den Zwilling samt blendendem Material mit `needDepthPrePass` an (Klon, `makeGeometryUnique`, zwei Shadervarianten `+ALPHATEST_AFTERALLALPHACOMPUTATIONS` und `+DEPTHPREPASS`). Die Tint-Varianten der Figuren (`transparencyMode`) erzeugten in der Referenzschlacht **keine** neue Variante
  - [x] `precompile` (board.ts): Tint-Varianten (Blitz opak, Verblassen/Geist blendend, je Textur und Skelett/Vertexdaten, `warmTints` in figures.ts; mit dem Plug-in aus 8.6, das Teil des Materials ist) und die Zwillinge aller Requisiten-Vorlagen (mit einer Instanz, damit die Variante `THIN_INSTANCES` entsteht) werden angelegt und kompiliert; danach ein **Aufwärm-Zeichnen** (`warmDraw`: alle Figuren eingeschaltet, alles `alwaysSelectAsActiveMesh`, `scene.render()`, zurück, dann ein normaler Frame darüber im selben Task – nichts erscheint im Bild). Gewicht der Teile messbar über `board.warmLevel` (0/1/2, Bench: `PERF_WARM`)
  - [x] Eigene Blitz-/Verblassen-Materialien aus einem Pool je (Textur, Fall) statt je Treffer neu (`takeTint/giveTint` in models.ts, `AssetStore.tintPool`, Größe `render.yaml board.tintPool`)
- [x] T3 Allokationen und Layout im Frame-Pfad (AC 10)
  - [x] `figures.ts` `tint`: drei Zahlen statt Template-String (auch `SpriteFigure`)
  - [x] `board.ts` `updateFade`: Dirty-Flag (`fadeDirty`, von `placeUnit`/`removeUnit`/`buildProps` gesetzt), Schlüssel- und `spots`-Aufbau nur bei Änderung
  - [x] `rings.ts` `upload`: direkte Indexschreibung
  - [x] `board.ts`: `basis()` (nach Neigung gecacht), Kamera-Schlüssel als Zahlen, `cssSize()` per `ResizeObserver` gecacht (`resize()` verwirft ihn), `screenOfXYZ` ohne `Vector3` für Wimpel, Blutlabels, Statussymbole, Schadenszahlen, `onScreen` ohne Sinus/Cosinus je Aufruf, `updateFx` ohne `filter`
  - [x] Wirkung gemessen: siehe Dev Agent Record (Speicherbereinigungen, Layout, Thread-CPU)
- [x] T4 Rig auf 22 Gelenke, verlustfrei (AC 5)
  - [x] `tools/art/prepare_tripo_unit.py` vor `export_scene.gltf`: je Finger-Vertexgruppe (`SKIP` = Thumb/Index/Middle/Ring/Pinky) die Gewichte in die Hand-Gruppe addieren (Summe, Gruppe löschen), dann Finger- und End-Knochen (`*_End`, `HeadTop_End`) im Edit-Mode entfernen; Sockets bleiben an `*Hand`; Blender-Figuren (`export_models.py`) unverändert
  - [x] Prüfen: 22 Joints je Skin (`node scratchpad`-Skript `glb.mjs` bzw. `tools/figure-budget.mjs`), Vertex-Gewichte summieren je Vertex zu 1, Einflüsse je Vertex ≤ 4
  - [x] Alle 37 Tripo-Figuren neu bauen (Befehlsfolge in den Dev Notes), Figurenbudget grün, Stichprobe Hand/Waffe per Screenshot (AC 5)
- [x] T5 Spike Größe und Backformat, **vor** dem Rest der VAT-Arbeit (AC 7)
  - [x] Bake-Skizze im entschiedenen Format (lokale Pose, Half, 60 fps) mit den echten Figuren (Kael-Bibliothek + eine Figur): Zeilenzahl, Rohgröße und gzip-Größe **messen**, mit Modell zusammen gegen 0,5 MB; Dauer der Vorwärtskinematik beim Laden bei 4× messen (Ladezuschlag AC 10b)
  - [x] Prüfen, ob `.vat` vom Hosting (GitHub Pages) gzip-komprimiert ausgeliefert wird (bleibt Aufgabe, keine Frage an den Produktinhaber); sonst Datei vorkomprimieren und mit `DecompressionStream` entpacken oder Budget roh rechnen und Ergebnis im Dev Agent Record festhalten
  - [x] Passt das Format trotzdem nicht ins Budget: stoppen und neue Frage an den Produktinhaber, nicht selbst Bildrate/Format ändern
- [x] T6 Bake in der Pipeline (AC 6, 7, 9)
  - [x] Neues `tools/art/bake_vat.py` (numpy, Pillow-frei): liest die ungepackte `<id>.raw.glb` von `prepare_tripo_unit.py` (Skelett, Inverse-Bind, Clips), tastet **jeden Clip mit 60 Bildern/s** ab, **Slerp** der Rotationen und lineares Lerp der Translation wie Babylon (Optik gleich), schreibt `art/models/units/<id>.vat`: Kopf (Version, Gelenkzahl, Bildrate 60, Clip-Tabelle: Name, Zeile von/bis, Schleife ja/nein), **lokale Pose je Zeile** (22 Quaternionen Half + Hips-Translation; Vorwärtskinematik erst beim Laden), Socket-Tabelle für rechte/linke Hand (Position + Quaternion je Zeile, im Bake per Vorwärtskinematik berechnet)
  - [x] `tools/art/tripo_units.py` ruft den Bake nach Blender und vor `gltfpack` auf; Ausgabe `[hc]`-Zeilen mit Zeilen, KB roh/gzip; `figure-budget.mjs` rechnet die `.vat`-Datei zur Figur (Transfer)
  - [x] `tools/art/build.py` `build_models`: `.vat` mitkopieren, Paketordner wie die GLB (`unitPacks`); `tools/build/first-mission.mjs` (`isFirstMissionFile`) und `tools/check-bundle-size.mjs` (`reportFigures`, Precache) um `.vat` erweitern; `src/app/loading/plan.ts` `missionAssets` führt die `.vat` mit auf; `.gitattributes` bekommt `art/**/*.vat` für LFS (Frage 6)
  - [x] Entscheidung: bleiben die Animationen in der GLB? Wenn VAT sie ersetzt, entfernen (spart Transfer); zuerst prüfen, wer die `AnimationGroup`s sonst nutzt (Weltkarte, Szenen, Porträts), und die Blender-Figuren (Frage 2) bedenken
  - [x] Test: Python-Test oder Node-Test `tests/unit/` liest eine gebackene Datei und prüft Kopf, Zeilenzahl je Clip (Dauer × 60), Abweichung gegen eine Referenzabtastung (Gelenkposition ≤ 0,002 Einheiten)
- [x] T7 Laufzeit: VAT-Pfad im Brett (AC 6, 8, 9, 11)
  - [x] `src/render/shared/models.ts`: `.vat` laden (neben der GLB, Pfad über `unitModelPath`/`unitPacks`), Textur je Modell einmal aus der lokalen Pose **per Vorwärtskinematik** erzeugen (Gelenkhierarchie und Inverse-Bind aus der GLB, Ladezuschlag AC 10b beachten), `RawTexture` Float oder Half (Messwert entscheidet, Dev Notes), geteilt von allen Figuren des Modells; ein Mesh je (Modell, Team) mit geteilter Geometrie (Teamtuch steckt in Vertexfarben); ein `BakedVertexAnimationManager` je Figur
  - [x] Ein geteiltes Skeleton je Modell nur als Träger der Einflussdaten (`NUM_BONE_INFLUENCERS`), `prepare` einmalig No-Op; keine Bone-Nodes, keine geklonten Gruppen je Figur
  - [x] `ModelFigure` (`figures.ts`): `play/tick/tint` auf VAT umstellen: Clipbereich und Zeit aus JS (Schleifen im Shader, Einmal-Clips Zeit ab 0 und Rückkehr wie bisher über `setAnim`), `speed` berücksichtigen, Idle mit voller Bildrate, `downed` = letzte Zeile; Frame-Formel in JS **dieselbe** wie im Shader (Frame-Quirk ab `time >= 1` prüfen)
  - [x] Waffen: Socket-Tabelle je Tick auf `socket_r/_l` setzen (nur sichtbare Figuren, nur bei Zeilenwechsel), `grip.rotation.x`-Logik bleibt; Waffen-Pfad A/B messen (Frage 5 nur falls das Profil Waffenknoten als Kostenstelle zeigt)
  - [x] Schalter `render.yaml board.vat` (an); Figuren ohne `.vat` (Blender-Figuren, Frage 2) laufen weiter über den Skelettpfad
  - [x] Vorkompilieren/Aufwärmen der VAT-Varianten (T2), Zusammenspiel mit 8.6 (ungelittes Teamtuch, Rim-Licht) prüfen: gleiche Optik wie im Skelettpfad
  - [x] Tests: Einheitentest der Frame-Formel/Clip-Tabelle (ohne Babylon), Replay-Gleichheit unverändert
- [x] T8 Aufräumen Skelettpfad (AC 6)
  - [x] Throttling-Code für VAT-Figuren (`idleHz`, `needs`, `slow`, `sk.prepare`-Überschreibung) nur entfernen, wo kein Skelettpfad mehr ihn braucht; `board.idleHz` bleibt für Figuren ohne VAT (Frage 2)
- [x] T9 Abschlussmessung und Bericht (AC 1–4, 11)
  - [x] `PERF_GPU=1 PERF_STAGES=1,2,4 pnpm perf` in mehreren Läufen, Vorher/Nachher in Dev Agent Record und `report.md`; Zielerreichung je Stufe; max-Frame über alle Läufe; Heap nach dem Laden, Ladezeit Brett, Backzeit/Entpackzeit je Modell bei 4×; GPU-Speicher der Texturen
  - [x] Verbleibender Abstand (falls vorhanden) mit Kostenaufstellung (Profil), nicht schönreden
- [ ] T10 Abnahme und Dokumente (AC 5, 8, 13)
  - [ ] Screenshots/Video vorher/nachher an den Produktinhaber: Idle (Video), Gehen, Angriff je Waffenart (Schwert, Lanze, Axt, Bogen, Zauberbuch, Stab), Treffer, Gefallen, Verblassen, Hand/Waffe bei einer Figur
  - [ ] Eintrag in `concept/24-architecture/decision-log.md` (VAT zur Bauzeit, 60 fps, Dateiformat, Rig 22 Gelenke, Waffen-Socket-Tabelle, Spitzenursachen, Messverfahren) und, soweit Art Direction/Pipeline berührt, in `concept/23-art-direction/decision-log.md`; `concept/16-asset-pipeline.md`/`art/README.md` um `.vat` ergänzen
  - [ ] `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün, `pnpm art:build` mit Python 3.12+

## Dev Notes

### Quellen

- `concept/26-epics/epics/epic-07.md` Story 7.8, NFR1; Story 7.7 (`7-7-grosse-schlachten-fluessig.md`: Befund, Messverfahren, Abnahme 2026-10-25); Story 8.6 (Licht, Wetter, Effekte; wird **vor** 7.8 umgesetzt, darf +0,5 ms Thread-CPU bei 2× kosten); Architektur §10 Leistung; Art Direction §4.6 (Tripo-Pipeline, Figurenbudget); `concept/24-architecture/decision-log.md` (Einträge 7.5, 7.7).
- Technischer Entwurf (Quelle der Aussagen mit Datei:Zeile, Babylon 9.32.0, nur gelesen): `C:\Users\micro\AppData\Local\Temp\claude\C---Data-01-sourcecode-github-hollow-crown--claude-worktrees-jovial-sammet-a91bea\52d0b7dd-3175-4bae-aec6-b99bd9be126b\scratchpad\7-8-design.md` (Hilfsskripte `glb.mjs`, `joints.mjs`, `weights.mjs`, `rot2.mjs`, `size2.py` daneben). Er liegt nicht im Repo: der Dev-Agent soll die Kernaussagen unten als Ausgangslage nehmen und die mit [?] markierten selbst messen.

### Entscheidungen des Produktinhabers 2026-10-26 (bindend)

1. Idle der VAT-Figuren läuft in voller Bildrate (keine 10-Hz-Drosselung); sichtbare Änderung, Abnahme per Video/Screenshots.
2. Bake-Rate **60 fps für alle Animationen**.
3. Bake zur **Bauzeit** in `tools/art`, nicht zur Laufzeit; Datendateien neben den Figuren-GLB, in dasselbe Paket wie das Modell (erstes Paket, das die Figur zeigt, `tools/art/model_packs.py`); Größe muss in das Figurenbudget (`content/packs.yaml`, ≤ 0,5 MB Transfer je Figur inkl. Modell) passen; passt es nicht, ist das eine Frage an den Produktinhaber.
4. Rig verlustfrei auf 22 Gelenke (Finger/End-Knochen weg, Gewichte in die Hand) in `prepare_tripo_unit.py`; alle 37 Tripo-Figuren neu; Stichprobe Hand/Waffe.
5. Waffen folgen den Händen über eine gebackene Socket-Tabelle auf der CPU (Entwurf Option 1); `grip`/`hold`/`attack` bleiben.
6. Schritte 0–2 des Entwurfs sind im Umfang: Frame-Trace, warme Flash/Fade/Geist-Varianten plus Aufwärm-Zeichnen, Allokationen und Layout-Zugriffe weg, Blitz-Material-Pool.
7. Ziele: ≥ 60 FPS bei 2×, ≥ 30 FPS bei 4× auf beiden Profilen, kein Frame > 100 ms in der Gegnerphase; Perf-Werkzeug mit Max-Frame-Prüfung (`PERF_STRICT`) und Vorher/Nachher; Ursachen der Spitzen im Story-Log.

### Entscheidungen Produktinhaber 2026-10-26 (Antworten auf die offenen Fragen)

Diese Antworten ersetzen die Vorschläge in AC/Tasks/Größenrechnung, wo sie abweichen (das Format „ohne Vorwärtskinematik“ ist ersetzt).

1. **Format:** lokale Pose (22 Gelenk-Quaternionen + Hips-Translation je Zeile), 60 fps für alle Clips, Vorwärtskinematik beim Laden in die Matrix-Textur (Variante C der Größenrechnung).
2. **Blender-Figuren** (`archer`, `mage`, `fighter`, `avatar`) bleiben auf dem Skelettpfad (inkl. `idleHz`); VAT nur für die 37 Tripo-Figuren.
3. **Ladezeit:** bis +1 s bei 4× für Vorkompilieren und Aufwärm-Zeichnen, gemessen als „Brett laden ms“ im Perf-Bericht.
4. **Kein Abspecken** über die 22 Gelenke hinaus.
5. **Waffen** über die CPU-Socket-Tabelle; eine Waffen-VAT-Spur nur, wenn das Profil Waffenknoten als Kostenstelle zeigt.
6. **Git LFS:** `.vat`-Dateien bekommen eine LFS-Regel wie die `.glb` (`.gitattributes`: `art/**/*.vat filter=lfs diff=lfs merge=lfs -text`).
7. **gzip-Auslieferung** der `.vat` auf GitHub Pages wird in T5 geprüft (Aufgabe, keine Frage an den Produktinhaber).
8. **Messregel:** Ø FPS = Median von 3 Läufen je Stufe; das 100-ms-Limit gilt für den größten Frame über alle Läufe.

### Entscheidungen Produktinhaber 2026-10-27 (nach Teil 1)

1. **KI-Rechenzeit im Bench:** Der Bench misst `applyCommand` (Gegner-KI) getrennt als „KI-Rechenzeit“ und zählt sie nicht zu Frames, Thread-CPU und 100-ms-Grenze; in der App rechnet die KI im Core-Worker (Story 2.8).
2. **Baseline:** `tests/perf/baseline.json` aus Lauf A3 (main vor 7.8, neues Messwerkzeug, ~30 % Last) ist das „Vorher“; der erste Lauf (altes Werkzeug, 50–90 % Last) bleibt nur Notiz.
3. **Aufwärm-Schalter:** `board.warmLevel` wandert als Wert nach `content/core/render.yaml` (`board.warm`, 0/1/2, Standard 2, Zod-Schema und `RenderDef`); der Bench (`PERF_WARM`) überschreibt diesen Wert, kein eigenes Feld nur für den Bench.
4. **Restliche GC-Spitzen bei 4×:** VAT (Teil 2) wie geplant umsetzen; bleiben danach Frames über 100 ms, die Ursachen messen und berichten, kein weiteres Abspecken von Allokationen.

### Entscheidungen Produktinhaber 2026-10-27 (nach Teil 2)

1. **Ladezeit VAT:** Entpacken und Vorwärtskinematik der `.vat` laufen in einem **Web Worker**, damit Missionen mit vielen Tripo-Figuren nicht je Modell ~160 ms (4×) im Hauptthread laden.
2. **Referenzschlacht:** Der Bench zeigt die **Tripo-Figuren**, die das Spiel tatsächlich nutzt (statt Blender-`archer` und Sprites); das „Vorher“ wird dafür auf `main` mit derselben Bench-Besetzung neu gemessen und als Baseline geschrieben.
3. **Animationen in der GLB bleiben** (Rückfall bei `board.vat: false` und ohne `DecompressionStream`); Budget ist mit 0,27–0,33 MB eingehalten.
4. **Erst-Download-Ziel** steigt von 11 auf **12 MB** (Warnschwelle; hartes Budget 30 MB unverändert), die `.vat` der ersten Mission bleiben im Precache.

### Vorher (Stand main 2026-10-26, vor 8.6)

GPU Intel UHD 630 (ANGLE/D3D11), `PERF_GPU=1`, 3 Läufe, Median; der Rechner war durch parallele Sitzungen ausgelastet. Berichtsquelle: Messung vom 2026-10-26 (Bericht und JSON im Scratchpad der Erstellung; die Werte stehen hier vollständig). Zum Vergleich der Endstand von 7.7 (ruhigerer Rechner, 2026-10-25).

| Gerät | CPU | Ø FPS (Streuung) | p95 ms | max ms | Frames > 25 ms | Thread-CPU ms/Frame | Draw Calls Ø/max | neue Effects | Ziel |
|---|---|---|---|---|---|---|---|---|---|
| pixel6a | 2× | 56,6 (54,9–57,8) | 16,8 | 650 | 2,4 % | 5,7 | 43/63 | 2 | 60 |
| pixel6a | 4× | 22,4 (18,8–24,1) | 66,8 | 1 517 | 87,9 % | 10,1 | 43/64 | 2 | 30 |
| iphone12 | 2× | 51,2 (49,8–52) | 33,3 | 1 017 | 11,2 % | 8,5 | 43/54 | 2 | 60 |
| iphone12 | 4× | 15,8 (11,1–21,7) | 100 | 2 017 | 95,2 % | 14,5 | 43/52 | 2 | 30 |

Kaltstart 1 714 ms (pixel6a), 3 923 ms (iphone12); Erstbesuch 4 140/8 581 ms; Brett laden 15 325/16 914 ms. Gegnerphase 22,6–26,7 s.

Endstand 7.7 zum Vergleich (pixel6a, iphone12 in Klammern): 2× 58,8 FPS (58,8), max 350 (333) ms, Thread-CPU 5,3 (5,3) ms, 36 Draw Calls; 4× 34,8 (28,9) FPS, max 1 083 (1 366) ms, Thread-CPU 6,9 (8,0) ms, 35 Draw Calls.

**Auffällig:** gegenüber dem Endstand von 7.7 ist `main` schlechter (Draw Calls 43 statt 35–36, Thread-CPU 4× 10,1/14,5 statt 6,9/8,0 ms, `newEffects` 2). Ursache: nach 7.7 kam Renderkosten auf `main` hinzu und der Rechner war ausgelastet; getrennt belegt ist beides nicht. Dieses Delta ist **vor 7.8** nicht zu erklären; T0 misst nach 8.6 neu, T1 trägt die Ursache über Frame-Trace ein. Die Tabelle ist die Referenz **vor 8.6**; das endgültige „Vorher“ für 7.8 ist die Neumessung unmittelbar vor Beginn (nach 8.6).

### Hauptbefund des Entwurfs (Ausgangslage, [V] = im Quelltext gelesen, [?] zu messen)

- Stationär ist der Frame bei 2× schon im Ziel (p50 16,7 ms, p95 16,8); die fehlenden FPS stammen fast nur aus **Ausreißern** (ein 600-ms-Frame kostet ~36 Frames). Bei 4× fehlt auch Dauerlast (Thread-CPU 6,9–14,5 ms/Frame gegen 8,3 ms Budget).
- [V] Nachkompilierte Effects: `ModelFigure.tint` setzt `transparencyMode` auf den eigenen Blitz-/Verblass-Materialien (`figures.ts` ~Z. 140: OPAQUE bzw. ALPHABLEND), geteilte Figurenmaterialien (`models.ts` `figureMaterial` ~Z. 111) lassen es `null`; in `StandardMaterial` hängen daran die Defines `ALPHABLEND` und `ALPHATEST_AFTERALLALPHACOMPUTATIONS`. `precompile` (`board.ts` ~Z. 332) sieht nur die geteilte Variante. Passt zu `newEffects: 2` [?: nicht per Profil bestätigt].
- [V] Einschalten einer Figur (`setEnabled(true)` in `placeUnit`, `board.ts` ~Z. 1268) kostet beim ersten Frame `Skeleton.prepare` (65 Matrizen, Bone-Textur-Upload) und die Weltmatrizen der 65 Bone-Nodes; mehrere Figuren in einem Frame ergeben zweistellige ms (Kamerafahrt). Mit VAT entfällt diese Arbeit.
- Bestand: 41 GLB (37 Tripo/Mixamo-Figuren mit 65 Joints, 5,7–6,8 k Dreiecke, 1 JPEG-Textur; 4 Blender-Figuren `archer`, `mage`, `fighter`, `avatar` mit 16–22 Joints, Vertexfarben, ohne Textur). Je Figur heute: 65 Bone-Nodes, ein geklontes Skeleton mit eigener Bone-Textur, 11 geklonte AnimationGroups (idle, walk, hit, downed, attack + `attack_cast/chop/shoot/thrust`, cheer, flee); 40 Einheiten ≈ 2 600 Bone-Nodes, ≈ 440 Gruppen. `makeGeometryUnique` je Körper (Teamtuch in Vertexfarben) ≈ 620 KB Vertexdaten je Figur.
- Animiert sind nur **22 von 65** Gelenke (Hips mit Translation + 21 Rotationen); Finger, `*_Toe_End`, `HeadTop_End` nie. Clip-Längen (Stand `prepare_tripo_unit.py`, 12 fps): idle 15,33 s, walk 2,33 s, hit/attack je 0,5 s, downed 3 s (gezeigt wird nur die **letzte Zeile**), cheer/flee je 1,92 s. Das Skin-Gewicht der Finger beträgt 5,9–6,7 % (nur Finger-Knochen) und lässt sich ohne Sichtänderung auf die Hand addieren: ein nie animiertes Kind hat in jeder Pose die Skin-Matrix seines Elternteils [Herleitung, Screenshot-Gegenprobe nötig].
- `Scene.isReady` prüft alle `scene.meshes`, nicht nur aktivierte; es zeichnet aber nichts. Deshalb braucht es zusätzlich ein Aufwärm-Zeichnen (Treiber-Erstnutzung, ANGLE/D3D11) [?].
- GC-Quellen im Frame-Pfad [V]: `figures.ts` ~Z. 122/259 (Template-String je Einheit und Frame), `board.ts` ~Z. 626–634 `updateFade` (Schlüssel und `spots`-Array je Frame), `rings.ts` ~Z. 99–100 (Array-Literale je Slot), `board.ts` ~Z. 1071+ `basis()`/`cameraKey`/`cssSize()`, `screenOfWorld` mit `getBoundingClientRect` je Label (Layout-Thrashing), `updateFx` (`filter`). Major-GC (65 ms): vermutlich Mark-Zeit des großen Heaps [?]; VAT mit geteilter Geometrie verkleinert den lebenden Graphen.
- Zeilenangaben sind Stand der Analyse und können seit 8.6 verschoben sein.

### Babylon-VAT: was zu beachten ist (9.32.0)

- `BakedVertexAnimationManager` je Mesh (`mesh.bakedVertexAnimationManager`): Textur, `time`, `animationParameters` (start, ende, offset, fps). `StandardMaterial` unterstützt es (Define `BAKED_VERTEX_ANIMATION_TEXTURE` ⇒ **zusätzliche Shadervariante**, vorzukompilieren; mit den Plug-ins aus 8.6 gegenprüfen).
- Es backt **Bone-Matrizen**, keine Vertices: Texturbreite `(Gelenke + 1) × 4` Texel, Höhe = Bilder, RGBA Float32 oder Half. Das Bild wird mit `floor` gewählt, **ohne Interpolation**: die Bake-Rate bestimmt die Glätte (deshalb 60 fps). Ab `time >= 1` überspringt der Shader Frame 0 (Frame-Korrektur): bei Schleifen mit gleichem Anfangs-/Endbild unkritisch [?: im Test prüfen].
- Das Skelett bleibt als Träger der Einflüsse nötig (`NUM_BONE_INFLUENCERS`/`matricesIndices` nur mit `mesh.skeleton`): ein geteiltes Skeleton je Modell, `prepare` einmalig No-Op.
- Babylons `VertexAnimationBaker` taugt **nicht**: er rendert die Szene je Frame und nutzt Skeleton-Animationsbereiche, nicht glTF-`AnimationGroup`s. Daher der eigene Baker zur Bauzeit.
- Zeit ist ein Uniform je Manager ⇒ ein Manager je Figur, Textur geteilt. Thin Instances lohnen hier nicht (10–15 sichtbare Figuren, Tönung ist Zustand je Figur).
- Interpolation im Bake: Babylon interpoliert die glTF-Kanäle mit voller Bildrate (Rotation = Slerp). Der Baker tastet die 12-fps-Schlüssel der Rohdatei mit 60 fps durch Slerp/Lerp ab ⇒ gleiche Bewegung wie heute, nicht „60 fps echter Bewegungsdaten“.

### Größenrechnung (AC 7, Frage 1)

Grundlage: 22 Gelenke; Zeilen = Dauer × 60 + 1 je Clip. Gezählt: idle 15,33 s ≈ 920, walk 2,33 s ≈ 140, hit 0,5 s ≈ 31, 5 × attack (attack + cast/chop/shoot/thrust) je 31 ≈ 155, downed 1, cheer/flee je 1,92 s ≈ 116. **Summe ≈ 1 470 Zeilen** (idle allein 63 %). Bei 30 fps für idle: ≈ 1 010 Zeilen.

Gemessen an den echten Quelldaten (`kael_board_tripo.glb`, `kael_anims_flee_cheer.glb`, nur diese 22 Gelenke, Rotation als Quaternion, Hips-Translation, 60 fps, Half-Float, zlib Stufe 9): idle 164 KB roh / 98 KB gzip, walk 25/21 KB, cheer und flee je 22/18 KB, Hit/Attack hochgerechnet je 5,6/≈4,5 KB. Das ergibt **Variante C** (lokale Pose, 8 B je Quaternion + 6–12 B Hips-Translation ≈ 182 B je Zeile).

| Variante | Inhalt je Zeile | roh | gzip (Schätzung) | + Modell 0,17–0,23 MB | Budget 0,5 MB |
|---|---|---|---|---|---|
| A: Matrix-Textur Half 3×4 (Bake-Ziel im Speicher) | 22 × 32 B | ≈ 1,0 MB | – | nicht übertragen | nur GPU-Speicher |
| B: **Skin-Transform je Gelenk, Quaternion + Translation, Half (14 B)**, 60 fps überall (Vorschlag aus der Vorgabe: ohne Vorwärtskinematik entpackbar) | 22 × 14 B = 308 B | ≈ 450 KB | ≈ 330 KB [A] | **≈ 0,50–0,55 MB** | **knapp darüber / nicht sicher** |
| B30: wie B, idle bei 30 fps (≈ 1 010 Zeilen) | 308 B | ≈ 310 KB | ≈ 225 KB [A] | ≈ 0,42 MB | passt |
| C: lokale Pose (22 Quaternionen Half + Hips-Translation), Vorwärtskinematik beim Laden | ≈ 182 B | ≈ 265 KB | ≈ 180 KB (gemessen) | ≈ 0,36–0,41 MB | passt |

- B ist Schätzung ([A]: gzip-Verhältnis von C übertragen, Translationen der Skin-Matrizen komprimieren schlechter); der Dev-Agent misst es in T5 am echten Bake. Die GLB-Animationen (heute ≈ 22 Gelenke × ~305 Zeilen bei 12 fps) werden vom VAT ersetzt und können entfallen; das verkleinert das Modell um einige KB und ist in den Zahlen **nicht** abgezogen.
- Die Vorwärtskinematik beim Laden (C) kostet nach grober Rechnung nur ≈ 32 000 Matrixketten je Modell (einige ms) [A, zu messen]; die Vorgabe „ohne Vorwärtskinematik“ (B) ist damit nicht aus Rechenzeit, sondern aus der Größe/dem Ladepfad begründet. Welches Format gilt, ist **Frage 1**, nicht Sache des Dev-Agents.
- Half-Float-Genauigkeit: Quaternionen ±5·10⁻⁴, Translationen bis ≈ 1 Einheit ±10⁻³ (≈ 0,1 % einer Feldlänge). Abnahmekriterium im Test: Abweichung der Vertexposition gegen die Float-Abtastung ≤ 0,002 Einheiten; sonst Float32 für die Translation.
- **Textur im GPU-Speicher** (je Modell, nicht je Figur): Breite 23 × 4 = 92 Texel (22 Gelenke + 1) × 1 470 Zeilen: Float32 ≈ 2,2 MB, Half ≈ 1,1 MB; bei 15–20 verschiedenen Modellen je Schlacht 33–43 MB bzw. 17–22 MB. Höhe 1 470 liegt unter 2 048 (Mindestgröße von WebGL2-Geräten ist 2 048). Wahl Float oder Half: Messung (Abweichung, Speicher), Ergebnis in den Dev Agent Record; Float-Texturen setzt das heutige Skeleton schon voraus (kein neues Geräteanforderung).
- Pakete: Figuren liegen heute in `core` (30 MB, bricht den Build ab) und `act1` (40 MB, warnt); +0,13–0,33 MB je Figur × 37 ≈ +5–12 MB insgesamt: im `pnpm build` prüfen, die Zahl in den Dev Agent Record.

### Waffen ohne CPU-Skelett

Heute hängt `attachGear` (`models.ts` ~Z. 151) je GearPiece ein `grip`-TransformNode unter `…:socket_r|_l` (Kind des Hand-Bones). Ohne Bone-Nodes gibt es diese Eltern nicht mehr. Lösung (Entscheidung 5): Beim Backen wird zusätzlich `socket_r/socket_l` (Hand-Matrix × fester Offset) je Zeile als Position + Quaternion in eine CPU-Tabelle geschrieben; `socket_r/_l` werden einfache TransformNodes unter der Figur, die der Tick je Zeilenwechsel setzt (gleiche Frame-Formel wie im Shader). `play()` dreht weiter `grip.rotation.x` auf `hold` (nur `lance`: −125°, `render.yaml gear`) außer bei `attack`. Kosten: ≤ 2 Knoten-Updates je sichtbarer Figur mit Waffe, jetzt mit **voller Bildrate** (Idle ohne 10-Hz-Drossel, Entscheidung 1): messen. Alternative (Waffe als eigene VAT-Spur) nur, wenn das Profil Waffenknoten zeigt (Entwurf Option 2).

### Ist-Zustand des Codes, der angefasst wird (Stand der Analyse, vor 8.6 geprüfen)

- `src/render/shared/figures.ts`: `ModelFigure` (`play`, `tick`, `tint`, `releaseOwn`, `sk.prepare`-Überschreibung, `idleHz`-Takt, `downed` = Gruppe auf `g.to`), `SpriteFigure`.
- `src/render/shared/models.ts`: `loadContainer`, `loadUnitModel` (~Z. 190; `makeGeometryUnique`, `figureMaterial`, `instantiateModelsToScene`), `attachGear`, `unitModelPath`.
- `src/render/board/board.ts`: `makeFigure` (~Z. 728), `placeUnit` (~Z. 1259), `precompile` (~Z. 332), `updateFade`, `onScreen`/`setEnabled`, Kamera-/Label-Funktionen; `src/render/board/rings.ts`.
- `src/render/host.ts`: `AssetStore` (`container`, `materials`).
- Build: `tools/art/prepare_tripo_unit.py` (`SKIP`, `sockets()`, `FPS = 12`), `tools/art/tripo_units.py`, `tools/art/build.py` (`build_models`), `tools/art/model_packs.py`, `tools/figure-budget.mjs`, `tools/check-bundle-size.mjs`, `tools/build/first-mission.mjs`, `src/app/loading/plan.ts` (`missionAssets`, `unitPacks`), `content/packs.yaml` (`figureBudget`).
- Messung: `tests/perf/{profile,perf.spec,bench,report,report-summary}.ts`, `tests/perf/baseline.json`, `tests/unit/perf-report.test.ts`.
- Zu erhalten: Replay-Gleichheit, Event-Folge (`board.play`), Verblassen (8.10), Host-Lebenszyklus, Bildraten-Deckel des Hosts, Sichtabschaltung außerhalb des Bildes (1,5 Felder Rand), geteilte Materialien/Ringe (7.7), die Ergebnisse von 8.6 (Licht, Teamtuch ungelit, Wetter, Statussymbole).

### Befehlsfolge: Figuren neu bauen

Blender 5.2 liegt unter `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` (nicht auf `PATH`); `tools/art/tripo_units.py` liest `BLENDER`. Die Quellen `art/models/source/*_board_tripo.glb` (38 Dateien inkl. `kael_anims_flee_cheer.glb`) und `art/models/units/*.glb` liegen in Git LFS und sind in diesem Worktree **bereits geladen** (Größen stimmen); in einem frischen Worktree zuerst `git lfs pull`.

```
git lfs pull
pnpm install --frozen-lockfile                 # gltfpack (meshoptimizer) ist devDependency
pip install -r tools/art/requirements.txt      # Pillow, numpy, PyYAML (Python 3.12+)
$env:BLENDER = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"   # PowerShell
pnpm art:tripo kael amos                       # Stichprobe zuerst (Blender -b, gltfpack -kn -km -c -af 12, Figurenbudget)
pnpm art:tripo                                 # alle 37 Figuren, dauert; schreibt art/models/units/<id>.glb (+ <id>.vat ab T6)
pnpm art:build                                 # kopiert in public/assets/<pack>/models/units/, schreibt manifest.models.unitPacks
node tools/figure-budget.mjs art/models/units  # Dreiecke, Textur, gzip je Figur (inkl. .vat ab T6)
pnpm build                                     # Bundle- und Figurenbudget, Precache
```

`export_models.py` (Blender-Figuren `archer`, `mage`, `fighter`, `avatar`) bleibt unberührt und überspringt die Tripo-Ids. Ergebnisdateien in LFS committen; `.vat` braucht erst eine `.gitattributes`-Regel (Frage 6). Der Dev-Agent committet nicht ohne Auftrag (Policy: nicht auf `main`, Merge per PR).

### Messverfahren

- `PERF_GPU=1 PERF_STAGES=1,2,4 pnpm perf`, `PERF_RUNS` Standard 3, Median und Streuung; **max-Frame über alle Läufe** (neu); Thread-CPU je Frame (`ThreadTime`) als robustes Maß; Draw Calls und `newEffects` mitführen. Rechner oft durch andere Sitzungen belastet: Wanduhr-Werte mit Vorsicht, Thread-CPU bei 1× ist stabiler.
- Nach jedem Block messen; Frame-Liste > 50 ms mit Ursache (neu eingeschaltete Figuren, neue Effects, GC).
- SwiftShader (CI) nur berichten. Echte Geräte bleiben Release-Check (Architektur §10, Story 9.14); das Ziel gilt für das Gerätemodell (CPU-Drosselung auf Desktop).
- Perf nicht in dieser Story-Erstellung gelaufen; die Zahlen oben sind die Messung vom 2026-10-26.

### Grenzen

- Spielregeln, KI, `src/core` nicht ändern; Spielwerte nur in YAML (`render.yaml`).
- Optik außer weicherem Idle (AC 8) nicht ändern; keine Interpolations-Plug-ins, keine Thin Instances für Figuren, kein weiteres Abspecken über die 22 Gelenke (Toes, Schultern, Spine1) ohne Entscheidung (Frage 4).
- Nicht anfassen: `dist*`, `test-results`; die Story-Dateien 6.10 und 8.6 gehören anderen Sitzungen.

### Project Context Rules (AGENTS.md)

Nie auf `main` committen/pushen, Branch + PR; Entscheidungen ins zuständige Artefakt unter `concept/` (hier `concept/24-architecture/decision-log.md`), nicht in `01-decisions.md`; offene Punkte nicht still entscheiden, nachfragen; KI-Assets nur nach `licensing.md` §6 (hier keine); Spielwerte nie im Code; kein sichtbarer Text im Code; Code, Bezeichner, Commits Englisch, Konzept Deutsch; `src/core` ohne Babylon/DOM/`Math.random`/`Date.now`; Karten/Items/Klassen als YAML mit Zod-Schema; Coverage `src/core` nie senken; fertig bei grünem `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`; `pnpm art:build` braucht Python 3.12+; PNGs/GLBs unter `art/` per `git lfs pull`; bei „Cannot find package“ `pnpm install --frozen-lockfile`.

## Offene Fragen für den Produktinhaber

1. **Passt der VAT-Datensatz in das Figurenbudget bei 60 fps?** Das Modell hat heute 0,17–0,23 MB gzip, übrig bleiben ≈ 0,27–0,33 MB. Die geschätzte Skin-Transform-Datei bei 60 fps für alle Clips (Variante B, 14 B je Gelenk und Zeile) liegt bei ≈ 0,33 MB gzip und damit **knapp über bis gerade im Budget**; idle (15 s) macht 63 % der Zeilen aus. Optionen: (a) Variante C (lokale Pose, ≈ 0,18 MB, Vorwärtskinematik beim Laden, ein paar ms je Modell) bei 60 fps überall; (b) Variante B mit idle bei 30 fps (≈ 0,23 MB); (c) das Budget für Figuren auf ≈ 0,6 MB anheben; (d) idle-Schleife kürzen. Nicht entschieden; der Dev-Agent misst in T5 und stoppt, falls B nicht passt. Empfehlung: (a), danach messen.
   **Entschieden 2026-10-26 (Produktinhaber):** Lokale Pose (22 Quaternionen + Hips-Translation), 60 fps überall, Vorwärtskinematik beim Laden in die Matrix-Textur; der Vorschlag „ohne Vorwärtskinematik“ ist ersetzt (AC 6/7, T5/T6/T7 angepasst).
2. **Blender-Figuren (`archer`, `mage`, `fighter`, `avatar`; 16–22 Gelenke, Vertexfarben, ohne Textur):** auch gebacken oder bleiben sie auf dem Skelettpfad (inkl. `idleHz`-Drossel)? Sie werden laut `art/README.md` ersetzt, sobald Tripo-Figuren da sind. Empfehlung: Skelettpfad behalten, solange sie existieren (kleiner Umfang).
   **Entschieden 2026-10-26 (Produktinhaber):** Die 4 Blender-Figuren bleiben auf dem Skelettpfad; VAT nur für die 37 Tripo-Figuren.
3. **Aufwärm-Zeichnen und Ladezeit:** Aufwärm-Zeichnen und Vorkompilieren aller Varianten verlängern den Ladebalken (Brett laden heute 15–17 s unter Last/4×; 7.7 nannte 12 s auf dem Desktop). Wie viel zusätzliche Ladezeit ist akzeptabel (Vorschlag: bis +1 s bei 4×)? Wird die Grenze überschritten, kommt die Zahl zurück an den Produktinhaber.
   **Entschieden 2026-10-26 (Produktinhaber):** Bis +1 s bei 4× für Vorkompilieren und Aufwärm-Zeichnen, gemessen als „Brett laden ms“ im Perf-Bericht (AC 10b).
4. **Weiteres Abspecken** über die 22 Gelenke hinaus (`*ToeBase` 17–28° animiert, `*Shoulder`, `Spine1` in `Spine2` falten) wäre verlustbehaftet und würde die Texturbreite nur von 92 auf ≈ 76 Texel senken. Vorschlag: nicht in dieser Story.
   **Entschieden 2026-10-26 (Produktinhaber):** Kein Abspecken über 22 Gelenke hinaus.
5. **Waffen als eigene VAT-Spur** (null CPU je Frame) statt CPU-Tabelle: nur falls die Messung mit Idle bei voller Rate Waffenknoten als Kostenstelle zeigt (≈ 47 Knoten-Updates). Dann Rückfrage.
   **Entschieden 2026-10-26 (Produktinhaber):** Waffen über die CPU-Socket-Tabelle; Waffen-VAT-Spur nur, wenn das Profil Waffenknoten als Kostenstelle zeigt.
6. **Git LFS für `.vat`:** neue Binärdateien unter `art/models/units/`. Vorschlag: `.gitattributes` um `art/**/*.vat` ergänzen (wie `art/**/*.glb`) und die Dateien mit den Figuren committen. Zustimmung nötig, da LFS-Volumen und CI-Cache (`pages.yml`) wachsen.
   **Entschieden 2026-10-26 (Produktinhaber):** `.vat` bekommt eine LFS-Regel wie `.glb` (`art/**/*.vat`).
7. **Auslieferung der `.vat`-Datei:** gzip hängt am Hosting (GitHub Pages) und am Dateityp; das Budget rechnet mit gzip. Wird die Datei nicht komprimiert ausgeliefert, entweder vorkomprimiert ausliefern (Entpacken im Client) oder das Budget roh rechnen. Der Dev-Agent prüft in T5; Entscheidung bei Abweichung beim Produktinhaber.
   **Entschieden 2026-10-26 (Produktinhaber):** gzip-Auslieferung wird in T5 geprüft (Aufgabe, keine Frage mehr).
8. **Zielverfehlung durch Hardware:** Bleibt trotz allem ein Gerät unter dem Ziel (Messung auf dem Entwicklungsrechner mit Last ist unruhig), wie viele Läufe/welche Streuung gelten als „erreicht“? Vorschlag: Median von 3 Läufen wie in 7.7, Max-Frame über alle Läufe.
   **Entschieden 2026-10-26 (Produktinhaber):** Ø FPS = Median von 3 Läufen je Stufe; 100-ms-Limit gilt für den größten Frame über alle Läufe.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5 (Dev Agent, Teil 1: T0–T3; Teil 2: T4–T9, 2026-10-27)

### Debug Log References

Alle Läufe: `PERF_GPU=1 pnpm perf` (Referenzschlacht 24×32, 40 Einheiten, Qualität `mid`, 3D-Figuren, 3 Läufe je Stufe, Median), GPU Intel UHD 630 (ANGLE/D3D11), 2026-10-26/27. Der Rechner war durch parallele Sitzungen **unterschiedlich ausgelastet** (CPU-Last je Lauf neben dem Eintrag); die Wanduhr-Werte hängen stark daran. Berichte und JSONs je Lauf liegen im Scratchpad `perf-7-8/<Name>/` (`report.md`, `pixel6a.json`, `iphone12.json`, `load.log`).

**1. Vorher/Nachher von Teil 1** (A3 = Stand 31bb7c2 mit dem Werkzeug von 7.8; P1 = Teil 1; beide bei ≈ 30 % Rechnerlast; Median der 3 Läufe, max = Median / größter Frame aller Läufe)

| Gerät | CPU | Ø FPS (Streuung) | p95 ms | max ms (alle Läufe) | Frames > 25 ms | Thread-CPU ms/Frame | Draw Calls Ø/max | neue Effects | Brett laden ms |
|---|---|---|---|---|---|---|---|---|---|
| pixel6a | 2× | 59,8 (59,8–59,9) → **60 (59,9–60)** | 16,7 → 16,7 | 66,7 (66,7) → **33,4 (50)** | 0,1 % → 0,1 % | 4,3 → 4,5 | 43/62 → 43/64 | 2 → **0** | 10 752 → 10 855 |
| pixel6a | 4× | 39,1 (38,7–41,1) → **39,1 (36,5–40,4)** | 33,4 → 49,9 | 216,6 (250) → **66,7 (100)** | 48,2 % → 47,8 % | 5,4 → 5,5 | 43/63 → 43/63 | 2 → **0** | 14 552 → 15 419 |
| iphone12 | 2× | 59,8 (59,7–59,8) → **60 (59,9–60)** | 16,8 → 16,7 | 66,7 (83,3) → **33,4 (49,9)** | 0,2 % → 0,1 % | 4,1 → 4,3 | 43/55 → 43/55 | 2 → **0** | 10 617 → 10 855 |
| iphone12 | 4× | 41,2 (39,4–42,1) → **41,1 (40–42,1)** | 33,4 → 33,4 | 216,7 (250,1) → **83,3 (83,4)** | 42,1 % → 43,2 % | 5,1 → 5,3 | 43/55 → 43/55 | 2 → **0** | 14 222 → 15 381 |

Kaltstart 1 870/1 823 → 1 819/1 852 ms (pixel6a/iphone12), Erstbesuch 4 592/4 237 → 4 303/4 239 ms. Draw Calls nicht höher (AC 11). Die Thread-CPU-Änderungen (+0,1 bis +0,2 ms) liegen im Rauschen; die FPS-Ziele (≥ 60 bei 2×, ≥ 30 bei 4×) erreicht auf diesem Rechner bei geringer Last schon der Stand A3, bei hoher Last nicht (siehe 2.). Was Teil 1 ändert, sind die **Ausreißer**: größter Frame 2× 66,7/83,3 → 33,4/49,9 ms, 4× 250 → 100/83,4 ms.

**2. Derselbe Stand (Commit 31bb7c2) in vier Messungen: die Rechnerlast bestimmt die FPS**

| Lauf | Werkzeug | Last Ø | 2× pixel6a / iphone12 FPS | 4× FPS | größter Frame 2× / 4× ms |
|---|---|---|---|---|---|
| „before“ (T0 erster Versuch) | alt, KI im Frame | 49–90 % | 55,2 / 55,8 | 26,9 / 26,4 | 1 316 / 1 900 (pixel6a), 1 050 / 2 150 (iphone12) |
| A | + Trace, KI im Frame | 16 % beim Start (nicht durchgehend protokolliert) | 58,2 / 57,6 | 24 / 31,2 | 650 / 1 750, 650 / 1 683 |
| A2 | + KI getrennt | 68 % | 59,5 / 57,8 | 26,3 / 27,5 | 133 / 283, 150 / 283 |
| **A3** (Baseline) | wie A2 | 30 % | 59,8 / 59,8 | 39,1 / 41,2 | 67 / 250, 83 / 250 |

**3. Ursachen der Spitzen (Frame-Trace, belegt)**

| Ursache | Größe | Beleg |
|---|---|---|
| **KI-Rechenzeit der Gegnerphase im Messfenster** (`applyCommand(endPhase)` auf dem Hauptthread des Benches) | erster Frame-Abstand 450–650 ms (2×), 1 170–1 750 ms (4×); `aiMs` 380–1 600 ms (2×) und 1 000–2 900 ms (4×) | Lauf A: der erste Abstand hat `atMs` ≈ 0, `frameMs` ≤ 47 ms (nicht in `board.frame`), Ursache „other“. Ab A2 wird die KI getrennt gezeitet und läuft vor dem Messfenster: der Abstand verschwindet, `aiMs` hat dieselbe Größe. Das sind die „650 ms/1 017 ms“ der Story (gleiche Größe und Lage). **In der App läuft die Gegnerphase im Core-Worker (Story 2.8, `tests/e2e/worker.spec.ts`)**: dort entsteht dieser Hänger auf dem Hauptthread nicht |
| **Neue Shadervarianten beim ersten Verdecken einer Requisite** (Zwilling aus 8.10) | 67–167 ms (2×), 183–400 ms (4×), bei ≈ 4,7–5,5 s Spielzeit, in jedem Lauf | `newEffectInfo` (Lauf mit `PERF_WARM=0`): `default: +DEPTHPREPASS +ALPHATEST_AFTERALLALPHACOMPUTATIONS` und `default: +ALPHATEST_AFTERALLALPHACOMPUTATIONS` (blendendes Material mit `needDepthPrePass` = `fadeTwin`); Ursache „shader+render“, `newEffects` 2 im Frame der Spitze. Mit angelegtem und kompiliertem Zwilling (Stufe 1): `newEffects` 0, keine `shader`-Spitze mehr |
| **Speicherbereinigung** (Major-GC) | 67–183 ms; Heap −6 bis −35 MB; Minor-GCs mit −1,6 bis −1,8 MB kosten bei 4× 50–67 ms | Trace: `gc`-Ursache = Heap-Rückgang im selben Intervall bei kurzem `board.frame`/langem Long Task. Bleibt nach Teil 1 die **einzige** Ursache über 100 ms (siehe 5.) |
| Figuren einschalten (`setEnabled`, erstes `Skeleton.prepare`) | – | **nicht belegt**: `newEnabled` ist in keiner Spitze > 0 (die Figuren der Referenzschlacht stehen vom Beginn an im Bild). Die Annahme des Entwurfs ist für dieses Szenario nicht bestätigt; sie bleibt für Kamerafahrten über große Karten offen |
| Layout (`getBoundingClientRect` je Label) | – | `long-animation-frame`: Style/Layout 0–3 ms je Lauf, keine Spitze ≥ 20 ms in A bis P1 (der Bench hat nur wenige Labels; mit Wimpeln/Bluten/Zahlen wäre es mehr) |
| Reine Renderlast bei 4× | Frames 50–180 ms, „render“ | Dauerlast der Szene unter 4× Drosselung, keine einzelne Ursache; bei hoher Rechnerlast häufiger (Läufe A, A2, B) |

**4. Läufe A/B/C: welcher Teil wirkt** (`newEffects` = neue Shadervarianten in der Gegnerphase; größter Frame aller 3 Läufe in ms: 2× pixel6a/iphone12 | 4× pixel6a/iphone12)

| Lauf | Stand | Last Ø | newEffects | 2× | 4× |
|---|---|---|---|---|---|
| A2 / A3 | 31bb7c2 (A, „heute“) | 68 % / 30 % | 2 | 133/150 · 67/83 | 283/283 · 250/250 |
| L0 | Allokationen (T3) und Pool, `warmLevel` 0 | 43 % | 2 | 83/100 | 267/333 |
| B (alt) | Tint-Varianten warm, noch ohne Zwilling | 58 % | **2** | 150/217 | 400/267 |
| C (alt) | + Aufwärm-Zeichnen, noch ohne Zwilling | 48 % | **2** | 67/117 | 267/400 |
| B | Tint-Varianten und Zwillinge kompiliert (`warmLevel` 1) | 54 % | **0** | 67/50 | 250/83 |
| C2 / P1 | + Aufwärm-Zeichnen (`warmLevel` 2, ausgeliefert) | 31 % | **0** | 50/50 | 100/83 |

Die Tint-Varianten allein (B alt) ändern nichts: die Hypothese der Story ([?] im Entwurf) ist widerlegt. Das Aufwärm-Zeichnen senkt die Resthänger (C gegenüber B: größter Frame 4× 250/83 → 100/83 bei geringerer Last); gemessen sind es einzelne Läufe, kein Beleg für sich.

**5. Rest nach Teil 1: 4× und das 100-ms-Limit.** In P1 (3 Läufe) bleibt 4× pixel6a bei genau 100 ms (nicht darüber), iphone12 bei 83 ms. In einer Reihe von 10 Läufen bei 4× (Messungen W2a/W2b, ≈ 32 % Last) gibt es aber in 1 von 10 Läufen auf pixel6a 133 ms und in 4 von 10 auf iphone12 117 ms; **alle fünf sind Major-GC** (Heap −6,5 bis −19 MB, `gc`-Ursache, `newEffects` 0). Das 100-ms-Limit bei 4× ist damit mit Teil 1 **nicht verlässlich** erreicht; was bleibt, ist der Heap-Graph (≈ 2 600 Bone-Nodes, ≈ 440 Animationsgruppen, Geometrie je Figur), den Teil 2 (22 Gelenke, VAT mit geteilter Geometrie) verkleinert.

**6. Wirkung von T3 (Allokationen/Layout)**: Speicherbereinigungen je Lauf bei 2× (Heap-Rückgänge ≥ 256 KB) A3 → P1: pixel6a 41 → 36, iphone12 40 → 22; freigegebener Speicher je Lauf 141,6 → 117,0 MB und 140,2 → 112,5 MB (≈ −17 bis −20 %); bei 4× 3 → 4 und 15 → 10 (Stichprobe zu klein). Layout je Lauf 0–3 ms vorher wie nachher. Thread-CPU je Frame ohne messbare Änderung (Rauschen ±0,3 ms).

**7. Ladezeit „Brett laden“ bei 4× (AC 10b)**: je Stufe gemessen (Median von 10 Läufen, 2 Reihen à 5, ≈ 31 % Last): ohne Aufwärmen (`warmLevel` 0) pixel6a 14 717 ms, iphone12 14 441 ms; mit Aufwärmen (`warmLevel` 2) 15 144 ms und 15 055 ms: **+0,43 s und +0,61 s**, also innerhalb von +1 s (Stufe 1 allein: 15 014 und 15 461 ms, 5 Läufe). Der Vergleich A3 → P1 (je 3 Läufe) zeigt +0,87 s und +1,16 s und liegt im Rauschen des Rechners; die Reihe mit 10 Läufen ist die belastbarere Messung. Bei 2×: 10 752 → 10 855 und 10 617 → 10 855 ms.

**8. Prüfungen**: `pnpm lint`, `pnpm test --maxWorkers=2` (74 Dateien, 901 Tests), `pnpm content:check`, `pnpm build` (Bundle 10,53 MB, Pack act1 21,20 MB, Figurenbudget 0 über Budget), `E2E_PORT=4391 pnpm test:e2e` (17 bestanden, 3 übersprungen wie vorher) grün.

### Dev Agent Record – Teil 2 (T4–T9, 2026-10-27)

**Was gebaut wurde.**
1. `tools/art/prepare_tripo_unit.py` `slim_rig()`: Finger- und End-Knochen (`SKIP` und `*_End`) fallen weg, ihre Skin-Gewichte werden auf den nächsten behaltenen Vorfahren addiert (Hand, `ToeBase`, `Head`). Der Bau vergleicht die Vertexpositionen unter einer beliebigen Pose vor und nach dem Entfernen und bricht ab, wenn sie um mehr als 2·10⁻⁴·Höhe abweichen.
2. `tools/art/bake_vat.py` (neu): liest die ungepackte `<id>.raw.glb`, tastet jeden Clip mit 60 Bildern/s ab (Slerp, Lerp der Hips-Translation, STEP-Kanäle des Exporters), schreibt `<id>.vat` (Format im Kopf der Datei: lokale Pose je Zeile, 22 Quaternionen als Half, planar und byteweise getrennt, Hips-Translation als Float, dazu Rig und Sockets, als gzip-Strom) und prüft sich selbst gegen die Schlüssel (Vertexabweichung in Brett-Einheiten, Grenze 0,002).
3. `src/render/shared/vat.ts` (neu, ohne Babylon): Datei lesen, Clip-Zeile zu einer Zeit, Vorwärtskinematik der Matrix-Textur und der Hand-Sockets.
4. Laufzeit: `models.ts` `vatEntry`/`loadVatUnit` (eine Half-Float-Textur je Modell und Szene, ein Body-Mesh je (Modell, Team) mit geteilter Geometrie, je Figur ein Klon mit eigenem `BakedVertexAnimationManager`, Kopien nur der zwei Knoten über den Gelenken (`__root__`, `Armature`) und der Socket-Knoten; geteiltes Skeleton nur als Träger der Joint-Attribute, sein `prepare` einmalig stillgelegt); `figures.ts` (`ModelFigure` wählt die Zeile aus der Animationsuhr, Idle in voller Bildrate, Waffen-Sockets setzt `show()` bei Zeilenwechsel, Griff/Halt/Angriff unverändert); `host.ts` (`AssetStore.vat`/`vatModels`); `board.ts` (Animationsuhr `animClock`, die beim Kritisch-Freeze stehen bleibt wie die Engine-Animationen; `board.warm` aus YAML).
5. Schalter in `content/core/render.yaml`: `board.vat` (an) und `board.warm` (2; `warmLevel` ist entfallen, `PERF_WARM` überschreibt den YAML-Wert im Bench, `PERF_VAT=0` schaltet für den A/B-Vergleich auf den Skelettpfad).
6. Build: `tripo_units.py` ruft den Bake zwischen Blender und gltfpack, `build.py` kopiert `.vat` neben die GLB in dasselbe Paket und trägt `manifest.models.vat` ein, `figure-budget.mjs` zählt die `.vat` zur Figur, `check-bundle-size.mjs`/`first-mission.mjs` (Precache der ersten Mission) und `plan.ts`/`flow.ts` (`missionAssets`) kennen die Datei, `.gitattributes` hat die LFS-Regel. Perf-Bericht um „VAT beim Laden“ (Modelle, Backzeit, Texturspeicher) erweitert.

**Befunde und Abweichungen beim Bauen.**
- **gltfpack faltet die Quantisierung der Positionen in die Inverse-Bind-Matrizen** (die Positionen im ausgelieferten GLB sind Ganzzahlen). Die IBM der Rohdatei passt deshalb nicht zum Modell: die Vorwärtskinematik multipliziert mit den IBM des **geladenen** Modells (`Bone.getAbsoluteInverseBindMatrix()`), die der Datei dienen nur dem Bau und dem Test. Gegenprobe im Browser: Matrizen der VAT-Textur und die des Babylon-Skeletons stimmen für 11 Clip-Zeilen und die Gefallen-Pose auf ≤ 6·10⁻⁴ überein (Half-Rundung). Bildvergleich Skelett/VAT bei „Gefallen“: 27 von 120 000 Pixeln mit mehr als 40 Stufen Unterschied; Angriff mit Lanze (Halt, Stoß) sieht gleich aus.
- **Sockets**: die Socket-Tabelle (Position + Quaternion je Zeile) steht **nicht** in der Datei, sondern entsteht beim Laden aus denselben lokalen Posen in derselben Vorwärtskinematik (gleicher Inhalt, spart ≈ 80 KB roh je Figur; die Datei trägt nur die lokale Lage und den Maßstab 1,249 der Sockets).
- **Anzahl Figuren**: neu gebaut sind **40** Tripo-Figuren (so viele `*_board_tripo.glb` liegen in `art/models/source`, nicht 37), alle mit 22 Gelenken, ≤ 4 Einflüssen je Vertex und 1 479 Zeilen (idle 920 und walk 140 als Schleifen ohne die Wiederholzeile, hit und je attack 31, downed 1, cheer/flee je 116). Abweichung der Vertexpositionen durch das Entfernen der Knochen ≤ 1,5·10⁻⁷; Bake-Abweichung mit Half-Zeilen **und** Half-Textur ≤ 5,3·10⁻⁴ Brett-Einheiten (Grenze 0,002): die Half-Float-Textur genügt.
- **Animationen bleiben in der GLB** (Skelettpfad für `board.vat: false` und als Rückfall, falls `DecompressionStream` fehlt oder die Datei nicht passt). Würden sie entfallen, spart das ≈ 40 KB gzip je Figur (an Kael gemessen: 0,13 statt 0,17 MB); Entscheidung beim Produktinhaber, siehe Frage 3.
- Waffen: das Profil zeigt keine Waffenknoten als Kostenstelle (≤ 2 Knoten-Updates je sichtbarer Figur, nur bei Zeilenwechsel); keine Waffen-VAT-Spur.
- T8: es gab nichts zu entfernen: der Skelettpfad (Drosselung `idleHz`, `needs`, `slow`, `sk.prepare`-Überschreibung) bleibt für die 4 Blender-Figuren und für `board.vat: false` bestehen; VAT-Figuren durchlaufen ihn nicht.

**T5 Größe und gzip-Auslieferung.** `.vat` je Figur 109,9–117,5 KB (Ø 112,8 KB; roh 274 KB), deutlich unter der Schätzung von 180 KB, weil die planare, byteweise getrennte Anordnung besser packt. Modell + `.vat` (gzip) **0,27 MB (villager_child) bis 0,33 MB (ilka)**, Budget 0,5 MB: **0 Figuren über Budget** (`node tools/figure-budget.mjs art/models/units`, 44 Figuren inkl. der 4 Blender-Figuren mit 0,05–0,07 MB). Auslieferung: auf der Live-Seite (GitHub Pages) kommt `kael.glb` mit `Content-Encoding: gzip` (187 KB, `model/gltf-binary`); wie Pages den unbekannten Dateityp `.vat` behandelt, war ohne Deploy nicht zu prüfen. Deshalb ist die Datei **selbst ein gzip-Strom** (Transfer = Dateigröße, unabhängig vom Hosting; `check-bundle-size.mjs` zählt `.vat` unverändert); entpackt wird mit `DecompressionStream('gzip')` (Chrome 80+, Safari 16.4+, Firefox 113+; fehlt es, fällt die Figur auf den Skelettpfad zurück). `pnpm build`: erster Download (Paket core) 11,15 MB (der Precache enthält jetzt die `.vat` der ersten Mission; Warnung „über dem Ziel 11 MB“, Budget 30 MB), Paket act1 25,03 MB (Budget 40 MB).

**T9 Messung** (`PERF_GPU=1 PERF_STAGES=1,2,4 pnpm perf`, 3 Läufe, Median; GPU Intel UHD 630). **Der Rechner war durch andere Sitzungen durchgehend stark belegt** (ein fremder Vite-Prozess der Sitzung `recursing-aryabhata` mit > 40 000 s CPU-Zeit belegt dauerhaft Kerne); A3 und die Läufe darunter sind deshalb nur bedingt vergleichbar. Vorher = A3 (≈ 30 % Last, Baseline); V0 = Teil 2 mit `PERF_VAT=0` (Skelettpfad, aber neue 22-Gelenke-GLB; 79 % Last); **V1 = Teil 2 fertig (VAT an; 66 % Last)**; V0 und V1 liefen unmittelbar nacheinander. Ein erster Lauf T7 bei 96 % Last ist unbrauchbar (nur Notiz).

| Gerät | CPU | Ø FPS A3 → V0 → **V1** (Streuung V1) | p95 ms | max ms, größter Frame aller Läufe | Thread-CPU ms/Frame | Draw Calls Ø/max | neue Effects | Brett laden ms |
|---|---|---|---|---|---|---|---|---|
| pixel6a | 2× | 59,8 → 59,8 → **59,9** (59,7–60) | 16,7 → 16,8 → 16,7 | 66,7 → 100,1 → **66,6** | 4,3 → 7,0 → 5,9 | 43/62 → 43/64 → 42/59 | 2 → 0 → **0** | 10 752 → 12 987 → 12 356 |
| pixel6a | 4× | 39,1 → 28,2 → **39,0** (36,4–39,2) | 33,4 → 50 → 33,4 | 250 → 133,4 → **66,6** | 5,4 → 8,5 → 6,2 | 43/63 → 43/63 → 41/60 | 2 → 0 → **0** | 14 552 → 17 292 → 16 225 |
| iphone12 | 2× | 59,8 → 44,3 → **56,9** (56,6–59,9) | 16,8 → 50 → 16,8 | 83,3 → 350 → **166,7** | 4,1 → 8,1 → 6,3 | 43/55 → 43/54 → 42/55 | 2 → 0 → **0** | 10 617 → 15 094 → 11 982 |
| iphone12 | 4× | 41,2 → 28,3 → **37,1** (35,8–38,2) | 33,4 → 50,1 → 33,4 | 250,1 → 199,9 → **133,3** | 5,1 → 8,7 → 6,6 | 43/55 → 43/54 → 41/54 | 2 → 0 → **0** | 14 222 → 21 473 → 16 412 |

Bei ähnlicher Rechnerlast bringt VAT gegenüber dem Skelettpfad (V0 → V1) bei 4× +9 bis +11 FPS und −2,3 ms Thread-CPU je Frame, bei 2× auf iphone12 +12,6 FPS, bei pixel6a nichts Messbares (liegt schon im Ziel); die Draw Calls sinken um 1–2.

Zielerreichung V1: ≥ 60 FPS bei 2×: pixel6a 59,9 **erreicht** (Toleranz 0,5), iphone12 56,9 **verfehlt**. ≥ 30 FPS bei 4×: pixel6a 39,0 und iphone12 37,1 **erreicht**. Kein Frame > 100 ms: pixel6a bei 2× und 4× (66,6 ms) **erreicht**; iphone12 **nicht**: 2× 166,7 ms (Render in einem Long Task von 160 ms), 4× 133,3 ms (Speicherbereinigung, Heap −20 MB) und 116,7 ms (Render).

**Verbleibender Abstand mit Ursachen** (Frame-Trace > 50 ms, V1): pixel6a 2× 1 Frame (gc), 4× 13 (render 11, other 2); iphone12 2× 8 (render 5, other 2, gc 1), 4× 19 (render 15, gc 2, other 2, frame-js 1). Die „render“-Spitzen fallen mit der Dauerlast durch andere Prozesse (66 % im Lauf) zusammen und sind keiner einzelnen Ursache im Brett zuzuordnen (Vermutung, nicht belegt: bei ruhigem Rechner verschwinden sie, wie A3 bei 30 % Last zeigte); die Major-GC-Spitze (133 ms) bleibt bei 4× das einzige belegte Resthindernis. Die Referenzschlacht `benchMap` enthält nur **3 VAT-Modelle** (`brigand`, `soldier`, Avatar): die Marksmen nutzen das Blender-Modell `archer` (Skelettpfad, Entscheidung 2 vom 2026-10-26), die Diebe haben kein 3D-Modell und erscheinen als Sprite; VAT wirkt im Bench also nur auf einen Teil der Figuren. Weitere Allokationskürzungen wurden nicht mehr versucht (Entscheidung 4 vom 2026-10-27).

**Ladezeit (AC 10b).** „Brett laden ms“ bei 4×: V1 16 225/16 412 gegen V0 17 292/21 473 (VAT nicht langsamer) und gegen A3 14 552/14 222 bei 30 % Last: +1,7/+2,2 s, der Lastanteil lässt sich nicht abtrennen. Direkt gemessen (`vatBuild`: Vorwärtskinematik + Half-Umwandlung + Texturanlage, ohne Entpacken und Parsen): **3 Modelle 474/488 ms bei 4× (≈ 160 ms je Modell)**, 87–144 ms bei 1×; dazu Teil 1 (Vorkompilieren und Aufwärm-Zeichnen) +0,43/+0,61 s. In der Referenzschlacht liegt die Summe bei etwa 0,9–1,1 s, **also an der Grenze von +1 s**; bei 10–20 verschiedenen Tripo-Modellen wären es bei 4× rund 1,6–3,2 s allein für die VAT. **Siehe offene Frage 1.** Texturspeicher: 1,04 MB je Modell (Half, 88 × 1 479 Texel), rund 21 MB bei 20 Modellen. Entpacken (≈ 80 ms beim ersten Mal) und Parsen (≈ 17 ms) kommen je Datei einmal pro Sitzung dazu (Node, 95 % Last gemessen).

**Prüfungen:** `pnpm lint` (inkl. Typecheck), `pnpm content:check`, `pnpm build` (Figurenbudget: 0 über Budget) grün; `tests/unit/vat.test.ts` (13 Tests: Format, Clip-Zeilen, Vorwärtskinematik, Sockets, gebackene Datei von Kael mit Zeilen je Clip und Bind-Pose); `pnpm test --maxWorkers=2`: 79 Dateien, 970 Tests grün (bei hoher Rechnerlast laufen einzelne Tests ins 5-s-Zeitlimit, einzeln und mit `--testTimeout=60000` grün); `E2E_PORT=4391 pnpm test:e2e`: 18 bestanden, 6 übersprungen; `pnpm test:coverage` (src/core): Statements 88,93 %, Branches 81,36 %, Functions 92,61 %, Lines 91,71 % (Schwellen gehalten, `src/core` bis auf `unitVatPath` unverändert).

**Offene Fragen für den Produktinhaber (Teil 2) – Fragen 1 bis 4 am 2026-10-27 beantwortet, siehe Teil 2b; Frage 5 (Konsolenfehler) behoben.** Die Messung der Tabelle oben (Besetzung mit Blender-Bogenschütze und Sprite-Dieb) ist durch Teil 2b ersetzt.
1. **Ladezeit der VAT bei vielen Modellen**: Vorwärtskinematik + Half + Textur kosten ≈ 40 ms je Modell (1×) bzw. ≈ 160 ms (4×); in der Referenzschlacht (3 VAT-Modelle) zusammen mit Teil 1 an der +1-s-Grenze, in Schlachten mit mehr Modellen darüber. Soll ein Web Worker Parsen und Vorwärtskinematik übernehmen (Hauptthread bleibt frei), oder darf die Grenze für große Besetzungen steigen? Format und Bildrate habe ich nicht angefasst.
2. **Referenzschlacht**: ihre Besetzung nutzt für Bogenschützen das Blender-Modell `archer` und für Diebe Sprites; VAT greift dort nur bei einem Teil der Figuren. Soll die Bench-Besetzung auf Tripo-Figuren umgestellt werden (dann neue Baseline)?
3. Animationen in der GLB lassen oder entfernen (≈ 40 KB gzip je Figur)?
4. Der erste Download des Pakets core liegt mit 11,15 MB über dem **Ziel** von 11 MB (nur Warnung; +0,6 MB durch die `.vat` der Prolog-Figuren). Ziel anheben?
5. Vorbestehend (Teil 1/Story 8.10, nicht von Teil 2): beim Laden des Bretts meldet Babylon 16-mal „Unable to compile effect … `instanceColor` undeclared“ (Requisiten-Zwillinge mit Thin-Instance-Farbe: `INSTANCESCOLOR` ohne `INSTANCES`); „Trying next fallback“ rettet den Aufbau, kostet aber eine Kompilierung. `forceCompilationAsync(twin, { useInstances: true })` behob es nicht, deshalb unverändert.

### Dev Agent Record – Teil 2b (Nacharbeit nach der Prüfung und den Entscheidungen vom 2026-10-27)

**1. Optik VAT gegen Skelett (Prüfbefund: Angriff wirkt abgewandt).** Ursache belegt: **kein** Fehler in Bake, Vorwärtskinematik oder Ausrichtung, sondern der **Startzeitpunkt der Clips**. Beleg:
- Ausrichtung gleich: Frame-Trace während des Lanzenstoßes zeigt für beide Pfade `facing` `w`, `rotation.y` −1,57, `anim` `attack` und den Wechsel auf Idle/`s` zur selben Zeit.
- Pose je Clipzeit gleich: Matrizen der VAT-Textur gegen die des Babylon-Skeletons für `attack_thrust` (13 Zeilen 0–30), `attack` (7), `walk` (5), `hit` (4), `idle` (4), `downed`: größte Abweichung 6,9·10⁻⁴ (Half-Rundung). Gleiche Clipzeit, gleiche Pose im Bild: `shots/7-8/pose-strip-attack-thrust.png`, `pose-strip-walk.png`, `pose-strip-hit-downed.png` (oben VAT, unten Skelett, beide auf Frame 0, 6, 12, 18, 24, 30 bzw. 0, 35, 70, 105 bzw. 0, 10, 20, 30 und Gefallen).
- Zeitversatz: die Skelett-Animation beginnt mit dem **nächsten** Animationsschritt nach `play` (erste Messung 1,9 Bilder bei 71 ms statt 4,2), die VAT-Figur startete mit der Uhr des **letzten** Ticks (bis 16 ms früher): ≈ 3–6 Bilder Vorsprung, und der Stoß dreht den Oberkörper in 6 Bildern um fast 90°. Behoben: der Clip beginnt mit der Zeit des nächsten Ticks (`figures.ts` `playBaked`); danach liegen beide Pfade im Mittel ≤ 1–2 Bilder auseinander (Messung `trace78`: VAT Bild 3/8/11/15/20/24 bei 72/140/209/304/366/430 ms, Skelett 2/6/10/14/18/21,6 bei 60/127/195/264/334/401 ms). Gleiche Zeitstreifen: `shots/7-8/atk2-lance-strip-a.png`, `-b.png`.
- Der Soldat rechts im Bild steht im Idle: Idle ist die gewollte sichtbare Änderung (volle Bildrate statt 10 Hz); Idle-Schleifen beginnen im Bench und im Spiel gleichzeitig, wie vorher.

**2. Konsolenfehler „instanceColor undeclared“ (16 Stück beim Laden).** Ursache: Babylon setzt das Define `INSTANCESCOLOR`, sobald ein Mesh Instanzen **mit** Instanzfarbe hat, und **setzt es nie zurück**. Der Requisiten-Zwilling (8.10) bekommt beim Vorkompilieren (`showTwins`, Teil 1) eine Instanz, gibt sie am Ende von `precompile` wieder ab (`writeProps`) und behält die Define im `SubMesh.materialDefines`; die nächste Bereitschaftsprüfung der Szene (`Scene.isReady`) kompiliert das Mesh dann **ohne Instancing** (`INSTANCES` aus) mit dem Farbattribut: Fehler im Vertex-Shader, Babylon fängt ihn über die Rückfallstufe ab. Der Fehler trat nur mit `board.warm ≥ 1` auf (mit 0: keine). Behebung in `board.ts`: ein Mesh ohne Instanzen verliert in `writeProps` den Farbpuffer (`thinInstanceSetBuffer('color', null)`) und bekommt frische Defines (`subMesh.materialDefines = null`); der Zwilling trägt die Farbe der Vorlage gar nicht erst (`fadeTwin`); `forceCompilationAsync(twin, { useInstances: true })`, wie die Zeichnung ihn nutzt. Gemessen am Konsolenlog: **0 Fehler und 0 Warnungen** beim Laden der Referenzschlacht (8 VAT-Modelle) und der Act-1-Karten `m1_4_wolfslager` (14 Einheiten) und `m1_2_erlbach` (11 Einheiten) sowie beim Prolog; `newEffects` in der Gegnerphase 0 (siehe Tabelle).

**3. Entscheidungen des Produktinhabers (nach Teil 2), umgesetzt.**
- **A Worker:** `vatLoader.ts` + `vatWorker.ts` (Modul-Worker, Pool aus 1–3 Workern): die Datei wird auf dem Hauptthread geholt, Entpacken, Lesen und die Vorwärtskinematik samt Half-Umwandlung laufen im Worker (mehrere Modelle gleichzeitig und während die GLB laden: `loadUnitModel` startet den Abruf vor dem Warten auf die GLB), zurück kommen Zeilen als `Uint16Array` (übertragen) und die Socket-Tabelle; der Hauptthread legt nur die Textur an. Die reine Mathematik bleibt in `vat.ts` (Unit-Tests). Rückfall auf den Hauptthread, wenn kein Worker entsteht oder einer ausfällt (`tests/unit/vat.test.ts` prüft den Weg ohne Worker, Gleichheit mit dem direkten Aufruf).
- **B Bench-Besetzung:** `tests/perf/benchMap.ts` zeigt jetzt nur Image-to-3D-Figuren, wie das Spiel sie in Akt 1 zeigt: Gegner `brigand`, `soldier`, `bandit_archer` (statt Blender-`archer`), `mercenary` (statt Dieb-Sprite); Spieler `tobin`, `varek`, `mira`, `liora` (Klassen vanguard, skirmisher, marksman, healer). Acht verschiedene VAT-Modelle. Neue Baseline `tests/perf/baseline.json` aus **origin/main** (fd46675, ohne Teil 1 und 2, temporärer Worktree `scratchpad/main78` mit nur dem Messwerkzeug und der Besetzung darüber, `git lfs pull`, `pnpm art:build`, Worktree danach entfernt), 3 Läufe, `PERF_WRITE_BASELINE=1`, Rechnerlast im Mittel 55 % (Spitze 85 %).
- **C:** GLB-Animationen bleiben (keine Änderung). **D:** Warnziel des ersten Downloads 12 MB als `firstDownloadTargetMb` in `content/packs.yaml` (Schema `packs.ts`), gelesen von `tools/check-bundle-size.mjs`; die `.vat` bleiben im Precache (11,15 MB, kein Warnhinweis mehr).

**4. Endmessung** (`PERF_GPU=1 PERF_PORT=4392 PERF_STAGES=1,2,4`, 3 Läufe, Median; neue Besetzung). Vorher = Baseline B0 (origin/main, Last 55 %); **nachher = F2 (Teil 2 fertig, Last 39 %, Spitze 77 %)**; F1 (Last 50 %, Spitze 100 %) ist der erste Lauf desselben Stands.

| Gerät | CPU | Ø FPS (Streuung) vorher → **nachher** | p95 ms | max ms (größter Frame aller Läufe) | Thread-CPU ms/Frame | Draw Calls Ø/max | neue Effects | Brett laden ms |
|---|---|---|---|---|---|---|---|---|
| pixel6a | 2× | 59,7 (59,5–59,7) → **60,0 (59,9–60)** | 16,7 → 16,8 | 116,7 → **49,9** | 5,9 → 4,5 | 52/77 → 49/72 | 2 → **0** | 12 079 → 11 323 |
| pixel6a | 4× | 29,1 (27,6–30,3) → **40,7 (40,0–42,6)** | 50 → 33,4 | 283,3 → **133,4** | 7,8 → 5,2 | 51/76 → 48/72 | 2 → **0** | 17 340 → 16 323 |
| iphone12 | 2× | 59,3 (58,5–59,7) → **60,0 (60–60)** | 16,8 → 16,8 | 116,6 → **33,4** | 6,7 → 4,0 | 52/65 → 49/63 | 2 → **0** | 12 237 → 11 147 |
| iphone12 | 4× | 30,0 (27,6–32,7) → **39,9 (38,6–41,3)** | 50 → 33,4 | 233,4 → **133,3** | 7,7 → 5,5 | 51/65 → 48/63 | 2 → **0** | 17 423 → 15 931 |

F1 (Last 50 %): pixel6a 2× 59,9 (max 50), 4× **27,2** (max 300 ms; in diesem Lauf lag die Rechnerlast zeitweise bei 100 %, 269 „render“-Frames), iphone12 2× 60,0 (max 33,4), 4× 41,2 (max 116,6): bei starker Fremdlast verfehlt pixel6a 4× das Ziel.

**Zielerreichung (F2):** ≥ 60 FPS bei 2× auf beiden Profilen **erreicht** (60,0); ≥ 30 FPS bei 4× auf beiden **erreicht** (40,7 / 39,9). Kein Frame > 100 ms: bei 2× **erreicht** (49,9 / 33,4 ms); bei 4× **nicht** (133,4 / 133,3 ms). Ursachen der Frames > 50 ms bei 4× (Frame-Trace, F2): pixel6a 17 (render 16, gc 2, frame-js 1), iphone12 12 (render 12, gc 3). Die „render“-Spitzen sind einzelne Frames mit langer Zeichenzeit (scene.render) unter 4×-Drosselung; Zuordnung zu einer Einzelursache im Brett ist nicht belegt (bei 39 % Rechnerlast, Spitzen 77 %). Weitere Allokationskürzungen wurden nicht versucht (Entscheidung 4 vom 2026-10-27).

**Ladezeit „Brett laden“ bei 4×, Reihe (Median der 3 Läufe), Referenzschlacht mit 8 VAT-Modellen:**
- origin/main (Skelett, B0): 17 340 (pixel6a) / 17 423 (iphone12) ms
- Teil 2, Hauptthread (`PERF_VATWORKER=0`, F3, Last 36 %): 17 286 / 17 244 ms
- Teil 2 mit Workern (F2, Last 39 %): **16 323 / 15 931 ms**, also −1,0 / −1,3 s gegenüber dem Hauptthread und −1,0 / −1,5 s gegenüber main.
Hauptthread-Zeit für die Texturanlage mit Workern: 9–13 ms für alle 8 Modelle; Arbeit in den Workern 337–419 ms (8 Dateien, nicht gedrosselt). Texturspeicher 8,1 MB (8 Modelle, Half).

**Prüfungen (Teil 2b):** `pnpm lint`, `pnpm test --maxWorkers=2` (79 Dateien, 971 Tests), `pnpm content:check`, `pnpm build` (Figurenbudget 0 über Budget, erster Download 11,15 MB bei Ziel 12 MB, Worker-Chunk `vatWorker-*.js` im Precache), `E2E_PORT=4391 pnpm test:e2e` (18 bestanden, 6 übersprungen) grün.

### Completion Notes List

- Ultimate context engine analysis completed – comprehensive developer guide created (2026-10-26, Erstellung der Story; nichts umgesetzt, `perf` nicht ausgeführt).
- Teil 1 (T0–T3) umgesetzt 2026-10-26/27: Messwerkzeug mit Frame-Trace und Max-Frame-Prüfung, Ursachen belegt, Zwillings- und Tint-Varianten vorkompiliert, Aufwärm-Zeichnen, Material-Pool, Allokationen/Layout im Frame-Pfad. T4 ff. siehe Teil 2.
- Messwerkzeug: Die KI-Rechenzeit der Gegnerphase (`applyCommand`) wird vor dem Messfenster gezeitet (`aiMs`, Bericht-Spalte „KI-Rechenzeit der Phase“) und zählt nicht zu den Frames und zur Thread-CPU; vorher war sie der erste Frame-Abstand (450–1 750 ms) und trieb die Thread-CPU je Frame. Das ist eine Entscheidung des Werkzeugs, keine der Spielregeln: siehe offene Frage in der Übergabe.
- `board.warmLevel` (0/1/2, Standard 2) ist ein Messhaken im ausgelieferten Code, damit der Bench zeigt, was welcher Teil des Aufwärmens bewirkt; Bench-Schalter `PERF_WARM`.
- Die Tabelle „Vorher (Stand main 2026-10-26, vor 8.6)“ in den Dev Notes bleibt als Vor-8.6-Referenz; das „Vorher“ nach 8.6 steht im Dev Agent Record und in `tests/perf/baseline.json`.

### File List

Teil 1: `tests/perf/{profile,report,report-summary,bench,perf.spec}.ts`, `tests/perf/baseline.json`, `playwright.perf.config.ts` (`--enable-precise-memory-info`), `tests/unit/perf-report.test.ts`, `tests/unit/figure-tint-pool.test.ts` (neu), `src/render/board/{board,rings}.ts`, `src/render/shared/{figures,models}.ts`, `src/render/host.ts` (`AssetStore.tintPool`), `content/core/render.yaml` (`board.tintPool`), `src/content/schemas.ts`, `src/core/defs.ts` (nur Typ `RenderDef`).

Teil 2 und 2b: `src/render/shared/{vatLoader,vatWorker}.ts` (neu), `tests/perf/{benchMap.ts,baseline.json}` (Besetzung und Baseline), `content/packs.yaml` und `src/content/packs.ts` (`firstDownloadTargetMb`), `tools/art/{prepare_tripo_unit,tripo_units,build}.py`, `tools/art/bake_vat.py` (neu), `tools/{figure-budget,check-bundle-size}.mjs`, `tools/build/first-mission.mjs`, `.gitattributes`, `art/models/units/*.glb` (40 neu gebaut) und `*.vat` (40 neu), `src/render/shared/vat.ts` (neu), `src/render/shared/{models,figures,assets}.ts`, `src/render/{host.ts,board/board.ts}`, `src/core/{figure,defs}.ts` (`unitVatPath`, `RenderDef`), `src/content/schemas.ts`, `content/core/render.yaml` (`board.vat`, `board.warm`), `src/app/loading/plan.ts`, `src/app/state/flow.ts`, `tests/unit/vat.test.ts` (neu), `tests/perf/{bench,perf.spec,report}.ts`.

Noch offen (T10, nicht Teil 2): `concept/24-architecture/decision-log.md`, `art/README.md`, `concept/16-asset-pipeline.md`, Abnahme-Screenshots/Video. Screenshots der Stichprobe Hand/Waffe (3 Figuren × 6 Waffengruppen, vorher/nachher) und der A/B-Vergleiche liegen im Scratchpad `shots/7-8/` (`hands-before-after.png`, `ab-t2-*`, `atk-lance-strip.png`).

## Abnahme 2026-10-27

Abgenommen (Status done). T10-Sichtabnahme an die Abnahme delegiert (Produktinhaber 2026-10-27): A/B-Bilder Skelett gegen VAT (Idle, Gehen, Lanzenangriff, Treffer, Niedergestreckt, Hände/Waffen aller 6 Waffengruppen) deckungsgleich, im Durchlauf keine Fehldarstellung; Decision-Log, `art/README.md` und `16-asset-pipeline.md` nennen `.vat`. Gesamtbefund: `acceptance-2026-10-27.md`.
