# turkey-run-game-01

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/sugeng-22/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/sugeng-22/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

**Gobble Run — The Great Turkey Escape.** A 2D canvas side-scroller with no build step
and no network: you are Waddles the turkey, and Thanksgiving is in twenty minutes.
Sprint, slide and hide your way 1,800 metres — across the farmyard, through the
pumpkin patch, and right through Farmer Hank's kitchen — to the forest gate.

Farmer Hank is no cutscene: he chases, lunges, loses your trail and searches your
hiding spot. Dodge fences, pitchforks, rolling barrels, a firing oven, falling
carving knives and hot burners; duck under the kitchen table; hide in hay bales,
behind the scarecrow, or in the flour sacks — but not if he saw you duck in. Grab
corn to keep your sprint up, and a pumpkin pie if your hearts run low. All art is
drawn in code and all sound — the squawks, the slide-whistle stumble, the folk-tune
music — is synthesised with WebAudio. There are no asset files at all.

Controls: ←/→ lean slower/faster, ↑ or Space jumps (twice for a wing-flap), ↓ ducks,
slides and hides, Shift sprints, P pauses, M mutes. Mouse and touch work too.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 in a desktop browser
```

The hand-in program is `main.ts`: it copies `game/` and `screenshots/` to `/output`
and writes the dossier with `buildDossier` from `vendor/makefun-game.ts`.

The game's own source lives under `game/src/`, one job per file: `world.js` (the
simulation and the farmer's state machine), `render.js` and `sprites.js` (the
painting), `autopilot.js` (the demo pilot behind the title screen and the screenshot
scenes), `audio.js` (synthesised sound), `input.js`, `shots.js` (the deterministic
`?shot=start|play|end|win&seed=N` scenes the screenshots were taken from),
`config.js` and `random.js`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=707za467&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
