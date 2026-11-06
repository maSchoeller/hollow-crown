# Story 15.14: Brettfigur Dorfältester (Folge zu 15.9)

Status: ready-for-dev

## Story

Als Spieler
möchte ich den Dorfältesten auf dem Brett so sehen wie in seinem Porträt,
damit ich ihn wiedererkenne.

## Acceptance Criteria

1. **Guthaben zuerst:** Vor jedem Lauf wird das Tripo-Guthaben abgelesen. Erwartet 205 Credits im bezahlten Tarif; bei weniger als 140 Credits oder Tarif „Free“ bricht die Story ab und meldet es, nichts wird gekauft.
2. **Neue Figur:** Der Dorfälteste (`villager_elder`) entsteht neu nach Art Direction §4.6: Brett-Turnaround per ChatGPT aus dem Porträt v2.5 (Strohhut, dünnes Kinnbärtchen, normal gebaut, leicht gebeugt) → Tripo (Smart-Mesh, Textur, Auto-Rig, Datenschutz „Privat“) → `pnpm art:tripo villager_elder`. Höchstens ein Lauf (140 Credits).
3. **Im Spiel:** Die Figur steht überall, wo der Dorfälteste vorkommt: 1-2 (`elder`), die Zivilisten der Spuk-Aufträge (`haunts.yaml` `civilian`) und der Klassen-Rückfall `civilian` in `classes.yaml`.
4. **Silhouettentest:** schwarz gefüllt im Zoom „Mittel“ unterscheidbar (`pnpm art:silhouettes`, Art Direction §4.2).
5. **Budget:** ≤ 7 000 Dreiecke, Textur 512 px, ≤ 0,5 MB Transfergröße (gzip) – `tools/figure-budget.mjs`.
6. **Nachweis und Herkunft:** Prompt und Abnahme unter `art/prompts/villager_elder_board_turnaround.md`, Tripo-Lauf und Credit-Verbrauch dokumentiert (Licensing §6), neuer Credit-Stand im Decision-Log der Art Direction und in `figuren-bestand.md`; Bogen Porträt | Brett-Render und ein Screenshot im Spiel bei 375 × 812 (stumm).

## Tasks / Subtasks

- [ ] T1 Guthaben in Tripo über Claude in Chrome ablesen (AC 1)
- [ ] T2 Brett-Turnaround (AC 2, 6)
  - [ ] neuer ChatGPT-Chat, Porträt `art/mockups/characters-s1/villager_elder.png` und `art/turnarounds/ysolde_board/sheet.png` als Stil- und Formatvorlage; Prompt nach `art/prompts/osric_board_turnaround.md`
  - [ ] Teamtuch klein (Halstuch), nie auf Strohhut oder Kinnbärtchen; ohne Wanderstab (Hände leer)
  - [ ] `art/turnarounds/villager_elder_board/sheet.png` ersetzen, mit `tools/art/split_turnaround.py` teilen; selbst gegen Porträt prüfen
- [ ] T3 Tripo-Lauf (AC 2, 6): Privat, Smart-Mesh Multi-View (vorn / rechts / hinten), Quad, 3 000 Polygone, Textur, Auto-Rig Humanoid; GLB nach `art/models/source/villager_elder_board_tripo.glb`
- [ ] T4 Pipeline (AC 2, 3, 5): `pnpm art:tripo villager_elder`, Budget-Zeile prüfen, `pnpm art:build`; Karten prüfen
- [ ] T5 Nachweise (AC 4, 6): Silhouetten, Bogen Porträt | Brett-Render, Screenshot 375 × 812 auf 1-2 (Ton aus)
- [ ] T6 Doku (AC 6): Prompt-Datei, Tripo-Eintrag, Decision-Log, `figuren-bestand.md`
- [ ] T7 `pnpm check`, `bmad-code-review`, PR, nach grüner CI mergen, Status done

## Dev Notes

- **Ablauf wie 15.9:** Turnaround (ChatGPT über Claude in Chrome) → Tripo → `pnpm art:tripo` (`tools/art/tripo_units.py` → `prepare_tripo_unit.py` → `bake_vat.py` → gltfpack → `tools/figure-budget.mjs`). Animationen kommen aus `ANIM_LIBRARY` (`lucan_anims_base.glb`, `lucan_anims_flee_cheer.glb`); die Figur braucht nur das Auto-Rig.
- **Ersetzt, nicht neu:** `villager_elder` existiert schon (Oktober 2026, Glatze und Vollbart, `art/prompts/villager_board_turnaround.md`). Die neuen Dateien ersetzen Turnaround, Tripo-Quelle und Einheitsmodell an derselben Stelle; die alte Fassung bleibt in der Git-Historie (Commit `43e66e3`). Karten-IDs ändern sich nicht, also kein Karteneingriff nötig.
- **Platzhalter-Nutzer:** Halvard (1-3, `sprite: villager_elder`, „bis es eine eigene gibt“) und Tobins Vater (N3) nutzen dieselbe Figur und sehen danach auch den Strohhut. Eigene Figuren für sie sind nicht Teil dieser Story (Folgepunkt).
- **Teamtuch:** Magenta `#FF00FF` wird zum Teamschlüssel; der Älteste ist Dritter (grün). Salbeigrünes Halstuch als Teamtuch-Stück wie in der Oktober-Fassung.
- **Credits:** 205 erwartet (Stand 15.9), ein Lauf 140, Rest 65 – kein zweiter Lauf möglich, deshalb Selbstprüfung vor dem Lauf.

### Project Context Rules

- Nie auf `main`, PR nach grüner CI selbst mergen (Memory „Abnahme und Merge delegiert“).
- KI-Assets nur nach `concept/23-art-direction/licensing.md` §6; keine Namen fremder Werke in Prompts.
- Fertig erst mit grünem `pnpm check`; Spiel beim Testen stumm; Screenshots `scale: 0.5`.

### References

- [Source: concept/26-epics/epics/epic-15.md#Story 15.14]
- [Source: concept/23-art-direction/figuren-bestand.md – Reihenfolge Schritt 1b, Bestand, Credits]
- [Source: _bmad-output/implementation-artifacts/15-9-brettfiguren-zu-den-neuen-portraets-schritt-1.md]
- [Source: art/prompts/villager_elder.md (Korrektur 2026-11-03), villager_board_turnaround.md, osric_board_turnaround.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created

### File List
