"""Generated water textures: streaks along +v for falls and runs, ripples across for pools. All tile. Keeps the hand-painted brush feeling with soft strokes."""
import random
from PIL import Image, ImageDraw, ImageFilter
T = 'art/props/textures/'
N = 512


def wrap_line(dr, pts, fill, width):
    for dx in (-N, 0, N):
        for dy in (-N, 0, N):
            dr.line([(x + dx, y + dy) for x, y in pts], fill=fill, width=width, joint='curve')


# streaks: long, slightly wavering vertical strokes, bright foam threads over blue-green
rng = random.Random(11)
im = Image.new('RGB', (N, N), (78, 146, 164))
dr = ImageDraw.Draw(im)
for layer, (count, cols, wid, ln) in enumerate(((90, [(58, 122, 146), (96, 166, 180)], (8, 16), (120, 300)),
                                                (110, [(150, 204, 212), (120, 186, 198)], (4, 8), (80, 220)),
                                                (70, [(236, 246, 246), (214, 236, 240)], (2, 5), (50, 180)))):
    for _ in range(count):
        x, y = rng.uniform(0, N), rng.uniform(0, N)
        L = rng.uniform(*ln)
        pts = [(x + rng.uniform(-3, 3), y + L * i / 5) for i in range(6)]
        wrap_line(dr, pts, rng.choice(cols), rng.randint(*wid))
im.filter(ImageFilter.GaussianBlur(1.0)).save(T + 'coast_fall.png')

# ripples, for coast pools and the canal: strokes across (u); `flip` swaps axes for projections that map z faces as (y, x)
def ripple(path, base, darks, lights, foam, flip=False):
    rng = random.Random(23)
    im = Image.new('RGB', (N, N), base)
    dr = ImageDraw.Draw(im)
    for _ in range(170):
        x, y = rng.uniform(0, N), rng.uniform(0, N)
        L = rng.uniform(40, 130)
        c = rng.choice(darks + lights)
        pts = [(x + L * i / 6, y + 6 * ((i / 3 - 1) ** 2)) for i in range(7)]
        wrap_line(dr, pts, c, rng.choice((5, 7, 9)))
    for _ in range(60):
        x, y = rng.uniform(0, N), rng.uniform(0, N)
        L = rng.uniform(16, 50)
        pts = [(x + L * i / 4, y + 3 * ((i / 2 - 1) ** 2)) for i in range(5)]
        wrap_line(dr, pts, foam, rng.choice((2, 3)))
    im = im.filter(ImageFilter.GaussianBlur(1.3))
    if flip:
        im = im.transpose(Image.ROTATE_90)
    im.save(path)


ripple(T + 'coast_ripple.png', (86, 150, 166), [(66, 128, 150), (72, 136, 156)], [(118, 180, 190), (134, 192, 198)], (214, 238, 238))
ripple(T + 'winter_water.png', (54, 104, 102), [(40, 86, 88), (44, 92, 92)], [(78, 132, 124), (92, 146, 134)], (176, 216, 200), flip=True)
