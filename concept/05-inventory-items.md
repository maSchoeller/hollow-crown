# 05 – Inventar, Items, Loot, Runen

> Kernfeature. Startwerte **[C]**. Konkrete V1-Items: `data-samples/items.yaml`, Affixe/Runen/Sets: `data-samples/affixes-runes-sets.yaml`.

## 1. Paperdoll

| Slot | Inhalt | Hinweise |
|---|---|---|
| `mainHand` | Waffe, Zauberbuch, Stab | Bestimmt Angriff, Reichweite, Dreieck, Element |
| `offHand` | Schild, Dolch (Nebenhand-Waffe), Fokus | Zweihändige Waffen (`twoHanded`) blockieren den Slot |
| `head` | Helm, Kappe, Haube | |
| `body` | Rüstung, Robe | Bestimmt die **Affinität**, wenn sie ein Element hat |
| `accessory1`, `accessory2` | Ringe, Amulette, Abzeichen | Kein Item doppelt (gleiche `id`) |
| `bag` (3 Plätze) | Verbrauchsgüter, Ersatzwaffen, Schlüssel, Siegel | Zählt **nicht** zum Gewicht; Ersatzwaffe per „Waffe wechseln“ |

- **Klassenbeschränkung**: Waffen nur, wenn die Klasse die Waffenart beherrscht. Rüstungen haben optional `armorClass` (`light`, `medium`, `heavy`); `heavy` nur für Klassen mit Tag `armored` oder Skill „Schwere Rüstung“.
- **Gewicht** → Tragkraft/Überlast (siehe `03-combat.md` §3). Die UI zeigt die Last als Balken mit Schwelle.
- **Kein Verschleiß**: Waffen sind unbegrenzt nutzbar.

## 2. Konvoi

- Gemeinsames Lager der Kompanie, V1: 200 Plätze, Stapel bei identischen Verbrauchsgütern (Ladungen werden nicht gestapelt, sondern pro Instanz geführt).
- Zugriff im Kampf: Einheiten **neben Kael** (freie Aktion „Konvoi“).
- Beim Tod einer Einheit wandert ihre Ausrüstung in den Konvoi, **außer** die Mission endet als Niederlage.
- Sortieren/Filtern nach Slot, Waffenart, Seltenheit, „kann ausrüsten“, neu.

## 3. Tauschen

- Freie Aktion (1×/Zug) mit benachbartem Verbündeten: beliebige Items zwischen Paperdoll/Beutel beider Einheiten verschieben, sofern Slot-/Klassenregeln passen.
- Gegner **entwaffnen/plündern**: Besiegte Gegner mit `drops: true` lassen ihr Item als **Beute** auf dem Feld; eine Einheit, die das Feld betritt, nimmt es in den Beutel (oder Konvoi, wenn voll).

## 4. Item-Datenmodell (Kurzform)

```ts
interface ItemDef {
  id: string;                     // "iron_sword"
  nameKey: string;                // i18n
  slot: 'mainHand'|'offHand'|'head'|'body'|'accessory'|'bag';
  kind: 'weapon'|'tome'|'staff'|'shield'|'armor'|'accessory'|'consumable'|'key'|'seal'|'material'|'rune';
  weaponType?: 'sword'|'lance'|'axe'|'bow'|'anima'|'light'|'dark'|'staff'|'dagger';
                                  // anima = Elementar-Zauber (Feuer/Wind/Erde/Wasser)
  damageType?: 'physical'|'magical';
  element?: Element;              // Zauber oder legendäres Item
  might?: number; hit?: number; crit?: number; range?: [min:number, max:number];
  weight: number;
  twoHanded?: boolean;
  armorClass?: 'light'|'medium'|'heavy';
  statMods?: Partial<Stats>;      // +DEF, +RES, +MOV …
  effectiveVs?: Tag[];
  statusOnHit?: { status: StatusId; chance: number };
  grantsSkill?: { skill: SkillId; masteryCost: number };
  runeSlots?: number;             // überschreibt Seltenheits-Default
  setId?: string;
  rarity: 'common'|'rare'|'epic'|'legendary';
  price: number;                  // Kaufpreis; Verkauf = 50 %
  charges?: number;               // Verbrauchsgüter mit Ladungen
  refillAfterMission?: boolean;
  tags?: string[];
}
interface ItemInstance {
  uid: string; defId: string;
  upgrade: 0|1|2|3|4|5;
  affixes: AffixId[];             // 0–2
  runes: (RuneId|null)[];
  chargesLeft?: number;
}
```

## 5. Seltenheit & Affixe

| Seltenheit | Affixe | Runen-Slots | Farbe (UI) | Quelle |
|---|---|---|---|---|
| Gewöhnlich | 0 | 1 | Grau | Händler, häufige Drops |
| Selten | 1 | 2 | Blau | Truhen, Bosse, Scharmützel, Händler (wenige) |
| Episch | 2 | 2 | Violett | Bosse, Nebenziele, Dörfer |
| Legendär | feste Eigenschaften + eigener Skill | 2 | Gold | handplatziert in Story/Nebenzielen |

- Affixe werden beim **Drop** gewürfelt (Seed), aus einem Pool passend zur Item-Art. Name = `Präfix + Basisname` (z. B. „Flinkes Stahlschwert“) bzw. `Basisname + Suffix` („Kettenhemd der Wacht“).
- Kein Affix doppelt auf einem Item.
- **Neu würfeln** beim Schmied: ein Affix (gewählt) wird ersetzt; Kosten siehe `07-camp-economy.md`.

## 6. Aufwertung (Schmied)

| Stufe | Waffe | Rüstung/Schild | Accessoire |
|---|---|---|---|
| +1 … +5 | je +1 Mt, +3 Treffer | je +1 DEF **oder** RES (Haupt-Wert der Rüstung) | nicht aufwertbar |

Anzeige: „Eisenschwert +3“. Kosten steigen pro Stufe (Gold + Materialien).

## 7. Runen & Verzauberung

- Runen sind Items (`kind: rune`) im Konvoi. Beim **Verzauberer** im Lager in einen freien Runen-Slot einer Waffe (oder Rüstung, s. u.) einsetzen; **Ausbauen kostenlos**, Rune bleibt erhalten.
- **Element-Runen** (Feuer, Wind, Erde, Wasser, Licht, Dunkel) in Stufen I–III:

| Stufe | Effekt auf Waffe |
|---|---|
| I | Waffe erhält das Element (Elementkreis gilt) |
| II | wie I + 30 % Statuschance des Elements |
| III | wie I + 50 % Statuschance + Geländeeffekt (Feuer entzündet Wald/Gras, Wind Rückstoß, Erde verlangsamt Ziel, Wasser löscht Brand; Licht: effektiv gegen Monster/Untote) |

- Max. **eine Element-Rune pro Waffe**. Zweiter Slot nur für **Hilfs-Runen** (z. B. Präzision +10 Treffer, Wucht +2 Mt/+2 Gewicht, Schärfe +5 Krit, Leichtigkeit −2 Gewicht).
- **Rüstungs-Runen** (Element) setzen die **Affinität** der Körperrüstung; nur 1 Slot bei Körperrüstungen, sonst keine.
- Verzauberte physische Waffen bleiben `physical` (gegen DEF); nur das Element kommt hinzu.

## 8. Ausrüstungs-Sets

- Items mit `setId`; Bonus ab 2 bzw. 4 getragenen Teilen. V1: 2 Sets, z. B.
  - **Aschenbanner-Wacht** (Helm, Kettenhemd, Schild, Abzeichen): 2 Teile +2 DEF; 4 Teile Skill „Schildwall“ immer aktiv.
  - **Gewand der Glut** (Haube, Robe, Fokus): 2 Teile +2 MAG; 3 Teile Feuer-Zauber +20 % Statuschance.

## 9. Verbrauchsgüter

| Item | Ladungen | Auffüllen | Effekt |
|---|---|---|---|
| Heiltrank | 3 | nach Mission | 10 TP (+5 pro Schmied-Stufe, max. +2) |
| Gegengift / Linderungssalbe | 2 | nach Mission | entfernt Status |
| Schlüssel | 1 | – (verbraucht) | öffnet Tür oder Truhe |
| Feuerbombe | 1 | – | Reichweite 1–2, 8 Schaden Feuer + Brennen + Geländeeffekt |
| Schriftrolle der Hast | 1 | – | Ziel: +2 MOV diese Runde |
| Siegel des Aufstiegs | 1 | – | Klassenaufstieg |

Ein Item mit Ladungen benutzen = Aktion (beendet den Zug).

## 10. UI-Anforderungen Inventar (Kurz)

- Paperdoll-Ansicht mit Werten **vorher → nachher** beim Antippen eines Items (Vergleich zur aktuellen Ausrüstung, grün/rot).
- Drag & Drop **und** Tap-Tap (Item tippen → Ziel-Slot tippen) – Tap-Tap ist primär auf Handy.
- Lastbalken, Affinitäts-Icon, Skill-Liste (gemeistert/FP-Fortschritt), Loadout-Plätze.
- „Optimieren“-Knopf (post-V1) – in V1 nicht nötig.
- Details siehe `09-ux-mobile.md`.
