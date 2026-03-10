// 20 Technical HUD Micro-Design Visualizations
// Inspired by broadcast graphics, VFX overlays, military-style interfaces
// Each: (ctx, w, h, t, mx, my, state) => void

const PI2 = Math.PI * 2;
const { sin, cos, abs, floor, min, max, random, atan2, sqrt, pow } = Math;

// Shared drawing helpers
function setStyle(ctx, alpha = 0.7) {
  ctx.strokeStyle = `rgba(26,26,26,${alpha})`;
  ctx.fillStyle = `rgba(26,26,26,${alpha})`;
  ctx.lineWidth = 0.75;
}

function label(ctx, text, x, y, size = 8, alpha = 0.6) {
  ctx.font = `${size}px 'ISO', monospace`;
  ctx.fillStyle = `rgba(26,26,26,${alpha})`;
  ctx.fillText(text, x, y);
}

function cornerBrackets(ctx, x, y, w, h, size = 6, alpha = 0.5) {
  setStyle(ctx, alpha);
  ctx.beginPath(); ctx.moveTo(x, y + size); ctx.lineTo(x, y); ctx.lineTo(x + size, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w - size, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + size); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + h - size); ctx.lineTo(x, y + h); ctx.lineTo(x + size, y + h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w - size, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - size); ctx.stroke();
}

function dashedRect(ctx, x, y, w, h, alpha = 0.4) {
  ctx.setLineDash([3, 3]);
  setStyle(ctx, alpha);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
}

function crosshair(ctx, x, y, size = 10, alpha = 0.5) {
  setStyle(ctx, alpha);
  ctx.beginPath();
  ctx.moveTo(x - size, y); ctx.lineTo(x - 3, y);
  ctx.moveTo(x + 3, y); ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size); ctx.lineTo(x, y - 3);
  ctx.moveTo(x, y + 3); ctx.lineTo(x, y + size);
  ctx.stroke();
}

function tick(ctx, x, y, checked, text, alpha = 0.55) {
  label(ctx, `${checked ? '☑' : '☐'} ${text}`, x, y, 7, alpha);
}

// Smooth mouse tracking helper
function lerp(a, b, t) { return a + (b - a) * t; }

function trackMouse(state, mx, my, speed = 0.08) {
  if (state.smx === undefined) { state.smx = mx; state.smy = my; }
  state.smx = lerp(state.smx, mx, speed);
  state.smy = lerp(state.smy, my, speed);
  return { smx: state.smx, smy: state.smy };
}

// 1. CROSSHAIR RETICLE WITH TRACKING
function reticleTracker(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);
  const { smx, smy } = trackMouse(state, mx, my, 0.06);
  const cx = smx * w, cy = smy * h;

  // Lag trail
  if (!state.trail) state.trail = [];
  state.trail.push({ x: cx, y: cy });
  if (state.trail.length > 20) state.trail.shift();
  state.trail.forEach((p, i) => {
    setStyle(ctx, 0.02 + (i / state.trail.length) * 0.06);
    ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, PI2); ctx.fill();
  });

  // Main reticle
  crosshair(ctx, cx, cy, 30, 0.4);
  setStyle(ctx, 0.15);
  ctx.beginPath(); ctx.arc(cx, cy, 20, 0, PI2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 40, 0, PI2); ctx.stroke();

  // Rotating scan ring
  setStyle(ctx, 0.1);
  ctx.beginPath(); ctx.arc(cx, cy, 55, t % PI2, (t + 1.5) % PI2); ctx.stroke();

  // Distance lines to corners
  setStyle(ctx, 0.04);
  [[15, 15], [w - 15, 15], [15, h - 15], [w - 15, h - 15]].forEach(([px, py]) => {
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
  });

  // Tracking data
  label(ctx, `X ${floor(smx * 1920)}`, cx + 25, cy - 8, 7, 0.3);
  label(ctx, `Y ${floor(smy * 1080)}`, cx + 25, cy + 2, 7, 0.3);
  label(ctx, 'TRACKING', cx + 25, cy + 14, 6, 0.2);

  // Corner marks
  cornerBrackets(ctx, 15, 15, w - 30, h - 30, 12, 0.15);

  // Grid lines
  setStyle(ctx, 0.05);
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(w * i / 4, 0); ctx.lineTo(w * i / 4, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, h * i / 4); ctx.lineTo(w, h * i / 4); ctx.stroke();
  }

  label(ctx, 'DENOISED™', w - 70, h - 12, 7, 0.2);
  label(ctx, `${floor(t % 60).toString().padStart(2, '0')}:${floor((t * 24) % 24).toString().padStart(2, '0')}`, 15, h - 12, 7, 0.25);
}

// 2. VERSION CONTROL CHECKLIST
function versionControl(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);
  const x = w * 0.08, y = h * 0.15;

  label(ctx, 'VERSION CONTROL', x, y, 9, 0.4);
  label(ctx, 'REFS LOADED', x, y + 12, 7, 0.2);
  dashedRect(ctx, x - 4, y - 12, 120, 30);

  const checks = [
    'CHECK EXPOSURE', 'CHECK SKIN', 'CHECK ANATOMY',
    'CHECK PERSPECTIVE', 'CHECK FLICKER', 'CHECK BANDING',
  ];
  const fixes = ['FIX MOIRE', 'FIX HALO', 'FIX EDGES', 'FIX WARP'];
  const allItems = [...checks, null, ...fixes];

  allItems.forEach((c, i) => {
    if (c === null) return;
    const iy = y + 45 + i * 14;
    const isHover = my * h > iy - 10 && my * h < iy + 4 && mx < 0.5;
    const checked = i < checks.length ? sin(t * 0.5 + i) > 0 : sin(t * 0.3 + i * 2) > 0.3;

    if (isHover) {
      setStyle(ctx, 0.06);
      ctx.fillRect(x - 4, iy - 10, 160, 14);
    }
    tick(ctx, x, iy, checked, c, isHover ? 0.6 : 0.35);
  });

  // Mouse-tracked scan line
  const scanY = my * h;
  setStyle(ctx, 0.06);
  ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(w * 0.5, scanY); ctx.stroke();

  // Preview box follows mouse
  const previewX = w * 0.55, previewY = max(h * 0.2, min(h * 0.6, my * h - 30));
  cornerBrackets(ctx, previewX, previewY, w * 0.35, h * 0.2, 8, 0.2);
  label(ctx, 'IMAGE READY', previewX + 8, previewY + h * 0.1, 7, 0.25);
  label(ctx, 'VIDEO READY', previewX + 8, previewY + h * 0.1 + 12, 7, 0.25);

  // Bottom status
  label(ctx, `SD  ${(t * 0.1 % 1).toFixed(2)}`, x, h - 30, 7, 0.2);
  label(ctx, 'SYNC  ASSETS', x + 70, h - 30, 7, 0.2);
}

// 3. REGISTRATION MARKS
function registrationMarks(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);
  const { smx, smy } = trackMouse(state, mx, my, 0.05);

  // Offset registration — drifts with cursor
  const offsetX = (smx - 0.5) * 10;
  const offsetY = (smy - 0.5) * 10;

  // Center registration
  const cx = w / 2 + offsetX, cy = h / 2 + offsetY;
  setStyle(ctx, 0.3);
  ctx.beginPath(); ctx.arc(cx, cy, 15, 0, PI2); ctx.stroke();
  crosshair(ctx, cx, cy, 20, 0.3);
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, PI2); ctx.fill();

  // Second registration layer — opposite drift
  const cx2 = w / 2 - offsetX * 0.5, cy2 = h / 2 - offsetY * 0.5;
  setStyle(ctx, 0.08);
  ctx.beginPath(); ctx.arc(cx2, cy2, 15, 0, PI2); ctx.stroke();
  crosshair(ctx, cx2, cy2, 20, 0.06);

  // Corner registrations
  [[30, 30], [w - 30, 30], [30, h - 30], [w - 30, h - 30]].forEach(([x, y]) => {
    crosshair(ctx, x + offsetX * 0.3, y + offsetY * 0.3, 8, 0.2);
    setStyle(ctx, 0.15);
    ctx.beginPath(); ctx.arc(x + offsetX * 0.3, y + offsetY * 0.3, 5, 0, PI2); ctx.stroke();
  });

  // Measurement bars
  setStyle(ctx, 0.1);
  for (let i = 0; i < 20; i++) {
    const x = w * 0.15 + i * (w * 0.7 / 20);
    const barH = i % 5 === 0 ? 8 : 4;
    ctx.fillRect(x, 15, 1, barH);
    ctx.fillRect(x, h - 15 - barH, 1, barH);
  }

  // Labels
  label(ctx, `${floor(w)}×${floor(h)}`, cx - 20, cy + 30, 7, 0.2);
  label(ctx, `OFFSET  ${offsetX.toFixed(1)}, ${offsetY.toFixed(1)}`, cx - 30, 30, 7, 0.2);
  label(ctx, `FRAME ${floor(t * 24)}`, 15, 15, 7, 0.2);

  // Blinking dot
  if (sin(t * 3) > 0) {
    setStyle(ctx, 0.4);
    ctx.beginPath(); ctx.arc(w - 20, 18, 2.5, 0, PI2); ctx.fill();
  }
  label(ctx, 'REC', w - 42, 22, 7, 0.3);
}

// 4. SIGNAL PROCESSING
function signalProcessing(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);

  // Waveform monitor — mouse X controls frequency, mouse Y controls amplitude
  const wfY = h * 0.2, wfH = h * 0.25;
  dashedRect(ctx, w * 0.05, wfY, w * 0.4, wfH);
  label(ctx, 'WAVEFORM', w * 0.06, wfY - 4, 7, 0.25);

  setStyle(ctx, 0.2);
  ctx.beginPath();
  const freqMod = 0.03 + mx * 0.1;
  const ampMod = 0.2 + my * 0.6;
  for (let x = 0; x < w * 0.38; x++) {
    const px = w * 0.06 + x;
    const v = sin(x * freqMod + t * 3) * 0.3 + sin(x * 0.03 + t) * ampMod;
    const py = wfY + wfH * 0.5 + v * wfH * 0.4;
    x === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Cursor frequency line on waveform
  const cursorWfX = w * 0.06 + mx * w * 0.38;
  if (cursorWfX > w * 0.06 && cursorWfX < w * 0.44) {
    setStyle(ctx, 0.15);
    ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(cursorWfX, wfY); ctx.lineTo(cursorWfX, wfY + wfH); ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, `${floor(mx * 20000)}Hz`, cursorWfX + 3, wfY + 10, 6, 0.3);
  }

  // Vectorscope — dots cluster toward cursor
  const vsX = w * 0.6, vsY = h * 0.25, vsR = h * 0.1;
  setStyle(ctx, 0.1);
  ctx.beginPath(); ctx.arc(vsX, vsY, vsR, 0, PI2); ctx.stroke();
  ctx.beginPath(); ctx.arc(vsX, vsY, vsR * 0.6, 0, PI2); ctx.stroke();
  crosshair(ctx, vsX, vsY, vsR, 0.08);
  label(ctx, 'VECTORSCOPE', vsX - 25, vsY - vsR - 6, 7, 0.25);

  const pullX = (mx - 0.5) * vsR * 0.5;
  const pullY = (my - 0.5) * vsR * 0.5;
  for (let i = 0; i < 30; i++) {
    const a = t * 0.5 + i * 0.8;
    const r = vsR * 0.3 + sin(t + i) * vsR * 0.2;
    setStyle(ctx, 0.15 + random() * 0.1);
    ctx.fillRect(vsX + cos(a) * r + pullX, vsY + sin(a) * r + pullY, 1.5, 1.5);
  }

  // Status bar
  label(ctx, 'SUB. PRODUÇÃO', w * 0.05, h * 0.65, 8, 0.3);
  label(ctx, `FREQ ${freqMod.toFixed(3)}  AMP ${ampMod.toFixed(2)}`, w * 0.05, h * 0.65 + 14, 7, 0.2);

  label(ctx, `${(t * 0.98).toFixed(2)}LABS  SP`, w * 0.05, h - 20, 7, 0.2);
}

// 5. AI STATUS PANEL
function aiStatusPanel(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);
  const { smx, smy } = trackMouse(state, mx, my, 0.04);
  const cx = w / 2, cy = h * 0.4;

  // Eye icon — pupil tracks cursor
  setStyle(ctx, 0.3);
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy);
  ctx.quadraticCurveTo(cx, cy - 18, cx + 30, cy);
  ctx.quadraticCurveTo(cx, cy + 18, cx - 30, cy);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 7, 0, PI2); ctx.stroke();

  // Pupil follows mouse
  const pupilX = cx + (smx - 0.5) * 6;
  const pupilY = cy + (smy - 0.5) * 4;
  setStyle(ctx, 0.4);
  ctx.beginPath(); ctx.arc(pupilX, pupilY, 2.5, 0, PI2); ctx.fill();

  // Gaze line
  setStyle(ctx, 0.04);
  ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(pupilX, pupilY); ctx.lineTo(smx * w, smy * h); ctx.stroke();
  ctx.setLineDash([]);
  crosshair(ctx, smx * w, smy * h, 6, 0.1);

  label(ctx, 'AI', cx - 4, cy + 35, 8, 0.3);
  label(ctx, 'INVISIBLE', cx - 18, cy + 47, 8, 0.3);

  // Status list — highlight on hover
  const items = ['AI INVISIBLE ✓', 'DIRECTOR APPROVED ✓', 'AGENCY APPROVED ✓', 'QC PASSED ✓', 'COLOR LOCKED ✓', 'FINAL EXPORT'];
  items.forEach((item, i) => {
    const iy = h * 0.65 + i * 13;
    const isHover = smy * h > iy - 8 && smy * h < iy + 5 && smx < 0.6;
    const blink = i === items.length - 1 && sin(t * 4) > 0;
    if (isHover) {
      setStyle(ctx, 0.04);
      ctx.fillRect(w * 0.08, iy - 8, w * 0.5, 13);
    }
    label(ctx, item, w * 0.1, iy, 7, isHover ? 0.6 : blink ? 0.5 : 0.3);
  });

  cornerBrackets(ctx, w * 0.06, h * 0.6, w * 0.5, items.length * 13 + 10, 6, 0.15);

  label(ctx, 'NO BUG', cx - 10, h - 25, 7, 0.2);
  dashedRect(ctx, cx - 20, h - 33, 45, 14);
}

// 6. RESOLUTION GRID
function resolutionGrid(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);

  const gridSize = 30;
  setStyle(ctx, 0.05);
  for (let x = gridSize; x < w; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = gridSize; y < h; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Mouse cell highlight with neighbors
  const cellX = floor(mx * w / gridSize) * gridSize;
  const cellY = floor(my * h / gridSize) * gridSize;

  // Highlight surrounding cells with falloff
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const dist = sqrt(dx * dx + dy * dy);
      if (dist > 2.2) continue;
      const alpha = max(0, 0.4 - dist * 0.1);
      const nx = cellX + dx * gridSize, ny = cellY + dy * gridSize;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      setStyle(ctx, alpha);
      ctx.fillRect(nx, ny, gridSize, gridSize);
    }
  }

  dashedRect(ctx, cellX, cellY, gridSize, gridSize, 0.35);

  // Cross lines through cursor cell
  setStyle(ctx, 0.08);
  ctx.beginPath(); ctx.moveTo(cellX + gridSize / 2, 0); ctx.lineTo(cellX + gridSize / 2, h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, cellY + gridSize / 2); ctx.lineTo(w, cellY + gridSize / 2); ctx.stroke();

  // Coordinate labels along edges
  for (let i = 0; i < w / gridSize; i++) {
    label(ctx, `${i}`, i * gridSize + 2, 10, 6, 0.15);
  }
  for (let i = 1; i < h / gridSize; i++) {
    label(ctx, `${i}`, 2, i * gridSize + 8, 6, 0.15);
  }

  label(ctx, `GRID ${gridSize}px`, w / 2 - 18, h / 2 - 5, 7, 0.2);
  label(ctx, `[${floor(mx * w)}, ${floor(my * h)}]`, w / 2 - 20, h / 2 + 8, 7, 0.25);
  crosshair(ctx, mx * w, my * h, 12, 0.15);

  cornerBrackets(ctx, 8, 8, w - 16, h - 16, 10, 0.15);
  label(ctx, '@STUDIO', w - 55, h - 12, 7, 0.2);
}

// 7. RENDER PIPELINE
function renderPipeline(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);

  const stages = ['GEOMETRY', 'LIGHTING', 'SHADOWS', 'TEXTURES', 'POST-FX', 'COMPOSITE', 'OUTPUT'];
  const stageW = 70, stageH = 16;
  const startX = w * 0.1, startY = h * 0.1;

  stages.forEach((stage, i) => {
    const x = startX + (i % 3) * (stageW + 20);
    const y = startY + floor(i / 3) * 50;
    const progress = (sin(t * 0.8 + i * 0.5) + 1) / 2;
    const active = progress > 0.5;

    // Hover detection
    const hover = mx * w > x && mx * w < x + stageW && my * h > y && my * h < y + stageH + 5;

    if (hover) {
      setStyle(ctx, 0.08);
      ctx.fillRect(x - 2, y - 2, stageW + 4, stageH + 8);
      cornerBrackets(ctx, x - 4, y - 4, stageW + 8, stageH + 12, 5, 0.3);
    }

    dashedRect(ctx, x, y, stageW, stageH, hover ? 0.4 : active ? 0.3 : 0.1);
    label(ctx, stage, x + 3, y + 11, 6, hover ? 0.6 : active ? 0.4 : 0.15);

    // Progress bar
    setStyle(ctx, hover ? 0.3 : 0.15);
    ctx.fillRect(x, y + stageH + 2, stageW * progress, 2);

    // Hover detail
    if (hover) {
      label(ctx, `${floor(progress * 100)}%`, x + stageW + 4, y + 11, 6, 0.3);
    }

    // Connection line to next
    if (i < stages.length - 1) {
      const nx = startX + ((i + 1) % 3) * (stageW + 20);
      const ny = startY + floor((i + 1) / 3) * 50;
      setStyle(ctx, hover ? 0.2 : 0.08);
      ctx.beginPath();
      ctx.moveTo(x + stageW, y + stageH / 2);
      if (floor((i + 1) / 3) === floor(i / 3)) {
        ctx.lineTo(nx, ny + stageH / 2);
      } else {
        ctx.lineTo(x + stageW + 10, y + stageH / 2);
        ctx.lineTo(x + stageW + 10, ny + stageH / 2);
        ctx.lineTo(nx, ny + stageH / 2);
      }
      ctx.stroke();
    }
  });

  label(ctx, 'RENDER PIPELINE', startX, h * 0.75, 9, 0.3);
  label(ctx, `FRAME ${floor(t * 24)} / ∞`, startX, h * 0.75 + 14, 7, 0.2);
  label(ctx, `${floor(1000 / 16.6)}fps`, w - 40, h - 12, 7, 0.2);
}

// 8. EXPOSURE CHECKER
function exposureChecker(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);

  // Gray ramp — cursor highlights zone
  const rampY = h * 0.15, rampH = 20;
  const steps = 11;
  const activeStep = floor(mx * steps);
  for (let i = 0; i < steps; i++) {
    const x = w * 0.1 + (i / steps) * w * 0.6;
    const stepW = (w * 0.6) / steps;
    const gray = floor((i / (steps - 1)) * 255);
    const isActive = i === activeStep;
    ctx.fillStyle = `rgba(${gray},${gray},${gray},${isActive ? 0.7 : 0.5})`;
    ctx.fillRect(x, rampY, stepW - 1, rampH);
    if (isActive) {
      cornerBrackets(ctx, x - 1, rampY - 1, stepW, rampH + 2, 4, 0.4);
      label(ctx, `${gray}`, x + 2, rampY + rampH + 12, 7, 0.3);
    }
  }
  label(ctx, 'EXPOSURE', w * 0.1, rampY - 5, 7, 0.25);

  // Histogram — shape modulated by cursor Y
  const histY = h * 0.4, histH = h * 0.2;
  dashedRect(ctx, w * 0.1, histY, w * 0.6, histH);
  label(ctx, 'HISTOGRAM', w * 0.1, histY - 5, 7, 0.25);

  // Cursor line on histogram
  const histCursorX = w * 0.1 + mx * w * 0.6;
  setStyle(ctx, 0.12);
  ctx.setLineDash([2, 2]);
  ctx.beginPath(); ctx.moveTo(histCursorX, histY); ctx.lineTo(histCursorX, histY + histH); ctx.stroke();
  ctx.setLineDash([]);

  setStyle(ctx, 0.15);
  ctx.beginPath();
  for (let i = 0; i < 50; i++) {
    const x = w * 0.1 + (i / 50) * w * 0.6;
    const bias = 1 - abs(i / 50 - mx) * 2;
    const v = (sin(i * 0.3 + t) * 0.3 + sin(i * 0.1) * 0.5 + 0.5 + max(0, bias) * my * 0.5) * histH;
    ctx.moveTo(x, histY + histH);
    ctx.lineTo(x, histY + histH - min(histH, v));
  }
  ctx.stroke();

  // Zone system — highlight zone under cursor
  label(ctx, 'ZONE SYSTEM', w * 0.1, h * 0.72, 7, 0.25);
  const activeZone = floor(mx * 10);
  for (let i = 0; i < 10; i++) {
    const x = w * 0.1 + i * 22;
    const isActive = i === activeZone;
    dashedRect(ctx, x, h * 0.75, 18, 18, isActive ? 0.3 : 0.1);
    label(ctx, `${i}`, x + 6, h * 0.75 + 13, 7, isActive ? 0.45 : 0.2);
    if (isActive) {
      setStyle(ctx, 0.15);
      ctx.fillRect(x + 1, h * 0.75 + 1, 16, 16);
    }
  }
}

// 9. FOCUS PLANE
function focusPlane(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);
  const { smx, smy } = trackMouse(state, mx, my, 0.06);
  const cx = smx * w, cy = smy * h;

  // Concentric focus rings
  for (let i = 1; i <= 6; i++) {
    const r = i * 25;
    setStyle(ctx, 0.05 + (i === 3 ? 0.15 : 0));
    ctx.setLineDash(i === 3 ? [] : [2, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, PI2); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Focus sharpness indicator — simulated blur lines radiating outward
  for (let a = 0; a < PI2; a += PI2 / 12) {
    const innerR = 75 + sin(a * 3 + t) * 5;
    const outerR = innerR + 20 + sin(a * 5 + t * 2) * 10;
    setStyle(ctx, 0.06);
    ctx.beginPath();
    ctx.moveTo(cx + cos(a) * innerR, cy + sin(a) * innerR);
    ctx.lineTo(cx + cos(a) * outerR, cy + sin(a) * outerR);
    ctx.stroke();
  }

  // Focus indicator
  label(ctx, 'FOCUS PLANE', cx + 20, cy - 50, 7, 0.3);
  label(ctx, `f/${(2.8 + smx * 16).toFixed(1)}`, cx + 20, cy - 38, 8, 0.35);
  label(ctx, `${floor(0.5 + smy * 10)}m`, cx + 20, cy - 26, 7, 0.2);

  // DOF bars
  const dofW = w * 0.6;
  const dofX = w * 0.2, dofY = h - 40;
  setStyle(ctx, 0.1);
  ctx.fillRect(dofX, dofY, dofW, 3);
  const sharpStart = dofX + dofW * max(0, smx - 0.15);
  const sharpEnd = dofX + dofW * min(1, smx + 0.15);
  setStyle(ctx, 0.3);
  ctx.fillRect(sharpStart, dofY - 1, sharpEnd - sharpStart, 5);

  // DOF cursor indicator
  const dofCursorX = dofX + dofW * smx;
  setStyle(ctx, 0.4);
  ctx.beginPath(); ctx.moveTo(dofCursorX, dofY - 5); ctx.lineTo(dofCursorX - 3, dofY - 10); ctx.lineTo(dofCursorX + 3, dofY - 10); ctx.fill();

  label(ctx, 'NEAR', dofX - 5, dofY + 15, 6, 0.2);
  label(ctx, 'FAR', dofX + dofW - 10, dofY + 15, 6, 0.2);
  label(ctx, 'DEPTH OF FIELD', dofX, dofY - 15, 7, 0.25);

  cornerBrackets(ctx, cx - 35, cy - 35, 70, 70, 8, 0.2);
}

// 10. TIMECODE DISPLAY
function timecodeDisplay(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;

  const hrs = floor(t / 3600) % 24;
  const mins = floor(t / 60) % 60;
  const secs = floor(t) % 60;
  const frames = floor((t * 24) % 24);
  const tc = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;

  label(ctx, tc, cx - 45, cy, 14, 0.45);
  dashedRect(ctx, cx - 55, cy - 18, 110, 28);

  label(ctx, '24fps / 1920×1080 / REC.709', cx - 60, cy + 25, 6, 0.2);
  label(ctx, 'DROP FRAME', cx - 22, cy - 25, 7, 0.2);

  // Film strip — scrub with mouse X
  const stripY = h * 0.2;
  const scrubFrame = floor(mx * 12);
  for (let i = 0; i < 12; i++) {
    const x = w * 0.08 + i * (w * 0.07);
    const active = i === scrubFrame;
    dashedRect(ctx, x, stripY, w * 0.06, 30, active ? 0.35 : 0.08);
    label(ctx, `${i + 1}`, x + 8, stripY + 19, 6, active ? 0.45 : 0.12);
    if (active) {
      cornerBrackets(ctx, x - 2, stripY - 2, w * 0.06 + 4, 34, 4, 0.3);
    }
  }

  // Bottom timeline — playhead follows mouse X
  setStyle(ctx, 0.1);
  ctx.beginPath(); ctx.moveTo(w * 0.05, h - 50); ctx.lineTo(w * 0.95, h - 50); ctx.stroke();
  const playhead = w * 0.05 + mx * w * 0.9;
  setStyle(ctx, 0.35);
  ctx.beginPath(); ctx.moveTo(playhead, h - 58); ctx.lineTo(playhead, h - 42); ctx.stroke();
  // Playhead triangle
  ctx.beginPath(); ctx.moveTo(playhead - 4, h - 58); ctx.lineTo(playhead + 4, h - 58); ctx.lineTo(playhead, h - 53); ctx.fill();
  label(ctx, `${floor(mx * 100)}%`, playhead - 8, h - 35, 6, 0.25);
  label(ctx, '▶ PLAY', w * 0.05, h - 35, 7, 0.2);

  // In/out markers
  setStyle(ctx, 0.15);
  const inX = w * 0.05 + w * 0.9 * 0.2;
  const outX = w * 0.05 + w * 0.9 * 0.8;
  ctx.beginPath(); ctx.moveTo(inX, h - 55); ctx.lineTo(inX, h - 45); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(outX, h - 55); ctx.lineTo(outX, h - 45); ctx.stroke();
  label(ctx, 'IN', inX - 3, h - 60, 5, 0.15);
  label(ctx, 'OUT', outX - 5, h - 60, 5, 0.15);
}

// 11. MOTION VECTORS
function motionVectors(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);
  const { smx, smy } = trackMouse(state, mx, my, 0.05);
  const spacing = 25;

  // Store previous position for velocity
  if (state.pmx === undefined) { state.pmx = smx; state.pmy = smy; }
  const velX = (smx - state.pmx) * 50;
  const velY = (smy - state.pmy) * 50;
  state.pmx = smx;
  state.pmy = smy;

  for (let y = spacing; y < h; y += spacing) {
    for (let x = spacing; x < w; x += spacing) {
      const nx = x / w, ny = y / h;
      const dx = smx - nx, dy = smy - ny;
      const dist = sqrt(dx * dx + dy * dy) + 0.01;
      const angle = atan2(dy, dx);

      // Vectors influenced by both proximity and velocity
      const proxLen = min(12, 3 / dist);
      const velInfluence = max(0, 1 - dist * 3);
      const finalAngle = angle + velInfluence * atan2(velY, velX + 0.001) * 0.5;
      const len = proxLen + velInfluence * sqrt(velX * velX + velY * velY) * 2;

      const ex = x + cos(finalAngle) * min(15, len);
      const ey = y + sin(finalAngle) * min(15, len);

      setStyle(ctx, 0.08 + min(0.25, len * 0.02));
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 0.8, 0, PI2); ctx.fill();
    }
  }

  // Cursor marker
  crosshair(ctx, smx * w, smy * h, 8, 0.2);

  label(ctx, 'MOTION VECTORS', 10, 15, 8, 0.3);
  label(ctx, `VEL ${sqrt(velX * velX + velY * velY).toFixed(1)}`, 10, 28, 7, 0.2);
  label(ctx, `DIR ${(atan2(velY, velX) * 180 / Math.PI).toFixed(0)}°`, 10, 40, 7, 0.2);
  cornerBrackets(ctx, 5, 5, w - 10, h - 10, 8, 0.1);
}

// 12. COLOR CHANNELS
function colorChannels(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);
  const channels = ['R', 'G', 'B', 'A'];
  const channelH = h * 0.18;

  // Vertical sample line
  const sampleX = w * 0.13 + mx * w * 0.74;
  setStyle(ctx, 0.1);
  ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(sampleX, h * 0.05); ctx.lineTo(sampleX, h * 0.95); ctx.stroke();
  ctx.setLineDash([]);

  channels.forEach((ch, ci) => {
    const y = h * 0.08 + ci * (channelH + 8);
    const isHoverChannel = my > (y / h) && my < ((y + channelH) / h);
    dashedRect(ctx, w * 0.12, y, w * 0.76, channelH, isHoverChannel ? 0.15 : 0.08);
    label(ctx, ch, w * 0.05, y + channelH / 2 + 3, 8, isHoverChannel ? 0.5 : 0.3);

    // Waveform
    ctx.beginPath();
    setStyle(ctx, isHoverChannel ? 0.3 : 0.2);
    let sampleVal = 0;
    for (let x = 0; x < w * 0.74; x++) {
      const px = w * 0.13 + x;
      const v = sin(x * 0.05 + t * (1 + ci * 0.5) + ci * 2) * 0.3
        + sin(x * 0.02 + t * 0.5) * 0.4 + 0.5;
      const py = y + channelH * (1 - v);
      x === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      // Capture value at cursor
      if (abs(px - sampleX) < 1) sampleVal = v;
    }
    ctx.stroke();

    // Sample point on waveform
    const samplePy = y + channelH * (1 - sampleVal);
    setStyle(ctx, 0.4);
    ctx.beginPath(); ctx.arc(sampleX, samplePy, 2.5, 0, PI2); ctx.fill();

    // Level marker
    const level = floor(sampleVal * 255);
    label(ctx, `${level}`, w * 0.9, y + channelH / 2 + 3, 7, 0.3);

    // Readout line from sample point
    setStyle(ctx, 0.08);
    ctx.beginPath(); ctx.moveTo(sampleX, samplePy); ctx.lineTo(w * 0.89, y + channelH / 2); ctx.stroke();
  });

  label(ctx, `SAMPLE @ ${floor(mx * 1920)}px`, w * 0.13, h * 0.03, 7, 0.25);
}

// 13. ASPECT RATIO OVERLAY
function aspectRatio(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);

  const ratios = [
    { name: '2.39:1', r: 2.39 },
    { name: '16:9', r: 16 / 9 },
    { name: '4:3', r: 4 / 3 },
    { name: '1:1', r: 1 },
  ];

  // Mouse Y selects active ratio
  const active = min(ratios.length - 1, floor(my * ratios.length));

  ratios.forEach((ratio, i) => {
    const rW = min(w * 0.85, (h * 0.7) * ratio.r);
    const rH = rW / ratio.r;
    const rx = (w - rW) / 2;
    const ry = (h - rH) / 2;
    const isActive = i === active;

    if (isActive) {
      dashedRect(ctx, rx, ry, rW, rH, 0.25);
      cornerBrackets(ctx, rx, ry, rW, rH, 8, 0.3);

      // Dimension labels
      label(ctx, `${floor(rW)}`, rx + rW / 2 - 10, ry - 5, 6, 0.2);
      label(ctx, `${floor(rH)}`, rx + rW + 5, ry + rH / 2, 6, 0.2);

      // Center mark
      crosshair(ctx, w / 2, h / 2, 10, 0.12);
    } else {
      setStyle(ctx, 0.06);
      ctx.strokeRect(rx, ry, rW, rH);
    }

    label(ctx, ratio.name, rx + 4, ry - 3, 6, isActive ? 0.45 : 0.1);
  });

  // Ratio selector on right side
  ratios.forEach((ratio, i) => {
    const sy = h * 0.3 + i * 20;
    const isActive = i === active;
    label(ctx, `${isActive ? '▸ ' : '  '}${ratio.name}`, w - 60, sy, 7, isActive ? 0.45 : 0.15);
  });

  // Safe areas for active ratio
  const ar = ratios[active];
  const arW = min(w * 0.85, (h * 0.7) * ar.r);
  const arH = arW / ar.r;
  const safeW = arW * 0.9, safeH = arH * 0.9;
  setStyle(ctx, 0.04);
  ctx.setLineDash([1, 3]);
  ctx.strokeRect((w - safeW) / 2, (h - safeH) / 2, safeW, safeH);
  ctx.setLineDash([]);
  label(ctx, 'TITLE SAFE', (w - safeW) / 2 + 3, (h - safeH) / 2 - 3, 6, 0.12);

  label(ctx, 'ASPECT RATIO', 10, h - 12, 7, 0.25);
}

// 14. NODE GRAPH
function nodeGraph(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);

  const nodes = [
    { x: 0.15, y: 0.3, label: 'INPUT' },
    { x: 0.15, y: 0.6, label: 'NOISE' },
    { x: 0.4, y: 0.35, label: 'MERGE' },
    { x: 0.4, y: 0.65, label: 'BLUR' },
    { x: 0.65, y: 0.4, label: 'COLOR' },
    { x: 0.65, y: 0.7, label: 'GRADE' },
    { x: 0.85, y: 0.5, label: 'OUT' },
  ];

  const connections = [[0, 2], [1, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6]];

  // Find hovered node
  let hoveredNode = -1;
  nodes.forEach((n, i) => {
    const dist = sqrt((mx - n.x) ** 2 + (my - n.y) ** 2);
    if (dist < 0.06) hoveredNode = i;
  });

  // Find connected nodes
  const connectedNodes = new Set();
  const connectedEdges = new Set();
  if (hoveredNode >= 0) {
    connections.forEach(([a, b], ei) => {
      if (a === hoveredNode || b === hoveredNode) {
        connectedNodes.add(a);
        connectedNodes.add(b);
        connectedEdges.add(ei);
      }
    });
  }

  // Draw connections
  connections.forEach(([a, b], ei) => {
    const na = nodes[a], nb = nodes[b];
    const highlighted = connectedEdges.has(ei);
    setStyle(ctx, highlighted ? 0.3 : 0.12);
    ctx.lineWidth = highlighted ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(na.x * w, na.y * h);
    ctx.lineTo(nb.x * w, nb.y * h);
    ctx.stroke();
    ctx.lineWidth = 0.75;

    // Data pulse
    const pulse = (t * 0.5 + a * 0.3) % 1;
    const px = na.x * w + (nb.x * w - na.x * w) * pulse;
    const py = na.y * h + (nb.y * h - na.y * h) * pulse;
    setStyle(ctx, highlighted ? 0.5 : 0.3);
    ctx.beginPath(); ctx.arc(px, py, highlighted ? 3 : 2, 0, PI2); ctx.fill();
  });

  // Draw nodes
  nodes.forEach((n, i) => {
    const nx = n.x * w, ny = n.y * h;
    const hover = i === hoveredNode;
    const connected = connectedNodes.has(i);

    if (hover) {
      setStyle(ctx, 0.08);
      ctx.fillRect(nx - 26, ny - 12, 52, 24);
    }

    dashedRect(ctx, nx - 22, ny - 8, 44, 16, hover ? 0.5 : connected ? 0.3 : 0.15);
    label(ctx, n.label, nx - 18, ny + 4, 6, hover ? 0.6 : connected ? 0.4 : 0.25);

    // Hover detail
    if (hover) {
      label(ctx, `NODE ${i}`, nx - 18, ny + 18, 5, 0.3);
      label(ctx, 'ACTIVE', nx - 18, ny + 26, 5, 0.2);
    }
  });

  label(ctx, 'NODE GRAPH', 10, 15, 8, 0.3);
  if (hoveredNode >= 0) {
    label(ctx, `SELECTED: ${nodes[hoveredNode].label}`, 10, 28, 7, 0.25);
  }
}

// 15. SYSTEM DIAGNOSTICS
function systemDiagnostics(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);
  const x = w * 0.06;

  label(ctx, 'SYSTEM DIAGNOSTICS', x, 20, 9, 0.4);
  setStyle(ctx, 0.1); ctx.beginPath(); ctx.moveTo(x, 26); ctx.lineTo(w * 0.5, 26); ctx.stroke();

  const metrics = [
    ['CPU', (sin(t * 0.7) * 30 + 50)],
    ['GPU', (sin(t * 0.5 + 1) * 25 + 60)],
    ['MEM', (sin(t * 0.3 + 2) * 10 + 70)],
    ['VRAM', (sin(t * 0.4 + 3) * 15 + 55)],
    ['DISK I/O', (random() * 200)],
    ['TEMP', (sin(t * 0.2) * 10 + 65)],
  ];

  const units = ['%', '%', '%', '%', ' MB/s', '°C'];

  metrics.forEach(([name, rawVal], i) => {
    const y = 45 + i * 22;
    const isHover = my * h > y - 12 && my * h < y + 10;

    // Hover highlight
    if (isHover) {
      setStyle(ctx, 0.04);
      ctx.fillRect(x - 2, y - 11, w * 0.8, 20);
    }

    label(ctx, name, x, y, 7, isHover ? 0.45 : 0.25);
    label(ctx, `${rawVal.toFixed(name === 'DISK I/O' ? 0 : 0)}${units[i]}`, x + 55, y, 7, isHover ? 0.5 : 0.35);

    // Bar — fills with cursor interaction when hovered
    const barVal = name === 'DISK I/O' ? rawVal / 200 : name === 'TEMP' ? rawVal / 100 : rawVal / 100;
    const barWidth = 80;
    setStyle(ctx, 0.08);
    ctx.fillRect(x + 110, y - 7, barWidth, 6);
    setStyle(ctx, isHover ? 0.35 : 0.2);
    ctx.fillRect(x + 110, y - 7, barWidth * min(1, barVal), 6);

    // Cursor position indicator on hovered bar
    if (isHover) {
      const cursorPos = mx * barWidth;
      setStyle(ctx, 0.4);
      ctx.beginPath(); ctx.moveTo(x + 110 + cursorPos, y - 10); ctx.lineTo(x + 110 + cursorPos, y + 2); ctx.stroke();
      label(ctx, `${floor(mx * 100)}%`, x + 110 + cursorPos + 3, y - 1, 5, 0.3);
    }
  });

  // Uptime
  label(ctx, `UPTIME ${floor(t / 3600)}h ${floor(t / 60) % 60}m`, x, h - 30, 7, 0.2);
  label(ctx, `PID ${floor(t * 100 % 9000 + 1000)}`, x, h - 16, 7, 0.15);

  // Blinking status
  if (sin(t * 2) > 0) {
    setStyle(ctx, 0.3);
    ctx.beginPath(); ctx.arc(w - 20, 18, 2, 0, PI2); ctx.fill();
  }
  label(ctx, 'ONLINE', w - 50, 22, 7, 0.25);
}

// 16. TRANSFORM GIZMO
function transformGizmo(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);
  const { smx, smy } = trackMouse(state, mx, my, 0.08);
  const cx = w / 2 + (smx - 0.5) * 80, cy = h / 2 + (smy - 0.5) * 80;

  // Rotation ring
  setStyle(ctx, 0.15);
  ctx.beginPath(); ctx.arc(cx, cy, 50, 0, PI2); ctx.stroke();

  // Rotation angle from cursor position relative to center
  const rotAngle = atan2(smy - 0.5, smx - 0.5);

  // Rotation arc indicator
  setStyle(ctx, 0.12);
  ctx.beginPath(); ctx.arc(cx, cy, 50, 0, rotAngle); ctx.stroke();

  // Rotation indicator tick
  setStyle(ctx, 0.35);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + cos(rotAngle) * 45, cy + sin(rotAngle) * 45);
  ctx.lineTo(cx + cos(rotAngle) * 58, cy + sin(rotAngle) * 58);
  ctx.stroke();
  ctx.lineWidth = 0.75;

  // Degree marks around ring
  for (let a = 0; a < PI2; a += PI2 / 36) {
    const inner = 46, outer = 50;
    setStyle(ctx, a % (PI2 / 4) < 0.01 ? 0.2 : 0.06);
    ctx.beginPath();
    ctx.moveTo(cx + cos(a) * inner, cy + sin(a) * inner);
    ctx.lineTo(cx + cos(a) * outer, cy + sin(a) * outer);
    ctx.stroke();
  }

  // Axes
  setStyle(ctx, 0.25);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 60, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 55, cy - 3); ctx.lineTo(cx + 60, cy); ctx.lineTo(cx + 55, cy + 3); ctx.fill();
  label(ctx, 'X', cx + 63, cy + 3, 7, 0.3);

  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 60); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 3, cy - 55); ctx.lineTo(cx, cy - 60); ctx.lineTo(cx + 3, cy - 55); ctx.fill();
  label(ctx, 'Y', cx + 4, cy - 60, 7, 0.3);

  // Scale handles at axis ends — grow when cursor is near
  const distToX = sqrt((smx * w - (cx + 60)) ** 2 + (smy * h - cy) ** 2);
  const distToY = sqrt((smx * w - cx) ** 2 + (smy * h - (cy - 60)) ** 2);
  setStyle(ctx, distToX < 20 ? 0.5 : 0.3);
  ctx.fillRect(cx + 57, cy - 3, 6, 6);
  setStyle(ctx, distToY < 20 ? 0.5 : 0.3);
  ctx.fillRect(cx - 3, cy - 63, 6, 6);

  // Center
  setStyle(ctx, 0.3);
  ctx.fillRect(cx - 2, cy - 2, 4, 4);

  // Transform values
  label(ctx, `POS  ${floor(cx)}, ${floor(cy)}`, 10, h - 35, 7, 0.25);
  label(ctx, `ROT  ${(rotAngle * 180 / Math.PI).toFixed(1)}°`, 10, h - 22, 7, 0.25);
  label(ctx, `SCL  ${(1 + (smx - 0.5) * 0.5).toFixed(3)}`, 10, h - 9, 7, 0.25);

  cornerBrackets(ctx, cx - 35, cy - 35, 70, 70, 6, 0.12);
}

// 17. PARTICLE EMITTER CONFIG
function particleConfig(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);
  const { smx, smy } = trackMouse(state, mx, my, 0.06);
  const ex = smx * w * 0.7 + w * 0.15, ey = smy * h * 0.5 + h * 0.1;

  // Emitter source
  setStyle(ctx, 0.3);
  ctx.beginPath(); ctx.arc(ex, ey, 4, 0, PI2); ctx.fill();
  crosshair(ctx, ex, ey, 12, 0.2);

  // Emitter boundary circle
  setStyle(ctx, 0.06);
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.arc(ex, ey, 60, 0, PI2); ctx.stroke();
  ctx.setLineDash([]);

  // Particles — emit from cursor-tracked position
  for (let i = 0; i < 50; i++) {
    const age = (t * 2 + i * 0.25) % 3;
    const angle = (i / 50) * PI2 + sin(t + i) * 0.3;
    const speed = 15 + sin(i * 1.5) * 8;
    const px = ex + cos(angle) * age * speed;
    const py = ey + sin(angle) * age * speed + age * age * 3;
    const alpha = max(0, 0.5 - age * 0.15);
    const size = max(0.5, 2 - age * 0.6);

    setStyle(ctx, alpha);
    ctx.fillRect(px - size / 2, py - size / 2, size, size);
  }

  // Config panel
  const panelX = w * 0.05, panelY = h * 0.65;
  label(ctx, 'EMITTER CONFIG', panelX, panelY, 8, 0.3);

  const params = [
    ['RATE', `${floor(60 + mx * 120)}/s`],
    ['LIFE', `${(1 + my * 4).toFixed(1)}s`],
    ['SPREAD', `${floor(smx * 360)}°`],
    ['GRAVITY', `${(smy * 2).toFixed(2)}`],
    ['SIZE', `${(1 + mx).toFixed(1)}→${max(0.1, 1 - my).toFixed(1)}`],
    ['DRAG', `${(mx * 0.1).toFixed(3)}`],
  ];

  params.forEach(([name, val], i) => {
    const py = panelY + 15 + i * 12;
    const isHover = my * h > py - 8 && my * h < py + 4 && mx < 0.45;
    label(ctx, `${name}`, panelX, py, 6, isHover ? 0.4 : 0.2);
    label(ctx, val, panelX + 55, py, 6, isHover ? 0.5 : 0.3);

    // Mini slider for hovered param
    if (isHover) {
      setStyle(ctx, 0.1);
      ctx.fillRect(panelX + 100, py - 5, 50, 3);
      setStyle(ctx, 0.3);
      ctx.fillRect(panelX + 100, py - 5, 50 * mx, 3);
      ctx.beginPath(); ctx.arc(panelX + 100 + 50 * mx, py - 3.5, 2.5, 0, PI2); ctx.fill();
    }
  });

  // Position label
  label(ctx, `POS ${floor(ex)}, ${floor(ey)}`, w * 0.65, h - 15, 6, 0.2);
}

// 18. AUDIO SPECTRUM
function audioSpectrum(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);

  const bars = 40;
  const barW = (w * 0.8) / bars;
  const baseY = h * 0.6;

  // Cursor frequency band
  const cursorBar = floor(mx * bars);

  for (let i = 0; i < bars; i++) {
    const x = w * 0.1 + i * barW;
    const freq = (sin(i * 0.4 + t * 3) * 0.3 + sin(i * 0.15 + t * 1.5) * 0.4 + 0.3);

    // Boost bars near cursor
    const distFromCursor = abs(i - cursorBar);
    const boost = max(0, 1 - distFromCursor * 0.15) * my * 0.4;
    const barH = (freq + boost) * h * 0.4;
    const isActive = distFromCursor < 3;

    setStyle(ctx, isActive ? 0.2 + boost * 0.3 : 0.08 + freq * 0.1);
    ctx.fillRect(x, baseY - barH, barW - 1, barH);

    // Mirror
    setStyle(ctx, 0.03 + freq * 0.03);
    ctx.fillRect(x, baseY + 2, barW - 1, barH * 0.3);

    // Peak marker for active bars
    if (isActive) {
      setStyle(ctx, 0.3);
      ctx.fillRect(x, baseY - barH - 3, barW - 1, 1.5);
    }
  }

  // Cursor frequency line
  const cursorX = w * 0.1 + mx * w * 0.8;
  setStyle(ctx, 0.12);
  ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(cursorX, h * 0.15); ctx.lineTo(cursorX, baseY + 20); ctx.stroke();
  ctx.setLineDash([]);

  // Frequency labels
  label(ctx, '20Hz', w * 0.1, baseY + 15, 6, 0.15);
  label(ctx, '1kHz', w * 0.4, baseY + 15, 6, 0.15);
  label(ctx, '20kHz', w * 0.82, baseY + 15, 6, 0.15);

  label(ctx, 'FREQUENCY ANALYSIS', w * 0.1, h * 0.1, 8, 0.3);
  label(ctx, `PEAK ${floor(mx * 20000)}Hz`, w * 0.1, h * 0.1 + 14, 7, 0.25);
  label(ctx, `GAIN ${(my * 12).toFixed(1)}dB`, w * 0.1, h * 0.1 + 26, 7, 0.2);

  // dB scale
  for (let i = 0; i <= 4; i++) {
    const y = baseY - (i / 4) * h * 0.4;
    label(ctx, `${-i * 12}dB`, w * 0.02, y + 3, 6, 0.12);
    setStyle(ctx, 0.04);
    ctx.beginPath(); ctx.moveTo(w * 0.09, y); ctx.lineTo(w * 0.9, y); ctx.stroke();
  }
}

// 19. LAYER STACK
function layerStack(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);

  const layers = [
    { name: 'COMP', vis: true, blend: 'NORMAL' },
    { name: 'GRADE', vis: true, blend: 'OVERLAY' },
    { name: 'FX', vis: sin(t) > 0, blend: 'ADD' },
    { name: 'CLEANUP', vis: true, blend: 'NORMAL' },
    { name: 'PAINT', vis: true, blend: 'MULTIPLY' },
    { name: 'PLATE', vis: true, blend: 'NORMAL' },
    { name: 'BG', vis: true, blend: 'NORMAL' },
  ];

  label(ctx, 'LAYER STACK', w * 0.06, 20, 9, 0.4);

  const hoveredLayer = min(layers.length - 1, max(0, floor((my * h - 35) / 24)));
  const isInLayerArea = my * h > 30 && my * h < 35 + layers.length * 24;

  layers.forEach((layer, i) => {
    const y = 35 + i * 24;
    const x = w * 0.06;
    const hover = isInLayerArea && i === hoveredLayer;

    // Hover background
    if (hover) {
      setStyle(ctx, 0.06);
      ctx.fillRect(x - 2, y - 1, w * 0.92, 22);
    }

    dashedRect(ctx, x, y, w * 0.6, 20, hover ? 0.3 : 0.08);

    // Visibility toggle
    label(ctx, layer.vis ? '●' : '○', x + 4, y + 14, 7, layer.vis ? 0.35 : 0.12);
    label(ctx, layer.name, x + 18, y + 14, 7, hover ? 0.55 : 0.25);
    label(ctx, layer.blend, x + w * 0.35, y + 14, 6, hover ? 0.3 : 0.15);

    // Opacity bar — cursor X controls opacity for hovered layer
    const opacity = hover ? mx : sin(t * 0.3 + i) * 0.2 + 0.8;
    setStyle(ctx, 0.06);
    ctx.fillRect(w * 0.7, y + 6, w * 0.2, 4);
    setStyle(ctx, hover ? 0.35 : 0.2);
    ctx.fillRect(w * 0.7, y + 6, w * 0.2 * opacity, 4);

    // Opacity handle on hovered
    if (hover) {
      const handleX = w * 0.7 + w * 0.2 * opacity;
      setStyle(ctx, 0.45);
      ctx.beginPath(); ctx.arc(handleX, y + 8, 3, 0, PI2); ctx.fill();
    }

    label(ctx, `${floor(opacity * 100)}%`, w * 0.92, y + 14, 6, hover ? 0.35 : 0.2);
  });

  // Layer preview thumbnail placeholder
  if (isInLayerArea) {
    const previewY = h * 0.78;
    dashedRect(ctx, w * 0.06, previewY, w * 0.3, h * 0.15, 0.12);
    label(ctx, `PREVIEW: ${layers[hoveredLayer].name}`, w * 0.06, previewY - 5, 7, 0.25);
    cornerBrackets(ctx, w * 0.06, previewY, w * 0.3, h * 0.15, 6, 0.15);
  }
}

// 20. MEASUREMENT TOOL
function measurementTool(ctx, w, h, t, mx, my, state) {
  ctx.clearRect(0, 0, w, h);
  const { smx, smy } = trackMouse(state, mx, my, 0.1);

  // Anchor point
  const ax = w * 0.2, ay = h * 0.3;
  const bx = smx * w, by = smy * h;
  const dist = sqrt((bx - ax) ** 2 + (by - ay) ** 2);
  const angle = atan2(by - ay, bx - ax) * 180 / Math.PI;

  // Main measurement line
  setStyle(ctx, 0.25);
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  ctx.setLineDash([]);

  crosshair(ctx, ax, ay, 8, 0.3);
  crosshair(ctx, bx, by, 10, 0.35);

  // Measurement arc at anchor
  setStyle(ctx, 0.1);
  const arcRadius = min(40, dist * 0.3);
  ctx.beginPath(); ctx.arc(ax, ay, arcRadius, 0, atan2(by - ay, bx - ax)); ctx.stroke();
  label(ctx, `${angle.toFixed(1)}°`, ax + arcRadius + 3, ay - 3, 6, 0.2);

  // Dimension label at midpoint
  const midX = (ax + bx) / 2, midY = (ay + by) / 2;
  // Background for readability
  setStyle(ctx, 0.03);
  ctx.fillRect(midX + 2, midY - 14, 55, 22);
  label(ctx, `${dist.toFixed(1)}px`, midX + 5, midY - 3, 8, 0.4);
  label(ctx, `${angle.toFixed(1)}°`, midX + 5, midY + 10, 7, 0.25);

  // Horizontal/vertical guides
  setStyle(ctx, 0.06);
  ctx.setLineDash([1, 4]);
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, ay); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx, ay); ctx.lineTo(bx, by); ctx.stroke();
  ctx.setLineDash([]);

  // Delta dimension labels
  const dxVal = abs(bx - ax), dyVal = abs(by - ay);
  label(ctx, `Δx ${floor(dxVal)}`, (ax + bx) / 2 - 12, ay - 8, 6, 0.18);
  label(ctx, `Δy ${floor(dyVal)}`, bx + 5, (ay + by) / 2, 6, 0.18);

  // Ruler along top
  setStyle(ctx, 0.06);
  for (let i = 0; i < w; i += 20) {
    const tickH = i % 100 === 0 ? 8 : i % 50 === 0 ? 5 : 3;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, tickH); ctx.stroke();
    if (i % 100 === 0) label(ctx, `${i}`, i + 2, tickH + 8, 5, 0.12);
  }

  // Ruler along left
  for (let i = 0; i < h; i += 20) {
    const tickW = i % 100 === 0 ? 8 : i % 50 === 0 ? 5 : 3;
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(tickW, i); ctx.stroke();
  }

  // Info panel
  label(ctx, 'MEASURE', 10, h - 25, 8, 0.3);
  label(ctx, `A: ${floor(ax)}, ${floor(ay)}`, 10, h - 12, 6, 0.2);
  label(ctx, `B: ${floor(bx)}, ${floor(by)}`, 90, h - 12, 6, 0.2);

  cornerBrackets(ctx, 5, 5, w - 10, h - 10, 8, 0.08);
}

export const visualizations = [
  { name: 'Reticle Tracker', render: reticleTracker, resolution: 500 },
  { name: 'Version Control', render: versionControl, resolution: 500 },
  { name: 'Registration Marks', render: registrationMarks, resolution: 500 },
  { name: 'Signal Processing', render: signalProcessing, resolution: 500 },
  { name: 'AI Status', render: aiStatusPanel, resolution: 500 },
  { name: 'Resolution Grid', render: resolutionGrid, resolution: 500 },
  { name: 'Render Pipeline', render: renderPipeline, resolution: 500 },
  { name: 'Exposure Checker', render: exposureChecker, resolution: 500 },
  { name: 'Focus Plane', render: focusPlane, resolution: 500 },
  { name: 'Timecode', render: timecodeDisplay, resolution: 500 },
  { name: 'Motion Vectors', render: motionVectors, resolution: 500 },
  { name: 'Color Channels', render: colorChannels, resolution: 500 },
  { name: 'Aspect Ratio', render: aspectRatio, resolution: 500 },
  { name: 'Node Graph', render: nodeGraph, resolution: 500 },
  { name: 'System Diagnostics', render: systemDiagnostics, resolution: 500 },
  { name: 'Transform Gizmo', render: transformGizmo, resolution: 500 },
  { name: 'Particle Config', render: particleConfig, resolution: 500 },
  { name: 'Audio Spectrum', render: audioSpectrum, resolution: 500 },
  { name: 'Layer Stack', render: layerStack, resolution: 500 },
  { name: 'Measurement Tool', render: measurementTool, resolution: 500 },
];
