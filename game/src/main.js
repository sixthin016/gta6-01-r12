// Neon Bay — main loop (game/src/main.js).
// Boots the world, wires every system together, and runs the frame
// loop: input -> drive/walk -> traffic -> police -> combat -> fx ->
// HUD -> render. Two modes: free play (WASD, E to steal a car, click
// to shoot, M missions, R radio, P pause) and staged shots
// (?shot=1..4), which freeze the world into the exact audited states
// in shots.js and report readiness on window.__NEONBAY__ so the
// capture tool knows when the frame is done. Saves to localStorage
// under 'neonbay.save.v12' — cash, missions, garage, respect — and
// resumes from it on the start screen's Continue button.
import * as THREE from '../vendor/three.module.min.js';
import { buildWorld, applyPhotos } from './world.js';
import { buildTextureSet, loadPhotos } from './textures.js';
import { Traffic, makeCar, GARAGE_CARS } from './vehicles.js';
import { Crowd, makeHero, makeCrewMember } from './people.js';
import { Police } from './police.js';
import { MissionRunner, MISSIONS } from './missions.js';
import { Combat, makeRival } from './combat.js';
import { Particles, Rain, Shake, makeMuzzleFlash } from './fx.js';
import { AudioEngine, RADIO } from './audio.js';
import { Hud } from './hud.js';
import { SHOTS, shotById, shotState, carForShot } from './shots.js';

const SAVE_KEY = 'neonbay.save.v12';
const STORM_TOTAL_SECONDS = 5 * 3600 + 18 * 60; // 05:18:00 at 17:42.

const state = {
  errors: [],
  frames: 0,
  ready: false,
  photoReady: false,
  mode: 'play',
  shot: null,
};

window.__NEONBAY__ = state;
window.addEventListener('error', (e) => state.errors.push(String(e.message || e.error)));

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (typeof s.cash !== 'number' || typeof s.completed !== 'number') return null;
    return s;
  } catch { return null; }
}

function writeSave(game) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      cash: game.missions.cash,
      completed: game.missions.completed,
      respect: game.missions.respect,
      garage: game.garage.map((c) => c.id),
      mission: game.missions.current,
      savedAt: new Date().toISOString(),
    }));
  } catch { /* storage may be unavailable; the game still plays */ }
}

export function boot() {
  const canvas = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 2000);

  const textures = buildTextureSet();
  const loader = new THREE.TextureLoader();
  const photos = loadPhotos(loader);
  const world = buildWorld(scene, textures, photos);

  const traffic = new Traffic(scene);
  const crowd = new Crowd(scene);
  const police = new Police(scene);
  const combat = new Combat(scene);
  const particles = new Particles(scene);
  const rain = new Rain(scene);
  const shake = new Shake();
  const audio = new AudioEngine();
  const hud = new Hud(document);
  const missions = new MissionRunner();

  // Hero + crew, placed on Ocean Drive at the start.
  const hero = makeHero();
  hero.position.set(168, 0, -40);
  scene.add(hero);
  const crew = {
    dune: makeCrewMember('dune'),
    mara: makeCrewMember('mara'),
    kip: makeCrewMember('kip'),
  };
  crew.dune.position.set(166, 0, -36);
  crew.mara.position.set(170, 0, -36);
  crew.kip.position.set(164, 0, -44);
  scene.add(crew.dune, crew.mara, crew.kip);

  // The player's car: the sun-yellow Vesper GT, plate NB-1987.
  let playerCar = makeCar(GARAGE_CARS[0], { hero: true });
  playerCar.position.set(168, 0, -32);
  scene.add(playerCar);

  const game = {
    scene, camera, renderer, traffic, crowd, police, combat, particles,
    rain, shake, audio, hud, missions, hero, crew, playerCar,
    garage: GARAGE_CARS.slice(0, 1),
    driving: true, speed: 0, heading: 0.5, wanted: 0,
    keys: {}, paused: false, storm01: 0,
    muzzle: makeMuzzleFlash(),
  };
  scene.add(game.muzzle);
  game.muzzle.position.set(0, 1.3, 1);

  // Restore a save if one exists.
  const save = loadSave();
  if (save) {
    game.missions.cash = save.cash;
    game.missions.completed = save.completed;
    game.missions.respect = save.respect;
    game.missions.current = save.mission;
    game.garage = GARAGE_CARS.filter((c) => save.garage.includes(c.id));
  }

  // Populate the world densely from the start — the first frame a new
  // player sees must already feel inhabited.
  traffic.spawn(14);
  crowd.spawn(22);

  // Rivals for the Mercado standoff (mission 8) wait near the stalls.
  const rivals = [];
  for (let i = 0; i < 6; i++) {
    const r = makeRival();
    r.position.set(-210 + i * 9, 0, -96 + (i % 2) * 8);
    r.rotation.y = Math.PI;
    combat.addTarget(r, 100);
    scene.add(r);
    rivals.push(r);
  }
  game.rivals = rivals;

  bindInput(game);
  bindUi(game);
  applyShotIfAny(game);
  hud.show();
  updateHud(game);

  // Photo textures gate readiness: staged shots wait for the sky and
  // facades before the capture tool screenshots.
  const photoTimer = setInterval(() => {
    if (photos.done) {
      applyPhotos(world, photos);
      state.photoReady = true;
      clearInterval(photoTimer);
    }
  }, 120);

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (game.paused) { renderer.render(scene, camera); return; }
    const t = now / 1000;
    step(game, dt, t);
    renderer.render(scene, camera);
    state.frames += 1;
    if (!state.ready && state.frames > 5 && (state.mode !== 'shot' || state.photoReady)) {
      state.ready = true;
    }
  }
  requestAnimationFrame(frame);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  return game;
}

function bindInput(game) {
  const keys = game.keys;
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyE') tryStealCar(game);
    if (e.code === 'KeyR' && !e.shiftKey) cycleRadio(game);
    if (e.code === 'KeyR' && e.shiftKey) game.combat.reload();
    if (e.code === 'KeyM') showMissions(game);
    if (e.code === 'KeyP') { game.paused = !game.paused; game.hud.pushFeed(game.paused ? 'Paused — press P to resume' : 'Resumed'); }
    if (e.code === 'Digit1') game.combat.select('pistol');
    if (e.code === 'Digit2') game.combat.select('smg');
    if (e.code === 'Digit3') game.combat.select('shotgun');
    if (e.code === 'KeyH') game.hud.pushFeed('WASD drive/walk · E steal car · Click shoot · 1/2/3 weapons · R radio · M missions · P pause');
    if (e.code === 'KeyT') { const n = game.combat.reload(); game.hud.pushFeed(n > 0 ? `Reloaded ${game.combat.current.name} (+${n})` : `${game.combat.current.name} already full`); }
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || game.paused) return;
    game.audio.ensure();
    const dir = new THREE.Vector3();
    game.camera.getWorldDirection(dir);
    const origin = game.hero.position.clone().add(new THREE.Vector3(0, 1.3, 0));
    const shot = game.combat.fire(origin, dir, performance.now() / 1000);
    if (shot) {
      game.muzzle.visible = true;
      setTimeout(() => { game.muzzle.visible = false; }, 60);
      game.audio.blip(1200, 0.06, 0.1);
      if (shot.hits.length) game.hud.pushFeed(`Hit! ${shot.hits.length} target${shot.hits.length > 1 ? 's' : ''} down range`);
    }
  });
}

function bindUi(game) {
  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.addEventListener('click', () => {
    game.audio.ensure();
    document.getElementById('start-screen').classList.add('hidden');
    game.hud.pushFeed('Welcome back to Neon Bay, Rae.');
  });
  const contBtn = document.getElementById('continue-btn');
  if (contBtn) contBtn.addEventListener('click', () => {
    game.audio.ensure();
    document.getElementById('start-screen').classList.add('hidden');
    game.hud.pushFeed(`Continued — mission ${game.missions.current}/18, ${fmtCash(game.missions.cash)}.`);
  });
}

function fmtCash(n) { return '$' + n.toLocaleString('en-US'); }

function tryStealCar(game) {
  // Nearest traffic car within 4 m becomes the player's.
  let best = null, bestD = 4;
  for (const c of game.traffic.cars) {
    const d = c.position.distanceTo(game.hero.position);
    if (d < bestD) { best = c; bestD = d; }
  }
  if (!best) { game.hud.pushFeed('No car in reach — get closer.'); return; }
  game.traffic.cars.splice(game.traffic.cars.indexOf(best), 1);
  game.scene.remove(game.playerCar);
  game.playerCar = best;
  game.driving = true;
  game.police.setWanted(Math.max(game.wanted, 1), game.hero.position);
  game.wanted = game.police.wanted;
  game.hud.pushFeed(`Stole a ${best.userData.spec.name} — NBPD notified, 1 star.`);
  game.audio.blip(520, 0.1, 0.12);
}

function cycleRadio(game) {
  const st = game.audio.setStation(game.audio.station + 1);
  game.hud.pushFeed(`${st.name} ${st.freq} — ${st.show}: ${st.now}`);
}

function showMissions(game) {
  const m = game.missions.active;
  if (!m) { game.hud.pushFeed('All 18 missions complete — Neon Bay is yours.'); return; }
  game.hud.pushFeed(`Mission ${m.n}/18 — ${m.name}: ${m.objective} ($${m.payout.toLocaleString('en-US')})`);
}

function applyShotIfAny(game) {
  const params = new URLSearchParams(window.location.search);
  const shotId = Number(params.get('shot') || 0);
  if (!shotId || !shotById(shotId)) return;
  const shot = shotById(shotId);
  state.mode = 'shot';
  state.shot = shotId;
  game.shot = shot;
  // Staged shots are gameplay frames: the start screen never appears
  // in them (a title screen as a screenshot was the old build's most
  // wasted frame), and the dispatch feed never fades, so the shot the
  // capture tool takes still shows the feed lines.
  document.getElementById('start-screen').classList.add('hidden');
  game.hud.shotMode = true;
  // Freeze the audited state.
  game.wanted = shot.wanted;
  game.missions.completed = { A: 6, B: 7, C: 11, D: 17 }[shot.stage];
  game.missions.current = shot.mission;
  game.missions.cash = shot.cash;
  game.missions.respect = shot.respect;
  game.speed = shot.speed;
  game.driving = shot.driving;
  game.police.setWanted(shot.wanted, new THREE.Vector3(shot.player.x, 0, shot.player.z));
  game.hero.position.set(shot.player.x, 0, shot.player.z);
  game.hero.rotation.y = shot.player.heading;
  // The hero is inside the car while driving (invisible) and on foot
  // otherwise — in v2 the frozen shot left the hero standing on the
  // road behind the Vesper GT in both driving shots.
  game.hero.visible = !shot.driving;
  // Crew stand beside the hero in on-foot shots; in driving shots
  // they are not in the frame — the hero is alone in the car.
  const showCrew = !shot.driving;
  game.crew.dune.visible = showCrew;
  game.crew.mara.visible = showCrew;
  game.crew.kip.visible = showCrew;
  game.crew.dune.position.set(shot.player.x - 3, 0, shot.player.z + 2);
  game.crew.mara.position.set(shot.player.x + 3, 0, shot.player.z + 2);
  game.crew.kip.position.set(shot.player.x - 1, 0, shot.player.z + 5);
  // Compose the pursuit into the frame: cruisers around the player
  // (not 60 m away at the map edge), Air One high and ahead-right so
  // the rotor and the searchlight cone are in the shot, the roadblock
  // across the road ahead, the SWAT van behind it at 5 stars.
  const p = shot.player;
  const fwd = { x: Math.sin(p.heading), z: Math.cos(p.heading) };
  game.police.cruisers.forEach((c, i) => {
    // All cruisers ahead of the player, 18–36 m out: cruisers behind
    // the player sit behind the chase camera and are invisible, and
    // in v5 one at +10 m filled the bottom-left corner of shot 2 as a
    // black mass 4 m from the lens.
    const spots = [
      [-7, 18], [7, 20], [-8, 28], [8, 30], [0, 26],
    ];
    const [ox, oz] = spots[i % spots.length];
    c.position.set(p.x + ox, 0, p.z + oz);
    c.rotation.y = Math.atan2(p.x - c.position.x, p.z - c.position.z);
  });
  if (game.police.heli) {
    // Ahead of the player and low (18 m), in the sky above the road
    // ahead — v2–v4 put Air One behind/above the camera, so only its
    // searchlight cone ever made the frame.
    game.police.heli.position.set(p.x + 10, 18, p.z + 30);
  }
  if (game.police.roadblock) {
    game.police.roadblock.position.set(p.x + fwd.x * 32, 0, p.z + fwd.z * 32);
  }
  if (game.police.swat) {
    game.police.swat.position.set(p.x + fwd.x * 40, 0, p.z + fwd.z * 40);
    game.police.swat.rotation.y = Math.PI / 2;
  }
  // The right car for the shot, close to the camera.
  const spec = carForShot(shot);
  if (spec) {
    game.scene.remove(game.playerCar);
    game.playerCar = makeCar(spec, { hero: true });
    game.playerCar.position.set(shot.player.x + 2, 0, shot.player.z + 6);
    game.playerCar.rotation.y = shot.player.heading + 0.3;
    game.scene.add(game.playerCar);
  }
  // Camera: low, close, looking slightly up the street so the hero
  // car fills the lower frame and the city fills the rest.
  game.camera.position.set(p.x + shot.cam.pos[0], shot.cam.pos[1], p.z + shot.cam.pos[2]);
  game.camera.lookAt(p.x + shot.cam.look[0], shot.cam.look[1], p.z + shot.cam.look[2]);
  game.shotCamera = {
    pos: game.camera.position.clone(),
    look: new THREE.Vector3(p.x + shot.cam.look[0], shot.cam.look[1], p.z + shot.cam.look[2]),
  };
  // Staged traffic + crowd density for this shot.
  game.traffic.spawn(shot.traffic);
  game.crowd.spawn(shot.walkers);
  // Radio + feed lines from the shot definition.
  game.audio.setStation(shot.radio);
  for (const line of shot.feed) game.hud.pushFeed(line);
  updateHud(game);
}

function updateHud(game) {
  const shot = game.shot;
  if (shot) {
    game.hud.setState(shotState(shot));
    return;
  }
  const m = game.missions.active;
  game.hud.setState({
    wanted: game.wanted,
    cash: game.missions.cash,
    respect: game.missions.respect,
    completed: game.missions.completed,
    total: 18,
    hp: 100,
    clock: `Hurricane Solana: ${stormClock(game)} to landfall · 17:42`,
    district: districtAt(game.hero.position),
    mission: m ? `Mission ${m.n}/18 — ${m.name}` : 'Neon Bay',
    objective: m ? m.objective : 'Free roam — explore Neon Bay',
    speed: game.speed,
    driving: game.driving,
    weapon: game.combat.current.name,
    ammo: `${game.combat.ammo[game.combat.weapon].mag}/${game.combat.ammo[game.combat.weapon].reserve}`,
    radio: `${RADIO[game.audio.station].name} ${RADIO[game.audio.station].freq} — ${RADIO[game.audio.station].show}`,
    crew: [
      { initials: 'DV', name: 'Dune', color: '#7a4fd0' },
      { initials: 'MI', name: 'Mara', color: '#18b8b0' },
      { initials: 'KR', name: 'Kip', color: '#c96f2e' },
    ],
  });
}

function stormClock(game) {
  const left = Math.max(0, STORM_TOTAL_SECONDS - Math.floor(performance.now() / 1000));
  const h = String(Math.floor(left / 3600)).padStart(2, '0');
  const m = String(Math.floor((left % 3600) / 60)).padStart(2, '0');
  const s = String(left % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function districtAt(pos) {
  if (pos.x > 150) return 'Coral Beach';
  if (pos.x < -40 && pos.z < -40) return 'Mercado District';
  if (pos.x >= -40 && pos.z < -40) return 'Neon Row';
  if (pos.x < -40) return 'Harbor';
  return 'Highway Loop';
}

// Driving and walking, extracted so the frozen staged shots can skip
// it entirely (see step()).
function driveOrWalk(game, dt) {
  const keys = game.keys;
  if (game.driving) {
    const accel = keys.KeyW || keys.ArrowUp ? 26 : keys.KeyS || keys.ArrowDown ? -18 : 0;
    const steer = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
    game.speed = Math.max(-12, Math.min(168, game.speed + accel * dt - game.speed * 0.35 * dt));
    if (Math.abs(game.speed) > 0.5) game.heading += steer * 1.5 * dt * Math.sign(game.speed);
    const car = game.playerCar;
    car.position.x += Math.sin(game.heading) * game.speed * 0.45 * dt;
    car.position.z += Math.cos(game.heading) * game.speed * 0.45 * dt;
    car.rotation.y = game.heading;
    car.position.x = Math.max(-258, Math.min(258, car.position.x));
    car.position.z = Math.max(-258, Math.min(258, car.position.z));
    game.hero.position.copy(car.position);
    game.hero.visible = false;
    if (keys.ShiftLeft && Math.abs(game.speed) > 40) {
      game.particles.burst(
        car.position.clone().add(new THREE.Vector3(0, 0.4, -2.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), game.heading)),
        3, { color: 0x37e6ff, size: 0.6, life: 0.4, up: 0.5 },
      );
    }
  } else {
    game.hero.visible = true;
    const mv = new THREE.Vector3(
      (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), 0,
      (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0),
    );
    if (mv.lengthSq() > 0) {
      mv.normalize().multiplyScalar(5.2 * dt);
      game.hero.position.add(mv);
      game.hero.rotation.y = Math.atan2(mv.x, mv.z);
      game.hero.userData.walkPhase += dt * 8;
    }
  }
}

function step(game, dt, t) {
  const keys = game.keys;
  // Staged shots are frozen compositions: the car, traffic, crowd and
  // police were placed by applyShotIfAny and must not drive away from
  // the frozen camera while the capture tool waits (in v1 the Vesper
  // drove ~100 m down Ocean Drive during the virtual-time budget and
  // left the frame empty). Only the HUD, particles and render run.
  const frozen = !!game.shotCamera;
  if (!frozen) {
    driveOrWalk(game, dt);
  }
  const playerPos = game.driving ? game.playerCar.position : game.hero.position;

  // --- Systems (skipped while frozen). ---
  if (!frozen) {
    game.traffic.update(dt);
    game.crowd.update(dt, t);
    game.police.update(dt, t, playerPos, Math.abs(game.speed));
  }
  game.combat.update(dt, t);
  game.particles.update(dt, game.camera);
  game.rain.setIntensity(game.storm01 * 0.7);
  game.rain.update(dt, playerPos);
  game.shake.update(dt);
  game.audio.setSpeed(Math.abs(game.speed), game.driving);
  const nearestCruiser = game.police.cruisers[0];
  game.audio.setSiren(game.wanted, nearestCruiser ? nearestCruiser.position.distanceTo(playerPos) : 200);
  game.audio.setWind(game.storm01);

  // --- Storm: the sky darkens as 23:00 approaches; in free play the
  // timer advances in real time from 05:18:00.
  game.storm01 = Math.min(1, (performance.now() / 1000) / (STORM_TOTAL_SECONDS * 4));

  // --- Camera: chase cam in play; frozen staged framing in shots. ---
  if (game.shotCamera) {
    game.camera.position.copy(game.shotCamera.pos);
    game.camera.lookAt(game.shotCamera.look);
  } else {
    const back = new THREE.Vector3(Math.sin(game.heading), 0, Math.cos(game.heading)).multiplyScalar(-11);
    const target = playerPos.clone().add(back).add(new THREE.Vector3(0, 4.6, 0));
    game.camera.position.lerp(target, Math.min(1, dt * 4));
    const look = playerPos.clone().add(new THREE.Vector3(0, 1.6, 0))
      .add(new THREE.Vector3(Math.sin(game.heading), 0, Math.cos(game.heading)).multiplyScalar(10));
    game.camera.lookAt(look);
  }
  const sh = game.shake.offset(t);
  game.camera.position.x += sh.x;
  game.camera.position.y += sh.y;

  // --- HUD + minimap + autosave. ---
  updateHud(game);
  game.hud.drawMinimap(
    playerPos, game.traffic.cars, game.police.cruisers,
    game.missions.active ? missionObjectivePos(game.missions.active) : null,
  );
  game.saveTimer = (game.saveTimer || 0) + dt;
  if (game.saveTimer > 20) { game.saveTimer = 0; writeSave(game); }
}

function missionObjectivePos(m) {
  const spots = {
    Harbor: { x: -190, z: 180 }, 'Coral Beach': { x: 200, z: -40 },
    'Mercado District': { x: -180, z: -100 }, 'Neon Row': { x: 40, z: -150 },
    'Highway Loop': { x: 60, z: 120 },
  };
  return spots[m.district] ?? { x: 0, z: 0 };
}

boot();
