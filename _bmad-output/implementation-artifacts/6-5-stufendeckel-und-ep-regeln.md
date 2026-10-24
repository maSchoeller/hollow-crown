# Story 6.5: Stufendeckel und EP-Regeln

Status: review

## Story

Als Spieler
möchte ich, dass meine Truppe in Akt 1 nicht davonläuft,
damit Akt 2 noch Herausforderung bietet.

## Acceptance Criteria

1. **Deckel aus der Akt-Kampagne:** `campaign.yaml` des Akts trägt `levelCap` (Akt 1: 10; Schema optional, ohne Angabe gilt `balance.levels.max`). Der Kern liest den Deckel über eine Funktion `levelCap(data)`, nie als Zahl im Code.
2. **EP verfallen am Deckel:** Erreicht eine Einheit den Deckel, verfallen weitere EP; `exp` bleibt 0. Das `exp`-Event trägt dann `capped: true` (auch wenn ein Teil der EP noch zum Aufstieg auf den Deckel gereicht hat). `battleExp` zählt nur die angerechneten EP.
3. **UI:** Figur-Ansicht (Truppe) zeigt am Deckel „Stufe 10 · Deckel in Akt 1“ statt der EP-Zeile; das Ergebnis zeigt bei gedeckelten Figuren den Hinweis „Deckel“ statt eines Aufstiegs ins Leere. Texte über `de.yaml`/`en.yaml`.
4. **Leutnant wie Boss:** Map-Einheiten können `lieutenant: <id>` tragen (Architektur §5.5); Besiegen/Vertreiben eines Leutnants gibt +20 EP (`experience.bossBonus`) wie ein Boss. Kein Umbau der Kampfformel: `combatExp` erkennt Leutnants selbst, `combat.ts` bleibt unverändert.
5. **EP-Regeln laut GDD getestet:** Kampf 10 + Δ (1–30), Besiegen 30 + 3Δ (10–100), Boss/Leutnant +20, Heilen 12 (+3 je Zusatzziel, soweit vorhanden), Bergen/Ansprechen 10, Profiklasse +15 effektive Stufen, 100 EP je Stufe.
6. Prüfungen grün: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`.

## Tasks / Subtasks

- [x] T1 Content: `levelCap` in `campaignSchema` + `CampaignDef`, `levelCap: 10` in `content/acts/act1/campaign.yaml`; `lieutenant` in `mapUnitSchema`/`MapUnitDef`/`BattleUnit`, `create.ts` übernimmt es
- [x] T2 Kern: `levelCap(data)` und Deckel in `grantExp` (`progression.ts`), `capped` am `exp`-Event (`events.ts`); `combatExp` zählt Leutnants als Boss
- [x] T3 Kern: `expProgress` liefert `capped`/`cap`; `UnitResult.capped` in `finishBattle`, `ResultFigure.capped` in `resultView.ts`
- [x] T4 UI: Troop-Figur und Ergebnis zeigen den Deckel; Texte de/en
- [x] T5 Tests: `tests/unit/progression-cap.test.ts` (Deckel, Teil-Verfall, Event, Leutnant, GDD-Formeln)
- [x] T6 Prüfungen, Entscheidungsprotokoll (`concept/21-gdd/.decision-log.md` falls nötig)

## Dev Notes

- **Ist-Zustand:** `grantExp` (`src/core/rules/progression.ts`) deckelt nur bei `balance.levels.max` (20) und setzt dort `exp = 0`; das `exp`-Event hat `amount/before/after`. `combatExp(data, u, foe, killed, boss)` wird in `combat.ts` mit `!!foe.boss` gerufen. Heilen (`apply.ts:263`) und Bergen/Ansprechen (`apply.ts:216/348`) rufen `grantExp` mit festen Balance-Werten.
- **Grenze zur Kampf-Session:** `combat.ts`/`apply.ts` nicht ändern (die Parallel-Session baut dort). Alles in `progression.ts`, `events.ts`, Schemas.
- **Akt-Pakete (7.x) / Akt-Struktur (4.x):** `data.campaign` ist heute die Akt-1-Kampagne. `levelCap(data)` liest `data.campaign.levelCap`; mit mehreren Akten wählt die Paket-Session die aktive Kampagne, die Funktion bleibt.
- **Heilen +3 je Zusatzziel:** `healExtraTarget` steht in `balance.yaml`; Mehrziel-Heilung gibt es noch nicht, daher nur der Grundwert im Test.
- **Leutnant-Flucht** (0 TP → `fled`) ist Epic 3. Heute zählt `killed` über `gone/downed`; ein späteres `fled` muss dort mitgezählt werden (Hinweis an Epic 3).
- UI-Regeln: Beträge als Symbol + Zahl (`Amount`), Stil B, Styles je Screen (`troop.css`, `result.css`).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Completion Notes List

- Deckel umgesetzt wie in AC 1–2; am Deckel kommt weiter ein `exp`-Event mit `capped: true` (vorher gar keins bei Höchststufe), damit die UI den Verfall melden kann.
- Leutnant-Bonus über `foe.lieutenant` in `combatExp`; `combat.ts` und `apply.ts` unverändert. Hinweis an Epic 3: `fled` muss in `combat.ts` (`killed`) mitzählen, das gehört zur Kampf-Session.
- Heilen +3 je Zusatzziel: Wert steht in `balance.yaml`, Mehrziel-Heilung gibt es noch nicht; Test prüft die Werte.
- Simulation: Deckel 10 greift im PoC (Prolog bis Kapitel 2, Stufen 1–5) nicht; `pnpm sim` unverändert, Kurve über den Akt prüft Story 6.8.
- Prüfungen: lint, test (23 Dateien, 273 Tests), content:check, build grün.

### File List

- `content/acts/act1/campaign.yaml`, `content/core/locales/de.yaml`, `content/core/locales/en.yaml`
- `src/content/schemas.ts`, `src/core/defs.ts`, `src/core/state.ts`, `src/core/events.ts`, `src/core/battle/create.ts`
- `src/core/rules/progression.ts`, `src/core/campaign/camp.ts`, `src/core/campaign/campaign.ts`, `src/core/campaign/resultView.ts`
- `src/app/screens/Troop.tsx`, `src/app/screens/Result.tsx`, `src/app/screens/Result.css`
- `tests/unit/progression-cap.test.ts`, `concept/24-architecture/decision-log.md`

### Change Log

- 2026-10-24: Story-Datei angelegt (ready-for-dev).
- 2026-10-24: Umgesetzt, Status review.
