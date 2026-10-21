# 09 – UX & Mobile-Bedienung

## 1. Grundsätze

- **Hochformat zuerst**, adaptiv für Tablet und PC (Querformat).
- **Daumenzone**: Alle häufigen Aktionen in der unteren Bildschirmhälfte. Oben nur Informationen.
- **Max. 3 Taps** für einen Standardzug (Einheit → Feld → bestätigen in der Aktionsleiste, Angriff → Ziel → bestätigen).
- Touch-Ziele mindestens **44×44 pt**; Rasterfelder können durch Zoom kleiner sein, darum gibt es die Geistervorschau mit Bestätigung.
- Jede Aktion ist **abbrechbar** (Zurück-Knopf unten links, Wischgeste nach unten auf dem Bottom Sheet, Rechtsklick/Esc am PC).
- Safe Areas (Notch, Home-Indicator) beachten; `viewport-fit=cover`.

## 2. Breakpoints

| Breite | Layout |
|---|---|
| < 600 px (Handy hoch) | Brett im Vollbild, Top-Bar, Bottom Sheet + Aktionsleiste |
| 600–1023 px (Tablet / Handy quer) | Brett links, Seitenpanel rechts (Einheiteninfo, Vorschau) 320 px |
| ≥ 1024 px (Desktop) | Brett mittig, Panels links (Einheitenliste) und rechts (Info/Vorschau); Hover-Infos |

## 3. Eingabe

| Geste / Eingabe | Aktion |
|---|---|
| Tap Einheit (eigene) | auswählen → Bewegungsbereich (blau) + Angriffsbereich (rot) |
| Tap Feld im Bereich | Geisterfigur + Pfad; zweiter Tap auf dasselbe Feld = bestätigen |
| Tap Gegner / Langdruck (≥ 400 ms) | Info-Sheet; Langdruck auf Gegner schaltet dessen Gefahrenzone um |
| Pinch / Mausrad | Zoom |
| Zwei Finger ziehen / Ziehen mit Maus auf leerem Feld | Kamera verschieben |
| Doppeltipp | auf Einheit zentrieren |
| PC: Linksklick = Tap, Rechtsklick = Abbrechen/Info, Hover = Info-Tooltip | |
| PC-Tastatur (Minimum) | Esc = Abbrechen, Leertaste = nächste aktive Einheit, E = Phase beenden, D = Gefahrenzone |

## 4. Wireframes (Hochformat, Handy)

### 4.1 Kampf-HUD

```
┌───────────────────────────────┐
│ ☰  Runde 3 · Spieler   🎯 Ziel│  ← Top-Bar: Menü, Runde/Phase, Ziel-Popover
│ [Minikarte]        ⚠ Gefahr   │
├───────────────────────────────┤
│                               │
│        B R E T T              │
│   (Babylon-Canvas, zoombar)   │
│                               │
│                               │
├───────────────────────────────┤
│ ▣ Kael  Hauptmann  Lv 4       │  ← Bottom Sheet: ausgewählte Einheit
│ TP ███████░░ 18/22  ⚔Eisenschw│     (hochziehbar → volle Werte/Inventar)
├───────────────────────────────┤
│ [Angriff][Item][Tausch][Warten]│  ← Aktionsleiste (kontextabhängig)
│ ◀ Zurück          Phase ende ▶│
└───────────────────────────────┘
```

### 4.2 Kampfvorschau (ersetzt Bottom Sheet)

```
┌───────────────────────────────┐
│  KAEL            vs     BANDIT │
│  Eisenschwert ▲        Eisenaxt▼│
│  TP 22 → 22         TP 24 → 8  │
│  Schaden 8 ×2       Schaden 6  │
│  Treffer 86 %       Treffer 54%│
│  Krit 4 %           Krit 0 %   │
│  🔥 Feuer ▶ Wind (+20 %)       │
│  🤝 Tandem: Brenna (4 Schaden) │
├───────────────────────────────┤
│ [ Abbrechen ]   [ ANGREIFEN ] │
└───────────────────────────────┘
```

### 4.3 Inventar / Paperdoll (Lager & Kampf)

```
┌───────────────────────────────┐
│ ◀  Brenna · Kämpferin Lv 6  ▶ │  ← wischen = nächste Einheit
├───────────────┬───────────────┤
│  [Kopf]       │ TP 28  STR 9  │
│ [Haupt][Neben]│ MAG 0  SKL 6  │
│  [Körper]     │ SPD 5  LCK 4  │
│ [Acc1][Acc2]  │ DEF 7  RES 1  │
│ Beutel ▢▢▢    │ MOV 5  🔥     │
│ Last ██████▌░ 13/13           │
├───────────────┴───────────────┤
│ Skills: Wucht 18/25 FP · Loadout ▢▢▢▢ │
├───────────────────────────────┤
│ Konvoi ▸ Filter: [Axt][Rüst.]…│  ← Tap Item → Vergleich (grün/rot)
│ Stahlaxt   Mt11 Wt14  +2 STR→ │     zweiter Tap → anlegen
│ Handaxt    Mt6  1–2   …       │
└───────────────────────────────┘
```

### 4.4 Lager (Hub)

```
┌───────────────────────────────┐
│ Lager · Kapitel 2 abgeschl.   │
│ Gold 2 340 · Erz 5 · Mondst 1 │
├───────────────────────────────┤
│  [Kompanie]   [Konvoi]        │
│  [Händler]    [Schmied]       │
│  [Verzauberer][Taverne]       │
│  [Heiler]     [Lagerfeuer •2] │  ← Badge: neue Gespräche
├───────────────────────────────┤
│ [ Speichern ]  [ Weltkarte ▶ ]│
└───────────────────────────────┘
```

## 5. Bildschirmliste V1

1. Titel (Fortsetzen, Neues Spiel, Laden, Optionen, Import/Export)
2. Neues Spiel: Schwierigkeit, Tod-Modus (mit Erklärung), Avatar-Erstellung (Name, Pronomen, Porträt, Affinität)
3. Weltkarte (Knoten)
4. Dialog (Visual Novel) + Dialog-Log
5. Vorbereitung (Einheiten, Positionen, Karte/Gegner, Inventar)
6. Kampf-HUD + Kampfvorschau + Info-Sheets + Level-up-Popup + Phasenbanner
7. Missionsergebnis
8. Lager mit Unterseiten (siehe `07-camp-economy.md`)
9. Optionen: Sprache, Animationsgeschwindigkeit (1x/2x/Skip), Gegnerphase beschleunigen, Gefahrenzone Standard an/aus, Kampfvorschau-Bestätigung an/aus, Lautstärke, Bildschirm wach halten
10. Dev-Screens (nur Dev-Build): Karten-Viewer/Validator, Balancing-Inspektor

## 6. Feedback & Lesbarkeit

- Farben: Spieler = Blau, Gegner = Rot, Dritte = Grün, Niedergestreckt = Grau mit Puls-Icon.
- Erschöpfte Einheiten: entsättigt.
- Effektivität, Dreieck und Element als Icons auf den Einheiten im Zielmodus (▲/▼, Element-Symbol).
- Schadenszahlen als Popups; Krits größer, mit Kamera-Shake (abschaltbar).
- Haptik (Vibration) bei Krit/Tod (abschaltbar; Web: `navigator.vibrate` wo verfügbar).
- Gegnerphase: Kamera folgt; Schnellvorlauf per Tap (2x) bzw. Halten (Skip bis Phasenende).

## 7. Unterbrechbarkeit

- Auto-Save nach **jeder bestätigten Aktion** (siehe `10-tech-architecture.md` §6).
- App/Tab im Hintergrund → kein Datenverlust; beim Zurückkehren exakt am selben Punkt.
- „Fortsetzen“ auf dem Titelbildschirm lädt den Auto-Save.
