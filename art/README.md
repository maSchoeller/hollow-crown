# art/ – Asset-Quellen

Quellen für alle Spielgrafiken. `pnpm art:build` kopiert die fertigen Sheets nach `public/assets/` (generiert, nicht eingecheckt) und schreibt die Manifeste. Stil: `concept/23-art-direction/art-direction.md` (löst `concept/15-art-direction.md` ab), Pipeline: `concept/16-asset-pipeline.md`.

**Raster: 48 px pro Feld** (Entscheidung GA4b in `concept/01-decisions.md`, ersetzt 32 px).

## Aktueller Stand

Maßgeblich ist seit 2026-10-23 `concept/23-art-direction/art-direction.md` (Round-Chibi, B8). Für neue Arbeit, Mockups und Referenzen diese Quellen nutzen:

| Aktuell | Wo |
|---|---|
| Porträts aller Figuren, final für Akt 1 mit vier Stimmungen der Kernfiguren (Story 8.4) | `art/mockups/characters-s1/<id>.png`, `<id>_<mood>.png` |
| Dialog-Hintergründe (Akt 1 final, Story 8.7; spätere Akte noch Kandidaten) | `art/mockups/locations-s1/` |
| Titelbild | `art/title/title_act1.png` |
| Stil-Leitreferenz | `art/mockups/style-2026-11/anchor_rhen.png` |
| Brettfiguren (Tripo) | `art/models/source/<id>_board_tripo.glb`, `art/turnarounds/<id>_board/`; aufbereitet `art/models/units/<id>.glb` (`pnpm art:tripo`) |

Die übrigen Blender-Skriptfiguren unter `models/units/` (Schütze, Magier, Kämpfer, `avatar`) bleiben, bis sie durch Tripo-Figuren ersetzt werden. Nur noch in der Git-Historie: die Anime-Porträts `portraits/`, die PoC-Hintergründe `backgrounds/`, `tiles/`, `concept/art/` (Anime-Sheets, Pixel-Beweis) und `art/mockups/style-3d-2026-10/` (abgelehnte Stilprobe).

## Ordner

| Ordner | Inhalt | Erzeugt von |
|---|---|---|
| `palette/hollow-64.hex` | Masterpalette (64 Farben, 52 frei + 3 Team-Rampen à 4) | Hand |
| `models/units/<id>.glb` | 3D-Figuren fürs 3D-Brett (D4): ein Mesh pro Gelenk, Animationen `idle`, `walk`, `attack`, `hit`, `downed` | `tools/art/export_models.py` + Blender |
| `models/units/<id>.vat` | Gebackene Animation der Tripo-Figuren (Story 7.8): 60 Bilder/s, lokale Pose je Zeile (22 Gelenk-Quaternionen Half + Hips-Translation), gzip-Strom, Git LFS | `tools/art/bake_vat.py` (über `pnpm art:tripo`) |
| `models/props/<id>_<zustand>.glb` | 3D-Requisiten (D5), ein statisches Mesh pro Zustand (`tree_a`, `house_razed`, `chest_open` …) | `tools/art/export_models.py` + Blender |
| `models/castle/paktwacht.glb` | Heimat-Burg als 3D-Diorama (Test `?castle3d=1`): ein Mesh je Teil `<gruppe>_<stufen>` (Schale, 11 Räume, 3 Gefährten-Gegenstände; Stufen `a`, `1`, `2`, `23`, `3`), Vertex-Farben, Material `castle_glow` ungelit; lädt bei Bedarf, nie im ersten Download | `tools/art/blender_castle.py` + Blender (Vorlagen `mockups/castle3d-refs/`) |
| `fx/` | Effekt-Sheets (Flammen, Funken, Treffer-Stern …) | `tools/art/` |
| `mockups/locations-s1/<id>.png` | Orte und VN-Hintergründe von Akt 1 (16:9, 1672 × 941, Sicherheitszone mittleres Drittel, unteres Drittel ruhig); `pnpm art:build` baut `public/assets/locations/<id>.webp`, Szenen und `place` nennen die Ort-Id (Story 8.7) | ChatGPT |
| `title/title_act1.png` | Titelbild 1024 × 1536 (2:3); `pnpm art:build` baut `public/assets/title/title_act1.webp` (Paket core) | ChatGPT |
| `icon/icon.png` | App-Icon-Master 1254 × 1254 (Favicon, PWA-Icons, Apple-Touch); `pnpm art:icons` schreibt `public/icons/` (eingecheckt) | ChatGPT |
| `prompts/<asset>.md` | Prompt, Referenzen, Datum | Hand |

## 3D-Modelle (`models/`)

Erzeugt aus denselben Blender-Bauskripten wie die Sprites (`concept/01-decisions.md` D4, D5, D12, D13):

```
blender -b --factory-startup --python tools/art/export_models.py -- art/models [id ...]
```

- **Maßstab**: 1 glTF-Einheit = 1 Feld, Ursprung = Feldmitte am Boden. Figuren schauen nach dem glTF-Import nach Norden (+Z); das Brett dreht sie.
- **Farben**: ein Material, das die Vertexfarben liest (linear). Jede Rolle bekommt den mittleren Ton ihrer Rampe aus `tools/art/ramps.py`. Teamtuch (K0–K3) speichert den Schlüssel im Vertex-Alpha (`(k + 1) / 8`), das Brett setzt die Team-Rampe ein.
- **Figuren**: alle Teile, die am selben Gelenk hängen, sind zu einem Mesh verbunden (rund 14 statt 70 Meshes). Effekt-Teile (Schwungbogen, Glühen, Pfeil) bleiben einzeln und werden über ihre Skalierung ein- und ausgeblendet. Animationen als NLA-Spuren, Timing wie die Sprite-Zeilen (Idle 6 fps Pingpong, Laufen 10 fps, Angriff 12 fps mit Treffer-Frame 3).
- **Requisiten**: ein statisches Mesh pro Zustand, im Brett per Thin Instances gezeichnet.
- **Requisiten-Pakete**: alle Requisiten liegen nach dem Build in `public/assets/models/props/` (Dateiname `<prop>_<zustand>.glb`, der Teil vor dem ersten Unterstrich ist die Requisite) und gehören dem Paket act1; nur der Vorab-Cache der ersten Mission (`tools/build/first-mission.mjs`) nimmt sie in den ersten Download. Neue Varianten, die nicht in den ersten Download sollen, stehen in `content/packs.yaml` unter `props:` des Pakets act1 (Dateiname ohne `.glb`); `tools/art/model_packs.py` `prop_packs` liest das, das Manifest führt sie als `models.propPacks`. Requisiten, die nur ein unveröffentlichtes Paket nennt (`act2.props`, Story 11.24), legt `prop_packs` bis zu dessen Release ins letzte veröffentlichte Paket, nie in den ersten Download. Fehlt ein Modell beim Zeichnen (Paket noch nicht geladen, offline), bleibt das Feld leer bzw. das Brett nimmt `board.propFallback` aus `content/core/render.yaml`.
- **Festungs-Baukasten** (`tools/art/props/fortify.py`): `wallrim_idle`, `tower_idle`, `gatehouse_open/closed`, `gate_idle`, `door_*_idle`, `throne_idle`, `massif_a/b/c`; das Brett wählt die Teile aus den Nachbarfeldern (`src/render/board/wallKit.ts`). Texturen `art/props/textures/kit_*.png`.
- **Galerie-Modelle** (`concept/23-art-direction/map-assets/groups/*.yaml`, Skripte `tools/art/props/{nature_map,village,interior,coast,winter}.py`, Referenzen `art/mockups/map-assets/refs/`): Baustein-Entwürfe für die Staffel. Ohne `ships: true` bleiben sie aus dem Build (`tools/art/build.py`). Prüfseiten für den Dev-Server: `tools/art/prop-catalog.html`, `prop-one.html`; `node tools/art/gallery-shots.mjs` rendert aus der Spielkamera, `python concept/23-art-direction/map-assets/gallery.py` baut die Galerie.
- **Gegner von Akt 2 (Story 11.7, Platzhalter)**: das Grenzheer der Eisenmark nutzt `soldier`; die Ritter der Silbernen Lanze (`knight`, zu Fuß) und die Kontorwachen nutzen `soldier`, die Kaperfahrer `brigand`, `mercenary` und `bandit_archer` – vorhandene Modelle als Platzhalter, auch live und über Akt 2 hinaus. Neu entschieden wird erst nach Story 11.27 (F2, Produktinhaber 2026-11-07, Frage 10). Brann behält sein Modell; die Pools stehen in `content/acts/act2/haunts.yaml`.
- **Galerie-Modelle von Akt 2 (Story 11.24)**: die Karten setzen sie von Hand (`propVariants`, mit `face` für die Blickrichtung; `wide` = 2 Felder, `big` = 2 × 2); Hängebrücke und Kai sind eigene Gelände (`rope_bridge`, `quay`) mit Baukasten in `src/render/board/wallKit.ts`. Das Deko-Pferd `horse_a` baut `tools/art/props/village.py` (ohne Reittier-Pipeline). Auswahl und Paket im Art-Log 2026-11-11.
- **Besuchshaus `lodge`**: eigenes Modell mit den Zuständen `lodge_intact`, `lodge_visited`, `lodge_razed` (Terrain village, Objekt village); `propFallback` zeigt bis dahin das Haus (`house_*`). Die Kulissenhäuser sind `house_intact` und `house_b/c/d_intact`.

## Bodentexturen (generiert)

`tools/art/ground.py` erzeugt beim `pnpm art:build` die gemalten, kachelbaren 256-px-Texturen des 3D-Bretts nach `public/assets/ground/` (Gras, Erde, Pflaster, Sand, Asche, Flussbett, Mauerkrone, Mauer, Erd- und Felswand, Bohlen, Wasser in 4 Phasen). Sie sind deterministisch und werden nicht eingecheckt. Übergänge zwischen Bodenarten mischt das Brett zur Laufzeit über eine Splat-Map (D6).

## Tiles (`tiles/`)

- **Dual-Grid**: Pro Bodentyp eine Datei `<ground>.png` mit 4 × 4 Kacheln à 48 × 48 (192 × 192). Kachel-Index = Ecken-Bits `TL=1, TR=2, BL=4, BR=8`; Kachel (i % 4, i / 4). Index 0 bleibt leer, Index 15 = voll bedeckt. Nicht bedeckte Bereiche sind transparent, Ränder unregelmäßig, mit Kontur/Kante (z. B. Grasbüschel, Uferlinie).
- Das Dual-Grid liegt um ½ Feld versetzt: Kachel (x, y) des Dual-Grids deckt die Ecken der Felder (x−1, y−1), (x, y−1), (x−1, y), (x, y) ab.
- Zusammensetzen: Schichten in Priorität (unten → oben) `river, shallows, plain, sand, road, grass, ash, wall`. Eine Ecke gilt als bedeckt, wenn das Feld eine Priorität ≥ der Schicht hat. Die unterste Schicht wird voll gezeichnet.
- Animiert: `river_0..3.png`, `shallows_0..3.png` (4 Frames, gleicher Aufbau).
- `decals.png`: Bodendetails à 48 × 48 (Blumen, Steine, Halme …) in einer Zeile, `decals.json` mit `{ "count": n, "ground": ["grass", ...] }` (auf welchem Boden jedes Decal erlaubt ist).
- `objects.png` + `objects.json` für feldgebundene Objekte, die zum Boden gehören: `bridge_h`, `bridge_v`, `fort`, `village`, `village_visited`, `ruins`, `throne`, `gate_closed`, `gate_open`, `mountain`, `rockwall`, `chest_closed`, `chest_open` … (falls nicht als Blender-Requisite).
