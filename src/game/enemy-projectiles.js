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
});

const FALLBACK_STYLE = style("shard", "#d84b54", "#ffb0a6", 20, "unknown-enemy");

export function getEnemyProjectileStyle(enemy) {
  const identity = enemy?.behavior ?? enemy?.type ?? enemy?.id;
  return ENEMY_PROJECTILE_PROFILES[identity] ?? FALLBACK_STYLE;
}
