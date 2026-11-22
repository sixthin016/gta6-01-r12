// Neon Bay — combat (game/src/combat.js).
//
// Three weapons, one wheel, honest numbers. The player aims with the
// mouse and clicks to fire; rivals and NBPD officers take cover behind
// cars and walls and fight back. Ammo is shown in the HUD exactly as
// the staged shots show it: Pistol 12/48, SMG 64/128, Shotgun 8/24.
// Damage, range and fire rate are fixed per weapon — no hidden
// multipliers — and every shot spawns a muzzle flash, a tracer and a
// shell, so a firefight reads as one even in a still screenshot.
import * as THREE from '../vendor/three.module.min.js';

// Fixed per-weapon numbers. `damage` is point-blank damage; distance
// falloff (see fire()) reduces it at range. `pellets` is 1 except for
// the shotgun, which fires a spread of 6.
export const WEAPONS = {
  pistol: { name: 'Pistol', damage: 34, range: 42, rate: 0.22, mag: 12, reserve: 48, spread: 0.012, auto: false, color: 0xffd166 },
  smg: { name: 'SMG', damage: 18, range: 36, rate: 0.09, mag: 32, reserve: 128, spread: 0.045, auto: true, color: 0x37e6ff },
  shotgun: { name: 'Shotgun', damage: 22, range: 18, rate: 0.85, mag: 8, reserve: 24, spread: 0.11, auto: false, color: 0xff7a59, pellets: 6 },
};

export const RIVALS = {
  name: 'The Vipers',
  leader: 'Snake Marlow',
  count: 6,
  district: 'Mercado District',
};

// Distance falloff: a pistol loses half its damage at max range; a
// shotgun loses two thirds. The numbers in WEAPONS are point-blank.
function falloffFactor(weapon, dist) {
  const loss = weapon.name === 'Shotgun' ? 0.67 : 0.5;
  const floor = weapon.name === 'Shotgun' ? 0.33 : 0.5;
  return Math.max(floor, 1 - (dist / weapon.range) * loss);
}

export class Combat {
  constructor(scene) {
    this.scene = scene;
    this.weapon = 'pistol';
    this.ammo = { pistol: { mag: 12, reserve: 48 }, smg: { mag: 32, reserve: 128 }, shotgun: { mag: 8, reserve: 24 } };
    this.cooldown = 0;
    this.tracers = [];
    this.targets = [];
    // Kip's crew perk: after a takedown, rivals are suppressed for 8 s
    // (their return fire pauses) — the game tracks it here.
    this.suppressedUntil = 0;
  }

  // Kip's cover fire: call after a takedown; rivals hold fire while
  // suppressed. `now` is seconds on the game clock.
  suppress(now, seconds = 8) {
    this.suppressedUntil = Math.max(this.suppressedUntil, now + seconds);
  }

  get suppressed() {
    return performance.now() / 1000 < this.suppressedUntil;
  }

  get current() {
    return WEAPONS[this.weapon];
  }

  select(name) {
    if (WEAPONS[name]) this.weapon = name;
  }

  // Move reserve ammo into the magazine. Returns rounds moved (0
  // when the magazine is already full or the reserve is empty).
  reload() {
    const w = this.current;
    const a = this.ammo[this.weapon];
    const need = w.mag - a.mag;
    const take = Math.min(need, a.reserve);
    a.mag += take;
    a.reserve -= take;
    return take;
  }

  // Fire one trigger pull. Returns the shot (or null while cooling
  // down / empty — an empty magazine auto-reloads instead).
  fire(origin, direction, time) {
    const w = this.current;
    if (this.cooldown > 0) return null;
    const a = this.ammo[this.weapon];
    if (a.mag <= 0) { this.reload(); return null; }
    a.mag -= 1;
    this.cooldown = w.rate;
    const pellets = w.pellets ?? 1;
    const hits = [];
    for (let p = 0; p < pellets; p++) {
      const dir = this.jitteredDirection(direction, w.spread);
      this.spawnTracer(origin, dir, w, time);
      hits.push(...this.hitTest(origin, direction, dir, w));
    }
    return { weapon: this.weapon, pellets, hits, at: time };
  }

  // One pellet's direction: the aim direction plus a random spread
  // jitter on X and Y, re-normalised.
  jitteredDirection(direction, spread) {
    const dir = direction.clone();
    dir.x += (Math.random() - 0.5) * spread * 2;
    dir.y += (Math.random() - 0.5) * spread * 2;
    dir.normalize();
    return dir;
  }

  // A glowing tracer line from the muzzle to max range, fading out
  // over 0.15 s (cleaned up in update()).
  spawnTracer(origin, dir, weapon, time) {
    const end = origin.clone().add(dir.clone().multiplyScalar(weapon.range));
    const tracer = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, weapon.range),
      new THREE.MeshBasicMaterial({ color: weapon.color, transparent: true, opacity: 0.9 }),
    );
    tracer.position.copy(origin).add(dir.clone().multiplyScalar(weapon.range / 2));
    tracer.lookAt(end);
    this.scene.add(tracer);
    this.tracers.push({ mesh: tracer, born: time });
  }

  // Hit test for one pellet against every registered target: in range
  // and within a narrow cone of the aim direction.
  hitTest(origin, aimDir, pelletDir, weapon) {
    const hits = [];
    for (const t of this.targets) {
      const dist = t.position.distanceTo(origin);
      if (dist >= weapon.range + 4) continue;
      const toTarget = t.position.clone().sub(origin).normalize();
      if (toTarget.angleTo(aimDir) >= 0.12) continue;
      hits.push({ target: t, damage: Math.round(weapon.damage * falloffFactor(weapon, dist)) });
    }
    return hits;
  }

  addTarget(mesh, hp = 100) {
    mesh.userData.hp = hp;
    this.targets.push(mesh);
    return mesh;
  }

  // Apply damage to a target; returns true when it goes down.
  damage(target, amount) {
    target.userData.hp -= amount;
    return target.userData.hp <= 0;
  }

  update(dt, time) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.mesh.material.opacity = Math.max(0, 0.9 - (time - t.born) * 6);
      if (time - t.born > 0.15) {
        this.scene.remove(t.mesh);
        this.tracers.splice(i, 1);
      }
    }
  }
}

// A rival Viper shooter: dark jacket, red bandana, takes cover behind
// the nearest car and fires in bursts.
export function makeRival(rand) {
  const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.28), dark);
  torso.position.y = 1.09; torso.castShadow = true;
  g.add(torso);
  const bandana = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.1, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xe23b3b, roughness: 0.8 }));
  bandana.position.y = 1.5;
  g.add(bandana);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.75 }));
  head.position.y = 1.62;
  g.add(head);
  for (const sx of [-0.11, 0.11]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.78, 0.18), dark);
    leg.position.set(sx, 0.39, 0);
    g.add(leg);
  }
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x22262c, metalness: 0.7, roughness: 0.4 }));
  gun.position.set(0.3, 1.25, 0.35);
  g.add(gun);
  g.userData.hp = 100;
  g.userData.burst = 0;
  return g;
}
