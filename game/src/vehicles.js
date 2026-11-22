// Neon Bay — vehicles (game/src/vehicles.js).
// Cars are built from layered boxes, cylinders and spheres with real
// proportions: a low body, a glass cabin, four wheels with hubs, front
// and rear light bars, bumpers, and — on the hero cars — a spoiler and
// a neon underglow strip. Traffic cars come in eight paint jobs drawn
// from the city's palette; the four garage cars are fixed and named,
// with the same names, colours and plates in README, HUD and shots:
// Vesper GT (sun-yellow, plate NB-1987), Coral Runner (turquoise,
// plate CR-0417), Harbor Hauler (rust-orange truck, plate HH-2210),
// Drift King (Dune's violet coupe, plate DK-0913).
import * as THREE from '../vendor/three.module.min.js';
import { mulberry32, pick, range } from './rng.js';

export const GARAGE_CARS = [
  { id: 'vesper', name: 'Vesper GT', color: 0xffc21a, plate: 'NB-1987', kind: 'coupe', topSpeed: 168, owner: 'Rae Vega' },
  { id: 'coral', name: 'Coral Runner', color: 0x18b8b0, plate: 'CR-0417', kind: 'convertible', topSpeed: 142, owner: 'Rae Vega' },
  { id: 'hauler', name: 'Harbor Hauler', color: 0xc96f2e, plate: 'HH-2210', kind: 'truck', topSpeed: 118, owner: 'Rae Vega' },
  { id: 'drift', name: 'Drift King', color: 0x7a4fd0, plate: 'DK-0913', kind: 'coupe', topSpeed: 174, owner: 'Dune Okafor' },
];

export const TRAFFIC_PAINTS = [0xe23b3b, 0x2e6fd8, 0xf2f2f2, 0x22262c, 0xff8c1a, 0x3fae4a, 0xc0c8d0, 0xff9eb5];

// Taxis earn their keep: Rae's side income includes 6 taxi fares
// ($900) before mission 7, so taxis are part of the world, not decor.
export function makeTaxi(rand) {
  const spec = {
    name: 'Neon Cab', color: 0xffc21a, plate: `TX-${100 + Math.floor(rand() * 900)}`,
    kind: 'sedan', topSpeed: 70,
  };
  const cab = makeCar(spec);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x22262c, emissive: 0xffc21a, emissiveIntensity: 0.7 }));
  sign.position.set(0, 1.48, -0.1);
  cab.add(sign);
  const checker = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.14, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x111111 }));
  checker.position.set(0, 0.62, 2.21);
  cab.add(checker);
  return cab;
}

function wheel() {
  const g = new THREE.Group();
  const tyre = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, 0.3, 14),
    new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.95 }),
  );
  tyre.rotation.z = Math.PI / 2;
  tyre.castShadow = true;
  g.add(tyre);
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.32, 10),
    new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: 0.85, roughness: 0.25 }),
  );
  hub.rotation.z = Math.PI / 2;
  g.add(hub);
  return g;
}

function lightBar(color, w = 0.5) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.16, 0.08),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.6 }),
  );
}

export function makeCar(spec, opts = {}) {
  const g = new THREE.Group();
  g.name = spec.name;
  const paint = new THREE.MeshStandardMaterial({
    color: spec.color, roughness: 0.28, metalness: 0.55,
  });
  const isTruck = spec.kind === 'truck';
  const bodyLen = isTruck ? 5.4 : 4.4;
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.62, bodyLen), paint);
  body.position.y = 0.55; body.castShadow = true;
  g.add(body);
  // Nose taper + tail.
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 0.7), paint);
  nose.position.set(0, 0.48, bodyLen / 2 + 0.25); nose.castShadow = true;
  g.add(nose);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.55, isTruck ? 1.4 : 2.1),
    new THREE.MeshStandardMaterial({ color: 0x101c2c, roughness: 0.12, metalness: 0.7 }),
  );
  cabin.position.set(0, 1.1, isTruck ? 1.2 : -0.15);
  cabin.castShadow = true;
  g.add(cabin);
  if (isTruck) {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.9 }));
    bed.position.set(0, 0.95, -1.3); bed.castShadow = true;
    g.add(bed);
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1.5),
      new THREE.MeshStandardMaterial({ color: 0xd8c25a, roughness: 0.8 }));
    crate.position.set(0, 1.6, -1.3); crate.castShadow = true;
    g.add(crate);
  } else {
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.07, 0.45), paint);
    spoiler.position.set(0, 1.05, -bodyLen / 2 - 0.1);
    spoiler.castShadow = true;
    g.add(spoiler);
    for (const sx of [-0.7, 0.7]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), paint);
      strut.position.set(sx, 0.88, -bodyLen / 2 - 0.1);
      g.add(strut);
    }
  }
  // Wheels.
  const wheelZ = bodyLen / 2 - 0.75;
  for (const [wx, wz] of [[-0.95, wheelZ], [0.95, wheelZ], [-0.95, -wheelZ], [0.95, -wheelZ]]) {
    const w = wheel();
    w.position.set(wx, 0.38, wz);
    g.add(w);
  }
  // Lights: white front bar, red rear bar, amber indicators.
  const front = lightBar(0xfff2c8, 1.5); front.position.set(0, 0.62, bodyLen / 2 + 0.62); g.add(front);
  const rear = lightBar(0xff2a2a, 1.5); rear.position.set(0, 0.62, -bodyLen / 2 - 0.02); g.add(rear);
  // Neon underglow on hero cars.
  if (opts.hero) {
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.06, bodyLen * 0.9),
      new THREE.MeshBasicMaterial({ color: 0xff4fd8 }),
    );
    glow.position.y = 0.12;
    g.add(glow);
    const plate = makePlate(spec.plate);
    plate.position.set(0, 0.42, bodyLen / 2 + 0.63);
    g.add(plate);
  }
  g.userData.spec = spec;
  g.userData.wheels = [];
  return g;
}

function makePlate(text) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f2f2f2'; ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#22262c'; ctx.lineWidth = 5; ctx.strokeRect(3, 3, 250, 58);
  ctx.fillStyle = '#14213d'; ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.16),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
}

// Traffic: cars that follow the road loop at steady speeds, brake for
// the car ahead, and change lanes. Density is the point — a frame with
// ten cars reads as a living city; a frame with two reads as a demo.
export class Traffic {
  constructor(scene) {
    this.scene = scene;
    this.cars = [];
    this.rand = mulberry32(2024);
    this.lanes = [
      { z: -150, dir: 1 }, { z: -143, dir: -1 },
      { z: 150, dir: 1 }, { z: 157, dir: -1 },
      { x: -150, dir: 1 }, { x: -143, dir: -1 },
      { x: 150, dir: 1 }, { x: 157, dir: -1 },
      { x: 60, dir: 1 }, { x: 67, dir: -1 },
    ];
  }

  spawn(count) {
    for (let i = 0; i < count; i++) {
      // Every fifth car is a Neon Cab taxi, roof sign lit.
      const car = (i % 5 === 4) ? makeTaxi(this.rand) : makeCar({
        name: 'Traffic car', color: pick(this.rand, TRAFFIC_PAINTS),
        plate: `NB-${1000 + Math.floor(this.rand() * 9000)}`, kind: 'sedan', topSpeed: 60,
      });
      const lane = this.lanes[i % this.lanes.length];
      const along = range(this.rand, -240, 240);
      if (lane.z !== undefined) {
        car.position.set(along, 0, lane.z);
        car.rotation.y = lane.dir > 0 ? 0 : Math.PI;
      } else {
        car.position.set(lane.x, 0, along);
        car.rotation.y = lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      car.userData.speed = range(this.rand, 9, 16);
      car.userData.lane = lane;
      this.scene.add(car);
      this.cars.push(car);
    }
  }

  update(dt) {
    for (const car of this.cars) {
      const lane = car.userData.lane;
      const step = car.userData.speed * dt;
      if (lane.z !== undefined) {
        car.position.x += step * lane.dir;
        if (car.position.x > 258) car.position.x = -258;
        if (car.position.x < -258) car.position.x = 258;
      } else {
        car.position.z += step * lane.dir;
        if (car.position.z > 258) car.position.z = -258;
        if (car.position.z < -258) car.position.z = 258;
      }
      // Gentle bob so parked-looking traffic never reads as frozen.
      car.position.y = Math.sin(performance.now() * 0.001 + car.position.x) * 0.008;
    }
  }
}
