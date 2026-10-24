---
title: "Hollow Crown – Ausrüstung und Items (Staffel 1)"
status: draft
created: 2026-10-23
updated: 2026-10-23
parent: concept/21-gdd/gdd.md
decisions: concept/21-gdd/decision-log.md
art: concept/23-art-direction/art-direction.md §5.6
supersedes: Seltenheitstabelle und Farben in concept/05-inventory-items.md §5
---

# Ausrüstung und Items – Staffel 1

Begleitdokument zum GDD (Abschnitt „Inventar und Ausrüstung“). Es legt fest, welche Waffen und Items es in Staffel 1 gibt, wie Material-Tier und Seltenheit zusammenspielen und welche Unikate an Figuren und Story hängen. Paperdoll, Gewicht, Runen, Aufwertung und Sets bleiben wie im GDD und in `05-inventory-items.md`. Die Werte selbst stehen später in `content/items.yaml`, nicht hier. **[A]** = vom Produktinhaber abgestimmt, **[C]** = vom Assistenten gesetzter Startwert.

## 1. Zwei Achsen: Tier und Seltenheit [A]

| Achse | Bedeutung | Werte | Sichtbar |
|---|---|---|---|
| **Tier** (Material) | Grundstärke der Basiswaffe; folgt dem Akt | Eisen (Akt 1), Stahl (Akt 2), Silber (Akt 3); Mondstahl als seltene, leichte Variante ab Akt 2 | im Icon über Metall und Beschläge |
| **Seltenheit** | Zusatzeigenschaften und Herkunft | Gewöhnlich, Selten, Episch, Legendär, Relikt | nur im UI-Rahmen, nie im Icon |

- Basiswaffen gibt es als Gewöhnlich, Selten oder Episch. Die Seltenheit wird beim Drop gewürfelt (Seed) und bestimmt die Zahl der Affixe.
- Legendär und Relikt sind feste Unikate. Es gibt jedes nur einmal.
- **Ein Icon je Basis-Item:** „Flinkes Stahlschwert“ (selten) nutzt das Bild des Stahlschwerts. Nur Unikate haben eigene Bilder.

## 2. Seltenheit [A]

| Stufe | Affixe | Runen-Slots | Skill | Meisterung | Quelle | Rahmen |
|---|---|---|---|---|---|---|
| Gewöhnlich | 0 | 1 | selten (Item-Skill der Basis) | 20 FP | Händler, häufige Drops | Steingrau, keine Raute |
| Selten | 1 | 2 | wie Basis | 30 FP | Truhen, Dörfer, Händler ab Stufe 2 | Türkis, 1 Raute |
| Episch | 2 | 2 | wie Basis | 40 FP | Leutnant-Kopfgeld, Bosse, Nebenziele | Violett, 2 Rauten |
| Legendär | fest | 2 | eigener Skill | 60 FP | handplatziert, Nebenquests, Leutnant-Signaturen | Gold, 3 Rauten |
| **Relikt** | fest | 1 (nur Hilfs-Rune) | erwacht in 3 Stufen (§5) | keine; Skills kommen mit dem Erwachen | je Akt eine Lore-Nebenquest | Gold mit Glutorange, hohle Krone statt Rauten |

- Farben und Rauten im Detail: Art Direction §5.6. Blau gibt es nicht, weil Blau und Rot für die Teams reserviert sind (U21).
- Meisterung nach GDD (Annahme 7); Relikte neu. [C]

## 3. Signatur [A]

Eine Signatur ist ein legendäres Unikat, das zu einer Person gehört.

- **Jede Figur mit passender Waffengruppe kann es führen.** Der **Besitzer** erhält zusätzlich einen Besitzer-Effekt (z. B. +10 Treffer und eine Zusatzwirkung des Skills). [A]
- Besitzer einer **Gefährten-Signatur** ist der Gefährte. Fällt er, bleibt die Waffe in der Truppe; wer sie danach trägt, bekommt den Besitzer-Effekt nicht, aber eine Gedenk-Zeile beim ersten Anlegen. [C]
- Besitzer einer **Leutnant-Signatur** ist die Einheit, die den Leutnant beim Fallenlassen der Waffe vertrieben hat. Seitenwechsler (Grosk, Sable, Mael) bringen ihre eigene Signatur mit und sind selbst Besitzer. [C]
- Im UI: Legendär-Rahmen plus kleines Namensbanner des Besitzers.

## 4. Waffengruppen [A]

Abgeleitet aus den Rollenklassen im GDD.

| Gruppe | `weaponType` | Rollen | Dreieck | Besonderheit |
|---|---|---|---|---|
| Schwert | `sword` | Plänkler, Taktiker, Hauptmann | schlägt Axt | ausgewogen |
| Lanze | `lance` | Vorkämpfer, Hauptmann | schlägt Schwert | Wurfformen 1–2 |
| Axt (mit Hammer) | `axe` | Vorkämpfer, Kampfpriester (nur Hammer) | schlägt Lanze | Hammer effektiv gegen Gepanzerte |
| Dolch | `dagger` | Plänkler, Späher, Spielmann | **außerhalb** | leicht, hoher Krit, Wurfformen 1–2 [C] |
| Bogen | `bow` | Schütze, Späher (nur leichte Bögen) | außerhalb | effektiv gegen Flieger; Armbrust ist eine Bogen-Unterart |
| Elementarbuch | `anima` | Elementarist, Taktiker | Elementkreis | Feuer, Wind, Erde, Wasser |
| Lichtbuch | `light` | Heiler | Licht ↔ Dunkel | effektiv gegen Monster und Untote |
| Dunkelbuch | `dark` | Hexer (Profi) | Licht ↔ Dunkel | nur Drop, nie beim Händler |
| Stab | `staff` | Heiler | – | Heilen und Hilfe |
| Schild | `shield` (Nebenhand) | Vorkämpfer | – | DEF |
| Fokus | Nebenhand | Elementarist | – | MAG/RES, Set-Teile |
| Laute | Nebenhand | Spielmann | – | verstärkt Anfeuern (z. B. +5 Treffer zusätzlich) [C] |

## 5. Relikte [A]

Drei Relikte, eins je Akt. Jedes kommt aus der Lore-Nebenquest seines Akts und **erwacht mit der Story** in drei Stufen: schlafend → erwachend → erwacht. Jede Stufe schaltet eine Fähigkeit frei und ändert das Icon. Ist der Story-Punkt beim Erhalt schon erreicht, erwacht die Stufe sofort. Quellen und Erwachungs-Punkte sind Startwerte. [C]

| Akt | Relikt | Slot | Quelle | Erwachend bei | Erwacht bei | Idee |
|---|---|---|---|---|---|---|
| 1 | **Schild der Paktwächter** (`pact_warden_shield`) | Nebenhand, Schild | N2 „Der letzte Wachturm der Paktwächter“ (ersetzt den legendären Schild) | 1-6 Paktwacht erobert | 2-8 „Die Krone war hohl“ | Schutz für Nachbarn, später Halten auch ohne Vorkämpfer-Rolle |
| 2 | **Drachenglut** (`dragon_ember`) | Accessoire, Amulett | N5 „Glut unter dem Berg“ (zusätzlich zur Erd-Rune III) | 2-8 Kronfeld | 3-6 Drachen über der Stadt | Magie wächst mit den erwachenden Drachen; MAG, später Feuer-Affinität und Brandschutz |
| 3 | **Aldrics Paktklinge** (`pact_blade`) | Haupthand, Schwert | N9 „Das Grab Aldrics I.“ | 3-5 Die Krönung | 3-8 Finale | effektiv gegen Drachen; die letzte Stufe hängt am Gespräch mit Vhaelyra |

## 6. Katalog Staffel 1

`id` in Klammern; **fett** = neu gegenüber `content/items.yaml`. Namen und Effekte sind Vorschläge, die Zahlen folgen beim Balancing. [C]

### 6.1 Basiswaffen (60)

| Gruppe | Akt 1 (Eisen) | Akt 2 (Stahl) | Akt 3 (Silber) | Sonderformen |
|---|---|---|---|---|
| Schwert | Eisenschwert (`iron_sword`) | Stahlschwert (`steel_sword`) | **Silberschwert** (`silver_sword`) | Schmalschwert (`slim_sword`, A1, leicht); **Panzerstecher** (`armorpiercer`, A2, effektiv gegen Gepanzerte); **Mondstahlklinge** (`moonsteel_blade`, A3, leicht, hoher Krit) |
| Lanze | Eisenlanze (`iron_lance`) | Stahllanze (`steel_lance`) | **Silberlanze** (`silver_lance`) | Wurfspeer (`javelin`, A1, 1–2); Reiterspieß (`horseslayer`, A1, effektiv gegen Beritten); **Mondstahlspeer** (`moonsteel_spear`, A3, 1–2, leicht) |
| Axt | Eisenaxt (`iron_axe`) | Stahlaxt (`steel_axe`) | **Silberaxt** (`silver_axe`) | Handaxt (`hand_axe`, A1, 1–2); Kriegshammer (`hammer`, A2, effektiv gegen Gepanzerte) |
| Dolch | **Eisendolch** (`iron_dagger`) | **Stahldolch** (`steel_dagger`) | **Silberdolch** (`silver_dagger`) | **Wurfmesser** (`throwing_knives`, A1, 1–2); **Stilett** (`stiletto`, A2, hoher Krit) |
| Bogen | Eisenbogen (`iron_bow`) | Stahlbogen (`steel_bow`) | **Silberbogen** (`silver_bow`) | **Jagdbogen** (`hunting_bow`, A1, leicht, Späher); Langbogen (`longbow`, A2, 2–3) |
| Feuer | Glimmen (`ember`) | **Flammenstoß** (`blaze`) | **Glutsturm** (`ember_storm`) | – |
| Wind | Böe (`gust`) | **Sturmklinge** (`gale_blade`) | **Orkan** (`hurricane`) | – |
| Erde | Steinschlag (`rockfall`) | **Felsfaust** (`stone_fist`) | **Beben** (`quake`) | Felswall (`stone_wall`, A1, ohne Schaden) |
| Wasser | Welle (`surge`) | **Strudel** (`whirlpool`) | **Mahlstrom** (`maelstrom`) | – |
| Licht | Schein (`shine`) | **Lichtlanze** (`light_lance`) | **Sonnenrad** (`sun_wheel`) | – |
| Dunkel | – | **Schatten** (`shadow`) | **Leere** (`void`) | – |
| Stab | Heilstab (`heal_staff`); Linderungsstab (`remedy_staff`) | Mehrheilstab (`mend_staff`); **Fernheilstab** (`physic_staff`, 1–3) | **Schutzstab** (`ward_staff`, +RES für einen Verbündeten) | – |
| Schild | Holzschild (`wooden_shield`); Eisenschild (`iron_shield`) | Turmschild (`tower_shield`); **Rundschild** (`round_shield`, leicht, +Ausweichen) | **Silberschild** (`silver_shield`) | – |
| Fokus | Glutfokus (`ember_focus`) | **Kristallfokus** (`crystal_focus`, +RES) | **Mondstahlkugel** (`moonsteel_orb`, +MAG) | – |
| Laute | – | **Wanderlaute** (`travel_lute`) | **Silberlaute** (`silver_lute`) | – |

### 6.2 Gefährten-Signaturen (7, aus Nebenquests)

| Besitzer | Waffe | Gruppe | Quelle | Idee |
|---|---|---|---|---|
| Fenn | **Elster** (`magpie`) | Dolch | N1 Der Ring von Varnhold | Stehlen auch von ausgerüsteten Items |
| Tobin | **Erbstück** (`heirloom`) | Lanze | N3 Das Erbe | +Mt, solange ein Verbündeter in Reichweite 2 niedergestreckt ist („Helden sterben jung“) [C] |
| Ilka | **Weißwolf** (`white_wolf`) | Bogen | N4 Der Clan im Schnee | Nebel und Schnee kosten keine Sicht |
| Jory | **Letzter Vorhang** (`final_curtain`) | Laute (Nebenhand) | N6 Die Gauklertruppe | Anfeuern wirkt auf zwei Verbündete [C] |
| Rhen | **Das verbotene Kompendium** (`forbidden_compendium`) | Elementarbuch | N7 Verwiesen | wechselt das Element je Kampf |
| Brenna | **Heimkehr** (`homecoming`) | Axt (Doppelaxt) | N8 Brennas Bruder | Schutz für Nachbarn mit Support |
| Pell | **Turmfalke** (`kestrel`) | Bogen (Langbogen) | N10 Die Unterstadt | +1 Reichweite von Mauern, Dächern und Türmen [C] |

### 6.3 Leutnant-Signaturen (12)

Passend zu Signaturteil und Rolle der Leutnants (Art Direction §4.3). Die Narrative hatte die Signaturwaffen offen gelassen (Schritt 6); dies ist der Vorschlag. [C]

| Akt | Leutnant | Waffe | Gruppe |
|---|---|---|---|
| 1 | Grosk | **Kinderhand** (`little_hands`) | Schild |
| 1 | Hask | **Zunder** (`tinder`) | Axt, Feuer |
| 1 | Morra | **Kopfgeld** (`bounty`) | Bogen (Armbrust) |
| 1 | Ulvric | **Wolfszahn** (`wolf_fang`) | Lanze |
| 2 | Dame Rowena | **Schwingenlanze** (`wing_lance`) | Lanze |
| 2 | Sable | **Dravns Eid** (`dravns_oath`) | Schwert |
| 2 | Kapitän Grell | **Goldhaken** (`gold_hook`) | Schwert (Entersäbel) |
| 2 | Brakka | **Wyvernbeil** (`wyvern_cleaver`) | Axt |
| 3 | Inquisitor Cassian | **Urteil** (`verdict`) | Lichtbuch |
| 3 | Mael | **Paktglocke** (`pact_bell`) | Axt (Hammer) |
| 3 | Hauptmann Torvald | **Letzte Mauer** (`last_wall`) | Schild (Turmschild) |
| 3 | Wächterin Eluned | **Porzellan** (`porcelain`) | Dolch |

### 6.4 Legendäre Waffen (5, handplatziert)

| Akt | Waffe | Gruppe | Fundort |
|---|---|---|---|
| 1 | Aschenklinge (`ashen_blade`) | Schwert, Feuer | Truhe in 1-6 Die Paktwacht |
| 2 | Morgenbrecher (`dawnbreaker`) | Bogen, Licht | Nebenziel in 2-5 Die Brandschneise |
| 2 | **Silberschwinge** (`silverwing`) | Lanze | Banner der Silbernen Lanze, Nebenziel in 2-3 |
| 3 | **Schuppenbrecher** (`scalebreaker`) | Axt, effektiv gegen Drachen | Nebenziel in 3-3 |
| 3 | **Sternenstab** (`star_staff`) | Stab, heilt im Radius 1 | Nebenziel in 3-2 |

### 6.5 Relikte (3, je 3 Erwachungsstufen)

Siehe §5: Schild der Paktwächter, Drachenglut, Aldrics Paktklinge.

### 6.6 Weitere Items (49)

| Art | Items |
|---|---|
| Kopf (6) | Lederkappe (`leather_cap`), Eisenhelm (`iron_helm`), Magierhaube (`mage_hood`), **Stahlhelm** (`steel_helm`), **Silberhelm** (`silver_helm`), **Silberreif** (`silver_circlet`, RES) |
| Körper (9) | Lederweste (`leather_vest`), Kettenhemd (`chainmail`), Plattenpanzer (`plate_armor`), Magierrobe (`mage_robe`), Glutrobe (`ember_robe`), **Schuppenpanzer** (`scale_mail`, A2 mittel), **Silberharnisch** (`silver_plate`, A3 schwer), **Spähermantel** (`scout_cloak`, +Ausweichen), **Priestergewand** (`priest_vestment`, RES) |
| Accessoires (10) | Kraftring (`power_ring`), Windfeder (`wind_feather`), Glücksbringer (`lucky_charm`), Erdamulett (`earth_amulet`), Aschenbanner-Abzeichen (`ashen_badge`), **Ring der Weisheit** (`wisdom_ring`, MAG), **Flinkring** (`swift_ring`, SPD), **Schutzamulett** (`guard_amulet`, DEF), **Lichttalisman** (`light_talisman`, RES), **Wolfszahnkette** (`fang_necklace`, Krit) |
| Verbrauchsgüter (9) | Heiltrank (`vulnerary`), Linderungssalbe (`remedy_salve`), Schlüssel (`door_key`), Feuerbombe (`fire_bomb`), Schriftrolle der Hast (`haste_scroll`), Fackel (`torch`), **Glutfunke** (`ember_spark`, ersetzt `promotion_seal`), Seherkraut (`seers_herb`), **Fallen-Set** (`trap_kit`) |
| Material (4) | Eisenerz (`iron_ore`), Mondstahl (`moonsteel`), Drachenschuppe (`dragon_scale`), Arkanstaub (`arcane_dust`) |
| Runen (10 Icons) | je Element ein Icon (Feuer, Wind, Erde, Wasser, Licht, Dunkel), Stufe I–III zeigt die UI; Hilfs-Runen Präzision, Wucht, Schärfe, Leichtigkeit |
| Story (1) | **Chronik-Seite** (`chronicle_page`) |

## 7. Mengengerüst Grafik

| Block | Icons |
|---|---|
| Basiswaffen | 60 |
| Signaturen (Gefährten + Leutnants) | 19 |
| Legendäre | 5 |
| Relikte (3 × 3 Stufen) | 9 |
| Weitere Items | 49 |
| **Summe** | **142** |

Stil, Format und Ablauf der Erzeugung: Art Direction §5.6.

## 8. Offene Punkte

- Werte aller neuen Items in `content/items.yaml` (Zod-Schema, `weaponType` um `dagger` und `dark` erweitern, Laute als Nebenhand) und Balancing per `pnpm sim`.
- Besitzer-Effekte und Relikt-Fähigkeiten im Detail, wenn die Skills geschrieben werden.
- Inventar-Bildschirm (Paperdoll, Konvoi, Händler, Vergleich vorher/nachher) in der UX-Etappe.
- 3D-Handwaffen je Waffengruppe für das Brett (Art Direction §4.6, offen).
