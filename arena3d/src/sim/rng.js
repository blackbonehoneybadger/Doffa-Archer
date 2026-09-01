export function hashSeed(value) {
  const text = String(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed) {
  let state = hashSeed(seed) || 1;
  const next = () => {
    state = Math.imul(state ^ (state >>> 15), 0x45d9f3b);
    state = Math.imul(state ^ (state >>> 15), 0x45d9f3b);
    state ^= state >>> 15;
    return (state >>> 0) / 4294967296;
  };
  return {
    next,
    float(min, max) {
      return min + (max - min) * next();
    },
    int(min, max) {
      return Math.floor(this.float(min, max + 1));
    },
    sign() {
      return next() < 0.5 ? -1 : 1;
    },
  };
}
