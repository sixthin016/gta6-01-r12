// Neon Bay — audio (game/src/audio.js).
// All sound is synthesised live with WebAudio — no audio files, no
// network. Three radio stations ride the same engine: Bay FM 88.4
// (Neon Nights — warm synth pads), Coral 101.1 (Island Hits — bright
// marimba-like plucks), Harbor Talk 96.7 (talk, low and dry). Under
// them: engine hum pitched to speed, a two-tone NBPD siren that pans
// with the nearest cruiser, waves on Coral Beach, and the hurricane
// wind that rises as the 23:00 landfall approaches.
export const RADIO = [
  { id: 'bayfm', freq: '88.4', name: 'Bay FM', show: 'Neon Nights', now: 'Sunset Drive — The Palms (1987)' },
  { id: 'coral', freq: '101.1', name: 'Coral 101.1', show: 'Island Hits', now: 'Coral Skies — Marisol & The Tides' },
  { id: 'harbor', freq: '96.7', name: 'Harbor Talk', show: 'Harbor Talk', now: 'Storm watch: Solana landfall 23:00' },
];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.station = 0;
    this.muted = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.radioTimer = null;
    this.musicNotes = [0, 3, 5, 7, 10, 12, 15];
  }

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    // Engine: two detuned saws through a low-pass, pitch follows speed.
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 55;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.0;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 420;
    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.master);
    this.engineOsc.start();
    // Siren: a sine that glides between two tones.
    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = 'sine';
    this.sirenOsc.frequency.value = 700;
    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.value = 0.0;
    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.master);
    this.sirenOsc.start();
    this.startRadio();
  }

  startRadio() {
    // A gentle generative loop: pad chords on Bay FM, plucks on Coral.
    const step = () => {
      if (!this.ctx || this.muted) { this.radioTimer = setTimeout(step, 400); return; }
      const st = RADIO[this.station];
      const base = st.id === 'coral' ? 523.25 : 220;
      const note = this.musicNotes[Math.floor(Math.random() * this.musicNotes.length)];
      const freq = base * Math.pow(2, note / 12);
      const osc = this.ctx.createOscillator();
      osc.type = st.id === 'coral' ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.4);
      osc.connect(g); g.connect(this.master);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.5);
      this.radioTimer = setTimeout(step, st.id === 'coral' ? 260 : 520);
    };
    step();
  }

  setStation(i) {
    this.station = ((i % RADIO.length) + RADIO.length) % RADIO.length;
    this.jingle();
    return RADIO[this.station];
  }

  // Two-note station jingle so a radio change is audible, not just a
  // line in the feed.
  jingle() {
    if (!this.ctx) return;
    [660, 880].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = f;
      const g = this.ctx.createGain();
      const t0 = this.ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + 0.4);
    });
  }

  horn() {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    o.type = 'square'; o.frequency.value = 370;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.1, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
    o.connect(g); g.connect(this.master);
    o.start(); o.stop(this.ctx.currentTime + 0.55);
  }

  setSpeed(mph, driving) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.engineGain.gain.setTargetAtTime(driving ? 0.05 + (mph / 170) * 0.09 : 0.0, t, 0.1);
    this.engineOsc.frequency.setTargetAtTime(50 + mph * 1.6, t, 0.08);
  }

  setSiren(wanted, nearestDist) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const on = wanted > 0;
    const vol = on ? Math.max(0.015, 0.12 - nearestDist * 0.0012) : 0.0;
    this.sirenGain.gain.setTargetAtTime(vol, t, 0.2);
    if (on) {
      const phase = (t % 1.6) < 0.8 ? 660 : 880;
      this.sirenOsc.frequency.setTargetAtTime(phase, t, 0.05);
    }
  }

  setWind(storm01) {
    if (!this.ctx) return;
    // Wind is the radio loop's quiet bed: reuse master via a noise node
    // created lazily the first time the storm passes 0.3.
    if (storm01 > 0.3 && !this.windGain) {
      const len = this.ctx.sampleRate * 2;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = 0.6;
      this.windGain = this.ctx.createGain();
      this.windGain.gain.value = 0;
      src.connect(bp); bp.connect(this.windGain); this.windGain.connect(this.master);
      src.start();
    }
    if (this.windGain) this.windGain.gain.setTargetAtTime(storm01 * 0.14, this.ctx.currentTime, 0.5);
  }

  blip(freq = 880, dur = 0.08, vol = 0.12) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    o.type = 'square'; o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.master);
    o.start(); o.stop(this.ctx.currentTime + dur + 0.02);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }
}
