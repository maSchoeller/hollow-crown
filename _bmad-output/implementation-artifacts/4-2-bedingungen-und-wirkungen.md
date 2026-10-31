# Story 4.2: Bedingungen und Wirkungen

Status: review

## Story

Als Content-Autor
möchte ich „wenn“ und „dann“ in YAML ausdrücken,
damit Szenen, Knoten, Entscheidungen und Belohnungen ohne Code wirken.

## Acceptance Criteria

1. **Sprache:** Die Bedingungen `flag`, `alive`, `dead`, `left`, `completed`, `storyCount`, `act`, `support`, `stance`, `met`, `chronicle`, `any`, `not` und die Wirkungen `setFlag`, `recruit`, `leave`, `grudge`, `gold`, `material`, `item`, `priceMod`, `villageAid`, `openQuest`, `stance`, `chronicle` (Architektur §5.3) sind in `src/core/campaign/conditions.ts` und `effects.ts` umgesetzt, per Zod-Schema validiert, und jede Referenz prüft `content:check`. Tests decken jede Bedingung und Wirkung ab.
2. **Avatar und Kael:** `recruit`/`leave` für Avatar oder Kael lehnt das Schema ab.
3. **Flag-Register:** Ein Register `content/acts/act1/flags.yaml` deklariert die Flags; ein Content-Element mit undeklariertem Flag lässt `content:check` scheitern; `CampaignState.flags` ist ein Record mit Werten statt einer Liste.

## Tasks / Subtasks

- [x] T1 Typen und Schema (AC 1, 2)
  - [x] `Condition`, `Effect`, `FlagDef`, `FlagValue`, `Stance` in `src/core/defs.ts`; `PERMANENT_COMPANIONS`
  - [x] `conditionSchema`, `conditionsSchema`, `effectSchema`, `flagSchema` (genau ein Schlüssel über `strictObject`)
- [x] T2 Kern (AC 1)
  - [x] `conditions.ts`: `ConditionContext`, `conditionContext`, `evalCondition`, `evalConditions`, `dominantStance`
  - [x] `effects.ts`: `validateEffects`, `applyEffects` (nur im Command `effects`)
  - [x] `CampaignState`: `flags` als Record, neu `left`, `stance`, `chronicle`; `normalizeCampaign` setzt Defaults für ältere Spielstände
- [x] T3 Content-Prüfung (AC 1, 3)
  - [x] `validate.ts`: Flags gegen das Register (inkl. erlaubter Werte), Gefährten, Knoten, Support-Paare, Items, Materialien; Karten-Trigger `set_flag` gegen das Register
  - [x] Nicht unterstützte Schlüssel melden „is not yet supported“
- [x] T4 Verdrahtung (AC 1, 3)
  - [x] Camp-Einrichtungen (`facilities` in `campaign.yaml`) als Bedingungslisten; `Camp.tsx` wertet sie mit `evalConditions` aus
  - [x] Dialogzeilen: `if` ist eine Bedingung oder Liste; Antworten tragen `effects` statt `setFlag`; `Dialogue.tsx` wertet Bedingungen aus und schickt Wirkungen als Command `effects`
  - [x] `flags.yaml` für Akt 1 (sechs Dialog-Flags des PoC)
- [x] T5 Tests (AC 1, 2, 3)
  - [x] `tests/unit/story.test.ts`: jede Bedingung wahr/falsch, UND-Listen, `any`/`not`, Wirkungen im Command, Fehlercodes, Schema (ein Schlüssel, Avatar/Kael), Referenzprüfung, nicht unterstützte Schlüssel, Spielstand-Normalisierung

## Dev Notes

- **Muster:** Architektur §8.1 (Command), §8.2 (neue Bedingung/Wirkung: Schema, Auswertung, Referenzprüfung, Tabelle in §5.3). Bedingungen verändern nichts; Wirkungen laufen nur in `applyCampaign` auf der Kopie, nach `validateEffects`.
- **Schema und Typen:** `conditionSchema`/`effectSchema` sind `z.ZodType<Condition|Effect>`; `Condition`/`Effect` sind handgeschriebene Typen in `defs.ts`, damit `core` Zod nicht kennt.
- **`flag`-Schreibweise:** `{ flag: name }` = gesetzt (beliebiger Wert); `{ flag: { name: wert } }` = genau dieser Wert. Dasselbe in `setFlag` (`name` setzt `true`). Das Register legt erlaubte Werte fest (`values`); ohne Angabe nur `true`.
- **`storyCount`:** `{ min?, max? }` (mindestens eines). Gezählt werden abgeschlossene Knoten des Akts; solange es nur Story-Knoten gibt, sind das alle Knoten. „Im Bereich“ (nach Akt) kommt mit dem Graphen (4.3).
- **`act`:** Heute aus `campaign.yaml` (`act: 1`, neues Feld, Default 1); der laufende Akt als Spielzustand mit `act + 1` nach dem Finale gehört zu Story 4.3.
- **Umsetzungsstand je Schlüssel**
  - Bedingungen umgesetzt: `flag`, `alive`, `dead`, `left`, `completed`, `storyCount`, `act`, `support`, `stance`, `chronicle`, `any`, `not`.
  - Bedingung **nicht unterstützt** (Schema akzeptiert, `content:check` meldet „not yet supported“, `evalCondition` wirft): `met` (Leutnants gibt es erst mit Story 3.1).
  - Wirkungen umgesetzt: `setFlag`, `recruit` (Gefährte), `leave`, `gold`, `material`, `item`, `stance`, `chronicle`.
  - Wirkungen **nicht unterstützt** (Command lehnt mit `effect_unsupported` ab, `content:check` meldet „not yet supported“, `applyEffects` wirft): `grudge` (Leutnants 3.3), `priceMod` (Händler 6.4), `villageAid` (Dörfer im Kampf/5.x), `openQuest` (Graph 4.3), `setHome` (Heimat 6.x), `recruit: { lt }` (Leutnant, Story 3.7).
- **Minimaler Zustand mit Default** (Architektur §5.9, kein neues Regelwerk): `left: string[]` (Wirkung `leave`), `stance: { warm, sober, defiant }` mit `dominantStance` (Gleichstand warm > sober > defiant; ohne Punkte keine Haltung), `chronicle: string[]`. Ältere Spielstände bekommen die Felder in `normalizeCampaign` (beim Laden in `restore`); eine Flag-Liste wird zum Record mit `true`.
- **Festgelegt, weil die Architektur schweigt** (siehe Entscheidungslog): `leave` legt Ausrüstung und Beutel des Gefährten in den Tross; `recruit` eines Gefallenen ist `effect_invalid`; `leave` eines Gefährten, der nicht in der Truppe ist, `unknown_unit`; Gold und Material einer Wirkungsliste dürfen in Summe nicht unter null fallen; ein Gefährte, der ging, kann per `recruit` zurückkehren (löscht den Eintrag in `left`).
- **`chronicle`-Seiten** haben noch kein Register (Story 4.7); `content:check` prüft dort keine IDs.
- **Command:** `setFlag { flag }` aus Story 1.4 ist durch `effects { effects }` ersetzt (so wirken Antworten, später Belohnungen); Fehlercodes `effect_invalid` und `effect_unsupported` stehen im Kern, die UI zeigt sie heute nicht an (Content wird vorher geprüft). Kampf-Trigger `set_flag` setzen weiter boolesche Flags; am Missionsende werden sie als `true` in `c.flags` übernommen. `BattleState.flags` bleibt eine Liste (Namen der gesetzten Flags).
- **Bestehende Stellen, die nun die Sprache nutzen:** Camp-Einrichtungen (`campaign.yaml facilities`), Dialogzeilen `if`, Antworten `effects`. Die `next`-Listen und `CampaignState.available` bleiben bis Story 4.3.
- **Spielstände:** Fixtures `tests/fixtures/saves/*.json` bleiben mit Flag-Liste stehen und dienen als Testfall für `normalizeCampaign`.

### Project Structure Notes

- Neu: `src/core/campaign/conditions.ts`, `src/core/campaign/effects.ts`, `content/acts/act1/flags.yaml`, `tests/unit/story.test.ts`.
- Geändert: `src/core/defs.ts`, `src/core/state.ts`, `src/core/campaign/{commands,apply,campaign}.ts`, `src/core/battle/setup.ts`, `src/core/index.ts`, `src/content/{schemas,validate,load}.ts`, `src/ui/Dialogue.tsx`, `src/app/{App,store}.ts(x)`, `src/app/screens/{Battle,Camp}.tsx`, `content/acts/act1/{campaign.yaml,dialogue/*}`, bestehende Tests (`setFlag` → `effects`), `vite.config.ts` (Coverage-Schwellen angehoben).

### Project Context Rules

- `src/core` rein; Wirkungen nur in Kampagnen-Commands; Content nur per Schema; Texte in den Locales; fertig erst mit `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`.

### References

- [Source: concept/26-epics/epics/epic-04.md#Story 4.2]
- [Source: concept/24-architecture/architecture.md#5.3 Bedingungen und Wirkungen]
- [Source: concept/24-architecture/architecture.md#5.9 Story-Zustand: Flags, Haltung, Chronik, Epilog]
- [Source: concept/24-architecture/architecture.md#8.1, #8.2, #8.7]
- [Source: _bmad-output/implementation-artifacts/1-4-kampagnen-commands-und-journal.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5 (claude-sonnet-5-5)

### Debug Log References

- `pnpm lint`, `pnpm test` (97 Tests, davon 33 neue in `story.test.ts`; Journal- und Command-Tests auf `effects` angepasst), `pnpm content:check`, `pnpm build` grün; Bundle 14,92 MB.
- Coverage `src/core` (Zeilen) 76,14 % → 77,36 %; Schwellen in `vite.config.ts` auf 70/60/75/76 angehoben.
- Browser-Prüfung (Playwright gegen den Dev-Server, frischer Browser): Antwort im Prolog setzt `{"avatar_proud":true}` über das Journal-Command, die bedingte Zeile erscheint, Prolog per `autoWin` gewonnen, Ergebnisansicht, keine Konsolenfehler. Camp-Einrichtungen laufen über dieselbe Auswertung und sind per Unit-Test abgedeckt.
- `pnpm sim` und `pnpm test:e2e` wie in Story 4.1.

### Completion Notes List

- Bedingungen und Wirkungen nach §5.3 umgesetzt; Stand je Schlüssel siehe Dev Notes (nicht unterstützt: `met`, `grudge`, `priceMod`, `villageAid`, `openQuest`, `setHome`, `recruit: { lt }`).
- Verdrahtet in Camp-Einrichtungen, Dialogzeilen und Antworten (Verhalten unverändert).
- Keine sichtbare Änderung in der Oberfläche.
- Unabhängiges Code-Review steht aus.

### File List

- `src/core/campaign/conditions.ts`, `src/core/campaign/effects.ts` (neu)
- `src/core/defs.ts`, `src/core/state.ts`, `src/core/index.ts`, `src/core/campaign/{commands,apply,campaign}.ts`, `src/core/battle/setup.ts`
- `src/content/{schemas,validate,load}.ts`
- `src/ui/Dialogue.tsx`, `src/app/App.tsx`, `src/app/store.ts`, `src/app/screens/{Battle,Camp}.tsx`
- `content/acts/act1/flags.yaml` (neu), `content/acts/act1/campaign.yaml`, `content/acts/act1/dialogue/dlg.{prologue,ch01,ch02}.intro.yaml`
- `tests/unit/story.test.ts` (neu), `tests/unit/{campaign-commands,journal}.test.ts`
- `vite.config.ts`, `concept/24-architecture/{architecture.md,decision-log.md}`
