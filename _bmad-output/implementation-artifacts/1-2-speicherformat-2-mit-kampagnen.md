# Story 1.2: Speicherformat 2 mit Kampagnen

Status: done

## Story

Als Spieler
möchte ich bis zu drei Kampagnen nebeneinander haben,
damit ich zum Beispiel eine Klassik-Kampagne neben meinem Standard-Spiel führen kann.

## Acceptance Criteria

1. **Upgrade v1 → v2:** Startet die App mit IndexedDB `hollow-crown` in Version 1, legt sie Version 2 mit den Stores `campaigns` (Schlüssel `id`), `saves` (Schlüssel `[campaignId, slot]`), `journal` (Schlüssel `[campaignId, seq]`) und `legacy` (Schlüssel `slot`) an. [Architektur §5.15]
2. **Legacy:** Vorhandene Format-1-Spielstände wandern **unverändert** (Byte-gleiches Objekt, keine Migration) nach `legacy`; sie sind exportierbar, aber nicht ladbar (AR17).
3. **Auto-Save:** Nach jedem angewendeten Command (Kampf oder Kampagne) schreibt die App den Auto-Save der aktiven Kampagne asynchron, ohne die Eingabe zu blockieren; aufeinanderfolgende Schreibwünsche werden zusammengefasst (nur der letzte Stand wird geschrieben).
4. **Hintergrund:** Bei `visibilitychange → hidden` (und `pagehide`) wird der letzte Stand sofort geschrieben.
5. **SaveRecord:** `{ format: 2, campaignId, slot, createdAt, appVersion, contentVersion, payload }`, `payload = { campaign, battle?: { start, commands, turnStartIndex }, screen }`.
6. **Kampagnen-Meta:** Store `campaigns` hält Name, Avatar, Tod-Modus, Schwierigkeit, Akt, Story-Fortschritt, Spielzeit, `contentVersion`, `createdAt`, `updatedAt`; jeder Auto-Save aktualisiert sie.
7. **Höchstens drei Kampagnen:** Eine vierte lässt sich nicht anlegen (`CampaignLimitError`); die App verlangt zuerst das Löschen einer Kampagne mit Rückfrage. Löschen entfernt Meta, Spielstände und Journal der Kampagne.
8. **Fixtures:** `tests/fixtures/saves/` enthält einen Format-1-Stand (Legacy) und einen Format-2-Stand; Tests decken Upgrade, Legacy, Lesen/Schreiben, Limit, Löschen, Export/Import ab.

## Tasks / Subtasks

- [x] T1 Persistenz Format 2 (AC 1, 2, 5, 6, 7)
  - [x] `src/persistence/save.ts`: `SAVE_FORMAT = 2`, `MAX_CAMPAIGNS = 3`, Typen `SaveRecord`, `CampaignMeta`, `LegacyRecord`
  - [x] DB-Version 2 mit Upgrade-Pfad v0 → v2 und v1 → v2 (Format-1-Stände nach `legacy`)
  - [x] `createCampaign`, `listCampaigns`, `deleteCampaign`, `writeSave`, `readSave`, `listSaves`, `listLegacy`
  - [x] `exportSave`/`importSave` für Format 2 (Format 1 beim Import mit eigenem Fehler ablehnen); Export von Legacy-Ständen
  - [x] DB-Fabrik injizierbar, damit Tests `fake-indexeddb` nutzen
- [x] T2 Auto-Save ohne Blockieren (AC 3, 4)
  - [x] `src/persistence/autosave.ts`: zusammenfassender Schreiber (`schedule`, `flush`)
  - [x] `src/app/store.ts`: aktive `campaignId`, Auto-Save über den Schreiber, `turnStartIndex`, Spielzeit, Meta-Pflege
  - [x] `visibilitychange`/`pagehide` → `flush`
- [x] T3 App-Verdrahtung (AC 7)
  - [x] Titel: „Fortsetzen“ lädt den Auto-Save der zuletzt gespielten Kampagne; Laden/Speichern je aktiver Kampagne
  - [x] Neues Spiel bei drei Kampagnen: Dialog zum Löschen einer Kampagne mit Rückfrage (Zwischenlösung, bis Story 1.3 die Kampagnen-Ansicht baut)
- [x] T4 Fixtures und Tests (AC 8)
  - [x] `tests/fixtures/saves/format1-auto.json`, `format2-auto.json`
  - [x] `tests/unit/save.test.ts` mit `fake-indexeddb`

## Dev Notes

- **Schichten:** `persistence ← core (Typen)`; Zeitstempel (`createdAt`) setzt nur `persistence` (Architektur §6.4). `src/core` bleibt unberührt; die Kampagnen-ID lebt außerhalb von `CampaignState` (Meta und `SaveRecord`), damit Replays und Kern-State unverändert bleiben.
- **`contentVersion`:** Es gibt noch kein `content/packs.yaml` (kommt mit Epic 7). Bis dahin ist `contentVersion` eine FNV-Prüfsumme über die geladenen Content-Daten; die App berechnet sie einmal beim Start. Story 1.4 nutzt sie für Checkpoints.
- **Journal:** Store wird jetzt angelegt, beschrieben wird er in Story 1.4.
- **Speicherplätze 1–3 je Kampagne:** Schlüssel liegt schon im Format; die Regel „Klassik nur Auto-Save“ und die Platz-UI gehören zu Story 1.5. Bestehende Platz-Wahl bleibt, nur je Kampagne.
- **Legacy-Anzeige** in der Kampagnen-Ansicht gehört zu Story 1.3; hier nur Daten und Export.
- **Kampagnen-Ansicht** (Story 1.3) und UI-Bausteine (Story 1.1) sind nicht Teil dieser Story; der Lösch-Dialog nutzt das bestehende `Modal` aus `src/ui/components` ohne Änderung an `src/ui/`.
- **Tests:** Vitest im Node-Environment; IndexedDB über `fake-indexeddb` (nur Dev-Abhängigkeit, AR1 betrifft Laufzeit). Format-1-Fixture wird mit dem echten Content per `newCampaign` erzeugt und eingecheckt.

### Project Structure Notes

- Dateien: `src/persistence/save.ts`, `src/persistence/autosave.ts`, `src/app/store.ts`, `src/app/App.tsx`, `src/app/screens/Menus.tsx`, `src/app/screens/Camp.tsx`, `content/locales/{de,en}.yaml` (neue Schlüssel), `tests/unit/save.test.ts`, `tests/fixtures/saves/`.
- Nicht anfassen: `src/render/`, `src/ui/`, `tools/art/`, `art/` (parallele Sessions).

### References

- [Source: concept/24-architecture/architecture.md#5.15 Speichern, Format 2]
- [Source: concept/24-architecture/architecture.md#5.2 Zwei Command-Ebenen (Journal)]
- [Source: concept/24-architecture/architecture.md#6.4 Zeit und Zufall]
- [Source: concept/26-epics/epics.md#Story 1.2]
- [Source: concept/10-tech-architecture.md §6 (Format 1)]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm lint`, `pnpm test` (35 Tests), `pnpm content:check`, `pnpm build` grün.
- Coverage `src/core` (Zeilen) 64,63 % → 66,11 % (der neue Test spielt den Fixture-Kampf nach).
- Browser-Prüfung (Dev-Server): v1-Datenbank mit Format-1-Stand → nach Neuladen Version 2, Stand in `legacy`; drei Kampagnen angelegt, vierte zeigt den Lösch-Dialog, Löschen mit zweitem Tipp („Wirklich löschen?“); Auto-Save im Kampf (6 Commands, `turnStartIndex` 5), „Fortsetzen“ stellt den Kampf wieder her; keine Konsolenfehler.

### Completion Notes List

- Kampagnen-ID entsteht in `persistence` (`crypto.randomUUID`) und lebt in Meta und `SaveRecord`, nicht in `CampaignState`; `src/core` blieb unverändert (auch `defs.ts`, `content/schemas.ts`).
- `contentVersion` = FNV-Prüfsumme der geladenen Content-Daten, bis Epic 7 eine Paketversion liefert.
- Meta: `name` = Avatar-Name (eigener Kampagnenname kommt ggf. mit Story 1.3), `act` fest 1 bis Epic 4, Spielzeit zählt sichtbare Zeit zwischen Saves.
- Auto-Save: `createAutoSaver` fasst Schreibwünsche zusammen (nur letzter Stand, nie zwei Schreibvorgänge gleichzeitig); `visibilitychange → hidden` und `pagehide` schreiben sofort.
- Import: Format-1-Datei wird mit eigenem Hinweis abgelehnt; Format 2 überschreibt die Kampagne gleicher ID oder legt sie an (Limit gilt). Größenlimit und Zod-Prüfung folgen in Story 1.5.
- Andere Tabs: Eine neuere Version in einem anderen Tab löst `blocking` aus, und die Verbindung wird geschlossen. Hält ein älterer Tab (z. B. der PoC) das Upgrade auf, meldet `blocked` das, und der Titel zeigt „anderen Tab schließen“.
- Lösch-Dialog ist eine Zwischenlösung in `Menus.tsx` (bestehendes `Modal`), bis Story 1.3 die Kampagnen-Ansicht baut.
- Neue Dev-Abhängigkeit `fake-indexeddb` (nur Tests).

### Review Follow-ups (gds-code-review, 2026-10-24)

Ergebnis: nichts Schwerwiegendes; kein Weg verliert Spielstände, AC 1–8 erfüllt. Behoben:

- [x] Spielzeit ging beim Wechsel in den Hintergrund verloren: `createPlayClock` (in `autosave.ts`, getestet) bewahrt die sichtbare Zeit; beim Wechsel in den Hintergrund wird immer ein Auto-Save geschrieben (im Browser geprüft: 3 s gezählt).
- [x] Upgrade blockiert durch offenen PoC-Tab: `blocked`-Handler, Hinweis auf dem Titel.
- [x] Fehlgeschlagenes Öffnen der Datenbank blieb bis zum Neuladen kaputt: Promise wird verworfen, nächster Zugriff versucht es neu; „Neues Spiel“ zeigt einen Fehler statt nichts zu tun; `tx.abort()` nach bereits abgebrochener Transaktion abgefangen.
- [x] „Fortsetzen“ verschwand, wenn die neueste Kampagne keinen Auto-Save hatte: `latestAutoSave` sucht weiter; ein Import ohne Auto-Save entfernt die neu angelegte Kampagne wieder.
- [x] Import wartete nicht auf ausstehende Schreibvorgänge: `importRecord` ruft zuerst `flush`.
- [x] `crypto.randomUUID` fehlt außerhalb sicherer Kontexte (Handy-Test über LAN-IP): Ersatz über `crypto.getRandomValues`.
- [x] Determinismus-Test prüft jetzt Replay nach Export/Import gegen das Live-Replay und dass der Start nicht verändert wird.

Bleibt bewusst: Größenlimit und Zod-Prüfung beim Import (Story 1.5); Verdrahtung in `store.ts` ohne Unit-Test (Browser-Prüfung).

### File List

- `src/persistence/save.ts` (Format 2, neu geschrieben)
- `src/persistence/autosave.ts` (neu)
- `src/app/store.ts`
- `src/app/screens/Menus.tsx`
- `src/app/screens/Camp.tsx`
- `content/locales/de.yaml`, `content/locales/en.yaml` (7 neue Schlüssel)
- `tests/unit/save.test.ts` (neu)
- `tests/fixtures/saves/format1-auto.json`, `format2-auto.json`, `generate.ts` (neu)
- `package.json`, `pnpm-lock.yaml` (`fake-indexeddb`)
