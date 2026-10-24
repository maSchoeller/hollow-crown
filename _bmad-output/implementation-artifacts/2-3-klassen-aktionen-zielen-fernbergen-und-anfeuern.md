# Story 2.3: Klassen-Aktionen Zielen, Fernbergen und Anfeuern

Status: review

## Story

Als Spieler
möchte ich die Klassen-Aktionen von Schütze, Heiler und Spielmann einsetzen,
damit jede Rolle eine eigene Antwort auf die Lage hat.

## Acceptance Criteria

1. **Zielen:** Ein Schütze, der sich nicht bewegt hat, greift mit +1 Reichweite und +15 Treffer an; die Vorschau zeigt beides.
2. **Fernbergen:** Ein Heiler birgt eine niedergestreckte Figur in bis zu 2 Feldern wie beim normalen Bergen.
3. **Anfeuern:** Ein Spielmann neben einem Verbündeten gibt diesem bis Zugende +1 MOV und +10 Treffer.
4. Jede Klassen-Aktion ersetzt die Aktion des Zugs, hat eine Vorschau, sitzt auf dem festen Dock-Platz mit Rollen-Icon und ist in `src/core` getestet. Alle Zahlen in `balance.yaml`.

## Tasks / Subtasks

- [x] T1 Zahlen: `balance.yaml › classActions` (aim, farRescue, cheer), Typ in `defs.ts`, Zod-Schema
- [x] T2 Commands/Events: Actions `aim`, `farRescue`, `cheer`; Event `classAction`
- [x] T3 Regeln: `aimTargets`, `farRescueTargets`, `cheerTargets`, `classPreview` in `battle/actions.ts`; `forecast`/`resolveAttack` nehmen `AttackMods` (Vorschau und Auflösung nutzen dieselbe Formel); `weaponRange` mit `extraRange`
- [x] T4 Auflösung in `battle/apply.ts`: gemeinsame `doRescue` für Bergen und Fernbergen; Anfeuern als Buff (`CHEER_BUFF`), der mit der Spielerphase endet
- [x] T5 Tests `tests/unit/class-actions.test.ts` (Fixtures, kein PoC-Spielmann)
- [x] T6 UI: Klassen-Slot des Docks (`CLASS_KINDS`), Zielwahl, Vorschau-Karte (`ForecastCard` mit Zielen-Chip, `ClassPreviewCard`), Texte de/en
- [x] T7 Sim je Karte, Entscheidungsprotokoll

## Dev Notes

- Zielen setzt voraus: `!unit.moved` und Zielfeld = aktuelles Feld. Ein vorheriger `move`-Befehl (auch auf das eigene Feld) sperrt es.
- Fernbergen gilt nur für Niedergestreckte in genau `classActions.farRescue.range` (2) Feldern (entschieden 2026-10-24); Nachbarn bergt der Kontext-Band „Bergen“.
- Anfeuern: Ziele sind aktive Verbündete im Nachbarfeld, die noch nicht gehandelt haben; ein Ziel trägt höchstens einen Anfeuern-Buff. Der Buff läuft über das bestehende `Buff`-Modell (`mov`, `hit`), `untilPhase` = Team des Ziels.
- KI und Autoplay (Simulator) setzen Klassen-Aktionen nicht ein; die Sim-Werte sind daher unverändert.
- Es gibt keinen Spielmann auf den PoC-Karten und keine Dolch-/Laute-Items; Anfeuern ist nur mit Fixtures getestet.
- Rollen-Icons: Zielen `aim` (Alias von `target`), Fernbergen `farRescue` (Alias von `rescue`), Anfeuern `cheer` (Alias von `rally`). Eigene Glyphen fehlen noch, ebenso die Rollen-Icons von Spielmann und Späher (Standard `star`).
- Story 4.3 (`rolesSeen`) fehlt noch: die Aktionen sind für die Rolle immer verfügbar.

### Offene Fragen für den Produktinhaber

- Soll Zielen auch nach einem Warten-Zug auf demselben Feld (Befehl `move` auf das eigene Feld) möglich sein? Umgesetzt: nein (konservativ).
- ~~Soll Fernbergen auch Nachbarn bergen?~~ Entschieden 2026-10-24: nur Distanz 2, Nachbarn mit normalem Bergen.
- Soll der Spielmann-Buff auch für den Spielmann selbst oder über die Gegnerphase gelten? Umgesetzt: nur Verbündete, bis Ende der Spielerphase.

## Dev Agent Record

### Completion Notes List

Sim (`pnpm sim <map> --runs 50`, vorher/nachher): prologue 100 %/100 % (0,06 Niedergestreckte), ch01 92 %/92 % (0,14), ch02 76 %/76 % (1,37). Unverändert, weil der Autoplay keine Klassen-Aktionen nutzt.

### File List

- `content/core/balance.yaml`, `locales/{de,en}.yaml`; `src/content/schemas.ts`
- `src/core/defs.ts`, `events.ts`, `battle/{actions,apply,commands}.ts`, `rules/{combat,movement}.ts`
- `src/app/screens/{Battle,BattleHud}.tsx`, `src/ui/icons.tsx`
- `tests/unit/class-actions.test.ts` (neu), `concept/21-gdd/decision-log.md`
