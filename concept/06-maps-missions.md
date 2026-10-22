# 06 – Karten, Gelände, Missionen, Gegner-KI

## 1. Karten

- Rechteckiges Raster, Koordinaten `[x, y]`, Ursprung oben links.
- Größen: **kompakt** 8×12 – 12×18, **mittel** bis 16×24, **groß** bis 24×32. Alle Größen sind erwünscht.
- Kamera: Pinch-Zoom (min. 5 Spalten sichtbar bis ganze Karte), Zwei-Finger-Pan, Doppeltipp auf Einheit zentriert; **Minikarte** einblendbar (Ecke oben, zeigt Einheiten als Punkte und Ziele).
- Kartenformat und Beispiele: `11-content-format.md`, `data-samples/maps/`.

## 2. Gelände

| ID | DE | Verteidigung | Ausweichen | Heilung | Brennbar | Sonstiges |
|---|---|---|---|---|---|---|
| `plain` | Ebene | 0 | 0 | – | nein | |
| `grass` | Gras | 0 | 0 | – | ja | |
| `road` | Straße | 0 | 0 | – | nein | |
| `forest` | Wald | +1 | +20 | – | ja | |
| `sand` | Sand | 0 | +5 | – | nein | |
| `mountain` | Berg | +2 | +30 | – | nein | |
| `shallows` | Seichtes Wasser | 0 | −10 | – | nein | |
| `river` | Fluss | – | – | – | nein | nur Flieger |
| `bridge` | Brücke | 0 | 0 | – | nein | |
| `fort` | Festung | +2 | +20 | 20 %/Runde | nein | |
| `throne` | Thron | +3 | +30 | 20 %/Runde | nein | oft „Einnehmen“-Ziel |
| `gate` | Tor | +2 | +20 | – | nein | „Einnehmen“-Ziel möglich |
| `village` | Dorf | 0 | +10 | – | nein | **Besuchen** (von oben, einmalig) |
| `ruins` | Ruine | +1 | +10 | – | nein | |
| `wall` | Mauer | – | – | – | nein | unpassierbar |
| `burning` | Brennendes Feld | 0 | 0 | – | – | temporär, siehe Kampf §7 |
| `ash` | Asche | 0 | 0 | – | nein | Ergebnis eines Brandes |
| `rockwall` | Felswall | – | – | – | nein | temporär (Erde) |

Flieger erhalten keine Gelände-Boni (DEF/Ausweichen).

## 3. Interaktive Objekte

| Objekt | Interaktion | Bedingung |
|---|---|---|
| Tür | Öffnen (Aktion, benachbart) | Schlüssel im Beutel (verbraucht) oder Klasse mit Tag `lockpick` (Dieb, post-V1) |
| Truhe | Öffnen (Aktion, auf dem Feld) | Schlüssel oder `lockpick` |
| Hebel | Umlegen (Aktion, benachbart) | schaltet verknüpfte Objekte (Tor öffnen, Brücke senken, Falle) |
| Balliste | Besetzen (auf dem Feld) | Einheit mit Bogen-Waffenart; Reichweite 3–10, Mt 12, effektiv vs. `flier`, Gewicht egal |
| Dorf | Besuchen (auf dem Feld, von **Spieler** einmalig) | Belohnung (Item, Gold, Rekrut, Dialog). Gegner können Dörfer **zerstören** (Banditen-Profil): wird zu Ruine, Belohnung verloren |
| Beute | Aufheben (Feld betreten) | – |
| Fackel/Lagerfeuer | – | Sichtquelle im Nebel |

## 4. Nebel des Krieges (optional pro Karte)

- Sichtweite je Einheit: 3 (+2 Schütze/Dieb, +1 Flieger) – Feld-Distanz (Manhattan).
- Gegner außerhalb der Sicht sind unsichtbar; Gelände ist immer sichtbar.
- Wind-Effekt lichtet Nebel (Radius 2, 1 Runde). Fackeln (Item) geben Sicht 4 für 3 Runden.
- Bewegung, die Gegner aufdeckt, kann nicht zurückgenommen werden; Bewegung stoppt beim Aufdecken eines Gegners im Weg (Hinterhalt).

## 5. Missionsziele

| Typ | Sieg | Datenfeld |
|---|---|---|
| `rout` – Besiegen | alle Gegner (ohne `ignoreForRout`) besiegt | – |
| `boss` – Anführer besiegen | bestimmte Einheit besiegt | `unit` |
| `reach` – Erreichen | bestimmte Einheit (oder beliebige) erreicht Zielfeld/-bereich | `unit?`, `area` |
| `seize` – Einnehmen | **Kael** wartet auf Thron/Tor | `area` |
| `defend` – Beschützen | NPC/Objekt überlebt bis Runde N **oder** bis anderes Ziel erfüllt | `unit`, `turns?` |
| `survive` – Wellen überleben | Runde N erreichen | `turns`, `waves` |
| `escape` – Entkommen | alle (oder min. N) Einheiten verlassen über Ausgangsfelder die Karte (Aktion „Fliehen“), Kael zuletzt | `area`, `min?` |

**Niederlage** (immer): Avatar oder Kael fällt; plus missionsspezifisch (`defend`-Ziel stirbt, Zuglimit überschritten).

**Nebenziele** (1–3 pro Mission, optional, im Ergebnis sichtbar):
- `visit_villages` (alle Dörfer besucht), `no_downs` (niemand niedergestreckt), `turn_limit` (in ≤ N Runden), `kill_with` (Boss mit Waffenart X besiegt), `recruit` (Charakter X rekrutiert), `open_chests`, `protect_npc` (NPC überlebt).
- Belohnung: Bonus-Loot, Runen, Materialien, Gold. Kein Sperrinhalt.

## 6. Verstärkungen & Trigger

- **Verstärkungen**: zu Runde N/Phase, an Feld(ern), optional `ambush: true` (handeln sofort in derselben Phase – nur auf Schwer).
- In der Vorschau-/Gefahrenansicht werden **angekündigte** Verstärkungen eine Runde vorher als Marker angezeigt (Fairness).
- **Trigger** (deklarativ in Kartendaten): `when` (Einheit betritt Bereich, Runde beginnt, Einheit stirbt, Objekt aktiviert, Gespräch geführt, Ziel-HP unter X %) → `then` (Dialog, Spawn, KI-Profil ändern, Objekt umschalten, Ziel ändern, Nebel ändern).

## 7. Gegner-KI

Profile pro Einheit oder Gruppe (`ai.profile`):

| Profil | Verhalten |
|---|---|
| `aggressive` | bewegt sich zum besten erreichbaren Ziel und greift an; sonst nähert sich dem nächsten Spieler |
| `hold` | bewegt sich nicht; greift an, was in Reichweite steht |
| `guard` | wie `hold`, verlässt aber Feld (Boss auf Thron) nie; heilt durch Gelände |
| `trigger` | wartet, bis ein Spieler eine Distanz ≤ `radius` erreicht, ein Bereich betreten oder ein Trigger ausgelöst wird → dann `then`-Profil (Default `aggressive`) |
| `hunt` | verfolgt Ziel (`target`: Einheit, NPC, Dorf, Feld) und ignoriert Rest, außer ein Kill ist möglich |
| `raider` | zieht zu Dörfern und zerstört sie, greift nur bei Gelegenheit an |
| `flee` | bewegt sich zu Ausgangsfeld und verlässt Karte (Dieb mit Beute) |
| `support` | Heiler/Buffer: heilt Verbündete < 70 % TP, hält Abstand zu Spielern |

**Zielbewertung** (deterministisch, gleicher Seed → gleiche Entscheidung):
```
score = erwarteterSchaden + 50 × Killchance − 0.5 × erwarteterKonterschaden
      + Bonus(Heiler/Magier +10, niedrigste TP +5, Objektiv-Ziel +30)
      + Todesstoß-Regel nach Schwierigkeit (Kampf §9)
      − Gefahr(Feld)  [nur Schwer: Anzahl Spieler, die das Feld angreifen können × 5]
```
- Gegner wählen zuerst das Ziel, dann das Angriffsfeld (bestes Gelände).
- Reihenfolge der Gegnerzüge: Einheiten mit Kill-Möglichkeit zuerst, sonst nach Distanz.
- Die KI muss im Kern laufen (pure Funktion), damit Simulator und Tests sie nutzen.

## 8. Gefahrenzonen (Pflicht-UI)

- Knopf „Gefahr“: zeigt die Vereinigung aller Angriffsbereiche der Gegner (rote Fläche), bei Langdruck auf Gegner nur dessen Bereich (markierbar, mehrere gleichzeitig).
- Gegner-Infos per Langdruck: Werte, Ausrüstung inkl. Affixe/Runen, Skills, KI-Profil (als Klartext, z. B. „Wartet, bis du näher kommst“).

## 9. Scharmützel

- Nutzen vorhandene Karten (Kapitelkarten + 2 eigene Scharmützel-Karten in V1) mit **generierten Gegnergruppen**: Klassen-Mix aus Kapitel-Pool, Stufe = Armee-Durchschnitt ± 1, Ausrüstung nach Kapitelstufe, Ziel `rout` oder `boss`.
- Belohnung: Gold, Materialien, gelegentlich seltene Items/Runen, kein Story-Fortschritt.
- Erscheinen nach jedem Kapitel auf 1–2 Weltkarten-Knoten, verschwinden nach dem Spielen (neue nach nächstem Kapitel). Ein „Übungsplatz“-Knoten ist dauerhaft (nur EP, wenig Gold).

## 10. Einführung der Mechaniken & Schwierigkeit

**Eine neue Regel pro Kapitel.** Die ersten drei Karten sind die Einführung. Jede Mechanik gilt erst ab dem Knoten, den `campaign.yaml` unter `mechanics` nennt; davor rechnet der Regelkern ohne sie (Vorschau und Auflösung gleich), und die UI blendet ihre Anzeigen aus. `pnpm content:check` prüft, dass vor der Magie kein Zauberbuch auf Karten, bei Rekruten oder beim Händler auftaucht.

| Karte | Neu | Nebenbei | Gesperrt |
|---|---|---|---|
| Prolog – Die letzte Wacht | Bewegen, Angreifen, Kampfvorschau (Runde 1), Gefahrenzone + Deckung (Runde 2), Heiltrank (wenn Kael verwundet ist) | – | Dreieck, Magie, Elemente, Unterstützungen |
| Kap. 1 – Asche über Varnhold | **Waffendreieck**: Gegner mit Axt, Lanze und Schwert gemischt | Dörfer besuchen (Zeitdruck durch Plünderer), Feuer (Hinweis beim ersten Betreten) | Magie, Elemente, Unterstützungen |
| Kap. 2 – Der Schrein am Silberbach | **Magie** (Rhens Glut-Folio aus Kap. 1, gegnerische Magierin, Lioras Stab), **Anwerben durch Ansprechen** (Kael → Varek), Beschützen | Wellen von Verstärkungen | Elemente, Unterstützungen |
| ab Kap. 3 | Element-Kreis, Statuseffekte, Runen; Unterstützungen und Tandem | | |

Regeln für Lektionen: höchstens eine Lektion pro Runde, höchstens drei Zeilen, ausgelöst genau dann, wenn sie gebraucht wird (Runde, Feld betreten, TP-Schwelle).

**Schwierigkeit** wirkt auf zwei Wegen: Gegnerwerte (`balance.yaml` `difficulty.*.enemyStatPercent`, KI-Verhalten) und **Aufstellung** – Karteneinheiten und Verstärkungen können mit `difficulty: [normal, hard]` auf bestimmte Stufen beschränkt werden. Leicht hat weniger Gegner und kleinere Wellen, Schwer zusätzliche Gegner und Flankenangriffe.

**Zielwerte im Simulator** (`pnpm sim <map> --difficulty …`; der Sim-Spieler spielt vorsichtig, besucht Dörfer und wirbt an, plant aber nicht voraus – ein Mensch, der taktisch denkt, liegt darüber):

| Stufe | Siegquote Sim | Niedergestreckte pro Karte | Gefühl |
|---|---|---|---|
| Leicht | ≥ 95 % | ≤ 0,5 | leicht, aber nicht ohne Gegenwehr |
| Normal | 75–100 %, sinkend über die Kapitel | 0,4–1,3 | man muss überlegen, wen man wohin stellt |
| Schwer | 30–70 % | ≥ 0,5, steigend | fast unfair: Flanken, Fokusfeuer, Gegner beenden Niedergestreckte |
