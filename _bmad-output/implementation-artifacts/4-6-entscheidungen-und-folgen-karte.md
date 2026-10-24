# Story 4.6: Entscheidungen und Folgen-Karte

Status: review

## Story

Als Spieler
möchte ich wissen, wann eine Antwort Folgen hat, und sehen, welche,
damit sich kleine Wahlen groß anfühlen.

## Acceptance Criteria

1. **Marke:** Eine Antwort-Zeile, die eine Entscheidung ist, trägt die Marke „Entscheidung · hat Folgen“; der erste Tipp markiert eine Antwort, der zweite bestätigt; Überspringen und Auto sind dabei aus.
2. **Command `choose`:** Die Wahl läuft als Kampagnen-Command `choose { scene, line, option }`, wendet die `effects` der Antwort an und zählt die Haltung (warm, nüchtern, trotzig) der Antwort.
3. **Folgen-Karte:** Nach einer bestätigten Wahl mit Wirkungen zeigt die Folgen-Karte je Wirkung eine Zeile (Symbol, Satz, Erklärung; Mengen als Symbol + Zahl) und vermerkt die Entscheidung in der Chronik (`c.decisions`).
4. **Log und Endgültigkeit:** Das Dialog-Log hebt die eigene Wahl hervor; Wahlen lassen sich nicht zurückspulen (eine schon getroffene Wahl wird nicht erneut gefragt, ein zweites `choose` derselben Zeile lehnt der Kern ab).

## Tasks / Subtasks

- [x] T1 Schema und Typen (AC 1, 3)
  - [x] Antwort-Zeile: optional `title` (Name der Entscheidung, Schlüssel `dlg.<szene>.<zeile>.title`); Antwort: optional `summary` (Titel der Folgen-Karte, `dlg.<szene>.<zeile>.<antwort>.summary`)
  - [x] Eine Antwort-Zeile mit `title` ist eine **Entscheidung**; `resolveScene` liefert `decision`, `titleKey`, `summaryKey`
  - [x] `content:check`: Antworten mit Wirkungen außer `stance` und `setFlag` eines Flags der Art `story` brauchen `title`; Entscheidungen brauchen `summary` je Antwort; Antwort-Id `title` ist verboten; EN-Texte für beide
- [x] T2 Kern (AC 2–4)
  - [x] `CampaignState.choices` (`<szene>#<zeile>` → Antwort) und `decisions` (`{ act, scene, line, option }`), Default beim Laden
  - [x] Command `choose` mit Fehlern `unknown_choice`, `already_chosen` und den Fehlern der Wirkungen; Event `choiceMade`
  - [x] `consequenceLines(effects)`: eine Zeile je sichtbarer Wirkung plus „In der Chronik vermerkt“ (rein, getestet)
  - [x] `skipTarget` überspringt bereits getroffene Wahlen
- [x] T3 UI (AC 1, 3, 4)
  - [x] `Dialogue.tsx`: Marke, zwei Tipps bei Entscheidungen, Überspringen/Auto aus, Folgen-Karte (`consequence-card`) über Schleier mit „Weiter“, Log mit hervorgehobener Wahl, schon getroffene Wahl läuft ohne Frage weiter
  - [x] `Scene.tsx`/`flow.ts`: `chooseAnswer` schickt `choose` (im Kampf wie bisher als Warteschlange der Wirkungen)
  - [x] Texte in `content/core/locales/{de,en}.yaml`
- [x] T4 Tests (AC 1–4)
  - [x] Command `choose` (gültig, jeder Fehlercode, Haltung, Events, Determinismus/Replay), `consequenceLines`, Content-Regeln, `skipTarget` mit getroffenen Wahlen

## Dev Notes

- **Quellen:** Epics 4.6; EXPERIENCE.md (Entscheidung, Folgen-Karte, Szene); DESIGN.md (Entscheidungs-Marke, `consequence-card`); Mockup `concept/25-ux/mockups/05-szenen.html` (Entscheidung, Folgen-Karte, Dialog-Log); Narrative „Die 12 Entscheidungen“ (nur sie haben mechanische Folgen), „Stimme“ (Haltung je Antwort); Architektur §5.2 (`choose`), §5.8, §5.9.
- **Entscheidung oder Plauder-Antwort:** Die Narrative trennt Haltungs-Antworten (färben Text, `story`-Flags) von den 12 Entscheidungen. Kennzeichen ist `title` an der Antwort-Zeile; `content:check` erzwingt es, sobald eine Antwort mehr als Haltung und Story-Flags bewirkt. Plauder-Antworten bleiben ein Tipp, ohne Marke und Karte, zählen aber ebenfalls die Haltung und landen in `choices`.
- **Folgen-Karte:** Zeilen nur für sichtbare Wirkungen: `recruit`, `leave`, `gold`, `material`, `item`, `chronicle`, `openQuest` (und später `grudge`, `priceMod`, `villageAid`, `setHome`, deren Zustand noch fehlt); `setFlag` und `stance` erscheinen nicht. Letzte Zeile immer „In der Chronik vermerkt“. Titel = `summary` der Antwort. Karte nur bei Entscheidungen.
- **Chronik-Eintrag:** `c.decisions` hält jede Entscheidung mit Akt, Szene, Zeile, Antwort; Story 4.7 zeigt sie an.
- **Kein Zurückspulen:** `choices` merkt jede Wahl; läuft eine Szene erneut (z. B. Neustart einer Mission), wird die Zeile mit der gemerkten Antwort übersprungen.
- **Kampf:** Antworten in Kampf-Szenen verbietet `content:check` (Story 4.4); `chooseAnswer` reiht im Kampf trotzdem wie bisher nur die Wirkungen ein.

### Project Structure Notes

- Neu: `src/core/campaign/consequences.ts`, `src/ui/ConsequenceCard.tsx`, `tests/unit/decisions.test.ts`.
- Geändert: `src/core/{defs,state}.ts`, `src/core/campaign/{scene,commands,apply,campaign}.ts`, `src/content/{schemas,validate}.ts`, `src/ui/{Dialogue.tsx,Dialogue.css,SceneTools.tsx}`, `src/app/{screens/Scene.tsx,state/flow.ts}`, Locales.

### Project Context Rules

- Kein sichtbarer Text im Code; Beträge als Symbol + Zahl (`Amount`); Styles je Screen in eigener CSS-Datei; `src/core` rein.
- Fertig erst mit grünem `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`.

### References

- [Source: concept/26-epics/epics.md#Story 4.6]
- [Source: concept/25-ux/EXPERIENCE.md#Zustände]
- [Source: concept/25-ux/DESIGN.md#Bausteine]
- [Source: concept/22-narrative/narrative.md#Die 12 Entscheidungen]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- `Dialogue` löst die Szene mit dem Kontext bei Szenenbeginn auf (sonst wechselte der Sprecher früherer Zeilen, wenn eine Antwort ihn gehen lässt); Antworten wirken in der Szene über ihre Flags wie bisher.
- Ein Tipp auf den Schleier schließt die Folgen-Karte (Mockup-Notiz „Ein Tipp schließt“).
- `.vn` clippt jetzt (`overflow: clip`): Fokus auf einen Knopf schob die Szene sonst seitlich, weil die Halbfiguren über den Rand ragen.
- Im Browser geprüft (375×812, Deutsch) mit `__hc.devScene`: Plauder-Antwort im Prolog (Haltung trotzig +1, `choices`), Test-Entscheidung mit Gehen, Beitritt, Gold, Material und Item, Folgen-Karte, Verlauf mit hervorgehobener Wahl. Akt-1-Inhalt hat noch keine Entscheidung (Epic 9).

### File List

- Neu: `src/core/campaign/consequences.ts`, `src/ui/ConsequenceCard.tsx`, `src/ui/consequence.css`, `tests/unit/decisions.test.ts`
- `src/core/{defs,state,index}.ts`, `src/core/campaign/{scene,commands,apply,campaign}.ts`
- `src/content/{schemas,validate}.ts`
- `src/ui/{Dialogue.tsx,Dialogue.css,SceneTools.tsx,pieces.css}`, `src/i18n/index.ts` (`addTexts`)
- `src/app/{screens/Scene.tsx,state/flow.ts}`
- `content/core/locales/{de,en}.yaml`
- `tests/unit/scene-skip.test.ts`
- Doku: `concept/24-architecture/{architecture,decision-log}.md`, `concept/25-ux/.decision-log.md`
