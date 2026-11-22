# Story 16.6: Runenwaffen v2 im Spiel (Axt, Schwert, Lanze, Schild)

Status: review

## Story

Als Spieler
möchte ich die Rune als Teil der Waffe sehen, eingelassen ins Metall und nach Stufe leuchtend,
damit ich Runen auf einen Blick erkenne.

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-16.md` Story 16.6 (Zeilen 97-111), Art Direction §4.7.

1. **Angenommen** die Modelle aus `art/models/weapons-v2/` und `art/models/runes-v2/` und Art Direction §4.7
   **Wenn** sie über die Asset-Pipeline (`pnpm art:build`, `render.yaml`) die alten Gruppenmodelle für Axt, Schwert, Lanze und Schild ersetzen, der Füllwert `fill` der Rinne die Stufe zeigt (I ein Drittel, II zwei Drittel, III ganz mit Puls) und der Runenstein der eingesetzten Rune in der Fassung sitzt
   **Dann** glimmen Runenwaffen auf dem Brett gedämpft, leuchten bei der gewählten Figur und bei Angreifer und Ziel der Kampfvorschau voll, und Gegnerwaffen leuchten genauso.
2. Eisen, Stahl und Silber unterscheiden sich durch Tönung bei gleicher Form; Selten und besser zeigen die zweite, kleine Fassung im Modell.
3. Die offenen Punkte der Abnahme sind nachgearbeitet und vom Produktinhaber abgenommen: Schild nicht mehr einheitlich beige, Steinstufen I und II von vorn unterscheidbar, Krallen größer, Axt-Tülle weniger kastig, Tiefenversatz gegen das Flimmern von Rinne und Stein.
4. Je Waffe rund 8 000 Dreiecke, je Stein unter 2 000; das Paket-Budget hält.

## Tasks / Subtasks

- [ ] **T1 Modelle nacharbeiten (AC 3, 2)** in `tools/art/blender_weapons_v2.py` (Axt), `blender_weapon_sword.py`, `blender_weapon_shield.py`, `blender_weapon_lance.py`, danach neu bauen
  - [ ] T1.1 Schild: Platte nicht einheitlich beige, Farbfelder/Rand/Buckel absetzen (`RIM_D/RIM_L` in `blender_weapon_shield.py`, Palette `art/palette/hollow-64.hex`)
  - [ ] T1.2 Krallen (vier Prongs) größer in allen vier Skripten; die Fassung bleibt bei allen Waffen gleich groß (`SOCKET_R` 0.0258, `FACE`/`FLOOR`, siehe Art Direction §4.7), also Prong-Maße im Axt-Skript ändern; Lanze erbt über `exec`, Schwert hat Kopien der Konstanten (dort nachziehen)
  - [ ] T1.3 Axt-Tülle weniger kastig (Fase/Rundung am Übergang Blatt-Stiel im Axt-Skript)
  - [ ] T1.4 Zweite, kleine Fassung (Selten+, ohne Rinne) in jedes Waffenmodell bauen, als eigenes Objekt/Gruppe `rune_socket2` (Rim + vier kleine Krallen, Radius rund 0.55 × `SOCKET_R`), Lage je Waffe: Axt Blatt nahe Stiel, Schwert Parierstange (Seite), Schild Rand/Buckelfuß, Lanze Tülle unterhalb der Hauptfassung [ASSUMPTION: Lage nach Augenmaß, Produktinhaber nimmt ab]
  - [ ] T1.5 Sockel-Knoten: Heute gibt es **keine** leeren Knoten für die Fassungen (siehe Dev Notes). Je Waffe leere Knoten `socket_rune_a` (Hauptfassung, Axt/Schwert/Lanze je ein Knoten je Seite: `socket_rune_a_l`/`_r`; Schild nur `_a`) und `socket_rune_b` exportieren; die Platzhalter-Kuppel `rune_stone` des Waffenmodells entfällt dann (der Stein kommt aus `runes-v2`)
  - [ ] T1.6 Steinstufen I und II in `tools/art/blender_runes_v2.py` von vorn unterscheidbar (Stufe II mit sichtbar höherem Rand/Facetten und kräftigerer Symboltönung; heute 0.0080 vs. 0.0123 hoch, nur von der Seite lesbar); alle 20 Steine neu bauen (`--only=` zum Prüfen)
  - [ ] T1.7 Tiefenversatz: Rinne und Stein 0.0003-0.0005 über die Plattenfläche heben oder im Laufzeitmaterial `zOffset = -1` setzen (Muster `mat.zOffset` in `src/render/board/rings.ts:51`); Entscheidung nach Sichtprüfung, im Zweifel beides
  - [ ] T1.8 Dreiecke zählen und im Skript-Docstring festhalten (Soll: Waffe ≈ 8 000, Stein < 2 000; heute Axt 7 312, Schwert 7 762, Lanze 7 982, Schild 7 940; Stein max. 1 460 `dark_rune_1`)
- [ ] **T2 Pipeline (AC 1, 4)**
  - [ ] T2.1 `tools/art/build.py` `build_models` (Zeile ~103-135): Ordner `weapons-v2` → `public/assets/models/weapons-v2/` und `runes-v2` → `public/assets/models/runes-v2/` kopieren (`copy_tree_files`), Manifest-Schlüssel `weapons2` / `runes` neben `weapons`/`parts`
  - [ ] T2.2 `tools/build/first-mission.mjs:52` (Regex `models/(props|weapons)/`) um `weapons-v2|runes-v2` erweitern, falls die erste Mission sie braucht; `tools/check-bundle-size.mjs` ausführen und Zahlen notieren
  - [ ] T2.3 `src/app/loading/plan.ts` `gearModels`/`missionAssets` (Zeilen ~79-110): neben `models/weapons/<m>.glb` das v2-Modell und die Steine der ausgerüsteten Runen (`models/runes-v2/<runeId>.glb`) eintragen; `plan.test.ts` ergänzen
- [ ] **T3 Daten und Schema (AC 1, 2)**
  - [ ] T3.1 `content/core/render.yaml` `gear.weapons` (Zeile ~255): `sword`, `lance`, `axe` auf die v2-Modelle zeigen lassen, `offHand.shield` ebenso; `hold`/`hand`/`motion` unverändert lassen (Rahmen ist laut Skript-Docstrings identisch zum alten Modell); neuer Block `gear.rune` mit Elementfarben (Art Direction §2.3: Feuer F2603A, Wind 7BD389, Erde B9874B, Wasser 4AA8E8, Licht F7D96B, Dunkel 8E5BD9, Hilfsrunen E9E4D8), Glimmstärke `dim`, Vollstärke `full`, Puls (Takt, Amplitude) und `metals` (Tönung Eisen/Stahl/Silber)
  - [ ] T3.2 `src/content/schemaRender.ts` (`gearPiece` Zeile 8, `gear` Zeile ~138) und `src/core/defs.ts` (`GearPiece` ~379): Felder `model2?`/Rune-Block typisieren; Zod-Schema und TypeScript-Typ zusammen ändern
  - [ ] T3.3 Metall je Item: `items.yaml` kennt kein Material-Feld (Tier steckt nur im Id-Präfix `iron_`/`steel_`/`silver_`). Optionales Feld `metal: iron|steel|silver` in `ItemDef` (`src/core/mapDefs.ts` ~151) und `schemaItems` einführen, Werte in `content/core/items.yaml` für die vier Gruppen setzen; ohne Feld gilt Stahl [ASSUMPTION: eigenes Feld statt Präfix-Parsing]
  - [ ] T3.4 Texte nur über Locale-Schlüssel (`content/core/locales/de.yaml`/`en.yaml`), falls UI-Text entsteht (hier voraussichtlich keiner)
- [ ] **T4 Laufzeit-Material und Glühen (AC 1)** in `src/render/shared/` (neues Modul `runeGlow.ts`, `models.ts` ist 26 KB: nur `attachGear` ~219-262 und die zwei Aufrufe ~351/~427 anfassen)
  - [ ] T4.1 `attachGear` setzt heute **allen** Meshes `sharedFigureMaterial` (`models.ts:356/432`). Meshes nach Namenssuffix trennen: `rune_channel` und `rune_stone` bekommen eigene Materialien, der Rest bleibt `HC_Vertex` mit Team-Vertexfarben
  - [ ] T4.2 Rinne: `StandardMaterial` mit `emissiveTexture` (kleine 64×1-Verlaufstextur je Stufe, `coordinatesIndex = 1`, liest die UV-Karte `fill`/TEXCOORD_1; Schwelle 1/3, 2/3, 1) in Elementfarbe; unter der Schwelle dunkler Rinnenboden. Stufe III: Puls über `emissiveColor`-Faktor je Frame (nur ein Wert, kein Shader je Figur). Alternative bei Problemen mit UV1 im gltfpack-Export: `ShaderMaterial` [ASSUMPTION: StandardMaterial + Textur zuerst versuchen]
  - [ ] T4.3 Materialien geteilt: ein Satz je (Element, Stufe, Zustand gedämpft/voll), nicht je Figur (Muster `sharedFigureMaterial`, `takeTint`/`giveTint`); `render-cache.test.ts` beachten
  - [ ] T4.4 Glimmen (gedämpft) und voll: `GlowState = 'dim' | 'full'` je Figur; Wechsel tauscht nur das Material der zwei Meshes (kein Neuaufbau des Modells)
  - [ ] T4.5 Stein: statt der Platzhalter-Kuppel den Stein `runes-v2/<runeId>.glb` über `store.container` laden und an `socket_rune_a_*`/`_b` hängen (Instanzen über `instantiate` wie die Waffe, Stein wird für die zweite Waffenseite um 180° um Y gedreht, siehe Docstring `blender_runes_v2.py`); Stein-Teile `rune_stone`, `rune_symbol`, `rune_gold`, `rune_core` bekommen Elementfarbe bzw. Gold; dunkle Stufe I ohne Hilfsrune: leere Fassung zeigt nur Metallrand
  - [ ] T4.6 Tönung Eisen/Stahl/Silber: Vertexfarben der Waffe mit `metals`-Faktor (RGB-Multiplikator) in `teamColours`-Nähe schreiben, **gleiche Form**; Material der Waffe bleibt ein geteiltes
  - [ ] T4.7 Hilfsrune (zweiter Slot, Selten+) sitzt im kleinen Platz `socket_rune_b`; Gewöhnliche Waffen (1 Slot, `rarityRuneSlots` in `content/core/balance.yaml:321`) zeigen die kleine Fassung nicht (Knoten ausblenden), Selten und besser zeigen sie auch ohne Rune (leer)
- [ ] **T5 Brett: Auswahl und Vorschau (AC 1)**
  - [ ] T5.1 `Overlays` (`src/render/board/overlays.ts:14`) um `glow?: ReadonlySet<string>` (Unit-uids mit Vollglühen) erweitern; `BoardUnits.setOverlays` (`boardUnits.ts:419`) reicht ihn an die Figuren durch
  - [ ] T5.2 `src/app/screens/useBoardOverlays.ts`: `selUid` (Zeile 35, Modi `selected`/`moved`) gehört in `glow`; im Modus `forecast` (Zeile 149-153) zusätzlich Angreifer `mode.uid` und Ziel `mode.target`; Gegner sind gleich behandelt (kein Teamfilter). Wert in jedes `board.setOverlays({...base, ...})` über `base` einmischen statt an 12 Stellen
  - [ ] T5.3 `gearKey` (`boardUnits.ts:56`) um Metall und Runen-Ids ergänzen, damit eine geänderte Rune die Figur neu aufbaut (sonst bleibt der alte Stein)
- [ ] **T6 Tests (AC 1-4)**
  - [ ] T6.1 Modell-Test nach dem Muster `tests/unit/pro-parts.test.ts`: je v2-Datei Knoten `rune_channel`, `rune_stone` bzw. die Sockel-Knoten und UV1 vorhanden, Dreiecke ≤ Budget (Waffe ≤ 8 500, Stein < 2 000), je Stein in `content/core/runes.yaml` genau eine Datei
  - [ ] T6.2 Reine Funktionen (Füllschwelle je Stufe, Glühzustand aus Overlays, Metall-Tönung, Schlüssel für `gearKey`) mit Unit-Tests; `plan.test.ts` für die neuen Pfade
  - [ ] T6.3 `content:check`: jede Waffengruppe in `gear.weapons` verweist auf eine vorhandene Datei; `pnpm check` grün (lint, test, content:check, build; Bundle-Budget)
  - [ ] T6.4 Sichtprüfung bei 375 × 812 (Spiel stumm, alle Lautstärken 0): Bilder für gedämpft, gewählt, Vorschau; Stufen I-III; Eisen/Stahl/Silber; Selten mit zweiter Fassung; Gegnerwaffe; neben dem Mockup `art/mockups/ausruestung-2026-11/brett.html`; Abnahme durch den Produktinhaber (AC 3)
- [ ] **T7 Dokumente**: Eintrag in `concept/23-art-direction/art-direction.md.decision-log.md` (keine Änderung an `01-decisions.md`); Hinweis in `art/models/weapons-v2/` nur falls dort ein README existiert

## Dev Notes

### Bestand der neuen Modelle (gemessen)

- Dateien, Knoten, Dreiecke (aus dem GLB-JSON gelesen): `axe.glb` 248 572 B, Knoten `axe`/`rune_channel`/`rune_stone`, 7 312 Dreiecke (Waffe 6 496, Rinne 256, Stein 560); `sword.glb` 214 860 B, 7 762; `lance.glb` 275 568 B, 7 982; `shield.glb` 313 784 B, 7 940 (Stein 280, nur eine Kuppel). Summe v2-Waffen 1 052 784 B roh gegenüber rund 28 KB der vier alten (`art/models/weapons/{axe,sword,lance,shield}.glb`, 6-8 KB, 216 Dreiecke Axt).
- Steine: 20 Dateien in `art/models/runes-v2/` (476 KB roh, 11-51 KB je Datei), Dreiecke 1 056 (`fire_rune_1`) bis 1 460 (`dark_rune_1`), alle unter 2 000. Teile je Stein: `rune_stone`, `rune_symbol`, Stufe III zusätzlich `rune_gold`, `rune_core`. Runen: je Element Stufe 1-3 (Feuer, Wind, Erde, Wasser, Licht), Dunkel nur Stufe 1, vier Hilfsrunen (`content/core/runes.yaml`).
- **Zweite, kleine Fassung existiert in keinem Modell.** Weder in den Skripten noch in den GLB-Knoten (Suche nach „second/socket2/small“ ergibt nichts Einschlägiges); AC 2 verlangt sie also neu (T1.4).
- **Es gibt keine Sockel-Knoten** für die Fassungen: Die Waffen-GLBs enthalten nur die Meshes `<waffe>`, `rune_channel`, `rune_stone` (Platzhalter-Kuppeln, an der Axt zwei, eine je Klingenseite, Schild eine; Lanze/Schwert zwei). Position des Steins ist aus Konstanten bekannt (`FLOOR`=0.0028, `FACE`=0.0092, `SOCKET_R`=0.0258 in `blender_weapons_v2.py:217-220`; Lanze `STONE_DX = CX - FACE`, `blender_weapon_lance.py:50`) und muss als leere Knoten exportiert werden (T1.5). Name der Meshes zur Laufzeit: `${name}:${piece.model}:${n}` (`models.ts:245`), n = `rune_channel`/`rune_stone`.
- Rahmen identisch zu den alten Waffen (Ursprung in der Faust, Griff Blender +Z = glTF +Y, `hold: -125` der Lanze bleibt gültig); Schild an der linken Hand. Farben als Vertexfarben (`HC_Vertex`, Alpha 1); Glühteile haben eigene Materialien `rune_channel` und `rune_stone`; UV-Karte 1 `fill` = TEXCOORD_1, UV 0 ist leer. Stein-Rahmen: Ursprung Mitte der flachen Basis, Kuppel +X, Symbol-oben +Y, Basisradius 0.0252; Stein I 0.0080, II 0.0123, III 0.0150 hoch.
- Die Skripte teilen Code unterschiedlich: Lanze und Schild führen `blender_weapons_v2.py` per `exec` bis `os.makedirs(OUT` aus (Änderungen an Konstanten dort wirken auf beide), das Schwert hat **kopierte** Konstanten. Neu bauen: `blender -b --factory-startup --python tools/art/<skript>.py` (Blender-MCP oder CLI; Blender 4.x).

### Laufzeitpfad der Waffen heute

- `content/core/render.yaml:255-262`: `gear.weapons` je `weaponType` (`sword`, `lance` mit `hold: -125` und `motion: thrust`, `axe` mit `motion: chop` …), `gear.offHand.shield`; Felder `model`, `hand`, `motion`, `hold`.
- `src/core/defs.ts:~379` `GearPiece`; Schema `src/content/schemaRender.ts:8,138-140`.
- `src/render/board/boardUnits.ts:29-60`: `weaponOf`/`gearOf`/`gearKey` (Waffe aus `u.equip.mainHand` über `itemDef(...).weaponType`, Nebenhand über `group`); `loadUnitModel(... this.gearOf(u) ...)` in Zeile 70, Neubau bei geändertem `gearKey` (Zeile 89).
- `src/render/shared/models.ts:224-262` `attachGear` hängt das Modell an `socket_r`/`socket_l`, Wrapper `<name>:<model>:grip` mit `hold`; **alle** Meshes bekommen danach `sharedFigureMaterial` (Zeilen 356, 432; Team-Farben in Vertexfarben über `teamColours`). `tintMaterial(...glow)` (Zeile 172) kennt schon einen Glow-Parameter (Gegner-Rötung, Story 13.6) – anderes Konzept, nicht verwechseln. Nur Bild-zu-3D-Figuren haben Sockel; Blender-Figuren tragen die Waffe im Modell (kein v2-Effekt, in der Sichtprüfung vermerken).
- Laden: `src/app/loading/plan.ts` (`gearModels`, `missionAssets`: `models/weapons/<m>.glb`); Pipeline `tools/art/build.py` `build_models` kopiert `art/models/weapons` → `public/assets/models/weapons` und trägt `weapons` im Manifest ein.
- Test-Muster: `tests/unit/pro-parts.test.ts`, `src/app/loading/plan.test.ts`, `tests/unit/render-cache.test.ts`.

### Daten für Metall, Seltenheit, Runen

- Runen sitzen am Item: `ItemInstance.runes: Array<string|null>` (`src/core/state.ts:12`); `BattleUnit extends UnitRecord` (state.ts:100), also steht `u.equip.mainHand.runes` im Kampfzustand bereit; Slots: `rarityRuneSlots` `{common 1, rare 2, epic 2, legendary 2}` (`content/core/balance.yaml:321`, Typ `balanceDefs.ts:277`). Eine Hilfsrune (`utility: true`, `runes.yaml`) belegt den zweiten Slot, Element-Runen haben `element` + `tier`.
- Seltenheit: `ItemDef.rarity` (`common|rare|epic|legendary`, `src/core/defs.ts:38`). Material-Tier steht nur im Id-Präfix (`iron_sword`, `steel_lance`, `silver_lance`; GDD `concept/21-gdd/items.md` §1: Eisen Akt 1, Stahl Akt 2, Silber Akt 3, Mondstahl selten): daher T3.3.
- Elementfarben: Art Direction §2.3 (Hilfsrunen silberweiß E9E4D8 aus `blender_runes_v2.py` `COLOURS`). Stein-Glühen und das Element-Band der Kampfvorschau (Story 16.12) sollen dieselbe Farbtabelle in `render.yaml` nutzen.

### Wo Auswahl und Vorschau zum Brett kommen

- `src/app/screens/useBoardOverlays.ts`: `selUid` (Z. 35, wenn `mode.k` `selected` oder `moved`), Vorschau `mode.k === 'forecast'` mit `mode.uid` (Angreifer) und `mode.target` (Z. 149-153); alles läuft über `board.setOverlays({...base, ...})` → `BoardUnits.setOverlays` (`src/render/board/boardUnits.ts:419`, Typ `Overlays` in `src/render/board/overlays.ts:14`). Das Brett kennt die Auswahl sonst nicht; der saubere Weg ist ein neues Overlay-Feld (T5.1/T5.2), kein zweiter Kanal. Kampfhaltung der Figuren gehört zu Story 16.10, nicht hierher.

### Bundle-Budget

- Erster Download: Ziel `firstDownloadTargetMb: 12` (Warnung), Kernpaket hart `budgetMb: 30` (`content/packs.yaml:15,37`); `tools/check-bundle-size.mjs` bricht nur bei Kern über 30 MB ab. Waffen zählen zum ersten Download, weil `tools/build/first-mission.mjs:52` alle `models/weapons/` einschließt (der Plan lädt trotzdem nur benutzte). Gemessen: Axt 248 572 B roh → 93 640 B gzip (rund 38 %), Stein `fire_rune_3` 50 704 B → 15 168 B (30 %); also v2-Waffen rund 0.4 MB gzip, alle 20 Steine rund 0.15 MB gzip. Der Zuwachs ist rund 0.5 MB gegenüber heute; die Reserve zum 12-MB-Ziel ist **ohne Build nicht messbar** (kein `dist`, kein `node_modules` in diesem Worktree: erst `pnpm install --frozen-lockfile`, `git lfs pull`, `pnpm build`; Werte in die Completion Notes). Nur die in der ersten Mission benutzten Steine in den Erstdownload aufnehmen, die übrigen auf Anforderung.
- Kein Budget für Waffen in `packs.yaml` (nur `figureBudget` 7 000 Dreiecke je Figur, `partBudget` 600 je Anhängeteil, Prüfung `tools/figure-budget.mjs`): Waffen v2 liegen weit über dem Anhängeteil-Budget und zählen nicht zur Figur; bei Bedarf `weaponBudget` ergänzen (Warnung) [ASSUMPTION]. Frage Zeichenaufwand: bis zu 3 Waffenmeshes + 2 Steine je Figur: auf dem Brett mit rund 20 Figuren Draw-Calls prüfen (`pnpm lab`, Dev-Build `?lab=`), bei Engpass Steine als Thin Instances oder Meshes je Figur zusammenführen.

### Triangle-Budget

- Zählung per Skript (GLB-JSON, Accessor-Zähler der Indizes) liegt nicht im Repo; `@gltf-transform` ist nicht installiert. T6.1 baut den Zähler in den Test ein (kleines JSON-Parsen, kein neues Paket).

### Reihenfolge und Abgrenzung

- Folgestories: 16.7 (übrige Gruppen) übernimmt das hier gebaute Laufzeit-System, 16.8 Signaturen, 16.9 Griff-Rig, 16.10 Ruhe/Kampfhaltung, 16.12 Element-Band. Die Laufzeitlösung muss gruppenunabhängig sein (Knotennamen und `render.yaml`, keine `if (axe)`-Zweige).
- Keine Änderung an Regeln, Speicherformat oder Replays (rein Darstellung): `SAVE_FORMAT` (`src/persistence/save.ts:11`) bleibt.

### Project Context Rules (AGENTS.md)

- Werte nie im Code, sondern in `render.yaml`/Content-YAML; kein sichtbarer Text im Code; `src/core` ohne Babylon/DOM; Commits und Bezeichner Englisch, Doku Deutsch; Tests je Änderung, Coverage nicht senken.
- Bilder und 3D: kein Tripo für Waffen; Blender-Skripte unter `tools/art/`; PNG/GLB unter `art/` liegen in Git LFS (`git lfs pull`, die `M`-Einträge der v2-GLBs im Git-Status sind LFS-Zeiger/gefilterte Änderungen).
- Nach der Arbeit: `pnpm check` (lint, test, content:check, build); Sichtprüfung als Bild bei 375 × 812, Spiel stumm; Entscheidungen ins Decision-Log von `concept/23-art-direction/`.
- Sprint-Status wird von dieser Story-Erstellung nicht angefasst (die 16.x-Einträge fehlen in diesem Branch).

### References

- [Source: concept/26-epics/epics/epic-16.md#Story 16.6] · [Source: concept/23-art-direction/art-direction.md#4.7 Runenwaffen] · [§2.3 Elementfarben] · [§4.5 Animationen]
- Modelle: `art/models/weapons-v2/`, `art/models/runes-v2/`; Skripte `tools/art/blender_weapons_v2.py`, `blender_weapon_sword.py`, `blender_weapon_shield.py`, `blender_weapon_lance.py`, `blender_runes_v2.py`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5 (Umsetzung, zwei Subagenten), Claude Opus 5.5 (Lenkung, Prüfung)

### Debug Log References

### Completion Notes List

- T1–T6 umgesetzt; `pnpm check` grün. Abnahmebilder: `s4-16-6-modelle.png` (Blender, alle Waffen und Steine), `s4-16-6-brett.png` (Brett 375 × 812, Lucan gedämpft und voll) im Notizordner des Nachtlaufs.
- Testlabor kann Runen setzen (`units.<id>.runes`, Lage `tests/fixtures/lab/runenwaffen-v2.yaml`).
- Schild Ocker/Umbra statt Teamfarben; Werte gedämpft 0,3 und Steinleuchten 0,8 nach Sichtprüfung.
- Offen für den Produktinhaber: Abnahme der Modelle, Lage der kleinen Fassung, Rinnenbreite auf dem Brett (Decision-Log 23 vom 2026-11-22). Folgepunkte aus dem Review: Glühmeshes nicht in `model.meshes` (Schatten), NullEngine-Test für Materialcache und Puls fehlt.

### File List
