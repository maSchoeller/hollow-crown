# Story 13.8: Gegner-Leiste

Status: done

## Story

Als Spieler
möchte ich auf Wunsch alle Gegner mit ihren TP in einer Reihe sehen,
damit ich auf großen Karten niemanden übersehe.

## Acceptance Criteria

**Angenommen** die Option „Gegner-Leiste“ ist an (Standard aus)
**Wenn** die Spielerphase läuft
**Dann** steht unter den Ziel-Pillen eine Reihe kleiner Medaillons aller sichtbaren Gegner mit TP-Ring und TP-Zahl, Leutnants mit Goldring zuerst; Gegner im Nebel fehlen
**Und** ein Tipp zentriert die Kamera auf den Gegner, ein Langdruck öffnet seine Info; bei vielen Gegnern lässt sich die Reihe seitlich wischen
**Und** auf Tablet und PC sitzt sie in der Seitenleiste (UX-DR24).

## Tasks / Subtasks

- [x] T1 `EnemyStrip` mit `stripFoes` (sichtbare aktive Gegner, Leutnants zuerst), Medaillon 34 px mit TP-Ring und TP-Zahl, Leutnant mit Goldring
- [x] T2 Tipp zentriert, Langdruck (400 ms) öffnet Info bzw. Steckbrief wie der Langdruck auf dem Brett; seitlich wischbar
- [x] T3 Telefon: unter den Ziel-Pillen; Tablet/PC: in der linken Seitenleiste unter der Truppe

## Dev Notes

- Quelle: `concept/26-epics/epics/epic-13.md` Epic 13, Verhalten `concept/25-ux/EXPERIENCE.md`, Aussehen `concept/25-ux/DESIGN.md` (Tokens `hp-bar`, `grid-mark`, `range-tile`, `threat`, `kill-marker`), Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`, Architektur §5.12.
- Zahlen kommen aus reinen Kernfunktionen in `src/core/rules/legibility.ts` über `threatTiles` und `forecast` (Vorschau = Auflösung); Darstellungswerte in `content/core/render.yaml` unter `legibility`.
- Gegner im Nebel fehlen, weil der Screen mit `visibleState` arbeitet.

## Dev Agent Record

- Umgesetzt zusammen mit allen Stories von Epic 13 auf dem Branch `claude/affectionate-fermat-tb1pzv`.
- Prüfungen: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Sichtprüfung per Screenshots (iPhone-13-Profil, Mission 1-1, ohne LFS-Grafik).

## Abnahme (2026-10-31)

Abgenommen im Spiel (375×812, Prolog und Mission 1-1, Screenshots in der Abnahme-Session) und gegen den Code geprüft; Stand nach dem Playtest 2026-10-30 (keine Feldzahlen, rot gefärbte Gegner statt Linien, kein Zurück-Stein). Bei der Abnahme behoben: Schadensvorschau zeigt die Leiste des Ziels auch bei Lebensleisten „Nur verletzte“/„Aus“; Marker und Häkchen schieben Groll-Wimpel und Zustands-Symbole hoch, auch wenn die Leiste verborgen ist; Tests für Doppelangriff, Element und alte Einstellungen verschärft; Standardwert „Zahlen an“ aus 13.1 gestrichen. Status: done.
