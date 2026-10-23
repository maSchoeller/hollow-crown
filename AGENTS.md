<!-- bmad:context -->
<!-- Verified 2026-10-23 against 5783340. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## Hollow Crown

Mobile-first Taktik-RPG (Fire Emblem trifft Battle Brothers) für den Browser (PWA, Hochformat), später als App über Capacitor. TypeScript, Vite, Babylon.js, Preact. Spielbar ist der Proof of Concept (Prolog, Kap. 1–2); geplant wird Staffel 1 mit BMAD (Modul gds), alle Planungsartefakte liegen in `concept/`.

## Policy

- Nie auf `main` committen oder pushen, nie force-pushen; auf einem Branch arbeiten, Merge nur per Pull Request.
- Neue Entscheidungen ins zuständige BMAD-Artefakt unter `concept/` und dessen `.decision-log.md` eintragen, nie in `concept/01-decisions.md` – das ist seit 2026-10-23 eingefroren.
- Offene Punkte (O1–O5 in `01-decisions.md`, „Offene Fragen“ im Game Brief) nicht stillschweigend entscheiden; nachfragen.
- Nichts kommerziell veröffentlichen, solange die Lizenzfrage der KI-Assets (GA26) offen ist.

## Wo was liegt

- Vor Planungs- oder Feature-Arbeit `concept/20-game-brief/brief.md` lesen, vor Arbeit an Spielregeln zusätzlich `concept/21-gdd/gdd.md`. Wo diese schweigen, gilt `concept/01-decisions.md`; widerspricht ein BMAD-Artefakt dem Protokoll, gilt das Artefakt.
- Renderer, UI, Assets, Audio: `concept/15-art-direction.md`, `16-asset-pipeline.md`, `17-audio.md`, Asset-Formate in `art/README.md`. Zeichenstil ist runder Chibi (B8, `art/mockups/style-2026-10/`), nicht mehr Anime.
- Architektur: `concept/10-tech-architecture.md`. Spielwerte in `content/balance.yaml`, Startwerte in `concept/data-samples/`.
- Stories und Sprint-Status (sobald vorhanden): `_bmad-output/implementation-artifacts/`.

## Ausführen und prüfen

- Fertig ist eine Aufgabe erst, wenn `pnpm lint` (inkl. Typecheck), `pnpm test`, `pnpm content:check` und `pnpm build` grün sind; `build` bricht auch bei überschrittenem Bundle-Budget ab.
- Balancing mit `pnpm sim <mapId> --runs 50` prüfen (weitere Optionen `--seed`, `--difficulty`, `--death` im Kopf von `tools/simulate.ts`).
- `pnpm art:build` braucht Python mit Pillow und numpy.
- Node ≥ 22, pnpm 10 (`packageManager` in `package.json`).

## Konventionen

- `src/core` hält Regeln als Commands und Events, der State ist Plain-JSON und serialisierbar; Babylon, Preact, DOM, `Math.random` und `Date.now` sperrt ESLint dort bereits.
- Jeder Zufall kommt aus dem Seed-RNG im State; Replays (Startzustand + Command-Log) müssen identische Ergebnisse liefern.
- Spielwerte nie im Code, sondern in `content/balance.yaml` bzw. den Content-YAMLs.
- Karten, Items, Klassen, Skills und Dialoge als YAML mit Zod-Schema anlegen, nicht im Code.
- Kein sichtbarer Text im Code; Schlüssel in `content/locales/de.yaml` und `en.yaml`.
- Die Kampfvorschau ruft denselben Formelcode wie die Auflösung, nie eine Kopie.
- Code, Bezeichner, Commits und Datenschlüssel auf Englisch, Konzeptdokumente auf Deutsch.
- Coverage von `src/core` Richtung 90 % heben, nie senken; prüfen mit `pnpm test:coverage`.
- Bilder per ChatGPT über Claude in Chrome erzeugen, Prompt und Abnahme in `art/prompts/<id>.md`. Sound, Musik und Stimmen per ElevenLabs (MCP `elevenlabs` oder `tools/audio/elevenlabs.py`, Key `ELEVENLABS_API_KEY`). 3D per Blender-MCP bzw. `tools/art/blender_*.py`.

## Bekannte Stolperfallen

- PNGs unter `art/` liegen in Git LFS und sind in einem frischen Worktree nur Zeiger-Textdateien; vor dem Ansehen oder `pnpm art:build` erst `git lfs pull` ausführen.
- In einem frischen Worktree kann `node_modules` hinter `package.json` zurückliegen (z. B. fehlt `@babylonjs/materials`); bei „Cannot find package“ erst `pnpm install --frozen-lockfile`.

<!-- /bmad:context -->
