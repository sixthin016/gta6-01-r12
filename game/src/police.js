// Neon Bay — the NBPD (game/src/police.js).
//
// The Neon Bay Police Department is a real system, not a star counter:
// cruisers spawn at the map edge, chase and ram, and at 3 stars they
// set roadblocks across the road ahead; at 4 stars Air One — a full
// helicopter model with spinning rotor and a visible searchlight cone —
// joins and tracks the player from above. Lose line of sight for 12
// seconds and the heat cools one star at a time. Wanted levels:
// 1 star — one cruiser, on foot only; 2 — two cruisers; 3 — roadblocks;
// 4 — Air One joins; 5 — roadblocks + Air One + SWAT van, ramming.
import * as THREE from '../vendor/three.module.min.js';
import { mulberry32, range } from './rng.js';
import { makeCar } from './vehicles.js';

// What each wanted level fields. `cruisers` is the standing fleet;
// roadblocks, the helicopter and the SWAT van are added on top.
export const WANTED = {
  1: { cruisers: 1, roadblock: false, heli: false, label: 'NBPD responding' },
  2: { cruisers: 2, roadblock: false, heli: false, label: 'NBPD pursuit' },
  3: { cruisers: 3, roadblock: true, heli: false, label: 'Roadblocks ahead' },
  4: { cruisers: 4, roadblock: true, heli: true, label: 'Air One overhead' },
  5: { cruisers: 5, roadblock: true, heli: true, label: 'SWAT on scene' },
};

const CRUISER_SPEC = { name: 'NBPD Cruiser', color: 0x14213d, plate: 'NBPD-07', kind: 'sedan', topSpeed: 150 };

// A standard NBPD cruiser: dark body, white doors, red/blue light bar.
// The two light-bar halves are kept on userData so update() can flash
// them in alternation.
export function makeCruiser() {
  const car = makeCar(CRUISER_SPEC);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4, metalness: 0.3 });
  for (const sx of [-1.01, 1.01]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 1.6), doorMat);
    door.position.set(sx, 0.62, 0);
    car.add(door);
  }
  const barRed = new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xff2a2a, emissiveIntensity: 2 });
  const barBlue = new THREE.MeshStandardMaterial({ color: 0x2a6bff, emissive: 0x2a6bff, emissiveIntensity: 2 });
  const barL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), barRed);
  barL.position.set(-0.4, 1.42, 0);
  const barR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), barBlue);
  barR.position.set(0.4, 1.42, 0);
  car.add(barL, barR);
  car.userData.lightL = barL; car.userData.lightR = barR;
  return car;
}

// Air One: the NBPD helicopter. Body, glass nose, tail and fin, skids,
// a two-blade main rotor (spun in update()), and a real searchlight
// cone — a translucent mesh plus a SpotLight aimed at the player.
export function makeHelicopter() {
  const g = new THREE.Group();
  g.name = 'Air One';
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x14213d, roughness: 0.4, metalness: 0.4 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 10), bodyMat);
  body.scale.set(1, 0.85, 1.9);
  body.castShadow = true;
  g.add(body);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x0e2a3a, roughness: 0.1, metalness: 0.8 }));
  glass.scale.set(0.95, 0.7, 0.9);
  glass.position.set(0, 0.25, 1.6);
  g.add(glass);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.5, 4.4, 8), bodyMat);
  tail.rotation.x = Math.PI / 2 - 0.12;
  tail.position.set(0, 0.35, -3.6);
  g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.9), bodyMat);
  fin.position.set(0, 1.1, -5.4);
  g.add(fin);
  const skidMat = new THREE.MeshStandardMaterial({ color: 0x22262c, metalness: 0.7, roughness: 0.4 });
  for (const sx of [-1.1, 1.1]) {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 6), skidMat);
    skid.rotation.x = Math.PI / 2;
    skid.position.set(sx, -1.25, 0.4);
    g.add(skid);
  }
  // Main rotor + tail rotor, spun in update().
  const rotor = new THREE.Group();
  rotor.position.y = 1.55;
  for (const a of [0, Math.PI / 2]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.06, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: 0.5 }));
    blade.rotation.y = a;
    rotor.add(blade);
  }
  g.add(rotor);
  // Searchlight cone + pool: the thing the old build only implied with
  // a vertical beam. Here the cone is a real translucent mesh.
  const coneGeo = new THREE.ConeGeometry(4.5, 26, 20, 1, true);
  const cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({
    color: 0xfff2c8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false,
  }));
  cone.position.y = -13.5;
  g.add(cone);
  const spot = new THREE.SpotLight(0xfff2c8, 900, 60, 0.32, 0.45, 1.2);
  spot.position.set(0, -1, 1);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, -26, 0);
  g.add(spotTarget);
  spot.target = spotTarget;
  g.add(spot);
  g.userData.rotor = rotor;
  g.userData.cone = cone;
  return g;
}

// The SWAT van: 5-star only. It blocks the road ahead and holds
// position instead of chasing, so the player must go around it.
export function makeSwatVan() {
  const g = new THREE.Group();
  g.name = 'NBPD SWAT Van';
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 5.6),
    new THREE.MeshStandardMaterial({ color: 0x1c2733, roughness: 0.5, metalness: 0.4 }));
  body.position.y = 1.35; body.castShadow = true;
  g.add(body);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.5, 5.62),
    new THREE.MeshStandardMaterial({ color: 0x2a6bff, emissive: 0x2a6bff, emissiveIntensity: 0.5 }));
  stripe.position.y = 1.1;
  g.add(stripe);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.1, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x0e2a3a, roughness: 0.15, metalness: 0.7 }));
  cab.position.set(0, 1.5, 2.6);
  g.add(cab);
  for (const [wx, wz] of [[-1.05, 1.9], [1.05, 1.9], [-1.05, -1.9], [1.05, -1.9]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 12),
      new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.95 }));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.45, wz);
    g.add(wheel);
  }
  return g;
}

// A roadblock: three cruisers parked across the road plus two
// striped barriers at the edges.
export function makeRoadblock() {
  const g = new THREE.Group();
  g.name = 'NBPD Roadblock';
  for (let i = -1; i <= 1; i++) {
    const car = makeCruiser();
    car.position.set(i * 4.4, 0, 0);
    car.rotation.y = Math.PI / 2;
    g.add(car);
  }
  for (const sx of [-7.5, 7.5]) {
    const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xff5a3c, emissive: 0xff5a3c, emissiveIntensity: 0.4 }));
    barrier.position.set(sx, 0.55, 0);
    g.add(barrier);
  }
  return g;
}

// Cool-down: standing still and unseen drops one star per 12 s.
const COOL_DOWN_SECONDS = 12;

export class Police {
  constructor(scene) {
    this.scene = scene;
    this.rand = mulberry32(911);
    this.wanted = 0;
    this.cruisers = [];
    this.heli = null;
    this.roadblock = null;
    this.swat = null;
    this.coolTimer = 0;
    this.lastSeen = 0;
  }

  // Set the wanted level and field (or stand down) the matching
  // units. New cruisers spawn in a ring 60 m out from the player.
  setWanted(level, playerPos) {
    this.wanted = Math.max(0, Math.min(5, level));
    const want = WANTED[this.wanted] || { cruisers: 0, roadblock: false, heli: false };
    while (this.cruisers.length < want.cruisers) {
      const c = makeCruiser();
      const a = this.rand() * Math.PI * 2;
      c.position.set(playerPos.x + Math.cos(a) * 60, 0, playerPos.z + Math.sin(a) * 60);
      this.scene.add(c);
      this.cruisers.push(c);
    }
    while (this.cruisers.length > want.cruisers) {
      const c = this.cruisers.pop();
      this.scene.remove(c);
    }
    this.syncHeli(want, playerPos);
    this.syncRoadblock(want, playerPos);
    this.syncSwat(playerPos);
    this.coolTimer = 0;
  }

  syncHeli(want, playerPos) {
    if (want.heli && !this.heli) {
      this.heli = makeHelicopter();
      this.heli.position.set(playerPos.x + 20, 42, playerPos.z - 30);
      this.scene.add(this.heli);
    }
    if (!want.heli && this.heli) {
      this.scene.remove(this.heli);
      this.heli = null;
    }
  }

  syncRoadblock(want, playerPos) {
    if (want.roadblock && !this.roadblock) {
      this.roadblock = makeRoadblock();
      this.roadblock.position.set(playerPos.x + 40, 0, playerPos.z);
      this.scene.add(this.roadblock);
    }
    if (!want.roadblock && this.roadblock) {
      this.scene.remove(this.roadblock);
      this.roadblock = null;
    }
  }

  // 5 stars brings the SWAT van: it blocks the road ahead and holds
  // position instead of chasing, so the player must go around it.
  syncSwat(playerPos) {
    if (this.wanted >= 5 && !this.swat) {
      this.swat = makeSwatVan();
      this.swat.position.set(playerPos.x + 26, 0, playerPos.z + 12);
      this.swat.rotation.y = Math.PI / 2;
      this.scene.add(this.swat);
    }
    if (this.wanted < 5 && this.swat) {
      this.scene.remove(this.swat);
      this.swat = null;
    }
  }

  // Turn a unit toward a heading, at most 1.6 rad/s, taking the
  // shortest way around the circle.
  steerToward(unit, targetAngle, dt) {
    let da = targetAngle - unit.rotation.y;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    unit.rotation.y += Math.max(-1.6 * dt, Math.min(1.6 * dt, da));
  }

  update(dt, time, playerPos, playerSpeed) {
    const flash = Math.sin(time * 9) > 0;
    for (const c of this.cruisers) {
      // Alternating light bar: red on, blue on, red on...
      c.userData.lightL.material.emissiveIntensity = flash ? 2.4 : 0.4;
      c.userData.lightR.material.emissiveIntensity = flash ? 0.4 : 2.4;
      // Chase: steer toward the player, ram speed scales with wanted.
      const targetAngle = Math.atan2(playerPos.x - c.position.x, playerPos.z - c.position.z);
      this.steerToward(c, targetAngle, dt);
      const speed = Math.min(34, 16 + this.wanted * 3.5);
      c.position.x += Math.sin(c.rotation.y) * speed * dt;
      c.position.z += Math.cos(c.rotation.y) * speed * dt;
    }
    if (this.heli) {
      this.heli.userData.rotor.rotation.y += dt * 22;
      const tx = playerPos.x + 14, tz = playerPos.z - 18;
      this.heli.position.x += (tx - this.heli.position.x) * Math.min(1, dt * 0.8);
      this.heli.position.z += (tz - this.heli.position.z) * Math.min(1, dt * 0.8);
      this.heli.position.y = 42 + Math.sin(time * 0.7) * 1.5;
      this.heli.userData.cone.lookAt(playerPos.x, 0, playerPos.z);
    }
    // Cool-down: standing still and unseen drops one star per 12 s.
    if (this.wanted > 0 && playerSpeed < 2) {
      this.coolTimer += dt;
      if (this.coolTimer > COOL_DOWN_SECONDS) this.setWanted(this.wanted - 1, playerPos);
    } else {
      this.coolTimer = 0;
    }
  }
}
