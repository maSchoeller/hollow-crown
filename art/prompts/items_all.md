# items_all – restliche 129 Item-Icons

- **Dateien:** `art/items/<id>.png` (Master 512 × 512, RGBA, auf 80 % gerahmt), Rohbilder `art/items/source/<id>.png` (1254 × 1254)
- **Datum:** 2026-10-23
- **Werkzeug:** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome; 7 parallele Chats, je Chat eine Warteschlange per Seitenskript (Nachricht einfügen, senden, auf das fertige Bild warten, herunterladen)
- **Referenzen:** in jedem Chat `art/mockups/characters-s1/kael.png`, `brenna.png`, `mira.png`, `tobin.png`; im Relikt-Chat zusätzlich das abgenommene `art/items/pact_warden_shield_3.png`
- **Grundlage:** Stil der abgenommenen Testbilder (`items_test.md`), Katalog `concept/21-gdd/items.md`, Regeln `concept/23-art-direction/art-direction.md` §5.6
- **Neu gegenüber dem Test:** Detailgrad nach Seltenheit (Produktinhaber: je seltener, desto mehr Textur); lange Items mit ausdrücklich dicken Schäften und Sehnen

## Erste Nachricht je Chat

> Create an image. The four attached character portraits (KAEL, BRENNA, MIRA, TOBIN) are the APPROVED STYLE REFERENCES for my fantasy tactics RPG 'Hollow Crown' ('Round Chibi Cartoon'). Match their style exactly, especially how their weapons and gear are drawn. {EXTRA}I will ask for a series of game inventory icons, one image per message, all in the SAME style and format: chunky, slightly oversized, toy-like proportions with rounded tips and thick simple shapes, soft dark-brown outline (a bit bolder than in the portraits), simple glossy cel shading, warm colors, light from the top-left; square 1:1, the single item centered and filling about 80% of the canvas; no hands, no character, no frame, no border, no text or letters, no ground shadow, no background scenery; FULLY TRANSPARENT background (PNG with real alpha channel); readable at 48x48 pixels (bold silhouette, no thin details). The amount of surface detail depends on the item's rarity; I state it each time. First icon - DETAIL: {D}. ORIENTATION: {O}. ITEM: {ITEM}

Folge-Nachrichten: *Next icon - same style and format (square, item at about 80%, FULLY TRANSPARENT background, no text). DETAIL: {D}. ORIENTATION: {O}. ITEM: {ITEM}*

`{EXTRA}` nur im Relikt-Chat: *The fifth attached image is the already approved icon of the relic 'Shield of the Pact Wardens' in its fully awakened stage; match its icon style and detail level exactly.*

**Detailstufen `{D}`**

1. simple (common item): clean flat color areas, minimal surface texture, no engravings, no ornaments
2. moderate (rare item): some surface texture and light wear, a few rivets, stitches or one small decorative element
3. rich (legendary or signature item): detailed engravings, ornaments, wrapped cloth, small gems, worn texture; a unique heroic design clearly more special than a normal item
4. very rich (ancient relic): intricate ancient engravings, gold inlays, layered materials

**Ausrichtung `{O}`:** d = long axis diagonal from bottom-left to top-right, tip at the top-right; make shafts, handles and strings thick enough to read at small size · f = seen from the front, turned slightly to the side

**Zauberbücher** nach Vorlage: *a spell tome: a chunky leather-bound book with a {Farbe} cover and a simple glowing {Symbol} symbol on the front, {Beschläge}; {Effekt}*. Beschläge Stufe 1 *plain leather corner caps*, Stufe 2 *brass corner caps and a brass clasp*, Stufe 3 *silver corner caps with small gold fittings and a gold clasp*. **Runen** nach Vorlage: *a palm-sized rounded rune stone of grey slate with a carved glowing {Symbol} symbol in {Farbe}*.

## Chats und Items

`id` · Detail · Ausrichtung · Kern der Beschreibung (vollständige englische Texte wie oben eingesetzt).

**Chat 1 – Basiswaffen (23):** steel_sword 1 d Stahl-Langschwert · silver_sword 1 d Silberschwert · slim_sword 1 d schlankes Eisen-Rapier · armorpiercer 2 d Estoc mit Dreiecksklinge · moonsteel_blade 2 d Mondstahlklinge mit Mondsichel · iron_lance 1 d · steel_lance 1 d · javelin 1 d kurzer Wurfspeer · horseslayer 2 d Lanze mit Hakenklinge, rote Quaste · moonsteel_spear 2 d · iron_axe 1 d · silver_axe 1 d · hand_axe 1 d Wurfbeil · hammer 2 d zweihändiger Kriegshammer · iron_dagger 1 d · steel_dagger 1 d · silver_dagger 1 d · throwing_knives 1 d Fächer aus drei Wurfmessern · stiletto 2 d · iron_bow 1 d · steel_bow 1 d · silver_bow 1 d · longbow 2 d Eibenlangbogen mit Federn

**Chat 2 – Bücher, Fokus, Laute (22):** blaze, ember_storm (Feuer `#F2603A`, Flamme, Stufe 2/3) · gust, gale_blade, hurricane (Wind `#7BD389`, Wirbel, 1/2/3) · rockfall, stone_fist, quake (Erde `#B9874B`, Fels, 1/2/3) · stone_wall 2 (Erde, Mauersymbol) · surge, whirlpool, maelstrom (Wasser `#4AA8E8`, Welle, 1/2/3) · shine, light_lance, sun_wheel (Licht `#F7D96B`, Sonne, 1/2/3) · shadow, void 2 (Dunkel `#8E5BD9`, Mondsichel, 2/3) · ember_focus 1 Glutkristall in Eisenklaue · crystal_focus 2 Kristall in Messing · moonsteel_orb 2 Mondstahlkugel · travel_lute 1 d · silver_lute 2 d

**Chat 3 – Stäbe, Schilde, Kopf, Körper (23):** remedy_staff 2 · mend_staff 1 · physic_staff 2 · ward_staff 2 · wooden_shield 1 · tower_shield 2 · round_shield 1 · silver_shield 1 · leather_cap 1 · iron_helm 1 · mage_hood 1 (Akademie-Violett `#4B3A6B`) · steel_helm 1 · silver_helm 1 · silver_circlet 2 · leather_vest 1 · chainmail 1 · plate_armor 1 · mage_robe 1 · ember_robe 2 (Aschgrau, Glutorange-Saum) · scale_mail 1 · silver_plate 1 · scout_cloak 1 · priest_vestment 1 (alle Rüstungen „empty, no body inside“)

**Chat 4 – Accessoires, Verbrauch, Material, Story (23):** power_ring 2 · wind_feather 2 · lucky_charm 1 · earth_amulet 2 · ashen_badge 1 · wisdom_ring 2 · swift_ring 2 · guard_amulet 2 · light_talisman 2 · fang_necklace 1 · remedy_salve 1 · door_key 1 d · fire_bomb 1 · haste_scroll 2 d · torch 1 d · ember_spark 3 (Glutfunke in goldener Wiege) · seers_herb 2 · trap_kit 1 · iron_ore 1 · moonsteel 2 · dragon_scale 3 (Obsidian, Magma `#FF6A1A`) · arcane_dust 1 · chronicle_page 2

**Chat 5 – Runen, Legendär, Gefährten-Signaturen (18):** fire_rune, wind_rune, earth_rune, water_rune, light_rune, dark_rune, precision_rune, force_rune, edge_rune, feather_rune (alle 2 f) · ashen_blade 3 d · dawnbreaker 3 d · silverwing 3 d · scalebreaker 3 d · star_staff 3 d · magpie 3 d (Fenn) · white_wolf 3 d (Ilka) · forbidden_compendium 3 f (Rhen)

**Chat 6 – Leutnant-Signaturen (12, alle Detail 3):** little_hands f (Grosk) · tinder d (Hask) · bounty d (Morra, Armbrust) · wolf_fang d (Ulvric) · wing_lance d (Rowena) · dravns_oath d (Sable) · gold_hook d (Grell) · wyvern_cleaver d (Brakka) · verdict f (Cassian) · pact_bell d (Mael) · last_wall f (Torvald) · porcelain d (Eluned)

**Chat 7 – Relikte (8, alle Detail 4):** pact_warden_shield_1 (schlafend), _2 (erwachend) als „SAME shield as the fifth image“ · dragon_ember_1/2/3 · pact_blade_1/2/3 (Aldrics Paktklinge, Knauf als hohle Krone)

## Ablauf und Pannen

- ChatGPT zeigt im Chat nur die jüngsten sechs Bilder. Die erste Fassung des Seitenskripts zählte Bilder und erkannte deshalb ab dem siebten keine neuen mehr. Die zweite Fassung erkennt ein neues Bild per Bildvergleich (12 × 12 Pixel) gegen alle schon gesehenen und prüft alle 3 s.
- Die ersten sieben Tabs gingen nach 83 Bildern verloren. 37 Icons entstanden in 5 neuen Chats mit derselben ersten Nachricht. Bilder, die in alten Chats schon fertig, aber nicht geladen waren, wurden per Abgleich (MD5 gegen die vorhandenen Downloads) übernommen.
- Ergebnis: 129 Bilder, je 1 Versuch, keine doppelten (geprüft per MD5 und Vorschau-Vergleich). Die Zuordnung Bild ↔ id wurde an einer beschrifteten Übersicht geprüft.

## Abnahme

Befunde aus der Sichtung:

- Stil und Outline einheitlich mit den Testbildern ✓; alle mit echtem Alphakanal ✓
- Detail nach Seltenheit sichtbar: Basis-Items schlicht, Signaturen und Legendäre verziert, Relikte am reichsten ✓
- Lange, dünne Items (Lanzen, Speere) bleiben bei 48 px schmal; akzeptiert

**Nachbesserung (2. Versuch, vom Produktinhaber beauftragt):** 6 Icons in 3 neuen Chats neu erzeugt, Rohbilder ersetzt.

| id | Problem im 1. Versuch | Änderung im Prompt | Ergebnis |
|---|---|---|---|
| `wing_lance` | fast gleich wie `silverwing` (Spieß mit Flügeln) | konische Turnierlanze mit Glockenhandschutz, weiß-himmelblaue Spiralstreifen, eine Feder; „clearly DIFFERENT from a spear with wings“ | eigene Silhouette ✓ |
| `slim_sword` | dunkler Stab | „medium grey iron … NOT dark“, goldener Bügelkorb | lesbar ✓ |
| `pact_warden_shield_1`, `_2` | spitzere Schildform als `_3` | `_3` als fünfte Referenz, „keep EXACTLY its outline“ | Form wie `_3` ✓ |
| `pact_blade_1`, `_2` | Stufen kaum unterscheidbar | `_3` als fünfte Referenz; Stufe 1 „absolutely NO glow“, Stufe 2 Runen klar glühend, Schneide nicht | drei Stufen unterscheidbar ✓ |
## Offen: fehlende Icons (Stand 2026-10-24)

Vom Produktinhaber beauftragt, Erzeugung sobald wieder ChatGPT-Kontingent da ist (ab 01:00). Bis dahin nutzen die Items vorläufig ein ähnliches Bild über das Feld `image` in `content/items.yaml` (Story 8.5); nach dem Erzeugen `image` entfernen bzw. auf die neue id setzen.

| id | Item | vorläufig | Wunsch |
|---|---|---|---|
| `drake_breath` | Drachenatem (Feuer-Atemwaffe nur für Drachen/Monster, `monsterOnly`) | `dragon_scale` | eigenes Icon, z. B. Feuerstoß aus einem Drachenmaul |
| `promotion_seal` | Beförderungssiegel | `chronicle_page` | eigenes Icon: Siegel/Abzeichen für den Klassenaufstieg |
| `gold` | Gold-Münze (Ressourcen-Symbol) | Vektor-Münze | gemaltes Icon, Entscheidung Produktinhaber 2026-10-24 |
| `exp` | EP-Stern (Ressourcen-Symbol) | Vektor-Stern | gemaltes Icon, grüner Stern, Entscheidung Produktinhaber 2026-10-24 |

Danach in `Amount` (`src/ui/pieces.tsx`) die Vektor-Symbole durch die Bilder ersetzen.

### Porträts generischer Gegner (Entscheidung Produktinhaber 2026-10-24)

Je Gegnerklasse ein Round-Chibi-Porträt im Stil von `art/mockups/characters-s1/` (gleiche Kopfgröße, freigestellt), ablegen als `art/mockups/characters-s1/class_<id>.png`. Bis dahin zeigt das Medaillon den Anfangsbuchstaben. Klassen auf den Karten von Akt 1 (Stand heute): `archer`, `brigand`, `cleric`, `fighter`, `mage`, `mercenary`, `soldier`; die Gegnertypen aus Story 2.9 (Banditen, Wolfsreiter zu Fuß, Söldner) kommen dazu.
