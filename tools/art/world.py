"""pnpm art:world – the world map terrain (story 5.2): height and ground maps, then the Blender mesh and its preview.

Needs Blender 5.x (path from $BLENDER or the default install) plus Python with numpy, Pillow and PyYAML.
Afterwards `pnpm art:build` copies the results into public/assets/world/.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_BLENDER = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"

subprocess.run([sys.executable, os.path.join(HERE, 'world_height.py')], check=True)
exe = os.environ.get('BLENDER', DEFAULT_BLENDER)
subprocess.run([exe, '-b', '--factory-startup', '--python', os.path.join(HERE, 'blender_world.py')], check=True)
