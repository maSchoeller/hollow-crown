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
