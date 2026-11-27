// Gobblewood Escape — the escape route itself: fences to jump, haystacks to
// hide in, oven floors and gravy puddles to avoid, corn and pie to collect,
// and the forest gate at the end. The layout is built once from a seed, so
// the same seed always builds the same route.

import { CHECKPOINTS, OVEN, VIEW, WORLD, ZONES } from './tuning.js';

/** A tiny deterministic RNG (mulberry32) so a seed rebuilds the same route. */
export function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function range(random, min, max) {
  return min + random() * (max - min);
}

/**
 * Build the route for `seed`. Every obstacle is an axis-aligned box on the
 * ground line; pickups float above it. Zones are laid out in order, with a
 * clear stretch at each zone start so the turkey lands safely after a respawn.
 */
export function buildLevel(seed) {
  const random = createRandom(seed);
  const fences = [];
  const haystacks = [];
  const ovens = [];
  const puddles = [];
  const pickups = [];

  function clearOfOthers(x, width, margin) {
    const list = [...fences, ...haystacks, ...ovens, ...puddles];
    return list.every(
      (box) => x + width + margin < box.x || x - margin > box.x + box.width,
    );
  }

  function placeFence(x) {
    fences.push({ x, width: 36, height: 60, kind: 'fence' });
  }

  function placeHaystack(x) {
    haystacks.push({ x, width: 120, height: 92, kind: 'haystack' });
  }

  function placeOven(x) {
    ovens.push({ x, width: OVEN.width, height: 26, kind: 'oven' });
  }

  function placePuddle(x) {
    puddles.push({ x, width: 96, height: 12, kind: 'puddle' });
  }

  function placeCorn(x, y) {
    pickups.push({ x, y, kind: 'corn', taken: false, bob: random() * Math.PI * 2 });
  }

  // Farmyard: gentle fences, two haystacks, corn trails low and high.
  for (let x = 700; x < 2250; x += 340) {
    const fx = x + range(random, 0, 120);
    if (clearOfOthers(fx, 36, 60)) placeFence(fx);
    if (random() < 0.6) {
      const cx = fx + 120;
      placeCorn(cx, VIEW.groundY - 46);
      placeCorn(cx + 44, VIEW.groundY - 46);
      if (random() < 0.5) placeCorn(cx + 22, VIEW.groundY - 170);
    }
  }
  placeHaystack(1050);
  placeHaystack(1750);
  placeCorn(1080, VIEW.groundY - 46);
  placeCorn(1780, VIEW.groundY - 46);
  pickups.push({ x: 1500, y: VIEW.groundY - 170, kind: 'pie', taken: false, bob: 0 });

  // Barn: tighter fences, more haystacks to hide in, first puddles.
  for (let x = 2650; x < 4650; x += 300) {
    const fx = x + range(random, 0, 100);
    if (clearOfOthers(fx, 36, 60)) placeFence(fx);
    if (random() < 0.7) {
      placeCorn(fx + 110, VIEW.groundY - 46);
      placeCorn(fx + 154, VIEW.groundY - 46);
    }
  }
  placeHaystack(2850);
  placeHaystack(3450);
  placeHaystack(4200);
  placePuddle(3100);
  placePuddle(3950);
  placeCorn(2880, VIEW.groundY - 46);
  placeCorn(4230, VIEW.groundY - 46);
  pickups.push({ x: 3600, y: VIEW.groundY - 170, kind: 'pie', taken: false, bob: 1 });
  pickups.push({ x: 4500, y: VIEW.groundY - 46, kind: 'feather', taken: false, bob: 2 });

  // Kitchen: oven floors to jump over, dense fences, few places to hide.
  for (let x = 5050; x < 6900; x += 320) {
    const fx = x + range(random, 0, 90);
    if (clearOfOthers(fx, 36, 50)) placeFence(fx);
    if (random() < 0.45) {
      const ox = fx + 170;
      if (clearOfOthers(ox, OVEN.width, 40)) placeOven(ox);
    }
    if (random() < 0.7) placeCorn(fx + 110, VIEW.groundY - 46);
  }
  placeHaystack(5300);
  placeHaystack(6300);
  placePuddle(5600);
  pickups.push({ x: 5330, y: VIEW.groundY - 46, kind: 'pie', taken: false, bob: 3 });
  pickups.push({ x: 6600, y: VIEW.groundY - 170, kind: 'pie', taken: false, bob: 4 });
  pickups.push({ x: 6850, y: VIEW.groundY - 46, kind: 'corn', taken: false, bob: 5 });

  return {
    seed,
    fences,
    haystacks,
    ovens,
    puddles,
    pickups,
    /** The zone the turkey is running through at world x. */
    zoneAt(x) {
      return ZONES.find((zone) => x >= zone.start && x < zone.end) ?? ZONES[2];
    },
    /** The nearest checkpoint at or behind world x. */
    checkpointAt(x) {
      let best = CHECKPOINTS[0];
      for (const point of CHECKPOINTS) if (point <= x) best = point;
      return best;
    },
    /** The fence whose top the turkey must clear, if it is about to run into one. */
    fenceAhead(x, width, ahead) {
      return fences.find(
        (fence) => fence.x + fence.width > x && fence.x < x + width + ahead,
      ) ?? null;
    },
    /** The oven strip the turkey is standing on, if any. */
    ovenUnder(x, width) {
      return ovens.find((oven) => x + width > oven.x + 8 && x < oven.x + oven.width - 8) ?? null;
    },
    /** The puddle the turkey is wading through, if any. */
    puddleUnder(x, width) {
      return puddles.find((p) => x + width > p.x && x < p.x + p.width) ?? null;
    },
    /** The haystack the turkey can hide in at world x, if any. */
    haystackAt(x, width) {
      return haystacks.find((hay) => x + width > hay.x + 10 && x < hay.x + hay.width - 10) ?? null;
    },
    /** True when the turkey has reached the forest gate. */
    reachedGate(x) {
      return x >= WORLD.gateX;
    },
  };
}
