---
title: 'Hollow Crown – Epics und Stories (Staffel 1)'
stepsCompleted: [1, 2]
status: in-progress
created: 2026-10-23
updated: 2026-10-23
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
- FR5 (geändert): Neustart: Runde neu (Standard/Casual) und Mission neu (alle Modi; Klassik nur nach Niederlage) setzen alles inklusive Tode auf den jeweiligen Beginn zurück.
- FR6 (bestehend): Missionsziele rout, boss, reach, seize, defend, survive, escape; Nebenziele visit_villages, no_downs, turn_limit, kill_with, recruit, open_chests, protect_npc; Verstärkungen eine Runde angekündigt, Hinterhalte nur auf Schwer.
- FR7 (neu): Neue Missionsziele **escort** (NPC zum Ausgang bringen) und **treasure** (Truhen vor Rundenlimit bergen) mit Sieg- und Niederlagebedingungen.
- FR8 (bestehend): Nebel des Krieges auf einzelnen Karten (Sicht 3, Boni je Rolle); Mauern und geschlossene Türen blockieren die Sicht.
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

- FR26 (neu): 3 Akte mit 20 Story-Missionen (Prolog + 6 / 7 / 6); erste Mission je Akt fest, danach 2–3 parallel wählbar, Finale nach allen anderen; Akt 3 ab der Krönung linear.
- FR27 (neu): Missionszustände: Story nicht wiederholbar, Nebenquests über Akte offen mit Gedenk-Variante, Heimsuchungen erst nach der ersten Leutnant-Begegnung, max. 6 offen.
- FR28 (geändert): Gestaffelte Regeln nach Zahl abgeschlossener Story-Missionen (Bewegung/Angriff → Dreieck → Magie → Elemente/Status/Runen/Supports); Klassen-Aktionen einer Rolle, sobald der erste Gefährte der Rolle beitritt; max. eine Lektion je Runde.
- FR29 (neu): 3D-Weltkarte von Valmora mit 3 Regionen, Nebel je Akt, Orts-Miniaturen mit bis zu 2 Varianten, Drachenzeichen je Akt, Knoten Story/Nebenquest/Heimsuchung/Heimat.
- FR30 (neu): Tageswechsel: einmal pro Kalendertag 1–3 Heimsuchungen auf gespielten Karten, reproduzierbar aus dem Datum; Stau bis 3 Tagespakete; Uhr zählt nur vorwärts.
- FR31 (neu): Heimsuchungs-Varianten boss, defend, rout (Banditennest), escort, treasure mit mindestens einem Leutnant aus einem erreichten Akt und Gegnern auf Armee-Stufe.
- FR32 (neu): Heimsuchungs-Belohnung 40 % Gold, Kopfgeld, Material, 60 % EP, keine Glutfunken; ab der 4. Heimsuchung seit der letzten Story-Mission Gold und Kopfgeld halbiert; über der erwarteten Armee-Stufe 50 % EP.
- FR33 (neu): 7 Nebenquests (2/2/3) mit Auslösern aus Entscheidungen, Gefährten oder Fortschritt; je ein Glutfunke plus Sonderbelohnung.

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
- FR44 (neu): Glutfunke als Aufstiegs-Item (12 in Staffel 1: 2 aus dem Akt-1-Finale, 7 aus Nebenquests, 3 rotierend beim Händler ab Stufe 3 für 3 000 Gold); Aufstieg ab Stufe 10 in der Akademie mit Wahl Profi A/B, Stufe → 1, Loadout 4 → 5; Erhalt als Moment inszeniert.
- FR45 (bestehend): Item-Skills mit Meisterung durch Tragen; Paperdoll, Gewicht, Seltenheit, Affixe, Runen, Sets, Aufwerten, Verbrauchsgüter, Konvoi 200.
- FR46 (neu): Ausrüstungs-Tier je Akt (Eisen, Stahl, Silber/Mondstahl) im Händler-Sortiment; Legendäre und Signatur-Items aus Nebenquests und Leutnants.
- FR47 (geändert): Goldkurve je Akt (Prolog 300; Akt 1 800–1 500; Akt 2 2 000–3 000; Akt 3 3 000–4 500; Nebenziele +30–50 %), Startgold 500; Material Eisenerz, Mondstahl, Drachenschuppe, Arkanstaub; Kosten laut GDD.
- FR48 (neu): Simulation über die verkettete Kampagne mit Heimsuchungen und Reserve-EP; Zielkorridore je Story-Mission.

**Heimat (GDD Heimat)**

- FR49 (geändert): Akt 1 wanderndes Lager mit Konvoi, Händler, Schmied, Heiler, Taverne, Lagerfeuer auf Stufe 1.
- FR50 (neu): Ab Akt 2 Burg mit 11 Räumen (Konvoi, Händler, Schmied, Verzauberer, Heiler, Taverne, Lagerfeuer, Akademie, Werkstatt, Gedächtnishalle, Übungsplatz), je 3 Stufen; Ausbau über passenden Gefährten + Gold.
- FR51 (neu): Werkstatt stellt Verbrauchsgüter aus Material her.
- FR52 (neu): Gedächtnishalle mit Gedenksteinen (auch Söldner); einmal pro Akt vererbt ein Gefallener eine Lektion.
- FR53 (neu): Übungsplatz gibt Reserve-EP (20/35/50 % der Durchschnitts-EP).
- FR54 (neu): Sichtbares Wachstum: Gefährten und ihre Gegenstände in der Burg, leerer Platz und Gedenkstein nach einem Tod.
- FR55 (neu): Eroberung der Burgruine am Ende von Akt 1 (Mission 1-6) schaltet die Burg für Akt 2 frei.

**Spielstände und Auslieferung (GDD Technical, Architektur)**

- FR56 (geändert): Auto-Save nach jeder Aktion; bis zu 3 Kampagnen je Gerät; Standard/Casual mit 3 Speicherplätzen je Kampagne, Klassik nur Auto-Save; Export/Import; Import überschreibt.
- FR57 (neu): Ein Spielstand trägt über Akt-Releases und in Staffel 2 (Entscheidungen, Überlebende, Ende).
- FR58 (neu): Akt-Pakete laden im Hintergrund und sind danach offline spielbar; Missionen eines fehlenden Pakets sind sichtbar, aber gesperrt; „Akt n erscheint bald“ am Ende eines veröffentlichten Akts.
- FR59 (neu): Proof-of-Concept-Spielstände werden erkannt und als nicht kompatibel gezeigt, Export bleibt möglich.

**Inhalte (Narrative Missionsfolge)**

- FR60 (neu): Akt 1: Prolog + 6 Story-Missionen, 2 Nebenquests (N1, N2), 4 Leutnants (Hask, Morra, Ulvric, Grosk), Entscheidungen E1–E4, Beitritte laut Narrative, Akt-1-Supports, 2 Glutfunken im Finale.
- FR61 (neu): Akt 2: 7 Story-Missionen inkl. großer Schlacht Kronfeld, N3/N4, Leutnants Brakka, Grell, Sable, Rowena, E5–E8, Region 2, Burg als Heimat.
- FR62 (neu): Akt 3: 6 Story-Missionen inkl. 2 großer Schlachten, N5–N7, Leutnants Eluned, Cassian, Mael, Torvald, Drachen als dritte Partei, E9–E12, Region 3, Epilog.
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
- NFR15: Nichts kommerziell veröffentlichen, solange GA26 (Lizenzen) offen ist.
- NFR16: Spielzeit Staffel 1 25–30 Stunden auf Normal.

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
- AR12/AR13: Szenen-Host mit Brett, Weltkarte, Heimat; geteilter Asset-Cache; Weltkarte als Kachelraster `content/world/valmora.yaml` mit `terrain3d`.
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
- UX-DR14: Truppe als Medaillon-Raster mit Rollenfilter und Marken (Aufstieg, Gespräche, Narbe); Figur mit Halbfigur, 10 Werten, 8 Plätzen, Last- und Meisterungsbalken; Wischen wechselt die Figur.
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
| FR1–FR3, FR6, FR8–FR10 | Epic 2 | bestehende Kampfregeln, im neuen HUD und Rollenmodell übernommen |
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
| FR43, FR45–FR49 | Epic 6 | Stufen, Items, Tiers, Wirtschaft, Simulation, Lager |
| FR44, FR50–FR54 | Epic 10 | Glutfunke-Aufstieg, Burg mit 11 Räumen |
| FR55 | Epic 9 | Eroberung der Burgruine (Mission 1-6) |
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
Spieler wählen ihre nächste Mission auf einer 3D-Weltkarte, die nach jeder Mission der Startpunkt ist, und finden jeden Tag neue Heimsuchungen von Leutnants auf bekannten Karten.
**FRs covered:** FR29–FR32 · AR6, AR7, AR12, AR13 · UX-DR9, UX-DR18 (Teil)

### Epic 6: Truppe, Fortschritt und Lager
Spieler verwalten ihre Truppe, rüsten aus, handeln und versorgen im Lager, sehen ein klares Ergebnis nach jeder Mission und nehmen Abschied von Gefallenen; die Kurven tragen über Akt 1 hinweg.
**FRs covered:** FR41, FR43, FR45–FR49 · AR11 · UX-DR10 (Lager), UX-DR14, UX-DR15, UX-DR19, UX-DR20

### Epic 7: Akt-Pakete und Offline
Spieler laden das Spiel schnell, bekommen den Rest eines Akts im Hintergrund und spielen danach offline; neue Akte kommen per Update, ohne dass Spielstände brechen.
**FRs covered:** FR57 (Release-Ablauf), FR58 · AR15, AR19, AR23 · NFR2, NFR8 · UX-DR18

### Epic 8: Chibi-Stil, Item-Bilder und Audio
Spieler sehen die Welt im Round-Chibi-Stil der Art Direction: Tripo-Figuren, Porträts mit Stimmungen, gemalte Item-Bilder, warmes Licht und Effekte, folk-lastige Musik und vertonte Schlüsselzeilen.
**FRs covered:** FR42, FR63 (Teil) · UX-DR16

### Epic 9: Akt 1 „Asche“ (MVP)
Spieler spielen Prolog und Akt 1 komplett: 7 Story-Missionen, 2 Nebenquests, 4 Leutnants, 4 Entscheidungen, Akt-1-Supports, Eroberung der Paktwacht. Eine Story je Mission; endet mit dem MVP-Release und Playtest.
**FRs covered:** FR55, FR60, FR63

### Epic 10: Die Burg (Heimat ab Akt 2) – grob
Spieler ziehen in die eroberte Paktwacht, bauen 11 Räume in drei Stufen aus, steigen per Glutfunke auf Profi-Wege auf und ehren Gefallene in der Gedächtnishalle.
**FRs covered:** FR14, FR15, FR44, FR50–FR54 · UX-DR10 (Burg), UX-DR11, UX-DR21

### Epic 11: Akt 2 „Glut“ – grob
Spieler spielen Akt 2 mit 7 Story-Missionen inklusive der großen Schlacht Kronfeld, 2 Nebenquests, 4 Leutnants und 4 Entscheidungen in der Eisenmark.
**FRs covered:** FR17 (Akt 2), FR61, FR63

### Epic 12: Akt 3 „Krone“ und Staffelende – grob
Spieler spielen Akt 3 bis zum Staffelfinale, sehen das Epilog-Mosaik und nehmen ihren Spielstand mit in Staffel 2.
**FRs covered:** FR17 (Akt 3), FR39, FR57 (Staffel 2), FR62, FR63 · AR20 · UX-DR22

**Reihenfolge:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 (MVP-Release), danach 10 → 11 → 12. Jedes Epic baut nur auf den vorherigen auf; Epic 8 kann ab Epic 2 parallel laufen (Asset-Arbeit), seine Einbindung setzt die jeweiligen Szenen voraus.
