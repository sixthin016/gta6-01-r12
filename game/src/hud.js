// Neon Bay — HUD (game/src/hud.js).
// The HUD is the game's second screenshot: wanted stars, cash, health,
// the Hurricane Solana countdown, the district name, the mission
// objective, the radio station, crew portraits as coloured initials,
// a live round minimap, and a feed of NBPD dispatch lines. The staged
// shots set the HUD to mid-game values (cash $12,450–$81,900, missions
// 6–17 of 18, respect 68–97) — never the zeros of a fresh save, which
// the round-6 diagnosis showed reads as "nothing has happened yet".
// Canonical numbers live in missions.js (CASH_STAGES) and are passed
// in; this file never invents its own.
import { MISSIONS } from './missions.js';

export const DISTRICT_BLURBS = {
  'Coral Beach': 'Ocean Drive — surf, palms, 17:42 sun',
  'Mercado District': 'Mercado Lane — stalls, neon, crowds',
  'Neon Row': 'Neon Row — glass towers, signs, 88.4 FM',
  Harbor: 'Harbor Road — cranes, containers, vault trucks',
  'Highway Loop': 'Highway Loop — 155 km/h, no exits',
};

export function starString(wanted) {
  return '★'.repeat(wanted) + '☆'.repeat(Math.max(0, 5 - wanted));
}

export function fmtCash(n) {
  return '$' + n.toLocaleString('en-US');
}

export class Hud {
  constructor(doc) {
    this.doc = doc;
    this.el = {
      stars: doc.getElementById('stars'),
      cash: doc.getElementById('cash'),
      respect: doc.getElementById('respect'),
      missions: doc.getElementById('missions'),
      healthFill: doc.getElementById('health-fill'),
      healthText: doc.getElementById('health-text'),
      clock: doc.getElementById('clock'),
      district: doc.getElementById('district'),
      objectiveTitle: doc.getElementById('objective-title'),
      objective: doc.getElementById('objective'),
      speed: doc.getElementById('speed'),
      ammo: doc.getElementById('ammo'),
      radio: doc.getElementById('radio'),
      crew: doc.getElementById('crew'),
      feed: doc.getElementById('feed'),
      minimap: doc.getElementById('minimap'),
    };
    this.feedItems = [];
    this.shotMode = false;
  }

  show() {
    this.doc.getElementById('hud').classList.remove('hidden');
  }

  setState(s) {
    // s: { wanted, cash, respect, completed, total, hp, clock, district,
    //   mission, objective, speed, weapon, ammo, radio, crew }
    if (this.el.stars) {
      this.el.stars.textContent = starString(s.wanted);
      this.el.stars.classList.toggle('hot', s.wanted >= 4);
    }
    if (this.el.cash) this.el.cash.textContent = fmtCash(s.cash);
    if (this.el.respect) this.el.respect.textContent = `Respect ${s.respect} · Crew 3/3`;
    if (this.el.missions) this.el.missions.textContent = `Missions ${s.completed}/${s.total}`;
    if (this.el.healthFill) {
      this.el.healthFill.style.width = `${s.hp}%`;
      this.el.healthFill.classList.toggle('low', s.hp < 35);
    }
    if (this.el.healthText) this.el.healthText.textContent = `${s.hp} HP`;
    if (this.el.clock) this.el.clock.textContent = s.clock;
    if (this.el.district) {
      this.el.district.textContent = s.district;
      this.el.district.title = DISTRICT_BLURBS[s.district] ?? '';
    }
    if (this.el.objectiveTitle) this.el.objectiveTitle.textContent = s.mission;
    if (this.el.objective) this.el.objective.textContent = s.objective;
    if (this.el.speed) this.el.speed.textContent = s.driving ? `${Math.round(s.speed)} mph` : '';
    if (this.el.ammo) this.el.ammo.textContent = `${s.weapon} ${s.ammo}`;
    if (this.el.radio) this.el.radio.textContent = s.radio;
    if (this.el.crew) {
      this.el.crew.innerHTML = s.crew.map((c) => `<span class="crew-chip" style="--c:${c.color}">${c.initials} ${c.name}</span>`).join('');
    }
  }

  pushFeed(text) {
    if (!this.el.feed) return;
    const div = this.doc.createElement('div');
    div.className = 'feed-msg';
    div.textContent = text;
    this.el.feed.prepend(div);
    this.feedItems.unshift(div);
    while (this.feedItems.length > 4) {
      const old = this.feedItems.pop();
      old.remove();
    }
    // In staged-shot mode the feed never fades: the capture tool's
    // virtual clock would otherwise age the lines out before the
    // screenshot is taken.
    if (this.shotMode) return;
    setTimeout(() => div.classList.add('fade'), 5200);
    setTimeout(() => { div.remove(); this.feedItems = this.feedItems.filter((d) => d !== div); }, 6000);
  }

  // Round minimap: sand east, roads, traffic dots, police (blue-red),
  // player (yellow arrow), objective (gold star). Drawn every frame
  // from live positions — never a static picture.
  drawMinimap(player, traffic, cruisers, objective, size = 200) {
    const cv = this.el.minimap;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const scale = size / 560;
    const toMap = (x, z) => [size / 2 + (x + 50) * scale, size / 2 + z * scale];
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#0e1a26';
    ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.clip();
    // Sand strip (east edge) + ocean.
    ctx.fillStyle = '#e8c98f';
    ctx.fillRect(size / 2 + 150 * scale, 0, 90 * scale, size);
    ctx.fillStyle = '#14919b';
    ctx.fillRect(size / 2 + 200 * scale, 0, 90 * scale, size);
    // Roads, filled (not outlines) so they read at 200 px.
    ctx.fillStyle = '#3a3e46';
    for (const [x, z, w, d] of [[0, 0, 420, 14], [0, -150, 420, 12], [0, 150, 420, 12]]) {
      ctx.fillRect(size / 2 + (x - w / 2 + 50) * scale, size / 2 + (z - d / 2) * scale, w * scale, d * scale);
    }
    for (const x of [-150, -40, 60, 150]) {
      ctx.fillRect(size / 2 + (x - 6 + 50) * scale, 0, 12 * scale, size);
    }
    // Lane dashes down Ocean Drive.
    ctx.fillStyle = '#d8c25a';
    for (let z = -260; z < 260; z += 24) {
      ctx.fillRect(size / 2 + (150 + 50) * scale - 1, size / 2 + z * scale, 2, 10 * scale);
    }
    // Objective star.
    if (objective) {
      const [ox, oy] = toMap(objective.x, objective.z);
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(ox, oy, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ox, oy, 9, 0, Math.PI * 2); ctx.stroke();
    }
    // Traffic (white), police (flashing blue/red), player (yellow).
    ctx.fillStyle = '#ffffff';
    for (const c of traffic) {
      const [x, y] = toMap(c.position.x, c.position.z);
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    const flash = Math.floor(performance.now() / 350) % 2 === 0;
    ctx.fillStyle = flash ? '#2a6bff' : '#ff2a2a';
    for (const c of cruisers) {
      const [x, y] = toMap(c.position.x, c.position.z);
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    const [px, py] = toMap(player.x, player.z);
    ctx.fillStyle = '#ffc21a';
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px, py, 7.5, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  missionTitle(n) {
    const m = MISSIONS.find((x) => x.n === n);
    return m ? `Mission ${m.n}/18 — ${m.name}` : 'Neon Bay';
  }
}
