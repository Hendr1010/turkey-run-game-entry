// Gobblewood Escape — boot and the one loop: input is read every frame, the
// world advances in fixed 1/60 s steps (several in a slow frame, none in a
// fast one), and the renderer paints what is there. The game moves between
// five screens: title, play, paused, caught and escaped.
//
// ?seed=N fixes the route. ?shot=start|play|chase|escaped (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './tuning.js';
import { createWorld, EVENT_CAUGHT, EVENT_ESCAPED, EVENT_SPOTTED } from './world.js';
import { createRenderer, SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { ACTION_CONFIRM, ACTION_DASH, ACTION_HIDE, ACTION_JUMP, ACTION_LEFT, ACTION_MUTE, ACTION_PAUSE, ACTION_RIGHT, createInput } from './input.js';
import { caughtSound, gobble, toggleMute, unlockAudio, winSound } from './audio.js';
import { stageShot } from './scenes.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(seed);
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts one visit.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, unlockAudio);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    gobble();
    announce('Playing. Three lives. Reach the woods.');
  }

  function endRun(won) {
    const score = world.turkey.state.score;
    if (score > best) {
      best = score;
      saveBest(best);
    }
    if (won) {
      screen = SCREEN_ESCAPED;
      winSound();
      announce(`Escaped! Score ${score}. Best ${best}.`);
    } else {
      screen = SCREEN_CAUGHT;
      caughtSound();
      announce(`Caught. Score ${score}. Best ${best}.`);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;

    if (input.wasPressed(ACTION_MUTE)) {
      const muted = toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }

    if (screen === SCREEN_TITLE) {
      if (input.wasPressed(ACTION_CONFIRM) || input.clickJumped()) startGame();
      renderer.draw(world, screen, best);
      input.endFrame();
      return;
    }

    if (screen === SCREEN_CAUGHT || screen === SCREEN_ESCAPED) {
      if (input.wasPressed(ACTION_CONFIRM) || input.clickJumped()) startGame();
      renderer.draw(world, screen, best);
      input.endFrame();
      return;
    }

    if (input.wasPressed(ACTION_PAUSE)) {
      screen = screen === SCREEN_PAUSED ? SCREEN_PLAY : SCREEN_PAUSED;
      announce(screen === SCREEN_PAUSED ? 'Paused.' : 'Playing.');
    }
    if (screen === SCREEN_PAUSED) {
      renderer.draw(world, screen, best);
      input.endFrame();
      return;
    }

    // Play: read the held keys every frame, edge-triggered jump and dash.
    const move =
      (input.isHeld(ACTION_RIGHT) ? 1 : 0) - (input.isHeld(ACTION_LEFT) ? 1 : 0);
    const jump = input.wasPressed(ACTION_JUMP) || input.clickJumped();
    const dash = input.wasPressed(ACTION_DASH);
    const hide = input.isHeld(ACTION_HIDE);
    const click = input.takeClick();
    void click;

    accumulator += elapsed;
    while (accumulator >= STEP) {
      accumulator -= STEP;
      const events = world.step(move, jump, dash, hide);
      if (events & EVENT_ESCAPED) {
        endRun(true);
        break;
      }
      if (events & EVENT_CAUGHT) {
        endRun(false);
        break;
      }
      if (events & EVENT_SPOTTED) announce('Spotted! The farmer is chasing you!');
    }

    renderer.draw(world, screen, best);
    input.endFrame();
  }

  requestAnimationFrame(frame);
}

if (shot !== null) runShot(shot);
else runGame();
