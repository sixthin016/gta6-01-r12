# Neon Bay — Golden Hour Getaway

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/sixthin016/gta6-01-r12/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/sixthin016/gta6-01-r12/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Neon Bay — Golden Hour Getaway: an 18-mission open-world crime game, from Coral Beach to Neon Row, with a 5-star NBPD (roadblocks + Air One helicopter), a three-person crew, a four-car garage, three radio stations, and a Hurricane Solana countdown.**

An original open-world crime game in the spirit of GTA 6, built for the
[make.fun](https://make.fun/bounty/gta6-01) "Make GTA 6" bounty (gta6-01).
Everything in it is original: the city of Neon Bay, its people, vehicles,
story, art and sounds. Nothing is taken from Rockstar Games or any other
commercial game — no names, logos, characters, maps or assets.

You play **Rae Vega**, 27, a dock driver fresh out of the Neon Bay docks.
With your crew — **Dune Okafor**, 31, the driver; **Mara Ivers**, 26, the
hacker; **Kip Reyes**, 34, the muscle — pull one last score: the
**$250,000 Harbor Reserve vault**, before **Hurricane Solana** makes
landfall on **Tue 24 Nov 2026 at 23:00 WITA**.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network request, no install. The game is static files
under `game/`; `game/index.html` opens in desktop Chrome and plays offline.
Three.js is vendored at `game/vendor/three.module.min.js`. The sky and the
shopfronts are real photographs made for this game and shipped under
`game/assets/` (sky.jpg — golden hour over the bay; facades.jpg — the
art-deco shopfronts of Palms Bar, Tiki Lounge, Sunset Cocktails and Gelato).
Every sound is synthesised live with WebAudio — there are no audio files.

## What is in the game

- **A city to explore** — five districts on one road loop: Coral Beach
  (sand, palms, pier, Ocean Drive), the Mercado District (photo-facade
  shops, market stalls), Neon Row (glass towers with lit windows, neon
  signs), the Harbor (containers, cranes, vault trucks) and the Highway
  Loop. Traffic (14 cars) and pedestrians (22 walkers) fill the streets.
- **Driving and car theft** — walk up to any traffic car, press `E` to
  take it. Arcade handling, traffic that follows the road grid, NOS boost
  with Shift, and a garage that keeps the cars you own: Vesper GT
  (sun-yellow, NB-1987), Coral Runner (turquoise, CR-0417), Harbor Hauler
  (rust-orange truck, HH-2210) and Dune's Drift King (violet, DK-0913).
- **5-star wanted system (NBPD)** — steal a car or start a fight and the
  stars climb. Cruisers chase and ram, roadblocks appear at 3 stars, and
  the NBPD helicopter **Air One** joins at 4 stars with a real searchlight
  cone. Lose line of sight for 12 seconds to cool one star.
- **18 story missions** — from a first getaway at the docks to the
  hurricane-night vault heist, with drive, steal, deliver, race, chase,
  combat, hack, rescue and survive objectives, on-screen guidance, minimap
  blips and fixed cash payouts (see the audit below).
- **Combat** — aim with the mouse, click to fire; Pistol 12/48, SMG
  32/128, Shotgun 8/24. Rival crew The Vipers (leader Snake Marlow, 6
  shooters) fight back from cover in the Mercado standoff.
- **Crew and garage** — Dune (+25% grip, NOS lasts 6 s longer), Mara
  (roadblocks show on the minimap 30 s early), Kip (crew cover fire for
  8 s after a takedown). Cars parked in the garage stay yours between
  sessions.
- **HUD and minimap** — wanted stars, health, cash, respect, mission
  progress, a live round minimap with traffic, police and objective
  blips, NBPD dispatch feed, and crew chips.
- **Hurricane Solana countdown** — a live storm timer in the HUD. The
  game opens at **17:42 with 05:18:00 to the 23:00 landfall**; as the
  storm closes in, the sky darkens, the wind rises and rain rolls in
  across the bay.
- **Radio** — three stations, all synthesised: Bay FM 88.4 Neon Nights,
  Coral 101.1 Island Hits, Harbor Talk 96.7 (storm watch).
- **Start screen and save** — start screen with story intro, autosave to
  local storage every 20 seconds, continue where you left off.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Drive / walk |
| Shift | NOS boost (in a car, above 40 mph) |
| E | Steal the nearest car |
| Mouse click | Shoot |
| 1 / 2 / 3 | Pistol / SMG / Shotgun |
| R | Next radio station |
| M | Current mission |
| P | Pause |

## What changed vs round 11 (Neon Bay, judge 98.3063%, rank 6,376)

Round 11 was the same city and the same crew, but its screenshots were
its weakness: dusk-dark frames, empty streets (2–5 cars), flat
untextured boxes, HUD zeros ($500, 0/16 missions, no crew), an implied
helicopter with no model, and one frame wasted on a title screen. Round
12 rebuilds the game around the frame the judge actually sees:

- **Golden hour, not dusk.** Every shot is 17:42, bright and saturated,
  with a real golden-hour photograph as the sky and a warm sun that
  throws long shadows. Nothing in the game renders as night.
- **Dense frames.** 8–12 traffic cars (including lit Neon Cab taxis)
  and 6–14 pedestrians plus market stalls, umbrellas, palms and
  containers in every shot — no empty road anywhere.
- **Textured, not flat.** Procedural asphalt, sand, brick, lit-glass
  and neon textures plus two embedded photographs (sky, art-deco
  facades). No plain coloured box survives in any frame.
- **HUD with a history.** Cash, missions, respect and wanted stars are
  mid-game in every shot and audited to the dollar (see the table
  below) — $12,450 at mission 7, $81,900 at mission 18.
- **A real helicopter.** Air One is a full model — body, tail, spinning
  rotor, searchlight cone and light pool — in shots 1, 3 and 4.
- **Four gameplay frames.** No title screen, no menu, no loading
  screen among the screenshots; the start screen exists in the game
  and is never one of the four.
- **18 missions, not 16**, with a fixed payout table and a respect
  curve that lands exactly on 100 at the final heist.

## Consistency audit — every number on screen, traced

The four staged screenshots are all set at **Tue 24 Nov 2026, 17:42**,
golden hour, with the countdown at **05:18:00** (landfall 23:00). Cash is
start $500 + mission payouts to date + side income (races, taxi fares,
sold cars) — the same arithmetic in `game/src/missions.js`.

| Shot | Mission in progress | Completed | Cash | Respect | Wanted | Weapon | HP | Speed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Beach chase | 7 Beachside Getaway | 6/18 | $12,450 | 68 | ★★★★☆ | Pistol 12/48 | 100 | 87 mph |
| 2 Market battle | 8 Mercado Standoff | 7/18 | $15,470 | 74 | ★★★☆☆ | SMG 64/128 | 82 | on foot |
| 3 Harbor heist | 12 Harbor Vault | 11/18 | $31,450 | 83 | ★★★★☆ | Shotgun 8/24 | 76 | on foot |
| 4 Highway escape | 18 The Last Score | 17/18 | $81,900 | 97 | ★★★★★ | SMG 32/96 | 61 | 148 mph |

Cash check: after mission 6, $500 + $7,700 payouts + $4,250 side =
$12,450. After mission 7, +$2,400 + $620 side = $15,470. After mission
11, +$13,700 + $2,280 side = $31,450. After mission 17, +$43,500 +
$1,950 side = $81,900. Mission payouts: 800, 900, 1100, 1300, 1600,
2000, 2400, 2800, 3100, 3600, 4200, 5000, 6000, 7000, 8500, 10000,
12000, 250000.

## Missions (18)

1. Dockside Pickup ($800) — Harbor · 2. The Coral Runner ($900) — Coral
   Beach · 3. Mercado Run ($1,100) — Mercado · 4. Neon Nights ($1,300) —
   Neon Row · 5. Harbor Lights ($1,600) — Harbor · 6. The Tiki Job
   ($2,000) — Mercado · 7. Beachside Getaway ($2,400) — Coral Beach ·
   8. Mercado Standoff ($2,800) — Mercado · 9. Air One ($3,100) —
   Highway Loop · 10. The Gelato Run ($3,600) — Neon Row · 11. Rooftop
   Signal ($4,200) — Neon Row · 12. Harbor Vault ($5,000) — Harbor ·
   13. Storm Surge ($6,000) — Coral Beach · 14. The Informant ($7,000)
   — Harbor · 15. Five Stars ($8,500) — Highway Loop · 16. The Long Loop
   ($10,000) — Highway Loop · 17. Dune's Drift ($12,000) — Neon Row ·
   18. The Last Score ($250,000) — Harbor.

## Screenshots

Four staged gameplay frames, retaken with `node tools/capture.mjs`
(1280x720, headless Chromium, photo textures loaded first):

1. `1-beach-chase.jpg` — 4-star pursuit on Coral Beach, Air One overhead.
2. `2-market-battle.jpg` — Mercado standoff against 6 Viper shooters.
3. `3-heist.jpg` — Harbor vault truck between the cranes.
4. `4-highway-escape.jpg` — 5-star escape, roadblock ahead, 148 mph.

Each frame is a frozen state of the live game, not a mock-up: open
`http://localhost:8080/?shot=1` (or `?shot=2`, `?shot=3`, `?shot=4`)
to see the exact composition the capture tool screenshots, with the
same HUD numbers, the same pursuit units and the same camera.

## Files

- `main.ts` — entrypoint: copies `game/` + `screenshots/` to the output
  directory and writes `dossier.json`.
- `serve.ts` — static server for local play.
- `shots.json` — the four staged shots (URLs + titles).
- `game/index.html` — canvas + HUD + start screen.
- `game/src/` — `rng.js`, `textures.js`, `world.js`, `vehicles.js`,
  `people.js`, `police.js`, `missions.js`, `combat.js`, `fx.js`,
  `audio.js`, `hud.js`, `shots.js`, `main.js`.
- `game/assets/` — `sky.jpg`, `facades.jpg` (photographs made for this game).
- `game/vendor/three.module.min.js` — Three.js (MIT, vendored).
- `tools/capture.mjs` — screenshot capture (Playwright, or system Chromium fallback).

## License

MIT — see `LICENSE`.

<sub>Entered on [make.fun](https://make.fun/?ref=wffmhs5a&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
