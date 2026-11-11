"""Karten-Assets: Bericht und Matrix aus einer Quelle. `python concept/23-art-direction/map-assets/build.py` schreibt matrix.md und site/index.html.

Pflege hier: ASSETS (Bestand mit Status), MISSIONS (Bedarf aus concept/22-narrative/missionsliste-s1.md).
Status: V vorhanden, B verbessern, F fehlt.
"""
from pathlib import Path

HERE = Path(__file__).parent

# id: (Name, Status, Bereich, Etappe, Befund)
ASSETS = {
    # Boden und Natur
    'gras': ('Gras, Erde, Straße', 'V', 'Boden', 1, 'Tragen den Look. Gras ist im Spätsommer sehr gelbgrün, Innenhöfe stehen auf grellem Orange (`plain`).'),
    'wald': ('Wald', 'B', 'Natur', 1, 'Ein einzelner dünner Baum je Feld, im Text steht 1–3. Sieht aus wie Deko auf Gras, nicht wie Deckung.'),
    'fels': ('Berg, Felsmasse', 'B', 'Natur', 1, 'Unbegehbar, wirkt aber wie Wiese mit Findlingen. Keine zusammenhängende Masse, Kantenstücke stehen frei.'),
    'fluss': ('Fluss', 'V', 'Wasser', 3, 'Klar und schön, passt aber nur für Akt 1. Im Moor und auf dem See ist es dasselbe Türkis.'),
    'furt': ('Furt, Flachwasser', 'B', 'Wasser', 1, 'Vom tiefen Wasser kaum zu unterscheiden, obwohl eines begehbar ist und das andere nicht.'),
    'sumpf': ('Sumpf, Schilf, Priele', 'F', 'Wasser', 2, 'Das Moor von 1-5 ist heute dasselbe Türkis wie der Fluss. Kein Morast, kein Schilf.'),
    'sand': ('Sand, Strand', 'V', 'Boden', 4, 'Vorhanden. Für Ebbe in 2-6 fehlt der Zustand „Sandbank“.'),
    'klippe': ('Klippe, Absturzkante', 'F', 'Natur', 4, 'Heute nur niedrige Seitenwände, keine sichtbare Kante nach unten.'),
    'hoehle': ('Höhlenboden und Felswand innen', 'F', 'Natur', 2, 'Das Gewölbe 1-7 steht auf Wiese mit Sonnenlicht-Gras zwischen Felsbrocken.'),
    'herbst': ('Boden Herbst', 'F', 'Boden', 3, 'Es gibt nur eine Grastextur. In Akt 2 steht Herbstlaub auf Sommerwiese.'),
    'schnee': ('Boden Schnee, Schneehauben', 'F', 'Boden', 3, 'Schneefichten stehen auf Sommerwiese, Felsen und Dächer tragen keinen Schnee.'),
    'eis': ('Eis mit Bruchstellen', 'F', 'Wasser', 5, 'Braucht auch eine Regel (R4).'),
    'spalte': ('Gletscher, Spalten, Lawine', 'F', 'Natur', 5, ''),
    'glut': ('Glutrisse, Krater', 'F', 'Natur', 5, ''),
    'wasserfall': ('Wasserfall', 'V', 'Wasser', 4, 'Seit Story 11.24 im Spiel (`waterfall_a`, von Hand auf der Felsspalte von 2-5); wirkt dort klein, ein eigenes Gelände bis zur Wasserlinie wäre besser.'),
    # Wehrbau
    'mauer': ('Mauer', 'B', 'Wehrbau', 1, 'Eine flache Steinplatte ohne Zinnen, von oben liest sie sich als Bodenbelag. Der Text fordert Zinnen.'),
    'turm': ('Mauerturm, Ecke', 'F', 'Wehrbau', 1, 'Eine Burg ohne Türme. Die Ecken der Mauer sehen aus wie die Geraden.'),
    'tor': ('Tor', 'B', 'Wehrbau', 1, 'Platzhalter aus drei Kisten, je Feld ein eigener Rahmen. Zwei Felder ergeben zwei Türchen statt eines Tors. Regel offen (R1).'),
    'tuer': ('Tür, offen und zu', 'B', 'Wehrbau', 1, 'Platzhalter aus einer Kiste.'),
    'wehrgang': ('Wehrgang, Treppe', 'F', 'Wehrbau', 2, 'Schützen auf der Mauer gibt es heute nicht: `wall` ist für alle gesperrt. Regel offen (R3).'),
    'rampe': ('Rampe, Stützmauer, Terrasse', 'F', 'Wehrbau', 1, '1-6 stürmt laut Entwurf drei Terrassen bergauf, zu sehen ist eine flache Wiese mit Mauerbändern.'),
    'fort': ('Festung', 'B', 'Wehrbau', 1, 'Solides Modell, dunkles Dach. Wirkt wie ein Haus, gibt aber Deckung und Heilung. Heilung sieht man nicht.'),
    'thron': ('Thron', 'B', 'Wehrbau', 1, 'Platzhalter aus zwei Kisten, dabei Hauptziel in 1-6.'),
    'bresche': ('Bresche, Trümmer in der Mauer', 'F', 'Wehrbau', 2, 'Für zerstörbare oder eingestürzte Stellen. Regel offen (R2).'),
    # Wege
    'bruecke_h': ('Holzbrücke', 'B', 'Wege', 1, 'Ein Bohlenblock aus dem Geländecode, flach und ohne Pfeiler.'),
    'bruecke_s': ('Steinbrücke', 'B', 'Wege', 1, 'Das Modell `bridge_idle` ist gut, wird aber nie gezeichnet: das Brett überspringt es.'),
    'steg': ('Steg, Bohlenweg', 'F', 'Wege', 2, 'Die Stege von 1-5 sind heute dieselben Bohlenblöcke.'),
    'haengebruecke': ('Hängebrücke', 'V', 'Wege', 4, 'Seit Story 11.24 eigenes Gelände `rope_bridge` (Werte des Stegs), Anker am Ufer nach den Nachbarfeldern.'),
    'eisbruecke': ('Eisbrücke', 'F', 'Wege', 5, ''),
    # Häuser
    'haus': ('Kulissenhäuser', 'V', 'Bauten', 3, 'Vier gute Modelle, Stil einheitlich. Aus der Spielkamera sieht man fast nur das Dach, daher soll das Dach die Variante tragen.'),
    'besuch': ('Besuchshaus', 'B', 'Bauten', 1, 'Unterscheidet sich vom Kulissenhaus nur durch das Türkis-Dach. Das ist erlernbar, aber kein Hinweis auf „begehbar“. Besuchszustand ist kaum sichtbar.'),
    'stadthaus': ('Stadthaus hoch, Gasse', 'F', 'Bauten', 5, 'Für Aurenhall mit eigenen Vierteln.'),
    'dach': ('Begehbares Dach', 'F', 'Bauten', 2, 'Formatwunsch aus N1 (`roof`). Regel offen (R3).'),
    'ruine': ('Ruine', 'V', 'Bauten', 3, 'Gutes Modell, aber sehr schwer (240 KB).'),
    'schrein': ('Schrein', 'B', 'Bauten', 2, 'Heilt und gibt Deckung. `relief` zeichnet dasselbe Modell ohne jede Wirkung.'),
    'relief': ('Grabrelief, Sarkophag', 'F', 'Bauten', 2, 'Heute die Schrein-Requisite, obwohl andere Wirkung.'),
    'saeule': ('Säule, Säulengang', 'F', 'Bauten', 2, 'Der Prolog spielt in Säulengängen, das Brett hat keine Säule.'),
    'palast': ('Palast: Fliesen, Teppich, Empore', 'F', 'Bauten', 5, ''),
    'regal': ('Bücherregal als Wand', 'F', 'Bauten', 5, ''),
    # Hof und Land
    'feld': ('Kornfeld', 'B', 'Hof', 1, 'Starkes Gelb in einem geschlossenen Holzrahmen. Sieht aus wie ein Gehege, ist aber begehbar.'),
    'zaun': ('Zaun', 'V', 'Hof', 1, 'Gut. Tor, Ecke und Bruch sind gebaut, das Brett nutzt nur die Gerade.'),
    'muehle': ('Mühle mit Rad', 'V', 'Hof', 2, 'Seit Story 15.8 im Spiel (`mill_idle`), die Karte setzt sie von Hand (`propVariants`).'),
    'koppel': ('Koppel, Stall, Gestüt', 'V', 'Hof', 4, 'Seit Story 11.14 im Spiel, Deko-Pferd am Anbindebalken seit Story 11.24 (`horse_a`).'),
    'terrasse': ('Getreideterrasse, Bergdorf', 'V', 'Hof', 4, 'Seit Story 11.24 von Hand in 2-4 (`terrace_a` am Südrand der Felder, `house_slate_a/b`).'),
    # Kleinteile
    'markt': ('Marktstand', 'V', 'Dinge', 2, 'Seit Story 15.8 zwei Marktstände (`market_a`, `market_b`); das Hungerlager setzt sein Lagerzelt `camp_tent_a` von Hand.'),
    'wagen': ('Wagen', 'V', 'Dinge', 3, 'Gut.'),
    'wagenburg': ('Wagenburg', 'B', 'Dinge', 5, 'Aus Wagen und Zaun baubar.'),
    'feuer': ('Lagerfeuer, Kohlebecken', 'B', 'Dinge', 2, 'Kohlebecken ist heute das Lagerfeuer, sperrt aber das Feld.'),
    'zelt': ('Zelt, Lager', 'V', 'Dinge', 3, 'Gut.'),
    'brunnen': ('Brunnen', 'V', 'Dinge', 3, 'Gut.'),
    'truhe': ('Truhe', 'V', 'Dinge', 3, 'Gut, aber dunkel. Im Zielmodus fehlt der im Text geforderte Glanz.'),
    'hebel': ('Hebel', 'F', 'Interaktiv', 1, 'Das Spiel kennt das Objekt, das Brett zeichnet es nicht: unsichtbar. Gebraucht ab 1-4.'),
    'balliste': ('Balliste', 'F', 'Interaktiv', 4, 'Dito unsichtbar. Zentrale Lektion von 2-1.'),
    'fackel': ('Fackel, Wandleuchte', 'F', 'Dinge', 2, 'Nachtkarten und Gewölbe leben davon.'),
    'hafen': ('Kai, Lagerhaus, Kran', 'V', 'Küste', 4, 'Seit Story 11.24: Kai als Gelände `quay` in 2-7, Speicher und Kran von Hand in 2-6 und 2-7.'),
    'schiff': ('Schiff, Boot', 'F', 'Küste', 4, ''),
    'buehne': ('Gaukelbühne, Markt-Deko', 'V', 'Dinge', 4, 'Seit Story 11.24 von Hand in N6 (`stage_a`, `tent_market_a`).'),
    'stollen': ('Stollen, Lore, Schienen', 'B', 'Bergwerk', 4, 'Stollen und Lore seit Story 11.24 von Hand in N5; Schienen und Grubenstütze zeichnet noch kein Gelände.'),
    'knochen': ('Drachenknochen', 'V', 'Bergwerk', 4, 'Seit Story 11.24 in der Knochenhalle von N5 (`dragon_bones_a`, zwei Felder).'),
    'kanal': ('Kanal, Schleuse', 'F', 'Stadt', 5, ''),
    'drache': ('Schlafender Drache als Gelände', 'F', 'Natur', 5, ''),
    'tempel': ('Urtempel, Gletscher-Ruine', 'F', 'Bauten', 5, ''),
}

# Mission, Name, Umgebung, Region, Assets
MISSIONS = [
    ('P', 'Die Paktnacht', 'Tempelbezirk, Höfe, Säulengänge, Nacht', 'Stadt', 'gras mauer turm tor tuer saeule feuer fackel'),
    ('1-1', 'Steckbriefe', 'Varnhold, Markt, Brücke', 'Süd', 'gras haus besuch markt wagen fluss bruecke_s furt mauer fort'),
    ('1-2', 'Asche über Erlbach', 'Dorf am Bach, Kornfelder, Furten', 'Süd', 'gras haus besuch feld zaun fluss furt bruecke_h wald'),
    ('1-3', 'Der Fremde mit dem Siegel', 'Grenzwald, Lichtung, Schrein', 'Süd', 'gras wald schrein ruine furt steg truhe'),
    ('1-4', 'Die Spur des Maklers', 'Wolfshügel, Felsen, Höhlen', 'Süd', 'gras fels wald ruine fort hebel truhe zelt feuer'),
    ('1-5', 'Das Hungerlager', 'Erlenmoor, Stege, Nebel', 'Süd', 'gras sumpf steg zelt ruine wald sand wagen schiff truhe'),
    ('1-6', 'Die Paktwacht', 'Burgruine, Sturm bergauf über Terrassen', 'Süd', 'gras fels wald mauer turm tor tuer thron rampe wehrgang fort feld bruecke_s furt besuch truhe'),
    ('1-7', 'Unter der Paktwacht', 'Gewölbe im Fels, Gräber', 'Innen', 'hoehle fels relief ruine tuer truhe fackel'),
    ('1-8', 'Die Heimat halten', 'Paktwacht, zwei Fronten', 'Süd', 'gras fels wald mauer turm tor tuer thron rampe wehrgang bresche fort feld bruecke_s besuch feuer'),
    ('N1', 'Der Ring von Varnhold', 'Nacht, Dächer, Gassen', 'Süd', 'gras dach haus mauer tor fluss bruecke_h fackel truhe'),
    ('N2', 'Der letzte Wachturm', 'Grenzmauer, Hügel', 'Süd', 'gras mauer turm bresche ruine fort fels wald truhe'),
    ('N3', 'Das Erbe', 'Pachthof, Mühle, Fluss', 'Süd', 'gras feld zaun muehle haus besuch fluss furt bruecke_h wald truhe'),
    ('2-1', 'Wind über der Eisenmark', 'Windscharte, Ballisten auf Felsnasen', 'Hochland', 'herbst fels wald balliste klippe rampe'),
    ('2-2', 'Das Siegel im Salzpass', 'Pass, Nebel, Steinschlag', 'Hochland', 'herbst fels klippe truhe wagen'),
    ('2-3', 'Die Rabenweide', 'Gestüt, Weiden, Koppelzäune, Furten', 'Hochland', 'herbst koppel zaun fluss furt haus wald'),
    ('2-4', 'Die Brandschneise', 'Bergdorf, Getreideterrassen, Wald', 'Hochland', 'herbst terrasse haus besuch wald fels rampe'),
    ('2-5', 'Die verstoßene Leibwache', 'Kloster, Hängebrücken, Wasserfall', 'Hochland', 'herbst haengebruecke wasserfall schrein mauer fels klippe fluss'),
    ('2-6', 'Gold für Banditen', 'Krähenholm, Strand, Ebbe, Schiff', 'Küste', 'herbst sand klippe schiff hafen fels furt zelt'),
    ('2-7', 'Das Kontor am Silbermeer', 'Lagerhäuser, Kräne, Kais', 'Küste', 'herbst hafen schiff haus wagen fluss bruecke_s truhe'),
    ('2-8', 'Kronfeld', 'Ebene, Hügel, Fluss', 'Hochland', 'herbst fels wald fluss furt bruecke_s fort zelt wagen'),
    ('N4', 'Der Clan im Schnee', 'Bergwald, früher Schnee', 'Hochland', 'schnee wald fels zelt feuer'),
    ('N5', 'Glut unter dem Berg', 'Bergwerk, Loren, Schächte', 'Innen', 'hoehle stollen knochen fackel truhe'),
    ('N6', 'Die Gauklertruppe', 'Herbstmarkt, Boote, Bühne', 'Küste', 'herbst buehne markt schiff bruecke_h fluss wagen'),
    ('3-1', 'Winter über Aurenhall', 'Gänge unter dem Palast, Türen', 'Innen', 'hoehle palast tuer hebel truhe fackel'),
    ('3-2', 'Das verbotene Lied', 'Sängerviertel, Kanäle, Boote, Schnee', 'Stadt', 'schnee stadthaus kanal schiff bruecke_s fackel'),
    ('3-3', 'Die Einsiedlerin', 'Winterwald, gefrorener Bach', 'Winter', 'schnee wald eis haus besuch fels'),
    ('3-4', 'Der Zweifler', 'Lager auf dem gefrorenen See, Schilf', 'Winter', 'schnee eis sumpf zelt feuer wagen'),
    ('3-5', 'Die Krönung', 'Glutdom, Halle, Emporen, Vorplatz', 'Stadt', 'schnee palast saeule thron tor mauer wehrgang fackel'),
    ('3-6', 'Das Südtor', 'Mauer, Tor, Gassen', 'Stadt', 'schnee mauer turm tor wehrgang bresche stadthaus kanal wagen fackel'),
    ('3-7', 'Der Weg ins Gebirge', 'Gletscher, Spalten, schlafender Drache', 'Winter', 'schnee spalte fels klippe drache eis'),
    ('3-8', 'Im Drachengebirge', 'Urtempel im Krater, Glutrisse', 'Winter', 'schnee glut eisbruecke tempel fels klippe saeule thron'),
    ('N7', 'Verwiesen', 'Akademie, Regale als Wände', 'Innen', 'palast regal tuer truhe fackel'),
    ('N8', 'Brennas Bruder', 'Flüchtlingslager, Wagenburg', 'Winter', 'schnee wagenburg wagen zelt feuer wald'),
    ('N9', 'Das Grab Aldrics I.', 'Gruft in der Klippe, Fjord', 'Winter', 'schnee hoehle relief klippe fackel'),
    ('N10', 'Die Unterstadt', 'Kanäle, Schleusen, Diebeswege', 'Stadt', 'kanal stadthaus hebel fackel steg truhe'),
]

ETAPPEN = {
    1: ('Formensprache und Grundbau', 'Akt 1 und alle späteren Burgen', 'Fels als Masse, Mauer mit Zinnen, Turm, ein echtes Tor, Tür, Thron, Rampe, Hebel, Wald-Nest, Furt lesbar, Feld ohne Rahmen. Das Probeset stammt aus dieser Etappe.'),
    2: ('Akt-1-Sonderorte', '1-5, 1-7, N1, N3, Prolog', 'Sumpf, Steg, Höhle, Grabrelief, Säule, Dach, Mühle, Fackeln, Marktstand, Wehrgang, Bresche.'),
    3: ('Regionen', 'alle Akte', 'Herbst- und Winterboden, Schneehauben, Materialsätze je Region für alle vorhandenen Modelle.'),
    4: ('Akt 2', '2-1 bis N6', 'Balliste, Koppel, Terrassen, Klippe, Hängebrücke, Hafen, Schiff, Bergwerk.'),
    5: ('Akt 3', '3-1 bis N10', 'Eis, Stadt und Kanal, Palast, Gletscher, Glutrisse, schlafender Drache.'),
}

STATUS = {'V': 'vorhanden', 'B': 'verbessern', 'F': 'fehlt'}


def counts(ids):
    return {s: sum(1 for a in ids if ASSETS[a][1] == s) for s in 'VBF'}


def usage():
    return {k: [m[0] for m in MISSIONS if k in m[4].split()] for k in ASSETS}


def matrix_md():
    use = usage()
    out = ['# Matrix Mission × Karten-Assets', '', 'Erzeugt von `build.py`, dort pflegen. Status: **V** vorhanden, **B** verbessern, **F** fehlt.', '']
    out += ['## Je Mission', '', '| # | Mission | Umgebung | Region | Vorhanden | Verbessern | Fehlt |', '|---|---|---|---|---|---|---|']
    for m in MISSIONS:
        ids = m[4].split()
        by = {s: ', '.join(ASSETS[a][0] for a in ids if ASSETS[a][1] == s) or '–' for s in 'VBF'}
        out.append(f'| {m[0]} | {m[1]} | {m[2]} | {m[3]} | {by["V"]} | {by["B"]} | {by["F"]} |')
    out += ['', '## Je Asset', '', '| Asset | Bereich | Status | Etappe | Missionen | Anzahl | Befund |', '|---|---|---|---|---|---|---|']
    for k, (name, st, area, et, note) in sorted(ASSETS.items(), key=lambda kv: (kv[1][3], -len(use[kv[0]]))):
        out.append(f'| {name} | {area} | {STATUS[st]} | {et} | {", ".join(use[k]) or "–"} | {len(use[k])} | {note} |')
    return '\n'.join(out) + '\n'


def chip(a):
    name, st, *_ = ASSETS[a]
    return f'<span class="c {st}">{name}</span>'


def matrix_html():
    rows = []
    for m in MISSIONS:
        ids = sorted(m[4].split(), key=lambda a: 'FBV'.index(ASSETS[a][1]))
        rows.append(f'<tr><th scope="row">{m[0]}</th><td><b>{m[1]}</b><br><small>{m[2]}</small></td><td>{m[3]}</td><td class="chips">{"".join(chip(a) for a in ids)}</td></tr>')
    return '\n'.join(rows)


def etappen_html():
    use = usage()
    out = []
    for n, (title, scope, text) in ETAPPEN.items():
        items = sorted([k for k, v in ASSETS.items() if v[3] == n and v[1] != 'V'], key=lambda k: -len(use[k]))
        li = ''.join(f'<li>{chip(k)}<small>{len(use[k])} Missionen</small></li>' for k in items)
        out.append(f'<section class="et"><h3>Etappe {n}: {title}</h3><p><small>{scope}</small><br>{text}</p><ul class="use">{li}</ul></section>')
    return '\n'.join(out)


def totals():
    c = counts(list(ASSETS))
    missing_everywhere = sum(1 for m in MISSIONS if counts(m[4].split())['F'] > 0)
    return c, missing_everywhere


def build():
    (HERE / 'matrix.md').write_text(matrix_md(), encoding='utf8')
    c, miss = totals()
    t = (HERE / 'report.template.html').read_text(encoding='utf8')
    t = (t.replace('{{MATRIX}}', matrix_html()).replace('{{ETAPPEN}}', etappen_html())
         .replace('{{V}}', str(c['V'])).replace('{{B}}', str(c['B'])).replace('{{F}}', str(c['F']))
         .replace('{{MISS}}', str(miss)).replace('{{N}}', str(len(MISSIONS))).replace('{{TOTAL}}', str(len(ASSETS))))
    (HERE / 'site').mkdir(exist_ok=True)
    (HERE / 'site' / 'index.html').write_text(t, encoding='utf8')
    print('assets', len(ASSETS), c, 'missions with gaps', miss, 'of', len(MISSIONS))


build()
