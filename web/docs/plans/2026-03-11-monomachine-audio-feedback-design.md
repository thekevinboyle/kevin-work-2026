# Monomachine Audio Feedback — Design Document

## Overview

Add Elektron Monomachine-inspired audio feedback to every interaction on the right side of the site. Each of the 20 visualizations gets its own synthesized sound palette. All audio is generated in real-time via Web Audio API — no audio files.

## Decisions

- **Interactions with sound**: All — mouse threshold crossings on visualizations, button clicks, button hovers, project image hover, project link clicks
- **Per-visualization palettes**: Yes, all 20 get unique sound sets matched to their visual theme
- **Mouse movement**: Threshold-triggered hits only (entering cells, nodes, zones), not continuous drone
- **Mute toggle**: Speaker icon next to the viz cycle button, top-right
- **Volume character**: Present but restrained — clearly audible, not jarring
- **Sounds on by default**: Yes, mute preference persisted to localStorage

## Architecture

### SoundEngine (`src/sound.js`)

Single module managing all audio. Lazy AudioContext creation on first user interaction (browser autoplay policy).

```
SoundEngine.init()                    // create AudioContext on first interaction
SoundEngine.play(vizIndex, event)     // fire a sound for a specific viz + event type
SoundEngine.setMute(bool)             // toggle mute (sets master gain to 0)
SoundEngine.isMuted()                 // check state
```

**Master signal chain:**
```
[OscillatorNode(s)] → [GainNode envelope] → [BiquadFilterNode] → [masterGain] → destination
```

**Polyphony**: Max 4 simultaneous sounds. New sounds force-decay the oldest when at limit. Self-cleanup via `oscillator.onended`.

**Retrigger guard**: 80ms minimum between threshold-triggered sounds per visualization to prevent machine-gun firing.

### State Management

- `audioMuted` state in App component
- Persisted to `localStorage('audio-muted')`
- Read on mount, written on toggle
- AudioContext still initializes when muted — master gain at 0, ready for instant unmute

## Synthesis Techniques

Four Monomachine-inspired synthesis methods, mixed per visualization:

### SID Blip
Square/pulse oscillator through highpass filter (600Hz, Q=2). Instant attack, 40-80ms exponential decay. The C64 digital bleep character.

```javascript
osc.type = 'square'
osc.frequency.value = 440-880
filter.type = 'highpass'
filter.frequency.value = 600
ampEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
```

### FM Tick
Sine carrier + sine modulator at high ratios (5:1 to 9:1). Modulation depth envelope decays faster than amplitude — timbre starts harmonically dense, thins rapidly. 50-120ms. The metallic Monomachine FM percussion.

```javascript
carrier.type = 'sine', carrier.frequency.value = 300
modulator.frequency.value = carrier.frequency * 7
modDepth.gain.setValueAtTime(carrierFreq * 8, t)
modDepth.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.6)
ampEnv.gain.exponentialRampToValueAtTime(0.001, t + duration)
```

### FM Bass Thud
Sine carrier with pitch sweep (180Hz to 45Hz over 80ms). Modulator at 1:1 ratio, index 3 decaying to 0 over 60ms. 100-200ms. The FM+ bass punch.

```javascript
carrier.frequency.setValueAtTime(180, t)
carrier.frequency.exponentialRampToValueAtTime(45, t + 0.08)
modDepth.gain.setValueAtTime(carrierFreq * 3, t)
modDepth.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
```

### Noise Burst
Pre-generated white noise buffer through bandpass filter (2-8kHz, Q varies per viz). 30-100ms. The SID noise waveform for textural hits.

```javascript
noiseSource → bandpassFilter(freq: 3000-8000, Q: 4-12) → ampEnv → master
```

## Event Types & Volume Hierarchy

| Event | Character | Duration | Gain |
|-------|-----------|----------|------|
| `mouseover` (threshold) | Lightest — tick or blip | 30-60ms | 40% |
| `hover-button` | Slightly richer — filtered tick | 50-80ms | 60% |
| `hover-image` | Textural — noise burst or FM sweep | 80-150ms | 60% |
| `click` | Most prominent — bass thud or layered hit | 100-200ms | 100% |

## 20 Visualization Palettes

### Data/Grid — SID-forward, digital and precise

| # | Visualization | Mouseover | Click | Character |
|---|--------------|-----------|-------|-----------|
| 1 | Reticle Tracker | SID blip, pitch maps to cursor X/Y | FM bass thud | Tracking lock-on |
| 2 | Version Control | SID pulse, varying width per file | FM thud | File system |
| 3 | Resolution Grid | SID blip, pitch by cell column | FM thud | Grid scanning |
| 4 | Exposure Checker | SID triangle, pitch by histogram step | FM thud | Metering |
| 5 | Aspect Ratio | SID square, fixed pitch per ratio | FM thud | Format switching |
| 6 | Layer Stack | SID pulse, pitch descends down layers | FM thud | Stack navigation |

### Signal/Wave — FM-forward, metallic and alive

| # | Visualization | Mouseover | Click | Character |
|---|--------------|-----------|-------|-----------|
| 7 | Signal Processing | FM tick, ratio matches Hz | FM bass thud | Frequency tuning |
| 8 | Audio Spectrum | FM tick, carrier tracks band | FM bass thud | Spectral |
| 9 | Motion Vectors | FM tick with pitch bend | FM bass thud | Directional |
| 10 | Color Channels | FM tick, 4 ratios for RGBA | FM bass thud | Channel separation |
| 11 | Timecode | FM tick, rhythmic per frame | FM bass thud | Temporal |

### Creative/Particle — hybrid, textural

| # | Visualization | Mouseover | Click | Character |
|---|--------------|-----------|-------|-----------|
| 12 | Particle Config | Noise burst, filter by position | FM bass + noise | Emission |
| 13 | Node Graph | FM bell (1:1.414 ratio) per node | FM bass thud | Connection |
| 14 | Transform Gizmo | FM sweep following rotation | FM bass thud | Spatial |
| 15 | Focus Plane | Noise burst, bandpass by f-stop | FM bass + noise | Optical |
| 16 | Measurement Tool | FM tick, pitch by distance | FM bass thud | Precision |

### System/Diagnostic — deeper, mechanical

| # | Visualization | Mouseover | Click | Character |
|---|--------------|-----------|-------|-----------|
| 17 | Registration Marks | FM bass thud on corner proximity | Layered thud | Calibration |
| 18 | AI Status Panel | SID + noise layered | FM bass + noise | Surveillance |
| 19 | System Diagnostics | SID noise burst, filtered static | FM bass thud | Machine |
| 20 | Render Pipeline | FM tick per stage, ascending pitch | FM bass thud | Pipeline flow |

## Mute Button

Positioned next to the viz cycle button in top-right. Same styling — ISO font, 10px, muted color.

```
[ speaker-icon ]  [ cycle-icon XX/20 ]
```

- Default: speaker icon at opacity 0.4
- Hover: opacity 1.0
- Muted state: crossed-out speaker icon
- Click toggles `audioMuted` state and persists to localStorage

## Integration Points

### visualizations.js

Each draw function already has mouse proximity/threshold checks. Add `SoundEngine.play(vizIndex, 'mouseover')` at threshold crossings. Add `lastTriggered` timestamp per viz — minimum 80ms between triggers.

### App.jsx

Wire into existing handlers:
- `CycleVizButton` onClick → `SoundEngine.play(vizIndex, 'click')`
- `CycleVizButton` onMouseEnter → `SoundEngine.play(vizIndex, 'hover-button')`
- `DisengageButton` onClick → `SoundEngine.play(vizIndex, 'click')`
- `DisengageButton` onMouseEnter → `SoundEngine.play(vizIndex, 'hover-button')`
- `DitherAsciiImage` onMouseEnter → `SoundEngine.play(vizIndex, 'hover-image')`
- Project link clicks → `SoundEngine.play(vizIndex, 'click')`

### New file

- `src/sound.js` — SoundEngine class, 4 synthesis functions, 20 palette definitions

## Performance

- Standard OscillatorNode/GainNode/BiquadFilterNode only — no AudioWorklet or ScriptProcessorNode
- Each sound is 4-6 nodes, lives 30-200ms, then garbage collected
- Creating/discarding 4-8 sounds per second is well within Web Audio budget
- Max 4 simultaneous voices prevents overlap buildup
