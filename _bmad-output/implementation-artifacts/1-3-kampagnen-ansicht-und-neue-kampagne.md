# Story 1.3: Kampagnen-Ansicht und Neue Kampagne

Status: review

## Story

Als Spieler
möchte ich meine Kampagnen sehen und eine neue auf einer Seite anlegen,
damit ich in Sekunden weiß, wo ich stehe, und schnell ins Spiel komme.

## Acceptance Criteria

1. **Zeilen:** „Kampagnen“ zeigt je Kampagne Avatar, Name, Modus-Marke (Klassik dunkel), Akt und Stand, Spielzeit und Zeit des Auto-Saves (Mockup 07). Ein Tipp lädt den Auto-Save, ein Langdruck bietet Löschen mit Rückfrage.
2. **Neue Kampagne:** Bei freiem Platz legt der Spieler auf einer Seite Name, Aussehen (zwei Avatar-Vorlagen) mit Pronomen, Schwierigkeit und Tod-Modus mit je einem Satz Erklärung fest; Standard ist vorgewählt. „Aufbrechen“ startet den Prolog.
3. **PoC-Stand:** Ein Spielstand in `legacy` steht als graue Zeile „Spielstand aus dem Proof of Concept · nicht mehr kompatibel“ mit „Exportieren“ und lässt sich nicht laden.
4. **Export und Import:** Jede Zeile exportiert ihre Kampagne als Datei; „Importieren“ liest eine Datei ein, die die Kampagne gleicher ID überschreibt oder einen freien Platz belegt (FR56). Sind drei Plätze belegt und die ID ist neu, verlangt der Import zuerst das Löschen einer Kampagne (Klassik-Regeln: Story 1.5).

## Tasks / Subtasks

- [x] T1 Bildbausteine (AC 1, 2)
  - [x] `tools/art/build.py`: `build_avatars` schneidet aus `art/mockups/characters-s1/rhen_a|b.png` den Kopf (800 px Quadrat, 160 px WebP) nach `public/assets/avatars/`; Manifest-Feld `avatars`
  - [x] `ScreenHead` (Rundtaste + Titel-Pille) in `src/ui/pieces.tsx`/`pieces.css`; Icons `box`, `more`
- [x] T2 Kampagnen-Ansicht (AC 1, 3, 4)
  - [x] neuer Screen `campaigns` (`store.ts`), `src/app/screens/Campaigns.tsx`, `src/ui/campaigns.css`
  - [x] Zeile: Medaillon, Name, Modus-Marke, Stand (`Akt · Ort · Spielzeit · Auto-Save vor …`), Plätze als Felder (Klassik: „nur Auto-Save“), Tipp lädt Auto-Save, belegte Plätze ladbar
  - [x] Langdruck (450 ms), Rechtsklick und Taste „…“ öffnen das Zeilenmenü (Exportieren, Löschen, Abbrechen); Löschen mit Rückfrage über `removeCampaign`
  - [x] PoC-Zeile mit „Exportieren“, nicht ladbar
  - [x] Import: Fehler in einem Satz; bei drei Kampagnen und neuer ID öffnet sich „Höchstens drei Kampagnen“ mit Lösch-Liste, danach läuft der Import weiter
- [x] T3 Neue Kampagne auf einer Seite (AC 2)
  - [x] `NewCampaign`: Name, zwei Gesichter, Pronomen-Schalter, Schwierigkeit mit Hinweiszeile, drei Tod-Modus-Karten (Standard vorgewählt), „Aufbrechen“
  - [x] Bei drei Kampagnen öffnet „Neue Kampagne“ dieselbe Lösch-Liste; nach dem Löschen geht es zum Formular
- [x] T4 PoC-Reste entfernt
  - [x] `Menus.tsx`: Zwischenmenü, `NewGame`, `CampaignLimit`, `exportCurrent`, Titel-Import; `.campaigns-menu` in `styles.css`; Locale-Schlüssel `ui.title.new|import*`, `ui.new.more|less|affinity`, `ui.campaign.deleteConfirm`
  - [x] `.choice` und `.linkish` bleiben (Optionen und Lager nutzen sie noch)
- [x] T5 Tests und Prüfung
  - [x] `tests/unit/format.test.ts` (Spielzeit, Alter); E2E-Smoke geht jetzt Titel → Kampagnen → Neue Kampagne

## Dev Notes

- **Stand vor der Story:** `Title` öffnete ein Zwischen-Modal (Neues Spiel / Laden / Import), `NewGame` war die PoC-Maske mit „Weitere Einstellungen“, `CampaignLimit` ein Modal. Persistenz (`listCampaigns`, `listSaves`, `listLegacy`, `deleteCampaign`, `exportSave`/`importSave`) und Store (`loadSlot`, `importRecord`, `latestAutoSave`, `startNewGame`) waren schon da.
- **Avatar-IDs:** `CampaignState.avatar.portrait` bleibt `avatar_a`/`avatar_b`; Dialogporträt und Brettfigur (`models/units/avatar_a.glb`) hängen daran. `AVATAR_LOOKS` in `src/app/campaignInfo.ts` ordnet jedem das runde Rhen-Medaillon `avatars/rhen_a|b.webp` zu; unbekannte IDs fallen auf Look A zurück.
- **Stand einer Zeile:** aus dem Auto-Save (`resumeWhere`: „im Kampf …“, „vor …“, „Ende der Kampagne“); `resumeText` und `slotSummary` leben jetzt in `campaignInfo.ts` (vorher in `Menus.tsx`), damit Titel und Ansicht denselben Text nutzen.
- **Löschen der aktiven Kampagne:** `removeCampaign` schreibt ausstehende Auto-Saves und Journal-Einträge zuerst weg, löscht dann und setzt `campaign`, `campaignId` und `battle` zurück, damit keine Schreibzugriffe die Kampagne wiederbeleben.
- **Bundle:** `avatars/` kostet 22 KB; Initial-Download 14,88 MB (Budget 15 MB).
- **Nicht Teil der Story:** Platzregeln je Modus und Neustart (1.5), Größenprüfung des Imports (1.5), Akt-Pakete.

### Project Structure Notes

- Neu: `src/app/screens/Campaigns.tsx`, `src/app/campaignInfo.ts`, `src/ui/format.ts`, `src/ui/campaigns.css`, `tests/unit/format.test.ts`.
- Geändert: `src/app/App.tsx`, `src/app/store.ts`, `src/app/screens/Menus.tsx`, `src/ui/pieces.tsx|css`, `src/ui/icons.tsx`, `src/ui/styles.css`, `content/locales/de|en.yaml`, `tools/art/build.py`, `tests/e2e/smoke.spec.ts`.

### Project Context Rules

- Kein sichtbarer Text im Code (Schlüssel `ui.campaign.*`, `ui.new.*`, `ui.death.*.tag` in DE und EN); Tod-Modus-Sätze stehen in den Locales.
- Ein Primärknopf je Ansicht: Kampagnen-Ansicht hat keinen (alles Sekundär), das Formular „Aufbrechen“.

### References

- [Source: concept/26-epics/epics/epic-01.md#Story 1.3]
- [Source: concept/25-ux/mockups/07-start-kampagnen.html]
- [Source: concept/25-ux/EXPERIENCE.md#Kampagnen-Zeile]
- [Source: concept/25-ux/DESIGN.md#Kampagnen-Zeile]
- [Source: concept/24-architecture/architecture.md §5.15]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm lint`, `pnpm test` (62), `pnpm content:check` (690 Schlüssel je Sprache), `pnpm build` grün; Bundle 18,47 MB roh / 14,88 MB Transfer (Budget 15 MB).
- Browser (375 × 812): Kampagnen mit drei Zeilen (Standard mit belegtem Platz 1, Klassik mit „nur Auto-Save“), PoC-Zeile (per IndexedDB-Eintrag erzeugt), Formular, Zeilenmenü, Langdruck (synthetische Pointer-Events), Lösch-Rückfrage, volle Liste → Löschen → Formular, Import mit neuer ID bei drei Kampagnen → Löschen → Import läuft weiter.

### Completion Notes List

- Der Sammel-Knopf „Exportieren“ aus Mockup 07 entfällt; jede Zeile exportiert über ihr Menü.
- Locale-Sätze der Tod-Modi ersetzen die kurzen PoC-Zeilen; der Standard-Satz nennt keine Phasenzahl, bis Story 1.6 sie als Wert liefert.
- Decision-Log-Eintrag in `concept/25-ux/.decision-log.md`.

### File List

- `src/app/screens/Campaigns.tsx`, `src/app/campaignInfo.ts` (neu)
- `src/app/App.tsx`, `src/app/store.ts`, `src/app/screens/Menus.tsx`
- `src/ui/campaigns.css`, `src/ui/format.ts` (neu); `src/ui/pieces.tsx`, `src/ui/pieces.css`, `src/ui/icons.tsx`, `src/ui/styles.css`
- `content/locales/de.yaml`, `content/locales/en.yaml`
- `tools/art/build.py`
- `tests/unit/format.test.ts` (neu), `tests/e2e/smoke.spec.ts`
- `concept/25-ux/.decision-log.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`
