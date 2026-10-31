# Story 7.3: Ende eines veröffentlichten Akts

Status: done

## Story

Als Spieler
möchte ich wissen, dass es weitergeht, wenn ich alle verfügbaren Missionen gespielt habe,
damit ich nicht vor einem leeren Bildschirm stehe.

## Acceptance Criteria

1. **Akt-Ende erkennen:** Ein Akt ist beendet, wenn sein Knoten mit `fixed: finale` in `c.completed` steht. Fehlt im Build ein Paket des nächsten Akts (`virtual:hc-packs`, kein Paket mit `act = n + 1`), bleibt der Akt bei n (Produktinhaber 2026-10-25: kein `act + 1`, kein `actReached` ohne Paket; den echten Übergang baut Akt 2). Heimsuchungen, Nebenquests, Supports und Heimat laufen weiter.
2. **„Erscheint bald“ im Nebel (UX-DR18):** Ist der Akt beendet und das nächste Paket fehlt, steht auf der Weltkarte über der Region des nächsten Akts im Nebel ein Stein „Akt n „Name“ erscheint bald“ mit dem Hinweis „Bis dahin: Heimsuchungen, Nebenquests, Lagerfeuer“ (Mockup 07). Ohne Akt-Ende bleibt der Nebel wie heute.
3. **Backup-Erinnerung (AR21):** Nach dem Akt-Finale erinnert die App einmal je Kampagne und Akt an ein Backup: ein Blatt auf der Weltkarte mit „Exportieren“ (lädt den Spielstand wie der Export im Speichern-Blatt) und „Später“. Danach kommt es für diesen Akt nicht wieder.

## Tasks / Subtasks

- [x] T1 Kern: reine Funktion `actFinished(data, c)` in `src/core/campaign/graph.ts` (Finale des Akts erledigt; ohne Finale-Knoten im Akt `false`)
- [x] T2 App: Funktion „nächster Akt im Build?“ aus der Paketliste (`virtual:hc-packs`, Pakete mit `act`) in `src/app/state/packs.ts` oder eigenem Blatt-Modul; keine Akt-Zahl im Code
- [x] T3 Weltkarte: Stein „erscheint bald“ über der Region `act + 1` (`content/world/valmora.yaml` `regions[].at`), Texte `act.<n>.name` (Akt 2 „Glut“ / „Embers“ neu in `de.names.yaml`/`en.names.yaml`), eigene Styles in `WorldMap.css`; `PackRing` und der Zweig in `NodeCard` bleiben
- [x] T4 Backup-Erinnerung: gemerkt **im Spielstand** (optionales Feld mit Default beim Laden, z. B. `c.backupReminded: number[]` Akte), geändert nur über ein Kampagnen-Command; Blatt im Stil des Speichern-/Hinweis-Blatts; „Exportieren“ nutzt `downloadSave` des aktuellen Platzes
- [x] T5 Dev-Helfer `__hc.devActEnd()` (nur DEV): legt zur Laufzeit einen Finale-Knoten an, falls der Akt keinen hat, und schließt ihn ab (für Screenshots ohne Karte 1-8)
- [x] T6 Tests: `actFinished`, „nächster Akt fehlt“, Erinnerung nur einmal je Akt, Default beim Laden alter Stände; Fixtures statt `content/acts/act1/campaign.yaml`
- [x] T7 Entscheidungen in `concept/24-architecture/decision-log.md` und `concept/25-ux/.decision-log.md`; §5.4 „Akt-Übergang“ um den Stand ergänzen

## Dev Notes

### Entscheidungen des Produktinhabers (2026-10-25)

- Ohne Paket des nächsten Akts bleibt der Akt bei 1; „Akt-Ende“ = Finale erledigt. Grund: `act + 1` würde Sperren mit `requires: [{ act: 2 }]` (Ausbau-Bänder aus 6.9) öffnen, obwohl Akt 2 fehlt.
- Backup-Erinnerung einmal je Kampagne als Blatt auf der Weltkarte (Exportieren / Später).

### Heutiger Stand

- Akt kommt aus dem Content (`data.campaign.act`); `conditionContext` liest ihn. `fixed: 'first' | 'finale'` ist in `CampaignNodeDef` und `availableNodes` umgesetzt (Story 4.3). Akt 1 hat noch keinen Finale-Knoten (1-8 legt die Session „Level-Design Akt 1“ an).
- Weltkarte (`WorldMap.tsx`): Nebel `fogTop(world, act)`, Regionsnamen späterer Akte als `wm-region` über dem Nebel. Mockup 07 zeigt den Text „Akt 2 „Glut“ erscheint bald“ / „Bis dahin: Heimsuchungen, Nebenquests, Lagerfeuer“.
- Speicherschutz: `src/app/state/protection.ts` (Home-Hinweis einmal je Gerät, Banner bei Fehler), Blätter in `Fault.tsx`; Export: `downloadSave(rec)` in `Menus.tsx`, genutzt von `SaveSheet.tsx`.
- Pakete: `src/app/state/packs.ts` (`packList` aus `virtual:hc-packs`, `reachedAct`).

### Regeln

- Kein sichtbarer Text im Code; Zahlen und Akt-Bezüge aus Daten. Neue persistierte Felder mit Default beim Laden; jede Änderung am Spielstand ist ein Kampagnen-Command.

### References

- [Source: concept/26-epics/epics/epic-07.md#Story 7.3, #Story 9.9], FR58, AR21, UX-DR18
- [Source: concept/24-architecture/architecture.md#5.4 Akt-Übergang, #5.14, #5.15 Speicherschutz]
- [Source: concept/25-ux/EXPERIENCE.md Zustand Weltkarte; mockups/07-start-kampagnen.html, 03-weltkarte.html]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm lint`, `pnpm content:check`, `pnpm test` (46 Dateien, 468 Tests) und `pnpm build` grün; Bundle: erster Download 11,58 MB (Budget 15, Ziel 12), Paket `act1` 19,37 MB (Budget 40). Nach einem frischen Build laufen vier Tests, die Inhalte laden (`chronicle`, `core`, `perf-bench`, `save`), einmal in den 5-s-Timeout; der zweite Lauf war ohne Fehler (kalter Cache, kein Fehler im Code).
- `pnpm test:e2e`: 13 bestanden, 3 übersprungen (`worker.spec.ts` auf iPhone, Pixel, iPad: im Projekt so vorgesehen), keine Fehler.
- Sichtprüfung im Dev-Server (Hochformat 375 x 812): `__hc.devActEnd()` zeigt den Stein „Akt 2 „Glut“ erscheint bald“ im Nebel über Eisenmark und das Backup-Blatt; „Später“ schließt es und setzt `backupReminded`.

### Completion Notes List

- **T1:** `actFinished(data, c)` in `graph.ts` (Finale-Knoten in `c.completed`; ohne Finale-Knoten `false`).
- **T2:** `hasPackForAct(packs, act)` in `src/packs/plan.ts` (rein, testbar), `nextActInBuild()` in `state/packs.ts` fragt `act + 1` gegen `virtual:hc-packs`. Keine Akt-Zahl im Code.
- **T3:** Weltkarte: ist der Akt beendet und fehlt das Paket des nächsten Akts, ersetzt der Stein (`Piece`, `.wm-soon` in `WorldMap.css`) das Regionsschild der Region `act + 1` im Nebel. Texte `ui.map.actSoon` / `ui.map.actSoonHint` (Wortlaut Mockup 07), `act.2.name` Glut / Embers in den Namensdateien. `PackRing` und `NodeCard` unberührt.
- **T4:** `CampaignState.backupReminded: number[]` (Default `[]` in `newCampaign` und `normalizeCampaign`), Command `markBackupReminded { act }` (nur laufender Akt nach dem Finale, idempotent, Event `backupReminded`). Blatt `BackupSheet.tsx` auf der Weltkarte, sobald der Akt beendet und noch nicht erinnert ist; „Exportieren“ setzt zuerst das Merkmal und lädt dann `currentSaveRecord()` über `downloadSave`, „Später“ und Schließen setzen es ebenfalls. Speicherformat bleibt 2: das Schema ist offen, ein Feld mit Default braucht keine Migration (`migrations.test.ts` unverändert grün).
- **T5:** `__hc.devActEnd()` (nur DEV, `flow.ts`): legt bei Bedarf `dev_finale` in den Laufzeit-Daten an (Karte, Titel und Ort vom ersten Knoten), trägt ihn als erledigt ein, zeigt die Weltkarte; keine Datei wird geändert.
- **T6:** `tests/unit/act-end.test.ts` (8 Tests): `actFinished`, „nächster Akt fehlt“, Command (Fehler, Event, einmal je Akt, Determinismus, Replay), Default alter Stände. Nur Fixtures (Datenkopie mit eigenen Knoten).
- **T7:** Einträge in beiden Entscheidungslogs, §5.4 um den Stand ergänzt.
- Bewusst nicht gemacht: `act + 1` und `actReached` (Akt 2); Änderungen an `content/acts/act1/campaign.yaml` und den Karten von Akt 1; der Zähler „Heimsuchungen“ im Stein; neue Jahreszeit `act.2.season`.
- Offene Fragen an den Produktinhaber: siehe Abschlussbericht (Texte des Backup-Blatts sind Vorschläge; der alte Block „Ende des ersten Akts“ `ui.end.*` erscheint weiter, wenn kein Knoten mehr offen ist).
- PoC-Block „Ende des ersten Akts – Fortsetzung folgt“ (`ui.end.*`) entfernt (Produktinhaber 2026-10-25); das Akt-Ende zeigen Stein im Nebel und Backup-Blatt.

### File List

- `src/core/campaign/graph.ts`, `campaign.ts`, `commands.ts`, `apply.ts`, `src/core/state.ts`
- `src/packs/plan.ts`, `src/app/state/packs.ts`, `src/app/state/flow.ts`
- `src/app/screens/WorldMap.tsx`, `WorldMap.css`, `BackupSheet.tsx` (neu)
- `content/core/locales/de.yaml`, `en.yaml`, `de.names.yaml`, `en.names.yaml`
- `tests/unit/act-end.test.ts` (neu)
- `concept/24-architecture/architecture.md`, `decision-log.md`, `concept/25-ux/.decision-log.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`, diese Datei
