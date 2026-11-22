// Neon Bay — people (game/src/people.js).
// Pedestrians are articulated low-poly figures — torso, head with hair,
// arms, legs, and a shirt colour drawn from the city palette — walking
// the sidewalks in small groups, never the black blocks the old build
// used. The crew are the same figures with fixed looks, so the player
// can recognise Dune, Mara and Kip at a glance in any shot:
//   Dune Okafor — driver, violet jacket, flat cap, 31.
//   Mara Ivers — hacker, teal hoodie, laptop bag, 26.
//   Kip Reyes — muscle, rust-orange tank, shaved head, 34.
//   Rae Vega — hero, 27, sun-yellow jacket, the one the camera follows.
import * as THREE from '../vendor/three.module.min.js';
import { mulberry32, pick, range } from './rng.js';

export const CREW = [
  { id: 'dune', name: 'Dune Okafor', role: 'Driver', age: 31, jacket: 0x7a4fd0, shirt: 0xffffff, pants: 0x22262c, hair: 0x1a1210, hat: 'cap', perk: 'Drift King handling: +25% grip, NOS lasts 6 s longer' },
  { id: 'mara', name: 'Mara Ivers', role: 'Hacker', age: 26, jacket: 0x18b8b0, shirt: 0x0e2a28, pants: 0x2a2f38, hair: 0x3a1e10, hat: 'none', perk: 'Camera loop: NBPD roadblocks show on the minimap 30 s early' },
  { id: 'kip', name: 'Kip Reyes', role: 'Muscle', age: 34, jacket: 0xc96f2e, shirt: 0x1a1a1a, pants: 0x3a3e46, hair: 0x000000, hat: 'none', perk: 'Cover fire: crew suppresses rivals for 8 s after a takedown' },
];

export const HERO = { name: 'Rae Vega', age: 27, jacket: 0xffc21a, shirt: 0xffffff, pants: 0x1d3350, hair: 0x2a1608 };

const SHIRTS = [0xff5a3c, 0xffd166, 0x37c8c3, 0xff9eb5, 0xffffff, 0x3fae4a, 0x2e6fd8, 0xff8c1a];
const PANTS = [0x22262c, 0x2a2f38, 0x3a3e46, 0x5a4632, 0x1d3350];
const SKINS = [0xf2c9a0, 0xd9a066, 0xa0663a, 0x8a4f28, 0xf6d7b8];
const HAIRS = [0x1a1210, 0x3a1e10, 0x000000, 0x6b4a22, 0x8a8a8a];

function limb(w, h, d, color) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9 }),
  );
  m.castShadow = true;
  return m;
}

export function makePerson(look, rand) {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: pick(rand, SKINS), roughness: 0.75 });
  // Legs.
  const legL = limb(0.16, 0.78, 0.18, look.pants ?? pick(rand, PANTS));
  legL.position.set(-0.11, 0.39, 0);
  const legR = limb(0.16, 0.78, 0.18, look.pants ?? pick(rand, PANTS));
  legR.position.set(0.11, 0.39, 0);
  g.add(legL, legR);
  // Torso (jacket colour) + shirt strip.
  const torso = limb(0.52, 0.62, 0.28, look.jacket ?? pick(rand, SHIRTS));
  torso.position.y = 1.09;
  g.add(torso);
  const shirt = limb(0.4, 0.5, 0.29, look.shirt ?? 0xffffff);
  shirt.position.y = 1.09;
  g.add(shirt);
  // Arms.
  const armL = limb(0.13, 0.6, 0.15, look.jacket ?? pick(rand, SHIRTS));
  armL.position.set(-0.34, 1.1, 0);
  const armR = limb(0.13, 0.6, 0.15, look.jacket ?? pick(rand, SHIRTS));
  armR.position.set(0.34, 1.1, 0);
  g.add(armL, armR);
  // Head + hair.
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), skin);
  head.position.y = 1.62; head.castShadow = true;
  g.add(head);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial({ color: look.hair ?? pick(rand, HAIRS), roughness: 1 }),
  );
  hair.position.y = 1.66;
  g.add(hair);
  if (look.hat === 'cap') {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.23, 0.09, 12),
      new THREE.MeshStandardMaterial({ color: 0x7a4fd0, roughness: 0.85 }));
    cap.position.y = 1.8;
    g.add(cap);
  }
  g.userData.walkPhase = rand() * Math.PI * 2;
  g.userData.armL = armL; g.userData.armR = armR;
  g.userData.legL = legL; g.userData.legR = legR;
  g.userData.speed = range(rand, 0.9, 1.6);
  return g;
}

export function makeHero() {
  const rand = mulberry32(27);
  const hero = makePerson(HERO, rand);
  hero.name = 'Rae Vega';
  // Hero extras: a sun-yellow jacket is already the look; add a small
  // shoulder bag so Rae reads as a person, not a mannequin.
  const bag = limb(0.22, 0.3, 0.08, 0x8a5a30);
  bag.position.set(0.28, 1.15, -0.14);
  hero.add(bag);
  return hero;
}

export function makeCrewMember(id) {
  const def = CREW.find((c) => c.id === id);
  const rand = mulberry32(100 + def.age);
  const person = makePerson(def, rand);
  person.name = def.name;
  if (id === 'mara') {
    const laptop = limb(0.34, 0.24, 0.03, 0x22262c);
    laptop.position.set(-0.3, 1.05, 0.16);
    person.add(laptop);
  }
  return person;
}

// Pedestrians: walkers on fixed sidewalk loops, in pairs and trios, so
// the streets are inhabited in every direction the camera looks.
export class Crowd {
  constructor(scene) {
    this.scene = scene;
    this.walkers = [];
    this.rand = mulberry32(555);
  }

  spawn(count) {
    const routes = [
      { x: -228, z0: -130, z1: -60, axis: 'z' },
      { x: 138, z0: -240, z1: 240, axis: 'z' },
      { z: -136, x0: -240, x1: 130, axis: 'x' },
      { z: 164, x0: -240, x1: 130, axis: 'x' },
      { x: 178, z0: -240, z1: 240, axis: 'z' },
      { x: -120, z0: 140, z1: 240, axis: 'z' },
      { z: 120, x0: -20, x1: 140, axis: 'x' },
    ];
    for (let i = 0; i < count; i++) {
      const route = routes[i % routes.length];
      const person = makePerson({}, this.rand);
      if (route.axis === 'z') {
        person.position.set(route.x + range(this.rand, -2, 2), 0, range(this.rand, route.z0, route.z1));
        person.rotation.y = this.rand() < 0.5 ? 0 : Math.PI;
      } else {
        person.position.set(range(this.rand, route.x0, route.x1), 0, route.z + range(this.rand, -2, 2));
        person.rotation.y = this.rand() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
      }
      person.userData.route = route;
      // Walking direction, stored once: +1 along the route axis, -1 back.
      person.userData.dir = this.rand() < 0.5 ? 1 : -1;
      person.rotation.y = route.axis === 'z'
        ? (person.userData.dir > 0 ? 0 : Math.PI)
        : (person.userData.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      this.scene.add(person);
      this.walkers.push(person);
    }
  }

  update(dt, time) {
    for (const w of this.walkers) {
      const route = w.userData.route;
      const step = w.userData.speed * dt * w.userData.dir;
      if (route.axis === 'z') {
        w.position.z += step;
        if (w.position.z > route.z1) { w.position.z = route.z1; w.userData.dir = -1; w.rotation.y = Math.PI; }
        if (w.position.z < route.z0) { w.position.z = route.z0; w.userData.dir = 1; w.rotation.y = 0; }
      } else {
        w.position.x += step;
        if (w.position.x > route.x1) { w.position.x = route.x1; w.userData.dir = -1; w.rotation.y = -Math.PI / 2; }
        if (w.position.x < route.x0) { w.position.x = route.x0; w.userData.dir = 1; w.rotation.y = Math.PI / 2; }
      }
      // Walk cycle: arms and legs swing in opposition.
      const ph = time * 6 + w.userData.walkPhase;
      w.userData.armL.rotation.x = Math.sin(ph) * 0.5;
      w.userData.armR.rotation.x = -Math.sin(ph) * 0.5;
      w.userData.legL.rotation.x = Math.sin(ph) * 0.55;
      w.userData.legR.rotation.x = -Math.sin(ph) * 0.55;
    }
  }
}
