# Story 5.4: Tageswechsel

Status: review

## Story

Als Spieler
möchte ich jeden Tag neue Heimsuchungen finden, ohne dass mir etwas wegläuft,
damit ich gern, aber nicht aus Pflicht zurückkomme.

## Acceptance Criteria

1. **Tagesnummer:** `src/app/day.ts` mit `dayNumber(now, resetHour)`: Tageswechsel 04:00 Ortszeit (`balance.yaml day.resetHour`); einzige Wanduhr der Kampagne.
2. **Command:** Öffnet die Weltkarte oder kehrt die App (wieder sichtbar) auf die Weltkarte zurück, schickt die App `advanceDay{ day }`, sofern `day` neuer ist als `c.day.last`. Der Kern erzeugt Tagespakete für höchstens die letzten 3 Tage bis `day` (`balance.yaml day.catchUp`) und setzt `c.day.last = day`.
3. **Uhr nur vorwärts:** Ist `day ≤ last`, passiert nichts (zurückgestellte Uhr erzeugt nichts).
4. **Keine Heimsuchungen vor dem ersten Leutnant:** Vor der ersten Leutnant-Begegnung (`c.lieutenants[*].met`) entstehen keine Tagespakete; `last` rückt trotzdem vor.
5. **Hinweis:** Mit neuen Tagespaketen zeigt die Weltkarte „Neuer Tag: n Heimsuchungen · nächste ab morgen 4:00“ (Uhrzeit aus `day.resetHour`).
6. **Sommerzeit:** Der Wechsel auf und von Sommerzeit ändert die Tagesnummer nicht (Test mit `TZ=Europe/Berlin`).

## Tasks / Subtasks

- [x] T1 `balance.yaml` Abschnitt `day` (`resetHour`, `catchUp`) + Schema + Typ (AC 1, 2)
- [x] T2 Kern: `CampaignState.day = { last, pending }`, optional `lieutenants` (Zustand kommt mit Epic 3), Default in `newCampaign`/`normalizeCampaign`; `src/core/campaign/day.ts` (`advanceDay`, `metLieutenant`); Command `advanceDay`, Fehler `invalid_day`, Event `dayAdvanced { day, packets, haunts }` (AC 2–4)
- [x] T3 App: `src/app/day.ts`; `flow.advanceToToday()` (schickt nur, wenn der Tag neuer ist); `WorldMap` ruft es beim Öffnen und bei `visibilitychange`, zeigt den Hinweis (AC 2, 5)
- [x] T4 Texte `ui.map.newDay` (de, en) (AC 5)
- [x] T5 Tests: Kern (Stau 3, Uhr rückwärts, ohne Leutnant, Wiederholung im Journal), `dayNumber` mit Sommerzeit, Hinweistext (AC 2–6)
- [x] T6 Checks grün, Screenshot Weltkarte

## Dev Notes

- Architektur §5.6 und ADR-2: der Kern sieht nie eine Uhr; nur `src/app/day.ts` liest `Date.now()`. Tagespakete aus `hash32(seed, day)` erzeugt Story 5.5 (Generator, Anker je Karte); bis dahin ist ein Paket nur die Tagesnummer in `c.day.pending` und bringt 0 Heimsuchungen.
- `c.lieutenants` gibt es noch nicht (Epic 3, AR5). Das Feld wird hier optional mit `met` angelegt; Epic 3 erweitert es. Bis dahin entstehen keine Pakete, also auch kein Hinweis.
- Commands gehen ins Journal; deshalb schickt die App `advanceDay` nur bei einem neuen Tag (kein Rauschen im Journal).
- UX: kein Countdown, kein Täglich-Druck (EXPERIENCE.md „Vermeiden“): nur der kurze Hinweis.

### References

- [Source: concept/26-epics/epics.md#Story 5.4]
- [Source: concept/24-architecture/architecture.md#5.6 Tageswechsel und Heimsuchungen, ADR-2]
- [Source: concept/25-ux/EXPERIENCE.md#Zustände Weltkarte]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm lint` grün, `pnpm test` 340 Tests grün (neu `tests/unit/day.test.ts`, 10 Tests, Prozess in `TZ=Europe/Berlin`), `pnpm content:check` OK, `pnpm build` grün (erster Download 9,01 von 15,00 MB), `pnpm test:e2e` 12 von 12.
- Browser 375 × 812 (Deutsch): mit gesetztem Leutnant und `day.last` = gestern zeigt die Weltkarte „Neuer Tag: 0 Heimsuchungen · nächste ab morgen 4:00“ (zweizeilig); `c.day` danach `{ last: heute, pending: [...] }`; ohne Leutnant kein Hinweis.

### Completion Notes List

- **Fehler im Architektur-Muster behoben:** `dayNumber` rechnete „Zeitstempel − 4 h“; in den Umstellungsnächten springt der Tag dann um 05:00 bzw. 03:00. Jetzt zählen lokales Datum und lokale Stunde; Muster in `architecture.md` §5.6 angepasst.
- Bis Story 5.5 bringen Tagespakete 0 Heimsuchungen (der Hinweis nennt 0); vor Epic 3 gibt es keine Leutnant-Begegnung, im Spiel erscheint der Hinweis also noch nicht.
- Die Weltkarte meldet sich erst nach `scene.whenReadyAsync()` als geladen (vorher zeigte sie einige Sekunden leeres Meer ohne Ladestein).
- Hinweise auf der Weltkarte dürfen zwei Zeilen haben (`.wm .toast`).

### File List

- `src/app/day.ts` (neu), `src/app/state/flow.ts` (`advanceToToday`), `src/app/screens/WorldMap.tsx`, `src/app/screens/WorldMap.css`
- `src/core/campaign/day.ts` (neu), `src/core/campaign/{apply,commands,campaign}.ts`, `src/core/state.ts`, `src/core/index.ts`, `src/core/defs.ts`
- `src/content/schemas.ts`, `content/core/balance.yaml`, `content/core/locales/{de,en}.yaml`
- `src/render/world/world.ts`
- `tests/unit/day.test.ts` (neu)
- `concept/24-architecture/{architecture,decision-log}.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`
