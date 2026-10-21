# 03 – Kampfsystem

> Alle Zahlen sind **Startwerte [C]** und werden im Playtest justiert. Sie gehören in eine zentrale Balancing-Datei (`content/balance.yaml`), nicht hart in den Code.

## 1. Zugstruktur

- **Phasen**: Spielerphase → Gegnerphase → Phase „Dritte“ (Verbündete NPCs, Banditen, Monster). Eine Runde = alle Phasen.
- In der eigenen Phase handeln Einheiten in beliebiger Reihenfolge; jede Einheit: **Bewegen (optional) + 1 Aktion**.
- Freie Aktionen (beenden den Zug nicht, je 1× pro Zug): **Tauschen** mit benachbarter Verbündeter, **Konvoi** (neben Kael), **Waffe wechseln** (aus Beutel, vor dem Angriff).
- **Rücknahme**: Die Bewegung kann zurückgenommen werden, bis eine Aktion bestätigt wurde – *außer* die Bewegung hat neue Information aufgedeckt (Nebel gelichtet, Trigger ausgelöst, Hinterhalt).
- **Befehl** (Avatar, 1× pro Karte): ein bereits erschöpfter benachbarter Verbündeter wird wieder aktiv.

## 2. Werte

| Kürzel | DE | Bedeutung |
|---|---|---|
| HP | TP | Trefferpunkte |
| STR | Stärke | Physischer Schaden, Tragkraft |
| MAG | Magie | Magischer Schaden, Heilung |
| SKL | Geschick | Treffer, Krit |
| SPD | Tempo | Ausweichen, Doppelangriff |
| LCK | Glück | Treffer, Ausweichen, Krit-Ausweichen |
| DEF | Verteidigung | gegen physisch |
| RES | Resistenz | gegen magisch |
| MOV | Bewegung | Felder |

## 3. Formeln

```
Tragkraft     = STR + moveTypeCarryBonus     (Fuß 4, Gepanzert 8, Beritten 6, Flieger 2, Monster 10)
Last          = Summe Gewicht (Haupthand, Nebenhand, Kopf, Körper, Accessoires)   // Beutel zählt nicht
Überlast      = max(0, Last − Tragkraft)
AS (Angriffstempo) = SPD − Überlast
MOV_eff       = MOV − (Überlast ≥ 10 ? 2 : Überlast ≥ 5 ? 1 : 0) + Modifikatoren

Angriff_phys  = STR + Mt(Waffe) + Aufwertung
Angriff_mag   = MAG + Mt(Zauber/verzauberte Waffe mit „magisch“-Tag)
Schaden       = max(0, floor((Angriff × EffMult + Dreieck_Dmg − Abwehr) × ElementMult))
   Abwehr     = DEF (+ Gelände-DEF) bei physisch, RES bei magisch
   EffMult    = 3 auf Mt, wenn Waffe effektiv gegen Ziel-Tag (nur Mt wird verdreifacht: Angriff = Stat + 3×Mt)
   Dreieck_Dmg= +1 / −1
   ElementMult= 1.2 (Vorteil) / 0.8 (Nachteil) / 1.0

Treffer       = Hit(Waffe) + 2×SKL + floor(LCK/2) + Dreieck_Hit(±15) + Support + Skills
Ausweichen    = 2×AS + LCK + Gelände_Ausw + Support + Skills
Trefferchance = clamp(Treffer − Ausweichen, 0, 100)

Krit          = Crit(Waffe) + floor(SKL/2) + Skills
Krit-Ausw     = LCK
Kritchance    = clamp(Krit − Krit-Ausw, 0, 100)
Krit-Schaden  = Schaden × 3

Doppelangriff : AS_Angreifer ≥ AS_Verteidiger + 4  → Angreifer schlägt 2× (gilt auch beim Konter)
```

- **Geglätteter Zufall (2RN):** Treffer, wenn `(rng() + rng()) / 2 × 100 < Trefferchance`. Krit, Statuschancen und Skill-Auslöser nutzen **1 Wurf**.
- **Rundung:** immer `floor`, Schaden min. 0. Vorschau zeigt exakt die Werte, die verwendet werden.
- Schaden auf **niedergestreckte** Einheiten ist immer tödlich (Standard-Modus).

## 4. Kampfablauf eines Angriffs

1. Angreifer schlägt zu.
2. Verteidiger kontert, wenn die Distanz in der Reichweite seiner ausgerüsteten Waffe liegt und er nicht niedergestreckt ist.
3. Doppelangriff (Angreifer oder Verteidiger, wer schneller ist).
4. **Tandem**: Partner des Angreifers schlägt einmal mit (siehe §8).
5. Status- und Geländeeffekte werden angewendet, EP und Fähigkeitspunkte vergeben.

Stirbt/fällt eine Seite, endet die Sequenz sofort.

## 5. Waffendreieck & Effektivität

```
Schwert ▶ Axt ▶ Lanze ▶ Schwert       Vorteil: +15 Treffer, +1 Schaden; Nachteil umgekehrt
```
Bögen, Zauber, Stäbe sind dreiecksneutral.

| Effektivität | Gegen Tag |
|---|---|
| Bögen (alle) | `flier` |
| Hammer, Rüstungsbrecher | `armored` |
| Lanzen mit „Pferdetöter“ | `mounted` |
| Licht (Zauber oder Licht-Rune III) | `monster`, `undead` |
| Drachentöter (Affix/Legendär) | `dragon` |

## 6. Elementkreis

```
        Feuer
       ▲     ╲
      ╱       ▼
  Wasser      Wind          Feuer ▶ Wind ▶ Erde ▶ Wasser ▶ Feuer
      ▲       ╱
       ╲     ▼              Licht ◀▶ Dunkel   (gegenseitig stark)
        Erde
```

- **Angriffselement**: Element des Zaubers oder der Element-Rune der Waffe (max. ein Element pro Waffe). Ohne Element = neutral.
- **Affinität des Verteidigers**: Element der ausgerüsteten Körperrüstung; sonst angeborene Affinität des Charakters; sonst neutral.
- **Kreis**: Angriff X schlägt Affinität Y → ×1.2; Y schlägt X → ×0.8.
- **Licht ↔ Dunkel**: Licht gegen Dunkel-Affinität und Dunkel gegen Licht-Affinität jeweils ×1.2. Licht ist zusätzlich effektiv gegen `monster`/`undead`; Dunkel erhält ×1.2 gegen `holy`.
- Element und Waffendreieck stapeln; der Gesamtbonus wird auf **+40 % Schaden** gedeckelt.
- Gleiches Element (z. B. Feuer gegen Feuer-Affinität): ×0.8 und **immun gegen den zugehörigen Status**.

## 7. Status- & Geländeeffekte

| Element | Status auf Einheit (2 Runden) | Geländeeffekt |
|---|---|---|
| Feuer | **Brennen**: 10 % max. TP Schaden zu Beginn der eigenen Phase | Wald/Gras auf dem Zielfeld fängt Feuer → **Brennendes Feld** (2 Runden: betretbar, 5 Schaden + Brennen beim Betreten/Stehen; danach **Asche** = Ebene) |
| Wasser | **Nass**: −3 Tempo; entfernt Brennen; immun gegen Brennen | Löscht brennendes Feld; seichtes Wasser kann gefrieren (post-V1) |
| Erde | **Verlangsamt**: −1 Bewegung | Zauber „Felswall“: Feld wird 2 Runden unpassierbar |
| Wind | **Rückstoß**: Ziel 1 Feld zurück (sofort); blockiert → +2 Schaden | Vertreibt Nebel im Radius 2 für 1 Runde; facht Brand an (Ausbreitung auf 1 Nachbarfeld) |
| Licht | **Geblendet**: −20 Treffer (post-V1) | – |
| Dunkel | **Verflucht**: keine Heilung (post-V1) | – |

- **Statuschance**: Zauber laut Item-Definition (meist 50–100 %), Rune II: 30 %, Rune III: 50 %. Klassen-Skill „Elementarfokus“: +20 %.
- **Brandausbreitung**: Ein brennendes Feld entzündet zu Beginn jeder Runde 1 zufälliges brennbares Nachbarfeld mit 25 % (deterministisch über Seed).
- Status erneuern setzt die Dauer zurück, stapelt nicht.

## 8. Supports, Nachbarbonus, Tandem, Schutz

| Rang | Punkte | Nachbarbonus (Partner auf benachbartem Feld) | Tandem | Schutz |
|---|---|---|---|---|
| C | 10 | +5 Treffer | – | – |
| B | 25 | +5 Treffer, +5 Ausweichen | ja | – |
| A | 45 | +10 Treffer, +10 Ausweichen | ja | 20 % |
| S | 70 | +15 Treffer, +10 Ausweichen, +5 Krit | ja | 30 % |

- **Punkte**: +1 wenn zwei Partner ihre Aktion benachbart beenden; +2 bei Tandem, Heilen des Partners oder Bergen. Ein Rang wird erst durch das **Lagergespräch** freigeschaltet (Punkte stauen sich bis dahin am Schwellwert).
- **S-Rang**: max. ein S-Partner pro Charakter.
- **Tandem**: Steht ein Partner mit Rang ≥ B neben dem Angreifer und liegt das Ziel in der Reichweite seiner Waffe, schlägt er nach der Kampfsequenz **einmal** mit: 50 % Schaden (floor), normale Trefferchance, keine Krits, kein Konter. Max. 1 Tandem-Partner (der mit dem höchsten Rang, bei Gleichstand höchster Schaden). Löst nur bei **Angriffen in der eigenen Phase** aus, nicht beim Konter.
- **Schutz**: Wird eine Einheit angegriffen und steht ein Partner mit Rang ≥ A benachbart, wird pro Kampfsequenz der erste Treffer mit 20/30 % komplett abgefangen.
- Mehrere Partner: Nachbarbonus aller benachbarten Partner stapelt, max. +20 Treffer/+20 Ausweichen.
- **Gegner-Paare**: In Kartendaten definierbar (`pairs`), nutzen dieselben Regeln.

## 9. Niedergestreckt, Narben, Tod

Modus beim Spielstart wählbar (`deathMode`):

| Modus | 0 TP |
|---|---|
| **Klassik** | Einheit stirbt sofort |
| **Standard** | Einheit ist **niedergestreckt**: bleibt als Marker auf dem Feld, blockiert es, kann nicht handeln. Jeder weitere Treffer = Tod. Rettung durch **Bergen** (Aktion eines benachbarten Verbündeten → Einheit verlässt das Feld). Ist sie bei Missionsende noch niedergestreckt, stirbt sie. Gerettete Einheiten erhalten eine **Narbe**. Eine Einheit mit **2 Narben** stirbt beim nächsten Erreichen von 0 TP sofort. |
| **Casual** | Einheit zieht sich zurück, keine Narbe, ab nächster Mission wieder verfügbar |

- **Avatar oder Kael** bei 0 TP (alle Modi) → **Niederlage**. Neustart: Rundenbeginn (Standard/Casual) oder Missionsbeginn (Klassik) – siehe Offener Punkt O1.
- **Narben** (zufällig aus Tabelle, dauerhaft, bis Heiler sie entfernt):

| Narbe | Effekt |
|---|---|
| Lahmes Bein | −1 MOV |
| Zittrige Hand | −10 Treffer |
| Gebrochene Rippen | −3 max. TP |
| Schwaches Auge | −5 Krit, −5 Treffer auf Distanz ≥ 2 |
| Zerschlagene Schulter | −2 STR |
| Albträume | −3 LCK, −5 Ausweichen |

- **Gegner-KI und Todesstoß**: Leicht = nie; Normal = nur wenn kein anderes Ziel erreichbar; Schwer = bevorzugt.

## 10. Erfahrung

```
Δ = Stufe_Gegner_effektiv − Stufe_Einheit_effektiv     (Profiklasse zählt +15 Stufen)
EP Kampf ohne Besiegen = clamp(10 + Δ, 1, 30)
EP Besiegen            = clamp(30 + 3×Δ, 10, 100)  (+20 bei Boss)
EP Heilen/Stab         = 12 (+ 3 pro zusätzlichem Ziel)
EP Bergen/Ansprechen   = 10
100 EP = Stufenaufstieg (Überschuss bleibt)
```

## 11. Kampfvorschau (Pflichtanzeige)

Für beide Seiten: TP vorher → nachher (inkl. Doppelangriff, Tandem), Schaden pro Schlag (×2 Markierung), Trefferchance, Kritchance, Effektivität (Icon), Dreieck (Pfeil ▲▼), Element (Kreis-Icon, Vorteil/Nachteil), Statuschance, Tandem-Partner und Schutz-Chance. Die Vorschau ist **exakt** (nutzt denselben Kern-Code wie die Auflösung, ohne RNG).
