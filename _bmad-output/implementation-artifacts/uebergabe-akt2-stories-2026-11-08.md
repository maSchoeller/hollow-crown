# Übergabe Akt-2-Stories (2026-11-08, nach 10.3)

## Stand

- **10.2** Akademie und Aufstieg: PR #162, gemergt.
- **10.3** Profi-Klassen und Werte: PR #164, Branch `claude/story-10-3-pro-classes`, Status `review`, noch nicht gemergt.
- Nächster Schritt: **10.4** (Wirkungen der Profi-Wege), erst nach dem Merge von #164 auf `origin/main`. Danach 11.2, 11.3, 11.4, 11.5, 11.7.

## Was es jetzt gibt (für 10.4 und später)

- `classSkillIds(data, unit)` in `src/core/rules/items.ts`: Rollen-Skill, `proSkills`, `proSkills` von `secondPath`. `activeSkillIds` baut darauf auf.
- `weaponGroupsOf`/`unitGroupAllowed` (items.ts), `skillUses`/`skillRadius` (skills.ts). Weitere Bausteine aus 10.4 gehören als Felder in `skillSchema.effect` (`schemaUnits.ts`) und `SkillEffect` (`defs.ts`).
- `promotionTargets` filtert `playable: false`. 10.4 schaltet `bard`/`standard_bearer` auf `playable: true` und macht `proSkills` für spielbare Profiklassen zur Pflicht (Prüfung in `validateUnits.ts`, dort steht die `proSkills`-Prüfung schon).
- Die sechs alten Profiklassen tragen noch ihre PoC-Skills als `skill` (`pro_duel`, `pro_guard`, `climber`, `pro_far_shot`, `elemental_focus`, `blessing`). 10.4 stellt sie auf Rollen-Skill und `proSkills` um.
- `class.<id>.effect` beschreibt bei den alten sechs noch die PoC-Wirkung; mit 10.4 nachziehen, ebenso die Handbuch-Steckbriefe `class_duelist` usw.
- Testlabor-Lage `tests/fixtures/lab/profi-wege.yaml`: Muster für Profi-Lagen (`add:` mit `team: player, class: …`; `company:` mit Figurenliste hat auf `dev_terrain_warn` keine Startplätze).
- Sim: `pnpm sim <mapId> --promote a|b` (tools/simMap.ts).

## Sim-Vergleich gegen main

- Temporärer Worktree `main-wt` im Scratchpad der Session mit `node_modules` als Junction (PowerShell `New-Item -ItemType Junction`); vor `git worktree remove` die Junction mit `cmd /c rmdir` lösen.
- Baseline `sim-main.json` (`--campaign act1 --runs 50`) ist seit #161 unverändert gültig; 10.2 und 10.3 bewegen nichts über 0,02.

## Hinweise

- Speicherformat ist 3 (nicht 2 wie in den Epic-Texten). Neue Felder: Defaults in `normalizeCampaign` und in den Figuren-Erstellern (`battle/create.ts`, `campaign.ts` Taverne) und in `toRecord` (Rückweg aus dem Kampf), sonst schlagen `story.test.ts` und `lieutenants-join.test.ts` an.
- Parallel laufen „Leitern an die Mauer“ (Terrain, Wegsuche) und „Aufstellung auf dem Brett“ (`setup.ts`, `flow.ts`): Änderungen dort klein halten. 10.4 berührt Wegsuche nur über Rückstoß.
- Offene Fragen an den Product Owner: keine.
