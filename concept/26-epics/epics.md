---
title: 'Hollow Crown – Epics und Stories (Staffel 1)'
stepsCompleted: [1, 2, 3, 4]
status: final
created: 2026-10-23
updated: 2026-10-23
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

Dieses Dokument zerlegt GDD, Narrative, Architektur und UX von Hollow Crown, Staffel 1, in umsetzbare Epics und Stories. Es löst die Grobfassung `concept/21-gdd/epics.md` ab. Bis zum MVP (Akt 1) sind die Stories mit vollen Akzeptanzkriterien ausgearbeitet; Burg-Ausbau, Akt 2 und Akt 3 stehen als Story-Liste mit Kurz-Kriterien und werden vor dem jeweiligen Akt verfeinert. Jede Story ist erst fertig, wenn `pnpm lint`, `pnpm test`, `pnpm content:check` und `pnpm build` grün sind (AGENTS.md).

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
- FR15 (neu): Späher-Profi Fallensteller (max. 2 unsichtbare Fallen, 8 Schaden + Verlangsamt, entschärfen) und Schatten (im Nebel unsichtbar bis zum Angriff).
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

### Epic 10: Die Burg ausbauen (ab Akt 2) – grob
Spieler bauen die eroberte Paktwacht auf 11 Räume in drei Stufen aus, steigen per Glutfunke auf Profi-Wege auf und ehren Gefallene in der Gedächtnishalle.
**FRs covered:** FR14, FR15, FR44, FR50 (ab Akt 2)–FR54 · UX-DR10 (Burg-Ausbau), UX-DR11 (Lektionen), UX-DR21

### Epic 11: Akt 2 „Glut“ – grob
Spieler spielen Akt 2 mit 8 Story-Missionen inklusive der großen Schlacht Kronfeld, 3 Nebenquests, 4 Leutnants und 4 Entscheidungen in der Eisenmark.
**FRs covered:** FR17 (Akt 2), FR61, FR63

### Epic 12: Akt 3 „Krone“ und Staffelende – grob
Spieler spielen Akt 3 bis zum Staffelfinale, sehen das Epilog-Mosaik und nehmen ihre Entscheidungen als Staffel-Zusammenfassung mit in Staffel 2.
**FRs covered:** FR17 (Akt 3), FR39, FR57 (Staffel 2), FR62, FR63 · AR20 · UX-DR22

**Reihenfolge:** 1 → 2 → 4 → 3 → 5 → 6 → 7 → 8 → 9 (MVP-Release), danach 10 → 11 → 12. Epic 4 läuft vor Epic 3 (oder beide zusammen), weil Groll-Wirkung, Bedingungen und Szenen der Leutnants aus Epic 4 kommen. Gebaut wird Epic für Epic auf die Endfassung hin; ein Epic darf intern unfertig sein, solange das nächste darauf aufbaut. Epic 8 kann ab Epic 2 parallel laufen (Asset-Arbeit), seine Einbindung setzt die jeweiligen Szenen voraus. Die Burg ist ab 1-6 Heimat (Story 6.9); ihr Ausbau (Epic 10) ist spätestens mit Akt 2 fertig.

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
**Dann** stehen ihre Gedenksteine dort (entsättigt, Glutlinie, Zitat), Gerrits Stein zuerst; Lektionen gibt es erst ab Akt 2 (Story 10.6) (UX-DR11 Teil).

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
möchte ich Liora sicher herausbringen und Halvard zum ersten Mal sehen,
damit die Paktgeschichte beginnt.

**Akzeptanzkriterien:**

**Angenommen** Karte (Ziel `escort` mit Liora, Leutnant Morra) und Szenen mit Halvards Auftritt
**Wenn** Liora den Ausgang erreicht
**Dann** tritt sie bei; die Nebenquest N2 „Der letzte Wachturm“ öffnet sich
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

## Epic 10: Die Burg ausbauen (ab Akt 2) – grob

Spieler bauen die eroberte Paktwacht auf 11 Räume in drei Stufen aus, steigen per Glutfunke auf Profi-Wege auf und geben das Erbe der Gefallenen als Lektion weiter. Die Burg als Heimat auf Stufe 1 und die Gedenksteine entstehen schon für den MVP in Story 6.9. Story-Liste mit Kurz-Kriterien; vor Akt 2 mit `gds-create-story` verfeinern. Hinweis: Die Burg ist ein 3D-Diorama (Art Direction §7); der obere Teil des Heimat-Screens wird dann neu geprüft (UX-Log).

### Story 10.1: Räume ausbauen

Als Spieler
möchte ich Räume mit dem passenden Gefährten und Gold auf Stufe 2 und 3 bringen,
damit die Burg eine zweite Fortschrittsachse ist.

**Akzeptanzkriterien:**

**Angenommen** `rooms.yaml` mit Kosten (Stufe 2 ≈ 1 500, Stufe 3 ≈ 4 000 Gold) und `requires` (Gefährte in der Truppe)
**Wenn** beides erfüllt ist
**Dann** baut `buildRoom` aus, das Ausbau-Band im Panel zeigt Kosten als Symbol + Zahl, und die Burg zeigt das neue Modellteil.

### Story 10.2: Akademie und Aufstieg mit Glutfunke

Als Spieler
möchte ich ausgewählte Gefährten mit einem Glutfunken aufsteigen lassen,
damit die knappe Wahl, wer wächst, ein Moment wird.

**Akzeptanzkriterien:**

**Angenommen** eine Figur ab Stufe 10 und ein Glutfunke
**Wenn** der Spieler in der Akademie einen von zwei Profi-Wegen wählt
**Dann** steigt sie auf (Stufe → 1, Loadout 4 → 5), der Glutfunke ist verbraucht, und der Funken-Moment spielt (Mockup 08, UX-DR21); Akademie-Stufen 2/3 laut GDD.

### Story 10.3: Profi-Wege aller Rollen

Als Spieler
möchte ich zwischen zwei klar verschiedenen Profi-Wegen je Rolle wählen,
damit ein Aufstieg die Spielweise ändert.

**Akzeptanzkriterien:**

**Angenommen** die 14 Profiklassen plus Großstratege und Bannerherr mit den Effekten aus dem GDD (u. a. Bollwerk, Sturmbrecher, Klingentänzer, Duellant, Scharfschütze, Waldläufer, Weiser, Hexer, Bischof, Kampfpriester, Barde, Bannerträger)
**Wenn** eine Figur aufgestiegen ist
**Dann** gelten ihre Effekte mit Vorschau und neuem Signaturteil auf dem Brett.

### Story 10.4: Fallensteller und Schatten

Als Spieler
möchte ich mit Späher-Profis Fallen legen oder im Nebel verschwinden,
damit Späher im späten Spiel eine eigene Taktik haben.

**Akzeptanzkriterien:**

**Angenommen** ein Fallensteller bzw. Schatten
**Wenn** er seine Fähigkeit nutzt
**Dann** liegen bis zu 2 für Gegner unsichtbare Fallen (8 Schaden + Verlangsamt, entschärfbar) bzw. ist er im Nebel unsichtbar, bis er angreift; beides reproduzierbar und für die KI regelkonform.

### Story 10.5: Verzauberer und Werkstatt

Als Spieler
möchte ich Runen bearbeiten und Verbrauchsgüter aus Material herstellen,
damit Material aus Heimsuchungen einen Zweck hat.

**Akzeptanzkriterien:**

**Angenommen** Verzauberer und Werkstatt in der Burg
**Wenn** der Spieler sie nutzt
**Dann** gelten Runen-Stufen und Rezepte je Raumstufe (Feuerbombe, Schlüssel → Hast, verstärktes Gegengift → Fallen-Set, Rune I) mit Kosten als Symbol + Zahl.

### Story 10.6: Lektionen der Gedächtnishalle

Als Spieler
möchte ich das Erbe der Gefallenen an Gefährten weitergeben,
damit Verlust Bedeutung behält.

**Akzeptanzkriterien:**

**Angenommen** die Gedächtnishalle mit Gedenksteinen aus Story 6.9 und Akt 2 ist erreicht
**Wenn** der Spieler die Gedächtnishalle öffnet
**Dann** vererbt einmal pro Akt ein Gefallener eine Lektion an einen Gefährten; Stufen 2/3 laut GDD (UX-DR11).

### Story 10.7: Übungsplatz, Lagerfeuer-Ränge und lebende Burg

Als Spieler
möchte ich, dass die Reserve mitwächst, Freundschaften tiefer werden und die Burg sich mit den Menschen füllt,
damit die Heimat lebendig wirkt.

**Akzeptanzkriterien:**

**Angenommen** die Burg
**Wenn** Übungsplatz und Lagerfeuer ausgebaut sind und Gefährten beitreten oder fallen
**Dann** erhält die Reserve 20/35/50 % der Durchschnitts-EP, das Lagerfeuer öffnet A und (Kernpaare) S, Gefährten und ihre Gegenstände stehen an festen Plätzen, und Gefallene hinterlassen einen leeren Platz.

## Epic 11: Akt 2 „Glut“ – grob

Spieler spielen Akt 2 in der Eisenmark. Eine Story je Mission wie in Epic 9 (Karte, Szenen DE/EN, Leutnants, Beitritte, Entscheidungen, Heimsuchungs-Anker, Sim-Korridor). Vor Akt 2 verfeinern.

### Story 11.1: Paket, Region und Gegner von Akt 2

Als Spieler
möchte ich die Eisenmark im Herbst betreten,
damit Akt 2 eine eigene Welt hat.

**Akzeptanzkriterien:**

**Angenommen** Paket `act2` mit Region 2, Herbst-Texturen, Gegnertypen (Eisenmark-Truppen, Ritter, Pegasusritter, Ballisten), Leutnants Brakka, Grell, Sable, Rowena und Ausrüstungs-Tier Stahl
**Wenn** Akt 2 erreicht ist
**Dann** lichtet sich der Nebel über der Eisenmark und die Weltkarte zeigt die Knoten von Akt 2.

### Story 11.2: Mission 2-1 „Wind über der Eisenmark“ (survive, Brakka) und die drei Angebote

**Akzeptanzkriterien:**

**Angenommen** die Mission ist gewonnen
**Wenn** die Szenen danach laufen
**Dann** tritt Jory bei und die drei Thronanwärter machen ihre Angebote (Illustrationstafel).

### Story 11.3: Mission 2-2 „Das Siegel im Salzpass“ (treasure, Grell)

**Akzeptanzkriterien:**

**Angenommen** die Mission ist gewonnen
**Wenn** die Szenen laufen
**Dann** tritt Nell bei; E5 (Odile) wird über die Prinzessinnen-Missionen vorbereitet.

### Story 11.4: Mission 2-3 „Die verstoßene Leibwache“ (escort Odile, Sable)

**Akzeptanzkriterien:**

**Angenommen** Odile erreicht den Ausgang
**Wenn** die Mission gewonnen ist
**Dann** tritt Odile bei; E5 (Odile kehrt zur Garde zurück oder bleibt) fällt.

### Story 11.5: Mission 2-4 „Der Wyvernhorst“ (boss, Rowena)

**Akzeptanzkriterien:**

**Angenommen** die Mission ist gewonnen
**Wenn** die Szenen laufen
**Dann** tritt Ilka bei; E6 (Varek) fällt; Nebenquest N4 öffnet, solange Ilka in der Truppe ist.

### Story 11.6: Mission 2-5 „Die Brandschneise“ (defend Brandhang, Grell) und E7

**Akzeptanzkriterien:**

**Angenommen** die Mission ist gewonnen
**Wenn** E7 fällt (warnen oder Befehl ausführen)
**Dann** tritt Brann bei, bei „warnen“ zusätzlich Sable (Seitenwechsel); N5 öffnet.

### Story 11.7: Mission 2-6 „Gold für Banditen“ (rout, Rowena und Sable)

**Akzeptanzkriterien:**

**Angenommen** die Mission ist gewonnen
**Wenn** die Szenen laufen
**Dann** tritt Amos bei; der Verdacht gegen Maelis öffnet die Spur zum Kontor (2-7).

### Story 11.8: Mission 2-7 „Das Kontor am Silbermeer“ (reach, Brakka) und E8

**Akzeptanzkriterien:**

**Angenommen** die Mission ist gewonnen und die Geschäftsbücher sind gesichert
**Wenn** die Szenen laufen
**Dann** fällt E8 (Beweise gegen Maelis an Seraphine geben oder zurückverkaufen); bis zum Finale gibt es keinen Beitritt mehr.

### Story 11.9: Mission 2-8 „Kronfeld“ (große Schlacht, survive → escape)

**Akzeptanzkriterien:**

**Angenommen** die große Schlacht (bis 24×32, ~15 eigene Einheiten, alle Leutnants von Akt 2, sofern nicht gewechselt)
**Wenn** sie gewonnen ist
**Dann** folgt „Die Krone war hohl“ (Illustrationstafel); die Gegnerphase hält NFR1 und NFR3 auf dem Referenzgerät.

### Story 11.10: Nebenquests N4 „Der Clan im Schnee“ und N5 „Glut unter dem Berg“

**Akzeptanzkriterien:**

**Angenommen** die Auslöser (Ilka in der Truppe bzw. 2-5 gespielt)
**Wenn** der Spieler sie spielt
**Dann** gibt es je Glutfunke und Sonderbelohnung (Signaturbogen bzw. Chronik-Seite und Erd-Rune III), mit Gedenk-Varianten.

### Story 11.11: Nebenquest N6 „Die Gauklertruppe“

**Akzeptanzkriterien:**

**Angenommen** Jory ist in der Truppe
**Wenn** der Spieler N6 spielt
**Dann** gibt es die Signaturlaute Letzter Vorhang (keinen Glutfunken), mit Gedenk-Variante.

### Story 11.12: Supports, Barks und Vertonung von Akt 2

**Akzeptanzkriterien:**

**Angenommen** die Paare mit beiden Figuren ab Akt 2
**Wenn** C/B/A-Gespräche, Barks und Groll-Zeilen der Akt-2-Leutnants geschrieben und vertont sind
**Dann** stehen sie bereit (DE + EN, Paket `voice.act2.<lang>`).

### Story 11.13: Akt 2 abstimmen und veröffentlichen

**Akzeptanzkriterien:**

**Angenommen** alle Akt-2-Stories
**Wenn** die verkettete Simulation über Akt 1 und 2 läuft
**Dann** liegen alle Missionen in den Korridoren; `act2` ist veröffentlicht, IDs gesperrt, Spielstände aus Akt 1 laufen weiter (Migrationstest).

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

## Validierung

- **FR-Abdeckung:** FR1–FR63 sind in der Coverage Map einem Epic zugeordnet und in mindestens einer Story mit Kriterien hinterlegt; bestehende Regeln (FR1–FR3, FR6, FR9, FR10, FR45) werden in Story 2.1/2.2 bzw. 6.2 übernommen und nicht neu gebaut.
- **UX-Abdeckung:** UX-DR1–UX-DR25 sind Epics zugeordnet (Epic List) und in Stories mit Mockup-Verweis abgedeckt.
- **Architektur:** Kein Starter-Template (Projekt existiert). Bausteine entstehen beim ersten Bedarf: Speicherformat 2 und Kampagnen-Commands (1.2, 1.4), Worker (2.8), Content-Layout, Bedingungen, Szenen-Schema (4.1, 4.2, 4.4), Szenen-Host (5.1), Pakete und ID-Sperre (7.1, 7.4).
- **Abhängigkeiten:** Jede Story baut nur auf früheren Stories auf; Verweise auf spätere Epics nennen nur, wo eine Ansicht später zusätzlich erreichbar wird (z. B. Steckbriefe über die Leiste ab Epic 5). Epic 8 kann ab Epic 2 parallel laufen.
- **Dateiwechsel:** Rollenmodell und Kampf-HUD liegen in einem Epic (2), Heimat-Räume in Epic 6 (Lager, Burg auf Stufe 1 ab 1-6) und Epic 10 (Burg-Ausbau ab Akt 2) mit demselben Raum-Muster; keine Mehrfach-Umbauten derselben Dateien über Epics ohne Grund.
- **Offen:** Epics 10–12 sind grob und werden vor dem jeweiligen Akt mit `gds-create-story` verfeinert; bis dahin bleiben sie im Sprint-Status `backlog`. Lizenzfrage GA26: siehe `concept/23-art-direction/licensing.md`.
- **Readiness (2026-10-23):** Befunde des Readiness-Checks mit dem Produktinhaber geklärt (Decision-Log); neu sind Story 3.7 und 7.5, mit der Course Correction 8/8/8 damit 108 Stories.
- **Nächster Schritt:** Umsetzung nach `_bmad-output/implementation-artifacts/sprint-status.yaml`, Story für Story mit `gds-create-story` und `gds-dev-story`.
