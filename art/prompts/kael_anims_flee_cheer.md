# kael_anims_flee_cheer – KI-Animationen Flucht und Jubel (Tripo, Bibliothek für alle Brettfiguren)

> Nachgetragen bei der Abnahme 2026-10-27 (Story 8.2, AC3; Auflage `concept/23-art-direction/licensing.md` §6: je KI-Erzeugnis ein Protokoll). Quelle aller Angaben ist der Eintrag vom 2026-10-24 in `concept/23-art-direction/decision-log.md` („Animationen Flucht und Jubel in der Bibliothek“) und Story 8.2; Prompt-Wortlaut und Chat-Verlauf sind dort nicht festgehalten.

- **Datei:** `art/models/source/kael_anims_flee_cheer.glb` (unverändertes Original, Git LFS; der Name endet bewusst nicht auf `_board_tripo.glb`, die Datei ist keine Figur)
- **Datum:** 2026-10-24
- **Werkzeug:** Tripo, KI-Animation am Rig von Kael (`art/models/source/kael_board_tripo.glb`); zwei Animationen „Happy Victory Cheer“ und „Fearful Retreat Pose“, je 2 s, je 20 Credits, exportiert „an Ort und Stelle“
- **Tarif und Konto (A1):** Tripo **Pro** (Angabe des Produktinhabers, `licensing.md` §7a), Datenschutz wie bei den Brettfiguren; Credits danach **705**
- **Zweck:** Clips `flee` (Flucht der Leutnants bei 0 TP) und `cheer` (Jubel) für alle Brettfiguren; `pnpm art:tripo` überträgt sie über `tools/art/tripo_units.py` (`ANIM_LIBRARY`) und `prepare_tripo_unit.py --anims` (Aktionen mit „retreat“ bzw. „victory cheer“ im Namen → `flee`, `cheer`; 12 fps, nur Rotationen, Länge unverändert)
- **Verworfen:** die Tripo-Presets „Jubeln“ (Arme und Umhang verdecken das Gesicht) und „fliehen_02“ (starke Wurzelbewegung), an Kael erprobt
- **Menschlicher Anteil (A2):** Auswahl der Animationen und Abnahme durch den Produktinhaber; Übertragung und Benennung per Skript
- **Original (A3):** siehe Datei oben

## Abnahme

- Produktinhaber 2026-10-24 (Auswahl), laut Entscheidungslog.
