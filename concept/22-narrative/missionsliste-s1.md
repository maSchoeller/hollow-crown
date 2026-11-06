# Missionsliste Staffel 1 (abgenommen 2026-11-01)

> Konzept-Überarbeitung Etappe 1, Grundlage: `staffelbogen.md`, der Weltentwurf `concept/27-ueberarbeitung/weltentwurf.html` (Orte, Landschaften, „Wer lebt wo“) und die Leitplanken in `concept/27-ueberarbeitung/roadmap.md`. Ersetzt seit der Abnahme die Abschnitte „Missionsfolge“ und „Die 10 Nebenquests“ in `narrative.md`. Ziele, Leutnants und Beitritte folgen den Regeln aus dem GDD („Level Design Framework“). Neu dazu kommen die Regel „höchstens 2 parallel“ und die Größenklassen. Gegnerzahlen sind Richtwerte für den Entwurf; abgestimmt wird per `pnpm sim`.

## Regeln

- **Parallelität:** Höchstens 2 Story-Missionen sind gleichzeitig offen. Ein Paar (∥) läuft in freier Reihenfolge und führt danach wieder zusammen. Pro Akt gibt es zwei Paare, sonst läuft die Folge fest.
- **Nebenquests:** Sie zählen nicht mit und öffnen nach ihrem Auslöser ohne Warteschlange. Offene Nebenquests bleiben bis zum Akt-Finale spielbar. Wird ihr Ort im Akt verschlossen (Aurenhall ab der Krönung), sind sie nach dem Akt über die Weltkarte nachholbar.
- **Größenklassen:** **K** klein (bis 16 × 20), **M** mittel (um 20 × 25), **G** groß (30 × 40). Angegeben ist Breite × Höhe im Hochformat.
- **Gegner:** zwei- bis dreimal so viele wie eigene Einheiten, dafür schwächer. Große Karten füllen fehlende Plätze mit Söldnern aus der Taverne auf.
- **Verteilung:** 12 K, 17 M, 6 G, entsprechend den Anteilen ⅓, ½ und ⅙.
- **Beitritt über Nebenquests:** Drei Gefährten treten nur über eine Nebenquest bei: Varek (N2), Brann (N5) und Pell (N10). Bedingung ist allein das Ansprechen durch eine bestimmte Figur im Kampf. Wer die Quest auslässt oder das Ansprechen versäumt, hat die Figur für die Staffel nicht; die Quest bleibt trotzdem gewonnen.
- **Heimat:** Jeder Beitritt findet an oder nahe der Heimat der Figur statt, jeder Leutnant kämpft auf eigenem Boden oder hat einen Grund, dort zu sein.

## Sitze und Herkunft

> Lage, Wege und Entfernungen stehen seit 2026-11-03 in `geografie-valmora.md`; dort auch die kleinen Story-Folgen für P, 1-2, 1-5, 1-6, 1-8, 2-2, 2-4 und N8.

Die Mächte haben feste Sitze auf der Karte. Aus ihnen folgt, warum Missionen dort liegen, wo sie liegen.

| Wer | Sitz | Bezug zu Missionen |
|---|---|---|
| Seraphine, Krone, Silberne Lanze | Königspalast in Aurenhall; Gestüt der Lanze auf der Rabenweide an der Aure | 2-3, 3-1, 3-5 |
| General Dravn, Grenzheer | Festung Grauwacht am Fuß der Kupferberge | 2-4 in seinem eigenen Hinterland; Sable in 2-5 und 2-6 |
| Herzogin Maelis, Haus Silbermeer | Perlhof an der Spitze der Möwenzunge; Kontor an der Auremündung; Salzpass als Schmuggelroute; Krähenholm als Umschlagplatz | 2-2, 2-6, 2-7 |
| Halvard, Pakttempel, Paktgarde | Glutdom in Aurenhall; Lager der Paktgarde auf dem Spiegelsee | P, 3-4, 3-5 |
| Hask, Marodeure | Hasks Lager im Süden zwischen Grenzwald und Wolfshügeln | 1-2, Fluchtweg nach 1-6 und 1-8 |
| Ulvric, Wolfsbande | Wolfshügel | 1-4 |
| Morra, Kopfgeldjägerin | Kopfgeldstube in Varnhold | 1-1, 1-3 |
| Grosk, Hungernde | Hungerlager im Erlenmoor | 1-5 |
| Kharesh | Grenzposten an der Ostgrenze | Saat in 1-1, N2, 2-2, 3-1 |
| Kupferhall | Minenstadt in den Kupferbergen | N5 |
| Vhaelyra | Hort unter dem Urtempel im Krater | Beben in P und 1-7, 3-8 |
| Aldric I. | Königsgruft am Eisfjord, leer | N9 |

**Herkunft der Gefährten:** Lucan Grenzland bei Kharesh (seine Front im Grenzkrieg, N2 blickt auf sie) · Brenna Unterstadt von Aurenhall (ihr Bruder flieht in 3-6 durchs Südtor, N8) · Mira Erlbach · Fenn Varnhold · Tobin Pachthof · Liora Glutdom · Rhen, Ysolde, Vesna Akademie · Varek, Sable Grenzheer · Jory fahrende Gaukler · Odile, Kit, Harlan Palast · Pell Stadtwache · Nell Krähenholm · Brann Brandhang · Amos Kloster Silberquell · Ilka Clan in den Kupferbergen · Mael Paktgarde.

## Akt 1 „Asche“ – Grenzland um Varnhold, Spätsommer

Die Truppe flieht aus Aurenhall nach Süden ins Flusstal der Erle und erobert die Paktwacht an der Südflanke des Grauen Kamms. Die Burg bewacht den Wachpass, den einzigen Weg nach Norden.

Folge: **P → 1-1 → (1-2 ∥ 1-3) → 1-4 → 1-5 → 1-6 → 1-7 → 1-8**

| # | Mission | Ort und Landschaft | Ziel | Größe | Eigene / Gegner | Leutnant | Beitritt | Zweck in der Story | Saat, Entscheidung |
|---|---|---|---|---|---|---|---|---|---|
| P | Die Paktnacht | Tempelbezirk des Glutdoms, Aurenhall; enge Höfe, Säulengänge, Nacht | escape | K 14×18 | 4 / 10 | – (Tempelwachen) | Rhen, Lucan, Brenna, Tobin | Auslöser: König tot, die Truppe gilt als Mörder. Gerrit fällt, das erste Grab. Brenna kennt den Fluchtweg aus der Unterstadt | Erstes Beben, Glutleuchten über dem Tempel |
| 1-1 | Steckbriefe | Varnhold an der Erle; Markt, Brücke als Engstelle | rout | K 16×20 | 5 / 12 | – (Morras Häscher) | Fenn | Ganz Valmora jagt die Truppe; Morra hängt in ihrer Stadt die Steckbriefe auf. Neues Ziel: Wer hat uns angeheuert? | **Saat Kharesh:** Marktgerücht über Unruhe am Grenzposten; Lucan schweigt, seine Narben stammen von dort |
| 1-2 | Asche über Erlbach | Dorf Erlbach am Bach; brennbare Felder, Furten | defend | M 20×24 | 7 / 18 | **Hask** | Mira | Hask zieht aus seinem Lager im Süden gegen das Dorf. Die Truppe rettet ein Dorf, das sie eigentlich ausliefern müsste | E1 (Mira) |
| 1-3 | Der Fremde mit dem Siegel | Schrein am Weißdorn im Grenzwald; dichter Wald, Lichtung | reach | M 20×25 | 7 / 18 | **Morra** | Liora | Morra stellt der Truppe im Wald nach. Halvard tritt auf, bietet Hilfe und Hinweise und wird zum Mentor | Halvard kennt jeden Namen; Liora, im Glutdom aufgewachsen, als seine Ziehtochter |
| 1-4 | Die Spur des Maklers | Wolfshügel; Felsen, Höhlen, Anhöhen | boss (Osric Dunn) | M 22×26 | 8 / 22 | **Ulvric** | Ysolde (Gefangene) | Dunn versteckt sich bei Ulvrics Wolfsbande. Der Mittelsmann stirbt, bevor er alles sagen kann; danach Rhens Geständnis | **Saat Stimme:** Dunns letzte Worte: „Er hört auf die Krone, nicht auf Menschen.“ E2 (Fenn) davor |
| 1-5 | Das Hungerlager | Hungerlager im Erlenmoor an der Erlenbucht; Sumpf, Stege, Nebel | survive | M 20×25 | 8 / 24 | **Grosk** | Grosk bei E3 | Die Banditen sind Hungernde im Land, das niemand haben will. Gewissensfrage | E3. Ein Hungernder erzählt von einem Deserteur am alten Wachturm (öffnet N2) |
| 1-6 | Die Paktwacht | Burgruine am Grauen Kamm; Sturm bergauf über Felder und Terrassen | seize | **G 30×40** | 12 / 36 | Hask, Ulvric | – | Die Truppe erobert eine Heimat; Hask flieht in sein Lager im Süden | E4 |
| 1-7 | Unter der Paktwacht | Gewölbe im Fels des Grauen Kamms; enge Gänge, Gräber | treasure | K 16×20 | 6 / 14 | – (Plünderer) | – | Gräber junger Könige, die Chronik wird versiegelt gefunden | **Saat Pakt:** Grabreliefs; ein Beben aus dem Norden lässt das Gewölbe einstürzen |
| 1-8 | Die Heimat halten | Paktwacht; Angriff von Süden und über den Wachpass im Rücken | defend | **G 30×40** | 14 / 42 | **Morra** (führt), Hask, Ulvric, Grosk (falls nicht gewechselt) | – | Die Truppe verteidigt zum ersten Mal, was ihr gehört; Hask zieht über den Süden heran, Morras Häscher kommen über den Pass | Morras Weg zum Versteck hängt an E4 |

**Nebenquests Akt 1**

| # | Quest | Ort und Landschaft | Ziel | Größe | Öffnet | Inhalt |
|---|---|---|---|---|---|---|
| N1 | Der Ring von Varnhold | Varnhold bei Nacht; Dächer, Gassen | rout | K 14×18 | E2 „schützen“ (nach 1-4) | Fenns Vergangenheit |
| N2 | Der letzte Wachturm | Wachturm an der Grenzmauer, Grenzhügel mit Blick nach Kharesh | treasure | K 16×20 | nach 1-5 | **Beitritt Varek** (Lucan spricht ihn an): Der Deserteur des Grenzheers versteckt sich an Lucans alter Front und kennt Lucan und Dravn. Chronik-Seite, Relikt Schild der Paktwächter; Lucan erzählt vom Grenzkrieg (**Saat Kharesh**) |
| N3 | Das Erbe | Tobins Pachthof; Felder, Mühle, Fluss | defend | K 16×20 | Tobin lebt, nach 1-6 | Tobins Vater, Signaturlanze |

## Akt 2 „Glut“ – Hochland der Eisenmark und Küste, Herbst

**Neu in Akt 2:** die Balliste, mit einer Lektion in 2-1 (keine Pferde auf dem Brett, GDD-Log 2026-11-05). Die Anwärter werben nacheinander statt gleichzeitig. Seraphine und Dravn bieten in 2-1 an; Maelis kommt erst dazu, als Dravns Lüge in 2-4 platzt. Jede Lüge ändert die Lage der Truppe. Der Weg führt durch die Windscharte ins Hochland, dann der Aure entlang bis an die Küste.

Folge: **2-1 → (2-2 ∥ 2-3) → 2-4 → (2-5 ∥ 2-6) → 2-7 → 2-8**

| # | Mission | Ort und Landschaft | Ziel | Größe | Eigene / Gegner | Leutnant | Beitritt | Zweck in der Story | Saat, Entscheidung |
|---|---|---|---|---|---|---|---|---|---|
| 2-1 | Wind über der Eisenmark | Windscharte im Grauen Kamm; Ballisten auf Felsnasen, Ebene dahinter | survive | M 20×25 | 9 / 24 | **Brakka** (Ballistenmeisterin, Söldnerin) | Jory | Neues Land, neue Gefahr; zwei Angebote auf Freispruch (Seraphine, Dravn) | **Saat Drachen:** Drachenschatten über der Scharte |
| 2-2 | Das Siegel im Salzpass | Salzpass im Küstengebirge; schmaler Pass, Nebel, Steinschlag | treasure | K 16×20 | 7 / 16 | **Grell** | – | Prinzessin-Strang: Das Siegel ist für den Freispruch-Erlass bestimmt; erster Zweifel. Grell bringt Maelis' Schmuggelware über den Pass | **Saat Kharesh:** Kundschafter im Pass. Zweifel: Wer schreibt der Prinzessin? |
| 2-3 | Die Rabenweide | Gestüt der Silbernen Lanze an der Aure; offene Weiden, Koppelzäune, Furten | boss (Rowena) | M 22×26 | 9 / 24 | **Rowena** (Lanzenritterin, zu Fuß; Pferde nur als Kulisse) | Ilka | Dravn-Strang: Die Krone verweigert seinem Heer die Pferde, also holt er sie sich über die Truppe. Rowena verteidigt ihr eigenes Gestüt. Ilka ist als Fährtenleserin für die Pferdezüge angeheuert und wechselt die Seite | **Saat Rowena:** Sie lässt einen verwundeten Gefährten der Truppe versorgen, statt ihn gefangen zu nehmen. Erste kleine Lüge Dravns |
| 2-4 | Die Brandschneise | Brandhang im Hinterland der Grauwacht; Bergdorf, Getreideterrassen, Wald | defend | **G 30×40** | 12 / 38 | **Grell**, Sable (als Dravns Offizierin, nicht feindlich) | Sable bei E7 „warnen“ | Dravns Lüge platzt: Er opfert seine eigenen Dörfer. Grells Leute plündern hinter dem Feuer, und Dravn lässt sie gewähren. Brann (Gast, nicht steuerbar) hält mit Erdmagie das Feuer auf und rettet das Dorf, das ihn als „Hexenkind“ verstieß; als sie ihn wieder so nennen, flieht er in die Minen von Kupferhall (öffnet N5). **Lagewechsel:** Das Grenzheer jagt die Truppe, Maelis bietet als Dritte an | E7. **Saat Dravn:** Er glaubt, Drachen nur mit Feuer aufhalten zu können. Erste Spur: Dravn und Maelis verbindet mehr als gedacht |
| 2-5 | Die verstoßene Leibwache | Klosterhof Silberquell in der Eisenschlucht; Hängebrücken, Wasserfall | escort (Odile) | M 20×25 | 9 / 22 | **Sable** (jagt die Truppe für das Grenzheer) | Odile, Amos | Prinzessin-Strang: Odile kennt Halvards Briefe an Seraphine. Amos ist Feldscher des Klosters | E5 nach 2-5. **Saat Stimme:** Odile: „Er schreibt ihr nachts, nach Gesprächen mit der Krone.“ |
| 2-6 | Gold für Banditen | Schmugglerinsel Krähenholm vor der Möwenzunge; Strand, Sandbänke bei Ebbe, Klippenpfade, Grells Schiff | rout | M 22×26 | 10 / 28 | **Grell**, **Sable** | Nell | Herzogin-Strang: Über Krähenholm floss das Gold an die Banden aus Akt 1. Sable übergibt dort Gold aus Dravns Kasse; die Spur aus 2-4 bestätigt sich. Nell, von Maelis fallen gelassen, kennt die Insel. **Lagewechsel:** Maelis lässt die Truppe fallen | E6 (Varek, falls dabei) nach 2-6 |
| 2-7 | Das Kontor am Silbermeer | Kontor an der Auremündung; Lagerhäuser, Kräne, Kais, Schiffe | reach (Geschäftsbücher) | M 20×25 | 10 / 26 | **Brakka** (von Maelis angeheuert) | – | Beweis gegen Maelis | E8. **Saat Pakt:** Chronik-Fund in den Büchern: Erste und letzte Seite stammen aus derselben Hand |
| 2-8 | Kronfeld | Kronfeld an der Aure, zwischen Grauwacht, Perlhof und Aurenhall; weite Ebene, Hügel, Fluss | survive → escape | **G 30×40** | 15 / 40 | Rowena, Grell, Brakka, Sable (falls nicht gewechselt) | – | Hinterhalt am „neutralen“ Treffpunkt; „Die Krone war hohl“. Fluchtzone am Fluss | **Saat Rowena:** Sie zögert, als Seraphine den Angriff befiehlt |

**Nebenquests Akt 2**

| # | Quest | Ort und Landschaft | Ziel | Größe | Öffnet | Inhalt |
|---|---|---|---|---|---|---|
| N4 | Der Clan im Schnee | Jagdgründe in den Kupferbergen; Bergwald, früher Schnee | survive | M 20×24 | Ilka in der Truppe (nach 2-3) | Ilkas Clan, Signaturbogen |
| N5 | Glut unter dem Berg | Bergwerk bei Kupferhall; Loren, Schächte | treasure | K 16×20 | nach 2-4 | **Beitritt Brann** (Ilka spricht ihn an, sonst Lucan): Er hat sich in den Stollen versteckt und fürchtet die eigene Glut. **Saat Drachen:** Drachenknochen im Fels; Relikt Drachenglut, Erd-Rune III |
| N6 | Die Gauklertruppe | Herbstmarkt auf der Aue-Insel in der Mündung; Brücken, Boote, Gaukelbühne, Gezeiten | escort | K 14×18 | Jory in der Truppe, öffnet mit 2-7 | Jorys alte Truppe, Signaturlaute; liegt vor dem Kontor (2-7) in derselben Mündung |

## Akt 3 „Krone“ – Aurenhall und Drachengebirge, Winter

Keine Drachen als Gegner. 3-6 ist eine Stadtschlacht ohne Drachen; in 3-7 liegt ein schlafender Drache als Gelände im Pass. 3-7 ist zugleich das Tal nach der Krönung: wenige Gegner, viel Landschaft, Lagerfeuer davor. Jede Mission in Aurenhall bekommt ein eigenes Viertel.

Folge: **3-1 → (3-2 ∥ 3-3) → 3-4 → 3-5 → 3-6 → 3-7 → 3-8**

| # | Mission | Ort und Landschaft | Ziel | Größe | Eigene / Gegner | Leutnant | Beitritt | Zweck in der Story | Saat, Entscheidung |
|---|---|---|---|---|---|---|---|---|---|
| 3-1 | Winter über Aurenhall | Gänge unter dem Palast; verwinkelt, Türen und Schlüssel | reach | K 16×20 | 8 / 18 | **Eluned** | Kit | Zurück in der Stadt, die die Truppe jagt; Pell, Stadtwache, lässt die Truppe entkommen, statt sie zu stellen (öffnet N10); Seraphine soll gekrönt werden. Brenna führt durch die Unterstadt hinein | **Saat Kharesh:** Krieger aus Kharesh als Gesandte in der Stadt |
| 3-2 | Das verbotene Lied | Sängerviertel an den Kanälen; Brücken, Boote, Schnee | escort (Harlan) | M 20×25 | 10 / 26 | **Cassian** | Harlan | Harlans Lied enthält einen Hinweis auf die Paktnacht | – |
| 3-3 | Die Einsiedlerin | Vesnas Hütte im Winterwald; gefrorener Bach, Schnee | defend | M 20×24 | 10 / 26 | **Torvald** | Vesna | Vesna kennt die Drachen; die Magie wird stärker | E9 (Ysolde) |
| 3-4 | Der Zweifler | Lager der Paktgarde auf dem zugefrorenen Spiegelsee; Eis, Schilf | boss (Mael) | M 22×26 | 11 / 28 | **Mael** | Mael bei E11 | Ein Paktgardist zweifelt; die Chronik überzeugt ihn. Das Eis trägt nicht überall und bricht unter schweren Einheiten | E11 |
| 3-5 | Die Krönung | Glutdom; Krönungshalle, Emporen, Vorplatz im Schnee | seize | M 24×28 | 12 / 32 | Cassian, Eluned, Torvald | – | Halvards Heimspiel: Die Truppe sprengt die Krönung, Halvard wird enttarnt | **Saat Kharesh:** Die Gesandten verlassen den Dom vor dem Kampf |
| 3-6 | Das Südtor | Südtor und Unterstadt; Mauer, Tor, Gassen als Flanken | defend (Tor halten, bis die Flüchtlinge draußen sind) | **G 30×40** | 15 / 42 | **Torvald** | – | Die Paktgarde räumt die Stadt; die Truppe schützt die Menschen, die sie gejagt haben. Brennas Viertel; ihr Bruder ist unter den Flüchtlingen | – |
| 3-7 | Der Weg ins Gebirge | Pass ins Drachengebirge; Gletscher, Spalten, Lawinen | reach | M 18×28 | 10 / 20 | **Eluned** | – | Tal nach dem Sturm; Schönheit und Stille, ein schlafender Drache | **Saat Drachen:** Der schlafende Drache als Gelände; wer ihn weckt, bekommt Glutstürme |
| 3-8 | Im Drachengebirge | Urtempel im Krater und Vhaelyras Hort; Glutrisse, Eisbrücken | boss (Halvard) | **G 30×40** | 15 / 40 | Cassian, Torvald, Eluned, Mael (falls nicht gewechselt) | – | Halvard gestellt; er gibt sich in den Pakt | E10, E12. **Saat Stimme:** Halvard: „Er hat es befohlen.“ Vhaelyra öffnet die Augen: „Wir haben nie etwas genommen.“ |

**Nebenquests Akt 3**

| # | Quest | Ort und Landschaft | Ziel | Größe | Öffnet | Inhalt |
|---|---|---|---|---|---|---|
| N7 | Verwiesen | Akademie von Aurenhall; Bibliothek, Regale als Wände | treasure | K 16×20 | nach 3-1 | Rhen (und Ysolde, falls da) an der Akademie, Taktiker-Buch |
| N10 | Die Unterstadt | Unterstadt von Aurenhall; Kanäle, Schleusen, Diebeswege | rout | K 16×20 | nach 3-1 | **Beitritt Pell** (Kit spricht ihn an): Er schützt die Unterstadt vor der Paktgarde. Signaturbogen; Brenna kennt die Wege. Beitritt nur bis zur Krönung; nachgeholt bringt N10 nur die Belohnung |
| N9 | Das Grab Aldrics I. | Königsgruft am Ende des Eisfjords; Grabkammern in der Klippe, Absturzkanten | survive | M 20×25 | nach 3-6 | **Saat Grab:** Der Sarkophag ist leer, nur ein Abdruck der Krone. Relikt Aldrics Paktklinge, Zeile für „Vhaelyra fragen“ |
| N8 | Brennas Bruder | Flüchtlingslager vor der Stadt; Winterfeld, Wäldchen, Wagenburg | defend | M 20×24 | Brenna lebt, B-Support mit Lucan oder Tobin, nach 3-7 | Brennas Bruder ist mit den Flüchtlingen aus der Unterstadt gekommen (3-6). Er trägt die Schuld, die Brenna auf sich nahm; Signaturaxt. Er ist keine spielbare Figur, bekommt aber ein eigenes Porträt (Grafik-Aufgabe für später) |

N7 und N10 spielen in der Stadt. Ab 3-5 ist Aurenhall im Akt verschlossen; wer sie bis dahin nicht gespielt hat, holt sie nach dem Akt über die Weltkarte nach.

## Prüfungen

- **Ziele:** In keiner erlaubten Reihenfolge der Story-Missionen kommt ein Ziel zweimal hintereinander vor (auch nicht über ein Paar hinweg).
- **Leutnants:** Jeder tritt in mindestens 2 Story-Missionen auf, eine davon das Akt-Finale. Hask 1-2/1-6/1-8, Morra 1-3/1-8, Ulvric 1-4/1-6/1-8, Grosk 1-5/1-8, Brakka 2-1/2-7/2-8, Grell 2-2/2-4/2-6/2-8, Rowena 2-3/2-8, Sable 2-5/2-6/2-8, Eluned 3-1/3-5/3-7/3-8, Cassian 3-2/3-5/3-8, Torvald 3-3/3-5/3-6/3-8, Mael 3-4/3-8.
- **Beitritte:** Jeder hat danach noch mindestens eine Story-Mission im Akt; alle Gefährten aus Akt 3 sind spätestens in 3-4 dabei (Pell über N10 spätestens vor 3-5). Varek (N2), Brann (N5) und Pell (N10) sind optional; Entscheidungen, die sie betreffen (E6 Varek), entfallen ohne sie. Jeder Beitritt liegt an oder nahe der Heimat (siehe „Sitze und Herkunft“).
- **Verbündete aus Staffel 2:** Seraphine und Dravn haben keine Kampfrolle. Rowena flieht als Leutnant und hat drei Saat-Szenen (2-3, 2-8 und das Ende von Kronfeld).
- **Größen:** K = P, 1-1, 1-7, 2-2, 3-1, N1, N2, N3, N5, N6, N7, N10 (12). G = 1-6, 1-8, 2-4, 2-8, 3-6, 3-8 (6). Alle übrigen 17 sind M.

## Was gegenüber dem Bestand wegfällt oder sich ändert

- Akt 1: Statt vier frei wählbarer Missionen gibt es ein Paar (1-2 ∥ 1-3). 1-3 hat jetzt das Ziel `reach`, weil sonst nach 1-1 zweimal `rout` hintereinander käme. Das Hungerlager liegt im Erlenmoor. Varek tritt in N2 bei statt in 1-5.
- Akt 2: Die drei Stränge laufen nicht mehr gleichzeitig. „Der Wyvernhorst“ wird zu „Die Rabenweide“ (Rowena zu Fuß), Brakka wird Ballistenmeisterin. 2-4 bis 2-6 sind neu geordnet. Brann tritt erst in N5 bei statt in 2-4. 2-6 spielt auf Krähenholm mit Grell statt Rowena; Nell tritt dort bei statt in 2-2, Amos in 2-5 statt in 2-6. N6 liegt auf der Aue-Insel statt in Eisenfurt.
- Akt 3: „Drachen über der Stadt“ wird zu „Das Südtor“ (ohne Drachen). N8 und N9 rücken hinter die Stadtschlacht. Pell tritt in N10 bei statt mit Kit in 3-1. 3-4 spielt auf dem zugefrorenen Spiegelsee statt in einer Kaserne, N9 am Eisfjord.
