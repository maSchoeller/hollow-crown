# Story 7.6: Ladeanzeige beim ersten Start und vor Missionen

Status: done

## Story

Als Spieler
möchte ich sehen, wenn das Spiel etwas herunterlädt, und wissen, wie lange es dauert,
damit ich nicht vor einem leeren Bildschirm warte und weiß, wann ich offline spielen kann.

## Acceptance Criteria

1. **Erster Start:** Installiert der Service Worker den ersten Download, zeigt ein Stein „Spiel wird vorbereitet · Größe · danach offline spielbar“ mit Fortschrittsbalken; ohne Klick, danach erscheint der Titel. Bricht die Verbindung ab, sagt der Stein es in einem Satz und versucht es erneut.
2. **Vor einer Mission:** Fehlen Bilder oder Modelle (Ort, Einheiten-Modelle) im Cache, erscheint ein Ladebildschirm mit Missionsname, Ortsbild und Fortschritt; danach startet die Mission von selbst. Liegt alles im Cache, erscheint er nicht.
3. **Offline:** ohne fehlende Dateien wird gespielt; mit fehlenden Dateien steht ein Satz mit „Erneut versuchen“.
4. Alle Texte über Schlüssel (`ui.loading.*`, de und en); Styles in `Loading.css`; Zustand in eigenen Modulen unter `src/app/state/`, kein Barrel, keine Zyklen.
5. Die Entscheidung „welche Dateien braucht die Mission, welche fehlen“ liegt in reinen, getesteten Funktionen; das Bundle-Budget bleibt grün.

## Tasks / Subtasks

- [x] T1 Reine Regeln: `src/app/loading/plan.ts` (`missionAssets`, `unitModelId`, `missingAssets`, `formatBytes`, `ratio`, `failureStatus`) mit `plan.test.ts`
- [x] T2 Mission: `state/loading.ts` (`ensureMissionAssets`, `missionLoad`, Wiederholen, Abbrechen), `flow.beginMission` ersetzt die zwei `startBattle`-Aufrufe (`playNode`, Vorbereitung in `Camp.tsx`), Screen `loading`
- [x] T3 Erster Start: `state/prepare.ts` (`initPrepare`, `watchFirstInstall`), Aufruf aus `main.tsx` und `update.ts`; `App.tsx` zeigt `PrepareScreen` statt der Screens, solange `prepare.phase !== 'off'`
- [x] T4 Build: `vite.config.ts` schreibt `dist/precache-info.json` (Zahl und Bytes des ersten Downloads, nicht im Precache) und legt `assets/models/` in den Laufzeit-Cache `hc-on-demand`
- [x] T5 UI: `screens/Loading.tsx` + `Loading.css`; Texte `ui.loading.*`; optionales `place` je Knoten in `campaign.yaml` (Schema, `CampaignNodeDef`)

## Dev Notes

- **Welche Dateien:** Ortsbild `locations/<place>.webp` (`node.place`, sonst `lager_unterwegs`) und `models/units/<id>.glb` für jede Einheit des Kampfs (aus `createBattle`, also mit der gewählten Aufstellung) sowie Verstärkungen und Trigger-`spawn`s der Karte. Modell-ID wie im Brett: Porträt, wenn dessen Modell existiert, sonst Sprite/Figur/Klasse; nur Einheiten, die das Manifest (`models.units`) kennt.
- **Cache-Prüfung:** `caches.match(url)` über alle Caches des Service Workers plus eine Merkliste der in dieser Sitzung geholten Dateien (Dev-Server, http ohne Cache API). Geladen wird per `fetch` (3 parallel) und vollständig gelesen, damit der `CacheFirst`-Laufzeit-Cache sie behält. Dafür liegt `assets/models/` jetzt ebenfalls im Cache `hc-on-demand` (vorher gar nicht gecacht, also offline nicht verfügbar).
- **Fortschritt Mission:** Zahl der Dateien („3 von 5 Dateien“), kein Byte-Fortschritt.
- **Fehler:** Eine Runde mit Fehlern zeigt „offline“ (`navigator.onLine` false) oder „Ein paar Dateien sind nicht angekommen“ mit „Erneut versuchen“; das Wiederkommen der Verbindung (`online`) versucht es von selbst. Die Zurück-Taste bricht ab und führt zum Ausgangs-Screen (Weltkarte, Lager oder Vorbereitung).
- **Erster Start:** `initPrepare` setzt `pending`, wenn in der Produktion kein Service Worker die Seite steuert; das ist ein leerer Screen, bis `onRegisteredSW` meldet, ob gerade installiert wird (sonst nach 4 s `off`). Fortschritt: Einträge der `*precache*`-Caches / `count` aus `precache-info.json`, alle 300 ms. `statechange` → `installed|activated` beendet den Stein, `redundant` (Abbruch) zeigt den Satz und ruft nach 5 s oder beim `online`-Ereignis `reg.update()`. Ohne Service Worker (Dev, kein Support) bleibt die Phase `off`.
- **Waffenmodelle und Fortsetzen (entschieden 2026-10-24):** Die Liste enthält auch `models/weapons/<model>.glb` aller Einheiten mit Modell (ausgerüstete Hauptwaffe und Nebenhand über `render.gear`, bei später kommenden Einheiten alle Gegenstände der Definition; nur Dateien, die das Manifest unter `models.weapons` kennt). `restore` eines laufenden Kampfes zeigt das Brett erst nach derselben Ladeanzeige; der Zurück-Stein verwirft den wiederhergestellten Kampf im Speicher (der Spielstand bleibt).
- **Nicht behandelt:** Die Weltkarte behält ihren eigenen Stein (Story 5.3). Dialog-Szenen außerhalb von Missionen haben keine bei Bedarf geladenen Bilder.
- **Offene Fragen (Produktinhaber):**
  1. ~~Ortsbild je Knoten?~~ Entschieden 2026-10-24: Prolog `backgrounds/bg_caravan_road`, Kapitel 1 `backgrounds/bg_varnhold_burning`, Kapitel 2 `backgrounds/bg_silverbrook_shrine` (`place` darf einen Ort oder `backgrounds/<id>` nennen; `defaultPlace` bleibt).
  2. ~~Waffenmodelle und Wiederherstellen vorab laden?~~ Entschieden 2026-10-24: ja, beides.
  3. Soll „offline mit fehlenden Dateien“ den Start ganz blockieren, wie umgesetzt, obwohl der Kampf dank Sprite-Rückfall spielbar wäre?
- **Prüfen im Browser (Build/Preview, DevTools → Application):** (a) Erster Start: Application → Storage → „Clear site data“ (inkl. Service Worker), Seite neu laden; Stein erscheint bis zum Titel. Verbindungsabbruch: Network → Offline vor dem Neuladen schalten oder während des Installs. (b) Mission: Cache Storage → `hc-on-demand` löschen, Mission starten → Ladebildschirm → Kampf. Mit DevTools „Offline“ und gelöschtem Cache: Satz + „Erneut versuchen“; wieder online → startet von selbst. Zweiter Start derselben Mission: kein Ladebildschirm.

### References

- [Source: concept/26-epics/epics/epic-07.md#Story 7.6]
- [Source: concept/25-ux/EXPERIENCE.md (Ladebildschirm)]
- [Source: concept/25-ux/.decision-log.md, 2026-10-24 „Laden sichtbar machen“]
- [Source: concept/24-architecture/decision-log.md, 2026-10-24 „Große Bilder bei Bedarf laden“]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm lint`, `pnpm test`, `pnpm content:check` und `pnpm build` grün. Browser-Prüfung und E2E stehen aus (zentral).

### Completion Notes List

- Mit 7.2 (Akt-Pakete) kann `ensureMissionAssets` die Paketdateien in dieselbe Liste aufnehmen.
- `precache-info.json` zählt den Precache ohne die zuletzt ergänzten Einträge (196 von 203 beim Bau); der Balken kann daher kurz vor Schluss voll sein.

### File List

- src/app/loading/plan.ts, plan.test.ts
- src/app/state/loading.ts, prepare.ts, flow.ts, screen.ts
- src/app/screens/Loading.tsx, Loading.css, Camp.tsx
- src/app/App.tsx, update.ts, src/main.tsx
- src/core/defs.ts, src/content/schemas.ts
- content/core/locales/de.yaml, en.yaml
- vite.config.ts
- concept/24-architecture/decision-log.md, concept/25-ux/.decision-log.md
