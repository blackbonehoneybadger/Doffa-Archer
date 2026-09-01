import {
  AdvancedDynamicTexture,
  Control,
  Rectangle,
  TextBlock,
} from "@babylonjs/gui";

/**
 * Archero-feel world HUD: floating HP bars + floating damage numbers.
 * Linked to real 3D meshes — not 2D fake depth.
 */
export function createWorldHud(scene) {
  const ui = AdvancedDynamicTexture.CreateFullscreenUI("archeroWorldHud", true, scene);
  const bars = new Map();
  const floaters = [];

  function ensureBar(id, mesh, opts = {}) {
    if (bars.has(id)) return bars.get(id);
    const wrap = new Rectangle(`hpWrap_${id}`);
    wrap.width = "64px";
    wrap.height = "10px";
    wrap.cornerRadius = 4;
    wrap.thickness = 1;
    wrap.color = "rgba(0,0,0,0.65)";
    wrap.background = "rgba(0,0,0,0.45)";
    wrap.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    wrap.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    ui.addControl(wrap);
    wrap.linkWithMesh(mesh);
    wrap.linkOffsetY = opts.linkOffsetY ?? -70;

    const fill = new Rectangle(`hpFill_${id}`);
    fill.height = "100%";
    fill.width = 1;
    fill.thickness = 0;
    fill.background = opts.friendly ? "#3adf6a" : "#ff7a2f";
    fill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    wrap.addControl(fill);

    const label = new TextBlock(`hpLabel_${id}`);
    label.text = "";
    label.color = "#fff7e8";
    label.fontSize = 10;
    label.fontWeight = "700";
    label.top = "-14px";
    label.outlineWidth = 2;
    label.outlineColor = "#000";
    wrap.addControl(label);

    const entry = { wrap, fill, label, friendly: Boolean(opts.friendly) };
    bars.set(id, entry);
    return entry;
  }

  function setBar(id, mesh, hp, maxHp, opts = {}) {
    const entry = ensureBar(id, mesh, opts);
    const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
    entry.fill.width = `${ratio * 100}%`;
    entry.fill.background = opts.friendly ? "#3adf6a" : (ratio < 0.35 ? "#ff3b3b" : "#ff7a2f");
    if (opts.showValue) {
      entry.label.text = String(Math.max(0, Math.round(hp)));
    } else {
      entry.label.text = "";
    }
    entry.wrap.isVisible = hp > 0;
  }

  function hideBar(id) {
    const entry = bars.get(id);
    if (entry) entry.wrap.isVisible = false;
  }

  function spawnDamageNumber(mesh, amount, opts = {}) {
    const text = new TextBlock(`dmg_${Date.now()}_${Math.random()}`);
    text.text = opts.heal ? `+${Math.round(amount)}` : `-${Math.round(amount)}`;
    text.color = opts.heal ? "#7dff9a" : "#ffe14a";
    text.fontSize = opts.crit ? 28 : 22;
    text.fontWeight = "900";
    text.outlineWidth = 3;
    text.outlineColor = "#1a0c00";
    text.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    text.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    ui.addControl(text);
    text.linkWithMesh(mesh);
    text.linkOffsetY = opts.linkOffsetY ?? -95;
    floaters.push({
      control: text,
      life: 0.7,
      age: 0,
      baseY: opts.linkOffsetY ?? -95,
      drift: opts.crit ? -48 : -36,
    });
  }

  function update(dt) {
    for (let i = floaters.length - 1; i >= 0; i -= 1) {
      const f = floaters[i];
      f.age += dt;
      const u = Math.min(1, f.age / f.life);
      f.control.linkOffsetY = f.baseY + f.drift * u;
      f.control.alpha = Math.max(0, 1 - u);
      if (f.age >= f.life) {
        ui.removeControl(f.control);
        f.control.dispose();
        floaters.splice(i, 1);
      }
    }
  }

  function dispose() {
    for (const f of floaters) {
      ui.removeControl(f.control);
      f.control.dispose();
    }
    floaters.length = 0;
    for (const entry of bars.values()) {
      ui.removeControl(entry.wrap);
      entry.wrap.dispose();
    }
    bars.clear();
    ui.dispose();
  }

  return { setBar, hideBar, spawnDamageNumber, update, dispose };
}
