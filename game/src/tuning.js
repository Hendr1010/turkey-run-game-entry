// Gobblewood Escape — every tuning number and colour in one place.
// The viewport is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size. The world is one long
// escape route, 7200 px, in three zones: Farmyard, Barn, Kitchen, then the woods.

export const VIEW = { width: 1280, height: 720, groundY: 620 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** World length in pixels and the x of the forest gate that ends the run. */
export const WORLD = { length: 7200, gateX: 7020 };

export const ZONES = [
  { name: 'Farmyard', start: 0, end: 2400, sky: ['#f7b267', '#f4845f'], farmerSpeed: 330 },
  { name: 'Barn', start: 2400, end: 4800, sky: ['#e07856', '#8d4b3a'], farmerSpeed: 360 },
  { name: 'Kitchen', start: 4800, end: 7200, sky: ['#c96f4a', '#5d3a2e'], farmerSpeed: 395 },
];

export const CHECKPOINTS = [600, 2450, 4850];

export const TURKEY = {
  width: 64,
  height: 58,
  walkSpeed: 340,
  dashSpeed: 760,
  dashTime: 0.18,
  dashCooldown: 1.0,
  jumpSpeed: 780,
  gravity: 2300,
  coyoteTime: 0.1,
  invulnerableTime: 1.6,
  maxLives: 3,
};

export const FARMER = {
  width: 58,
  height: 96,
  patrolSpeed: 95,
  chaseSpeed: 0, // filled from the zone: chase is a little faster than a walk
  visionRange: 540,
  visionHalfHeight: 130,
  loseSightAfter: 2.0,
  searchTime: 3.0,
  patrolHalfRange: 320,
};

export const KNIFE = {
  width: 26,
  height: 64,
  fallSpeed: 620,
  telegraphTime: 0.55,
  intervalFarmyard: 2.2,
  intervalBarn: 1.7,
  intervalKitchen: 1.3,
  damage: 1,
};

export const OVEN = {
  width: 130,
  standTime: 0.6,
  damage: 1,
};

export const PICKUP = { cornPoints: 10, piePoints: 25, featherLife: 1 };

export const SCORING = { metresPerPoint: 1, escapeBonus: 500 };

/** Seconds of grace after a hit before the turkey can be hurt again. */
export const HURT_KNOCKBACK = 260;

export const PALETTE = {
  skyFarm: ['#f9c784', '#f4845f'],
  skyBarn: ['#e8a06a', '#8d4b3a'],
  skyKitchen: ['#d98a5f', '#5d3a2e'],
  sun: '#ffe9a8',
  cloud: 'rgba(255, 244, 224, 0.85)',
  groundFarm: '#8a5a2b',
  groundTopFarm: '#c98f4e',
  groundBarn: '#6e4a2f',
  groundTopBarn: '#a97a4e',
  groundKitchen: '#7a4a3a',
  groundTopKitchen: '#b98a6a',
  hay: '#e8b93c',
  hayDark: '#c99427',
  fence: '#7a4a26',
  fenceDark: '#5d3820',
  ovenTile: '#b3402e',
  ovenGlow: '#ff7a2a',
  puddle: '#7a5a8a',
  turkeyBody: '#8a5230',
  turkeyWing: '#6e3f22',
  turkeyHead: '#e8dcc8',
  turkeyWattle: '#e5534b',
  turkeyBeak: '#f2a93b',
  tailFeathers: ['#a0522d', '#d2691e', '#e8a33c', '#7a4a26', '#c94f32'],
  farmerShirt: '#4a7ab5',
  farmerOveralls: '#3a5a8a',
  farmerSkin: '#e8b98a',
  farmerHat: '#e8c96a',
  knifeBlade: '#dfe6ee',
  knifeHandle: '#7a4a26',
  corn: '#f2c94c',
  cornHusk: '#5a8a3a',
  pie: '#c96a2e',
  panel: 'rgba(43, 24, 12, 0.82)',
  panelBorder: '#f2a93b',
  text: '#fff3e0',
  textDark: '#3a2410',
  muted: '#d8b48a',
  alert: '#ff5340',
  safe: '#7ac74f',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobblewood-escape.best';
