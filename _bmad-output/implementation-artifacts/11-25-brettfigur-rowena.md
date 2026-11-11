# Story 11.25: Brettfigur Rowena (Schritt 3, verkleinert)

Status: ready-for-dev

> **Wartet auf Tripo-Credits.** Tripo zeigt am 2026-11-11 65 Credits, eine Figur kostet 140 (F2 rechnete mit dem Stand vor Story 15.14). Der Produktinhaber hat die Story am 2026-11-11 zurückgestellt (Option c): Erledigt ist der Teil ohne Credits (T1, T2, T3 bis auf die Abnahme, Teile von T7). Kein Tripo-Lauf, `rowena.glb` bleibt Platzhalter. Weiter mit T3-Abnahme und T4, sobald Credits da sind. *Nachtrag 2026-11-11:* Der Produktinhaber prüft per Vergleichsbild, ob das alte Modell bleiben darf; dann entfallen Tripo und Nacharbeit. Der Turnaround gilt als Referenz, nicht abgenommen. Die Story bleibt offen, bis er entschieden hat.

## Story

Als Spieler
möchte ich Rowena auf dem Brett so sehen wie in ihrem Porträt,
damit ich sie wiedererkenne.

**F2 (Produktinhaber 2026-11-06):** Nur Rowena entsteht neu, mit dem Rest-Guthaben (eine Figur zu 140 Credits). Brann behält sein Modell, Ritter der Lanze und Kaperfahrer nutzen die Platzhalter aus 11.7 (Entscheidung erst nach 11.27, Frage 10 vom 2026-11-07). Brakka bekommt kein neues Modell, nur ihr Figurenblatt wird berichtigt.

## Acceptance Criteria

1. **Guthaben zuerst:** Vor dem Lauf wird das Tripo-Guthaben abgelesen. Unter 140 Credits gibt es keinen Lauf, und es wird nichts gekauft; der Orchestrator bzw. der Produktinhaber entscheidet.
2. **Figurenblätter:** `art/prompts/rowena.md` beschreibt Rowena als Lanzenritterin zu Fuß mit dem Helm unterm Arm (kein Pegasus), `art/prompts/brakka.md` beschreibt Brakka als Ballistenmeisterin (kein Wyvern), jeweils als Nachtrag; der Prompt bleibt im Wortlaut der Erzeugung (Licensing §6, A3).
3. **Neue Figur:** Rowena entsteht nach Art Direction §4.6: Brett-Turnaround per ChatGPT aus dem Porträt `art/mockups/characters-s1/rowena.png` (langer Zopf, Helm **nicht** auf dem Kopf) → Abnahme durch den Orchestrator → Tripo (Smart-Mesh, Textur, Auto-Rig, Datenschutz „Privat“, ein Lauf zu 140 Credits) → `pnpm art:tripo rowena`.
4. **Im Spiel:** `rowena.glb` ersetzt das Oktober-Modell (Helm auf dem Kopf) an derselben Stelle; `lieutenants.yaml` `model: rowena` und die Karten 2-3/2-8 bleiben unverändert. Die übrigen Platzhalter (Ritter, Kaperfahrer) und Brann, Brakka bleiben, wie sie sind.
5. **Silhouettentest:** schwarz gefüllt im Zoom „Mittel“ unterscheidbar (`pnpm art:silhouettes`, Art Direction §4.2).
6. **Budget:** ≤ 7 000 Dreiecke, Textur 512 px, ≤ 0,5 MB Transfergröße (gzip), `tools/figure-budget.mjs`.
7. **Nachweis:** Prompt und Abnahme unter `art/prompts/rowena_board_turnaround.md`, Tripo-Lauf und Credits dokumentiert; `concept/23-art-direction/figuren-bestand.md`, Decision-Log der Art Direction und `art/README.md` nachgezogen; Screenshot im Spiel bei 375 × 812 (stumm).

## Tasks / Subtasks

- [x] T1 Tripo-Guthaben ablesen (AC 1)
- [x] T2 Figurenblätter Rowena und Brakka berichtigen (AC 2)
- [ ] T3 Brett-Turnaround per ChatGPT, teilen mit `tools/art/split_turnaround.py`, Abnahme beim Orchestrator (AC 3)
  - [x] Turnaround erzeugt (2 Iterationen) und geteilt, Vergleichsbild übergeben
  - [ ] Abnahme (Stand: Referenz, nicht abgenommen)
- [ ] T4 Tripo-Lauf, GLB nach `art/models/source/rowena_board_tripo.glb` (AC 3)
- [ ] T5 `pnpm art:tripo rowena`, Budget-Zeile, `pnpm art:build` (AC 4, 6)
- [ ] T6 Silhouetten, Vergleichsbogen, Screenshot 2-3 (AC 5, 7)
- [ ] T7 Doku: Prompt-Datei, Decision-Log, `figuren-bestand.md`, `art/README.md` (AC 7)
  - [x] Stand „wartet auf Credits“ eingetragen (2026-11-11); nach dem Lauf Tripo-Eintrag, Credits, Bestand ✅
- [ ] T8 `pnpm check`, PR gegen `main` (nicht selbst mergen), Status review
  - [x] Zwischen-PR mit dem Teil ohne Credits, Status bleibt ready-for-dev

## Dev Notes

- **Ablauf wie 15.14** (`15-14-brettfigur-dorfaeltester.md`): Turnaround (ChatGPT über Claude in Chrome, Porträt + ein vorhandenes Brett-Sheet nur als Format- und Stilvorlage) → Tripo Smart-Mesh P2.0 Multi-View (Front/Right/Back), Quad, 3 000 Polygone, 4 Varianten (100) + Textur (20) + Auto-Rig Humanoid/Mixamo (20) → Export GLB mit Skelett → `pnpm art:tripo rowena` (`tools/art/tripo_units.py` → `prepare_tripo_unit.py` → `bake_vat.py` → gltfpack → `tools/figure-budget.mjs`). Animationen kommen aus `ANIM_LIBRARY`.
- **Ersetzt, nicht neu:** Turnaround (`art/turnarounds/rowena_board/`), Tripo-Quelle und Einheitsmodell existieren aus dem Oktober (Helm auf dem Kopf, Pegasus-Ritterin). Die alte Fassung bleibt in der Git-Historie. Keine Inhalts-ID ändert sich, `content:lock` und `released` bleiben unberührt (Akt 2 unveröffentlicht).
- **Helm unterm Arm:** Ein Helm, der zwischen Arm und Rumpf klemmt, verschmilzt im Mesh und bekommt beim Auto-Rig gemischte Gewichte (Schmieren beim Gehen). Den Helm deshalb fest an den linken Unterarm/die Hand legen und in der A-Pose etwas vom Rumpf abheben; eine Alternative (Helm am Gürtel links) mit vorlegen.
- **Teamtuch:** Magenta `#FF00FF` als Schlüssel; Umhang und Tabard wie im Oktober, Zopf und Helm in Eigenfarbe.
- **Credits:** Bei Story-Beginn (2026-11-11) zeigt Tripo **65 Credits**; Story 15.14 hat 205 → 65 verbraucht, F2 rechnete mit dem älteren Stand. T4 wartet auf die Entscheidung des Orchestrators (Nachkauf oder Alternative).
- **Parallel:** Story 11.24 (Kartenmodelle) läuft in einer zweiten Session; Blender nur headless über `tools/art/*.py`, keine Kartenmodelle anfassen.

### Project Context Rules

- Nie auf `main`, nie force-pushen, PR nicht selbst mergen (Orchestrator merged).
- KI-Assets nur nach `concept/23-art-direction/licensing.md` §6; keine Namen fremder Werke in Prompts.
- Fertig erst mit grünem `pnpm check`; Spiel beim Testen stumm; Screenshots `scale: 0.5`.

### References

- [Source: concept/26-epics/epics/epic-11.md#Story 11.25]
- [Source: concept/23-art-direction/art-direction.md §4.1–4.6]
- [Source: concept/23-art-direction/figuren-bestand.md – Reihenfolge, Bestand Akt 2, Credits]
- [Source: _bmad-output/implementation-artifacts/15-14-brettfigur-dorfaeltester.md]
- [Source: art/prompts/rowena.md, rowena_board_turnaround.md, villager_elder_board_turnaround.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Completion Notes List

- 2026-11-11: Tripo-Guthaben 65 (Kopfleiste Tripo Studio). Orchestrator/PO: Story zurückstellen, nur der Teil ohne Credits.
- Turnaround: Chat https://chatgpt.com/c/6af48a28-247c-83ed-b7d6-928aa888c9c9, v1 mit Zopf vorn über der Schulter verworfen, v2 übernommen. Helm in der linken Hand mit Abstand zum Rumpf statt unter die Achsel geklemmt (Rig).
- Figurenblätter Rowena und Brakka als Nachtrag berichtigt (Prompt bleibt im Wortlaut, A3).
- Sichtprüfung altes Modell: headless Workbench-Render von `art/models/source/rowena_board_tripo.glb` (vorn/rechts/hinten, Brett 35° Neigung, 72 px Zelle wie `tools/art/silhouettes.py`); Vergleichsbild in den Session-Notizen des Orchestrators. Unterschiede: Helm auf dem Kopf statt in der Hand, Zopf kürzer, Umhang gezackt, keine braunen Handschuhe.

### File List

- `art/turnarounds/rowena_board/{sheet,front,side,back}.png`
- `art/prompts/rowena_board_turnaround.md`, `rowena.md`, `brakka.md`, `brakka_board_turnaround.md`
- `concept/23-art-direction/figuren-bestand.md`, `decision-log.md`; `art/README.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`, `11-25-brettfigur-rowena.md`
