# Figuren-Bestand Akt 1 und Akt 2

Stand 2026-11-05. Bestandsaufnahme als Vorarbeit für Etappe 3 der Roadmap (`concept/27-ueberarbeitung/roadmap.md`). In dieser Runde wurden keine neuen Bilder und keine neuen Modelle erzeugt.

## Kurzfassung

- **Figuren-Bibel:** Es gibt sie nicht, auch nicht unter anderem Namen. Die Bausteine liegen verstreut (siehe unten).
- **Porträts:** Alle 51 sind v2.5. Es fehlen nur die Stimmungen der Akt-2-Figuren und die Büsten neuer Gegnertypen.
- **Modelle:** Alle stammen vom Oktober, also aus der Zeit vor den neuen Porträts. Von 35 geprüften Figuren passen **23**, bei **6** fehlt etwas Wesentliches, **6** widersprechen dem Porträt oder fehlen ganz.
- **Vorschlag:** **13 neue Modelle** in drei Schritten, dazu ein Tausch ohne Kosten. Das sind 1 820 Tripo-Credits plus ein Pferd.
- **Engpass:** Rechnerisch sind noch rund 425 Credits da (siehe „Credits“). Das reicht für 3 Modelle, also nicht einmal für Schritt 1 ganz.

![Die vier auffälligsten Fälle](../../art/previews/figuren_bestand_faelle.png)

## Vorschlag: Reihenfolge

| Schritt | Was | Stück | Credits | Warum jetzt |
|---|---|---|---|---|
| 0 | **Bibel** für Akt 1 und 2 schreiben, Figurenblätter von Lucan, Rowena und Brakka berichtigen | 1 Dokument | 0 | Jeder neue Turnaround braucht sie; sonst wird zweimal gebaut |
| 0 | `sprite: archer` auf `bandit_archer` umstellen | 9 Stellen auf 4 Karten | 0 | Die Kastenfigur verschwindet sofort, das Modell gibt es schon |
| 1 | **Lucan**, **Verwalter der Paktwacht**, **Osric Dunn**, **Dorfältester** | 4 | 560 | Widersprüche, die in Akt 1 zu sehen sind; Lucan steht in jeder Mission |
| 2 | **Brenna**, **Mira**, **Varek**, **Ysolde** | 4 | 560 | Signaturteil fehlt oder wird vom Teamtuch überdeckt |
| 3 | **Rowena**, **Brann**, neu: **Ritter der Lanze**, **Reiter zu Pferd**, **Kaperer** | 5 + Pferd | 700 + Pferd | Vor dem Bau von Akt 2 |
| | **Summe** | **13 + Pferd** | **1 820 + Pferd** | |

- Je Modell kommt ein Brett-Turnaround per ChatGPT dazu.
- **Ysolde** zuletzt: Ihr Turnaround gehört zu den Lieblingen des Produktinhabers (Decision-Log 2026-11-01). Neu nur, wenn die Bibel ihr Teamtuch auf ein kleineres Stück legt.
- **Brakka** ist nicht mitgezählt: Das Modell sieht aus wie das Porträt, nur das Figurenblatt ist veraltet. Neu nur, wenn sie als Ballistenmeisterin anders aussehen soll.
- Die drei neuen Gegnertypen sind eine Schätzung; sie sind gegen die Akt-2-Entwürfe zu prüfen, sobald diese vorliegen.

**Alternative „alle neu“:** Die Roadmap verlangt neue Turnarounds je Figur. Das wären 37 Modelle und 5 180 Credits für Akt 1 und 2. Empfehlung ist die kleine Variante: 23 Modelle passen, und die fünf Lieblings-Turnarounds (Rhen A/B, Tobin, Fenn, Ysolde) sollen ohnehin die Vorlage bleiben.

### Porträts, die dazukommen

| Was | Stück | Hinweis |
|---|---|---|
| Stimmungen Nell, Brann, Amos, Ilka, Sable, Brakka, Grell, Rowena, Maelis | 27 | je 3; §5.1 verlangt sie für Kompanie, Leutnants und Maelis |
| Stimmungen Seraphine | 3 | erst nach Funkenflug #9, sonst doppelt |
| Seraphine mit Waffe (Funkenflug #9) | 1 | nur falls sie spielbar wird; Kampfrolle ist offen |
| Büsten Ritter, Reiter, Kaperer | 3 | zusammen mit Schritt 3 |
| Brennas Bruder (Funkenflug #8) | 1 | Akt 3, Nebenquest N8; kein Modell nötig, kann warten |
| Brakka als Ballistenmeisterin | 0–1 | nur falls das Figurenblatt ihr Aussehen ändert |

## Offen, entscheidet der Produktinhaber

1. **Umfang und Credits:** 13 oder 37 Modelle, und ob Tripo-Credits nachgekauft werden.
2. **Widerspruch in den Vorgaben:** `portrait_master.md` sagt „Brettfiguren bleiben, wie sie sind“, die Roadmap verlangt in Etappe 3 neue Turnarounds.
3. **Pferd:** Akt 2 braucht Reiterei und Rowena zu Pferd, Reittiere stehen aber als offen in `art-direction.md` §4.6 und sind im GDD „nach dem MVP“ eingeplant. Für Vierbeiner gibt es noch keinen Weg durch die Pipeline.
4. **Seraphines Kampfrolle** (Funkenflug #9) und ob **Dravn, Maelis und Seraphine** auf einer Karte stehen. Die Missionsliste gibt ihnen keine Kampfrolle, deshalb sind sie hier ohne Modell eingeplant.

## Was die Bibel klären sollte

Drei Muster aus dem Vergleich, die über einzelne Figuren hinausgehen:

- **Alle gleich groß:** Die 40 Tripo-Figuren messen 0,80–0,83 Felder. Tobin (0,813), Lucan (0,809) und Grosk (0,820) sind praktisch gleich hoch, obwohl `portrait_master.md` §5 sie als small, tall und heavy führt. Alle Turnarounds wurden mit Kaels Bogen als Vorlage erzeugt. Das erklärt vermutlich einen Teil von „die Figuren wirken generisch“ (Decision-Log 2026-11-01).
- **Teamtuch frisst Signaturteile:** Varek verliert den roten Mantel, Ysolde die Akademie-Robe, Nell den Kapitänsrock. Die Bibel sollte je Figur festlegen, welches Stück das Teamtuch trägt.
- **Waffen sind generisch:** Das Modell zeigt nur die Waffengruppe. Grosks Schild mit den Kinderhänden, Lioras Kristallstab und Brennas Doppelaxt gibt es auf dem Brett nicht.

Bausteine, die schon da sind:

| Baustein | Wo | Stand |
|---|---|---|
| Figurenblätter (Statur, Kopf, Gesicht, Haar, Palette, Kleidung, Waffe, Signatur) | `art/prompts/<id>.md`; bei den 17 Figuren aus den Stiltests in `art/prompts/portrait_tests_2026-11.md` | v2.5, kommt der Bibel am nächsten; Rowena und Brakka veraltet |
| Regeln für den Kader, Fraktions-Kits | `art/prompts/portrait_master.md` §5 | aktuell; §9 verweist die Kader-Zuordnung ausdrücklich auf Etappe 3 |
| Signaturteile | `art-direction.md` §4.3 | teils veraltet: Rowena „Pegasus“, Brakka „Wyvern“, Sable „Stoppeln“, dazu noch der Name Kael |
| Rollen, Motive, Biografien | `22-narrative/narrative.md`, `missionsliste-s1.md`, `staffelbogen.md` | die neuen Gefährten-Motive sind laut `staffelbogen.md` noch offen |

## Bestand

Legende: ✅ passt, 🟡 Wesentliches fehlt, ❌ Widerspruch oder kein Modell. „Passt“ meint dieselbe Figur in vereinfachter Fassung, wie `art-direction.md` §4.6 es vorsieht, nicht ein genaues Abbild. Porträt: alle Einträge v2.5; „4“ = neutral und drei Stimmungen. Turnaround und Modell entstanden am 23.–26. Oktober, also vor den neuen Porträts.

<details>
<summary>Akt 1: Kompanie und Leutnants (14)</summary>

![Akt 1 Kompanie](../../art/previews/figuren_bestand_akt1_kompanie.png)

| Figur | Porträt | Turnaround | Modell | Passt | Befund |
|---|---|---|---|---|---|
| Rhen A (`avatar_a`) | 4 | ja | ja | ✅ | |
| Rhen B (`avatar_b`) | 4 | ja | ja | ✅ | Ziel sind 4 Avatar-Vorlagen (§5.1), vorhanden 2 |
| Lucan (`kael`) | 4 | ja | ja | ❌ | Modell zeigt den alten Kael, kein Grün, kein Pelz; Inhalts-IDs heißen noch `kael` |
| Brenna | 4 | ja | ja | 🟡 | dicker Zopf fehlt schon im Turnaround |
| Tobin | 4 | ja | ja | ✅ | |
| Fenn | 4 | ja | ja | ✅ | |
| Mira | 4 | ja | ja | 🟡 | Seitenzopf kaum lesbar, Feder fehlt, grüner Umhang wird Teamtuch |
| Liora | 4 | ja | ja | ✅ | |
| Varek | 4 | ja | ja | 🟡 | roter Mantel wird Teamtuch, Pelzkragen fehlt |
| Ysolde | 4 | ja | ja | 🟡 | ganze Akademie-Robe wird Teamtuch; Haar und Brille stimmen |
| Grosk | 4 | ja | ja | ✅ | |
| Hask | 4 | ja | ja | ✅ | |
| Morra | 4 | ja | ja | ✅ | |
| Ulvric | 4 | ja | ja | ✅ | |

</details>

<details>
<summary>Akt 1: Nebenfiguren und Gegner (11 + Altbestand)</summary>

![Akt 1 Gegner](../../art/previews/figuren_bestand_akt1_gegner.png)

| Figur | Porträt | Turnaround | Modell | Passt | Befund |
|---|---|---|---|---|---|
| Dorfältester (`villager_elder`) | 1 | ja | ja | ❌ | Modell mit Glatze und Vollbart, Porträt seit 2026-11-03 mit Strohhut und Kinnbärtchen |
| Dorfkind (`villager_child`) | 1 | ja | ja | ✅ | |
| Osric Dunn | 1 | nein | nein | ❌ | Boss von 1-4 steht als `mercenary` auf der Karte, laut Kartenkommentar Platzhalter |
| Verwalter (`paktwacht_steward`) | 1 | nein | nein | ❌ | zu schützendes Ziel in 1-8; Klasse verweist auf `cleric`, das Modell gibt es nicht. Laut Code erscheint eine Platzhalter-Figur, **im Spiel nicht geprüft** |
| Bandit (`brigand`) | 1 | ja | ja | ✅ | 43 Stellen |
| Bandit-Schütze (`bandit_archer`) | 1 (`class_archer`) | ja | ja | ✅ | 12 Stellen |
| Soldat (`soldier`) | 1 | ja | ja | ✅ | 28 Stellen; Porträt trägt das Grenzheer-Kit, passt also für Akt 2 |
| Söldner (`mercenary`) | 1 | ja | ja | ✅ | 26 Stellen |
| Wolfsreiterin (`wolf_rider`) | 1 | ja | ja | ✅ | 10 Stellen; zu Fuß wie geplant |
| Tempelwache (`temple_guard`) | 1 | ja | ja | ✅ | 11 Stellen |
| Schütze (`archer`) | 1 (`class_archer`) | ja | Blender | ❌ | Kastenfigur, 9 Stellen; nie durch Tripo gegangen |

**Ohne Modell, keines nötig:** Gerrit (Entscheidung 2026-10-24), Aldric I. Beide stehen auf keiner Karte. Halvard steht in Akt 1 ebenfalls auf keiner Karte, ist aber Boss von 3-8 und braucht für Akt 3 ein Modell.

**Altbestand aus Blender ohne Einsatz auf Akt-1-Karten:** `fighter`, `mage`, `avatar`. Ein `class_cleric`-Porträt ist da, ein Modell nicht.

</details>

<details>
<summary>Akt 2: geplante Figuren (10 + neue Gegner)</summary>

![Akt 2](../../art/previews/figuren_bestand_akt2.png)

| Figur | Porträt | Turnaround | Modell | Passt | Befund |
|---|---|---|---|---|---|
| Jory | 4 | ja | ja | ✅ | |
| Odile | 4 | ja | ja | ✅ | |
| Nell | 1 | ja | ja | ✅ | Kapitänsrock wird Teamtuch |
| Brann | 1 | ja | ja | 🟡 | deutlich massiger als das Porträt, Steinadern fehlen |
| Amos | 1 | ja | ja | ✅ | |
| Ilka | 1 | ja | ja | ✅ | |
| Sable | 1 | ja | ja | ✅ | Porträt und Modell zeigen längeres Haar, §4.3 sagt Stoppeln |
| Brakka | 1 | ja | ja | 🟡 | sieht aus wie das Porträt; Figurenblatt sagt noch „wyvern rider“, die Missionsliste Ballistenmeisterin |
| Grell | 1 | ja | ja | ✅ | |
| Rowena | 1 | ja | ja | ❌ | Porträt: Helm unterm Arm, langer Zopf. Modell: Helm auf dem Kopf. Figurenblatt sagt noch „pegasus knight“, die Missionsliste Lanzenritterin zu Pferd; ein Pferd gibt es nicht |

**Ohne Modell:** Dravn (Porträt 4), Maelis (1), Seraphine (1, ohne Waffe). Sie bekommen nach §4.3 nur ein Modell, wenn sie auf einer Karte stehen.

**Neu nötig (Schätzung):** Ritter der Silbernen Lanze (Klasse `knight` hat keine Figur), Reiter zu Pferd, Grells Kaperer. Das Grenzheer kann `soldier` nutzen. `pegasus_knight` steht noch in `classes.yaml` und GDD, obwohl Akt 2 seit 2026-11-01 ohne Flieger geplant ist.

</details>

## Credits

Eine Figur kostet 140 Credits (`art-direction.md` §4.6). Letzter Eintrag im Decision-Log: 705 am 2026-10-24. Danach kamen die beiden Dorffiguren dazu, also rechnerisch rund **425**. Dieser Wert ist nicht in Tripo nachgeprüft, und ob sich das Guthaben auffüllt, steht nicht im Repo.

## Wie die Bilder entstanden

Die Bögen unter `art/previews/figuren_bestand_*.png` zeigen links das Porträt, in der Mitte den Turnaround-Frontbogen und rechts einen Blender-Render von `art/models/units/<id>.glb` im ersten Idle-Bild, ohne Waffe. Das Teamtuch ist wie im Spiel eingefärbt: blau eigene, rot Gegner, grün Dritte. Gerendert wurde mit Cycles, weil die Workbench-Ansicht die Textur-Transformation der komprimierten Modelle ignoriert und die Figuren fleckig zeigt. Die Beurteilung ist eine Sichtprüfung der Bögen, kein Blick aufs Spielbrett.

**Vorsicht:** Die Farbspalten von `art/previews/silhouettes_act1*.png` (`tools/art/silhouettes.py`) haben genau diesen Workbench-Fehler. Für Farburteile taugen sie nicht, die schwarzen Silhouetten sind nicht betroffen.
