# Story 8.3: Brettfiguren für Akt 1

Status: ready-for-dev

## Story

Als Spieler
möchte ich jede Story-Figur und jeden Gegnertyp von Akt 1 auf dem Brett wiedererkennen,
damit Porträt und Figur zusammengehören.

## Acceptance Criteria

1. **Vorhandene Figuren:** Für die Story-Figuren und Leutnants von Akt 1 liegt je ein Tripo-Modell in `art/models/source/<id>_board_tripo.glb` (Turnaround in `art/turnarounds/<id>_board/`): Rhen in 2 Varianten (`avatar_a`, `avatar_b`), Kael, Brenna, Tobin, Fenn, Mira, Liora, Ysolde, Varek, Grosk, Hask, Morra, Ulvric; als generische Gegner `brigand` und `bandit_archer` (Bandit) sowie `soldier` (Soldatin der regulären Armee, Speer). Sie bleiben unverändert, werden aber im Silhouettentest (AC 4) mitgeprüft.
2. **Drei neue Figuren über Tripo** (Entscheidung Produktinhaber 2026-10-24: nur diese drei, 420 von 1 165 Credits): **Wolfsreiter** (in Akt 1 zu Fuß mit Wolfsfell), **Söldner** (ersetzt die heutige Blender-Figur `mercenary`, gleiche id) und **Tempelwache** (der Paktwacht). Je Figur: generisches Porträt zuerst (`art/mockups/characters-s1/class_<id>.png`, gehört zu den generischen Porträts aus Story 8.4), dann Brett-Turnaround (Vorlage `art/prompts/brenna_board_turnaround.md`: Kaels Brett-Turnaround als Stil, das Porträt als Figur, Teamtuch flach Magenta `#FF00FF`, keine Waffe), Zerlegen mit `tools/art/split_turnaround.py`, Tripo Smart-Mesh (Multi-View, 3 000 Quads, privat), Textur, Auto-Rig, Export nach `art/models/source/<id>_board_tripo.glb`, dann `pnpm art:tripo`. Generische Gegner dürfen weiblich sein; der Produktinhaber wünscht einige Frauen unter den neuen generischen Figuren.
3. **Einbindung:** `mercenary` behält seine id, bestehende Karten übernehmen die neue Figur ohne Änderung. Wolfsreiter und Tempelwache haben in `content/` noch keine Klasse und keine Karte (Akt-1-Missionen kommen mit Epic 9, Wolfsreiter-Regeln mit Story 2.9): Die Modelle werden geliefert, ihre ids werden im Abschlussvermerk dieser Story für diese Stories festgehalten. Bogenschützin, Magier und Kämpfer behalten ihre Blender-Figuren; der Kleriker hat kein Modell (bekannte Lücke, nicht Teil dieser Story).
4. **Silhouettentest:** Jede Rolle und jeder Gegnertyp ist schwarz gefüllt in Zoom „Mittel“ (`content/core/render.yaml` `camera.zoomSteps`, mittlerer Wert, heute 10 Spalten) unterscheidbar. Ein Skript erzeugt ein Silhouettenblatt (alle Akt-1-Figuren und -Gegner nebeneinander, schwarz gefüllt, in der Größe von Zoom „Mittel“); die Durchsicht steht in `art/prompts/silhouettes_act1.md`.
5. **Signaturteile:** Jede Story-Figur trägt ihr Signaturteil aus Art Direction §4.3 (z. B. Kael Schulterstück links und Zopf, Brenna Zopf und Doppelaxt, Tobin zu großer Helm, Fenn Kapuze mit Pflaster, Ysolde Bob und Brille, Grosk Bart und Schild). Die Prüfung je Figur und Abweichungen stehen in `art/prompts/silhouettes_act1.md` (z. B. kommen die Schilde von Torvald und Grosk als Ausrüstung und nicht im Modell).
6. **Prompts und Abnahmen:** Je neue Figur `art/prompts/<id>_board_turnaround.md` mit allen Angaben aus Licensing §6 A2 (Dienst, Tarif und Konto zum Erzeugungsdatum, Prompt, Referenzen, Iterationen, Ablageort des Originals, menschlicher Anteil); Tripo mit Pro und Datenschutz „Privat“ (A1).
7. **Budget:** Jede neue Figur ≤ 7 000 Dreiecke, 512er-Textur, ≤ 0,5 MB Transfer (Warnungen aus Story 8.2); Credits 140 je Figur, Stand danach im Entscheidungslog.
8. **Screenshot:** Am Ende ein Screenshot der Figuren auf dem Brett im Hochformat (375 × 812).
9. **Prüfungen grün:** `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm art:build`, `pnpm build`. Ein Commit für die Story. Nicht Teil der Story: Audio und die Effekte aus Story 8.6.

## Tasks / Subtasks

- [ ] T1 Bestand prüfen (AC 1)
  - [ ] Je Figur aus AC 1 prüfen, dass `art/models/source/<id>_board_tripo.glb` und `art/models/units/<id>.glb` vorhanden sind und im Spiel ankommen (`pnpm art:tripo`, `pnpm art:build`)
  - [ ] Zuordnung Figur → Modell-id in den Unit- und Klassendaten gegen die Liste prüfen (Rhen: das gewählte Porträt wählt `avatar_a`/`avatar_b`)
- [ ] T2 Wolfsreiter, Söldner, Tempelwache (AC 2, 6, 7)
  - [ ] Generische Porträts `class_wolf_rider.png`, `class_mercenary.png` (neu passend zur Tripo-Figur), `class_temple_guard.png`; einige davon weiblich (Prompt-Protokoll gemeinsam mit Story 8.4)
  - [ ] Brett-Turnaround nach `art/prompts/brenna_board_turnaround.md`: Teamtuch Magenta, keine Waffe; Wolfsreiter in Akt 1 zu Fuß mit Wolfsfell (Art Direction §4.2)
  - [ ] Zerlegen mit `tools/art/split_turnaround.py`; Tripo: Smart-Mesh (Multi-View, 3 000 Quads, privat), Textur, Auto-Rig, Export `art/models/source/<id>_board_tripo.glb`; Exportnamen eindeutig (`hcx_<id>`), weil Tripo gleiche Standardnamen vergibt
  - [ ] `pnpm art:tripo <id>`, Budget prüfen, im Spiel ansehen
  - [ ] `art/prompts/<id>_board_turnaround.md` je Figur
- [ ] T3 Einbindung (AC 3)
  - [ ] `mercenary` ersetzt die Blender-Figur (`tools/art/export_models.py` überspringt Tripo-ids; prüfen, dass die Blender-Fassung nicht mehr gebaut wird)
  - [ ] ids der neuen Modelle (Wolfsreiter, Tempelwache) für Story 2.9 und die Missionen aus Epic 9 im Abschlussvermerk festhalten; keine neuen Klassen oder Karten anlegen
- [ ] T4 Silhouettentest und Signaturteile (AC 4, 5)
  - [ ] Skript unter `tools/art/` rendert alle Akt-1-Figuren und -Gegner schwarz gefüllt in der Größe von Zoom „Mittel“ zu einem Blatt
  - [ ] Durchsicht und Signaturteil-Prüfung je Figur nach Art Direction §4.3 in `art/prompts/silhouettes_act1.md`, Abweichungen benennen
  - [ ] Nicht unterscheidbare Paare im Dokument vermerken und mit dem Produktinhaber abstimmen, nicht still umbauen
- [ ] T5 Screenshot und Prüfungen (AC 8, 9)
  - [ ] Screenshot der Figuren auf dem Brett im Hochformat
  - [ ] `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm art:build`, `pnpm build`; Eintrag im Entscheidungslog (Credits, Stand)

## Dev Notes

- **Bestand:** In `art/models/source/` liegen u. a. `avatar_a`, `avatar_b`, `kael`, `brenna`, `tobin`, `fenn`, `mira`, `liora`, `ysolde`, `varek`, `grosk`, `hask`, `morra`, `ulvric`, `brigand`, `bandit_archer`, `soldier`. Die unveränderten Porträts dazu liegen in `art/mockups/characters-s1/<id>.png`.
- **Credits:** 140 je Figur (Smart-Mesh 100, Textur 20, Auto-Rig 20), drei Figuren = 420 von 1 165; den Rest nicht anfassen. Animationen sind kostenlos über die Bibliothek (Story 8.2).
- **Bilder** per ChatGPT über Claude in Chrome, Tarif dokumentieren (A1); das Bildlimit (Plus) war am 2026-10-23 einmal erreicht, drei Tripo-Tabs parallel sind erprobt. Referenz je Brett-Turnaround: Kaels Brett-Turnaround (Stil) und das Porträt (Figur) in einem Prompt (Entscheidungslog 2026-10-23).
- **Reihenfolge:** Das generische Porträt entsteht vor dem Brett-Turnaround und wird in Story 8.4 nicht doppelt erzeugt. Wer zuerst dran ist, legt die Prompt-Aufzeichnung an; die andere Story verweist darauf.
- **Wolfsreiter:** Reittiere und Vierbeiner kommen erst nach dem MVP (Entscheidungslog 2026-10-24); hier nur der Fußkämpfer mit Wolfsfell.
- **Silhouettentest:** `camera.zoomSteps: [7, 10, 15]`, Mittelwert 10. Eine Figur ist dort nur wenige Dutzend Gerätepixel hoch; große Formen zählen (Art Direction §4.1, §12).
- **Teamtuch:** Magenta wird im Build zu neutralem Hellgrau mit Team-Schlüssel; Teamfarben bleiben ungelit. Welche Teile Teamtuch sind, im Prompt je Figur festlegen (Beispiele im Entscheidungslog 2026-10-24).
- **Frauen unter den Generischen:** Wunsch des Produktinhabers; die Verteilung auf Wolfsreiter, Söldner, Tempelwache steht nicht fest und wird im Prompt-Protokoll begründet.
- **Konventionen (AGENTS.md):** Sichtbarer Text nur über Schlüssel in `content/core/locales/{de,en}.yaml`, Bezeichner Englisch. Neue Entscheidungen ins Entscheidungslog der Art Direction.
- **Abhängigkeiten:** Budget-Meldung und Paketausgabe aus Story 8.2. Modelle gehören laut `content/packs.yaml` zum Paket `act1`; `core` (Budget 15 MB) nicht belasten.
- **Erhalten:** Bestehende Figuren, Blender-Figuren von Bogenschützin, Magier und Kämpfer, Teamtuch-Logik, alte Spielstände mit `mercenary`.

### References

- [Source: concept/26-epics/epics.md#Story 8.3: Brettfiguren für Akt 1]
- [Source: concept/23-art-direction/art-direction.md §4.1–§4.3, §4.6, §11]
- [Source: concept/23-art-direction/decision-log.md – Zeilen 2026-10-23 (Turnaround, Credits, Avatar, Restguthaben) und 2026-10-24 (Wolfsreiter zu Fuß, Sonderfiguren abgeschlossen)]
- [Source: concept/23-art-direction/licensing.md §6 (A1–A5, A7)]
- [Source: art/prompts/brenna_board_turnaround.md, art/prompts/kael_board_turnaround.md]
- [Source: art/mockups/characters-s1/README.md]
- [Source: tools/art/split_turnaround.py, tools/art/tripo_units.py, tools/art/prepare_tripo_unit.py]
- [Source: content/core/render.yaml (`camera.zoomSteps`)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
