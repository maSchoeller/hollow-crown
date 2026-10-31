# Story 7.2: Hintergrund-Download und Offline

Status: done

## Story

Als Spieler
möchte ich, dass der Rest eines Akts im Hintergrund lädt und danach offline bleibt,
damit ich unterwegs ohne Netz spielen kann.

## Acceptance Criteria

1. Fehlt ein Paket eines erreichten Akts, lädt `src/packs/` während die App läuft alle Dateien des Pakets in einen Cache `hc-pack-<id>-<hash>`; der Service Worker liefert sie cache-first; `loadPack(id)` registriert Daten und Locales.
2. Die Weltkarte zeigt den Fortschrittsring (Prozent, MB, „danach offline spielbar“), nur solange ein Akt-Paket lädt; Missionen des Pakets sind sichtbar und zeigen „Wird noch geladen …“ statt der Start-Knöpfe (Mockup 07).
3. Scheitert der Download oder ist das Gerät offline, versucht die App es mit Backoff erneut (und sofort, wenn das Gerät wieder online ist) und zeigt „Wird geladen, sobald du online bist“.
4. Bei einem Update werden nur geänderte Dateien neu geholt; alte Caches des Pakets werden nach Erfolg gelöscht.
5. Ein gespeicherter Kampf in einem Paket, das noch nicht da ist, wird erst nach dem Laden wiederhergestellt; ein Missionsstart wartet auf dem Ladebildschirm aus 7.6.

## Tasks / Subtasks

- [x] T1 Reine Regeln `src/packs/plan.ts` (Cache-Namen, `staleCaches`, `planDownload`, `duePacks`, `backoffMs`, `byteRatio`) mit `plan.test.ts` (AC 1, 3, 4)
- [x] T2 `src/packs/cache.ts`: `downloadPack` (setzt abgebrochene Versuche fort, kopiert unveränderte Dateien aus der alten Version, Marker zuletzt, alte Caches danach weg), `isPackComplete`; `src/packs/load.ts`: `fetchPacksManifest`, `loadPack` (AC 1, 4)
- [x] T3 Content-Registry: `mergePackContent` in `src/content/load.ts` (Karten, Szenen, Texte in dieselben Objekte), `src/content/browser.ts` lädt nur noch `core` statisch, `registerPackContent`, `packOfMap`/`packOfScene` aus `virtual:hc-packs` (AC 1)
- [x] T4 App-Zustand `src/app/state/packs.ts`: Warteschlange nach dem ersten Install, Backoff (`balance.loading.packRetryBaseMs`/`packRetryMaxMs`), `online` weckt sofort, `ensurePack`, `packNeededFor`, `loadingActPack`; Start aus `main.tsx` (AC 1, 3)
- [x] T5 Service Worker (`vite.config.ts`): eine Route für alles unter `assets/`, das nicht im Precache liegt: `caches.match(…, { ignoreVary: true })` über alle Caches, sonst Netz und Ablage in `hc-on-demand` (außer Paket-Downloads, Header `x-hc-pack`); ersetzt die `CacheFirst`-Route aus 7.6 (AC 1)
- [x] T6 Flow: `playNode` wartet per `ensureMissionPack` (Ladebildschirm 7.6, Fortschritt in Dateien) auf das Paket des Knotens; `ensureRecordContent` vor `restore` in `loadSlot`, `importRecord` und `rescue` (AC 5)
- [x] T7 Weltkarte: `screens/PackStatus.tsx` + `PackStatus.css` (`PackRing`, `PackWait`), in `WorldMap.tsx` eingehängt; Texte `ui.packs.*` de/en (AC 2, 3)
- [x] T8 Titelbild `locations/lager_unterwegs.webp` nach `core` (sonst grauer Titel beim ersten Start, bis `act1` da ist)

## Dev Notes

- **Ablauf:** `startPacks()` wartet, bis `prepare.phase === 'off'` (erster Install vorbei), dann kommen `duePacks(packs, data.campaign.act, lang)` in die Warteschlange. Je Paket: `packs.json` lesen (im Precache, also auch offline), `isPackComplete` → sonst `downloadPack` mit Fortschritt in Bytes und Dateien, dann `loadPack` (Import des Content-Chunks, der selbst Paketdatei ist) und `contentRevision++`. Im Dev-Server (kein Service Worker) wird nur importiert.
- **Cache-Treffer:** Dateien liegen unter ihrer URL ohne Request-Header; ein Modul-Import schickt `Origin`, und eine Antwort mit `Vary` passt dann nicht. Daher `ignoreVary` im Service Worker (gefunden im Browser-Test: der Chunk landete doppelt in `hc-on-demand`).
- **Fortschritt:** Ring nach Bytes (`size` aus `packs.json`, unkomprimiert), Ladebildschirm nach Dateien wie in 7.6. Während `retry`/`offline` steht der Satz statt der MB-Zeile.
- **Nicht im Umfang:** Kein Fortschritt in den Optionen (Architektur nennt ihn als Signal, die Epic-AC nicht). Ein zweiter Tab lädt parallel mit; der Marker macht das unschädlich. Ein Web Worker existiert noch nicht (AR14); er würde `registerPackContent` mit demselben Modul aufrufen.
- **Weltkarte gehört Story 5.x:** In `WorldMap.tsx` stehen nur der Import, `<PackRing />` im HUD und der Zweig am Anfang von `NodeCard`; alles Übrige liegt in `PackStatus.tsx`. Die Weltkarten-Session ist informiert.

### Prüfen im Browser (Preview, belegt 2026-10-24)

1. Speicher leeren, laden: `hc-pack-act1-<hash>` mit 313 Einträgen (312 Dateien + Marker) neben dem Precache.
2. Server gestoppt (Netz aus), neu geladen: Titel, neue Kampagne, Prolog-Dialog mit Halbfigur und Prolog-Schlacht mit Modellen laufen; `models/units/kael.glb` und der `act1`-Chunk kommen aus dem Cache.
3. Paket-Cache gelöscht, Server aus, Spielstand auf der Weltkarte: Ring „Loading act 1 · 0 % · A few files did not arrive …“, Kapitel 1 zeigt „Still loading …“. Server an: nach dem nächsten Backoff verschwindet der Ring, die Karte zeigt „Deployment“/„Set out“ ohne Neuladen, Kapitel 1 startet mit seiner Szene.
4. Update (Titelbild wechselt das Paket): neuer Cache `hc-pack-act1-6e0d…` mit 313 Einträgen, alter gelöscht, keine Asset-Anfrage ans Netz.

### References

- [Source: concept/26-epics/epics/epic-07.md#Story 7.2]
- [Source: concept/24-architecture/architecture.md#5.14]
- [Source: concept/25-ux/EXPERIENCE.md (Fortschrittsring, Weltkarte „Paket lädt“)]
- [Source: concept/25-ux/mockups/07-start-kampagnen.html („Akt-Paket lädt“)]
- [Source: _bmad-output/implementation-artifacts/7-6-ladeanzeige-beim-ersten-start-und-vor-missionen.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm lint`, `pnpm test` (283 Tests), `pnpm content:check`, `pnpm build` grün; erster Download 10,45 MB (Titelbild +0,1 MB), `act1` 312 Dateien, 16,5 MB.
- `tests/unit/save.test.ts` (Replay-Fixture) lief einmal unter Last in einen Timeout und ist einzeln wie im vollen Lauf grün.

### Completion Notes List

- `contentVersion` hasht jetzt nur die `core`-Daten (beim Start ist nur `core` registriert); Spielstände bekommen dadurch einmalig einen Update-Checkpoint.
- Offene Frage aus 7.6 (blockiert „offline mit fehlenden Dateien“ den Start ganz?) bleibt offen; mit `act1` im Cache tritt der Fall praktisch nicht mehr auf.

### File List

- src/packs/plan.ts, plan.test.ts, cache.ts, load.ts (neu)
- src/app/state/packs.ts (neu), src/app/state/loading.ts, flow.ts, rescue.ts
- src/app/screens/PackStatus.tsx, PackStatus.css (neu), src/app/screens/WorldMap.tsx
- src/content/browser.ts, load.ts
- src/main.tsx, vite.config.ts
- content/packs.yaml, content/core/balance.yaml, src/content/schemas.ts, src/core/defs.ts
- content/core/locales/de.yaml, en.yaml
- concept/24-architecture/decision-log.md
