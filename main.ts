// Neon Bay — entrypoint for the make.fun gta6-01 bounty (round 12).
//
// What this file does, in order:
//   1. Preflight — checks the four staged screenshots and the game
//      entry point exist, so a half-written repo fails loudly here
//      instead of silently scoring low.
//   2. Copy — copies `game/` and `screenshots/` from this repository
//      into the output directory.
//   3. Dossier — writes /output/dossier.json with the kit's
//      buildDossier helper, so the house judge reads the entry as a
//      dossier view plus a contact sheet of the screenshots.
//
// Node 22, standard library only, no network, no build step: the game
// is static files under game/ and opens offline in desktop Chrome.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const GAME_NAME = 'Neon Bay — Golden Hour Getaway';

// The top-level directories copied into the output, in order.
const ENTRY_DIRS = ['game', 'screenshots'];

// Submission limits the dossier builder enforces. Keep in sync with
// the bounty rules: at most 4 screenshots, and the game stays under
// the file-count and byte budgets.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

// Copy one top-level directory (game/ or screenshots/) into the
// output directory, replacing any previous copy.
function copyEntryDir(dirName) {
  const src = join(repoRoot, dirName);
  const dst = join(outDir, dirName);
  if (!existsSync(src) || !statSync(src).isDirectory()) {
    throw new Error(`${GAME_NAME}: missing ${dirName}/ in repository`);
  }
  rmSync(dst, { recursive: true, force: true });
  cpSync(src, dst, { recursive: true });
}

// Preflight: the dossier is only as good as the files behind it.
// Returns the number of staged screenshots, after verifying each
// one and the game entry point exist on disk.
function preflight() {
  const manifest = JSON.parse(readFileSync(join(repoRoot, 'shots.json'), 'utf8'));
  const shotFiles = manifest.shots.map((shot) => shot.file);
  for (const file of shotFiles) {
    if (!existsSync(join(repoRoot, 'screenshots', file))) {
      throw new Error(`${GAME_NAME}: missing screenshot screenshots/${file}`);
    }
  }
  if (!existsSync(join(repoRoot, 'game', 'index.html'))) {
    throw new Error(`${GAME_NAME}: missing game/index.html`);
  }
  return shotFiles.length;
}

function main() {
  const shotCount = preflight();
  mkdirSync(outDir, { recursive: true });
  for (const dirName of ENTRY_DIRS) copyEntryDir(dirName);
  const dossier = buildDossier(outDir, DOSSIER_LIMITS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`${GAME_NAME}: wrote ${outDir} (${shotCount} screenshots, dossier ${dossier.length} bytes)`);
}

main();
