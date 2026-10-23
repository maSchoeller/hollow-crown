# Tripo-Test – Kael als 3D-Modell aus dem Turnaround

Test des Bild-zu-3D-Wegs aus `concept/23-art-direction/decision-log.md`: erst im kostenlosen Tarif, nach dem Kauf von Tripo Pro mit Export und Test auf der Prolog-Karte im Spiel.

- **Datum:** 2026-10-23
- **Werkzeug:** Tripo Studio (studio.tripo3d.ai), gesteuert über Claude in Chrome, Konto des Produktinhabers
- **Eingabe:** `art/turnarounds/kael/front.png` (Einzelbild)
- **Quelle im Repo:** `art/models/source/kael_tripo.glb` (Tripo-Export nach Retopologie, 2k-Texturen)
- **Aufbereitung:** `tools/art/prepare_tripo_unit.py` (Blender, headless)

## Schritte

| Schritt | Einstellung | Credits | Ergebnis |
|---|---|---|---|
| Generieren | HD-Modell, „H3.1 – Beste Qualität“ | 55 | 1 990 320 Dreiecke, Textur bis 4k |
| Retopologie | Quad, Smart-Mesh P2.0, 10 000 Polygone | 40 | 10 603 Quads, 9 664 Vertices |
| Export | GLB, Textur 2k | – | 10,4 MB (Grundfarbe, Normal-, Metall-/Rauheitskarte) |
| Aufbereitung | `--faces 6000 --tex 512` | – | 6 000 Dreiecke, nur Grundfarbe 512 px, **0,43 MB** |

```bash
blender -b --factory-startup --python tools/art/prepare_tripo_unit.py -- art/models/source/kael_tripo.glb public/assets/models/units/kael.glb --faces 6000 --tex 512
```

Der Befehl überschreibt die generierte Kael-Figur in `public/assets` (nicht eingecheckt); `pnpm art:build` stellt die Blender-Figur wieder her. In den Asset-Build ist der Tripo-Weg noch nicht eingebunden (Rig und Animationen fehlen).

## Bilder

| Datei | Inhalt |
|---|---|
| `kael_front34.png`, `kael_back34.png`, `kael_back.png` | Tripo-Viewer, HD-Modell (kostenloser Tarif) |
| `ingame_prologue_front.png` | im Spiel, 2k-Textur, noch um 180° verdreht (zeigt deshalb das Gesicht); Kamera für die Aufnahme auf 3 Spalten gezoomt |
| `ingame_prologue_tex512.png` | im Spiel, richtig ausgerichtet, 19 412 Dreiecke, Textur 512 px; 3 Spalten |
| `ingame_prologue_6k_tex512.png` | wie oben, auf 6 000 Dreiecke reduziert; kein sichtbarer Unterschied |
| `ingame_phone_near.png`, `ingame_phone_mid.png` | Handy 390 × 844 in den echten Zoomstufen; Kael rechts oben in der blauen Gruppe |

## Beobachtungen

- **Qualität:** sehr nah an Turnaround und Porträt (Gesicht, Narbe, Strähnen, Rüstung mit Dellen, ausgefranster Umhang). Klar über den bisherigen Blender-Figuren und auf dem Niveau der Karte.
- **Rückseite** stimmig, obwohl nur die Vorderansicht als Eingabe diente.
- **Größe auf dem Brett:** In der Zoomstufe „Nah“ ist eine Figur auf dem Handy rund 40 CSS-Pixel (≈ 120 Gerätepixel) hoch. Dafür reichen 6 000 Dreiecke und eine 512er-Textur, ohne sichtbaren Verlust gegenüber 19 000 Dreiecken und 2k.
- **Zerstückelte UVs:** Die Tripo-Textur besteht aus tausenden kleinen Inseln auf Schwarz. Ohne Auffüllen der Ränder (Edge Padding) blutet das Schwarz beim Verkleinern und im Mipmapping in die Figur, sie wird dunkel. Das Skript füllt die Ränder vor dem Verkleinern auf.
- **Farbraum:** Das Brett rechnet im Gamma-Raum (wie die Vertex-Farben). Der glTF-Lader muss Grundfarb-Texturen deshalb ohne sRGB-Puffer laden (`useSRGBBuffers: false` in `src/render/models.ts`), sonst wird die Figur zu dunkel und zu rot.
- **Ausrichtung:** Tripo-Figuren schauen in Blender nach +Y, die Brettfiguren nach −Y; das Skript dreht um 180°.
- **Noch offen:** Rig und Animationen (Tripo bietet Auto-Rigging für Zweibeiner und Vierbeiner), Teamtuch als eigene Maske (Umhang ist in die Textur gemalt, Blau/Rot fehlt), Feinabgleich von Licht und Toon-Look mit der Karte.
- **Datenschutz:** Das erste HD-Modell entstand im kostenlosen Tarif und ist in der Tripo-Galerie öffentlich. Neue Figuren nur noch privat erzeugen.
- **Lizenz:** Kommerzielle Nutzung ab Pro; Bedingungen vor kommerzieller Veröffentlichung prüfen (GA26).

## Zweiter Durchgang: vereinfachte, geriggte Brettfigur

Auf Wunsch des Produktinhabers ist die Brettfigur bewusst einfacher als das Porträt.

| Schritt | Einstellung | Credits | Ergebnis |
|---|---|---|---|
| Brett-Turnaround | ChatGPT, aus `art/turnarounds/kael/sheet.png` vereinfacht | – | `art/turnarounds/kael_board/` (Seitenansicht gespiegelt als `left.png`) |
| Smart-Mesh | P2.0, Multi-View vorn/links/hinten, Quad 3 000, 4 Varianten, Privat | 0 (Testversion) | Variante 2: 4 202 Quads |
| Textur | Standard | 20 | flache Farbflächen |
| Auto-Rig | Humanoid, Mixamo | 20 | 65 Knochen |
| Animationen | Inaktiv, Gehen, Hieb, Körpertreffer_01, fallen; Export „an Ort und Stelle“ | – | `art/models/source/kael_board_tripo.glb` (2 MB) |
| Aufbereitung | `prepare_tripo_unit.py` (Standard) | – | 6 969 Dreiecke, 512 px, 5 Animationen, 1,2 MB |

```bash
blender -b --factory-startup --python tools/art/prepare_tripo_unit.py -- art/models/source/kael_board_tripo.glb public/assets/models/units/kael.glb
```

- **Im Spiel geprüft:** Idle und Laufen auf der Prolog-Karte. Der Hieb ist in den Brett-Takt geschnitten (Aufprall aus der Handgeschwindigkeit ermittelt).
- **Fehler behoben:** Die Geisterfigur der Zugvorschau hat beim Aufräumen die gemeinsame Textur entsorgt, danach war Kael schwarz (`src/render/models.ts`).
- **Offen:** Schwert in die Hand, Teamtuch-Maske, Animationsdaten verkleinern, Einbindung in `pnpm art:build`.
