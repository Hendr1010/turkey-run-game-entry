// Gobblewood Escape — the screenshot scenes behind ?shot=start|play|chase|
// escaped. Each scene drives the real game forward from a fresh world with a
// simple autopilot (run right, jump what is ahead, dash from the farmer), so
// every frame is what a real run looks like and the same seed always gives
// the same frame. The chase and escaped scenes place the turkey through the
// game's own transitions, then let the real loop run a few steps.

import { STEP, VIEW, WORLD } from './tuning.js';
import { SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { FARMER_CHASE } from './farmer.js';

const PLAY_SECONDS = 18;
const CHASE_STEPS = 90;
const ESCAPED_STEPS = 90;

/** Jump when a fence, oven or puddle is just ahead; dash when chased; hide in
 *  a haystack when the farmer is on the turkey's tail and one is near. */
function autopilot(world) {
  const t = world.turkey.state;
  const level = world.level;
  const fence = level.fenceAhead(t.x, 64, 180);
  const oven = level.ovens.find((o) => o.x > t.x && o.x < t.x + 170);
  const puddle = level.puddles.find((p) => p.x > t.x && p.x < t.x + 120);
  const jump = t.onGround && (fence !== null || oven !== undefined || puddle !== undefined);
  const dash = world.farmer.state.mode === FARMER_CHASE && t.dashCooldown <= 0;
  const chasing = world.farmer.state.mode === FARMER_CHASE;
  const hay = level.haystacks.find((h) => h.x > t.x - 20 && h.x < t.x + 260);
  if (chasing && hay !== undefined) {
    const centre = hay.x + 60;
    if (Math.abs(t.x + 32 - centre) < 40) return { move: 0, jump: false, dash: false, hide: true };
    return { move: centre > t.x ? 1 : -1, jump, dash, hide: false };
  }
  // Sidestep a telegraphed knife landing on the turkey's head, and step
  // clear of one already falling toward it.
  const knife = world.state.knives.find((k) => {
    const dx = Math.abs(k.x + 13 - (t.x + 32));
    if (k.falling) return dx < 100 && k.y < t.y - 40;
    return dx < 70;
  });
  if (knife !== undefined) {
    const away = t.x + 32 >= knife.x + 13 ? 1 : -1;
    return { move: away, jump, dash, hide: false };
  }
  return { move: 1, jump, dash, hide: false };
}

function runSteps(world, seconds, pilot) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const input = pilot(world);
    const events = world.step(input.move, input.jump, input.dash, input.hide);
    if (world.state.won || world.state.over) break;
    void events;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show. Unknown names stage the title.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    runSteps(world, PLAY_SECONDS, autopilot);
    // Stage the frame: if the farmer has fallen behind, put him back in
    // the shot, mid-chase, so the screenshot shows the pursuit.
    if (!world.state.over && world.farmer.state.x < world.turkey.state.x - 500) {
      world.farmer.state.x = world.turkey.state.x - 320;
      world.farmer.state.y = VIEW.groundY;
      world.farmer.state.mode = FARMER_CHASE;
      world.farmer.state.facing = 1;
    }
    return { screen: SCREEN_PLAY, best: world.turkey.state.score };
  }
  if (name === 'chase') {
    // Kitchen, farmer on the turkey's tail: place both through the game's
    // own state, force the chase, then let the real loop run.
    world.turkey.state.x = 5600;
    world.turkey.state.y = VIEW.groundY;
    world.turkey.state.lives = 3;
    world.turkey.state.invulnerable = 0.6;
    world.farmer.placeAt(5450);
    world.farmer.state.mode = FARMER_CHASE;
    world.farmer.state.facing = 1;
    world.state.spottedFlash = 1.2;
    for (let i = 0; i < CHASE_STEPS; i += 1) {
      const input = autopilot(world);
      world.step(input.move, input.jump, input.dash, input.hide);
      if (world.state.over) break;
    }
    if (world.state.over) return { screen: SCREEN_CAUGHT, best: 0 };
    return { screen: SCREEN_PLAY, best: world.turkey.state.score };
  }
  if (name === 'escaped') {
    // The turkey at the forest gate: cross it through the real step, then
    // let the win screen settle.
    world.turkey.state.x = WORLD.gateX - 80;
    world.turkey.state.y = VIEW.groundY;
    world.turkey.state.score = 1240;
    world.turkey.state.corn = 14;
    world.turkey.state.pies = 2;
    world.turkey.state.runTime = 38.4;
    for (let i = 0; i < ESCAPED_STEPS; i += 1) {
      world.step(1, false, false, false);
      if (world.state.won) break;
    }
    return { screen: SCREEN_ESCAPED, best: world.turkey.state.score };
  }
  // Title: let the farmyard breathe for a few seconds behind the title.
  runSteps(world, 5, () => ({ move: 0, jump: false, dash: false, hide: false }));
  return { screen: SCREEN_TITLE, best: 0 };
}
