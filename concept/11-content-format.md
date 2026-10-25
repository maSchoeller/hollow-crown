# 11 – Content-Format (KI-first)

Ziel: Alle Spielinhalte sind **Textdateien**, die Menschen **und** KI-Sessions direkt lesen, schreiben, diffen und validieren können. Quelle der Wahrheit ist YAML im Ordner `content/`. Jede Datei hat ein Zod-Schema; `pnpm content:check` prüft Schema, Referenzen und i18n.

Beispiele: `data-samples/` (wird bei der Umsetzung nach `content/` übernommen und erweitert).

## 1. Allgemeine Regeln

- IDs: `snake_case`, englisch, global eindeutig je Typ (`iron_sword`, `ch01_varnhold`).
- Texte **nie** inline, sondern als i18n-Schlüssel (`nameKey`) – Ausnahme: `devNote`-Felder.
- Koordinaten `[x, y]`, Ursprung oben links; Bereiche als `{ rect: [x1, y1, x2, y2] }` (inklusiv) oder `{ tiles: [[x,y], …] }`.
- Zahlen ohne Einheiten; Prozente als ganze Zahlen (`hit: 85`).
- Optionale Felder weglassen statt `null`.

## 2. Karten (`content/maps/<id>.yaml`)

```yaml
id: ch01_varnhold
nameKey: map.ch01_varnhold.name
size: [12, 18]                 # [Breite, Höhe]
fog: false
legend:                        # Zeichen → Gelände-ID (eigene Legende pro Karte erlaubt)
  ".": plain
  ",": grass
  "T": forest
  "^": mountain
  "~": river
  "=": bridge
  "#": wall
  "H": village
  "F": fort
terrain: |                     # genau <Höhe> Zeilen à <Breite> Zeichen
  ^^,,,..,,,^^
  ...
objects:                       # interaktive Objekte
  - { id: v1, type: village, at: [3, 6], reward: { recruit: mira, dialogue: dlg.ch01.mira_village } }
  - { id: c1, type: chest, at: [1, 12], contents: { item: vulnerary } }
initialEffects:                # z. B. Feuer zu Kartenbeginn
  - { effect: burning, tiles: [[5, 11], [6, 11]], turns: 3 }
deploy:
  max: 5
  forced: [avatar, kael]
  slots: [[4, 17], [5, 17], [6, 17], [7, 17], [5, 16], [6, 16]]
units:
  - id: hask
    team: enemy
    class: fighter
    level: 5
    at: [5, 8]
    boss: true
    nameKey: unit.hask.name
    items:
      - { def: steel_axe, upgrade: 1 }
      - { def: vulnerary }
    drops: [0]                 # Index der Items, die fallen gelassen werden
    ai: { profile: guard }
  - { id: e1, team: enemy, class: fighter, level: 2, at: [3, 9], items: [{ def: iron_axe }], ai: { profile: aggressive } }
pairs: []                      # Gegner-Paare: [{ a: e1, b: e2, rank: B }]
reinforcements:
  - { turn: 4, phase: enemy, announce: true, units: [ { class: fighter, level: 3, at: [0, 10], items: [{ def: hand_axe }], ai: { profile: aggressive } } ] }
objectives:
  victory: { type: reach, unit: kael, area: { tiles: [[5, 0], [6, 0]] } }
  defeat:  [ { type: unit_dies, unit: kael }, { type: unit_dies, unit: avatar } ]
  side:
    - { id: s1, type: visit_villages, reward: { gold: 500 } }
    - { id: s2, type: turn_limit, turns: 10, reward: { item: { def: fire_rune_1 } } }
triggers:
  - id: t_ambush
    once: true
    when: { type: unit_enters, team: player, area: { rect: [0, 7, 11, 8] } }
    then:
      - { action: dialogue, id: dlg.ch01.ambush }
      - { action: set_ai, units: [e3, e4], profile: aggressive }
music: battle_tense            # Platzhalter-ID
devNote: "Tutorial Feuer: Brand breitet sich von der Stadtmitte aus."
```

**Validierung**: Zeilenanzahl/-länge = `size`; jedes Zeichen in `legend`; Koordinaten in Grenzen; Einheiten nicht auf unpassierbarem Gelände (außer Flieger); `deploy.slots ≥ max`; Ziel erreichbar (Pfadsuche für `kael` vom Deploy-Bereich); IDs referenzieren existierende Klassen/Items/Dialoge.

## 3. Klassen (`classes.yaml`)

```yaml
- id: mercenary
  nameKey: class.mercenary.name
  tier: base                   # base | advanced | unique
  moveType: foot               # foot | armored | mounted | flier | monster
  mov: 5
  weapons: [sword]
  tags: []
  skill: counter_instinct
  growthMod: { hp: 10, str: 5, mag: 0, skl: 10, spd: 10, lck: 0, def: 0, res: 0 }
  caps: { hp: 50, str: 22, mag: 15, skl: 25, spd: 24, lck: 25, def: 20, res: 15 }
  promotesTo: [hero, swordmaster]
  promotionBonus: {}           # nur bei advanced
  playable: true
```

## 4. Charaktere (`units.yaml`)

```yaml
- id: kael
  nameKey: unit.kael.name
  class: captain
  level: 1
  affinity: earth
  personalSkill: steadfast
  base:   { hp: 22, str: 6, mag: 1, skl: 7, spd: 7, lck: 5, def: 5, res: 2 }
  growth: { hp: 80, str: 45, mag: 10, skl: 50, spd: 45, lck: 40, def: 35, res: 20 }
  items: [ { def: iron_sword }, { def: leather_vest }, { def: vulnerary } ]
  flags: [lord]
  supports: [avatar, brenna]
  portrait: kael
```

## 5. Items (`items.yaml`), Skills (`skills.yaml`), Affixe/Runen/Sets

Felder siehe `05-inventory-items.md` §4. Skills:

```yaml
- id: shield_wall
  nameKey: skill.shield_wall.name
  descKey: skill.shield_wall.desc
  trigger: passive             # passive | on_attack | on_defend | on_turn_start | action
  condition: { notMovedThisTurn: true }
  effect: { stats: { def: 3, res: 3 } }
```
Skill-Effekte werden als **kleine, kombinierbare Effekt-Bausteine** modelliert (`stats`, `damageBonus`, `hitBonus`, `extraMove`, `healPercent`, `negateHit`, `ignoreTerrainCost` …), damit neue Skills ohne Code entstehen. Exotische Skills dürfen eine `script`-ID haben, die auf eine Funktion im Kern zeigt.

## 6. Dialoge (`content/dialogue/<id>.yaml`)

```yaml
id: dlg.ch01.intro
background: erlbach
lines:
  - { speaker: kael,   mood: angry,  side: left,  key: dlg.ch01.intro.001 }
  - { speaker: brenna, mood: neutral, side: right, key: dlg.ch01.intro.002 }
  - choice:
      - { key: dlg.ch01.intro.c1, setFlag: avatar_cautious }
      - { key: dlg.ch01.intro.c2, setFlag: avatar_bold }
  - { speaker: kael, mood: neutral, side: left, key: dlg.ch01.intro.003, if: { flag: avatar_bold } }
```
Text liegt in `locales/de.yaml` / `locales/en.yaml` unter denselben Schlüsseln.

## 7. Kampagne (`campaign.yaml`)

```yaml
nodes:
  - { id: prologue, map: prologue_paktnacht, pre: dlg.prologue.intro, post: dlg.prologue.outro, fixed: first }
  - { id: ch01, map: ch01_varnhold, pre: dlg.ch01.intro, post: dlg.ch01.outro, requires: [{ completed: m1_1 }], skirmishesAfter: 1 }
  # … requires: { route: crown } für spätere Routen
skirmishPool:
  maps: [skirmish_field, skirmish_ruins, ch01_varnhold, ch02_silverbrook]
```

## 8. Balancing (`balance.yaml`)

Alle Konstanten aus `03-combat.md`, `04`, `05`, `07` (z. B. `triangle.hit: 15`, `element.advantage: 1.2`, `doubleAttackThreshold: 4`, `carryBonus.foot: 4`, `upgradeCosts`, `growthSmoothing.lower: 1.0`). Der Kern liest **nur** diese Datei, keine Magic Numbers im Code.

## 9. Arbeitsablauf für KI-Sessions

1. Karte als YAML schreiben (ASCII-Raster zuerst, dann Objekte/Einheiten/Ziele).
2. `pnpm content:check` → Fehler beheben.
3. `pnpm sim <mapId> --runs 200` → Siegquote Normal 60–85 %, Ø Verluste < 1 als Richtwert für Story-Kapitel.
4. Im Browser `/#/dev/map/<mapId>` visuell prüfen.
5. Texte in DE und EN ergänzen.
