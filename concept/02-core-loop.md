# 02 – Spielschleife

## Makro-Loop (Kampagne)

```
 ┌──────────────┐    ┌─────────────────┐    ┌─────────────────┐
 │ Weltkarte    │───▶│ Story-Dialog    │───▶│ Vorbereitung    │
 │ (Knoten)     │    │ (vor Kapitel)   │    │ Einheiten, Pos. │
 └──────▲───────┘    └─────────────────┘    └───────┬─────────┘
        │                                           ▼
 ┌──────┴───────┐    ┌─────────────────┐    ┌─────────────────┐
 │ Lager        │◀───│ Ergebnis        │◀───│ Mission         │
 │ (Hub)        │    │ Loot, EP, Tote  │    │ (Taktikkampf)   │
 └──────────────┘    └─────────────────┘    └─────────────────┘
```

1. **Weltkarte**: Knotenkarte von Valmora. Story-Kapitel sind feste Knoten. Nach jedem Kapitel erscheinen 1–2 **Scharmützel-Knoten** (optional, wiederholbar).
2. **Story-Dialog**: Visual-Novel-Szene vor dem Kapitel.
3. **Vorbereitung**: Karte ansehen, Gegner inspizieren, Einheiten wählen (Pflicht-Einheiten: Avatar, Kael), Startpositionen tauschen, Ausrüstung anpassen.
4. **Mission**: Phasen Spieler → Gegner → Dritte, bis Sieg- oder Niederlagebedingung.
5. **Ergebnis**: Haupt-/Nebenziele, Gold, Loot, Materialien, Fähigkeitspunkte, Tote und Narben, Support-Fortschritt.
6. **Lager**: Konvoi/Ausrüstung, Händler, Schmied, Verzauberer, Taverne, Heiler, Support-Gespräche, Speichern. Dann zurück zur Weltkarte.

## Mikro-Loop (ein Spielerzug)

1. Einheit antippen → Bewegungs- und Angriffsreichweite erscheinen.
2. Zielfeld antippen → Geisterfigur auf Zielfeld; zweiter Tap bestätigt (oder anderes Feld wählen / Abbrechen).
3. Aktionsleiste: **Angriff**, **Zauber/Stab**, **Item**, **Tauschen**, **Konvoi** (neben Kael), **Ansprechen**, **Besuchen/Öffnen/Bergen**, **Befehl** (Avatar), **Warten**.
4. Bei Angriff: Ziel wählen → **Kampfvorschau** (Schaden, Treffer-%, Krit-%, Doppelangriff, Tandem-Partner, Element-/Dreieck-Indikatoren, Statuschance) → Bestätigen.
5. Kurzkampf-Animation auf dem Brett → Einheit ist „erschöpft“ (ausgegraut).
6. Sind alle Einheiten erschöpft oder tippt der Spieler „Phase beenden“ → Gegnerphase.

## Motivationsbögen

| Zeitraum | Motivation |
|---|---|
| Sekunden | Treffer, Krits, Stufenaufstieg, Tandem-Angriffe |
| Minuten | Mission gewinnen, Nebenziele, Truhen/Dörfer, Rekrutierung im Kampf |
| Stunden | Builds aus Ausrüstung + Runen + gemeisterten Skills, Klassenaufstieg, Supports, legendäre Items |
| Kampagne | Story, Fraktionswahl, Überleben der Lieblingsfiguren |

## Umgang mit Verlust (Permadeath-Ökonomie)

- Tod ist dauerhaft (außer Casual). Story-Helden sind einzigartig; ihr Verlust soll schmerzen.
- Ersatz: Taverne (generische Söldner) und Scharmützel (EP/Gold/Material nachfarmen).
- Narben sind ein sichtbares „Gedächtnis“ und können beim Heiler teuer entfernt werden.
- Stirbt ein Support-Partner, erhält der Überlebende „Trauer“ (−10 Treffer für 3 Missionen) und ein kurzes Lagergespräch.
