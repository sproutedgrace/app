"""Make the app icons and the link-preview image from the Sprouted Grace logo.

How to use (on a computer with Python and Pillow):
    pip install pillow
    python3 tools/make-icons.py path/to/sprouted-grace-logo.png [path/to/banner-photo.jpg]

Run it from the main folder of the app. It writes logo.png, favicon.png,
apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png and
og-image.jpg next to index.html. If you also give a banner photo (like the
sprout growing through concrete), it makes hero.jpg for the Home page and puts
the photo on the left side of og-image.jpg. With no logo file, it draws a simple
stand-in sprout so the app still has icons.
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IVORY = (250, 246, 236)
GREEN = (35, 158, 70)      # #239E46
LIME = (101, 217, 22)      # #65D916
GOLD = (212, 160, 23)      # #D4A017
INK = (40, 44, 38)


def font(style, size):
    for p in (os.path.join(HERE, 'fonts', f'EBGaramond-{style}.woff'),
              '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'):
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            pass
    return ImageFont.load_default()


def stand_in(size=1024):
    """A simple sprout in a gold ring. Used only until the real logo is added."""
    s = size
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([s*.04, s*.04, s*.96, s*.96], fill=IVORY + (255,), outline=GOLD + (255,), width=int(s*.035))
    d.ellipse([s*.10, s*.10, s*.90, s*.90], outline=GOLD + (140,), width=int(s*.008))
    # soil line
    d.arc([s*.22, s*.70, s*.78, s*.90], 200, 340, fill=GREEN + (255,), width=int(s*.03))
    # stem
    d.line([(s*.5, s*.76), (s*.5, s*.37)], fill=GREEN + (255,), width=int(s*.04))
    # leaves (two ellipses, rotated)
    def leaf(cx, cy, w, h, ang, col):
        L = Image.new('RGBA', (int(w), int(h)), (0, 0, 0, 0))
        ImageDraw.Draw(L).ellipse([0, 0, w-1, h-1], fill=col + (255,))
        L = L.rotate(ang, expand=True, resample=Image.BICUBIC)
        im.alpha_composite(L, (int(cx - L.width/2), int(cy - L.height/2)))
    leaf(s*.385, s*.415, s*.30, s*.13, 30, GREEN)
    leaf(s*.615, s*.355, s*.32, s*.14, -35, LIME)
    return im


def knock_out_white(im):
    """Turn a plain white background clear, so the logo sits well on ivory."""
    im = im.convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            m = min(r, g, b)
            if m >= 236:
                px[x, y] = (r, g, b, 0)
            elif m > 200:
                px[x, y] = (r, g, b, int(a * (236 - m) / 36))
    return im


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    photo = sys.argv[2] if len(sys.argv) > 2 else None
    logo = Image.open(src).convert('RGBA') if src else stand_in()
    if src and min(logo.convert('RGB').getpixel((2, 2))) > 240:
        logo = knock_out_white(logo)
    box = logo.getchannel('A').point(lambda a: 255 if a > 120 else 0).getbbox()
    if box:
        logo = logo.crop(box)
    # make it square, centered, with a little room around it
    w, h = logo.size; m = int(max(w, h) * 1.12)
    sq = Image.new('RGBA', (m, m), (0, 0, 0, 0)); sq.alpha_composite(logo, ((m-w)//2, (m-h)//2)); logo = sq

    def on_bg(size, pad, bg=(255, 255, 255)):
        im = Image.new('RGBA', (size, size), bg + (255,))
        inner = int(size * (1 - 2*pad))
        im.alpha_composite(logo.resize((inner, inner), Image.LANCZOS), ((size-inner)//2,)*2)
        return im.convert('RGB')

    logo.resize((512, 512), Image.LANCZOS).save(os.path.join(HERE, 'logo.png'))
    on_bg(64, .02).save(os.path.join(HERE, 'favicon.png'))
    on_bg(180, .08).save(os.path.join(HERE, 'apple-touch-icon.png'))
    on_bg(192, .06).save(os.path.join(HERE, 'icon-192.png'))
    on_bg(512, .06).save(os.path.join(HERE, 'icon-512.png'))
    on_bg(512, .18).save(os.path.join(HERE, 'icon-maskable-512.png'))  # safe zone for round icons

    pic = None
    if photo:
        pic = Image.open(photo).convert('RGB')
        # Home banner: the middle of the photo, about 3 wide by 2 tall
        W, H = pic.size; cw = min(W, int(H * 1.5)); x0 = (W - cw) // 2
        pic = pic.crop((x0, 0, x0 + cw, H))
        pic.resize((960, int(960 * H / cw)), Image.LANCZOS).save(os.path.join(HERE, 'hero.jpg'), quality=84)

    # Link preview: 1200 x 630
    og = Image.new('RGB', (1200, 630), IVORY)
    d = ImageDraw.Draw(og)
    if pic:
        side = pic.resize((int(630 * pic.width / pic.height), 630), Image.LANCZOS)
        cx = (side.width - 520) // 2
        og.paste(side.crop((cx, 0, cx + 520, 630)), (0, 0))
        d.rectangle([520, 0, 1199, 629], fill=(255, 255, 255))
        d.line([(520, 0), (520, 630)], fill=GOLD, width=6)
        L = logo.resize((210, 210), Image.LANCZOS); og.paste(L, (750, 40), L)
        f1, f3 = font('SemiBold', 74), font('Italic', 38)
        def center(t, f, y, col):
            tw = d.textlength(t, font=f); d.text((860 - tw/2, y), t, font=f, fill=col)
        center('Sprouted Grace', f1, 262, GREEN)
        center('Ministry', font('SemiBold', 46), 346, INK)
        d.line([(640, 418), (1080, 418)], fill=GOLD, width=3)
        center('Rooted in His Words.', f3, 438, INK)
        center('Growing in Grace.', f3, 486, INK)
    else:
        d.rectangle([24, 24, 1175, 605], outline=GOLD, width=3)
        L = logo.resize((380, 380), Image.LANCZOS)
        og.paste(L, (90, 125), L)
        d.text((520, 180), 'Sprouted Grace', font=font('SemiBold', 78), fill=GREEN)
        d.text((522, 272), 'Ministry', font=font('SemiBold', 54), fill=INK)
        d.line([(522, 362), (1080, 362)], fill=GOLD, width=3)
        d.text((522, 384), 'Rooted in His Words.', font=font('Italic', 38), fill=INK)
        d.text((522, 432), 'Growing in Grace.', font=font('Italic', 38), fill=INK)
    og.save(os.path.join(HERE, 'og-image.jpg'), quality=88)
    print('Done. Icons and og-image.jpg are saved next to index.html.')


if __name__ == '__main__':
    main()
