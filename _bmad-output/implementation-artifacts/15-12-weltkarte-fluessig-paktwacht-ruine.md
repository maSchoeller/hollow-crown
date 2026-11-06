# Story 15.12: Weltkarte flüssig auf dem Handy, Paktwacht als Ruine

Status: review

## Story

Als Spieler
möchte ich die Weltkarte auf dem Handy ruckelfrei ziehen und zoomen und die Paktwacht zu Beginn als Ruine sehen,
damit die Karte sich gut anfühlt und zur Geschichte passt.

Folge-Story zu 15.7 nach dem Handy-Test des Produktinhabers am 2026-11-06: Die Karte ruckelt sehr stark. Sein Vorschlag: die Karte vorab zu einem Bild zusammenfügen und nur die Gebäude darauf setzen. Die Burg (Paktwacht) ist ausgebaut zu sehen, soll zu Beginn aber eine Ruine sein. Das „P“ und der Rest der Karte passen.

## Acceptance Criteria

1. **Messung vorher:** Die Ursache des Ruckelns ist gemessen (Chrome-Performance-Profil, CPU 4× bis 6× gedrosselt, Viewport 375 × 812 mit DPR 3): Texturgrößen, Zahl der Ebenen und Draw Calls bzw. Composited Layers, Nebel-Overlay, Preact-Re-Renders beim Ziehen und Zoomen, skaliert statt passend geladene Bilder. Die Werte stehen unten unter „Messung“.
2. **Grundbild in Auflösungsstufen:** Die Karte wird als ein vorab zusammengefügtes Grundbild ausgeliefert, in passenden Auflösungsstufen (Übersicht und Nah); geladen wird die Stufe, die zur Zoomstufe und Pixeldichte passt. Darauf liegen nur die Stadtbilder als einzelne Sprites. Weicht die Messung vom Vorschlag ab, gilt das wirksamste Vorgehen, kurz begründet.
3. **Flüssig:** Ziehen und Zoomen laufen gedrosselt (CPU 4×, 375 × 812) ohne lange Frames (kein Frame über 50 ms im Ziehen, Median nahe 16,7 ms); auf dem Referenzgerät Ziel 60 fps (Prüfung durch den Produktinhaber).
4. **Scharf und Budget:** In der Nah-Stufe höchstens rund 1,1-fach hochskaliert wie in 15.7; `pnpm build` hält das Paket-Budget; die Weltkarte bleibt im Paket `act1` auf Abruf.
5. **Paktwacht als Ruine:** Ab Spielbeginn zeigt das Plateau der Paktwacht eine Ruine (neues Stadtbild, Stil der vorhandenen Stadtbilder, nach `licensing.md` §6, Prompt und Abnahme in `art/prompts/<id>.md`). Die ausgebaute Burg (`paktwacht_v3`) ist eine Zustandsvariante über `site.variants`, die erst mit der Burgstufe erscheint. Das Grundbild enthält keine ausgebaute Burg.
6. **Unverändert:** Das „P“ (Prolog in Aurenhall), die übrigen Stadtbilder, Steine, Nebel-Regionen und die Lage aller Orte bleiben wie in 15.7.
7. **Entscheidung im Art-Decision-Log:** Paktwacht ab Spielbeginn Ruine, ausgebaut erst später, Zustandsvarianten zumindest für die Paktwacht; weitere Orte (Erlbach verbrannt, Aurenhall belagert) offen beim Produktinhaber, bleiben beim Grundbild.
8. **Belege:** Screenshots bei 375 × 812 (stumm): Karte zu Beginn mit Ruine, Karte mit ausgebauter Burg, nah gezoomt.

## Tasks / Subtasks

- [x] Messung vorher (AC 1) und Befund unten eintragen.
- [x] Build (AC 2, 4): `tools/art/build.py build_world` schreibt Auflösungsstufen des Grundbilds statt 3 × 3 Kacheln.
- [x] Bildschirm (AC 2, 3): `WorldMap.tsx`/`.css` – eine Bildebene je Stufe, Nebel ohne teuren Filter bzw. vorgerendert, keine Layout-Arbeit pro Frame.
- [x] Bedingung `castleTier` (AC 5): Kern-Vokabular der Bedingungen, Schema, `content:check`, Unit-Test.
- [x] Ruine (AC 5): Bild per ChatGPT über Claude in Chrome, Prompt/Abnahme `art/prompts/paktwacht_ruin_site.md`, `map_places_v5.json`/`valmora.yaml` (Grundbild Ruine, Variante ausgebaut).
- [x] Doku (AC 7): Art-Decision-Log, Art Direction §6, Architektur §5.12, falls betroffen.
- [x] Messung nachher, Screenshots (AC 3, 8), `pnpm check`, Code-Review.

### Review Findings

Code-Review 2026-11-06 (Blind Hunter, Edge Case Hunter, Verification Gap, Acceptance Auditor): 0 `decision-needed`, 14 `patch` (alle behoben), 2 `defer`, 9 verworfen.

- [x] [Review][Patch] Gewählte Auflösungsstufe nur im Helfer getestet; Rechnung als `levelFor` in `worldMapView.ts`, Test „DPR 1–3 höchstens 1,1-fach, DPR 3 volle Quelle“ [src/app/screens/WorldMap.tsx]
- [x] [Review][Patch] Stufe nach Drehen/Vergrößern nicht neu bestimmt; `ResizeObserver` hebt sie an, nie zurück [src/app/screens/WorldMap.tsx]
- [x] [Review][Patch] `layOut` mit eigener Formel statt `screenOf`; jetzt `screenOf` mit Ursprung, Test für Ebene + Versatz [src/app/screens/WorldMap.tsx]
- [x] [Review][Patch] Ohne Schärfe-Stufe blieb der Ladehinweis bei fehlender Übersicht ewig „lädt“ [src/app/screens/WorldMap.tsx]
- [x] [Review][Patch] Neue Steine nach einem Render einen Frame am Ursprung; `useLayoutEffect` [src/app/screens/WorldMap.tsx]
- [x] [Review][Patch] Klick nach dem Ziehen ohne Regressionstest; e2e in `haunt.spec.ts` (Karte bleibt nach Maus-Zug offen) [tests/e2e/haunt.spec.ts]
- [x] [Review][Patch] Alte Kacheln blieben in `public/assets/world` und im Manifest; `build_world` räumt sie weg [tools/art/build.py]
- [x] [Review][Patch] Varianten-Id ohne Prüfung (gleich einer Orts-Id überschreibt deren Bild); Build bricht ab [tools/art/build.py]
- [x] [Review][Patch] Mess-Werkzeug: `--rate` ohne Wert ergab NaN, Layout-Anteil langer Frames falsch ohne Layout [tools/art/worldmap-perf.mjs]
- [x] [Review][Patch] AR13 in der Architektur veraltet [concept/24-architecture/architecture.md]
- [x] [Review][Patch] Burgstufe 1 als Schwelle in Art Direction und YAML als entschieden formuliert; jetzt [ASSUMPTION], Frage an den Produktinhaber; Stufen 1–2 ohne eigenes Bild als offen notiert [concept/23-art-direction/]
- [x] [Review][Patch] Paketgröße und Budget nicht belegt; Zahlen in Art Direction §6 und Art-Log [concept/23-art-direction/]
- [x] [Review][Patch] Story-Protokoll leer, Median und Phasen fehlten in der Messung [diese Datei]
- [x] [Review][Patch] Kein Bild „Burg als Heimat, Paktwacht noch Ruine“; `15-12-belege/ruine-heimat-burg-m1_7-*.jpg`
- [x] [Review][Defer] Zoom-Gleiten setzt Steine je Frame neu (Layout während ~260 ms) — deferred: bei 6× ohne langen Hauptthread-Frame; erst angehen, wenn der Handy-Test Zoomruckeln zeigt
- [x] [Review][Defer] Mess-Werkzeug nicht in AGENTS.md „Ausführen und prüfen“ — deferred: Agenten-Kontextdatei, gesondert pflegen

**Verworfen:** Nebel-Canvas zeichnet bei Mount nach dem Effekt nicht (false: Canvas und Effekt entstehen im selben Render, der Akt wechselt auf der Karte nicht); `cssColor` fällt auf Weiß (false: berechnete Farbe ist immer `rgb()`); `castleTier` `.max(3)` statt `tierAt.length` (low, vier Stufen sind Art Direction §7); Varianten nur yaml → json geprüft (low); `ROOMS` ungeprüft im Screenshot-Werkzeug (low, Entwicklerwerkzeug); Doppelpfad `castle.ts`/`camp.ts` (low, Re-Export hält bestehende Importe); Maus statt Touch im Messwerkzeug (low, beide laufen über dieselben Pointer-Handler; Touch prüft der Produktinhaber); Nebelkante vorher/nachher ohne Bildvergleich (low, Belege zeigen den Rand); Modellversion/Terms im Prompt-Protokoll (low, wie bei allen bisherigen ChatGPT-Protokollen; A5 läuft außerhalb des Repos).

## Dev Notes

- **Heute (15.7):** `.wm__picture` ist ein 3276 × 3276 CSS-px großer Block mit `will-change: transform`, per `translate + scale` bewegt. Darin: Übersichtsbild `valmora.webp` (1024 px) auf volle Größe gestreckt, darüber 9 Kacheln à 1092 px, 12 Stadtbilder, Nebel als SVG mit `feGaussianBlur` über die ganze Fläche. Steine, Pfade und Regionsnamen liegen außerhalb in `.wm__world` und werden in `apply()` pro Frame per `left/top` bzw. SVG-Attributen nachgezogen (Layout pro Frame).
- **Paktwacht:** Das Grundbild `map_v5.png` zeigt an der Paktwacht nur das leere Plateau; die ausgebaute Burg ist das Stadtbild `art/world/sites/paktwacht_v3.png`. Retusche des Grundbilds ist also nicht nötig; die Ruine wird das neue Grundstadtbild, `paktwacht_v3` die Variante.
- **Burgstufe:** `castleTier(data, c)` in `src/core/campaign/camp.ts` (Schwellen `castle.tierAt` in `balance.yaml`); Art Direction §7: Stufe 0 = Ruine, Akt 1 zeigt nach 1-6 die Burg als Ruine, Ausbau ab Akt 2. Daher erscheint die ausgebaute Burg ab Burgstufe 1.
- **Varianten:** `siteImage(place, ctx, missing)` in `worldMapView.ts`: erste zutreffende Variante, sonst Grundbild; fehlt die Variante, Rückfall aufs Grundbild.
- **Nicht anfassen:** Lage der Orte, Steine, Nebel-Polygone, `campaign.yaml`; parallel laufen 15.6 (Szenen, `kael` → `lucan`) und der Abgleich 15.1–15.5.

### Project Context Rules

- Werte in YAML, Zod-Schema für neue Felder, kein sichtbarer Text im Code; `src/core` ohne DOM; `worldMapView.ts` bleibt rein und getestet.
- PNGs unter `art/` in Git LFS; neue Bilder nach `licensing.md` §6.
- Fertig erst mit `pnpm check` grün; Spiel beim Testen stumm.

### References

- `concept/26-epics/epics/epic-15.md` Story 15.12, Story 15.7 (`15-7-weltkarte-v5-einbinden.md`)
- `concept/23-art-direction/art-direction.md` §6 und §7, `decision-log.md` 2026-11-05 (Weltkarte v5), `licensing.md` §6
- `concept/25-ux/DESIGN.md` (map-node, Ebenen), `concept/24-architecture/architecture.md` §5.12

## Messung

**Aufbau:** `node tools/art/worldmap-perf.mjs --rate <4|6>` gegen den Dev-Server: Chromium (Playwright, headless), 375 × 812 mit DPR 3 und Touch, CPU per DevTools-Protokoll 4× bzw. 6× gedrosselt, Spiel stumm. Kampagne bis 1-2, Weltkarte, dann 4 Züge mit Nachgleiten, 5 Zoomschritte, 2 Züge in der Nah-Stufe, Tipp auf einen Stein. Gemessen: Abstand jedes Frames (rAF), Long Animation Frames, Layout/Stil aus `Performance.getMetrics`, Chrome-Trace (Paint, Commit, Raster), Ebenen und dekodierte Bilder. Die Drossel trifft nur den Hauptthread; Raster und GPU laufen in voller Rechnergeschwindigkeit (headless mit Software-GPU), das echte Handy prüft der Produktinhaber.

| | vorher 4× | nachher 4× | vorher 6× | nachher 6× |
|---|---|---|---|---|
| Frames über 50 ms | **33** | **1** (Tipp auf Stein) | **270** | **5** (3 Zoom, 2 Tipp) |
| Frames über 33 ms | 81 | 4 | 400 | 17 |
| längster Frame | 283 ms | 183 ms | 1 383 ms | 317 ms |
| Median Frame | 16,7 ms | 16,7 ms | 16,7 ms | 16,7 ms |
| p95 Frame | 16,9 ms | 16,8 ms | 83,3 ms | 16,8 ms |
| davon beim Ziehen über 50 ms | (nicht getrennt, Layout in jedem Zug-Frame) | 0 | (nicht getrennt) | 0 |
| Long Animation Frames | 27 (max 277 ms) | 2 (max 186 ms) | 223 (max 1 414 ms) | 5 (max 281 ms) |
| Layout (Anzahl / Zeit) | 358× / 834 ms | 54× / 174 ms | 265× / 1 665 ms | 33× / 186 ms |
| Stil-Neuberechnung | 1 650 ms | 518 ms | 4 013 ms | 675 ms |
| Paint (Trace) | 2 730 ms | 259 ms | 7 393 ms | 372 ms |
| Commit (Trace) | 1 913 ms | 1 319 ms | 5 915 ms | 2 206 ms |
| Raster (Trace) | 179 ms | 15 ms | 175 ms | 13 ms |
| Bilder / dekodiert | 24 / 46,7 MB | 16 / 42,8 MB | | |

**Befund vorher (woher das Ruckeln kam):**

1. **Layout und Paint bei jedem Frame:** Beim Ziehen setzte `apply()` für jeden Stein, jeden Regionsnamen und jede Wegelinie `left/top` bzw. SVG-Attribute neu. Das löste je Frame Stil, Layout, Prepaint und ein Neuzeichnen der ganzen HTML-Ebene in voller Bildschirmgröße aus (358 Layouts, 2,7 s Paint bei 4×). Das ist der Hauptteil.
2. **Nebel als SVG mit `feGaussianBlur`** über die ganze 3276-px-Bildebene: teuer zu rastern, bei jedem Maßstabswechsel erneut.
3. **Zehn übereinanderliegende Bilder:** Übersicht (1024 px auf 3276 gestreckt) und 9 Kacheln blieben gleichzeitig im Bild, 46,7 MB dekodiert; die Übersicht wurde nie ausgeblendet.
4. **Preact-Re-Renders beim Ziehen und Zoomen:** keine (Ansicht über Refs, kein State). Aber: ein Maus-Klick auf die freie Karte nach einem Zug löste `choose(null)` aus (Re-Render und Zurückgleiten), weil der Schutz nur für Kinder der Fläche galt.
5. Bilder in passender Auflösung: die Kacheln lieferten bei DPR 3 die richtige Auflösung; bei kleinerer Pixeldichte wurde trotzdem die volle Quelle geladen.

**Umsetzung und Begründung:** Der Vorschlag des Produktinhabers (ein Grundbild in Stufen, nur die Gebäude als Sprites) ist umgesetzt, behebt aber allein nur Punkt 3 und 5. Die Messung zeigte Punkt 1 als größte Last, deshalb zusätzlich: Die HTML-Ebene wird beim Ziehen nur noch als Ganzes per Transform verschoben, Steine und Wege werden nur bei einem Maßstabswechsel neu gesetzt; der Nebel ist eine kleine weichgezeichnete Maske (160 × 160) in einem gestreckten Canvas; der Klick nach dem Ziehen ist abgefangen.

**Grenzen der Messung:** Die Züge laufen als Maus-Pointer-Events (dieselben Handler wie Touch); Pinch-Zoom und das echte Rastern auf der Handy-GPU prüft der Produktinhaber auf dem Gerät. Die Vorher-Läufe zählen Frames bis zum Ende des Traces mit, daher die höhere Gesamtzahl.

**Rest:** Ein langer Frame beim Antippen eines Steins (die Missionskarte rendert, einmalig, nicht beim Ziehen) und bei 6× kurze Wartezeiten beim Zoomen auf Raster/GPU (kein Long Animation Frame, also nicht der Hauptthread). Ziehen hat bei 4× und 6× keinen Frame über 50 ms mehr.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Umgesetzt 2026-11-06: Grundbild in Stufen (1024/2048/3276, `levelFor`), Ziehen nur per Transform, Nebel als Canvas-Maske (`fogMask`), Klick nach dem Ziehen abgefangen, Bedingung `castleTier`, Paktwacht-Ruine mit Variante `paktwacht_built` ab Burgstufe 1 [ASSUMPTION].
- Das Grundbild enthielt die ausgebaute Burg nie (sie war das Stadtbild `paktwacht_v3`), daher keine Retusche nötig.
- `pnpm check` grün (1374 Tests vor dem Review), `act1` 35,8 von 40 MB.
- Belege: `15-12-belege/` (Ruine zu Beginn, nah an der Ruine, Burg als Heimat noch Ruine, ausgebaut ab Burgstufe 1 per gesetztem Raum-Ausbau, Übersicht).

### File List

- `tools/art/build.py`, `tools/art/worldmap-perf.mjs` (neu), `tools/art/worldmap-shots.mjs`
- `art/world/map_places_v5.json`, `art/world/sites/paktwacht_ruin.png` (neu), `art/world/v5/paktwacht_ruin_chatgpt.png` (neu), `art/prompts/paktwacht_ruin_site.md` (neu)
- `content/world/valmora.yaml`, `content/core/render.yaml`
- `src/core/campaign/castle.ts` (neu), `src/core/campaign/camp.ts`, `src/core/campaign/conditions.ts`, `src/core/storyDefs.ts`, `src/core/renderDefs.ts`, `src/content/schemas.ts`
- `src/app/screens/WorldMap.tsx`, `src/app/screens/WorldMap.css`, `src/app/screens/worldMapView.ts`
- `tests/unit/world-map.test.ts`, `tests/unit/story.test.ts`, `tests/e2e/haunt.spec.ts`
- `concept/23-art-direction/art-direction.md`, `decision-log.md`; `concept/24-architecture/architecture.md`, `decision-log.md`; `concept/26-epics/epics/epic-15.md`, `index.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`, `15-12-belege/`
