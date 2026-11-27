// The whole simulation of Gobble Run: the turkey's run, the farmer who hunts it, the
// hazards and hiding spots of the three stages, and the score. Nothing here touches
// the DOM, so the same step function drives the live game, the title-screen attract
// run and the deterministic screenshot scenes — and it can be exercised from Node.
//
// The turkey runs to the right through a course measured in metres. The farmer keeps
// a gap behind it, in metres, and his behaviour is a small state machine:
//   chase  — run at the turkey; lunge when close enough to grab
//   lunge  — a 0.42 s grab: jump it, or lose a heart
//   stumble— down after a missed lunge or a grab; the turkey gains ground
//   search — the turkey hid somewhere he did not see: he stops and peers about
//   trail  — the search failed; he falls back down the trail, then chases again
//   yank   — he SAW the turkey hide: he runs straight to the spot to drag it out
import {
  COURSE_METRES, FARMER, FIELD, FINAL_CLEAR_METRES, HEARTS, PALETTE, PXM, SCORE, STAGES, STAMINA, TURKEY,
} from './config.js';

export const EVENT = {
  NONE: 0,
  HIT: 1, // the turkey took a hit (hazard, grab or yank)
  GRAB: 2,
  CORN: 4,
  PIE: 8,
  CLOSE_CALL: 16,
  STAGE: 32,
  ESCAPED: 64,
  CAUGHT: 128,
  SPOTTED: 256, // the farmer saw the turkey hide, or caught it bolting from a search
  LUNGE: 512,
  STUMBLE: 1024, // the farmer went down
  KNIFE_DROP: 2048,
  FLAME: 4096,
  HIDE: 8192,
  JUMP: 16384,
  DOUBLE_JUMP: 32768,
};

export const HIDE_KINDS = new Set(['hay', 'scarecrow', 'sacks']);

/** An oven fires for 1.1 s of every 3.4 s cycle, and glows from 1.9 s as a warning. */
export function ovenIsFiring(e) {
  return e.cycle % 3.4 > 2.3;
}
export function ovenIsGlowing(e) {
  const cycle = e.cycle % 3.4;
  return cycle > 1.9 && cycle <= 2.3;
}

/** A burner is lit for 2 s of every 3.8 s cycle, and glows from 1.3 s as a warning. */
export function burnerIsLit(e) {
  const cycle = e.cycle % 3.8;
  return cycle > 1.7 && cycle < 3.7;
}
export function burnerIsGlowing(e) {
  const cycle = e.cycle % 3.8;
  return cycle >= 1.3 && cycle <= 1.7;
}

/** Obstacles that hurt on contact, with the box the renderer draws and the rules use. */
export const OBSTACLES = {
  fence: { w: 76, h: 54 },
  pitchfork: { w: 26, h: 98 },
  pumpkin: { w: 58, h: 44 },
  bigpumpkin: { w: 86, h: 78 },
  pot: { w: 72, h: 64 },
  barrel: { w: 54, h: 54 },
  oven: { w: 122, h: 116 },
  table: { w: 224, h: 134, clearance: 58 },
  knife: { w: 18, h: 64 },
  burner: { w: 78, h: 26 },
};

/** Curated, always-passable spawn patterns per stage: [kind, offsetPx] pairs. */
const PATTERNS = [
  [ // The Farmyard
    [['fence', 0]],
    [['fence', 0], ['corn', 6, 120], ['corn', 52, 168], ['corn', 98, 120]],
    [['mud', 0]],
    [['pitchfork', 0], ['corn', -60, 0]],
    [['hay', 0]],
    [['corn', 0, 0], ['corn', 52, 0], ['corn', 104, 0]],
    [['fence', 0], ['fence', 250]],
    [['mud', 0], ['fence', 330]],
    [['pitchfork', 0], ['pitchfork', 210]],
    [['hay', 0], ['corn', 170, 0]],
  ],
  [ // The Pumpkin Patch
    [['pumpkin', 0]],
    [['bigpumpkin', 0], ['corn', 8, 150], ['corn', 54, 196], ['corn', 100, 150]],
    [['pumpkin', 0], ['pumpkin', 205]],
    [['barrel', 0]],
    [['scarecrow', 0]],
    [['corn', 0, 96], ['corn', 52, 96], ['corn', 104, 96]],
    [['pumpkin', 0], ['barrel', 320]],
    [['bigpumpkin', 0], ['pumpkin', 300]],
    [['pie', 0]],
    [['scarecrow', 0], ['corn', 180, 0], ['corn', 232, 0]],
  ],
  [ // The Farmhouse Kitchen
    [['oven', 0]],
    [['knife', 0], ['corn', 60, 0]],
    [['table', 0], ['corn', 60, 8], ['corn', 112, 8], ['corn', 164, 8]],
    [['burner', 0]],
    [['sacks', 0]],
    [['pot', 0], ['pot', 240]],
    [['oven', 0], ['knife', 420]],
    [['burner', 0], ['burner', 260]],
    [['table', 0]],
    [['corn', 0, 0], ['corn', 52, 40], ['corn', 104, 0]],
    [['pie', 0]],
    [['knife', 0], ['knife', 300]],
  ],
];

function stageIndexAt(metres) {
  for (let i = 0; i < STAGES.length; i += 1) if (metres < STAGES[i].until) return i;
  return STAGES.length - 1;
}

export function createWorld(random) {
  const state = {
    time: 0,
    distance: 0,
    speed: 0,
    score: 0,
    corn: 0,
    hearts: HEARTS,
    over: null, // null | 'caught' | 'escaped'
    stage: 0,
    stageBannerT: 0,
    stamina: STAMINA.max,
    turkey: null,
    farmer: null,
    entities: [],
    particles: [],
    floaters: [],
    nextSpawnX: 0,
    stats: { closeCalls: 0, hides: 0, jumps: 0 },
  };

  function freshTurkey() {
    return {
      x: 0, // world px of the turkey's centre; always distance * PXM
      y: 0, // height of the feet above the ground, px
      vy: 0,
      grounded: true,
      ducking: false,
      sliding: false,
      hidden: null, // the hiding-spot entity it is inside, or null
      invulnT: 0,
      stumbleT: 0,
      coyoteT: 0,
      jumpBufferT: 0,
      jumpsUsed: 0,
      runPhase: 0,
      landSquashT: 0,
    };
  }

  function freshFarmer() {
    return {
      gap: FARMER.startGap,
      state: 'chase',
      stateT: 0,
      awareness: 0,
      lungeCooldown: 1.2,
      burstT: 0,
      runPhase: 0,
      animT: 0,
    };
  }

  function reset() {
    state.time = 0;
    state.distance = 0;
    state.speed = TURKEY.cruise;
    state.score = 0;
    state.corn = 0;
    state.hearts = HEARTS;
    state.over = null;
    state.stage = 0;
    state.stageBannerT = 2.2; // the first stage announces itself too
    state.stamina = STAMINA.max;
    state.turkey = freshTurkey();
    state.farmer = freshFarmer();
    state.entities = [{ kind: 'gate', x: COURSE_METRES * PXM, w: 150, h: 300 }];
    state.particles = [];
    state.floaters = [];
    state.nextSpawnX = 900;
    state.stats = { closeCalls: 0, hides: 0, jumps: 0 };
    spawnAhead();
  }

  /** Start partway along the course (screenshot scenes use this; the live game never does). */
  function startAt(metres) {
    reset();
    state.distance = metres;
    state.turkey.x = metres * PXM;
    state.stage = stageIndexAt(metres);
    state.stageBannerT = 0;
    state.entities = state.entities.filter((e) => e.kind === 'gate');
    state.nextSpawnX = state.turkey.x + 700;
    spawnAhead();
  }

  function spawnAhead() {
    const cameraRight = state.turkey.x + FIELD.width;
    while (state.nextSpawnX < cameraRight + 900) {
      const metres = state.nextSpawnX / PXM;
      if (metres > FINAL_CLEAR_METRES) {
        state.nextSpawnX = COURSE_METRES * PXM + 2000;
        break;
      }
      const stage = stageIndexAt(metres);
      const patterns = PATTERNS[stage];
      const pattern = patterns[Math.floor(random() * patterns.length)];
      let extent = 0;
      for (const [kind, dx, dy] of pattern) {
        extent = Math.max(extent, dx + 120);
        place(kind, state.nextSpawnX + dx, dy ?? 0);
      }
      const progress = metres / COURSE_METRES;
      const gap = 560 - progress * 190 + random() * 260;
      state.nextSpawnX += extent + gap;
    }
  }

  function place(kind, x, dy) {
    const e = { kind, x, w: 40, h: 40, dead: false };
    if (kind === 'corn' || kind === 'pie') {
      e.w = kind === 'corn' ? 30 : 38;
      e.h = e.w;
      e.y = dy; // height above the ground
      e.bobPhase = random() * Math.PI * 2;
    } else if (kind === 'mud') {
      e.w = 170 + random() * 110;
      e.h = 14;
    } else if (HIDE_KINDS.has(kind)) {
      e.w = 116;
      e.h = 96;
    } else if (kind === 'knife') {
      e.w = OBSTACLES.knife.w;
      e.h = OBSTACLES.knife.h;
      e.phase = 'hanging'; // hanging -> falling -> stuck -> gone
      e.dropY = 0; // px fallen so far
      e.phaseT = 0;
    } else if (kind === 'oven') {
      e.w = OBSTACLES.oven.w;
      e.h = OBSTACLES.oven.h;
      e.cycle = random() * 2; // flame cycle clock
    } else if (kind === 'burner') {
      e.w = OBSTACLES.burner.w;
      e.h = OBSTACLES.burner.h;
      e.cycle = random() * 2;
    } else if (kind === 'barrel') {
      e.w = OBSTACLES.barrel.w;
      e.h = OBSTACLES.barrel.h;
      e.roll = 0;
    } else {
      const box = OBSTACLES[kind];
      e.w = box.w;
      e.h = box.h;
    }
    state.entities.push(e);
  }

  function floater(x, y, text, color, size = 22) {
    state.floaters.push({ x, y, text, color, size, t: 0, life: 1.15 });
  }

  function burst(x, y, colors, count, speed = 260) {
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2;
      const v = speed * (0.3 + random() * 0.7);
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.abs(Math.sin(angle) * v) + 120,
        t: 0, life: 0.5 + random() * 0.5,
        color: colors[Math.floor(random() * colors.length)],
        size: 3 + random() * 5,
      });
    }
  }

  function dust(x, count = 1) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x: x + (random() - 0.5) * 40, y: 2,
        vx: -60 - random() * 90, vy: 30 + random() * 60,
        t: 0, life: 0.4 + random() * 0.3,
        color: 'rgba(214, 186, 150, 0.7)', size: 4 + random() * 6,
      });
    }
  }

  // ---- harm ---------------------------------------------------------------

  function hurt(events, why) {
    const t = state.turkey;
    if (t.invulnT > 0 || state.over) return events;
    state.hearts -= 1;
    t.invulnT = TURKEY.invulnerableSeconds;
    t.stumbleT = TURKEY.stumbleSeconds;
    // A hit is punishment enough: the farmer never gets to pile on from point blank.
    if (state.farmer.gap < 8) state.farmer.gap = 8;
    burst(t.x, 60, [PALETTE.featherA, PALETTE.featherB, PALETTE.featherC, PALETTE.head], 14);
    floater(t.x, 150, why, PALETTE.danger, 26);
    events |= EVENT.HIT;
    if (state.hearts <= 0) {
      state.over = 'caught';
      events |= EVENT.CAUGHT;
    }
    return events;
  }

  function grab(events) {
    const f = state.farmer;
    f.state = 'stumble';
    f.stateT = FARMER.stumbleSeconds;
    f.lungeCooldown = 2.4;
    state.farmer.gap = 11;
    floater(state.turkey.x, 170, 'GOTCHA!', PALETTE.danger, 28);
    return hurt(events | EVENT.GRAB, 'Caught by the farmer!');
  }

  // ---- the farmer -----------------------------------------------------------

  function stepFarmer(dt, events) {
    const f = state.farmer;
    const t = state.turkey;
    const progress = state.distance / COURSE_METRES;
    f.animT += dt;
    f.lungeCooldown = Math.max(0, f.lungeCooldown - dt);
    f.burstT = Math.max(0, f.burstT - dt);
    const chaseSpeed = FARMER.baseSpeed + FARMER.speedRamp * progress
      + (f.gap > FARMER.trailGap ? FARMER.trailBonus : 0);

    if (f.state === 'chase') {
      const speed = f.burstT > 0 ? FARMER.spottedBurstSpeed : chaseSpeed;
      f.gap += (state.speed - speed) * dt;
      f.runPhase += dt * speed * 1.6;
      if (t.hidden) {
        if (f.gap <= FARMER.spotStopGap) {
          f.state = 'search';
          f.stateT = FARMER.searchSeconds;
        }
      } else if (f.gap <= FARMER.lungeRange && f.lungeCooldown <= 0 && t.stumbleT <= 0 && t.invulnT <= 0) {
        f.state = 'lunge';
        f.stateT = FARMER.lungeSeconds;
        events |= EVENT.LUNGE;
      } else if (f.gap <= 0.6) {
        events = grab(events);
      }
    } else if (f.state === 'lunge') {
      f.gap -= FARMER.lungeCloseRate * dt;
      f.stateT -= dt;
      if (f.stateT <= 0) {
        if (!t.hidden && f.gap <= FARMER.grabRange && t.y < FARMER.dodgeHeight) {
          events = grab(events);
        } else {
          f.state = 'stumble';
          f.stateT = FARMER.stumbleSeconds;
          f.lungeCooldown = 2.2;
          events |= EVENT.STUMBLE;
          if (!t.hidden && f.gap < 5.5) {
            state.score += SCORE.closeCall;
            state.stats.closeCalls += 1;
            floater(t.x, 170, `Close call! +${SCORE.closeCall}`, PALETTE.corn, 24);
            events |= EVENT.CLOSE_CALL;
          }
        }
      }
    } else if (f.state === 'stumble') {
      f.gap += state.speed * dt + 1.1 * dt; // he is down; the turkey runs on
      f.stateT -= dt;
      if (f.stateT <= 0) f.state = 'chase';
    } else if (f.state === 'search') {
      f.stateT -= dt;
      if (f.stateT <= 0) f.state = 'trail';
    } else if (f.state === 'trail') {
      f.gap += 3 * dt;
      if (f.gap >= FARMER.loseTrailGap) {
        f.state = 'chase';
        f.awareness = 0;
      }
    } else if (f.state === 'yank') {
      f.gap -= 11.5 * dt;
      f.runPhase += dt * 17;
      if (!t.hidden) {
        f.state = 'chase';
        f.burstT = FARMER.spottedBurstSeconds;
      } else if (f.gap <= FARMER.yankRange) {
        t.hidden = null;
        f.state = 'stumble';
        f.stateT = FARMER.stumbleSeconds;
        f.gap = 11;
        floater(t.x, 170, 'Yanked out!', PALETTE.danger, 26);
        events = hurt(events | EVENT.GRAB, 'Dragged from hiding!');
      }
    }

    // His alertness: it climbs while the turkey is in the open near him, drains while hidden.
    if (t.hidden) f.awareness = Math.max(0, f.awareness - dt / FARMER.searchSeconds);
    else if (f.gap < 18) f.awareness = Math.min(1, f.awareness + 0.55 * dt);
    else f.awareness = Math.max(0, f.awareness - 0.25 * dt);
    return events;
  }

  // ---- the turkey -----------------------------------------------------------

  function turkeyBox() {
    const t = state.turkey;
    const height = t.hidden ? TURKEY.height : t.sliding ? TURKEY.slideHeight : t.ducking ? TURKEY.duckHeight : TURKEY.height;
    return { left: t.x - 24, right: t.x + 24, bottom: t.y, top: t.y + height, height };
  }

  function stepTurkey(dt, control, events) {
    const t = state.turkey;
    t.invulnT = Math.max(0, t.invulnT - dt);
    t.stumbleT = Math.max(0, t.stumbleT - dt);
    t.coyoteT = Math.max(0, t.coyoteT - dt);
    t.jumpBufferT = Math.max(0, t.jumpBufferT - dt);
    t.landSquashT = Math.max(0, t.landSquashT - dt);
    if (control.jumpPressed) t.jumpBufferT = 0.12;

    // Hiding: duck inside a spot. Letting go of duck, moving or jumping comes out.
    if (t.hidden) {
      state.speed = 0;
      const bolting = !control.down || control.jumpPressed || control.move !== 0;
      if (bolting) {
        const f = state.farmer;
        t.hidden = null;
        if ((f.state === 'search' || f.state === 'yank') && f.gap < 9) {
          f.state = 'chase';
          f.burstT = FARMER.spottedBurstSeconds;
          floater(t.x, 170, 'Spotted!', PALETTE.danger, 26);
          events |= EVENT.SPOTTED;
        }
      }
      return events;
    }
    if (control.down && t.grounded) {
      for (const e of state.entities) {
        if (!HIDE_KINDS.has(e.kind) || e.dead) continue;
        if (t.x > e.x - 6 && t.x < e.x + e.w + 6) {
          t.hidden = e;
          state.stats.hides += 1;
          events |= EVENT.HIDE;
          if (state.farmer.gap < FARMER.seenHideRange && state.farmer.state === 'chase') {
            state.farmer.state = 'yank';
            floater(t.x, 170, 'He saw you!', PALETTE.danger, 26);
            events |= EVENT.SPOTTED;
          }
          return events;
        }
      }
    }

    // Speed: arrows lean slower/faster, Shift sprints on stamina, mud drags.
    let target = control.move < 0 ? TURKEY.slow : control.move > 0 ? TURKEY.fast : TURKEY.cruise;
    const sprinting = control.sprint && control.move >= 0 && state.stamina > 0 && t.stumbleT <= 0;
    if (sprinting) {
      target = TURKEY.sprint;
      state.stamina = Math.max(0, state.stamina - STAMINA.sprintDrain * dt);
    } else {
      state.stamina = Math.min(STAMINA.max, state.stamina + STAMINA.regen * dt);
    }
    if (t.stumbleT > 0) target = 0;
    if (t.grounded && inMud()) target *= 0.7;
    const accel = state.speed < target ? 26 : 40;
    state.speed += Math.max(-accel * dt, Math.min(accel * dt, target - state.speed));

    // Vertical: buffered jumps, a coyote moment, a wing-flap second jump, fast fall.
    if (t.jumpBufferT > 0) {
      if (t.grounded || t.coyoteT > 0) {
        t.vy = TURKEY.jumpVelocity;
        t.grounded = false;
        t.coyoteT = 0;
        t.jumpBufferT = 0;
        t.jumpsUsed = 1;
        state.stats.jumps += 1;
        dust(t.x, 3);
        events |= EVENT.JUMP;
      } else if (t.jumpsUsed === 1) {
        t.vy = TURKEY.doubleJumpVelocity;
        t.jumpBufferT = 0;
        t.jumpsUsed = 2;
        state.stats.jumps += 1;
        burst(t.x, t.y + 6, [PALETTE.head, PALETTE.featherC], 5, 130);
        events |= EVENT.DOUBLE_JUMP;
      }
    }
    if (!t.grounded) {
      t.vy -= TURKEY.gravity * dt;
      if (control.down) t.vy -= TURKEY.fastFall * dt;
      t.y += t.vy * dt;
      if (t.y <= 0) {
        t.y = 0;
        t.vy = 0;
        t.grounded = true;
        t.jumpsUsed = 0;
        t.landSquashT = 0.14;
        dust(t.x, 4);
      }
    } else {
      t.coyoteT = 0.1;
    }

    t.ducking = control.down && t.grounded;
    t.sliding = t.ducking && state.speed > 11;
    t.runPhase += dt * state.speed * 2.4;
    if (t.grounded && state.speed > 6) {
      t.dustT = (t.dustT ?? 0) + dt;
      if (t.dustT > 0.16) {
        t.dustT = 0;
        dust(t.x - 20, 1);
      }
    }

    state.distance += state.speed * dt;
    state.score += state.speed * dt * (SCORE.perSecondAtCruise / TURKEY.cruise);
    t.x = state.distance * PXM;
    return events;
  }

  function inMud() {
    const t = state.turkey;
    for (const e of state.entities) {
      if (e.kind === 'mud' && !e.dead && t.x > e.x && t.x < e.x + e.w) return true;
    }
    return false;
  }

  // ---- things in the world ----------------------------------------------------

  function ovenFiring(e) {
    return ovenIsFiring(e);
  }

  function burnerLit(e) {
    return burnerIsLit(e);
  }

  function stepEntities(dt, events) {
    const t = state.turkey;
    const box = turkeyBox();
    const cameraLeft = t.x - FIELD.width;

    for (const e of state.entities) {
      if (e.dead) continue;
      if (e.x + e.w < cameraLeft - 500 && e.kind !== 'gate') {
        e.dead = true;
        continue;
      }
      if (e.kind === 'barrel') {
        e.x -= 62 * dt; // barrels roll toward the turkey
        e.roll += dt * 4;
      } else if (e.kind === 'oven') {
        const was = ovenFiring(e);
        e.cycle += dt;
        if (!was && ovenFiring(e) && Math.abs(e.x - t.x) < 700) events |= EVENT.FLAME;
      } else if (e.kind === 'burner') {
        e.cycle += dt;
      } else if (e.kind === 'knife') {
        events = stepKnife(dt, e, events);
      }

      if (state.over || t.hidden) continue;

      // Pickups.
      if (e.kind === 'corn' || e.kind === 'pie') {
        const cy = e.y + 20;
        if (Math.abs(t.x - (e.x + e.w / 2)) < 44 && box.bottom < cy + 26 && box.top > cy - 26) {
          e.dead = true;
          if (e.kind === 'corn') {
            state.corn += 1;
            state.score += SCORE.corn;
            state.stamina = Math.min(STAMINA.max, state.stamina + STAMINA.cornRefill);
            floater(t.x, 150, `+${SCORE.corn}`, PALETTE.corn, 22);
            events |= EVENT.CORN;
          } else {
            state.hearts = Math.min(HEARTS, state.hearts + 1);
            floater(t.x, 150, '+1 heart', PALETTE.heart, 24);
            events |= EVENT.PIE;
          }
        }
        continue;
      }
      if (HIDE_KINDS.has(e.kind) || e.kind === 'mud' || e.kind === 'gate') continue;

      // Hazards.
      if (e.kind === 'knife') {
        if (e.phase === 'stuck' && overlap(box, e.x + 2, e.x + e.w - 2, 0, 44)) {
          e.dead = true;
          events = hurt(events, 'Stuck by a knife!');
        }
        continue;
      }
      if (e.kind === 'oven') {
        if (overlap(box, e.x, e.x + e.w, 0, e.h - 14)) {
          events = hurt(events, 'Into the oven!');
        } else if (ovenFiring(e)) {
          // The flame jet reaches left from the oven's mouth, low over the floor.
          if (overlap(box, e.x - 148, e.x - 6, 0, 46)) events = hurt(events, 'Roasted!');
        }
        continue;
      }
      if (e.kind === 'burner') {
        if (burnerLit(e) && t.grounded && overlap(box, e.x, e.x + e.w, 0, 20)) {
          events = hurt(events, 'Hot feet!');
        }
        continue;
      }
      if (e.kind === 'table') {
        const under = box.height <= OBSTACLES.table.clearance && t.y === 0;
        if (!under && overlap(box, e.x, e.x + e.w, 0, e.h)) {
          events = hurt(events, 'Bonked on the table!');
        }
        continue;
      }
      // Plain obstacles: fence, pitchfork, pumpkin, bigpumpkin, pot, barrel.
      if (overlap(box, e.x + 4, e.x + e.w - 4, 0, e.h - 8)) {
        events = hurt(events, 'Crashed!');
      }
    }
    return events;
  }

  function stepKnife(dt, e, events) {
    const t = state.turkey;
    e.phaseT += dt;
    if (e.phase === 'hanging') {
      if (!state.over && t.x > e.x - 70 && t.x < e.x + 60) {
        e.phase = 'falling';
        e.phaseT = 0;
        events |= EVENT.KNIFE_DROP;
      }
    } else if (e.phase === 'falling') {
      e.dropY += 1100 * dt;
      if (e.dropY >= 210) { // its tip hangs 210 px up; now it reaches the ground
        e.dropY = 210;
        e.phase = 'stuck';
        e.phaseT = 0;
        if (!state.over && !t.hidden && Math.abs(t.x - (e.x + e.w / 2)) < 30 && t.y < 50) {
          events = hurt(events, 'Pinned by a knife!');
          e.dead = true;
        }
      }
    } else if (e.phase === 'stuck' && e.phaseT > 1.1) {
      e.phase = 'gone';
      e.dead = true;
    }
    return events;
  }

  function overlap(box, left, right, bottom, top) {
    return box.left < right && box.right > left && box.bottom < top && box.top > bottom;
  }

  // ---- the step ---------------------------------------------------------------

  function step(dt, control) {
    let events = EVENT.NONE;
    state.time += dt;
    if (state.over) {
      updateCosmetics(dt);
      return events;
    }
    const stageBefore = state.stage;
    events = stepTurkey(dt, control, events);
    if (!state.over) events = stepEntities(dt, events);
    if (!state.over) events = stepFarmer(dt, events);
    state.stage = stageIndexAt(state.distance);
    if (state.stage !== stageBefore) {
      state.score += SCORE.stageClear;
      state.stageBannerT = 2.4;
      floater(state.turkey.x, 210, `${STAGES[state.stage].name}! +${SCORE.stageClear}`, PALETTE.paper, 26);
      events |= EVENT.STAGE;
    }
    state.stageBannerT = Math.max(0, state.stageBannerT - dt);
    if (state.distance >= COURSE_METRES && !state.over) {
      state.over = 'escaped';
      state.score += SCORE.escaped + state.hearts * SCORE.heartBonus;
      events |= EVENT.ESCAPED;
    }
    spawnAhead();
    state.entities = state.entities.filter((e) => !e.dead || e.kind === 'gate');
    updateCosmetics(dt);
    return events;
  }

  function updateCosmetics(dt) {
    for (const p of state.particles) {
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 700 * dt;
      if (p.y < 0) { p.y = 0; p.vy = 0; }
    }
    state.particles = state.particles.filter((p) => p.t < p.life);
    for (const f of state.floaters) {
      f.t += dt;
      f.y += 34 * dt;
    }
    state.floaters = state.floaters.filter((f) => f.t < f.life);
  }

  reset();
  return { state, reset, startAt, step, ovenFiring, burnerLit };
}
