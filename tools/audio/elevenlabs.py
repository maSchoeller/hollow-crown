"""ElevenLabs audio generation for Hollow Crown (concept/17).

python tools/audio/elevenlabs.py status            # plan / remaining credits
python tools/audio/elevenlabs.py sfx [ids...]      # sound effects → audio-src/build/<id>.mp3
python tools/audio/elevenlabs.py music [ids...]    # music cues  → audio-src/build/<id>.mp3

The API key is read from the environment variable ELEVENLABS_API_KEY (on Windows also from the
user environment in the registry). It is never printed. Existing files are skipped unless --force.
"""
import json
import os
import sys
import urllib.error
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'audio-src', 'build')
API = 'https://api.elevenlabs.io/v1'

# id → (prompt, seconds). Style: crisp, cinematic, not gritty; short transients for phone speakers (concept/17 §5).
SFX = {
    'tap': ('Soft fantasy UI tap, small wooden click with a tiny metallic tick, clean, no reverb', 0.5),
    'confirm': ('Medieval fantasy UI confirm sound, small bright metal chime with soft wooden click, pleasant', 0.6),
    'cancel': ('Fantasy UI cancel sound, soft low wooden thud with a short descending tone, gentle', 0.5),
    'error': ('Fantasy UI error sound, dull muted wooden knock twice, short', 0.5),
    'phase': ('Short war horn call with a snare roll, fantasy battle turn start, cinematic, punchy', 1.6),
    'hit': ('Short sharp sword slash hitting leather armor, punchy, cinematic, no reverb', 0.5),
    'hit_2': ('Heavy axe chop hitting a wooden shield and body, punchy, cinematic, dry', 0.5),
    'hit_3': ('Spear thrust impact into chainmail, quick metallic crunch, cinematic, dry', 0.5),
    'crit': ('Massive critical sword strike, whoosh into a heavy metallic impact with a deep boom, epic, cinematic', 1.2),
    'miss': ('Fast sword swing whoosh through empty air, clean, short', 0.5),
    'miss_2': ('Quick dodge, cloth rustle and air whoosh, short', 0.5),
    'magic_fire': ('Magical fire spell impact, whoosh into crackling burst of flames, bright, cinematic', 1.0),
    'magic_wind': ('Magical wind spell, sharp gust slicing through the air with a whistling swish, cinematic', 1.0),
    'magic_earth': ('Magical earth spell, rocks bursting out of the ground with a deep rumble, cinematic', 1.0),
    'magic_water': ('Magical water spell, sphere of water bursting with a splash and droplets, cinematic', 1.0),
    'magic_light': ('Holy light spell, shimmering chime rising into a bright radiant burst, angelic, cinematic', 1.2),
    'magic_dark': ('Dark magic spell, deep whispering whoosh with an ominous low pulse, cinematic', 1.0),
    'heal': ('Gentle healing magic, soft rising sparkles and warm chime, calm, fantasy', 1.2),
    'levelup': ('Short triumphant level up fanfare, brass and bells, fantasy RPG, joyful', 2.0),
    'downed': ('Character collapses, armor clatter on the ground followed by a slow heartbeat, dramatic', 1.6),
    'death': ('Dull heavy thud followed by a sad fading low string tone, dramatic, cinematic', 2.0),
    # farewell card (story 6.7): one bell toll for each fallen companion; generated with the audio story
    'bell': ('Single distant church bell toll, deep and solemn, long natural decay, quiet, mournful, no music', 4.0),
    'recruit': ('Warm hopeful harp flourish with a soft choir swell, fantasy ally joins, short', 2.0),
    'loot': ('Picking up an item, leather pouch rustle with a small metallic clink, satisfying', 0.6),
    'gold': ('Handful of gold coins clinking into a pouch, bright, satisfying', 0.8),
    'victory': ('Short heroic victory fanfare, orchestral brass with timpani, fantasy, triumphant ending', 4.0),
    'defeat': ('Short somber defeat sting, low strings and a single mournful horn, fantasy', 4.0),
}

MUSIC = {
    'title': ('Orchestral fantasy main theme with folk elements: warm fiddle and lute melody over strings, frame drum, '
              'growing into a full orchestra, hopeful but melancholic, tactical RPG title screen, seamless loop', 75),
    'worldmap': ('Calm orchestral folk piece, lute and soft strings with a gentle flute melody, travelling across a map, '
                 'warm and contemplative, fantasy RPG, seamless loop', 60),
    'camp': ('Quiet campfire folk music at night, solo lute and soft fiddle, crackling warmth, intimate and cosy, '
             'fantasy mercenary camp, slow tempo, seamless loop', 60),
    'battle_player': ('Energetic orchestral fantasy battle music in D minor at 120 bpm, folk fiddle melody over driving strings, '
                      'frame drums and brass hits, heroic and determined, tactical RPG player phase, seamless loop', 75),
    'battle_enemy': ('Tense orchestral fantasy battle music in D minor at 120 bpm, darker arrangement of a heroic theme: low strings, '
                     'war drums, menacing brass, ominous, tactical RPG enemy phase, seamless loop', 75),
}


def api_key() -> str:
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key and sys.platform == 'win32':
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, 'Environment') as k:
            key = winreg.QueryValueEx(k, 'ELEVENLABS_API_KEY')[0]
    if not key:
        sys.exit('ELEVENLABS_API_KEY not set')
    return key.strip()


def request(path: str, body=None, accept='application/json'):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f'{API}{path}', data=data, method='POST' if body is not None else 'GET')
    req.add_header('xi-api-key', api_key())
    req.add_header('accept', accept)
    if body is not None:
        req.add_header('content-type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        msg = e.read().decode('utf-8', 'replace')[:400]
        raise RuntimeError(f'HTTP {e.code} on {path}: {msg}') from None


def save(name: str, audio: bytes) -> None:
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, f'{name}.mp3'), 'wb') as f:
        f.write(audio)
    print(f'ok  {name}.mp3 ({len(audio) // 1024} KB)')


def todo(table: dict, ids: list[str]) -> list[str]:
    force = '--force' in sys.argv
    sel = ids or list(table)
    return [i for i in sel if force or not os.path.exists(os.path.join(OUT, f'{i}.mp3'))]


def main() -> None:
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'status'
    ids = [a for a in sys.argv[2:] if not a.startswith('--')]
    if cmd == 'status':
        sub = json.loads(request('/user/subscription'))
        print(json.dumps({k: sub.get(k) for k in ('tier', 'character_count', 'character_limit', 'status', 'next_character_count_reset_unix')}, indent=1))
    elif cmd == 'sfx':
        for i in todo(SFX, ids):
            prompt, secs = SFX[i]
            try:
                save(i, request('/sound-generation', {'text': prompt, 'duration_seconds': secs, 'prompt_influence': 0.5}, 'audio/mpeg'))
            except RuntimeError as e:
                print(f'FAIL {i}: {e}')
    elif cmd == 'music':
        for i in todo(MUSIC, ids):
            prompt, secs = MUSIC[i]
            try:
                save(i, request('/music', {'prompt': prompt, 'music_length_ms': secs * 1000}, 'audio/mpeg'))
            except RuntimeError as e:
                print(f'FAIL {i}: {e}')
    else:
        sys.exit(__doc__)


if __name__ == '__main__':
    main()
