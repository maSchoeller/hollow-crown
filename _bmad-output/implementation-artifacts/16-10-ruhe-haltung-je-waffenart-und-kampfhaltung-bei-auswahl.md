# Story 16.10: Ruhe, Haltung je Waffenart und Kampfhaltung bei Auswahl

Status: ready-for-dev

## Story

Als Spieler
möchte ich ruhig atmende Figuren sehen, die bei Auswahl kampfbereit werden,
damit das Brett lebendig wirkt, ohne zu taumeln.

## Acceptance Criteria

1. Je Haltungsart (Waffenart, siehe Tabelle unten) entstehen als gebackene Vertex-Animation die Clips Ruhe (atmen, Periode etwa 4 s), drei Gesten (umsehen, Gewicht verlagern, Waffe nachfassen) und Kampfhaltung; das bisherige Taumeln des Clips `idle` entfällt.
2. Auf dem Brett stehen Figuren in Ruhe in der Haltung ihrer Waffenart (Art Direction §4.5, Tabelle). Jede Figur startet ihre Schleife an anderer Stelle und zeigt alle 6–10 s eine Geste zu eigener Zeit. Die Hände bleiben ruhig, Waffe und Schild drehen nicht weg.
3. Die gewählte Figur sowie Angreifer und Ziel der Kampfvorschau (dieselbe Menge wie `Overlays.glow`) wechseln in 0,25 s in die Kampfhaltung, gleichzeitig mit dem vollen Runenleuchten, und zurück, wenn die Auswahl endet. Bücher wechseln dabei auf das aufgeschlagene Modell (`modelOpen`).
4. Laufen, Angriff, Treffer, Niedergestreckt, Flucht und Jubel nutzen dieselben Griffe (Griff-Sockel `grip_r`/`grip_l`, Fingerpose der Griffart).
5. Die Bildrate hält auf der größten Karte (Messung wie Story 15.11); ohne Referenzgerät wird am Desktop gemessen und das im Stand vermerkt.

## Bestandsaufnahme (geprüft)

- **Clips heute:** `tools/art/prepare_tripo_unit.py` Zeilen ~268-295 backt `idle`, `walk`, `hit`, `downed`, `attack*`, `flee`, `cheer` (Tripo-Presets bzw. Bibliothek `lucan_anims_base.glb`) und seit 16.9 Einzelbild-Clips `grip_<art>` (nur Finger; `tools/art/grip_poses.py`). `idle` ist die Tripo-Idle mit Taumeln.
- **Backen:** `tools/art/bake_vat.py` (Kopf Zeilen 1-30): eine Rate 60 fps für alle Clips, `LOOPS = {"idle", "walk"}`, Format `HCVT` Version 1, Clip-Flag 1 = Schleife. Laufzeit-Leser `src/render/shared/vat.ts` (`VatClip`, `clipRow`), Worker `vatWorker.ts`.
- **Wiedergabe:** `src/render/shared/figures.ts` `ModelFigure.playBaked()` wählt `${anim}_${motion}` → `anim` → `idle`; `show(row)` setzt Zeile und Hand-Sockel. Eine VAT-Figur zeigt immer genau eine Zeile, Überblenden zwischen Clips gibt es nicht.
- **Auswahl/Leuchten:** `src/render/board/boardUnits.ts` `applyGlow()` (Zeile ~76) und `makeFigure` (Zeile ~178) setzen `setRuneGlow(glowState(this.overlays.glow, uid))`. Genau dort hängt der Haltungswechsel.
- **Waffen je Figur:** `gearOf()` in `boardUnits.ts` (Hauptwaffe nach `weaponGroup`, Nebenhand nach `group`), Daten `content/core/render.yaml` `gear.weapons|offHand|items` (Zeilen ~250-295, `hand`, `grip`, `motion`, `modelOpen`). Klassen tragen `weaponGroups` in `content/core/classes.yaml` (z. B. `[sword, lance, shield]`). Figur je Einheit: `unitFigureId(u, classes)`.
- **Budget:** Figur ≤ 0,5 MB gz mit `.vat` (`tools/figure-budget.mjs`, `content/packs.yaml` `figureBudget`). Paket `core` 30 MB bricht den Build ab, `act1` 40 MB warnt nur; act1 steht bei 39,96 MB. `.vat` heute im Mittel 118 KB gz.
- **Blender-Figuren** `avatar`, `fighter`, `mage` haben kein Rig/keine `.vat` (Skelettpfad) und bleiben außen vor.

## Entwurf

### Haltungsarten (Daten in `render.yaml`)

`gear.weapons.<gruppe>.stance` und `gear.offHand.<art>.stance` (Zod-Schema `src/content/schemaRender.ts`):

| stance | Gruppen | Ruhe | Kampfhaltung | Finger r / l |
|---|---|---|---|---|
| `lance` | lance (Speer) | rechts, senkrecht, Schaftende am Boden | waagerecht zum Stoß | fist / none |
| `staff` | staff | wie lance | schräg vor | fist / none |
| `blade` | sword, dagger | Spitze oben, Hand vor der Hüfte | schräg nach vorn oben | fist / none |
| `axe` | axe | auf der Schulter, Kopf hinten außen | erhoben, Schneide vorn | fist / none |
| `bow` | bow | links, senkrecht neben dem Bein | senkrecht vor dem Körper | none / bow |
| `book` | anima, light, dark, focus | links, zu an der Hüfte | aufgeschlagen auf flacher Hand, Rechte zaubert | flat(offen) / flat |
| `lute` | lute (Nebenhand) | links Hals, rechts Korpus, vor dem Bauch | wie Ruhe | flat / lute |

- Schild in der Nebenhand ist ein Zusatz: `gear.offHand.shield.stanceMod: shield` → Clipschlüssel `<stance>_shield` (linker Arm: Schild außen am Unterarm in Ruhe, leicht vor dem Körper in Kampfhaltung). [ASSUMPTION A1: Schild nur als Zusatz zu `lance`, `blade`, `axe`, `staff`.]
- Eine Nebenhand mit eigener `stance` (Laute) ersetzt die Haltung der Hauptwaffe. [ASSUMPTION A2]
- Ohne Waffe: `stance` fehlt → Clipschlüssel `none` (Arme locker, atmen). Jede Figur bekommt `rest_none` als Rückfall; der alte `idle`-Clip wird durch `rest_none` ersetzt (Name `idle` darf bleiben, Inhalt: ruhiges Atmen ohne Taumeln).

### Clips je Figur (Blender)

- Welche Haltungen eine Figur bekommt, folgt aus den Klassen, die diese Figur zeigen (`classes.yaml` `weaponGroups` → `stance`, mit `_shield`, wenn die Klasse `shield` führt), plus `none`. Das Skript liest das aus `content/` (kein Handpflegen je Figur). [ASSUMPTION A3: nur Haltungen der eigenen Klassen backen, nicht alle; spart `.vat`-Größe. Ist eine Kombination nicht gebacken, fällt die Laufzeit auf `rest_<stance>` ohne `_shield`, dann `rest_none`.]
- Clips je Haltung `<s>`: `rest_<s>` (Schleife, genau eine Atemperiode), `gesture_<s>_look`, `gesture_<s>_shift`, `gesture_<s>_regrip` (beginnen und enden in Zeile 0 von `rest_<s>`, damit sie an der Schleifengrenze einsetzen), `ready_<s>` (Schleife, ruhiges Atmen in Kampfhaltung), `ready_in_<s>` (0,25 s von Ruhe Zeile 0 nach Kampfhaltung Zeile 0; zurück spielt die Laufzeit denselben Clip rückwärts).
- Posen als reine Daten in `tools/art/stance_poses.py` (wie `grip_poses.py`): Zielpunkt des Griff-Sockels und Griffachse je Hand in körperbezogenen Maßen (Schulterhöhe, Hüfthöhe, Schulterbreite der Figur), Lösung in Blender per IK (Kette Oberarm–Unterarm, Pol nach hinten außen) plus Handrotation auf die Griffachse; danach als FK-Keys backen. Eine Tabelle für alle 42 Figuren, keine Handarbeit je Figur.
- Atmen: Spine/Spine1/Spine2 und Schultern, kleine Amplitude, Periode aus `stance_poses.py` (`BREATH_S = 4.0`), Hände bleiben dabei an ihrem Zielpunkt (IK nach dem Atmen lösen, also je Bild). Gesten: Kopf/Hals drehen (look), Hüfte verlagern (shift), Hand der Waffe kurz öffnen und schließen ohne Waffendrehung (regrip). Längen etwa 1,5–2 s.
- Finger der Griffart werden in **alle** Clips gebacken (Ruhe, Geste, Kampf und auch `walk`, `attack*`, `hit`, `downed`, `flee`, `cheer`); Aktions-Clips bekommen die Finger der ersten Haltung der Figur. [ASSUMPTION A4] Die Einzelbild-Clips `grip_*` entfallen danach.
- Ruhe-/Gesten-/Kampf-Clips dürfen mit geringerer Rate gebacken werden, um die `.vat` klein zu halten: `.vat` Version 2 mit eigener Rate je Clip (u8 fps im Clip-Eintrag; Leser liest Version 1 weiter). [ASSUMPTION A5: 30 fps für `rest_*`, `gesture_*`, `ready_*`; `ready_in_*` und Aktionen bleiben 60 fps.]

### Laufzeit

- Reine Funktionen in einem neuen Modul `src/render/shared/stance.ts` (ohne Babylon, gut testbar):
  - `stanceKeyOf(pieces, gear)` → `blade_shield` | `bow` | `none` …
  - `restClips(clips, key)` / Auflösung mit Rückfall (`_shield` → ohne → `none` → `idle`).
  - `gestureSchedule(seed, restSeconds, everyMinS, everyMaxS)` → deterministische Folge (Hash des Figurennamens, kein `Math.random`, damit Screenshots reproduzierbar sind): nach 1 oder 2 Schleifen eine der drei Gesten, so dass der Abstand zwischen Gesten in [6, 10] s liegt.
  - Startversatz der Schleife je Figur aus demselben Hash.
- `ModelFigure`: neuer Zustand `stance: 'rest' | 'ready'` mit `setStance(ready: boolean)`; im Zustand `idle` spielt er `rest_<key>` + Gesten bzw. `ready_<key>`; der Wechsel spielt `ready_in_<key>` vorwärts bzw. rückwärts (0,25 s aus `render.yaml`), auch mitten im Wechsel umkehrbar. `walk`/`attack`/`hit`/`downed` unverändert; danach zurück in den aktuellen Haltungszustand.
- `boardUnits.ts`: an beiden `setRuneGlow`-Stellen zusätzlich `setStance(glowState(...) === 'full')`. Gefallene Figuren bleiben `downed`.
- Buch: `attachGear` (`models.ts`) lädt bei `modelOpen` beide Modelle, das offene ausgeblendet; `setStance` schaltet sichtbar um (mit Runen beider Modelle). Ohne `modelOpen` keine Änderung.
- Werte in `render.yaml` `board.stance: { switchS: 0.25, gestureEveryS: [6, 10] }`; Atemperiode ist im Bake festgelegt.
- Sprites (2D-Option) und Blender-Figuren: `setStance` optional, tut nichts.

## Tasks / Subtasks

### (A) Bake-Pipeline (Blender, kein Tripo)
- [ ] A1 `tools/art/stance_poses.py` (Daten + Doku), Haltungsliste je Figur aus `content/` ableiten (`tripo_units.py` gibt sie an `prepare_tripo_unit.py` weiter).
- [ ] A2 `prepare_tripo_unit.py`: Clips `rest_*`, `gesture_*`, `ready_*`, `ready_in_*` per IK erzeugen und backen; `idle` = `rest_none` ohne Taumeln; Finger in alle Clips; `grip_*` entfernen.
- [ ] A3 `bake_vat.py`: Version 2 mit Rate je Clip, Schleifen-Flag für `rest_*`/`ready_*`; `vat.ts` liest 1 und 2.
- [ ] A4 alle 42 Figuren neu bauen (`pnpm art:tripo`), Budget je Figur und Pakete messen (`pnpm build`-Ausgabe).

### (B) Laufzeit und Daten
- [ ] B1 `render.yaml` `stance`/`stanceMod` je Gruppe, `board.stance`; Schema.
- [ ] B2 `stance.ts` (reine Funktionen) + Unit-Tests.
- [ ] B3 `ModelFigure.setStance`, Ruhe-Schleife mit Gesten, Wechsel 0,25 s; Buch auf/zu.
- [ ] B4 `boardUnits.ts` an `Overlays.glow` koppeln.

### (C) Abnahme
- [ ] C1 Haltungsblatt aller Haltungsarten (Ruhe und Kampfhaltung) aus Blender (`tools/art/grip_shots.py`/`grip_sheet.py` erweitern).
- [ ] C2 Dev-Preview 375 × 812, Lautstärken auf 0: Brett in Ruhe, gewählte Figur in Kampfhaltung.
- [ ] C3 Bildrate auf der größten Karte messen (wie 15.11), Ergebnis in Completion Notes.

## Dev Notes

- **Vor dem Start nur diese Teile lesen:** Art Direction §4.5 (Zeilen 225-247), `prepare_tripo_unit.py` Zeilen 230-300 und `sockets()`/`hand_frame()`, `bake_vat.py` Kopf, `vat.ts`, `figures.ts` Zeilen 100-180, `boardUnits.ts` Zeilen 25-90 und 170-190, `render.yaml` Zeilen 248-295. `models.ts` ist groß: nur per `grep -n` und Ausschnitt (`attachGear` ab Zeile ~243).
- **Nicht tun:** keine Tripo-Credits, keine Handanpassung je Figur, kein `Math.random`/`Date.now` für den Gestenplan (Determinismus der Screenshots), keine Änderung in `src/core` außer ggf. Typen in `defs.ts` (`GearPiece.stance`).
- **Tests dürfen keine echten GLB/VAT-Inhalte voraussetzen** (in der CI sind es Git-LFS-Zeiger): Tests mit synthetischen `VatClip`-Daten bzw. kleinen erzeugten Puffern; vorhandene `tests/unit/vat.test.ts` als Muster.
- **Risiken:** (1) `.vat`-Größe und Paket act1 (39,96/40 MB, warnt nur) bzw. core (30 MB, bricht ab); messen, bei Überschreitung Frage notieren. (2) IK-Ziele passen nicht für jede Figurengröße: Ziele relativ zu Körpermaßen. (3) Waffe darf in der Ruhe nicht durch Körper oder Boden gehen (Lanzenende am Boden: Länge des Modells beachten).
- **Windows:** Blender 5.2 unter `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` (`BLENDER` setzen), gltfpack als `gltfpack.cmd`.

### Project Structure Notes

- Neu: `tools/art/stance_poses.py`, `src/render/shared/stance.ts`, Tests `tests/unit/stance.test.ts`. Kein sichtbarer Text, keine Locale-Schlüssel.

### References

- [Source: concept/23-art-direction/art-direction.md#4.5 Animationen]
- [Source: concept/16-asset-pipeline.md#7.1 Gebackene Vertex-Animation]
- [Source: concept/26-epics/epics/epic-16.md#Story 16.10]
- [Source: _bmad-output/implementation-artifacts/16-9-griff-rig-und-fingerknochen-fuer-alle-brettfiguren.md]
- Mockup `art/mockups/ausruestung-2026-11/animation.html`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
