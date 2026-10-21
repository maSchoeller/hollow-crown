# 04 – Einheiten, Klassen, Fortschritt

> Startwerte **[C]**. Konkrete Daten: `data-samples/classes.yaml`, `data-samples/units.yaml`, `data-samples/skills.yaml`.

## 1. Einheiten-Modell

Eine Einheit besteht aus:

- **Charakter** (Identität): Name, Porträt, angeborene Affinität, persönlicher Skill, persönliche Basiswerte und **Wachstumsraten**, Supports, Story-Flags (`isLord`, `isAvatar`, `recruitable`).
- **Klasse**: Waffenarten, Bewegungstyp, MOV, Klassen-Skill, Wachstums-Modifikatoren, Wertgrenzen (Caps), Tags (`armored`, `flier`, `mounted`, `monster`, `holy` …).
- **Zustand**: Stufe, EP, aktuelle Werte, TP, Narben, Status, gemeisterte Skills + Loadout, Fähigkeitspunkte (FP) pro Item-Skill, Ausrüstung, Support-Punkte.

`Effektiver Wert = Basiswert + Stufenzuwächse + Klassenboni + Ausrüstung + Aufwertungen + Affixe + Skills + Narben + Status + Gelände`

Die Berechnung ist eine reine Funktion im Kern (`computeStats(unit, context)`) und wird in UI und Vorschau wiederverwendet.

## 2. Bewegungstypen & Geländekosten

| Gelände | Fuß | Gepanzert | Beritten | Flieger | Monster |
|---|---|---|---|---|---|
| Ebene, Straße, Brücke, Asche | 1 | 1 | 1 | 1 | 1 |
| Gras (brennbar) | 1 | 1 | 1 | 1 | 1 |
| Wald | 2 | 3 | 3 | 1 | 2 |
| Sand | 2 | 3 | 3 | 1 | 2 |
| Seichtes Wasser | 3 | – | 4 | 1 | 2 |
| Berg | – (Kletterer: 3) | – | – | 1 | 3 |
| Fluss / tiefes Wasser | – | – | – | 1 | – |
| Festung, Thron, Dorf, Tor | 1 | 1 | 1 | 1 | 1 |
| Mauer, geschlossene Tür, Felswall | – | – | – | – | – |
| Brennendes Feld | 2 | 2 | 2 | 1 | 2 |

`–` = nicht betretbar. Flieger: −20 Ausweichen-Bonus durch Gelände (erhalten keine Geländeboni).

## 3. Stufen & Wachstum (geglättet)

- Stufe 1–20 pro Klassenstufe. Basisklasse ab Stufe 10 aufstiegsfähig (mit **Siegel**), Profiklasse beginnt bei Stufe 1. Basisklasse max. Stufe 20 (dann keine EP mehr bis Aufstieg).
- Wachstumsrate je Wert = `Charakter-Wachstum + Klassen-Modifikator` (in %, 0–100+; >100 % = garantiert +1 und Rest als Chance).
- **Glättung** (pro Wert getrennt):

```
erwartet = Σ (Wachstumsrate / 100) seit Rekrutierung
ist      = tatsächliche Zuwächse seit Rekrutierung
if ist ≤ erwartet − 1.0  → garantiert +1
elif ist ≥ erwartet + 1.5 → kein Zuwachs
else                     → +1 wenn rng() < Wachstumsrate/100
```
- **Mindestgarantie**: Steigt bei einem Level-up kein Wert, erhält der Wert mit der höchsten Wachstumsrate (unter Cap) +1.
- Werte über Cap verfallen; Caps werden durch Klassen bestimmt.

## 4. Klassenaufstieg

- **Siegel des Aufstiegs** (Item, selten; Kapitelbelohnung, Scharmützel-Drop, Händler ab Kap. 5): ab Stufe 10 nutzbar, im Lager oder im Kampf (Aktion).
- Wahl zwischen 2 Profiklassen (Avatar und Kael: je 1 eigene).
- Effekt: Stufe → 1, EP → 0, Aufstiegsboni der Profiklasse, neue Waffenarten, neuer Klassen-Skill (alter bleibt nicht – gemeisterte Item-Skills bleiben), Skill-Loadout 4 → 5 Plätze.

### Klassenbaum

| Basisklasse | Waffen | Bew.-Typ | Profi A | Profi B |
|---|---|---|---|---|
| Söldner (`mercenary`) | Schwert | Fuß | **Held** (Schwert, Axt) | Schwertmeister (Schwert, +Krit) |
| Soldat (`soldier`) | Lanze | Fuß | **Hellebardier** (Lanze, +DEF) | Kavalier (Lanze, Schwert; beritten) |
| Kämpfer (`fighter`) | Axt | Fuß | **Krieger** (Axt, Bogen) | Berserker (Axt, +Krit, Kletterer) |
| Schütze (`archer`) | Bogen | Fuß | **Scharfschütze** (Bogen, +Reichweite) | Waldläufer (Bogen, Schwert) |
| Magier (`mage`) | Elementar-Zauber | Fuß | **Weiser** (Elementar, Stab) | Hexer (Elementar, Dunkel) |
| Kleriker (`cleric`) | Stab, Licht | Fuß | **Bischof** (Stab, Licht+) | Kriegspriester (Stab, Axt) |
| Dieb (`thief`) | Schwert (Dolch) | Fuß | Assassine | Schurke |
| Pegasusritter (`pegasus_knight`) | Lanze | Flieger | Falkenritter | Seraphritter (Lanze, Stab) |
| Ritter (`knight`) | Lanze | Gepanzert | General | Großritter (beritten, gepanzert) |
| Wyvernreiter (`wyvern_rider`) | Axt | Flieger | Wyvernlord | Drachenjäger |
| Taktiker (`tactician`, nur Avatar) | Schwert, Elementar | Fuß | Großstratege | – |
| Hauptmann (`captain`, nur Kael) | Schwert, Lanze | Fuß | Bannerherr | – |

**Fett** = in V1 implementiert. **V1 spielbar**: Söldner, Soldat, Kämpfer, Schütze, Magier, Kleriker, Taktiker, Hauptmann. **V1 nur Gegner**: Ritter, Pegasusritter, Bandit (= Kämpfer-Variante), Jungdrache (`drake_young`, Monster/Flieger/Drache). Dieb, Wyvernreiter und restliche Profiklassen: spezifiziert, Implementierung nach V1.

## 5. Skills

Drei Quellen:

1. **Persönlicher Skill** – fest am Charakter, immer aktiv.
2. **Klassen-Skill** – an der aktuellen Klasse, immer aktiv.
3. **Item-Skills** – eine Waffe/Rüstung/Accessoire *gewährt* einen Skill, solange sie ausgerüstet ist. Sie sammelt dabei **Fähigkeitspunkte (FP)**:
   - +1 FP pro Kampfsequenz (Angriff oder Konter), an der die Einheit teilnimmt
   - +5 FP bei Missionsende, wenn die Einheit eingesetzt war und überlebt hat
   - Erreicht der FP-Stand die **Meisterungskosten** (20–60), ist der Skill **gemeistert** und bleibt dauerhaft auch ohne Item.
- **Skill-Loadout**: gemeisterte Skills müssen in Loadout-Plätze gelegt werden (4, nach Aufstieg 5). Item-Skills ausgerüsteter Items belegen keinen Platz.
- Doppelte Skills wirken nicht doppelt.
- FP-Fortschritt bleibt pro (Charakter, Skill) gespeichert, auch wenn das Item abgelegt wird.

## 6. Avatar & Kael

- **Avatar**: Name, Geschlecht (Pronomen: sie/er/they in Texten via i18n), Porträt-Auswahl (3–4 Vorlagen), Affinität wählbar (eines der 4 Grundelemente). Klasse Taktiker. Klassen-Skill **Befehl** (1×/Karte, siehe Kampf §1). Spricht in Dialogen nur über Auswahlantworten.
- **Kael**: Hauptmann, Lord. Klassen-Skill **Sammelruf** (Aktion, 1×/Karte: Verbündete im Radius 2 +2 Angriff/+10 Treffer bis Ende der nächsten Gegnerphase). Nur neben Kael ist Konvoi-Zugriff möglich. Pflicht für „Einnehmen“-Ziele.

## 7. Generische Söldner (Taverne)

- Klasse zufällig aus spielbaren Basisklassen, Stufe = Durchschnitt der Armee − 1 (min. 1).
- Wachstum: Klassen-Basiswachstum ± zufällige Abweichung (±10 % je Wert).
- 1–2 **Eigenschaften** (Traits), z. B.:

| Trait | Effekt |
|---|---|
| Zäh | +10 % TP-Wachstum |
| Flink | +1 MOV |
| Gierig | +20 % Anwerbekosten, +10 % Gold aus Truhen in ihrer Mission |
| Feigling | −10 Treffer, wenn kein Verbündeter benachbart |
| Veteran | +1 Loadout-Platz |
| Elementkind | Affinität (zufällig), +10 % Statuschance mit eigenem Element |
| Unbeholfen | −10 % SKL-Wachstum |

- Namen aus Namensliste (DE/EN identisch), Porträt aus Baukasten (Platzhalter in V1: Farbe + Klassen-Icon + Initiale).
- Keine Story-Supports, aber Support-Ränge C–B mit generischen Kurzdialogen (post-V1); in V1 nur Mechanik ohne Gespräch (Rang direkt bei Schwelle).
- Armee-Limit V1: 20 Einheiten.
