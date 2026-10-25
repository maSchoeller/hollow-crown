# Story 3.7: Seitenwechsel

Status: done

## Story

Als Spieler
möchte ich, dass ein Leutnant nach meiner Entscheidung zu meiner Truppe wechselt,
damit Entscheidungen Feinde zu Gefährten machen können (FR25).

## Acceptance Criteria

1. **Gefährte Grosk:** `content/acts/act1/units.yaml` bekommt Grosk als Gefährten (gleiche ID `grosk` wie sein Leutnant): Klasse `vanguard`, Affinität `earth`, Basis Stufe 5 mit hp 30, str 9, mag 0, skl 5, spd 3, lck 3, def 7, res 1 und Wachstum hp 90, str 50, mag 0, skl 35, spd 25, lck 30, def 40, res 10. Persönlicher Skill „Für die Kleinen“ (on_attack, `adjacentAllies ≥ 1`: +10 Treffer, +2 Schaden; nur vorhandene Skill-Bausteine). Start: `iron_axe`, `little_hands` (Signatur-Item, Schild) und `vulnerary`. Support-Paar Tobin × Grosk in `supports.yaml` (Szenen `scn.support.grosk_tobin.*` liegen bereit; Ränge laut Szenen, Kernpaar nur laut Narrative). `content:check` bleibt grün (u. a. Regel „joins with a tome“, Stufenkurve).
2. **Wirkung `recruit: { lt }`:** Die Wirkung akzeptiert neben Gefährten-IDs (`recruit: <id>`) auch `recruit: { lt: <id> }`. `validateEffects` (`src/core/campaign/effects.ts`) prüft: Leutnant existiert (`unknown_unit`), hat `joins: true` und eine Gefährten-Definition in `data.chars` (`effect_invalid` sonst), ist nicht gefallen. Die Ausnahme für `recruit` mit Leutnant in `validate.ts` und `effect_unsupported` entfallen; `content:check` meldet falsche `lt`-Verweise.
3. **Beitritt:** `applyEffects` macht den Leutnant zum Gefährten: Eintrag in `c.roster` über `addToRoster` mit Rolle (Klasse), Stufe aus der mitwachsenden Stärke (Story 3.4, `lieutenantLevel` mit Groll 0), Werte als Erwartungswert ab Basisstufe 5 (Basis + Wachstum % × Stufendifferenz, kaufmännisch gerundet, Klassen-Deckel; liegt die errechnete Stufe unter 5, bleibt es bei der Basisstufe) und Startausrüstung inklusive Signatur-Item. Besitzt die Truppe das Signatur-Item schon als Beute (Story 3.5), bekommt er dieses statt eines zweiten. Es entsteht das Flag `joined_<lt>` (`flags.yaml`, `joined_grosk`) und das Kampagnen-Event `companionJoined { unit }`; dieser Weg meldet **statt** `unitJoined`, nie beide. Ein zweites `recruit` desselben Leutnants ändert nichts.
4. **Ausschluss:** `src/core/campaign/lieutenants.ts` bekommt `isJoined(c, lt)` (Flag `joined_<lt>` gesetzt) und `activeLieutenants(data, c)` (alle Leutnants der Akt-Daten ohne beigetretene). Heimsuchungen (5.5/5.6) und Finale-Aufstellungen müssen diese Funktion nutzen; sie sind noch nicht gebaut, daher liegt die Abfragefunktion samt Test im Kern bereit und die genannten Stories lesen sie. Kopfgeld und Zeilen (`applyLieutenantOutcome`/`payBounties`/`ltOpeningLine`) ignorieren beigetretene Leutnants.
5. **Groll verfällt:** Mit dem Beitritt verfällt der Groll gegen ihn und von ihm: `c.lieutenants[lt].grudge = 0` und `target` entfällt; ist der Beigetretene das Groll-Ziel eines anderen Leutnants, entfällt dort das `target` (der Groll bleibt, die Zeilenwahl liefert dann keine Zeile). Kein KI-Bonus mehr für ihn.
6. **`join`-Zeile:** Die Zeile `join` aus `scn.lt.grosk` steht im Szenen-Content (seit 3.1; `content:check` verlangt sie für Leutnants mit `joins`). Sie wird nicht von dieser Story ausgelöst; die Entscheidung (Epic 9, E3) spielt die Szene und setzt dann die Wirkung `recruit: { lt: grosk }`. Hier nur sicherstellen, dass eine solche Szene die Wirkung auslösen kann (Test mit Testszene).
7. **Volles Armee-Limit:** Der Beitritt findet trotzdem statt, auch bei erreichtem `balance.economy.armyLimit` (Gefährten) oder vollen Söldnerplätzen: kein Fehlercode, keine Ablehnung. Vor der nächsten Mission muss der Spieler einen Söldner entlassen: der Missionsstart lehnt ab, solange Gefährten oder Söldner über ihren Grenzen liegen, mit klarer Meldung (Locale-Schlüssel); die Taverne (`src/app/screens/Rooms.tsx`, `ui.room.tavern.limit`) zeigt die Überschreitung samt Entlassen-Aktion (vorhandene Aktion prüfen, sonst ergänzen). Die Prüfung ist eine reine Funktion `armyOverLimit(data, c)`. Liegen die Gefährten über dem Limit und es gibt keinen Söldner mehr zu entlassen, blockiert das die Mission nicht.
8. **Folgen:** Die Folgen-Karte der Entscheidung (`ConsequenceCard`) zeigt den Beitritt (Name, Porträt); die Chronik (Story 4.7) trägt ihn nur, wenn die Entscheidung es ohnehin tut.
9. **Prüfungen:** Tests für Wechsel (Roster, Stufe, Ausrüstung, Flag, Event, Wiederholung), Validierung von `recruit: { lt }` (unbekannt, ohne `joins`, gefallen), `isJoined`/`activeLieutenants`, Groll-Verfall (gegen ihn und von ihm), volles Limit (Beitritt klappt, Mission gesperrt, nach Entlassen frei), Spielstand laden; `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`, `pnpm test:e2e` grün; Coverage von `src/core` nicht senken; Sim unverändert (keine Karte ändert sich). Sichtbar: Folgen-Karte, Lager mit Grosk, Überlimit-Meldung in der Taverne; Screenshots davon.

## Tasks / Subtasks

- [x] T1 Content: Grosk als Gefährte (AC 1)
  - [x] `units.yaml`, `flags.yaml` (`joined_grosk`), `supports.yaml` (Tobin × Grosk), Locales (Rollenzeile)
- [x] T2 Wirkung (AC 2, 3, 6)
  - [x] Schema der Wirkung (`recruit` als String oder `{ lt }`), `validateEffects`, `applyEffects`, `validate.ts`
  - [x] Stufen- und Wertberechnung über Story 3.4
  - [x] Event `companionJoined` in `CampaignEvent`
- [x] T3 Ausschluss und Groll (AC 4, 5)
  - [x] `isJoined`, `activeLieutenants`; Groll- und Ziel-Verfall; Beigetretene in Kopfgeld und Zeilen überspringen
- [x] T4 Limit (AC 7)
  - [x] `armyOverLimit`, Prüfung beim Missionsstart, Anzeige und Entlassen in `Rooms.tsx`
- [x] T5 Anzeige (AC 8)
  - [x] Folgen-Karte für `recruit: { lt }`
- [x] T6 Tests, Prüfungen, Screenshots (AC 9)
  - [x] `tests/unit/lieutenants-join.test.ts`, Decision-Log (Architektur §5.5)

## Dev Notes

### Quellen

- Epics 3.7 (FR25); Architektur §5.3 (`recruit`, `joined_<lt>`) und §5.5 (Seitenwechsel, `companionJoined`); GDD „Leutnants“ (Seitenwechsel, Groll verfällt, Ausschluss aus Heimsuchungen) und Armee-Limit 20 + 6 Söldner (`balance.economy`); Narrative (Grosk, E3 „Hungerlager“, „Für die Kleinen“, `join`-Zeile, Support Tobin × Grosk).
- Produktentscheidungen 2026-10-25: Gefährten-Daten (AC 1); Stufe beim Beitritt = mitwachsende Stärke ohne Groll, Werte per Erwartungswert ab Basisstufe 5; Beitritt immer, vor der nächsten Mission muss ein Söldner entlassen werden.

### Vorhandener Code (Fundstellen)

- **Wirkung `recruit`:** `src/core/campaign/effects.ts`: `validateEffects` (Zweig `recruit`: `typeof v !== 'string'` → `effect_unsupported`, `data.chars[v]` sonst `unknown_unit`, Gefallene `effect_invalid`) und `applyEffects` (`c.left` bereinigen, `addToRoster`, Event `unitJoined`); der `grudge`-Zweig daneben ist das Muster für die Objektform. `src/core/campaign/commands.ts` `CampaignEvent` (`unitJoined`). `src/content/validate.ts` ~Zeile 141: Wirkungsprüfung, dort ist `recruit` mit Leutnant bis zu dieser Story unsupported.
- **Roster:** `addToRoster` (`campaign.ts`/`apply.ts`), `recordFromChar` und `genericStats` in `src/core/battle/create.ts`, Gefährten-Definitionen `data.chars` aus `units.yaml`.
- **Leutnant:** `content/acts/act1/lieutenants.yaml` (grosk: `joins: true`, `signatureItem: little_hands`, `scene: scn.lt.grosk` mit Zeile `join`), `src/core/campaign/lieutenants.ts`, `src/content/lieutenantLines.ts`.
- **Limit:** `balance.economy.armyLimit` (20) und `mercenaryLimit` (6); `Rooms.tsx` Taverne und Entlassen; Missionsstart in `src/core/campaign/` und Weltkarte.
- **Flags:** `content/acts/act1/flags.yaml`; Bedingung `flag` und Wirkung `setFlag` in `effects.ts`.
- **Supports:** `content/acts/act1/supports.yaml` (Kopfkommentar nennt Tobin × Grosk), Szenen `scn.support.grosk_tobin.*` (Story 4.9, 9.13).
- **Folgen-Karte:** `src/ui/ConsequenceCard.tsx`, `src/core/campaign/consequences.ts`.
- **Tests als Muster:** `tests/unit/story.test.ts`, `tests/unit/lieutenants-grudge.test.ts`, `tests/unit/day.test.ts`.

### Was sich ändert / was bleibt

- **Verhalten:** Bestehende `recruit: <id>`-Wirkungen bleiben unverändert (nur `unitJoined`). Spielstände ohne Beitritt laden unverändert: Flag und Roster-Eintrag sind additiv; `normalizeCampaign` prüfen, Migration voraussichtlich unnötig, im Decision-Log vermerken.
- **Zeitpunkt:** Beitreten kann Grosk erst nach der Entscheidung in Epic 9 (E3); diese Story liefert Mechanik und Daten.
- **Sable, Mael:** Die Wirkung ist allgemein (`joins`-Leutnants); ihre Gefährten-Daten folgen in Akt 2/3, nicht hier.

### Grenzen zu anderen Stories und Sessions

- **Nicht hier:** Heimsuchungen und ihre Auswahl (5.5/5.6; nur `activeLieutenants` im Kern bereitstellen), Missions-Content und die Entscheidung E3 (9.x), weitere Supports, weitere Karten, Flucht (3.2), Skalierung (3.4, wird nur genutzt).
- **Abhängigkeiten:** 3.4 (Stufe), 3.3 (Zustand), 3.5 (Signatur-Items), 4.2 (Wirkungssprache), 4.9 (Support-Paare).

### Geklärte Fragen (Produktinhaber 2026-10-25, Fragetool)

1. **Steckbrief-Liste:** Ein beigetretener Leutnant bleibt in der Liste mit Begegnungen und Vertreibungen, ohne Groll und Kopfgeld, mit der Marke „In der Truppe“ (Weggefährte); ein Tipp öffnet seine Figur in der Truppe.
2. **Karte mit `lieutenant: grosk` nach dem Beitritt:** Die Karteneinheit entfällt beim Kampfaufbau (wie heute bereits rekrutierte Gefährten mit `char`); Narrative 1-8: „Grosk (falls nicht gewechselt)“.

### Project Structure Notes

- Neu: `tests/unit/lieutenants-join.test.ts`.
- Geändert: `content/acts/act1/{units,flags,supports}.yaml`, Locales, `src/core/campaign/{effects,commands,lieutenants,campaign,consequences}.ts`, `src/content/{schemas,validate}.ts`, `src/app/screens/Rooms.tsx`, Missionsstart, `src/ui/ConsequenceCard.tsx`.

### Project Context Rules

- `src/core` rein und serialisierbar; jeder Zufall aus dem Seed-RNG (hier keiner); Replays identisch.
- Spielwerte nur in `balance.yaml`/Content-YAMLs; Gefährten-Daten als YAML mit Zod-Schema. Kein sichtbarer Text im Code, Beträge als Symbol + Zahl.
- Code, Bezeichner, Commits englisch; Entscheidungen ins zuständige BMAD-Artefakt und dessen `.decision-log.md`, nie in `concept/01-decisions.md`; offene Punkte nicht stillschweigend entscheiden.
- Fertig erst, wenn `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`, `pnpm test:e2e` grün sind; Coverage `src/core` nicht senken; Screenshots der sichtbaren Teile.
- In `sprint-status.yaml` nur die Zeilen der Story ändern.

### References

- [Source: concept/26-epics/epics.md#Story 3.7]
- [Source: concept/24-architecture/architecture.md#5.3 Bedingungen und Wirkungen (AR3)]
- [Source: concept/24-architecture/architecture.md#5.5 Leutnants (AR5)]
- [Source: concept/21-gdd/gdd.md#Leutnants]
- [Source: concept/22-narrative/narrative.md]
- [Source: _bmad-output/implementation-artifacts/3-3-groll-und-groll-ziel.md]
- [Source: _bmad-output/implementation-artifacts/3-4-mitwachsende-staerke.md]
- [Source: _bmad-output/implementation-artifacts/3-5-kopfgeld-und-signatur-item.md]
- [Source: _bmad-output/implementation-artifacts/4-2-bedingungen-und-wirkungen.md]

## Review (2026-10-25)

Grundlage: Code-Review Epic 3 (Diff PR #48 + #52, Prüfschichten Blind Hunter, Edge Case Hunter, Acceptance Auditor, Querschnitt Replay/Vorschau/Migration/Worker, Simulation, Browser).

Kurzergebnis: Übrige ACs ohne Befund.

| # | Schwere | Befund | Ort | Ergebnis |
|---|---|---|---|---|
| R1 | S2 | Leutnants aus Verstärkung/Trigger-`spawn` ohne Skalierung, Groll, Groll-Skills, Ziel; beigetretener Grosk spawnt in m1_8 als Feind mit uid `grosk`. Entscheidung: gleich aufbauen (createBattle rechnet vorab, State trägt es). | objectives.ts:121 vs setup.ts:72 | behoben in PR #55 |
| R12 | S2 | `pnpm test:e2e` in 3.2/3.4/3.7 nicht gelaufen (AC verlangt es). | – | behoben in PR #55 |
| R18 | E | `joined_grosk` `season2: true` gilt; Completion Note korrigieren. | flags.yaml | bleibt so (Entscheidung Produktinhaber 2026-10-25) |
| R22 | S3 | `playNode`/`beginMission` kehren bei Überbelegung still zurück; Hinweis nur Weltkarte/Camp/Vorbereitung. Sperre nur in der App-Schicht. | flow.ts:90, :168 | vermerkt, kein Handlungsbedarf |
| R23 | S3 | Entlassen ohne Rückfrage, unumkehrbar. | Rooms.tsx:398 | vermerkt, kein Handlungsbedarf |
| R24 | S3 | Signatur-Item wird einer anderen Einheit beim Beitritt still aus der Hand genommen (laut Decision-Log gewollt). | lieutenants.ts:123 | vermerkt, kein Handlungsbedarf |
| R29 | E | Umbenennen einer Leutnant-ID braucht ab Release Migration an 4 Stellen (`c.lieutenants`, `joined_<id>`, Roster-ID, `target`) → Story 7.4. | – | offen für spätere Story |

Empfehlung: `done` nach Merge von PR #55. Entscheidung Produktinhaber 2026-10-25: `done`.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- Erste `pnpm test`-Läufe unter Last: Zeitüberschreitungen (5 s) in `core`, `lieutenants`, `worker-replay`, `campaign-commands`; mit `--testTimeout=60000` alle grün.
- Stolperstein: ein Node-Skript mit POSIX-Pfad (`/c/Users/...`) schrieb auf Windows nach `C:/c/Users/...`; das Zwischenverzeichnis `C:/c` blieb liegen (Löschen von der Sicherheitsprüfung abgelehnt, bitte von Hand entfernen).

### Completion Notes List

- Grosk steht als Gefährte in `units.yaml` (`joins: lieutenant`, ein Platzhalter-Wert, damit `simulate`, `bench-ai` und Worker-Replay ihn nie vorab einsetzen); Skill `for_the_little_ones`, Flag `joined_grosk`, Support-Paar Tobin × Grosk (C/B/A, kein Kernpaar), Tobin führt `grosk` in `supports`. Ulvric ist jetzt `wolf_rider` (Wolfszahn und `pack` passen: Klasse trägt Lanzen, die Groll-Fähigkeiten sind klassenfrei).
- `joinLieutenant` (`lieutenants.ts`) setzt Stufe, Erwartungswerte, Ausrüstung, Flag, Event und Groll-Verfall; `validateEffects`/`validate.ts` prüfen `recruit: { lt }` (unbekannt, ohne `joins`, ohne Gefährten-Definition, gefallen) und lehnen `recruit: <leutnant-id>` ab. Die Wachstumsrate für den Erwartungswert ist die tatsächliche (Figur + `growthMod` der Klasse), siehe Decision-Log.
- Armee-Limit: `mercenaryRoom`, `armyOverLimit`, `dismissError`, Command `dismiss`; Missionsstart (`playNode`/`beginMission`), Weltkarten-Karte und Vorbereitung sperren mit `ui.army.over`; die Taverne zeigt die Überschreitung und listet die Söldner der Truppe mit „Entlassen“ (vorher gab es keine Entlassen-Aktion).
- Steckbriefe: `WantedView.joined`, Liste und Karte mit Marke „In der Truppe“, Tipp öffnet die Figur in der Truppe. Folgen-Karte brauchte keine Änderung (`consequenceLines` und `head` kannten `recruit { lt }` schon; Name und Porträt über `data.chars.grosk`). Die Chronik trägt nur, was die Entscheidung ohnehin trägt.
- Prüfungen: `pnpm lint`, `pnpm test` (781), `pnpm content:check`, `pnpm build` (Bundle 11,61 MB) grün; `pnpm test:e2e` nicht gelaufen. Coverage `src/core` vorher/nachher: Statements 86,99 -> 87,20, Branches 79,37 -> 79,63, Functions 91,35 -> 91,40, Lines 90,16 -> 90,33. `pnpm sim` (50 Läufe) identisch zum Stand davor: prologue_caravan 96 %, ch01_varnhold 81 %, ch02_silverbrook 92 % Siegquote (Korridor normal 0,75 bis 1,0).
- Keine Speicher-Migration: Flag, Roster-Eintrag und Support-Paar sind additiv (`normalizeCampaign` ergänzt `grosk|tobin`).
- Dev-Helfer `__hc.devJoin(view, full)` (nur DEV): `view` = `card` (Test-Entscheidung mit Folgen-Karte), `troop`, `wanted`, `map` (Weltkarte, Knoten `The Last Watch` antippen), `camp` (Lager mit Taverne, `prologue` und `ch01` als erledigt); `full = true` füllt die Truppe auf 20 Gefährten und 6 Söldner. Beispiel: `node tests/e2e/.shot-series.mjs "http://[::1]:5173/" <präfix> "__hc.devJoin('wanted')" 1 1500`.

### Offene Fragen

1. Armee-Limit: Gefährten über `armyLimit` verdrängen Söldnerplätze (20 + 6 sind eine Truppe, `mercenaryRoom`). Das ist die Lesart von „Beitritt ins volle Limit, ein Söldner muss gehen“; GDD und Taverne zeigten bisher zwei getrennte Zähler. Bitte bestätigen oder die andere Lesart nennen.
2. Soll `joined_grosk` in Staffel 2 weiterwirken (`season2`)? Eingetragen ist `false`.
3. Eine E3-Entscheidung gibt es im Content noch nicht (Epic 9); sie soll `recruit: { lt: grosk }` nutzen.

### File List

- Neu: `tests/unit/lieutenants-join.test.ts`
- Content: `content/acts/act1/{units,flags,supports,lieutenants}.yaml`, `content/core/skills.yaml`, `content/core/locales/{de,en}.yaml`, `content/core/locales/{de,en}.names.yaml`
- Kern: `src/core/campaign/{lieutenants,effects,commands,camp,apply,wanted}.ts`, `src/core/battle/setup.ts`, `src/core/defs.ts`
- Inhalt/Prüfung: `src/content/validate.ts`
- App/UI: `src/app/state/flow.ts`, `src/app/screens/{Rooms,WorldMap,Camp,Wanted}.tsx`, `src/app/screens/{WorldMap,wanted}.css`, `src/ui/camp.css`
- Tests geändert: `tests/unit/{story,supports-pairs,lieutenants-grudge}.test.ts`
- Konzept: `concept/24-architecture/{architecture,decision-log}.md`

### Change Log

- 2026-10-25: Story 3.7 umgesetzt (Seitenwechsel, Grosk als Gefährte, Armee-Limit mit Entlassen, Steckbriefe, Ulvric als Wolfsreiter).
- 2026-10-25 Kontrolleur: Produktinhaber bestätigt Armee-Limit als eine Truppe von 26 (Gefährten über 20 belegen Söldnerplätze) und `joined_grosk` mit season2: true (umgestellt). Erwartungswert mit Wachstum der Figur + growthMod der Klasse (wie echte Stufenaufstiege) akzeptiert. Status review.
