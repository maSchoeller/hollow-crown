# Story 4.1: Content je Akt ablegen

Status: review

## Story

Als Entwickler
möchte ich Regeln und Akt-Inhalte getrennt ablegen,
damit Akte einzeln wachsen und später als Pakete ausgeliefert werden können.

## Acceptance Criteria

1. **Layout:** Regeln, UI-Texte und Werte liegen in `content/core/`, Akt-Inhalte in `content/acts/act1/` (Kampagne, Karten, Einheiten, Dialoge); Browser-Loader, Node-Loader, `content:check`, `pnpm sim`, Bundle-Prüfung und Art-Build finden alles. [Architektur §7]
2. **Unverändertes Verhalten:** Das Spiel verhält sich unverändert (E2E-Smoke-Test grün, `pnpm sim` je Karte mit gleichem Ergebnis wie vorher).
3. **`expectedLevel`:** Jeder Story-Knoten in `content/acts/actN/campaign.yaml` trägt `expectedLevel` (erwartete effektive Armee-Stufe nach GDD, Akt 1: 1 → 9, Finale 10); `content:check` scheitert, wenn es fehlt oder die Kurve innerhalb eines Akts abfällt. Gegnerstufen (5.5, 5.6), Heimsuchungs-Deckel und die Simulation (6.8) lesen nur dieses Feld.

## Tasks / Subtasks

- [x] T1 Dateien verschieben (AC 1)
  - [x] `git mv`: `balance render terrain classes items skills affixes runes sets` → `content/core/`, `locales/` (UI-Texte, Namen) → `content/core/locales/`
  - [x] `campaign.yaml`, `units.yaml`, `maps/`, `dialogue/` → `content/acts/act1/`; Dialogtexte `{de,en}.dialogue.yaml` → `content/acts/act1/locales/`
- [x] T2 Loader (AC 1)
  - [x] `src/content/load.ts`: Pfade je Datei (`core/…`, `acts/act1/…`), Karten und Dialoge aus beliebigem `acts/*/`, Locales aus `core/locales/` und `acts/*/locales/`
  - [x] `browser.ts` und `node.ts` lesen weiter per Glob bzw. Verzeichnislauf über `content/**`; keine Änderung nötig
  - [x] `tools/check-bundle-size.mjs`, `tools/art/build.py` (Kopf-IDs aus `content/acts/*/units.yaml` und Karten) auf neue Pfade
  - [x] `AGENTS.md`, `README.md` nennen die neuen Pfade
- [x] T3 `expectedLevel` (AC 3)
  - [x] Schema `campaignSchema` (Pflichtfeld, ganze Zahl ≥ 1), `CampaignNodeDef`, Werte in `campaign.yaml`
  - [x] `validate.ts`: Kurve fällt weder in Dateireihenfolge noch entlang `next`
  - [x] Tests: Werte vorhanden und nicht fallend, fallende Kurve scheitert, fehlendes Feld scheitert im Schema, Loader findet Kern und Akt, fehlende Dateien werden gemeldet
- [x] T4 Prüfen (AC 2)
  - [x] `pnpm sim <karte> --runs 20` vor und nach dem Umbau, E2E-Smoke-Test

## Dev Notes

- **Heute vor der Story:** alles flach in `content/`; der Loader (`buildContent`) sucht Dateien über Pfade relativ zu `content/` (`contentPath`). Das Layout in Architektur §7 sieht zusätzlich `packs.yaml`, `released-ids.json`, `renames.yaml`, `world/`, `home/`, `rooms.yaml`, `traits.yaml` vor; die gehören zu 7.x, 5.x, 6.x und werden hier nicht angelegt.
- **Entscheidung `dialogue/` statt `scenes/`:** Die Szenen-Dateien (`scenes/`, Schlüssel `scn.a1…`) bringt Story 4.4. Bis dahin liegen die Dialoge unter `content/acts/act1/dialogue/`; die Loader-Regel `acts/*/dialogue/` wechselt dann auf `scenes/`.
- **`campaign.yaml` bleibt ungeteilt:** Sie enthält neben dem Graphen auch Händlerstufen, Support-Paare und Narben. §7 sieht dafür `supports.yaml` und weitere Dateien vor; die Aufteilung folgt mit den Stories 4.3 (Graph), 4.9 (Support-Paare) und 6.4 (Händler), damit hier nichts am Verhalten hängt.
- **Namen** (`de.names.yaml`, `en.names.yaml`) bleiben in `content/core/locales/`, wie in §7 vorgesehen (auch wenn die Figuren zu Akt 1 gehören).
- **`expectedLevel` – gewählte Werte:** Das GDD verteilt Akt 1 auf 9 Story-Missionen mit 1 → 9 (Finale 10), also etwa eine Stufe je Mission. Heute gibt es drei Knoten: `prologue` = 1, `ch01` = 2, `ch02` = 3. Die Gegner der PoC-Karten liegen mit Stufe 3 bis 6 darüber (frühe Karte, harte Gegner); das ist PoC-Balancing und ändert sich mit den Gegnerstufen aus 5.5/5.6, nicht mit diesem Feld. Feinwerte übernimmt die verkettete Simulation (Story 6.8).
- **Prüfung der Kurve:** Dateireihenfolge der Knoten (Story-Reihenfolge des Akts) und `next`-Kanten dürfen nicht fallen. Gleiche Werte sind erlaubt (mehrere Missionen auf derselben Stufe). Wenn Story 4.3 Nebenknoten (`kind: side`) bringt, gilt die Pflicht nur für Story-Knoten.
- **Was erhalten bleiben muss:** Gruppenreihenfolge, Datei-Labels in den `content:check`-Meldungen (`items.yaml: …`), Dateinamen der Dialoge (IDs `dlg.*`), Locale-Zusammenführung je Sprache (der Sprachkürzel steht vor dem ersten Punkt im Dateinamen).
- **Nicht Teil der Story:** Paket-Registry, Laden im Hintergrund (Epic 7), Szenen-Schema (4.4), Leutnants und Heimsuchungen.

### Project Structure Notes

- Geändert: `src/content/load.ts`, `src/content/schemas.ts`, `src/content/validate.ts`, `src/core/defs.ts`, `tools/check-bundle-size.mjs`, `tools/art/build.py`, `content/acts/act1/campaign.yaml`.
- `eslint.config.js`, `vite.config.ts` (YAML-Plugin) und die Loader-Einstiege brauchten keine Änderung.
- Die älteren Konzeptdokumente (`concept/01`, `03`, `07`, `11`, `16` …) nennen noch die flachen Pfade des PoC; maßgeblich ist Architektur §7.

### Project Context Rules

- Spielwerte nie im Code; Content als YAML mit Zod-Schema; fertig erst mit `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`.

### References

- [Source: concept/26-epics/epics.md#Story 4.1]
- [Source: concept/24-architecture/architecture.md#7 Projektstruktur]
- [Source: concept/24-architecture/architecture.md#5.4 Kampagnen-Graph und Akte]
- [Source: concept/21-gdd/gdd.md#Figurensystem – Erwartete effektive Armee-Stufe]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5 (claude-sonnet-5-5)

### Debug Log References

- `pnpm lint`, `pnpm test` (97 Tests), `pnpm content:check`, `pnpm build` grün; Bundle 14,92 MB (Budget 15 MB).
- `pnpm sim <karte> --runs 20` vor und nach dem Umbau identisch: Prolog 100 % Siege, 5,0 Runden; Kapitel 1 85 %, 8,8 Runden, 0,15 Verluste; Kapitel 2 94 % (17 von 20 Läufen), 9,0 Runden, 1,76 Verluste.
- `pnpm test:e2e`: 12 von 12 grün (vier Projekte, nacheinander).

### Completion Notes List

- Layout nach §7 umgesetzt: `content/core/` (Regeln, Werte, UI-Texte) und `content/acts/act1/` (Kampagne, Einheiten, Karten, Dialoge, Flag-Register, Dialogtexte).
- `expectedLevel`: Prolog 1, Kapitel 1 = 2, Kapitel 2 = 3; Pflichtfeld im Schema, Kurvenprüfung in `content:check`.
- Keine sichtbare Änderung in der Oberfläche.

### File List

- `content/core/*.yaml`, `content/core/locales/*` (verschoben)
- `content/acts/act1/{campaign,units}.yaml`, `maps/`, `dialogue/`, `locales/` (verschoben); `campaign.yaml` mit `act`, `expectedLevel`
- `src/content/load.ts`, `src/content/schemas.ts`, `src/content/validate.ts`, `src/core/defs.ts`
- `tools/check-bundle-size.mjs`, `tools/art/build.py`
- `AGENTS.md`, `README.md`, `concept/24-architecture/decision-log.md`
- `tests/unit/story.test.ts` (neu)
