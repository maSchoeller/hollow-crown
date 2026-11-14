# Fragen an den Produktinhaber: Morgen nach der Nachtschicht (2026-11-13 auf 14)

> Entstanden in der Nacht vom 13. auf den 14. November 2026, während Akt 2 freigeschaltet und Epic 10 fertiggebaut wurde.
> Die orchestrierende Session stellt diese Fragen morgens gebündelt per Fragetool; nichts davon wurde nachts entschieden.
> Umgesetzte Empfehlungen tragen im Code `[ASSUMPTION]` und sind hier als „nachts angenommen“ vermerkt.

## A. Blockiert den Abschluss von Akt 2

### 1. Sicherungs-Erinnerung nach Akt 1

Seit Akt 2 im Build ist, zieht die Truppe nach dem Finale von 1-8 sofort weiter. Die Erinnerung, den Spielstand zu sichern (Story 7.3), gilt nur für den *laufenden* Akt nach dessen Finale — sie feuert für Akt 1 damit nie mehr.

- **A (nachts angenommen):** Die Erinnerung gilt für den gerade *abgeschlossenen* Akt und erscheint beim Übergang, zusammen mit der Titeltafel von Akt 2.
- **B:** Sie entfällt beim Übergang und kommt erst am Ende des letzten veröffentlichten Akts.
- **C:** Sie wird zu einem eigenen Hinweis im Optionen-Menü, ohne Bindung an einen Akt.

### 2. 2-8 „Kronfeld“ verkettet auf Normal

Mit der anwerbenden Simulation (Story 11.28) steigt die Siegquote von 7 auf 28 %. Der Korridor ist 30–70 %, im Lab mit voller Truppe liegt sie bei 85 %.

- **A:** In der zweiten Abstimmungsrunde (11.27) nach Epic 10 anheben, bis der Korridor erreicht ist.
- **B:** Hinnehmen: Das Finale darf härter sein, der Lab-Wert zählt.
- **C:** Erst deinen Handytest abwarten und danach entscheiden.

### 3. Abnahme der Stories von Akt 2 (11.1 bis 11.26)

Alle stehen auf `review`. Du wolltest sie nach dem Durchspielen gemeinsam durchgehen.

- Nach deinem Handy-Durchlauf: gesammelt abnehmen, oder einzeln durchgehen?

### 4. N4 „Der Clan im Schnee“

Offen aus 11.27: Wenn dein Test bestätigt, dass die Clanälteste fällt, wird `d2` auf Normal gestrichen (Antwort 4 A). Auf Normal liegen noch 1,57 Niedergestreckte vor.

### 5. Spielzeit von Akt 2

Ziel sind 10 bis 12 Stunden. Miss sie beim Durchspielen mit.

## B. Blockiert das Release von Akt 1 (Story 9.14)

### 6. Tonbruch-Test (Story 8.1)

Ohne bestandenen Test kein Release. Nötig sind die Bögen von dir und 2 bis 3 Testern (`concept/23-art-direction/tonbruch-test.md`).

### 7. Rechtliche Prüfung Nemesis-Patent

Steht im GDD als `[ASSUMPTION: Prüfung nötig]` und blockiert die Veröffentlichung.

### 8. Handy-Tests 15.11 und 15.12

Leistung großer Karten sowie flüssige Weltkarte mit der Paktwacht als Ruine. Du hast Akt 1 auf dem Handy durchgespielt — reicht dir das als Abnahme?

### 9. Ortsbilder

Abzunehmen sind die vier neuen Ortsbilder aus 15.6 und das Spätsommer-Bild der eroberten Paktwacht (`art/prompts/loc_paktwacht_spaetsommer.md`, in der Nacht gemergt).

## C. Zur Kenntnis, Widerspruch möglich

### 10. Akt 2 steht im Build, obwohl Akt 1 noch nicht veröffentlicht ist

Entscheidung F1 sah vor, Akt 2 erst nach dem Release von Akt 1 Stück für Stück live zu schalten. Du wolltest ihn auf dem Handy spielen, deshalb steht `act2` seit dem 13. November auf `released: true` (Eintrag im Decision-Log). Gesperrt ist nichts: `pnpm content:lock`, die Fixture-Spielstände und die Rabatt-Prüfung gehören weiter zum echten Release.

- Bleibt das so bis zum Release, oder soll Akt 2 nach deinem Durchlauf wieder aus dem Build?

### 11. Offene Annahmen aus Epic 10

Die Stories 10.5 bis 10.13 tragen einzelne `[ASSUMPTION]`-Werte, die in den jeweiligen Story-Dateien unter `_bmad-output/implementation-artifacts/` stehen. Sie werden in der zweiten Abstimmungsrunde ohnehin gemessen; Widerspruch lohnt nur, wo dir ein Wert grundsätzlich falsch vorkommt.

### 12. Story 10.14 „Burg-Grafik“

Weiter offen: `homeObject`, `castleScene` und eine Messung auf dem echten Gerät. Sie blockiert Akt 2 nicht, gehört aber vor den Abschluss von Epic 10.

### 13. Nebenquests öffnen jetzt auch ohne den Gefährten (nachts angenommen)

N4 „Der Clan im Schnee“ und N6 „Die Gauklertruppe“ blieben für immer verschlossen, wenn Ilka bzw. Jory nie angesprochen und damit nie angeworben wurde — Glutfunke, Weißwolf und „Letzter Vorhang“ fielen ohne Hinweis weg (QA-Durchlauf, PR 213).

- **A (nachts angenommen):** Die Quest ist auch offen, wenn die Figur nie angeworben wurde; nur „gegangen“ schließt sie. Dafür gibt es eine neue Bedingung `recruited: <gefährte>` und zu jeder Zeile, die Ilka bzw. Jory trägt, eine Ersatzzeile ohne sie. Die Ersatzzeilen sind Textvorschläge und brauchen deine Abnahme beim Durchspielen.
- **B:** Die Quest bleibt an den Gefährten gebunden, bekommt aber einen Hinweis auf der Weltkarte, dass sie verpasst wurde.

### 14. Ein Schlüssel je Truhe als Regel (nachts angenommen)

In 2-2 „Das Siegel im Salzpass“ gab es einen Türschlüssel für drei Truhen, während der Sieg an `c_seal` hängt: falsche Truhe plus kein Fenn dabei heißt, die Mission ist nur per Abbruch zu retten.

- **A (nachts angenommen):** Jede Truhe hat einen Schlüsselträger (in 2-2 Zahlmeister, Schütze n3, Kundschafter k1), und `content:check` verlangt das für jede Truhenjagd-Karte ohne eigenen Späher. 1-7, N2 und N5 hielten die Regel schon.
- **B:** Der Schlüssel öffnet nur die siegentscheidende Truhe. Das bräuchte eine neue Regel im Code und ändert das Gefühl der Truhenjagd.

### 15. Platzhalterfigur „cleric“ in Akt 2

Auf 2-1, 2-3, 2-5, 2-6 und 2-7 stehen die Heiler-Gegner noch als Platzhalter. Eigene Figur vor der Abnahme von Akt 2, oder reicht der Platzhalter bis Staffel 1 fertig ist?

### 16. Vier optionale Hebel nutzt das Autoplay nie

Kranhebel in 2-7, Furt in 2-8, Gatterhebel in N5 und Bühne in N6: Felder und Trigger sind erreichbar und funktionieren, nur die Kampf-KI geht nie hin. Für deinen Durchlauf heißt das, diese vier Wege sind ungetestet — bitte bewusst mitnehmen.

### 17. Teile-Namen aus Story 10.13 angeglichen (nachts angenommen)

Für 11 der 16 Profi-Wege widersprachen die Locale-Namen der Teile-Tabelle des Epics (zum Beispiel „Duellklinge“ gegen Federbarett). Sichtbares Teil und Name müssen zusammenpassen, deshalb sind die Namen in DE und EN an die Tabelle des Epics angeglichen — sie ist die jüngere Quelle. Zweitens heißt das neue Blender-Skript `blender_proparts.py`, weil `blender_parts.py` seit dem Prototyp die Teile-Bibliothek der Sprite-Pipeline ist. Beides nur widersprechen, wenn dir ein Name nicht gefällt.

### 18. Bühne in N6: Auslöser auf der Terrasse (nachts angenommen)

Das Gespräch mit der Gauklermeisterin feuerte auch, wenn man westlich an der Bühne vorbeiging. Jetzt deckt der Auslöser die Terrasse selbst ab; die Treppe liegt außerhalb, wer die Szene will, macht einen Schritt weiter hinauf.
