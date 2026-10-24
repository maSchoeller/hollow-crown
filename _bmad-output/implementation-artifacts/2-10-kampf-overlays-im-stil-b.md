# Story 2.10: Kampf-Overlays im Stil B

Status: review

## Story

Als Spieler
möchte ich alle Fenster im Kampf im selben Stil wie das HUD sehen,
damit Infos zu Gegnern und eigenen Figuren, Tausch und Konvoi sofort lesbar sind.

## Acceptance Criteria

1. **Einheiten-Info:** Antippen eines Gegners oder der Einheitenkarte öffnet einen Stein über dem Schleier mit Medaillon (TP-Ring in Teamfarbe, Stufe), Rollenpille, TP, Werte-Raster, Ausrüstung als Item-Zeilen (Item-Bild), Fähigkeiten und bei Gegnern dem KI-Verhalten; eigene Einheiten bieten „Anlegen“, solange sie handeln können. Esc oder Tipp daneben schließt.
2. **Weitere Overlays** (Ziele, Kampfmenü, Klassen-Aktion, Item-Liste, Tausch, Konvoi, Stufenaufstieg) folgen dem Panel-Muster (`Sheet`); Funktionen unverändert.
3. **PoC-Reste entfernt:** `.levelup` in `styles.css`, die PoC-Komponenten in `Battle.tsx`; `Modal`, `UnitCard`, `StatsGrid`, `ItemRow` bleiben, weil Camp, Menüs und Dialog sie noch nutzen.
4. **Produktinhaber-Zusatz (ein Rahmen je Item):** Item-Chips (Waffen-Chip der Einheitenkarte und der Kampfvorschau) haben nur einen Rahmen: Bild ohne Rahmen, Pille in Seltenheitsfarbe mit Rauten. Bausteine `ItemChip` und `ItemImage bare`; Regel in `DESIGN.md` und `.decision-log.md`.

## Tasks / Subtasks

- [x] T1 `pieces.tsx`/`pieces.css`: `ItemImage bare`, `ItemChip`; `BattleHud.tsx` WeaponChip nutzt ihn, `.hud-chip--weapon` entfernt (AC 4)
- [x] T2 `src/ui/Sheet.tsx` + `sheet.css`: Schleier, Kopf, Körper, Tastenreihe, Esc (AC 2)
- [x] T3 `src/app/screens/BattlePanels.tsx` + `src/ui/battle-panels.css`: UnitInfo, ObjectivesPanel, BattleMenu, ClassPick, ItemPick, LevelUpPopup, TradeSheet, ConvoySheet, ItemLine (AC 1, 2)
- [x] T4 `Battle.tsx` umgestellt, alte Komponenten und `.levelup` gelöscht (AC 3)
- [x] T5 Prüfung: lint, test (97), content:check, build; Browser 375 × 812

## Dev Notes

- Neue Texte waren nicht nötig (vorhandene Schlüssel). Kopfzeile der Info: Name, bei Gegnern Phasen-Kurzname als Aside.
- Von Hand geprüft: Info Gegner, Info eigene Einheit mit „Anlegen“, Ziele, Kampfmenü, Waffen-Chip. Nicht von Hand geprüft: Klassen-Auswahl, Item-Liste, Tausch, Konvoi, Stufenaufstieg (gleiche Bausteine, Typecheck grün).
- Beute-Hinweis (Toast) bleibt beim Lead.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm lint`, `pnpm test` (97), `pnpm content:check`, `pnpm build` grün; Bundle 14,93 MB Transfer (Budget 15).

### Completion Notes List

- Worktree war auf altem main; per Fast-Forward auf `claude/remote-main-merge-planning-797de3` (b3873e0) gehoben, bevor Arbeit begann.

### File List

- `src/ui/pieces.tsx`, `src/ui/pieces.css`, `src/ui/Sheet.tsx`, `src/ui/sheet.css`, `src/ui/battle-panels.css`, `src/ui/hud.css`, `src/ui/styles.css`
- `src/app/screens/BattlePanels.tsx`, `src/app/screens/Battle.tsx`, `src/app/screens/BattleHud.tsx`
- `concept/25-ux/DESIGN.md`, `concept/25-ux/.decision-log.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`
