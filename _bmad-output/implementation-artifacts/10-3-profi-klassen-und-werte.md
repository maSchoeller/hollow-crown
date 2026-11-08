<!-- Erstellt mit gds-create-story am 2026-11-08 -->

# Story 10.3: Profi-Klassen und Werte

Status: review

## Story

Als Spieler
möchte ich zwischen zwei klar verschiedenen Profi-Wegen je Rolle wählen,
damit ein Aufstieg die Spielweise ändert.

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-10.md`, Story 10.3 (vollständige Fassung dort). Kurz:

1. `classSchema.proSkills` (0–2, Präfix `pro_`), `proPart` optional; `skill` neuer Profiklassen = Rollen-Skill; `activeSkillIds` zählt Rollen-Skill, eigene `proSkills` und die von `secondPath`.
2. `skillSchema.effect` kennt `addWeaponGroups`, `usesBonus: { <Klassen-Aktion>: n }`, `radiusBonus: { <skillId>: n }`; `content:check` prüft Herkunftsrolle und `proSkills`.
3. 16 Profiklassen: 10 neue mit den Werten der Tabelle; `bard`/`standard_bearer` (bis 10.4) und `shadow`/`trapper` (bis 10.5) `playable: false`, `promotionTargets` filtert sie; `bulwark`/`breaker` `armored`, `mov: 5`; Texte `class.<id>.name|desc|effect`; Kopfkommentar nennt Epic 10.
4. Profi-Skills `pro_blade_dance`, `pro_woodsman`, `pro_hex`, `pro_battle_faith`, `pro_grand_command`, `pro_banner_lord` wirken in Kampf, Vorschau, KI und Sim über dieselben Funktionen; Unit-Test je Wirkung.
5. Akademie zeigt je Rolle beide Wege, nicht spielbare gesperrt mit „folgt“; Steckbriefe `class_<id>` für jede spielbare Profiklasse, Rollen-Einträge verweisen auf beide Wege.
6. `pnpm sim <mapId> --runs 50 --promote a|b`; Coverage von `src/core` sinkt nicht.

## Tasks / Subtasks

- [x] Schema: `proSkills`-Prüfung, neue Effekt-Bausteine, Herkunftsrolle auch `unique` (Avatar, Lucan) (AC 1, 2)
- [x] Kern: `classSkillIds`, `weaponGroupsOf`/`unitGroupAllowed` (Ausrüsten, Waffenwahl, Stäbe), `skillUses` (Befehl-Einsätze), `skillRadius` (Sammelruf) (AC 1, 4)
- [x] Inhalt: 10 Profiklassen, 6 Profi-Skills, Texte, Handbuch-Steckbriefe (AC 3, 4, 5)
- [x] Akademie: gesperrte Wege mit „folgt“ (AC 5)
- [x] Sim `--promote a|b` (AC 6)
- [x] Tests `tests/unit/pro-classes.test.ts`, Testlabor-Lage `tests/fixtures/lab/profi-wege.yaml`
- [x] `pnpm check`, `pnpm test:coverage`, Akt-1-Sim gegen main (kein Wert > 0,02)

## Dev Notes

- Waffengruppen eines Profis kommen nur aus Klassen-Skills (`classSkillIds`: Rollen-Skill, `proSkills`, `proSkills` von `secondPath`), damit `items.ts` nicht von `skills.ts` abhängt; Item-Skills tragen keine Waffengruppen.
- `usesBonus` wirkt auf den Rollen-Skill der Klasse, deren `classAction.id` der Schlüssel ist (`command` → `tactician_command`). `classAction.perMap` liest der Code weiterhin nicht; maßgeblich bleibt `usesPerMap` des Skills plus Bonus.
- Kampfvorschau, KI und Sim nutzen dieselben Funktionen (`skillTotals`, `canEquip`/`usableWeapons`, `skillUsable`, `act.ts` rally); eine Sammelruf-Fläche zeigt die Vorschau bisher nicht, daher keine Anpassung dort.
- `proPart` ist im Schema noch nicht angelegt: es gibt keinen Wert und keine Anhängeteile vor Story 10.13; der Name des Signaturteils kommt aus `part.<classId>.name`.
- Werte `[ASSUMPTION]`; die Korridore prüft Story 11.27.

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.3]
- [Source: _bmad-output/implementation-artifacts/10-2-akademie-und-aufstieg-mit-glutfunke.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Completion Notes List

- `content:check` erlaubt jetzt als Herkunftsrolle auch `tier: unique` (Großstratege, Bannerherr) und prüft `proSkills` (nur Profiklassen, `pro_`, `source: class`).
- Angepasst: `unit-stats.test.ts` nutzt den Brigant statt des (jetzt gepanzerten) Sturmbrechers, `roles.test.ts` kennt den Klingentänzer.
- Spielbare Wege sind über `promotionTargets` wählbar; Barde, Bannerträger, Schatten und Fallensteller stehen in der Akademie gesperrt mit „folgt“.

### File List

- content/core/{classes,skills,handbook}.yaml, content/core/locales/{de,en}{,.names,.handbook}.yaml
- src/content/{schemaUnits,validateUnits}.ts
- src/core/defs.ts, src/core/rules/{items,skills,progression}.ts, src/core/battle/{act,actions}.ts
- src/app/screens/{Academy.tsx,Academy.css,BattlePanels.tsx}
- tools/{simMap,simulate}.ts
- tests/unit/pro-classes.test.ts, tests/fixtures/lab/profi-wege.yaml

### Change Log

- 2026-11-08: Story umgesetzt, Status review.
