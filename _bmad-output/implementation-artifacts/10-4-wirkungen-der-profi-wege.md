<!-- Erstellt mit gds-create-story am 2026-11-08 -->

# Story 10.4: Wirkungen der Profi-Wege

Status: review

## Story

Als Spieler
möchte ich, dass Schutz, Rückstoß, Konter zuerst, Flächen und Anfeuern der Profi-Wege in Vorschau, Kampf und KI gleich wirken,
damit ich jede Profi-Wirkung vor dem Zug richtig einschätzen kann.

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-10.md`, Story 10.4 (vollständige Fassung dort). Kurz:

1. `skillSchema.effect` kennt `guardNeighbors`, `statusOnHit: { status, chance }`, `rangeCap`, `castRadius`, `healRadius`, `cheerRange`, `cheerTargets`, `ignoreGrief`; `proSkills` ist für jede spielbare Profiklasse Pflicht (1–2); `bard` und `standard_bearer` sind `playable: true`.
2. Die sechs alten Profiklassen tragen als `skill` den Rollen-Skill (`duelist` `counter_instinct`, `bulwark`/`breaker` `phalanx`, `sharpshooter` `eagle_eye`, `sage` `elemental_focus`, `bishop` `blessing`) und ihre `proSkills`; `climber` entfällt nur am Sturmbrecher. `pro_duel`, `pro_guard`, `pro_far_shot` bekommen neue Wirkungen ohne `renames.yaml` und ohne Migration.
3. Wirkungen (Daten im Skill, kein `if (classId === …)`), gleich in Kampf, Vorschau, KI (Worker) und Sim:
   - Bollwerk `pro_guard`: `guardNeighbors: 10`, mit Support-Schutz höchstens `supports.guardMaxTotal: 30`; ein Wurf gegen die Summe; es schützt das Bollwerk, sonst der Support-Partner.
   - Sturmbrecher `pro_knockback`: `on_hit`, `statusOnHit: { status: knockback, chance: 100 }`.
   - Duellant `pro_duel`: `on_defend`, `strikeFirst: true`.
   - Scharfschütze `pro_far_shot`: mit Bogen `rangeBonus: 1`, `rangeCap: 4` (Gesamtreichweite inklusive Zielen).
   - Weiser `pro_wide_cast`: `castRadius: 1`.
   - Bischof `pro_wide_heal`: `healRadius: 1`, EP `experience.heal` + `experience.healExtraTarget` je weiterem Ziel.
   - Barde `pro_song`: `cheerRange: 2`, `cheerTargets: 2` (zweites Ziel optional, „Fertig“ beendet nach einem).
   - Bannerträger `pro_banner`: `aura: { radius: 1 }`, `ignoreGrief: true`, `avoidBonus: 5` (nur Nachbarn).
4. `addAuras` überträgt `avoidBonus`, `hitBonus`, `ignoreGrief`; Unit-Test Vorschau = Auflösung für alle drei.
5. `cheerTargets` ist die einzige Mechanik für Anfeuern auf mehrere Ziele; mehrere Quellen: höchstens 2 Ziele, größte Reichweite, nichts addiert sich.
6. Vorschau über dieselben Funktionen wie die Auflösung: Schutzchance, Schlagreihenfolge, Rückstoß-Zielfeld, Reichweite, Wirken- und Heilfläche, mögliche Anfeuern-Ziele; Unit-Tests je Wirkung.
7. KI: Schutz und Konter zuerst erhöhen das Risiko (`counterWeight`); Worker und Fallback identisch.
8. Barde und Bannerträger haben Steckbriefe `class_bard`/`class_standard_bearer` und sind in der Akademie wählbar; Coverage `src/core` sinkt nicht.

## Entscheidungen des Product Owners (2026-11-08)

- Rückstoß des Sturmbrechers wirkt **einmal nach dem Kampf**, wenn mindestens ein Schlag traf (wie der Wind-Status), nicht nach jedem Treffer.
- Rückstoß-Vorschau: **Zeile in der Kampfvorschau plus markiertes Zielfeld**; ein 3D-Pfeil kann mit Story 10.13 folgen.

## Tasks / Subtasks

- [x] Schema und Typen: neue Bausteine in `skillSchema.effect` (`schemaUnits.ts`) und `SkillEffect` (`defs.ts`); `supports.guardMaxTotal` in `balance.yaml`/`balanceDefs.ts`; `proSkills` Pflicht (1–2) für spielbare Profiklassen (`validateUnits.ts`) (AC 1)
- [x] Inhalt: Profi-Skills in `skills.yaml`, Klassen umstellen, `bard`/`standard_bearer` spielbar, Texte `class.<id>.effect`, Handbuch `class_<id>` (AC 1, 2, 8)
- [x] `skillTotals`/`addAuras`: `rangeCap`, `castRadius`, `healRadius`, `cheerRange`, `cheerTargets`, `guardNeighbors`, `ignoreGrief`, `statusOnHit`; Aura überträgt `avoidBonus`, `hitBonus`, `ignoreGrief`; Trauer-Malus in `stats.ts` nach den Skills (AC 3, 4)
- [x] Kampf: `guardOf` mit Bollwerk, Status aus Skills in `calcSide`, Rückstoß-Zielfeld im `Forecast`; `weaponRange` mit `rangeCap` (AC 3, 6)
- [x] Wirken (`castArea`/`resolveCast`) mit `castRadius`; Stab-Heilen mit `healRadius` (Vorschau-Funktion `healArea`, EP) (AC 3, 6)
- [x] Anfeuern: Reichweite, zweites Ziel (`Action.cheer.second`), UI-Ablauf mit „Fertig“ (AC 3, 5, 6)
- [x] KI: Schutzchance senkt `dealt`/`killChance` in `expectedDamage` (AC 7)
- [x] HUD: Rückstoß-Zeile und Zielfeld, Heilfläche (AC 6)
- [x] Tests `tests/unit/pro-effects.test.ts`, Testlabor-Lage; `pnpm check`, `pnpm test:coverage`, Akt-1-Sim gegen main

## Dev Notes

- Vorhandene Bausteine: `strikeFirst` steuert schon `forecast().order`; `rangeBonus` fließt über `weaponRange` in Reichweite, Bedrohung und KI; Status-on-hit läuft über `SideForecast.status` und `applyOnHitEffects` (Rückstoß-Regeln in `combat.ts` `knockback`, blockiert = `status.knockbackBlockedDamage`). Skill-Status nur hinter `ruleOn(s, 'status')`, nicht hinter `elements` (Rückstoß ist kein Element).
- Schutz: `guardOf` (`combat.ts`) wählt bisher den besten Support-Partner. Neu: Summe aus bestem Support-Schutz und `guardNeighbors` aller benachbarten Verbündeten (größter Wert), gedeckelt bei `supports.guardMaxTotal`; Schützer ist das Bollwerk, wenn eines beiträgt. Ein Wurf wie bisher.
- Aura: `addAuras` liest bisher nur `effect.stats`; der Bannerträger-Skill ist eine Aura, wirkt also nicht auf den Träger.
- Trauer: `stats.ts` zieht `griefHitPenalty` vor den Skills ab; mit `ignoreGrief` aus den Skill-Summen entfällt der Abzug.
- `rangeCap`: kleinster Wert aller aktiven Skills; deckelt `range[1] + rangeBonus + extraRange` in `weaponRange` (Höhenbonus bleibt eigene Regel).
- Wirken: Feuer entzündet Ziel und Nachbarn, auf denen Feuer entstehen darf; Erde hebt Felswände auf allen zulässigen Feldern; Wasser und Wind vergrößern den Radius.
- Anfeuern: neue optionale Angabe `second` am Command `cheer`; alte Replays bleiben gültig. Mehrere Quellen: `max(cheerRange)`, `min(2, max(cheerTargets))`.
- Akt-1-Sim: Akt 1 hat keine aufgestiegenen Spielerfiguren; nur Halvard (Bischof, ohne Stab, `untargetable`) nutzt eine Profiklasse. Erwartung: Sim unverändert.
- Speicherformat bleibt 3; Skills hängen an der Klasse, nicht am Spielstand.

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.4]
- [Source: _bmad-output/implementation-artifacts/10-3-profi-klassen-und-werte.md]
- [Source: concept/24-architecture/architecture.md §8.5 (Worker = Fallback)]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Completion Notes List

- Neue Bausteine in `skillTotals` (`rangeCap`, `castRadius`, `healRadius`, `cheerRange`, `cheerTargets` ≤ 2, `guardNeighbors`, `ignoreGrief`, `statusOnHit`); Auren übertragen zusätzlich `hitBonus`, `avoidBonus`, `ignoreGrief`; der Trauer-Malus wird nach den Skills abgezogen.
- Schutz: `guardOf` addiert `guardNeighbors` des besten Nachbarn zum besten Support-Schutz, gedeckelt bei `supports.guardMaxTotal` (30); Schützer ist das Bollwerk.
- Rückstoß: Skill-Status laufen über `SideForecast.status` (nur hinter `ruleOn('status')`); `knockbackTarget` liefert Zielfeld und Blockade für Vorschau (`SideForecast.knockback`) und Auflösung. HUD-Chip „Rückstoß“/„blockiert“, Zielfeld als Wirk-Kachel (PO-Entscheidung).
- Konter zuerst: Chip in der Kampfvorschau; KI: `expectedDamage` senkt Schaden und Tötungschance um die Schutzchance und um die Chance, dass ein vorgezogener Konter den Angreifer fällt.
- Wirken: `CastArea.centers`; Feuer und Erde entstehen auf allen zulässigen Feldern im Radius, Wasser und Wind vergrößern den Radius. Heilen: neues `rules/heal.ts` (`staffHeal`, `healStaff`, `healTiles`), dieselbe Funktion für Vorschau (Heil-Kacheln im Zielmodus) und Auflösung, EP `heal + healExtraTarget` je weiterem Ziel.
- Anfeuern: `cheerReach`/`cheerTargets` mit Reichweite; Command `cheer` mit optionalem `second` (alte Replays gültig); UI: zweites Ziel antippen, „Fertig“ beendet nach einem.
- Die PoC-Proc-Tests (Sol, Durchbohren) prüfen die Mechanik jetzt mit Test-Skills, da `pro_duel`/`pro_guard` neue Wirkungen haben.
- Akt-1-Sim (`--campaign act1 --runs 50`) gegen origin/main: kein Wert bewegt sich um mehr als 0,02.
- Nicht im Browser angesehen: die neuen Chips und Kacheln sind nur über Unit-Tests und `pnpm lab profi-wirkungen` geprüft.

### File List

- content/core/{balance,classes,skills,handbook}.yaml, content/core/locales/{de,en}{,.names,.handbook}.yaml
- src/content/{schemaUnits,validateUnits}.ts
- src/core/{defs,balanceDefs,index}.ts, src/core/rules/{skills,stats,combat,movement,cast}.ts, src/core/rules/heal.ts (neu), src/core/battle/{act,actions,apply,commands}.ts
- src/app/screens/{Battle.tsx,BattleHud.tsx,battleMode.ts,useBattleInput.ts,useBoardOverlays.ts}
- tools/lab.ts, tests/fixtures/lab/profi-wirkungen.yaml (neu)
- tests/unit/pro-effects.test.ts (neu), tests/unit/{class-actions,combat-resolution,pro-classes,roles}.test.ts

### Change Log

- 2026-11-08: Story angelegt (ready-for-dev).
- 2026-11-08: Story umgesetzt, Status review.
