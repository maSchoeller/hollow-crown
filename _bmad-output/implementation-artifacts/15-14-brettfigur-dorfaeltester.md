# Story 15.14: Brettfigur Dorfältester (Folge zu 15.9)

Status: review

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

- [x] T1 Guthaben in Tripo über Claude in Chrome ablesen (AC 1)
- [x] T2 Brett-Turnaround (AC 2, 6)
  - [x] neuer ChatGPT-Chat, Porträt `art/mockups/characters-s1/villager_elder.png` und `art/turnarounds/ysolde_board/sheet.png` als Stil- und Formatvorlage; Prompt nach `art/prompts/osric_board_turnaround.md`
  - [x] Teamtuch klein (Halstuch), nie auf Strohhut oder Kinnbärtchen; ohne Wanderstab (Hände leer)
  - [x] `art/turnarounds/villager_elder_board/sheet.png` ersetzen, mit `tools/art/split_turnaround.py` teilen; selbst gegen Porträt prüfen
- [x] T3 Tripo-Lauf (AC 2, 6): Privat, Smart-Mesh Multi-View (vorn / rechts / hinten), Quad, 3 000 Polygone, Textur, Auto-Rig Humanoid; GLB nach `art/models/source/villager_elder_board_tripo.glb`
- [x] T4 Pipeline (AC 2, 3, 5): `pnpm art:tripo villager_elder`, Budget-Zeile prüfen, `pnpm art:build`; Karten prüfen
- [x] T5 Nachweise (AC 4, 6): Silhouetten, Bogen Porträt | Brett-Render, Screenshot 375 × 812 auf 1-2 (Ton aus)
- [x] T6 Doku (AC 6): Prompt-Datei, Tripo-Eintrag, Decision-Log, `figuren-bestand.md`
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
- 2026-11-06: **Abbruch vor T2.** Tripo Studio zeigt 205 Credits, der Preisdialog führt das Konto aber als **Free** („Included“), Banner „Upgrade to unlock Smart Mesh & Multi-Views“. Nach Vorgabe der Auftrags-Session (Abbruch bei Free) kein Turnaround, kein Lauf, 0 Credits verbraucht, nichts gekauft. Weiter erst nach Entscheidung des Produktinhabers zum Tarif.
- 2026-11-06: Produktinhaber gibt den Lauf frei („Trotzdem bauen“, Credits aus dem bezahlten Tarif). Auf seinen Hinweis vorher geprüft, dass es keinen Ältesten nach dem neuen Porträt gibt: lokal nur die Oktober-Fassung (`08b771a`), in Tripo „Assets“ nur die Läufe vom 2026-10-26 und von Story 15.9.
- Turnaround: ein ChatGPT-Chat, eine Nachricht, abgenommen (`art/prompts/villager_elder_board_turnaround.md`). Tripo: ein Lauf, Variante 1 von 4, Privat, 140 Credits, **205 → 65**. `pnpm art:tripo villager_elder`: 6 533 Dreiecke, 512 px, 0,28 MB gz. Silhouette in Gruppe „Bosses and NPCs“ eindeutig (breiter Hut). `pnpm art:build` ohne weitere Änderungen; Karten unverändert, da alle Stellen schon `villager_elder` nutzen (1-2 `elder`, `haunts.yaml` `civilian`, Klasse `civilian`).
- Bilder: `art/previews/figuren_15_14_elder.png`, `art/previews/story_15_14_elder_m1_2.png` (Playwright mit Software-WebGL, 375 × 812, Ton aus; deshalb grob).
- Folgepunkt: Halvard (1-3) und Tobins Vater (N3) nutzen `villager_elder` als Platzhalter und tragen jetzt den Strohhut.

### File List

- `_bmad-output/implementation-artifacts/15-14-brettfigur-dorfaeltester.md`, `sprint-status.yaml`; `concept/26-epics/epics/epic-15.md`, `index.md`
- `art/turnarounds/villager_elder_board/{sheet,front,side,back}.png`, `art/models/source/villager_elder_board_tripo.glb`, `art/models/units/villager_elder.{glb,vat}`
- `art/prompts/villager_elder_board_turnaround.md` (neu), `villager_elder.md`, `villager_board_turnaround.md`
- `art/previews/{silhouettes_act1,silhouettes_act1_large,figuren_15_14_elder,story_15_14_elder_m1_2}.png`, `tools/art/silhouettes.py`
- `concept/23-art-direction/decision-log.md`, `figuren-bestand.md`
