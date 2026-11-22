// Neon Bay — effects (game/src/fx.js).
//
// Juice that reads in a still frame: tyre smoke, muzzle flashes,
// sparks, NOS flames, rain streaks as the hurricane closes in, and a
// storm-darkening pass that rolls across the bay in the final mission.
// Particles are pooled — no per-frame allocation — so the game holds
// 60 fps on the same machine that renders the screenshots.
import * as THREE from '../vendor/three.module.min.js';
import { mulberry32, range } from './rng.js';

// Pooled billboard particles: a fixed pool of quads, recycled
// round-robin, so bursts never allocate geometry or materials.
export class Particles {
  constructor(scene, max = 420) {
    this.scene = scene;
    this.max = max;
    this.pool = [];
    const geo = new THREE.PlaneGeometry(0.5, 0.5);
    for (let i = 0; i < max; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
      });
      const m = new THREE.Mesh(geo, mat);
      m.visible = false;
      scene.add(m);
      this.pool.push({ mesh: m, life: 0, maxLife: 1, vel: new THREE.Vector3(), grow: 0, fade: 1 });
    }
    this.next = 0;
  }

  spawn(pos, opts = {}) {
    const p = this.pool[this.next];
    this.next = (this.next + 1) % this.max;
    p.mesh.visible = true;
    p.mesh.position.copy(pos);
    p.mesh.material.color.set(opts.color ?? 0xffffff);
    p.mesh.material.opacity = opts.opacity ?? 0.9;
    p.mesh.scale.setScalar(opts.size ?? 0.5);
    p.vel.set(
      range(Math.random, -1, 1) * (opts.spread ?? 2),
      range(Math.random, 0, 1) * (opts.up ?? 2),
      range(Math.random, -1, 1) * (opts.spread ?? 2),
    );
    p.life = 0;
    p.maxLife = opts.life ?? 0.8;
    p.grow = opts.grow ?? 0.5;
    p.fade = opts.opacity ?? 0.9;
  }

  burst(pos, n, opts = {}) {
    for (let i = 0; i < n; i++) this.spawn(pos, opts);
  }

  // Hide every live particle at once (used when resetting a scene).
  clear() {
    for (const p of this.pool) p.mesh.visible = false;
  }

  update(dt, camera) {
    for (const p of this.pool) {
      if (!p.mesh.visible) continue;
      p.life += dt;
      if (p.life >= p.maxLife) { p.mesh.visible = false; continue; }
      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.y -= (p.vel.y > 0 ? 1.2 : 0) * dt;
      const t = p.life / p.maxLife;
      p.mesh.material.opacity = p.fade * (1 - t);
      p.mesh.scale.addScalar(p.grow * dt);
      p.mesh.lookAt(camera.position);
    }
  }
}

// One-call explosion: fireball particles, smoke, sparks and a shake
// kick, used by the final heist blast and by exploding traffic cars.
export function explode(particles, shake, pos, big = false) {
  particles.burst(pos, big ? 46 : 22, { color: 0xff9e2a, size: 1.1, life: 0.9, spread: 7, up: 5, grow: 2.2 });
  particles.burst(pos, big ? 26 : 12, { color: 0x3a3e46, size: 1.6, life: 1.6, spread: 3, up: 6, grow: 3.0 });
  particles.burst(pos, big ? 20 : 10, { color: 0xffe9a8, size: 0.5, life: 0.4, spread: 9, up: 3, grow: 0.4 });
  shake.add(big ? 0.9 : 0.5);
}

// The flash at the muzzle when the player fires: a bright core with a
// warm halo, shown for ~60 ms by main.js and hidden again.
export function makeMuzzleFlash() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xff9e2a, transparent: true, opacity: 0.55 }));
  g.add(core, halo);
  g.visible = false;
  return g;
}

// Rain: one Points cloud, recycled, whose density follows the storm
// timer — light drizzle at 17:42, sheets of rain as 23:00 approaches.
export class Rain {
  constructor(scene, count = 1600) {
    this.count = count;
    const rand = mulberry32(99);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = range(rand, -160, 160);
      pos[i * 3 + 1] = range(rand, 0, 60);
      pos[i * 3 + 2] = range(rand, -160, 160);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xbfe3ff, size: 0.35, transparent: true, opacity: 0.0, depthWrite: false,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.visible = false;
    scene.add(this.points);
    this.intensity = 0;
  }

  setIntensity(v) {
    this.intensity = Math.max(0, Math.min(1, v));
    this.points.visible = this.intensity > 0.02;
    this.points.material.opacity = 0.55 * this.intensity;
  }

  update(dt, center) {
    if (!this.points.visible) return;
    const pos = this.points.geometry.attributes.position;
    for (let i = 0; i < this.count; i++) {
      let y = pos.getY(i) - dt * (26 + this.intensity * 22);
      if (y < 0) y = 58;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    // The cloud follows the player, so rain is always overhead.
    this.points.position.x = center.x;
    this.points.position.z = center.z;
  }
}

// Screen shake: small trauma-based shake for explosions, collisions
// and the final heist blast. Trauma decays linearly; the offset it
// produces scales with trauma squared, so small hits barely move the
// camera and big ones really kick it.
export class Shake {
  constructor() { this.trauma = 0; }
  add(v) { this.trauma = Math.min(1, this.trauma + v); }
  update(dt) { this.trauma = Math.max(0, this.trauma - dt * 1.4); }
  offset(time) {
    const s = this.trauma * this.trauma;
    return {
      x: s * 0.5 * Math.sin(time * 61.7),
      y: s * 0.4 * Math.sin(time * 53.3 + 1.7),
    };
  }
}
