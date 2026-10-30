# Story 14.5: Klassen-Steckbriefe

Status: review

## Story

Als Spieler
möchte ich für jede spielbare Klasse Stärken und Schwächen sehen,
damit ich meine Truppe gezielt einsetze.

## Acceptance Criteria

**Angenommen** die Kategorie Klassen
**Wenn** der Spieler eine spielbare Klasse öffnet (`playable: true` in `classes.yaml`)
**Dann** zeigt der Steckbrief Rollen-Icon, ein Werte-Netz aus dem Wachstum, Bewegung, Bewegungstyp, Waffengruppen, Klassen-Aktion und Profi-Wege aus `classes.yaml`
**Und** je 2–3 Zeilen „stark“ und „schwach“ (Text in den Locales, DE + EN abgenommen)
**Und** eine neue spielbare Klasse ohne Steckbrief lässt `content:check` scheitern.

## Tasks / Subtasks

- [x] T1 Steckbrief-Grafik aus `classes.yaml`: Rollen-Icon, Werte-Netz aus `growth`, BEW, Bewegungstyp, Waffengruppen, Klassen-Aktion (passiv bzw. n× je Karte), Klassen-Skill, Profi-Wege (Namen noch fehlender Profi-Wege unter `handbook.pro.*`)
- [x] T2 Je Klasse `strong.1–3`/`weak.1–3` (mindestens zwei, `content:check`), Texte DE + EN
- [x] T3 `content:check` scheitert bei einer spielbaren Klasse ohne Steckbrief und bei einem Steckbrief einer nicht spielbaren Klasse (getestet)

## Dev Notes

- Quelle: `concept/26-epics/epics.md` Epic 14, Verhalten `concept/25-ux/EXPERIENCE.md` („Handbuch“, Kontext-„?“), Aussehen `concept/25-ux/DESIGN.md` (Handbuch-Kategorie, Handbuch-Eintrag, `help-stone`), Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`, Architektur §8.3 und Decision-Log 2026-10-30.
- Inhalt: `content/core/handbook.yaml`, Texte `content/core/locales/de.handbook.yaml` und `en.handbook.yaml`; Werte sind Pfade in die Content-Daten, Texte setzen sie als `{id}` ein.
- Kein neues Speicherformat: Entdecken (NEU-Marken, Fortschritt) und Bestiarium sind nicht Teil des Epics.

## Dev Agent Record

- Umgesetzt zusammen mit allen Stories von Epic 14 auf dem Branch `claude/elegant-wozniak-3p2ee2`.
- Prüfungen: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Sichtprüfung per Screenshots (iPhone-13-Profil, Titel → Handbuch und Prolog-Kampf, ohne LFS-Grafik).
- Offen zur Abnahme: Texte DE + EN durch den Produktinhaber.
