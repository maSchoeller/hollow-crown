# Missionsliste Staffel 1 (Entwurf 2026-11-01)

> Konzept-Überarbeitung Etappe 1, Grundlage: `staffelbogen.md` und die Leitplanken in `concept/27-ueberarbeitung/roadmap.md`. Ersetzt nach der Abnahme den Abschnitt „Missionsfolge“ und „Die 10 Nebenquests“ in `narrative.md`. Ziele, Leutnants und Beitritte folgen den Regeln aus dem GDD („Level Design Framework“). Neu dazu kommen die Regel „höchstens 2 parallel“ und die Größenklassen. Gegnerzahlen sind Richtwerte für den Entwurf; abgestimmt wird per `pnpm sim`.

## Regeln

- **Parallelität:** Höchstens 2 Missionen sind gleichzeitig offen. Ein Paar (∥) läuft in freier Reihenfolge und führt danach wieder zusammen. Pro Akt gibt es zwei Paare, sonst läuft die Folge fest.
- **Nebenquests (Vorschlag):** Sie öffnen nur, wenn genau eine Story-Mission offen ist. Wird eine Nebenquest freigeschaltet, während ein Paar offen ist oder schon eine andere Nebenquest wartet, kommt sie in eine Warteschlange und öffnet im nächsten freien Fenster. So sind nie mehr als 2 Missionen offen. Offene Nebenquests bleiben bis zum Akt-Finale spielbar.
- **Größenklassen:** **K** klein (bis 16 × 20), **M** mittel (um 20 × 25), **G** groß (30 × 40). Angegeben ist Breite × Höhe im Hochformat.
- **Gegner:** zwei- bis dreimal so viele wie eigene Einheiten, dafür schwächer. Große Karten füllen fehlende Plätze mit Söldnern aus der Taverne auf.
- **Verteilung:** 12 K, 17 M, 6 G, entsprechend den Anteilen ⅓, ½ und ⅙.

## Akt 1 „Asche“ – Grenzland um Varnhold, Spätsommer

Folge: **P → 1-1 → (1-2 ∥ 1-3) → 1-4 → 1-5 → 1-6 → 1-7 → 1-8**

| # | Mission | Ort | Ziel | Größe | Eigene / Gegner | Leutnant | Beitritt | Zweck in der Story | Saat, Entscheidung |
|---|---|---|---|---|---|---|---|---|---|
| P | Die Paktnacht | Tempelbezirk des Glutdoms, Aurenhall | escape | K 14×18 | 4 / 10 | – (Tempelwachen) | Rhen, Kael, Brenna, Tobin | Auslöser: König tot, die Truppe gilt als Mörder. Gerrit fällt, das erste Grab | Erstes Beben, Glutleuchten über dem Tempel |
| 1-1 | Steckbriefe | Marktstädtchen Varnhold | rout | K 16×20 | 5 / 12 | – | Fenn | Ganz Valmora jagt die Truppe; neues Ziel: Wer hat uns angeheuert? | Marktgerücht über Kharesh, Kaels Kriegsnarben |
| 1-2 | Asche über Erlbach | Dorf Erlbach am Bach | defend | M 20×24 | 7 / 18 | **Hask** | Mira | Ein Dorf retten, das die Truppe eigentlich ausliefern müsste | E1 (Mira) |
| 1-3 | Der Fremde mit dem Siegel | Schrein am Weißdorn, Grenzwald | reach | M 20×25 | 7 / 18 | **Morra** | Liora | Halvard tritt auf, bietet Hilfe und Hinweise und wird zum Mentor | Halvard kennt jeden Namen, Liora als seine Ziehtochter |
| 1-4 | Die Spur des Maklers | Wolfslager in den Hügeln | boss (Osric Dunn) | M 22×26 | 8 / 22 | **Ulvric** | Ysolde (Gefangene) | Der Mittelsmann stirbt, bevor er alles sagen kann; danach Rhens Geständnis | **Saat Stimme:** Dunns letzte Worte: „Er hört auf die Krone, nicht auf Menschen.“ E2 (Fenn) davor |
| 1-5 | Das Hungerlager | Lager von Grosks Bande | survive | M 20×25 | 8 / 24 | **Grosk** | Varek; Grosk bei E3 | Die Banditen sind Hungernde; Gewissensfrage | E3 |
| 1-6 | Die Paktwacht | Burgruine an der Grenze | seize | **G 30×40** | 12 / 36 | Hask, Ulvric | – | Die Truppe erobert eine Heimat | E4 |
| 1-7 | Unter der Paktwacht | Gewölbe unter der Burg | treasure | K 16×20 | 6 / 14 | – (Plünderer) | – | Gräber junger Könige, die Chronik wird versiegelt gefunden | **Saat Pakt:** Grabreliefs; ein Beben lässt das Gewölbe einstürzen |
| 1-8 | Die Heimat halten | Paktwacht | defend | **G 30×40** | 14 / 42 | **Morra** (führt), Hask, Ulvric, Grosk (falls nicht gewechselt) | – | Die Truppe verteidigt zum ersten Mal, was ihr gehört | Morras Weg zum Versteck hängt an E4 |

**Nebenquests Akt 1**

| # | Quest | Ort | Ziel | Größe | Öffnet | Inhalt |
|---|---|---|---|---|---|---|
| N1 | Der Ring von Varnhold | Varnhold bei Nacht | rout | K 14×18 | E2 „schützen“ (Fenster 1-4) | Fenns Vergangenheit |
| N2 | Der letzte Wachturm | Wachturm der Paktwächter | treasure | K 16×20 | nach 1-5 | Chronik-Seite, Relikt Schild der Paktwächter |
| N3 | Das Erbe | Tobins Pachthof | defend | K 16×20 | Tobin lebt, nach 1-6 | Tobins Vater, Signaturlanze |

## Akt 2 „Glut“ – Hochland der Eisenmark, Herbst

**Neu in Akt 2:** Reiterei zu Pferd und Balliste, beide mit einer Lektion in 2-1. Die Anwärter werben nacheinander statt gleichzeitig. Seraphine und Dravn bieten in 2-1 an; Maelis kommt erst dazu, als Dravns Lüge in 2-4 platzt. Jede Lüge ändert die Lage der Truppe.

Folge: **2-1 → (2-2 ∥ 2-3) → 2-4 → (2-5 ∥ 2-6) → 2-7 → 2-8**

| # | Mission | Ort | Ziel | Größe | Eigene / Gegner | Leutnant | Beitritt | Zweck in der Story | Saat, Entscheidung |
|---|---|---|---|---|---|---|---|---|---|
| 2-1 | Wind über der Eisenmark | Ballistenschanze an der Windscharte | survive | M 20×25 | 9 / 24 | **Brakka** (Ballistenmeisterin, Söldnerin) | Jory | Neues Land, neue Gefahr; zwei Angebote auf Freispruch (Seraphine, Dravn) | **Saat Drachen:** Drachenschatten über der Scharte |
| 2-2 | Das Siegel im Salzpass | Salzpass im Nebel | treasure | K 16×20 | 7 / 16 | **Grell** | Nell | Prinzessin-Strang: Das Siegel ist für den Freispruch-Erlass bestimmt; erster Zweifel | **Saat Kharesh:** Kundschafter im Pass. Zweifel: Wer schreibt der Prinzessin? |
| 2-3 | Die Rabenweide | Gestüt und Reiterlager der Silbernen Lanze | boss (Rowena) | M 22×26 | 9 / 24 | **Rowena** (Lanzenritterin zu Pferd) | Ilka | Dravn-Strang: Rowenas Reiterei vertreiben | **Saat Rowena:** Sie lässt einen verwundeten Gefährten der Truppe versorgen, statt ihn gefangen zu nehmen |
| 2-4 | Die Brandschneise | Dorf Brandhang | defend | **G 30×40** | 12 / 38 | **Grell**, Sable (als Dravns Offizierin, nicht feindlich) | Brann; Sable bei E7 „warnen“ | Dravns Lüge platzt: Er opfert Grenzdörfer. **Lagewechsel:** Das Grenzheer jagt die Truppe, Maelis bietet als Dritte an | E7. **Saat Dravn:** Er glaubt, Drachen nur mit Feuer aufhalten zu können |
| 2-5 | Die verstoßene Leibwache | Klosterhof Silberquell | escort (Odile) | M 20×25 | 9 / 22 | **Sable** | Odile | Prinzessin-Strang: Odile kennt Halvards Briefe an Seraphine | E5 nach 2-5. **Saat Stimme:** Odile: „Er schreibt ihr nachts, nach Gesprächen mit der Krone.“ |
| 2-6 | Gold für Banditen | Goldfurt, Markt der Banden | rout | M 22×26 | 10 / 28 | **Rowena**, **Sable** | Amos | Herzogin-Strang: Verdacht, Maelis habe die Banden aus Akt 1 bezahlt. **Lagewechsel:** Maelis lässt die Truppe fallen | E6 (Varek) nach 2-6 |
| 2-7 | Das Kontor am Silbermeer | Handelshaus an der Küste | reach (Geschäftsbücher) | M 20×25 | 10 / 26 | **Brakka** | – | Beweis gegen Maelis | E8. **Saat Pakt:** Chronik-Fund in den Büchern: Erste und letzte Seite stammen aus derselben Hand |
| 2-8 | Kronfeld | weites Feld, Treffpunkt zum Freispruch | survive → escape | **G 30×40** | 15 / 40 | Rowena, Grell, Brakka, Sable (falls nicht gewechselt) | – | Hinterhalt; „Die Krone war hohl“ | **Saat Rowena:** Sie zögert, als Seraphine den Angriff befiehlt |

**Nebenquests Akt 2**

| # | Quest | Ort | Ziel | Größe | Öffnet | Inhalt |
|---|---|---|---|---|---|---|
| N4 | Der Clan im Schnee | Jagdgründe von Ilkas Clan, früher Schnee | survive | M 20×24 | Ilka in der Truppe (Fenster 2-4) | Ilkas Clan, Signaturbogen |
| N5 | Glut unter dem Berg | Branns Bergwerk | treasure | K 16×20 | nach 2-4 | **Saat Drachen:** Drachenknochen im Stollen; Relikt Drachenglut, Erd-Rune III |
| N6 | Die Gauklertruppe | Herbstmarkt in Eisenfurt | escort | K 14×18 | Jory in der Truppe (Fenster 2-7) | Jorys alte Truppe, Signaturlaute |

## Akt 3 „Krone“ – Aurenhall und Drachengebirge, Winter

Keine Drachen als Gegner. 3-6 ist eine Stadtschlacht ohne Drachen; in 3-7 liegt ein schlafender Drache als Gelände im Pass. 3-7 ist zugleich das Tal nach der Krönung: wenige Gegner, viel Landschaft, Lagerfeuer davor.

Folge: **3-1 → (3-2 ∥ 3-3) → 3-4 → 3-5 → 3-6 → 3-7 → 3-8**

| # | Mission | Ort | Ziel | Größe | Eigene / Gegner | Leutnant | Beitritt | Zweck in der Story | Saat, Entscheidung |
|---|---|---|---|---|---|---|---|---|---|
| 3-1 | Winter über Aurenhall | Gänge unter dem Palast | reach | K 16×20 | 8 / 18 | **Eluned** | Kit und Pell | Zurück in der Stadt, die die Truppe jagt; Seraphine soll gekrönt werden | **Saat Kharesh:** Krieger aus Kharesh als Gesandte in der Stadt |
| 3-2 | Das verbotene Lied | Sängerviertel von Aurenhall | escort (Harlan) | M 20×25 | 10 / 26 | **Cassian** | Harlan | Harlans Lied enthält einen Hinweis auf die Paktnacht | – |
| 3-3 | Die Einsiedlerin | Vesnas Hütte im Vorgebirge | defend | M 20×24 | 10 / 26 | **Torvald** | Vesna | Vesna kennt die Drachen; die Magie wird stärker | E9 (Ysolde) |
| 3-4 | Der Zweifler | Kaserne der Paktgarde | boss (Mael) | M 22×26 | 11 / 28 | **Mael** | Mael bei E11 | Ein Paktgardist zweifelt; die Chronik überzeugt ihn | E11 |
| 3-5 | Die Krönung | Glutdom | seize | M 24×28 | 12 / 32 | Cassian, Eluned, Torvald | – | Die Truppe sprengt die Krönung, Halvard wird enttarnt | **Saat Kharesh:** Die Gesandten verlassen den Dom vor dem Kampf |
| 3-6 | Das Südtor | Südtor und Unterstadt von Aurenhall | defend (Tor halten, bis die Flüchtlinge draußen sind) | **G 30×40** | 15 / 42 | **Torvald** | – | Die Paktgarde räumt die Stadt; die Truppe schützt die Menschen, die sie gejagt haben | – |
| 3-7 | Der Weg ins Gebirge | Pass ins Drachengebirge | reach | M 18×28 | 10 / 20 | **Eluned** | – | Tal nach dem Sturm; Schönheit und Stille, ein schlafender Drache | **Saat Drachen:** Der schlafende Drache als Gelände; wer ihn weckt, bekommt Glutstürme |
| 3-8 | Im Drachengebirge | Urtempel und Vhaelyras Hort | boss (Halvard) | **G 30×40** | 15 / 40 | Cassian, Torvald, Eluned, Mael (falls nicht gewechselt) | – | Halvard gestellt; er gibt sich in den Pakt | E10, E12. **Saat Stimme:** Halvard: „Er hat es befohlen.“ Vhaelyra öffnet die Augen: „Wir haben nie etwas genommen.“ |

**Nebenquests Akt 3**

| # | Quest | Ort | Ziel | Größe | Öffnet | Inhalt |
|---|---|---|---|---|---|---|
| N7 | Verwiesen | Akademie von Aurenhall | treasure | K 16×20 | nach 3-1 (Fenster 3-4) | Rhen (und Ysolde, falls da) an der Akademie, Taktiker-Buch |
| N10 | Die Unterstadt | Unterstadt von Aurenhall, vor der Krönung | rout | K 16×20 | Kit und Pell in der Truppe (Fenster 3-4, sonst 3-5) | Kit und Pell, Signaturbogen |
| N9 | Das Grab Aldrics I. | Königsgruft am Gebirgsfuß | survive | M 20×25 | nach 3-6 (Fenster 3-7) | **Saat Grab:** Der Sarkophag ist leer, nur ein Abdruck der Krone. Relikt Aldrics Paktklinge, Zeile für „Vhaelyra fragen“ |
| N8 | Brennas Bruder | Flüchtlingslager vor der Stadt | defend | M 20×24 | Brenna lebt, B-Support mit Kael oder Tobin, nach 3-7 (Fenster 3-8) | Brennas Bruder unter den Flüchtlingen, Signaturaxt |

N7 und N10 spielen in der Stadt und müssen vor der Krönung liegen; ab 3-5 ist Aurenhall verschlossen. Wer sie bis dahin nicht gespielt hat, verliert sie als Gedenk-Variante. **Offen:** Ist das in Ordnung, oder sollen sie nach dem Akt nachholbar sein?

## Prüfungen

- **Ziele:** In keiner erlaubten Reihenfolge kommt ein Ziel zweimal hintereinander vor (auch nicht über ein Paar hinweg).
- **Leutnants:** Jeder tritt in mindestens 2 Story-Missionen auf, eine davon das Akt-Finale. Hask 1-2/1-6/1-8, Morra 1-3/1-8, Ulvric 1-4/1-6/1-8, Grosk 1-5/1-8, Brakka 2-1/2-7/2-8, Grell 2-2/2-4/2-8, Rowena 2-3/2-6/2-8, Sable 2-5/2-6/2-8, Eluned 3-1/3-5/3-7/3-8, Cassian 3-2/3-5/3-8, Torvald 3-3/3-5/3-6/3-8, Mael 3-4/3-8.
- **Beitritte:** Jeder hat danach noch mindestens eine Story-Mission im Akt; alle Gefährten aus Akt 3 sind spätestens in 3-4 dabei.
- **Verbündete aus Staffel 2:** Seraphine und Dravn haben keine Kampfrolle. Rowena flieht als Leutnant und hat drei Saat-Szenen (2-3, 2-8 und das Ende von Kronfeld).
- **Größen:** K = P, 1-1, 1-7, 2-2, 3-1, N1, N2, N3, N5, N6, N7, N10 (12). G = 1-6, 1-8, 2-4, 2-8, 3-6, 3-8 (6). Alle übrigen 17 sind M.

## Was gegenüber dem Bestand wegfällt oder sich ändert

- Akt 1: Statt vier frei wählbarer Missionen gibt es ein Paar (1-2 ∥ 1-3). 1-3 hat jetzt das Ziel `reach`, weil sonst nach 1-1 zweimal `rout` hintereinander käme.
- Akt 2: Die drei Stränge laufen nicht mehr gleichzeitig. „Der Wyvernhorst“ wird zu „Die Rabenweide“ (Rowena zu Pferd), Brakka wird Ballistenmeisterin. 2-4 bis 2-6 sind neu geordnet.
- Akt 3: „Drachen über der Stadt“ wird zu „Das Südtor“ (ohne Drachen). N8 und N9 rücken hinter die Stadtschlacht.
