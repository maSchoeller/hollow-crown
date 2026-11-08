# Übergabe Akt-2-Stories (2026-11-08, nach 10.4)

## Stand

- **10.3** gemergt (#164), **6.11** Aufstellung gemergt (#163).
- **10.4** Wirkungen der Profi-Wege: PR #167, Branch `claude/story-10-4-pro-effects`, Status `review`, nicht gemergt. `pnpm check` und `test:coverage` grün; Akt-1-Sim gegen main: kein Wert > 0,02.
- Nächste Stories: **11.2** (Positionsstufe der Akt-2-Missionen, `epic-11.md` Z. 85), dann 11.3, 11.4, 11.5, 11.7. 11.2 hängt nicht an 10.4 und kann auf `origin/main` beginnen.

## Was 10.4 hinterlässt (für spätere Stories)

- `skillTotals` kennt `rangeCap`, `castRadius`, `healRadius`, `cheerRange`, `cheerTargets` (≤ 2), `guardNeighbors`, `ignoreGrief`, `statusOnHit`; Auren (`addAuras`) übertragen `stats`, `hitBonus`, `avoidBonus`, `ignoreGrief`. Story 10.7 (`heritage_cheer`) und 11.22 (`final_curtain` über `grantsSkill`) bauen darauf.
- `CastArea.centers`, `rules/heal.ts` (`staffHeal`, `healStaff`, `healTiles`), `cheerReach` in `battle/actions.ts`, Command `cheer` mit optionalem `second`.
- `SideForecast.knockback` (`knockbackTarget` in `combat.ts`); Skill-Status nur hinter `ruleOn('status')` (auf `dev_terrain_warn` nicht eingeführt, daher zeigt `pnpm lab profi-wirkungen` dort keinen Rückstoß).
- `expectedDamage` rechnet Schutz und vorgezogenen Konter ein.
- `pro_duel`/`pro_guard` haben neue Wirkungen; die Proc-Mechanik (Lebensraub, Verteidigung ignorieren) hat keinen Inhalts-Skill mehr und ist nur noch per Test-Skill in `combat-resolution.test.ts` geprüft.

## PO-Entscheidungen 2026-11-08

- Rückstoß des Sturmbrechers einmal nach dem Kampf (wie Wind-Status).
- Rückstoß-Vorschau als Zeile plus markiertes Zielfeld; 3D-Pfeil ggf. mit 10.13.

## Hinweise

- Sim-Vergleich: temporären Worktree von `origin/main` im Scratchpad, `node_modules` als Junction; vor `git worktree remove` die Junction mit `cmd //c rmdir` lösen.
- Lab-Gegenstände: `items: [{ def: iron_axe }]`.
- Neue Chips und Kacheln von 10.4 wurden nicht im Browser angesehen.
- Offene Fragen an den Product Owner: keine.
