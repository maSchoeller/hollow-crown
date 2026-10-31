"""Renders concept/26-epics/epics/ (one file per epic) into a readable HTML review page.
Usage: python3 epics_html.py <epics dir or .md> <out.html> [first_epic] [last_epic] [title]"""
import html
import pathlib
import re
import sys

src, out = pathlib.Path(sys.argv[1]), sys.argv[2]
first = int(sys.argv[3]) if len(sys.argv) > 3 else 1
last = int(sys.argv[4]) if len(sys.argv) > 4 else 99
title = sys.argv[5] if len(sys.argv) > 5 else 'Hollow Crown Epics'
files = sorted(src.glob('epic-*.md')) if src.is_dir() else [src]
md = '\n'.join(f.read_text(encoding='utf-8') for f in files)


def inline(t: str) -> str:
    t = html.escape(t, quote=False)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', t)
    return t


epics = re.split(r'^## Epic (\d+): (.+)$', md, flags=re.M)
blocks = []
for i in range(1, len(epics), 3):
    n, name, body = int(epics[i]), epics[i + 1].strip(), epics[i + 2]
    if n < first or n > last:
        continue
    parts = re.split(r'^### Story (\d+\.\d+): (.+)$', body, flags=re.M)
    intro = parts[0].strip()
    stories = []
    for j in range(1, len(parts), 3):
        sid, sname, sbody = parts[j], parts[j + 1].strip(), parts[j + 2].strip()
        user, acs, cur = [], [], None
        for line in sbody.splitlines():
            line = line.strip()
            if not line or line.startswith('<!--') or line == '**Akzeptanzkriterien:**':
                if not line and cur:
                    acs.append(cur)
                    cur = None
                continue
            m = re.match(r'\*\*(Angenommen|Wenn|Dann|Und)\*\* (.+)', line)
            if m:
                if m.group(1) == 'Angenommen' and cur:
                    acs.append(cur)
                    cur = None
                cur = cur or []
                cur.append((m.group(1), m.group(2)))
            elif line.startswith('- '):
                user.append(('li', line[2:]))
            else:
                user.append(('p', line))
        if cur:
            acs.append(cur)
        stories.append((sid, sname, user, acs))
    blocks.append((n, name, intro, stories))

css = """
:root { --page:#f3efe6; --card:#fffaf1; --fg:#2b211b; --muted:#6f6257; --line:#3b2a20; --rule:rgba(59,42,32,.16); --ember:#e8743b; --ember-d:#b44c18; --soft:#f4e9d6; --given:#e7efff; --when:#fdf0e3; --then:#e9f6ec;
  --f-body:'Barlow',system-ui,sans-serif; --f-label:'Barlow Condensed','Arial Narrow',sans-serif; --f-name:'Fraunces',Georgia,serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --page:#1b1816; --card:#25201c; --fg:#efe7dc; --muted:#b2a596; --line:#d9c8b4; --rule:rgba(239,231,220,.14); --ember:#ef8a55; --ember-d:#f2a77d; --soft:#2f2823; --given:#232c3d; --when:#3a2a1f; --then:#1f3326; color-scheme:dark; } }
:root[data-theme="dark"] { --page:#1b1816; --card:#25201c; --fg:#efe7dc; --muted:#b2a596; --line:#d9c8b4; --rule:rgba(239,231,220,.14); --ember:#ef8a55; --ember-d:#f2a77d; --soft:#2f2823; --given:#232c3d; --when:#3a2a1f; --then:#1f3326; color-scheme:dark; }
*,*::before,*::after { box-sizing:border-box; }
body { background:var(--page); color:var(--fg); font-family:var(--f-body); font-size:15.5px; line-height:1.55; margin:0; }
.wrap { max-width:960px; margin:0 auto; padding-block:28px 72px; padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); }
header { display:grid; gap:8px; margin-bottom:22px; }
.eyebrow { font-family:var(--f-label); font-weight:700; letter-spacing:.12em; text-transform:uppercase; font-size:12px; color:var(--ember-d); }
h1 { font-family:var(--f-name); font-weight:700; font-size:clamp(28px,4vw,38px); line-height:1.05; margin:0; text-wrap:balance; }
header p { margin:0; color:var(--muted); max-width:70ch; }
nav { display:flex; flex-wrap:wrap; gap:6px; margin:6px 0 4px; }
nav a { font-family:var(--f-label); font-weight:700; font-size:14px; color:var(--fg); text-decoration:none; border:2px solid var(--line); border-radius:999px; padding:2px 12px; background:var(--card); }
section.epic { background:var(--card); border:2.5px solid var(--line); border-radius:18px; box-shadow:0 4px 0 var(--line); padding:18px; margin-top:22px; }
section.epic h2 { font-family:var(--f-name); font-weight:700; font-size:24px; margin:0 0 6px; display:flex; gap:10px; align-items:baseline; }
section.epic h2 span { font-family:var(--f-label); font-size:13px; color:#fff; background:var(--ember); border-radius:999px; padding:1px 10px; }
.intro { color:var(--muted); margin:0 0 10px; }
details { border-top:1px solid var(--rule); padding:8px 0; }
summary { cursor:pointer; list-style:none; display:flex; gap:10px; align-items:baseline; font-weight:700; }
summary::-webkit-details-marker { display:none; }
summary .id { font-family:var(--f-label); font-size:13px; color:var(--ember-d); min-width:2.6em; }
summary .t { font-family:var(--f-name); font-size:17px; }
summary .n { margin-left:auto; font-family:var(--f-label); font-size:12px; color:var(--muted); font-weight:600; white-space:nowrap; }
summary:focus-visible { outline:2px solid var(--ember); outline-offset:3px; border-radius:6px; }
.user { margin:8px 0 10px 3.2em; color:var(--fg); }
.user p { margin:0; }
.ac { margin:8px 0 8px 3.2em; border:2px solid var(--rule); border-radius:12px; padding:8px 10px; display:grid; gap:4px; }
.row { display:grid; grid-template-columns:7.2em 1fr; gap:8px; align-items:start; }
.kw { font-family:var(--f-label); font-weight:700; font-size:12px; letter-spacing:.05em; text-transform:uppercase; border-radius:999px; padding:1px 8px; text-align:center; align-self:start; margin-top:2px; }
.kw.Angenommen { background:var(--given); } .kw.Wenn { background:var(--when); } .kw.Dann { background:var(--then); } .kw.Und { background:var(--soft); }
code { font-size:.88em; background:var(--soft); padding:0 4px; border-radius:4px; overflow-wrap:anywhere; }
@media (max-width:560px) { .user, .ac { margin-left:0; } .row { grid-template-columns:1fr; gap:2px; } .kw { justify-self:start; } }
"""

parts = [f'<title>{html.escape(title)}</title>', '<meta name="claude:viewport-fit-sides" content="cover">',
         '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap">',
         f'<style>{css}</style>', '<div class="wrap">']
total = sum(len(b[3]) for b in blocks)
parts.append(f'<header><span class="eyebrow">Hollow Crown · Staffel 1 · Epics {first}–{min(last, blocks[-1][0])}</span><h1>{html.escape(title)}</h1>'
             f'<p>{len(blocks)} Epics, {total} Stories. Tippe eine Story an, um ihre Akzeptanzkriterien zu sehen. Quelle: <code>concept/26-epics/epics/</code>.</p>'
             '<nav>' + ''.join(f'<a href="#epic{n}">Epic {n}</a>' for n, *_ in blocks) + '</nav></header>')
for n, name, intro, stories in blocks:
    parts.append(f'<section class="epic" id="epic{n}"><h2><span>Epic {n}</span>{inline(name)}</h2><p class="intro">{inline(intro)}</p>')
    for sid, sname, user, acs in stories:
        parts.append(f'<details><summary><span class="id">{sid}</span><span class="t">{inline(sname)}</span><span class="n">{len(acs)} {'Kriterium' if len(acs) == 1 else 'Kriterien'}</span></summary>')
        parts.append('<div class="user">' + ''.join(f'<p>{inline(t)}</p>' if k == 'p' else f'<p>• {inline(t)}</p>' for k, t in user) + '</div>')
        for ac in acs:
            parts.append('<div class="ac">' + ''.join(f'<div class="row"><span class="kw {k}">{k}</span><span>{inline(v)}</span></div>' for k, v in ac) + '</div>')
        parts.append('</details>')
    parts.append('</section>')
parts.append('</div>')
open(out, 'w', encoding='utf-8').write('\n'.join(parts))
print(out, len(blocks), 'epics', total, 'stories')
