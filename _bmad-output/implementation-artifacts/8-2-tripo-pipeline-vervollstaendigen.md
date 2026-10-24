# Story 8.2: Tripo-Pipeline vervollständigen

Status: ready-for-dev

## Story

Als Entwickler
möchte ich jede neue Tripo-Figur ohne Handarbeit und ohne zusätzliche KI-Animationen ins Spiel bringen,
damit alle Figuren gleich aussehen, ins Budget passen und Credits sparen.

## Acceptance Criteria

1. **Waffenbibliothek:** Es gibt Modellteile für alle Waffengruppen Schwert, Lanze, Axt, Bogen, Buch, Stab, Schild, Dolch und Laute in `art/models/weapons/` (Bauskript `tools/art/blender_weapons.py`), die an den Hand-Sockel (`socket_r`/`socket_l`) der Figur passen. `content/core/render.yaml` `gear` ordnet jede Waffengruppe (und Nebenhand-Art) einem Modell zu, sodass das Modell der ausgerüsteten Waffengruppe an der Hand erscheint. Neu sind **Dolch** und **Laute** samt `gear`-Einträgen.
2. **Animationen eines Skeletttyps:** Die Bibliothek (Kaels Export `art/models/source/kael_board_tripo.glb`) enthält zusätzlich **Flucht** (`flee`, für Leutnants) und **Jubel** (`cheer`, für Sieg und Stufenaufstieg), an Kaels Rig „an Ort und Stelle“ exportiert. `pnpm art:tripo` überträgt sie wie die übrigen Animationen auf jede Figur. Je Skeletttyp (heute einer: Tripo Auto-Rig „Humanoid“, Mixamo-Skelett) ist damit höchstens eine KI-Animation je Bibliotheks-Eintrag nötig, nie eine je Figur.
3. **Animationsquelle:** Für `flee` und `cheer` werden zuerst die kostenlosen Tripo-Presets geprüft (Vorbild im Entscheidungslog: Presets zuerst); nur wenn kein Preset taugt, entsteht je Animation eine KI-Animation (20 Credits). Die Wahl und der Credit-Stand stehen im Entscheidungslog (`concept/23-art-direction/decision-log.md`).
4. **Budget-Prüfung:** `pnpm art:tripo` und `pnpm art:build` melden als Warnung jede Figur über **7 000 Dreiecken**, mit einer **größeren Textur als 512 px** oder über **0,5 MB Transfergröße (gzip)**; große Einheiten (Reittiere, Drachen) dürfen das Doppelte. Der Build bricht dafür nicht ab, nennt aber die Ausreißer mit Figur und Wert.
5. **Ausgabe ins Paket:** Eine aufbereitete Figur landet beim Lauf von `pnpm art:build` im **Paket ihres ersten Auftritts** (`public/assets/<pack>/models/`, Epic 7), nicht mehr pauschal in `models/`. Die Paketzuordnung folgt `content/packs.yaml`. **Abhängigkeit:** Dieser Punkt ändert `tools/art/build.py`, `src/render/shared/models.ts` und `src/render/board`, die PR #33 (Stories 5.1/5.2/5.4) gerade umschreibt; er wird erst begonnen, wenn PR #33 in `main` gemergt ist.
6. **Prüfungen grün:** `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm art:build`, `pnpm build` (im Bundle-Budget). Ein Commit für die Story. Nicht Teil der Story: Audio und die Effekte aus Story 8.6.

## Tasks / Subtasks

- [ ] T1 Waffenmodelle Dolch und Laute (AC 1)
  - [ ] `tools/art/blender_weapons.py` baut `dagger` und `lute`. Die Arbeit ist begonnen: `art/models/weapons/dagger.glb`, `lute.glb` und eine Änderung am Skript liegen im Arbeitsbaum eines anderen Agenten; vor dem Start den Stand klären und nicht doppelt bauen
  - [ ] Maße, Griffrichtung und Vertex-Farben (Hollow-64) wie die übrigen Waffen; Prüfung in Blender
  - [ ] `content/core/render.yaml` `gear.weapons`: Waffengruppen Dolch und Laute mit `model`, `hand`, ggf. `motion`/`hold`; Zuordnung gegen die Waffengruppen in `content/core` prüfen (keine Gruppe ohne Modell)
- [ ] T2 Animationen Flucht und Jubel (AC 2, 3)
  - [ ] Presets in Tripo am Rig von Kael prüfen; sonst je eine KI-Animation (20 Credits) und den Prompt in `art/prompts/` festhalten
  - [ ] „An Ort und Stelle“ exportieren und `art/models/source/kael_board_tripo.glb` ersetzen; bestehende Clips (`idle`, `walk`, `attack*`, `hit`, `downed`) bleiben unverändert
  - [ ] `tools/art/prepare_tripo_unit.py` benennt die neuen Clips `flee` und `cheer`, tastet sie mit 12 fps ab und überträgt sie ruheposen-relativ; `pnpm art:tripo` neu laufen lassen, jede Figur enthält beide Clips
  - [ ] Wo der Render-Code Animationsnamen kennt, `flee`/`cheer` als bekannte Namen aufnehmen; das Abspielen im Spiel gehört zu Story 8.6, hier werden nur Clips und Namen bereitgestellt
- [ ] T3 Budget-Prüfung (AC 4)
  - [ ] Dreiecke, Textur und gzip-Größe je Figur in `tools/art/tripo_units.py` (Ausgabe `[hc]`-Zeilen) und im Abschlussbericht von `tools/art/build.py` melden; Schwellen aus Art Direction §4.6 (7 000, 512, 0,5 MB, große Einheiten doppelt) an einer Stelle als Konstante bzw. Konfiguration, keine Zahlen verstreut
  - [ ] Prüfung mit einer bewusst zu großen Figur (Ausreißer wird gemeldet)
  - [ ] Auch hier ist Arbeit begonnen (anderer Agent); Stand vorher klären
- [ ] T4 Ausgabe ins Paket des ersten Auftritts (AC 5), **erst nach Merge von PR #33**
  - [ ] Erster Auftritt je Figur bestimmen (aus `content/acts/*/units.yaml` und Karten; Paketzuordnung über `content/packs.yaml`) und Modelle nach `public/assets/<pack>/models/` schreiben
  - [ ] Lader in `src/render/shared/models.ts` und Brett-Code lesen die Pfade aus dem Manifest, nicht aus festen Pfaden
  - [ ] `content/packs.yaml` `assets`-Globs anpassen, falls sich die Pfade ändern; Budgets `core` (15 MB) und `act1` (40 MB) prüfen
- [ ] T5 Prüfungen und Entscheidungslog (AC 6)
  - [ ] `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm art:build`, `pnpm build`
  - [ ] Eintrag im Entscheidungslog der Art Direction: Animationsquelle (Preset oder KI), Credit-Stand, Budgetschwellen

## Dev Notes

- **Vorhanden:** `pnpm art:tripo` (`tools/art/tripo_units.py` → `tools/art/prepare_tripo_unit.py`, Blender, danach gltfpack mit `-kn -km -c -af 12`) erzeugt `art/models/units/<id>.glb` aus `art/models/source/<id>_board_tripo.glb`. Teamtuch per Magenta-Schlüssel (Vertex-Alpha K2), Animationen mit 12 fps nur Rotationen, Angriffe und Treffer auf 0,5 s getaktet (Aufprall 0,25 s), Hand-Sockel `socket_r`/`socket_l`. Fehlende Animationen kommen immer aus `ANIM_LIBRARY` (Kaels Export); eigene Animationen einer Figur haben Vorrang.
- **Waffen heute:** Schwert, Lanze, Axt, Bogen, Buch, Stab, Schild in `art/models/weapons/` (`tools/art/blender_weapons.py`, je 170–380 Dreiecke); `render.yaml` `gear.weapons`/`gear.offHand` ordnet Modell, Hand, `motion` (Angriffsclip `attack_<motion>`, ohne: Schwerthieb) und `hold` zu. Im `gear`-Block stehen `sword`, `lance`, `axe`, `bow`, `anima`/`light`/`dark` (Buch), `staff` und Nebenhand `shield`; Dolch und Laute fehlen.
- **Skelett:** Ein Skeletttyp (Tripo Auto-Rig Humanoid, Mixamo-Knochennamen). Neue Skeletttypen (Vierbeiner, Reittiere, Drache) sind nicht Teil dieser Story (Art Direction §4.6 Schritt 6 „Offen“).
- **Credits:** Stand laut Entscheidungslog 1 165. Presets kosten nichts, eine KI-Animation 20 Credits; Story 8.3 reserviert 420 Credits für drei neue Figuren. Nicht darüber hinaus ausgeben.
- **Budget:** Art Direction §4.6: etwa 6 000–7 000 Dreiecke, Textur 512 × 512, ≤ 0,5 MB Transfer (gzip, wie der Build-Check); Kael 6 385 Dreiecke, ≈ 0,4 MB. Das Bundle-Budget `core` lag laut Story 8.5 bei 14,85 von 15,00 MB; Figuren gehören in Pakete, nicht in `core`.
- **Konflikt mit PR #33:** `tools/art/build.py`, `src/render/shared/models.ts`, `src/render/board` werden dort umgeschrieben. Alles in T4 und jede Änderung an `build.py` (auch die Budget-Meldung aus T3, soweit sie dort liegt) wartet auf den Merge nach `main`. T1, T2 und die Meldung in `tools/art/tripo_units.py` sind davon unabhängig.
- **KI-Auflagen (Licensing §6):** Jede KI-Animation und jedes Tripo-Ergebnis bekommt einen Eintrag in `art/prompts/<id>.md`: Dienst (Tripo Pro, Datenschutz „Privat“), Tarif und Konto zum Erzeugungsdatum (A1, A2), Prompt, Referenzen, Iterationen, Ablageort des unveränderten Originals (A3, `art/models/source/`) und menschlicher Anteil. Auch die Blender-Waffen sind im Log zu vermerken.
- **Konventionen (AGENTS.md):** Spielwerte nie im Code, kein sichtbarer Text im Code, Code und Bezeichner Englisch, Konzeptdokumente Deutsch. Neue Entscheidungen ins Entscheidungslog der Art Direction, nicht in `concept/01-decisions.md`.
- **Offen:** Welche Tripo-Presets für Flucht und Jubel taugen, zeigt erst die Prüfung in Tripo (AC 3); bis dahin ist offen, ob 0 oder bis zu 40 Credits anfallen.
- **Erhalten:** Alle bestehenden Clips, Teamtuch-Schlüssel, Hand-Sockel, Blickrichtung Süden, Höhe der Figuren, vorhandene `gear`-Einträge.

### References

- [Source: concept/26-epics/epics.md#Story 8.2: Tripo-Pipeline vervollständigen]
- [Source: concept/23-art-direction/art-direction.md §4.2, §4.5, §4.6, §11]
- [Source: concept/23-art-direction/decision-log.md – Zeilen 2026-10-23 zu Animationsübertragung, Waffenbibliothek, Credits, Größenbudget]
- [Source: concept/23-art-direction/licensing.md §6 (A1–A5)]
- [Source: concept/16-asset-pipeline.md]
- [Source: content/core/render.yaml (`gear`), content/packs.yaml]
- [Source: tools/art/tripo_units.py, tools/art/prepare_tripo_unit.py, tools/art/blender_weapons.py, tools/art/build.py]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
