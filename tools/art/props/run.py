"""pnpm art:props – builds every prop group of the low-poly library in Blender (tools/art/props/*.py).

Needs Blender 5.x ($BLENDER or the default install). Afterwards `pnpm art:build` copies the models to public/assets.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_BLENDER = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
GROUPS = ['trees', 'trees_seasons', 'nature', 'houses', 'landmarks', 'camp', 'houses_variants', 'nature_variants']

exe = os.environ.get('BLENDER', DEFAULT_BLENDER)
for g in (sys.argv[1:] or GROUPS):
    print(f'== {g}', flush=True)
    subprocess.run([exe, '-b', '--factory-startup', '--python', os.path.join(HERE, f'{g}.py')], check=True)
