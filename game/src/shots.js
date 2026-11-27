// The screenshot scenes behind ?shot=start|play|end|win (with &seed=N). Each one plays
// the real rules forward from a fresh world, so the frame is what a real game looks
// like and the same seed always gives the same frame:
//   start — the attract run behind the title screen
//   play  — a run in full flight, piloted by the autopilot
//   end   — a run nobody steers, until the farmer has his turkey (the caught screen)
//   win   — the final clear stretch, piloted home (the escaped screen)
import { FINAL_CLEAR_METRES, STEP } from './config.js';
import { createAutopilot } from './autopilot.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const IDLE = { move: 0, down: false, sprint: false, jumpPressed: false, jumpHeld: false };

function run(world, seconds, control) {
  const pilot = createAutopilot();
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    world.step(STEP, control === 'pilot' ? pilot(world.state) : control);
    if (world.state.over) break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it and the best
 * score to show. Unknown names stage the title scene.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    world.reset();
    run(world, 17, 'pilot');
    if (world.state.over) {
      // The pilot had a bad day with this seed: stage a shorter, cleaner run instead.
      world.reset();
      run(world, 9, 'pilot');
    }
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'end') {
    world.reset();
    run(world, 120, IDLE);
    if (world.state.over !== 'caught') {
      // Still free after two unsteered minutes: set up the inevitable and let the
      // real grab rules finish it — one heart left, the farmer at lunging distance.
      world.startAt(900);
      world.state.hearts = 1;
      world.state.farmer.gap = 2.6;
      run(world, 30, IDLE);
    }
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  if (name === 'win') {
    world.startAt(FINAL_CLEAR_METRES - 30);
    run(world, 40, 'pilot');
    return { screen: SCREEN_OVER, best: Math.max(world.state.score, 2400) };
  }
  world.reset();
  run(world, 5, 'pilot');
  return { screen: SCREEN_TITLE, best: 0 };
}

