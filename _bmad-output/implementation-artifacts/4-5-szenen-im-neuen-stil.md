# Story 4.5: Szenen im neuen Stil

Status: done

## Story

Als Spieler
möchte ich Gespräche mit großen Figuren erleben, die zeigen, wer spricht,
damit mir die Truppe ans Herz wächst.

## Acceptance Criteria

1. **Szene:** Der Sprecher steht als Halbfigur hell im Vordergrund, Zuhörer gedämpft, das Namensschild als Glut-Pille an seiner Seite, der Hintergrund weichgezeichnet und leicht entsättigt (Mockup 05). Oben rechts Log, Auto und Überspringen; bereits gesehene Szenen lassen sich ganz überspringen; ein Tipp führt weiter.
2. **Gesehen:** Gesehene Szenen stehen im Kampagnenzustand (Command, serialisierbar, im Journal).
3. **Sprechblase im Kampf:** Spricht ein Trigger oder Leutnant, erscheint die Blase am Kopf der Figur, höchstens 2 Zeilen, und blockiert bis zum Tipp bzw. 2,5 s im Auto-Modus (Zeiten in `balance.yaml`).
4. **Stimmungen:** Stimmungen der Szenendaten laufen auf vorhandene Halbfigur-Varianten; fehlt eine, gilt neutral.
5. **Umbau:** Dialog-Screen mit eigener CSS-Datei neben der Komponente, alter Abschnitt aus `styles.css` gelöscht, aller Text über Schlüssel (de/en).

## Tasks / Subtasks

- [x] T1 Kern (AC 2): `CampaignState.scenesSeen`, Command `markSceneSeen` (idempotent, Szene muss existieren), Event `sceneSeen`, Default beim Laden (`normalizeCampaign`), `bubblePages`, `sceneSeen`
- [x] T2 Werte (AC 3): `balance.scene` (`autoBaseMs`, `autoPerCharMs`, `typeCharsPerTick`, `typeTickMs`, `bubbleAutoMs` 2500, `bubbleMaxChars` 64) mit Schema und Typ
- [x] T3 Bilder (AC 4): `pnpm art:build` baut `halves/<id>.webp` (640 px) aus `art/mockups/characters-s1`, Stimmungs-Varianten als `<id>_<stimmung>.png`; Manifest `halves`; bei Bedarf geladen (nicht vorab im Cache)
- [x] T4 Szene (AC 1, 5): `Dialogue.tsx` neu, `Dialogue.css`, `SceneTools.tsx` (Log/Auto/Überspringen), `halfFigure.ts`; alter Abschnitt in `styles.css` entfernt; Schlüssel `ui.dialogue.*`
- [x] T5 Sprechblase (AC 3): `SpeechBubbles.tsx`, `BoardView.headScreen`, Entscheidung in `Battle.tsx` (Blase nur bei Szenen ohne Antworten, deren Sprecher alle auf dem Brett stehen; sonst Szene als Overlay)
- [x] T6 Verdrahtung: `app/screens/Scene.tsx` (Kontext, Effekte, Gesehen, Auto, Halbfiguren), `app/state/halves.ts`, `dialogueAuto` in den Einstellungen
- [x] T7 Tests: `tests/unit/scene-view.test.ts`

## Dev Notes

- **Schichten:** `src/ui` darf weder `app` noch `render` importieren (ESLint); die Komponenten bekommen Auto, Halbfiguren und Gesehen als Props, `app/screens/Scene.tsx` verdrahtet sie.
- **Gesehen:** Eine Szene zählt als gesehen, wenn sie zu Ende lief oder übersprungen wurde (`onSeen` vor `onDone`). `seen` wird beim Öffnen festgehalten, damit die Marke nicht mitten in der Szene umspringt. Im Kampf läuft `markSceneSeen` direkt als Kampagnen-Command (ein Vermerk, kein Story-Zustand); ein Neustart der Runde vergisst ihn nicht.
- **Überspringen (entschieden 2026-10-24):** Spult die Zeilen vor und hält an der ersten Antwortzeile (`skipTarget`, reine Funktion in `scene.ts`); nach der Wahl lässt sich erneut überspringen, bis zur nächsten Antwort. Szenen ohne weitere Antwort enden sofort. Gesehene Szenen folgen derselben Regel (die Wirkungen einer Antwort laufen immer). Der Rauchtest wählt eine Antwort, wenn Überspringen anhält. Gesehene Szenen zeigen ein Häkchen.
- **Sprechblase:** Seiten zu `bubbleMaxChars` Zeichen, geschnitten an Leerzeichen, CSS klemmt zusätzlich auf 2 Zeilen; jede Seite blockiert bis Tipp oder `bubbleAutoMs`. Alle Szenen-Zeilen des Inhalts passen in höchstens 2 Seiten (Test). Die Kamera fährt zum Sprecher, bevor die Blase erscheint. Am oberen Rand der Blase sitzt eine kleine Namens-Pille (Farben wie das Szenen-Namensschild über `speakerTeam`, entschieden 2026-10-24); der Text bleibt bei höchstens zwei Zeilen.
- **Halbfiguren:** Neue, größere Ausgabe `halves/` (640 px, ~2,2 MB für 46 Figuren, bei Bedarf geladen); die 150-px-`busts/` der Truppenansicht blieben unverändert. Avatar → `rhen_a|b`. Ohne Halbfigur: altes Porträt.

### Offene Fragen an den Produktinhaber

1. ~~Überspringen nur für gesehene Szenen?~~ Entschieden 2026-10-24: immer möglich, hält aber an der ersten Antwort.
2. ~~Name in der Sprechblase?~~ Entschieden 2026-10-24: kleine Namens-Pille am Blasenrand.
3. Bei Szenen mit mehreren Sprechern, Antworten oder Sprechern abseits des Bretts im Kampf: heute Szene als Overlay statt Blase. Passt das?
4. Fehlende Stimmungs-Halbfiguren (siehe unten) – die Stimme fällt bis dahin auf neutral zurück.

### Fehlende Bilder (`art/mockups/characters-s1/<id>_<stimmung>.png`)

brenna angry/happy/sad, grosk angry, hask happy, kael angry/happy/sad, liora sad, mira angry/happy, tobin angry/happy/sad, varek happy.

### Project Structure Notes

- Neu: `src/ui/{Dialogue.css,SceneTools.tsx,SpeechBubbles.tsx,halfFigure.ts}`, `src/app/screens/Scene.tsx`, `src/app/state/halves.ts`, `tests/unit/scene-view.test.ts`.
- Geändert: `Dialogue.tsx`, `styles.css` (Dialog-Abschnitt entfernt), Kern (`state`, `campaign/{apply,commands,campaign,scene}`, `defs`), `schemas.ts`, `balance.yaml`, Locales, `Battle.tsx`, `App.tsx`, `Rooms.tsx`, `board.ts`, `build.py`, `vite.config.ts`, `check-bundle-size.mjs`.

### References

- [Source: concept/26-epics/epics.md#Story 4.5]
- [Source: concept/25-ux/mockups/05-szenen.html]
- [Source: concept/24-architecture/architecture.md#5.8]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Completion Notes List

- `pnpm lint`, `pnpm test` (189 Tests), `pnpm content:check`, `pnpm build` grün. Keine Browser-Prüfung durchgeführt (zentral danach); Code-Review steht aus.
- Entscheidungslog: `concept/25-ux/.decision-log.md`.

### File List

Siehe Project Structure Notes.

## Abnahme 2026-10-27

Abgenommen (Status done). Optik und Ablauf im Durchlauf gesehen (Halbfiguren, Log/Auto/Überspringen, Sprechblasen am Kopf). Offene Frage 3 vom Produktinhaber am 2026-10-27 bestätigt: Mehrsprecher-, Antwort- und Off-Board-Szenen laufen im Kampf als Overlay. Gesamtbefund: `acceptance-2026-10-27.md`.
