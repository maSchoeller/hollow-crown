# Story 3.2: Flucht bei 0 TP

Status: ready-for-dev

## Story

Als Spieler
möchte ich vorher sehen, dass ein Leutnant flieht statt stirbt,
damit sich nichts beliebig anfühlt.

## Acceptance Criteria

1. **Kern:** Würde ein Leutnant (`BattleUnit.lieutenant` gesetzt, Team `enemy`) auf 0 TP fallen, setzt `knockOut` (`src/core/rules/effects.ts`) statt `gone = 'dead'` den Wert `gone = 'fled'`, `fledBy` = UID des Vertreibers und meldet das Event `fled { unit, by }` (statt `died`). Beute fällt wie bei einem Toten (`dropLoot`), Status werden geleert, `pos` bleibt als letzte Position erhalten. Fällt ein Leutnant durch Status- oder Geländeschaden (kein Vertreiber), ist `by` leer und `fledBy` bleibt ungesetzt; `finishBattle` ändert dann das Groll-Ziel nicht (Verhalten aus Story 3.3). Vertreiber ist die Quelle des letzten Schadens: im Kampf der Angreifer, bei Wirken und Fertigkeiten der Wirkende.
2. **Zählen:** `combat.ts` zählt `fled` wie `killed`: Kill-EP und Boss-Zuschlag laufen unverändert (`combatExp`), sonst gäbe es keine Kill-EP. `objectives.ts`: `rout` zählt den Leutnant als weg (`onMap` ist für `fled` falsch), `boss` zählt `gone === 'fled'` wie `dead`; `unit_dies` und `escort` bleiben unverändert. Nachsetzen (`pursue`), Verstärkungen und KI behandeln `fled` wie `dead` (kein Ziel, keine Gefahrenzone, kein Zug mehr). Statistiken (`kills`, `bossKilledWith`) zählen mit.
3. **Sicht:** `filterEvents` (`src/core/rules/vision.ts`) kennt `fled` (Feld `unit`, Position aus `s.units`): wie `died` sieht der Spieler es nur, wenn die Einheit auf einem gesehenen Feld stand oder ihm gehört; sonst entfällt das Event. Ein im Nebel geflohener Leutnant verschwindet ohne Animation.
4. **Vorschau:** Die Kampfvorschau nutzt denselben Formelcode wie die Auflösung (`combat.ts`, nie eine Kopie). Würde der Angriff einen Leutnant auf 0 TP bringen, steht dort „flieht“ statt 0 (Schlüssel `ui.battle.preview.flees`, de und en); die TP-Leiste endet bei 0, das Fluchtsymbol ersetzt den Totenkopf (Mockups 01/02). Gleiches im Kampfbericht.
5. **Brett:** Bei `fled` spielt `src/render/board/` den Rückwärtssprung (weg vom Vertreiber, ein Feld, kurzer Bogen), ein Rauchwölkchen und den fallenden Wimpel (Groll-Wimpel aus Story 3.1 sinkt und verschwindet); danach ist die Figur weg. Mit „Bewegungen überspringen“ (Tempo 3) entfällt die Animation, der Zustand ist derselbe. Keine neuen Pflicht-Assets: Partikel und Wimpel aus vorhandenen Bausteinen (Art Direction §8).
6. **Fluchtzeile:** Nach dem Sprung spricht der Leutnant die Fluchtzeile als Sprechblase (Muster `ltLines.ts`, Story 3.3). Welche, bestimmt die Zahl seiner bisherigen Vertreibungen `routs` vor dieser Flucht: 0 → `flee_1`, 1 → `flee_2`, 2 → `flee_3`, danach wieder von vorn (`routs % 3`), deterministisch ohne Zufall. Die Wahl ist eine reine Funktion im Kern (`ltFleeLine`, neben `ltOpeningLine`). Je Leutnant einmal pro Kampf; im Überspringen-Modus entfällt die Zeile. Länge ≤ `balance.scene.bubbleMaxChars`. Die Zeilen stehen seit Story 3.1 in `scn.lt.<id>`.
7. **Sichtkontakt:** `isVisibleToPlayer(state, unit)` (`src/core/campaign/lieutenants.ts`) wird an die echte Sicht aus `vision.ts` gehängt (Story 2.6): ohne Nebel weiter immer `true`, im Nebel erst, wenn das Feld des Leutnants gesehen ist. Die Zeile aus Story 3.3 (`first`/`grudge_n`/`mock`) kommt damit beim ersten Sichtkontakt, auch wenn er erst später in Sicht gerät oder als Verstärkung (`spawned`) erscheint; höchstens einmal je Leutnant und Kampf.
8. **Karten:** `ch01_varnhold` bekommt an der Einheit `hask` das Feld `lieutenant: hask`, `ch02_silverbrook` an der Einheit `morra` das Feld `lieutenant: morra` (Freigabe Level-Design: **nur dieses Feld**, nichts sonst an den Karten). Danach liegen Siegquote, Verluste und Niedergestreckte von `pnpm sim ch01_varnhold --runs 50` und `pnpm sim ch02_silverbrook --runs 50` im Korridor von `balance.yaml` `simulation.corridors`; verlässt eine Karte ihn, wird gemeldet (Level-Design entscheidet), nicht an der Karte gedreht.
9. **Prüfungen:** Tests für `knockOut` (Leutnant mit Vertreiber, per Statusschaden ohne Vertreiber, normaler Gegner stirbt weiter), `rout` und `boss` mit geflohenem Leutnant, Kill-EP, `filterEvents` (gesehen/ungesehen), Vorschau („flieht“ und normaler Fall), Fluchtzeilen-Wahl (0, 1, 2, 3 Vertreibungen), `finishBattle` mit geflohenem Leutnant (Groll +1, Ziel = Vertreiber), Replay-Gleichheit; `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`, `pnpm test:e2e` grün; Coverage von `src/core` nicht senken; Sim im Korridor. Da die Flucht sichtbar ist: Screenshot (Vorschau „flieht“ und Fluchtzeile als Sprechblase).

## Tasks / Subtasks

- [ ] T1 Kern: Flucht (AC 1, 2)
  - [ ] `knockOut` bekommt die Quelle des Schadens (Vertreiber) durchgereicht; Aufrufer in `combat.ts`, `cast.ts`, Status- und Geländeschaden prüfen
  - [ ] Event `fled` in `events.ts`; `fled`-Zweig in `filterEvents` (AC 3)
  - [ ] `objectives.ts` (`rout`, `boss`), `combat.ts` (`killed`, EP, Statistik), KI und `pursue` behandeln `fled` wie `dead`
- [ ] T2 Vorschau (AC 4)
  - [ ] Vorschau-Ergebnis um „flieht“ erweitern (gleicher Formelcode), HUD-Anzeige und Locales
- [ ] T3 Brett (AC 5)
  - [ ] Rückwärtssprung, Rauch, fallender Wimpel in `src/render/board/lieutenant.ts` und im Ereignis-Spieler
- [ ] T4 Zeilen und Sicht (AC 6, 7)
  - [ ] `ltFleeLine` im Kern, Haken in `ltLines.ts` und `Battle.tsx`
  - [ ] `isVisibleToPlayer` an `vision.ts` hängen; Auslöser bei neuer Sicht und `spawned`
- [ ] T5 Karten und Sim (AC 8)
  - [ ] Feld `lieutenant:` auf beiden PoC-Karten, `pnpm sim` je Karte, Korridor prüfen
- [ ] T6 Tests, Prüfungen, Screenshot (AC 9)
  - [ ] Decision-Log (Architektur §5.5) nachtragen

## Dev Notes

### Quellen

- Epics 3.2; GDD „Leutnants“ und „Gegner-KI“ (Flucht statt Tod, EP wie bei einem Sieg); Architektur §5.5 (`gone: 'fled'`, `fled { unit, by }`); EXPERIENCE und DESIGN (Flucht: Rückwärtssprung, Rauchwölkchen, fallender Wimpel, Fluchtzeile als Sprechblase, Vorschau „flieht“ statt 0); Art Direction §8 (Effekte); Mockups `01`/`02` in `concept/25-ux/mockups/`; Narrative (Fluchtzeilen, Stimmen).
- Produktentscheidungen 2026-10-25: Fluchtzeile nach Zahl der Vertreibungen (`routs % 3`; 1. Flucht `flee_1`, 2. `flee_2`, 3. `flee_3`, danach von vorn); auf den PoC-Karten nur das Feld `lieutenant:` ergänzen, danach Sim.

### Vorhandener Code (Fundstellen)

- **0-TP-Behandlung:** `src/core/rules/effects.ts` `knockOut` (Nicht-Spieler: `dropLoot`, `gone = 'dead'`, Event `died`) und die `damage`-Funktion darüber; weitere `died`-Stellen beim Verbluten (~Zeile 199). Status- und Geländeschaden rufen ebenfalls `knockOut`, dann ohne Vertreiber.
- **Kampf:** `src/core/rules/combat.ts` ~459–507: Zeile 503 `killed = foe.gone === 'dead' || (!wasDowned && foe.downed)` muss `fled` einschließen; Zeile 504 Boss-Waffe. Die Vorschau teilt den Formelcode, kein zweiter Pfad.
- **Ziele:** `src/core/battle/objectives.ts` `rout` (`onMap`) und `boss` (`b.gone === 'dead'`).
- **Sicht:** `src/core/rules/vision.ts` `filterEvents` (Fälle `died`, `spawned`, `moved`; die Liste der unsichtbaren Einheiten-Events ~Zeile 245): `fled` braucht einen eigenen Fall, sonst verrät er eine Einheit im Nebel.
- **Zeilen:** `src/core/campaign/lieutenants.ts` `ltOpeningLine`, `isVisibleToPlayer` (heute `true`), `driverId`; `src/app/battle/ltLines.ts`; Sprechblasen über `SpeechBubbles` mit `only`. Szenen `scn.lt.<id>` mit `flee_1..3` liegen seit 3.1 vor.
- **Brett:** `src/render/board/lieutenant.ts` (Ring und Wimpel aus 3.1); Ereignis-Wiedergabe in `src/app/screens/Battle.tsx`.
- **Karten:** `content/acts/act1/maps/ch01_varnhold.yaml` Einheit `hask` (`boss: true`), `ch02_silverbrook.yaml` Einheit `morra`.
- **Tests als Muster:** `tests/unit/lieutenants-grudge.test.ts`, `tests/unit/class-actions.test.ts` (`arena()`), die Vision-Tests der Story 2.6.

### Was sich ändert / was bleibt

- **Verhalten:** Missionen ohne Leutnant bleiben bitgleich (Replays, `sim-campaign.test.ts`). Auf den zwei PoC-Karten fliehen Hask und Morra statt zu sterben; Siegregeln (`boss` auf Hask, `rout`) bleiben.
- **Kill-EP:** Die Flucht zählt als Besiegen; die EP für den Spieler ändern sich gegenüber dem Tod nicht.
- **Sonderfall:** Fällt ein Leutnant durch einen verbündeten NPC, ist `by` dessen UID; `finishBattle` lässt das Ziel dann unverändert (Story 3.3).
- **Gegner ohne `lieutenant`:** sterben wie bisher.

### Grenzen zu anderen Stories und Sessions

- **Nicht hier:** Skalierung der Stärke (3.4), Kopfgeld und Signatur (3.5, vorhanden), Steckbrief (3.6, vorhanden), Seitenwechsel (3.7), Heimsuchungen (5.5/5.6), Missions-Content (9.x), alle weiteren Karten. An den Karten **nur** das Feld `lieutenant:`.
- **Abhängigkeiten:** 3.1 und 3.3 (Zustand, `fled`-Typen, Zeilen) vorhanden; 2.6 (Nebel, `vision.ts`) und 2.4/2.7 (`pursue`) auf diesem Branch.

### Offene Fragen

- Keine blockierenden. Liegt eine Sim außerhalb des Korridors: melden, nicht selbst tunen.

### Project Structure Notes

- Neu: ggf. `tests/unit/lieutenants-flee.test.ts`.
- Geändert: `src/core/rules/{effects,combat,vision}.ts`, `src/core/{events,state}.ts`, `src/core/battle/objectives.ts`, `src/core/campaign/lieutenants.ts`, `src/core/ai/*` (nur `fled` ausblenden), `src/app/battle/ltLines.ts`, `src/app/screens/{Battle,BattleHud}.tsx`, `src/render/board/lieutenant.ts`, Locales `de.yaml`/`en.yaml`, die beiden Karten (nur ein Feld).

### Project Context Rules

- `src/core` rein und serialisierbar; jeder Zufall aus dem Seed-RNG (hier keiner); Replays identisch. Kampfvorschau = derselbe Formelcode.
- Kein sichtbarer Text im Code; Zeilen sind Content aus 3.1, Hinweise über Locales. Beträge als Symbol + Zahl.
- Code, Bezeichner, Commits englisch; Konzeptdokumente deutsch.
- Fertig erst, wenn `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`, `pnpm test:e2e` grün sind; Coverage `src/core` nicht senken (`pnpm test:coverage`); Sim im Korridor; Screenshot.
- In `sprint-status.yaml` nur die Zeilen der Story ändern.

### References

- [Source: concept/26-epics/epics.md#Story 3.2]
- [Source: concept/24-architecture/architecture.md#5.5 Leutnants (AR5)]
- [Source: concept/21-gdd/gdd.md#Leutnants]
- [Source: concept/25-ux/EXPERIENCE.md]
- [Source: concept/23-art-direction/art-direction.md#8]
- [Source: _bmad-output/implementation-artifacts/3-1-leutnants-als-content-und-auf-dem-brett.md]
- [Source: _bmad-output/implementation-artifacts/3-3-groll-und-groll-ziel.md]
- [Source: _bmad-output/implementation-artifacts/2-4-halten-und-nachsetzen.md]
- [Source: _bmad-output/implementation-artifacts/2-6-nebel-des-krieges-oeffnen-und-stehlen.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
