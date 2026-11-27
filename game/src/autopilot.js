// A simple deterministic pilot for the turkey: it plays the real game well enough to
// show it off. The title screen runs it as an attract mode, and the screenshot scenes
// use it to stage a real run. It reads the same state a player sees and answers with
// the same control object a player makes: jump obstacles, slide under tables, sprint
// when the farmer lunges. It never hides — hiding is a player's cunning, not a demo's.
import { HIDE_KINDS, OBSTACLES } from './world.js';

const JUMPABLE = new Set(['fence', 'pitchfork', 'pumpkin', 'bigpumpkin', 'pot', 'barrel', 'oven', 'burner']);

export function createAutopilot() {
  let lastJumpAt = -10;

  return function pilot(state) {
    const t = state.turkey;
    const control = { move: 0, down: false, sprint: false, jumpPressed: false, jumpHeld: false };
    if (state.over || t.hidden) return control;

    const speedPx = Math.max(state.speed, 6) * 24;
    const farmer = state.farmer;

    // The farmer is lunging or right on the tail: sprint, and jump the grab.
    if (farmer.state === 'lunge' || farmer.gap < 3.6) {
      control.sprint = true;
      if (t.grounded && state.time - lastJumpAt > 0.5) {
        control.jumpPressed = true;
        lastJumpAt = state.time;
      }
      return control;
    }
    if (farmer.gap < 7) control.sprint = true;
    else if (farmer.gap < 11) control.move = 1; // he is gaining: lean forward and run

    // The nearest thing ahead that needs an answer.
    let nearest = null;
    for (const e of state.entities) {
      if (e.dead || e.kind === 'corn' || e.kind === 'pie' || e.kind === 'mud' || e.kind === 'gate') continue;
      if (HIDE_KINDS.has(e.kind)) continue;
      const ahead = e.x - (t.x + 26);
      if (ahead < -e.w - 30 || ahead > speedPx * 0.62 + 190) continue;
      if (nearest === null || ahead < nearest.ahead) nearest = { e, ahead };
    }
    if (!nearest) return control;
    const { e, ahead } = nearest;

    if (e.kind === 'table') {
      if (ahead < 230 && t.x < e.x + e.w) control.down = true;
      return control;
    }
    if (e.kind === 'knife') {
      // Creep up on a hanging knife so it drops short, then jump the stuck blade.
      if (e.phase === 'hanging' && ahead < 320) control.move = -1;
      if (e.phase === 'stuck' && ahead < speedPx * 0.3 && ahead > -10 && t.grounded) {
        control.jumpPressed = true;
        lastJumpAt = state.time;
      }
      return control;
    }
    if (JUMPABLE.has(e.kind)) {
      const tall = e.kind === 'oven' || e.kind === 'bigpumpkin';
      const window = tall ? speedPx * 0.46 : speedPx * 0.4;
      if (ahead < window && ahead > -10 && t.grounded && state.time - lastJumpAt > 0.45) {
        control.jumpPressed = true;
        control.jumpHeld = true;
        lastJumpAt = state.time;
      }
      // Still low and close to a TALL obstacle only: flap the wings for the extra lift.
      if (tall && !t.grounded && t.y < 60 && ahead < 90 && ahead > -40 && t.jumpsUsed === 1) {
        control.jumpPressed = true;
        lastJumpAt = state.time;
      }
    }
    return control;
  };
}
