// Every tuning number and colour for Gobble Run in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends
// on the screen size. Distances are metres; the world converts them to pixels at PXM.

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const FIELD = { width: 1280, height: 720, groundY: 624 };

/** Pixels per metre: the camera view is about 53 metres wide. */
export const PXM = 24;

/** Where the turkey sits on screen; the world scrolls past it. */
export const TURKEY_SCREEN_X = 340;

/** The whole escape route, in metres: farmyard, pumpkin patch, then the farmhouse kitchen. */
export const COURSE_METRES = 1800;

/** The last stretch is a clear run at the forest gate: nothing spawns there. */
export const FINAL_CLEAR_METRES = 1740;

export const STAGES = [
  { name: 'The Farmyard', until: 600 },
  { name: 'The Pumpkin Patch', until: 1200 },
  { name: 'The Farmhouse Kitchen', until: COURSE_METRES },
];

export const TURKEY = {
  width: 64,
  height: 84,
  duckHeight: 52,
  slideHeight: 44,
  cruise: 9.5, // metres a second with no input
  slow: 6.5,
  fast: 12,
  sprint: 13.5,
  gravity: 2000, // px/s^2
  jumpVelocity: 1080,
  doubleJumpVelocity: 920,
  fastFall: 2400,
  stumbleSeconds: 0.5,
  invulnerableSeconds: 1.6,
};

export const STAMINA = { max: 100, sprintDrain: 30, regen: 18, cornRefill: 25 };

export const FARMER = {
  startGap: 16, // metres behind the turkey when a run begins
  baseSpeed: 7.6,
  speedRamp: 2.2, // extra speed by the end of the course
  trailBonus: 1.8, // he hurries when the trail is long (gap over trailGap)
  trailGap: 20,
  lungeRange: 3.4, // metres: close enough to make a grab for the turkey
  lungeSeconds: 0.42,
  lungeCloseRate: 9, // metres a second the gap closes during a lunge
  grabRange: 1.3, // a lunge ending closer than this catches a turkey that did not jump
  dodgeHeight: 40, // px of jump that clears the lunge
  stumbleSeconds: 1.5, // after a missed lunge or a grab, he is down this long
  searchSeconds: 2.6, // how long he peers at a hiding spot he did not see entered
  seenHideRange: 5.5, // entering a hiding spot closer than this means he saw it
  yankRange: 1.6, // in the yank run he arrives at the spot at this gap
  spotStopGap: 7, // chasing a hidden turkey, he stops this far behind the spot to search
  loseTrailGap: 18, // after a failed search he falls back to this gap
  spottedBurstSpeed: 12,
  spottedBurstSeconds: 1.5,
};

export const HEARTS = 3;

/** Score values: distance trickles in as you run; the rest are moments. */
export const SCORE = {
  perSecondAtCruise: 20,
  corn: 10,
  closeCall: 25,
  stageClear: 100,
  escaped: 500,
  heartBonus: 100,
};

export const PALETTE = {
  ink: '#2d1a12',
  cream: '#fff6e8',
  paper: '#ffedb8',
  dawnSkyTop: '#7ec8e3',
  dawnSkyBottom: '#ffd9a0',
  daySkyTop: '#79b5e0',
  daySkyBottom: '#ffe9bd',
  sun: '#ffdf6b',
  hillFar: '#9db98a',
  hillNear: '#6f9a5e',
  grass: '#77a84f',
  dirt: '#a9713f',
  dirtDark: '#8a5527',
  kitchenWall: '#e8b04b',
  kitchenWallDark: '#c98f35',
  kitchenFloor: '#9c5a2e',
  kitchenFloorLight: '#b96f3a',
  wood: '#8a5527',
  woodDark: '#6e421c',
  turkeyBody: '#8a5a33',
  turkeyDark: '#6e4525',
  featherA: '#c1442e',
  featherB: '#e8873a',
  featherC: '#f2c14e',
  featherD: '#7a9e43',
  featherE: '#3e7d74',
  head: '#e8e2d5',
  wattle: '#d93a2b',
  beak: '#f2a03c',
  farmerShirt: '#c23b2a',
  farmerShirtDark: '#9c2d20',
  farmerPants: '#2e5f8a',
  farmerSkin: '#f0b98a',
  farmerHat: '#e8c96a',
  pumpkin: '#e8762a',
  pumpkinDark: '#c85f1c',
  corn: '#f7c948',
  cornHusk: '#7a9e43',
  heart: '#e2483d',
  danger: '#d93a2b',
  panel: 'rgba(45, 26, 18, 0.82)',
  panelEdge: '#f2c14e',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobble-run.best';
