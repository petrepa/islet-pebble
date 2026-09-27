#!/usr/bin/env python3
"""
Regenerate the appstore artwork: app icons and the marketing banner.

    python3 store/make_assets.py

Needs Pillow. Uses the Montserrat font shipped in resources/. Screenshots are
not generated here; they are captured from the emery emulator into docs/.
"""

import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FONT = os.path.join(ROOT, "resources", "Montserrat-Bold.ttf")

DARK = (16, 20, 26)
DARK_LIGHT = (30, 38, 48)
WHITE = (255, 255, 255)
GREEN = (85, 255, 85)
GREY = (170, 180, 192)


def font(size):
    return ImageFont.truetype(FONT, size)


def draw_icon(size):
    """A glucose drop with a trend arrow, drawn at 4x and downsampled."""
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    u = s / 144.0  # design grid is 144 units

    def box(x0, y0, x1, y1):
        return [x0 * u, y0 * u, x1 * u, y1 * u]

    d.rounded_rectangle(box(0, 0, 144, 144), radius=32 * u, fill=DARK)
    # Drop: round bottom plus a pointed top.
    d.ellipse(box(36, 50, 108, 122), fill=GREEN)
    d.polygon([(72 * u, 16 * u), (38.5 * u, 74 * u), (105.5 * u, 74 * u)], fill=GREEN)
    # Trend arrow (rising slowly) inside the drop.
    w = 9 * u
    d.line([(55 * u, 104 * u), (87 * u, 72 * u)], fill=DARK, width=int(w))
    d.polygon([(91 * u, 68 * u), (91 * u, 92 * u), (67 * u, 68 * u)], fill=DARK)
    return img.resize((size, size), Image.LANCZOS)


def watch(screenshot_path):
    """A screenshot inside a simple Pebble Time 2-ish bezel."""
    shot = Image.open(screenshot_path).convert("RGB")
    pad = 12
    w, h = shot.size[0] + pad * 2, shot.size[1] + pad * 2
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=22, fill=(18, 18, 20))
    d.rounded_rectangle([3, 3, w - 4, h - 4], radius=19, outline=(60, 60, 66), width=2)
    img.paste(shot, (pad, pad))
    return img


def drop_shadow(canvas, im, xy, blur_offset=6):
    shadow = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [0, 0, im.size[0] - 1, im.size[1] - 1], radius=22, fill=(0, 0, 0, 110))
    canvas.alpha_composite(shadow, (xy[0] + blur_offset, xy[1] + blur_offset))
    canvas.alpha_composite(im, xy)


def banner():
    w, h = 720, 320
    img = Image.new("RGBA", (w, h), DARK + (255,))
    d = ImageDraw.Draw(img)
    # Soft diagonal band for depth.
    d.polygon([(420, 0), (720, 0), (720, 320), (300, 320)], fill=DARK_LIGHT)

    img.alpha_composite(draw_icon(72), (36, 44))

    d.text((36, 140), "Islet", font=font(56), fill=WHITE)
    d.text((38, 214), "Glucose and IOB,", font=font(19), fill=GREEN)
    d.text((38, 240), "straight from AndroidAPS.", font=font(19), fill=GREEN)
    d.text((38, 276), "Pebble Time 2 watchface", font=font(14), fill=GREY)

    docs = os.path.join(ROOT, "docs")
    back = watch(os.path.join(docs, "emery_screenshot_3.png"))
    front = watch(os.path.join(docs, "emery_screenshot_1.png"))
    drop_shadow(img, back, (478, 20))
    drop_shadow(img, front, (348, 48))
    return img.convert("RGB")


def main():
    for size in (80, 144):
        draw_icon(size).save(os.path.join(ROOT, "docs", "icon_{0}x{0}.png".format(size)))
    banner().save(os.path.join(HERE, "banner_720x320.png"))
    print("icons + banner written")


if __name__ == "__main__":
    main()
