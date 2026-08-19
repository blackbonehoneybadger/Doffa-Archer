export class SeededRng {
  constructor(seed = Date.now()) {
    const normalized = Number(seed) >>> 0;
    this.state = normalized || 0x9e3779b9;
  }

  next() {
    let value = this.state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0;
    return this.state / 0x100000000;
  }

  int(min, max) {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError("int requires integer bounds with max >= min");
    }

    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new RangeError("pick requires a non-empty array");
    }

    return items[this.int(0, items.length - 1)];
  }

  shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const other = this.int(0, index);
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  }
}
