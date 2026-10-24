# Story 1.6: Verbluten im Modus Standard

Status: review

## Story

Als Spieler im Modus Standard
möchte ich sehen, wie lange eine niedergestreckte Figur noch hat,
damit Bergen dringlich und lesbar wird.

## Acceptance Criteria

1. Fällt eine Figur in Standard auf 0 TP, zählt `BattleUnit.bleed` ihre eigenen Phasen; nach `balance.death.bleedOutTurns` (3) stirbt sie, jeder weitere Treffer tötet sofort; ein Event meldet den Zähler.
2. Eine Figur mit 2 Narben stirbt bei 0 TP sofort; Avatar oder Kael bei 0 TP bleiben eine Niederlage.
3. Auf dem Brett ist die niedergestreckte Figur grau mit Puls-Symbol und Verblutungs-Zähler (`downed`); Tests decken Zähler, Tod, Bergen mit Narbe und Zwei-Narben-Regel ab.

## Tasks / Subtasks

- [x] T1 Kern: `BattleUnit.bleed`, `balance.death.bleedOutTurns: 3`, Event `bleed {unit, turns, max}`, `bleedOut` im Phasenbeginn (`rules/effects.ts`)
- [x] T2 UI: Zähler über der Figur auf dem Brett (`board.ts`, `.hc-bleed`), Chip „Verblutet in n“ in der Einheitenkarte (`BattleHud.tsx`)
- [x] T3 Tests `tests/unit/bleed.test.ts`

## Dev Notes

- **O2 ist durch GDD und Epic entschieden** (3 eigene Phasen, sichtbarer Zähler); `01-decisions.md` O2 („erst ohne Countdown testen“) ist älter und eingefroren. Umgesetzt wie GDD/Epic, Wert in `balance.yaml`.
- Zählung: Der Zähler steigt zu Beginn jeder Phase des eigenen Teams (Spielerphase); beim dritten Phasenbeginn stirbt die Figur (zusätzlich `died`-Event).
- Ein niedergestreckter Zustand am Kampfende zählt weiter als Tod (`finishBattle`, unverändert).
- Die Simulation (`pnpm sim`) ändert sich nicht: Sim-Spieler bergen oder verlieren niedergestreckte Figuren vor dem Ablauf.
- Kleine, lokale UI-Änderungen, weil andere Agenten die Kampf-Overlays umbauen.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm sim <map> --runs 20` vorher/nachher identisch: Prolog 100 %, Kap. 1 85 %, Kap. 2 94 % Sieg.
- lint, test, content:check, build grün.

### Completion Notes List

- 11 Tests: Zähler, nur eigene Phasen, Tod nach 3, zweiter Treffer, Bergen mit Narbe, Zwei-Narben-Regel, Avatar/Kael, Klassik/Casual, Datenwert.

### File List

- `src/core/{state,events,defs}.ts`, `src/core/battle/create.ts`, `src/core/rules/effects.ts`
- `content/core/balance.yaml`, `content/core/locales/{de,en}.yaml`
- `src/render/board.ts`, `src/app/screens/BattleHud.tsx`, `src/ui/hud.css`
- `tests/unit/bleed.test.ts`
