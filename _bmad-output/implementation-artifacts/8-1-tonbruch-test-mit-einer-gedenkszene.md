# Story 8.1: Tonbruch-Test mit einer Gedenkszene

Status: in-progress

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

- [ ] Testablauf „Tonbruch“ im Spiel: Gerrits Grab (`scn.prologue.outro`, Lastkahn, Trauer der ganzen Truppe), danach Fenns Abschiedskarte (Permadeath, letzte Zeile + Trauer Miras, `scn.farewell.fenn`) und die Gedenk-Variante von N1 (`scn.n1.memorial_intro`), am Ende ein Abschluss-Hinweis.
- [ ] Direktlink `?tonbruch` (Produktions-Build) und `__hc.toneTest()` (Dev); Wegwerf-Kampagne ohne Kampagnen-ID, damit nie ein Spielstand überschrieben wird.
- [ ] Texte nur in `de.yaml`/`en.yaml`, kein sichtbarer Text im Code.
- [ ] Testbogen `concept/23-art-direction/tonbruch-test.md`.
- [ ] Screenshots 375 × 812 unter `_bmad-output/implementation-artifacts/8-1-belege/`.
- [ ] Unit-Test für die Auswahl des Ablaufs, `pnpm check` grün.
- [ ] Ergebnis der Tester in `decision-log.md` (nach dem Test, durch den Produktinhaber) – danach `done`.

## Dev Notes

- **Porträts:** alle 51 Porträts sind v2.5 (`figuren-bestand.md`); `sad` gibt es für Lucan (Datei `kael_sad`), Brenna, Tobin, Fenn, Mira, Rhen a/b; Gerrit hat nur `neutral` (Nebenfigur, spricht nicht). Kein neues Porträt nötig.
- **Stimmungen:** art-direction §5.1 (gleiche Pose, nur Gesicht/Brauen/Schultern); Humor setzt in Trauerszenen nie ein (Kopf von `scn.prologue.outro`).
- **Wiederverwendung:** Dialog-Screen (`screen = { name: 'dialogue', id, next }`), Abschiedskarte `Farewell.tsx` + `farewellView` (Kern). Wegwerf-Kampagne wie `devNode` in `src/app/state/devHooks.ts` (Kompanie nach dem Prolog). Speichern: `autosave` tut nichts ohne `campaignId`.
- **Pakete:** Prolog-Szenen liegen in `core`; `scn.farewell.fenn` und `scn.n1.memorial_intro` in `act1` → vorher `ensurePack('act1')`.
- **Start:** erst nach `afterPrepare` (Erstinstallation), sonst überdeckt der Vorbereitungs-Screen die Szene.

## Dev Agent Record

### File List

### Change Log

- 2026-11-06: Story angelegt, Status in-progress.
