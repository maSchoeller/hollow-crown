# Story 15.6: Szenen an Welt und Folge anpassen, Lucan statt Kael

Status: in-progress

## Story

Als Spieler
möchte ich vor und nach jeder Mission Szenen sehen, die zu Ort und Folge passen,
damit die überarbeitete Geschichte ankommt.

## Acceptance Criteria

1. **Angenommen** `concept/22-narrative/missionsliste-s1.md` (Abschnitt „Akt 1 ‚Asche‘“) und `concept/22-narrative/geografie-valmora.md` **wenn** die Szenen DE und EN nachgezogen sind **dann** hat jede Mission von Akt 1 (P, 1-1 … 1-8, N1–N3) eine Vor- und eine Nachszene passend zu Ort und Folge.
2. Die Szenen tragen die Inhalte der Überarbeitung: Flucht per Lastkahn durch die Aureklamm (P), Banden ziehen sich nach 1-2 und 1-4 in die Ruine zurück, Gräber-Zeile in 1-7 („Die Burg steht über den Gräbern, der Pass war nur der Vorwand“), Saaten Kharesh (1-1, N2), Stimme (1-4) und Pakt (1-7), Halvard als Mentor und Liora als seine Ziehtochter (1-3), Goldspur von Krähenholm durch die Erlenbucht (1-5), Lucans Herkunft (verstoßener Adliger, früherer Ritterhauptmann, seine Front im Grenzkrieg bei Kharesh).
3. Fehlende Ortsbilder liegen vor (nach `concept/23-art-direction/licensing.md` §6, Prompt und Abnahme in `art/prompts/`), und jede Szene nutzt einen Hintergrund, der zu Ort und Jahreszeit (Spätsommer) passt.
4. Die Prüfung auf Ersatzsprecher ist grün: jede Sprecherkette endet bei `avatar` oder `lucan`, sonst `fallback: skip` (`src/content/validate.ts`, `pnpm content:check`).
5. `lucan` heißt überall `lucan`: Texte DE und EN, IDs, Dateinamen, Porträts, Modelle, Dokumente und Tests, vor dem ersten `content:lock`. **(erledigt, Commit `13b7f26`)**
6. Sichtbare Änderungen als Bild bei 375 × 812 belegt; `pnpm check` grün.

## Tasks / Subtasks

### Teil B – Umbenennung Kael → Lucan (erledigt in `13b7f26`)

- [x] IDs `kael` → `lucan` in Content, Code und Tests (AC: 5)
- [x] Dateinamen umbenannt (Szenen `scn.bark.lucan`, `scn.support.*_lucan.*`, Porträts, Prompts `art/prompts/lucan.md`) (AC: 5)
- [x] Texte DE und EN, Dokumente (AC: 5)
- [x] Modelle: alter Kael-Brett-Turnaround heißt jetzt `lucan_anims_base` (`art/prompts/lucan_anims_base_turnaround.md`), Tools in `tools/art/*` angepasst (AC: 5)
- [x] Spielstand-Fixtures neu erzeugt, `tests/unit/migrations.test.ts` grün (AC: 5)

### Teil A – Szenen an Welt und Folge

- [ ] Bestandsaufnahme: je Mission Vor-/Nachszene gegen Missionsliste und Geografie abgleichen, Lücken als Liste in den Completion Notes (AC: 1, 2)
- [ ] **P** `scn.prologue.intro` / `outro`: Brenna führt durchs Südtor-Viertel zu den Kanälen, nachts per Lastkahn durch die Aureklamm, danach zu Fuß nach Süden über den Wachpass; die Ruine nur von fern. Gerrit fällt (erstes Grab), erstes Beben, Glutleuchten über dem Tempel (AC: 1, 2)
- [ ] **1-1** Varnhold: Morras Steckbriefe, neues Ziel „Wer hat uns angeheuert?“, Saat Kharesh als Marktgerücht; Lucan schweigt, seine Narben stammen von dort (`scn.m1_1.kharesh_rumor` prüfen) (AC: 2)
- [ ] **1-2** Erlbach (südlich der Hauptstraße, in Hasks Reichweite): Nachszene – Hasks Bande zieht sich in die Ruine am Grauen Kamm zurück (AC: 2)
- [ ] **1-3** Schrein am Weißdorn im Grenzwald (bisher „Silberbach“): Halvard tritt auf, kennt jeden Namen, wird Mentor; Liora als seine Ziehtochter aus dem Glutdom (AC: 2)
- [ ] **1-4** Wolfshügel: Dunns letzte Worte „Er hört auf die Krone, nicht auf Menschen.“ (Saat Stimme), Rhens Geständnis; Nachszene – Ulvrics Wolfsbande weicht in die Ruine aus (AC: 2)
- [ ] **1-5** Hungerlager im Erlenmoor an der Erlenbucht: Bandengold läuft von Krähenholm durch die Erlenbucht, die Hungernden sehen es und bekommen nichts; Hinweis auf den Deserteur am alten Wachturm (öffnet N2) bleibt (AC: 2)
- [ ] **1-6** Paktwacht (Felsnische an der Südwand des Grauen Kamms, überblickt den Pass, sperrt ihn nicht): Banden in der Ruine, Hask flieht durch die **Ostpforte** in sein Lager im Süden; E4 (Halvards Rat: glaubhaftes Versteck) (AC: 2)
- [ ] **1-7** Gewölbe: Gräber junger Könige, Chronik versiegelt, Beben aus dem Norden; **neue Zeile:** die Burg steht über den Gräbern, der Pass war nur der Vorwand (Saat Pakt) (AC: 2)
- [ ] **1-8** Morras Leute kommen die Passstraße hinauf und über den Hangweg durchs **Westtor**, Hask über den Süden; Morras Weg hängt an E4 (AC: 2)
- [ ] **N1** Varnhold bei Nacht, Fenns Vergangenheit – nur Orts- und Folgeabgleich (AC: 1)
- [ ] **N2** Wachturm an der Grenzmauer mit Blick nach Kharesh: Varek kennt Lucan und Dravn; Lucan erzählt vom Grenzkrieg (Saat Kharesh, Lucans Herkunft: verstoßener Adliger, früherer Ritterhauptmann, seine Front) (AC: 2)
- [ ] **N3** Tobins Pachthof (Felder, Mühle, Fluss) statt Erlbach-Hintergrund, Tobins Vater (AC: 1, 3)
- [ ] EN in `content/locales/en/act1.dialogue.yaml` für jede geänderte/neue Zeile (`dlg.<sceneId>.<lineId>`) nachziehen (AC: 1)
- [ ] Offene Erzählpunkte (z. B. Gerrits Rolle auf dem Kahn, wie genau die Banden in der Ruine sitzen, Lucans Verstoßung – von wem, warum) in `concept/22-narrative/decision-log.md` als **offen für den Produktinhaber** eintragen, nicht selbst entscheiden (AC: 2)
- [ ] Ortsbilder (AC: 3)
  - [ ] Bedarf festlegen; Kandidaten: `aureklamm_lastkahn` (P-Nachszene statt `lager_unterwegs`), `schrein_weissdorn` (1-3; `silberbach` prüfen), `pachthof` (N3), Paktwacht im Spätsommer für 1-6-Nach, 1-7-Nach und 1-8 (`paktwacht_heimat` zeigt Herbst und ausgebaute Burg, gehört laut `backgrounds_act1.md` nicht zu Akt 1)
  - [ ] Bilder per ChatGPT über Claude in Chrome, Stil an abgenommene Hintergründe angelehnt (Referenzbilder anhängen), 16:9 1672 × 941, Motiv im mittleren Drittel, unteres Drittel ruhig, keine Figuren/Text
  - [ ] Prompt, Werkzeug, Tarif, Iterationen, menschlicher Anteil (A2), A7-Prüfung und Abnahme je Bild in `art/prompts/backgrounds_act1.md` (oder eigener Datei) dokumentieren; Original nach `art/mockups/locations-s1/`, `pnpm art:build` (vorher `git lfs pull`)
- [ ] Ersatzsprecher-Prüfung und `pnpm content:check` grün (AC: 4)
- [ ] Screenshots 375 × 812 der neuen/umgebauten Szenen (Spiel stumm, Lautstärken auf 0), Belege dem Nutzer zeigen (AC: 6)
- [ ] `pnpm check` grün (AC: 6)
- [ ] Code-Review (`gds-code-review`), Befunde einarbeiten
- [ ] PR gegen `main`, nach grüner CI mergen

## Dev Notes

### Quellenrang

`missionsliste-s1.md` und `geografie-valmora.md` gelten vor `narrative.md` und den alten Missions-Stories 9.1–9.12 (Epic 15, „Grundlage“). Relevante Abschnitte: Missionsliste „Sitze und Herkunft“ und „Akt 1 ‚Asche‘“ (Z. 15–63); Geografie „Reise und Tore“ (Z. 23–37), „Folgen für die Missionsliste“ (Z. 79–89). `narrative.md` nur gezielt per `grep -n` für Figurenstimme (Lucan, Halvard, Brenna „Küken“) lesen.

### Stand der Szenen (festgestellt 2026-11-06)

- Szenen liegen als `content/acts/act1/scenes/scn.<knoten>.<name>.yaml`, Vor-/Nachszene über `pre`/`post` in `content/acts/act1/campaign.yaml`. Alle Knoten P, m1_1–m1_8, n1–n3 haben bereits `intro`/`outro`; die Arbeit ist **Anpassen**, nicht Neuanlage.
- Im Text fehlen heute: Lastkahn/Aureklamm, Erlenbucht/Krähenholm, „Vorwand“, Rückzug der Banden in die Ruine nach 1-2/1-4.
- Hintergründe heute: P-Nach `lager_unterwegs`, 1-3 `silberbach`, 1-4 `wolfslager`, 1-6-Nach/1-7-Nach/1-8 `paktwacht_heimat`, N3 `erlbach`. Vorhandene Bilder im Manifest: `erlbach, hungerlager, lager_unterwegs, paktnacht_glutdom, paktwacht_gewoelbe, paktwacht_heimat, paktwacht_ruine, silberbach, varnhold, varnhold_nacht, wachturm, wolfslager`.
- Karten-/Knoten-IDs (`m1_3_silberbach`, `place: silberbach`, `wolfslager`) gehören zu 15.2–15.5; hier nur Szenen und Hintergründe anfassen, um Merge-Konflikte klein zu halten.

### Szenenformat

- Zeile: `id`, optional `speaker: [kette]`, `fallback: skip`, `requires: [{ alive: x }]`, `mood`, `text` (DE). Sprecherkette muss bei `avatar`/`lucan` enden, sonst `fallback: skip` (`validate.ts` ~Z. 354, 413). Gefährten, die fehlen können, immer mit `requires`/`fallback: skip`.
- EN-Schlüssel `dlg.<sceneId>.<lineId>` in `content/locales/en/act1.dialogue.yaml`; neue Zeilen-IDs fortlaufend vergeben, bestehende IDs nicht umnummerieren (Saves/Replays referenzieren Szenen, nicht Zeilen, aber Diffs bleiben klein).
- Kopfkommentar je Szene (Zweck, Knoten, Bedingungen) wie im Bestand pflegen. Kein sichtbarer Text im Code.
- Hintergrund-Wechsel innerhalb einer Szene über Illustrations-Panel (`schemas.ts` ~Z. 551, Architektur §5.8).

### Abhängigkeiten

Laut Epic-Reihenfolge kommt 15.6 nach 15.2 (neue Folge, z. B. 1-2 ∥ 1-3, N3 nach 1-6) und 15.3–15.5 (Karten, gespiegelte Paktwacht, Ostpforte/Westtor). Szenentexte so schreiben, dass sie zur Folge der Missionsliste passen; wo die Karten noch alt sind, Text nach Missionsliste, nicht nach Altkarte.

### Ortsbilder

Vorgehen und Format wie „Gewölbe der Paktwacht“ in `art/prompts/backgrounds_act1.md` (abgenommene Hintergründe als Stilreferenz anhängen, Prompt ohne geschützte Namen, A7). Lizenzauflagen `concept/23-art-direction/licensing.md` §6. Spätsommer für Akt 1.

### Testing

- `pnpm content:check` (Sprecherketten, Locale-Vollständigkeit), `pnpm test` (u. a. `tests/unit/scene.test.ts`, `scene-view.test.ts`, `story.test.ts`), `pnpm build` (Bundle-Budget, neue Bilder!).
- Sichtprüfung im Browser 375 × 812, Screenshots `scale: 0.5`.

### Project Structure Notes

- Szenen: `content/acts/act1/scenes/`; EN: `content/locales/en/act1.dialogue.yaml`; Ortsbilder: `art/mockups/locations-s1/` → `public/assets/locations/<id>.webp` via `pnpm art:build`.
- Offene Punkte: `concept/22-narrative/decision-log.md` (Tabelle Datum | Entscheidung | Begründung), nie `concept/01-decisions.md`.

### Project Context Rules

- Nie auf `main` committen; PR, Merge nach grüner CI ohne Rückfrage.
- Offene Narrative-Punkte nicht stillschweigend entscheiden, als offen protokollieren.
- KI-Bilder nur nach `licensing.md` §6; Prompt und Abnahme in `art/prompts/`.
- Kein `content:lock` vor Story 9.14.
- Große Dateien (`narrative.md`, `validate.ts`, `schemas.ts`) nur ausschnittweise lesen.

### References

- [Source: concept/26-epics/epics/epic-15.md#Story 15.6]
- [Source: concept/22-narrative/missionsliste-s1.md#Akt 1 „Asche“]
- [Source: concept/22-narrative/geografie-valmora.md#Reise und Tore, #Folgen für die Missionsliste]
- [Source: art/prompts/backgrounds_act1.md]
- [Source: content/acts/act1/campaign.yaml]
- [Source: src/content/validate.ts (Sprecherkette)]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Debug Log References

### Completion Notes List

- Story-Kontext erstellt (gds-create-story) am 2026-11-06. Teil B (Umbenennung) ist mit Commit `13b7f26` erledigt; Teil A offen.

### File List
