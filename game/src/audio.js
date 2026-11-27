// Gobblewood Escape — all sound is synthesized with WebAudio, no audio files.
// Every effect is a short oscillator/noise gesture, so the game loads nothing
// over the network and stays silent until the player first interacts.

let audioContext = null;
let muted = false;

function context() {
  if (audioContext !== null) return audioContext;
  try {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (Ctor === undefined) return null;
    audioContext = new Ctor();
  } catch {
    return null;
  }
  return audioContext;
}

/** Call from the first user gesture so later effects are allowed to sound. */
export function unlockAudio() {
  const ctx = context();
  if (ctx !== null && ctx.state === 'suspended') void ctx.resume();
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freqStart, freqEnd, duration, type, volume, delay = 0) {
  if (muted) return;
  const ctx = context();
  if (ctx === null) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** A turkey gobble: four quick low clucks, falling in pitch. */
export function gobble() {
  for (let i = 0; i < 4; i += 1) {
    tone(320 - i * 40, 180 - i * 20, 0.09, 'square', 0.08, i * 0.09);
  }
}

/** Jump: a quick rising whoosh. */
export function jumpSound() {
  tone(280, 640, 0.16, 'sine', 0.1);
}

/** Dash: a short burst of air. */
export function dashSound() {
  tone(900, 300, 0.12, 'sawtooth', 0.05);
}

/** Corn or pie collected: a bright two-note ding. */
export function pickupSound() {
  tone(880, 880, 0.08, 'sine', 0.12);
  tone(1318, 1318, 0.14, 'sine', 0.12, 0.08);
}

/** Extra life: a rising three-note chime. */
export function featherSound() {
  tone(659, 659, 0.1, 'sine', 0.12);
  tone(880, 880, 0.1, 'sine', 0.12, 0.1);
  tone(1174, 1174, 0.18, 'sine', 0.12, 0.2);
}

/** Hurt: a low thud. */
export function hurtSound() {
  tone(160, 60, 0.25, 'sawtooth', 0.16);
}

/** The farmer spotted the turkey: a two-tone alarm. */
export function alarmSound() {
  tone(740, 740, 0.14, 'square', 0.1);
  tone(554, 554, 0.18, 'square', 0.1, 0.15);
}

/** A knife whistles past: a fast falling tone. */
export function knifeSound() {
  tone(1400, 500, 0.2, 'sine', 0.06);
}

/** Escaped: a short victory arpeggio. */
export function winSound() {
  const notes = [523, 659, 784, 1046, 1318];
  notes.forEach((note, i) => tone(note, note, 0.22, 'triangle', 0.14, i * 0.11));
}

/** Caught: a slow descending phrase. */
export function caughtSound() {
  const notes = [392, 330, 262, 196];
  notes.forEach((note, i) => tone(note, note * 0.94, 0.3, 'triangle', 0.14, i * 0.22));
}
