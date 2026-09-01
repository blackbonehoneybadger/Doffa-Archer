/**
 * Touch joystick (left) + explicit attack button (right).
 * Stop-to-auto-attack is [TBD] and intentionally not implemented.
 */

export function createControls({ stickEl, knobEl, attackBtn, canvas }) {
  const input = { x: 0, z: 0, attackPressed: false, attackQueued: false };
  let stickId = null;
  let origin = null;

  function setKnob(dx, dy) {
    const max = 34;
    const len = Math.hypot(dx, dy);
    const scale = len > max ? max / len : 1;
    const nx = dx * scale;
    const ny = dy * scale;
    knobEl.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
    input.x = nx / max;
    input.z = -ny / max;
  }

  function resetStick() {
    stickId = null;
    origin = null;
    input.x = 0;
    input.z = 0;
    knobEl.style.transform = "translate(-50%, -50%)";
  }

  stickEl.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    stickEl.setPointerCapture(event.pointerId);
    stickId = event.pointerId;
    const rect = stickEl.getBoundingClientRect();
    origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    setKnob(event.clientX - origin.x, event.clientY - origin.y);
  });

  stickEl.addEventListener("pointermove", (event) => {
    if (event.pointerId !== stickId || !origin) return;
    setKnob(event.clientX - origin.x, event.clientY - origin.y);
  });

  const endStick = (event) => {
    if (event.pointerId !== stickId) return;
    resetStick();
  };
  stickEl.addEventListener("pointerup", endStick);
  stickEl.addEventListener("pointercancel", endStick);

  const pressAttack = (event) => {
    event.preventDefault();
    input.attackPressed = true;
    input.attackQueued = true;
  };
  const releaseAttack = () => {
    input.attackPressed = false;
  };
  attackBtn.addEventListener("pointerdown", pressAttack);
  attackBtn.addEventListener("pointerup", releaseAttack);
  attackBtn.addEventListener("pointercancel", releaseAttack);
  attackBtn.addEventListener("pointerleave", releaseAttack);

  // Keyboard assist for desktop proof / orbit demos.
  const keys = new Set();
  window.addEventListener("keydown", (event) => {
    keys.add(event.code);
    if (event.code === "Space" || event.code === "KeyJ") {
      input.attackQueued = true;
    }
  });
  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
  });

  function sample() {
    let x = input.x;
    let z = input.z;
    if (keys.has("KeyW") || keys.has("ArrowUp")) z += 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) z -= 1;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
    const attack = input.attackQueued;
    input.attackQueued = false;
    return { x, z, attack, attackHeld: input.attackPressed };
  }

  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  return { sample, resetStick };
}
