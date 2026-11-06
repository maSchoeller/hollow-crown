# Story 8.1: Tonbruch-Test mit einer Gedenkszene

Status: review

## Story

Als Produktinhaber
möchte ich früh prüfen, ob der Chibi-Stil einen Tod ernst genug trägt,
damit das größte Stilrisiko vor der Massenproduktion geklärt ist.

Quelle: `concept/26-epics/epics/epic-08.md` §8.1, Brief-Risiko „Tonbruch“ (`concept/20-game-brief/brief.md` §Risiken: „Prototyp-Test in Akt 1: eine Gedenkszene im neuen Stil früh bauen“). Laut `concept/27-ueberarbeitung/umsetzung-lueckenliste.md` Pflicht für das Release von Akt 1 (Story 9.14) und mit den Porträts v2.5 zu führen. Produktinhaber 2026-11-06: Test jetzt vorbereiten, 2–3 Tester, die Bewertung machen Menschen.

## Akzeptanzkriterien

1. **Angenommen** Fenns Porträt in 4 Stimmungen, ein Dialog-Hintergrund und die Abschieds-Karte (Story 6.7)
   **Wenn** die Gedenkszene im Spiel läuft
   **Dann** bewerten Produktinhaber und 2–3 Tester, ob der Stil den Tod verharmlost (Brief-Risiko „Tonbruch“)
   **Und** das Ergebnis steht in `concept/23-art-direction/decision-log.md`.
2. (Vorbereitung, Auftrag 2026-11-06) Die Szene ist ohne Vorwissen über einen Direktlink erreichbar, auch auf dem Handy und im veröffentlichten Build.
3. (Vorbereitung) Ein Testbogen `concept/23-art-direction/tonbruch-test.md` mit Ablauf, Link, Fragen mit Skala, Freitext, Auswertungstabelle und Kriterium für bestanden.

## Aufgaben

- [x] Testablauf „Tonbruch“ im Spiel: Gerrits Grab (`scn.prologue.outro`, Lastkahn, Trauer der ganzen Truppe), danach Fenns Abschiedskarte (Permadeath, letzte Zeile + Trauer Miras, `scn.farewell.fenn`) und die Gedenk-Variante von N1 (`scn.n1.memorial_intro`), am Ende zurück zum Titelbild.
- [x] Direktlink `?tonbruch` (Produktions-Build) und `__hc.toneTest()` (Dev); Wegwerf-Kampagne ohne Kampagnen-ID, damit nie ein Spielstand überschrieben wird.
- [x] Texte nur in `de.yaml`/`en.yaml`, kein sichtbarer Text im Code.
- [x] Testbogen `concept/23-art-direction/tonbruch-test.md`.
- [x] Screenshots 375 × 812 unter `_bmad-output/implementation-artifacts/8-1-belege/`.
- [x] Unit-Test für die Auswahl des Ablaufs, `pnpm check` grün.
- [ ] Ergebnis der Tester in `decision-log.md` (nach dem Test, durch den Produktinhaber) – danach `done`.

## Dev Notes

- **Porträts:** alle 51 Porträts sind v2.5 (`figuren-bestand.md`); `sad` gibt es für Lucan (Datei `kael_sad`), Brenna, Tobin, Fenn, Mira, Rhen a/b; Gerrit hat nur `neutral` (Nebenfigur, spricht nicht). Kein neues Porträt nötig.
- **Stimmungen:** art-direction §5.1 (gleiche Pose, nur Gesicht/Brauen/Schultern); Humor setzt in Trauerszenen nie ein (Kopf von `scn.prologue.outro`).
- **Wiederverwendung:** Dialog-Screen (`screen = { name: 'dialogue', id, next }`), Abschiedskarte `Farewell.tsx` + `farewellView` (Kern). Wegwerf-Kampagne wie `devNode` in `src/app/state/devHooks.ts` (Kompanie nach dem Prolog). Speichern: `autosave` tut nichts ohne `campaignId`.
- **Pakete:** Prolog-Szenen liegen in `core`; `scn.farewell.fenn` und `scn.n1.memorial_intro` in `act1` → vorher `ensurePack('act1')`.
- **Start:** erst nach `afterPrepare` (Erstinstallation), sonst überdeckt der Vorbereitungs-Screen die Szene.

## Dev Agent Record

### Completion Notes

- Keine neuen Texte nötig: alle drei Szenen und die Abschiedskarte haben DE und EN im Content; kein neues Porträt nötig (alle `sad`-Stimmungen v2.5 vorhanden).
- Beobachtungen für den Produktinhaber (bewusst nicht im Testbogen, um die Tester nicht zu lenken): Fenns Brustbild auf der Abschiedskarte grinst mit erhobenem Dolch (neutrales Bild, entsättigt); in Bild 2 steht Brenna mit ihrer letzten Stimmung (`neutral`, lächelnd) hinter dem weinenden Tobin.
- Prüfung: `pnpm check` grün (zwei Ladezeit-Überschreitungen unter Last liefen einzeln grün); Durchlauf per Playwright bei 375 × 812 bis zum Titelbild.

### File List

- `src/app/toneTestPlan.ts` (neu): Inhalt des Ablaufs, Wegwerf-Kampagne, Kampfergebnis für die Abschiedskarte
- `src/app/state/toneTest.ts` (neu): Ablauf Grab → Abschiedskarte → N1-Gedenken → Titel
- `src/main.tsx`: Start bei `?tonbruch`
- `src/app/state/devHooks.ts`: `__hc.toneTest()`
- `src/app/state/packs.ts`: `afterPrepare` exportiert
- `src/app/state/screen.ts`, `src/app/screens/Farewell.tsx`, `src/app/App.tsx`: Abschiedskarte mit optionalem Folge-Screen `then`
- `tests/unit/tone-test.test.ts`, `tests/unit/tone-test-run.test.ts` (neu)
- `concept/23-art-direction/tonbruch-test.md` (neu): Testbogen
- `_bmad-output/implementation-artifacts/8-1-belege/` (neu): 8 Screenshots 375 × 812 (@2x)

### Review (bmad-code-review, 2026-11-06)

Behoben: Hänger nach dem Grab, wenn das Akt-Paket fehlt (jetzt Ladebildschirm mit Fortschritt und Zurück wie vor einer Mission); Avatar-Name aus `ui.new.defaultName` statt im Code; Test für den ganzen Ablauf ohne Kampagnen-ID; Testbogen mit Kopfzeile (Gerät, Ton, Skip) und Freitext auch bei F1.
Offen für den Produktinhaber: Fenn spricht im Ablauf nicht, seine 4 Stimmungen sind daher nicht Teil des Tests (sichtbar sind Lucan, Brenna, Tobin, Rhen, Mira in `sad` und Fenns Brustbild auf der Karte); Bedingung 3 (F2 ≥ 3,0) ist eine Auslegung des Brief-Risikos und beim Log-Eintrag zu bestätigen.
Zurückgestellt: kein Test der `then`-Weiterleitung über mehrere Karten in `Farewell.tsx` (keine Screen-Tests im Repo); `__hc.toneTest()` verwirft eine offene Dev-Kampagne wie `devNode`.
Verworfen: `?tonbruch` bleibt in der URL (Neuladen startet den Test absichtlich neu); Doppelstart nur im Dev-Werkzeug.

### Change Log

- 2026-11-06: Story angelegt, Status in-progress.
- 2026-11-06: Vorbereitung fertig, Review-Funde behoben, Status review (Ergebnis tragen die Tester bei).
