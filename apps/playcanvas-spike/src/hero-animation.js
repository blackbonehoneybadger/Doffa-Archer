export const HERO_ATLAS_COLUMNS = 4;
export const HERO_ATLAS_ROWS = 6;

export const HERO_DIRECTIONS = Object.freeze([
  "east",
  "south-east",
  "south",
  "south-west",
  "west",
  "north-west",
  "north",
  "north-east",
]);

const STATE_START_ROWS = Object.freeze({
  idle: 0,
  run: 2,
  attack: 4,
});

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

export function getHeroDirection(x, z, fallback = "south") {
  if (!Number.isFinite(x) || !Number.isFinite(z) || Math.hypot(x, z) < 0.001) {
    return HERO_DIRECTIONS.includes(fallback) ? fallback : "south";
  }
  const sector = Math.PI / 4;
  const index = positiveModulo(Math.round(Math.atan2(z, x) / sector), HERO_DIRECTIONS.length);
  return HERO_DIRECTIONS[index];
}

export function getHeroAtlasFrame({
  state = "idle",
  direction = "south",
  animationClock = 0,
} = {}) {
  const safeState = Object.hasOwn(STATE_START_ROWS, state) ? state : "idle";
  const directionIndex = Math.max(0, HERO_DIRECTIONS.indexOf(direction));
  let startRow = STATE_START_ROWS[safeState];

  // The approved legacy sheet has one planted and one stride pose per
  // direction. Alternating both authored poses makes the feet visibly work
  // instead of sliding a frozen body over the room.
  if (safeState === "run") {
    const safeClock = Number.isFinite(animationClock) ? Math.max(0, animationClock) : 0;
    const gaitPhase = Math.floor(safeClock * 9.2) % 4;
    if (gaitPhase === 0 || gaitPhase === 3) startRow = STATE_START_ROWS.idle;
  }

  const column = directionIndex % HERO_ATLAS_COLUMNS;
  const row = startRow + Math.floor(directionIndex / HERO_ATLAS_COLUMNS);
  return Object.freeze({
    state: safeState,
    direction: HERO_DIRECTIONS[directionIndex],
    column,
    row,
    index: row * HERO_ATLAS_COLUMNS + column,
  });
}

export function getHeroAtlasUv(frame = {}) {
  const column = Math.min(
    HERO_ATLAS_COLUMNS - 1,
    Math.max(0, Number.isInteger(frame.column) ? frame.column : 0),
  );
  const row = Math.min(
    HERO_ATLAS_ROWS - 1,
    Math.max(0, Number.isInteger(frame.row) ? frame.row : 0),
  );
  return Object.freeze({
    scaleX: 1 / HERO_ATLAS_COLUMNS,
    scaleY: 1 / HERO_ATLAS_ROWS,
    offsetX: column / HERO_ATLAS_COLUMNS,
    offsetY: 1 - (row + 1) / HERO_ATLAS_ROWS,
  });
}
