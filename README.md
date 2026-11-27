[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/Hendr1010/turkey-run-game-entry/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/Hendr1010/turkey-run-game-entry/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

# Gobblewood Escape — a turkey's Thanksgiving breakout

A complete turkey escape game for [turkey-run-game-01](https://make.fun/bounty/turkey-run-game-01) ($250, make.fun). One turkey, one farmer, one Thanksgiving to survive: run, jump, dash and hide through the Farmyard, the Barn and the Kitchen, dodge falling carving knives and hot oven floors, and reach the woods before you become dinner.

## How to play

Open `game/index.html` in a desktop browser (or run `node serve.ts` and open http://localhost:8080). No build step, no network requests, no libraries — plain HTML, CSS and JavaScript, all art drawn in code, all sound synthesized with WebAudio.

- **← → / A D** — run
- **↑ / SPACE / click** — jump
- **SHIFT** — dash (short cooldown)
- **↓ / S** — hide in a haystack (the farmer cannot see you there)
- **P** — pause, **M** — mute

The farmer patrols his patch. Cross his line of sight and he gives chase — dash away, break line of sight, or hide until he gives up and searches. Falling knives are telegraphed with a red warning ring; oven floors glow and burn if you stand on them. Corn is +10, pumpkin pie is +25, a rare feather restores a life. Three lives. Reach the forest gate at the end of the Kitchen to escape — or get caught and try again.

## Screenshots

1. Title screen — `screenshots/1-start.jpg`
2. A run in play, HUD with score, distance, lives and the farm-to-woods progress bar — `screenshots/2-play.jpg`
3. The farmer in full chase through the Kitchen — `screenshots/3-chase.jpg`
4. Escaped! The win screen — `screenshots/4-escaped.jpg`

## Layout

- `main.ts` — the entry program: copies `game/` and `screenshots/` to the output and writes `dossier.json`
- `game/index.html` — the game page
- `game/src/main.js` — boot and the fixed-step loop
- `game/src/world.js` — one step advances turkey, farmer, knives and pickups
- `game/src/turkey.js` — run, jump, dash, hide, damage and pickups
- `game/src/farmer.js` — patrol, chase and search AI with a vision cone
- `game/src/level.js` — the seeded escape route: fences, haystacks, ovens, puddles, pickups
- `game/src/render.js` — all canvas art, HUD and screens
- `game/src/scenes.js` — the `?shot=` screenshot scenes (real runs of the real game)
- `game/src/audio.js` — synthesized sound effects (WebAudio, no files)
- `game/src/input.js` — keyboard and mouse input
- `game/src/tuning.js` — every tuning number and colour
- `serve.ts` — a tiny static server for local play-testing
- `shots.json` — the four screenshot scenes
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## License

MIT — see `LICENSE`.
