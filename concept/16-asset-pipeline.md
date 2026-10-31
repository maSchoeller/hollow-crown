# 16 – Asset-Pipeline & Budgets

> Wie Grafik und Audio entstehen, wo sie liegen, wie sie ins Spiel kommen. Stil: `23-art-direction/art-direction.md`. Audio-Inhalte: `17-audio.md`.

## 1. Überblick

```
                ┌──────────────────────────┐
  Briefing ───▶ │ ChatGPT (Bild-KI)        │──▶ Konzept, Porträts, Cut-ins, VN-Hintergründe,
  (15-art)      │ über Chrome gesteuert     │    Key Art, Tile-Entwürfe
                └──────────────────────────┘
                              │ Referenzbild (Front/Seite)
                              ▼
                ┌──────────────────────────┐
                │ Blender 5.x (lokal, MCP)  │──▶ Chibi-Figuren, Requisiten
                │ Sprite-Rig + Toon-Shader  │    rendern: Farbe + Normal + Teammaske
                └──────────────────────────┘
                              ▼
                ┌──────────────────────────┐
                │ tools/art/ (Python)       │──▶ Palette quantisieren, Umriss, Ebenen
                │ pixelize · compose · pack │    kombinieren, Atlas packen, Manifest
                └──────────────────────────┘
                              ▼
     content/sprites/*.yaml (Manifest, Zod)  +  public/assets/<chapter>/… (PNG/WebP)
                              ▼
                ┌──────────────────────────┐
                │ Babylon-Renderer          │  nearest, Palettentausch-Shader,
                │ (src/render)              │  Licht-Layer, Partikel
                └──────────────────────────┘
```

Audio läuft parallel: ElevenLabs (MCP oder API) → `tools/audio/` (Normalisieren, Schneiden, Kodieren) → `public/assets/audio/…` + `content/audio/*.yaml`.

## 2. Ordnerstruktur

```
art/                          ← Quellen (Git LFS), nicht im Build
  palette/hollow-64.hex
  blender/
    rig/hc_chibi_rig.blend    (gemeinsames Rig + Animationen)
    units/<unitOrClass>.blend
    props/<prop>.blend
    render/hc_sprite_render.blend  (Kamera, Licht, Compositor)
  tiles/<terrain>.aseprite|png
  portraits/<character>/<mood>.png        (Master, 1536 px hoch)
  cutins/<character>.png
  backgrounds/<id>.png                     (2560×1440)
  prompts/<asset>.md                       (Prompt + Referenzen + Datum, für Reproduzierbarkeit)
audio-src/                    ← Roh-Audio (Git LFS)
tools/art/                    ← Python-Skripte (pixelize, compose, pack), laufen in Blender oder CPython
tools/audio/
content/sprites/units.yaml  props.yaml  tiles.yaml  fx.yaml
content/audio/voices.yaml  barks.yaml  sfx.yaml  music.yaml
public/assets/                ← generiert, NICHT von Hand bearbeiten
```

`pnpm art:build` erzeugt `public/assets` und die Manifeste. `pnpm content:check` prüft, dass jede referenzierte Sprite-/Audio-ID existiert.

## 3. Bild-KI (ChatGPT)

- **Zugang:** ChatGPT-Abo des Produktinhabers, gesteuert über Claude in Chrome. Jeder Download wird vom Produktinhaber bestätigt.
- **Konsistenz:**
  1. Zuerst pro Figur ein **Referenzblatt** (Front, ¾, Rücken, Farbfelder, Signaturdetail).
  2. Jedes weitere Bild der Figur wird **mit diesem Referenzblatt als Bildanhang** erzeugt.
  3. Stimmungen werden als **Bearbeitung des neutralen Porträts** erzeugt („gleiche Pose, nur Gesichtsausdruck …“), nicht neu generiert.
- **Prompt-Grundgerüst** (Englisch, weil die Modelle so stabiler sind):
  ```
  Anime character illustration, clean cel shading with two shadow tones and one soft gradient,
  clean medium-weight colored line art (dark brown lines), bright saturated but grounded palette,
  slightly mature facial proportions, high fantasy, half-body portrait, facing slightly left,
  plain transparent/white background, rim light in {factionColor}.
  Character: {briefing aus 15 §6.3}. Signature detail: {signature}. Mood: {mood}.
  ```
- **Nachbearbeitung:** Hintergrund freistellen, auf Master-Größe bringen, Farbkorrektur gegen Fraktionsfarben, als PNG in `art/` ablegen. Prompt und Referenzen in `art/prompts/` festhalten.
- **Rechte:** Laut OpenAI-Nutzungsbedingungen gehören die Ausgaben dem Nutzer. Vor Store-Release prüfen wir das erneut und dokumentieren es in `01-decisions.md`. Keine Prompts mit Namen lebender Künstler oder geschützter Figuren.

## 4. Blender → Pixel-Sprites

### 4.1 Modell & Rig

- **Ein gemeinsames Chibi-Rig** (`hc_chibi_rig.blend`) für alle humanoiden Klassen: ca. 2,5 Köpfe, einfache Körperteile. Low-Poly (300–1500 Dreiecke), keine Texturen, nur **flache Materialfarben**.
- Materialien tragen eine **Rolle** statt nur einer Farbe: `skin`, `hair`, `cloth_a`, `cloth_b`, `metal`, `leather`, `team` (Teamtuch), `glow`. Die Rolle steuert Palette und Teamtausch.
- Klassen und Figuren sind **Varianten** auf demselben Rig (Kopf, Haare, Rüstungsteile als austauschbare Objekte). Waffen sind eigene Objekte an einem Hand-Knochen.
- Eigene Rigs nur für Pegasus und Drache.

### 4.2 Render-Aufbau

- **Kamera:** orthografisch, Elevation **30°** (Figuren leicht von vorn, passend zur FE-Konvention in `15` §2), Ortho-Größe so, dass 1 Blender-Einheit = 32 px.
- **Engine:** EEVEE, **Filtergröße 0 px** (kein Antialiasing), Auflösung exakt Zielgröße (32 × 32 bzw. 48 × 48) oder 4× mit anschließender Mehrheits-Verkleinerung, falls feine Details verschwinden. Das wird im Pixel-Beweis verglichen.
- **Shader:** Toon über `Shader to RGB` → `Color Ramp` (3 Stufen: Schatten, Mitte, Licht), feste Lichtrichtung von oben links.
- **Durchgänge (Passes) pro Frame:**
  1. **Farbe** (Toon)
  2. **Normal** (für die Lichtschicht, ebenfalls quantisiert)
  3. **Teammaske** (Material-Rolle `team` als Graustufen-Index für die 4-stufige Rampe)
- **Ebenen:** Körper und Waffe werden **getrennt** gerendert (Holdout), damit `compose` zur Build-Zeit Klasse × Waffenart kombinieren kann.

### 4.3 Nachbearbeitung (`tools/art/pixelize.py`)

1. Alpha binarisieren (Schwelle 50 %), keine halbtransparenten Pixel.
2. Farben auf **Hollow-64** abbilden (nächste Farbe im OKLab-Farbraum), max. 16 Farben pro Figur prüfen.
3. **Farbige Außenlinie**: 1 px um die Silhouette, dunkelste Stufe der angrenzenden Rampe.
4. Teamtuch: Pixel aus der Teammaske werden auf die **Schlüssel-Rampe** gesetzt (4 reservierte Farbwerte), die der Shader zur Laufzeit in Blau/Rot/Grün tauscht.
5. Ausgabe: Frames als PNG + Normal-Frames + JSON (Ankerpunkt, Dauer).

### 4.4 Animationen (FE-Set, V1)

| Animation | Richtungen | Frames | fps | Hinweis |
|---|---|---|---|---|
| `idle` | Süd | 4 | 6 | Ping-Pong, „Atmen“ |
| `walk` | Süd, Nord, Ost (West gespiegelt) | 4 | 10 | |
| `attack_<waffenart>` | Ost (West gespiegelt), Süd, Nord | 6 | 12 | Ausholen, Schlag (Treffer-Frame markiert), Zurück; 48-px-Frames |
| `cast` | Süd | 4 | 10 | für `tome`/`staff` statt `attack` |
| `hit` | Süd | 2 | 12 | |
| `downed` | – | 1 | – | |
| `exhausted` | – | = `idle` Frame 1 | – | entsättigt per Shader |

Ungefährer Umfang pro Klasse und Waffenart: 4 + 12 + 18 + 2 + 1 ≈ **37 Frames** à 32–48 px. Bei 18 Klassen × Ø 1,5 Waffenarten sind das rund 1 000 Frames. Ein Atlas pro Kapitel bleibt unter 1 MB.

Der **Treffer-Frame** der Angriffsanimation wird im Manifest markiert. Der Renderer löst das `AttackStrike`-Event (Blitz, Zahl, Ton) genau auf diesem Frame aus.

### 4.5 Requisiten & Gelände

- Requisiten (Häuser, Türme, Truhen, Ballisten, Tore, Brücken, Bäume) werden mit demselben Render-Setup gerendert, aber ohne Animation. Zustände sind getrennte Frames (z. B. `chest_closed`, `chest_open`).
- **Boden-Tiles** werden **nicht** aus Blender gerendert. Sie entstehen als Pixel-Tileset (KI-Entwurf → nachgepixelt in Aseprite/LibreSprite) im **Dual-Grid-Autotiling**: 16 Kacheln pro Geländepaar statt 47, gezeichnet wird auf einem um ½ Feld versetzten Raster. Das ist einfacher zu zeichnen, und die Logik bleibt beim Rasterfeld.
- Wasser, Feuer und Fackeln sind Frame-Animationen (4–6 Frames).

## 5. Manifest-Format (Beispiel)

```yaml
# content/sprites/units.yaml
- id: kael
  base: captain                 # Klassenmodell, Kopf-/Haar-Variante „kael“
  frame: [32, 32]
  anchor: [16, 28]              # Fußpunkt
  palette: { hair: hair_brown, cloth_a: ash, cloth_b: leather, metal: steel }
  teamRamp: true
  weapons: [sword, lance]       # erzeugt kael.sword.*, kael.lance.*
  anims:
    idle:        { dirs: [s], frames: 4, fps: 6, loop: pingpong }
    walk:        { dirs: [s, n, e], frames: 4, fps: 10, loop: true }
    attack:      { dirs: [s, n, e], frames: 6, fps: 12, hitFrame: 3, frame: [48, 48] }
    hit:         { dirs: [s], frames: 2, fps: 12 }
    downed:      { dirs: [s], frames: 1 }
  portrait: kael                # → art/portraits/kael/<mood>.png
  cutin: kael
```

## 6. Formate & Kompression

| Asset | Laufzeitformat | Begründung |
|---|---|---|
| Pixel-Atlanten (Sprites, Tiles, FX) | **PNG, verlustfrei**, indiziert wo möglich, max. 2048² | Pixel-Art verträgt keine verlustbehaftete oder GPU-Blockkompression |
| Normal-Atlanten | PNG verlustfrei | |
| Porträts | **WebP q85** mit Alpha, Anzeigegröße 768 px Höhe (Stufe Hoch: 1152 px) | ca. 60–120 KB pro Bild |
| Cut-ins | WebP q85, 1600 × 600 | |
| VN-Hintergründe | WebP q80 bzw. AVIF, 1920 × 1080 (Stufe Hoch: 2560 × 1440) | ca. 150–300 KB |
| Musik | **Opus 96 kbit/s** (`.webm`), Fallback **AAC 128 kbit/s** (`.m4a`) für ältere Safari-Versionen | Loop-Punkte im Manifest |
| Stimmen | Opus 64 kbit/s mono | |
| SFX | Opus 96 kbit/s mono, **Audio-Sprite** pro Kategorie | wenige Requests |

## 7. Rendering in Babylon (Ergänzung zu `10` §5)

> **Stand 3D-Brett** (`01-decisions.md` D1–D18). Der folgende Abschnitt beschreibt die abgelöste Pixel-Draufsicht. Heute gilt:
> - **Modelle**: `tools/art/export_models.py` exportiert aus den Blender-Bauskripten pro Figur **ein Mesh mit Skelett** (ein Knochen je Gelenk und Effekt-Teil, Animationen idle/walk/attack/hit/downed) und pro Requisiten-Zustand ein statisches Mesh; Bäume und Felsen werden beim Export auf rund ein Drittel der Dreiecke reduziert. Farben als Vertexfarben, Teamtuch im Vertex-Alpha (Details `art/README.md`).
> - **Boden**: `tools/art/ground.py` erzeugt beim `art:build` die gemalten 256-px-Texturen; das Brett mischt sie über eine Splat-Map.
> - **Zeichnen**: Requisiten als Thin Instances (ein Aufruf je Modell), Landschaft außerhalb der Karte ohne Schattenwurf, Figuren mit GPU-Skinning (ein Aufruf je Figur). Bildrate gedeckelt: `render.yaml board.fpsActive` bei Bewegung, `fpsIdle` in Ruhe.
> - **Software-WebGL** (kein Grafikchip) wählt automatisch „Niedrig“ mit halber Auflösung (D17).

- Orthografische Draufsicht. **Zoomstufen ganzzahlig**: Skalierung `s ∈ {2, 3, 4, 5, 6} / devicePixelRatio`, ein Pinch rastet auf die nächste Stufe ein (mit kurzer weicher Überblendung). Kameraposition wird auf ganze Bildpixel gerundet.
- Alle Texturen `NEAREST_SAMPLINGMODE`, keine Mipmaps für Pixel-Atlanten.
- Einheiten, Requisiten und Tiles als **Thin Instances** mit einem eigenen `ShaderMaterial` (Atlas-UV pro Instanz). Funktionen im Shader:
  - Palettentausch der Team-Rampe
  - Entsättigen (erschöpft / niedergestreckt)
  - Weiß-Blitz (Treffer)
  - Umriss-Highlight (ausgewählt / Ziel)
  - Normal-Map-Beleuchtung
- **Lichtschicht:** Ambientfarbe + bis zu **16 Punktlichter** pro Bild (Uniform-Array). Stufe Niedrig: nur Ambient und unbeleuchtete Sprites.
- **Partikel:** eigener, schlanker Partikel-Emitter (Thin Instances), Positionen auf Pixelraster gerundet. Kein GPU-Partikelsystem nötig.
- **Bloom:** Babylon `DefaultRenderingPipeline` nur auf Stufe Hoch, Schwelle hoch, nur Feuer/Magie überschreiten sie.
- Render-on-demand bleibt (`10` §5). Animationen (Idle, Wasser, Feuer) laufen mit **10–12 fps Takt**, nicht 60 fps, damit der Akku geschont wird.

### 7.1 Gebackene Vertex-Animation (Story 7.8)

Tripo-Brettfiguren (22 Gelenke) bekommen beim Bau (`pnpm art:tripo`, `tools/art/bake_vat.py`) neben der GLB eine `<id>.vat`: alle Clips mit 60 Bildern/s, lokale Pose je Zeile, gzip-komprimiert. Zur Laufzeit erzeugt ein Web Worker per Vorwärtskinematik die Matrix-Textur für Babylons `BakedVertexAnimationManager`; Waffen-Sockets kommen aus derselben Rechnung. Die `.vat` zählt zum Figurenbudget (≤ 0,5 MB Transfer mit Modell, `tools/figure-budget.mjs`) und liegt im selben Paket wie die GLB. Blender-Figuren bleiben auf dem Skelettpfad.

## 8. Qualitätsstufen

Automatisch nach Gerät gewählt (GPU-Tier und Speicher-Heuristik), in den Optionen änderbar.

3D-Brett: Render-Auflösung, Schattenkarte und Punktlichter je Stufe stehen in `content/render.yaml` (`quality`, `board.lightsMax`); auf „Niedrig“ keine Schatten und Landschafts-Requisiten nur nahe der Karte. Die Tabelle gilt weiter für Porträts, Hintergründe und Audio.

| Stufe | Licht | Bloom | Partikel | Porträts | Hintergründe | Audio |
|---|---|---|---|---|---|---|
| Niedrig | nur Ambient | aus | 30 % | 768 px | 1280 × 720 | Musik 64 kbit/s |
| Mittel (Standard) | Ambient + 8 Lichter, Normal-Maps | aus | 70 % | 768 px | 1920 × 1080 | 96 kbit/s |
| Hoch | Ambient + 16 Lichter, Normal-Maps | an | 100 % | 1152 px | 2560 × 1440 | 96 kbit/s |

## 9. Größenbudget (präzisiert T8)

| Paket | Inhalt | Budget (gzip/komprimiert) |
|---|---|---|
| **Shell + Prolog** (initialer Download) | Code, UI-Schriften und -Icons, Tiles Prolog, Einheiten Prolog, Porträts der 4 Prolog-Figuren, 2 Hintergründe, Musik Titel + Prolog-Kampf, SFX-Grundset | **< 30 MB** (mit den Dateien der ersten Mission im Precache, erwartet ~11 MB) |
| Kapitel-Paket je Kapitel | Tiles/Requisiten, neue Einheiten, Porträts, Hintergründe, Musik, Stimmen | 5–15 MB |
| Akt 1 gesamt (Stufe Mittel) | | ca. 80–120 MB |

- Kapitel-Pakete werden **beim Betreten der Weltkarte im Hintergrund vorgeladen** und vom Service Worker offline gecacht (Workbox, eigener Cache pro Paket).
- CI prüft das Budget der Shell (Build schlägt fehl bei > 30 MB; Entscheidung 2026-10-25, Architektur-Decision-Log).

## 10. Benennung

- IDs englisch, `snake_case`, identisch mit Content-IDs: `kael`, `captain`, `iron_sword`, `village`, `ch01_varnhold`.
- Dateien: `<id>.<variant>.<anim>.<dir>.png` in der Quelle; im Build nur Atlanten `units_<chapter>.png` + JSON.
- Stimmungen: `neutral|happy|angry|sad|surprised|hurt` (wie `08` §7).

## 11. Versionierung (Git LFS)

`.gitattributes` (anlegen in M0):

```
*.blend        filter=lfs diff=lfs merge=lfs -text
*.blend1       export-ignore
*.aseprite     filter=lfs diff=lfs merge=lfs -text
*.psd          filter=lfs diff=lfs merge=lfs -text
*.wav          filter=lfs diff=lfs merge=lfs -text
*.flac         filter=lfs diff=lfs merge=lfs -text
*.mp3          filter=lfs diff=lfs merge=lfs -text
art/**/*.png   filter=lfs diff=lfs merge=lfs -text
```

`public/assets/` ist generiert und wird **nicht** eingecheckt (`.gitignore`). Die CI baut es mit `pnpm art:build` aus `art/`. `*.blend1` (Blender-Backups) kommt in `.gitignore`.

## 12. Art-Track (parallel zu M0–M7)

| # | Art-Meilenstein | Ergebnis | Benötigt für |
|---|---|---|---|
| A0 | Pipeline-Beweis | Palette Hollow-64, Render-Setup, `pixelize`, Kael idle/walk/attack, Varnhold-Ausschnitt (Beispiel am 2026-10-24 aus dem Repo entfernt, abrufbar in der Git-Historie unter `concept/art/`) | M2 (Sprite-Format fix) |
| A1 | Prolog komplett | Tileset Sommer, Requisiten Paktnacht (Glutdom, Lager unterwegs), 4 Helden + Tempelwache, Porträts ×6 Stimmungen, 2 Hintergründe, Cut-ins Kael/Brenna | M3 |
| A2 | UI-Kit | Icons, Rahmen, Schriften, Kampfvorschau, Dialogfenster, Lager | M4/M5 |
| A3 | Kapitel 1–2 | Brand/Asche, Schrein, Mira, Liora, Varek, Hask, Morra, Lichtschicht | M6 |
| A4 | Kapitel 3–5 | Nacht/Regen, Festung, Nebel, Ysolde, Sable, Ulvric, Cassian, Pegasus, Jungdrache | M6 |
| A5 | Politur | Key Art, Titel, Kapitelkarten, Weltkarte, VFX-Feinschliff, Qualitätsstufen | M7 |

### 12.1 Erkenntnisse aus dem Pipeline-Beweis A0 (2026-10-22)

Beispiel und Skripte (`concept/art/pipeline/`, Ergebnisse in `concept/art/sprites/`, Blender-Datei `concept/art/blender/hc_pixel_proof.blend`) sind am 2026-10-24 aus dem Repo entfernt und nur noch in der Git-Historie abrufbar.

| Erkenntnis | Konsequenz |
|---|---|
| Ein komplettes Figuren-Sheet (37 Frames, FE-Set) ist als PNG **≈ 10 KB** groß | Sprites spielen im Größenbudget keine Rolle; das Budget gehört Porträts, Hintergründen und Audio |
| Render-Zeit ≈ 0,4–1,5 s pro Frame und Durchgang (EEVEE, 4-fach) | Eine Klasse mit allen Waffenarten rendert in wenigen Minuten. Kein Render-Farm-Bedarf |
| 4-fach rendern + Mehrheits-Verkleinerung liefert saubere Formen ohne Antialiasing-Krümel | als Standard übernehmen (§4.2) |
| Globale „nächste Farbe“ ergibt bis zu **20 Farben** pro Figur (Ziel ≤ 16) | `pixelize` muss **pro Materialrolle auf deren feste Rampe** quantisieren statt global |
| Waffen in realistischer Größe sind auf 32 px unsichtbar; Stahlklinge verschwindet vor Stahlrüstung | Chibi-Waffen **übergroß** (Klinge ≈ halbe Figurhöhe), eigene helle Rolle `blade` |
| Ein starres Arm-Waffe-Gelenk ergibt keinen lesbaren Hieb | Rig braucht einen **Handgelenk-Knochen** für die Waffe |
| Teamtuch auf der hellsten Stufe wirkt pastellig | Toon-Licht → Team-Mitte, Schatten → dunkle Stufe; hellste Stufe nur als Glanzlicht |
| Normal-Maps aus Blender beleuchten die Figuren am Feuer glaubwürdig | Lichtschicht wie in §7 umsetzen; Stufe Niedrig ohne Normal-Maps bleibt lesbar |
| Prozedurale Boden-Platzhalter mit verzahnten Rändern wirken überraschend gut | Brauchbar als `art:placeholder` für Gelände, bis das Tileset (A1) steht |

Code-Meilensteine arbeiten bis zur Lieferung mit **Platzhalter-Sprites im finalen Format** (gleicher Frame, Anker und Manifest). Die Platzhalter erzeugt `pnpm art:placeholder` (farbiges Rechteck + Klassen-Icon + Teamtuch-Rampe).
