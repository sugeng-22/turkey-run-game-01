// Everything Gobble Run looks like: the three stage backdrops with parallax, the
// entities, the turkey and the farmer, the HUD, and the four screens (title, play,
// paused, over). The world module holds the rules; this one only paints state, in a
// fixed 1280x720 logical field that is letterboxed into whatever window it gets.
import {
  COURSE_METRES, FIELD, FONT, HEARTS, PALETTE, PXM, STAGES, STAMINA, TURKEY_SCREEN_X,
} from './config.js';
import { hash01 } from './random.js';
import {
  HIDE_KINDS, burnerIsGlowing, burnerIsLit, ovenIsFiring, ovenIsGlowing,
} from './world.js';
import {
  drawBarrel, drawBurner, drawCorn, drawFarmer, drawFence, drawGate, drawHayBale,
  drawKnife, drawMud, drawOven, drawPie, drawPitchfork, drawPot, drawPumpkin,
  drawSacks, drawScarecrow, drawTable, drawTurkey, drawTurkeyHead,
} from './sprites.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const W = FIELD.width;
const H = FIELD.height;
const GY = FIELD.groundY;

function text(ctx, str, x, y, { size = 20, color = PALETTE.cream, align = 'left', weight = 700, outline = null } = {}) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  if (outline) {
    ctx.lineWidth = Math.max(3, size / 7);
    ctx.strokeStyle = outline;
    ctx.lineJoin = 'round';
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function panel(ctx, x, y, w, h, r = 18) {
  ctx.fillStyle = PALETTE.panel;
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
}

function heart(ctx, x, y, s, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.bezierCurveTo(-16, -4, -8, -16, 0, -7);
  ctx.bezierCurveTo(8, -16, 16, -4, 0, 10);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = PALETTE.heart;
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(255, 246, 232, 0.5)';
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }
  ctx.restore();
}

// ---- backdrops ----------------------------------------------------------------------

function skyGradient(ctx, stage) {
  const g = ctx.createLinearGradient(0, 0, 0, GY);
  if (stage === 0) {
    g.addColorStop(0, PALETTE.dawnSkyTop);
    g.addColorStop(1, PALETTE.dawnSkyBottom);
  } else if (stage === 1) {
    g.addColorStop(0, PALETTE.daySkyTop);
    g.addColorStop(1, PALETTE.daySkyBottom);
  } else {
    g.addColorStop(0, '#f0c268');
    g.addColorStop(1, PALETTE.kitchenWall);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawClouds(ctx, cameraX, stage) {
  ctx.fillStyle = 'rgba(255, 250, 238, 0.85)';
  const f = 0.12;
  const cell = 340;
  const start = Math.floor((cameraX * f) / cell);
  for (let i = -1; i < 6; i += 1) {
    const c = start + i;
    const h = hash01(c * 7 + stage * 131);
    const x = c * cell - cameraX * f + h * 120;
    const y = 46 + h * 90;
    const s = 0.7 + hash01(c * 13) * 0.7;
    ctx.beginPath();
    ctx.ellipse(x, y, 52 * s, 17 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 30 * s, y + 4, 38 * s, 13 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 34 * s, y + 5, 32 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // The sun, low and golden.
  ctx.fillStyle = PALETTE.sun;
  ctx.beginPath();
  ctx.arc(1120 - cameraX * 0.03 % 60, 96, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 223, 107, 0.3)';
  ctx.beginPath();
  ctx.arc(1120 - cameraX * 0.03 % 60, 96, 52, 0, Math.PI * 2);
  ctx.fill();
}

function drawFarLayer(ctx, cameraX, stage) {
  if (stage === 2) {
    // Kitchen wall: windows with daylight, a shelf of jars, wainscot.
    ctx.fillStyle = PALETTE.kitchenWallDark;
    ctx.fillRect(0, 428, W, 10);
    const f = 0.18;
    const cell = 430;
    const start = Math.floor((cameraX * f) / cell);
    for (let i = -1; i < 5; i += 1) {
      const x = (start + i) * cell - cameraX * f + 60;
      ctx.fillStyle = '#fff3cf';
      ctx.beginPath();
      ctx.roundRect(x, 74, 128, 168, 10);
      ctx.fill();
      ctx.strokeStyle = PALETTE.woodDark;
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 64, 74);
      ctx.lineTo(x + 64, 242);
      ctx.moveTo(x, 158);
      ctx.lineTo(x + 128, 158);
      ctx.stroke();
      ctx.fillStyle = 'rgba(126, 200, 227, 0.5)';
      ctx.fillRect(x + 6, 80, 52, 72);
    }
    // Shelf with jars and a rolling pin, a little closer.
    const f2 = 0.34;
    const cell2 = 360;
    const start2 = Math.floor((cameraX * f2) / cell2);
    ctx.fillStyle = PALETTE.wood;
    for (let i = -1; i < 6; i += 1) {
      const c = start2 + i;
      const x = c * cell2 - cameraX * f2;
      ctx.fillRect(x, 300, 240, 10);
      for (let j = 0; j < 3; j += 1) {
        const jx = x + 26 + j * 74;
        const jh = 34 + hash01(c * 31 + j * 7) * 22;
        ctx.fillStyle = ['#cfe8d8', '#f2d5a0', '#e8b4a0'][j % 3];
        ctx.beginPath();
        ctx.roundRect(jx, 300 - jh, 40, jh, 6);
        ctx.fill();
        ctx.fillStyle = PALETTE.wood;
      }
    }
    return;
  }
  // Rolling hills, then a barn (farmyard) or a tree line (pumpkin patch).
  ctx.fillStyle = PALETTE.hillFar;
  const f = 0.22;
  const cell = 300;
  const start = Math.floor((cameraX * f) / cell);
  for (let i = -2; i < 7; i += 1) {
    const c = start + i;
    const x = c * cell - cameraX * f;
    const hh = 90 + hash01(c * 17 + stage) * 70;
    ctx.beginPath();
    ctx.ellipse(x + cell / 2, GY + 40, cell * 0.72, hh, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  }
  if (stage === 0) {
    const barnCell = 1250;
    const bc = Math.floor((cameraX * f) / barnCell);
    for (let i = -1; i < 3; i += 1) {
      const x = (bc + i) * barnCell - cameraX * f + 420;
      ctx.fillStyle = '#a03d2a';
      ctx.fillRect(x, GY - 168, 150, 108);
      ctx.fillStyle = '#7e2f20';
      ctx.beginPath();
      ctx.moveTo(x - 10, GY - 168);
      ctx.lineTo(x + 75, GY - 216);
      ctx.lineTo(x + 160, GY - 168);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f3e2c7';
      ctx.fillRect(x + 56, GY - 128, 38, 68);
      ctx.strokeStyle = '#7e2f20';
      ctx.lineWidth = 4;
      ctx.strokeRect(x + 56, GY - 128, 38, 68);
    }
  } else {
    ctx.fillStyle = '#4e7d3a';
    const tc = 120;
    const ts = Math.floor((cameraX * 0.3) / tc);
    for (let i = -1; i < 13; i += 1) {
      const c = ts + i;
      const x = c * tc - cameraX * 0.3;
      const s = 0.8 + hash01(c * 19) * 0.5;
      ctx.beginPath();
      ctx.arc(x, GY - 120 * s, 44 * s, 0, Math.PI * 2);
      ctx.arc(x + 30 * s, GY - 96 * s, 32 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawMidLayer(ctx, cameraX, stage) {
  if (stage === 2) {
    // Counters and hanging pans.
    ctx.fillStyle = '#8a4f24';
    const f = 0.55;
    const cell = 300;
    const start = Math.floor((cameraX * f) / cell);
    for (let i = -1; i < 6; i += 1) {
      const c = start + i;
      const x = c * cell - cameraX * f;
      ctx.fillRect(x, GY - 128, 210, 16);
      ctx.fillStyle = '#74431e';
      ctx.fillRect(x + 8, GY - 112, 194, 112);
      ctx.fillStyle = '#8a4f24';
      ctx.fillRect(x + 20, GY - 96, 76, 62);
      ctx.fillRect(x + 110, GY - 96, 76, 62);
      ctx.fillStyle = '#5d3413';
      ctx.fillRect(x + 88, GY - 70, 6, 6);
      ctx.fillRect(x + 170, GY - 70, 6, 6);
      ctx.fillStyle = '#8a4f24';
    }
    // Hanging pans from the ceiling, closer still.
    const f2 = 0.7;
    const cell2 = 260;
    const start2 = Math.floor((cameraX * f2) / cell2);
    for (let i = -1; i < 7; i += 1) {
      const c = start2 + i;
      const x = c * cell2 - cameraX * f2 + 90;
      const len = 44 + hash01(c * 23) * 40;
      ctx.strokeStyle = 'rgba(90, 60, 30, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, len);
      ctx.stroke();
      ctx.fillStyle = '#565e66';
      ctx.beginPath();
      ctx.arc(x, len + 18, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#788089';
      ctx.beginPath();
      ctx.arc(x - 5, len + 13, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  // Fence line and bushes (farmyard) or vine rows (pumpkin patch).
  const f = 0.55;
  const cell = 150;
  const start = Math.floor((cameraX * f) / cell);
  for (let i = -1; i < 11; i += 1) {
    const c = start + i;
    const x = c * cell - cameraX * f;
    if (stage === 0) {
      ctx.fillStyle = 'rgba(110, 66, 28, 0.75)';
      ctx.fillRect(x, GY - 62, 7, 62);
      ctx.fillRect(x, GY - 52, cell, 5);
      ctx.fillRect(x, GY - 30, cell, 5);
      if (hash01(c * 29) > 0.55) {
        ctx.fillStyle = 'rgba(90, 130, 62, 0.8)';
        ctx.beginPath();
        ctx.ellipse(x + 96, GY - 18, 34, 17, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = 'rgba(93, 122, 44, 0.85)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, GY - 6);
      ctx.quadraticCurveTo(x + cell / 2, GY - 30, x + cell, GY - 6);
      ctx.stroke();
      if (hash01(c * 29) > 0.4) {
        ctx.fillStyle = PALETTE.pumpkin;
        ctx.beginPath();
        ctx.ellipse(x + 60 + hash01(c * 7) * 60, GY - 10, 13, 9, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawGround(ctx, cameraX, stage) {
  if (stage === 2) {
    // Checkered kitchen floor, tiles locked to the world.
    const tile = 62;
    const start = Math.floor(cameraX / tile);
    for (let i = -1; i < 23; i += 1) {
      const c = start + i;
      const x = c * tile - cameraX;
      for (let row = 0; row < 2; row += 1) {
        ctx.fillStyle = (c + row) % 2 === 0 ? PALETTE.kitchenFloorLight : PALETTE.kitchenFloor;
        ctx.fillRect(x, GY + row * 48, tile, 48);
      }
    }
    ctx.fillStyle = '#6e421c';
    ctx.fillRect(0, GY - 4, W, 6);
    return;
  }
  ctx.fillStyle = stage === 0 ? PALETTE.grass : '#8fae4a';
  ctx.fillRect(0, GY, W, 16);
  ctx.fillStyle = PALETTE.dirt;
  ctx.fillRect(0, GY + 16, W, H - GY);
  // A lighter worn path and speckle, locked to the world.
  ctx.fillStyle = 'rgba(255, 235, 190, 0.16)';
  ctx.fillRect(0, GY + 22, W, 30);
  const cell = 46;
  const start = Math.floor(cameraX / cell);
  for (let i = -1; i < 30; i += 1) {
    const c = start + i;
    const x = c * cell - cameraX;
    const h = hash01(c * 37 + stage * 7);
    ctx.fillStyle = h > 0.5 ? 'rgba(90, 55, 20, 0.35)' : 'rgba(255, 240, 200, 0.2)';
    ctx.beginPath();
    ctx.ellipse(x + h * 30, GY + 34 + h * 44, 5 + h * 6, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    if (h > 0.72) {
      ctx.strokeStyle = stage === 0 ? '#5d8a3c' : '#7a9e43';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 8, GY + 2);
      ctx.lineTo(x + 5, GY - 8);
      ctx.moveTo(x + 12, GY + 2);
      ctx.lineTo(x + 14, GY - 9);
      ctx.stroke();
    }
  }
}

function drawBackground(ctx, state, cameraX) {
  const stage = state.stage;
  skyGradient(ctx, stage);
  drawClouds(ctx, cameraX, stage);
  drawFarLayer(ctx, cameraX, stage);
  drawMidLayer(ctx, cameraX, stage);
  drawGround(ctx, cameraX, stage);
  // Near a boundary, the next stage fades in over this one.
  for (let i = 0; i < STAGES.length - 1; i += 1) {
    const boundary = STAGES[i].until;
    if (state.distance > boundary - 42 && state.distance < boundary + 8 && stage === i) {
      const a = Math.min(1, Math.max(0, (state.distance - (boundary - 42)) / 46));
      ctx.save();
      ctx.globalAlpha = a;
      skyGradient(ctx, i + 1);
      drawFarLayer(ctx, cameraX, i + 1);
      drawMidLayer(ctx, cameraX, i + 1);
      drawGround(ctx, cameraX, i + 1);
      ctx.restore();
    }
  }
}

// ---- entities -------------------------------------------------------------------------

function drawEntity(ctx, state, e, cameraX) {
  const sx = e.x - cameraX;
  if (sx + e.w < -260 || sx > W + 260) return;
  switch (e.kind) {
    case 'gate': drawGate(ctx, sx, GY); break;
    case 'mud': drawMud(ctx, sx, GY, e.w); break;
    case 'hay': drawHayBale(ctx, sx, GY, e.w); break;
    case 'scarecrow': drawScarecrow(ctx, sx, GY, e.w); break;
    case 'sacks': drawSacks(ctx, sx, GY, e.w); break;
    case 'fence': drawFence(ctx, sx, GY, e.w); break;
    case 'pitchfork': drawPitchfork(ctx, sx + e.w / 2 - 13, GY); break;
    case 'pumpkin': drawPumpkin(ctx, sx, GY, e.w, e.h); break;
    case 'bigpumpkin': drawPumpkin(ctx, sx, GY, e.w, e.h); break;
    case 'pot': drawPot(ctx, sx, GY, e.w, e.h); break;
    case 'barrel': drawBarrel(ctx, sx, GY, e.w, e.roll); break;
    case 'oven': drawOven(ctx, sx, GY, e.w, e.h, ovenIsFiring(e), ovenIsGlowing(e) || ovenIsFiring(e)); break;
    case 'burner': drawBurner(ctx, sx, GY, e.w, burnerIsLit(e), burnerIsGlowing(e), state.time); break;
    case 'table': drawTable(ctx, sx, GY, e.w, e.h); break;
    case 'corn': drawCorn(ctx, sx + e.w / 2, GY - e.y - 18, state.time * 3 + e.bobPhase); break;
    case 'pie': drawPie(ctx, sx + e.w / 2, GY - e.y - 12, state.time * 3 + e.bobPhase); break;
    case 'knife': {
      const cx = sx + e.w / 2;
      // The shadow on the floor is the warning: it sharpens as the knife falls.
      const tipY = GY - 210 + e.dropY;
      ctx.fillStyle = `rgba(30, 16, 8, ${0.14 + (e.dropY / 210) * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(cx, GY + 6, 16 + e.dropY * 0.05, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      if (e.phase === 'hanging') {
        ctx.strokeStyle = 'rgba(90, 60, 30, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 34, GY - 330);
        ctx.lineTo(cx + 34, GY - 330);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, GY - 330);
        ctx.lineTo(cx, tipY - 64);
        ctx.stroke();
      }
      drawKnife(ctx, cx, e.phase === 'stuck' ? GY : tipY);
      break;
    }
    default: break;
  }
  // A hidden turkey peeks out of its spot, eyes on the farmer.
  if (state.turkey.hidden === e) {
    drawTurkeyHead(ctx, sx + e.w / 2 - 6, GY - e.h + 26, 1);
  }
}

// ---- HUD --------------------------------------------------------------------------------

function drawHeartRow(ctx, state) {
  for (let i = 0; i < HEARTS; i += 1) heart(ctx, 44 + i * 42, 44, 1.25, i < state.hearts);
  // Stamina for sprinting.
  ctx.fillStyle = 'rgba(45, 26, 18, 0.55)';
  ctx.beginPath();
  ctx.roundRect(24, 66, 128, 12, 6);
  ctx.fill();
  ctx.fillStyle = state.stamina > 25 ? PALETTE.featherC : PALETTE.danger;
  ctx.beginPath();
  ctx.roundRect(26, 68, 124 * (state.stamina / STAMINA.max), 8, 4);
  ctx.fill();
  text(ctx, 'SPRINT', 24, 62, { size: 11, color: 'rgba(255,246,232,0.85)' });
}

function drawProgress(ctx, state) {
  const x0 = 356;
  const x1 = 924;
  const y = 26;
  const stageColors = ['#77a84f', '#e8762a', '#c1442e'];
  let from = 0;
  ctx.save();
  for (let i = 0; i < STAGES.length; i += 1) {
    const to = STAGES[i].until / COURSE_METRES;
    ctx.fillStyle = stageColors[i];
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x0 + (x1 - x0) * from, y, (x1 - x0) * (to - from), 13);
    from = to;
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(45, 26, 18, 0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x0, y, x1 - x0, 13);
  // The farmer's marker trails the turkey's.
  const progress = Math.min(1, state.distance / COURSE_METRES);
  const farmerProgress = Math.max(0, (state.distance - state.farmer.gap) / COURSE_METRES);
  ctx.fillStyle = PALETTE.danger;
  ctx.beginPath();
  ctx.arc(x0 + (x1 - x0) * farmerProgress, y + 6.5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.arc(x0 + (x1 - x0) * progress, y + 6.5, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.stroke();
  text(ctx, 'FREEDOM →', x1 + 12, y + 13, { size: 14, color: PALETTE.cream, outline: 'rgba(45,26,18,0.7)' });
  text(ctx, `${Math.floor(state.distance)} m of ${COURSE_METRES} m · ${STAGES[state.stage].name}`, (x0 + x1) / 2, y + 34, {
    size: 15, align: 'center', color: PALETTE.cream, outline: 'rgba(45,26,18,0.7)',
  });
  ctx.restore();
}

function drawScore(ctx, state, best) {
  text(ctx, `${Math.floor(state.score)}`, W - 28, 52, { size: 34, align: 'right', color: PALETTE.cream, outline: 'rgba(45,26,18,0.65)' });
  text(ctx, 'SCORE', W - 28, 24, { size: 12, align: 'right', color: 'rgba(255,246,232,0.85)' });
  drawCorn(ctx, W - 118, 82, 0);
  text(ctx, `× ${state.corn}`, W - 96, 90, { size: 20, color: PALETTE.cream, outline: 'rgba(45,26,18,0.6)' });
  text(ctx, `BEST ${Math.floor(Math.max(best, state.score))}`, W - 28, 118, { size: 14, align: 'right', color: 'rgba(255,246,232,0.85)' });
}

function drawFarmerWarnings(ctx, state) {
  const f = state.farmer;
  const sx = TURKEY_SCREEN_X - f.gap * PXM;
  if (f.state === 'search') {
    // A bubble over the spot he is searching: a draining ring and a question mark.
    const bx = Math.min(W - 70, TURKEY_SCREEN_X + 130);
    ctx.fillStyle = 'rgba(255, 246, 232, 0.92)';
    ctx.beginPath();
    ctx.ellipse(bx, 150, 30, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '?', bx, 160, { size: 30, align: 'center', color: PALETTE.ink });
    ctx.strokeStyle = PALETTE.danger;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(bx, 150, 27, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - f.awareness));
    ctx.stroke();
    text(ctx, 'HIDDEN… stay still!', TURKEY_SCREEN_X + 60, 120, { size: 19, color: PALETTE.cream, outline: 'rgba(45,26,18,0.8)' });
    return;
  }
  if (sx < -70 && (f.state === 'chase' || f.state === 'lunge' || f.state === 'yank') && f.gap < 17) {
    // Off-screen but close: a warning arrow at the left edge.
    const pulse = 0.7 + Math.sin(state.time * 9) * 0.3;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = PALETTE.danger;
    ctx.beginPath();
    ctx.moveTo(8, 330);
    ctx.lineTo(46, 352);
    ctx.lineTo(8, 374);
    ctx.closePath();
    ctx.fill();
    text(ctx, `Farmer ${Math.max(0, f.gap).toFixed(0)} m behind!`, 54, 360, { size: 19, color: PALETTE.danger, outline: 'rgba(255,246,232,0.85)' });
    ctx.restore();
  }
  if (f.awareness > 0.1 && f.state === 'chase' && sx > -70) {
    // His alertness, over his head.
    ctx.fillStyle = 'rgba(45, 26, 18, 0.6)';
    ctx.beginPath();
    ctx.roundRect(sx - 26, GY - 196, 52, 9, 4);
    ctx.fill();
    ctx.fillStyle = f.awareness > 0.75 ? PALETTE.danger : PALETTE.featherC;
    ctx.beginPath();
    ctx.roundRect(sx - 24, GY - 194, 48 * f.awareness, 5, 3);
    ctx.fill();
  }
  if (f.state === 'lunge') {
    text(ctx, '!!', sx + 6, GY - 210, { size: 34, align: 'center', color: PALETTE.danger, outline: 'rgba(255,246,232,0.9)' });
  }
}

function drawBanner(ctx, state) {
  if (state.stageBannerT <= 0) return;
  const a = Math.min(1, state.stageBannerT / 0.5, (2.4 - state.stageBannerT) / 0.4 + 0.2);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, a));
  panel(ctx, W / 2 - 250, 108, 500, 64, 14);
  text(ctx, STAGES[state.stage].name.toUpperCase(), W / 2, 150, {
    size: 30, align: 'center', color: PALETTE.paper,
  });
  ctx.restore();
}

// ---- screens ------------------------------------------------------------------------------

function drawTitle(ctx, state, best) {
  ctx.fillStyle = 'rgba(58, 30, 10, 0.28)';
  ctx.fillRect(0, 0, W, H);
  panel(ctx, W / 2 - 390, 74, 780, 430, 22);
  text(ctx, 'GOBBLE RUN', W / 2, 168, { size: 82, align: 'center', color: PALETTE.paper, outline: PALETTE.ink });
  text(ctx, 'The Great Turkey Escape', W / 2, 208, { size: 27, align: 'center', color: PALETTE.featherC });
  text(ctx, 'Thanksgiving morning. Farmer Hank has the oven hot and the carving knife sharp.', W / 2, 258, { size: 18, align: 'center', weight: 400 });
  text(ctx, 'You are the turkey. Run 1,800 metres — farmyard, pumpkin patch and kitchen —', W / 2, 284, { size: 18, align: 'center', weight: 400 });
  text(ctx, 'to the forest gate, and be a guest at dinner no longer.', W / 2, 310, { size: 18, align: 'center', weight: 400 });
  const lines = [
    '← →  run slower / faster        ↑ / SPACE  jump (twice = wing-flap)',
    '↓  duck, slide & HIDE in hay, scarecrows and flour sacks',
    'SHIFT  sprint (corn refills it)        P pause · M mute',
  ];
  lines.forEach((line, i) => text(ctx, line, W / 2, 356 + i * 27, { size: 17, align: 'center', color: 'rgba(255,246,232,0.92)', weight: 400 }));
  if (best > 0) text(ctx, `Best score so far: ${best}`, W / 2, 452, { size: 17, align: 'center', color: PALETTE.featherC });
  const blink = 0.55 + 0.45 * Math.sin(state.time * 4);
  ctx.save();
  ctx.globalAlpha = blink;
  text(ctx, 'PRESS ENTER OR CLICK TO RUN FOR IT', W / 2, 486, { size: 22, align: 'center', color: PALETTE.cream });
  ctx.restore();
  // The stars of the show, either side of the panel.
  drawTurkey(ctx, 150, GY + 40, { runPhase: state.turkey.runPhase, airborne: false });
  drawFarmer(ctx, 1150, GY + 40, 'chase', state.farmer.runPhase);
}

function drawOver(ctx, state, best) {
  const caught = state.over === 'caught';
  ctx.fillStyle = caught ? 'rgba(70, 16, 8, 0.45)' : 'rgba(24, 52, 18, 0.4)';
  ctx.fillRect(0, 0, W, H);
  panel(ctx, W / 2 - 330, 118, 660, 470, 22);
  if (caught) {
    text(ctx, 'CAUGHT!', W / 2, 196, { size: 64, align: 'center', color: '#ff8a76', outline: PALETTE.ink });
    text(ctx, 'Farmer Hank got his Thanksgiving turkey after all…', W / 2, 232, { size: 19, align: 'center', weight: 400 });
    drawFarmer(ctx, W / 2 - 60, 356, 'win', 0);
    drawTurkeyHead(ctx, W / 2 + 34, 330, -1);
  } else {
    text(ctx, 'FREEDOM!', W / 2, 196, { size: 64, align: 'center', color: PALETTE.featherC, outline: PALETTE.ink });
    text(ctx, 'You outran Thanksgiving — the forest is yours, Waddles!', W / 2, 232, { size: 19, align: 'center', weight: 400 });
    drawGate(ctx, W / 2 - 70, 366);
    drawTurkey(ctx, W / 2 + 8, 366, { runPhase: state.turkey.runPhase });
  }
  const rows = [
    ['Distance', `${Math.floor(state.distance)} m`],
    ['Score', `${Math.floor(state.score)}`],
    ['Corn collected', `${state.corn}`],
    ['Close calls', `${state.stats.closeCalls}`],
    ['Times hidden', `${state.stats.hides}`],
    ['Best score', `${Math.floor(Math.max(best, state.score))}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 404 + i * 27;
    text(ctx, label, W / 2 - 190, y, { size: 18, weight: 400, color: 'rgba(255,246,232,0.9)' });
    text(ctx, value, W / 2 + 190, y, { size: 18, align: 'right', color: PALETTE.paper });
  });
  const blink = 0.55 + 0.45 * Math.sin(state.time * 4);
  ctx.save();
  ctx.globalAlpha = blink;
  text(ctx, 'PRESS ENTER OR CLICK TO RUN AGAIN', W / 2, 404 + rows.length * 27 + 14, { size: 20, align: 'center', color: PALETTE.cream });
  ctx.restore();
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20, 12, 6, 0.5)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'PAUSED', W / 2, H / 2 - 10, { size: 54, align: 'center', color: PALETTE.paper, outline: PALETTE.ink });
  text(ctx, 'Press P or Esc to keep running', W / 2, H / 2 + 34, { size: 19, align: 'center', weight: 400 });
}

// ---- the renderer ---------------------------------------------------------------------------

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let lastHearts = HEARTS;
  let flashT = 0;
  let lastNow = 0;

  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = canvas.clientWidth || window.innerWidth;
    const ch = canvas.clientHeight || window.innerHeight;
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    }
    const scale = Math.min(cw / W, ch / H);
    return { dpr, scale, ox: (cw - W * scale) / 2, oy: (ch - H * scale) / 2, cw, ch };
  }

  function draw(state, screen, best) {
    const now = state.time;
    if (state.hearts < lastHearts) flashT = 0.3;
    lastHearts = state.hearts;
    flashT = Math.max(0, flashT - Math.min(0.05, Math.max(0, now - lastNow)));
    lastNow = now;

    const { dpr, scale, ox, oy, cw, ch } = fit();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#20130a';
    ctx.fillRect(0, 0, cw, ch);
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    const cameraX = state.turkey.x - TURKEY_SCREEN_X;
    drawBackground(ctx, state, cameraX);

    // Entities behind the actors, then the farmer, then the turkey.
    for (const e of state.entities) {
      if (e.kind === 'gate' || e.kind === 'mud' || HIDE_KINDS.has(e.kind) || e.kind === 'oven' || e.kind === 'table') {
        drawEntity(ctx, state, e, cameraX);
      }
    }
    for (const e of state.entities) {
      if (!(e.kind === 'gate' || e.kind === 'mud' || HIDE_KINDS.has(e.kind) || e.kind === 'oven' || e.kind === 'table')) {
        drawEntity(ctx, state, e, cameraX);
      }
    }

    if (screen !== SCREEN_OVER) {
      const f = state.farmer;
      const farmerMode = { chase: 'chase', lunge: 'lunge', stumble: 'stumble', search: 'search', trail: 'trail', yank: 'yank' }[f.state] || 'chase';
      drawFarmer(ctx, TURKEY_SCREEN_X - f.gap * PXM, GY, farmerMode, f.runPhase + f.animT);
      const t = state.turkey;
      if (!t.hidden) {
        drawTurkey(ctx, TURKEY_SCREEN_X, GY - t.y, {
          runPhase: t.runPhase,
          airborne: !t.grounded,
          ducking: t.ducking,
          sliding: t.sliding,
          squash: t.landSquashT > 0 ? t.landSquashT / 0.14 : 0,
          wingFlap: t.jumpsUsed === 2 ? 0.5 + Math.sin(state.time * 30) * 0.5 : 0,
          ghost: t.invulnT > 0 && Math.floor(state.time * 14) % 2 === 0,
        });
      }
    }

    // Particles and floating score text.
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - cameraX, GY - p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const fl of state.floaters) {
      ctx.globalAlpha = Math.max(0, 1 - fl.t / fl.life);
      text(ctx, fl.text, fl.x - cameraX, GY - fl.y, { size: fl.size, align: 'center', color: fl.color, outline: 'rgba(45,26,18,0.8)' });
    }
    ctx.globalAlpha = 1;

    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      drawHeartRow(ctx, state);
      drawProgress(ctx, state);
      drawScore(ctx, state, best);
      drawFarmerWarnings(ctx, state);
      drawBanner(ctx, state);
    }
    if (screen === SCREEN_TITLE) drawTitle(ctx, state, best);
    if (screen === SCREEN_OVER) drawOver(ctx, state, best);
    if (screen === SCREEN_PAUSED) drawPaused(ctx);

    // Hurt flash and the danger vignette while the farmer is close.
    const f = state.farmer;
    if (screen === SCREEN_PLAY && !state.turkey.hidden && f.gap < 8 && (f.state === 'chase' || f.state === 'lunge')) {
      const a = (1 - f.gap / 8) * 0.16 * (0.7 + 0.3 * Math.sin(state.time * 10));
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.36, W / 2, H / 2, H * 0.78);
      g.addColorStop(0, 'rgba(217, 58, 43, 0)');
      g.addColorStop(1, `rgba(217, 58, 43, ${a})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    if (flashT > 0) {
      ctx.fillStyle = `rgba(217, 58, 43, ${flashT * 0.5})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  return { draw };
}
