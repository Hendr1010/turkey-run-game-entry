// Gobblewood Escape — the world: one fixed step advances the turkey, the
// farmer, the falling knives and the pickups, and reports the events the
// screens and sounds react to. The world owns no drawing and no input.

import { KNIFE, STEP, VIEW, WORLD } from './tuning.js';
import { buildLevel, createRandom } from './level.js';
import { createTurkey } from './turkey.js';
import { createFarmer } from './farmer.js';
import { featherSound, hurtSound, knifeSound, pickupSound } from './audio.js';

export const EVENT_NONE = 0;
export const EVENT_HURT = 1;
export const EVENT_CAUGHT = 2;
export const EVENT_ESCAPED = 4;
export const EVENT_SPOTTED = 8;

export function createWorld(seed) {
  const random = createRandom(seed ^ 0x9e3779b9);
  const level = buildLevel(seed);
  const turkey = createTurkey(level);
  const farmer = createFarmer(level, level.zoneAt(150).farmerSpeed);
  const state = {
    seed,
    time: 0,
    knives: [],
    knifeTimer: 1.2,
    spottedFlash: 0,
    hurtFlash: 0,
    zone: level.zoneAt(80),
    zoneBanner: 0,
    zoneBannerName: 'Farmyard',
    over: false,
    won: false,
    message: '',
  };

  function spawnKnife() {
    const tx = turkey.state.x + (random() * 700 - 150);
    const x = Math.max(80, Math.min(WORLD.length - 80, tx));
    state.knives.push({
      x,
      y: -80,
      falling: false,
      telegraph: KNIFE.telegraphTime,
      speed: KNIFE.fallSpeed * (0.9 + random() * 0.25),
    });
    knifeSound();
  }

  function reset() {
    state.time = 0;
    state.knives = [];
    state.knifeTimer = 1.2;
    state.spottedFlash = 0;
    state.hurtFlash = 0;
    state.zone = level.zoneAt(80);
    state.zoneBanner = 0;
    state.zoneBannerName = 'Farmyard';
    state.over = false;
    state.won = false;
    state.message = '';
    for (const pickup of level.pickups) pickup.taken = false;
    turkey.resetAll();
    farmer.resetAll();
  }

  return {
    state,
    level,
    turkey,
    farmer,
    reset,

    /** The turkey's current zone, for the HUD and the farmer's speed. */
    zone() {
      return state.zone;
    },

    /**
     * Advance the world one fixed step. `move` is -1, 0 or 1; the rest are
     * this frame's inputs. Returns a bitmask of EVENT_* flags.
     */
    step(move, jump, dash, hideHeld) {
      if (state.over || state.won) return EVENT_NONE;
      state.time += STEP;
      if (state.spottedFlash > 0) state.spottedFlash -= STEP;
      if (state.hurtFlash > 0) state.hurtFlash -= STEP;
      if (state.zoneBanner > 0) state.zoneBanner -= STEP;

      let events = EVENT_NONE;

      const turkeyEvent = turkey.step(move, jump, dash, hideHeld);
      if (turkeyEvent === 'escaped') {
        state.won = true;
        return EVENT_ESCAPED;
      }
      if (turkeyEvent === 'hurt') {
        state.hurtFlash = 0.5;
        hurtSound();
        events |= EVENT_HURT;
      } else if (turkeyEvent === 'caught') {
        state.over = true;
        return EVENT_CAUGHT;
      }

      const zone = level.zoneAt(turkey.state.x);
      if (zone.name !== state.zone.name) {
        state.zone = zone;
        state.zoneBanner = 2.2;
        state.zoneBannerName = zone.name;
      }
      // The farmer keeps pace with the zone the turkey is running through.
      farmer.setZoneSpeed(zone.farmerSpeed);
      // The farmer is a pursuer from behind: when the turkey has run far
      // ahead, he closes the gap off-screen and patrols behind it again.
      if (turkey.state.x - farmer.state.x > 900) {
        farmer.repositionBehind(turkey.state.x);
      }
      const farmerEvent = farmer.step(turkey.state);
      if (farmerEvent === 'spotted') {
        state.spottedFlash = 1.2;
        events |= EVENT_SPOTTED;
      } else if (farmerEvent === 'caught') {
        const result = turkey.hurt('farmer');
        if (result === 'caught') {
          state.over = true;
          return EVENT_CAUGHT;
        }
        if (result === 'hurt') {
          state.hurtFlash = 0.5;
          hurtSound();
          events |= EVENT_HURT;
          // A catch throws the turkey back to its checkpoint; the farmer
          // searches where the catch happened, giving the turkey a breather.
          const catchX = turkey.state.x;
          turkey.resetTo(level.checkpointAt(turkey.state.x));
          farmer.searchAt(catchX);
        }
      }

      // Falling carving knives, telegraphed first, then dropped.
      const interval =
        state.zone.name === 'Kitchen'
          ? KNIFE.intervalKitchen
          : state.zone.name === 'Barn'
            ? KNIFE.intervalBarn
            : KNIFE.intervalFarmyard;
      state.knifeTimer -= STEP;
      if (state.knifeTimer <= 0) {
        state.knifeTimer = interval * (0.8 + random() * 0.5);
        spawnKnife();
      }
      const t = turkey.state;
      for (const knife of state.knives) {
        if (!knife.falling) {
          knife.telegraph -= STEP;
          if (knife.telegraph <= 0) knife.falling = true;
        } else {
          knife.y += knife.speed * STEP;
          if (
            t.invulnerable <= 0 &&
            !t.hidden &&
            knife.y + KNIFE.height > t.y - 58 &&
            knife.y < t.y + 4 &&
            knife.x + KNIFE.width > t.x + 6 &&
            knife.x < t.x + 58
          ) {
            knife.y = VIEW.groundY + 200;
            const result = turkey.hurt('knife');
            if (result === 'caught') {
              state.over = true;
              return EVENT_CAUGHT;
            }
            if (result === 'hurt') {
              state.hurtFlash = 0.5;
              hurtSound();
              events |= EVENT_HURT;
            }
          }
        }
      }
      state.knives = state.knives.filter((knife) => knife.y < VIEW.groundY + 120);

      // Pickups: corn, pie and the rare feather.
      for (const pickup of level.pickups) {
        const got = turkey.collect(pickup);
        if (got === 'corn' || got === 'pie') pickupSound();
        else if (got === 'feather') featherSound();
      }

      return events;
    },
  };
}
