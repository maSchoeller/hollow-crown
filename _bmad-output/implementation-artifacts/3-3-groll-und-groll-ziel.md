# Story 3.3: Groll und Groll-Ziel

Status: done

## Story

Als Spieler
möchte ich, dass ein Leutnant sich an die Figur erinnert, die ihn vertrieben hat,
damit die Welt sich an meine Truppe erinnert.

## Acceptance Criteria

1. **Zustand:** `LieutenantState` (`src/core/state.ts`) trägt `met`, `encounters`, `grudge` (0–3), `target?` (Roster-ID des Groll-Ziels), `routs`, `signatureDropped`. Ältere Spielstände ohne diese Felder laden mit Vorgaben (`normalizeCampaign`); ob dafür eine Speicher-Migration nötig ist, ist begründet entschieden und im Architektur-Decision-Log vermerkt.
2. **Typen für die Flucht:** `BattleUnit.gone` kennt `'fled'` und `BattleUnit.fledBy?: string` (UID des Vertreibers). Gesetzt werden beide erst in Story 3.2; Tests setzen sie direkt.
3. **Nach der Mission:** Bei gewonnener Mission erhöht `finishBattle` für jede Einheit mit `lieutenant`: `encounters` +1 und `met = true`; war sie `gone === 'fled'`, zusätzlich `routs` +1, `grudge = min(3, grudge + 1)` und `target` = Roster-ID des Vertreibers. Ist der Vertreiber keine Figur der Truppe (z. B. verbündeter NPC), bleibt `target` unverändert. Bei Niederlage ändert sich nichts. Die Logik steht als reine Funktion in `src/core/campaign/lieutenants.ts`.
4. **Wirkung und Bedingung:** Die Wirkung `grudge: { lt, delta }` senkt/erhöht den Groll (Klammer 0–3, Event `grudgeChanged`); die Bedingung `met: <lt>` wird ausgewertet. Beide sind aus den `UNSUPPORTED_*`-Listen und der Prüfung in `validate.ts` entfernt; `content:check` prüft den Leutnant gegen `GameData.lieutenants`.
5. **KI:** Das Groll-Ziel bekommt in der Zielbewertung +20 (`balance.ai.grudgeTargetBonus: 20`), nur wenn der Angreifer ein Leutnant mit `grudgeTarget` ist.
6. **Kampfaufbau:** `createBattle` setzt `BattleUnit.grudge` und `grudgeTarget` jedes Leutnants aus `c.lieutenants[id]` (Karteneinheit mit `lieutenant:` aus Story 3.1).
7. **Zeilen im Kampf:** Beim ersten Sichtkontakt spricht der Leutnant als Sprechblase: nicht `met` → `first`; Groll ≥ 1 und Ziel in der Truppe → `grudge_<Groll>` mit dem Namen des Ziels; Ziel gefallen → `mock` (Gedenk-Spott, der Groll bleibt, bis die nächste Vertreibung ein neues Ziel setzt); `met` und Groll 0 → keine Zeile. Je Leutnant einmal pro Kampf; im Überspringen-Modus entfällt sie. „Sichtkontakt“ hängt an einer Funktion `isVisibleToPlayer(state, unit)`, die heute `true` liefert (ohne Nebel ist alles sichtbar), die Zeile kommt also zu Beginn der ersten Spielerphase; sobald Story 2.6 (Nebel) auf `main` ist, wird die Funktion an die echte Sicht gehängt.
8. **Prüfungen:** Tests für Zustandsübergänge (Vertreibung, mehrfach, Deckel 3, Ziel gewechselt, Niederlage), Wirkung/Bedingung, KI-Gewicht, Zeilenwahl (alle vier Fälle), Spielstand-Normalisierung; `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün. Da die Zeile sichtbar ist, zusätzlich Screenshot der Groll-Zeile mit dem Namen des Ziels.

## Tasks / Subtasks

- [x] T1 Zustand und Normalisierung (AC 1, 2)
  - [x] `LieutenantState` erweitern; neue Felder so anlegen, dass vorhandene Tests (`tests/unit/day.test.ts:8` baut `{ hask: { met: true } }`) weiter laufen oder mitangepasst werden
  - [x] `normalizeCampaign` füllt Vorgaben; Entscheidung zur Migration (siehe Dev Notes)
  - [x] `gone: 'fled'` und `fledBy` als Typen in `state.ts`
- [x] T2 Kampagnenlogik (AC 3)
  - [x] `src/core/campaign/lieutenants.ts`: reine Funktion `applyLieutenantOutcome(data, c, s)` (oder ähnlich) mit Ergebnis für spätere Erweiterung durch Story 3.5
  - [x] Aufruf in `finishBattle` (nach der Einheiten-Schleife, vor Kopfgeld aus 3.5), bei Sieg
- [x] T3 Wirkung und Bedingung (AC 4)
  - [x] `ConditionContext.lieutenants`, `conditionContext`, `evalCondition` für `met`
  - [x] `effects.ts` `grudge` in `validateEffects` und `applyEffects`, Event `grudgeChanged` in `CampaignEvent`
  - [x] `UNSUPPORTED_*`, `validate.ts`, Fehlercode-Kommentar `effect_unsupported` anpassen
- [x] T4 KI (AC 5)
  - [x] `balance.ai.grudgeTargetBonus` in `balance.yaml`, `balanceSchema`, `defs.ts`; eine Zeile in `attackPlans`
- [x] T5 Kampfaufbau (AC 6)
  - [x] `createBattle` setzt `grudge`/`grudgeTarget` aus `c.lieutenants`
- [x] T6 Zeilen im Kampf (AC 7)
  - [x] `ltOpeningLine(...)` als reine Auswahl im Kern, `isVisibleToPlayer(state, unit)`
  - [x] `src/app/battle/ltLines.ts` (Muster `barks.ts`): Auslöser, `{target}`-Ersetzung, einmal je Leutnant und Kampf
  - [x] Eingriff in `Battle.tsx` klein (ein Haken); Sprechblasen über `SpeechBubbles` mit `only=[line]`
- [x] T7 Tests, Prüfungen, Screenshot (AC 8)
  - [x] Decision-Log (Architektur §5.5 Stand) nachtragen

## Dev Notes

### Quellen

- Epics 3.3; Architektur §5.3 (Bedingung `met`, Wirkung `grudge`, `ctx.lieutenants`) und §5.5 (Zustand `c.lieutenants[id]`, „Nach der Mission“); GDD „Leutnants“ (Groll 0–3, +1 je Vertreibung, Entscheidungen −1, Groll-Ziel +20, Gedenk-Spott); Narrative „Weitere Gesprächsarten“ (Leutnants-Zeilen); EXPERIENCE (Sprechblase blockiert kurz, höchstens 2 Zeilen; Szene 2: „Hask ruft ‚Das merk ich mir, Brenna!‘“); Mockup `02-kampf.html` (Gegnerphase mit Groll-Zeile als Sprechblase am Kopf).
- Produktentscheidungen vom 2026-10-25 (siehe Story 3.1): Sichtkontakt-Regel (oben, AC 7); Zeilen und ihre IDs (`first`, `grudge_1..3`, `mock`) stehen seit 3.1 in `scn.lt.<id>`.

### Vorhandener Code (Fundstellen, Stand HEAD 3d7cb9f)

- **Zustand:** `src/core/state.ts:241-248`: `lieutenants?: Record<string, LieutenantState>` (fehlt bis zur ersten Begegnung), `LieutenantState { met }`. `BattleUnit`: `gone?` Zeile 87, `lieutenant?` Zeile 94. `metLieutenant` in `src/core/campaign/day.ts:11` liest nur `met`.
- **Normalisieren:** `src/core/campaign/campaign.ts:57` `normalizeCampaign` (fügt Vorgaben für neue Felder älterer Spielstände ein). Speicher: `src/persistence/save.ts:80-86` `migrations` (leer; AGENTS „Akt-Release“: Migration und Fixture nur nach einem Release nötig, `content/released-ids.json` existiert noch nicht; `tests/unit/migrations.test.ts` verlangt Fixtures nur für vorhandene Migrationen). Additive, optionale Felder brauchen daher keine Migration, solange `normalizeCampaign` sie füllt; trotzdem im Decision-Log festhalten.
- **finishBattle:** `campaign.ts:217-354`; `rng` geklont Zeile 238; Einheiten-Schleife über `playerUnits` (243) (Spieler und Verbündete, Leutnants sind Gegner und kommen dort nicht vor); Gold-Gutschrift 333–338; `c.rng = rng` Zeile 348. Zeile 236: bei Niederlage kehrt die Funktion unverändert zurück. `BountyResult` (147–156) und `result.bounty` (230) sind für Story 3.5.
- **Wirkungen/Bedingungen:** `effects.ts:10` `UNSUPPORTED_EFFECTS` (`grudge`, `priceMod`, `villageAid`, `setHome`), `validateEffects` ab 41, `applyEffects` ab 98 (`gold`-Zweig als Muster); `conditions.ts:10` `ConditionContext` (hat heute **kein** `lieutenants`, trotz Architektur §5.3), `conditions.ts:26` `UNSUPPORTED_CONDITIONS = ['met']`, `conditionContext` ab Zeile 29; `validate.ts:97` (Bedingung) und `:141` (Wirkung, plus `recruit` mit Leutnant, das bleibt unsupported bis 3.7). `commands.ts:92` Kommentar zu `effect_unsupported`; `CampaignEvent` ab `commands.ts:98`.
- **Folgen-Karte:** `src/ui/ConsequenceCard.tsx:39-40` zeigt `grudge` bereits (`ui.consequence.grudge.title`/`.desc`); `src/core/campaign/consequences.ts:15,54`. Nur prüfen, dass die Karte mit der nun unterstützten Wirkung stimmt.
- **KI:** `src/core/ai/ai.ts` `attackPlans` ab 67; `objectiveBonus` Zeile 87; Gewichte in `content/core/balance.yaml` (Abschnitt `ai:` ab Zeile 181), `defs.ts` Balance-Typ (`objectiveBonus` Zeile 749), `balanceSchema` in `schemas.ts`.
- **Kampfaufbau:** `src/core/battle/setup.ts:28` `createBattle` (hat `c`), Karteneinheiten ab Zeile 70.
- **Zeilen-Anzeige:** `src/app/battle/barks.ts` (Bark-Auswahl rein, Anzeige über `playBark`), `src/app/screens/Battle.tsx`: Ereignis-Haken ~385–392, `playBark` 394–397, `openingBark`-Ref 392, Wiedergabe nach dem Laden ~175–178 (`settings.value.speed !== 3` ist der Überspringen-Modus). `src/ui/SpeechBubbles.tsx:42`: `only`-Parameter spielt einzelne Zeilen ohne „gesehen“-Markierung, ruft `t(l.key)` **ohne** Parameter auf, `{target}` braucht also eine Erweiterung (Parameter durchreichen). Platzhalter-Ersetzung: `src/i18n/index.ts:44` (`{avatar}`).
- **Event für neu erscheinende Einheiten:** `events.ts:49` `spawned { unit, reinforcement }`, `phase` Zeile 50. Verstärkungen sind erst beim Erscheinen sichtbar.
- **Tests als Muster:** `tests/unit/day.test.ts`, `tests/unit/result.test.ts` (Result-Ansicht), `tests/unit/barks.test.ts` (Auswahl rein), `tests/unit/class-actions.test.ts:29` `arena()`.

### Was sich ändert / was bleibt

- **Verhalten:** `finishBattle` bleibt für Missionen ohne Leutnant bitgleich (Replays und `sim-campaign.test.ts` unverändert); der Zufall wird in dieser Story nicht angefasst (er kommt mit 3.5).
- **`met`-Zeitpunkt:** Gesetzt wird `met` erst bei Sieg. Nach einer Niederlage spricht der Leutnant im Wiederholungsversuch erneut die `first`-Zeile; das ist gewollt einfach und kein Fehler.
- **Zeilenwahl:** `grudge ≥ 1` ohne `target` (z. B. Entscheidung hat Groll erhöht, Wirkung kennt nur `−1`; oder der Vertreiber war kein Roster-Mitglied) liefert keine `grudge_*`-Zeile, siehe offene Fragen.
- **Reihenfolge am Kampfbeginn:** Ein Bark des Gefährten (`openingBark`, Story 9.13) und die Leutnant-Zeile dürfen sich nicht überlagern: erst Bark, dann Leutnant-Zeilen in Reihenfolge der Einheiten im State.
- **Sichtkontakt:** Prüfen beim Beginn jeder Spielerphase und wenn eine Einheit neu aufs Brett kommt (`spawned`); die Funktion `isVisibleToPlayer` liegt im Kern (neues Modul, z. B. `src/core/campaign/lieutenants.ts`), damit Story 2.6 sie später ersetzt, ohne die App anzufassen. `src/core/rules/vision.ts` gehört der Kampf-Session und existiert noch nicht auf `main`.

### Grenzen zu anderen Stories und Sessions

- **Nicht hier:** `gone: 'fled'` setzen, `fled`-Event, Vorschau „flieht“, Rückwärtssprung/Rauch/Wimpel fällt, Fluchtzeilen (alles 3.2); Skalierung (Stufe, Ausrüstungs-Tier, Freischaltung der Groll-Fähigkeiten, `createBattle`-Stärke) (3.4); Kopfgeld, Material, Signatur-Drop, Ergebnisbildschirm (3.5; der Zähler `signatureDropped` wird hier nur geführt); Steckbrief-Ansicht (3.6); Seitenwechsel, `joined`, Verfall des Grolls (3.7); Heimsuchungen (5.5/5.6); Karten und Zuordnung der Leutnants zu Karten (Level-Design, Karten nicht anfassen).
- **Session „Kampf“** (Branch `claude/pensive-jepsen-b9ce35`) arbeitet an `src/core/battle/{apply,actions,commands,objectives}.ts`, `src/core/rules/{movement,effects,cast,roles,vision}.ts`, `src/core/ai/{ai,autoplay}.ts`, `src/core/{state,events,defs,index}.ts`, `src/content/{schemas,validate}.ts`, `content/core/{balance,classes,items}.yaml` und Locales, `src/app/screens/{Battle,BattleHud,BattlePanels}.tsx`, `src/ui/hud.css`, `src/ui/icons.tsx`, `src/render/board/overlays.ts`. In diesen Dateien nur **ergänzen**: `effects.ts` (ein Zweig, Liste kürzen), `ai.ts` (**eine** Zeile in `attackPlans`), `state.ts`/`defs.ts` (Felder am Ende eines Blocks), `Battle.tsx` (ein Haken). Neue Logik in `lieutenants.ts` und `ltLines.ts`.
- **Abhängigkeiten:** Story 3.1 (Definitionen, Szenen, `BattleUnit.grudge`) vorher; Story 4.2 (Wirkungssprache) ist erledigt.

### Geklärte Fragen (Produktinhaber 2026-10-25, Fragetool)

1. **Groll ohne Ziel:** Keine Zeile. Er bleibt still, bis eine Vertreibung durch eine Truppen-Figur ein Ziel setzt.
2. **`quote` der Karteneinheit:** Beides unabhängig: Leutnant-Zeilen (first/grudge_n/mock) beim ersten Sichtkontakt auch für Einheiten mit `quote`; das `quote` läuft weiter vor dem ersten Schlag.

**Geklärte Fragen (Produktinhaber 2026-10-25, Rückfragen der Umsetzung):**

3. Ziel hat die Truppe verlassen (`c.left`): keine Zeile, der Groll bleibt (per Test abgesichert).
4. KI-Bonus +20 nur ab Groll ≥ 1; bei Groll 0 kein Bonus, das Ziel bleibt gespeichert und gilt wieder, sobald der Groll steigt.
5. Die „einmal pro Kampf"-Liste im Ref ist reine Darstellung und genügt; `unknown_unit` für `grudge` mit unbekanntem Leutnant ist in Ordnung.

### Project Structure Notes

- Neu: `src/core/campaign/lieutenants.ts`, `src/app/battle/ltLines.ts`, `tests/unit/lieutenants-grudge.test.ts`.
- Geändert: `state.ts`, `defs.ts`, `campaign.ts`, `conditions.ts`, `effects.ts`, `commands.ts`, `validate.ts`, `ai.ts`, `setup.ts`, `balance.yaml`, `schemas.ts`, `SpeechBubbles.tsx`, `Battle.tsx`; Folgen-Karte nur prüfen.

### Project Context Rules

- `src/core` bleibt rein und der State serialisierbar; jeder Zufall aus dem Seed-RNG (hier keiner); Replays identisch.
- Spielwerte (`+20`) nur in `balance.yaml`. Kein sichtbarer Text im Code, `{target}` über die Locales; Zeilen sind Content aus 3.1.
- Code, Bezeichner und Commits englisch.
- Fertig erst, wenn `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün sind; für diese sichtbare Story zusätzlich Screenshot.
- Coverage von `src/core` nicht senken (`pnpm test:coverage`).
- In `sprint-status.yaml` nur die Zeilen der Story ändern.

### References

- [Source: concept/26-epics/epics/epic-03.md#Story 3.3]
- [Source: concept/24-architecture/architecture.md#5.3 Bedingungen und Wirkungen (AR3)]
- [Source: concept/24-architecture/architecture.md#5.5 Leutnants (AR5)]
- [Source: concept/21-gdd/gdd.md#Leutnants]
- [Source: concept/22-narrative/narrative.md#Dialogue Framework]
- [Source: concept/25-ux/EXPERIENCE.md]
- [Source: _bmad-output/implementation-artifacts/4-2-bedingungen-und-wirkungen.md]
- [Source: _bmad-output/implementation-artifacts/9-13-supports-und-barks-von-akt-1.md]

## Review (2026-10-25)

Grundlage: Code-Review Epic 3 (Diff PR #48 + #52, Prüfschichten Blind Hunter, Edge Case Hunter, Acceptance Auditor, Querschnitt Replay/Vorschau/Migration/Worker, Simulation, Browser).

Kurzergebnis: Übrige ACs ohne Befund.

Querschnitt: Migration nicht nötig (`normalizeCampaign`, Felder additiv, kein Release), Worker-KI ok (Groll-Bonus aus BattleState).

| # | Schwere | Befund | Ort | Ergebnis |
|---|---|---|---|---|
| R1 | S2 | Leutnants aus Verstärkung/Trigger-`spawn` ohne Skalierung, Groll, Groll-Skills, Ziel; beigetretener Grosk spawnt in m1_8 als Feind mit uid `grosk`. Entscheidung: gleich aufbauen (createBattle rechnet vorab, State trägt es). | objectives.ts:121 vs setup.ts:72 | behoben in PR #55 |
| R2 | E→fix | „Begegnet“ ohne Sichtkontakt. Entscheidung: nur bei Sicht oder Flucht. | lieutenants.ts applyLieutenantOutcome | behoben in PR #55 |
| R6 | S3 | Eröffnungszeilen beim Wiedereinstieg (Runde > 1, „Runde neu“) stumm verbraucht. Entscheidung: beim nächsten Sichtkontakt nachholen. | Battle.tsx:219 | behoben in PR #55 |
| R8 | S3 | Derselbe Leutnant zweimal auf einer Karte (je Schwierigkeit) wird doppelt gezählt/bezahlt; content:check soll das ablehnen. | validateLieutenants.ts | behoben in PR #55 |
| R9 | S3 | `GRUDGE_MAX = 3` im Code (core + render) statt in balance.yaml. | lieutenants.ts:19, render/board/lieutenant.ts:17 | behoben in PR #55 |
| R33 | S2 | (QA) Folgen-Karte bei `grudge`-Wirkung: fester Text „kommt schwächer zurück“ unabhängig vom Vorzeichen, Leutnant nicht genannt, delta ohne „+“. | ConsequenceCard.tsx:39, de/en.yaml:596 | behoben in PR #55 |

Empfehlung: `done` nach Merge von PR #55. Entscheidung Produktinhaber 2026-10-25: `done`.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- Coverage `src/core` (Statements/Branches/Functions/Lines) vorher 80,42 / 71,91 / 85 / 84,23 %, nachher 80,81 / 72,47 / 85,28 / 84,51 %. Hinweis: parallel zu anderen Läufen laufen `save`/`perf-bench`/`worker-replay` in Zeitüberschreitung; `pnpm test:coverage --testTimeout=120000 --maxWorkers=4` ist grün.
- `pnpm sim <map> --runs 50` vorher/nachher identisch (prologue_caravan 94 %, ch01_varnhold 77 %, ch02_silverbrook 89 % Siegquote; Züge, Verluste, Tote gleich).
- Browser-Probe (Dev-Helfer): `first`, `grudge_2` mit Name „Brenna“, `mock` mit Name des Gefallenen erscheinen als Sprechblase nach dem Bark des Gefährten.

### Completion Notes List

- Alle ACs umgesetzt; Status und `sprint-status.yaml` bewusst nicht geändert, nichts committet.
- Keine Migration nötig (additive Felder, `normalizeCampaign` füllt); im Decision-Log vermerkt.
- Zeile bei Ziel, das die Truppe verlassen hat (`c.left`): keine Zeile (nicht in der Story entschieden, siehe Bericht).
- KI-Bonus nur ab Groll >= 1 (Entscheidung des Produktinhabers).
- Dev-Helfer: `__hc.devLieutenant([['hask', 2, 'brenna'], ['morra', 0, 'kael', 'first'], ['ulvric', 1, 'fenn', 'mock']])` (id, Groll, Ziel, Art `first|grudge|mock`).

### File List

- neu: `src/core/campaign/lieutenants.ts`, `src/app/battle/ltLines.ts`, `tests/unit/lieutenants-grudge.test.ts`
- geändert: `src/core/state.ts`, `src/core/index.ts`, `src/core/defs.ts`, `src/core/campaign/{campaign,conditions,effects,commands}.ts`, `src/core/battle/setup.ts`, `src/core/ai/ai.ts`, `src/content/validate.ts`, `content/core/balance.yaml`, `src/app/battle/barks.ts`, `src/app/screens/{Battle,Scene}.tsx`, `src/ui/SpeechBubbles.tsx`, `src/app/state/flow.ts` (Dev-Helfer), `tests/unit/{day,story}.test.ts`, `concept/24-architecture/decision-log.md`

## Change Log

- 2026-10-25: Story 3.3 umgesetzt (Groll, Groll-Ziel, Zeilen im Kampf).
- 2026-10-25 Kontrolleur: Checks grün (477 Tests), Sim der drei Karten unverändert, Screenshot der Groll-Zeile; Status review.
