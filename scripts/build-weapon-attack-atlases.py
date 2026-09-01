#!/usr/bin/env python3
"""Build melee attack variants and secondary-weapon atlases for every hero.

Full-motion sheets stay 4 columns wide. We grow them from 6 rows (idle/run/attack)
to 10 rows (idle/run/attack/attack2/attack3). Secondary sheets stay 4x2, matching
Honey Badger's dedicated shuriken release atlas.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parents[1]
HERO_DIR = ROOT / "assets" / "heroes"
UI_DIR = ROOT / "assets" / "ui"
CELL_W = 288
CELL_H = 336
COLS = 4


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def cell(sheet: Image.Image, col: int, row: int) -> Image.Image:
    return sheet.crop((col * CELL_W, row * CELL_H, (col + 1) * CELL_W, (row + 1) * CELL_H))


def paste_cell(sheet: Image.Image, col: int, row: int, frame: Image.Image) -> None:
    sheet.paste(frame, (col * CELL_W, row * CELL_H), frame)


def opaque_bbox(frame: Image.Image):
    return frame.getchannel("A").getbbox()


def shift_frame(frame: Image.Image, dx: int, dy: int) -> Image.Image:
    out = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    out.alpha_composite(frame, (dx, dy))
    return out


def rotate_frame(frame: Image.Image, degrees: float) -> Image.Image:
    bbox = opaque_bbox(frame)
    if not bbox:
        return frame.copy()
    cx = (bbox[0] + bbox[2]) / 2
    cy = (bbox[1] + bbox[3]) / 2
    return frame.rotate(degrees, resample=Image.Resampling.BICUBIC, center=(cx, cy))


def contrast_frame(frame: Image.Image, factor: float) -> Image.Image:
    rgb = frame.convert("RGB")
    boosted = ImageEnhance.Contrast(rgb).enhance(factor)
    out = boosted.convert("RGBA")
    out.putalpha(frame.getchannel("A"))
    return out


def overlay_weapon(
    frame: Image.Image,
    weapon: Image.Image,
    dx: int,
    dy: int,
    scale: float = 0.55,
) -> Image.Image:
    out = frame.copy()
    size = max(24, int(min(weapon.width, weapon.height) * scale))
    icon = weapon.resize((size, size), Image.Resampling.LANCZOS)
    x = max(0, min(frame.width - icon.width, dx))
    y = max(0, min(frame.height - icon.height, dy))
    out.alpha_composite(icon, (x, y))
    return out


def direction_offsets(direction_index: int) -> tuple[int, int]:
    vectors = [
        (18, 0),
        (14, 14),
        (0, 18),
        (-14, 14),
        (-18, 0),
        (-14, -14),
        (0, -18),
        (14, -14),
    ]
    return vectors[direction_index % 8]


def build_melee_variants(base: Image.Image) -> Image.Image:
    if base.width != COLS * CELL_W or base.height not in {6 * CELL_H, 10 * CELL_H}:
        raise SystemExit(f"Unexpected full-motion size: {base.size}")
    # Re-run safely against already-expanded sheets by reading only the first 6 rows.
    source = base.crop((0, 0, COLS * CELL_W, 6 * CELL_H))
    out = Image.new("RGBA", (COLS * CELL_W, 10 * CELL_H), (0, 0, 0, 0))
    out.paste(source, (0, 0), source)

    for direction_index in range(8):
        col = direction_index % 4
        src_row = 4 + direction_index // 4
        src = cell(source, col, src_row)
        dx, dy = direction_offsets(direction_index)

        attack2 = contrast_frame(shift_frame(rotate_frame(src, -11), -dx // 2, -dy // 2), 1.08)
        paste_cell(out, col, 6 + direction_index // 4, attack2)

        attack3 = contrast_frame(shift_frame(rotate_frame(src, 9), dx, dy), 1.12)
        paste_cell(out, col, 8 + direction_index // 4, attack3)

    return out


def extract_secondary_from_attack(base: Image.Image) -> Image.Image:
    source = base.crop((0, 0, COLS * CELL_W, 6 * CELL_H))
    out = Image.new("RGBA", (COLS * CELL_W, 2 * CELL_H), (0, 0, 0, 0))
    for direction_index in range(8):
        col = direction_index % 4
        src_row = 4 + direction_index // 4
        paste_cell(out, col, direction_index // 4, cell(source, col, src_row))
    return out


def synthesize_secondary(
    directions: Image.Image,
    weapon: Image.Image,
    *,
    hand_bias: tuple[int, int],
) -> Image.Image:
    out = Image.new("RGBA", (COLS * CELL_W, 2 * CELL_H), (0, 0, 0, 0))
    if directions.width < COLS * CELL_W or directions.height < 2 * CELL_H:
        portrait = ImageOps.contain(directions, (CELL_W - 24, CELL_H - 24))
        for direction_index in range(8):
            col = direction_index % 4
            row = direction_index // 4
            canvas = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
            canvas.alpha_composite(
                portrait,
                ((CELL_W - portrait.width) // 2, (CELL_H - portrait.height) // 2),
            )
            dx, dy = direction_offsets(direction_index)
            poised = shift_frame(canvas, dx // 3, dy // 3)
            hx = CELL_W // 2 + hand_bias[0] + dx // 2
            hy = CELL_H // 2 + hand_bias[1] + dy // 2
            paste_cell(out, col, row, overlay_weapon(poised, weapon, hx - 40, hy - 40, scale=0.62))
        return out

    for direction_index in range(8):
        col = direction_index % 4
        row = direction_index // 4
        frame = cell(directions, col, row)
        dx, dy = direction_offsets(direction_index)
        poised = shift_frame(frame, dx // 3, dy // 3)
        hx = CELL_W // 2 + hand_bias[0] + dx // 2
        hy = CELL_H // 2 + hand_bias[1] + dy // 2
        paste_cell(out, col, row, overlay_weapon(poised, weapon, hx - 40, hy - 40, scale=0.62))
    return out


def main() -> None:
    jobs = [
        {
            "id": "honey-badger",
            "full": HERO_DIR / "honey-badger-full-motion-v3.png",
            "secondary": HERO_DIR / "honey-badger-shuriken-attack-v1.png",
            "keep_secondary": True,
        },
        {
            "id": "hadida",
            "full": HERO_DIR / "hadida-full-motion-v3.png",
            "directions": HERO_DIR / "hadida-directions-v3.png",
            "secondary": HERO_DIR / "hadida-cigarette-attack-v1.png",
            "weapon": UI_DIR / "cigarette-butt-v1.png",
            "hand_bias": (22, -8),
        },
        {
            "id": "boya",
            "full": HERO_DIR / "boy-full-motion-v3.png",
            "directions": HERO_DIR / "boy-directions-v3.png",
            "secondary": HERO_DIR / "boy-gold-pistol-attack-v1.png",
            "weapon": UI_DIR / "gold-pistol-v1.png",
            "hand_bias": (26, 4),
        },
        {
            "id": "mr-kroo",
            "full": HERO_DIR / "mr-kroo-full-motion-v4.png",
            "secondary": HERO_DIR / "mr-kroo-bow-attack-v1.png",
            "extract_secondary_from_attack": True,
            "melee_weapon": UI_DIR / "circassian-dagger-v1.png",
            "hand_bias": (18, 0),
        },
        {
            "id": "pata",
            "full": HERO_DIR / "pata-full-motion-v2.png",
            "secondary": HERO_DIR / "pata-coffee-rifle-attack-v1.png",
            "extract_secondary_from_attack": True,
            "melee_weapon": UI_DIR / "punch-v1.png",
            "hand_bias": (20, 6),
        },
    ]

    for job in jobs:
        base = load_rgba(job["full"])
        expanded = build_melee_variants(base)

        if job.get("extract_secondary_from_attack"):
            secondary = extract_secondary_from_attack(base)
            secondary.save(job["secondary"])
            print(f"wrote {job['secondary'].relative_to(ROOT)} {secondary.size}")
            melee_weapon = load_rgba(job["melee_weapon"])
            for variant_row in (4, 6, 8):
                for direction_index in range(8):
                    col = direction_index % 4
                    row = variant_row + direction_index // 4
                    frame = cell(expanded, col, row)
                    dx, dy = direction_offsets(direction_index)
                    hx = CELL_W // 2 + job["hand_bias"][0] + dx // 2
                    hy = CELL_H // 2 + job["hand_bias"][1] + dy // 2
                    paste_cell(
                        expanded,
                        col,
                        row,
                        overlay_weapon(frame, melee_weapon, hx - 36, hy - 36, scale=0.5),
                    )
        elif not job.get("keep_secondary"):
            directions = load_rgba(job["directions"])
            weapon = load_rgba(job["weapon"])
            secondary = synthesize_secondary(directions, weapon, hand_bias=job["hand_bias"])
            secondary.save(job["secondary"])
            print(f"wrote {job['secondary'].relative_to(ROOT)} {secondary.size}")

        expanded.save(job["full"])
        print(f"updated {job['full'].relative_to(ROOT)} {expanded.size}")


if __name__ == "__main__":
    main()
