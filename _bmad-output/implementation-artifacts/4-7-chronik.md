# Story 4.7: Chronik

Status: review

## Story

Als Spieler
möchte ich nachlesen, was ich entschieden habe und welche Chronik-Seiten ich gefunden habe,
damit ich die Geschichte meines Durchlaufs im Blick behalte.

## Acceptance Criteria

1. **Inhalt:** Öffnet der Spieler die Chronik, sieht er je Akt die Entscheidungen mit gewählter Antwort und Folgen sowie die gefundenen Chronik-Seiten (x von 12) zum Lesen.
2. **Zugang:** Die Chronik öffnet sich aus dem Menü; die Leiste aus Epic 5 (Story 5.3) steht schon, also auch über deren Chronik-Stein.
3. **Stil:** Die Ansicht folgt dem Listen-Muster aus Stil B (Kopf mit rundem Zurück-Stein, Reiter, Liste auf Stein über dem weichgezeichneten Ort).

## Tasks / Subtasks

- [x] T1 Content (AC 1)
  - [x] Seiten-Register `content/acts/actN/chronicle.yaml` (`id`, `title`, `text`; Akt aus dem Pfad), Deutsch in der Datei, Englisch in `content/locales/en/actN.chronicle.yaml` (`chronicle.<id>.title|text`); Akt 1 noch leer (Seiten kommen mit Epic 9)
  - [x] `balance.yaml` `chronicle.seasonPages: 12` (Narrative: 4 je Akt)
  - [x] `content:check`: Wirkung und Bedingung `chronicle` nennen nur bekannte Seiten, EN-Texte vorhanden, nicht mehr Seiten als die Staffel hat
- [x] T2 Kern (AC 1)
  - [x] `chronicleView(data, c)`: je Akt (mindestens der aktuelle) Entscheidungen mit Titel, Antwort, Ergebnis (`summary`) und Folgen (`consequenceLines` ohne „vermerkt“), gefundene Seiten; Gesamtzahl gefunden / Staffel
- [x] T3 UI (AC 1–3)
  - [x] Screen `chronicle` (`src/app/screens/Chronicle.tsx` + `Chronicle.css`): Kopf „Chronik · x von 12 Seiten“, Reiter „Entscheidungen“ / „Chronik-Seiten (x von 12)“, je Akt ein Abschnitt; Entscheidung als Karte mit „Deine Wahl“ wie im Log, Marke „Folgen“ und Ergebnis, Folgen als kleine Zeilen; Seite als Listenzeile, Tipp öffnet das Blatt mit dem Text
  - [x] Weltkarte: Chronik-Stein der Leiste und Eintrag im runden Menü
- [x] T4 Tests (AC 1)
  - [x] `tests/unit/chronicle.test.ts`: Sicht (leer, nach einer Entscheidung, Akte, verschwundener Content), Loader, Content-Prüfung

## Dev Notes

- **Quellen:** Epics 4.7; EXPERIENCE.md (Chronik in der Leiste: Entscheidungen, Folgen, Chronik-Seiten; spine-only, kein Mockup); DESIGN.md (Leiste, Listen-Muster); Narrative „Found Documents“ (12 Seiten, 4 je Akt, je Seite die Paktnacht eines Königs); Architektur §5.9 (`c.chronicle`).
- **Entscheidungen** kommen aus `c.decisions` (Story 4.6), Antwort und Folgen aus der Szene (`findChoice`), damit die Chronik immer dieselben Texte zeigt wie die Folgen-Karte.
- **Seiten:** `c.chronicle` (Wirkung `chronicle`, Story 4.2) hält die gefundenen Ids in Fundreihenfolge.
- **Mockup fehlt** (spine-only): Aufbau nach Truppe/Ausrüsten (Kopf, Reiter, Liste), Entscheidungs-Karte im Stil des Dialog-Logs und der Folgen-Karte.

### Project Structure Notes

- Neu: `src/core/campaign/chronicle.ts`, `src/app/screens/Chronicle.tsx`, `src/app/screens/Chronicle.css`, `content/acts/act1/chronicle.yaml`, `tests/unit/chronicle.test.ts`.
- Geändert: `src/core/{defs,index}.ts`, `src/content/{schemas,load,validate,node}.ts`, `src/app/{App.tsx,state/screen.ts,state/flow.ts,screens/WorldMap.tsx}`, `content/core/balance.yaml`, Locales.

### Project Context Rules

- Kein sichtbarer Text im Code; Styles je Screen in eigener Datei; Werte in YAML.
- Fertig erst mit grünem `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`.

### References

- [Source: concept/26-epics/epics.md#Story 4.7]
- [Source: concept/25-ux/EXPERIENCE.md#Bildschirme]
- [Source: concept/22-narrative/narrative.md#Found Documents]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Das Blatt einer Seite steht außerhalb von `.hc-view` (dort würde `> :not(.hc-backdrop)` es neu positionieren); ohne Akt-Hinweis im Kopf, weil lange Seitentitel sonst die Kopfzeile sprengen.
- `readContentFiles(root)` in `src/content/node.ts` liefert die rohen Dokumente (Test des Loaders mit einer zusätzlichen Seiten-Datei).
- Dev-Helfer `__hc.devPage({ id, act, title, text })` registriert eine Seite zur Laufzeit und findet sie.
- Im Browser geprüft (375×812, Deutsch): Leiste → Chronik, Reiter, Entscheidungs-Karte, Seitenliste, Seite lesen.

### File List

- Neu: `src/core/campaign/chronicle.ts`, `src/app/screens/Chronicle.tsx`, `src/app/screens/Chronicle.css`, `content/acts/act1/chronicle.yaml`, `tests/unit/chronicle.test.ts`
- `src/core/{defs,index}.ts`, `src/content/{schemas,load,validate,node}.ts`
- `src/app/{App.tsx,state/screen.ts,state/flow.ts,screens/WorldMap.tsx}`
- `content/core/balance.yaml`, `content/core/locales/{de,en}.yaml`
- `tests/unit/decisions.test.ts`
- Doku: `concept/24-architecture/{architecture,decision-log}.md`, `concept/25-ux/.decision-log.md`
