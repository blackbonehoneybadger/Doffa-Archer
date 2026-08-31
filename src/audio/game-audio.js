const STORAGE_KEY = "doffa-heroes-audio-muted-v1";
const WAVEFORMS = Object.freeze(["sine", "triangle", "square", "sawtooth"]);
const DEFAULT_MAX_AUDIO_VOICES = 24;
const NOISE_BUCKET_SECONDS = 0.025;

const EVENT_COOLDOWNS = Object.freeze({
  uiTap: 35,
  beanTap: 45,
  footstep: 140,
  heroAttack: 55,
  enemyHit: 45,
  enemyAttack: 90,
  enemyTelegraph: 180,
  destructibleHit: 70,
  pickupXp: 80,
  playerHit: 180,
});

const FIXED_RECIPES = Object.freeze({
  uiTap: Object.freeze([{ wave: "sine", startHz: 430, endHz: 610, duration: 0.045, gain: 0.055 }]),
  beanTap: Object.freeze([{ wave: "triangle", startHz: 620, endHz: 940, duration: 0.075, gain: 0.08 }, { wave: "sine", startHz: 1260, endHz: 880, duration: 0.11, gain: 0.035, delay: 0.015 }]),
  footstep: Object.freeze([{ noise: true, duration: 0.035, gain: 0.018 }, { wave: "sine", startHz: 92, endHz: 58, duration: 0.055, gain: 0.018 }]),
  wager: Object.freeze([{ wave: "square", startHz: 180, endHz: 260, duration: 0.08, gain: 0.045 }, { wave: "sine", startHz: 520, endHz: 760, duration: 0.09, gain: 0.045, delay: 0.04 }]),
  select: Object.freeze([{ wave: "triangle", startHz: 310, endHz: 470, duration: 0.1, gain: 0.055 }]),
  startRun: Object.freeze([{ wave: "sawtooth", startHz: 72, endHz: 145, duration: 0.42, gain: 0.08 }, { wave: "triangle", startHz: 290, endHz: 580, duration: 0.32, gain: 0.055, delay: 0.11 }]),
  weaponSwitch: Object.freeze([{ wave: "square", startHz: 230, endHz: 460, duration: 0.075, gain: 0.05 }, { noise: true, duration: 0.045, gain: 0.026, delay: 0.03 }]),
  playerHit: Object.freeze([{ noise: true, duration: 0.12, gain: 0.1 }, { wave: "sawtooth", startHz: 155, endHz: 68, duration: 0.18, gain: 0.07 }]),
  playerDefeat: Object.freeze([{ wave: "sawtooth", startHz: 175, endHz: 38, duration: 0.82, gain: 0.105 }, { noise: true, duration: 0.32, gain: 0.07, delay: 0.08 }]),
  critical: Object.freeze([{ wave: "square", startHz: 380, endHz: 880, duration: 0.09, gain: 0.075 }, { noise: true, duration: 0.08, gain: 0.055 }]),
  enemyHit: Object.freeze([{ noise: true, duration: 0.065, gain: 0.05 }, { wave: "triangle", startHz: 130, endHz: 82, duration: 0.09, gain: 0.04 }]),
  enemyDefeat: Object.freeze([{ noise: true, duration: 0.16, gain: 0.075 }, { wave: "sawtooth", startHz: 125, endHz: 42, duration: 0.28, gain: 0.065 }]),
  bossPhase: Object.freeze([{ wave: "sawtooth", startHz: 48, endHz: 132, duration: 0.75, gain: 0.12 }, { wave: "square", startHz: 96, endHz: 54, duration: 0.62, gain: 0.055, delay: 0.1 }, { noise: true, duration: 0.42, gain: 0.065 }]),
  bossDefeat: Object.freeze([{ wave: "sawtooth", startHz: 92, endHz: 28, duration: 1.15, gain: 0.13 }, { noise: true, duration: 0.68, gain: 0.11 }, { wave: "sine", startHz: 440, endHz: 880, duration: 0.5, gain: 0.045, delay: 0.62 }]),
  destructibleHit: Object.freeze([{ noise: true, duration: 0.07, gain: 0.065 }, { wave: "square", startHz: 105, endHz: 72, duration: 0.08, gain: 0.04 }]),
  destructibleBreak: Object.freeze([{ noise: true, duration: 0.26, gain: 0.105 }, { wave: "square", startHz: 115, endHz: 38, duration: 0.24, gain: 0.07 }]),
  pickupXp: Object.freeze([{ wave: "sine", startHz: 620, endHz: 980, duration: 0.1, gain: 0.045 }]),
  pickupHeal: Object.freeze([{ wave: "sine", startHz: 390, endHz: 620, duration: 0.18, gain: 0.055 }, { wave: "sine", startHz: 580, endHz: 820, duration: 0.18, gain: 0.035, delay: 0.08 }]),
  levelUp: Object.freeze([{ wave: "triangle", startHz: 330, endHz: 660, duration: 0.2, gain: 0.07 }, { wave: "triangle", startHz: 495, endHz: 990, duration: 0.24, gain: 0.055, delay: 0.12 }]),
  choiceOpen: Object.freeze([{ wave: "sine", startHz: 260, endHz: 520, duration: 0.2, gain: 0.045 }]),
  choicePick: Object.freeze([{ wave: "triangle", startHz: 420, endHz: 840, duration: 0.2, gain: 0.06 }, { wave: "sine", startHz: 630, endHz: 1040, duration: 0.19, gain: 0.04, delay: 0.08 }]),
  roomEnter: Object.freeze([{ wave: "sawtooth", startHz: 78, endHz: 120, duration: 0.34, gain: 0.055 }]),
  waveStart: Object.freeze([{ wave: "square", startHz: 105, endHz: 190, duration: 0.17, gain: 0.055 }, { noise: true, duration: 0.08, gain: 0.035 }]),
  roomClear: Object.freeze([{ wave: "triangle", startHz: 260, endHz: 520, duration: 0.2, gain: 0.06 }, { wave: "triangle", startHz: 390, endHz: 780, duration: 0.25, gain: 0.045, delay: 0.14 }]),
  doorExit: Object.freeze([{ noise: true, duration: 0.18, gain: 0.04 }, { wave: "sine", startHz: 180, endHz: 360, duration: 0.28, gain: 0.045 }]),
  ricochet: Object.freeze([{ wave: "sine", startHz: 1380, endHz: 540, duration: 0.08, gain: 0.045 }, { noise: true, duration: 0.04, gain: 0.025 }]),
  victory: Object.freeze([{ wave: "triangle", startHz: 220, endHz: 440, duration: 0.28, gain: 0.075 }, { wave: "triangle", startHz: 330, endHz: 660, duration: 0.32, gain: 0.06, delay: 0.18 }, { wave: "sine", startHz: 440, endHz: 880, duration: 0.46, gain: 0.055, delay: 0.4 }]),
  defeat: Object.freeze([{ wave: "sawtooth", startHz: 145, endHz: 42, duration: 0.72, gain: 0.085 }]),
});

const WEAPON_RECIPES = Object.freeze({
  katana: Object.freeze([{ noise: true, duration: 0.09, gain: 0.065 }, { wave: "sawtooth", startHz: 820, endHz: 210, duration: 0.12, gain: 0.045 }]),
  shuriken: Object.freeze([{ noise: true, duration: 0.055, gain: 0.04 }, { wave: "sine", startHz: 1260, endHz: 720, duration: 0.08, gain: 0.035 }]),
  bat: Object.freeze([{ wave: "square", startHz: 120, endHz: 64, duration: 0.13, gain: 0.085 }, { noise: true, duration: 0.08, gain: 0.055 }]),
  "cigarette-butt": Object.freeze([{ noise: true, duration: 0.05, gain: 0.035 }, { wave: "sine", startHz: 560, endHz: 280, duration: 0.1, gain: 0.03 }]),
  hammer: Object.freeze([{ wave: "square", startHz: 92, endHz: 38, duration: 0.2, gain: 0.105 }, { noise: true, duration: 0.13, gain: 0.075 }]),
  "gold-pistol": Object.freeze([{ noise: true, duration: 0.07, gain: 0.085 }, { wave: "square", startHz: 250, endHz: 95, duration: 0.1, gain: 0.055 }]),
  dagger: Object.freeze([{ noise: true, duration: 0.065, gain: 0.055 }, { wave: "sawtooth", startHz: 980, endHz: 390, duration: 0.075, gain: 0.035 }]),
  bow: Object.freeze([{ wave: "triangle", startHz: 190, endHz: 780, duration: 0.09, gain: 0.045 }, { noise: true, duration: 0.045, gain: 0.035, delay: 0.04 }]),
  punch: Object.freeze([{ noise: true, duration: 0.095, gain: 0.08 }, { wave: "square", startHz: 105, endHz: 52, duration: 0.12, gain: 0.07 }]),
  "coffee-rifle": Object.freeze([{ noise: true, duration: 0.09, gain: 0.075 }, { wave: "sawtooth", startHz: 330, endHz: 110, duration: 0.13, gain: 0.055 }]),
});

function hashText(value) {
  let hash = 2_166_136_261;
  for (const character of String(value ?? "enemy")) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

export function getSoundRecipe(event, details = {}) {
  if (event === "heroAttack") return WEAPON_RECIPES[details.visual] ?? WEAPON_RECIPES.punch;
  if (event === "enemyTelegraph" || event === "enemyAttack") {
    const hash = hashText(`${details.enemyType}:${details.pattern}:${event}`);
    const bossScale = details.isBoss ? 0.56 : details.isElite ? 0.76 : 1;
    const base = (105 + (hash % 10_000) / 20) * bossScale;
    return Object.freeze([
      Object.freeze({
        wave: WAVEFORMS[hash % WAVEFORMS.length],
        startHz: event === "enemyTelegraph" ? base : base * 1.7,
        endHz: event === "enemyTelegraph" ? base * 1.9 : base * 0.62,
        duration: (event === "enemyTelegraph" ? 0.22 : 0.12) + ((hash >>> 12) % 31) / 1_000,
        gain: details.isBoss ? 0.095 : details.isElite ? 0.075 : 0.05,
      }),
      Object.freeze({ noise: true, duration: 0.07, gain: details.isBoss ? 0.055 : 0.03 }),
    ]);
  }
  return FIXED_RECIPES[event] ?? Object.freeze([]);
}

function createAudioContext() {
  const Context = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  return typeof Context === "function" ? new Context() : null;
}

export class GameAudio {
  constructor({
    contextFactory = createAudioContext,
    now = () => Date.now(),
    storage = globalThis.localStorage,
    voice = null,
    maxVoices = DEFAULT_MAX_AUDIO_VOICES,
  } = {}) {
    this.contextFactory = contextFactory;
    this.now = now;
    this.storage = storage;
    this.voice = voice;
    this.context = null;
    this.masterGain = null;
    this.noiseBuffers = new Map();
    this.activeVoices = 0;
    this.maxVoices = Math.max(4, Math.floor(maxVoices));
    this.lastPlayed = new Map();
    this.muted = this.loadMuted();
    this.voice?.setMuted?.(this.muted);
  }

  loadMuted() {
    try {
      return this.storage?.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    this.voice?.setMuted?.(this.muted);
    try {
      this.storage?.setItem(STORAGE_KEY, this.muted ? "1" : "0");
    } catch {
      // Audio must remain optional when storage is unavailable.
    }
    if (this.muted) this.context?.suspend?.()?.catch?.(() => {});
    else this.unlock();
    return this.muted;
  }

  toggleMuted() {
    return this.setMuted(!this.muted);
  }

  unlock() {
    if (this.muted) return false;
    try {
      this.context ??= this.contextFactory();
      if (this.context?.state === "suspended") {
        this.context.resume?.()?.catch?.(() => {});
      }
      if (this.context && !this.masterGain) {
        this.masterGain = this.context.createGain();
        this.masterGain.gain.setValueAtTime(0.82, this.context.currentTime);
        this.masterGain.connect(this.context.destination);
      }
      return Boolean(this.context);
    } catch {
      this.context = null;
      return false;
    }
  }

  playVoice(event, details = {}) {
    if (this.muted) return false;
    return Boolean(this.voice?.play?.(event, details));
  }

  play(event, details = {}) {
    if (this.muted) return false;
    const recipe = getSoundRecipe(event, details);
    if (recipe.length === 0) return false;
    if (!this.unlock()) return false;
    const now = this.now();
    const cooldown = EVENT_COOLDOWNS[event] ?? 0;
    if (now - (this.lastPlayed.get(event) ?? Number.NEGATIVE_INFINITY) < cooldown) return false;
    this.lastPlayed.set(event, now);
    try {
      for (let index = 0; index < recipe.length; index += 1) {
        this.playLayer(recipe[index], hashText(`${event}:${details.enemyType}:${index}`));
      }
    } catch {
      return false;
    }
    return true;
  }

  playLayer(layer, seed) {
    const context = this.context;
    if (!context || this.activeVoices >= this.maxVoices) return false;
    const start = context.currentTime + Math.max(0, layer.delay ?? 0);
    const duration = Math.max(0.02, layer.duration ?? 0.08);
    const gain = context.createGain();
    gain.gain.setValueAtTime(Math.max(0.0001, layer.gain ?? 0.04), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    gain.connect(this.masterGain ?? context.destination);

    this.activeVoices += 1;
    let released = false;
    const releaseVoice = (source) => {
      if (released) return;
      released = true;
      this.activeVoices = Math.max(0, this.activeVoices - 1);
      source?.disconnect?.();
      gain.disconnect?.();
    };

    if (layer.noise) {
      const bucket = Math.max(1, Math.ceil(duration / NOISE_BUCKET_SECONDS));
      let buffer = this.noiseBuffers.get(bucket);
      if (!buffer) {
        const bufferDuration = bucket * NOISE_BUCKET_SECONDS;
        const bufferLength = Math.max(1, Math.floor(context.sampleRate * bufferDuration));
        buffer = context.createBuffer(1, bufferLength, context.sampleRate);
        const data = buffer.getChannelData(0);
        let state = seed || 1;
        for (let index = 0; index < data.length; index += 1) {
          state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
          data[index] = (state / 0xffff_ffff) * 2 - 1;
        }
        this.noiseBuffers.set(bucket, buffer);
      }
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      source.onended = () => releaseVoice(source);
      source.start(start);
      source.stop(start + duration);
      return true;
    }

    const oscillator = context.createOscillator();
    oscillator.type = WAVEFORMS.includes(layer.wave) ? layer.wave : "sine";
    oscillator.frequency.setValueAtTime(Math.max(20, layer.startHz ?? 220), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, layer.endHz ?? layer.startHz ?? 220), start + duration);
    oscillator.connect(gain);
    oscillator.onended = () => releaseVoice(oscillator);
    oscillator.start(start);
    oscillator.stop(start + duration);
    return true;
  }
}
