---
baseline_commit: afd4258
---
# Story 11.6: Balliste

Status: review

## Story

Als Spieler
möchte ich Ballisten bedienen, erobern und gegen mich gerichtet sehen,
damit Geschütze den Akt taktisch prägen.

## Acceptance Criteria

1. **Bedienen:** Steht eine Figur (jedes Team) auf einem Nachbarfeld eines Kartenobjekts `type: ballista`, bietet `availableActions` je Balliste eine Option `ballista` mit `object` und `targets`; das Command ist `{ kind: 'ballista'; object; target }`. Werte aus dem Item `ballista_bolt` in `content/core/items.yaml` (`mt: 12`, `hit: 70`, `crit: 0`, `rng: [3, 10]`, Gruppe `siege` außerhalb des Waffendreiecks, Tag `fixed`), Schaden mit STR des Bedieners, kein Gegenangriff, kein Doppelschlag, kein Tandem, unbegrenzte Munition; der Schuss ist die Aktion der Figur.
2. **Fernkampf:** Reichweite vom Ballistenfeld gemessen; die vorhandene Höhenregel (`canStrike`, `elevation.rangedBonus`) gibt von höherer Stufe +1. Unter Nebel nur Ziele, die das Team des Bedieners sieht.
3. **Eine Formel:** Vorschau und Auflösung rufen `forecast` mit `AttackMods.siege = { weapon: ballista:<objectId>, from }` (synthetische Waffe); `ballistaForecast` ist die Vorschau für UI und KI.
4. **Feld:** Das Ballistenfeld ist nicht betretbar (Gelände `ballista`, `content:check` verlangt es unter jedem Ballisten-Objekt).
5. **Kontext-Band:** bietet „Balliste“ an (Schlüssel in `content/core/locales/de.yaml`/`en.yaml`), danach Zielwahl und Kampfvorschau wie beim Angriff.
6. **KI:** Ein Gegner nutzt die Balliste nur mit Profil `hold` (darf dafür auf ein Nachbarfeld ziehen) oder wenn er schon daneben steht, und nur wenn der Schuss besser bewertet ist als sein bester Angriff; das Autoplay des Spielers wertet Ballistenschüsse wie Angriffe und nimmt den besseren; die Gefahrenzone (`threatTiles`, Story 13.5) zählt Bediener mit Ballisten-Reichweite.
7. **Lektion:** `scn.m2_1.tutorial_ballista` (DE in der Szene, EN in `content/locales/en/act2.dialogue.yaml`, Boxen ≤ 110 Zeichen) und Handbuch-Einträge `ballista` (Gelände, Werte als Content-Pfade) und `lesson_ballista` (Kontext-Anker `lesson.scn.m2_1.tutorial_ballista`), beide `fromAct: 2`. Ausgelöst wird die Lektion erst in Story 11.12.
8. **Tests:** `tests/unit/ballista.test.ts` deckt Nachbarschaft, Reichweite 2/3/10/11, Höhe, Nebel, kein Gegenangriff, Vorschau = Auflösung, Leutnant-Flucht, KI-Regel und Replay ab.
9. **Akt 1 unverändert:** keine Akt-1-Karte hat eine Balliste; `pnpm sim --campaign act1 --runs 50 --seed 1` ist identisch zur Baseline; `pnpm check` grün; Coverage `src/core` sinkt nicht.

## Tasks / Subtasks

- [x] Content (AC 1, 4): Item `ballista_bolt`, Waffengruppe `siege` (`WEAPON_GROUPS`, `ui.weapon.siege`), `canEquip` lehnt `fixed` ab; Gelände `ballista` (unbetretbar); `balance.ballista` (`item`, `crew`); Prüfung „Ballisten-Objekt braucht Gelände ballista“; Fixture `asset_catalog` angepasst.
- [x] Kern (AC 1–3): `src/core/rules/ballista.ts` (Waffe, Reichweite, Bediener, Ziele, Vorschau, Bedienfelder); `AttackMods.siege` in `combat.ts`; Action in `commands.ts`; Option in `actions.ts`; Prüfung und Wirkung in `apply.ts`; Schuss je Balliste und Phase (Zustand `open`, Rücksetzen bei Phasenbeginn).
- [x] KI (AC 6): `ballistaPlans` in `ai.ts`, Einbau in `aiAct`; Autoplay mischt die Pläne; `threatTiles` zählt Bediener.
- [x] UI (AC 5): Kontext-Band, Symbol `ballista`, Modus Ziel/Vorschau/Bestätigen in `battleMode.ts`, `useBattleInput.ts`, `Battle.tsx`.
- [x] Lektion (AC 7): Paket `act2` (`released: false`) in `content/packs.yaml`, Szene, EN-Texte, Handbuch und Locales.
- [x] Tests (AC 8, 9): `tests/unit/ballista.test.ts`, `pnpm check`, Coverage, Sim-Diff Akt 1, Bild 375 × 812.
- [x] Decision-Log `concept/21-gdd/decision-log.md` mit den Annahmen.

### Review Follow-ups (AI)

- [x] [AI-Review][High] `bossKilledWith`: Ballistenschuss zählt als `siege`, nie als `bow` (`kill_with: bow` bleibt unerfüllt).
- [x] [AI-Review][High] Waffenart-gebundene Skills gelten nicht für den Bolzen (`WeaponProfile.fixed`, `conditionMet`); eine Verteidiger-Bedingung „gegen Bogen“ gibt es im Skill-Schema nicht.
- [x] [AI-Review][High] Bediener steht auf der Höhenstufe der Balliste (`crewLevelFits`).
- [x] [AI-Review][Med] Validierung: `balance.ballista.item` (bekannt, Waffe mit `mt`/`rng`, Tag `fixed`), Gelände `ballista` ohne Objekt, `links` auf eine Balliste, `object_activated` auf eine Balliste; `object_activated` nimmt Ballisten in `objectives.ts` aus.
- [x] [AI-Review][Med] KI-Bediener: jedes wache Profil außer `flee` schießt, wenn es daneben steht (schlafende `trigger` nicht), `hold` darf hinlaufen; Heiler/`support` heilen zuerst; `hunt` mit erreichbarem Ziel schießt nur auf das Ziel.
- [x] [AI-Review][Med] Tests der Abwägung (bewaffneter Bediener: besserer Schlag gegen Schuss, Spiegelfall), Autoplay mit bewaffnetem Bediener und Schonung rekrutierbarer Ziele.
- [x] [AI-Review][Med] Probekarte: Sieg und eigener Ballistenschuss im Autoplay; `afterAll` setzt `data.maps`/`data.campaign` zurück; leere Asserts ersetzt; Reiter bedient nicht.
- [x] [AI-Review][Low] `BattleHud.tsx`: Chip über einen Schlüssel `ui.fc.ballista`, kein Doppelpunkt im Code.
- [x] [AI-Review][Low] `threatTiles`/`crewSpots`: eine Pfadsuche, Ursprünge werden übergeben.
- [x] [AI-Review][Low] `apply.ts`: Helfer `quoteOnce` statt dreifach kopiertem Block.
- [x] [AI-Review][Low] `canEquip`: `fixed` vor dem Taschen-Return; der Bolzen kommt in keine Tasche.
- [x] [AI-Review][Med] Nebel in der Vorschau nach Bewegung: Sicht vom Zielfeld des Bedieners.
- [x] [AI-Review][Low] UI: Guards für fehlendes `object`; `useBoardOverlays` markiert im Modus „moved“ auch Ballisten-Ziele.
- [x] [AI-Review][Low] Texte: EN „Siege engine“, EN-Stichwort „engine“, Bolzen-Beschreibung mit Reichweite als Parameter (`{rngMin}`/`{rngMax}` aus items.yaml) und „einmal je Phase“; Lektion: die Regeln sagt Lucan (kein `fallback: skip`), Brenna nur als Auftakt.

## Dev Notes

- **Quellen:** Epic 11 Story 11.6 und Einleitung; GDD „Gelände und Umwelteffekte“ (Balliste: Mt 12 + STR, Treffer 70, Reichweite 3–10, kein Gegenangriff, unbegrenzt, Fuß- oder gepanzerte Figur auf Nachbarfeld, kein Flieger, keine Effektivität gegen Flieger, KI nur `hold` oder schon daneben); Architektur §8 (Vorschau = Auflösung, Spielwerte im Content, RNG nur im State, Konsistenzregeln §8.7).
- **Vorhanden:** `type: ballista` in Schema, `MapObjectDef`, `ObjectState`; Brett zeichnet `ballista_idle` (Paket core, `boardProps.ts`); Level-Sheet-Glyphe `Ba`.
- **Formel:** `forecast(…, mods)` und `resolveAttack(…, mods)` sind die eine Stelle; `calcSide` rechnet mit der synthetischen Instanz `{ uid: 'ballista:<id>', def: 'ballista_bolt' }` (über `weaponProfile`), STR + mt − DEF, Treffer wie jede Waffe. `siege` schaltet Gegenangriff, Doppelschlag und Tandem ab; Schutz (Guard) des Verteidigers bleibt. Distanz vom Ballistenfeld, Werte des Bedieners auf seinem Feld.
- **Höhe/Nebel:** `canStrike(data, s, unit, ballista.at, target, rng, target)` – Distanz ≥ 3, also nur die Fernkampf-Regel. Nebel: `fogOn` → `visibleTiles(team)`.
- **Act-1-Sicherheit:** Jede neue Verzweigung prüft zuerst, ob der Kampf eine Balliste hat; ohne Balliste keine neuen RNG-Züge, keine neuen KI-Kandidaten, gleiche Sortierung.
- **Parallel-Session:** `schemas.ts`/`validate.ts` nur minimal (Balance-Schlüssel, eine Prüfzeile).
- **[ASSUMPTION] weaponType:** `ballista_bolt` hat `weaponType: bow` (physischer Fernkampf, außerhalb des Dreiecks), damit kein neuer Regeltyp nötig ist; als feste Waffe (`fixed`) gelten keine an eine Waffenart gebundenen Skills (Review), Reichweiten-Skills ohnehin nicht; keine `effectiveVs`. Ein Bosskill mit der Balliste zählt als `siege`.
- **[ASSUMPTION] Höhe des Bedieners (Review):** Der Bediener steht auf derselben Höhenstufe wie die Balliste (z. B. beide auf dem Wehrgang); so passen Reichweite vom Ballistenfeld und Höhenbonus zusammen.
- **[ASSUMPTION] Ein Schuss je Balliste und Phase:** „ein Schuss je Zug“ gilt je Balliste: nach dem Schuss steht das Objekt auf `open`, zu Beginn jeder Phase wieder `closed` (kein neues Feld im Speicherformat). Ein Trigger `object_activated` auf die Balliste feuert beim ersten Schuss.
- **[ASSUMPTION] Bediener:** Bewegungsart aus `balance.ballista.crew` (`foot`, `armored`); Reiter, Flieger, Monster bedienen nicht (GDD).
- **[ASSUMPTION] KI-Bediener (nach Review, Epic/GDD „wenn er schon daneben steht“):** Jeder wache Gegner außer `flee` schießt, wenn er schon daneben steht und der Schuss besser bewertet ist als sein bester Angriff; schlafende `trigger` nie. `hold` darf dafür auf ein freies Nachbarfeld ziehen. Heiler und `support` heilen zuerst, wenn sie können. `hunt` mit Ziel schießt nur auf das Ziel, solange die Balliste es erreicht, sonst normale Bewertung.
- **[ASSUMPTION] Gelände:** Unter jeder Balliste liegt das neue Gelände `ballista` (unbetretbar für alle Bewegungsarten, wie ein Hebel-Feld, ohne eigene Requisite: das Objekt zeichnet das Modell).
- **[ASSUMPTION] Bild des Items:** `image: iron_bow` (Platzhalter), da kein Item-Bild der Balliste existiert; das Item liegt nie in einem Inventar.
- **[ASSUMPTION] Paket act2:** minimal mit `released: false` angelegt (nur Szene und EN-Texte); 11.1/11.3 bauen Kampagne und Freischaltung. Die Handbuch-Einträge stehen in `core/handbook.yaml` mit `fromAct: 2`; im veröffentlichten Build fehlt die Szene, die Lektion zeigt dann `handbook.ui.lessonMissing` (vorhandenes Verhalten), bis `act2` veröffentlicht ist.
- **[ASSUMPTION] Sprecher der Lektion:** Lucan und Brenna (Kette mit `fallback: skip`), weil die Akt-2-Gefährten erst mit 11.5 entstehen.

### Project Structure Notes

- Neu: `src/core/rules/ballista.ts`, `tests/unit/ballista.test.ts`, `content/acts/act2/scenes/scn.m2_1.tutorial_ballista.yaml`, `content/locales/en/act2.dialogue.yaml`.
- Geändert: `src/core/{defs.ts,balanceDefs.ts,index.ts}`, `src/core/rules/{combat.ts,items.ts,movement.ts}`, `src/core/battle/{commands.ts,actions.ts,apply.ts,objectives.ts,contextBand.ts}`, `src/core/ai/{ai.ts,autoplay.ts}`, `src/content/{schemas.ts,validate.ts}`, `content/core/{items.yaml,terrain.yaml,balance.yaml,handbook.yaml,locales/*}`, `content/packs.yaml`, `src/app/screens/{battleMode.ts,useBattleInput.ts,Battle.tsx,BattleHud.tsx}`, `src/ui/icons.tsx`, `tests/fixtures/maps/asset_catalog.yaml`.

### Project Context Rules

- Spielwerte nur in YAML; kein sichtbarer Text im Code; Code englisch, Konzept deutsch.
- `src/core` ohne DOM/Babylon/`Math.random`/`Date.now`; Zufall nur aus `s.rng`.
- Vorschau ruft denselben Formelcode wie die Auflösung.
- Fertig erst mit `pnpm check`; Coverage `src/core` nicht senken.

### References

- [Source: concept/26-epics/epics/epic-11.md#Story 11.6: Balliste]
- [Source: concept/21-gdd/gdd.md#Gelände und Umwelteffekte]
- [Source: concept/24-architecture/architecture.md#8. Implementierungsmuster]
- [Source: src/core/rules/combat.ts forecast/resolveAttack]
- [Source: src/core/rules/movement.ts canStrike/threatTiles]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Debug Log References

- Sim Akt 1 (`pnpm sim --campaign act1 --runs 50 --seed 1`) vor und nach der Änderung zeilengleich bis auf die Laufzeit.
- Coverage `src/core`: vorher 95,67 % Anweisungen / 90,41 % Zweige, nachher 95,69 % / 90,45 %.
- Gefunden beim Test der Probekarte: Gegner ohne `ai`-Profil galten zuerst als Spielerfigur (liefen zur Balliste); jetzt wie in `aiAct` als `aggressive`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Kern: `rules/ballistaBase.ts` (Bediener, Reichweite, synthetische Waffe `ballista:<id>`, `CREW_PROFILES`), `rules/ballista.ts` (`ballistaTargets`, `ballistaMods`, `ballistaForecast`); `AttackMods.siege` in `forecast`/`resolveAttack` (Distanz vom Ballistenfeld, kein Gegenangriff, kein Doppelschlag, kein Tandem); Action `ballista` in `availableActions`, `validate`, `doAction`; Objekt `open` nach dem Schuss, Rücksetzen in `beginPhase`.
- KI: `ballistaPlans` mit derselben Bewertung wie `attackPlans` (`planScore` herausgezogen, Rechenfolge unverändert); `crewSpots` in `movement.ts` (hold läuft hin, sonst nur von der Stelle) für KI und `threatTiles` (Gefahrenzone 13.5); Autoplay mischt Ballistenpläne in die Angriffe.
- UI: Kontext-Band `ballista` (nach Hebel), Zielwahl `ui.pick.ballista`, Kampfvorschau mit Ballistenbolzen und Hinweis-Chip (`?` → `terrain.ballista`), Symbol `ballista`. Bild: Kontext-Band und Vorschau bei 375 × 812 auf der Probekarte `__hc.devMap('dev_ballista')` (Brett ohne gebaute Assets im Worktree, Figuren als Platzhalter).
- Content: Item `ballista_bolt`, Gruppe `siege`, Gelände `ballista`, `balance.ballista`, Handbuch `ballista` und `lesson_ballista` (`fromAct: 2`), Paket `act2` (`released: false`) mit Szene `scn.m2_1.tutorial_ballista` und EN-Texten; Prüfung „Ballisten-Objekt braucht Gelände ballista“.
- Tests: `tests/unit/ballista.test.ts` (24 Fälle) inkl. Probekarte `tests/fixtures/maps/dev_ballista.yaml`; `packs.test.ts` kennt das Paket act2.
- `pnpm check` grün (1545 Tests).

### File List

- _bmad-output/implementation-artifacts/11-6-balliste.md (neu)
- _bmad-output/implementation-artifacts/sprint-status.yaml
- concept/21-gdd/decision-log.md
- content/acts/act2/scenes/scn.m2_1.tutorial_ballista.yaml (neu)
- content/locales/en/act2.dialogue.yaml (neu)
- content/core/balance.yaml, handbook.yaml, items.yaml, terrain.yaml
- content/core/locales/de.yaml, en.yaml, de.handbook.yaml, en.handbook.yaml, de.items.yaml, en.items.yaml, de.names.yaml, en.names.yaml
- content/packs.yaml
- src/content/schemas.ts, src/content/validate.ts, src/content/validateBallista.ts (neu, Review)
- src/core/defs.ts, balanceDefs.ts, index.ts
- src/core/rules/ballista.ts (neu), ballistaBase.ts (neu), combat.ts, items.ts, movement.ts, skills.ts
- src/core/battle/actions.ts, apply.ts, commands.ts, contextBand.ts, objectives.ts
- src/core/ai/ai.ts, autoplay.ts
- src/app/screens/Battle.tsx, BattleHud.tsx, battleMode.ts, useBattleInput.ts, useBoardOverlays.ts
- src/ui/itemInfo.ts
- src/ui/icons.tsx
- tests/unit/ballista.test.ts (neu), tests/unit/packs.test.ts
- tests/fixtures/maps/dev_ballista.yaml (neu), tests/fixtures/maps/asset_catalog.yaml

### Senior Developer Review (AI)

- **Datum:** 2026-11-07, vier Reviewer (Koordinator). **Ergebnis:** Changes Requested → alle 14 PATCH-Punkte erledigt (siehe „Review Follow-ups (AI)“), Tests in `tests/unit/ballista.test.ts` ergänzt (36 Fälle).
- **Behalten, offene Fragen an den Produktinhaber:**
  - Ein Schuss je Balliste und Phase (statt je Zug eines Bedieners): mehrere Bediener an einer Balliste schießen nicht mehrmals.
  - Nebel begrenzt nur die Ziele der Spielerseite; die Gegner-KI sieht wie bei jedem ihrer Angriffe alles.
- **Deferred (Follow-up):**
  - Das Brett zeigt eine verschossene Balliste nicht anders an, und es gibt kein eigenes Reichweiten-Overlay der Balliste.
  - Der UI-Fluss (Kontext-Band → Ziel → Vorschau → Schuss) hat keinen automatischen Test; ein e2e-Test mit `__hc.devMap('dev_ballista')` fehlt.

### Change Log

- 2026-11-07: Review-Befunde behoben (14 Punkte), Tests ergänzt; Status bleibt review.

- 2026-11-07: Story 11.6 umgesetzt (Regel, KI, Autoplay, Gefahrenzone, UI, Lektion, Tests); Status review.
