// Neon Bay — Golden Hour Getaway: entrypoint for the make.fun gta6-01
// bounty (round 12). Copies the playable game and the four staged
// screenshots from this repository into the output directory, then
// writes /output/dossier.json with the kit's buildDossier helper so the
// house judge can read the entry as a dossier-view plus a contact
// sheet of the screenshots. Node 22, standard library only, no
// network, no build step: the game is static files under game/ and
// opens offline in desktop Chrome.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const GAME_NAME = 'Neon Bay — Golden Hour Getaway';

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

function copyTree(name) {
  const src = join(repoRoot, name);
  const dst = join(outDir, name);
  if (!existsSync(src) || !statSync(src).isDirectory()) {
    throw new Error(`${GAME_NAME}: missing ${name}/ in repository`);
  }
  rmSync(dst, { recursive: true, force: true });
  cpSync(src, dst, { recursive: true });
}

// Preflight: the dossier is only as good as the files behind it. Count
// the game files and screenshots before copying so a half-written repo
// fails loudly here instead of silently scoring low.
function preflight() {
  const shots = JSON.parse(readFileSync(join(repoRoot, 'shots.json'), 'utf8'));
  const shotFiles = shots.shots.map((s) => s.file);
  for (const f of shotFiles) {
    if (!existsSync(join(repoRoot, 'screenshots', f))) {
      throw new Error(`${GAME_NAME}: missing screenshot screenshots/${f}`);
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
  copyTree('game');
  copyTree('screenshots');
  const dossier = buildDossier(outDir, caps);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`${GAME_NAME}: wrote ${outDir} (${shotCount} screenshots, dossier ${dossier.length} bytes)`);
}

main();
