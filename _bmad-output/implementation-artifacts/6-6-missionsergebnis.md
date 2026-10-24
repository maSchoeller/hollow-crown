# Story 6.6: Missionsergebnis

Status: review

## Story

Als Spieler
möchte ich nach einer Mission auf einen Blick sehen, was ich gewonnen und verloren habe,
damit sich Erfolg und Verlust klar anfühlen.

## Acceptance Criteria

1. **Sieg:** Sieg-Pille (Glut) mit Missionsname und Runden; Beute (Gold, Material, Item-Bilder), Kopfgeld vertriebener Leutnants mit neuem Groll, Nebenziele (erfüllt/nicht), EP je Figur mit Stufenaufstieg; Gefallene grau (Mockup 08). Alle Mengen als Symbol + Zahl (`Amount`).
2. **Leutnants-Abschnitt datengetrieben:** Epic 3 existiert noch nicht. Das Ergebnis trägt `bounty: BountyResult[]` (leer, bis Leutnants gefüllt werden); der Abschnitt erscheint nur bei nicht leerer Liste. Test mit Fake-Daten.
3. **Niederlage:** Der Bildschirm nennt den Grund in einem Satz (Kern liefert `defeatReason` im Kampfzustand) und bietet die Neustarts des Tod-Modus an (Story 1.5: `canRestart`).
4. **Daten aus dem Kern:** Aufbereitung (Reihenfolge, Sichtbarkeit, Gefallene, Aufstieg, Niederlagengrund) in `src/core/campaign/resultView.ts` (rein, getestet); die UI zeichnet nur.
5. **Stil B:** eigene `src/ui/result.css`, Abschnitt im Altbestand `styles.css` entfällt, alle Texte über Schlüssel in `de.yaml`/`en.yaml`.
6. Prüfungen grün: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`.

## Tasks / Subtasks

- [x] T1 Kern: `BattleState.defeatReason`, `BattleResult.bounty`, Kopf/Klasse bei `units`/`fallen`
- [x] T2 Kern: `resultView.ts` (`missionResultView`, `defeatSentence`) + Tests
- [x] T3 UI: `screens/Result.tsx` (Sieg + Niederlage), `result.css`, Aufräumen in `Menus.tsx`/`App.tsx`/`styles.css`
- [x] T4 Texte de/en
- [x] T5 Prüfungen, Entscheidungsprotokoll

## Dev Notes

- Vorhanden: `Result` in `Menus.tsx` (PoC-Linien), `Defeat` in `App.tsx` (Neustarts Runde/Mission über `canRestart`/`restartBattle`), `finishBattle` in `core/campaign/campaign.ts` liefert `BattleResult`.
- Gefallene haben keine EP; sie erscheinen grau mit „gefallen“.
- Offene Frage an den Produktinhaber: Form von Kopfgeld und Groll (Betrag, Skala) erst mit Epic 3; vorläufig `BountyResult { id, nameKey, portrait?, gold, grudge }`. Abschnitt ist ausgeblendet.
- Offene Frage: Sieg-/Niederlage-Ornament fehlt (Mockup nutzt nur CSS-Pille); CSS genutzt.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Completion Notes List

### File List
Implementiert wie in den Tasks. Neu: `src/core/campaign/resultView.ts`, `src/app/screens/Result.tsx` (Sieg + Niederlage, ersetzt `Result` in `Menus.tsx` und `Defeat` in `App.tsx`), `src/ui/result.css`, `tests/unit/result.test.ts` (7 Tests, Fake-Leutnants inklusive). Prüfungen: lint, test (157), content:check, build grün. Nicht im Browser geprüft (zentral nachgereicht).

### File List

- `src/core/state.ts`, `src/core/battle/objectives.ts`, `src/core/rules/effects.ts`, `src/core/campaign/campaign.ts`, `src/core/campaign/resultView.ts`, `src/core/index.ts`
- `src/app/screens/Result.tsx`, `src/app/screens/Menus.tsx`, `src/app/App.tsx`, `src/ui/result.css`, `src/ui/styles.css`
- `content/core/locales/de.yaml`, `content/core/locales/en.yaml`, `tests/unit/result.test.ts`
- `concept/25-ux/.decision-log.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-10-24: Story umgesetzt, Status review.
