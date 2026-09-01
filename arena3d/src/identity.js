/** Locked public names and Honey Badger identity for the true-3D slice. */

export const GAME_NAME = "DOFA ARENA";
export const SITE = "dofa.coffee";
export const ANTAGONIST = "KAPRIZORD";
export const TOKEN_NAME_LATER = "$DOFA";

export const TOUR = Object.freeze({
  id: "rootfall-jungle",
  code: "TOUR 02",
  name: "ROOTFALL JUNGLE",
  room: 8,
  roomTotal: 50,
  seed: "rootfall-08-v1",
});

export const HERO_IDENTITY = Object.freeze({
  id: "honey-badger",
  name: "HONEY BADGER",
  weaponPrimary: "KATANA",
  weaponSecondary: "SHURIKEN",
  weaponSheet: "black-steel-katana-shuriken-v1",
  heightMeters: 1.7,
  bald: true,
  beard: "long-black-boy-length",
  torso: "tattooed",
  chestMark: "honey-badger",
  backText: "STRONG ROOTS",
  backTextMirror: false,
  pants: "dark",
  shoes: "sneakers",
  head: Object.freeze({
    kind: "placeholder",
    reason: "true-to-owner face scan is not in this repository",
    label: "PLACEHOLDER HEAD",
  }),
});

export const FORBIDDEN_NEW_UI = Object.freeze([
  "TAP BEAN",
  "DOFFA Heroes",
  "Caprizord",
  "KAPRizard",
]);

export const SLICE_LOOT_POLICY = Object.freeze({
  claimable: false,
  wallet: false,
  mint: false,
  token: false,
  note: "Local prototype loot stays non-claimable. Token later.",
});

const BACK_GLYPHS = Object.freeze({
  A: ["01110", "10001", "11111", "10001", "10001"],
  E: ["11111", "10000", "11110", "10000", "11111"],
  G: ["01111", "10000", "10111", "10001", "01110"],
  N: ["10001", "11001", "10101", "10011", "10001"],
  O: ["01110", "10001", "10001", "10001", "01110"],
  R: ["11110", "10001", "11110", "10100", "10010"],
  S: ["01111", "10000", "01110", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100"],
  " ": ["000", "000", "000", "000", "000"],
});

export function assertBackTextUnlocked(text = HERO_IDENTITY.backText) {
  if (text !== "STRONG ROOTS") {
    throw new Error("Honey Badger back text is locked to STRONG ROOTS");
  }
  return text;
}

export function paintGlyphRow(text, { scale = 4, pad = 3, invert = false } = {}) {
  const locked = invert ? [...assertBackTextUnlocked(text)].reverse().join("") : assertBackTextUnlocked(text);
  const rows = 5;
  const glyphWidth = [...locked].reduce((width, character) => {
    const glyph = BACK_GLYPHS[character];
    if (!glyph) {
      throw new Error(`Unsupported back-text glyph: ${character}`);
    }
    return width + glyph[0].length + 1;
  }, -1);
  const width = (glyphWidth + pad * 2) * scale;
  const height = (rows + pad * 2) * scale;
  const data = new Uint8ClampedArray(width * height * 4);
  let cursor = pad;
  for (const character of locked) {
    const glyph = BACK_GLYPHS[character];
    for (let gy = 0; gy < rows; gy += 1) {
      for (let gx = 0; gx < glyph[0].length; gx += 1) {
        if (glyph[gy][gx] !== "1") {
          continue;
        }
        for (let sy = 0; sy < scale; sy += 1) {
          for (let sx = 0; sx < scale; sx += 1) {
            const x = (cursor + gx) * scale + sx;
            const y = (pad + gy) * scale + sy;
            const index = (y * width + x) * 4;
            data[index] = 236;
            data[index + 1] = 214;
            data[index + 2] = 168;
            data[index + 3] = 255;
          }
        }
      }
    }
    cursor += glyph[0].length + 1;
  }
  return { width, height, data, text: locked, mirrored: invert };
}

export function buffersShareOpaquePixels(left, right) {
  if (left.width !== right.width || left.height !== right.height) {
    return false;
  }
  for (let index = 3; index < left.data.length; index += 4) {
    if (left.data[index] > 0 && right.data[index] > 0) {
      return true;
    }
  }
  return false;
}
