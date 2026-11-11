# Story 11.25: Brettfigur Rowena (Schritt 3, verkleinert)

Status: review

> **Produktinhaber 2026-11-11:** Das vorhandene Tripo-Modell `rowena.glb` (Oktober 2026) ist abgenommen, so wie es ist und gewollt. Ein Neubau entfällt endgültig, auch später nicht. Das ersetzt den Neubau-Plan aus F2: Tripo zeigte 65 statt der erwarteten 205 Credits (Story 15.14 hatte sie am 2026-11-06 schon verbraucht); nach der Sichtprüfung (Porträt | Turnaround | altes Modell | Brett „Mittel“) hat der Produktinhaber das alte Modell behalten. Die ACs unten sind entsprechend angepasst.

## Story

Als Spieler
möchte ich Rowena auf dem Brett so sehen wie in ihrem Porträt,
damit ich sie wiedererkenne.

**F2 (Produktinhaber 2026-11-06):** Nur Rowena entsteht neu, mit dem Rest-Guthaben (eine Figur zu 140 Credits). Brann behält sein Modell, Ritter der Lanze und Kaperfahrer nutzen die Platzhalter aus 11.7 (Entscheidung erst nach 11.27, Frage 10 vom 2026-11-07). Brakka bekommt kein neues Modell, nur ihr Figurenblatt wird berichtigt. **Für Rowena abgelöst am 2026-11-11:** altes Modell abgenommen, kein Neubau.

## Acceptance Criteria

1. **Guthaben zuerst:** Vor einem Lauf wird das Tripo-Guthaben abgelesen; unter 140 Credits kein Lauf, nichts gekauft. ✅ 65 Credits abgelesen, kein Lauf, 0 Credits verbraucht.
2. **Figurenblätter:** `art/prompts/rowena.md` beschreibt Rowena als Lanzenritterin zu Fuß mit dem Helm unterm Arm (kein Pegasus), `art/prompts/brakka.md` beschreibt Brakka als Ballistenmeisterin (kein Wyvern), jeweils als Nachtrag; der Prompt bleibt im Wortlaut der Erzeugung (Licensing §6, A3). ✅
3. **Figur (angepasst):** Rowena behält das vorhandene Tripo-Modell `rowena.glb`; der Produktinhaber hat es am 2026-11-11 per Sichtprüfung abgenommen. Der neue Brett-Turnaround bleibt nur als „Referenz, nicht abgenommen“ in `art/prompts/rowena_board_turnaround.md` und `art/turnarounds/rowena_board/`. ✅
4. **Im Spiel:** Rowena steht auf 2-3 und 2-8 mit `rowena.glb` (Leutnant → `lieutenants.yaml` `model: rowena` → `src/core/battle/create.ts`, kein Platzhalter); die übrigen Platzhalter (Ritter, Kaperfahrer) und Brann, Brakka bleiben, wie sie sind. ✅ unverändert, kein Eingriff nötig.
5. **Silhouette und Budget:** unverändert gegenüber dem bisher ausgelieferten Modell; kein neues Modell, also kein neuer Budget- oder Silhouettentest (das Modell läuft wie bisher durch `tools/figure-budget.mjs` im Build). ✅
6. **Nachweis:** Vergleichsbild der Sichtprüfung; Decision-Log der Art Direction, `figuren-bestand.md` und `art/README.md` nachgezogen. ✅

## Tasks / Subtasks

- [x] T1 Tripo-Guthaben ablesen (AC 1): 65 Credits
- [x] T2 Figurenblätter Rowena und Brakka berichtigen (AC 2)
- [x] T3 Brett-Turnaround per ChatGPT (2 Iterationen), geteilt; bleibt Referenz, nicht abgenommen (AC 3)
- [x] ~~T4 Tripo-Lauf~~ entfällt (PO 2026-11-11)
- [x] ~~T5 `pnpm art:tripo rowena`~~ entfällt
- [x] T6 Sichtprüfung: altes Modell headless gerendert (vorn/rechts/hinten, Brett „Mittel“) neben Porträt und Turnaround (AC 6)
- [x] T7 Doku: Prompt-Datei, Decision-Log, `figuren-bestand.md`, `art/README.md` (AC 6)
- [x] T8 `pnpm check`, PR gegen `main` (nicht selbst mergen), Status review

## Dev Notes

- **Ablauf wie 15.14** (`15-14-brettfigur-dorfaeltester.md`): Turnaround (ChatGPT über Claude in Chrome, Porträt + ein vorhandenes Brett-Sheet nur als Format- und Stilvorlage) → Tripo Smart-Mesh P2.0 Multi-View (Front/Right/Back), Quad, 3 000 Polygone, 4 Varianten (100) + Textur (20) + Auto-Rig Humanoid/Mixamo (20) → Export GLB mit Skelett → `pnpm art:tripo rowena` (`tools/art/tripo_units.py` → `prepare_tripo_unit.py` → `bake_vat.py` → gltfpack → `tools/figure-budget.mjs`). Animationen kommen aus `ANIM_LIBRARY`.
- **Ersetzt, nicht neu:** Turnaround (`art/turnarounds/rowena_board/`), Tripo-Quelle und Einheitsmodell existieren aus dem Oktober (Helm auf dem Kopf, Pegasus-Ritterin). Die alte Fassung bleibt in der Git-Historie. Keine Inhalts-ID ändert sich, `content:lock` und `released` bleiben unberührt (Akt 2 unveröffentlicht).
- **Helm unterm Arm:** Ein Helm, der zwischen Arm und Rumpf klemmt, verschmilzt im Mesh und bekommt beim Auto-Rig gemischte Gewichte (Schmieren beim Gehen). Den Helm deshalb fest an den linken Unterarm/die Hand legen und in der A-Pose etwas vom Rumpf abheben; eine Alternative (Helm am Gürtel links) mit vorlegen.
- **Teamtuch:** Magenta `#FF00FF` als Schlüssel; Umhang und Tabard wie im Oktober, Zopf und Helm in Eigenfarbe.
- **Credits:** Bei Story-Beginn (2026-11-11) zeigt Tripo **65 Credits**; Story 15.14 hat 205 → 65 verbraucht, F2 rechnete mit dem älteren Stand. Ergebnis: kein Lauf, altes Modell abgenommen (PO 2026-11-11).
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
