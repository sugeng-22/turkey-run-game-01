// Every character and prop in Gobble Run, drawn with canvas shapes in a warm autumn
// palette: the turkey (running, ducking, sliding, peeking), Farmer Hank (chasing,
// lunging, searching, flat on his face), and the furniture of the three stages —
// fences and hay bales, pumpkins and a scarecrow, ovens, knives and kitchen tables.
// Nothing here knows the rules; each function paints one thing at one place.
import { PALETTE } from './config.js';

const FEATHERS = [PALETTE.featherA, PALETTE.featherB, PALETTE.featherC, PALETTE.featherD, PALETTE.featherE];

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function circle(ctx, x, y, r, color) {
  ellipse(ctx, x, y, r, r, color);
}

function poly(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

// ---- the turkey ---------------------------------------------------------------

/** Just the head and neck, for peeking out of a hiding spot. */
export function drawTurkeyHead(ctx, x, y, look = 1) {
  line(ctx, x, y, x + 6 * look, y - 16, 9, PALETTE.turkeyBody);
  circle(ctx, x + 10 * look, y - 22, 11, PALETTE.head);
  poly(ctx, [[x + 18 * look, y - 26], [x + 30 * look, y - 21], [x + 18 * look, y - 17]], PALETTE.beak);
  ellipse(ctx, x + 16 * look, y - 13, 4, 7, PALETTE.wattle);
  circle(ctx, x + 12 * look, y - 24, 2.4, PALETTE.ink);
}

/**
 * The turkey at centre x, feet at feetY. opts: runPhase (leg cycle), airY (for the
 * wing), ducking, sliding, squash (0..1 landing squash), wingFlap (0..1), ghost
 * (draw at half alpha while invulnerable).
 */
export function drawTurkey(ctx, x, feetY, opts = {}) {
  const {
    runPhase = 0, airborne = false, ducking = false, sliding = false,
    squash = 0, wingFlap = 0, ghost = false,
  } = opts;
  ctx.save();
  ctx.translate(x, feetY);
  if (ghost) ctx.globalAlpha = 0.45;
  const bodyY = sliding ? -22 : ducking ? -32 : -48;
  const stretch = sliding ? 1.18 : ducking ? 1.12 : 1;
  ctx.scale(stretch, 1 - squash * 0.18);

  // Legs: orange, cycling while running, tucked while airborne, trailing in a slide.
  const legSwing = airborne ? 0 : Math.sin(runPhase) * 11;
  const legY = sliding ? -6 : 0;
  line(ctx, -6, -16, -10 - legSwing * 0.4, legY, 5, PALETTE.beak);
  line(ctx, 8, -16, 12 + legSwing * 0.4, legY, 5, PALETTE.beak);
  line(ctx, -14 - legSwing * 0.4, 0, -6 - legSwing * 0.4, 0, 4, PALETTE.beak);
  line(ctx, 8 + legSwing * 0.4, 0, 18 + legSwing * 0.4, 0, 4, PALETTE.beak);

  // Tail fan: five feathers spread behind, wider in the air.
  const spread = airborne ? 0.62 : 0.45;
  for (let i = 0; i < 5; i += 1) {
    const angle = -spread + (i * spread * 2) / 4 - 0.5;
    ctx.save();
    ctx.translate(-24, bodyY + 4);
    ctx.rotate(angle);
    ellipse(ctx, -17, 0, 19, 7.5, FEATHERS[i]);
    ellipse(ctx, -26, 0, 7, 5, PALETTE.ink);
    ctx.restore();
  }

  // Body.
  ellipse(ctx, 0, bodyY, 35, 26, PALETTE.turkeyBody);
  ellipse(ctx, 4, bodyY + 6, 28, 18, PALETTE.turkeyDark);

  // Wing: folded at rest, flapping on the second jump.
  ctx.save();
  ctx.translate(2, bodyY + 2);
  ctx.rotate(airborne ? -0.5 - wingFlap * 0.45 : 0.25);
  ellipse(ctx, -4, 4, 20, 11, PALETTE.turkeyDark);
  ellipse(ctx, -6, 2, 14, 7, PALETTE.turkeyBody);
  ctx.restore();

  // Neck and head, lower and longer when ducking.
  const headX = ducking || sliding ? 40 : 34;
  const headY = bodyY - (ducking || sliding ? 12 : 30);
  line(ctx, 22, bodyY - 8, headX - 4, headY + 6, 10, PALETTE.turkeyBody);
  circle(ctx, headX, headY, 12, PALETTE.head);
  poly(ctx, [[headX + 9, headY - 4], [headX + 22, headY + 1], [headX + 9, headY + 4]], PALETTE.beak);
  ellipse(ctx, headX + 8, headY + 8, 4.5, 8, PALETTE.wattle); // the wattle
  ellipse(ctx, headX + 6, headY - 9, 3, 5, PALETTE.wattle); // the snood
  circle(ctx, headX + 3, headY - 2, 4.5, '#ffffff');
  circle(ctx, headX + 4, headY - 2, 2.4, PALETTE.ink);
  ctx.restore();
}

// ---- the farmer -----------------------------------------------------------------

function drawNet(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  line(ctx, 0, 0, 34, 4, 5, PALETTE.wood);
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(52, 5, 20, 24, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 246, 232, 0.75)';
  ctx.lineWidth = 1.4;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(52 + i * 8, -18);
    ctx.lineTo(52 + i * 8, 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(33, 5 + i * 9);
    ctx.lineTo(71, 5 + i * 9);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFarmerHead(ctx, x, y, mood) {
  circle(ctx, x, y, 13, PALETTE.farmerSkin);
  ellipse(ctx, x + 11, y + 3, 4, 3, PALETTE.farmerSkin); // nose
  // Straw hat: brim and dome.
  ellipse(ctx, x, y - 9, 21, 5.5, PALETTE.farmerHat);
  ellipse(ctx, x, y - 14, 11, 7, PALETTE.farmerHat);
  // Eyes and brow: determined, puzzled or dazed by the mood.
  if (mood === 'dazed') {
    line(ctx, x + 2, y - 3, x + 8, y + 1, 2, PALETTE.ink);
    line(ctx, x + 8, y - 3, x + 2, y + 1, 2, PALETTE.ink);
  } else {
    circle(ctx, x + 5, y - 2, 2.2, PALETTE.ink);
    line(ctx, x, y - 6, x + 9, mood === 'search' ? y - 4 : y - 7, 2.4, PALETTE.ink);
  }
  if (mood === 'search') {
    ellipse(ctx, x + 6, y + 7, 4, 3, 'rgba(120, 50, 30, 0.6)'); // open mouth
  } else if (mood !== 'dazed') {
    line(ctx, x + 2, y + 7, x + 9, y + 6, 2, 'rgba(120, 50, 30, 0.7)');
  }
}

/**
 * Farmer Hank at centre x, feet at feetY. mode: 'chase' | 'lunge' | 'stumble' |
 * 'search' | 'trail' | 'yank' | 'win' (holding the turkey, for the caught screen).
 */
export function drawFarmer(ctx, x, feetY, mode, phase = 0) {
  ctx.save();
  ctx.translate(x, feetY);
  if (mode === 'stumble') {
    // Flat on his back in the dirt, stars circling, net dropped beside him.
    ctx.rotate(-0.12);
    ellipse(ctx, -6, -8, 34, 13, PALETTE.farmerPants);
    roundRect(ctx, 8, -26, 30, 22, 6, PALETTE.farmerShirt);
    drawFarmerHead(ctx, 48, -18, 'dazed');
    line(ctx, -30, -12, -46, -26, 7, PALETTE.farmerPants);
    line(ctx, -44, -26, -40, -34, 6, PALETTE.ink);
    drawNet(ctx, 26, -2, 2.6);
    for (let i = 0; i < 3; i += 1) {
      const a = phase * 2.4 + (i * Math.PI * 2) / 3;
      const sx = 46 + Math.cos(a) * 20;
      const sy = -40 + Math.sin(a) * 6;
      poly(ctx, [[sx, sy - 6], [sx + 2, sy - 1], [sx + 6, sy - 1], [sx + 3, sy + 2], [sx + 4, sy + 6], [sx, sy + 3], [sx - 4, sy + 6], [sx - 3, sy + 2], [sx - 6, sy - 1], [sx - 2, sy - 1]], PALETTE.corn);
    }
    ctx.restore();
    return;
  }

  const running = mode === 'chase' || mode === 'yank';
  const swing = running ? Math.sin(phase) * 13 : 0;
  const lean = mode === 'lunge' ? 0.38 : running ? 0.14 : 0;
  ctx.rotate(lean);

  // Legs in overalls, boots below.
  const hipY = -46;
  if (mode === 'search' || mode === 'win') {
    line(ctx, -4, hipY, -8, -2, 10, PALETTE.farmerPants);
    line(ctx, 8, hipY, 13, -2, 10, PALETTE.farmerPants);
    line(ctx, -8, -3, -2, -3, 6, PALETTE.ink);
    line(ctx, 13, -3, 20, -3, 6, PALETTE.ink);
  } else {
    line(ctx, -2, hipY, -6 - swing, -2, 10, PALETTE.farmerPants);
    line(ctx, 4, hipY, 8 + swing, -2, 10, PALETTE.farmerPants);
    line(ctx, -6 - swing, -3, 1 - swing, -3, 6, PALETTE.ink);
    line(ctx, 8 + swing, -3, 15 + swing, -3, 6, PALETTE.ink);
  }

  // Torso: red plaid shirt over overalls.
  roundRect(ctx, -14, -88, 30, 46, 8, PALETTE.farmerShirt);
  ctx.fillStyle = PALETTE.farmerShirtDark;
  for (const dx of [-6, 3, 12]) ctx.fillRect(dx, -88, 3, 46);
  ctx.fillRect(-14, -70, 30, 3);
  roundRect(ctx, -14, -58, 30, 18, 4, PALETTE.farmerPants); // overall bib

  // Arms and head by mode.
  if (mode === 'lunge') {
    line(ctx, 8, -80, 34, -64, 8, PALETTE.farmerShirt);
    line(ctx, 34, -64, 42, -60, 6, PALETTE.farmerSkin);
    drawNet(ctx, 40, -60, -0.2);
    line(ctx, 2, -80, 22, -52, 8, PALETTE.farmerShirt);
    drawFarmerHead(ctx, 12, -100, 'chase');
  } else if (mode === 'search') {
    line(ctx, 6, -80, 20, -96, 8, PALETTE.farmerShirt); // hand shading his eyes
    line(ctx, 20, -96, 30, -94, 6, PALETTE.farmerSkin);
    line(ctx, 0, -80, -14, -58, 8, PALETTE.farmerShirt); // other hand on hip
    drawFarmerHead(ctx, 4, -102, 'search');
  } else if (mode === 'yank') {
    line(ctx, 8, -80, 30, -88, 8, PALETTE.farmerShirt);
    line(ctx, 2, -80, 24, -70, 8, PALETTE.farmerShirt);
    drawNet(ctx, 30, -88, 0.9);
    drawFarmerHead(ctx, 6, -102, 'chase');
  } else if (mode === 'win') {
    line(ctx, 8, -80, 26, -62, 8, PALETTE.farmerShirt);
    drawNet(ctx, 26, -62, 0.4);
    line(ctx, 0, -80, -16, -64, 8, PALETTE.farmerShirt);
    drawFarmerHead(ctx, 5, -102, 'win');
  } else {
    // Chasing or trailing: arms pumping, net ready in the front hand.
    line(ctx, 6, -80, 18 + swing * 0.7, -58, 8, PALETTE.farmerShirt);
    drawNet(ctx, 18 + swing * 0.7, -58, -0.35 + swing * 0.012);
    line(ctx, 0, -80, -12 - swing * 0.7, -60, 8, PALETTE.farmerShirt);
    drawFarmerHead(ctx, 6, -102, mode === 'trail' ? 'search' : 'chase');
  }
  ctx.restore();
}

// ---- props and hazards ------------------------------------------------------------

export function drawFence(ctx, x, groundY, w) {
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(x + 8, groundY - 52, 9, 52);
  ctx.fillRect(x + w - 17, groundY - 52, 9, 52);
  poly(ctx, [[x + 8, groundY - 52], [x + 12.5, groundY - 60], [x + 17, groundY - 52]], PALETTE.wood);
  poly(ctx, [[x + w - 17, groundY - 52], [x + w - 12.5, groundY - 60], [x + w - 8, groundY - 52]], PALETTE.wood);
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(x, groundY - 44, w, 9);
  ctx.fillRect(x, groundY - 24, w, 9);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x, groundY - 44, w, 3);
}

export function drawMud(ctx, x, groundY, w) {
  ellipse(ctx, x + w / 2, groundY - 3, w / 2, 10, '#7c4c22');
  ellipse(ctx, x + w / 2, groundY - 4, w / 2 - 12, 7, '#96622e');
  ellipse(ctx, x + w * 0.3, groundY - 5, 16, 3, 'rgba(255,255,255,0.25)');
  ellipse(ctx, x + w * 0.68, groundY - 5, 10, 2.4, 'rgba(255,255,255,0.2)');
}

export function drawPitchfork(ctx, x, groundY) {
  line(ctx, x + 13, groundY, x + 13, groundY - 74, 5, PALETTE.woodDark);
  line(ctx, x + 13, groundY - 74, x + 4, groundY - 96, 4, '#c9ced6');
  line(ctx, x + 13, groundY - 74, x + 13, groundY - 100, 4, '#c9ced6');
  line(ctx, x + 13, groundY - 74, x + 22, groundY - 96, 4, '#c9ced6');
  line(ctx, x + 6, groundY - 76, x + 20, groundY - 76, 3, '#c9ced6');
}

export function drawPumpkin(ctx, x, groundY, w, h) {
  const cx = x + w / 2;
  ellipse(ctx, cx, groundY - h / 2, w / 2, h / 2, PALETTE.pumpkin);
  ellipse(ctx, cx, groundY - h / 2, w / 4, h / 2 - 2, PALETTE.pumpkinDark);
  ellipse(ctx, cx, groundY - h / 2, w / 8, h / 2 - 4, PALETTE.pumpkin);
  roundRect(ctx, cx - 4, groundY - h - 6, 8, 10, 3, '#5d7a2c');
  ellipse(ctx, cx - w / 5, groundY - h + 8, w / 6, 4, 'rgba(255,255,255,0.18)');
}

export function drawPot(ctx, x, groundY, w, h) {
  roundRect(ctx, x + 4, groundY - h + 12, w - 8, h - 12, 10, '#4c5560');
  ctx.fillStyle = '#39414a';
  ctx.fillRect(x, groundY - h + 4, w, 10);
  circle(ctx, x + w / 2, groundY - h + 2, 6, '#39414a');
  ellipse(ctx, x + 14, groundY - h / 2, 4, 12, 'rgba(255,255,255,0.15)');
}

export function drawBarrel(ctx, x, groundY, w, roll) {
  const cx = x + w / 2;
  const cy = groundY - w / 2;
  circle(ctx, cx, cy, w / 2, PALETTE.wood);
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, w / 2 - 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 3; i += 1) {
    const a = roll + (i * Math.PI * 2) / 3;
    line(ctx, cx, cy, cx + Math.cos(a) * (w / 2 - 4), cy + Math.sin(a) * (w / 2 - 4), 3, PALETTE.woodDark);
  }
}

export function drawOven(ctx, x, groundY, w, h, firing, glow) {
  // A big black iron range with a round door, a stovepipe and a temper.
  roundRect(ctx, x, groundY - h, w, h, 10, '#33383f');
  roundRect(ctx, x + 6, groundY - h + 6, w - 12, h - 12, 8, '#272b31');
  line(ctx, x + w / 2, groundY - h, x + w / 2, groundY - h - 26, 12, '#33383f');
  circle(ctx, x + w / 2, groundY - h + 34, 26, '#17191d');
  circle(ctx, x + w / 2, groundY - h + 34, 20, glow ? '#e8762a' : '#101216');
  if (glow) ellipse(ctx, x + w / 2, groundY - h + 38, 12, 8, '#f7c948');
  for (const dx of [16, w - 16]) circle(ctx, x + dx, groundY - h + 16, 6, '#17191d');
  ctx.fillStyle = '#17191d';
  ctx.fillRect(x + 10, groundY - 26, w - 20, 8);
  if (firing) {
    // The flame jet: layered tongues reaching left from the oven's mouth.
    const baseX = x - 4;
    const baseY = groundY - 24;
    for (const [len, hh, color] of [[148, 44, '#e8762a'], [118, 32, '#f2a03c'], [82, 20, '#f7c948']]) {
      poly(ctx, [
        [baseX, baseY - hh], [baseX - len * 0.6, baseY - hh * 0.4], [baseX - len, baseY - 4],
        [baseX - len * 0.55, baseY + 6], [baseX, baseY + 8],
      ], color);
    }
  } else if (glow) {
    ellipse(ctx, x - 2, groundY - 22, 10, 6, 'rgba(232, 118, 42, 0.55)');
  }
}

export function drawBurner(ctx, x, groundY, w, lit, glow, phase) {
  roundRect(ctx, x - 4, groundY - 12, w + 8, 12, 5, '#33383f');
  circle(ctx, x + w / 2, groundY - 12, 13, '#17191d');
  if (lit || glow) {
    const flicker = 1 + Math.sin(phase * 31) * 0.12;
    const hh = (lit ? 24 : 10) * flicker;
    for (const [scale, color] of [[1, '#e8762a'], [0.66, '#f2a03c'], [0.38, '#7ec8e3']]) {
      poly(ctx, [
        [x + w / 2 - 10 * scale, groundY - 12], [x + w / 2, groundY - 12 - hh * scale],
        [x + w / 2 + 10 * scale, groundY - 12],
      ], color);
    }
  }
}

export function drawTable(ctx, x, groundY, w, h) {
  // A long kitchen table: top, cloth and legs, with room to slide underneath.
  roundRect(ctx, x - 6, groundY - h, w + 12, 14, 5, PALETTE.wood);
  ctx.fillStyle = '#e8ddc8';
  ctx.fillRect(x - 2, groundY - h + 12, w + 4, 12);
  for (const dx of [10, w - 16]) {
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(x + dx, groundY - h + 14, 10, h - 14);
  }
  // Things on the table: a pie dish and a jug, silhouetted against the kitchen.
  ellipse(ctx, x + 44, groundY - h - 4, 20, 7, '#c9ced6');
  ellipse(ctx, x + 44, groundY - h - 7, 16, 5, PALETTE.pumpkin);
  roundRect(ctx, x + w - 52, groundY - h - 22, 16, 22, 4, '#7ec8e3');
}

export function drawKnife(ctx, cx, tipY) {
  // A carving knife pointing down: blade, bolster and a dark handle above.
  poly(ctx, [[cx - 8, tipY - 44], [cx + 8, tipY - 44], [cx + 3, tipY], [cx - 3, tipY]], '#dfe5ec');
  poly(ctx, [[cx - 8, tipY - 44], [cx, tipY - 44], [cx - 2, tipY - 4]], '#b9c1cc');
  roundRect(ctx, cx - 5, tipY - 64, 10, 20, 4, PALETTE.woodDark);
}

export function drawCorn(ctx, x, y, phase) {
  const bob = Math.sin(phase) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(-0.5);
  roundRect(ctx, -8, -14, 16, 28, 8, PALETTE.corn);
  ctx.strokeStyle = '#d9a92f';
  ctx.lineWidth = 1.4;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 5, -12);
    ctx.lineTo(i * 5, 12);
    ctx.stroke();
  }
  poly(ctx, [[-8, 8], [-16, 20], [-4, 14]], PALETTE.cornHusk);
  poly(ctx, [[8, 8], [14, 20], [3, 14]], PALETTE.cornHusk);
  ctx.restore();
}

export function drawPie(ctx, x, y, phase) {
  const bob = Math.sin(phase + 1) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ellipse(ctx, 0, 4, 20, 7, '#c9ced6');
  ellipse(ctx, 0, 1, 16, 6, '#e8a33c');
  poly(ctx, [[-10, 0], [10, 0], [0, -8]], '#f2c14e');
  circle(ctx, 0, -3, 3.4, '#fff6e8'); // a dollop of cream
  ctx.restore();
}

// ---- hiding spots -------------------------------------------------------------------

export function drawHayBale(ctx, x, groundY, w) {
  roundRect(ctx, x, groundY - 84, w, 84, 16, '#e3b959');
  ctx.strokeStyle = '#c99b3a';
  ctx.lineWidth = 3;
  for (let i = 1; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + (w / 4) * i, groundY - 82);
    ctx.lineTo(x + (w / 4) * i, groundY - 2);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(160, 116, 40, 0.6)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 7; i += 1) {
    const yy = groundY - 12 - i * 11;
    ctx.beginPath();
    ctx.moveTo(x + 8, yy);
    ctx.quadraticCurveTo(x + w / 2, yy - 6, x + w - 8, yy);
    ctx.stroke();
  }
  poly(ctx, [[x + 16, groundY - 84], [x + 26, groundY - 100], [x + 32, groundY - 84]], '#e3b959');
  poly(ctx, [[x + w - 34, groundY - 84], [x + w - 24, groundY - 98], [x + w - 16, groundY - 84]], '#e3b959');
}

export function drawScarecrow(ctx, x, groundY, w) {
  const cx = x + w / 2;
  line(ctx, cx, groundY, cx, groundY - 96, 7, PALETTE.woodDark);
  line(ctx, cx - 34, groundY - 74, cx + 34, groundY - 80, 6, PALETTE.woodDark);
  roundRect(ctx, cx - 15, groundY - 88, 30, 34, 6, '#7a9e43');
  ctx.fillStyle = '#5d7a2c';
  ctx.fillRect(cx - 15, groundY - 72, 30, 4);
  circle(ctx, cx, groundY - 98, 12, '#e8c96a');
  ellipse(ctx, cx, groundY - 106, 19, 4.6, '#c99b3a');
  ellipse(ctx, cx, groundY - 112, 10, 6, '#c99b3a');
  // Straw poking out at the wrists and waist.
  for (const [dx, dy] of [[-36, -76], [36, -82], [-8, -54], [10, -54]]) {
    line(ctx, cx + dx, groundY + dy, cx + dx * 1.25, groundY + dy + 8, 3, '#e3b959');
  }
}

export function drawSacks(ctx, x, groundY, w) {
  // Flour sacks and a stock pot in the kitchen corner: a fine place to not be seen.
  ellipse(ctx, x + 30, groundY - 24, 30, 26, '#e8ddc8');
  ellipse(ctx, x + 32, groundY - 46, 20, 8, '#d9c9a8');
  roundRect(ctx, x + 20, groundY - 56, 24, 10, 4, '#c9b48c');
  ellipse(ctx, x + 76, groundY - 20, 28, 22, '#dfd0b2');
  ellipse(ctx, x + 78, groundY - 40, 18, 7, '#d9c9a8');
  roundRect(ctx, x + 64, groundY - 50, 26, 10, 4, '#c9b48c');
  ctx.fillStyle = 'rgba(120, 90, 40, 0.55)';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FLOUR', x + 31, groundY - 20);
}

export function drawGate(ctx, x, groundY) {
  // The forest gate at the end of the course: two posts, a lintel, sun beyond.
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(x, groundY - 210, 14, 210);
  ctx.fillRect(x + 128, groundY - 210, 14, 210);
  ctx.fillRect(x - 8, groundY - 224, 158, 16);
  poly(ctx, [[x + 7, groundY - 208], [x + 128, groundY - 224], [x + 128, groundY - 210], [x + 7, groundY - 194]], PALETTE.wood);
  ellipse(ctx, x + 71, groundY - 120, 44, 62, 'rgba(255, 223, 107, 0.35)');
}
