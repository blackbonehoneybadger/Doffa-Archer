export function attachJoystick(root, onChange) {
  const stick = root.querySelector("#move-stick");
  const knob = root.querySelector("#move-knob");
  const pointer = { active: false, id: null, x: 0, z: 0 };

  const emit = () => onChange({ moveX: pointer.x, moveZ: pointer.z });

  const setFromEvent = (event) => {
    const rect = stick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = event.clientX - cx;
    let dy = event.clientY - cy;
    const max = rect.width * 0.36;
    const length = Math.hypot(dx, dy) || 1;
    if (length > max) {
      dx = (dx / length) * max;
      dy = (dy / length) * max;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    pointer.x = dx / max;
    pointer.z = dy / max;
    emit();
  };

  const end = (event) => {
    if (pointer.id !== null && event.pointerId !== pointer.id) {
      return;
    }
    pointer.active = false;
    pointer.id = null;
    pointer.x = 0;
    pointer.z = 0;
    knob.style.transform = "translate(0px, 0px)";
    emit();
  };

  stick.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    stick.setPointerCapture(event.pointerId);
    pointer.active = true;
    pointer.id = event.pointerId;
    setFromEvent(event);
  });
  stick.addEventListener("pointermove", (event) => {
    if (!pointer.active || event.pointerId !== pointer.id) {
      return;
    }
    setFromEvent(event);
  });
  stick.addEventListener("pointerup", end);
  stick.addEventListener("pointercancel", end);

  const keys = new Set();
  const syncKeys = () => {
    let x = 0;
    let z = 0;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
    if (keys.has("KeyW") || keys.has("ArrowUp")) z -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) z += 1;
    if (!pointer.active) {
      pointer.x = x;
      pointer.z = z;
      emit();
    }
  };
  window.addEventListener("keydown", (event) => {
    keys.add(event.code);
    if (event.code === "Space" || event.code === "KeyJ") {
      event.preventDefault();
      onChange({ attack: true });
    }
    syncKeys();
  });
  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
    syncKeys();
  });

  return pointer;
}
