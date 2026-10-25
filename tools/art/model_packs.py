"""Which pack a unit model ships in: the first released pack whose content shows the figure (story 8.2, Epic 7).

    python tools/art/model_packs.py            prints the table

Rules (content/packs.yaml gives the pack order and the content globs):
- A figure id is found as `unitFigureId` finds it (src/core/figure.ts): sprite, char, the class' sprite/art, the class id.
- A map unit (units, reinforcements, spawn triggers) counts for the pack of its map file.
- A roster character (units.yaml) counts for the pack of the map of the node it joins (`joins`), plus its portrait models
  (the avatar looks); a character that joins nowhere on a map counts for no pack.
- A model that no released pack references goes to the last released pack (a later act pack takes it over by showing it).
The result is written into the manifest (`models.unitPacks`) and decides the folder `<pack>/models/units/`.
"""
import glob
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def _yaml(path):
    import yaml  # PyYAML, as in tools/art/silhouettes.py
    with open(path, encoding='utf-8') as f:
        return yaml.safe_load(f)


def glob_to_regexp(g):
    """Same dialect as globToRegExp in src/content/packs.ts."""
    s, i = '', 0
    while i < len(g):
        c = g[i]
        if c == '*' and g[i + 1:i + 2] == '*':
            i += 1
            if g[i + 1:i + 2] == '/':
                i += 1
                s += '(?:.*/)?'
            else:
                s += '.*'
        elif c == '*':
            s += '[^/]*'
        elif c == '?':
            s += '[^/]'
        else:
            s += re.escape(c)
        i += 1
    return re.compile('^' + s + '$')


def released_packs(root=ROOT):
    packs = _yaml(os.path.join(root, 'content', 'packs.yaml'))['packs']
    return [p for p in packs if p.get('released')]


def pack_of_content(packs, path):
    """The first pack whose content globs match `path` (relative to content/), else the first pack (core)."""
    for p in packs:
        if any(glob_to_regexp(g).match(path) for g in p.get('content') or []):
            return p['id']
    return packs[0]['id']


def figure_id(unit, classes):
    cls = classes.get(unit.get('class') or unit.get('classId') or '', {})
    return unit.get('sprite') or unit.get('char') or unit.get('charId') or cls.get('sprite') or cls.get('art') or unit.get('class') or ''


def first_appearance(model_ids, root=ROOT):
    """-> {model id: pack id} for every id in `model_ids`."""
    packs = released_packs(root)
    order = [p['id'] for p in packs]
    rank = {pid: i for i, pid in enumerate(order)}
    fallback = order[-1]
    content = os.path.join(root, 'content')
    classes = {c['id']: c for c in _yaml(os.path.join(content, 'core', 'classes.yaml'))}
    refs = {}

    def see(fid, pid):
        if fid and (fid not in refs or rank[pid] < rank[refs[fid]]):
            refs[fid] = pid

    map_pack = {}
    for path in sorted(glob.glob(os.path.join(content, 'acts', '*', 'maps', '*.yaml'))):
        rel = os.path.relpath(path, content).replace(os.sep, '/')
        pid = pack_of_content(packs, rel)
        if pid not in rank:
            continue
        d = _yaml(path)
        map_pack[d['id']] = pid
        pools = list(d.get('units') or [])
        for r in d.get('reinforcements') or []:
            pools += r.get('units') or []
        for t in d.get('triggers') or []:
            for a in t.get('then') or []:
                if isinstance(a, dict) and a.get('action') == 'spawn':
                    pools += a.get('units') or []
        for u in pools:
            see(figure_id(u, classes), pid)
    for path in sorted(glob.glob(os.path.join(content, 'acts', '*', 'campaign.yaml'))):
        camp = _yaml(path)
        node_pack = {n['id']: map_pack[n['map']] for n in camp.get('nodes') or [] if n.get('map') in map_pack}
        units_path = os.path.join(os.path.dirname(path), 'units.yaml')
        for u in _yaml(units_path) if os.path.exists(units_path) else []:
            pid = node_pack.get(u.get('joins'))
            if not pid:
                continue
            see(u.get('sprite') or u['id'], pid)
            if u.get('portrait'):
                see(u['portrait'], pid)
            if 'avatar' in (u.get('flags') or []):
                see('avatar_a', pid)
                see('avatar_b', pid)
    return {m: refs.get(m, fallback) for m in model_ids}


if __name__ == '__main__':
    ids = sorted(os.path.basename(f)[:-4] for f in glob.glob(os.path.join(ROOT, 'art', 'models', 'units', '*.glb')))
    for k, v in first_appearance(ids).items():
        print(f'{k:16} {v}')
