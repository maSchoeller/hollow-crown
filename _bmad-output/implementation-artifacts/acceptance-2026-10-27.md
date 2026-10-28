# Abnahme 2026-10-27 – MVP-Stories (Epics 1–9)

Abnahme-Session im Auftrag des Produktinhabers (Freigabe 2026-10-27: Stories selbst auf `done` setzen, kleine Fehler beheben, nach grüner CI mergen). Geprüft wurden alle 27 Stories auf `review` (dazu die während der Abnahme gemergte Story 1.9) in `sprint-status.yaml`; Audio (8.1, 8.8, 8.9) und 9.14 standen auf `backlog` und gehören nicht dazu.

Vorgehen je Story: Akzeptanzkriterien aus `concept/26-epics/epics.md` und der Story-Datei gegen Code, Content und Tests abgeglichen (Subagenten, read-only), im Browser angespielt (Hochformat 375 × 812, einmal Desktop-Breite 693 px), Missionen simuliert (`pnpm sim <mapId> --runs 50` auf Leicht/Normal, Schwer über die Kampagne), ein Durchlauf der ganzen Kampagne im Browser.

Die Notizen `qa-2026-10-25.md` und `pages-deploy-2026-10-25.md` waren weder im Repo noch unter `concept/` noch im Nutzerprofil zu finden.

## Ergebnis

| Story | Status | Kurzbegründung |
|---|---|---|
| 1.9 Mission verlassen (während der Abnahme nachgetragen) | done | Im Browser: Rückfrage, Weltkarte, Kampagne unverändert; Klassik-Sperre per Unit-Test |
| 4.5 Szenen im neuen Stil | done | Optik, Log/Auto/Überspringen, Blasen ≤ 2 Zeilen, `scenesSeen` geprüft. Offene Frage 3 (Overlay statt Blase bei Mehrsprecher/Antworten/Off-Board) vom Produktinhaber am 2026-10-27 bestätigt. Überspringen hält an Antworten (Entscheidung 2026-10-24) |
| 4.9 Feste Support-Paare | done | 9 Paare/4 Kernpaare in Akt 1 (Staffelziel 25/6 über die Akte), Schwellen, Lagerfeuer C/B, Marke „Gespräche bereit“ gesehen |
| 5.1 Szenen-Host und Asset-Cache | done | Host/Cache/Schnittstelle belegt, Tests grün, Brett ↔ Weltkarte im Browser ohne Fehler |
| 5.5 Heimsuchungs-Anker und Generator | done | Anker, Pools, Generator, Deckel, Tests; Heimsuchungen erscheinen nach der ersten Begegnung mit Hask |
| 5.6 Heimsuchungen spielen und belohnen | done | Im Browser gespielt (Gold 407, Kopfgeld, Material, EP-Deckel). Alle 24 Anker simuliert; sechs lagen unter 75 % und wurden über ihre Anker-Felder korrigiert (siehe Simulation) |
| 6.8 Wirtschaftskurve und verkettete Sim | done | `--campaign` läuft auf allen drei Stufen; `--haunts` spielt seit 5.6 (AC 4 überholt) |
| 6.9 Paktwacht als Heimat | done | Burg nach 1-6, Raumsteine, Gedächtnishalle mit Gerrit, Gefallenen und Söldnerin; 2D-Bild statt 3D laut Entscheidung 2026-10-25 |
| 6.10 Aufstellung im Stil B | done | Pflichtfiguren mit Schloss, Plätze-Zähler, Plus-Steine bei voller Truppe, Tasche; Screenshot unten |
| 7.4 Stabile IDs und Release-Ablauf | done | `content:lock`/Sperrprüfung vorhanden (aktiv ab 9.14), Migrations-Fixtures, AGENTS.md |
| 7.7 Große Schlachten flüssig | done | Produktinhaber hatte am 2026-10-25 mit Abweichung abgenommen; Rest in 7.8 |
| 7.8 Große Schlachten ohne Ruckler | done | Zielmaß laut Endmessung erreicht. T10-Sichtabnahme an mich delegiert (2026-10-27): A/B-Bilder Skelett ↔ VAT (Idle, Gehen, Lanzenangriff, Treffer, Niedergestreckt, Hände/Waffen aller 6 Waffengruppen) deckungsgleich, im Durchspielen keine Fehldarstellung; Doku-Einträge vorhanden |
| 8.2 Tripo-Pipeline | done | Prompt-Protokoll der KI-Animationen Flucht/Jubel nachgetragen (`art/prompts/kael_anims_flee_cheer.md`, licensing §6) |
| 8.3 Brettfiguren Akt 1 | done | Figuren, Turnarounds, Silhouettentest (schwache Paare vom Produktinhaber abgenommen) |
| 8.6 Licht, Wetter, Effekte | done | Entscheidungen 2026-10-26 umgesetzt; Nacht/Nebel in 1-7 gesehen |
| 8.7 Titelbild, Logo, Hintergründe | done | Lizenzen-Seite mit OFL-Hinweis ergänzt (Entscheidung 2026-10-27, AC 3) |
| 9.1 Prolog | done | gespielt; Sim im Korridor |
| 9.2 Mission 1-1 | done | gespielt; Fenn tritt bei |
| 9.3 Mission 1-2 und E1 | done | gespielt (Mira-Haus zerstört → E1 entfällt) und E1 „gehen lassen“ über `__hc.devNode` (Folgen-Karte, Dorfhilfe) |
| 9.4 Mission 1-3 | done | gespielt; Liora tritt bei, N2 öffnet |
| 9.5 Mission 1-4 und E2 | done | gespielt; E2 „schützen“ öffnet N1, Folgen-Karte |
| 9.6 Mission 1-5 und E3 | done | gespielt; E3 „verschonen“: Grosk tritt bei, Hask-Groll −1, Varek per Ansprechen |
| 9.7 Mission 1-6 und E4 | done | gespielt; E4 „aufnehmen“, Burg wird Heimat; E2E `tests/e2e/m1-6.spec.ts` ergänzt |
| 9.8 Mission 1-7 | done | Verdacht geklärt (Simulator, nicht Karte); E2E `tests/e2e/m1-7.spec.ts`; Chronik-Eintrag gesehen. Rest: Niedergestreckte Normal 0,14 unter 0,4 (siehe offene Punkte) |
| 9.9 Finale 1-8 | done | gespielt bis Glutfunken-Moment und Hinweis „Akt 2 erscheint bald“; nach Balancing alle drei Stufen im Korridor |
| 9.10 N1 | done | Gedenk-Variante gespielt (Fenn gefallen), Elster und Glutfunke erhalten; Sim 100 % |
| 9.11 N2 | done | Eroberungsfeld ins Turminnere verlegt (Entscheidung 2026-10-27) |
| 9.12 N3 | done | Gedenk-Variante gespielt (Tobin gefallen), Erbstück erhalten |

## Durchlauf im Browser

Neue Kampagne (Normal, Standard) → Prolog → 1-1 → 1-2 → Heimsuchung (Hask) → 1-3 → 1-4 (E2) → 1-5 (E3) → N2 → N1 → 1-6 (E4) → N3 → 1-7 → 1-8 → Weltkarte mit „Akt 2 „Glut“ erscheint bald“ und Backup-Hinweis. Kämpfe über `__hc.autoWin()`, Szenen per Überspringen, Entscheidungen von Hand. Dazu: Taverne (zwei Söldner angeheuert), Lager, Burg, Gedächtnishalle, Chronik, Laden über „Weiter“ nach Neuladen, „Mission verlassen“, 1-5 als frühe Wahl (verloren). Offline: Produktions-Build, Service Worker geladen, offline neu geladen, neue Kampagne bis in den Prolog-Kampf (Playwright, iPhone 13; das Browser-Pane selbst registriert keine Service Worker).

Screenshots (Scratchpad der Session): `C:\Users\micro\AppData\Local\Temp\claude\C---Data-01-sourcecode-github-hollow-crown--claude-worktrees-neues-fave-icon-ca0c50\fafedfbb-be08-4032-a635-aa7ede9fb9b3\scratchpad\shots\` (01 Prolog-Brett … 16 Abschied Söldnerin) und `…\scratchpad\offline-prologue.png`, Lizenzen-Seite `…\scratchpad\licenses-375x812.jpg`.

## Behoben (PR #71, gemergt; PR #73)

- **Simulator-Spieler** (`src/core/ai/autoplay.ts`): birgt Niedergestreckte (vorher nie; im Modus Standard starben Gefährten, die ein Mensch rettet, und die Armeen schrumpften bis 1-7 auf 4–5 Einheiten); Schatzsuche teilt Schlösser und Schlüssel-Beute nach Wegdistanz zu, keine untätigen Einheiten.
- **Sim-Messung:** Niedergestreckte = jeder Fall auf 0 TP (`stats.downs`), auch später geborgene.
- **Schlüsselbund** (Entscheidung 2026-10-27): Schlüssel belegen keinen Taschenplatz und stapeln mit Ladungen; alte Stände werden beim Laden zusammengeführt.
- **N2:** Eroberungsfeld (6–7,1) hinter den Wachen (Entscheidung 2026-10-27).
- **Lizenzen-Seite** in den Optionen (Schriften OFL-1.1 mit Volltext, Bibliotheken, KI-Hinweis A12).
- **Ergebnis-Screen:** Narben-/Gabe-Zeile zeigte bei Söldnern den Rohschlüssel `unit.merc119.name`; gleiche Beute wird gebündelt („11 × Schlüssel“ statt elf Zeilen).
- **Taverne:** zwei identische Angebote „Ines · Vorkämpferin“ möglich; Namen sind jetzt eindeutig gegenüber Angeboten und angeheuerten Söldnern.
- **E2E** für 1-6 und 1-7; der Hilfscode findet die Einheit über `__board` statt über Pixel (auf CI flackerte die Pixelsuche).
- **Heimsuchungs-Anker** von 1-1, 1-2, 1-3, 1-6, 1-7 (PR #73): Aufstellung um den Schützling, Spawns nicht mehr direkt daneben.
- **Balancing** (PR #73): nur Stufen, KI-Profile und Wellenrunden, keine Gegnerzahlen (siehe unten).
- Doku: GDD-Decision-Log (Messbasis Schwer, freie Mitte), Narrative-Decision-Log (N2), Architektur-Decision-Log (Schlüsselbund), `licensing.md` A12.

## Mission 1-7 „Unter der Paktwacht“

Verdacht: verkettet 0 von 7 bzw. 10 % Siege. Befund: **der Simulator, nicht die Karte.** Alle Niederlagen waren Rundenfrist bei 0 Niedergestreckten. Mit voller Truppe auf Stufe 8 gewann derselbe Simulator Leicht/Normal 100 %, Schwer 93 % in ~6 Runden. Ursachen: (1) kein Bergen → Kette schrumpft auf 4–5 Einheiten; (2) volle Taschen (Tränke aus der Lager-Heuristik) – aufgehobene Schlüssel gingen in den Konvoi; (3) Leerlauf und Zuteilung nach Luftlinie. Nach den Fixes: verkettet Leicht 100 %, Normal 98 % (vor Balancing), nach Balancing Normal 90 %.

## Simulation (Endstand nach PR #73)

Einzelkarten verkettet, 50 Läufe, Standard (Sieg % / Niedergestreckte; Korridor Leicht ≥ 95 % / ≤ 0,5, Normal 75–100 % / 0,4–1,3):

| Karte | Leicht | Normal |
|---|---|---|
| prologue | 100 / 0,00 | 100 / 1,02 |
| m1_1 | 100 / 0,00 | 92 / 0,70 |
| m1_2 | 100 / 0,20 | 93 / 1,00 |
| m1_3 | 100 / 0,06 | 98 / 0,84 |
| m1_4 | 100 / 0,40 | 100 / 1,10 |
| m1_5 | 100 / 0,50 | 100 / 1,29 |
| m1_6 | 100 / 0,08 | 100 / 0,62 |
| m1_7 | 100 / 0,38 | 90 / **0,14** |
| m1_8 | 100 / 0,46 | 92 / 0,45 |
| n1_ring | 100 / 0,02 | 100 / 0,71 |
| n2_wachturm | 100 / 0,08 | 100 / 0,52 |
| n3_erbe | 100 / 0,26 | 100 / 0,45 |

Schwer über die Kampagne (`--campaign act1 --difficulty hard`, bis 3 Neustarts; Korridor 30–70 %), 150 Läufe (Seeds 1/51/101): prologue 47, m1_1 64, m1_2 47, m1_3 62, m1_4 66, m1_5 66, m1_6 68, m1_7 62, m1_8 61. Kampagne Normal: m1_8 96 % (vorher 71 %).

Heimsuchungs-Anker (Normal, 30 Läufe): alle 24 ≥ 77 % Sieg; Niedergestreckte bei mehreren Ankern unter 0,4 (prologue boss/defend, m1_1 boss/escort, m1_2 defend) bzw. knapp über 1,3 (m1_3 rout, m1_5 defend).

Freie Reihenfolge (verkettet nach 1-1, Normal): 1-5 als zweite Mission 43 %, 1-4 82 %, 1-2/1-3 93 % – laut Entscheidung 2026-10-27 so belassen, offen für 9.14.

## Offene Punkte für den Produktinhaber

1. **Balancing-Weg:** Übernommen wurde nur Option (c) „Stufen/Profile, Zahlen bleiben“. Dabei wurden auch **Wellenrunden** verschoben, die in Story-ACs stehen: 1-5 Wellen Runde 1 und 3 statt 2 und 4 (9.6 AC 1), 1-8 dritte Welle (Morra) Runde 8 statt 7 (9.9 AC 1), 1-1 Schwer-Welle Runde 2 statt 3 (9.2). Bitte bestätigen oder zurückdrehen lassen.
2. **1-7 Normal, Niedergestreckte 0,14:** Mit Stufen und Profilen nicht über 0,24 zu bringen (Mission endet bei Misserfolg an der Frist, nicht im Kampf). Zahlen ändern oder hinnehmen?
3. **Armee-Stufe hinter `expectedLevel`:** In der Kampagnen-Sim ab 1-6 1,3–2 Stufen unter Erwartung (EP-Kurve) – für 9.14.
4. **Gold:** Nach Akt 1 rund 6 000–16 000 Gold übrig, in Akt 1 kaum Ausgaben (Ausbau ab Akt 2) – für 9.14.

## Kleinere Beobachtungen (nicht behoben, keine Entscheidung nötig)

- Titelbild „Weiter … vor Der letzte Wachturm“: der Fortsetzungstext nimmt den ersten verfügbaren Knoten, auch eine Nebenquest.
- Wird die App während des Abschieds (6.7) geschlossen, wird der Abschied nach dem Laden nicht nachgeholt.
- Im Glutfunken-Moment (1-8) reagiert „Überspringen“ nicht; man muss auf die Box tippen.
- Chronik: die Folgen-Zeile „Fenn bleibt in der Truppe“ steht auch, wenn Fenn später fiel (Text der Entscheidung, gewollt?).
- 1-7 liegt als Gewölbe „innen“, das Diorama zeigt rundum Wald.
- Simulator: zählt Türen als Schlösser und verbraucht bei Schlüsselmangel Schlüssel an Türen (pessimistisch).
- Bekannt, wird von der Session „Asset-Vielfalt“ gelöst: Namenskonflikt „Dörfer besuchen“/„Häuser“, unklares Ziel-Haus in 1-1.
- Unit-Tests reißen unter Last gelegentlich das 5-s-Limit und laufen einzeln grün; in dieser Abnahme lief `pnpm test` auch im Volllauf grün (1109 Tests).

## Nicht geprüft

- Echtes Gerät (Pixel 6a / iPhone 12) für Leistung und Antialiasing (bleibt 9.14).
- Audio (backlog).
- Vollständige Lesung aller Szenentexte und englischen Übersetzungen; Stichproben im Durchlauf (Englisch, weil der Browser Englisch meldet).
- Desktop nur bis 693 px Breite (Breite des Browser-Panes); 1024-px-Layouts nicht gesehen.
