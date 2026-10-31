# Story 14.3: Einträge Grundlagen, Kampf, Waffen und Elemente

Status: done

## Story

Als Spieler
möchte ich verstehen, wie Phasen, Bewegung, Treffer, Krit, Doppelangriff, Waffendreieck und Elemente funktionieren,
damit ich die Kampfvorschau deuten kann.

## Acceptance Criteria

**Angenommen** die Kategorien Grundlagen, Kampf sowie Waffen & Elemente
**Wenn** der Spieler sie öffnet
**Dann** gibt es Einträge mindestens zu Phasen und Aktionen, Bewegung und Zurücknehmen, Speichern, Trefferchance (zwei Würfel), Schaden, Krit, Doppelangriff, Supports im Kampf, Waffendreieck (Grafik) und Elementkreislauf (Grafik) mit Werten aus `balance.yaml`
**Und** die Texte liegen DE und EN vor und sind vom Produktinhaber abgenommen.

## Tasks / Subtasks

- [x] T1 Einträge Grundlagen (Phasen, Bewegung und Zurücknehmen, Gefahrenzone, Speichern), Kampf (Kampfvorschau, Trefferchance mit zwei Würfen, Schaden, Krit, Doppelangriff, Supports im Kampf), Waffen & Elemente (Waffendreieck, Elemente, Zauber und Wirken)
- [x] T2 Grafiken Waffendreieck und Elementkreislauf aus `balance.triangle.beats` bzw. `balance.element.cycle`/`opposed`
- [x] T3 Texte DE + EN in `content/core/locales/<lang>.handbook.yaml` (Entwurf, Abnahme durch den Produktinhaber im Pull Request)

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
