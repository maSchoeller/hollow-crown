# Story 15.7: Weltkarte v5 einbinden

Status: done

## Story

Als Spieler
möchte ich die neue Weltkarte von Valmora sehen,
damit Orte und Wege der Geschichte entsprechen.

## Acceptance Criteria

1. **Angenommen** `art/world/map_v5.png` (3276 × 3276) und `art/world/map_places_v5.json`, **wenn** die Weltkarte öffnet, **dann** zeigt sie das v5-Bild statt `map_flat_v1`, ausgeliefert als **3 × 3 Kacheln** (`public/assets/world/valmora_r<r>c<c>.webp`).
2. Die Karte ist auf dem Handy (375 × 812, DPR 3) auch in der nächsten Zoomstufe mit Tipp-Zoom **gestochen scharf**: die Kacheln liefern zusammen die volle Quellauflösung, die Zoomstufen in `render.yaml` sind so gewählt, dass höchstens leicht hochskaliert wird.
3. Die **Orte** stammen aus `map_places_v5.json`: Position, Akt und die Missions-Plätze der Missionsliste (`P`, `1-1` … `3-8`, `N1` … `N10`). Die Knoten von Akt 1 (`prologue`, `m1_1` … `m1_8`, `n1` … `n3`) hängen an den Orten der neuen Folge (`P` Aurenhall, `1-1`/`N1` Varnhold, `1-2` Erlbach, `1-3` Schrein am Weißdorn, `1-4` Wolfshügel, `1-5` Erlenmoor, `1-6`–`1-8` Paktwacht, `N2` Grenzturm, `N3` Tobins Hof). Teilen sich mehrere Knoten einen Ort, steht dort **ein** Stein (offener Knoten vor erledigtem), offene Knoten am selben Ort fächern auf.
4. Die **12 Stadtbilder** aus `art/world/sites/` liegen freigestellt auf ihren gemalten Plateaus (Lage aus `map_places_v5.json`: Mitte, Unterkante, Breite) und skalieren mit der Karte.
5. **Nebel je Akt:** Jede Region hat Flächen (Polygone in Prozent); über den Regionen späterer Akte liegt Nebel mit weichem Rand, auch dort, wo die Grenze nicht waagrecht verläuft (Krähenholm, Aurenhall).
6. **Rückfall statt Lücke:** Eine fehlende Kachel zeigt das Übersichtsbild (`valmora.webp`) darunter; ein fehlendes Stadtbild zeigt ein Ortssymbol auf dem Plateau; fehlt auch das Übersichtsbild, bleibt die Meldung „Karte fehlt“ wie bisher. Ein Knoten ohne Ort bleibt sichtbar (Rückfall auf die Heimat), statt zu verschwinden.
7. **Zustandsvarianten** der Stadtbilder werden nicht gebaut. Das Datenmodell nimmt sie auf (`variants` mit Bild und Bedingungen, erste zutreffende gewinnt, sonst das Grundbild); die Frage steht als offener Punkt im Art-Decision-Log und im PR, ohne Entscheidung.
8. Paket-Budget hält (`pnpm build` grün); die Weltkarte bleibt im Paket `act1` auf Abruf.
9. Belege: Screenshots bei 375 × 812 im Spiel (stumm), vorher und nachher.

## Tasks / Subtasks

- [x] Build (AC 1, 2, 4, 8): `tools/art/build.py build_world` schneidet `map_v5.png` in 3 × 3 Kacheln (je 1092 px, WebP), schreibt das Übersichtsbild `valmora.webp` (1024 px, auch Hintergrund der Aufstellung) und die Stadtbilder `world/sites/<id>.webp` (auf Inhalt beschnitten, Breite nach größter Zoomstufe).
- [x] Datenmodell (AC 3, 5, 7): `content/world/valmora.yaml` neu nach v5; Schema `worldSchema`, Typ `WorldDef`/`WorldPlace` in `src/core/renderDefs.ts`, Prüfungen in `src/content/validate.ts` (Knoten genau einmal, Abstand der Orte, Heimat je Art, Region je Akt, Stadtbild-Bilder und Varianten-Bedingungen).
- [x] Sicht-Rechnung (AC 3, 5, 6, 7): `worldMapView.ts` – `placeOf`, `homeAt`, `stoneOf` (welcher Knoten steht am Ort), `fogAreas`, `siteImage` (Variante); Unit-Tests in `tests/unit/world-map.test.ts`.
- [x] Bildschirm (AC 1–6): `WorldMap.tsx`/`.css` – Übersichtsbild plus Kacheln, Stadtbilder mit Rückfall, Nebel als SVG-Flächen, ein Stein je Ort, Pfade zwischen Orten.
- [x] Zoomstufen in `content/core/render.yaml` für das quadratische Bild.
- [x] Doku: Architektur §5.12 (Weltkarte), Art Direction §6, Art-Decision-Log (Entscheidungen und offener Punkt Varianten).
- [x] Belege und Prüfungen: Screenshots vorher/nachher, `pnpm check`, Code-Review.

## Dev Notes

- **Heute:** `content/world/valmora.yaml` (Bild `map_flat_v1`, 1024 × 1536, 35 Slots + Heimat mit je einem `node`), `WorldMap.tsx` (CSS-Transform über `.wm__picture`, HTML-Steine über `[data-x]`, Nebel als waagrechter Verlauf `fogTop`), `worldMapView.ts` (reine Rechnung, getestet), `Prep.tsx` nutzt `world/${image}` als Hintergrund, `tests/unit/m1-8.test.ts` liest `world.places`. Erhalten: Ziehen, Pinch, Nachgleiten, Tipp-Zoom, Karten der Knoten, Heimsuchungen neben dem Story-Stein, „Akt erscheint bald“ im Nebel, Ladezustand.
- **Nicht anfassen:** `content/acts/act1/maps/` und `campaign.yaml` (PR #104 ersetzt sie, behält Knoten-IDs).
- **Koordinaten:** `map_places_v5.json` misst in 1254er Pixeln; im YAML stehen Prozent (px / 1254 · 100). Stadtbild: `x`, `bottom`, `width` → Fuß `[x %, bottom %]`, Breite in Prozent der Kartenbreite.
- **Stein-Abstand:** bei 375 × 812 ist die Übersicht `cover` (Höhe füllt, Karte 812 px breit); 55 px im 1254er Bild (4,4 % der Breite) ≈ 36 px auf dem Schirm. Prüfung über Orte mit Knoten-Plätzen und die Heimat.
- **Heimat:** Lager vor 1-6 und Burg danach stehen an verschiedenen Stellen (`home.camp`, `home.castle`); die Burg sitzt neben dem Paktwacht-Stein.
- **Nebel:** Polygone in Prozent je Region; SVG im Bildraum (`viewBox 0 0 100 100`, `preserveAspectRatio="none"`), Weichzeichnung per `feGaussianBlur`; Farbe `--hc-fog`.
- **Pakete:** `world/**` liegt als Asset im Paket `act1` (40 MB, Warnung), das Content-YAML im core. Erster Download bleibt unberührt.

### Project Context Rules

- Kein sichtbarer Text im Code (Ortsnamen als `world.place.<id>`-Schlüssel nur, wenn angezeigt); Werte in YAML; Zod-Schema für neue Felder; Code und Schlüssel englisch, Konzepttexte deutsch.
- `src/core` bleibt frei von DOM; `worldMapView.ts` bleibt rein.
- Fertig erst mit `pnpm check` grün.

### References

- `concept/26-epics/epics/epic-15.md` Story 15.7
- `concept/22-narrative/missionsliste-s1.md` Akt 1, `geografie-valmora.md`
- `art/prompts/world_map_v5.md`, `art/world/map_places_v5.json`, `art/world/v5/sites_preview.py`
- `concept/24-architecture/architecture.md` §5.12, `concept/23-art-direction/art-direction.md` §6, `concept/25-ux/DESIGN.md` map-node

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Umgesetzt 2026-11-05: Kacheln + Übersichtsbild, 12 Stadtbilder, Nebel als Polygone, ein Stein je Ort (offene vor erledigten, offene fächern auf), Heimat je Art, Varianten offen (`site.variants`). Zoomstufen 2,2/2,8.
- Stein-Abstand 55 px im 1254er Plan (4,4 % der Breite) statt der zuerst notierten 60 px: Windscharte und Burg-Heimat liegen 59 px auseinander, bei 60 px wären sie zu knapp; bei 375 × 812 ≈ 36 px.
- Code-Review (4 Ebenen): behoben – „erledigt“ kommt aus `completed`, fehlende Variante fällt aufs Grundbild zurück, Ladehinweis zählt fehlgeschlagene Kacheln (`mapNotice`), Nebel blutet über den Bildrand, Tests gegen `map_places_v5.json`, Build-Namen und Zoomstufen, `build.py` robust bei leeren Bildern. Bewusst so gelassen: Prolog-Stein im Nebel von Akt 3 (Flucht nach Süden), alle Kacheln laden mit dem Akt-Paket ohnehin, aufgefächerte Steine nur bei zwei offenen Knoten an einem Ort (in Akt 1 nie), Aufstellungs-Hintergrund nutzt das 1024er Übersichtsbild (weichgezeichnet).
- Belege: `concept/23-art-direction/weltkarte-v5/abnahme.md`.

### File List

- `tools/art/build.py`, `tools/art/worldmap-shots.mjs`
- `content/world/valmora.yaml`, `content/core/render.yaml`
- `src/core/renderDefs.ts`, `src/content/schemas.ts`, `src/content/validate.ts`
- `src/app/screens/worldMapView.ts`, `src/app/screens/WorldMap.tsx`, `src/app/screens/WorldMap.css`
- `tests/unit/world-map.test.ts`, `tests/unit/m1-8.test.ts`
- `concept/24-architecture/architecture.md`, `concept/23-art-direction/art-direction.md`, `concept/23-art-direction/decision-log.md`, `concept/23-art-direction/weltkarte-v5/`
- `art/prompts/world_map_v5.md`, `art/prompts/world_map.md`
