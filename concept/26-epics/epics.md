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
**Dann** stehen sie als CSS-Variablen in `src/ui/` bereit und Fraunces ist als Namensschrift eingebunden (einzige neue Abhängigkeit: Schriftpaket)
**Und** es gibt wiederverwendbare Preact-Komponenten `Piece`, `PrimaryButton`, `SecondaryButton`, `QuietButton` mit Druckzustand (Unterkante 4 → 1 px).

**Angenommen** ein Betrag an Gold, Material, EP oder Glutfunken
**Wenn** die UI ihn anzeigt
**Dann** rendert die Komponente `Amount` immer Symbol + Zahl (Münze, Erz-Raute, Stern, Funke) mit tabellarischen Ziffern
**Und** ein Material ohne festgelegtes Symbol lässt `pnpm content:check` scheitern.

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
**Wenn** der Spieler exportiert oder importiert
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
**Und** nicht mögliche Aktionen sind gedimmt, nie versteckt.

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
möchte ich in Akt 1 unterscheidbare Gegner (Banditen, Wolfsreiter, Söldner) erleben,
damit Kämpfe abwechslungsreich bleiben.

**Akzeptanzkriterien:**

**Angenommen** die Gegnerklassen von Akt 1 im Rollenschema
**Wenn** sie auf Karten stehen
**Dann** haben Wolfsreiter den Bewegungstyp beritten und Effektivität gegen sie greift (z. B. Pferdetöter); Banditen und Söldner unterscheiden sich in Waffen und KI-Profil
**Und** ihre Werte stehen in Content-YAML und sind per `pnpm sim` geprüft.

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
**Und** das Brett spielt Rückwärtssprung, Rauchwölkchen und fallenden Wimpel, dazu eine Fluchtzeile als Sprechblase.

### Story 3.3: Groll und Groll-Ziel

Als Spieler
möchte ich, dass ein Leutnant sich an die Figur erinnert, die ihn vertrieben hat,
damit die Welt sich an meine Truppe erinnert.

**Akzeptanzkriterien:**

**Angenommen** ein Leutnant ist geflohen
**Wenn** die Mission gewonnen ist
**Dann** erhöht `finishBattle` in `c.lieutenants[id]` `routs`, setzt `grudge = min(3, grudge + 1)` und `target` auf den Vertreiber
**Und** die Wirkung `grudge: { lt, delta: -1 }` senkt den Groll (für Entscheidungen, Epic 4).

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
**Dann** öffnet der Steckbrief: Medaillon mit Goldring, Groll-Kerben, Name und Rolle, Groll-Ziel, Fluchtregel, Kopfgeld, Begegnungen und Vertreibungen, Groll-Fähigkeiten (gesperrte gestrichelt) (Mockup 02)
**Und** dieselbe Ansicht gibt es als Liste aller bekannten Leutnants, erreichbar über das Menü (ab Epic 5 über die Leiste „Steckbriefe“).

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
