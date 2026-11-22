// Neon Bay — the city (game/src/world.js).
// The island is a 520 x 520 metre grid, five districts stitched around
// one road loop, with the ocean to the east and Coral Beach along it.
// Every district has its own palette and props, so a screenshot can be
// read at thumbnail size: pink-and-teal art-deco shopfronts in the
// Mercado, glass towers on Neon Row, containers and cranes at the
// Harbor, sand and palms on Coral Beach, wide asphalt on the Highway
// Loop. Buildings in the Mercado and on Neon Row wear the photographic
// facades texture; towers wear procedural lit glass; houses wear brick.
// The sky is the real golden-hour photograph (assets/sky.jpg) wrapped
// around the world as a backdrop dome, so the horizon is never a flat
// colour.
import * as THREE from '../vendor/three.module.min.js';
import { mulberry32, pick, range, rangeInt } from './rng.js';

export const WORLD = {
  size: 520,
  half: 260,
  // District rectangles: [x0, z0, x1, z1] in metres.
  districts: {
    coralBeach: { name: 'Coral Beach', rect: [150, -260, 260, 260], sand: true },
    mercado: { name: 'Mercado District', rect: [-260, -260, -40, -40] },
    neonRow: { name: 'Neon Row', rect: [-40, -260, 150, -40] },
    harbor: { name: 'Harbor', rect: [-260, 40, -40, 260] },
    highway: { name: 'Highway Loop', rect: [-40, 40, 150, 260] },
  },
  // Canonical city facts, repeated identically in README, HUD and shots.
  hero: 'Rae Vega',
  police: 'NBPD',
  heliCallsign: 'Air One',
  hurricane: 'Hurricane Solana',
  landfall: 'Tue 24 Nov 2026, 23:00 WITA',
  clock: 'Tue 24 Nov 2026, 17:42',
  streets: ['Ocean Drive', 'Mercado Lane', 'Neon Row', 'Harbor Road', 'Highway Loop'],
};

const PALETTES = {
  mercado: ['#ff9eb5', '#37c8c3', '#ffd166', '#ff7a59', '#fff3e0'],
  neonRow: ['#1d3350', '#274b74', '#ff4fd8', '#37e6ff', '#ffb13d'],
  harbor: ['#c96f2e', '#3e6b8e', '#e8d9b0', '#7a8a99', '#b3402f'],
  coralBeach: ['#f4dcab', '#e8c98f', '#37c8c3', '#ffffff', '#ff9eb5'],
  highway: ['#5a6068', '#3a3e46', '#d8c25a', '#2e3138', '#8a929c'],
};

function box(w, h, d, color, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color, roughness: opts.rough ?? 0.85, metalness: opts.metal ?? 0.05,
    map: opts.map ?? null, emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
  });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function makePalm(textures, rand, height = 7) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.24, height, 7),
    new THREE.MeshStandardMaterial({ map: textures.bark, roughness: 1 }),
  );
  trunk.position.y = height / 2;
  trunk.rotation.z = range(rand, -0.08, 0.08);
  trunk.castShadow = true;
  g.add(trunk);
  const frondMat = new THREE.MeshStandardMaterial({ color: 0x2f9e4f, roughness: 0.9, side: THREE.DoubleSide });
  for (let i = 0; i < 8; i++) {
    const frond = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.7), frondMat);
    const a = (i / 8) * Math.PI * 2 + rand() * 0.4;
    frond.position.set(Math.cos(a) * 1.2, height + 0.25, Math.sin(a) * 1.2);
    // Tilt the frond outward and down, facing away from the trunk.
    frond.rotation.order = 'YXZ';
    frond.rotation.y = -a + Math.PI / 2;
    frond.rotation.x = -0.55 - rand() * 0.25;
    frond.castShadow = true;
    g.add(frond);
  }
  const nuts = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x6b4a22, roughness: 1 }),
  );
  nuts.position.y = height - 0.1; nuts.scale.set(1.6, 0.8, 1.6);
  g.add(nuts);
  return g;
}

export function makeUmbrella(rand, color) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6),
    new THREE.MeshStandardMaterial({ color: 0xe8e0cc, roughness: 0.8 }),
  );
  pole.position.y = 1.2; g.add(pole);
  const top = new THREE.Mesh(
    new THREE.ConeGeometry(1.7, 0.7, 10),
    new THREE.MeshStandardMaterial({ color, roughness: 0.75, side: THREE.DoubleSide }),
  );
  top.position.y = 2.6; top.castShadow = true; g.add(top);
  return g;
}

export function makeNeonSign(textures, text, width = 9) {
  // A glowing sign board: dark backing, neon strip texture, and canvas
  // lettering drawn once so the sign reads in screenshots.
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#12081f'; ctx.fillRect(0, 0, 512, 128);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // Auto-fit: shrink the font until the whole text fits the board —
  // in v2 "HURRICANE SOLANA — 05:18:00" was clipped to "ANE SOLANA".
  let size = 64;
  ctx.font = `bold ${size}px Georgia, serif`;
  while (ctx.measureText(text).width > 480 && size > 20) {
    size -= 4;
    ctx.font = `bold ${size}px Georgia, serif`;
  }
  ctx.shadowColor = '#ff4fd8'; ctx.shadowBlur = 26;
  ctx.fillStyle = '#ffd7f6';
  ctx.fillText(text, 256, 66);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#37e6ff'; ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 500, 116);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width / 4),
    new THREE.MeshBasicMaterial({ map: tex, transparent: false }),
  );
  return m;
}

export function buildWorld(scene, textures, photos) {
  const rand = mulberry32(1987);
  const root = new THREE.Group();
  root.name = 'NeonBayCity';
  scene.add(root);

  // --- Sky dome: the real golden-hour photograph when it has loaded,
  // a painted sunset gradient until then. The photo arrives
  // asynchronously (see applyPhotoSky below); the dome exists from
  // the first frame either way, so the horizon is never a flat colour.
  const skyGeo = new THREE.SphereGeometry(900, 24, 16);
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 512; skyCanvas.height = 256;
  const sctx = skyCanvas.getContext('2d');
  const sgrad = sctx.createLinearGradient(0, 0, 0, 256);
  sgrad.addColorStop(0, '#2a4a7a'); sgrad.addColorStop(0.45, '#ff9e57');
  sgrad.addColorStop(0.62, '#ffc27a'); sgrad.addColorStop(0.75, '#1fa8a0');
  sgrad.addColorStop(1, '#0e7d8c');
  sctx.fillStyle = sgrad; sctx.fillRect(0, 0, 512, 256);
  sctx.fillStyle = 'rgba(255,240,200,0.9)';
  sctx.beginPath(); sctx.arc(360, 150, 22, 0, Math.PI * 2); sctx.fill();
  const skyFallback = new THREE.CanvasTexture(skyCanvas);
  skyFallback.colorSpace = THREE.SRGBColorSpace;
  const skyMat = new THREE.MeshBasicMaterial({
    map: photos.sky ?? skyFallback, side: THREE.BackSide, fog: false,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.name = 'GoldenHourSky';
  root.add(sky);

  // --- Ocean (east) + sand (Coral Beach) + city ground. ---
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    new THREE.MeshStandardMaterial({ map: textures.water, roughness: 0.25, metalness: 0.35 }),
  );
  ocean.rotation.x = -Math.PI / 2; ocean.position.set(420, -0.4, 0);
  ocean.receiveShadow = true; root.add(ocean);

  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 520),
    new THREE.MeshStandardMaterial({ map: textures.sand, roughness: 1 }),
  );
  sand.rotation.x = -Math.PI / 2; sand.position.set(200, 0.02, 0);
  sand.receiveShadow = true; root.add(sand);

  // City ground is light pavement, not asphalt: the roads are dark,
  // the blocks between them are pale concrete, so the city reads as
  // a city instead of one black expanse (the round-11 failure in the
  // Mercado, where the ground swallowed the stalls).
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(420, 520),
    new THREE.MeshStandardMaterial({ map: textures.sidewalk, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2; ground.position.set(-50, 0, 0);
  ground.receiveShadow = true; root.add(ground);

  // --- Roads: the loop plus cross streets, with kerbs. ---
  const roadMat = new THREE.MeshStandardMaterial({ map: textures.asphalt, roughness: 0.9 });
  const roads = [
    [0, 0, 420, 14], [0, -150, 420, 12], [0, 150, 420, 12],
    [-150, 0, 14, 520], [-40, 0, 12, 520], [60, 0, 12, 520], [150, 0, 12, 520],
  ];
  for (const [x, z, w, d] of roads) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), roadMat);
    r.rotation.x = -Math.PI / 2; r.position.set(x, 0.06, z);
    r.receiveShadow = true; root.add(r);
  }

  // --- Mercado: photo-facade shopfronts in a row, awnings, stalls. ---
  // The facade material starts untextured; applyPhotos() below swaps
  // the real photograph in the moment it finishes loading, so the
  // shops are never flat pink boxes in a screenshot.
  const mercadoRow = new THREE.Group();
  const facadeMat = new THREE.MeshStandardMaterial({ color: 0xff9eb5, roughness: 0.8 });
  const facadeTargets = [];
  for (let i = 0; i < 6; i++) {
    const shop = box(16, range(rand, 9, 13), 10, 0xffffff, { map: photos.facades ? facadeMat.map : null });
    shop.position.set(-230 + i * 34, shop.geometry.parameters.height / 2, -120);
    facadeTargets.push(shop.material);
    mercadoRow.add(shop);
    const awning = box(16, 0.4, 5, pick(rand, [0xff7a59, 0x37c8c3, 0xffd166, 0xff4fd8]), { rough: 0.7 });
    awning.position.set(-230 + i * 34, 4.4, -114);
    awning.rotation.x = 0.25;
    mercadoRow.add(awning);
  }
  root.add(mercadoRow);

  // Market stalls with striped canopies and crates.
  for (let i = 0; i < 8; i++) {
    const stall = new THREE.Group();
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(2.6, 1.1, 4),
      new THREE.MeshStandardMaterial({ color: pick(rand, [0xff5a3c, 0xffd166, 0x37c8c3, 0xffffff]), roughness: 0.8 }),
    );
    canopy.position.y = 2.6; canopy.rotation.y = Math.PI / 4; canopy.castShadow = true;
    stall.add(canopy);
    for (const [px, pz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6),
        new THREE.MeshStandardMaterial({ color: 0x5a4632 }));
      leg.position.set(px, 1.2, pz); stall.add(leg);
    }
    const crate = box(1.6, 0.7, 1.1, 0xb07a3e, { rough: 1 });
    crate.position.y = 0.9; stall.add(crate);
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6),
      new THREE.MeshStandardMaterial({ color: pick(rand, [0xff8c1a, 0x3fae4a, 0xe23b3b]), roughness: 0.6 }));
    fruit.position.set(0.3, 1.4, 0); fruit.scale.set(1.6, 0.6, 1); stall.add(fruit);
    stall.position.set(-210 + i * 26 + range(rand, -4, 4), 0, -100 + range(rand, -3, 3));
    root.add(stall);
  }

  // --- Neon Row: glass towers with lit windows + neon signs. ---
  const towerHeights = [34, 48, 42, 58, 30, 52, 38, 46];
  towerHeights.forEach((hgt, i) => {
    const t = box(18, hgt, 18, 0xffffff, { map: textures.glass, rough: 0.35, metal: 0.4 });
    const x = -20 + (i % 4) * 44;
    const z = -210 + Math.floor(i / 4) * 92;
    t.position.set(x, hgt / 2, z);
    root.add(t);
    if (i % 2 === 0) {
      const sign = makeNeonSign(textures, pick(rand, ['NEON ROW', 'VESPER', 'TIKI', 'PALMS', 'GELATO', 'HOTEL SOL']));
      sign.position.set(x, hgt - 4, z + 9.4);
      root.add(sign);
    }
  });

  // --- Harbor: containers, cranes, warehouse. ---
  const containerColors = [0xc96f2e, 0x3e6b8e, 0xb3402f, 0x4a7a3a, 0xd8c25a];
  for (let i = 0; i < 14; i++) {
    const c = box(6, 2.6, 2.6, containerColors[i % containerColors.length], { rough: 0.7, metal: 0.3 });
    const stacked = i >= 7;
    c.position.set(-230 + (i % 7) * 14, stacked ? 3.9 : 1.3, 150 + Math.floor(i / 7) * 18);
    root.add(c);
  }
  for (let i = 0; i < 2; i++) {
    const crane = new THREE.Group();
    const legMat = new THREE.MeshStandardMaterial({ color: 0xd8a02a, roughness: 0.6, metalness: 0.4 });
    for (const [lx, lz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 26, 0.8), legMat);
      leg.position.set(lx, 13, lz); leg.castShadow = true; crane.add(leg);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(30, 1.6, 1.6), legMat);
    beam.position.set(8, 26, 0); beam.castShadow = true; crane.add(beam);
    const cab = box(4, 3, 3, 0x2e3138, { rough: 0.6, metal: 0.3 });
    cab.position.set(-2, 24, 0); crane.add(cab);
    crane.position.set(-190 + i * 90, 0, 210);
    root.add(crane);
  }
  const warehouse = box(44, 12, 22, 0xffffff, { map: textures.brickCoral, rough: 0.9 });
  warehouse.position.set(-40, 6, 240);
  root.add(warehouse);

  // --- Coral Beach: palms, umbrellas, loungers, pier. ---
  for (let i = 0; i < 16; i++) {
    const palm = makePalm(textures, rand, range(rand, 5.5, 8.5));
    palm.position.set(165 + range(rand, -6, 60), 0, -240 + i * 32 + range(rand, -6, 6));
    root.add(palm);
  }
  const umbrellaColors = [0xff5a3c, 0xffd166, 0x37c8c3, 0xff4fd8, 0xffffff];
  for (let i = 0; i < 10; i++) {
    const u = makeUmbrella(rand, umbrellaColors[i % umbrellaColors.length]);
    u.position.set(185 + range(rand, -8, 40), 0, -225 + i * 48 + range(rand, -8, 8));
    root.add(u);
    const lounger = box(1.8, 0.35, 0.7, pick(rand, [0xffd166, 0x37c8c3, 0xffffff]), { rough: 0.8 });
    lounger.position.set(u.position.x + 2.2, 0.35, u.position.z + 1);
    lounger.rotation.y = range(rand, -0.5, 0.5);
    root.add(lounger);
  }
  // Pier reaching into the ocean.
  const pier = box(10, 1, 60, 0x8a6a45, { rough: 1 });
  pier.position.set(235, 0.8, -40);
  root.add(pier);
  for (let i = 0; i < 6; i++) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 3, 6),
      new THREE.MeshStandardMaterial({ color: 0x6b4a22 }));
    post.position.set(231, 1.6, -66 + i * 10);
    root.add(post);
  }

  // --- Crosswalks at the four main intersections + sidewalks. ---
  const crossMat = new THREE.MeshStandardMaterial({ map: textures.crosswalk, roughness: 0.9 });
  for (const [cx, cz, rot] of [[-150, -150, 0], [-40, -150, 0], [60, 150, 0], [-150, 150, Math.PI / 2], [150, -150, Math.PI / 2]]) {
    const cw = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), crossMat);
    cw.rotation.x = -Math.PI / 2;
    cw.rotation.z = rot;
    cw.position.set(cx, 0.08, cz);
    cw.receiveShadow = true;
    root.add(cw);
  }
  const walkMat = new THREE.MeshStandardMaterial({ map: textures.sidewalk, roughness: 1 });
  for (const [wx, wz, ww, wd] of [[-95, -157, 190, 5], [145, -100, 5, 200], [-95, 157, 190, 5]]) {
    const walk = new THREE.Mesh(new THREE.PlaneGeometry(ww, wd), walkMat);
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(wx, 0.05, wz);
    walk.receiveShadow = true;
    root.add(walk);
  }

  // --- Street palms + lamps along Ocean Drive and Neon Row. Palms
  // stand on the sidewalk (x=140), not in the asphalt: in v2 a palm
  // grew out of the middle of Ocean Drive in shot 1.
  for (let i = 0; i < 12; i++) {
    const palm = makePalm(textures, rand, range(rand, 6, 8));
    palm.position.set(140, 0, -240 + i * 44);
    root.add(palm);
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x22262c, metalness: 0.6, roughness: 0.4 }));
    pole.position.y = 3; lamp.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    bulb.position.y = 6.1; lamp.add(bulb);
    lamp.position.set(134, 0, -220 + i * 44);
    root.add(lamp);
  }

  // --- Highway Loop: wide asphalt ring with barriers and billboards. ---
  for (let i = 0; i < 10; i++) {
    const barrier = box(4, 1, 0.5, i % 2 ? 0xff5a3c : 0xffffff, { rough: 0.8 });
    barrier.position.set(60 + range(rand, -30, 30), 0.5, 60 + i * 18);
    root.add(barrier);
  }
  const billboard = makeNeonSign(textures, 'HURRICANE SOLANA — 05:18:00', 22);
  billboard.position.set(60, 12, 150);
  billboard.rotation.y = Math.PI;
  root.add(billboard);

  // Golden-hour sun + warm ambient so nothing ever reads as night.
  const sun = new THREE.DirectionalLight(0xffc27a, 2.6);
  sun.position.set(180, 140, -120);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -280; sun.shadow.camera.right = 280;
  sun.shadow.camera.top = 280; sun.shadow.camera.bottom = -280;
  sun.shadow.camera.far = 900;
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffd9b0, 0.85));
  const hemi = new THREE.HemisphereLight(0xffd9a0, 0x2a4a5a, 0.7);
  scene.add(hemi);
  scene.fog = new THREE.Fog(0xffb37a, 320, 850);

  return { root, sun, rand, skyMat, facadeTargets };
}

// Swap the photographic textures into the world the moment they finish
// loading. Called from main.js when photos.done flips true; the staged
// shots gate on photoReady, so no screenshot is ever taken before this
// runs.
export function applyPhotos(world, photos) {
  if (photos.sky && world.skyMat) {
    world.skyMat.map = photos.sky;
    world.skyMat.needsUpdate = true;
  }
  if (photos.facades) {
    // One photograph holds four shopfronts side by side; each shop
    // shows a different quarter of it, so the row reads as four
    // distinct stores instead of the same picture four times.
    world.facadeTargets.forEach((mat, i) => {
      const tex = photos.facades.clone();
      tex.needsUpdate = true;
      tex.repeat.set(0.25, 1);
      tex.offset.set((i % 4) * 0.25, 0);
      mat.map = tex;
      mat.color.set(0xffffff);
      mat.needsUpdate = true;
    });
  }
}
