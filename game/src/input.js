// Keyboard, mouse and touch input. The world thinks in a per-step control object
// ({ move, down, sprint, jumpPressed, jumpHeld }); this module keeps the held keys,
// queues jump presses so a tap between steps is never lost, and reports one-shot
// actions (confirm, pause, mute) for the screen state machine in main.js.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

const JUMP_KEYS = new Set(['ArrowUp', 'KeyW', 'Space']);
const DOWN_KEYS = new Set(['ArrowDown', 'KeyS']);
const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);

export function createInput(canvas) {
  const held = new Set();
  let jumpQueued = false;
  let actions = 0;

  function press(code) {
    if (JUMP_KEYS.has(code)) {
      if (!held.has(code)) jumpQueued = true;
      actions |= ACTION_CONFIRM;
    }
    if (code === 'Enter') actions |= ACTION_CONFIRM;
    if (code === 'KeyP' || code === 'Escape') actions |= ACTION_PAUSE;
    if (code === 'KeyM') actions |= ACTION_MUTE;
    held.add(code);
  }

  function release(code) {
    held.delete(code);
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) {
      if (JUMP_KEYS.has(event.code) || DOWN_KEYS.has(event.code)) event.preventDefault();
      return;
    }
    press(event.code);
    if (JUMP_KEYS.has(event.code) || DOWN_KEYS.has(event.code) || LEFT_KEYS.has(event.code) || RIGHT_KEYS.has(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => release(event.code));
  window.addEventListener('blur', () => held.clear());

  // A click or tap confirms menus and jumps in play; holding the pointer down counts
  // as holding jump, so a long press floats the turkey a touch longer.
  function pointerDown(event) {
    event.preventDefault();
    jumpQueued = true;
    actions |= ACTION_CONFIRM;
    held.add('Pointer');
  }
  function pointerUp() {
    held.delete('Pointer');
  }
  canvas.addEventListener('pointerdown', pointerDown);
  window.addEventListener('pointerup', pointerUp);
  window.addEventListener('pointercancel', pointerUp);

  return {
    /** The control object for one simulation step; consumes the queued jump press. */
    control() {
      const move = (held.has('ArrowRight') || held.has('KeyD') ? 1 : 0) - (held.has('ArrowLeft') || held.has('KeyA') ? 1 : 0);
      const control = {
        move,
        down: held.has('ArrowDown') || held.has('KeyS'),
        sprint: held.has('ShiftLeft') || held.has('ShiftRight'),
        jumpPressed: jumpQueued,
        jumpHeld: held.has('ArrowUp') || held.has('KeyW') || held.has('Space') || held.has('Pointer'),
      };
      jumpQueued = false;
      return control;
    },
    /** One-shot actions since the last call (confirm / pause / mute), then clears them. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
