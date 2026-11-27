// Gobblewood Escape — keyboard and mouse input, one job: turn physical keys
// and clicks into the game's actions, with edge detection for jump and dash.

export const ACTION_JUMP = 'jump';
export const ACTION_DASH = 'dash';
export const ACTION_HIDE = 'hide';
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_LEFT = 'left';
export const ACTION_RIGHT = 'right';

const KEY_MAP = {
  ArrowLeft: ACTION_LEFT,
  KeyA: ACTION_LEFT,
  ArrowRight: ACTION_RIGHT,
  KeyD: ACTION_RIGHT,
  ArrowUp: ACTION_JUMP,
  KeyW: ACTION_JUMP,
  Space: ACTION_JUMP,
  ArrowDown: ACTION_HIDE,
  KeyS: ACTION_HIDE,
  KeyC: ACTION_HIDE,
  ShiftLeft: ACTION_DASH,
  ShiftRight: ACTION_DASH,
  KeyX: ACTION_DASH,
  Enter: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  KeyM: ACTION_MUTE,
  KeyR: ACTION_CONFIRM,
};

/**
 * Create the input state for a canvas. `onFirstGesture` runs once, on the
 * first key or pointer press, so audio can be unlocked by a real gesture.
 */
export function createInput(canvas, onFirstGesture) {
  const held = new Set();
  const pressed = new Set();
  let gestureDone = false;

  function noteGesture() {
    if (!gestureDone) {
      gestureDone = true;
      onFirstGesture();
    }
  }

  function onKeyDown(event) {
    const action = KEY_MAP[event.code];
    if (action === undefined) return;
    if (action === ACTION_JUMP || action === ACTION_DASH || action === ACTION_CONFIRM) {
      event.preventDefault();
    }
    noteGesture();
    if (!event.repeat) pressed.add(action);
    held.add(action);
  }

  function onKeyUp(event) {
    const action = KEY_MAP[event.code];
    if (action !== undefined) held.delete(action);
  }

  function onPointerDown(event) {
    noteGesture();
    // A click anywhere on the canvas is a jump while playing; menus read the
    // click position themselves through `clickPoint`.
    pressed.add('click');
    clickPoint.x = event.offsetX;
    clickPoint.y = event.offsetY;
    clickPoint.fresh = true;
  }

  const clickPoint = { x: 0, y: 0, fresh: false };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    /** True while the action's key is held down. */
    isHeld(action) {
      return held.has(action);
    },
    /** True only on the frame the action's key went down. */
    wasPressed(action) {
      return pressed.has(action);
    },
    /** The latest click point in canvas CSS pixels, or null if none this frame. */
    takeClick() {
      if (!clickPoint.fresh) return null;
      clickPoint.fresh = false;
      return { x: clickPoint.x, y: clickPoint.y };
    },
    /** A click counts as a jump while the game is running. */
    clickJumped() {
      return pressed.has('click');
    },
    /** Drop this frame's edge-triggered presses. Call once per frame. */
    endFrame() {
      pressed.clear();
    },
  };
}
