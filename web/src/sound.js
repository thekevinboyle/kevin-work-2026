// Sound Engine — modeled synth + percussion
// Physical modeling, FM percussion, filtered noise, subtractive plucks

let ctx = null;
let masterGain = null;
let muted = false;
let activeVoices = 0;
const MAX_VOICES = 8;
const RETRIGGER_MS = 50;
const lastTrigger = {};
let distCurve = null;
let crushCurve = null;
let reverbBuses = [];

function init() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = ctx.createGain();
  masterGain.gain.value = muted ? 0 : 0.6;
  masterGain.connect(ctx.destination);
  const stored = localStorage.getItem('audio-muted');
  if (stored === 'true') { muted = true; masterGain.gain.value = 0; }

  const n = 256;
  distCurve = new Float32Array(n);
  crushCurve = new Float32Array(n);
  const steps = 16;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    distCurve[i] = Math.tanh(x * 4);
    crushCurve[i] = Math.round(x * steps) / steps;
  }

  // Reverb bus pool — different room characters
  const irConfigs = [
    { dur: 0.3, decay: 10, damp: 4 },    // tight slap
    { dur: 0.7, decay: 5, damp: 3 },     // small room
    { dur: 1.4, decay: 2.5, damp: 1.8 }, // medium room
    { dur: 2.8, decay: 1.3, damp: 0.8 }, // large hall
    { dur: 0.5, decay: 7, damp: 6 },     // dark damped box
    { dur: 2.0, decay: 1.8, damp: 0.4 }, // bright metal room
  ];
  reverbBuses = irConfigs.map(cfg => {
    const conv = ctx.createConvolver();
    conv.buffer = generateIR(cfg.dur, cfg.decay, cfg.damp);
    const wet = ctx.createGain();
    wet.gain.value = 1;
    conv.connect(wet);
    wet.connect(masterGain);
    return conv;
  });
}

function ensureContext() {
  if (!ctx) init();
  if (ctx.state === 'suspended') ctx.resume();
}

function setMute(val) {
  muted = val;
  localStorage.setItem('audio-muted', val ? 'true' : 'false');
  if (masterGain) masterGain.gain.setTargetAtTime(val ? 0 : 0.6, ctx.currentTime, 0.01);
}

function isMuted() { return muted; }
function voiceStart() { activeVoices++; }
function voiceEnd() { activeVoices = Math.max(0, activeVoices - 1); }
function canPlay() { return activeVoices < MAX_VOICES; }

function rr(min, max) { return min + Math.random() * (max - min); }
function pick(...args) { return args[Math.floor(Math.random() * args.length)]; }

function makeDist(type) {
  const ws = ctx.createWaveShaper();
  ws.curve = type === 'crush' ? crushCurve : distCurve;
  ws.oversample = 'none';
  return ws;
}

// Generate stereo impulse response buffer
function generateIR(duration, decay, damping) {
  const len = Math.ceil(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / ctx.sampleRate;
      // Exponential decay with HF damping over time
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * decay) / (1 + t * damping * 8);
    }
  }
  return buf;
}

// Random reverb send — picks a bus, random wet level
function sendToReverb(node) {
  if (!reverbBuses.length || Math.random() > 0.55) return;
  const bus = pick(...reverbBuses);
  const send = ctx.createGain();
  send.gain.value = rr(0.08, 0.4);
  node.connect(send);
  send.connect(bus);
}

// ========================
// SYNTHESIS PRIMITIVES
// ========================

// 1. Tick pop — ultra-short transient click, like a closed hat tap
function tickPop({ freq = 800, duration = 0.02, gain = 0.15 } = {}) {
  ensureContext();
  if (!canPlay()) return;
  const t = ctx.currentTime;

  const d = duration * rr(0.5, 2.5);

  // Short noise burst — the core of the tick
  const buf = ctx.createBufferSource();
  const len = Math.ceil(ctx.sampleRate * Math.max(0.01, d + 0.01));
  const noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  buf.buffer = noise;

  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = freq * rr(0.6, 1.4);

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = rr(3000, 9000);
  bp.Q.value = rr(1, 4);

  const env = ctx.createGain();
  env.gain.setValueAtTime(gain * rr(0.7, 1.3), t);
  env.gain.exponentialRampToValueAtTime(0.001, t + d);

  buf.connect(hp);
  hp.connect(bp);
  bp.connect(env);
  env.connect(masterGain);
  if (Math.random() > 0.7) sendToReverb(env);

  voiceStart();
  buf.onended = voiceEnd;
  buf.start(t);
  buf.stop(t + d + 0.01);
}

// 2. Brush hit — filtered noise, like a brush tap on a drum head
function brushHit({ filterFreq = 6000, duration = 0.04, gain = 0.12 } = {}) {
  ensureContext();
  if (!canPlay()) return;
  const t = ctx.currentTime;

  const d = duration * rr(0.5, 3.0);

  const buf = ctx.createBufferSource();
  const len = Math.ceil(ctx.sampleRate * Math.max(0.05, d + 0.02));
  const noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  buf.buffer = noise;

  // Tight bandpass — focused texture, not wide
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = filterFreq * rr(0.5, 1.5);
  bp.Q.value = rr(2, 8);

  const env = ctx.createGain();
  env.gain.setValueAtTime(gain * rr(0.7, 1.3), t);
  env.gain.exponentialRampToValueAtTime(0.001, t + d);

  buf.connect(bp);
  bp.connect(env);
  env.connect(masterGain);
  if (Math.random() > 0.6) sendToReverb(env);

  voiceStart();
  buf.onended = voiceEnd;
  buf.start(t);
  buf.stop(t + d + 0.01);
}

// 3. Ghost tap — muted, compressed micro-hit, like a ghost note
function ghostTap({ freq = 1200, duration = 0.03, gain = 0.12 } = {}) {
  ensureContext();
  if (!canPlay()) return;
  const t = ctx.currentTime;

  const d = duration * rr(0.5, 2.5);

  // Tiny pitched body — triangle for softness
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq * rr(0.7, 1.4), t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * rr(0.3, 0.6)), t + d * 0.3);

  // Lowpass to keep it muted and dark
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = rr(1500, 4000);
  lp.Q.value = rr(0.5, 2);

  const env = ctx.createGain();
  env.gain.setValueAtTime(gain * rr(0.6, 1.2), t);
  env.gain.exponentialRampToValueAtTime(0.001, t + d);

  // Noise click on top for attack
  const clickBuf = ctx.createBufferSource();
  const clickLen = Math.ceil(ctx.sampleRate * 0.003);
  const clickNoise = ctx.createBuffer(1, clickLen, ctx.sampleRate);
  const clickData = clickNoise.getChannelData(0);
  for (let i = 0; i < clickLen; i++) clickData[i] = (Math.random() * 2 - 1) * (1 - i / clickLen);
  clickBuf.buffer = clickNoise;

  const clickEnv = ctx.createGain();
  clickEnv.gain.setValueAtTime(gain * rr(0.3, 0.6), t);
  clickEnv.gain.exponentialRampToValueAtTime(0.001, t + rr(0.003, 0.008));

  osc.connect(lp);
  lp.connect(env);
  env.connect(masterGain);
  if (Math.random() > 0.75) sendToReverb(env);

  clickBuf.connect(clickEnv);
  clickEnv.connect(masterGain);

  voiceStart();
  osc.onended = voiceEnd;
  osc.start(t);
  clickBuf.start(t);
  osc.stop(t + d + 0.01);
  clickBuf.stop(t + 0.01);
}

// 4. Hat tick — tight closed hat, pure noise transient
function hatTick({ freq = 800, duration = 0.025, gain = 0.1 } = {}) {
  ensureContext();
  if (!canPlay()) return;
  const t = ctx.currentTime;

  const d = duration * rr(0.4, 3.0);

  const buf = ctx.createBufferSource();
  const len = Math.ceil(ctx.sampleRate * Math.max(0.02, d + 0.01));
  const noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  buf.buffer = noise;

  // Highpass — all top end, no body
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = rr(5000, 12000);

  // Narrow bandpass for color variation
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq * rr(0.6, 1.5);
  bp.Q.value = rr(1, 3);

  const env = ctx.createGain();
  env.gain.setValueAtTime(gain * rr(0.7, 1.3), t);
  env.gain.exponentialRampToValueAtTime(0.001, t + d);

  buf.connect(hp);
  hp.connect(bp);
  bp.connect(env);
  env.connect(masterGain);
  if (Math.random() > 0.7) sendToReverb(env);

  voiceStart();
  buf.onended = voiceEnd;
  buf.start(t);
  buf.stop(t + d + 0.01);
}

// 5. Tone blip — tiny pitched pop, muted and quick
function toneBlip({ freq = 300, duration = 0.03, gain = 0.13 } = {}) {
  ensureContext();
  if (!canPlay()) return;
  const t = ctx.currentTime;

  const f = freq * rr(0.7, 1.5);
  const d = duration * rr(0.5, 3.0);

  const osc = ctx.createOscillator();
  osc.type = pick('sine', 'triangle');
  osc.frequency.setValueAtTime(f * rr(1.5, 3), t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, f), t + d * 0.2);

  // Lowpass keeps it muted — no ringing top end
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(rr(2000, 6000), t);
  lp.frequency.exponentialRampToValueAtTime(rr(400, 1200), t + d * 0.5);

  const env = ctx.createGain();
  env.gain.setValueAtTime(gain * rr(0.7, 1.2), t);
  env.gain.exponentialRampToValueAtTime(0.001, t + d);

  osc.connect(lp);
  lp.connect(env);
  env.connect(masterGain);
  if (Math.random() > 0.8) sendToReverb(env);

  voiceStart();
  osc.onended = voiceEnd;
  osc.start(t);
  osc.stop(t + d + 0.01);
}

// 6. Shaker grain — rapid micro noise bursts, shaker/cabasa feel
function shakerGrain({ duration = 0.06, gain = 0.12, repeats = 3 } = {}) {
  ensureContext();
  if (!canPlay()) return;
  const t = ctx.currentTime;

  const d = duration * rr(0.5, 3.0);
  const reps = Math.max(2, Math.floor(repeats * rr(0.5, 2.0)));

  const buf = ctx.createBufferSource();
  const len = Math.ceil(ctx.sampleRate * Math.max(0.05, d + 0.02));
  const noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  buf.buffer = noise;

  // Highpass — shakers are all top
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = rr(3000, 8000);

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = rr(5000, 12000);
  bp.Q.value = rr(1, 4);

  // Gated envelope — rapid on/off for grain texture
  const env = ctx.createGain();
  env.gain.value = 0;
  const grainLen = d / reps * rr(0.3, 0.7);

  for (let i = 0; i < reps; i++) {
    const onset = t + (i / reps) * d;
    const g = gain * rr(0.5, 1.2) * (1 - i / reps * 0.4);
    env.gain.setValueAtTime(g, onset);
    env.gain.setValueAtTime(0.001, onset + grainLen);
  }
  env.gain.setValueAtTime(0.001, t + d);

  buf.connect(hp);
  hp.connect(bp);
  bp.connect(env);
  env.connect(masterGain);
  if (Math.random() > 0.7) sendToReverb(env);

  voiceStart();
  buf.onended = voiceEnd;
  buf.start(t);
  buf.stop(t + d + 0.02);
}

// 7. Crunch bit — bitcrushed micro noise, digital grit texture
function crunchBit({ freq = 200, duration = 0.04, gain = 0.13 } = {}) {
  ensureContext();
  if (!canPlay()) return;
  const t = ctx.currentTime;

  const d = duration * rr(0.5, 3.0);

  const buf = ctx.createBufferSource();
  const len = Math.ceil(ctx.sampleRate * Math.max(0.03, d + 0.01));
  const noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  buf.buffer = noise;

  // Bitcrush via waveshaper
  const crush = makeDist('crush');

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq * rr(0.5, 2.0);
  bp.Q.value = rr(1, 5);

  const env = ctx.createGain();
  env.gain.setValueAtTime(gain * rr(0.6, 1.2), t);
  env.gain.exponentialRampToValueAtTime(0.001, t + d);

  buf.connect(crush);
  crush.connect(bp);
  bp.connect(env);
  env.connect(masterGain);
  if (Math.random() > 0.7) sendToReverb(env);

  voiceStart();
  buf.onended = voiceEnd;
  buf.start(t);
  buf.stop(t + d + 0.01);
}

// 8. Muted tap — deadened percussion, like a palm-muted drum hit
function mutedTap({ freq = 150, duration = 0.04, gain = 0.14 } = {}) {
  ensureContext();
  if (!canPlay()) return;
  const t = ctx.currentTime;

  const f = freq * rr(0.6, 1.5);
  const d = duration * rr(0.5, 2.5);

  // Short sine body — fast pitch drop
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f * rr(2, 4), t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, f), t + d * 0.15);

  // Heavy lowpass — muted, dead sounding
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = rr(800, 2000);
  lp.Q.value = rr(0.5, 2);

  const env = ctx.createGain();
  env.gain.setValueAtTime(gain * rr(0.7, 1.2), t);
  env.gain.exponentialRampToValueAtTime(0.001, t + d);

  osc.connect(lp);
  lp.connect(env);
  env.connect(masterGain);

  voiceStart();
  osc.onended = voiceEnd;
  osc.start(t);
  osc.stop(t + d + 0.01);
}

// 9. Pluck — short muted pluck, fast damping, minimal ring
function pluck({ freq = 300, duration = 0.06, gain = 0.13 } = {}) {
  ensureContext();
  if (!canPlay()) return;
  const t = ctx.currentTime;

  const f = freq * rr(0.7, 1.4);
  const d = duration * rr(0.5, 2.5);

  const osc = ctx.createOscillator();
  osc.type = pick('triangle', 'sine');
  osc.frequency.value = f;

  // Aggressive lowpass sweep — kills brightness fast
  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(Math.min(15000, f * rr(6, 12)), t);
  lpf.frequency.exponentialRampToValueAtTime(Math.max(20, f * rr(0.3, 0.8)), t + d * 0.2);
  lpf.Q.value = rr(0.5, 2);

  const env = ctx.createGain();
  env.gain.setValueAtTime(gain * rr(0.7, 1.2), t);
  env.gain.exponentialRampToValueAtTime(0.001, t + d);

  osc.connect(lpf);
  lpf.connect(env);
  env.connect(masterGain);
  if (Math.random() > 0.75) sendToReverb(env);

  voiceStart();
  osc.onended = voiceEnd;
  osc.start(t);
  osc.stop(t + d + 0.01);
}

// 10. Membrane — tight drum tap, fast decay, muted body
function membrane({ freq = 120, duration = 0.05, gain = 0.14 } = {}) {
  ensureContext();
  if (!canPlay()) return;
  const t = ctx.currentTime;

  const f = freq * rr(0.7, 1.5);
  const d = duration * rr(0.5, 2.5);

  // Body — sine with pitch drop
  const body = ctx.createOscillator();
  body.type = 'sine';
  body.frequency.setValueAtTime(f * rr(2, 4), t);
  body.frequency.exponentialRampToValueAtTime(Math.max(20, f), t + d * 0.12);

  // Lowpass to keep it dead
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = rr(1200, 3000);

  const bodyEnv = ctx.createGain();
  bodyEnv.gain.setValueAtTime(gain * rr(0.7, 1.2), t);
  bodyEnv.gain.exponentialRampToValueAtTime(0.001, t + d);

  body.connect(lp);
  lp.connect(bodyEnv);
  bodyEnv.connect(masterGain);
  if (Math.random() > 0.75) sendToReverb(bodyEnv);

  voiceStart();
  body.onended = voiceEnd;
  body.start(t);
  body.stop(t + d + 0.01);
}

// 11. Rim tick — short stick-on-rim click, no ring
function rimTick({ freq = 500, duration = 0.025, gain = 0.14 } = {}) {
  ensureContext();
  if (!canPlay()) return;
  const t = ctx.currentTime;

  const f = freq * rr(0.7, 1.4);
  const d = duration * rr(0.5, 2.0);

  // Single triangle osc — fast decay, no detuned pair
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = f;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = f * rr(1.2, 2.5);
  bp.Q.value = rr(2, 6);

  const env = ctx.createGain();
  env.gain.setValueAtTime(gain * rr(0.7, 1.2), t);
  env.gain.exponentialRampToValueAtTime(0.001, t + d);

  osc.connect(bp);
  bp.connect(env);
  env.connect(masterGain);

  voiceStart();
  osc.onended = voiceEnd;
  osc.start(t);
  osc.stop(t + d + 0.01);
}

// 12. Zap — ultra-short pitched noise, digital blip
function zap({ freq = 600, duration = 0.02, gain = 0.12 } = {}) {
  ensureContext();
  if (!canPlay()) return;
  const t = ctx.currentTime;

  const f = freq * rr(0.6, 1.5);
  const d = duration * rr(0.5, 2.5);

  // Sine with rapid pitch drop — blip character
  const osc = ctx.createOscillator();
  osc.type = pick('sine', 'triangle');
  osc.frequency.setValueAtTime(f * rr(2, 5), t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, f * rr(0.2, 0.5)), t + d);

  // Lowpass to prevent harshness
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = rr(2000, 5000);

  const env = ctx.createGain();
  env.gain.setValueAtTime(gain * rr(0.7, 1.2), t);
  env.gain.exponentialRampToValueAtTime(0.001, t + d);

  osc.connect(lp);
  lp.connect(env);
  env.connect(masterGain);

  voiceStart();
  osc.onended = voiceEnd;
  osc.start(t);
  osc.stop(t + d + 0.01);
}

// ========================
// GABBER KICK — distorted 808, always hard, musically tuned
// ========================

// Sub bass tuned to notes
const KICK_NOTES = [
  32.70, // C1
  36.71, // D1
  41.20, // E1
  43.65, // F1
  49.00, // G1
  55.00, // A1
];

// Aggressive pitch sweeps — gabber uses wide sweeps
const SWEEP_RATIOS = [4, 8, 8, 12, 16];

// Longer durations — gabber kicks are fat and sustained
const KICK_DURS = [0.25, 0.35, 0.45, 0.55, 0.7];

// Sweep times
const SWEEP_TIMES = [0.015, 0.025, 0.035, 0.05];

// Tempo grid for ghost timing
const BPM = 170;
const SIXTEENTH = 60 / BPM / 4;
const THIRTYSECOND = SIXTEENTH / 2;

// Gabber distortion — triple-stage, maximum destruction
let gabberCurve = null;
function ensureGabberCurve() {
  if (gabberCurve) return;
  const n = 512;
  gabberCurve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    let s = x * 16; // extreme pre-gain
    s = Math.tanh(s * 3);
    if (Math.abs(s) > 0.5) s = Math.sign(s) * (1.0 - Math.abs(s)); // aggressive fold-back
    s = Math.tanh(s * 4);
    // Second fold for extra harmonic content
    if (Math.abs(s) > 0.6) s = Math.sign(s) * (1.2 - Math.abs(s));
    s = Math.tanh(s * 2);
    gabberCurve[i] = s;
  }
}

function jungleKick() {
  ensureContext();
  if (!canPlay()) return;
  ensureGabberCurve();
  const t = ctx.currentTime;

  // === CORE: tuned 808 sub ===
  const subFreq = pick(...KICK_NOTES);
  const subDur = pick(...KICK_DURS);
  const sweepRatio = pick(...SWEEP_RATIOS);
  const pitchStart = subFreq * sweepRatio;
  const pitchTime = pick(...SWEEP_TIMES);

  // === CLEAN SUB PATH — pure sine for deep sustained bass ===
  const cleanSub = ctx.createOscillator();
  cleanSub.type = 'sine';
  cleanSub.frequency.setValueAtTime(pitchStart, t);
  cleanSub.frequency.exponentialRampToValueAtTime(subFreq, t + pitchTime);

  // Lowpass to keep only the fundamental — no harmonics leaking
  const cleanLP = ctx.createBiquadFilter();
  cleanLP.type = 'lowpass';
  cleanLP.frequency.value = pick(80, 100, 120);
  cleanLP.Q.value = 0.7;

  const cleanEnv = ctx.createGain();
  cleanEnv.gain.setValueAtTime(rr(0.25, 0.35), t);
  // Slow release — this is the deep sustain
  cleanEnv.gain.exponentialRampToValueAtTime(0.001, t + subDur * pick(1.0, 1.2, 1.4));

  cleanSub.connect(cleanLP);
  cleanLP.connect(cleanEnv);
  cleanEnv.connect(masterGain);

  // === DISTORTED PATH — harmonics + grit on top ===
  const sub = ctx.createOscillator();
  sub.type = 'triangle';
  sub.frequency.setValueAtTime(pitchStart, t);
  sub.frequency.exponentialRampToValueAtTime(subFreq, t + pitchTime);

  const harm = ctx.createOscillator();
  harm.type = 'triangle';
  harm.frequency.setValueAtTime(pitchStart * 2, t);
  harm.frequency.exponentialRampToValueAtTime(subFreq * 2, t + pitchTime);

  const harm2 = ctx.createOscillator();
  harm2.type = pick('triangle', 'square');
  harm2.frequency.setValueAtTime(pitchStart * pick(3, 5), t);
  harm2.frequency.exponentialRampToValueAtTime(subFreq * pick(3, 5), t + pitchTime * 0.7);

  // Pre-gain — cranked hard
  const preGain = ctx.createGain();
  preGain.gain.value = pick(8, 12, 16, 20);

  sub.connect(preGain);
  harm.connect(preGain);
  harm2.connect(preGain);

  // Stage 1: gabber waveshaper
  const dist1 = ctx.createWaveShaper();
  dist1.curve = gabberCurve;
  dist1.oversample = '2x';

  preGain.connect(dist1);

  // Mid-chain EQ — boost before second distortion
  const midBoost = ctx.createBiquadFilter();
  midBoost.type = 'peaking';
  midBoost.frequency.value = pick(150, 200, 300);
  midBoost.gain.value = pick(8, 10, 14);
  midBoost.Q.value = pick(1, 2, 3);

  dist1.connect(midBoost);

  // Stage 2: second distortion
  const dist2 = ctx.createWaveShaper();
  const dist2Curve = new Float32Array(512);
  const dist2Drive = pick(4, 6, 8);
  for (let i = 0; i < 512; i++) {
    const x = (i * 2) / 512 - 1;
    let s = x * dist2Drive;
    s = Math.tanh(s);
    if (Math.abs(s) > 0.5) s = Math.sign(s) * (1.0 - Math.abs(s));
    s = Math.tanh(s * 2);
    dist2Curve[i] = s;
  }
  dist2.curve = dist2Curve;

  midBoost.connect(dist2);

  // Highpass the distorted path — keep the sub clean, dirt on top
  const distHP = ctx.createBiquadFilter();
  distHP.type = 'highpass';
  distHP.frequency.value = pick(80, 100, 140);

  const highPresence = ctx.createBiquadFilter();
  highPresence.type = 'peaking';
  highPresence.frequency.value = pick(2000, 3000, 4000);
  highPresence.gain.value = pick(4, 6, 8);
  highPresence.Q.value = pick(1, 2);

  dist2.connect(distHP);
  distHP.connect(highPresence);

  const subGainVal = rr(0.2, 0.28);
  const subEnv = ctx.createGain();
  subEnv.gain.setValueAtTime(subGainVal, t);
  subEnv.gain.exponentialRampToValueAtTime(0.001, t + subDur);

  highPresence.connect(subEnv);
  subEnv.connect(masterGain);

  // Reverb (~30%)
  if (Math.random() > 0.7) sendToReverb(subEnv);

  // === CLICK TRANSIENT — always, hard clipped ===
  const clickBuf = ctx.createBufferSource();
  const clickLen = Math.ceil(ctx.sampleRate * pick(0.003, 0.005, 0.008));
  const clickNoise = ctx.createBuffer(1, clickLen, ctx.sampleRate);
  const clickData = clickNoise.getChannelData(0);
  for (let i = 0; i < clickLen; i++) clickData[i] = (Math.random() * 2 - 1) * (1 - i / clickLen);
  clickBuf.buffer = clickNoise;

  const clickSat = ctx.createWaveShaper();
  const clickCurve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i * 2) / 256 - 1;
    clickCurve[i] = Math.max(-1, Math.min(1, x * 10));
  }
  clickSat.curve = clickCurve;

  const clickEnv = ctx.createGain();
  clickEnv.gain.setValueAtTime(rr(0.2, 0.35), t);
  clickEnv.gain.exponentialRampToValueAtTime(0.001, t + pick(0.004, 0.008));

  clickBuf.connect(clickSat);
  clickSat.connect(clickEnv);
  clickEnv.connect(masterGain);
  clickBuf.start(t);
  clickBuf.stop(t + 0.02);

  // === FLAVOR LAYERS ===

  // Ghost snare (~20%)
  if (Math.random() > 0.8) {
    const snareDelay = pick(SIXTEENTH, SIXTEENTH * 0.5);
    const snareBuf = ctx.createBufferSource();
    const snareLen = Math.ceil(ctx.sampleRate * 0.1);
    const snareNoise = ctx.createBuffer(1, snareLen, ctx.sampleRate);
    const snareData = snareNoise.getChannelData(0);
    for (let i = 0; i < snareLen; i++) snareData[i] = Math.random() * 2 - 1;
    snareBuf.buffer = snareNoise;

    const snareBP = ctx.createBiquadFilter();
    snareBP.type = 'bandpass';
    snareBP.frequency.value = pick(1800, 2500, 3200);
    snareBP.Q.value = pick(3, 5, 7);

    const snareEnv = ctx.createGain();
    snareEnv.gain.setValueAtTime(0, t);
    snareEnv.gain.setValueAtTime(rr(0.05, 0.09), t + snareDelay);
    snareEnv.gain.exponentialRampToValueAtTime(0.001, t + snareDelay + pick(0.04, 0.06));

    snareBuf.connect(snareBP);
    snareBP.connect(snareEnv);
    snareEnv.connect(masterGain);
    snareBuf.start(t);
    snareBuf.stop(t + snareDelay + 0.1);
  }

  // Breakbeat ghost roll (~15%)
  if (Math.random() > 0.85) {
    const ghosts = pick(2, 3);
    for (let i = 0; i < ghosts; i++) {
      const gDelay = THIRTYSECOND * (i + 1);
      const gOsc = ctx.createOscillator();
      gOsc.type = 'triangle';
      const gf = subFreq * pick(1, 2);
      gOsc.frequency.setValueAtTime(gf * pick(4, 8, 12), t + gDelay);
      gOsc.frequency.exponentialRampToValueAtTime(gf, t + gDelay + pick(0.015, 0.025));

      const gDist = ctx.createWaveShaper();
      gDist.curve = gabberCurve;
      const gEnv = ctx.createGain();
      gEnv.gain.setValueAtTime(0, t);
      gEnv.gain.setValueAtTime(subGainVal * (0.3 - i * 0.06), t + gDelay);
      gEnv.gain.exponentialRampToValueAtTime(0.001, t + gDelay + pick(0.05, 0.07));

      gOsc.connect(gDist);
      gDist.connect(gEnv);
      gEnv.connect(masterGain);
      gOsc.start(t);
      gOsc.stop(t + gDelay + 0.1);
    }
  }

  // Reese layer (~25%)
  if (Math.random() > 0.75) {
    const reese = ctx.createOscillator();
    reese.type = pick('sawtooth', 'square');
    const detuneCents = pick(-8, -5, 5, 8);
    const rf = subFreq * Math.pow(2, detuneCents / 1200);
    reese.frequency.setValueAtTime(pitchStart * Math.pow(2, detuneCents / 1200), t);
    reese.frequency.exponentialRampToValueAtTime(rf, t + pitchTime);

    const reeseLPF = ctx.createBiquadFilter();
    reeseLPF.type = 'lowpass';
    reeseLPF.frequency.value = pick(150, 250, 350);
    reeseLPF.Q.value = pick(3, 5);

    const reeseDist = ctx.createWaveShaper();
    reeseDist.curve = gabberCurve;
    const reeseEnv = ctx.createGain();
    reeseEnv.gain.setValueAtTime(rr(0.05, 0.09), t);
    reeseEnv.gain.exponentialRampToValueAtTime(0.001, t + subDur * pick(0.5, 0.7, 0.9));

    reese.connect(reeseLPF);
    reeseLPF.connect(reeseDist);
    reeseDist.connect(reeseEnv);
    reeseEnv.connect(masterGain);
    reese.start(t);
    reese.stop(t + subDur + 0.01);
  }

  voiceStart();
  cleanSub.onended = voiceEnd;
  cleanSub.start(t);
  sub.start(t);
  harm.start(t);
  harm2.start(t);
  const extendedDur = subDur * 1.4 + 0.02;
  cleanSub.stop(t + extendedDur);
  sub.stop(t + subDur + 0.01);
  harm.stop(t + subDur + 0.01);
  harm2.stop(t + subDur + 0.01);
}

// ========================
// SKRILLEX CLAP — stacked micro-bursts, transient, snappy
// ========================

function skrillexClap() {
  ensureContext();
  if (!canPlay()) return;
  const t = ctx.currentTime;

  const totalDur = pick(0.06, 0.08, 0.1, 0.12);

  // === MULTI-LAYER CLAP — 4-6 tightly spaced noise bursts ===
  const numLayers = pick(4, 5, 6);
  const layerSpread = rr(0.002, 0.008); // tighter spacing = more fused impact
  const noiseDur = totalDur + numLayers * layerSpread + 0.05;
  const noiseLen = Math.ceil(ctx.sampleRate * noiseDur);

  // Shared noise buffer
  const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const noiseData = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) noiseData[i] = Math.random() * 2 - 1;

  // Output bus for all clap layers
  const clapBus = ctx.createGain();
  clapBus.gain.value = 0.55;

  // High-pass — lower cutoff lets more punch through
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = pick(500, 600, 800);

  // Peak EQ boost in the harsh zone — 2-4kHz presence spike
  const peak = ctx.createBiquadFilter();
  peak.type = 'peaking';
  peak.frequency.value = pick(2500, 3200, 4000);
  peak.Q.value = pick(2, 3, 5);
  peak.gain.value = pick(8, 10, 12); // aggressive dB boost

  // Hard saturation — aggressive clipping for punch
  const sat = ctx.createWaveShaper();
  const satN = 512;
  const satCurve = new Float32Array(satN);
  const preGain = pick(6, 8, 10); // way more drive than before
  for (let i = 0; i < satN; i++) {
    const x = (i * 2) / satN - 1;
    let s = x * preGain;
    s = Math.tanh(s);
    // Hard knee clip for extra bite
    if (Math.abs(s) > 0.6) s = Math.sign(s) * (1.2 - Math.abs(s));
    s = Math.tanh(s * 2);
    satCurve[i] = s;
  }
  sat.curve = satCurve;

  // Second stage — post-EQ distortion for extra grit
  const sat2 = ctx.createWaveShaper();
  const sat2Curve = new Float32Array(satN);
  for (let i = 0; i < satN; i++) {
    const x = (i * 2) / satN - 1;
    sat2Curve[i] = Math.tanh(x * pick(3, 4, 5));
  }
  sat2.curve = sat2Curve;

  clapBus.connect(sat);
  sat.connect(hp);
  hp.connect(peak);
  peak.connect(sat2);
  sat2.connect(masterGain);

  let lastSrc = null;

  for (let layer = 0; layer < numLayers; layer++) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;

    const layerT = t + layer * layerSpread;
    const layerGain = ctx.createGain();
    // All layers hit hard — first loudest, rest still punchy
    const baseGain = layer === 0 ? rr(0.3, 0.4) : rr(0.15, 0.28);
    layerGain.gain.setValueAtTime(0, t);
    layerGain.gain.setValueAtTime(baseGain, layerT);
    // Fast sharp decay
    layerGain.gain.exponentialRampToValueAtTime(0.001, layerT + totalDur * pick(0.4, 0.6, 0.8));

    src.connect(layerGain);
    layerGain.connect(clapBus);
    src.start(t);
    src.stop(layerT + totalDur + 0.02);
    lastSrc = src;
  }

  // === TRANSIENT SPIKE — ultra-short, full-bandwidth crack ===
  const clickSrc = ctx.createBufferSource();
  clickSrc.buffer = noiseBuf;

  // No filtering on transient — let the full spectrum through for maximum snap
  const clickEnv = ctx.createGain();
  clickEnv.gain.setValueAtTime(rr(0.25, 0.4), t); // much louder transient
  clickEnv.gain.exponentialRampToValueAtTime(0.001, t + pick(0.003, 0.005, 0.008)); // faster — sub 8ms

  // Dedicated transient distortion — pure hard clip
  const clickSat = ctx.createWaveShaper();
  const clickCurve = new Float32Array(satN);
  for (let i = 0; i < satN; i++) {
    const x = (i * 2) / satN - 1;
    clickCurve[i] = Math.max(-1, Math.min(1, x * 12)); // brick-wall clip
  }
  clickSat.curve = clickCurve;

  clickSrc.connect(clickEnv);
  clickEnv.connect(clickSat);
  clickSat.connect(masterGain);
  clickSrc.start(t);
  clickSrc.stop(t + 0.02);

  // === BODY THUMP — short sine punch for weight (~70%) ===
  if (Math.random() > 0.3) {
    const thump = ctx.createOscillator();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(pick(200, 250, 300), t);
    thump.frequency.exponentialRampToValueAtTime(pick(100, 120), t + 0.02);

    const thumpEnv = ctx.createGain();
    thumpEnv.gain.setValueAtTime(rr(0.1, 0.18), t);
    thumpEnv.gain.exponentialRampToValueAtTime(0.001, t + pick(0.02, 0.03, 0.04));

    thump.connect(thumpEnv);
    thumpEnv.connect(masterGain);
    thump.start(t);
    thump.stop(t + 0.05);
  }

  // === TAIL — tiny filtered residue for body (~50%) ===
  if (Math.random() > 0.5) {
    const tailSrc = ctx.createBufferSource();
    tailSrc.buffer = noiseBuf;

    const tailBP = ctx.createBiquadFilter();
    tailBP.type = 'bandpass';
    tailBP.frequency.value = pick(1200, 1600, 2000);
    tailBP.Q.value = pick(2, 4);

    const tailEnv = ctx.createGain();
    tailEnv.gain.setValueAtTime(rr(0.04, 0.08), t);
    tailEnv.gain.exponentialRampToValueAtTime(0.001, t + totalDur + pick(0.03, 0.05, 0.08));

    tailSrc.connect(tailBP);
    tailBP.connect(tailEnv);
    tailEnv.connect(masterGain);
    tailSrc.start(t);
    tailSrc.stop(t + totalDur + 0.1);
  }

  // === SHORT REVERB (~35%) — tight room, not washy ===
  if (Math.random() > 0.65) {
    sendToReverb(clapBus);
  }

  voiceStart();
  if (lastSrc) lastSrc.onended = voiceEnd;
}

// ========================
// 20 VISUALIZATION PALETTES
// Primitives decide their own duration
// ========================

const palettes = [
  // 0: Reticle Tracker
  {
    mouseover: (mx) => pick(tickPop, shakerGrain, pluck, hatTick)({ freq: 600 + mx * 3000, gain: 0.1 }),
    'hover-button': () => pick(membrane, rimTick)({ freq: 200, gain: 0.16 }),
    'hover-image': () => pick(brushHit, mutedTap)({ filterFreq: 9000, freq: 400, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 1: Version Control
  {
    mouseover: (mx, my) => pick(ghostTap, shakerGrain, tickPop, rimTick)({ freq: 500 + my * 2000, gain: 0.09 }),
    'hover-button': () => pick(tickPop, zap)({ freq: 1800, gain: 0.15 }),
    'hover-image': () => pick(brushHit, pluck)({ filterFreq: 6000, freq: 800, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 2: Registration Marks
  {
    mouseover: (mx) => pick(crunchBit, membrane, rimTick, brushHit)({ freq: 150 + mx * 400, filterFreq: 1500 + mx * 5000, gain: 0.1 }),
    'hover-button': () => pick(crunchBit, zap)({ freq: 200, gain: 0.16 }),
    'hover-image': () => pick(brushHit, mutedTap)({ filterFreq: 4000, freq: 180, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 3: Signal Processing
  {
    mouseover: (mx) => pick(pluck, tickPop, membrane, zap)({ freq: 300 + mx * 4000, gain: 0.1 }),
    'hover-button': () => pick(toneBlip, membrane)({ freq: 500, gain: 0.16 }),
    'hover-image': () => pick(hatTick, shakerGrain)({ freq: 1500, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 4: AI Status Panel
  {
    mouseover: (mx, my) => pick(zap, ghostTap, pluck, brushHit)({ freq: 1500 + my * 3000, filterFreq: 1500 + my * 3000, gain: 0.09 }),
    'hover-button': () => pick(tickPop, toneBlip)({ freq: 600, gain: 0.15 }),
    'hover-image': () => pick(brushHit, mutedTap)({ filterFreq: 8000, freq: 300, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 5: Resolution Grid
  {
    mouseover: (mx) => pick(hatTick, tickPop, shakerGrain, pluck)({ freq: 400 + mx * 2000, gain: 0.09 }),
    'hover-button': () => pick(membrane, rimTick)({ freq: 150, gain: 0.16 }),
    'hover-image': () => pick(brushHit, crunchBit)({ filterFreq: 8000, freq: 250, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 6: Render Pipeline
  {
    mouseover: (mx) => pick(tickPop, rimTick, crunchBit, membrane)({ freq: 400 + mx * 2500, gain: 0.1 }),
    'hover-button': () => pick(crunchBit, mutedTap)({ freq: 180, gain: 0.16 }),
    'hover-image': () => pick(hatTick, shakerGrain)({ freq: 1000, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 7: Exposure Checker
  {
    mouseover: (mx) => pick(membrane, shakerGrain, tickPop, pluck)({ freq: 1000 + mx * 5000, gain: 0.1 }),
    'hover-button': () => pick(toneBlip, rimTick)({ freq: 400, gain: 0.15 }),
    'hover-image': () => pick(brushHit, ghostTap)({ filterFreq: 7000, freq: 600, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 8: Focus Plane
  {
    mouseover: (mx) => pick(pluck, brushHit, rimTick, membrane)({ freq: 800 + mx * 3000, filterFreq: 2000 + mx * 6000, gain: 0.09 }),
    'hover-button': () => pick(toneBlip, membrane)({ freq: 300, gain: 0.16 }),
    'hover-image': () => pick(brushHit, ghostTap)({ filterFreq: 8000, freq: 500, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 9: Timecode
  {
    mouseover: (mx) => pick(shakerGrain, tickPop, ghostTap, rimTick)({ freq: 600 + mx * 1500, gain: 0.1 }),
    'hover-button': () => pick(ghostTap, shakerGrain)({ freq: 800, gain: 0.15, repeats: 4 }),
    'hover-image': () => pick(hatTick, zap)({ freq: 1200, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 10: Motion Vectors
  {
    mouseover: (mx) => pick(membrane, zap, tickPop, pluck)({ freq: 500 + mx * 2000, gain: 0.1 }),
    'hover-button': () => pick(tickPop, rimTick)({ freq: 600, gain: 0.16 }),
    'hover-image': () => pick(brushHit, mutedTap)({ filterFreq: 6000, freq: 300, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 11: Color Channels
  {
    mouseover: (mx, my) => {
      const ch = Math.floor(my * 4);
      pick(tickPop, pluck, ghostTap, zap)({ freq: [500, 1200, 2800, 5000][ch] || 1200, gain: 0.1 });
    },
    'hover-button': () => pick(hatTick, shakerGrain)({ freq: 1400, gain: 0.15 }),
    'hover-image': () => pick(brushHit, crunchBit)({ filterFreq: 8000, freq: 200, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 12: Aspect Ratio
  {
    mouseover: (mx, my) => pick(ghostTap, rimTick, tickPop, shakerGrain)({ freq: [400, 900, 1800, 3200][Math.floor(my * 4)] || 900, gain: 0.09 }),
    'hover-button': () => pick(crunchBit, mutedTap)({ freq: 180, gain: 0.15 }),
    'hover-image': () => pick(hatTick, pluck)({ freq: 800, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 13: Node Graph
  {
    mouseover: () => pick(tickPop, zap, hatTick, pluck)({ freq: 800, gain: 0.1 }),
    'hover-button': () => pick(membrane, toneBlip)({ freq: 500, gain: 0.16 }),
    'hover-image': () => pick(brushHit, crunchBit)({ filterFreq: 7000, freq: 220, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 14: System Diagnostics
  {
    mouseover: () => pick(brushHit, shakerGrain, ghostTap, rimTick)({ filterFreq: 5000, freq: 1500, gain: 0.08 }),
    'hover-button': () => { tickPop({ freq: 1400, gain: 0.1 }); brushHit({ filterFreq: 6000, gain: 0.08 }); },
    'hover-image': () => pick(hatTick, crunchBit)({ freq: 250, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 15: Transform Gizmo
  {
    mouseover: (mx, my) => {
      const a = Math.atan2(my - 0.5, mx - 0.5);
      const f = 600 + (a + Math.PI) / (Math.PI * 2) * 4000;
      pick(tickPop, pluck, membrane, zap)({ freq: f, gain: 0.1 });
    },
    'hover-button': () => pick(membrane, rimTick)({ freq: 300, gain: 0.16 }),
    'hover-image': () => pick(brushHit, ghostTap)({ filterFreq: 8000, freq: 400, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 16: Particle Config
  {
    mouseover: (mx, my) => pick(brushHit, shakerGrain, hatTick, pluck)({ filterFreq: 2000 + mx * 10000, freq: 1000 + my * 3000, gain: 0.09 }),
    'hover-button': () => pick(tickPop, crunchBit)({ freq: 200, gain: 0.16 }),
    'hover-image': () => pick(ghostTap, zap)({ freq: 600, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 17: Audio Spectrum
  {
    mouseover: (mx) => pick(tickPop, pluck, membrane, zap)({ freq: 150 + mx * 5000, gain: 0.1 }),
    'hover-button': () => pick(hatTick, rimTick)({ freq: 1400, gain: 0.15 }),
    'hover-image': () => pick(brushHit, crunchBit)({ filterFreq: 8000, freq: 300, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 18: Layer Stack
  {
    mouseover: (mx, my) => pick(ghostTap, rimTick, tickPop, shakerGrain)({ freq: 2500 - my * 1800, gain: 0.09 }),
    'hover-button': () => pick(membrane, crunchBit)({ freq: 200, gain: 0.16 }),
    'hover-image': () => pick(hatTick, zap)({ freq: 1000, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
  // 19: Measurement Tool
  {
    mouseover: (mx, my) => {
      const d = Math.sqrt(mx * mx + my * my);
      pick(membrane, pluck, tickPop, shakerGrain)({ freq: 1500 + d * 8000, gain: 0.1 });
    },
    'hover-button': () => pick(toneBlip, zap)({ freq: 400, gain: 0.16 }),
    'hover-image': () => pick(brushHit, crunchBit)({ filterFreq: 6000, freq: 250, gain: 0.13 }),
    click: jungleKick,
    rightclick: skrillexClap,
  },
];

// ========================
// PLAY
// ========================

function play(vizIndex, event, mx = 0.5, my = 0.5) {
  if (muted) return;
  ensureContext();

  if (event === 'mouseover') {
    const key = `${vizIndex}-${event}`;
    const now = performance.now();
    if (lastTrigger[key] && now - lastTrigger[key] < RETRIGGER_MS) return;
    lastTrigger[key] = now;
  }

  const palette = palettes[vizIndex];
  if (!palette || !palette[event]) return;
  palette[event](mx, my);
}

let currentViz = 0;
function setVizIndex(i) { currentViz = i; }
function trigger(event, mx = 0.5, my = 0.5) { play(currentViz, event, mx, my); }

// ========================
// ROLL / FLAM — hold to repeat
// ========================

let rollInterval = null;
let rollCount = 0;

function startRoll(vizIndex, event, mx = 0.5, my = 0.5) {
  stopRoll();
  rollCount = 0;

  // Fire first hit immediately
  play(vizIndex, event, mx, my);
  rollCount++;

  // Accelerating roll — starts at 16th notes, tightens to 32nds
  function scheduleNext() {
    // Accelerate: starts ~140ms, tightens toward ~50ms
    const interval = Math.max(50, 140 - rollCount * 12);
    // Volume decays slightly on repeats for natural roll feel
    rollInterval = setTimeout(() => {
      if (muted) { stopRoll(); return; }
      play(vizIndex, event, mx, my);
      rollCount++;
      if (rollCount < 32) scheduleNext(); // cap at 32 hits
    }, interval);
  }

  scheduleNext();
}

function stopRoll() {
  if (rollInterval !== null) {
    clearTimeout(rollInterval);
    rollInterval = null;
  }
  rollCount = 0;
}

export const SoundEngine = { init, play, trigger, setVizIndex, setMute, isMuted, startRoll, stopRoll };
