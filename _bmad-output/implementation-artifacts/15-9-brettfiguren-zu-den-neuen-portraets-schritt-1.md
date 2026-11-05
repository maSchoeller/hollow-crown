# Story 15.9: Brettfiguren zu den neuen Porträts, Schritt 1

Status: ready-for-dev

## Story

Als Spieler
möchte ich die Hauptfiguren auf dem Brett so sehen wie in ihren Porträts,
damit ich sie wiedererkenne.

## Acceptance Criteria

1. **Drei neue Figuren:** Lucan (Inhalts-ID noch `kael`), der Verwalter der Paktwacht (`paktwacht_steward`) und Osric Dunn (`osric`) entstehen neu nach Art Direction §4.6: Brett-Turnaround per ChatGPT aus dem Porträt v2.5 → Tripo (Smart-Mesh, Textur, Auto-Rig) → `pnpm art:tripo`.
2. **Im Spiel:** Osric (1-4) und der Verwalter (1-8) stehen mit ihrer eigenen Figur auf dem Brett statt mit `mercenary` bzw. der Platzhalter-Figur; Lucan erscheint überall, wo bisher Kaels Figur stand.
3. **Tausch:** jede Stelle `sprite: archer` zeigt `bandit_archer` (9 Stellen auf 4 Karten); die Kastenfigur `archer` kommt in keinem Paket mehr vor.
4. **Silhouettentest:** Die drei Figuren sind schwarz gefüllt im Zoom „Mittel“ unterscheidbar (`pnpm art:silhouettes`, Art Direction §4.2).
5. **Budget:** je Figur ≤ 7 000 Dreiecke, Textur 512 px, ≤ 0,5 MB Transfergröße (gzip) – `tools/figure-budget.mjs`.
6. **Nachweis und Herkunft:** Prompt und Abnahme je Turnaround unter `art/prompts/<id>_board_turnaround.md`, Tripo-Lauf und Credit-Verbrauch je Figur dokumentiert (Licensing §6); Porträt neben Brett-Render je Figur und ein Screenshot im Spiel bei 375 × 812 (stumm).
7. **Grenze:** Über die übrigen 9 Modelle und einen Nachkauf von Credits entscheidet der Produktinhaber; nichts davon wird hier gebaut oder gekauft.

## Tasks / Subtasks

- [ ] T1 Brett-Turnarounds (AC 1, 6)
  - [ ] je Figur ein neuer ChatGPT-Chat, Porträt v2.5 (`art/mockups/characters-s1/<id>.png`) und ein Lieblings-Brett-Turnaround (`art/turnarounds/ysolde_board/sheet.png`) als Stil- und Formatvorlage anhängen; ein Prompt für beide Stufen (vereinfacht, ohne Waffe, Teamtuch Magenta), Vorlage `art/prompts/kael_board_turnaround.md`
  - [ ] Teamtuch auf ein **kleines** Stück legen, nie aufs Signaturteil (Befund „Teamtuch frisst Signaturteile“ in `figuren-bestand.md`)
  - [ ] Sheet speichern unter `art/turnarounds/<id>_board/sheet.png`, mit `tools/art/split_turnaround.py` in `front/side/back.png` teilen
  - [ ] selbst gegen Porträt und §4.1/§4.6 prüfen, bevor Credits fließen; höchstens zwei Tripo-Läufe je Figur
- [ ] T2 Tripo (AC 1, 6)
  - [ ] Guthaben in Tripo ablesen, bevor der erste Lauf startet; je Figur 140 Credits (Smart-Mesh 100, Textur 20, Auto-Rig 20)
  - [ ] Pro, Datenschutz „Privat“, Smart-Mesh P2.0 Multi-View (vorn / rechts / hinten), Quad, 3 000 Polygone, Textur, Auto-Rig Humanoid; GLB mit Skelett ohne Animationen nach `art/models/source/<id>_board_tripo.glb`
  - [ ] Hängt Tripo (Login, Limit, Fehler): Stand sichern, nichts kaufen, im Bericht melden
- [ ] T3 Pipeline (AC 1, 2, 5)
  - [ ] Lucan: die Animationsbibliothek `kael_board_tripo.glb` (alter Kael) wird `kael_anims_base.glb`, `ANIM_LIBRARY` in `tools/art/tripo_units.py` zeigt darauf; Lucans Export wird `kael_board_tripo.glb` und baut `kael.glb` (Umbenennung `kael`→`lucan` macht Story 15.6)
  - [ ] `pnpm art:tripo kael osric paktwacht_steward`, Budget-Zeilen prüfen
  - [ ] `content/acts/act1/maps/m1_4_wolfslager.yaml`: Osric `sprite: osric`; `m1_8_paktwacht_halten.yaml`: Verwalter `sprite: paktwacht_steward`
  - [ ] `pnpm art:build`, Paketzuordnung (`tools/art/model_packs.py`) prüfen
- [ ] T4 Tausch `archer` → `bandit_archer` (AC 3)
  - [ ] 9 Stellen in `m1_6_paktwacht.yaml`, `m1_7_gewoelbe.yaml`, `m1_8_paktwacht_halten.yaml`, `n2_wachturm.yaml`; Kartenkommentare nachziehen
  - [ ] weitere Verweise auf `archer` als Figur in `src/`, `tests/`, `tools/` suchen (Klassen-`legacyIds: [archer]` bleibt)
- [ ] T5 Nachweise (AC 4, 6)
  - [ ] `pnpm art:silhouettes kael osric paktwacht_steward bandit_archer`
  - [ ] Bogen Porträt | Brett-Render (Cycles, wie `figuren-bestand.md` „Wie die Bilder entstanden“) je Figur unter `art/previews/`
  - [ ] Screenshot im Spiel 375 × 812, alle Lautstärken 0
- [ ] T6 Doku (AC 6, 7)
  - [ ] `art/prompts/<id>_board_turnaround.md` je Figur, Tripo-Eintrag in `art/prompts/<id>.md`
  - [ ] Credit-Stand im Decision-Log der Art Direction (`concept/23-art-direction/decision-log.md`) und in `figuren-bestand.md` („Credits“, Bestandstabelle)
- [ ] T7 `pnpm check`, `bmad-code-review`, PR

## Dev Notes

- **Ablauf §4.6:** Turnaround (ChatGPT über Claude in Chrome) → Tripo → `pnpm art:tripo` (`tools/art/tripo_units.py` → `prepare_tripo_unit.py` → `bake_vat.py` → gltfpack → `tools/figure-budget.mjs`). Die Animationen kommen immer aus der Bibliothek (`ANIM_LIBRARY`), eine neue Figur braucht nur das Auto-Rig. Blender muss installiert sein (`BLENDER`).
- **Falle Lucan:** `art/models/source/kael_board_tripo.glb` ist zugleich Kaels Figur **und** die Animationsbibliothek (KI-Schlag `attack`, Presets). Ein neuer Export ohne Animationen an diese Stelle würde allen Figuren die Bibliothek nehmen. Deshalb die Bibliothek umbenennen (Endung nicht `_board_tripo.glb`, sonst baut die Pipeline sie als Figur) und erst dann Lucans Export ablegen.
- **Figuren-ID:** `src/core/figure.ts` `unitFigureId`: `sprite` → `charId` → Klassen-`sprite`/`art` → Klassen-ID. Osric steht als `sprite: mercenary`, der Verwalter (Klasse `healer`, ohne `sprite`) als `healer` – dafür gibt es kein Modell, also die Platzhalter-Figur.
- **Teamtuch:** Magenta `#FF00FF` wird zum Teamschlüssel (blau eigene, rot Gegner, grün Dritte). Osric ist Gegner, der Verwalter Dritter, Lucan eigene Einheit. Kleines Stück wählen, Signaturteile frei lassen: Lucan grüner Wappenrock, Pelzkragen, linkes Schulterstück; Osric senfgelber Mantel mit braunem Pelz, Hauptbuch, Geldbeutel; Verwalter dunkelgrüne Weste, Schlüsselbund.
- **Ohne Waffe im Turnaround:** Waffen hängen zur Laufzeit am Sockel. Osric (Klasse `skirmisher`, `steel_sword`) und der Verwalter (`heal_staff`) bekommen ihre Waffe so. Hauptbuch und Schlüsselbund sind Kleidung bzw. Gürtel, keine Waffe; der Schlüsselbund darf am Gürtel bleiben, das Hauptbuch nicht in die Hand (die Hand trägt die Waffe).
- **Größe:** `prepare_tripo_unit.py` skaliert jede Figur auf die gemeinsame Höhe; die Statur (Osric heavy, Verwalter slim und gebeugt) muss also aus der Form kommen, nicht aus der Höhe. Das allgemeine „alle gleich groß“ ist Sache der Bibel, nicht dieser Story.
- **Credits:** rechnerisch ~425 (`figuren-bestand.md` „Credits“), drei Figuren kosten 420. Ein zweiter Lauf ist damit praktisch nicht bezahlbar; daher die Selbstprüfung vor dem Lauf. Vor dem ersten Lauf Guthaben ablesen.
- **Nicht hier:** Umbenennung `kael`→`lucan` (Story 15.6, wartet auf PR #104), Kartenumbau (15.3–15.5; die Kartendateien können sich dort ändern – Konflikte beim Merge klein halten, nur die `sprite`-Zeilen anfassen), Dorfältester und Schritt 2/3.

### Project Structure Notes

- Rohdaten: `art/turnarounds/<id>_board/`, `art/models/source/<id>_board_tripo.glb` (unverändertes Original, A3), Ergebnis `art/models/units/<id>.glb` + `.vat`. PNG und GLB liegen in Git LFS.
- Turnaround-Ordner für Lucan heißt `lucan_board` (neuer Name gilt in Doku und Bildern); Modell-IDs bleiben bis 15.6 `kael`.

### Project Context Rules

- Nie auf `main`, PR nach grüner CI selbst mergen (Memory „Abnahme und Merge delegiert“).
- KI-Assets nur nach `concept/23-art-direction/licensing.md` §6; keine Namen fremder Werke in Prompts.
- Fertig erst mit grünem `pnpm check`; Spiel beim Testen stumm.
- Bilder per ChatGPT über Claude in Chrome, nicht nach jedem Schritt Screenshot.

### References

- [Source: concept/26-epics/epics/epic-15.md#Story 15.9]
- [Source: concept/23-art-direction/figuren-bestand.md – Reihenfolge, Bestand, Credits, Was die Bibel klären sollte]
- [Source: concept/23-art-direction/art-direction.md#4.1, #4.2, #4.6]
- [Source: art/prompts/kael_board_turnaround.md, bandit_archer_board_turnaround.md, osric.md, paktwacht_steward.md, kael.md]
- [Source: _bmad-output/implementation-artifacts/8-2-tripo-pipeline-vervollstaendigen.md – Bibliothek, Budget]
- [Source: tools/art/tripo_units.py, prepare_tripo_unit.py, silhouettes.py, split_turnaround.py; src/core/figure.ts]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created

### File List
