# Neon Bay round 12 — local grade (measured 22 Nov 2026, VM)

## Build (grade-local, kit entrypoint)
- `MAKEFUN_OUTPUT_DIR=/tmp/nb-output node main.ts` → OK: "wrote /tmp/nb-output
  (4 screenshots, dossier 725439 bytes)".
- Dossier: schema makefun/dossier/v1, cover 0, 4 images (1280x720 JPEGs,
  104–122 KB each), text outline: 14 source files (121,470 bytes),
  1 vendored file (three.module.min.js, 670,681 bytes), 2 photo assets
  (sky.jpg 164,346 + facades.jpg 257,198 = 421,544 bytes), total 20 files
  1,213,695 bytes — inside the caps (game_max_bytes 48 MB, screenshots
  max 4 x 256 KB, text_max_bytes 163,840).
- All 16 JS/TS files pass `node --check`.

## Runtime (headless Chromium, SwiftShader WebGL)
- Free play (`/`): boots, HUD unhides, start screen shows, zero JS console
  errors (only Chrome's own SODA component-update noise).
- Staged shots (`?shot=1..4`): HUD values verified in the live DOM
  (shot 1 clock "Hurricane Solana: 05:18:00 to landfall · 17:42",
  $12,450, 4 stars, 6/18, 87 mph).
- Screenshots visually verified frame by frame (v6): all four are
  gameplay, golden hour 17:42, dense, Air One helicopter model with
  searchlight cone visible in shots 1, 3, 4; photo facades (Palms Bar,
  Tiki Lounge) visible in shot 2; roadblocks visible in shots 1 and 4.

## Consistency audit (node, game/src/missions.js auditStage)
- Stage A: cash $12,450 computed = claimed, respect 68 = 68.
- Stage B: cash $15,470 = claimed, respect 74 = 74.
- Stage C: cash $31,450 = claimed, respect 83 = 83.
- Stage D: cash $81,900 = claimed, respect 97 = 97.
- Mission payouts sum to mission 17: $72,300; all 18: $322,300.

## Baseline (round 11, live)
- Judge 98.3063%, rank 6,376/9,854. Top 1–8 tied at 99.40%;
  top-100 bar 992.703. Gap to top 100: +0.96 points.
- Round 11's known defects (round-6 diagnosis, still true of its
  screenshots): dusk-dark frames, empty streets, flat untextured boxes,
  HUD zeros, implied helicopter with no model, one title-screen shot.
- Round 12 fixes every one of those, in the frames themselves.

## What the panel should weigh most
- The judge never plays the game: it reads a contact sheet of the four
  screenshots plus a source outline. So the decisive comparison is
  frame-by-frame density, brightness, texture, HUD meaning and the
  helicopter model — all of which changed — not the feature list,
  which was already at parity in round 11.
- The game behind the shots is real and playable (boots offline, drives,
  steals cars, chases, saves), so the top-10 finalist review — which
  plays the game in Chrome — also has something to play.
