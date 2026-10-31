---
title: 'Hollow Crown – Epics und Stories (Staffel 1)'
stepsCompleted: [1, 2, 3, 4]
status: final
created: 2026-10-23
updated: 2026-10-30
readiness: concept/26-epics/implementation-readiness-report-2026-10-23.md (Auflösung der Befunde in Abschnitt 9)
source: BMAD-Workflow gds-create-epics-and-stories
decisions: concept/26-epics/decision-log.md
inputDocuments:
  - concept/21-gdd/gdd.md
  - concept/21-gdd/epics.md
  - concept/21-gdd/extract-01-decisions.md
  - concept/20-game-brief/brief.md
  - concept/22-narrative/narrative.md
  - concept/23-art-direction/art-direction.md
  - concept/24-architecture/architecture.md
  - concept/25-ux/DESIGN.md
  - concept/25-ux/EXPERIENCE.md
supersedes: concept/21-gdd/epics.md (Grobfassung)
---

# Hollow Crown – Epics und Stories (Staffel 1)

## Overview

Dieses Dokument zerlegt GDD, Narrative, Architektur und UX von Hollow Crown, Staffel 1, in umsetzbare Epics und Stories. Es löst die Grobfassung `concept/21-gdd/epics.md` ab. Bis einschließlich Burg-Ausbau und Akt 2 (Epic 10 und 11, verfeinert am 2026-10-31) sind die Stories mit vollen Akzeptanzkriterien ausgearbeitet; Akt 3 steht als Story-Liste mit Kurz-Kriterien und wird vor dem Akt verfeinert. Jede Story ist erst fertig, wenn `pnpm lint`, `pnpm test`, `pnpm content:check` und `pnpm build` grün sind (AGENTS.md).

Kennzeichnung: **(neu)** gibt es im PoC nicht, **(geändert)** ersetzt PoC-Verhalten, **(bestehend)** ist im PoC umgesetzt und wird nur übernommen bzw. geprüft.

## Requirements Inventory

### Functional Requirements

**Kampf und Regeln (GDD Game Mechanics, Tactics)**

- FR1 (bestehend): Rundenablauf Spieler → Gegner → Dritte Partei; je Einheit Bewegung + 1 Aktion, Bewegung bis zur Aktion zurücknehmbar; freie Aktionen Tauschen, Konvoi, Waffenwechsel.
- FR2 (bestehend): Formeln für Treffer, Schaden, Krit, Doppelangriff, Waffendreieck, Effektivität, Elemente, Status, Gelände und Elementfelder laut GDD; Vorschau nutzt denselben Code.
- FR3 (bestehend): Supports mit Punkten, Nachbarbonus, Tandem ab B, Schutz ab A, Trauer.
- FR4 (geändert): Tod-Modi Klassik/Standard/Casual; in Standard **Verbluten nach 3 eigenen Phasen** ohne Bergen, sichtbarer Zähler, jeder weitere Treffer tötet; nach 2 Narben ist der nächste 0-TP-Fall tödlich; Avatar oder Kael bei 0 TP = Niederlage.
- FR5 (geändert; im PoC in der App, künftig als Kampagnen-Command): Neustart: Runde neu (Standard/Casual) und Mission neu (alle Modi; Klassik nur nach Niederlage) setzen alles inklusive Tode auf den jeweiligen Beginn zurück.
- FR6 (bestehend): Missionsziele rout, boss, reach, seize, defend, survive, escape; Nebenziele visit_villages, no_downs, turn_limit, kill_with, recruit, open_chests, protect_npc; Verstärkungen eine Runde angekündigt, Hinterhalte nur auf Schwer.
- FR7 (neu): Neue Missionsziele **escort** (NPC zum Ausgang bringen) und **treasure** (Truhen vor Rundenlimit bergen) mit Sieg- und Niederlagebedingungen.
- FR8 (neu; im PoC nur als Datenfeld): Nebel des Krieges auf einzelnen Karten (Sicht 3, Boni je Rolle); Mauern und geschlossene Türen blockieren die Sicht.
- FR9 (bestehend): Gegner-KI mit Profilen aggressive, hold, guard, trigger, hunt, raider, flee, support und Zielwertung; Zugreihenfolge nach Kill-Chance, dann Distanz.
- FR10 (bestehend): Schwierigkeit Leicht/Normal/Schwer (Gegnerwerte −15/0/+15 %, Aufstellung je Schwierigkeit, Schwer mit Affixen und Hinterhalten), nur absenkbar; Tod-Modus unabhängig.

**Rollenklassen (GDD Rollenklassen)**

- FR11 (geändert): Klasse ist eine Rolle mit Bewegungstyp, erlaubten Waffengruppen, Klassen-Aktion und Wachstum; Waffe, Element und Item-Skills kommen aus der Ausrüstung; die Waffengruppen begrenzen das Ausrüsten.
- FR12 (neu): 7 Kernrollen (Vorkämpfer, Plänkler, Schütze, Elementarist, Heiler, Späher, Spielmann) plus Unikate Taktiker (Avatar) und Hauptmann (Kael), Werte aus den PoC-Klassen abgeleitet.
- FR13 (neu): Klassen-Aktionen: Halten (passiv, Bewegungssperre auf Nachbarfeldern), Nachsetzen (Restbewegung nach Angriff), Zielen (+1 Reichweite, +15 Treffer ohne Bewegung), Wirken (Elementfeld 2 Runden), Fernbergen (2 Felder), Öffnen/Stehlen, Anfeuern (+1 MOV, +10 Treffer); Befehl und Sammelruf (bestehend); jede mit Vorschau.
- FR14 (neu): Je Rolle 2 Profi-Wege mit den Unterschieden aus dem GDD (14 Profiklassen + Großstratege + Bannerherr).
- FR15 (neu): Späher-Profi Fallensteller (max. 2 für Gegner unsichtbare Fallen auf Nachbarfeldern, nur Gegner lösen aus: Bewegung endet, 8 Schaden + Verlangsamt; eigene Fallen zurücknehmen) und Schatten (für Gegner unsichtbar, solange kein Gegner näher als 3 Felder steht, im Nebel immer; nach eigenem Angriff sichtbar bis Ende der nächsten Gegnerphase).
- FR16 (neu): Die KI kennt Haltezonen (Umweg ≤ 2 Felder) und nutzt gegnerisches Wirken nach GDD-Regel.
- FR17 (neu): Gegnertypen pro Akt dürfen eigene Regeln haben (Bandit, Wolfsreiter, Pegasusritter, Ritter, Glut-Fanatiker, Untote, Drache).

**Leutnants (GDD Leutnants)**

- FR18 (neu): 12 benannte Leutnants (4 je Akt) mit Porträt, Signaturwaffe, 3 Groll-Fähigkeiten und Groll-Zeilen; sie sterben nie.
- FR19 (neu): Bei 0 TP flieht ein Leutnant und verlässt die Karte; zählt für Ziele als besiegt; die Vorschau zeigt „flieht“.
- FR20 (neu): Groll 0–3, +1 je Vertreibung; jede Stufe +1 Ausrüstungs-Tier und eine Groll-Fähigkeit; Entscheidungen senken Groll um 1.
- FR21 (neu): Groll-Ziel ist der letzte Vertreiber, KI-Gewicht +20, Groll-Zeile beim Wiedersehen; stirbt das Ziel, bleibt der Groll bis zur nächsten Vertreibung, bis dahin Gedenk-Spottzeile.
- FR22 (neu): Stufe = Durchschnitt der 6 stärksten Einheiten + Groll.
- FR23 (neu): Kopfgeld 200 × (Groll + 1) Gold + 1–2 Material; Signatur-Item 10 % je Vertreibung, garantiert bei der 4.
- FR24 (neu): Steckbrief-Ansicht je Leutnant (Groll, Ziel, Begegnungen, Fähigkeiten, Fluchtregel); erste Begegnung in Mission 1-2.
- FR25 (neu): Seitenwechsel von Grosk, Sable und Mael über Entscheidungen; danach keine Heimsuchungen mit ihnen.

**Kampagne, Weltkarte, Heimsuchungen (GDD Kampagnenstruktur, Welt und Erkundung)**

- FR26 (neu, Course Correction 2026-10-23): 3 Akte mit 25 Story-Missionen (Prolog + 8 / 8 / 8); erste Mission je Akt fest, danach 2–3 parallel wählbar, Finale nach allen anderen; Akt 1 ab der Eroberung der Paktwacht (1-6 → 1-8) und Akt 3 ab der Krönung linear.
- FR27 (neu): Missionszustände: Story nicht wiederholbar, Nebenquests über Akte offen mit Gedenk-Variante, Heimsuchungen erst nach der ersten Leutnant-Begegnung, max. 6 offen.
- FR28 (geändert): Gestaffelte Regeln nach Zahl abgeschlossener Story-Missionen (Bewegung/Angriff → Dreieck → Magie → Elemente/Status/Runen/Supports); Klassen-Aktionen einer Rolle, sobald der erste Gefährte der Rolle beitritt; max. eine Lektion je Runde.
- FR29 (neu): Weltkarte von Valmora (flaches gemaltes Bild mit HTML-Steinen) mit 3 Regionen, Nebel je Akt, Drachenzeichen je Akt (später optional), Knoten Story/Nebenquest/Heimsuchung/Heimat.
- FR30 (neu): Tageswechsel: einmal pro Kalendertag 1–3 Heimsuchungen auf gespielten Karten, reproduzierbar aus dem Datum; Stau bis 3 Tagespakete; Uhr zählt nur vorwärts.
- FR31 (neu): Heimsuchungs-Varianten boss, defend, rout (Banditennest), escort, treasure mit mindestens einem Leutnant aus einem erreichten Akt und Gegnern auf Armee-Stufe.
- FR32 (neu): Heimsuchungs-Belohnung 40 % Gold, Kopfgeld, Material, 60 % EP, keine Glutfunken; ab der 4. Heimsuchung seit der letzten Story-Mission Gold und Kopfgeld halbiert; über der erwarteten Armee-Stufe 50 % EP.
- FR33 (neu): 10 Nebenquests (3/3/4) mit Auslösern aus Entscheidungen, Gefährten oder Fortschritt; 7 mit Glutfunke plus Sonderbelohnung, 3 persönliche (N3, N6, N10) mit Signaturwaffe.

**Story, Entscheidungen, Supports (GDD Quest-System, NPC und Dialog; Narrative)**

- FR34 (geändert): Visual-Novel-Szenen vor und nach jeder Mission, Sprechblasen im Kampf; Log, Auto, Tempo, Überspringen, gesehene Szenen ganz überspringbar.
- FR35 (neu): Ersatzsprecher-Kette je Zeile, Gedenkzeilen bei toten Brückenfiguren, Bedingungen je Zeile (Flags, Leben, Haltung).
- FR36 (neu): 12 Entscheidungen (4 je Akt) mit 2–3 Antworten nur außerhalb des Kampfs; Wirkungen: Gefährte kommt/geht, Nebenquest öffnet, Groll −1, Händlerpreise ±10 %, Dorfhilfe, Gold; Flags im Spielstand.
- FR37 (neu): Haltungsprofil warm/nüchtern/trotzig je Antwort, färbt einzelne Zeilen und Epilog.
- FR38 (neu): 12 Chronik-Seiten; Bonus-Ende „Vhaelyra fragen“ nur mit allen 12.
- FR39 (neu): Epilog-Mosaik mit einer Kachel je Story-Gefährte (lebt/gefallen/gegangen + Wendung) und je Region; Staffel-Ende-Flag `s1_ending`.
- FR40 (geändert): Supports als 25 feste Paare mit C/B/A-Gesprächen am Lagerfeuer, S-Rang nur für 6 Kernpaare; Punkte und Schwellen laut GDD.
- FR41 (bestehend/geändert): Rekrutierung über Handlung, Ansprechen, Entscheidungen, Nebenquests; Taverne für Söldner; Armee-Limit 20 Gefährten + 6 Söldner.
- FR42 (neu): Barks, Groll-Zeilen, Boss-Zitate und 2 Schlüsselszenen vertont (DE + EN), Untertitel immer an.

**Fortschritt und Wirtschaft (GDD RPG, Progression)**

- FR43 (geändert): Stufen 1–20 je Klassenstufe, Deckel 10 in Akt 1 (EP darüber verfallen), danach 20; EP-Regeln laut GDD inklusive Leutnant-Bonus.
- FR44 (neu): Glutfunke als Aufstiegs-Item (12 in Staffel 1: 2 aus dem Akt-1-Finale, 7 aus 7 der 10 Nebenquests, 3 rotierend beim Händler ab Stufe 3 für 3 000 Gold); Aufstieg ab Stufe 10 in der Akademie mit Wahl Profi A/B, Stufe → 1, Loadout 4 → 5; Erhalt als Moment inszeniert.
- FR45 (bestehend): Item-Skills mit Meisterung durch Tragen; Paperdoll, Gewicht, Seltenheit, Affixe, Runen, Sets, Aufwerten, Verbrauchsgüter, Konvoi 200.
- FR46 (neu): Ausrüstungs-Tier je Akt (Eisen, Stahl, Silber/Mondstahl) im Händler-Sortiment; Legendäre und Signatur-Items aus Nebenquests und Leutnants.
- FR47 (geändert): Goldkurve je Akt (Prolog 300; Akt 1 800–1 500; Akt 2 2 000–3 000; Akt 3 3 000–4 500; Nebenziele +30–50 %), Startgold 500; Material Eisenerz, Mondstahl, Drachenschuppe, Arkanstaub; Kosten laut GDD.
- FR48 (neu): Simulation über die verkettete Kampagne mit Heimsuchungen und Reserve-EP; Zielkorridore je Story-Mission.

**Heimat (GDD Heimat)**

- FR49 (geändert): Akt 1 bis Mission 1-6 wanderndes Lager mit Konvoi, Händler, Schmied, Heiler, Taverne, Lagerfeuer auf Stufe 1.
- FR50 (neu): Ab Mission 1-6 Burg; in Akt 1 die sechs Lagerfunktionen auf Stufe 1 und die Gedächtnishalle mit Gedenksteinen; ab Akt 2 alle 11 Räume (Konvoi, Händler, Schmied, Verzauberer, Heiler, Taverne, Lagerfeuer, Akademie, Werkstatt, Gedächtnishalle, Übungsplatz), je 3 Stufen; Ausbau über passenden Gefährten + Gold.
- FR51 (neu): Werkstatt stellt Verbrauchsgüter aus Material her.
- FR52 (neu): Gedächtnishalle mit Gedenksteinen (auch Söldner); einmal pro Akt vererbt ein Gefallener eine Lektion.
- FR53 (neu): Übungsplatz gibt Reserve-EP (20/35/50 % der Durchschnitts-EP).
- FR54 (neu): Sichtbares Wachstum: Gefährten und ihre Gegenstände in der Burg, leerer Platz und Gedenkstein nach einem Tod.
- FR55 (neu): Eroberung der Burgruine in Mission 1-6 macht die Burg sofort zur Heimat; das Akt-1-Finale 1-8 verteidigt sie.

**Spielstände und Auslieferung (GDD Technical, Architektur)**

- FR56 (geändert): Auto-Save nach jeder Aktion; bis zu 3 Kampagnen je Gerät; Standard/Casual mit 3 Speicherplätzen je Kampagne, Klassik nur Auto-Save; Export/Import; Import überschreibt.
- FR57 (neu): Ein Spielstand trägt über Akt-Releases; Staffel 2 übernimmt nur die Staffel-Zusammenfassung (Entscheidungen, Überlebende, Ende).
- FR58 (neu): Akt-Pakete laden im Hintergrund und sind danach offline spielbar; Missionen eines fehlenden Pakets sind sichtbar, aber gesperrt; „Akt n erscheint bald“ am Ende eines veröffentlichten Akts.
- FR59 (neu): Proof-of-Concept-Spielstände werden erkannt und als nicht kompatibel gezeigt, Export bleibt möglich.

**Inhalte (Narrative Missionsfolge)**

- FR60 (neu): Akt 1: Prolog + 8 Story-Missionen, 3 Nebenquests (N1–N3), 4 Leutnants (Hask, Morra, Ulvric, Grosk), Entscheidungen E1–E4, Beitritte laut Narrative, Akt-1-Supports, 2 Glutfunken im Finale 1-8.
- FR61 (neu): Akt 2: 8 Story-Missionen inkl. großer Schlacht Kronfeld, N4–N6, Leutnants Brakka, Grell, Sable, Rowena, E5–E8, Region 2, Burg als Heimat.
- FR62 (neu): Akt 3: 8 Story-Missionen inkl. 2 großer Schlachten, N7–N10, Leutnants Eluned, Cassian, Mael, Torvald, Drachen als dritte Partei, E9–E12, Region 3, Epilog.
- FR63 (neu): Alle Texte in DE und EN.

### NonFunctional Requirements

- NFR1: 60 FPS auf Pixel 6a / iPhone 12 über eine komplette Gegnerphase einer großen Schlacht (24×32, ~40 Einheiten).
- NFR2: Kaltstart unter 5 s; initialer Download (Shell + Prolog) unter 15 MB (gzip); Build bricht bei Überschreitung ab.
- NFR3: Gegner-KI unter 300 ms Rechenzeit je Gegnereinheit; Gegnerphase im Web Worker.
- NFR4: Qualitätsstufen Hoch/Mittel/Niedrig, automatisch vorgewählt.
- NFR5: Jeder Kampf und die ganze Kampagne sind aus Startzustand und Commands exakt reproduzierbar (auch Affixe, Brand, Heimsuchungen).
- NFR6: Kein `Math.random`, `Date.now`, DOM oder Babylon in `src/core`; einzige Wanduhr der Kampagne in `src/app/day.ts`.
- NFR7: Testabdeckung von `src/core` steigt Richtung 90 %, sinkt nie.
- NFR8: Offline spielbar nach dem Laden eines Pakets (PWA).
- NFR9: Daumenfreundlich: ein Zug in höchstens 3 Taps je Einheit; jede Heimat-Interaktion in höchstens 2 Taps; Tippziele ≥ 44 pt; Maus am PC vollständig.
- NFR10: Lesbare Taktik: Flucht, Groll, Verbluten, Verstärkungen werden vorher angezeigt; nichts nur über Farbe.
- NFR11: Spielwerte nur in Content-YAML; keine sichtbaren Texte im Code; Schlüssel in DE und EN vollständig.
- NFR12: Simulationskorridore je Story-Mission: Leicht ≥ 95 % Sieg und ≤ 0,5 Niedergestreckte; Normal 75–100 % und 0,4–1,3; Schwer 30–70 %.
- NFR13: Kein Täglich-Druck: Heimsuchungen ohne Ablaufdatum, Story und Nebenquests brauchen sie nicht.
- NFR14: Nemesis-Leitplanken: keine prozedurale Erzeugung von Gegnern oder Persönlichkeiten, keine Rangordnung unter Gegnern, keine Beförderung durch Spielerniederlagen.
- NFR15: KI-Assets nur nach den Auflagen aus `concept/23-art-direction/licensing.md` §6 (GA26 seit 2026-10-24 geklärt).
- NFR16: Spielzeit Staffel 1 30–35 Stunden auf Normal.

### Additional Requirements

Aus `concept/24-architecture/architecture.md` (AR = Architekturentscheidung):

- AR2: Kampagnen-Commands (`CampaignCommand`) mit `validateCampaign`/`applyCampaign`/Events; `camp.ts` wird in Handler zerlegt; Journal je Kampagne in IndexedDB mit Checkpoints bei App-Updates.
- AR3: Gemeinsame Bedingungs- und Wirkungssprache (`requires`, `effects`) mit Zod-Schema und Referenzprüfung.
- AR4: Knoten-Verfügbarkeit abgeleitet (`availableNodes`), `CampaignState.available` entfällt; `lockedMechanics` zählt `storyCount`.
- AR5: Leutnant-Content (`lieutenants.yaml`), Zustand `c.lieutenants`, `gone: 'fled'`, `previewAttack` mit `outcome: 'flees'`.
- AR6: `src/app/day.ts` (Reset 04:00 Ortszeit), Command `advanceDay{day}`, `c.day = { last, pending }`.
- AR7: Heimsuchungs-Anker je Karten-YAML (`haunts:`), Pools in `haunts.yaml`, Generator rein, `pnpm sim --haunt`.
- AR8: Klassenschema mit `role`, `weaponGroups`, `classAction`, `proPaths`; Items mit `group`; neue `Action`-Arten und Command `pursue`; `previewAction`; `visibleTiles`.
- AR9: Szenen-Schema 2 (eine Datei je Szene, DE-Text inline, Sprecherketten, `memorial`, `choice` mit `effects`), Schlüssel automatisch, EN in `locales/en/<akt>.dialogue.yaml`; `resolveScene` im Kern; PoC-Dialoge werden überführt.
- AR10: Flag-Register je Akt (`flags.yaml`), `CampaignState.flags` als Werte-Record, Haltung, Chronik, `epilogue.yaml`.
- AR11: `rooms.yaml`, `c.home`, Raum-Commands.
- AR12/AR13: Szenen-Host für das Brett (später ggf. die Heimat) mit geteiltem Asset-Cache; Weltkarte als flaches gemaltes Bild mit Orten als Prozentpositionen in `content/world/valmora.yaml`, Steine, Wege und Nebel als HTML darüber (keine 3D-Szene).
- AR14: `src/worker/core.worker.ts` führt `applyCommand` für `endPhase` aus; synchroner Fallback; `pnpm bench:ai` in CI.
- AR15/AR23: Content-Layout `content/core/` + `content/acts/actN/`, `content/packs.yaml` mit Globs und `released`, Vite-Plugin `virtual:hc-pack/<id>`, `packs.json`, Cache Storage je Paket, Service-Worker-Route, Stimmen je Sprache als eigenes Paket, Budgets in `check-bundle-size.mjs`.
- AR16–AR18: IndexedDB Version 2 mit Stores `campaigns`, `saves`, `journal`, `legacy`; Neustart-Commands; Export mit `CompressionStream`, Import mit Größenlimit und Zod; Klassik als Ehrensystem.
- AR19: `pnpm content:lock` schreibt `content/released-ids.json`; `content/renames.yaml`.
- AR20: `c.archive.s1` bei E12 und eigener Export.
- AR21: `navigator.storage.persist()`, Installationshinweis, Backup-Erinnerung nach Akt-Finale.
- AR22: `CoreInvariantError`, Fehlerbericht (Checkpoint + Journal + Kampf + 500 Log-Zeilen), Logpuffer `src/app/log.ts`.
- Kein Starter-Template: Das Projekt existiert (PoC); Epic 1 beginnt nicht mit einem Projekt-Setup.

### UX Design Requirements

Aus `concept/25-ux/DESIGN.md` und `EXPERIENCE.md`:

- UX-DR1: Design-Tokens aus `DESIGN.md` (Farben, Typografie Fraunces/Barlow/Barlow Condensed, Rundungen, Abstände) als CSS-Variablen; `src/ui/styles.css` (U21) für Spielflächen ersetzen.
- UX-DR2: Komponente „Stein“ mit Kontur, harter Unterkante und Druckzustand; Haupttaste (Glut, eine je Ansicht), Nebentaste, ruhige Taste.
- UX-DR3: Einheitliche Währungs- und Ressourcenanzeige als Symbol + Zahl (Münze, Erz-Raute, EP-Stern, Glutfunke, je Material eigenes Symbol), nie als Wort oder nackte Zahl.
- UX-DR4: Kampf-HUD: Rundenpille mit Ziel, Nebenziel-Pillen, Einheitenkarte mit Medaillon (TP-Ring), Dock mit 4 festen Plätzen (Angriff, Klassen-Aktion, Item, Warten), Leerlauf-Dock (Gefahr, Nächste, Phase beenden mit Zahl bereiter Einheiten).
- UX-DR5: Kontext-Band über der Einheitenkarte für Bergen, Ansprechen, Besuchen, Öffnen; Verblutungs-Zähler auf dem Brett und im Band.
- UX-DR6: Gegnerphase als rote Phasen-Pille; Tempo 1×/2×/Überspringen unten rechts; Sprechblasen am Kopf.
- UX-DR7: Leutnant-Darstellung: Goldring, Groll-Wimpel mit Kerben, Linie zum Groll-Ziel beim Antippen, Steckbrief per Langdruck.
- UX-DR8: Kampfvorschau im Stil B mit „flieht“, Dreieck/Element und Tandem als Chips.
- UX-DR9: Weltkarte als Hub mit Akt-Pille, Ressourcen-Pillen, Tages-Hinweis, Knoten-Typen (Farbe + Symbol), Nebel mit Regionsname, Knoten-Karte (Ziel, Plätze, Stufe, Leutnant, Belohnung, Aufstellung/Aufbrechen), Leiste mit 4 Steinen.
- UX-DR10: Heimat mit Diorama oben und Raumsteinen unten (Stufe als Punkte, Ausbau-Pfeil, Zahl für Neues, gesperrt gestrichelt); Raum-Panel über weichgezeichneter Ansicht mit Ausbau-Band.
- UX-DR11: Gedächtnishalle entsättigt bis auf Glutorange, Gedenksteine mit Ort und Rolle, Zitat, Lektion vererben.
- UX-DR12: Szenen als Halbfiguren (Sprecher hell, Zuhörer gedämpft), Namensschild als Glut-Pille, Dialogbox unten, Log/Auto/Überspringen oben rechts.
- UX-DR13: Entscheidung mit Marke „Entscheidung · hat Folgen“, zwei Taps (markieren, bestätigen); Folgen-Karte mit einer Zeile je Wirkung und Chronik-Eintrag; Dialog-Log mit eigener Wahl.
- UX-DR14: Truppe als Medaillon-Raster mit Rollenfilter und Marken (Aufstieg, Gespräche, Narbe); Figur mit Halbfigur, 10 Werten, 6 Ausrüstungs- und 3 Beutelplätzen, Last- und Meisterungsbalken; Wischen wechselt die Figur.
- UX-DR15: Ausrüsten und Raumlisten mit Item-Zeilen (Bild, Werte, Vergleich grün/rot oder Preis), Unpassendes gedimmt mit Grund; Händler mit Börse und Betrag auf der Haupttaste.
- UX-DR16: Item-Bilder als gemalte Bilder im Porträt-Stil (ChatGPT) mit Seltenheits-Raute und Zahl.
- UX-DR17: Titel mit einer Haupttaste „Fortsetzen“; Kampagnen-Plätze mit Modus-Marke, Stand, Spielzeit, Speicherplätzen; PoC-Zeile; Neue Kampagne auf einer Seite (Name, Aussehen + Pronomen, Schwierigkeit, Tod-Modus mit Erklärung).
- UX-DR18: Fortschrittsring für Akt-Pakete, „Wird noch geladen …“ an gesperrten Missionen, „Akt n erscheint bald“ im Nebel.
- UX-DR19: Ergebnis mit Sieg-Pille, Beute, Kopfgeld, Nebenzielen, EP je Figur, Gefallenen grau.
- UX-DR20: Abschied je Gefallenem: entsättigt mit Glutlinie, letzte Zeile, Trauer des Partners, ruhige Taste, 2 s nicht überspringbar.
- UX-DR21: Aufstieg mit Glutfunke-Vorrat, zwei Profi-Wegen und Preis auf der Haupttaste; Funken-Moment.
- UX-DR22: Epilog-Mosaik mit Kacheln (farbig/grau/sepia) und Regionskacheln, Kopf mit Ende und Haltung.
- UX-DR23: Steckbriefe-Liste und Chronik als Vollbild-Ansichten aus der Leiste.
- UX-DR24: Responsive: Tablet mit Seitenleiste 320 px, PC mit Panels links/rechts und Hover; Safe Areas; Tastenkürzel.
- UX-DR25: Bewegung und Haptik: Druckzustand der Steine, Bildschirmwackeln und Haptik abschaltbar, `prefers-reduced-motion`.
- UX-DR26 (neu 2026-10-30): Options-Block „Brett-Anzeige“ (Raster, Lebensleisten, Gegner-Leiste, Gefahrenzone standardmäßig); Raster als Eckpunkte, Bereiche als Einzelkacheln mit Außenkante, Weg als Pfeil.
- UX-DR27 (neu 2026-10-30): Lebensleisten über allen Figuren in Teamfarbe mit Teilstrichen, Leutnant-Goldkontur, kritischer Glutrand, Schadensvorschau in der Leiste; Kill-Marker voll/halb über Gegnern.
- UX-DR28 (neu 2026-10-30): Gefahrenzone mit Kante und drei Stufen (ohne Zahl, Playtest 2026-10-30); schlafende Gegner gestrichelt; Zielfeld-Check mit rötlich gefärbten Gegnern, Pille und Gelände-Chip (PC beim Hover); Warn-Totenkopf über gefährdeten eigenen Figuren.
- UX-DR29 (neu 2026-10-30): Gegnerphase-Rückblick, Gegner-Leiste (Option), Fertig-Häkchen, Doppeltipp zentriert, Zoomstufe „ganze Karte“ (PC M), Rechtsklick nimmt die Bewegung zurück (Zurück-Stein an der Geist-Figur entfällt, Playtest 2026-10-30).
- UX-DR30 (neu 2026-10-30): Handbuch aus Kampfmenü, Weltkarte und Titel mit Kategorien, Suche und Einträgen (Grafik, Werte aus den Daten, Querverweise), Klassen-Steckbriefe, Lektionen.
- UX-DR31 (neu 2026-10-30): Kontext-„?“ an Kampfvorschau, Gelände-Chip, Zuständen und Lektionen öffnet den passenden Handbuch-Eintrag über dem Kampf.

### FR Coverage Map

| FR | Epic | Kurz |
|---|---|---|
| FR1–FR3, FR6, FR9, FR10 | Epic 2 | bestehende Kampfregeln, im neuen HUD und Rollenmodell übernommen |
| FR8 | Epic 2 | Nebel des Krieges (neu im Kern) |
| FR4, FR5 | Epic 1 | Verbluten, Neustart je Tod-Modus |
| FR7 | Epic 4 | Ziele escort und treasure |
| FR11–FR13, FR16, FR17 | Epic 2 | Rollenmodell, Klassen-Aktionen, KI, Gegnertypen Akt 1 |
| FR14, FR15 | Epic 10 | Profi-Wege (Aufstieg erst ab Akt 2) |
| FR18–FR25 | Epic 3 | Leutnants |
| FR26–FR28 | Epic 4 | Akt-Struktur, Missionszustände, gestaffelte Regeln |
| FR29–FR32 | Epic 5 | Weltkarte, Tageswechsel, Heimsuchungen |
| FR33 | Epic 4 (Mechanik), Epic 9/11/12 (Inhalte) | Nebenquests |
| FR34–FR38, FR40 | Epic 4 | Szenen, Entscheidungen, Haltung, Chronik, Supports |
| FR39 | Epic 12 | Epilog-Mosaik |
| FR41 | Epic 6 | Rekrutierung, Taverne, Armee-Limit |
| FR42 | Epic 8 | Teilvertonung |
| FR43, FR45–FR49, FR50 (Akt 1) | Epic 6 | Stufen, Items, Tiers, Wirtschaft, Simulation, Lager, Burg auf Stufe 1 |
| FR44, FR50 (ab Akt 2)–FR54 | Epic 10 | Glutfunke-Aufstieg, Burg-Ausbau mit 11 Räumen |
| FR55 | Epic 9 | Eroberung (1-6) und Verteidigung (1-8) der Paktwacht |
| FR56, FR59 | Epic 1 | Kampagnen, Speicherplätze, PoC-Stände |
| FR57 | Epic 1 (Format), Epic 7 (Release-Ablauf), Epic 12 (Staffel-2-Übergabe) | Spielstand über Releases |
| FR58 | Epic 7 | Akt-Pakete, offline |
| FR60 | Epic 9 | Inhalte Akt 1 |
| FR61 | Epic 11 | Inhalte Akt 2 |
| FR62 | Epic 12 | Inhalte Akt 3 |
| FR63 | Epic 9/11/12 | DE und EN je Akt |

## Epic List

### Epic 1: Kampagnen und Spielstände
Spieler führen bis zu drei Kampagnen auf einem Gerät, sehen eine neue, spielzeughafte Oberfläche, speichern nach jeder Aktion sicher und starten Runde oder Mission nach den Regeln ihres Tod-Modus neu; Standard bekommt das Verbluten. Baut die UI-Grundlage (Stil B), Speicherformat 2, Kampagnen-Commands mit Journal und den Fehlerbericht.
**FRs covered:** FR4, FR5, FR56, FR57 (Format), FR59 · AR2, AR16–AR18, AR21, AR22 · UX-DR1–3, UX-DR17, UX-DR25

### Epic 2: Rollenklassen und neues Kampf-HUD
Spieler kämpfen mit Rollen statt Waffenklassen: Die Ausrüstung bestimmt Waffe und Element, jede Rolle hat eine eigene Klassen-Aktion auf festem Platz im neuen HUD; die Gegnerphase rechnet im Hintergrund und bleibt flüssig.
**FRs covered:** FR1–FR3, FR6, FR8–FR13, FR16, FR17 · AR8, AR14 · UX-DR4–6, UX-DR8, UX-DR24

### Epic 3: Leutnants
Spieler treffen auf benannte Leutnants, die bei 0 TP vorhersehbar fliehen, Groll gegen ihren Vertreiber tragen, mit der Truppe mitwachsen und Kopfgeld bringen.
**FRs covered:** FR18–FR25 · AR5 · UX-DR7, UX-DR23 (Steckbriefe)

### Epic 4: Akt-Struktur, Szenen und Entscheidungen
Spieler erleben einen Akt mit teils freier Missionsreihenfolge, Szenen mit Halbfiguren und Ersatzsprechern, Entscheidungen mit sichtbaren Folgen, eine Chronik und feste Support-Paare.
**FRs covered:** FR7, FR26–FR28, FR33 (Mechanik), FR34–FR38, FR40 · AR3, AR4, AR9, AR10, AR15 (Content-Layout) · UX-DR12, UX-DR13, UX-DR23 (Chronik)

### Epic 5: Weltkarte und Heimsuchungen
Spieler wählen ihre nächste Mission auf einer Weltkarte, die nach jeder Mission der Startpunkt ist, und finden jeden Tag neue Heimsuchungen von Leutnants auf bekannten Karten.
**FRs covered:** FR29–FR32 · AR6, AR7, AR12, AR13 · UX-DR9, UX-DR18 (Teil)

### Epic 6: Truppe, Fortschritt und Lager
Spieler verwalten ihre Truppe, rüsten aus, handeln und versorgen im Lager und ab 1-6 in der Paktwacht, sehen ein klares Ergebnis nach jeder Mission und nehmen Abschied von Gefallenen; die Kurven tragen über Akt 1 hinweg.
**FRs covered:** FR41, FR43, FR45–FR49, FR50 (Akt 1) · AR11 · UX-DR10 (Lager, Burg Stufe 1), UX-DR11 (Gedenksteine), UX-DR14, UX-DR15, UX-DR19, UX-DR20

### Epic 7: Akt-Pakete und Offline
Spieler laden das Spiel schnell, bekommen den Rest eines Akts im Hintergrund und spielen danach offline; neue Akte kommen per Update, ohne dass Spielstände brechen.
**FRs covered:** FR57 (Release-Ablauf), FR58 · AR15, AR19, AR23 · NFR1, NFR2, NFR8 · UX-DR18

#### Story 7.8: Große Schlachten ohne Ruckler

Als Spieler
möchte ich, dass die größte Schlacht auch auf einem schwächeren Handy ohne Hänger läuft,
damit die Gegnerphase gleichmäßig flüssig bleibt.

**Akzeptanzkriterien:**

**Angenommen** die Messung aus 7.5/7.7 (`PERF_GPU=1 pnpm perf`, Referenzschlacht 24×32, Vorher-Werte in `tests/perf/baseline.json`)
**Wenn** die Gegnerphase mit 2× und 4× gedrosselter CPU läuft
**Dann** erreicht sie 60 FPS bei 2× und 30 FPS bei 4× auf beiden Geräteprofilen (NFR1, Zielmaß aus 7.7)
**Und** der Bericht zeigt Vorher (Stand nach 7.7) und Nachher.

**Angenommen** eine Figur kommt während einer Kamerafahrt neu ins Bild, oder der Speicher wird aufgeräumt (GC)
**Wenn** das in der Gegnerphase passiert
**Dann** entstehen keine einzelnen Frames über 100 ms mehr (heute 300–470 ms bei 2×)
**Und** die Ursachen (erstes Zeichnen eingeschalteter Figuren, Speicherbereinigung) sind im Story-Log benannt.

**Angenommen** die Figuren-Pipeline (`tools/art`, Tripo-Rigs nach Art Direction §4.6)
**Wenn** Figuren für das Brett gebaut werden
**Dann** haben ihre Rigs nur so viele Gelenke, wie die Animationen brauchen, und Idle, Gehen, Angriff und Treffer laufen als gebackene Vertex-Animation-Texturen statt als Skelett im Hauptthread
**Und** die Optik bleibt gleich (Screenshots vorher/nachher, Abnahme Produktinhaber).

_Nachgetragen 2026-10-25: Entscheidung Produktinhaber bei der Abnahme von 7.7 (erreicht: 58,8 FPS bei 2×, 28,9–34,8 FPS bei 4×). Grenzt an Epic 8 (Figuren-Pipeline): abstimmen mit dem Grafik-Strang._

## Epic 8: Chibi-Stil, Item-Bilder und Audio
Spieler sehen die Welt im Round-Chibi-Stil der Art Direction: Tripo-Figuren, Porträts mit Stimmungen, gemalte Item-Bilder, warmes Licht und Effekte, folk-lastige Musik und vertonte Schlüsselzeilen.
**FRs covered:** FR42, FR63 (Teil) · UX-DR16

#### Story 8.10: Verdeckte Figuren bleiben sichtbar

Als Spieler
möchte ich jede Figur sehen, auch wenn sie hinter oder in einem Haus, Turm, einer Ruine oder einem Baum steht,
damit ich keine Einheit übersehe.

**Akzeptanzkriterien:**

**Angenommen** die Kamera des Bretts (Neigung `camera.tiltDeg`, Blick von Süden) und eine Requisite, die eine Figur auf demselben Feld oder auf Feldern nördlich davon um mindestens `board.fade.cover` Felder ihrer Höhe verdeckt
**Wenn** eine Einheit (Spieler oder Gegner) dort steht, hinzieht oder beim Aufstellen dort landet
**Dann** wird die Requisite halbdurchsichtig („schleierhaft“, Deckkraft `board.fade.alpha` in `render.yaml`), die Figur bleibt erkennbar
**Und** verlässt die Einheit das Feld, ist die Requisite sofort wieder deckend; neu berechnet wird nur, wenn sich ein Feld einer Einheit ändert, nie jedes Bild.

#### Story 8.11: Abwechslungsreiche Karten und Besuchshäuser

Als Spieler
möchte ich Karten mit unterschiedlichen Häusern, Bäumen und Felsen sehen und sofort erkennen, welche Häuser ich besuchen soll,
damit die Brettwelt lebendig wirkt und ich keine Ziele suchen muss.

**Akzeptanzkriterien:**

**Angenommen** die Requisiten-Bibliothek (Häuser, Bäume je Jahreszeit, Felsen, Brunnen, Zauntor) mit mehreren Varianten je Klasse
**Wenn** eine Karte aufgebaut wird
**Dann** wählt sie die Variante je Feld deterministisch (Feld-Hash plus Seed, optional `propVariants` im Karten-YAML), nie mit `Math.random`; gleiche Nachbarn werden vermieden
**Und** Besuchsziele sind ein eigenes, deutlich erkennbares Haus („lodge“: blaugrünes Dach, Schild, Banner, Laterne; besucht: Tür offen, Banner eingeholt), das sich von Kulissenhäusern abhebt
**Und** das Ziel heißt überall „Häuser besuchen“ (DE/EN: Zieltext, Kontext-Band, Toast, KI-Text); echte Dörfer als Handlungsorte bleiben „Dorf“
**Und** ein Tipp auf das Nebenziel in der Zielanzeige markiert die offenen Ziel-Orte auf dem Brett (Besuch, Truhen, Anwerben, Schutz, Boss), ein zweiter Tipp oder `board.markMs` löscht sie
**Und** die neuen Modelle liegen im Paket `act1`, nicht im ersten Download; die Bildrate bleibt über den Zielen aus Story 7.8.

## Epic 9: Akt 1 „Asche“ (MVP)
Spieler spielen Prolog und Akt 1 komplett: 9 Story-Missionen (Prolog + 8), 3 Nebenquests, 4 Leutnants, 4 Entscheidungen, Akt-1-Supports, Eroberung und Verteidigung der Paktwacht. Eine Story je Mission; endet mit dem MVP-Release und Playtest.
**FRs covered:** FR55, FR60, FR63

### Epic 10: Die Burg ausbauen (ab Akt 2)
Spieler bauen die eroberte Paktwacht auf 11 Räume in drei Stufen aus, steigen per Glutfunke auf Profi-Wege auf und ehren Gefallene in der Gedächtnishalle. Verfeinert am 2026-10-31 und nach der Readiness-Prüfung neu geschnitten: 14 Stories (10.1 Räume, 10.2 Akademie, 10.3/10.4 Profi-Klassen und ihre Wirkungen, 10.5 Fallensteller und Schatten, 10.6 Verzauberer und Werkstatt, 10.7 Lektionen, 10.8 Übungsplatz und Lagerfeuer, 10.9–10.11 Raumfunktionen der Stufen 2 und 3 je Raumgruppe, 10.12 Söldner-Traits, 10.13 Anhängeteile, 10.14 Burg-Grafik nach der 3D-Entscheidung).
**FRs covered:** FR14, FR15, FR44, FR50 (ab Akt 2)–FR54 · UX-DR10 (Burg-Ausbau), UX-DR11 (Lektionen), UX-DR21

### Epic 11: Akt 2 „Glut“
Spieler spielen Akt 2 mit 8 Story-Missionen inklusive der großen Schlacht Kronfeld, 3 Nebenquests, 4 Leutnants und 4 Entscheidungen in der Eisenmark. Verfeinert am 2026-10-31 und nach der Readiness-Prüfung neu geschnitten: 22 Stories (11.1–11.4 Akt-Übergang, Positionsstufe, Paket und Simulation; 11.5 Gefährten und Leutnants; 11.6 Balliste; 11.7 Flieger, Gegner und Herbst; 11.8 Ziel-Phasen; 11.9 Relikt-Stufen; 11.10–11.17 je eine Mission mit Kurzspezifikation; 11.18–11.20 Nebenquests; 11.21 Supports und Chronik-Szene; 11.22 Abstimmung).
**FRs covered:** FR17 (Akt 2), FR61, FR63

### Epic 12: Akt 3 „Krone“ und Staffelende – grob
Spieler spielen Akt 3 bis zum Staffelfinale, sehen das Epilog-Mosaik und nehmen ihre Entscheidungen als Staffel-Zusammenfassung mit in Staffel 2.
**FRs covered:** FR17 (Akt 3), FR39, FR57 (Staffel 2), FR62, FR63 · AR20 · UX-DR22

### Epic 13: Kampf lesbar machen
Spieler lesen das Brett auf einen Blick: Raster, Lebensleisten, Bereiche mit Kanten, eine abgestufte Gefahrenzone, Zielfeld-Check und Kill-Marker vor dem Zug, ein Rückblick nach der Gegnerphase. Neu seit der Course Correction 2026-10-30, vor dem MVP-Release.
**FRs covered:** – (Darstellung bestehender Regeln FR1, FR2, FR6, FR9) · UX-DR26–UX-DR29

### Epic 14: Handbuch
Spieler schlagen jede Regel im Spiel nach, aus dem Menü oder über ein „?“ an der Stelle, an der sie wirkt; Werte kommen aus den Content-Daten. Neu seit der Course Correction 2026-10-30, nach dem MVP-Release und vor Akt 2.
**FRs covered:** – · UX-DR30, UX-DR31

**Reihenfolge:** 1 → 2 → 4 → 3 → 5 → 6 → 7 → 8 → 9 bis 9.13 → 13 → 9.14 (MVP-Release) → 14, danach 10 → 11 → 12 (Course Correction 2026-10-30: Epic 13 vor dem MVP-Release, Epic 14 direkt danach und vor Akt 2). Epic 4 läuft vor Epic 3 (oder beide zusammen), weil Groll-Wirkung, Bedingungen und Szenen der Leutnants aus Epic 4 kommen. Gebaut wird Epic für Epic auf die Endfassung hin; ein Epic darf intern unfertig sein, solange das nächste darauf aufbaut. Epic 8 kann ab Epic 2 parallel laufen (Asset-Arbeit), seine Einbindung setzt die jeweiligen Szenen voraus. Die Burg ist ab 1-6 Heimat (Story 6.9); ihr Ausbau (Epic 10) ist spätestens mit Akt 2 fertig. Epic 10 und 11 laufen verschränkt (Verfeinerung und Readiness-Fixes 2026-10-31): 11.1 (Akt-Übergang) zuerst, dann 10.2, 10.3 und 10.4 parallel zu 11.2–11.7, danach die übrigen Stories von Epic 10 und die Missionen ab 11.10; 11.8 (Ziel-Phasen) vor 11.17 (Kronfeld); 11.22 (Abstimmung Akt 2) zuletzt, nach allen Epic-10-Stories bis 10.12. Details in den Absätzen „Reihenfolge“ beider Epics.

<!-- Stories: Format „Als … möchte ich …, damit …“; Akzeptanzkriterien in deutscher Gherkin-Form (Angenommen / Wenn / Dann / Und). -->

## Epic 1: Kampagnen und Spielstände

Spieler führen bis zu drei Kampagnen, sehen die neue Oberfläche (Stil B) zuerst auf Titel und Kampagnen, speichern nach jeder Aktion sicher und starten nach den Regeln ihres Tod-Modus neu. Grundlage für alle weiteren Epics: UI-Bausteine, Speicherformat 2, Kampagnen-Commands mit Journal, Fehlerbericht.

### Story 1.1: Neue Oberfläche – Steine, Tokens und Währung

Als Spieler
möchte ich eine Oberfläche, die aussieht wie Spielzeug aus derselben Kiste wie die Welt,
damit sich Menüs nicht wie eine Website über dem Spiel anfühlen.

**Akzeptanzkriterien:**

**Angenommen** die Tokens aus `concept/25-ux/DESIGN.md` (Farben, Typografie, Rundungen, Abstände)
**Wenn** die App startet
**Dann** stehen sie als CSS-Variablen in `src/ui/` bereit und Fraunces ist als Namensschrift eingebunden (einzige neue Abhängigkeit: Schriftpaket); die PoC-Schriften (Cinzel, Grenze Gotisch, Nunito Sans, Silkscreen) entfallen, es bleiben Barlow, Barlow Condensed und Fraunces
**Und** es gibt wiederverwendbare Preact-Komponenten `Piece`, `PrimaryButton`, `SecondaryButton`, `QuietButton` mit Druckzustand (Unterkante 4 → 1 px).

**Angenommen** ein Betrag an Gold, Material, EP oder Glutfunken
**Wenn** die UI ihn anzeigt
**Dann** rendert die Komponente `Amount` immer Symbol + Zahl (Münze, Stern; Materialien und Glutfunke mit ihrem gemalten Item-Bild) mit tabellarischen Ziffern
**Und** ein Material ohne Bild in `art/items/` lässt `pnpm content:check` scheitern.

**Angenommen** der Titelbildschirm
**Wenn** er neu gebaut ist
**Dann** entspricht er `concept/25-ux/mockups/07-start-kampagnen.html` (eine Haupttaste „Fortsetzen“ mit Avatar, Akt und Stand; „Kampagnen“; „Optionen“; Versionszeile mit Update-Prüfung)
**Und** `pnpm build` bleibt im Bundle-Budget; `prefers-reduced-motion` schaltet den Druck-Effekt nicht ab, aber jedes Wackeln.

### Story 1.2: Speicherformat 2 mit Kampagnen

Als Spieler
möchte ich bis zu drei Kampagnen nebeneinander haben,
damit ich zum Beispiel eine Klassik-Kampagne neben meinem Standard-Spiel führen kann.

**Akzeptanzkriterien:**

**Angenommen** IndexedDB `hollow-crown` in Version 1
**Wenn** die neue App-Version startet
**Dann** legt sie Version 2 mit den Stores `campaigns`, `saves` (Schlüssel `[campaignId, slot]`), `journal` und `legacy` an (Architektur §5.15)
**Und** vorhandene Format-1-Spielstände wandern unverändert nach `legacy`.

**Angenommen** eine laufende Kampagne
**Wenn** ein Command (Kampf oder Kampagne) angewendet wird
**Dann** schreibt die App den Auto-Save asynchron, ohne die Eingabe zu blockieren, und beim Wechsel in den Hintergrund sofort
**Und** `SaveRecord` trägt `format: 2`, `campaignId`, `contentVersion` und `appVersion`.

**Angenommen** drei Kampagnen existieren
**Wenn** der Spieler eine vierte anlegen will
**Dann** verlangt die App zuerst das Löschen einer Kampagne (mit Rückfrage)
**Und** Fixture-Spielstände in `tests/fixtures/saves/` decken Format 1 (Legacy) und Format 2 ab.

### Story 1.3: Kampagnen-Ansicht und Neue Kampagne

Als Spieler
möchte ich meine Kampagnen sehen und eine neue auf einer Seite anlegen,
damit ich in Sekunden weiß, wo ich stehe, und schnell ins Spiel komme.

**Akzeptanzkriterien:**

**Angenommen** gespeicherte Kampagnen
**Wenn** der Spieler „Kampagnen“ öffnet
**Dann** zeigt jede Zeile Avatar, Name, Modus-Marke (Klassik dunkel), Akt und Stand, Spielzeit und Zeit des Auto-Saves (Mockup 07)
**Und** ein Tipp lädt den Auto-Save, ein Langdruck bietet Löschen mit Rückfrage.

**Angenommen** ein freier Platz
**Wenn** der Spieler „Neue Kampagne“ wählt
**Dann** legt er auf einer Seite Name, Aussehen (zwei Avatar-Vorlagen) mit Pronomen, Schwierigkeit und Tod-Modus mit je einem Satz Erklärung fest; Standard ist vorgewählt
**Und** „Aufbrechen“ startet den Prolog.

**Angenommen** ein Proof-of-Concept-Spielstand in `legacy`
**Wenn** die Kampagnen-Ansicht erscheint
**Dann** steht er als graue Zeile „Spielstand aus dem Proof of Concept · nicht mehr kompatibel“ mit „Exportieren“
**Und** er lässt sich nicht laden.

**Angenommen** eine Kampagne in einem beliebigen Tod-Modus
**Wenn** der Spieler in der Kampagnen-Ansicht exportiert oder importiert
**Dann** exportiert jede Zeile ihre Kampagne als Datei, und „Importieren“ liest eine Datei ein, die die Kampagne gleicher ID überschreibt oder einen freien Platz belegt (FR56)
**Und** sind drei Plätze belegt und die ID ist neu, verlangt der Import zuerst das Löschen einer Kampagne; für Klassik gelten zusätzlich die Regeln aus Story 1.5.

### Story 1.4: Kampagnen-Commands und Journal

Als Spieler
möchte ich, dass alles zwischen den Missionen genauso zuverlässig gespeichert und nachvollziehbar ist wie der Kampf,
damit kein Kauf, keine Entscheidung und kein Fortschritt verloren geht.

**Akzeptanzkriterien:**

**Angenommen** die heutigen Funktionen in `src/core/campaign/camp.ts` (kaufen, verkaufen, ausrüsten, aufwerten, Runen, Narben, Supports, Loadout)
**Wenn** die Story umgesetzt ist
**Dann** laufen sie als `CampaignCommand` über `validateCampaign` und `applyCampaign` mit strukturierten Fehlercodes und `CampaignEvent`s (Architektur §5.2)
**Und** Kosten- und Vorschaufunktionen bleiben exportiert und werden von UI und Handler gemeinsam genutzt.

**Angenommen** eine Kampagne
**Wenn** ein Kampagnen-Command angewendet wird
**Dann** hängt die App es mit laufender Nummer an den Store `journal`; `finishMission` enthält das Kampf-Log
**Und** ein Test zeigt: Startzustand + Journal ergibt exakt denselben `CampaignState`.

**Angenommen** ein App-Update mit neuer `contentVersion`
**Wenn** eine Kampagne geladen wird
**Dann** schreibt die App einen Checkpoint (voller Zustand) ins Journal, ab dem Replays beginnen
**Und** die Coverage von `src/core` sinkt nicht.

### Story 1.5: Speicherplätze und Neustart je Tod-Modus

Als Spieler
möchte ich je nach Tod-Modus Runde oder Mission neu starten und in Standard/Casual eigene Speicherplätze nutzen,
damit Klassik streng bleibt und die anderen Modi Fehler verzeihen.

**Akzeptanzkriterien:**

**Angenommen** eine Kampagne in Standard oder Casual
**Wenn** der Spieler außerhalb des Kampfs im Menü speichert
**Dann** stehen 3 Speicherplätze zur Wahl, die in der Kampagnen-Zeile mit Stand erscheinen und einzeln ladbar sind
**Und** in Klassik gibt es diese Funktion nicht; die Zeile sagt „nur Auto-Save“.

**Angenommen** ein laufender Kampf
**Wenn** der Spieler „Runde neu“ oder „Mission neu“ wählt
**Dann** laufen die Kampagnen-Commands `restartTurn` (Replay bis `turnStartIndex`) bzw. `restartMission` (Replay ab Start), die auch Tode zurücksetzen
**Und** `validateCampaign` lehnt in Klassik `restartTurn` immer und `restartMission` außer nach einer Niederlage ab.

**Angenommen** Klassik
**Wenn** der Spieler exportiert oder importiert (Export/Import aller Modi: Story 1.3)
**Dann** ist Export jederzeit außerhalb des Kampfs möglich und Import nur aus der Kampagnen-Ansicht; er überschreibt die Kampagne gleicher ID (Ehrensystem, AR18)
**Und** ein Import prüft Größe (≤ 5 MB), Prüfsumme und Schema und nennt Fehler in einem Satz.

### Story 1.6: Verbluten im Modus Standard

Als Spieler im Modus Standard
möchte ich sehen, wie lange eine niedergestreckte Figur noch hat,
damit Bergen dringlich und lesbar wird.

**Akzeptanzkriterien:**

**Angenommen** eine Figur fällt in Standard auf 0 TP
**Wenn** sie niedergestreckt ist
**Dann** zählt `BattleUnit.bleed` ihre eigenen Phasen; nach `balance.death.bleedOutTurns` (3) stirbt sie, jeder weitere Treffer tötet sofort
**Und** ein Event meldet den Zähler, damit Brett und UI ihn zeigen.

**Angenommen** eine Figur mit 2 Narben
**Wenn** sie erneut auf 0 TP fällt
**Dann** stirbt sie sofort
**Und** Avatar oder Kael bei 0 TP bleiben eine Niederlage.

**Angenommen** eine niedergestreckte Figur
**Wenn** der Spieler sie auf dem Brett sieht
**Dann** ist sie grau mit Puls-Symbol und Verblutungs-Zähler (DESIGN.md, Farbe `downed`)
**Und** Tests decken Zähler, Tod, Bergen mit Narbe und die Zwei-Narben-Regel ab.

### Story 1.7: Fehlerbericht und Speicherschutz

Als Spieler
möchte ich nach einem Fehler weiterspielen und meinen Spielstand vor dem Browser schützen,
damit eine lange Kampagne nicht an einem Absturz oder an gelöschten Websitedaten scheitert.

**Akzeptanzkriterien:**

**Angenommen** eine Kern-Invariante wird verletzt (`CoreInvariantError`)
**Wenn** die App den Fehler fängt
**Dann** zeigt sie „Etwas ist schiefgelaufen“, bietet „Fehlerbericht exportieren“ (Versionen, Gerät, Checkpoint, Journal, laufender Kampf, letzte 500 Log-Zeilen) und lädt den letzten Auto-Save
**Und** `src/app/log.ts` hält einen Ringpuffer mit Stufen; `debug` nur im Dev-Build oder mit `?debug`.

**Angenommen** das erste Speichern einer Kampagne
**Wenn** die App nicht als Home-Bildschirm-App läuft
**Dann** ruft sie `navigator.storage.persist()` auf und zeigt einmal den Hinweis „Zum Home-Bildschirm hinzufügen, damit dein Spielstand sicher bleibt“
**Und** schlägt ein Speichern fehl, erscheint ein Banner mit Export-Angebot; der nächste Commit versucht es erneut.

### Story 1.8: Optionen, Ende und Hinweise im Stil B

Als Spieler
möchte ich, dass auch Einstellungen, Hinweise und das Ende des bisherigen Inhalts wie der Rest des Spiels aussehen,
damit nirgends noch der alte Prototyp durchscheint.

**Akzeptanzkriterien:**

**Angenommen** die Optionen (Sprache, Tempo, Gegnertempo, Gefahr, Qualität, Figuren, Wackeln, Musik, Effekte, Bildschirm wach)
**Wenn** der Spieler sie vom Titel, aus dem Kampfmenü oder aus der Heimat öffnet
**Dann** erscheinen sie als Steine mit Segment-Schaltern und Reglern im Stil B (`ScreenHead`, Tokens aus DESIGN.md), über der weichgezeichneten Szene
**Und** jede Änderung wirkt sofort und bleibt gespeichert.

**Angenommen** der Endbildschirm nach der letzten verfügbaren Mission sowie die kurzen Hinweise (Toast) und Banner
**Wenn** sie erscheinen
**Dann** nutzen sie Steine, Pillen und Schriften aus Stil B; Titel-Rahmen und Update-Hinweis der Versionszeile ebenso
**Und** danach sind die PoC-Klassen dieser Ansichten aus `styles.css` entfernt.

_Nachgetragen 2026-10-24: Lücke aus der Bestandsaufnahme der PoC-Ansichten, von keiner Story abgedeckt._

### Story 1.9: Mission verlassen und zur Weltkarte

Als Spieler
möchte ich eine laufende Mission verlassen und zur Weltkarte zurückkehren,
damit ich Truppe, Aufstellung und Ausrüstung ändern und die Mission neu beginnen kann, ohne den Kampf zu Ende zu spielen.

**Akzeptanzkriterien:**

**Angenommen** ein Kampf läuft im Modus Standard oder Casual
**Wenn** der Spieler im Kampfmenü „Mission verlassen“ wählt und die Rückfrage bestätigt
**Dann** wird der Kampf verworfen und die Weltkarte erscheint, jederzeit, auch mitten im Kampf
**Und** die Kampagne ist unverändert wie vor dem Missionsstart (Beute, EP, Verbrauchsgüter und Verluste zählen erst mit `finishMission`)
**Und** der Kampf-Auto-Save ist ersetzt, der abgebrochene Kampf lässt sich nicht fortsetzen.

**Angenommen** ein Kampf läuft im Modus Klassik
**Wenn** noch keine Aktion gegeben wurde (das Befehls-Log des Kampfs ist leer)
**Dann** bietet das Kampfmenü „Mission verlassen“ an
**Aber** sobald die erste Aktion gegeben ist, fehlt der Eintrag und `validateCampaign` lehnt `abandonMission` mit `abandon_forbidden` ab.

**Angenommen** der Spieler öffnet die Rückfrage
**Wenn** er „Abbrechen“ wählt
**Dann** läuft der Kampf unverändert weiter
**Und** der Text sagt klar: Der Kampf wird abgebrochen, der Fortschritt dieses Kampfs geht verloren, die Kampagne bleibt unverändert.

_Nachgetragen 2026-10-27, Wunsch des Produktinhabers. Der Weg über die Aufstellung hat bereits einen Zurück-Button; der Niederlage-Bildschirm bleibt unverändert._

## Epic 2: Rollenklassen und neues Kampf-HUD

Spieler kämpfen mit Rollen statt Waffenklassen; jede Rolle hat eine Klassen-Aktion auf festem Platz im neuen HUD (Stil B). Die Gegnerphase rechnet im Web Worker.

### Story 2.1: Kampf-HUD in Stil B

Als Spieler
möchte ich im Kampf eine klare, einhändige Oberfläche im neuen Stil,
damit ich Ziel, Einheit und Aktionen auf einen Blick erfasse.

**Akzeptanzkriterien:**

**Angenommen** die bestehenden Kampfregeln (FR1–FR3, FR6, FR9, FR10)
**Wenn** der Kampfbildschirm neu gebaut ist
**Dann** zeigt er oben die Rundenpille mit Hauptziel und darunter Nebenziel-Pillen, unten die Einheitenkarte (Medaillon mit TP-Ring, Name, Rolle, TP, Waffen-Chip) und das Dock mit vier festen Plätzen: Angriff, Klassen-Aktion, Item, Warten (Mockup 02)
**Und** nicht mögliche Aktionen sind gedimmt, nie versteckt; bei passiven Rollen (Vorkämpfer: Halten, Plänkler: Nachsetzen) zeigt der Platz „Klassen-Aktion“ das Rollen-Symbol als Zustand (bereit/aktiv), ist nicht auslösbar, und Tippen erklärt die Regel mit Vorschau.

**Angenommen** keine Einheit ist gewählt
**Wenn** die Spielerphase läuft
**Dann** zeigt das Dock Gefahr (Umschalter), Nächste und Phase beenden mit der Zahl bereiter Einheiten; Phase beenden fragt nach, solange Einheiten bereit sind.

**Angenommen** die Gegnerphase
**Wenn** sie beginnt
**Dann** verschwinden Dock und Einheitenkarte, oben erscheint die rote Phasen-Pille, unten rechts Tempo 1×/2×/Überspringen
**Und** die Kampfvorschau erscheint im Stil B mit Dreieck/Element und Tandem als Chips und nutzt denselben Formelcode wie die Auflösung.

**Angenommen** Tablet- oder PC-Breite
**Wenn** das HUD gerendert wird
**Dann** gelten die Breakpoints aus EXPERIENCE.md (Seitenleiste 320 px ab 600 px, Panels ab 1024 px) und die Tastenkürzel Esc, Leertaste, E, D.

### Story 2.2: Rollenmodell und Waffengruppen

Als Spieler
möchte ich, dass die Rolle bestimmt, wie sich eine Figur verhält, und die Ausrüstung, womit sie kämpft,
damit Ausrüstung der Charakter ist.

**Akzeptanzkriterien:**

**Angenommen** `classes.yaml` im Rollenschema (`role`, `tier`, `moveType`, `mov`, `weaponGroups`, `classAction`, `proPaths`, Wachstum, Basiswerte, Caps)
**Wenn** der Content geladen wird
**Dann** gibt es die 7 Kernrollen sowie Taktiker und Hauptmann mit Werten aus den PoC-Klassen abgeleitet (GDD-Annahme 3)
**Und** jedes Item hat eine Waffengruppe `group`; `canEquip` erlaubt nur Gruppen der Rolle.

**Angenommen** die PoC-Figuren und -Karten
**Wenn** sie umgemappt sind (Söldner/Held → Plänkler, Soldat/Ritter → Vorkämpfer, Schütze → Schütze, Magier → Elementarist, Kleriker → Heiler)
**Dann** laufen Prolog und die bestehenden Karten weiter und `pnpm sim` liegt in den Korridoren aus NFR12 oder die Abweichung ist im Log der Story begründet
**Und** das Ausrüsten zeigt unpassende Items gedimmt mit Grund.

### Story 2.3: Klassen-Aktionen Zielen, Fernbergen und Anfeuern

Als Spieler
möchte ich die Klassen-Aktionen von Schütze, Heiler und Spielmann einsetzen,
damit jede Rolle eine eigene Antwort auf die Lage hat.

**Akzeptanzkriterien:**

**Angenommen** ein Schütze, der sich nicht bewegt hat
**Wenn** der Spieler „Zielen“ wählt
**Dann** greift er mit +1 Reichweite und +15 Treffer an; die Vorschau zeigt beides.

**Angenommen** ein Heiler und eine niedergestreckte Figur in bis zu 2 Feldern
**Wenn** der Spieler „Fernbergen“ wählt
**Dann** wird die Figur geborgen wie beim normalen Bergen.

**Angenommen** ein Spielmann neben einem Verbündeten
**Wenn** der Spieler „Anfeuern“ wählt
**Dann** erhält der Verbündete bis Zugende +1 MOV und +10 Treffer
**Und** jede Klassen-Aktion ersetzt die Aktion des Zugs, hat eine Vorschau, sitzt auf dem festen Dock-Platz mit Rollen-Icon und ist in `src/core` getestet.

### Story 2.4: Halten und Nachsetzen

Als Spieler
möchte ich mit Vorkämpfern Engstellen halten und mit Plänklern nach dem Angriff weiterziehen,
damit Positionierung zählt.

**Akzeptanzkriterien:**

**Angenommen** ein Vorkämpfer
**Wenn** ein Gegner ein Nachbarfeld betritt
**Dann** endet dessen Bewegung dort; die Bewegungsbereiche von Spieler und KI berücksichtigen das
**Und** die KI-Pfadsuche umgeht Haltezonen, wenn der Umweg höchstens 2 Felder länger ist, sonst läuft sie hinein.

**Angenommen** ein Plänkler hat angegriffen und noch Restbewegung
**Wenn** der Spieler ein erreichbares Feld wählt
**Dann** zieht er per Command `pursue` dorthin; jedes andere Command beendet die Möglichkeit
**Und** Replays mit `pursue` liefern identische Ergebnisse.

### Story 2.5: Wirken der Elementaristen

Als Spieler
möchte ich mit Elementaristen das Gelände formen,
damit Magie mehr ist als Schaden.

**Akzeptanzkriterien:**

**Angenommen** ein Elementarist mit Zauberwaffe eines Elements
**Wenn** der Spieler „Wirken“ auf ein Feld in Reichweite wählt
**Dann** entsteht für 2 Runden: Feuer → Brand, Wasser → löscht und macht Nass, Erde → Felswall, Wind → lichtet Nebel im Radius 2
**Und** die Vorschau zeigt die betroffenen Felder; Brandausbreitung bleibt reproduzierbar.

**Angenommen** ein gegnerischer Elementarist
**Wenn** mindestens 2 Spieler-Einheiten im Brand-Ausbreitungsbereich stehen oder ein Felswall einen Spieler-Pfad zum Ziel sperrt
**Dann** nutzt die KI Wirken statt anzugreifen.

### Story 2.6: Nebel des Krieges, Öffnen und Stehlen

Als Spieler
möchte ich auf Nebelkarten nur sehen, was meine Truppe sieht, und mit Spähern Türen, Truhen und Taschen öffnen,
damit Späher eine eigene Aufgabe haben.

**Akzeptanzkriterien:**

**Angenommen** eine Karte mit `fog: true`
**Wenn** der Kampf läuft
**Dann** berechnet `visibleTiles(state, team)` im Kern die Sicht (Basis 3, Schütze/Späher +2, Flieger +1; Mauern und geschlossene Türen blockieren)
**Und** Brett und UI zeigen nur Sichtbares; Events auf unsichtbaren Feldern werden vor dem Abspielen gefiltert, die Vorschau verrät nichts Verborgenes.

**Angenommen** ein Späher neben einer Tür, Truhe oder einem Gegner mit nicht ausgerüstetem Item
**Wenn** der Spieler „Öffnen“ bzw. „Stehlen“ wählt
**Dann** öffnet er ohne Schlüssel bzw. nimmt das Item in den Beutel (oder Konvoi, wenn voll)
**Und** auf Nebelkarten hat der Späher +2 Sicht.

### Story 2.7: Kontext-Band für Bergen, Ansprechen, Besuchen und Öffnen

Als Spieler
möchte ich situative Aktionen genau dann angeboten bekommen, wenn sie möglich sind,
damit das Dock fest bleibt und ich nichts übersehe.

**Akzeptanzkriterien:**

**Angenommen** eine gewählte Einheit auf einem Feld, von dem aus Bergen, Ansprechen, Besuchen oder Öffnen möglich ist
**Wenn** die Bewegung gesetzt ist
**Dann** erscheint das grüne Kontext-Band über der Einheitenkarte mit Mini-Porträt bzw. Objekt, Aktion und Grund (z. B. „Verblutet nach 2 eigenen Phasen“) und einer Taste
**Und** ein Tipp führt die Aktion aus; das Dock bleibt unverändert (Mockup 02, „Kontext-Aktion: Bergen“).

**Angenommen** mehrere Kontext-Aktionen sind möglich
**Wenn** das Band erscheint
**Dann** steht die dringlichste vorn (Bergen vor Ansprechen vor Besuchen vor Öffnen) und die anderen sind per Wischen erreichbar.

### Story 2.8: Gegnerphase im Web Worker

Als Spieler
möchte ich, dass das Spiel in der Gegnerphase großer Schlachten flüssig bleibt,
damit es sich auf dem Handy nie hakelig anfühlt.

**Akzeptanzkriterien:**

**Angenommen** `src/worker/core.worker.ts`
**Wenn** der Spieler die Phase beendet
**Dann** rechnet der Worker `applyCommand(state, endPhase)` mit denselben Content-Daten und gibt `{ state, events }` zurück (Protokoll Architektur §5.13); fehlt `Worker`, läuft dieselbe Funktion synchron
**Und** ein Test zeigt: Replay mit und ohne Worker ergibt denselben Zustand.

**Angenommen** CI
**Wenn** `pnpm bench:ai` läuft
**Dann** misst es die Gegnerphase der größten vorhandenen Karte und scheitert über 300 ms je Gegnereinheit
**Und** ESLint-Schichtregeln kennen `src/worker` (nur `core` und `content`).

### Story 2.9: Gegnertypen von Akt 1

Als Spieler
möchte ich in Akt 1 unterscheidbare Gegner (Banditen, Wolfsreiter zu Fuß, Söldner) erleben,
damit Kämpfe abwechslungsreich bleiben.

**Akzeptanzkriterien:**

**Angenommen** die Gegnerklassen von Akt 1 im Rollenschema
**Wenn** sie auf Karten stehen
**Dann** sind Wolfsreiter in Akt 1 Fußtruppen mit Wolfsfell (kein Reittier, keine Beritten-Effektivität; Vierbeiner und Reittiere erst nach dem MVP); Banditen, Wolfsreiter und Söldner unterscheiden sich in Waffen und KI-Profil
**Und** ihre Werte stehen in Content-YAML und sind per `pnpm sim` geprüft.

### Story 2.10: Kampf-Overlays im Stil B

Als Spieler
möchte ich alle Fenster im Kampf im selben Stil wie das HUD sehen,
damit Infos zu Gegnern und eigenen Figuren, Tausch und Konvoi sofort lesbar sind.

**Akzeptanzkriterien:**

**Angenommen** ein Gegner oder eine eigene Einheit auf dem Brett
**Wenn** der Spieler sie antippt bzw. die Einheitenkarte öffnet
**Dann** zeigt die Einheiten-Info im Stil B Medaillon mit TP-Ring, Name, Klasse/Rolle, Stufe, Werte, Ausrüstung mit Item-Bildern, Fähigkeiten und bei Gegnern das KI-Verhalten; eigene Einheiten bieten Ausrüsten, solange sie handeln können (Steckbriefe der Leutnants bleiben Story 3.6, die volle Figur Story 6.1)
**Und** sie erscheint als Stein über einem Schleier und schließt mit Esc oder Tipp daneben.

**Angenommen** Ziele-Panel, Kampfmenü (Optionen, Runde neu, Mission neu, zum Titel), Auswahl der Klassen-Aktion, Item-Liste, Tausch, Konvoi und der Stufenaufstieg im Kampf
**Wenn** sie geöffnet werden
**Dann** folgen sie dem Panel-Muster aus DESIGN.md (Stein, Liste mit Item-Bildern, eine Glut-Haupttaste, Beträge als Symbol + Zahl), Funktionen bleiben unverändert
**Und** der alte `Modal`-Look und die PoC-Klassen dieser Ansichten sind entfernt.

_Nachgetragen 2026-10-24: Lücke aus der Bestandsaufnahme der PoC-Ansichten; 2.1 hatte nur HUD, Dock und Vorschau umgebaut._

## Epic 3: Leutnants

Spieler treffen benannte Leutnants, die bei 0 TP fliehen, Groll gegen ihren Vertreiber tragen, mitwachsen und Kopfgeld bringen. Nichts davon wird prozedural erzeugt (NFR14).

### Story 3.1: Leutnants als Content und auf dem Brett

Als Spieler
möchte ich Leutnants sofort von normalen Gegnern unterscheiden,
damit ich weiß, wer wiederkommt.

**Akzeptanzkriterien:**

**Angenommen** `content/acts/act1/lieutenants.yaml` (bis Epic 4 vorläufig `content/lieutenants.yaml`) mit id, Name, Porträt, Modell, Klasse, Fraktion, Signatur-Item, 3 Groll-Fähigkeiten und Zeilen
**Wenn** `pnpm content:check` läuft
**Dann** prüft es Schema und Referenzen, höchstens 4 Leutnants je Akt und eindeutige IDs
**Und** Karteneinheiten können `lieutenant: <id>` tragen.

**Angenommen** ein Leutnant steht auf dem Brett
**Wenn** er gerendert wird
**Dann** hat er den doppelten Bodenring mit Goldkante und über dem Kopf den Groll-Wimpel mit 0–3 Kerben
**Und** beim Antippen zeigt eine dünne Linie zum Groll-Ziel, falls Groll ≥ 1.

### Story 3.2: Flucht bei 0 TP

Als Spieler
möchte ich vorher sehen, dass ein Leutnant flieht statt stirbt,
damit sich nichts beliebig anfühlt.

**Akzeptanzkriterien:**

**Angenommen** ein Leutnant würde auf 0 TP fallen
**Wenn** der Treffer aufgelöst wird
**Dann** setzt der Kern `gone: 'fled'` und meldet `fled{unit, by}`; der Leutnant verlässt die Karte
**Und** die Ziele `boss` und `rout` zählen ihn als besiegt.

**Angenommen** die Kampfvorschau gegen einen Leutnant
**Wenn** der Angriff ihn auf 0 TP bringen würde
**Dann** zeigt sie „flieht“ statt 0 (Mockup 01/02)
**Und** das Brett spielt Rückwärtssprung, Rauchwölkchen und fallenden Wimpel, dazu eine Fluchtzeile als Sprechblase (Zeilen-Content über das Szenen-Schema aus Story 4.4).

### Story 3.3: Groll und Groll-Ziel

Als Spieler
möchte ich, dass ein Leutnant sich an die Figur erinnert, die ihn vertrieben hat,
damit die Welt sich an meine Truppe erinnert.

**Akzeptanzkriterien:**

**Angenommen** ein Leutnant ist geflohen
**Wenn** die Mission gewonnen ist
**Dann** erhöht `finishBattle` in `c.lieutenants[id]` `routs`, setzt `grudge = min(3, grudge + 1)` und `target` auf den Vertreiber
**Und** die Wirkung `grudge: { lt, delta: -1 }` senkt den Groll (für Entscheidungen; Wirkungssprache aus Story 4.2, Epic 4 läuft vorher).

**Angenommen** ein Leutnant mit Groll-Ziel steht auf der Karte
**Wenn** die KI Ziele bewertet
**Dann** bekommt das Groll-Ziel +20; beim ersten Sichtkontakt spricht der Leutnant seine Groll-Zeile mit dem Namen des Ziels
**Und** ist das Ziel gefallen, bleibt der Groll, und er spricht die Gedenk-Spottzeile, bis die nächste Vertreibung ein neues Ziel setzt.

### Story 3.4: Mitwachsende Stärke

Als Spieler
möchte ich, dass Leutnants weder abgehängt noch unschlagbar sind,
damit jede Begegnung fordernd bleibt.

**Akzeptanzkriterien:**

**Angenommen** eine Mission mit Leutnant
**Wenn** der Kampf erzeugt wird
**Dann** ist seine Stufe der effektive Durchschnitt der 6 stärksten Einheiten der Armee plus Groll; je Groll-Stufe +1 Ausrüstungs-Tier und eine weitere Groll-Fähigkeit
**Und** das Ergebnis ist deterministisch und getestet.

### Story 3.5: Kopfgeld und Signatur-Item

Als Spieler
möchte ich für jede Vertreibung belohnt werden,
damit ein wiederkehrender Feind kein Frust ist.

**Akzeptanzkriterien:**

**Angenommen** ein Leutnant wurde vertrieben
**Wenn** die Mission endet
**Dann** gibt es Kopfgeld 200 × (Groll + 1) Gold + 1–2 Material des Akts und mit 10 % das Signatur-Item, garantiert bei der 4. Vertreibung desselben Leutnants (Werte in `balance.yaml`, Zufall aus dem Kampf-RNG)
**Und** das Ergebnis zeigt Kopfgeld und neuen Groll mit Symbol + Zahl (Mockup 08).

### Story 3.6: Steckbriefe

Als Spieler
möchte ich alles über einen Leutnant nachlesen können,
damit ich planen kann, wer ihn stellt.

**Akzeptanzkriterien:**

**Angenommen** ein Leutnant im Kampf
**Wenn** der Spieler ihn lange drückt
**Dann** zeigt das Brett seine Gefahrenzone, und zugleich öffnet der Steckbrief: Medaillon mit Goldring, Groll-Kerben, Name und Rolle, Groll-Ziel, Fluchtregel, Kopfgeld, Begegnungen und Vertreibungen, Groll-Fähigkeiten (gesperrte gestrichelt) (Mockup 02)
**Und** dieselbe Ansicht gibt es als Liste aller bekannten Leutnants, erreichbar über das Menü (ab Epic 5 über die Leiste „Steckbriefe“).

### Story 3.7: Seitenwechsel

Als Spieler
möchte ich, dass ein Leutnant nach meiner Entscheidung zu meiner Truppe wechselt,
damit Entscheidungen Feinde zu Gefährten machen können (FR25).

**Akzeptanzkriterien:**

**Angenommen** eine Entscheidung mit der Wirkung `recruit: { lt }` (Grosk, Sable, Mael; Wirkungssprache aus Story 4.2)
**Wenn** sie angewendet wird
**Dann** wird der Leutnant zum Gefährten mit Rolle, Stufe (mitwachsende Stärke aus 3.4 ohne Groll) und Startausrüstung inklusive Signatur-Item, setzt das Flag `joined_<lt>` und meldet `companionJoined`
**Und** er erscheint in keiner Heimsuchung und keiner Finale-Aufstellung mehr; Groll gegen ihn und von ihm verfällt.

**Angenommen** das Armee-Limit ist voll
**Wenn** ein Beitritt per Entscheidung oder Ansprechen ansteht
**Dann** findet er trotzdem statt, und der Spieler muss vor der nächsten Mission einen Söldner entlassen
**Und** Tests decken Wechsel, Ausschluss aus Heimsuchungen und das volle Limit ab.

## Epic 4: Akt-Struktur, Szenen und Entscheidungen

Spieler erleben einen Akt mit teils freier Reihenfolge, Szenen mit Halbfiguren und Ersatzsprechern, Entscheidungen mit Folgen, eine Chronik und feste Support-Paare.

### Story 4.1: Content je Akt ablegen

Als Entwickler
möchte ich Regeln und Akt-Inhalte getrennt ablegen,
damit Akte einzeln wachsen und später als Pakete ausgeliefert werden können.

**Akzeptanzkriterien:**

**Angenommen** das Layout aus Architektur §7
**Wenn** die Story umgesetzt ist
**Dann** liegen Regeln, UI-Texte und Werte in `content/core/`, Akt-Inhalte in `content/acts/act1/` (Kampagne, Karten, Leutnants, Dialoge); Browser-Loader, Node-Loader, `content:check` und `pnpm sim` finden alles
**Und** das Spiel verhält sich unverändert (E2E-Smoke-Test grün).

**Angenommen** die Story-Knoten in `content/acts/actN/campaign.yaml`
**Wenn** `content:check` läuft
**Dann** trägt jeder Story-Knoten `expectedLevel` (erwartete effektive Armee-Stufe nach GDD, Akt 1: 1 → 9, Finale 10), und die Kurve fällt innerhalb eines Akts nicht ab
**Und** Gegnerstufen (5.5, 5.6), Heimsuchungs-Deckel und die Simulation (6.8) lesen nur dieses Feld.

### Story 4.2: Bedingungen und Wirkungen

Als Content-Autor
möchte ich „wenn“ und „dann“ in YAML ausdrücken,
damit Szenen, Knoten, Entscheidungen und Belohnungen ohne Code wirken.

**Akzeptanzkriterien:**

**Angenommen** die Bedingungen `flag`, `alive`, `dead`, `left`, `completed`, `storyCount`, `act`, `support`, `stance`, `met`, `chronicle`, `any`, `not` und die Wirkungen `setFlag`, `recruit`, `leave`, `grudge`, `gold`, `material`, `item`, `priceMod`, `villageAid`, `openQuest`, `stance`, `chronicle` (Architektur §5.3)
**Wenn** sie in `src/core/campaign/conditions.ts` und `effects.ts` umgesetzt sind
**Dann** sind sie per Zod-Schema validiert und jede Referenz wird von `content:check` geprüft
**Und** `recruit`/`leave` für Avatar oder Kael lehnt das Schema ab; Tests decken jede Bedingung und Wirkung ab.

**Angenommen** ein Flag-Register `content/acts/act1/flags.yaml`
**Wenn** ein Content-Element ein undeklariertes Flag nutzt
**Dann** scheitert `content:check`
**Und** `CampaignState.flags` ist ein Record mit Werten statt einer Liste.

### Story 4.3: Kampagnen-Graph eines Akts

Als Spieler
möchte ich nach dem Akt-Einstieg zwischen mehreren Missionen wählen,
damit ich die Mitte eines Akts in meiner Reihenfolge spiele.

**Akzeptanzkriterien:**

**Angenommen** `content/acts/act1/campaign.yaml` mit Knoten (`kind`, `fixed: first|finale`, `requires`, `memorialIf`)
**Wenn** die Kampagne fortschreitet
**Dann** liefert `availableNodes(data, c)` die verfügbaren Knoten: zuerst nur die feste erste Mission, danach alle mit erfüllten Bedingungen, das Finale erst nach allen anderen Story-Knoten
**Und** `CampaignState.available` und `next` entfallen.

**Angenommen** gestaffelte Regeln im Akt (`mechanics` nach `storyCount`)
**Wenn** eine Mission startet
**Dann** sperrt `lockedMechanics` nach Zahl abgeschlossener Story-Missionen statt Knotenposition
**Und** Klassen-Aktionen einer Rolle sind erst aktiv, wenn der erste Gefährte dieser Rolle beigetreten ist (`c.rolesSeen`).

**Angenommen** eine Nebenquest, deren Auslöser gefallen ist
**Wenn** sie gespielt wird
**Dann** läuft die Gedenk-Variante der Szene; Story-Knoten sind nach Abschluss nicht wiederholbar.

### Story 4.4: Szenen-Schema mit Ersatzsprechern

Als Content-Autor
möchte ich Szenen mit deutschem Text, Sprecherketten und Bedingungen in einer Datei schreiben,
damit Permadeath nie eine Szene zerbricht.

**Akzeptanzkriterien:**

**Angenommen** eine Szene `content/acts/act1/scenes/<id>.yaml` mit Zeilen (`id`, `speaker` als Kette, `mood`, `text`, `requires`, `memorial`) und Antworten (`choice` mit `id`, `text`, `stance`, `effects`) (Architektur §5.8)
**Wenn** `resolveScene(data, ctx, id)` läuft
**Dann** spricht der erste lebende Sprecher der Kette, Zeilen mit unerfüllten Bedingungen entfallen, und eine Gedenkzeile erscheint, wenn die erste Figur der Kette tot ist
**Und** Schlüssel entstehen automatisch (`dlg.<szene>.<zeile>`); Englisch steht in `content/locales/en/act1.dialogue.yaml`.

**Angenommen** `pnpm content:check`
**Wenn** Szenen geprüft werden
**Dann** scheitert es bei Boxen über 110 Zeichen (DE oder EN), Ketten ohne Avatar/Kael am Ende und ohne `fallback: skip`, fehlenden EN-Schlüsseln, unbekannten Stimmungen und Antworten in Kampf-Szenen
**Und** die PoC-Dialoge sind ins neue Format überführt; das alte Schema entfällt.

### Story 4.5: Szenen im neuen Stil

Als Spieler
möchte ich Gespräche mit großen Figuren erleben, die zeigen, wer spricht,
damit mir die Truppe ans Herz wächst.

**Akzeptanzkriterien:**

**Angenommen** eine aufgelöste Szene
**Wenn** sie läuft
**Dann** steht der Sprecher als Halbfigur hell im Vordergrund, Zuhörer gedämpft, das Namensschild als Glut-Pille an seiner Seite, der Hintergrund weichgezeichnet und leicht entsättigt (Mockup 05)
**Und** oben rechts gibt es Log, Auto und Überspringen; bereits gesehene Szenen lassen sich ganz überspringen; ein Tipp führt weiter.

**Angenommen** eine Sprechblase im Kampf
**Wenn** ein Trigger oder Leutnant spricht
**Dann** erscheint sie am Kopf der Figur, höchstens 2 Zeilen, und blockiert bis zum Tipp bzw. 2,5 s im Auto-Modus.

### Story 4.6: Entscheidungen und Folgen-Karte

Als Spieler
möchte ich wissen, wann eine Antwort Folgen hat, und sehen, welche,
damit sich kleine Wahlen groß anfühlen.

**Akzeptanzkriterien:**

**Angenommen** eine Antwort-Zeile
**Wenn** sie erscheint
**Dann** trägt sie die Marke „Entscheidung · hat Folgen“; der erste Tipp markiert, der zweite bestätigt; Überspringen und Auto sind aus
**Und** die Wahl läuft als Kampagnen-Command `choose`, wendet die `effects` an und zählt die Haltung (warm, nüchtern, trotzig).

**Angenommen** eine bestätigte Wahl mit Wirkungen
**Wenn** sie angewendet ist
**Dann** zeigt die Folgen-Karte je Wirkung eine Zeile (Symbol, Satz, Erklärung, Mengen als Symbol + Zahl) und schreibt einen Chronik-Eintrag
**Und** das Dialog-Log hebt die eigene Wahl hervor; Wahlen lassen sich nicht zurückspulen.

### Story 4.7: Chronik

Als Spieler
möchte ich nachlesen, was ich entschieden habe und welche Chronik-Seiten ich gefunden habe,
damit ich die Geschichte meines Durchlaufs im Blick behalte.

**Akzeptanzkriterien:**

**Angenommen** getroffene Entscheidungen und gefundene Chronik-Seiten
**Wenn** der Spieler die Chronik öffnet (Menü; ab Epic 5 Leiste)
**Dann** sieht er je Akt die Entscheidungen mit gewählter Antwort und Folgen sowie die Chronik-Seiten (x von 12) zum Lesen
**Und** die Ansicht folgt dem Listen-Muster aus Stil B.

### Story 4.8: Neue Missionsziele escort und treasure

Als Spieler
möchte ich Eskorten und Truhenjagden spielen,
damit Missionen und Heimsuchungen abwechslungsreich sind.

**Akzeptanzkriterien:**

**Angenommen** eine Karte mit Ziel `escort` (NPC, Ausgang)
**Wenn** der NPC den Ausgang erreicht
**Dann** ist die Mission gewonnen; fällt der NPC, ist sie verloren.

**Angenommen** eine Karte mit Ziel `treasure` (Truhen, Rundenlimit)
**Wenn** alle Truhen vor Ablauf geborgen sind
**Dann** ist die Mission gewonnen; läuft das Limit ab, ist sie verloren
**Und** beide Ziele erscheinen in Rundenpille, Knoten-Karte und Vorschau der Mission; Zod-Schema und Tests decken sie ab.

### Story 4.9: Feste Support-Paare

Als Spieler
möchte ich, dass Freundschaften zwischen bestimmten Gefährten wachsen,
damit jeder seine eigene Geschichte in der Truppe hat.

**Akzeptanzkriterien:**

**Angenommen** `content/acts/act1/supports.yaml` mit festen Paaren (Narrative, 25 Paare über die Staffel) und Kennzeichnung der 6 S-Kernpaare
**Wenn** Punkte die Schwellen C 10, B 25, A 45, S 70 erreichen
**Dann** steht am Lagerfeuer ein Gespräch bereit; S gibt es nur für Kernpaare
**Und** das Lagerfeuer erlaubt in Akt 1 nur C und B (A und S über die Burg-Stufen, Epic 10); die Marke „Gespräche bereit“ erscheint in Truppe und Lager.

## Epic 5: Weltkarte und Heimsuchungen

Spieler wählen die nächste Mission auf einer Weltkarte, die nach jeder Mission der Startpunkt ist, und finden jeden Tag neue Heimsuchungen bekannter Leutnants auf bekannten Karten.

### Story 5.1: Szenen-Host und geteilter Asset-Cache

Als Spieler
möchte ich zwischen Brett, Weltkarte und Heimat wechseln, ohne lange zu warten,
damit sich das Spiel wie ein Ganzes anfühlt.

**Akzeptanzkriterien:**

**Angenommen** `src/render/host.ts` mit Engine, Canvas, Qualitätsstufe und FPS-Deckel
**Wenn** die App zwischen Szenen wechselt
**Dann** ist immer nur eine Szene aktiv; die alte wird entsorgt, Modelle bleiben im geteilten Asset-Cache (Referenzzählung) und werden nicht neu geladen
**Und** das Brett ist in `render/board/` und gemeinsame Teile (Gelände, Modelle, Figuren, Kamera, Jahreszeit) in `render/shared/` aufgeteilt, mit unveränderter Schnittstelle (`load`, `play`, `setOverlays`, `centerOn`, `relayout`, `quality`, `dispose`).

**Angenommen** eine Szene im Hintergrund eines Dialogs
**Wenn** eine Visual-Novel-Szene läuft
**Dann** rendert der Canvas mit `board.fpsIdle` oder pausiert
**Und** die Zeichenaufrufe auf Kap. 1 (Mittel) steigen nicht gegenüber D17.

### Story 5.2: Die Weltkarte als flaches Bild

Als Spieler
möchte ich Valmora als gemalte Karte sehen, auf der meine Truppe von Akt zu Akt nach Norden zieht,
damit ich spüre, wo sie gewesen ist.

*(Geändert vom Produktinhaber, 2026-10-24: flaches Bild statt 3D-Szene; siehe `concept/23-art-direction/decision-log.md`.)*

**Akzeptanzkriterien:**

**Angenommen** `content/world/valmora.yaml` (Bild, Regionen mit Akt und Ort des Namens, Nebelkanten je Akt, Orte als Prozentpositionen mit Beschriftung und Art, optional mit Knoten-ID)
**Wenn** die Weltkarte geladen wird
**Dann** zeigt sie das gemalte Hochformat-Bild (Akt 1 unten, Akt 2 Mitte, Akt 3 oben) mit den Steinen der Knoten darauf; Regionen späterer Akte liegen unter Nebel mit Regionsname
**Und** die Karte hat 2 Zoomstufen und lässt sich verschieben; `content:check` prüft, dass jeder Knoten und die Heimat einen Ort haben und die Steine mindestens 90 px Abstand halten.

**Angenommen** ein Ort mit Varianten oder Drachenzeichen (z. B. Varnhold gerettet/verbrannt)
**Wenn** diese Aufsätze gebaut sind
**Dann** liegen sie als kleine Bilder oder Modelle auf der Lichtung (nicht Teil dieser Story; später optional).

### Story 5.3: Weltkarte als Hub

Als Spieler
möchte ich nach jeder Mission auf der Weltkarte landen und von dort alles erreichen,
damit ich immer sehe, was als Nächstes ansteht.

**Akzeptanzkriterien:**

**Angenommen** eine Kampagne nach dem Prolog
**Wenn** eine Mission endet oder der Spieler fortsetzt
**Dann** erscheint die Weltkarte mit Akt-Pille (Nummer, Jahreszeit, Name), Gold und Material als Pillen, Menü rund oben rechts und der Leiste unten mit vier Steinen (Heimat, Truppe, Steckbriefe, Chronik) (Mockup 03)
**Und** der Kriegslager-Hub aus U20 entfällt; die Heimat ist zusätzlich ein Ort auf der Karte.

**Angenommen** Knoten aus `availableNodes`
**Wenn** sie dargestellt werden
**Dann** sind Story-Knoten orange mit Nummer, Nebenquests grün mit „!“, Heimsuchungen rot mit Leutnant-Gesicht (am ersten Tag „NEU“), Heimat mit Zelt bzw. Burg, Erledigtes klein und grau
**Und** ein Tipp zoomt leicht heran und öffnet die Knoten-Karte (Kicker, Titel, Ziel, Plätze, Stufe, Leutnant mit Fluchtregel bzw. Groll, Belohnung als Symbol + Zahl, Aufstellung, Aufbrechen).

### Story 5.4: Tageswechsel

Als Spieler
möchte ich jeden Tag neue Heimsuchungen finden, ohne dass mir etwas wegläuft,
damit ich gern, aber nicht aus Pflicht zurückkomme.

**Akzeptanzkriterien:**

**Angenommen** `src/app/day.ts` mit `dayNumber(now, 4)` (Tageswechsel 04:00 Ortszeit)
**Wenn** die Weltkarte öffnet oder die App fortgesetzt wird
**Dann** schickt die App `advanceDay{ day }`; der Kern erzeugt Tagespakete für höchstens die letzten 3 Tage bis `day` und setzt `c.day.last`
**Und** ist `day ≤ last`, passiert nichts (zurückgestellte Uhr erzeugt nichts).

**Angenommen** neue Tagespakete
**Wenn** die Weltkarte erscheint
**Dann** zeigt ein Hinweis „Neuer Tag: n Heimsuchungen · nächste ab morgen 4:00“
**Und** vor der ersten Leutnant-Begegnung entstehen keine Heimsuchungen; Sommerzeitwechsel ändert nichts (Test).

### Story 5.5: Heimsuchungs-Anker und Generator

Als Spieler
möchte ich auf bekannten Karten neue, faire Aufgaben gegen bekannte Leutnants bekommen,
damit sich Wiederkehr lohnt.

**Akzeptanzkriterien:**

**Angenommen** Karten-YAML mit `haunts:`-Ankern (Variante, Ziel, Spawn-Zone, Einsatzzone, Rundenlimit bzw. Truhen) und `content/acts/act1/haunts.yaml` mit Gegner-Pools
**Wenn** ein Tagespaket entsteht
**Dann** wählt der Generator mit `seedRng(hash32(c.seed, day))` 1–3 abgeschlossene Story-Karten mit Ankern, die gerade nicht heimgesucht sind, je eine Variante (nicht die zuletzt gespielte) und einen Leutnant aus erreichten Akten, der nicht gewechselt ist
**Und** Gegner kommen aus den Pools auf erwarteter Armee-Stufe mit dem Ausrüstungs-Tier des Akts.

**Angenommen** mehr als 6 offene Heimsuchungen
**Wenn** eine neue entsteht
**Dann** verfällt die älteste
**Und** `content:check` prüft für jeden Anker die Erreichbarkeit (Pfad von jedem Einsatzfeld zum Ziel); Tests zeigen Reproduzierbarkeit aus Seed und Tag.

### Story 5.6: Heimsuchungen spielen und belohnen

Als Spieler
möchte ich für Heimsuchungen angemessen belohnt werden, ohne davonzulaufen,
damit sie eine Ergänzung zur Story bleiben.

**Akzeptanzkriterien:**

**Angenommen** eine gewonnene Heimsuchung
**Wenn** das Ergebnis berechnet wird
**Dann** gibt es 40 % des Story-Golds des aktuellen Akts, Kopfgeld, Material und 60 % EP, keine Glutfunken (Werte in `balance.yaml`)
**Und** ab der 4. Heimsuchung seit der letzten Story-Mission halbieren sich Gold und Kopfgeld; Einheiten über der erwarteten Armee-Stufe der nächsten Story-Mission erhalten 50 % der Heimsuchungs-EP.

**Angenommen** `pnpm sim --haunt <mapId>:<variant>`
**Wenn** es für jeden Anker der Akt-1-Karten läuft
**Dann** liegen die Ergebnisse im Normal-Korridor oder die Abweichung ist begründet.

## Epic 6: Truppe, Fortschritt und Lager

Spieler verwalten Truppe und Ausrüstung im neuen Stil, versorgen sich im Lager und ab 1-6 in der Paktwacht, sehen nach jeder Mission ein klares Ergebnis und nehmen Abschied von Gefallenen; die Kurven tragen über Akt 1.

### Story 6.1: Truppe und Figur

Als Spieler
möchte ich meine Truppe auf einen Blick sehen und jede Figur genau ansehen,
damit ich weiß, wer bereit ist und wer etwas braucht.

**Akzeptanzkriterien:**

**Angenommen** die Leiste „Truppe“
**Wenn** der Spieler sie öffnet
**Dann** zeigt ein Medaillon-Raster alle Gefährten und Söldner mit Rolle und Stufe, filterbar nach Rollengruppe, mit Marken für „kann aufsteigen“, „Gespräche bereit“ und „Narbe“ (Mockup 06)
**Und** Gefallene erscheinen nicht hier.

**Angenommen** eine Figur
**Wenn** der Spieler sie öffnet
**Dann** sieht er Halbfigur, Rolle und Stufe, EP-Balken, 10 Werte, 6 Ausrüstungs- und 3 Beutelplätze (Zahl = Aufwertung oder Ladungen, Raute = Seltenheit), Last und Meisterung; Wischen wechselt die Figur
**Und** die Ansicht ist auch aus der Einheitenkarte im Kampf per Langdruck erreichbar (nur lesend).

### Story 6.2: Ausrüsten mit Vergleich

Als Spieler
möchte ich beim Ausrüsten sofort sehen, was besser oder schlechter wird,
damit Ausrüstung eine bewusste Entscheidung ist.

**Akzeptanzkriterien:**

**Angenommen** ein Ausrüstungsplatz einer Figur
**Wenn** der Spieler ihn antippt
**Dann** listet die Ansicht passende Items aus Beutel und Konvoi mit Bild, Werten und Vergleich grün/rot gegen das Angelegte; Items, die die Rolle nicht führen darf, stehen gedimmt mit Grund
**Und** erster Tipp wählt, die Haupttaste („Wurfspieß anlegen“) führt das Kampagnen-Command aus.

**Angenommen** der Konvoi
**Wenn** der Spieler ihn öffnet
**Dann** folgt er demselben Listen-Muster mit Filter nach Art.

### Story 6.3: Das Lager in Akt 1

Als Spieler
möchte ich zwischen Missionen im Lager meine Truppe versorgen,
damit die Heimat schon in Akt 1 ein Ort ist.

**Akzeptanzkriterien:**

**Angenommen** `content/core/rooms.yaml` und `c.home = { kind: 'camp', rooms }`
**Wenn** der Spieler die Heimat öffnet
**Dann** zeigt sie oben das Lager-Diorama und unten die Stationen Konvoi, Händler, Schmied, Heiler, Taverne, Lagerfeuer als Raumsteine (Mockup 04, Lager)
**Und** jede Station öffnet ein Raum-Panel über der weichgezeichneten Ansicht; jede Handlung braucht höchstens 2 Taps und ist ein Kampagnen-Command.

**Angenommen** die Freischaltung aus U20 (Schmied und Heiler nach der ersten Mission usw.)
**Wenn** sie durch `requires` je Station ersetzt ist
**Dann** sind gesperrte Stationen gestrichelt mit Grund.

### Story 6.4: Händler, Schmied, Heiler und Taverne

Als Spieler
möchte ich kaufen, aufwerten, Narben heilen und Söldner anheuern,
damit ich Gold sinnvoll einsetze.

**Akzeptanzkriterien:**

**Angenommen** der Händler
**Wenn** der Spieler ihn öffnet
**Dann** sieht er Börse, Kaufen/Verkaufen, Sortiment nach Ausrüstungs-Tier des Akts (das Angebot des Tages kommt erst mit Händler-Stufe 3, Epic 10) und jeden Preis als Münze + Zahl; die Haupttaste nennt den Betrag; „Für wen?“ zeigt, wer das Item führen kann
**Und** Preisänderungen aus Entscheidungen (`priceMod`) und Dorfhilfe (`villageAid`) wirken sichtbar.

**Angenommen** Schmied, Heiler und Taverne
**Wenn** der Spieler sie nutzt
**Dann** gelten Kosten und Grenzen aus `balance.yaml` (Aufwerten bis +3 auf Stufe 1, Narbe heilen, Söldner 600 + 150 × Stufe, 3 Angebote) und das Armee-Limit 20 Gefährten + 6 Söldner (Beitritt über Entscheidung oder Ansprechen bei vollem Limit: Story 3.7).

### Story 6.5: Stufendeckel und EP-Regeln

Als Spieler
möchte ich, dass meine Truppe in Akt 1 nicht davonläuft,
damit Akt 2 noch Herausforderung bietet.

**Akzeptanzkriterien:**

**Angenommen** `levelCap` aus der Akt-Kampagne (Akt 1: 10)
**Wenn** eine Einheit die Grenze erreicht
**Dann** verfallen weitere EP und das `exp`-Event meldet `capped`; die UI zeigt „Stufe 10 · Deckel in Akt 1“
**Und** Leutnant-Vertreibung gibt +20 EP wie ein Boss; die übrigen EP-Regeln laut GDD sind getestet.

### Story 6.6: Missionsergebnis

Als Spieler
möchte ich nach einer Mission auf einen Blick sehen, was ich gewonnen und verloren habe,
damit sich Erfolg und Verlust klar anfühlen.

**Akzeptanzkriterien:**

**Angenommen** eine gewonnene Mission
**Wenn** das Ergebnis erscheint
**Dann** zeigt es die Sieg-Pille mit Missionsname und Runden, Beute (Gold, Material, Item-Bilder), Kopfgeld vertriebener Leutnants mit neuem Groll, Nebenziele (erfüllt/nicht) und EP je Figur mit Stufenaufstieg; Gefallene grau (Mockup 08)
**Und** alle Mengen als Symbol + Zahl.

**Angenommen** eine Niederlage
**Wenn** sie eintritt
**Dann** nennt der Bildschirm den Grund in einem Satz und bietet die Neustarts des Tod-Modus an (Story 1.5).

### Story 6.7: Abschied von Gefallenen

Als Spieler
möchte ich von jedem Gefallenen Abschied nehmen,
damit ein Verlust erzählerisch getragen wird.

**Akzeptanzkriterien:**

**Angenommen** eine Mission mit Gefallenen
**Wenn** der Spieler im Ergebnis „Weiter“ tippt
**Dann** folgt je Gefallenem die Abschieds-Karte: alles entsättigt bis auf eine Glutlinie, Halbfigur grau, Ort und Rolle, letzte Zeile aus der Szene des Gefährten, Trauer-Zeile des Support-Partners mit Wirkung, Taste „Abschied nehmen“ in Grau (Mockup 08)
**Und** die ersten 2 s lassen sich nicht überspringen; ein Glockenschlag erklingt.

**Angenommen** ein gefallener Söldner aus der Taverne
**Wenn** er fällt
**Dann** bekommt auch er einen Abschied (kurze Form) und später einen Gedenkstein.

### Story 6.8: Wirtschaftskurve und verkettete Simulation

Als Entwickler
möchte ich den ganzen Akt am Stück simulieren,
damit Gold, EP und Schwierigkeit über alle Missionen zusammenpassen.

**Akzeptanzkriterien:**

**Angenommen** `pnpm sim --campaign act1`
**Wenn** es läuft
**Dann** spielt es die Story-Missionen in einer gültigen Reihenfolge mit KI auf beiden Seiten und einer einfachen Heimat-Heuristik (kaufen, aufwerten, heilen), optional mit Heimsuchungen zwischen den Missionen
**Und** es gibt je Story-Mission Siegquote, Niedergestreckte, Gold und Armee-Stufe aus und markiert Missionen außerhalb der Korridore (NFR12) sowie Gold außerhalb der GDD-Kurve.

### Story 6.9: Die Paktwacht als Heimat

Als Spieler
möchte ich nach der Eroberung der Paktwacht dort statt im Lager leben,
damit die Truppe schon in Akt 1 ein Zuhause hat und ihre Gefallenen einen Ort.

**Akzeptanzkriterien:**

**Angenommen** die Wirkung `setHome` (Architektur §5.3, Muster §8.2) und Knoten `m1_6` mit `effects: [{ setHome: castle }]`
**Wenn** die Mission 1-6 gewonnen ist
**Dann** ist `c.home.kind = 'castle'`, die Räume behalten ihre Stufe, und `render/home/` zeigt die Paktwacht als Ruine im 3D-Diorama mit Raum-Ankern und unten Konvoi, Händler, Schmied, Heiler, Taverne, Lagerfeuer und Gedächtnishalle als Raumsteine (UX-DR10)
**Und** die Ausbau-Bänder sind bis Akt 2 gestrichelt mit Grund gesperrt (`requires: [{ act: 2 }]` in `rooms.yaml`, kein `if (act >= 2)`).

**Angenommen** gefallene Gefährten und Söldner, darunter Gerrit aus dem Prolog
**Wenn** der Spieler die Gedächtnishalle öffnet
**Dann** stehen ihre Gedenksteine dort (entsättigt, Glutlinie, Zitat), Gerrits Stein zuerst; Lektionen gibt es erst ab Akt 2 (Story 10.7) (UX-DR11 Teil).

### Story 6.10: Aufstellung vor der Mission im Stil B

Als Spieler
möchte ich die Aufstellung vor einer Mission im selben Stil wie Truppe, Lager und Ergebnis sehen,
damit der Weg von der Knoten-Karte in den Kampf nicht durch einen Bildschirm aus dem Prototyp bricht.

**Akzeptanzkriterien:**

**Angenommen** die Knoten-Karte der Weltkarte („Aufstellung“) oder mehr Gefährten als Plätze („Aufbrechen“)
**Wenn** der Vorbereitungs-Screen (`prep`) erscheint
**Dann** zeigt er Ziel, Plätze (x/y) und die Truppe als Steine im Stil B (DESIGN.md, Studio-Look): Porträt, Name, Klasse und Stufe ohne Umbruch, TP, Waffe, Pflicht-Figuren gesperrt mit Grund, Tasche/Ausrüsten wie heute, und „Kampf beginnen“ als Primär-Knopf
**Und** die Funktion bleibt unverändert (Auswahl, Pflicht-Figuren, Ausrüsten, Start); Styles in einer eigenen CSS-Datei neben der Komponente, der Abschnitt in `src/ui/styles.css` entfällt.

**Angenommen** ein Mockup in `concept/25-ux/mockups/` (fehlt noch, UX liefert es zuerst)
**Wenn** die Story umgesetzt ist
**Dann** passt der Screen bei 375 × 812 und am Desktop zum Mockup, alle Texte stehen in `de.yaml`/`en.yaml`.

## Epic 7: Akt-Pakete und Offline

Spieler laden das Spiel schnell, bekommen den Rest eines Akts im Hintergrund und spielen danach offline; neue Akte kommen per Update, ohne dass Spielstände brechen.

### Story 7.1: Pakete im Build

Als Spieler
möchte ich, dass das Spiel beim ersten Öffnen schnell startet,
damit ich nicht auf einen großen Download warte.

**Akzeptanzkriterien:**

**Angenommen** `content/packs.yaml` mit Paketen `core` (Shell, Regeln, Prolog), `act1`, `voice.act1.de`, `voice.act1.en`, Globs und `released`
**Wenn** `pnpm build` läuft
**Dann** erzeugt ein Vite-Plugin je Paket ein virtuelles Modul `virtual:hc-pack/<id>` und eine `packs.json` mit Dateien, Hashes und Größen; nur veröffentlichte Pakete kommen in den Build
**Und** `pnpm art:build` schreibt Assets nach `public/assets/<pack>/` mit Manifest je Paket.

**Angenommen** `tools/check-bundle-size.mjs`
**Wenn** der Build fertig ist
**Dann** bricht er ab, wenn `core` über 15 MB (gzip) liegt, und meldet die anderen Pakete gegen ihre Budgets.

### Story 7.2: Hintergrund-Download und Offline

Als Spieler
möchte ich, dass der Rest eines Akts im Hintergrund lädt und danach offline bleibt,
damit ich unterwegs ohne Netz spielen kann.

**Akzeptanzkriterien:**

**Angenommen** ein fehlendes Paket eines erreichten Akts
**Wenn** die App läuft
**Dann** lädt `src/packs/` alle Dateien des Pakets in einen Cache `hc-pack-<id>-<hash>`, der Service Worker liefert sie cache-first, und `loadPack(id)` registriert Daten und Locales (auch im Worker)
**Und** die Weltkarte zeigt den Fortschrittsring (Prozent, MB, „danach offline spielbar“), Missionen des Pakets sind sichtbar mit „Wird noch geladen …“ (Mockup 07).

**Angenommen** der Download scheitert oder das Gerät ist offline
**Wenn** die App es bemerkt
**Dann** versucht sie es mit Backoff erneut und zeigt „Wird geladen, sobald du online bist“
**Und** bei einem Update werden nur geänderte Dateien neu geholt und alte Caches nach Erfolg gelöscht.

### Story 7.3: Ende eines veröffentlichten Akts

Als Spieler
möchte ich wissen, dass es weitergeht, wenn ich alle verfügbaren Missionen gespielt habe,
damit ich nicht vor einem leeren Bildschirm stehe.

**Akzeptanzkriterien:**

**Angenommen** das Finale eines Akts ist gewonnen und das nächste Akt-Paket ist nicht im Build
**Wenn** die Weltkarte erscheint
**Dann** steht über der nächsten Region im Nebel „Akt n „Name“ erscheint bald“ mit dem Hinweis auf Heimsuchungen, Nebenquests und Lagerfeuer
**Und** nach dem Akt-Finale erinnert die App einmal an ein Backup (Export).

### Story 7.4: Stabile IDs und Release-Ablauf

Als Spieler
möchte ich, dass mein Spielstand jedes Update übersteht,
damit ich Akt für Akt mit derselben Truppe weiterspiele.

**Akzeptanzkriterien:**

**Angenommen** `pnpm content:lock`
**Wenn** ein Akt veröffentlicht wird
**Dann** schreibt es alle veröffentlichten IDs in `content/released-ids.json`; `content:check` scheitert, wenn eine gesperrte ID fehlt und nicht in `content/renames.yaml` steht
**Und** jede Save-Migration hat einen Fixture-Spielstand und einen Test; der Release-Ablauf (`released: true`, `content:lock`, Migration, Pull Request) steht in `AGENTS.md`.

### Story 7.5: Leistung messen

Als Spieler
möchte ich, dass das Spiel auf meinem Handy flüssig läuft und schnell startet,
damit große Schlachten Spaß machen.

**Akzeptanzkriterien:**

**Angenommen** ein Playwright-Lauf mit Referenzprofil (Pixel 6a / iPhone 12, gedrosselte CPU und Netz)
**Wenn** er eine komplette Gegnerphase einer großen Schlacht (24×32, ~40 Einheiten) und einen Kaltstart misst
**Dann** schreibt er Frame-Zeiten (Ziel 60 FPS, NFR1) und Kaltstartzeit (< 5 s, NFR2) als Bericht
**Und** die Messung läuft in CI und meldet Überschreitungen; 9.14 nutzt sie für die Freigabe.

### Story 7.6: Ladeanzeige beim ersten Start und vor Missionen

Als Spieler
möchte ich sehen, wenn das Spiel etwas herunterlädt, und wissen, wie lange es dauert,
damit ich nicht vor einem leeren Bildschirm warte und weiß, wann ich offline spielen kann.

**Akzeptanzkriterien:**

**Angenommen** der erste Start der App (Service Worker installiert den ersten Download)
**Wenn** die Dateien geladen werden
**Dann** zeigt ein Stein „Spiel wird vorbereitet · Größe · danach offline spielbar“ mit Fortschritt; ohne Klick, danach erscheint der Titel
**Und** bricht die Verbindung ab, sagt der Stein es in einem Satz und versucht es erneut.

**Angenommen** eine Mission oder Szene, deren Bilder oder Modelle (bei Bedarf geladen: Orte, Halbfiguren, Weltkarte, Einheiten-Modelle) noch nicht im Cache liegen
**Wenn** der Spieler sie startet
**Dann** erscheint ein Ladebildschirm mit Missionsname, Ortsbild und Fortschritt, bis alles da ist, und die Mission startet danach von selbst
**Und** liegt alles im Cache, erscheint kein Ladebildschirm; offline ohne fehlende Dateien wird gespielt, offline mit fehlenden Dateien steht ein Satz mit „Erneut versuchen“.

_Nachgetragen 2026-10-24: Entscheidung Produktinhaber (UX-Log), Anlass: große Bilder werden bei Bedarf geladen. Ergänzt 7.2 (Akt-Pakete im Hintergrund, Fortschrittsring)._

### Story 7.7: Große Schlachten flüssig

Als Spieler
möchte ich, dass auch die größte Schlacht auf meinem Handy flüssig läuft,
damit die Gegnerphase nicht ruckelt.

**Akzeptanzkriterien:**

**Angenommen** die Messung aus 7.5 (`pnpm perf`, Referenzschlacht 24×32 mit 40 Einheiten)
**Wenn** die Ursache der niedrigen Bildrate untersucht ist (Profil von CPU und GPU über die Gegnerphase)
**Dann** sind die größten Kosten benannt und behoben, und die Gegnerphase erreicht unter dem Referenzprofil 60 FPS (NFR1)
**Und** der Bericht von `pnpm perf` zeigt Vorher und Nachher.

_Nachgetragen 2026-10-24: Entscheidung Produktinhaber. Anlass: Die erste Messung (7.5) ergab 10–13 FPS mit GPU bei 4× gedrosselter CPU._

## Epic 8: Chibi-Stil, Item-Bilder und Audio

Spieler sehen und hören Akt 1 im Stil der Art Direction: Tripo-Figuren, Porträts mit Stimmungen, gemalte Item-Bilder, warmes Licht und Effekte, folk-lastige Musik und vertonte Schlüsselzeilen. Bilder per ChatGPT über Claude in Chrome mit Prompt und Abnahme in `art/prompts/`.

### Story 8.1: Tonbruch-Test mit einer Gedenkszene

Als Produktinhaber
möchte ich früh prüfen, ob der Chibi-Stil einen Tod ernst genug trägt,
damit das größte Stilrisiko vor der Massenproduktion geklärt ist.

**Akzeptanzkriterien:**

**Angenommen** Fenns Porträt in 4 Stimmungen, ein Dialog-Hintergrund und die Abschieds-Karte (Story 6.7)
**Wenn** die Gedenkszene im Spiel läuft
**Dann** bewerten Produktinhaber und 2–3 Tester, ob der Stil den Tod verharmlost (Brief-Risiko „Tonbruch“)
**Und** das Ergebnis steht in `concept/23-art-direction/decision-log.md`.

### Story 8.2: Tripo-Pipeline vervollständigen

Als Entwickler
möchte ich jede neue Tripo-Figur ohne Handarbeit und ohne zusätzliche KI-Animationen ins Spiel bringen,
damit alle Figuren gleich aussehen, ins Budget passen und Credits sparen.

**Akzeptanzkriterien:**

**Angenommen** die bestehende Pipeline `pnpm art:tripo` (Teamtuch per Magenta-Schlüssel, Animationen mit 12 fps, Skript-Schwert an der Hand; Art Direction §4.6)
**Wenn** die Story umgesetzt ist
**Dann** gibt es eine Bibliothek der Waffengruppen (Schwert, Lanze, Axt, Bogen, Buch, Stab, Schild, Dolch, Laute) als Modellteile an der Hand, passend zur ausgerüsteten Waffengruppe
**Und** Animationen eines Skeletttyps (inklusive Flucht und Jubel) lassen sich in Blender auf weitere Figuren übertragen, sodass je Skeletttyp höchstens eine KI-Animation nötig ist.

**Angenommen** eine aufbereitete Figur
**Wenn** `pnpm art:build` läuft
**Dann** landet sie im Paket ihres ersten Auftritts (`public/assets/<pack>/models/`, Epic 7)
**Und** jede Figur liegt bei ≤ 7 000 Dreiecken, 512er-Textur und ≤ 0,5 MB Transfergröße; der Build meldet Ausreißer.

### Story 8.3: Brettfiguren für Akt 1

Als Spieler
möchte ich jede Story-Figur und jeden Gegnertyp von Akt 1 auf dem Brett wiedererkennen,
damit Porträt und Figur zusammengehören.

**Akzeptanzkriterien:**

**Angenommen** die Story-Figuren von Akt 1 (Rhen in 2 Varianten, Kael, Brenna, Tobin, Fenn, Mira, Liora, Ysolde, Varek, Grosk), die Leutnants Hask, Morra, Ulvric, Grosk und die Gegnertypen Bandit, Wolfsreiter, Söldner, Tempelwache
**Wenn** sie über Turnaround → Tripo → Pipeline entstanden sind
**Dann** besteht jede Rolle den Silhouettentest in Zoom „Mittel“ und trägt ihr Signaturteil (Art Direction §4.3)
**Und** Prompts und Abnahmen liegen in `art/prompts/`.

### Story 8.4: Porträts mit Stimmungen für Akt 1

Als Spieler
möchte ich Gesichter, die Gefühle zeigen,
damit Szenen tragen.

**Akzeptanzkriterien:**

**Angenommen** die Moodboard-Porträts aus `art/mockups/characters-s1/`
**Wenn** die Kernfiguren von Akt 1 final sind
**Dann** haben sie 4 Stimmungen (`neutral`, `happy`, `angry`, `sad`) in gleicher Pose, freigestellt; Nebenfiguren nur `neutral`
**Und** die alten Anime-Porträts in `art/portraits/` werden ersetzt und die Veraltet-Hinweise entfernt.

### Story 8.5: Item-Bilder

Als Spieler
möchte ich jedes Item als gemaltes Bild sehen,
damit Ausrüstung so lebendig wirkt wie die Figuren.

**Akzeptanzkriterien:**

**Angenommen** alle Items, Runen, Verbrauchsgüter, Glutfunke und Materialien, die in Akt 1 vorkommen
**Wenn** ihre Bilder per ChatGPT im Round-Chibi-Stil entstanden sind (quadratisch, freigestellt, einheitliches Licht)
**Dann** zeigen Inventar, Händler, Beute, Vorschau und Ergebnis sie statt Platzhaltern
**Und** `content:check` meldet Items ohne Bild.

### Story 8.6: Licht, Wetter und Effekte auf dem Brett

Als Spieler
möchte ich ein warmes, lebendiges Diorama mit klaren Effekten,
damit Kämpfe schön und trotzdem lesbar sind.

**Akzeptanzkriterien:**

**Angenommen** `timeOfDay` und `weather` je Karte und die Presets in `render.yaml` (Art Direction §2.5)
**Wenn** eine Karte geladen wird
**Dann** gelten Jahreszeit des Akts, Tageszeit und Wetter; Teamfarben, Bodenringe und Markierungen bleiben ungelit
**Und** die Effekte aus Art Direction §8 (Cartoon-Treffer, Elemente, Status, Krit mit Cut-in, Leutnant-Flucht, Tod in Asche) laufen ≤ 600 ms bei 1×; Bildschirmwackeln ist abschaltbar.

### Story 8.7: Titelbild, Logo und Dialog-Hintergründe von Akt 1

Als Spieler
möchte ich beim Start und in Szenen Bilder im Stil der Welt sehen,
damit der erste Eindruck stimmt.

**Akzeptanzkriterien:**

**Angenommen** das Titelbild (Kael und Rhen am Lagerfeuer), das Logo mit Kronen-O und die Orte von Akt 1 aus dem Moodboard
**Wenn** sie final sind
**Dann** zeigen Titel und Szenen sie; Hintergründe im Spiel leicht weichgezeichnet und entsättigt, Hochformat-Sicherheitszone in der Mitte
**Und** die Logo-Schrift ist aus den Kandidaten der Art Direction gewählt und im Log vermerkt.

### Story 8.8: Musik und Klang von Akt 1

Als Spieler
möchte ich warme, folk-lastige Musik und klare Klänge,
damit Akt 1 nach Spätsommer und Aufbruch klingt.

**Akzeptanzkriterien:**

**Angenommen** ElevenLabs (MCP oder `tools/audio/elevenlabs.py`)
**Wenn** die Stücke für Weltkarte, Lager, Kampf (Phasenpaar), Leutnant und Gedenken sowie die Signaturklänge (Glockenschlag, Funkenknistern, Beben) entstanden sind
**Dann** spielt das Spiel sie nach `17-audio.md` und dem Mischkonzept aus U19; Hub-Musik ohne Gesang
**Und** Lizenzfrage GA26 bleibt offen; nichts wird kommerziell veröffentlicht.

### Story 8.9: Teilvertonung von Akt 1

Als Spieler
möchte ich die wichtigsten Zeilen hören,
damit Gefährten und Leutnants eine Stimme haben.

**Akzeptanzkriterien:**

**Angenommen** Barks der Akt-1-Gefährten, Groll- und Fluchtzeilen der Akt-1-Leutnants und die Schlüsselszene „Gerrits Grab“
**Wenn** sie in DE und EN vertont sind (eine mehrsprachige Stimme je Figur)
**Dann** liegen sie im Paket `voice.act1.<lang>` und spielen zur passenden Zeile; Untertitel sind immer an
**Und** fehlt eine Aufnahme, läuft die Zeile ohne Ton weiter.

## Epic 9: Akt 1 „Asche“ (MVP)

Spieler spielen Prolog und Akt 1 komplett. Jede Missions-Story liefert Karte, Szenen vor/nach (DE + EN), Leutnant-Auftritte, Beitritte, Entscheidungen, Heimsuchungs-Anker (2–3 je Karte) und einen Sim-Lauf im Korridor (NFR12). Grundlage: `concept/22-narrative/narrative.md` (Missionsfolge, Entscheidungen, Nebenquests).

### Story 9.1: Prolog „Die Paktnacht“

Als Spieler
möchte ich in der Paktnacht ankommen, die Truppe kennenlernen und Gerrit verlieren,
damit ich weiß, worum es geht, bevor ich die Regeln kenne.

**Akzeptanzkriterien:**

**Angenommen** die Prolog-Karte (kompakt, Ziel `escape`, Tempelwachen, keine Leutnants) und die Szenen „Paktnacht“ und „Gerrits Grab“ (Illustrationstafeln)
**Wenn** der Spieler den Prolog spielt
**Dann** treten Rhen, Kael, Brenna und Tobin bei; die Lektionen zu Bewegung, Vorschau, Gefahrenzone und Heiltrank erscheinen höchstens einmal je Runde
**Und** der Prolog liegt im Paket `core`; `pnpm sim prologue --runs 50` liegt im Korridor.

### Story 9.2: Mission 1-1 „Steckbriefe“

Als Spieler
möchte ich erfahren, dass die Truppe als Königsmörder gesucht wird,
damit der Antrieb „Sündenbock“ greift.

**Akzeptanzkriterien:**

**Angenommen** Karte (Ziel `rout`, Waffendreieck als neue Regel) und Szenen
**Wenn** die Mission gewonnen ist
**Dann** tritt Fenn bei; danach sind 1-2, 1-3 und die übrigen Missionen der Akt-Mitte nach ihren Bedingungen wählbar
**Und** Heimsuchungs-Anker und Sim-Korridor wie oben.

### Story 9.3: Mission 1-2 „Asche über Erlbach“ und Entscheidung E1

Als Spieler
möchte ich ein Dorf gegen Hask verteidigen und ihm zum ersten Mal begegnen,
damit ich die Leutnants kennenlerne.

**Akzeptanzkriterien:**

**Angenommen** Karte (Ziel `defend`, Leutnant Hask, erste Begegnung), Szenen und Mira als Beitritt
**Wenn** Hask flieht und die Mission gewonnen ist
**Dann** beginnen ab jetzt Heimsuchungen; Mira tritt bei
**Und** in der Szene danach fällt E1 (Mira heimkehren lassen oder halten) mit Folgen-Karte (Mockup 05); die Weltkarten-Variante von Erlbach folgt dem Ausgang.

### Story 9.4: Mission 1-3 „Der Fremde mit dem Siegel“

Als Spieler
möchte ich Liora schützen, Morras Jäger vertreiben und Halvard zum ersten Mal sehen,
damit die Paktgeschichte beginnt.

**Akzeptanzkriterien:**

**Angenommen** Karte (Ziel `rout`, Liora am Schrein darf nicht fallen, Leutnant Morra) und Szenen mit Halvards Auftritt (Ziel geändert von `escort`, narrative decision-log 2026-10-28)
**Wenn** alle Jäger besiegt oder vertrieben sind
**Dann** tritt Liora bei; die Nebenquest N2 „Der letzte Wachturm“ öffnet sich
**Und** gestaffelte Regeln hängen nur an der Zahl abgeschlossener Story-Missionen (Magie nach 2), nicht an dieser Mission.

### Story 9.5: Mission 1-4 „Die Spur des Maklers“ und Entscheidung E2

Als Spieler
möchte ich den Makler Osric Dunn stellen und Ysolde befreien,
damit Akt 1 seinen Wendepunkt bekommt.

**Akzeptanzkriterien:**

**Angenommen** vor der Mission E2 (Fenn ausliefern oder schützen) und die Karte (Ziel `boss` Osric Dunn, Leutnant Ulvric, Gefangene Ysolde)
**Wenn** die Mission gewonnen ist
**Dann** stirbt Dunn (Story), Ysolde tritt bei, danach folgt die Szene „Rhens Geständnis“ (Illustrationstafel)
**Und** E2 wirkt: „ausliefern“ macht die Mission leichter und Fenn geht, „schützen“ öffnet N1.

### Story 9.6: Mission 1-5 „Das Hungerlager“ und Entscheidung E3

Als Spieler
möchte ich gegen Banditen kämpfen, die eigentlich Hungernde sind,
damit die Gewissensfrage „Gold gegen Gewissen“ spürbar wird.

**Akzeptanzkriterien:**

**Angenommen** Karte (Ziel `survive`: standhalten, bis Grosk redet; Leutnant Grosk, Varek per Ansprechen) und Szenen
**Wenn** die Mission gewonnen ist
**Dann** fällt E3: verschonen (Grosk tritt direkt bei, Hask-Groll −1) oder Kopfgeld (+600 Gold)
**Und** Elemente, Status, Runen und Supports sind ab der dritten abgeschlossenen Story-Mission aktiv, unabhängig von der Reihenfolge.

### Story 9.7: Mission 1-6 „Die Paktwacht“ und Entscheidung E4

Als Spieler
möchte ich die Burgruine erobern und eine Heimat gewinnen,
damit die Truppe mitten in Akt 1 ein Zuhause bekommt.

**Akzeptanzkriterien:**

**Angenommen** die Karte (Ziel `seize` durch Kael, Leutnants Hask und Ulvric), die Tafel „Das Banner auf der Ruine“ und Knoten `m1_6`, der sich nach 1-2 bis 1-5 öffnet
**Wenn** die Mission gewonnen ist
**Dann** wechselt `setHome` die Heimat auf die Burg (Story 6.9), es folgt das Gespräch „Eine Burg für Niemande“, und E4 (Flüchtlinge aufnehmen oder geheim halten) fällt
**Und** danach ist nur 1-7 wählbar; Akt 1 läuft ab hier fest bis zum Finale.

### Story 9.8: Mission 1-7 „Unter der Paktwacht“

Als Spieler
möchte ich nach einem Beben das Gewölbe unter der Paktwacht bergen,
damit ich die Gräber junger Könige und die versiegelte Chronik finde.

**Akzeptanzkriterien:**

**Angenommen** Karte (Ziel `treasure`: Truhen vor dem Einsturz bergen, Plünderer, kein Leutnant) und Szenen mit den Grabreliefs (Beat 6)
**Wenn** die Mission gewonnen ist
**Dann** liegt die Chronik versiegelt im Burgarchiv (entziffert in Akt 2, Beat 10), und das Finale 1-8 öffnet sich
**Und** Heimsuchungs-Anker und Sim-Korridor wie oben.

### Story 9.9: Mission 1-8 „Die Heimat halten“ (Finale)

Als Spieler
möchte ich die neue Heimat gegen alle Banden verteidigen,
damit Akt 1 mit etwas endet, das der Truppe gehört.

**Akzeptanzkriterien:**

**Angenommen** die Finalkarte (Ziel `defend`, Leutnants Morra (führt), Hask, Ulvric und Grosk, falls nicht gewechselt) und die Szene davor mit einer Zeile je E4 (Gerücht oder Ulvrics Wölfe)
**Wenn** die Mission gewonnen ist
**Dann** erhält die Truppe 2 Glutfunken (Moment inszeniert)
**Und** ohne Akt-2-Paket zeigt die Weltkarte „Akt 2 „Glut“ erscheint bald“ (Story 7.3).

### Story 9.10: Nebenquest N1 „Der Ring von Varnhold“

Als Spieler
möchte ich Fenns Vergangenheit kennenlernen, wenn ich ihn geschützt habe,
damit Entscheidungen eigene Geschichten öffnen.

**Akzeptanzkriterien:**

**Angenommen** E2 „schützen“
**Wenn** der Spieler N1 spielt
**Dann** erhält er Glutfunke und Signaturdolch; ist Fenn gefallen, läuft die Gedenk-Variante
**Und** N1 bleibt über Akte offen.

### Story 9.11: Nebenquest N2 „Der letzte Wachturm“

Als Spieler
möchte ich einen alten Wachturm der Paktwächter erkunden,
damit ich die erste Chronik-Seite und Lore finde.

**Akzeptanzkriterien:**

**Angenommen** Mission 1-3 ist gespielt
**Wenn** der Spieler N2 spielt
**Dann** erhält er Glutfunke, Chronik-Seite und das Relikt Schild der Paktwächter
**Und** die Chronik zeigt die Seite.

### Story 9.12: Nebenquest N3 „Das Erbe“

Als Spieler
möchte ich mit Tobin auf den Pachthof seines Vaters zurückkehren,
damit auch der Jüngste eine eigene Geschichte bekommt.

**Akzeptanzkriterien:**

**Angenommen** Tobin ist in der Truppe und Mission 1-6 ist gespielt; die Karte ist eine Variante von Erlbach
**Wenn** der Spieler N3 spielt
**Dann** erhält er die Signaturlanze Erbstück (keinen Glutfunken); ist Tobin gefallen, läuft die Gedenk-Variante
**Und** N3 bleibt über Akte offen.

### Story 9.13: Supports und Barks von Akt 1

Als Spieler
möchte ich am Lagerfeuer die Paare von Akt 1 kennenlernen,
damit Beziehungen wachsen.

**Akzeptanzkriterien:**

**Angenommen** die Support-Paare, deren beide Figuren in Akt 1 beitreten (Narrative, Tabelle der 25 Paare)
**Wenn** ihre C- und B-Gespräche geschrieben sind (Schreib-Pipeline der Narrative, DE + EN, ≤ 110 Zeichen je Box)
**Dann** stehen sie am Lagerfeuer bereit, sobald die Punkte reichen
**Und** jeder Akt-1-Gefährte hat seine Barks, Todeszeile und Trauerzeilen je Partner.

### Story 9.14: Akt 1 abstimmen und veröffentlichen

Als Produktinhaber
möchte ich Akt 1 als MVP veröffentlichen und testen,
damit die Kernhypothese geprüft wird.

**Akzeptanzkriterien:**

**Angenommen** alle Stories von Epic 1–9
**Wenn** `pnpm sim --campaign act1` auf allen Schwierigkeiten läuft
**Dann** liegen alle Story-Missionen in den Korridoren (NFR12) und die Spielzeit von Akt 1 passt zu 30–35 Stunden für die Staffel
**Und** Paket `act1` ist `released: true`, `content:lock` ist gelaufen, die Performance-Ziele sind mit Story 7.5 auf einem Referenzgerät gemessen, und ein Playtest-Plan (5–10 Tester, Erfolgskriterien aus dem GDD, dazu die Burg als Heimat und die Gedenksteine) liegt vor (`gds-playtest-plan`).

## Epic 10: Die Burg ausbauen (ab Akt 2)

Spieler bauen die eroberte Paktwacht ab Akt 2 auf 11 Räume in drei Stufen aus, lassen ausgewählte Gefährten per Glutfunke auf einen von zwei Profi-Wegen aufsteigen und geben das Erbe der Gefallenen als Lektion weiter. Quellen: GDD „Rollenklassen“, „Heimat: Lager und Burg“, „Wirtschaft und Ressourcen“ und „Fortschritt“ (`concept/21-gdd/gdd.md`), `concept/25-ux/EXPERIENCE.md`, `DESIGN.md`, Mockups 04, 06 und 08, Architektur §5.3, §5.7, §5.10, §5.11, §8.1, §8.5, §8.7, die Entscheidungen des Produktinhabers vom 2026-10-31 (Verfeinerung Epic 10/11) und die Code-Bestandsaufnahme der Session epic10-castle (`_bmad-output/planning-artifacts/handoff-epic10.md`). Epic 10 hängt an Epic 11: Story 11.1 liefert den Akt-Übergang mit `c.act`, den Stufendeckel `levelCap: 20` für Akt 2 und die festen Ids der Akt-2-Gefährten, Story 11.5 die Akt-2-Quelle von `moonsteel` (`lieutenant.bounty.materialByAct`; das Item existiert schon) und den Inhalt der Händler-Liste mit `roomLevel: 2`, die Missions-Stories von Epic 11 die Akt-2-Gefährten `jory`, `odile`, `nell`, `brann`, `amos`, `ilka` (Raum-Gefährten für Stufe 3). Story 11.1 kommt vor allen Epic-10-Stories (Epic 10 hängt damit an einem Teil von Epic 11, benannt und entkoppelt); was spätere Epic-11-Stories liefern (Raum-Gefährten, Nebel-Karten, Händler-Liste), prüfen die Stories mit Fixture-Spielständen (`c.act = 2`, `c.home.kind = 'castle'`, gesetzte Raumstufen); die Burg oben bleibt bis Story 10.14 das gemalte Bild `paktwacht_ruine`.

**Reihenfolge:** nach Story 11.1: 10.2 → 10.3 → 10.4 (parallel zu 11.2–11.7) → 10.1 → 10.5 → 10.6 → 10.7 → 10.8 → 10.9 → 10.10 → 10.11 → 10.12. Akademie und Profi-Wege kommen zuerst, weil die Abstimmung von Akt 2 (Story 11.22) mit Aufstiegen simuliert; 10.2 bringt deshalb den Raum `academy` selbst mit, 10.1 ergänzt danach Kosten und Bedingungen aller Räume. 10.13 (Anhängeteile) geht jederzeit nach 10.3, 10.14 (Burg-Grafik) erst nach der 3D-Entscheidung des Produktinhabers. Story 11.22 (Abstimmung Akt 2) wartet auf 10.1–10.12, weil diese Stories Gold, EP, Glutfunken und Rabatte von Akt 2 verändern.

**Für alle Stories gilt:** Fertig erst mit grünem `pnpm lint`, `pnpm test`, `pnpm content:check` und `pnpm build`. Jede Handlung ist ein Kampagnen- oder Kampf-Command im Journal, das beim Replay dasselbe Ergebnis liefert; UI und Command rufen dieselbe reine Vorschau-/Kostenfunktion (Architektur §8.1). Spielwerte stehen in YAML (Raumkosten und -bedingungen in `content/core/rooms.yaml`, Stufenwirkungen als Stufen-Arrays in `content/core/balance.yaml`), kein `if (act >= 2)` im Code, kein sichtbarer Text im Code, Beträge immer als Symbol + Zahl. Neue persistierte Felder bekommen einen Default in `normalizeCampaign` (Architektur §8.7). Akt 1 ist veröffentlicht (Story 9.14 mit `pnpm content:lock`): Entfernte oder umbenannte IDs brauchen einen Eintrag `alt: neu` in `content/renames.yaml`, eine geänderte gesperrte ID oder ein geändertes Speicherformat eine Migration in `src/persistence/save.ts` (`migrations`, `renamedId`) mit Fixture-Spielstand aus dem Akt-1-Release (`AGENTS.md`, „Akt-Release“ Schritt 3). Raum-Ausbau: Stufe 2 kostet nur Gold (ab Akt 2), erst Stufe 3 braucht zusätzlich einen der zwei Raum-Gefährten (Produktinhaber 2026-10-31, Readiness-Runde R2). Commands prüfen in der Reihenfolge, in der die Story ihre Fehlercodes aufzählt, und liefern den ersten zutreffenden (Architektur §8.1: Id → Verfügbarkeit → Ressourcen). Sichtbare Änderungen werden mit Screenshots bei 375 × 812 belegt. Neue Entscheidungen gehen in die Decision-Logs unter `concept/`. Werte mit `[ASSUMPTION]` sind abgeleitet und werden per `pnpm sim` geprüft. Audio-Kriterien sind als „später (Audio)“ markiert; bis dahin klingt der vorhandene Bestätigungs-Klang oder nichts.

### Story 10.1: Räume ausbauen

Als Spieler
möchte ich Räume der Paktwacht mit Gold auf Stufe 2 und zusätzlich mit einem ihrer Raum-Gefährten auf Stufe 3 bringen,
damit die Burg neben den Figuren eine zweite Fortschrittsachse ist.

**Abhängigkeiten:** nach 11.1 (`c.act`, Ids der Akt-2-Gefährten in `rooms.yaml`) und 10.2 (Raum `academy`); die Akt-2-Raum-Gefährten treten in den Missions-Stories von Epic 11 bei; Stufe 2/3 der Räume nutzen die Stories 10.2 und 10.6–10.11.

**Akzeptanzkriterien:**

**Angenommen** `roomSchema` in `src/content/schemas.ts` und `RoomDef` in `src/core/defs.ts`
**Wenn** die Story umgesetzt ist
**Dann** trägt jeder Eintrag in `levels` zusätzlich `cost: { gold }` (`z.strictObject({ gold: z.number().int().positive() })`), und das Enum `function` kennt neben `convoy`, `merchant`, `smith`, `healer`, `tavern`, `campfire`, `memorial`, `enchanter` auch `academy`, `workshop`, `training`
**Und** `pnpm content:check` verlangt für jeden Raum mit `homes` ∋ `castle` genau zwei `levels` mit `cost`, Stufe 3 nicht billiger als Stufe 2, und meldet eine `alive`-Id, die in keinem `content/acts/*/units.yaml` steht, als Fehler (Story 11.1 legt die Akt-2-Ids vorher an).

**Angenommen** `content/core/rooms.yaml`
**Wenn** die Story umgesetzt ist
**Dann** stehen dort alle 11 Räume in dieser Reihenfolge (= Anzeige), jeder mit Kosten 1 500 / 4 000 Gold; Stufe 2 verlangt nur Akt 2, Stufe 3 zusätzlich einen der zwei Raum-Gefährten als `any`-Bedingung (einer reicht); die Akt-1-Räume mit `storyCount`-Bedingung bleiben in Akt 2 offen, weil Story 11.1 ihre Bedingung schon um `{ act: 2 }` ergänzt hat:

```yaml
# Vorschlag für content/core/rooms.yaml (Kosten GDD-Annahme 9, Gefährten Produktinhaber 2026-10-31, Gefährte nur für Stufe 3: Readiness-Runde R2)
- { id: convoy,    function: convoy,    icon: convoy,    fromAct: 1, homes: [camp, castle], requires: [],
    levels: [{ cost: { gold: 1500 }, requires: [{ act: 2 }] },
             { cost: { gold: 4000 }, requires: [{ act: 2 }, { any: [{ alive: tobin }, { alive: nell }] }] }] }
# alle weiteren Räume: levels nach dem Muster von convoy, nur die zwei Gefährten wechseln („…“ = Muster)
- { id: merchant,  …, requires: [],                                                         Gefährten fenn | nell }
- { id: smith,     …, requires: [{ any: [{ act: 2 }, { storyCount: { min: 3 } }] }],         Gefährten brenna | grosk }
- { id: healer,    …, requires: [{ any: [{ act: 2 }, { storyCount: { min: 3 } }] }],         Gefährten liora | amos }
- { id: tavern,    …, requires: [{ any: [{ act: 2 }, { storyCount: { min: 3 } }] }],         Gefährten varek | jory }
- { id: campfire,  …, requires: [{ any: [{ act: 2 }, { storyCount: { min: 4 } }] }],         Gefährten jory | brenna }
- { id: memorial,  function: memorial,  icon: stone,     fromAct: 1, homes: [castle], …,    Gefährten liora | amos, unlocks: [{ id: lessons, requires: [{ act: 2 }] }] }
- { id: enchanter, function: enchanter, icon: enchanter, fromAct: 2, homes: [castle], …,    Gefährten ysolde | brann }
- { id: academy,   function: academy,   icon: academy,   fromAct: 2, homes: [castle], …,    Gefährten varek | odile }
- { id: workshop,  function: workshop,  icon: workshop,  fromAct: 2, homes: [castle], …,    Gefährten fenn | brann }
- { id: training,  function: training,  icon: training,  fromAct: 2, homes: [castle], …,    Gefährten mira | ilka }
```

**Und** die Icons `academy`, `workshop`, `training` stehen in `src/ui/icons.tsx`, Namen und Kurztexte als `room.<id>.name|desc` in `de.yaml`/`en.yaml`, Anker der drei neuen Räume in `content/home/home.yaml` (Position auf `paktwacht_ruine` setzt der Entwickler, Abnahme per Screenshot).

**Angenommen** die Heimat ist die Burg (`c.home.kind = 'castle'`), der Raum ist offen (`homeRooms`), hat eine nächste Stufe, alle `requires` dieser Stufe sind erfüllt und `c.gold ≥ cost.gold`
**Wenn** der Spieler `{ type: 'buildRoom', room }` schickt
**Dann** sinkt das Gold um `cost.gold`, `c.home.rooms[room]` wird `roomLevel(c, room) + 1`, und es entstehen die Events `goldChanged` und `roomBuilt { room, level }`
**Und** UI und `validateCampaign` rufen dieselbe reine Funktion `roomBuild(data, c, roomId)` in `src/core/campaign/camp.ts` (liefert nächste Stufe, Kosten, erste offene Bedingung oder Fehler; ersetzt `nextRoomLevel`).

**Angenommen** eine verletzte Vorbedingung
**Wenn** `buildRoom` geprüft wird
**Dann** liefert es genau einen Fehlercode ohne Änderung am Zustand, geprüft in dieser Reihenfolge: `unknown_room` (Id unbekannt oder Raum nicht in dieser Heimat bzw. noch nicht offen), `max_level` (Stufe 3 erreicht), `room_locked` (eine `requires` der Stufe offen, z. B. Akt < 2 oder beim Ausbau auf Stufe 3 kein Raum-Gefährte in der Truppe; im Lager immer), `not_enough_gold`.

**Angenommen** ein Raum auf Stufe 2, dessen Raum-Gefährten beide gefallen sind oder die Truppe verlassen haben (`dead`/`left`)
**Wenn** die Heimat geladen wird
**Dann** bleibt der Raum auf Stufe 2 mit allen Wirkungen dieser Stufe (`roomLevel` liest nur `c.home.rooms`, nie die Gefährten)
**Und** nur der Ausbau auf Stufe 3 ist `room_locked`; ein Raum auf Stufe 1 ohne lebenden Raum-Gefährten lässt sich trotzdem auf Stufe 2 ausbauen (z. B. die Akademie nach E5 `return` und E6 `pardon`); Tests decken Tod und Weggang beider Gefährten vor und nach Stufe 2 ab.

**Angenommen** das Raum-Panel eines Burg-Raums mit nächster Stufe
**Wenn** alle Bedingungen und das Gold reichen
**Dann** steht oben das Ausbau-Band in Grün (`colors.positive`) mit „Ausbauen auf Stufe n“, der Wirkung der nächsten Stufe in einem Satz (`room.<id>.level.<n>`), beim Ausbau auf Stufe 3 dem erfüllten Gefährten („Nell in der Truppe ✓“) und der Taste „Ausbauen · ● 1 500“ (`Amount`); ein Tipp baut aus (Panel öffnen + Tippen = 2 Taps)
**Und** fehlt etwas, bleibt das Band gestrichelt wie seit Story 6.9 und nennt die erste offene Bedingung (`lockReason` kennt jetzt `any` mit `alive`: „Tobin oder Nell in der Truppe“) bzw. zeigt den Betrag rot, wenn nur Gold fehlt; auf Stufe 3 steht statt des Bands „Höchste Stufe“
**Und** das Verhalten entspricht `concept/25-ux/EXPERIENCE.md` (Raumstein, nachgezogen 2026-10-31); Abweichungen gehen in `concept/25-ux/.decision-log.md`.

**Angenommen** die Heimat-Ansicht
**Wenn** ein Raum ausgebaut wurde oder ausgebaut werden kann
**Dann** zeigt sein Raumstein die Stufe als Punkte (`Pips`) und einen grünen Pfeil, solange ein Ausbau jetzt möglich ist (DESIGN `room-stone`), und die Kopfzeile lautet „Räume 11 · n ausbaubar“ (Mockup 04, Variante B)
**Und** auf dem gemalten Bild trägt der Anker des Raums dieselben Punkte und denselben Pfeil; Ausbauteile oben gibt es in dieser Story nicht (Story 10.14)
**Und** ein Toast meldet „Schmied auf Stufe 2 ausgebaut“; Ausbau-Klang später (Audio).

**Angenommen** die Stufenwirkungen, die nur Zahlen sind
**Wenn** ein Raum ausgebaut ist
**Dann** gelten diese Stufen-Arrays aus `balance.yaml` (Index = Stufe − 1), gelesen über je eine Funktion in `camp.ts`, die Panel und Command teilen:

```yaml
# Vorschlag für content/core/balance.yaml (Zahlen GDD „Heimat“)
economy:
  smithMaxUpgrade: [3, 4, 5]                 # existiert
  rerollFromSmithLevel: 3                    # existiert: Affix neu würfeln ab Schmied-Stufe 3
  scarRemoval: { goldByLevel: [2500, 1800, 1200], altItem: seers_herb }   # ersetzt gold: 2500; scarCost(data, c)
  tavern:
    offersByLevel: [3, 4, 4]                 # ersetzt tavernOffersPerChapter; tavernOfferCount(data, c)
supports:
  campfireMaxRank: [B, A, S]                 # existiert; Abnahme der Gespräche in Story 10.8
```

**Und** Tests über `buildRoom` belegen: Schmied Stufe 2 erlaubt +4, Stufe 3 +5 und Neu würfeln; Narbe kostet 2 500 → 1 800 → 1 200 (Seherkraut-Weg unverändert); die nächste Taverne-Runde nach Ausbau auf Stufe 2 bringt 4 Angebote; Lagerfeuer-Deckel B → A → S
**Und** der Hinweis bleibt im Story-Log: +5 kostet `dragon_scale` (Akt 3), Schmied Stufe 3 wirkt in Akt 2 also nur über Neu würfeln.

**Angenommen** die Architektur
**Wenn** die Story fertig ist
**Dann** stimmen §8.1 (Beispiel `buildRoom` mit `roomBuild`, `roomLevel(c, id) + 1`, Prüfreihenfolge) und §5.10 (Kosten und Bedingungen in `rooms.yaml`, Gefährte nur für Stufe 3, Wirkungen als Stufen-Arrays in `balance.yaml`) mit dem Code überein (nachgezogen 2026-10-31; prüfen, Abweichungen ins Architektur-Log)
**Und** der Handbuch-Eintrag `rooms_upgrade` (Kategorie Heimat) nennt Kosten und Gefährten als Verweise auf die Daten, nie abgetippt.

**Angenommen** `tools/simulate.ts` mit der Heimat-Heuristik aus Story 6.8
**Wenn** `pnpm sim --campaign act2` läuft (sobald Epic 11 Akt 2 liefert; vorher mit Fixture-Kampagne in `tests/unit/rooms-build.test.ts`)
**Dann** baut die Heuristik Räume aus, sobald nach dem Ausbau noch das Gold für Narbe und Aufwerten bleibt (Reihenfolge Schmied, Akademie, Heiler, Übungsplatz, Rest `[ASSUMPTION]`), und die Ausgabe zeigt je Mission die gebauten Stufen neben dem Gold
**Und** die Tests decken ab: Ausbau 1 → 2 → 3, jeden Fehlercode, beide Events, Determinismus (zweimal anwenden), Replay über das Journal.

### Story 10.2: Akademie und Aufstieg mit Glutfunke

Als Spieler
möchte ich ausgewählte Gefährten in der Akademie mit einem Glutfunken auf einen Profi-Weg aufsteigen lassen,
damit die knappe Wahl, wer wächst, ein Moment wird.

**Abhängigkeiten:** nach 11.1 (`levelCap: 20`, `c.act`); bringt Raum `academy` und Enum-Wert mit, solange 10.1 fehlt (10.1 ergänzt Kosten und Bedingungen); Stufe 2 und 3 der Akademie sind vor 10.1 mit Fixture `c.home.rooms.academy = 2|3` testbar; die übrigen 10 Profi-Wege liefern 10.3 (Klassen, darunter die von Avatar und Kael) und 10.4 (Wirkungen), bis dahin funktioniert der Aufstieg mit den sechs vorhandenen Profiklassen. Wird die Story zu groß, bei Bedarf Wegwechsel und Zweit-Effekt (Akademie Stufe 2/3) wie 10.9–10.11 abtrennen.

**Akzeptanzkriterien:**

**Angenommen** `content/core/items.yaml`
**Wenn** die Story umgesetzt ist
**Dann** ist der Glutfunke das einzige Aufstiegs-Item: `ember_spark` trägt `use: { promote: true, minLevel: 10 }` (weiter `kind: seal`, `tags: [convoyOnly]`, `price: 3000`), `promotion_seal` ist mit Locales, Bild, `itemInfo.ts`-Eintrag und Handbuch-Verweisen entfernt und steht als `promotion_seal: ember_spark` in `content/renames.yaml` (Akt 1 ist veröffentlicht, die Id ist gesperrt; im MVP ist das Siegel nirgends erhältlich)
**Und** `pnpm content:check` ist mit der gesperrten Id grün; Architektur §5.11 nennt `kind: seal` statt `kind: promotion`.

**Angenommen** ein Spielstand aus dem Akt-1-Release (Speicherformat 2)
**Wenn** er nach dieser Story geladen wird
**Dann** hebt `src/persistence/save.ts` das Speicherformat auf 3 mit einer generischen Migration 2 → 3, die jede Umbenennung aus `content/renames.yaml` über `renamedId` auf alle Item-, Skill- und Klassen-Ids im Spielstand anwendet (Konvoi, Ausrüstung, Taschen, `loadout`, `mastered`, Klassen der Einheiten); spätere Stories ergänzen nur Einträge in `renames.yaml`, keine eigene Migration
**Und** eine Fixture `tests/fixtures/saves/format2-*.json` aus dem Akt-1-Release liegt bei, und `tests/unit/migrations.test.ts` belegt Migration und Umbenennung (`promotion_seal` → `ember_spark`) mit ihr (`AGENTS.md`, „Akt-Release“ Schritt 3).

**Angenommen** `rooms.yaml` mit `{ id: academy, function: academy, icon: academy, fromAct: 2, homes: [castle] }`
**Wenn** Akt 2 erreicht ist und die Heimat die Burg ist
**Dann** steht die Akademie als Raumstein mit Stufe als Punkten unter den Räumen und öffnet ihr Panel; in Akt 1 gibt es sie nicht (nur über `fromAct`, kein `if` im Code).

**Angenommen** eine Figur der Truppe mit Stufe ≥ `balance.levels.promoteFrom` (10), deren Klasse nicht `tier: pro` ist und einen Profi-Weg hat (`promotionTargets` nicht leer; auch `tier: unique` von Avatar und Kael), mindestens ein `ember_spark` im Konvoi und eine offene Akademie (`academyOpen(data, c)` über `homeRooms`)
**Wenn** der Spieler `{ type: 'promote', unit, classId }` schickt
**Dann** wird die Figur Profi der gewählten Klasse (Stufe → 1, EP → 0, `promotionBonus` bis zu den Caps der neuen Klasse), der tatsächlich gutgeschriebene Wertgewinn steht als `promotionGain` am `UnitRecord` (Default `{}`), ein Glutfunke verschwindet aus dem Konvoi, der Loadout fasst 5 statt 4 Skills (`skills.loadoutAdvanced`), Events `itemLost` und `promoted { unit, from, to, gain }`
**Und** Fehler ohne Änderung, in dieser Reihenfolge: `unknown_unit`, `unknown_class` (kein Profi-Weg dieser Klasse), `not_available` (Stufe < 10, schon Profi, Akademie nicht offen), `not_enough_materials` (kein Glutfunke)
**Und** Avatar (`tactician` → `grand_strategist`) und Kael (`captain` → `banner_lord`) steigen genauso auf, sobald Story 10.3 ihre Profiklassen anlegt (vorher Fixture-Klassen im Test): Stufe 10, ein Glutfunke, Akademie, eine Weg-Karte.

**Angenommen** das Panel der Akademie (UX-DR21, Mockup 08 „Akademie · Aufstieg“)
**Wenn** der Spieler es öffnet
**Dann** zeigt es oben den Vorrat an Glutfunken (Item-Bild + Zahl), darunter die Figuren ab Stufe 10 ohne Profi-Klasse, alle anderen gedimmt mit Grund („ab Stufe 10“, „schon aufgestiegen“)
**Und** nach Wahl einer Figur zwei Weg-Karten (Avatar und Kael: eine) mit Name, Wirkung in einem Satz (`class.<id>.effect`), Wertgewinn aus `promotionPreview(data, u, classId)` in `src/core/rules/progression.ts`, die `promote` selbst benutzt („TP +4 · DEF +3 …“; es gelten die Daten, nicht die Beispielzahlen in Mockup 08), und dem Namen des Signaturteils (`part.<classId>.name`, Grafik in Story 10.13)
**Und** die Haupttaste lautet „Aufsteigen · [Glutfunke] 1“; ohne Glutfunken ist sie gesperrt und nennt den Grund; Figur wählen und Weg wählen sind Auswahl, erst die Haupttaste führt aus.

**Angenommen** ein gelungener Aufstieg
**Wenn** `promoted` eintrifft
**Dann** spielt über dem Panel der Funken-Moment (≤ 1,5 s): die Darstellung `.vn-sparks` aus Story 9.9 ist als wiederverwendbare Komponente `src/ui/Sparks.tsx` aus `Dialogue.tsx` herausgelöst (nicht kopiert), mit `prefers-reduced-motion` ein stehendes Glühen
**Und** die Bark-Zeile `ember` der Figur erscheint, falls vorhanden (`hasBark`)
**Und** Funkenknistern später (Audio).

**Angenommen** Truppe und Figur (Story 6.1)
**Wenn** eine Figur aufsteigen kann
**Dann** trägt sie die Marke „Bereit für den Aufstieg“ nur, wenn auch eine Akademie offen ist; die Taste „Aufsteigen“ in der Figur öffnet das Akademie-Panel mit dieser Figur vorgewählt
**Und** die bisherige Aufstiegs-Auswahl in `src/app/screens/Troop.tsx` entfällt (keine zweite Aufstiegs-Oberfläche); in Akt 1 gibt es weder Marke noch Taste
**Und** der Skill-Loadout bleibt in der Figur (`setLoadout`); das Akademie-Panel verlinkt nur dorthin.

**Angenommen** die Akademie auf Stufe 2 und ein Profi mit zwei Wegen seiner Rolle
**Wenn** der Spieler `{ type: 'changeProPath', unit, classId }` mit dem anderen Weg derselben Rolle schickt
**Dann** werden `promotionGain` abgezogen und der `promotionBonus` des neuen Wegs bis zu dessen Caps gutgeschrieben (neuer `promotionGain`; Werte über den neuen Caps werden auf sie gesenkt), die Klasse wechselt, Stufe, EP, Loadout und Ausrüstung bleiben, das Gold sinkt um 1 500, Events `goldChanged` und `proPathChanged { unit, from, to }`
**Und** Fehler ohne Änderung, in dieser Reihenfolge: `unknown_class` (kein anderer Weg derselben Rolle, also auch Avatar und Kael), `not_available` (Akademie < 2, kein Profi, schon den Zweit-Effekt gelernt: Produktinhaber 2026-10-31, Readiness-Runde R1), `not_enough_gold`
**Und** im Panel erscheint bei einem gewählten Profi die zweite Weg-Karte mit „Weg wechseln · ● 1 500“.

**Angenommen** die Akademie auf Stufe 3 und ein Profi, dessen Rolle zwei Wege hat
**Wenn** der Spieler `{ type: 'learnSecondPath', unit }` schickt
**Dann** lernt die Figur für einen weiteren Glutfunken zusätzlich die Wirkung des anderen Profi-Wegs: `secondPath` am `UnitRecord` (Default `null`) nennt die andere Klasse, deren `proSkills` (Stories 10.3 und 10.4) zählen ab sofort in `activeSkillIds`; Klasse, Werte und Wertgewinn bleiben; Events `itemLost`, `secondPathLearned { unit, path }`; der Funken-Moment spielt
**Und** Fehler ohne Änderung: `not_available` (Akademie < 3, kein Profi, schon gelernt, Rolle mit nur einem Weg), `not_enough_materials` (kein Glutfunke)
**Und** die Figur zeigt unter Skills „Auch: <Wirkung des anderen Wegs>“.

```yaml
# Vorschlag für content/core/balance.yaml
academy:
  changePathFromLevel: 2
  changePathGold: 1500          # Produktinhaber 2026-10-31
  secondPathFromLevel: 3
  secondPathSparks: 1           # Produktinhaber 2026-10-31: „für einen weiteren Glutfunken“
```

**Angenommen** `promote`, `changeProPath`, `learnSecondPath`
**Wenn** sie im Journal stehen
**Dann** ergibt das Replay denselben Zustand, und die effektive Stufe zählt sofort mit +15 (`experience.advancedLevelOffset`) für EP, Leutnant-Skalierung und Heimsuchungs-Deckel
**Und** `tests/unit/academy.test.ts` deckt gültigen Aufstieg (Stufe 1, Loadout 5, Glutfunke weg), jeden Fehlercode (auch Akt 1 ohne Akademie), Wechsel mit Rückrechnung bis zu den Caps, zweiten Effekt und Replay ab
**Und** die Heimat-Heuristik in `tools/simulate.ts` lässt bei vorhandenem Glutfunken die Figur mit der höchsten Stufe ≥ 10 auf den ersten Weg aufsteigen (für Story 11.22)
**Und** die Handbuch-Einträge `academy` (Kategorie Heimat, Werte als Verweise auf `balance.levels.promoteFrom`, `balance.skills.loadoutAdvanced`, `balance.academy`) und `ember_spark` verweisen aufeinander.

### Story 10.3: Profi-Klassen und Werte

Als Spieler
möchte ich zwischen zwei klar verschiedenen Profi-Wegen je Rolle wählen,
damit ein Aufstieg die Spielweise ändert.

**Abhängigkeiten:** nach 10.2 (Aufstieg); Steckbriefe nach Story 14.5; Wirkungen, die Vorschau, Reihenfolge oder KI ändern, in Story 10.4 (hier Klassen, Werte, Schema und die Wege, die nur Werte, Waffengruppen, Einsätze oder Radien ändern); Schatten- und Fallensteller-Wirkung in Story 10.5; Brett-Grafik in Story 10.13; Epic 12 braucht `battle_priest` vor Maels Beitritt.

**Akzeptanzkriterien:**

**Angenommen** `classSchema` und `skillSchema` in `src/content/schemas.ts`
**Wenn** die Story umgesetzt ist
**Dann** hat jede Klasse mit `tier: pro` ein Feld `proSkills` (0–2 Skill-Ids mit Präfix `pro_`; Pflicht mit 1–2 für jede spielbare Profiklasse ab Story 10.4) und ein optionales Feld `proPart` (Id des Anhängeteils, Story 10.13); `skill` einer neuen Profiklasse ist der Rollen-Skill ihrer Herkunftsrolle (der Spielmann hat keinen)
**Und** `activeSkillIds` (`src/core/rules/skills.ts`) zählt Rollen-Skill, `proSkills` der Klasse und `proSkills` von `secondPath` (Story 10.2); die PoC-Skills der sechs vorhandenen Profiklassen bleiben bis Story 10.4
**Und** `skillSchema.effect` kennt die neuen Bausteine `addWeaponGroups`, `usesBonus: { <Klassen-Aktion>: n }` (Schlüssel ist die Klassen-Aktion aus `classes.yaml`, z. B. `command`) und `radiusBonus: { <skillId>: n }`; die übrigen Bausteine folgen in Story 10.4; `content:check` prüft, dass jede Profiklasse eine Herkunftsrolle mit passendem `proPaths` und gültige `proSkills` hat.

**Angenommen** `content/core/classes.yaml`
**Wenn** die Story umgesetzt ist
**Dann** stehen dort 16 Profiklassen: die 10 neuen mit diesen Werten (Reihenfolge der Werte hp/str/mag/skl/spd/lck/def/res; Waffengruppen = Rolle, Zusatzgruppen nur über `addWeaponGroups` des Profi-Skills, damit Akademie Stufe 3 sie mitgibt; MOV = Rolle + 1, höchstens 6) und `bard`/`standard_bearer` bis Story 10.4 sowie `shadow`/`trapper` bis Story 10.5 mit `playable: false` (`promotionTargets` filtert nicht spielbare Klassen heraus):

| Klasse | Rolle | Bewegung | base | growth | growthMod | caps | promotionBonus |
|---|---|---|---|---|---|---|---|
| `blade_dancer` | skirmisher | foot 6 | 27/8/1/11/12/5/6/3 | 80/45/5/55/60/30/25/15 | 10/5/0/10/15/5/0/0 | 62/28/15/32/32/30/24/20 | hp3 str1 skl2 spd3 lck1 def1 |
| `ranger` | marksman | foot 6 | 26/8/1/10/9/4/6/3 | 75/45/5/55/50/25/25/15 | 10/5/0/15/10/0/0/0 | 60/28/15/32/30/30/24/20 | hp3 str2 skl2 spd2 def1 res1 |
| `hexer` | elementalist | foot 6 | 24/1/11/8/7/3/2/8 | 65/5/65/45/40/25/15/40 | 5/0/20/5/5/0/0/15 | 55/15/33/30/26/30/20/30 | hp3 mag4 skl1 res2 |
| `battle_priest` | healer | foot 6 | 26/4/8/6/7/6/5/8 | 70/30/45/35/40/45/30/45 | 5/10/5/0/5/5/5/10 | 58/24/28/26/26/30/24/27 | hp4 str3 mag1 def2 res1 |
| `bard` | minstrel | foot 6 | 25/4/5/8/10/7/3/6 | 75/23/35/45/50/40/20/35 | 5/3/5/5/10/10/0/10 | 58/20/22/28/30/33/22/26 | hp3 skl1 spd2 lck2 res2 |
| `standard_bearer` | minstrel | foot 6 | 27/6/3/8/8/6/6/5 | 80/33/30/40/45/35/30/30 | 10/5/0/5/5/5/5/5 | 60/22/20/26/26/30/24/22 | hp4 str2 spd1 def3 res1 |
| `shadow` | scout | foot 6 | 25/8/1/10/12/5/5/3 | 75/45/5/55/55/30/23/15 | 7/5/0/12/13/5/0/0 | 60/27/15/31/31/32/23/20 | hp3 str1 skl2 spd3 lck2 |
| `trapper` | scout | foot 6 | 26/7/1/11/9/4/6/3 | 80/40/5/60/40/25/30/15 | 10/5/0/15/8/0/5/0 | 62/26/15/32/28/30/24/20 | hp4 str1 skl3 spd1 def2 |
| `grand_strategist` | tactician | foot 6 | 27/7/7/8/8/6/6/6 | 80/45/45/50/45/40/35/35 | 5/5/5/5/5/5/5/5 | 62/28/28/30/29/30/26/26 | hp3 str1 mag2 skl2 spd1 def1 res1 |
| `banner_lord` | captain | foot 6 | 30/9/2/9/9/6/9/4 | 90/50/10/45/45/35/45/25 | 15/5/0/5/5/5/10/0 | 68/31/15/29/28/30/30/21 | hp4 str2 skl1 spd1 def3 res1 |

`[ASSUMPTION]` Werte nach dem Muster der sechs vorhandenen Profiklassen (Lückenanalyse §3.8), per Sim zu prüfen.
**Und** die sechs vorhandenen Profiklassen sind angeglichen: `bulwark` und `breaker` `moveType: armored`, `mov: 5` (Vorkämpfer gepanzert 4 + 1); Werte und `promotionBonus` bleiben, ihre Skills stellt Story 10.4 um
**Und** Namen, Kurztext und Wirkungssatz stehen als `class.<id>.name|desc|effect` in `de.yaml`/`en.yaml`; der Kopfkommentar von `classes.yaml` nennt Epic 10 statt Epic 6.

**Angenommen** die Profi-Skills der Wege, die nur Werte, Waffengruppen, Einsätze oder Radien ändern (`content/core/skills.yaml`, `source: class`)
**Wenn** eine aufgestiegene Figur handelt oder angegriffen wird
**Dann** gilt genau diese Wirkung im Kampf, in der Kampfvorschau, in der Gegner-KI (Worker) und in der Simulation:

| Klasse | `proSkills` | Wirkung |
|---|---|---|
| Klingentänzer | `pro_blade_dance` | `avoidBonus: 15`, `critBonus: 10` |
| Waldläufer | `pro_woodsman` | `terrainCost: { forest: 1 }`, `addWeaponGroups: [sword]` |
| Hexer | `pro_hex` | `statusChanceBonus: 20`, `addWeaponGroups: [dark]`; zusammen mit dem Rollen-Skill `elemental_focus` +40 (per Sim prüfen) |
| Kampfpriester | `pro_battle_faith` | `addWeaponGroups: [axe]`: führt Stab, Licht und Axt (der Hammer ist eine Axt) |
| Großstratege | `pro_grand_command` | `usesBonus: { command: 1 }`: Befehl 2×/Karte (die Einsätze hängen an der Klassen-Aktion `command`, nicht an der Skill-Id `tactician_command`) |
| Bannerherr | `pro_banner_lord` | `radiusBonus: { rally: 1 }`: Sammelruf Radius 3 |

**Und** jede Wirkung steht als Daten im Skill, kein `if (classId === …)`; Waffenwahl, Befehl-Einsätze und Sammelruf-Fläche zeigen Ausrüsten und Vorschau über dieselben Funktionen wie die Auflösung, Unit-Tests belegen das je Wirkung.

**Angenommen** das Akademie-Panel und das Handbuch
**Wenn** die Story fertig ist
**Dann** zeigt die Akademie je Rolle beide Wege mit Wirkungssatz und Wertgewinn (Barde und Bannerträger bis Story 10.4, Späher-Wege bis Story 10.5 gesperrt mit Grund „folgt“)
**Und** jede spielbare Profiklasse hat einen Steckbrief `class_<id>` nach Story 14.5 (Wirkung, Werte aus den Daten, Verweis auf die Rolle, `content:check` verlangt ihn); der Eintrag der Rolle verweist auf beide Wege.

**Angenommen** `tools/simulate.ts`
**Wenn** `pnpm sim <mapId> --runs 50 --promote a|b` läuft
**Dann** steigen vor der Mission alle Figuren ab Stufe 10 auf den ersten (`a`) bzw. zweiten (`b`) Weg auf, und die Ausgabe nennt Siegquote und Niedergestreckte je Option; die endgültigen Korridore prüft Story 11.22
**Und** `pnpm test:coverage` senkt die Coverage von `src/core` nicht.

### Story 10.4: Wirkungen der Profi-Wege

Als Spieler
möchte ich, dass Schutz, Rückstoß, Konter zuerst, Flächen und Anfeuern der Profi-Wege in Vorschau, Kampf und KI gleich wirken,
damit ich jede Profi-Wirkung vor dem Zug richtig einschätzen kann.

**Abhängigkeiten:** nach 10.3 (Schema, Klassen) und 10.2 (Migration auf Format 3 für die Umbenennungen); Reichweiten-Kacheln aus Epic 13; Story 11.20 nutzt das Anfeuern auf zwei Ziele (`cheerTargets`) für die Laute `final_curtain`.

**Akzeptanzkriterien:**

**Angenommen** `skillSchema` und die Profiklassen
**Wenn** die Story umgesetzt ist
**Dann** kennt `skillSchema.effect` die neuen Bausteine `guardNeighbors`, `statusOnHit: { status, chance }`, `rangeCap`, `castRadius`, `healRadius`, `cheerRange`, `cheerTargets`, `ignoreGrief`; `proSkills` ist für jede spielbare Profiklasse Pflicht (1–2), und `bard` und `standard_bearer` sind `playable: true`
**Und** die sechs vorhandenen Profiklassen tragen als `skill` den Rollen-Skill (`duelist` `counter_instinct`, `bulwark`/`breaker` `phalanx`, `sharpshooter` `eagle_eye`, `sage` `elemental_focus`, `bishop` `blessing`) und ihre `proSkills` aus der Tabelle; der PoC-Klassen-Skill `climber` entfällt nur am Sturmbrecher (Späher und Brigand behalten ihn)
**Und** die PoC-Skills `sol`, `impale`, `longshot` sind aus `skills.yaml` gelöscht und stehen in `content/renames.yaml` als `sol: pro_duel`, `impale: pro_guard`, `longshot: pro_far_shot` (Akt 1 ist veröffentlicht, die Ids sind gesperrt); `pnpm content:check` ist grün; Spielstände übernehmen die Umbenennung über die generische Migration aus Story 10.2 (Format 3), diese Story legt keine eigene Migration an, sondern nur die drei Einträge und einen Testfall in `tests/unit/migrations.test.ts` (Fixture-Stand mit `sol`, `impale`, `longshot` in `loadout`/`mastered` → `pro_duel`, `pro_guard`, `pro_far_shot`).

**Angenommen** die übrigen Profi-Skills in `content/core/skills.yaml` (`source: class`)
**Wenn** eine aufgestiegene Figur handelt oder angegriffen wird
**Dann** gilt genau diese Wirkung im Kampf, in der Kampfvorschau, in der Gegner-KI (Worker) und in der Simulation:

| Klasse | `proSkills` | Wirkung |
|---|---|---|
| Bollwerk | `pro_guard` | `guardNeighbors: 10`: jeder Nachbar des Bollwerks hat 10 % Schutz durch das Bollwerk, auch ohne Support; zusammen mit dem Support-Schutz (`supports.guardChance` A 20 / S 30) höchstens 30 % (`supports.guardMaxTotal: 30`, neu); ein Wurf aus dem Seed-RNG gegen die Summe, es schützt das Bollwerk, sonst der Support-Partner `[ASSUMPTION]` |
| Sturmbrecher | `pro_knockback` | `on_hit`, `statusOnHit: { status: knockback, chance: 100 }`: jeder Treffer (auch im Konter) stößt das Ziel 1 Feld weg (Regeln des Status `knockback`, blockiert = `status.knockbackBlockedDamage`) |
| Duellant | `pro_duel` | `on_defend`, `strikeFirst: true`: sein Konter schlägt vor dem Angriff zu |
| Scharfschütze | `pro_far_shot` | mit Bogen `rangeBonus: 1`, `rangeCap: 4`: Gesamtreichweite inklusive Zielen höchstens 4 |
| Weiser | `pro_wide_cast` | `castRadius: 1`: Wirken legt das Elementfeld auf das Zielfeld und alle Felder im Manhattan-Radius 1, auf denen es nach Story 2.5 entstehen darf |
| Bischof | `pro_wide_heal` | `healRadius: 1`: Stab-Heilen heilt auch alle Verbündeten neben dem Ziel um denselben Betrag; EP 12 + `experience.healExtraTarget` (3) je weiterem Ziel |
| Barde | `pro_song` | `cheerRange: 2`, `cheerTargets: 2`: Anfeuern (`classActions.cheer`) erreicht Verbündete im Abstand bis 2; nach dem ersten Ziel optional ein zweites, „Fertig“ beendet nach einem |
| Bannerträger | `pro_banner` | `aura: { radius: 1 }` mit `ignoreGrief: true` und `avoidBonus: 5`: Nachbarn ignorieren Trauer (`griefHitPenalty`) und erhalten +5 Ausweichen, der Träger selbst nicht (Produktinhaber 2026-10-31, Readiness-Runde R1) |
| Schatten | `pro_shadow` | Story 10.5 |
| Fallensteller | `pro_traps` | Story 10.5 |

**Und** jede Wirkung steht als Daten im Skill, kein `if (classId === …)`
**Und** `addAuras` (`src/core/rules/skills.ts`) überträgt neben `effect.stats` zusätzlich `avoidBonus`, `hitBonus` und `ignoreGrief` an die Figuren im Radius (Bannerträger, Lektion `heritage_cheer` aus Story 10.7); die Kampfvorschau zeigt sie über dieselbe Funktion wie die Auflösung, ein Unit-Test belegt Vorschau = Auflösung für alle drei
**Und** `cheerTargets` ist die einzige Mechanik für Anfeuern auf mehrere Ziele; auch die Laute `final_curtain` (Story 11.20) nutzt sie über `grantsSkill`. Treffen mehrere Quellen zusammen, gelten höchstens 2 Ziele und die größte Reichweite, nichts addiert sich `[ASSUMPTION]`.

**Angenommen** eine Wirkung, die eine Zahl, eine Reihenfolge oder eine Fläche ändert
**Wenn** der Spieler sie vorbereitet
**Dann** zeigt die Vorschau sie über dieselbe Funktion wie die Auflösung (`forecast`, `previewAction`, `castArea`): Schutzchance in der Kampfvorschau, Schlagreihenfolge des Duellanten, Rückstoß-Pfeil mit Zielfeld, Reichweiten-Kacheln (Epic 13), Wirken- und Heilfläche als Kacheln, mögliche Anfeuern-Ziele
**Und** Unit-Tests zeigen je Wirkung Vorschau = Auflösung auf einer Fixture-Karte.

**Angenommen** die Gegner-KI (`src/core/ai/*`)
**Wenn** sie Züge bewertet
**Dann** rechnet sie mit denselben Funktionen: Schutz und Konter zuerst erhöhen das Risiko eines Angriffs (`counterWeight`), Rückstoß und Reichweite gelten regelkonform, und Worker und synchroner Fallback liefern identische Ergebnisse (Architektur §8.5).

**Angenommen** die Story ist fertig
**Wenn** geprüft wird
**Dann** misst `pnpm sim <mapId> --runs 50 --promote a|b` (Story 10.3) auch die Wirkungen dieser Story; Barde und Bannerträger haben Steckbriefe `class_bard`/`class_standard_bearer` nach Story 14.5 und sind in der Akademie wählbar
**Und** `pnpm test:coverage` senkt die Coverage von `src/core` nicht.

### Story 10.5: Fallensteller und Schatten

Als Spieler
möchte ich mit Späher-Profis Fallen legen oder für Gegner unsichtbar bleiben,
damit Späher im späten Spiel eine eigene Taktik haben.

**Abhängigkeiten:** nach 10.3 (Klassen `shadow`/`trapper`) und 10.4 (`proSkills` Pflicht); Bereichskacheln aus Epic 13; Karten mit Nebel aus Epic 11 (bis dahin Fixture-Karten mit und ohne Nebel); Story 10.6 nutzt die Fallen-Logik für das Fallen-Set.

**Akzeptanzkriterien:**

**Angenommen** `classes.yaml` mit `shadow` und `trapper`
**Wenn** die Story umgesetzt ist
**Dann** sind beide `playable: true` mit `proSkills` `pro_shadow` (`hidden: true`) bzw. `pro_traps` (`grantAction: trap`), behalten Kletterer, Öffnen/Stehlen und +2 Sicht der Rolle, und ihre Steckbriefe `class_shadow`/`class_trapper` beschreiben die Regeln unten
**Und** die neuen Werte stehen in `balance.yaml`:

```yaml
# Vorschlag für content/core/balance.yaml (Werte GDD und Produktinhaber 2026-10-31)
classActions:
  trap: { range: 1, max: 2, damage: 8, status: slowed }   # Verlangsamt: status.slowMovPenalty, status.durationRounds
shadow:
  revealDistance: 3     # ohne Nebel sichtbar, sobald ein Gegner näher als 3 Felder steht (Manhattan-Abstand ≤ 2)
```

**Angenommen** ein Fallensteller mit Aktion
**Wenn** er `{ type: 'trap', unit, at }` auf ein Nachbarfeld wählt, das frei (keine Einheit, kein Objekt, keine Falle) und zu Fuß begehbar ist
**Dann** liegt dort eine Falle in `BattleState.traps: Array<{ id, at, owner, source: 'class' | 'item', seq }>` (Default `[]`), die Aktion des Zugs ist verbraucht (Klassen-Aktion), Event `trapSet`
**Und** liegen schon 2 Fallen mit `source: 'class'` dieses Fallenstellers, ersetzt die neue die älteste (kleinste `seq`, Event `trapRemoved`)
**Und** Fallen bleiben bis Missionsende.

**Angenommen** eine Einheit des Teams `enemy` bewegt sich
**Wenn** ihr Weg ein Feld mit Falle betritt
**Dann** endet die Bewegung auf diesem Feld, sie nimmt 8 Schaden (ohne Zufall; 0 TP nach den normalen Regeln, Leutnants fliehen) und erhält Verlangsamt, die Falle verschwindet, Event `trapTriggered { trap, unit, damage }`
**Und** die KI entscheidet vom Fallenfeld aus neu, ohne weitere Bewegung (angreifen, wenn ein Ziel in Reichweite ist, sonst warten) `[ASSUMPTION]`
**Und** eigene und verbündete Einheiten (`player`, `other`) lösen keine Falle aus und laufen über sie hinweg.

**Angenommen** ein Fallensteller neben einer eigenen Falle
**Wenn** er `{ type: 'disarm', unit, at }` wählt
**Dann** nimmt er diese Falle zurück (Event `trapRemoved`), die Aktion des Zugs ist verbraucht `[ASSUMPTION]`
**Und** Fallen anderer Figuren und Karten-Fallen gibt es in dieser Story nicht.

**Angenommen** ein Schatten auf dem Brett
**Wenn** ein Gegner (KI) eine Entscheidung trifft
**Dann** ist der Schatten für ihn unsichtbar, wenn die Karte Nebel hat (`maps.<id>.fog`), oder, auf Karten ohne Nebel, solange kein Gegner näher als 3 Felder steht; geprüft wird mit den aktuellen Positionen vor jeder einzelnen Gegner-Entscheidung
**Und** nach einem eigenen Angriff des Schattens ist er sichtbar bis zum Ende der nächsten Gegnerphase (`BattleUnit.revealedUntil`, Default `null`); Konter enthüllen ihn nicht (Produktinhaber 2026-10-31, Readiness-Runde R1)
**Und** ein unsichtbarer Schatten ist für die KI kein Ziel und keine Gefahr; ihre Wegsuche plant, als wäre sein Feld frei; führt der gewählte Weg über sein Feld, endet ihre Bewegung auf dem letzten freien Feld davor, ohne dass sie ihn erkennt (keine unsichtbare Sperre; Produktinhaber 2026-10-31, Readiness-Runde R1).

**Angenommen** die Gegner-KI (Gegnerphase, Gefahrenzone, Autoplay der Gegnerseite)
**Wenn** sie den Zustand liest
**Dann** liest sie nur über die reine Funktion `enemyView(data, s, enemyUid)` in `src/core/ai/`: ohne Fallen, ohne unsichtbare Schatten; der Nebel der Spielerseite bleibt unverändert (die KI sieht sonst weiter alles)
**Und** der Worker bekommt den vollen Zustand und wendet denselben Filter an; Worker und synchroner Fallback, Replay (Start + Command-Log), „Runde neu“ und `pnpm sim` liefern identische Ergebnisse; Fallen und Sichtbarkeit liegen vollständig im `BattleState` (Plain-JSON).

**Angenommen** die Spielerseite
**Wenn** Fallen liegen oder ein Schatten verborgen ist
**Dann** sieht der Spieler seine Fallen als Markierung auf Feldhöhe (Aussehen in `render.yaml`), am Aktions-Stein des Fallenstellers die Zahl gelegter Fallen („1/2“) und im Fallen-Modus die gültigen Felder als Bereichskacheln (Story 13.2)
**Und** ein verborgener Schatten trägt in der DOM-Ebene der Lebensleisten das Zeichen „verborgen“, das beim Enthüllen verschwindet; Einheiten-Infos der Gegner erwähnen keine Fallen; die Gefahrenzone rechnet mit `enemyView`
**Und** das Auslösen zeigt einen Effekt ≤ 600 ms nach Art Direction §8; Fallen-Klang später (Audio).

**Angenommen** `src/core/ai/autoplay.ts` für die Spielerseite der Simulation
**Wenn** ein Fallensteller am Zug ist und kein Angriff lohnt
**Dann** legt er eine Falle auf das freie Nachbarfeld mit dem kleinsten Abstand zum nächsten Gegner (Gleichstand: kleinste Feld-Id), damit `pnpm sim` die Klasse misst; die Ausgabe zählt ausgelöste Fallen
**Und** `tests/unit/traps-shadow.test.ts` deckt ab: Legen, dritte ersetzt die älteste, Auslösen (Bewegung endet, 8 Schaden, Verlangsamt), nur Gegner lösen aus, KI läuft hinein, Zurücknehmen, Schatten im Nebel trotz Nachbar unsichtbar, ohne Nebel ab Abstand ≤ 2 sichtbar, nach Angriff bis Ende der nächsten Gegnerphase sichtbar, Konter enthüllt nicht, KI-Weg über das Schattenfeld endet davor, Worker = synchron, Replay, „Runde neu“
**Und** Architektur §5.7 („Stand“) beschreibt Fallen, Gegner-Sicht und Schatten.

### Story 10.6: Verzauberer und Werkstatt

Als Spieler
möchte ich Runen verschmelzen und Verbrauchsgüter aus Material herstellen,
damit Material aus Kopfgeld und Heimsuchungen einen Zweck hat.

**Abhängigkeiten:** nach 10.1 (Raum `workshop`, `buildRoom`) und 10.5 (Fallen-Logik); `moonsteel` existiert schon als Item, seine Akt-2-Quelle (`materialByAct`, Heimsuchungs-Truhen) liefern Story 11.5 und 11.7; Item-Bilder nach `concept/23-art-direction/licensing.md` §6.

**Akzeptanzkriterien:**

**Angenommen** der Verzauberer der Burg auf Stufe n (`economy.enchanterMergeMaxTier: [1, 2, 3]`, gelesen über `runeMergeLimit(data, c)` in `camp.ts`)
**Wenn** der Spieler Runen verschmilzt
**Dann** ist Verschmelzen zur Stufe N + 1 nur erlaubt, wenn N + 1 ≤ Grenze (Stufe 1: kein Verschmelzen, Stufe 2: bis Rune II, Stufe 3: bis Rune III); sonst Fehler `room_locked` und die Taste ist gedimmt mit „ab Verzauberer Stufe n“
**Und** Einsetzen (`insertRune`) und Ausbauen (`removeRune`) jeder Rune gehen auf jeder Stufe (eine Erd-Rune III aus N5 ist sofort nutzbar)
**Und** die Verschmelzen-Taste nennt die Kosten aus `runeMerge()`: 3 × Rune der Stufe N und ● 200 × N (`economy.runeMerge`, existiert).

**Angenommen** Akt 1
**Wenn** der Spieler Runen findet
**Dann** gibt es keinen Ort zum Einsetzen (Verzauberer `fromAct: 2`, keine Code-Änderung), und der Handbuch-Eintrag `runes` sagt: in Akt 1 nur Beute, Einsetzen ab Akt 2 beim Verzauberer, Verschmelzen je Verzauberer-Stufe.

**Angenommen** `content/core/recipes.yaml` mit Schema `recipeSchema` (`{ id, item, roomLevel: 1–3, materials: Record<materialId, int ≥ 1>, gold: int ≥ 0 = 0 }`), Typ `RecipeDef`, geladen als `GameData.recipes` (`src/content/load.ts`)
**Wenn** `pnpm content:check` läuft
**Dann** prüft es: Ids eindeutig, `item` existiert in `items.yaml` oder `runes.yaml`, jedes Material hat `kind: material` und ein Bild
**Und** die Datei enthält diese Rezepte `[ASSUMPTION]` (Materialwert = Preis in `items.yaml`; der Wert aus Material und Gold liegt bei 60–100 % des Kaufpreises: Verbrauchsgüter des Händlers 60–80 %, reine Werkstatt-Items ≈ 80 %, Runen I ≈ 100 %; kein Arkanstaub, er hat keine Quelle; Story 11.22 prüft die Spanne in der Abstimmung):

```yaml
# Vorschlag für content/core/recipes.yaml
- { id: fire_bomb,      item: fire_bomb,     roomLevel: 1, materials: { iron_ore: 2 }, gold: 100 }
- { id: door_key,       item: door_key,      roomLevel: 1, materials: { iron_ore: 1 }, gold: 50 }
- { id: haste_scroll,   item: haste_scroll,  roomLevel: 2, materials: { moonsteel: 1 }, gold: 200 }
- { id: strong_remedy,  item: strong_remedy, roomLevel: 2, materials: { moonsteel: 1 } }
- { id: trap_kit,       item: trap_kit,      roomLevel: 3, materials: { moonsteel: 1, iron_ore: 1 }, gold: 0 }   # 500 von 600 = 83 %
- { id: fire_rune_1,    item: fire_rune_1,   roomLevel: 3, materials: { moonsteel: 1 } }
- { id: wind_rune_1,    item: wind_rune_1,   roomLevel: 3, materials: { moonsteel: 1 } }
- { id: earth_rune_1,   item: earth_rune_1,  roomLevel: 3, materials: { moonsteel: 1 } }
- { id: water_rune_1,   item: water_rune_1,  roomLevel: 3, materials: { moonsteel: 1 } }
- { id: light_rune_1,   item: light_rune_1,  roomLevel: 3, materials: { moonsteel: 1 }, gold: 200 }   # Kaufpreis 600; Dunkel bleibt Beute
```

**Angenommen** ein Rezept, dessen `roomLevel` die Werkstatt erreicht, genug Material und Gold und Platz im Konvoi (`economy.convoySize`)
**Wenn** der Spieler `{ type: 'craft', recipe }` schickt
**Dann** sinken Material und Gold, das Item liegt neu im Konvoi (`newItem`), Events `materialChanged`, `goldChanged` (nur bei Gold > 0), `itemGained`; UI und Command rufen `craftCost(data, c, recipeId)`
**Und** Fehler ohne Änderung: `unknown_item` (Rezept unbekannt), `room_locked` (Werkstatt nicht offen oder Stufe zu niedrig), `not_enough_materials`, `not_enough_gold`, `convoy_full`.

**Angenommen** das Panel der Werkstatt
**Wenn** der Spieler es öffnet
**Dann** listet es die Rezepte im Listen-Muster des Händlers (EXPERIENCE Z. 45): Item-Bild, Name, Info-Stein (`ItemInfoButton`), Kosten als Material-Bild + Zahl und ● + Zahl (fehlende Menge rot), Bestand im Konvoi; Rezepte höherer Stufen gedimmt mit „ab Werkstatt Stufe n“
**Und** Rezept wählen (1), Haupttaste „Herstellen · …“ mit den Kosten (2); Styles in einer eigenen CSS-Datei neben `WorkshopRoom`.

**Angenommen** `content/core/items.yaml`
**Wenn** die Story umgesetzt ist
**Dann** gibt es zwei neue Items, beide nur aus der Werkstatt (`tags: [craftOnly]`, `content:check` verbietet sie in Händler-Listen):

```yaml
# Vorschlag für content/core/items.yaml
- { id: strong_remedy, kind: consumable, slot: bag, use: { cureStatus: true, statusImmuneRounds: 1 }, charges: 2, refillAfterMission: true, wt: 0, rarity: rare, price: 500, tags: [craftOnly] }
- { id: trap_kit,      kind: consumable, slot: bag, use: { trap: true, rng: [1, 1] }, charges: 1, wt: 0, rarity: rare, price: 600, tags: [craftOnly] }
```

`[ASSUMPTION]` Ladungen und Preise; Starkes Gegengift „heilt alle Zustände, 1 Runde immun“ ist Entscheidung des Produktinhabers.
**Und** Starkes Gegengift entfernt alle Zustände der Zielfigur (eigene oder Nachbar wie `remedy_salve`) und macht sie bis zum Ende der laufenden Runde (einschließlich der folgenden Gegnerphase) immun gegen neue Zustände; die Kampf-Info zeigt „immun“
**Und** das Fallen-Set legt mit der Aktion „Benutzen“ eine Falle auf ein freies, begehbares Nachbarfeld mit denselben Regeln und Werten wie Story 10.5 (`classActions.trap`: 8 Schaden + Verlangsamt, nur Gegner lösen aus, für Gegner unsichtbar, bis Missionsende), `source: 'item'`; jede Figur kann es nutzen, und es zählt nicht gegen die 2 Fallen des Fallenstellers.

**Angenommen** die neuen Items
**Wenn** `pnpm content:check` läuft
**Dann** haben `strong_remedy` und `trap_kit` Namen und Beschreibung in `de/en.items.yaml` und ein gemaltes Bild unter `art/items/` (ChatGPT über Claude in Chrome, Prompt und Abnahme in `art/prompts/strong_remedy.md` bzw. `trap_kit.md`, Auflagen `licensing.md` §6 A1–A14; vor `pnpm art:build` erst `git lfs pull`); ohne Bild scheitert die Prüfung.

**Angenommen** `tools/simulate.ts` und die Tests
**Wenn** die Story fertig ist
**Dann** stellt die Heimat-Heuristik Feuerbomben her, sobald mehr als 4 `iron_ore` übrig sind `[ASSUMPTION]`, und die Kettensimulation zeigt die Materialkurve je Mission
**Und** `tests/unit/workshop.test.ts` deckt ab: Verschmelzen je Verzauberer-Stufe, Einsetzen jeder Stufe auf Stufe 1, `craft` gültig und jeder Fehlercode, Starkes Gegengift (Zustände weg, Immunität endet nach der Gegnerphase), Fallen-Set (zusätzlich zu 2 Fallen des Fallenstellers), Replay, `content:check` mit fehlendem Item/Material
**Und** die Handbuch-Einträge `runes` und `workshop` (Kategorie Heimat) nennen Werte als Verweise.

### Story 10.7: Lektionen der Gedächtnishalle

Als Spieler
möchte ich einmal je Akt das Erbe eines Gefallenen als Lektion an einen Gefährten weitergeben,
damit Verlust Bedeutung behält.

**Abhängigkeiten:** Gedächtnishalle und Gedenksteine aus Story 6.9; Stufen über `buildRoom` (10.1, vorher Fixture); `c.act` aus Story 11.1; Begriffstrennung zu den Regel-Lektionen aus Story 14.7; `heritage_cheer` (Aura mit Trefferbonus) nach 10.4 (`addAuras` überträgt `hitBonus`).

**Akzeptanzkriterien:**

**Angenommen** die Begriffe
**Wenn** Code und Daten entstehen
**Dann** heißen alle Bezeichner `heritage` (Skill-`source: heritage`, Skill-Ids `heritage_*`, Datei `content/core/heritage.yaml`, Command `inheritHeritage`, Event `heritageInherited`, Felder `heritage`/`heritageGiven`), weil `legacy` im Code schon belegt ist (IndexedDB-Store `legacy` für PoC-Stände, `legacyIds` in `classes.yaml`); sichtbar heißt es „Lektion“; die Handbuch-Kategorie `lessons` (Regel-Lektionen, Story 14.7) bleibt unberührt.

**Angenommen** `content/core/skills.yaml` und `content/core/heritage.yaml` (`- { role, lessons: [erste, zweite] }`, die erste ist die feste Lektion)
**Wenn** `pnpm content:check` läuft
**Dann** hat jede der 7 Kernrollen genau zwei Lektionen, jede ist ein gültiger passiver Skill mit `source: heritage` und Namen/Text DE/EN; Gerrits Stein in `content/acts/act1/memorials.yaml` trägt `heritage: heritage_shield_wall`
**Und** die Lektionen sind `[ASSUMPTION]` (etwa halb so stark wie persönliche Skills, nur vorhandene Bausteine samt der Aura-Übertragung von `hitBonus` aus Story 10.4, Lückenanalyse §3.7):

| Rolle | Lektion 1 (fest) | Lektion 2 |
|---|---|---|
| Vorkämpfer | `heritage_shield_wall` „Schildwall“: +2 VER mit ≥ 1 Nachbarn | `heritage_tough` „Zäh“: +3 TP |
| Plänkler | `heritage_quick_blade` „Schnelle Klinge“: +5 Krit | `heritage_nimble` „Leichtfüßig“: +5 Ausweichen |
| Schütze | `heritage_steady_hand` „Ruhige Hand“: +5 Treffer | `heritage_far_aim` „Weiter Blick“: +1 Schaden ab Abstand 2 |
| Elementarist | `heritage_ember_sense` „Glutgespür“: +10 Statuschance | `heritage_focus` „Sammlung“: +1 MAG |
| Heiler | `heritage_gentle_hands` „Sanfte Hände“: +3 Heilung | `heritage_prayer` „Gebet“: +2 WID |
| Späher | `heritage_light_step` „Leichter Schritt“: Wald kostet 1 | `heritage_cover` „Deckung“: +10 Ausweichen im Wald |
| Spielmann | `heritage_luck` „Glück“: +3 GLK | `heritage_cheer` „Zuruf“: Nachbarn +5 Treffer (`aura: { radius: 1 }`) |

**Angenommen** Akt 2 ist erreicht (`unlocks: [{ id: lessons, requires: [{ act: 2 }] }]` im Raum `memorial`)
**Wenn** der Spieler `{ type: 'inheritHeritage', from, to, skill }` schickt
**Dann** gilt: `from` ist ein Gedenkstein (gefallener Gefährte oder Söldner aus `c.fallen` mit `classId`, oder ein fester Stein mit `heritage` wie Gerrit), der noch nie vererbt hat; `to` ist ein lebender Story-Gefährte der Truppe einschließlich Avatar und Kael, kein Söldner, ohne Lektion; in `c.heritageGiven` gibt es für `c.act` noch keinen Eintrag
**Und** erlaubt ist je Stufe der Gedächtnishalle: Stufe 1 die feste Lektion der Rolle des Gefallenen (Gerrit: seine), Stufe 2 eine der zwei Lektionen seiner Rolle (Gerrit: nur seine), Stufe 3 jede der 14 Lektionen (auch bei Gerrit `[ASSUMPTION]`)
**Und** danach trägt der Empfänger `heritage: { skill, from }` am `UnitRecord` (Default `null`), `c.heritageGiven` (Default `[]`) bekommt `{ act, from, to, skill }`, Event `heritageInherited`
**Und** Fehler ohne Änderung, in dieser Reihenfolge: `unknown_unit` (Empfänger nicht in der Truppe oder Söldner), `not_available` (Akt < 2, in diesem Akt schon vererbt, Stein hat schon vererbt, Stein ohne Rolle, Empfänger hat schon eine Lektion), `unknown_choice` (Lektion auf dieser Stufe nicht erlaubt).

```yaml
# Vorschlag für content/core/balance.yaml (Produktinhaber 2026-10-31)
memorial:
  heritagePerAct: 1
  heritageChoiceByLevel: [fixed, role, all]
```

**Angenommen** eine Figur mit Lektion
**Wenn** sie kämpft
**Dann** wirkt die Lektion immer wie ein passiver Skill (`activeSkillIds`), ohne Loadout-Platz, in Kampf, Vorschau, KI und Simulation
**Und** die Figur zeigt sie unter Skills mit Herkunft („Lektion · von Fenn“); fällt die Figur, geht die Lektion mit ihr.

**Angenommen** das Panel der Gedächtnishalle (UX-DR11, Mockup 04 „Gedächtnishalle“)
**Wenn** in diesem Akt noch nicht vererbt wurde
**Dann** wählt der Spieler einen Stein (1), darunter steht „Lektion vererben: Fenns ‚Leichter Schritt‘ an …“ mit Lektionswahl (nur ab Stufe 2) und Empfängerliste (2), dann die ruhige Taste „Lektion vererben“ (3); oben „1× in Akt 2“
**Und** ist in diesem Akt schon vererbt, steht dort „In Akt 2 vergeben: Fenn → Tobin“, die Steine bleiben; ein Stein, der vererbt hat, trägt eine kleine Glutmarke
**Und** der Stil bleibt Gedenken: entsättigt bis auf Glutorange, keine Bewegung außer langsamem Ausblenden; Klang später (Audio).

**Angenommen** ein Akt-Wechsel oder ein alter Spielstand
**Wenn** die Kampagne geladen wird
**Dann** ist das Vererben eines Akts nicht nachholbar (es zählt nur `c.act`), Lektionen bleiben über Akte erhalten, Gefallene aller Akte zählen als Steine, und Spielstände ohne die neuen Felder laden mit Defaults
**Und** `tests/unit/heritage.test.ts` deckt ab: jede Stufe (fest, Rolle, alle), Gerrit, Söldner-Stein, Avatar als Empfänger, Söldner als Empfänger abgelehnt, zweite Lektion abgelehnt, zweites Vererben im Akt abgelehnt, Wirkung im Kampf (Vorschau = Auflösung), Replay
**Und** der Handbuch-Eintrag `heritage` (Kategorie Heimat, `fromAct: 2`) erklärt Lektionen; Architektur §5.10/§5.11 („Stand“) nennen `heritage.yaml`.

### Story 10.8: Übungsplatz und Lagerfeuer-Ränge

Als Spieler
möchte ich, dass die Reserve mitwächst und Freundschaften am Lagerfeuer tiefer werden,
damit nicht eingesetzte Gefährten nicht zurückfallen und Supports ihr Ende finden.

**Abhängigkeiten:** nach 10.1 (Raum `training`, `buildRoom` für Lagerfeuer und Übungsplatz); `c.act` aus Story 11.1; A/S-Gespräche der Akt-2-Paare liefert Story 11.21 (Akt-1-Paare haben sie schon).

**Akzeptanzkriterien:**

**Angenommen** der Übungsplatz auf Stufe n

```yaml
# Vorschlag für content/core/balance.yaml (GDD)
training:
  reservePctByLevel: [20, 35, 50]
```

**Wenn** eine Story-Mission oder Heimsuchung gewonnen wird (`finishBattle`)
**Dann** erhält jede Figur der Reserve `round(avg × pct / 100)` EP: Reserve = alle lebenden, nicht eingesetzten Mitglieder der Truppe einschließlich Söldnern (Produktinhaber 2026-10-31, Readiness-Runde R2); `avg` = Durchschnitt der tatsächlich vergebenen EP der eingesetzten, überlebenden Figuren dieser Mission (bei Heimsuchungen also auf ihrer 60-%-Basis) `[ASSUMPTION]`
**Und** die Vergabe läuft über denselben EP-Kern wie im Kampf (aus `grantExp` in `src/core/rules/progression.ts` herausgezogen, nicht kopiert): Stufendeckel des Akts, in Heimsuchungen der Aufhol-Deckel, Level-ups mit `c.rng` in der Reihenfolge der Truppe nach den eingesetzten Figuren `[ASSUMPTION]`
**Und** ohne offenen Übungsplatz (Akt 1, Lager), bei Niederlage, Verlassen oder Neustart und bei `avg = 0` gibt es keine Reserve-EP.

**Angenommen** das Missionsergebnis (Story 6.6)
**Wenn** Reserve-EP vergeben wurden
**Dann** zeigt es die Zeile „Übungsplatz: Reserve +n EP“ (Stern + Zahl) und darunter die Figuren mit Stufenaufstieg; die Daten kommen aus `BattleResult.reserve: Array<{ unit, exp, levelBefore, levelAfter }>` über `resultView.ts`.

**Angenommen** das Panel des Übungsplatzes
**Wenn** der Spieler es öffnet
**Dann** nennt es den Anteil der Stufe („Reserve erhält 20 % der Durchschnitts-EP“, Zahl aus den Daten) und die Reserve der letzten Mission mit ihren EP; das Ausbau-Band nennt den Anteil der nächsten Stufe.

**Angenommen** das Lagerfeuer auf Stufe 2 bzw. 3
**Wenn** ein Paar die Schwelle erreicht (`supports.thresholds` A 45, S 70)
**Dann** öffnen sich Rang A bzw. S (S nur für Kernpaare, `core: true` in `acts/*/supports.yaml`), die Gespräche erscheinen am Lagerfeuer und als Marke in der Truppe (vorhandener Code `campfireMaxRank`, `unlockableRank`)
**Und** das Panel zeigt Gespräche über dem Deckel gesperrt mit Grund („Rang A ab Lagerfeuer Stufe 2“, „Rang S ab Lagerfeuer Stufe 3“, „Rang S nur für Kernpaare“) über eine neue Funktion `campfireLock(data, c, pairKey)`
**Und** Lagerfeuer-Knistern später (Audio).

**Angenommen** die Kettensimulation
**Wenn** `pnpm sim --campaign act2` läuft (vorher Fixture)
**Dann** nennt die Ausgabe je Mission die Reserve-EP und die Durchschnittsstufe der Reserve neben der Armee-Stufe
**Und** `tests/unit/training.test.ts` deckt ab: Anteil je Stufe, Rundung, Söldner in der Reserve, Deckel des Akts, Heimsuchung auf 60-%-Basis, deterministische Level-ups, keine EP bei Niederlage, Lagerfeuer A nach Ausbau auf 2, S nur für Kernpaare nach Ausbau auf 3
**Und** der Handbuch-Eintrag `training` (Kategorie Heimat) nennt den Anteil als Verweis.

### Story 10.9: Händler der Stufen 2 und 3

Als Spieler
möchte ich, dass ein ausgebauter Händler mehr Ware, ein Angebot des Tages, Rabatt und Glutfunken bietet,
damit sich der Ausbau des Händlers lohnt.

**Abhängigkeiten:** nach 10.1 (Stufen) und 10.2 (`ember_spark` als Aufstiegs-Item, Funken-Moment); den Inhalt der Händler-Liste `roomLevel: 2` von Akt 2 nennt Story 11.5 (wer von 10.9 und 11.5 als Zweite gemergt wird, trägt die Liste ein, weil das nicht strikte Händler-Schema das Feld vorher still verwirft); den Rabatt aus E7 setzt Story 11.14 (der aus E4 existiert).

**Akzeptanzkriterien:**

**Angenommen** die Händler-Listen einer Akt-Kampagne (`merchant[]` in `campaign.yaml`, Schema `src/content/schemas.ts`)
**Wenn** eine Liste `roomLevel: 2` trägt (optional, Default 1)
**Dann** erscheint ihr Sortiment nur, wenn der Händler mindestens Stufe 2 hat („größeres Sortiment“); das Sortiment nach Akt-Fortschritt (`merchantTier`) bleibt unverändert
**Und** ein Test mit Fixture-Liste zeigt die Liste erst nach `buildRoom merchant`.

**Angenommen** der Händler auf Stufe 3 (`economy.dailyOfferFromMerchantLevel: 3`)
**Wenn** der Spieler ihn öffnet
**Dann** zeigt ein eigener Abschnitt „Angebot des Tages“ die schon erzeugten Angebote `c.offers` (1–2 Items mit Affix, erneuert wie heute nach jeder Story-Mission durch `refreshOffers`) mit Item-Bild, Affix, Preis; Kauf über das vorhandene Command `buyOffer`
**Und** unter Stufe 3 erscheint der Abschnitt nicht.

**Angenommen** Rabatte aus Entscheidungen (`priceMod` mit negativem `pct`, z. B. E4 „secret“ und E7 „obey“, je −10 %) und der Händler-Rabatt

```yaml
# Vorschlag für content/core/balance.yaml
economy:
  merchantDiscountByLevel: [0, 0, 10]
  maxDiscountPct: 30               # Produktinhaber 2026-10-31: Rabatte addieren sich bis −30 %
  dailyOfferFromMerchantLevel: 3
  emberShop: { fromMerchantLevel: 3, total: 3, maxOffered: 1 }   # Preis = items.ember_spark.price (3 000)
```

**Wenn** der Spieler kauft
**Dann** rechnet `shopPrice` den Gesamtrabatt als Summe aller aktiven `priceMod`-Prozente des Akts plus Händler-Rabatt der Stufe, höchstens 30 %; Verkaufen bleibt 50 % des Grundpreises
**Und** das Panel zeigt den Gesamtrabatt als Marke („−20 %“); Tests decken −10, −20, −30 und eine Summe über 30 (gedeckelt) ab
**Und** nur diese Story baut Summe und Deckel (Schlüssel `economy.maxDiscountPct`); Story 11.14 setzt nur den `priceMod` von E7 und legt keinen eigenen Schlüssel an.

**Angenommen** der Händler auf Stufe 3 und `c.emberShop = { sold, lastSoldAtStory }` (Default `{ sold: 0, lastSoldAtStory: null }`)
**Wenn** weniger als 3 Glutfunken verkauft sind und seit dem letzten Kauf mindestens eine weitere Story-Mission abgeschlossen ist (Zahl aller abgeschlossenen Story-Missionen über alle Akte > `lastSoldAtStory`)
**Dann** steht genau ein Glutfunke im Angebot für ● 3 000 (fester Preis ohne Rabatt, Produktinhaber 2026-10-31, Readiness-Runde R2); `{ type: 'buyEmberSpark' }` zieht das Gold ab, legt ihn in den Konvoi, setzt `sold + 1` und `lastSoldAtStory`, Events `goldChanged`, `itemGained`; der Funken-Moment aus Story 10.2 spielt
**Und** Fehler ohne Änderung: `not_available` (Stufe < 3, nicht im Angebot, alle 3 verkauft), `not_enough_gold`.

**Angenommen** die Funktionen dieser Story
**Wenn** die Tests laufen
**Dann** decken `tests/unit/merchant-levels.test.ts` jede Stufen-Schwelle, jeden Fehlercode, die Liste `roomLevel: 2`, das Angebot des Tages, den Rabatt-Deckel und die Glutfunke-Rotation (erster sofort ab Stufe 3, zweiter erst nach der nächsten Story-Mission, nach 3 Schluss, nie rabattiert) ab; Replay gleich
**Und** die Kettensimulation kauft Glutfunken, sobald ● 3 000 frei sind, und meldet sie; der Handbuch-Eintrag `rooms_upgrade` nennt die Händler-Stufen als Verweise.

### Story 10.10: Konvoi der Stufen 2 und 3

Als Spieler
möchte ich mit einem ausgebauten Konvoi Ausrüstungs-Vorlagen speichern und das Beste mit einem Tipp anlegen,
damit das Umrüsten der wachsenden Truppe schnell geht.

**Abhängigkeiten:** nach 10.1 (Stufen); Ausrüsten-Vergleich aus Story 6.2; `autoEquip` der Söldner aus Story 6.4.

**Akzeptanzkriterien:**

**Angenommen** der Konvoi auf Stufe 2 und eine Figur
**Wenn** der Spieler in der Figur „Als Vorlage speichern“ tippt (`{ type: 'saveGearTemplate', unit }`)
**Dann** speichert `UnitRecord.gearTemplate` (Default `null`) die Item-Uids ihrer 6 Ausrüstungs- und 3 Beutelplätze, eine Vorlage je Figur `[ASSUMPTION]`
**Und** „Vorlage anlegen“ (`{ type: 'applyGearTemplate', unit }`) legt diese Items aus dem Konvoi bzw. der eigenen Ausrüstung an, gibt die abgelösten Items in den Konvoi, überspringt verkaufte Items und Items anderer Figuren und nennt diese im Toast („Bei Brenna: Eisenlanze“) `[ASSUMPTION]`
**Und** Fehler ohne Änderung: `not_available` (Konvoi < 2, keine Vorlage), `convoy_full`.

**Angenommen** der Konvoi auf Stufe 3 und eine Figur
**Wenn** der Spieler „Bestes anlegen“ tippt (`{ type: 'equipBest', unit }`)
**Dann** legt der gemeinsame Kern von `autoEquip` (wie bei Söldnern, nicht kopiert) aus Konvoi und eigener Ausrüstung die führbare Waffe mit der höchsten Mt (Gleichstand: Treffer, dann Uid) und je Rüstungsplatz das Teil mit der höchsten Summe VER + WID (Gleichstand: VER) an; Items anderer Figuren, Zubehör und Beutel bleiben unberührt `[ASSUMPTION]`
**Und** die Ausrüsten-Ansicht zeigt das Ergebnis mit dem Vergleich grün/rot aus Story 6.2.

**Angenommen** die Funktionen dieser Story
**Wenn** die Tests laufen
**Dann** decken `tests/unit/convoy-levels.test.ts` Vorlage speichern und anlegen (auch übersprungene Items), „Bestes anlegen“ mit allen Gleichständen, jeden Fehlercode und die Stufen-Schwellen ab; Replay gleich
**Und** der Handbuch-Eintrag `rooms_upgrade` nennt die Konvoi-Stufen als Verweise.

### Story 10.11: Taverne, Heiler und Schmied der Stufen 2 und 3

Als Spieler
möchte ich, dass ausgebaute Taverne, Heiler und Schmied neue Möglichkeiten bekommen,
damit sich ein Ausbau nicht nur in Zahlen zeigt.

**Abhängigkeiten:** nach 10.1 (Stufen); Taverne aus Story 6.4, Trauer aus Epic 6; `economy.potionUpgrade` existiert; Söldner-Traits in Story 10.12.

**Akzeptanzkriterien:**

**Angenommen** die Taverne auf Stufe 3 (`economy.tavern.wishRoleFromLevel: 3`)
**Wenn** der Spieler eine Wunschrolle wählt (`{ type: 'setTavernWish', role }`, Rollen aus `economy.tavern.classes`, `role: null` hebt sie auf)
**Dann** enthält die nächste Angebotsrunde (`refreshTavern` nach der nächsten Story-Mission) sicher ein Angebot dieser Rolle (ersetzt das erste gezogene Angebot, falls keins dieser Rolle dabei ist), danach ist der Wunsch verbraucht; `c.tavernWish` (Default `null`) und die Ziehung laufen über `c.rng`
**Und** das Panel zeigt die gewählte Rolle als Marke; unter Stufe 3 gibt es die Wahl nicht.

**Angenommen** der Heiler auf Stufe 3

```yaml
# Vorschlag für content/core/balance.yaml (GDD; Stufe nach Lückenanalyse A8 [ASSUMPTION])
supports:
  griefMissionsByHealerLevel: [3, 3, 2]   # ersetzt griefMissions: 3
```

**Wenn** ein Support-Partner fällt
**Dann** dauert die neu entstehende Trauer 2 statt 3 Missionen (`finishBattle` liest die Zahl über eine Funktion in `camp.ts`); laufende Trauer bleibt unverändert `[ASSUMPTION]`.

**Angenommen** der Schmied auf jeder Stufe und ein Heiltrank (Verbrauchsgut mit `use.heal`, z. B. `vulnerary`)
**Wenn** der Spieler „Trank verstärken“ wählt (`{ type: 'upgradePotion', item }`)
**Dann** kostet die erste Verstärkung ● 400, die zweite ● 900, jede gibt +5 Heilung (`economy.potionUpgrade`, existiert); die Item-Instanz trägt die Stufe als Zahl („+1“), höchstens 2; erst ab Akt 2 (Produktinhaber 2026-10-31, Readiness-Runde R2; Schlüssel `economy.potionUpgradeFromAct: 2` `[ASSUMPTION]`, kein `if` im Code)
**Und** Fehler ohne Änderung, in dieser Reihenfolge: `unknown_item` (keine Item-Instanz mit dieser Uid), `not_available` (Akt < 2, kein Heiltrank, schon +2), `not_enough_gold`; die Taste nennt den Betrag.

**Angenommen** die Funktionen dieser Story
**Wenn** die Tests laufen
**Dann** decken `tests/unit/room-functions.test.ts` Wunschrolle, Trauer 2 statt 3, Trank verstärken (auch die Ablehnung in Akt 1), jeden Fehlercode und die Stufen-Schwellen ab; Replay gleich
**Und** der Handbuch-Eintrag `rooms_upgrade` nennt die Stufen von Taverne, Heiler und Schmied als Verweise.

### Story 10.12: Söldner-Traits

Als Spieler
möchte ich, dass Söldner aus der Taverne Eigenheiten haben und eine ausgebaute Taverne bessere bringt,
damit die Wahl zwischen Angeboten mehr ist als der Preis.

**Abhängigkeiten:** nach 10.1 (Taverne-Stufen) und 10.11 (Wunschrolle); Taverne aus Story 6.4; Liste aus `concept/21-gdd/extract-01-decisions.md` Z. 50.

**Akzeptanzkriterien:**

**Angenommen** `content/core/traits.yaml` (Schema `traitSchema`: `{ id, kind: good | bad, effect?: <Bausteine passiver Skills>, hireCostPct?: number }`, Namen `trait.<id>.name|desc` DE/EN)
**Wenn** `pnpm content:check` läuft
**Dann** gibt es genau diese sieben Traits mit Werten `[ASSUMPTION]`:

| Id | Name | Art | Wirkung |
|---|---|---|---|
| `tough` | Zäh | gut | `stats: { hp: 4 }` |
| `nimble` | Flink | gut | `stats: { spd: 2 }` |
| `veteran` | Veteran | gut | `stats: { skl: 2, lck: 2 }` |
| `elemental_child` | Elementkind | gut | `stats: { mag: 2, res: 2 }` |
| `greedy` | Gierig | schlecht | `hireCostPct: 25` (Anheuern 25 % teurer) |
| `coward` | Feigling | schlecht | `stats: { str: -2, mov: 1 }` |
| `clumsy` | Unbeholfen | schlecht | `stats: { skl: -2 }`, `hitBonus: -5` |

**Angenommen** die Taverne auf Stufe n

```yaml
# Vorschlag für content/core/balance.yaml [ASSUMPTION]
economy:
  tavern:
    traitCount: [1, 2]                    # 1 oder 2 Traits je Angebot, gleich wahrscheinlich
    goodTraitChanceByLevel: [50, 75, 75]  # Stufe 2 = „bessere Traits“
```

**Wenn** `refreshTavern` Angebote zieht
**Dann** bekommt jedes Angebot 1–2 verschiedene Traits, jeder Platz mit der Wahrscheinlichkeit der Stufe aus den guten, sonst aus den schlechten, alles aus `c.rng` in fester Reihenfolge
**Und** die Traits stehen in `UnitRecord.traits` (Default `[]`), wirken als passive Bausteine über `activeSkillIds`/Werte in Kampf, Vorschau und Simulation, und `Gierig` erhöht `recruitCost` im Angebot und im Command `hire` gleich.

**Angenommen** das Taverne-Panel und die Figur
**Wenn** ein Söldner Traits hat
**Dann** zeigt er sie als Marken (gute in Grün, schlechte in Rot, Name + Info-Stein mit Wirkung), der Preis enthält den Aufschlag
**Und** Story-Gefährten haben keine Traits.

**Angenommen** die Tests
**Wenn** sie laufen
**Dann** deckt `tests/unit/traits.test.ts` ab: Zahl und Verteilung je Stufe über einen festen Seed, keine doppelten Traits, Wirkung jedes Traits, Gierig im Preis, alte Söldner ohne Feld laden; Replay gleich
**Und** der Handbuch-Eintrag `tavern` nennt die Traits mit Wirkung.

### Story 10.13: Anhängeteile der Profi-Wege

Als Spieler
möchte ich einer aufgestiegenen Figur auf dem Brett ansehen, welchen Profi-Weg sie gewählt hat,
damit Aufstiege auch sichtbar etwas ändern.

**Abhängigkeiten:** nach 10.3 (Feld `proPart`); Tripo-Pipeline aus Story 8.2; Art Direction §4.2 und §4.6; blockiert keine andere Story.

**Akzeptanzkriterien:**

**Angenommen** die 16 Profi-Wege
**Wenn** die Teile gebaut sind
**Dann** gibt es je Weg genau ein Anhängeteil als GLB unter `art/models/parts/<id>.glb`, gebaut mit `tools/art/blender_parts.py` (eigene Modellierung in Blender, bei Bedarf Bild-zu-3D mit Tripo nach §4.6), im Budget aus `concept/16-asset-pipeline.md`, im Toon-Look mit Kontur:

| Klasse | Teil (`proPart`) | Sockel |
|---|---|---|
| `bulwark` | `tower_shield` Turmschild | `back` |
| `breaker` | `ram_axe` Rammaxt | `back` |
| `blade_dancer` | `second_blade` Zweitklinge | `back` |
| `duelist` | `feather_beret` Federbarett | `head` |
| `sharpshooter` | `feather_hat` Federhut (der Langbogen kommt aus der Waffe) | `head` |
| `ranger` | `leaf_cloak` Blätterumhang | `back` |
| `sage` | `pointed_hat` Spitzhut | `head` |
| `hexer` | `raven_collar` Rabenkragen | `back` |
| `bishop` | `mitre` Mitra | `head` |
| `battle_priest` | `war_hammer` Kriegshammer am Rücken | `back` |
| `bard` | `great_lute` große Laute am Rücken | `back` |
| `standard_bearer` | `back_banner` Rückenbanner | `back` |
| `shadow` | `half_mask` Halbmaske | `head` |
| `trapper` | `trap_belt` Fallengurt | `back` |
| `grand_strategist` | `general_cloak` Feldherrnumhang | `back` |
| `banner_lord` | `standard` Standarte | `back` |

`[ASSUMPTION]` Liste nach Lückenanalyse A20; die Namen erscheinen schon in Akademie und Figur (`part.<classId>.name`).
**Und** `render.yaml` ordnet unter `gear.proParts` jedem Teil Modell und Sockel zu; der Rig der Tripo-Figuren bekommt die Sockel `socket_back` und `socket_head` (`tools/art/prepare_tripo_unit.py`).

**Angenommen** eine Figur mit Profi-Klasse auf dem Brett
**Wenn** der Kampf startet
**Dann** hängt das Teil ihrer Klasse am Sockel der vorhandenen Figur (kein neues Figurenmodell), für alle Figuren dieser Klasse gleich, auch für Gegner mit Profi-Klasse; Figuren ohne Sockel (Blender-Figuren) zeigen kein Teil, ein Test listet sie
**Und** das Teil bewegt sich mit Idle, Lauf und Angriff, verdeckt weder Lebensleiste noch Groll-Wimpel, und die Bildrate bleibt über den Zielen aus Story 7.8.

**Angenommen** die Auflagen für KI-Assets
**Wenn** ein Teil mit Tripo oder nach einer ChatGPT-Vorlage entsteht
**Dann** stehen Prompt, Werkzeug, Eigenanteil und Abnahme in `art/prompts/part_<id>.md` nach `licensing.md` §6
**Und** je Teil gibt es einen Screenshot bei 375 × 812 auf dem Brett zur Abnahme.

### Story 10.14: Burg-Grafik nach der 3D-Entscheidung

Als Spieler
möchte ich sehen, wie die Paktwacht mit jedem Ausbau und jedem Gefährten wächst und wo Gefallene fehlen,
damit die Heimat lebendig wirkt.

**Abhängigkeiten:** erst nach der Entscheidung des Produktinhabers „3D oder Bild“ auf Grundlage des 3D-Testaufbaus der Session epic10-castle (Branch `claude/epic10-castle-2a96a1`: `src/render/home/castle.ts`, `src/app/screens/Castle3d.tsx`, Screenshots in `_bmad-output/planning-artifacts/handoff-epic10/`, Messung auf echtem Gerät); nach 10.1 (Stufen); die Liste der Gegenstände nimmt der Produktinhaber als Narrative-Vorschlag ab.

**Akzeptanzkriterien:**

**Angenommen** die Entscheidung des Produktinhabers
**Wenn** die Story beginnt
**Dann** steht sie in `concept/23-art-direction/decision-log.md` und `concept/25-ux/.decision-log.md`; `EXPERIENCE.md` („Burg in 3D“) und Art Direction §7 sind nachgezogen; Raumsteine, Raum-Panels und ≤ 2 Taps bleiben unverändert
**Und** der Spike-Code wird bei „3D“ zu Produktionscode umgebaut, bei „Bild“ gelöscht.

**Angenommen** die Daten (für beide Ausgänge)
**Wenn** `pnpm content:check` läuft
**Dann** trägt jeder vorhandene Story-Gefährte (die 15 aus `content/acts/act1` und `act2`) in `charSchema` ein Feld `homeObject` (Id des Gegenstands; Pflicht für jeden Gefährten in `content/acts/*/units.yaml`), `content/home/home.yaml` hat unter `castle` je Gegenstand einen festen Platz (`objects: [{ id, char, at, asset }]`) und je Raum und Stufe ein Ausbauteil (`parts: [{ room, level, asset }]`), und jedes Asset existiert
**Und** die Gegenstände sind ein Narrative-Vorschlag `[ASSUMPTION]`, eingetragen in `concept/22-narrative/narrative.md` („Die Paktwacht wächst mit“) und dessen Decision-Log:

| Gefährte | Gegenstand | Gefährte | Gegenstand |
|---|---|---|---|
| Brenna | Axtständer | Nell | Seekarte mit Kompass |
| Tobin | Holzschild mit selbstgemaltem Wappen | Brann | aufgeschichtetes Steinmännchen |
| Mira | Trockengestell mit Fellen | Amos | Feldschertasche mit Kräuterbund |
| Fenn | Kiste voller Krimskrams mit Dietrichrolle | Ilka | Hirschgeweih an der Wand |
| Liora | kleiner Hausaltar mit Kerzen | Sable | Säbel des Grenzheers auf Ständer |
| Varek | Würfelbrett | Mael | Gardehelm der Paktgarde |
| Ysolde | Bücherstapel | Pell | Laterne der Stadtwache |
| Grosk | großer Kochkessel | Vesna | Drachenknochen auf Sockel |
| Jory | Laute | Kit | Schlüsselbund des Palasts |
| Odile | polierter Brustpanzer auf Ständer | Harlan | Notenständer mit Pergament |

**Und** die Gegenstände der Akt-3-Gefährten (Mael, Pell, Vesna, Kit, Harlan) sind hier nur ein Hinweis für Epic 12: Daten, Plätze und Assets dafür liefert Epic 12 mit den Gefährten; diese Story prüft sie nicht.

**Angenommen** die reine Funktion `castleScene(data, c)` (liest nur `c.roster`, `c.fallen`, `c.left`, `c.home`, kein neuer Zustand)
**Wenn** ein Gefährte beitritt, fällt oder geht
**Dann** liefert sie je Platz den Zustand: beigetreten → Gegenstand steht an seinem Platz; gefallen → der Gegenstand bleibt liegen, der Platz ist leer (entsättigt, Gedenken-Stil), und die Gedächtnishalle hat seinen Stein; gegangen → er nimmt den Gegenstand mit, der Platz ist leer, kein Stein; nie beigetreten → nichts; Söldner haben keinen Platz
**Und** je Raum das Ausbauteil seiner Stufe (Stufe 1 Gerüst und Planen, Stufe 2 Dach und Fenster, Stufe 3 Banner, Licht und Leben)
**Und** Unit-Tests decken alle Zustände ab.

**Angenommen** Ausgang „3D“
**Wenn** die Heimat die Burg ist
**Dann** zeichnet `src/render/home/` die Burg als Diorama auf dem Szenen-Host mit eigenen Burg-Modellen (Blender/Tripo, Prompts und Eigenanteil nach `licensing.md` §6), Ausbauteilen und Gegenständen als Modelle an den Plätzen aus `home.yaml`, abendlichem Licht aus `render.yaml`; Antippen eines Raums öffnet sein Panel
**Und** die Ansicht zeichnet nur bei Änderung neu (keine dauernd schwingende Kamera), zeigt beim Laden die Ladeanzeige aus Story 7.6, bleibt als eigener Chunk im Bundle-Budget und hält auf dem Referenzgerät die Ziele aus Story 7.8.

**Angenommen** Ausgang „Bild“
**Wenn** die Heimat die Burg ist
**Dann** liegen über `paktwacht_ruine` je Raum und Stufe gemalte, freigestellte Ausbauteile am Anker und an jedem Platz der gemalte Gegenstand (ChatGPT über Claude in Chrome, Prompt und Abnahme in `art/prompts/<id>.md`, `licensing.md` §6, Bilder in Git LFS); Positionen in Prozent aus `home.yaml`
**Und** jedes Bild liegt in mindestens doppelter Anzeigegröße vor (keine sichtbare Vergrößerung bei 375 × 812 und am Desktop) `[ASSUMPTION]`, die Anker-Punkte und -Pfeile aus Story 10.1 bleiben lesbar.

**Angenommen** beide Ausgänge
**Wenn** die Story fertig ist
**Dann** belegen Screenshots bei 375 × 812 die Burg mit allen Räumen auf Stufe 1, 2 und 3 sowie einen gefallenen und einen gegangenen Gefährten
**Und** Burg-Atmosphäre und Raumklänge später (Audio).

## Epic 11: Akt 2 „Glut“

Spieler ziehen nach dem Finale von Akt 1 in die herbstliche Eisenmark, dienen nacheinander den drei Thronanwärtern (Prinzessin, Dravn, Herzogin), decken je Strang eine Lüge auf und werden in Kronfeld verraten. Das Epic liefert den Akt-Übergang mit dem Paket `act2`, die sieben Gefährten und vier Leutnants von Akt 2, Flieger und Balliste als Regel-Schwerpunkt des Akts, eine Story je Mission (2-1 bis 2-8), die Nebenquests N4 bis N6, Supports, Barks und die Chronik-Szene sowie die Abstimmung. Grundlagen: `concept/22-narrative/narrative.md` (Missionsfolge Akt 2, E5–E8, N4–N6, Supports, Key Conversations 6–8), `concept/21-gdd/gdd.md`, `concept/21-gdd/items.md` §5/§6 und die Entscheidungen des Produktinhabers vom 2026-10-31 (Verfeinerung Epic 10/11). Alle Spielwerte in den Stories sind Vorschläge für `balance.yaml` bzw. die Content- und Karten-YAMLs, als `[ASSUMPTION]` markiert und per Simulation zu prüfen; Szenen gibt es auf Deutsch und Englisch, jede Box ≤ 110 Zeichen; Musik, Klang und Vertonung von Akt 2 kommen später.

**Reihenfolge und Abhängigkeiten zu Epic 10:** Story 11.1 kommt zuerst, weil Epic 10 `c.act`, `levelCap` 20 und die festen Gefährten-IDs (`jory`, `odile`, `nell`, `brann`, `amos`, `ilka`, `sable`) braucht; Epic 10 liest `c.act` nur. Weil der Akt-Übergang ab dem Merge von 11.1 live ist (Entscheidung Produktinhaber, siehe 11.1), folgt 11.3 (Paket, Titeltafel) zeitnah nach 11.1. Danach laufen 11.2 (Positionsstufe), 11.3 (Paket, Weltkarte, Titeltafel), 11.4 (Simulation über Akte), 11.5 (Gefährten, Leutnants, Stahl, Flags), 11.6 (Balliste) und 11.7 (Flieger, Gegner, Herbst) parallel zu 10.2–10.4; 11.8 (Ziel-Phasen) und 11.9 (Relikt-Stufen) sind Kern-Stories ohne eigene Karte und gehen jederzeit nach 11.1. Die Missionen beginnen mit 11.10 (2-1, braucht 11.2–11.7); danach laufen die drei Stränge in beliebiger Reihenfolge, innerhalb eines Strangs nacheinander: Prinzessin 11.11 → 11.12, Dravn 11.13 → 11.14, Herzogin 11.15 → 11.16. Nebenquests: N4 (11.18) nach 11.13, N5 (11.19) nach 11.14 und 11.9, N6 (11.20) nach 11.10 und 10.4 (Anfeuern auf zwei Ziele); N4 und N5 zeigen den Funken-Moment aus 10.2. 11.17 (2-8 Kronfeld) kommt nach den übrigen Missionen 11.10–11.16 sowie 11.8 und 11.9; 11.21 (Supports, Barks, Chronik-Szene) sobald 11.5 die Gefährten ihrer Paare anlegt. 11.22 (Abstimmung und Release) kommt zuletzt: nach allen Stories von Epic 11 und nach 10.1–10.12, weil diese Gold, EP, Glutfunken und Rabatte von Akt 2 verändern; bis dahin stimmen alle Missions-Stories vorläufig ohne Aufstieg ab. Alle Flags von Akt 2 deklariert 11.5 in `content/acts/act2/flags.yaml`, damit `content:check` sie in jeder Bau-Reihenfolge kennt; jede Story nennt ihre Vorgänger in der Zeile „Abhängigkeiten“. Datei-Zuständigkeit: Epic 11 besitzt `content/acts/act2/**`, den Akt-Übergang, Gegner, Leutnants und Stahl-Items; Epic 10 besitzt `content/core/rooms.yaml` (einzige Ausnahme: 11.1 ergänzt bei den vier Akt-1-Räumen `{ act: 2 }`, damit sie beim Übergang nicht schließen), die Profi-Klassen und den Glutfunken. In gemeinsamen Dateien ändert Epic 11 nur eigene Blöcke: Abschnitt „Gegnertypen“ in `classes.yaml`, ein Block „Akt 2: Stahl-Tier“ in `items.yaml`, in `balance.yaml` nur Akt-Schlüssel und die hier genannten neuen Schlüssel. Nicht Teil von Epic 11: die drei fehlenden Chronik-Seiten von Akt 1 (eigene Nacharbeit).

**Gemeinsame Regeln aller Missions-Stories (11.10–11.20):**

- **Positionsstufe P** (Story 11.2): P = 11 + Zahl der erledigten Story-Missionen von Akt 2 (+ `levelBonus` des Knotens, nur 2-8). Generische Kartengegner stehen relativ dazu mit `levelOffset` +0 bis +2; Leutnants skalieren wie in Akt 1 mit der Armee. Die Spalte „Position“ nennt, an welcher Stelle eine Mission frühestens und spätestens gespielt werden kann.
- **Ausrüstung:** Generische Gegner tragen Stahl (Akt-Tier), Leutnants auf der Karte Eisen, damit „+1 Tier je Groll“ greift.
- **Niederlage:** Tod von Avatar oder Kael (`unit_dies`), bei 2-3 zusätzlich Odile niedergestreckt oder tot.
- **Herbst:** Karten liegen unter `content/acts/act2/maps/` (`map.act = 2`), Jahreszeit und Herbst-Boden aus Story 11.7.
- **Szenen:** IDs nach Akt-1-Schema (`scn.<knoten>.intro|outro`, `scn.<knoten>.<lt>_battle`, `scn.<knoten>.<einheit>_talk`, Besuche `scn.<knoten>.house_*`, Lektionen `scn.<knoten>.tutorial_*`). Deutsch steht in der Szenen-YAML, Englisch in `content/locales/en/act2.dialogue.yaml`; Schreib-Pipeline der Narrative (Humanizer-Durchgang, dann Englisch). Gefährtenzeilen stehen unter `requires: alive` mit Ersatzsprecher-Kette. Tafeln sind `panel: <bild>`; fehlt das Bild, steht bis zum Grafik-Task eine Platzhalter-Tafel (Text auf Glutgrund wie die Titeltafel aus 11.3).
- **Entscheidungen:** Jede Antwort trägt eine Haltung (warm, nüchtern, trotzig) wie in Akt 1 und zeigt ihre Folgen-Karte (Mockup 05). Flags sind in `content/acts/act2/flags.yaml` deklariert (Story 11.5).
- **Zielfolge:** Die Regel „kein Ziel zweimal hintereinander“ (GDD „Missionsfolge“, Narrative-Prüfregel) gilt nur für die Story-Missionen; Nebenquests zählen nicht mit (Entscheidung Produktinhaber 2026-10-31, Readiness P-N1, Narrative-Log; sonst entstünden Paare wie 2-5 `defend` → N4 `defend`).
- **Ortsbilder:** Vorhanden sind `grauwacht`, `salzpass`, `brandhang`, `kronfeld`. Fehlende Ortsbilder (2-1, 2-4, 2-6, 2-7, N4–N6) sind je ein eigener Grafik-Task (`art/prompts/<id>.md`, Lizenzauflagen `licensing.md` §6). Er blockiert nichts; bis dahin zeigt der Knoten ein vorhandenes Ortsbild als Platzhalter, das in der Karten-YAML als Kommentar steht.
- **Sim-Korridor:** NFR12 aus `balance.yaml › simulation.corridors` (Leicht ≥ 95 % Sieg und ≤ 0,5 Niedergestreckte; Normal 75–100 % und 0,4–1,3; Schwer 30–70 %). Geprüft mit `pnpm sim <map> --runs 50 --start expected --position <k>` (Optionen aus Story 11.4) an der frühesten und der spätesten Position der Mission, vorläufig ohne Aufstieg. Abweichungen begründet der Dev Agent Record; die endgültigen Korridore folgen in 11.22.
- **Fertig:** `pnpm lint`, `pnpm test`, `pnpm content:check` und `pnpm build` sind grün. Screenshots (Hochformat 375 × 812) zeigen Karte, Intro, Leutnant-Zeile und Nachszene. Neue Entscheidungen stehen im zuständigen Decision-Log unter `concept/`.

### Story 11.1: Akt-Übergang und Spielstand

Als Spieler
möchte ich nach dem Finale von Akt 1 mit meinem Spielstand nahtlos in Akt 2 weiterziehen,
damit die Kampagne über die Akte hinweg eine Geschichte bleibt.

**Abhängigkeiten:** nach Story 9.14 (Akt 1 veröffentlicht, Fixture-Spielstände aus dem Release); kommt vor allen Stories von Epic 10 und den übrigen von Epic 11.

**Akzeptanzkriterien:**

**Angenommen** `content/acts/act2/` mit `campaign.yaml`, `units.yaml` und `flags.yaml`
**Wenn** der Loader (`src/content/load.ts` `buildContent`) den Content baut
**Dann** lädt er `campaign.yaml`, `units.yaml` und `flags.yaml` aller vorhandenen Akt-Ordner statt fest `acts/act1/…`; `GameData` hält die Kampagnen je Akt (`acts: Record<number, CampaignDef>`), Gefährten und Flags aller Akte stehen gemeinsam in `data.chars` bzw. `data.flags`
**Und** eine Hilfsfunktion `actCampaign(data, c)` liefert die Kampagne des laufenden Akts, `findNode(data, id)` findet einen Knoten über alle Akte (anderer Name als `nodeDef` in `src/app/state/flow.ts`); alle 88 Lesestellen von `data.campaign` (in `src/core`, `src/app`, `src/content`, `tools/`, Liste per `grep -rn "data\.campaign" src tools`) lesen danach den Akt der Kampagne
**Und** `content:check` meldet doppelte Gefährten-, Flag- und Knoten-IDs über Akte hinweg als Fehler
**Und** Leutnant-Heimsuchungen nutzen den Pool aus `data.hauntPools[lt.act]`.

**Angenommen** die Truppe gewinnt das Finale eines Akts (`fixed: finale`) und die Kampagne des nächsten Akts liegt in den Daten vor
**Wenn** `finishMission` den Sieg verbucht
**Dann** setzt es `c.act = act + 1` und meldet das Event `actReached { act }`; fehlt der nächste Akt, bleibt alles wie in Story 7.3 („Akt n „Name“ erscheint bald“)
**Und** der Übergang ist ab dem Merge dieser Story live (Entscheidung Produktinhaber, Übergabe epic11-act2, Antwort 1: act2 sofort veröffentlichen): Bedingung ist allein, dass die Kampagne des nächsten Akts in den Daten liegt (die Kopfdateien von Akt 2 stehen im Paket `core`), der Kern fragt kein Paket ab; wer Akt 1 beendet, landet in Akt 2, die Weltkarte zeigt „Weitere Missionen folgen“ (vorhandenes `moreMissionsFollow`, solange Akt 2 keine Knoten hat), Heimsuchungen laufen weiter; die Titeltafel aus Story 11.3 erscheint dank `c.actTitleSeen` beim ersten Öffnen der Weltkarte nach 11.3 nachträglich; die Build-Regel für `acts/actN/` bleibt in Story 11.3
**Und** Replays (Startzustand + Command-Log) und die Simulation (`simCampaign.ts`, `applyNodeRewards`) führen den Übergang genauso aus
**Und** die Änderungen an `apply.ts` und `commands.ts` bleiben klein (Übergang am Ende des `finishMission`-Zweigs, `markBackupReminded` gegen `c.act`, ein neues Event), weil Epic 10 dieselben Dateien ändert.

**Angenommen** ein gespeicherter Akt-1-Stand im Format 2 mit erledigtem `m1_8`, auch einer, der wegen „erscheint bald“ in Akt 1 stand
**Wenn** er nach dem Update geladen wird
**Dann** füllt `normalizeCampaign` das fehlende `c.act` (Standard 1) und holt den Übergang nach, solange das Finale des Akts erledigt ist und der nächste Akt vorliegt; 11.1 braucht keine Migration (kein persistiertes Feld ändert seine Bedeutung, `c.act` füllt `normalizeCampaign`); ab Story 10.2 gilt Format 3 mit der generischen Umbenennungs-Migration
**Und** die Fixture `tests/fixtures/saves/format2-act1-finale-done.json` ist ein echter Spielstand aus dem Akt-1-Release (Story 9.14), keine selbst gebaute Datei, und lädt mit `act: 2`, Truppe, Gold, Tross, Flags, Groll und Gedenksteine bleiben unverändert; ein Stand ohne erledigtes Finale bleibt in Akt 1
**Und** `metaFromCampaign` (`src/persistence/save.ts`) liefert `c.act` statt fest 1, die Kampagnen-Liste zeigt „Akt 2“.

**Angenommen** `c.act = 2`
**Wenn** Regeln nachschlagen, was im Akt gilt
**Dann** gelten `levelCap` 20, `mechanics: {}` (alle Regeln an), Händlerstufen und `storyCount` aus der Kampagne von Akt 2, die Bedingung `act`, `priceMods`, `villageAid` und `decisions[].act` für Akt 2
**Und** `availableNodes` liefert die Story-Knoten des laufenden Akts und die Nebenquest-Knoten aller Akte bis `c.act` (offene Akt-1-Nebenquests bleiben spielbar); Heimat (`c.home`) und gebaute Räume bleiben beim Übergang, wie sie sind
**Und** damit die Akt-1-Räume (Schmied, Heiler, Taverne, Lagerfeuer) trotz `storyCount` je Akt offen bleiben, ergänzt 11.1 in `content/core/rooms.yaml` nur deren Raum-Bedingung zu `any: [{ act: 2 }, { storyCount: { min: n } }]` (kleiner Eingriff in eine Epic-10-Datei, abgestimmt; Kosten und Gefährten der Stufen ergänzt 10.1); ein Test belegt, dass nach dem Übergang kein Raum schließt.

**Angenommen** `acts/act2/campaign.yaml`
**Wenn** sie angelegt ist
**Dann** enthält sie `act: 2`, `levelCap: 20`, `mechanics: {}`, `home: castle`, `defaultPlace: grauwacht`, `startGold`/`startConvoy` nur fürs Schema, `scars` wie Akt 1 und `nodes: []` (`positionLevel` ergänzt Story 11.2); jede Missions-Story ergänzt ihren Knoten und setzt `node:` am vorhandenen Ort in `content/world/valmora.yaml`
**Und** `merchant` hat zunächst nur Stufe 0 mit vorhandenen Teilen (`vulnerary`, `remedy_salve`, `door_key`, `steel_sword`, `steel_lance`, `steel_axe`, `steel_bow`, `javelin`, `hand_axe`, `travel_lute`, `mend_staff`, `chainmail`, `iron_helm`, `iron_shield`, `ember`, `gust`, `surge`, `rockfall`, `shine`, `fire_bomb`); Story 11.5 ergänzt die Stufen 1 und 2
**Und** `acts/act2/units.yaml` legt die sieben festen IDs mit Klasse und `joins` an (Werte ergänzt Story 11.5): `jory` minstrel (`m2_1`), `nell` scout (`m2_2`), `odile` skirmisher (`m2_3`), `ilka` marksman (`m2_4`), `brann` elementalist (`m2_5`), `amos` healer (`m2_6`), `sable` skirmisher (`lieutenant`); Namen `unit.<id>.name` in DE und EN
**Und** `acts/act2/flags.yaml` ist angelegt und noch leer (die Flags deklariert Story 11.5); die drei Kopfdateien `acts/act2/campaign.yaml`, `units.yaml` und `flags.yaml` stehen als einzelne Globs im Paket `core` von `content/packs.yaml` (die Globs kennen keine `{a,b}`-Klammern), damit Übergang, Bedingungen und Räume sie vor dem Hintergrund-Download kennen; das Paket `act2` selbst legt Story 11.3 an
**Und** `content:check` erlaubt einen Akt ohne Knoten nur, solange seine IDs nicht in `content/released-ids.json` stehen.

**Angenommen** die Story ist fertig
**Wenn** geprüft wird
**Dann** gibt es `tests/unit/act-transition.test.ts` (Übergang, kein Übergang ohne Akt 2, Replay identisch, Nebenquests von Akt 1 offen, `storyCount`/`levelCap`/Händler je Akt, kein Raum schließt, doppelte IDs über Akte) und einen Ladetest der Fixture aus dem Akt-1-Release
**Und** die Abdeckung von `src/core` sinkt nicht (`pnpm test:coverage`); Architektur §5.4/§5.5/§5.14 bekommt einen Absatz „Stand (Story 11.1)“, die Entscheidungen stehen im Architektur-Log.

### Story 11.2: Positionsstufe der Akt-2-Missionen

Als Spieler
möchte ich, dass Gegner und neue Gefährten in Akt 2 zu meinem Fortschritt passen, egal in welcher Reihenfolge ich die Stränge spiele,
damit jede Mission fordert, ohne zu überfordern.

**Abhängigkeiten:** nach 11.1 (Loader, `findNode`, `acts/act2/campaign.yaml`); Story 11.4 nutzt `nodeLevel` für `--position`, alle Missions-Stories ab 11.10 für ihre Gegner.

**Akzeptanzkriterien:**

**Angenommen** `acts/act2/campaign.yaml` mit `positionLevel: { base: 11 }` `[ASSUMPTION]`
**Wenn** ein Knoten seine erwartete Stufe braucht
**Dann** liefert die reine Funktion `nodeLevel(data, c, node)` in `src/core/campaign/` für Akte ohne `positionLevel` das Knotenfeld `expectedLevel` (Akt 1 unverändert) und für Akte mit `positionLevel` die Positionsstufe P = `base` + Zahl der erledigten Story-Knoten des Akts + `levelBonus` des Knotens (Standard 0); das gilt für Story- und Nebenquest-Knoten des Akts, ist eine reine Funktion des Kampagnenstands (replay-sicher) und getestet
**Und** `expectedLevel` ist im Schema (`src/content/schemas.ts`) für Knoten von Akten mit `positionLevel` optional, für alle anderen weiter Pflicht; die Monotonie-Prüfung in `src/content/validate.ts` gilt nur für Akte ohne `positionLevel`
**Und** alle Leser von `expectedLevel` lesen danach `nodeLevel`: `refreshTavern` (Söldner-Stufe, `campaign.ts`), `hauntLevel` (`haunts.ts`), `WorldMap.tsx` und `Prep.tsx` (Anzeige `ui.map.level`), der Dev-Start in `flow.ts`, `simCampaign.ts` und `tools/simulate.ts`; `grep -rn expectedLevel src tools` zeigt danach keine Lesestelle von `expectedLevel` außer Schema, Typ (`CampaignNode.expectedLevel` in `defs.ts`), Prüfung und `nodeLevel` (ein Berichtsfeld gleichen Namens in `simCampaign.ts`, das aus `nodeLevel` gefüllt wird, ist keine Lesestelle)
**Und** die Weltkarte zeigt auf jedem offenen Knoten von Akt 2 und im Knoten-Blatt vor dem Start die Stufe über den vorhandenen Schlüssel `ui.map.level`, bei Positionsstufen mit „≈“ („Stufe ≈ 12“, Text in DE und EN angepasst, kein neuer Schlüssel).

**Angenommen** Karteneinheiten von Akt 2
**Wenn** eine Karte geladen wird
**Dann** dürfen sie statt `level` ein `levelOffset` (ganze Zahl 0 bis 2) tragen, auch in Verstärkungen und `spawn`-Triggern; `createBattle` rechnet `nodeLevel + levelOffset`, die errechnete Stufe steht im Startzustand des Kampfes; `content:check` verlangt auf Story-Karten von Akt 2 `levelOffset` für alle generischen Gegner und meldet Werte außerhalb 0–2
**Und** der Stufendeckel `levelCap` gilt nur für die Truppe; Gegner dürfen darüber liegen (z. B. Garde-Ritter in 2-8 auf Stufe 21)
**Und** die Stufen-Abweichung der Simulation (`levelTolerance`) misst gegen `nodeLevel`.

**Angenommen** ein Gefährte von Akt 2 tritt bei (Knotenwirkung `recruit`, Ansprechen im Kampf oder Eskorte)
**Wenn** sein Datensatz entsteht
**Dann** ist seine Stufe max(`level` der Definition, P der Mission − 1); die Werte steigen wie bei `joinLieutenant` (`src/core/campaign/lieutenants.ts`) um den Erwartungswert des Wachstums, kaufmännisch gerundet und durch die Klassengrenzen gedeckelt, ohne Zufall
**Und** ein Test belegt Beitritt an früher und später Position (zum Beispiel Nell als 2. Mission auf Stufe 11, als 6. Mission auf Stufe 15).

**Angenommen** Heimsuchungen in Akt 2
**Wenn** der laufende Akt noch keinen Story-Knoten mit Karte hat
**Dann** fallen `hauntGold` und `hauntLevel` nicht auf 0 bzw. Stufe 1 zurück, sondern nehmen die Werte des letzten Akts mit Story-Karten; ein Test belegt das.

**Angenommen** die Fixture-Karte `tests/fixtures/maps/dev_eisenmark.yaml` (kein Knoten, kein Paket)
**Wenn** sie mit `__hc.devMap('dev_eisenmark', 2)` gestartet wird (`devMap` in `flow.ts` übernimmt einen Akt-Parameter)
**Dann** stehen ihre Gegner mit `levelOffset` auf der Positionsstufe; die Stories 11.6 und 11.7 erweitern die Karte um Ballisten, Flieger und Herbst
**Und** `tests/unit/position-level.test.ts` deckt `nodeLevel` für Akt 1 und Akt 2, die Monotonie-Prüfung, `levelOffset`, die Beitrittsstufe und den Heimsuchungs-Rückfall ab; Architektur §5.4 bekommt einen Absatz „Stand (Story 11.2)“ mit dem Vertrag von `nodeLevel`.

### Story 11.3: Paket `act2`, Weltkarte und Titeltafel

Als Spieler
möchte ich beim Übergang eine Titeltafel sehen und die Eisenmark aus dem Nebel treten sehen,
damit der neue Akt als Ereignis beginnt.

**Abhängigkeiten:** nach 11.1 (Übergang, `c.act`, Kopfdateien im Paket `core`); Ladezustand aus Story 7.2.

**Akzeptanzkriterien:**

**Angenommen** das Paket `act2` in `content/packs.yaml`
**Wenn** gebaut wird
**Dann** hat es `released: true`, `load: background`, `act: 2`, `budgetMb: 40` und `content: [acts/act2/**, locales/*/act2.*]`; seine Bilder und Modelle (Akt-2-Porträts, -Figuren, -Ortsbilder, -Tafeln, Herbstbäume `autumn_a/b/c`) stehen als Globs je Datei oder Ordner vor dem Paket `act1`, damit sie nicht über `act1`-Globs (`models/**`, `locations/**`, `busts/**`, `halves/**`) dort landen; die Globs kennen keine `{a,b}`-Klammern
**Und** die Kopfdateien von Akt 2 bleiben im Paket `core` (Story 11.1)
**Und** Dateien unter `acts/actN/` kommen nur in den Build, wenn das Paket `actN` `released: true` hat, auch wenn ein `core`-Glob sie trifft (`tools/build/packs-plugin.ts`); ein Test in `tests/unit/packs*.test.ts` deckt das ab
**Und** `pnpm build` ist grün: `act2` ≤ 40 MB, `core` wächst höchstens um die Kopfdateien, `act1` wird nicht größer; `pnpm content:lock` läuft nicht, `content/released-ids.json` entsteht erst beim echten Release
**Und** `duePacks` lädt `act2`, sobald `c.act ≥ 2` ist (`reachedAct` in `src/app/state/packs.ts` liest `c.act`); ist das Paket noch nicht geladen, zeigt die Weltkarte den Ladezustand (Story 7.2).

**Angenommen** das Outro von 1-8 ist vorbei und `c.act` ist gerade 2 geworden
**Wenn** der Spieler zur Weltkarte zurückkehrt
**Dann** erscheint einmal eine kurze Titeltafel „Akt 2 · Glut“ (Schlüssel `act.2.title` in DE und EN); bis das Bild aus dem Grafik-Task `art/prompts/act2_title.md` da ist, ist sie Text auf Glutgrund
**Und** danach lichtet sich der Nebel über der Eisenmark (`fogTop(world, 2)` deckt nur noch Aurenhall ab, das Regions-Schild „Eisenmark“ verschwindet), das Akt-Band zeigt „Akt 2 · Herbst – Glut“ (neuer Schlüssel `act.2.season`)
**Und** ob die Tafel gezeigt wurde, hält das neue Feld `c.actTitleSeen` (höchster gezeigter Akt, Standard aus `normalizeCampaign` = 1), gesetzt über ein Command; ein aus Akt 1 hochgeholter Spielstand sieht die Tafel also beim ersten Öffnen der Weltkarte
**Und** solange Akt 2 keine Knoten hat, zeigt die Weltkarte „Weitere Missionen folgen“ (`moreMissionsFollow`); `WorldMap.tsx`, `Camp.tsx` und `BackupSheet.tsx` lesen den Akt aus `c.act`.

**Angenommen** die Story ist fertig
**Wenn** geprüft wird
**Dann** decken Tests `actTitleSeen` (Tafel genau einmal, auch nach einem hochgeholten Stand), `duePacks`/`reachedAct` mit `c.act` und die Build-Regel für `acts/actN/` ab
**Und** Screenshots bei 375 × 812 zeigen Titeltafel, gelichtete Weltkarte und Kampagnen-Liste mit „Akt 2“.

### Story 11.4: Simulation über Akte

Als Produktinhaber
möchte ich Akt 2 in der Simulation verkettet nach Akt 1 und an jeder möglichen Position einer Mission spielen lassen,
damit jede Missions-Story ihren Korridor an der frühesten und spätesten Position prüfen kann.

**Abhängigkeiten:** nach 11.1 (Übergang) und 11.2 (`nodeLevel`, Fixture-Karte); alle Missions-Stories ab 11.10 und die Abstimmung 11.22 nutzen die Optionen.

**Akzeptanzkriterien:**

**Angenommen** die Simulation über Akte
**Wenn** `pnpm sim --campaign act2` läuft
**Dann** spielt jeder Lauf Akt 1 bis zum Finale, wechselt per `finishMission`-Regel in Akt 2 und spielt dessen Story-Knoten; der Bericht nennt Armee-Stufe und Gold beim Eintritt in Akt 2, die Goldkurve prüft `perAct['2']`
**Und** neue Optionen: `--start expected` (Startarmee ohne Akt-1-Lauf auf der Positionsstufe), `--position <k>` (Mission so spielen, als wären k Akt-2-Missionen erledigt; setzt P), `--order m2_4,m2_5,…` (Reihenfolge der Akt-Mitte), `--map-file <pfad>` (Fixture-Karte mit der verketteten Armee); `pnpm sim <mapId>` findet Knoten aller Akte; die Optionen stehen im Kopf von `tools/simulate.ts`
**Und** `tests/unit/sim-acts.test.ts` belegt denselben Bericht bei gleichem Seed, `--position k` setzt P, `--order` erzwingt die Reihenfolge und `--map-file` spielt `dev_eisenmark` mit der verketteten Armee.

### Story 11.5: Gefährten und Leutnants von Akt 2

Als Spieler
möchte ich in Akt 2 sieben neue Gefährten und vier neue Leutnants mit eigenem Charakter treffen,
damit der Akt neue Gesichter, Rivalen und Beute bringt.

**Abhängigkeiten:** nach 11.1 (`acts/act2/units.yaml`, Loader) und 11.2 (Beitrittsstufe); Item-Bilder nach Story 8.5; die Händler-Liste `roomLevel: 2` wirkt erst mit Story 10.9 (siehe unten). Wird die Story zu groß, bei Bedarf die Stahl-Items samt Händler-Stufen abtrennen.

**Akzeptanzkriterien:**

**Angenommen** `acts/act2/units.yaml` aus 11.1
**Wenn** die Werte ergänzt sind
**Dann** hat jeder Gefährte Basiswerte auf Stufe 10, persönliches Wachstum (Summe 320–340 % wie Akt 1), Affinität, persönliche Fähigkeit, Startausrüstung und Support-Partner laut Narrative; Vorschlag `[ASSUMPTION]`:

| ID | Klasse | Affinität | Basis Stufe 10 (TP/STR/MAG/GES/SCH/GLK/VER/RES) | Wachstum % (gleiche Reihenfolge) | persönliche Fähigkeit (nur vorhandene Effekt-Formen) | Ausrüstung | Supports |
|---|---|---|---|---|---|---|---|
| `jory` | minstrel | Wind | 23/6/6/10/11/10/4/7 | 60/30/35/45/50/55/20/40 | `stage_presence`: passiv, `adjacentAllies: 1` → Ausweichen +15 | `steel_dagger`, `travel_lute`, `vulnerary` | nell |
| `odile` | skirmisher | Wasser | 26/9/1/12/12/5/7/3 | 70/45/5/50/50/40/35/35 | `sworn_guard`: passiv, `adjacentAllies: 1` → VER +2, RES +2 | `steel_sword`, `iron_helm`, `vulnerary` | varek, sable |
| `nell` | scout | Wasser | 24/8/0/12/12/7/5/3 | 70/40/5/55/55/50/25/30 | `smugglers_stash`: passiv, `bagChargeSaveChance: 30` | `steel_dagger`, `door_key`, `vulnerary` | jory, varek |
| `brann` | elementalist | Erde (fest) | 22/2/10/7/7/4/6/7 | 70/15/55/35/35/35/45/40 | `buried_glow`: passiv, `hpBelowPercent: 50` → MAG +3 | `stone_fist`, `rockfall`, `vulnerary` | ilka |
| `amos` | healer | Erde | 22/2/9/6/6/9/5/10 | 70/20/45/35/30/45/30/55 | `field_surgeon`: passiv, `healBonus: 5` | `mend_staff`, `heal_staff`, `vulnerary` | liora, grosk |
| `ilka` | marksman | Wind | 24/9/0/13/10/5/5/3 | 65/45/5/60/50/45/25/35 | `still_hunter`: passiv, `notMovedThisTurn` → Treffer +10, Krit +5 | `steel_bow`, `vulnerary` | sable, brann |
| `sable` | skirmisher | Feuer | 30/12/1/13/12/6/9/4 | 75/50/5/50/45/35/40/30 | `old_orders`: beim Angriff, `hpBelowPercent: 50` → Schaden +2 | `steel_sword`, `dravns_oath`, `vulnerary` | odile, ilka |

**Und** `level` aller sieben ist 10, die Beitrittsstufe rechnet 11.2 (P − 1); die persönlichen Fähigkeiten stehen in `skills.yaml` (Quelle `personal`), Namen in DE und EN.

**Angenommen** `acts/act2/lieutenants.yaml`
**Wenn** `content:check` (`validateLieutenants`) läuft
**Dann** sind Rowena, Sable (`joins: true`), Grell und Brakka mit `class`, `faction`, `signatureItem`, drei `grudgeSkills`, `titleKey`, `scene: scn.lt.<id>`, `portrait`/`model` = vorhandene Dateien angelegt; Vorschlag `[ASSUMPTION]`:

| ID | Klasse | Fraktion | Signatur | Groll 1 / 2 / 3 (Quelle `grudge`, nur vorhandene Effekt-Formen) | Erkennungsformel | Titel (DE) |
|---|---|---|---|---|---|---|
| `rowena` | `pegasus_knight` | `silver_lance` | `wing_lance` | `dive` (Angreifer: Schaden +3) / `silver_resolve` (passiv: Treffer +15) / `wing_retreat` (nach der Aktion +2 Bewegung) | „Für Aldric und die Silberne Lanze!“ | Ritterin der Silbernen Lanze |
| `sable` | `skirmisher` | `iron_march` | `dravns_oath` | `oath_guard` (nicht bewegt: VER/RES +3) / `last_order` (verteidigt unter 50 % TP: schlägt zuerst) / `iron_discipline` (Aura Radius 1: Verbündete VER +2, Form wie `warden_ward`) | „Befehl ist Befehl.“ | Hauptfrau des Grenzheers |
| `grell` | `skirmisher` | `silver_sea` | `gold_hook` | `boarding_party` (2 Verbündete am Ziel: Treffer +10, Schaden +2) / `dirty_hook` (Angriff: Krit +10) / `sea_legs` (Rundenbeginn: 10 % Heilung) | „Alles hat seinen Preis.“ | Kaperkapitän des Hauses Silbermeer |
| `brakka` | `brakka_wyvern` | `free_blades` | `wyvern_cleaver` | `wyvern_dive` (Angreifer: Schaden +4) / `scale_hide` (unter 50 % TP: VER +3) / `over_the_lines` (zieht durch Gegner) | „Wer mehr zahlt, hat recht.“ | Wyvernreiterin der Meistbietenden |

**Und** Brakka hat eine eigene Unikat-Klasse `brakka_wyvern` im Abschnitt „Gegnertypen“ von `classes.yaml`: `tier: unique`, `playable: false`, `moveType: flier`, `tags: [flier]`, `weaponGroups: [axe]`, `mov: 6`, Werte zäher und stärker, aber langsamer als der Pegasusritter (`base { hp: 22, str: 7, mag: 0, skl: 4, spd: 4, lck: 1, def: 7, res: 0 }`, `growth { hp: 85, str: 50, mag: 0, skl: 30, spd: 30, lck: 15, def: 35, res: 5 }`, `caps { hp: 60, str: 27, mag: 8, skl: 22, spd: 20, lck: 20, def: 26, res: 12 }`) `[ASSUMPTION]`; `content:check` meldet jede andere Einheit dieser Klasse als Fehler (keine generischen Wyvernreiter)
**Und** auf Karten tragen die Leutnants Eisen (`iron_lance`, `iron_sword`, `iron_sword`, `iron_axe`), damit die Groll-Stufe über `tierUp` greift.

**Angenommen** die Szenen `content/acts/act2/scenes/scn.lt.{rowena,sable,grell,brakka}.yaml`
**Wenn** sie geschrieben sind
**Dann** hat jede die Zeilen `first`, `grudge_1..3` (mit `{target}`), `flee_1..3` und `mock` (Gedenk-Spott mit `{target}`), Sable zusätzlich `join` (Seitenwechsel nach E7, Bezug auf das gewarnte Dorf); die Erkennungsformel steht in `first` und in mindestens einer weiteren Zeile; Englisch in `content/locales/en/act2.dialogue.yaml`, Titel `lt.<id>.title` in DE und EN
**Und** die erste Begegnung spielt `first`, egal in welcher Mission sie liegt (Grell in 2-2 oder 2-5, Rowena in 2-4 oder 2-6, Sable in 2-3, 2-5 oder 2-6).

**Angenommen** der Block `# Akt 2: Stahl-Tier (Story 11.5)` in `content/core/items.yaml`
**Wenn** die fehlenden Teile aus `items.md` §6.1/§6.6 angelegt sind
**Dann** gibt es `steel_dagger`, `armorpiercer`, `stiletto`, `blaze`, `gale_blade`, `stone_fist`, `whirlpool`, `light_lance`, `shade` (Dunkel-Zauber; nicht `shadow`, das ist die Klassen-Id aus Story 10.3), `physic_staff`, `round_shield`, `crystal_focus`, `steel_helm`, `scale_mail` mit Werten nach der Ableitungsregel `[ASSUMPTION]`: Waffen gegenüber dem Eisen-Pendant Mt +3, Treffer −10 bis −15, Gewicht ×1,5–2, Preis 900–1 200 (Beispiele `steel_dagger` Mt 7/Tr 75/Krit 10/Gew 6/900; `armorpiercer` Mt 6/Tr 75/`effectiveVs: [armored]`/1 100; `stiletto` Mt 5/Tr 80/Krit 25/1 200); Zauber nach ihrem Eisen-Pendant mit Element und Zustand wie dort; `physic_staff` Reichweite 1–3, Heilung wie `heal_staff`; Rüstung VER +1–2 über Eisen (`round_shield` VER +2 und Ausweichen +10, `steel_helm` VER 3, `scale_mail` mittel VER 6, `crystal_focus` Nebenhand RES +3)
**Und** die vier Signaturen haben `rarity: legendary`, Preis 1 500 `[ASSUMPTION]` und die Werte der Stahlwaffe ihrer Gruppe plus einen Effekt: `wing_lance` = `steel_lance` + `grantsSkill wing_retreat` (40 SP); `dravns_oath` = `steel_sword` + `grantsSkill last_order` (45 SP); `gold_hook` = `steel_sword` mit Krit +20; `wyvern_cleaver` = `steel_axe` + `effectiveVs: [armored]`
**Und** `ember_spark` (Epic 10) bleibt unberührt; Item-Bilder sind Platzhalter, bis Story 8.5 sie nachzieht; Namen und Beschreibungen in DE und EN.

**Angenommen** die Akt-Schlüssel in `balance.yaml`
**Wenn** sie ergänzt sind
**Dann** gilt `lieutenant.bounty.materialByAct: { 1: iron_ore, 2: moonsteel }` und `lieutenant.scaling.tierUp` kennt zusätzlich `iron_dagger: steel_dagger`
**Und** der Händler von Akt 2 bekommt Stufe 1 (über `merchantTier` der Knoten: `blaze`, `gale_blade`, `stone_fist`, `whirlpool`, `light_lance`, `armorpiercer`, `steel_dagger`, `hammer`, `longbow`, `round_shield`, `steel_helm`, `scale_mail`, `physic_staff`, `crystal_focus`) und Stufe 2 (`storyCount: 4`: `stiletto`, `shade`, `tower_shield`) `[ASSUMPTION]`; Händler-Stufe 3 (Glutfunke) gehört Epic 10
**Und** eine Händler-Liste mit `roomLevel: 2` (Mechanik Story 10.9) bietet `stiletto`, `shade` und `tower_shield` schon ab Händler-Stufe 1 des Akts an, wenn der Händler der Burg Stufe 2 hat `[ASSUMPTION]` (Ableitung aus `items.md` §6: Teile der Akt-Stufe 2 früher); ist Story 10.9 noch nicht gemergt, trägt 10.9 die Liste nach, weil das nicht strikte Händler-Schema das Feld sonst still verwirft.

**Angenommen** `content/acts/act2/flags.yaml`
**Wenn** `content:check` läuft
**Dann** sind alle Flags von Akt 2 deklariert, bevor eine Missions-Story sie setzt oder abfragt: die Entscheidungen `e05`, `e06`, `e07`, `e08` und `joined_sable`, `brandhang_burned`, `maelis_ledgers` (story, `season2: true`), `chronicle_read` (story, `season2: true`); so lassen sich Missions- und Nebenquest-Stories in jeder Reihenfolge der Stränge bauen.

**Angenommen** die Testkarte `dev_eisenmark`
**Wenn** dort alle vier Leutnants stehen
**Dann** zeigen Steckbrief, Groll-Zeilen, Flucht und Kopfgeld (Mondstahl) die neuen Daten; Tests decken Beitrittsstufe, Groll-Fähigkeiten und die Unikat-Regel ab
**Und** Musik, Klang und Vertonung der Leutnant-Zeilen: später.

### Story 11.6: Balliste

Als Spieler
möchte ich Ballisten bedienen, erobern und gegen mich gerichtet sehen,
damit Geschütze den Akt taktisch prägen.

**Abhängigkeiten:** nach 11.2 (Fixture-Karte `dev_eisenmark`); `--map-file` aus Story 11.4; Gefahrenzone aus Story 13.5; Story 11.10 löst die Lektion in 2-1 aus.

**Akzeptanzkriterien:**

**Angenommen** ein Kartenobjekt `type: ballista`
**Wenn** eine Figur zu Fuß oder in Rüstung auf einem Nachbarfeld steht (Abstand 1, jedes Team, nie ein Flieger)
**Dann** kann sie mit der Aktion `{ kind: 'ballista'; object; target }` im Command `act` schießen: Reichweite 3–10 ab dem Ballistenfeld, Ziel sichtbar (Nebel), Schaden nach der physischen Formel mit Mt 12 + STR des Bedieners, Treffer 70 als Waffenwert in der normalen Trefferformel, Krit 0, kein Gegenangriff, Waffendreieck und Waffengruppe des Bedieners zählen nicht, keine Effektivität gegen Flieger, unbegrenzte Munition, ein Schuss je Bediener und Zug (er ersetzt dessen Aktion)
**Und** die Werte stehen im Item `ballista_bolt` (`kind: weapon`, Gruppe `siege` außerhalb des Dreiecks, `mt: 12`, `hit: 70`, `crit: 0`, `rng: [3, 10]`, Tag `fixed`: nie im Tross, nie beim Händler), nicht im Code
**Und** Vorschau (`forecast`) und Auflösung (`resolveAttack`) laufen über denselben Formelcode mit einer synthetischen Waffen-Instanz (Uid `ballista:<objectId>`) und dem Ballistenfeld als Schussposition; fehlende Parameter (Waffengruppe ignorieren, kein Gegenangriff) kommen als Option in `AttackMods`, nicht als zweiter Rechenweg; Leutnants zeigen „flieht“
**Und** das Ballistenfeld ist für Einheiten nicht betretbar; das Kontext-Band bietet „Balliste“ an, sobald eine berechtigte Figur daneben steht (Schlüssel in DE und EN).

**Angenommen** die Gegner-KI (auch Autoplay der Simulation)
**Wenn** eine Balliste auf der Karte steht
**Dann** nutzt eine Gegnereinheit sie nur, wenn sie das Profil `hold` hat oder schon daneben steht (Produktinhaber 2026-10-31; kein `guard`, kein Hinlaufen „in Reichweite“); dann bewertet sie den Schuss wie einen Angriff; andere Gegner laufen nicht zur Balliste
**Und** das Autoplay des Spielers nutzt eine Balliste, wenn eine eigene Figur daneben steht und der Schuss besser bewertet ist als ihr bester Angriff
**Und** die Gefahrenzone (Story 13.5) zählt einen Bediener mit seiner Ballisten-Reichweite.

**Angenommen** die Lektion zur Balliste
**Wenn** Story 11.10 sie in 2-1 auslöst
**Dann** steht die Lektionsszene `scn.m2_1.tutorial_ballista` (Bedienen, Reichweite, kein Gegenangriff) im Handbuch unter Lektionen (`lesson_ballista`), dazu der Regel-Eintrag „Balliste“ mit Kontext-Anker.

**Angenommen** die Testkarte `dev_eisenmark` aus Story 11.2
**Wenn** sie um zwei Ballisten erweitert ist
**Dann** sind die Werte der Balliste dort geprüft (`__hc.devMap`, mit Story 11.4 auch `pnpm sim --map-file tests/fixtures/maps/dev_eisenmark.yaml --start expected`; Dev Agent Record)
**Und** `tests/unit/ballista.test.ts` deckt Nachbarschaft, Flieger als Bediener verboten, Reichweite 2/3/10/11, Nebel, kein Gegenangriff, keine Flieger-Effektivität, Vorschau = Auflösung, Leutnant-Flucht, die KI-Regel (`hold` oder schon daneben; ein `guard`-Gegner in Reichweite nutzt sie nicht) und Replay ab.

**Angenommen** fehlende Grafik
**Wenn** die Story abgeschlossen ist
**Dann** ist die Balliste ein Requisitenmodell (`tools/art/blender_*.py`) oder eine Platzhalter-Requisite mit `propFallback`
**Und** Klang der Balliste: später.

### Story 11.7: Flieger, Gegner, Herbst und Heimsuchungen von Akt 2

Als Spieler
möchte ich in Akt 2 auf Ritter, Pegasusritter und neue Gegnergruppen im herbstlichen Hochland treffen,
damit Flieger und neue Gegner den Akt prägen.

**Abhängigkeiten:** nach 11.2 (Positionsstufe, Fixture-Karte) und 11.5 (Rowena, Unikat-Klasse `brakka_wyvern`, Stahl-Items für die Pools); Story 11.10 löst die Flieger-Lektion in 2-1 aus.

**Akzeptanzkriterien:**

**Angenommen** die generischen Gegner von Akt 2 aus vorhandenen Klassen
**Wenn** sie auf Karten und in Heimsuchungen stehen
**Dann** gibt es diese Gruppen mit eigenen Namen in DE und EN: Eisenmark-Soldaten (`vanguard`/Lanze, `skirmisher`/Schwert, `marksman`/Bogen; `unit.iron_soldier.name`), Eisenmark-Ritter (`knight`; `unit.iron_knight.name`), Lanzenritter und Pegasusritter der Silbernen Lanze (`knight`, `pegasus_knight`; `unit.lance_knight.name`, `unit.lance_pegasus.name`), Kaperfahrer der Herzogin (`brigand`/`skirmisher`/`marksman`; `unit.privateer.name`), Söldner (`brigand`/`skirmisher`/`marksman`/`vanguard`; `unit.sellsword.name`) und Kontorwachen (`vanguard`/`marksman`; `unit.counting_guard.name`)
**Und** `knight` und `pegasus_knight` sind auf Stufe 11–20 geprüft: Ritter verwundbar gegen Axt, Magie und Panzerstecher, Pegasusritter gegen Bögen (×3); Korrekturen nur im Block „Gegnertypen“ von `classes.yaml`; beide bekommen `art:` mit vorhandenen Porträts als Platzhalter
**Und** es gibt keine generischen Wyvernreiter.

**Angenommen** eine Einheit mit Bewegungsart Flieger (Pegasusritter, Rowena, Brakka)
**Wenn** sie auf dem Brett steht
**Dann** spielt sie nach den Flieger-Regeln (Gelände, Bewegung, Sicht +1, Bogen-Effektivität), wird aber mit ihrer Figur zu Fuß dargestellt
**Und** eine Flieger-Kennung macht sie erkennbar, nicht nur über Farbe (NFR10): ein Flügel-Symbol neben der Lebensleiste, in der Gegner-Leiste und im Steckbrief, dazu ein leichter Schwebe-Versatz mit Schatten am Boden `[ASSUMPTION]` (Werte in `render.yaml`)
**Und** die Kampfvorschau zeigt die Bogen-Effektivität gegen Flieger.

**Angenommen** die Lektion zu Fliegern
**Wenn** Story 11.10 sie in 2-1 auslöst
**Dann** steht die Lektionsszene `scn.m2_1.tutorial_flier` (Bögen ×3 gegen Flieger, Flieger ignorieren Gelände) im Handbuch unter Lektionen (`lesson_flier`), dazu der Regel-Eintrag „Flieger“ mit Kontext-Anker und Klassen-Steckbriefe für `knight`, `pegasus_knight` und `brakka_wyvern`, falls `validateHandbook` sie verlangt.

**Angenommen** Herbst auf dem Brett (`map.act = 2`)
**Wenn** eine Akt-2-Karte oder eine Heimsuchung in Akt 2 läuft
**Dann** zeigt der Boden Herbstfarben (braunes Gras, Heide) aus `tools/art/ground.py` als Akt-Variante, Berge tragen eine Haube ohne Grün; Tönung `look.season.2` und Herbstbäume `variants.tree.2` sind vorhanden
**Und** Wetter in Akt 2: `clear`, `fog`, `rain`; `ash` und `snow` bleiben gesperrt (Ausnahme N4, Story 11.18)
**Und** ein Screenshot vergleicht dieselbe Testkarte in Akt 1 und Akt 2.

**Angenommen** Heimsuchungen in Akt 2
**Wenn** sie gespielt werden
**Dann** wählt das Brett die Jahreszeit nach `c.act`, nicht nach dem Ordner der Karte (Heimsuchungen auf Akt-1-Karten sehen in Akt 2 herbstlich aus).

**Angenommen** `content/acts/act2/haunts.yaml`
**Wenn** Heimsuchungen in Akt 2 entstehen
**Dann** gibt es Pools je Fraktion mit Stahl-Waffen (`share` in %) `[ASSUMPTION]`: `iron_march` (Sable) vanguard 30, knight 20, marksman 25, skirmisher 25; `silver_lance` (Rowena) knight 30, pegasus_knight 30, skirmisher 20, marksman 20; `silver_sea` (Grell) brigand 35, skirmisher 35, marksman 30; `free_blades` (Brakka) skirmisher 35, brigand 35, marksman 30; dazu `civilian` und `chestLoot` (Gold 300–500, Mondstahl)
**Und** Heimsuchungs-Gegner stehen auf `hauntLevel` (Positionsstufe), Leutnants skalieren wie gewohnt.

**Angenommen** die Testkarte `dev_eisenmark` aus Story 11.2
**Wenn** sie erweitert ist
**Dann** zeigt sie alle generischen Gegner von Akt 2, Rowena und Brakka als Flieger und Herbstgelände; die Werte der Gegner sind dort geprüft (Dev Agent Record).

**Angenommen** fehlende Grafik
**Wenn** die Story abgeschlossen ist
**Dann** gibt es Prompt-Dateien (`art/prompts/<id>_board_turnaround.md`, Tripo-Pipeline §4.6) für die Brettfiguren Eisenmark-Soldat, Eisenmark-Ritter, Pegasusritter (zu Fuß) und Kaperfahrer; bis dahin dienen vorhandene Modelle über `art`/`sprite` als Platzhalter (vermerkt in `art/README.md`)
**Und** Pegasus- und Wyvern-Reittiere (Rowena, Brakka, Pegasusritter) sind ein eigener Grafik-Task (`art/prompts/mounts_pegasus_wyvern.md`, großer Rahmen `figureBudget.large`), Ziel vor 2-4; er blockiert keine Story, bis dahin gilt die Darstellung zu Fuß mit Flieger-Kennung

### Story 11.8: Ziel-Phasen (Kern)

Als Spieler
möchte ich, dass ein Missionsziel mitten im Kampf wechseln kann,
damit eine große Schlacht wie Kronfeld erst Halten und dann Flucht verlangt.

**Abhängigkeiten:** nach 11.1; braucht keine Akt-2-Karte (Fixture-Karte); Story 11.17 (Kronfeld) nutzt die Phasen als Erste.

**Akzeptanzkriterien:**

**Angenommen** die Kern-Erweiterung „Ziel-Phasen“
**Wenn** eine Karte `victory: { type: survive, turns: 8, then: { type: escape, area, minShare: 50, must: [avatar, kael] } }` hat
**Dann** gilt bis zum Ende von Runde 8 das Ziel `survive`; zu Beginn von Runde 9 wechselt das Ziel auf `escape` (Event `objectiveChanged`, Rundenpille und Zieltext wechseln, die Fluchtzone erscheint markiert), ein Trigger `objective_changed` kann eine Szene starten
**Und** in der Fluchtphase dürfen Figuren in der Fluchtzone die Aktion `escape` nutzen; Kael flieht wie bisher als Letzter (`mustStayForRest`); der Sieg fällt, sobald Avatar und Kael geflohen sind und mindestens `ceil(minShare % × n)` Figuren geflohen sind
**Und** `n` ist die Zahl der Eingesetzten, die zu Beginn der Fluchtphase noch leben (Produktinhaber 2026-10-31, Readiness-Runde R3); was mit Niedergestreckten geschieht, die bei Sieg auf dem Brett liegen, regelt die vorhandene `escape`-Regel des Prologs
**Und** Schema (`schemas.ts`), Typen (`defs.ts`), `objectives.ts`, KI-Ziele (`ai.ts`), Autoplay und `content:check` kennen die Phase; Vorschau, Gefahrenzone und Zielanzeige lesen das aktive Ziel; Tests decken Wechsel, Sieg, Niederlage (Avatar oder Kael fällt) und Replay ab
**Und** eine Fixture-Karte `tests/fixtures/maps/dev_phases.yaml` (`survive` 2 Runden, dann `escape`) zeigt den Wechsel über `__hc.devMap`; Architektur §5.7 bekommt einen Absatz „Stand (Story 11.8)“.

### Story 11.9: Relikt-Stufen

Als Spieler
möchte ich, dass Relikte mit der Geschichte erwachen,
damit besondere Fundstücke mit dem Akt mitwachsen.

**Abhängigkeiten:** nach 11.1; Stufen mit der Bedingung `completed m2_8` trägt Story 11.17 ein, sobald der Knoten existiert (`content:check` lehnt unbekannte Knoten ab); `dragon_ember` legt diese Story an, Story 11.19 legt es in N5 in eine Truhe; Stufen-Bilder als Grafik-Task (Story 8.5).

**Akzeptanzkriterien:**

**Angenommen** Relikte erwachen mit der Story (`items.md` §5)
**Wenn** ein Relikt eine Stufe erreicht
**Dann** beschreibt das Item `stages` mit Bedingung (`requires`), Bild und Wirkung je Stufe; die Stufe ergibt sich als reine Funktion aus dem Kampagnenstand (ist der Story-Punkt beim Erhalt schon erreicht, gilt die Stufe sofort), Vorschau und Werte lesen sie
**Und** `dragon_ember` (Accessoire, unverkäuflich) hat Stufe 1 schlafend MAG +2 (Stufe 2 erwachend MAG +3 und Feuer-Affinität ab `completed m2_8` trägt Story 11.17 ein, Stufe 3 erwacht ab 3-6 mit Schutz vor Brennen Epic 12) `[ASSUMPTION]`; `pact_warden_shield` bekommt Stufe 2 ab `completed m1_6` (Stufe 3 ab `completed m2_8` trägt Story 11.17 ein) mit Wirkungen nach `items.md` §5 `[ASSUMPTION]`
**Und** ein Spielstand aus dem Akt-1-Release mit `pact_warden_shield` und erledigtem `m1_6` zeigt beim Laden sofort Stufe 2
**Und** Tests decken Stufenwechsel und Vorschau = Auflösung ab; die Stufen-Bilder sind ein Grafik-Task (Story 8.5), bis dahin gilt das Bild der Stufe 1.

### Story 11.10: Mission 2-1 „Wind über der Eisenmark“ und die drei Angebote

Als Spieler
möchte ich im Hochland der Eisenmark gegen Brakka standhalten und danach die drei Angebote der Thronanwärter hören,
damit Akt 2 mit Fliegern, Balliste und einer politischen Wahl beginnt.

**Abhängigkeiten:** nach 11.2 (Positionsstufe), 11.3 (Paket, Titeltafel), 11.4 (`--position`), 11.5 (Jory, Brakka), 11.6 (Balliste, Lektion) und 11.7 (Flieger, Söldner, Herbst, Lektion).

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_1_passwacht`, 14×16 (kompakt): Hochlandpass am Rand der Eisenmark, verlassene Grenzwacht mit einer Balliste auf dem Wall, Gauklerwagen am Wegrand, Felsgrate nur für Flieger frei; Mittag, `clear` `[ASSUMPTION]` |
| Ziel | `survive`, 7 Runden `[ASSUMPTION]` |
| Gegner Normal (Leicht/Schwer) | 13 = 8 Start + 5 in Wellen (Runde 2, 4, 5): Brakka + 12 Söldner (4 skirmisher, 4 brigand, 3 marksman, 1 vanguard); Leicht 11 (−2 Wellen-Söldner), Schwer 15 (+2 Söldner in Runde 5) `[ASSUMPTION]` |
| Position und Stufe | Position 0 (fest), P = 11; Start +0, Wellen +1 |
| Leutnant | Brakka, erste Begegnung in Akt 2; von einem ungenannten Auftraggeber bezahlt `[ASSUMPTION]` |
| Szenen | `scn.m2_1.intro`, `scn.m2_1.brakka_battle`, `scn.m2_1.tutorial_flier`, `scn.m2_1.tutorial_ballista`, `scn.m2_1.house_wagon`, `scn.m2_1.house_watch`, `scn.m2_1.outro` mit Jorys Beitritt und Tafel 5 „Drei Angebote“ (Key Conversation 6: Seraphine, Dravn, Maelis, Kael) |
| Beitritte | Jory per Knotenwirkung `recruit: jory` nach dem Sieg |
| Entscheidungen und Flags | keine Entscheidung; die drei Angebote sind Gespräch, keine Wahl |
| Freischaltung | `fixed: first`; danach öffnen `m2_2`, `m2_4`, `m2_6` und N6 |
| Heimsuchungs-Anker | 3: `defend` (Gauklerwagen), `boss` (Passhöhe), `rout` (Grenzwacht) |
| Einsatzplätze | 7 (Pflicht: Avatar, Kael) |
| Gold | 2 000 `[ASSUMPTION]`; `merchantTier: 0` |
| Nebenziele | `kill_with` Bogen (300 Gold), `visit_villages` Wagen + Wachstube (`remedy_salve`), `no_downs` (`vulnerary`) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 bei Position 0 (`--position 0`), vorläufig ohne Aufstieg |

**Akzeptanzkriterien:**

**Angenommen** die Karte `m2_1_passwacht`, der Knoten `m2_1` (`fixed: first`, `place` = Platzhalter `grauwacht` bis zum Ortsbild-Task) und die Szenen der Tabelle
**Wenn** die Mission startet
**Dann** führt das Intro in die Eisenmark (Herbst, Wind, Drachenschatten am Himmel als Bild in der Szene), Brakka erscheint mit `first` und ihrer Erkennungsformel
**Und** in Runde 1 der Spielerphase läuft `scn.m2_1.tutorial_flier` (Lektion Flieger); betritt zum ersten Mal eine eigene Figur ein Nachbarfeld der Balliste (Trigger `unit_enters`), läuft `scn.m2_1.tutorial_ballista`; beide höchstens einmal je Kampf und im Handbuch nachlesbar.

**Angenommen** die Truppe hält 7 Runden
**Wenn** die Mission gewonnen ist
**Dann** tritt Jory bei (Stufe nach 11.2), die Truppe erhält 2 000 Gold und die Nebenziel-Belohnungen
**Und** die Nachszene zeigt Tafel 5 „Drei Angebote“ (Bild per Grafik-Task `art/prompts/tafel_drei_angebote.md`, bis dahin Platzhalter); Seraphine bietet Freispruch gegen das Siegel im Salzpass, Dravn gegen den Wyvernhorst, Maelis gegen ihr verschwundenes Gold; Kael schließt das Gespräch mit einer eigenen Zeile (Abnahme per Screenshot)
**Und** auf der Weltkarte öffnen 2-2, 2-4, 2-6 und N6, jeder Knoten zeigt „Stufe ≈ 12“.

**Angenommen** die Söldner und die Balliste
**Wenn** die Simulation läuft
**Dann** nutzt kein Söldner die Balliste, es sei denn, er steht schon daneben (Profil `hold` am Wall, ein Bogenschütze) `[ASSUMPTION]`
**Und** `pnpm sim m2_1 --runs 50 --start expected --position 0` liegt auf allen Schwierigkeiten im Korridor; Brakka flieht im Normal-Schnitt mindestens in 30 % der Läufe `[ASSUMPTION]`.

### Story 11.11: Mission 2-2 „Das Siegel im Salzpass“

Als Spieler
möchte ich für Prinzessin Seraphine im Nebel des Salzpasses das Siegel bergen, bevor Grells Kaperfahrer es finden,
damit der Prinzessin-Strang beginnt und Nell zur Truppe stößt.

**Abhängigkeiten:** nach 11.10 (Knoten `m2_1`, Freischaltung) und 11.5 (Nell, Grell); Chronik-Wirkung aus Akt 1.

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_2_salzpass`, 16×22: langer Pass zwischen Klippen, Karawanenwagen als Deckung, Kriegsnebel (`fog: true`), Wetter `fog`, Morgen; Klippen nur für Flieger; Nell gefesselt in einem Käfigwagen der Kaperfahrer `[ASSUMPTION]` |
| Ziel | `treasure`: 4 Truhen (Siegel, Schmuggelgold, Karawanenkasse, Vorrat), 12 Runden `[ASSUMPTION]` |
| Gegner Normal (Leicht/Schwer) | 15 = 10 Start + 5 in 2 Wellen von beiden Passenden (Runde 3, 6): Grell + 5 brigand, 5 skirmisher, 4 marksman (Kaperfahrer); Leicht 13, Schwer 17 `[ASSUMPTION]` |
| Position und Stufe | Position 1–5, P = 12–16; Start +0, Wellen +1, Grells Leibwache +2 |
| Leutnant | Grell (Herzogin), erste oder zweite Begegnung |
| Szenen | `scn.m2_2.intro` (Seraphines Gesandter: das Siegel ist für den Freispruch-Erlass), `scn.m2_2.grell_battle`, `scn.m2_2.nell_talk`, `scn.m2_2.page` (Chronik-Truhe), `scn.m2_2.outro` (Nell erkennt die Geldwege der Herzogin, erster Zweifel am Erlass) |
| Beitritte | Nell: Ansprechen am Käfigwagen (`recruit: { by: any }`); spricht sie niemand an, tritt sie nach dem Sieg per Knotenwirkung bei (wirkt nur, wenn sie noch nicht dabei ist) `[ASSUMPTION]` |
| Entscheidungen und Flags | keine; Chronik-Seite `a2_saltpass` |
| Freischaltung | `requires: completed m2_1`; öffnet `m2_3` |
| Heimsuchungs-Anker | 3: `treasure`, `escort`, `boss` |
| Einsatzplätze | 8 |
| Gold | 2 300 `[ASSUMPTION]`; `merchantTier: 1` |
| Nebenziele | `recruit nell` (300 Gold), `open_chests` (Chronik-Truhe, Seite `a2_saltpass`), `turn_limit` 9 (`steel_helm`) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 bei Position 1 und 5 |

**Akzeptanzkriterien:**

**Angenommen** die Karte, der Knoten `m2_2` (`place: salzpass`) und die Szenen der Tabelle
**Wenn** die Mission läuft
**Dann** verbergen Kriegsnebel und Wetter `fog` die Truhen, bis eine Figur sie sieht; Späher öffnen ohne Schlüssel, die Karte bringt einen Öffner mit (`validateTreasure`)
**Und** die Chronik-Truhe gehört nicht zu den Ziel-Truhen; wer sie öffnet, erhält die Seite `a2_saltpass` (Wirkung `chronicle`, Thema „dass sie beim Paktfest etwas gaben“, ≤ 400 Zeichen, DE in `acts/act2/chronicle.yaml`, EN in `locales/en/act2.chronicle.yaml`).

**Angenommen** alle 4 Ziel-Truhen sind in 12 Runden geborgen
**Wenn** die Mission gewonnen ist
**Dann** ist Nell dabei, die Truppe erhält 2 300 Gold und die Nebenziel-Belohnungen; nach Runde 12 ohne alle Truhen ist die Mission verloren (`defeatReason = 'turns'`)
**Und** die Nachszene sät Zweifel, ohne eine Lüge aufzudecken: das Siegel ist für den Freispruch-Erlass gedacht, und Nell wundert sich, wer den Pass für die Kaperfahrer bezahlt.

**Angenommen** die Simulation
**Wenn** `pnpm sim m2_2 --runs 50 --start expected --position 1` und `--position 5` laufen
**Dann** liegen beide im Korridor; das Autoplay öffnet die Ziel-Truhen mit Spähern oder Schlüsseln.

### Story 11.12: Mission 2-3 „Die verstoßene Leibwache“ und Entscheidung E5

Als Spieler
möchte ich Odile, die entlassene Leibwächterin der Prinzessin, durch Dravns Linien geleiten,
damit der Prinzessin-Strang eine Brückenfigur und eine persönliche Wahl bekommt.

**Abhängigkeiten:** nach 11.11 (Knoten `m2_2`); Flag `joined_sable` aus 11.5 (gesetzt erst in 11.14, die Mission prüft beide Fälle); Profil `follow_ally` und `silverwing` legt diese Story an.

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_3_muehlweg`, 16×20: Waldweg unter der Grauwacht, Odile versteckt in einer Mühle in der Kartenmitte, Start der Truppe im Süden, Ausgang am Nordrand hinter Dravns Postenlinie; Abend, `rain`; im Lager der Posten das erbeutete Banner der Silbernen Lanze `[ASSUMPTION]` |
| Ziel | `escort` Odile zum Ausgang, `join: true`; Odile mit neuem Profil `follow_ally` |
| Gegner Normal (Leicht/Schwer) | 16 = 12 Start + 4 Welle (Runde 4, aus der Grauwacht): Sable + 4 vanguard, 3 knight, 4 marksman, 4 skirmisher (Eisenmark); Leicht 14, Schwer 18 `[ASSUMPTION]` |
| Position und Stufe | Position 2–6, P = 13–17; Posten +1, Welle +2 |
| Leutnant | Sable (Dravn); hat sie per E7 gewechselt, fehlt sie ohne Ersatz-Leutnant |
| Szenen | `scn.m2_3.intro` (Seraphines Bitte), `scn.m2_3.sable_battle`, `scn.m2_3.odile_talk` (erstes Treffen an der Mühle), `scn.m2_3.house_banner`, `scn.m2_3.outro` mit E5 |
| Beitritte | Odile über die Eskorte (`join: true`) |
| Entscheidungen und Flags | E5 `e05: [return, stay]`: `return` → Wirkung `leave: odile` (Ausrüstung bleibt im Konvoi), `stay` → bleibt; Odile berichtet von Halvards Briefen an die Prinzessin (Zweifel, keine aufgedeckte Lüge) |
| Freischaltung | `requires: completed m2_2` |
| Heimsuchungs-Anker | 3: `escort`, `rout`, `defend` |
| Einsatzplätze | 9 |
| Gold | 2 600 `[ASSUMPTION]`; `merchantTier: 1` |
| Nebenziele | Banner der Silbernen Lanze erobern (Besuch des Zelts → `silverwing`), `no_downs` (`vulnerary` ×2), `turn_limit` 10 (500 Gold) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 bei Position 2 und 6 |

**Akzeptanzkriterien:**

**Angenommen** das neue KI-Profil `follow_ally` (Eskorte, Lehre aus 1-3: das vorhandene `follow` zieht selbst zum Ausgang)
**Wenn** Odile in der Phase `other` zieht
**Dann** wartet sie, bis eine Spielerfigur höchstens `balance.ai.followRadius` entfernt ist, und zieht dann auf ein Feld möglichst nah bei der nächsten Spielerfigur (Abstand 1 bevorzugt), mit Wegkosten `followDanger` je bedrohendem Gegner wie beim vorhandenen `follow`
**Und** sie greift nie selbst an, verteidigt sich aber mit normalem Gegenangriff `[ASSUMPTION]`
**Und** steht eine Spielerfigur im Ausgang oder auf einem Nachbarfeld davon und erreicht Odile ein Ausgangsfeld, zieht sie hinein und entkommt (`gone = 'escaped'`, Event `escaped`); das Ziel `escort` gilt dann als erfüllt
**Und** das Profil steht in `schemas.ts` und `defs.ts`, `validateEscort` akzeptiert `follow` oder `follow_ally`, Gegner gewichten Odile wie ein Schutzziel (`objectiveBonus`); Tests decken Folgen, Warten, Gefahr meiden, Entkommen und Replay ab
**Und** das Autoplay bewegt die Truppe als Block zum Ausgang, damit Odile folgt.

**Angenommen** die Karte, der Knoten `m2_3` (`place: grauwacht`) und die Szenen
**Wenn** die Truppe die Mühle erreicht
**Dann** läuft `scn.m2_3.odile_talk`, Odile wird sichtbar (Team `other`, Klasse `skirmisher`, Figur `odile`) und folgt ab jetzt
**Und** ist `joined_sable` gesetzt, entfällt Sable per `requires` an der Einheit (Muster `grosk` in `m1_8`), ihre Kampfzeile entfällt
**Und** wird Odile niedergestreckt oder fällt sie, ist die Mission verloren (Niederlagegrund Odile).

**Angenommen** Odile entkommt
**Wenn** die Mission gewonnen ist
**Dann** tritt Odile bei (Stufe nach 11.2), wer das Banner-Zelt besucht hat, besitzt `silverwing` (Werte nach `items.md` §6.4 `[ASSUMPTION]`: `steel_lance` Mt +2, Krit +10, `rarity: legendary`, Preis 0, `unsellable`)
**Und** in der Nachszene bietet Seraphine Odile die Rückkehr in die Garde an (E5) mit Folgen-Karte; bei `return` verlässt Odile die Truppe mit einer Abschiedszeile, ihre Ausrüstung geht in den Konvoi, das Flag `e05: return` bestimmt ihre Zeile in Kronfeld (11.17)
**Und** die Akademie (Raum-Gefährten Varek|Odile, Epic 10) bleibt auf ihrer gebauten Stufe, auch wenn Odile geht (Entscheidung E10-2); Stufe 2 kostet ohnehin nur Gold, nur Stufe 3 braucht Varek oder Odile (Readiness-Runde R2); gehen beide (E5 `return`, E6 `pardon`), nennt die Folgen-Karte der zweiten dieser Entscheidungen, dass die Akademie Stufe 3 nicht mehr erreicht `[ASSUMPTION]`; fällt E6 als zweite, baut Story 11.13 den Hinweis; hat die Akademie schon Stufe 3, entfällt er.

**Angenommen** die Simulation
**Wenn** `pnpm sim m2_3 --runs 50 --start expected --position 2` und `--position 6` laufen, je mit und ohne `joined_sable`
**Dann** liegen alle im Korridor.

### Story 11.13: Mission 2-4 „Der Wyvernhorst“ und Entscheidung E6

Als Spieler
möchte ich für General Dravn die Silberne Lanze vom Wyvernhorst vertreiben und Dame Rowena stellen,
damit der Dravn-Strang beginnt und Ilka zur Truppe stößt.

**Abhängigkeiten:** nach 11.10 (Knoten `m2_1`), 11.5 (Ilka, Rowena), 11.6 (Balliste) und 11.7 (Flieger-Darstellung); die Groll-Wirkung mit Puffer (unten) legt diese Story an.

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_4_wyvernhorst`, 16×22: Felshorst über einer Schlucht, Dravns Wyvern-Zucht (leere Nester als Gelände), Berge und Klippen (Flieger frei, Fußtruppen gebunden), zwei Ballisten der Zucht; Morgen, `clear`; Ilka spürt am Schluchtrand der Lanze nach `[ASSUMPTION]` |
| Ziel | `boss` Rowena (Flucht bei 0 TP zählt als besiegt) |
| Gegner Normal (Leicht/Schwer) | 16 = 13 Start + 3 Welle (Runde 3, Pegasusritter aus der Schlucht): Rowena + 5 pegasus_knight, 4 knight, 3 marksman, 3 skirmisher (Silberne Lanze); Leicht 14, Schwer 18 `[ASSUMPTION]` |
| Position und Stufe | Position 1–5, P = 12–16; Start +0, Welle +1, Ritter am Horst +2 |
| Leutnant | Rowena (Prinzessin) als Boss |
| Szenen | `scn.m2_4.intro` (Dravns Auftrag), `scn.m2_4.rowena_battle`, `scn.m2_4.ilka_talk`, `scn.m2_4.page`, `scn.m2_4.outro` mit E6 |
| Beitritte | Ilka: Ansprechen (`recruit: { by: any }`, Team `other`, Profil `hold`); sonst Knotenwirkung nach dem Sieg (nur wenn noch nicht dabei) `[ASSUMPTION]` |
| Entscheidungen und Flags | E6 `e06: [pardon, stay]`: `pardon` → `leave: varek` (Ausrüstung in den Konvoi), `stay` → `grudge { lt: sable, delta: -1, buffer: true }` (Puffer, siehe unten); Chronik-Seite `a2_eyrie` |
| Freischaltung | `requires: completed m2_1`; öffnet `m2_5` und N4 |
| Heimsuchungs-Anker | 3: `boss`, `rout`, `treasure` |
| Einsatzplätze | 8 |
| Gold | 2 400 `[ASSUMPTION]`; `merchantTier: 1` |
| Nebenziele | `recruit ilka` (300 Gold), `open_chests` (Chronik-Truhe in der alten Wächterkammer, Seite `a2_eyrie`), `kill_with` Bogen (`steel_bow`) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 bei Position 1 und 5 |

**Akzeptanzkriterien:**

**Angenommen** die Karte, der Knoten `m2_4` (Ortsbild per Grafik-Task, bis dahin `grauwacht`) und die Szenen
**Wenn** die Mission läuft
**Dann** stehen Ritter am Horst mit Profil `hold` direkt neben den Ballisten und schießen von dort (Regel 11.6: nur `hold` oder schon daneben); die Truppe kann die Ballisten erobern und gegen Rowena nutzen (ohne Flieger-Effektivität)
**Und** Rowena erscheint als Flieger zu Fuß mit Flieger-Kennung (Reittier-Task aus 11.7 nicht nötig).

**Angenommen** Rowena flieht bei 0 TP
**Wenn** die Mission damit gewonnen ist
**Dann** steigt ihr Groll, Kopfgeld (Mondstahl) wird gezahlt, Ilka ist dabei, die Truppe erhält 2 400 Gold
**Und** in der Nachszene bietet Dravn Varek Begnadigung im Heer an (E6) mit Folgen-Karte; ist Varek tot oder gegangen, entfällt E6 ohne Szene der Wahl (Muster E1)
**Und** bei `pardon` verlässt Varek die Truppe mit Abschiedszeile, seine Ausrüstung geht in den Konvoi; seine Kronfeld-Zeile wechselt auf die Gegenseite (11.17); bei `stay` sinkt Sables Groll um 1; hat sie Groll 0 (auch vor dem ersten Treffen), entfällt stattdessen ihre nächste Groll-Steigerung (Produktinhaber 2026-10-31, Readiness-Runde R3): `grudge` mit `buffer: true` legt dafür `c.grudgeBuffer[lt]` an (Default `{}` aus `normalizeCampaign`), die nächste Steigerung verbraucht ihn `[ASSUMPTION]` (Feldname und Umsetzung); Tests für Groll 0 und Groll ≥ 1
**Und** Taverne und Akademie (Raum-Gefährte Varek) bleiben auf ihrer gebauten Stufe (E10-2), Stufe 2 bleibt ohne Varek baubar (Readiness-Runde R2)
**Und** ist Odile schon gegangen (E5 `return`, Story 11.12) und wählt der Spieler hier `pardon`, nennt die Folgen-Karte von E6, dass die Akademie Stufe 3 nicht mehr erreicht (dasselbe Kriterium wie in 11.12, je nachdem, welche der beiden Entscheidungen als zweite fällt); hat die Akademie schon Stufe 3, entfällt der Hinweis.

**Angenommen** die Simulation
**Wenn** `pnpm sim m2_4 --runs 50 --start expected --position 1` und `--position 5` laufen
**Dann** liegen beide im Korridor; Rowena fällt im Normal-Schnitt nicht vor Runde 4 `[ASSUMPTION]`.

### Story 11.14: Mission 2-5 „Die Brandschneise“ und Entscheidung E7

Als Spieler
möchte ich Sables Heimatdorf gegen Grells Plünderer verteidigen und dabei Dravns Lüge aufdecken,
damit die Gewissensfrage des Akts fällt und Sable die Seite wechseln kann.

**Abhängigkeiten:** nach 11.13 (Knoten `m2_4`) und 11.5 (Brann, Sable, Flags `e07`, `joined_sable`, `brandhang_burned`); Summe und Deckel der Rabatte baut Story 10.9 (der Test dieser Story prüft E7 allein).

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_5_brandhang`, 16×20: Herbstdorf am Hang, Heufelder (brennbar), 5 besuchbare Häuser mit Flüchtlingen, Branns Hütte am oberen Rand; Sable mit einem Brandtrupp am Ortsrand (Team `other`, Profil `hold`, nicht angreifbar); Abend, `clear` |
| Ziel | `defend` Dorfvorsteher (Zivilist, Team `other`), 10 Runden `[ASSUMPTION]` |
| Gegner Normal (Leicht/Schwer) | 17 = 11 Start + 6 in Wellen (Runde 2, 5, 7): Grell + 6 brigand (4 mit Profil `raider` auf Häuser), 6 skirmisher, 4 marksman (Kaperfahrer); Leicht 15, Schwer 19 `[ASSUMPTION]` |
| Position und Stufe | Position 2–6, P = 13–17; Start +0, Wellen +1, Grells Maate +2 |
| Leutnant | Grell (Herzogin); Sable anwesend, nicht feindlich, gilt als getroffen |
| Szenen | `scn.m2_5.intro` (Dravns Auftrag: das Dorf schützen), `scn.m2_5.grell_battle`, `scn.m2_5.brann_talk`, `scn.m2_5.sable_order` (Trigger Runde 5: Sable trägt den Befehl, das Dorf nach dem Kampf als Brandschneise zu opfern), `scn.m2_5.house_*`, `scn.m2_5.outro` mit E7 |
| Beitritte | Brann: Ansprechen an seiner Hütte (`recruit: { by: any }`), sonst Knotenwirkung nach dem Sieg; Sable bei E7 `warn` |
| Entscheidungen und Flags | E7 `e07: [warn, obey]`: `warn` → `recruit { lt: sable }` (Flag `joined_sable`), `obey` → `priceMod { pct: -10, act: 2 }` + `setFlag brandhang_burned`; Lüge Dravns aufgedeckt |
| Freischaltung | `requires: completed m2_4`; öffnet N5 |
| Heimsuchungs-Anker | 3: `defend`, `rout`, `escort` |
| Einsatzplätze | 9 |
| Gold | 2 700 `[ASSUMPTION]`; `merchantTier: 1` |
| Nebenziele | `visit_villages` alle 5 Häuser vor den Plünderern („alle Flüchtlinge gerettet“) → `dawnbreaker`; `recruit brann` (300 Gold); `no_downs` (`vulnerary`) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 bei Position 2 und 6 |

**Akzeptanzkriterien:**

**Angenommen** die Karte, der Knoten `m2_5` (`place: brandhang`) und die Szenen
**Wenn** die Mission läuft
**Dann** steht Sable sichtbar als Dravns Offizierin auf dem Brett (Team `other`, `untargetable`, Profil `hold`), ihre erste Begegnung zählt (Wirkung `meet`, Zeile `first` aus `scn.lt.sable`); die Gegner-KI greift sie nicht an
**Und** in Runde 5 deckt `scn.m2_5.sable_order` Dravns Lüge auf (Grenzdörfer als Brandschneise gegen die Drachen); Drachenschatten ziehen in der Szene über den Hang
**Und** Plünderer mit Profil `raider` zerstören Häuser; ein Besuch vorher rettet die Flüchtlinge des Hauses.

**Angenommen** der Vorsteher übersteht 10 Runden
**Wenn** die Mission gewonnen ist
**Dann** ist Brann dabei, wer alle 5 Häuser gerettet hat, erhält `dawnbreaker` (Werte des vorhandenen Eintrags auf Akt-2-Niveau geprüft, Kommentar „Kap. 4“ korrigiert)
**Und** in der Nachszene fällt E7 mit Folgen-Karte: bei `warn` warnt die Truppe das Dorf, Sable bindet sich das glutorange Tuch um und tritt bei (Zeile `join`; Stufe nach `joinLieutenant`; Groll gegen sie und von ihr erlischt); bei `obey` brennt Brandhang (Weltkarten-Variante von Brandhang, Szenenzeile), Dravns Gunst gibt Händler −10 % in Akt 2, Sable bleibt Leutnant
**Und** N5 öffnet.

**Angenommen** die Weltkarten-Variante „Brandhang brennt“
**Wenn** `brandhang_burned` gesetzt ist
**Dann** zeigt der Ort `brandhang` auf der Weltkarte seine Variante: `worldSchema.places[]` (`src/content/schemas.ts`) kennt `variants: [{ requires, image?, label? }]`, die erste erfüllte Variante gilt, `content:check` prüft Bedingungen und Bilder; `content/world/valmora.yaml` trägt die Variante mit der Flag-Bedingung `brandhang_burned` `[ASSUMPTION]` (höchstens 2 Varianten je Ort, Narrative „Weltkarte“)
**Und** das Bild `brandhang_burned` ist ein Grafik-Task (`art/prompts/brandhang_burned.md`, `licensing.md` §6); bis dahin zeigt die Variante das vorhandene Ortsbild entsättigt als Platzhalter `[ASSUMPTION]`.

**Angenommen** E7 `obey` und der Händler von Akt 2
**Wenn** der Händler Preise rechnet
**Dann** gilt der `priceMod` von E7 (−10 % in Akt 2) über das vorhandene `shopPrice`, getestet mit −10 % allein; Summe und Deckel bis −30 % baut nur Story 10.9 (`economy.maxDiscountPct`), diese Story legt keinen eigenen Schlüssel an.

**Angenommen** die Simulation
**Wenn** `pnpm sim m2_5 --runs 50 --start expected --position 2` und `--position 6` laufen
**Dann** liegen beide im Korridor; der Bericht nennt den Anteil der Läufe mit allen Häusern gerettet.

### Story 11.15: Mission 2-6 „Gold für Banditen“

Als Spieler
möchte ich für Herzogin Maelis ihr verschwundenes Gold aus einem Banditenlager holen und dort Rowena und Sable vertreiben,
damit der Verdacht wächst, dass Maelis die Banden aus Akt 1 bezahlt hat.

**Abhängigkeiten:** nach 11.10 (Knoten `m2_1`) und 11.5 (Amos, Rowena, Sable, Flags `joined_sable`, `e07`).

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_6_canyon`, 16×22: Banditenlager im Canyon des Tafellands, Kisten mit Silbermeer-Münzen, ein Feldlazarett, in dem Amos verwundete Banditen behandelt; Truppen der Silbernen Lanze und des Grenzheers haben das Lager zuerst gestürmt `[ASSUMPTION]`; Nachmittag, `clear` |
| Ziel | `rout` |
| Gegner Normal (Leicht/Schwer) | 16 = 13 Start + 3 Welle (Runde 4, Pegasusritter vom Canyonrand): Rowena + 3 pegasus_knight, 2 knight, 2 skirmisher (Lanze); Sable + 2 vanguard, 3 marksman, 2 skirmisher (Grenzheer); Leicht 14, Schwer 18 `[ASSUMPTION]` |
| Position und Stufe | Position 1–5, P = 12–16; Start +0, Welle +1, Ersatz-Hauptmann +2 |
| Leutnants | Rowena (Prinzessin), Sable (Dravn); ist `joined_sable` gesetzt, ersetzt sie ein Eisenmark-Hauptmann (`unit.iron_captain.name`, `skirmisher`, kein Leutnant) |
| Szenen | `scn.m2_6.intro` (Maelis' Auftrag), `scn.m2_6.rowena_battle`, `scn.m2_6.sable_battle`, `scn.m2_6.amos_talk`, `scn.m2_6.coins` (Fund: Silbermeer-Münzen als Sold der Banden), `scn.m2_6.burnt_village`, `scn.m2_6.outro` (Verdacht gegen Maelis) |
| Beitritte | Amos: Ansprechen im Lazarett (Team `other`, Profil `hold`), sonst Knotenwirkung nach dem Sieg |
| Entscheidungen und Flags | keine Entscheidung |
| Freischaltung | `requires: completed m2_1`; öffnet `m2_7` |
| Heimsuchungs-Anker | 3: `rout`, `boss`, `defend` |
| Einsatzplätze | 8 |
| Gold | 2 200 `[ASSUMPTION]`; `merchantTier: 1` |
| Nebenziele | `recruit amos` (300 Gold), `protect_npc` Amos (`physic_staff`), `turn_limit` 10 (400 Gold) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 bei Position 1 und 5, je mit und ohne `joined_sable` |

**Akzeptanzkriterien:**

**Angenommen** die Karte, der Knoten `m2_6` (Ortsbild per Grafik-Task, bis dahin Platzhalter) und die Szenen
**Wenn** die Mission läuft
**Dann** kämpft die Truppe nur gegen Leute der beiden anderen Anwärter; Amos steht als Team `other` im Lazarett, Gegner greifen ihn an, wenn er in Reichweite ist (Nebenziel `protect_npc`)
**Und** ist `joined_sable` gesetzt, entfallen Sable und `scn.m2_6.sable_battle` per `requires`, der Ersatz-Hauptmann steht an ihrem Platz.

**Angenommen** alle Gegner sind besiegt oder vertrieben
**Wenn** die Mission gewonnen ist
**Dann** ist Amos dabei, die Truppe erhält 2 200 Gold, in der Nachszene findet sie Silbermeer-Münzen als Sold der Banden; Nell (falls dabei, Ersatzsprecher-Kette) erkennt die Prägung; der Verdacht öffnet 2-7
**Und** Beat 9 „ein Dorf brennt“: Nur bei `e07: warn` zeigt `scn.m2_6.burnt_village` auf dem Rückweg ein von Drachenschatten verbranntes Dorf (nur Szene, kein Kampf); ist E7 noch offen (2-6 vor 2-5) oder `obey`, entfällt die Szene, damit nie zwei Dörfer brennen (Produktinhaber 2026-10-31, Readiness-Runde R3); Tests für `warn`, `obey` und offen.

**Angenommen** die Simulation
**Wenn** `pnpm sim m2_6 --runs 50 --start expected --position 1` und `--position 5` laufen
**Dann** liegen alle Varianten im Korridor.

### Story 11.16: Mission 2-7 „Das Kontor am Silbermeer“ und Entscheidung E8

Als Spieler
möchte ich im Kontor der Herzogin die Geschäftsbücher sichern, obwohl sie Brakka zum Vertuschen angeheuert hat,
damit der Beweis gegen Maelis in meiner Hand liegt.

**Abhängigkeiten:** nach 11.15 (Knoten `m2_6`) und 11.5 (Brakka, Flags `e08`, `maelis_ledgers`).

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_7_kontor`, 16×20: Hafen bei Nacht, Lagerhäuser mit Türen (Schlüssel oder Späher), Laternen als Lichter, Archiv im Nordosten, Kriegsnebel (`fog: true`), Wetter `rain` |
| Ziel | `reach`: eine beliebige eigene Figur erreicht das Archiv |
| Gegner Normal (Leicht/Schwer) | 16 = 12 Start + 4 Welle (Runde 4, Söldner vom Kai): Brakka + 4 skirmisher, 3 brigand, 2 marksman (Söldner) + 3 vanguard, 2 marksman, 1 knight (Kontorwachen); Leicht 14, Schwer 18 `[ASSUMPTION]` |
| Position und Stufe | Position 2–6, P = 13–17; Wachen +0, Söldner +1, Archivwache +2 |
| Leutnant | Brakka (von Maelis angeheuert) |
| Szenen | `scn.m2_7.intro`, `scn.m2_7.brakka_battle`, `scn.m2_7.ledgers` (Bücher gefunden), `scn.m2_7.page`, `scn.m2_7.outro` mit E8 |
| Beitritte | keine |
| Entscheidungen und Flags | E8 `e08: [seraphine, sell]`: `seraphine` → `grudge { lt: grell, delta: -1 }`, `sell` → +1 000 Gold `[ASSUMPTION]`; Flag `maelis_ledgers` (story, `season2: true`) bei Sieg; Chronik-Seite `a2_ledger` |
| Freischaltung | `requires: completed m2_6` |
| Heimsuchungs-Anker | 3: `treasure`, `rout`, `boss` |
| Einsatzplätze | 9 |
| Gold | 2 800 `[ASSUMPTION]`; `merchantTier: 1` |
| Nebenziele | `open_chests` (Chronik-Truhe im Schreibzimmer, Seite `a2_ledger`), `turn_limit` 8 (Mondstahl ×2), `no_downs` (`vulnerary`) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 bei Position 2 und 6 |

**Akzeptanzkriterien:**

**Angenommen** die Karte, der Knoten `m2_7` (Ortsbild per Grafik-Task, bis dahin Platzhalter) und die Szenen
**Wenn** die Mission läuft
**Dann** kämpft die Truppe gegen Brakkas Söldner und Kontorwachen der eigenen Auftraggeberin: 2-7 ist der bewusste Bruch mit Maelis; die Ausnahme von der Regel „immer gegen die Leute der anderen Anwärter“ steht im Narrative-Log (Entscheidung A2-1)
**Und** das Intro macht den Bruch klar (Maelis ließ Brakka anheuern, um die Bücher verschwinden zu lassen).

**Angenommen** eine Figur erreicht das Archiv
**Wenn** die Mission gewonnen ist
**Dann** läuft `scn.m2_7.ledgers`, das Flag `maelis_ledgers` ist gesetzt, die Truppe erhält 2 800 Gold
**Und** in der Nachszene fällt E8 mit Folgen-Karte: `seraphine` gibt die Beweise an die Prinzessin (Grell-Groll −1, Kronfeld-Zeile in 11.17), `sell` verkauft sie an Maelis zurück (+1 000 Gold).

**Angenommen** die Simulation
**Wenn** `pnpm sim m2_7 --runs 50 --start expected --position 2` und `--position 6` laufen
**Dann** liegen beide im Korridor; das Autoplay öffnet Türen mit Spähern oder Schlüsseln.

### Story 11.17: Mission 2-8 „Kronfeld“ (Finale, große Schlacht)

Als Spieler
möchte ich in Kronfeld den Freispruch empfangen, verraten werden und mit der Truppe entkommen,
damit Akt 2 mit „Die Krone war hohl“ endet.

**Abhängigkeiten:** nach 11.8 (Ziel-Phasen), 11.9 (Relikt-Stufen), 11.6 (Balliste) und allen übrigen Missionen 11.10–11.16 (`fixed: finale`, Varianten aus `e05`, `e06`, `e08`, `joined_sable`).

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `m2_8_kronfeld`, 24×28: weites Feld mit Bannern, Verhandlungszelt in der Mitte, Start der Truppe am Zelt, Fluchtzone am Nordrand (Waldsaum), zwei Ballisten am Feldrand; Abend, `clear` |
| Ziel | Phasen (Story 11.8): `survive` 8 Runden, dann `escape`: Sieg, wenn Avatar, Kael und mindestens die Hälfte der zu Beginn der Fluchtphase (Runde 9) noch lebenden Eingesetzten geflohen sind |
| Gegner Normal (Leicht/Schwer) | ~30 = 15 Start + je 5 in Runde 2, 4, 6; in der Fluchtphase je 3 alle 2 Runden `[ASSUMPTION]`. Garde der Prinzessin als Hauptmacht (6 knight, 5 pegasus_knight, 3 skirmisher, 3 marksman), Grenzheer (3 vanguard, 2 marksman), Kaperfahrer (2 brigand, 2 skirmisher), dazu die Leutnants; Leicht 26, Schwer 34 |
| Position und Stufe | Position 7 (fest), P = 11 + 7 + `levelBonus: 1` = 19 `[ASSUMPTION]`; Start +0, Wellen +1, Garde-Ritter +2 (Stufe 21 über `levelCap` 20 ist erlaubt, der Deckel gilt nur für die Truppe) |
| Leutnants | Rowena (führt), Grell, Brakka, Sable (falls nicht gewechselt) |
| Szenen | `scn.m2_8.intro` (Freispruch-Treffen, Erlass mit dem Siegel aus 2-2), `scn.m2_8.betrayal` mit Tafel 6 „Kronfeld: der Verrat“, Leutnant-Zeilen `scn.m2_8.<lt>_battle`, `scn.m2_8.escape_open` (Beginn Runde 9), `scn.m2_8.outro` mit Tafel 7 „Die Krone war hohl“ (Key Conversation 8: Seraphine, Kael; Beats 11 und 12); Seraphine und Halvard nur in Szenen |
| Beitritte | keine |
| Entscheidungen und Flags | keine Entscheidung; Varianten: `e05: return` (Odile spricht eine Zeile auf der Gegenseite), `e06: pardon` (Varek ebenso), `e08: seraphine` (Seraphine hält die Beweise gegen Maelis) |
| Freischaltung | `fixed: finale` (nach allen anderen Story-Knoten von Akt 2) |
| Heimsuchungs-Anker | 0 |
| Einsatzplätze | bis 15; Söldner der Taverne dürfen auffüllen |
| Gold | 3 000 `[ASSUMPTION]`; `merchantTier: 2`; keine Glutfunken |
| Nebenziele | `no_downs` (Mondstahl ×3) `[ASSUMPTION]` |
| Sim-Korridor | NFR12 am oberen Rand (Normal 75–85 % Sieg, 0,9–1,3 Niedergestreckte) bei Position 7 `[ASSUMPTION]` |

**Akzeptanzkriterien:**

**Angenommen** die Ziel-Phasen aus Story 11.8
**Wenn** die Karte `victory: { type: survive, turns: 8, then: { type: escape, area, minShare: 50, must: [avatar, kael] } }` trägt
**Dann** wechselt das Ziel zu Beginn von Runde 9, `scn.m2_8.escape_open` läuft über den Trigger `objective_changed`, und der Sieg zählt die Hälfte der dann noch lebenden Eingesetzten.

**Angenommen** die Karte, der Knoten `m2_8` (`place: kronfeld`, `levelBonus: 1`) und die Szenen
**Wenn** die Schlacht beginnt
**Dann** läuft im Intro das Freispruch-Treffen, in Runde 1 der Verrat (Tafel 6, Bild per Grafik-Task `art/prompts/tafel_kronfeld_verrat.md`, bis dahin Platzhalter); Seraphine liefert die Truppe aus, weil Halvard ihr einflüstert, das Aschenbanner sei schuldig
**Und** die Leutnants sprechen ihre Kampfzeilen; ist `joined_sable` gesetzt, fehlen Sable und ihre Zeile (Muster `grosk` in `m1_8`); Odile und Varek stehen nach `return` bzw. `pardon` nicht auf dem Brett, sie sprechen nur ihre Szenenzeile auf der Gegenseite
**Und** die Einsatzwahl erlaubt bis zu 15 Figuren, Söldner der Taverne füllen auf.

**Angenommen** die Truppe entkommt
**Wenn** die Mission gewonnen ist
**Dann** folgt Tafel 7 „Die Krone war hohl“ (Bild per Grafik-Task, bis dahin Platzhalter): der Pakt hält durch ein Opfer, Seraphine glaubt, sie werde Königin; Ersatzsprecher-Kette für Gefährtenzeilen
**Und** Akt 2 ist beendet (`actFinished`); ohne Paket `act3` zeigt die Weltkarte „Akt 3 „Krone“ erscheint bald“ (Story 7.3); 2-8 gibt keinen Glutfunken
**Und** die Relikt-Stufen, die laut `items.md` §5 an 2-8 hängen, erwachen: Schild der Paktwächter Stufe 3, Drachenglut Stufe 2 (Mechanik aus Story 11.9); diese Story trägt die Stufen mit `completed m2_8` in `items.yaml` ein.

**Angenommen** das Referenzgerät (Pixel 6a / iPhone 12) und Story 7.7
**Wenn** eine komplette Gegnerphase mit ~30 Gegnern und 15 eigenen Figuren läuft
**Dann** hält sie 60 FPS (NFR1) und jede Gegnereinheit braucht unter 300 ms KI-Rechenzeit im Web Worker (NFR3); die Messung steht im Dev Agent Record
**Und** `pnpm sim m2_8 --runs 50 --start expected --position 7` liegt auf allen Schwierigkeiten im Korridor, Normal am oberen Rand; Spielzeit 30–45 Minuten laut GDD.

### Story 11.18: Nebenquest N4 „Der Clan im Schnee“

Als Spieler
möchte ich Ilkas Jägerclan gegen Dravns Vorposten im frühen Schnee beistehen,
damit Ilka ihre Geschichte und ihren Signaturbogen bekommt.

**Abhängigkeiten:** nach 11.13 (Knoten `m2_4`) und 11.5 (Ilka); Funken-Moment aus Story 10.2.

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `n4_clan`, 14×16: Clanlager im Hochland bei frühem Schnee (Wetter `snow`, nur auf dieser Karte in Akt 2), Kriegsnebel, Zelte und Felsen; Morgen |
| Ziel | `defend` Clanälteste (Zivilistin), 8 Runden `[ASSUMPTION]` |
| Gegner Normal (Leicht/Schwer) | 12 = 8 Start + 4 Welle (Runde 3): Dravns Vorposten (3 vanguard, 2 knight, 3 marksman, 3 skirmisher) + ein Vorposten-Hauptmann (`skirmisher`, kein Leutnant); Leicht 10, Schwer 14 `[ASSUMPTION]` |
| Position und Stufe | P beim Spielen (frühestens 13, wenn 2-4 als 2. Mission), Offsets +0 bis +2 |
| Leutnant | keiner |
| Szenen | `scn.n4.intro`, `scn.n4.outro`, `scn.n4.memorial_intro`, `scn.n4.memorial_outro` |
| Auslöser | `completed m2_4` + `any: [alive ilka, dead ilka]` (gegangen = keine Quest), `memorialIf: { dead: ilka }`; bleibt über Akte offen |
| Einsatzplätze | 7; Ilka Pflicht, wenn sie lebt |
| Belohnung | Glutfunke (Knotenwirkung) + Signaturbogen `white_wolf`, auch in der Gedenk-Variante |
| Gold | 1 400 `[ASSUMPTION]` (≈ 55 % einer Story-Mission) |
| Nebenziele | `no_downs` (`vulnerary`), `visit_villages` 2 Zelte (Mondstahl) `[ASSUMPTION]` |
| Heimsuchungs-Anker | 0 |

**Akzeptanzkriterien:**

**Angenommen** N4 und Wetter `snow`
**Wenn** `content:check` läuft
**Dann** erlaubt `render.yaml` Schnee in Akt 2 nur für die Karte `n4_clan` (Eintrag `weather.snow.maps: [n4_clan]` neben `acts: [3]`); jede andere Akt-2-Karte mit `snow` ist ein Fehler.

**Angenommen** Ilka ist in der Truppe oder gefallen und 2-4 ist gespielt
**Wenn** der Spieler N4 gewinnt
**Dann** erhält er einen Glutfunken und `white_wolf` (Bogen, Werte `steel_bow`, `rarity: legendary`, Effekt „Nebel und Schnee kosten keine Sicht“: Sicht des Trägers im Kriegsnebel +3 zusätzlich zum Rollen-Bonus `[ASSUMPTION]`); ist Ilka gefallen, laufen die Gedenk-Szenen und die Belohnung kommt trotzdem
**Und** ist Ilka gegangen, erscheint N4 nicht
**Und** beim Erhalt des Glutfunkens spielt der Funken-Moment (`src/ui/Sparks.tsx`, Story 10.2) über dem Missionsergebnis (FR44 „Erhalt als Moment“).

**Angenommen** das Nebenquest-Gold
**Wenn** die Story abgeschlossen ist
**Dann** liegt das Gold von N4 bei ≈ 55 % einer Story-Mission (1 300–1 600; GDD „Wirtschaft“ ist seit 2026-10-31 nachgezogen, nur prüfen)
**Und** `pnpm sim n4 --start expected --position 2` (frühester Zeitpunkt) und `--position 7` liegen im Korridor.

### Story 11.19: Nebenquest N5 „Glut unter dem Berg“

Als Spieler
möchte ich in Branns alter Mine die Drachenglut finden,
damit Akt 2 neben dem Hauptstrang eine Lore-Geschichte hat.

**Abhängigkeiten:** nach 11.14 (Knoten `m2_5`, Flag `brandhang_burned`) und 11.9 (`dragon_ember` mit Stufen); Funken-Moment aus Story 10.2; `earth_rune_3` existiert.

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `n5_mine`, 14×18: Branns alte Mine bei Brandhang, Glutadern im Fels als Lichtquellen (kein Drache), Kriegsnebel, enge Stollen |
| Ziel | `treasure`: 4 Truhen (Relikt `dragon_ember`, `earth_rune_3`, Chronik-Seite `a2_mine`, Mondstahl ×3), 12 Runden `[ASSUMPTION]` |
| Gegner Normal (Leicht/Schwer) | 12 = 9 Start + 3 Welle (Runde 4): Plünderer der Herzogin (4 brigand, 4 skirmisher, 3 marksman) + ein Vorarbeiter (`brigand`, kein Leutnant); Leicht 10, Schwer 14 `[ASSUMPTION]` |
| Position und Stufe | P beim Spielen (frühestens 14), Offsets +0 bis +2 |
| Leutnant | keiner |
| Szenen | `scn.n5.intro` (Zeile je `brandhang_burned`), `scn.n5.relic`, `scn.n5.page`, `scn.n5.outro` |
| Auslöser | `completed m2_5`; keine Gedenk-Variante (Lore); bleibt über Akte offen |
| Einsatzplätze | 7, keine Pflichtfigur außer Avatar und Kael |
| Belohnung | Glutfunke (Knotenwirkung); Relikt, Rune und Seite aus den Ziel-Truhen |
| Gold | 1 500 `[ASSUMPTION]` |
| Nebenziele | `turn_limit` 9 (`remedy_salve`), `no_downs` (`vulnerary`) `[ASSUMPTION]` |
| Heimsuchungs-Anker | 0 |

**Akzeptanzkriterien:**

**Angenommen** 2-5 ist gespielt
**Wenn** der Spieler N5 gewinnt
**Dann** erhält er einen Glutfunken (Knotenwirkung) und aus den Truhen `dragon_ember`, `earth_rune_3` und die Seite `a2_mine` (Akt-2-Thema, ≤ 400 Zeichen, DE und EN); die Chronik zeigt die Seite
**Und** das Intro nennt Brandhang verbrannt oder gerettet je nach `brandhang_burned`; Brann spricht unter `requires: alive`, sonst Ersatzsprecher
**Und** beim Erhalt des Glutfunkens spielt der Funken-Moment (`src/ui/Sparks.tsx`, Story 10.2) über dem Missionsergebnis (FR44 „Erhalt als Moment“).

**Angenommen** das Nebenquest-Gold
**Wenn** die Story abgeschlossen ist
**Dann** liegt das Gold von N5 bei ≈ 55 % einer Story-Mission (1 300–1 600; GDD „Wirtschaft“ ist seit 2026-10-31 nachgezogen, nur prüfen)
**Und** `pnpm sim n5 --start expected --position 3` (frühester Zeitpunkt) und `--position 7` liegen im Korridor.

### Story 11.20: Nebenquest N6 „Die Gauklertruppe“

Als Spieler
möchte ich mit Jory seiner alten Gauklertruppe gegen ihre Schuldeneintreiber beistehen,
damit der Spielmann seine Geschichte und seine Signaturlaute bekommt.

**Abhängigkeiten:** nach 11.10 (Knoten `m2_1`, Jory) und 10.4 (Anfeuern auf zwei Ziele über `cheerTargets`).

| Feld | Inhalt |
|---|---|
| Kartenidee und Größe | `n6_jahrmarkt`, 16×16: Jahrmarkt in einem Herbstdorf, Bühne, Wagen und Buden als Deckung, die Gauklermeisterin auf der Bühne; Nachmittag, `clear` |
| Ziel | `rout` (Eintreiber vertreiben) `[ASSUMPTION]` |
| Gegner Normal (Leicht/Schwer) | 12 = 9 Start + 3 Welle (Runde 3): Schuldeneintreiber (4 brigand, 4 skirmisher, 3 marksman; `unit.debt_collector.name`) + Anführer (`brigand`, kein Leutnant); Leicht 10, Schwer 14 `[ASSUMPTION]` |
| Position und Stufe | P beim Spielen (frühestens 12), Offsets +0 bis +2 |
| Leutnant | keiner |
| Szenen | `scn.n6.intro`, `scn.n6.outro`, `scn.n6.memorial_intro`, `scn.n6.memorial_outro` |
| Auslöser | `completed m2_1` + `any: [alive jory, dead jory]`, `memorialIf: { dead: jory }`; bleibt über Akte offen |
| Einsatzplätze | 7; Jory Pflicht, wenn er lebt |
| Belohnung | Signaturlaute `final_curtain` (auch in der Gedenk-Variante), kein Glutfunke |
| Gold | 1 300 `[ASSUMPTION]` |
| Nebenziele | `protect_npc` Gauklermeisterin (`remedy_salve` ×2), `no_downs` (`vulnerary`) `[ASSUMPTION]` |
| Heimsuchungs-Anker | 0 |

**Akzeptanzkriterien:**

**Angenommen** die Laute `final_curtain`
**Wenn** ein Spielmann sie in der Nebenhand trägt und Anfeuern nutzt
**Dann** gibt sie per `grantsSkill` den Skill `curtain_call` mit `cheerTargets: 2` (Abstand 1) aus Story 10.4: Anfeuern wirkt auf bis zu zwei benachbarte Verbündete, die noch nicht gehandelt haben (je +1 MOV und +10 Treffer aus `balance.yaml › classActions.cheer`, derselbe Empfänger nicht doppelt); es gibt kein eigenes Item-Feld und keinen zweiten Rechenweg
**Und** es gilt die Stapelregel aus Story 10.4: höchstens 2 Ziele, die größte Reichweite gilt; ein Barde mit der Laute behält Reichweite 2 und 2 Ziele, die Laute wirkt für ihn nur über ihre Werte `[ASSUMPTION]`; ohne die Laute bleibt Anfeuern beim Spielmann bei einem Ziel; die Auswahl im Kontext-Band erlaubt das zweite Ziel nacheinander; KI und Autoplay sind nicht betroffen
**Und** `final_curtain`: Laute, Nebenhand, Werte `travel_lute`, `grantsSkill: curtain_call`, `rarity: legendary`, Preis 0, `unsellable` `[ASSUMPTION]`; Tests decken ein und zwei Ziele, Barde mit Laute und Replay ab; der Handbuch-Eintrag zu Anfeuern nennt die Laute.

**Angenommen** Jory ist in der Truppe oder gefallen und 2-1 ist gespielt
**Wenn** der Spieler N6 gewinnt
**Dann** erhält er `final_curtain` und 1 300 Gold, keinen Glutfunken; ist Jory gefallen, laufen die Gedenk-Szenen, die Laute kommt trotzdem in den Konvoi
**Und** `pnpm sim n6 --start expected --position 1` und `--position 7` (späteste Position vor 2-8) liegen im Korridor.

### Story 11.21: Supports, Barks und Chronik-Szene von Akt 2

Als Spieler
möchte ich am Lagerfeuer die neuen Paare kennenlernen, die neuen Gefährten im Kampf hören und in der Burg die Chronik entziffern lassen,
damit Akt 2 Beziehungen und das Pakt-Geheimnis vertieft.

**Abhängigkeiten:** nach 11.5 (Gefährten von Akt 2); Rang A/S am Lagerfeuer hängt an dessen Stufe (vorhandener Code `campfireMaxRank`, Ausbau in 10.1, Panel in 10.8); Chronik-Szene nach 11.1 (`storyCount` je Akt).

**Akzeptanzkriterien:**

**Angenommen** die 8 Paare von Akt 2 laut Narrative (Jory × Nell, Nell × Varek, ★ Varek × Odile, Odile × Sable, Sable × Ilka, ★ Ilka × Brann, Liora × Amos, Amos × Grosk)
**Wenn** ihre Gespräche in `content/acts/act2/supports.yaml` und `scn.support.<a>_<b>.<Rang>` geschrieben sind (Schreib-Pipeline der Narrative, DE + EN, 8–16 Boxen, ≤ 110 Zeichen je Box)
**Dann** haben alle Paare C, B und A, die Kernpaare ★ zusätzlich S (26 Gespräche); sie stehen am Lagerfeuer bereit, sobald die Punkte reichen und die Lagerfeuer-Stufe den Rang erlaubt (`campfireMaxRank`, Epic 10)
**Und** der Wissensstand folgt dem Akt-1-Muster: C und B kennen nur Akt-2-Einstieg und Beitritte, A und S dürfen das Ende der Stränge, aber nicht Kronfeld kennen; Gespräche mit Figuren, die gegangen sind (Odile nach E5, Varek nach E6) oder vor Sables Wechsel nicht dabei sind, erscheinen nicht.

**Angenommen** die sieben Gefährten von Akt 2
**Wenn** ihre Barks geschrieben sind
**Dann** hat jeder etwa 6 Barks (`scn.bark.<id>`: Kampfbeginn, Krit, niedergestreckt, Dank fürs Bergen, Stufenaufstieg, Glutfunke), eine Todeszeile (`scn.farewell.<id>`) und eine Trauerzeile je Support-Partner, auch für die Akt-1-Partner (Varek, Liora, Grosk)
**Und** Sable hat eigene Zeilen als Seitenwechslerin, sobald sie beigetreten ist.

**Angenommen** Beat 10 „Die Chronik“ (Key Conversation 7)
**Wenn** die Truppe nach der 3. abgeschlossenen Story-Mission von Akt 2 (egal welche) in die Burg zurückkehrt
**Dann** läuft einmal die Burg-Szene `scn.castle.chronicle`: Liora entziffert die in 1-7 geborgene Chronik, sonst Ysolde, sonst Rhen (Ersatzsprecher-Kette); ist Liora tot, kommt eine Gedenkzeile; Kern: „Der Pakt verlangt etwas von den Königen“, was genau, bleibt offen
**Und** ein Flag `chronicle_read` (story, `season2: true`) hält fest, dass die Szene lief; der Chronik-Eintrag `wardens_chronicle` wechselt von „versiegelt“ auf „entziffert“ (Text in `locales/<lang>.yaml`)
**Und** Auslöser sind `storyCount` von Akt 2 ≥ 3 und die Heimat Burg, getestet für verschiedene Reihenfolgen.

**Angenommen** Vertonung und Musik
**Wenn** die Story abgeschlossen ist
**Dann** sind Texte vollständig in DE und EN; Vertonung (`voice.act2.<lang>`), Musik (Flöte, Fiedel) und Klang von Akt 2: später.

### Story 11.22: Akt 2 abstimmen und veröffentlichen

Als Produktinhaber
möchte ich Akt 2 über alle Reihenfolgen der Stränge abgestimmt sehen,
damit Spieler aus Akt 1 ohne Brüche und im Korridor weiterspielen.

**Abhängigkeiten:** nach allen Stories von Epic 11 und nach 10.1–10.12 (Raumkosten, Aufstieg, Profi-Wirkungen, Fallen und Schatten, Werkstatt, Lektionen, Reserve-EP, Händler-Glutfunken und Rabatt, Konvoi, Trank verstärken und Söldner-Traits verändern Gold, EP, Glutfunken und Siegquoten von Akt 2).

**Akzeptanzkriterien:**

**Angenommen** alle Stories von Epic 11 sowie 10.1–10.12 auf `main`
**Wenn** `pnpm sim --campaign act2 --runs 50` die verkettete Kampagne über Akt 1 und Akt 2 mit Aufstiegen spielt
**Dann** liegen alle Story-Missionen von Akt 2 auf allen Schwierigkeiten in den Korridoren (NFR12), 2-8 am oberen Rand; die Armee-Stufe weicht je Mission höchstens `levelTolerance` von der Positionsstufe ab; das Gold je Mission liegt in `perAct['2']`, Nebenziele bei 30–50 %
**Und** geprüft werden mindestens die 6 Reihenfolgen, in denen die Stränge nacheinander laufen, und 2 verschränkte (2-2, 2-4, 2-6, 2-3, 2-5, 2-7 und umgekehrt) `[ASSUMPTION]`, je mit E7 `warn` und `obey`; Ergebnisse im Dev Agent Record
**Und** die Nebenquests N4–N6 liegen an ihrer frühesten und spätesten Position im Korridor.

**Angenommen** die vorläufigen Werte aus 11.10–11.20
**Wenn** die Abstimmung Werte ändert
**Dann** ändern sich nur Content-YAML und `balance.yaml`; jede Änderung gegenüber den Vorschlägen steht im GDD-Log
**Und** die Rabatt-Summe (E4, E7, Händler-Stufe 3) erreicht nie mehr als −30 %, die Glutfunken von Akt 2 (N4, N5, Händler) passen zur Rechnung des GDD (12 je Staffel).

**Angenommen** die Spielzeit
**Wenn** der Simulator Züge und Szenen zählt und ein Probedurchlauf auf Normal gemessen ist
**Dann** passt Akt 2 zu 30–35 Stunden für die Staffel (NFR16, Akt 2 rund ein Drittel) `[ASSUMPTION]`.

**Angenommen** Spielstände aus Akt 1
**Wenn** der Migrationstest läuft
**Dann** laden die Fixtures aus dem Akt-1-Release (`tests/fixtures/saves/format2-*`) ohne Datenverlust; ein Stand mit erledigtem `m1_8` landet in Akt 2 mit Titeltafel; 11.1 braucht keine Migration, ab Story 10.2 gilt Format 3 (generische Migration 2 → 3 mit den Umbenennungen aus `renames.yaml`, `tests/unit/migrations.test.ts`); ändert sich das Format danach erneut, gibt es eine weitere Migration mit Fixture.

**Angenommen** der echte Release von Akt 2
**Wenn** der Produktinhaber ihn auslöst
**Dann** läuft erst dann `pnpm content:lock` und sperrt die IDs von `act2` in `content/released-ids.json` (bis dahin keine Sperre, Entscheidung 2026-10-31); `act2` ist schon seit 11.3 `released: true`
**Und** die Leistung von 2-8 ist mit Story 7.5 auf dem Referenzgerät gemessen (NFR1, NFR3), alle Prüfungen sind grün, der Pull Request gegen `main` nennt die Ergebnisse
**Und** ein Playtest-Plan für Akt 2 (Stränge, Verrat in Kronfeld, Flieger und Balliste) liegt vor (`gds-playtest-plan`).

## Epic 12: Akt 3 „Krone“ und Staffelende – grob

Spieler spielen Akt 3 in Aurenhall und im Drachengebirge bis zum Staffelfinale, sehen das Epilog-Mosaik und nehmen ihre Entscheidungen als Staffel-Zusammenfassung mit in Staffel 2. Vor Akt 3 verfeinern.

### Story 12.1: Paket, Region und Gegner von Akt 3

**Akzeptanzkriterien:**

**Angenommen** Paket `act3` mit Region 3, Winter, Glut-Orden, Untoten, Drachen (dritte Partei, eigene Modelle), Leutnants Eluned, Cassian, Mael, Torvald und Tier Silber/Mondstahl
**Wenn** Akt 3 erreicht ist
**Dann** lichtet sich der Nebel über Aurenhall und dem Drachengebirge.

### Story 12.2: Mission 3-1 „Winter über Aurenhall“ (reach, Eluned)

**Akzeptanzkriterien:**

**Angenommen** die Mission ist gewonnen
**Wenn** die Szenen laufen
**Dann** treten Kit und Pell bei; 3-2 bis 3-4 sind frei wählbar.

### Story 12.3: Mission 3-2 „Das verbotene Lied“ (escort Harlan, Cassian)

**Akzeptanzkriterien:**

**Angenommen** Harlan erreicht den Ausgang
**Wenn** die Mission gewonnen ist
**Dann** tritt Harlan bei; N9 öffnet.

### Story 12.4: Mission 3-3 „Die Einsiedlerin“ (defend, Torvald) und E9

**Akzeptanzkriterien:**

**Angenommen** die Mission ist gewonnen
**Wenn** die Szenen laufen
**Dann** tritt Vesna bei, und E9 (Vesna will Ysolde mit ins Gebirge nehmen) fällt; bei „bleiben“ öffnet N7.

### Story 12.5: Mission 3-4 „Der Zweifler“ (boss Mael) und E11

**Akzeptanzkriterien:**

**Angenommen** die Karte (Ziel `boss` Mael, Nebenziel `recruit`) und die Chronik aus dem Burgarchiv
**Wenn** die Mission gewonnen ist und E11 fällt
**Dann** tritt Mael bei „verschonen und die Chronik zeigen“ bei, sonst sinkt Torvalds Groll um 1.

### Story 12.6: Mission 3-5 „Die Krönung“ (seize Glutdom)

**Akzeptanzkriterien:**

**Angenommen** 3-2 bis 3-4 sind gespielt
**Wenn** die Krönung gewonnen ist
**Dann** wird Halvard enttarnt (Illustrationstafel); ab hier läuft Akt 3 linear.

### Story 12.7: Mission 3-6 „Drachen über der Stadt“ (große Schlacht, defend)

**Akzeptanzkriterien:**

**Angenommen** Drachen als dritte Partei und Torvald
**Wenn** die Mission gewonnen ist
**Dann** gelten die Leistungsziele auch mit Drachen; danach öffnet sich 3-7.

### Story 12.8: Mission 3-7 „Der Weg ins Gebirge“ (reach, Eluned)

**Akzeptanzkriterien:**

**Angenommen** die Karte (Ziel `reach` über den Pass, Leutnant Eluned, Drachen als Gefahr im Gelände)
**Wenn** die Mission gewonnen ist
**Dann** öffnet sich das Finale 3-8; die Drachen-Gefahr ist in der Vorschau sichtbar und aus dem Seed reproduzierbar.

### Story 12.9: Mission 3-8 „Im Drachengebirge“ (Finale, boss Halvard), E10 und E12

**Akzeptanzkriterien:**

**Angenommen** das Finale ist gewonnen
**Wenn** E10 (Liora und Halvard) und E12 (Wahrheit, Frieden oder mit 12 Chronik-Seiten „Vhaelyra fragen“) fallen
**Dann** setzt `choose` `s1_ending` und schreibt `c.archive.s1` (Ende, Haltung, Überlebende, Gefallene, Gegangene, Staffel-2-Flags).

### Story 12.10: Epilog-Mosaik

**Akzeptanzkriterien:**

**Angenommen** `content/acts/act3/epilogue.yaml` mit Kacheln je Gefährte und Region und Varianten nach Bedingungen
**Wenn** das Staffelfinale endet
**Dann** zeigt das Mosaik je Gefährte lebt (farbig), gefallen (grau) oder gegangen (sepia) mit einer Wendung, je Region eine breite Kachel, im Kopf Ende und Haltung (Mockup 08, UX-DR22); jede Kachel hat eine Variante ohne Bedingung.

### Story 12.11: Nebenquests N7, N8, N9 und N10

**Akzeptanzkriterien:**

**Angenommen** die Auslöser aus der Narrative (E9, Brenna mit B-Support zu Kael oder Tobin, 3-2 gespielt, Kit und Pell in der Truppe)
**Wenn** der Spieler sie spielt
**Dann** gibt es bei N7–N9 je Glutfunke und Sonderbelohnung, bei N10 die Signatur Turmfalke (keinen Glutfunken); N9 liefert die Zeile für „Vhaelyra fragen“.

### Story 12.12: Nach dem Finale und Übergabe an Staffel 2

**Akzeptanzkriterien:**

**Angenommen** eine abgeschlossene Staffel
**Wenn** der Spieler weiterspielt
**Dann** laufen Heimsuchungen, offene Nebenquests, Supports und Burgausbau weiter; die Abschlussszene bietet den Export der Staffel-Zusammenfassung an (AR20).

### Story 12.13: Akt 3 abstimmen und veröffentlichen

**Akzeptanzkriterien:**

**Angenommen** alle Akt-3-Stories
**Wenn** die verkettete Simulation über die ganze Staffel läuft
**Dann** liegen alle Missionen in den Korridoren, die Spielzeit trifft 30–35 Stunden auf Normal, `act3` ist veröffentlicht und Spielstände aus Akt 1 und 2 laufen weiter.

## Epic 13: Kampf lesbar machen

Spieler lesen das Brett auf einen Blick: Felder, TP jeder Figur, Reichweiten und Gefahr sind sichtbar, bevor sie ziehen; nach der Gegnerphase wissen sie, was passiert ist. Entschieden in der UX-Werkstatt am 2026-10-30 (`concept/sprint-change-proposal-2026-10-30.md`), Verhalten in `EXPERIENCE.md`, Aussehen in `DESIGN.md`, Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`. Alle Zahlen der Anzeigen kommen aus Kern-Funktionen über `dangerZone`/`threatTiles` und `forecast` (Vorschau = Auflösung, AGENTS.md); Stufen, Schwellen und Deckkraft stehen in `render.yaml`.

### Story 13.1: Brett-Anzeige in den Optionen und Raster

Als Spieler
möchte ich die Felder des Bretts zählen können und selbst bestimmen, wie viel Hilfe das Brett zeigt,
damit ich Reichweiten sicher einschätze, ohne dass das Diorama zum Schachbrett wird.

**Akzeptanzkriterien:**

**Angenommen** die Optionen (Titel und Menü)
**Wenn** der Spieler sie öffnet
**Dann** gibt es einen Block „Brett-Anzeige“ mit Raster (aus / dezent / stark), Lebensleisten (Immer / Nur verletzte / Aus), Gegner-Leiste (an/aus) und dem bisherigen Schalter „Gefahrenzone standardmäßig“
**Und** die Standardwerte sind Raster dezent, Lebensleisten Immer, Gegner-Leiste aus; die Werte liegen in `src/app/state/settings.ts`, nicht im Spielstand, und alte Einstellungen laden ohne Fehler.

**Angenommen** ein Kampf mit Raster „dezent“
**Wenn** das Brett steht
**Dann** liegen kleine Creme-Kreuze an allen Feldecken auf Feldhöhe, nie vom Szenenlicht gefärbt (Art Direction §2.5)
**Und** „stark“ zeichnet feine durchgehende Linien, „aus“ nichts; Deckkraft und Größe je Stufe stehen in `render.yaml`
**Und** die Bildrate bleibt über den Zielen aus Story 7.8.

### Story 13.2: Bereiche als Kacheln und Weg-Pfeil

Als Spieler
möchte ich Bewegungs- und Angriffsbereich als einzelne Felder mit klarer Kante sehen und meinen Weg als Pfeil,
damit ich nicht raten muss, wie weit eine Figur kommt.

**Akzeptanzkriterien:**

**Angenommen** eine gewählte eigene Einheit
**Wenn** ihr Bereich erscheint
**Dann** ist jedes erreichbare Feld eine Einzelkachel mit kleiner Lücke und runden Ecken in Teamblau, Angriffsfelder ebenso in Rot, und der Bewegungsbereich hat eine gemeinsame Außenkante (Creme unter Blau)
**Und** Haltezonen, Wirken-Felder und Ziele behalten ihre bisherige Darstellung (Story 2.4, 2.5).

**Angenommen** ein gesetztes Zielfeld
**Wenn** die Geist-Figur dort steht
**Dann** zeigt ein dicker, runder Pfeil mit Creme-Rand den Weg vom Start bis zum Ziel, mit Spitze am Ziel; er ersetzt die bisherige Weg-Markierung.

### Story 13.3: Lebensleisten über den Figuren

Als Spieler
möchte ich über jeder Figur sehen, wie viele TP sie noch hat,
damit ich angeschlagene Gegner und gefährdete Gefährten ohne Antippen erkenne.

**Akzeptanzkriterien:**

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

### Story 13.4: Schadensvorschau und Kill-Marker

Als Spieler
möchte ich vor dem Angriff sehen, wie viel die Leiste des Ziels verliert und wen ich diese Runde besiegen kann,
damit ich Angriffe gezielt verteile.

**Akzeptanzkriterien:**

**Angenommen** die offene Kampfvorschau
**Wenn** ein Ziel gewählt ist
**Dann** blinkt in seiner Lebensleiste der Teil, den der Angriff bei Treffer nimmt (inklusive Doppelangriff), mit `prefers-reduced-motion` schraffiert statt blinkend
**Und** die Zahl stammt aus `forecast`, nie aus einer Kopie der Formel.

**Angenommen** eine gewählte eigene Einheit in der Spielerphase
**Wenn** ihr Bereich erscheint
**Dann** steht über jedem Gegner, den sie von einem erreichbaren Feld aus angreifen kann, ein Kill-Marker nach DESIGN.md: voller Totenkopf = fällt bei Treffer (inklusive Doppelangriff), halber = fällt nur mit Krit
**Und** Leutnants zeigen statt Totenkopf die Flucht-Marke; gerechnet wird mit der besten angelegten Waffe und dem günstigsten erreichbaren Feld
**Und** die Rechnung ist eine reine Funktion in `src/core/rules` mit Unit-Tests (Treffer, Krit, Doppelangriff, Dreieck, Element, Leutnant).

### Story 13.5: Gefahrenzone mit Stufen

Als Spieler
möchte ich in der Gefahrenzone sehen, wie viele Gegner ein Feld erreichen,
damit ich zwischen leicht und sehr gefährlich unterscheiden kann.

**Akzeptanzkriterien:**

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

### Story 13.6: Zielfeld-Check und Warnung für eigene Figuren

Als Spieler
möchte ich vor dem Bestätigen sehen, welche Gegner mein Zielfeld erreichen und welche meiner Figuren fallen könnten,
damit ich nicht aus Versehen in eine Falle ziehe.

**Akzeptanzkriterien:**

**Angenommen** eine gesetzte Geist-Figur auf einem Zielfeld (Handy) bzw. die Maus über einem erreichbaren Feld (PC, Hover)
**Wenn** das Feld feststeht
**Dann** leuchtet jeder Gegner, der das Feld in seiner nächsten Phase erreicht (Regeln wie Story 13.5), rötlich auf (Farbe und Stärke in `render.yaml`; Playtest 2026-10-30: statt Linien zum Feld)
**Und** eine Pille unter den Ziel-Pillen sagt „n Gegner erreichen dieses Feld“ (ab 2 auf Rot-hell, bei 1 auf Creme, bei 0 keine Pille)
**Und** am Feld steht der Gelände-Chip mit Name, Verteidigung, Ausweichen und Heilung als Symbol + Zahl aus `terrain.yaml`.

**Angenommen** die Spielerphase
**Wenn** die Summe des Schadens bei Treffer aller Gegner, die eine eigene Figur erreichen, ihre aktuellen TP erreicht (ohne Krit und Trefferchance, mit Doppelangriff)
**Dann** steht über dieser Figur ein grauer Warn-Totenkopf mit „!“ (DESIGN.md `kill-marker.warn`)
**Und** er verschwindet, sobald die Bedingung nicht mehr gilt; die Rechnung ist eine getestete reine Funktion.

### Story 13.7: Gegnerphase-Rückblick

Als Spieler
möchte ich nach der Gegnerphase kurz sehen, was passiert ist,
damit ich bei 2× oder Überspringen nichts Wichtiges verpasse.

**Akzeptanzkriterien:**

**Angenommen** eine Gegnerphase, in der etwas geschah
**Wenn** die Spielerphase beginnt
**Dann** liegt über der Einheitenkarte ein Stein „Gegnerphase n“ mit einer Zeile je Ereignis: zuerst Niedergestreckte und Gefallene (mit Verblutungs-Zähler bzw. in Klassik „gefallen“), dann Treffer auf eigene Figuren (TP vorher → nachher, Verfehlt als „weicht aus“), dann Verstärkungen und geweckte Gegner
**Und** eine Nebentaste „Figur zeigen“ bzw. ein Tipp auf eine Zeile zentriert die Kamera auf Figur oder Ort
**Und** die Liste entsteht als reine Funktion aus den Events der Phase, getestet.

**Angenommen** der Rückblick ist offen
**Wenn** der Spieler aufs Brett tippt oder eine Einheit wählt
**Dann** schließt er sich ohne Rückfrage; er blockiert nie, erscheint nicht, wenn nichts geschah, und Lektionen und Szenen haben Vorrang.

### Story 13.8: Gegner-Leiste

Als Spieler
möchte ich auf Wunsch alle Gegner mit ihren TP in einer Reihe sehen,
damit ich auf großen Karten niemanden übersehe.

**Akzeptanzkriterien:**

**Angenommen** die Option „Gegner-Leiste“ ist an (Standard aus)
**Wenn** die Spielerphase läuft
**Dann** steht unter den Ziel-Pillen eine Reihe kleiner Medaillons aller sichtbaren Gegner mit TP-Ring und TP-Zahl, Leutnants mit Goldring zuerst; Gegner im Nebel fehlen
**Und** ein Tipp zentriert die Kamera auf den Gegner, ein Langdruck öffnet seine Info; bei vielen Gegnern lässt sich die Reihe seitlich wischen
**Und** auf Tablet und PC sitzt sie in der Seitenleiste (UX-DR24).

### Story 13.9: Fertig-Häkchen, Kamera-Griffe und Zurück an der Figur

Als Spieler
möchte ich sehen, wer schon gehandelt hat, schnell zu einer Figur oder zur ganzen Karte springen und eine Bewegung direkt an der Figur zurücknehmen,
damit sich lange Runden flüssig spielen.

**Akzeptanzkriterien:**

**Angenommen** eine Figur hat in dieser Phase gehandelt
**Wenn** sie auf dem Brett steht
**Dann** trägt sie zusätzlich zur Entsättigung ein kleines grünes Häkchen am Kopf (DESIGN.md Fertig-Häkchen).

**Angenommen** das Brett
**Wenn** der Spieler doppelt auf eine Figur tippt
**Dann** gleitet die Kamera auf sie, ohne sie zu wählen oder eine Aktion auszulösen
**Und** Herauspinchen über die weiteste Zoomstufe hinaus bzw. am PC Taste M oder Mausrad zeigt die ganze Karte (vierte Zoomstufe, aus der Kartengröße berechnet; Rand in `render.yaml`); erneutes Hineinzoomen kehrt zur weitesten Stufe zurück.

**Angenommen** eine gesetzte Geist-Figur vor der Aktion
**Wenn** der Spieler am PC rechts klickt
**Dann** steht die Figur wieder auf dem Startfeld wie mit dem bisherigen Zurück (FR1); die Leisten-Taste „Zurück“ bleibt; einen eigenen Zurück-Stein an der Figur gibt es nicht (Playtest 2026-10-30: überfüllte Bedienung).

## Epic 14: Handbuch

Spieler schlagen jede Spielregel im Spiel nach: aus dem Menü oder direkt über ein „?“ an der Stelle, an der die Regel wirkt. Entschieden in der UX-Werkstatt am 2026-10-30 (`concept/sprint-change-proposal-2026-10-30.md`); Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`. Werte in Einträgen sind Verweise auf Content-Pfade und stimmen damit nach jedem Balancing. Texte DE + EN entwirft der Assistent aus GDD, Narrative und Content, der Produktinhaber nimmt sie im Pull Request ab. Entdecken (NEU-Marken, Fortschritt) und Bestiarium sind nicht Teil dieses Epics, weil sie das Speicherformat ändern.

### Story 14.1: Handbuch als Content

Als Entwickler
möchte ich Handbuch-Einträge als YAML mit Schema anlegen,
damit Texte, Werte und Verweise geprüft werden und nie im Code stehen.

**Akzeptanzkriterien:**

**Angenommen** `content/core/handbook.yaml` mit Zod-Schema (Kategorien in fester Reihenfolge; Einträge mit id, Kategorie, Grafik-Typ, Wert-Verweisen, Querverweisen, optionalem Kontext-Anker)
**Wenn** `pnpm content:check` läuft
**Dann** scheitert er bei fehlendem DE- oder EN-Schlüssel unter `handbook.*`, bei einem Wert-Verweis, der sich nicht auflöst (z. B. `balance.triangle.hit`, `terrain.forest.avoid`, `classes.vanguard.mov`), bei Querverweisen auf unbekannte Einträge und bei doppelten Kontext-Ankern
**Und** eine reine Funktion löst Wert-Verweise gegen `GameData` auf (getestet); kein Zahlenwert steht als Text im YAML.

### Story 14.2: Handbuch-Screen und Einstieg

Als Spieler
möchte ich das Handbuch aus jedem Menü öffnen und Einträge schnell finden,
damit ich Regeln nachlese, wann immer ich unsicher bin.

**Akzeptanzkriterien:**

**Angenommen** das Menü im Kampf, das Menü auf der Weltkarte oder der Titel
**Wenn** der Spieler „Handbuch“ wählt (im Kampf an zweiter Stelle unter Optionen)
**Dann** öffnet eine Vollbild-Ansicht im Stil B mit Zurück-Stein, Titelpille, Suchfeld und den Kategorien als Steine im Zweier-Raster
**Und** die Suche findet Einträge über Titel und Stichworte in der aktuellen Sprache.

**Angenommen** ein gewählter Eintrag
**Wenn** er öffnet
**Dann** zeigt er Grafik, Werte-Feld (aufgelöste Werte, Symbol + Zahl), einen Satz „wo im Spiel“ und Querverweise als Chips; ein Querverweis öffnet den anderen Eintrag, Zurück führt zum vorigen
**Und** aus dem Kampf heraus liegt das Handbuch über dem Kampf; Schließen kehrt in denselben Zustand zurück, ohne Command und ohne Speichern.

### Story 14.3: Einträge Grundlagen, Kampf, Waffen und Elemente

Als Spieler
möchte ich verstehen, wie Phasen, Bewegung, Treffer, Krit, Doppelangriff, Waffendreieck und Elemente funktionieren,
damit ich die Kampfvorschau deuten kann.

**Akzeptanzkriterien:**

**Angenommen** die Kategorien Grundlagen, Kampf sowie Waffen & Elemente
**Wenn** der Spieler sie öffnet
**Dann** gibt es Einträge mindestens zu Phasen und Aktionen, Bewegung und Zurücknehmen, Speichern, Trefferchance (zwei Würfel), Schaden, Krit, Doppelangriff, Supports im Kampf, Waffendreieck (Grafik) und Elementkreislauf (Grafik) mit Werten aus `balance.yaml`
**Und** die Texte liegen DE und EN vor und sind vom Produktinhaber abgenommen.

### Story 14.4: Einträge Gelände, Zustände, Leutnants, Tod und Bergen

Als Spieler
möchte ich nachlesen, was Gelände, Zustände, Leutnants und die Tod-Modi bewirken,
damit mich weder Feuer noch eine Flucht noch das Verbluten überrascht.

**Akzeptanzkriterien:**

**Angenommen** die Kategorien Gelände, Zustände, Leutnants sowie Tod & Bergen
**Wenn** der Spieler sie öffnet
**Dann** gibt es Einträge zu jedem Gelände mit Verteidigung, Ausweichen, Heilung und Bewegungskosten je Bewegungstyp aus `terrain.yaml`, zu Feuer und Ausbreitung, Nass, Langsam, Wegstoßen, Felswand und Nebel, zu Groll und Kerben, Flucht bei 0 TP, Kopfgeld und Heimsuchungen, zu Niederstrecken, Verbluten, Bergen, Narben und den Modi Klassik/Standard/Casual
**Und** Texte DE + EN abgenommen.

### Story 14.5: Klassen-Steckbriefe

Als Spieler
möchte ich für jede spielbare Klasse Stärken und Schwächen sehen,
damit ich meine Truppe gezielt einsetze.

**Akzeptanzkriterien:**

**Angenommen** die Kategorie Klassen
**Wenn** der Spieler eine spielbare Klasse öffnet (`playable: true` in `classes.yaml`)
**Dann** zeigt der Steckbrief Rollen-Icon, ein Werte-Netz aus dem Wachstum, Bewegung, Bewegungstyp, Waffengruppen, Klassen-Aktion und Profi-Wege aus `classes.yaml`
**Und** je 2–3 Zeilen „stark“ und „schwach“ (Text in den Locales, DE + EN abgenommen)
**Und** eine neue spielbare Klasse ohne Steckbrief lässt `content:check` scheitern.

### Story 14.6: Einträge Heimat und Items

Als Spieler
möchte ich nachlesen, wie Räume, Ausbau, Items, Seltenheit, Runen, Sets und Last funktionieren,
damit ich Gold und Material sinnvoll einsetze.

**Akzeptanzkriterien:**

**Angenommen** die Kategorien Heimat und Items
**Wenn** der Spieler sie öffnet
**Dann** gibt es Einträge zu Lager und Burg, Räumen und Ausbau (`rooms.yaml`), Glutfunke, Seltenheit (Rauten), Aufwerten, Runen, Sets, Gewicht und Last mit Werten aus den Content-Dateien
**Und** Inhalte, die erst mit Epic 10 kommen, sind als „ab Akt 2“ gekennzeichnet; Texte DE + EN abgenommen.

### Story 14.7: Lektionen und Kontext-„?“

Als Spieler
möchte ich die Lektionen des Prologs später nachlesen und aus dem Kampf direkt zur passenden Regel springen,
damit ich nicht erst suchen muss.

**Akzeptanzkriterien:**

**Angenommen** die Kategorie Lektionen
**Wenn** der Spieler sie öffnet
**Dann** stehen dort die Lektionen des Prologs (Bewegung, Gefahr, Heilen und alle weiteren Lektionen) als Text aus denselben Szenen-Schlüsseln, nicht als Kopie.

**Angenommen** Kampfvorschau, Gelände-Chip, Zustands-Symbole und Lektionen im Kampf
**Wenn** dort ein Kontext-„?“ steht (DESIGN.md `help-stone`) und der Spieler es antippt
**Dann** öffnet der Eintrag mit dem passenden Kontext-Anker als Blatt über dem Kampf; Schließen kehrt ohne Zustandsverlust zurück
**Und** jedes „?“ hat eine Tippfläche von mindestens 44 pt und verdeckt keine Zahl.

## Validierung

- **FR-Abdeckung:** FR1–FR63 sind in der Coverage Map einem Epic zugeordnet und in mindestens einer Story mit Kriterien hinterlegt; bestehende Regeln (FR1–FR3, FR6, FR9, FR10, FR45) werden in Story 2.1/2.2 bzw. 6.2 übernommen und nicht neu gebaut.
- **UX-Abdeckung:** UX-DR1–UX-DR31 sind Epics zugeordnet (Epic List) und in Stories mit Mockup-Verweis abgedeckt; UX-DR26–UX-DR31 kamen mit der Course Correction 2026-10-30 (Epics 13 und 14, 16 Stories).
- **Architektur:** Kein Starter-Template (Projekt existiert). Bausteine entstehen beim ersten Bedarf: Speicherformat 2 und Kampagnen-Commands (1.2, 1.4), Worker (2.8), Content-Layout, Bedingungen, Szenen-Schema (4.1, 4.2, 4.4), Szenen-Host (5.1), Pakete und ID-Sperre (7.1, 7.4).
- **Abhängigkeiten:** Jede Story baut nur auf früheren Stories auf; Verweise auf spätere Epics nennen nur, wo eine Ansicht später zusätzlich erreichbar wird (z. B. Steckbriefe über die Leiste ab Epic 5). Epic 8 kann ab Epic 2 parallel laufen.
- **Dateiwechsel:** Rollenmodell und Kampf-HUD liegen in einem Epic (2), Heimat-Räume in Epic 6 (Lager, Burg auf Stufe 1 ab 1-6) und Epic 10 (Burg-Ausbau ab Akt 2) mit demselben Raum-Muster; keine Mehrfach-Umbauten derselben Dateien über Epics ohne Grund.
- **Offen:** Epic 12 ist grob und wird vor Akt 3 verfeinert; Epic 10 und 11 sind seit 2026-10-31 verfeinert. Lizenzfrage GA26: siehe `concept/23-art-direction/licensing.md`.
- **Readiness (2026-10-23):** Befunde des Readiness-Checks mit dem Produktinhaber geklärt (Decision-Log); neu sind Story 3.7 und 7.5, mit der Course Correction 8/8/8 damit 108 Stories.
- **Nächster Schritt:** Umsetzung nach `_bmad-output/implementation-artifacts/sprint-status.yaml`, Story für Story mit `gds-create-story` und `gds-dev-story`.
