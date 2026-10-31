# Story 13.3: Lebensleisten über den Figuren

Status: done

## Story

Als Spieler
möchte ich über jeder Figur sehen, wie viele TP sie noch hat,
damit ich angeschlagene Gegner und gefährdete Gefährten ohne Antippen erkenne.

## Acceptance Criteria

**Angenommen** ein Kampf mit Lebensleisten „Immer“
**Wenn** das Brett steht
**Dann** trägt jede sichtbare Figur über dem Kopf eine Leiste nach DESIGN.md (`hp-bar`): Creme-Grund, Füllung in Teamfarbe, dunkle Kontur, Leutnant mit Goldkontur, Teilstrich je 5 TP und ab 40 max. TP je 10 (`render.yaml`)
**Und** sie liegt in der DOM-Ebene der Verblutungs-Zähler, folgt der Figur bei Bewegung, Zoom und Kamerafahrt und verdeckt weder Groll-Wimpel noch Zustands-Symbole.

**Angenommen** eine Figur unter 25 % ihrer max. TP (Schwelle in `render.yaml`)
**Wenn** sie auf dem Brett steht
**Dann** hat ihre Leiste einen pulsierenden Glutrand; mit `prefers-reduced-motion` ist der Rand fest
**Und** die Füllung bleibt Teamfarbe.

**Angenommen** die Gegnerphase oder ein eigener Angriff
**Wenn** eine Figur Schaden nimmt oder geheilt wird
**Dann** ändert sich ihre Leiste im Takt der Trefferanimation (`onUnitHp`)
**Und** „Nur verletzte“ zeigt Leisten nur unter max. TP (Leutnants immer), „Aus“ zeigt keine; niedergestreckte, geflohene und tote Figuren haben keine Leiste.

## Tasks / Subtasks

- [x] T1 `Badges` (`src/render/board/badges.ts`, `badges.css`): ein DOM-Element je Einheit in der Float-Ebene, Leiste mit Creme-Grund, Füllung in Teamfarbe, dunkler Kontur, Leutnant mit Goldkontur, Teilstriche per Hintergrund-Verlauf (5 TP, ab 40 max. TP 10)
- [x] T2 Kritisch unter `hpBar.critical` (25 %): pulsierender Glutrand, mit `prefers-reduced-motion` fest
- [x] T3 Die Leiste folgt Treffern, Schaden und Heilung im Takt der Animation (`strike`, `damage`, `heal` im Brett); niedergestreckt, geflohen, tot: keine Leiste
- [x] T4 Option „Immer / Nur verletzte / Aus“ (`barShown`, Leutnants unter „Nur verletzte“ immer)
- [x] T5 Platzierung je Bild nur bei geänderter Position (gerundete px), Breite aus der Zoomstufe (`widthTiles`, `minPx`..`maxPx`); Groll-Wimpel und Zustands-Symbole rücken über die Leiste
- [x] T6 Tests: `barLook`, `barShown`

## Dev Notes

- Quelle: `concept/26-epics/epics.md` Epic 13, Verhalten `concept/25-ux/EXPERIENCE.md`, Aussehen `concept/25-ux/DESIGN.md` (Tokens `hp-bar`, `grid-mark`, `range-tile`, `threat`, `kill-marker`), Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`, Architektur §5.12.
- Zahlen kommen aus reinen Kernfunktionen in `src/core/rules/legibility.ts` über `threatTiles` und `forecast` (Vorschau = Auflösung); Darstellungswerte in `content/core/render.yaml` unter `legibility`.
- `maxHpOf` (`core/rules/legibility.ts`) liefert die max. TP mit denselben Werten wie die Einheitenkarte (`computeStats`).

## Dev Agent Record

- Umgesetzt zusammen mit allen Stories von Epic 13 auf dem Branch `claude/affectionate-fermat-tb1pzv`.
- Prüfungen: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Sichtprüfung per Screenshots (iPhone-13-Profil, Mission 1-1, ohne LFS-Grafik).

## Abnahme (2026-10-31)

Abgenommen im Spiel (375×812, Prolog und Mission 1-1, Screenshots in der Abnahme-Session) und gegen den Code geprüft; Stand nach dem Playtest 2026-10-30 (keine Feldzahlen, rot gefärbte Gegner statt Linien, kein Zurück-Stein). Bei der Abnahme behoben: Schadensvorschau zeigt die Leiste des Ziels auch bei Lebensleisten „Nur verletzte“/„Aus“; Marker und Häkchen schieben Groll-Wimpel und Zustands-Symbole hoch, auch wenn die Leiste verborgen ist; Tests für Doppelangriff, Element und alte Einstellungen verschärft; Standardwert „Zahlen an“ aus 13.1 gestrichen. Status: done.
