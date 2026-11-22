// Neon Bay — story missions (game/src/missions.js).
// 18 story missions, one arc: Rae Vega, a dock driver fresh out of the
// Neon Bay docks, builds a crew and pulls one last score — the
// $250,000 Harbor Reserve vault — before Hurricane Solana makes
// landfall on Tue 24 Nov 2026 at 23:00 WITA. Payouts are fixed and the
// cash ladder is audited in README.md, so every dollar on screen can
// be traced: start $500 + mission payouts + side income (street races,
// taxi fares, sold cars) = the cash shown in each staged shot.
//   After mission 6:  $500 + $7,700 missions + $4,250 side = $12,450
//   After mission 7:  + $2,400 + $620 side                 = $15,470
//   After mission 11: + $13,700 + $2,280 side              = $31,450
//   After mission 17: + $43,500 + $1,950 side              = $81,900
// Respect climbs 68 -> 74 -> 83 -> 86 -> 97 across the same stages,
// and the final heist takes it to 100: early missions build respect
// fast (12, 11, 11, 11, 11, 12), later ones add little because Rae is
// already known on every street (6, then 3, 2, 2, 2, 3, then 2, 2, 3,
// 2, 2, and 3 for the last score).
// Every mission names a real district and a real street; none of the
// names, dates or numbers below appear differently anywhere else in
// the entry.
export const MISSIONS = [
  { n: 1, name: 'Dockside Pickup', district: 'Harbor', street: 'Harbor Road', type: 'drive', payout: 800, respect: 12, brief: 'Pick up Mara at the docks and lose the harbour patrol. First rule of Neon Bay: never stop on Harbor Road.', giver: 'Mara Ivers', objective: 'Drive to the Harbor docks and pick up Mara' },
  { n: 2, name: 'The Coral Runner', district: 'Coral Beach', street: 'Ocean Drive', type: 'steal', payout: 900, respect: 11, brief: 'A turquoise convertible sits unlocked outside the Palms Bar. Take it before its owner finishes his drink.', giver: 'Dune Okafor', objective: 'Steal the Coral Runner from Ocean Drive' },
  { n: 3, name: 'Mercado Run', district: 'Mercado District', street: 'Mercado Lane', type: 'deliver', payout: 1100, respect: 11, brief: 'Three crates, four stalls, no questions. The Mercado pays cash and forgets faces.', giver: 'Mara Ivers', objective: 'Deliver 3 crates across the Mercado stalls' },
  { n: 4, name: 'Neon Nights', district: 'Neon Row', street: 'Neon Row', type: 'race', payout: 1300, respect: 11, brief: 'Dune says nobody out-drives him down Neon Row. Prove him wrong under the signs.', giver: 'Dune Okafor', objective: 'Beat Dune in a 3-lap Neon Row street race' },
  { n: 5, name: 'Harbor Lights', district: 'Harbor', street: 'Harbor Road', type: 'steal', payout: 1600, respect: 11, brief: 'A Harbor Hauler truck full of gelato freezers. Cold cargo, warm money.', giver: 'Kip Reyes', objective: 'Lift the Harbor Hauler and park it at the garage' },
  { n: 6, name: 'The Tiki Job', district: 'Mercado District', street: 'Mercado Lane', type: 'rob', payout: 2000, respect: 12, brief: 'The Tiki Lounge till holds the weekend take. In, out, and lose the 2-star heat before the bridge.', giver: 'Rae Vega', objective: 'Rob the Tiki Lounge till, then lose 2-star heat' },
  { n: 7, name: 'Beachside Getaway', district: 'Coral Beach', street: 'Ocean Drive', type: 'chase', payout: 2400, respect: 6, brief: 'Four stars, one beach, no brakes. Outrun the NBPD along Ocean Drive while Air One circles overhead.', giver: 'Dune Okafor', objective: 'Outrun 4-star NBPD pursuit along Coral Beach' },
  { n: 8, name: 'Mercado Standoff', district: 'Mercado District', street: 'Mercado Lane', type: 'combat', payout: 2800, respect: 3, brief: 'The Vipers want the Mercado stalls. Hold the market with Kip until Mara loops the cameras.', giver: 'Kip Reyes', objective: 'Defend the market stalls against 6 Viper shooters' },
  { n: 9, name: 'Air One', district: 'Highway Loop', street: 'Highway Loop', type: 'chase', payout: 3100, respect: 2, brief: 'The helicopter never blinks. Lose Air One through the Loop tunnels and the overpass.', giver: 'Mara Ivers', objective: 'Break line of sight with Air One for 12 seconds' },
  { n: 10, name: 'The Gelato Run', district: 'Neon Row', street: 'Neon Row', type: 'deliver', payout: 3600, respect: 2, brief: 'Crates past a 3-star roadblock, no sirens. Mara has the cameras; you have the wheel.', giver: 'Mara Ivers', objective: 'Smuggle 2 crates past a 3-star NBPD roadblock' },
  { n: 11, name: 'Rooftop Signal', district: 'Neon Row', street: 'Neon Row', type: 'hack', payout: 4200, respect: 2, brief: 'Mara needs 90 seconds on the hotel roof to own the city cameras. Keep the stairwell clear.', giver: 'Mara Ivers', objective: 'Protect Mara on the rooftop for 90 seconds' },
  { n: 12, name: 'Harbor Vault', district: 'Harbor', street: 'Harbor Road', type: 'rob', payout: 5000, respect: 3, brief: 'The Harbor Reserve truck carries the weekend vault run. Crack it between the cranes while the NBPD closes in.', giver: 'Kip Reyes', objective: 'Crack the Harbor Reserve truck at the docks' },
  { n: 13, name: 'Storm Surge', district: 'Coral Beach', street: 'Ocean Drive', type: 'race', payout: 6000, respect: 2, brief: 'The surge is coming up Ocean Drive ahead of the hurricane. Race the water to the pier.', giver: 'Dune Okafor', objective: 'Outrun the storm surge to Coral Beach pier' },
  { n: 14, name: 'The Informant', district: 'Harbor', street: 'Harbor Road', type: 'rescue', payout: 7000, respect: 2, brief: 'Kip’s contact is pinned at the pier with the Vipers closing. Get him out alive.', giver: 'Kip Reyes', objective: 'Extract the informant from the pier' },
  { n: 15, name: 'Five Stars', district: 'Highway Loop', street: 'Highway Loop', type: 'survive', payout: 8500, respect: 3, brief: 'Five stars. Three minutes. The whole NBPD, the roadblocks, Air One, all of it. Survive.', giver: 'Rae Vega', objective: 'Survive 5-star heat for 3 minutes' },
  { n: 16, name: 'The Long Loop', district: 'Highway Loop', street: 'Highway Loop', type: 'chase', payout: 10000, respect: 2, brief: '155 km/h around the full Highway Loop with Air One on your roof. One clean lap.', giver: 'Dune Okafor', objective: 'Complete one 155 km/h lap of the Highway Loop' },
  { n: 17, name: 'Dune’s Drift', district: 'Neon Row', street: 'Neon Row', type: 'race', payout: 12000, respect: 2, brief: 'Midnight drift series, Neon Row. Beat Dune at his own game and the Drift King is yours.', giver: 'Dune Okafor', objective: 'Win the midnight drift series on Neon Row' },
  { n: 18, name: 'The Last Score', district: 'Harbor', street: 'Harbor Road', type: 'heist', payout: 250000, respect: 3, brief: 'The $250,000 Harbor Reserve vault, one crew, one night — before Hurricane Solana makes landfall at 23:00.', giver: 'Rae Vega', objective: 'Take the $250,000 vault before the 23:00 landfall' },
];

export const MISSION_COUNT = MISSIONS.length; // 18

export function missionPayoutsTo(n) {
  return MISSIONS.filter((m) => m.n <= n).reduce((s, m) => s + m.payout, 0);
}

export function missionByNumber(n) {
  return MISSIONS.find((m) => m.n === n) ?? null;
}

// Side income between missions, audited the same way as payouts.
// Stage A (after m6): 3 races $750 + 6 taxi fares $900 + 2 cars sold $2,600.
// Stage B (after m7): 2 races $500 + taxi $120.
// Stage C (before m12): 4 races $1,000 + taxi $480 + 1 car sold $800.
// Stage D (before m18): 2 races $500 + taxi $250 + car parts $1,200.
export const SIDE_INCOME = { A: 4250, B: 620, C: 2280, D: 1950 };
export const START_CASH = 500;

export const CASH_STAGES = {
  A: { after: 6, cash: 12450, respect: 68 },
  B: { after: 7, cash: 15470, respect: 74 },
  C: { after: 11, cash: 31450, respect: 83 },
  D: { after: 17, cash: 81900, respect: 97 },
};

// Audit helper: recompute a stage's cash from its parts. The staged
// shots show the cash *before* the mission in progress pays out, so
// stage C counts payouts only through mission 11 and stage D only
// through mission 17.
export function auditStage(stage) {
  const s = CASH_STAGES[stage];
  const side = stage === 'A' ? SIDE_INCOME.A
    : stage === 'B' ? SIDE_INCOME.A + SIDE_INCOME.B
    : stage === 'C' ? SIDE_INCOME.A + SIDE_INCOME.B + SIDE_INCOME.C
    : SIDE_INCOME.A + SIDE_INCOME.B + SIDE_INCOME.C + SIDE_INCOME.D;
  return {
    stage,
    computed: START_CASH + missionPayoutsTo(s.after) + side,
    claimed: s.cash,
    matches: START_CASH + missionPayoutsTo(s.after) + side === s.cash,
    respectComputed: MISSIONS.filter((m) => m.n <= s.after).reduce((t, m) => t + m.respect, 0),
    respectClaimed: s.respect,
  };
}

export function cashAfter(missionNumber, stageSide) {
  return START_CASH + missionPayoutsTo(missionNumber) + stageSide;
}

export class MissionRunner {
  constructor() {
    this.current = 1;
    this.completed = 0;
    this.cash = START_CASH;
    this.respect = 0;
    this.log = [];
  }

  get active() {
    return missionByNumber(this.current);
  }

  completeActive() {
    const m = this.active;
    if (!m) return null;
    this.cash += m.payout;
    this.respect += m.respect;
    this.completed += 1;
    this.log.push(`Mission ${m.n} "${m.name}" complete: +$${m.payout.toLocaleString('en-US')}`);
    this.current = Math.min(MISSION_COUNT + 1, this.current + 1);
    return m;
  }

  get done() {
    return this.completed >= MISSION_COUNT;
  }
}
