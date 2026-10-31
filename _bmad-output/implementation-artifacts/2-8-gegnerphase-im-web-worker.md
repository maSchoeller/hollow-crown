# Story 2.8: Gegnerphase im Web Worker

Status: done

## Story

Als Spieler
möchte ich, dass das Spiel in der Gegnerphase großer Schlachten flüssig bleibt,
damit es sich auf dem Handy nie hakelig anfühlt.

## Acceptance Criteria

1. **Worker:** `src/worker/core.worker.ts` rechnet, wenn der Spieler die Phase beendet, `applyCommand(state, endPhase)` mit denselben Content-Daten wie die App und gibt `{ state, events }` zurück (Protokoll Architektur §5.13). Fehlt `Worker`, läuft dieselbe Funktion synchron.
2. **Replay-Gleichheit:** Ein Test zeigt: Replay (Startzustand + Command-Log) mit und ohne Worker ergibt denselben Zustand.
3. **Benchmark:** `pnpm bench:ai` misst in CI die Gegnerphase der größten vorhandenen Karte und scheitert über 300 ms je Gegnereinheit (NFR3).
4. **Schichtregeln:** Die ESLint-Schichtregeln kennen `src/worker` (nur `core` und `content`).

Was die KI entscheidet, ändert sich nicht, nur wo sie rechnet. Kampfregeln und Gegnertypen (Story 2.9 u. a.) baut parallel eine andere Session: `src/core` hier nur lesen.

## Tasks / Subtasks

- [x] T1 Protokoll und Worker (AC 1)
  - [x] `src/worker/protocol.ts` (neu): `WorkerRequest` / `WorkerResponse` nach Architektur §5.13 (Frage 1 zu `packs`)
  - [x] `src/worker/core.worker.ts` (neu): `onmessage`, Content laden und registrieren, `applyCommand(data, state, command)`, Antwort `{ id, ok: true, state, events }` bzw. `{ id, ok: false, error }`
  - [x] Eine reine Funktion `handleRequest(data, req): WorkerResponse`, die Worker und synchroner Fallback gemeinsam nutzen (Architektur §8.5: neue Anfrageart = Typ in `WorkerRequest` + synchroner Fallback)
- [x] T2 Client in der App (AC 1)
  - [x] `src/app/coreWorker.ts` (neu): ein Worker je Sitzung (lazy), eine Anfrage gleichzeitig, `id`-Zähler, asynchrone `apply`-Funktion; Fallback synchron, wenn `typeof Worker === 'undefined'`
  - [x] `src/app/state/battle.ts`: `command()` bleibt für Spielerzüge synchron; für `endPhase` ein asynchroner Weg, der Zustand, Log und Autosave erst nach der Antwort setzt
  - [x] `src/app/screens/Battle.tsx` (`run`, ca. Z. 266–300): `endPhase` über den asynchronen Weg, `busy` bleibt während der Rechnung gesetzt
  - [x] Fehlerfall (Fragen 4, 5)
- [x] T3 Content im Worker (AC 1): Core über `loadContent()`, Akt-Pakete über `registerPackContent` (Frage 1); Worker-Chunk über Vite (`new Worker(new URL(...), { type: 'module' })`); Bundle-Budget in `pnpm build` messen (Frage 8)
- [x] T4 Replay-Gleichheitstest `tests/unit/worker-replay.test.ts` (AC 2; Frage 3)
- [x] T5 `tools/bench-ai.ts`, Skript `bench:ai` in `package.json`, Schritt in `.github/workflows/ci.yml` (AC 3; Fragen 2, 7)
- [x] T6 `eslint.config.js`: `layer('worker', …)` (AC 4; Frage 6)
- [x] T7 Eintrag in `concept/24-architecture/decision-log.md`; `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün, `pnpm bench:ai` lokal gemessen und in den Completion Notes festgehalten

## Dev Notes

### Quellen

- Architektur §5.13 (KI im Web Worker), §8.5 (Arbeit im Worker), Schichtliste „`worker ← core, content`“, AR14, ADR-5; NFR1 (60 FPS, jetzt Story 7.7), NFR3 (300 ms je Gegnereinheit); `concept/10-tech-architecture.md` (Performance-Budget: „Web Worker, falls nötig“; AR14 macht daraus „von Anfang an“, Produktinhaber 2026-10-23, `concept/24-architecture/decision-log.md`).
- Epics: `concept/26-epics/epics/epic-02.md` Story 2.8, AR14, NFR3.

### Ist-Zustand des Codes (gelesen)

- `src/core/battle/apply.ts`: `applyCommand(data: GameData, prev: BattleState, cmd: Command): ApplyResult` mit `ApplyResult = { state, events }`. Er klont den Zustand und wirft `CoreInvariantError('invalid_command', …)` bei ungültigem Command. `endPhase` ruft `endPlayerPhase`: Ende der Spielerphase, danach `runAiPhase` für `enemy` und (falls Einheiten da sind) `other`, dann neue Runde. Die ganze Gegner- und Dritte-Partei-Phase steckt also in **einem** `applyCommand`; der Worker übernimmt nur diesen Aufruf.
- `src/core/ai/ai.ts` (`runAiPhase`), `autoplay.ts`: rein, deterministisch, Zufall aus `s.rng`; keine Änderung. `autoCommand` (Simulator, E2E-Hooks) bleibt synchron.
- `src/app/state/battle.ts`: `command(cmd)` ist synchron: `guarded(() => applyCommand(data, b.state, cmd), null)`, dann `battle.value = { ...b, state, log: [...b.log, cmd] }` und `autosave('battle')`. Das Log enthält heute schon `endPhase` (`src/core/campaign/restart.ts` sucht `lastIndexOf('endPhase')`).
- `src/app/screens/Battle.tsx`: `run(cmd)` ist schon `async`: `setBusy(true)`, bei `endPhase` `setPhaseView({ phase: 'enemy' })`, dann synchron `events = command(cmd)` in `try/catch`, danach `board.play(events, battle.value!.state)`. Automatisches Phasenende: `setTimeout(() => void run({ type: 'endPhase' }), 350)`; Knopf/Taste `endPhase()` ca. Z. 525.
- Weitere Aufrufer von `command()`: `src/app/state/flow.ts` (E2E-Hooks `autoStep`, Schleife bis 3000 Commands, Fehlerfall-Hook mit ungültigem `move`). Sie bleiben synchron.
- `src/core/campaign/restart.ts`: `replayBattle(data, start, commands)` (Startzustand + Log → Zustand): Basis des Gleichheitstests.
- `src/app/state/fault.ts`: `guarded` macht aus `CoreInvariantError` den Fault-Bildschirm; der Zustand bleibt unverändert.
- Content: `src/content/browser.ts` hält `loadContent()` (Core aus `virtual:hc-pack/core`, Modul-Cache) und `registerPackContent(id, files)` (mischt Pakete in dieselben `data`-Objekte, idempotent per `isPackRegistered`). `src/packs/load.ts` (`loadPack(id)`) holt `loaders[id]` aus `virtual:hc-packs`; dessen Kopfkommentar sieht den Worker schon vor („importiert dasselbe Modul und ruft `registerPackContent`“). Node/Tests: `loadContentFromDisk()` (`src/content/node.ts`).
- Nicht vorhanden: `src/worker/`, `src/app/coreWorker.ts`, `tools/bench-ai.ts`, Skript `bench:ai`; `new Worker` kommt im Repo nirgends vor.
- `eslint.config.js`: `layer()` nur für `core`, `content`, `render`, `ui`. Kein Eintrag für `worker` oder `packs`, obwohl Architektur §3 beide verlangt.
- `vite.config.ts`: kein Worker-Eintrag; `--mode perf` baut zusätzlich `tests/perf/bench.html` (Story 7.5). `tools/check-bundle-size.mjs` erwähnt im Kopfkommentar „plus Worker-Dateien“.
- `.github/workflows/ci.yml`: Jobs `check` (lint, content:check, `test:coverage`, `sim prologue_caravan --runs 5`), `e2e`, `perf` (nur Warnung). Kein `bench:ai`.

### Serialisierung des Zustands

- `BattleState` und `GameEvent[]` sind Plain-JSON (AGENTS.md). Hauptthread ↔ Worker per `postMessage` (structured clone), kein JSON-String. Der Worker gibt einen neuen Zustand zurück (`applyCommand` klont intern); der Hauptthread ersetzt `battle.value.state` und hängt `endPhase` ans Log, wie bisher (§5.13: Log enthält weiter nur Spieler-Commands).
- Test, dass `structuredClone(state)` den Zustand unverändert lässt (keine Funktionen, `Map`, `Set`, Klasseninstanzen).
- `CoreInvariantError` übersteht structured clone nicht als Instanz; `WorkerResponse` trägt laut §5.13 `error: string`. Der Client muss daraus einen Fehler bauen, den der Fault-Bildschirm kennt (`code`/`details` in `src/core/errors.ts`).

### Content im Worker

- Der Worker baut sein eigenes `GameData` aus `loadContent()` (Core ist im Bundle). Karten außerhalb von `core` (z. B. `act1`) liegen erst nach `registerPackContent` in `data.maps`; ohne sie findet `applyCommand` die Karte des Zustands nicht. Die Dateien eines Pakets kommen im Worker über denselben Weg wie im Hauptthread (Service Worker / Cache) – ob der Service Worker Anfragen eines Dedicated Workers bedient, ist beim Bau zu prüfen, nicht angenommen.
- Eine Anfrage darf erst beantwortet werden, wenn die Pakete der Anfrage registriert sind.
- Die Bench-Karte `tests/perf/benchMap.ts` wird zur Laufzeit in `data.maps` gesteckt und ist für einen Worker unsichtbar; `tests/perf/bench.ts` ruft `applyCommand` direkt und bleibt unverändert.

### Replay-Gleichheitstest (AC 2)

`tests/unit/worker-replay.test.ts`: Eine Schlacht (z. B. `autoplay`-Log einer Content-Karte mit festem Seed) wird einmal mit `replayBattle` und einmal so abgespielt, dass jedes `endPhase` über `handleRequest` mit `structuredClone` in beide Richtungen läuft. Verglichen werden Endzustand und Event-Folge (`toEqual`). Vitest läuft in Node (`environment: 'node'`), also ohne echten `Worker`; ob zusätzlich ein Lauf im Browser nötig ist: Frage 3.

### Benchmark `pnpm bench:ai` (AC 3)

- Architektur §5.13: „misst die Gegnerphase der größten Schlacht in Node; Budget 300 ms je Gegnereinheit“; Dateiname laut Architektur-Tabelle (§8) `tools/bench-ai.ts`; Aufruf wie `tools/simulate.ts` über `tsx`.
- Gemessen wird `applyCommand(data, s, { type: 'endPhase' })` (Zeit per `performance.now()` in `tools/`, nie in `src/core`), geteilt durch die Zahl der handelnden Gegnereinheiten.
- Karten im Repo: Content `content/acts/act1/maps/`: `prologue_caravan` (12×12, 7 Gegner-Einträge), `ch01_varnhold` (16×16, 13), `ch02_silverbrook` (18×18, 17). Die Referenzschlacht aus Story 7.5, `tests/perf/benchMap.ts` (24×32, 28 Gegner, 12 Spieler), ist größer, liegt aber ausdrücklich nicht im Content. Frage 2.

### CI-Einbindung

Neuer Schritt `pnpm bench:ai` in `.github/workflows/ci.yml` (Job `check` oder eigener Job; nicht festgelegt). Blockierend oder nur Warnung: Frage 7.

### Schichtregeln (AC 4)

`eslint.config.js`: `layer('worker', …)` nach dem Muster der vorhandenen Einträge, gesperrt: `render`, `ui`, `app`, `persistence`, `i18n`, `packs` (Architektur §3: `worker ← core, content`) sowie Babylon/Preact; ob `packs` gesperrt wird, hängt an Frage 1, weil `src/packs/load.ts` und der Kopfkommentar den Worker als Nutzer vorsehen. `src/core` unverändert.

### Dateien

Neu: `src/worker/protocol.ts`, `src/worker/core.worker.ts`, `src/app/coreWorker.ts`, `tests/unit/worker-replay.test.ts`, `tools/bench-ai.ts`.
Geändert: `src/app/state/battle.ts`, `src/app/screens/Battle.tsx`, `eslint.config.js`, `package.json`, `.github/workflows/ci.yml`, `concept/24-architecture/decision-log.md`; nur falls nötig `vite.config.ts` (Worker-Bundle), `tools/check-bundle-size.mjs`.
Nicht anfassen: Kampfregeln und Gegnertypen in `src/core/**` und `content/**` (andere Session); falls `src/core/index.ts` einen Export für `handleRequest` fehlt, nur den Export ergänzen und Konflikte mit der parallelen Session beachten.

### Testen

- Vitest: Replay-Gleichheit, Round-Trip mit `structuredClone`, Fehlerantwort bei ungültigem Command.
- `pnpm bench:ai` lokal; Messwerte in die Completion Notes.
- `pnpm test:e2e` (Chromium, echter Worker) bleibt grün; E2E-Hooks in `flow.ts` bleiben synchron.
- `pnpm perf` (Story 7.5) bleibt; die Bildrate (NFR1) gehört zu Story 7.7, nicht hierher: Der Worker nimmt Rechenzeit vom Hauptthread, das Rendern bleibt dort.

### Erkenntnisse aus Vorgängern

- Story 7.5: Referenzschlacht und Messung stehen; NFR1 war mit 10–13 FPS verfehlt, Ursache nicht untersucht (Story 7.7). 2.8 darf NFR1 nicht als erfüllt melden.
- Story 2.3: Vorschau und Auflösung nutzen dieselbe Formel; hier analog Worker und Fallback über dieselbe Funktion `handleRequest`. Tests mit Fixtures statt PoC-Daten, wo es geht.
- Letzte Commits (PR #34–#36): Update-Ladeanzeige, Precache mit Revisionen. Ein neuer Worker-Chunk muss im Precache und im Update-Fluss mitlaufen (Frage 8).

### Project Context Rules (AGENTS.md)

Branch statt `main`, Merge per PR; Code/Bezeichner/Commits Englisch, Konzept Deutsch; Zufall nur aus dem Seed-RNG im State; Spielwerte nur in YAML; `src/core` ohne DOM, Babylon, Preact, `Math.random`, `Date.now`; `src/app/state/` ein Modul je Verantwortung, kein Barrel; Entscheidungen ins zuständige Artefakt (hier `concept/24-architecture/decision-log.md`); fertig bei grünem `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`.

## Offene Fragen für den Produktinhaber

Alle neun Fragen sind geklärt (Produktinhaber bzw. Auftraggeber, 2026-10-24); die Antworten stehen unter „Completion Notes“. Der ursprüngliche Wortlaut bleibt zur Nachvollziehbarkeit stehen.

1. **`packs` im Request und Content im Worker.** Architektur §5.13: `WorkerRequest = { id; kind: 'apply'; packs: PackId[]; state; command }`, und `worker ← core, content` (nicht `packs`). Ist-Code: `applyCommand` nimmt `GameData`, keine Paket-IDs; Akt-Pakete registriert `src/packs/load.ts` über `virtual:hc-packs`, `registerPackContent` liegt in `src/content/browser.ts`. Ein Worker, der Akt-Pakete lädt, braucht also entweder `src/packs` (verstößt gegen die Schichtliste) oder einen Loader an anderer Stelle. Optionen: (a) `packs` im Request lassen, Loader-Zugriff so legen, dass `worker` nur `content` braucht; (b) Worker registriert immer alle veröffentlichten Pakete, `packs` entfällt (Protokoll ändert sich); (c) Karteninhalt mitschicken. Einschätzung: (a) folgt der Architektur, braucht aber eine Entscheidung, wo `loaders` liegt; (b) ist am einfachsten; ich würde (a) bevorzugen.
2. **Welche Karte ist die „größte vorhandene“?** Content: `ch02_silverbrook` (18×18). Referenzschlacht: `tests/perf/benchMap.ts` (24×32, 40 Einheiten, nicht im Content). Offen auch: nur der Ausgangszustand oder ein Zustand mit Kontakt, und Mittelwert, Maximum oder Perzentil. Einschätzung: Bench-Karte als Budgetmaß (NFR1/NFR3 meinen die große Schlacht), `ch02_silverbrook` zusätzlich; Auswertung Maximum über mehrere Läufe nach Warm-up.
3. **Replay-Test nur in Node oder auch mit echtem Worker?** AC 2 sagt „mit und ohne Worker“; Vitest hat keinen Browser-`Worker`. Einschätzung: Protokollweg in Vitest (Pflicht) plus ein kleiner Playwright-Lauf mit echtem Worker; ob der zweite Teil gewünscht ist, ist offen.
4. **Worker-Absturz oder Fehlerantwort.** Fault-Bildschirm wie bei Kernfehlern, oder bei Absturz/Ladefehler stiller Rückfall auf synchron (gleicher `endPhase` im Hauptthread, Logeintrag `area: 'worker'`)? Einschätzung: `ok: false` (Regelverletzung) zeigt den Fault-Bildschirm; Absturz fällt auf synchron zurück, weil Zustand unverändert und Rechnung deterministisch ist.
5. **[geklärt]** **Laufende Anfrage beim Verlassen der Schlacht** (Neustart, Aufgeben, Weltkarte, Unmount). Antwort verwerfen oder abwarten? Einschätzung: Antwort verwerfen, über Anfrage-`id` bzw. Schlacht-Kennung absichern, damit weder Zustand noch Autosave einer neuen Schlacht überschrieben werden; ob der Worker dabei beendet wird, ist offen.
6. **[geklärt]** **`packs`-Schichtregel jetzt mit anlegen?** Architektur §3 nennt `worker` und `packs`, AC 4 nur `worker`. Einschätzung: nur `worker` in dieser Story, `packs` getrennt (ob `src/packs` die Regel heute erfüllt, ist nicht geprüft).
7. **[geklärt]** **Soll `bench:ai` CI blockieren?** AC 3 „scheitert“ spricht für Exit-Code ≠ 0; Story 7.5 hat dagegen nur gewarnt (`PERF_STRICT`). CI-Läufer und Handy sind nicht vergleichbar, das Budget (300 ms) gilt auf dem Handy. Einschätzung: blockierend gemäß AC; Toleranzfaktor oder Warnung nur auf ausdrücklichen Wunsch.
8. **[geklärt]** **Worker-Chunk im Bundle und Update.** Ob der Worker den Core-Content ein zweites Mal enthält und wie das das 15-MB-Budget (`check-bundle-size.mjs`) belastet, ist ungemessen; ebenso, wie ein neuer Worker beim App-Update gegen einen alten Hauptthread versioniert wird. Einschätzung: nach dem ersten Build messen und berichten, nicht vorab entscheiden.
9. **[geklärt]** **Reihenfolge Autosave.** Soll `autosave('battle')` beim asynchronen `endPhase` nach der Antwort laufen (Einschätzung: ja, wie bisher direkt nach dem Zustandswechsel)? Die Quellen sagen nichts dazu.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5 (claude-sonnet-5-5), Entwickler-Agent

### Debug Log References

- Erster E2E-Lauf von `worker.spec.ts` lief in den 60 s in einen Timeout (Rechner durch einen parallelen `pnpm perf` belastet); ohne Änderung am Code im zweiten Lauf grün, Timeout danach auf 90 s gesetzt.
- Der erste vollständige `pnpm test:e2e` zeigte im Projekt `pixel7` einen Fehlschlag von `smoke.spec.ts` (Runde 1 blieb stehen): `commandOffThread` verglich zuerst das Sitzungsobjekt `battle.value`; `flow.runEffects` ersetzt es aber (Dialog-Wirkungen eingereiht), und das kann kurz nach dem Überspringen des Tutorials in die laufende Anfrage fallen, die Antwort wurde fälschlich verworfen. Jetzt gilt der Zustand (`battle.value.state`) als Kennung, geschrieben wird in das aktuelle Sitzungsobjekt.
- Vitest-Läufe unter Last (paralleles `pnpm perf`) scheiterten an den Standard-Timeouts der `beforeAll`-Hooks (`loadContentFromDisk`); mit `--testTimeout=90000 --hookTimeout=90000` alle 388 Tests grün.

### Completion Notes List

**Geklärte Fragen (Produktinhaber bzw. Auftraggeber, 2026-10-24), so umgesetzt:**

1. `packs` bleibt im Request (§5.13). Der Worker importiert nur `core` und `content`: Content über `loadContent()` und `registerPackContent` aus `src/content/browser.ts`, Pakete über `loaders` aus dem virtuellen Modul `virtual:hc-packs` (so wie `src/packs/load.ts`), ohne `src/packs`. Es war kein Schichtbruch nötig. Die App schickt als `packs` die geladenen Nicht-Kern-Pakete ohne Sprachpakete (`coreWorker.ts`, `loadedPacks()`).
2. `pnpm bench:ai` misst `applyCommand(endPhase)` auf der Referenzschlacht `tests/perf/benchMap.ts` (24×32) als Budget und `ch02_silverbrook` zusätzlich im Bericht; mehrere Läufe (10) nach Warm-up (3), je Lauf bis zu 6 Runden mit untätigem Spieler (die Gegner laufen heran und greifen an), Maximum je Gegnereinheit gegen 300 ms. Grenzwert `TARGETS.aiMsPerUnit` in `tests/perf/profile.ts`, wo 7.5 seine Ziele hat.
3. Replay-Gleichheit in Vitest über den Protokollweg mit `structuredClone` in beide Richtungen (`tests/unit/worker-replay.test.ts`: `handleRequest`, und das echte Worker-Modul mit dem echten Client über einen Ersatz-`Worker`); zusätzlich E2E `tests/e2e/worker.spec.ts` (Playwright, echter Worker; nur Projekt `desktop`): zeigt per `page.on('worker')`, dass `core.worker` läuft, und dass der Zustand nach der ersten Gegnerphase (fester Seed) mit und ohne `Worker` identisch ist.
4. Absturz (`error`, `messageerror`, Start-Fehler, Zeitüberschreitung 30 s) oder `ok: false` ohne `code` (Worker-Fehler, z. B. Paket lädt nicht): dieselbe Anfrage rechnet synchron auf dem Hauptthread, der Worker wird beendet, die Sitzung bleibt auf dem Hauptthread (`log.warn('worker', …)`). `ok: false` mit `code` (Regelverletzung): `CoreInvariantError` mit `code`/`details`, Fehlerbildschirm aus Story 1.7 über `reportFault`, der Zustand bleibt unverändert.
5. Verlässt der Spieler die Schlacht während einer Anfrage, wird die Antwort verworfen: `commandOffThread` prüft nach der Antwort, ob `battle.value.state` noch der Zustand ist, aus dem gerechnet wurde (Neustart, neue Schlacht, Weltkarte, Laden ersetzen ihn); Änderungen, die den Zustand behalten (eingereihte Dialog-Wirkungen, `flow.runEffects` ersetzt das Sitzungsobjekt), verwerfen die Antwort nicht. Nichts wird gesetzt und kein Autosave geschrieben; `Battle.tsx` setzt `busy` und die Phasenanzeige zurück. Der Worker wird nicht beendet. Die Antwort wird im Client zusätzlich über die Anfrage-`id` zugeordnet.
6. Nur `layer('worker', …)` in `eslint.config.js` (gesperrt: `render`, `ui`, `app`, `input`, `persistence`, `i18n`, `platform`, `packs`, Babylon, Preact); keine `packs`-Schicht. Eine Probe mit Importen aus `../app` und `../packs` schlug erwartungsgemäß an.
7. `pnpm bench:ai` beendet mit Exit-Code 1 über dem Budget; eigener blockierender Schritt im Job `check` von `.github/workflows/ci.yml`.
8. Worker-Chunk gemessen (siehe unten); `pnpm build` hält das Bundle-Budget; der Chunk liegt im Precache.
9. Autosave erst nach der Worker-Antwort (`commandOffThread`).

**Schnittstellen und Entscheidungen in der Umsetzung:**

- `src/worker/protocol.ts` (`WorkerRequest`, `WorkerResponse`), `src/worker/handle.ts` (`handleRequest(data, req)`, die eine Funktion hinter Worker und Rückfall; ruft `applyCommand(data, state, cmd)`), `src/worker/core.worker.ts`, Client `src/app/coreWorker.ts` (`applyCommandInWorker(data, state, command)`, `WORKER_TIMEOUT_MS`). `PackId` gibt es im Code nicht, `packs` ist `string[]`.
- Abweichung vom Wortlaut in §5.13: `WorkerResponse` mit `ok: false` trägt optional `code` und `details` neben `error: string`, damit der Client einen `CoreInvariantError` bauen kann, den der Fehlerbildschirm kennt (Story-Hinweis „Serialisierung“).
- Die Zeitüberschreitung (30 s) ist ein technischer Wert in `coreWorker.ts`, kein Spielwert; sie fängt nur einen hängenden Worker.
- `src/app/state/battle.ts`: neu `commandOffThread(cmd)`; `command()` bleibt synchron (Spielerzüge, E2E-Hooks, Simulator). `Battle.tsx` nutzt den Worker nur für `endPhase`.
- Kein Eingriff in `src/core/**`: jeder `endPhase` läuft weiter über `applyCommand(data, state, cmd)`, der Worker ruft ihn nur auf. `src/core/index.ts` blieb unverändert.
- `vite.config.ts`: `worker: { format: 'es', plugins }`; der Worker bekommt nur die virtuellen Paket-Module (eigene Instanz von `packsPlugin()`, ohne dessen `closeBundle`, das `packs.json` schreibt) und das YAML-Plugin.
- `tests/perf/benchMap.ts` und `tests/perf/bench.ts` unverändert.

**bench:ai-Messwerte** (Node 22, Windows, 10 Läufe nach 3 Warm-up, bis 6 Runden je Lauf):

| Lauf | Karte | Gegner | Phasen | max ms/Einheit | Ø ms/Einheit | max ms/Phase |
|---|---|---|---|---|---|---|
| ruhiger Rechner | `perf_bench_large` 24×32 | 28 | 60 | 19,48 | 11,43 | 545 |
| ruhiger Rechner | `ch02_silverbrook` 18×18 | 11 | 32 | 7,51 | 4,35 | 68 |
| Rechner belastet (paralleles `pnpm perf`) | `perf_bench_large` | 28 | 60 | 65,87 | 20,24 | 1845 |
| Rechner belastet | `ch02_silverbrook` | 11 | 32 | 43,89 | 11,38 | 395 |

Budget 300 ms je Gegnereinheit: eingehalten, auch belastet mit großem Abstand. (Das Budget gilt auf dem Handy; die Messung auf dem CI-Läufer ist nur ein Regressionsanzeiger.)

**Worker-Bundle (Frage 8):**

- `dist/assets/core.worker-C6shAsRR.js`: 296 655 Bytes, gzip 86 907 Bytes (Core-Regeln und Core-Content ein zweites Mal; der Hauptchunk `index-*.js` enthält sie ebenfalls). Das ist die Mehrbelastung des ersten Downloads (rund 0,08 MB Transfer); `check-bundle-size`: erster Download 9,49 MB (Budget 15 MB, Ziel 12 MB), Precache 266 Dateien.
- Das Akt-Paket wird nicht doppelt gebaut: Haupt-App und Worker importieren dieselbe Datei `assets/act1-BJW0hLTB.js` (gleicher Inhalt, gleicher Name, 28 KB, in `packs.json` unter `act1`, nicht im Precache). Das beruht darauf, dass beide Bündel denselben Chunk gleich benennen; würde ein Worker-Bündel künftig einen abweichend benannten Pack-Chunk erzeugen, ordnete `packs-plugin.ts` ihn mangels Eintrag in `chunkPack` dem Paket `core` zu (Precache). Ein Test dafür gibt es nicht.
- Precache: `sw.js` enthält `{url:"assets/core.worker-C6shAsRR.js",revision:null}`; der Name trägt den Inhalts-Hash (`CONTENT_HASHED` greift), ein Update holt also einen neuen Worker unter neuem Namen. Ein alter Hauptthread, der nach der Aktivierung des neuen Service Workers erst spät seinen Worker startet, bekäme den alten Namen nicht mehr aus dem Precache; dann greift der Rückfall (`error` → synchron). Pakete lädt der Worker über dieselben `assets/`-Routen wie der Hauptthread (Laufzeit-Cache). Offline im Browser nicht gesondert geprüft.

**Prüfungen:** `pnpm lint` grün; `pnpm content:check` grün; `pnpm build` grün (erster Download 9,49 MB von 15 MB); `pnpm bench:ai` grün (22,8 ms je Einheit auf der Referenzschlacht); `pnpm test`: 388 von 388 grün, aber nur mit `--testTimeout=90000 --hookTimeout=90000`, solange der Rechner durch einen parallelen `pnpm perf` ausgelastet war (mit den Standard-Timeouts scheiterten wechselnde 5–11 Tests mit „timed out in 5000ms“, auch Dateien ohne Bezug zu dieser Story); `pnpm test:e2e`: 13 grün, 3 übersprungen (`worker.spec.ts` läuft nur im Projekt `desktop`) im dritten Lauf auf ruhigem Rechner; unter Last scheiterten zuvor wechselnde Smoke-Tests an Klick-Timeouts (pixel7 "Preparing the game" / Gegnerphase, ipad und desktop Autosave), einzeln wiederholt grün.

### File List

Neu:
- `src/worker/protocol.ts`
- `src/worker/handle.ts`
- `src/worker/core.worker.ts`
- `src/app/coreWorker.ts`
- `tests/unit/worker-replay.test.ts`
- `tests/e2e/worker.spec.ts`
- `tools/bench-ai.ts`

Geändert:
- `src/app/state/battle.ts` (`commandOffThread`)
- `src/app/screens/Battle.tsx` (`run`: `endPhase` über `commandOffThread`)
- `eslint.config.js` (`layer('worker', …)`)
- `vite.config.ts` (`worker.format`, `worker.plugins`)
- `package.json` (Skript `bench:ai`)
- `.github/workflows/ci.yml` (Schritt `bench:ai`)
- `tests/perf/profile.ts` (`TARGETS.aiMsPerUnit`)
- `concept/24-architecture/decision-log.md` (Eintrag Story 2.8)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Zeile 2-8 auf `review`)
- `_bmad-output/implementation-artifacts/2-8-gegnerphase-im-web-worker.md` (diese Datei)
