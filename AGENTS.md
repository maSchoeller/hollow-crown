<!-- bmad:context -->
<!-- Verified 2026-10-23 against 5783340. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## Hollow Crown

Mobile-first Taktik-RPG (Fire Emblem trifft Battle Brothers) für den Browser (PWA, Hochformat), später als App über Capacitor. TypeScript, Vite, Babylon.js, Preact. Spielbar ist der Proof of Concept (Prolog, Kap. 1–2); geplant wird Staffel 1 mit BMAD (Modul gds), alle Planungsartefakte liegen in `concept/`.

## Policy

- Nie auf `main` committen oder pushen, nie force-pushen; auf einem Branch arbeiten, Merge nur per Pull Request.
- Neue Entscheidungen ins zuständige BMAD-Artefakt unter `concept/` und dessen `.decision-log.md` eintragen, nie in `concept/01-decisions.md` – das ist seit 2026-10-23 eingefroren.
- Offene Punkte (O1–O5 in `01-decisions.md`, „Offene Fragen“ im Game Brief) nicht stillschweigend entscheiden; nachfragen.
- KI-Assets nur nach den Auflagen in `concept/23-art-direction/licensing.md` §6 erzeugen und ausliefern (GA26 ist seit 2026-10-24 geklärt).

## Wo was liegt

Die Dokumente unten sind lang. Von ihnen die Gliederung lesen (`grep -n '^#' <datei>`) und dann nur die betroffenen Abschnitte, nie das ganze Dokument „zur Sicherheit“.

- Vor Planungs- oder Feature-Arbeit `concept/20-game-brief/brief.md` lesen, vor Arbeit an Spielregeln zusätzlich `concept/21-gdd/gdd.md`. Vor Arbeit an Story, Figuren, Dialogen oder Missionsinhalten `concept/22-narrative/narrative.md`. Wo diese schweigen, gilt `concept/01-decisions.md`; widerspricht ein BMAD-Artefakt dem Protokoll, gilt das Artefakt.
- Vor Arbeit an Grafik, Figuren, Karten-Look, Effekten oder Audio-Richtung `concept/23-art-direction/art-direction.md` lesen; Pipeline und Formate in `16-asset-pipeline.md`, Audio-Technik in `17-audio.md`, Asset-Formate in `art/README.md`. Zeichenstil ist runder Chibi (B8), Brettfiguren entstehen per Bild-zu-3D mit Tripo (§4.6).
- Vor Arbeit an Oberfläche, HUD, Menüs oder Screens `concept/25-ux/DESIGN.md` und `EXPERIENCE.md` lesen (Mockups in `concept/25-ux/mockups/`); Beträge immer als Symbol + Zahl.
- Vor technischer Arbeit `concept/24-architecture/architecture.md` lesen (Delta zu `concept/10-tech-architecture.md`, das gilt, wo das Delta schweigt): Kampagnen-Commands, Bedingungen/Wirkungen, Akt-Pakete, Speicherformat 2, Muster in §8. Spielwerte in `content/core/balance.yaml` (Akt-Inhalte in `content/acts/act1/`), Startwerte in `concept/data-samples/`.
- Epics und Stories: `concept/26-epics/epics/`, je Epic eine Datei `epic-NN.md`, Übersicht in `index.md`, Anforderungen in `requirements.md` (Quelle für `gds-sprint-planning` und `gds-create-story`; nur das Epic lesen, an dem gearbeitet wird). HTML-Ansicht mit `python tools/docs/epics_html.py concept/26-epics/epics concept/26-epics/html/epics.html` neu erzeugen. Story-Dateien und Sprint-Status: `_bmad-output/implementation-artifacts/`.
- Abgelöste Dokumente liegen in `concept/archive/`, nur für die Herleitung öffnen. Decision-Logs nur lesen, wenn eine Entscheidung nachzuvollziehen ist.

## Ausführen und prüfen

- Fertig ist eine Aufgabe erst, wenn `pnpm lint` (inkl. Typecheck), `pnpm test`, `pnpm content:check` und `pnpm build` grün sind; `build` bricht auch bei überschrittenem Bundle-Budget ab. `pnpm check` führt alle vier mit knapper Ausgabe nacheinander aus.
- Balancing mit `pnpm sim <mapId> --runs 50` prüfen (weitere Optionen `--seed`, `--difficulty`, `--death` im Kopf von `tools/simulate.ts`).
- Gemeldete Fehlerberichte (Optionen → „Fehler melden“) mit `pnpm report <datei>` lesen: Aktionsprotokoll als Zeilen plus Replay-Prüfung bis zur ersten Abweichung (Architektur §6.2a).
- `pnpm art:build` braucht Python 3.12+ mit den Paketen aus `pip install -r tools/art/requirements.txt` (Pillow, numpy, PyYAML).
- Node ≥ 22, pnpm 10 (`packageManager` in `package.json`).

## Akt-Release

1. Paket in `content/packs.yaml` auf `released: true` (nur veröffentlichte Pakete kommen in den Build).
2. `pnpm content:lock` sperrt alle IDs der veröffentlichten Pakete in `content/released-ids.json`. Danach scheitert `content:check`, wenn eine gesperrte ID fehlt; umbenennen nur mit Eintrag `alt: neu` in `content/renames.yaml`.
3. Ändert sich das Speicherformat oder eine gesperrte ID, braucht es eine Migration in `src/persistence/save.ts` (`migrations`, Umbenennungen über `renamedId`) und einen Fixture-Spielstand `tests/fixtures/saves/format<n>-*.json` aus dem vorigen Release; `tests/unit/migrations.test.ts` verlangt beides.
4. Alle Prüfungen grün, Pull Request gegen `main`; nach dem Merge bekommen Spieler die Update-Abfrage.

Während der Entwicklung nicht sperren: `released-ids.json` entsteht erst beim ersten echten Release (MVP).

## Konventionen

- `src/core` hält Regeln als Commands und Events, der State ist Plain-JSON und serialisierbar; Babylon, Preact, DOM, `Math.random` und `Date.now` sperrt ESLint dort bereits.
- Jeder Zufall kommt aus dem Seed-RNG im State; Replays (Startzustand + Command-Log) müssen identische Ergebnisse liefern.
- Spielwerte nie im Code, sondern in `content/core/balance.yaml` bzw. den Content-YAMLs.
- Karten, Items, Klassen, Skills und Dialoge als YAML mit Zod-Schema anlegen, nicht im Code.
- Kein sichtbarer Text im Code; Schlüssel in `content/core/locales/de.yaml` und `en.yaml`.
- Die Kampfvorschau ruft denselben Formelcode wie die Auflösung, nie eine Kopie.
- Code, Bezeichner, Commits und Datenschlüssel auf Englisch, Konzeptdokumente auf Deutsch.
- App-Zustand in `src/app/state/`, ein Modul je Verantwortung (`settings`, `screen`, `session`, `battle`, `flow`), nie wieder eine Sammel-Datei und kein Barrel-Re-Export; keine Import-Zyklen zwischen ihnen.
- Styles je Screen in einer eigenen CSS-Datei neben der Komponente; `src/ui/styles.css` ist Altbestand und schrumpft nur (beim Neubau eines Screens dessen Abschnitt dort löschen), Grundregeln in `base.css`.
- Coverage von `src/core` Richtung 90 % heben, nie senken; prüfen mit `pnpm test:coverage`.
- Bilder per ChatGPT über Claude in Chrome erzeugen, Prompt und Abnahme in `art/prompts/<id>.md`. Sound, Musik und Stimmen per ElevenLabs (MCP `elevenlabs` oder `tools/audio/elevenlabs.py`, Key `ELEVENLABS_API_KEY`). 3D per Blender-MCP bzw. `tools/art/blender_*.py`.

## Bekannte Stolperfallen

- PNGs unter `art/` liegen in Git LFS und sind in einem frischen Worktree nur Zeiger-Textdateien; vor dem Ansehen oder `pnpm art:build` erst `git lfs pull` ausführen.
- In einem frischen Worktree kann `node_modules` hinter `package.json` zurückliegen (z. B. fehlt `@babylonjs/materials`); bei „Cannot find package“ erst `pnpm install --frozen-lockfile`.

<!-- /bmad:context -->

## Kontext sparen

Ausgewertet am 2026-10-31 über 14 Tage: 79 % der Tokens fielen in Runden mit mehr als 200k Kontext. Was einmal im Kontext liegt, wird in jeder folgenden Runde neu gelesen.

- Eine Story oder ein Thema je Session. Ab etwa 200k Kontext eine neue Session mit kurzer Übergabe (Branch, Stand, nächster Schritt) starten statt weiterzuarbeiten. Orchestrierende Sessions lassen Sub-Sessions und Subagenten nur kurze Berichte schicken.
- Große Dateien nie ganz lesen: Gliederung oder Symbol per `grep -n`, dann Ausschnitt mit offset/limit. Betrifft vor allem `concept/24-architecture/architecture.md`, `22-narrative/narrative.md`, `21-gdd/gdd.md`, `23-art-direction/`, die Decision-Logs und die Code-Dateien über 25 KB: `src/content/validate.ts`, `schemas.ts`, `src/core/battle/apply.ts`, `src/core/ai/autoplay.ts`, `src/app/screens/Rooms.tsx`, `WorldMap.tsx`, `BattleHud.tsx`, `src/render/home/castle.ts` und `src/render/shared/models.ts`. Spielbrett, Kampfbildschirm und Inhaltsdefinitionen sind nach Themen geteilt (`src/render/board/board*.ts`, `src/app/screens/useBattle*.ts`, `useBoard*.ts`, `battle*.ts`, `src/core/*Defs.ts`); nur das passende Modul lesen. Eine schon gelesene Datei nicht erneut lesen.
- Shell-Ausgaben kurz halten: `pnpm check` statt der Einzelbefehle, bei Fehlern nur den Fehlerausschnitt ansehen (`| tail -n 40`), `git diff --stat` vor dem vollen Diff, `git log --oneline -n 10`. Python-Hilfsskripte geben Zusammenfassungen aus, keine ganzen Dateien.
- Browser: Text mit `get_page_text`, `read_page` oder `find` lesen. Screenshots nur zur Sichtprüfung, mit `scale: 0.5`, und in einem `browser_batch` höchstens einen am Ende. Bei der Bildgenerierung in ChatGPT nicht nach jedem Schritt einen Screenshot machen, sondern auf das Ergebnis warten.
- Deferred Tools in einem einzigen `ToolSearch` mit `select:` laden, und nur die Werkzeuge, die die Aufgabe braucht.
- Breite Suchen über viele Dateien an einen Subagenten (`Explore`) geben, der nur das Ergebnis zurückmeldet.
