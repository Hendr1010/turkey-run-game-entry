// Gobblewood Escape — the turkey: run, jump, dash and hide. One job: turn
// input into movement, keep the turkey on the ground line, and report what
// happened (a fence hit, a pickup, an oven burn) for the world to score.

import { HURT_KNOCKBACK, OVEN, STEP, TURKEY, VIEW } from './tuning.js';
import { dashSound, jumpSound } from './audio.js';

export function createTurkey(level) {
  const state = {
    x: 600,
    y: VIEW.groundY,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: true,
    coyote: 0,
    hidden: false,
    dashTime: 0,
    dashCooldown: 0,
    invulnerable: 0,
    ovenTime: 0,
    lives: TURKEY.maxLives,
    score: 0,
    corn: 0,
    pies: 0,
    distance: 0,
    dead: false,
    escaped: false,
    runTime: 0,
  };

  function resetTo(x) {
    state.x = x;
    state.y = VIEW.groundY;
    state.vx = 0;
    state.vy = 0;
    state.onGround = true;
    state.hidden = false;
    state.dashTime = 0;
    state.dashCooldown = 0;
    state.invulnerable = 1;
    state.ovenTime = 0;
  }

  function resetAll() {
    resetTo(600);
    state.lives = TURKEY.maxLives;
    state.score = 0;
    state.corn = 0;
    state.pies = 0;
    state.distance = 0;
    state.dead = false;
    state.escaped = false;
    state.runTime = 0;
  }

  return {
    state,
    resetAll,
    resetTo,

    /**
     * Advance the turkey one fixed step. `move` is -1, 0 or 1; `jump`,
     * `dash` and `hideHeld` are this frame's inputs. Returns an event
     * string: 'fence' when the turkey bumps a fence, 'hurt' when it takes
     * damage, 'escaped' when it reaches the gate, or null.
     */
    step(move, jump, dash, hideHeld) {
      if (state.dead || state.escaped) return null;
      state.runTime += STEP;
      if (state.invulnerable > 0) state.invulnerable -= STEP;
      if (state.dashCooldown > 0) state.dashCooldown -= STEP;
      if (state.onGround) state.coyote = TURKEY.coyoteTime;
      else state.coyote -= STEP;

      const haystack = level.haystackAt(state.x, TURKEY.width);
      const wantHide = hideHeld && haystack !== null && state.onGround;
      state.hidden = wantHide;

      // While hidden the turkey stays put in the haystack.
      if (state.hidden) {
        state.vx = 0;
        state.vy = 0;
        return null;
      }

      const puddle = level.puddleUnder(state.x, TURKEY.width);
      const speed = TURKEY.walkSpeed * (puddle !== null ? 0.55 : 1);

      if (dash && state.dashCooldown <= 0 && state.dashTime <= 0) {
        state.dashTime = TURKEY.dashTime;
        state.dashCooldown = TURKEY.dashCooldown;
        dashSound();
      }
      if (state.dashTime > 0) {
        state.dashTime -= STEP;
        state.vx = state.facing * TURKEY.dashSpeed;
      } else {
        state.vx = move * speed;
        if (move !== 0) state.facing = move;
      }

      if (jump && (state.onGround || state.coyote > 0)) {
        state.vy = -TURKEY.jumpSpeed;
        state.onGround = false;
        state.coyote = 0;
        jumpSound();
      }

      state.vy += TURKEY.gravity * STEP;
      const nextX = state.x + state.vx * STEP;
      const nextY = state.y + state.vy * STEP;

      // Fences block the turkey on the ground: it must jump over them.
      // Blocking only stops horizontal motion; gravity still applies, so a
      // turkey that bumps a fence mid-air falls back to the ground and can
      // jump again instead of hanging in the air.
      const fence = level.fenceAhead(Math.min(state.x, nextX), TURKEY.width, 8);
      let blocked = false;
      if (fence !== null && state.vx !== 0) {
        const feetAboveTop = state.y <= VIEW.groundY - fence.height + 6;
        const wouldCross =
          (state.vx > 0 && nextX + TURKEY.width > fence.x && state.x + TURKEY.width <= fence.x + 4) ||
          (state.vx < 0 && nextX < fence.x + fence.width && state.x >= fence.x + fence.width - 4);
        if (!feetAboveTop && wouldCross) blocked = true;
      }
      if (blocked) {
        state.x = state.vx > 0 ? fence.x - TURKEY.width : fence.x + fence.width;
        state.vx = 0;
      } else {
        state.x = Math.max(0, Math.min(7200, nextX));
      }

      if (nextY >= VIEW.groundY) {
        state.y = VIEW.groundY;
        state.vy = 0;
        state.onGround = true;
      } else {
        state.y = nextY;
        state.onGround = false;
      }

      // Standing on a hot oven floor burns after a short grace.
      const oven = level.ovenUnder(state.x, TURKEY.width);
      if (oven !== null && state.onGround && state.invulnerable <= 0) {
        state.ovenTime += STEP;
        if (state.ovenTime >= OVEN.standTime) {
          state.ovenTime = 0;
          return this.hurt('oven');
        }
      } else {
        state.ovenTime = 0;
      }

      if (state.x > state.distance) {
        state.score += Math.floor((state.x - state.distance) / 50);
        state.distance = state.x;
      }
      if (level.reachedGate(state.x + TURKEY.width / 2)) {
        state.escaped = true;
        state.score += 500;
        return 'escaped';
      }
      return null;
    },

    /** Take one hit: lose a life, knock back, brief invulnerability. */
    hurt(cause) {
      if (state.invulnerable > 0 || state.dead || state.escaped) return null;
      state.lives -= 1;
      state.invulnerable = TURKEY.invulnerableTime;
      state.vx = -HURT_KNOCKBACK * state.facing;
      state.x = Math.max(0, state.x - 40);
      if (state.lives <= 0) {
        state.dead = true;
        return 'caught';
      }
      return 'hurt';
    },

    /** Collect a pickup the turkey overlaps. Returns its kind or null. */
    collect(pickup) {
      if (pickup.taken) return null;
      const cx = pickup.x;
      const cy = pickup.y;
      const turkeyCx = state.x + TURKEY.width / 2;
      const turkeyTop = state.y - TURKEY.height;
      if (Math.abs(cx - turkeyCx) < 52 && cy > turkeyTop - 30 && cy < VIEW.groundY + 10) {
        pickup.taken = true;
        if (pickup.kind === 'corn') {
          state.corn += 1;
          state.score += 10;
        } else if (pickup.kind === 'pie') {
          state.pies += 1;
          state.score += 25;
        } else if (pickup.kind === 'feather') {
          state.lives = Math.min(TURKEY.maxLives, state.lives + 1);
        }
        return pickup.kind;
      }
      return null;
    },
  };
}
