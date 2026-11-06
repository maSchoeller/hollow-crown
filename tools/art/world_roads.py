"""Road network of the world map (story 15.12): which places the drawn paths connect.

    python tools/art/world_roads.py          print the network and its checks
    python tools/art/world_roads.py --write  write it as `roads:` into content/world/valmora.yaml

The paths show the geography, not the order of the campaign (product owner 2026-11-06). First the roads that
concept/22-narrative/geografie-valmora.md names (GEOGRAPHY below: the Klamm road, the pass road, the spokes of Kronfeld, the
way up to the crater); then, where the text says nothing, neighbours by a Gabriel graph over the stone positions: an edge
a-b is kept when no other place lies in the circle over a-b as diameter. Edges longer than MAX_LEN (percent of the map
width) or crossing an edge taken before are dropped, shortest first. Last, any part still cut off gets its shortest
non-crossing link. The result is data in the YAML; the game does not compute it.
"""
import itertools
import math
import os
import re
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORLD = os.path.join(ROOT, 'content', 'world', 'valmora.yaml')
MAX_LEN = 18.0  # percent of the map width: no long diagonals across the map

# geografie-valmora.md, "Reise und Tore" and "Maßstab und Entfernungen"
GEOGRAPHY = [
    ('aurenhall', 'aure_gorge'),  # Aurenhall – Kronfeld through the Klamm
    ('aure_gorge', 'raven_meadow'),
    ('raven_meadow', 'kronfeld'),
    ('refugee_camp', 'aure_gorge'),  # the refugees are stuck before the Klamm (N8)
    ('kronfeld', 'wind_gap'),  # Kronfeld – Windscharte – Paktwacht: the pass road
    ('wind_gap', 'paktwacht'),
    ('paktwacht', 'tobin_farm'),  # Paktwacht – Varnhold
    ('tobin_farm', 'varnhold'),
    ('kronfeld', 'kontor'),  # the spokes of Kronfeld
    ('kronfeld', 'silverspring'),  # Kronfeld – Grauwacht over Silberquell
    ('silverspring', 'greywatch'),
    ('aurenhall', 'mirror_lake_camp'),  # act 3: town, lake, pass into the mountains, crater
    ('mirror_lake_camp', 'mountain_pass'),
    ('mountain_pass', 'crater'),
]


def load():
    with open(WORLD, encoding='utf-8') as f:
        w = yaml.safe_load(f)
    return {p['id']: tuple(p['at']) for p in w['places']}


def cross(a, b, c, d):
    """Whether the segments a-b and c-d cross in their inside (a shared end does not count)."""
    if len({a, b, c, d}) < 4:
        return False
    o = lambda p, q, r: (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
    return o(a, b, c) * o(a, b, d) < 0 and o(c, d, a) * o(c, d, b) < 0


def build(at):
    dist = lambda e: math.dist(at[e[0]], at[e[1]])
    edges = []

    def free(e):
        return all(not cross(at[e[0]], at[e[1]], at[f[0]], at[f[1]]) for f in edges)

    for e in GEOGRAPHY:
        assert e[0] in at and e[1] in at, e
        if not free(e):
            raise SystemExit(f'geography road {e} crosses another one')
        edges.append(e)
    have = {frozenset(e) for e in edges}
    gabriel = []
    for a, b in itertools.combinations(sorted(at), 2):
        m = ((at[a][0] + at[b][0]) / 2, (at[a][1] + at[b][1]) / 2)
        r = math.dist(at[a], at[b]) / 2
        if all(math.dist(at[c], m) >= r for c in at if c not in (a, b)):
            gabriel.append((a, b))
    for e in sorted(gabriel, key=dist):
        if frozenset(e) not in have and dist(e) <= MAX_LEN and free(e):
            edges.append(e)
            have.add(frozenset(e))
    # connect what is still cut off by its shortest free link
    while True:
        part = parts(at, edges)
        if len(part) == 1:
            break
        first = part[0]
        links = sorted(((a, b) for a in first for b in at if b not in first), key=dist)
        link = next((e for e in links if free(e)), None)
        if not link:
            raise SystemExit(f'cannot connect {sorted(first)} without a crossing')
        edges.append(link)
    return edges


def parts(at, edges):
    seen, out = set(), []
    nbr = {p: set() for p in at}
    for a, b in edges:
        nbr[a].add(b)
        nbr[b].add(a)
    for p in at:
        if p in seen:
            continue
        group, todo = set(), [p]
        while todo:
            q = todo.pop()
            if q in group:
                continue
            group.add(q)
            todo += nbr[q] - group
        seen |= group
        out.append(group)
    return out


def main():
    at = load()
    edges = build(at)
    longest = max(math.dist(at[a], at[b]) for a, b in edges)
    print(f'{len(edges)} roads over {len(at)} places, longest {longest:.1f} % of the width, connected: {len(parts(at, edges)) == 1}')
    block = '\n'.join(f'  - [{a}, {b}]' for a, b in edges)
    if '--write' not in sys.argv:
        print(block)
        return
    with open(WORLD, 'rb') as f:
        raw = f.read().decode('utf-8')
    nl = '\r\n' if '\r\n' in raw else '\n'
    text = raw.replace('\r\n', '\n')
    new = 'roads:\n' + block + '\n'
    if re.search(r'(?m)^roads:\n', text):
        text = re.sub(r'(?m)^roads:\n(?:  - .*\n)*', lambda _: new, text)
    else:
        text = text.rstrip('\n') + '\n' + ROADS_HEAD + new
    with open(WORLD, 'wb') as f:
        f.write(text.replace('\n', nl).encode('utf-8'))
    print(f'written to {os.path.relpath(WORLD, ROOT)}')


ROADS_HEAD = '''# Wege zwischen den Orten (Story 15.12, Produktinhaber 2026-11-06): sie zeigen die Geografie, nicht die Missionsfolge.
# Erzeugt mit `python tools/art/world_roads.py --write`: zuerst die Straßen aus geografie-valmora.md, dann Nachbarn per
# Gabriel-Graph ohne Kreuzungen und ohne lange Diagonalen; jeder Ort ist erreichbar. Nicht von Hand pflegen, sondern dort.
'''

if __name__ == '__main__':
    main()
