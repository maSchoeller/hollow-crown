# Addendum – Game Brief V1

Vertiefungen für GDD, Narrative und Art Direction, die nicht in den Brief gehören.

## Recherche-Digest (2026-10-23)

- 20–30 Missionen ≈ 25–40 h Spielzeit bei FE-artigen Spielen; Triangle Strategy ~20 Kapitel, Routen ab Kap. 17.
- Hub zwischen Missionen trägt Bindung (Three Houses, Engage), Kritik: Aktivitäten ziehen sich → auf Mobile kurz und überspringbar halten.
- Nemesis (Shadow of Mordor): Flucht, Wiederkehr, Beförderung nach Spielerniederlage. Kritik: prozedurale Namen/Dialoge austauschbar, Wiederkehr nach sauberem Sieg frustriert. Patent WB (US) beachten → eigene, handgeschriebene Umsetzung.
- Hochformat-Taktik: kaum Konkurrenz, Nachfrage unbelegt. Freundliche, klar lesbare Stile wirken auf kleinen Displays und in Store-Screenshots einladender.
- Quellen: inverse.com (Triangle Strategy), videogameschronicle.com (Three Houses), shacknews.com (Nemesis), dekudeals.com (Unicorn Overlord, Wartales).

## Nemesis-Leutnants – Rohidee für das GDD

> **Abgelöst durch `concept/21-gdd/gdd.md`:** Leutnants sterben nie, sie fliehen bei 0 TP; es gibt weder Fluchtschwelle noch endgültigen Sieg. Der Abschnitt bleibt als Herleitung stehen.

- Fluchtregel: Leutnant fällt unter X % TP oder würde sterben → zieht sich zurück (vorhersehbar, in der Vorschau angezeigt), kein Zufall.
- Wiederkehr: +Stufe, neue Ausrüstung, Narbe sichtbar, Groll-Zeile gegen die Einheit, die ihn vertrieben hat.
- Endgültig besiegbar, wenn die Fluchtbedingung verhindert wird (z. B. Fluchtfeld blockiert, Einheit mit „Fesseln“) → Belohnung (Rekrut, Legendäres Item).
- Gefahr: Wiederkehr nach sauberem Sieg frustriert → Spieler muss Flucht aktiv verhindern können.

## Hauptmechaniken – Detailregeln aus dem Brief (für das GDD)

> **Abgelöst durch `concept/21-gdd/gdd.md`:** Leutnants sterben nie; statt rund 15 Aufträgen gibt es 10 Nebenquests und tägliche Heimsuchungen; die Burg hat 11 Räume mit je 3 Stufen; das Beispiel „Leutnant verschonen“ entfällt.

- **Heimat-Burg:** In Akt 1 zieht die Truppe mit einem Lager umher (vorhandener Hub, U20). In Mission 1-6 erobert sie eine Burgruine, die ab dann ihr Zuhause ist; ausgebaut wird ab Akt 2 (Course Correction 2026-10-23). Jeder Raum steht für genau eine spielerische Funktion (etwa Schmieden, Heilen, Verzaubern). Wie viele Räume es gibt, ergibt sich aus den Funktionen, nicht aus einer festen Zahl.
- **Nemesis-Leutnants:** 4 pro Akt. Sie kehren mit Narbe, höherer Stufe, neuer Ausrüstung und Groll zurück. Wer die Flucht verhindert, besiegt sie endgültig und erhält eine Belohnung. Deterministisch über Kampagnen-Flags, nicht prozedural erzeugt.
- **Kleine Wahl, große Wirkung:** Beispiele: einen Leutnant verschonen, ein Dorf retten, einen Gefährten ziehen lassen. Die Entscheidungen wirken in Staffel 2 weiter (Datenmodell `campaign.flags`).
- **Aufträge:** Kopfgelder, Eskorten, Banditennester – auf wiederverwendeten Missionskarten, rund 15 in Staffel 1.

## Audio – Details

- Laute, Flöte und Fiedel führen; Orchester nur bei Bossen und Drama.
- Leitmotive pro Figur und für die Truppe statt pro Fraktion (präzisiert GA19).
- Musik in Burg, Lager, Weltkarte und Menüs ist dezent und ohne Gesang.
- SFX und Musik mit ElevenLabs, Teilvertonung wie in GA18.
