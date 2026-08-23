const TAU = Math.PI * 2;

export const ROOM_EFFECT_ENVIRONMENTS = Object.freeze([
  "ash",
  "ember",
  "brass",
  "smoke",
  "pressure",
  "heart",
  "canopy",
  "mire",
  "mycelium",
  "briar",
  "rootdeep",
  "rootheart",
]);

export const ROOM_EFFECT_PROFILES = Object.freeze({
  ash: Object.freeze({
    kind: "fall",
    color: "#d0a06c",
    moteCount: 14,
    pulseSpeed: 0.72,
    travelSpeed: 0.085,
    baseStrength: 0.72,
  }),
  ember: Object.freeze({
    kind: "rise-edge",
    color: "#ff8a42",
    moteCount: 12,
    pulseSpeed: 1.18,
    travelSpeed: 0.16,
    baseStrength: 0.92,
  }),
  brass: Object.freeze({
    kind: "fall",
    color: "#d8b46a",
    moteCount: 7,
    pulseSpeed: 0.58,
    travelSpeed: 0.055,
    baseStrength: 0.64,
  }),
  smoke: Object.freeze({
    kind: "rise-edge",
    color: "#a58b99",
    moteCount: 10,
    pulseSpeed: 0.48,
    travelSpeed: 0.07,
    baseStrength: 0.76,
  }),
  pressure: Object.freeze({
    kind: "rise-edge",
    color: "#e8d7b7",
    moteCount: 8,
    pulseSpeed: 1.42,
    travelSpeed: 0.12,
    baseStrength: 0.86,
  }),
  heart: Object.freeze({
    kind: "rise-center",
    color: "#ff7040",
    moteCount: 14,
    pulseSpeed: 1.05,
    travelSpeed: 0.13,
    baseStrength: 1,
  }),
  canopy: Object.freeze({
    kind: "fall",
    color: "#8dcc72",
    moteCount: 15,
    pulseSpeed: 0.62,
    travelSpeed: 0.072,
    baseStrength: 0.82,
  }),
  mire: Object.freeze({
    kind: "rise-edge",
    color: "#83b85f",
    moteCount: 10,
    pulseSpeed: 0.54,
    travelSpeed: 0.058,
    baseStrength: 0.74,
  }),
  mycelium: Object.freeze({
    kind: "rise-center",
    color: "#8ad9db",
    moteCount: 18,
    pulseSpeed: 0.86,
    travelSpeed: 0.095,
    baseStrength: 0.94,
  }),
  briar: Object.freeze({
    kind: "fall",
    color: "#d76a78",
    moteCount: 9,
    pulseSpeed: 0.7,
    travelSpeed: 0.068,
    baseStrength: 0.8,
  }),
  rootdeep: Object.freeze({
    kind: "rise-edge",
    color: "#d29049",
    moteCount: 12,
    pulseSpeed: 0.76,
    travelSpeed: 0.064,
    baseStrength: 0.88,
  }),
  rootheart: Object.freeze({
    kind: "rise-center",
    color: "#ef9a3e",
    moteCount: 16,
    pulseSpeed: 1.16,
    travelSpeed: 0.12,
    baseStrength: 1.08,
  }),
});

function finiteTime(value) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function fract(value) {
  return value - Math.floor(value);
}

function mix(value) {
  let mixed = value >>> 0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x7feb352d);
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x846ca68b);
  mixed ^= mixed >>> 16;
  return mixed >>> 0;
}

function unit(seed, index, salt) {
  const value = mix(seed ^ Math.imul(index + 1, 0x9e3779b1) ^ salt);
  return value / 0x1_0000_0000;
}

export function hashRoomVisualIdentity(roomId = "", roomNumber = 0) {
  const identity = `${String(roomId)}:${Number.isInteger(roomNumber) ? roomNumber : 0}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < identity.length; index += 1) {
    hash ^= identity.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function getRoomEffectProfile(environment) {
  return ROOM_EFFECT_PROFILES[environment] ?? ROOM_EFFECT_PROFILES.ash;
}

export function getRoomEffectState({
  environment = "ash",
  roomId = "",
  roomNumber = 0,
  clock = 0,
} = {}) {
  const profile = getRoomEffectProfile(environment);
  const seed = hashRoomVisualIdentity(roomId || environment, roomNumber);
  const phase = unit(seed, 0, 0x51ed270b) * TAU;
  const time = finiteTime(clock);
  const pulse = 0.5 + Math.sin(time * profile.pulseSpeed + phase) * 0.5;
  const strength = profile.baseStrength * (0.86 + unit(seed, 1, 0x68bc21eb) * 0.22);

  return Object.freeze({
    environment: ROOM_EFFECT_PROFILES[environment] ? environment : "ash",
    seed,
    variant: mix(seed ^ 0xa24baed4) % 4,
    direction: (mix(seed ^ 0x9fb21c65) & 1) === 0 ? -1 : 1,
    phase,
    time,
    pulse,
    strength,
  });
}

export function getRoomAmbientMote(state, index) {
  if (!state || !Number.isInteger(index) || index < 0) {
    return null;
  }
  const environment = ROOM_EFFECT_PROFILES[state.environment] ? state.environment : "ash";
  const profile = getRoomEffectProfile(environment);
  if (index >= profile.moteCount) {
    return null;
  }

  const seed = Number.isInteger(state.seed)
    ? state.seed >>> 0
    : hashRoomVisualIdentity(environment, 0);
  const time = finiteTime(state.time);
  const phase = Number.isFinite(state.phase) ? state.phase : 0;
  const direction = state.direction === -1 ? -1 : 1;
  const strength = Number.isFinite(state.strength)
    ? Math.max(0, Math.min(1.25, state.strength))
    : profile.baseStrength;

  const speed = profile.travelSpeed * (0.78 + unit(seed, index, 0x02e5be93) * 0.46);
  const progress = fract(time * speed + unit(seed, index, 0x967a889b));
  const horizontalSeed = unit(seed, index, 0x4b1d5a77);
  const drift = Math.sin(
    time * (0.45 + horizontalSeed * 0.9)
      + phase
      + index * 1.73,
  ) * (0.012 + unit(seed, index, 0xc2b2ae35) * 0.026);

  let x;
  if (profile.kind === "rise-edge") {
    const leftSide = horizontalSeed < 0.5;
    const edgeOffset = 0.035 + unit(seed, index, 0x27d4eb2f) * 0.12;
    x = leftSide ? edgeOffset + drift : 1 - edgeOffset + drift;
  } else if (profile.kind === "rise-center") {
    x = 0.22 + horizontalSeed * 0.56 + drift;
  } else {
    x = 0.06 + horizontalSeed * 0.88 + drift;
  }

  const rising = profile.kind === "rise-edge" || profile.kind === "rise-center";
  const y = rising ? 1.04 - progress * 1.08 : -0.04 + progress * 1.08;
  const lifeEnvelope = Math.sin(progress * Math.PI);
  const size = 1.2 + unit(seed, index, 0x165667b1) * (
    environment === "smoke" ? 8.4 : environment === "pressure" ? 4.8 : 2.8
  );

  return Object.freeze({
    x: Math.min(0.98, Math.max(0.02, x)),
    y: Math.min(1.02, Math.max(-0.02, y)),
    size,
    alpha: (0.12 + lifeEnvelope * 0.44) * strength,
    rotation: unit(seed, index, 0x85ebca6b) * TAU + time * 0.16 * direction,
    color: profile.color,
  });
}

export function validateRoomEffectProfiles(profiles = ROOM_EFFECT_PROFILES) {
  const errors = [];
  const supportedKinds = new Set(["fall", "rise-edge", "rise-center"]);

  for (const environment of ROOM_EFFECT_ENVIRONMENTS) {
    const profile = profiles?.[environment];
    if (!profile) {
      errors.push(`Missing room effect profile for ${environment}`);
      continue;
    }
    if (!supportedKinds.has(profile.kind)) {
      errors.push(`Unsupported room effect kind for ${environment}`);
    }
    if (!/^#[0-9a-f]{6}$/i.test(profile.color ?? "")) {
      errors.push(`Invalid room effect color for ${environment}`);
    }
    if (!Number.isInteger(profile.moteCount) || profile.moteCount < 0 || profile.moteCount > 24) {
      errors.push(`Invalid room effect mote count for ${environment}`);
    }
    for (const field of ["pulseSpeed", "travelSpeed", "baseStrength"]) {
      if (!Number.isFinite(profile[field]) || profile[field] <= 0 || profile[field] > 3) {
        errors.push(`Invalid ${field} for ${environment}`);
      }
    }
  }

  return errors;
}
