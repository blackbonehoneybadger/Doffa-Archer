export const GAME_VERSION = "0.3.0";
export const DEFAULT_TOUR_ID = "hollow-roastery";
export const DEFAULT_HERO_ID = "honey-badger";
export const HERO_IDS = Object.freeze([
  "honey-badger",
  "hadida",
  "boya",
  "mr-kroo",
  "pata",
]);

export const VIEWPORT = Object.freeze({
  width: 720,
  height: 1280,
  arena: Object.freeze({
    left: 48,
    right: 672,
    top: 142,
    bottom: 1182,
  }),
});

export const RUN_CONFIG = Object.freeze({
  abilityChoices: 3,
  playerStartX: 360,
  playerStartY: 1050,
});
