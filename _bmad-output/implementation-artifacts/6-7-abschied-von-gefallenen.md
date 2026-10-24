# Story 6.7: Abschied von Gefallenen

Status: review

## Story

Als Spieler
möchte ich von jedem Gefallenen Abschied nehmen,
damit ein Verlust erzählerisch getragen wird.

## Acceptance Criteria

1. **Ablauf:** Hat eine gewonnene Mission Gefallene, führt „Weiter“ im Ergebnis nicht zur Weltkarte, sondern nacheinander zu je einer Abschieds-Karte; nach der letzten geht es weiter wie bisher.
2. **Abschieds-Karte (Mockup 08, DESIGN `mourn-card`):** Hintergrund entsättigt und abgedunkelt, nur die Glutlinie farbig; Halbfigur grau, Name, Rolle (Klasse) und Ort („fiel in <Mission>“), letzte Zeile, Trauer-Zeile je Support-Partner mit Wirkung („Mira trauert · 3 Missionen −10 Treffer“), ruhige graue Taste „Abschied nehmen“ (`QuietButton`), keine Glut-Taste, keine Bewegung außer Einblenden.
3. **Nicht überspringbar:** Die Taste ist die ersten 2 s gesperrt (Dauer in `balance.yaml`, nicht im Code); beim Erscheinen spielt der Glockenschlag `audio.sfx('bell')`. Audio folgt laut Produktinhaber gesammelt in einer Audio-Story: Hook und ElevenLabs-Prompt stehen, die Datei fehlt noch (ohne Datei bleibt es still).
4. **Trauer mit Wirkung im Kern:** Stirbt ein Gefährte, erhält jeder überlebende feste Support-Partner (`supportPairs`) Trauer für `supports.griefMissions` Missionen (`grief`, −`griefHitPenalty` Treffer, schon in `stats.ts`). `finishBattle` setzt das und meldet es im Ergebnis je Gefallenem.
5. **Zeilen aus der Szene des Gefährten:** Szene `scn.farewell.<charId>` mit Zeile `last` (Sprecher der Gefährte) und optional `grief_<partner>` (Sprecher der Partner). Fehlt die Szene oder Zeile, gilt ein allgemeiner Text aus den Locales. Texte für die PoC-Gefährten, die fallen können, liegen bei.
6. **Söldner:** Ein gefallener Söldner aus der Taverne bekommt die kurze Form (ohne letzte Zeile und Trauer, mit allgemeinem Satz) und wird im Kampagnenzustand für den Gedenkstein vermerkt (`c.fallen` mit `mercenary`, `classId`, `portrait`); die Gedächtnishalle selbst baut Story 6.9.
7. **Aufbereitung im Kern:** `farewellView(data, result)` in `src/core/campaign/farewellView.ts` (rein, getestet); die UI zeichnet nur. Eigene `Farewell.css`, Texte de/en.
8. Prüfungen grün: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`; Screenshot der Karte.

## Tasks / Subtasks

- [x] T1 Kern: Trauer an Partner in `finishBattle`, `BattleResult.fallen[]` mit `mercenary`, `grief[]`; `CampaignState.fallen` um `classId`, `portrait`, `mercenary` erweitert
- [x] T2 Kern: `farewellView.ts` + Export, Tests (`tests/unit/farewell.test.ts`)
- [x] T3 Content: Szenen `scn.farewell.<char>` (de) + en in `act1.dialogue.yaml`; `balance.yaml` `farewell.lockMs`
- [x] T4 UI: Screen `farewell` in `state/screen.ts`, `screens/Farewell.tsx` + `Farewell.css`, Weiter im Ergebnis, `App.tsx`
- [x] T5 Audio-Hook `bell` + Prompt in `tools/audio/elevenlabs.py` (nicht erzeugen)
- [x] T6 Prüfungen, Screenshot, Entscheidungsprotokoll

## Dev Notes

- **Ist-Zustand:** `finishBattle` (`core/campaign/campaign.ts`) schiebt Tote in `c.fallen` und `result.fallen` (ohne Söldner-Kennung). `grief` existiert an `UnitRecord`, wird je Mission um 1 gesenkt und kostet in `stats.ts` Treffer, wird aber nirgends gesetzt.
- **Ergebnis:** `Result.tsx` (Story 6.6) führt mit „Weiter“ zur Weltkarte. Diese Story schaltet den Abschied dazwischen.
- **Szenen:** Loader und `resolveScene`/`lineKey` in `core/campaign/scene.ts`; Deutsch in der Szene, Englisch in `content/locales/en/act1.dialogue.yaml`. Die Todes- und Trauerzeilen der endgültigen Akt-1-Gefährten schreibt Epic 9; hier nur die PoC-Besetzung.
- **Heiler-Raumstufe** (Trauer 2 statt 3) folgt mit dem Raumausbau (Akt 2).
- Stil: `--hc-mourn`, `--hc-mourn-quiet`, `--hc-ember`; „Ernstes über Entsättigung und Stille“, keine Glut-Tasten im Abschied (DESIGN).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Completion Notes List

- Trauer war in `stats.ts` schon wirksam, wurde aber nie gesetzt; jetzt setzt `finishBattle` sie für alle überlebenden festen Support-Partner (unabhängig vom Rang, nach `concept/02-core-loop.md`). Heiler-Stufe (Trauer 2) folgt mit dem Raumausbau.
- Ergebnis: Haupttaste heißt bei Gefallenen „Weiter“ und führt in den Abschied, danach Weltkarte.
- Glockenschlag: `audio.sfx('bell')` beim Erscheinen jeder Karte, Prompt in `tools/audio/elevenlabs.py`; die Datei wird laut Produktinhaber mit der Audio-Story erzeugt (bis dahin still).
- Abschiedszeilen für die PoC-Besetzung (Brenna, Tobin, Mira, Liora, Varek, Ysolde) de/en; Avatar und Kael fallen nicht (Niederlage). Die endgültigen Zeilen der Akt-1-Gefährten schreibt Epic 9 in dieselbe Form.
- Gedenkstein: `c.fallen` merkt sich Klasse, Bild und Söldner-Kennung; die Gedächtnishalle selbst ist Story 6.9.
- Im Browser geprüft (375 × 812): Ergebnis → „Weiter“ → Karte Brenna (Taste 2 s gesperrt, dann frei) → Söldner-Karte → Weltkarte. Screenshots an den Nutzer gesendet.
- Prüfungen: lint, test (24 Dateien, 279 Tests), content:check, build grün.

### File List

- `src/core/state.ts`, `src/core/defs.ts`, `src/core/index.ts`, `src/core/campaign/campaign.ts`, `src/core/campaign/farewellView.ts`
- `src/content/schemas.ts`, `content/core/balance.yaml`, `content/core/locales/de.yaml`, `content/core/locales/en.yaml`
- `content/acts/act1/scenes/scn.farewell.{brenna,tobin,mira,liora,varek,ysolde}.yaml`, `content/locales/en/act1.dialogue.yaml`
- `src/app/state/screen.ts`, `src/app/App.tsx`, `src/app/screens/Result.tsx`, `src/app/screens/Farewell.tsx`, `src/app/screens/Farewell.css`
- `tools/audio/elevenlabs.py`, `tests/unit/farewell.test.ts`
- `concept/24-architecture/decision-log.md`, `concept/25-ux/.decision-log.md`

### Change Log

- 2026-10-24: Story-Datei angelegt (ready-for-dev).
- 2026-10-24: Umgesetzt, Status review.
