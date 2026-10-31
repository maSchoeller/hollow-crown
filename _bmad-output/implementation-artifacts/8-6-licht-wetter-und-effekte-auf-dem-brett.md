# Story 8.6: Licht, Wetter und Effekte auf dem Brett

Status: done

## Story

Als Spieler
möchte ich ein warmes, lebendiges Diorama mit klaren Effekten,
damit Kämpfe schön und trotzdem lesbar sind.

## Acceptance Criteria

Grundlage ist `concept/26-epics/epics/epic-08.md` Story 8.6 und `concept/23-art-direction/art-direction.md` §2.1, §2.4, §2.5, §3, §5.4, §8. Die Punkte unten präzisieren sie nach den Entscheidungen des Produktinhabers vom **2026-10-26** (Eintrag in `concept/23-art-direction/decision-log.md`). Wo etwas in „Offene Fragen“ steht, ist es **nicht** entschieden: nicht raten, nachfragen.

1. **Karten-Felder:** `mapSchema` bekommt die optionalen Felder `timeOfDay` (`morning` | `noon` | `evening` | `night`) und `weather` (`clear` | `rain` | `fog` | `ash` | `snow`); `MapDef` führt sie als optionale Felder. **Fehlen beide, ist das Bild unverändert zu heute** (kein Voreinstellungs-Licht, keine Teilchen, kein Nebel). Unbekannte Werte lehnt das Schema ab. Diese Story legt nur Schema und Voreinstellungen an; die Werte in den Karten setzen die Inhalts-Sitzungen (siehe „Karten setzen“ in den Dev Notes).
2. **Voreinstellungen in `content/core/render.yaml`** (Zod-Schema `renderSchema`, `RenderDef`): Tageszeiten (Sonne, Umgebungslicht, Himmel, Figuren-Untergrenze, Rim-Licht), Wetter (Wirkung, Teilchenzahlen je Qualitätsstufe, Akte) und Jahreszeiten je Akt (Tönung, Sonnenhöhe). Vorrang: **die Voreinstellung ist die Basis, `ambient` und `sun` der Karte überschreiben sie Feld für Feld.** Die Jahreszeit des Akts gilt zusätzlich über jeder Tageszeit.
3. **Tageszeiten (§2.5):** `morning` kühles weiches Licht von Osten mit langen Schatten, `noon` neutral-warm von oben mit kurzen Schatten, `evening` goldorange von Westen mit langen Schatten und violettem Himmel, `night` blaues Mondlicht, Punktlichter (Fackel, Feuer, Fenster) tragen. Die **Untergrenze der Helligkeit** (morning 85 %, noon 100 %, evening 80 %, night 60 %) gilt für **Figuren, nicht für die Landschaft**.
4. **Teamfarben, Ringe, Markierungen ungelit:** Das Teamtuch (Schlüssel K0–K3 in Vertex-Alpha) wird **ungelit** (eigene Farbe, nicht vom Szenenlicht gefärbt); Bodenringe sind es schon, Markierungen (Overlays) bleiben es. Ring- und Tuchfarben wechseln auf die Werte aus Art Direction §2.1 (Spieler `#2F64C8`, Gegner `#B83A2E`, Dritte `#3FA65A`, Rampen dort). **Nachts** bekommen Figuren ein schwaches Rim-Licht. Die sichtbare Änderung wird mit Vorher/Nachher-Screenshots belegt und vom Produktinhaber abgenommen.
5. **Wetter, Umfang Akt 1 komplett:** `clear` (nichts); `rain` (Regenstriche, nasser Glanz auf Blöcken, Pfützen **falls im Budget machbar**: Messung entscheidet, Ergebnis wird berichtet); `fog` (Bodennebel zwischen den Blöcken, weiche Fernsicht); `ash` (fallende Ascheflocken, leicht grauer Himmel); `snow` (**nur Flocken**, Schneehauben kommen mit Akt 3).
6. **Teilchen je Qualitätsstufe:** `high` volle Zahl, `mid` die Hälfte, `low` aus (auf `low` bleiben nur Licht und Himmel des Wetters). Zahlen in `render.yaml`. Gemessen wird auf `mid`.
7. **Jahreszeit je Akt (§2.4):** leichte Tönung und Sonnenhöhe je Akt in `render.yaml`; Akt 1 Spätsommer warm-golden. Die Bäume je Akt (`board.trees`) bleiben wie sie sind.
8. **Krit (§8, §5.4):** Bei **jedem** Krit (Spieler und Gegner) gleitet ein diagonales Band mit Porträt in Stimmung `angry` (ohne Porträt: Buchstaben-Medaillon wie sonst im Spiel), Speedlines in Elementfarbe und Skill- bzw. Angriffsname ins Bild; dann **80 ms Freeze**, großer Treffer-Stern, Bildschirmwackeln, Schadenszahl doppelt so groß. Gesamtdauer **≤ 600 ms bei 1×**, bei 2× und in der Gegnerphase verkürzt, im Überspringen-Modus ohne Cut-in, Freeze und Wackeln.
9. **Statussymbole:** Über jeder Figur mit Status zeigt das Brett gemalte Round-Chibi-Symbole für alle Status des Inhalts (Liste in den Dev Notes), erzeugt per ChatGPT nach `licensing.md` §6 (Prompt und Abnahme in `art/prompts/`), ausgeliefert im Paket `act1`, nicht in `core`.
10. **Tod in Asche:** Eine fallende Einheit (`died`) löst sich in Ascheflocken mit Glutpunkten auf, dazu ein kurzes Wackeln. Der Glockenschlag kommt mit Story 8.8, **nicht** hier. Leutnant-Flucht (Rückwärtssprung, Rauchwölkchen, Wimpel fällt) bleibt, innerhalb des Zeitrahmens.
11. **Wackeln:** nach §8 bei Krit, Tod und (später) Drachenauftritt; schaltbar über `settings.shake` und aus bei `prefers-reduced-motion`.
12. **Zeitrahmen:** Alle Effekte aus §8 (Cartoon-Treffer, Elemente, Status, Krit mit Cut-in, Leutnant-Flucht, Tod in Asche) laufen **≤ 600 ms bei 1×** (Messung: Abschnitt „Zeitleiste“; Deutung des Wortlauts: Offene Frage 4).
13. **Leistung:** Die Gegnerphase der Referenzschlacht (`PERF_GPU=1 pnpm perf`, Qualität `mid`, 24×32, 40 Einheiten) verschlechtert sich gegenüber dem Stand nach 7.7 nicht (Thread-CPU je Frame, Draw Calls, max-Frame); Stand heute: Thread-CPU 5,3 ms je Frame bei 2×, Budget 8,3 ms (60 FPS bei 2×, 30 FPS bei 4×). Neue Materialien, Shader-Plug-ins und Teilchensysteme werden beim Laden **vorkompiliert**, keine Spitzen beim ersten Gebrauch. Messung zusätzlich mit Nacht und Regen.
14. **Prüfungen:** `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün (Bundle-Budget!); `pnpm art:build` baut die Statussymbole.

## Tasks / Subtasks

- [x] T1 Schema, Typen, Voreinstellungen, Auflösung (AC 1, 2, 7)
  - [x] `src/core/defs.ts`: `TimeOfDay`, `Weather` (Listen einmal definieren, vom Schema importiert), `MapDef.timeOfDay?`/`weather?`; `RenderDef.look` (Form: „Vorschlag render.yaml“)
  - [x] `src/content/schemas.ts`: `mapSchema` (`z.enum`, optional), `renderSchema` (neuer Block mit Standardwerten, die nichts ändern); beide Schemas sind **nicht strikt** und werfen unbekannte Schlüssel stillschweigend weg, also Block im Schema **und** in `RenderDef` führen
  - [x] `content/core/render.yaml`: Voreinstellungen (Werte als Startwerte [C] markieren)
  - [x] Neue reine Funktion `src/render/shared/look.ts` (`resolveLook(render, map)`): Basis Tageszeit → Karten-`ambient`/`sun` feldweise darüber → Jahreszeit des Akts zuletzt; Ergebnis = alles, was die Szene braucht (Licht, Himmel, Figuren-Untergrenze, Rim, Nebel, Wetter-Teilchen). Ohne `timeOfDay` und `weather`: Ergebnis wie `applyLight` heute
  - [x] `tools/content-check.ts`/`src/content/validate.ts`: Wetter gegen den Akt der Karte prüfen (Tabelle in `render.yaml`, nicht im Code); Fehler oder Warnung: Offene Frage 1
- [x] T2 Licht anwenden (AC 2, 3, 7)
  - [x] `board.ts` `applyMapLight`: `resolveLook` statt `applyLight(map.ambient, map.sun)`; `clearColor` (Himmel) aus dem Ergebnis statt der festen Farbe (Z. 206); Punktlicht-Verstärkung nachts auf die vorhandenen `PointLight`s (Z. 690), `lightsMax` je Qualitätsstufe bleibt
  - [x] Figuren-Untergrenze: siehe „Licht nach Babylon“; gilt nur für Figuren
  - [x] Schattenkarte neu rendern, wenn sich die Sonne ändert (`refreshShadows`, Story 7.7); Schatten bleiben statisch
- [x] T3 Teamfarben, ungelites Tuch, Rim (AC 4)
  - [x] Teamfarben aus Art Direction §2.1 nach `render.yaml` (`look.teams`), `TEAM_RAMP` (`models.ts`) und `RING_COLOR` (`board.ts` Z. 103) lesen sie von dort
  - [x] Teamtuch ungelit: Ansatz laut „Ungelites Tuch“; die Tuch-Maske darf `teamColours` nicht mehr verwerfen
  - [x] Rim-Licht nachts nur auf Figuren; Untergrenze nur auf Figuren
  - [x] Vorher/Nachher-Screenshots (Tuch und Ringe, gleiche Karte, gleiche Kamera) **vor** dem ersten Umbau aufnehmen
- [x] T4 Wetter (AC 5, 6, 13)
  - [x] `src/render/board/weather.ts`: Wetter als Einheit mit `apply(look, quality)`, `follow(camera)`, `dispose()`; ein Teilchensystem je Wetter (Regen, Asche, Schnee), Emitter-Quader über dem sichtbaren Ausschnitt, nur bei Kamerabewegung nachgeführt
  - [x] Nebel: Szenennebel für die weiche Fernsicht plus Bodennebel zwischen den Blöcken (Details: „Wetter nach Babylon“)
  - [x] Regen: nasser Glanz auf Gelände (Specular der Gelände-Materialien), Pfützen als Thin Instances, wenn das Budget es zulässt (Entscheidung nach Messung, in den Completion Notes)
  - [x] Qualität: Zahlen aus `render.yaml`; `low` ohne Teilchen
  - [x] Ringe, Markierungen und Tuch ohne Nebel/Wetter-Tönung (`fogEnabled = false` dort; Offene Frage 6)
- [x] T5 Krit mit Cut-in (AC 8, 11, 12)
  - [x] Neue Komponente `src/app/screens/CutIn.tsx` + `cutin.css` (Band, Porträt `angry` über die Halbfiguren-Auswahl `pickHalf`/`artId`, Medaillon als Rückfall, Speedlines in Elementfarbe, Name); eingehängt über einen neuen Hook `BoardHooks.onCutIn` (das Brett kennt keine UI)
  - [x] `board.ts` Fall `strike`: Zeitleiste „Krit“, Freeze (80 ms, Figuren und Effekte stehen), Stern, Wackeln, doppelte Schadenszahl; Wackeln auch bei Tod (T7)
  - [x] Reine Funktion `src/render/board/critTimeline.ts` (Zeiten aus `render.yaml`, nicht im Code) + Unit-Test
  - [x] `hit_star_crit` braucht eine höhere Bildrate (5 Bilder bei 12 fps = 417 ms), sonst reicht die Zeitleiste nicht: `tools/art/fx.py` `ANIMS` und `pnpm art:build`
- [x] T6 Statussymbole (AC 9)
  - [x] Bilder per ChatGPT, Prompt und Abnahme in `art/prompts/status_icons.md` (Felder nach `licensing.md` §6 A2: Dienst, Tarif und Konto zum Erzeugungsdatum, Prompt, Referenzen, Iterationen, Ablage des Originals, menschlicher Anteil); Master `art/status/<id>.png`
  - [x] `tools/art/build.py`: `build_status()` → `public/assets/act1/status/<id>.webp`; Manifest nennt sie (Muster `models.unitPacks`, Story 8.2); Paket `act1` nimmt sie über `act1/**`
  - [x] Symbole über der Figur als DOM-Overlay nach dem Muster der Verblutungs-Zähler und Wimpel (`bleedLabels`, `pennants`), Position über `screenOfWorld`, nur bei Änderung neu aufgebaut
  - [x] `content:check` meldet Status ohne Bild (Muster Item-Bilder, Story 8.5; Warnung wie bei fehlenden Sprites, solange die Bilder im Entstehen sind)
- [x] T7 Tod in Asche, Flucht, Zeitrahmen aller Effekte (AC 10, 11, 12)
  - [x] Fall `died`: statt `smoke` + 500-ms-Verblassen ein Ascheflocken-Stoß mit Glutpunkten (ein vorgehaltenes, wiederverwendetes Teilchensystem, kein Neuaufbau je Tod), Verblassen nach oben, kurzes Wackeln
  - [x] Zeitrahmen-Prüfung aller §8-Effekte (Tabelle „Zeitleiste“): `smoke` dauert 750 ms (6 Bilder bei 8 fps) und liegt damit über 600 ms: Bildrate in `fx.py` anheben
  - [x] Test, der die Effektdauern aus `art/fx/fx.json` und `render.yaml` prüft
- [x] T8 Vorkompilieren und Leistung (AC 13)
  - [x] `BoardView.precompile`: Plug-in-Variante des Figurenmaterials, Wetter-Teilchen, Cut-in-Stoß/Ascheflocken-System, Nebel-/Pfützen-Materialien einmal anspielen und wieder entfernen (Nachweis: neu kompilierte Effects in der Gegnerphase = 0)
  - [x] `tests/perf`: Messvarianten Nacht und Regen (Bench-Karte mit `timeOfDay`/`weather`, z. B. `PERF_LOOK=night,rain`), Vorher/Nachher in `report.md`
  - [x] Draw Calls der Referenzschlacht nicht über dem Stand vor der Story (heute 36)
- [x] T9 Abnahme und Doku (alle AC)
  - [x] Screenshots laut Liste an den Produktinhaber (Memory: Screenshots senden)
  - [x] Eintrag in `concept/24-architecture/decision-log.md` (Plug-in, Teilchen-Zahlen, Messwerte); `art-direction.md` §2.5 nennt `content/render.yaml`, die Datei heißt `content/core/render.yaml`; §8 und §5.4 an die entschiedenen Zeiten angleichen
  - [x] `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün

## Dev Notes

### Quellen

`concept/26-epics/epics/epic-08.md` Story 8.6; `concept/23-art-direction/art-direction.md` §2.1 (Teamfarben), §2.4 (Jahreszeiten), §2.5 (Tageszeit und Wetter), §3 (Diorama, Licht), §5.1 (Porträts, Stimmungen), §5.4 (Cut-ins), §8 (Effekte); `concept/23-art-direction/decision-log.md` (Einträge 2026-10-23 „Licht“, „Cut-ins“, „Teamfarbe auf dem Brett“, „Teamtuch per Schlüsselfarbe“; 2026-10-24 „Keine Echtzeitschatten der Figuren“; **2026-10-26 diese Story**); `concept/24-architecture/architecture.md` §5.12 (Rendering, `season.ts`) und §10 (Leistung, NFR1); `concept/23-art-direction/licensing.md` §6 (A1–A14, Pipeline-Auflagen für KI-Bilder); `concept/25-ux/EXPERIENCE.md` Z. 141/144 (Angriff ≤ 600 ms, Wackeln nur bei Krit, Tod, Drache); Story 7.7 (Leistungsbudget) und 8.10 (Verblassen, Muster für Render-Werte); `AGENTS.md`.

### Ist-Zustand (gelesen am 2026-10-26, nicht raten, vor dem Umbau erneut prüfen)

- **Es gibt weder `timeOfDay` noch `weather` noch Jahreszeit-Voreinstellungen.** Die Jahreszeit wählt nur die Bäume (`board.trees` je Akt, `treeSetOfAct` in `src/render/shared/scenery.ts`). `MapDef.act` setzt der Lader aus dem Ordner. Karten tragen freies `ambient`, `sun`, `lights` (`mapSchema` `src/content/schemas.ts` ab Z. 325, `MapDef` `src/core/defs.ts` ab Z. 404). Act-1-Karten setzen sie heute einzeln (z. B. `m1_4_wolfslager`: `#3a4a7a`/0,55, Sonne `#9fb4ff`/0,45; `ch01_varnhold`: Abendrot).
- `src/render/shared/season.ts` enthält **nur** `applyLight(hemi, sun, ambient, sun)` (Hemisphärenlicht = Karten-`ambient` mit Intensität × 0,6 und Bodenfarbe × 0,35; Sonne aus Kompasspeilung und Höhe, `specular` 0,2). Die Architektur (§5.12) nennt die Datei „Jahreszeit/Tageszeit/Wetter aus render.yaml“: das ist der Ort für die Auflösung oder für `look.ts` daneben.
- `board.ts`: `HemisphericLight` und `DirectionalLight` Z. 213 f., `applyMapLight` Z. 273, feste Hintergrundfarbe `scene.clearColor = (0.06, 0.07, 0.11)` Z. 206, Punktlichter aus Karten-`lights` und Feuern bis `lightsMax` Z. 690 (`PointLight`, `specular` 0), `ShadowGenerator` mit statischer Karte (`REFRESHRATE_RENDER_ONCE`, Story 7.7), `refreshShadows` Z. 268.
- **Kein Szenennebel, kein Glow, kein Postprozess** in der Szene. Der Begriff „fog“ steht im Code für den **Nebel des Krieges** (`MapDef.fog: boolean`, `overlays.ts`, Story 2.6): das Wetter `fog` ist etwas anderes, Bezeichner klar trennen (z. B. `mist`/`groundFog` im Code, `fog` nur als YAML-Wert des Wetters).
- Ringe: `src/render/board/rings.ts`, Thin Instances, `disableLighting`, `emissiveColor` (ungelit), Farben aus `RING_COLOR` in `board.ts` Z. 103 (`#3d7be0`, `#d9413a`, `#3fa65a`), **weicht von §2.1 ab** (`#2F64C8`, `#B83A2E`, `#3FA65A`). Deckkraft 0,5 bzw. 0,25 bei erschöpft; Art Direction nennt 60 % und gestrichelt (nicht Teil dieser Story).
- Teamtuch: `TEAM_RAMP` (`src/render/shared/models.ts` Z. 30: `16285a 2a52b0 3d7be0 8fbaf5` usw., **weicht von §2.1 ab**: `1E3F86 2F64C8 5C8EE6 A9C6F4`). `teamColours(mesh, team)` liest die Vertex-Farben der glTF, schreibt den Schlüssel (`a = (k+1)/8`, `a < 0,9`) als Rampenfarbe und setzt **Alpha auf 1 und `hasVertexAlpha=false`**: die Maske geht dabei verloren. Das Material (`figureMaterial`, `StandardMaterial`, matt, `specularColor` 0,06) ist **gelit**, also färbt Sonne, Hemisphäre und Punktlicht das Tuch mit. Tripo-Figuren: Tuch in der Textur Hellgrau `CLOTH_GREY = 0,85`, Schlüssel immer K2 (`tools/art/prepare_tripo_unit.py`); Blender-Figuren: K0–K3. `TEAM_RAMP` benutzt auch der Sprite-Austausch in `figures.ts` Z. 193 (2D-Alternative, D4).
- Material-Teilung (Story 7.7): ein Material je (Textur, Tönungsstufe) pro Szene (`sharedFigureMaterial`), Tönung nur bei Änderung (`ModelFigure.tint`). Ein Plug-in am Material gilt damit für alle Figuren auf einmal, nicht je Einheit.
- Effekte: Sprite-Blätter `art/fx/fx.json` (`tools/art/fx.py`, Zelle 48 px, 15 Zeilen), gespielt über `spawnFx`/`makeFx` (Billboard-Ebene, `renderingGroupId 1`, ein Material und eine Textur-Kopie **je Effekt**, `disposeFx`); Abspielgeschwindigkeit bei 2× × 1,6. Zusätzlich Feuer als `ParticleSystem` (CPU, Z. ~670). Das Wackeln gibt es **nur bei Krit** (`shake = 0.12`, 220 ms; Kamera-Jitter in `updateCamera`), `shakeEnabled` setzt `Battle.tsx` Z. 211 aus `settings.shake` und `prefers-reduced-motion`. **Kein Cut-in, kein 80-ms-Freeze, keine Statussymbole, kein Aschetod:** `died` = `smoke` + 500 ms Verblassen + Hub 0,2 (Z. 1583). `status`-Ereignis zeigt nur einen Fließtext mit der rohen Id (`hc-float-status`, Z. 1502). Leutnant-Flucht besteht: `FLEE_JUMP_MS` 320 + `FLEE_FADE_MS` 160 (`lieutenant.ts`), Rauch beim Absprung.
- Geschwindigkeit: `settings.speed` 1 | 2 | 3 (3 = überspringen) und `settings.enemySpeed` (`Battle.tsx` Z. 364: `board.speed`, `board.skip`).
- `content:check` (`tools/content-check.ts`): Warnungen sind nur fehlende Sprites und Leutnant-Porträts/-Modelle (Platzhalter); alles andere ist Fehler. Es gibt kein Vorbild für „Wert passt nicht zum Akt“.

### Zu ändernde Dateien (konkret)

| Datei | Änderung |
|---|---|
| `src/core/defs.ts` | `TimeOfDay`, `Weather`, `MapDef.timeOfDay?/weather?`, `RenderDef.look` |
| `src/content/schemas.ts` | `mapSchema` (2 Felder), `renderSchema` (Block `look`) |
| `content/core/render.yaml` | Block `look` (Vorschlag unten) |
| `src/content/validate.ts`, ggf. `tools/content-check.ts` | Wetter gegen Akt; fehlende Statusbilder |
| `src/render/shared/look.ts` (neu) | `resolveLook` rein, ohne Babylon; getestet |
| `src/render/shared/season.ts` | `applyLight` bleibt Grundlage; ruft `look.ts` bzw. wird von ihm gespeist |
| `src/render/shared/models.ts` | `TEAM_RAMP` aus `render.yaml`; `teamColours` behält die Tuch-Maske; `figureMaterial` mit Plug-in |
| `src/render/shared/figurePlugin.ts` (neu, Name frei) | Material-Plug-in: ungelites Tuch, Untergrenze, Rim |
| `src/render/shared/figures.ts` | Sprite-Austausch liest die neuen Rampen; `tint` bleibt |
| `src/render/board/board.ts` | `applyMapLight`/`clearColor`, `RING_COLOR` aus Daten, `strike`-Zeitleiste mit Cut-in/Freeze, `died`-Asche, Wackeln bei Tod, Statussymbole, Wetter einhängen, `precompile` erweitern, `frame` nachführen (Wetter, Freeze) |
| `src/render/board/weather.ts` (neu) | Wetter-Teilchen, Nebel, Pfützen |
| `src/render/board/critTimeline.ts` (neu) | Zeiten der Krit-Folge, rein |
| `src/render/board/ash.ts` (neu, Name frei) | wiederverwendeter Ascheflocken-Stoß für Tod |
| `src/render/board/statusIcons.ts` (neu, Name frei) | DOM-Overlay der Symbole |
| `src/app/screens/CutIn.tsx`, `cutin.css` (neu) | Band; Einhängen in `Battle.tsx` über `BoardHooks.onCutIn` |
| `src/app/screens/Battle.tsx` | Hook anbinden; `shakeEnabled` gilt auch für Tod |
| `tools/art/fx.py` (+ `art/fx/fx.json`, `fx.png`) | Bildraten von `hit_star_crit` und `smoke` |
| `tools/art/build.py` | `build_status()`, Manifest |
| `art/status/*.png`, `art/prompts/status_icons.md` (neu) | Bilder und Protokoll |
| `tests/unit/look.test.ts`, `crit-timeline.test.ts`, `effect-durations.test.ts` u. a. (neu) | siehe „Tests“ |
| `tests/perf/*` | Messvarianten Nacht/Regen |
| `concept/24-architecture/decision-log.md`, `concept/23-art-direction/art-direction.md` | Einträge, Textabgleich |

Nicht anfassen: `src/core` außer den Typen in `defs.ts` (Regeln, KI, Command-Folge, Replay), `dist*`, `test-results`, die Story 6.10, `concept/25-ux/*` (läuft in einer anderen Sitzung).

### Zod und Typen

- `mapSchema`: `timeOfDay: z.enum(TIMES_OF_DAY).optional()`, `weather: z.enum(WEATHERS).optional()`. Beide Listen als `as const` in `defs.ts` und von dort ins Schema, damit Typ und Schema nicht auseinanderlaufen. Fehlt `weather`, gilt `clear`; fehlt `timeOfDay`, gilt keine Voreinstellung (Lichtwerte der Karte oder Standard von `applyLight`). Das ist der ganze Sinn von „Standardwerte, die nichts ändern“.
- `renderSchema` (nicht strikt!): `look` mit `z.object({...})`; jeder neue Schlüssel steht in Schema **und** `RenderDef`, sonst wird er beim Laden verworfen und der Test sieht `undefined`. Farben als Hex-Text (`/^#[0-9a-fA-F]{6}$/`), Zahlen mit Grenzen (Intensität ≥ 0, Teilchenzahlen ganzzahlig ≥ 0, Deckkraft 0–1). Akte als Schlüssel `z.record(z.string(), …)` wie `trees`.
- `tests/unit/` lädt die echten Inhalte (`loadContentFromDisk`): ein Test, dass `render.yaml` **alle vier Tageszeiten, alle fünf Wetter und die Akte 1–3** führt (vollständig, kein Rückfall im Code).

### Vorschlag `render.yaml` (Vorschlag, alle Zahlen Startwerte [C])

```yaml
# Story 8.6: Licht und Wetter (Art Direction §2.4, §2.5). Eine Karte ohne timeOfDay/weather bleibt wie bisher.
look:
  # Teamfarben §2.1: ui = Bodenring und Markierungsfarbe, ramp = Tuch dunkel -> hell (K0..K3)
  teams:
    player: { ui: "#2F64C8", ramp: ["#1E3F86", "#2F64C8", "#5C8EE6", "#A9C6F4"] }
    enemy:  { ui: "#B83A2E", ramp: ["#7A2219", "#B83A2E", "#DB6A5C", "#F2B2A8"] }
    other:  { ui: "#3FA65A", ramp: ["#25693A", "#3FA65A", "#74C98A", "#BFE6C9"] }
  # Tageszeit: Basis für Umgebung (ambient) und Sonne (sun); die Karte überschreibt Feld für Feld.
  # azimuthDeg: 0 = Norden (+Z), 90 = Osten; sky = Himmelsfarbe (Szenenhintergrund);
  # figureFloor = Untergrenze der Helligkeit der Figuren (Art Direction §2.5); rim = Randlicht der Figuren (strength 0 = aus);
  # pointBoost = Faktor auf die Intensität der Punktlichter (Karten-lights und Feuer)
  timeOfDay:
    morning: { ambient: { color: "#dce6f4", intensity: 0.85 }, sun: { color: "#cfe0ff", intensity: 0.9,  azimuthDeg: 90,  elevationDeg: 20 }, sky: "#a9c4e8", figureFloor: 0.85, rim: { color: "#ffffff", strength: 0 }, pointBoost: 1.0 }
    noon:    { ambient: { color: "#fff6e6", intensity: 0.95 }, sun: { color: "#fff4e0", intensity: 1.1,  azimuthDeg: 180, elevationDeg: 68 }, sky: "#8fc0ee", figureFloor: 1.00, rim: { color: "#ffffff", strength: 0 }, pointBoost: 1.0 }
    evening: { ambient: { color: "#e6c9c4", intensity: 0.8 },  sun: { color: "#ff9a50", intensity: 0.85, azimuthDeg: 270, elevationDeg: 14 }, sky: "#7b5f9e", figureFloor: 0.80, rim: { color: "#ffffff", strength: 0 }, pointBoost: 1.0 }
    night:   { ambient: { color: "#3a4a7a", intensity: 0.55 }, sun: { color: "#9fb4ff", intensity: 0.45, azimuthDeg: 120, elevationDeg: 40 }, sky: "#0f1428", figureFloor: 0.60, rim: { color: "#8fb0ff", strength: 0.35 }, pointBoost: 1.5 }
  # Wetter: acts = Akte, in denen es vorkommt (content:check); grade = Licht/Himmel (gilt auf allen Stufen);
  # particles = Zahl je Qualitätsstufe (low 0), mid = Hälfte von high; Rest je Wetter
  weather:
    clear: { acts: [1, 2, 3] }
    rain:  { acts: [1, 2], grade: { ambientScale: 0.9, sky: "#8b98a8" }, particles: { high: 600, mid: 300, low: 0, fallSpeed: 14, length: 0.5, color: "#cfe3f5", alpha: 0.5 }, wet: { specular: 0.3, power: 28 }, puddles: { count: 14, alpha: 0.4 } }
    fog:   { acts: [1, 2], grade: { ambientScale: 0.95, sky: "#c4cdd2" }, mist: { density: 0.02, color: "#c9d2d8" }, ground: { layers: 2, height: 0.25, alpha: 0.35, driftSpeed: 0.05 } }
    ash:   { acts: [1, 3], grade: { ambientScale: 0.92, sky: "#8d8a90" }, particles: { high: 260, mid: 130, low: 0, fallSpeed: 0.9, size: 0.07, color: "#5b5a5e", emberShare: 0.1 } }
    snow:  { acts: [3],    grade: { ambientScale: 1.0, sky: "#cfd8e4" }, particles: { high: 320, mid: 160, low: 0, fallSpeed: 1.1, size: 0.08, color: "#ffffff" } }
  # Jahreszeit je Akt (§2.4), über jeder Tageszeit: tint = Farbe, mit der Licht und Himmel gemischt werden (strength 0..1),
  # sunElevationOffsetDeg = Aufschlag auf die Sonnenhöhe (Sommer höher, Winter flacher)
  season:
    1: { tint: "#ffd89a", strength: 0.12, sunElevationOffsetDeg: 6 }    # Spätsommer: warm-golden
    2: { tint: "#f0a870", strength: 0.10, sunElevationOffsetDeg: 0 }    # Herbst
    3: { tint: "#d8e6ff", strength: 0.12, sunElevationOffsetDeg: -8 }   # Winter
  # Effekte (Zeiten in ms bei 1×, alles durch die Geschwindigkeit geteilt)
  fx:
    crit: { cutInInMs: 120, cutInHoldMs: 130, cutInOutMs: 60, freezeMs: 80, shakeMs: 140, shake: 0.12, recoilMs: 120, returnMs: 70, settleMs: 30, numberScale: 2 }
    death: { ashMs: 560, fadeMs: 500, rise: 0.35, shakeMs: 100, shake: 0.06, flakes: { high: 40, mid: 24, low: 12 } }
```

Hinweise: `ambientScale` und `sky` sind Aufschläge auf die Tageszeit (`clear` ändert nichts). Unter „Offene Fragen“ steht, was an der Form unklar ist (Jahreszeit ohne Tageszeit, Wirkung des Himmels auf `low`, Maß der Untergrenze). Die Zahlen sind Startwerte für das Einstellen am Bildschirm (Screenshots), keine Vorgaben.

### §2.5 nach Babylon (Vorschlag; im Code gegen `season.ts`/`board.ts` prüfen)

| §2.5 | Babylon |
|---|---|
| Sonnenfarbe, -stärke, -richtung | `sun.diffuse`, `sun.intensity`, Richtung aus `azimuthDeg`/`elevationDeg` wie in `applyLight`; Jahreszeit addiert `sunElevationOffsetDeg` (Grenze 1–90 wie `mapSchema`). Morgen aus Osten (90°), Abend aus Westen (270°), Mittag hoch (68°). Lange Schatten = flache Sonne; Schattenkarte danach neu rendern |
| Umgebungslicht | `hemi.diffuse`, `hemi.groundColor` (× 0,35), `hemi.intensity` (= `ambient.intensity × 0,6`), wie `applyLight` |
| Himmel („violetter Himmel“, „leicht grauer Himmel“) | `scene.clearColor` aus `sky`; sichtbar jenseits der Landschaft und im Randbereich (`skirt`, Kamera darf 25 % über den Rand). Jahreszeit mischt `tint` hinein |
| Mondlicht blau, Punktlichter tragen | Nacht-Voreinstellung mit blauer Sonne niedriger Intensität; `PointLight.intensity × pointBoost`; `lightsMax` je Qualitätsstufe begrenzt weiter (Achtung: jedes Licht kostet Shader-Varianten, `maxSimultaneousLights` der Materialien prüfen) |
| Untergrenze der Helligkeit nur für Figuren | `scene.ambientColor = (floor, floor, floor)` und **nur** an Figuren-Materialien `ambientColor = (1,1,1)`; im Standard-Shader steht `vAmbientColor` in `finalDiffuse = clamp(diffuseBase*diffuseColor + emissive + vAmbientColor)*baseColor` (geprüft in `@babylonjs/core` 9.32.0 `default.fragment`), wirkt also als Untergrenze mal Textur. Gelände und Requisiten bleiben bei `ambientColor` schwarz. **Maß:** Offene Frage 5 |
| Rim nachts | siehe „Ungelites Tuch“: im selben Plug-in ein Fresnel-Term (Normale gegen Blickrichtung) mit Farbe und Stärke als Uniform, Stärke 0 außerhalb der Nacht. Alternative: zweites `DirectionalLight` nur für Figuren (`includedOnlyMeshes`), kostet aber einen Lichtplatz und Shader-Varianten je Material |
| Bodennebel zwischen Blöcken, weiche Fernsicht | zweiteilig: (a) `scene.fogMode = FOGMODE_EXP2`, `fogColor`, `fogDensity`: bei der **orthografischen** Kamera wächst der Nebel mit der Tiefe vom Kamerapunkt, also vom unteren zum oberen Bildrand; Dichte klein halten und am Bildschirm einstellen. (b) 1–2 große, flache, halbtransparente Ebenen knapp über den Blockoberflächen mit weich gemalter, langsam verschobener Textur (`ground.layers/height/alpha/driftSpeed`), nicht pickbar, ohne Tiefenschreiben, ein Draw Call je Ebene. Szenennebel wirkt auf alle `StandardMaterial`s: Ringe, Overlays und Tuch brauchen `fogEnabled = false` (Offene Frage 6) |
| Regenstriche, Ascheflocken, Schneeflocken | `ParticleSystem` (CPU, wie das Feuer) oder `GPUParticleSystem` (WebGL2; Rückfall CPU): Emitter-Quader über dem sichtbaren Ausschnitt, an der Kamera nachgeführt **nur wenn sich die Kamera bewegt** (`cameraKey`), Regen als gestreckte Billboards (`BILLBOARDMODE_STRETCHED`), Asche/Schnee als kleine Punkte. Zahl aus `particles.<stufe>`. Abwägung: CPU-Teilchen kosten Thread-CPU (das knappe Gut, Budget 8,3 ms), GPU-Teilchen nicht, setzen aber WebGL2 voraus. Die Messung auf `mid` entscheidet; Ergebnis in den Completion Notes |
| Nasser Glanz auf Blöcken | `specularColor`/`specularPower` der Gelände-Materialien (`terrain3d.ts`: `MixMaterial` der Oberflächen mit 0,03, Seitenwände `StandardMaterial`) im Regen anheben; kein neuer Shader. Zurücksetzen beim Wechsel |
| Pfützen | Thin Instances flacher, leicht glänzender Scheiben auf ebenen Feldern (deterministisch aus dem Karten-Seed, wie die Deko), ein Material, ein Draw Call; nur wenn die Messung es zulässt |
| Schneehauben | **nicht** in dieser Story (Akt 3) |

Die Jahreszeit mischt `tint` mit `strength` in Sonnen- und Umgebungsfarbe sowie Himmel und verschiebt die Sonnenhöhe; sie gilt nach der Karten-Überschreibung (Offene Frage 2).

### Ungelites Tuch: Ansätze und Abwägung

Ausgangslage: Tuch = Vertexfarbe mit Schlüssel in Alpha, im beleuchteten `StandardMaterial`; `teamColours` macht Alpha 1. Der Standard-Shader multipliziert Beleuchtung **und** Emissive mit `baseColor` (Textur × Vertexfarbe), `emissiveColor` ist also keine Farbe, die das Licht ersetzt, und lässt sich nicht pro Vertex maskieren.

1. **Material-Plug-in (`MaterialPluginBase`, Empfehlung).** `teamColours` lässt Alpha < 1 auf den Tuch-Vertices stehen (Material bleibt bei `hasVertexAlpha=false`, `vColor.a` ist im Shader trotzdem lesbar, geprüft zu bestätigen); das Plug-in hängt im Fragment-Shader (`CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR`) einen Zweig an: `a < 0.9` ⇒ `finalColor.rgb = vColor.rgb`, sonst unverändert; dieselbe Stelle trägt den Rim. Eine Variante für alle Figuren (Material wird geteilt),. + keine Änderung der Assets/Pipeline, kein zusätzlicher Draw Call, Maske bleibt weich. − eigener Shader-Code, der bei Babylon-Updates geprüft werden muss; neue Variante, die vorkompiliert werden muss; Schatten auf dem Tuch entfallen (gewollt: ungelit). **Grau-Faktor:** Tripo-Tuch trägt Textur-Grau 0,85, Blender-Tuch hat keine; für die exakte Zielfarbe aus §2.1 die Rampenfarbe **ohne** Textur ausgeben (Falten gehen verloren) oder durch den Grauwert teilen; am Screenshot gegen die Hex-Werte messen. Farbraum beachten: `teamColours` schreibt die Rampe unverändert, die übrigen Vertexfarben mit `toGamma`.
2. **Zwei Materialien je Mesh (Submesh-Aufteilung).** Das Tuch wird in der Pipeline (`prepare_tripo_unit.py`, `export_models.py`) als eigenes Submesh mit eigenem, `disableLighting`-Material exportiert. + einfachster Shader. − Pipeline-Änderung und Neu-Export aller 40+ Figuren, ein weiterer Draw Call je Figur (Budget!), Kanten zwischen Tuch und Rüstung hart.
3. **Eigenes `ShaderMaterial`/Node-Material.** Volle Kontrolle. − verliert Schatten-Empfang, Skelett-Instanzen, Toon-Abstufung des Standard-Shaders oder baut sie nach; größter Aufwand.
4. **Mehr Umgebungslicht als Näherung.** Nicht ungelit; verfehlt die Vorgabe.

Empfehlung 1. Ablehnen lassen nur, wenn das Plug-in auf dem Zielgerät (Android Chrome, iOS Safari) nicht kompiliert oder messbar teurer ist; dann zurück zum Produktinhaber.

### Zeitleiste (alle Zeiten bei 1×, Vorschlag; bei 2× durch 2 bzw. die 1,6 der Effekt-Bilder wie bisher)

Referenz heute, normaler Treffer (`strike`): Angriff startet 0, Trefferbild bei 250 (Bild 3 bei 12 fps), Rückstoß 140 → 390, Rückweg 90 → 480, Pause 60 → **540 ms**.

Krit (neu), t ab Beginn des Angriffs:

| t (ms) | Vorgang |
|---|---|
| 0–120 | Band gleitet diagonal ein, Speedlines laufen an; Angriffsanimation läuft |
| 120–250 | Band steht, Porträt `angry` und Name lesbar (läuft parallel zum Ausholen) |
| 250 | Trefferbild: Band gleitet aus (250–310), **Freeze 80 ms** (250–330): Figuren-Ticks und Effekt-Uhr stehen, Bild wird weiter gezeichnet |
| 330 | großer Stern (`hit_star_crit`, ≥ 19 fps ⇒ 5 Bilder in ≈ 260 ms, bis 590), Wackeln 330–470 (140 ms, 0,12), Schadenszahl 48 px (doppelt so groß wie 24 px), Zielfigur Blitz und Rückstoß 120 → 450 |
| 450–520 | Rückweg (70) |
| 520–550 | Pause (30) → **Ende 550 ms**; der Stern läuft bis 590 aus, die Zahl schwebt weiter (nicht blockierend) |

**Summe 550 ms ≤ 600 ms.** Die 0,9 s (1×) / 0,5 s (2×) für das Cut-in aus Art Direction §5.4 passen nicht in 600 ms; der Produktinhaber hat 600 ms bindend gemacht, §5.4 wird in T9 angeglichen (Offene Frage 4).

| Modus | Cut-in und Folge |
|---|---|
| 1× | wie Tabelle |
| 2× | alle `wait`/`tween`-Zeiten ÷ 2, Effekt-Bilder × 1,6: Band 60 + 65, Freeze 40, gesamt ≈ 275 ms |
| Gegnerphase | folgt `settings.enemySpeed` (1 | 2 | 3); zusätzliche Verkürzung nur nach Offener Frage 3 |
| Überspringen (3) | kein Cut-in, kein Freeze, kein Wackeln; Zahl und Stern wie bei jedem übersprungenen Treffer |

Übrige Effekte (§8), Dauer aus `art/fx/fx.json` bei 1× (Bilder ÷ fps), Prüfung im Test:

| Effekt | Bilder @ fps | ms | Hinweis |
|---|---|---|---|
| `hit_spark` (Treffer) | 4 @ 15 | 267 | ok |
| `fire_bolt` / `wind_slash` / `water_burst` / `earth_spikes` | 4 @ 12 | 333 | ok, einmalig gespielt (`loop=false`) |
| `light_pillar` | 5 @ 10 | 500 | ok |
| `dark_tendrils` | 4 @ 10 | 400 | ok |
| `heal`, `levelup` | 6 @ 10 | 600 | an der Grenze, ok |
| `hit_star_crit` | 5 @ 12 | 417 | im Krit-Ablauf zu lang, ≥ 19 fps |
| `smoke` (Flucht, Brand) | 6 @ 8 | **750** | über 600: ≥ 10 fps |
| Flucht Leutnant | 320 + 160 | 480 | ok |
| Tod in Asche (neu) | Stoß 560, Verblassen 500 | 560 | Wackeln 100, Hub 0,35 |
| Brand breitet sich aus (`terrain`) | Pause 200 | 200 | ok |
| Statussymbol erscheint/verschwindet | Ein-/Ausblenden | ≤ 150 | nicht blockierend |

### Statusliste (aus Inhalt und Kern gelesen)

Persistente Status, die eine Einheit trägt (`BattleUnit.status`, `StatusId = 'burning' | 'wet' | 'slowed' | 'knockback'` in `src/core/defs.ts` Z. 25; Anzeigetexte `ui.status.*` in `de.yaml`/`en.yaml`; Quelle `balance.yaml` `statusOf`: Feuer → `burning`, Wasser → `wet`, Erde → `slowed`, Wind → `knockback`):

| Id | Wirkung | Art Direction §8 | Symbol |
|---|---|---|---|
| `burning` | 10 % max. TP je Runde, nicht zusammen mit `wet` | kleine Flamme am Fuß | **ja** |
| `wet` | Tempo −3, hebt `burning` auf | Tropfen | **ja** |
| `slowed` | Bewegung −1 | Erdklumpen an den Füßen | **ja** |
| `knockback` | wird **nie** gespeichert (`combat.ts` ruft `knockback()` statt `applyStatus`), `status`-Ereignis tritt für ihn nicht auf | – | Offene Frage 7 |

Nicht zu verwechseln, kein Status im Sinne von `StatusId`: Niedergestreckt (hat Puls-Symbol und Verblutungs-Zähler), Erschöpft (Entsättigung), Buffs (`Buff`, Anfeuern; ohne Id, nicht angezeigt). Die Liste ist erschöpfend gegen `StatusId`, `statusId` in `schemas.ts` Z. 15, `content/` (`items.yaml`, `runes.yaml`, `balance.yaml`, `skills.yaml`) und `src/core` gegrept; vor dem Bildauftrag erneut prüfen (z. B. neue Status aus Akt-2-Planung).

Bildvorgaben (Vorschlag [C]): quadratisch, freigestellt, Round-Chibi, dicke Outline, auf 24 px lesbar; Master 512 px in `art/status/<id>.png`, gebaut auf 96 px WebP (Anzeige 24–32 CSS px). Farbe der Symbole nach Element (Feuer `#F2603A`, Wasser `#4AA8E8`, Erde `#B9874B`), Form trägt die Bedeutung. Auflagen aus `licensing.md` §6 beachten: bezahlter Tarif zum Erzeugungsdatum belegen (A1), Protokoll mit Originalablage und menschlichem Anteil (A2, A3), keine Namen geschützter Werke im Prompt (A7).

### Statussymbole auf dem Brett

DOM-Overlay in der `floatLayer`, Position wie Verblutungs-Zähler und Wimpel (`screenOfWorld`, Zeile pro Einheit, Reihe von höchstens drei Symbolen), sichtbar nur für sichtbare, nicht ausgeblendete Einheiten, aktualisiert beim Wechsel von `unit.status` (`setState`/`syncUnits` kennen den Zustand; das `status`-Ereignis liefert den Zeitpunkt für Ein-/Ausblenden), nie je Frame neu gebaut. Das heutige Fließtext-Aufpoppen (`hc-float-status` zeigt die rohe Id) bleibt oder entfällt: Offene Frage 8. Platz zu Wimpel (Leutnant) und Verblutungs-Zähler (niedergestreckt) klären, ohne `concept/25-ux/` zu ändern (läuft in einer anderen Sitzung); Position und Größe stehen nicht in `DESIGN.md`/`EXPERIENCE.md`, Rückfrage beim Controller.

### Cut-in: Daten und Auswahl

`strike` liefert Angreifer, `crit`, `element?`, `skill?`; den Waffennamen liefert das davor gespielte `combat` (`weapon?`). Name: Skill (`skill`) sonst Waffe; Anzeigetext über Schlüssel (kein Text im Code). Porträt: `artId(portrait, classId)` aus `unitArt.tsx` und die Halbfiguren-Auswahl `pickHalf(id, 'angry', built)` (Rückfall neutral); ohne Bild das Buchstaben-Medaillon des `Img`-Rückfalls. Speedlines: Elementfarbe aus Art Direction §2.3, ohne Element Offene Frage 9. Das Band ist Preact + CSS (eigene Datei neben der Komponente, `src/ui/styles.css` ist Altbestand und schrumpft nur), nicht im Babylon-Canvas.

Achtung Pakete: Halbfiguren und Köpfe liegen im Paket `act1` (`halves/**`, `busts/**`), der Prolog im Paket `core`: Offene Frage 10.

### Wie die Wetterschlüssel in Karten stehen („Karten setzen“, für die Inhalts-Sitzungen)

```yaml
# content/acts/act1/maps/m1_2_erlbach.yaml
timeOfDay: evening   # morning | noon | evening | night; fehlt: Licht wie bisher (nur ambient/sun der Karte)
weather: rain        # clear | rain | fog | ash | snow; fehlt: clear. Erlaubt je Akt: rain/fog Akt 1+2, ash Akt 1+3, snow Akt 3
# ambient: und sun: dürfen stehen bleiben; sie überschreiben die Voreinstellung Feld für Feld
# (z. B. nur  sun: { intensity: 0.7 }  ändert allein die Stärke, Farbe und Richtung kommen von der Tageszeit)
```

Ein Karten-`sun` verlangt heute alle vier Felder (`mapSchema`). Soll ein einzelnes Feld überschrieben werden können, müssen die Felder dort optional werden (nur wenn gewünscht, Offene Frage 2). Lager und Burg sind immer abendlich warm, Gedenken entsättigt alles außer Glutorange (§2.5, Ruhe- und Gedenkszenen): das betrifft die Heim-Szene und Gedenkszenen, nicht das Brett (Offene Frage 11).

### Tests (neu oder angepasst)

Unit (Vitest, `tests/unit/`):
- `look.test.ts`: (a) Karte ohne `timeOfDay`/`weather` ⇒ `resolveLook` liefert exakt Ambient/Sonne der heutigen `applyLight`-Standardwerte bzw. der Karte (Gleichheit mit dem Vor-Stand); (b) Voreinstellung als Basis, Karte überschreibt Feld für Feld (z. B. nur `intensity`); (c) Jahreszeit liegt über Voreinstellung und Karten-Überschreibung; (d) `mapSchema` lehnt `timeOfDay: dusk` und `weather: hail` ab, nimmt fehlende Felder an; (e) `render.yaml` ist vollständig (4 Tageszeiten, 5 Wetter, Akte 1–3, Figuren-Untergrenzen 0,85/1,0/0,80/0,60); (f) Teamfarben in `render.yaml` gleich den Werten aus §2.1.
- `weather.test.ts`: Teilchenzahl je Stufe (`low` 0, `mid` = Hälfte von `high`, abgerundet); Wetter-gegen-Akt-Tabelle (rain Akt 3 ⇒ Meldung; snow Akt 1 ⇒ Meldung; `clear` überall ok).
- `crit-timeline.test.ts`: Summe bei 1× ≤ 600; bei 2× kleiner; Überspringen ohne Cut-in/Freeze/Wackeln; Freeze genau 80 ms.
- `effect-durations.test.ts`: alle §8-Effekte aus `art/fx/fx.json` und `render.yaml fx` ≤ 600 ms bei 1× (fängt `smoke` und `hit_star_crit` ab).
- Figuren: `teamColours` behält die Tuch-Maske (Vertex-Alpha < 0,9 bleibt erhalten, übrige Vertexfarben unverändert); Rampenfarben = `render.yaml`. Bestehende `tests/unit/figure.test.ts`, `terrain3d.test.ts`, `scenery.test.ts` bleiben grün.
- Statusbilder: jede `StatusId` mit Persistenz hat `art/status/<id>.png` (nach Abschluss der Bilder Fehler, vorher Warnung).
- `content:check`: Karte mit Wetter außerhalb des Akts schlägt an (Test mit Fixture).
- Cut-in-Auswahl: Porträt `angry`, Rückfall neutral, Rückfall Medaillon (reine Funktion, keine DOM-Abhängigkeit).

E2E/Leistung (Playwright):
- `tests/e2e/smoke.spec.ts` bleibt grün (Prolog-Kampf in Software-WebGL): keine neuen Konsolenfehler, keine Shader-Fehler durch das Plug-in. Ein Lauf mit Nacht und Regen braucht eine Karte mit den Feldern; Vorschlag: die Bench-Karte (`tests/perf/benchMap.ts`, wird gegen `mapSchema` geprüft) bekommt per Umgebungsvariable `timeOfDay`/`weather` (Offene Frage 12, falls ein Entwicklungs-Parameter in der App erwünscht ist).
- `tests/perf`: `PERF_GPU=1 pnpm perf` vor der Story (Stand nach 7.7 aus `tests/perf/baseline.json` bzw. frischer Lauf), nach jedem Block T3, T4, T5, T7 und am Ende; zusätzlich je ein Lauf Nacht und Regen. Mittel mehrerer Läufe (`PERF_RUNS`, Standard 3), Thread-CPU je Frame, Draw Calls, max-Frame, **neue Effects in der Gegnerphase = 0**. Der Rechner ist oft belastet: Thread-CPU bei 1× ist das stabile Maß (siehe 7.7).

### Screenshots zur Abnahme (375 × 812, Zoom „Mittel“, an den Produktinhaber)

1. Teamfarben **vorher/nachher** auf derselben Karte und Kamera (Tuch und Ring, Spieler/Gegner/Dritte; Prolog und eine Act-1-Karte), dazu Nahaufnahme (Zoom „Nah“) einer Figur bei `noon` und `night` (Tuch gleiche Farbe).
2. Dieselbe Karte bei `morning`, `noon`, `evening`, `night`.
3. Dieselbe Karte bei `clear`, `rain`, `fog`, `ash`, `snow` (Tag), dazu `rain` und `fog` auf Qualität `low` (nur Licht/Himmel).
4. Nacht mit Rim-Licht (Nahaufnahme) und mit Punktlichtern (Fackeln/Feuer).
5. Krit-Cut-in in vier Standbildern (Band, Freeze, Stern mit Wackeln, doppelte Zahl), ein Spielerkrit mit Porträt, ein Gegnerkrit mit Medaillon, ein Krit bei 2×.
6. Tod in Asche in drei Standbildern; Leutnant-Flucht.
7. Statussymbole: `burning`, `wet`, `slowed` einzeln und zu zweit, an einem Leutnant mit Wimpel, an einer niedergestreckten Einheit.
8. Leistungsbericht (`report.md`) mit Vorher/Nachher, Nacht und Regen.

### Grenzen

- `src/core`: nur die Typen in `defs.ts`; Regeln, KI, Command-/Event-Folge und Replay-Ergebnisse unverändert. Alle Darstellungswerte in `render.yaml`, kein sichtbarer Text im Code.
- Keine Act-1-Karten in dieser Story ändern (andere Sitzungen); keine Schneehauben; keine Tonspur (Glockenschlag: Story 8.8); Drachenwackeln später; Heim-Szene und Weltkarte nicht (Weltkarte ist ein flaches Bild).
- Keine Vertex-Animation-Texturen, keine Figuren-Pipeline-Änderung (Ansatz 2 des Tuchs wäre eine, deshalb nicht Empfehlung).
- Das Verblassen aus 8.10, die statischen Schatten und die Material-Teilung aus 7.7 bleiben erhalten (Plug-in und Wetter dürfen sie nicht aufbrechen); Einheiten werfen weiter keinen Schatten.

### Project Context Rules (AGENTS.md)

Branch statt `main`, Merge per PR; Code, Bezeichner, Commits und Datenschlüssel Englisch, Konzept Deutsch; Spielwerte nur in `content/core/render.yaml` bzw. YAML mit Zod-Schema; kein sichtbarer Text im Code (Schlüssel in `de.yaml`/`en.yaml`); Entscheidungen ins zuständige BMAD-Artefakt (hier `concept/23-art-direction/decision-log.md`, technische in `concept/24-architecture/decision-log.md`), nie in `01-decisions.md`; offene Punkte nicht still entscheiden; KI-Bilder nur nach `licensing.md` §6; Bilder per ChatGPT über Claude in Chrome, Prompt und Abnahme in `art/prompts/<id>.md`; App-Zustand in `src/app/state/` je Verantwortung ein Modul; Styles je Screen in eigener CSS-Datei; Coverage von `src/core` nicht senken; fertig bei grünem `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`. PNGs unter `art/` liegen in Git LFS: `git lfs pull` vor dem Ansehen/`pnpm art:build`; bei „Cannot find package“ `pnpm install --frozen-lockfile`.

## Offene Fragen für den Produktinhaber

1. **Wetter gegen Akt in `content:check`: Fehler oder Warnung?** Im Codebestand warnt `content:check` nur bei fehlenden Platzhalter-Bildern (Sprites, Leutnant-Porträts/-Modelle), alles andere ist Fehler; ein Vorbild für „Wert passt nicht zum Akt“ gibt es nicht. Vorschlag: Fehler (ein Wetter außerhalb der Tabelle in §2.5 ist ein Datenfehler, kein fehlendes Bild). → entschieden, siehe Entscheidungen
2. **Jahreszeit und Karte ohne `timeOfDay`.** „Fehlt beides, wie heute“ (AC 1) und „Jahreszeit gilt über allen Voreinstellungen“ (Entscheidung 5) widersprechen sich für Act-1-Karten ohne Tageszeit, die nach dem Setzen durch die Inhalts-Sitzungen sonst unverändert wären. Gilt die Jahreszeit-Tönung (a) nur mit Voreinstellung, (b) auch ohne, dann ändert sie schlagartig alle Karten, oder (c) über die Karten-Überschreibung hinweg? Und: wirkt die Sonnenhöhe der Jahreszeit auch auf die Karten-eigene `sun.elevationDeg` (Vorschlag: nur auf die Voreinstellung)? Soll ein einzelnes Feld von `sun` überschreibbar sein (heute sind alle vier Pflicht)? → entschieden, siehe Entscheidungen
3. **Krit in der Gegnerphase: „verkürzt“.** Heißt das nur `settings.enemySpeed` oder zusätzlich ein fester Faktor (z. B. 0,7)? Vorschlag: nur `enemySpeed`. → entschieden, siehe Entscheidungen
4. **Zeitrahmen ≤ 600 ms.** Wird die Summe vom Beginn des Angriffs (inklusive Ausholen bis 250 ms) oder nur der Zusatz des Krits gemessen? Zählt eine auslaufende Schadenszahl (Schweben ≈ 900 ms) und das Auslaufen eines Sterns/Rauchs, oder nur die Zeit, in der das Spiel auf den Effekt wartet? Vorschlag: Zeit, die das Spiel wartet (die Folge enthält das Ausholen); auslaufende Zahlen und Flocken zählen nicht. Dazu: Die 0,9 s/0,5 s des Cut-ins in Art Direction §5.4 ersetzt diese Zeitleiste (Vorschlag: ja, §5.4 anpassen). → entschieden, siehe Entscheidungen
5. **Maß der Figuren-Untergrenze.** „Mindesthelligkeit 85/100/80/60 %“: bezogen auf die Albedo (Figur zeigt mindestens x · Grundfarbe, Vorschlag), auf die Helligkeit am Mittag oder auf einen Prozentwert der Szenenhelligkeit? → entschieden, siehe Entscheidungen
6. **Nebel und Wetter-Tönung auf Teamfarben.** Dürfen Szenennebel und Bodennebel Figuren, Tuch, Ringe und Markierungen überlagern (Nebel „zwischen den Blöcken“ liegt dann auch über Figuren) oder bleiben sie nebelfrei (Lesbarkeitsregel §2.5)? Vorschlag: Ringe, Overlays und Tuch nebelfrei, Bodennebel unterhalb der Figurenfüße beginnen lassen. → entschieden, siehe Entscheidungen
7. **`knockback`.** Wird nie als Status gespeichert; bekommt es trotzdem ein Symbol (für die Dauer des Rückstoßes) oder nicht? Vorschlag: nein, drei Symbole (`burning`, `wet`, `slowed`). → entschieden, siehe Entscheidungen
8. **Statussymbol und vorhandener Text.** Soll das heutige Aufpoppen des Status-Fließtexts (`hc-float-status`, rohe Id) bei Eintritt bleiben, durch das Symbol ersetzt oder durch den lokalisierten Namen (`ui.status.*`) ergänzt werden? Und: sind die Fuß-Effekte aus §8 („kleine Flamme am Fuß / Tropfen / Erdklumpen an den Füßen“) zusätzlich zum Symbol im Umfang oder entfallen sie zugunsten der Symbole? → entschieden, siehe Entscheidungen
9. **Speedline-Farbe ohne Element.** Physische Angriffe haben kein Element, Einheiten haben keine Fraktion (nur Leutnants). Welche Farbe: Teamfarbe (Vorschlag, Rampe hell), Weiß, oder Fraktionsfarbe des Leutnants? → entschieden, siehe Entscheidungen
10. **Porträts im Prolog.** `halves/`, `busts/` und `avatars/` liegen im Paket `act1`, der Prolog (Paket `core`) kann Krits haben, bevor `act1` im Hintergrund geladen ist; im Prolog gäbe es dann nur Buchstaben-Medaillons. Genügt das, oder sollen die Porträts der Prolog-Figuren (Kael, Brenna, Tobin, Avatar, Temple Guard) mit `angry` ins Paket `core` (Budget 30 MB)? Dasselbe für die Statussymbole: Entscheidung war „Paket `act1`, nicht `core`“; der Prolog kennt keine Status-Quellen außer Terrain/Elementen — bitte bestätigen, dass dort keine Symbole erscheinen müssen (ohne Bild: kein Symbol, kein Fehler). → entschieden, siehe Entscheidungen
11. **Heim-Szene.** Soll `HomeView` (Lager/Burg) dieselbe Auflösung mit `evening` nutzen (§2.5 „Lager und Burg immer abendlich warm“)? Nicht Teil dieser Story, aber die Auflösung ist dafür gedacht. → entschieden, siehe Entscheidungen
12. **Karte mit Wetter in E2E/Abnahme.** Wie sollen Tests und Abnahme eine Karte mit `timeOfDay`/`weather` laden, solange keine Act-1-Karte sie setzt: Bench-Karte per Umgebungsvariable (Vorschlag), Entwicklungs-Parameter in der App (`?look=night,rain`) oder eine Testkarte in `content/`? → entschieden, siehe Entscheidungen
13. **Toleranz der Leistung.** „Nicht verschlechtern“: erlaubte Abweichung des Medians der Thread-CPU je Frame (Vorschlag: bis +0,5 ms bei 2× auf der Karte ohne Wetter, Rauschen ±1 ms laut 7.7). Und: Zählt die Messung mit Nacht/Regen gegen dieselbe Schwelle? → entschieden, siehe Entscheidungen
14. **Qualität `low` und Boden-Wetter.** „Auf `low` bleiben nur Licht und Himmel“: zählen Szenennebel, Bodennebel-Ebenen, nasser Glanz und Pfützen dazu (Vorschlag: Szenennebel und Glanz ja, Ebenen und Pfützen nein)? → entschieden, siehe Entscheidungen
15. **Oberflächen-Farben der Markierungen.** `overlays.ts` setzt `reinforce` auf Orange (`#f2802e`), Art Direction §2.1 verbietet Glutorange als Markierungsfarbe. Außerhalb dieser Story, hier nur vermerkt: aufnehmen oder lassen? → entschieden, siehe Entscheidungen

### Entscheidungen Produktinhaber 2026-10-26 (Antworten auf die offenen Fragen)

1. **Wetter gegen Akt in `content:check`:** Fehler. Ein Wetter außerhalb der Tabelle in §2.5 ist ein Datenfehler.
2. **Jahreszeit und Karte ohne `timeOfDay`:** Tönung und Sonnenhöhe der Jahreszeit gelten nur, wenn die Karte `timeOfDay` setzt. Ohne `timeOfDay` bleibt das Bild genau wie bisher. Mit `timeOfDay` gilt: Voreinstellung plus Jahreszeit, danach überschreiben die `sun`- und `ambient`-Felder der Karte feld für feld. Alle Felder von `sun` werden einzeln optional.
3. **Krit in der Gegnerphase:** Verkürzt nur über `settings.enemySpeed`, ohne zusätzlichen Faktor.
4. **Zeitrahmen ≤ 600 ms:** Gemessen vom Treffer bis zum Ende des Effekts, ohne Ausholen und ohne auslaufende Schadenszahlen oder Flocken. Die Krit-Sequenz dauert bei 1× insgesamt 550 ms. Art Direction §5.4 (bisher 0,9 s / 0,5 s) wird daran angeglichen.
6. **Lesbarkeit von Wetter und Nebel:** Wetter-Tönung und Bodennebel dürfen Figuren nur leicht beeinflussen, damit sie in der Szene sitzen. Teamtuch, Ringe und Markierungen bleiben lesbar und nebelfrei. Das genaue Maß der Figuren-Untergrenze bleibt offen (Frage 5).
7. **`knockback`:** Kein Symbol, weil kein Status gespeichert wird. Symbole gibt es nur für `burning`, `wet` und `slowed`.
8. **Statusanzeige:** Bei Eintritt erscheinen Symbol und lokalisierter Kurzname (`ui.status.*`). Sie ersetzen den Fließtext mit roher Id (`hc-float-status`). Die Fuß-Effekte aus §8 (kleine Flamme, Tropfen, Erdklumpen) sind im Umfang.
9. **Speedlines ohne Element:** Sie nutzen die Teamfarbe (helle Rampe).
10. **Statussymbole und Porträts im Prolog:** Die Statussymbole kommen ins Paket `core` (wenige KB; die Regel „neue Assets in `act1`“ wird hier bewusst ausgenommen), damit auch der Prolog sie hat. Für Einheiten ohne Porträt gibt es im Cut-in ein Buchstaben-Medaillon als Fallback.
11. **Heim-Szene:** Bleibt wie sie ist und ist nicht Teil dieser Story.
13. **Leistung:** Höchstens +0,5 ms Thread-CPU je Frame bei 2× gegenüber dem Stand vor der Story. Die Messungen mit Nacht- und Regen-Variante zählen gegen dieselbe Schwelle.
14. **Qualität `low`:** Bleiben Licht und Himmel, dazu Szenennebel und nasser Glanz. Keine Partikel, keine Nebel-Ebenen und keine Pfützen.
15. **Markierungsfarbe `reinforce`:** Die orange Markierung (gegen §2.1) bleibt außerhalb von 8.6. Sie wird als Folgeaufgabe vermerkt.

5. **Maß der Figuren-Untergrenze:** Der Prozentwert bezieht sich auf die Helligkeit der Figur am Mittag. Eine Figur wird nie dunkler als x % ihrer Mittagsdarstellung: morgens 85 %, mittags 100 %, abends 80 %, nachts 60 %. Die Landschaft darf dunkler werden.
12. **Test und Abnahme mit Wetter:** Ein Debug-Parameter plus eine Bench-Variante. In Dev-Builds und mit `?debug` überschreibt ein URL-Parameter wie `?look=evening,rain` die `timeOfDay`- und `weather`-Angaben der Karte. Der Performance-Bench bekommt die Umgebungsvariable `PERF_LOOK` (z. B. `night,rain`) für die Nacht- und Regen-Messungen. Nichts davon ist im Produktions-Build sichtbar.

Alle 15 Fragen sind damit entschieden.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5 (gds-dev-story, non-interactive)

### Debug Log References

- Screenshots: `scratchpad/shots/8-6/` (Pfad im Bericht an den Controller); erzeugt mit Playwright (GPU) gegen den Dev-Server, `__board.setLook(tageszeit, wetter)` in der Konsole.
- Perf: `scratchpad/perf-8-6/` (before-/after-/nightrain-Berichte und JSON).

### Completion Notes List

- Schema: `MapDef.timeOfDay?/weather?`, `ambient`/`sun` je Feld optional; `render.yaml` Block `look` (Teamfarben §2.1, Tageszeiten, Wetter, Jahreszeit je Akt, Effekt-Zeiten); `resolveLook` (`render/shared/look.ts`, rein, getestet): ohne `timeOfDay` unverändert, mit: Voreinstellung, Jahreszeit, Karten-Felder, Wetter-Grad. `content:check`: Wetter gegen Akt = Fehler; Statusbild fehlt = Fehler (Bilder sind da).
- Figurenmaterial-Plug-in (`figurePlugin.ts`): Teamtuch ungelit und nebelfrei (Schlüssel im Vertex-Alpha, als rohes `color.a` gelesen), Untergrenze (`figureFloor × figureReference`, nur Figuren), Rim nachts. Ringe, Markierungen, Effekt-Sprites, Gold-Ring, Groll-Linie: `fogEnabled = false`.
- Wetter (`board/weather.ts`): GPU-Teilchen (Rückfall CPU), Szenennebel linear, Bodennebel-Ebenen, nasser Glanz, Pfützen (Thin Instances). Vorkompiliert in `precompile`. Messung: Pfützen und die zweite Bodennebel-Ebene kosteten messbar Thread-CPU (+0,9 bis +1,0 ms bei 2× mit Nacht/Regen, über dem Budget); ausgeliefert ist `puddles.count: 0` (aus, per YAML wieder einschaltbar) und `ground.layers: 1`; damit lag Nacht+Regen im Lauf danach auf dem Niveau der klaren Karte (Median 6,0 ms gegenüber 6,8 ms im selben Lauf, Rauschen ±1 ms).
- Krit: `critTimeline.ts` (550 ms bei 1×), `BoardHooks.onCutIn` → `CutIn.tsx` (Porträt `angry` über `pickHalf`, sonst Medaillon), Freeze über `scene.animationTimeScale` und Effekt-Uhr, Wackeln über `kick`, Zahl ×2 über `--hc-num-scale`.
- Statussymbole: `statusIcons.ts` (DOM, Symbole mittig über dem Kopf, bei Leutnants rechts neben dem Wimpel, bei niedergestreckten Einheiten ausgeblendet), Bilder `core/status/*.webp` (Paket core), Name `ui.status.*` ersetzt die rohe Id, Fuß-Effekte aus vorhandenen Sprites (`look.fx.status.feet`).
- Tod in Asche: `ash.ts` (wiederverwendetes Systempaar), Verblassen nach oben, Wackeln. Leutnant-Flucht unverändert (480 ms).
- Debug: `?look=` (Dev-Build und `?debug`), zeigt die reine Voreinstellung (Karten-`ambient`/`sun` werden dann ignoriert), `__board.setLook()`, `PERF_LOOK`; `PERF_PORT` in `playwright.perf.config.ts`.
- Entscheidungen Produktinhaber 2026-10-26 (nach der Abnahme): (1) Tuch in der UI-Farbe: der Tuch-Schlüssel K2 der Bild-zu-3D-Figuren wird über `render.yaml look.clothSteps` (`[0, 1, 1, 3]`) in Stufe K1 gezeichnet (`#2F64C8` / `#B83A2E` / `#3FA65A`, wie der Ring; `newFigureLook` in `figurePlugin.ts`); Screenshots `cmp-player-k1.png`, `cmp-enemy-k1.png`. (2) Licht-Voreinstellungen als Startwerte akzeptiert. (3) Pfützen aus (`puddles.count`), eine Bodennebel-Ebene akzeptiert. (4) Statussymbole 24 px akzeptiert (Überlappung nur bei der weitesten Zoomstufe).
- Prüfungen: `pnpm lint`, `pnpm test` (72 Dateien, 887 + neue Tests), `pnpm content:check`, `pnpm build` (Budget ok), `E2E_PORT=4391 pnpm test:e2e` (17 bestanden, 3 übersprungen) grün.

### Leistung (PERF_GPU=1, Qualität mid, 24×32, 40 Einheiten, Median von 3 Läufen, Thread-CPU ms/Frame)

| Gerät, CPU | vorher (HEAD) | nachher (klar) | Nacht+Regen, erste Fassung (Pfützen, 2 Ebenen) | Draw Calls vorher / nachher / N+R |
|---|---|---|---|---|
| pixel6a 2× | 6,9 (6,2–6,9) | 7,1 (6,7–7,9) | 7,8 (7,8–8,7) | 43 / 43 / 46 |
| iphone12 2× | 6,7 (6,2–7,4) | 7,1 (6,9–7,1) | 7,7 (7,7–8,1) | 43 / 43 / 46 |
| pixel6a 4× | 11,6 (9,2–13) | 10,2 (9,5–10,3) | 10,4 | 43 / 43 / 46 |
| iphone12 4× | 8,4 (7,5–10,3) | 9,0 (8,6–10,2) | 11,5 | 43 / 43 / 46 |

Neue Effects in der Gegnerphase: 2 vorher wie nachher (kein Zuwachs). Spätere Einzelmessung pixel6a 2× mit der ausgelieferten Konfiguration (Pfützen aus, 1 Ebene), ruhigerer Rechner: klar 5,7 / 7,6 / 6,8, Nacht+Regen 6,2 / 6,0 / 5,9 (45 Draw Calls). Der Rechner war durch parallele Sitzungen belastet; die Streuung zwischen Läufen liegt bei ±1 ms.

### File List

content/core/render.yaml, playwright.perf.config.ts, src/core/defs.ts, src/content/schemas.ts, src/content/validate.ts, src/content/validateLook.ts (neu), tools/content-check.ts, tools/art/build.py, tools/art/fx.py, art/fx/fx.json, art/status/ (Originale, Protokoll art/prompts/status_icons.md), src/render/host.ts, src/render/shared/look.ts (neu), src/render/shared/season.ts, src/render/shared/figurePlugin.ts (neu), src/render/shared/models.ts, src/render/shared/figures.ts, src/render/shared/terrain3d.ts, src/render/board/board.ts, board.css (neu), weather.ts (neu), ash.ts (neu), critTimeline.ts (neu), statusIcons.ts/.css (neu), rings.ts, overlays.ts, lieutenant.ts, src/app/battle/cutIn.ts (neu), src/app/screens/CutIn.tsx, cutin.css (neu), src/app/screens/Battle.tsx, src/ui/styles.css, tests/unit/look.test.ts, crit-timeline.test.ts, cutin.test.ts (neu), tests/perf/bench.ts, tests/perf/perf.spec.ts, concept/23-art-direction/art-direction.md, concept/23-art-direction/decision-log.md, concept/24-architecture/decision-log.md, _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-10-26: Story 8.6 umgesetzt (Licht, Wetter, Teamtuch ungelit, Krit-Cut-in, Statussymbole, Tod in Asche), Status review.

## Abnahme 2026-10-27

Abgenommen (Status done). Nacht und Nebel (1-7), Abend (1-2) und Effekte im Durchlauf gesehen. Gesamtbefund: `acceptance-2026-10-27.md`.
