function style(shape, primary, secondary, trail, variant) {
  return Object.freeze({ shape, primary, secondary, trail, variant });
}

// Every authored enemy owns a stable projectile language. Shape, palette,
// trail, and variant together form the attack signature captured per shot.
export const ENEMY_PROJECTILE_PROFILES = Object.freeze({
  ash_hound: style("fang", "#ff5c30", "#ffd087", 8, "bite-spark"),
  ember_oracle: style("ember", "#ff7a25", "#fff0a2", 24, "oracle-flame"),
  brass_colossus: style("slug", "#c9913d", "#fff0bd", 13, "brass-shell"),
  smoke_revenant: style("wisp", "#8d74c9", "#ded5ff", 31, "smoke-ghost"),
  kiln_warden: style("hammer", "#d86231", "#ffd073", 17, "kiln-anvil"),
  pressure_widow: style("needle", "#e9c76d", "#fff8ce", 36, "steam-spike"),
  cinder_bishop: style("cross", "#ff3f58", "#ffc2a4", 21, "cinder-cross"),
  grinder_saint: style("saw", "#d7b46b", "#fff2bf", 15, "grinder-disc"),
  hollow_roaster: style("gear", "#ff8c32", "#ffe2a3", 28, "pressure-gear"),
  razor_mantis: style("crescent", "#65d2b0", "#c4ffe9", 27, "mantis-scythe"),
  seed_spitter: style("seed", "#a9cf4d", "#efffa8", 16, "split-seed"),
  root_stalker: style("thorn", "#667f32", "#d7f078", 32, "root-spear"),
  spore_moth: style("spore", "#c98cff", "#f3d9ff", 11, "spore-orb"),
  briar_jaguar: style("claw", "#d84b54", "#ffb0a6", 25, "briar-rake"),
  mire_bellower: style("drop", "#47a7a0", "#c6fff2", 19, "mire-glob"),
  orchid_maw: style("petal", "#ff72bd", "#ffe0f3", 14, "orchid-petal"),
  strangler_ape: style("knot", "#9e713e", "#f0d69a", 22, "vine-knot"),
  rootfall_tyrant: style("crown", "#7e38b8", "#e2b7ff", 34, "black-sap-crown"),
  forge_spider: style("ember", "#ff6a1a", "#ffe8a8", 23, "forge-web-ember"),
  slag_hound: style("fang", "#e84a20", "#ffc878", 9, "slag-bite"),
  furnace_wisp: style("wisp", "#b86a2e", "#ffe4b5", 30, "furnace-wisp"),
  forge_sentinel: style("hammer", "#c95a28", "#ffd080", 18, "forge-anvil"),
  boiler_tyrant: style("needle", "#ddb45a", "#fff6c8", 37, "boiler-spike"),
  slag_colossus: style("cross", "#f03a50", "#ffb8a0", 22, "slag-cross"),
  furnace_overlord: style("saw", "#c9a45c", "#fff0b8", 16, "furnace-disc"),
  forge_core_tyrant: style("gear", "#ff7a28", "#ffe8a0", 29, "forge-core-gear"),
  crystal_golem: style("slug", "#8b6fd4", "#e8d8ff", 14, "crystal-shell"),
  crystal_shardling: style("seed", "#7ec96a", "#e8ffb0", 17, "shard-seed"),
  prism_moth: style("spore", "#b878ff", "#f0e0ff", 12, "prism-spore"),
  geode_warden: style("claw", "#c44a58", "#ffc0b0", 26, "geode-rake"),
  amethyst_hunter: style("drop", "#5a9ea8", "#c8fff4", 20, "amethyst-glob"),
  shard_colossus: style("petal", "#ff68b8", "#ffe0f0", 15, "shard-petal"),
  prism_ape: style("knot", "#8e6840", "#f0d090", 23, "prism-knot"),
  crystal_sovereign: style("crown", "#6e30b0", "#dcc0ff", 35, "crystal-crown"),
  reef_maw: style("crescent", "#58c8a8", "#b8ffe8", 28, "reef-scythe"),
  tide_urchin: style("seed", "#6ab85a", "#d8ffa0", 18, "tide-seed"),
  kelp_stalker: style("thorn", "#5a7840", "#c8e870", 33, "kelp-spear"),
  coral_guardian: style("claw", "#d04850", "#ffb0a8", 27, "coral-rake"),
  leviathan_brood: style("drop", "#4098a0", "#b8fff0", 21, "brood-glob"),
  abyssal_maw: style("petal", "#ff60b0", "#ffe0f8", 16, "abyssal-petal"),
  drowned_colossus: style("knot", "#906840", "#ecd090", 24, "drowned-knot"),
  sunken_leviathan: style("crown", "#6830a8", "#d8b8ff", 36, "leviathan-crown"),
  cinder_hound: style("fang", "#ff5028", "#ffc070", 10, "cinder-bite"),
  lava_golem: style("slug", "#b87830", "#ffe8b0", 15, "lava-shell"),
  ember_wraith: style("ember", "#ff6820", "#ffe8a0", 25, "ember-wraith-flame"),
  cinder_warden: style("hammer", "#d05828", "#ffc878", 19, "cinder-anvil"),
  magma_hunter: style("needle", "#d0b050", "#fff4c0", 38, "magma-spike"),
  basalt_colossus: style("cross", "#f03848", "#ffb0a0", 23, "basalt-cross"),
  pyre_saint: style("saw", "#c8a050", "#fff0b0", 17, "pyre-disc"),
  ashen_titan: style("gear", "#ff7420", "#ffe090", 30, "ashen-titan-gear"),
});

const FALLBACK_STYLE = style("shard", "#d84b54", "#ffb0a6", 20, "unknown-enemy");

export function getEnemyProjectileStyle(enemy) {
  const identity = enemy?.behavior ?? enemy?.type ?? enemy?.id;
  return ENEMY_PROJECTILE_PROFILES[identity] ?? FALLBACK_STYLE;
}
