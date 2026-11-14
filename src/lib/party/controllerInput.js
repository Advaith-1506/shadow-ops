export const neutralInput = () => ({
  up: false,
  down: false,
  left: false,
  right: false,
  interact: false,
  ability: false,
});
export function joystickDirection(dx, dy, radius = 60) {
  const length = Math.hypot(dx, dy),
    scale = length > radius ? radius / length : 1;
  const x = dx * scale,
    y = dy * scale;
  if (length < radius * 0.18) return { x: 0, y: 0, ...neutralInput() };
  return {
    x,
    y,
    up: y < -radius * 0.22,
    down: y > radius * 0.22,
    left: x < -radius * 0.22,
    right: x > radius * 0.22,
  };
}
// One independent pointer per control. Cancelling a joystick cannot release a held ability.
export function createControllerInput(onChange) {
  const pointers = new Map();
  let input = neutralInput();
  const emit = () => onChange({ ...input });
  return {
    start(id, control) {
      if ([...pointers.values()].includes(control)) return false;
      pointers.set(id, control);
      if (control !== "move") input[control] = true;
      emit();
      return true;
    },
    move(id, dx, dy, radius) {
      if (pointers.get(id) !== "move") return;
      const d = joystickDirection(dx, dy, radius);
      for (const k of ["up", "down", "left", "right"]) input[k] = !!d[k];
      emit();
      return d;
    },
    end(id) {
      const control = pointers.get(id);
      pointers.delete(id);
      if (control === "move")
        for (const k of ["up", "down", "left", "right"]) input[k] = false;
      else if (control) input[control] = false;
      emit();
    },
    clear() {
      pointers.clear();
      input = neutralInput();
      emit();
    },
    snapshot() {
      return { ...input };
    },
  };
}
export function createInputPump({
  read,
  send,
  isActive,
  clock = () => Date.now(),
}) {
  let previous = "",
    lastSent = -Infinity;
  return {
    tick() {
      const input = isActive() ? read() : neutralInput();
      const key = JSON.stringify(input),
        time = clock();
      if (time - lastSent < 30) return;
      if (key !== previous || time - lastSent >= 100) {
        send(input);
        previous = key;
        lastSent = time;
      }
    },
    clear() {
      const input = neutralInput();
      send(input);
      previous = JSON.stringify(input);
      lastSent = clock();
    },
  };
}

export function bindInputRelease(windowTarget, documentTarget, release) {
  windowTarget.addEventListener("blur", release);
  documentTarget.addEventListener("visibilitychange", release);
  return () => {
    windowTarget.removeEventListener("blur", release);
    documentTarget.removeEventListener("visibilitychange", release);
    release();
  };
}
