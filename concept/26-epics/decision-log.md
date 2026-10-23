# Entscheidungslog – Epics und Stories Staffel 1

| Datum | Entscheidung | Begründung |
|---|---|---|
| 2026-10-23 | Epics und Stories gestartet (`gds-create-epics-and-stories`), nach Architektur (`24`) und UX (`25`); Ablage `concept/26-epics/` (ursprünglich als `25-epics` gewählt, durch die eingeschobene UX-Etappe verschoben); löst die Grobfassung `concept/21-gdd/epics.md` ab | Etappe 5 des BMAD-Pfads |
| 2026-10-23 | Tiefe: MVP (alles bis zum Akt-1-Release) mit vollen Akzeptanzkriterien; Burg, Akt 2 und Akt 3 als Story-Liste mit Kurz-Kriterien, vor dem jeweiligen Akt zu verfeinern | Produktinhaber, Empfehlung bestätigt; spätere Details ändern sich nach dem MVP-Playtest |
| 2026-10-23 | Content-Epics: eine Story je Mission bzw. Nebenquest (Karte, Szenen, Leutnant, Heimsuchungs-Anker, Sim-Korridor) | Produktinhaber, Empfehlung bestätigt |
| 2026-10-23 | Erst UX-Etappe, dann Epics | Produktinhaber |
| 2026-10-23 | **12 Epics nach Spielerwert**, Fundament-Bausteine im ersten Epic, das sie braucht; E0 aus der Architektur entfällt | Produktinhaber, Empfehlung bestätigt; BMAD „keine große Vorleistung“, früh spielbar |
| 2026-10-23 | Profi-Wege und Fallensteller/Schatten wandern nach Epic 10 (Burg), weil Aufstieg erst ab Akt 2 möglich ist (Stufendeckel 10, Akademie ab Akt 2) | Assistent [C], folgt aus dem GDD |
| 2026-10-23 | Content-Layout `content/core/` + `content/acts/actN/` entsteht in Epic 4 (erste Story), weil Akt-Daten dort zuerst gebraucht werden; Epic 7 baut darauf die Pakete | Assistent [C] |
| 2026-10-23 | Epics 1–4 mit 31 Stories freigegeben; HTML-Ansicht in `concept/26-epics/html/epics-1-4.html` (erzeugt mit `tools/docs/epics_html.py`) | Produktinhaber |
| 2026-10-23 | Epics 5–9 mit 38 Stories freigegeben; HTML in `concept/26-epics/html/epics-5-9.html` | Produktinhaber |
| 2026-10-23 | Epics 10–12 (grob, 30 Stories) freigegeben; Validierung (FR- und UX-Abdeckung, Abhängigkeiten) im Dokument; `status: final`. Gesamtansicht `html/epics.html`; Verweise in `concept/README.md`, `AGENTS.md`, `21-gdd/epics.md`. Nächster Schritt: `gds-check-implementation-readiness`, dann `gds-sprint-planning` | Abschluss Etappe 5 |
| 2026-10-23 | Story 8.2 an den Stand von `main` angeglichen (PR #18: Teamtuch, Hand-Waffe, `pnpm art:tripo` vorhanden); offen bleiben Waffengruppen-Bibliothek, Animationsübertragung, Einbindung in die Pakete | Merge von `main` |
| 2026-10-23 | Readiness-Check (`gds-check-implementation-readiness`): Urteil **NEEDS WORK**, Bericht `implementation-readiness-report-2026-10-23.md`; keine Lücke stellt ein Epic in Frage, offene Punkte (O1/O2-Status widersprüchlich, O4, O5/GA26) bleiben beim Produktinhaber | Etappe 6 des BMAD-Pfads |
| 2026-10-23 | Sprint-Planung (`gds-sprint-planning`): `_bmad-output/implementation-artifacts/sprint-status.yaml` mit 12 Epics, 99 Stories; Story-Schlüssel aus den deutschen Titeln, Umlaute transliteriert (ä→ae, ö→oe, ü→ue, ß→ss) | Assistent [C], Schlüssel müssen ASCII sein |
| 2026-10-23 | Story 1.2 vor 1.1 umgesetzt, weil 1.1 `src/ui/` berührt, wo parallel die Inventar-Oberfläche entsteht | Hauptsession |
| 2026-10-23 | Story 1.2: Kampagnen-ID entsteht in `persistence` und liegt nur in Meta und `SaveRecord`, nicht in `CampaignState`; `contentVersion` ist bis Epic 7 eine Prüfsumme des geladenen Contents; Meta-`act` fest 1 bis Epic 4, Meta-`name` = Avatar-Name | Assistent [C], hält `src/core` unverändert; Quellen für Akt und Paketversion entstehen erst später |
| 2026-10-23 | Story 1.2: Lösch-Dialog bei drei Kampagnen als Zwischenlösung im bestehenden Neues-Spiel-Screen; die Kampagnen-Ansicht (Story 1.3) ersetzt ihn | Assistent [C], Vorwärtsabhängigkeit auf 1.3 vermeiden |
| 2026-10-23 | `fake-indexeddb` als Dev-Abhängigkeit für Speichertests | Assistent [C], AR1 betrifft nur Laufzeit-Abhängigkeiten |
