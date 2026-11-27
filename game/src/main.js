// Boot and the one loop for Gobble Run. Input is read every frame, the world advances
// in fixed 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. Four screens: title (with the autopilot's attract run behind
// it), play, paused, and over — caught or escaped, both with a restart.
//
// ?seed=N fixes the course. ?shot=start|play|end|win (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a
// screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT } from './world.js';
import { createAutopilot } from './autopilot.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  const pilot = createAutopilot();
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    announce('Running! Three hearts. Reach the forest gate at 1800 metres.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    audio.fanfare(world.state.over === 'escaped');
    announce(world.state.over === 'escaped'
      ? `Freedom! Score ${world.state.score}.`
      : `Caught! Score ${world.state.score}. Best ${best}.`);
  }

  function playSounds(events) {
    if (events & EVENT.JUMP) audio.squawk(false);
    if (events & EVENT.DOUBLE_JUMP) audio.squawk(true);
    if (events & EVENT.CORN) audio.corn();
    if (events & EVENT.PIE) audio.pie();
    if (events & EVENT.HIT) audio.hurt();
    if (events & EVENT.LUNGE) audio.whoosh();
    if (events & EVENT.STUMBLE) audio.stumble();
    if (events & EVENT.FLAME) audio.flame();
    if (events & EVENT.KNIFE_DROP) audio.knifeDrop();
    if (events & EVENT.SPOTTED) audio.spotted();
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
      else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Running.');
      }
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Running.');
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      // The attract run: the autopilot plays behind the title, forever.
      world.step(STEP, pilot(world.state));
      if (world.state.over) world.reset();
      return;
    }
    const events = world.step(STEP, input.control());
    playSounds(events);
    if (events & EVENT.HIT) {
      announce(world.state.hearts === 1 ? 'Hit! One heart left.' : `Hit! ${world.state.hearts} hearts left.`);
    }
    if (world.state.over) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting the farmer catch up unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Gobble Run. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
