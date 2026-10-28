# Story 8.7: Titelbild, Logo und Dialog-Hintergründe von Akt 1

Status: done

## Story

Als Spieler
möchte ich beim Start und in Szenen Bilder im Stil der Welt sehen,
damit der erste Eindruck stimmt.

## Acceptance Criteria

1. **Titelbild:** Kael (von vorn) und Rhen (von hinten gesehen, Kapuze auf; Entscheidung Produktinhaber 2026-10-24: passt zu beiden Avatar-Looks) sitzen an einem Lagerfeuer, dahinter die Paktwacht, am Himmel die Drachensilhouette, oben eine Zone für das Logo, Hochformat. Der Titelbildschirm (`src/app/screens/Menus.tsx`, bisher `locations/lager_unterwegs.webp`) zeigt es.
2. **Logo:** „HOLLOW CROWN“ in einer freundlicheren, weicheren Serifenschrift (Kandidaten SIL OFL: Fraunces, Alegreya SC); das O von HOLLOW ist die gesprungene hohle Goldkrone mit Glutschein aus dem App-Icon (`art/icon/icon.png`). Entscheidung Produktinhaber 2026-10-24: das Kronen-O wird **von Hand als SVG gebaut** (Vektor, keine KI-Rastergrafik; Licensing A8), nach dem App-Icon. Es ersetzt den Textlogo-Behelf (`TitleLogo`, `ui.title.logo`, ♛ als O, `src/ui/title.css`).
3. **Schriftwahl:** Beide Kandidaten werden dem Produktinhaber als Screenshots gezeigt; die Wahl steht im Entscheidungslog (`concept/23-art-direction/decision-log.md`). Schriften sind selbst gehostet (npm-Paket `@fontsource/...` bzw. lokale Dateien, kein CDN) und die OFL-1.1-Texte stehen unter „Drittquellen“ in den Credits (Licensing A12), sofern dort noch nicht vorhanden.
4. **Dialog-Hintergründe von Akt 1:** Die Kandidaten aus `art/mockups/locations-s1/` (`varnhold`, `erlbach`, `hungerlager`, `paktwacht_ruine`, `paktwacht_heimat`, `paktnacht_glutdom`, `lager_unterwegs`) sind final; **neu** nach der Course Correction: **Gewölbe der Paktwacht** (Mission 1-7). Format 16:9, Hochformat-Sicherheitszone in der Mitte (mittleres Drittel), unteres Drittel ruhig (Dialogfenster), Jahreszeit Spätsommer. Im Spiel leicht weichgezeichnet und entsättigt (bereits in `src/ui/Dialogue.css`).
5. **Zuordnung der Orte:** Die Szenen verweisen bisher auf die PoC-Hintergründe `bg_varnhold_burning`, `bg_silverbrook_shrine`, `bg_camp_night`, `bg_caravan_road` (`art/backgrounds/`). **Entschieden 2026-10-24/25 (Produktinhaber, „nach Missionsinhalt“):** Kap. 1 (Hask, Miras Dorf; `bg_varnhold_burning`) = `erlbach`, Kap. 2 (Liora, Morra, Varek; `bg_silverbrook_shrine`) = `varnhold`, Support-Gespräche (`bg_camp_night`) und Prolog (`bg_caravan_road`) = `lager_unterwegs`. `paktwacht_heimat` ist Akt 2 und wird nicht gebaut.
6. **Pakete:** Die Bilder liegen im Paket `act1` (`content/packs.yaml`), ausgenommen, was der Titel beim Start braucht: Das Titelbild gehört zu `core` und zählt gegen das Budget von 15 MB (nach Story 8.5 bei 14,85 MB, Rest also knapp; Titelbild entsprechend klein halten, Format WebP/AVIF wie die übrigen Hintergründe).
7. **Herkunft:** Prompt-Protokolle `art/prompts/title_art.md` und `art/prompts/backgrounds_act1.md` (bzw. je Bild) mit Dienst, Modell, Tarif und Konto zum Erzeugungsdatum (A1, A2), Prompt, Referenzen, Iterationen, Ablageort des Originals (A3), menschlichem Anteil; für das SVG-Logo der Verweis auf die Handarbeit (Commit) und die Vorlage `art/icon/icon.png`. Prompts ohne Namen geschützter Werke, Marken oder Künstler (A7; die Moodboard-Hinweise auf „Ghibli“ nicht übernehmen).
8. **Screenshot:** Am Ende ein Screenshot des Titelbildschirms im Hochformat (375 × 812).
9. **Prüfungen grün:** `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm art:build`, `pnpm build` (Bundle-Budget `core`). Ein Commit für die Story. Nicht Teil der Story: Audio und die Effekte aus Story 8.6.

## Tasks / Subtasks

- [x] T1 Logo mit Kronen-O (AC 2, 3, 7)
  - [x] Kronen-O als SVG nach `art/icon/icon.png` von Hand bauen (hohle, gesprungene Goldkrone, Glutschein); als Komponente bzw. Datei einbinden, Farben als Tokens (Gold `#D9A931`, Glutorange `#E8743B`, siehe Art Direction §5.6/§9)
  - [x] Wortbild „HOLLOW CROWN“ in beiden Kandidaten (Fraunces, Alegreya SC) setzen und als Screenshots dem Produktinhaber zeigen; Wahl im Entscheidungslog festhalten
  - [x] Gewählte Schrift selbst hosten (Fraunces ist bereits über `@fontsource/fraunces` in `src/ui/tokens.css` geladen; Alegreya SC wäre neu), OFL-Text in den Credits ergänzen, falls nicht vorhanden (A12)
  - [x] `TitleLogo`, `ui.title.logo` und das ♛-Behelfs-O ersetzen; Text über Schlüssel in `content/core/locales/{de,en}.yaml`, nicht im Code; `src/ui/title.css` anpassen
- [x] T2 Titelbild (AC 1, 6, 7)
  - [x] Bild per ChatGPT über Claude in Chrome: Kael von vorn, Rhen von hinten mit Kapuze, Lagerfeuer, dahinter die Paktwacht, Drachensilhouette am Himmel, Logo-Zone frei, Hochformat; Referenzen: `art/mockups/characters-s1/kael.png`, `rhen_a.png`, `art/mockups/locations-s1/lager_unterwegs.png`, `paktwacht_ruine.png`
  - [x] Nach `public/assets` wandeln (`pnpm art:build`), Pfad in `content/packs.yaml` `core.assets` statt `locations/lager_unterwegs.webp` (dieses bleibt, falls die Kampagnen-Liste es weiter braucht, sonst in `act1`)
  - [x] Titelbildschirm in `src/app/screens/Menus.tsx` auf das neue Bild und das SVG-Logo umstellen; Logo-Zone oben freihalten
- [x] T3 Dialog-Hintergründe (AC 4, 5, 6, 7)
  - [x] Moodboard-Bilder auf Eignung prüfen: 16:9, Sicherheitszone, ruhiges unteres Drittel, Spätsommer; ungeeignete neu erzeugen
  - [x] Neu: Gewölbe der Paktwacht (Mission 1-7)
  - [x] Hintergrundbilder nach `public/assets/locations/` (Paket `act1`) bauen; bestehende Ids in den Szenen (`content/acts/act1/scenes/`, `campaign.yaml`) nur dort umstellen, wo die Zuordnung eindeutig ist
  - [x] Offene Zuordnung (AC 5) dem Produktinhaber vorlegen
- [x] T4 Screenshot und Prüfungen (AC 8, 9)
  - [x] Screenshot des Titelbildschirms im Hochformat; zusätzlich ein Dialog mit neuem Hintergrund zur Kontrolle von Weichzeichnung und Sicherheitszone
  - [x] `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm art:build`, `pnpm build`

## Dev Notes

- **Titelbildschirm heute:** `src/app/screens/Menus.tsx` nutzt `locations/lager_unterwegs.webp` und ein Textlogo (`TitleLogo`, `ui.title.logo`, ♛ als O, Styles in `src/ui/title.css`). Das Bild gehört laut `content/packs.yaml` zum Paket `core` (Hintergrund von Titel und Kampagnen-Liste; sonst stünde der erste Start grau da); alles andere unter `locations/**` liegt in `act1`.
- **Budget:** `core` hat 15 MB und ist nach Story 8.5 mit 14,85 MB fast voll; ein größeres Titelbild kann den Build brechen. Vorher Größe messen (`pnpm build` meldet das Budget) und ggf. Komprimierung bzw. eine Auflösung wie bei den anderen Hintergründen wählen.
- **Hintergründe im Spiel:** In `src/ui/Dialogue.css` sind Weichzeichnung und Entsättigung schon gesetzt. Die Bilder müssen deshalb nicht vorbearbeitet sein. Orte, die in mehreren Akten vorkommen (Glutdom, Paktwacht), bekommen eine Variante je Zustand (Art Direction §5.2); in Akt 1 genügt jeweils die Variante dieses Akts (`paktwacht_ruine`, `paktwacht_heimat`, `paktnacht_glutdom`).
- **Moodboard:** `art/mockups/locations-s1/` hält neben den Akt-1-Kandidaten auch Orte späterer Akte (`aurenhall_winter`, `brandhang`, `grauwacht`, `kronfeld`, `salzpass`, `urtempel_drachenhort`, `weltkarte_valmora`); die gehören nicht zu dieser Story.
- **Szenen heute:** `content/acts/act1/campaign.yaml` und `scenes/scn.ch01.*`/`scn.ch02.*` verweisen auf `bg_varnhold_burning`, `bg_silverbrook_shrine`, `bg_camp_night`, `bg_caravan_road`; die Zuordnung auf die neuen Orte ist offen (AC 5). Die PoC-Hintergründe in `art/backgrounds/` bleiben, bis die Zuordnung steht.
- **Logo:** Logo vom Menschen neu zeichnen (Vektor), nicht als KI-Rohausgabe nutzen (Licensing A8). Das Kronen-O entsteht nach dem App-Icon `art/icon/icon.png` (Prompt `art/prompts/app_icon.md`); Namensrecherche (O4) und Markenanmeldung sind nicht Teil der Story.
- **Schriften:** UI-Schriften sind laut Art Direction §9 Grenze Gotisch, Barlow, Barlow Condensed; `@fontsource/fraunces` ist bereits eingebunden. Nur die Logo-Schrift wird hier gewählt, die UI-Schriften bleiben.
- **Bilder** per ChatGPT über Claude in Chrome; Rot und Blau bleiben Teamfarben, das Titelbild enthält keine Teamfarben-Aussage. Glow nur für Feuer, Magie und Drachenglut (Art Direction §8).
- **Konventionen (AGENTS.md):** Sichtbarer Text nur über Schlüssel in `content/core/locales/{de,en}.yaml`; Styles je Screen in eigener CSS-Datei neben der Komponente; keine neuen Einträge in `src/ui/styles.css`. Neue Entscheidungen ins Entscheidungslog der Art Direction, nicht in `01-decisions.md`.
- **Offen (an den Produktinhaber):** Zuordnung der PoC-Orte zu den neuen Hintergründen (AC 5); Wahl der Logo-Schrift nach Screenshots (AC 3).
- **Erhalten:** Bestehende Hintergrund-Ids und Szenen bis zur geklärten Zuordnung, Weichzeichnung und Entsättigung im Dialog, Bundle-Budget.

### References

- [Source: concept/26-epics/epics.md#Story 8.7: Titelbild, Logo und Dialog-Hintergründe von Akt 1]
- [Source: concept/23-art-direction/art-direction.md §5.2, §5.5, §11]
- [Source: concept/23-art-direction/decision-log.md – Zeile 2026-10-23 Course Correction 8/8/8 (Gewölbe der Paktwacht, rund 26 Hintergründe)]
- [Source: concept/23-art-direction/licensing.md §6 (A1–A3, A7, A8, A12)]
- [Source: art/mockups/locations-s1/README.md, art/icon/icon.png, art/prompts/app_icon.md]
- [Source: content/packs.yaml (`core.assets`, `act1.assets`)]
- [Source: src/app/screens/Menus.tsx, src/ui/title.css, src/ui/tokens.css, src/ui/Dialogue.css]
- [Source: _bmad-output/implementation-artifacts/8-5-item-bilder.md – Bundle-Budget 14,85 von 15,00 MB]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm art:build`, `lint`, `test` (442), `content:check`, `build` grün; Budget: core 11,09 von 15 MB, act1 20,75 von 40 MB.
- Screenshots (Playwright, 375 × 812 und 375 × 667, Fraunces, Dialog, breites Fenster) im Scratchpad der Sitzung.

### Completion Notes List

- **Logo:** Kronen-O als von Hand geschriebenes SVG (`src/ui/Logo.tsx`, `logo.css`) nach `art/icon/icon.png`: Rückwand mit Glut, goldener Körper mit fünf runden Spitzen, Riss mit Glutkern; Farben als Tokens. Schrift **Fraunces** (Produktinhaber 2026-10-25 nach Screenshot-Vergleich mit Alegreya SC; `@fontsource/alegreya-sc` wieder entfernt). Entscheidungslog und Art Direction §5.5/§13 nachgetragen.
- **Titelbild:** `art/title/title_act1.png` → `public/assets/title/title_act1.webp` (Paket core, 146 KB). Das Bild sitzt zwischen Logo und Menü, auf die Breite angepasst; darüber Himmelsfarbe, darunter Grasfarbe (aus den Randzeilen des Bildes), weiche Ränder. Breite Fenster: Bild mittig mit Seitenverlauf.
- **Hintergründe:** sieben Orte aus `art/mockups/locations-s1/` bauen nach `public/assets/locations/<id>.webp` (`lager_unterwegs` in core, Rest in act1). Szenen, `campaign.yaml`, Dialogue und Sieg-/Niederlage-Hintergrund zeigen Orte; die Validierung prüft Szenen-`background` gegen die Moodboard-Dateien. PoC-Hintergründe `art/backgrounds/` gelöscht, Prompt-Dateien `bg_*.md` als abgelöst markiert, Unterstützung für das Präfix `backgrounds/` in `plan.ts` entfernt.
- **Prompt-Protokolle** (vom Produktinhaber): `art/prompts/title_art.md`, `art/prompts/backgrounds_act1.md`.
- **Credits:** Seit 2026-10-27 (Entscheidung des Produktinhabers) gibt es in den Optionen die Seite „Lizenzen“ (`src/app/screens/Licenses.tsx`): OFL-1.1-Hinweis und Volltext zu Fraunces, Barlow und Barlow Condensed (aus den `@fontsource`-Paketen, statisch unter `public/licenses/`, im Precache), Bibliotheken mit Lizenz, KI-Kennzeichnung (Licensing A12 erledigt). AC 3 damit erfüllt.
- Nicht Teil: Audio, Effekte (8.6). Kein Commit.

### File List

- `src/ui/Logo.tsx`, `src/ui/logo.css` (neu), `src/ui/title.css`, `src/app/screens/Menus.tsx`, `src/app/screens/Result.tsx`, `src/ui/Dialogue.tsx`
- `src/content/validate.ts`, `tools/content-check.ts`, `src/render/shared/assets.ts`, `src/core/defs.ts`, `src/app/loading/plan.ts`, `src/app/loading/plan.test.ts`
- `tests/unit/core.test.ts`, `tests/unit/precache.test.ts`
- `tools/art/build.py`, `content/packs.yaml`
- `content/acts/act1/campaign.yaml`, `content/acts/act1/scenes/*.yaml` (Hintergrund-Ids)
- `art/title/title_act1.png`, `art/prompts/title_art.md`, `art/prompts/backgrounds_act1.md`, `art/prompts/bg_*.md`, `art/README.md`, `art/backgrounds/` (gelöscht)
- `concept/23-art-direction/decision-log.md`, `concept/23-art-direction/art-direction.md`, `concept/11-content-format.md`

## Abnahme 2026-10-27

Abgenommen (Status done). AC 3: Seite „Lizenzen“ in den Optionen mit OFL-Hinweis (Entscheidung 2026-10-27, PR #71). Gesamtbefund: `acceptance-2026-10-27.md`.
