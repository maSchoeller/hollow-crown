# Story 14.2: Handbuch-Screen und Einstieg

Status: done

## Story

Als Spieler
möchte ich das Handbuch aus jedem Menü öffnen und Einträge schnell finden,
damit ich Regeln nachlese, wann immer ich unsicher bin.

## Acceptance Criteria

**Angenommen** das Menü im Kampf, das Menü auf der Weltkarte oder der Titel
**Wenn** der Spieler „Handbuch“ wählt (im Kampf an zweiter Stelle unter Optionen)
**Dann** öffnet eine Vollbild-Ansicht im Stil B mit Zurück-Stein, Titelpille, Suchfeld und den Kategorien als Steine im Zweier-Raster
**Und** die Suche findet Einträge über Titel und Stichworte in der aktuellen Sprache.

**Angenommen** ein gewählter Eintrag
**Wenn** er öffnet
**Dann** zeigt er Grafik, Werte-Feld (aufgelöste Werte, Symbol + Zahl), einen Satz „wo im Spiel“ und Querverweise als Chips; ein Querverweis öffnet den anderen Eintrag, Zurück führt zum vorigen
**Und** aus dem Kampf heraus liegt das Handbuch über dem Kampf; Schließen kehrt in denselben Zustand zurück, ohne Command und ohne Speichern.

## Tasks / Subtasks

- [x] T1 Bildschirm `{ name: 'handbook', back }` (Titel, Weltkarten-Menü) und Blatt über jedem Bildschirm (`src/app/state/handbook.ts`, `HandbookSheet` in `App.tsx`), Kampfmenü „Handbuch“ an zweiter Stelle unter Optionen
- [x] T2 `src/app/screens/Handbook.tsx` + `Handbook.css`: Zurück-Stein, Titelpille (Kategorie bzw. „ab Akt n“ rechts), Suchfeld, Kategorien als Steine im Zweier-Raster mit Anzahl, Eintragsliste, Eintrag mit Grafik, Text, Werte-Feld (Symbol + Zahl), „Im Spiel“, Querverweisen als Chips; Zurück führt durch den Verlauf
- [x] T3 Kampf bleibt darunter stehen: kein Command, kein Speichern; Esc und Tastatur des Kampfs ruhen, solange das Blatt offen ist
- [x] T4 Symbole `book` und `search` in `src/ui/icons.tsx`

## Dev Notes

- Quelle: `concept/26-epics/epics.md` Epic 14, Verhalten `concept/25-ux/EXPERIENCE.md` („Handbuch“, Kontext-„?“), Aussehen `concept/25-ux/DESIGN.md` (Handbuch-Kategorie, Handbuch-Eintrag, `help-stone`), Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`, Architektur §8.3 und Decision-Log 2026-10-30.
- Inhalt: `content/core/handbook.yaml`, Texte `content/core/locales/de.handbook.yaml` und `en.handbook.yaml`; Werte sind Pfade in die Content-Daten, Texte setzen sie als `{id}` ein.
- Kein neues Speicherformat: Entdecken (NEU-Marken, Fortschritt) und Bestiarium sind nicht Teil des Epics.

## Dev Agent Record

- Umgesetzt zusammen mit allen Stories von Epic 14 auf dem Branch `claude/elegant-wozniak-3p2ee2`.
- Prüfungen: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Sichtprüfung per Screenshots (iPhone-13-Profil, Titel → Handbuch und Prolog-Kampf, ohne LFS-Grafik).
- Offen zur Abnahme: Texte DE + EN durch den Produktinhaber.

## Abnahme (2026-10-31)

Abgenommen im Spiel (Titel, Kampfmenü, Kontext-„?“ an Lektion und Kampfvorschau) und gegen den Code geprüft; Texte DE + EN vom Produktinhaber abgenommen. Bei der Abnahme behoben: Kontext-„?“ auch an den Zustands-Chips von Einheitenkarte und Kampfvorschau, „?“ der Kampfvorschau unter die Tabelle (verdeckte den Waffennamen), Abstand des „?“ zu Zahlen, Ziffern-Prüfung auf alle `handbook.*`-Texte ausgeweitet, Kulissenhaus heißt „Gebäude“, Profi-Klassen tragen „ab Akt 2“. Wunsch für später: Einträge mit Ausschnitten wichtiger UI-Elemente bzw. Beispiel-Assets bebildern. Status: done.
