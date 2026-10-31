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
