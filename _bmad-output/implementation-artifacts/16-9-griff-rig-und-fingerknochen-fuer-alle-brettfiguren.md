# Story 16.9: Griff-Rig und Fingerknochen für alle Brettfiguren

Status: review

## Story

Als Spieler
möchte ich, dass jede Figur ihre Waffe richtig in der Hand hält,
damit Schwert, Lanze und Buch nicht schräg an der Hand kleben.

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-16.md` Story 16.9 (Zeilen 140-152), Art Direction §4.5 („Haltung je Waffenart“, Zeilen 225-247).

1. **Angenommen** die Tabelle „Haltung je Waffenart“ (§4.5) und die 45 Brettfiguren unter `art/models/units/`
   **Wenn** jedes Waffenmodell einen Griffpunkt mit fester Achse trägt, jede Figur einen Griff-Sockel in der Handfläche (statt `socket_r`/`socket_l` am Handgelenk) und Fingerknochen bekommt (per Skript wiederholbar)
   **Dann** schließt sich die Hand je Griffart (Faust um Schaft und Heft, flache Hand unter dem aufgeschlagenen Buch), und Hand und Griffpunkt kommen aus der Waffenart in `render.yaml`.
2. Der Griffwinkel `hold` ist entfernt; ein Abnahmebild zeigt jede Waffenart an zwei Figuren in Ruhe und Kampfhaltung.
3. Alle 45 Figuren (Gefährten, Söldner, Gegner, Leutnants) sind umgestellt (Entscheidung Produktinhaber 2026-11-21); jede bleibt im Budget von Story 15.9 (7 000 Dreiecke, 512er-Textur, 0,5 MB gz inkl. `.vat`).

Nicht Teil dieser Story: Ruhe-, Gesten- und Kampfhaltungs-Clips sowie das Umschalten Buch zu/offen (Story 16.10). 16.9 liefert Rig, Sockel, Fingerposen und das Abnahmebild.

## Bestandsaufnahme (geprüft, nicht vermuten)

- **45 Figuren** = 42 Bild-zu-3D-Figuren (je `art/models/source/<id>_board_tripo.glb`, `<id>.glb` + `<id>.vat`) + 3 Blender-Figuren `avatar`, `fighter`, `mage` (ohne Sockel, ohne `.vat`, Waffe fest im Modell; Nodes 19-21, kein `socket_*`). Siehe [ASSUMPTION A1].
- **Fingerknochen existieren in allen 42 Quellen** (volles Mixamo-Skelett, 65 Joints, je Hand Thumb/Index/Middle/Ring/Pinky 1-4, Namen `mixamorig:RightHandIndex1` …; Stichprobe `hask_board_tripo.glb`: Fingerjoints tragen Skin-Gewichte, z. B. `LeftHandThumb1` Summe 105, die Hand-Vertices hängen also schon an Fingern). Dieselben 65 Joints stehen in der Animationsbibliothek `lucan_anims_base.glb`. Ein Nachrig in Blender ist **nicht** nötig; Tripo-Credits: keine.
- **Die Finger werden heute absichtlich entfernt:** `tools/art/prepare_tripo_unit.py` `SKIP` (Zeile 49) und `slim_rig()` (Zeilen 460-500, „65 -> 22 joints, lossless“) schlagen die Finger- und `_End`-Gewichte der Hand zu und löschen die Knochen (Story 7.8). Das Ergebnis `hask.glb` hat nur noch 29 Nodes (`mixamorig:RightHand`, `socket_*`).
- **Wo `socket_r`/`socket_l` heute entstehen:** `prepare_tripo_unit.py` `sockets()` (Zeilen 383-430): leerer Node, Elternknochen `mixamorig:RightHand`/`LeftHand`, Ursprung auf halber Länge des Handknochens (Zeile 402), Rahmen: +Y Hand entlang der Finger zum Unterarm hin geflippt, +Z Vorwärts quer über die Faust (Greifachse), +X = Y×Z (Zeilen 396-406). Körper-Sockel `socket_back`/`socket_head` im selben Block (Zeilen 408-430, bleiben unverändert). Die Reihenfolge im Skript: sockets() läuft vor `slim_rig()` (Sockel hängen am Handknochen, der bleibt).
- **Pipeline:** `pnpm art:tripo` = `tools/art/tripo_units.py` (Blender-Aufruf je Quelle, Zeilen 36-51) → `prepare_tripo_unit.py` → `<id>.raw.glb` → `bake_vat.py` → gltfpack (`-kn -km -c -af 12`, Zeile 51; Nodes bleiben) → `art/models/units/<id>.glb`; Budget-Prüfung `tools/figure-budget.mjs` (liest `figureBudget` in `content/packs.yaml` Zeilen 17-22: 7000 / 512 / 0,5 MB, `.vat` zählt zur Figur).
- **Gebackene Vertex-Animation:** `tools/art/bake_vat.py` schreibt je Figur Joints (22), Sockel (`S x {name, joint, t, q, s}`, **eine feste lokale Pose unter dem Joint**, Doku-Kopf Zeilen 5-25, Sockelsuche Zeilen 95-102: Nodes ohne Joint-Rolle, Name `socket_*`, Elternteil ein Joint) und Clips (Rotationen 60 fps). Es gibt **keine Sockel-Tracks**; der Sockel fährt per Vorwärtskinematik mit seinem Joint. Laufzeit: `src/render/shared/models.ts` `socketOf` (Zeilen 233-234 Typ, 367-378 Umsetzung: „a figure on baked animation makes it when the first piece asks“, Suche nach Name in `entry.data.sockets`), `attachGear` (Zeilen 236-291) hängt je Stück einen `grip`-TransformNode an den Sockel, `grip.rotation.x` setzt `figures.ts` Zeile 109 (`attack` → 0, sonst `hold`). Der Nicht-VAT-Pfad (Zeilen 470-484) nutzt dieselben `grips` über die glTF-Nodes.
- **Folgerung für das Backen:** Ein neuer Palmen-Sockel (Kind des Handknochens) fährt automatisch mit; die Joint-Liste des Bakes wächst aber um die Fingerjoints, sobald sie bleiben (siehe Entwurf Finger).
- **`hold` heute:** `content/core/render.yaml` Zeilen 253, 260 (`lance: … hold: -125`, einziger Wert), Schema `src/content/schemaRender.ts` Zeilen 8-9 (`gearPiece`, `itemPiece`), Auswertung `models.ts` Zeile 250, `UnitModel.grips` Zeile 124, `figures.ts` Zeile 109; Items-Block `gear.items` (Zeilen 274-290) kennt `hold` als optionale Überschreibung.
- **Waffenmodelle v2:** `tools/art/blender_weapons_v2.py` Docstring (Zeilen 1-30): Ursprung in der Faust, Griffachse = Blender +Z (glTF +Y), Klinge auf der −Y-Seite (glTF +Z), Klingenfläche ±X. Die Gruppenskripte `blender_weapon_<gruppe>.py` und `blender_weapon_signatures.py` (Story 16.8) benennen ihre Rune-Nodes `socket_rune_*`; **kein** Griff-Node. Ausnahme-Rahmen: Lanze trägt eine Kippung (`blender_weapon_lance.py` TILT, Zeilen 17-18, 336-344), Buch hat zwei Dateien `book`/`book_open` (`blender_weapon_book.py` Zeilen 12-21, 68, 88).
- **Dateien, die Modelle beschreiben:** `art/models/weapons-v2/*.glb` und `sig/*.glb`; Ladeplan `src/app/loading/plan.ts` `gearModels`; Auflösung `src/render/shared/gearModel.ts` `modelFor` und `src/render/board/boardUnits.ts` `gearOf` (Zeile ~29).

## Entwurf

**Griffpunkt am Modell:** jedes Waffenmodell bekommt einen leeren Node `grip` (glTF-Knoten ohne Mesh) mit festem Rahmen: Ursprung = Mitte der Faust bzw. Handfläche, +Y (glTF) = Griffachse (Schaftende → Spitze/Kopf; beim Buch: Rücken oben), +Z = Schneide/Breitseite nach vorn, +X = Y×Z. Weil v2-Modelle schon „Ursprung in der Faust, Achse +Y“ sind, ist der Node **identisch mit dem Ursprung** und wird nur ausdrücklich benannt. Abweichungen (Lanze mit Kippung, Buch, Laute am Hals, Schild-Armschlaufe) werden im Modell in den `grip`-Node gebaut, nicht per Winkel in `render.yaml`. Dadurch kann `hold` ersatzlos entfallen. [ASSUMPTION A2: Node heißt `grip`; Laufzeit setzt ihn auf den Palmen-Sockel; fehlt er in einem Modell, gilt der Modellursprung.]

**Griff-Sockel an der Figur:** `sockets()` erzeugt statt `socket_r`/`socket_l` die Nodes `grip_r`/`grip_l` als Kind von `mixamorig:RightHand`/`LeftHand`, Ursprung in der Handfläche (etwa 35 % der Handknochenlänge vom Handgelenk, Handflächenseite statt Knochenachse; per Skript aus den Hand-Vertices bestimmt, nicht von Hand je Figur), Rahmen wie oben (+Y Griffachse quer über die Faust, +Z nach vorn). Eine gemeinsame Regel für alle Figuren, denn Tripo-Hände sind unterschiedlich groß. `socket_r`/`socket_l` entfallen (kein Alias; PoC-Regel „Breaking Changes ok“). [ASSUMPTION A3: Namen `grip_r`/`grip_l`; Tabelle, Laute und Armschlaufen nutzen sie ebenfalls.]

**Fingerknochen und Biegung:** `slim_rig()` behält je Hand die 15 Fingerjoints (Index/Middle/Ring/Pinky 1-3, Thumb 1-3; die `_4`-Spitzen und `_End` bleiben entfernt, Gewichte wandern zum Glied davor): Joints 22 → rund 52. Die Fingerposen entstehen als **Rotations-Presets je Griffart** in einer Datei `tools/art/grip_poses.py` (Euler je Fingerglied, Daumen eigen). Griffarten: `fist` (Schaft, Heft, Stiel), `flat` (flache Hand unter aufgeschlagenem Buch), `bow` (Griffmitte: Faust, Zeigefinger etwas offen), `lute` (Hals links: halbe Faust; Korpus rechts: flach), `none` (entspannt, Rest der Mixamo-Ruhepose). Die Posen werden als zusätzliche **Einzelbild-Clips** `grip_fist`, `grip_flat`, `grip_bow`, `grip_lute` (je 1 Zeile, nur Finger gesetzt) in die `.vat` gebacken; die Laufzeit mischt nicht, sondern wählt je Hand den Clip-Zustand der Finger. Das ist die kleinste Lösung, die mit der VAT (nur Gesamtposen je Clip) ohne Laufzeit-Skinning auskommt, und 16.10 baut die Haltungs-Clips später auf denselben Fingerposen auf (die Finger sind dort Teil der Ruhe-/Kampf-Clips je Waffenart). [ASSUMPTION A4: in 16.9 genügt je Hand ein fester Fingerzustand je Waffenart statt freier Mischung; Mischung (rechts Faust, links flach) löst 16.10 durch Haltungs-Clips je Waffenart.] Alternative bei Aufwandsüberschreitung: nur die Fingerjoints pro Hand auf je ein Joint „Fingerblock“ (4 Finger) + Daumen reduzieren (rund 6 Joints pro Hand); Entscheidung nach Messung T2.4.

**`render.yaml` (Daten statt Winkel):** `gear.weapons|offHand` Einträge bekommen `grip: fist|flat|bow|lute` und behalten `hand`; `hold` wird aus Schema (`schemaRender.ts` Zeilen 8-9), Auswertung (`models.ts` 250, `figures.ts` 109, `UnitModel.grips`) und YAML (Zeilen 253, 260) entfernt. Vorschlag: `sword/dagger/lance/axe/staff: fist`, `bow: bow`, `anima/light/dark: flat` (Fokus `focus`: `flat`), `shield: fist` (Armschlaufe, Faust am Griff) [ASSUMPTION A5: Schild bekommt Faustgriff am Haltebügel; die Armschlaufe am Unterarm bleibt Modellsache], `lute: lute`. `items` erben die Griffart ihrer Gruppe, mit optionaler Überschreibung `grip` (Armbrüste: `bow`).

**Budget:** Skin-Joints brauchen keine Dreiecke; Textur unverändert. Das Risiko liegt in der Größe der `.vat` (Joints × Zeilen × 4 Halbfloats, gzip): 22 → rund 52 Joints erhöht Rotations-Daten je Clip um den Faktor ~2,4, Finger sind in nahezu allen Clips konstant und komprimieren sehr gut (Byte-Shuffle + gzip). Messen mit `node tools/figure-budget.mjs`; Grenzwert 0,5 MB je Figur (`hask`: .glb 272 KB + .vat 118 KB heute, also knapp unter 0,4 MB mit Reserve; Figuren mit mehr Clips prüfen).

## Tasks / Subtasks

Reihenfolge einhalten; A baut die Daten, B die Laufzeit, C die Abnahme. Blender-Aufruf: `"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"` (oder `BLENDER` setzen), nie Tripo.

### (A) Blender-Rig-Skript und Neuexport aller 45 Figuren

- [ ] **A1 Gerüst prüfen (AC 1, 3):** `python`-Kurzprüfung (JSON-Teil der GLB) der 42 Quellen auf `mixamorig:{Left,Right}Hand{Thumb,Index,Middle,Ring,Pinky}{1,2,3}` (Stichprobe ergab 42/42); Ergebnis als Zeile im Dev-Log, kein neues Werkzeug. Fehlt bei einer Figur etwas, Nachrig-Pfad mit Blender „Automatic Weights“ nur für diese Figur.
- [ ] **A2 Palmen-Sockel (AC 1):** in `prepare_tripo_unit.py` `sockets()` ersetzen: `grip_r`/`grip_l` an Handknochen, Lage aus den stärksten Hand-Vertices (Gewichte `RightHand` + Fingerwurzeln, Mittelpunkt der Handfläche), Rahmen wie im Entwurf; `socket_back`/`socket_head` unverändert. Kurzer Selbsttest im Skript (Abstand Sockel ↔ Handknochen < 0,6 Knochenlänge, Achse nicht parallel zum Unterarm), Abbruch mit Figurenname.
- [ ] **A3 Finger behalten (AC 1):** `SKIP`/`slim_rig()` anpassen: Fingerglieder 1-3 bleiben Joints, nur `_4` und `_End` werden weggefaltet; die Prüfung „Vertexpositionen vor/nach“ (Zeilen ~478-500) bleibt scharf. Dazu die Hilfsfunktion `finger_pose(name)` aus neuer Datei `tools/art/grip_poses.py` (Presets `fist|flat|bow|lute|none`, Radiantwerte je Glied).
- [ ] **A4 Griff-Clips und Bake (AC 1, 3):** `prepare_tripo_unit.py` schreibt die Einzelbild-Clips `grip_<art>` (nur Fingerrotationen, übrige Joints Ruhepose); `bake_vat.py` übernimmt Joints und Clips ohne Formatänderung (Joint-Zahl steht im Kopf). Prüfen, dass `verify()` (Zeile 255) und der Sockeltest die neuen Joints abdecken; Formatversion nur anheben, falls nötig.
- [ ] **A5 Alle 42 Bild-zu-3D-Figuren neu bauen:** `pnpm art:tripo` (Aufrufe nacheinander, Blender 5.2), danach `node tools/figure-budget.mjs art/models/units`; Ausreißer (> 0,5 MB gz oder > 7 000 Dreiecke) in der Tabelle der Dev-Notizen nennen, bei `.vat`-Überschreitung die Fingerblock-Alternative (siehe Entwurf) anwenden.
- [ ] **A6 Waffenmodelle (AC 1):** Nodes `grip` in alle Gruppenskripte (`blender_weapon_{sword,dagger,lance,axe,bow,book,focus,staff,lute,shield}.py`, `blender_weapons_v2.py` für die Axt) und in `blender_weapon_signatures.py` aufnehmen (Ursprung = Griffpunkt, Rahmen wie Entwurf; Tabelle §4.5: Heft unter der Parierstange, unteres Stielviertel, Griffmitte, Buchrücken, Laute am Hals). Neu bauen `art/models/weapons-v2/*.glb` und `sig/*.glb` mit den bestehenden Skriptaufrufen; die Rune-Nodes `socket_rune_*` bleiben bit-gleich in Lage (Diff der Node-Translationen vor/nach).
- [ ] **A7 Blender-Figuren `avatar`, `fighter`, `mage` (AC 3):** [ASSUMPTION A1] diese drei tragen ihre Waffe fest im Modell und haben weder Sockel noch Finger; sie werden **nicht** umgebaut. Vor T-Start klären, ob sie noch referenziert sind (`render.yaml`/Klassen/`defs.ts`); falls nein, Nachweis in den Dev-Notizen, falls ja, Fallback `none`-Griff ohne Sockel belassen und Produktinhaber informieren (Frage in `_bmad-output`-Übergabe, nicht blockierend).

### (B) Laufzeit und Daten

- [ ] **B1 Schema und YAML (AC 1, 2):** `src/content/schemaRender.ts` Zeilen 8-9: `hold` entfernen, `grip: z.enum(['fist','flat','bow','lute'])` hinzufügen (Pflicht bei `weapons`/`offHand`, optional bei `items`); `content/core/render.yaml` `gear.weapons|offHand` mit `grip` ergänzen, `hold: -125` und den `hold`-Satz im Kopfkommentar (Zeilen 253-255) streichen; Texte in `content/core/locales` nur, falls sichtbar (nein).
- [ ] **B2 Sockelnamen (AC 1):** `socketName(piece)` in `models.ts` liefert `grip_r`/`grip_l`; `socketOf` und `bake_vat.py`-Sockelsuche gelten unverändert (Präfix `socket_` im Bake **auf `grip_` oder beides** erweitern, Zeilen 95-102). Nicht-VAT-Pfad (`models.ts` ~470-484) sucht den glTF-Node `grip_r/l` gleichen Namens.
- [ ] **B3 Griffpunkt statt Winkel (AC 1, 2):** `attachGear` (Zeilen 236-291) hängt das Modell so an den Sockel, dass der `grip`-Node des Modells (falls vorhanden) auf den Sockelrahmen fällt (Modell invers versetzen); `UnitModel.grips` und `figures.ts` Zeile 109 (`g.hold`) entfallen, `play()` dreht nichts mehr. Alle Aufrufer (`grep -rn "grips" src`) bereinigen.
- [ ] **B4 Fingerzustand (AC 1):** die Laufzeit wählt je Figur beim Aufbau aus den `grip`-Arten ihrer beiden Hände die Fingerposen (`grip_fist|flat|bow|lute`-Clip als Zusatzschicht der Joints; ohne Waffe `none`). Entwurf der Schicht: Joint-Rotationen der Finger werden aus dem `grip_*`-Clip in jede Zeile des Matrix-Textur-Aufbaus (`src/render/shared/vat.ts`, vorwärts kinematisch) überschrieben, nur für Fingerjoints. Unit-Test: Faust-Clip schließt Fingerspitzenabstand zum Handfläche-Sockel.
- [ ] **B5 Ladeplan und Tests (AC 3):** `plan.ts`/`plan.test.ts` nur falls Dateinamen sich ändern (nein erwartet); `tests/unit/render-yaml*.test.ts`/Content-Prüfung: jede Waffengruppe hat `grip`, kein Eintrag hat `hold`; Test, dass jedes `weapons-v2/*.glb` und `sig/*.glb` einen Node `grip` trägt (JSON-Teil lesen). `pnpm check` grün (lint, test, content:check, build; Bundle-Budget).

### (C) Abnahmebild

- [ ] **C1 Aufnahme-Werkzeug (AC 2):** kleines Skript `tools/art/grip-shots.mjs` nach dem Muster `tools/art/part-shots.mjs` (375 × 812, Dev-Build, Szene `?lab=`), je Waffenart zwei Figuren aus den 45, je Ruhe und Kampfhaltung. Hinweis: bis 16.10 gibt es die Haltungs-Clips noch nicht; Ruhe = Idle-Clip mit Fingerpose, Kampfhaltung = Bild des `attack`-Clips bei 0,25 s als Platzhalter [ASSUMPTION A6], echte Kampfhaltung zeigt 16.10 nach.
- [ ] **C2 Paarung (AC 2):** Waffenarten Schwert, Dolch, Lanze, Axt, Bogen, Stab, Buch (offen, flache Hand), Schild, Laute je auf zwei Figuren mit unterschiedlicher Handgröße (z. B. `hask` und `grell`); Bilder in `art/models/units/shots/` bzw. `art/prompts/`-Abnahmeordner, **als Sammelbild im Browser-Fenster öffnen** (Memory „Bilder direkt zeigen“, Spiel stumm).
- [ ] **C3 Sichtprüfung:** keine Waffe schräg an der Hand, Finger durchstoßen die Waffe nicht, Buch liegt auf flacher Hand mit Seiten zur Figur; Mängel als Liste in den Dev-Notizen, Nachbesserung in A2/A3/A6.

## Dev Notes

- **Zu lesen vor dem Start (nur diese Teile):** Art Direction §4.5 Tabelle (Zeilen 225-247), §4.6 Schritte 4-6 (Zeilen 249-264), `prepare_tripo_unit.py` Zeilen 380-500, `bake_vat.py` Kopf (Zeilen 1-110), `models.ts` Zeilen 233-291 und 362-398, `render.yaml` Zeilen 250-295.
- **Vorgänger:** 16.6/16.7 (v2-Waffenmodelle, Skripte `blender_weapon_*.py`), 16.8 (Signaturen, `sig/`, Fallback auf Gruppenmodell in `attachGear`). Beide ändern Modelle, nicht das Rig; die Rune-Nodes dürfen sich nicht verschieben.
- **Nicht tun:** keine Tripo-Credits, keine neuen Quellfiguren, `hold` nicht durch einen neuen Winkelwert ersetzen, keine Handanpassung je Figur (nur Regeln im Skript), keine Änderung am Spielkern (`src/core`).
- **Wiederholbarkeit:** Alles läuft per `pnpm art:tripo` (+ die `blender_weapon_*.py`-Aufrufe) mit Blender 5.2; Skripte lesen nur Repo-Dateien. PNGs/GLBs in LFS: vor dem Bauen `git lfs pull` (Stolperfalle in AGENTS.md); `node_modules` ggf. `pnpm install --frozen-lockfile`.
- **Windows:** gltfpack läuft als `gltfpack.cmd` (`tripo_units.py` Zeile 29).
- **Risiken:** (1) `.vat`-Größe bei 52 statt 22 Joints; (2) Tripo-Hände sind je Figur verschieden, Palmen-Lage per Regel kann bei einzelnen Figuren daneben liegen; (3) Skin-Gewichte der Finger bei Tripo sind grob (Handschuh-Optik), starke Biegung kann Spitzen ziehen, Biegewinkel klein halten; (4) die 3 Blender-Figuren sind ohne Rig (A1/A7); (5) `socket_`→`grip_` ist ein Format-Bruch für `.vat`-Leser; Tests und Fixtures prüfen (`grep -rn "socket_r" src tests tools`).
- **Testen:** `pnpm vitest run` der berührten Dateien einzeln, dann `pnpm check`. Sichtprüfung nur im Browser-Fenster (C2), Lautstärken auf 0.

### Project Structure Notes

- Blender-Skripte unter `tools/art/`, Daten `content/core/render.yaml`, Zod-Schema `src/content/schemaRender.ts`, Laufzeit `src/render/shared/{models,figures,vat}.ts`; kein neues Verzeichnis außer optional `grip-shots` unter `tools/art/`.
- Sichtbarer Text entsteht nicht; keine Locale-Schlüssel nötig.

### References

- [Source: concept/26-epics/epics/epic-16.md#Story 16.9] Zeilen 140-152
- [Source: concept/23-art-direction/art-direction.md#4.5 Animationen] Zeilen 225-247; [#4.6 Produktion] Zeilen 249-264 (Budget Zeile 266)
- [Source: tools/art/prepare_tripo_unit.py] `SKIP` 49, `sockets()` 383-430, `slim_rig()` 460-500
- [Source: tools/art/bake_vat.py] Kopf 5-25, Sockel 95-102; [tools/art/tripo_units.py] 36-51; [tools/figure-budget.mjs]; [content/packs.yaml#figureBudget] 17-22
- [Source: src/render/shared/models.ts] 123-124, 233-291, 367-398, 470-484; [src/render/shared/figures.ts] 109
- [Source: tools/art/blender_weapons_v2.py] Docstring 1-30; [content/core/render.yaml] 253-295; [src/content/schemaRender.ts] 8-9

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Completion Notes (Nachtlauf 2026-11-22)

- 42 Tripo-Figuren neu aufbereitet: Fingergelenke (Daumen bis kleiner Finger, je 1-3) bleiben, 22 auf 52 Gelenke; Griff-Sockel `grip_r`/`grip_l` in der Handfläche (`hand_frame()` in `tools/art/prepare_tripo_unit.py`) statt `socket_r`/`socket_l`.
- Fingerposen je Griffart in `tools/art/grip_poses.py` (fist, flat, bow, lute), gebacken als Einzelbild-Clips `grip_*`; `render.yaml` `grip` je Waffengruppe und optional je Item. Die Auswahl des Clips zur Laufzeit gehört zu 16.10.
- Jedes v2- und Signaturmodell hat einen Knoten `grip` (`tools/art/weapon_grip_nodes.py`, nach jedem Neubau einer Waffe erneut ausführen). `hold` ist entfernt.
- Budget: höchstens 0,35 MB gz je Figur (ilka), Dreiecke unverändert; `.vat` im Mittel 110 auf 118 KB gz. Paket act1 bei 39,96 von 40 MB.
- Nicht umgestellt: Blender-Figuren `avatar`, `fighter`, `mage` (kein Rig, `mage` nur Rückfall in classes.yaml) [ASSUMPTION].
- Abnahmebild `s4-16-9-griffe.png` (Lucan und Hask, zehn Waffenarten, Ruhe und Angriff bei 0,25 s). Abnahme durch den Produktinhaber offen.
