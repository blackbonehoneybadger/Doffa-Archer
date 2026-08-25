function stableSeed(roomNumber, sectorIndex, waveCount) {
  return (
    Math.max(1, Math.floor(roomNumber)) * 73
    + Math.max(0, Math.floor(sectorIndex)) * 151
    + Math.max(1, Math.floor(waveCount)) * 199
  ) >>> 0;
}

export function getEncounterSignature(waves) {
  return waves.map((wave) => wave.join(">")).join("|");
}

function decodeCandidate(roster, waveCounts, candidateNumber) {
  let code = candidateNumber;
  return waveCounts.map((count) => Array.from({ length: count }, () => {
    const enemy = roster[code % roster.length];
    code = Math.floor(code / roster.length);
    return enemy;
  }));
}

// Selects a deterministic ordered formation that has not appeared earlier in
// the same tour. Increasing the formation size is a last resort, so early
// rooms stay light while still gaining an identity of their own.
export function createUniqueEncounterWaves({
  pool,
  roomNumber,
  sectorIndex,
  waveCount,
  usedSignatures,
}) {
  const roster = [...new Set(pool)];
  if (roster.length === 0) {
    throw new RangeError("Encounter roster cannot be empty");
  }
  if (!(usedSignatures instanceof Set)) {
    throw new TypeError("Encounter generation requires a signature registry");
  }

  const normalizedWaveCount = Math.max(1, Math.floor(waveCount));
  const baseCount = Math.min(5, 2 + Math.floor(Math.max(0, sectorIndex) / 2));
  const seed = stableSeed(roomNumber, sectorIndex, normalizedWaveCount);

  for (let countBoost = 0; countBoost <= 3; countBoost += 1) {
    const waveCounts = Array.from(
      { length: normalizedWaveCount },
      (_, waveIndex) => Math.min(6, baseCount + countBoost + (waveIndex > 0 ? 1 : 0)),
    );
    const slotCount = waveCounts.reduce((total, count) => total + count, 0);
    const combinationCount = Math.min(65_536, roster.length ** slotCount);
    const start = combinationCount > 0 ? seed % combinationCount : 0;

    for (let offset = 0; offset < combinationCount; offset += 1) {
      const candidateNumber = (start + offset) % combinationCount;
      const waves = decodeCandidate(roster, waveCounts, candidateNumber);
      const authoredTypes = new Set(waves.flat());
      if (roster.length > 1 && authoredTypes.size < 2) {
        continue;
      }
      const signature = getEncounterSignature(waves);
      if (!usedSignatures.has(signature)) {
        usedSignatures.add(signature);
        return waves;
      }
    }
  }

  throw new RangeError(`Unable to author a unique encounter for room ${roomNumber}`);
}
