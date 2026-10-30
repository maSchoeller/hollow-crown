# Story 13.5: Gefahrenzone mit Stufen

Status: review

## Story

Als Spieler
möchte ich in der Gefahrenzone sehen, wie viele Gegner ein Feld erreichen,
damit ich zwischen leicht und sehr gefährlich unterscheiden kann.

## Acceptance Criteria

**Angenommen** die Gefahrenzone ist an (Leerlauf-Dock „Gefahr“, PC D)
**Wenn** das Brett sie zeigt
**Dann** ist sie eine durchscheinende rote Fläche in drei Stufen (1 / 2 / 3+ Gegner, Deckkraft in `render.yaml`) mit roter Außenkante auf Creme
**Und** die Felder tragen keine Zahl der Angreifer (Playtest 2026-10-30: überfrachtet; die Stufe zeigt die Menge)
**Und** eigene Figuren und ihre Lebensleisten bleiben darunter lesbar.

**Angenommen** Gegner mit den KI-Profilen hold/guard, schlafende Gegner (trigger) und angekündigte Verstärkung
**Wenn** die Zone berechnet wird
**Dann** zählen hold/guard wie heute ohne Bewegung, schlafende Gegner zählen nicht und ihre Zone steht als gestrichelte Kante da, Verstärkungen behalten ihre Ankunftsmarke
**Und** die Zählung ist eine reine Funktion (`threatCounts`) aus `threatTiles`, getestet.

**Angenommen** ein Langdruck auf einen Gegner (Steckbrief bzw. Einheiten-Info)
**Wenn** seine Zone erscheint
**Dann** zeigt sie nur seine Außenkante in dunklerem Rot, damit sie über der Gesamtzone lesbar bleibt.

## Tasks / Subtasks

- [x] T1 `threatMap` / `threatCounts` (`core/rules/legibility.ts`) aus `threatTiles`: hold/guard ohne Bewegung, schlafende `trigger`-Gegner (`asleep`) zählen nicht und liefern die gestrichelte Kante; `only` für einzelne Gegner
- [x] T2 Fläche in drei Stufen (`threat.alpha`), rote Außenkante auf Creme; die Zahl im Creme-Kreis und ihre Option sind nach dem Playtest 2026-10-30 entfernt
- [x] T3 Verstärkungen behalten ihre Ankunftsmarke
- [x] T4 Einzelne Gegner (Tipp, Langdruck, Steckbrief): nur ihre Außenkante in dunklerem Rot (`threat.watch`), auch über der Gesamtzone
- [x] T5 Tests: Zählung gegen `threatTiles`, hold, Schlafende, `only`

## Dev Notes

- Quelle: `concept/26-epics/epics.md` Epic 13, Verhalten `concept/25-ux/EXPERIENCE.md`, Aussehen `concept/25-ux/DESIGN.md` (Tokens `hp-bar`, `grid-mark`, `range-tile`, `threat`, `kill-marker`), Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`, Architektur §5.12.
- Zahlen kommen aus reinen Kernfunktionen in `src/core/rules/legibility.ts` über `threatTiles` und `forecast` (Vorschau = Auflösung); Darstellungswerte in `content/core/render.yaml` unter `legibility`.
- `dangerZone` bleibt unverändert (KI und Autoplay rechnen weiter damit); der Kampf-Screen nutzt `threatMap`.
- Rechenzeit auf der Referenzschlacht 24×32 (40 Einheiten): `threatMap` ca. 13 ms je Zustand (Desktop), einmal je Befehl, nicht je Bild.

## Dev Agent Record

- Umgesetzt zusammen mit allen Stories von Epic 13 auf dem Branch `claude/affectionate-fermat-tb1pzv`.
- Prüfungen: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Sichtprüfung per Screenshots (iPhone-13-Profil, Mission 1-1, ohne LFS-Grafik).
