# Story 16.7: Runenwaffen v2 für alle übrigen Waffengruppen

Status: review

## Story

Als Spieler
möchte ich, dass jede Waffe auf dem Brett im neuen Stil mit Fassung und Rinne erscheint,
damit nicht alte und neue Modelle nebeneinander stehen.

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-16.md` Story 16.7 (Zeilen 112-124), Art Direction §4.5 und §4.7.

1. **Angenommen** Story 16.6 und die Entscheidung des Produktinhabers 2026-11-21 (alle Gruppen)
   **Wenn** Bogen, Dolch, Stab, Buch (zugeklappt und aufgeschlagen), Laute und Fokus nach dem Verfahren aus §4.7 entstehen (Baupläne per ChatGPT, Prompt und Abnahme in `art/prompts/`, ein Blender-Skript je Gruppe unter `tools/art/`, Ablage `art/models/weapons-v2/`)
   **Dann** hat jede Gruppe eine Fassung gleicher Größe, eine Rinne entlang ihrer Form mit `fill` und Tönungen für Eisen, Stahl und Silber.
2. Der Produktinhaber hat jede Gruppe an Abnahmebildern (von vorn, Seite, mit Stein I/II/III) abgenommen.
3. Die alten Modelle unter `public/assets/models/weapons/` (Quelle `art/models/weapons/`) sind nicht mehr referenziert und entfernt.

## Tasks / Subtasks

- [ ] **T1 Baupläne per ChatGPT (AC 1)** nach dem Verfahren der Axt (16.6)
  - [ ] T1.1 Je Gruppe ein orthografischer Bauplan (vorn und Seite, neutraler Grund) per ChatGPT über Claude in Chrome, abgelegt in `art/mockups/weapons-2026-11/<gruppe>_blueprint_v1.png` (Muster dort: `axe_blueprint_v1_preview.png`); Prompt-Grundgerüst aus `art/prompts/weapon_rune_concept.md` (Abschnitt „Prompt“) wiederverwenden, Chibi-Stil B8
  - [ ] T1.2 Iterationen **in** `art/prompts/weapon_rune_concept.md` anhängen (heute Iterationen 2-4, Zeilen 20-37): je Gruppe ein Abschnitt „Iteration N: Bauplan <Gruppe> (Datum)“ mit Prompt, Ergebnis, Abnahme/Mängelliste
  - [ ] T1.3 Gruppenform (Rinne folgt der Form, §4.7): Bogen = Wurfarm entlang der Außenkante, Fassung im Griffstück; Dolch = Hohlkehle wie Schwert, Fassung in der Parierstange; Stab = Rinne als Spirale/Linie am Schaft, Fassung im Stabkopf; Buch = Rinne als Prägelinie um den Deckelrand, Fassung in der Deckelmitte; Laute = Rinne am Hals entlang bis zum Wirbelkasten, Fassung im Korpus (Schallloch-Rosette); Fokus = Rinne als Ring um den Kristallhalter, Fassung im Zentrum [ASSUMPTION: Lagen nach Augenmaß, Produktinhaber nimmt am Bauplan ab, bevor modelliert wird]
- [x] **T2 Blender-Skripte (AC 1)** je ein Skript `tools/art/blender_weapon_<gruppe>.py`: `bow`, `dagger`, `staff`, `book`, `lute`, `focus`
  - [x] T2.1 Vorbild `blender_weapon_sword.py` (Klinge) und `blender_weapon_shield.py`/`_lance.py` (laden `blender_weapons_v2.py` per `exec` bis `os.makedirs(OUT`); die neuen Skripte laden ebenfalls per `exec` und **kopieren keine Konstanten** (das Schwert-Skript tut es; nicht nachahmen)
  - [x] T2.2 Helfer aus `blender_weapons_v2.py` nutzen: `setting_parts` (Rim + vier Krallen, Stein-Rahmen: Kuppel +X), `make_socket2`/`finish_socket2`, `add_node`/`local_frame`, `lathe`, `box_bm`, `sweep_groove`/`channel_strip` (Rinne mit UV 1 `fill`), `set_colours`, `shade`, `join`, `make_materials`; Fassung immer mit `SOCKET_R` 0.0258 (gleich groß bei allen Waffen)
  - [x] T2.3 Modellvertrag je Datei (aus 16.6): Metallmesh heißt wie das Modell mit Material `HC_Vertex`; Mesh `rune_channel` mit UV 1 `fill` (0 an der Fassung, 1 am Ende); optional `rune_socket2` (kleine Fassung, Radius 0.55 × `SOCKET_R`, keine Rinne); leere Knoten `socket_rune_a*` (Hauptfassung) und `socket_rune_b*` (kleine Fassung, Knotenmaßstab 0.55); kein `rune_stone`-Platzhalter; Farben als Vertexfarben aus `art/palette/hollow-64.hex`
  - [x] T2.4 Knotennamen: einseitige Gruppen (Bogen, Buch, Fokus, Laute) nur `socket_rune_a`/`socket_rune_b`; beidseitige (Dolch, Stab) `_r`/`_l` wie Axt/Schwert, sonst dreht sich der Stein nicht auf die sichtbare Seite
  - [x] T2.5 Buch in **zwei Zuständen** (§4.5, Kampfhaltung: zugeklappt an der Hüfte, aufgeschlagen auf der flachen Hand): eigene Dateien `book.glb` (zugeklappt) und `book_open.glb` (aufgeschlagen, Seiten zur Figur, Fassung auf dem Einband bzw. der rechten Seite), beide mit denselben Knotennamen und `rune_channel`; das Umschalten gehört zur Kampfhaltung in Story 16.10, hier nur die Modelle und `render.yaml`-Schlüssel `modelOpen` [ASSUMPTION: zwei Dateien statt Shape-Keys, passt zur gebackenen Vertex-Animation]
  - [x] T2.6 Rahmen: Griffpunkt und Achse wie die alten Modelle (Ursprung in der Faust, Griff Blender +Z = glTF +Y; Bogen/Buch/Fokus/Laute an der linken Hand, siehe `render.yaml:256-268`), damit `hold`/`hand`/`motion` unverändert gelten, bis Story 16.9 das Griff-Rig bringt
  - [x] T2.7 Dreiecke je Waffe rund 8 000 (Budget 8 500, wie 16.6; Bogen und Laute dürfen darunter bleiben), im Docstring festhalten; gebaut mit `blender -b --factory-startup --python tools/art/<skript>.py` (oder Blender-MCP)
  - [x] T2.8 Tönung Eisen/Stahl/Silber gleiche Form: keine eigene Geometrie je Metall; die Tönung kommt zur Laufzeit aus `gear.rune.metals` (16.6 T4.6), nur Holz/Leder/Stoff bleiben fest
- [x] **T3 Pipeline und Daten (AC 1)**
  - [x] T3.1 `content/core/render.yaml` `gear.weapons` (Zeilen 256-265): `dagger`, `bow`, `anima`, `light`, `dark` (alle drei `book`), `staff` auf v2; `offHand.lute` (Zeile 268) und neu `offHand.focus` (heute **kein** Eintrag, `crystal_focus` hat `group: focus`, `items.yaml:175`; Fokus wird bisher nicht gezeigt) mit v2-Modellen; Schema-Feld `modelOpen?` nur für Bücher
  - [x] T3.2 `metal` je Item (Feld aus 16.6 T3.3) für die Items dieser Gruppen in `content/core/items.yaml` setzen (Präfix `iron_`/`steel_`/`silver_` → Wert; Items ohne Präfix wie `longbow`, `slim_sword`, `stiletto`, `remedy_staff`: Stahl [ASSUMPTION], Stein/Seltenheit regeln die Fassung, nicht das Metall)
  - [x] T3.3 Laufzeit unverändert aus 16.6 (Rinne, Stein, Glühen, `plan.ts`): hier nur sicherstellen, dass die Knotensuche gruppenunabhängig bleibt (`socket_rune_a*`/`_b*`, keine `if (axe)`-Zweige)
  - [x] T3.4 Zweite Fassung nur für Selten+ (`rarityRuneSlots`, `balance.yaml:321`), wie 16.6 T4.7; Hilfsrune im kleinen Platz
- [x] **T4 Alte Modelle entfernen (AC 3)** vollständige Liste in Dev Notes „Alte Modelle“; erst löschen, wenn T3.1 alle Gruppen umgestellt hat und `pnpm check` grün ist
  - [x] T4.1 `art/models/weapons/*.glb` (9 Dateien) und `tools/art/blender_weapons.py` löschen; `silhouettes.py` auf `weapons-v2` umstellen
  - [x] T4.2 `tools/art/build.py` `build_models` (Zeilen ~103-135): Ordner `weapons` aus der Schleife (Zeile 123), Manifest-Schlüssel `weapons` → in `weapons2`/`runes` (aus 16.6 T2.1) überführen oder zu `weapons` umbenennen, `pieceFolder` (`src/core/defs.ts:405`) und `plan.ts` (Zeilen 24, 79-108) nachziehen, `tools/build/first-mission.mjs:52` Regex bereinigen
  - [x] T4.3 Tests: `tests/unit/pro-parts.test.ts:40-42` (erwartet `pieceFolder === 'weapons'`), `src/app/loading/plan.test.ts:135-152` anpassen; neuer Test: **keine** Referenz auf `models/weapons/` in `render.yaml`, `plan.ts` und `public/` (Suche per `grep` im Test oder in `content:check`)
  - [x] T4.4 Docstrings/Kommentare, die auf `art/models/weapons/` zeigen (`render.yaml:250-251`, `build.py:6-7,106`), aktualisieren
- [ ] **T5 Abnahme (AC 2)**
  - [ ] T5.1 Abnahmebild je Gruppe (Blender-Render oder Dev-Build): vorn, Seite, mit Stein I, II, III (Feuer; `art/models/runes-v2/fire_rune_{1,2,3}.glb`), je Eisen/Stahl/Silber in einer Zeile; Buch zusätzlich zugeklappt und aufgeschlagen; ein Sammelbild je Gruppe in `art/mockups/weapons-2026-11/<gruppe>_v2_preview.png` und im Browser-Fenster zeigen (nie nur „passt“)
  - [ ] T5.2 Sichtprüfung auf dem Brett bei 375 × 812, Spiel stumm (alle Lautstärken 0): Waffe gedämpft, gewählt, Vorschau
  - [ ] T5.3 Produktinhaber nimmt je Gruppe ab; Mängel als Nacharbeit in dieser Story, kein Weiterreichen
- [x] **T6 Prüfung und Doku**: Modell-Test aus 16.6 T6.1 erweitert (jede Datei hat Knoten, UV1, Dreiecke ≤ Budget; jede Gruppe aus `render.yaml` hat eine Datei); `pnpm check` grün; Eintrag im `concept/23-art-direction/art-direction.md.decision-log.md`; `art/prompts/weapon_rune_concept.md` vollständig

## Dev Notes

### Vertrag aus Story 16.6 (nicht neu erfinden)

- Modellvertrag, Knoten und Rahmen: Docstring `tools/art/blender_weapons_v2.py:1-37` (Parts, Stone nodes, STONE NODE CONVENTION). Setting-Kit `blender_weapons_v2.py:227-285` (`PRONG_SIZE`, `SOCKET2_F` 0.55, `STONE_SINK`, `CH_LIFT`, `setting_parts`, `make_socket2`), Konstanten `FACE`/`SOCKET_R`/`FLOOR` in Zeilen ~297-300, Rinne `sweep_groove`/`channel_strip` (Zeilen ~355, ~523).
- Laufzeit (16.6 T4/T5): `src/render/shared/models.ts` `attachGear` (~219-262; Material je Mesh-Suffix `rune_channel`/`rune_stone`), neues `runeGlow.ts`, `gear.rune` in `render.yaml` (Elementfarben, `dim`, `full`, Puls, `metals`), `Overlays.glow` (`src/render/board/overlays.ts:14`). Diese Story ändert daran nichts, sie liefert nur Modelle und Datenzeilen.
- Reihenfolge: 16.6 muss gemerged sein (oder dieser Branch auf 16.6 aufsetzen), sonst fehlen Laufzeit und `metal`-Feld.

### Gruppen und ihre Items (Bestand)

- `render.yaml:256-268`: `sword`, `dagger`, `lance`, `axe`, `bow` (hand left, motion shoot), `anima`/`light`/`dark` → `book` (left, cast), `staff` (right, cast); offHand `shield`, `lute`. **Fokus fehlt** in `render.yaml` (`crystal_focus`, `items.yaml:175`, `kind: accessory`, `group: focus`): neuer Eintrag nötig, sonst bleibt der Fokus unsichtbar.
- Bogen-Items: `iron_bow`/`steel_bow`/`longbow`; Armbrüste (`bounty`, `wasp_sting`) laufen in Gruppe `bow` (Modell bekommt ein Querstück erst in Story 16.8). `ballista_bolt` (`group: siege`, Tag `fixed`) ist ein Geländeobjekt, kein Ausrüstungsstück: hier **nicht** umstellen.
- Bücher: ein Modell für `anima`, `light`, `dark`; Elementfarbe kommt von der Rune, nicht vom Modell [ASSUMPTION: ein Buchmodell für alle drei Schulen, Einband in Stahl/Eisen/Silber getönt].

### Alte Modelle (zum Entfernen, T4)

- Dateien: `art/models/weapons/{axe,book,bow,dagger,lance,lute,shield,staff,sword}.glb` (erzeugt von `tools/art/blender_weapons.py`); nach `public/assets/models/weapons/` kopiert von `build.py:123-135` (Ordner existiert nur nach `pnpm art:build`, im Worktree nicht vorhanden).
- Referenzen: `content/core/render.yaml:250-268`; `src/app/loading/plan.ts:24,79-108`; `src/core/defs.ts:379-406` (`pieceFolder` unterscheidet `weapons`/`parts`, die Anhängeteile der Profi-Wege unter `art/models/parts/` bleiben!); `tools/art/build.py:6-7,106-135`; `tools/art/silhouettes.py:28,47,104-112` (Umrisse aus den alten Waffen); `tools/build/first-mission.mjs:8,52`; Tests `tests/unit/pro-parts.test.ts:40-42`, `src/app/loading/plan.test.ts:135-152`.
- `public/assets/models/weapons/` selbst wird nicht eingecheckt (Build-Ausgabe); „entfernt“ heißt: Quelle, Skript, Kopierschritt und Manifesteintrag sind weg.

### Verfahren und Dateien

- Prompts: `art/prompts/weapon_rune_concept.md` (37 Zeilen, Gliederung `grep -n '^#'`; Iterationen 2-4 vorhanden); Baupläne `art/mockups/weapons-2026-11/`. Bilder per ChatGPT über Claude in Chrome (AGENTS.md „Konventionen“), nicht nach jedem Schritt Screenshot, auf das Ergebnis warten; Waffen **nie** mit Tripo (Art Direction §4.7 „Produktion“).
- Blender-Skripte teilen Code per `exec` (Lanze, Schild); neue Skripte genauso, damit eine Änderung an `SOCKET_R`/Krallen überall wirkt.
- Zeichenstil runder Chibi (B8), Palette `art/palette/hollow-64.hex`, Eisen warm grau, Stahl kühler/heller, Silber fast weiß (§4.7 „Material“).

### Bundle und Budget

- v2-Waffen roh rund 250 KB je Stück (16.6 gemessen: Axt 248 572 B, gzip rund 38 %). Sechs neue Gruppen (Buch doppelt) bringen rund 2 MB roh / 0.8 MB gzip; die alten 9 Dateien (6-8 KB) entfallen. Erstdownload-Ziel 12 MB (`content/packs.yaml:15,37`), `tools/check-bundle-size.mjs` ausführen und Zahlen in die Completion Notes; bei Überschreitung nur die in der ersten Mission benutzten Gruppen in den Erstdownload (`first-mission.mjs`).
- Kein Regelcode, kein Speicherformat, keine Replays betroffen: `SAVE_FORMAT` bleibt.

### Project Context Rules (AGENTS.md)

- Werte nie im Code (`render.yaml`/Content-YAML), kein sichtbarer Text im Code, Zod-Schema und Typ zusammen ändern (`src/content/schemaRender.ts`, `src/core/defs.ts`), Commits/Bezeichner Englisch, Doku Deutsch.
- Fertig erst mit `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` (`pnpm check`); PNG/GLB unter `art/` liegen in Git LFS (`git lfs pull` im frischen Worktree).
- Entscheidungen ins `.decision-log.md` von `concept/23-art-direction/`, nie in `01-decisions.md`. Offene Fragen nicht stillschweigend entscheiden: [ASSUMPTION]-Punkte oben beim Produktinhaber gebündelt abfragen.

### References

- [Source: concept/26-epics/epics/epic-16.md#Story 16.7] · [concept/23-art-direction/art-direction.md §4.5 Animationen, §4.7 Runenwaffen]
- Vorgänger `_bmad-output/implementation-artifacts/16-6-runenwaffen-v2-im-spiel-axt-schwert-lanze-schild.md`; Nachfolger 16.8 (Signaturen), 16.9 (Griff-Rig), 16.10 (Ruhe/Kampfhaltung, schaltet Buch auf)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Completion Notes (Nachtlauf 2026-11-22)

- Sieben Modelle (Bogen, Dolch, Stab, Buch zu und auf, Laute, Fokus) unter `art/models/weapons-v2/`, Skripte `tools/art/blender_weapon_<gruppe>.py` mit gemeinsamem `blender_weapons_v2_kit.py`; alte Modelle `art/models/weapons/` und `tools/art/blender_weapons.py` entfernt.
- Ohne ChatGPT-Baupläne gebaut (ChatGPT nachts nicht erreichbar), Vorlage die gemalten Item-Icons [ASSUMPTION]; Protokoll `art/prompts/weapon_rune_concept.md` Iteration 5.
- `render.yaml`: alle Gruppen auf v2, `offHand.focus` neu, `modelOpen: book_open` für Bücher (Umschalten in 16.10).
- Prüfung: lint, content:check, build grün; Vitest unter Last mit 8 Zeitüberschreitungen, die Dateien allein grün. Erstdownload 14,45 MB (Ziel 12, Budget 30).
- Abnahme durch den Produktinhaber offen: Bild `s4-16-7-modelle.png`, Brett `s4-16-7-brett.jpg`.
- Folgepunkte aus dem Review: `gearPiece` im Schema nicht `.strict()`; kein Test für den Metall-Standard und für Bücher/Stäbe ohne kleine Fassung; `book_open` wird erst mit 16.10 geladen.

## Review 2026-11-27

**Urteil: GAPS.** Modelle, Daten und Aufräumen sind auf `main`: sieben v2-Modelle in `art/models/weapons-v2/` (bow, dagger, staff, book, book_open, lute, focus), `render.yaml:276-289` mit `offHand.focus` und `modelOpen`, `art/models/weapons/` und `tools/art/blender_weapons.py` entfernt, Test „nothing references the old library“ (`tests/unit/rune-models.test.ts:64`). Offen:
- AC 1: keine ChatGPT-Baupläne für die sechs Gruppen (`art/mockups/weapons-2026-11/` hat nur axe/lance/shield/sword; `art/prompts/weapon_rune_concept.md:39` Iteration 5 „ohne ChatGPT-Bauplan“).
- T5.1: keine `<gruppe>_v2_preview.png` in `art/mockups/weapons-2026-11/` (Bilder nur im Notizordner des Nachtlaufs).
- AC 2: Abnahme je Gruppe durch den Produktinhaber steht aus.
