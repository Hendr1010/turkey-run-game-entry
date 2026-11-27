// Gobblewood Escape — the farmer: patrol, suspicion, chase and search.
// He walks his patch of the route, and when the turkey crosses his line of
// sight he gives chase. A hidden turkey is invisible to him; a turkey that
// breaks line of sight is searched for, then forgotten.

import { FARMER, STEP, VIEW } from './tuning.js';
import { alarmSound } from './audio.js';

export const FARMER_PATROL = 'patrol';
export const FARMER_CHASE = 'chase';
export const FARMER_SEARCH = 'search';

export function createFarmer(level, zoneSpeed) {
  let chaseSpeed = zoneSpeed + 40;
  const state = {
    x: 150,
    y: VIEW.groundY,
    facing: 1,
    mode: FARMER_PATROL,
    patrolCentre: 150,
    lastSeenX: 150,
    unseenTime: 0,
    searchTime: 0,
    walkPhase: 0,
  };

  function placeAt(x) {
    state.x = x;
    state.y = VIEW.groundY;
    state.patrolCentre = x;
    state.mode = FARMER_PATROL;
    state.facing = 1;
    state.unseenTime = 0;
    state.searchTime = 0;
  }

  function resetAll() {
    placeAt(150);
  }

  /** True when the turkey is ahead of the farmer, in range, and not hidden.
   *  The farmer only ever looks down the route (to the right): he is a
   *  pursuer from behind, so a turkey that slips past him is not chased
   *  backwards into the start. */
  function canSee(turkey) {
    if (turkey.hidden || turkey.dead || turkey.escaped) return false;
    if (state.facing <= 0) return false;
    const dx = turkey.x + 32 - (state.x + 29);
    if (dx <= 0) return false;
    if (dx > FARMER.visionRange) return false;
    const dy = turkey.y - state.y;
    return Math.abs(dy) < FARMER.visionHalfHeight;
  }

  return {
    state,
    resetAll,
    placeAt,
    canSee,

    /** The farmer's chase speed follows the zone the turkey is running through. */
    setZoneSpeed(speed) {
      chaseSpeed = speed + 25;
    },

    /**
     * The farmer is a pursuer from behind: when the turkey has run far
     * ahead of him, he closes the gap off-screen and resumes patrolling
     * behind the turkey, so he never blocks the route ahead.
     */
    repositionBehind(turkeyX) {
      if (state.mode !== FARMER_PATROL) return;
      placeAt(Math.max(120, turkeyX - 700));
    },

    /** Send the farmer searching where the turkey was last seen. */
    searchAt(x) {
      state.mode = FARMER_SEARCH;
      state.lastSeenX = x;
      state.searchTime = FARMER.searchTime;
      state.unseenTime = 0;
    },

    /**
     * Advance the farmer one fixed step. Returns 'spotted' the moment a
     * chase begins, 'caught' when he lays hands on the turkey, else null.
     */
    step(turkey) {
      state.walkPhase += STEP;
      let event = null;

      if (state.mode === FARMER_PATROL) {
        state.x += state.facing * FARMER.patrolSpeed * STEP;
        if (state.x < state.patrolCentre - FARMER.patrolHalfRange) {
          state.x = state.patrolCentre - FARMER.patrolHalfRange;
          state.facing = 1;
        } else if (state.x > state.patrolCentre + FARMER.patrolHalfRange) {
          state.x = state.patrolCentre + FARMER.patrolHalfRange;
          state.facing = -1;
        }
        if (canSee(turkey)) {
          state.mode = FARMER_CHASE;
          state.unseenTime = 0;
          alarmSound();
          event = 'spotted';
        }
      } else if (state.mode === FARMER_CHASE) {
        const dx = turkey.x - state.x;
        if (dx < -50) {
          // The turkey slipped behind him: he loses the trail and searches.
          state.mode = FARMER_SEARCH;
          state.searchTime = FARMER.searchTime;
          state.lastSeenX = turkey.x;
        } else {
          state.facing = 1;
          state.x += chaseSpeed * STEP;
        }
        if (canSee(turkey)) {
          state.lastSeenX = turkey.x;
          state.unseenTime = 0;
        } else {
          state.unseenTime += STEP;
          if (state.unseenTime >= FARMER.loseSightAfter) {
            state.mode = FARMER_SEARCH;
            state.searchTime = FARMER.searchTime;
          }
        }
        if (dx > -20 && dx < 52 && Math.abs(turkey.y - state.y) < 90 && !turkey.hidden) {
          event = 'caught';
        }
      } else {
        // Search: walk to where the turkey was last seen, look around, give up.
        const dx = state.lastSeenX - state.x;
        if (Math.abs(dx) > 24) {
          state.facing = dx > 0 ? 1 : -1;
          state.x += state.facing * FARMER.patrolSpeed * 1.4 * STEP;
        } else {
          state.searchTime -= STEP;
          state.facing = Math.sin(state.walkPhase * 3) > 0 ? 1 : -1;
          if (state.searchTime <= 0) {
            state.mode = FARMER_PATROL;
            state.patrolCentre = state.x;
          }
        }
        if (canSee(turkey)) {
          state.mode = FARMER_CHASE;
          state.unseenTime = 0;
          alarmSound();
          event = 'spotted';
        }
      }

      // Keep the farmer on the route and out of the kitchen's ovens.
      state.x = Math.max(60, Math.min(7100, state.x));
      return event;
    },
  };
}
