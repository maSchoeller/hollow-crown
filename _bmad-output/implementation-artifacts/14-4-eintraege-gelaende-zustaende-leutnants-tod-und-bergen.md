# Story 14.4: Einträge Gelände, Zustände, Leutnants, Tod und Bergen

Status: review

## Story

Als Spieler
möchte ich nachlesen, was Gelände, Zustände, Leutnants und die Tod-Modi bewirken,
damit mich weder Feuer noch eine Flucht noch das Verbluten überrascht.

## Acceptance Criteria

**Angenommen** die Kategorien Gelände, Zustände, Leutnants sowie Tod & Bergen
**Wenn** der Spieler sie öffnet
**Dann** gibt es Einträge zu jedem Gelände mit Verteidigung, Ausweichen, Heilung und Bewegungskosten je Bewegungstyp aus `terrain.yaml`, zu Feuer und Ausbreitung, Nass, Langsam, Wegstoßen, Felswand und Nebel, zu Groll und Kerben, Flucht bei 0 TP, Kopfgeld und Heimsuchungen, zu Niederstrecken, Verbluten, Bergen, Narben und den Modi Klassik/Standard/Casual
**Und** Texte DE + EN abgenommen.

## Tasks / Subtasks

- [x] T1 Gelände in Gruppen (offen, Deckung, Berge, Wasser, Festungen, Hindernisse, Türen, Feuer, Felswall) mit Tabellen aus `terrain.yaml` (Verteidigung, Ausweichen, Heilung, Bewegungskosten je Bewegungstyp); `content:check` verlangt jedes Gelände genau einmal
- [x] T2 Nebel, Zustände (Brennen, Nass, Verlangsamt, Rückstoß), Leutnants (Groll und Kerben, Flucht, Kopfgeld, Heimsuchungen), Tod & Bergen (Niederstrecken, Verbluten, Bergen, Narben, Modi)
- [x] T3 Texte DE + EN

## Dev Notes

- Quelle: `concept/26-epics/epics.md` Epic 14, Verhalten `concept/25-ux/EXPERIENCE.md` („Handbuch“, Kontext-„?“), Aussehen `concept/25-ux/DESIGN.md` (Handbuch-Kategorie, Handbuch-Eintrag, `help-stone`), Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`, Architektur §8.3 und Decision-Log 2026-10-30.
- Inhalt: `content/core/handbook.yaml`, Texte `content/core/locales/de.handbook.yaml` und `en.handbook.yaml`; Werte sind Pfade in die Content-Daten, Texte setzen sie als `{id}` ein.
- Kein neues Speicherformat: Entdecken (NEU-Marken, Fortschritt) und Bestiarium sind nicht Teil des Epics.

## Dev Agent Record

- Umgesetzt zusammen mit allen Stories von Epic 14 auf dem Branch `claude/elegant-wozniak-3p2ee2`.
- Prüfungen: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Sichtprüfung per Screenshots (iPhone-13-Profil, Titel → Handbuch und Prolog-Kampf, ohne LFS-Grafik).
- Offen zur Abnahme: Texte DE + EN durch den Produktinhaber.
