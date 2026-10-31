# Story 13.7: Gegnerphase-Rückblick

Status: done

## Story

Als Spieler
möchte ich nach der Gegnerphase kurz sehen, was passiert ist,
damit ich bei 2× oder Überspringen nichts Wichtiges verpasse.

## Acceptance Criteria

**Angenommen** eine Gegnerphase, in der etwas geschah
**Wenn** die Spielerphase beginnt
**Dann** liegt über der Einheitenkarte ein Stein „Gegnerphase n“ mit einer Zeile je Ereignis: zuerst Niedergestreckte und Gefallene (mit Verblutungs-Zähler bzw. in Klassik „gefallen“), dann Treffer auf eigene Figuren (TP vorher → nachher, Verfehlt als „weicht aus“), dann Verstärkungen und geweckte Gegner
**Und** eine Nebentaste „Figur zeigen“ bzw. ein Tipp auf eine Zeile zentriert die Kamera auf Figur oder Ort
**Und** die Liste entsteht als reine Funktion aus den Events der Phase, getestet.

**Angenommen** der Rückblick ist offen
**Wenn** der Spieler aufs Brett tippt oder eine Einheit wählt
**Dann** schließt er sich ohne Rückfrage; er blockiert nie, erscheint nicht, wenn nichts geschah, und Lektionen und Szenen haben Vorrang.

## Tasks / Subtasks

- [x] T1 `phaseRecap(data, before, after, events)`: Niedergestreckte (mit Verblutungs-Zähler) und Gefallene zuerst, dann Treffer auf eigene Figuren (TP vorher → nachher, alle verfehlt = „weicht aus“), dann Verstärkungen und geweckte Gegner; leer, wenn nichts geschah
- [x] T2 `RecapStone` über der Einheitenkarte („Gegnerphase n“, Zeile je Ereignis, Zahl rechts, „Figur zeigen“), aus den sichtbaren Ereignissen (`filterEvents`) und sichtbaren Zuständen
- [x] T3 Tipp auf eine Zeile oder „Figur zeigen“ zentriert die Kamera; Tipp aufs Brett, Auswahl oder ein neuer Befehl schließen ihn, ohne Rückfrage
- [x] T4 Tests: Reihenfolge, Werte, leerer Rückblick, Tod in Klassik

## Dev Notes

- Quelle: `concept/26-epics/epics/epic-13.md` Epic 13, Verhalten `concept/25-ux/EXPERIENCE.md`, Aussehen `concept/25-ux/DESIGN.md` (Tokens `hp-bar`, `grid-mark`, `range-tile`, `threat`, `kill-marker`), Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`, Architektur §5.12.
- Zahlen kommen aus reinen Kernfunktionen in `src/core/rules/legibility.ts` über `threatTiles` und `forecast` (Vorschau = Auflösung); Darstellungswerte in `content/core/render.yaml` unter `legibility`.
- Lektionen und Szenen laufen während des Abspielens; der Rückblick erscheint danach und blockiert nie.

## Dev Agent Record

- Umgesetzt zusammen mit allen Stories von Epic 13 auf dem Branch `claude/affectionate-fermat-tb1pzv`.
- Prüfungen: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Sichtprüfung per Screenshots (iPhone-13-Profil, Mission 1-1, ohne LFS-Grafik).

## Abnahme (2026-10-31)

Abgenommen im Spiel (375×812, Prolog und Mission 1-1, Screenshots in der Abnahme-Session) und gegen den Code geprüft; Stand nach dem Playtest 2026-10-30 (keine Feldzahlen, rot gefärbte Gegner statt Linien, kein Zurück-Stein). Bei der Abnahme behoben: Schadensvorschau zeigt die Leiste des Ziels auch bei Lebensleisten „Nur verletzte“/„Aus“; Marker und Häkchen schieben Groll-Wimpel und Zustands-Symbole hoch, auch wenn die Leiste verborgen ist; Tests für Doppelangriff, Element und alte Einstellungen verschärft; Standardwert „Zahlen an“ aus 13.1 gestrichen. Status: done.
